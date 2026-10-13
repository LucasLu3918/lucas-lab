import {conceptMarkup,placeConcepts} from './concept-art.js';
import {soundtrackFiles,fullThemeFile} from './soundtrack.js';
// Original artwork archive; boards include design proposals and ending spoilers.
export const galleryCategories=[{id:'all',label:'全部作品'},{id:'character',label:'角色'},{id:'scene',label:'場景'},{id:'concept',label:'概念圖'},{id:'ending',label:'結局 CG'}];
export const galleryAssets=[
 {id:'snow-white',category:'character',title:'白雪公主',src:'assets/snow-white.webp',alt:'白雪公主戴著王冠，在燭光與魔鏡之間握著紅蘋果',description:'旅程的主視覺。'},
 {id:'snow-portrait',category:'character',title:'白雪公主・立繪',src:'assets/portraits/snow.webp',alt:'白雪公主的半身油畫立繪，戴著金冠與紅寶石耳環，身旁燭光搖曳',description:'旅程的主角，與其他人物同一幅畫風。'},
 {id:'portrait',category:'character',title:'魔鏡前的公主肖像',src:'assets/concepts/design-board-1.webp',sprite:'portrait',alt:'白雪公主站在魔鏡前的肖像',description:'取自企劃概念展板的肖像。早期版本曾作為黑鐘書庫的拼圖畫面。'},
 {id:'library',category:'scene',title:'黑鐘書庫',src:'assets/chamber.webp',alt:'幽暗的哥德式書庫與古老陳設',description:'第一幕，午夜第十三聲鐘響後的探索場景。'},
 {id:'ballroom',category:'scene',title:'血色舞會',src:'assets/ballroom.webp',alt:'凝結成舞姿的蒙面賓客與深紅絲絨舞廳',description:'第二幕，面具下的謊言。'},
 {id:'mirror-hall',category:'scene',title:'鏡廳',src:'assets/mirror-hall.webp',alt:'兩側排滿金框古鏡的長廊，月光從盡頭微開的門照入',description:'舞廳大鏡後的長廊。'},
 {id:'balcony',category:'scene',title:'王宮陽台',src:'assets/balcony.webp',alt:'月夜下的陽台，桌上有兩杯紅酒與一隻黑手套，遠方蒸汽塔冒著白煙',description:'舞會之外的另一個夜晚。'},
 {id:'library-desk',category:'scene',title:'書庫書桌',src:'assets/library-desk.webp',alt:'書桌上攤開被撕走書頁的古書，旁邊有鐘塔手札、打翻的墨水與王冠蠟印',description:'黑鐘書庫的書桌特寫。'},
 {id:'mine-dorm',category:'scene',title:'礦工宿舍',src:'assets/mine-dorm.webp',alt:'石砌宿舍裡有一只小搖籃、釘滿藍圖的牆與一盞礦工提燈',description:'銀骨礦坑深處的宿舍。'},
 {id:'crypt-bedside',category:'scene',title:'玻璃棺旁',src:'assets/crypt-bedside.webp',alt:'玻璃棺旁的椅子上垂著蒙塵的白紗，旁邊立著一座守夜燭台',description:'有人在這裡守了很久。'},
 {id:'queen-vanity',category:'scene',title:'王后梳妝台',src:'assets/queen-vanity.webp',alt:'梳妝台上擺著金王冠、年輕醫師的畫像與一本夾著文書的祈禱書',description:'薇菈的梳妝台。'},
 {id:'mirror-children',category:'scene',title:'牽著手的孩子',src:'assets/mirror-children.webp',alt:'一排穿白色睡衣的孩子背對著手牽手，紅線通向碎裂的巨鏡',description:'鏡之國裡等待被數出名字的孩子。'},
 {id:'hunter',category:'scene',title:'獵人的心臟',src:'assets/hunter-cabin.webp',alt:'獵人小屋桌上，玻璃罐裡泛著紅光的玻璃心臟',description:'第三幕，玻璃裡的孩子。'},
 {id:'black-pine-path',category:'scene',title:'黑松林小徑',src:'assets/black-pine-path.webp',alt:'積雪的黑松林小徑，掛著提燈，遠處有一點紅光',description:'獵人小屋之後的路。'},
 {id:'mine',category:'scene',title:'銀骨礦坑',src:'assets/mine.webp',alt:'銀骨礦坑的地下工程場景',description:'第四幕，蒸汽工程與被遺忘的名字。'},
 {id:'crypt',category:'scene',title:'玻璃棺室',src:'assets/crypt.webp',alt:'玻璃棺室的冰冷幽暗場景',description:'第五幕，沉睡與符印的交界。'},
 {id:'queen',category:'scene',title:'王后寢宮',src:'assets/queen.webp',alt:'王后寢宮的哥德式室內場景',description:'第六幕，縫線、記憶與她最後的謊言。'},
 {id:'mirror',category:'scene',title:'鏡中之國',src:'assets/mirror.webp',alt:'鏡中之國的奇幻倒影場景',description:'第七幕，名字與契約的終點。'},
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
 const trackTitles={home:'標題 · 主題曲前奏',library:'第一幕 · 黑鐘書庫',ballroom:'第二幕 · 血色舞會',hunter:'第三幕 · 獵人的心臟',mine:'第四幕 · 銀骨礦坑',crypt:'第五幕 · 玻璃棺室',queen:'第六幕 · 王后寢宮',mirror:'第七幕 · 鏡中之國',dawn:'真結局 · 無名的黎明',frost:'結局二 · 霜潮',crown:'結局三 · 血色王冠'};
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
  trackSelect.innerHTML=Object.entries(soundtrackFiles).filter(([id])=>!['dawn','frost','crown'].includes(id)||getEndings().includes(id)).map(([id,file])=>`<option value="assets/music/${file}">${trackTitles[id]}</option>`).join('')+`<option value="assets/music/${fullThemeFile}">主題曲〈誰值得活下去〉完整版</option>`;
  if([...trackSelect.options].some(o=>o.value===oldTrack))trackSelect.value=oldTrack;
  if(!player.getAttribute('src'))player.src=trackSelect.value;
  filters.innerHTML=galleryCategories.map(c=>`<button type="button" data-gallery-filter="${c.id}" aria-pressed="${c.id===category}">${c.label}</button>`).join('');
  const assets=filterArtwork(category),discovered=getEndings();
  status.textContent=`${assets.length} 件作品 · 結局收藏 ${galleryAssets.filter(a=>a.ending&&canViewArtwork(a,discovered)).length} / 3`;
  grid.innerHTML=assets.map(asset=>canViewArtwork(asset,discovered)?`<button class="artwork-card" data-artwork="${asset.id}" aria-label="檢視${asset.title}">${asset.sprite?conceptMarkup(asset.sprite):`<img data-artwork-image="${asset.id}" src="${asset.src}" alt="${asset.alt}" loading="lazy" decoding="async">`}<span class="artwork-caption"><span>${galleryCategories.find(c=>c.id===asset.category).label}</span><strong>${asset.title}</strong><span>放大檢視 ↗</span></span></button>`:`<article class="artwork-card artwork-locked" aria-label="尚未解鎖的${asset.category==='concept'?'概念展板':'結局插畫'}"><div aria-hidden="true">◇</div><span class="artwork-caption"><strong>${asset.category==='concept'?'含結局內容的概念展板':'尚未解鎖的結局'}</strong><span>${asset.category==='concept'?'發現三種結局後即可檢視完整展板。':'完成對應結局後，插畫將留在這裡。'}</span></span></article>`).join('')||'<p class="gallery-empty">這裡將收藏旅程之外的靈感與概念作品。</p>';placeConcepts(grid);
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
