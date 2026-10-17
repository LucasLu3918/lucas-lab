'use strict';
// Writes the web app manifest and the offline reading service worker, both scoped to the deployment base path.
const fs=require('node:fs'),path=require('node:path');

module.exports=function writePwa(ctx){
 const {out,root,base,commit,fingerprint}=ctx;
 const manifest={
  id:base,
  name:'LUCAS LAB',
  short_name:'LUCAS LAB',
  description:'暗黑科技與奇幻宇宙：原創故事、互動遊戲與視覺藝廊。',
  start_url:base,
  scope:base,
  display:'standalone',
  background_color:'#080e16',
  theme_color:'#080e16',
  lang:'zh-Hant',
  icons:[
   {src:base+'assets/icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
   {src:base+'assets/icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
   {src:base+'assets/icons/icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'},
   {src:base+'assets/icons/favicon-64.png',sizes:'64x64',type:'image/png',purpose:'any'}
  ]
 };
 fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify(manifest,null,1)+'\n');
 // Reader islands are needed by saved chapter/story pages when the network is unavailable.
 const readerEntry='src/vue/site/reader-main.ts';
 const readerKeys=new Set(),readerFiles=new Set();
 const visitReaderEntry=key=>{
  const entry=ctx.vueAssets?.manifest?.[key];
  if(!entry||readerKeys.has(key))return;
  readerKeys.add(key);
  for(const file of [entry.file,...(entry.css||[])])if(file)readerFiles.add(file);
  for(const dependency of entry.imports||[])visitReaderEntry(dependency);
 };
 visitReaderEntry(readerEntry);
 if(!readerKeys.has(readerEntry))throw new Error('Vue reader entry is missing from the Vite manifest');
 const tarotEntry='src/vue/site/tarot-main.ts';
 const tarotKeys=new Set(),tarotFiles=new Set();
 const visitTarotEntry=key=>{
  const entry=ctx.vueAssets?.manifest?.[key];
  if(!entry||tarotKeys.has(key))return;
  tarotKeys.add(key);
  for(const file of [entry.file,...(entry.css||[])])if(file)tarotFiles.add(file);
  for(const dependency of entry.imports||[])visitTarotEntry(dependency);
 };
 visitTarotEntry(tarotEntry);
 if(!tarotKeys.has(tarotEntry))throw new Error('Vue Tarot entry is missing from the Vite manifest');
 // Reader and Tarot entries are precached with their imports so a visited feature remains usable offline.
 // Dynamic imports count too: the hub loads the tarot history, tarot deck and horoscope engine only when a card is shown.
 const divinationFiles=new Set();
 for(const entryKey of ['src/vue/site/divination-main.ts','src/vue/site/bazi-main.ts','src/vue/site/astrology-main.ts','src/vue/site/numerology-main.ts','src/vue/site/meihua-main.ts','src/vue/site/ziwei-main.ts','src/vue/site/horoscope-main.ts']){
  const seen=new Set();
  const visit=key=>{const entry=ctx.vueAssets?.manifest?.[key];if(!entry||seen.has(key))return;seen.add(key);for(const file of [entry.file,...(entry.css||[])])if(file)divinationFiles.add(file);for(const dependency of [...(entry.imports||[]),...(entry.dynamicImports||[])])visit(dependency);};
  visit(entryKey);
  if(!seen.has(entryKey))throw new Error('Vue divination entry is missing from the Vite manifest: '+entryKey);
 }
 // The astrology forecast worker is referenced by URL from the astrology bundle, so the Vite manifest does not list it; precache that exact file.
 const astrologyBundle=ctx.vueAssets?.manifest?.['src/vue/site/astrology-main.ts']?.file;
 const astrologyText=astrologyBundle?fs.readFileSync(path.join(out,'_vue',astrologyBundle),'utf8'):'';
 const astrologyWorker=astrologyText.match(/astrology\.worker-[A-Za-z0-9_-]+\.js/)?.[0];
 if(!astrologyWorker||!fs.existsSync(path.join(out,'_vue','assets',astrologyWorker)))throw new Error('Astrology forecast worker is missing from the astrology bundle');
 divinationFiles.add('assets/'+astrologyWorker);
 // Module pages are precached as HTML too, so a first visit made offline still opens each module from the hub.
 const moduleRoutes=['divination/','tarot/','bazi/','astrology/','numerology/','ziwei/','horoscope/','meihua/'];
 for(const route of moduleRoutes)if(!fs.existsSync(path.join(out,route,'index.html')))throw new Error('Module page is missing from the build: '+route);
 // Bazi and astrology bundles are cached together with their local calculation libraries for offline use.
 const precache=Array.from(new Set([base,base+'offline/',base+'assets/icons/favicon-64.png',base+'assets/icons/icon-192.png',base+'assets/icons/apple-touch-icon.png',...Object.values(fingerprint).map(file=>base+file),...Array.from(readerFiles).map(file=>base+'_vue/'+file),...Array.from(tarotFiles).map(file=>base+'_vue/'+file),...Array.from(divinationFiles).map(file=>base+'_vue/'+file),...moduleRoutes.map(route=>base+route)]));
 const template=fs.readFileSync(path.join(root,'scripts/site/service-worker.template.js'),'utf8');
 const buildId=String(commit||'dev').replace(/[^a-zA-Z0-9]/g,'').slice(0,12)||'dev';
 fs.writeFileSync(path.join(out,'sw.js'),template.replaceAll('__BUILD_ID__',buildId).replaceAll('__BASE__',base).replaceAll('__PRECACHE__',JSON.stringify(precache)));
};
