import {restoreState} from './engine.js';
// Portable save file so one player can move a journey between devices.
// Imports always pass through restoreState, so edited files cannot skip chapters.
export const SAVE_FORMAT='blood-mirror-save',MAX_SAVE_BYTES=100000;
const challengeIds=['library','mine','crypt','queen','mirror'];
export function exportSave(state,challenges=[]){
 return JSON.stringify({format:SAVE_FORMAT,version:1,exported:new Date().toISOString(),story:state,challenges:challenges.filter(id=>challengeIds.includes(id))},null,1);
}
export function parseSave(text){
 if(typeof text!=='string'||!text.trim())throw new Error('檔案是空的。');
 if(text.length>MAX_SAVE_BYTES)throw new Error('檔案太大，不像是血色魔鏡的存檔。');
 let data;try{data=JSON.parse(text);}catch{throw new Error('檔案無法讀取，可能已經損毀。');}
 if(data?.format!==SAVE_FORMAT||data.version!==1||data.story?.version!==1)throw new Error('這不是血色魔鏡的存檔，或版本不相容。');
 const state=restoreState(data.story);
 const challenges=Array.isArray(data.challenges)?[...new Set(data.challenges.filter(id=>challengeIds.includes(id)))]:[];
 return {state,challenges};
}
