#!/usr/bin/env node
'use strict';
// Browser acceptance for the replay entries: the clear screen lists every finished mini-game (the prologue included)
// and its shortcut scrolls there; a replay from the clear screen returns to it; the pause menu opens the same picker.
const {strict:assert}=require('node:assert');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const ROOT=require('node:path').resolve(__dirname,'..');
const ORIGIN='http://127.0.0.1:4173';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const shardIds=['shard-library','shard-ballroom','shard-hunter','shard-mine','shard-crypt','shard-queen','shard-mirror','shard-prologue'];
const allPuzzles=['prologue','library','ballroom','hunter','mine','crypt','queen','mirror'];
const clearedSave={
 version:2,started:true,chapter:'mirror',unlocked:['library','mine','crypt','queen','mirror'],
 solved:['library','mine','crypt','queen','mirror'],puzzles:allPuzzles,
 inventory:['watch','valve','apple','needle','witness','contract','blueprint'],seen:[],hints:{},clues:[],glowRooms:[],misses:{},
 memories:[],shards:shardIds,achievements:['first-seal'],endings:['dawn'],ending:'dawn',answers:null,elapsed:1200,muted:true
};
// The same journey still in progress, with every mini-game finished.
const journeySave={...clearedSave,ending:null,endings:[]};
const newJourney={...journeySave,puzzles:[],solved:[],unlocked:[]};

async function seeded(browser,width,save){
 const narrow=width<600;
 const context=await browser.newContext({viewport:{width,height:800},hasTouch:narrow,isMobile:narrow,reducedMotion:'reduce'});
 await context.addInitScript(([key,value])=>{try{localStorage.setItem(key,value);}catch{}},['blood-mirror-v2',JSON.stringify(save)]);
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(ORIGIN+'/games/blood-mirror/play/');
 return {context,page,errors};
}

(async()=>{
 const server=spawn(process.execPath,[ROOT+'/scripts/serve.cjs'],{cwd:ROOT,stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<40;i++){try{const res=await fetch(ORIGIN+'/');if(res.ok)break;}catch{}await pause(200);}
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});

  for(const width of [390,1280]){
   // Clear screen: all eight mini-games, the prologue first; the shortcut brings the section into view.
   const {context,page,errors}=await seeded(browser,width,clearedSave);
   await page.locator('#continue').click();
   await page.locator('#ending-title').waitFor();
   const cards=page.locator('#ending-replay .replay-card');
   assert.equal(await cards.count(),8,'clear screen lists all eight mini-games @'+width);
   assert.match(await cards.first().innerText(),/序章 · 音樂盒的搖籃曲/,'the prologue is listed first @'+width);
   // The clear screen scrolls under a real wheel gesture, so the section below the recap can be reached without the shortcut.
   await page.mouse.move(width/2,400);
   for(let i=0;i<4;i++)await page.mouse.wheel(0,600);
   await pause(400);
   assert.ok(await page.evaluate(()=>scrollY)>0,'the clear screen scrolls with the wheel @'+width);
   await page.evaluate(()=>scrollTo(0,0));
   await page.locator('#ending-replay-jump').click();
   await pause(900);
   const top=(await page.locator('#ending-replay-title').boundingBox()).y;
   assert.ok(top>=0&&top<800,'the shortcut scrolls the replay section into view @'+width);

   // Replay from the clear screen: the prologue plays through, then the player lands back on the clear screen.
   await page.locator('[data-replay="prologue"]').click();
   await page.locator('[data-pin]').first().waitFor();
   for(const pin of [0,2,3])await page.locator('[data-pin="'+pin+'"]').click();
   await page.waitForFunction(()=>!document.querySelector('#modal').open);
   assert.equal(await page.locator('#ending-title').isVisible(),true,'a finished replay returns to the clear screen @'+width);
   assert.equal(await cards.count(),8,'the list is unchanged after a replay @'+width);
   assert.deepEqual(errors,[],'no page errors on the clear screen @'+width);
   await context.close();

   // Pause menu: the same picker, with the prologue included once it is finished.
   const game=await seeded(browser,width,journeySave);
   await game.page.locator('#continue').click();
   await game.page.locator('#room-title').waitFor();
   await game.page.locator('#pause').click();
   assert.equal(await game.page.locator('#pause-replay').isEnabled(),true,'pause menu offers replays once a mini-game is finished @'+width);
   await game.page.locator('#pause-replay').click();
   assert.equal(await game.page.locator('#modal-title').innerText(),'重玩小遊戲','the pause menu opens the replay picker @'+width);
   assert.equal(await game.page.locator('#modal [data-replay]').count(),8,'the picker lists the prologue and every act @'+width);
   await game.page.locator('#replay-back').click();
   assert.equal(await game.page.locator('#modal-title').innerText(),'暫停','back returns to the pause menu @'+width);
   assert.deepEqual(game.errors,[],'no page errors in the pause menu @'+width);
   await game.context.close();

   // Nothing finished yet: the pause entry is shown but disabled.
   const fresh=await seeded(browser,width,newJourney);
   await fresh.page.locator('#continue').click();
   await fresh.page.locator('#room-title').waitFor();
   await fresh.page.locator('#pause').click();
   assert.equal(await fresh.page.locator('#pause-replay').isDisabled(),true,'the pause entry is disabled before any mini-game is finished @'+width);
   await fresh.context.close();
  }
  console.log('✓ Blood Mirror replay entries: clear-screen list with prologue, shortcut, replay returns to clear screen, pause menu picker at 390px and 1280px');
 }finally{
  await browser?.close();
  server.kill();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
