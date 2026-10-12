'use strict';
// World-concept scenes for the gallery: vector sketches drawn by code, standing in for the planned paintings.
// Each scene is layered silhouettes (far → near) on the site palette, built from a seeded random so every build is identical.
const W=480,H=300;

function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const f=n=>Math.round(n*10)/10;
const stars=(rand,count,{top=0,bottom=H*.6,max=1.4,cls='cs-star'}={})=>Array.from({length:count},()=>`<circle class="${cls}" cx="${f(rand()*W)}" cy="${f(top+rand()*(bottom-top))}" r="${f(.3+rand()*max)}" opacity="${f(.35+rand()*.65)}"/>`).join('');
// A ridge of pines along a baseline: each tree is a stacked triangle silhouette.
function pines(rand,{base,height,count,spread=1,fill}){
 let d='';
 for(let i=0;i<count;i++){
  const x=(i+rand()*.8)/count*W*spread-(spread-1)*W/2,h=height*(.6+rand()*.6),w=h*.34;
  d+=`M${f(x)} ${f(base-h)}L${f(x+w*.55)} ${f(base-h*.55)}L${f(x+w*.3)} ${f(base-h*.55)}L${f(x+w)} ${f(base)}L${f(x-w)} ${f(base)}L${f(x-w*.3)} ${f(base-h*.55)}L${f(x-w*.55)} ${f(base-h*.55)}Z`;
 }
 return `<path d="${d}" fill="${fill}"/><rect x="0" y="${base-1}" width="${W}" height="${H-base+1}" fill="${fill}"/>`;
}
// Rolling hills from a few sine terms.
function hills(rand,{base,amp,fill,steps=24}){
 const a=rand()*6,b=rand()*6;let d=`M0 ${H}`;
 for(let i=0;i<=steps;i++){const x=i/steps*W;d+=`L${f(x)} ${f(base-amp*(.5+.3*Math.sin(x/70+a)+.2*Math.sin(x/23+b)))}`}
 return `<path d="${d}L${W} ${H}Z" fill="${fill}"/>`;
}
const sky=(id,top,bottom)=>`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
const glow=(id,color)=>`<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity=".85"/><stop offset=".35" stop-color="${color}" stop-opacity=".25"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
const frame=`<rect x="10" y="10" width="${W-20}" height="${H-20}" class="cs-frame"/>`;

const scenes={
 // 森之旅人: a lantern-bearer on a path through misty pine ridges under a pale moon.
 forest(){
  const r=rng(11);
  return `<defs>${sky('fo-sky','#0d2229','#2c4e4f')}${glow('fo-moon','#e8f0d8')}${glow('fo-lamp','#f3c46b')}</defs>
<rect width="${W}" height="${H}" fill="url(#fo-sky)"/>${stars(r,40,{bottom:150})}
<circle cx="350" cy="80" r="70" fill="url(#fo-moon)"/><circle cx="350" cy="80" r="24" fill="#e9eedc"/>
${pines(r,{base:190,height:90,count:16,fill:'#1d3a3d'})}<rect y="165" width="${W}" height="26" fill="#9fc0b5" opacity=".14"/>
${pines(r,{base:225,height:120,count:11,fill:'#142a2d'})}<rect y="205" width="${W}" height="20" fill="#9fc0b5" opacity=".12"/>
<path d="M150 300C200 262 228 246 240 226 250 246 290 262 360 300Z" fill="#2e4a46" opacity=".9"/>
${pines(r,{base:300,height:210,count:5,spread:1.25,fill:'#0a1618'})}
<circle cx="236" cy="226" r="34" fill="url(#fo-lamp)"/>
<path d="M232 248c0-10 1.5-17 4.5-20 3 3 4.5 10 4.5 20Z" fill="#0a1618"/><circle cx="236.5" cy="225" r="3.4" fill="#0a1618"/><path d="M240 236l6 4" stroke="#0a1618" stroke-width="1.4"/><circle cx="247" cy="241.5" r="2.2" fill="#ffd98a"/>
${Array.from({length:14},()=>`<circle cx="${f(120+r()*240)}" cy="${f(190+r()*90)}" r="${f(.8+r()*1.2)}" fill="#f7e2a0" opacity="${f(.4+r()*.6)}"/>`).join('')}`;
 },
 // 赤紅斗篷: a red-cloaked figure on a ridge of dead trees beneath a blood moon, wolf eyes in the dark.
 redhood(){
  const r=rng(23);
  const branch=(x,base,h,flip)=>{const s=flip?-1:1;return `M${x} ${base}L${x+2} ${base-h}M${x+1} ${base-h*.55}l${s*h*.32} ${-h*.28}m${-s*h*.14} ${h*.07}l${s*h*.06} ${-h*.16}M${x+1.5} ${base-h*.78}l${-s*h*.26} ${-h*.2}m${s*h*.1} ${h*.06}l${-s*h*.04} ${-h*.12}M${x+2} ${base-h}l${s*h*.08} ${-h*.1}`};
  return `<defs>${sky('rh-sky','#1a0d14','#4a1e24')}${glow('rh-moon','#e0513f')}</defs>
<rect width="${W}" height="${H}" fill="url(#rh-sky)"/>${stars(r,26,{bottom:120,max:1})}
<circle cx="240" cy="128" r="140" fill="url(#rh-moon)" opacity=".7"/><circle cx="240" cy="128" r="62" fill="#b8392f"/><circle cx="222" cy="112" r="10" fill="#a2302a" opacity=".6"/><circle cx="258" cy="140" r="14" fill="#a2302a" opacity=".5"/>
${hills(r,{base:225,amp:40,fill:'#2a1218'})}
<path d="${[60,98,128,350,392,430].map((x,i)=>branch(x,232-i%3*6,90+r()*60,i>2)).join('')}" stroke="#14080c" stroke-width="3.2" fill="none" stroke-linecap="round"/>
${hills(r,{base:268,amp:26,fill:'#14080c'})}
<path d="M240 196c-9 0-14 9-15 22l-9 50h48l-9-50c-1-13-6-22-15-22Z" fill="#c43a2f"/><path d="M240 196c-6 0-10 6-10 13 0 5 4 9 10 9s10-4 10-9c0-7-4-13-10-13Z" fill="#7e211c"/><path d="M234 268h12l-2-26h-8Z" fill="#14080c" opacity=".55"/>
<g fill="#ffcf6b">${[[96,252],[372,246],[410,262]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.4"/><ellipse cx="${x+9}" cy="${y}" rx="2.4" ry="1.4"/>`).join('')}</g>`;
 },
 // 魔法古書: an open grimoire on a lectern, glyphs rising through a shaft of candlelight.
 grimoire(){
  const r=rng(37);
  const glyphs=['ᚠ','ᚱ','ᛟ','ᚦ','ᛉ','ᛗ','ᚹ','ᛞ','ᛃ','ᚨ'];
  return `<defs>${sky('gr-sky','#14110d','#3a2f20')}${glow('gr-light','#f6d78b')}<linearGradient id="gr-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d78b" stop-opacity="0"/><stop offset="1" stop-color="#f6d78b" stop-opacity=".35"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#gr-sky)"/>
<path d="M90 300V70a150 150 0 0 1 300 0v230" fill="none" stroke="#5b4a2f" stroke-width="2" opacity=".6"/><path d="M110 300V78a130 130 0 0 1 260 0v222" fill="none" stroke="#5b4a2f" stroke-width="1" opacity=".5"/>
<path d="M190 0h100l-10 200h-80Z" fill="url(#gr-beam)"/><circle cx="240" cy="190" r="120" fill="url(#gr-light)" opacity=".55"/>
<path d="M200 300l12-78h56l12 78Z" fill="#1d1710"/><path d="M188 226h104l-8-12h-88Z" fill="#2c2318"/>
<path d="M240 206c-18-10-40-12-66-8l-6 18c26-3 50-1 72 8 22-9 46-11 72-8l-6-18c-26-4-48-2-66 8Z" fill="#efe1bd"/><path d="M240 206v18" stroke="#b49c6b" stroke-width="1.2"/>
${[0,1,2,3].map(i=>`<path d="M${186+i*0} ${206+i*3}h${36-i*4}M${262} ${206+i*3}h${36-i*4}" stroke="#a48c5d" stroke-width=".9" opacity=".7"/>`).join('')}
<g font-family="serif" fill="#f6d78b">${glyphs.map((g,i)=>`<text x="${f(196+r()*88)}" y="${f(60+i*13+r()*8)}" font-size="${f(10+r()*8)}" opacity="${f(.3+r()*.6)}" text-anchor="middle">${g}</text>`).join('')}</g>
${[[136,232],[344,226]].map(([x,y])=>`<rect x="${x-5}" y="${y}" width="10" height="34" fill="#e8dcc0"/><path d="M${x} ${y-14}c4 5 5 8 5 10a5 5 0 0 1-10 0c0-2 1-5 5-10Z" fill="#ffcf6b"/><circle cx="${x}" cy="${y-8}" r="24" fill="url(#gr-light)" opacity=".7"/>`).join('')}
${stars(r,30,{top:20,bottom:200,max:1,cls:'cs-dust'})}`;
 },
 // 深海之歌: light shafts into the deep, a sunken crown among coral, jellyfish drifting up.
 deepsea(){
  const r=rng(51);
  const coral=(x,h,s)=>`M${x} 300c0-${h*.4} ${s*6}-${h*.6} ${s*2}-${h}M${x} ${300-h*.45}c${s*14}-6 ${s*18}-${h*.2} ${s*16}-${h*.42}M${x+s} ${300-h*.7}c${-s*12}-4 ${-s*14}-${h*.16} ${-s*12}-${h*.3}`;
  return `<defs>${sky('ds-sky','#0e3550','#050c18')}${glow('ds-glow','#7fd3e6')}</defs>
<rect width="${W}" height="${H}" fill="url(#ds-sky)"/>
${[[150,40],[230,60],[310,36],[380,50]].map(([x,w])=>`<path d="M${x} 0h${w}l${-w*1.4} ${H}h${-w*.6}Z" fill="#9fdcf0" opacity=".07"/>`).join('')}
<path d="M0 18c40-8 80 8 120 0s80-8 120 0 80 8 120 0 80-8 120 0" stroke="#9fdcf0" stroke-opacity=".35" fill="none"/>
${hills(r,{base:258,amp:30,fill:'#081a26'})}
<path d="${[70,96,402,430].map((x,i)=>coral(x,60+r()*40,i%2?1:-1)).join('')}" stroke="#2c6f7a" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="240" cy="246" r="60" fill="url(#ds-glow)" opacity=".5"/>
<path d="M214 256l-6-26 16 12 16-22 16 22 16-12-6 26Z" fill="#d9bf8a" transform="rotate(-8 240 246)"/><circle cx="240" cy="240" r="3" fill="#7fd3e6" transform="rotate(-8 240 246)"/>
${[[150,110,1],[330,80,.8],[392,150,.6]].map(([x,y,s])=>`<g transform="translate(${x} ${y}) scale(${s})" opacity=".85"><path d="M-18 0a18 14 0 0 1 36 0q-9 4-18 0q-9 4-18 0Z" fill="#9fdcf0" opacity=".55"/><path d="M-10 3c-2 14 2 22-2 34M0 3c2 16-2 26 1 38M10 3c-2 12 3 20 0 30" stroke="#9fdcf0" stroke-opacity=".5" fill="none"/></g>`).join('')}
${Array.from({length:18},()=>`<circle cx="${f(r()*W)}" cy="${f(60+r()*200)}" r="${f(1+r()*2.6)}" fill="none" stroke="#bfe8f4" stroke-opacity="${f(.25+r()*.5)}"/>`).join('')}`;
 },
 // 銀色魔鏡: an ornate standing mirror between drawn curtains; the glass shows a moon that is not in the room.
 mirror(){
  const r=rng(67);
  const tiles=Array.from({length:9},(_,i)=>`M${240+(i-4)*16} 232L${240+(i-4)*90} 300`).join('');
  return `<defs>${sky('mi-sky','#1b1622','#2e2433')}<linearGradient id="mi-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfd6e6"/><stop offset=".5" stop-color="#5d6b86"/><stop offset="1" stop-color="#232a3c"/></linearGradient>${glow('mi-glow','#e7d5ef')}</defs>
<rect width="${W}" height="${H}" fill="url(#mi-sky)"/>
<path d="M0 232h${W}v68H0Z" fill="#151019"/><path d="${tiles}M0 252h${W}M0 276h${W}" stroke="#4a3d4f" stroke-width="1" opacity=".7"/>
<circle cx="240" cy="130" r="120" fill="url(#mi-glow)" opacity=".35"/>
<path d="M0 0h120c-10 60-14 140 10 232H0Z" fill="#5a2733"/><path d="M480 0H360c10 60 14 140-10 232h130Z" fill="#5a2733"/><path d="M28 0c6 80 10 160 0 232M62 0c8 80 12 160 6 232M418 0c-6 80-10 160 0 232M452 0c-8 80-12 160-6 232" stroke="#3b1820" stroke-width="5" fill="none" opacity=".8"/>
<ellipse cx="240" cy="128" rx="62" ry="86" fill="none" stroke="#d9bf8a" stroke-width="7"/><ellipse cx="240" cy="128" rx="54" ry="78" fill="url(#mi-glass)"/>
<circle cx="258" cy="96" r="16" fill="#eef0f6" opacity=".9"/><circle cx="264" cy="91" r="14" fill="#3f4a62" opacity=".95"/>
${stars(r,14,{top:62,bottom:190,max:.8,cls:'cs-glint'})}
<path d="M212 70c-8 14-12 34-10 52" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M240 34l7 8-7 10-7-10Z" fill="#d9bf8a"/><path d="M178 128h-10M302 128h10M240 214v18M222 232h36" stroke="#d9bf8a" stroke-width="5" stroke-linecap="round"/>`;
 },
 // 夜色星軌: star trails circling the pole above a hilltop observatory.
 startrail(){
  const r=rng(83);const cx=300,cy=70;
  const arcs=Array.from({length:120},()=>{const rad=10+Math.pow(r(),.8)*320,a=r()*Math.PI*2,len=.35+r()*.5,x1=cx+rad*Math.cos(a),y1=cy+rad*Math.sin(a),x2=cx+rad*Math.cos(a+len),y2=cy+rad*Math.sin(a+len);return `<path d="M${f(x1)} ${f(y1)}A${f(rad)} ${f(rad)} 0 0 1 ${f(x2)} ${f(y2)}" stroke="${r()<.2?'#efdbad':'#b9cde6'}" stroke-opacity="${f(.25+r()*.6)}" stroke-width="${f(.6+r()*.9)}" fill="none"/>`}).join('');
  return `<defs>${sky('st-sky','#070d1c','#1f3550')}${glow('st-pole','#efdbad')}</defs>
<rect width="${W}" height="${H}" fill="url(#st-sky)"/>${arcs}<circle cx="${cx}" cy="${cy}" r="20" fill="url(#st-pole)"/><circle cx="${cx}" cy="${cy}" r="2.4" fill="#fff6dc"/>
${hills(r,{base:240,amp:30,fill:'#13202f'})}
<path d="M0 300V262c60-14 110-30 170-30s110 12 170 22 100 6 140 0v46Z" fill="#0a121c"/>
<path d="M120 234v-34h40v34Z" fill="#0a121c"/><path d="M114 202a26 26 0 0 1 52 0Z" fill="#0a121c"/><path d="M146 186l26-18" stroke="#0a121c" stroke-width="5" stroke-linecap="round"/><rect x="134" y="214" width="8" height="10" fill="#ffd98a"/>
<path d="M120 234h40" stroke="#efdbad" stroke-opacity=".3"/>
<circle cx="404" cy="214" r="18" fill="none" stroke="#efdbad" stroke-opacity=".35"/><path d="m404 198 3.5 12.5L420 214l-12.5 3.5L404 230l-3.5-12.5L388 214l12.5-3.5Z" fill="#efdbad" opacity=".55"/>`;
 }
};

function conceptScene(key,label){
 const draw=scenes[key];
 if(!draw)throw new Error('unknown concept scene '+key);
 return `<svg class="concept-scene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}"><g>${draw()}</g>${frame}</svg>`;
}
module.exports={conceptScene,sceneKeys:Object.keys(scenes)};
