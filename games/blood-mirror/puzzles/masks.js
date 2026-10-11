// The masked guests (面具賓客), act "ballroom". Six guests stand in a row, each behind a different mask.
// The testimonies pin down exactly one arrangement; the player assigns a guest to every mask.
// Keyboard and screen readers get native <select> controls, which is also the plan's alternative mode.
export const maskNames=['銀狐','黑天鵝','白鹿','紅玫瑰','烏鴉','金蝶'];
export const guests=['公爵夫人','伊萊','奧瑞恩王子','薇菈王后','外國使節','宮廷總管'];
// The one valid arrangement: maskAnswer[i] is the guest behind mask i (indexes into `guests`).
export const maskAnswer=[0,1,2,3,4,5];

// Testimonies. Position 0 is the leftmost mask. `at`: guest stands at a position; `next`: guest a stands
// immediately left of guest b; `right`: guest a stands somewhere to the right of guest b.
export const maskClues=[
 {kind:'at',a:0,at:0,text:'公爵夫人說：「我站在隊伍的最左邊。」'},
 {kind:'at',a:5,at:5,text:'宮廷總管說：「我守著最右邊，看著每個人的背影。」'},
 {kind:'next',a:0,b:1,text:'伊萊低聲說：「我緊貼在公爵夫人的右邊，戴著黑手套的手沒有鬆開。」'},
 {kind:'next',a:2,b:3,text:'王子說：「我站在王后的正左邊，離她只有一步。」'},
 {kind:'right',a:4,b:3,text:'外國使節說：「我站在王后的右邊，離王座比她更遠。」'}
];

const holds=(clue,arrangement)=>{
 const at=guest=>arrangement.indexOf(guest);
 if(clue.kind==='at')return at(clue.a)===clue.at;
 if(clue.kind==='next')return at(clue.b)-at(clue.a)===1;
 return at(clue.a)>at(clue.b);
};
export const satisfiesClues=arrangement=>maskClues.every(clue=>holds(clue,arrangement));

// Every permutation that satisfies all testimonies (exactly one is expected; tests assert it).
export function maskSolutions(){
 const found=[];
 const walk=(rest,chosen)=>{
  if(!rest.length){if(satisfiesClues(chosen))found.push([...chosen]);return;}
  rest.forEach((guest,i)=>walk([...rest.slice(0,i),...rest.slice(i+1)],[...chosen,guest]));
 };
 walk(guests.map((_,i)=>i),[]);
 return found;
}
export const masksSolved=picks=>picks.length===maskAnswer.length&&picks.every((guest,i)=>guest===maskAnswer[i]);

export function mountMasks(ctx){
 let picks=maskAnswer.map(()=>-1),message='';
 const draw=()=>{
  ctx.render('<p class="challenge-help">六位賓客排成一列，每人臉上都戴著不同的面具。依他們的證詞，替每一張面具填上正確的人。證詞全是真話。</p><ol class="mask-clues">'
   +maskClues.map(clue=>'<li>'+clue.text+'</li>').join('')
   +'</ol><div class="mask-board">'
   +maskNames.map((name,i)=>'<label class="mask-row"><span class="mask-slot">'+(i+1)+'</span><span class="mask-name">'+name+'</span><select data-mask="'+i+'" aria-label="從左數第'+(i+1)+'張面具「'+name+'」是誰"><option value="-1">未選擇</option>'
    +guests.map((guest,g)=>'<option value="'+g+'"'+(picks[i]===g?' selected':'')+'>'+guest+'</option>').join('')+'</select></label>').join('')
   +'</div><p class="challenge-feedback" role="status">'+message+'</p><button id="masks-confirm" class="primary-button">向賓客們確認 ⟶</button><button id="masks-reset" class="secondary-button">全部重選</button>');
  document.querySelectorAll('[data-mask]').forEach(select=>select.onchange=()=>{picks[Number(select.dataset.mask)]=Number(select.value);message='';});
  document.querySelector('#masks-reset').onclick=()=>{picks=maskAnswer.map(()=>-1);message='';draw();};
  document.querySelector('#masks-confirm').onclick=()=>{
   if(picks.some(guest=>guest<0)){message='還有面具沒有選人。';draw();return;}
   if(new Set(picks).size<picks.length){message='同一個人不可能同時戴著兩張面具。';ctx.playCue('wrong');draw();return;}
   if(masksSolved(picks)){ctx.done();return;}
   const correct=picks.filter((guest,i)=>guest===maskAnswer[i]).length;
   message='賓客們搖了搖頭——目前有 '+correct+' / 6 張面具對上了人。再核對一次證詞。';
   ctx.playCue('wrong');draw();
  };
 };
 draw();
}
