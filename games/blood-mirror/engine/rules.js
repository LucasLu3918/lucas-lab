// Game rules. Pure functions over the progress state; content comes from data/.
// Chapters are addressed by index inside the engine; persisted saves use chapter ids (engine/save.js).
import {chapters} from '../data/chapters/index.js';
import {items} from '../data/items.js';
import {endings} from '../data/endings.js';
import {clueWords} from '../data/clues.js';

export const rooms=chapters;
export {items,endings};
const lastIndex=()=>rooms.length-1;

// Spots marked after:'solved' appear once their chapter's seal is open; after:'ending'
// memories appear in every act once any ending has been reached, and stay collected.
export const memorySpots=rooms.flatMap((room,index)=>room.spots.filter(spot=>spot.memory).map(spot=>({...spot,room:index})));
// Mirror shards (鏡之碎片) sit in the acts; the prologue adds one more, awarded by its puzzle.
export const PROLOGUE_SHARD='shard-prologue';
export const shardIds=[...rooms.flatMap(room=>room.spots.filter(spot=>spot.shard).map(spot=>spot.id)),PROLOGUE_SHARD];

export function visibleSpots(state,index=state.room){
 return rooms[index].spots.filter(spot=>spot.after==='solved'?state.solved.includes(index):spot.after==='ending'?(state.endings?.length??0)>0:true);
}

export function inspect(state,id){
 const spot=visibleSpots(state).find(s=>s.id===id);
 if(!spot)return null;
 if(!spot.lock&&!state.seen.includes(id))state.seen.push(id);
 if(spot.memory){state.memories=state.memories||[];if(!state.memories.includes(id))state.memories.push(id);}
 state.clues=state.clues||[];
 for(const word of spot.clues||[])if(clueWords[word]&&!state.clues.includes(word))state.clues.push(word);
 if(spot.shard)collectShard(state,id);
 return spot;
}

// Clue words that only become readable once an act's evidence is restored (spot.restoredClues).
export function restoreClues(state,id){
 const spot=rooms[state.room].spots.find(s=>s.id===id);
 const added=[];
 state.clues=state.clues||[];
 for(const word of spot?.restoredClues||[])if(clueWords[word]&&!state.clues.includes(word)){state.clues.push(word);added.push(word);}
 return added;
}

// Shards are kept across new journeys, so a replay never loses a collected fragment.
export function collectShard(state,id){
 if(!shardIds.includes(id))return false;
 state.shards=state.shards||[];
 if(!state.shards.includes(id))state.shards.push(id);
 return true;
}

// Candle light (燭光) used in the current act. Feeds the "不借燭光" achievement.
export function markGlow(state){
 state.glowRooms=state.glowRooms||[];
 if(!state.glowRooms.includes(state.room))state.glowRooms.push(state.room);
}

export function collect(state,id){
 const spot=visibleSpots(state).find(s=>s.id===id);
 if(!spot?.item)return false;
 if(!state.inventory.includes(spot.item))state.inventory.push(spot.item);
 return true;
}

// The mirror interrogation (魔鏡審問). `spec.blanks[i].answer` is the word that belongs in blank i.
// Blanks sharing a `set` accept their words in either order. Returns the wrong blank indexes so the
// page can count them (puzzle mode) or mark them (story mode) without naming the words.
export function judgeInterrogation(spec,answer){
 const blanks=spec?.blanks||[];
 if(!Array.isArray(answer)||answer.length!==blanks.length)return {ok:false,wrong:blanks.map((_,i)=>i)};
 const wrong=[],sets=new Map();
 blanks.forEach((blank,i)=>{
  if(!blank.set){if(answer[i]!==blank.answer)wrong.push(i);return;}
  if(!sets.has(blank.set))sets.set(blank.set,[]);
  sets.get(blank.set).push(i);
 });
 for(const indexes of sets.values()){
  const remaining=indexes.map(i=>blanks[i].answer);
  for(const i of indexes){const k=remaining.indexOf(answer[i]);if(k<0)wrong.push(i);else remaining.splice(k,1);}
 }
 wrong.sort((a,b)=>a-b);
 return {ok:wrong.length===0,wrong};
}

export function solve(state,answer){
 const r=rooms[state.room];
 if(state.solved.includes(state.room))return {ok:true,already:true};
 if(r.requires&&!state.inventory.includes(r.requires))return {ok:false,reason:'item',item:r.requires};
 const correct=r.interrogation?judgeInterrogation(r.interrogation,answer).ok:r.free?validAnswers(answer):Array.isArray(r.answer)?JSON.stringify(r.answer)===JSON.stringify(answer):r.answer===answer;
 if(!correct){
  state.misses=state.misses||{};
  state.misses[state.room]=(state.misses[state.room]||0)+1;
  return {ok:false,reason:'answer'};
 }
 if(r.free)state.answers=[...answer];
 state.solved.push(state.room);
 state.unlocked=Math.min(state.room+1,lastIndex());
 for(const item of r.grants||[])if(!state.inventory.includes(item))state.inventory.push(item);
 return {ok:true};
}

export function travel(state,index){
 if(!Number.isInteger(index)||index<0||index>state.unlocked)return false;
 state.room=index;
 return true;
}

export function chooseEnding(state,id){
 if(state.solved.length!==rooms.length||!endings[id])return false;
 if(id==='dawn'&&!state.inventory.includes('blueprint'))return false;
 state.ending=id;
 if(!state.endings.includes(id))state.endings.push(id);
 return true;
}

// The queen's questions have no wrong answer: any one option per question is a valid reply.
export function validAnswers(answer){
 const q=rooms.find(r=>r.free)?.questions;
 return Array.isArray(answer)&&!!q&&answer.length===q.length&&answer.every((a,i)=>q[i].options.some(o=>o.id===a));
}
export function queenResponse(index,id){return rooms.find(r=>r.free)?.questions[index]?.options.find(o=>o.id===id)?.response||'';}
export function queenResponses(answers){
 const q=rooms.find(r=>r.free).questions;
 return validAnswers(answers)?answers.map((a,i)=>q[i].options.find(o=>o.id===a).response):[];
}
export function unlockText(state,index=state.room){
 const r=rooms[index];
 if(!r.unlockEcho||!validAnswers(state.answers))return r.unlock;
 return r.unlockEcho[JSON.stringify(state.answers)===JSON.stringify(r.answer)?0:1]+'\n'+r.unlock;
}
