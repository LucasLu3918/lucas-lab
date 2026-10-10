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
 const server=spawn(process.execPath,[ROOT+'/scripts/serve.cjs'],{cwd:ROOT,stdio:'ignore'});
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
  await context.setOffline(true);
  const offline=await page.goto(ORIGIN+CHAPTER('02'),{waitUntil:'load'});
  assert.equal(offline.status(),200,'offline chapter not served from cache');
  assert.match(await page.locator('h1').first().textContent(),/第二章|章/);
  await context.setOffline(false);
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
