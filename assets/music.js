(() => {
 'use strict';
 // Music room player: playlist, shuffle, repeat (all/one/off), seek, volume, lyrics panel and lock-screen controls.
 // Preferences (shuffle, repeat, volume) stay in this browser's localStorage only.
 const root=document.querySelector('[data-music-player]');
 if(!root)return;
 const one=selector=>root.querySelector(selector);
 const audio=one('[data-audio]'),playButtons=Array.from(root.querySelectorAll('[data-play]')),seek=one('[data-seek]'),volume=one('[data-volume]');
 const shuffleButton=one('[data-shuffle]'),repeatButton=one('[data-repeat]'),muteButton=one('[data-mute]');
 const nowPlaying=one('.now-playing'),status=one('[data-player-status]'),mini=one('[data-mini]');
 const rows=Array.from(root.querySelectorAll('[data-track]'));
 // Each playlist row carries its song's data, so the page needs no inline script (the CSP forbids one).
 const tracks=rows.map(r=>({slug:r.dataset.slug,title:r.dataset.title,edition:r.dataset.edition,palette:r.dataset.palette,src:r.dataset.src}));
 const album=root.dataset.album,artwork=root.dataset.artwork;
 const details=Array.from(document.querySelectorAll('[data-song-detail]'));
 const key='lucaslab.music.preferences';
 const REPEAT_LABEL={all:'循環播放：全部',one:'循環播放：單曲',off:'循環播放：關閉'};
 const clock=s=>!Number.isFinite(s)||s<0?'0:00':Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
 const prefs={shuffle:false,repeat:'all',volume:0.9,muted:false};
 try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved){prefs.shuffle=saved.shuffle===true;prefs.repeat=['all','one','off'].includes(saved.repeat)?saved.repeat:'all';prefs.volume=Number.isFinite(saved.volume)?Math.min(1,Math.max(0,saved.volume)):0.9;prefs.muted=saved.muted===true}}catch{}
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(prefs))}catch{}};
 let index=0,order=[],seeking=false;

 // Shuffle plays every track once per round, starting from the current one, before any repeats.
 const buildOrder=()=>{
  order=tracks.map((_,i)=>i);
  if(prefs.shuffle){
   order=order.filter(i=>i!==index);
   for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
   order.unshift(index);
  }
 };
 const step=dir=>{
  const pos=order.indexOf(index),next=pos+dir;
  if(next>=order.length){
   if(prefs.repeat==='off')return -1;
   // A new shuffle round starts from the song that just finished, so it never plays twice in a row.
   if(prefs.shuffle){buildOrder();return order[1]??order[0]}
   return order[0];
  }
  if(next<0)return order[order.length-1];
  return order[next];
 };

 const showDetail=i=>details.forEach(d=>{d.hidden=Number(d.dataset.songDetail)!==i});
 const load=(i,{play=false,updateHash=true}={})=>{
  index=i;const t=tracks[i];
  audio.src=t.src;
  one('[data-np-title]').textContent=t.title;one('[data-mini-title]').textContent=t.title;
  one('[data-np-edition]').textContent=t.edition;
  nowPlaying.dataset.palette=t.palette;
  seek.value='0';one('[data-time-current]').textContent='0:00';
  rows.forEach(r=>{const active=Number(r.dataset.track)===i;r.classList.toggle('is-current',active);if(active)r.setAttribute('aria-current','true');else r.removeAttribute('aria-current')});
  showDetail(i);
  if(updateHash)history.replaceState(null,'','#'+t.slug);
  if('mediaSession' in navigator)navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:'LUCAS LAB',album,artwork:[{src:artwork,sizes:'360x540',type:'image/webp'}]});
  if(play)start();
 };
 const start=()=>{const p=audio.play();if(p&&p.catch)p.catch(()=>{status.textContent='瀏覽器阻擋了自動播放，請按下播放鍵。'})};
 const go=dir=>{const n=step(dir);if(n<0){audio.pause();audio.currentTime=0;return}load(n,{play:true})};

 const renderShuffle=()=>{shuffleButton.setAttribute('aria-pressed',String(prefs.shuffle));shuffleButton.setAttribute('aria-label',prefs.shuffle?'隨機播放：開啟':'隨機播放：關閉')};
 const renderRepeat=()=>{repeatButton.dataset.mode=prefs.repeat;repeatButton.setAttribute('aria-label',REPEAT_LABEL[prefs.repeat]);repeatButton.setAttribute('aria-pressed',String(prefs.repeat!=='off'))};
 const renderVolume=()=>{audio.volume=prefs.volume;audio.muted=prefs.muted;volume.value=String(prefs.volume);muteButton.setAttribute('aria-pressed',String(prefs.muted));muteButton.setAttribute('aria-label',prefs.muted?'取消靜音':'靜音');volume.style.setProperty('--fill',(prefs.muted?0:prefs.volume*100)+'%')};

 playButtons.forEach(b=>b.addEventListener('click',()=>{if(audio.paused)start();else audio.pause()}));
 one('[data-prev]').addEventListener('click',()=>{if(audio.currentTime>3){audio.currentTime=0;return}go(-1)});
 root.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>{const n=step(1);load(n<0?order[0]:n,{play:!audio.paused})}));
 shuffleButton.addEventListener('click',()=>{prefs.shuffle=!prefs.shuffle;buildOrder();renderShuffle();save()});
 repeatButton.addEventListener('click',()=>{prefs.repeat={all:'one',one:'off',off:'all'}[prefs.repeat];renderRepeat();save()});
 muteButton.addEventListener('click',()=>{prefs.muted=!prefs.muted;renderVolume();save()});
 volume.addEventListener('input',()=>{prefs.volume=Number(volume.value);prefs.muted=prefs.volume===0;renderVolume();save()});
 rows.forEach(r=>r.addEventListener('click',()=>{const i=Number(r.dataset.track);if(i===index){if(audio.paused)start();else audio.pause();return}load(i,{play:true});if(prefs.shuffle)buildOrder()}));

 seek.addEventListener('input',()=>{seeking=true;one('[data-time-current]').textContent=clock(Number(seek.value));seek.style.setProperty('--fill',(Number(seek.value)/(Number(seek.max)||1)*100)+'%')});
 seek.addEventListener('change',()=>{audio.currentTime=Number(seek.value);seeking=false});
 audio.addEventListener('loadedmetadata',()=>{seek.max=String(Math.floor(audio.duration));one('[data-time-total]').textContent=clock(audio.duration)});
 audio.addEventListener('timeupdate',()=>{if(seeking)return;seek.value=String(Math.floor(audio.currentTime));one('[data-time-current]').textContent=one('[data-mini-time]').textContent=clock(audio.currentTime);seek.style.setProperty('--fill',(audio.currentTime/(audio.duration||1)*100)+'%')});
 audio.addEventListener('play',()=>{root.classList.add('is-playing');playButtons.forEach(b=>b.setAttribute('aria-label','暫停'));status.textContent=''});
 audio.addEventListener('pause',()=>{root.classList.remove('is-playing');playButtons.forEach(b=>b.setAttribute('aria-label','播放'))});
 audio.addEventListener('ended',()=>{if(prefs.repeat==='one'){audio.currentTime=0;start();return}go(1)});
 audio.addEventListener('error',()=>{status.textContent='音檔載入失敗，請稍後再試或換一首。'});

 if('mediaSession' in navigator){
  const set=(action,fn)=>{try{navigator.mediaSession.setActionHandler(action,fn)}catch{}};
  set('play',start);set('pause',()=>audio.pause());set('previoustrack',()=>go(-1));set('nexttrack',()=>go(1));
  set('seekto',e=>{if(Number.isFinite(e.seekTime))audio.currentTime=e.seekTime});
 }

 // While the main panel is scrolled away (for example when reading lyrics), a slim bar keeps play/pause and next in reach once a song has started.
 let started=false,panelVisible=true;
 const renderMini=()=>{mini.hidden=!started||panelVisible};
 audio.addEventListener('play',()=>{started=true;renderMini()},{once:true});
 if('IntersectionObserver' in window)new IntersectionObserver(([entry])=>{panelVisible=entry.isIntersecting;renderMini()},{threshold:0.15}).observe(nowPlaying);

 // Section list and intensity chart: jump to a moment; the chart shades what has been played.
 // Positions are set through CSSOM because the CSP blocks inline style attributes.
 document.querySelectorAll('[data-peak]').forEach(label=>{label.style.left=label.dataset.peak+'%'});
 const jump=seconds=>{audio.currentTime=seconds;if(audio.paused)start()};
 document.querySelectorAll('[data-seek-to]').forEach(b=>b.addEventListener('click',()=>jump(Number(b.dataset.seekTo))));
 document.querySelectorAll('[data-energy]').forEach(chart=>chart.addEventListener('click',event=>{const r=chart.getBoundingClientRect();jump((event.clientX-r.left)/r.width*(audio.duration||0))}));
 const paintProgress=()=>{const bar=details[index]?.querySelector('.energy-progress');if(bar)bar.style.width=(audio.currentTime/(audio.duration||1)*100)+'%'};
 audio.addEventListener('timeupdate',paintProgress);
 audio.addEventListener('emptied',paintProgress);

 // A #slug link opens that song (without autoplay, which browsers block anyway).
 const fromHash=tracks.findIndex(t=>'#'+t.slug===location.hash);
 load(fromHash>=0?fromHash:0,{updateHash:false});
 buildOrder();renderShuffle();renderRepeat();renderVolume();
})();
