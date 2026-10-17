// E3 毒蘋果調配室 (the queen's apothecary), three mechanisms: who holds the poisoned apple (testimony), measuring the
// revival draught (one-way vessels), and tinting it (colour matching through a hand mirror). Rules, solvers and hints
// are pure functions so scripts/blood-mirror-abyss.test.mjs can check them exhaustively; the mount* functions only draw.
// The rules mirror plan-improve/prototypes/e3-apothecary.html, which e3-apothecary.solve.cjs checks the same way.
import {bindHints,hintMarkup} from './belfry-hints.js';
import {ensureMaterials} from './materials.js';

// Seven original apprentices of the queen (when she was still the palace physician); names are herbs. The canon miners
// are victims and companions of the heroine, never suspects. Cards: plan-improve/expert-dialogue-draft.md section 2.
export const APPRENTICES=['白芷','遠志','決明','茯苓','紫蘇','杜仲','甘松'];
export const CARD_LINES=['「每一味藥我都抄過，不會錯。」','「我記得那天的每一件事，只是不想說。」','「我看不清，但我聽得很清楚。」','「不是我。我只管磨藥。」','「我替大家說，反正我們說的一樣。」','「我只搬東西，不問裡面是什麼。」','「他們要我怎麼說，我就怎麼說。」'];
export const CULPRIT=6;

// ---- A. Everyone tells the truth except the apprentice holding the poisoned apple.
// Found by prototypes/e3-testimony.gen.cjs (seed 7): only 甘松 is consistent, one statement refutes at most two apprentices,
// at least five statements are needed to single him out, and four are the only refutation of someone. His own (7th) is false.
export const TESTIMONY=[{k:'not',s:[0]},{k:'in',s:[2,3,5,6]},{k:'in',s:[0,1,4,5,6]},{k:'in',s:[0,1,2,6]},{k:'not',s:[3]},{k:'not',s:[2,4,5]},{k:'in',s:[0,2,3,4,5]}];
const names=list=>list.map(i=>APPRENTICES[i]).join('、');
export function say(statement){
 if(statement.k==='not')return '毒蘋果不在'+names(statement.s)+'手上。';
 if(statement.k==='in')return '毒蘋果在'+names(statement.s)+'其中一人手上。';
 return statement.v?'拿著毒蘋果的人，編號是單數。':'拿著毒蘋果的人，編號是雙數。';
}
export function holds(statement,p){
 if(statement.k==='not')return !statement.s.includes(p);
 if(statement.k==='in')return statement.s.includes(p);
 return (p%2===0)===statement.v; // numbers are 1-based: index 0 is number 1, an odd one
}
const ALL=[0,1,2,3,4,5,6];
// Statements contradicted if the poison were with p: the holder must lie, everyone else must tell the truth.
export const conflicts=p=>ALL.filter(i=>holds(TESTIMONY[i],p)!==(i!==p));
export const candidates=()=>ALL.filter(p=>conflicts(p).length===0);
// The one statement a wrong guess is told about (the lowest-numbered), never the whole list.
export const firstConflict=p=>conflicts(p)[0];
export const refutedBy=i=>ALL.filter(p=>conflicts(p).includes(i));

// ---- B. Three vessels (8, 5, 3), pipes pour one way round the ring A>C, C>B, B>A. Goal: B holds exactly 4.
export const CAP=[8,5,3],TUBES=[[0,2],[2,1],[1,0]],START=[8,0,0],VESSEL_NAMES='ABC';
export function pour(state,tube){
 const [from,to]=TUBES[tube],amount=Math.min(state[from],CAP[to]-state[to]);
 if(!amount)return null;
 const next=[...state];next[from]-=amount;next[to]+=amount;return next;
}
export const goalB=state=>state[1]===4;
// Breadth-first search to the goal: the pipes to open in order, or null when this position is a dead end.
export function shortest(from){
 const key=s=>s.join(','),prev=new Map([[key(from),null]]),queue=[from];
 for(let i=0;i<queue.length;i++){
  const state=queue[i];
  if(goalB(state)){const path=[];let k=key(state);while(prev.get(k)){path.push(prev.get(k).tube);k=prev.get(k).from;}return path.reverse();}
  for(let tube=0;tube<3;tube++){const next=pour(state,tube);if(!next)continue;const k=key(next);if(!prev.has(k)){prev.set(k,{from:key(state),tube});queue.push(next);}}
 }
 return null;
}

// ---- C. Drops (0..4 each) of red, yellow and blue; the average colour must match the recipe.
export const BASE={R:[210,43,43],Y:[232,200,50],B:[43,75,210]},TARGET=[1,1,4],TOL=8,MAXDROP=4;
export const MARKS={R:'▲',Y:'◆',B:'■'},TARGET_WORDS='偏紫的藍灰，偏暗';
export const mixColor=(r,y,b)=>{const n=r+y+b;return n?[0,1,2].map(i=>(r*BASE.R[i]+y*BASE.Y[i]+b*BASE.B[i])/n):[16,16,24];};
export const colorDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
export const colorOk=drops=>drops.some(Boolean)&&colorDist(mixColor(...drops),mixColor(...TARGET))<=TOL;
// What the mix is missing, in words and no numbers: a shift shared by all channels is "brighter/darker", otherwise the
// channel furthest from the recipe. Pigments carry a shape as well as a colour so the colours are never the only cue.
export function dirWord(drops){
 if(!drops.some(Boolean))return '還沒有加色精。';
 if(colorOk(drops))return '顏色吻合。';
 const want=mixColor(...TARGET),cur=mixColor(...drops),diff=[0,1,2].map(i=>want[i]-cur[i]);
 const mean=(diff[0]+diff[1]+diff[2])/3,dev=diff.map(v=>v-mean),k=dev.reduce((best,v,i)=>Math.abs(v)>Math.abs(dev[best])?i:best,0);
 if(Math.abs(mean)>=Math.abs(dev[k]))return mean>0?'整體還要再亮一點。':'整體還要再暗一點。';
 return ['紅','綠','藍'][k]+(dev[k]>0?'的成分還不夠。':'的成分太多了。');
}
export const closeWord=dist=>dist<28?'很接近了，差一點點。':dist<60?'有點接近，比例還不對。':'還差很多。';

// ---- Hints: three tiers (where to look, the rule, the answer), computed from the board as it is now.
export const HINTS={
 A(holder=CULPRIT,ruled=[]){
  const open=ALL.filter(q=>q!==holder&&!ruled.includes(q)),q=open[0];
  const why=q===undefined?'你已經劃掉了其他六個人，剩下的'+APPRENTICES[holder]+'就是答案。檢查：他說的「'+say(TESTIMONY[holder])+'」是不是謊話？'
   :(i=>i===q?APPRENTICES[q]+'若拿著毒蘋果，他就該是說謊的人，但他說的「'+say(TESTIMONY[i])+'」是真的，所以不可能。'
    :'假設'+APPRENTICES[q]+'拿著毒蘋果：'+APPRENTICES[i]+'說「'+say(TESTIMONY[i])+'」，這句就說不通（而'+APPRENTICES[i]+'必須說實話）。')(firstConflict(q))+'像這樣把不可能的人一個個排除。';
  return [
   '規則：除了拿著毒蘋果的人，其他六個人說的都是實話；拿著的人說的是謊話。逐一假設某個人拿著毒蘋果，檢查證詞會不會自相矛盾，排除的人用「劃掉」記下來。',
   why,
   '拿著毒蘋果的是'+APPRENTICES[holder]+'（編號 '+(holder+1)+'）。'];
 },
 B(state){
  const path=shortest(state);
  if(!path){const dead='這條倒法已經走進死路，按「復原」退一步，或「重來」。';return [dead,dead,dead];}
  if(!path.length)return Array(3).fill('B 杯已經剛好 4 了。');
  const [from,to]=TUBES[path[0]];
  return [
   '目標是讓 B 杯剛好有 4。管子只能照箭頭單向倒：A→C→B→A。每次倒到來源空了或目的地滿了才停。',
   '下一步要從 '+VESSEL_NAMES[from]+' 杯倒出去。',
   '把 '+VESSEL_NAMES[from]+' 杯倒向 '+VESSEL_NAMES[to]+' 杯（再按一次提示會從新的盤面重算）。'];
 },
 C(drops){
  return [
   '右邊那一塊是隔著綠色玻璃看的，顏色是歪的。按「舉起手持鏡」才能看到配方真正的顏色，再拿它和瓶子裡的比。',
   '配方色是'+TARGET_WORDS+'。'+dirWord(drops)+'（藍色最多，紅和黃各只加一點點。）',
   '紅 '+TARGET[0]+' 滴、黃 '+TARGET[1]+' 滴、藍 '+TARGET[2]+' 滴。'];
 }
};

// ---- Drawing
const GOALS={
 'apothecary-testimony':{title:'七個人的證詞',goal:'七名藥房學徒各拿著一顆蘋果，其中一顆是毒蘋果（會把人的意識送進鏡子）。除了拿著毒蘋果的人，其他六個人說的都是實話。點「指認」說出你認為有毒的那一顆；如果說不通，會指出一句與他矛盾的證詞。想排除的人可以先「劃掉」。證詞是鏡中的反寫字，按「舉起手持鏡」才能正著讀。'},
 'apothecary-vessels':{title:'回魂藥要剛好 4',goal:'要調出回魂藥（讓意識從鏡中回到身體），B 杯需要剛好 4 單位的蘋果汁。三個杯子容量 8、5、3，一開始 A 杯是滿的。管子只能照箭頭單向倒：A→C→B→A。點一條管子，就把來源杯倒向目的杯，倒到來源空了或目的杯滿了才停。倒錯了可以復原，不計步數。'},
 'apothecary-mixing':{title:'調出配方的顏色',goal:'回魂藥要調成配方的顏色。每種色精可以加 0–4 滴，瓶子是它們的平均色。配方色隔著綠色玻璃看會歪掉；按「舉起手持鏡」才看得到真正的顏色。顏色夠接近時瓶子會發亮。'}
};
const shell=(stageId,body,includeStatus=true)=>'<div class="belfry apothecary"><p class="challenge-help"><b>'+GOALS[stageId].title+'。</b>'+GOALS[stageId].goal+'</p>'
 +(includeStatus?'<p id="bf-status" class="belfry-status" role="status"></p>':'')+body+hintMarkup+'</div>';
const reduced=()=>document.body.classList.contains('reduce-motion');
const handlers=(el,act)=>{el.onclick=act;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act();}};};

// ctx = { render(html), done(), playCue(kind) }
export function mountApothecaryTestimony(ctx){
 let mirror=false,finished=false,message='還沒有指認。',tone='';const ruled=new Set();
 let statusEl=null,islandRoot=null,box=null,hints=null;
 const say2=(text,nextTone='')=>{message=text;tone=nextTone;if(statusEl){statusEl.textContent=text;statusEl.dataset.tone=nextTone;}};
 const snapshot=()=>({apprentices:[...APPRENTICES],cardLines:[...CARD_LINES],testimonies:TESTIMONY.map(item=>say(item)),mirror,ruled:[...ruled],finished,message,tone});
 const tiers=new Proxy({},{get:()=>HINTS.A(CULPRIT,[...ruled])});
 const bindTestimonyHints=()=>{hints=bindHints({hints:tiers,currentStep:()=>finished?null:'accuse',alive:()=>islandRoot?.isConnected||box?.isConnected||false});};
 if(typeof ctx.mountPuzzleIsland==='function'){
  ctx.render(shell('apothecary-testimony','<div data-vue-apothecary-testimony><p class="challenge-feedback" role="status">七人證詞載入中…</p></div>',false));
  islandRoot=document.querySelector('[data-vue-apothecary-testimony]');
  bindTestimonyHints();
  say2('還沒有指認。');
  const act=change=>{
   if(change?.type==='toggle-mirror'){
    mirror=!mirror;ctx.playCue('click');
   }else if(change?.type==='toggle-strike'&&!finished&&Number.isInteger(change.index)&&change.index>=0&&change.index<APPRENTICES.length){
    ruled.has(change.index)?ruled.delete(change.index):ruled.add(change.index);
    ctx.playCue('click');hints.changed();
   }else if(change?.type==='accuse'&&!finished&&Number.isInteger(change.index)&&change.index>=0&&change.index<APPRENTICES.length){
    const p=change.index,c=conflicts(p);
    if(!c.length){
     finished=true;say2('全部說得通：只有'+APPRENTICES[p]+'說了謊，毒蘋果在他手上。','ok');hints.changed();
     ctx.playCue('door');setTimeout(()=>{if(islandRoot?.isConnected)ctx.done();},reduced()?0:900);
    }else{
     const i=firstConflict(p);
     say2(i===p?'不是'+APPRENTICES[p]+'：如果是他拿著毒蘋果，他就該是說謊的人，但他說的「'+say(TESTIMONY[i])+'」是真的。'
      :'不是'+APPRENTICES[p]+'：如果是他，'+APPRENTICES[i]+'說的「'+say(TESTIMONY[i])+'」就會是謊話，但'+APPRENTICES[i]+'不該說謊。','bad');
     ctx.playCue('wrong');hints.changed();
    }
   }
   return snapshot();
  };
  ctx.mountPuzzleIsland({snapshot:snapshot(),onAction:act});
  return;
 }
 ctx.render(shell('apothecary-testimony','<div class="belfry-row"><button id="apo-mirror" class="secondary-button" aria-pressed="false">舉起手持鏡</button><span class="apo-note">證詞原本是反寫的鏡中字</span></div>'
  +'<div class="apo-cards" id="apo-cards">'+APPRENTICES.map((name,i)=>'<div class="apo-card" data-card="'+i+'">'
   +'<svg viewBox="0 0 128 128" aria-hidden="true"><image href="assets/puzzles/scale-icons.webp" width="640" height="128"/></svg>'
   +'<b>'+(i+1)+'　'+name+'</b><span class="apo-card-line">'+CARD_LINES[i]+'</span>'
   +'<span class="apo-say" role="text" aria-label="'+name+'的證詞：'+say(TESTIMONY[i])+'">「'+say(TESTIMONY[i])+'」</span>'
   +'<span class="apo-acts"><button class="secondary-button" data-accuse="'+i+'" aria-label="指認'+name+'拿著毒蘋果">指認</button><button class="secondary-button" data-strike="'+i+'" aria-pressed="false" aria-label="劃掉'+name+'（記下他不是）">劃掉</button></span></div>').join('')+'</div>'));
 const $=id=>document.getElementById(id);box=$('apo-cards');statusEl=$('bf-status');const alive=()=>box.isConnected;
 bindTestimonyHints();
 box.classList.add('apo-mirrored');
 $('apo-mirror').onclick=e=>{mirror=!mirror;e.currentTarget.setAttribute('aria-pressed',String(mirror));box.classList.toggle('apo-mirrored',!mirror);ctx.playCue('click');};
 box.querySelectorAll('[data-strike]').forEach(button=>button.onclick=()=>{
  if(finished)return;
  const i=+button.dataset.strike,on=!ruled.has(i);
  on?ruled.add(i):ruled.delete(i);
  button.setAttribute('aria-pressed',String(on));box.querySelector('[data-card="'+i+'"]').classList.toggle('struck',on);
  ctx.playCue('click');hints.changed();
 });
 box.querySelectorAll('[data-accuse]').forEach(button=>button.onclick=()=>{
  if(finished)return;
  const p=+button.dataset.accuse,c=conflicts(p);
  if(!c.length){
   finished=true;
   say2('全部說得通：只有'+APPRENTICES[p]+'說了謊，毒蘋果在他手上。','ok');hints.changed();
   ctx.playCue('door');
   setTimeout(()=>{if(alive())ctx.done();},reduced()?0:900);
   return;
  }
  const i=firstConflict(p);
  say2(i===p?'不是'+APPRENTICES[p]+'：如果是他拿著毒蘋果，他就該是說謊的人，但他說的「'+say(TESTIMONY[i])+'」是真的。'
   :'不是'+APPRENTICES[p]+'：如果是他，'+APPRENTICES[i]+'說的「'+say(TESTIMONY[i])+'」就會是謊話，但'+APPRENTICES[i]+'不該說謊。','bad');
  ctx.playCue('wrong');hints.changed();
 });
 say2('還沒有指認。');
}

export function mountApothecaryVessels(ctx){
 ensureMaterials();
 let vessels=[...START],history=[],finished=false;
 ctx.render(shell('apothecary-vessels','<div class="belfry-board apo-board"><svg id="apo-svg" class="belfry-svg" viewBox="0 -34 275 150" role="group" aria-label="三個杯子與單向管線"></svg></div>'
  +'<div class="belfry-row"><button id="apo-undo" class="secondary-button">復原</button><button id="apo-restart" class="secondary-button">重來</button><span id="apo-moves" class="apo-note"></span></div>'));
 const $=id=>document.getElementById(id),svg=$('apo-svg'),alive=()=>svg.isConnected;
 const say2=(text,tone='')=>{const el=$('bf-status');el.textContent=text;el.dataset.tone=tone;};
 const tiers=new Proxy({},{get:()=>HINTS.B(vessels)});
 // A step is "the next pipe to open" so the tier starts again when the advice changes; a dead end is its own step.
 const hints=bindHints({hints:tiers,currentStep:()=>{if(finished)return null;const path=shortest(vessels);return path?'pipe-'+path[0]:'dead';},alive});
 function draw(focusTube){
  // Rows A, C, B in the pouring order; heights follow capacity; the bottoms line up.
  const X=[15,215,125],W=44,BOT=96,unit=70/8,top=i=>BOT-CAP[i]*unit;
  let s='<defs><marker id="apo-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7z" fill="#e0b84f"/></marker></defs>';
  for(let i=0;i<3;i++){
   const h=CAP[i]*unit,level=vessels[i]*unit;
   s+='<rect class="apo-shadow" x="'+(X[i]+2.5)+'" y="'+(top(i)+2.5)+'" width="'+W+'" height="'+(h+2)+'" rx="4"/>'
    +'<rect class="apo-glass-back" x="'+X[i]+'" y="'+top(i)+'" width="'+W+'" height="'+h+'" rx="4"/>'
    +'<rect class="apo-liquid" x="'+(X[i]+1.6)+'" y="'+(BOT-level)+'" width="'+(W-3.2)+'" height="'+level+'"/>'
    +(level>0?'<rect class="apo-surface" x="'+(X[i]+1.6)+'" y="'+(BOT-level)+'" width="'+(W-3.2)+'" height="1.6"/>':'')
    +'<rect class="apo-glass" x="'+X[i]+'" y="'+top(i)+'" width="'+W+'" height="'+h+'" rx="4"/>'
    +'<rect class="apo-glint" x="'+(X[i]+5)+'" y="'+(top(i)+5)+'" width="4" height="'+Math.max(h-10,4)+'" rx="2"/>'
    +'<rect class="apo-base" x="'+(X[i]-3)+'" y="'+BOT+'" width="'+(W+6)+'" height="5" rx="2"/>'
    +'<text x="'+(X[i]+W/2)+'" y="'+(BOT+13)+'" text-anchor="middle" font-size="9.5" fill="#e9dcc3">'+VESSEL_NAMES[i]+' 杯（容量 '+CAP[i]+'）</text>'
    +'<text x="'+(X[i]+W/2)+'" y="'+Math.min(BOT-level-4,BOT-6)+'" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">'+vessels[i]+'</text>';
  }
  // A>C and C>B run straight; B>A arches over the top.
  const geo=[{d:'M'+(X[0]+W+4)+' 62L'+(X[2]-6)+' 62',lx:(X[0]+W+X[2])/2-1,ly:54},{d:'M'+(X[2]+W+4)+' 72L'+(X[1]-6)+' 72',lx:(X[2]+W+X[1])/2,ly:64},{d:'M'+(X[1]+W/2)+' '+(top(1)-4)+'C'+(X[1]+W/2)+' -26 '+(X[0]+W/2)+' -26 '+(X[0]+W/2)+' '+(top(0)-6),lx:(X[0]+X[1])/2+W/2,ly:-23}];
  TUBES.forEach(([from,to],tube)=>{
   const ok=!finished&&!!pour(vessels,tube),g=geo[tube];
   s+='<g class="apo-tube'+(ok?'':' off')+'" data-tube="'+tube+'" tabindex="'+(ok?0:-1)+'" role="button" aria-label="把 '+VESSEL_NAMES[from]+' 杯倒向 '+VESSEL_NAMES[to]+' 杯"'+(ok?'':' aria-disabled="true"')+'>'
    +'<path d="'+g.d+'" fill="none" stroke="#e0b84f" stroke-width="3" marker-end="url(#apo-arrow)"/><path d="'+g.d+'" fill="none" stroke="transparent" stroke-width="22"/>'
    +'<text x="'+g.lx+'" y="'+g.ly+'" text-anchor="middle" font-size="9.5" font-weight="700" fill="#e0b84f">'+VESSEL_NAMES[from]+'→'+VESSEL_NAMES[to]+'</text></g>';
  });
  svg.innerHTML=s;
  svg.querySelectorAll('[data-tube]').forEach(g=>handlers(g,()=>act(+g.dataset.tube)));
  if(focusTube!==undefined)svg.querySelector('[data-tube="'+focusTube+'"]')?.focus({preventScroll:true});
  $('apo-moves').textContent='已倒 '+history.length+' 次';
 }
 function refresh(){
  if(goalB(vessels)){
   finished=true;draw();
   say2('B 杯剛好 4：蘋果汁的原液取得了。','ok');hints.changed();
   ctx.playCue('door');
   setTimeout(()=>{if(alive())ctx.done();},reduced()?0:900);
   return;
  }
  say2('A '+vessels[0]+'　B '+vessels[1]+'　C '+vessels[2]+'　目標：B 杯 = 4');
  hints.changed();
 }
 function act(tube){
  if(finished)return;
  const next=pour(vessels,tube);if(!next)return;
  history.push(vessels);vessels=next;ctx.playCue('click');draw(tube);refresh();
 }
 $('apo-undo').onclick=()=>{if(finished||!history.length)return;vessels=history.pop();draw();refresh();};
 $('apo-restart').onclick=()=>{if(finished)return;vessels=[...START];history=[];draw();refresh();};
 draw();refresh();
}

export function mountApothecaryMixing(ctx){
 const drops=[0,0,0];let mirror=false,finished=false;
 const rows=[['紅','R'],['黃','Y'],['藍','B']];
 ctx.render(shell('apothecary-mixing','<div class="apo-mixer"><div class="apo-swatch glass" id="apo-ref"><span></span></div><div class="apo-swatch" id="apo-mix"><span>你的瓶子</span></div></div>'
  +'<div class="belfry-row"><button id="apo-mirror" class="secondary-button" aria-pressed="false">舉起手持鏡</button><span class="apo-note">看配方真正的顏色</span></div>'
  +'<div class="apo-drops">'+rows.map(([name,key],i)=>'<div class="apo-drop"><b class="apo-pigment-'+key+'">'+MARKS[key]+name+'色精</b><button class="secondary-button" data-drop="'+i+'" data-step="-1" aria-label="'+name+'減一滴">−</button><span id="apo-dv'+i+'" class="apo-count" role="status"></span><button class="secondary-button" data-drop="'+i+'" data-step="1" aria-label="'+name+'加一滴">＋</button></div>').join('')+'</div>'
  +'<p id="apo-close" class="apo-note"></p><p id="apo-dir" class="apo-note"></p>'));
 const $=id=>document.getElementById(id),ref=$('apo-ref'),alive=()=>ref.isConnected;
 const say2=(text,tone='')=>{const el=$('bf-status');el.textContent=text;el.dataset.tone=tone;};
 const tiers=new Proxy({},{get:()=>HINTS.C(drops)});
 const hints=bindHints({hints:tiers,currentStep:()=>finished?null:'mix',alive});
 function draw(){
  const want=mixColor(...TARGET),cur=mixColor(...drops),dist=colorDist(want,cur),ok=colorOk(drops),any=drops.some(Boolean);
  // The recipe seen through the green glass is skewed; the hand mirror shows the true colour and says it in words too.
  ref.style.background='rgb('+want.map(Math.round)+')';ref.classList.toggle('glass',!mirror);
  ref.querySelector('span').textContent=mirror?'配方色（手持鏡裡的真色）：'+TARGET_WORDS:'配方色（隔著綠玻璃）';
  ref.setAttribute('aria-label','配方色：'+TARGET_WORDS);
  const mix=$('apo-mix');mix.style.background='rgb('+cur.map(Math.round)+')';mix.classList.toggle('lit',ok);
  drops.forEach((v,i)=>{$('apo-dv'+i).textContent=v+' 滴';});
  $('apo-close').textContent=!any?'還沒有加色精。':ok?'顏色吻合！':closeWord(dist);
  $('apo-dir').textContent=ok||!any?'':dirWord(drops);
 }
 function update(){
  draw();
  if(colorOk(drops)){
   finished=true;
   say2('顏色吻合：回魂藥調好了。','ok');hints.changed();
   ctx.playCue('door');
   setTimeout(()=>{if(alive())ctx.done();},reduced()?0:900);
   return;
  }
  say2('調色中……');hints.changed();
 }
 $('apo-mirror').onclick=e=>{mirror=!mirror;e.currentTarget.setAttribute('aria-pressed',String(mirror));ctx.playCue('click');draw();};
 document.querySelectorAll('[data-drop]').forEach(button=>button.onclick=()=>{
  if(finished)return;
  const i=+button.dataset.drop;
  drops[i]=Math.max(0,Math.min(MAXDROP,drops[i]+(+button.dataset.step)));
  ctx.playCue('click');update();
 });
 update();
}
