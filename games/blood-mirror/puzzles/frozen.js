// The three frozen moments (凝結的三刻, 鏡淵 E8). A ball stopped mid-glass-break; the ledger lists what witnesses remember. The
// guests are drawn from data (mask shape and tone, cuff colour, place in the line), so a clue can never disagree with the
// picture the way a generated image could.
//   frozen-faces  two guests as a warm-up, then six in a row: seven remembered facts fix who stands where
//   frozen-order  three pictures of the same six guests, one swap apart: put them in time order
//   frozen-final  needs both: name who held the goblet in each moment, in time order
// A clue is {t, a, b?, attr?, val?} over guest ids. Everything here is pure data and search; the mount only draws it.
import {hintMarkup,bindHints} from './belfry-hints.js';
import {ensureMaterials} from './materials.js';

export const NAMES={duke:'公爵',countess:'伯爵夫人',doctor:'醫師',musician:'樂師',maid:'侍女',hunter:'獵人'};
export const MASK_NAME={tri:'三角',round:'圓形',beak:'鳥喙'};
export const TONE_NAME={red:'紅',gold:'金',black:'黑'};
export const CUFF_NAME={white:'白',black:'黑'};
const ATTR_TEXT={mask:v=>MASK_NAME[v]+'面具',tone:v=>TONE_NAME[v]+'色面具',cuff:v=>CUFF_NAME[v]+'袖口'};

const FIG=(mask,tone,cuff)=>({mask,tone,cuff});
// Slot order is left to right as the frame shows them. The first face of each pair is told apart from its twin by one thing only.
export const STAGES={
 warm:{
  figures:[FIG('round','gold','white'),FIG('tri','red','black')],
  guests:['duke','countess'],
  clues:[{t:'has',a:'countess',attr:'mask',val:'tri'},{t:'left',a:'duke',b:'countess'}],
  truth:['duke','countess']
 },
 faces:{
  figures:[FIG('tri','red','white'),FIG('round','gold','black'),FIG('beak','black','white'),FIG('tri','gold','black'),FIG('round','red','white'),FIG('beak','red','black')],
  guests:['duke','countess','doctor','musician','maid','hunter'],
  clues:[
   {t:'next',a:'duke',b:'doctor'},
   {t:'left',a:'duke',b:'countess'},
   {t:'has',a:'countess',attr:'mask',val:'tri'},
   {t:'has',a:'doctor',attr:'tone',val:'red'},
   {t:'next',a:'countess',b:'hunter'},
   {t:'left',a:'countess',b:'musician'},
   {t:'left',a:'countess',b:'hunter'}
  ],
  truth:['doctor','duke','maid','countess','hunter','musician']
 }
};

// --- the three moments -----------------------------------------------------------------------------------------------
// FIGURES[i] is the same person in every picture; ROSTER[i] is who they are (the answer of frozen-faces).
export const FIGURES=STAGES.faces.figures;
export const ROSTER=STAGES.faces.truth;
// Who stands in each place (left to right) at each moment, as figure numbers. Moments are in true time order; the ledger
// shows them shuffled as 甲 乙 丙.
export const MOMENTS=[[1,0,2,3,4,5],[1,0,5,3,4,2],[1,3,5,0,4,2]];
export const HOLDERS=[2,0,4];            // the figure holding the goblet at each moment; the last one drops it
export const FRAME_ORDER=[2,0,1];        // frame 甲 shows moment 3, 乙 moment 1, 丙 moment 2
export const FRAME_LABEL=['甲','乙','丙'];
export const FRAMES=FRAME_ORDER.map((m,i)=>({label:FRAME_LABEL[i],slots:MOMENTS[m],holder:HOLDERS[m]}));
const sameLine=(a,b)=>a.filter((x,i)=>x!==b[i]).length;
const slotOf=(frame,fig)=>FRAMES[frame].slots.indexOf(fig);
// An order is [first,second,third] as frame numbers.
export const ORDER_RULES=[
  {text:'從一刻到下一刻，只有一對賓客換了位置，其他人都沒動。',holds:o=>sameLine(FRAMES[o[0]].slots,FRAMES[o[1]].slots)===2&&sameLine(FRAMES[o[1]].slots,FRAMES[o[2]].slots)===2},
  {text:'戴金色三角面具的賓客，一開始站的位置比最後一刻更靠右。',holds:o=>slotOf(o[0],3)>slotOf(o[2],3)}
];
export const orderSolve=(skip=-1)=>permutations([0,1,2]).filter(o=>ORDER_RULES.every((r,i)=>i===skip||r.holds(o)));
// '' = right; 'blank' = a place is empty or a frame is used twice; a number = the first rule (1-based) that does not hold.
export function orderJudge(order){
 if(order.some(v=>v===''||v===null||v===undefined)||new Set(order).size!==order.length)return 'blank';
 const bad=ORDER_RULES.findIndex(r=>!r.holds(order.map(Number)));
 return bad<0?'':bad+1;
}
// The three holders' names in time order, for the one true order.
export const finalAnswer=()=>orderSolve()[0].map(f=>ROSTER[FRAMES[f].holder]);
export function finalJudge(names){
 if(names.some(n=>!n)||names.length!==3)return 'blank';
 return names.every((n,i)=>n===finalAnswer()[i])?'':'wrong';
}

export function clueText(c){
 const n=id=>NAMES[id];
 switch(c.t){
  case 'has':return n(c.a)+'戴的是'+ATTR_TEXT[c.attr](c.val)+'。';
  case 'not':return n(c.a)+'戴的不是'+ATTR_TEXT[c.attr](c.val)+'。';
  case 'left':return n(c.a)+'站在'+n(c.b)+'的左邊（不一定相鄰）。';
  case 'next':return n(c.a)+'和'+n(c.b)+'緊緊相鄰。';
 }
}
// order[slot] = guest id placed there. Does the clue hold for that line-up?
export function holds(stage,c,order){
 const at=id=>order.indexOf(id);
 switch(c.t){
  case 'has':return stage.figures[at(c.a)][c.attr]===c.val;
  case 'not':return stage.figures[at(c.a)][c.attr]!==c.val;
  case 'left':return at(c.a)<at(c.b);
  case 'next':return Math.abs(at(c.a)-at(c.b))===1;
 }
}
const permutations=list=>list.length<2?[list]:list.flatMap((x,i)=>permutations([...list.slice(0,i),...list.slice(i+1)]).map(rest=>[x,...rest]));
// Every line-up of the guests that satisfies every clue (or every clue except `skip`, for the necessity proof).
export function solve(stage,skip=-1){
 return permutations(stage.guests).filter(order=>stage.clues.every((c,i)=>i===skip||holds(stage,c,order)));
}
// '' = right; 'blank' = a place is empty or a guest is used twice; a number = the first clue (1-based) that does not hold.
export function judge(stage,order){
 if(order.some(g=>!g)||new Set(order).size!==order.length)return 'blank';
 const bad=stage.clues.findIndex(c=>!holds(stage,c,order));
 return bad<0?'':bad+1;
}

export const HINTS={
 warm:[
  '先讀兩條記憶：一條說伯爵夫人戴什麼面具，一條說誰在左邊。看畫面上兩個人的面具。',
  '伯爵夫人戴三角面具。畫面上只有一個人戴三角面具。',
  '左邊那位（1 號）是公爵，右邊那位（2 號）是伯爵夫人。'
 ],
 faces:[
  '先找只講面具的記憶（第 3、4 條）：它們能直接指出兩個人是誰。',
  '伯爵夫人戴三角面具，醫師戴紅色面具。紅色三角面具只有一位，她是誰要看醫師和伯爵夫人誰戴的是紅色三角。',
  '由左到右：醫師、公爵、侍女、伯爵夫人、獵人、樂師。'
 ]
};
HINTS.order=[
  '先比較三張畫面：兩張之間只換了一對賓客的，才能相鄰。找出哪一張是夾在中間的。',
  '甲和乙之間、乙和丙之間、甲和丙之間，比一比各有幾個人換了位置。差一對的才相鄰，差兩對的在兩端。',
  '中間是丙。兩端還要用最後一條記憶分：金色三角面具一開始比最後更靠右。順序是乙、丙、甲。'
];
HINTS.final=[
  '先用前面兩道的結果：時間先後排好，每張畫面裡握杯的人是誰，要看他的面具，再對上賓客名冊。',
  '順序是乙、丙、甲。乙裡握杯的是黑色鳥喙面具，丙裡是紅色三角，甲裡是紅色圓形面具。',
  '第一刻侍女，第二刻醫師，第三刻獵人。最後握著杯子的獵人，就是摔杯的人。'
];
export const hintStep=name=>name;

// --- drawing -------------------------------------------------------------------------------------------------------
const SLOT_W=76,SCENE_H=148;
// The guests are painted (assets/puzzles/frozen-guests.webp: 4 x 3 cells of 192 px). Cells 0-8 are the masked heads, three mask shapes
// by three tones (shape*3+tone); cells 9 and 10 are the velvet coat with white or black cuffs. Which painting a guest gets is still
// decided only by the data (mask, tone, cuff), so a clue and the picture cannot disagree.
const ATLAS='assets/puzzles/frozen-guests.webp',CELL=192,COLS=4,ROWS=3;
const SHAPE_AT={tri:0,round:1,beak:2},TONE_AT={red:0,gold:1,black:2},BODY_AT={white:9,black:10};
const part=(index,x,y,w,h)=>'<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="'+(index%COLS)*CELL+' '+Math.floor(index/COLS)*CELL+' '+CELL+' '+CELL
 +'" overflow="hidden" pointer-events="none"><image href="'+ATLAS+'" width="'+COLS*CELL+'" height="'+ROWS*CELL+'"/></svg>';
const GLASS='<path class="frz-glass" transform="translate(34 94) scale(1.5) translate(-30 -70)" d="M24 64 h12 l-2 11 q-4 4 -8 0 z M30 79 v6 M26 85 h8"/><path class="frz-wine" transform="translate(34 94) scale(1.5) translate(-30 -70)" d="M25.4 66.4 h9.2 l-1.2 7.6 q-3.4 3 -6.8 0 z"/>';
function figureSvg(fig,slot,glass){
 const x=slot*SLOT_W+SLOT_W/2;
 return '<g transform="translate('+x+' 0)">'
  +'<ellipse class="frz-cast" cx="1" cy="125" rx="25" ry="4"/>'
  +part(BODY_AT[fig.cuff],-38,43,76,76)
  +(glass?GLASS:'')
  +part(SHAPE_AT[fig.mask]*3+TONE_AT[fig.tone],-31,4,62,62)
  +'<circle class="frz-plate'+(glass?' frz-held':'')+'" cx="0" cy="138" r="8"/><text class="frz-num" x="0" y="142">'+(slot+1)+'</text>'
  +'</g>';
}
const describe=(fig,slot,glass)=>(slot+1)+' 號：'+MASK_NAME[fig.mask]+'的'+TONE_NAME[fig.tone]+'色面具，'+CUFF_NAME[fig.cuff]+'袖口'+(glass?'，手裡握著高腳杯':'');
// figures: the row to draw, left to right; holder: the slot that holds the goblet (or -1).
export const rowSvg=(figures,holder=-1)=>'<svg class="frz-scene" data-n="'+figures.length+'" viewBox="0 0 '+figures.length*SLOT_W+' '+SCENE_H+'" role="img" aria-label="'
 +figures.map((f,i)=>describe(f,i,i===holder)).join('；')+'"><rect class="frz-wall" x="0" y="0" width="'+figures.length*SLOT_W+'" height="126"/><rect class="frz-glow" x="0" y="0" width="'+figures.length*SLOT_W+'" height="126"/><image href="assets/puzzles/prism-floor.webp" x="0" y="124" width="'+figures.length*SLOT_W+'" height="24" preserveAspectRatio="xMidYMid slice" pointer-events="none"/><rect class="frz-floor" x="0" y="124" width="'+figures.length*SLOT_W+'" height="24"/>'
 +figures.map((f,i)=>figureSvg(f,i,i===holder)).join('')+'</svg>';
export const sceneSvg=stage=>rowSvg(stage.figures);
const frameHtml=(frame,withGlass)=>{
 const row=frame.slots.map(i=>FIGURES[i]);
 return '<figure class="frz-frame"><figcaption>'+frame.label+'</figcaption>'+rowSvg(row,withGlass?frame.slots.indexOf(frame.holder):-1)+'</figure>';
};
const figureWord=fig=>MASK_NAME[fig.mask]+'的'+TONE_NAME[fig.tone]+'色面具、'+CUFF_NAME[fig.cuff]+'袖口';
const selectHtml=(id,options,blank)=>'<select id="'+id+'"><option value="">'+blank+'</option>'+options.map(([v,t])=>'<option value="'+v+'">'+t+'</option>').join('')+'</select>';
const nameOptions=Object.keys(NAMES).map(g=>[g,NAMES[g]]);

// Shared chrome of the three mounts: a status line, one confirm button and the candle hints.
function frame(ctx,name,body,go){
 ensureMaterials();
 ctx.render('<div class="belfry frozen">'+body+'<p id="frz-status" class="belfry-status" role="status"></p><button id="frz-go" class="primary-button">就是這樣</button>'+hintMarkup+'</div>');
 const $=id=>document.getElementById(id),root=$('frz-go');
 const alive=()=>root.isConnected;
 const state={finishing:false};
 const say=(text,tone='')=>{const el=$('frz-status');el.textContent=text;el.dataset.tone=tone;};
 const hints=bindHints({hints:HINTS[name],currentStep:()=>state.finishing?null:hintStep(name),alive});
 hints.changed();
 root.onclick=()=>{if(!state.finishing)go(state,say,hints);hints.changed();};
 return {$,alive,say,hints,state};
}
const SETTLE=700;

// Guests in a row, to be named. level 'warm' is the two-guest warm-up; 'faces' the six.
function mountFaces(ctx,levels){
 const still=document.body.classList.contains('reduce-motion');
 let at=0;
 function draw(){
  const name=levels[at],stage=STAGES[name],last=at===levels.length-1,order=stage.figures.map(()=>'');
  const intro=name==='warm'
   ?'舞會停在這一瞬，兩位賓客戴著面具。照著證人的記憶，在每個位置選出是誰。'
   :'六位賓客站成一排，面具與袖口各不相同。證人只記得這幾件事。排出每個位置上的人。';
  const ui=frame(ctx,name,'<p class="challenge-help">'+intro+'</p>'
   +'<ol class="frz-clues" aria-label="證人記得的事">'+stage.clues.map(c=>'<li>'+clueText(c)+'</li>').join('')+'</ol>'
   +sceneSvg(stage)+'<div id="frz-slots" class="frz-slots">'+stage.figures.map((f,i)=>'<label class="frz-slot"><span>'+(i+1)+' 號</span>'+selectHtml('frz-slot-'+i,nameOptions.filter(([g])=>stage.guests.includes(g)),'？')+'</label>').join('')+'</div>',
   (state,say)=>{
    const result=judge(stage,order);
    if(result===''){
     state.finishing=true;ctx.playCue('door');
     say(last?'畫面裡的人終於動了一下，又靜止下來。':'兩個人對上了。再看一整排。','ok');
     setTimeout(()=>{if(!ui.alive())return;if(last)ctx.done();else{at++;draw();}},still?0:SETTLE);
    }else if(result==='blank')say('每個位置都要有人，而且一個人只能站一處。','bad');
    else say('第 '+result+' 條記憶說不通。','bad');
   });
  stage.figures.forEach((_,i)=>{const select=ui.$('frz-slot-'+i);select.onchange=()=>{if(ui.state.finishing)return;order[i]=select.value;ctx.playCue('click');ui.say('');ui.hints.changed();};});
 }
 draw();
}
export const mountFrozenFaces=ctx=>mountFaces(ctx,['warm','faces']);

// Three pictures in a shuffled order, to be put in time order.
export function mountFrozenOrder(ctx){
 const still=document.body.classList.contains('reduce-motion'),order=['','',''],moments=['第一刻','第二刻','第三刻'];
 const ui=frame(ctx,'order','<p class="challenge-help">同樣的六位賓客，被畫成三張。它們不是照時間掛的。把三張排成時間先後。</p>'
  +'<ol class="frz-clues" aria-label="證人記得的事">'+ORDER_RULES.map(r=>'<li>'+r.text+'</li>').join('')+'</ol>'
  +FRAMES.map(f=>frameHtml(f,false)).join('')
  +'<div class="frz-slots">'+moments.map((m,i)=>'<label class="frz-slot"><span>'+m+'</span>'+selectHtml('frz-ord-'+i,FRAME_LABEL.map(l=>[FRAME_LABEL.indexOf(l),l]),'？')+'</label>').join('')+'</div>',
  (state,say)=>{
   const result=orderJudge(order);
   if(result===''){
    state.finishing=true;ctx.playCue('door');say('三個時刻接在一起了。','ok');
    setTimeout(()=>{if(ui.alive())ctx.done();},still?0:SETTLE);
   }else if(result==='blank')say('每一刻都要選一張，而且一張只能用一次。','bad');
   else say('第 '+result+' 條記憶說不通。','bad');
  });
 moments.forEach((_,i)=>{const select=ui.$('frz-ord-'+i);select.onchange=()=>{if(ui.state.finishing)return;order[i]=select.value;ctx.playCue('click');ui.say('');ui.hints.changed();};});
}

// Who held the goblet at each moment: needs the names from the faces and the order from the three pictures.
export function mountFrozenFinal(ctx){
 const still=document.body.classList.contains('reduce-motion'),answer=['','',''],moments=['第一刻','第二刻','第三刻'];
 const roster='<details class="frz-recall"><summary>翻回賓客名冊與記憶</summary><ul class="frz-roster">'
  +FIGURES.map((f,i)=>'<li><b>'+NAMES[ROSTER[i]]+'</b>：'+figureWord(f)+'</li>').join('')+'</ul>'
  +'<ol class="frz-clues">'+ORDER_RULES.map(r=>'<li>'+r.text+'</li>').join('')+'</ol></details>';
 const ui=frame(ctx,'final','<p class="challenge-help">三張畫面裡，各有一人握著高腳杯。依照時間先後，填出每一刻握杯的人。最後握著杯子的人，就是摔杯的人。</p>'
  +roster+FRAMES.map(f=>frameHtml(f,true)).join('')
  +'<div class="frz-slots">'+moments.map((m,i)=>'<label class="frz-slot"><span>'+m+'握杯的人</span>'+selectHtml('frz-ans-'+i,nameOptions,'？')+'</label>').join('')+'</div>',
  (state,say)=>{
   const result=finalJudge(answer);
   if(result===''){
    state.finishing=true;ctx.playCue('door');say('杯子在最後一刻離了手，摔杯的是'+NAMES[answer[2]]+'。','ok');
    setTimeout(()=>{if(ui.alive())ctx.done();},still?0:SETTLE);
   }else if(result==='blank')say('三個時刻都要填一個人。','bad');
   else say('有一處對不上。','bad');
  });
 moments.forEach((_,i)=>{const select=ui.$('frz-ans-'+i);select.onchange=()=>{if(ui.state.finishing)return;answer[i]=select.value;ctx.playCue('click');ui.say('');ui.hints.changed();};});
}
