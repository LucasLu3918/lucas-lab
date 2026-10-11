// The prologue's music box (序章：音樂盒). A teaching puzzle: four pins, and the lullaby's
// score says which of them must be raised. The shortest solution takes three moves.
export const lullaby=[1,0,1,1];
const score='♪ · ♪ ♪';

export function mountMusicBox(ctx){
 let pins=[0,0,0,0];
 const draw=()=>{
  const matched=pins.filter((value,i)=>value===lullaby[i]).length;
  ctx.render('<p class="challenge-help">音樂盒的滾筒上排著四根音針。搖籃曲的譜面寫在旁邊：<strong class="lullaby-score" aria-label="譜面：撥起、放下、撥起、撥起">'+score+'</strong>。撥起或放下音針，讓旋律與譜面一致。</p><div class="musicbox-pins">'+pins.map((value,i)=>'<button class="music-pin '+(value?'raised':'')+'" data-pin="'+i+'" aria-pressed="'+(value===1)+'" aria-label="第'+(i+1)+'根音針，'+(value?'已撥起':'已放下')+'">'+(value?'▲':'▽')+'</button>').join('')+'</div><p class="challenge-feedback" role="status">'+matched+' / 4 根音針與譜面一致。</p><button id="musicbox-reset" class="secondary-button">重新上緊發條</button>');
  document.querySelectorAll('[data-pin]').forEach(button=>button.onclick=()=>{
   const i=Number(button.dataset.pin);
   pins[i]=pins[i]?0:1;
   ctx.playCue('click');
   if(pins.every((value,index)=>value===lullaby[index])){ctx.done();return;}
   draw();
   document.querySelector('[data-pin="'+i+'"]')?.focus({preventScroll:true});
  });
  document.querySelector('#musicbox-reset').onclick=()=>{pins=[0,0,0,0];draw();};
 };
 draw();
}
