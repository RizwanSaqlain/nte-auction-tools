import {items} from './gold-data.js';
export function searchGold({target,maxPerItem,maxCount,maxSlots,maxResults,required={}},timeLimit=8000){
  if(!Number.isInteger(maxSlots)||maxSlots<1||maxSlots>250)return {error:'Max Total Slots must be a whole number from 1 to 250.'};
  const start=performance.now(), sorted=[...items].sort((a,b)=>b.price-a.price), results=[];
  let nodes=0,reason='complete';
  const req=sorted.map(i=>required[i.id]||0);
  if(req.some(q=>q>maxPerItem)||sorted.reduce((s,i,j)=>s+req[j]*i.price,0)>target||req.reduce((s,q)=>s+q,0)>maxCount||sorted.reduce((s,i,j)=>s+req[j]*i.slot,0)>maxSlots)return {results,reason:'infeasible',nodes};
  const suffix=Array(sorted.length+1);suffix[sorted.length]=Array.from({length:maxCount+1},()=>new Int32Array(maxSlots+1));
  for(let i=sorted.length-1;i>=0;i--){const {price,slot}=sorted[i];suffix[i]=Array.from({length:maxCount+1},()=>new Int32Array(maxSlots+1));for(let c=0;c<=maxCount;c++)for(let s=0;s<=maxSlots;s++)for(let q=0;q<=Math.min(maxPerItem,c,Math.floor(s/slot));q++)suffix[i][c][s]=Math.max(suffix[i][c][s],q*price+suffix[i+1][c-q][s-q*slot]);}
  const rc=new Int32Array(sorted.length+1),rs=new Int32Array(sorted.length+1),rv=new Int32Array(sorted.length+1);
  for(let i=sorted.length-1;i>=0;i--){rc[i]=rc[i+1]+req[i];rs[i]=rs[i+1]+req[i]*sorted[i].slot;rv[i]=rv[i+1]+req[i]*sorted[i].price;}
  function dfs(i,c,s,sum,combo){
    if(reason!=='complete')return;
    if((++nodes%1024)===0&&performance.now()-start>timeLimit){reason='time';return;}
    if(sum===target){if(rc[i]===0){results.push(combo.slice());if(results.length>=maxResults)reason='limit';}return;}
    if(i===sorted.length||rc[i]>c||rs[i]>s||sum+rv[i]>target||sum+suffix[i][c][s]<target)return;
    const item=sorted[i];
    for(let q=Math.min(maxPerItem,c,Math.floor(s/item.slot),Math.floor((target-sum)/item.price));q>=req[i];q--){if(q)combo.push({id:item.id,qty:q});dfs(i+1,c-q,s-q*item.slot,sum+q*item.price,combo);if(q)combo.pop();if(reason!=='complete')return;}
  }
  dfs(0,maxCount,maxSlots,0,[]);return {results,reason,nodes};
}
if(typeof self!=='undefined')self.onmessage=({data})=>{try{self.postMessage(searchGold(data));}catch{self.postMessage({error:'Search failed. Reduce the limits and try again.'});}};
