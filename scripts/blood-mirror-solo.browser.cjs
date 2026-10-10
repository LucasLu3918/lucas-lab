#!/usr/bin/env node
'use strict';
// Solo playtest log: opt-in, summarised in settings, exportable, never sent over the network.
const {strict:assert}=require('node:assert');
const {spawn}=require('node:child_process');
const {mkdirSync,readFileSync}=require('node:fs');
const {chromium}=require('playwright');
const ROOT=require('node:path').resolve(__dirname,'..'),origin='http://127.0.0.1:4173',out='/tmp/blood-mirror-solo';
(async()=>{
 const server=spawn(process.execPath,[ROOT+'/scripts/serve.cjs'],{cwd:ROOT,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<40;i++){try{if((await fetch(origin+'/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
  mkdirSync(out,{recursive:true});
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
  for(const width of [360,1280]){
   const context=await browser.newContext({viewport:{width,height:850},acceptDownloads:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],foreign=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))foreign.push(r.url());});
   await page.goto(origin+'/games/blood-mirror/play/');
   assert.equal(await page.evaluate(()=>localStorage.getItem('blood-mirror-playlog-v1')),null,'log must be off by default');
   await page.locator('#start').click();await page.locator('#intro-explore').click();
   await page.locator('.settings-toggle').click();await page.locator('#setting-playlog').click();
   assert.equal(await page.locator('#setting-playlog').getAttribute('aria-pressed'),'true');await page.keyboard.press('Escape');
   for(const id of ['watch','bells'])await page.locator('[data-clue="'+id+'"]').evaluate(el=>el.click()).then(()=>page.keyboard.press('Escape'));
   await page.locator('.game-tools [data-action="hint"]').click();await page.locator('#more-hint').click();await page.keyboard.press('Escape');
   await page.locator('.settings-toggle').click();
   assert.match(await page.locator('.playlog-table').innerText(),/黑鐘書庫\s+進行中\s+—\s+0\s+1 \/ 3/);
   await page.locator('#modal').screenshot({path:out+'/settings-'+width+'.png'});
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#playlog-download').click()]);
   const data=JSON.parse(readFileSync(await download.path(),'utf8'));
   assert.deepEqual([...new Set(data.events.map(e=>e.kind))].sort(),['hint','room','spot']);
   assert.ok(data.events.every(e=>Object.keys(e).every(k=>['t','kind','room','spot','level'].includes(k))),'log stores only gameplay fields');
   await page.locator('#setting-playlog').click();
   assert.equal(await page.evaluate(()=>localStorage.getItem('blood-mirror-playlog-v1')),null,'turning off erases the log');
   assert.deepEqual(foreign,[]);assert.deepEqual(errors,[]);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   console.log('✓ solo playtest log: opt-in, summary, JSON export, erase on disable, no network @ '+width);
   await context.close();
  }
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
