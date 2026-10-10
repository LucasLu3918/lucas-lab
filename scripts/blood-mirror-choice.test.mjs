import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restoreState,rooms,inspect,collect,solve,travel,chooseEnding,validAnswers,queenResponses,unlockText} from '../games/blood-mirror/engine.js';
import {journeyRecap} from '../games/blood-mirror/journey.js';

const queen=rooms.findIndex(r=>r.free);
const combos=[];for(const a of ['yes','no'])for(const b of ['sacrifice','third'])for(const c of ['yes','no'])combos.push([a,b,c]);
function reachQueen(){const s=initialState();for(let i=0;i<queen;i++){travel(s,i);const r=rooms[i];if(r.requires){const spot=r.spots.find(p=>p.item===r.requires);inspect(s,spot.id);collect(s,spot.id);}solve(s,r.answer);}travel(s,queen);return s;}
function finishFrom(s){for(let i=queen+1;i<rooms.length;i++){travel(s,i);solve(s,rooms[i].answer);}return s;}

test('all eight answer combinations open the seal, are remembered and draw distinct responses',()=>{
 const seen=new Set();
 for(const combo of combos){
  const s=reachQueen();assert.equal(solve(s,combo).ok,false,'needle still required');
  inspect(s,'needle');collect(s,'needle');
  assert.equal(solve(s,combo).ok,true,combo.join());assert.deepEqual(s.answers,combo);
  const lines=queenResponses(s.answers);assert.equal(lines.length,3);assert.ok(lines.every(Boolean));seen.add(lines.join('|'));
  assert.match(unlockText(s,queen),JSON.stringify(combo)===JSON.stringify(rooms[queen].answer)?/一模一樣/:/不同/);
  assert.match(unlockText(s,queen),/伊蓮/);
  finishFrom(s);for(const e of ['dawn','frost','crown'])assert.equal(chooseEnding(s,e),true,'endings unchanged for '+combo);
 }
 assert.equal(seen.size,8);
});

test('malformed replies are rejected and other seals keep their fixed answers',()=>{
 const s=reachQueen();inspect(s,'needle');collect(s,'needle');
 for(const bad of [[],['no','third'],['no','third','maybe'],['third','no','yes'],'no',null,['no','third','yes','extra']])assert.equal(solve(s,bad).ok,false,JSON.stringify(bad));
 assert.equal(validAnswers(['yes','sacrifice','no']),true);
 assert.ok(rooms.filter(r=>r.free).length===1);
 const t=initialState();inspect(t,'watch');collect(t,'watch');assert.equal(solve(t,'0000').ok,false);
});

test('answers survive saves only once the queen act is solved, and old saves keep the original text',()=>{
 const s=reachQueen();inspect(s,'needle');collect(s,'needle');solve(s,['yes','sacrifice','no']);
 assert.deepEqual(restoreState(JSON.stringify(s)).answers,['yes','sacrifice','no']);
 assert.equal(restoreState(JSON.stringify({...s,solved:[0,1],answers:['yes','sacrifice','no']})).answers,null);
 assert.equal(restoreState(JSON.stringify({...s,answers:['bogus']})).answers,null);
 const legacy={...s};delete legacy.answers;const old=restoreState(JSON.stringify(legacy));
 assert.equal(old.answers,null);assert.equal(unlockText(old,queen),rooms[queen].unlock);
});

test('the ending recap sets what the player told the queen against the ending',()=>{
 const s=finishFrom((()=>{const q=reachQueen();inspect(q,'needle');collect(q,'needle');solve(q,['no','sacrifice','no']);return q;})());
 chooseEnding(s,'crown');assert.match(journeyRecap(s).answers.join(''),/不想成為女王，最後卻戴上了王冠/);assert.match(journeyRecap(s).answers.join(''),/需要被記住/);
 chooseEnding(s,'frost');assert.match(journeyRecap(s).answers.join(''),/北方七座城市/);
 chooseEnding(s,'dawn');assert.equal(journeyRecap(s).answers.length,2);
 const old={...s,answers:null};assert.deepEqual(journeyRecap(old).answers,[]);
});
