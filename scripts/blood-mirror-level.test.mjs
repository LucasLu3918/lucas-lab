// Level-design checks (level design skill): the critical path is never soft-locked, every gate names an
// item the player can already hold, every inventory item has a purpose, and hotspots stay far enough
// apart to tap on the smallest supported stage (a landscape phone, 812×457).
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,rooms,items,inspect,collect,shardIds} from '../games/blood-mirror/engine/index.js';
import {spotText} from '../games/blood-mirror/journey.js';
import {puzzles} from '../games/blood-mirror/puzzles/index.js';

// Items a spot hands over before the act's seal opens (after:'solved' spots only appear afterwards).
const before=room=>room.spots.filter(spot=>spot.item&&!spot.after).map(spot=>spot.item);
const after=room=>[...room.spots.filter(spot=>spot.item&&spot.after==='solved').map(spot=>spot.item),...(room.grants||[])];
const sealKeys=rooms.map(room=>room.requires).filter(Boolean);
const stageKeys=Object.values(puzzles).filter(p=>!p.optional).flatMap(p=>p.stages.map(stage=>stage.requires)).filter(Boolean);
const shardKeys=rooms.flatMap(room=>room.spots.filter(spot=>spot.needs).map(spot=>spot.needs));
const endingKeys=['blueprint'];

// Walks the acts in order (optionally leaving catch-up acts unplayed, as a migrated save may) and
// checks every gate against the items that could be held at that moment.
function walk(skipCatchUp){
 const held=new Set();
 for(const room of rooms){
  if(skipCatchUp&&room.catchUp)continue;
  for(const item of before(room))held.add(item);
  if(room.requires)assert.ok(held.has(room.requires),room.id+' seal needs '+room.requires+' before it opens');
  for(const stage of puzzles[room.id].stages)if(stage.requires)assert.ok(held.has(stage.requires),room.id+'.'+stage.id+' needs '+stage.requires);
  for(const item of after(room))held.add(item);
 }
 for(const item of endingKeys)assert.ok(held.has(item),'the dawn ending needs '+item);
}

test('the critical path holds every key before its gate, in order',()=>walk(false));
test('a migrated save that skipped the catch-up acts is never soft-locked',()=>walk(true));

test('every inventory item opens something, or is marked as a keepsake',()=>{
 const used=new Set([...sealKeys,...stageKeys,...shardKeys,...endingKeys]);
 for(const [id,item] of Object.entries(items)){
  if(item.keepsake)assert.ok(!used.has(id),id+' is a keepsake but also a key');
  else assert.ok(used.has(id),id+' is never used; give it a purpose or mark it keepsake');
 }
});

test('shards: the first is free (it teaches that shards exist); later ones need a tool from the same act',()=>{
 assert.equal(rooms[0].spots.find(spot=>spot.shard).needs,undefined);
 for(const room of rooms.slice(1)){
  const shard=room.spots.find(spot=>spot.shard);
  assert.ok(shard.needs,room.id+' shard has a tool');
  assert.ok(before(room).includes(shard.needs),room.id+' shard tool is found in the act before its seal');
  assert.ok(shard.veiled&&shard.veiled!==shard.text,room.id+' shard says what is missing');
 }
});

test('a veiled shard points at its tool and is collected once the tool is held',()=>{
 const index=rooms.findIndex(room=>room.id==='mine'),shard=rooms[index].spots.find(spot=>spot.shard);
 const s=initialState();s.room=index;s.unlocked=index;
 inspect(s,shard.id);
 assert.deepEqual(s.shards,[]);
 assert.equal(spotText(shard,false,s),shard.veiled);
 assert.ok(collect(s,'lantern'));
 inspect(s,shard.id);
 assert.deepEqual(s.shards,[shard.id]);
 assert.equal(spotText(shard,false,s),shard.text);
 // A shard kept from an earlier journey stays found without the tool.
 const next={...initialState(),room:index,shards:[shard.id]};
 assert.equal(spotText(shard,false,next),shard.text);
 assert.ok(shardIds.includes(shard.id));
});

test('hotspots in one view are at least 48px apart on a landscape phone stage',()=>{
 const W=812,H=457,MIN=48;
 for(const room of rooms){
  const views=(room.views||[{id:'main'}]).map(view=>view.id);
  for(const view of views){
   const spots=room.spots.filter(spot=>(spot.view||views[0])===view);
   for(let i=0;i<spots.length;i++)for(let j=i+1;j<spots.length;j++){
    const a=spots[i],b=spots[j],d=Math.hypot((a.x-b.x)*W/100,(a.y-b.y)*H/100);
    assert.ok(d>=MIN,`${room.id}/${view}: ${a.id} and ${b.id} are ${d.toFixed(0)}px apart`);
   }
  }
 }
});
