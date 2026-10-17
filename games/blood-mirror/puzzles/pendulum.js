// The pendulum (鐘擺, 鏡淵 E1, second mechanism). The old pendulum is 1 unit long and swings once per beat. Its engraving
// says "擺兩次，鐘響一次": the new pendulum must take twice as long per swing, so its period ratio is 2. A period grows with
// the square root of the length, so the new pendulum must be 4 units long: the 1-unit rod plus 3 units of weights.
// Doubling the length (the obvious guess) gives a ratio of only 1.41. The rules are pure and checked by search in
// scripts/blood-mirror-abyss.test.mjs; the mount below only draws them.
import {animate} from './clock.js';
import {ensureMaterials} from './materials.js';
import {hintMarkup,bindHints} from './belfry-hints.js';

export const BASE=1,TARGET=2,TOLERANCE=.04;
export const WEIGHTS=[{id:'a',len:.75,name:'輕'},{id:'b',len:2.25,name:'重'},{id:'c',len:1.5,name:'中'}];
export const length=attached=>BASE+WEIGHTS.filter(weight=>attached.includes(weight.id)).reduce((sum,weight)=>sum+weight.len,0);
// New period divided by the old one (the old pendulum is 1 unit long).
export const ratio=attached=>Math.sqrt(length(attached));
export const pendulumSolved=attached=>Math.abs(ratio(attached)-TARGET)<=TOLERANCE;
// Every subset of the weights that solves it. The design needs exactly one.
export function solveAll(){
 const found=[];
 for(let mask=0;mask<1<<WEIGHTS.length;mask++){
  const attached=WEIGHTS.filter((_,i)=>mask>>i&1).map(weight=>weight.id);
  if(pendulumSolved(attached))found.push(attached);
 }
 return found;
}

// Candle-light hints, three tiers per step, chosen from the weights the player has hung: none yet, too fast or too slow.
const RULE='週期和擺長的平方根成正比：週期要變成 2 倍，擺長就要變成 4 倍。細桿本身長 1 格，所以配重加起來要剛好 3 格。';
const ANSWER='掛上「輕」（0.75 格）和「重」（2.25 格）兩塊，不掛「中」。';
export const HINTS={
 idle:[
  '左邊是舊鐘擺，右邊是新的。刻痕說：「擺兩次，鐘響一次。」先掛上一塊配重，看看新擺的速度怎麼變。',
  '「擺兩次，鐘響一次」是說新擺擺一趟的時間，要等於舊擺擺兩趟，也就是新擺的週期要是舊擺的 2 倍。'+RULE,
  ANSWER
 ],
 fast:[
  '新擺還不夠慢：它擺一趟的時間，比舊擺兩趟短。再加一點長度，或換一組配重。',
  RULE,
  ANSWER
 ],
 slow:[
  '新擺太慢了：它擺一趟的時間，比舊擺兩趟還長。拿掉一點長度，或換一組配重。',
  RULE,
  ANSWER
 ]
};
export function hintStep(attached){
 if(pendulumSolved(attached))return null;
 if(!attached.length)return 'idle';
 return ratio(attached)<TARGET?'fast':'slow';
}

const NS='http://www.w3.org/2000/svg';
const UNIT=42,PIVOT_Y=26,OLD_X=105,NEW_X=290,SWING=.42,OLD_PERIOD=1.9;
// Painted parts (assets/puzzles/pend-*.webp). A bob hangs from its loop: its sphere sits at the end of the rod, so the picture is
// placed with the sphere's centre (a sphere as wide as the picture, resting on its bottom edge) on the rod's end.
const BOB={new:{src:'pend-bob.webp',w:32,h:40},old:{src:'pend-bob-old.webp',w:26,h:39.2}};
const DISC_SIZE=23;
const bobImage=kind=>{const {src,w,h}=BOB[kind];return '<circle cx="1.8" cy="2.6" r="'+w/2+'" fill="#000" fill-opacity=".32"/><image href="assets/puzzles/'+src+'" x="'+(-w/2)+'" y="'+(-(h-w/2))+'" width="'+w+'" height="'+h+'" pointer-events="none"/>';}; // OLD_PERIOD: seconds the old pendulum takes on screen

// ctx = { render(html), done(), playCue(kind) }
export function mountPendulum(ctx){
 ensureMaterials();
 const still=document.body.classList.contains('reduce-motion');
 const useIsland=typeof ctx.mountPuzzleIsland==='function';
 let attached=[],started=performance.now(),finishing=false;
 ctx.render('<div class="belfry">'
  +'<p class="challenge-help">左邊是舊鐘擺，右邊是新鐘擺。舊鐘擺的刻痕寫著：<b>「擺兩次，鐘響一次。」</b>替新鐘擺掛上配重，改變它的長度，讓它的節奏符合刻痕。</p>'
  +'<ol class="belfry-rules"><li>點下方的配重，掛上或取下。配重只會讓桿子變長。</li><li>新擺每擺完一趟，鐘會響一次。'+(still?'（已開啟減少動態：畫面不擺動，改用文字顯示兩擺的快慢比。）':'')+'</li></ol>'
  +'<p id="bf-status" class="belfry-status" role="status"></p>'
  +'<div class="belfry-board"><svg id="bf-svg" class="belfry-svg" viewBox="0 0 400 290" role="img" aria-label="兩座鐘擺：左邊舊擺長 1 格，右邊新擺可以掛配重"></svg></div>'
  +'<p id="pend-counts" class="belfry-note" aria-hidden="true"></p>'
  +(useIsland?'<div data-vue-pendulum-puzzle><p class="challenge-feedback" role="status">鐘擺控制載入中…</p></div>':'<div id="bf-weights" class="belfry-tray" role="group" aria-label="配重"></div><button id="bf-run" class="primary-button" hidden>放開擺錘 ⟶</button>')
  +hintMarkup+'</div>');
 const $=id=>document.getElementById(id),svg=$('bf-svg');
 const alive=()=>svg.isConnected;
 const say=(text,tone='')=>{const el=$('bf-status');el.textContent=text;el.dataset.tone=tone;};
 const hints=bindHints({hints:HINTS,currentStep:()=>hintStep(attached),alive});

 // Static scene: a brass ceiling beam, the pivots and the scale. Everything that moves is built once here and only has its attributes
 // set on each frame (the rods, the bobs, the three weights), so a swing never creates or removes an element.
 svg.innerHTML='<rect class="pend-beam-shadow" x="30" y="26" width="340" height="9" rx="4"/><rect class="pend-beam" x="30" y="14" width="340" height="12" rx="3"/><rect class="pend-beam-shine" x="31" y="15" width="338" height="3" rx="1.5"/>'
  +[46,115,200,285,354].map(x=>'<circle class="pend-rivet" cx="'+x+'" cy="20" r="1.9"/>').join('')
  +'<text class="pend-label" x="'+OLD_X+'" y="276">舊擺 · 1 格</text><text class="pend-label" id="pend-new-label" x="'+NEW_X+'" y="276"></text>'
  +Array.from({length:6},(_,i)=>'<line class="pend-tick" x1="380" y1="'+(PIVOT_Y+i*UNIT)+'" x2="392" y2="'+(PIVOT_Y+i*UNIT)+'"/><text class="pend-scale" x="378" y="'+(PIVOT_Y+i*UNIT+3)+'">'+i+'</text>').join('')
  +'<g id="pend-old"><line class="pend-rod old"/><line class="pend-rod-hi"/><g class="pend-bobshape" id="pend-old-bob">'+bobImage('old')+'</g></g>'
  +'<g id="pend-new"><line class="pend-rod"/><line class="pend-rod-hi"/>'
  +WEIGHTS.map(w=>'<image class="pend-disc-img" id="pend-disc-'+w.id+'" href="assets/puzzles/pend-disc.webp" x="'+(-DISC_SIZE/2)+'" y="'+(-DISC_SIZE/2)+'" width="'+DISC_SIZE+'" height="'+DISC_SIZE+'" visibility="hidden" pointer-events="none"/>').join('')
  +'<g class="pend-bobshape" id="pend-new-bob">'+bobImage('new')+'</g></g>'
  +'<circle class="pend-pivot" cx="'+OLD_X+'" cy="'+PIVOT_Y+'" r="4.6"/><circle class="pend-pivot" cx="'+NEW_X+'" cy="'+PIVOT_Y+'" r="4.6"/>'
  +'<text class="pend-bell" id="pend-bell" x="200" y="62" visibility="hidden">鐘響</text>';
 const el=id=>svg.querySelector('#'+id);
 const oldRods=[...svg.querySelectorAll('#pend-old line')],newRods=[...svg.querySelectorAll('#pend-new line')];
 const discEls=Object.fromEntries(WEIGHTS.map(w=>[w.id,el('pend-disc-'+w.id)]));
 const oldBob=el('pend-old-bob'),newBob=el('pend-new-bob'),counts=$('pend-counts');
 let lastCounts='';

 function place(rods,bob,x,units,angle){
  const bx=x+Math.sin(angle)*units*UNIT,by=PIVOT_Y+Math.cos(angle)*units*UNIT;
  for(const rod of rods){rod.setAttribute('x1',x);rod.setAttribute('y1',PIVOT_Y);rod.setAttribute('x2',bx.toFixed(1));rod.setAttribute('y2',by.toFixed(1));}
  bob.setAttribute('transform','translate('+bx.toFixed(1)+' '+by.toFixed(1)+') rotate('+(-angle*180/Math.PI).toFixed(1)+')');
 }
 // Each hung weight sits where it ends along the rod, so the length the player added can be seen.
 function pose(seconds){
  const units=length(attached),p=ratio(attached);
  const oldAngle=still?SWING:SWING*Math.sin(2*Math.PI*seconds/OLD_PERIOD);
  const newAngle=still?SWING:SWING*Math.sin(2*Math.PI*seconds/(OLD_PERIOD*p));
  place(oldRods,oldBob,OLD_X,BASE,oldAngle);
  place(newRods,newBob,NEW_X,units,newAngle);
  let reach=BASE;
  for(const weight of WEIGHTS){
   const disc=discEls[weight.id];
   if(!attached.includes(weight.id)){disc.setAttribute('visibility','hidden');continue;}
   reach+=weight.len;
   disc.setAttribute('visibility','visible');
   disc.setAttribute('transform','translate('+(NEW_X+Math.sin(newAngle)*reach*UNIT).toFixed(1)+' '+(PIVOT_Y+Math.cos(newAngle)*reach*UNIT).toFixed(1)+')');
  }
  return {oldSwings:Math.floor(seconds/OLD_PERIOD),newSwings:Math.floor(seconds/(OLD_PERIOD*p))};
 }

 function drawWeights(){
  if(useIsland)return;
  const box=$('bf-weights');box.textContent='';
  for(const weight of WEIGHTS){
   const on=attached.includes(weight.id),button=document.createElement('button');
   button.className='belfry-gear-button belfry-weight';button.setAttribute('aria-pressed',String(on));
   button.setAttribute('aria-label',weight.name+'配重，'+weight.len+' 格，'+(on?'已掛上，按下取下':'按下掛上'));
   button.innerHTML='<span class="pend-disc-slot" aria-hidden="true"><img src="assets/puzzles/pend-disc.webp" alt="" width="'+Math.round(24+weight.len*9)+'" height="'+Math.round(24+weight.len*9)+'" decoding="async" draggable="false"></span><b>'+weight.name+' · '+weight.len+' 格</b>';
   button.onclick=()=>act({type:'toggle-weight',id:weight.id});
   box.appendChild(button);
  }
 }

 function describe(){
  const p=ratio(attached);
  el('pend-new-label').textContent='新擺 · '+length(attached)+' 格';
  if(pendulumSolved(attached))return still?['節奏對了：新擺一趟，剛好是舊擺兩趟。','ok']:['新擺的節奏正在接近刻痕。等它擺完一趟。','ok'];
  if(!attached.length)return ['新擺只有細桿，和舊擺一樣快。',''];
  return still?['新擺一趟約等於舊擺 '+p.toFixed(2)+' 趟，目標是 2 趟。','']:['新擺比舊擺慢，但還不是「擺兩次，鐘響一次」。',''];
 }
 function refresh(){
  drawWeights();
  const [text,tone]=describe();say(text,tone);
  hints.changed();
  if(!useIsland)$('bf-run').hidden=!(still&&pendulumSolved(attached));
  if(still)pose(0);
 }
 function snapshot(){return {weights:WEIGHTS.map(weight=>({id:weight.id,length:weight.len,name:weight.name,attached:attached.includes(weight.id)})),reducedMotion:still,canRun:still&&pendulumSolved(attached)&&!finishing};}
 function act(action){
  if(!action||typeof action!=='object')return null;
  if(action.type==='toggle-weight'&&WEIGHTS.some(weight=>weight.id===action.id)){
   attached=attached.includes(action.id)?attached.filter(id=>id!==action.id):[...attached,action.id];
   started=performance.now();ctx.playCue('click');refresh();
  }else if(action.type==='run'&&still&&pendulumSolved(attached))finish();
  else return null;
  return snapshot();
 }
 if(!useIsland)$('bf-run').onclick=finish;
 function finish(){
  if(finishing)return;
  finishing=true;ctx.playCue('door');
  say('擺兩次，鐘響一次。第十三座鐘的節奏回來了。','ok');
  setTimeout(()=>{if(alive())ctx.done();},still?0:700);
 }

 refresh();
 if(useIsland)ctx.mountPuzzleIsland({snapshot:snapshot(),onAction:act});
 if(!still){
  let lastNew=0;
  animate(()=>{
   if(!alive())return false;
   const seconds=(performance.now()-started)/1000,swings=pose(seconds);
   if(swings.newSwings!==lastNew&&swings.newSwings>0&&!finishing){
    ctx.playCue('click');
    const bell=el('pend-bell');bell.setAttribute('visibility','visible');setTimeout(()=>bell.setAttribute('visibility','hidden'),500);
    if(pendulumSolved(attached))finish();
   }
   lastNew=swings.newSwings;
   // The counters sit outside the live status line, so a screen reader is not read to on every frame.
   const text='舊擺 '+swings.oldSwings+' 趟 · 新擺 '+swings.newSwings+' 趟';
   if(text!==lastCounts){lastCounts=text;counts.textContent=text;}
  });
 }
}
