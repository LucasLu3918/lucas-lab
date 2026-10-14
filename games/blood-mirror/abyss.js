// The area "帳本的背面" (鏡淵): a list of optional expert levels opened from the home page. Loaded on first use.
// Each level reads its opening, runs its puzzle in the usual modal, then shows what the mirror's ledger gives back.
import {abyss} from './data/abyss.js';
import {speakers} from './data/chapters/index.js';
import {isPuzzleComplete,startPuzzle} from './puzzles/index.js';

const line=({speaker,text})=>'<p class="abyss-line'+(speaker?' spoken':'')+'">'+(speaker?'<b>'+speakers[speaker].name+'</b>':'')+text+'</p>';
const lines=list=>'<div class="abyss-scene">'+list.map(line).join('')+'</div>';

let introSeen=false;

// api: { modal, closeModal, playCue, toast, options() -> startPuzzle options of the game, refresh() -> redraw the home entry }
export function openAbyss(api){
 const {modal,closeModal}=api;
 const list=()=>{
  const intro=introSeen?'':lines(abyss.entry);
  introSeen=true;
  modal(abyss.title,abyss.eyebrow,intro
   +'<div class="abyss-levels">'+abyss.levels.map(level=>{
    const done=isPuzzleComplete(level.puzzle);
    return '<button class="choice-option abyss-level" data-abyss="'+level.id+'"><img class="stage-thumb" src="assets/puzzles/thumbs/'+level.thumb+'.webp" alt="" width="112" height="64" decoding="async" draggable="false"><span class="stage-pick-text">'+level.number+' · '+level.title+'<small>'+level.subtitle+' · '+(done?'已完成':'尚未完成')+'</small></span></button>';
   }).join('')+'</div>'
   +'<p class="modal-note">底稿還有更多頁，尚未翻開。這些關卡不影響主線結局，也不會改變旅程進度。</p>'
   +'<button id="abyss-close" class="secondary-button">合上帳冊</button>');
  document.querySelectorAll('[data-abyss]').forEach(button=>button.onclick=()=>level(abyss.levels.find(item=>item.id===button.dataset.abyss)));
  document.getElementById('abyss-close').onclick=closeModal;
  document.querySelector('[data-abyss]')?.focus({preventScroll:true});
 };
 // A level with `reduced` ends in the short version while something it needs (a shard) is missing: no reward, a softer ending.
 const short=item=>!!item.reduced&&!(item.fullNeeds||[]).every(api.options().has);
 const reward=item=>{
  api.playCue('restore');api.refresh();
  const cut=short(item);
  modal(item.title,item.number+' · 解封',lines(cut?item.reduced.unlock:item.unlock)
   +(cut?'':'<div class="abyss-reward" role="group" aria-label="獲得"><span class="abyss-mark" aria-hidden="true">'+item.reward.mark+'</span><span>'+item.reward.name+'<small>'+(item.reward.caption||(item.reward.place||'內側')+'的記號：'+item.reward.mark)+'</small></span></div>')
   +'<button id="abyss-back" class="primary-button">回到帳本的背面 ⟶</button>');
  document.getElementById('abyss-back').onclick=list;
  document.getElementById('abyss-back').focus({preventScroll:true});
 };
 const stageNotes=item=>Object.fromEntries(Object.entries(item.stageLines||{}).map(([id,list])=>[id,lines(list)]));
 const play=(item,fresh)=>startPuzzle(item.puzzle,{...api.options(),fresh,stageLines:stageNotes(item),success:()=>{if(fresh)api.toast('重玩完成，進度不受影響。');if(fresh&&!item.reduced)list();else reward(item);}});
 function level(item){
  const done=isPuzzleComplete(item.puzzle);
  modal(item.title,item.number+' · '+item.subtitle,lines(item.scene)
   +(done?'<p class="modal-note">這一頁已經翻過。再玩一次不會改動任何進度。</p>':'')
   +'<button id="abyss-enter" class="primary-button">'+(done?'再玩一次':item.enter)+' ⟶</button>'
   +'<button id="abyss-list" class="secondary-button">返回</button>');
  document.getElementById('abyss-enter').onclick=()=>play(item,done);
  document.getElementById('abyss-list').onclick=list;
  document.getElementById('abyss-enter').focus({preventScroll:true});
 }
 list();
}
