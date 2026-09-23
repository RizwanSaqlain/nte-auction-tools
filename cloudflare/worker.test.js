import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.js';
const origin='https://nte-auction-tools.nte-auction-tools.workers.dev';
test('canonical redirects preserve paths and clue queries without loops',async()=>{
  for(const base of ['http://nteauctiontools.com','http://www.nteauctiontools.com','https://www.nteauctiontools.com']){
    const response=await worker.fetch(new Request(base+'/contact-us?average=260423'),{});
    assert.equal(response.status,301);
    assert.equal(response.headers.get('Location'),'https://nteauctiontools.com/contact-us?average=260423');
  }
  assert.equal((await worker.fetch(new Request('https://nteauctiontools.com/'),env)).status,200);
});
const env={ASSETS:{async fetch(request){const path=new URL(request.url).pathname;return new Response(`<h1>${path}</h1>`,{status:path==='/missing'?404:200,headers:{'Content-Type':'text/html'}});}}};
test('Cloudflare serves assets and correct custom error status codes',async()=>{
  for(const [path,status] of [['/',200],['/missing',404],['/404',404],['/500',500]]){const r=await worker.fetch(new Request(origin+path),env);assert.equal(r.status,status);if(status>=400){assert.equal(r.headers.get('X-Robots-Tag'),'noindex');assert((await r.text()).includes(`/${status}.html`));}}
});
test('contact rejects wrong method, foreign origins, invalid JSON, and large payloads',async()=>{
  assert.equal((await worker.fetch(new Request(origin+'/api/contact'),env)).status,405);
  for(const [headers,body,status] of [[{Origin:'https://example.org','Content-Type':'application/json'},'{}',403],[{Origin:origin,'Content-Type':'application/json'},'{bad',400],[{Origin:origin,'Content-Type':'application/json'},'x'.repeat(16001),413],[{Origin:origin,'Content-Type':'application/json'},'{}',400]]){assert.equal((await worker.fetch(new Request(origin+'/api/contact',{method:'POST',headers,body}),env)).status,status);}
});
test('contact does not expose secrets when delivery is unavailable',async()=>{
  const body={name:'Test Appraiser',email:'appraiser@example.com',topic:'Other',message:'A valid message for local validation only.',consent:true};
  const result=await worker.fetch(new Request(origin+'/api/contact',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}),env);
  assert.equal(result.status,503);assert.equal(result.headers.get('Cache-Control'),'no-store');
});
test('contact sends trusted origin headers and reports pending activation',async t=>{
  const body={name:'Test Appraiser',email:'appraiser@example.com',topic:'Other',message:'A valid message for local validation only.',consent:true};
  let activated=false;
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.equal(options.headers.Origin,origin);
    assert.equal(options.headers.Referer,origin+'/contact-us');
    assert.equal(url,'https://formsubmit.co/ajax/owner%40example.com');
    return Response.json(activated?{success:'true'}:{success:'false',message:'This form needs Activation.'});
  });
  const send=()=>worker.fetch(new Request(origin+'/api/contact',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}),{...env,CONTACT_EMAIL:'owner@example.com\n'});
  const pending=await send();assert.equal(pending.status,503);assert.equal((await pending.json()).code,'activation_required');
  activated=true;assert.equal((await send()).status,200);
});
