#!/usr/bin/env node
'use strict';
const {strict:assert}=require('node:assert');
const {spawn}=require('node:child_process');
const {mkdirSync}=require('node:fs');
const {chromium}=require('playwright');
const ROOT=require('node:path').resolve(__dirname,'..');
const ORIGIN='http://127.0.0.1:4173';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const noOverflow=async(page,label)=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),label+' overflows');
// On phones the 16:9 scene is wider than the screen, so a hotspot may sit off-screen: pan like a player would.
const tapSpot=async(page,id,touch)=>{const spot=page.locator('[data-spot="'+id+'"]');await spot.scrollIntoViewIfNeeded();const {width:vw,height:vh}=page.viewportSize();for(let i=0;i<6;i++){const box=await spot.boundingBox();if(!box)throw new Error('Missing hotspot '+id);const cx=box.x+box.width/2;if(cx>24&&cx<vw-24)break;const y=vh*0.35;await page.mouse.move(vw/2,y);await page.mouse.down();await page.mouse.move(vw/2+(vw/2-cx),y,{steps:6});await page.mouse.up();}const box=await spot.boundingBox();const x=box.x+box.width/2,y=box.y+box.height/2;if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);};
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
   // Each act's pre-seal deduction: gather its clue words from the scene, then fill the blanks in order.
   const deduce=async(spots,words)=>{for(const id of spots){await tapSpot(page,id,width<600);try{await page.locator('#modal-close').click({timeout:4000});}catch(e){console.log('FAIL spot',id,await page.evaluate(()=>document.querySelector('#modal')?.className+' | '+document.querySelector('#modal-title')?.innerText));await page.screenshot({path:'/tmp/claude-dbg.png'});throw e;}}await page.locator('#room-puzzle').click();assert.equal(await page.locator('#modal-title').innerText(),'魔鏡審問');assert.equal(await page.locator('#modal .modal-portrait').count(),1,'the mirror speaks with its portrait');for(const word of words)await page.locator('#modal [data-word="'+word+'"]').click();await page.locator('#interrogation-submit').click();};
   await page.goto(ORIGIN+'/games/blood-mirror/play/');
   await page.locator('#start').click();
   await page.locator('#prologue-skip').click();await page.locator('#intro-explore').click();
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
   await deduce(['bells','waxseal'],['twelve','thirteenth','children73','king']);
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
   // Act 2, the ball: match every mask to a guest, state the truth to the mirror, then pick the last dance.
   // Views: arrows and arrow keys step through the ball's three images; each hotspot lives in one of them.
   assert.equal(await page.locator('#view-next').isVisible(),true);
   await page.locator('#view-next').click();
   assert.match(await page.locator('#scene-image').getAttribute('src'),/mirror-hall\.webp/);
   assert.equal(await page.locator('[data-spot="hallmirrors"]').count(),1);assert.equal(await page.locator('[data-spot="invite"]').count(),0);
   await page.keyboard.press('ArrowRight');
   assert.match(await page.locator('#scene-image').getAttribute('src'),/balcony\.webp/);
   assert.equal(await page.locator('[data-spot="glove"]').count(),1);
   await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');
   assert.match(await page.locator('#scene-image').getAttribute('src'),/ballroom\.webp/);
   // A character spot shows a painted portrait (loaded only when opened).
   await tapSpot(page,'prince',width<600);
   await page.locator('#modal .modal-portrait').waitFor();
   assert.ok(await page.locator('#modal .modal-portrait').evaluate(img=>img.decode().then(()=>img.naturalWidth>0,()=>false)),'portrait decodes');
   await page.locator('#modal-close').click();
   await tapSpot(page,'guests',width<600);
   assert.equal(await page.locator('#take-item').count(),0);
   await page.locator('#restore-evidence').click();
   assert.equal(await page.locator('[data-mask]').count(),6);
   await page.locator('[data-mask="0"]').selectOption('1');await page.locator('#masks-confirm').click();
   assert.match(await page.locator('.challenge-feedback').innerText(),/還有面具沒有選人/);
   for(const i of [0,1,2,3,4,5])await page.locator('[data-mask="'+i+'"]').selectOption(String(i));
   await page.locator('#masks-confirm').click();
   // Stage two, the mirror light path: the beam leaves through the top until every mirror is flipped.
   assert.equal(await page.locator('[data-mirror]').count(),4);
   assert.match(await page.locator('.challenge-feedback').innerText(),/上方/);
   for(const i of [0,1,2,3])await page.locator('[data-mirror="'+i+'"]').click();
   assert.match(await page.locator('#modal-body').innerText(),/黑天鵝是伊萊/);
   await page.locator('#modal-close').click();
   await deduce(['invite','prince','bigmirror'],['queen','prince','eli','mirrorhall']);
   assert.equal(await page.locator('#modal-title').innerText(),'最後一支舞');
   await page.locator('[data-choice="eli"]').click();
   assert.match(await page.locator('#modal-body').innerText(),/黑手套/);
   await page.locator('#choice-next').click();
   await afterSeal('鏡廳的入口');
   // Act 3, the hunter: light the seven runes by jumping over two, then name whose heart is in the glass.
   await tapSpot(page,'heart',width<600);
   await page.locator('#restore-evidence').click();
   assert.equal(await page.locator('[data-node]').count(),7);
   await page.locator('[data-node="1"]').click();
   assert.match(await page.locator('.challenge-feedback').innerText(),/熄滅/);
   for(const n of [0,3,6,2,5,1,4])await page.locator('[data-node="'+n+'"]').click();
   assert.match(await page.locator('#modal-body').innerText(),/托比/);
   await page.locator('#modal-close').click();
   await deduce(['notes','fire'],['queen','snowwhite','toby','hide']);
   assert.equal(await page.locator('#modal-title').innerText(),'托比的心臟');
   await page.locator('[data-choice="take"]').click();
   await page.locator('#choice-next').click();
   await afterSeal('通往黑松林的小徑');
   await tapSpot(page,'valve',width<600);
   await page.locator('#take-item').click();
   await openEvidenceFromSeal();
   assert.equal(await page.locator('.pipe-piece').count(),5);
   for(const [i,count] of [1,2,2,2,2].entries())for(let n=0;n<count;n++)await page.locator('[data-pipe="'+i+'"]').click();
   assert.equal(await page.locator('#pipes-confirm').isEnabled(),true);
   await page.locator('#pipes-confirm').click();
   assert.match(await page.locator('#modal-body').innerText(),/壓力錶同時跳動/);
   await page.locator('#modal-close').click();
   await deduce(['minebook','blueprintwall','furnace','cart'],['names','barrier','heatenergy','frost']);
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
   await deduce(['coffin','kiss'],['seventytwo','prince','unchanged','mirrorrealm']);
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
   await deduce(['rabbit','portrait','agreement'],['queen','lover','contract']);
   const replies=width<600?['no','third','yes']:['yes','sacrifice','no'];
   assert.match(await page.locator('#modal-body').innerText(),/沒有標準答案/);
   for(const [i,ans] of replies.entries()){await page.locator('[data-answer="'+ans+'"]').click();if(i<2)assert.ok((await page.locator('.queen-response').innerText()).length>10,'Vera answers each reply');}
   assert.equal(await page.locator('.queen-responses li').count(),3);
   assert.match(await page.locator('#modal-body').innerText(),width<600?/一模一樣/:/和當年的白雪不同/);
   await afterSeal('母親的最後記憶');
   await tapSpot(page,'witness',width<600);
   assert.equal(await page.locator('#take-item').count(),0,'reversed manuscript cannot be taken before it is mirrored');
   await page.locator('#restore-evidence').click();
   assert.equal(await page.locator('.reflection-cell').count(),16);
   for(const k of [1,4,5,6,7])await page.locator('[data-reflection="'+k+'"]').click();
   assert.match(await page.locator('#modal-body').innerText(),/失蹤的公主/);
   await page.locator('#take-item').click();
   // The mirror interrogation: gather the clue words from the scene, answer wrongly once, then fix two blanks.
   for(const id of ['lucy','heatplan']){await tapSpot(page,id,width<600);await page.locator('#modal-close').click();}
   await page.locator('#room-puzzle').click();
   assert.ok(await page.locator('.bank-word').count()>=7,'the notebook holds every word gathered across the journey so far');
   for(const word of ['heir','queen','prince','throne','remembered'])await page.locator('[data-word="'+word+'"]').click();
   await page.locator('#interrogation-submit').click();
   await page.locator('#modal').screenshot({path:'/tmp/blood-mirror-concept-preview/interrogation-'+width+'.png'});
   await noOverflow(page,'interrogation '+width);
   assert.match(await page.locator('#feedback').innerText(),/還有兩個謊言/);
   await page.locator('[data-blank="3"]').click();await page.locator('[data-word="blood"]').click();
   await page.locator('[data-blank="4"]').click();await page.locator('[data-word="forgotten"]').click();
   await page.locator('#interrogation-submit').click();
   await page.locator('#success-next').click();
   for(const ending of ['dawn','frost','crown']){
    await page.locator('[data-fate="'+ending+'"]').click();
    assert.ok(await page.locator('#ending-title').isVisible(),'ending invisible '+ending);
    if(ending!=='dawn'){assert.equal(await page.locator('#ending-concept [data-concept="'+ending+'"]').count(),1);await page.screenshot({path:'/tmp/blood-mirror-concept-preview/ending-'+ending+'-'+width+'.png',fullPage:true});}
    assert.ok(new RegExp(ending+'\\.(svg|png|webp)').test(await page.locator('.ending-art').getAttribute('style')));
    const image=await page.request.get(ORIGIN+'/games/blood-mirror/play/assets/endings/'+ending+'.svg');
    assert.equal(image.status(),200,'missing CG '+ending);
    if(ending==='crown')assert.match(await page.locator('#ending-recap').innerText(),width<600?/不想成為女王，最後卻戴上了王冠/:/想繼承王冠。妳做到了/);
    if(ending!=='crown')await page.locator('[data-action="reconsider"]').click();
   }
   assert.deepEqual(pageErrors,[],'browser error at '+width);
   const dims=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
   assert.ok(dims.scrollWidth<=dims.width+2,'horizontal overflow '+width+': '+JSON.stringify(dims));
   console.log('✓ Blood Mirror interactive journey, 7 chapters, 3 CG endings @ '+width+'px');
   await context.close();
  }
 }finally{if(browser)await browser.close();server.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});