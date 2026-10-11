// The mirror interrogation (魔鏡審問) page. The rules live in engine/rules.js (judgeInterrogation);
// this module only draws the statement, the word bank, and the feedback for a judgement.
import {clueWords,clueGroups} from '../data/clues.js';
import {judgeInterrogation} from '../engine/rules.js';

const label=word=>clueWords[word]?.label||'';

// Puzzle mode says how many blanks are wrong; story mode also marks which ones.
export function interrogationNotice(count,story){
 if(count>=3)return '妳的陳述仍被謊言包圍。'+(story?'標記的格子需要重新考慮。':'');
 if(count===2)return '還有兩個謊言。'+(story?'標記的格子需要重新考慮。':'');
 if(count===1)return '還有一個謊言。'+(story?'標記的格子需要重新考慮。':'');
 return '';
}

// The next blank the mirror may fill in: the first one that is empty or wrong. Blanks in a
// `set` receive the words they still lack. Returns null when every blank is correct.
export function hintFill(spec,answers){
 const {wrong}=judgeInterrogation(spec,answers);
 if(!wrong.length)return null;
 const index=wrong[0],blank=spec.blanks[index];
 if(!blank.set)return {index,word:blank.answer};
 const sameSet=spec.blanks.map((item,i)=>i).filter(i=>spec.blanks[i].set===blank.set);
 const needed=sameSet.map(i=>spec.blanks[i].answer);
 for(const i of sameSet)if(i!==index){const k=needed.indexOf(answers[i]);if(k>=0)needed.splice(k,1);}
 return {index,word:needed[0]};
}

// The first empty blank at or after `from`, wrapping around; the current blank if all are full.
export function nextEmpty(answers,from){
 for(let step=1;step<=answers.length;step++){
  const i=(from+step)%answers.length;
  if(!answers[i])return i;
 }
 return from;
}

export function interrogationPage({spec,words,answers,selected,story,wrong=[],notice='',confirming=false}){
 const statement=spec.template.map(part=>{
  if(typeof part==='string')return '<span>'+part+'</span>';
  const word=answers[part]?label(answers[part]):'';
  const classes=['interrogation-blank',part===selected?'selected':'',story&&wrong.includes(part)?'wrong':''].join(' ').replace(/\s+/g,' ').trim();
  return '<button class="'+classes+'" data-blank="'+part+'" aria-pressed="'+(part===selected)+'" aria-label="第'+(part+1)+'格，'+(word?'目前填入「'+word+'」':'尚未填入')+'">'+(word||'　')+'</button>';
 }).join('');
 const groups=Object.keys(clueGroups).map(group=>{
  const list=words.filter(id=>clueWords[id]?.group===group);
  if(!list.length)return '';
  return '<div class="bank-group"><h4>'+clueGroups[group]+'</h4><div class="bank-words">'+list.map(id=>'<button class="bank-word" data-word="'+id+'" aria-label="'+label(id)+'（'+clueGroups[group]+'）">'+label(id)+'</button>').join('')+'</div></div>';
 }).join('');
 const complete=answers.every(Boolean);
 return '<div class="interrogation"><p class="modal-note">點選一格，再點選線索詞填入。全部填滿後才能向魔鏡陳述。</p><p class="interrogation-statement" aria-label="審問陳述">'+statement+'</p>'
  +(words.length?'<fieldset class="interrogation-bank"><legend>推理簿中的線索詞</legend>'+groups+'</fieldset>':'<p class="modal-note">推理簿還沒有線索詞。先檢視場景中的線索，它們會自動收進推理簿。</p>')
  +'<p id="feedback" class="puzzle-feedback" role="status">'+notice+'</p>'
  +'<div class="interrogation-actions"><button id="interrogation-submit" class="primary-button" '+(complete&&words.length?'':'disabled')+'>向魔鏡陳述 ⟶</button>'
  +(confirming
   ?'<p class="interrogation-confirm">要讓魔鏡替妳說出一格答案嗎？</p><button id="interrogation-fill-yes" class="secondary-button">確定，填入一格</button><button id="interrogation-fill-no" class="text-button">再想想</button>'
   :'<button id="interrogation-fill" class="secondary-button">魔鏡替妳填一格</button>')
  +'</div></div>';
}
