import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateBundles} from './engine.js';
test('generated bundles match the supplied catalog',async()=>{
 const source=JSON.parse(await readFile(new URL('../public/combinations.json',import.meta.url)));
 const normalize=rows=>rows.map(({size,items,sum,average})=>JSON.stringify({size,items,sum,average})).sort();
 assert.deepEqual(normalize(generateBundles()),normalize(source));
});
