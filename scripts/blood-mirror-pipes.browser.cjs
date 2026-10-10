const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{mkdirSync}=require('node:fs'),{chromium}=require('playwright');
const root=require('node:path').resolve(__dirname,'..'),origin='http://127.0.0.1:4173',out='/tmp/blood-mirror-pipes-preview';
(async()=>{let browser;const server=spawn(process.execPath,[root+'/scripts/serve.cjs'],{cwd:root,stdio:'ignore'});
try{for(let i=0;i<40;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});mkdirSync(out,{recursive:true});
for(const width of [360,390,768,1280]){
 const context=await browser.newContext({viewport:{width,height:850},isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('blood-mirror-v1',JSON.stringify({version:1,started:true,room:1,solved:[0],inventory:['watch','valve'],seen:['valve'],endings:[]})));
 await page.goto(origin+'/games/blood-mirror/play/');await page.locator('#continue').click();await page.locator('#room-puzzle').click();await page.locator('#seal-evidence').click();await page.locator('#restore-evidence').click();
 assert.equal(await page.locator('.pipe-piece').count(),5);assert.equal(await page.locator('#pipes-confirm').isDisabled(),true);
 await page.locator('#modal').screenshot({path:out+'/pipes-'+width+'-after.png'});
 const first=page.locator('[data-pipe="0"]'),box=await first.boundingBox();assert.ok(box.width>=44&&box.height>=44);
 if(width<600)await first.tap();else await first.click();assert.ok((await page.locator('#pipes-status').innerText()).includes('1 / 5'));assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('data-pipe')),'0');
 const after=await first.boundingBox();assert.equal(after.width,box.width);assert.equal(after.height,box.height);
 await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('data-pipe')),'1');await page.keyboard.press('Enter');
 await page.locator('#pipes-hint').click();assert.ok((await page.locator('#pipes-hint-text').innerText()).includes('左右相通'));
 const state=await page.locator('[data-pipe="1"]').getAttribute('data-pipe-ports');await page.keyboard.press('Escape');await page.locator('[data-clue="pipes"]').evaluate(el=>el.click());await page.locator('#restore-evidence').click();assert.equal(await page.locator('[data-pipe="1"]').getAttribute('data-pipe-ports'),state);
 await page.locator('#pipes-undo').click();assert.equal(await page.locator('[data-pipe="1"]').getAttribute('data-pipe-ports'),'0,1');
 await page.locator('#pipes-reset').click();assert.equal(await page.locator('#pipes-undo').isDisabled(),true);assert.ok((await page.locator('#pipes-status').innerText()).includes('0 / 5'));
 for(const [i,count] of [1,2,2,2,2].entries())for(let n=0;n<count;n++)await page.locator('[data-pipe="'+i+'"]').click();
 assert.equal(await page.locator('#pipes-confirm').isEnabled(),true);assert.equal(await page.locator('.pipe-piece.flowing').count(),5);assert.equal(await page.locator('.pipe-city .pipe-terminal-status').innerText(),'已接通');
 assert.ok(await page.evaluate(()=>!JSON.parse(localStorage.getItem('blood-mirror-challenges-v2')||'[]').includes('mine')),'should not finish before confirmation');
 await page.locator('#modal-body').evaluate(el=>el.scrollTop=0);await page.locator('#modal').screenshot({path:out+'/pipes-'+width+'-connected.png'});
 await page.locator('#pipes-confirm').click();assert.match(await page.locator('#modal-body').innerText(),/壓力錶同時跳動/);await page.locator('#modal-close').click();await page.locator('#room-puzzle').click();assert.equal(await page.locator('[data-option]').count(),3);assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('blood-mirror-challenges-v2')).includes('mine')));
 for(const option of ['water','heat','city'])await page.locator('[data-option="'+option+'"]').click();await page.locator('#submit-seq').click();assert.equal(await page.locator('#modal-title').innerText(),'封印已解開');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));assert.deepEqual(errors,[]);console.log('✓ reciprocal flow, touch/keyboard, undo/reset, reopen, hint, explicit confirm, restored evidence and valve seal @ '+width);await context.close();
}
// Legacy completed challenge saves skip the revised interaction without losing progress.
const legacy=await browser.newPage();await legacy.addInitScript(()=>{localStorage.setItem('blood-mirror-v1',JSON.stringify({version:1,started:true,room:1,solved:[0],inventory:['valve'],endings:[]}));localStorage.setItem('blood-mirror-challenges-v2','["mine"]');});await legacy.goto(origin+'/games/blood-mirror/play/');await legacy.locator('#continue').click();await legacy.locator('#room-puzzle').click();assert.equal(await legacy.locator('[data-option]').count(),3);assert.equal(await legacy.locator('.pipe-piece').count(),0);console.log('✓ legacy completed mine progress remains compatible');
}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
