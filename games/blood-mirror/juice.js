// Game feel (手感回饋): the visual and haptic layer that rides on every sound cue, so an action still reads
// as an impact with the sound off. Each cue maps to a small bundle of particles, a squash-pop, a decaying
// shake, a flash and a vibration, sized by how much the event matters: a click only presses its button,
// a solved seal gets the full set. Everything here is transient and visual: nothing delays the game,
// blocks input or touches state. "Reduce motion" turns the visual layer off; vibration has its own setting.

// burst = particles {n, look, at, spread}; pop = selectors to squash and spring back ('panel' is the open dialog);
// impact = a short held squash on the dialog (the freeze frame of a DOM game); shake = trauma added to the
// dialog, or to the scene when none is open; flash = a soft full-screen tint; haptic = navigator.vibrate().
export const FEEDBACK={
 click:{press:true},
 page:{burst:{n:7,look:'mote',at:'.clue-chips'},pop:['.clue-chips span','#journal-count']},
 glass:{burst:{n:14,look:'shard',at:'.modal-image-icon'},flash:'pale',pop:['#journal-count'],haptic:[12,40,12]},
 collect:{fly:true,haptic:15},
 restore:{burst:{n:8,look:'mote'},haptic:10},
 wrong:{shake:{trauma:.8,x:1,y:0,roll:0,speed:36},flash:'blood',haptic:[30,50,30]},
 solve:{burst:{n:26,look:'mote',at:'.success-gem',spread:1.8},pop:['.success-gem svg'],impact:true,shake:{trauma:.5,x:.5,y:1,roll:1,speed:30},flash:'gold',haptic:[20,40,70]},
 choir:{shake:{trauma:.3,x:1,y:.3,roll:.3,speed:44},flash:'blood',haptic:[15,30,15,30,15]},
 door:{shake:{trauma:.35,x:.4,y:1,roll:.5,speed:24},haptic:25}
};

// Shake at full trauma, and how fast trauma drains. Offset grows with trauma² so light hits barely move.
const MAX={x:12,y:8,roll:.8},DECAY=1.6;
// Smooth, self-ending shake: two detuned sines instead of a fresh random offset every frame (that buzzes).
export function shakeOffset(trauma,t,{x=1,y=1,roll=1}={}){
 const s=Math.min(1,Math.max(0,trauma))**2;
 return {x:MAX.x*s*x*Math.sin(t*1.7),y:MAX.y*s*y*Math.sin(t*2.3+1),roll:MAX.roll*s*roll*Math.sin(t*1.1+2)};
}

const POPS={
 press:{frames:[{scale:'.92'},{scale:'1.04',offset:.6},{scale:'1'}],duration:200},
 pop:{frames:[{scale:'1.25 .8'},{scale:'.94 1.07',offset:.5},{scale:'1'}],duration:340},
 land:{frames:[{scale:'1.3 .75'},{scale:'.95 1.06',offset:.55},{scale:'1'}],duration:300},
 // The held squash at the start sells the moment the seal gives way; the overshoot releases it.
 impact:{frames:[{scale:'1'},{scale:'.965',offset:.1},{scale:'.965',offset:.3},{scale:'1.02',offset:.62},{scale:'1'}],duration:440}
};
const BACK='cubic-bezier(.34,1.56,.64,1)',OUT='cubic-bezier(.2,.7,.3,1)';
const MAX_PARTICLES=90,RECENT_PRESS=2000;

export function createJuice({motion=()=>true,haptics=()=>true}={}){
 let layer=null,press=null,particles=0,frame=0,last=0;
 const shakes=new Map();
 const $=selector=>document.querySelector(selector);
 const panel=()=>$('dialog[open]');
 addEventListener('pointerdown',event=>{press={x:event.clientX,y:event.clientY,at:performance.now(),el:event.target};},{capture:true,passive:true});

 // Top-layer elements (the open dialog) cover everything else, so the effects layer is a manual popover
 // shown again after each dialog opens. Browsers without popovers keep it as a plain fixed overlay.
 function raise(el){
  if(!el?.showPopover)return;
  if(!el.hasAttribute('popover'))el.setAttribute('popover','manual');
  try{if(el.matches(':popover-open'))el.hidePopover();el.showPopover();}catch{}
 }
 function ensureLayer(){
  if(!layer){layer=document.createElement('div');layer.className='fx-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);}
  if(panel()||!layer.matches?.(':popover-open'))raise(layer);
  return layer;
 }
 const visible=el=>{if(!el?.isConnected)return null;const box=el.getBoundingClientRect();return box.width&&box.height&&box.bottom>0&&box.top<innerHeight&&box.right>0&&box.left<innerWidth?box:null;};
 const center=box=>({x:box.left+box.width/2,y:box.top+box.height/2});
 // Where an effect starts: a named anchor, else the pointer that just triggered it, else the dialog or screen centre.
 function origin(anchor){
  const box=anchor&&visible($(anchor));
  if(box)return center(box);
  if(press&&performance.now()-press.at<RECENT_PRESS)return {x:press.x,y:press.y};
  const open=visible(panel());
  return open?center(open):{x:innerWidth/2,y:innerHeight/2};
 }

 function pop(el,style='pop',delay=0){
  if(!el?.animate||!visible(el))return;
  const {frames,duration}=POPS[style];
  el.animate(frames,{duration,delay,easing:style==='impact'?'ease-out':BACK});
 }
 function burst({x,y},n,look,spread=1){
  const host=ensureLayer();
  for(let i=0;i<n&&particles<MAX_PARTICLES;i++){
   const dot=document.createElement('span'),angle=Math.random()*Math.PI*2,distance=((look==='shard'?50:34)+Math.random()*(look==='shard'?90:64))*spread;
   const size=look==='shard'?7+Math.random()*8:5+Math.random()*6,dx=Math.cos(angle)*distance,dy=Math.sin(angle)*distance+(look==='shard'?24:-10);
   dot.className='fx-particle fx-'+look;dot.style.setProperty('--s',size.toFixed(1)+'px');
   host.append(dot);particles++;
   const spin=look==='shard'?Math.round(Math.random()*540-270)+'deg':'0deg';
   dot.animate([{translate:x+'px '+y+'px',scale:'1',rotate:'0deg',opacity:1},{translate:(x+dx)+'px '+(y+dy)+'px',scale:'.2',rotate:spin,opacity:0}],{duration:520+Math.random()*320,easing:OUT}).onfinish=()=>{dot.remove();particles--;};
  }
 }
 function flash(look){
  const veil=document.createElement('div');veil.className='fx-flash fx-flash-'+look;ensureLayer().append(veil);
  veil.animate([{opacity:0},{opacity:1,offset:.25},{opacity:0}],{duration:look==='blood'?380:460,easing:'ease-out'}).onfinish=()=>veil.remove();
 }

 // Trauma shake drives the CSS `translate`/`rotate` properties, which compose with any existing transform
 // (the scene's pan). Hits add trauma instead of resetting it, and it drains to zero on its own.
 function shake(el,{trauma,speed=30,...axes}){
  if(!el)return;
  const current=shakes.get(el);
  shakes.set(el,{trauma:Math.min(1,(current?.trauma||0)+trauma),t:current?.t||0,speed,axes});
  if(!frame){last=performance.now();frame=requestAnimationFrame(step);}
 }
 function step(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  for(const [el,s] of shakes){
   s.trauma=Math.max(0,s.trauma-DECAY*dt);s.t+=dt*s.speed;
   if(!s.trauma||!el.isConnected){el.style.translate='';el.style.rotate='';shakes.delete(el);continue;}
   const o=shakeOffset(s.trauma,s.t,s.axes);
   el.style.translate=o.x.toFixed(2)+'px '+o.y.toFixed(2)+'px';el.style.rotate=o.roll.toFixed(3)+'deg';
  }
  frame=shakes.size?requestAnimationFrame(step):0;
 }

 // A collected item flies from where it was taken to its new slot in the tray, which then catches it.
 function fly(){
  const slots=document.querySelectorAll('#inventory [data-item]'),slot=slots[slots.length-1],box=visible(slot),from=origin();
  if(!box){burst(from,10,'mote');pop($('#inventory-count'));return;}
  const to=center(box),token=document.createElement('span'),art=slot.querySelector('svg');
  token.className='fx-fly';if(art)token.append(art.cloneNode(true));ensureLayer().append(token);
  const lift=Math.min(120,Math.abs(to.x-from.x)*.25+60),mid={x:(from.x+to.x)/2,y:Math.min(from.y,to.y)-lift};
  token.animate([{translate:from.x+'px '+from.y+'px',scale:'1.6',opacity:.2},{translate:mid.x+'px '+mid.y+'px',scale:'1.25',opacity:1,offset:.45},{translate:to.x+'px '+to.y+'px',scale:'.7',opacity:1}],{duration:620,easing:'cubic-bezier(.45,0,.55,1)'}).onfinish=()=>{
   token.remove();pop(slot,'land');pop($('#inventory-count'),'pop',60);burst(to,6,'mote');
  };
 }

 function run(bundle){
  const dialog=panel();
  if(bundle.press){const el=document.activeElement?.closest?.('button')||press?.el?.closest?.('button');if(el&&(dialog?dialog.contains(el):true))pop(el,'press');}
  if(bundle.impact&&dialog)pop(dialog,'impact');
  for(const selector of bundle.pop||[])document.querySelectorAll(selector).forEach((el,i)=>pop(el,'pop',i*45));
  if(bundle.shake)shake(dialog||$('#scene-frame'),bundle.shake);
  if(bundle.flash)flash(bundle.flash);
  if(bundle.burst)burst(origin(bundle.burst.at),bundle.burst.n,bundle.burst.look,bundle.burst.spread);
  if(bundle.fly)fly();
 }

 return {
  raise,
  // Called with every sound cue, muted or not. Effects wait one frame so they land on whatever the cue's
  // handler renders next (the new modal, the refilled tray).
  cue(kind){
   const bundle=FEEDBACK[kind];
   if(!bundle)return;
   if(bundle.haptic&&haptics()&&navigator.vibrate)try{navigator.vibrate(bundle.haptic);}catch{}
   if(!motion()||typeof requestAnimationFrame!=='function')return;
   requestAnimationFrame(()=>run(bundle));
  }
 };
}
