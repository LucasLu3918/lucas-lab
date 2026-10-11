// Progress state in its engine shape (version 1 layout, chapter indices). Every value that
// arrives from storage passes through restoreState, so edited saves cannot skip chapters.
import {rooms,items,endings,memorySpots,validAnswers,shardIds,choiceDefs} from './rules.js';
import {achievementIds} from './achievements.js';
import {clueWords} from '../data/clues.js';

// Per journey: started, room, solved, inventory, seen, hints, clues, deduced, glowRooms, misses, elapsed.
// Kept across journeys: endings, memories, shards, achievements.
export function initialState(){
 return {version:1,started:false,room:0,unlocked:0,solved:[],inventory:[],seen:[],hints:{},clues:[],deduced:[],skipped:[],choices:{},glowRooms:[],misses:{},shards:[],achievements:[],elapsed:0,ending:null,endings:[],memories:[],answers:null,muted:true};
}

export function restoreState(raw){
 try{
  const s=typeof raw==='string'?JSON.parse(raw):raw;
  if(!s||s.version!==1)return initialState();
  const last=rooms.length-1,freeIndex=rooms.findIndex(r=>r.free);
  const validItems=Object.keys(items),validSeen=rooms.flatMap(r=>r.spots.map(spot=>spot.id));
  const solved=Array.isArray(s.solved)?[...new Set(s.solved.filter(n=>Number.isInteger(n)&&n>=0&&n<=last))].sort((a,b)=>a-b):[];
  // Progress is a contiguous chain, so invalid or edited saves cannot skip chapters. The one exception is a
  // `catchUp` act (added after release) listed in `skipped`: the migration of an older save leaves it open.
  const list=(value,valid)=>Array.isArray(value)?[...new Set(value.filter(valid))]:[];
  const skipped=list(s.skipped,i=>Number.isInteger(i)&&i>=0&&i<=last&&!!rooms[i].catchUp&&!solved.includes(i));
  let chain=0;while(chain<=last&&(solved.includes(chain)||skipped.includes(chain)))chain++;
  const unlocked=Math.min(chain,last),room=Math.min(Math.max(Number.isInteger(s.room)?s.room:0,0),unlocked);
  return {
   ...initialState(),
   started:s.started===true,room,unlocked,
   solved:solved.filter(n=>n<chain),
   inventory:list(s.inventory,id=>validItems.includes(id)),
   seen:list(s.seen,id=>validSeen.includes(id)),
   hints:Object.fromEntries(rooms.map((_,i)=>[i,Math.min(3,Math.max(0,Number.isInteger(s.hints?.[i])?s.hints[i]:0))])),
   // Saves written before clue words existed (no `clues` field) regain the words of every spot they already viewed.
   clues:Array.isArray(s.clues)?list(s.clues,id=>Object.hasOwn(clueWords,id)):[...new Set(rooms.flatMap(r=>r.spots.filter(spot=>Array.isArray(s.seen)&&s.seen.includes(spot.id)).flatMap(spot=>spot.clues||[])))].filter(id=>Object.hasOwn(clueWords,id)),
   // Acts whose pre-seal deduction (room.deduction) was solved. Only acts that have one can be listed.
   deduced:list(s.deduced,i=>Number.isInteger(i)&&i>=0&&i<=last&&!!rooms[i].deduction&&(i<=chain)),
   skipped:skipped.filter(i=>i<chain),
   choices:Object.fromEntries(Object.entries(choiceDefs).filter(([key,def])=>def.options.some(option=>option.id===s.choices?.[key])&&solved.includes(rooms.findIndex(r=>r.choice?.key===key))).map(([key])=>[key,s.choices[key]])),
   glowRooms:list(s.glowRooms,i=>Number.isInteger(i)&&i>=0&&i<=last),
   misses:Object.fromEntries(rooms.map((_,i)=>[i,Math.min(99,Math.max(0,Number.isInteger(s.misses?.[i])?s.misses[i]:0))])),
   shards:list(s.shards,id=>shardIds.includes(id)),
   achievements:list(s.achievements,id=>achievementIds.includes(id)),
   elapsed:Number.isFinite(s.elapsed)?Math.min(Math.max(s.elapsed,0),604800):0,
   ending:chain===rooms.length&&endings[s.ending]?s.ending:null,
   endings:Array.isArray(s.endings)?s.endings.filter(e=>endings[e]):[],
   answers:chain>freeIndex&&validAnswers(s.answers)?[...s.answers]:null,
   memories:Array.isArray(s.memories)?[...new Set(s.memories.filter(id=>memorySpots.some(spot=>spot.id===id)))]:[],
   muted:s.muted!==false
  };
 }catch{return initialState();}
}
