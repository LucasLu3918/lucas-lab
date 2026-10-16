// The glass-heart circle (玻璃心臟法陣), act "hunter". Seven runes stand on a ring. The hunter's notes say
// where to begin and how far to jump each time; following the rule visits every rune exactly once.
export const NODES=7,STEP=3,START=0;
export const heartNames=['月','鐘','針','鏡','霜','血','門'];
// The order in which the runes must be touched.
export const heartPath=Array.from({length:NODES},(_,i)=>(START+i*STEP)%NODES);
export const heartPathValid=path=>path.length===NODES&&new Set(path).size===NODES&&path.every((node,i)=>node===heartPath[i]);

// The brass hand sweeps clockwise, one jump per correct press. It is kept as a running total, so it never swings back:
// a wrong press carries it forward to the top of the dial.
const JUMP=STEP*360/NODES;

// The board is drawn once and patched in place. Re-rendering it on every press would restart the transitions,
// so a rune would snap to its lit look instead of catching the light.
export function mountRuneHeart(ctx){
 let done=[],failures=0,sweep=0;
 ctx.render('<p class="challenge-help">七個符文圍成一圈，中央是一顆失去跳動的玻璃心臟。獵人的筆記寫著：「從刻有月亮的符文開始。每一次都越過兩個符文，點亮第三個——繞三圈，七個符文都會亮起來。」</p>'
  +'<div class="heart-ring" role="group" aria-label="七個符文，順時針排列">'
  +'<span class="heart-hand" aria-hidden="true"></span>'
  +heartNames.map((name,i)=>'<button class="heart-node n'+i+'" data-node="'+i+'" aria-pressed="false" aria-label="第'+(i+1)+'個符文「'+name+'」">'+name+'</button>').join('')
  +'<span class="heart-core" aria-hidden="true">0 / '+NODES+'</span></div>'
  +'<p class="challenge-feedback" role="status"></p>'
  +'<p class="challenge-help heart-hint" hidden>提示：數到第三個符文時才觸碰，符文的編號依順時針遞增，繞過 7 之後回到 1。</p>'
  +'<button id="heart-reset" class="secondary-button">熄滅重來</button>');
 const ring=document.querySelector('.heart-ring');
 const paint=message=>{
  ring.style.setProperty('--turn',sweep+'deg');
  ring.style.setProperty('--glow',String(done.length/NODES));
  ring.querySelectorAll('[data-node]').forEach(button=>{
   const i=Number(button.dataset.node),lit=done.includes(i);
   button.classList.toggle('lit',lit);
   button.setAttribute('aria-pressed',String(lit));
   button.setAttribute('aria-label','第'+(i+1)+'個符文「'+heartNames[i]+'」'+(lit?'，已點亮':''));
  });
  ring.querySelector('.heart-core').textContent=done.length+' / '+NODES;
  document.querySelector('.challenge-feedback').textContent=message||'已點亮 '+done.length+' / '+NODES+' 個符文。';
  document.querySelector('.heart-hint').hidden=failures<2;
 };
 const turnToTop=()=>{sweep=Math.ceil(sweep/360)*360;};
 const press=button=>{
  const node=Number(button.dataset.node);
  if(done.includes(node))return;
  if(node!==heartPath[done.length]){
   done=[];failures++;turnToTop();ctx.playCue('wrong');
   // Restart the jolt even when a previous one is still playing.
   ring.classList.remove('jolt');void ring.offsetWidth;ring.classList.add('jolt');
   paint('法陣的光熄滅了。從刻有月亮的符文重新開始。');
   return;
  }
  done=[...done,node];sweep+=JUMP;ctx.playCue('click');
  paint();
  if(done.length===NODES){ctx.done();return;}
  button.focus({preventScroll:true});
 };
 ring.addEventListener('click',event=>{const button=event.target.closest('[data-node]');if(button)press(button);});
 ring.addEventListener('animationend',event=>{if(event.animationName==='heart-jolt')ring.classList.remove('jolt');});
 document.querySelector('#heart-reset').onclick=()=>{done=[];turnToTop();paint();};
 paint();
}
