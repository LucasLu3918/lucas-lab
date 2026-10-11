// Scene music on the mixer's music bus. MP3 loops cross-fade over 1.5 s; a synthesised
// WebAudio fallback takes over when a file cannot load, so the game is never silent by accident.
import {createMixer} from './audio/mixer.js';

export const soundtrackFiles={
 home:'10_theme_intro_Who_Deserves_to_Live.mp3',
 library:'01_library_Black_Bell_Archive.mp3',mine:'02_mine_Seven_Forgotten_Names.mp3',
 crypt:'03_crypt_Glass_Sleep.mp3',queen:'04_queen_The_Queens_Lament.mp3',
 mirror:'05_mirror_A_Name_for_a_Life.mp3',dawn:'06_dawn_Nameless_Dawn.mp3',
 frost:'07_frost_Winter_Without_Names.mp3',crown:'08_crown_Crown_of_Blood.mp3'
};
// The full theme (about five minutes) is used by the listening room and the credits, never as a loop.
export const fullThemeFile='11_theme_full_Who_Deserves_to_Live.mp3';

const CROSSFADE=1.5,TRACK_LEVEL=0.36;
const themes={
 home:{bass:55,notes:[0,3,7,3,10,7,3,0],rate:740,wave:'triangle'},
 library:{bass:65.4,notes:[0,1,7,6,3,1,0,-2],rate:620,wave:'sine'},
 mine:{bass:49,notes:[0,0,5,3,0,8,5,3],rate:570,wave:'sawtooth'},
 crypt:{bass:58.3,notes:[0,7,5,1,0,7,8,5],rate:880,wave:'sine'},
 queen:{bass:69.3,notes:[0,3,7,10,7,3,2,0],rate:760,wave:'triangle'},
 mirror:{bass:51.9,notes:[0,1,6,7,0,10,6,1],rate:540,wave:'triangle'},
 dawn:{bass:73.4,notes:[0,4,7,12,11,7,4,2],rate:790,wave:'sine'},
 frost:{bass:55,notes:[0,3,5,1,-2,0,3,-2],rate:930,wave:'sine'},
 crown:{bass:61.7,notes:[0,1,6,5,3,1,0,-1],rate:630,wave:'sawtooth'}
};

export function createSoundtrack({mixer=createMixer()}={}){
 let active=false,scene='home',current=null,synthTimer=null,synthTick=0,synthGain=null,generation=0;

 const ramp=(gain,to,seconds)=>{const now=mixer.context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);gain.gain.linearRampToValueAtTime(to,now+seconds);};
 const retire=track=>{
  if(!track)return;
  ramp(track.gain,0,CROSSFADE);
  setTimeout(()=>{track.element.pause();track.element.removeAttribute('src');track.element.load();track.source.disconnect();track.gain.disconnect();},CROSSFADE*1000+100);
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
  const theme=themes[scene]||themes.home,note=theme.notes[synthTick%theme.notes.length];
  const time=mixer.context.currentTime+0.015;
  tone(theme.bass*4*Math.pow(2,note/12),time,Math.min(theme.rate/1000*1.9,1.5),theme.wave,0.085);
  if(synthTick%4===0)tone(theme.bass*2,time,2.2,'sine',0.06);
  if(synthTick%8===0)tone(theme.bass*8,time,0.52,'sine',0.02);
  synthTick++;
 };
 const startSynth=()=>{
  if(!mixer.context||synthGain)return;
  synthGain=mixer.context.createGain();synthGain.gain.value=0.9;synthGain.connect(mixer.bus('music'));
  synthTick=0;nextSynthNote();
  synthTimer=setInterval(nextSynthNote,(themes[scene]||themes.home).rate);
 };
 const stopSynth=()=>{
  clearInterval(synthTimer);synthTimer=null;
  if(synthGain){const gain=synthGain;synthGain=null;setTimeout(()=>gain.disconnect(),CROSSFADE*1000+100);}
 };

 const playFile=(id,file,token)=>{
  const context=mixer.context,element=new Audio('assets/music/'+file);
  element.loop=true;element.preload='auto';
  const gain=context.createGain();gain.gain.value=0;
  const source=context.createMediaElementSource(element);
  source.connect(gain);gain.connect(mixer.bus('music'));
  const track={id,element,gain,source,ready:false};
  element.addEventListener('canplay',()=>{
   if(token!==generation||current!==track)return;
   element.play().then(()=>{if(token!==generation)return;track.ready=true;stopSynth();ramp(gain,TRACK_LEVEL,CROSSFADE);}).catch(()=>{});
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
  if(!active||!soundtrackFiles[id])return;
  if(current&&current.id===id)return;
  const token=++generation,old=current;
  current=playFile(id,soundtrackFiles[id],token);
  retire(old);
 };

 const start=async current=>{
  if(current&&soundtrackFiles[current])scene=current;
  await mixer.resume();
  active=true;
  play(scene);
 };
 const select=id=>{
  if(!soundtrackFiles[id])return;
  scene=id;
  if(active){
   if(!current||current.id!==id)play(id);
   if(synthGain)stopSynth(),startSynth();
  }
 };
 const stop=()=>{
  active=false;generation++;
  stopSynth();
  if(current){current.element.pause();current=null;}
  mixer.suspend();
 };
 const getStatus=()=>({
  scene,active,
  source:active?(current?.ready?'mp3':synthGain?'synth':'silent'):'silent',
  currentTime:current?.element.currentTime||0,
  loop:current?.element.loop||false,
  synthGain:synthGain?.gain.value??0
 });
 return {start,select,stop,getStatus,mixer};
}
