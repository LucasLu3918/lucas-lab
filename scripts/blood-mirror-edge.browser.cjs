#!/usr/bin/env node
'use strict';
// Off-screen hotspots on a phone-width scene: a panned 16:9 frame hides hotspots past its edges, so each side shows a
// count chip. Checks: phones show the chips with counts, tapping one pans and lowers the count, and a desktop frame,
// which fits the screen, shows no chips.
const assert=require('node:assert/strict');
const {launchChromium,startPreviewServer}=require('./browser-harness.cjs');
const ROOT=require('node:path').resolve(__dirname,'..'),origin='http://127.0.0.1:4173';
const pause=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 const server=startPreviewServer(ROOT);let browser;
 try{
  for(let i=0;i<40;i++){try{if((await fetch(origin+'/')).ok)break;}catch{}await pause(200);}
  browser=await launchChromium();
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/games/blood-mirror/play/');
   await page.locator('#start').click();
   await page.locator('#prologue-skip').click();
   await page.locator('#intro-explore').click();
   await page.locator('#hotspots [data-spot]').first().waitFor();
   await pause(150);
   const chips=()=>page.evaluate(()=>({left:document.querySelector('#hint-left').hidden?null:document.querySelector('#hint-left').textContent,right:document.querySelector('#hint-right').hidden?null:document.querySelector('#hint-right').textContent}));
   const count=text=>text?Number(text.match(/(\d+) 處/)[1]):0;
   const before=await chips();
   if(width<600){
    assert.ok(before.left||before.right,'a phone scene shows a chip for hotspots past an edge');
    const side=before.right?'right':'left';
    const beforeCount=count(before[side]);
    await page.locator('#hint-'+side).click();
    await pause(120);
    const after=await chips();
    assert.ok(count(after[side])<beforeCount,'tapping the '+side+' chip pans and lowers its count ('+beforeCount+' → '+count(after[side])+')');
    // The hotspot that was counted is now inside the visible scene.
    const visibleHotspots=await page.evaluate(()=>{const s=document.querySelector('#scene').getBoundingClientRect();return [...document.querySelectorAll('#hotspots [data-spot]:not(.seen)')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.right>=s.left&&r.left<=s.right;}).length;});
    assert.ok(visibleHotspots>0,'some unseen hotspot is visible after panning');
    console.log('✓ off-screen hotspots: '+side+' chip "'+before[side]+'" pans to "'+after[side]+'" ('+width+'px)');
   }else{
    assert.equal(before.left,null,'no left chip on a desktop frame');
    assert.equal(before.right,null,'no right chip on a desktop frame');
    console.log('✓ off-screen hotspots: no chips on the desktop frame ('+width+'px)');
   }
   assert.deepEqual(errors,[],'no page errors at '+width);
   await context.close();
  }
 }finally{
  if(browser)await browser.close();
  server.kill();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
