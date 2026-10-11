// Save format v2: chapters are stored by id, so inserting a chapter never shifts saved progress.
// Version 1 (chapter indices, separate puzzle key) is read once and then superseded by v2.
// Fields added after v2 shipped (clues, shards, achievements, glowRooms, misses) are optional:
// a save without them restores to empty collections, so no version bump is needed.
import {chapters} from '../data/chapters/index.js';
import {restoreState} from './state.js';

export const SAVE_KEY='blood-mirror-v2';
export const LEGACY_SAVE_KEY='blood-mirror-v1';
export const LEGACY_PUZZLE_KEY='blood-mirror-challenges-v2';
export const SAVE_FORMAT='blood-mirror-save',MAX_SAVE_BYTES=100000;
// The prologue (序章) is a puzzle, not a chapter, so its completion is stored beside the chapters.
export const PROLOGUE_PUZZLE='prologue';

const chapterIds=()=>chapters.map(c=>c.id);
const puzzleIds=()=>[...chapterIds(),PROLOGUE_PUZZLE];
const knownIds=list=>Array.isArray(list)?[...new Set(list.filter(id=>puzzleIds().includes(id)))]:[];

// Engine state -> v2 object. `puzzles` lists the hands-on puzzles completed so far.
export function toSaveV2(state,puzzles=[]){
 const ids=chapterIds();
 return {
  version:2,
  started:state.started===true,
  chapter:ids[state.room]??ids[0],
  unlocked:ids.slice(0,state.unlocked+1),
  solved:state.solved.map(i=>ids[i]).filter(Boolean),
  puzzles:knownIds(puzzles),
  inventory:[...state.inventory],
  seen:[...state.seen],
  hints:Object.fromEntries(ids.map((id,i)=>[id,state.hints[i]??0])),
  clues:[...(state.clues||[])],
  glowRooms:(state.glowRooms||[]).map(i=>ids[i]).filter(Boolean),
  misses:Object.fromEntries(ids.map((id,i)=>[id,state.misses?.[i]??0])),
  memories:[...(state.memories||[])],
  shards:[...(state.shards||[])],
  achievements:[...(state.achievements||[])],
  endings:[...state.endings],
  ending:state.ending,
  answers:state.answers?[...state.answers]:null,
  elapsed:state.elapsed,
  muted:state.muted!==false
 };
}

// v2 object -> validated engine state plus completed puzzles. Returns null for anything that is not v2.
export function fromSaveV2(data){
 if(!data||typeof data!=='object'||data.version!==2)return null;
 const ids=chapterIds();
 const solved=Array.isArray(data.solved)?data.solved.map(id=>ids.indexOf(id)).filter(i=>i>=0):[];
 const room=ids.indexOf(data.chapter);
 const legacy={
  version:1,
  started:data.started===true,
  room:room<0?0:room,
  unlocked:Array.isArray(data.unlocked)?Math.max(0,...data.unlocked.map(id=>ids.indexOf(id))):0,
  solved,
  inventory:data.inventory,
  seen:data.seen,
  hints:Object.fromEntries(ids.map((id,i)=>[i,data.hints?.[id]??0])),
  clues:data.clues,
  glowRooms:Array.isArray(data.glowRooms)?data.glowRooms.map(id=>ids.indexOf(id)):[],
  misses:Object.fromEntries(ids.map((id,i)=>[i,data.misses?.[id]??0])),
  shards:data.shards,
  achievements:data.achievements,
  elapsed:data.elapsed,
  ending:data.ending,
  endings:data.endings,
  memories:data.memories,
  answers:data.answers,
  muted:data.muted
 };
 return {state:restoreState(legacy),puzzles:knownIds(data.puzzles)};
}

function parseJSON(text){try{return JSON.parse(text);}catch{return null;}}

// Reads the browser store: v2 first, then the untouched v1 keys as a one-time migration source.
export function loadSave(storage=globalThis.localStorage){
 const read=key=>{try{return storage?.getItem(key)??null;}catch{return null;}};
 const current=fromSaveV2(parseJSON(read(SAVE_KEY)));
 if(current)return {...current,migrated:false};
 const legacyRaw=read(LEGACY_SAVE_KEY);
 const legacyPuzzles=parseJSON(read(LEGACY_PUZZLE_KEY));
 return {
  state:legacyRaw===null?restoreState(null):restoreState(parseJSON(legacyRaw)),
  puzzles:knownIds(legacyPuzzles),
  migrated:legacyRaw!==null
 };
}

// Returns false when nothing was stored (no storage, quota, or private browsing).
export function writeSave(state,puzzles,storage=globalThis.localStorage){
 if(!storage)return false;
 try{storage.setItem(SAVE_KEY,JSON.stringify(toSaveV2(state,puzzles)));return true;}catch{return false;}
}

// Portable save file so one player can move a journey between devices.
export function exportSave(state,puzzles=[]){
 return JSON.stringify({format:SAVE_FORMAT,version:2,exported:new Date().toISOString(),save:toSaveV2(state,puzzles)},null,1);
}

// Accepts v2 files and the original v1 files (format version 1, `story` + `challenges`).
export function parseSave(text){
 if(typeof text!=='string'||!text.trim())throw new Error('檔案是空的。');
 if(text.length>MAX_SAVE_BYTES)throw new Error('檔案太大，不像是血色魔鏡的存檔。');
 let data;try{data=JSON.parse(text);}catch{throw new Error('檔案無法讀取，可能已經損毀。');}
 if(data?.format!==SAVE_FORMAT)throw new Error('這不是血色魔鏡的存檔，或版本不相容。');
 if(data.version===2){
  const loaded=fromSaveV2(data.save);
  if(!loaded)throw new Error('這不是血色魔鏡的存檔，或版本不相容。');
  return loaded;
 }
 if(data.version===1&&data.story?.version===1)return {state:restoreState(data.story),puzzles:knownIds(data.challenges)};
 throw new Error('這不是血色魔鏡的存檔，或版本不相容。');
}
