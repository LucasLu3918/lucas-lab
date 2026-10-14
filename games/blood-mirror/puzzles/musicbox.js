// The prologue's music box (序章：音樂盒). A teaching puzzle: four pins, and the lullaby's
// score says which of them must be raised. The shortest solution takes three moves.
import {hintMarkup,bindHints} from './belfry-hints.js';

export const lullaby=[1,0,1,1];
const score='♪ · ♪ ♪';

// Candle-light hints (燭光提示), three tiers: where to look, the rule, the answer. The last tier reads the pins as they
// are now, so it names the pins that still differ from the score.
export const HINTS=[
 '譜面在旁邊：♪ 是撥起音針，· 是放下音針。先數數譜面有幾個 ♪，再看有幾根音針已經撥起。',
 '譜面由左到右對應四根音針：第 1 根撥起、第 2 根放下、第 3 根撥起、第 4 根撥起。拿每一根音針和同一位置的符號比，不一樣的才需要按。',
 pins=>{
  const wrong=lullaby.map((want,i)=>pins[i]===want?null:'第 '+(i+1)+' 根要'+(want?'撥起':'放下')).filter(Boolean);
  return wrong.length?'現在還要改：'+wrong.join('、')+'。':'';
 }
];
export const hintStep=pins=>pins.every((value,i)=>value===lullaby[i])?null:'pins';

export function mountMusicBox(ctx){
 let pins=[0,0,0,0];
 // The shell is drawn once and then updated in place, so an open hint stays open while the pins move.
 ctx.render('<p class="challenge-help">音樂盒的滾筒上排著四根音針。搖籃曲的譜面寫在旁邊：<strong class="lullaby-score" aria-label="譜面：撥起、放下、撥起、撥起">'+score+'</strong>。撥起或放下音針，讓旋律與譜面一致。</p>'
  +'<div class="musicbox-pins">'+pins.map((_,i)=>'<button class="music-pin" data-pin="'+i+'"></button>').join('')+'</div>'
  +'<p class="challenge-feedback" role="status"></p><button id="musicbox-reset" class="secondary-button">重新上緊發條</button>'+hintMarkup);
 const buttons=[...document.querySelectorAll('[data-pin]')],feedback=document.querySelector('.challenge-feedback');
 const alive=()=>buttons[0]?.isConnected;
 const tiers={pins:HINTS.map(tier=>typeof tier==='function'?{toString:()=>tier(pins)}:tier)};
 const hints=bindHints({hints:tiers,currentStep:()=>hintStep(pins),alive});
 const draw=()=>{
  buttons.forEach((button,i)=>{
   const value=pins[i];
   button.classList.toggle('raised',!!value);
   button.textContent=value?'▲':'▽';
   button.setAttribute('aria-pressed',String(value===1));
   button.setAttribute('aria-label','第'+(i+1)+'根音針，'+(value?'已撥起':'已放下'));
  });
  feedback.textContent=pins.filter((value,i)=>value===lullaby[i]).length+' / 4 根音針與譜面一致。';
  hints.changed();
 };
 buttons.forEach(button=>button.onclick=()=>{
  const i=Number(button.dataset.pin);
  pins[i]=pins[i]?0:1;
  ctx.playCue('click');
  if(!hintStep(pins)){ctx.done();return;}
  draw();
 });
 document.querySelector('#musicbox-reset').onclick=()=>{pins=[0,0,0,0];draw();};
 draw();
}
