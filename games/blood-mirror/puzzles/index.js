// Hands-on puzzles repair evidence. Every puzzle follows one interface:
//   { id, title, subtitle, mount(ctx) }
// where ctx = { render(html), feedback(text), done(), playCue(kind), fresh }.
// Completions are stored in the save (engine/save.js); this module only keeps them in memory.
import {mountLedger,puzzleIsSolved} from './ledger.js';
import {mountPipes,pipeIsSolved,resetPipes} from './pipes.js';
import {mountRune} from './rune.js';
import {mountMemory} from './memory.js';
import {mountReflection,glassIsSolved} from './reflection.js';
import {mountMusicBox,lullaby} from './musicbox.js';
import {mountMasks,masksSolved} from './masks.js';
import {mountRuneHeart,heartPathValid} from './runeheart.js';
import {mountLight,lightSolved} from './light.js';
import {mountWatch,watchSolved} from './watch.js';
import {mountNames,namesSolved} from './names.js';
import {mountRubbing,rubbingSolved} from './rubbing.js';
import {mountStitch,stitchSolved} from './stitch.js';
import {mountMaze,mazeSolved} from './maze.js';
export {puzzleIsSolved,pipeIsSolved,glassIsSolved,lullaby,masksSolved,heartPathValid,lightSolved,watchSolved,namesSolved,rubbingSolved,stitchSolved,mazeSolved};

export const puzzles={
 // The prologue is not a chapter: its completion is stored beside the chapters (engine/save.js).
 prologue:{id:'prologue',title:'音樂盒的搖籃曲',subtitle:'PROLOGUE · 序章',mount:mountMusicBox},
 library:{id:'library',title:'撕碎的出生紀錄',subtitle:'EVIDENCE · 帳頁與懷錶',
  // Two stages: mend the ledger page, then wind the pocket watch forward.
  mount:ctx=>mountLedger({...ctx,done:()=>{ctx.playCue('door');mountWatch(ctx);}})},
 ballroom:{id:'ballroom',title:'面具下的賓客',subtitle:'EVIDENCE · 面具與光路',
  // Two stages in one evidence: name the masks, then guide the moonlight to the hidden door.
  mount:ctx=>mountMasks({...ctx,done:()=>{ctx.playCue('door');mountLight(ctx);}})},
 hunter:{id:'hunter',title:'玻璃心臟法陣',subtitle:'EVIDENCE · 符文順序',mount:mountRuneHeart},
 mine:{id:'mine',title:'重接銀骨蒸汽管',subtitle:'EVIDENCE · 管網與七個名字',
  mount:ctx=>mountPipes({...ctx,done:()=>{ctx.playCue('door');mountNames(ctx);}})},
 crypt:{id:'crypt',title:'棺中的心跳',subtitle:'EVIDENCE · 符印與拓印',
  mount:ctx=>mountRune({...ctx,done:()=>{ctx.playCue('door');mountRubbing(ctx);}})},
 queen:{id:'queen',title:'王后遺落的記憶',subtitle:'EVIDENCE · 記憶與縫線',
  mount:ctx=>mountMemory({...ctx,done:()=>{ctx.playCue('door');mountStitch(ctx);}})},
 mirror:{id:'mirror',title:'反寫的見證者手稿',subtitle:'EVIDENCE · 映照與迷廊',
  mount:ctx=>mountReflection({...ctx,done:()=>{ctx.playCue('door');mountMaze(ctx);}})}
};

const completed=new Set();
let persist=()=>{};
// The app registers its save routine here so a finished puzzle is written at once.
export function setPuzzlePersistence(callback){persist=typeof callback==='function'?callback:()=>{};}
export function setPuzzleCompletions(list){completed.clear();for(const id of Array.isArray(list)?list:[])if(puzzles[id])completed.add(id);}
export function completedPuzzles(){return [...completed];}
export function isPuzzleComplete(id){return completed.has(id);}
export function resetPuzzles(){completed.clear();resetPipes();}

// Opens a puzzle inside the modal. `success` runs after the puzzle has been recorded as complete.
export function startPuzzle(id,{modal,success,playCue,fresh=false}){
 const entry=puzzles[id];
 const complete=()=>{completed.add(id);persist();playCue('solve');success();};
 if(!entry){complete();return;}
 const render=html=>{
  const active=document.activeElement;
  const attr=['data-pos','data-pipe','data-rune','data-memory','data-reflection','data-pin','data-mask','data-node','data-mirror','data-gear','data-bed','data-rub','data-seal','data-stitch','data-walk'].find(k=>active?.hasAttribute(k));
  const selector=attr?'['+attr+'="'+active.getAttribute(attr)+'"]':null;
  modal(entry.title,entry.subtitle,'<div class="challenge" data-challenge="'+id+'">'+html+'</div>');
  if(selector)document.querySelector('.challenge '+selector)?.focus({preventScroll:true});
 };
 const feedback=text=>{const el=document.querySelector('.challenge-feedback');if(el)el.textContent=text;};
 entry.mount({render,feedback,done:complete,playCue,fresh});
}
