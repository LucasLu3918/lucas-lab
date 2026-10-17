// "帳本的背面" (鏡淵) E1: the belfry gear train is proven by search, its hints match the solution, its lines match the
// dialogue draft, and the level stays outside the seven acts and the save format.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LEVELS,CRANK_TEETH,emptyBoard,evaluate,solveAll,HINTS,hintStep,toothPath,phases} from '../games/blood-mirror/puzzles/gears13.js';
import {WEIGHTS,TOLERANCE,length as pendulumLength,ratio as pendulumRatio,pendulumSolved,solveAll as pendulumSolveAll,HINTS as PENDULUM_HINTS,hintStep as pendulumHintStep} from '../games/blood-mirror/puzzles/pendulum.js';
import {NOTCHES,RUBY,NUMERALS,numeralAt,notchOf,playTolls,solveAll as wheelSolveAll,HINTS as WHEEL_HINTS,hintStep as wheelHintStep} from '../games/blood-mirror/puzzles/starwheel.js';
import {STAGES as PRISM,solutions as prismSolutions,signature as prismSignature,solved as prismSolved,litCount,allStates as prismStates,trace as prismTrace,bits,hint as prismHint,hintStep as prismHintStep,solutionOf,diagnose} from '../games/blood-mirror/puzzles/prism.js';
import * as apo from '../games/blood-mirror/puzzles/apothecary.js';
import * as gal from '../games/blood-mirror/puzzles/gallery.js';
import * as box from '../games/blood-mirror/puzzles/box.js';
import * as shadow from '../games/blood-mirror/puzzles/shadow.js';
import * as choir from '../games/blood-mirror/puzzles/choir.js';
import * as scale from '../games/blood-mirror/puzzles/scale.js';
import * as frozen from '../games/blood-mirror/puzzles/frozen.js';
import * as musicbox from '../games/blood-mirror/puzzles/musicbox.js';
import * as prism from '../games/blood-mirror/puzzles/prism.js';
import * as watch from '../games/blood-mirror/puzzles/watch.js';
import * as compass from '../games/blood-mirror/puzzles/compass.js';
import {abyss} from '../games/blood-mirror/data/abyss.js';
import {speakers} from '../games/blood-mirror/data/chapters/index.js';
import {puzzles,setPuzzleCompletions,completedPuzzles,resetPuzzles,isPuzzleComplete,isStageComplete,startPuzzle} from '../games/blood-mirror/puzzles/index.js';
import {rooms,initialState,toSaveV2,fromSaveV2,exportSave,parseSave,loadSave,writeSave,SAVE_KEY,shardIds} from '../games/blood-mirror/engine/index.js';

const board=(level,placed)=>{const b=emptyBoard(level);for(const [socket,layers] of Object.entries(placed))b[socket]=layers;return b;};
const storage=(entries={})=>{const data=new Map(Object.entries(entries));return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),raw:k=>data.get(k)};};

test('the warm-up has exactly one answer: an 8-tooth idler between the crank and a 12-tooth output',()=>{
 const found=solveAll(LEVELS.warm).map(text=>JSON.parse(text));
 assert.equal(found.length,1);
 assert.deepEqual([found[0].S1,found[0].S2],[[8,null],[12,null]]);
 // Without the idler the output turns against the crank, which is the lesson.
 const direct=evaluate(LEVELS.warm,board(LEVELS.warm,{S1:[null,null],S2:[null,null]}));
 assert.equal(direct.out,null);
 const reversed={sockets:{S0:[0,0],S2:[12,0]},layers:1,out:'S2',target:[1,1],tray:[12]};
 assert.deepEqual(evaluate(reversed,{S2:[12,null]}).out,[-1,1]);
 assert.equal(evaluate(reversed,{S2:[12,null]}).solved,false);
});

test('the gear train has exactly one minimal answer: 39 below, 6 above, 24 on the output',()=>{
 const found=solveAll(LEVELS.main).map(text=>JSON.parse(text));
 assert.equal(found.length,1,'expected one minimal solution, got '+found.length);
 assert.deepEqual([found[0].S1,found[0].S2,found[0].S3,found[0].S4],[[39,6],[null,24],[null,null],[null,null]]);
 const result=evaluate(LEVELS.main,found[0]);
 assert.deepEqual(result.out,[1,13]);
 assert.equal(CRANK_TEETH,12);
});

test('near misses do not solve: a wrong ratio, a jam, or a gear that never meshes',()=>{
 const miss={
  '12/18 pair':{S1:[39,12],S2:[null,18]},
  '24/6 pair':{S1:[39,24],S2:[null,6]},
  '8/24 pair':{S1:[39,8],S2:[null,24]}
 };
 for(const [name,placed] of Object.entries(miss))assert.equal(evaluate(LEVELS.main,board(LEVELS.main,placed)).solved,false,name);
 assert.equal(evaluate(LEVELS.main,board(LEVELS.main,{S1:[39,null]})).solved,false,'one stage only');
 assert.ok(evaluate(LEVELS.main,board(LEVELS.main,{S1:[13,null]})).dangling.length>0,'13 teeth is too small for the 25.5 gap');
 assert.ok(evaluate(LEVELS.main,board(LEVELS.main,{S1:[39,null],S2:[24,null]})).jam,'a gear overlapping another one jams');
 // A gear on the upper layer never touches the lower layer.
 assert.deepEqual(evaluate(LEVELS.main,board(LEVELS.main,{S1:[null,39]})).out,null);
});

test('every hint step agrees with the answer and with the board it is shown for',()=>{
 for(const step of ['warm','first','second'])assert.equal(HINTS[step].length,3);
 assert.ok(HINTS.warm[2].includes('8 齒')&&HINTS.warm[2].includes('12 齒'));
 assert.ok(HINTS.first[2].includes('39'));
 assert.ok(HINTS.second[2].includes('6 齒')&&HINTS.second[2].includes('24 齒'));
 assert.equal(10*2-12,8);assert.equal(25.5*2-12,39);assert.equal(15*2,30);assert.equal(24/6,4);
 assert.equal(hintStep(LEVELS.warm,emptyBoard(LEVELS.warm)),'warm');
 assert.equal(hintStep(LEVELS.main,emptyBoard(LEVELS.main)),'first');
 assert.equal(hintStep(LEVELS.main,board(LEVELS.main,{S1:[39,null]})),'second');
 assert.equal(hintStep(LEVELS.main,board(LEVELS.main,{S1:[39,6],S2:[null,24]})),null);
 assert.equal(hintStep(LEVELS.warm,board(LEVELS.warm,{S1:[8,null],S2:[12,null]})),null);
});

test('gear outlines and starting angles are well formed for every tray gear',()=>{
 for(const level of Object.values(LEVELS))for(const teeth of level.tray){
  const path=toothPath(teeth);
  assert.match(path,/^M[-\d. L]+Z$/);
  assert.equal(path.split('L').length,teeth*4);
 }
 const solved=board(LEVELS.main,{S1:[39,6],S2:[null,24]});
 const result=evaluate(LEVELS.main,solved);
 const phase=phases(LEVELS.main,result);
 assert.equal(phase.length,result.nodes.length);
 assert.ok(phase.every(Number.isFinite));
});

test('the E1 lines match the dialogue draft and use known speakers',()=>{
 const draft=fs.readFileSync(new URL('../games/blood-mirror/plan-improve/expert-dialogue-draft.md',import.meta.url),'utf8');
 const lines=new Set([...draft.matchAll(/^- (\w+)｜(.+)$/gm)].map(m=>m[1]+'｜'+m[2]));
 const all=[...abyss.entry,...abyss.levels.flatMap(level=>[...level.scene,...level.unlock,...(level.reduced?.unlock||[]),...Object.values(level.stageLines||{}).flat()])];
 for(const {speaker,text} of all){
  assert.ok(!speaker||speakers[speaker],'unknown speaker '+speaker);
  assert.ok(text.length>0&&text.length<=80,'line over 80 characters: '+text);
  assert.ok(lines.has((speaker||'narrator')+'｜'+text),'not in the dialogue draft: '+text);
 }
 const e1=abyss.levels[0];
 assert.equal(e1.reward.mark,'ㄎ');
 assert.ok(e1.unlock.some(line=>line.text.includes('ㄎ')));
});

test('abyss levels sit outside the seven acts and own a registered puzzle',()=>{
 const ids=rooms.map(room=>room.id);
 for(const level of abyss.levels){
  assert.ok(!ids.includes(level.puzzle),level.id+' must not be a chapter');
  assert.ok(puzzles[level.puzzle]?.optional,level.id+' puzzle is registered as optional');
  const stageIds=puzzles[level.puzzle].stages.map(stage=>stage.id);
  assert.deepEqual(stageIds,level.stages,'the save and the registry list the same mechanisms');
  assert.ok(stageIds.includes(level.thumb));
  // Every mechanism has its own painted banner and thumbnail, each within the 500 KB bitmap budget.
  for(const file of stageIds.flatMap(id=>['assets/puzzles/'+id+'.webp','assets/puzzles/thumbs/'+id+'.webp'])){
   const url=new URL('../games/blood-mirror/'+file,import.meta.url);
   assert.ok(fs.existsSync(url),file+' missing');
   assert.ok(fs.statSync(url).size<=500*1024,file+' over 500 KB');
  }
  // A stage that waits for others names stages that exist and come before it.
  puzzles[level.puzzle].stages.forEach((stage,index)=>{
   for(const name of stage.after||[])assert.ok(stageIds.indexOf(name)>=0&&stageIds.indexOf(name)<index,stage.id+' waits for '+name);
   if(stage.after)assert.ok(stage.waiting.length>10);
  });
 }
 assert.deepEqual(puzzles.belfry.stages.map(stage=>stage.after||[]),[[],[],['belfry-gears','belfry-pendulum']]);
 assert.deepEqual(puzzles.prism.stages.map(stage=>stage.after||[]),[[],[],['prism-rays','prism-blend']]);
 assert.deepEqual(puzzles.apothecary.stages.map(stage=>stage.after||[]),[[],[],['apothecary-testimony','apothecary-vessels']]);
 assert.deepEqual(puzzles.gallery.stages.map(stage=>stage.after||[]),[[],['gallery-align']]);
 assert.deepEqual(puzzles.box.stages.map(stage=>stage.after||[]),[[],[],[],[],[],['box-time','box-light','box-apple','box-thread','box-shards']]);
});

test('finishing a belfry level is saved, survives export and a new journey, and unknown ids are dropped',()=>{
 setPuzzleCompletions(['library','belfry','belfry.belfry-gears','belfry.nope','nope']);
 assert.deepEqual(completedPuzzles().sort(),['belfry','belfry.belfry-gears','library']);
 const save=toSaveV2({...initialState(),started:true},completedPuzzles());
 assert.deepEqual([...save.puzzles].sort(),['belfry','belfry.belfry-gears','library']);
 assert.deepEqual(fromSaveV2(JSON.parse(JSON.stringify(save))).puzzles.sort(),['belfry','belfry.belfry-gears','library']);
 assert.deepEqual(parseSave(exportSave({...initialState(),started:true},['belfry'])).puzzles,['belfry']);
 const store=storage();
 assert.equal(writeSave({...initialState(),started:true},['belfry'],store),true);
 assert.deepEqual(loadSave(store).puzzles,['belfry']);
 assert.equal(JSON.parse(store.raw(SAVE_KEY)).version,2,'no version bump');
 // A new journey clears the acts' puzzles but keeps the optional level.
 resetPuzzles();
 assert.equal(isPuzzleComplete('library'),false);
 assert.equal(isPuzzleComplete('belfry'),true);
 assert.equal(isStageComplete('belfry','belfry-gears'),true,'a finished mechanism survives a new journey too');
 resetPuzzles();
 setPuzzleCompletions([]);
 assert.equal(typeof startPuzzle,'function');
});

test('the pendulum has exactly one answer: weights of 0.75 and 2.25, a rod of 4 units and a period of 2',()=>{
 const found=pendulumSolveAll();
 assert.deepEqual(found,[['a','b']]);
 assert.equal(pendulumLength(['a','b']),4);
 assert.equal(pendulumRatio(['a','b']),2);
 // The tempting guess, doubling the length, only gives a ratio of about 1.41, and no weight combination reaches it.
 assert.ok(Math.abs(Math.sqrt(2)-1.414)<.001);
 for(let mask=0;mask<8;mask++)assert.notEqual(pendulumLength(WEIGHTS.filter((_,i)=>mask>>i&1).map(weight=>weight.id)),2,'no combination doubles the length');
 // The nearest wrong combinations are clearly out of tolerance.
 let nearest=Infinity;
 for(let mask=0;mask<8;mask++){
  const attached=WEIGHTS.filter((_,i)=>mask>>i&1).map(weight=>weight.id);
  if(!pendulumSolved(attached))nearest=Math.min(nearest,Math.abs(pendulumRatio(attached)-2));
 }
 assert.ok(nearest>TOLERANCE*3,'nearest wrong ratio is '+nearest);
});

test('pendulum hints follow the weights hung and name the answer',()=>{
 for(const step of ['idle','fast','slow'])assert.equal(PENDULUM_HINTS[step].length,3);
 assert.equal(pendulumHintStep([]),'idle');
 assert.equal(pendulumHintStep(['a']),'fast');
 assert.equal(pendulumHintStep(['a','b','c']),'slow');
 assert.equal(pendulumHintStep(['a','b']),null);
 for(const step of ['idle','fast','slow']){
  assert.ok(PENDULUM_HINTS[step][2].includes('0.75')&&PENDULUM_HINTS[step][2].includes('2.25'));
  assert.ok(PENDULUM_HINTS[step][1].includes('4 倍')&&PENDULUM_HINTS[step][1].includes('3 格'));
 }
});

test('the star wheel has exactly one step, 5, and the thirteenth toll returns to the ruby',()=>{
 assert.deepEqual(wheelSolveAll(),[5]);
 for(let toll=1;toll<=12;toll++)assert.equal(numeralAt(notchOf(5,toll)),toll);
 assert.equal(notchOf(5,13),RUBY);
 // The engraving uses each numeral once and leaves only the ruby blank.
 const numerals=Array.from({length:NOTCHES},(_,notch)=>numeralAt(notch)).sort((a,b)=>a-b);
 assert.deepEqual(numerals,[0,1,2,3,4,5,6,7,8,9,10,11,12]);
 for(let step=1;step<NOTCHES;step++){
  if(step===5)continue;
  const result=playTolls(step);
  assert.equal(result.ok,false,'step '+step);
  assert.equal(result.fault.toll,1,'a wrong step is caught on the first toll');
 }
 assert.deepEqual(NUMERALS.length,12);
});

test('star wheel hints name the answer and follow the candle',()=>{
 for(const step of ['dark','lit'])assert.equal(WHEEL_HINTS[step].length,3);
 assert.equal(wheelHintStep(false,false),'dark');
 assert.equal(wheelHintStep(false,true),'lit');
 assert.equal(wheelHintStep(true,true),null);
 assert.ok(WHEEL_HINTS.lit[2].includes('第 5 格')&&WHEEL_HINTS.lit[2].includes('5'));
 assert.equal(numeralAt(5),1,'the numeral 一 sits five notches clockwise from the ruby');
 assert.equal(numeralAt(10),2);
});

test('the mechanisms animate with a clock that does not depend on requestAnimationFrame alone',()=>{
 const source=fs.readFileSync(new URL('../games/blood-mirror/puzzles/clock.js',import.meta.url),'utf8');
 assert.match(source,/requestAnimationFrame/);
 assert.match(source,/setTimeout/);
 for(const file of ['gears13','pendulum','starwheel']){
  const text=fs.readFileSync(new URL('../games/blood-mirror/puzzles/'+file+'.js',import.meta.url),'utf8');
  assert.ok(!/requestAnimationFrame/.test(text.replace(/\/\/.*$/gm,'')),file+' goes through clock.js');
 }
});

const flipsBetween=(a,b)=>a.m.filter((v,i)=>v!==b.m[i]).length+a.k.filter((v,i)=>v!==b.k[i]).length;

test('each prism stage has exactly one beam solution, and its own new rule is part of it',()=>{
 assert.deepEqual(Object.keys(PRISM),['prism-rays','prism-blend','prism-ballroom']);
 for(const [id,stage] of Object.entries(PRISM)){
  const found=prismSolutions(stage.L);
  assert.ok(found.length>=1,id+' has no solution');
  assert.equal(new Set(found.map(S=>prismSignature(stage.L,S))).size,1,id+' has more than one beam solution');
  assert.equal(prismSolved(stage.L,stage.init),false,id+' starts solved');
  const result=prismTrace(stage.L,solutionOf(id));
  assert.ok(result.stable);
  if(stage.L.crystals.length)assert.ok(result.crystalIn.every(v=>bits(v)>=2),id+' uses its crystal');
  if(stage.L.filters.length)assert.ok(result.beams.some(beam=>beam.segs.length>1),id+' uses its filter');
 }
 assert.equal(PRISM['prism-ballroom'].L.blockers.length,2);
});

test('the ballroom cannot be solved one mirror at a time, and its dancers really stand in the way',()=>{
 const {L,init}=PRISM['prism-ballroom'],base=litCount(L,init);
 assert.ok(base<L.targets.length);
 const neighbours=[];
 init.m.forEach((_,i)=>{const n={m:[...init.m],k:[...init.k]};n.m[i]=n.m[i]==='/'?'\\':'/';neighbours.push(n);});
 init.k.forEach((_,i)=>{const n={m:[...init.m],k:[...init.k]};n.k[i]^=1;neighbours.push(n);});
 for(const n of neighbours)assert.ok(litCount(L,n)<=base,'a single flip must not light another mask');
 const sol=solutionOf('prism-ballroom'),onPath=new Set();
 prismTrace(L,sol).beams.forEach(beam=>beam.cells.forEach(c=>onPath.add(c)));
 L.blockers.forEach((b,i)=>assert.ok(onPath.has((sol.k[i]?b.a:b.b)+''),'dancer '+i+' blocks the solution light from its other cell'));
 const nearest=Math.min(...prismSolutions(L).map(S=>flipsBetween(S,init)));
 assert.ok(nearest>=4,'the start is '+nearest+' flips from a solution');
 assert.equal(prismStates(L).length,512);
});

test('prism hints follow the board and the tier-3 fix always makes progress until solved',()=>{
 for(const [id,stage] of Object.entries(PRISM)){
  const sol=solutionOf(id);
  let S={m:[...stage.init.m],k:[...stage.init.k]},steps=0;
  while(!prismSolved(stage.L,S)){
   assert.ok(prismHintStep(stage.L,S,sol),id+' names a step');
   for(const tier of [1,2,3])assert.ok(prismHint(stage.L,S,sol,tier).length>10);
   const d=diagnose(stage.L,S,sol);
   if(d.mi>=0)S.m[d.mi]=sol.m[d.mi];else{assert.ok(d.ki>=0,id+' tier 3 names a dancer');S.k[d.ki]^=1;}
   assert.ok(++steps<=stage.L.mirrors.length+stage.L.blockers.length+1,id+' hints do not converge');
  }
  assert.equal(prismHintStep(stage.L,S,sol),null);
 }
 // A blue mask never sends the player looking for the red filter.
 const {L,init}=PRISM['prism-ballroom'];
 assert.ok(!prismHint(L,init,solutionOf('prism-ballroom'),1).includes('濾鏡')||diagnose(L,init,solutionOf('prism-ballroom')).ti===0);
});

test('E2 lines match the draft, carry the reward, and the fire spirits have a cue of their own',()=>{
 const e2=abyss.levels[1];
 assert.equal(e2.id,'e2');
 assert.equal(e2.puzzle,'prism');
 assert.equal(e2.reward.mark,'ㄒ');
 assert.ok(e2.enter.length>0);
 assert.deepEqual(e2.stages,['prism-rays','prism-blend','prism-ballroom']);
 const sfx=fs.readFileSync(new URL('../games/blood-mirror/audio/sfx.js',import.meta.url),'utf8');
 const juice=fs.readFileSync(new URL('../games/blood-mirror/juice.js',import.meta.url),'utf8');
 assert.match(sfx,/\bchoir:/);
 assert.match(juice,/\bchoir:/);
 const prism=fs.readFileSync(new URL('../games/blood-mirror/puzzles/prism.js',import.meta.url),'utf8');
 assert.ok(!/requestAnimationFrame/.test(prism.replace(/\/\/.*$/gm,'')),'beams need no animation loop');
});

test('E3 testimony: only 甘松 is consistent, no shortcut, and a wrong guess names one contradicting statement',()=>{
 assert.deepEqual(apo.candidates(),[6]);
 const all=[0,1,2,3,4,5,6];
 assert.ok(Math.max(...all.map(i=>apo.refutedBy(i).length))<=2,'a statement refutes more than two apprentices');
 const alive=idx=>all.filter(q=>idx.every(i=>!apo.refutedBy(i).includes(q)));
 let fewest=7;for(let m=1;m<128;m++){const idx=all.filter(i=>m>>i&1);if(idx.length<fewest&&alive(idx).length===1)fewest=idx.length;}
 assert.ok(fewest>=4,'only '+fewest+' statements already single out the holder');
 assert.ok(all.filter(i=>alive(all.filter(j=>j!==i)).length>1).length>=4,'too few necessary statements');
 assert.ok(!apo.holds(apo.TESTIMONY[6],6),'甘松 own statement is the lie');
 for(let p=0;p<6;p++){const i=apo.firstConflict(p);assert.ok(apo.conflicts(p).includes(i));}
 apo.TESTIMONY.forEach(st=>{assert.ok(apo.say(st).length>8);if(st.k==='not')assert.ok(st.s.length<=3);if(st.k==='in')assert.ok(st.s.length>=4);});
 // the apprentice cards are the draft's (single source), and hints work for every notebook
 const draft=fs.readFileSync(new URL('../games/blood-mirror/plan-improve/expert-dialogue-draft.md',import.meta.url),'utf8');
 const rows=[...draft.matchAll(/^\| \d \| (\S+) \| .+? \| (「.+」) \|$/gm)].map(m=>[m[1],m[2]]);
 assert.deepEqual(rows,apo.APPRENTICES.map((n,i)=>[n,apo.CARD_LINES[i]]));
 for(let m=0;m<64;m++){const h=apo.HINTS.A(6,[0,1,2,3,4,5].filter(i=>m>>i&1));assert.equal(h.length,3);assert.ok(h[2].includes('甘松'));h.forEach(t=>assert.ok(t.length>10));}
});

test('E3 vessels: the shortest pouring order has 8 moves and is unique, no position is a dead end, hints follow the board',()=>{
 const best=apo.shortest(apo.START);assert.equal(best.length,8);
 let s=[...apo.START];for(const t of best)s=apo.pour(s,t);assert.ok(apo.goalB(s));
 const key=x=>x.join(','),dist=new Map([[key(apo.START),0]]),ways=new Map([[key(apo.START),1]]),queue=[apo.START];
 for(let i=0;i<queue.length;i++){const x=queue[i];for(let t=0;t<3;t++){const n=apo.pour(x,t);if(!n)continue;const k=key(n);if(!dist.has(k)){dist.set(k,dist.get(key(x))+1);ways.set(k,ways.get(key(x)));queue.push(n);}else if(dist.get(k)===dist.get(key(x))+1)ways.set(k,ways.get(k)+ways.get(key(x)));}}
 let bestLen=1e9,count=0;for(const [k,d] of dist)if(apo.goalB(k.split(',').map(Number))){if(d<bestLen){bestLen=d;count=ways.get(k);}else if(d===bestLen)count+=ways.get(k);}
 assert.equal(count,1,'the shortest pouring order is not unique');
 assert.equal(dist.size,16);
 for(const k of dist.keys()){const x=k.split(',').map(Number);assert.ok(apo.shortest(x),'dead end at '+k);const h=apo.HINTS.B(x);assert.equal(h.length,3);h.forEach(t=>assert.ok(t.length>5));}
});

test('E3 mixing: one recipe fits, direction words exist everywhere, and every mix can climb to the recipe',()=>{
 const gcd=(a,b)=>b?gcd(b,a%b):a,prim=d=>{const g=gcd(gcd(d[0],d[1]),d[2]);return d.map(v=>v/g).join();};
 const D=d=>apo.colorDist(apo.mixColor(...d),apo.mixColor(...apo.TARGET));
 const nb=d=>{const o=[];for(let i=0;i<3;i++)for(const sg of [-1,1]){const n=[...d];n[i]+=sg;if(n[i]<0||n[i]>apo.MAXDROP||!n.some(Boolean))continue;o.push(n);}return o;};
 let accepted=0,nearest=1e9;
 for(let r=0;r<=4;r++)for(let y=0;y<=4;y++)for(let b=0;b<=4;b++){
  const d=[r,y,b];assert.ok(apo.dirWord(d).length>3);assert.equal(apo.HINTS.C(d).length,3);
  if(!(r+y+b))continue;
  if(apo.colorOk(d)){accepted++;assert.equal(prim(d),apo.TARGET.join());continue;}
  if(prim(d)!==apo.TARGET.join())nearest=Math.min(nearest,D(d));
  // closer moves of at most two drops always reach the recipe
  let cur=d,steps=0;
  while(!apo.colorOk(cur)){const cand=[...nb(cur),...nb(cur).flatMap(nb)].filter(n=>n.some(Boolean)&&D(n)<D(cur)-1e-9).sort((a,c)=>D(a)-D(c));assert.ok(cand.length,'stuck at '+cur);cur=cand[0];assert.ok(++steps<20);}
 }
 assert.equal(accepted,1);
 assert.ok(nearest>apo.TOL*1.5,'nearest wrong recipe is too close: '+nearest);
 assert.ok(Object.values(apo.MARKS).length===3&&new Set(Object.values(apo.MARKS)).size===3,'pigments need a shape as well as a colour');
});

test('E3 level data: lines match the draft, the reward is ㄋ, stage lines belong to real stages, no animation loop',()=>{
 const e3=abyss.levels[2];
 assert.equal(e3.id,'e3');assert.equal(e3.puzzle,'apothecary');assert.equal(e3.reward.mark,'ㄋ');
 assert.ok(e3.enter.length>0);
 assert.deepEqual(e3.stages,['apothecary-testimony','apothecary-vessels','apothecary-mixing']);
 const keys=Object.keys(e3.stageLines);
 assert.deepEqual(keys,['apothecary-testimony','apothecary-vessels']);
 for(const key of keys)assert.ok(e3.stages.includes(key)&&key!==e3.stages.at(-1),'a stage line before the last stage: '+key);
 assert.ok(e3.stageLines['apothecary-testimony'].some(line=>line.text.includes('被寫成說謊的人')));
 const src=fs.readFileSync(new URL('../games/blood-mirror/puzzles/apothecary.js',import.meta.url),'utf8');
 assert.ok(!/requestAnimationFrame/.test(src.replace(/\/\/.*$/gm,'')));
 assert.ok(!/style="/.test(src),'the page CSP blocks inline style attributes');
});

// ---- E4 gallery: every view a player can reach (flip any of four panels, enlarge none or one) is enumerated.
const GP=Object.keys(gal.ANCHORS);
const galViews=[];
for(let mask=0;mask<16;mask++){
 const flip=Object.fromEntries(GP.map((p,i)=>[p,!!(mask>>i&1)]));
 galViews.push({zoom:null,flip});
 for(const p of GP)galViews.push({zoom:{panel:p},flip});
}
const galStart={zoom:null,flip:{A:false,B:false,C:false,D:false}};
const galWhere={};
for(const view of galViews)for(const pair of gal.valid(view))(galWhere[pair]=galWhere[pair]||[]).push(view);

test('E4 rules: only four pairs can ever be linked, and each needs exactly the move it teaches',()=>{
 assert.equal(galViews.length,80);
 assert.deepEqual(Object.keys(galWhere).sort(),['A.door~D.door','A.moonL~B.moon','A.moonR~B.moon','C.lantern~D.chandelier']);
 // The opening view accepts only the moons, so the first thing to do is the stack.
 assert.deepEqual(gal.valid(galStart).sort(),['A.moonL~B.moon','A.moonR~B.moon']);
 const unzoomed=(view,...panels)=>!view.zoom||!panels.includes(view.zoom.panel);
 for(const pair of ['A.moonL~B.moon','A.moonR~B.moon'])assert.ok(galWhere[pair].every(view=>unzoomed(view,'A','B')),pair);
 assert.ok(galWhere['C.lantern~D.chandelier'].every(view=>view.zoom&&view.zoom.panel==='C'),'the lantern only fits once it is enlarged');
 assert.ok(galWhere['A.door~D.door'].every(view=>unzoomed(view,'A','D')&&view.flip.A!==view.flip.D),'the door needs exactly one flip');
 // The size rule really acts: the lantern is too small for either lamp unzoomed and too small/big for the small lamp zoomed.
 const lantern=gal.ANCHORS.C[0],zoomedC={zoom:{panel:'C'},flip:galStart.flip};
 const ratio=(view,id)=>gal.size(view,'C',lantern)/gal.size(view,'D',gal.ANCHORS.D.find(a=>a.id===id));
 assert.ok(ratio(galStart,'chandelier')<1/gal.SIZE_TOL);
 assert.ok(Math.abs(ratio(zoomedC,'chandelier')-1)<0.1);
 assert.ok(ratio(galStart,'doorLamp')<1/gal.SIZE_TOL&&ratio(zoomedC,'doorLamp')>gal.SIZE_TOL,'the small lamp is never the answer');
 // Nothing is hidden when a panel is enlarged, and every rejection the interface can give is worded.
 const reasons=new Set();
 for(const view of galViews)for(const p of GP)for(const q of GP)if(p<q)for(const a of gal.ANCHORS[p])for(const b of gal.ANCHORS[q])reasons.add(gal.match(view,p,a,q,b).reason);
 for(const reason of ['type','big','small','side'])assert.ok(reasons.has(reason)&&gal.REASONS[reason].length>5,reason);
});

test('E4 rules: of the 24 orders only the thread order and its reverse are accepted, and a wrong one names the first gap',()=>{
 const perms=list=>list.length<2?[list]:list.flatMap((x,i)=>perms([...list.slice(0,i),...list.slice(i+1)]).map(rest=>[x,...rest]));
 const all=perms(GP);
 assert.equal(all.length,24);
 assert.deepEqual(all.filter(gal.isChain).map(o=>o.join('')).sort(),['BADC','CDAB']);
 for(const order of all)if(!gal.isChain(order))assert.ok(gal.firstBadGap(order)>=0);
 assert.equal(gal.firstBadGap(['A','B','C','D']),1,'B and C share no thread');
 // The three threads join the four panels into one path.
 const edges=gal.KINDS.map(k=>[k.a[0],k.b[0][0]]);
 assert.equal(new Set(edges.flat()).size,4);
});

test('E4 stages: a move is judged by the stage it is made in, and the merge stage opens with two threads hanging',()=>{
 const moon=gal.find('B.moon'),moonL=gal.find('A.moonL'),lantern=gal.find('C.lantern'),chandelier=gal.find('D.chandelier'),doorA=gal.find('A.door'),doorD=gal.find('D.door');
 const zoomC={zoom:{panel:'C'},flip:galStart.flip},flipA={zoom:null,flip:{...galStart.flip,A:true}};
 assert.deepEqual(gal.judgeMove('align',[],galStart,'B',moon.anchor,'A',moonL.anchor),{kind:'link',thread:0});
 assert.equal(gal.judgeMove('align',[0],galStart,'B',moon.anchor,'A',moonL.anchor).text,'這條紅線已經接上了。');
 assert.equal(gal.judgeMove('align',[0],galStart,'C',lantern.anchor,'D',chandelier.anchor).kind,'bad');
 assert.deepEqual(gal.judgeMove('align',[0],zoomC,'C',lantern.anchor,'D',chandelier.anchor),{kind:'link',thread:1});
 // The door is for the merge stage: in the align stage it is refused even when flipped.
 assert.equal(gal.judgeMove('align',[0,1],flipA,'A',doorA.anchor,'D',doorD.anchor).kind,'bad');
 assert.equal(gal.judgeMove('merge',[0,1],galStart,'A',doorA.anchor,'D',doorD.anchor).text,gal.REASONS.side);
 assert.deepEqual(gal.judgeMove('merge',[0,1],flipA,'A',doorA.anchor,'D',doorD.anchor),{kind:'link',thread:2});
 assert.deepEqual(gal.STAGES.merge.preset,gal.STAGES.align.need,'the merge stage starts where the align stage ends');
});

test('E4 hints: three tiers per step, the step follows the board, and the last tier names the move',()=>{
 for(const [step,tiers] of Object.entries(gal.HINTS))assert.equal(tiers.length,3,step);
 assert.equal(gal.hintStep('align',[],galStart),'stack');
 assert.equal(gal.hintStep('align',[0],galStart),'size-zoom');
 assert.equal(gal.hintStep('align',[0],{zoom:{panel:'C'},flip:galStart.flip}),'size-drag');
 assert.equal(gal.hintStep('align',[0,1],galStart),null);
 assert.equal(gal.hintStep('merge',[0,1],galStart),'flip-toggle');
 assert.equal(gal.hintStep('merge',[0,1],{zoom:null,flip:{...galStart.flip,D:true}}),'flip-drag');
 assert.equal(gal.hintStep('merge',[0,1],{zoom:null,flip:{...galStart.flip,A:true,D:true}}),'flip-toggle','both flipped is no flip');
 assert.equal(gal.hintStep('merge',[0,1,2],galStart),'order');
 assert.ok(gal.HINTS.stack[2].includes('陽台')&&gal.HINTS.stack[2].includes('月亮'));
 assert.ok(gal.HINTS['size-zoom'][2].includes('黑松林')&&gal.HINTS['size-zoom'][2].includes('大吊燈'));
 assert.ok(gal.HINTS['flip-toggle'][2].includes('翻面'));
 assert.ok(gal.HINTS.order[2].includes('陽台、鏡廊、舞廳、黑松林'));
});

test('E4 touch: the snap radius never drops under 22 pixels and always picks the nearest valid link',()=>{
 for(const scale of [1,0.7,0.46,0.38])assert.ok(gal.snapRadius(scale)*scale>=22-1e-9,'scale '+scale);
 assert.equal(gal.snapRadius(1),22);
 // Two anchors in one panel are at least 28 board units apart, so one drop can only be near one valid link at a time.
 let closest=1e9;
 for(const view of galViews)for(const p of GP){
  const pts=gal.ANCHORS[p].map(a=>gal.at(view,p,a));
  for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++)closest=Math.min(closest,Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1]));
 }
 assert.ok(closest>=20,'closest anchors '+closest);
});

test('E4 level data: lines match the draft, the reward is ㄧ in the palm, one stage line before the last stage, no animation loop',()=>{
 const e4=abyss.levels[3];
 assert.equal(e4.id,'e4');assert.equal(e4.puzzle,'gallery');assert.equal(e4.number,'E4');
 assert.deepEqual(e4.reward,{name:'紅線',mark:'ㄧ',place:'手心'});
 assert.ok(e4.enter.length>0);
 assert.deepEqual(e4.stages,['gallery-align','gallery-merge']);
 assert.deepEqual(Object.keys(e4.stageLines),['gallery-align']);
 assert.ok(e4.unlock.some(line=>line.text.includes('紅線在最後一格打了結')));
 assert.equal(e4.scene.length,4);
 for(const file of ['puzzles/gallery.js']){
  const src=fs.readFileSync(new URL('../games/blood-mirror/'+file,import.meta.url),'utf8');
  assert.ok(!/requestAnimationFrame/.test(src.replace(/\/\/.*$/gm,'')));
  assert.ok(!/style="/.test(src),'the page CSP blocks inline style attributes');
 }
 // The four panels use art that already ships with the scenes, so E4 adds no scene image to the first screen.
 for(const {art} of Object.values(gal.PANELS))assert.ok(fs.existsSync(new URL('../games/blood-mirror/assets/'+art+'.webp',import.meta.url)),art);
});

test('E5 cipher: the four keys are the marks of E1-E4, every key matters and every letter has one shift',()=>{
 assert.equal(box.ZHUYIN37.length,37);assert.equal(new Set(box.ZHUYIN37).size,37);
 assert.deepEqual(box.KEYS,['ㄎ','ㄒ','ㄋ','ㄧ']);
 assert.deepEqual(box.KEY_LEVELS.map(level=>level.number),['E1','E2','E3','E4']);
 assert.equal(box.CIPHER,'ㄖㄑㄙㄥ');
 assert.equal(box.decrypt(box.CIPHER),box.PLAIN);
 assert.equal(box.encrypt(box.PLAIN),box.CIPHER);
 for(const symbol of [...box.PLAIN,...box.KEYS,...box.CIPHER])assert.ok(box.idx(symbol)>=1,symbol);
 // Swapping any one key for another symbol breaks the reading, so no level can be skipped.
 for(let i=0;i<4;i++)for(const z of box.ZHUYIN37){
  if(z===box.KEYS[i])continue;
  const keys=[...box.KEYS];keys[i]=z;
  assert.notEqual(box.decrypt(box.CIPHER,keys),box.PLAIN,'key '+i+' = '+z+' also works');
 }
 // Counting back, only one number of places per letter gives the plain letter; the disc reads PLAIN for exactly one setting.
 for(let i=0;i<4;i++){
  let good=0;
  for(let n=0;n<37;n++){const offsets=[0,0,0,0];offsets[i]=n;if(box.reading(offsets)[i]===box.PLAIN[i])good++;}
  assert.equal(good,1);
 }
 assert.deepEqual(box.KEYS.map(box.idx),[10,14,7,35]);
 assert.equal(box.reading(box.KEYS.map(box.idx)),box.PLAIN);
 assert.equal(box.reading([0,0,0,0]),box.CIPHER);
});

test('E5 faces: each face needs exactly the level that gives its tool, the cipher needs all four, the shards need nothing',()=>{
 const none=()=>false,all=()=>true,only=id=>x=>x===id;
 assert.equal(box.FACES.length,6);
 for(const face of box.FACES){
  assert.ok(box.faceOpen(face,all),face.id+' closed with everything');
  if(face.needs.length)assert.ok(!box.faceOpen(face,none),face.id+' open with nothing');
 }
 assert.equal(box.faceOpen(box.FACES.find(face=>face.id==='shards'),none),true);
 const cipher=box.FACES.find(face=>face.id==='cipher');
 for(const level of box.KEY_LEVELS){
  assert.ok(!box.faceOpen(cipher,x=>x!==level.puzzle),'cipher opens without '+level.number);
  assert.deepEqual(box.missing(cipher,x=>x!==level.puzzle).map(item=>item.number),[level.number]);
 }
 for(const [id,puzzle] of [['time','belfry'],['light','prism'],['apple','apothecary'],['thread','gallery']]){
  const face=box.FACES.find(item=>item.id===id);
  assert.deepEqual(face.needs,[puzzle]);
  assert.ok(box.faceOpen(face,only(puzzle)));
 }
 // The registry says the same: stage ids, the levels each stage requires, and the cipher waiting for the other five.
 assert.deepEqual(puzzles.box.stages.map(stage=>stage.id),box.FACES.map(face=>face.stage));
 puzzles.box.stages.forEach((stage,i)=>assert.deepEqual([].concat(stage.requires||[]),box.FACES[i].needs,stage.id));
 for(const stage of puzzles.box.stages)if(stage.requires)assert.ok(stage.missing.length>10);
 assert.deepEqual(abyss.levels[4].stages,box.FACES.map(face=>face.stage));
});

test('E5 answers agree with the earlier levels and have one solution each',()=>{
 // Apple: the holder is the same apprentice E3 builds its testimony around.
 assert.deepEqual(box.APPRENTICES,apo.APPRENTICES);
 assert.equal(box.HOLDER,apo.CULPRIT);
 assert.equal(box.APPRENTICES[box.HOLDER],'甘松');
 // Thread: the four panels and the chain are E4's, and of the 24 orders only the chain and its reverse pass.
 assert.deepEqual(box.PANELS,gal.PANELS);
 assert.deepEqual(box.CHAIN,gal.CHAIN);
 const perms=a=>a.length<2?[a]:a.flatMap((x,i)=>perms([...a.slice(0,i),...a.slice(i+1)]).map(rest=>[x,...rest]));
 const good=perms(['A','B','C','D']).filter(order=>box.prefixOk(order));
 assert.equal(good.length,2);
 assert.deepEqual(good.map(order=>order.join('')).sort(),['BADC','CDAB']);
 // Every wrong first pick is already refused, so the thread never needs more than one wrong pick to be told.
 for(const p of ['A','D'])assert.equal(box.prefixOk([p]),false);
 // Light: three of five colours in order; one sequence of 125 works, the others do nothing.
 const colors=Object.keys(box.COLORS);
 let works=0;
 for(const a of colors)for(const b of colors)for(const c of colors)if([a,b,c].every((x,i)=>x===box.LIGHT[i]))works++;
 assert.equal(works,1);
 assert.equal(colors.length,5);
 assert.equal(new Set(Object.values(box.COLORS).map(color=>color.shape)).size,5,'colours also differ by shape');
 // Dial: thirteen notches, and E1's answer is the last one.
 assert.equal(box.TIME_SLOTS,13);assert.equal(box.TIME,13);
});

test('E5 shards: one slot per act, matching the engine, and a missing shard only leaves its slot empty',()=>{
 assert.equal(box.ACT_SHARDS.length,7);
 assert.deepEqual(box.ACT_SHARDS.map(shard=>shard.act),[1,2,3,4,5,6,7]);
 assert.deepEqual(box.ACT_SHARDS.map(shard=>shard.title),rooms.map(room=>room.title));
 for(const shard of box.ACT_SHARDS)assert.ok(shardIds.includes(shard.id),shard.id);
 const e5=abyss.levels[4];
 assert.deepEqual(e5.fullNeeds,box.ACT_SHARDS.map(shard=>shard.id));
 // The prologue shard is not one of the seven; the box does not need it.
 assert.ok(!e5.fullNeeds.includes('shard-prologue'));
 assert.ok(box.HINTS.shards[2].includes('黑鐘書庫')&&box.HINTS.shards[2].includes('鏡中之國'));
});

test('E5 hints: every step has three tiers and the last one gives the answer',()=>{
 for(const step of ['time','light-lift','light-seq','apple','thread','shards','cipher']){
  assert.equal(box.HINTS[step].length,3,step);
  box.HINTS[step].forEach(text=>assert.ok(text.length>8,step));
 }
 assert.ok(box.HINTS.time[2].includes('13'));
 assert.ok(['紅','藍','綠'].every(name=>box.HINTS['light-seq'][2].includes(name)));
 assert.ok(box.HINTS['light-seq'][2].indexOf('紅')<box.HINTS['light-seq'][2].indexOf('藍')&&box.HINTS['light-seq'][2].indexOf('藍')<box.HINTS['light-seq'][2].indexOf('綠'));
 assert.ok(box.HINTS['light-lift'][1].includes('稜鏡'));
 assert.ok(box.HINTS.apple[2].includes('甘松'));
 assert.ok(box.HINTS.thread[2].includes('陽台')&&box.HINTS.thread[2].includes('黑松林'));
 assert.ok(box.HINTS.cipher[2].includes(box.PLAIN));
 assert.ok(box.KEYS.every(key=>box.HINTS.cipher[2].includes(key)));
});

test('E5 level data: lines match the draft, the full ending needs all seven shards, a shorter one covers the gap, no animation loop',()=>{
 const e5=abyss.levels[4];
 assert.equal(e5.id,'e5');assert.equal(e5.puzzle,'box');assert.equal(e5.number,'E5');
 assert.equal(e5.scene.length,4);
 assert.equal(e5.unlock.length,5);
 assert.equal(e5.reduced.unlock.length,2);
 assert.ok(e5.unlock.some(line=>line.text.includes('露西')));
 assert.ok(e5.unlock.some(line=>line.text.includes('ㄒㄩㄝ')));
 assert.ok(e5.unlock.some(line=>line.speaker==='vera'));
 // Vera speaks once, and only in the full ending.
 assert.equal([...e5.scene,...e5.reduced.unlock].filter(line=>line.speaker==='vera').length,0);
 assert.equal(e5.reward.name,'王后的字條');
 assert.ok(e5.enter.length>0);
 assert.equal(e5.stageLines,undefined);
 const src=fs.readFileSync(new URL('../games/blood-mirror/puzzles/box.js',import.meta.url),'utf8');
 assert.ok(!/requestAnimationFrame/.test(src.replace(/\/\/.*$/gm,'')));
 assert.ok(!/style="/.test(src),'the page CSP blocks inline style attributes');
 // The thread face shows pictures that already ship with the scenes.
 for(const {art} of Object.values(box.PANELS))assert.ok(fs.existsSync(new URL('../games/blood-mirror/assets/'+art+'.webp',import.meta.url)),art);
 // The levels are listed in order: E5 comes after the four that give it its keys, and the breather E-X is appended after it.
 assert.deepEqual(abyss.levels.map(level=>level.id),['e1','e2','e3','e4','e5','ex','e6','e7','e8','e9']);
});

test('finishing E5 faces is saved face by face, the box counts as done once all six are, and a new journey keeps them',()=>{
 setPuzzleCompletions(['box.box-time','box.box-light','box.nope','box']);
 assert.deepEqual(completedPuzzles().sort(),['box','box.box-light','box.box-time']);
 const save=toSaveV2({...initialState(),started:true},completedPuzzles());
 assert.deepEqual([...save.puzzles].sort(),['box','box.box-light','box.box-time']);
 resetPuzzles();
 assert.equal(isStageComplete('box','box-time'),true);
 setPuzzleCompletions([]);
});

test('E-X key: one stretch of yaw fits, the mirrored view and the starting pose do not',()=>{
 const stage=shadow.STAGES.key,found=shadow.solveAll(stage);
 assert.ok(found.length>=3&&found.length<=12,'cluster size '+found.length);
 assert.ok(found.every(pose=>pose.pitch===0&&Math.abs(pose.yaw-stage.solution.yaw)<=25),JSON.stringify(found));
 assert.ok(found.some(pose=>pose.yaw===stage.solution.yaw));
 assert.equal(shadow.matches(stage,(stage.solution.yaw+180)%360,0),false,'the back of the key is a mirror image');
 assert.equal(shadow.matches(stage,stage.start.yaw,stage.start.pitch),false);
});

test('E-X carving: only one small cluster of poses fits, and neither dial alone solves it',()=>{
 const stage=shadow.STAGES.queen,found=shadow.solveAll(stage);
 assert.ok(found.length>=1&&found.length<=9,'cluster size '+found.length);
 for(const pose of found){
  assert.ok(Math.abs(pose.yaw-stage.solution.yaw)<=10&&Math.abs(pose.pitch-stage.solution.pitch)<=10,'a second answer: '+JSON.stringify(pose));
 }
 assert.ok(found.some(pose=>pose.yaw===stage.solution.yaw&&pose.pitch===stage.solution.pitch));
 // The opposite view (yaw + 180, pitch negated) casts the mirror image of the picture, which must not fit.
 assert.equal(shadow.matches(stage,(stage.solution.yaw+180)%360,-stage.solution.pitch),false);
 assert.equal(shadow.matches(stage,stage.start.yaw,stage.start.pitch),false);
 for(let yaw=0;yaw<360;yaw+=shadow.STEP)assert.equal(shadow.matches(stage,yaw,0),false,'pitch 0 solves at yaw '+yaw);
 for(let pitch=shadow.PITCH_RANGE[0];pitch<=shadow.PITCH_RANGE[1];pitch+=shadow.STEP)assert.equal(shadow.matches(stage,stage.start.yaw,pitch),false,'start yaw solves at pitch '+pitch);
});

test('E-X hints follow the board and the last tier names the angles',()=>{
 for(const [name,stage] of Object.entries(shadow.STAGES)){
  assert.equal(shadow.hintStep(name,stage.solution.yaw,stage.solution.pitch),null);
  assert.equal(shadow.hintStep(name,stage.start.yaw,stage.start.pitch),'far');
  for(const list of Object.values(shadow.HINTS[name])){
   assert.equal(list.length,3);
   assert.ok(list[2].includes(String(stage.solution.yaw)),name);
  }
 }
 assert.ok(shadow.HINTS.queen.far[2].includes(String(shadow.STAGES.queen.solution.pitch)));
});

test('E-X level data: lines match the draft, the stages are registered, banners ship, no animation loop',()=>{
 const draft=fs.readFileSync(new URL('../games/blood-mirror/plan-improve/expert-dialogue-draft.md',import.meta.url),'utf8');
 const known=new Set([...draft.matchAll(/^- (\w+)｜(.+)$/gm)].map(m=>m[1]+'｜'+m[2]));
 const ex=abyss.levels[5];
 assert.equal(ex.id,'ex');assert.equal(ex.puzzle,'shadow');assert.equal(ex.number,'E-X');
 for(const {speaker,text} of [...ex.scene,...ex.unlock])assert.ok(known.has((speaker||'narrator')+'｜'+text),'not in the dialogue draft: '+text);
 assert.deepEqual(ex.stages,puzzles.shadow.stages.map(stage=>stage.id));
 assert.equal(puzzles.shadow.optional,true);
 assert.deepEqual(puzzles.shadow.stages[1].after,['shadow-key']);
 assert.ok(ex.enter.length>0);
 for(const id of ex.stages)for(const dir of ['','thumbs/'])assert.ok(fs.existsSync(new URL('../games/blood-mirror/assets/puzzles/'+dir+id+'.webp',import.meta.url)),dir+id);
 const src=fs.readFileSync(new URL('../games/blood-mirror/puzzles/shadow.js',import.meta.url),'utf8');
 assert.ok(!/requestAnimationFrame/.test(src.replace(/\/\/.*$/gm,'')));
 assert.ok(!/style="/.test(src),'the page CSP blocks inline style attributes');
 // Finishing stages is saved with the usual keys, and a new journey keeps them.
 setPuzzleCompletions(['shadow.shadow-key']);
 assert.deepEqual(completedPuzzles(),['shadow.shadow-key']);
 resetPuzzles();
 assert.equal(isStageComplete('shadow','shadow-key'),true);
 setPuzzleCompletions([]);
});

test('E6 pipes: the octave and the chord each have exactly one answer, and the reversed chord is a trap',()=>{
 assert.deepEqual(choir.solveOctave(),[[6,12]]);
 assert.deepEqual(choir.solveChord(),[[10,12,15]]);
 assert.deepEqual(choir.CHORD,[10,12,15]);
 // Lengths 8, 10, 12 stand 4 : 5 : 6, which reads the pitch the wrong way round and is not the chord.
 assert.equal(choir.isChord([8,10,12]),false);
 assert.equal(choir.isReversedChord([8,10,12]),true);
 assert.equal(choir.isReversedChord([10,12,15]),false);
 // The trap exists among the seven pipes, so the wrong reading is a real near miss.
 assert.ok(choir.PIPES.includes(8)&&choir.PIPES.includes(10)&&choir.PIPES.includes(12));
 // Every wrong pair or triple fails, including pairs that are an octave in length only by chance of order.
 assert.equal(choir.isOctave(6,9),false);assert.equal(choir.isOctave(12,6),true);
 assert.equal(choir.isChord([10,12]),false);
});

test('E6 rhythm: the score fixes one start for each voice, and the voices are not interchangeable',()=>{
 assert.deepEqual(choir.solveRhythm(),[[1,2,3]]);
 assert.equal(choir.rhythmSolved([0,0,0]),false,'the starting board must not be solved');
 assert.deepEqual(choir.VOICES.map(voice=>voice.period),[3,4,6]);
 assert.equal(choir.SCORE.length,choir.BEATS);
 // The 12 beats are the union of the three voices; beat 10 is shared by two of them.
 assert.deepEqual(choir.SCORE.map((on,t)=>on?t+1:0).filter(Boolean),[2,3,4,5,7,8,10,11]);
 assert.equal(choir.hits(0,1)[10]&&choir.hits(1,2)[10],true);
});

test('E6 hymn: each beat opens the pipes of the voices that land on it, and it needs both earlier results',()=>{
 assert.deepEqual(choir.HYMN.map(pipes=>pipes.join('+')),['','10','12','15','10','','12','10','','15']);
 assert.equal(choir.firstWrong(choir.HYMN),null);
 // The slower the voice, the longer the pipe.
 assert.deepEqual(choir.PIPE_OF_VOICE,[10,12,15]);
 // A wrong cell names the first beat that differs (0-based), whichever way it is wrong.
 const missing=choir.HYMN.map(pipes=>[...pipes]);missing[4]=[];
 assert.equal(choir.firstWrong(missing),4);
 const extra=choir.HYMN.map(pipes=>[...pipes]);extra[0]=[10];
 assert.equal(choir.firstWrong(extra),0);
 const swapped=choir.HYMN.map(pipes=>[...pipes]);swapped[1]=[12];
 assert.equal(choir.firstWrong(swapped),1);
 // Reading the voices the wrong way round (fast voice on the long pipe) gives a different hymn.
 const flipped=Array.from({length:choir.HYMN_BEATS},(_,t)=>choir.VOICES.flatMap((voice,i)=>t%voice.period===choir.OFFSETS[i]?[choir.CHORD[2-i]]:[]));
 assert.notEqual(choir.firstWrong(flipped),null);
 // Any other start of any voice gives a different hymn too, so the rhythm result is really needed.
 for(let voice=0;voice<3;voice++)for(let start=0;start<choir.VOICES[voice].period;start++){
  if(start===choir.OFFSETS[voice])continue;
  const offsets=choir.OFFSETS.map((o,i)=>i===voice?start:o);
  const other=Array.from({length:choir.HYMN_BEATS},(_,t)=>choir.VOICES.flatMap((v,i)=>t%v.period===offsets[i]?[choir.PIPE_OF_VOICE[i]]:[]));
  assert.notEqual(choir.firstWrong(other),null,'voice '+voice+' at '+start);
 }
});

test('E6 hints: three tiers per step, the pipes step follows the choice, and the last tier gives the answer',()=>{
 assert.equal(choir.pipesStep('warm',[]),'warm');
 assert.equal(choir.pipesStep('chord',[10,12,15]),'chord');
 assert.equal(choir.pipesStep('chord',[8,10,12]),'trap');
 for(const [step,list] of Object.entries(choir.HINTS))assert.equal(list.length,3,step);
 assert.ok(choir.HINTS.warm[2].includes('6')&&choir.HINTS.warm[2].includes('12'));
 for(const length of choir.CHORD){assert.ok(choir.HINTS.chord[2].includes(String(length)));assert.ok(choir.HINTS.trap[2].includes(String(length)));}
 assert.ok(choir.OFFSETS.every((offset,i)=>choir.HINTS.rhythm[2].includes('第 '+(offset+1)+' 拍')),choir.HINTS.rhythm[2]);
 // The hymn answer in the last tier lists the same beats the rules produce.
 assert.ok(choir.HINTS.hymn[2].includes('第 2、5、8 拍：長 10')&&choir.HINTS.hymn[2].includes('第 3、7 拍：長 12')&&choir.HINTS.hymn[2].includes('第 4、10 拍：長 15'));
});

test('E6 level data: lines match the draft, the stages are registered and ordered, banners ship, no animation loop or audio',()=>{
 const draft=fs.readFileSync(new URL('../games/blood-mirror/plan-improve/expert-dialogue-draft.md',import.meta.url),'utf8');
 const known=new Set([...draft.matchAll(/^- (\w+)｜(.+)$/gm)].map(m=>m[1]+'｜'+m[2]));
 const e6=abyss.levels[6];
 assert.equal(e6.id,'e6');assert.equal(e6.puzzle,'choir');assert.equal(e6.number,'E6');
 for(const {speaker,text} of [...e6.scene,...e6.unlock])assert.ok(known.has((speaker||'narrator')+'｜'+text),'not in the dialogue draft: '+text);
 assert.equal(e6.scene.length,3);assert.equal(e6.unlock.length,3);
 assert.deepEqual(e6.reward,{name:'銅片',mark:'音',caption:'管底銅片上的字'});
 assert.deepEqual(e6.stages,puzzles.choir.stages.map(stage=>stage.id));
 assert.equal(puzzles.choir.optional,true);
 const hymn=puzzles.choir.stages[2];
 assert.deepEqual(hymn.after,['choir-pipes','choir-rhythm']);
 assert.equal(puzzles.choir.stages[0].after,undefined);assert.equal(puzzles.choir.stages[1].after,undefined);
 for(const id of e6.stages)for(const dir of ['','thumbs/'])assert.ok(fs.existsSync(new URL('../games/blood-mirror/assets/puzzles/'+dir+id+'.webp',import.meta.url)),dir+id);
 const src=fs.readFileSync(new URL('../games/blood-mirror/puzzles/choir.js',import.meta.url),'utf8').replace(/\/\/.*$/gm,'');
 assert.ok(!/requestAnimationFrame/.test(src));
 assert.ok(!/AudioContext|new Audio/.test(src),'the hall is silent');
 assert.ok(!/style="/.test(src),'the page CSP blocks inline style attributes');
 // Saved by stage, kept by a new journey.
 setPuzzleCompletions(['choir.choir-pipes','choir.choir-rhythm']);
 assert.deepEqual(completedPuzzles().sort(),['choir.choir-pipes','choir.choir-rhythm']);
 resetPuzzles();
 assert.equal(isStageComplete('choir','choir-rhythm'),true);
 setPuzzleCompletions([]);
});

test('E7 pages: each pair of equations fixes both weights, and neither equation alone does',()=>{
 assert.deepEqual(scale.solveWeights(scale.STAGES.fruit),[{apple:2,mirror:3}]);
 assert.deepEqual(scale.solveWeights(scale.STAGES.thorn),[{rose:5,dagger:7}]);
 assert.deepEqual(scale.solveWeights(scale.STAGES.final),[scale.WEIGHTS]);
 // Drop any one equation and the weights are no longer fixed, so both are needed.
 for(const name of ['fruit','thorn']){
  const stage=scale.STAGES[name];
  for(let drop=0;drop<stage.known.length;drop++){
   const fewer={...stage,known:stage.known.filter((_,i)=>i!==drop)};
   assert.ok(scale.solveWeights(fewer).length>1,name+' without equation '+drop);
  }
 }
 // The true weights balance every page that is shown.
 for(const stage of Object.values(scale.STAGES))for(const page of stage.known)assert.equal(scale.balanced(page,scale.WEIGHTS),true);
 assert.ok(Object.values(scale.WEIGHTS).every(w=>w>=1&&w<=scale.MAX));
});

test('E7 open scales: each has exactly one right pan, and the last one needs all four weights',()=>{
 assert.deepEqual(scale.solveAsk(scale.STAGES.fruit),[{apple:6}]);
 assert.deepEqual(scale.solveAsk(scale.STAGES.thorn),[{rose:7}]);
 assert.deepEqual(scale.solveAsk(scale.STAGES.final),[{apple:1,mirror:3,dagger:2}]);
 // The failure reasons are told apart: a thing that is not allowed, a wrong number of pieces, and a wrong weight.
 const final=scale.STAGES.final;
 assert.equal(scale.judge(final,{apple:1,mirror:3,dagger:2}),'');
 assert.equal(scale.judge(final,{apple:1,mirror:3,dagger:2,rose:1}),'thing');
 assert.equal(scale.judge(final,{apple:2,mirror:3,dagger:2}),'total');
 assert.equal(scale.judge(final,{apple:2,mirror:2,dagger:2}),'weight');
 // Using any other weights for the apple, mirror or dagger would have given a different answer, so each result matters.
 for(const sym of ['apple','mirror','rose','dagger']){
  const wrong={...scale.WEIGHTS,[sym]:scale.WEIGHTS[sym]+1};
  const left=scale.weightOf(final.ask.left,wrong);
  const rightTrue=scale.weightOf([{sym:'apple',n:1},{sym:'mirror',n:3},{sym:'dagger',n:2}],wrong);
  assert.notEqual(left,rightTrue,'a wrong '+sym+' still balances');
 }
 assert.equal(scale.judge(scale.STAGES.fruit,{apple:6}),'');
 assert.equal(scale.judge(scale.STAGES.fruit,{apple:5}),'weight');
 assert.equal(scale.judge(scale.STAGES.fruit,{mirror:4}),'thing');
});

test('E7 hints: three tiers per step and the last one names the weights and the pan',()=>{
 for(const [name,list] of Object.entries(scale.HINTS))assert.equal(list.length,3,name);
 assert.ok(scale.HINTS.fruit[2].includes('蘋果 2 磅')&&scale.HINTS.fruit[2].includes('鏡 3 磅')&&scale.HINTS.fruit[2].includes('6 個蘋果'));
 assert.ok(scale.HINTS.thorn[2].includes('玫瑰 5 磅')&&scale.HINTS.thorn[2].includes('匕首 7 磅')&&scale.HINTS.thorn[2].includes('7 朵玫瑰'));
 assert.ok(scale.HINTS.final[2].includes('1 個蘋果、3 面鏡、2 把匕首'));
 assert.ok(scale.HINTS.final[1].includes('25 磅'));
 assert.equal(scale.hintStep('fruit'),'fruit');
});

test('E7 level data: lines match the draft, the stages are registered and ordered, banners ship, no animation loop',()=>{
 const draft=fs.readFileSync(new URL('../games/blood-mirror/plan-improve/expert-dialogue-draft.md',import.meta.url),'utf8');
 const known=new Set([...draft.matchAll(/^- (\w+)｜(.+)$/gm)].map(m=>m[1]+'｜'+m[2]));
 const e7=abyss.levels[7];
 assert.equal(e7.id,'e7');assert.equal(e7.puzzle,'scale');assert.equal(e7.number,'E7');
 for(const {speaker,text} of [...e7.scene,...e7.unlock])assert.ok(known.has((speaker||'narrator')+'｜'+text),'not in the dialogue draft: '+text);
 assert.equal(e7.scene.length,3);assert.equal(e7.unlock.length,3);
 assert.deepEqual(e7.reward,{name:'鉛砝碼',mark:'重',caption:'托盤底下砝碼上的字'});
 assert.deepEqual(e7.stages,puzzles.scale.stages.map(stage=>stage.id));
 assert.equal(puzzles.scale.optional,true);
 assert.deepEqual(puzzles.scale.stages[2].after,['scale-fruit','scale-thorn']);
 assert.equal(puzzles.scale.stages[0].after,undefined);assert.equal(puzzles.scale.stages[1].after,undefined);
 for(const id of e7.stages)for(const dir of ['','thumbs/'])assert.ok(fs.existsSync(new URL('../games/blood-mirror/assets/puzzles/'+dir+id+'.webp',import.meta.url)),dir+id);
 const src=fs.readFileSync(new URL('../games/blood-mirror/puzzles/scale.js',import.meta.url),'utf8').replace(/\/\/.*$/gm,'');
 assert.ok(!/requestAnimationFrame/.test(src));
 assert.ok(!/style="/.test(src),'the page CSP blocks inline style attributes');
 // Every thing has its own shape as well as its colour.
 for(const sym of Object.keys(scale.WEIGHTS))assert.ok(scale.iconSvg(sym).includes('sym-'),sym);
 assert.equal(new Set(Object.keys(scale.WEIGHTS).map(sym=>scale.iconSvg(sym))).size,4);
 setPuzzleCompletions(['scale.scale-fruit','scale.scale-thorn']);
 assert.deepEqual(completedPuzzles().sort(),['scale.scale-fruit','scale.scale-thorn']);
 resetPuzzles();
 assert.equal(isStageComplete('scale','scale-thorn'),true);
 setPuzzleCompletions([]);
});

test('E8 faces: each frame has exactly one line-up, and every clue is needed',()=>{
 for(const [name,stage] of Object.entries(frozen.STAGES)){
  assert.deepEqual(frozen.solve(stage),[stage.truth],name+' unique');
  assert.equal(frozen.judge(stage,stage.truth),'');
 }
 const faces=frozen.STAGES.faces;
 faces.clues.forEach((_,i)=>assert.ok(frozen.solve(faces,i).length>1,'faces without clue '+(i+1)));
 assert.equal(new Set(faces.figures.map(f=>f.mask+f.tone)).size,faces.figures.length,'every face differs in mask shape and tone');
 assert.equal(frozen.judge(faces,['duke','','','','','']),'blank');
 const swapped=[...faces.truth];[swapped[0],swapped[1]]=[swapped[1],swapped[0]];
 assert.ok(Number.isInteger(frozen.judge(faces,swapped)),'a wrong line-up names a clue');
});

test('E8 order and final: one time order, one set of holders, and each step needs the other',()=>{
 assert.deepEqual(frozen.orderSolve(),[[1,2,0]]);
 assert.equal(frozen.orderSolve(1).length,2,'without the direction clue the order can be read backwards');
 assert.ok(frozen.orderSolve(0).length>1,'without the one-swap rule the order is not fixed');
 assert.equal(frozen.orderJudge([1,2,0]),'');
 assert.equal(frozen.orderJudge([0,1,2]),1);
 assert.equal(frozen.orderJudge([0,1,1]),'blank');
 // the three pictures: neighbours in time differ by one swap, the two ends by two
 const [a,b,c]=frozen.MOMENTS;
 const diff=(x,y)=>x.filter((v,i)=>v!==y[i]).length;
 assert.deepEqual([diff(a,b),diff(b,c),diff(a,c)],[2,2,4]);
 // holders are three different people; the answer is the last one, named from the roster
 assert.equal(new Set(frozen.HOLDERS).size,3);
 assert.deepEqual(frozen.finalAnswer(),['maid','doctor','hunter']);
 assert.equal(frozen.finalJudge(['maid','doctor','hunter']),'');
 assert.equal(frozen.finalJudge(['doctor','maid','hunter']),'wrong');
 assert.equal(frozen.finalJudge(['maid','doctor','']),'blank');
 // reading the frames in the shuffled order (the trap) gives a different answer
 assert.notDeepEqual([0,1,2].map(f=>frozen.ROSTER[frozen.FRAMES[f].holder]),frozen.finalAnswer());
 // every figure is told apart by shape and tone in the pictures too
 for(const frame of frozen.FRAMES)assert.equal(new Set(frame.slots).size,6);
 for(const [i,html] of frozen.FRAMES.entries())assert.ok(frozen.rowSvg(frame_row(i),frozen.FRAMES[i].slots.indexOf(frozen.FRAMES[i].holder)).includes('frz-glass'));
 function frame_row(i){return frozen.FRAMES[i].slots.map(k=>frozen.FIGURES[k]);}
});

test('E8 hints: three tiers per step and the last one gives the answer',()=>{
 for(const step of ['warm','faces','order','final']){
  assert.equal(frozen.HINTS[step].length,3,step);
  assert.equal(frozen.hintStep(step),step);
 }
 assert.ok(frozen.HINTS.order[2].includes('乙、丙、甲'));
 assert.ok(frozen.HINTS.final[2].includes('獵人'));
 assert.ok(frozen.HINTS.faces[2].includes('醫師、公爵、侍女、伯爵夫人、獵人、樂師'));
});

test('E8 level data: lines match the draft, the stages are registered and ordered, banners ship, no animation loop',()=>{
 const draft=fs.readFileSync(new URL('../games/blood-mirror/plan-improve/expert-dialogue-draft.md',import.meta.url),'utf8');
 const known=new Set([...draft.matchAll(/^- (\w+)｜(.+)$/gm)].map(m=>m[1]+'｜'+m[2]));
 const e8=abyss.levels[8];
 assert.equal(e8.id,'e8');assert.equal(e8.puzzle,'frozen');assert.equal(e8.number,'E8');
 for(const {speaker,text} of [...e8.scene,...e8.unlock])assert.ok(known.has((speaker||'narrator')+'｜'+text),'not in the dialogue draft: '+text);
 assert.equal(e8.scene.length,3);assert.equal(e8.unlock.length,3);
 assert.deepEqual(e8.reward,{name:'停擺的懷錶',mark:'時',caption:'錶蓋內側刻著的字'});
 assert.deepEqual(e8.stages,puzzles.frozen.stages.map(stage=>stage.id));
 assert.equal(puzzles.frozen.optional,true);
 assert.deepEqual(puzzles.frozen.stages[2].after,['frozen-faces','frozen-order']);
 assert.equal(puzzles.frozen.stages[0].after,undefined);assert.equal(puzzles.frozen.stages[1].after,undefined);
 for(const id of e8.stages)for(const dir of ['','thumbs/'])assert.ok(fs.existsSync(new URL('../games/blood-mirror/assets/puzzles/'+dir+id+'.webp',import.meta.url)),dir+id);
 const src=fs.readFileSync(new URL('../games/blood-mirror/puzzles/frozen.js',import.meta.url),'utf8').replace(/\/\/.*$/gm,'');
 assert.ok(!/requestAnimationFrame/.test(src));
 // `style-src 'self'` blocks style attributes and cssText, not CSSOM property writes: the rings turn by setting el.style.transform (verified in the browser against the real headers).
 assert.ok(!/style="/.test(src)&&!/\.style\.cssText/.test(src)&&!/setAttribute\(\s*['"]style/.test(src),'the page CSP blocks inline styles');
 setPuzzleCompletions(['frozen.frozen-faces','frozen.frozen-order']);
 assert.deepEqual(completedPuzzles().sort(),['frozen.frozen-faces','frozen.frozen-order']);
 resetPuzzles();
 setPuzzleCompletions([]);
});

test('E9 compass: turning drags the neighbours, every position is reachable, the shortest ways are the true shortest',()=>{
 assert.deepEqual(compass.turn([0,0,0,0],1,1),[6,1,6,0]);
 assert.deepEqual(compass.turn([0,0],0,-1),[7,2]);
 for(const k of [0,1,2,3])assert.deepEqual(compass.turn(compass.turn([3,5,1,7],k,1),k,-1),[3,5,1,7],'a turn undoes itself');
 // an independent breadth-first search from the aligned rings gives the distance of every position
 for(const [name,stage] of Object.entries(compass.STAGES)){
  const n=stage.rings.length,dist=new Map([[Array(n).fill(0).join(),0]]);
  let level=[Array(n).fill(0)];
  while(level.length){const next=[];for(const s of level)for(const m of compass.MOVES(n)){const t=compass.turn(s,m.ring,m.dir),id=t.join();if(!dist.has(id)){dist.set(id,dist.get(s.join())+1);next.push(t);}}level=next;}
  assert.equal(dist.size,8**n,name+': every position can be reached');
  const path=compass.solve(stage.start);
  assert.equal(path.length,dist.get(stage.start.join()),name+' shortest');
  assert.ok(compass.aligned(path.reduce((s,m)=>compass.turn(s,m.ring,m.dir),stage.start)),name+' path aligns the rings');
  assert.ok(stage.start.every(v=>v!==0),name+': no ring starts aligned');
  assert.deepEqual(compass.solve(Array(n).fill(0)),[]);
 }
 const length=name=>compass.solve(compass.STAGES[name].start).length;
 assert.deepEqual([length('inner'),length('outer'),length('final')],[4,6,12]);
 assert.ok(length('final')>length('inner')+length('outer'),'the four rings cannot be done as two pairs');
 assert.deepEqual(['inner','outer','final'].map(compass.allowance),[10,12,24]);
});

test('E9 hints: three tiers, and the last one names the shortest turns from where the rings are now',()=>{
 for(const name of ['inner','outer','final']){
  const stage=compass.STAGES[name];
  const hints=compass.hintsFor(name,()=>stage.start);
  assert.equal(hints.length,3,name);
  const last=String(hints[2]()),n=compass.solve(stage.start).length;
  assert.ok(String(hints[1]()).includes('第一步是'),name+' tier 2 names the first move');
  assert.ok(last.includes('共 '+n+' 步'),name);
  const after=compass.turn(stage.start,0,1);
  assert.ok(String(compass.hintsFor(name,()=>after)[2]()).includes('共 '+compass.solve(after).length+' 步'),name+' follows the board');
  assert.equal(compass.hintStep(name),name);
 }
 assert.equal(String(compass.hintsFor('inner',()=>[0,0])[2]()),'');
});

test('E9 level data: lines match the draft, needs the four marks, stages registered, banners ship, no animation loop',()=>{
 const draft=fs.readFileSync(new URL('../games/blood-mirror/plan-improve/expert-dialogue-draft.md',import.meta.url),'utf8');
 const known=new Set([...draft.matchAll(/^- (\w+)｜(.+)$/gm)].map(m=>m[1]+'｜'+m[2]));
 const e9=abyss.levels[9];
 assert.equal(e9.id,'e9');assert.equal(e9.puzzle,'compass');assert.equal(e9.number,'E9');
 for(const {speaker,text} of [...e9.scene,...e9.unlock])assert.ok(known.has((speaker||'narrator')+'｜'+text),'not in the dialogue draft: '+text);
 assert.equal(e9.scene.length,3);assert.equal(e9.unlock.length,3);
 assert.deepEqual(e9.stages,puzzles.compass.stages.map(stage=>stage.id));
 assert.equal(puzzles.compass.optional,true);
 // the rings carry the marks of the four earlier levels, in ring order
 assert.deepEqual(compass.MARKS,['影','音','重','時'].map((mark,i)=>abyss.levels.find(l=>l.reward.mark===mark)&&mark));
 for(const stage of puzzles.compass.stages)assert.deepEqual(stage.requires,['shadow','choir','scale','frozen']);
 assert.deepEqual(puzzles.compass.stages[2].after,['compass-inner','compass-outer']);
 assert.equal(puzzles.compass.stages[0].after,undefined);assert.equal(puzzles.compass.stages[1].after,undefined);
 for(const id of e9.stages)for(const dir of ['','thumbs/'])assert.ok(fs.existsSync(new URL('../games/blood-mirror/assets/puzzles/'+dir+id+'.webp',import.meta.url)),dir+id);
 const src=fs.readFileSync(new URL('../games/blood-mirror/puzzles/compass.js',import.meta.url),'utf8').replace(/\/\/.*$/gm,'');
 assert.ok(!/requestAnimationFrame/.test(src));
 // `style-src 'self'` blocks style attributes and cssText, not CSSOM property writes: the rings turn by setting el.style.transform.
 assert.ok(!/style="/.test(src)&&!/\.style\.cssText/.test(src)&&!/setAttribute\(\s*['"]style/.test(src),'the page CSP blocks inline styles');
 assert.ok(compass.dialSvg([0,1,2,3],[0,0,0,0]).includes('cmp-needle'));
});

test('closing page: lines match the draft, opens with E9, both answers lead to the same title, nothing is saved',()=>{
 const draft=fs.readFileSync(new URL('../games/blood-mirror/plan-improve/expert-dialogue-draft.md',import.meta.url),'utf8');
 const known=new Set([...draft.matchAll(/^- (\w+)｜(.+)$/gm)].map(m=>m[1]+'｜'+m[2]));
 const page=abyss.closing;
 assert.equal(page.requires,'compass');assert.equal(page.requires,abyss.levels[9].puzzle);
 for(const {speaker,text} of [...page.scene,...page.ending,...page.options.map(o=>({text:o.text}))])assert.ok(known.has((speaker||'narrator')+'｜'+text),'not in the dialogue draft: '+text);
 assert.ok(draft.includes(page.prompt));
 for(const option of page.options)assert.ok(draft.includes('選項'+(option.label.startsWith('「')?option.label:'「'+option.label+'」')),'option not in the draft: '+option.label);
 assert.equal(page.options.length,2);
 assert.equal(page.reward.name,'被帳冊記住的人');
 assert.ok(fs.existsSync(new URL('../games/blood-mirror/assets/puzzles/thumbs/'+page.thumb+'.webp',import.meta.url)));
 // the world still forgets: the page never names anyone who is not already in the ledger scenes, and adds no after-the-ending event
 for(const {text} of [...page.scene,...page.ending])assert.ok(!/想起|記起|回來|醒來/.test(text),'the world must not remember: '+text);
 // no new save field: nothing in the page asks the save to store it
 const src=fs.readFileSync(new URL('../games/blood-mirror/abyss.js',import.meta.url),'utf8');
 assert.ok(!/state\.|localStorage|persist/.test(src.slice(src.indexOf('function closing'))),'the closing page must not save anything');
});

test('hints: every stage of the acts has three distinct tiers, no broken quotes, and the last tier is the answer',()=>{
 for(const room of rooms){
  for(const stage of puzzles[room.id].stages){
   const tiers=room.stepHints?.[stage.id];
   assert.ok(tiers,room.id+'.'+stage.id+' has hints');
   assert.equal(tiers.length,3,room.id+'.'+stage.id);
   assert.equal(new Set(tiers).size,3,room.id+'.'+stage.id+' tiers differ');
   for(const tier of tiers){assert.ok(tier.length>=14,'too short: '+tier);assert.ok(!/「」|「\u0020*」/.test(tier),'empty quotes in: '+tier);}
  }
  for(const [step,tiers] of Object.entries(room.stepHints||{}))assert.equal(tiers.length,3,room.id+'.'+step);
 }
 // seals and deduction rows end with the words themselves
 for(const room of rooms)for(const step of ['seal','deduction']){
  const tier=room.stepHints?.[step]?.[2];
  if(tier&&room.id!=='queen'&&!(room.id==='library'&&step==='seal'))assert.ok(/→/.test(tier),room.id+'.'+step+' names the answer');
 }
});

test('hints: the explicit answers in the hint text really solve the puzzle',()=>{
 const library=rooms.find(room=>room.id==='library').stepHints;
 // ledger: 1↔2, 2↔6, 3↔4, 4↔7, 5↔6, 6↔9, 7↔9 on the starting tiles
 const tiles=[4,0,8,2,6,1,3,7,5];
 for(const [a,b] of [[1,2],[2,6],[3,4],[4,7],[5,6],[6,9],[7,9]])[tiles[a-1],tiles[b-1]]=[tiles[b-1],tiles[a-1]];
 assert.deepEqual(tiles,[0,1,2,3,4,5,6,7,8]);
 assert.ok(library.ledger[2].includes('1↔2、2↔6、3↔4、4↔7、5↔6、6↔9、7↔9'));
 // watch: minute gear twice, then the second gear twice (or the hour gear four times)
 let gears=watch.startGears;
 for(const i of [1,1,2,2])gears=watch.turnGear(gears,i);
 assert.ok(watch.watchSolved(gears));
 gears=watch.startGears;for(let k=0;k<4;k++)gears=watch.turnGear(gears,0);
 assert.ok(watch.watchSolved(gears));
 // reflection: the right half, row by row (dark, lit / lit, dark / lit, lit / lit, dark), mirrors the left half
 const left=[true,false,false,true,true,true,false,true],right=[false,true,true,false,true,true,true,false];
 assert.ok(left.every((value,i)=>value===right[i^1]));
 assert.ok(rooms.find(room=>room.id==='mirror').stepHints.reflection[2].includes('第 1 列 暗、亮；第 2 列 亮、暗；第 3 列 亮、亮；第 4 列 亮、暗'));
 // the light puzzle keeps its backslash in the text
 assert.ok(rooms.find(room=>room.id==='ballroom').stepHints.light[2].includes('「\\」'));
});

test('hints: the prism hint always names a piece that really differs, in every unsolved position',()=>{
 for(const [id,stage] of Object.entries(prism.STAGES)){
  const sol=prism.solutionOf(id);
  for(const S of prism.allStates(stage.L)){
   if(prism.solved(stage.L,S))continue;
   const d=prism.diagnose(stage.L,S,sol);
   assert.ok(d,id+': an unsolved board always has a hint step');
   assert.ok(d.mi>=0||d.ki>=0,id+': the hint names a piece');
   if(d.mi>=0)assert.notEqual(S.m[d.mi],sol.m[d.mi]);else assert.notEqual(S.k[d.ki],sol.k[d.ki]);
  }
 }
});

test('hints: the prologue music box has three tiers and the last one reads the pins now',()=>{
 assert.equal(musicbox.HINTS.length,3);
 assert.equal(musicbox.hintStep([0,0,0,0]),'pins');
 assert.equal(musicbox.hintStep(musicbox.lullaby),null);
 assert.equal(musicbox.HINTS[2]([0,0,0,0]),'現在還要改：第 1 根要撥起、第 3 根要撥起、第 4 根要撥起。');
 assert.equal(musicbox.HINTS[2]([1,1,1,1]),'現在還要改：第 2 根要放下。');
 assert.equal(musicbox.HINTS[2](musicbox.lullaby),'');
 assert.ok(musicbox.HINTS[1].includes('第 1 根撥起、第 2 根放下、第 3 根撥起、第 4 根撥起'));
});
