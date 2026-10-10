'use strict';
// Deploy manifest, robots, sitemap (with git-derived lastmod), chapter search index and the 404 page.
const {execFileSync}=require('node:child_process');

const lastModCache=new Map();
// Latest commit date touching the given repo paths; empty when git history is unavailable (e.g. an export without .git).
function lastMod(root,paths){
 const key=paths.join('|');
 if(!lastModCache.has(key)){
  let date='';
  try{date=execFileSync('git',['log','-1','--format=%cs','--',...paths],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()}catch{}
  lastModCache.set(key,/^\d{4}-\d{2}-\d{2}$/.test(date)?date:'');
 }
 return lastModCache.get(key);
}

module.exports=function finalizeSite(ctx){
 const {fs,path,root,out,catalog,url,ext,e,page,commit}=ctx;
 fs.writeFileSync(path.join(out,'_build.json'),JSON.stringify({commit,site:ext})+'\n');
 fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${ext}/sitemap.xml\n`);
 const storyPaths=story=>story.manuscript?[story.manuscript]:['data/catalog.json'];
 const listed=[
  {route:'',paths:['scripts/site']},
  {route:'tools',paths:['scripts/site']},{route:'stories',paths:['scripts/site']},{route:'games',paths:['scripts/site']},{route:'projects',paths:['scripts/site']},{route:'gallery',paths:['scripts/site']},{route:'journal',paths:['data/catalog.json']},{route:'journal/origin',paths:['scripts/site']},{route:'about',paths:['scripts/site']},{route:'legal',paths:['scripts/site']},
  ...catalog.stories.filter(x=>(x.chapters||[]).length>0).map(x=>({route:'stories/'+x.slug,paths:storyPaths(x)})),
  ...catalog.games.filter(x=>x.status==='playable').map(x=>({route:'games/'+x.slug,paths:['games/'+x.slug]})),
  ...catalog.projects.filter(x=>x.status!=='concept').map(x=>({route:'projects/'+x.slug,paths:['data/catalog.json']})),
  ...catalog.journal.filter(x=>Array.isArray(x.paragraphs)).map(x=>({route:'journal/'+x.slug,paths:['data/catalog.json']})),
  ...catalog.stories.flatMap(x=>(x.chapters||[]).map(c=>({route:'stories/'+x.slug+'/chapters/'+c.id,paths:storyPaths(x)})))
 ];
 const entry=({route,paths})=>{const date=lastMod(root,paths);return `<url><loc>${e(ext+'/'+(route?route+'/':''))}</loc>${date?`<lastmod>${date}</lastmod>`:''}</url>`};
 fs.writeFileSync(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+listed.map(entry).join('')+'</urlset>');
 // Chapter search index: titles and opening excerpts only, never full text. Loaded by the search page on first keystroke.
 const searchIndex=catalog.stories.filter(s=>(s.chapters||[]).length>0).flatMap(s=>s.chapters.map(c=>({t:c.title,s:s.title,u:url('stories/'+s.slug+'/chapters/'+c.id+'/'),x:c.paragraphs[0].slice(0,80)})));
 fs.writeFileSync(path.join(out,'search-index.json'),JSON.stringify(searchIndex));
 fs.writeFileSync(path.join(out,'404.html'),page('找不到頁面','此頁面不存在，請返回首頁。','',`<div class="wrap pageintro"><div class="eyebrow">404 / NOT FOUND</div><h1>這個世界暫時沒有入口。</h1><p>你尋找的頁面可能已被移動。</p><a class="btn primary" href="${url('')}">返回首頁 →</a></div>`,'404',{noindex:true}));
 console.log('Built '+listed.length+' routes + '+searchIndex.length+' indexed chapters into dist/');
};
