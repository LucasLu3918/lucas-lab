// The shadow cabin (影戲小屋, 鏡淵 E-X, the breather). A wooden carving stands in front of a lamp; its shadow falls on the
// wall. The player turns the carving (yaw, and pitch in the second stage) until the shadow fills the outline on the wall.
// A carving is a set of balls in 3-D; its shadow is the union of their discs, seen straight on. Each carving is built
// backwards from the shadow it must cast: the 2-D picture is given depth at random, then turned out of the way by the
// inverse of the solution pose, so the shadow is only right from one view. The rules are pure and checked by search in
// scripts/blood-mirror-abyss.test.mjs (one pose on the control grid matches); the mount below only draws them.
import {hintMarkup,bindHints} from './belfry-hints.js';

export const GRID=34,SPAN=1.3,MATCH=.9,STEP=5;
export const YAW_RANGE=[0,355],PITCH_RANGE=[-60,60];
const rad=deg=>deg*Math.PI/180;

// Shadow of one ball at a pose: yaw turns about the vertical axis, then pitch tips the top toward the lamp.
export function project(ball,yaw,pitch){
 const [x,y,z]=ball,c=Math.cos(rad(yaw)),s=Math.sin(rad(yaw)),cp=Math.cos(rad(pitch)),sp=Math.sin(rad(pitch));
 const x1=x*c+z*s,z1=-x*s+z*c;
 return [x1,y*cp-z1*sp];
}
// The inverse of project's rotation: where a ball that should land at (x, y) with depth z sits in the carving.
function place([x,y,z,r],yaw,pitch){
 const cp=Math.cos(rad(pitch)),sp=Math.sin(rad(pitch)),c=Math.cos(rad(yaw)),s=Math.sin(rad(yaw));
 const y0=y*cp+z*sp,z1=-y*sp+z*cp; // undo pitch (a turn about the horizontal axis), then yaw
 return [x*c-z1*s,y0,x*s+z1*c,r];
}
// Spread of depths: stable and spread over [-.8, .8], so nothing depends on a random generator.
const depth=i=>(((i*37+11)%17)/16*2-1)*.8;

// The two pictures, as balls [x, y, radius] in the frame of the wall. The carving is made from them in `build`.
const KEY=[
 // ring
 ...Array.from({length:10},(_,i)=>[Math.cos(i/10*2*Math.PI)*.34,.5+Math.sin(i/10*2*Math.PI)*.34,.1]),
 // stem and teeth (the teeth hang off to one side, so the picture is not a mirror image of itself)
 ...Array.from({length:7},(_,i)=>[0,.12-i*.14,.09]),[.17,-.58,.08],[.17,-.84,.08],[.3,-.72,.07]
];
const QUEEN=[
 [0,.62,.17], // head
 [-.14,.84,.05],[-.07,.9,.05],[0,.93,.05],[.07,.9,.05],[.14,.84,.05], // the thin crown
 [0,.42,.08],
 [-.28,.3,.13],[-.14,.33,.13],[0,.34,.13],[.14,.33,.13],[.28,.3,.13], // shoulders
 [.22,.5,.09],[.3,.4,.09],[.36,.26,.09],[.4,.1,.09],[.43,-.06,.09],[.45,-.22,.09], // a long braid on her right
 [-.5,.45,.1],[-.58,.6,.08], // a small knot of hair on her left
 [-.25,.05,.17],[0,.05,.17],[.25,.05,.17],
 [-.35,-.2,.18],[-.12,-.2,.18],[.12,-.2,.18],[.35,-.2,.18],
 [-.7,-.5,.2],[-.45,-.5,.2],[-.2,-.5,.2],[.05,-.5,.2],[.3,-.5,.2],
 [-.8,-.8,.2],[-.55,-.8,.2],[-.3,-.8,.2],[-.05,-.8,.2],[.2,-.8,.2]
];

// stage: { balls, target (balls as seen on the wall), solution pose, locked pitch? }
function build(picture,solution,spread){
 const target=picture.map(([x,y,r])=>[x,y,0,r]);
 const balls=picture.map(([x,y,r],i)=>place([x,y,spread?depth(i):0,r],solution.yaw,solution.pitch));
 return {balls,target,solution};
}
export const STAGES={
 key:{...build(KEY,{yaw:140,pitch:0},false),pitch:false,start:{yaw:0,pitch:0},name:'鑰匙'},
 queen:{...build(QUEEN,{yaw:215,pitch:25},true),pitch:true,start:{yaw:90,pitch:-35},name:'戴冠的女人'}
};

// Which cells of a GRID x GRID wall a set of discs covers.
function cover(discs){
 const cells=new Uint8Array(GRID*GRID),cell=2*SPAN/GRID;
 for(const [x,y,r] of discs){
  const x0=Math.max(0,Math.floor((x-r+SPAN)/cell)),x1=Math.min(GRID-1,Math.floor((x+r+SPAN)/cell));
  const y0=Math.max(0,Math.floor((SPAN-y-r)/cell)),y1=Math.min(GRID-1,Math.floor((SPAN-y+r)/cell));
  for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++){
   const cx=-SPAN+(i+.5)*cell,cy=SPAN-(j+.5)*cell;
   if((cx-x)**2+(cy-y)**2<=r*r)cells[j*GRID+i]=1;
  }
 }
 return cells;
}
export const shadowOf=(stage,yaw,pitch)=>stage.balls.map(ball=>{const [x,y]=project(ball,yaw,pitch);return [x,y,ball[3]];});
const targetCells=new Map();
// Overlap of the shadow with the outline, as intersection over union (1 is a perfect fit).
export function overlap(stage,yaw,pitch){
 if(!targetCells.has(stage))targetCells.set(stage,cover(stage.target.map(([x,y,,r])=>[x,y,r])));
 const a=cover(shadowOf(stage,yaw,pitch)),b=targetCells.get(stage);
 let both=0,any=0;
 for(let i=0;i<a.length;i++){if(a[i]&&b[i])both++;if(a[i]||b[i])any++;}
 return any?both/any:0;
}
export const matches=(stage,yaw,pitch)=>overlap(stage,yaw,pitch)>=MATCH;
// Every pose on the control grid that fits. The design needs them to be one small cluster around the solution.
export function solveAll(stage){
 const found=[];
 for(let yaw=YAW_RANGE[0];yaw<=YAW_RANGE[1];yaw+=STEP)for(let pitch=stage.pitch?PITCH_RANGE[0]:0;pitch<=(stage.pitch?PITCH_RANGE[1]:0);pitch+=STEP){
  if(matches(stage,yaw,pitch))found.push({yaw,pitch});
 }
 return found;
}

// Candle-light hints, three tiers per step: where to look, the rule, the answer. `far` is a shadow that barely fits,
// `near` one that is close but not yet inside the outline.
export const NEAR=.7;
const RULE='影子只看得見輪廓：同一塊木雕，從不同的角度照，影子的形狀就不同。先轉水平角，看輪廓大致像了，再微調。';
const HINT_TEXT={
 key:{
  far:['先慢慢轉動水平角度，看牆上的黑影怎麼變。齒（鑰匙下面突出的小塊）要朝右下。',RULE+'鑰匙是一片扁的木片：正面看最寬，側面看只剩一條線。',ANSWER_KEY()],
  near:['很接近了。再轉幾度，讓環和齒都落進牆上的輪廓。',RULE,ANSWER_KEY()]
 },
 queen:{
  far:['這塊木雕比較立體。先轉水平角，找到影子像一個人形的位置，再用前後傾斜微調。頭上的細冠要朝上。',RULE+'兩個角度要一起調：水平角決定左右，前後傾斜決定頭和裙擺的長短。',ANSWER_QUEEN()],
  near:['已經有人形了。小幅度轉動兩個角度，讓細冠和右邊的長辮落進輪廓。',RULE,ANSWER_QUEEN()]
 }
};
function ANSWER_KEY(){return '把水平角轉到約 '+STAGES.key.solution.yaw+' 度。';}
function ANSWER_QUEEN(){return '把水平角轉到約 '+STAGES.queen.solution.yaw+' 度，前後傾斜約 '+STAGES.queen.solution.pitch+' 度。';}
export const HINTS=HINT_TEXT;
export function hintStep(stageName,yaw,pitch){
 const stage=STAGES[stageName];
 const o=overlap(stage,yaw,stage.pitch?pitch:0);
 if(o>=MATCH)return null;
 return o>=NEAR?'near':'far';
}

const NS='http://www.w3.org/2000/svg';
const SCALE=100,CX=200,CY=150;
const px=(x,y)=>[(CX+x*SCALE).toFixed(1),(CY-y*SCALE).toFixed(1)];
const circles=(discs,cls)=>discs.map(([x,y,r])=>{const [a,b]=px(x,y);return '<circle class="'+cls+'" cx="'+a+'" cy="'+b+'" r="'+(r*SCALE).toFixed(1)+'"/>';}).join('');

// ctx = { render(html), done(), playCue(kind) }
function mountShadow(ctx,stageName,intro){
 const stage=STAGES[stageName],still=document.body.classList.contains('reduce-motion');
 let yaw=stage.start.yaw,pitch=stage.start.pitch,finishing=false;
 ctx.render('<div class="belfry shadow-cabin">'
  +'<p class="challenge-help">'+intro+'</p>'
  +'<p id="sh-status" class="belfry-status" role="status"></p>'
  +'<div class="belfry-board"><svg id="sh-svg" class="belfry-svg" viewBox="0 0 400 300" role="img" aria-label="牆上有一個金色輪廓，木雕的影子要放進輪廓裡"></svg></div>'
  +'<div class="shadow-controls">'
  +'<label class="shadow-slider">水平轉動<input id="sh-yaw" type="range" min="'+YAW_RANGE[0]+'" max="'+YAW_RANGE[1]+'" step="'+STEP+'" value="'+yaw+'"><output id="sh-yaw-out">'+yaw+'°</output></label>'
  +(stage.pitch?'<label class="shadow-slider">前後傾斜<input id="sh-pitch" type="range" min="'+PITCH_RANGE[0]+'" max="'+PITCH_RANGE[1]+'" step="'+STEP+'" value="'+pitch+'"><output id="sh-pitch-out">'+pitch+'°</output></label>':'')
  +'</div>'
  +hintMarkup+'</div>');
 const $=id=>document.getElementById(id),svg=$('sh-svg');
 const alive=()=>svg.isConnected;
 const say=(text,tone='')=>{const el=$('sh-status');el.textContent=text;el.dataset.tone=tone;};
 const hints=bindHints({hints:HINTS[stageName],currentStep:()=>hintStep(stageName,yaw,pitch),alive});
 svg.innerHTML='<rect class="sh-wall" x="10" y="10" width="380" height="280" rx="4"/>'
  +'<g id="sh-out">'+circles(stage.target.map(([x,y,,r])=>[x,y,r]),'sh-target')+'</g>'
  +'<g id="sh-cast"></g>'
  +'<circle class="sh-lamp-glow" cx="30" cy="30" r="22"/><circle class="sh-lamp" cx="30" cy="30" r="7"/>';
 function describe(o){
  if(o>=MATCH)return ['影子剛好嵌進輪廓。','ok'];
  if(o>=NEAR)return ['影子快要和輪廓重合了，再轉一點。',''];
  return ['影子還是一團。轉一轉，看輪廓怎麼變。',''];
 }
 function refresh(){
  $('sh-cast').innerHTML=circles(shadowOf(stage,yaw,stage.pitch?pitch:0),'sh-shade');
  $('sh-yaw-out').textContent=yaw+'°';
  if(stage.pitch)$('sh-pitch-out').textContent=pitch+'°';
  const o=overlap(stage,yaw,stage.pitch?pitch:0),[text,tone]=describe(o);
  svg.classList.toggle('matched',o>=MATCH);
  say(text,tone);
  hints.changed();
  if(o>=MATCH&&!finishing)finish();
 }
 function finish(){
  finishing=true;ctx.playCue('door');
  $('sh-yaw').disabled=true;if(stage.pitch)$('sh-pitch').disabled=true;
  setTimeout(()=>{if(alive())ctx.done();},still?0:700);
 }
 $('sh-yaw').oninput=event=>{yaw=+event.target.value;ctx.playCue('click');refresh();};
 if(stage.pitch)$('sh-pitch').oninput=event=>{pitch=+event.target.value;ctx.playCue('click');refresh();};
 refresh();
}
export const mountShadowKey=ctx=>mountShadow(ctx,'key','燈前有一把木雕的鑰匙，牆上有它的金色輪廓。轉動木雕，讓黑色的影子剛好嵌進輪廓。扁平的木片，轉到側面就只剩一條線。');
export const mountShadowQueen=ctx=>mountShadow(ctx,'queen','這一塊木雕比較立體。牆上的輪廓是一個背對妳的女人。用兩個轉盤，讓影子嵌進去。');
