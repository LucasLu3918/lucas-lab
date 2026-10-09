// Five tactile puzzles complement the original story seals. No external dependencies.
const KEY='blood-mirror-challenges-v2';
const ids=['library','mine','crypt','queen','mirror'];
let volatile=new Set();
function stored(){try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return new Set(Array.isArray(value)?value.filter(x=>ids.includes(x)):[]);}catch{return new Set(volatile);}}
export function isChallengeComplete(id){return stored().has(id);}
export function resetChallenges(){volatile.clear();try{localStorage.removeItem(KEY);}catch{}}
function complete(id){const done=stored();done.add(id);volatile=new Set(done);try{localStorage.setItem(KEY,JSON.stringify([...done]));}catch{}}
export function puzzleIsSolved(order){return order.length===9&&order.every((v,i)=>v===i);}
export function pipeIsSolved(rotations){return rotations.length===5&&rotations.every(x=>x%4===0);}
export function glassIsSolved(left,right){return left.length===8&&right.length===8&&left.every((x,i)=>x===right[i^1]);}
export function startChallenge(id,{modal,success,playCue}){
 const done=()=>{complete(id);playCue('solve');success();};
 const show=(title,subtitle,html)=>{const active=document.activeElement;const attr=['data-pos','data-pipe','data-rune','data-memory','data-reflection'].find(k=>active?.hasAttribute(k));const selector=attr?'['+attr+'="'+active.getAttribute(attr)+'"]':null;modal(title,subtitle,'<div class="challenge" data-challenge="'+id+'">'+html+'</div>');if(selector)document.querySelector('.challenge '+selector)?.focus({preventScroll:true});};
 const feedback=(s)=>{const el=document.querySelector('.challenge-feedback');if(el)el.textContent=s;};
 if(id==='library'){
  const picture='assets/snow-white.webp';let tiles=[4,0,8,2,6,1,3,7,5],selected=-1;
  const draw=()=>{show('破碎的公主肖像','INTERACTIVE SEAL · 九格拼圖','<p class="challenge-help">鏡子打散了公主的面容。點選兩塊碎片交換位置，將畫像完整復原。</p><div class="tile-board">'+tiles.map((v,i)=>'<button class="picture-tile '+(i===selected?'selected':'')+'" data-pos="'+i+'" aria-label="第'+(i+1)+'格碎片，圖塊 '+(v+1)+'" aria-pressed="'+(i===selected)+'" style="background-image:url('+picture+');background-position:'+((v%3)*50)+'% '+(Math.floor(v/3)*50)+'%"></button>').join('')+'</div><p class="challenge-feedback" role="status">選取任意兩塊碎片進行交換。</p><button id="puzzle-reset" class="secondary-button">重新打散拼圖</button>');
   document.querySelectorAll('[data-pos]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.pos);if(selected<0){selected=i;draw();return;}if(selected===i){selected=-1;draw();return;}[tiles[i],tiles[selected]]=[tiles[selected],tiles[i]];selected=-1;if(puzzleIsSolved(tiles)){done();return;}playCue('click');draw();});
   document.querySelector('#puzzle-reset').onclick=()=>{tiles=[8,1,5,3,0,7,4,2,6];selected=-1;draw();};
  };draw();return;
 }
 if(id==='mine'){
  let rot=[1,3,2,1,2];const cells=[{at:3,s:'┗',name:'起點轉角'},{at:4,s:'━',name:'水平管'},{at:5,s:'┓',name:'右側轉角'},{at:8,s:'┃',name:'城市出口'},{at:7,s:'━',name:'回流管'}];
  const draw=()=>{show('重接銀骨蒸汽管','INTERACTIVE SEAL · 管線迴路','<p class="challenge-help">點按管線順時針旋轉 90°。讓每段刻有金紋的管線與灰色工程底圖方向吻合，重啟五個閥門。</p><div class="pipes-board">'+Array.from({length:9},(_,i)=>{const n=cells.findIndex(x=>x.at===i);return n<0?'<div class="pipe-empty">·</div>':'<button class="pipe-piece" data-pipe="'+n+'" aria-label="'+cells[n].name+'，目前旋轉'+(rot[n]*90)+'度"><span style="transform:rotate('+(rot[n]*90)+'deg)">'+cells[n].s+'</span><small>'+['泉','水','熱','城','返'][n]+'</small></button>';}).join('')+'</div><p class="challenge-feedback" role="status">旋轉連接管線，完成後會自動解鎖。</p><button id="pipes-hint" class="secondary-button">查看工程提示</button>');
   document.querySelectorAll('[data-pipe]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.pipe);rot[i]=(rot[i]+1)%4;playCue('click');if(pipeIsSolved(rot)){done();return;}draw();});document.querySelector('#pipes-hint').onclick=()=>feedback('工程藍圖朝北擺正時，五道金紋應回到水平與垂直的原始方向。');
  };draw();return;
 }
 if(id==='crypt'){
  const glyphs=['☾','♧','◇','✦'];const sequence=[0,2,1,3,0];let position=0,playing=false,token=0;
  const draw=()=>{show('死寂中的五次心跳','INTERACTIVE SEAL · 符印記憶','<p class="challenge-help">觀察玻璃棺依序亮起的五個符印，然後照順序重現。記住光的節奏。</p><div class="rune-board">'+glyphs.map((g,i)=>'<button class="rune-key" data-rune="'+i+'" aria-label="符印 '+g+'" '+(playing?'disabled':'')+'>'+g+'</button>').join('')+'</div><p class="challenge-feedback" role="status">已重現 '+position+' / 5 次符印。</p><button id="rune-replay" class="primary-button">觀看符印閃爍 ⟶</button>');document.querySelectorAll('[data-rune]').forEach(b=>b.onclick=()=>{if(playing)return;const n=Number(b.dataset.rune);if(n!==sequence[position]){position=0;playCue('wrong');draw();feedback('記憶碎裂了。再觀看一次符印的順序。');return;}position++;playCue('click');if(position===sequence.length){done();return;}draw();});document.querySelector('#rune-replay').onclick=()=>{if(playing)return;playing=true;draw();const current=++token;sequence.forEach((value,i)=>setTimeout(()=>{if(current!==token||!document.querySelector('[data-challenge="crypt"]'))return;const el=document.querySelector('[data-rune="'+value+'"]');el?.classList.add('illuminated');setTimeout(()=>el?.classList.remove('illuminated'),330);if(i===sequence.length-1)setTimeout(()=>{playing=false;if(document.querySelector('[data-challenge="crypt"]'))draw();},390);},i*560+160));};};
  draw();return;
 }
 if(id==='queen'){
  const faces=['♕','❀','♧','☾','❀','☾','♕','♧'];let revealed=[],matched=new Set(),locked=false;
  const draw=()=>{show('王后遺落的記憶','INTERACTIVE SEAL · 記憶配對','<p class="challenge-help">翻開八張舊日的記憶卡。找出四組相同的印記，拼湊王后的證詞。</p><div class="memory-board">'+faces.map((g,i)=>'<button data-memory="'+i+'" class="memory-card '+(revealed.includes(i)||matched.has(i)?'turned':'')+'" aria-label="第'+(i+1)+'張記憶卡">'+(revealed.includes(i)||matched.has(i)?g:'?')+'</button>').join('')+'</div><p class="challenge-feedback" role="status">已復原 '+matched.size/2+' / 4 組記憶。</p>');
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