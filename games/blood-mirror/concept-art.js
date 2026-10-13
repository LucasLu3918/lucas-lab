// CSS sprites read WebP copies of the user-supplied boards (~300KB vs 2.6MB PNG);
// the original PNGs stay as the full-resolution gallery archive.
const board=(number)=>({src:`assets/concepts/design-board-${number}.webp`,width:1536,height:1024});
// Small objects use a 22KB crop of board 3 (origin 281,327) so clue modals and memory cards do not wait on a whole board.
const items={src:'assets/concepts/item-sheet.webp',width:492,height:210};
export const conceptArt={
 portrait:{...board(1),rect:[470,0,320,274],label:'魔鏡前的公主肖像'},
 clock:{...items,rect:[0,0,238,210],label:'古老的金色機關盤'},
 vial:{...items,rect:[398,62,94,144],label:'紅色藥瓶'},
 feather:{...items,rect:[337,14,45,50],label:'白色羽毛'},
 apple:{...items,rect:[276,86,48,52],label:'紅蘋果'},
 key:{...items,rect:[275,151,57,49],label:'銀色鑰匙'},
 frost:{...board(3),rect:[420,674,369,214],label:'雪夜中的公主'},
 crown:{...board(3),rect:[807,674,368,214],label:'血色王冠下的公主'}
};
export function conceptStyle(id,tile=null){
 const art=conceptArt[id];if(!art)return '';
 let [x,y,w,h]=art.rect;
 if(tile!==null){const n=Number(tile);if(!Number.isInteger(n)||n<0||n>8)return '';w/=3;h/=3;x+=(n%3)*w;y+=Math.floor(n/3)*h;}
 const percent=n=>Number(n.toFixed(6));
 // A region as wide (or tall) as its sheet has no slack to position within.
 const offset=(start,full,size)=>full>size?start/(full-size)*100:0;
 return `background-image:url(${art.src});background-size:${percent(art.width/w*100)}% ${percent(art.height/h*100)}%;background-position:${percent(offset(x,art.width,w))}% ${percent(offset(y,art.height,h))}%;aspect-ratio:${w}/${h}`;
}
export function conceptMarkup(id,{decorative=false,className=''}={}){
 const art=conceptArt[id];if(!art)return '';
 return `<span class="concept-sprite ${className}" data-concept="${id}" ${decorative?'aria-hidden="true"':`role="img" aria-label="${art.label}"`}></span>`;
}
// Sprite regions are applied with CSSOM after the markup is inserted: style attributes in markup would need 'unsafe-inline' under the site CSP.
export function placeConcepts(root){
 for(const el of root.querySelectorAll('.concept-sprite[data-concept]'))el.style.cssText=conceptStyle(el.dataset.concept);
}
// Fetch and decode sprite sheets ahead of use, so a card or modal shows its art on the first paint.
const warmed=new Map();
export function preloadImages(sources){
 return Promise.all([...new Set(sources)].filter(Boolean).map(src=>{
  if(!warmed.has(src)){const img=new Image();img.decoding='async';img.src=src;warmed.set(src,img.decode?img.decode().catch(()=>{}):Promise.resolve());}
  return warmed.get(src);
 }));
}
export const preloadConcepts=ids=>preloadImages(ids.map(id=>conceptArt[id]?.src));
export const itemArtwork={watch:'clock',apple:'apple'};

// A magnified crop of a 16:9 scene around a hotspot (x, y in percent), so a clue dialog opens on the thing itself.
// The frame is 16:6.5; background-position percentages map the image edge to the frame edge, hence the algebra.
export function zoomStyle(src,x,y,scale=2.6,frame=16/6.5,image=16/9){
 const clamp=v=>Math.min(1,Math.max(0,v)),rows=scale*frame/image;
 const px=clamp((x/100*scale-.5)/(scale-1))*100,py=rows>1?clamp((y/100*rows-.5)/(rows-1))*100:50;
 return `background-image:url(${src});background-size:${scale*100}% auto;background-position:${px.toFixed(2)}% ${py.toFixed(2)}%`;
}
export function placeZooms(root){
 for(const el of root.querySelectorAll('.spot-zoom[data-zoom-src]')){
  const x=Number(el.dataset.zoomX),y=Number(el.dataset.zoomY);
  if(Number.isFinite(x)&&Number.isFinite(y))el.style.cssText=zoomStyle(el.dataset.zoomSrc,x,y);
 }
}
