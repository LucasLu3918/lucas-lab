#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {startPreviewServer,launchChromium}=require('./browser-harness.cjs');

const ROOT=path.resolve(__dirname,'..');
const ORIGIN='http://127.0.0.1:4173';
const CAPTURES=path.join(ROOT,'visual-audit-artifacts');

async function run(){
 const server=startPreviewServer(ROOT);
 let browser;
 try{
  for(let attempt=0;attempt<40;attempt++){
   try{if((await fetch(ORIGIN+'/')).ok)break}catch{}
   await new Promise(resolve=>setTimeout(resolve,250));
   if(attempt===39)throw new Error('Local preview server did not start');
  }
  browser=await launchChromium();
  fs.mkdirSync(CAPTURES,{recursive:true});
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));

  await page.goto(ORIGIN+'/tarot/',{waitUntil:'load'});
  await page.locator('.mode-option').filter({hasText:'深入占卜'}).click();
  await page.locator('.spread-option').filter({hasText:'五張深入探索'}).click();
  const privateQuestion='browser-only-private-question';
  await page.locator('.question-panel textarea').fill(privateQuestion);
  await page.getByRole('button',{name:/洗牌並展開/}).click();
  assert.equal(await page.locator('.tarot-card--back').count(),5,'deep Tarot spread should draw five cards');
  for(let index=0;index<5;index++)await page.getByRole('button',{name:/揭開/}).first().click();
  await page.waitForFunction(()=>document.querySelectorAll('.meaning-card').length===5);
  assert.match(await page.locator('.reading-context').textContent(),new RegExp(privateQuestion));
  assert.equal((await page.locator('.share-copy textarea').inputValue()).includes(privateQuestion),false,'private question leaked into Tarot share copy');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'five-card Tarot reading overflows the mobile viewport');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForFunction(()=>window.scrollY===0);
  await page.screenshot({path:path.join(CAPTURES,'tarot-deep-390.png'),fullPage:true,animations:'disabled'});
  console.log('✓ Tarot five-card reading reveals all positions and keeps the private question out of share text');

  await page.goto(ORIGIN+'/bazi/',{waitUntil:'load'});
  await page.locator('input[name="bazi-precision"][value="false"]').check();
  await page.locator('input[type="date"]').fill('1990-06-15');
  await page.locator('input[type="time"]').fill('08:30');
  await page.locator('select').nth(1).selectOption('1');
  await page.getByRole('button',{name:/排出完整四柱/}).click();
  assert.equal(await page.locator('.pillar').count(),4,'BaZi full mode should show four pillars');
  assert.ok(await page.locator('.strength').isVisible(),'BaZi support signals missing');
  assert.ok(await page.locator('.dayun').isVisible(),'BaZi DaYun panel missing');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'BaZi reading overflows the mobile viewport');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForFunction(()=>window.scrollY===0);
  await page.screenshot({path:path.join(CAPTURES,'bazi-reading-390.png'),fullPage:true,animations:'disabled'});
  console.log('✓ BaZi full mode renders four pillars, qualitative support signals and selected DaYun');

  await page.goto(ORIGIN+'/astrology/',{waitUntil:'load'});
  await page.locator('input[name="astrology-precision"][value="false"]').check();
  await page.locator('input[type="date"]').fill('1990-06-15');
  await page.locator('input[type="time"]').fill('08:30');
  await page.getByRole('button',{name:/繪製深入星盤/}).click();
  await page.locator('.planet').nth(9).waitFor({timeout:15000});
  assert.equal(await page.locator('.planet').count(),10,'Astrology chart should show ten placements');
  await page.locator('.forecast-grid .forecast').nth(2).waitFor({timeout:15000});
  assert.equal(await page.locator('.forecast-grid .forecast').count(),3,'Astrology forecast periods missing');
  const natalMethod=page.locator('details.method').filter({hasText:'本命星盤計算方法與限制'});
  assert.match(await natalMethod.textContent(),/每 12 小時取樣/,'12-hour transit sampling is not disclosed');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Astrology forecast overflows the mobile viewport');
  const transitDetails=page.locator('.transit-details').first();
  if(await transitDetails.count())await transitDetails.locator('summary').click();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForFunction(()=>window.scrollY===0);
  await page.screenshot({path:path.join(CAPTURES,'astrology-reading-390.png'),fullPage:true,animations:'disabled'});
  await page.goto(ORIGIN+'/meihua/',{waitUntil:'load'});
  await page.locator('input[name="meihua-method"][value="numbers"]').check();
  await page.locator('input[type="text"]').first().fill('7 3');
  await page.getByRole('button',{name:'起卦'}).click();
  await page.locator('.hexagram-table').waitFor({timeout:15000});
  assert.match(await page.locator('.hexagram-table').textContent(),/山火賁/,'Meihua numbers 7 3 should cast 山火賁');
  assert.match(await page.locator('.summary-line').textContent(),/第 4 爻/,'Meihua numbers 7 3 should move line 4');
  await page.locator('select').first().selectOption('love');
  assert.match(await page.locator('.reading-card').filter({hasText:'感情'}).first().textContent(),/體卦/,'Meihua topic notes did not follow the selected topic');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Meihua reading overflows the mobile viewport');
  await page.locator('input[name="meihua-method"][value="time"]').check();
  await page.getByRole('button',{name:'起卦'}).click();
  await page.waitForFunction(()=>document.querySelector('.meta')?.textContent.includes('農曆'),null,{timeout:15000});
  await page.locator('input[name="meihua-method"][value="text"]').check();
  await page.locator('input[type="text"]').first().fill('龘');
  await page.getByRole('button',{name:'起卦'}).click();
  await page.locator('.cast-form .error').waitFor({timeout:15000});
  assert.match(await page.locator('.cast-form .error').textContent(),/尚未收錄筆畫/,'Unknown character should explain the stroke gap');
  await page.locator('input[type="text"]').first().fill('财');
  await page.getByRole('button',{name:'起卦'}).click();
  await page.locator('.hexagram-table').waitFor({timeout:15000});
  assert.match(await page.locator('.hexagram-table').textContent(),/艮為山/,'Meihua text 财 should cast 艮為山');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForFunction(()=>window.scrollY===0);
  await page.screenshot({path:path.join(CAPTURES,'meihua-reading-390.png'),fullPage:true,animations:'disabled'});
  console.log('✓ Meihua casts by number, time and text, follows the topic selector and reports unknown characters');

  assert.deepEqual(errors,[],'divination pages emitted browser JavaScript errors');
  console.log('✓ Astrology detailed chart and daily-stepped transit windows render without browser errors');

  // Offline: the worker precaches every module page and the chunks the hub loads lazily, so a visitor who has never opened
  // a module (or the hub) can still use them after the worker takes control of the page.
  const offlineContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const offlinePage=await offlineContext.newPage();
  const offlineErrors=[];
  offlinePage.on('pageerror',error=>offlineErrors.push(error.message));
  await offlinePage.goto(ORIGIN+'/',{waitUntil:'load'});
  await offlinePage.waitForFunction(()=>navigator.serviceWorker.controller!==null,null,{timeout:15000});
  await offlineContext.setOffline(true);
  await offlinePage.goto(ORIGIN+'/divination/',{waitUntil:'load'});
  await offlinePage.locator('.today').waitFor();
  assert.match(await offlinePage.locator('.today-card').first().textContent(),/今日一抽/,'hub overview did not render offline');
  await offlinePage.locator('.today select').selectOption('aries');
  await offlinePage.locator('.today-card__tip').waitFor({timeout:10000});
  await offlinePage.goto(ORIGIN+'/ziwei/',{waitUntil:'load'});
  assert.match(await offlinePage.locator('h1').first().textContent(),/紫微斗數/,'ziwei page did not open offline');
  await offlinePage.goto(ORIGIN+'/astrology/',{waitUntil:'load'});
  await offlinePage.locator('input[type="date"]').fill('1990-06-15');
  await offlinePage.getByRole('button',{name:/查看簡易星盤/}).click();
  await offlinePage.locator('.forecast-grid .forecast').nth(2).waitFor({timeout:15000});
  assert.equal(await offlinePage.locator('.forecast-grid .forecast').count(),3,'astrology forecast worker did not load offline');
  assert.deepEqual(offlineErrors,[],'offline module visit emitted JavaScript errors');
  await offlineContext.close();
  console.log('✓ Offline: a visitor who never opened a module still gets the hub, its lazy horoscope reading, the ziwei page and astrology forecasts (worker)');
  console.log('PASS: divination browser acceptance');
 }finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
 }
}
run().catch(error=>{console.error('FAIL:',error.stack||error);process.exitCode=1});
