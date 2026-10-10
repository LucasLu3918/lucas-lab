const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const root=require('node:path').resolve(__dirname,'..'),origin='http://127.0.0.1:4173';
(async()=>{let browser;const server=spawn(process.execPath,[root+'/scripts/serve.cjs'],{cwd:root,stdio:'ignore'});
 try{
  for(let i=0;i<40;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
  const page=await browser.newPage();await page.goto(origin+'/games/blood-mirror/play/');
  const result=await page.evaluate(async()=>{
   const {createSoundtrack,soundtrackFiles}=await import('./soundtrack.js');
   const soundtrack=createSoundtrack(),NativeAudio=window.Audio,players=[];
   window.Audio=function(src){const audio=new NativeAudio(src);players.push(audio);return audio;};
   const wait=async(check)=>{for(let i=0;i<150;i++){if(check())return;await new Promise(r=>setTimeout(r,50));}throw Error('audio timeout '+JSON.stringify(soundtrack.getStatus()));};
   const results=[];
   for(const [id,file] of Object.entries(soundtrackFiles)){
    const response=await fetch('assets/music/'+file);if(!response.ok||!response.headers.get('content-type').includes('audio/mpeg'))throw Error('missing audio MIME '+file);
    if(!results.length)await soundtrack.start(id);else soundtrack.select(id);
    await wait(()=>soundtrack.getStatus().source==='mp3'&&soundtrack.getStatus().currentTime>0);
    const player=players.at(-1);await new Promise(r=>setTimeout(r,650));
    const status=soundtrack.getStatus();if(status.synthGain>.001)throw Error('synth did not fade out');
    if(!player.loop||player.duration<30||player.duration>37)throw Error('invalid preview duration');
    player.currentTime=player.duration-.15;await wait(()=>player.currentTime<2);
    if(players.slice(0,-1).some(p=>!p.paused))throw Error('previous track still playing');
    results.push({id,seconds:player.duration,loop:player.loop});
   }
   soundtrack.stop();if(players.some(p=>!p.paused)||soundtrack.getStatus().active)throw Error('audio did not stop');
   window.Audio=NativeAudio;return results;
  });console.log('✓ All nine MP3s decode, loop and switch without synth overlap:',JSON.stringify(result));
  await page.locator('.gallery-invite button').click();await page.locator('#gallery-listening summary').click();
  assert.equal(await page.locator('#gallery-track option').count(),7); // 6 scene tracks + compilation; endings stay hidden.
  await page.locator('#gallery-track').selectOption('assets/music/highlights.mp3');
  await page.locator('#gallery-audio').evaluate(a=>a.play());await page.waitForFunction(()=>document.querySelector('#gallery-audio').currentTime>0);
  await page.locator('#sound').click();assert.ok(await page.locator('#gallery-audio').evaluate(a=>a.paused));
  await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
  await page.locator('#gallery-audio').evaluate(a=>a.play());await page.waitForFunction(()=>document.querySelector('#gallery-audio').currentTime>0);
  await page.locator('#gallery-return').click();assert.ok(await page.locator('#gallery-audio').evaluate(a=>a.paused));
  console.log('✓ Compilation preview plays; leaving gallery stops it; undiscovered ending tracks hidden');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
