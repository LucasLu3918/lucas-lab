// Candle-light hints (燭光提示) shared by the three belfry mechanisms. Each mechanism gives `hints`, a map from a step name
// to three tiers - where to look, the rule, the answer - and `currentStep()`, which reads the player's own board and returns
// the step they are stuck on (null once solved). The tier starts again whenever the step changes, so a hint always matches
// the board. After three quiet minutes the mirror lights the first tier by itself.
export const hintMarkup='<div class="belfry-hint"><button id="bf-hint" class="secondary-button">燭光提示</button><span id="bf-hint-note" class="belfry-note"></span></div>'
 +'<p id="bf-hint-text" class="belfry-hint-text" role="status" hidden></p>';

export function bindHints({hints,currentStep,alive,idleMs=180000}){
 const button=document.getElementById('bf-hint'),box=document.getElementById('bf-hint-text'),note=document.getElementById('bf-hint-note');
 let tier=0,tierStep=null,last=Date.now(),used=0;
 function sync(){
  const step=currentStep();
  if(step!==tierStep){tierStep=step;tier=0;box.hidden=true;note.textContent='';}
  button.hidden=!step;
  if(!step)box.hidden=true;
 }
 function show(auto){
  const step=currentStep();
  if(!step)return;
  if(step!==tierStep){tierStep=step;tier=0;}
  const list=hints[step];
  if(auto){if(tier>0)return;tier=1;}
  else{tier=Math.min(tier+1,list.length);used++;}
  box.hidden=false;
  box.textContent=(auto?'魔鏡低語：':'燭光提示 '+tier+' / '+list.length+'：')+list[tier-1];
  note.textContent=tier<list.length?'再按一次，看更明確的':'這已經是最明確的提示';
 }
 button.onclick=()=>show(false);
 const watch=setInterval(()=>{
  if(!alive()){clearInterval(watch);return;}
  if(Date.now()-last>idleMs&&currentStep()&&tier===0)show(true);
 },Math.min(5000,Math.max(50,idleMs/4)));
 return {
  // Call after every change of the board: the idle timer starts again and the tier follows the board.
  changed(){last=Date.now();sync();},
  show,
  get used(){return used;},
  get tier(){return tier;}
 };
}
