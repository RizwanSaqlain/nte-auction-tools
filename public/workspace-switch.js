(()=>{
const tool=document.getElementById('view-tool'),catalog=document.getElementById('view-catalog'),select=document.getElementById('workspace-device'),gold=document.getElementById('goldForm'),nine=document.querySelector('.workspace'),area=document.getElementById('gold-area');
let device=nine?(new URLSearchParams(location.search).get('device')==='gold'?'gold':'nine'):'gold';
let currentView='tool';
function show(view,save=true){
 currentView=view;const isCatalog=view==='catalog',isGold=device==='gold';tool.setAttribute('aria-pressed',String(!isCatalog));catalog.setAttribute('aria-pressed',String(isCatalog));
 if(nine){nine.hidden=isGold||isCatalog;document.getElementById('catalog').hidden=isGold||!isCatalog;document.getElementById('catalogItems').hidden=isGold||!isCatalog;area.hidden=!isGold;select.value=isGold?'/gold-rarity':'/';const title=document.querySelector('#solver h2');title.lastChild.textContent=isGold?'Gold-rarity Valuation Device':'Nine-slot Average Valuation Device';title.querySelector('img').src=isGold?'/gold-device.png':'/nine-slot-device.png';document.querySelector('#workspace-switch>img').src=isGold?'/gold-device.png':'/nine-slot-device.png';}
 if(gold&&isGold){for(const child of gold.children)child.hidden=isCatalog&&!child.classList.contains('gold-known');gold.querySelector('.gold-known').open=isCatalog;for(const id of ['goldStatus','goldResults','goldPagination']){const el=document.getElementById(id);if(isCatalog){if(el.dataset.viewHidden===undefined)el.dataset.viewHidden=String(el.hidden);el.hidden=true;}else if(el.dataset.viewHidden!==undefined){el.hidden=el.dataset.viewHidden==='true';delete el.dataset.viewHidden;}}}
 if(save){const url=new URL(location.href);if(nine){if(isGold)url.searchParams.set('device','gold');else url.searchParams.delete('device');}if(isCatalog)url.searchParams.set('view','catalog');else url.searchParams.delete('view');history.replaceState(null,'',url);}
}
tool.onclick=()=>show('tool');catalog.onclick=()=>show('catalog');select.onchange=()=>{if(!nine){location.href='/?device='+(select.value==='/gold-rarity'?'gold':'nine')+'#workspace-switch';return;}device=select.value==='/gold-rarity'?'gold':'nine';show(currentView);};
document.addEventListener('click',event=>{const link=event.target.closest('a');if(nine&&link?.getAttribute('href')==='/?device=gold#workspace-switch'){event.preventDefault();device='gold';show('tool');document.getElementById('workspace-switch').scrollIntoView();}});
show(new URLSearchParams(location.search).get('view')==='catalog'||location.hash==='#catalog'?'catalog':'tool',false);
addEventListener('hashchange',()=>{if(location.hash==='#catalog')show('catalog');else if(location.hash==='#solver')show('tool');});
})();
