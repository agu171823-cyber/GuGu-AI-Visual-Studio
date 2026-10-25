import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { createRequire } from 'node:module';
import { unzipSync } from 'fflate';
import { createCharacterService } from '../server/embedded';
import { MODEL_CHANNELS } from '../shared/gugu';
import { PNG_BASE64 } from './helpers/server-fixture';
const require=createRequire(import.meta.url);
const { sizeFor }=require('../../../public/image-generation.js');
const roots:string[]=[];
afterEach(async()=>{await Promise.all(roots.splice(0).map(root=>rm(root,{recursive:true,force:true})));});
async function fixture() {
  const root=await mkdtemp(join(tmpdir(),'gugu-character-'));roots.push(root);
  const calls:any[]=[];
  const service=createCharacterService({projectRoot:root,sizeFor,getOptions:()=>({providers:Object.fromEntries(['default','volc'].map(id=>[id,{label:id,configured:true,models:Object.entries(MODEL_CHANNELS).filter(([,c])=>c===id).map(([id])=>({id,label:id}))}]))}),generate:async input=>{calls.push(input);return {imageB64:PNG_BASE64,provider:input.providerId!,model:input.model,size:input.size,latencyMs:1};}});
  const request=(path:string,body?:any)=>service.fetch(new Request('http://localhost:8797/api/character'+path,body===undefined?{}:body instanceof FormData?{method:'POST',body}:{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}));
  async function project(mode='human-model-card'){return (await request('/projects',{mode,title:'Fixture',displayName:'Fixture'})).json();}
  async function generate(p:any,role:string,refs:string[],extra:any={}){
    const form=new FormData();const model=extra.model||'gpt-image-2.5-flare';
    const change=extra.changeSet||{category:'identity',instruction:'建立成年角色参考',sourceStateId:'base',targetStateId:'base'};
    for(const [key,value] of Object.entries({projectId:p.id,versionId:extra.versionId||'v1',assetRole:role,providerId:MODEL_CHANNELS[model],model,resolution:'2K',quality:'medium',clientRequestId:crypto.randomUUID(),adultConsent:'true',rightsConsent:'true',changeSet:JSON.stringify(change),referenceAssetIds:JSON.stringify(refs),...(extra.parentAssetId?{parentAssetId:extra.parentAssetId}:{})}))form.set(key,String(value));
    if(role==='face-front'&&!refs.length){form.append('image',new File([Buffer.from(PNG_BASE64,'base64')],'private-original.png',{type:'image/png'}));form.append('imageRole','face-front');}
    const response=await request('/generate',form);expect(response.status).toBe(202);const task=await response.json();
    const repeat=await request('/generate',form);expect((await repeat.json()).id).toBe(task.id);
    for(let i=0;i<300;i++){const current=await (await request('/tasks/'+task.id)).json();if(current.status!=='running')return {...current,form};await new Promise(r=>setTimeout(r,2));}
    throw new Error('Task did not finish');
  }
  async function accept(p:any,task:any){expect(task.status,task.error).toBe('succeeded');const r=await request(`/projects/${p.id}/assets`,{candidateId:task.id});expect(r.status,await r.clone().text()).toBe(201);return r.json();}
  return {root,calls,service,request,project,generate,accept};
}
describe('Gugu integrated character service',()=>{
  for (const [model, expectedSize] of [
    ['gpt-image-2.5-flare', '1344x2016'],
    ['doubao-seedream-5-0-flash-260915', '1664x2496'],
  ] as const) it(`generates 微侧半身 at the same size as 中性半身 with ${model}`, async () => {
    const f = await fixture();
    const p = await f.project();
    const face = await f.accept(p, await f.generate(p, 'face-front', [], { model }));
    const body = await f.accept(p, await f.generate(p, 'body-front', [face.id], { model }));
    const refs = [face.id, body.id];
    const slight = await f.generate(p, 'face-three-quarter', refs, { model });
    const neutral = await f.generate(p, 'half-neutral', refs, { model });
    expect(slight.result.recipeDraft.size).toBe(expectedSize);
    expect(neutral.result.recipeDraft.size).toBe(expectedSize);
    expect(slight.result.recipeDraft.templateId).toBe('face-three-quarter-v2');
    expect(f.calls.at(-2).prompt).toContain('微侧半身');
    expect(f.calls.at(-2).prompt).toContain('腰部以上');
  });
  for(const model of Object.keys(MODEL_CHANNELS))it(`generates and approves with ${model}, preserving provenance`,async()=>{
    const f=await fixture();const p=await f.project();const task=await f.generate(p,'face-front',[],{model});
    expect(f.calls).toHaveLength(1);expect(f.calls[0].apiKey).toBe('');expect(task.result.recipeDraft.provider).toBe(MODEL_CHANNELS[model]);
    expect((await f.request('/projects/'+p.id).then(r=>r.json())).assets).toHaveLength(0);
    const a=await f.accept(p,task);expect(a.recipe.model).toBe(model);expect(a.recipe.size).toBe('2048x2048');
    const again=await f.accept(p,task);expect(again.id).toBe(a.id);
    const manifest=await readFile(join(f.root,p.id,'project.json'),'utf8');expect(manifest).not.toContain('private-original');expect(manifest).not.toContain('promptPreview');
    expect(await readdir(join(f.root,p.id,'assets'))).toEqual([basename(a.fileName)]);
  });
  for(const mode of ['human-model-card','realistic-virtual-character'])it(`completes ${mode}: anchors, reviews, derivatives, export, reopen and v2`,async()=>{
    const f=await fixture();const p=await f.project(mode);const assets:any[]=[];
    for(const role of ['face-front','body-front','face-three-quarter','body-side','body-back','half-neutral']){
      const refs=role==='face-front'?[]:role==='body-front'?[assets[0].id]:[assets[0].id,assets[1].id];assets.push(await f.accept(p,await f.generate(p,role,refs)));
    }
    expect((await f.request(`/projects/${p.id}/transitions`,{action:'lock-version',versionId:'v1'})).status).toBe(400);
    for(const [role,category] of [['stress-lighting','lighting'],['stress-angle','camera'],['stress-action','action']]){
      const task=await f.generate(p,role,[assets[0].id,assets[1].id],{parentAssetId:assets[0].id,changeSet:{category,instruction:'单变量一致性测试',sourceStateId:'base',targetStateId:role}});
      expect(f.calls.at(-1).images).toHaveLength(2);const a=await f.accept(p,task);
      expect((await f.request(`/projects/${p.id}/transitions`,{action:'review-stress',versionId:'v1',role,assetId:a.id,passed:true})).status).toBe(200);
    }
    expect((await f.request(`/projects/${p.id}/transitions`,{action:'lock-version',versionId:'v1'})).status).toBe(200);
    const roles=mode==='human-model-card'?['model-card-natural','model-card-half','model-card-full','model-card-side-action']:Array(6).fill('expression');
    roles.push('wardrobe-state','action-reference');
    for(const [index,role] of roles.entries()){
      const category=role==='expression'?'expression':role==='wardrobe-state'?'wardrobe':role==='action-reference'?'action':'camera';
      const parent=role==='expression'?assets[5]:assets[1];
      const refs=[...new Set([assets[0].id,assets[1].id,parent.id])];
      const task=await f.generate(p,role,refs,{parentAssetId:parent.id,changeSet:{category,instruction:'仅改变目标状态',sourceStateId:'base',targetStateId:`state-${index}`}});
      await f.accept(p,task);
    }
    for(let i=0;i<2;i++){
      const response=await f.request(`/projects/${p.id}/exports`,{kind:'model-pack',versionId:'v1'});expect(response.status,await response.clone().text()).toBe(201);
      const output=await response.json();const zip=await f.service.fetch(new Request('http://localhost:8797'+output.downloadUrl));const entries=unzipSync(new Uint8Array(await zip.arrayBuffer()));expect(Object.keys(entries)).toHaveLength(8);expect(entries['face-front.png']).toBeTruthy();expect(entries['slight-side-half.png']).toBeTruthy();
    }
    const reopened=await (await f.request('/projects/'+p.id)).json();expect(reopened.versions[0].status).toBe('locked');
    const next=await (await f.request(`/projects/${p.id}/transitions`,{action:'create-version'})).json();expect(next.currentVersionId).toBe('v2');expect(next.versions[0].status).toBe('locked');
    const invalid=await f.generate(p,'body-front',[assets[0].id],{versionId:'v2'});expect(invalid.status).toBe('failed');
    const inherited=await f.generate(p,'face-front',[assets[0].id],{versionId:'v2'});await f.accept(p,inherited);
    // Import only manifests and approved assets into an independent root.
    const source=await f.service.registry.readProject(p.id);const form=new FormData();form.append('files',new File([JSON.stringify(source)],'project.json'));
    for(const a of source.assets)form.append('files',new File([new Uint8Array(await readFile(join(f.root,p.id,a.fileName!)))],basename(a.fileName!)));
    const imported=await fixture();const importResponse=await imported.request('/import',form);expect(importResponse.status,await importResponse.clone().text()).toBe(201);
    expect((await imported.request('/import',form)).status).toBe(409);
    expect((await imported.service.registry.readProject(p.id)).assets).toHaveLength(source.assets.length);
  });
  it('rejects cross-origin, untrusted approval payloads and wrong model channel without generation',async()=>{
    const f=await fixture();const p=await f.project();
    const cross=await f.service.fetch(new Request('http://localhost:8797/api/character/projects',{method:'POST',headers:{origin:'https://other.example'},body:'{}'}));expect(cross.status).toBe(403);
    expect((await f.request(`/projects/${p.id}/assets`,{imageB64:PNG_BASE64,recipe:{}})).status).toBe(400);
    const task=await f.generate(p,'body-front',[]);expect(task.status).toBe('failed');expect(f.calls).toHaveLength(0);
  });
});
