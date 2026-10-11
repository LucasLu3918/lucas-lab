// Pre-seal deductions (room.deduction): every blank must be answerable from clues the player can
// collect before the seal opens, and the persisted `deduced` list must survive a save round trip.
import test from 'node:test';
import assert from 'node:assert/strict';
import {rooms,clueWords,judgeInterrogation,initialState,restoreState,toSaveV2,fromSaveV2} from '../games/blood-mirror/engine/index.js';

const gated=rooms.map((room,index)=>({room,index})).filter(({room})=>room.deduction);
const wordsOf=spots=>spots.flatMap(s=>[...(s.clues||[]),...(s.restoredClues||[])]);

test('four acts carry a pre-seal deduction', () => {
  assert.deepEqual(gated.map(({room})=>room.id),['library','mine','crypt','queen']);
});

for(const {room,index} of gated){
  test(`${room.id}: deduction words are collectable before the seal`, () => {
    const reachable=new Set([
      ...wordsOf(room.spots.filter(s=>!s.after&&!s.lock)),
      ...rooms.slice(0,index).flatMap(r=>wordsOf(r.spots))
    ]);
    const {template,blanks}=room.deduction;
    assert.ok(blanks.length>=3&&blanks.length<=6,'3–6 blanks per statement');
    assert.deepEqual(template.filter(part=>typeof part==='number'),blanks.map((_,i)=>i),'template references every blank once, in order');
    for(const blank of blanks){
      assert.ok(clueWords[blank.answer],`unknown word ${blank.answer}`);
      assert.equal(clueWords[blank.answer].group,blank.group);
      assert.ok(reachable.has(blank.answer),`${blank.answer} cannot be collected before the ${room.id} seal`);
    }
    const right=blanks.map(b=>b.answer);
    assert.equal(judgeInterrogation(room.deduction,right).ok,true);
    assert.equal(judgeInterrogation(room.deduction,right.map(()=>'queen')).ok,false);
  });
}

test('library deduction yields the seal digits 13 and 73', () => {
  const words=rooms[0].deduction.blanks.map(b=>b.answer);
  assert.ok(words.includes('thirteenth')&&words.includes('children73'));
  assert.equal(rooms[0].answer,'1373');
});

test('deduced survives a save round trip and ignores acts without a deduction', () => {
  const at=id=>rooms.findIndex(room=>room.id===id);
  const state={...initialState(),started:true,room:at('mine'),unlocked:at('mine'),solved:[0,1,2],deduced:[0,at('mine'),at('mirror'),99]};
  const saved=toSaveV2(state);
  assert.deepEqual(saved.deduced,['library','mine','mirror']);
  const loaded=fromSaveV2(JSON.parse(JSON.stringify(saved))).state;
  assert.deepEqual(loaded.deduced,[0,at('mine')]);
});

test('a save without deduced restores to empty', () => {
  assert.deepEqual(restoreState({version:1,started:true}).deduced,[]);
});
