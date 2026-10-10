import {conceptMarkup} from './concept-art.js';
import {soundtrackFiles} from './soundtrack.js';
// Original artwork archive; boards include design proposals and ending spoilers.
export const galleryCategories=[{id:'all',label:'全部作品'},{id:'character',label:'角色'},{id:'scene',label:'場景'},{id:'concept',label:'概念圖'},{id:'ending',label:'結局 CG'}];
export const galleryAssets=[
 {id:'snow-white',category:'character',title:'白雪公主',src:'assets/snow-white.webp',alt:'白雪公主戴著王冠，在燭光與魔鏡之間握著紅蘋果',description:'旅程的主視覺。'},
 {id:'portrait',category:'character',title:'魔鏡前的公主肖像',src:'assets/concepts/design-board-1.webp',sprite:'portrait',alt:'白雪公主站在魔鏡前的肖像',description:'取自企劃概念展板的肖像。早期版本曾作為黑鐘書庫的拼圖畫面。'},
 {id:'library',category:'scene',title:'黑鐘書庫',src:'assets/chamber.webp',alt:'幽暗的哥德式書庫與古老陳設',description:'第一幕，午夜第十三聲鐘響後的探索場景。'},
 {id:'mine',category:'scene',title:'銀骨礦坑',src:'assets/mine.webp',alt:'銀骨礦坑的地下工程場景',description:'第二幕，蒸汽工程與被遺忘的名字。'},
 {id:'crypt',category:'scene',title:'玻璃棺室',src:'assets/crypt.webp',alt:'玻璃棺室的冰冷幽暗場景',description:'第三幕，沉睡與符印的交界。'},
 {id:'queen',category:'scene',title:'王后寢宮',src:'assets/queen.webp',alt:'王后寢宮的哥德式室內場景',description:'第四幕，縫線、記憶與她最後的謊言。'},
 {id:'mirror',category:'scene',title:'鏡中之國',src:'assets/mirror.webp',alt:'鏡中之國的奇幻倒影場景',description:'第五幕，名字與契約的終點。'},
 {id:'design-board-1',category:'concept',unlockEndings:['dawn','frost','crown'],title:'遊戲全面升級 · 概念展板',src:'assets/concepts/design-board-1.webp',alt:'血色魔鏡遊戲企劃展板，包含互動玩法、配樂與三種結局的視覺提案',description:'原始遊戲企劃概念展板；其中的玩法、曲長與結局文字為創作提案，實際內容以遊戲為準。'},
 {id:'design-board-3',category:'concept',unlockEndings:['dawn','frost','crown'],title:'多樣解謎 · 概念展板',src:'assets/concepts/design-board-3.webp',alt:'血色魔鏡遊戲企劃展板，包含互動玩法、配樂與三種結局的視覺提案',description:'原始遊戲企劃概念展板；其中的玩法、曲長與結局文字為創作提案，實際內容以遊戲為準。'},
 {id:'design-board-4',category:'concept',unlockEndings:['dawn','frost','crown'],title:'三種命運 · 概念展板',src:'assets/concepts/design-board-4.webp',alt:'血色魔鏡遊戲企劃展板，包含互動玩法、配樂與三種結局的視覺提案',description:'原始遊戲企劃概念展板；其中的玩法、曲長與結局文字為創作提案，實際內容以遊戲為準。'},
 {id:'dawn',category:'ending',ending:'dawn',title:'無名的黎明',src:'assets/endings/dawn.svg',preferredSrc:'assets/endings/dawn.webp',alt:'無名的黎明結局插畫',description:'春天沒有記住她。'},
 {id:'frost',category:'ending',ending:'frost',title:'霜潮',src:'assets/endings/frost.svg',sprite:'frost',alt:'霜潮結局插畫',description:'沒有名字的冬天。'},
 {id:'crown',category:'ending',ending:'crown',title:'血色王冠',src:'assets/endings/crown.svg',sprite:'crown',alt:'血色王冠結局插畫',description:'永恆的契約。'}
];
export const canViewArtwork=(asset,discovered=[])=>(!asset.ending||discovered.includes(asset.ending))&&(!asset.unlockEndings||asset.unlockEndings.every(id=>discovered.includes(id)));
export const filterArtwork=category=>galleryAssets.filter(asset=>category==='all'||asset.category===category);
export function createGallery({getEndings,openModal,closeModal,onPreviewStart,onPreviewStop}){
 const filters=document.querySelector('#gallery-filters'),grid=document.querySelector('#gallery-grid'),status=document.querySelector('#gallery-status');
 const player=document.querySelector('#gallery-audio'),trackSelect=document.querySelector('#gallery-track');
 const trackTitles={home:'首頁 · 鏡子第一次說謊',library:'第一幕 · 黑鐘書庫',mine:'第二幕 · 銀骨礦坑',crypt:'第三幕 · 玻璃棺室',queen:'第四幕 · 王后寢宮',mirror:'第五幕 · 鏡中之國',dawn:'真結局 · 無名的黎明',frost:'結局二 · 霜潮',crown:'結局三 · 血色王冠'};
 let suppressResume=false;
 const stopPreview=(resume=true)=>{if(!player.paused){suppressResume=!resume;player.pause();}};
 player.addEventListener('play',onPreviewStart);player.addEventListener('pause',()=>{if(!suppressResume)onPreviewStop();suppressResume=false;});player.addEventListener('ended',onPreviewStop);
 player.addEventListener('error',()=>{document.querySelector('#gallery-audio-status').textContent='配樂暫時無法播放，請稍後再試。';onPreviewStop();});
 trackSelect.onchange=()=>{stopPreview();player.src=trackSelect.value;player.load();document.querySelector('#gallery-audio-status').textContent='';};
 document.querySelector('#gallery-listening').addEventListener('toggle',e=>{if(!e.target.open)stopPreview();});
 let category='all',selectedId=null;
 const enhance=image=>{
  const asset=galleryAssets.find(a=>a.id===image.dataset.artworkImage);
  if(!asset?.preferredSrc)return;
  const candidate=new Image();candidate.onload=()=>{if(image.isConnected)image.src=asset.preferredSrc;};candidate.src=asset.preferredSrc;
 };
 const bindImages=container=>container.querySelectorAll('[data-artwork-image]').forEach(image=>{
  image.onerror=()=>{image.hidden=true;const message=document.createElement('p');message.className='gallery-image-error';message.textContent='圖片暫時無法載入，請稍後重試。';message.setAttribute('role','status');image.after(message);};enhance(image);
 });
 const render=()=>{
  const oldTrack=trackSelect.value;
  trackSelect.innerHTML=Object.entries(soundtrackFiles).filter(([id])=>!['dawn','frost','crown'].includes(id)||getEndings().includes(id)).map(([id,file])=>`<option value="assets/music/${file}">${trackTitles[id]}</option>`).join('')+'<option value="assets/music/highlights.mp3">九首配樂精選合輯</option>';
  if([...trackSelect.options].some(o=>o.value===oldTrack))trackSelect.value=oldTrack;
  if(!player.getAttribute('src'))player.src=trackSelect.value;
  filters.innerHTML=galleryCategories.map(c=>`<button type="button" data-gallery-filter="${c.id}" aria-pressed="${c.id===category}">${c.label}</button>`).join('');
  const assets=filterArtwork(category),discovered=getEndings();
  status.textContent=`${assets.length} 件作品 · 結局收藏 ${galleryAssets.filter(a=>a.ending&&canViewArtwork(a,discovered)).length} / 3`;
  grid.innerHTML=assets.map(asset=>canViewArtwork(asset,discovered)?`<button class="artwork-card" data-artwork="${asset.id}" aria-label="檢視${asset.title}">${asset.sprite?conceptMarkup(asset.sprite):`<img data-artwork-image="${asset.id}" src="${asset.src}" alt="${asset.alt}" loading="lazy" decoding="async">`}<span class="artwork-caption"><span>${galleryCategories.find(c=>c.id===asset.category).label}</span><strong>${asset.title}</strong><span>放大檢視 ↗</span></span></button>`:`<article class="artwork-card artwork-locked" aria-label="尚未解鎖的${asset.category==='concept'?'概念展板':'結局插畫'}"><div aria-hidden="true">◇</div><span class="artwork-caption"><strong>${asset.category==='concept'?'含結局內容的概念展板':'尚未解鎖的結局'}</strong><span>${asset.category==='concept'?'發現三種結局後即可檢視完整展板。':'完成對應結局後，插畫將留在這裡。'}</span></span></article>`).join('')||'<p class="gallery-empty">這裡將收藏旅程之外的靈感與概念作品。</p>';
  bindImages(grid);
 };
 const preview=id=>{
  const asset=galleryAssets.find(a=>a.id===id);if(!asset||!canViewArtwork(asset,getEndings()))return;
  selectedId=id;
  const available=filterArtwork(category).filter(a=>canViewArtwork(a,getEndings())),index=available.indexOf(asset);
  openModal(asset.title,'THE MIRROR COLLECTION · '+galleryCategories.find(c=>c.id===asset.category).label,`<figure class="artwork-preview">${asset.sprite?conceptMarkup(asset.sprite):`<img data-artwork-image="${asset.id}" src="${asset.src}" alt="${asset.alt}">`}<figcaption>${asset.description}</figcaption></figure><div class="artwork-controls"><button class="secondary-button" id="artwork-prev" ${index===0?'disabled':''}>← 上一件</button><span>${index+1} / ${available.length}</span><button class="secondary-button" id="artwork-next" ${index===available.length-1?'disabled':''}>下一件 →</button></div><button class="text-button" id="artwork-back">返回藝廊</button>`);
  bindImages(document.querySelector('#modal-body'));
  document.querySelector('#artwork-prev').onclick=()=>preview(available[index-1]?.id);
  document.querySelector('#artwork-next').onclick=()=>preview(available[index+1]?.id);
  document.querySelector('#artwork-back').onclick=closeModal;
 };
 filters.addEventListener('click',e=>{const button=e.target.closest('[data-gallery-filter]');if(!button)return;category=button.dataset.galleryFilter;render();filters.querySelector(`[data-gallery-filter="${category}"]`).focus();});
 grid.addEventListener('click',e=>{const button=e.target.closest('[data-artwork]');if(button)preview(button.dataset.artwork);});
 document.querySelector('#modal').addEventListener('close',()=>{selectedId=null;});
 document.querySelector('#modal').addEventListener('keydown',e=>{if(!selectedId||!['ArrowLeft','ArrowRight'].includes(e.key))return;const button=document.querySelector(e.key==='ArrowLeft'?'#artwork-prev':'#artwork-next');if(button&&!button.disabled){e.preventDefault();button.click();}});
 return {render,stopPreview};
}
