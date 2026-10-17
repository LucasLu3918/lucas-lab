import {settingsMarkup,playlogPanelMarkup,epilogueMarkup,recapMarkup,fateMarkup,replayPickerMarkup,endingReplayMarkup,stageHintMarkup as stageHintHtml,prerequisiteNote,evidenceGateMarkup,solvedMarkup,codeSealMarkup,sequenceSealMarkup,questionSealMarkup,nameSealMarkup,sealSuccessMarkup,storyBody,guideBody,prologueBody,chapterIntroBody} from './views/modals.js';
import {createMixer} from './audio/mixer.js';import {createSfx} from './audio/sfx.js';import {createAmbience} from './audio/ambience.js';
import {journeyGuide,journalChapters,spotText,memoryCollection,journeyRecap,dialogueLines,sceneMet,readLog} from './journey.js';import {exportSave,parseSave,loadSave,backupSave,writeSave,SAVE_KEY} from './engine/index.js';import {ledgerMarkup} from './puzzles/ledger-art.js';import {createPlaylog,summarizePlaylog} from './playlog.js';
import {createGameUI,createDialogueBox} from './ui.js';
import {speakers} from './data/chapters/index.js';
import {abyss} from './data/abyss.js';
import {conceptMarkup,itemArtwork,placeConcepts,placeZooms,preloadImages,preloadConcepts} from './concept-art.js';
import {rooms,items,endings,initialState,inspect,collect,solve,travel,chooseEnding,journeyComplete,choose,choiceVariant,visibleSpots,queenResponse,queenResponses,unlockText,markGlow,restoreClues,collectShard,unlockAchievements,achievements,shardIds,PROLOGUE_SHARD,clueWords,judgeInterrogation} from './engine/index.js';
import {interrogationPage,interrogationNotice,hintFill,nextEmpty} from './puzzles/interrogation.js';
import {secretEpilogue} from './data/secret-epilogue.js';
import {clueGroups} from './data/clues.js';
import {isPuzzleComplete as isChallengeComplete,isStageComplete,activeStage,stageLabel,puzzles as challengeRegistry,startPuzzle as startChallenge,preloadStages,resetPuzzles as resetChallenges,completedPuzzles as completedChallenges,setPuzzleCompletions as setChallenges,setPuzzlePersistence} from './puzzles/index.js';
import {createSoundtrack} from './soundtrack.js';
import {createGallery} from './gallery.js';
import {icon,spotIcon,itemIcon,hydrateIcons,enableButtonArrows} from './icons.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const INVENTORY_UPDATED_EVENT='blood-mirror:inventory-updated',INVENTORY_SELECTED_EVENT='blood-mirror:inventory-selected';
function emitInventoryUpdate(target,inventory){target.dispatchEvent(new CustomEvent(INVENTORY_UPDATED_EVENT,{detail:{inventory:[...inventory]}}));}
function readInventorySelection(event){return typeof event.detail?.id==='string'?event.detail.id:null;}
const loaded=loadSave(localStorage);let state=loaded.state;setChallenges(loaded.puzzles);setPuzzlePersistence(()=>save());
// A save written by a newer build stays untouched: this page never writes until it is reloaded.
let saveBlocked=loaded.newer;if(!saveBlocked){if(!loaded.recovered)backupSave(localStorage);if(loaded.migrated||loaded.recovered)writeSave(state,completedChallenges(),localStorage);}
let view='home',lastFocus=null,lastFocusSelector=null,toastTimeout,activeNodes=[],saveFailed=false;
let gameIslandModule=null,gameIslandPromise=null,inventoryIslandLoaded=false,inventoryIslandLoading=false,gameModalIslandUnmount=null;
const mixer=createMixer();const soundtrack=createSoundtrack({mixer});const sfx=createSfx(mixer);const ambience=createAmbience(mixer);
const ui=createGameUI();
// The feedback layer (juice.js) loads on the first pointer or key press, outside the page's initial request budget.
let juice=null,juiceRequested=false;
const loadJuice=()=>{if(juiceRequested)return;juiceRequested=true;import('./juice.js').then(({createJuice})=>{juice=createJuice({motion:()=>!ui.preferences.reduceMotion,haptics:()=>ui.preferences.vibrate});}).catch(()=>{juiceRequested=false;});};
addEventListener('pointerdown',loadJuice,{capture:true,passive:true});addEventListener('keydown',loadJuice,{capture:true});
const playlog=createPlaylog();let loggedRoom=null;const log=(kind,data={})=>playlog.record(kind,{room:state.room,...data});const restoredRoom=(index=state.room)=>isChallengeComplete(rooms[index].id)||state.solved.includes(index);
document.body.dataset.view='home';
const currentTrack=()=>['home','gallery'].includes(view)?'home':view==='ending'?(state.ending||'dawn'):rooms[state.room].id;
const save=()=>{if(saveBlocked){$('#save-indicator').textContent='存檔來自較新版本，請重新整理頁面';return;}const fresh=unlockAchievements(state,completedChallenges());if(fresh.length)toast('成就解鎖：'+fresh.map(item=>item.title).join('、'));saveFailed=!writeSave(state,completedChallenges(),localStorage);const message=saveFailed?'無法存檔，請保持本頁開啟':'進度已儲存在此裝置';if($('#save-indicator').textContent!==message)$('#save-indicator').textContent=message;};
const formatTime=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(Math.floor(n%60)).padStart(2,'0')}`;
function toast(text){const box=$('#toast');if($('dialog[open]')){juice?.raise(box);void box.offsetWidth;}box.textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('visible'),3200)}
function unmountGameModalIsland(){gameModalIslandUnmount?.();gameModalIslandUnmount=null;}
function modal(title,eyebrow,html){unmountGameModalIsland();const d=$('#modal'),opening=!d.open,titleChanged=$('#modal-title').textContent!==title;if(opening){lastFocus=document.activeElement;const key=['data-clue','data-spot','data-item','data-artwork','data-gallery-filter'].find(name=>lastFocus?.hasAttribute(name));lastFocusSelector=key?`[${key}="${lastFocus.getAttribute(key)}"]`:null;}$('#modal-title').textContent=title;$('#modal-eyebrow').textContent=eyebrow;$('#modal-body').innerHTML=html;placeConcepts($('#modal-body'));placeZooms($('#modal-body'));if(opening)d.showModal();if(opening||titleChanged)$('#modal-body').scrollTop=0;if(!opening&&!d.contains(document.activeElement))$('#modal-title').focus({preventScroll:true});}
function restoreFocus(){if($('#modal').open)return;if(view==='ending'){$('#ending-title').focus({preventScroll:true});return;}const target=lastFocus?.isConnected?lastFocus:lastFocusSelector?$(lastFocusSelector):null;if(target?.getClientRects().length)target.focus({preventScroll:true});}
function closeModal(){$('#modal').close();restoreFocus();}
$('#modal-close').onclick=closeModal;
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal()}});
$('#modal').addEventListener('close',restoreFocus);$('#modal').addEventListener('close',()=>mixer.setFocus(false));
$('#modal').addEventListener('close',unmountGameModalIsland);
function showView(next){ui.closeMenu();document.body.dataset.view=next;if(view==='gallery')gallery.stopPreview();if($('#modal').open)closeModal();view=next;['home','game','ending','gallery'].forEach(id=>$('#'+id).classList.toggle('hidden',id!==next));$('#main').classList.remove('view-enter');void $('#main').offsetWidth;$('#main').classList.add('view-enter');window.scrollTo({top:0,behavior:'instant'});if(next==='game'){renderGame();preloadStages();}if(next==='home')renderHome();if(next==='ending'){renderEnding();$('#ending-title').setAttribute('tabindex','-1');$('#ending-title').focus({preventScroll:true});}if(next==='gallery'){gallery.render();$('#gallery-return').textContent=galleryReturn==='home'?'← 返回首頁':'← 返回旅程';}soundtrack.select(currentTrack());if(next!=='game')ambience.stop();$$('#game-nav [data-action]').forEach(button=>{if(button.dataset.action===(next==='home'?'home':next))button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});}
function renderHome(){renderResume();const hasSave=state.started;$('#start').classList.toggle('primary-button',!hasSave);$('#start').classList.toggle('text-button',hasSave);$('#continue').classList.toggle('primary-button',hasSave);$('#continue').classList.toggle('text-button',!hasSave);$('#continue').textContent=state.ending?'回看已完成的結局 ⟶':`繼續${rooms[state.room].title} ⟶`;$('#home-progress').textContent=hasSave?`已找到 ${state.solved.length} / ${rooms.length} 份真相 · 結局收藏 ${state.endings.length} / 3${state.endings.length?` · 人物記憶 ${state.memories?.length||0} / ${memoryCollection(state).length}`:''}`:'觀察光點 → 收取物品 → 解開封印';$('#continue').classList.toggle('hidden',!hasSave);$('#start').textContent=hasSave?'開始新旅程 ⟶':'踏入魔鏡 ⟶';$('#chapter-cards').innerHTML=rooms.map((r,i)=>`<button class="chapter-card${i>state.unlocked?' locked':''}" data-chapter="${i}" >${i<=state.unlocked?`<img class="card-image" loading="lazy" src="assets/${r.image}" alt="">`:''}<span class="card-number">0${i+1}</span><span class="card-status">${icon(state.solved.includes(i)?'gem':i<=state.unlocked?'mirror':'lock')}${state.solved.includes(i)?'已解開':i<=state.unlocked?'可探索':'封印中'}</span><h3>${r.title}</h3><p>${r.subtitle}</p>${i<=state.unlocked?'<span class="card-arrow">⟶</span>':''}</button>`).join('');$$('[data-chapter]').forEach(el=>el.onclick=()=>{const i=Number(el.dataset.chapter);if(i>state.unlocked){toast('這道門仍被封印。先完成前面的章節。');return}state.started=true;state.ending=null;travel(state,i);save();showView('game');});renderAbyssEntry();}
// "帳本的背面" (鏡淵): optional expert levels outside the seven acts. The home page offers the way in after any ending;
// the area itself (abyss.js) loads only when it is opened.
function renderAbyssEntry(){
 const done=abyss.levels.filter(level=>isChallengeComplete(level.puzzle)).length;
 $('#abyss-entry').classList.toggle('hidden',!(state.endings.length||done));
 $('#abyss-progress').textContent='已翻開 '+done+' / '+abyss.levels.length+' 頁';
}
function openAbyssArea(){import('./abyss.js').then(({openAbyss})=>openAbyss({modal,closeModal,playCue,toast,options:challengeOptions,refresh:renderAbyssEntry})).catch(error=>{console.error(error);toast('帳冊暫時無法翻開，請重新整理頁面後再試一次。');});}
// Character portraits (人物立繪) load only when a spot that shows one is opened.
const portraitMarkup=(name,alt)=>`<img class="modal-portrait" src="assets/portraits/${name}.webp" alt="${alt?alt+'：':''}${speakers[name].name}的立繪" width="240" height="351" decoding="async">`;
// Views (視角): an act may show several images; each hotspot belongs to one of them. UI-only, never saved.
let viewId=null,viewRoom=-1;
const roomViews=r=>r.views||[{id:'main',label:r.title,image:r.image}];
const spotView=(spot,r)=>spot.view||roomViews(r)[0].id;
function activeView(r){
 const views=roomViews(r);
 if(viewRoom!==state.room||!views.some(v=>v.id===viewId)){viewRoom=state.room;viewId=views[0].id;}
 return views.find(v=>v.id===viewId);
}
function stepView(delta){
 const r=rooms[state.room],views=roomViews(r);
 if(views.length<2)return;
 const next=views[(views.findIndex(v=>v.id===activeView(r).id)+delta+views.length)%views.length];
 viewId=next.id;playCue('click');renderGame();
 const caption=$('#scene-subtitle');if(caption)caption.setAttribute('aria-live','polite');
}
// Scene clue panel: one icon, one name and one short status per row; rooms with several views get a heading per view.
function clueStatus(spot,r,done,restored,damaged){
 if(spot.memory)return state.memories?.includes(spot.id)?['已收藏','done']:['人物記憶','todo'];
 if(spot.shard)return state.shards.includes(spot.id)?['已收藏','done']:state.seen.includes(spot.id)?['需要工具','todo']:['未探索','new'];
 if(spot.lock)return done?['已解開','done']:['待解謎','todo'];
 if(spot.item&&state.inventory.includes(spot.item))return ['已收取','done'];
 if(damaged(spot)&&state.seen.includes(spot.id))return ['待修復','todo'];
 if(spot.id===r.evidence&&restored)return ['已修復','done'];
 return state.seen.includes(spot.id)?['已查看','done']:['未探索','new'];
}
function renderClues(spots,r,views,done,restored,damaged){
 const row=spot=>{const [text,tone]=clueStatus(spot,r,done,restored,damaged);return `<button class="clue-row ${tone}" data-clue="${spot.id}"><span class="clue-icon">${icon(spotIcon(spot))}</span><span class="clue-name">${spot.label}</span><small class="clue-state">${text}</small></button>`};
 // The seal spot (lock) is never marked seen: it counts once the act is solved.
 const found=spot=>state.seen.includes(spot.id)||(spot.lock&&done);
 const groups=views.length>1?views.map(v=>({label:v.label,list:spots.filter(spot=>spotView(spot,r)===v.id)})).filter(g=>g.list.length):[{label:'',list:spots}];
 $('#clue-list').innerHTML=groups.map(g=>`<div class="clue-group" role="group"${g.label?` aria-label="${g.label}"`:''}>${g.label?`<p class="clue-group-title">${g.label}<span>${g.list.filter(found).length} / ${g.list.length}</span></p>`:''}${g.list.map(row).join('')}</div>`).join('');
 $('#clue-count').textContent=spots.filter(found).length+' / '+spots.length;
}
// Clue modals show portraits and item sprites; fetch the room's set while the player is still looking at the scene.
function warmRoom(r){preloadImages([...r.spots.filter(spot=>spot.portrait).map(spot=>'assets/portraits/'+spot.portrait+'.webp'),...roomViews(r).slice(1).map(v=>'assets/'+v.image)]);preloadConcepts(Object.values(itemArtwork));}
function renderGame(){const r=rooms[state.room],done=state.solved.includes(state.room);warmRoom(r);soundtrack.select(r.id);ambience.select(r.atmosphere);$('#room-title').textContent=r.title;const view=activeView(r),views=roomViews(r);$('#room-chapter').textContent=r.chapter+(views.length>1?' · '+view.label:'');$('#scene-subtitle').textContent=r.subtitle;$('#scene').className='scene '+r.atmosphere;$('#scene-image').src='assets/'+view.image;$('#scene-image').alt=r.title+(views.length>1?'・'+view.label:'')+'的探索場景';$$('.view-arrow').forEach(b=>b.hidden=views.length<2);$('#objective').textContent=done?'封印已解開。妳可以重看線索，或前往下一幕。':r.objective;$('#truth-count').textContent=`真相 ${state.solved.length} / ${rooms.length}`;$('#truth-progress').max=rooms.length;$('#truth-progress').value=state.solved.length;if(loggedRoom!==state.room){loggedRoom=state.room;log('room');}const spots=visibleSpots(state),restored=restoredRoom(),damaged=spot=>spot.id===r.evidence&&!restored;renderClues(spots,r,views,done,restored,damaged);$('#timer').textContent=formatTime(state.elapsed);$('#hotspots').innerHTML=spots.filter(s=>spotView(s,r)===view.id).map(s=>`<button class="hotspot ${s.lock?'seal':''} ${s.lock&&done?'solved':''} ${s.after==='solved'?'revealed':''} ${s.memory?'memory':''} ${damaged(s)?'damaged':''} ${state.seen.includes(s.id)?'seen':''}" data-x="${s.x}" data-y="${s.y}" data-spot="${s.id}" aria-label="${s.label}${state.seen.includes(s.id)?'，已查看':''}">${icon(spotIcon(s))}<span>${s.label}</span></button>`).join('');$$('#hotspots [data-x]').forEach(el=>{el.style.left=el.dataset.x+'%';el.style.top=el.dataset.y+'%'});/* Hotspots are handled by the overlay using one delegated listener. */const progress=journeyGuide(state,restored);const memoryCount=state.endings.length?` · 人物記憶 ${memoryCollection(state).filter(m=>m.found).length} / ${memoryCollection(state).length}`:'';$('#scene-progress').textContent=`已探索 ${progress.discovered} / ${progress.total} 處線索 · 真相 ${state.solved.length} / ${rooms.length}${memoryCount}`;$('#room-next').classList.toggle('hidden',!done);$('#room-puzzle').classList.toggle('hidden',done);$('#room-next').textContent=state.room===rooms.length-1?'決定最後的代價 ⟶':'走向下一扇門 ⟶';$('#room-puzzle').onclick=openPuzzle;$('#room-next').onclick=()=>{if(state.room===rooms.length-1){openFate();return}travel(state,state.room+1);save();renderGame();window.scrollTo({top:0,behavior:'instant'});showChapterCard(state.room);};$('#room-tabs').innerHTML=rooms.map((x,i)=>`<button ${i>state.unlocked?'disabled':''} class="${i===state.room?'active':''}" data-room="${i}" ${i===state.room?'aria-current="step"':''}><span>0${i+1} ${i>state.unlocked?'· 封印':''}</span>${x.title}</button>`).join('');$$('[data-room]').forEach(b=>b.onclick=()=>pickRoom(Number(b.dataset.room)));
// Narrow screens show the acts as one select: seven tabs do not fit under 1024px, and the rest were cut off with no visible scrollbar.
$('#room-select').innerHTML=rooms.map((x,i)=>`<option value="${i}"${i>state.unlocked?' disabled':''}>0${i+1} · ${i>state.unlocked?'封印中':x.title}</option>`).join('');$('#room-select').value=String(state.room);$('#room-select').onchange=e=>{travel(state,Number(e.target.value));save();renderGame()};renderInventory();renderJourneyGuide();$('#journal-count').textContent=state.seen.length;save();clampPan();syncDialogue();}
// The act tabs rebuild on every render, so a keyboard user's focus is moved back to the new active tab.
function pickRoom(index){const inTabs=!!document.activeElement?.closest('#room-tabs');travel(state,index);save();renderGame();if(inTabs)document.querySelector(`#room-tabs [data-room="${index}"]`)?.focus({preventScroll:true});}
function loadGameIslands(){
 if(gameIslandModule)return Promise.resolve(gameIslandModule);
 if(gameIslandPromise)return gameIslandPromise;
 const entry=$('#inventory').dataset.vueGameInventoryEntry;
 if(!entry)return Promise.reject(new Error('Game Vue entry is missing.'));
 gameIslandPromise=import(entry).then(module=>{gameIslandModule=module;return module;}).catch(error=>{gameIslandPromise=null;throw error;});
 return gameIslandPromise;
}
function mountReflectionPuzzleIsland(snapshot){
 const root=$('[data-vue-reflection-puzzle]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="reflection"]'))return;
  gameModalIslandUnmount=module.mountReflectionIsland(root,snapshot);
  if(!gameModalIslandUnmount)root.textContent='手稿內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Reflection Vue island failed to load.',error);if(root.isConnected)root.textContent='手稿載入失敗，請重新整理頁面。';});
}
function mountMazePuzzleIsland(puzzle){
 const root=$('[data-vue-maze-puzzle]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="maze"]'))return;
  gameModalIslandUnmount=module.mountMazePuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='迷廊內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Maze Vue island failed to load.',error);if(root.isConnected)root.textContent='迷廊載入失敗，請重新整理頁面。';});
}
function mountPipesPuzzleIsland(snapshot,onAction){
 const root=$('[data-vue-pipes-puzzle]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="pipes"]'))return;
  gameModalIslandUnmount=module.mountPipesPuzzleIsland(root,snapshot,onAction);
  if(!gameModalIslandUnmount)root.textContent='管網內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Pipes Vue island failed to load.',error);if(root.isConnected)root.textContent='管網載入失敗，請重新整理頁面。';});
}
function mountLedgerPuzzleIsland(puzzle){
 const root=$('[data-vue-ledger-puzzle]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="ledger"]'))return;
  gameModalIslandUnmount=module.mountLedgerPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='帳頁內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Ledger Vue island failed to load.',error);if(root.isConnected)root.textContent='帳頁載入失敗，請重新整理頁面。';});
}
function mountMasksPuzzleIsland(puzzle){
 const root=$('[data-vue-masks-puzzle]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="masks"]'))return;
  gameModalIslandUnmount=module.mountMasksPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='面具內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Masks Vue island failed to load.',error);if(root.isConnected)root.textContent='面具載入失敗，請重新整理頁面。';});
}
function mountLightPuzzleIsland(puzzle){
 const root=$('[data-vue-light-puzzle]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="light"]'))return;
  gameModalIslandUnmount=module.mountLightPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='光路內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Light Vue island failed to load.',error);if(root.isConnected)root.textContent='鏡廳光路載入失敗，請重新整理頁面。';});
}
function mountPrismRaysPuzzleIsland(puzzle){
 const root=$('[data-vue-prism-rays]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="prism-rays"]'))return;
  gameModalIslandUnmount=module.mountPrismRaysPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='濾鏡光路內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Prism Rays Vue island failed to load.',error);if(root.isConnected)root.textContent='濾鏡光路載入失敗，請重新整理頁面。';});
}
function mountPrismBlendPuzzleIsland(puzzle){
 const root=$('[data-vue-prism-blend]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="prism-blend"]'))return;
  gameModalIslandUnmount=module.mountPrismBlendPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='合光水晶內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Prism Blend Vue island failed to load.',error);if(root.isConnected)root.textContent='合光水晶載入失敗，請重新整理頁面。';});
}
function mountPrismBallroomPuzzleIsland(puzzle){
 const root=$('[data-vue-prism-ballroom]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="prism-ballroom"]'))return;
  gameModalIslandUnmount=module.mountPrismBallroomPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='舞廳光路內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Prism Ballroom Vue island failed to load.',error);if(root.isConnected)root.textContent='舞廳光路載入失敗，請重新整理頁面。';});
}
function mountApothecaryTestimonyPuzzleIsland(puzzle){
 const root=$('[data-vue-apothecary-testimony]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="apothecary-testimony"]'))return;
  gameModalIslandUnmount=module.mountApothecaryTestimonyPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='七人證詞內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Apothecary Testimony Vue island failed to load.',error);if(root.isConnected)root.textContent='七人證詞載入失敗，請重新整理頁面。';});
}
function mountApothecaryVesselsPuzzleIsland(puzzle){
 const root=$('[data-vue-apothecary-vessels]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="apothecary-vessels"]'))return;
  gameModalIslandUnmount=module.mountApothecaryVesselsPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='量杯盤面無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Apothecary Vessels Vue island failed to load.',error);if(root.isConnected)root.textContent='量杯盤面載入失敗，請重新整理頁面。';});
}
function mountApothecaryMixingPuzzleIsland(puzzle){
 const root=$('[data-vue-apothecary-mixing]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="apothecary-mixing"]'))return;
  gameModalIslandUnmount=module.mountApothecaryMixingPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='調色盤面無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Apothecary Mixing Vue island failed to load.',error);if(root.isConnected)root.textContent='調色盤面載入失敗，請重新整理頁面。';});
}
function mountGalleryAlignPuzzleIsland(puzzle){
 const root=$('[data-vue-gallery-align]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="gallery-align"]'))return;
  gameModalIslandUnmount=module.mountGalleryAlignPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='畫格內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Gallery Align Vue island failed to load.',error);if(root.isConnected)root.textContent='畫格載入失敗，請重新整理頁面。';});
}
function mountWatchPuzzleIsland(puzzle){
 const root=$('[data-vue-watch-puzzle]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="watch"]'))return;
  gameModalIslandUnmount=module.mountWatchPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='懷錶齒輪內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Watch Vue island failed to load.',error);if(root.isConnected)root.textContent='懷錶齒輪載入失敗，請重新整理頁面。';});
}
function mountGears13PuzzleIsland(puzzle){
 const root=$('[data-vue-gears13]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="belfry-gears"]'))return;
  const island=module.mountGears13PuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!island){root.textContent='齒輪列內容無法載入，請重新整理頁面。';return;}
  puzzle.connect(island.update);
  gameModalIslandUnmount=()=>{puzzle.connect(null);island.unmount();};
 }).catch(error=>{console.error('Gears13 Vue island failed to load.',error);if(root.isConnected)root.textContent='逆走鐘樓齒輪列載入失敗，請重新整理頁面。';});
}
function mountPendulumPuzzleIsland(puzzle){
 const root=$('[data-vue-pendulum-puzzle]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="belfry-pendulum"]'))return;
  gameModalIslandUnmount=module.mountPendulumPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!gameModalIslandUnmount)root.textContent='鐘擺控制內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Pendulum Vue island failed to load.',error);if(root.isConnected)root.textContent='鐘擺控制載入失敗，請重新整理頁面。';});
}
function mountStarwheelPuzzleIsland(puzzle){
 const root=$('[data-vue-starwheel]');
 if(!root)return;
 loadGameIslands().then(module=>{
  if(!root.isConnected||!$('#modal').open||!root.closest('.challenge[data-step="belfry-wheel"]'))return;
  const island=module.mountStarwheelPuzzleIsland(root,puzzle.snapshot,puzzle.onAction);
  if(!island){puzzle.connect(null);root.textContent='星輪內容無法載入，請重新整理頁面。';return;}
  puzzle.connect(island.update);
  gameModalIslandUnmount=()=>{puzzle.connect(null);island.unmount();};
 }).catch(error=>{console.error('Starwheel Vue island failed to load.',error);puzzle.connect(null);if(root.isConnected)root.textContent='星輪載入失敗，請重新整理頁面。';});
}
function renderInventory(){$('#inventory-count').textContent=state.inventory.length+' 件';if(inventoryIslandLoaded){emitInventoryUpdate(document,state.inventory);return;}if(inventoryIslandLoading)return;inventoryIslandLoading=true;loadGameIslands().then(()=>{inventoryIslandLoaded=true;inventoryIslandLoading=false;emitInventoryUpdate(document,state.inventory);}).catch(error=>{console.error('Game Vue island failed to load.',error);inventoryIslandLoading=false;$('#inventory').textContent='物品清單載入失敗，請重新整理頁面。';});}
function openInventoryItem(id){const it=items[id];if(!it||!state.inventory.includes(id))return;modal(it.name,it.keepsake?'KEEPSAKE · 紀念物':'INVENTORY · 隨身物品',`<div class="modal-image-icon">${itemArtwork[id]?conceptMarkup(itemArtwork[id],{className:'concept-item'}):icon(itemIcon(id,it))}</div><p class="modal-text">${it.text}</p>${it.keepsake?'<p class="modal-note">紀念物不需要在任何地方使用，它只替妳記得發生過的事。</p>':''}<button class="secondary-button" id="item-back">返回探索</button>`);$('#item-back').onclick=closeModal;}
document.addEventListener(INVENTORY_SELECTED_EVENT,event=>{const id=readInventorySelection(event);if(id)openInventoryItem(id);});
$('#clue-list').addEventListener('click',event=>{const button=event.target.closest('[data-clue]');if(button)openSpot(button.dataset.clue);});
const hotspotLayer=$('#hotspots');hotspotLayer.addEventListener('click',event=>{if(panSuppressClick){panSuppressClick=false;return;}let element=event.target.closest('[data-spot]');if(!element&&event.detail>0){const candidates=[...hotspotLayer.querySelectorAll('[data-spot]')];let distance=42;for(const candidate of candidates){const box=candidate.getBoundingClientRect(),d=Math.hypot(event.clientX-(box.left+box.width/2),event.clientY-(box.top+box.height/2));if(d<distance){element=candidate;distance=d;}}}if(element){event.preventDefault();openSpot(element.dataset.spot);}});
function openSpot(id){markProgress();const trigger=document.activeElement;const triggerAttribute=trigger?.hasAttribute('data-clue')?'data-clue':trigger?.hasAttribute('data-spot')?'data-spot':null;const clueBefore=state.clues.length,shardBefore=state.shards.length;const spot=inspect(state,id);if(!spot)return;viewId=spotView(spot,rooms[state.room]);viewRoom=state.room;if(state.clues.length>clueBefore)playCue('page'),toast('新線索詞：'+state.clues.slice(clueBefore).map(word=>clueWords[word].label).join('、'));if(state.shards.length>shardBefore)playCue('glass'),toast('鏡之碎片已收入筆記');if(spot.lock){openPuzzle();return}log('spot',{spot:id});save();renderGame();(triggerAttribute?$(`[${triggerAttribute}="${id}"]`):trigger)?.focus({preventScroll:true});const r=rooms[state.room],evidence=spot.id===r.evidence,restored=evidence&&restoredRoom(),takeable=spot.item&&(!evidence||restored);const has=spot.item&&state.inventory.includes(spot.item);const art=spot.portrait?portraitMarkup(spot.portrait,spot.portraitAlt||spot.label):restored&&r.id==='library'?`<div class="ledger-figure">${ledgerMarkup()}</div>`:itemArtwork[spot.item]?`<div class="modal-image-icon">${conceptMarkup(itemArtwork[spot.item],{className:'concept-item'})}</div>`:Number.isFinite(spot.x)&&Number.isFinite(spot.y)?`<div class="spot-zoom" aria-hidden="true" data-zoom-src="assets/${(roomViews(r).find(v=>v.id===spotView(spot,r))||{}).image||r.image}" data-zoom-x="${spot.x}" data-zoom-y="${spot.y}">${icon(spotIcon(spot))}</div>`:`<div class="modal-image-icon">${icon(spotIcon(spot))}</div>`;modal(spot.label,spot.memory?'MEMORY · 人物記憶':evidence?(restored?'EVIDENCE · 已修復':'EVIDENCE · 損毀的證據'):'DISCOVERY · 發現',`${art}<p class="modal-text">${spotText(spot,restored||(!evidence&&!!spot.restoredText&&restoredRoom()),state)}</p>${spot.clues?.length?`<p class="clue-chips">線索詞：${[...spot.clues,...(restored?spot.restoredClues||[]:[])].filter(word=>state.clues.includes(word)).map(word=>`<span>${clueWords[word].label}</span>`).join('')||'尚未收錄'}</p>`:''}${evidence&&!restored?`<button class="primary-button" id="restore-evidence">${r.evidenceButton} ⟶</button>`:''}${takeable?`<button class="primary-button" id="take-item" ${has?'disabled':''}>${has?'已放入隨身物品':'收取'+spot.itemName+' ＋'}</button>`:''}${evidence&&restored?'<button class="secondary-button" id="replay-evidence">再玩一次這道謎題</button>':''}<p class="modal-note">${spot.memory?'這段記憶已收進筆記的「人物記憶」，開始新旅程也會保留。':spot.shard?(state.shards.includes(spot.id)?'這片碎鏡已收進筆記的「收藏」，開始新旅程也會保留。':'碎鏡還拿不到。在這一幕找到需要的東西，再回來。'):evidence&&!restored?'修復後的內容會更新到筆記中'+(spot.item?'，屆時才能收取'+spot.itemName:'')+'。':'這段線索已記錄在妳的筆記中。'}</p>`);if(evidence&&!restored)$('#restore-evidence').onclick=()=>{log('restore-start');startChallenge(r.id,{...challengeOptions(),success:()=>{log('restore-done');const gained=restoreClues(state,id);save();playCue('restore');renderGame();openSpot(id);toast(spot.label+'已修復，筆記已更新'+(gained.length?'；新線索詞：'+gained.map(word=>clueWords[word].label).join('、'):''));}});};if(evidence&&restored)$('#replay-evidence').onclick=()=>startReplay(r.id,()=>openSpot(id));if(takeable&&!has)$('#take-item').onclick=()=>{collect(state,id);log('collect',{item:spot.item});save();renderGame();closeModal();playCue('collect');toast(spot.itemName+' 已收入隨身物品');};}
function attempt(answer){
 markProgress();
 const result=solve(state,answer);
 log(result.ok?'seal-ok':'seal-fail');
 if(!result.ok){
  playCue('wrong');
  if(result.reason==='item')$('#feedback').textContent='妳還缺少'+items[result.item].name+'。先在房間裡找到並收取它。';
  else $('#feedback').textContent='封印沒有回應。重新檢視線索，再試一次。';
  return false;
 }
 save();renderGame();playCue('solve');
 const r=rooms[state.room];
 if(rooms[state.room+1]){const next=new Image();next.decoding='async';next.src='assets/'+rooms[state.room+1].image;}
 const aftermath=visibleSpots(state).find(spot=>spot.after==='solved');
 if(aftermath)playCue('door');
 const showSuccess=()=>{
  const nextLabel=aftermath?'查看'+aftermath.label:state.room===rooms.length-1?'面對最後的交易':'進入下一幕';
  modal('封印已解開','TRUTH FRAGMENT · '+r.reward,sealSuccessMarkup({queenLines:r.free?queenResponses(state.answers):null,unlock:unlockText(state),solved:state.solved.length,total:rooms.length,note:rooms[state.room].id==='mine'?' · 工程藍圖已收入隨身物品':'',nextLabel}));
  $('#success-next').onclick=()=>{closeModal();if(aftermath)openSpot(aftermath.id);else if(state.room===rooms.length-1)openFate();else{travel(state,state.room+1);save();renderGame();window.scrollTo({top:0,behavior:'instant'});}};
  $('#success-replay').onclick=()=>openReplayPicker(showSuccess);
  $('#success-stay').onclick=closeModal;
 };
 if(r.choice&&!state.choices?.[r.choice.key])openChoice(r,showSuccess);else showSuccess();
 return true;
}
// Story choice (選擇與後果): shown once, right after an act's seal opens. It only changes later text.
function openChoice(r,next){
 const def=r.choice;
 modal(def.title,'THE CHOICE · 選擇','<p class="modal-text">'+def.prompt+'</p>'+def.options.map(option=>'<button class="choice-option" data-choice="'+option.id+'">'+option.label+' <span>⟶</span></button>').join('')+'<p class="modal-note">這個選擇不會改變謎題，只會留在之後的文字與結局回顧裡。</p>');
 $$('#modal [data-choice]').forEach(b=>b.onclick=()=>{
  const option=def.options.find(item=>item.id===b.dataset.choice);
  if(!choose(state,def.key,option.id))return;
  save();playCue('click');
  modal(def.title,'THE CHOICE · 選擇','<p class="modal-text">'+option.text+'</p><button id="choice-next" class="primary-button">繼續 ⟶</button>');
  $('#choice-next').onclick=()=>next();
  $('#choice-next').focus({preventScroll:true});
 });
 $('#modal [data-choice]')?.focus({preventScroll:true});
}
function openPuzzle(){
 const r=rooms[state.room];
 if(!state.solved.includes(state.room))mixer.setFocus(true);
 if(state.solved.includes(state.room)){
  if(state.room===rooms.length-1)openFate();
  else{modal('這道封印已經解開',r.chapter,solvedMarkup(unlockText(state)));$('#solved-close').onclick=closeModal;$('#solved-replay').onclick=()=>openReplayPicker(openPuzzle);}
  return;
 }
 if(r.evidence&&!restoredRoom()){
  const evidence=r.spots.find(spot=>spot.id===r.evidence);
  modal(r.spots.find(spot=>spot.lock).label,r.chapter+' · 尚缺證據',evidenceGateMarkup({gate:r.evidenceGate,evidenceLabel:evidence.label}));
  $('#seal-evidence').onclick=()=>openSpot(evidence.id);$('#seal-close').onclick=closeModal;
  return;
 }
 if(!isChallengeComplete(r.id)){startChallenge(r.id,{...challengeOptions(),success:()=>{toast('互動謎題已完成，封印的第二層正在開啟。');openPuzzle()}});return;}
 if(r.deduction&&!(state.deduced||[]).includes(state.room)){if(r.evidence){restoreClues(state,r.evidence);save();}openInterrogation(r,r.deduction,true);return;}
 const prerequisite=prerequisiteNote(r.requires&&!state.inventory.includes(r.requires)?items[r.requires].name:'');
 if(r.puzzle==='code'){
  modal('禁書櫃的密碼','THE SEAL · 四位數字',codeSealMarkup(prerequisite));
  $('#code-form').onsubmit=e=>{e.preventDefault();attempt($('#code').value)};
  $('#code')?.focus({preventScroll:true});
  return;
 }
 if(r.puzzle==='sequence'){
  let seq=[];const n=r.answer.length;
  modal(r.seal.title,'THE SEAL · 排列順序',sequenceSealMarkup({prompt:r.seal.prompt,options:r.options,prerequisite}));
  const update=()=>{$('#sequence').innerHTML=Array.from({length:n},(_,i)=>`<span>${seq[i]?r.options.find(o=>o.id===seq[i]).label:'0'+(i+1)}</span>`).join('');$('#submit-seq').disabled=seq.length!==n;$$('[data-option]').forEach(b=>b.disabled=seq.includes(b.dataset.option));};
  $$('[data-option]').forEach(b=>b.onclick=()=>{if(seq.length<n&&!seq.includes(b.dataset.option)){seq.push(b.dataset.option);update();playCue('click')}});
  $('#clear-seq').onclick=()=>{seq=[];$('#feedback').textContent='';update()};
  $('#submit-seq').onclick=()=>attempt(seq);
  update();
  return;
 }
 if(r.puzzle==='questions'){
  let answers=[];
  const draw=()=>{
   const lead=answers.length?`<p class="queen-response">${queenResponse(answers.length-1,answers[answers.length-1])}</p>`:'<p class="modal-note">沒有標準答案。王后的信記著白雪當年的回答，妳可以照著回答，也可以說出自己的想法。</p>';
   modal('王后的三個問題','THE SEAL · '+(answers.length+1)+' / 3',questionSealMarkup({question:r.questions[answers.length],answered:answers.length,lead:prerequisite+lead}));
   $$('[data-answer]').forEach(b=>b.onclick=()=>{answers.push(b.dataset.answer);if(answers.length===3){if(!attempt(answers)){answers=[];$('#questions-reset').textContent='重新回答三個問題';$$('[data-answer]').forEach(x=>x.disabled=true)}}else draw()});
   $('#questions-reset').onclick=()=>{answers=[];draw()};
  };
  draw();
  return;
 }
 if(r.interrogation){openInterrogation(r);return;}
 modal('最後的血脈繼承人','THE SEAL · 王冠契約',nameSealMarkup(r.options));
 $$('[data-name]').forEach(b=>b.onclick=()=>attempt(b.dataset.name));
}
// Every mini-game that can be replayed, in journey order: the prologue first, then each act. Only finished ones are offered.
const replayOrder=[{id:'prologue',chapter:'序章'},...rooms.map(r=>({id:r.id,chapter:r.chapter})),...abyss.levels.map(level=>({id:level.puzzle,chapter:abyss.title}))];
function finishedMiniGames(){return replayOrder.filter(item=>isChallengeComplete(item.id)).map(item=>({id:item.id,chapter:item.chapter,title:challengeRegistry[item.id].title,thumb:challengeRegistry[item.id].stages[0].id}));}
// Replay picker (重玩小遊戲): every mini-game that is complete can be played again, as often as the
// player likes. A replay starts fresh and writes nothing back to the journey; `back` returns to the caller's screen.
function openReplayPicker(back=closeModal){
 const finished=finishedMiniGames();
 modal('重玩小遊戲','REPLAY · 重玩',replayPickerMarkup(finished));
 $$('#modal [data-replay]').forEach(b=>b.onclick=()=>startReplay(b.dataset.replay,()=>openReplayPicker(back)));
 $('#replay-back').onclick=back;
 $('#modal [data-replay]')?.focus({preventScroll:true});
}
// The one way to replay a finished mini-game: it starts on a fresh board and writes nothing back to the journey.
// The afterReplay callback decides where the player lands - the picker (so replays can repeat) or the evidence they came from.
function startReplay(id,afterReplay){
 startChallenge(id,{...challengeOptions(),fresh:true,success:()=>{toast('重玩完成，進度不受影響。');afterReplay();}});
}
// The mirror interrogation (魔鏡審問): fill each blank with a collected clue word, then submit.
// With `gate` the statement is an act's pre-seal deduction: solving it records progress and opens the seal's lock.
function openInterrogation(r,spec=r.interrogation,gate=false){
 const story=ui.preferences.mode==='story';
 let answers=spec.blanks.map(()=>null),selected=0,wrong=[],notice='',confirming=false;
 const focusBlank=()=>document.querySelector('#modal [data-blank="'+selected+'"]')?.focus({preventScroll:true});
 const draw=()=>{
  modal('魔鏡審問','THE SEAL · 真相推理',portraitMarkup('mirror','')+'<p class="modal-text">'+(spec.prompt||'魔鏡問：「誰的名字，仍讓王國的生命抵押繼續？」')+'</p>'+interrogationPage({spec,words:state.clues||[],answers,selected,story,wrong,notice,confirming}));
  $$('#modal [data-blank]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.blank);notice='';confirming=false;draw();focusBlank();});
  $$('#modal [data-word]').forEach(b=>b.onclick=()=>{answers[selected]=b.dataset.word;selected=nextEmpty(answers,selected);notice='';wrong=[];confirming=false;playCue('click');draw();focusBlank();});
  $('#interrogation-submit')?.addEventListener('click',()=>{
   const result=judgeInterrogation(spec,answers);
   if(gate){
    if(result.ok){state.deduced=[...(state.deduced||[]),state.room];save();playCue('solve');toast('推理成立，封印的最後一道鎖正在開啟。');openPuzzle();return;}
    state.misses=state.misses||{};state.misses[state.room]=(state.misses[state.room]||0)+1;log('seal-fail');playCue('wrong');save();
    wrong=result.wrong;notice=interrogationNotice(result.wrong.length,story);draw();return;
   }
   if(result.ok){attempt(answers);return;}
   wrong=result.wrong;notice=interrogationNotice(result.wrong.length,story);
   attempt(answers);
   draw();
  });
  $('#interrogation-fill')?.addEventListener('click',()=>{confirming=true;draw();});
  $('#interrogation-fill-no')?.addEventListener('click',()=>{confirming=false;draw();});
  $('#interrogation-fill-yes')?.addEventListener('click',()=>{
   confirming=false;
   const fill=hintFill(spec,answers);
   if(!fill)notice='所有格子都已正確，可以直接向魔鏡陳述。';
   else if(!(state.clues||[]).includes(fill.word))notice='還缺少關鍵的線索詞，先去檢視場景中的線索。';
   else{answers[fill.index]=fill.word;selected=fill.index;wrong=[];notice='魔鏡替妳填入了一格。';raiseHint(state.room,gate?'deduction':'seal',3);}
   draw();focusBlank();
  });
 };
 draw();
}
function openFate(){if(!journeyComplete(state))return;modal('妳願意支付什麼？','THE LAST CHOICE · 最後的代價',fateMarkup());$$('[data-fate]').forEach(b=>b.onclick=()=>{if(chooseEnding(state,b.dataset.fate)){log('ending',{ending:b.dataset.fate});save();playCue('solve');showView('ending')}else toast('請先找回工程藍圖。');});}
// The operable epilogue (尾聲): one gesture from two, each with its own closing line.
function renderEpilogue(e){
 const box=$('#ending-epilogue'),epilogue=e.epilogue;
 box.innerHTML=epilogueMarkup(epilogue,shardIds.every(id=>(state.shards||[]).includes(id)));
 if(!epilogue)return;
 $$('[data-epilogue]').forEach(b=>b.onclick=()=>{const option=epilogue.options.find(item=>item.id===b.dataset.epilogue);$('#epilogue-text').textContent=choiceVariant(option,state)||option.text;});
 $('#ending-credits').onclick=openCredits;
 $('#ending-secret')?.addEventListener('click',openSecretEpilogue);
}
function renderEnding(){const e=endings[state.ending];if(!e){showView('home');return}$('#ending-title').textContent=e.title;$('#ending-concept').innerHTML=['frost','crown'].includes(state.ending)?conceptMarkup(state.ending):'';placeConcepts($('#ending-concept'));$('#ending-concept').classList.toggle('hidden',state.ending==='dawn');const art=document.querySelector('.ending-art');art.style.backgroundImage='linear-gradient(0deg,#110d13bf,transparent 65%),url(assets/endings/'+state.ending+'.svg)';const endingId=state.ending;const enhancedCG=new Image();enhancedCG.decoding='async';enhancedCG.onload=()=>{if(view==='ending'&&state.ending===endingId)art.style.backgroundImage='linear-gradient(0deg,#110d13bf,transparent 65%),url(assets/endings/'+endingId+'.webp'+')';};enhancedCG.src='assets/endings/'+endingId+'.webp';art.setAttribute('role','img');art.setAttribute('aria-label','結局場景插畫：'+e.title);$('#ending-eyebrow').textContent=e.eyebrow;$('#ending-text').textContent=e.text;renderEpilogue(e);$('#ending-quote').textContent=e.quote;$('#ending-stats').innerHTML=`<span>旅程 ${formatTime(state.elapsed)}</span><span>真相 ${rooms.length} / ${rooms.length}</span><span>已發現結局 ${state.endings.length} / 3</span>`;const recap=journeyRecap(state);$('#ending-recap').innerHTML=recapMarkup(recap);renderEndingReplay();renderHome();}
// The clear screen's replay section: every finished mini-game is one click away, and the button in the row below scrolls here.
function renderEndingReplay(){
 $('#ending-replay').innerHTML=endingReplayMarkup(finishedMiniGames());
 $$('#ending-replay [data-replay]').forEach(b=>b.onclick=()=>startReplay(b.dataset.replay,closeModal));
 $('#ending-replay-jump').onclick=()=>{$('#ending-replay').scrollIntoView({behavior:document.body.classList.contains('reduce-motion')?'instant':'smooth',block:'start'});$('#ending-replay [data-replay]')?.focus({preventScroll:true});};
}
function followJourney(){
 const next=journeyGuide(state,restoredRoom()).next;
 if(next.kind==='ending'){showView('ending');return;}
 if(view!=='game')showView('game');
 if(next.kind==='spot')openSpot(next.spot);
 if(next.kind==='puzzle')openPuzzle();
 if(next.kind==='fate')openFate();
 if(next.kind==='travel'){travel(state,next.room);save();renderGame();window.scrollTo({top:0,behavior:'instant'});}
}
function renderResume(){
 $('#resume-card').classList.toggle('hidden',!state.started);
 if(!state.started)return;
 // Snow White's portrait loads only once a journey exists, so a first visit makes no extra request.
 const face=$('#resume-portrait');if(!face.getAttribute('src'))face.src='assets/portraits/snow.webp';face.hidden=false;
 const guide=journeyGuide(state,restoredRoom());
 $('#resume-title').textContent=guide.endingTitle||guide.chapter+' · '+guide.title;
 $('#resume-summary').textContent=`真相 ${guide.solved} / ${rooms.length} · 本幕已查看 ${guide.discovered} / ${guide.total} 處線索 · 結局收藏 ${state.endings.length} / ${Object.keys(endings).length}${state.endings.length?` · 人物記憶 ${state.memories?.length||0} / ${memoryCollection(state).length}`:''}`;
 $('#resume-next').textContent=guide.next.text;
 $('#resume-action').textContent=state.ending?'回看結局 ⟶':'回到旅程 ⟶';
 $('#resume-action').onclick=()=>showView(state.ending?'ending':'game');
}
function renderJourneyGuide(){
 const guide=journeyGuide(state,restoredRoom());
 $('#journey-guide-text').textContent=guide.next.text;
 $('#journey-guide-action').textContent=guide.next.label+' ⟶';
 $('#journey-guide-action').onclick=followJourney;
}
function openJournal(){
 modal('被留下的真相','JOURNAL · 線索筆記','<div data-vue-game-journal></div>');
 const root=$('[data-vue-game-journal]'),snapshot=journalSnapshot();
 loadGameIslands().then(module=>{
  if(!root?.isConnected||!$('#modal').open||$('#modal-title').textContent!=='被留下的真相')return;
  gameModalIslandUnmount=module.mountJournalIsland(root,snapshot,openSecretEpilogue);
  if(!gameModalIslandUnmount)root.textContent='筆記內容無法載入，請重新整理頁面。';
 }).catch(error=>{console.error('Journal Vue island failed to load.',error);if(root?.isConnected)root.textContent='筆記載入失敗，請重新整理頁面。';});
}
function journalSnapshot(){
 const words=state.clues||[],foundShards=state.shards||[],unlockedAchievements=state.achievements||[];
 const sections=journalChapters(state,id=>restoredRoom(rooms.findIndex(room=>room.id===id)));
 return {
  initialSelection:String(state.room),
  chapters:sections.map(section=>({index:section.index,chapter:section.chapter,title:section.title,entries:section.entries.map(spot=>({id:spot.id,label:spot.label,text:spot.text}))})),
  clues:Object.entries(clueGroups).map(([id,label])=>({id,label,words:words.filter(word=>clueWords[word]?.group===id).map(word=>clueWords[word].label)})).filter(group=>group.words.length),
  clueCount:words.filter(word=>clueWords[word]).length,clueTotal:Object.keys(clueWords).length,
  memories:memoryCollection(state).map(({id,chapter,title,found,label,text})=>({id,chapter,title,found,label,text})),
  memoriesAvailable:!!(state.endings.length||state.memories?.length),
  shards:shardIds.map(id=>{const found=foundShards.includes(id);return {id,found,title:found?(rooms.find(room=>room.spots.some(spot=>spot.id===id))?.title??'序章'):null};}),
  achievements:achievements.map(item=>{const unlocked=unlockedAchievements.includes(item.id);return {id:item.id,unlocked,title:unlocked?item.title:null,text:unlocked?item.text:null};}),
  closingTitle:isChallengeComplete(abyss.closing.requires)?abyss.closing.reward.name:null,
  secretTitle:secretEpilogue.title,
  canReadSecretEpilogue:shardIds.every(id=>foundShards.includes(id))
 };
}
// Step-aware hints (plan r1). Each act lists three tiers per step: its evidence stages, the deduction and the seal.
// The step is the stage in the modal (or the first unfinished one), then the deduction, then the seal.
function currentStep(index=state.room){const r=rooms[index];if(!state.solved.includes(index)&&r.stages?.length&&!restoredRoom(index)){const a=activeStage();if(a&&a.chapter===r.id&&!isStageComplete(r.id,a.stage))return a.stage;return r.stages.find(stage=>!isStageComplete(r.id,stage))||r.stages[0];}if(!state.solved.includes(index)&&r.deduction&&!(state.deduced||[]).includes(index))return 'deduction';return 'seal';}
const stepName=(r,step)=>step==='deduction'?'推理':step==='seal'?'封印':stageLabel(r.id,step)||step;
const hintLevel=(index,step)=>state.stepHints?.[rooms[index].id+'.'+step]||0;
function raiseHint(index,step,level){const r=rooms[index],list=r.stepHints?.[step]||[],next=Math.min(list.length,Math.max(level,hintLevel(index,step)));if(!next)return hintLevel(index,step);state.stepHints={...(state.stepHints||{}),[r.id+'.'+step]:next};state.hints[index]=Math.max(state.hints[index]||0,next);log('hint',{level:next,step});save();return next;}
function openHint(){if(view!=='game'){toast('進入場景後即可查看提示。');return}const index=state.room,r=rooms[index],step=currentStep(index),list=r.stepHints?.[step]||[],title='黑暗中的一點燭光',count=Math.min(hintLevel(index,step),list.length),snapshot={stepName:stepName(r,step),list:[...list],count};modal(title,'HINT · '+r.title+' · '+snapshot.stepName,'<div data-vue-game-hint><p role="status">提示載入中…</p></div>');const root=$('[data-vue-game-hint]');loadGameIslands().then(module=>{if(!root?.isConnected||!$('#modal').open||$('#modal-title').textContent!==title)return;gameModalIslandUnmount=module.mountHintIsland(root,snapshot,()=>raiseHint(index,step,hintLevel(index,step)+1));if(!gameModalIslandUnmount)root.textContent='提示內容無法載入，請重新整理頁面。';}).catch(error=>{console.error('Hint Vue island failed to load.',error);if(root?.isConnected)root.textContent='提示載入失敗，請重新整理頁面。';});}
// The same hints, folded under the stage inside the puzzle modal, so a player never loses the puzzle to read one.
let hintPanelOpen=false,stageWhisperTimer=null;
function stageHintMarkup(step){const r=rooms[state.room];return stageHintHtml({list:r.stepHints?.[step]||[],count:hintLevel(state.room,step),open:hintPanelOpen});}
function bindStageHints(step){const panel=$('#modal .stage-hints');if(!panel)return;panel.ontoggle=()=>{hintPanelOpen=panel.open;};panel.querySelector('[data-stage-hint]').onclick=()=>{raiseHint(state.room,step,hintLevel(state.room,step)+1);hintPanelOpen=true;panel.outerHTML=stageHintMarkup(step);bindStageHints(step);$('#modal [data-stage-hint]')?.focus({preventScroll:true});};}
// A known bottleneck (stage.whisper): after three quiet minutes on it, the mirror lights the first hint itself.
function stageWhisper(step){clearTimeout(stageWhisperTimer);const r=rooms[state.room],stage=challengeRegistry[r.id]?.stages.find(s=>s.id===step);if(!stage?.whisper)return;const room=state.room;stageWhisperTimer=setTimeout(()=>{if(state.room!==room||isStageComplete(r.id,step)||!$('#modal [data-challenge="'+r.id+'"][data-step="'+step+'"]'))return;if(hintLevel(room,step)<1)raiseHint(room,step,1);hintPanelOpen=true;const panel=$('#modal .stage-hints');if(panel){panel.outerHTML=stageHintMarkup(step);bindStageHints(step);}log('whisper',{step});toast('魔鏡低語：「妳在這裡停了很久。」第一道燭光提示已經亮起。');},180000);}
function challengeOptions(){mixer.setFocus(true);return {modal,playCue,has:item=>state.inventory.includes(item)||(state.shards||[]).includes(item),onStage:step=>{markProgress();log('stage-start',{step});stageWhisper(step);},onStageDone:step=>{log('stage-done',{step});},mountPuzzleIsland:(step,snapshot)=>{if(step==='reflection')mountReflectionPuzzleIsland(snapshot);if(step==='maze')mountMazePuzzleIsland(snapshot);if(step==='pipes')mountPipesPuzzleIsland(snapshot.snapshot,snapshot.onAction);if(step==='ledger')mountLedgerPuzzleIsland(snapshot);if(step==='masks')mountMasksPuzzleIsland(snapshot);if(step==='light')mountLightPuzzleIsland(snapshot);if(step==='prism-rays')mountPrismRaysPuzzleIsland(snapshot);if(step==='prism-blend')mountPrismBlendPuzzleIsland(snapshot);if(step==='prism-ballroom')mountPrismBallroomPuzzleIsland(snapshot);if(step==='apothecary-testimony')mountApothecaryTestimonyPuzzleIsland(snapshot);if(step==='apothecary-vessels')mountApothecaryVesselsPuzzleIsland(snapshot);if(step==='apothecary-mixing')mountApothecaryMixingPuzzleIsland(snapshot);if(step==='gallery-align')mountGalleryAlignPuzzleIsland(snapshot);if(step==='watch')mountWatchPuzzleIsland(snapshot);if(step==='belfry-gears')mountGears13PuzzleIsland(snapshot);if(step==='belfry-pendulum')mountPendulumPuzzleIsland(snapshot);if(step==='belfry-wheel')mountStarwheelPuzzleIsland(snapshot);},extra:{html:stageHintMarkup,bind:bindStageHints}};}
function openStory(){modal('當鏡子第一次說謊','PROLOGUE · 故事序章',storyBody+'<button id="story-play" class="primary-button">開始妳的故事 ⟶</button>');$('#story-play').onclick=()=>{closeModal();if(state.started){state.ending?showView('ending'):showView('game')}else begin();};}
function openGuide(){modal('如何走出魔鏡','HOW TO PLAY · 遊玩指南',guideBody);}
function begin(){resetChallenges();playlog.record('journey');loggedRoom=null;state={...initialState(),muted:state.muted,endings:state.endings,memories:state.memories||[],shards:state.shards||[],achievements:state.achievements||[]};state.started=true;save();showView('game');openPrologue();}
// The prologue (序章) is a short teaching puzzle at the start of every journey. Its shard is kept.
function openPrologue(){
 modal('當鏡子第一次說謊','PROLOGUE · 序章',prologueBody+'<button id="prologue-begin" class="primary-button">開始序章 ⟶</button><button id="prologue-skip" class="text-button">略過序章，直接進入第一幕</button>');
 $('#prologue-begin').onclick=()=>startChallenge('prologue',{modal,playCue,fresh:true,success:()=>{collectShard(state,PROLOGUE_SHARD);save();toast('序章完成，鏡之碎片已收入筆記');openChapterIntro();}});
 $('#prologue-skip').onclick=openChapterIntro;
}
function openChapterIntro(){modal('第十三聲鐘響','CHAPTER I · 黑鐘書庫',chapterIntroBody+'<button id="intro-explore" class="primary-button">開始探索 ⟶</button>');$('#intro-explore').onclick=closeModal;}
const mergeIds=(a=[],b=[])=>[...new Set([...a,...b])];
// The secret epilogue (祕密尾聲): two scenes, each a choice with its own reply, then a closing line.
function openSecretEpilogue(){
 const lines=[...secretEpilogue.opening];let step=0;
 const page=(body)=>lines.map(text=>`<p class="modal-text">${text}</p>`).join('')+body;
 const draw=()=>{
  const scene=secretEpilogue.scenes[step];
  if(!scene){
   modal(secretEpilogue.title,secretEpilogue.eyebrow,page(secretEpilogue.closing.map(text=>`<p class="modal-text">${text}</p>`).join('')+'<button id="secret-close" class="primary-button">闔上鏡子</button>'));
   $('#secret-close').onclick=closeModal;
   return;
  }
  modal(secretEpilogue.title,secretEpilogue.eyebrow,page(`<p class="modal-text">${scene.prompt}</p>`+scene.options.map(option=>`<button class="choice-option" data-secret="${option.id}">${option.label} <span>⟶</span></button>`).join('')));
  $$('#modal [data-secret]').forEach(b=>b.onclick=()=>{
   const option=scene.options.find(item=>item.id===b.dataset.secret);
   lines.push(scene.prompt,option.text);step++;draw();
  });
  $('#modal [data-secret]')?.focus({preventScroll:true});
 };
 draw();
}
// The end credits (片尾名單). The full theme plays under the roll and the previous track returns on close.
// The credits module loads when the roll opens (it is not needed on the first screen).
async function openCredits(){
 const {credits,creditsNote}=await import('./data/credits.js');
 soundtrack.select('credits');
 modal('片尾名單','CREDITS · 製作名單',credits.map(group=>`<section class="credit-group"><h3>${group.role}</h3>${group.lines.map(line=>`<p>${line}</p>`).join('')}</section>`).join('')+`<p class="modal-note">${creditsNote}</p><button id="credits-close" class="primary-button">闔上名單</button>`);
 $('#credits-close').onclick=closeModal;
 $('#modal').addEventListener('close',()=>soundtrack.select(currentTrack()),{once:true});
}
function confirmImport(imported){const s=imported.state;modal('匯入這段旅程？','IMPORT · 攜帶存檔',`<p class="modal-text">檔案中的旅程：真相 ${s.solved.length} / ${rooms.length} · 結局 ${s.endings.length} / 3 · 人物記憶 ${s.memories.length} / ${memoryCollection(s).length}。\n\n匯入後，會取代此裝置目前的進度。</p><button id="import-confirm" class="primary-button">匯入並繼續 ⟶</button><button id="import-cancel" class="secondary-button">保留目前進度</button>`);$('#import-confirm').onclick=()=>{state={...s,muted:state.muted,shards:mergeIds(s.shards,state.shards),achievements:mergeIds(s.achievements,state.achievements)};setChallenges(imported.puzzles);save();closeModal();showView('home');toast('存檔已匯入');};$('#import-cancel').onclick=closeModal;}
function confirmReset(){modal('重新踏入魔鏡？','NEW JOURNEY · 新的旅程','<p class="modal-text">目前的章節進度、線索、物品與計時將重設。已發現的結局會保留。</p><button id="reset-confirm" class="primary-button">重新開始 ⟶</button><button id="reset-cancel" class="secondary-button">保留目前旅程</button>');$('#reset-confirm').onclick=()=>{closeModal();begin()};$('#reset-cancel').onclick=closeModal;}
function playlogPanel(){return playlogPanelMarkup(summarizePlaylog(playlog.events,rooms.map(r=>r.title)),r=>stageLabel(rooms[r.index].id,r.longest.step));}
function openSettings(){modal('讓黑暗更適合妳','SETTINGS · 遊戲設定',settingsMarkup({muted:state.muted,reduceMotion:document.body.classList.contains('reduce-motion'),largeText:ui.preferences.largeText,typewriter:ui.preferences.typewriter,vibrateSupported:'vibrate' in navigator,vibrate:ui.preferences.vibrate,story:ui.preferences.mode==='story',playlogEnabled:playlog.enabled,playlogHtml:playlog.enabled?playlogPanel():'',saveFailed,volumes:ui.preferences.volumes}));$('#setting-sound').onclick=async()=>{await toggleSound();$('#setting-sound').textContent=state.muted?'關閉':'開啟'};$('#setting-motion').onclick=()=>{const enabled=!ui.preferences.reduceMotion;ui.setPreference('reduceMotion',enabled);$('#setting-motion').textContent=enabled?'已開啟':'開啟';$('#setting-motion').setAttribute('aria-pressed',String(enabled))};$('#setting-text').onclick=()=>{const enabled=!ui.preferences.largeText;ui.setPreference('largeText',enabled);$('#setting-text').textContent=enabled?'已開啟':'開啟';$('#setting-text').setAttribute('aria-pressed',String(enabled));};$('#setting-typewriter').onclick=()=>{const enabled=!ui.preferences.typewriter;ui.setPreference('typewriter',enabled);if(!enabled)dialogueBox.finish();$('#setting-typewriter').textContent=enabled?'已開啟':'開啟';$('#setting-typewriter').setAttribute('aria-pressed',String(enabled));};$('#setting-vibrate')?.addEventListener('click',()=>{const enabled=!ui.preferences.vibrate;ui.setPreference('vibrate',enabled);$('#setting-vibrate').textContent=enabled?'已開啟':'開啟';$('#setting-vibrate').setAttribute('aria-pressed',String(enabled));if(enabled)try{navigator.vibrate(15);}catch{}});$('#setting-mode').onclick=()=>{const next=ui.preferences.mode==='story'?'puzzle':'story';ui.setPreference('mode',next);$('#setting-mode').textContent=next==='story'?'故事模式':'解謎模式';if(view==='game')renderGame();};document.querySelectorAll('[data-volume]').forEach(input=>input.oninput=()=>{const value=Number(input.value)/100;ui.setVolume(input.dataset.volume,value);mixer.setLevel(input.dataset.volume,value);});$('#setting-reset').onclick=confirmReset;$('#save-export').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([exportSave(state,completedChallenges())],{type:'application/json'}));a.download='blood-mirror-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('存檔已匯出');};$('#save-import').onclick=()=>$('#save-file').click();$('#save-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const imported=parseSave(await file.text());confirmImport(imported);}catch(error){toast(error.message||'無法匯入這個檔案');}};$('#setting-playlog').onclick=()=>{playlog.setEnabled(!playlog.enabled);if(playlog.enabled){loggedRoom=null;log('room');}openSettings();};$('#playlog-copy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(playlog.export());toast('試玩紀錄已複製');}catch{toast('無法存取剪貼簿，請改用下載');}});$('#playlog-download')?.addEventListener('click',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([playlog.export()],{type:'application/json'}));a.download='blood-mirror-playlog.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});$('#playlog-clear')?.addEventListener('click',()=>{playlog.clear();openSettings();toast('試玩紀錄已清除');});}
function stopAudio(){soundtrack.stop();ambience.stop();}
async function startAudio(){await soundtrack.start(currentTrack());ambience.select(view==='game'?rooms[state.room].atmosphere:null);}
async function toggleSound(){gallery.stopPreview(false);if(state.muted){try{await startAudio();state.muted=false;toast('環境音效已開啟')}catch{state.muted=true;toast('此瀏覽器目前無法播放音效。')}}else{state.muted=true;stopAudio()}updateSound();save();}
function updateSound(){const label=state.muted?'開啟環境音效':'關閉環境音效';$('#sound-icon').innerHTML=icon(state.muted?'mute':'sound');$('#sound').setAttribute('aria-pressed',String(!state.muted));$('#sound').setAttribute('aria-label',state.muted?'音效關閉':'音效開啟');$('.sound-label').textContent=state.muted?'音效關閉':'音效開啟';
 // The site header is hidden while playing a chapter, so the HUD carries its own switch for the same state.
 $('#hud-sound-icon').innerHTML=icon(state.muted?'mute':'sound');$('#hud-sound').setAttribute('aria-pressed',String(!state.muted));$('#hud-sound').setAttribute('aria-label',label);$('#hud-sound-label').textContent=state.muted?'音效關閉':'音效開啟';$('.settings-toggle').innerHTML=icon('settings');}
// The feedback layer (juice.js) answers every cue, so actions still land when the sound is off.
function playCue(kind){juice?.cue(kind);if(state.muted)return;sfx.play(kind);}
let galleryReturn='home';
const gallery=createGallery({getEndings:()=>state.endings,openModal:modal,closeModal,onPreviewStart:stopAudio,onPreviewStop:()=>{if(!state.muted&&!document.hidden)startAudio().catch(()=>{});}});
function openGallery(){if(view!=='gallery')galleryReturn=view;showView('gallery');}
$('#gallery-return').onclick=()=>showView(galleryReturn);
$('#abyss-open').onclick=openAbyssArea;$('#sound').onclick=toggleSound;$('#hud-sound').onclick=toggleSound;$('#start').onclick=()=>state.started?confirmReset():begin();$('#continue').onclick=()=>showView(state.ending?'ending':'game');$('.brand').onclick=e=>{e.preventDefault();showView('home')};$$('[data-action]').forEach(b=>b.onclick=()=>{if(b.closest('#game-nav')&&matchMedia('(max-width:850px)').matches)ui.closeMenu(true);const a=b.dataset.action;if(a==='home')showView('home');if(a==='gallery')openGallery();if(a==='guide')openGuide();if(a==='story')openStory();if(a==='journal')openJournal();if(a==='hint')openHint();if(a==='settings')openSettings();if(a==='chapters'){showView('home');$('#chapters').scrollIntoView({behavior:document.body.classList.contains('reduce-motion')?'instant':'smooth'});}if(a==='reconsider'){state.ending=null;state.room=rooms.length-1;save();showView('game');openFate();}});
setInterval(()=>{if(view==='game'&&!document.hidden&&state.started&&!state.ending){state.elapsed++;$('#timer').textContent=formatTime(state.elapsed);checkWhisper();if(state.elapsed%10===0)save()}},1000);
document.addEventListener('visibilitychange',()=>{save();if(document.hidden){gallery.stopPreview(false);stopAudio();}else if(!state.muted)startAudio().catch(()=>{})});window.addEventListener('pagehide',save);
// Another tab saved. A tab the player is not using takes over that progress, so returning to it or closing it
// never writes an older journey back; the tab in use keeps playing and its next save wins. A save from a newer
// build stops every tab from writing, focused or not.
window.addEventListener('storage',e=>{if(e.key!==SAVE_KEY||e.newValue===null)return;const next=loadSave(localStorage);if(next.newer||document.hidden||!document.hasFocus())adoptSave(next);});
function adoptSave(next){if(next.newer){saveBlocked=true;save();return;}state={...next.state,muted:state.muted};setChallenges(next.puzzles);loggedRoom=null;showView(view==='game'&&!state.started||view==='ending'&&!state.ending?'home':view);if(document.hidden)stopAudio();}
if(loaded.newer){save();toast('這份存檔來自較新的版本，請重新整理頁面');}else if(loaded.recovered)toast('存檔無法讀取，已從上次的備份還原');
// Audio must start in a user gesture. Restored progress always begins quietly.
// Stage controls (plan §5.5, §6): candle light, idle whisper, phone panning, chapter cards and the pause menu.
let glowCooldownUntil=0,glowTimer=null,cardTimer=null,lastProgress=Date.now(),panX=0,dragStart=null,panMoved=false,panSuppressClick=false;
const scene=$('#scene'),frame=$('#scene-frame');
function markProgress(){lastProgress=Date.now();$('.hud [data-action="hint"]')?.classList.remove('whisper');}
// After three quiet minutes the mirror's hint button starts to glow; the hint itself is unchanged.
function checkWhisper(){if(view!=='game'||state.ending)return;if(Date.now()-lastProgress>180000)$('.hud [data-action="hint"]')?.classList.add('whisper');}
function updateGlowLabel(){
 const left=Math.ceil((glowCooldownUntil-Date.now())/1000),label=$('#glow-label'),button=$('#glow');
 if(left<=0){clearInterval(glowTimer);label.textContent='燭光';button.disabled=false;return;}
 label.textContent=left+' 秒';button.disabled=true;
}
// Lights every interactive point for three seconds, then rests for twenty.
function lightCandles(){
 if(view!=='game')return;
 const now=Date.now();
 if(now<glowCooldownUntil){toast('燭光正在冷卻，稍後再點亮。');return;}
 const stage=$('#stage'),button=$('#glow');
 stage.classList.add('glow-on');button.setAttribute('aria-pressed','true');
 setTimeout(()=>{stage.classList.remove('glow-on');button.setAttribute('aria-pressed','false');},3000);
 glowCooldownUntil=now+20000;markGlow(state);save();
 clearInterval(glowTimer);updateGlowLabel();glowTimer=setInterval(updateGlowLabel,500);
}
function showChapterCard(index){
 const r=rooms[index];
 if(!r||document.body.classList.contains('reduce-motion'))return;
 $('#chapter-card-number').textContent=r.chapter;
 $('#chapter-card-title').textContent=r.title;
 $('#chapter-card-subtitle').textContent=r.subtitle;
 $('#chapter-card-quote').textContent=r.intro.split('。')[0]+'。';
 $('#chapter-card').classList.remove('hidden');
 clearTimeout(cardTimer);cardTimer=setTimeout(hideChapterCard,2500);
}
function hideChapterCard(){clearTimeout(cardTimer);$('#chapter-card').classList.add('hidden');}
// The 16:9 frame pans horizontally when it is wider than the screen (phones); hotspots move with it.
function clampPan(){const max=Math.max(0,(frame.offsetWidth-scene.clientWidth)/2);panX=Math.min(max,Math.max(-max,panX));frame.style.setProperty('--pan-x',panX+'px');updateOffscreenHints();}
// Brings a hotspot into the visible part of a panned phone frame, with a margin so it does not sit on the edge.
function revealHotspot(element){if(!element?.closest('#hotspots'))return;const s=scene.getBoundingClientRect(),r=element.getBoundingClientRect(),margin=48;const shift=r.left<s.left+margin?s.left+margin-r.left:r.right>s.right-margin?s.right-margin-r.right:0;if(shift){panX+=shift;clampPan();}}
// A phone frame is wider than the screen, so a hotspot past an edge is invisible. Unseen hotspots past each edge are
// counted, and the chip beside the view arrows pans to the nearest one; the chips are rebuilt on every pan and render.
function offscreenHotspots(){const s=scene.getBoundingClientRect(),left=[],right=[];for(const el of $$('#hotspots [data-spot]:not(.seen)')){const r=el.getBoundingClientRect();if(!r.width)continue;if(r.right<s.left)left.push({el,edge:r.right});else if(r.left>s.right)right.push({el,edge:r.left});}return {left:left.sort((a,b)=>b.edge-a.edge).map(item=>item.el),right:right.sort((a,b)=>a.edge-b.edge).map(item=>item.el)};}
function updateOffscreenHints(){const {left,right}=offscreenHotspots();for(const [id,items,side] of [['hint-left',left,'左側'],['hint-right',right,'右側']]){const chip=$('#'+id);chip.hidden=!items.length;chip.textContent=(id==='hint-left'?'‹ ':'')+side+' '+items.length+' 處'+(id==='hint-right'?' ›':'');chip.setAttribute('aria-label',side+'還有 '+items.length+' 個未查看的熱點，點擊平移過去');}}
$('#hint-left').onclick=()=>revealHotspot(offscreenHotspots().left[0]);$('#hint-right').onclick=()=>revealHotspot(offscreenHotspots().right[0]);
scene.addEventListener('pointerdown',event=>{dragStart={x:event.clientX,start:panX};panMoved=false;});
scene.addEventListener('pointermove',event=>{
 if(!dragStart)return;
 const dx=event.clientX-dragStart.x;
 if(!panMoved){if(Math.abs(dx)<8)return;panMoved=true;scene.classList.add('dragging','panned');}
 panX=dragStart.start+dx;clampPan();
});
function endPan(){
 scene.classList.remove('dragging');
 if(panMoved){panSuppressClick=true;setTimeout(()=>{panSuppressClick=false;},0);}
 dragStart=null;
}
scene.addEventListener('pointerup',endPan);scene.addEventListener('pointercancel',endPan);
window.addEventListener('resize',clampPan);
function openPause(){
 const labHome=document.querySelector('.lab-bar a')?.href||'#';
 modal('暫停','MENU · 選單',`<div class="pause-menu"><button id="pause-resume" class="primary-button">繼續探索 ⟶</button><button id="pause-journal" class="secondary-button">線索筆記</button><button id="pause-replay" class="secondary-button"${finishedMiniGames().length?'':' disabled'}>重玩小遊戲${finishedMiniGames().length?'':'（尚未通關）'}</button><button id="pause-gallery" class="secondary-button">魔鏡藝廊</button><button id="pause-settings" class="secondary-button">設定與攜帶存檔</button><button id="pause-title" class="secondary-button">返回標題</button><p class="modal-note"><a href="${labHome}">← 返回 LUCAS LAB 遊戲館</a></p></div>`);
 $('#pause-resume').onclick=closeModal;
 $('#pause-journal').onclick=openJournal;
 $('#pause-replay').onclick=()=>openReplayPicker(openPause);
 $('#pause-gallery').onclick=()=>{closeModal();openGallery();};
 $('#pause-settings').onclick=openSettings;
 $('#pause-title').onclick=()=>{closeModal();showView('home');};
}
// The dialogue opens by default on desktop and starts collapsed on phones, so the scene stays in view;
// there the toggle says when the act's opening scene is still unread.
let dialogueRoom=null,dialogueOpen=true;
const dialogueBox=createDialogueBox({root:$('#dialogue'),icon,typewriter:()=>ui.preferences.typewriter&&dialogueOpen&&!document.body.classList.contains('reduce-motion'),onLog:openReadLog});
function setDialogue(open){dialogueOpen=open;$('#dialogue').classList.toggle('collapsed',!open);const toggle=$('#dialogue-toggle'),unread=!open&&dialogueBox.remaining()>0&&!sceneMet(state);toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'收合對話':unread?'展開新對話':'展開對話';toggle.classList.toggle('unread',unread);if(!open)dialogueBox.finish();}
function syncDialogue(){
 if(dialogueRoom!==state.room){dialogueRoom=state.room;dialogueOpen=!matchMedia('(max-width:720px),(max-height:520px)').matches;}
 dialogueBox.show(state.room+':'+state.solved.includes(state.room),dialogueLines(state),{met:sceneMet(state)});
 setDialogue(dialogueOpen);
}
// Read log (回顧紀錄): what the player has read in this act, oldest first; scene lines stop where the box is.
function openReadLog(){
 const r=rooms[state.room],sceneRead=state.solved.includes(state.room)?Infinity:dialogueBox.shown();
 const entries=readLog(state,state.room,id=>restoredRoom(rooms.findIndex(room=>room.id===id)),sceneRead);
 modal('回顧紀錄','LOG · '+r.chapter+'　'+r.title,`<ol class="read-log">${entries.map(entry=>`<li class="read-log-entry${entry.title?' spot':''}"><p class="read-log-speaker">${entry.title||speakers[entry.speaker].name}</p><p class="read-log-text">${entry.text}</p></li>`).join('')}</ol><button class="secondary-button" id="log-back">返回探索</button>`);
 $('#log-back').onclick=closeModal;
}
$('#dialogue-toggle').onclick=()=>setDialogue(!dialogueOpen);
for(const name of ['master','music','sfx','ambience'])mixer.setLevel(name,ui.preferences.volumes[name]);
$('#glow').onclick=lightCandles;
$('#pause').onclick=openPause;
$('#chapter-card').onclick=hideChapterCard;
$('#view-prev').onclick=()=>stepView(-1);$('#view-next').onclick=()=>stepView(1);
document.addEventListener('keydown',event=>{if((event.key==='ArrowLeft'||event.key==='ArrowRight')&&view==='game'&&!$('#modal').open&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!/^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)){stepView(event.key==='ArrowRight'?1:-1);}});
document.addEventListener('keydown',event=>{if(event.key.toLowerCase()==='m'&&view==='game'&&!$('#modal').open&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!/^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)){event.preventDefault();toggleSound();}});
document.addEventListener('keydown',event=>{if(event.key.toLowerCase()==='l'&&view==='game'&&!$('#modal').open&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();lightCandles();}});
// Gamepad navigation (手把導覽) loads only once a pad connects; the hooks say what back, menu and the shoulders mean on this screen.
const gamepadHooks={
 root:()=>$('#modal').open?$('#modal'):$('#'+view),
 back:()=>{if($('#modal').open)closeModal();else if(view==='game')openPause();},
 menu:()=>{if($('#modal').open){if($('#modal-title').textContent==='暫停')closeModal();return;}if(view==='game')openPause();},
 shoulder:dir=>{if(view==='game'&&!$('#modal').open)stepView(dir);},
 reveal:revealHotspot
};
addEventListener('gamepadconnected',()=>{import('./gamepad.js').then(({startGamepadNav})=>startGamepadNav(gamepadHooks)).catch(()=>{});});
hydrateIcons();enableButtonArrows();state.muted=true;updateSound();renderHome();
