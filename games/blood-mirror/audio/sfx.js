// Short sound cues synthesised with WebAudio, so the game ships no extra sound files (plan §7.3).
// Every cue plays on the mixer's sfx bus and is silent until the player has turned sound on.
const CUE_NOTES={
 click:[180],
 page:[120,150],
 collect:[440,659.25],
 restore:[523.25,659.25],
 solve:[220,329.63,440],
 wrong:[98,92],
 door:[73.42,98,110],
 lock:[196,147],
 gear:[246.94,233.08],
 bell:[392,523.25],
 achievement:[523.25,659.25,784],
 stitch:[587.33],
 seal:[330,392,494]
};
// Cues that also carry a short noise texture (glass, steam, a heartbeat thump).
const CUE_NOISE={glass:{freq:4200,length:.35},steam:{freq:900,length:.9},heart:{freq:110,length:.18},crack:{freq:2600,length:.5}};

export function createSfx(mixer){
 const tone=(context,destination,frequency,start,length,wave,peak)=>{
  const osc=context.createOscillator(),gain=context.createGain();
  osc.type=wave;osc.frequency.value=frequency;
  gain.gain.setValueAtTime(0.0001,start);
  gain.gain.exponentialRampToValueAtTime(peak,start+0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001,start+length);
  osc.connect(gain);gain.connect(destination);
  osc.start(start);osc.stop(start+length+0.05);
  osc.onended=()=>{osc.disconnect();gain.disconnect();};
 };
 const noise=(context,destination,frequency,start,length,peak)=>{
  const frames=Math.max(1,Math.floor(context.sampleRate*length));
  const buffer=context.createBuffer(1,frames,context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<frames;i++)data[i]=(Math.random()*2-1)*(1-i/frames);
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  source.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=1.2;
  gain.gain.value=peak;
  source.connect(filter);filter.connect(gain);gain.connect(destination);
  source.start(start);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
 };
 return {
  // Returns false when the cue cannot play (no audio yet, or an unknown cue).
  play(kind){
   const bus=mixer.muted||!mixer.context||mixer.context.state!=='running'?null:mixer.bus('sfx');
   if(!bus)return false;
   const context=mixer.context,now=context.currentTime+0.01;
   if(CUE_NOTES[kind]){
    CUE_NOTES[kind].forEach((frequency,i)=>tone(context,bus,frequency,now+i*0.15,0.45,'sine',0.06));
    return true;
   }
   if(CUE_NOISE[kind]){
    const {freq,length}=CUE_NOISE[kind];
    noise(context,bus,freq,now,length,0.12);
    if(kind==='heart')tone(context,bus,freq,now,length,'sine',0.14);
    return true;
   }
   return false;
  },
  cues(){return [...Object.keys(CUE_NOTES),...Object.keys(CUE_NOISE)];}
 };
}
