// Content checks for the puzzle roadmap (r1, r6, r8, r10): every act's stages exist in the puzzle registry,
// and the seals combine both stages instead of repeating text the player was handed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {rooms,items} from '../games/blood-mirror/engine/index.js';
import {puzzles,stageLabel} from '../games/blood-mirror/puzzles/index.js';
import {bedAnswer,miners} from '../games/blood-mirror/puzzles/names.js';
import {heartPath} from '../games/blood-mirror/puzzles/runeheart.js';

const byId=id=>rooms.find(room=>room.id===id);

test('chapter stages match the puzzle registry, and every stage has a label (r1, r8)',()=>{
 for(const room of rooms){
  assert.deepEqual(room.stages,puzzles[room.id].stages.map(stage=>stage.id),room.id);
  for(const stage of room.stages)assert.ok(stageLabel(room.id,stage),room.id+'.'+stage);
 }
});

test('stages that need an earlier item name an item from an earlier act (r10)',()=>{
 const needs=Object.values(puzzles).flatMap(entry=>entry.stages.filter(stage=>stage.requires).map(stage=>({chapter:entry.id,...stage})));
 assert.deepEqual(needs.map(n=>n.chapter+':'+n.requires).sort(),['crypt:contract','mirror:watch']);
 for(const need of needs){
  assert.ok(items[need.requires],need.requires);
  const at=rooms.findIndex(room=>room.id===need.chapter);
  const source=rooms.findIndex(room=>room.spots.some(spot=>spot.item===need.requires));
  assert.ok(source>=0&&source<at,need.requires+' comes from an earlier act');
  assert.ok(need.missing,'a blocked stage explains where to look');
 }
});

test('the library inscription no longer spells out the code before the gears are fixed (r6)',()=>{
 const watch=byId('library').spots.find(spot=>spot.id==='watch');
 assert.doesNotMatch(watch.text+items.watch.text,/前兩位|後兩位/);
 assert.match(watch.restoredText,/鐘聲在前，代價在後/);
});

test('the mine seal needs the bed order: the valves are named after the miners (r6)',()=>{
 const mine=byId('mine'),bed=n=>miners[bedAnswer[n-1]];
 assert.deepEqual(mine.answer.map(id=>mine.options.find(option=>option.id===id).label),[bed(1)+'的閥門',bed(4)+'的閥門',bed(7)+'的閥門']);
 assert.match(items.valve.text,/爐火邊第一張床/);
 assert.doesNotMatch(items.valve.text,/先冷水/);
});

test('the crypt seal needs both the heartbeat and the rubbing (r6)',()=>{
 const crypt=byId('crypt');
 assert.deepEqual(crypt.answer,['moon','apple','mirror','name']);
 assert.ok(crypt.options.length>crypt.answer.length,'distractors keep it from being a copy');
 assert.doesNotMatch(items.apple.text,/月亮、蘋果、鏡子/);
 assert.ok(crypt.seal.title&&crypt.seal.prompt&&byId('mine').seal.title);
});

test('the hunter circle hint matches the solved path',()=>{
 const names=['月','鐘','針','鏡','霜','血','門'];
 assert.match(byId('hunter').stepHints.runeheart[2],new RegExp(heartPath.map(i=>names[i]).join(' → ')));
});
