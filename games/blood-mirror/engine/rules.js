// Game rules. Pure functions over the progress state; content comes from data/.
// Chapters are addressed by index inside the engine; persisted saves use chapter ids (engine/save.js).
import {chapters} from '../data/chapters/index.js';
import {items} from '../data/items.js';
import {endings} from '../data/endings.js';

export const rooms=chapters;
export {items,endings};
const lastIndex=()=>rooms.length-1;

// Spots marked after:'solved' appear once their chapter's seal is open; after:'ending'
// memories appear in every act once any ending has been reached, and stay collected.
export const memorySpots=rooms.flatMap((room,index)=>room.spots.filter(spot=>spot.memory).map(spot=>({...spot,room:index})));

export function visibleSpots(state,index=state.room){
 return rooms[index].spots.filter(spot=>spot.after==='solved'?state.solved.includes(index):spot.after==='ending'?(state.endings?.length??0)>0:true);
}

export function inspect(state,id){
 const spot=visibleSpots(state).find(s=>s.id===id);
 if(!spot)return null;
 if(!spot.lock&&!state.seen.includes(id))state.seen.push(id);
 if(spot.memory){state.memories=state.memories||[];if(!state.memories.includes(id))state.memories.push(id);}
 return spot;
}

export function collect(state,id){
 const spot=visibleSpots(state).find(s=>s.id===id);
 if(!spot?.item)return false;
 if(!state.inventory.includes(spot.item))state.inventory.push(spot.item);
 return true;
}

export function solve(state,answer){
 const r=rooms[state.room];
 if(state.solved.includes(state.room))return {ok:true,already:true};
 if(r.requires&&!state.inventory.includes(r.requires))return {ok:false,reason:'item',item:r.requires};
 const correct=r.free?validAnswers(answer):Array.isArray(r.answer)?JSON.stringify(r.answer)===JSON.stringify(answer):r.answer===answer;
 if(!correct)return {ok:false,reason:'answer'};
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
