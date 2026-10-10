import {pipeTiles,initialPipeRotations,pipeDirectionNames,pipePorts,analyzePipes,pipeIsSolved,pipeSVG} from './pipes.js';
export {pipeIsSolved} from './pipes.js';
import {conceptStyle,conceptMarkup,conceptArt} from './concept-art.js';
// Five tactile puzzles complement the original story seals. No external dependencies.
const KEY='blood-mirror-challenges-v2';
const ids=['library','mine','crypt','queen','mirror'];
let volatile=new Set(),pipeAttempt=null;
function stored(){try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return new Set(Array.isArray(value)?value.filter(x=>ids.includes(x)):[]);}catch{return new Set(volatile);}}
export function isChallengeComplete(id){return stored().has(id);}
export function resetChallenges(){volatile.clear();pipeAttempt=null;try{localStorage.removeItem(KEY);}catch{}}
function complete(id){const done=stored();done.add(id);volatile=new Set(done);try{localStorage.setItem(KEY,JSON.stringify([...done]));}catch{}}
export function puzzleIsSolved(order){return order.length===9&&order.every((v,i)=>v===i);}
export function glassIsSolved(left,right){return left.length===8&&right.length===8&&left.every((x,i)=>x===right[i^1]);}
export function startChallenge(id,{modal,success,playCue}){
 const done=()=>{complete(id);playCue('solve');success();};
 const show=(title,subtitle,html)=>{const active=document.activeElement;const attr=['data-pos','data-pipe','data-rune','data-memory','data-reflection'].find(k=>active?.hasAttribute(k));const selector=attr?'['+attr+'="'+active.getAttribute(attr)+'"]':null;modal(title,subtitle,'<div class="challenge" data-challenge="'+id+'">'+html+'</div>');if(selector)document.querySelector('.challenge '+selector)?.focus({preventScroll:true});};
 const feedback=(s)=>{const el=document.querySelector('.challenge-feedback');if(el)el.textContent=s;};
 if(id==='library'){
  let tiles=[4,0,8,2,6,1,3,7,5],selected=-1;
  const draw=()=>{show('破碎的公主肖像','INTERACTIVE SEAL · 九格拼圖','<p class="challenge-help">鏡子打散了公主的面容。點選兩塊碎片交換位置，將畫像完整復原。</p><figure class="concept-reference">'+conceptMarkup('portrait')+'<figcaption>還原這幅肖像</figcaption></figure><div class="tile-board">'+tiles.map((v,i)=>'<button class="picture-tile '+(i===selected?'selected':'')+'" data-pos="'+i+'" aria-label="第'+(i+1)+'格碎片，圖塊 '+(v+1)+'" aria-pressed="'+(i===selected)+'" style="'+conceptStyle('portrait',v)+'"></button>').join('')+'</div><p class="challenge-feedback" role="status">選取任意兩塊碎片進行交換。</p><button id="puzzle-reset" class="secondary-button">重新打散拼圖</button>');
   document.querySelectorAll('[data-pos]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.pos);if(selected<0){selected=i;draw();return;}if(selected===i){selected=-1;draw();return;}[tiles[i],tiles[selected]]=[tiles[selected],tiles[i]];selected=-1;if(puzzleIsSolved(tiles)){done();return;}playCue('click');draw();});
   document.querySelector('#puzzle-reset').onclick=()=>{tiles=[8,1,5,3,0,7,4,2,6];selected=-1;draw();};
  };draw();return;
 }
 if(id==='mine'){
  if(!pipeAttempt)pipeAttempt={rotations:[...initialPipeRotations],history:[],hint:0};
  const attempt=pipeAttempt,hints=[
   '從左上泉源開始：上方的直管必須左右相通，才能把蒸汽送往右上角。',
   '沿著通汽的亮管往前看：右上彎向下，中右彎向左，中央再彎向下。',
   '下方中央的彎管要向上接住蒸汽，再向右送入城市。直管轉半圈仍是相同通路。'
  ];
  show('重接銀骨蒸汽管','INTERACTIVE SEAL · 城市供暖','<p class="challenge-help">將左上「泉源」接到右下「城市」。每點一次，管件順時針轉 90°；只有相接的管口能傳送蒸汽，直管轉半圈也算接通。</p><div class="pipe-legend"><span>◆ 通汽管段</span><span>○ 尚未通汽</span></div><div class="pipes-board" aria-label="三乘三蒸汽管網">'+Array.from({length:9},(_,at)=>{
   if(at===0||at===8)return '<div class="pipe-terminal '+(at===0?'pipe-source':'pipe-city')+'" data-pipe-cell="'+at+'" role="img" aria-label="'+(at===0?'泉源，出汽口向右':'城市，進汽口向左')+'">'+pipeSVG(at===0?'source':'city',{terminal:true})+'<strong>'+(at===0?'泉源 →':'→ 城市')+'</strong><small class="pipe-terminal-status">'+(at===0?'持續供汽':'等待供暖')+'</small></div>';
   const i=pipeTiles.findIndex(tile=>tile.at===at);
   return i<0?'<div class="pipe-empty" aria-label="不可通行的岩壁">岩壁</div>':'<button class="pipe-piece" data-pipe="'+i+'" aria-label="旋轉管件" aria-describedby="pipes-keyboard">'+pipeSVG(pipeTiles[i].type)+'<small class="pipe-coordinate">'+(Math.floor(at/3)+1)+' · '+(at%3+1)+'</small><span class="pipe-connected" hidden>◆ 通汽</span></button>';
  }).join('')+'</div><div class="pipe-actions"><button id="pipes-undo" class="secondary-button" disabled>↶ 上一步</button><button id="pipes-reset" class="secondary-button">重新接管</button><button id="pipes-hint" class="secondary-button">查看提示</button></div><p id="pipes-status" class="challenge-feedback" role="status"></p><p id="pipes-break" class="pipe-explanation"></p><p id="pipes-keyboard" class="pipe-keyboard">鍵盤：Tab 選取，Enter 旋轉；方向鍵換格。</p><button id="pipes-confirm" class="primary-button" disabled>接通管線後啟動供暖</button><p id="pipes-hint-text" class="pipe-hint" role="status"></p>');
  const board=document.querySelector('.pipes-board');
  const update=()=>{
   const network=analyzePipes(attempt.rotations);
   pipeTiles.forEach((tile,i)=>{
    const button=board.querySelector('[data-pipe="'+i+'"]'),ports=pipePorts(tile.type,attempt.rotations[i]),connected=network.flowing.includes(tile.at);
    button.querySelector('.pipe-glyph').style.transform='rotate('+attempt.rotations[i]*90+'deg)';
    button.classList.toggle('flowing',connected);button.dataset.pipePorts=ports.join(',');
    button.querySelector('.pipe-connected').hidden=!connected;
    button.setAttribute('aria-label','第'+(Math.floor(tile.at/3)+1)+'排第'+(tile.at%3+1)+'格，'+(tile.type==='straight'?'直管':'彎管')+'，管口向'+ports.map(p=>pipeDirectionNames[p]).join('、')+'，'+(connected?'蒸汽已通':'尚未通汽'));
   });
   board.querySelector('.pipe-source').classList.add('flowing');
   const city=board.querySelector('.pipe-city');city.classList.toggle('flowing',network.solved);city.querySelector('.pipe-terminal-status').textContent=network.solved?'已接通':'等待供暖';city.setAttribute('aria-label','城市，進汽口向左，'+(network.solved?'已接通':'等待供暖'));
   document.querySelector('#pipes-status').textContent=network.solved?'五段管件已接通，城市可以開始供暖。':'蒸汽已通過 '+network.connectedPipes+' / 5 段管件，城市尚未接通。';
   const leak=network.leaks[0];document.querySelector('#pipes-break').textContent=network.solved?'按下「啟動城市供暖」完成修復。':leak?'第'+(Math.floor(leak.at/3)+1)+'排第'+(leak.at%3+1)+'格的'+pipeDirectionNames[leak.direction]+'側管口尚未接好。沿通汽管段檢查下一格。':'';
   const confirm=document.querySelector('#pipes-confirm');confirm.disabled=!network.solved;confirm.textContent=network.solved?'啟動城市供暖 ⟶':'接通管線後啟動供暖';
   document.querySelector('#pipes-undo').disabled=!attempt.history.length;
   document.querySelector('#pipes-hint').disabled=attempt.hint===hints.length;
   document.querySelector('#pipes-hint-text').textContent=attempt.hint?hints.slice(0,attempt.hint).join(' '):'';
  };
  board.addEventListener('click',event=>{const button=event.target.closest('[data-pipe]');if(!button)return;attempt.history.push([...attempt.rotations]);if(attempt.history.length>50)attempt.history.shift();attempt.rotations[Number(button.dataset.pipe)]++;playCue('click');update();});
  board.addEventListener('keydown',event=>{const button=event.target.closest('[data-pipe]');const step={ArrowUp:-3,ArrowDown:3,ArrowLeft:-1,ArrowRight:1}[event.key];if(!button||!step)return;event.preventDefault();const from=pipeTiles[Number(button.dataset.pipe)].at;for(let at=from+step;at>=0&&at<9;at+=step){if(Math.abs(step)===1&&Math.floor(at/3)!==Math.floor(from/3))break;const next=pipeTiles.findIndex(tile=>tile.at===at);if(next>=0){board.querySelector('[data-pipe="'+next+'"]').focus();break;}}});
  document.querySelector('#pipes-undo').onclick=()=>{if(attempt.history.length){attempt.rotations=attempt.history.pop();update();}};
  document.querySelector('#pipes-reset').onclick=()=>{attempt.rotations=[...initialPipeRotations];attempt.history=[];update();};
  document.querySelector('#pipes-hint').onclick=()=>{attempt.hint=Math.min(hints.length,attempt.hint+1);update();};
  document.querySelector('#pipes-confirm').onclick=()=>{if(pipeIsSolved(attempt.rotations))done();};
  update();return;
 }
 if(id==='crypt'){
  const glyphs=['☾','♧','◇','✦'];const sequence=[0,2,1,3,0];let position=0,playing=false,token=0;
  const draw=()=>{show('死寂中的五次心跳','INTERACTIVE SEAL · 符印記憶','<p class="challenge-help">觀察玻璃棺依序亮起的五個符印，然後照順序重現。記住光的節奏。</p><div class="rune-board">'+glyphs.map((g,i)=>'<button class="rune-key" data-rune="'+i+'" aria-label="符印 '+g+'" '+(playing?'disabled':'')+'>'+g+'</button>').join('')+'</div><p class="challenge-feedback" role="status">已重現 '+position+' / 5 次符印。</p><button id="rune-replay" class="primary-button">觀看符印閃爍 ⟶</button>');document.querySelectorAll('[data-rune]').forEach(b=>b.onclick=()=>{if(playing)return;const n=Number(b.dataset.rune);if(n!==sequence[position]){position=0;playCue('wrong');draw();feedback('記憶碎裂了。再觀看一次符印的順序。');return;}position++;playCue('click');if(position===sequence.length){done();return;}draw();});document.querySelector('#rune-replay').onclick=()=>{if(playing)return;playing=true;draw();const current=++token;sequence.forEach((value,i)=>setTimeout(()=>{if(current!==token||!document.querySelector('[data-challenge="crypt"]'))return;const el=document.querySelector('[data-rune="'+value+'"]');el?.classList.add('illuminated');setTimeout(()=>el?.classList.remove('illuminated'),330);if(i===sequence.length-1)setTimeout(()=>{playing=false;if(document.querySelector('[data-challenge="crypt"]'))draw();},390);},i*560+160));};};
  draw();return;
 }
 if(id==='queen'){
  const faces=['♕','❀','♧','☾','❀','☾','♕','♧'],artwork=['vial','feather','apple','key','feather','key','vial','apple'];let revealed=[],matched=new Set(),locked=false;
  const draw=()=>{show('王后遺落的記憶','INTERACTIVE SEAL · 記憶配對','<p class="challenge-help">翻開八張舊日的記憶卡。找出四組相同的印記，拼湊王后的證詞。</p><div class="memory-board">'+faces.map((g,i)=>'<button data-memory="'+i+'" class="memory-card '+(revealed.includes(i)||matched.has(i)?'turned':'')+'" aria-label="第'+(i+1)+'張記憶卡'+(revealed.includes(i)||matched.has(i)?'，'+conceptArt[artwork[i]].label:'，尚未翻開')+'">'+(revealed.includes(i)||matched.has(i)?conceptMarkup(artwork[i],{decorative:true})+'<span class="memory-symbol">'+g+'</span>':'?')+'</button>').join('')+'</div><p class="challenge-feedback" role="status">已復原 '+matched.size/2+' / 4 組記憶。</p>');
   document.querySelectorAll('[data-memory]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.memory);if(locked||matched.has(i)||revealed.includes(i))return;revealed.push(i);playCue('click');draw();if(revealed.length!==2)return;const [a,c]=revealed;if(faces[a]===faces[c]){matched.add(a);matched.add(c);revealed=[];if(matched.size===8){done();return;}draw();}else{locked=true;setTimeout(()=>{locked=false;revealed=[];if(document.querySelector('[data-challenge="queen"]'))draw();},690);}});
  };draw();return;
 }
 if(id==='mirror'){
  const left=[true,false,false,true,true,true,false,true];let right=[false,false,true,false,false,false,false,true];
  const draw=()=>{show('鏡面中的另一個自己','INTERACTIVE SEAL · 對稱推理','<p class="challenge-help">左側是無法修改的真相，右側是鏡中謊言。點亮或熄滅右邊的格子，使每一列都成為左右對稱的鏡像。</p><div class="reflection-board">'+Array.from({length:16},(_,i)=>{const row=Math.floor(i/4),col=i%4,k=row*2+(col<2?col:col-2),lit=col<2?left[k]:right[k];return '<button class="reflection-cell '+(lit?'glow':'')+' '+(col<2?'fixed':'')+'" data-reflection="'+(col>=2?k:-1)+'" '+(col<2?'disabled aria-label="真實側固定符文"':'aria-label="鏡中第'+(row+1)+'列第'+(col-1)+'格"')+'>'+ (lit?'✦':'·') +'</button>';}).join('')+'</div><p class="challenge-feedback" role="status">右側必須映照出左側的每一道光。</p>');
   document.querySelectorAll('[data-reflection]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.reflection);if(i<0)return;right[i]=!right[i];playCue('click');if(glassIsSolved(left,right)){done();return;}draw();});
  };draw();return;
 }
 success();
}