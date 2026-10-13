// Gamepad navigation (手把導覽): the d-pad or left stick moves focus, A clicks, B backs out, Start opens the pause
// menu and the shoulder buttons turn the scene. A pad never writes game state; every action reuses a click or focus
// call that keyboard and mouse already use. main.js imports this module on the first gamepadconnected event, so
// keyboard and mouse players never fetch it. The Gamepad API has no per-button event, so input is polled with
// requestAnimationFrame, and only while a pad is connected.

export const BUTTON={A:0,B:1,LB:4,RB:5,START:9,UP:12,DOWN:13,LEFT:14,RIGHT:15};
export const STICK_DEADZONE=0.5;
// Holding a direction moves once, waits, then repeats; these are the waits in milliseconds.
export const REPEAT_DELAY=340, REPEAT_EVERY=130;
const FOCUSABLE='button:not([disabled]),select:not([disabled]),input:not([disabled]),summary,a[href],[tabindex]:not([tabindex="-1"])';

// The direction the d-pad or the left stick points to, or null. Stick travel inside the deadzone is ignored.
export function directionOf(pad,deadzone=STICK_DEADZONE){
 const pressed=index=>!!pad.buttons?.[index]?.pressed;
 if(pressed(BUTTON.UP))return 'up';
 if(pressed(BUTTON.DOWN))return 'down';
 if(pressed(BUTTON.LEFT))return 'left';
 if(pressed(BUTTON.RIGHT))return 'right';
 const x=pad.axes?.[0]??0,y=pad.axes?.[1]??0;
 if(Math.hypot(x,y)<deadzone)return null;
 return Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');
}

// Index of the candidate centre that lies in `dir` from `origin` and is closest; sideways drift counts double, so a
// target straight across beats a nearer one at an angle. Returns -1 when nothing lies that way.
export function pickNext(origin,candidates,dir){
 const along=(dx,dy)=>dir==='right'?dx:dir==='left'?-dx:dir==='down'?dy:-dy;
 const across=(dx,dy)=>dir==='left'||dir==='right'?Math.abs(dy):Math.abs(dx);
 let best=-1,bestScore=Infinity;
 candidates.forEach((c,i)=>{
  const dx=c.x-origin.x,dy=c.y-origin.y,distance=along(dx,dy);
  if(distance<=1)return;
  const score=distance+2*across(dx,dy);
  if(score<bestScore){bestScore=score;best=i;}
 });
 return best;
}

// Decides whether a held direction should move focus this frame. `held` is mutable state kept by the caller:
// a new direction moves at once, then the same direction moves again after REPEAT_DELAY, every REPEAT_EVERY.
export function shouldRepeat(held,dir,now){
 if(!dir){held.dir=null;return false;}
 if(held.dir!==dir){Object.assign(held,{dir,since:now,last:now});return true;}
 if(now-held.since>=REPEAT_DELAY&&now-held.last>=REPEAT_EVERY){held.last=now;return true;}
 return false;
}

// Runtime: the hooks come from main.js, so the game decides what "back" or "root" means in its current screen.
let hooks=null,frame=0,previous=new Map(),held={dir:null,since:0,last:0};

export function startGamepadNav(options){
 hooks=options;
 if(frame||typeof requestAnimationFrame!=='function')return;
 // Mouse and touch take back the focus ring; a pad press shows it again.
 addEventListener('pointerdown',()=>document.body.classList.remove('gamepad-nav'),{passive:true});
 frame=requestAnimationFrame(tick);
}

function connectedPads(){
 if(typeof navigator==='undefined'||typeof navigator.getGamepads!=='function')return [];
 return [...navigator.getGamepads()].filter(Boolean);
}

function tick(now){
 const [pad]=connectedPads();
 if(!pad){
  // Stop polling when the last pad goes; the connect event starts it again.
  frame=0;previous.clear();held.dir=null;return;
 }
 const dir=directionOf(pad);
 if(shouldRepeat(held,dir,now)){document.body.classList.add('gamepad-nav');move(dir);}
 for(const index of [BUTTON.A,BUTTON.B,BUTTON.START,BUTTON.LB,BUTTON.RB]){
  const down=!!pad.buttons[index]?.pressed;
  if(down&&!previous.get(index)){document.body.classList.add('gamepad-nav');act(index);}
  previous.set(index,down);
 }
 frame=requestAnimationFrame(tick);
}

function visible(element){
 return element.getClientRects().length>0&&!element.closest('[hidden],[inert]');
}

function move(dir){
 const root=hooks.root();
 if(!root)return;
 const active=document.activeElement;
 // A focused slider takes the sideways directions as its own value, as a keyboard arrow does.
 if(active?.matches?.('input[type=range]')&&(dir==='left'||dir==='right')){
  const step=Number(active.step)||1,next=Math.min(Number(active.max),Math.max(Number(active.min),Number(active.value)+(dir==='right'?step:-step)));
  active.value=String(next);
  active.dispatchEvent(new Event('input',{bubbles:true}));
  active.dispatchEvent(new Event('change',{bubbles:true}));
  return;
 }
 const items=[...root.querySelectorAll(FOCUSABLE)].filter(visible);
 if(!items.length)return;
 const index=items.indexOf(active);
 if(index<0){focusItem(items[0]);return;}
 const origin=centre(active);
 const next=pickNext(origin,items.map(centre),dir);
 if(next>=0)focusItem(items[next]);
}

function centre(element){
 const box=element.getBoundingClientRect();
 return {x:box.left+box.width/2,y:box.top+box.height/2};
}

function focusItem(element){
 // A hotspot may sit past the edge of a panned phone scene: the hook brings it into view before the focus lands.
 hooks.reveal?.(element);
 element.focus({preventScroll:true});
 if(!element.closest('#scene'))element.scrollIntoView({block:'nearest',inline:'nearest'});
}

function act(index){
 if(index===BUTTON.A){
  const active=document.activeElement;
  if(active&&active!==document.body&&!active.matches('select'))active.click();
  return;
 }
 if(index===BUTTON.B)return hooks.back();
 if(index===BUTTON.START)return hooks.menu();
 if(index===BUTTON.LB)return hooks.shoulder(-1);
 if(index===BUTTON.RB)return hooks.shoulder(1);
}
