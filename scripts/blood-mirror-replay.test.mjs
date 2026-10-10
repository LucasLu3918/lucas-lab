import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restoreState,rooms,inspect,collect,solve,travel,chooseEnding,visibleSpots,memorySpots} from '../games/blood-mirror/engine.js';
import {journeyGuide,memoryCollection,journeyRecap,journalChapters} from '../games/blood-mirror/journey.js';
import {exportSave,parseSave,MAX_SAVE_BYTES} from '../games/blood-mirror/savefile.js';

function finish(state,{miners=true,contract=true}={}){
 for(let i=0;i<rooms.length;i++){
  travel(state,i);const room=rooms[i];
  if(room.requires){const spot=room.spots.find(s=>s.item===room.requires);inspect(state,spot.id);collect(state,spot.id);}
  solve(state,room.answer);
  if(i===0&&contract){inspect(state,'contract');collect(state,'contract');}
  if(i===1&&miners)inspect(state,'miners');
 }
 return state;
}

test('one memory per act appears only after an ending and never joins the guide or progress',()=>{
 assert.deepEqual(memorySpots.map(s=>s.room),[0,1,2,3,4]);
 const state=finish(initialState());
 assert.equal(visibleSpots(state).some(s=>s.memory),false);
 const before=journeyGuide(state).total;
 chooseEnding(state,'frost');state.ending=null;travel(state,4);
 assert.equal(visibleSpots(state).filter(s=>s.memory).length,1);
 assert.equal(journeyGuide(state).total,before,'memories must not change progress counts');
 assert.notEqual(journeyGuide(state).next.spot,'lucy-mother','guide must not push optional memories');
 assert.ok(journalChapters(state).every(section=>section.entries.every(e=>!e.memory)));
});

test('memories are collected by viewing, survive a save and a new journey, and stay non-spoiling while hidden',()=>{
 const state=finish(initialState());chooseEnding(state,'dawn');state.ending=null;
 travel(state,0);inspect(state,'toby');travel(state,3);inspect(state,'vera');
 assert.deepEqual(state.memories,['toby','vera']);
 const restored=restoreState(JSON.stringify({...state,memories:['toby','vera','fake','toby']}));
 assert.deepEqual(restored.memories,['toby','vera']);
 const next={...initialState(),endings:restored.endings,memories:restored.memories};
 assert.equal(memoryCollection(next).filter(m=>m.found).length,2);
 for(const m of memoryCollection(next).filter(m=>!m.found)){assert.equal(m.text,null);assert.equal(m.label,null);assert.ok(m.title);}
 assert.equal(inspect(next,'toby')?.id,'toby','memories stay visible from the start of a new journey once an ending exists');
 assert.deepEqual(restoreState({version:1}).memories,[]);
});

test('ending recap explains the outcome from what the player actually did',()=>{
 const listened=finish(initialState());chooseEnding(listened,'dawn');
 let recap=journeyRecap(listened);
 assert.match(recap.cause.join(''),/工程藍圖/);assert.match(recap.cause.join(''),/赫索的話/);
 assert.equal(recap.scenes,2);assert.equal(recap.sceneTotal,4);assert.match(recap.next,/另外 2 種代價/);
 const hurried=finish(initialState(),{miners:false,contract:false});chooseEnding(hurried,'frost');
 assert.doesNotMatch(journeyRecap(hurried).cause.join(''),/赫索說過/);
 chooseEnding(listened,'frost');assert.match(journeyRecap(listened).cause.join(''),/赫索說過/);
 chooseEnding(listened,'crown');assert.match(journeyRecap(listened).cause.join(''),/父親簽下的契約/);
 recap=journeyRecap(listened);assert.match(recap.next,/5 段人物記憶/);
 listened.memories=memorySpots.map(s=>s.id);assert.match(journeyRecap(listened).next,/全部真相/);
 assert.equal(journeyRecap(initialState()),null);
});

test('portable saves round-trip and reject foreign, corrupt, oversized or tampered files safely',()=>{
 const state=finish(initialState());chooseEnding(state,'dawn');state.memories=['toby'];
 const text=exportSave(state,['library','mine','bogus']);
 const {state:back,challenges}=parseSave(text);
 assert.deepEqual(back.solved,[0,1,2,3,4]);assert.equal(back.ending,'dawn');assert.deepEqual(back.memories,['toby']);assert.deepEqual(challenges,['library','mine']);
 for(const bad of ['','{oops',JSON.stringify({format:'other',version:1,story:state}),JSON.stringify({format:'blood-mirror-save',version:2,story:state}),'x'.repeat(MAX_SAVE_BYTES+1)])assert.throws(()=>parseSave(bad));
 const tampered=JSON.parse(text);tampered.story.solved=[0,4];tampered.story.room=4;tampered.story.ending='crown';
 const safe=parseSave(JSON.stringify(tampered)).state;
 assert.deepEqual(safe.solved,[0]);assert.equal(safe.room,1);assert.equal(safe.ending,null);
});
