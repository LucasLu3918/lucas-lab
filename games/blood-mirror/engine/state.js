// Progress state in its engine shape (version 1 layout, chapter indices). Every value that
// arrives from storage passes through restoreState, so edited saves cannot skip chapters.
import {rooms,items,endings,memorySpots,validAnswers} from './rules.js';

export function initialState(){
 return {version:1,started:false,room:0,unlocked:0,solved:[],inventory:[],seen:[],hints:{},elapsed:0,ending:null,endings:[],memories:[],answers:null,muted:true};
}

export function restoreState(raw){
 try{
  const s=typeof raw==='string'?JSON.parse(raw):raw;
  if(!s||s.version!==1)return initialState();
  const last=rooms.length-1,freeIndex=rooms.findIndex(r=>r.free);
  const validItems=Object.keys(items),validSeen=rooms.flatMap(r=>r.spots.map(spot=>spot.id));
  const solved=Array.isArray(s.solved)?[...new Set(s.solved.filter(n=>Number.isInteger(n)&&n>=0&&n<=last))].sort((a,b)=>a-b):[];
  // Progress is a contiguous chain, so invalid or edited saves cannot skip chapters.
  let chain=0;while(solved.includes(chain)&&chain<=last)chain++;
  const unlocked=Math.min(chain,last),room=Math.min(Math.max(Number.isInteger(s.room)?s.room:0,0),unlocked);
  return {
   ...initialState(),
   started:s.started===true,room,unlocked,
   solved:solved.filter(n=>n<chain),
   inventory:Array.isArray(s.inventory)?[...new Set(s.inventory.filter(i=>validItems.includes(i)))]:[],
   seen:Array.isArray(s.seen)?[...new Set(s.seen.filter(i=>validSeen.includes(i)))]:[],
   hints:Object.fromEntries(rooms.map((_,i)=>[i,Math.min(3,Math.max(0,Number.isInteger(s.hints?.[i])?s.hints[i]:0))])),
   elapsed:Number.isFinite(s.elapsed)?Math.min(Math.max(s.elapsed,0),604800):0,
   ending:chain===rooms.length&&endings[s.ending]?s.ending:null,
   endings:Array.isArray(s.endings)?s.endings.filter(e=>endings[e]):[],
   answers:chain>freeIndex&&validAnswers(s.answers)?[...s.answers]:null,
   memories:Array.isArray(s.memories)?[...new Set(s.memories.filter(id=>memorySpots.some(spot=>spot.id===id)))]:[],
   muted:s.muted!==false
  };
 }catch{return initialState();}
}
