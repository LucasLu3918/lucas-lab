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
// Outline of a toothed wheel as one SVG path (centred on 0,0), so the brass gears need no image file.
export function gearPath(teeth=12,outer=46,root=38){
 const step=Math.PI*2/teeth,point=(angle,radius)=>(radius*Math.sin(angle)).toFixed(1)+' '+(-radius*Math.cos(angle)).toFixed(1);
 let path='';
 for(let i=0;i<teeth;i++)for(const [offset,radius] of [[-.3,root],[-.16,outer],[.16,outer],[.3,root]])path+=(path?'L':'M')+point((i+offset)*step,radius);
 return path+'Z';
}
const GEAR_SVG='<svg class="gear-svg" viewBox="-50 -50 100 100" aria-hidden="true"><path class="gear-teeth" d="'+gearPath()+'"/><circle class="gear-rim" r="31"/>'
 +'<path class="gear-spokes" d="M0 -29V29M-29 0H29M-20.5 -20.5L20.5 20.5M20.5 -20.5L-20.5 20.5"/><circle class="gear-hub" r="9"/><circle class="gear-pin" r="3"/><circle class="gear-ruby" cy="-24" r="4.5"/></svg>';
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

// A warm-up movement comes first (plan r9): one turn of the hour gear also pulls the minute gear home,
// which shows the coupling before the real three-gear movement.
export const warmGears=[5,1,0];

export function mountWatch(ctx){
 let warm=true,gears=[...warmGears],turns=0;
 // Each gear remembers its total turn so a wrap from tooth 6 back to 1 keeps spinning the same way.
 let angles=gears.map(position=>position*60),shown=[...angles];
 const start=()=>warm?warmGears:startGears;
 const draw=(note='')=>{
  const aligned=gears.filter(position=>position===0).length;
  ctx.render('<p class="challenge-help">'+(warm
    ?'錶蓋裡藏著咬合的齒輪，指針正在倒著走。先試一次：轉動「時輪」，看看它的下一枚齒輪怎麼被拉回來。'
    :'三枚齒輪咬合在一起。每轉動一枚，它的下一枚就會被拉回一格（秒輪會拉回時輪）——讓三道刻痕同時對準，指針才會重新往前走。')+'</p>'
   +'<div class="watch-board" role="group" aria-label="懷錶的三枚齒輪">'
   +gears.map((position,i)=>'<button class="watch-gear rot'+position+(position===0?' aligned':'')+'" data-gear="'+i+'" aria-label="'+GEARS[i]+'，刻痕在第 '+(position+1)+' 格（共 '+TEETH+' 格），'+(position===0?'已對準':'尚未對準')+'，按下轉動一格">'
    +'<span class="gear-spin">'+GEAR_SVG+'</span><span class="watch-name">'+GEARS[i]+'</span></button>').join('')
   +'</div><p id="watch-status" class="challenge-feedback" role="status">'+(note||(warm?'暖身 · ':'')+aligned+' / '+GEARS.length+' 道刻痕已對準 · 已轉動 '+turns+' 次')+'</p>'
   +'<button id="watch-reset" class="secondary-button">齒輪歸位</button>');
  // The new markup starts at the previous angle, then turns to the new one on the next frame.
  const spins=[...document.querySelectorAll('.gear-spin')];
  spins.forEach((el,i)=>{el.style.transform='rotate('+shown[i]+'deg)';});
  void document.body.offsetWidth;
  spins.forEach((el,i)=>{el.style.transform='rotate('+angles[i]+'deg)';});
  shown=[...angles];
  document.querySelectorAll('[data-gear]').forEach(button=>button.onclick=()=>{
   const i=Number(button.dataset.gear);
   gears=turnGear(gears,i);turns++;ctx.playCue('click');
   angles[i]+=60;angles[(i+1)%GEARS.length]-=60;
   if(watchSolved(gears)){
    if(!warm){ctx.done();return;}
    warm=false;gears=[...startGears];turns=0;angles=gears.map(position=>position*60);shown=[...angles];
    draw('轉一枚，下一枚就倒退一格。錶芯真正的位置現在才露出來。');
    document.querySelector('[data-gear="'+i+'"]')?.focus({preventScroll:true});
    return;
   }
   draw();
  });
  document.querySelector('#watch-reset').onclick=()=>{gears=[...start()];turns=0;angles=gears.map(position=>position*60);shown=[...angles];draw();};
 };
 draw();
}
