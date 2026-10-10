#!/usr/bin/env node
'use strict';
// Post-game loop: ending recap, optional memories, chapter replay, portable save, light sprites.
const {strict:assert}=require('node:assert');
const {spawn}=require('node:child_process');
const {mkdirSync,readFileSync,writeFileSync}=require('node:fs');
const {chromium}=require('playwright');
const ROOT=require('node:path').resolve(__dirname,'..'),origin='http://127.0.0.1:4173',out='/tmp/blood-mirror-replay';
const done={version:1,started:true,room:4,solved:[0,1,2,3,4],inventory:['watch','contract','valve','blueprint','apple','needle','witness'],seen:['watch','bells','birth','contract','valve','pipes','miners'],ending:'dawn',endings:['dawn'],elapsed:1500,hints:{0:1,1:0,2:2,3:0,4:0}};
(async()=>{
 const server=spawn(process.execPath,[ROOT+'/scripts/serve.cjs'],{cwd:ROOT,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<40;i++){try{if((await fetch(origin+'/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
  mkdirSync(out,{recursive:true});
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],png=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/design-board-[13]\.png|dawn\.png/.test(r.url()))png.push(r.url());});
   await context.addInitScript(s=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.setItem('blood-mirror-v1',s);localStorage.setItem('blood-mirror-challenges-v2','["library","mine","crypt","queen","mirror"]');},JSON.stringify(done));
   await page.goto(origin+'/games/blood-mirror/play/');
   assert.match(await page.locator('#home-progress').innerText(),/人物記憶 0 \/ 5/);
   await page.locator('#continue').click();
   const recap=await page.locator('#ending-recap').innerText();
   assert.match(recap,/工程藍圖/);assert.match(recap,/赫索的話/);assert.match(recap,/使用提示 3 次/);assert.match(recap,/另外 2 種代價/);
   await page.locator('#ending-recap').screenshot({path:out+'/recap-'+width+'.png'});
   await page.locator('#ending [data-action="home"]').click();await page.locator('[data-chapter="1"]').click();
   assert.equal(await page.locator('.hotspot.memory').count(),1);
   assert.match(await page.locator('#scene-progress').innerText(),/人物記憶 0 \/ 5/);
   await page.locator('#scene').screenshot({path:out+'/memory-scene-'+width+'.png'});
   await page.locator('[data-clue="nyla"]').evaluate(el=>el.click());
   assert.equal(await page.locator('#modal-eyebrow').innerText(),'MEMORY · 人物記憶');assert.match(await page.locator('#modal-body').innerText(),/別死在門口/);
   await page.locator('#modal-close').click();
   await page.locator('.game-tools [data-action="journal"]').click();await page.locator('#journal-chapter').selectOption('memories');
   assert.match(await page.locator('#journal-summary').innerText(),/1 \/ 5/);assert.equal(await page.locator('.memory-entry.locked').count(),4);
   assert.ok(!(await page.locator('#journal-entries').innerText()).includes('伊萊第一次'),'unfound memories must not leak');
   await page.keyboard.press('Escape');
   // Replay a solved chapter's puzzle without touching progress.
   await page.locator('[data-clue="pipes"]').evaluate(el=>el.click());await page.locator('#replay-evidence').click();
   assert.equal(await page.locator('.pipe-piece').count(),5);assert.equal(await page.locator('#pipes-confirm').isDisabled(),true,'replay starts from a fresh board');
   for(const [i,count] of [1,2,2,2,2].entries())for(let n=0;n<count;n++)await page.locator('[data-pipe="'+i+'"]').click();
   await page.locator('#pipes-confirm').click();assert.equal(await page.locator('#modal-title').innerText(),'斷裂的蒸汽管');await page.locator('#modal-close').click();
   // Queen memory cards render from the light WebP board.
   await page.locator('[data-room="3"]').click();await page.locator('[data-clue="letter"]').evaluate(el=>el.click());await page.locator('#replay-evidence').click();await page.locator('[data-memory="0"]').click();
   await page.locator('[data-memory="0"] [data-concept="vial"]').waitFor();await page.keyboard.press('Escape');
   // Export, wipe, import.
   await page.locator('.settings-toggle').click();
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save-export').click()]);
   const file=out+'/save-'+width+'.json';writeFileSync(file,readFileSync(await download.path()));
   assert.deepEqual(JSON.parse(readFileSync(file,'utf8')).story.memories,['nyla']);
   assert.deepEqual(png,[],'gameplay must not fetch the 2.6MB PNG boards');assert.deepEqual(errors,[]);await context.close();
   // A second device: fresh browser profile, import the exported file.
   const device=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),fresh=await device.newPage();fresh.on('pageerror',e=>errors.push(e.message));
   await fresh.goto(origin+'/games/blood-mirror/play/');assert.equal(await fresh.locator('#continue').isHidden(),true);
   await fresh.locator('.settings-toggle').click();await fresh.locator('#save-file').setInputFiles(file);
   await fresh.locator('#import-confirm').waitFor({timeout:5000}).catch(async()=>{throw new Error('import dialog missing; toast: '+await fresh.locator('#toast').innerText());});
   assert.match(await fresh.locator('#modal-body').innerText(),/真相 5 \/ 5 · 結局 1 \/ 3 · 人物記憶 1 \/ 5/);
   await fresh.locator('#import-confirm').click();
   assert.match(await fresh.locator('#home-progress').innerText(),/人物記憶 1 \/ 5/);
   assert.equal(await fresh.evaluate(()=>JSON.parse(localStorage.getItem('blood-mirror-challenges-v2')).length),5);
   await fresh.locator('.settings-toggle').click();await fresh.locator('#save-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"format":"other"}')});
   await fresh.waitForFunction(()=>document.querySelector('#toast').textContent.includes('不是血色魔鏡'));
   assert.match(await fresh.locator('#toast').innerText(),/不是血色魔鏡的存檔/);
   assert.deepEqual(errors,[]);
   assert.ok(await fresh.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   console.log('✓ ending recap, optional memories, journal, chapter replay, save export/import, WebP sprites @ '+width);
   await device.close();
  }
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
