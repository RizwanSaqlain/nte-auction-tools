import {readFile,writeFile, mkdir,copyFile} from 'node:fs/promises';
const imageDirectory=process.argv[2];
if(!imageDirectory) throw new Error('Usage: node prepare-gold.mjs /path/to/GoldItems');
const source=await readFile('gold-rarity-bundle-finder.html','utf8');
const raw=JSON.parse(source.match(/const RAW_ITEMS = (\[[\s\S]*?\n  \]);/)[1].replace(/,\s*\]/g,']'));
await mkdir('public/gold-items',{recursive:true});
for(const [, , ,file] of raw) await copyFile(`${imageDirectory}/${file}`,`public/gold-items/${file}`);
await writeFile('public/gold-data.js',`export const items = ${JSON.stringify(raw.map(([name,price,slot,file],id)=>({id,name,price,slot,img:'/gold-items/'+file})),null,2)};\n`);
