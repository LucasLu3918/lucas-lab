// Port directions are clockwise: north, east, south, west.
export const pipeTiles=[
 {at:1,type:'straight'}, {at:2,type:'elbow'}, {at:5,type:'elbow'},
 {at:4,type:'elbow'}, {at:7,type:'elbow'}
];
export const initialPipeRotations=[1,0,1,3,2];
export const pipeDirectionNames=['上','右','下','左'];
export function pipePorts(type,turns){
 if(!['straight','elbow'].includes(type)||!Number.isInteger(turns))return [];
 const rotation=((turns%4)+4)%4;
 return (type==='straight'?[1,3]:[0,1]).map(port=>(port+rotation)%4);
}
export function analyzePipes(rotations){
 const invalid={valid:false,solved:false,flowing:[],leaks:[],connectedPipes:0};
 if(!Array.isArray(rotations)||rotations.length!==pipeTiles.length||!rotations.every(Number.isSafeInteger))return invalid;
 const cells=new Map([[0,[1]],[8,[3]]]);
 pipeTiles.forEach((tile,i)=>cells.set(tile.at,pipePorts(tile.type,rotations[i])));
 const flowing=new Set([0]),queue=[0],leaks=[];
 for(let n=0;n<queue.length;n++){
  const at=queue[n],row=Math.floor(at/3),col=at%3;
  for(const direction of cells.get(at)){
   const nextRow=row+[-1,0,1,0][direction],nextCol=col+[0,1,0,-1][direction];
   const next=nextRow<0||nextRow>2||nextCol<0||nextCol>2?null:nextRow*3+nextCol;
   if(next===null||!cells.get(next)?.includes((direction+2)%4)){leaks.push({at,direction,next});continue;}
   if(!flowing.has(next)){flowing.add(next);queue.push(next);}
  }
 }
 return {valid:true,solved:flowing.has(8)&&leaks.length===0,flowing:[...flowing],leaks,connectedPipes:pipeTiles.filter(tile=>flowing.has(tile.at)).length};
}
export const pipeIsSolved=rotations=>analyzePipes(rotations).solved;

// The rotation the player is working on. Kept across a "replay" but cleared by resetPipes().
let attempt=null;
export function resetPipes(){attempt=null;}

const hints=[
 '從左上泉源開始：上方的直管必須左右相通，才能把蒸汽送往右上角。',
 '沿著通汽的亮管往前看：右上彎向下，中右彎向左，中央再彎向下。',
 '下方中央的彎管要向上接住蒸汽，再向右送入城市。直管轉半圈仍是相同通路。'
];

// Five pipe sections on a 3x3 board: rotate pieces until steam flows from the spring to the city.
export function mountPipes(ctx){
 if(ctx.fresh)attempt=null;
 if(!attempt)attempt={rotations:[...initialPipeRotations],history:[],hint:0};
 const current=attempt;
 const snapshot=()=>{
  const network=analyzePipes(current.rotations),leak=network.leaks[0];
  return {
   tiles:pipeTiles.map((tile,i)=>({at:tile.at,type:tile.type,rotation:current.rotations[i],directions:pipePorts(tile.type,current.rotations[i]).map(port=>pipeDirectionNames[port]),flowing:network.flowing.includes(tile.at)})),
   flowingCells:network.flowing,connectedPipes:network.connectedPipes,solved:network.solved,
   leak:leak?{at:leak.at,direction:pipeDirectionNames[leak.direction]}:null,
   status:network.solved?'五段管件已接通，城市可以開始供暖。':'蒸汽已通過 '+network.connectedPipes+' / 5 段管件，城市尚未接通。',
   explanation:network.solved?'按下「確認管網接通」完成修復。':leak?'第'+(Math.floor(leak.at/3)+1)+'排第'+(leak.at%3+1)+'格的'+pipeDirectionNames[leak.direction]+'側管口尚未接好。沿通汽管段檢查下一格。':'',
   hintText:current.hint?hints.slice(0,current.hint).join(' '):'',hintCount:current.hint,hintLimit:hints.length,canUndo:current.history.length>0
  };
 };
 const act=action=>{
  if(!action||typeof action!=='object')return snapshot();
  if(action.type==='rotate'&&Number.isInteger(action.index)&&action.index>=0&&action.index<pipeTiles.length){
   current.history.push([...current.rotations]);if(current.history.length>50)current.history.shift();
   current.rotations[action.index]++;ctx.playCue('click');
  }else if(action.type==='undo'&&current.history.length)current.rotations=current.history.pop();
  else if(action.type==='reset'){current.rotations=[...initialPipeRotations];current.history=[];}
  else if(action.type==='hint')current.hint=Math.min(hints.length,current.hint+1);
  else if(action.type==='confirm'&&pipeIsSolved(current.rotations))ctx.done();
  return snapshot();
 };
 if(ctx.mountPuzzleIsland){
  ctx.render('<p class="challenge-help">將左上「泉源」接到右下「城市」。每點一次，管件順時針轉 90°；只有相接的管口能傳送蒸汽，直管轉半圈也算接通。</p><div data-vue-pipes-puzzle><p role="status">管網正在映照…</p></div>');
  ctx.mountPuzzleIsland({snapshot:snapshot(),onAction:act});
  return;
 }
 ctx.render('<p class="challenge-help">將左上「泉源」接到右下「城市」。每點一次，管件順時針轉 90°；只有相接的管口能傳送蒸汽，直管轉半圈也算接通。</p><div class="pipe-legend"><span>◆ 通汽管段</span><span>○ 尚未通汽</span></div><div class="pipes-board" aria-label="三乘三蒸汽管網">'+Array.from({length:9},(_,at)=>{
  if(at===0||at===8)return '<div class="pipe-terminal '+(at===0?'pipe-source':'pipe-city')+'" data-pipe-cell="'+at+'" role="img" aria-label="'+(at===0?'泉源，出汽口向右':'城市，進汽口向左')+'">'+pipeSVG(at===0?'source':'city')+'<strong>'+(at===0?'泉源 →':'→ 城市')+'</strong><small class="pipe-terminal-status">'+(at===0?'持續供汽':'等待供暖')+'</small></div>';
  const i=pipeTiles.findIndex(tile=>tile.at===at);
  return i<0?'<div class="pipe-empty" aria-label="不可通行的岩壁">岩壁</div>':'<button class="pipe-piece" data-pipe="'+i+'" aria-label="旋轉管件" aria-describedby="pipes-keyboard">'+pipeSVG(pipeTiles[i].type)+'<small class="pipe-coordinate">'+(Math.floor(at/3)+1)+' · '+(at%3+1)+'</small><span class="pipe-connected" hidden>◆ 通汽</span></button>';
 }).join('')+'</div><div class="pipe-actions"><button id="pipes-undo" class="secondary-button" disabled>↶ 上一步</button><button id="pipes-reset" class="secondary-button">重新接管</button><button id="pipes-hint" class="secondary-button">查看提示</button></div><p id="pipes-status" class="challenge-feedback" role="status"></p><p id="pipes-break" class="pipe-explanation"></p><p id="pipes-keyboard" class="pipe-keyboard">鍵盤：Tab 選取，Enter 旋轉；方向鍵換格。</p><button id="pipes-confirm" class="primary-button" disabled>接通管線後才能確認</button><p id="pipes-hint-text" class="pipe-hint" role="status"></p>');
 const board=document.querySelector('.pipes-board');
 const update=()=>{
  const network=analyzePipes(current.rotations);
  pipeTiles.forEach((tile,i)=>{
   const button=board.querySelector('[data-pipe="'+i+'"]'),ports=pipePorts(tile.type,current.rotations[i]),connected=network.flowing.includes(tile.at);
   button.querySelector('.pipe-glyph').style.transform='rotate('+current.rotations[i]*90+'deg)';
   button.classList.toggle('flowing',connected);button.dataset.pipePorts=ports.join(',');
   button.querySelector('.pipe-connected').hidden=!connected;
   button.setAttribute('aria-label','第'+(Math.floor(tile.at/3)+1)+'排第'+(tile.at%3+1)+'格，'+(tile.type==='straight'?'直管':'彎管')+'，管口向'+ports.map(p=>pipeDirectionNames[p]).join('、')+'，'+(connected?'蒸汽已通':'尚未通汽'));
  });
  board.querySelector('.pipe-source').classList.add('flowing');
  const city=board.querySelector('.pipe-city');city.classList.toggle('flowing',network.solved);city.querySelector('.pipe-terminal-status').textContent=network.solved?'已接通':'等待供暖';city.setAttribute('aria-label','城市，進汽口向左，'+(network.solved?'已接通':'等待供暖'));
  document.querySelector('#pipes-status').textContent=network.solved?'五段管件已接通，城市可以開始供暖。':'蒸汽已通過 '+network.connectedPipes+' / 5 段管件，城市尚未接通。';
  const leak=network.leaks[0];
  document.querySelector('#pipes-break').textContent=network.solved?'按下「確認管網接通」完成修復。':leak?'第'+(Math.floor(leak.at/3)+1)+'排第'+(leak.at%3+1)+'格的'+pipeDirectionNames[leak.direction]+'側管口尚未接好。沿通汽管段檢查下一格。':'';
  const confirm=document.querySelector('#pipes-confirm');confirm.disabled=!network.solved;confirm.textContent=network.solved?'確認管網接通 ⟶':'接通管線後才能確認';
  document.querySelector('#pipes-undo').disabled=!current.history.length;
  document.querySelector('#pipes-hint').disabled=current.hint===hints.length;
  document.querySelector('#pipes-hint-text').textContent=current.hint?hints.slice(0,current.hint).join(' '):'';
 };
 board.addEventListener('click',event=>{
  const button=event.target.closest('[data-pipe]');if(!button)return;
  act({type:'rotate',index:Number(button.dataset.pipe)});update();
 });
 board.addEventListener('keydown',event=>{
  const button=event.target.closest('[data-pipe]');const step={ArrowUp:-3,ArrowDown:3,ArrowLeft:-1,ArrowRight:1}[event.key];
  if(!button||!step)return;
  event.preventDefault();
  const from=pipeTiles[Number(button.dataset.pipe)].at;
  for(let at=from+step;at>=0&&at<9;at+=step){
   if(Math.abs(step)===1&&Math.floor(at/3)!==Math.floor(from/3))break;
   const next=pipeTiles.findIndex(tile=>tile.at===at);
   if(next>=0){board.querySelector('[data-pipe="'+next+'"]').focus();break;}
  }
 });
 document.querySelector('#pipes-undo').onclick=()=>{act({type:'undo'});update();};
 document.querySelector('#pipes-reset').onclick=()=>{act({type:'reset'});update();};
 document.querySelector('#pipes-hint').onclick=()=>{act({type:'hint'});update();};
 document.querySelector('#pipes-confirm').onclick=()=>act({type:'confirm'});
 update();
}

// Painted copper pipe sections (assets/puzzles/pipe-*.webp). Every sprite is drawn in its turn-0 pose, which is what pipePorts()
// assumes: the straight runs left to right, the elbow joins its top edge to its right edge, the spring points right, the city points left.
export function pipeSVG(type){
 return `<span class="pipe-glyph pipe-${type}" aria-hidden="true"></span>`;
}
