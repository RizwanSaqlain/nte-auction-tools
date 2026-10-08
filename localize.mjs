import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {items} from './public/gold-data.js';
import {ITEMS} from './src/engine.js';

const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
const site = await readJSON('site.config.json');
const origin = process.env.SITE_URL || site.url;
const pages = ['index', 'gold-rarity', 'about-us', 'privacy-policy', 'terms-and-conditions', 'contact-us', '404', '500'];
const route = slug => slug === 'index' ? '/' : '/' + slug;
const languages=[{code:'en',prefix:'',label:'English',og:'en_US'}, {code:'ja',prefix:'/ja',label:'日本語',og:'ja_JP'}, {code:'zh-CN',prefix:'/zh-cn',label:'简体中文',og:'zh_CN'}];
const originals=new Map(await Promise.all(pages.map(async slug=>[slug,await readFile(`dist/${slug}.html`,'utf8')])));
function switcher(path, code) {
 return `<nav class="language-switch" aria-label="${code==='ja'?'言語':code==='zh-CN'?'语言':'Language'}">${languages.map(l=>`<a data-language="${l.code}" lang="${l.code}" hreflang="${l.code}" href="${l.prefix}${path}"${code===l.code?' aria-current="page"':''}>${l.label}</a>`).join('')}</nav>`;
}
function alternates(path) {
 return languages.map(l=>`<link rel="alternate" hreflang="${l.code}" href="${origin}${l.prefix}${path}">`).join('')+`<link rel="alternate" hreflang="x-default" href="${origin}${path}">`;
}
for(const language of languages.slice(1)) {
const {code,prefix,og}=language;
const key=code==='ja'?'ja':'zh';
const names=await readJSON(`locales/${key}-items.json`);
const translations=await readJSON(`locales/${key}-static.json`);
const runtime=await readJSON(`locales/${key}-runtime.json`);
if(code==='ja'){
 runtime['Gold-rarity Valuation Device']='金レアリティ鑑定器';
 runtime['Nine-slot Average Valuation Device']='9マス平均価値鑑定器';
}
const japanese=path=>prefix+path;
const escape = text => text.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const missing = new Set();
const decode = text => text.replace(/&(?:amp|quot|apos|lt|gt|#39);/g, entity=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&#39;':"'",'&lt;':'<','&gt;':'>'}[entity]));
function translate(text, html=true) {
  const key = text.trim();
  if (!key) return text;
  let value = names[key] ?? translations[key] ?? translations[decode(key)];
  if (key.endsWith(' — NTE 9-slot collectible')) value = names[key.replace(' — NTE 9-slot collectible','')] + (code==='ja'?' — NTEの9マス所蔵品':' — NTE九宫格收藏品');
  if (value === undefined) {
    if (/[A-Za-z]{3}/.test(key) && !/^(NTE|AUCTION TOOLS|Google|Cloudflare|FormSubmit|GitHub|September|◈|https?:)/.test(key)) missing.add(key);
    return text;
  }
  return text.replace(key, html?escape(value):value);
}
function translateHTML(html) {
  // Generated HTML has no user-supplied markup. Keep scripts/styles opaque;
  // translate only text and human-readable attributes, never IDs or form values.
  return html.replace(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<[^>]+>)|([^<]+)/g, (all, tag, text) => {
    if (text !== undefined) return translate(text);
    if (/^<(script|style)\b/.test(tag)) return tag;
    return tag.replace(/\b(alt|aria-label|placeholder|title)="([^"]*)"/g, (_, attribute, value) => `${attribute}="${translate(value)}"`);
  });
}
await mkdir(`dist${prefix}/assets/src`, {recursive:true});
for (const slug of pages) {
  const path = route(slug), isError = ['404','500'].includes(slug);
  let en = originals.get(slug);
  // Contact option labels are translated, while the API's stable values remain English.
  en = en.replace(/<option>([^<]+)<\/option>/g, (_, label) => `<option value="${escape(label)}">${label}</option>`);
  let ja = translateHTML(en).replace('<html lang="en">',`<html lang="${code}">`);
  ja = ja.replace(/(<option value=")(\/gold-rarity|\/)(")/g, `$1${prefix}$2$3`);
  ja = ja.replace(/<meta (name|property)="(description|og:title|og:description|twitter:title|twitter:description)" content="([^"]*)">/g,
    (_, kind, key, value) => `<meta ${kind}="${key}" content="${translate(value)}">`);
  ja = ja.replace(/(<link rel="canonical" href="|<meta property="og:url" content=")[^"]+"/g, `$1${origin}${japanese(path)}"`);
  ja = ja.replace(/href="(\/[^"#?]*)([?#][^"]*)?"/g, (all, href, tail='') => pages.some(p=>route(p)===href) ? `href="${japanese(href)}${tail}"` : all);
  ja = ja.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (_, json) => {
    const data = JSON.parse(json);
    function localize(value) {
      if (Array.isArray(value)) return value.map(localize);
      if (value && typeof value === 'object') {
        const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
          ['name','description','alternateName'].includes(key) && typeof item === 'string' ? translate(item,false) : localize(item)]));
        if (result['@type'] && result['@type'] !== 'Offer') result.inLanguage=code;
        return result;
      }
      return typeof value === 'string' && value.startsWith(origin) ? origin + prefix + value.slice(origin.length) : value;
    }
    return `<script type="application/ld+json">${JSON.stringify(localize(data))}</script>`;
  });
  for (const script of ['app','gold','workspace-switch','contact']) ja = ja.replaceAll(`src="/${script}.js"`, `src="${prefix}/assets/${script}.js"`);
  if (slug==='index' || slug==='gold-rarity') {
    const note=code==='ja'?'<p class="translation-note">アイテム名は英語版からの参考訳です。ゲーム内の正式名称と異なる場合があります。画像内の表記とダウンロードデータは英語版です。</p>':'<p class="translation-note">物品名称为英文参考译名，可能与游戏内正式名称不同。图片文字和下载数据保留英文。</p>';
    ja = ja.replace('<form id="goldForm"', note + '<form id="goldForm"');
  }
  for (const [lang, original] of code==='ja'?[['en',en],[code,ja]]:[[code,ja]]) {
    let html=original.replace('</header>',switcher(path,lang)+'</header>');
    html=html.replace('</head>',`${isError?'':alternates(path)}<meta property="og:locale" content="${lang==='en'?'en_US':og}"><link rel="stylesheet" href="/languages.css"></head>`);
    html=html.replace('</body>',`<script src="/language-switch.js" defer></script>${lang!=='en'?`<script src="/${key}-validation.js" defer></script>`:''}</body>`);
    await writeFile(lang==='en'?`dist/${slug}.html`:`dist${prefix}/${slug}.html`,html);
  }
}

// Compile translated runtime assets from the shared implementations. The worker,
// constraints and prices are identical in both languages; no fork is maintained.
function replaceRuntime(source) {
  const entries=Object.entries(runtime).sort((a,b)=>b[0].length-a[0].length);
  const pattern=new RegExp(entries.map(([key])=>key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
  return source.replace(pattern, match=>runtime[match]);
}
for (const file of ['app.js','gold.js','workspace-switch.js','contact.js','gold-worker.js','gold-limits.js']) {
  let source=await readFile(file==='app.js'?file:'public/'+file,'utf8');
  source=replaceRuntime(source);
  if (file==='gold.js') {
    source=source.replace("new Worker('/gold-worker.js'", `new Worker('${prefix}/assets/gold-worker.js'`);
    source=source.replace('i.name.toLowerCase()', '(i.name+" "+i.englishName).toLowerCase()');
    source=source.replace('${escape(i.name)}<small>', '${escape(i.name)}<small lang="en">${escape(i.englishName)}</small><small>');
  }
  if (file==='workspace-switch.js') source=source.replaceAll("'/gold-rarity'",`'${prefix}/gold-rarity'`).replaceAll("'/'",`'${prefix}/'`).replaceAll("'/?device=", `'${prefix}/?device=`);
  if (file==='contact.js') {
    source='const responseTranslations='+JSON.stringify(runtime)+';\n'+source;
    source=source.replace('result.error||', 'responseTranslations[result.error]||result.error||').replace('status.textContent=result.message','status.textContent=responseTranslations[result.message]||result.message');
  }
  await writeFile(`dist${prefix}/assets/`+file,source);
}
const localizedItems=items.map(item=>({...item,englishName:item.name,name:names[item.name]}));
if (localizedItems.some(item=>!item.name)) throw new Error('Missing Japanese gold item name');
await writeFile(`dist${prefix}/assets/gold-data.js`,'export const items = '+JSON.stringify(localizedItems)+';\n');
let engine=await readFile('src/engine.js','utf8');
if(ITEMS.some(item=>!names[item.name])) throw new Error('Missing Japanese nine-slot item name');
if(!/export const ITEMS = \[[\s\S]*?\];/.test(engine)) throw new Error('Cannot locate shared nine-slot catalog');
engine=engine.replace(/export const ITEMS = \[[\s\S]*?\];/, 'export const ITEMS = '+JSON.stringify(ITEMS.map(item=>({...item,name:names[item.name],short:names[item.name]})))+';');
await writeFile(`dist${prefix}/assets/src/engine.js`,engine);

await mkdir('.localization', {recursive:true});
await writeFile(`.localization/${key}-translation-audit.json`,JSON.stringify([...missing],null,2));
console.log(`Generated ${code} pages; ${missing.size} text fragments require coverage review.`);
}
let sitemap=await readFile('dist/sitemap.xml','utf8');
sitemap=sitemap.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');
sitemap=sitemap.replace(/<url><loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g,(_,url,rest)=>{
 const path=new URL(url).pathname;
 const links=languages.map(l=>`<xhtml:link rel="alternate" hreflang="${l.code}" href="${origin}${l.prefix}${path}"/>`).join('')+`<xhtml:link rel="alternate" hreflang="x-default" href="${url}"/>`;
 return languages.map(l=>`<url><loc>${origin}${l.prefix}${path}</loc>${l.code==='en'?rest:`<lastmod>${l.code==='ja'?'2026-10-08':'2026-10-09'}</lastmod>`}${links}</url>`).join('\n');
});
await writeFile('dist/sitemap.xml',sitemap);
// Version entry points so returning visitors receive updated UI and state handling.
for(const prefix of ['', 'ja/assets/', 'zh-cn/assets/']) for(const script of ['app.js','gold.js','gold-worker.js']) {
  const file=`dist/${prefix}${script}`;
  let source=await readFile(file,'utf8');
  for(const dependency of script==='app.js'?['src/engine.js']:['gold-data.js','gold-limits.js']){
    if(!source.includes(`'./${dependency}'`))continue;
    const hash=createHash('sha256').update(await readFile(`dist/${prefix}${dependency}`)).digest('hex').slice(0,12);
    source=source.replaceAll(`'./${dependency}'`,`'./${dependency}?v=${hash}'`);
  }
  await writeFile(file,source);
}
for(const prefix of ['', 'ja/assets/', 'zh-cn/assets/']) {
  const file=`dist/${prefix}gold.js`, worker=`/${prefix}gold-worker.js`;
  const hash=createHash('sha256').update(await readFile('dist'+worker)).digest('hex').slice(0,12);
  await writeFile(file,(await readFile(file,'utf8')).replace(`'${worker}'`,`'${worker}?v=${hash}'`));
}
for(const prefix of ['', 'ja/', 'zh-cn/']) for(const slug of pages){
  const file=`dist/${prefix}${slug}.html`;
  let html=await readFile(file,'utf8');
  const assets=[...html.matchAll(/(?:src|href)="(\/[^"?]+\.(?:js|css))"/g)];
  for(const [,asset] of assets){
    const hash=createHash('sha256').update(await readFile('dist'+asset)).digest('hex').slice(0,12);
    html=html.replaceAll(`"${asset}"`,`"${asset}?v=${hash}"`);
  }
  await writeFile(file,html);
}
