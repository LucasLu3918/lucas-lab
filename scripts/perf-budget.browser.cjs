#!/usr/bin/env node
'use strict';
// Chromium performance budget: transfer size, request count, LCP and CLS per key route at phone and desktop widths.
// Budgets are set from measured values with headroom (see docs/design/SITE_OPTIMIZATION_PLAN.md); raise one only with a recorded reason.
const {strict:assert}=require('node:assert');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const ROOT=require('node:path').resolve(__dirname,'..');
const ORIGIN='http://127.0.0.1:4173';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const KB=1024;

// Initial-load budgets in bytes (document + every same-origin resource requested before load and 1 s of idle).
// Measured after the 2026-10-10 optimisation pass (worst of 390px and 1440px) plus about 20% headroom.
const BUDGETS=[
 {route:'/',maxBytes:280*KB,maxRequests:12},
 {route:'/stories/dark-snow-white/',maxBytes:85*KB,maxRequests:8},
 {route:'/stories/dark-snow-white/chapters/00/',maxBytes:60*KB,maxRequests:7},
 {route:'/search/',maxBytes:330*KB,maxRequests:14},
 {route:'/games/blood-mirror/play/',maxBytes:1550*KB,maxRequests:30}
];
const WIDTHS=[390,1440];

(async()=>{
 const server=spawn(process.execPath,[ROOT+'/scripts/serve.cjs'],{cwd:ROOT,stdio:'ignore'});
 let browser;
 const report=[];
 try{
  for(let i=0;i<40;i++){try{const res=await fetch(ORIGIN+'/');if(res.ok)break;}catch{}await pause(200);}
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
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
