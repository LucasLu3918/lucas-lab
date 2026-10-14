#!/usr/bin/env node
'use strict';
// Browser acceptance for the act picker: below 1024px the seven acts are one select that fits the viewport,
// above it they stay a tab strip. Keyboard focus stays on the act that became active after a switch.
const {strict:assert}=require('node:assert');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const ROOT=require('node:path').resolve(__dirname,'..');
const ORIGIN='http://127.0.0.1:4173';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const shardIds=['shard-library','shard-ballroom','shard-hunter','shard-mine','shard-crypt','shard-queen','shard-mirror','shard-prologue'];
// A journey in progress with every act unlocked, so the play route opens with all seven acts selectable.
const journeySave={
 version:2,started:true,chapter:'mirror',unlocked:['library','mine','crypt','queen','mirror'],
 solved:['library','mine','crypt','queen','mirror'],puzzles:['prologue','library','mine','crypt','queen','mirror'],
 inventory:['watch','valve','apple','needle','witness','contract','blueprint'],seen:[],hints:{},clues:[],glowRooms:[],misses:{},
 memories:[],shards:shardIds,achievements:['first-seal'],endings:[],ending:null,answers:null,elapsed:1200,muted:true
};

(async()=>{
 const server=spawn(process.execPath,[ROOT+'/scripts/serve.cjs'],{cwd:ROOT,stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<40;i++){try{const res=await fetch(ORIGIN+'/');if(res.ok)break;}catch{}await pause(200);}
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  for(const width of [360,960,1280]){
   // The tab strip needs about 830px for seven acts, so the select takes over below 1024px.
   const narrow=width<1024;
   const context=await browser.newContext({viewport:{width,height:800},hasTouch:narrow,isMobile:narrow,reducedMotion:'reduce'});
   await context.addInitScript(([key,value])=>{try{localStorage.setItem(key,value);}catch{}},['blood-mirror-v2',JSON.stringify(journeySave)]);
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(ORIGIN+'/games/blood-mirror/play/');
   await page.locator('#continue').click();
   await page.locator('#room-title').waitFor();

   // Narrow: one select with all seven acts, fully inside the viewport. Wide: the tab strip.
   const select=page.locator('#room-select'),tabs=page.locator('#room-tabs');
   if(narrow){
    assert.equal(await tabs.isVisible(),false,'tab strip is hidden below 1024px @'+width);
    assert.equal(await select.isVisible(),true,'act select is shown below 1024px @'+width);
    assert.equal(await select.locator('option').count(),7,'select lists all seven acts @'+width);
    const box=await select.boundingBox();
    assert.ok(box.x>=0&&box.x+box.width<=width,'act select fits the viewport @'+width);
    assert.ok(box.height>=44,'act select is a 44px touch target @'+width);
    // A real touch must land on the select itself (the stage toolbar once swallowed it with pointer-events:none).
    assert.equal(await page.evaluate(()=>{const el=document.querySelector('#room-select'),b=el.getBoundingClientRect();return document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)===el;}),true,'act select receives pointer events @'+width);
    await select.selectOption('0');
   }else{
    assert.equal(await select.isVisible(),false,'act select is hidden at '+width);
    assert.equal(await tabs.isVisible(),true,'tab strip is shown at '+width);
    // Keyboard: pressing Enter on an act keeps focus on the act that became active.
    await page.locator('[data-room="1"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#room-title').innerText(),'血色舞會','Enter switches to act 02 @'+width);
    assert.equal(await page.evaluate(()=>document.activeElement?.dataset.room),'1','focus stays on the active act after switching @'+width);
    await page.locator('[data-room="0"]').click();
   }
   assert.equal(await page.locator('#room-title').innerText(),'黑鐘書庫','switching back to act 01 works @'+width);
   assert.deepEqual(errors,[],'no page errors @'+width);
   await context.close();
  }
  console.log('✓ Blood Mirror act picker: select below 1024px, tabs above, at 360px, 960px and 1280px');
 }finally{
  await browser?.close();
  server.kill();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
