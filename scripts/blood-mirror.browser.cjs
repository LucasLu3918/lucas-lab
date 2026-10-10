#!/usr/bin/env node
'use strict';
const {strict:assert}=require('node:assert');
const {spawn}=require('node:child_process');
const {mkdirSync}=require('node:fs');
const {chromium}=require('playwright');
const ROOT=require('node:path').resolve(__dirname,'..');
const ORIGIN='http://127.0.0.1:4173';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const tapSpot=async(page,id,touch)=>{const spot=page.locator('[data-spot="'+id+'"]');await spot.scrollIntoViewIfNeeded();const box=await spot.boundingBox();if(!box)throw new Error('Missing hotspot '+id);const x=box.x+box.width/2,y=box.y+box.height/2;if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);};
(async()=>{
 const server=spawn(process.execPath,[ROOT+'/scripts/serve.cjs'],{cwd:ROOT,stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<40;i++){try{const res=await fetch(ORIGIN+'/');if(res.ok)break;}catch{}await pause(200);}
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
  mkdirSync('/tmp/blood-mirror-concept-preview',{recursive:true});
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:850},hasTouch:width<600,isMobile:width<600,reducedMotion:'reduce'});
   const page=await context.newPage(),pageErrors=[];
   page.on('pageerror',e=>pageErrors.push(e.message));
   await page.goto(ORIGIN+'/games/blood-mirror/play/');
   await page.locator('#start').click();
   await page.locator('#intro-explore').click();
   const hit=await page.evaluate(()=>{const el=document.querySelector('[data-spot="watch"]'),r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,at=document.elementFromPoint(x,y);return {x,y,rect:{left:r.left,top:r.top,width:r.width,height:r.height},at:at?.outerHTML.slice(0,180),layer:getComputedStyle(document.querySelector('#hotspots')).pointerEvents,button:getComputedStyle(el).pointerEvents};});
   console.log('Scene hit-test:',JSON.stringify(hit));
   await tapSpot(page,'watch',width<600);
   await page.locator('#take-item').click();
   await page.locator('#room-puzzle').click();
   assert.equal(await page.locator('#code').count(),0,'seal must wait for the restored evidence');
   await page.locator('#seal-evidence').click();
   assert.equal(await page.locator('#modal-title').innerText(),'出生紀錄');
   assert.ok(!(await page.locator('#modal-body').innerText()).includes('七十三'));
   await page.locator('#restore-evidence').click();
   assert.equal(await page.locator('.ledger-tile').count(),9);
   await page.locator('#modal').screenshot({path:'/tmp/blood-mirror-concept-preview/puzzle-'+width+'.png'});
   for(let wanted=0;wanted<9;wanted++){
    if(!await page.locator('.ledger-tile').count())break; // Solving the last misplaced piece reopens the restored record.
    const positions=await page.locator('.picture-tile').evaluateAll(els=>els.map(el=>Number(el.getAttribute('aria-label').match(/圖塊 (\d+)/)[1])-1));
    if(positions[wanted]===wanted)continue;
    const target=positions.indexOf(wanted);
    await page.locator('[data-pos="'+wanted+'"]').click();
    await page.locator('[data-pos="'+target+'"]').click();
   }
   assert.equal(await page.locator('#modal-title').innerText(),'出生紀錄');
   assert.ok((await page.locator('#modal-body').innerText()).includes('七十三'));
   assert.equal(await page.locator('#modal .ledger-page').count(),1);
   await page.locator('#modal-close').click();
   await page.locator('#room-puzzle').click();
   assert.equal(await page.locator('#modal [data-concept="clock"]').count(),1);
   await page.locator('#code').fill('1373');
   await page.locator('#code-form button[type=submit]').click();
   assert.equal(await page.locator('#modal-title').innerText(),'封印已解開');
   await page.locator('#success-next').click();
   assert.equal(await page.locator('#modal-title').innerText(),'暗門後的契約');
   assert.ok((await page.locator('#modal-body').innerText()).includes('父親'));
   await page.locator('#take-item').click();
   assert.equal(await page.locator('[data-item="contract"]').count(),1);
   await page.locator('#room-next').click();
   const openEvidenceFromSeal=async()=>{await page.locator('#room-puzzle').click();assert.equal(await page.locator('#seal-evidence').count(),1,'seal must point to evidence');await page.locator('#seal-evidence').click();await page.locator('#restore-evidence').click();};
   const afterSeal=async(title)=>{assert.equal(await page.locator('#modal-title').innerText(),'封印已解開');await page.locator('#success-next').click();assert.equal(await page.locator('#modal-title').innerText(),title);await page.locator('#modal-close').click();await page.locator('#room-next').click();};
   await tapSpot(page,'valve',width<600);
   await page.locator('#take-item').click();
   await openEvidenceFromSeal();
   assert.equal(await page.locator('.pipe-piece').count(),5);
   for(const [i,count] of [1,2,2,2,2].entries())for(let n=0;n<count;n++)await page.locator('[data-pipe="'+i+'"]').click();
   assert.equal(await page.locator('#pipes-confirm').isEnabled(),true);
   await page.locator('#pipes-confirm').click();
   assert.match(await page.locator('#modal-body').innerText(),/壓力錶同時跳動/);
   await page.locator('#modal-close').click();
   await page.locator('#room-puzzle').click();
   for(const opt of ['water','heat','city'])await page.locator('[data-option="'+opt+'"]').click();
   await page.locator('#submit-seq').click();
   await afterSeal('甦醒的礦工');
   await tapSpot(page,'apple',width<600);
   await page.locator('#take-item').click();
   await openEvidenceFromSeal();
   assert.equal(await page.locator('.rune-key').count(),4);
   for(let miss=0;miss<2;miss++)await page.locator('[data-rune="2"]').click();
   await page.locator('#rune-carving').click();
   assert.match(await page.locator('.rune-carving').innerText(),/心跳 → 月亮 → 心跳 → 蘋果 → 心跳 → 鏡子/);
   for(const n of [3,0,3,1,3,2])await page.locator('[data-rune="'+n+'"]').click();
   assert.match(await page.locator('#modal-body').innerText(),/每一次心跳之後/);
   await page.locator('#modal-close').click();
   await page.locator('#room-puzzle').click();
   for(const opt of ['moon','apple','mirror'])await page.locator('[data-option="'+opt+'"]').click();
   await page.locator('#submit-seq').click();
   await afterSeal('轉過頭的倒影');
   await tapSpot(page,'needle',width<600);
   await page.locator('#take-item').click();
   await openEvidenceFromSeal();
   assert.equal(await page.locator('.memory-card').count(),8);
   await page.locator('[data-memory="0"]').click();
   assert.equal(await page.locator('[data-memory="0"] [data-concept="vial"]').count(),1);
   await page.locator('#modal').screenshot({path:'/tmp/blood-mirror-concept-preview/memory-'+width+'.png'});
   for(const pair of [[0,6],[1,4],[2,7],[3,5]]){
    await page.locator('[data-memory="'+pair[0]+'"]').click();
    await page.locator('[data-memory="'+pair[1]+'"]').click();
   }
   assert.match(await page.locator('#modal-body').innerText(),/我不想成為女王/);
   await page.locator('#modal-close').click();
   await page.locator('#room-puzzle').click();
   for(const ans of ['no','third','yes'])await page.locator('[data-answer="'+ans+'"]').click();
   await afterSeal('母親的最後記憶');
   await tapSpot(page,'witness',width<600);
   assert.equal(await page.locator('#take-item').count(),0,'reversed manuscript cannot be taken before it is mirrored');
   await page.locator('#restore-evidence').click();
   assert.equal(await page.locator('.reflection-cell').count(),16);
   for(const k of [1,4,5,6,7])await page.locator('[data-reflection="'+k+'"]').click();
   assert.match(await page.locator('#modal-body').innerText(),/失蹤的公主/);
   await page.locator('#take-item').click();
   await page.locator('#room-puzzle').click();
   await page.locator('[data-name="snow"]').click();
   await page.locator('#success-next').click();
   for(const ending of ['dawn','frost','crown']){
    await page.locator('[data-fate="'+ending+'"]').click();
    assert.ok(await page.locator('#ending-title').isVisible(),'ending invisible '+ending);
    if(ending!=='dawn'){assert.equal(await page.locator('#ending-concept [data-concept="'+ending+'"]').count(),1);await page.screenshot({path:'/tmp/blood-mirror-concept-preview/ending-'+ending+'-'+width+'.png',fullPage:true});}
    assert.ok(new RegExp(ending+'\\.(svg|png|webp)').test(await page.locator('.ending-art').getAttribute('style')));
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