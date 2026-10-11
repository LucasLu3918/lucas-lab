// The glass-heart circle (玻璃心臟法陣), act "hunter". Seven runes stand on a ring. The hunter's notes say
// where to begin and how far to jump each time; following the rule visits every rune exactly once.
export const NODES=7,STEP=3,START=0;
export const heartNames=['月','鐘','針','鏡','霜','血','門'];
// The order in which the runes must be touched.
export const heartPath=Array.from({length:NODES},(_,i)=>(START+i*STEP)%NODES);
export const heartPathValid=path=>path.length===NODES&&new Set(path).size===NODES&&path.every((node,i)=>node===heartPath[i]);

export function mountRuneHeart(ctx){
 let done=[],failures=0;
 const draw=message=>{
  ctx.render('<p class="challenge-help">七個符文圍成一圈，中央是一顆失去跳動的玻璃心臟。獵人的筆記寫著：「從刻有月亮的符文開始。每一次都越過兩個符文，點亮第三個——繞三圈，七個符文都會亮起來。」</p>'
   +'<div class="heart-ring" role="group" aria-label="七個符文，順時針排列">'
   +heartNames.map((name,i)=>'<button class="heart-node n'+i+(done.includes(i)?' lit':'')+'" data-node="'+i+'" aria-pressed="'+done.includes(i)+'" aria-label="第'+(i+1)+'個符文「'+name+'」'+(done.includes(i)?'，已點亮':'')+'">'+name+'</button>').join('')
   +'<span class="heart-core" aria-hidden="true">'+done.length+' / '+NODES+'</span></div>'
   +'<p class="challenge-feedback" role="status">'+(message||'已點亮 '+done.length+' / '+NODES+' 個符文。')+'</p>'
   +(failures>=2?'<p class="challenge-help">提示：數到第三個符文時才觸碰，符文的編號依順時針遞增，繞過 7 之後回到 1。</p>':'')
   +'<button id="heart-reset" class="secondary-button">熄滅重來</button>');
  document.querySelectorAll('[data-node]').forEach(button=>button.onclick=()=>{
   const node=Number(button.dataset.node);
   if(done.includes(node))return;
   if(node!==heartPath[done.length]){done=[];failures++;ctx.playCue('wrong');draw('法陣的光熄滅了。從刻有月亮的符文重新開始。');return;}
   done=[...done,node];ctx.playCue('click');
   if(done.length===NODES){ctx.done();return;}
   draw();
   document.querySelector('[data-node="'+node+'"]')?.focus({preventScroll:true});
  });
  document.querySelector('#heart-reset').onclick=()=>{done=[];draw();};
 };
 draw();
}
