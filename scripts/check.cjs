(function check(){
 const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
 const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
 const must=['index.html','tools/index.html','stories/index.html','games/index.html','projects/index.html','gallery/index.html','journal/index.html','about/index.html','search/index.html','legal/index.html','assets/style.css','assets/app.js','sitemap.xml','robots.txt','404.html'];
 for(const s of catalog.stories)must.push(`stories/${s.slug}/index.html`);
 for(const g of catalog.games)must.push(`games/${g.slug}/index.html`);
 for(const p of catalog.projects)must.push(`projects/${p.slug}/index.html`);
 for(const s of catalog.stories)for(const c of s.chapters||[])must.push(`stories/${s.slug}/chapters/${c.id}/index.html`);
 for(const f of must)assert.ok(fs.existsSync(path.join(dist,f)),`missing ${f}`);
 const all=must.filter(x=>x.endsWith('.html'));
 for(const f of all){
  const html=fs.readFileSync(path.join(dist,f),'utf8');
  assert.match(html,/<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(html,/<main id="main">/);
  assert.match(html,/lang="zh-Hant"/);
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
   if(href.startsWith('https://')||href.startsWith('mailto:')||href.startsWith('#'))continue;
   const prefix=process.env.BASE_PATH?('/'+process.env.BASE_PATH.replace(/^\/+|\/+$/g,'')+'/').replace('//','/'):'/';
   assert.ok(href.startsWith(prefix),`bad href ${href} in ${f}`);
   const relative=href.slice(prefix.length).split('?')[0].split('#')[0];
   const target=relative===''?'index.html':relative.endsWith('/')?relative+'index.html':relative;
   assert.ok(fs.existsSync(path.join(dist,target)),`broken internal href ${href} in ${f}`);
  }
 }
 const css=fs.readFileSync(path.join(dist,'assets/style.css'),'utf8');
 for(const breakpoint of ['max-width:990px','max-width:720px','max-width:480px','prefers-reduced-motion'])assert.ok(css.includes(breakpoint),'missing responsive '+breakpoint);
 const tools=fs.readFileSync(path.join(dist,'tools/index.html'),'utf8');
 for(const t of catalog.tools){assert.ok(t.href.startsWith('https://lucas-tools.owl3918.workers.dev/'));assert.ok(tools.includes(t.href),'missing original tool link '+t.title)}
 assert.ok(!tools.includes('CY MySQL'),'private extension tool must not be shown');
 const reader=fs.readFileSync(path.join(dist,'stories/mist-letters/chapters/01/index.html'),'utf8');
 assert.match(reader,/data-reader/);assert.match(reader,/data-font/);assert.match(reader,/data-theme/);
 console.log('PASS: '+all.length+' pages, links, responsive CSS, original-tool URLs, reader controls');
})();
