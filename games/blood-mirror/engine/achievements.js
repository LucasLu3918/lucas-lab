// Twelve local achievements (成就). Each one reads progress that already exists in the state, so
// nothing is tracked twice. Unlocks are kept in the save and are never revoked.
import {rooms,memorySpots,shardIds} from './rules.js';

const roomIndex=id=>rooms.findIndex(room=>room.id===id);
const freeRoom=()=>rooms.find(room=>room.free);
const didFail=(state,id)=>(state.misses?.[roomIndex(id)]??0)>0;

export const achievements=[
 {id:'first-seal',title:'初次封印',text:'解開任何一幕的封印。',test:({state})=>state.solved.length>0},
 {id:'prologue',title:'聽見搖籃曲',text:'在序章中，把音樂盒的音針撥回搖籃曲譜。',test:({puzzles})=>puzzles.includes('prologue')},
 {id:'restored-ledger',title:'拼回出生紀錄',text:'把撕碎的帳頁完整拼回原狀。',test:({puzzles})=>puzzles.includes('library')},
 {id:'no-candle-library',title:'不借燭光',text:'不點燃燭光，解開黑鐘書庫的封印。',test:({state})=>state.solved.includes(roomIndex('library'))&&!(state.glowRooms||[]).includes(roomIndex('library'))},
 {id:'no-hint',title:'自己看見',text:'不展開任何提示，解開一幕封印。',test:({state})=>state.solved.some(index=>(state.hints?.[index]??0)===0)},
 {id:'steady-hands',title:'一次通過',text:'銀骨礦坑的封印沒有答錯過。',test:({state})=>state.solved.includes(roomIndex('mine'))&&!didFail(state,'mine')},
 {id:'perfect-mirror',title:'完美審問',text:'魔鏡審問一次全對。',test:({state})=>state.solved.includes(roomIndex('mirror'))&&!didFail(state,'mirror')},
 {id:'own-words',title:'另一種回答',text:'向王后作答時，說出了與白雪不同的答案。',test:({state})=>{const free=freeRoom();return Array.isArray(state.answers)&&JSON.stringify(state.answers)!==JSON.stringify(free.answer);}},
 {id:'first-ending',title:'第一個結局',text:'抵達任一個結局。',test:({state})=>(state.endings?.length??0)>=1},
 {id:'all-endings',title:'三條路',text:'找到全部三個結局。',test:({state})=>(state.endings?.length??0)>=3},
 {id:'all-memories',title:'人物記憶收齊',text:'收齊所有人物記憶。',test:({state})=>{const all=memorySpots.map(spot=>spot.id);return all.length>0&&all.every(id=>(state.memories||[]).includes(id));}},
 {id:'all-shards',title:'集滿鏡之碎片',text:'找到所有鏡之碎片，解鎖祕密尾聲。',test:({state})=>shardIds.every(id=>(state.shards||[]).includes(id))}
];

export const achievementIds=achievements.map(item=>item.id);

// Checks every achievement and records new unlocks on the state. Returns the newly unlocked entries.
export function unlockAchievements(state,puzzles=[]){
 state.achievements=state.achievements||[];
 const fresh=[];
 for(const item of achievements){
  if(state.achievements.includes(item.id)||!item.test({state,puzzles}))continue;
  state.achievements.push(item.id);
  fresh.push(item);
 }
 return fresh;
}
