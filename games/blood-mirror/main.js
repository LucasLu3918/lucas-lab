import {createMixer} from './audio/mixer.js';import {createSfx} from './audio/sfx.js';import {createAmbience} from './audio/ambience.js';
import {journeyGuide,journalChapters,spotText,memoryCollection,journeyRecap,dialogueLines,sceneMet,readLog} from './journey.js';import {exportSave,parseSave,loadSave,backupSave,writeSave,SAVE_KEY} from './engine/index.js';import {ledgerMarkup} from './puzzles/ledger.js';import {createPlaylog,summarizePlaylog} from './playlog.js';
import {createGameUI,createDialogueBox} from './ui.js';
import {speakers} from './data/chapters/index.js';
import {conceptMarkup,itemArtwork,placeConcepts,preloadImages,preloadConcepts} from './concept-art.js';
import {rooms,items,endings,initialState,inspect,collect,solve,travel,chooseEnding,journeyComplete,choose,choiceVariant,visibleSpots,queenResponse,queenResponses,unlockText,markGlow,restoreClues,collectShard,unlockAchievements,achievements,shardIds,PROLOGUE_SHARD,clueWords,clueGroups,judgeInterrogation} from './engine/index.js';
import {interrogationPage,interrogationNotice,hintFill,nextEmpty} from './puzzles/interrogation.js';
import {secretEpilogue} from './data/secret-epilogue.js';
import {credits,creditsNote} from './data/credits.js';
import {isPuzzleComplete as isChallengeComplete,isStageComplete,activeStage,stageLabel,puzzles as challengeRegistry,startPuzzle as startChallenge,resetPuzzles as resetChallenges,completedPuzzles as completedChallenges,setPuzzleCompletions as setChallenges,setPuzzlePersistence} from './puzzles/index.js';
import {createSoundtrack} from './soundtrack.js';
import {createGallery} from './gallery.js';
import {icon,spotIcon,itemIcon,hydrateIcons,enableButtonArrows} from './icons.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const loaded=loadSave(localStorage);let state=loaded.state;setChallenges(loaded.puzzles);setPuzzlePersistence(()=>save());
// A save written by a newer build stays untouched: this page never writes until it is reloaded.
let saveBlocked=loaded.newer;if(!saveBlocked){if(!loaded.recovered)backupSave(localStorage);if(loaded.migrated||loaded.recovered)writeSave(state,completedChallenges(),localStorage);}
let view='home',lastFocus=null,lastFocusSelector=null,toastTimeout,activeNodes=[],saveFailed=false;
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
function modal(title,eyebrow,html){const d=$('#modal'),opening=!d.open,titleChanged=$('#modal-title').textContent!==title;if(opening){lastFocus=document.activeElement;const key=['data-clue','data-spot','data-item','data-artwork','data-gallery-filter'].find(name=>lastFocus?.hasAttribute(name));lastFocusSelector=key?`[${key}="${lastFocus.getAttribute(key)}"]`:null;}$('#modal-title').textContent=title;$('#modal-eyebrow').textContent=eyebrow;$('#modal-body').innerHTML=html;placeConcepts($('#modal-body'));if(opening)d.showModal();if(opening||titleChanged)$('#modal-body').scrollTop=0;if(!opening&&!d.contains(document.activeElement))$('#modal-title').focus({preventScroll:true});}
function restoreFocus(){if($('#modal').open)return;if(view==='ending'){$('#ending-title').focus({preventScroll:true});return;}const target=lastFocus?.isConnected?lastFocus:lastFocusSelector?$(lastFocusSelector):null;if(target?.getClientRects().length)target.focus({preventScroll:true});}
function closeModal(){$('#modal').close();restoreFocus();}
$('#modal-close').onclick=closeModal;
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal()}});
$('#modal').addEventListener('close',restoreFocus);$('#modal').addEventListener('close',()=>mixer.setFocus(false));
function showView(next){ui.closeMenu();document.body.dataset.view=next;if(view==='gallery')gallery.stopPreview();if($('#modal').open)closeModal();view=next;['home','game','ending','gallery'].forEach(id=>$('#'+id).classList.toggle('hidden',id!==next));$('#main').classList.remove('view-enter');void $('#main').offsetWidth;$('#main').classList.add('view-enter');window.scrollTo({top:0,behavior:'instant'});if(next==='game')renderGame();if(next==='home')renderHome();if(next==='ending'){renderEnding();$('#ending-title').setAttribute('tabindex','-1');$('#ending-title').focus({preventScroll:true});}if(next==='gallery'){gallery.render();$('#gallery-return').textContent=galleryReturn==='home'?'← 返回首頁':'← 返回旅程';}soundtrack.select(currentTrack());if(next!=='game')ambience.stop();$$('#game-nav [data-action]').forEach(button=>{if(button.dataset.action===(next==='home'?'home':next))button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});}
function renderHome(){renderResume();const hasSave=state.started;$('#start').classList.toggle('primary-button',!hasSave);$('#start').classList.toggle('text-button',hasSave);$('#continue').classList.toggle('primary-button',hasSave);$('#continue').classList.toggle('text-button',!hasSave);$('#continue').textContent=state.ending?'回看已完成的結局 ⟶':`繼續${rooms[state.room].title} ⟶`;$('#home-progress').textContent=hasSave?`已找到 ${state.solved.length} / ${rooms.length} 份真相 · 結局收藏 ${state.endings.length} / 3${state.endings.length?` · 人物記憶 ${state.memories?.length||0} / ${memoryCollection(state).length}`:''}`:'觀察光點 → 收取物品 → 解開封印';$('#continue').classList.toggle('hidden',!hasSave);$('#start').textContent=hasSave?'開始新旅程 ⟶':'踏入魔鏡 ⟶';$('#chapter-cards').innerHTML=rooms.map((r,i)=>`<button class="chapter-card" data-chapter="${i}" aria-label="${r.chapter} ${r.title}，${i<=state.unlocked?'可探索':'尚未解鎖'}">${i<=state.unlocked?`<img class="card-image" loading="lazy" src="assets/${r.image}" alt="">`:''}<span class="card-number">0${i+1}</span><span class="card-status">${icon(state.solved.includes(i)?'gem':i<=state.unlocked?'mirror':'lock')}${state.solved.includes(i)?'已解開':i<=state.unlocked?'可探索':'封印中'}</span><h3>${r.title}</h3><p>${r.subtitle}</p><span class="card-arrow">⟶</span></button>`).join('');$$('[data-chapter]').forEach(el=>el.onclick=()=>{const i=Number(el.dataset.chapter);if(i>state.unlocked){toast('這道門仍被封印。先完成前面的章節。');return}state.started=true;state.ending=null;travel(state,i);save();showView('game');});}
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
 const groups=views.length>1?views.map(v=>({label:v.label,list:spots.filter(spot=>spotView(spot,r)===v.id)})).filter(g=>g.list.length):[{label:'',list:spots}];
 $('#clue-list').innerHTML=groups.map(g=>`<div class="clue-group" role="group"${g.label?` aria-label="${g.label}"`:''}>${g.label?`<p class="clue-group-title">${g.label}<span>${g.list.filter(spot=>state.seen.includes(spot.id)).length} / ${g.list.length}</span></p>`:''}${g.list.map(row).join('')}</div>`).join('');
 $('#clue-count').textContent=spots.filter(spot=>state.seen.includes(spot.id)).length+' / '+spots.length;
}
// Clue modals show portraits and item sprites; fetch the room's set while the player is still looking at the scene.
function warmRoom(r){preloadImages(r.spots.filter(spot=>spot.portrait).map(spot=>'assets/portraits/'+spot.portrait+'.webp'));preloadConcepts(Object.values(itemArtwork));}
function renderGame(){const r=rooms[state.room],done=state.solved.includes(state.room);warmRoom(r);soundtrack.select(r.id);ambience.select(r.atmosphere);$('#room-title').textContent=r.title;const view=activeView(r),views=roomViews(r);$('#room-chapter').textContent=r.chapter+(views.length>1?' · '+view.label:'');$('#scene-subtitle').textContent=r.subtitle;$('#scene').className='scene '+r.atmosphere;$('#scene-image').src='assets/'+view.image;$('#scene-image').alt=r.title+(views.length>1?'・'+view.label:'')+'的探索場景';$$('.view-arrow').forEach(b=>b.hidden=views.length<2);$('#objective').textContent=done?'封印已解開。妳可以重看線索，或前往下一幕。':r.objective;$('#truth-count').textContent=`真相 ${state.solved.length} / ${rooms.length}`;$('#truth-progress').max=rooms.length;$('#truth-progress').value=state.solved.length;if(loggedRoom!==state.room){loggedRoom=state.room;log('room');}const spots=visibleSpots(state),restored=restoredRoom(),damaged=spot=>spot.id===r.evidence&&!restored;renderClues(spots,r,views,done,restored,damaged);$('#timer').textContent=formatTime(state.elapsed);$('#hotspots').innerHTML=spots.filter(s=>spotView(s,r)===view.id).map(s=>`<button class="hotspot ${s.lock?'seal':''} ${s.lock&&done?'solved':''} ${s.after==='solved'?'revealed':''} ${s.memory?'memory':''} ${damaged(s)?'damaged':''} ${state.seen.includes(s.id)?'seen':''}" data-x="${s.x}" data-y="${s.y}" data-spot="${s.id}" aria-label="${s.label}${state.seen.includes(s.id)?'，已查看':''}">${icon(spotIcon(s))}<span>${s.label}</span></button>`).join('');$$('#hotspots [data-x]').forEach(el=>{el.style.left=el.dataset.x+'%';el.style.top=el.dataset.y+'%'});/* Hotspots are handled by the overlay using one delegated listener. */const progress=journeyGuide(state,restored);const memoryCount=state.endings.length?` · 人物記憶 ${memoryCollection(state).filter(m=>m.found).length} / ${memoryCollection(state).length}`:'';$('#scene-progress').textContent=`已探索 ${progress.discovered} / ${progress.total} 處線索 · 真相 ${state.solved.length} / ${rooms.length}${memoryCount}`;$('#room-next').classList.toggle('hidden',!done);$('#room-puzzle').classList.toggle('hidden',done);$('#room-next').textContent=state.room===rooms.length-1?'決定最後的代價 ⟶':'走向下一扇門 ⟶';$('#room-puzzle').onclick=openPuzzle;$('#room-next').onclick=()=>{if(state.room===rooms.length-1){openFate();return}travel(state,state.room+1);save();renderGame();window.scrollTo({top:0,behavior:'instant'});showChapterCard(state.room);};$('#room-tabs').innerHTML=rooms.map((x,i)=>`<button ${i>state.unlocked?'disabled':''} class="${i===state.room?'active':''}" data-room="${i}" ${i===state.room?'aria-current="step"':''}><span>0${i+1} ${i>state.unlocked?'· 封印':''}</span>${x.title}</button>`).join('');$$('[data-room]').forEach(b=>b.onclick=()=>{travel(state,Number(b.dataset.room));save();renderGame()});renderInventory();renderJourneyGuide();$('#journal-count').textContent=state.seen.length;save();clampPan();syncDialogue();}
function renderInventory(){$('#inventory-count').textContent=state.inventory.length+' 件';$('#inventory').innerHTML=state.inventory.length?state.inventory.map(id=>`<button data-item="${id}" title="${items[id].name}" aria-label="檢視${items[id].name}">${icon(itemIcon(id,items[id]))}<span>${items[id].name}</span></button>`).join(''):'<p class="inventory-empty">空蕩蕩的口袋，等待第一條線索。</p>';placeConcepts($('#inventory'));$$('[data-item]').forEach(b=>b.onclick=()=>{const it=items[b.dataset.item];modal(it.name,it.keepsake?'KEEPSAKE · 紀念物':'INVENTORY · 隨身物品',`<div class="modal-image-icon">${itemArtwork[b.dataset.item]?conceptMarkup(itemArtwork[b.dataset.item],{className:'concept-item'}):icon(itemIcon(b.dataset.item,it))}</div><p class="modal-text">${it.text}</p>${it.keepsake?'<p class="modal-note">紀念物不需要在任何地方使用，它只替妳記得發生過的事。</p>':''}<button class="secondary-button" id="item-back">返回探索</button>`);$('#item-back').onclick=closeModal;});}
$('#clue-list').addEventListener('click',event=>{const button=event.target.closest('[data-clue]');if(button)openSpot(button.dataset.clue);});
const hotspotLayer=$('#hotspots');hotspotLayer.addEventListener('click',event=>{if(panSuppressClick){panSuppressClick=false;return;}let element=event.target.closest('[data-spot]');if(!element&&event.detail>0){const candidates=[...hotspotLayer.querySelectorAll('[data-spot]')];let distance=42;for(const candidate of candidates){const box=candidate.getBoundingClientRect(),d=Math.hypot(event.clientX-(box.left+box.width/2),event.clientY-(box.top+box.height/2));if(d<distance){element=candidate;distance=d;}}}if(element){event.preventDefault();openSpot(element.dataset.spot);}});
function openSpot(id){markProgress();const trigger=document.activeElement;const triggerAttribute=trigger?.hasAttribute('data-clue')?'data-clue':trigger?.hasAttribute('data-spot')?'data-spot':null;const clueBefore=state.clues.length,shardBefore=state.shards.length;const spot=inspect(state,id);if(!spot)return;viewId=spotView(spot,rooms[state.room]);viewRoom=state.room;if(state.clues.length>clueBefore)playCue('page'),toast('新線索詞：'+state.clues.slice(clueBefore).map(word=>clueWords[word].label).join('、'));if(state.shards.length>shardBefore)playCue('glass'),toast('鏡之碎片已收入筆記');if(spot.lock){openPuzzle();return}log('spot',{spot:id});save();renderGame();(triggerAttribute?$(`[${triggerAttribute}="${id}"]`):trigger)?.focus({preventScroll:true});const r=rooms[state.room],evidence=spot.id===r.evidence,restored=evidence&&restoredRoom(),takeable=spot.item&&(!evidence||restored);const has=spot.item&&state.inventory.includes(spot.item);const art=spot.portrait?portraitMarkup(spot.portrait,spot.portraitAlt||spot.label):restored&&r.id==='library'?`<div class="ledger-figure">${ledgerMarkup()}</div>`:`<div class="modal-image-icon">${itemArtwork[spot.item]?conceptMarkup(itemArtwork[spot.item],{className:'concept-item'}):icon(spotIcon(spot))}</div>`;modal(spot.label,spot.memory?'MEMORY · 人物記憶':evidence?(restored?'EVIDENCE · 已修復':'EVIDENCE · 損毀的證據'):'DISCOVERY · 發現',`${art}<p class="modal-text">${spotText(spot,restored||(!evidence&&!!spot.restoredText&&restoredRoom()),state)}</p>${spot.clues?.length?`<p class="clue-chips">線索詞：${[...spot.clues,...(restored?spot.restoredClues||[]:[])].filter(word=>state.clues.includes(word)).map(word=>`<span>${clueWords[word].label}</span>`).join('')||'尚未收錄'}</p>`:''}${evidence&&!restored?`<button class="primary-button" id="restore-evidence">${r.evidenceButton} ⟶</button>`:''}${takeable?`<button class="primary-button" id="take-item" ${has?'disabled':''}>${has?'已放入隨身物品':'收取'+spot.itemName+' ＋'}</button>`:''}${evidence&&restored?'<button class="secondary-button" id="replay-evidence">再玩一次這道謎題</button>':''}<p class="modal-note">${spot.memory?'這段記憶已收進筆記的「人物記憶」，開始新旅程也會保留。':spot.shard?(state.shards.includes(spot.id)?'這片碎鏡已收進筆記的「收藏」，開始新旅程也會保留。':'碎鏡還拿不到。在這一幕找到需要的東西，再回來。'):evidence&&!restored?'修復後的內容會更新到筆記中'+(spot.item?'，屆時才能收取'+spot.itemName:'')+'。':'這段線索已記錄在妳的筆記中。'}</p>`);if(evidence&&!restored)$('#restore-evidence').onclick=()=>{log('restore-start');startChallenge(r.id,{...challengeOptions(),success:()=>{log('restore-done');const gained=restoreClues(state,id);save();playCue('restore');renderGame();openSpot(id);toast(spot.label+'已修復，筆記已更新'+(gained.length?'；新線索詞：'+gained.map(word=>clueWords[word].label).join('、'):''));}});};if(evidence&&restored)$('#replay-evidence').onclick=()=>startChallenge(r.id,{...challengeOptions(),fresh:true,success:()=>{openSpot(id);toast('謎題已再次完成，進度不受影響');}});if(takeable&&!has)$('#take-item').onclick=()=>{collect(state,id);log('collect',{item:spot.item});save();renderGame();closeModal();playCue('collect');toast(spot.itemName+' 已收入隨身物品');};}
function attempt(answer){markProgress();const result=solve(state,answer);log(result.ok?'seal-ok':'seal-fail');if(!result.ok){playCue('wrong');if(result.reason==='item')$('#feedback').textContent='妳還缺少'+items[result.item].name+'。先在房間裡找到並收取它。';else $('#feedback').textContent='封印沒有回應。重新檢視線索，再試一次。';return false;}save();renderGame();playCue('solve');const r=rooms[state.room];if(rooms[state.room+1]){const next=new Image();next.decoding='async';next.src='assets/'+rooms[state.room+1].image;}const aftermath=visibleSpots(state).find(spot=>spot.after==='solved');if(aftermath)playCue('door');const showSuccess=()=>{modal('封印已解開','TRUTH FRAGMENT · '+r.reward,`<div class="success-gem">${icon('facet')}</div>${r.free?`<ul class="queen-responses">${queenResponses(state.answers).map(line=>`<li>${line}</li>`).join('')}</ul>`:''}<p class="modal-text">${unlockText(state)}</p><p class="modal-note">真相碎片 ${state.solved.length} / ${rooms.length}${rooms[state.room].id==='mine'?' · 工程藍圖已收入隨身物品':''}</p><button class="primary-button" id="success-next">${aftermath?'查看'+aftermath.label:state.room===rooms.length-1?'面對最後的交易':'進入下一幕'} ⟶</button><button class="secondary-button" id="success-stay">留在此處探索</button>`);$('#success-next').onclick=()=>{closeModal();if(aftermath)openSpot(aftermath.id);else if(state.room===rooms.length-1)openFate();else{travel(state,state.room+1);save();renderGame();window.scrollTo({top:0,behavior:'instant'});}};$('#success-stay').onclick=closeModal;};if(r.choice&&!state.choices?.[r.choice.key])openChoice(r,showSuccess);else showSuccess();return true;}
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
function openPuzzle(){const r=rooms[state.room];if(!state.solved.includes(state.room))mixer.setFocus(true);if(state.solved.includes(state.room)){if(state.room===rooms.length-1)openFate();else{modal('這道封印已經解開',r.chapter,`<p class="modal-text">${unlockText(state)}</p><button id="solved-close" class="primary-button">繼續探索</button>`);$('#solved-close').onclick=closeModal;}return;}
 if(r.evidence&&!restoredRoom()){const evidence=r.spots.find(spot=>spot.id===r.evidence);modal(r.spots.find(spot=>spot.lock).label,r.chapter+' · 尚缺證據',`<p class="modal-text">${r.evidenceGate}</p><button id="seal-evidence" class="primary-button">檢視${evidence.label} ⟶</button><button id="seal-close" class="secondary-button">繼續探索</button>`);$('#seal-evidence').onclick=()=>openSpot(evidence.id);$('#seal-close').onclick=closeModal;return;}
 if(!isChallengeComplete(r.id)){startChallenge(r.id,{...challengeOptions(),success:()=>{toast('互動謎題已完成，封印的第二層正在開啟。');openPuzzle()}});return;}
 if(r.deduction&&!(state.deduced||[]).includes(state.room)){if(r.evidence){restoreClues(state,r.evidence);save();}openInterrogation(r,r.deduction,true);return;}
 const prerequisite=r.requires&&!state.inventory.includes(r.requires)?`<p class="modal-note">需要物品：${items[r.requires].name}。妳可以先檢視謎題。</p>`:'';
 if(r.puzzle==='code'){modal('禁書櫃的密碼','THE SEAL · 四位數字',`${conceptMarkup('clock',{className:'concept-mechanism',decorative:true})}<p class="modal-text">錶蓋的刻字：「鐘聲在前，代價在後。」</p>${prerequisite}<form id="code-form" class="puzzle-form"><label for="code">轉動四個刻度</label><input id="code" class="code-input" inputmode="numeric" pattern="[0-9]{4}" autocomplete="off" maxlength="4" placeholder="· · · ·" aria-describedby="feedback" required><p id="feedback" class="puzzle-feedback" role="status"></p><button class="primary-button" type="submit">解開封印 ⟶</button></form>`);$('#code-form').onsubmit=e=>{e.preventDefault();attempt($('#code').value)};$('#code')?.focus({preventScroll:true});return;}
 if(r.puzzle==='sequence'){let seq=[];const n=r.answer.length;modal(r.seal.title,'THE SEAL · 排列順序',`<p class="modal-text">${r.seal.prompt}</p>${prerequisite}<div id="sequence" class="sequence-display" aria-live="polite"></div><div class="puzzle-options">${r.options.map(o=>`<button data-option="${o.id}"><span>${o.symbol}</span>${o.label}</button>`).join('')}</div><p id="feedback" class="puzzle-feedback" role="status"></p><button id="submit-seq" class="primary-button" disabled>確認順序 ⟶</button><button id="clear-seq" class="secondary-button">重新排列</button>`);const update=()=>{$('#sequence').innerHTML=Array.from({length:n},(_,i)=>`<span>${seq[i]?r.options.find(o=>o.id===seq[i]).label:'0'+(i+1)}</span>`).join('');$('#submit-seq').disabled=seq.length!==n;$$('[data-option]').forEach(b=>b.disabled=seq.includes(b.dataset.option));};$$('[data-option]').forEach(b=>b.onclick=()=>{if(seq.length<n&&!seq.includes(b.dataset.option)){seq.push(b.dataset.option);update();playCue('click')}});$('#clear-seq').onclick=()=>{seq=[];$('#feedback').textContent='';update()};$('#submit-seq').onclick=()=>attempt(seq);update();return;}
 if(r.puzzle==='questions'){let answers=[];const draw=()=>{const q=r.questions[answers.length];modal('王后的三個問題','THE SEAL · '+(answers.length+1)+' / 3',`${prerequisite}${answers.length?`<p class="queen-response">${queenResponse(answers.length-1,answers[answers.length-1])}</p>`:'<p class="modal-note">沒有標準答案。王后的信記著白雪當年的回答，妳可以照著回答，也可以說出自己的想法。</p>'}<p class="question-progress">QUESTION 0${answers.length+1}</p><p class="question-text">${q.text}</p>${q.options.map(o=>`<button class="choice-option" data-answer="${o.id}">${o.label} <span>⟶</span></button>`).join('')}<p id="feedback" class="puzzle-feedback" role="status"></p><button id="questions-reset" class="secondary-button">回到第一問</button>`);$$('[data-answer]').forEach(b=>b.onclick=()=>{answers.push(b.dataset.answer);if(answers.length===3){if(!attempt(answers)){answers=[];$('#questions-reset').textContent='重新回答三個問題';$$('[data-answer]').forEach(x=>x.disabled=true)}}else draw()});$('#questions-reset').onclick=()=>{answers=[];draw()};};draw();return;}
 if(r.interrogation){openInterrogation(r);return;}
 modal('最後的血脈繼承人','THE SEAL · 王冠契約',`<p class="modal-text">魔鏡問：「誰的名字，仍讓王國的生命抵押繼續？」</p>${r.options.map(o=>`<button class="choice-option" data-name="${o.id}">${o.label} <span>⟶</span></button>`).join('')}<p id="feedback" class="puzzle-feedback" role="status"></p>`);$$('[data-name]').forEach(b=>b.onclick=()=>attempt(b.dataset.name));
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
function openFate(){if(!journeyComplete(state))return;modal('妳願意支付什麼？','THE LAST CHOICE · 最後的代價',`<p class="modal-text">妳已握住所有真相。放棄名字，生命抵押將終止；但結界也會消失。\n\n赫索的工程藍圖仍在妳手中。這一次，妳可以尋找第三種方法。</p><button class="choice-option" data-fate="dawn">先完成蒸汽工程，再交出名字<small>讓工程替代結界。世界獲救，但所有人將忘記妳。</small></button><button class="choice-option" data-fate="frost">立刻交出名字，解除所有抵押<small>生命重獲自由。尚未準備好的城市將面對霜潮。</small></button><button class="choice-option" data-fate="crown">保住名字，繼承血色王冠<small>妳仍被世界記住。生命交易也將繼續。</small></button><p class="modal-note">這個選擇會決定結局。完成後可回來探索其他可能。</p>`);$$('[data-fate]').forEach(b=>b.onclick=()=>{if(chooseEnding(state,b.dataset.fate)){log('ending',{ending:b.dataset.fate});save();playCue('solve');showView('ending')}else toast('請先找回工程藍圖。');});}
// The operable epilogue (尾聲): one gesture from two, each with its own closing line.
function renderEpilogue(e){
 const box=$('#ending-epilogue'),epilogue=e.epilogue;
 if(!epilogue){box.innerHTML='';return;}
 box.innerHTML='<h2>尾聲</h2><p class="epilogue-prompt">'+epilogue.prompt+'</p><div class="epilogue-options">'+epilogue.options.map(option=>'<button class="choice-option" data-epilogue="'+option.id+'">'+option.label+' <span>⟶</span></button>').join('')+'</div><p id="epilogue-text" class="epilogue-text" role="status" aria-live="polite"></p><div class="epilogue-extras"><button id="ending-credits" class="text-button">片尾名單 ⟶</button>'+(shardIds.every(id=>(state.shards||[]).includes(id))?'<button id="ending-secret" class="text-button">祕密尾聲 ⟶</button>':'')+'</div>';
 $$('[data-epilogue]').forEach(b=>b.onclick=()=>{{const option=epilogue.options.find(item=>item.id===b.dataset.epilogue);$('#epilogue-text').textContent=choiceVariant(option,state)||option.text;}});
 $('#ending-credits').onclick=openCredits;
 $('#ending-secret')?.addEventListener('click',openSecretEpilogue);
}
function renderEnding(){const e=endings[state.ending];if(!e){showView('home');return}$('#ending-title').textContent=e.title;$('#ending-concept').innerHTML=['frost','crown'].includes(state.ending)?conceptMarkup(state.ending):'';placeConcepts($('#ending-concept'));$('#ending-concept').classList.toggle('hidden',state.ending==='dawn');const art=document.querySelector('.ending-art');art.style.backgroundImage='linear-gradient(0deg,#110d13bf,transparent 65%),url(assets/endings/'+state.ending+'.svg)';const endingId=state.ending;const enhancedCG=new Image();enhancedCG.decoding='async';enhancedCG.onload=()=>{if(view==='ending'&&state.ending===endingId)art.style.backgroundImage='linear-gradient(0deg,#110d13bf,transparent 65%),url(assets/endings/'+endingId+'.webp'+')';};enhancedCG.src='assets/endings/'+endingId+'.webp';art.setAttribute('role','img');art.setAttribute('aria-label','結局場景插畫：'+e.title);$('#ending-eyebrow').textContent=e.eyebrow;$('#ending-text').textContent=e.text;renderEpilogue(e);$('#ending-quote').textContent=e.quote;$('#ending-stats').innerHTML=`<span>旅程 ${formatTime(state.elapsed)}</span><span>真相 ${rooms.length} / ${rooms.length}</span><span>已發現結局 ${state.endings.length} / 3</span>`;const recap=journeyRecap(state);$('#ending-recap').innerHTML=recap?`<h2>這段旅程如何走到這裡</h2><ul>${recap.cause.map(line=>`<li>${line}</li>`).join('')}</ul>${recap.answers.length?`<h2>妳對王后說過的話</h2><ul>${recap.answers.map(line=>`<li>${line}</li>`).join('')}</ul>`:''}${recap.choices.length?`<h2>妳在路上做的選擇</h2><ul>${recap.choices.map(line=>`<li>${line}</li>`).join('')}</ul>`:''}<p class="ending-recap-stats">解封後的場景 ${recap.scenes} / ${recap.sceneTotal} · 使用提示 ${recap.hints} 次 · 人物記憶 ${recap.memories} / ${recap.memoryTotal}</p><p class="ending-recap-next">${recap.next}</p>`:'';renderHome();}
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
 const sections=journalChapters(state,id=>restoredRoom(rooms.findIndex(room=>room.id===id)));
 modal('被留下的真相','JOURNAL · 線索筆記',`<div class="journal-controls"><label for="journal-chapter">查看章節</label><select id="journal-chapter"><option value="all">全部已解鎖章節</option>${sections.map(section=>`<option value="${section.index}">${section.chapter} · ${section.title}</option>`).join('')}${state.endings.length||state.memories?.length?'<option value="memories">人物記憶</option>':''}<option value="clues">推理簿</option><option value="collection">收藏</option></select><p id="journal-summary" class="modal-note" role="status"></p></div><div id="journal-entries"></div>`);
 const select=$('#journal-chapter');select.value=String(state.room);
 const draw=()=>{
  if(select.value==='clues'){const book=clueBook();$('#journal-summary').textContent=book.summary;$('#journal-entries').innerHTML=book.html;return;}
  if(select.value==='collection'){$('#journal-summary').textContent='碎片與成就會保留在此裝置，開始新旅程也不會遺失。';$('#journal-entries').innerHTML=collectionBook();$('#secret-epilogue')?.addEventListener('click',openSecretEpilogue);return;}
  if(select.value==='memories'){const memories=memoryCollection(state);$('#journal-summary').textContent=`已收藏 ${memories.filter(m=>m.found).length} / ${memories.length} 段人物記憶。開始新旅程也會保留。`;$('#journal-entries').innerHTML=memories.map(m=>m.found?`<article class="journal-entry memory-entry"><h4>${m.chapter} · ${m.label}</h4><p>${m.text}</p></article>`:`<article class="journal-entry memory-entry locked"><h4>${m.chapter} · ${m.title}</h4><p>尚未發現。這段記憶藏在${m.title}。</p></article>`).join('');return;}
  const visible=sections.filter(section=>select.value==='all'||String(section.index)===select.value);
  const count=visible.reduce((total,section)=>total+section.entries.length,0);
  $('#journal-summary').textContent=`已記錄 ${count} 處線索。筆記只顯示妳已查看的內容。`;
  $('#journal-entries').innerHTML=visible.map(section=>section.entries.length?`<section class="journal-chapter"><h3>${section.chapter} · ${section.title}</h3>${section.entries.map(spot=>`<article class="journal-entry"><h4>${spot.label}</h4><p>${spot.text}</p></article>`).join('')}</section>`:'').join('')||'<p class="modal-text">這裡還沒有線索。回到場景探索，發現的內容會自動記錄。</p>';
 };
 select.onchange=draw;draw();
}
// Step-aware hints (plan r1). Each act lists three tiers per step: its evidence stages, the deduction and the seal.
// The step is the stage in the modal (or the first unfinished one), then the deduction, then the seal.
function currentStep(index=state.room){const r=rooms[index];if(!state.solved.includes(index)&&r.stages?.length&&!restoredRoom(index)){const a=activeStage();if(a&&a.chapter===r.id&&!isStageComplete(r.id,a.stage))return a.stage;return r.stages.find(stage=>!isStageComplete(r.id,stage))||r.stages[0];}if(!state.solved.includes(index)&&r.deduction&&!(state.deduced||[]).includes(index))return 'deduction';return 'seal';}
const stepName=(r,step)=>step==='deduction'?'推理':step==='seal'?'封印':stageLabel(r.id,step)||step;
const hintLevel=(index,step)=>state.stepHints?.[rooms[index].id+'.'+step]||0;
function raiseHint(index,step,level){const r=rooms[index],list=r.stepHints?.[step]||[],next=Math.min(list.length,Math.max(level,hintLevel(index,step)));if(!next)return;state.stepHints={...(state.stepHints||{}),[r.id+'.'+step]:next};state.hints[index]=Math.max(state.hints[index]||0,next);log('hint',{level:next,step});save();}
const hintSteps=(list,count)=>list.slice(0,count).map((h,i)=>`<div class="hint-step"><span>0${i+1}</span><p>${h}</p></div>`).join('');
const hintButtonText=(count,total)=>count===0?'點亮第一道提示':count>=total?'所有提示已展開':'展開更明確的提示';
function openHint(){if(view!=='game'){toast('進入場景後即可查看提示。');return}const index=state.room,r=rooms[index],step=currentStep(index),list=r.stepHints?.[step]||[];const draw=()=>{const count=hintLevel(index,step);modal('黑暗中的一點燭光','HINT · '+r.title+' · '+stepName(r,step),`<p class="modal-note">提示只針對妳目前卡住的這一步：${stepName(r,step)}。提示不會扣分，也不會改變結局。</p>${hintSteps(list,count)}<button id="more-hint" class="primary-button" ${count>=list.length?'disabled':''}>${hintButtonText(count,list.length)} ✧</button>`);$('#more-hint').onclick=()=>{raiseHint(index,step,hintLevel(index,step)+1);draw()};};draw();}
// The same hints, folded under the stage inside the puzzle modal, so a player never loses the puzzle to read one.
let hintPanelOpen=false,stageWhisperTimer=null;
function stageHintMarkup(step){const r=rooms[state.room],list=r.stepHints?.[step]||[],count=hintLevel(state.room,step);if(!list.length)return '';return `<details class="stage-hints"${hintPanelOpen?' open':''}><summary>燭光提示（${count} / ${list.length}）</summary>${hintSteps(list,count)}<button class="secondary-button" data-stage-hint ${count>=list.length?'disabled':''}>${hintButtonText(count,list.length)} ✧</button></details>`;}
function bindStageHints(step){const panel=$('#modal .stage-hints');if(!panel)return;panel.ontoggle=()=>{hintPanelOpen=panel.open;};panel.querySelector('[data-stage-hint]').onclick=()=>{raiseHint(state.room,step,hintLevel(state.room,step)+1);hintPanelOpen=true;panel.outerHTML=stageHintMarkup(step);bindStageHints(step);$('#modal [data-stage-hint]')?.focus({preventScroll:true});};}
// A known bottleneck (stage.whisper): after three quiet minutes on it, the mirror lights the first hint itself.
function stageWhisper(step){clearTimeout(stageWhisperTimer);const r=rooms[state.room],stage=challengeRegistry[r.id]?.stages.find(s=>s.id===step);if(!stage?.whisper)return;const room=state.room;stageWhisperTimer=setTimeout(()=>{if(state.room!==room||isStageComplete(r.id,step)||!$('#modal [data-challenge="'+r.id+'"][data-step="'+step+'"]'))return;if(hintLevel(room,step)<1)raiseHint(room,step,1);hintPanelOpen=true;const panel=$('#modal .stage-hints');if(panel){panel.outerHTML=stageHintMarkup(step);bindStageHints(step);}log('whisper',{step});toast('魔鏡低語：「妳在這裡停了很久。」第一道燭光提示已經亮起。');},180000);}
function challengeOptions(){mixer.setFocus(true);return {modal,playCue,has:item=>state.inventory.includes(item),onStage:step=>{markProgress();log('stage-start',{step});stageWhisper(step);},onStageDone:step=>{log('stage-done',{step});},extra:{html:stageHintMarkup,bind:bindStageHints}};}
function openStory(){modal('當鏡子第一次說謊','PROLOGUE · 故事序章','<p class="modal-text">王后生下白雪公主的那一夜，王國有許多孩子死於寒冷。\n宮殿裡燃燒著七百支蠟燭。\n\n在霜棘王國，魔法不是奇蹟，而是一門生意。窮人，永遠是付錢的那一個。\n\n二十三年後，妳以艾薇・格雷的名字藏身黑鐘學院。妳偷走一顆封著孩子記憶的玻璃心臟，卻發現自己也在王室的生命帳簿上。\n\n最高等級魔力容器。\n成年後可永久封存霜潮。\n\n帳簿的最後幾頁，被人撕走了。</p><p class="modal-note">改編自《白雪公主：血色魔鏡》。本作將主要事件重新編排為七幕密室探索；部分謎題與分支結局為遊戲原創。</p><button id="story-play" class="primary-button">開始妳的故事 ⟶</button>');$('#story-play').onclick=()=>{closeModal();if(state.started){state.ending?showView('ending'):showView('game')}else begin();};}
function openGuide(){modal('如何走出魔鏡','HOW TO PLAY · 遊玩指南','<ol class="guide-list"><li><strong>觀察場景。</strong>點擊帶有光暈的標記，閱讀文字。已看過的線索會有勾記。</li><li><strong>收取物品。</strong>在物品視窗按「收取」。只閱讀而沒有收取，物品不會進入背包。</li><li><strong>修復證據。</strong>有些證據已經損毀，拼回原狀後才能讀到完整內容。</li><li><strong>解開封印。</strong>比對線索，輸入密碼、排列符印或回答問題。沒有時間限制，也不會因答錯失去進度。</li><li><strong>需要幫助時。</strong>筆記會保留已探索的線索；提示會逐步揭露解法。</li><li><strong>決定代價。</strong>通過所有章節後選擇結局。可回到最後的選擇，體驗另外兩種結局。</li></ol><p class="modal-note">手機與桌面皆使用點擊操作。進度自動儲存在目前瀏覽器，換裝置不會同步。音效預設關閉；開啟後建議配戴耳機。遊戲包含心理恐怖、死亡與生命剝削敘事，無閃光驚嚇。</p>');}
function begin(){resetChallenges();playlog.record('journey');loggedRoom=null;state={...initialState(),muted:state.muted,endings:state.endings,memories:state.memories||[],shards:state.shards||[],achievements:state.achievements||[]};state.started=true;save();showView('game');openPrologue();}
// The prologue (序章) is a short teaching puzzle at the start of every journey. Its shard is kept.
function openPrologue(){
 modal('當鏡子第一次說謊','PROLOGUE · 序章','<p class="modal-text">王后生下白雪公主的那一夜，育兒房的音樂盒還在轉。一隻灰色的布兔子坐在床邊，右耳縫得很密。\n\n魔鏡第一次說謊，是在妳伸手去拿那只音樂盒的時候。</p><p class="modal-note">先撥起音針，讓旋律與搖籃曲譜一致。這裡練習的是點擊與拼合，不需要其他說明。</p><button id="prologue-begin" class="primary-button">開始序章 ⟶</button><button id="prologue-skip" class="text-button">略過序章，直接進入第一幕</button>');
 $('#prologue-begin').onclick=()=>startChallenge('prologue',{modal,playCue,fresh:true,success:()=>{collectShard(state,PROLOGUE_SHARD);save();toast('序章完成，鏡之碎片已收入筆記');openChapterIntro();}});
 $('#prologue-skip').onclick=openChapterIntro;
}
function openChapterIntro(){modal('第十三聲鐘響','CHAPTER I · 黑鐘書庫',`<p class="modal-text">鐘聲還在耳邊迴盪。下方的對話框會一句一句說完今夜發生的事。\n\n先看看桌上那隻倒著走的懷錶。</p><p class="modal-note">點一下對話框或「繼續」讀下一句，「回顧紀錄」可以重看本幕讀過的文字。點擊場景中的光點探索；物品要按「收取」才會放進口袋。卡住時，畫面上方的「下一步建議」會指出方向。進度會自動儲存。</p><button id="intro-explore" class="primary-button">開始探索 ⟶</button>`);$('#intro-explore').onclick=closeModal;}
const mergeIds=(a=[],b=[])=>[...new Set([...a,...b])];
// The 推理簿 and the 收藏 tab in the journal. Both only read the state.
function clueBook(){
 const words=state.clues||[],total=Object.keys(clueWords).length;
 const sections=Object.entries(clueGroups).map(([group,name])=>{const list=words.filter(id=>clueWords[id].group===group);return list.length?`<section class="journal-chapter"><h3>${name}</h3><ul class="clue-book">${list.map(id=>`<li>${clueWords[id].label}</li>`).join('')}</ul></section>`:'';}).join('');
 return {summary:`推理簿收錄 ${words.length} / ${total} 個線索詞。詞彙隨旅程收錄，開始新旅程時會清空。`,html:sections||'<p class="modal-text">推理簿還是空的。回到場景檢視線索，詞彙會自動收錄。</p>'};
}
function collectionBook(){
 const found=state.shards||[],unlocked=state.achievements||[];
 const titleOf=id=>rooms.find(room=>room.spots.some(spot=>spot.id===id))?.title??'序章';
 const ready=shardIds.every(id=>found.includes(id));
 return `<h3>鏡之碎片 ${shardIds.filter(id=>found.includes(id)).length} / ${shardIds.length}</h3><ul class="shard-list">${shardIds.map(id=>`<li class="${found.includes(id)?'found':''}">${found.includes(id)?'◇ '+titleOf(id)+' · 已收藏':'◆ 尚未發現'}</li>`).join('')}</ul><h3>成就 ${unlocked.length} / ${achievements.length}</h3><ul class="achievement-list">${achievements.map(item=>{const got=unlocked.includes(item.id);return `<li class="${got?'unlocked':'locked'}"><strong>${got?item.title:'？？？'}</strong><span>${got?item.text:'尚未達成。'}</span></li>`;}).join('')}</ul><button id="secret-epilogue" class="primary-button" ${ready?'':'disabled'}>${ready?secretEpilogue.title+' · 閱讀祕密尾聲 ⟶':'集滿碎片後解鎖祕密尾聲'}</button>`;
}
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
function openCredits(){
 soundtrack.select('credits');
 modal('片尾名單','CREDITS · 製作名單',credits.map(group=>`<section class="credit-group"><h3>${group.role}</h3>${group.lines.map(line=>`<p>${line}</p>`).join('')}</section>`).join('')+`<p class="modal-note">${creditsNote}</p><button id="credits-close" class="primary-button">闔上名單</button>`);
 $('#credits-close').onclick=closeModal;
 $('#modal').addEventListener('close',()=>soundtrack.select(currentTrack()),{once:true});
}
function confirmImport(imported){const s=imported.state;modal('匯入這段旅程？','IMPORT · 攜帶存檔',`<p class="modal-text">檔案中的旅程：真相 ${s.solved.length} / ${rooms.length} · 結局 ${s.endings.length} / 3 · 人物記憶 ${s.memories.length} / ${memoryCollection(s).length}。\n\n匯入後，會取代此裝置目前的進度。</p><button id="import-confirm" class="primary-button">匯入並繼續 ⟶</button><button id="import-cancel" class="secondary-button">保留目前進度</button>`);$('#import-confirm').onclick=()=>{state={...s,muted:state.muted,shards:mergeIds(s.shards,state.shards),achievements:mergeIds(s.achievements,state.achievements)};setChallenges(imported.puzzles);save();closeModal();showView('home');toast('存檔已匯入');};$('#import-cancel').onclick=closeModal;}
function confirmReset(){modal('重新踏入魔鏡？','NEW JOURNEY · 新的旅程','<p class="modal-text">目前的章節進度、線索、物品與計時將重設。已發現的結局會保留。</p><button id="reset-confirm" class="primary-button">重新開始 ⟶</button><button id="reset-cancel" class="secondary-button">保留目前旅程</button>');$('#reset-confirm').onclick=()=>{closeModal();begin()};$('#reset-cancel').onclick=closeModal;}
function playlogPanel(){const rows=summarizePlaylog(playlog.events,rooms.map(r=>r.title));return `<div class="playlog-panel" aria-label="試玩紀錄摘要">${rows.length?`<table class="playlog-table"><thead><tr><th>章節</th><th>分鐘</th><th>修復</th><th>最久機關</th><th>答錯</th><th>提示</th></tr></thead><tbody>${rows.map(r=>`<tr${r.stalled.length?' class="playlog-stall"':''}><td>${r.title}</td><td>${r.minutes??'進行中'}</td><td>${r.restoreMinutes??'—'}</td><td>${r.longest?stageLabel(rooms[r.index].id,r.longest.step)+' '+r.longest.minutes+(r.stalled.length?' ⚠':''):'—'}</td><td>${r.fails}</td><td>${r.hint} / 3</td></tr>`).join('')}</tbody></table>`:'<p class="modal-note">開始探索後，這裡會列出每一幕的耗時、答錯次數與提示層級。</p>'}<div class="playlog-actions"><button id="playlog-copy" class="secondary-button">複製紀錄</button><button id="playlog-download" class="secondary-button">下載 JSON</button><button id="playlog-clear" class="secondary-button">清除</button></div></div>`;}
function openSettings(){modal('讓黑暗更適合妳','SETTINGS · 遊戲設定',`<div class="settings-row"><span>場景配樂與音效</span><button id="setting-sound">${state.muted?'關閉':'開啟'}</button></div><div class="settings-row"><span>減少動畫</span><button id="setting-motion" aria-pressed="${document.body.classList.contains('reduce-motion')}">${document.body.classList.contains('reduce-motion')?'已開啟':'開啟'}</button></div><div class="settings-row"><span>較大閱讀文字</span><button id="setting-text" aria-pressed="${ui.preferences.largeText}">${ui.preferences.largeText?'已開啟':'開啟'}</button></div><div class="settings-row"><span>逐字顯示對話<small class="settings-hint">逐字顯示時，點一下對話框可立即顯示整句</small></span><button id="setting-typewriter" aria-pressed="${ui.preferences.typewriter}">${ui.preferences.typewriter?'已開啟':'開啟'}</button></div>${'vibrate' in navigator?`<div class="settings-row"><span>震動回饋<small class="settings-hint">解開封印、答錯或收取物品時輕震</small></span><button id="setting-vibrate" aria-pressed="${ui.preferences.vibrate}">${ui.preferences.vibrate?'已開啟':'開啟'}</button></div>`:''}<div class="settings-row"><span>遊玩模式<small class="settings-hint">解謎模式隱藏提示；故事模式保留下一步建議</small></span><button id="setting-mode">${ui.preferences.mode==='story'?'故事模式':'解謎模式'}</button></div><div class="settings-row"><span>單人試玩紀錄<small class="settings-hint">記錄自己的遊玩過程，只存在此裝置</small></span><button id="setting-playlog" aria-pressed="${playlog.enabled}">${playlog.enabled?'記錄中':'開啟'}</button></div>${playlog.enabled?playlogPanel():''}<div class="settings-row"><span>儲存狀態</span><span>${saveFailed?'此瀏覽器無法儲存':'此裝置自動存檔'}</span></div><fieldset class="settings-volume"><legend>音量</legend>${[['master','主音量'],['music','音樂'],['sfx','音效'],['ambience','環境音']].map(([name,label])=>`<label class="settings-slider"><span>${label}</span><input type="range" min="0" max="100" step="5" value="${Math.round(ui.preferences.volumes[name]*100)}" data-volume="${name}" aria-label="${label}音量"></label>`).join('')}</fieldset><div class="settings-row"><span>攜帶存檔<small class="settings-hint">匯出成檔案，在另一台裝置匯入繼續</small></span><span class="settings-pair"><button id="save-export">匯出</button><button id="save-import">匯入</button></span></div><input id="save-file" type="file" accept="application/json,.json" hidden><button id="setting-reset" class="secondary-button danger-button">重設本次旅程</button><p class="modal-note">存檔只儲存遊戲進度，不收集姓名、帳號或個人資料。關閉網頁後，下次可從首頁繼續。</p>`);$('#setting-sound').onclick=async()=>{await toggleSound();$('#setting-sound').textContent=state.muted?'關閉':'開啟'};$('#setting-motion').onclick=()=>{const enabled=!ui.preferences.reduceMotion;ui.setPreference('reduceMotion',enabled);$('#setting-motion').textContent=enabled?'已開啟':'開啟';$('#setting-motion').setAttribute('aria-pressed',String(enabled))};$('#setting-text').onclick=()=>{const enabled=!ui.preferences.largeText;ui.setPreference('largeText',enabled);$('#setting-text').textContent=enabled?'已開啟':'開啟';$('#setting-text').setAttribute('aria-pressed',String(enabled));};$('#setting-typewriter').onclick=()=>{const enabled=!ui.preferences.typewriter;ui.setPreference('typewriter',enabled);if(!enabled)dialogueBox.finish();$('#setting-typewriter').textContent=enabled?'已開啟':'開啟';$('#setting-typewriter').setAttribute('aria-pressed',String(enabled));};$('#setting-vibrate')?.addEventListener('click',()=>{const enabled=!ui.preferences.vibrate;ui.setPreference('vibrate',enabled);$('#setting-vibrate').textContent=enabled?'已開啟':'開啟';$('#setting-vibrate').setAttribute('aria-pressed',String(enabled));if(enabled)try{navigator.vibrate(15);}catch{}});$('#setting-mode').onclick=()=>{const next=ui.preferences.mode==='story'?'puzzle':'story';ui.setPreference('mode',next);$('#setting-mode').textContent=next==='story'?'故事模式':'解謎模式';if(view==='game')renderGame();};document.querySelectorAll('[data-volume]').forEach(input=>input.oninput=()=>{const value=Number(input.value)/100;ui.setVolume(input.dataset.volume,value);mixer.setLevel(input.dataset.volume,value);});$('#setting-reset').onclick=confirmReset;$('#save-export').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([exportSave(state,completedChallenges())],{type:'application/json'}));a.download='blood-mirror-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('存檔已匯出');};$('#save-import').onclick=()=>$('#save-file').click();$('#save-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const imported=parseSave(await file.text());confirmImport(imported);}catch(error){toast(error.message||'無法匯入這個檔案');}};$('#setting-playlog').onclick=()=>{playlog.setEnabled(!playlog.enabled);if(playlog.enabled){loggedRoom=null;log('room');}openSettings();};$('#playlog-copy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(playlog.export());toast('試玩紀錄已複製');}catch{toast('無法存取剪貼簿，請改用下載');}});$('#playlog-download')?.addEventListener('click',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([playlog.export()],{type:'application/json'}));a.download='blood-mirror-playlog.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});$('#playlog-clear')?.addEventListener('click',()=>{playlog.clear();openSettings();toast('試玩紀錄已清除');});}
function stopAudio(){soundtrack.stop();ambience.stop();}
async function startAudio(){await soundtrack.start(currentTrack());ambience.select(view==='game'?rooms[state.room].atmosphere:null);}
async function toggleSound(){gallery.stopPreview(false);if(state.muted){try{await startAudio();state.muted=false;toast('環境音效已開啟')}catch{state.muted=true;toast('此瀏覽器目前無法播放音效。')}}else{state.muted=true;stopAudio()}updateSound();save();}
function updateSound(){$('#sound-icon').innerHTML=icon(state.muted?'mute':'sound');$('#sound').setAttribute('aria-pressed',String(!state.muted));$('#sound').setAttribute('aria-label',state.muted?'開啟環境音效':'關閉環境音效');$('.sound-label').textContent=state.muted?'音效關閉':'音效開啟';$('.settings-toggle').innerHTML=icon('gear');}
// The feedback layer (juice.js) answers every cue, so actions still land when the sound is off.
function playCue(kind){juice?.cue(kind);if(state.muted)return;sfx.play(kind);}
let galleryReturn='home';
const gallery=createGallery({getEndings:()=>state.endings,openModal:modal,closeModal,onPreviewStart:stopAudio,onPreviewStop:()=>{if(!state.muted&&!document.hidden)startAudio().catch(()=>{});}});
function openGallery(){if(view!=='gallery')galleryReturn=view;showView('gallery');}
$('#gallery-return').onclick=()=>showView(galleryReturn);
$('#sound').onclick=toggleSound;$('#start').onclick=()=>state.started?confirmReset():begin();$('#continue').onclick=()=>showView(state.ending?'ending':'game');$('.brand').onclick=e=>{e.preventDefault();showView('home')};$$('[data-action]').forEach(b=>b.onclick=()=>{if(b.closest('#game-nav')&&matchMedia('(max-width:850px)').matches)ui.closeMenu(true);const a=b.dataset.action;if(a==='home')showView('home');if(a==='gallery')openGallery();if(a==='guide')openGuide();if(a==='story')openStory();if(a==='journal')openJournal();if(a==='hint')openHint();if(a==='settings')openSettings();if(a==='chapters'){showView('home');$('#chapters').scrollIntoView({behavior:document.body.classList.contains('reduce-motion')?'instant':'smooth'});}if(a==='reconsider'){state.ending=null;state.room=rooms.length-1;save();showView('game');openFate();}});
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
function clampPan(){const max=Math.max(0,(frame.offsetWidth-scene.clientWidth)/2);panX=Math.min(max,Math.max(-max,panX));frame.style.setProperty('--pan-x',panX+'px');}
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
 modal('暫停','MENU · 選單',`<div class="pause-menu"><button id="pause-resume" class="primary-button">繼續探索 ⟶</button><button id="pause-journal" class="secondary-button">線索筆記</button><button id="pause-gallery" class="secondary-button">魔鏡藝廊</button><button id="pause-settings" class="secondary-button">設定與攜帶存檔</button><button id="pause-title" class="secondary-button">返回標題</button><p class="modal-note"><a href="${labHome}">← 返回 LUCAS LAB 遊戲館</a></p></div>`);
 $('#pause-resume').onclick=closeModal;
 $('#pause-journal').onclick=openJournal;
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
document.addEventListener('keydown',event=>{if(event.key.toLowerCase()==='l'&&view==='game'&&!$('#modal').open&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();lightCandles();}});
hydrateIcons();enableButtonArrows();state.muted=true;updateSound();renderHome();
