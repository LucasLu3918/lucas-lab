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
 assert.equal(save.chapter,'mine');
 assert.deepEqual(save.solved,['library','mine']);
 assert.deepEqual(save.unlocked,['library','mine','crypt']);
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
 assert.equal(loaded.state.unlocked,1);
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
 const legacy=progressThrough(2);
 const store=storage({[LEGACY_SAVE_KEY]:JSON.stringify({...legacy,version:1}),[LEGACY_PUZZLE_KEY]:JSON.stringify(['library','bogus'])});
 const loaded=loadSave(store);
 assert.equal(loaded.migrated,true);
 assert.deepEqual(loaded.state.solved,[0,1]);
 assert.equal(loaded.state.room,1);
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
