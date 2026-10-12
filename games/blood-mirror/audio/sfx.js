// Short sound cues synthesised with WebAudio, so the game ships no extra sound files (plan §7.3).
// Every cue plays on the mixer's sfx bus and is silent until the player has turned sound on.
//
// A cue is a few tones (notes, staggered by `gap`) and/or a filtered noise burst. `peak` is linear
// gain before the sfx bus. `duck` (dB) dips the music under cues that matter; `release` marks cues
// that resolve a puzzle, which lifts the mixer's puzzle focus.
const CUES={
 click:{notes:[330],wave:'triangle',length:.09,peak:.11,noise:{freq:3200,length:.025,peak:.05,type:'highpass'}},
 page:{notes:[392,493.88],length:.26,gap:.07,peak:.08,noise:{freq:2400,length:.2,peak:.05}},
 collect:{notes:[440,659.25],length:.5,gap:.11,peak:.15,duck:-3},
 restore:{notes:[523.25,659.25,783.99],length:.6,gap:.12,peak:.14,duck:-4,release:true},
 solve:{notes:[220,329.63,440],length:.9,gap:.15,peak:.18,duck:-6,release:true},
 wrong:{notes:[98,92.5],wave:'triangle',length:.35,gap:.12,peak:.16,duck:-2},
 door:{notes:[73.42,98,110],length:1,gap:.18,peak:.2,duck:-5,noise:{freq:220,length:.6,peak:.08}},
 lock:{notes:[196,147],wave:'triangle',length:.2,gap:.08,peak:.13,noise:{freq:1800,length:.04,peak:.06}},
 gear:{notes:[246.94,233.08],wave:'triangle',length:.12,gap:.09,peak:.1,noise:{freq:2600,length:.05,peak:.05}},
 bell:{notes:[392,523.25],length:1.4,gap:.2,peak:.13,duck:-3},
 achievement:{notes:[523.25,659.25,784],length:.8,gap:.13,peak:.15,duck:-5,release:true},
 stitch:{notes:[587.33],length:.15,peak:.09},
 seal:{notes:[330,392,494],length:.8,gap:.16,peak:.15,duck:-4},
 // Cues that are mostly a noise texture (glass, steam, a heartbeat thump).
 glass:{notes:[1760,2349.32],length:.5,gap:.05,peak:.04,noise:{freq:4200,length:.35,peak:.14}},
 steam:{noise:{freq:900,length:.9,peak:.12}},
 heart:{notes:[110],length:.18,peak:.16,noise:{freq:110,length:.18,peak:.12}},
 crack:{noise:{freq:2600,length:.5,peak:.14}}
};
// Variation keeps repeated cues (a run of clicks or wrong answers) from sounding mechanical.
const VARY_CENTS=30,VARY_LEVEL=0.12;
// The same cue fired faster than this is one sound, not two stacked ones; too many voices are dropped.
const RETRIGGER=0.045,MAX_VOICES=24;

export function createSfx(mixer){
 const lastPlayed={};let voices=0,noiseBuffer=null;
 const random=(low,high)=>low+Math.random()*(high-low);
 // Count live voices and disconnect a cue's whole chain when its source ends.
 const voice=(source,...chain)=>{voices++;source.onended=()=>{voices--;[source,...chain].forEach(node=>node.disconnect());};};
 const tone=(context,destination,frequency,start,length,wave,peak,detune)=>{
  const osc=context.createOscillator(),gain=context.createGain();
  osc.type=wave;osc.frequency.value=frequency;osc.detune.value=detune;
  gain.gain.setValueAtTime(0.0001,start);
  gain.gain.exponentialRampToValueAtTime(peak,start+Math.min(0.02,length/4));
  gain.gain.exponentialRampToValueAtTime(0.0001,start+length);
  osc.connect(gain);gain.connect(destination);
  voice(osc,gain);
  osc.start(start);osc.stop(start+length+0.05);
 };
 // One second of white noise, made once and reused from a random offset for every burst.
 const noiseSource=context=>{
  if(!noiseBuffer||noiseBuffer.sampleRate!==context.sampleRate){
   noiseBuffer=context.createBuffer(1,context.sampleRate,context.sampleRate);
   const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  }
  const source=context.createBufferSource();source.buffer=noiseBuffer;return source;
 };
 const noise=(context,destination,{freq,length,peak,type='bandpass'},start,level,spread)=>{
  const source=noiseSource(context),filter=context.createBiquadFilter(),gain=context.createGain();
  filter.type=type;filter.frequency.value=freq*spread;filter.Q.value=type==='bandpass'?1.2:0.7;
  gain.gain.setValueAtTime(0.0001,start);
  gain.gain.exponentialRampToValueAtTime(peak*level,start+0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001,start+length);
  source.connect(filter);filter.connect(gain);gain.connect(destination);
  voice(source,filter,gain);
  source.start(start,Math.random()*Math.max(0,1-length),length+0.02);
 };
 return {
  // Returns false when the cue cannot play (no audio yet, an unknown cue, or a retrigger/voice limit).
  play(kind){
   const cue=CUES[kind];
   const bus=!cue||mixer.muted||!mixer.context||mixer.context.state!=='running'?null:mixer.bus('sfx');
   if(!bus)return false;
   const context=mixer.context,now=context.currentTime+0.01;
   if(now-(lastPlayed[kind]??-1)<RETRIGGER||voices>=MAX_VOICES)return false;
   lastPlayed[kind]=now;
   const detune=random(-VARY_CENTS,VARY_CENTS),level=random(1-VARY_LEVEL,1);
   const notes=cue.notes||[],gap=cue.gap||0;
   notes.forEach((frequency,i)=>tone(context,bus,frequency,now+i*gap,cue.length,cue.wave||'sine',cue.peak*level,detune));
   if(cue.noise)noise(context,bus,cue.noise,now,level,Math.pow(2,detune/1200));
   if(cue.release)mixer.setFocus?.(false);
   if(cue.duck)mixer.duck?.(cue.duck,Math.max(0,notes.length-1)*gap+Math.min(cue.length||0,0.6));
   return true;
  },
  cues(){return Object.keys(CUES);}
 };
}
