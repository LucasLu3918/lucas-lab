// "The queen's lost memories": eight cards, four pairs. Each pair restores one line of her testimony.
import {conceptMarkup,conceptArt} from '../concept-art.js';

const faces=['♕','❀','♧','☾','❀','☾','♕','♧'];
const artwork=['vial','feather','apple','key','feather','key','vial','apple'];
const fragments={
 vial:'藥瓶：她把國王給的毒藥，換成了只會讓人沉睡的藥。',
 feather:'白羽：她在妳的枕頭裡縫進羽毛，替妳擋住惡夢。',
 apple:'蘋果：「那不是毒殺，是一把鑰匙。」',
 key:'鑰匙：她一直留著伊蓮房間的鑰匙，等妳長大。'
};

export function mountMemory(ctx){
 let revealed=[],matched=new Set(),locked=false;
 const draw=()=>{
  ctx.render('<p class="challenge-help">翻開八張舊日的記憶卡。每找到一組相同的印記，就拼回一段王后的證詞。</p><div class="memory-board">'+faces.map((g,i)=>'<button data-memory="'+i+'" class="memory-card '+(revealed.includes(i)||matched.has(i)?'turned':'')+'" aria-label="第'+(i+1)+'張記憶卡'+(revealed.includes(i)||matched.has(i)?'，'+conceptArt[artwork[i]].label:'，尚未翻開')+'">'+(revealed.includes(i)||matched.has(i)?conceptMarkup(artwork[i],{decorative:true})+'<span class="memory-symbol">'+g+'</span>':'?')+'</button>').join('')+'</div><p class="challenge-feedback" role="status">已復原 '+matched.size/2+' / 4 組記憶。</p>'+(matched.size?'<ul class="memory-fragments">'+[...new Set([...matched].map(i=>artwork[i]))].map(a=>'<li>'+fragments[a]+'</li>').join('')+'</ul>':''));
  document.querySelectorAll('[data-memory]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.memory);
   if(locked||matched.has(i)||revealed.includes(i))return;
   revealed.push(i);ctx.playCue('click');draw();
   if(revealed.length!==2)return;
   const [a,c]=revealed;
   if(faces[a]===faces[c]){
    matched.add(a);matched.add(c);revealed=[];
    if(matched.size===8){ctx.done();return;}
    draw();
   }else{
    locked=true;
    setTimeout(()=>{locked=false;revealed=[];if(document.querySelector('[data-challenge="queen"]'))draw();},690);
   }
  });
 };
 draw();
}
