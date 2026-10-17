const {startPreviewServer,launchChromium}=require('./browser-harness.cjs');
const assert=require('node:assert/strict'),{mkdirSync}=require('node:fs');
const root=require('node:path').resolve(__dirname,'..'),origin='http://127.0.0.1:4173',out='/tmp/blood-mirror-ledger-preview';
(async()=>{let browser;const server=startPreviewServer(root);
try{for(let i=0;i<40;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}browser=await launchChromium();mkdirSync(out,{recursive:true});
for(const width of [360,390,768,1280]){
 const context=await browser.newContext({viewport:{width,height:850},isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('blood-mirror-v1',JSON.stringify({version:1,started:true,room:0,solved:[],inventory:[],seen:[],endings:[]})));
 await page.goto(origin+'/games/blood-mirror/play/');await page.locator('#continue').click();await page.locator('#room-puzzle').click();await page.locator('#seal-evidence').click();await page.locator('#restore-evidence').click();await page.locator('[data-stage-pick="ledger"]').click();
 const root=page.locator('[data-vue-ledger-ready="true"]');await root.waitFor();
 assert.equal(await page.locator('.ledger-board [data-pos]').count(),9);assert.equal(await page.locator('.ledger-board svg').count(),9);assert.ok(await page.locator('#ledger-reset').isVisible());
 await page.locator('#modal').screenshot({path:out+'/ledger-'+width+'-initial.png'});
 const first=page.locator('[data-pos="0"]'),box=await first.boundingBox();assert.ok(box.width>=44&&box.height>=44);
 if(width<600)await first.tap();else await first.click();assert.equal(await first.getAttribute('aria-pressed'),'true');
 await page.locator('#ledger-reset').click();assert.equal(await first.getAttribute('aria-pressed'),'false');assert.ok((await page.locator('#modal-body').innerText()).includes('2 / 9'));
 await page.locator('[data-pos="0"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('data-pos')),'1');
 const swaps=[[0,4],[2,7],[4,6],[5,7],[6,8]];
 for(const [firstCell,secondCell] of swaps){await page.locator(`[data-pos="${firstCell}"]`).click();await page.locator(`[data-pos="${secondCell}"]`).click();}
 await page.locator('.challenge[data-step="watch"]').waitFor();
 assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('blood-mirror-v2')||'{}').puzzles?.includes('library.ledger')),'ledger stage completion remains in legacy progress');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));assert.deepEqual(errors,[]);console.log('✓ touch/keyboard, reset, nine-piece solve and legacy progress @ '+width);await context.close();
}
}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
