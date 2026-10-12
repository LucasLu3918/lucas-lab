// Local preferences, responsive navigation and the dialogue box; independent of story saves.
import {speakers,NARRATOR} from './data/chapters/index.js';
// Settings moved from blood-mirror-ui-v1 to blood-mirror-settings-v1; the old key is read once as a fallback.
const KEY='blood-mirror-settings-v1',LEGACY_KEY='blood-mirror-ui-v1';
const MODES=['puzzle','story'],FLAGS=['largeText','reduceMotion','typewriter','candleHints','vibrate'],VOLUMES=['master','music','sfx','ambience'];
export function createGameUI(){
 const button=document.querySelector('#game-menu'),nav=document.querySelector('#game-nav'),small=matchMedia('(max-width:850px)');
 const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
 let preferences={largeText:false,reduceMotion:matchMedia('(prefers-reduced-motion:reduce)').matches,mode:'puzzle',typewriter:true,candleHints:true,vibrate:true,volumes:{master:0.8,music:0.6,sfx:0.7,ambience:0.5}};
 const stored=read(KEY)??read(LEGACY_KEY);
 if(stored&&typeof stored==='object'){
  preferences.largeText=stored.largeText===true;
  if(typeof stored.reduceMotion==='boolean')preferences.reduceMotion=stored.reduceMotion;
  if(MODES.includes(stored.mode))preferences.mode=stored.mode;
  for(const flag of ['typewriter','candleHints','vibrate'])if(typeof stored[flag]==='boolean')preferences[flag]=stored[flag];
  if(stored.volumes&&typeof stored.volumes==='object')for(const name of VOLUMES){const value=Number(stored.volumes[name]);if(Number.isFinite(value))preferences.volumes[name]=Math.min(1,Math.max(0,value));}
 }
 const apply=()=>{
  document.body.classList.toggle('large-text',preferences.largeText);
  document.body.classList.toggle('reduce-motion',preferences.reduceMotion);
  document.body.classList.toggle('mode-story',preferences.mode==='story');
 };
 const setPreference=(name,value)=>{
  if(name==='mode'){if(!MODES.includes(value))return;preferences.mode=value;}
  else if(FLAGS.includes(name))preferences[name]=value===true;
  else return;
  apply();
  try{localStorage.setItem(KEY,JSON.stringify(preferences));}catch{}
 };
 const setMenu=(open,{restoreFocus=false}={})=>{const expanded=small.matches&&open;button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-label',expanded?'關閉導覽選單':'開啟導覽選單');nav.classList.toggle('menu-open',expanded);nav.inert=small.matches&&!expanded;if(restoreFocus)button.focus();};
 button.onclick=()=>setMenu(button.getAttribute('aria-expanded')!=='true');
 nav.addEventListener('click',event=>{if(event.target.closest('button'))setMenu(false);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){event.preventDefault();setMenu(false,{restoreFocus:true});}});
 document.addEventListener('click',event=>{if(!nav.contains(event.target)&&!button.contains(event.target))setMenu(false);});
 small.addEventListener('change',()=>setMenu(false));
 // Clues start collapsed so the scene stays in view on phones.
 document.querySelector('#scene-clues').open=false;
 apply();setMenu(false);
 const setVolume=(name,value)=>{if(!VOLUMES.includes(name))return;preferences.volumes[name]=Math.min(1,Math.max(0,Number(value)||0));try{localStorage.setItem(KEY,JSON.stringify(preferences));}catch{}};
 return {preferences,setPreference,setVolume,closeMenu:(restoreFocus=false)=>setMenu(false,{restoreFocus})};
}

// Dialogue box (對話框): plays an act's lines one click at a time, naming the speaker and showing their
// portrait. The line being read is UI state only; progress never depends on it.
const CHAR_MS=32;

// `typewriter()` says whether to reveal text letter by letter right now (setting on, motion allowed).
export function createDialogueBox({root,icon,typewriter,onLog}){
 const $=selector=>root.querySelector(selector);
 const text=$('#narrative'),name=$('#dialogue-speaker'),face=$('#dialogue-face'),count=$('#dialogue-count'),next=$('#dialogue-next'),log=$('#dialogue-log');
 let lines=[],index=0,key=null,typing=false,timer;

 // The whole line is in the DOM from the start (screen readers announce it once, the box never reflows);
 // the typewriter only fades letters in, and removing the class shows them all.
 const finish=()=>{clearTimeout(timer);typing=false;text.classList.remove('typing');};
 function draw(animate){
  const line=lines[index],who=speakers[line.speaker]||speakers[NARRATOR];
  finish();
  name.textContent=who.name;
  face.innerHTML=who.portrait?`<img src="assets/portraits/${who.portrait}.webp" alt="" width="40" height="40" decoding="async">`:icon('mirror');
  face.classList.toggle('has-portrait',!!who.portrait);
  // The speaker's name is read out before the line; sighted players see it in the header instead.
  text.replaceChildren();
  if(line.speaker!==NARRATOR){const voice=document.createElement('span');voice.className='sr-speaker';voice.textContent=who.name+'：';text.append(voice);}
  const chars=[...line.text];
  if(animate&&chars.length>1){
   // Each letter's delay is set through CSSOM: the page's CSP blocks inline style attributes.
   for(const [i,ch] of chars.entries()){const letter=document.createElement('span');letter.className='letter';letter.textContent=ch;letter.style.setProperty('--i',i);text.append(letter);}
   text.classList.add('typing');typing=true;
   timer=setTimeout(finish,chars.length*CHAR_MS+120);
  }else text.append(line.text);
  count.textContent=lines.length>1?`${index+1} / ${lines.length}`:'';
  next.hidden=index>=lines.length-1;
 }

 // A first click finishes the line being typed; the next one moves on.
 function advance(){
  if(typing){finish();return;}
  if(index>=lines.length-1)return;
  const hadFocus=document.activeElement===next;
  index++;draw(typewriter());
  if(hadFocus&&next.hidden)log.focus({preventScroll:true});
 }
 next.addEventListener('click',advance);
 text.addEventListener('click',advance);
 log.addEventListener('click',onLog);

 // `id` names what is being shown (the act and whether its seal is open). A new id starts at the first
 // line, or at the last one when the player has already met the act, so a revisit does not replay it.
 function show(id,nextLines,{met=false}={}){
  if(id===key)return;
  key=id;lines=nextLines;index=met?lines.length-1:0;
  draw(!met&&typewriter());
 }
 // How many lines of the current set the player has been shown (the read log stops there).
 return {show,advance,finish,shown:()=>index+1,remaining:()=>lines.length-1-index};
}
