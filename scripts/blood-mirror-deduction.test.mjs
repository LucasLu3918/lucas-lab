import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,rooms,inspect,collect,solve,travel,judgeInterrogation,restoreClues,collectShard,markGlow,shardIds,PROLOGUE_SHARD,unlockAchievements,achievements,toSaveV2,fromSaveV2,exportSave,parseSave,clueWords} from '../games/blood-mirror/engine/index.js';
import {hintFill,interrogationNotice,interrogationPage} from '../games/blood-mirror/puzzles/interrogation.js';
import {lullaby} from '../games/blood-mirror/puzzles/musicbox.js';
import {endings} from '../games/blood-mirror/data/endings.js';
import {secretEpilogue} from '../games/blood-mirror/data/secret-epilogue.js';

const at=id=>rooms.findIndex(room=>room.id===id);
const mirror=rooms[at('mirror')];
const spec=mirror.interrogation;
const correct=[...mirror.answer];

// Solves the first four acts (queen answered with the given reply) and stands in the mirror act.
function reachMirror(queenAnswer=rooms[at('queen')].answer){
 const s=initialState();s.started=true;
 for(let i=0;i<at('mirror');i++){
  travel(s,i);const r=rooms[i];
  if(r.requires){const spot=r.spots.find(p=>p.item===r.requires);inspect(s,spot.id);collect(s,spot.id);}
  solve(s,r.id==='queen'?queenAnswer:r.answer);
 }
 travel(s,at('mirror'));
 return s;
}

test('the interrogation accepts the full statement and either order of the rejected pair',()=>{
 assert.deepEqual(judgeInterrogation(spec,correct),{ok:true,wrong:[]});
 const swapped=[...correct];[swapped[1],swapped[2]]=[swapped[2],swapped[1]];
 assert.deepEqual(judgeInterrogation(spec,swapped),{ok:true,wrong:[]});
});

test('wrong blanks are counted by index, and malformed answers are wrong everywhere',()=>{
 const one=[...correct];one[3]='throne';
 assert.deepEqual(judgeInterrogation(spec,one).wrong,[3]);
 const two=[...correct];two[3]='throne';two[4]='remembered';
 assert.deepEqual(judgeInterrogation(spec,two).wrong,[3,4]);
 const many=['prince','blood','heir','throne','remembered'];
 assert.equal(judgeInterrogation(spec,many).wrong.length,5);
 assert.equal(judgeInterrogation(spec,correct.slice(1)).ok,false);
 assert.deepEqual(judgeInterrogation(spec,[null,null,null,null,null]).wrong,[0,1,2,3,4]);
});

test('a duplicated word cannot fill both rejected blanks',()=>{
 const dup=[...correct];dup[2]='queen';
 assert.deepEqual(judgeInterrogation(spec,dup).wrong,[2]);
});

test('wrong seals count as misses, and only the full statement opens the mirror',()=>{
 const s=reachMirror();
 const one=[...correct];one[3]='throne';
 assert.equal(solve(s,one).ok,false);assert.equal(s.misses[at('mirror')],1);
 assert.equal(s.solved.includes(at('mirror')),false);
 assert.equal(solve(s,correct).ok,true);assert.ok(s.solved.includes(at('mirror')));
});

test('the clue notebook fills from the scene; the heir word waits for the restored manuscript',()=>{
 const s=initialState();s.room=at('mirror');
 inspect(s,'witness');
 assert.deepEqual([...s.clues].sort(),['blood','forgotten']);
 assert.equal(s.clues.includes('heir'),false);
 assert.deepEqual(restoreClues(s,'witness'),['heir']);
 assert.deepEqual(restoreClues(s,'witness'),[]);
 inspect(s,'lucy');
 for(const word of ['queen','prince','throne'])assert.ok(s.clues.includes(word),word);
 inspect(s,'heatplan');assert.ok(s.clues.includes('remembered'));
});

test('a hint fills one blank at a time, from the words the statement needs',()=>{
 assert.deepEqual(hintFill(spec,[null,null,null,null,null]),{index:0,word:'heir'});
 assert.equal(hintFill(spec,correct),null);
 const partly=['heir','queen','queen','blood','forgotten'];
 assert.deepEqual(hintFill(spec,partly),{index:2,word:'prince'});
});

test('the interrogation page lists only gathered words and never names an unfilled blank',()=>{
 const html=interrogationPage({spec,words:['heir'],answers:[null,null,null,null,null],selected:0,story:false});
 assert.match(html,/失蹤的公主/);
 assert.doesNotMatch(html,/王室血脈|遺忘/);
 assert.match(html,/data-blank="0"[^>]*aria-pressed="true"/);
 assert.doesNotMatch(html,/class="interrogation-blank[^"]*wrong/);
 const marked=interrogationPage({spec,words:['heir'],answers:['heir',null,null,null,null],selected:1,story:true,wrong:[1]});
 assert.match(marked,/data-blank="1" aria-pressed="true"|interrogation-blank selected wrong/);
 assert.match(marked,/class="interrogation-blank selected wrong"/);
 assert.doesNotMatch(interrogationPage({spec,words:['heir'],answers:['heir',null,null,null,null],selected:1,story:false,wrong:[1]}),/ wrong"/);
});

test('judgement feedback names only a count, never a blank',()=>{
 assert.equal(interrogationNotice(0,false),'');
 assert.equal(interrogationNotice(1,false),'還有一個謊言。');
 assert.equal(interrogationNotice(2,false),'還有兩個謊言。');
 assert.equal(interrogationNotice(4,false),'妳的陳述仍被謊言包圍。');
 assert.match(interrogationNotice(2,true),/標記的格子/);
});

test('shards are collected once, persist into a new journey, and never enter the notebook',()=>{
 const s=initialState();s.room=at('mirror');
 inspect(s,'shard-mirror');inspect(s,'shard-mirror');
 assert.deepEqual(s.shards,['shard-mirror']);
 assert.deepEqual(s.clues,[]);
 const nextJourney={...initialState(),shards:[...s.shards]};
 assert.deepEqual(nextJourney.shards,['shard-mirror']);
 assert.equal(collectShard(s,PROLOGUE_SHARD),true);
 assert.equal(collectShard(s,'not-a-shard'),false);
});

test('every act ships one shard, and the prologue adds one more',()=>{
 for(const room of rooms)assert.equal(room.spots.filter(spot=>spot.shard).length,1,room.id);
 assert.equal(shardIds.length,rooms.length+1);
 assert.equal(new Set(shardIds).size,shardIds.length);
});

test('new save fields round trip, and saves without them restore to empty collections',()=>{
 const s=reachMirror();
 s.clues=['blood'];s.shards=['shard-mirror'];s.achievements=['first-seal'];s.glowRooms=[0];s.misses[at('mirror')]=2;
 const loaded=fromSaveV2(JSON.parse(JSON.stringify(toSaveV2(s,['prologue','library']))));
 assert.deepEqual(loaded.state.clues,['blood']);
 assert.deepEqual(loaded.state.shards,['shard-mirror']);
 assert.deepEqual(loaded.state.achievements,['first-seal']);
 assert.deepEqual(loaded.state.glowRooms,[0]);
 assert.equal(loaded.state.misses[at('mirror')],2);
 assert.deepEqual([...loaded.puzzles].sort(),['library','prologue']);
 const legacy=JSON.parse(JSON.stringify(toSaveV2(initialState(),[])));
 for(const key of ['clues','shards','achievements','glowRooms','misses'])delete legacy[key];
 const old=fromSaveV2(legacy).state;
 assert.deepEqual([old.clues,old.shards,old.achievements,old.glowRooms],[[],[],[],[]]);
 assert.equal(old.misses[at('mirror')],0);
 assert.deepEqual(parseSave(exportSave(s,['prologue'])).state.shards,['shard-mirror']);
});

test('invalid collection entries are dropped on restore',()=>{
 const raw={...toSaveV2(initialState(),[]),clues:['blood','not-a-clue'],shards:['shard-mirror','shard-fake'],achievements:['first-seal','fake'],glowRooms:['library','nope']};
 const restored=fromSaveV2(raw).state;
 assert.deepEqual(restored.clues,['blood']);
 assert.deepEqual(restored.shards,['shard-mirror']);
 assert.deepEqual(restored.achievements,['first-seal']);
 assert.deepEqual(restored.glowRooms,[0]);
});

test('achievements unlock from progress once and are never revoked',()=>{
 const s=initialState();s.started=true;
 assert.deepEqual(unlockAchievements(s,[]),[]);
 inspect(s,'watch');collect(s,'watch');solve(s,rooms[0].answer);
 const fresh=unlockAchievements(s,[]).map(item=>item.id);
 for(const id of ['first-seal','no-candle-library','no-hint'])assert.ok(fresh.includes(id),id);
 assert.deepEqual(unlockAchievements(s,[]),[]);
 assert.equal(s.achievements.includes('perfect-mirror'),false);
});

test('using candle light in an act forfeits the candle-free achievement',()=>{
 const s=initialState();s.started=true;
 markGlow(s);
 inspect(s,'watch');collect(s,'watch');solve(s,rooms[0].answer);
 assert.equal(unlockAchievements(s,[]).some(item=>item.id==='no-candle-library'),false);
});

test('a flawless mirror seal earns the perfect interrogation, a miss does not',()=>{
 const clean=reachMirror();solve(clean,correct);
 assert.ok(unlockAchievements(clean,[]).some(item=>item.id==='perfect-mirror'));
 const slipped=reachMirror();solve(slipped,['heir']);solve(slipped,correct);
 assert.equal(unlockAchievements(slipped,[]).some(item=>item.id==='perfect-mirror'),false);
});

test('answering the queen in one’s own words earns its achievement',()=>{
 const own=reachMirror(['yes','sacrifice','no']);
 assert.ok(own.answers);
 assert.ok(unlockAchievements(own,[]).some(item=>item.id==='own-words'));
 const canonical=reachMirror();
 assert.equal(unlockAchievements(canonical,[]).some(item=>item.id==='own-words'),false);
});

test('there are twelve achievements, each with a unique id and copy',()=>{
 assert.equal(achievements.length,12);
 assert.equal(new Set(achievements.map(item=>item.id)).size,12);
 for(const item of achievements)assert.ok(item.title&&item.text,item.id);
});

test('clue words, shards and interrogation blanks all refer to catalogued content',()=>{
 for(const room of rooms)for(const spot of room.spots){
  for(const word of [...(spot.clues||[]),...(spot.restoredClues||[])])assert.ok(clueWords[word],room.id+'/'+spot.id+' '+word);
 }
 for(const blank of spec.blanks)assert.ok(clueWords[blank.answer],blank.answer);
 assert.deepEqual(mirror.answer,spec.blanks.map(blank=>blank.answer));
 assert.deepEqual(spec.template.filter(part=>typeof part==='number'),[0,1,2,3,4]);
 const ids=rooms.flatMap(room=>room.spots.map(spot=>spot.id));
 assert.equal(new Set(ids).size,ids.length);
});

test('the lullaby can be matched in three moves from silence',()=>{
 assert.equal(lullaby.filter(Boolean).length,3);
});

test('each ending offers two distinct gestures, and the secret epilogue has text',()=>{
 for(const [id,ending] of Object.entries(endings)){
  assert.equal(ending.epilogue.options.length,2,id);
  assert.notEqual(ending.epilogue.options[0].text,ending.epilogue.options[1].text,id);
 }
 assert.equal(secretEpilogue.scenes.length,2);
});
