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
import {abyss} from '../games/blood-mirror/data/abyss.js';
import {speakers} from '../games/blood-mirror/data/chapters/index.js';
import {puzzles,setPuzzleCompletions,completedPuzzles,resetPuzzles,isPuzzleComplete,isStageComplete,startPuzzle} from '../games/blood-mirror/puzzles/index.js';
import {rooms,initialState,toSaveV2,fromSaveV2,exportSave,parseSave,loadSave,writeSave,SAVE_KEY} from '../games/blood-mirror/engine/index.js';

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
 const all=[...abyss.entry,...abyss.levels.flatMap(level=>[...level.scene,...level.unlock,...Object.values(level.stageLines||{}).flat()])];
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
