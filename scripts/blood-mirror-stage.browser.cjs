#!/usr/bin/env node
'use strict';
// Immersive stage acceptance (plan §5.5, §6): first-screen scene on phones, candle light, dialogue
// collapse, story-mode guide, no site frame during play, and phone panning.
const {strict:assert}=require('node:assert');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const ROOT=require('node:path').resolve(__dirname,'..');
const ORIGIN='http://127.0.0.1:4173';
const pause=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 const server=spawn(process.execPath,[ROOT+'/scripts/serve.cjs'],{cwd:ROOT,stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<40;i++){try{const res=await fetch(ORIGIN+'/');if(res.ok)break;}catch{}await pause(200);}
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});

  for(const [width,height] of [[375,667],[1280,800]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:width<600,isMobile:width<600,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(ORIGIN+'/games/blood-mirror/play/');
   await page.locator('#start').click();
   await page.locator('#intro-explore').click();

   // The site frame is gone during play; the scene and the first hotspot are on screen.
   assert.equal(await page.locator('.site-header').isVisible(),false,'site header must be hidden in play @'+width);
   assert.equal(await page.locator('.lab-bar').isVisible(),false,'LUCAS LAB bar must be hidden in play @'+width);
   const sceneBox=await page.locator('#scene').boundingBox();
   assert.ok(sceneBox.width>=width-1&&sceneBox.height>=height-1,'scene must fill the viewport @'+width+': '+JSON.stringify(sceneBox));
   const visibleSpots=await page.evaluate(()=>[...document.querySelectorAll('#hotspots [data-spot]')].filter(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}).length);
   assert.ok(visibleSpots>=1,'at least one hotspot must be on screen at first view @'+width);

   // Candle light: all points light for three seconds, then the button rests for twenty.
   await page.locator('#glow').click();
   assert.ok(await page.locator('#stage.glow-on').count()===1,'candle light must light the stage');
   assert.equal(await page.locator('#glow').isDisabled(),true,'candle light must enter cooldown');
   await page.waitForFunction(()=>!document.querySelector('#stage').classList.contains('glow-on'),null,{timeout:6000});
   assert.equal(await page.locator('#glow').isDisabled(),true,'cooldown outlasts the glow');

   // Dialogue collapses to one line and expands again; its actions stay reachable either way.
   assert.equal(await page.locator('#dialogue-toggle').getAttribute('aria-expanded'),width<600?'false':'true','dialogue default @'+width);
   await page.locator('#dialogue-toggle').click();
   assert.equal(await page.locator('#dialogue-toggle').getAttribute('aria-expanded'),width<600?'true':'false','dialogue toggle @'+width);
   assert.equal(await page.locator('#room-puzzle').isVisible(),true,'seal action must stay visible @'+width);
   await page.locator('#dialogue-toggle').click();

   // Puzzle mode hides the next-step guide; story mode keeps it.
   assert.equal(await page.locator('#journey-guide').isVisible(),false,'puzzle mode hides the guide @'+width);
   await page.evaluate(()=>{localStorage.setItem('blood-mirror-settings-v1',JSON.stringify({...JSON.parse(localStorage.getItem('blood-mirror-settings-v1')||'{}'),mode:'story'}));});
   await page.reload();
   await page.locator('#continue').click();
   assert.equal(await page.locator('#journey-guide').isVisible(),true,'story mode shows the guide @'+width);

   // Phones pan the 16:9 frame; the offset is clamped and hotspots move with the image.
   if(width<600){
    const before=await page.locator('#hotspots [data-spot]').first().boundingBox();
    const dragY=height*0.645;await page.mouse.move(width/2,dragY);await page.mouse.down();await page.mouse.move(width/2-120,dragY,{steps:6});await page.mouse.up();
    const after=await page.locator('#hotspots [data-spot]').first().boundingBox();
    assert.ok(Math.abs(after.x-before.x)>40,'phone scene must pan horizontally @'+width);
    assert.equal(await page.locator('#scene.panned').count(),1,'pan hint must clear after panning');
   }

   // Overflow and errors.
   const dims=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
   assert.ok(dims.scrollWidth<=dims.width+2,'horizontal overflow @'+width+': '+JSON.stringify(dims));
   assert.deepEqual(errors,[],'page errors @'+width);
   console.log('✓ stage: scene fills the viewport, candle light cooldown, dialogue collapse, story guide, phone pan @ '+width+'px');
   await context.close();
  }
 }finally{if(browser)await browser.close();server.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
