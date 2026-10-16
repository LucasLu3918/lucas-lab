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
 // Everything a reader needs for the shell is precached: static assets plus the Reader entry and its imports.
 const precache=[base,base+'offline/',base+'assets/icons/favicon-64.png',base+'assets/icons/icon-192.png',base+'assets/icons/apple-touch-icon.png',...Object.values(fingerprint).map(file=>base+file),...Array.from(readerFiles).map(file=>base+'_vue/'+file)];
 const template=fs.readFileSync(path.join(root,'scripts/site/service-worker.template.js'),'utf8');
 const buildId=String(commit||'dev').replace(/[^a-zA-Z0-9]/g,'').slice(0,12)||'dev';
 fs.writeFileSync(path.join(out,'sw.js'),template.replaceAll('__BUILD_ID__',buildId).replaceAll('__BASE__',base).replaceAll('__PRECACHE__',JSON.stringify(precache)));
};
