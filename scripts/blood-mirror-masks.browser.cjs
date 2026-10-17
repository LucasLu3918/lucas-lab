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
  await page.addInitScript(()=>localStorage.setItem('blood-mirror-v2',JSON.stringify({version:2,started:true,chapter:'ballroom',unlocked:['library','ballroom'],solved:['library'],puzzles:['library'],inventory:[],seen:[],clues:[],endings:[],roster:['library','ballroom','hunter','mine','crypt','queen','mirror'],skipped:[]})));
  await page.goto(origin+'/games/blood-mirror/play/');
  await page.locator('#continue').click();await page.locator('#room-puzzle').click();
  await page.locator('#seal-evidence').click();await page.locator('#restore-evidence').click();
  try{await page.locator('[data-stage-pick="masks"]').waitFor({timeout:5000});}
  catch(error){console.error('Masks stage fixture diagnostic:',await page.locator('#modal-title').innerText().catch(()=>'(no modal)'),await page.locator('#modal-body').innerText().catch(()=>'(no modal body)'));throw error;}
  await page.locator('[data-stage-pick="masks"]').click();await page.locator('[data-vue-masks-ready="true"]').waitFor();
  assert.equal(await page.locator('[data-mask]').count(),6);
  assert.equal(await page.locator('.mask-clues li').count(),5);
  assert.notDeepEqual(await page.locator('[data-mask="0"] option').evaluateAll(options=>options.slice(1).map(option=>option.value)),['0','1','2','3','4','5']);
  const first=page.locator('[data-mask="0"]'),box=await first.boundingBox();assert.ok(box.width>=44&&box.height>=44);

  await first.focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-mask')),'1','native selects remain keyboard reachable');
  await page.locator('#masks-reset').click();assert.deepEqual(await page.locator('[data-mask]').evaluateAll(selects=>selects.map(select=>select.value)),['-1','-1','-1','-1','-1','-1']);
  await first.selectOption('1');await page.locator('#masks-confirm').click();
  assert.match(await page.locator('.challenge-feedback').innerText(),/還有面具沒有選人/);
  for(const select of await page.locator('[data-mask]').all())await select.selectOption('1');
  await page.locator('#masks-confirm').click();assert.match(await page.locator('.challenge-feedback').innerText(),/同一個人不可能同時戴著兩張面具/);
  for(const [index,guest] of [1,0,2,3,4,5].entries())await page.locator(`[data-mask="${index}"]`).selectOption(String(guest));
  await page.locator('#masks-confirm').click();assert.match(await page.locator('.challenge-feedback').innerText(),/第 1 則證詞說不通/);
  assert.doesNotMatch(await page.locator('.challenge-feedback').innerText(),/\/ 6/);

  for(let index=0;index<6;index++)await page.locator(`[data-mask="${index}"]`).selectOption(String(index));
  await page.locator('#masks-confirm').click();await page.locator('.challenge[data-step="light"] [data-mirror]').first().waitFor();
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('blood-mirror-v2')||'{}').puzzles?.includes('ballroom.masks')),'legacy stage progress remains persisted');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no horizontal overflow');
  assert.deepEqual(errors,[]);console.log('✓ masks island, keyboard/native selects, reset, legacy feedback and stage progress @ '+width);
  await context.close();
 }
}finally{await browser?.close();server.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
