// The weighing hall (稱量廳, 鏡淵 E7). Four things sit on the scales: an apple, a mirror, a rose and a dagger. The ledger
// pages show balanced scales with no numbers on the things themselves; the player works out what each one weighs.
//   scale-fruit  apple and mirror, from two balanced scales, then a third scale to balance with apples
//   scale-thorn  rose and dagger, the same way, balanced with roses
//   scale-final  needs all four weights: five mirrors and two roses on the left, and the right pan takes exactly six
//                pieces of apple, mirror and dagger
// A pan item is {sym, n} (n things) or {lb} (an iron weight of known pounds). The rules are pure and checked by search in
// scripts/blood-mirror-abyss.test.mjs; the mount below only draws them.
import {hintMarkup,bindHints} from './belfry-hints.js';

export const WEIGHTS={apple:2,mirror:3,rose:5,dagger:7};
export const NAMES={apple:'蘋果',mirror:'鏡',rose:'玫瑰',dagger:'匕首'};
export const MAX=12;                           // no thing weighs more than this many pounds
const item=(sym,n=1)=>({sym,n}),lb=pounds=>({lb:pounds});

const FRUIT_KNOWN=[
 {left:[item('apple',3)],right:[item('mirror',2)]},
 {left:[item('apple'),item('mirror')],right:[lb(5)]}
];
const THORN_KNOWN=[
 {left:[item('dagger')],right:[item('rose'),lb(2)]},
 {left:[item('rose',2),item('dagger')],right:[lb(17)]}
];
export const STAGES={
 fruit:{unknowns:['apple','mirror'],known:FRUIT_KNOWN,ask:{left:[item('mirror',4)],allowed:['apple'],total:null}},
 thorn:{unknowns:['rose','dagger'],known:THORN_KNOWN,ask:{left:[item('dagger',5)],allowed:['rose'],total:null}},
 // The last scale rests on what the first two taught, so the earlier balances count as known too.
 final:{unknowns:['apple','mirror','rose','dagger'],known:[...FRUIT_KNOWN,...THORN_KNOWN],ask:{left:[item('mirror',5),item('rose',2)],allowed:['apple','mirror','dagger'],total:6}}
};

export const weightOf=(items,weights)=>items.reduce((sum,it)=>sum+(it.lb!==undefined?it.lb:it.n*weights[it.sym]),0);
export const balanced=(scale,weights)=>weightOf(scale.left,weights)===weightOf(scale.right,weights);
// Every assignment of whole pounds (1 to MAX) to the unknowns that makes all the known scales balance.
export function solveWeights(stage){
 const found=[];
 const walk=(i,weights)=>{
  if(i===stage.unknowns.length){if(stage.known.every(scale=>balanced(scale,weights)))found.push({...weights});return;}
  for(let w=1;w<=MAX;w++)walk(i+1,{...weights,[stage.unknowns[i]]:w});
 };
 walk(0,{});
 return found;
}
// Does a right pan, as counts per thing, balance the open scale? Returns '' when it does, else why not.
export function judge(stage,counts){
 const ask=stage.ask,used=Object.entries(counts).filter(([,n])=>n>0);
 if(used.some(([sym])=>!ask.allowed.includes(sym)))return 'thing';
 const total=used.reduce((sum,[,n])=>sum+n,0);
 if(ask.total!==null&&total!==ask.total)return 'total';
 const right=used.reduce((sum,[sym,n])=>sum+n*WEIGHTS[sym],0);
 return right===weightOf(ask.left,WEIGHTS)?'':'weight';
}
// Every right pan (counts per allowed thing, up to MAX each) that balances the open scale under the true weights.
export function solveAsk(stage){
 const found=[];
 const walk=(i,counts)=>{
  if(i===stage.ask.allowed.length){if(judge(stage,counts)==='')found.push({...counts});return;}
  for(let n=0;n<=MAX;n++)walk(i+1,{...counts,[stage.ask.allowed[i]]:n});
 };
 walk(0,{});
 return found;
}

// --- hints ---------------------------------------------------------------------------------------------------------
export const HINTS={
 fruit:[
  '先看第一台：三個蘋果和兩面鏡一樣重。再看第二台：一個蘋果加一面鏡是 5 磅。',
  '蘋果和鏡的重量比是 2：3（三個蘋果＝兩面鏡）。比是 2：3、加起來是 5 的兩個數，只有一組。',
  '蘋果 2 磅，鏡 3 磅。左盤四面鏡是 12 磅，右盤要放 6 個蘋果。'
 ],
 thorn:[
  '第一台告訴妳匕首比玫瑰重 2 磅。第二台是兩朵玫瑰加一把匕首，一共 17 磅。',
  '把匕首換成「玫瑰加 2 磅」：兩朵玫瑰加一把匕首，就是三朵玫瑰加 2 磅，等於 17 磅。',
  '玫瑰 5 磅，匕首 7 磅。左盤五把匕首是 35 磅，右盤要放 7 朵玫瑰。'
 ],
 final:[
  '最後一台的左盤是五面鏡加兩朵玫瑰。先用前兩道的結果算出它有多重，再想右盤那六件怎麼湊。',
  '左盤：五面鏡 15 磅，加兩朵玫瑰 10 磅，共 25 磅。右盤剛好六件，只能用蘋果（2 磅）、鏡（3 磅）、匕首（7 磅）。',
  '右盤放 1 個蘋果、3 面鏡、2 把匕首：2＋9＋14＝25，一共 6 件。'
 ]
};
export const hintStep=name=>name;

// --- drawing -------------------------------------------------------------------------------------------------------
// The four things on the scales are painted (assets/puzzles/scale-icons.webp, one 128 px cell each, in this order); the sym-* class is
// only a name for the picture. The iron weights are a painted block with the number on it (scale-weight.webp, see .scale-lb).
const ICON_ORDER=['apple','mirror','rose','dagger'],ICON_CELL=128,ICON_ATLAS='assets/puzzles/scale-icons.webp';
export const iconSvg=sym=>'<svg class="scale-sym sym-'+sym+'" viewBox="'+ICON_ORDER.indexOf(sym)*ICON_CELL+' 0 '+ICON_CELL+' '+ICON_CELL+'" aria-hidden="true"><image href="'+ICON_ATLAS+'" width="'+ICON_ORDER.length*ICON_CELL+'" height="'+ICON_CELL+'"/></svg>';
const itemHtml=it=>it.lb!==undefined
 ?'<span class="scale-lb" aria-label="'+it.lb+' 磅的鐵砝碼">'+it.lb+' 磅</span>'
 :Array.from({length:it.n},()=>iconSvg(it.sym)).join('');
const speak=items=>items.map(it=>it.lb!==undefined?it.lb+' 磅的鐵砝碼':it.n+' 個'+NAMES[it.sym]).join('加');
const panHtml=items=>'<span class="scale-pan">'+items.map(itemHtml).join('')+'</span>';
const balanceHtml=scale=>'<li class="scale-row" aria-label="左盤'+speak(scale.left)+'，右盤'+speak(scale.right)+'，剛好平衡">'+panHtml(scale.left)+'<span class="scale-eq" aria-hidden="true">＝</span>'+panHtml(scale.right)+'</li>';

// ctx = { render(html), done(), playCue(kind) }
function mountScale(ctx,name,intro){
 const stage=STAGES[name],still=document.body.classList.contains('reduce-motion');
 const counts=Object.fromEntries(stage.ask.allowed.map(sym=>[sym,0]));
 let finishing=false;
 const ask=stage.ask;
 // The first two stages show their own pages; the last keeps the earlier pages behind a fold, so the player can look back.
 const pages='<ul class="scale-pages" aria-label="帳頁上平衡的天秤">'+stage.known.map(balanceHtml).join('')+'</ul>';
 ctx.render('<div class="belfry scales"><p class="challenge-help">'+intro+'</p>'
  +(name==='final'?'<details class="scale-recall"><summary>翻回前兩頁帳頁</summary>'+pages+'</details>':pages)
  +'<p id="sc-status" class="belfry-status" role="status"></p>'
  +'<div class="scale-open"><b class="choir-label">還沒配平的一台</b><div class="scale-row open"><span class="scale-pan">'+ask.left.map(itemHtml).join('')+'</span><span class="scale-eq" aria-hidden="true">＝</span><span id="sc-right" class="scale-pan scale-right"></span></div></div>'
  +'<div id="sc-steppers" class="scale-steppers" role="group" aria-label="右盤要放的東西"></div>'
  +'<button id="sc-go" class="primary-button">放上天秤</button>'
  +hintMarkup+'</div>');
 const $=id=>document.getElementById(id),box=$('sc-steppers');
 const alive=()=>box.isConnected;
 const say=(text,tone='')=>{const el=$('sc-status');el.textContent=text;el.dataset.tone=tone;};
 const hints=bindHints({hints:HINTS[name],currentStep:()=>finishing?null:hintStep(name),alive});
 hints.changed();
 function draw(){
  $('sc-right').innerHTML=ask.allowed.map(sym=>Array.from({length:counts[sym]},()=>iconSvg(sym)).join('')).join('');
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  box.textContent='';
  for(const sym of ask.allowed){
   const row=document.createElement('div');row.className='scale-stepper';
   row.innerHTML=iconSvg(sym)+'<b>'+NAMES[sym]+'</b>'
    +'<button class="choir-step" data-sym="'+sym+'" data-dir="-1" aria-label="少放一個'+NAMES[sym]+'">－</button>'
    +'<output aria-label="'+NAMES[sym]+'放了 '+counts[sym]+' 個">'+counts[sym]+'</output>'
    +'<button class="choir-step" data-sym="'+sym+'" data-dir="1" aria-label="多放一個'+NAMES[sym]+'">＋</button>';
   box.appendChild(row);
  }
  box.insertAdjacentHTML('beforeend','<p class="belfry-note">'+(ask.total!==null?'右盤要放剛好 '+ask.total+' 件，現在 '+total+' 件。':'右盤現在放了 '+total+' 件。')+'</p>');
  box.querySelectorAll('.choir-step').forEach(button=>button.onclick=()=>{
   if(finishing)return;
   const sym=button.dataset.sym,next=counts[sym]+ +button.dataset.dir;
   if(next<0||next>MAX)return;
   counts[sym]=next;ctx.playCue('click');say('');draw();hints.changed();
  });
 }
 $('sc-go').onclick=()=>{
  if(finishing)return;
  const result=judge(stage,counts);
  if(result===''){
   finishing=true;say('天秤輕輕一沉，又穩穩停在中央。','ok');ctx.playCue('door');
   setTimeout(()=>{if(alive())ctx.done();},still?0:700);
  }else if(result==='total')say('右盤要剛好放 '+ask.total+' 件。','bad');
  else say('天秤沒有平衡。','bad');
  hints.changed();
 };
 draw();
}
export const mountScaleFruit=ctx=>mountScale(ctx,'fruit','帳頁上畫著兩台已經平衡的天秤，上面只有蘋果和鏡，沒有任何數字。用它們算出一個蘋果和一面鏡各多重，再配平下面那一台，右盤只能放蘋果。');
export const mountScaleThorn=ctx=>mountScale(ctx,'thorn','這一頁是玫瑰和匕首。兩台平衡的天秤，加上一些已經知道重量的鐵砝碼。算出玫瑰和匕首各多重，再配平下面那一台，右盤只能放玫瑰。');
export const mountScaleFinal=ctx=>mountScale(ctx,'final','最後一台天秤的左盤是五面鏡加兩朵玫瑰。用前兩頁算出的四個重量，在右盤擺出平衡：右盤剛好放六件，只能用蘋果、鏡和匕首。');
