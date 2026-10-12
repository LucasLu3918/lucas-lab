'use strict';
// Music room: original AI songs with a playlist player (assets/music.js), full lyrics and per-song notes.
// Audio ships from music/audio/ to dist/music/audio/, outside /assets/, so the offline service worker never caches it.
const ALBUM='白雪公主：血色魔鏡・原聲概念集';
const ART='assets/images/snow-white-portrait-small.webp';
// Lyric tags from the generation files: structure tags become section titles, every other tag is a performance cue.
const SECTIONS={'intro':'前奏','verse':'主歌','verse 1':'主歌一','verse 2':'主歌二','pre-chorus':'導歌','chorus':'副歌','post-chorus':'副歌後段','bridge':'橋段','final chorus':'最終副歌','outro':'尾聲'};
const CUES={'instrumental':'器樂','instrumental fade':'器樂淡出','soft piano':'柔和鋼琴','orchestral build':'管弦漸強','emotional orchestral build':'管弦漸強','emotional build':'情緒漸強','soft wordless female vocal':'輕柔無詞女聲','wordless female vocal':'無詞女聲','soft falsetto':'輕柔假音','whispered vocal':'耳語人聲'};

function parseLyrics(text){
 const sections=[];let current=null;
 for(const raw of text.split(/\r?\n/)){
  const line=raw.trim();
  const tag=line.match(/^\[(.+)\]$/);
  if(tag){
   const key=tag[1].trim().toLowerCase();
   if(SECTIONS[key]){current={title:SECTIONS[key],cues:[],lines:[]};sections.push(current);continue}
   if(!current){current={title:'',cues:[],lines:[]};sections.push(current)}
   // A cue after lyric lines starts its own untitled block, so "[Instrumental]" between choruses reads as an interlude.
   if(current.lines.length){current={title:'',cues:[],lines:[]};sections.push(current)}
   current.cues.push(CUES[key]||tag[1].trim());
   continue;
  }
  if(!line)continue;
  if(!current){current={title:'',cues:[],lines:[]};sections.push(current)}
  current.lines.push(line);
 }
 return sections.map((s,i)=>s.title||s.lines.length?s:{...s,title:i===sections.length-1?'尾奏':'間奏'});
}

const clock=seconds=>Math.floor(seconds/60)+':'+String(Math.round(seconds%60)).padStart(2,'0');

module.exports=function renderMusic(ctx){
 const {fs,path,root,out,catalog,url,ext,e,icon,asset,page,write,intro}=ctx;
 const tracks=catalog.music;
 const destination=path.join(out,'music','audio');fs.mkdirSync(destination,{recursive:true});
 for(const t of tracks)fs.copyFileSync(path.join(root,t.audio),path.join(out,t.audio));
 const lyricsMarkup=t=>parseLyrics(fs.readFileSync(path.join(root,t.lyrics),'utf8')).map(s=>`<section class="lyric-block">${s.title?`<h4>${e(s.title)}</h4>`:''}${s.cues.map(c=>`<p class="lyric-cue">${e(c)}</p>`).join('')}${s.lines.map(l=>`<p>${e(l)}</p>`).join('')}</section>`).join('');
 const spec=(label,value)=>`<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`;
 // Loudness curve of the real recording (2-second steps), with the strongest moment marked; the overlay tracks playback.
 const chart=t=>{
  const n=t.energy.length,W=600,H=90,x=i=>(i/(n-1)*W).toFixed(1),y=v=>(H-4-v/100*(H-12)).toFixed(1);
  const line=t.energy.map((v,i)=>(i?'L':'M')+x(i)+' '+y(v)).join(''),peak=t.peak/t.duration*W;
  const marks=t.timeline.slice(1).map(s=>`<line x1="${(s.start/t.duration*W).toFixed(1)}" x2="${(s.start/t.duration*W).toFixed(1)}" y1="0" y2="${H}" class="energy-mark"/>`).join('');
  return `<div class="energy-chart" data-energy role="img" aria-label="${e(t.title+' 強度曲線：最強處約在 '+clock(t.peak))}"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${marks}<path class="energy-area" d="${line}L${W} ${H}L0 ${H}Z"/><path class="energy-line" d="${line}"/><line class="energy-peak" x1="${peak.toFixed(1)}" x2="${peak.toFixed(1)}" y1="0" y2="${H}"/></svg><span class="energy-progress" aria-hidden="true"></span><span class="energy-peak-label" data-peak="${(peak/W*100).toFixed(1)}">最強 ${clock(t.peak)}</span></div><div class="energy-axis" aria-hidden="true"><span>0:00</span><span>${clock(t.duration)}</span></div>`;
 };
 const detail=(t,i)=>`<article class="song-detail" id="song-${e(t.slug)}" data-song-detail="${i}"${i?' hidden':''} aria-labelledby="song-title-${e(t.slug)}"><div class="song-notes"><div class="eyebrow">TRACK ${String(i+1).padStart(2,'0')} · ${e(t.edition)}</div><h2 id="song-title-${e(t.slug)}">${e(t.title)}</h2><p class="song-english">${e(t.english)}</p><p>${e(t.description)}</p><dl class="song-spec">${spec('曲風',t.style)}${spec('實際長度',clock(t.duration))}${spec('節奏／調性（創作設定）',t.bpm+' BPM · '+t.key+' · '+t.meter)}${spec('人聲',t.vocal)}${spec('核心樂器',t.instruments.join('、'))}${spec('情緒走向',t.mood.join(' → '))}${spec('適合場景',t.bestFor)}</dl><h3>歌曲特色</h3><ul class="song-highlights">${t.highlights.map(h=>`<li>${e(h)}</li>`).join('')}</ul><h3>強度曲線與段落</h3>${chart(t)}<ol class="song-timeline">${t.timeline.map(s=>`<li><button type="button" class="song-jump" data-seek-to="${s.start}" aria-label="${e('從 '+clock(s.start)+' 播放：'+s.title)}"><span class="song-time">${clock(s.start)}–${clock(s.end)}</span><strong>${e(s.title)}</strong><span>${e(s.desc)}</span></button></li>`).join('')}</ol><p class="song-footnote">段落時間與強度曲線由實際音檔的音量與音色變化分析而來；各段對應的歌詞段落為推定。點選段落可直接跳到該處播放。</p></div><div class="song-lyrics" tabindex="0" aria-label="${e(t.title)}歌詞"><h3>歌詞</h3>${lyricsMarkup(t)}</div></article>`;
 const row=(t,i)=>`<li><button type="button" class="track-row" data-track="${i}" data-slug="${e(t.slug)}" data-title="${e(t.title)}" data-edition="${e(t.edition)}" data-palette="${e(t.palette)}" data-src="${e(url(t.audio))}" aria-label="${e('播放 '+t.title+'（'+t.edition+'）')}"><span class="track-no" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span class="track-name"><strong>${e(t.title)}</strong><span>${e(t.edition)} · ${e(t.style)}</span></span><span class="track-meta">${t.bpm} BPM · ${e(t.key.replace(/（.*）/,''))}</span><span class="track-time">${clock(t.duration)}</span></button></li>`;
 const compare=`<div class="table-scroll" tabindex="0" role="region" aria-label="版本比較表"><table class="song-compare"><thead><tr><th scope="col">歌曲</th><th scope="col">版本</th><th scope="col">實際長度</th><th scope="col">設定節奏／調性</th><th scope="col">人聲</th><th scope="col">情緒走向</th><th scope="col">適合場景</th></tr></thead><tbody>${tracks.map(t=>`<tr><th scope="row">${e(t.title)}</th><td>${e(t.edition)}</td><td>${clock(t.duration)}</td><td>${t.bpm} BPM · ${e(t.key)}</td><td>${e(t.vocal)}</td><td>${e(t.mood.join('→'))}</td><td>${e(t.bestFor)}</td></tr>`).join('')}</tbody></table></div>`;
 const btn=(attr,label,svg,extra='')=>`<button type="button" class="player-btn" ${attr} aria-label="${label}"${extra}>${svg}</button>`;
 const svg=d=>`<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
 const icons={
  shuffle:svg('<path d="M3 6h3c5 0 7 12 12 12h3m0 0-3-3m3 3-3 3M3 18h3c2 0 3-2 4-4m4-4c1-2 2-4 4-4h3m0 0-3-3m3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'),
  prev:svg('<path d="M6 5v14M19 5 9 12l10 7Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'),
  next:svg('<path d="M18 5v14M5 5l10 7-10 7Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'),
  play:svg('<path class="i-play" d="M8 5v14l11-7Z" fill="currentColor"/><path class="i-pause" d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z" fill="currentColor"/>'),
  repeat:svg('<path d="M4 11V9a3 3 0 0 1 3-3h12m0 0-3-3m3 3-3 3M20 13v2a3 3 0 0 1-3 3H5m0 0 3 3m-3-3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><text class="i-one" x="12" y="14.5" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor">1</text>'),
  volume:svg('<path d="M4 9h4l5-4v14l-5-4H4Z" fill="currentColor"/><path class="i-wave" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path class="i-mute" d="m16 9 6 6m0-6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>')
 };
 const player=`<section class="wrap music-room" data-music-player data-album="${e(ALBUM)}" data-artwork="${e(ext+url(ART))}" aria-label="音樂播放器"><div class="now-playing" data-palette="${e(tracks[0].palette)}"><div class="album-art"><img src="${url(ART)}" alt="" width="360" height="540" decoding="async"><span class="album-glow" aria-hidden="true"></span></div><div class="np-copy"><div class="eyebrow">${e(ALBUM)}</div><h2 data-np-title>${e(tracks[0].title)}</h2><p class="np-edition" data-np-edition>${e(tracks[0].edition)}</p></div><div class="seek"><span data-time-current>0:00</span><input type="range" min="0" max="${tracks[0].duration}" step="1" value="0" data-seek aria-label="播放進度"><span data-time-total>${clock(tracks[0].duration)}</span></div><div class="player-controls">${btn('data-shuffle aria-pressed="false"','隨機播放',icons.shuffle)}${btn('data-prev','上一首',icons.prev)}<button type="button" class="player-play" data-play aria-label="播放">${icons.play}</button>${btn('data-next','下一首',icons.next)}${btn('data-repeat data-mode="all"','循環播放：全部',icons.repeat)}</div><div class="player-volume">${btn('data-mute aria-pressed="false"','靜音',icons.volume)}<input type="range" min="0" max="1" step="0.05" value="0.9" data-volume aria-label="音量"></div><p class="player-status" data-player-status aria-live="polite"></p><noscript><p class="player-status">播放器需要啟用 JavaScript。</p></noscript><audio data-audio preload="metadata" src="${url(tracks[0].audio)}"></audio></div><div class="mini-player" data-mini hidden><a class="mini-title" href="#main" data-mini-title>${e(tracks[0].title)}</a><span class="mini-time" data-mini-time>0:00</span><button type="button" class="player-play" data-play aria-label="播放">${icons.play}</button>${btn('data-next','下一首',icons.next)}</div><div class="track-panel"><div class="track-head"><h2>播放清單</h2><span class="muted">${tracks.length} 首 · ${clock(tracks.reduce((s,t)=>s+t.duration,0))}</span></div><ol class="track-list">${tracks.map(row).join('')}</ol></div></section>`;
 const html=intro('ORIGINAL SOUNDTRACK','音樂館','為《白雪公主：血色魔鏡》創作的 AI 原創歌曲。同一段故事——白雪以自己的名字換回王國的自由，八年後的春天卻無人記得她——用八種曲風重新演繹。可循環、隨機播放並閱讀完整歌詞。')
  +player
  +`<div class="wrap song-details">${tracks.map(detail).join('')}</div>`
  +`<section class="wrap section"><div class="sectionhead"><div><div class="eyebrow">VERSION COMPARISON</div><h2>八個版本比較</h2><p>同一個結局，不同的節奏、人聲與情緒重心。</p></div></div>${compare}</section>`
  +`<section class="wrap section"><div class="callout"><h2>關於這些歌曲</h2><p class="muted">歌詞、曲風設定與編曲方向由 Lucas 撰寫，音訊以 AI 音樂模型依提示生成；旋律為原創，並未取樣既有作品。網頁播放版本為 AAC 128 kbps 壓縮檔。歌詞未逐句對時，僅完整呈現。</p><div class="btnrow"><a class="btn primary" href="${url('stories/dark-snow-white/')}">閱讀原著故事 →</a><a class="btn" href="${url('games/blood-mirror/')}">前往血色魔鏡遊戲 →</a></div></div></section>`;
 const schema={'@context':'https://schema.org','@type':'MusicPlaylist',name:ALBUM,url:ext+url('music/'),numTracks:tracks.length,track:tracks.map(t=>({'@type':'MusicRecording',name:t.title,duration:'PT'+Math.floor(t.duration/60)+'M'+(t.duration%60)+'S',genre:t.style,inLanguage:'zh-Hant'}))};
 write('music',page('音樂館','《白雪公主：血色魔鏡》AI 原創歌曲：八種曲風、完整歌詞，支援循環與隨機播放。','music',html,'music',{image:ART,imageAlt:'白雪公主原創肖像插畫',jsonld:[schema],head:`<script src="${asset('assets/music.js')}" defer></script>`}));
};
module.exports.parseLyrics=parseLyrics;
