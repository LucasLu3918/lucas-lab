// Hands-on puzzles repair evidence. Every puzzle is { id, title, subtitle, stages:[{ id, label, mount(ctx) }] }
// where ctx = { render(html), feedback(text), done(), playCue(kind), fresh, has(item) }.
// Completions are stored in the save (engine/save.js); this module only keeps them in memory.
import {preloadImages,placeConcepts,placeZooms} from '../concept-art.js';
import {morph} from './morph.js';
import {hintMarkup,bindHints} from './belfry-hints.js';

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
// The three mirror-compass stages (E9) all wait on the same four marks, so they share one note.
const compassMissing='羅盤的環上刻著四個記號：影、音、重、時。還缺的，回到帳本的背面，從影戲小屋、失聲合唱廳、稱量廳和凝結的三刻取回。';
export const puzzles={
 // The prologue is not a chapter: its completion is stored beside the chapters (engine/save.js).
 prologue:{id:'prologue',title:'音樂盒的搖籃曲',subtitle:'PROLOGUE · 序章',stages:[{id:'musicbox',label:'音樂盒',mount:lazy('musicbox','mountMusicBox')}]},
 library:{id:'library',title:'撕碎的出生紀錄',subtitle:'EVIDENCE · 帳頁與懷錶',stages:[{id:'ledger',morph:true,label:'拼回帳頁',mount:lazy('ledger','mountLedger')},{id:'watch',morph:true,label:'懷錶齒輪',mount:lazy('watch','mountWatch')}]},
 ballroom:{id:'ballroom',title:'面具下的賓客',subtitle:'EVIDENCE · 面具與光路',stages:[{id:'masks',label:'面具賓客',mount:lazy('masks','mountMasks'),whisper:true},{id:'light',morph:true,label:'鏡面光路',mount:lazy('light','mountLight'),whisper:true}]},
 hunter:{id:'hunter',title:'玻璃心臟法陣',subtitle:'EVIDENCE · 符文順序',stages:[{id:'runeheart',morph:true,label:'玻璃心臟法陣',mount:lazy('runeheart','mountRuneHeart')}]},
 mine:{id:'mine',title:'重接銀骨蒸汽管',subtitle:'EVIDENCE · 管網與七個名字',stages:[{id:'pipes',label:'蒸汽管網',mount:lazy('pipes','mountPipes'),whisper:true},{id:'names',label:'七個名字',mount:lazy('names','mountNames'),whisper:true}]},
 crypt:{id:'crypt',title:'棺中的心跳',subtitle:'EVIDENCE · 符印與拓印',stages:[{id:'rune',morph:true,label:'棺中的心跳',mount:lazy('rune','mountRune')},{id:'rubbing',morph:true,label:'保護咒拓印',mount:lazy('rubbing','mountRubbing'),requires:'contract',missing:'拓印需要一張夠韌的紙。妳想起黑鐘書庫暗門後的那份王室契約——它的背面是空白的。回到第一幕，把王室契約收進隨身物品。'}]},
 queen:{id:'queen',title:'王后遺落的記憶',subtitle:'EVIDENCE · 記憶與縫線',stages:[{id:'memory',morph:true,label:'記憶與物件',mount:lazy('memory','mountMemory')},{id:'stitch',morph:true,label:'縫線紋樣',mount:lazy('stitch','mountStitch'),whisper:true}]},
 mirror:{id:'mirror',title:'反寫的見證者手稿',subtitle:'EVIDENCE · 映照與迷廊',stages:[{id:'reflection',morph:true,label:'反寫手稿',mount:lazy('reflection','mountReflection')},{id:'maze',morph:true,label:'鏡像迷廊',mount:lazy('maze','mountMaze'),requires:'watch',missing:'迷廊深處的鏡門停在關上的那一刻。妳需要能讓時間倒走的東西——黑鐘書庫裡那只黃金懷錶。'}]},
 // "帳本的背面" levels (data/abyss.js). `optional` puzzles stay out of the background preload and survive a new journey,
 // because they belong to no act: only the saved list says whether they are done.
 // Its three mechanisms run in the order gears, pendulum (either first), then the star wheel, which `after` keeps closed until both are done.
 belfry:{id:'belfry',title:'逆走鐘樓',subtitle:'ABYSS · 齒輪、擺錘與星輪',optional:true,stages:[
  {id:'belfry-gears',label:'齒輪列',mount:lazy('gears13','mountGears13')},
  {id:'belfry-pendulum',label:'鐘擺',mount:lazy('pendulum','mountPendulum')},
  {id:'belfry-wheel',label:'星輪',mount:lazy('starwheel','mountStarWheel'),after:['belfry-gears','belfry-pendulum'],waiting:'星輪靠齒輪列和鐘擺一起推動。先讓齒輪列咬合、讓鐘擺的節奏對上刻痕，它才會轉動。',
  locked:['星輪不會自己轉。它要靠齒輪列和鐘擺一起推動，兩樣都要先運作起來。',
   '齒輪列與鐘擺兩道可以任意順序完成；兩道都做完，星輪這一道就會打開。',
   '先完成「齒輪列」與「鐘擺」，這一道就會自己打開。']}
 ]},
 // Its three mechanisms share puzzles/prism.js: the filter and the crystal (either first), then the ballroom, which `after` keeps closed until both are done.
 prism:{id:'prism',title:'稜鏡舞廳',subtitle:'ABYSS · 濾鏡、合光與舞者',optional:true,stages:[
  {id:'prism-rays',label:'濾鏡',mount:lazy('prism','mountPrismRays')},
  {id:'prism-blend',label:'合光水晶',mount:lazy('prism','mountPrismBlend')},
  {id:'prism-ballroom',label:'舞廳',mount:lazy('prism','mountPrismBallroom'),after:['prism-rays','prism-blend'],waiting:'舞池的機關還沒有動力。先讓吊燈的光路和合光水晶運作，舞者才會動起來。',
  locked:['舞池的舞者要靠吊燈的光路才會動。光路來自濾鏡，合光水晶負責把光聚在一起。',
   '濾鏡與合光水晶兩道可以任意順序完成；兩道都完成，舞廳才有動力。',
   '先完成「濾鏡」與「合光水晶」，這一道就會自己打開。']}
 ]},
 // Its three mechanisms share puzzles/apothecary.js: the testimony and the vessels (either first), then the mixing, which `after` keeps closed until both are done.
 apothecary:{id:'apothecary',title:'毒蘋果調配室',subtitle:'ABYSS · 證詞、量杯與調色',optional:true,stages:[
  {id:'apothecary-testimony',label:'七人證詞',mount:lazy('apothecary','mountApothecaryTestimony')},
  {id:'apothecary-vessels',label:'回魂藥量杯',mount:lazy('apothecary','mountApothecaryVessels')},
  {id:'apothecary-mixing',label:'調色',mount:lazy('apothecary','mountApothecaryMixing'),after:['apothecary-testimony','apothecary-vessels'],waiting:'配方的顏色要等兩件事完成才看得見：誰拿著那顆蘋果，以及剛好四格的原液。',
  locked:['配方的顏色要靠兩件事：證詞指出誰拿著那顆蘋果，量杯配出剛好四格的原液。',
   '七人證詞與回魂藥量杯兩道可以任意順序完成；兩道都完成，調色才會打開。',
   '先完成「七人證詞」與「回魂藥量杯」，這一道就會自己打開。']}
 ]},
 // Its two mechanisms share puzzles/gallery.js: aligning the panels, then merging them, which `after` keeps closed until the first is done.
 gallery:{id:'gallery',title:'無限鏡廊',subtitle:'ABYSS · 疊放、大小、翻面與排序',optional:true,stages:[
  {id:'gallery-align',label:'對位',mount:lazy('gallery','mountGalleryAlign')},
  {id:'gallery-merge',label:'合一',mount:lazy('gallery','mountGalleryMerge'),after:['gallery-align'],waiting:'最後一段紅線要等前面的畫格對位以後才看得見。先把月亮和提燈的紅線接好。',
  locked:['最後一段紅線要等前面的畫格對位，紅線接上了才看得見。現在還沒有，所以這一道暫時打不開。',
   '對位做完後，月亮和提燈之間的紅線會接上，合一才有東西可以接。',
   '先完成「對位」（本關的第一道），這一道就會自己打開。']}
 ]},
 // The box: one mechanism per face, all in puzzles/box.js. `requires` may name a finished level (E1-E4) as well as an item,
 // and a list means all of them. The cipher disc sits inside the box, so `after` keeps it closed until the other five faces are open.
 box:{id:'box',title:'七重魔鏡匣',subtitle:'ABYSS · 六面與一張字條',optional:true,stages:[
  {id:'box-time',label:'時辰面',mount:lazy('box','mountBoxTime'),requires:'belfry',missing:'撥盤要用時辰環才轉得動。時辰環在「逆走鐘樓」（E1）的最深處，回到帳本的背面把它取回來。',
   locked:['撥盤要用時辰環才轉得動。這一面的刻度，要等時辰環裝上去才看得出來。',
    '時辰環是 E1「逆走鐘樓」的獎品，要把那一關整個翻完才會到手。',
    '回到帳本的背面，先完成「逆走鐘樓」（E1），再回來打開這一面。']},
  {id:'box-light',label:'光之面',mount:lazy('box','mountBoxLight'),requires:'prism',missing:'這一面要用稜鏡才看得見刻線。稜鏡在「稜鏡舞廳」（E2），回到帳本的背面把它取回來。',
   locked:['這一面的刻線藏在光裡，沒有稜鏡就只是一片暗色。',
    '稜鏡是 E2「稜鏡舞廳」的獎品，要把那一關整個翻完才會到手。',
    '回到帳本的背面，先完成「稜鏡舞廳」（E2），再回來打開這一面。']},
  {id:'box-apple',label:'蘋果鎖',mount:lazy('box','mountBoxApple'),requires:'apothecary',missing:'蘋果鎖要用回魂藥才打得開。回魂藥在「毒蘋果調配室」（E3），回到帳本的背面把它取回來。',
   locked:['蘋果鎖的鎖芯是乾的，要用回魂藥潤過才會轉。',
    '回魂藥是 E3「毒蘋果調配室」的獎品，要把那一關整個翻完才會到手。',
    '回到帳本的背面，先完成「毒蘋果調配室」（E3），再回來打開這一面。']},
  {id:'box-thread',label:'鏡中鏡',mount:lazy('box','mountBoxThread'),requires:'gallery',missing:'這一面要把紅線穿過鏡孔。紅線在「無限鏡廊」（E4），回到帳本的背面把它取回來。',
   locked:['這一面要把紅線穿過鏡孔，手上沒有紅線就穿不過去。',
    '紅線是 E4「無限鏡廊」的獎品，要把那一關整個翻完才會到手。',
    '回到帳本的背面，先完成「無限鏡廊」（E4），再回來穿這條線。']},
  {id:'box-shards',label:'碎片面',mount:lazy('box','mountBoxShards')},
  {id:'box-cipher',label:'密碼盤',mount:lazy('box','mountBoxCipher'),requires:['belfry','prism','apothecary','gallery'],missing:'字條上的密文要用四個關卡各給的一個記號才讀得出來：時辰環、稜鏡、回魂藥、紅線。還缺的，回到帳本的背面取回。',after:['box-time','box-light','box-apple','box-thread','box-shards'],waiting:'字條壓在匣子的最裡面。先把其他五面都打開。',
  locked:['字條上的密文要用四個關卡各給的一個記號才讀得出來：時辰環、稜鏡、回魂藥、紅線。',
   '字條壓在匣子最裡面，要先把其他五面都打開；缺了任何一個記號，密文都讀不出來。',
   '先完成「逆走鐘樓」「稜鏡舞廳」「毒蘋果調配室」「無限鏡廊」四關，再把時辰面、光之面、蘋果鎖、鏡中鏡與碎片面五面打開，密碼盤就會自己打開。']}
 ]},
 // The shadow cabin (the breather): turn a carving until its shadow fills the outline on the wall. The second carving waits for the first.
 shadow:{id:'shadow',title:'影戲小屋',subtitle:'ABYSS · 木雕與牆上的影子',optional:true,stages:[
  {id:'shadow-key',label:'鑰匙的影子',mount:lazy('shadow','mountShadowKey')},
  {id:'shadow-queen',label:'戴冠的影子',mount:lazy('shadow','mountShadowQueen'),after:['shadow-key'],waiting:'這塊木雕要等第一塊的影子對好，才會被擺到燈前。',
  locked:['第二塊木雕要等第一塊的影子對好，才會被擺到燈前。',
   '兩塊木雕是依序擺上的：先對好鑰匙的影子，戴冠的影子才會出現在牆上。',
   '先完成「鑰匙的影子」，這一道就會自己打開。']}
 ]},
 // The silent choir hall (E6). The pipes and the rhythm can be done in either order; the hymn needs both.
 choir:{id:'choir',title:'失聲合唱廳',subtitle:'ABYSS · 管長、拍子與聖歌',optional:true,stages:[
  {id:'choir-pipes',label:'管長與音高',mount:lazy('choir','mountChoirPipes')},
  {id:'choir-rhythm',label:'三個聲部',mount:lazy('choir','mountChoirRhythm')},
  {id:'choir-hymn',label:'聖歌',mount:lazy('choir','mountChoirHymn'),after:['choir-pipes','choir-rhythm'],waiting:'聖歌要用前兩道機關的結果：三根管，和三個聲部的起拍。先把它們都完成。',
  locked:['聖歌要用前兩道的結果：三根管的長度，和三個聲部的起拍。',
   '管長與音高、三個聲部兩道可以任意順序完成；兩道都做完，聖歌才有材料可以唱。',
   '先完成「管長與音高」與「三個聲部」，這一道就會自己打開。']}
 ]},
 // The weighing hall (E7). The two pages can be done in either order; the last scale needs both.
 scale:{id:'scale',title:'稱量廳',subtitle:'ABYSS · 天秤與四樣東西',optional:true,stages:[
  {id:'scale-fruit',label:'蘋果與鏡',mount:lazy('scale','mountScaleFruit')},
  {id:'scale-thorn',label:'玫瑰與匕首',mount:lazy('scale','mountScaleThorn')},
  {id:'scale-final',label:'最後一台',mount:lazy('scale','mountScaleFinal'),after:['scale-fruit','scale-thorn'],waiting:'最後一台要用前兩頁算出的四個重量。先把兩頁都配平。',
   locked:['最後一台的左盤是五面鏡加兩朵玫瑰，要先知道鏡和玫瑰各多重。這兩個重量不在這一台上，而是藏在前兩頁的天秤裡。',
    '前兩頁各自配平之後，四樣東西的重量就都算得出來：蘋果與鏡一頁，玫瑰與匕首一頁。缺了任何一頁，右盤要放什麼都算不出來。',
    '先到「蘋果與鏡」和「玫瑰與匕首」兩道機關，把天秤各自配平。兩頁都完成後，這一台會自己打開。']}
 ]},
 // The frozen moments (E8). Naming the guests and ordering the pictures can be done in either order; the last page needs both.
 frozen:{id:'frozen',title:'凝結的三刻',subtitle:'ABYSS · 停住的舞會',optional:true,stages:[
  {id:'frozen-faces',label:'誰站在哪裡',mount:lazy('frozen','mountFrozenFaces')},
  {id:'frozen-order',label:'三張畫的先後',mount:lazy('frozen','mountFrozenOrder')},
  {id:'frozen-final',label:'摔杯的人',mount:lazy('frozen','mountFrozenFinal'),after:['frozen-faces','frozen-order'],waiting:'要先知道每位賓客是誰，也要排好三張畫的時間。先把前兩道做完。',
   locked:['摔杯的人要先知道兩件事：每位賓客戴的是哪種面具、站在哪裡，以及三張畫的時間先後。這兩件事都在前兩道機關裡。',
    '前兩道做完後，才能在每一刻看出握杯的是誰，再對上賓客名冊。少了時間先後，三張畫就只是三張畫。',
    '先完成「誰站在哪裡」與「三張畫的先後」，這一道就會自己打開。']}
 ]},
 // The mirror compass (E9). The four rings carry the marks of E-X, E6, E7 and E8, so all four levels must be done. The two pairs can be done in either order; the last page needs both.
 compass:{id:'compass',title:'魔鏡羅盤',subtitle:'ABYSS · 四環的記號',optional:true,stages:[
  {id:'compass-inner',label:'內圈兩環',mount:lazy('compass','mountCompassInner'),requires:['shadow','choir','scale','frozen'],missing:compassMissing,
   locked:['羅盤最裡面的兩環刻著「影」與「音」。這兩個記號分別是在影戲小屋（E-X）與失聲合唱廳（E6）取回的。',
    '四個記號要齊了羅盤才會轉動：影、音、重、時。還缺哪一個，就表示那道關卡還沒翻開；帳冊背面的目錄會標出每一道是否已完成。',
    '回到帳本的背面，依序完成影戲小屋（E-X）、失聲合唱廳（E6）、稱量廳（E7）與凝結的三刻（E8）。四道都完成後，這一道會自己打開。']},
  {id:'compass-outer',label:'外圈兩環',mount:lazy('compass','mountCompassOuter'),requires:['shadow','choir','scale','frozen'],missing:compassMissing,
   locked:['羅盤外圈的兩環刻著「重」與「時」。這兩個記號分別是在稱量廳（E7）與凝結的三刻（E8）取回的。',
    '四個記號要齊了羅盤才會轉動：影、音、重、時。還缺哪一個，就表示那道關卡還沒翻開；帳冊背面的目錄會標出每一道是否已完成。',
    '回到帳本的背面，依序完成影戲小屋（E-X）、失聲合唱廳（E6）、稱量廳（E7）與凝結的三刻（E8）。四道都完成後，這一道會自己打開。']},
  {id:'compass-final',label:'四環合一',mount:lazy('compass','mountCompassFinal'),requires:['shadow','choir','scale','frozen'],missing:compassMissing,after:['compass-inner','compass-outer'],waiting:'四個環要一起轉，得先分別讓兩個內環和兩個外環對準指針。',
   locked:['四個環要一起轉，內圈與外圈各自都要先對準指針。它們還沒完成，所以這一道暫時打不開。',
    '內圈要先有「影」與「音」，外圈要先有「重」與「時」。四個記號都取回之後，內外兩對才能分別轉好。',
    '先完成內圈兩環與外圈兩環。兩對的記號來自影戲小屋、失聲合唱廳、稱量廳與凝結的三刻，四道都完成後，這一道也會自己打開。']}
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
 // `requires` is an item, a finished puzzle, or a list of them (all needed).
 const owns=need=>[].concat(need||[]).every(item=>has(item)||completed.has(item));
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
  const markup='<div class="challenge" data-challenge="'+id+'"'+(current?' data-step="'+current.id+'"':'')+'>'+stageArt(current)+html+(others?'<button class="text-button stage-switch" data-stage-switch>先做另一道機關 ⟶</button>':'')+'</div>'+(current&&extra?extra.html(current.id):'');
  // A stage that opts in (`morph`) patches its board in place while the player plays; opening or switching a stage still draws fresh.
  const body=document.querySelector('#modal-body'),same=current?.morph&&body?.querySelector('.challenge[data-challenge="'+id+'"][data-step="'+current.id+'"]');
  if(same){morph(body,markup);placeConcepts(body);placeZooms(body);}else modal(entry.title,subtitle,markup);
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
 // A locked stage shows why it is shut. A stage with `locked` also offers candle hints (three tiers, see belfry-hints.js) for the way in:
 // they stay until the stage opens, and the idle whisper works here as it does on a board.
 const showLocked=(stage,text,stillLocked)=>{
  if(!stage.locked){render('<p class="challenge-help">'+text+'</p><p class="challenge-feedback" role="status">這道機關還不能開始。</p>');return;}
  render('<p class="challenge-help">'+text+'</p>'+hintMarkup+'<p class="challenge-feedback" role="status">這道機關還不能開始。</p>');
  const button=document.getElementById('bf-hint');
  const hints=bindHints({hints:{[stage.id]:stage.locked},currentStep:()=>stillLocked()?stage.id:null,alive:()=>button.isConnected});
  hints.changed();
 };
 const run=stage=>{
  current=stage;active={chapter:id,stage:stage.id};preloadImages([stageArtSrc(stage)]);
  const stillLocked=()=>waitingOn(stage).length>0||!owns(stage.requires);
  if(waitingOn(stage).length){
   showLocked(stage,stage.waiting,stillLocked);
   onStage(stage.id);return;
  }
  if(!owns(stage.requires)){
   showLocked(stage,stage.missing,stillLocked);
   onStage(stage.id);return;
  }
  stage.mount({render,feedback,playCue,fresh,has,done:()=>stageDone(stage)});
  onStage(stage.id);
 };
 // Both stages are open: the player decides which one to work on, and can switch at any time.
 function choose(){
  current=null;active=null;
  render('<p class="challenge-help">這份證據由'+['','一','兩','三','四','五','六'][Math.min(6,entry.stages.length)]+'道機關守著，'+(entry.stages.some(item=>item.after)?'沒有鎖住的可以先做哪一道都行；鎖住的要等前面的完成。':'先做哪一道都可以。卡住的時候，可以先換另一道。')+'</p><div class="stage-picks">'
   +stages.map(s=>{const done=isStageComplete(id,s.id),blocked=!owns(s.requires),waiting=waitingOn(s).length>0;return '<button class="choice-option stage-pick" data-stage-pick="'+s.id+'"'+(done?' disabled':'')+'><img class="stage-thumb" src="assets/puzzles/thumbs/'+s.id+'.webp" alt="" width="112" height="64" decoding="async" draggable="false"><span class="stage-pick-text">'+s.label+'<small>'+(done?'已完成':waiting?'要先完成前面的機關':blocked?'還缺少需要的物品':'尚未完成')+'</small></span></button>';}).join('')
   +'</div>');
  document.querySelectorAll('[data-stage-pick]').forEach(button=>button.onclick=()=>run(stages.find(s=>s.id===button.dataset.stagePick)));
 }
 const left=remaining();
 if(!left.length){complete();return;}
 if(left.length===1||fresh||!multi)run(left[0]);else choose();
}
