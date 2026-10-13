// Scene music on the mixer's music bus. MP3 loops cross-fade over 1.5 s; a synthesised
// WebAudio fallback takes over when a file cannot load, so the game is never silent by accident.
import {createMixer} from './audio/mixer.js';

export const soundtrackFiles={
 home:'10_theme_intro_Who_Deserves_to_Live.mp3',
 library:'01_library_The_Thirteenth_Toll.mp3',mine:'02_mine_Seven_Beds_of_Silver.mp3',
 crypt:'03_crypt_The_Breath_Between.mp3',queen:'04_queen_Veras_Lullaby.mp3',
 ballroom:'12_ballroom_Waltz_of_Wax.mp3',hunter:'13_hunter_A_Heart_in_Glass.mp3',
 mirror:'05_mirror_The_Price_of_a_Name.mp3',dawn:'06_dawn_Nameless_Dawn.mp3',
 frost:'07_frost_Winter_Without_Names.mp3',crown:'08_crown_Crown_of_Blood.mp3'
};
// The full theme (about five minutes) is used by the listening room and the credits, never as a loop.
export const fullThemeFile='11_theme_full_Who_Deserves_to_Live.mp3';
// Internal track map: the public soundtrackFiles stays as the listening room lists it, and the credits add one more entry.
const trackFiles={...soundtrackFiles,credits:fullThemeFile};

// Integrated loudness of each file (LUFS), measured with
//   ffmpeg -i <file> -af ebur128 -f null -
// The tracks span about 10 dB, so each one is trimmed to TARGET_LUFS (boosts capped at MAX_BOOST_DB)
// and a scene change never jumps in volume. Re-measure when a file is replaced.
const LOUDNESS={
 '01_library_The_Thirteenth_Toll.mp3':-18.9,'02_mine_Seven_Beds_of_Silver.mp3':-19.1,
 '03_crypt_The_Breath_Between.mp3':-18.9,'04_queen_Veras_Lullaby.mp3':-18.9,
 '05_mirror_The_Price_of_a_Name.mp3':-18.9,'06_dawn_Nameless_Dawn.mp3':-21,
 '07_frost_Winter_Without_Names.mp3':-20.4,'08_crown_Crown_of_Blood.mp3':-20.2,
 '10_theme_intro_Who_Deserves_to_Live.mp3':-22.2,'11_theme_full_Who_Deserves_to_Live.mp3':-15.3,
 '12_ballroom_Waltz_of_Wax.mp3':-18.9,'13_hunter_A_Heart_in_Glass.mp3':-18.9
};
const TARGET_LUFS=-18,MAX_BOOST_DB=4;
export const trackGain=file=>{const lufs=LOUDNESS[file];return lufs===undefined?1:Math.pow(10,Math.min(MAX_BOOST_DB,TARGET_LUFS-lufs)/20);};

const CROSSFADE=1.5,RESUME_FADE=0.6,SYNTH_LEVEL=0.9;
const themes={
 home:{bass:55,notes:[0,3,7,3,10,7,3,0],rate:740,wave:'triangle'},
 library:{bass:65.4,notes:[0,1,7,6,3,1,0,-2],rate:620,wave:'sine'},
 mine:{bass:49,notes:[0,0,5,3,0,8,5,3],rate:570,wave:'sawtooth'},
 crypt:{bass:58.3,notes:[0,7,5,1,0,7,8,5],rate:880,wave:'sine'},
 queen:{bass:69.3,notes:[0,3,7,10,7,3,2,0],rate:760,wave:'triangle'},
 ballroom:{bass:73.4,notes:[0,4,7,4,0,3,7,3],rate:690,wave:'triangle'},
 hunter:{bass:55,notes:[0,0,3,0,7,3,0,-2],rate:960,wave:'sine'},
 mirror:{bass:51.9,notes:[0,1,6,7,0,10,6,1],rate:540,wave:'triangle'},
 dawn:{bass:73.4,notes:[0,4,7,12,11,7,4,2],rate:790,wave:'sine'},
 frost:{bass:55,notes:[0,3,5,1,-2,0,3,-2],rate:930,wave:'sine'},
 crown:{bass:61.7,notes:[0,1,6,5,3,1,0,-1],rate:630,wave:'sawtooth'}
};

export function createSoundtrack({mixer=createMixer()}={}){
 let active=false,scene='home',current=null,parked=null,synthTimer=null,synthTick=0,synthGain=null,synthScene=null,generation=0;

 const hold=(param,now)=>{param.cancelScheduledValues(now);param.setValueAtTime(param.value,now);};
 const ramp=(gain,to,seconds)=>{const now=mixer.context.currentTime;hold(gain.gain,now);gain.gain.linearRampToValueAtTime(to,now+seconds);};
 // Two overlapping tracks are uncorrelated, so a plain linear cross-fade dips by about 3 dB in the
 // middle. These two-segment curves approximate equal power: the new track rises quickly to 70 %,
 // the old one holds 70 % until most of the fade has passed.
 const fadeIn=(gain,to,seconds)=>{const now=mixer.context.currentTime;hold(gain.gain,now);gain.gain.linearRampToValueAtTime(to*0.7,now+seconds*0.4);gain.gain.linearRampToValueAtTime(to,now+seconds);};
 const fadeOut=(gain,seconds)=>{const now=mixer.context.currentTime,from=gain.gain.value;hold(gain.gain,now);gain.gain.linearRampToValueAtTime(from*0.7,now+seconds*0.6);gain.gain.linearRampToValueAtTime(0,now+seconds);};
 const dispose=track=>{track.element.pause();track.element.removeAttribute('src');track.element.load();track.source.disconnect();track.gain.disconnect();};
 const retire=track=>{
  if(!track)return;
  fadeOut(track.gain,CROSSFADE);
  setTimeout(()=>dispose(track),CROSSFADE*1000+100);
 };

 const tone=(frequency,time,length,wave,volume)=>{
  const context=mixer.context;
  const osc=context.createOscillator(),gain=context.createGain();
  osc.type=wave;osc.frequency.value=frequency;
  gain.gain.setValueAtTime(0.0001,time);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume,0.0002),time+0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001,time+length);
  osc.connect(gain);gain.connect(synthGain);
  osc.start(time);osc.stop(time+length+0.02);
  osc.onended=()=>{osc.disconnect();gain.disconnect();};
 };
 const nextSynthNote=()=>{
  const theme=themes[synthScene]||themes.home,note=theme.notes[synthTick%theme.notes.length];
  const time=mixer.context.currentTime+0.015;
  tone(theme.bass*4*Math.pow(2,note/12),time,Math.min(theme.rate/1000*1.9,1.5),theme.wave,0.085);
  if(synthTick%4===0)tone(theme.bass*2,time,2.2,'sine',0.06);
  if(synthTick%8===0)tone(theme.bass*8,time,0.52,'sine',0.02);
  synthTick++;
 };
 const startSynth=()=>{
  if(!mixer.context||synthGain)return;
  synthGain=mixer.context.createGain();synthGain.gain.value=0;synthGain.connect(mixer.bus('music'));
  fadeIn(synthGain,SYNTH_LEVEL,0.4);
  synthScene=scene;synthTick=0;nextSynthNote();
  synthTimer=setInterval(nextSynthNote,(themes[scene]||themes.home).rate);
 };
 // The fallback fades out with the same curve as a track, so a late-loading MP3 takes over smoothly.
 const stopSynth=()=>{
  clearInterval(synthTimer);synthTimer=null;synthScene=null;
  if(synthGain){const gain=synthGain;synthGain=null;fadeOut(gain,CROSSFADE);setTimeout(()=>gain.disconnect(),CROSSFADE*1000+100);}
 };

 const playFile=(id,file,token)=>{
  const context=mixer.context,element=new Audio('assets/music/'+file);
  element.loop=true;element.preload='auto';
  const gain=context.createGain();gain.gain.value=0;
  const source=context.createMediaElementSource(element);
  source.connect(gain);gain.connect(mixer.bus('music'));
  const track={id,element,gain,source,level:trackGain(file),ready:false};
  element.addEventListener('canplay',()=>{
   if(token!==generation||current!==track)return;
   element.play().then(()=>{if(token!==generation)return;track.ready=true;stopSynth();fadeIn(gain,track.level,CROSSFADE);}).catch(()=>{});
  },{once:true});
  element.addEventListener('error',()=>{
   if(current!==track)return;
   current=null;
   if(active)startSynth();
  },{once:true});
  element.load();
  return track;
 };

 const play=id=>{
  if(!active||!trackFiles[id])return;
  if(current&&current.id===id)return;
  const token=++generation,old=current;
  current=playFile(id,trackFiles[id],token);
  retire(old);
 };

 // Returning to the tab (or turning sound back on) continues the parked track where it paused,
 // instead of restarting the scene's music from the top.
 const unpark=()=>{
  const track=parked;parked=null;
  if(!track)return false;
  if(track.id!==scene||!track.ready){dispose(track);return false;}
  const token=++generation;current=track;
  track.gain.gain.value=0;
  track.element.play().then(()=>{if(token===generation)fadeIn(track.gain,track.level,RESUME_FADE);}).catch(()=>{});
  return true;
 };
 const start=async current=>{
  if(current&&trackFiles[current])scene=current;
  await mixer.resume();
  active=true;
  if(!unpark())play(scene);
 };
 const select=id=>{
  if(!trackFiles[id])return;
  scene=id;
  if(!active)return;
  if(!current||current.id!==id)play(id);
  // The fallback only restarts when the scene really changes; re-rendering the same room keeps its melody.
  if(synthGain&&synthScene!==id)stopSynth(),startSynth();
 };
 const stop=()=>{
  active=false;generation++;
  stopSynth();
  if(parked)dispose(parked);
  parked=null;
  if(current){current.element.pause();parked=current;current=null;}
  mixer.suspend();
 };
 const getStatus=()=>({
  scene,active,
  source:active?(current?.ready?'mp3':synthGain?'synth':'silent'):'silent',
  currentTime:current?.element.currentTime||0,
  loop:current?.element.loop||false,
  level:current?.level??0,
  synthGain:synthGain?.gain.value??0
 });
 return {start,select,stop,getStatus,mixer};
}
