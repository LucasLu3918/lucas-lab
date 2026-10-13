// "帳本的背面" (鏡淵) E1: the belfry gear train is proven by search, its hints match the solution, its lines match the
// dialogue draft, and the level stays outside the seven acts and the save format.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LEVELS,CRANK_TEETH,emptyBoard,evaluate,solveAll,HINTS,hintStep,toothPath,phases} from '../games/blood-mirror/puzzles/gears13.js';
import {WEIGHTS,TOLERANCE,length as pendulumLength,ratio as pendulumRatio,pendulumSolved,solveAll as pendulumSolveAll,HINTS as PENDULUM_HINTS,hintStep as pendulumHintStep} from '../games/blood-mirror/puzzles/pendulum.js';
import {NOTCHES,RUBY,NUMERALS,numeralAt,notchOf,playTolls,solveAll as wheelSolveAll,HINTS as WHEEL_HINTS,hintStep as wheelHintStep} from '../games/blood-mirror/puzzles/starwheel.js';
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
 const all=[...abyss.entry,...abyss.levels.flatMap(level=>[...level.scene,...level.unlock])];
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
