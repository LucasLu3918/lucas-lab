// The pocket watch (懷錶齒輪), second stage of act "library". Three meshed gears sit behind the case.
// Turning one gear also drags its neighbour backwards, so the hand only runs forward once all three
// marks line up. Positions are 0..5 (sixty degrees apiece); 0 is the engraved mark.
export const GEARS=['時輪','分輪','秒輪'],TEETH=6;
export const startGears=[2,4,0];
// Turning gear i advances it one tooth and pulls the next gear (wrapping round) back one tooth.
export const turnGear=(gears,i)=>{
 const next=[...gears];
 next[i]=(next[i]+1)%TEETH;
 const j=(i+1)%GEARS.length;
 next[j]=(next[j]+TEETH-1)%TEETH;
 return next;
};
export const watchSolved=gears=>gears.length===GEARS.length&&gears.every(position=>position===0);
// Fewest turns that bring `start` to the marks (breadth-first search); -1 when unreachable.
export function minTurns(start=startGears){
 const key=g=>g.join(','),seen=new Map([[key(start),0]]);
 let frontier=[start];
 while(frontier.length){
  const following=[];
  for(const gears of frontier){
   if(watchSolved(gears))return seen.get(key(gears));
   for(let i=0;i<GEARS.length;i++){
    const next=turnGear(gears,i);
    if(!seen.has(key(next))){seen.set(key(next),seen.get(key(gears))+1);following.push(next);}
   }
  }
  frontier=following;
 }
 return -1;
}

export function mountWatch(ctx){
 let gears=[...startGears],turns=0;
 const draw=()=>{
  const aligned=gears.filter(position=>position===0).length;
  ctx.render('<p class="challenge-help">錶蓋裡藏著三枚咬合的齒輪，指針正在倒著走。每轉動一枚齒輪，它的下一枚就會被拉回一格——讓三道刻痕同時對準，指針才會重新往前走。</p>'
   +'<div class="watch-board" role="group" aria-label="懷錶的三枚齒輪">'
   +gears.map((position,i)=>'<button class="watch-gear rot'+position+(position===0?' aligned':'')+'" data-gear="'+i+'" aria-label="'+GEARS[i]+'，刻痕在第 '+(position+1)+' 格（共 '+TEETH+' 格），'+(position===0?'已對準':'尚未對準')+'，按下轉動一格">'
    +'<span class="watch-mark" aria-hidden="true">▲</span><span class="watch-name">'+GEARS[i]+'</span></button>').join('')
   +'</div><p id="watch-status" class="challenge-feedback" role="status">'+aligned+' / '+GEARS.length+' 道刻痕已對準 · 已轉動 '+turns+' 次</p>'
   +'<button id="watch-reset" class="secondary-button">齒輪歸位</button>');
  document.querySelectorAll('[data-gear]').forEach(button=>button.onclick=()=>{
   const i=Number(button.dataset.gear);
   gears=turnGear(gears,i);turns++;ctx.playCue('click');
   if(watchSolved(gears)){ctx.done();return;}
   draw();
  });
  document.querySelector('#watch-reset').onclick=()=>{gears=[...startGears];turns=0;draw();};
 };
 draw();
}
