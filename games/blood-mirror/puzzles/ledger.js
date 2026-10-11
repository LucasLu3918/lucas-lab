// The torn birth-record page for the Black Bell Archive. Typeset SVG, so the
// key number is real text (scales, stays legible) and no new image is needed.
export const ledgerPieces=['帳頁標題左側','帳頁標題中央','帳頁標題右側','抵押條文左側','抵押條文中央','抵押條文右側','簽名欄左側','簽名欄中央','簽名欄右側'];
const page=`<rect width="300" height="300" class="ledger-paper"/>
<circle cx="64" cy="232" r="42" class="ledger-stain"/><circle cx="244" cy="86" r="30" class="ledger-stain"/>
<rect x="12" y="12" width="276" height="276" class="ledger-frame"/><rect x="18" y="18" width="264" height="264" class="ledger-frame thin"/>
<text x="26" y="34" class="ledger-mark">✦</text><text x="274" y="34" class="ledger-mark" text-anchor="end">✦</text><text x="26" y="280" class="ledger-mark">✦</text><text x="274" y="280" class="ledger-mark" text-anchor="end">✦</text>
<text x="150" y="54" class="ledger-title" text-anchor="middle">王室生命帳簿</text>
<text x="150" y="78" class="ledger-small" text-anchor="middle">第 XIII 冊 · 出生抵押</text>
<line x1="40" y1="90" x2="260" y2="90" class="ledger-rule"/>
<text x="150" y="122" class="ledger-line" text-anchor="middle">確保公主出生</text>
<text x="40" y="166" class="ledger-line">抵押</text><text x="150" y="170" class="ledger-number" text-anchor="middle">七十三</text><text x="260" y="166" class="ledger-line" text-anchor="end">名兒童</text>
<text x="150" y="204" class="ledger-line" text-anchor="middle">之完整生命</text>
<line x1="40" y1="222" x2="260" y2="222" class="ledger-rule"/>
<text x="40" y="258" class="ledger-small">簽名：</text><ellipse cx="128" cy="252" rx="42" ry="13" class="ledger-blot"/><circle cx="236" cy="250" r="22" class="ledger-seal"/><text x="236" y="257" class="ledger-seal-mark" text-anchor="middle">♔</text>`;

export function ledgerTile(piece){
 const n=piece;if(!Number.isInteger(n)||n<0||n>8)return '';
 return `<svg class="ledger" viewBox="${n%3*100} ${Math.floor(n/3)*100} 100 100" aria-hidden="true">${page}</svg>`;
}
export function ledgerMarkup(){return `<svg class="ledger ledger-page" viewBox="0 0 300 300" role="img" aria-label="拼回的出生紀錄：確保公主出生，抵押七十三名兒童之完整生命。簽名欄被墨漬覆蓋。">${page}</svg>`;}

export const puzzleIsSolved=order=>order.length===9&&order.every((v,i)=>v===i);

// Nine-piece sliding repair: swap two pieces at a time until every piece sits in its own cell.
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
   draw();
  });
  document.querySelector('#puzzle-reset').onclick=()=>{tiles=[8,1,5,3,0,7,4,2,6];selected=-1;draw();};
 };
 draw();
}
