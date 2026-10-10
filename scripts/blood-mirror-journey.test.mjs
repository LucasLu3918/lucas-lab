import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,rooms,collect,inspect,solve,travel,restoreState,chooseEnding,visibleSpots} from '../games/blood-mirror/engine.js';
import {journeyGuide,journalChapters,spotText} from '../games/blood-mirror/journey.js';

test('guidance distinguishes viewing from collecting and does not reveal answers',()=>{
 const state=initialState();
 assert.equal(journeyGuide(state).next.spot,'watch');
 inspect(state,'watch');assert.match(journeyGuide(state).next.text,/還未收取/);
 collect(state,'watch');assert.equal(journeyGuide(state).next.spot,'bells');
 inspect(state,'bells');inspect(state,'birth');
 assert.equal(journeyGuide(state).next.spot,'birth');assert.equal(journeyGuide(state).next.label,'拼回帳頁');
 assert.equal(journeyGuide(state).discovered,3);assert.equal(journeyGuide(state).total,3);
 assert.equal(journeyGuide(state,true).next.kind,'puzzle');assert.equal(journeyGuide(state,true).next.label,'解開封印');
 assert.ok(!journeyGuide(state,true).next.text.includes(rooms[0].answer));
 const before=JSON.stringify(state);journeyGuide(state);journalChapters(state);assert.equal(JSON.stringify(state),before);
});

test('old saves resume solved chapters, missing items and the final choice correctly',()=>{
 const state=initialState();collect(state,'watch');solve(state,rooms[0].answer);
 let restored=restoreState(JSON.stringify(state));assert.equal(journeyGuide(restored).next.spot,'contract');
 collect(restored,'contract');assert.equal(journeyGuide(restored).next.room,1);
 travel(restored,1);assert.equal(journeyGuide(restored).next.spot,'valve');
 for(let i=1;i<rooms.length;i++){travel(restored,i);const room=rooms[i];if(room.requires)collect(restored,room.spots.find(spot=>spot.item===room.requires).id);solve(restored,room.answer);}
 assert.equal(journeyGuide(restored).next.kind,'fate');
 chooseEnding(restored,'dawn');assert.equal(journeyGuide(restored).next.kind,'ending');
 assert.equal(journeyGuide(restored).endingTitle,'春天沒有記住她');
});

test('journal includes accessible chapters without leaking unseen clues or locked rooms',()=>{
 const state=initialState();assert.equal(journalChapters(state).length,1);
 inspect(state,'birth');const sections=journalChapters(state);
 assert.deepEqual(sections[0].entries.map(spot=>spot.id),['birth']);
 collect(state,'watch');solve(state,rooms[0].answer);travel(state,1);
 assert.equal(journalChapters(state).length,2);
 assert.equal(journalChapters(state)[1].entries.length,0);
});

test('library evidence must be restored before the missing digits can be read',()=>{
 const state=initialState();
 for(const spot of rooms[0].spots.filter(spot=>!spot.after))assert.ok(!spot.text.includes('七十三'),spot.id);
 assert.ok(!rooms[0].intro.includes('七十三'));
 inspect(state,'birth');
 assert.ok(!journalChapters(state)[0].entries[0].text.includes('七十三'));
 assert.ok(journalChapters(state,id=>id==='library')[0].entries[0].text.includes('七十三'));
 assert.equal(spotText(rooms[0].spots.find(spot=>spot.id==='bells'),true),rooms[0].spots.find(spot=>spot.id==='bells').text);
});

test('the opened seal reveals the contract and the father signature only afterwards',()=>{
 const state=initialState();
 assert.ok(!visibleSpots(state).some(spot=>spot.id==='contract'));
 assert.equal(inspect(state,'contract'),null);assert.equal(collect(state,'contract'),false);
 for(const spot of rooms[0].spots.filter(spot=>!spot.after))assert.ok(!spot.text.includes('父親'),spot.id);
 assert.ok(!rooms[0].unlock.includes('父親'));
 collect(state,'watch');solve(state,rooms[0].answer);
 assert.ok(visibleSpots(state).some(spot=>spot.id==='contract'));
 assert.equal(journeyGuide(state).total,4);
 assert.equal(journeyGuide(state).next.spot,'contract');
 inspect(state,'contract');assert.match(journeyGuide(state).next.text,/還未收取/);
 assert.equal(collect(state,'contract'),true);assert.ok(state.inventory.includes('contract'));
 assert.equal(journeyGuide(state).next.kind,'travel');
 const restored=restoreState(JSON.stringify(state));assert.ok(restored.inventory.includes('contract'));assert.ok(restored.seen.includes('contract'));
});

test('the prologue no longer gives away the code or the signature',async()=>{
 const {readFileSync}=await import('node:fs');
 const app=readFileSync(new URL('../games/blood-mirror/app.js',import.meta.url),'utf8');
 const prologue=app.slice(app.indexOf('function openStory'),app.indexOf('function openGuide'));
 for(const spoiler of ['七十三','第十三下','父親'])assert.ok(!prologue.includes(spoiler),spoiler);
});
