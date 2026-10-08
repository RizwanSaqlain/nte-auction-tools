import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateBundles} from './engine.js';
import {searchGold} from '../public/gold-worker.js';
import {generateBundles as generateJapanese} from '../dist/ja/assets/src/engine.js';
import {searchGold as searchJapanese} from '../dist/ja/assets/gold-worker.js';
import {items} from '../public/gold-data.js';
import {items as japaneseItems} from '../dist/ja/assets/gold-data.js';

const origin='https://nteauctiontools.com';
test('every indexable page has reciprocal language links and self canonical',async()=>{
  const sitemap=await readFile('dist/sitemap.xml','utf8');
  assert.equal([...sitemap.matchAll(/<loc>/g)].length,18);
  for(const slug of ['index','gold-rarity','about-us','privacy-policy','terms-and-conditions','contact-us']){
    const path=slug==='index'?'/':'/'+slug;
    for(const locale of ['en','ja','zh-CN']){
      const prefix=locale==='en'?'':locale==='ja'?'/ja':'/zh-cn';
      const html=await readFile(`dist/${locale==='en'?'':locale==='ja'?'ja/':'zh-cn/'}${slug}.html`,'utf8');
      assert(html.includes(`<html lang="${locale}">`));
      assert(html.includes(`rel="canonical" href="${origin}${prefix}${path}"`));
      assert(html.includes(`hreflang="en" href="${origin}${path}"`));
      assert(html.includes(`hreflang="ja" href="${origin}/ja${path}"`));
      assert(html.includes('content="index, follow'));
      assert(sitemap.includes(`<loc>${origin}${prefix}${path}</loc>`));
      for(const [,json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(json);
    }
  }
});
test('translation preserves calculator values and exact bundle results',()=>{
  const bread={target:30452,maxCount:1,maxPerItem:1,maxSlots:10,maxResults:100,required:{50:1}};
  assert.deepEqual(searchGold(bread).results,[[{id:50,qty:1}]]);
  assert.deepEqual(searchJapanese(bread).results,searchGold(bread).results);
  assert.equal(searchGold({...bread,maxSlots:9}).reason,'infeasible');
  const numeric=bundles=>bundles.map(({size,sum,average})=>({size,sum,average}));
  assert.deepEqual(numeric(generateJapanese()),numeric(generateBundles()));
  assert.deepEqual(japaneseItems.map(({id,price,slot,img})=>({id,price,slot,img})),items.map(({id,price,slot,img})=>({id,price,slot,img})));
  assert(japaneseItems.every(item=>item.name&&item.englishName));
  const clues={target:111111,maxCount:3,maxPerItem:2,maxSlots:250,maxResults:100,required:{28:1}};
  assert.deepEqual(searchJapanese(clues).results,searchGold(clues).results);
  assert(searchJapanese({...clues,maxSlots:251}).error.includes('250'));
});
test('localized contact options preserve API values and scripts resolve under locale',async()=>{
  const contact=await readFile('dist/ja/contact-us.html','utf8');
  assert(contact.includes('<option value="Calculator issue">'));
  assert(contact.includes('src="/ja/assets/contact.js?v='));
  const home=await readFile('dist/ja/index.html','utf8');
  assert(home.includes('src="/ja/assets/app.js?v='));
  assert(home.includes('value="/ja/gold-rarity"'));
  assert(home.includes('src="/ja/assets/gold.js?v='));
});

test('Chinese catalogs preserve all values and solver outcomes',async()=>{
 const zh=await import('../dist/zh-cn/assets/src/engine.js');
 const gold=await import('../dist/zh-cn/assets/gold-worker.js');
 const data=await import('../dist/zh-cn/assets/gold-data.js');
 assert.deepEqual(zh.generateBundles().map(b=>[b.size,b.sum,b.average]),generateBundles().map(b=>[b.size,b.sum,b.average]));
 assert.deepEqual(data.items.map(i=>[i.id,i.price,i.slot]),items.map(i=>[i.id,i.price,i.slot]));
 assert.deepEqual(gold.searchGold({target:30452,maxCount:1,maxPerItem:1,maxSlots:10,maxResults:10,required:{50:1}}).results,[[{id:50,qty:1}]]);
 const html=await readFile('dist/zh-cn/index.html','utf8');
 assert(html.includes('value="/zh-cn/gold-rarity"'));
 assert(html.includes('src="/zh-cn/assets/app.js?v='));
 assert(html.includes('hreflang="zh-CN" href="https://nteauctiontools.com/zh-cn/"'));
});
