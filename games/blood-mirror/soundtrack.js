// Optional mastered MP3s with an instant, offline WebAudio orchestral fallback.
const files={
 home:'00_title_The_Mirror_Lied_First.mp3',library:'01_library_Black_Bell_Archive.mp3',
 mine:'02_mine_Seven_Forgotten_Names.mp3',crypt:'03_crypt_Glass_Sleep.mp3',
 queen:'04_queen_The_Queens_Lament.mp3',mirror:'05_mirror_A_Name_for_a_Life.mp3',
 dawn:'06_dawn_Nameless_Dawn.mp3',frost:'07_frost_Winter_Without_Names.mp3',
 crown:'08_crown_Crown_of_Blood.mp3'
};
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
export function createSoundtrack(){
 let ctx=null,master=null,active=false,scene='home',clip=null,interval=null,tick=0,drone=null,droneGain=null,generation=0;
 const tone=(frequency,time,length,wave,volume)=>{
  if(!ctx||!master)return;
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=wave;osc.frequency.value=frequency;
  gain.gain.setValueAtTime(.0001,time);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume,.0002),time+.035);
  gain.gain.exponentialRampToValueAtTime(.0001,time+length);
  osc.connect(gain);gain.connect(master);osc.start(time);osc.stop(time+length+.02);
  osc.onended=()=>{osc.disconnect();gain.disconnect();};
 };
 const next=()=>{
  if(!active||!ctx||ctx.state!=='running'||clip?.dataset.ready==='yes')return;
  const t=themes[scene]||themes.home,n=t.notes[tick%t.notes.length],time=ctx.currentTime+.015;
  const freq=t.bass*4*Math.pow(2,n/12);
  tone(freq,time,Math.min(t.rate/1000*1.9,1.5),t.wave,.085);
  if(tick%4===0)tone(t.bass*2,time,2.2,'sine',.06);
  if(tick%8===0)tone(t.bass*8,time,.52,'sine',.02);
  tick++;
 };
 const stopClip=()=>{if(clip){clip.pause();clip.src='';clip=null;}};
 const changeDrone=()=>{
  if(!ctx||!master)return;
  if(drone){try{drone.stop();}catch{}drone.disconnect();droneGain.disconnect();}
  const t=themes[scene]||themes.home;
  drone=ctx.createOscillator();droneGain=ctx.createGain();
  drone.type='sine';drone.frequency.value=t.bass;droneGain.gain.value=.04;
  drone.connect(droneGain);droneGain.connect(master);drone.start();
 };
 const loadTrack=()=>{
  stopClip();if(!active||typeof Audio==='undefined')return;
  const id=++generation,file=files[scene];if(!file)return;
  const player=new Audio('assets/music/'+file);
  clip=player;player.loop=true;player.preload='auto';player.volume=0;
  player.addEventListener('canplay',()=>{
   if(!active||id!==generation||clip!==player)return;
   player.play().then(()=>{player.dataset.ready='yes';const start=performance.now();
    const fade=()=>{if(!active||clip!==player)return;player.volume=Math.min(.36,(performance.now()-start)/1000*.36);if(player.volume<.36)requestAnimationFrame(fade);};fade();
   }).catch(()=>{});
  },{once:true});
  player.addEventListener('error',()=>{if(clip===player){clip=null;}},{once:true});
  player.load();
 };
 const start=async(current)=>{
  if(current&&files[current])scene=current;
  if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)throw Error('WebAudio unavailable');
   ctx=new C();master=ctx.createGain();master.gain.value=.20;master.connect(ctx.destination);}
  active=true;await ctx.resume();changeDrone();
  clearInterval(interval);tick=0;next();interval=setInterval(next,(themes[scene]||themes.home).rate);
  loadTrack();
 };
 const select=(id)=>{
  if(!files[id]||scene===id)return;scene=id;generation++;
  if(active){clearInterval(interval);tick=0;changeDrone();next();interval=setInterval(next,(themes[scene]||themes.home).rate);loadTrack();}
 };
 const stop=()=>{active=false;generation++;stopClip();clearInterval(interval);interval=null;
  if(drone){try{drone.stop();}catch{}drone.disconnect();droneGain.disconnect();drone=null;}ctx?.suspend().catch(()=>{});};
 return {start,select,stop};
}