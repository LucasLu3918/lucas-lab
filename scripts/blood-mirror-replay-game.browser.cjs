#!/usr/bin/env node
'use strict';
const {startPreviewServer,launchChromium}=require('./browser-harness.cjs');
// Seal clear → "選擇小遊戲重玩": the picker lists finished mini-games, each replay starts on a fresh board,
// returns to the picker (repeatable), and never changes the journey's progress.
const assert=require('node:assert/strict');
const ROOT=require('node:path').resolve(__dirname,'..'),origin='http://127.0.0.1:4173';

// Ledger start order (see puzzles/ledger.js): swaps that put every piece in its own cell.
const LEDGER_START=[4,0,8,2,6,1,3,7,5];
function ledgerSwaps(start){
 const tiles=[...start],swaps=[];
 for(let i=0;i<tiles.length;i++)if(tiles[i]!==i){const j=tiles.indexOf(i);[tiles[i],tiles[j]]=[tiles[j],tiles[i]];swaps.push([i,j]);}
 return swaps;
}

// Watch gears (see puzzles/watch.js): breadth-first search for the shortest turn sequence to the marks.
const TEETH=6;
const turnGear=(gears,i)=>{const next=[...gears];next[i]=(next[i]+1)%TEETH;const j=(i+1)%3;next[j]=(next[j]+TEETH-1)%TEETH;return next;};
function gearTurns(start){
 const key=g=>g.join(','),parent=new Map([[key(start),null]]);
 let frontier=[start];
 while(frontier.length){
  const following=[];
  for(const gears of frontier){
   if(gears.every(p=>p===0)){
    const turns=[];
    for(let k=key(gears),step=parent.get(k);step;k=step[0],step=parent.get(k))turns.unshift(step[1]);
    return turns;
   }
   for(let i=0;i<3;i++){const next=turnGear(gears,i),k=key(next);if(!parent.has(k)){parent.set(k,[key(gears),i]);following.push(next);}}
  }
  frontier=following;
 }
 throw new Error('gear marks unreachable');
}

async function solveLedger(page){
 for(const [a,b] of ledgerSwaps(LEDGER_START)){
  await page.locator('[data-pos="'+a+'"]').click();
  await page.locator('[data-pos="'+b+'"]').click();
 }
}
async function solveWatch(page){
 await page.locator('[data-gear="0"]').click(); // warm-up turn: the hour gear pulls the minute gear home
 for(const i of gearTurns([2,4,0]))await page.locator('[data-gear="'+i+'"]').click();
}

(async()=>{
 const server=startPreviewServer(ROOT);let browser;
 try{
  for(let i=0;i<40;i++){try{if((await fetch(origin+'/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
  browser=await launchChromium();
  // First act is at its seal: evidence still torn, the deduction already answered, the watch in hand.
  const journey={version:1,started:true,room:0,solved:[],inventory:['watch'],seen:['watch'],endings:[],deduced:[0],elapsed:0,hints:{}};
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await context.addInitScript(s=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.setItem('blood-mirror-v1',s);localStorage.setItem('blood-mirror-challenges-v2','[]');},JSON.stringify(journey));
   await page.goto(origin+'/games/blood-mirror/play/');
   await page.locator('#continue').click();
   await page.locator('#room-puzzle').click();
   await page.locator('#seal-evidence').click();
   await page.locator('#restore-evidence').click();
   await page.locator('[data-stage-pick="ledger"]').click(); // two stages open: pick the ledger first
   await solveLedger(page);
   await solveWatch(page);
   if(await page.locator('#modal').evaluate(d=>d.open))await page.locator('#modal-close').click();
   await page.locator('#room-puzzle').click();
   await page.locator('#code').fill('1373');
   await page.locator('#code-form button[type="submit"]').click();

   // The seal's success screen offers the picker next to the existing choices.
   await page.locator('#success-replay').waitFor();
   assert.equal(await page.locator('#modal-title').innerText(),'封印已解開');
   await page.locator('#success-replay').click();
   assert.equal(await page.locator('#modal-title').innerText(),'重玩小遊戲');
   assert.equal(await page.locator('[data-replay]').count(),1,'only the finished mini-game is offered');
   assert.match(await page.locator('[data-replay="library"]').innerText(),/第一幕 · 撕碎的出生紀錄/);

   // Replay the same mini-game twice: each run starts on a fresh board and returns to the picker.
   for(let round=1;round<=2;round++){
    await page.locator('[data-replay="library"]').click();
    await page.locator('.ledger-board').waitFor();
    assert.equal(await page.locator('.ledger-tile.placed').count(),1,'replay '+round+' starts from the scrambled board');
    await solveLedger(page);
    await solveWatch(page);
    await page.locator('[data-replay]').first().waitFor();
    assert.equal(await page.locator('#modal-title').innerText(),'重玩小遊戲','round '+round+' returns to the picker');
    assert.match(await page.locator('#toast').innerText(),/重玩完成/);
   }

   // Replays are not progress: the journey still has the one solved act and no extra mini-game records.
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('blood-mirror-v2')));
   assert.deepEqual(saved.solved,['library'],'replays must not change the journey');

   // Back returns to the seal's success screen, which keeps its own choices.
   await page.locator('#replay-back').click();
   assert.equal(await page.locator('#modal-title').innerText(),'封印已解開');
   await page.locator('#success-stay').click();
   assert.equal(await page.locator('#modal').evaluate(d=>d.open),false);

   // Later visits to the solved seal offer the same picker, so replays stay reachable.
   await page.locator('[data-clue="lock1"]').evaluate(el=>el.click());
   assert.equal(await page.locator('#modal-title').innerText(),'這道封印已經解開');
   await page.locator('#solved-replay').click();
   assert.equal(await page.locator('#modal-title').innerText(),'重玩小遊戲');
   await page.locator('#replay-back').click();
   assert.equal(await page.locator('#modal-title').innerText(),'這道封印已經解開');
   await page.locator('#solved-close').click();

   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no horizontal scroll at '+width);
   assert.deepEqual(errors,[],'no page errors at '+width);
   console.log('✓ seal clear → picker → repeatable replays → progress unchanged ('+width+'px)');
   await context.close();
  }
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
