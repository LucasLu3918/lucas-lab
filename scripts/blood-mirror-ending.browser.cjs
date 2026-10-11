#!/usr/bin/env node
'use strict';
// Browser acceptance for the ending epilogue, the end credits and the operable secret epilogue (plan §5.6, §5.7),
// plus an axe-core pass over these screens. Seeds a complete save so the test starts at the ending screen.
// axe-core is installed in CI with --no-save (see .github/workflows/visual.yml). Locally: set AXE_PATH to its
// package directory, or SKIP_AXE=1 to run the functional checks only.
const {strict:assert}=require('node:assert');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const ROOT=require('node:path').resolve(__dirname,'..');
const ORIGIN='http://127.0.0.1:4173';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const shardIds=['shard-library','shard-ballroom','shard-hunter','shard-mine','shard-crypt','shard-queen','shard-mirror','shard-prologue'];
const solvedSave={
 version:2,started:true,chapter:'mirror',unlocked:['library','mine','crypt','queen','mirror'],
 solved:['library','mine','crypt','queen','mirror'],puzzles:['prologue','library','mine','crypt','queen','mirror'],
 inventory:['watch','valve','apple','needle','witness','contract','blueprint'],seen:[],hints:{},clues:[],glowRooms:[],misses:{},
 memories:[],shards:shardIds,achievements:['first-seal'],endings:['dawn'],ending:'dawn',answers:null,elapsed:1200,muted:true
};

async function auditAxe(page,label){
 if(process.env.SKIP_AXE==='1')return;
 let AxeBuilder;
 try{({AxeBuilder}=require(process.env.AXE_PATH?require.resolve('@axe-core/playwright',{paths:[process.env.AXE_PATH]}):'@axe-core/playwright'));}
 catch{throw new Error('axe-core is not installed: set AXE_PATH or SKIP_AXE=1');}
 const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
 assert.deepEqual(result.violations.map(v=>v.id),[],'axe violations on '+label);
}

(async()=>{
 const server=spawn(process.execPath,[ROOT+'/scripts/serve.cjs'],{cwd:ROOT,stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<40;i++){try{const res=await fetch(ORIGIN+'/');if(res.ok)break;}catch{}await pause(200);}
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  for(const width of [360,1280]){
   const context=await browser.newContext({viewport:{width,height:width<600?800:820},reducedMotion:'reduce'});
   await context.addInitScript(([key,value])=>{try{localStorage.setItem(key,value);}catch{}},['blood-mirror-v2',JSON.stringify(solvedSave)]);
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(ORIGIN+'/games/blood-mirror/play/');
   await page.locator('#continue').click();
   await page.locator('#ending-title').waitFor();
   assert.match(await page.locator('#ending-epilogue').innerText(),/尾聲/);
   // The operable epilogue: one gesture reveals its closing line.
   await page.locator('[data-epilogue="hold"]').click();
   assert.match(await page.locator('#epilogue-text').innerText(),/熱氣透過瓷杯/);
   await auditAxe(page,'ending '+width);
   // Credits: the roll opens and the modal closes back to the ending.
   await page.locator('#ending-credits').click();
   assert.match(await page.locator('#modal-title').innerText(),/片尾名單/);
   assert.match(await page.locator('#modal-body').innerText(),/LUCAS LAB/);
   await auditAxe(page,'credits '+width);
   await page.locator('#credits-close').click();
   assert.equal(await page.evaluate(()=>document.querySelector('#modal').open),false,'credits close');
   // The secret epilogue unlocks once every shard is held: two scenes, then the closing line.
   await page.locator('#ending-secret').click();
   assert.match(await page.locator('#modal-title').innerText(),/露西的母親/);
   assert.match(await page.locator('#modal-body').innerText(),/她還好嗎/);
   await page.locator('[data-secret="alive"]').click();
   assert.match(await page.locator('#modal-body').innerText(),/鬆開一直握緊的手/);
   await page.locator('[data-secret="tell"]').click();
   assert.match(await page.locator('#modal-body').innerText(),/數著她的名字/);
   assert.match(await page.locator('#modal-body').innerText(),/名字不是王冠給的/);
   await auditAxe(page,'secret epilogue '+width);
   await page.locator('#secret-close').click();
   assert.deepEqual(errors,[],'page errors at '+width);
   await context.close();
  }
  console.log('✓ Blood Mirror ending epilogue, credits and secret epilogue at 360px and 1280px'+(process.env.SKIP_AXE==='1'?' (axe skipped)':' with axe-core'));
 }finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
