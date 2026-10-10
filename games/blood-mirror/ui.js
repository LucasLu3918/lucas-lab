// Local UI preferences and responsive navigation; independent of story saves.
const KEY='blood-mirror-ui-v1';
export function createGameUI(){
 const button=document.querySelector('#game-menu'),nav=document.querySelector('#game-nav'),small=matchMedia('(max-width:850px)');
 let preferences={largeText:false,reduceMotion:matchMedia('(prefers-reduced-motion:reduce)').matches};
 try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw&&typeof raw==='object'){preferences.largeText=raw.largeText===true;if(typeof raw.reduceMotion==='boolean')preferences.reduceMotion=raw.reduceMotion;}}catch{}
 const apply=()=>{document.body.classList.toggle('large-text',preferences.largeText);document.body.classList.toggle('reduce-motion',preferences.reduceMotion);};
 const setPreference=(name,value)=>{if(!['largeText','reduceMotion'].includes(name))return;preferences[name]=value===true;apply();try{localStorage.setItem(KEY,JSON.stringify(preferences));}catch{}};
 const setMenu=(open,{restoreFocus=false}={})=>{const expanded=small.matches&&open;button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-label',expanded?'關閉導覽選單':'開啟導覽選單');nav.classList.toggle('menu-open',expanded);nav.inert=small.matches&&!expanded;if(restoreFocus)button.focus();};
 button.onclick=()=>setMenu(button.getAttribute('aria-expanded')!=='true');
 nav.addEventListener('click',event=>{if(event.target.closest('button'))setMenu(false);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){event.preventDefault();setMenu(false,{restoreFocus:true});}});
 document.addEventListener('click',event=>{if(!nav.contains(event.target)&&!button.contains(event.target))setMenu(false);});
 small.addEventListener('change',()=>setMenu(false));
 document.querySelector('#scene-clues').open=small.matches;
 apply();setMenu(false);
 return {preferences,setPreference,closeMenu:(restoreFocus=false)=>setMenu(false,{restoreFocus})};
}
