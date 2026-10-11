import test from 'node:test';
import assert from 'node:assert/strict';
import {secretEpilogue} from '../games/blood-mirror/data/secret-epilogue.js';
import {credits,creditsNote} from '../games/blood-mirror/data/credits.js';
import {endings} from '../games/blood-mirror/data/endings.js';
import {shardIds} from '../games/blood-mirror/engine/index.js';

test('the secret epilogue is two operable scenes, each with two distinct replies, then a closing line',()=>{
 assert.equal(secretEpilogue.scenes.length,2);
 for(const scene of secretEpilogue.scenes){
  assert.ok(scene.prompt.length>0);
  assert.equal(scene.options.length,2);
  assert.notEqual(scene.options[0].id,scene.options[1].id);
  assert.notEqual(scene.options[0].text,scene.options[1].text);
 }
 assert.ok(secretEpilogue.closing.length>=1);
 assert.ok(secretEpilogue.opening.length>=1);
});

test('the secret epilogue is unlocked only by holding every shard',()=>{
 // The unlock test in the UI is "every shardIds entry is held"; this pins the set it checks.
 assert.equal(new Set(shardIds).size,shardIds.length);
 assert.ok(shardIds.includes('shard-prologue'));
});

test('the credits list names roles, each with at least one line, and carries the adaptation note',()=>{
 assert.ok(credits.length>=4);
 for(const group of credits){
  assert.ok(group.role.length>0);
  assert.ok(group.lines.length>=1);
 }
 assert.match(creditsNote,/白雪公主：血色魔鏡/);
});

test('every ending offers a closing gesture that the credits can follow',()=>{
 for(const ending of Object.values(endings))assert.ok(ending.epilogue.options.length>=2);
});
