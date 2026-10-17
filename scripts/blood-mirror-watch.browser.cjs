const {startPreviewServer,launchChromium}=require('./browser-harness.cjs');
const assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..'),origin='http://127.0.0.1:4173';

(async()=>{let browser;const server=startPreviewServer(root);
try{
 for(let i=0;i<40;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await launchChromium();
 for(const width of [360,1280]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>localStorage.setItem('blood-mirror-v2',JSON.stringify({version:2,started:true,chapter:'library',unlocked:['library'],solved:[],puzzles:['library.ledger'],inventory:[],seen:[],clues:[],endings:[],roster:['library','ballroom','hunter','mine','crypt','queen','mirror'],skipped:[]})));
  await page.goto(origin+'/games/blood-mirror/play/');
  await page.locator('#continue').click();await page.locator('#room-puzzle').click();
  await page.locator('#seal-evidence').click();await page.locator('#restore-evidence').click();
  const island=page.locator('[data-vue-watch-ready="true"]');
  try{await island.waitFor({timeout:5000});}
  catch(error){console.error('Watch stage fixture diagnostic:',await page.locator('#modal-title').innerText().catch(()=>'(no modal)'),await page.locator('#modal-body').innerText().catch(()=>'(no modal body)'));throw error;}

  assert.equal(await page.locator('.challenge[data-step="watch"] [data-vue-watch-puzzle]').count(),1);
  assert.equal(await page.locator('.watch-board [data-gear]').count(),3);
  assert.equal(await page.locator('.watch-puzzle [role="status"]').innerText(),'暖身 · 1 / 3 道刻痕已對準 · 已轉動 0 次');
  assert.ok((await page.locator('.challenge-help').innerText()).includes('先試一次'));
  const first=page.locator('[data-gear="0"]'),box=await first.boundingBox();assert.ok(box.width>=44&&box.height>=44);
  await first.click();
  assert.equal(await page.locator('[data-gear="0"]').getAttribute('aria-label'), '時輪，刻痕在第 3 格（共 6 格），尚未對準，按下轉動一格');
  assert.equal(await page.locator('.watch-puzzle [role="status"]').innerText(),'轉一枚，下一枚就倒退一格。錶芯真正的位置現在才露出來。');
  await page.locator('#watch-reset').click();
  assert.equal(await page.locator('[data-gear="0"]').getAttribute('aria-label'), '時輪，刻痕在第 3 格（共 6 格），尚未對準，按下轉動一格');
  assert.equal(await page.locator('[data-gear="1"]').getAttribute('aria-label'), '分輪，刻痕在第 5 格（共 6 格），尚未對準，按下轉動一格');
  assert.equal(await page.locator('[data-gear="2"]').getAttribute('aria-label'), '秒輪，刻痕在第 1 格（共 6 格），已對準，按下轉動一格');
  assert.equal(await page.locator('.watch-puzzle [role="status"]').innerText(),'1 / 3 道刻痕已對準 · 已轉動 0 次');
  await first.focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('.watch-puzzle [role="status"]').innerText(),'1 / 3 道刻痕已對準 · 已轉動 1 次');
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-gear')),'0','keyboard activation keeps focus on the same gear');
  for(let turn=0;turn<3;turn++)await page.locator('[data-gear="0"]').click();
  await page.waitForFunction(()=>{
   const puzzles=JSON.parse(localStorage.getItem('blood-mirror-v2')||'{}').puzzles||[];
   return puzzles.includes('library.watch')&&puzzles.includes('library');
  });
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('blood-mirror-v2')||'{}').puzzles?.includes('library.ledger')),'existing ledger stage completion remains in legacy progress');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no horizontal overflow');
  assert.deepEqual(errors,[]);
  console.log('✓ watch warm-up, keyboard turn, reset, solve and legacy progress @ '+width);

  const fallback=await page.evaluate(async()=>{
   const {mountWatch}=await import('/games/blood-mirror/play/puzzles/watch.js');
   const host=document.createElement('section');document.body.append(host);let completed=0;
   mountWatch({render:html=>{host.innerHTML=html},playCue:()=>{},done:()=>{completed++;}});
   const count=host.querySelectorAll('[data-gear]').length;
   host.querySelector('[data-gear="0"]').click();
   const actualStart=[...host.querySelectorAll('[data-gear]')].map(button=>button.className.match(/rot(\d)/)?.[1]);
   for(let turn=0;turn<4;turn++)host.querySelector('[data-gear="0"]').click();
   host.remove();return {count,actualStart,completed};
  });
  assert.equal(fallback.count,3,'legacy renderer remains available without the optional island callback');
  assert.deepEqual(fallback.actualStart,['2','4','0'],'legacy warm-up enters the same actual puzzle state');
  assert.equal(fallback.completed,1,'legacy renderer still owns the solved callback');
  await context.close();
 }
}finally{await browser?.close();server.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
