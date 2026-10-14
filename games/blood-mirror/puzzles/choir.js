// The silent choir hall (失聲合唱廳, 鏡淵 E6). The organ makes no sound, so pitch is read from length: a longer pipe is lower,
// and the pitch is in inverse proportion to the length (half the length is an octave higher). Three mechanisms:
//   choir-pipes   a warm-up octave, then the chord whose pitches stand 4 : 5 : 6 (the pipes' lengths stand 15 : 12 : 10)
//   choir-rhythm  three voices, each repeating every 3, 4 or 6 beats; the player sets where each one starts so that their
//                 beats together make the pattern scratched on the score
//   choir-hymn    the two results meet: the slower the voice, the longer its pipe, so the player writes out which pipe
//                 opens on which beat
// The rules are pure and checked by search in scripts/blood-mirror-abyss.test.mjs; the mounts below only draw them.
import {hintMarkup,bindHints} from './belfry-hints.js';

// --- choir-pipes ---------------------------------------------------------------------------------------------------
export const PIPES=[6,8,9,10,12,15,20];       // lengths of the seven pipes
export const WARM_PIPES=[6,9,12];             // the warm-up shows three of them
// The higher pipe sounds twice as high as the lower one: its length is half.
export const isOctave=(a,b)=>Math.max(a,b)===2*Math.min(a,b);
// Pitches stand 4 : 5 : 6 when the lengths stand 15 : 12 : 10, that is 4a = 5b = 6c for the longest, middle and shortest.
export function isChord(lengths){
 if(lengths.length!==3)return false;
 const [a,b,c]=[...lengths].sort((x,y)=>y-x);
 return 4*a===5*b&&5*b===6*c;
}
// The lengths read the wrong way round (4 : 5 : 6) give pitches 15 : 12 : 10, which is a different chord.
export function isReversedChord(lengths){
 if(lengths.length!==3)return false;
 const [a,b,c]=[...lengths].sort((x,y)=>x-y);
 return 5*a===4*b&&6*a===4*c;
}
const subsets=(list,size)=>size===0?[[]]:list.flatMap((item,i)=>subsets(list.slice(i+1),size-1).map(rest=>[item,...rest]));
export const solveOctave=()=>subsets(WARM_PIPES,2).filter(pair=>isOctave(...pair));
export const solveChord=()=>subsets(PIPES,3).filter(isChord);
export const CHORD=[10,12,15];                // the answer, shortest (highest) first

// --- choir-rhythm --------------------------------------------------------------------------------------------------
export const VOICES=[{name:'高音聲部',period:3},{name:'中音聲部',period:4},{name:'低音聲部',period:6}];
export const BEATS=12;
export const OFFSETS=[1,2,3];                 // the answer: each voice starts on this beat (0 is the first)
export const hits=(voice,offset)=>Array.from({length:BEATS},(_,t)=>t%VOICES[voice].period===offset);
// The beats on which at least one voice sounds.
export const union=offsets=>Array.from({length:BEATS},(_,t)=>offsets.some((offset,voice)=>t%VOICES[voice].period===offset));
export const SCORE=union(OFFSETS);
export const rhythmSolved=offsets=>union(offsets).every((on,t)=>on===SCORE[t]);
export function solveRhythm(){
 const found=[];
 for(let a=0;a<VOICES[0].period;a++)for(let b=0;b<VOICES[1].period;b++)for(let c=0;c<VOICES[2].period;c++)if(rhythmSolved([a,b,c]))found.push([a,b,c]);
 return found;
}

// --- choir-hymn ----------------------------------------------------------------------------------------------------
export const HYMN_BEATS=10;
// The slower the voice, the longer its pipe: the 6-beat voice sings the 15-long pipe.
export const PIPE_OF_VOICE=[CHORD[0],CHORD[1],CHORD[2]];
// Which pipes open on beat t (0 is the first), as a list of lengths.
export const opens=t=>VOICES.flatMap((voice,i)=>t%voice.period===OFFSETS[i]?[PIPE_OF_VOICE[i]]:[]);
export const HYMN=Array.from({length:HYMN_BEATS},(_,t)=>opens(t));
// The first beat (0-based) on which a written score differs from the hymn, or null when it is right.
// `written` is a list of HYMN_BEATS lists of pipe lengths.
export function firstWrong(written){
 for(let t=0;t<HYMN_BEATS;t++){
  const mine=[...(written[t]||[])].sort((x,y)=>x-y).join(),right=[...HYMN[t]].sort((x,y)=>x-y).join();
  if(mine!==right)return t;
 }
 return null;
}

// --- hints ---------------------------------------------------------------------------------------------------------
const PITCH='管子越長，音越低，而且音高和管長成反比：管長減半，音高就高一倍。';
export const HINTS={
 warm:[
  '八度是「高一倍」的音。先看看哪兩根管，一根剛好是另一根的一半長。',
  PITCH,
  '選長 6 和長 12 的兩根。'
 ],
 chord:[
  '和弦的三個音，音高的比是 4：5：6。音高和管長是反過來的，所以先想想管長的比會是多少。',
  PITCH+'音高比 4：5：6，管長的比就是倒過來看：15：12：10。',
  '選長 10、12、15 的三根。'
 ],
 trap:[
  '這三根的管長比是 4：5：6，但樂譜要的是音高比 4：5：6。兩個比，方向是相反的。',
  PITCH+'音高比 4：5：6，管長的比就是 15：12：10。',
  '選長 10、12、15 的三根。'
 ],
 rhythm:[
  '每個聲部自己重複：高音每 3 拍、中音每 4 拍、低音每 6 拍。先決定一個聲部從第幾拍開始，看它在樂譜上留下哪幾拍。',
  '樂譜上的拍子是三個聲部疊起來的結果，有的拍子是兩個聲部同時落下。從只能由一個聲部解釋的拍子開始。',
  '高音從第 2 拍開始，中音從第 3 拍開始，低音從第 4 拍開始。'
 ],
 hymn:[
  '每個聲部對應一根管：聲部越慢，管越長。先把三個聲部各自落在哪幾拍寫下來。',
  '高音聲部配長 10 的管，中音配長 12，低音配長 15。每一拍，只有落在這一拍的聲部，它的管才打開。',
  '第 2、5、8 拍：長 10。第 3、7 拍：長 12。第 4、10 拍：長 15。'
 ]
};
// Which step of the pipes mechanism the player is on, from its level and the selection.
export function pipesStep(level,selected){
 if(level==='warm')return 'warm';
 return isReversedChord(selected)?'trap':'chord';
}
// The hymn is closer the more beats are already right, but the hints do not change with it.
export const hintStep=()=> 'hymn';

const circle=on=>'<span class="choir-dot'+(on?' lit':'')+'" aria-hidden="true"></span>';
const beatRow=(flags,label)=>'<span class="choir-beats" role="img" aria-label="'+label+'">'+flags.map(on=>circle(on)).join('')+'</span>';
const spoken=flags=>{const list=flags.map((on,t)=>on?t+1:0).filter(Boolean);return list.length?'第 '+list.join('、')+' 拍有音':'沒有音';};
const lengthLabel=length=>'長 '+length;

// ctx = { render(html), done(), playCue(kind) }
function finish(ctx,node,still){
 ctx.playCue('door');
 setTimeout(()=>{if(node.isConnected)ctx.done();},still?0:700);
}

export function mountChoirPipes(ctx){
 const still=document.body.classList.contains('reduce-motion');
 let level='warm',selected=new Set(),finishing=false;
 const pipesOf=()=>level==='warm'?WARM_PIPES:PIPES;
 const need=()=>level==='warm'?2:3;
 function draw(){
  ctx.render('<div class="belfry choir"><p class="challenge-help">'
   +(level==='warm'
    ?'七根管的嘴口都被蠟封住。管子越長，音越低。譜架上寫著：<b>「八度，是高一倍的音。」</b>在三根管裡選出相差八度的兩根。'
    :'暖身過了。譜架的下一行寫著：<b>「和弦，三個音的音高比 4：5：6。」</b>在七根管裡選出這三根。')
   +'</p><p id="ch-status" class="belfry-status" role="status"></p>'
   +'<div id="ch-pipes" class="choir-pipes" role="group" aria-label="管風琴的管"></div>'
   +'<button id="ch-go" class="primary-button" disabled>吹響這一組</button>'
   +hintMarkup+'</div>');
  const $=id=>document.getElementById(id),box=$('ch-pipes');
  const alive=()=>box.isConnected;
  const say=(text,tone='')=>{const el=$('ch-status');el.textContent=text;el.dataset.tone=tone;};
  const hints=bindHints({hints:HINTS,currentStep:()=>finishing?null:pipesStep(level,[...selected]),alive});
  function pipes(){
   box.textContent='';
   for(const length of pipesOf()){
    const on=selected.has(length),button=document.createElement('button');
    button.className='choir-pipe';button.setAttribute('aria-pressed',String(on));
    button.setAttribute('aria-label','管長 '+length+(on?'，已選，按下取消':'，按下選取'));
    button.innerHTML='<svg viewBox="0 0 40 130" aria-hidden="true"><rect class="choir-bar" x="10" y="'+(128-length*6)+'" width="20" height="'+length*6+'" rx="3"/><circle class="choir-mouth" cx="20" cy="'+(128-length*6+6)+'" r="4"/></svg><b>'+lengthLabel(length)+'</b>';
    button.onclick=()=>{
     if(finishing)return;
     if(on)selected.delete(length);else if(selected.size<need())selected.add(length);else{say('已經選了 '+need()+' 根。先取消一根。','bad');return;}
     ctx.playCue('click');say('');pipes();$('ch-go').disabled=selected.size!==need();hints.changed();
    };
    box.appendChild(button);
   }
  }
  $('ch-go').onclick=()=>{
   if(finishing)return;
   const picked=[...selected];
   if(level==='warm'){
    if(isOctave(...picked)){
     say('兩根管同時響起，高了一倍。','ok');ctx.playCue('click');
     setTimeout(()=>{if(alive()){level='chord';selected=new Set();finishing=false;draw();}},still?0:700);
     finishing=true;
    }else say('這兩根不是八度。八度是高一倍的音。','bad');
   }else if(isChord(picked)){
    finishing=true;say('三根管一起開口：音高比剛好是 4：5：6。','ok');finish(ctx,box,still);
   }else if(isReversedChord(picked))say('管長的比對了，可是音高和管長是反的。再想一想。','bad');
   else say('三個音不和諧。','bad');
   hints.changed();
  };
  pipes();hints.changed();
 }
 draw();
}

export function mountChoirRhythm(ctx){
 const still=document.body.classList.contains('reduce-motion');
 let offsets=VOICES.map(()=>0),finishing=false;
 ctx.render('<div class="belfry choir"><p class="challenge-help">樂譜上刮出一排拍子。三個聲部各自重複，高音每 3 拍、中音每 4 拍、低音每 6 拍。轉動每個聲部，決定它從第幾拍開始，讓三個聲部疊起來剛好是樂譜上的拍子。</p>'
  +'<p id="ch-status" class="belfry-status" role="status"></p>'
  +'<div class="choir-staff"><b class="choir-label">樂譜</b>'+beatRow(SCORE,'樂譜：'+spoken(SCORE))+'</div>'
  +'<div id="ch-voices" class="choir-voices"></div>'
  +'<div class="choir-staff"><b class="choir-label">疊起來</b><span id="ch-sum"></span></div>'
  +hintMarkup+'</div>');
 const $=id=>document.getElementById(id),box=$('ch-voices');
 const alive=()=>box.isConnected;
 const say=(text,tone='')=>{const el=$('ch-status');el.textContent=text;el.dataset.tone=tone;};
 const hints=bindHints({hints:HINTS,currentStep:()=>finishing||rhythmSolved(offsets)?null:'rhythm',alive});
 function draw(){
  box.textContent='';
  VOICES.forEach((voice,i)=>{
   const row=document.createElement('div');row.className='choir-voice';
   const flags=hits(i,offsets[i]);
   row.innerHTML='<b class="choir-label">'+voice.name+'<small>每 '+voice.period+' 拍 · 從第 '+(offsets[i]+1)+' 拍</small></b>'
    +'<button class="choir-step" data-voice="'+i+'" data-dir="-1" aria-label="'+voice.name+'提早一拍">‹</button>'
    +beatRow(flags,voice.name+'：'+spoken(flags))
    +'<button class="choir-step" data-voice="'+i+'" data-dir="1" aria-label="'+voice.name+'延後一拍">›</button>';
   box.appendChild(row);
  });
  box.querySelectorAll('.choir-step').forEach(button=>button.onclick=()=>{
   if(finishing)return;
   const i=+button.dataset.voice,dir=+button.dataset.dir,period=VOICES[i].period;
   offsets=offsets.map((o,j)=>j===i?(o+dir+period)%period:o);
   ctx.playCue('click');refresh();
  });
 }
 function refresh(){
  draw();
  const sum=union(offsets);
  $('ch-sum').innerHTML=beatRow(sum,'疊起來：'+spoken(sum));
  if(rhythmSolved(offsets)){
   finishing=true;say('三個聲部疊起來，剛好是樂譜上的拍子。','ok');finish(ctx,box,still);
  }else say(still?'目前疊起來的拍子還和樂譜不同。':'疊起來的拍子還和樂譜不同。','');
  hints.changed();
 }
 refresh();
}

export function mountChoirHymn(ctx){
 const still=document.body.classList.contains('reduce-motion');
 const order=[...CHORD];                        // columns: shortest (highest) first
 const written=Array.from({length:HYMN_BEATS},()=>new Set());
 let finishing=false;
 ctx.render('<div class="belfry choir"><p class="challenge-help">前兩道機關各有結果：三根管，和三個聲部。最後要把它們合起來，寫出這首聖歌：<b>聲部越慢，管越長</b>。每一拍，只有落在這一拍的聲部，它的管才打開。勾出每一拍打開的管。</p>'
  +'<ul class="choir-facts">'+VOICES.map((voice,i)=>'<li>'+voice.name+'：每 '+voice.period+' 拍，從第 '+(OFFSETS[i]+1)+' 拍開始</li>').join('')+'<li>三根管：'+order.map(lengthLabel).join('、')+'</li></ul>'
  +'<p id="ch-status" class="belfry-status" role="status"></p>'
  +'<div id="ch-grid" class="choir-grid" role="group" aria-label="聖歌譜，每一拍打開哪幾根管"></div>'
  +'<button id="ch-go" class="primary-button">奏響這首聖歌</button>'
  +hintMarkup+'</div>');
 const $=id=>document.getElementById(id),box=$('ch-grid');
 const alive=()=>box.isConnected;
 const say=(text,tone='')=>{const el=$('ch-status');el.textContent=text;el.dataset.tone=tone;};
 const hints=bindHints({hints:HINTS,currentStep:()=>finishing?null:'hymn',alive});
 box.innerHTML='<span class="choir-grid-head"></span>'+order.map(length=>'<span class="choir-grid-head">'+lengthLabel(length)+'</span>').join('');
 for(let t=0;t<HYMN_BEATS;t++){
  box.insertAdjacentHTML('beforeend','<span class="choir-grid-beat">第 '+(t+1)+' 拍</span>');
  for(const length of order){
   const button=document.createElement('button');
   button.className='choir-cell';button.setAttribute('aria-pressed','false');
   button.setAttribute('aria-label','第 '+(t+1)+' 拍，管長 '+length+'，未選');
   button.onclick=()=>{
    if(finishing)return;
    const set=written[t],on=!set.has(length);
    if(on)set.add(length);else set.delete(length);
    button.setAttribute('aria-pressed',String(on));
    button.setAttribute('aria-label','第 '+(t+1)+' 拍，管長 '+length+(on?'，已選':'，未選'));
    ctx.playCue('click');say('');hints.changed();
   };
   box.appendChild(button);
  }
 }
 $('ch-go').onclick=()=>{
  if(finishing)return;
  const wrong=firstWrong(written.map(set=>[...set]));
  if(wrong===null){finishing=true;say('三根管依序開口，聖歌從頭到尾對上了。','ok');finish(ctx,box,still);}
  else say('第 '+(wrong+1)+' 拍有地方不對。','bad');
  hints.changed();
 };
}
