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
  await page.addInitScript(()=>localStorage.setItem('blood-mirror-v2',JSON.stringify({version:2,started:true,chapter:'ballroom',unlocked:['library','ballroom'],solved:['library'],puzzles:['ballroom.masks'],inventory:[],seen:[],clues:[],endings:[],roster:['library','ballroom','hunter','mine','crypt','queen','mirror'],skipped:[]})));
  await page.goto(origin+'/games/blood-mirror/play/');
  await page.locator('#continue').click();await page.locator('#room-puzzle').click();
  await page.locator('#seal-evidence').click();await page.locator('#restore-evidence').click();
  try{await page.locator('[data-vue-light-ready="true"]').waitFor({timeout:5000});}
  catch(error){console.error('Light stage fixture diagnostic:',await page.locator('#modal-title').innerText().catch(()=>'(no modal)'),await page.locator('#modal-body').innerText().catch(()=>'(no modal body)'));throw error;}
  assert.equal(await page.locator('.challenge[data-step="light"] [data-vue-light-puzzle]').count(),1);
  assert.equal(await page.locator('.light-board .light-cell').count(),30);
  assert.equal(await page.locator('[data-mirror]').count(),4);
  assert.equal(await page.locator('.light-door.open').count(),0);
  const first=page.locator('[data-mirror="0"]'),box=await first.boundingBox();assert.ok(box.width>=44&&box.height>=44);
  await first.focus();await page.keyboard.press('Enter');
  assert.equal(await first.getAttribute('aria-pressed'),'true','native buttons remain keyboard operable');
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-mirror')),'0','Vue updates preserve mirror focus');
  await page.locator('#light-reset').click();
  assert.deepEqual(await Promise.all([0,1,2,3].map(index=>page.locator(`[data-mirror="${index}"]`).getAttribute('aria-pressed'))),['false','false','true','true']);
  assert.equal(await page.locator('.light-door.open').count(),0);
  for(let index=0;index<4;index++)await page.locator(`[data-mirror="${index}"]`).click();
  await page.waitForFunction(()=>{
   const puzzles=JSON.parse(localStorage.getItem('blood-mirror-v2')||'{}').puzzles||[];
   return puzzles.includes('ballroom.light')&&puzzles.includes('ballroom');
  });
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no horizontal overflow');
  assert.deepEqual(errors,[]);
  console.log('✓ light island, keyboard flip, reset, solved path and legacy stage progress @ '+width);
  await context.close();
 }
}finally{await browser?.close();server.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
