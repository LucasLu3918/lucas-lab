// The torn birth-record page for the Black Bell Archive.
export const ledgerPieces=['帳頁標題左側','帳頁標題中央','帳頁標題右側','抵押條文左側','抵押條文中央','抵押條文右側','簽名欄左側','簽名欄中央','簽名欄右側'];
// The sheet is painted: assets/puzzles/ledger-sheet.webp is a wizard's parchment with a runic border, an ink blot and a wax seal
// (composited from locally generated parts). Torn into nine pieces it is the puzzle; restored it hangs between the two rollers of
// assets/puzzles/ledger-scroll.webp, the same sheet mounted on a scroll. The rules and every word stay typeset SVG on top, so the key
// number is real text and the tear lines still cut through the lettering. The type is meant to be LXGW WenKai TC (a kai hand) with the Latin
// line in IM Fell English (SIL OFL 1.1); the font files live in assets/fonts/.
const text=`<text x="150" y="36" class="ledger-latin" text-anchor="middle">Liber Vitae Regni</text>
<text x="150" y="62" class="ledger-title" text-anchor="middle">王室生命帳簿</text>
<text x="150" y="83" class="ledger-small" text-anchor="middle">第十三冊 · 出生抵押</text>
<line x1="44" y1="94" x2="256" y2="94" class="ledger-rule"/>
<text x="150" y="126" class="ledger-line" text-anchor="middle">確保公主出生</text>
<text x="40" y="168" class="ledger-line">抵押</text><text x="150" y="172" class="ledger-number" text-anchor="middle">七十三</text><text x="260" y="168" class="ledger-line" text-anchor="end">名兒童</text>
<text x="150" y="208" class="ledger-line" text-anchor="middle">之完整生命</text>
<line x1="44" y1="224" x2="256" y2="224" class="ledger-rule"/>
<text x="40" y="258" class="ledger-small">簽名：</text>`;
const page=`<image href="assets/puzzles/ledger-sheet.webp" width="300" height="300" preserveAspectRatio="none" class="ledger-paper"/>${text}`;

export function ledgerTile(piece){
 const n=piece;if(!Number.isInteger(n)||n<0||n>8)return '';
 return `<svg class="ledger" viewBox="${n%3*100} ${Math.floor(n/3)*100} 100 100" aria-hidden="true">${page}</svg>`;
}
// The scroll image is 742 x 781 px with the sheet at (76,96), 590 px wide: 300 units of sheet = 590 px.
export function ledgerMarkup(){return `<svg class="ledger ledger-page" viewBox="-38.6 -48.8 377.3 397.1" role="img" aria-label="拼回的出生紀錄，一卷魔法捲軸：確保公主出生，抵押七十三名兒童之完整生命。簽名欄被墨漬覆蓋。"><image href="assets/puzzles/ledger-scroll.webp" x="-38.6" y="-48.8" width="377.3" height="397.1" preserveAspectRatio="none"/>${text}</svg>`;}
