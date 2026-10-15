// The thirteenth belfry (逆走鐘樓, 鏡淵 E1): a gear train. Two boards share one set of rules: a warm-up that teaches the
// idler (an extra gear only flips the direction) and the real train, where the crank must turn 13 times per output turn.
// Module 1: a gear's pitch radius is teeth / 2, so two gears mesh when the sockets are (teeth + teeth) / 2 apart.
// A gear closer than that jams, farther away it spins free. Layer 0 (gold) and layer 1 (copper) never touch;
// the two gears on one socket turn together. The rules are pure so scripts/blood-mirror-abyss.test.mjs can search them.
import {animate} from './clock.js';
import {ensureMaterials} from './materials.js';
import {hintMarkup,bindHints} from './belfry-hints.js';
const EPS=0.01;
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
export const CRANK_TEETH=12,CRANK_SOCKET='S0';
export const LEVELS={
 warm:{key:'warm',tray:[8,12,16],layers:1,out:'S2',target:[1,1],view:[-12,-15,44,30],reach:5,sockets:{S0:[0,0],S1:[10,0],S2:[20,0]}},
 main:{key:'main',tray:[6,8,12,13,16,18,24,39],layers:2,out:'S2',target:[1,13],view:[-26,-26,108,74],reach:6,sockets:{S0:[0,0],S1:[25.5,0],S2:[25.5,15],S3:[0,18],S4:[51,15]}}
};
export const emptyBoard=level=>Object.fromEntries(Object.keys(level.sockets).map(socket=>[socket,[null,null]]));
const freeSockets=level=>Object.keys(level.sockets).filter(socket=>socket!==CRANK_SOCKET);
const distance=(level,a,b)=>Math.hypot(level.sockets[a][0]-level.sockets[b][0],level.sockets[a][1]-level.sockets[b][1]);

// Works out how the board runs: which gears mesh, whether anything jams, and the output speed as a signed
// fraction of the crank's. `solved` needs the exact target ratio in the crank's direction.
export function evaluate(level,board){
 const nodes=[{id:CRANK_SOCKET+'.0',socket:CRANK_SOCKET,layer:0,teeth:CRANK_TEETH}];
 for(const socket of freeSockets(level))for(let layer=0;layer<level.layers;layer++){
  const teeth=board[socket]?.[layer];
  if(teeth)nodes.push({id:socket+'.'+layer,socket,layer,teeth});
 }
 const edges=[];let jam=null;
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
  const a=nodes[i],b=nodes[j];
  if(a.socket===b.socket){edges.push([i,j,'axle']);continue;}
  if(a.layer!==b.layer)continue;
  const apart=distance(level,a.socket,b.socket),mesh=(a.teeth+b.teeth)/2;
  if(Math.abs(apart-mesh)<EPS)edges.push([i,j,'mesh']);
  else if(apart<mesh-EPS)jam=jam||{a:a.id,b:b.id,why:'overlap'};
 }
 const speed=new Array(nodes.length).fill(null);speed[0]=[1,1];
 const stack=[0];
 while(stack.length&&!jam){
  const i=stack.pop();
  for(const [x,y,kind] of edges){
   const j=x===i?y:y===i?x:-1;
   if(j<0)continue;
   let next;
   if(kind==='axle')next=speed[i];
   else{const top=-speed[i][0]*nodes[i].teeth,bottom=speed[i][1]*nodes[j].teeth,d=gcd(top,bottom);next=[top/d,bottom/d];}
   if(!speed[j]){speed[j]=next;stack.push(j);}
   else if(speed[j][0]!==next[0]||speed[j][1]!==next[1])jam={a:nodes[i].id,b:nodes[j].id,why:'locked'};
  }
 }
 const dangling=nodes.filter((_,i)=>!speed[i]).map(node=>node.id);
 let out=null;
 nodes.forEach((node,i)=>{if(node.socket===level.out&&speed[i]&&!out)out=speed[i];});
 const solved=!jam&&!!out&&out[0]*level.target[1]===out[1]*level.target[0]&&out[0]>0;
 return {nodes,edges,speed,jam,out,dangling,solved};
}

// A solution is minimal when taking any single gear away breaks it, so a decorative extra gear never counts.
export function isMinimal(level,board){
 for(const socket of freeSockets(level))for(let layer=0;layer<level.layers;layer++){
  const teeth=board[socket][layer];
  if(!teeth)continue;
  board[socket][layer]=null;
  const stillSolved=evaluate(level,board).solved;
  board[socket][layer]=teeth;
  if(stillSolved)return false;
 }
 return true;
}

// Every placement of tray gears that solves the board, as JSON strings. The design needs exactly one per board.
export function solveAll(level){
 const slots=freeSockets(level).flatMap(socket=>Array.from({length:level.layers},(_,layer)=>[socket,layer]));
 const board=emptyBoard(level),used=level.tray.map(()=>false),found=[];
 (function place(at){
  if(at===slots.length){if(evaluate(level,board).solved&&isMinimal(level,board))found.push(JSON.stringify(board));return;}
  const [socket,layer]=slots[at];
  place(at+1);
  level.tray.forEach((teeth,g)=>{
   if(used[g])return;
   used[g]=true;board[socket][layer]=teeth;place(at+1);board[socket][layer]=null;used[g]=false;
  });
 })(0);
 return found;
}

// Candle-light hints (燭光提示): three tiers per step - where to look, the rule, the answer. `hintStep` reads the
// player's own board, so the hint always matches what they are stuck on. A solved board has no step.
export const HINTS={
 warm:[
  '曲柄在最左邊，紅圈是輸出軸，中間還有一個軸座。按「顯示軸座距離」，看看每兩個軸座相隔多遠。',
  '兩個齒輪要咬合，中心距＝兩個齒數相加的一半。曲柄是 12 齒、離中間軸座 10，所以中間的齒輪是 10×2−12 = 8 齒。',
  '中間的軸座放 8 齒，輸出軸（紅圈）放 12 齒。'
 ],
 first:[
  '先看曲柄（左上、12 齒）。按「顯示軸座距離」，找出曲柄右邊那個軸座離曲柄多遠。',
  '兩個齒輪要咬合，中心距＝兩個齒數相加的一半。曲柄是 12 齒、距離是 25.5，所以另一顆的齒數是 25.5×2−12。',
  '把 39 齒放在曲柄右邊軸座的「下層」（金色）。'
 ],
 second:[
  '第一段只減速到 12 : 39（約 3.25 倍），還差約 4 倍。同一個軸座的上層和下層會一起轉，上層可以接力到輸出軸。',
  '接力這一段：小齒輪放在 39 齒所在軸座的上層，大齒輪放在輸出軸（紅圈）的上層。兩顆齒數相加要等於兩軸座距離 15 的兩倍（30），而且大÷小要剛好是 4。',
  '39 齒軸座的上層放 6 齒，輸出軸（紅圈）的上層放 24 齒。'
 ]
};
export function hintStep(level,board){
 if(evaluate(level,board).solved)return null;
 if(level.key==='warm')return 'warm';
 return board.S1?.[0]===39?'second':'first';
}

// Gear outline: trapezoid teeth around the pitch circle, as one SVG path centred on 0,0.
export function toothPath(teeth){
 const pitch=teeth/2,step=Math.PI*2/teeth,root=pitch-1,tip=pitch+1;
 let path='';
 for(let k=0;k<teeth;k++)for(const [offset,radius] of [[-.27,root],[-.16,tip],[.16,tip],[.27,root]]){
  const angle=k*step+offset*step;
  path+=(path?'L':'M')+(Math.cos(angle)*radius).toFixed(2)+' '+(Math.sin(angle)*radius).toFixed(2);
 }
 return path+'Z';
}
// Starting angle of every gear so the teeth of meshing gears interleave instead of colliding (breadth-first from the crank).
export function phases(level,result){
 const {nodes,edges}=result,phase=new Array(nodes.length).fill(0),seen=new Array(nodes.length).fill(false);
 seen[0]=true;
 const queue=[0];
 while(queue.length){
  const i=queue.shift();
  for(const [x,y,kind] of edges){
   const j=x===i?y:y===i?x:-1;
   if(j<0||seen[j])continue;
   seen[j]=true;
   if(kind==='axle')phase[j]=phase[i];
   else{
    const a=nodes[i],b=nodes[j],toward=Math.atan2(level.sockets[b.socket][1]-level.sockets[a.socket][1],level.sockets[b.socket][0]-level.sockets[a.socket][0]);
    const offset=(toward-phase[i])*a.teeth/(2*Math.PI);
    phase[j]=toward+Math.PI-2*Math.PI*(0.5-offset)/b.teeth;
   }
   queue.push(j);
  }
 }
 return phase;
}

const NS='http://www.w3.org/2000/svg';
const LAYER_NAME=['下層（金）','上層（銅）'];
const GOAL={
 warm:'左邊金色的是曲柄（12 齒），右邊紅圈是輸出軸。讓輸出軸<b>和曲柄轉得一樣快、轉向也相同</b>：中間那個軸座放一顆「惰輪」，惰輪只改變方向，不改變速度比。',
 main:'左上角金色的曲柄齒輪（12 齒）轉 <b>13 圈</b>，右下紅圈的輸出軸要剛好轉 <b>1 圈</b>，而且<b>轉向和曲柄相同</b>。'
};
const RULES={
 warm:['從下方取齒輪：點一下選取，再點畫面上的黑色軸座放上去。再點一次軸座可以取下。','齒輪要剛好咬合：太遠會空轉，太近會卡住（變紅）。'],
 main:['從下方取齒輪：點一下選取，選好「放置層」，再點畫面上的黑色軸座放上去。再點一次軸座可以取下。','金色是下層、銅色是上層。只有同一層的齒輪會咬合；同一個軸座上的上下兩層齒輪會一起轉。','齒輪要剛好咬合：太遠會空轉，太近會卡住（變紅）。']
};
const STATUS_WAIT={warm:'輸出軸還沒有被帶動。',main:'輸出軸還沒有被帶動。'};

// Mounts the board. The shell is drawn once and then updated in place, so spinning the crank does not rebuild the modal.
// ctx = { render(html), feedback(text), done(), playCue(kind) }
export function mountGears13(ctx){
 ensureMaterials();
 const motion=()=>!document.body.classList.contains('reduce-motion');
 let level=LEVELS.warm,board=emptyBoard(level),picked=null,layer=0,turns=0,running=null,ruler=false,result=null;
 let hints=null;
 let nodesEl=[],crankHandle=null,outMarker=null;

 ctx.render('<div class="belfry">'
  +'<p class="challenge-help" id="bf-goal"></p><ol class="belfry-rules" id="bf-rules"></ol>'
  +'<p id="bf-status" class="belfry-status" role="status"></p>'
  +'<div class="belfry-board"><svg id="bf-svg" class="belfry-svg" role="group" aria-label="齒輪盤"></svg></div>'
  +'<div class="belfry-row"><span id="bf-layers"></span><button id="bf-ruler" class="secondary-button" aria-pressed="false">顯示軸座距離</button><button id="bf-reset" class="secondary-button">重來</button></div>'
  +'<div id="bf-tray" class="belfry-tray" role="group" aria-label="齒輪托盤"></div>'
  +'<button id="bf-run" class="primary-button" hidden></button>'
  +hintMarkup+'</div>');
 const $=id=>document.getElementById(id),svg=$('bf-svg');
 const alive=()=>svg.isConnected;
 const say=(text,tone='')=>{const el=$('bf-status');el.textContent=text;el.dataset.tone=tone;};

 function setLevel(next){
  level=next;board=emptyBoard(level);picked=null;layer=0;turns=0;running=null;ruler=false;
  $('bf-goal').innerHTML=GOAL[level.key];
  $('bf-rules').innerHTML=RULES[level.key].map(text=>'<li>'+text+'</li>').join('');
  $('bf-layers').innerHTML=level.layers>1?LAYER_NAME.map((name,i)=>'<button class="secondary-button belfry-layer" data-layer="'+i+'" aria-pressed="'+(i===layer)+'">'+name+'</button>').join(''):'';
  $('bf-ruler').setAttribute('aria-pressed','false');
  svg.setAttribute('viewBox',level.view.join(' '));
  document.querySelectorAll('[data-layer]').forEach(button=>button.onclick=()=>{
   layer=Number(button.dataset.layer);
   document.querySelectorAll('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.layer)===layer)));
   drawTray();
  });
  update();
 }

 // A gear is a textured plate (brass below, copper above) cut to the tooth outline, with its web recessed and lightened by holes.
 // Only the rotating part is here; the light and the shadow stay put, so the light never turns with the gear.
 function gearGroup(teeth,gearLayer,bad){
  const group=document.createElementNS(NS,'g');
  group.setAttribute('class','belfry-gear layer'+gearLayer+(bad?' bad':''));
  const radius=teeth/2,web=Math.max(radius-2.9,1),hub=Math.min(2.1,radius/3);
  let holes='';
  if(teeth>=10){
   const count=teeth>=14?6:5,ring=(web+hub+.8)/2,size=Math.max((web-hub-1.4)/2*.62,.7);
   for(let k=0;k<count;k++){const a=k*Math.PI*2/count;holes+='<circle class="gear-hole" cx="'+(Math.cos(a)*ring).toFixed(2)+'" cy="'+(Math.sin(a)*ring).toFixed(2)+'" r="'+size.toFixed(2)+'"/>';}
  }
  group.innerHTML='<path class="gear-body" d="'+toothPath(teeth)+'"/><circle class="gear-web" r="'+web+'"/><circle class="gear-rimline" r="'+web+'"/>'+holes
   +'<circle class="gear-hub" r="'+hub+'"/><circle class="gear-axle" r="'+(hub*.42).toFixed(2)+'"/>';
  return group;
 }
 // Not rotating: a soft cast shadow under the gear, and the highlight over it.
 function disc(cls,radius,x,y,dx=0,dy=0){
  const circle=document.createElementNS(NS,'circle');
  circle.setAttribute('class',cls);circle.setAttribute('r',radius);circle.setAttribute('cx',x+dx);circle.setAttribute('cy',y+dy);
  circle.setAttribute('pointer-events','none');
  return circle;
 }

 function drawBoard(){
  result=evaluate(level,board);
  const phase=phases(level,result);
  svg.textContent='';nodesEl=[];
  if(ruler){
   const ids=Object.keys(level.sockets);
   for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
    const a=level.sockets[ids[i]],b=level.sockets[ids[j]],apart=distance(level,ids[i],ids[j]);
    if(apart>32)continue;
    svg.insertAdjacentHTML('beforeend','<line class="belfry-ruler" x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'"/><text class="belfry-dist" x="'+(a[0]+b[0])/2+'" y="'+((a[1]+b[1])/2-.6)+'">'+apart.toFixed(1).replace('.0','')+'</text>');
   }
  }
  // Each socket is a well in the plate with a brass lip; a gear on it covers the well.
  for(const socket of Object.keys(level.sockets)){
   const [x,y]=level.sockets[socket];
   svg.appendChild(disc('belfry-socket'+(socket===level.out?' out':''),socket===CRANK_SOCKET?2.6:3.4,x,y));
  }
  for(let gearLayer=0;gearLayer<level.layers;gearLayer++)result.nodes.forEach((node,i)=>{
   if(node.layer!==gearLayer)return;
   const bad=!!result.jam&&(result.jam.a===node.id||result.jam.b===node.id);
   const group=gearGroup(node.teeth,node.layer,bad),[x,y]=level.sockets[node.socket];
   const pitch=node.teeth/2;
   svg.appendChild(disc('gear-shadow',pitch+.3,x,y,.6,1));
   svg.appendChild(group);
   svg.appendChild(disc('gear-roundness',pitch-.9,x,y));
   nodesEl.push({group,x,y,phase:phase[i],speed:result.speed[i]?result.speed[i][0]/result.speed[i][1]:0});
  });
  for(const socket of Object.keys(level.sockets)){
   const [x,y]=level.sockets[socket];
   if(socket===CRANK_SOCKET)continue;
   const hit=document.createElementNS(NS,'circle');
   hit.setAttribute('cx',x);hit.setAttribute('cy',y);hit.setAttribute('r',level.reach);hit.setAttribute('class','belfry-hit');
   hit.setAttribute('role','button');hit.setAttribute('tabindex','0');hit.dataset.socket=socket;
   hit.setAttribute('aria-label',name(socket)+'，'+socketText(socket));
   hit.addEventListener('click',()=>tap(socket));
   hit.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();tap(socket);}});
   svg.appendChild(hit);
   if(socket===level.out){
    svg.insertAdjacentHTML('beforeend','<circle class="belfry-out-ring" cx="'+x+'" cy="'+y+'" r="4"/><text class="belfry-label out" x="'+x+'" y="'+(y+7.4)+'">輸出軸</text>');
    outMarker=document.createElementNS(NS,'circle');outMarker.setAttribute('r','.9');outMarker.setAttribute('class','belfry-out-mark');svg.appendChild(outMarker);
   }else if(!board[socket].some(Boolean))svg.insertAdjacentHTML('beforeend','<text class="belfry-label dim" x="'+x+'" y="'+(y-3.2)+'">軸座</text>');
  }
  crankHandle=document.createElementNS(NS,'g');
  crankHandle.innerHTML='<line class="belfry-crank" x1="0" y1="0" x2="0" y2="0"/><line class="belfry-crank-hi" x1="0" y1="0" x2="0" y2="0"/><circle class="belfry-knob" r="1.35"/>';
  svg.appendChild(crankHandle);
  svg.insertAdjacentHTML('beforeend','<text class="belfry-label" x="0" y="-8.6">曲柄 12 齒</text>');
  pose();
 }
 const socketText=socket=>{
  const parts=[];
  for(let l=0;l<level.layers;l++)if(board[socket][l])parts.push((level.layers>1?LAYER_NAME[l].slice(0,2)+' ':'')+board[socket][l]+' 齒');
  return parts.length?'已放 '+parts.join('、'):'空的';
 };
 // Turns every gear to the crank's current angle.
 function pose(){
  for(const gear of nodesEl)gear.group.setAttribute('transform','translate('+gear.x+' '+gear.y+') rotate('+((gear.phase+turns*gear.speed*Math.PI*2)*180/Math.PI).toFixed(2)+')');
  const angle=turns*Math.PI*2-Math.PI/2;
  if(crankHandle){
   const [line,shine]=crankHandle.children,knob=crankHandle.lastChild;
   for(const l of [line,shine]){l.setAttribute('x2',(Math.cos(angle)*5).toFixed(2));l.setAttribute('y2',(Math.sin(angle)*5).toFixed(2));}
   knob.setAttribute('cx',(Math.cos(angle)*5).toFixed(2));knob.setAttribute('cy',(Math.sin(angle)*5).toFixed(2));
  }
  if(outMarker){
   const out=result.out,[x,y]=level.sockets[level.out];
   outMarker.setAttribute('visibility',out?'visible':'hidden');
   if(out){const a=turns*out[0]/out[1]*Math.PI*2-Math.PI/2;outMarker.setAttribute('cx',(x+Math.cos(a)*3.2).toFixed(2));outMarker.setAttribute('cy',(y+Math.sin(a)*3.2).toFixed(2));}
  }
  const out=result.out;
  $('bf-counter').textContent='曲柄 '+turns.toFixed(2)+' 圈'+(out?' · 輸出 '+Math.abs(turns*out[0]/out[1]).toFixed(2)+' 圈':'');
 }

 function drawTray(){
  const tray=$('bf-tray');tray.textContent='';
  const placed={},taken={};
  for(const socket of Object.keys(board))board[socket].forEach(teeth=>{if(teeth)placed[teeth]=(placed[teeth]||0)+1;});
  level.tray.forEach((teeth,i)=>{
   const used=(placed[teeth]||0)>(taken[teeth]||0);
   if(used)taken[teeth]=(taken[teeth]||0)+1;
   const button=document.createElement('button');
   button.className='belfry-gear-button';button.disabled=used;
   button.setAttribute('aria-pressed',String(picked===i));
   button.setAttribute('aria-label',teeth+' 齒齒輪'+(used?'（已放置）':''));
   const r=teeth/2+2,icon=document.createElementNS(NS,'svg');
   icon.setAttribute('viewBox',-r+' '+-r+' '+2*r+' '+2*r);icon.setAttribute('aria-hidden','true');
   icon.appendChild(gearGroup(teeth,layer,false));icon.appendChild(disc('gear-roundness',teeth/2-.9,0,0));button.appendChild(icon);
   button.insertAdjacentHTML('beforeend','<b>'+teeth+' 齒</b>');
   button.onclick=()=>{
    picked=picked===i?null:i;drawTray();
    say(picked!==null?'已選 '+level.tray[picked]+' 齒。點一個軸座放上去'+(level.layers>1?'（'+LAYER_NAME[layer]+'）':'')+'。':'');
   };
   tray.appendChild(button);
  });
 }

 function tap(socket){
  if(running)return;
  if(picked!==null){
   if(board[socket][layer]){say('這個軸座的這一層已經有齒輪了，先點一下取下它。','bad');ctx.playCue('wrong');return;}
   board[socket][layer]=level.tray[picked];picked=null;ctx.playCue('click');update();return;
  }
  const at=board[socket][layer]?layer:level.layers>1&&board[socket][1-layer]?1-layer:null;
  if(at===null){say('先從下方選一個齒輪。');return;}
  board[socket][at]=null;ctx.playCue('click');update();
 }

 function describe(){
  if(result.solved)return ['齒輪咬合了：'+(level.key==='warm'?'輸出軸和曲柄同速、同方向。':'曲柄 13 圈，輸出軸剛好 1 圈，同方向。'),'ok'];
  if(result.jam)return [result.jam.why==='overlap'?'卡住：'+label(result.jam.a)+'和'+label(result.jam.b)+'重疊，但齒沒有咬合。換個尺寸，或換個軸座。':'卡住：這組齒輪互相鎖死，轉不動。','bad'];
  if(result.out){const [n,d]=result.out;return ['輸出軸已被帶動：曲柄 '+d/gcd(n,d)+' 圈，輸出 '+Math.abs(n)/gcd(n,d)+' 圈'+(n<0?'（反方向）':'')+'。還不是目標。',''];}
  return [result.dangling.length?'有 '+result.dangling.length+' 個齒輪沒有咬合到任何東西（距離太遠，空轉）。'+STATUS_WAIT[level.key]:STATUS_WAIT[level.key],''];
 }
 const name=socket=>socket===CRANK_SOCKET?'曲柄':socket===level.out?'輸出軸':'軸座 '+socket.slice(1);
 const label=id=>{const [socket,l]=id.split('.');return name(socket)+(level.layers>1&&socket!==CRANK_SOCKET?' '+LAYER_NAME[l].slice(0,2):'');};

 function update(){
  drawBoard();drawTray();
  const [text,tone]=describe();say(text,tone);
  const run=$('bf-run');
  run.hidden=!result.solved||!!running;
  run.textContent=level.key==='warm'?'轉動曲柄，看它們同速同向 ⟶':'轉動曲柄 13 圈 ⟶';
  hints?.changed();
 }

 // The crank runs a fixed number of turns, then the stage ends (the warm-up goes on to the real train).
 function run(need){
  if(running)return;
  running={need};$('bf-run').hidden=true;ctx.playCue('door');
  if(!motion()){turns=need;pose();finish();return;}
  // Time-based (puzzles/clock.js): the run takes the same time on any frame rate, and goes on in a background tab.
  const rate=need>3?1.4:.7;
  animate(elapsed=>{
   if(!alive()||!running)return false;
   turns=Math.min(need,elapsed/1000*rate);pose();
   if(turns>=need){finish();return false;}
  });
 }
 function finish(){
  running=null;
  if(level.key==='warm'){
   setLevel(LEVELS.main);
   say('惰輪只改變轉向，不改變速度比。錶芯真正的齒輪列現在才露出來。','ok');
   return;
  }
  ctx.done();
 }
 $('bf-run').onclick=()=>run(level.key==='warm'?2:13);

 $('bf-reset').onclick=()=>{if(running)return;board=emptyBoard(level);picked=null;turns=0;update();say('齒輪盤已清空。');};
 $('bf-ruler').onclick=()=>{ruler=!ruler;$('bf-ruler').setAttribute('aria-pressed',String(ruler));drawBoard();};
 hints=bindHints({hints:HINTS,currentStep:()=>hintStep(level,board),alive});

 const counter=document.createElement('span');counter.id='bf-counter';counter.className='belfry-note';
 $('bf-layers').parentElement.appendChild(counter);
 setLevel(LEVELS.warm);
}
