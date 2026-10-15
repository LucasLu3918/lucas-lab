import {ledgerPieces,ledgerTile,ledgerMarkup} from './ledger-art.js';
export {ledgerPieces,ledgerTile,ledgerMarkup};

export const puzzleIsSolved=order=>order.length===9&&order.every((v,i)=>v===i);

// Nine-piece sliding repair: swap two pieces at a time until every piece sits in its own cell.
// The two pieces that just traded places pop into their new cells.
const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('reduce-motion');
const pop=cells=>{if(calm())return;for(const i of cells)document.querySelector('.ledger-board [data-pos="'+i+'"]')?.animate([{transform:'scale(.88)',opacity:.7},{transform:'scale(1)',opacity:1}],{duration:240,easing:'cubic-bezier(.3,1.4,.5,1)'});};

export function mountLedger(ctx){
 let tiles=[4,0,8,2,6,1,3,7,5],selected=-1;
 const draw=()=>{
  const placed=tiles.filter((v,i)=>v===i).length;
  ctx.render('<p class="challenge-help">帳頁被撕成九片。點選兩片碎片交換位置，把出生紀錄拼回原狀。邊框與文字的斷口能告訴妳每片的位置。</p><div class="tile-board ledger-board">'+tiles.map((v,i)=>'<button class="picture-tile ledger-tile '+(i===selected?'selected':'')+' '+(v===i?'placed':'')+'" data-pos="'+i+'" aria-label="第'+(i+1)+'格碎片：'+ledgerPieces[v]+'（圖塊 '+(v+1)+'）'+(v===i?'，已歸位':'')+'" aria-pressed="'+(i===selected)+'">'+ledgerTile(v)+'</button>').join('')+'</div><p class="challenge-feedback" role="status">'+placed+' / 9 片碎片已歸位。'+(selected<0?'選取任意兩片進行交換。':'再選一片與它交換。')+'</p><button id="puzzle-reset" class="secondary-button">重新打散碎片</button>');
  document.querySelectorAll('[data-pos]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.pos);
   if(selected<0){selected=i;draw();return;}
   if(selected===i){selected=-1;draw();return;}
   const from=selected;
   [tiles[i],tiles[from]]=[tiles[from],tiles[i]];
   selected=-1;
   if(puzzleIsSolved(tiles)){ctx.done();return;}
   ctx.playCue(tiles[i]===i||tiles[from]===from?'restore':'click');
   draw();pop([i,from]);
  });
  document.querySelector('#puzzle-reset').onclick=()=>{tiles=[8,1,5,3,0,7,4,2,6];selected=-1;draw();};
 };
 draw();
}
