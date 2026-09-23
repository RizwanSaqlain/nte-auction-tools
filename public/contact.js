const form=document.getElementById('contact-form');
const status=document.getElementById('contact-status');
form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const button=document.getElementById('contact-send');button.disabled=true;button.textContent='Sending…';status.textContent='Sending your message…';
  const data=Object.fromEntries(new FormData(form));data.consent=form.elements.consent.checked;
  try{
    const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'Please try again later.');
    status.textContent=result.message;form.reset();
  }catch(error){status.textContent=error.message||'Could not send your message. Please try again.';}
  finally{button.disabled=false;button.textContent='Send Message';}
});
