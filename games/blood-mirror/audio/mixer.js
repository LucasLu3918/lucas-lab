// Three buses (music, sound effects, ambience) under one master, each with its own level.
// Audio starts only after a player gesture; the page never plays sound on its own (plan §7.3).
const SUB_BUSES=['music','sfx','ambience'];
const DEFAULT_LEVELS={master:0.8,music:0.6,sfx:0.7,ambience:0.5};

export function createMixer(){
 let context=null,muted=true;
 const levels={...DEFAULT_LEVELS};
 const buses={};
 const apply=()=>{
  if(!context)return;
  const now=context.currentTime;
  buses.master.gain.setTargetAtTime(muted?0:levels.master,now,0.05);
  for(const name of SUB_BUSES)buses[name].gain.setTargetAtTime(levels[name],now,0.05);
 };
 const ensure=()=>{
  if(context)return context;
  const Ctor=window.AudioContext||window.webkitAudioContext;
  if(!Ctor)throw new Error('WebAudio unavailable');
  context=new Ctor();
  buses.master=context.createGain();
  buses.master.connect(context.destination);
  for(const name of SUB_BUSES){buses[name]=context.createGain();buses[name].connect(buses.master);}
  apply();
  return context;
 };
 return {
  // Must be called from a user gesture (a click on the sound button or a settings toggle).
  async resume(){const c=ensure();await c.resume();apply();return c;},
  suspend(){if(context)context.suspend().catch(()=>{});},
  get context(){return context;},
  bus(name){ensure();return name==='master'?buses.master:buses[name]||null;},
  setMuted(value){muted=value===true;apply();},
  get muted(){return muted;},
  setLevel(name,value){
   if(!(name in levels))return;
   levels[name]=Math.min(1,Math.max(0,Number(value)||0));
   apply();
  },
  getLevels(){return {...levels};}
 };
}
