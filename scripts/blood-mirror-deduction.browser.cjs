#!/usr/bin/env node
'use strict';
// Browser acceptance for the prologue music box, the shard collection tab and phone layout (plan §5.7, §10 M5/M7).
const {strict:assert}=require('node:assert');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const ROOT=require('node:path').resolve(__dirname,'..');
const ORIGIN='http://127.0.0.1:4173';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const noOverflow=async(page,label)=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),label+' overflows');

(async()=>{
 const server=spawn(process.execPath,[ROOT+'/scripts/serve.cjs'],{cwd:ROOT,stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<40;i++){try{const res=await fetch(ORIGIN+'/');if(res.ok)break;}catch{}await pause(200);}
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  for(const width of [360,1280]){
   const page=await browser.newPage({viewport:{width,height:width<600?800:820},reducedMotion:'reduce'});
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(ORIGIN+'/games/blood-mirror/play/');
   await page.locator('#start').click();
   assert.match(await page.locator('#modal-title').innerText(),/當鏡子第一次說謊/,'the prologue opens before the first act');
   await page.locator('#prologue-begin').click();
   assert.match(await page.locator('#modal-title').innerText(),/音樂盒的搖籃曲/);
   await noOverflow(page,'music box '+width);
   // Three moves raise the pins the lullaby asks for: first, third and fourth.
   for(const pin of [0,2,3])await page.locator('[data-pin="'+pin+'"]').click();
   assert.match(await page.locator('#modal-title').innerText(),/第十三聲鐘響/,'the first act opens after the prologue');
   await page.locator('#intro-explore').click();
   await page.locator('#pause').click();
   await page.locator('#pause-journal').click();
   await page.locator('#journal-chapter').selectOption('collection');
   assert.match(await page.locator('#journal-entries').innerText(),/鏡之碎片 1 \/ 8/,'the prologue shard is kept');
   assert.equal(await page.locator('#secret-epilogue').isDisabled(),true,'the secret epilogue waits for every shard');
   await page.locator('#journal-chapter').selectOption('clues');
   assert.match(await page.locator('#journal-entries').innerText(),/推理簿|線索詞|尚未|還是空的|收錄/);
   await noOverflow(page,'journal '+width);
   assert.deepEqual(errors,[],'page errors at '+width);
   await page.close();
  }
  console.log('✓ Blood Mirror prologue, shard collection and notebook at 360px and 1280px');
 }finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
