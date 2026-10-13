#!/usr/bin/env node
'use strict';
// Regression guard for button arrows on the game pages: every visible inline arrow (the ← → ↗ glyphs swapped for .btn-arrow icons)
// must sit on the centre line of its button. Chapter cards (arrow under the text, by design) and floated option
// arrows are excluded.
const assert=require('node:assert/strict');
const {launchChromium,startPreviewServer}=require('./browser-harness.cjs');
const ROOT=require('node:path').resolve(__dirname,'..'),origin='http://127.0.0.1:4173';
const TOLERANCE=2;

// Rows for every rendered button with an inline arrow (a hidden arrow, e.g. on phones, has no position to check): { text, dy } where dy is arrow centre minus button centre.
const measure=page=>page.evaluate(()=>[...document.querySelectorAll('button')]
 .filter(b=>{const arrow=b.querySelector('.btn-arrow');return arrow&&b.getClientRects().length&&arrow.getClientRects().length&&!b.matches('.chapter-card')&&getComputedStyle(arrow).float==='none';})
 .map(b=>{const a=b.querySelector('.btn-arrow').getBoundingClientRect(),t=b.getBoundingClientRect();return {text:b.textContent.trim().slice(0,16),dy:(a.top+a.height/2)-(t.top+t.height/2)};}));

async function assertCentred(page,label){
 const rows=await measure(page);
 assert.ok(rows.length>0,label+': no inline arrows found, so the check would pass vacuously');
 for(const row of rows)assert.ok(Math.abs(row.dy)<=TOLERANCE,label+': "'+row.text+'" arrow is '+row.dy.toFixed(1)+'px off centre');
 return rows.length;
}

(async()=>{
 const server=startPreviewServer(ROOT);let browser;
 try{
  for(let i=0;i<40;i++){try{if((await fetch(origin+'/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
  browser=await launchChromium();
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   // Play page: home buttons, then one gallery artwork (its prev/next controls).
   await page.goto(origin+'/games/blood-mirror/play/',{waitUntil:'load'});
   const home=await assertCentred(page,'home '+width);
   await page.locator('[data-action="gallery"]:visible').first().click();
   await page.locator('[data-artwork="library"]').click();
   // Text arrows become icons on the next frame, so wait for the icon itself before measuring.
   await page.locator('#artwork-next .btn-arrow').waitFor();
   const gallery=await assertCentred(page,'gallery artwork '+width);
   assert.deepEqual(errors,[],'no page errors at '+width);
   console.log('✓ button arrows centred: home '+home+', gallery artwork '+gallery+' ('+width+'px)');
   await context.close();
  }
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
