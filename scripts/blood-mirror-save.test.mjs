import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,rooms,inspect,collect,solve,travel,toSaveV2,fromSaveV2,loadSave,writeSave,SAVE_KEY,LEGACY_SAVE_KEY,LEGACY_PUZZLE_KEY} from '../games/blood-mirror/engine/index.js';

// A minimal in-memory localStorage, so the tests need no browser.
const storage=(entries={})=>{const data=new Map(Object.entries(entries));return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),has:k=>data.has(k),raw:k=>data.get(k)};};

function progressThrough(count){
 const state={...initialState(),started:true};
 for(let i=0;i<count;i++){
  travel(state,i);const room=rooms[i];
  if(room.requires){const spot=room.spots.find(s=>s.item===room.requires);inspect(state,spot.id);collect(state,spot.id);}
  solve(state,room.answer);
 }
 return state;
}

test('v2 saves store chapter ids, not indices, and restore to the same progress',()=>{
 const state=progressThrough(2);
 const save=toSaveV2(state,['library']);
 assert.equal(save.version,2);
 assert.equal(save.chapter,'ballroom');
 assert.deepEqual(save.solved,['library','ballroom']);
 assert.deepEqual(save.unlocked,['library','ballroom','hunter']);
 assert.deepEqual(save.puzzles,['library']);
 const loaded=fromSaveV2(JSON.parse(JSON.stringify(save)));
 assert.deepEqual(loaded.state.solved,[0,1]);
 assert.equal(loaded.state.room,1);
 assert.equal(loaded.state.unlocked,2);
 assert.deepEqual(loaded.puzzles,['library']);
});

test('v2 loading drops unknown chapters and cannot skip a chapter',()=>{
 const loaded=fromSaveV2({version:2,chapter:'nowhere',solved:['library','queen'],unlocked:['library','ghost'],puzzles:['library','ghost','library']});
 assert.deepEqual(loaded.state.solved,[0]);
 assert.equal(loaded.state.room,0);
 // Library cleared, queen claimed: the two catch-up acts may stay open, the mine is the next real step.
 assert.equal(loaded.state.unlocked,rooms.findIndex(room=>room.id==='mine'));
 assert.deepEqual(loaded.puzzles,['library']);
 assert.equal(fromSaveV2({version:1}),null);
 assert.equal(fromSaveV2(null),null);
});

test('loadSave prefers the current v2 key and writes it back on the next save',()=>{
 const current=progressThrough(1);
 const store=storage({[SAVE_KEY]:JSON.stringify(toSaveV2(current,['library']))});
 const loaded=loadSave(store);
 assert.equal(loaded.migrated,false);
 assert.deepEqual(loaded.state.solved,[0]);
 assert.deepEqual(loaded.puzzles,['library']);
 assert.equal(writeSave(loaded.state,loaded.puzzles,store),true);
 assert.equal(JSON.parse(store.raw(SAVE_KEY)).version,2);
});

test('v1 browser saves migrate once and keep their original keys as a fallback',()=>{
 // A real v1 save counts the five original acts: 0 library, 1 mine. The mine has since moved to index 3.
 const legacy={version:1,started:true,room:1,solved:[0,1],inventory:['watch','valve'],seen:[],hints:{1:2},misses:{},endings:[]};
 const store=storage({[LEGACY_SAVE_KEY]:JSON.stringify(legacy),[LEGACY_PUZZLE_KEY]:JSON.stringify(['library','bogus'])});
 const loaded=loadSave(store);
 const mine=rooms.findIndex(room=>room.id==='mine');
 assert.equal(loaded.migrated,true);
 assert.deepEqual(loaded.state.solved,[0,mine],'the two new acts stay open to catch up on');
 assert.equal(loaded.state.room,mine);
 assert.equal(loaded.state.hints[mine],2,'per-act values follow the act, not the old index');
 assert.deepEqual(loaded.puzzles,['library']);
 assert.equal(store.has(LEGACY_SAVE_KEY),true,'v1 key must not be deleted');
 assert.equal(store.has(LEGACY_PUZZLE_KEY),true,'v1 puzzle key must not be deleted');
});

test('a corrupt v2 save falls back to v1 data instead of losing the journey',()=>{
 const legacy=progressThrough(1);
 const store=storage({[SAVE_KEY]:'{broken',[LEGACY_SAVE_KEY]:JSON.stringify({...legacy,version:1})});
 const loaded=loadSave(store);
 assert.deepEqual(loaded.state.solved,[0]);
 assert.equal(loaded.migrated,true);
});

test('no storage at all still starts a fresh journey',()=>{
 const loaded=loadSave(storage());
 assert.deepEqual(loaded.state,initialState());
 assert.deepEqual(loaded.puzzles,[]);
 assert.equal(loadSave(null).state.started,false);
 assert.equal(writeSave(initialState(),[],null),false);
});

test('finished stages and per-step hints survive a save; unknown ones are dropped (r1, r8)',()=>{
 const state={...initialState(),started:true,stepHints:{'mine.names':2,'library.seal':1}};
 const saved=toSaveV2(state,['library','mine.names','hunter.runeheart','mine.ghost','prologue']);
 assert.deepEqual(saved.puzzles,['library','mine.names','prologue'],'single-stage acts and unknown stages are not stored as stages');
 assert.deepEqual(saved.stepHints,{'mine.names':2,'library.seal':1});
 const loaded=fromSaveV2({...saved,stepHints:{...saved.stepHints,'mine.ghost':1,'crypt.rune':7,'crypt.rubbing':'2'}});
 assert.deepEqual(loaded.puzzles,['library','mine.names','prologue']);
 assert.deepEqual(loaded.state.stepHints,{'mine.names':2,'library.seal':1});
 assert.deepEqual(fromSaveV2({version:2}).state.stepHints,{},'older saves without stepHints restore empty');
});
