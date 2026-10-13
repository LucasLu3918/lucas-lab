#!/usr/bin/env node
'use strict';
const {startPreviewServer,launchChromium}=require('./browser-harness.cjs');
// Immersive stage acceptance (plan §5.5, §6): first-screen scene on phones, candle light, dialogue
// collapse, story-mode guide, no site frame during play, and phone panning.
const {strict:assert}=require('node:assert');
const ROOT=require('node:path').resolve(__dirname,'..');
const ORIGIN='http://127.0.0.1:4173';
const pause=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 const server=startPreviewServer(ROOT);
 let browser;
 try{
  for(let i=0;i<40;i++){try{const res=await fetch(ORIGIN+'/');if(res.ok)break;}catch{}await pause(200);}
  browser=await launchChromium();

  for(const [width,height] of [[375,667],[1280,800]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:width<600,isMobile:width<600,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(ORIGIN+'/games/blood-mirror/play/');
   await page.locator('#start').click();
   await page.locator('#prologue-skip').click();await page.locator('#intro-explore').click();

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

   // Phones keep the dialogue collapsed so the scene stays in view, and say the opening scene is unread.
   assert.equal(await page.locator('#dialogue-toggle').getAttribute('aria-expanded'),width<600?'false':'true','dialogue default @'+width);
   if(width<600){
    assert.equal(await page.locator('#dialogue-toggle').textContent(),'展開新對話','unread scene cue @'+width);
    await page.locator('#dialogue-toggle').click();
   }
   // The scene plays one line per click and names each speaker.
   assert.equal(await page.locator('#dialogue-speaker').textContent(),'旁白');
   assert.equal(await page.locator('#dialogue-count').textContent(),'1 / 4');
   await page.locator('#dialogue-next').click();await page.locator('#dialogue-next').click();
   assert.equal(await page.locator('#dialogue-speaker').textContent(),'魔鏡','speaker follows the line @'+width);
   assert.ok((await page.locator('#narrative').textContent()).includes('魔鏡：'),'the line names its speaker for screen readers');
   await page.locator('#dialogue-log').click();
   assert.equal(await page.locator('#modal .read-log-entry').count(),3,'read log stops at the line being read @'+width);
   await page.locator('#log-back').click();
   await page.locator('#dialogue-next').click();
   assert.equal(await page.locator('#dialogue-next').isVisible(),false,'no 繼續 after the last line');

   // Dialogue collapses to one line and expands again; its actions stay reachable either way.
   await page.locator('#dialogue-toggle').click();
   assert.equal(await page.locator('#dialogue-toggle').getAttribute('aria-expanded'),'false','dialogue toggle @'+width);
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
