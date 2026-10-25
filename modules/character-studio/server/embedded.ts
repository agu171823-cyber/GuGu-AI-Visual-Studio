import { getRequestListener } from '@hono/node-server';
import { randomUUID } from 'node:crypto';
import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { join, resolve, basename } from 'node:path';
import { zipSync } from 'fflate';
import { createApp } from './app';
import { createProjectRegistry } from './storage/project-registry';
import { assembleModelPack } from './export/model-pack';
import { validateCharacterProject } from '../shared/project-schema';
import { MODEL_CHANNELS } from '../shared/gugu';
import type { ImageProvider, EditImageInput } from './providers/provider';
import type { ImageSize } from '../shared/contracts';

type Options = {providers:Record<string,{label:string;configured:boolean;models:{id:string;label:string}[]}>};
export type Dependencies = {projectRoot:string;getOptions:()=>Options;generate:ImageProvider['editImage'];sizeFor:(model:string,ratio:string,tier:string)=>string};
type Task = {id:string;status:'running'|'succeeded'|'failed';created:number;projectId:string;versionId:string;role:string;parentAssetId?:string;result?:any;error?:string;accepted?:any;accepting?:Promise<any>};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function limitedForm(request:Request, limit:number):Promise<FormData> {
  const reader=request.body?.getReader();if(!reader)throw new Error('请求体为空');
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>limit){await reader.cancel();throw new Error('请求体过大');}chunks.push(part.value);}
  return new Response(Buffer.concat(chunks),{headers:{'content-type':request.headers.get('content-type')||''}}).formData();
}

export function createCharacterService(deps:Dependencies) {
  const registry = createProjectRegistry(deps.projectRoot);
  const tasks = new Map<string,Task>();
  const requestIds = new Map<string,string>();
  const provider:ImageProvider = {validateKey:async()=>({valid:true,modelAvailable:true}),editImage:deps.generate};
  const app=createApp({projectRoot:deps.projectRoot,projectRegistry:registry,provider,integration:{resolve(form,role){
    const providerId=String(form.get('providerId'));
    const model=String(form.get('model'));
    const resolution=String(form.get('resolution'));
    const quality=String(form.get('quality') ?? 'medium');
    if(!['default','volc'].includes(providerId) || MODEL_CHANNELS[model]!==providerId) throw new Error('图片渠道或模型无效');
    const configured=deps.getOptions().providers[providerId];
    if(!configured?.configured || !configured.models.some(m=>m.id===model)) throw new Error('所选渠道尚未配置或模型不可用');
    if(!(providerId==='volc'?['1K','1.5K','2K']:['1K','2K','4K']).includes(resolution)) throw new Error('分辨率无效');
    if(!['medium','high'].includes(quality)) throw new Error('画质无效');
    const ratio=['expression','face-front'].includes(role)?'1:1':'2:3';
    return {providerId:providerId as 'default'|'volc',model,size:deps.sizeFor(model,ratio,resolution) as ImageSize,quality:providerId==='volc'?'medium':quality as 'medium'|'high',promptOptimization:form.get('promptOptimization')==='fast'?'fast':'standard'};
  }}});

  async function fetchHandler(request:Request):Promise<Response> {
    const url=new URL(request.url);
    const route=url.pathname.replace(/^\/api\/character(?=\/)/,'/api');
    if(request.headers.get('sec-fetch-site')==='cross-site') return json({error:'拒绝跨站请求'},403);
    const origin=request.headers.get('origin');
    if(origin && origin!==url.origin) return json({error:'请求来源无效'},403);
    try {
      if(route==='/api/options' && request.method==='GET') return json(deps.getOptions());
      if(route==='/api/validate-key') return json({error:'请使用 Gugu 接口设置'},404);
      // Candidates remain in memory only. Expired tasks never cause automatic resubmission.
      for(const [id,t] of tasks) if(t.status!=='running' && Date.now()-t.created>2*60*60*1000) tasks.delete(id);
      for(const [key,id] of requestIds) if(!tasks.has(id)) requestIds.delete(key);
      const taskMatch=/^\/api\/tasks\/([\da-f-]+)$/.exec(route);
      if(taskMatch && request.method==='DELETE') {
        const task=tasks.get(taskMatch[1]);
        if(task?.status==='running') return json({error:'生成中的任务不能丢弃'},409);
        tasks.delete(taskMatch[1]);return json({discarded:true});
      }
      if(taskMatch && request.method==='GET') {
        const task=tasks.get(taskMatch[1]);
        return task?json({id:task.id,status:task.status,result:task.result,error:task.error}):json({error:'候选任务已过期或服务已重启。请先核对上游任务，再手动生成。'},404);
      }
      if(route==='/api/generate' && request.method==='POST') {
        if(Number(request.headers.get('content-length'))>64*1024*1024) return json({error:'请求体过大'},413);
        const form=await limitedForm(request,64*1024*1024);
        const key=String(form.get('clientRequestId')||'');
        if(!/^[\da-f-]{36}$/.test(key)) return json({error:'请求标识无效'},400);
        const existing=requestIds.get(key);
        if(existing) return json({id:existing},202);
        const pending=[...tasks.values()].filter(t=>!t.accepted && t.status!=='failed');
        if(pending.filter(t=>t.status==='running').length>=8 || pending.reduce((n,t)=>n+(t.result?.imageB64?.length||0),0)>192*1024*1024) return json({error:'待审核图片过多，请先接受已有结果或重新打开工作区'},429);
        const task:Task={id:randomUUID(),status:'running',created:Date.now(),projectId:String(form.get('projectId')),versionId:String(form.get('versionId')),role:String(form.get('assetRole')),parentAssetId:String(form.get('parentAssetId')||'')||undefined};
        tasks.set(task.id,task);requestIds.set(key,task.id);
        const upstreamUrl=new URL(request.url);upstreamUrl.pathname='/api/generate';
        const internal=new Request(upstreamUrl,{method:'POST',body:form});
        void Promise.resolve(app.fetch(internal)).then(async response=>{
          const payload=await response.json() as any;
          if(!response.ok) throw new Error(payload.error || '图片生成失败');
          task.result=payload;task.status='succeeded';
        }).catch(error=>{task.status='failed';task.error=error instanceof Error?error.message:'图片生成失败';});
        return json({id:task.id},202);
      }
      const accept=/^\/api\/projects\/(project-[a-f0-9]{12})\/assets$/.exec(route);
      if(accept && request.method==='POST') {
        const body=await request.json() as {candidateId?:string};
        if(Object.keys(body).some(k=>k!=='candidateId')) return json({error:'仅能接受服务端生成的候选图'},400);
        const task=tasks.get(String(body.candidateId));
        if(!task || task.projectId!==accept[1] || task.status!=='succeeded') return json({error:'候选图不存在或已过期'},400);
        if(task.accepted) return json(task.accepted,201);
        if(!task.accepting) task.accepting=(async()=>{
          const recipe=task.result.recipeDraft;
          const asset=await registry.saveApprovedAsset({projectId:task.projectId,versionId:task.versionId,assetRole:task.role as any,stateId:recipe.changeSet.targetStateId,parentAssetId:task.parentAssetId,imageB64:task.result.imageB64,recipe});
          task.accepted=asset;task.result=undefined;return asset;
        })().catch(error=>{task.accepting=undefined;throw error;});
        return json(await task.accepting,201);
      }
      const exportMatch=/^\/api\/projects\/(project-[a-f0-9]{12})\/exports$/.exec(route);
      if(exportMatch && request.method==='POST') {
        const body=await request.json() as any;
        if(body.kind!=='model-pack' || typeof body.versionId!=='string') return json({error:'导出参数无效'},400);
        const batch='export-'+randomUUID();
        const pack=await assembleModelPack({projectId:exportMatch[1],versionId:body.versionId,includeBodyOnly:false},registry,join(deps.projectRoot,exportMatch[1],'exports',batch));
        const entries:Record<string,Uint8Array>={};
        for(const file of pack.relativeFiles) entries[file]=new Uint8Array(await readFile(join(pack.directory,file)));
        const filename=batch+'.zip';
        await writeFile(join(deps.projectRoot,exportMatch[1],'exports',filename),zipSync(entries));
        return json({exportId:pack.exportId,kind:pack.kind,relativeFiles:pack.relativeFiles,downloadUrl:`/api/character/projects/${exportMatch[1]}/exports/${filename}`},201);
      }
      const download=/^\/api\/projects\/(project-[a-f0-9]{12})\/exports\/(export-[a-f0-9-]+\.zip)$/.exec(route);
      if(download && request.method==='GET') return new Response(new Uint8Array(await readFile(join(deps.projectRoot,download[1],'exports',download[2]))),{headers:{'content-type':'application/zip','content-disposition':`attachment; filename="${download[2]}"`,'cache-control':'no-store'}});
      if(route==='/api/import' && request.method==='POST') {
        const form=await limitedForm(request,128*1024*1024);
        const files=form.getAll('files').filter((f):f is File=>f instanceof File);
        const manifest=files.find(f=>f.name==='project.json');
        if(!manifest || manifest.size>8*1024*1024 || files.length>500) return json({error:'请选择包含 project.json 和 assets 的单个项目目录'},400);
        const project=JSON.parse(await manifest.text());
        const checked=validateCharacterProject(project);
        if(checked.length || !/^project-[a-f0-9]{12}$/.test(project.id)) return json({error:'项目结构无效，无法导入'},400);
        const target=join(deps.projectRoot,project.id);
        try {await readFile(join(target,'project.json'));return json({error:'该项目已存在，不会覆盖'},409);} catch(e:any){if(e.code!=='ENOENT')throw e;}
        const staging=join(deps.projectRoot,'.import-'+randomUUID());
        await mkdir(join(staging,'assets'),{recursive:true});
        try {
          for(const asset of project.assets){
            if(!asset.fileName || !new RegExp(`^assets/${asset.id}\\.(png|jpg)$`).test(asset.fileName)) throw new Error('资产文件名无效');
            const file=files.find(f=>f.name===basename(asset.fileName));
            if(!file || file.size>30*1024*1024) throw new Error('缺少资产文件或资产过大');
            const bytes=Buffer.from(await file.arrayBuffer());
            const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
            const jpg=bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
            if(!png&&!jpg) throw new Error('资产图片格式无效');
            await writeFile(join(staging,'assets',basename(asset.fileName)),bytes,{flag:'wx'});
          }
          await writeFile(join(staging,'project.json'),JSON.stringify(project,null,2));
          await rename(staging,target);
          return json(await registry.readProject(project.id),201);
        } catch(error){await rm(staging,{recursive:true,force:true});throw error;}
      }
      url.pathname=route;
      return await app.fetch(new Request(url,request));
    } catch(error:any){return json({error:error.code==='ENOENT'?'文件不存在':error.message||'角色工作室请求失败'},400);}
  }
  return {fetch:fetchHandler,listener:getRequestListener(fetchHandler),registry};
}
