import { clampSeekTarget, isAudioTimeSeekable } from './audioSeek';
export function mountMusicPlayer(root,audio){
 'use strict';
 // Music room player: playlist, shuffle, repeat, seek, keyboard shortcuts, volume, lyrics and lock-screen controls.
 // Preferences stay in this browser's localStorage only.
 const lifetime=new AbortController();
 const listen=(target,type,handler,options={})=>{
  const normalized=typeof options==='boolean'?{capture:options}:options;
  target.addEventListener(type,handler,{...normalized,signal:lifetime.signal});
 };
 let observer=null,blobLoadController=null,destroyed=false;
 const one=selector=>root.querySelector(selector);
 const playButtons=Array.from(root.querySelectorAll('[data-play]')),seek=one('[data-seek]'),volume=one('[data-volume]');
 const shuffleButton=one('[data-shuffle]'),repeatButton=one('[data-repeat]'),muteButton=one('[data-mute]');
 const nowPlaying=one('.now-playing'),status=one('[data-player-status]'),mini=one('[data-mini]');
 const buffer=one('[data-buffer]'),tip=one('[data-seek-tip]'),miniProgress=one('[data-mini-progress]');
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
 let index=0,order=[],seeking=false,blobUrl='',pendingSeek=null,loadingBlob=null;

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
  if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=''}
  blobLoadController?.abort();blobLoadController=null;
  pendingSeek=null;loadingBlob=null;
  audio.src=t.src;
  one('[data-np-title]').textContent=t.title;one('[data-mini-title]').textContent=t.title;
  one('[data-np-edition]').textContent=t.edition;
  nowPlaying.dataset.palette=t.palette;
  seek.value='0';one('[data-time-current]').textContent='0:00';paint(0);
  rows.forEach(r=>{const active=Number(r.dataset.track)===i;r.classList.toggle('is-current',active);if(active)r.setAttribute('aria-current','true');else r.removeAttribute('aria-current')});
  showDetail(i);
  if(updateHash)history.replaceState(null,'','#'+t.slug);
  if('mediaSession' in navigator)navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:'LUCAS LAB',album,artwork:[{src:artwork,sizes:'360x540',type:'image/webp'}]});
  if(play)start();
 };
 // Only a real autoplay block is reported; an AbortError just means a newer load or seek replaced this play request.
 const start=()=>{const p=audio.play();if(p&&p.catch)p.catch(error=>{if(error&&error.name==='NotAllowedError')status.textContent='瀏覽器阻擋了自動播放，請按下播放鍵。'})};
 const go=dir=>{const n=step(dir);if(n<0){audio.pause();audio.currentTime=0;return}load(n,{play:true})};

 const renderShuffle=()=>{shuffleButton.setAttribute('aria-pressed',String(prefs.shuffle));shuffleButton.setAttribute('aria-label',prefs.shuffle?'隨機播放：開啟':'隨機播放：關閉')};
 const renderRepeat=()=>{repeatButton.dataset.mode=prefs.repeat;repeatButton.setAttribute('aria-label',REPEAT_LABEL[prefs.repeat]);repeatButton.setAttribute('aria-pressed',String(prefs.repeat!=='off'))};
 const renderVolume=()=>{audio.volume=prefs.volume;audio.muted=prefs.muted;volume.value=String(prefs.volume);muteButton.setAttribute('aria-pressed',String(prefs.muted));muteButton.setAttribute('aria-label',prefs.muted?'取消靜音':'靜音');volume.style.setProperty('--fill',(prefs.muted?0:prefs.volume*100)+'%')};

 playButtons.forEach(b=>listen(b,'click',()=>{if(audio.paused)start();else audio.pause()}));
 listen(one('[data-prev]'),'click',()=>{if(audio.currentTime>3){seekTo(0);return}go(-1)});
 root.querySelectorAll('[data-next]').forEach(b=>listen(b,'click',()=>{const n=step(1);load(n<0?order[0]:n,{play:!audio.paused})}));
 listen(shuffleButton,'click',()=>{prefs.shuffle=!prefs.shuffle;buildOrder();renderShuffle();save()});
 listen(repeatButton,'click',()=>{prefs.repeat={all:'one',one:'off',off:'all'}[prefs.repeat];renderRepeat();save()});
 listen(muteButton,'click',()=>{prefs.muted=!prefs.muted;renderVolume();save()});
 listen(volume,'input',()=>{prefs.volume=Number(volume.value);prefs.muted=prefs.volume===0;renderVolume();save()});
 rows.forEach(r=>listen(r,'click',()=>{const i=Number(r.dataset.track);if(i===index){if(audio.paused)start();else audio.pause();return}load(i,{play:true});if(prefs.shuffle)buildOrder()}));

 // Seeking. A host that ignores byte ranges serves songs as non-seekable, and the browser would snap back to 0:00.
 // The site's Worker answers ranges, but as a fallback the song is fetched once into memory, where every position is seekable.
 const duration=()=>Number.isFinite(audio.duration)?audio.duration:tracks[index].duration||0;
 const canSeek=t=>isAudioTimeSeekable(audio.seekable,t);
 const paint=t=>{
  const d=duration()||1,pct=Math.min(100,Math.max(0,t/d*100))+'%';
  seek.style.setProperty('--fill',pct);if(miniProgress)miniProgress.style.width=pct;
  seek.setAttribute('aria-valuetext',clock(t)+' / '+clock(d));
 };
 const loadWhole=()=>{
  if(loadingBlob)return loadingBlob;
  const src=tracks[index].src,mine=index;
  status.textContent='正在載入整首歌曲，以便跳轉…';
  blobLoadController=new AbortController();
  loadingBlob=fetch(src,{signal:blobLoadController.signal}).then(r=>{if(!r.ok)throw new Error(r.status);return r.blob()}).then(blob=>new Promise(resolve=>{
   if(mine!==index)return resolve(false);
   const wasPlaying=!audio.paused;blobUrl=URL.createObjectURL(blob);audio.src=blobUrl;
   // Playback resumes once the pending seek has landed in the in-memory copy.
   listen(audio,'loadedmetadata',()=>{status.textContent='';if(wasPlaying)listen(audio,'canplay',start,{once:true});resolve(true)},{once:true});
  })).catch(error=>{if(!destroyed&&error?.name!=='AbortError')status.textContent='無法跳轉：音檔載入失敗，請稍後再試。';loadingBlob=null;return false});
  return loadingBlob;
 };
 const seekTo=t=>{
  t=clampSeekTarget(t,duration());
  paint(t);one('[data-time-current]').textContent=clock(t);seek.value=String(t);
  if(audio.readyState<1){pendingSeek=t;return}
  if(canSeek(t)||blobUrl){audio.currentTime=t;return}
  pendingSeek=t;loadWhole();
 };
 listen(audio,'loadedmetadata',()=>{if(pendingSeek!==null){const t=pendingSeek;pendingSeek=null;seekTo(t)}});
 const skip=delta=>seekTo((seeking?Number(seek.value):audio.currentTime)+delta);
 root.querySelectorAll('[data-skip]').forEach(b=>listen(b,'click',()=>skip(Number(b.dataset.skip))));

 listen(seek,'input',()=>{seeking=true;const t=Number(seek.value);one('[data-time-current]').textContent=clock(t);paint(t)});
 // Pointer drags commit on release; keyboard arrows and taps commit at once through "change".
 listen(seek,'change',()=>{seeking=false;seekTo(Number(seek.value))});
 listen(seek,'pointerup',()=>{if(seeking){seeking=false;seekTo(Number(seek.value))}});
 // Hover preview of the time under the pointer.
 // On the focused progress bar, arrows move 5 s and Page Up/Down 30 s, matching the global shortcuts.
 listen(seek,'keydown',event=>{
  const delta={ArrowLeft:-5,ArrowDown:-5,ArrowRight:5,ArrowUp:5,PageDown:-30,PageUp:30}[event.key];
  if(delta===undefined)return;event.preventDefault();skip(delta);
 });
 listen(seek,'pointermove',event=>{
  if(!tip||event.pointerType==='touch')return;
  const r=seek.getBoundingClientRect(),x=Math.min(1,Math.max(0,(event.clientX-r.left)/r.width));
  tip.hidden=false;tip.textContent=clock(x*duration());tip.style.left=(x*100)+'%';
 });
 listen(seek,'pointerleave',()=>{if(tip)tip.hidden=true});
 const paintBuffer=()=>{
  if(!buffer)return;const d=duration();let end=0;
  for(let i=0;i<audio.buffered.length;i++)if(audio.buffered.start(i)<=audio.currentTime+0.5)end=Math.max(end,audio.buffered.end(i));
  buffer.style.width=(d?Math.min(100,end/d*100):0)+'%';
 };
 listen(audio,'progress',paintBuffer);
 listen(audio,'loadedmetadata',()=>{seek.max=String(duration());one('[data-time-total]').textContent=clock(duration());paintBuffer()});
 listen(audio,'timeupdate',()=>{
  paintBuffer();
  if(seeking)return;
  seek.value=String(audio.currentTime);one('[data-time-current]').textContent=one('[data-mini-time]').textContent=clock(audio.currentTime);paint(audio.currentTime);
  if('mediaSession' in navigator&&navigator.mediaSession.setPositionState&&Number.isFinite(audio.duration)){try{navigator.mediaSession.setPositionState({duration:audio.duration,playbackRate:audio.playbackRate,position:Math.min(audio.currentTime,audio.duration)})}catch{}}
 });
 listen(audio,'play',()=>{root.classList.add('is-playing');playButtons.forEach(b=>b.setAttribute('aria-label','暫停'));status.textContent=''});
 listen(audio,'pause',()=>{root.classList.remove('is-playing');playButtons.forEach(b=>b.setAttribute('aria-label','播放'))});
 listen(audio,'ended',()=>{if(prefs.repeat==='one'){audio.currentTime=0;start();return}go(1)});
 listen(audio,'error',()=>{status.textContent='音檔載入失敗，請稍後再試或換一首。'});

 if('mediaSession' in navigator){
  const set=(action,fn)=>{try{navigator.mediaSession.setActionHandler(action,fn)}catch{}};
  set('play',start);set('pause',()=>audio.pause());set('previoustrack',()=>go(-1));set('nexttrack',()=>go(1));
  set('seekto',e=>{if(Number.isFinite(e.seekTime))seekTo(e.seekTime)});
  set('seekbackward',e=>skip(-(e.seekOffset||10)));set('seekforward',e=>skip(e.seekOffset||10));
 }

 // While the main panel is scrolled away (for example when reading lyrics), a slim bar keeps play/pause and next in reach once a song has started.
 let started=false,panelVisible=true;
 const renderMini=()=>{mini.hidden=!started||panelVisible};
 listen(audio,'play',()=>{started=true;renderMini()},{once:true});
 if('IntersectionObserver' in window){observer=new IntersectionObserver(([entry])=>{panelVisible=entry.isIntersecting;renderMini()},{threshold:0.15});observer.observe(nowPlaying)}

 // Section list and intensity chart: jump to a moment; the chart shades what has been played.
 // Positions are set through CSSOM because the CSP blocks inline style attributes.
 document.querySelectorAll('[data-peak]').forEach(label=>{label.style.left=label.dataset.peak+'%'});
 const jump=seconds=>{seekTo(seconds);if(audio.paused)start()};
 document.querySelectorAll('[data-seek-to]').forEach(b=>listen(b,'click',()=>jump(Number(b.dataset.seekTo))));
 document.querySelectorAll('[data-energy]').forEach(chart=>listen(chart,'click',event=>{const r=chart.getBoundingClientRect();jump((event.clientX-r.left)/r.width*(audio.duration||0))}));
 const paintProgress=()=>{const bar=details[index]?.querySelector('.energy-progress');if(bar)bar.style.width=(audio.currentTime/(audio.duration||1)*100)+'%'};
 listen(audio,'timeupdate',paintProgress);
 listen(audio,'emptied',paintProgress);

 // Keyboard shortcuts, ignored while typing or while a control that uses the same keys has focus.
 listen(document,'keydown',event=>{
  if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey)return;
  const el=event.target,tagName=el&&el.tagName;
  if(tagName==='INPUT'||tagName==='TEXTAREA'||tagName==='SELECT'||(el&&el.isContentEditable))return;
  if(event.key===' '||event.key==='k'||event.key==='K'){
   if(event.key===' '&&(tagName==='BUTTON'||tagName==='A'))return;
   event.preventDefault();if(audio.paused)start();else audio.pause();return;
  }
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
   const dir=event.key==='ArrowLeft'?-1:1;event.preventDefault();
   if(event.shiftKey){if(dir<0&&audio.currentTime>3)seekTo(0);else go(dir)}else skip(dir*5);return;
  }
  if(event.key==='j'||event.key==='J'){event.preventDefault();skip(-10)}
  else if(event.key==='l'||event.key==='L'){event.preventDefault();skip(10)}
 });

 // A #slug link opens that song (without autoplay, which browsers block anyway).
 const fromHash=tracks.findIndex(t=>'#'+t.slug===location.hash);
 load(fromHash>=0?fromHash:0,{updateHash:false});
 buildOrder();renderShuffle();renderRepeat();renderVolume();
 return ()=>{
  if(destroyed)return;
  destroyed=true;
  lifetime.abort();
  blobLoadController?.abort();
  observer?.disconnect();
  if(blobUrl)URL.revokeObjectURL(blobUrl);
  audio.pause();
  if('mediaSession' in navigator){
   for(const action of ['play','pause','previoustrack','nexttrack','seekto','seekbackward','seekforward']){
    try{navigator.mediaSession.setActionHandler(action,null)}catch{}
   }
  }
  audio.destroy();
 };
}
