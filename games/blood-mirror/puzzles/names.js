// The seven names (七個名字), second stage of act "mine". Seven miners lost their names to the ledger;
// the dormitory testimonies fix exactly one order of the seven beds. Native <select> controls double
// as the keyboard / screen-reader mode.
export const miners=['奈菈','魯恩','赫索','莫格','奇妲','斐恩','提米'];
// bedAnswer[i] is the miner in bed i (index into `miners`), bed 0 being the one nearest the furnace.
export const bedAnswer=[4,1,3,2,0,5,6];
// Testimonies. `at`: miner a sleeps in bed `at`; `next`: miner a sleeps directly left of miner b;
// `right`: miner a sleeps somewhere to the right of miner b.
export const bedClues=[
 {kind:'at',a:2,at:3,text:'牆上的炭筆字：「赫索睡在正中間那張床，這樣誰夜裡咳嗽他都聽得見。」'},
 {kind:'at',a:6,at:6,text:'提燈下的便條：「提米最小，睡在離門最近的最後一張。」'},
 {kind:'next',a:2,b:0,text:'奈菈說：「我就睡在赫索的右手邊，他伸手就能搆到我。」'},
 {kind:'next',a:3,b:2,text:'莫格說：「我的床緊貼在赫索的左邊。」'},
 {kind:'next',a:1,b:3,text:'魯恩說：「我在莫格的左邊，中間沒隔任何人。」'},
 {kind:'right',a:5,b:0,text:'斐恩說：「我睡在奈菈的右邊，比她更靠近門。」'}
];

const holds=(clue,arrangement)=>{
 const at=miner=>arrangement.indexOf(miner);
 if(clue.kind==='at')return at(clue.a)===clue.at;
 if(clue.kind==='next')return at(clue.b)-at(clue.a)===1;
 return at(clue.a)>at(clue.b);
};
export const bedsSatisfy=arrangement=>bedClues.every(clue=>holds(clue,arrangement));
// The first testimony a full arrangement breaks (index into bedClues), or -1 (plan r3).
export const brokenBedClue=arrangement=>bedClues.findIndex(clue=>!holds(clue,arrangement));
// The miners are offered in this fixed order, which is deliberately not the solution order.
export const minerOrder=[2,6,0,3,5,1,4];

// Every ordering that satisfies all testimonies (exactly one is expected; tests assert it).
export function bedSolutions(){
 const found=[];
 const walk=(rest,chosen)=>{
  if(!rest.length){if(bedsSatisfy(chosen))found.push([...chosen]);return;}
  rest.forEach((miner,i)=>walk([...rest.slice(0,i),...rest.slice(i+1)],[...chosen,miner]));
 };
 walk(miners.map((_,i)=>i),[]);
 return found;
}
export const namesSolved=picks=>picks.length===bedAnswer.length&&picks.every((miner,i)=>miner===bedAnswer[i]);

export function mountNames(ctx){
 let picks=bedAnswer.map(()=>-1),message='';
 const draw=()=>{
  ctx.render('<p class="challenge-help">七張床鋪排成一列，床頭的木牌都被刮掉了。依宿舍裡留下的證詞，把七個名字放回各自的床位。證詞全是真話。</p><ol class="mask-clues">'
   +bedClues.map(clue=>'<li>'+clue.text+'</li>').join('')
   +'</ol><div class="mask-board">'
   +bedAnswer.map((_,i)=>'<label class="mask-row"><span class="mask-slot">'+(i+1)+'</span><span class="mask-name">第'+(i+1)+'床</span><select data-bed="'+i+'" aria-label="從爐火數起第'+(i+1)+'張床是誰"><option value="-1">未選擇</option>'
    +minerOrder.map(m=>'<option value="'+m+'"'+(picks[i]===m?' selected':'')+'>'+miners[m]+'</option>').join('')+'</select></label>').join('')
   +'</div><p class="challenge-feedback" role="status">'+message+'</p><button id="names-confirm" class="primary-button">把名字刻回床頭 ⟶</button><button id="names-reset" class="secondary-button">全部重選</button>');
  document.querySelectorAll('[data-bed]').forEach(select=>select.onchange=()=>{picks[Number(select.dataset.bed)]=Number(select.value);message='';});
  document.querySelector('#names-reset').onclick=()=>{picks=bedAnswer.map(()=>-1);message='';draw();};
  document.querySelector('#names-confirm').onclick=()=>{
   if(picks.some(miner=>miner<0)){message='還有床位沒有刻上名字。';draw();return;}
   if(new Set(picks).size<picks.length){message='同一個人不可能睡在兩張床上。';ctx.playCue('wrong');draw();return;}
   if(namesSolved(picks)){ctx.done();return;}
   const broken=brokenBedClue(picks);
   message='木牌微微發燙又冷卻——第 '+(broken+1)+' 則證詞說不通：'+bedClues[broken].text;
   ctx.playCue('wrong');draw();
  };
 };
 draw();
}
