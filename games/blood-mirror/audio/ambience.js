// Room ambience: looping, synthesised beds per atmosphere (plan §7.3). Scenes cross-fade over 1.5 s.
const BEDS={
 library:{filter:'lowpass',freq:420,level:0.2,swell:0.07,event:{kind:'tick',every:[1.8,2.6],freq:1800,peak:0.04}},
 mine:{filter:'bandpass',freq:720,level:0.18,swell:0.13,event:{kind:'drip',every:[2,6],freq:2400,peak:0.05}},
 crypt:{filter:'lowpass',freq:160,level:0.26,swell:0.03},
 queen:{filter:'bandpass',freq:1400,level:0.12,swell:0.4,event:{kind:'crackle',every:[0.6,1.8],freq:3200,peak:0.03}},
 mirror:{filter:'highpass',freq:300,level:0.16,swell:0.05,reverse:true},
 ballroom:{filter:'bandpass',freq:900,level:0.11,swell:0.22,event:{kind:'tick',every:[1.2,2.4],freq:2600,peak:0.025}},
 hunter:{filter:'lowpass',freq:300,level:0.2,swell:0.1,event:{kind:'crackle',every:[0.9,2.2],freq:2800,peak:0.03}},
 chamber:{filter:'lowpass',freq:260,level:0.14,swell:0.08}
};
// The bed loops every 8 s; the last SEAM seconds are cross-faded into the head so the loop point
// is inaudible. The mirror's reversed swell repeats every 4 s, so two swells fit one loop exactly.
const CROSSFADE=1.5,LOOP_SECONDS=8,SEAM=0.5,SWELL_SECONDS=4,SWELL_FADE=0.04;

export function createAmbience(mixer){
 let scene=null,bed=null,eventTimer=null;

 // Brown-ish noise: smoother than white noise, closer to wind and distant machinery.
 const brown=frames=>{const data=new Float32Array(frames);let last=0;for(let i=0;i<frames;i++){last=(last+0.02*(Math.random()*2-1))/1.02;data[i]=last*3.5;}return data;};
 const buffers={};
 const noiseBuffer=(context,reverse)=>{
  const key=(reverse?'reverse':'plain')+context.sampleRate;
  if(buffers[key])return buffers[key];
  const rate=context.sampleRate,frames=Math.floor(rate*LOOP_SECONDS),seam=Math.floor(rate*SEAM);
  const stream=brown(frames+seam),buffer=context.createBuffer(1,frames,rate),data=buffer.getChannelData(0);
  for(let i=0;i<frames;i++){
   // Equal-power blend of the head with the samples that would have followed the tail.
   let value=stream[i];
   if(i<seam){const t=i/seam;value=stream[i]*Math.sin(t*Math.PI/2)+stream[frames+i]*Math.cos(t*Math.PI/2);}
   if(reverse){
    // A reversed swell that rises and stops short, with a tiny fade so the stop never clicks.
    const period=Math.floor(rate*SWELL_SECONDS),phase=i%period,fade=Math.floor(rate*SWELL_FADE);
    value*=Math.pow(phase/period,3)*Math.min(1,(period-phase)/fade);
   }
   data[i]=value;
  }
  return buffers[key]=buffer;
 };
 const ramp=(gain,to,seconds)=>{const now=mixer.context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);gain.gain.linearRampToValueAtTime(to,now+seconds);};
 // Room events (clock ticks, water drips, embers) vary in pitch and level so no two sound alike.
 // They play through the bed's gain so they fade with it; `peak` is divided by the bed level to stay absolute.
 const event=(context,destination,config,bedLevel)=>{
  const now=context.currentTime+0.01,osc=context.createOscillator(),gain=context.createGain();
  const freq=config.freq*(0.85+Math.random()*0.3),peak=config.peak/bedLevel*(0.6+Math.random()*0.4);
  const length=config.kind==='tick'?0.05:config.kind==='crackle'?0.03:0.18;
  osc.type=config.kind==='tick'?'square':config.kind==='crackle'?'triangle':'sine';osc.frequency.setValueAtTime(freq,now);
  // A drip falls in pitch as it lands.
  if(config.kind==='drip')osc.frequency.exponentialRampToValueAtTime(freq*0.45,now+0.12);
  gain.gain.setValueAtTime(0.0001,now);gain.gain.exponentialRampToValueAtTime(peak,now+0.005);gain.gain.exponentialRampToValueAtTime(0.0001,now+length);
  osc.connect(gain);gain.connect(destination);osc.start(now);osc.stop(now+length+0.04);
  osc.onended=()=>{osc.disconnect();gain.disconnect();};
 };
 const scheduleEvents=(config)=>{
  clearTimeout(eventTimer);
  const next=()=>{
   if(!bed||!bed.config.event)return;
   const context=mixer.context;
   if(context&&context.state==='running')event(context,bed.gain,bed.config.event,bed.config.level);
   const [low,high]=config.every;
   eventTimer=setTimeout(next,(low+Math.random()*(high-low))*1000);
  };
  eventTimer=setTimeout(next,1500);
 };
 const fadeOutBed=old=>{
  if(!old)return;
  ramp(old.gain,0,CROSSFADE);
  setTimeout(()=>{try{old.source.stop();old.lfo.stop();}catch{}old.lfo.disconnect();old.source.disconnect();old.filter.disconnect();old.gain.disconnect();},CROSSFADE*1000+100);
 };

 return {
  // Only plays once the mixer is running; call after the player has turned sound on.
  select(atmosphere){
   const config=BEDS[atmosphere];
   if(!config||!mixer.context||mixer.context.state!=='running'||mixer.muted){scene=null;clearTimeout(eventTimer);fadeOutBed(bed);bed=null;return false;}
   if(scene===atmosphere)return true;
   scene=atmosphere;
   const context=mixer.context,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
   source.buffer=noiseBuffer(context,config.reverse);source.loop=true;
   filter.type=config.filter;filter.frequency.value=config.freq;filter.Q.value=0.8;
   gain.gain.value=0;
   // A slow swell keeps the bed alive without any loud, repeating motion.
   const lfo=context.createOscillator(),depth=context.createGain();
   lfo.frequency.value=config.swell;depth.gain.value=config.level*0.25;
   lfo.connect(depth);depth.connect(gain.gain);lfo.start();
   source.connect(filter);filter.connect(gain);gain.connect(mixer.bus('ambience'));
   source.start();
   const old=bed;
   bed={source,filter,gain,lfo,config};
   ramp(gain,config.level,CROSSFADE);
   fadeOutBed(old);
   if(config.event)scheduleEvents(config.event);else clearTimeout(eventTimer);
   return true;
  },
  stop(){
   scene=null;clearTimeout(eventTimer);
   if(bed){const old=bed;bed=null;fadeOutBed(old);}
  },
  get scene(){return scene;}
 };
}
