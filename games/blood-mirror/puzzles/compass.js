// The mirror compass (魔鏡羅盤, 鏡淵 E9). Rings of eight notches turn around one needle; each ring has one mark on it, the
// four marks the player carried out of E-X, E6, E7 and E8 (影, 音, 重, 時). Every ring is solved when its mark sits under the
// needle. Turning one ring a notch drags the rings next to it two notches the other way, so the rings can't be set one at a time.
//   compass-inner  影 and 音          (two rings, the warm-up)
//   compass-outer  重 and 時          (two rings)
//   compass-final  all four rings     (needs both pairs: the 音 and 重 rings now touch)
// The rules are pure and checked by a breadth-first search in scripts/blood-mirror-abyss.test.mjs; the mount only draws them.
import {hintMarkup,bindHints} from './belfry-hints.js';

export const SLOTS=8;
export const MARKS=['影','音','重','時'];
export const DRAG=-2;                          // notches an adjacent ring turns when a ring turns one notch clockwise
export const STAGES={
 inner:{rings:[0,1],start:[1,3]},
 outer:{rings:[2,3],start:[1,7]},
 final:{rings:[0,1,2,3],start:[4,6,1,3]}
};
const wrap=n=>((n%SLOTS)+SLOTS)%SLOTS;
// Turns the ring at position k of the stage one notch (dir 1 clockwise, -1 counter-clockwise); neighbours turn DRAG notches.
export function turn(state,k,dir){
 const next=state.slice();
 next[k]=wrap(next[k]+dir);
 for(const j of [k-1,k+1])if(j>=0&&j<state.length)next[j]=wrap(next[j]+dir*DRAG);
 return next;
}
export const aligned=state=>state.every(v=>v===0);
export const MOVES=count=>Array.from({length:count},(_,k)=>[{ring:k,dir:-1},{ring:k,dir:1}]).flat();
const key=state=>state.join(',');
// A shortest list of moves {ring, dir} from `state` to the aligned rings (breadth first); [] when already aligned.
export function solve(state){
 const moves=MOVES(state.length),goal=key(Array(state.length).fill(0)),from=new Map([[key(state),null]]);
 let level=[state];
 while(level.length){
  const next=[];
  for(const s of level){
   if(key(s)===goal){
    const path=[];
    for(let at=goal,hop=from.get(at);hop;at=key(hop.prev),hop=from.get(at))path.unshift(hop.move);
    return path;
   }
   for(const move of moves){
    const t=turn(s,move.ring,move.dir),id=key(t);
    if(!from.has(id)){from.set(id,{prev:s,move});next.push(t);}
   }
  }
  level=next;
 }
 return null;
}
// How many turns the player gets before the gears jam: the shortest way plus plenty of slack.
export const allowance=stage=>{const n=solve(STAGES[stage].start).length;return n+Math.max(6,n);};

// --- hints ---------------------------------------------------------------------------------------------------------
export const moveWord=m=>MARKS[m.ring]+'環'+(m.dir>0?'順時針':'逆時針');
const stageMark=(stage,k)=>MARKS[STAGES[stage].rings[k]];
const named=(stage,moves)=>{
 const out=[];
 for(const m of moves){
  const word=stageMark(stage,m.ring)+'環'+(m.dir>0?'順時針':'逆時針');
  if(out.length&&out[out.length-1].word===word)out[out.length-1].n++;else out.push({word,n:1});
 }
 return out.map(o=>o.word+(o.n>1?' ×'+o.n:'')).join('，');
};
// The last tier looks at the rings as they are now, so it is right whatever the player has already turned.
export const hintsFor=(stage,current)=>[
 '每轉一格，鄰近的環會反方向轉兩格。先看哪一個環最靠近對準，再想它的鄰居會被拖到哪裡。',
 stage==='final'
  ?'兩個內環的位置和兩個外環的位置會互相拖動。先把一個環對準，再用它不碰到的那一端的環調整，最後才補中間。'
  :'兩個環互相拖動，所以一個環轉一格，另一個轉兩格。想想把其中一個環轉幾格，讓另一個環剛好回到標記。',
 ()=>{const path=solve(current());return path&&path.length?'目前最短的轉法是（共 '+path.length+' 步）：'+named(stage,path)+'。':'';}
];
export const hintStep=name=>name;

// --- drawing -------------------------------------------------------------------------------------------------------
const SHAPES=[
 '<circle r="3.6"/>',
 '<path d="M0-4.4L3.8 3 -3.8 3z"/>',
 '<rect x="-3.2" y="-3.2" width="6.4" height="6.4"/>',
 '<path d="M0-4.6L4 0 0 4.6-4 0z"/>',
 '<path d="M-1.4-4.4h2.8v3h3v2.8h-3v3h-2.8v-3h-3v-2.8h3z"/>',
 '<path d="M0-4.6L1.4-1.4 4.6 0 1.4 1.4 0 4.6-1.4 1.4-4.6 0-1.4-1.4z"/>',
 '<rect x="-1.6" y="-4.6" width="3.2" height="9.2"/>'
];
const CX=150,CY=150,BAND=24;
// ringIds: which of the four rings are drawn (outermost first); state: their offsets.
export function dialSvg(ringIds,state){
 const outer=130,parts=[];
 ringIds.forEach((id,k)=>{
  const rOut=outer-k*(BAND+2),rMid=rOut-BAND/2;
  let slots='';
  for(let s=0;s<SLOTS;s++){
   const angle=s*360/SLOTS,glyph=s===0
    ?'<circle class="cmp-mark-disc" r="10.5"/><text class="cmp-mark" text-anchor="middle" dy="5.6">'+MARKS[id]+'</text>'
    :'<g class="cmp-shape">'+SHAPES[s-1]+'</g>';
   slots+='<g transform="rotate('+angle+' '+CX+' '+CY+') translate('+CX+' '+(CY-rMid)+')"><g transform="rotate('+-(angle+state[k]*360/SLOTS)+')">'+glyph+'</g></g>';
  }
  parts.push('<g class="cmp-ring cmp-ring-'+id+'" data-ring="'+id+'" transform="rotate('+state[k]*360/SLOTS+' '+CX+' '+CY+')"><circle class="cmp-band" cx="'+CX+'" cy="'+CY+'" r="'+rMid+'" stroke-width="'+BAND+'"/>'+slots+'</g>');
 });
 return '<svg class="cmp-dial" viewBox="0 0 300 300" role="img" aria-label="'
  +ringIds.map((id,k)=>MARKS[id]+'環'+(state[k]===0?'已對準指針':'還差 '+Math.min(state[k],SLOTS-state[k])+' 格')).join('，')
  +'">'+parts.join('')+'<path class="cmp-needle" d="M150 6L158 32H142z"/><line class="cmp-needle-line" x1="150" y1="30" x2="150" y2="'+(CY-(outer-ringIds.length*(BAND+2))+BAND)+'"/></svg>';
}

// ctx = { render(html), done(), playCue(kind) }
function mountCompass(ctx,name,intro){
 const stage=STAGES[name],still=document.body.classList.contains('reduce-motion'),limit=allowance(name);
 let state=stage.start.slice(),steps=0,finishing=false;
 const pad=stage.rings.map((id,k)=>'<div class="cmp-row"><button class="cmp-turn" data-ring="'+k+'" data-dir="-1" aria-label="把'+MARKS[id]+'環逆時針轉一格">↺</button><b class="cmp-name cmp-name-'+id+'">'+MARKS[id]+'環</b><button class="cmp-turn" data-ring="'+k+'" data-dir="1" aria-label="把'+MARKS[id]+'環順時針轉一格">↻</button></div>').join('');
 ctx.render('<div class="belfry compass"><p class="challenge-help">'+intro+'</p><p class="cmp-rule">轉一個環一格，相鄰的環會往反方向轉兩格。</p>'
  +'<div id="cmp-dial" class="cmp-stage"></div>'
  +'<p id="cmp-count" class="belfry-note"></p><p id="cmp-status" class="belfry-status" role="status"></p>'
  +'<div class="cmp-pad" role="group" aria-label="轉動環">'+pad+'</div>'
  +'<button id="cmp-reset" class="secondary-button">回到起點</button>'
  +hintMarkup+'</div>');
 const $=id=>document.getElementById(id);
 const alive=()=>$('cmp-dial')?.isConnected;
 const say=(text,tone='')=>{const el=$('cmp-status');if(el){el.textContent=text;el.dataset.tone=tone;}};
 const hints=bindHints({hints:{[name]:hintsFor(name,()=>state).map(h=>typeof h==='function'?{toString:h}:h)},currentStep:()=>finishing?null:hintStep(name),alive});
 function draw(){
  $('cmp-dial').innerHTML=dialSvg(stage.rings,state);
  $('cmp-count').textContent='已轉 '+steps+' 格，上限 '+limit+' 格，超過齒輪會卡死、退回起點。';
 }
 function reset(text){state=stage.start.slice();steps=0;say(text||'','');draw();hints.changed();}
 document.querySelectorAll('.cmp-turn').forEach(button=>button.onclick=()=>{
  if(finishing)return;
  state=turn(state,+button.dataset.ring,+button.dataset.dir);steps++;ctx.playCue('click');
  if(aligned(state)){
   finishing=true;draw();say('所有標記同時落在指針下，羅盤輕輕一震。','ok');ctx.playCue('door');
   setTimeout(()=>{if(alive())ctx.done();},still?0:700);
  }else if(steps>=limit)reset('齒輪卡死了，環退回起點。');
  else{say('');draw();}
  hints.changed();
 });
 $('cmp-reset').onclick=()=>{if(!finishing)reset('');};
 hints.changed();
 draw();
}
export const mountCompassInner=ctx=>mountCompass(ctx,'inner','羅盤最裡面的兩環，刻著影與音。讓兩個記號同時對準上方的指針。');
export const mountCompassOuter=ctx=>mountCompass(ctx,'outer','外面兩環，刻著重與時。讓兩個記號同時對準上方的指針。');
export const mountCompassFinal=ctx=>mountCompass(ctx,'final','四個環合在一起了，影、音、重、時都要落在指針下。相鄰的環互相拖動，中間兩環也會牽動彼此。');
