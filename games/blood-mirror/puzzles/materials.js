// Shared painted materials for the vector puzzle boards. The shapes (which carry the rules) stay vector; what fills them is a
// photographic texture (assets/puzzles/mat-*.webp, generated locally) plus a few lighting gradients, so brass looks like brass.
// One hidden <svg> holds the definitions for the whole page: the boards are rebuilt and removed a lot, and a definition that
// lived inside a removed board would leave every other board with an empty fill.
const NS='http://www.w3.org/2000/svg';
const TEX=(id,file,size)=>'<pattern id="'+id+'" patternUnits="userSpaceOnUse" width="'+size+'" height="'+size+'"><image href="assets/puzzles/'+file+'" width="'+size+'" height="'+size+'" preserveAspectRatio="none"/></pattern>';
const DEFS=
 TEX('bm-brass','mat-brass.webp',26)+TEX('bm-copper','mat-copper.webp',26)+TEX('bm-steel','mat-steel.webp',60)
 // Roundness for a disc: light from the upper left, shade at the lower right. Drawn over a gear that does not turn with it.
 +'<radialGradient id="bm-roundness" cx=".34" cy=".3" r=".85"><stop offset="0" stop-color="#fff6d8" stop-opacity=".34"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#1a0c02" stop-opacity=".5"/></radialGradient>'
 // The recessed web of a gear: dark at the rim of the recess, lighter in the middle.
 +'<radialGradient id="bm-web" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".05"/><stop offset=".8" stop-color="#1a0c02" stop-opacity=".34"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>'
 +'<radialGradient id="bm-hole" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#0a0508"/><stop offset=".78" stop-color="#150a0e"/><stop offset="1" stop-color="#3a2a16"/></radialGradient>'
 +'<radialGradient id="bm-pin" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#fff3c6"/><stop offset=".4" stop-color="#d6a845"/><stop offset="1" stop-color="#5a3a0c"/></radialGradient>'
 +'<radialGradient id="bm-pin-copper" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#ffd9bd"/><stop offset=".4" stop-color="#c8764a"/><stop offset="1" stop-color="#4a1f0a"/></radialGradient>'
 // A socket is a well in the plate with a brass lip.
 +'<radialGradient id="bm-well" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000"/><stop offset=".7" stop-color="#0a0608"/><stop offset=".86" stop-color="#2a2014"/><stop offset="1" stop-color="#8d7440"/></radialGradient>'
 +'<linearGradient id="bm-lip" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a6"/><stop offset=".5" stop-color="#9a7428"/><stop offset="1" stop-color="#3a2508"/></linearGradient>'
 +'<linearGradient id="bm-edge-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".5" stop-color="#a47a2a"/><stop offset="1" stop-color="#4a2f08"/></linearGradient>'
 +'<linearGradient id="bm-edge-copper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffcfae"/><stop offset=".5" stop-color="#a8552e"/><stop offset="1" stop-color="#3e1606"/></linearGradient>'
 +'<linearGradient id="bm-needle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8a8a"/><stop offset=".5" stop-color="#c0283a"/><stop offset="1" stop-color="#5a0f1a"/></linearGradient>'
 // Shade across a cylinder: dark at both edges, a bright band left of centre.
 +'<linearGradient id="bm-cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset=".3" stop-color="#fff6d8" stop-opacity=".42"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></linearGradient>'
 // A warm pool of candlelight on a dark wall.
 +'<radialGradient id="bm-candle" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".28"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>'
 // Glass and liquid for the vessels: the glass is a pale blue pane with a bright strip on the left, the liquid a deep red that is lighter at the top.
 +'<linearGradient id="bm-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfe6ff" stop-opacity=".34"/><stop offset=".22" stop-color="#9fc4ee" stop-opacity=".12"/><stop offset=".78" stop-color="#6f93c4" stop-opacity=".1"/><stop offset="1" stop-color="#cfe6ff" stop-opacity=".3"/></linearGradient>'
 +'<linearGradient id="bm-liquid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2553a"/><stop offset="1" stop-color="#7a1a12"/></linearGradient>'
 +'<linearGradient id="bm-rod" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3f12"/><stop offset=".35" stop-color="#ffe8a0"/><stop offset=".6" stop-color="#c79a3a"/><stop offset="1" stop-color="#4a3008"/></linearGradient>';

export function ensureMaterials(){
 if(document.getElementById('bm-materials'))return;
 const holder=document.createElementNS(NS,'svg');
 holder.id='bm-materials';holder.setAttribute('width','0');holder.setAttribute('height','0');holder.setAttribute('aria-hidden','true');
 holder.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
 holder.innerHTML='<defs>'+DEFS+'</defs>';
 document.body.appendChild(holder);
}
