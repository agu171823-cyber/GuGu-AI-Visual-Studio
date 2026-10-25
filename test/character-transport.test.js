"use strict";
const test=require('node:test');const assert=require('node:assert/strict');
const {createImageTransport}=require('../server/image-transport');
const {DEFAULT_SETTINGS}=require('../server/image-api');
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
test('147 text generation omits response_format and accepts a base64 image',async()=>{
  const transport=createImageTransport({fetchImpl:async(url,options)=>{
    assert.match(url,/images\/generations$/);
    const body=JSON.parse(options.body);
    assert.equal(body.model,'gpt-image-2.5-flare');
    assert.equal('response_format' in body,false);
    return Response.json({data:[{b64_json:PNG.split(',')[1]}]});
  }});
  const result=await transport.requestUpstream({...DEFAULT_SETTINGS.providers.default,apiKey:'fake-test-only'},{mode:'imageGenerate',model:'gpt-image-2.5-flare',prompt:'test',size:'1024x1024',quality:'medium'});
  const {extractImageSource}=require('../server/image-api');
  const source=extractImageSource(result.data);
  const image=await transport.readResultBytes(source,'png');
  assert.equal(image.mime,'image/png');
  assert.ok(image.buffer.length>50);
});
for(const providerId of ['default','volc'])for(const entry of DEFAULT_SETTINGS.providers[providerId].models){
  test(`character transport preserves two references with ${entry.id}`,async()=>{
    let calls=0;const transport=createImageTransport({fetchImpl:async(url,options)=>{
      calls++;assert.equal(options.headers.Authorization,'Bearer fake-test-only');
      if(providerId==='volc'){
        assert.match(url,/images\/generations$/);const body=JSON.parse(options.body);assert.deepEqual(body.image,[PNG,PNG]);assert.equal(body.output_format,'png');assert.equal(body.model,entry.id);
        assert.equal(body.quality,undefined);
        if(entry.id.includes('-pro-'))assert.equal(body.optimize_prompt_options.mode,'fast');else assert.equal(body.optimize_prompt_options,undefined);
      }else{
        assert.match(url,/images\/edits$/);assert.ok(options.body instanceof FormData);assert.equal(options.body.getAll('image[]').length,2);assert.equal(options.body.get('model'),entry.id);assert.equal(options.body.get('quality'),'high');assert.equal(options.body.get('output_format'),'png');
      }
      return new Response(JSON.stringify({data:[{b64_json:PNG.split(',')[1]}]}),{headers:{'x-request-id':'fixture'}});
    }});
    const result=await transport.requestUpstream({...DEFAULT_SETTINGS.providers[providerId],apiKey:'fake-test-only'},{mode:'characterStudio',model:entry.id,prompt:'identity',size:'2048x2048',image:PNG,referenceImages:[PNG],quality:'high',outputFormat:'png',promptOptimization:'fast',noRetry:true});
    assert.equal(calls,1);assert.equal(result.requestId,'fixture');
  });
}
test('character requests never automatically resubmit a 429 or a network failure',async()=>{
  for(const network of [false,true]){
    let count=0;const t=createImageTransport({fetchImpl:async()=>{count++;if(network)throw new Error('offline');return new Response('{"error":{"message":"rate limited"}}',{status:429});}});
    await assert.rejects(t.requestUpstream({...DEFAULT_SETTINGS.providers.default,apiKey:'fake'},{mode:'characterStudio',model:'gpt-image-2.5-flare',prompt:'test',size:'1024x1024',image:PNG,noRetry:true}));assert.equal(count,1);
  }
});
test('candidate bytes can stay in memory and reject local/private result URLs',async()=>{
  const t=createImageTransport({fetchImpl:async()=>{throw new Error('must not access network');}});
  const result=await t.readResultBytes(PNG,'png');assert.equal(result.mime,'image/png');assert.ok(result.buffer.length>50);
  await assert.rejects(t.readResultBytes('https://127.0.0.1/secret','png'),/不安全/);
  await assert.rejects(t.readResultBytes('http://example.test/file.png','png'),/不安全/);
});
