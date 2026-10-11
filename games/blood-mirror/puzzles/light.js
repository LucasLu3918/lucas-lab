// The mirror light path (鏡面光路), second stage of act "ballroom". Moonlight enters the hall on the
// left edge of row 2; four mirrors can each be flipped between "/" and "\". The door sits on the right
// edge of row 1, so the beam has to bounce down, across, back up, and out.
export const COLS=6,ROWS=5,ENTRY_ROW=2,DOOR_ROW=1;
// Mirror cells: [row, col]. Orientation 0 is "/", 1 is "\".
export const mirrors=[[2,1],[4,1],[4,4],[1,4]];
export const solution=[1,1,0,0];
export const startState=[0,0,1,1];

const DIRS={E:[0,1],W:[0,-1],N:[-1,0],S:[1,0]};
// A "/" turns E<->N and W<->S; a "\" turns E<->S and W<->N.
const BOUNCE=[{E:'N',N:'E',W:'S',S:'W'},{E:'S',S:'E',W:'N',N:'W'}];

// Follows the beam from the entry. Returns the cells it crosses (in order) and where it leaves the grid.
export function traceBeam(orientation){
 const at=new Map(mirrors.map(([r,c],i)=>[r+','+c,i]));
 const cells=[];let r=ENTRY_ROW,c=0,dir='E';
 for(let guard=0;guard<COLS*ROWS*4;guard++){
  if(r<0||r>=ROWS||c<0||c>=COLS)return {cells,exit:{row:r,col:c,side:r<0?'top':r>=ROWS?'bottom':c<0?'left':'right'}};
  cells.push([r,c]);
  const index=at.get(r+','+c);
  if(index!==undefined)dir=BOUNCE[orientation[index]][dir];
  r+=DIRS[dir][0];c+=DIRS[dir][1];
 }
 return {cells,exit:null};
}
export const lightSolved=orientation=>{const {exit}=traceBeam(orientation);return !!exit&&exit.side==='right'&&exit.row===DOOR_ROW;};

const describe=exit=>!exit?'光線在鏡廳裡不停繞圈。':exit.side==='right'&&exit.row===DOOR_ROW?'月光照在暗門上，門縫透出了光。':'光線從'+({top:'上方',bottom:'下方',left:'左側',right:'右側'}[exit.side])+'的牆邊逸出，沒有照到暗門。';

export function mountLight(ctx){
 let state=[...startState],moves=0,message='';
 const draw=()=>{
  const {cells,exit}=traceBeam(state),lit=new Set(cells.map(([r,c])=>r+','+c)),at=new Map(mirrors.map(([r,c],i)=>[r+','+c,i]));
  let grid='';
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
   const key=r+','+c,index=at.get(key),beam=lit.has(key)?' beam':'';
   if(index!==undefined)grid+='<button class="light-cell light-mirror'+beam+'" data-mirror="'+index+'" aria-label="第'+(r+1)+'列第'+(c+1)+'行的鏡子，目前是「'+(state[index]?'＼':'／')+'」，按下翻轉'+(lit.has(key)?'，月光照在這裡':'')+'">'+(state[index]?'＼':'／')+'</button>';
   else if(r===DOOR_ROW&&c===COLS-1)grid+='<span class="light-cell light-door'+(lightSolved(state)?' open':'')+'" role="img" aria-label="暗門，在第'+(DOOR_ROW+1)+'列的右端">'+'▮'+'</span>';
   else grid+='<span class="light-cell'+beam+'" aria-hidden="true">'+(beam?'·':'')+'</span>';
  }
  ctx.render('<p class="challenge-help">伊萊指向鏡廳：「暗門只有月光能打開。月光從左邊第三列射入，要走到右邊第二列的暗門——翻轉四面鏡子，替它找一條路。」</p>'
   +'<div class="light-board" role="group" aria-label="鏡廳光路，五列六行；月光從第三列左端射入，暗門在第二列右端">'+grid+'</div>'
   +'<p class="challenge-feedback" role="status">'+(message||describe(exit))+'</p>'
   +'<button id="light-reset" class="secondary-button">鏡子歸位</button>');
  document.querySelectorAll('[data-mirror]').forEach(button=>button.onclick=()=>{
   const i=Number(button.dataset.mirror);
   state[i]=state[i]?0:1;moves++;ctx.playCue('click');
   if(lightSolved(state)){ctx.done();return;}
   message='';draw();
   document.querySelector('[data-mirror="'+i+'"]')?.focus({preventScroll:true});
  });
  document.querySelector('#light-reset').onclick=()=>{state=[...startState];message='';draw();};
 };
 draw();
}
