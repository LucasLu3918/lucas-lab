const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {mkdirSync}=require('node:fs');
const {chromium}=require('playwright');
const origin='http://127.0.0.1:4173',root=require('node:path').resolve(__dirname,'..');
(async()=>{const server=spawn(process.execPath,[root+'/scripts/serve.cjs'],{cwd:root,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<40;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});mkdirSync('/tmp/blood-mirror-gallery-preview',{recursive:true});
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/games/blood-mirror/play/');
   await page.locator('.gallery-invite button').click();assert.equal(await page.locator('[data-artwork]').count(),7);assert.equal(await page.locator('.artwork-locked').count(),6);
   assert.equal(await page.locator('#gallery img[src*="endings"]').count(),0);
   await page.locator('[data-gallery-filter="scene"]').click();assert.equal(await page.locator('[data-artwork]').count(),5);
   await page.locator('[data-artwork="library"]').click();await page.locator('.artwork-preview img').evaluate(img=>img.decode());
   await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#modal-title').innerText(),'銀骨礦坑');await page.keyboard.press('Escape');
   await page.locator('[data-gallery-filter="concept"]').click();assert.equal(await page.locator('.artwork-locked').count(),3);
   await page.locator('[data-gallery-filter="all"]').click();await page.screenshot({path:'/tmp/blood-mirror-gallery-preview/gallery-'+width+'.png',fullPage:true});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   await page.locator('#gallery-return').click();await page.locator('#start').click();await page.locator('#intro-explore').click();
   await page.locator('.game-tools [data-action="gallery"]').click();await page.locator('#gallery-return').click();assert.ok(await page.locator('#game').isVisible());
   // Load a valid completed save to exercise archived CG and reset retention.
   const completed=await page.evaluate(async()=>{const {initialState,rooms,collect,solve,travel,chooseEnding,SAVE_KEY}=await import('./engine.js');const s=initialState();s.started=true;for(let i=0;i<5;i++){travel(s,i);const r=rooms[i];if(r.requires)collect(s,r.spots.find(x=>x.item===r.requires).id);solve(s,r.answer);}chooseEnding(s,'dawn');return {key:SAVE_KEY,value:JSON.stringify(s)};});
   await page.addInitScript(({key,value})=>localStorage.setItem(key,value),completed);
   await page.reload();await page.locator('.gallery-invite button').click();assert.equal(await page.locator('[data-artwork="dawn"]').count(),1);assert.equal(await page.locator('.artwork-locked').count(),5);
   await page.locator('[data-artwork="dawn"]').click();await page.locator('.artwork-preview img').evaluate(img=>img.decode());await page.waitForFunction(()=>document.querySelector('.artwork-preview img').getAttribute('src').endsWith('dawn.png'));await page.keyboard.press('Escape');
   await page.locator('#gallery-return').click();await page.locator('#start').click();await page.locator('#reset-confirm').click();await page.locator('#intro-explore').click();await page.locator('.game-tools [data-action="gallery"]').click();assert.equal(await page.locator('[data-artwork="dawn"]').count(),1);
   const fullSave=JSON.parse(completed.value);fullSave.endings=['dawn','frost','crown'];
   const archive=await context.newPage();await archive.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:completed.key,value:JSON.stringify(fullSave)});
   await archive.goto(origin+'/games/blood-mirror/play/');await archive.locator('.gallery-invite button').click();await archive.locator('[data-gallery-filter="concept"]').click();
   assert.equal(await archive.locator('[data-artwork]').count(),3);await archive.locator('#gallery img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
   await archive.screenshot({path:'/tmp/blood-mirror-gallery-preview/concepts-'+width+'.png',fullPage:true});
   await archive.locator('[data-artwork="design-board-1"]').click();await archive.locator('.artwork-preview img').evaluate(img=>img.decode());await archive.keyboard.press('Escape');
   assert.deepEqual(errors,[]);console.log('✓ gallery, locked CG, SVG fallback, keyboard, reset retention @ '+width);await context.close();
  }
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
