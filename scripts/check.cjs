(function check(){
 const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
 const {loadMarkdownChapters}=require('./story-source.cjs');
 const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
 const must=['index.html','tools/index.html','stories/index.html','games/index.html','projects/index.html','gallery/index.html','journal/index.html','about/index.html','search/index.html','legal/index.html','assets/style.css','assets/app.js','assets/snow-white-cover.svg','assets/images/moonlit-castle.webp','assets/images/snow-white-portrait.webp','sitemap.xml','robots.txt','404.html','_build.json'];
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
 const newCoverSource=fs.readFileSync(path.join(root,'assets/images/snow-white-portrait.webp'));
 const newCoverBuilt=fs.readFileSync(path.join(dist,'assets/images/snow-white-portrait.webp'));
 assert.ok(newCoverBuilt.equals(newCoverSource),'generated book-cover image must be copied unchanged to dist');
 const heroSource=fs.readFileSync(path.join(root,'assets/images/moonlit-castle.webp'));
 const heroBuilt=fs.readFileSync(path.join(dist,'assets/images/moonlit-castle.webp'));
 assert.ok(heroBuilt.equals(heroSource),'hero image must be copied unchanged to dist');
 assert.ok(fs.readFileSync(path.join(dist,'index.html'),'utf8').includes('assets/images/moonlit-castle.webp'),'home page must show the castle hero');
 assert.ok(fs.readFileSync(path.join(dist,'stories/dark-snow-white/index.html'),'utf8').includes('assets/images/snow-white-portrait.webp'),'story details must show the generated portrait');
  assert.ok(!/<script\b|\bonload\s*=|https?:\/\//i.test(coverSource.replace('xmlns="http://www.w3.org/2000/svg"','')),'unexpected external or script-backed book asset');
  const novelBook=fs.readFileSync(path.join(dist,'stories/dark-snow-white/index.html'),'utf8');
  const featuredBook=fs.readFileSync(path.join(dist,'index.html'),'utf8');
  for(const text of [novelBook,featuredBook])assert.ok(text.includes('/assets/images/snow-white-portrait.webp'),'original book-cover image missing from public page');
  assert.ok(catalog.stories.find(s=>s.slug==='dark-snow-white')?.cover==='assets/images/snow-white-portrait.webp','published book missing cover catalog property');
 const newManuscripts=[
  ['dark-red-hood','b4b2f3ff4864d140f93882403d382dced8e413ca251df4aad6695c9912698143',16,19,'尾聲：寫在故事之外'],
  ['dark-cinderella','a0fdb50fbabea74dfd398df9550f8de11fdddcf35d130137a78f019448d157e5',13,16,'尾聲：寫在灰燼上的名字'],
  ['dark-aladdin','9cd9d0cc3e45814627a169419de2a3f1f9438b3b0f4fa6ec6899942755d82253',14,16,'終章：如果我們從來沒有遇見'],
  ['dark-mermaid','274d8d687bc047f47e2b944dc5ecabdf956ee463b11beaecea1fa2d725f8dab5',18,20,'終章：獻給那些沒有名字的人'],
  ['dark-mulan','b338aed3beee31d4f21de650348d588ff1bf2471dcabf2a5cea679fcd5c5ed4f',21,23,'尾聲：春天仍然會來']
  ];
  for(const [slug,hash,mainCount,units,ending] of newManuscripts){
   const story=catalog.stories.find(x=>x.slug===slug);
   assert.ok(story&&story.status==='complete'&&story.manuscript==='content/stories/'+slug+'.md','new story catalog entry not published: '+slug);
   assert.equal(story.expectedChapters,mainCount,'wrong chapter metadata: '+slug);
   assert.equal(story.expectedUnits,units,'wrong reading unit metadata: '+slug);
   const raw=fs.readFileSync(path.join(root,story.manuscript),'utf8');
   assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),hash,'original DOCX-derived source altered: '+slug);
   const chapters=loadMarkdownChapters(story.manuscript);
   assert.equal(chapters.length,units,'missing reading unit '+slug);
   assert.equal(chapters.filter(c=>/^第[一二三四五六七八九十百]+章：/.test(c.title)).length,mainCount,'main chapters lost '+slug);
   assert.equal(chapters.at(-1).title,ending,'missing original ending '+slug);
   assert.equal(new Set(chapters.map(c=>c.id)).size,units,'duplicate routes '+slug);
   const index=fs.readFileSync(path.join(dist,'stories',slug,'index.html'),'utf8');
   assert.ok(index.includes(story.title)&&index.includes('內容提示：')&&index.includes('第一章：'),'novel index or warnings missing '+slug);
   assert.ok(index.includes('/stories/'+slug+'/chapters/00/'),'prologue not linked '+slug);
   for(const c of chapters){
    const html=fs.readFileSync(path.join(dist,'stories',slug,'chapters',c.id,'index.html'),'utf8');
    assert.ok(html.includes('class="readerpage manuscript"')&&html.includes(c.title),'missing reader HTML for '+slug+'/'+c.id);
    const escape=p=>p.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    assert.ok(html.includes(escape(c.paragraphs[0])),'first paragraph missing '+slug+'/'+c.id);
    assert.ok(html.includes(escape(c.paragraphs.at(-1))),'last paragraph missing '+slug+'/'+c.id);
   }
  }
  const storyArchive=fs.readFileSync(path.join(dist,'stories/index.html'),'utf8');
  for(const [slug] of newManuscripts)assert.ok(storyArchive.includes('/stories/'+slug+'/'),'missing story archive entry '+slug);
  const globalSearch=fs.readFileSync(path.join(dist,'search/index.html'),'utf8');
  for(const [slug] of newManuscripts)assert.ok(globalSearch.includes('/stories/'+slug+'/'),'missing global search entry '+slug);
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
 console.log('PASS: '+all.length+' pages, 5 new manuscripts / 94 reading units plus 22-part Snow White, content checksums, navigation, UI and Cloudflare config');
})();
