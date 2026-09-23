import test from 'node:test';
import assert from 'node:assert/strict';
import {searchGold} from '../public/gold-worker.js';
import {items} from '../public/gold-data.js';
const base={maxPerItem:2,maxCount:2,maxSlots:25,maxResults:2000};
test('gold search agrees with independent enumeration for single and repeated bundles',()=>{
  for(const target of [88888,9950,35239,4975]){
    const expected=[];for(let i=0;i<items.length;i++){if(items[i].price===target)expected.push([i]);for(let j=i;j<items.length;j++)if(items[i].price+items[j].price===target&&items[i].slot+items[j].slot<=25)expected.push([i,j]);}
    const r=searchGold({...base,target});assert.equal(r.reason,'complete');assert.equal(r.results.length,expected.length);
    for(const combo of r.results)assert.equal(combo.reduce((s,c)=>s+c.qty*items[c.id].price,0),target);
  }
});
test('gold constraints reject excess known quantities and restrict duplicates and slots',()=>{
  const id=items.find(i=>i.name==='Sunset Pearl').id;
  assert.equal(searchGold({...base,target:9950,maxPerItem:1,required:{[id]:2}}).reason,'infeasible');
  assert.equal(searchGold({...base,target:9950,maxSlots:1}).results.length,0);
  assert.equal(searchGold({...base,target:9950,required:{[id]:2}}).results.length,1);
});
