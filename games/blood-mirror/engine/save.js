// Save format v2: chapters are stored by id, so inserting a chapter never shifts saved progress.
// Version 1 (chapter indices, separate puzzle key) is read once and then superseded by v2.
// Fields added after v2 shipped (clues, deduced, choices, skipped, roster, shards, achievements, glowRooms, misses, stepHints) are optional:
// a save without them restores to empty collections, so no version bump is needed.
// localStorage.setItem replaces a key in one step, so a write cannot be left half-done; the backup key
// instead guards against a save that is later unreadable, and a save from a newer build is never overwritten.
import {chapters} from '../data/chapters/index.js';
import {abyss} from '../data/abyss.js';
import {restoreState} from './state.js';

export const SAVE_VERSION=2;
export const SAVE_KEY='blood-mirror-v2';
// The last readable save from an earlier visit, refreshed once per page load (see backupSave).
export const BACKUP_SAVE_KEY='blood-mirror-v2-backup';
export const LEGACY_SAVE_KEY='blood-mirror-v1';
export const LEGACY_PUZZLE_KEY='blood-mirror-challenges-v2';
export const SAVE_FORMAT='blood-mirror-save',MAX_SAVE_BYTES=100000;
// The prologue (序章) is a puzzle, not a chapter, so its completion is stored beside the chapters.
export const PROLOGUE_PUZZLE='prologue';

const chapterIds=()=>chapters.map(c=>c.id);
// A two-stage evidence also records each finished stage ("mine.names"), so the player can do them in either order.
const stageIds=()=>chapters.filter(c=>c.stages?.length>1).flatMap(c=>c.stages.map(stage=>c.id+'.'+stage));
// The optional "帳本的背面" levels are puzzles of their own, outside the chapter chain.
const puzzleIds=()=>[...chapterIds(),PROLOGUE_PUZZLE,...stageIds(),...abyss.levels.map(level=>level.puzzle)];
const knownIds=list=>Array.isArray(list)?[...new Set(list.filter(id=>puzzleIds().includes(id)))]:[];

// Engine state -> v2 object. `puzzles` lists the hands-on puzzles completed so far.
export function toSaveV2(state,puzzles=[]){
 const ids=chapterIds();
 return {
  version:SAVE_VERSION,
  started:state.started===true,
  chapter:ids[state.room]??ids[0],
  unlocked:ids.slice(0,state.unlocked+1),
  solved:state.solved.map(i=>ids[i]).filter(Boolean),
  puzzles:knownIds(puzzles),
  inventory:[...state.inventory],
  seen:[...state.seen],
  hints:Object.fromEntries(ids.map((id,i)=>[id,state.hints[i]??0])),
  stepHints:{...(state.stepHints||{})},
  clues:[...(state.clues||[])],
  deduced:(state.deduced||[]).map(i=>ids[i]).filter(Boolean),
  choices:{...(state.choices||{})},
  // Which acts this save knew about, and which late-added acts it may leave open (see restoreState).
  roster:[...ids],
  skipped:(state.skipped||[]).map(i=>ids[i]).filter(Boolean),
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
 if(!data||typeof data!=='object'||data.version!==SAVE_VERSION)return null;
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
  stepHints:data.stepHints,
  clues:data.clues,
  deduced:Array.isArray(data.deduced)?data.deduced.map(id=>ids.indexOf(id)):[],
  choices:data.choices,
  // A save without a roster predates the acts added later; it may leave those open until it is played again.
  skipped:Array.isArray(data.roster)
   ?(Array.isArray(data.skipped)?data.skipped.map(id=>ids.indexOf(id)):[])
   :chapters.map((c,i)=>c.catchUp?i:-1).filter(i=>i>=0),
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

// Version 1 saves count the five original acts by index. Chapters have since been inserted, so those
// indices are translated through the original order before the state is restored.
const V1_ORDER=['library','mine','crypt','queen','mirror'];
export function remapV1(raw){
 if(!raw||typeof raw!=='object'||raw.version!==1)return raw;
 const ids=chapterIds(),to=i=>{const at=ids.indexOf(V1_ORDER[i]);return at<0?null:at;};
 const index=value=>Number.isInteger(value)&&value>=0&&value<V1_ORDER.length?to(value):null;
 const byIndex=map=>Object.fromEntries(Object.entries(map&&typeof map==='object'?map:{}).map(([k,v])=>[index(Number(k)),v]).filter(([k])=>k!==null));
 return {
  ...raw,
  room:index(raw.room)??0,
  solved:Array.isArray(raw.solved)?raw.solved.map(index).filter(i=>i!==null):[],
  hints:byIndex(raw.hints),
  misses:byIndex(raw.misses),
  glowRooms:Array.isArray(raw.glowRooms)?raw.glowRooms.map(index).filter(i=>i!==null):[],
  skipped:chapters.map((c,i)=>c.catchUp?i:-1).filter(i=>i>=0)
 };
}

function parseJSON(text){try{return JSON.parse(text);}catch{return null;}}
const isNewer=data=>Number.isInteger(data?.version)&&data.version>SAVE_VERSION;
const reader=storage=>key=>{try{return storage?.getItem(key)??null;}catch{return null;}};

// Reads the browser store: v2 first, then the backup of the last readable v2, then the untouched v1 keys
// as a one-time migration source. `newer` marks a save written by a newer build: it is left in place,
// and the caller must not write over it (the page is out of date, a reload fetches the build that reads it).
export function loadSave(storage=globalThis.localStorage){
 const read=reader(storage);
 const raw=read(SAVE_KEY),data=parseJSON(raw);
 if(isNewer(data))return {state:restoreState(null),puzzles:[],migrated:false,recovered:false,newer:true};
 const current=fromSaveV2(data);
 if(current)return {...current,migrated:false,recovered:false,newer:false};
 const backup=fromSaveV2(parseJSON(read(BACKUP_SAVE_KEY)));
 if(backup)return {...backup,migrated:false,recovered:raw!==null,newer:false};
 const legacyRaw=read(LEGACY_SAVE_KEY);
 const legacyPuzzles=parseJSON(read(LEGACY_PUZZLE_KEY));
 return {
  state:legacyRaw===null?restoreState(null):restoreState(remapV1(parseJSON(legacyRaw))),
  puzzles:knownIds(legacyPuzzles),
  migrated:legacyRaw!==null,
  recovered:false,
  newer:false
 };
}

// Copies the current save to the backup key, but only when it is a readable v2 save, so an unreadable
// save never replaces a good backup. Called once per page load, before this visit writes anything.
export function backupSave(storage=globalThis.localStorage){
 const raw=reader(storage)(SAVE_KEY);
 if(!fromSaveV2(parseJSON(raw)))return false;
 try{storage.setItem(BACKUP_SAVE_KEY,raw);return true;}catch{return false;}
}

// Returns false when nothing was stored (no storage, quota, or private browsing).
export function writeSave(state,puzzles,storage=globalThis.localStorage){
 if(!storage)return false;
 try{storage.setItem(SAVE_KEY,JSON.stringify(toSaveV2(state,puzzles)));return true;}catch{return false;}
}

// Portable save file so one player can move a journey between devices.
export function exportSave(state,puzzles=[]){
 return JSON.stringify({format:SAVE_FORMAT,version:SAVE_VERSION,exported:new Date().toISOString(),save:toSaveV2(state,puzzles)},null,1);
}

// Accepts v2 files and the original v1 files (format version 1, `story` + `challenges`).
export function parseSave(text){
 if(typeof text!=='string'||!text.trim())throw new Error('檔案是空的。');
 if(text.length>MAX_SAVE_BYTES)throw new Error('檔案太大，不像是血色魔鏡的存檔。');
 let data;try{data=JSON.parse(text);}catch{throw new Error('檔案無法讀取，可能已經損毀。');}
 if(data?.format!==SAVE_FORMAT)throw new Error('這不是血色魔鏡的存檔，或版本不相容。');
 if(isNewer(data)||isNewer(data.save))throw new Error('這份存檔來自較新的版本，請重新整理頁面後再匯入。');
 if(data.version===SAVE_VERSION){
  const loaded=fromSaveV2(data.save);
  if(!loaded)throw new Error('這不是血色魔鏡的存檔，或版本不相容。');
  return loaded;
 }
 if(data.version===1&&data.story?.version===1)return {state:restoreState(remapV1(data.story)),puzzles:knownIds(data.challenges)};
 throw new Error('這不是血色魔鏡的存檔，或版本不相容。');
}
