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
const routes=['/','/stories/','/stories/dark-snow-white/','/stories/dark-snow-white/chapters/00/','/tools/','/search/','/gallery/','/games/','/games/blood-mirror/play/','/games/'+JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8')).games[0].slug+'/','/projects/','/projects/aips/','/404.html','/journal/','/journal/origin/','/about/','/legal/','/style-guide/'];
const stories=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8')).stories;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function decodeImages(page){
 const images=page.locator('img');
 for(let i=0;i<await images.count();i++){
  const image=images.nth(i);
  await image.scrollIntoViewIfNeeded();
  await image.evaluate(img=>img.decode());
 }
}

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
    const covers=page.locator('img.book-cover');
    for(let k=0;k<await covers.count();k++){
     await covers.nth(k).scrollIntoViewIfNeeded();
     await covers.nth(k).evaluate(img=>img.decode());
    }
    const result=await page.evaluate(()=>{
     const doc=document.documentElement;
     const images=[...document.querySelectorAll('img.book-cover')];
     return {width:window.innerWidth,documentWidth:doc.scrollWidth,bodyWidth:document.body.scrollWidth,lang:doc.lang,main:!!document.querySelector('#main'),badImages:images.filter(i=>!i.complete||i.naturalWidth===0).length};
    });
    assert.equal(result.lang,'zh-Hant','wrong document language at '+route);
    assert.ok(result.main,'missing main landmark '+route);
    assert.ok(Math.max(result.documentWidth,result.bodyWidth)<=result.width+2,'horizontal overflow at '+width+'px '+route+' doc='+result.documentWidth+' body='+result.bodyWidth);
    assert.equal(result.badImages,0,'cover image failed to load at '+width+'px '+route);
    if(route==='/projects/aips/')assert.equal(await page.getByRole('link',{name:'閱讀 AIPS 說明文件'}).getAttribute('href'),'https://lucaslu3918.github.io/ai-product-system/');
    if(route==='/'){
     const heroImage=await page.locator('.hero-art').evaluate(async img=>{await img.decode();return {loaded:img.naturalWidth>0,width:img.naturalWidth}});
     assert.ok(heroImage.loaded&&heroImage.width===1536,'castle hero image failed to load at '+width+'px');
    }
    inspected++;
   }
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
   const menu=page.locator('[data-menu]');
   if(width<=920){
    assert.ok(await menu.isVisible(),'menu hidden at mobile/tablet '+width);
    await menu.click();
    assert.equal(await menu.getAttribute('aria-expanded'),'true','mobile menu did not open at '+width);
    assert.ok(await page.locator('#site-nav').isVisible(),'expanded menu not visible at '+width);
    assert.equal(await menu.locator('svg.icon').count(),1,'menu must use a visible shared icon');
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
    const featureCover=page.locator('.feature .cover-visual img');
    assert.equal(await featureCover.getAttribute('loading'),'eager','featured cover should have priority loading');
    await decodeImages(page);
    assert.ok(await featureCover.evaluate(img=>img.naturalWidth>0&&Math.abs(img.naturalWidth/img.naturalHeight-2/3)<0.01),'featured cover failed to decode at '+width);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForFunction(()=>window.scrollY===0);
    await page.screenshot({path:path.join(captures,'home-'+width+'.png'),fullPage:true,animations:'disabled'});
    await page.goto(origin+'/stories/dark-snow-white/',{waitUntil:'domcontentloaded'});
    await decodeImages(page);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForFunction(()=>window.scrollY===0);
    await page.screenshot({path:path.join(captures,'novel-'+width+'.png'),fullPage:true,animations:'disabled'});
   }
   if(width===390||width===1440){
    for(const story of stories){
     await page.goto(origin+'/stories/'+story.slug+'/',{waitUntil:'load'});
     const image=page.locator('.cover .book-cover');await image.evaluate(img=>img.decode());
     const dimensions=await image.evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight,renderWidth:img.clientWidth,renderHeight:img.clientHeight,alt:img.alt}));
     assert.ok(Math.abs(dimensions.width/dimensions.height-2/3)<0.01,'wrong source cover ratio for '+story.slug);
     assert.ok(Math.abs(dimensions.renderWidth/dimensions.renderHeight-2/3)<0.01,'cover is cropped for '+story.slug+' at '+width);
     assert.equal(dimensions.alt,story.coverAlt,'wrong story alt '+story.slug);
    }
    await page.goto(origin+'/stories/',{waitUntil:'load'});
    await decodeImages(page);await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:path.join(captures,'library-'+width+'.png'),fullPage:true,animations:'disabled'});
    const filter=page.locator('[data-filter="黑暗童話"]');const before=await filter.boundingBox();await filter.click();const after=await filter.boundingBox();
    assert.equal(Math.round(before.height),Math.round(after.height),'selected filter shifts height');
    assert.equal(Math.round(before.width),Math.round(after.width),'selected filter shifts width');
    assert.equal(await page.locator('[data-item]:visible').count(),5,'story category filter returns incorrect books');
    await page.locator('[data-search]').fill('不存在的書名');assert.ok(await page.locator('[data-empty]').isVisible(),'search empty state absent');
   }
   if(width===390){
    await page.goto(origin+'/gallery/',{waitUntil:'domcontentloaded'});
    await page.locator('[data-preview]').first().click();
    assert.ok(await page.locator('#gallery-dialog').evaluate(el=>el.open),'gallery dialog did not open');
    await page.locator('#gallery-dialog img').evaluate(img=>img.decode());
    await page.screenshot({path:path.join(captures,'gallery-dialog-390.png'),animations:'disabled'});
    await page.locator('[data-dialog-close]').click();
    assert.ok(!(await page.locator('#gallery-dialog').evaluate(el=>el.open)),'gallery dialog did not close');
    await page.locator('[data-preview]').last().click();assert.equal(await page.locator('#gallery-dialog .visual svg').count(),1,'concept art was not cloned into dialog');
    await page.keyboard.press('Escape');assert.ok(!(await page.locator('#gallery-dialog').evaluate(el=>el.open)),'dialog Escape failed');
    await page.goto(origin+'/stories/mist-letters/chapters/01/',{waitUntil:'load'});
    await page.locator('[data-theme="paper"]').click();
    for(let step=0;step<10;step++){if(await page.locator('[data-font="1"]').isEnabled())await page.locator('[data-font="1"]').click()}
    assert.equal(await page.locator('[data-size]').textContent(),'24px');assert.ok(await page.locator('[data-font="1"]').isDisabled(),'font limit remains enabled');
    for(let step=0;step<10;step++){if(await page.locator('[data-font="-1"]').isEnabled())await page.locator('[data-font="-1"]').click()}
    assert.equal(await page.locator('[data-size]').textContent(),'16px');assert.ok(await page.locator('[data-font="-1"]').isDisabled(),'font minimum remains enabled');
    await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
    await page.waitForFunction(()=>document.querySelector('[data-reading-progress]').value===100);
    await page.locator('[data-chapter-select]').selectOption('/stories/mist-letters/chapters/02/');
    await page.waitForURL('**/stories/mist-letters/chapters/02/');
    await page.screenshot({path:path.join(captures,'reader-390.png'),fullPage:true,animations:'disabled'});
   }
   if(width===390||width===1440){
    for(const route of routes){
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
  console.log('Chromium screenshots: '+captures+' (home, novel, library, reader and gallery states)');
 }finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
 }
}
audit().catch(error=>{console.error(error.stack||error);process.exitCode=1});
