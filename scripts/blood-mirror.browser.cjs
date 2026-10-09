#!/usr/bin/env node
'use strict';
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
  browser=await chromium.launch({headless:true});
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:850},hasTouch:width<600,isMobile:width<600,reducedMotion:'reduce'});
   const page=await context.newPage(),pageErrors=[];
   page.on('pageerror',e=>pageErrors.push(e.message));
   await page.goto(ORIGIN+'/games/blood-mirror/play/');
   await page.locator('#start').click();
   await page.locator('#intro-explore').click();
   const hit=await page.evaluate(()=>{const el=document.querySelector('[data-spot="watch"]'),r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,at=document.elementFromPoint(x,y);return {x,y,rect:{left:r.left,top:r.top,width:r.width,height:r.height},at:at?.outerHTML.slice(0,180),layer:getComputedStyle(document.querySelector('#hotspots')).pointerEvents,button:getComputedStyle(el).pointerEvents};});
   console.log('Scene hit-test:',JSON.stringify(hit));
   await page.locator('[data-spot="watch"]').click();
   await page.locator('#take-item').click();
   await page.locator('#room-puzzle').click();
   assert.equal(await page.locator('.picture-tile').count(),9);
   for(let wanted=0;wanted<9;wanted++){
    const positions=await page.locator('.picture-tile').evaluateAll(els=>els.map(el=>Number(el.getAttribute('aria-label').match(/圖塊 (\d+)/)[1])-1));
    if(positions[wanted]===wanted)continue;
    const target=positions.indexOf(wanted);
    await page.locator('[data-pos="'+wanted+'"]').click();
    await page.locator('[data-pos="'+target+'"]').click();
   }
   await page.locator('#code').fill('1373');
   await page.locator('#code-form button[type=submit]').click();
   assert.equal(await page.locator('#modal-title').innerText(),'封印已解開');
   await page.locator('#success-next').click();
   await page.locator('[data-spot="valve"]').click();
   await page.locator('#take-item').click();
   await page.locator('#room-puzzle').click();
   assert.equal(await page.locator('.pipe-piece').count(),5);
   for(const [i,rot] of [1,3,2,1,2].entries())for(let n=0;n<(4-rot);n++)await page.locator('[data-pipe="'+i+'"]').click();
   for(const opt of ['water','heat','city'])await page.locator('[data-option="'+opt+'"]').click();
   await page.locator('#submit-seq').click();
   assert.equal(await page.locator('#modal-title').innerText(),'封印已解開');
   await page.locator('#success-next').click();
   await page.locator('[data-spot="apple"]').click();
   await page.locator('#take-item').click();
   await page.locator('#room-puzzle').click();
   assert.equal(await page.locator('.rune-key').count(),4);
   for(const n of [0,2,1,3,0])await page.locator('[data-rune="'+n+'"]').click();
   for(const opt of ['moon','apple','mirror'])await page.locator('[data-option="'+opt+'"]').click();
   await page.locator('#submit-seq').click();
   await page.locator('#success-next').click();
   await page.locator('[data-spot="needle"]').click();
   await page.locator('#take-item').click();
   await page.locator('#room-puzzle').click();
   assert.equal(await page.locator('.memory-card').count(),8);
   for(const pair of [[0,6],[1,4],[2,7],[3,5]]){
    await page.locator('[data-memory="'+pair[0]+'"]').click();
    await page.locator('[data-memory="'+pair[1]+'"]').click();
   }
   for(const ans of ['no','third','yes'])await page.locator('[data-answer="'+ans+'"]').click();
   await page.locator('#success-next').click();
   await page.locator('[data-spot="witness"]').click();
   await page.locator('#take-item').click();
   await page.locator('#room-puzzle').click();
   assert.equal(await page.locator('.reflection-cell').count(),16);
   for(const k of [1,4,5,6,7])await page.locator('[data-reflection="'+k+'"]').click();
   await page.locator('[data-name="snow"]').click();
   await page.locator('#success-next').click();
   for(const ending of ['dawn','frost','crown']){
    await page.locator('[data-fate="'+ending+'"]').click();
    assert.ok(await page.locator('#ending-title').isVisible(),'ending invisible '+ending);
    assert.ok((await page.locator('.ending-art').getAttribute('style')).includes(ending+'.svg'));
    const image=await page.request.get(ORIGIN+'/games/blood-mirror/play/assets/endings/'+ending+'.svg');
    assert.equal(image.status(),200,'missing CG '+ending);
    if(ending!=='crown')await page.locator('[data-action="reconsider"]').click();
   }
   assert.deepEqual(pageErrors,[],'browser error at '+width);
   const dims=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
   assert.ok(dims.scrollWidth<=dims.width+2,'horizontal overflow '+width+': '+JSON.stringify(dims));
   console.log('✓ Blood Mirror interactive journey, 5 challenges, 3 CG endings @ '+width+'px');
   await context.close();
  }
 }finally{if(browser)await browser.close();server.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});