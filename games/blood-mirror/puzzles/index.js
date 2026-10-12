// Hands-on puzzles repair evidence. Every puzzle is { id, title, subtitle, stages:[{ id, label, mount(ctx) }] }
// where ctx = { render(html), feedback(text), done(), playCue(kind), fresh, has(item) }.
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

// Each evidence puzzle has one or more stages (機關). Stage ids match the chapter data's `stages`, which
// also drives the step-aware hints. Acts with two stages let the player pick either one first (plan r8).
// `requires` names an item from an earlier act that the stage needs (plan r10); `whisper` marks a known
// bottleneck where the mirror offers its first hint after three quiet minutes (plan r1).
export const puzzles={
 // The prologue is not a chapter: its completion is stored beside the chapters (engine/save.js).
 prologue:{id:'prologue',title:'音樂盒的搖籃曲',subtitle:'PROLOGUE · 序章',stages:[{id:'musicbox',label:'音樂盒',mount:mountMusicBox}]},
 library:{id:'library',title:'撕碎的出生紀錄',subtitle:'EVIDENCE · 帳頁與懷錶',stages:[{id:'ledger',label:'拼回帳頁',mount:mountLedger},{id:'watch',label:'懷錶齒輪',mount:mountWatch}]},
 ballroom:{id:'ballroom',title:'面具下的賓客',subtitle:'EVIDENCE · 面具與光路',stages:[{id:'masks',label:'面具賓客',mount:mountMasks,whisper:true},{id:'light',label:'鏡面光路',mount:mountLight,whisper:true}]},
 hunter:{id:'hunter',title:'玻璃心臟法陣',subtitle:'EVIDENCE · 符文順序',stages:[{id:'runeheart',label:'玻璃心臟法陣',mount:mountRuneHeart}]},
 mine:{id:'mine',title:'重接銀骨蒸汽管',subtitle:'EVIDENCE · 管網與七個名字',stages:[{id:'pipes',label:'蒸汽管網',mount:mountPipes,whisper:true},{id:'names',label:'七個名字',mount:mountNames,whisper:true}]},
 crypt:{id:'crypt',title:'棺中的心跳',subtitle:'EVIDENCE · 符印與拓印',stages:[{id:'rune',label:'棺中的心跳',mount:mountRune},{id:'rubbing',label:'保護咒拓印',mount:mountRubbing,requires:'contract',missing:'拓印需要一張夠韌的紙。妳想起黑鐘書庫暗門後的那份王室契約——它的背面是空白的。回到第一幕，把王室契約收進隨身物品。'}]},
 queen:{id:'queen',title:'王后遺落的記憶',subtitle:'EVIDENCE · 記憶與縫線',stages:[{id:'memory',label:'記憶與物件',mount:mountMemory},{id:'stitch',label:'縫線紋樣',mount:mountStitch,whisper:true}]},
 mirror:{id:'mirror',title:'反寫的見證者手稿',subtitle:'EVIDENCE · 映照與迷廊',stages:[{id:'reflection',label:'反寫手稿',mount:mountReflection},{id:'maze',label:'鏡像迷廊',mount:mountMaze,requires:'watch',missing:'迷廊深處的鏡門停在關上的那一刻。妳需要能讓時間倒走的東西——黑鐘書庫裡那只黃金懷錶。'}]}
};
export const stageLabel=(chapter,stage)=>puzzles[chapter]?.stages.find(s=>s.id===stage)?.label||'';
export const stageKey=(chapter,stage)=>chapter+'.'+stage;

const completed=new Set();
let persist=()=>{},active=null;
// The app registers its save routine here so a finished puzzle is written at once.
export function setPuzzlePersistence(callback){persist=typeof callback==='function'?callback:()=>{};}
// Completions hold chapter ids (whole evidence) and stage keys such as "mine.names" (one stage of two).
export function setPuzzleCompletions(list){completed.clear();for(const id of Array.isArray(list)?list:[])if(puzzles[id]||isStageId(id))completed.add(id);}
const isStageId=id=>{const [chapter,stage]=String(id).split('.');return !!stage&&puzzles[chapter]?.stages.length>1&&puzzles[chapter].stages.some(s=>s.id===stage);};
export function completedPuzzles(){return [...completed];}
export function isPuzzleComplete(id){return completed.has(id);}
export function isStageComplete(chapter,stage){return completed.has(chapter)||completed.has(stageKey(chapter,stage));}
// The stage the player last worked on, {chapter, stage}, kept after the modal closes. Used by the hints.
export function activeStage(){return active;}
export function resetPuzzles(){completed.clear();active=null;resetPipes();}

// Opens a puzzle inside the modal. `success` runs after the puzzle has been recorded as complete.
// Options: `has(item)` checks the inventory, `onStage(stage)` / `onStageDone(stage)` run when a stage
// mounts / is solved, and
// `extra` = {html(stage), bind(stage)} appends the step-aware hint panel below the stage.
export function startPuzzle(id,{modal,success,playCue,fresh=false,has=()=>true,onStage=()=>{},onStageDone=()=>{},extra=null}){
 const entry=puzzles[id];
 const complete=()=>{active=null;completed.add(id);persist();playCue('solve');success();};
 if(!entry){complete();return;}
 const stages=entry.stages,multi=stages.length>1,finished=new Set();
 let current=null;
 // A replay (fresh) ignores saved stages; otherwise a stage counts as done once saved or finished in this run.
 const remaining=()=>stages.filter(s=>!finished.has(s.id)&&(fresh||!isStageComplete(id,s.id)));
 const render=html=>{
  const focused=document.activeElement;
  const attr=['data-pos','data-pipe','data-rune','data-memory','data-reflection','data-pin','data-mask','data-node','data-mirror','data-gear','data-bed','data-rub','data-seal','data-stitch','data-walk','data-stage-pick'].find(k=>focused?.hasAttribute(k));
  const selector=attr?'['+attr+'="'+focused.getAttribute(attr)+'"]':null;
  const others=current&&multi&&!fresh&&remaining().some(s=>s.id!==current.id);
  const subtitle=current&&multi?entry.subtitle.split(' · ')[0]+' · '+current.label:entry.subtitle;
  modal(entry.title,subtitle,'<div class="challenge" data-challenge="'+id+'"'+(current?' data-step="'+current.id+'"':'')+'>'+html+(others?'<button class="text-button stage-switch" data-stage-switch>先做另一道機關 ⟶</button>':'')+'</div>'+(current&&extra?extra.html(current.id):''));
  document.querySelector('[data-stage-switch]')?.addEventListener('click',choose);
  if(current&&extra)extra.bind(current.id);
  if(selector)document.querySelector('.challenge '+selector)?.focus({preventScroll:true});
 };
 const feedback=text=>{const el=document.querySelector('.challenge-feedback');if(el)el.textContent=text;};
 const stageDone=stage=>{
  onStageDone(stage.id);
  finished.add(stage.id);
  if(!fresh&&multi){completed.add(stageKey(id,stage.id));persist();}
  const left=remaining();
  if(!left.length){complete();return;}
  playCue('door');
  if(left.length===1||fresh)run(left[0]);else choose();
 };
 const run=stage=>{
  current=stage;active={chapter:id,stage:stage.id};
  if(stage.requires&&!has(stage.requires)){
   render('<p class="challenge-help">'+stage.missing+'</p><p class="challenge-feedback" role="status">這道機關還不能開始。</p>');
   onStage(stage.id);return;
  }
  stage.mount({render,feedback,playCue,fresh,has,done:()=>stageDone(stage)});
  onStage(stage.id);
 };
 // Both stages are open: the player decides which one to work on, and can switch at any time.
 function choose(){
  current=null;active=null;
  render('<p class="challenge-help">這份證據由兩道機關守著，先做哪一道都可以。卡住的時候，可以先換另一道。</p><div class="stage-picks">'
   +stages.map(s=>{const done=isStageComplete(id,s.id),blocked=s.requires&&!has(s.requires);return '<button class="choice-option stage-pick" data-stage-pick="'+s.id+'"'+(done?' disabled':'')+'>'+s.label+'<small>'+(done?'已完成':blocked?'還缺少需要的物品':'尚未完成')+'</small></button>';}).join('')
   +'</div>');
  document.querySelectorAll('[data-stage-pick]').forEach(button=>button.onclick=()=>run(stages.find(s=>s.id===button.dataset.stagePick)));
 }
 const left=remaining();
 if(!left.length){complete();return;}
 if(left.length===1||fresh||!multi)run(left[0]);else choose();
}
