// Dialogue checks (dialogue systems skill): every opening scene names known speakers, every choice-dependent
// line covers each option of a choice made in an earlier act, nothing leaks an act's key fact, and the
// read log is derived from progress in the order the player read it.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initialState,rooms,inspect,collect,solve,choiceDefs} from '../games/blood-mirror/engine/index.js';
import {dialogueLines,sceneMet,readLog} from '../games/blood-mirror/journey.js';
import {speakers,NARRATOR} from '../games/blood-mirror/data/chapters/index.js';

const portraitFile=name=>new URL('../games/blood-mirror/assets/portraits/'+name+'.webp',import.meta.url);
const at=id=>rooms.findIndex(room=>room.id===id);
const variants=line=>[line.text,...Object.values(line.byChoice||{}).flatMap(map=>Object.values(map))];

test('every act opens with a short scene spoken by known speakers',()=>{
 for(const room of rooms){
  assert.ok(Array.isArray(room.scene)&&room.scene.length>=3&&room.scene.length<=6,room.id+' scene has 3–6 lines');
  for(const line of room.scene){
   assert.ok(!line.speaker||speakers[line.speaker],room.id+' unknown speaker '+line.speaker);
   for(const text of variants(line))assert.ok(text.length>0&&text.length<=80,room.id+' line over 80 characters: '+text);
  }
  assert.ok(room.scene.some(line=>line.speaker),room.id+' scene has at least one character speaking');
 }
});

test('every speaker with a portrait has its image, and every spot portrait is a speaker',()=>{
 assert.equal(speakers[NARRATOR].portrait,undefined);
 for(const [id,speaker] of Object.entries(speakers))if(speaker.portrait)assert.ok(fs.existsSync(portraitFile(speaker.portrait)),id+' portrait missing');
 for(const room of rooms)for(const spot of room.spots)if(spot.portrait)assert.ok(speakers[spot.portrait]?.portrait,room.id+'.'+spot.id+' portrait is not a speaker');
});

test('choice-dependent lines cover every option of a choice made in an earlier act',()=>{
 rooms.forEach((room,index)=>{
  for(const line of room.scene)for(const [key,map] of Object.entries(line.byChoice||{})){
   assert.ok(choiceDefs[key],room.id+' refers to unknown choice '+key);
   assert.ok(rooms.findIndex(r=>r.choice?.key===key)<index,room.id+' plays before '+key+' is chosen');
   assert.deepEqual(Object.keys(map).sort(),choiceDefs[key].options.map(option=>option.id).sort(),room.id+' covers every '+key+' option');
  }
 });
});

test('opening scenes never give away an act\'s key fact',()=>{
 const spoilers={library:'七十三',ballroom:'黑天鵝是伊萊',hunter:'托比',crypt:'每一次心跳之後',queen:'我不想成為女王',mirror:'失蹤的公主'};
 for(const room of rooms){
  const word=spoilers[room.id];if(!word)continue;
  for(const line of room.scene)for(const text of variants(line))assert.ok(!text.includes(word),room.id+' scene leaks '+word);
 }
});

test('the dialogue box plays the scene with the chosen variant, then the unlock line once the seal opens',()=>{
 const s=initialState(),mine=at('mine');s.room=mine;s.unlocked=mine;
 const fallback=dialogueLines(s);
 assert.equal(fallback.length,rooms[mine].scene.length);
 assert.equal(fallback[0].speaker,NARRATOR);
 assert.equal(fallback[1].speaker,'nyla');
 s.choices={tobyHeart:'bury'};
 assert.equal(dialogueLines(s).at(-1).text,rooms[mine].scene.at(-1).byChoice.tobyHeart.bury);
 s.solved=[mine];
 assert.deepEqual(dialogueLines(s).map(line=>line.speaker),[NARRATOR]);
 assert.ok(dialogueLines(s)[0].text.includes(rooms[mine].unlock));
});

test('an act counts as met once a spot is opened or its seal is open',()=>{
 const s=initialState();
 assert.equal(sceneMet(s),false);
 inspect(s,'bells');
 assert.equal(sceneMet(s),true);
 assert.equal(sceneMet(s,at('ballroom')),false);
});

test('the read log follows reading order and never reads ahead of the dialogue box',()=>{
 const s=initialState(),scene=rooms[0].scene;
 inspect(s,'watch');inspect(s,'bells');inspect(s,'lock1');
 const log=readLog(s);
 assert.deepEqual(log.slice(0,scene.length).map(entry=>entry.text),scene.map(line=>line.text));
 assert.deepEqual(log.slice(scene.length).map(entry=>entry.title),['黃金懷錶','鐘塔手札'],'spots in the order opened, seals left out');
 assert.equal(readLog(s,0,()=>false,2).length,2+2,'only the scene lines shown so far');
 assert.ok(readLog(s,0,()=>true).find(entry=>entry.title==='黃金懷錶').text.includes('鐘聲在前'),'restored text once the evidence is repaired');
 collect(s,'watch');assert.ok(solve(s,'1373').ok);
 assert.ok(readLog(s).at(-1).text.includes(rooms[0].unlock),'the unlock line closes the log');
});

test('a veiled shard is logged as the player saw it',()=>{
 const index=at('mine'),s=initialState();s.room=index;s.unlocked=index;
 const shard=rooms[index].spots.find(spot=>spot.shard);
 inspect(s,shard.id);
 assert.equal(readLog(s).at(-1).text,shard.veiled);
});
