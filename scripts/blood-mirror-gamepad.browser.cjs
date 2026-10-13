#!/usr/bin/env node
'use strict';
// Gamepad navigation (手把導覽) in a real page. Chromium has no virtual pad, so the page gets a fake one whose buttons
// the test sets, then a gamepadconnected event starts the module. Checks: Start opens the pause menu, B closes it,
// the d-pad reaches a scene hotspot (panning a phone frame to show it), A opens that hotspot, B returns focus.
const assert=require('node:assert/strict');
const {launchChromium,startPreviewServer}=require('./browser-harness.cjs');
const ROOT=require('node:path').resolve(__dirname,'..'),origin='http://127.0.0.1:4173';
const BUTTON={A:0,B:1,START:9,UP:12,DOWN:13,LEFT:14,RIGHT:15};
const pause=ms=>new Promise(r=>setTimeout(r,ms));

// Installed before the page scripts run: navigator.getGamepads returns one pad whose state the test drives.
const fakePad=()=>{
 window.__pad={id:'fake',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
 Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__pad]});
};

(async()=>{
 const server=startPreviewServer(ROOT);let browser;
 try{
  for(let i=0;i<40;i++){try{if((await fetch(origin+'/')).ok)break;}catch{}await pause(200);}
  browser=await launchChromium();
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'});
   await context.addInitScript(fakePad);
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/games/blood-mirror/play/');
   await page.locator('#start').click();
   await page.locator('#prologue-skip').click();
   await page.locator('#intro-explore').click();
   // The pad connects after the page has loaded; the module is imported on this event.
   await page.evaluate(()=>window.dispatchEvent(new Event('gamepadconnected')));
   // One press: hold for one frame, release for one frame, so the module sees a clean button edge.
   const press=async(button)=>{
    await page.evaluate(i=>{window.__pad.buttons[i].pressed=true;},button);
    await pause(60);
    await page.evaluate(i=>{window.__pad.buttons[i].pressed=false;},button);
    await pause(60);
   };
   const modalOpen=()=>page.evaluate(()=>document.querySelector('#modal').open);
   const modalTitle=()=>page.evaluate(()=>document.querySelector('#modal-title').textContent);

   // Start opens the pause menu on the scene; B backs out.
   await press(BUTTON.START);
   await page.waitForFunction(()=>document.querySelector('#modal').open);
   assert.equal(await modalTitle(),'暫停','Start opens the pause menu at '+width);
   await press(BUTTON.B);
   assert.equal(await modalOpen(),false,'B closes the pause menu at '+width);

   // The d-pad walks the scene's controls; keep pressing until focus lands on a hotspot (in another view if needed).
   const route=[BUTTON.RIGHT,BUTTON.RIGHT,BUTTON.DOWN,BUTTON.RIGHT,BUTTON.LEFT,BUTTON.DOWN];
   let onSpot=false;
   for(let i=0;i<80&&!onSpot;i++){
    await press(route[i%route.length]);
    onSpot=await page.evaluate(()=>!!document.activeElement?.closest('#hotspots'));
   }
   assert.ok(onSpot,'the d-pad reaches a scene hotspot at '+width);
   // The focused hotspot is on screen: a phone frame pans to it when it lies past the edge.
   const visible=await page.evaluate(()=>{const s=document.querySelector('#scene').getBoundingClientRect(),r=document.activeElement.getBoundingClientRect();return r.left>=s.left-1&&r.right<=s.right+1;});
   assert.ok(visible,'the focused hotspot is brought into the visible scene at '+width);
   assert.equal(await page.evaluate(()=>document.body.classList.contains('gamepad-nav')),true,'pad input shows the focus ring');
   const ring=await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle);
   assert.notEqual(ring,'none','the focused hotspot has a visible outline');

   // A clicks the focused hotspot, which opens its dialog; B closes it and focus returns to the same hotspot.
   const spotId=await page.evaluate(()=>document.activeElement.dataset.spot);
   await press(BUTTON.A);
   await page.waitForFunction(()=>document.querySelector('#modal').open);
   await press(BUTTON.B);
   assert.equal(await modalOpen(),false,'B closes the hotspot dialog at '+width);
   assert.equal(await page.evaluate(()=>document.activeElement?.dataset.spot),spotId,'focus returns to the hotspot at '+width);

   assert.deepEqual(errors,[],'no page errors at '+width);
   console.log('✓ gamepad navigation: pause, d-pad to hotspot "'+spotId+'", A opens, B returns focus ('+width+'px)');
   await context.close();
  }
 }finally{
  if(browser)await browser.close();
  server.kill();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
