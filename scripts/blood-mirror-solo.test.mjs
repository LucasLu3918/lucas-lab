import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,rooms,inspect,collect,solve,travel,chooseEnding,visibleSpots} from '../games/blood-mirror/engine.js';
import {journeyGuide,journalChapters} from '../games/blood-mirror/journey.js';
import {summarizePlaylog,createPlaylog} from '../games/blood-mirror/playlog.js';

// A lone player who only ever presses the in-game "next step" button must reach
// the final choice: no dead ends, no step that needs outside help.
function followGuide(state,restored){
 for(let step=0;step<200;step++){
  const room=rooms[state.room],next=journeyGuide(state,restored.has(room.id)).next;
  if(next.kind==='fate'||next.kind==='ending')return {next,step};
  if(next.kind==='travel'){assert.equal(travel(state,next.room),true);continue;}
  if(next.kind==='puzzle'){assert.ok(!room.evidence||restored.has(room.id),'seal offered before evidence in '+room.id);assert.equal(solve(state,room.answer).ok,true,room.id);continue;}
  assert.equal(next.kind,'spot');
  const spot=inspect(state,next.spot);assert.ok(spot,'guide pointed to a hidden spot '+next.spot);
  if(spot.id===room.evidence&&!restored.has(room.id)){restored.add(room.id);continue;}
  if(spot.item)assert.equal(collect(state,spot.id),true);
 }
 assert.fail('guide looped without finishing');
}

test('following only the next-step guide finishes every act and unlocks every ending',()=>{
 const state=initialState(),restored=new Set();
 const {next,step}=followGuide(state,restored);
 assert.equal(next.kind,'fate');assert.deepEqual(state.solved,[0,1,2,3,4]);assert.ok(step<60,'too many steps: '+step);
 assert.deepEqual([...restored].sort(),rooms.map(r=>r.id).sort());
 for(const room of rooms)for(const spot of visibleSpots(state,rooms.indexOf(room)).filter(s=>!s.lock))assert.ok(state.seen.includes(spot.id),'guide skipped '+spot.id);
 for(const id of ['dawn','frost','crown'])assert.equal(chooseEnding(state,id),true,id);
});

test('every act ships the solo safety net: evidence, gate copy, three hints, reachable items',()=>{
 for(const [index,room] of rooms.entries()){
  const evidence=room.spots.find(spot=>spot.id===room.evidence);
  assert.ok(evidence&&evidence.restoredText&&!evidence.after,'evidence '+room.id);
  assert.ok(room.evidenceButton&&room.evidenceGate,'evidence copy '+room.id);
  assert.equal(room.hints.length,3,'hints '+room.id);
  if(room.requires)assert.ok(room.spots.some(spot=>spot.item===room.requires&&!spot.after),'required item hidden in '+room.id);
  assert.equal(room.spots.filter(spot=>spot.lock).length,1,'seal '+room.id);
  for(const spot of room.spots.filter(spot=>spot.after))assert.ok(index<rooms.length-1||!spot.item,'final act aftermath would block the choice');
 }
});

test('the key fact of each act stays hidden until its evidence is restored',()=>{
 const spoilers={library:'七十三',mine:null,crypt:'每一次心跳之後',queen:'我不想成為女王',mirror:'失蹤的公主'};
 for(const room of rooms){
  const word=spoilers[room.id];if(!word)continue;
  const early=room.spots.filter(spot=>!spot.after).map(spot=>spot.text).join('\n')+room.intro+room.objective;
  assert.ok(!early.includes(word),room.id+' leaks '+word);
  assert.ok(room.spots.find(spot=>spot.id===room.evidence).restoredText.includes(word),room.id+' restored text');
 }
});

test('the journal swaps in restored text only for the restored room',()=>{
 const state=initialState();state.solved=[0,1,2];state.unlocked=3;state.room=3;
 for(const id of ['birth','pipes','coffin','letter'])state.seen.push(id);
 const sections=journalChapters(state,id=>id==='queen');
 const text=id=>sections.flatMap(s=>s.entries).find(e=>e.id===id).text;
 assert.match(text('letter'),/我不想成為女王/);assert.doesNotMatch(text('coffin'),/每一次心跳之後/);
});

test('solo playtest log is opt-in, local, bounded and summarised per act',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 const log=createPlaylog(storage);log.record('spot',{room:0});assert.equal(log.events.length,0);assert.equal(store.size,0);
 log.setEnabled(true);log.record('room',{room:0});log.record('unknown',{room:0});
 for(let i=0;i<2100;i++)log.record('spot',{room:0});assert.equal(log.events.length,2000);
 assert.equal(createPlaylog(storage).enabled,true);log.setEnabled(false);assert.equal(store.size,0);
 const t=0,events=[{t,kind:'room',room:0},{t:30000,kind:'restore-start',room:0},{t:90000,kind:'restore-done',room:0},{t:100000,kind:'seal-fail',room:0},{t:110000,kind:'hint',room:0,level:2},{t:120000,kind:'seal-ok',room:0},{t:130000,kind:'room',room:1},{t:'bad',kind:'spot',room:1},{kind:'spot',room:9,t:1}];
 const [first,second]=summarizePlaylog(events,rooms.map(r=>r.title));
 assert.deepEqual(first,{index:0,title:'黑鐘書庫',minutes:2,spots:0,restoreMinutes:1,fails:1,hint:2,solved:true});
 assert.equal(second.solved,false);assert.equal(second.minutes,null);
 assert.deepEqual(summarizePlaylog(null,['a']),[]);
});
