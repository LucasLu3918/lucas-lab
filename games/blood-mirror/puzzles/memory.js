// "The queen's lost memories": eight cards — four of her memories and four objects. A memory never names
// its object; the player pairs each memory with the object it describes (plan r7), which restores one line
// of her testimony. Two memories, or two objects, never match.
import {conceptMarkup,conceptArt} from '../concept-art.js';

const memories={
 vial:'讓人只會沉睡、不會死去的藥。',
 feather:'縫進妳的枕頭裡，替妳擋住惡夢。',
 apple:'紅得像血的那一口，不是毒殺。',
 key:'伊蓮的房間，她一直留著能打開它的東西。'
};
const fragments={
 vial:'藥瓶：她把國王給的毒藥，換成了只會讓人沉睡的藥。',
 feather:'白羽：她在妳的枕頭裡縫進羽毛，替妳擋住惡夢。',
 apple:'蘋果：「那不是毒殺，是一把鑰匙。」',
 key:'鑰匙：她一直留著伊蓮房間的鑰匙，等妳長大。'
};
export const memoryCards=[
 {kind:'object',pair:'vial'},{kind:'memory',pair:'apple'},{kind:'memory',pair:'feather'},{kind:'object',pair:'key'},
 {kind:'memory',pair:'vial'},{kind:'object',pair:'feather'},{kind:'object',pair:'apple'},{kind:'memory',pair:'key'}
];
// A memory and the object it describes.
export const cardsMatch=(a,b,cards=memoryCards)=>a!==b&&cards[a].pair===cards[b].pair&&cards[a].kind!==cards[b].kind;

export function mountMemory(ctx){
 let revealed=[],matched=new Set(),locked=false;
 const face=i=>{const card=memoryCards[i];return card.kind==='object'?conceptMarkup(card.pair,{decorative:true})+'<span class="memory-symbol">'+conceptArt[card.pair].label+'</span>':'<span class="memory-text">'+memories[card.pair]+'</span>';};
 const label=i=>{const card=memoryCards[i];return card.kind==='object'?'物件：'+conceptArt[card.pair].label:'記憶：'+memories[card.pair];};
 const draw=()=>{
  ctx.render('<p class="challenge-help">翻開八張舊日的卡片：四張是王后的記憶，四張是物件。記憶不會說出物件的名字——把每段記憶和它說的那件物件配成一對，就拼回一段王后的證詞。</p><div class="memory-board">'+memoryCards.map((card,i)=>{const open=revealed.includes(i)||matched.has(i);return '<button data-memory="'+i+'" class="memory-card'+(open?' turned':'')+(open&&card.kind==='memory'?' memory-note':'')+'" aria-label="第'+(i+1)+'張卡'+(open?'，'+label(i):'，尚未翻開')+'">'+(open?face(i):'?')+'</button>';}).join('')+'</div><p class="challenge-feedback" role="status">已復原 '+matched.size/2+' / 4 段記憶。</p>'+(matched.size?'<ul class="memory-fragments">'+[...new Set([...matched].map(i=>memoryCards[i].pair))].map(a=>'<li>'+fragments[a]+'</li>').join('')+'</ul>':''));
  document.querySelectorAll('[data-memory]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.memory);
   if(locked||matched.has(i)||revealed.includes(i))return;
   revealed.push(i);ctx.playCue('click');draw();
   if(revealed.length!==2)return;
   const [a,c]=revealed;
   if(cardsMatch(a,c)){
    matched.add(a);matched.add(c);revealed=[];
    if(matched.size===memoryCards.length){ctx.done();return;}
    draw();
   }else{
    locked=true;
    // Long enough to read a memory card before it turns back.
    setTimeout(()=>{locked=false;revealed=[];if(document.querySelector('[data-challenge="queen"]'))draw();},1400);
   }
  });
 };
 draw();
}
