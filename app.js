import { ITEMS, findBundles, summarize } from './src/engine.js';
const $=id=>document.getElementById(id);
const fmt=new Intl.NumberFormat('en-US',{maximumFractionDigits:2});
const number=n=>fmt.format(n);
const signed=n=>(n>0?'+':'')+number(n);
let bundles=[],matches=[],activeSize=0,hasSearched=false,page=1,undoState=null;
const pageSize=8;

const imageFor=name=>ITEMS.find(i=>i.name===name);
function setSize(size){activeSize=size;document.querySelectorAll('[data-size]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.size)===size)));}
function readNumber(id){
  const raw=$(id).value.trim();
  if(!raw)return null;
  if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(raw)||!Number.isFinite(Number(raw.replaceAll(',','')))||Number(raw.replaceAll(',',''))>1e12) throw {id,message:'Enter a non-negative number up to 1 trillion, such as 18,166.5.'};
  return Number(raw.replaceAll(',',''));
}
function criteria(){return {average:readNumber('average'),tolerance:Number($('tolerance').value),size:activeSize,};}
function state(){return {average:$('average').value,tolerance:$('tolerance').value,size:activeSize,bid:$('bid').value,margin:$('margin').value,sort:$('sort').value,searched:hasSearched,page};}
function syncUrl(){
  const s=state(),u=new URL(location.href);u.search='';
  for(const key of ['average','bid'])if(s[key])u.searchParams.set(key,s[key]);
  if(s.size)u.searchParams.set('size',s.size);
  if(s.tolerance!=='2')u.searchParams.set('tolerance',s.tolerance);
  if(s.margin!=='10')u.searchParams.set('margin',s.margin);
  if(s.sort!=='closest')u.searchParams.set('sort',s.sort);
  if(s.searched)u.searchParams.set('search','1');
  if(s.page>1)u.searchParams.set('page',s.page);
  history.replaceState(null,'',u);
}
function restore(s){
  for(const key of ['average','bid'])$(key).value=String(s[key]||'').slice(0,40);
  $('tolerance').value=['0','1','2','5','10'].includes(String(s.tolerance))?String(s.tolerance):'2';
  $('margin').value=Number.isFinite(Number(s.margin))?Math.max(0,Math.min(50,Number(s.margin))):10;
  $('sort').value=['closest','low','high','size'].includes(s.sort)?s.sort:'closest';
  setSize([1,2,3,4,5,6,7].includes(Number(s.size))?Number(s.size):0);
  hasSearched=Boolean(s.searched);page=Math.max(1,Math.floor(Number(s.page)||1));
}
function resetStats(){$('minStat').textContent='—';}
function clearError(){ $('errors').textContent=''; for(const id of ['average'])$(id).removeAttribute('aria-invalid'); }
function search({focusError=true,keepPage=false}={}){
  clearError();
  if(!bundles.length){$('errors').textContent='The bundle data has not loaded. Reload this page to retry.';return;}
  try{
    const c=criteria();
    if(c.average===null)throw {id:'average',message:'Enter the gadget’s average 9-slot value to find matching collectibles.'};
    matches=findBundles(bundles,c);hasSearched=true;if(!keepPage)page=1;
    render();syncUrl();
  }catch(e){
    const field=$(e.id);$('errors').textContent=e.message;field?.setAttribute('aria-invalid','true');if(field?.closest('details'))field.closest('details').open=true;if(focusError)field?.focus();
    matches=[];hasSearched=false;resetStats();$('matchCount').textContent='—';$('matchBadge').textContent='Check Clues';$('resultDescription').textContent='Fix the highlighted clue to see matching bundles.';$('results').innerHTML='<div class="empty"><h4>Check Your Clue Values</h4><p>Correct the input error, then find bundles again.</p></div>';$('pagination').hidden=true;renderBid();
  }
}
function render(){
  const summary=summarize(matches);$('matchCount').textContent=number(matches.length);
  $('matchBadge').textContent=matches.length===1?'One Matching Bundle':matches.length?'Reading Applied':'No Matches';
  if(summary){$('minStat').textContent=number(summary.min);}else resetStats();
  $('resultDescription').textContent=`${number(matches.length)} possible ${matches.length===1?'bundle':'bundles'} · ${number(bundles.length)} in catalog`;
  const sorted=[...matches];
  if($('sort').value==='low')sorted.sort((a,b)=>a.sum-b.sum);
  if($('sort').value==='high')sorted.sort((a,b)=>b.sum-a.sum);
  if($('sort').value==='size')sorted.sort((a,b)=>a.size-b.size||a.sum-b.sum);
  const pages=Math.ceil(matches.length/pageSize);page=Math.max(1,Math.min(page,pages||1));
  if(!matches.length){$('results').innerHTML='<div class="empty"><span class="empty-symbol" aria-hidden="true">∅</span><h4>No Bundles Fit These Clues</h4><p>Check the average, widen the tolerance, or set the count to Any.<br>Only the supplied 9-slot catalog and groups of 1–7 are covered.</p></div>';}
  else{
    const target=readNumber('average');
    $('results').innerHTML=sorted.slice((page-1)*pageSize,page*pageSize).map((b,index)=>{
      const counts=new Map();b.items.forEach(n=>counts.set(n,(counts.get(n)||0)+1));
      const delta=target===null?null:Math.round(b.average)-Math.round(target);
      return `<article class="bundle"><div class="bundle-header"><span>BUNDLE ${String((page-1)*pageSize+index+1).padStart(2,'0')} · ${b.size} 9-SLOT ITEMS</span><span class="${delta===0?'exact':''}">${delta===null?'MATCHES YOUR READING':delta===0?'EXACT ROUNDED MATCH':`${signed(delta)} FROM ROUNDED TARGET`}</span></div><div class="bundle-items">${[...counts].map(([name,count])=>{const item=imageFor(name);return `<span class="bundle-item"><img src="/items/${item.file}" width="28" height="28" alt=""><span>${item.short}</span><b>×${count}</b></span>`;}).join('')}</div><div class="bundle-footer"><span>Avg. ${number(b.average)} / item</span><span>Total <strong>${number(b.sum)}</strong></span></div></article>`;
    }).join('');
  }
  $('pagination').hidden=pages<=1;$('pageLabel').textContent=`${page} / ${number(pages)}`;$('prev').disabled=page<=1;$('next').disabled=page>=pages;renderBid();
}
function renderBid(){
  $('marginLabel').textContent=`${$('margin').value}%`;$('bidError').textContent='';$('bid').removeAttribute('aria-invalid');
  let bid;
  try{bid=readNumber('bid');}catch(e){$('bidError').textContent=e.message;$('bid').setAttribute('aria-invalid','true');}
  const summary=hasSearched?summarize(matches,bid??0,Number($('margin').value)):null;
  $('ceiling').textContent=summary?number(summary.ceiling):'—';
  $('ceilingHint').textContent=summary?`${number(summary.min)} lowest value, less ${$('margin').value}% buffer.`:'Find matches to calculate a limit.';
  $('worst').textContent=summary&&bid!=null?signed(summary.worst):'—';$('best').textContent=summary&&bid!=null?signed(summary.best):'—';
  $('worst').style.color=summary&&bid!=null&&summary.worst<0?'#ffb5a8':'var(--lime)';
  $('best').style.color=summary&&bid!=null&&summary.best<0?'#ffb5a8':'var(--lime)';
  $('bidStatus').textContent=bid===undefined?'Correct your bid to compare values.':!summary?'Find matching bundles to evaluate your bid.':bid===null?'Enter your planned bid to compare it with the remaining values.':bid<=summary.ceiling?'Within your buffered limit for this catalog.':bid<=summary.min?'Above your buffered limit, but at or below the lowest matching 9-slot subtotal.':bid>summary.max?'Above every matching 9-slot subtotal. Other box contents are not counted.': 'Above the lowest matching 9-slot subtotal. Some matching 9-slot groups are worth less than your bid.';
}
if (!$('catalogItems').children.length) ITEMS.forEach((item,i)=>{
  const card=document.createElement('article');card.className='catalog-card';card.innerHTML=`<img src="/items/${item.file}" width="160" height="134" loading="lazy" alt="${item.name}"><div><h3>${item.name}</h3><p>◈ ${number(item.price)}</p></div>`;
  $('catalogItems').append(card);
});
function clueChanged(){if(hasSearched)search({focusError:false});else syncUrl();}
$('clueForm').addEventListener('submit',e=>{e.preventDefault();search();});
document.querySelectorAll('[data-size]').forEach(b=>b.addEventListener('click',()=>{setSize(Number(b.dataset.size));clueChanged();}));
for(const id of ['average'])$(id).addEventListener('input',clueChanged);
$('tolerance').addEventListener('change',clueChanged);
$('sort').addEventListener('change',()=>{page=1;if(hasSearched)render();syncUrl();});
for(const id of ['bid','margin'])$(id).addEventListener('input',()=>{renderBid();syncUrl();});
for(const [id,delta] of [['prev',-1],['next',1]])$(id).addEventListener('click',()=>{page+=delta;render();syncUrl();$('resultsTitle').scrollIntoView({block:'start'});});
function example(){restore({average:'18,166.5',size:0,tolerance:'2',bid:'30,000',margin:'10',known:{},searched:true});search();}
$('example').addEventListener('click',example);$('emptyExample').addEventListener('click',example);
const initialEmpty=$('results').innerHTML;
function reset(){undoState=state();const bid=$('bid').value,margin=$('margin').value;restore({bid,margin});matches=[];clearError();resetStats();$('matchCount').textContent='—';$('matchBadge').textContent='Awaiting Clues';$('resultDescription').textContent='Enter the gadget’s average value to find matching collectibles.';$('results').innerHTML=initialEmpty;$('emptyExample').addEventListener('click',example);$('pagination').hidden=true;renderBid();syncUrl();$('toastText').textContent='Clues cleared.';$('toast').hidden=false;}
$('reset').addEventListener('click',reset);
$('undo').addEventListener('click',()=>{if(undoState){restore(undoState);if(hasSearched)search({keepPage:true});else{renderBid();syncUrl();}}$('toast').hidden=true;undoState=null;});
function loadUrl(){const q=new URLSearchParams(location.search);restore({...Object.fromEntries(q),searched:q.get('search')==='1'});}
loadUrl();renderBid();
try{
  const response=await fetch('/combinations.json');if(!response.ok)throw new Error('Failed to load');
  const data=await response.json();
  if(!Array.isArray(data)||!data.length||!data.every(b=>[1,2,3,4,5,6,7].includes(b.size)&&Array.isArray(b.items)&&b.items.length===b.size&&b.items.every(n=>imageFor(n))&&Number.isFinite(b.sum)&&Number.isFinite(b.average)))throw new Error('Invalid data');
  bundles=data;$('dataCount').textContent=`${number(bundles.length)} bundles indexed`;
  if(hasSearched)search({keepPage:true});
}catch{$('dataCount').textContent='Bundle data unavailable';$('errors').textContent='Could not load the bundle catalog. Check your connection and reload the page.';$('matchBadge').textContent='Data Unavailable';}
