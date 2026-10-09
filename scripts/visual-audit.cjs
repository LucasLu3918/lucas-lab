#!/usr/bin/env node
'use strict';
// Deterministic Chromium layout + keyboard/touch functional smoke, against locally built pages.
// These emulated viewports are NOT a substitute for physical iOS/Android/Safari testing.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const root=path.resolve(__dirname,'..');
const captures=path.join(root,'visual-audit-artifacts');
const origin='http://127.0.0.1:4173';
const widths=[320,360,390,480,720,768,900,1024,1440];
const routes=['/','/stories/','/stories/dark-snow-white/','/stories/dark-snow-white/chapters/00/','/tools/','/search/','/gallery/'];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function ready(){
 for(let i=0;i<40;i++){
  try{const r=await fetch(origin+'/',{signal:AbortSignal.timeout(1000)});if(r.ok)return}
  catch{}
  await sleep(250);
 }
 throw new Error('Local preview server did not start');
}
async function audit(){
 const server=spawn(process.execPath,[path.join(root,'scripts','serve.cjs')],{cwd:root,stdio:'ignore'});
 let browser;
 try{
  await ready();
  fs.mkdirSync(captures,{recursive:true});
  browser=await chromium.launch({headless:true});
  let inspected=0;
  for(const width of widths){
   const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,hasTouch:width<=920,isMobile:width<=480,reducedMotion:'reduce'});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   for(const route of routes){
    const response=await page.goto(origin+route,{waitUntil:'load'});
    assert.equal(response.status(),200,width+' '+route+' did not respond 200');
    const covers=page.locator('img[src*="snow-white-cover.svg"]');
    for(let k=0;k<await covers.count();k++){
     await covers.nth(k).scrollIntoViewIfNeeded();
     await covers.nth(k).evaluate(img=>img.decode());
    }
    const result=await page.evaluate(()=>{
     const doc=document.documentElement;
     const images=[...document.images].filter(img=>img.getAttribute('src')?.includes('snow-white-cover.svg'));
     return {width:window.innerWidth,documentWidth:doc.scrollWidth,bodyWidth:document.body.scrollWidth,lang:doc.lang,main:!!document.querySelector('#main'),badImages:images.filter(i=>!i.complete||i.naturalWidth===0).length};
    });
    assert.equal(result.lang,'zh-Hant','wrong document language at '+route);
    assert.ok(result.main,'missing main landmark '+route);
    assert.ok(Math.max(result.documentWidth,result.bodyWidth)<=result.width+2,'horizontal overflow at '+width+'px '+route+' doc='+result.documentWidth+' body='+result.bodyWidth);
    assert.equal(result.badImages,0,'cover image failed to load at '+width+'px '+route);
    inspected++;
   }
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
   const menu=page.locator('[data-menu]');
   if(width<=920){
    assert.ok(await menu.isVisible(),'menu hidden at mobile/tablet '+width);
    await menu.click();
    assert.equal(await menu.getAttribute('aria-expanded'),'true','mobile menu did not open at '+width);
    assert.ok(await page.locator('#site-nav').isVisible(),'expanded menu not visible at '+width);
    await page.keyboard.press('Escape');
    assert.equal(await menu.getAttribute('aria-expanded'),'false','menu Escape handling broken at '+width);
    assert.ok(await menu.evaluate(e=>e===document.activeElement),'menu focus not restored at '+width);
   }else{
    assert.ok(!(await menu.isVisible()),'desktop menu button shown at '+width);
    assert.ok(await page.locator('#site-nav').isVisible(),'desktop links not visible at '+width);
   }
   await page.goto(origin+'/search/',{waitUntil:'domcontentloaded'});
   await page.locator('[data-search]').fill('白雪');
   assert.ok(await page.locator('[data-item]:visible').count()>0,'full story absent from search at '+width);
   await page.locator('[data-search]').fill('翻譯');
   assert.ok(await page.locator('a[href^="https://lucas-tools.owl3918.workers.dev/"]:visible').count()>0,'Lucas Tools absent from search at '+width);
   await page.goto(origin+'/stories/dark-snow-white/chapters/00/',{waitUntil:'domcontentloaded'});
   const reader=page.locator('[data-reader]');
   await page.locator('[data-theme="night"]').click();
   assert.ok(await reader.evaluate(el=>el.classList.contains('night')),'night mode not applied at '+width);
   await page.locator('[data-font="1"]').click();
   assert.equal(await page.locator('[data-size]').textContent(),'19px','font-size control failed at '+width);
   assert.ok(await page.locator('.chapternav a[href*="/chapters/01/"]').count()>0,'next-chapter link missing at '+width);
   if([390,768,1440].includes(width)){
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await page.screenshot({path:path.join(captures,'home-'+width+'.png'),fullPage:true,animations:'disabled'});
    await page.goto(origin+'/stories/dark-snow-white/',{waitUntil:'domcontentloaded'});
    await page.screenshot({path:path.join(captures,'novel-'+width+'.png'),fullPage:true,animations:'disabled'});
   }
   if(width===390){
    await page.goto(origin+'/gallery/',{waitUntil:'domcontentloaded'});
    await page.locator('[data-preview]').first().click();
    assert.ok(await page.locator('#gallery-dialog').evaluate(el=>el.open),'gallery dialog did not open');
    await page.locator('[data-dialog-close]').click();
    assert.ok(!(await page.locator('#gallery-dialog').evaluate(el=>el.open)),'gallery dialog did not close');
   }
   if(width===390||width===1440){
    for(const route of ['/','/stories/dark-snow-white/','/stories/dark-snow-white/chapters/00/','/search/']){
     await page.goto(origin+route,{waitUntil:'load'});
     const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
     const violations=result.violations.map(v=>v.id+' ('+v.impact+'): '+v.nodes.slice(0,4).map(n=>n.target.join(' ')).join(', ')).join('; ');
     assert.equal(result.violations.length,0,'WCAG accessibility violations at '+width+' '+route+': '+violations);
    }
   }
   assert.deepEqual(errors,[],'browser JavaScript errors at '+width);
   await context.close();
  }
  console.log('PASS: '+inspected+' page/viewport renders, cover images, no horizontal overflow, menu keyboard and touch, global search, reader controls, gallery dialog, WCAG axe audits');
  console.log('Chromium screenshots: '+captures+' (3 home + 3 full-novel layouts)');
 }finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
 }
}
audit().catch(error=>{console.error(error.stack||error);process.exitCode=1});
