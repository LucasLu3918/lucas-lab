'use strict';
// AI visual gallery: story covers, Blood Mirror scenes and portraits, world-concept paintings and the game's concept boards.
// Every tile opens the shared dialog (assets/app.js), which steps through the tiles of the same section.

const GAME_ART='games/blood-mirror/play/assets/';
// Scenes in the game's chapter order; thumbnails are 640px derivatives in assets/images/, the full image is the game's own file.
const SCENES=[
 ['chamber','黑鐘書庫','第一幕〈第十三聲鐘響〉的起點：鐘聲停在第十三響的地下書庫。'],
 ['ballroom','血色舞會・舞廳','第二幕〈面具下的謊言〉：燭光下戴著面具的宮廷舞會。'],
 ['mirror-hall','血色舞會・鏡廳','舞會旁的長廊，一整面牆的鏡子都在注視來客。'],
 ['balcony','血色舞會・陽台','舞曲之外的月夜陽台。'],
 ['hunter-cabin','獵人小屋','第三幕〈玻璃裡的孩子〉：黑松林深處的獵人小屋。'],
 ['black-pine-path','黑松林小徑','通往小屋的林間小徑，霧與松針掩去來路。'],
 ['mine','銀骨礦坑','第四幕〈七個被遺忘的人〉：礦工們的名字刻在坑道深處。'],
 ['crypt','玻璃棺室','第五幕〈毒蘋果是一把鑰匙〉：安放玻璃棺的冰冷石室。'],
 ['queen','王后寢宮','第六幕〈她最後的謊言〉：王后留下的寢宮與梳妝台。'],
 ['mirror','鏡中之國','終幕〈一個名字的代價〉：魔鏡另一側的國度。']
];
const PORTRAITS=[
 ['mirror','魔鏡','貫穿全作的審問者，在每一幕之間向玩家提問。'],
 ['orion','奧瑞恩王子','於〈血色舞會〉登場。'],
 ['eli','伊萊','於〈血色舞會〉登場，之後在玻璃棺室再度出現。'],
 ['hunter','獵人','於〈獵人的心臟〉登場。'],
 ['heso','赫索','於〈銀骨礦坑〉登場。'],
 ['nyla','奈菈','於〈銀骨礦坑〉登場。'],
 ['vera','薇菈王后','於〈王后寢宮〉登場。'],
 ['lucy','露西','於〈鏡中之國〉登場。']
];
const BOARDS=[1,3,4];

module.exports=function renderGallery(ctx){
 const {catalog,url,e,icon,media,intro,page,write}=ctx;
 // One tile = one dialog entry. data-full-* is the image the dialog shows.
 const tile=({group,full,width,height,alt,title,description,href,hrefLabel,label,body,extraClass=''})=>`<button type="button" class="gallery-tile${extraClass}" data-preview data-group="${group}"${full?` data-full-src="${e(full)}" data-full-w="${width}" data-full-h="${height}" data-full-alt="${e(alt)}"`:''} data-title="${e(title)}" data-description="${e(description)}"${href?` data-href="${e(href)}" data-href-label="${e(hrefLabel)}"`:''} aria-label="${e('放大檢視：'+title)}">${body}<strong>${label||e(title)}</strong></button>`;
 const thumb=(src,alt,w,h,cls)=>`<div class="visual ${cls}"><img src="${url(src)}" alt="${e(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async"><span class="tile-zoom" aria-hidden="true">${icon('search')}</span></div>`;

 const covers=catalog.stories.map((story,i)=>tile({group:'covers',full:url(story.cover),width:900,height:1350,alt:story.coverAlt,title:story.title,description:story.description,href:url('stories/'+story.slug+'/'),hrefLabel:'閱讀這本故事',body:media(story,i<4)})).join('');
 const scenes=SCENES.map(([key,title,description])=>tile({group:'scenes',full:url(GAME_ART+key+'.webp'),width:1664,height:944,alt:'血色魔鏡遊戲場景插畫：'+title,title,description,href:url('games/blood-mirror/'),hrefLabel:'前往血色魔鏡',body:thumb('assets/images/gallery-scene-'+key+'.webp','血色魔鏡場景：'+title,640,363,'scene-art')})).join('');
 const portraits=PORTRAITS.map(([key,title,description])=>tile({group:'portraits',full:url(GAME_ART+'portraits/'+key+'.webp'),width:640,height:936,alt:'血色魔鏡角色立繪：'+title,title,description,body:thumb('assets/images/gallery-portrait-'+key+'.webp',title+'的角色立繪',320,468,'portrait-art')})).join('');
 // World concepts: 1600×1008 paintings with 640px thumbnails, both in assets/images/.
 const concepts=catalog.gallery.map(g=>tile({group:'concepts',full:url('assets/images/concept-'+g.scene+'.webp'),width:1600,height:1008,alt:'世界概念插畫：'+g.title,title:g.title,description:g.description,label:`${e(g.title)} · 構思中`,extraClass:' concept-tile',body:thumb('assets/images/concept-'+g.scene+'-small.webp',g.title+'的世界概念插畫',640,403,'scene-art concept-art').replace('<span class="tile-zoom"',`<span class="concept-badge">${icon(g.symbol)}概念</span><span class="tile-zoom"`)})).join('');
 // Files keep their original numbers (board 2 was dropped); visitors see the boards numbered in order.
 const boards=BOARDS.map((n,i)=>tile({group:'boards',full:url(GAME_ART+'concepts/design-board-'+n+'.webp'),width:1536,height:1024,alt:'血色魔鏡遊戲企劃展板 '+(i+1),title:'企劃展板 '+(i+1),description:'遊戲開發初期的企劃展板，記錄最初的構想；實際內容以遊戲為準。',extraClass:' concept-board',body:`<img src="${url(GAME_ART+'concepts/design-board-'+n+'.webp')}" alt="血色魔鏡遊戲企劃展板 ${i+1}" width="1536" height="1024" loading="lazy" decoding="async">`,label:'企劃展板 '+(i+1)})).join('');

 const sections=[
  {id:'covers',icon:'book',eyebrow:'ORIGINAL COVER COLLECTION',title:'故事封面收藏',desc:`${catalog.stories.length} 幅原創 AI 封面插畫，對應故事藏書館的每一本書。`,grid:'gallery art-gallery',body:covers,count:catalog.stories.length},
  {id:'scenes',icon:'image',eyebrow:'BLOOD MIRROR · SCENES',title:'血色魔鏡・場景插畫',desc:'遊戲中實際使用的場景插畫，依章節順序排列。點選可看完整尺寸。',grid:'gallery scene-gallery',body:scenes,count:SCENES.length,link:['games/blood-mirror/','前往遊戲']},
  {id:'portraits',icon:'mirror',eyebrow:'BLOOD MIRROR · CHARACTERS',title:'血色魔鏡・角色立繪',desc:'在遊戲對話中出現的角色立繪；介紹只標示登場章節，不透露劇情。',grid:'gallery portrait-gallery',body:portraits,count:PORTRAITS.length},
  {id:'concepts',icon:'compass',eyebrow:'WORLD CONCEPTS · IN PROGRESS',title:'世界概念',desc:'尚未成書的世界，先以概念插畫定下場景、光源與配色。',grid:'gallery concept-gallery',body:concepts,count:catalog.gallery.length},
  {id:'boards',icon:'file',eyebrow:'GAME CONCEPT BOARDS',title:'血色魔鏡・企劃展板',desc:'遊戲開發初期的企劃展板，記錄最初的構想；實際已完成的內容請見遊戲頁。',grid:'concept-boards',body:boards,count:BOARDS.length,link:['games/blood-mirror/','前往遊戲']}
 ];
 const jump=`<nav class="wrap gallery-jump" aria-label="藝廊分區">${sections.map(s=>`<a href="#${s.id}">${icon(s.icon)}<span>${e(s.title.replace('血色魔鏡・',''))}</span><small>${s.count}</small></a>`).join('')}</nav>`;
 const sectionMarkup=s=>`<section class="wrap section gallery-section" id="${s.id}" aria-labelledby="${s.id}-title"><div class="sectionhead"><div><div class="eyebrow">${e(s.eyebrow)}</div><h2 id="${s.id}-title">${e(s.title)}</h2><p>${e(s.desc)}</p></div>${s.link?`<a class="more" href="${url(s.link[0])}">${e(s.link[1])} ↗</a>`:''}</div><div class="${s.grid}">${s.body}</div></section>`;
 const dialog=`<dialog class="dialog gallery-dialog" id="gallery-dialog" aria-labelledby="gallery-dialog-title"><div class="dialog-bar"><span class="dialog-count" data-dialog-count aria-live="polite"></span><button type="button" class="close" data-dialog-close aria-label="關閉預覽">${icon('close')}</button></div><div class="dialog-stage"><button type="button" class="dialog-nav prev" data-dialog-prev aria-label="上一張">${icon('arrow')}</button><div class="visual" data-dialog-visual><span>${icon('image')}</span></div><button type="button" class="dialog-nav next" data-dialog-next aria-label="下一張">${icon('arrow')}</button></div><h2 data-dialog-title id="gallery-dialog-title"></h2><p data-dialog-desc class="muted"></p><a class="btn" data-dialog-link hidden></a><p class="dialog-hint">← → 切換 · Esc 關閉</p></dialog>`;
 const html=intro('VISUAL ARCHIVE','AI 視覺藝廊','故事封面、遊戲場景與角色立繪都是實際使用中的原創 AI 插畫；尚在構思的世界則以概念插畫呈現。')+jump+sections.map(sectionMarkup).join('')+dialog;
 write('gallery',page('AI 視覺藝廊','原創 AI 故事封面、血色魔鏡場景與角色立繪，以及構思中的世界概念插畫。','gallery',html,'gallery'));
};
