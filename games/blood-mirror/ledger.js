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
