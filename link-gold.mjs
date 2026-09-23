import {readFile,writeFile,readdir} from 'node:fs/promises';
import {auctionTools} from './tools.config.mjs';
for(const file of await readdir('dist')){
  if(!file.endsWith('.html'))continue;
  let html=await readFile('dist/'+file,'utf8');
  const active=auctionTools.find(t=>t.page===file);
  const links=auctionTools.map(t=>`<a href="${t.path}"${active===t?' aria-current="page"':''}><img src="${t.image}" width="48" height="48" alt=""><span>${t.name}</span></a>`).join('');
  html=html.replace(/<nav aria-label="Main navigation">[\s\S]*?<\/nav>/,`<nav aria-label="Main navigation"><details class="device-menu"><summary>Tools ▾</summary><nav aria-label="Valuation devices">${links}</nav></details><a href="/#strategy">Bidding Strategy</a><a href="/about-us">About Us</a></nav>`);
  html=html.replaceAll('Auction Solver','Nine-slot Average Valuation Device');
  if(active){
    const directory=`<section class="device-directory" aria-label="Choose your valuation device"><div class="device-directory-heading"><h2>Choose Your Device</h2><span>${auctionTools.length} tools available</span></div><div class="device-grid">${auctionTools.map(t=>`<a class="device-card" href="${t.path}"${active===t?' aria-current="page"':''}><img src="${t.image}" width="80" height="80" alt=""><div><h3>${t.name}</h3><p>${t.description}</p><span>${active===t?'Current Tool':'Open Tool →'}</span></div></a>`).join('')}</div></section>`;
    const toolbar=`<div class="workspace-switch" id="workspace-switch"><img src="${active.image}" width="48" height="48" alt=""><label for="workspace-device">Device<select id="workspace-device">${auctionTools.map(t=>`<option value="${t.path}"${active===t?' selected':''}>${t.name}</option>`).join('')}</select></label><div class="workspace-views" aria-label="Workspace view"><button type="button" id="view-tool" aria-pressed="true">Tool</button><button type="button" id="view-catalog" aria-pressed="false">Catalog</button></div></div>`;
    if(file==='index.html')html=html.replace('<div class="workspace">',toolbar+'<div class="workspace">').replace('<h2><span>01</span> Nine-slot Average Valuation Device</h2>','<h2 class="device-heading"><img src="/nine-slot-device.png" width="56" height="56" alt="">Nine-slot Average Valuation Device</h2>');
    else html=html.replace(/<nav class="tool-switch"[\s\S]*?<\/nav>/,toolbar).replace(`<h1>${active.name}</h1>`,`<h1 class="device-heading"><img src="${active.image}" width="80" height="80" alt="">${active.name}</h1>`);
    html=html.replace('</body>','<script src="/workspace-switch.js" defer></script></body>');
  }
  html=html.replace('</head>','<link rel="stylesheet" href="/tools.css"></head>');
  html=html.replace('<span id="dataCount">Loading bundles…</span>','<span id="dataCount" hidden></span>');
  if(file==='index.html'){
    const fragment=(await readFile('gold-content.html','utf8')).replace(/<nav class="tool-switch"[\s\S]*?<\/nav>/,'');
    html=html.replace('<div class="workspace">',`<div id="gold-area" hidden>${fragment}</div><div class="workspace">`);
    html=html.replaceAll('href="/gold-rarity"','href="/?device=gold#workspace-switch"');
    html=html.replace('<span>8 catalog items</span>','<span>2 valuation devices</span>');
  }
  await writeFile('dist/'+file,html);
}
const sitemap=await readFile('dist/sitemap.xml','utf8');
if(!sitemap.includes('/gold-rarity<'))await writeFile('dist/sitemap.xml',sitemap.replace('</urlset>',`<url><loc>${process.env.SITE_URL||'https://nteauctiontools.com'}/gold-rarity</loc></url></urlset>`));
