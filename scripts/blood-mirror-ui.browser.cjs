const assert=require('node:assert/strict');const {spawn}=require('node:child_process');const {mkdirSync}=require('node:fs');const {chromium}=require('playwright');
const root=require('node:path').resolve(__dirname,'..'),origin='http://127.0.0.1:4173',out='/tmp/blood-mirror-ui-audit';
const noOverflow=async(page,label)=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),label+' overflows');
(async()=>{let browser;const server=spawn(process.execPath,[root+'/scripts/serve.cjs'],{cwd:root,stdio:'ignore'});
try{for(let i=0;i<40;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});mkdirSync(out,{recursive:true});
for(const width of [360,390,768,1280,1440]){
 const context=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/games/blood-mirror/play/');await noOverflow(page,'home '+width);await page.screenshot({path:out+'/home-'+width+'-after.png'});
 assert.ok(await page.locator('.brand-mark').evaluate(img=>img.complete&&img.naturalWidth>0));
 if(width<=850){await page.locator('#game-menu').click();assert.equal(await page.locator('#game-menu').getAttribute('aria-expanded'),'true');await page.screenshot({path:out+'/menu-'+width+'-after.png'});await page.keyboard.press('Escape');assert.equal(await page.locator('#game-menu').getAttribute('aria-expanded'),'false');assert.equal(await page.evaluate(()=>document.activeElement.id),'game-menu');}
 await page.locator('#start').click();await page.locator('#intro-explore').click();await noOverflow(page,'game '+width);await page.screenshot({path:out+'/game-'+width+'-after.png'});
 assert.ok(await page.locator('#objective').isVisible());assert.equal(await page.locator('#truth-progress').getAttribute('value'),'0');
 if(!await page.locator('#scene-clues').evaluate(el=>el.open))await page.locator('#scene-clues summary').click();
 await page.locator('[data-clue="watch"]').click();assert.equal(await page.locator('#modal-title').innerText(),'黃金懷錶');await page.locator('#take-item').click();assert.equal(await page.locator('[data-clue="watch"] small').innerText(),'已收取');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('data-clue')),'watch');
 await page.locator('#room-puzzle').click();await page.locator('#modal').screenshot({path:out+'/puzzle-'+width+'-after.png'});
 await page.locator('#modal-body').evaluate(el=>{el.scrollTop=el.scrollHeight;});const close=await page.locator('#modal-close').boundingBox();assert.ok(close&&close.y>=0&&close.y+close.height<=850,'close hidden while scrolling');await page.keyboard.press('Escape');
 await page.locator('.settings-toggle').click();await page.locator('#setting-text').click();assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('large-text')));await page.screenshot({path:out+'/settings-'+width+'-after.png'});await page.keyboard.press('Escape');
 await page.reload();assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('large-text')));assert.ok((await page.locator('#continue').getAttribute('class')).includes('primary-button'));
 await page.locator('#continue').click();await page.locator('.game-tools [data-action="gallery"]').click();await noOverflow(page,'gallery '+width);await page.screenshot({path:out+'/gallery-'+width+'-after.png'});
 await page.locator('[data-artwork="library"]').click();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#modal-title').innerText(),'玻璃棺室');await page.keyboard.press('Escape');
 const prefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('blood-mirror-ui-v1')));assert.equal(prefs.largeText,true);
 assert.deepEqual(errors,[]);console.log('✓ menu, clue exploration, focus restore, pinned dialog header, preferences, gallery keyboard @ '+width);await context.close();
}
// Favicon routes and actual 16/32/64px rendering.
const icons=await browser.newPage({viewport:{width:640,height:280}});await icons.goto(origin+'/');assert.equal(await icons.locator('link[rel="icon"]').getAttribute('href'),'/assets/favicon.svg');
for(const path of ['/assets/favicon.svg','/games/blood-mirror/play/favicon.svg']){const r=await icons.request.get(origin+path);assert.equal(r.status(),200);assert.ok(r.headers()['content-type'].includes('image/svg+xml'));}
await icons.setContent(`<html><body style="margin:0;padding:32px;background:#101017;color:#e9dcc9;font:14px system-ui"><p>LUCAS LAB · 16 / 32 / 64 px</p>${[16,32,64].map(n=>`<img src="${origin}/assets/favicon.svg" width="${n}" height="${n}" style="margin-right:24px;vertical-align:middle">`).join('')}<p>血色魔鏡 · 16 / 32 / 64 px</p>${[16,32,64].map(n=>`<img src="${origin}/games/blood-mirror/play/favicon.svg" width="${n}" height="${n}" style="margin-right:24px;vertical-align:middle">`).join('')}</body></html>`);await icons.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));await icons.screenshot({path:out+'/favicons-after.png'});console.log('✓ main-site and game favicons load and render at 16/32/64px');
}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
