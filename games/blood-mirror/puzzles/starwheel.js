// The star wheel (星輪, 鏡淵 E1, third mechanism, opened by the gear train and the pendulum). The rim has 13 notches; the ruby
// sits at notch 0. Notches 1-12 carry the numerals 一 to 十二 in a scrambled order that is only legible by candle light, and
// a hammer strikes the rim once per toll. The hammer moves a fixed number of notches clockwise on every toll, and tolls 一 to
// 十二 must each strike their own numeral; the thirteenth toll then lands on the ruby, which opens the compartment. Because 13
// is prime, the hammer visits every notch once. Only one step size fits the engraving. The rules are pure and checked by search
// in scripts/blood-mirror-abyss.test.mjs; the mount below only draws them.
import {animate} from './clock.js';
import {hintMarkup,bindHints} from './belfry-hints.js';

export const NOTCHES=13,RUBY=0,TRUE_STEP=5;
export const NUMERALS=['一','二','三','四','五','六','七','八','九','十','十一','十二'];
const inverse=a=>{for(let x=1;x<NOTCHES;x++)if(a*x%NOTCHES===1)return x;return 0;};
// Numeral (1-12) engraved at a notch, or 0 for the ruby: toll n must land where the engraving says n.
export const numeralAt=notch=>notch===RUBY?0:inverse(TRUE_STEP)*notch%NOTCHES;
export const notchOf=(step,toll)=>step*toll%NOTCHES;
// Plays 13 tolls with a hammer step of `step` notches. `fault` is the first toll that strikes the wrong numeral.
export function playTolls(step){
 for(let toll=1;toll<=12;toll++){
  const landed=numeralAt(notchOf(step,toll));
  if(landed!==toll)return {ok:false,fault:{toll,landed,notch:notchOf(step,toll)}};
 }
 return {ok:notchOf(step,13)===RUBY,fault:null};
}
export const wheelSolved=step=>playTolls(step).ok;
export function solveAll(){const found=[];for(let step=1;step<NOTCHES;step++)if(wheelSolved(step))found.push(step);return found;}

// Candle-light hints, three tiers per step: before the candle was lit, and after.
export const HINTS={
 dark:[
  '星輪邊緣刻著字，但在黑暗裡看不見。按「點燭」，用燭光照亮它。',
  '燭光下，每個缺口旁有一個數字，只有紅寶石那一格是空白。撥爪從紅寶石出發，一聲一聲順時針敲下去。',
  '「一」在紅寶石順時針第 5 格。把撥爪設為 5，再按「敲鐘」，第十三聲會剛好回到紅寶石。'
 ],
 lit:[
  '第一聲要敲在「一」上，第二聲敲在「二」上，一路到十二，第十三聲回到紅寶石。撥爪每一聲跨的格數是固定的。',
  '從紅寶石順時針數到「一」，那個格數就是撥爪每一聲跨的格數。再檢查：「二」應該在它的兩倍處（超過 13 格就扣掉 13 格）。',
  '「一」在紅寶石順時針第 5 格。把撥爪設為 5，再按「敲鐘」。'
 ]
};
export const hintStep=(solvedNow,everLit)=>solvedNow?null:everLit?'lit':'dark';

const NS='http://www.w3.org/2000/svg',CENTER=160,RING=116;
const point=(notch,radius)=>{const angle=notch*Math.PI*2/NOTCHES;return [CENTER+Math.sin(angle)*radius,CENTER-Math.cos(angle)*radius];};
const numeralName=n=>n?NUMERALS[n-1]:'';

// ctx = { render(html), done(), playCue(kind) }
export function mountStarWheel(ctx){
 const still=document.body.classList.contains('reduce-motion');
 let lit=false,everLit=false,step=1,running=false,solvedNow=false;
 ctx.render('<div class="belfry">'
  +'<p class="challenge-help">星輪有 13 個缺口，紅寶石在最上面。撥爪每響一聲，就順時針跨過固定的格數，敲在缺口上。<b>讓第一聲到第十二聲，依序敲在刻著「一」到「十二」的缺口上</b>，第十三聲就會落回紅寶石，暗格才會鬆開。</p>'
  +'<ol class="belfry-rules"><li>邊緣的刻字要用燭光才看得見。</li><li>用「−」「＋」設定撥爪每一聲跨幾格，再按「敲鐘」。敲錯不會有懲罰，只會停在出錯的那一聲。</li></ol>'
  +'<p id="bf-status" class="belfry-status" role="status"></p>'
  +'<div class="belfry-board wheel-board"><svg id="bf-svg" class="belfry-svg wheel-svg" viewBox="0 0 320 320" role="img" aria-label="十三格星輪"></svg></div>'
  +'<p id="wheel-engraving" class="wheel-engraving" hidden>刻在輪緣內側：「曲柄十三圈，輪走一圈。擺兩次，鐘響一次。響到第十三聲，暗格才開。」</p>'
  +'<div class="belfry-row"><button id="wheel-candle" class="secondary-button" aria-pressed="false">點燭</button>'
  +'<span class="wheel-step"><button id="wheel-less" class="secondary-button" aria-label="撥爪少跨一格">−</button><output id="wheel-step" class="belfry-note" aria-live="polite"></output><button id="wheel-more" class="secondary-button" aria-label="撥爪多跨一格">＋</button></span></div>'
  +'<button id="bf-run" class="primary-button">敲鐘 ⟶</button>'
  +hintMarkup+'</div>');
 const $=id=>document.getElementById(id),svg=$('bf-svg');
 const alive=()=>svg.isConnected;
 const say=(text,tone='')=>{const el=$('bf-status');el.textContent=text;el.dataset.tone=tone;};
 const hints=bindHints({hints:HINTS,currentStep:()=>hintStep(solvedNow,everLit),alive});

 let body='<circle class="wheel-ring" cx="'+CENTER+'" cy="'+CENTER+'" r="'+RING+'"/><circle class="wheel-hub" cx="'+CENTER+'" cy="'+CENTER+'" r="26"/>';
 for(let notch=0;notch<NOTCHES;notch++){
  const [x1,y1]=point(notch,RING-9),[x2,y2]=point(notch,RING+9),[tx,ty]=point(notch,RING-30);
  body+='<line class="wheel-notch" x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'"/>';
  body+=notch===RUBY?'<circle class="wheel-ruby" cx="'+x2.toFixed(1)+'" cy="'+(y2+4).toFixed(1)+'" r="10"/>'
   :'<text class="wheel-glyph" x="'+tx.toFixed(1)+'" y="'+(ty+5).toFixed(1)+'" data-notch="'+notch+'">'+numeralName(numeralAt(notch))+'</text>';
 }
 body+='<line class="wheel-hammer" id="wheel-hammer" x1="'+CENTER+'" y1="'+CENTER+'" x2="'+CENTER+'" y2="'+(CENTER-RING+4)+'"/><circle class="wheel-hammer-head" id="wheel-head" cx="'+CENTER+'" cy="'+(CENTER-RING+4)+'" r="6"/>'
  +'<text class="wheel-toll" id="wheel-toll" x="'+CENTER+'" y="'+(CENTER+9)+'"></text>';
 svg.innerHTML=body;
 const aimHammer=notch=>{
  const [x,y]=point(notch,RING-4),line=$('wheel-hammer'),head=$('wheel-head');
  line.setAttribute('x2',x.toFixed(1));line.setAttribute('y2',y.toFixed(1));head.setAttribute('cx',x.toFixed(1));head.setAttribute('cy',y.toFixed(1));
 };

 function setLight(on){
  lit=on;if(on)everLit=true;
  svg.classList.toggle('lit',on);
  $('wheel-candle').setAttribute('aria-pressed',String(on));
  $('wheel-candle').textContent=on?'熄燭':'點燭';
  $('wheel-engraving').hidden=!on;
  hints.changed();
 }
 function showStep(){$('wheel-step').textContent='撥爪每聲跨 '+step+' 格';$('wheel-less').disabled=running||step<=1;$('wheel-more').disabled=running||step>=NOTCHES-1;}
 $('wheel-candle').onclick=()=>{ctx.playCue('click');setLight(!lit);};
 $('wheel-less').onclick=()=>{step=Math.max(1,step-1);ctx.playCue('click');showStep();};
 $('wheel-more').onclick=()=>{step=Math.min(NOTCHES-1,step+1);ctx.playCue('click');showStep();};

 // One toll every `gap` ms; the hammer jumps `step` notches each time. The result is known up front (playTolls).
 $('bf-run').onclick=()=>{
  if(running)return;
  running=true;showStep();$('bf-run').disabled=true;
  const result=playTolls(step),count=result.ok?13:result.fault.toll,gap=still?160:520;
  say('敲鐘……');
  let shown=0;
  animate(elapsed=>{
   if(!alive())return false;
   const toll=Math.min(count,Math.floor(elapsed/gap)+1);
   if(toll===shown)return;
   shown=toll;
   aimHammer(notchOf(step,toll));ctx.playCue('click');
   $('wheel-toll').textContent=toll<=12?numeralName(toll):'';
   if(toll<count)return;
   setTimeout(()=>{
    if(!alive())return;
    if(result.ok){
     solvedNow=true;ctx.playCue('door');say('第十三聲落在紅寶石上。暗格鬆開了。','ok');hints.changed();
     setTimeout(()=>{if(alive())ctx.done();},still?0:900);
    }else{
     const {toll:wrong,landed}=result.fault;
     say('第 '+wrong+' 聲敲在'+(lit?(landed?'「'+numeralName(landed)+'」':'紅寶石')+'上，應該敲在「'+numeralName(wrong)+'」上。':'錯的缺口上。點燭，看看缺口旁刻著什麼。'),'bad');
     ctx.playCue('wrong');aimHammer(RUBY);$('wheel-toll').textContent='';
     running=false;$('bf-run').disabled=false;showStep();
    }
   },still?0:450);
   return false;
  });
 };

 aimHammer(RUBY);showStep();say('撥爪還在紅寶石上。');hints.changed();
}
