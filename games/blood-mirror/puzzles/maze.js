// The mirror corridor (鏡像迷廊), second stage of act "mirror". Snow White walks the corridor through
// her reflection: left and right are swapped, up and down are not. A mirror gate stands frozen at the
// moment it shut; only the golden pocket watch from act one (it runs backwards) reopens it (plan r7, r10).
// '#' wall, '.' floor, 'S' start, 'E' exit, 'G' the gate (a wall until the watch is used).
export const layout=['S..#...','##.#.#.','...G.#.','.###...','....#E#'];
export const ROWS=layout.length,COLS=layout[0].length;
const find=mark=>{for(let r=0;r<ROWS;r++){const c=layout[r].indexOf(mark);if(c>=0)return [r,c];}return null;};
export const startCell=find('S'),exitCell=find('E');
// The direction the reflection moves for a given input (the horizontal axis is swapped).
export const mirrored={L:[0,1],R:[0,-1],U:[-1,0],D:[1,0]};
export const gateCell=find('G');
export const open=(r,c,gateOpen=false)=>r>=0&&r<ROWS&&c>=0&&c<COLS&&layout[r][c]!=='#'&&(gateOpen||layout[r][c]!=='G');
export function step([r,c],input,gateOpen=false){
 const [dr,dc]=mirrored[input];
 return open(r+dr,c+dc,gateOpen)?[r+dr,c+dc]:[r,c];
}
export const mazeSolved=([r,c])=>r===exitCell[0]&&c===exitCell[1];
// Fewest inputs from the start to the exit (breadth-first search); -1 when the exit cannot be reached.
export function shortestWalk(gateOpen=true){
 const key=([r,c])=>r+','+c,seen=new Map([[key(startCell),0]]);
 let frontier=[startCell];
 while(frontier.length){
  const following=[];
  for(const cell of frontier){
   if(mazeSolved(cell))return seen.get(key(cell));
   for(const input of Object.keys(mirrored)){
    const next=step(cell,input,gateOpen);
    if(!seen.has(key(next))){seen.set(key(next),seen.get(key(cell))+1);following.push(next);}
   }
  }
  frontier=following;
 }
 return -1;
}

const LABEL={L:'向左',R:'向右',U:'向前',D:'向後'},ARROW=Object.fromEntries(Object.entries({L:-90,R:90,U:0,D:180}).map(([key,turn])=>[key,'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path transform="rotate('+turn+' 12 12)" d="M12 19V5 M6 11l6-6 6 6"/></svg>'])),KEY={ArrowLeft:'L',ArrowRight:'R',ArrowUp:'U',ArrowDown:'D'};
const isGate=([r,c])=>r===gateCell[0]&&c===gateCell[1];
export function mountMaze(ctx){
 let at=[...startCell],steps=0,message='',gateOpen=false;
 const move=input=>{
  const [dr,dc]=mirrored[input],next=step(at,input,gateOpen);
  if(next[0]===at[0]&&next[1]===at[1]){message=!gateOpen&&isGate([at[0]+dr,at[1]+dc])?'鏡門停在關上的那一刻，推也推不動。也許有東西能讓時間倒走。':'倒影撞上了冰冷的鏡牆。';ctx.playCue('wrong');}
  else{at=next;steps++;message='';ctx.playCue('click');}
  if(mazeSolved(at)){ctx.done();return;}
  draw();document.querySelector('[data-walk="'+input+'"]')?.focus({preventScroll:true});
 };
 const draw=()=>{
  let grid='';
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
   const here=r===at[0]&&c===at[1],gate=isGate([r,c])&&!gateOpen,wall=layout[r][c]==='#',exit=r===exitCell[0]&&c===exitCell[1];
   grid+='<span class="maze-cell'+(wall?' wall':'')+(gate?' gate':'')+(exit?' exit':'')+(here?' here':'')+'" role="img" aria-label="第'+(r+1)+'列第'+(c+1)+'行：'+(here?'倒影在這裡':wall?'鏡牆':gate?'關上的鏡門':exit?'出口':'走道')+'">'+(here?'◈':exit?'⟐':gate?'⧖':wall?'':'·')+'</span>';
  }
  ctx.render('<p class="challenge-help">妳透過鏡面操縱自己的倒影：妳往左，倒影往右；妳往右，倒影往左。前後則不會顛倒。帶著倒影走出迷廊（也可以用鍵盤方向鍵）。</p>'
   +'<div class="maze-board" role="group" aria-label="鏡中迷廊，'+ROWS+'列'+COLS+'行；倒影從左上角出發，出口在最下一列">'+grid+'</div>'
   +'<div class="maze-pad" role="group" aria-label="操作方向（左右與倒影相反）">'
   +['U','L','D','R'].map(input=>'<button class="maze-key maze-'+input+'" data-walk="'+input+'" aria-label="妳'+LABEL[input]+(input==='L'||input==='R'?'（倒影'+(input==='L'?'向右':'向左')+'）':'')+'">'+ARROW[input]+'</button>').join('')+'</div>'
   +'<p id="maze-status" class="challenge-feedback" role="status">'+(message||'已走 '+steps+' 步')+'</p>'
   +'<button id="maze-watch" class="secondary-button"'+(gateOpen?' disabled':'')+'>'+(gateOpen?'鏡門已回到還沒關上的時刻':'轉動黃金懷錶')+'</button>'
   +'<button id="maze-reset" class="secondary-button">倒影回到起點</button>');
  document.querySelectorAll('[data-walk]').forEach(button=>button.onclick=()=>move(button.dataset.walk));
  const challenge=document.querySelector('.challenge');
  if(challenge)challenge.onkeydown=event=>{const input=KEY[event.key];if(!input)return;event.preventDefault();move(input);};
  document.querySelector('#maze-watch').onclick=()=>{
   if(!ctx.has('watch')){message='妳身上沒有能讓時間倒走的東西。';draw();return;}
   gateOpen=true;message='懷錶的指針倒轉了一圈。鏡門退回到還沒關上的那一刻。';ctx.playCue('door');draw();
  };
  document.querySelector('#maze-reset').onclick=()=>{at=[...startCell];steps=0;message='';draw();};
 };
 draw();
}
