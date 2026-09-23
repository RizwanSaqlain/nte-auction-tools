const topics=new Set(['Calculator issue','Catalog correction','Suggestion','Privacy request','Rights-holder request','Other']);
export default async function handler(req,res,settings={recipient:process.env.CONTACT_EMAIL,origin:'https://nte-auction-companion.vercel.app'}){
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Use the contact form to send a message.'});}
  if(req.headers.origin!==settings.origin)return res.status(403).json({error:'Please send your message from our Contact Us page.'});
  if(Number(req.headers['content-length'])>16000)return res.status(413).json({error:'Your message is too long.'});
  const data=req.body;
  if(!data||typeof data!=='object'||Array.isArray(data))return res.status(400).json({error:'Please complete the contact form.'});
  if(data.website)return res.status(400).json({error:'Please reload the contact form and try again.'});
  const {name,email,topic,message}=data;
  if(typeof name!=='string'||name.trim().length<2||name.length>100||typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!topics.has(topic)||typeof message!=='string'||message.trim().length<20||message.length>5000||data.consent!==true)return res.status(400).json({error:'Enter your name, a valid email, a topic, and a message of 20–5,000 characters. Acknowledge the privacy notice.'});
  const recipient=settings.recipient?.trim();
  if(!recipient)return res.status(503).json({error:'Contact delivery is temporarily unavailable. Please try again later.'});
  try{
    const upstream=await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Origin:settings.origin,Referer:settings.origin+'/contact-us'},body:JSON.stringify({name:name.trim(),email:email.trim(),message:message.trim(),topic,_subject:`NTE Auction Tools: ${topic}`,_url:settings.origin+'/contact-us',_template:'table'}),signal:AbortSignal.timeout(8000)});
    const result=await upstream.json();
    if(!upstream.ok||!(result.success===true||result.success==='true'))console.error('Contact provider rejection',JSON.stringify({status:upstream.status,message:String(result.message||'').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[redacted]').slice(0,500)}));
    if(upstream.status===429){res.setHeader('Retry-After',upstream.headers.get('Retry-After')||'60');return res.status(429).json({error:'The email service is temporarily rate-limiting requests. Please wait a few minutes before trying again. Your message is still in the form.',code:'delivery_rate_limited'});}
    if(typeof result.message==='string' && /needs activation/i.test(result.message))return res.status(503).json({error:'The contact form is awaiting inbox activation by the site owner. Please try again after activation. Your message has not been confirmed as delivered.',code:'activation_required'});
    if(!upstream.ok||!(result.success===true||result.success==='true'))return res.status(502).json({error:'The delivery service could not accept your message. Please try again later.'});
    return res.status(200).json({message:'Your message was accepted by our delivery service. Thank you for contacting NTE Auction Tools.'});
  }catch{return res.status(502).json({error:'The delivery service is unavailable. Please try again later. Your message is still in the form.'});}
}
