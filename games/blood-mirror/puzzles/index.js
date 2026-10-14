// Hands-on puzzles repair evidence. Every puzzle is { id, title, subtitle, stages:[{ id, label, mount(ctx) }] }
// where ctx = { render(html), feedback(text), done(), playCue(kind), fresh, has(item) }.
// Completions are stored in the save (engine/save.js); this module only keeps them in memory.
import {preloadImages} from '../concept-art.js';

// A stage module is imported the first time its stage opens, so the first screen fetches no puzzle code.
// Once loaded, mount runs synchronously, exactly as before. A failed import shows a notice in the modal.
const loaded={};
const lazy=(file,mountName)=>{
 const load=()=>loaded[file]?Promise.resolve(loaded[file]):import('./'+file+'.js').then(module=>(loaded[file]=module));
 const mount=ctx=>{
  if(loaded[file])return loaded[file][mountName](ctx);
  ctx.render('<p class="challenge-help">機關正在組裝，請稍候。</p>');
  return load().then(module=>module[mountName](ctx)).catch(error=>{console.error(error);ctx.render('<p class="challenge-help">這道機關暫時無法載入。請重新整理頁面後再試一次。</p>');});
 };
 mount.preload=load;
 return mount;
};

// Each evidence puzzle has one or more stages (機關). Stage ids match the chapter data's `stages`, which
// also drives the step-aware hints. Acts with two stages let the player pick either one first (plan r8).
// `requires` names an item from an earlier act that the stage needs (plan r10); `whisper` marks a known
// bottleneck where the mirror offers its first hint after three quiet minutes (plan r1).
export const puzzles={
 // The prologue is not a chapter: its completion is stored beside the chapters (engine/save.js).
 prologue:{id:'prologue',title:'音樂盒的搖籃曲',subtitle:'PROLOGUE · 序章',stages:[{id:'musicbox',label:'音樂盒',mount:lazy('musicbox','mountMusicBox')}]},
 library:{id:'library',title:'撕碎的出生紀錄',subtitle:'EVIDENCE · 帳頁與懷錶',stages:[{id:'ledger',label:'拼回帳頁',mount:lazy('ledger','mountLedger')},{id:'watch',label:'懷錶齒輪',mount:lazy('watch','mountWatch')}]},
 ballroom:{id:'ballroom',title:'面具下的賓客',subtitle:'EVIDENCE · 面具與光路',stages:[{id:'masks',label:'面具賓客',mount:lazy('masks','mountMasks'),whisper:true},{id:'light',label:'鏡面光路',mount:lazy('light','mountLight'),whisper:true}]},
 hunter:{id:'hunter',title:'玻璃心臟法陣',subtitle:'EVIDENCE · 符文順序',stages:[{id:'runeheart',label:'玻璃心臟法陣',mount:lazy('runeheart','mountRuneHeart')}]},
 mine:{id:'mine',title:'重接銀骨蒸汽管',subtitle:'EVIDENCE · 管網與七個名字',stages:[{id:'pipes',label:'蒸汽管網',mount:lazy('pipes','mountPipes'),whisper:true},{id:'names',label:'七個名字',mount:lazy('names','mountNames'),whisper:true}]},
 crypt:{id:'crypt',title:'棺中的心跳',subtitle:'EVIDENCE · 符印與拓印',stages:[{id:'rune',label:'棺中的心跳',mount:lazy('rune','mountRune')},{id:'rubbing',label:'保護咒拓印',mount:lazy('rubbing','mountRubbing'),requires:'contract',missing:'拓印需要一張夠韌的紙。妳想起黑鐘書庫暗門後的那份王室契約——它的背面是空白的。回到第一幕，把王室契約收進隨身物品。'}]},
 queen:{id:'queen',title:'王后遺落的記憶',subtitle:'EVIDENCE · 記憶與縫線',stages:[{id:'memory',label:'記憶與物件',mount:lazy('memory','mountMemory')},{id:'stitch',label:'縫線紋樣',mount:lazy('stitch','mountStitch'),whisper:true}]},
 mirror:{id:'mirror',title:'反寫的見證者手稿',subtitle:'EVIDENCE · 映照與迷廊',stages:[{id:'reflection',label:'反寫手稿',mount:lazy('reflection','mountReflection')},{id:'maze',label:'鏡像迷廊',mount:lazy('maze','mountMaze'),requires:'watch',missing:'迷廊深處的鏡門停在關上的那一刻。妳需要能讓時間倒走的東西——黑鐘書庫裡那只黃金懷錶。'}]},
 // "帳本的背面" levels (data/abyss.js). `optional` puzzles stay out of the background preload and survive a new journey,
 // because they belong to no act: only the saved list says whether they are done.
 // Its three mechanisms run in the order gears, pendulum (either first), then the star wheel, which `after` keeps closed until both are done.
 belfry:{id:'belfry',title:'逆走鐘樓',subtitle:'ABYSS · 齒輪、擺錘與星輪',optional:true,stages:[
  {id:'belfry-gears',label:'齒輪列',mount:lazy('gears13','mountGears13')},
  {id:'belfry-pendulum',label:'鐘擺',mount:lazy('pendulum','mountPendulum')},
  {id:'belfry-wheel',label:'星輪',mount:lazy('starwheel','mountStarWheel'),after:['belfry-gears','belfry-pendulum'],waiting:'星輪靠齒輪列和鐘擺一起推動。先讓齒輪列咬合、讓鐘擺的節奏對上刻痕，它才會轉動。'}
 ]},
 // Its three mechanisms share puzzles/prism.js: the filter and the crystal (either first), then the ballroom, which `after` keeps closed until both are done.
 prism:{id:'prism',title:'稜鏡舞廳',subtitle:'ABYSS · 濾鏡、合光與舞者',optional:true,stages:[
  {id:'prism-rays',label:'濾鏡',mount:lazy('prism','mountPrismRays')},
  {id:'prism-blend',label:'合光水晶',mount:lazy('prism','mountPrismBlend')},
  {id:'prism-ballroom',label:'舞廳',mount:lazy('prism','mountPrismBallroom'),after:['prism-rays','prism-blend'],waiting:'舞池的機關還沒有動力。先讓吊燈的光路和合光水晶運作，舞者才會動起來。'}
 ]},
 // Its three mechanisms share puzzles/apothecary.js: the testimony and the vessels (either first), then the mixing, which `after` keeps closed until both are done.
 apothecary:{id:'apothecary',title:'毒蘋果調配室',subtitle:'ABYSS · 證詞、量杯與調色',optional:true,stages:[
  {id:'apothecary-testimony',label:'七人證詞',mount:lazy('apothecary','mountApothecaryTestimony')},
  {id:'apothecary-vessels',label:'回魂藥量杯',mount:lazy('apothecary','mountApothecaryVessels')},
  {id:'apothecary-mixing',label:'調色',mount:lazy('apothecary','mountApothecaryMixing'),after:['apothecary-testimony','apothecary-vessels'],waiting:'配方的顏色要等兩件事完成才看得見：誰拿著那顆蘋果，以及剛好四格的原液。'}
 ]}
};
// Painted close-up at the head of each mechanism (assets/puzzles/<stage id>.webp, 960x411).
const stageArtSrc=stage=>stage?'assets/puzzles/'+stage.id+'.webp':'';
const stageArt=stage=>stage?'<img class="stage-art" src="'+stageArtSrc(stage)+'" alt="" width="960" height="411" decoding="async" draggable="false">':'';
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
// A stage module that was never opened holds no state to reset.
export function resetPuzzles(){for(const id of [...completed])if(!puzzles[String(id).split('.')[0]]?.optional)completed.delete(id);active=null;loaded.pipes?.resetPipes();}
// Fetches every stage module in the background once the player is in a scene; a failed fetch is retried on open.
export function preloadStages(){for(const entry of Object.values(puzzles))if(!entry.optional)for(const stage of entry.stages)stage.mount.preload?.().catch(()=>{});}

// Opens a puzzle inside the modal. `success` runs after the puzzle has been recorded as complete.
// Options: `has(item)` checks the inventory, `onStage(stage)` / `onStageDone(stage)` run when a stage
// mounts / is solved, and
// `extra` = {html(stage), bind(stage)} appends the step-aware hint panel below the stage, and
// `stageLines` = {<stage id>: html} shows a few lines of story after that stage is solved (not on a replay), before the next one.
export function startPuzzle(id,{modal,success,playCue,fresh=false,has=()=>true,onStage=()=>{},onStageDone=()=>{},extra=null,stageLines={}}){
 const entry=puzzles[id];
 const complete=()=>{active=null;completed.add(id);persist();playCue('solve');success();};
 if(!entry){complete();return;}
 const stages=entry.stages,multi=stages.length>1,finished=new Set();
 let current=null;
 // A stage with `after` stays closed until the stages it names are done (in this run, or saved when not replaying).
 const stageIsDone=name=>finished.has(name)||(!fresh&&isStageComplete(id,name));
 const waitingOn=stage=>(stage.after||[]).filter(name=>!stageIsDone(name));
 // A replay (fresh) ignores saved stages; otherwise a stage counts as done once saved or finished in this run.
 const remaining=()=>stages.filter(s=>!finished.has(s.id)&&(fresh||!isStageComplete(id,s.id)));
 const render=html=>{
  const focused=document.activeElement;
  const attr=['data-pos','data-pipe','data-rune','data-memory','data-reflection','data-pin','data-mask','data-node','data-mirror','data-gear','data-bed','data-rub','data-seal','data-stitch','data-walk','data-stage-pick'].find(k=>focused?.hasAttribute(k));
  const selector=attr?'['+attr+'="'+focused.getAttribute(attr)+'"]':null;
  const others=current&&multi&&!fresh&&remaining().some(s=>s.id!==current.id);
  const subtitle=current&&multi?entry.subtitle.split(' · ')[0]+' · '+current.label:entry.subtitle;
  modal(entry.title,subtitle,'<div class="challenge" data-challenge="'+id+'"'+(current?' data-step="'+current.id+'"':'')+'>'+stageArt(current)+html+(others?'<button class="text-button stage-switch" data-stage-switch>先做另一道機關 ⟶</button>':'')+'</div>'+(current&&extra?extra.html(current.id):''));
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
  const next=()=>{if(left.length===1||fresh)run(left[0]);else choose();};
  if(stageLines[stage.id]&&!fresh){
   render(stageLines[stage.id]+'<button class="primary-button" data-stage-note>繼續 ⟶</button>');
   const go=document.querySelector('[data-stage-note]');go.onclick=next;go.focus({preventScroll:true});
   return;
  }
  next();
 };
 const run=stage=>{
  current=stage;active={chapter:id,stage:stage.id};preloadImages([stageArtSrc(stage)]);
  if(waitingOn(stage).length){
   render('<p class="challenge-help">'+stage.waiting+'</p><p class="challenge-feedback" role="status">這道機關還不能開始。</p>');
   onStage(stage.id);return;
  }
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
  render('<p class="challenge-help">這份證據由'+['','一','兩','三'][Math.min(3,entry.stages.length)]+'道機關守著，'+(entry.stages.some(item=>item.after)?'沒有鎖住的可以先做哪一道都行；鎖住的要等前面的完成。':'先做哪一道都可以。卡住的時候，可以先換另一道。')+'</p><div class="stage-picks">'
   +stages.map(s=>{const done=isStageComplete(id,s.id),blocked=s.requires&&!has(s.requires),waiting=waitingOn(s).length>0;return '<button class="choice-option stage-pick" data-stage-pick="'+s.id+'"'+(done?' disabled':'')+'><img class="stage-thumb" src="assets/puzzles/thumbs/'+s.id+'.webp" alt="" width="112" height="64" decoding="async" draggable="false"><span class="stage-pick-text">'+s.label+'<small>'+(done?'已完成':waiting?'要先完成前面的機關':blocked?'還缺少需要的物品':'尚未完成')+'</small></span></button>';}).join('')
   +'</div>');
  document.querySelectorAll('[data-stage-pick]').forEach(button=>button.onclick=()=>run(stages.find(s=>s.id===button.dataset.stagePick)));
 }
 const left=remaining();
 if(!left.length){complete();return;}
 if(left.length===1||fresh||!multi)run(left[0]);else choose();
}
