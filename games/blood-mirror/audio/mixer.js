// Three buses (music, sound effects, ambience) under one master, each with its own level.
// Audio starts only after a player gesture; the page never plays sound on its own (plan §7.3).
//
// Signal flow:
//   music    → bus → focus filter → focus gain → duck → master
//   ambience → bus → duck ─────────────────────────────→ master
//   sfx      → bus ─────────────────────────────────────→ master → limiter → speakers
// Player sliders set the bus levels; TRIM_DB is the fixed mix balance between the buses.
const SUB_BUSES=['music','sfx','ambience'];
const DEFAULT_LEVELS={master:0.8,music:0.6,sfx:0.7,ambience:0.5};
// The synthesised ambience beds sit about 8 dB under normalised music at the default levels.
const TRIM_DB={music:0,sfx:0,ambience:4};
// Puzzle focus: music drops behind the puzzle so the player can think, then opens up when it is solved.
const FOCUS={cutoff:1800,open:20000,db:-3,seconds:0.35};

export const dbToGain=db=>Math.pow(10,db/20);
// Sliders are 0..1 but loudness is logarithmic. Squaring the slider is an audio taper of
// 40·log10(slider) dB: half-way is -12 dB, a quarter is -24 dB, and 0 is true silence.
export const sliderToGain=value=>{const v=Math.min(1,Math.max(0,Number(value)||0));return v*v;};

export function createMixer(){
 let context=null,muted=true,focused=false;
 const levels={...DEFAULT_LEVELS};
 const buses={},duck={};
 let limiter=null,focusFilter=null,focusGain=null;
 // Freeze a parameter where it is right now so a new automation starts without a jump.
 const hold=(param,now)=>{
  if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(now);
  else{const value=param.value;param.cancelScheduledValues(now);param.setValueAtTime(value,now);}
 };
 const apply=()=>{
  if(!context)return;
  const now=context.currentTime;
  buses.master.gain.setTargetAtTime(muted?0:sliderToGain(levels.master),now,0.05);
  for(const name of SUB_BUSES)buses[name].gain.setTargetAtTime(sliderToGain(levels[name])*dbToGain(TRIM_DB[name]),now,0.05);
 };
 const ensure=()=>{
  if(context)return context;
  const Ctor=window.AudioContext||window.webkitAudioContext;
  if(!Ctor)throw new Error('WebAudio unavailable');
  context=new Ctor();
  // A safety limiter on the master keeps summed cues, music and ambience from clipping.
  // It should rarely work: the mix itself leaves headroom.
  limiter=context.createDynamicsCompressor();
  limiter.threshold.value=-4;limiter.knee.value=2;limiter.ratio.value=20;limiter.attack.value=0.003;limiter.release.value=0.2;
  limiter.connect(context.destination);
  buses.master=context.createGain();
  buses.master.connect(limiter);
  for(const name of SUB_BUSES)buses[name]=context.createGain();
  duck.music=context.createGain();duck.ambience=context.createGain();
  focusFilter=context.createBiquadFilter();focusFilter.type='lowpass';focusFilter.frequency.value=FOCUS.open;focusFilter.Q.value=0.5;
  focusGain=context.createGain();
  buses.music.connect(focusFilter);focusFilter.connect(focusGain);focusGain.connect(duck.music);duck.music.connect(buses.master);
  buses.ambience.connect(duck.ambience);duck.ambience.connect(buses.master);
  buses.sfx.connect(buses.master);
  apply();
  return context;
 };
 return {
  // Must be called from a user gesture (a click on the sound button or a settings toggle).
  // Resuming means the player wants sound; suspending means they do not.
  async resume(){const c=ensure();await c.resume();muted=false;apply();return c;},
  suspend(){muted=true;if(context){apply();context.suspend().catch(()=>{});}},
  get context(){return context;},
  bus(name){ensure();return name==='master'?buses.master:buses[name]||null;},
  setMuted(value){muted=value===true;apply();},
  get muted(){return muted;},
  setLevel(name,value){
   if(!(name in levels))return;
   levels[name]=Math.min(1,Math.max(0,Number(value)||0));
   apply();
  },
  getLevels(){return {...levels};},
  // Sidechain-style ducking without a sidechain: important cues dip music (and ambience,
  // half as far) quickly, hold, then let it recover slowly enough not to pump.
  duck(db=-6,holdSeconds=0.6){
   if(!context||muted)return;
   const now=context.currentTime;
   for(const [name,depth] of [['music',db],['ambience',db/2]]){
    const gain=duck[name].gain;
    hold(gain,now);
    gain.setTargetAtTime(dbToGain(depth),now,0.025);
    gain.setTargetAtTime(1,now+holdSeconds,0.4);
   }
  },
  // Puzzle focus: muffle and lower the music while a puzzle is open.
  setFocus(on){
   focused=on===true;
   if(!context)return;
   const now=context.currentTime,seconds=FOCUS.seconds/3;
   hold(focusFilter.frequency,now);hold(focusGain.gain,now);
   focusFilter.frequency.setTargetAtTime(focused?FOCUS.cutoff:FOCUS.open,now,seconds);
   focusGain.gain.setTargetAtTime(focused?dbToGain(FOCUS.db):1,now,seconds);
  },
  get focused(){return focused;}
 };
}
