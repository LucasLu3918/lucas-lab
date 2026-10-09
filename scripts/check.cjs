(function check(){
 const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
 const {loadMarkdownChapters}=require('./story-source.cjs');
 const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
 const must=['index.html','tools/index.html','stories/index.html','games/index.html','projects/index.html','gallery/index.html','journal/index.html','about/index.html','search/index.html','legal/index.html','assets/style.css','assets/app.js','assets/snow-white-cover.svg','sitemap.xml','robots.txt','404.html','_build.json'];
 for(const s of catalog.stories)must.push(`stories/${s.slug}/index.html`);
 for(const g of catalog.games)must.push(`games/${g.slug}/index.html`);
 for(const p of catalog.projects)must.push(`projects/${p.slug}/index.html`);
 for(const s of catalog.stories)for(const c of s.manuscript?loadMarkdownChapters(s.manuscript):s.chapters||[])must.push(`stories/${s.slug}/chapters/${c.id}/index.html`);
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
 const coverSource=fs.readFileSync(path.join(root,'assets/snow-white-cover.svg'),'utf8');
  const coverBuilt=fs.readFileSync(path.join(dist,'assets/snow-white-cover.svg'),'utf8');
  assert.equal(coverBuilt,coverSource,'book-cover file must be copied unchanged to dist');
  assert.ok(coverSource.startsWith('<svg')&&coverSource.includes('viewBox="0 0 800 1080"'),'invalid book cover SVG');
  assert.ok(!/<script\b|\bonload\s*=|https?:\/\//i.test(coverSource.replace('xmlns="http://www.w3.org/2000/svg"','')),'unexpected external or script-backed book asset');
  const novelBook=fs.readFileSync(path.join(dist,'stories/dark-snow-white/index.html'),'utf8');
  const featuredBook=fs.readFileSync(path.join(dist,'index.html'),'utf8');
  for(const text of [novelBook,featuredBook])assert.ok(text.includes('/assets/snow-white-cover.svg'),'original book-cover image missing from public page');
  assert.ok(catalog.stories.find(s=>s.slug==='dark-snow-white')?.cover==='assets/snow-white-cover.svg','published book missing cover catalog property');
 const fullStory=catalog.stories.find(s=>s.slug==='dark-snow-white');
 assert.ok(fullStory&&fullStory.status==='complete','complete Snow White catalog metadata missing');
 const manuscript=fs.readFileSync(path.join(root,fullStory.manuscript),'utf8');
 assert.equal(crypto.createHash('sha256').update(manuscript).digest('hex'),'9d123d04b2f7e3e033d25705637a4f2edab101be34b82b6fbcc14941faead602','manuscript must match original supplied text');
 const novelChapters=loadMarkdownChapters(fullStory.manuscript);
 assert.equal(novelChapters.length,22,'expected prologue, twenty chapters and epilogue');
 assert.equal(novelChapters[0].title,'序章：當鏡子第一次說謊');
 assert.equal(novelChapters[21].title,'尾聲：春天沒有記住她');
 assert.equal(new Set(novelChapters.map(c=>c.id)).size,22,'chapter URLs must be unique');
 for(const c of novelChapters){
  const chapterHtml=fs.readFileSync(path.join(dist,'stories/dark-snow-white/chapters',c.id,'index.html'),'utf8');
  assert.ok(chapterHtml.includes(c.title)&&chapterHtml.includes('class="readerpage manuscript"'),'broken full-text reader '+c.id);
  assert.ok(chapterHtml.includes(c.paragraphs[0]),'first paragraph missing in '+c.id);
 }
 const finalChapter=fs.readFileSync(path.join(dist,'stories/dark-snow-white/chapters/21/index.html'),'utf8');
 assert.ok(finalChapter.includes('《白雪公主：血色魔鏡》——全文完。'),'story ending not published');
 const novelIndex=fs.readFileSync(path.join(dist,'stories/dark-snow-white/index.html'),'utf8');
 assert.ok(novelIndex.includes('內容提示：')&&novelIndex.includes('第一部：雪中的謊言'),'novel warnings or part navigation missing');
 const reader=fs.readFileSync(path.join(dist,'stories/mist-letters/chapters/01/index.html'),'utf8');
 assert.match(reader,/data-reader/);assert.match(reader,/data-font/);assert.match(reader,/data-theme/);
 const cfg=JSON.parse(fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8'));
 assert.equal(cfg.name,'lucas-lab','unexpected Worker name');
 assert.equal(cfg.assets.directory,'./dist','Cloudflare assets directory must be dist');
 assert.equal(cfg.assets.not_found_handling,'404-page');
 assert.equal(cfg.assets.html_handling,'auto-trailing-slash');
 const origin=(process.env.SITE_URL||'https://lucas-lab.owl3918.workers.dev').replace(/\/+$/,'');
 const homeHtml=fs.readFileSync(path.join(dist,'index.html'),'utf8');
 assert.ok(homeHtml.includes('<link rel="canonical" href="'+origin+'/">'),'incorrect production canonical URL');
 assert.ok(fs.readFileSync(path.join(dist,'sitemap.xml'),'utf8').includes(origin+'/'),'incorrect sitemap domain');
 const searchPage=fs.readFileSync(path.join(dist,'search/index.html'),'utf8');
 for(const t of catalog.tools)assert.ok(searchPage.includes(t.href),'tool absent from global search: '+t.title);
 const sitemap=fs.readFileSync(path.join(dist,'sitemap.xml'),'utf8');
 assert.ok(!sitemap.includes(origin+'/search/'),'noindex search must not be in sitemap');
 for(const s of catalog.stories.filter(x=>!(x.manuscript||(x.chapters||[]).length)))assert.ok(!sitemap.includes(origin+'/stories/'+s.slug+'/'),'pending story in sitemap: '+s.slug);
 for(const g of catalog.games)assert.ok(!sitemap.includes(origin+'/games/'+g.slug+'/'),'concept game in sitemap: '+g.slug);
 for(const p of catalog.projects.filter(x=>x.status==='concept'))assert.ok(!sitemap.includes(origin+'/projects/'+p.slug+'/'),'concept project in sitemap: '+p.slug);
 const info=JSON.parse(fs.readFileSync(path.join(dist,'_build.json'),'utf8'));
 assert.equal(info.site,origin,'incorrect deploy manifest origin');
 assert.ok(typeof info.commit==='string'&&info.commit.length>0,'missing deploy commit');
 const js=fs.readFileSync(path.join(dist,'assets/app.js'),'utf8');
 assert.ok(js.includes('toggle.focus()')&&js.includes('matchMedia'),'nav Escape/resize handling missing');
 console.log('PASS: '+all.length+' pages, complete 22-part Snow White source integrity, navigation, links, mobile UI, search, SEO and Cloudflare config');
})();
