// CSS sprites reuse user-supplied boards without altering or duplicating their bytes.
const board=(number)=>({src:`assets/concepts/design-board-${number}.png`,width:1536,height:1024});
export const conceptArt={
 portrait:{...board(1),rect:[470,0,320,274],label:'魔鏡前的公主肖像'},
 clock:{...board(3),rect:[281,327,238,210],label:'古老的金色機關盤'},
 vial:{...board(3),rect:[679,389,94,144],label:'紅色藥瓶'},
 feather:{...board(3),rect:[618,341,45,50],label:'白色羽毛'},
 apple:{...board(3),rect:[557,413,48,52],label:'紅蘋果'},
 key:{...board(3),rect:[556,478,57,49],label:'銀色鑰匙'},
 frost:{...board(3),rect:[420,674,369,214],label:'雪夜中的公主'},
 crown:{...board(3),rect:[807,674,368,214],label:'血色王冠下的公主'}
};
export function conceptStyle(id,tile=null){
 const art=conceptArt[id];if(!art)return '';
 let [x,y,w,h]=art.rect;
 if(tile!==null){const n=Number(tile);if(!Number.isInteger(n)||n<0||n>8)return '';w/=3;h/=3;x+=(n%3)*w;y+=Math.floor(n/3)*h;}
 const percent=n=>Number(n.toFixed(6));
 return `background-image:url(${art.src});background-size:${percent(art.width/w*100)}% ${percent(art.height/h*100)}%;background-position:${percent(x/(art.width-w)*100)}% ${percent(y/(art.height-h)*100)}%;aspect-ratio:${w}/${h}`;
}
export function conceptMarkup(id,{decorative=false,className=''}={}){
 const art=conceptArt[id];if(!art)return '';
 return `<span class="concept-sprite ${className}" data-concept="${id}" ${decorative?'aria-hidden="true"':`role="img" aria-label="${art.label}"`} style="${conceptStyle(id)}"></span>`;
}
export const itemArtwork={watch:'clock',apple:'apple'};
