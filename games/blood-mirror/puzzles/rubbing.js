// The protection-spell rubbing (保護咒拓印), second stage of act "crypt". The coffin lid is covered in
// grime: the player rubs each patch (pointer drag or the per-patch button) until the carving shows,
// then names the one seal the lid is missing from the eight the spell requires.
export const SEALS=['日','月','星','霜','火','鐵','鏡','名'];
// null is a patch worn smooth: that seal was chiselled off, and it is the one the player must name.
export const lid=['鐵','星','日','火','月',null,'鏡','霜'];
export const missingSeal=(carved=lid)=>SEALS.find(seal=>!carved.includes(seal));
export const rubbingSolved=(choice,carved=lid)=>choice===missingSeal(carved);

export function mountRubbing(ctx){
 const revealed=new Set();let message='';
 const draw=()=>{
  const all=revealed.size===lid.length;
  ctx.render('<p class="challenge-help">妳把王室契約翻到空白的背面，覆在棺蓋上。污垢下面有刻文：用手指（或滑鼠）在每一格上來回抹開，讓刻痕拓到紙上；也可以用旁邊的按鈕逐格揭露。</p>'
   +'<div class="rub-board" role="group" aria-label="棺蓋的八格刻文">'
   +lid.map((seal,i)=>'<button class="rub-cell'+(revealed.has(i)?' clear':'')+'" data-rub="'+i+'" aria-label="第'+(i+1)+'格，'+(revealed.has(i)?(seal?'刻著「'+seal+'」':'磨得一片平滑，什麼也沒有'):'被污垢蓋住，按下揭露')+'">'
    +(revealed.has(i)?(seal||'磨損'):'')+'</button>').join('')
   +'</div>'
   +(all
    ?'<p class="challenge-help">刻文最上方寫著：「保護咒需要八枚符印，一枚也不能少——日、月、星、霜、火、鐵、鏡、名。」\n棺蓋上少了一枚。是哪一枚被人鑿掉了？</p><div class="seal-choices" role="group" aria-label="選出缺少的符印">'
     +SEALS.map(seal=>'<button class="seal-choice" data-seal="'+seal+'" aria-label="缺少的符印是「'+seal+'」">'+seal+'</button>').join('')+'</div>'
    :'<p class="challenge-feedback" role="status">已揭露 '+revealed.size+' / '+lid.length+' 格</p>')
   +'<p class="challenge-feedback" role="status">'+message+'</p><button id="rub-reset" class="secondary-button">蓋回污垢</button>');
  const reveal=i=>{if(revealed.has(i))return;revealed.add(i);message='';ctx.playCue('click');draw();document.querySelector('[data-rub="'+i+'"]')?.focus({preventScroll:true});};
  document.querySelectorAll('[data-rub]').forEach(cell=>{
   cell.onclick=()=>reveal(Number(cell.dataset.rub));
   cell.onpointerenter=event=>{if(event.buttons===1||event.pointerType==='touch')reveal(Number(cell.dataset.rub));};
  });
  document.querySelectorAll('[data-seal]').forEach(button=>button.onclick=()=>{
   if(rubbingSolved(button.dataset.seal)){ctx.done();return;}
   message='「'+button.dataset.seal+'」已經好好地刻在棺蓋上了。再對照一次刻文。';ctx.playCue('wrong');draw();
  });
  document.querySelector('#rub-reset').onclick=()=>{revealed.clear();message='';draw();};
 };
 draw();
}
