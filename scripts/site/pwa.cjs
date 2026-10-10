'use strict';
// Writes the web app manifest and the offline reading service worker, both scoped to the deployment base path.
const fs=require('node:fs'),path=require('node:path');

module.exports=function writePwa(ctx){
 const {out,root,base,commit}=ctx;
 const manifest={
  name:'LUCAS LAB',
  short_name:'LUCAS LAB',
  description:'暗黑科技與奇幻宇宙：原創故事、互動遊戲與視覺藝廊。',
  start_url:base,
  scope:base,
  display:'standalone',
  background_color:'#080e16',
  theme_color:'#080e16',
  lang:'zh-Hant',
  icons:[{src:base+'assets/favicon.svg',sizes:'any',type:'image/svg+xml'}]
 };
 fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify(manifest,null,1)+'\n');
 const template=fs.readFileSync(path.join(root,'scripts/site/service-worker.template.js'),'utf8');
 const buildId=String(commit||'dev').replace(/[^a-zA-Z0-9]/g,'').slice(0,12)||'dev';
 fs.writeFileSync(path.join(out,'sw.js'),template.replaceAll('__BUILD_ID__',buildId).replaceAll('__BASE__',base));
};
