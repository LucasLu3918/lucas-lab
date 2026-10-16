// The shut stages of the 帳本的背面 levels (鏡淵) carry candle-light hints too: three distinct tiers each, and the last tier
// names every stage or level the player must finish first, using the labels and titles the game really shows.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {abyss} from '../games/blood-mirror/data/abyss.js';
import {puzzles} from '../games/blood-mirror/puzzles/index.js';

const stageOf=(chapter,id)=>puzzles[chapter].stages.find(stage=>stage.id===id);
const titleOf=puzzleId=>abyss.levels.find(level=>level.puzzle===puzzleId)?.title;
const shutStages=()=>Object.entries(puzzles).filter(([,entry])=>entry.optional).flatMap(([chapter,entry])=>
 entry.stages.filter(stage=>stage.requires||stage.after).map(stage=>({chapter,stage,needs:[].concat(stage.requires||[]),after:stage.after||[]})));

test('every shut stage of the 帳本 levels carries three distinct candle tiers, and open stages carry none',()=>{
 const shut=shutStages();
 assert.ok(shut.length>=16,'expected the shut stages of E1-E9 and 影戲小屋, found '+shut.length);
 for(const {chapter,stage} of shut){
  const where=chapter+'.'+stage.id;
  assert.equal(stage.locked?.length,3,where);
  assert.equal(new Set(stage.locked).size,3,where+' tiers differ');
  for(const tier of stage.locked)assert.ok(tier.length>=20&&!/「\s*」/.test(tier),where+': '+tier);
 }
 for(const [chapter,entry] of Object.entries(puzzles)){
  if(!entry.optional)continue;
  for(const stage of entry.stages)if(!stage.requires&&!stage.after)assert.equal(stage.locked,undefined,chapter+'.'+stage.id+' opens at once');
 }
});

test('the last tier of every shut stage names each level and each stage it waits for',()=>{
 for(const {chapter,stage,needs,after} of shutStages()){
  const route=stage.locked[2],where=chapter+'.'+stage.id;
  for(const puzzleId of needs)assert.ok(route.includes(titleOf(puzzleId)),where+' names '+titleOf(puzzleId));
  for(const id of after)assert.ok(route.includes(stageOf(chapter,id).label),where+' names '+stageOf(chapter,id).label);
 }
});

test('E9 route tiers name the four levels that hold the marks, and each ring names its own two marks',()=>{
 for(const id of ['compass-inner','compass-outer'])for(const title of ['影戲小屋','失聲合唱廳','稱量廳','凝結的三刻'])assert.ok(stageOf('compass',id).locked[2].includes(title),id+' names '+title);
 assert.ok(stageOf('compass','compass-inner').locked[0].includes('影')&&stageOf('compass','compass-inner').locked[0].includes('音'));
 assert.ok(stageOf('compass','compass-outer').locked[0].includes('重')&&stageOf('compass','compass-outer').locked[0].includes('時'));
});

test('the 帳本 levels run without the act hint panel, which reads the room the player is in',()=>{
 const src=fs.readFileSync(new URL('../games/blood-mirror/abyss.js',import.meta.url),'utf8');
 assert.ok(src.includes('extra:null'),'abyss.js must pass extra:null to startPuzzle');
});
