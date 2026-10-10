import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,rooms,collect,inspect,solve,travel,restoreState,chooseEnding} from '../games/blood-mirror/engine.js';
import {journeyGuide,journalChapters} from '../games/blood-mirror/journey.js';

test('guidance distinguishes viewing from collecting and does not reveal answers',()=>{
 const state=initialState();
 assert.equal(journeyGuide(state).next.spot,'watch');
 inspect(state,'watch');assert.match(journeyGuide(state).next.text,/還未收取/);
 collect(state,'watch');assert.equal(journeyGuide(state).next.spot,'bells');
 inspect(state,'bells');inspect(state,'birth');
 assert.equal(journeyGuide(state).next.kind,'puzzle');
 assert.equal(journeyGuide(state).discovered,3);
 assert.equal(journeyGuide(state,true).next.label,'檢視封印');
 assert.ok(!journeyGuide(state,true).next.text.includes(rooms[0].answer));
 const before=JSON.stringify(state);journeyGuide(state);journalChapters(state);assert.equal(JSON.stringify(state),before);
});

test('old saves resume solved chapters, missing items and the final choice correctly',()=>{
 const state=initialState();collect(state,'watch');solve(state,rooms[0].answer);
 let restored=restoreState(JSON.stringify(state));assert.equal(journeyGuide(restored).next.room,1);
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
