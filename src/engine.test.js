import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ITEMS,findBundles,summarize} from './engine.js';
const bundles=JSON.parse(readFileSync(new URL('../public/combinations.json',import.meta.url)));
test('supplied catalog covers every unordered bundle of 1–7 items and correct values',()=>{
  assert.equal(bundles.length,6434);
  const keys=new Set();
  for(const b of bundles){assert.equal(b.items.length,b.size);const sum=b.items.reduce((n,name)=>n+ITEMS.find(i=>i.name===name).price,0);assert.equal(sum,b.sum);assert.ok(Math.abs(b.average-sum/b.size)<1e-6);keys.add([...b.items].sort().join('|'));}
  assert.equal(keys.size,bundles.length);
});
test('rounding and default tolerance preserve original finder results',()=>{
  for(const average of [63481.5,18166.5,6069,260423,1e9]){
    const expected=bundles.filter(b=>Math.abs(Math.round(b.average)-Math.round(average))<=2);
    assert.deepEqual(new Set(findBundles(bundles,{average})),new Set(expected));
  }
});
test('duplicate quantity, excluded items, count, and total range combine correctly',()=>{
  const result=findBundles(bundles,{size:3,known:{0:2,2:-1},minimum:13000,maximum:50000});
  assert.ok(result.length>0);
  for(const b of result){assert.equal(b.size,3);assert.ok(b.items.filter(n=>n===ITEMS[0].name).length>=2);assert.ok(!b.items.includes(ITEMS[2].name));assert.ok(b.sum>=13000&&b.sum<=50000);}
  assert.equal(findBundles(bundles,{size:2,known:{0:3}}).length,0);
});
test('bid calculations handle empty, even median, and negative surplus',()=>{
  assert.equal(summarize([]),null);
  assert.deepEqual(summarize([{sum:100},{sum:200}],120,10),{min:100,max:200,median:150,ceiling:90,worst:-20,best:80});
});
test('single collectible readings do not double the lowest value or bid limit',()=>{
  for(const item of ITEMS){
    const single=findBundles(bundles,{average:item.price,tolerance:0,size:1});
    assert.equal(single.length,1);assert.equal(single[0].sum,item.price);
    assert.equal(summarize(findBundles(bundles,{average:item.price,tolerance:0})).min,item.price);
  }
  const result=summarize(findBundles(bundles,{average:260423}));
  assert.equal(result.min,260423);assert.equal(result.ceiling,234380);
});
