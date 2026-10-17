#!/usr/bin/env node
'use strict';
const {startPreviewServer,launchChromium}=require('./browser-harness.cjs');
// Chromium performance budget: transfer size, request count, LCP and CLS per key route at phone and desktop widths.
// Budgets are set from measured values with headroom (see docs/design/SITE_OPTIMIZATION_PLAN.md); raise one only with a recorded reason.
const {strict:assert}=require('node:assert');
const ROOT=require('node:path').resolve(__dirname,'..');
const ORIGIN='http://127.0.0.1:4173';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const KB=1024;

// Initial-load budgets in bytes (document + every same-origin resource requested before load and 1 s of idle).
// Measured after the 2026-10-10 optimisation pass (worst of 390px and 1440px) plus about 20% headroom.
const BUDGETS=[
 // Raised on 2026-10-12 (home 280→300 KB, search 330→350 KB): self-hosted heading font slice (13 KB on home) and project screenshots.
 {route:'/',maxBytes:300*KB,maxRequests:13},
 // Raised on 2026-10-12 (story 85→95 KB, chapter 60→72 KB): the shared icon, gallery and music styles and scripts from
 // PR #30 grew style.css + app.js by about 9 KB, bringing these pages to 89 KB and 67 KB.
 // Raised on 2026-10-15 (story 95→100 KB, chapter 72→78 KB): the brand mark is now a detailed compass, drawn inline in the header
 // on every page and reused as the favicon (about 3 KB per page). The same favicon is fetched once, so it is not counted twice.
 {route:'/stories/dark-snow-white/',maxBytes:100*KB,maxRequests:8},
 {route:'/stories/dark-snow-white/chapters/00/',maxBytes:78*KB,maxRequests:7},
 {route:'/search/',maxBytes:350*KB,maxRequests:15},
 // The game ships as native ES modules (no bundler, plan §9.1). Puzzle stages and the credits load on demand, so the
 // first screen makes 43 requests (2026-10-13), with all modal markup in one module. The budget of 45 leaves room for one new eager module; a larger jump fails.
 {route:'/games/blood-mirror/play/',maxBytes:1550*KB,maxRequests:45},
 // Added 2026-10-17 (Fortune Hub P4). Measured 226 KB and 16 requests at both widths, plus about 20% headroom. Before the lunar-javascript
 // chunk was split out (vite.config.mts), the hub also downloaded that 300 KB library through a shared runtime helper.
 {route:'/divination/',maxBytes:272*KB,maxRequests:19},
 // Added 2026-10-17 with a height reservation for each island (assets/style.css). Measured at 390 and 1440 px with about 20% headroom:
 // horoscope 191 KB / 14 requests, numerology 185 KB / 12, ziwei 493 KB / 14 (lunar-javascript), bazi 496 KB / 15, astrology 266 KB / 13.
 {route:'/horoscope/',maxBytes:230*KB,maxRequests:17},
 {route:'/numerology/',maxBytes:225*KB,maxRequests:15},
 {route:'/ziwei/',maxBytes:600*KB,maxRequests:17},
 {route:'/bazi/',maxBytes:600*KB,maxRequests:18},
 {route:'/astrology/',maxBytes:320*KB,maxRequests:16},
 // Added 2026-10-17 with the Meihua Yishu island. Measured in visual-audit on PR #118 (commit c6401c8): 495 KB and 14 requests at both widths,
 // plus about 20% headroom. lunar-javascript (306 KB raw) is shared with bazi and ziwei.
 {route:'/meihua/',maxBytes:600*KB,maxRequests:17},
 // Added 2026-10-17 with the Liuyao island. Measured 497 KB and 12 requests at both widths, the same lunar-javascript chunk as bazi and ziwei.
 {route:'/liuyao/',maxBytes:600*KB,maxRequests:17},
 {route:'/qimen/',maxBytes:600*KB,maxRequests:17},
 // Added 2026-10-17 with the tarot prerender (tarot-ssr.ts): the first markup is in the static page, so the island mounts without a shift.
 // Measured 527 KB and 23 requests at both widths, plus about 20% headroom.
 {route:'/tarot/',maxBytes:640*KB,maxRequests:28}
];
const WIDTHS=[390,1440];

(async()=>{
 const server=startPreviewServer(ROOT);
 let browser;
 const report=[];
 try{
  for(let i=0;i<40;i++){try{const res=await fetch(ORIGIN+'/');if(res.ok)break;}catch{}await pause(200);}
  browser=await launchChromium();
  for(const width of WIDTHS)for(const budget of BUDGETS){
   const context=await browser.newContext({viewport:{width,height:844},hasTouch:width<600,isMobile:width<600,reducedMotion:'reduce'});
   const page=await context.newPage();
   await page.addInitScript(()=>{window.__vitals={lcp:0,cls:0};new PerformanceObserver(list=>{for(const e of list.getEntries())window.__vitals.lcp=Math.max(window.__vitals.lcp,e.startTime)}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__vitals.cls+=e.value}).observe({type:'layout-shift',buffered:true})});
   const mp3=[];page.on('request',r=>{if(/\.mp3($|\?)/.test(r.url()))mp3.push(r.url())});
   const response=await page.goto(ORIGIN+budget.route,{waitUntil:'load'});
   assert.equal(response.status(),200,'route did not load: '+budget.route);
   await pause(1000);
   const metrics=await page.evaluate(()=>{
    const resources=performance.getEntriesByType('resource');
    const nav=performance.getEntriesByType('navigation')[0];
    const bytes=(nav?.encodedBodySize||0)+resources.reduce((sum,r)=>sum+(r.encodedBodySize||0),0);
    return {bytes,requests:resources.length+1,lcp:Math.round(window.__vitals.lcp),cls:Number(window.__vitals.cls.toFixed(4))};
   });
   report.push({width,route:budget.route,kb:Math.round(metrics.bytes/KB),requests:metrics.requests,lcpMs:metrics.lcp,cls:metrics.cls});
   assert.ok(metrics.bytes<=budget.maxBytes,`${budget.route} @${width}px transfers ${Math.round(metrics.bytes/KB)} KB, budget ${Math.round(budget.maxBytes/KB)} KB`);
   assert.ok(metrics.requests<=budget.maxRequests,`${budget.route} @${width}px makes ${metrics.requests} requests, budget ${budget.maxRequests}`);
   assert.ok(metrics.cls<=0.1,`${budget.route} @${width}px layout shift ${metrics.cls} exceeds 0.1`);
   if(budget.route.includes('/games/'))assert.deepEqual(mp3,[],'background music must not download before the player starts it');
   await context.close();
  }
  console.table(report);
  console.log('PASS: performance budgets');
 }catch(error){
  console.table(report);
  console.error('FAIL:',error.message);
  process.exitCode=1;
 }finally{
  if(browser)await browser.close();
  server.kill();
 }
})();
