// M6: the two chapters inserted into the story (ballroom, hunter), their puzzles, choices and the
// catch-up rule that keeps older saves playable.
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restoreState,rooms,solve,travel,chooseEnding,choose,choiceVariant,choiceDefs,journeyComplete,inspect,clueWords,judgeInterrogation,toSaveV2,fromSaveV2,parseSave,exportSave,remapV1} from '../games/blood-mirror/engine/index.js';
import {maskSolutions,maskAnswer,masksSolved,maskClues,guests,maskNames} from '../games/blood-mirror/puzzles/masks.js';
import {heartPath,heartPathValid,NODES} from '../games/blood-mirror/puzzles/runeheart.js';
import {traceBeam,lightSolved,solution,startState,mirrors,COLS,ROWS} from '../games/blood-mirror/puzzles/light.js';
import {journeyRecap,spotText} from '../games/blood-mirror/journey.js';
import {existsSync} from 'node:fs';

const at=id=>rooms.findIndex(room=>room.id===id);
const solveThrough=(state,count)=>{for(let i=0;i<count;i++){travel(state,i);const room=rooms[i];if(room.requires){const spot=room.spots.find(s=>s.item===room.requires);inspect(state,spot.id);}if(room.requires&&!state.inventory.includes(room.requires))state.inventory.push(room.requires);solve(state,room.answer);}return state;};

test('the story order inserts the ball and the hunter after the library', () => {
  assert.deepEqual(rooms.map(r=>r.id),['library','ballroom','hunter','mine','crypt','queen','mirror']);
  assert.deepEqual(rooms.map(r=>r.chapter),['第一幕','第二幕','第三幕','第四幕','第五幕','第六幕','第七幕']);
  assert.deepEqual(rooms.filter(r=>r.catchUp).map(r=>r.id),['ballroom','hunter']);
});

test('the masked guests have exactly one arrangement, and the answer satisfies every testimony', () => {
  assert.equal(guests.length,maskNames.length);
  assert.ok(maskClues.length>=4);
  assert.deepEqual(maskSolutions(),[maskAnswer]);
  assert.equal(masksSolved(maskAnswer),true);
  assert.equal(masksSolved([1,0,2,3,4,5]),false);
  assert.equal(masksSolved([0,1,2]),false);
});

test('the glass-heart ring visits every rune exactly once by jumping over two', () => {
  assert.equal(heartPath.length,NODES);
  assert.equal(new Set(heartPath).size,NODES);
  heartPath.slice(1).forEach((node,i)=>assert.equal((node-heartPath[i]+NODES)%NODES,3));
  assert.equal(heartPathValid(heartPath),true);
  assert.equal(heartPathValid([...heartPath].reverse()),false);
  assert.equal(heartPathValid(heartPath.slice(0,6)),false);
});

for(const id of ['ballroom','hunter']){
  test(`${id}: the seal statement is answerable from clues gathered in the act`, () => {
    const room=rooms[at(id)];
    const reachable=new Set(room.spots.filter(s=>!s.after&&!s.lock).flatMap(s=>[...(s.clues||[]),...(s.restoredClues||[])]));
    assert.deepEqual(room.interrogation.template.filter(p=>typeof p==='number'),room.interrogation.blanks.map((_,i)=>i));
    for(const blank of room.interrogation.blanks){
      assert.ok(clueWords[blank.answer],blank.answer);
      assert.equal(clueWords[blank.answer].group,blank.group);
      assert.ok(reachable.has(blank.answer),`${blank.answer} unreachable in ${id}`);
    }
    assert.deepEqual(room.answer,room.interrogation.blanks.map(b=>b.answer));
    assert.equal(judgeInterrogation(room.interrogation,room.answer).ok,true);
    // The word the evidence unlocks must stay hidden until that evidence is restored.
    const evidence=room.spots.find(s=>s.id===room.evidence),hidden={ballroom:'eli',hunter:'toby'}[id];
    assert.ok(evidence.restoredClues.includes(hidden));
    assert.ok(!room.spots.some(s=>s!==evidence&&(s.clues||[]).includes(hidden)),hidden+' leaks before the evidence is restored');
  });
}

test('assets and music for both acts exist', () => {
  for(const id of ['ballroom','hunter']){
    assert.ok(existsSync(new URL('../games/blood-mirror/assets/'+rooms[at(id)].image,import.meta.url)),rooms[at(id)].image);
  }
  for(const file of ['12_ballroom_Waltz_of_Wax.mp3','13_hunter_A_Heart_in_Glass.mp3'])assert.ok(existsSync(new URL('../games/blood-mirror/assets/music/'+file,import.meta.url)),file);
});

test('a choice needs its act solved, only stores valid options, and survives a save', () => {
  assert.deepEqual(Object.keys(choiceDefs).sort(),['lastDance','tobyHeart']);
  const state={...initialState(),started:true};
  assert.equal(choose(state,'lastDance','eli'),false,'act not solved yet');
  solveThrough(state,at('hunter')+1);
  assert.equal(choose(state,'lastDance','nobody'),false);
  assert.equal(choose(state,'nothing','eli'),false);
  assert.equal(choose(state,'lastDance','eli'),true);
  assert.equal(choose(state,'tobyHeart','bury'),true);
  const back=fromSaveV2(JSON.parse(JSON.stringify(toSaveV2(state)))).state;
  assert.deepEqual(back.choices,{lastDance:'eli',tobyHeart:'bury'});
  // Choices of an unsolved act are dropped on restore.
  const forged=restoreState({...state,solved:[0],choices:{lastDance:'prince',tobyHeart:'take'}});
  assert.deepEqual(forged.choices,{});
});

test('choices change later text, never the route', () => {
  const crypt=rooms[at('crypt')],kiss=crypt.spots.find(s=>s.id==='kiss'),mine=rooms[at('mine')],cradle=mine.spots.find(s=>s.id==='cradle');
  const fresh=initialState();
  assert.equal(spotText(kiss,false,fresh),kiss.text,'no choice yet: neutral text');
  const prince={...fresh,choices:{lastDance:'prince'}},eli={...fresh,choices:{lastDance:'eli'}};
  assert.notEqual(spotText(kiss,false,prince),spotText(kiss,false,eli));
  const take={...fresh,choices:{tobyHeart:'take'}},bury={...fresh,choices:{tobyHeart:'bury'}};
  assert.match(spotText(cradle,false,take),/行囊/);assert.match(spotText(cradle,false,bury),/土丘/);
  assert.equal(choiceVariant(cradle,fresh),null);
  // The same clue words and items are reachable whichever option was taken.
  assert.deepEqual(Object.keys(kiss.byChoice.lastDance).sort(),['eli','prince']);
});

test('the recap lists the choices that were made', () => {
  const state=solveThrough({...initialState(),started:true},rooms.length);
  choose(state,'lastDance','prince');choose(state,'tobyHeart','take');
  state.inventory.push('blueprint');
  assert.equal(chooseEnding(state,'dawn'),true);
  const recap=journeyRecap(state);
  assert.equal(recap.choices.length,2);
  assert.match(recap.choices.join(''),/接受王子的邀舞/);assert.match(recap.choices.join(''),/帶走托比的心臟/);
});

test('catch-up acts never block an older journey, but a fresh one still clears them in order', () => {
  // A journey from the five-act world: library cleared, standing at the mine.
  const mine=at('mine'),old=restoreState(remapV1({version:1,started:true,room:1,solved:[0],inventory:['watch']}));
  assert.deepEqual(old.skipped,[at('ballroom'),at('hunter')]);
  assert.equal(old.unlocked,mine,'the mine is open straight away');
  assert.equal(old.room,mine);
  assert.equal(travel(old,at('ballroom')),true,'the skipped act can still be visited');
  // Solving a skipped act removes it from the list and never lowers how far the journey has come.
  travel(old,at('ballroom'));
  assert.equal(solve(old,rooms[at('ballroom')].answer).ok,true);
  assert.deepEqual(old.skipped,[at('hunter')]);
  assert.equal(old.unlocked,mine);
  // A fresh journey cannot reach the mine before the two new acts.
  const fresh=solveThrough({...initialState(),started:true},1);
  assert.equal(fresh.unlocked,1);
  assert.equal(travel(fresh,mine),false);
  // A save that claims to skip acts it does not qualify for is ignored, so nothing else can be skipped.
  assert.deepEqual(restoreState({...fresh,skipped:[at('mine'),at('mirror'),99,-1]}).skipped,[]);
  // Only the real acts decide whether the ending is open.
  const finish=restoreState(remapV1({version:1,started:true,solved:[0,1,2,3,4]}));
  assert.equal(journeyComplete(finish),true);
  assert.equal(finish.ending,null);
  assert.equal(journeyComplete(solveThrough({...initialState(),started:true},rooms.length-1)),false);
});

test('a v2 save written before the new acts keeps its progress', () => {
  const ids=['library','mine','crypt'];
  const loaded=fromSaveV2({version:2,chapter:'crypt',solved:ids.slice(0,2),unlocked:ids,puzzles:['library','mine'],inventory:['watch','valve']});
  assert.deepEqual(loaded.state.solved,[0,at('mine')]);
  assert.equal(loaded.state.room,at('crypt'));
  assert.deepEqual(loaded.puzzles,['library','mine']);
  const text=exportSave(loaded.state,loaded.puzzles);
  assert.deepEqual(parseSave(text).state.solved,[0,at('mine')]);
});

test('the mirror light path has exactly one solution and does not start solved', () => {
  const solved=[];
  for(let n=0;n<1<<mirrors.length;n++){const state=mirrors.map((_,i)=>(n>>i)&1);if(lightSolved(state))solved.push(state);}
  assert.deepEqual(solved,[solution]);
  assert.equal(lightSolved(startState),false);
  const {cells,exit}=traceBeam(solution);
  assert.deepEqual(exit,{row:1,col:COLS,side:'right'});
  assert.ok(cells.every(([r,c])=>r>=0&&r<ROWS&&c>=0&&c<COLS));
  // Every mirror cell the beam crosses is one of the four, and no beam loops forever.
  for(let n=0;n<1<<mirrors.length;n++)assert.ok(traceBeam(mirrors.map((_,i)=>(n>>i)&1)).exit,'beam must always leave the grid');
});

test('views: every spot names an existing view, and each view has something to find', () => {
  for(const room of rooms){
    const ids=(room.views||[{id:'main'}]).map(v=>v.id);
    assert.equal(new Set(ids).size,ids.length);
    for(const spot of room.spots)assert.ok(!spot.view||ids.includes(spot.view),room.id+'/'+spot.id);
    for(const view of room.views||[]){
      assert.ok(existsSync(new URL('../games/blood-mirror/assets/'+view.image,import.meta.url)),view.image);
      const spots=room.spots.filter(spot=>(spot.view||ids[0])===view.id&&!spot.lock);
      assert.ok(spots.length>=1,room.id+' view '+view.id+' is empty');
    }
    // The seal and the evidence stay in the arrival view, so the guide never points into a hidden image.
    const arrival=(room.views||[{id:'x'}])[0].id;
    for(const spot of room.spots.filter(s=>s.lock||s.id===room.evidence))assert.ok(!spot.view||spot.view===arrival,room.id+'/'+spot.id);
  }
  assert.deepEqual(rooms[at('ballroom')].views.map(v=>v.id),['ballroom','hall','balcony']);
  assert.deepEqual(rooms[at('hunter')].views.map(v=>v.id),['cabin','path']);
});

test('portraits: every spot that shows one points at a shipped image', () => {
  const names=['eli','orion','nyla','heso','lucy','hunter','vera','mirror'];
  for(const name of names)assert.ok(existsSync(new URL('../games/blood-mirror/assets/portraits/'+name+'.webp',import.meta.url)),name);
  const used=rooms.flatMap(room=>room.spots.filter(spot=>spot.portrait).map(spot=>[room.id+'/'+spot.id,spot.portrait]));
  assert.ok(used.length>=10);
  for(const [where,name] of used)assert.ok(names.includes(name),where+' uses unknown portrait '+name);
  assert.equal(new Set(used.map(([,name])=>name)).size,7,'seven characters appear in spots; the mirror speaks in the seals');
});
