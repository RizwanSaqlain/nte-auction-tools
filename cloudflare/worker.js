import contact from '../api/contact.js';

async function errorPage(request,env,status){
  const url=new URL(request.url);url.pathname=`/${status}.html`;
  const asset=await env.ASSETS.fetch(new Request(url,{method:'GET'}));
  const headers=new Headers(asset.headers);headers.set('X-Robots-Tag','noindex');headers.set('Cache-Control','no-store');
  return new Response(request.method==='HEAD'?null:asset.body,{status,headers});
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(['nteauctiontools.com','www.nteauctiontools.com'].includes(url.hostname) && (url.protocol!=='https:' || url.hostname!=='nteauctiontools.com')){
      url.protocol='https:';url.hostname='nteauctiontools.com';url.port='';
      return Response.redirect(url.href,301);
    }
    try{
      if(url.pathname==='/api/contact'){
        let body=null;
        if(request.method==='POST'){
          if(request.headers.get('Origin')!==url.origin)return Response.json({error:'Please use our Contact Us page.'},{status:403});
          if(!request.headers.get('Content-Type')?.includes('application/json'))return Response.json({error:'Expected a JSON form submission.'},{status:415});
          const reader=request.body?.getReader();let size=0;const chunks=[];
          if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();return Response.json({error:'Your message is too long.'},{status:413});}chunks.push(value);}
          const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
          try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{return Response.json({error:'Please complete the contact form.'},{status:400});}
        }
        const headers=new Headers();let status=200;
        const res={setHeader(key,value){headers.set(key,value);},status(value){status=value;return this;},json(data){headers.set('Content-Type','application/json');return new Response(JSON.stringify(data),{status,headers});}};
        return await contact({method:request.method,headers:Object.fromEntries(request.headers),body},res,{recipient:env.CONTACT_EMAIL,origin:url.origin});
      }
      if(/^\/500(?:\.html)?\/?$/.test(url.pathname))return await errorPage(request,env,500);
      if(/^\/404(?:\.html)?\/?$/.test(url.pathname))return await errorPage(request,env,404);
      const response=await env.ASSETS.fetch(request);
      if(response.status===404)return await errorPage(request,env,404);
      return response;
    }catch{
      console.error('Request failed',JSON.stringify({path:url.pathname}));
      try{return await errorPage(request,env,500);}catch{return new Response('Service temporarily unavailable',{status:500});}
    }
  }
};
