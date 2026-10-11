// Local preferences and responsive navigation; independent of story saves.
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
