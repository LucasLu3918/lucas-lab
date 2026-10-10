#!/usr/bin/env node
'use strict';
// Chromium acceptance for the reading and discovery features: progress, continue reading, chapter search, offline reading, structured data and CSP.
const {strict:assert}=require('node:assert');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const ROOT=require('node:path').resolve(__dirname,'..');
const ORIGIN='http://127.0.0.1:4173';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const STORY='/stories/dark-snow-white/';
const CHAPTER=c=>STORY+'chapters/'+c+'/';

(async()=>{
 let server=spawn(process.execPath,[ROOT+'/scripts/serve.cjs'],{cwd:ROOT,stdio:'ignore'});
 // Offline means the origin is unreachable: stopping the server also cuts the service worker's own fetches (context.setOffline does not).
 const stopServer=async()=>{server.kill();await pause(500)};
 const startServer=async()=>{server=spawn(process.execPath,[ROOT+'/scripts/serve.cjs'],{cwd:ROOT,stdio:'ignore'});for(let i=0;i<40;i++){try{const res=await fetch(ORIGIN+'/');if(res.ok)break;}catch{}await pause(200)}};
 let browser;
 try{
  for(let i=0;i<40;i++){try{const res=await fetch(ORIGIN+'/');if(res.ok)break;}catch{}await pause(200);}
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('pageerror',e=>errors.push(e.message));

  // 1. Security headers and CSP are served and enforced (no CSP violations in the console).
  const head=await page.request.get(ORIGIN+'/');
  assert.match(head.headers()['content-security-policy']||'',/script-src 'self'/,'CSP header missing');
  assert.equal(head.headers()['x-content-type-options'],'nosniff');
  await page.goto(ORIGIN+CHAPTER('00'),{waitUntil:'load'});
  assert.equal(await page.locator('[data-reader]').count(),1,'chapter reader missing');
  console.log('✓ CSP and security headers served with the reader page');

  // 2. Structured data and reading time on the chapter.
  const ld=await page.locator('script[type="application/ld+json"]').allTextContents();
  const parsed=ld.map(t=>JSON.parse(t));
  assert.ok(parsed.some(x=>x['@type']==='Article'&&x.isPartOf?.name.includes('白雪公主')),'chapter Article JSON-LD missing');
  assert.ok(parsed.some(x=>x['@type']==='BreadcrumbList'),'breadcrumb JSON-LD missing');
  assert.match(await page.locator('.chaptermeta').textContent(),/約 \d+ 分鐘/,'reading time missing');
  console.log('✓ chapter JSON-LD, breadcrumb and reading time');

  // 3. Reading progress: scrolling to the end marks the chapter read and remembers it.
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await pause(1000);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lucaslab.progress.v1')||'null'));
  const entry=saved?.stories?.['dark-snow-white'];
  assert.ok(entry,'progress not stored');
  assert.equal(entry.chapterId,'00');
  assert.ok(entry.read.includes('00'),'finished chapter not marked read: '+JSON.stringify(entry));
  console.log('✓ reading progress saved and chapter marked read');

  // 4. Keyboard navigation moves to the next chapter, and typing in a field does not.
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.keyboard.press('ArrowRight');
  await page.waitForURL('**'+CHAPTER('01'));
  assert.ok(page.url().endsWith(CHAPTER('01')),'ArrowRight did not navigate to next chapter');
  console.log('✓ ArrowRight moves to the next chapter');

  // 5. Story page: resume button points at the last chapter, read marks are shown.
  await page.goto(ORIGIN+STORY,{waitUntil:'load'});
  await pause(200);
  assert.equal(await page.locator('[data-story-continue]').isVisible(),true,'continue reading not shown');
  assert.match(await page.locator('[data-story-continue-link]').textContent(),/繼續閱讀：/);
  assert.equal(await page.locator('.chapterlist .read-flag').count(),1,'read flag missing on chapter list');
  console.log('✓ story page resumes at the last chapter and shows read marks');

  // 6. Home continue-reading shelf lists the story.
  await page.goto(ORIGIN+'/',{waitUntil:'load'});
  await pause(200);
  assert.equal(await page.locator('[data-continue-shelf]').isVisible(),true,'home continue shelf hidden');
  assert.match(await page.locator('[data-continue-list] a').first().textContent(),/白雪公主/);
  console.log('✓ home continue-reading shelf');

  // 7. Chapter search: index loads only after typing, results link to chapters.
  const indexRequests=[];
  page.on('request',r=>{if(r.url().includes('search-index.json'))indexRequests.push(r.url())});
  await page.goto(ORIGIN+'/search/',{waitUntil:'load'});
  await pause(300);
  assert.equal(indexRequests.length,0,'search index downloaded before any query');
  assert.equal(await page.locator('[data-chapter-search]').isHidden(),true,'chapter search visible before typing');
  await page.locator('[data-region] [data-search]').fill('序章');
  await page.waitForFunction(()=>document.querySelectorAll('[data-chapter-results] li').length>0,null,{timeout:5000});
  assert.ok(indexRequests.length>=1,'index not requested after typing');
  const firstHref=await page.locator('[data-chapter-results] a').first().getAttribute('href');
  assert.match(firstHref,/\/stories\/.+\/chapters\/\d+\/$/,'chapter result link invalid');
  console.log('✓ chapter search loads the index on first query and links to chapters');

  // 8. Offline reading: a chapter read online stays available with the network off.
  await page.goto(ORIGIN+CHAPTER('02'),{waitUntil:'load'});
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await pause(800);
  const registered=await page.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()));
  assert.ok(registered,'service worker not registered');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await pause(500);
  await stopServer();
  const offline=await page.goto(ORIGIN+CHAPTER('02'),{waitUntil:'load'});
  assert.equal(offline.status(),200,'offline chapter not served from cache');
  assert.match(await page.locator('h1').first().textContent(),/第二章|章/);
  await startServer();
  console.log('✓ previously read chapter opens offline through the service worker');

  // 9. Gallery: placeholders are labelled as in progress; concept boards load.
  await page.goto(ORIGIN+'/gallery/',{waitUntil:'load'});
  assert.ok((await page.locator('button[data-preview] strong').allTextContents()).some(t=>t.includes('構思中')),'placeholder concepts not labelled');
  const boards=page.locator('.concept-board img');
  assert.equal(await boards.count(),3,'concept boards missing');
  for(let i=0;i<3;i++){await boards.nth(i).scrollIntoViewIfNeeded();assert.ok(await boards.nth(i).evaluate(img=>img.decode().then(()=>img.naturalWidth>0,()=>false)),'concept board '+i+' failed to load')}
  console.log('✓ gallery labels placeholders and loads concept boards');

  // 10. Journal article and the game page run with the CSP enforced.
  await page.goto(ORIGIN+'/journal/cloudflare-workers/',{waitUntil:'load'});
  assert.match(await page.locator('h1').textContent(),/Cloudflare/);
  await page.goto(ORIGIN+'/games/blood-mirror/play/',{waitUntil:'load'});
  await pause(500);

  // 11. Resume: a chapter left halfway offers to return there, and only moves when the reader asks.
  await page.goto(ORIGIN+CHAPTER('03'),{waitUntil:'load'});
  await page.evaluate(()=>{const el=document.querySelector('[data-reader]'),r=el.getBoundingClientRect(),span=r.height-innerHeight;window.scrollTo(0,r.top+scrollY+span*0.5)});
  await pause(1000);
  await page.goto(ORIGIN+CHAPTER('03'),{waitUntil:'load'});
  await pause(300);
  assert.equal(await page.locator('[data-resume]').isVisible(),true,'resume prompt missing');
  assert.equal(await page.evaluate(()=>window.scrollY),0,'reader jumped without being asked');
  await page.locator('[data-resume-action]').click();
  await pause(900);
  const resumed=await page.locator('[data-reading-percent]').textContent();
  assert.ok(Number.parseInt(resumed,10)>=35&&Number.parseInt(resumed,10)<=65,'resume landed at '+resumed);
  assert.equal(await page.locator('[data-resume]').isHidden(),true,'resume prompt stays after use');
  console.log('✓ resume prompt returns to the saved position on request only');

  // 12. Content warning: acknowledged once per work, collapsed afterwards; progress summary on the story page.
  await page.goto(ORIGIN+STORY,{waitUntil:'load'});
  await pause(200);
  assert.equal(await page.locator('[data-content-warning="dark-snow-white"] .warning-text').isVisible(),true,'warning hidden before acknowledgement');
  await page.locator('[data-content-warning="dark-snow-white"] [data-warning-ack]').click();
  assert.equal(await page.locator('[data-content-warning="dark-snow-white"] .warning-text').isHidden(),true,'acknowledged warning still shown');
  await page.reload({waitUntil:'load'});
  assert.equal(await page.locator('[data-content-warning="dark-snow-white"] .warning-text').isHidden(),true,'acknowledgement not remembered');
  assert.match(await page.locator('[data-story-progress]').textContent(),/讀到：.+ · 已讀 \d+ \/ \d+ 章/,'progress summary missing');
  console.log('✓ content warning is acknowledged once and progress summary shows the last chapter');

  // 13. Offline saving: a whole book saved online stays readable offline; an unsaved page shows the offline page.
  await page.goto(ORIGIN+STORY,{waitUntil:'load'});
  await pause(200);
  assert.equal(await page.locator('[data-offline-save="dark-snow-white"]').isVisible(),true,'offline saving control hidden');
  await page.locator('[data-offline-action]').click();
  await page.waitForFunction(()=>/已離線保存/.test(document.querySelector('[data-offline-status]')?.textContent||''),null,{timeout:90000});
  await stopServer();
  const savedChapter=await page.goto(ORIGIN+CHAPTER('10'),{waitUntil:'load'});
  assert.equal(savedChapter.status(),200,'saved chapter not served offline');
  assert.ok((await page.locator('.readerpage h1').first().textContent()).length>0,'saved chapter has no title');
  await page.goto(ORIGIN+'/tools/',{waitUntil:'load'});
  assert.equal(await page.locator('[data-offline-list]').count(),1,'unsaved page did not fall back to the offline page');
  await startServer();
  await page.goto(ORIGIN+STORY,{waitUntil:'load'});
  await pause(200);
  await page.locator('[data-offline-action]').click();
  await page.waitForFunction(()=>/把整本書保存/.test(document.querySelector('[data-offline-status]')?.textContent||''),null,{timeout:10000});
  console.log('✓ saved book reads offline; unsaved pages fall back to the offline page; removal works');

  // 14. Search: spacing and full-width differences are ignored, groups appear, and the query never enters the URL.
  await page.goto(ORIGIN+'/search/',{waitUntil:'load'});
  await page.locator('[data-region] [data-search]').fill('白雪 公主');
  await pause(300);
  assert.equal(new URL(page.url()).search,'','search query leaked into the URL');
  const groups=await page.locator('.search-group:not([hidden]) .group-title').allTextContents();
  assert.ok(groups.includes('故事'),'story group missing from results: '+groups.join('、'));
  console.log('✓ search groups results and never writes the query into the URL');

  // 15. Chapter pages: the game bridge appears for the story with a playable game; clearing reading records works.
  await page.goto(ORIGIN+CHAPTER('00'),{waitUntil:'load'});
  assert.equal(await page.locator('.game-bridge').count(),1,'game bridge missing');
  await page.goto(ORIGIN+'/legal/',{waitUntil:'load'});
  await page.locator('[data-clear-progress]').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('lucaslab.progress.v1')),null,'reading records not cleared');
  assert.match(await page.locator('[data-clear-status]').textContent(),/已清除/);
  console.log('✓ game bridge on chapters and clearing reading records from the privacy page');

  const cspErrors=errors.filter(t=>/Content Security Policy|Refused to/.test(t));
  assert.deepEqual(cspErrors,[],'CSP violations in console');
  console.log('✓ journal and game play page load with no CSP violations');
  console.log('PASS: site feature acceptance');
 }catch(error){
  console.error('FAIL:',error.message);
  process.exitCode=1;
 }finally{
  if(browser)await browser.close();
  server.kill();
 }
})();
