// The prism ballroom (稜鏡舞廳, 鏡淵 E2): three light-and-mirror mechanisms that share one rule set and one drawing routine.
//  - prism-rays    the colour filter: white light keeps only the colour of the filter it crosses
//  - prism-blend   the combiner crystal: two colours that enter it leave as one beam
//  - prism-ballroom  both together, plus two dancers who stand in the way
// Light is a bitmask (red 1, green 2, blue 4, white 7) and masks do not absorb it, so a mask can be lit with too much.
// The rules are pure and checked by exhaustive search in scripts/blood-mirror-abyss.test.mjs; the mount below only draws them.
// The stages were found by plan-improve/prototypes/e2-prism.gen.cjs and are proven to have one beam solution each.
import {hintMarkup,bindHints} from './belfry-hints.js';

export const COLORS={R:1,G:2,B:4,W:7};
const DIRS={'/':([dx,dy])=>[-dy,-dx],'\\':([dx,dy])=>[dy,dx]};
export const bits=n=>(n&1)+((n>>1)&1)+((n>>2)&1);

// layout: {w,h,emitters:[{c,x}],mirrors:[{x,y}],filters:[{x,y,c}],crystals:[{x,y,dir:[dx,dy]}],blockers:[{a:[x,y],b:[x,y]}],targets:[{x,y,need}]}
// state:  {m:['/'|'\\',...], k:[0|1,...]}  (k = which of a dancer's two cells the dancer stands on)
// A filter keeps only its own colour. A crystal swallows the light that enters it and, once the colours it has received add
// up to two or more, shoots them out as one beam in its own direction.
export function trace(L,S){
 const blocked=new Map(),mir=new Map(),tgt=new Map(),fil=new Map(),cry=new Map();
 const filters=L.filters||[],crystals=L.crystals||[];
 L.blockers.forEach((b,i)=>{const p=S.k[i]?b.b:b.a;blocked.set(p[0]+','+p[1],i);});
 L.mirrors.forEach((m,i)=>mir.set(m.x+','+m.y,S.m[i]));
 L.targets.forEach((t,i)=>tgt.set(t.x+','+t.y,i));
 filters.forEach(f=>fil.set(f.x+','+f.y,f.c));
 crystals.forEach((c,i)=>cry.set(c.x+','+c.y,i));
 function go(start,x,y,dir,mask,out){
  const segs=[{mask,pts:[start]}],cells=[],seen=new Set();let end='edge';
  for(;;){
   const seg=segs[segs.length-1];
   if(x<0||y<0||x>=L.w||y>=L.h){end='edge';break;}
   const key=x+','+y,sk=key+','+dir;if(seen.has(sk)){end='loop';break;}seen.add(sk);
   if(blocked.has(key)){seg.pts.push([x-dir[0]*0.35,y-dir[1]*0.35]);end='blocked';break;}
   seg.pts.push([x,y]);cells.push(key);
   if(fil.has(key)){const next=mask&fil.get(key);if(!next){end='filtered';break;}if(next!==mask){mask=next;segs.push({mask,pts:[[x,y]]});}}
   if(tgt.has(key))out.got[tgt.get(key)]|=mask;
   if(cry.has(key)){out.cin[cry.get(key)]|=mask;end='crystal';break;}
   if(mir.has(key))dir=DIRS[mir.get(key)](dir);
   x+=dir[0];y+=dir[1];
  }
  if(end==='edge'){const seg=segs[segs.length-1];seg.pts.push([x-dir[0]*0.5,y-dir[1]*0.5]);}
  return {segs,cells,end};
 }
 function run(cin){
  const out={got:L.targets.map(()=>0),cin:crystals.map(()=>0),beams:[]};
  for(const e of L.emitters)out.beams.push(go([e.x,-0.6],e.x,0,[0,1],COLORS[e.c],out));
  crystals.forEach((c,i)=>{if(bits(cin[i])>=2)out.beams.push(go([c.x,c.y],c.x+c.dir[0],c.y+c.dir[1],c.dir,cin[i],out));});
  return out;
 }
 // What a crystal receives depends on what it sends, so the beams are traced again until the crystals stop changing.
 let cin=crystals.map(()=>0),res=run(cin);
 for(let pass=0;pass<6&&!res.cin.every((v,i)=>v===cin[i]);pass++){cin=res.cin;res=run(cin);}
 res.stable=res.cin.every((v,i)=>v===cin[i]);
 res.crystalIn=cin;
 return res;
}
export const solved=(L,S)=>{const r=trace(L,S);return r.stable&&L.targets.every((t,i)=>r.got[i]===t.need);};
export const litCount=(L,S)=>{const r=trace(L,S);return L.targets.filter((t,i)=>r.got[i]===t.need).length;};
export function allStates(L){
 const out=[],M=L.mirrors.length,n=M+L.blockers.length;
 for(let b=0;b<(1<<n);b++)out.push({m:L.mirrors.map((_,i)=>(b>>i)&1?'\\':'/'),k:L.blockers.map((_,i)=>(b>>(M+i))&1)});
 return out;
}
export const solutions=L=>allStates(L).filter(S=>solved(L,S));
// A solution is identified by the light it makes, so a mirror that no beam touches does not make a second solution.
export const signature=(L,S)=>{const r=trace(L,S);return JSON.stringify([r.beams.map(b=>b.segs),r.got,r.crystalIn]);};
export const pathCells=(L,S)=>{const cells=new Set();trace(L,S).beams.forEach(b=>b.cells.forEach(c=>cells.add(c)));return cells;};

export const STAGES={
 'prism-rays':{title:'濾鏡',goal:'白光裡藏著三種顏色。這個面具只要紅光：讓光先經過紅色的濾鏡，再照到它。',
  L:{w:7,h:5,emitters:[{c:'W',x:6}],mirrors:[{x:6,y:1},{x:3,y:1},{x:5,y:3}],filters:[{x:5,y:1,c:1}],crystals:[],blockers:[],targets:[{x:3,y:2,need:1}]},
  init:{m:['\\','\\','/'],k:[]}},
 'prism-blend':{title:'合光水晶',goal:'這個面具要黃光，但紅光和綠光是分開的兩束。讓兩束光都照進合光水晶，它會把兩種顏色合成一束，朝箭頭方向射出。',
  L:{w:7,h:5,emitters:[{c:'R',x:5},{c:'G',x:4}],mirrors:[{x:6,y:1},{x:2,y:0},{x:4,y:2},{x:4,y:1}],filters:[],crystals:[{x:5,y:1,dir:[1,0]}],blockers:[],targets:[{x:6,y:2,need:3}]},
  init:{m:['/','/','/','/'],k:[]}},
 'prism-ballroom':{title:'舞廳',goal:'讓三個面具各自亮起需要的顏色：紅、藍、黃。光會穿過面具繼續前進，所以不要讓多餘的光照到它。點舞者可以把他推到另一格。',
  L:{w:9,h:7,emitters:[{c:'W',x:8},{c:'G',x:6},{c:'B',x:5}],mirrors:[{x:3,y:1},{x:1,y:6},{x:5,y:6},{x:8,y:6},{x:0,y:4},{x:4,y:5},{x:3,y:0}],filters:[{x:8,y:4,c:1}],crystals:[{x:8,y:3,dir:[0,1]}],blockers:[{a:[6,5],b:[3,3]},{a:[4,4],b:[6,3]}],targets:[{x:8,y:5,need:1},{x:1,y:5,need:4},{x:6,y:6,need:3}]},
  init:{m:['/','/','\\','\\','/','\\','/'],k:[0,1]}}
};
const solutionCache={};
export const solutionOf=id=>solutionCache[id]||(solutionCache[id]=solutions(STAGES[id].L)[0]);

const NAME={1:'紅',2:'綠',4:'藍',3:'黃（紅＋綠）',5:'洋紅（紅＋藍）',6:'青（綠＋藍）',7:'白'};
// What is still wrong, read from the player's own board: the first mask that is not right, the mirror or dancer that must change.
// A mirror counts only if the solution's light crosses it; a dancer only if it now stands in the solution's light.
export function diagnose(L,S,sol){
 const r=trace(L,S),ti=L.targets.findIndex((t,i)=>r.got[i]!==t.need);
 if(ti<0)return null;
 const onPath=pathCells(L,sol);
 const mi=sol.m.findIndex((v,i)=>S.m[i]!==v&&onPath.has(L.mirrors[i].x+','+L.mirrors[i].y));
 const ki=sol.k.findIndex((v,i)=>{if(S.k[i]===v)return false;const p=S.k[i]?L.blockers[i].b:L.blockers[i].a;return onPath.has(p[0]+','+p[1]);});
 // The board can be wrong only where the solution's light never passes (a mirror the beam skips, a dancer off its path).
 // Fall back to any piece that differs, so a stuck player always gets a hint that names a real fix.
 const anyMirror=mi>=0||ki>=0?mi:sol.m.findIndex((v,i)=>S.m[i]!==v);
 const anyDancer=mi>=0||anyMirror>=0?ki:sol.k.findIndex((v,i)=>S.k[i]!==v);
 return {ti,mi:anyMirror,ki:anyDancer,got:r.got[ti]};
}
// Candle-light hint, three tiers: which mask and what it needs, what kind of fix, the exact fix.
export function hint(L,S,sol,tier){
 const d=diagnose(L,S,sol);if(!d)return null;
 const t=L.targets[d.ti],where='第 '+(t.x+1)+' 欄、第 '+(t.y+1)+' 列的面具';
 if(tier===1){
  const clue=(L.crystals||[]).length&&bits(t.need)>=2?'兩種顏色要先合成一束，想想合光水晶在哪裡。':(L.filters||[]).some(f=>f.c===t.need)?'想想哪一道光要先經過濾鏡。':'先想想哪一道光該去那裡。';
  return where+'還沒亮對：它需要'+NAME[t.need]+'光，現在'+(d.got?'是'+NAME[d.got]+'光':'沒有光')+'。'+clue;
 }
 if(tier===2)return d.mi>=0?'有一面鏡子的角度不對。沿著光束走，看看哪一面鏡子把光送去了錯的方向，點它轉個向。':'有一位舞者擋住了光。點舞者可以把他推到另一格。';
 return d.mi>=0?'把第 '+(L.mirrors[d.mi].x+1)+' 欄、第 '+(L.mirrors[d.mi].y+1)+' 列的鏡子轉成「'+sol.m[d.mi]+'」。':'把第 '+(d.ki+1)+' 位舞者推到另一格。';
}
// The hint step is the mask and the kind of fix; the tier starts again whenever it changes (belfry-hints.js).
export function hintStep(L,S,sol){
 const d=diagnose(L,S,sol);
 return d?'mask'+d.ti+(d.mi>=0?'-mirror':'-dancer'):null;
}

const CELL=10;
const px=v=>(v+.5)*CELL;
const rgbOf=mask=>'rgb('+(mask&1?255:55)+','+(mask&2?255:55)+','+(mask&4?255:55)+')';
// Colour is never the only cue: red is a triangle, green a circle, blue a square, white a diamond.
const sym=(c,x,y,r,fill)=>{
 const f=fill||rgbOf(c);
 if(c===1)return '<path d="M'+x+' '+(y-r)+'L'+(x+r*.95)+' '+(y+r*.7)+'L'+(x-r*.95)+' '+(y+r*.7)+'Z" fill="'+f+'"/>';
 if(c===2)return '<circle cx="'+x+'" cy="'+y+'" r="'+r*.85+'" fill="'+f+'"/>';
 return '<rect x="'+(x-r*.8)+'" y="'+(y-r*.8)+'" width="'+r*1.6+'" height="'+r*1.6+'" fill="'+f+'"/>';
};
const diamond=(x,y,r,fill)=>'<path d="M'+x+' '+(y-r)+'L'+(x+r)+' '+y+'L'+x+' '+(y+r)+'L'+(x-r)+' '+y+'Z" fill="'+fill+'"/>';
const maskSyms=(mask,cx,cy,r,fill)=>{const colours=[1,2,4].filter(c=>mask&c);return colours.map((c,i)=>sym(c,cx+(i-(colours.length-1)/2)*r*2.3,cy,r,fill)).join('');};

function boardMarkup(L,S){
 const W=L.w*CELL,H=L.h*CELL,r=trace(L,S);
 let s='<defs><filter id="prism-glow"><feGaussianBlur stdDeviation="1.1"/></filter></defs>';
 for(let y=0;y<L.h;y++)for(let x=0;x<L.w;x++)s+='<rect x="'+x*CELL+'" y="'+y*CELL+'" width="'+CELL+'" height="'+CELL+'" fill="'+((x+y)%2?'#1c1424':'#120c1a')+'"/>';
 for(const e of L.emitters){
  const c=COLORS[e.c],x=px(e.x);
  s+='<path d="M'+(x-3.4)+' -3.4L'+(x+3.4)+' -3.4L'+x+' -8.6Z" fill="#e8f0ff" fill-opacity=".85" stroke="#9fb4d8" stroke-width=".4"/>'
   +(c===7?diamond(x,-4.9,1.7,'#0b0710'):sym(c,x,-4.5,1.7,'#0b0710'))
   +'<text x="'+x+'" y="-9.4" font-size="2.6" text-anchor="middle" fill="'+rgbOf(c)+'">'+({R:'紅',G:'綠',B:'藍',W:'白'})[e.c]+'</text>';
 }
 // Masks sit under the beams so the light visibly passes through them.
 L.targets.forEach((t,i)=>{
  const x=px(t.x),y=px(t.y),got=r.got[i],ok=got===t.need,over=got&~t.need;
  s+='<g><ellipse cx="'+x+'" cy="'+y+'" rx="4.2" ry="3.4" fill="'+(ok?'#1d2f1d':'#161018')+'" stroke="'+(ok?'#6f6':over?'#f66':'#7a6a4a')+'" stroke-width="'+(ok?.9:.6)+'"/>'
   +'<ellipse cx="'+(x-1.5)+'" cy="'+(y-.4)+'" rx=".8" ry=".6" fill="'+(ok?'#cfc':'#000')+'"/><ellipse cx="'+(x+1.5)+'" cy="'+(y-.4)+'" rx=".8" ry=".6" fill="'+(ok?'#cfc':'#000')+'"/>'
   +maskSyms(t.need,x,y+5.3,1.4)+(over?'<text x="'+x+'" y="'+(y-4.6)+'" font-size="2.4" text-anchor="middle" fill="#f66">顏色太多</text>':'')+'</g>';
 });
 for(const f of L.filters||[]){
  const x=px(f.x),y=px(f.y);
  s+='<g><path d="M'+x+' '+(y-4.4)+'L'+(x+4.4)+' '+y+'L'+x+' '+(y+4.4)+'L'+(x-4.4)+' '+y+'Z" fill="'+rgbOf(f.c)+'" fill-opacity=".22" stroke="'+rgbOf(f.c)+'" stroke-width=".7"/>'+sym(f.c,x,y,1.5,rgbOf(f.c))+'</g>';
 }
 (L.crystals||[]).forEach((c,i)=>{
  const x=px(c.x),y=px(c.y),lit=bits(r.crystalIn[i])>=2,a=Math.atan2(c.dir[1],c.dir[0]);
  const hex=[0,1,2,3,4,5].map(k=>(x+Math.cos(k*Math.PI/3+Math.PI/6)*4.6).toFixed(2)+','+(y+Math.sin(k*Math.PI/3+Math.PI/6)*4.6).toFixed(2)).join(' ');
  const tip=[x+Math.cos(a)*3.7,y+Math.sin(a)*3.7];
  s+='<g><polygon points="'+hex+'" fill="'+(lit?rgbOf(r.crystalIn[i]):'#20182c')+'" fill-opacity="'+(lit?.5:1)+'" stroke="'+(lit?'#fff':'#8a7aa8')+'" stroke-width=".6"/>'
   +'<path d="M'+tip[0]+' '+tip[1]+'l'+Math.cos(a+2.6)*2.1+' '+Math.sin(a+2.6)*2.1+'M'+tip[0]+' '+tip[1]+'l'+Math.cos(a-2.6)*2.1+' '+Math.sin(a-2.6)*2.1+'" stroke="#e0b84f" stroke-width=".6" fill="none"/>'
   +(r.crystalIn[i]?maskSyms(r.crystalIn[i],x,y,1.1,'#fff'):'')+'</g>';
 });
 s+='<g class="prism-beams">';
 for(const beam of r.beams)for(const seg of beam.segs){
  const c=seg.mask,d=seg.pts.map(p=>px(p[0])+','+px(p[1])).join(' ');
  s+='<polyline points="'+d+'" fill="none" stroke="'+rgbOf(c)+'" stroke-width="3.4" stroke-opacity=".28" filter="url(#prism-glow)" stroke-linejoin="round"/>'
   +'<polyline points="'+d+'" fill="none" stroke="'+rgbOf(c)+'" stroke-width="1.3" stroke-linejoin="round"/>';
  for(let i=1;i<seg.pts.length-1;i+=3)s+=c===7?diamond(px(seg.pts[i][0]),px(seg.pts[i][1]),1.1,'#fff'):maskSyms(c,px(seg.pts[i][0]),px(seg.pts[i][1]),1.0,'#fff');
 }
 s+='</g>';
 // A dancer shows a faint ghost on the cell it can be pushed to.
 L.blockers.forEach((b,i)=>{
  const cur=S.k[i]?b.b:b.a,alt=S.k[i]?b.a:b.b;
  const figure=(p,ghost)=>'<g opacity="'+(ghost?.28:1)+'" transform="translate('+px(p[0])+' '+px(p[1])+')"><circle cy="-2.4" r="1.5" fill="#d9c9a8"/><path d="M-2.3 3.4L0 -.8L2.3 3.4Z" fill="#7a1530" stroke="#c9a24a" stroke-width=".3"/></g>';
  s+=figure(alt,true)+'<g class="prism-hit" data-dancer="'+i+'" tabindex="0" role="button" aria-label="舞者 '+(i+1)+'，在第 '+(cur[0]+1)+' 欄、第 '+(cur[1]+1)+' 列（點一下推到第 '+(alt[0]+1)+' 欄、第 '+(alt[1]+1)+' 列）">'+figure(cur,false)+'<rect x="'+(px(cur[0])-5)+'" y="'+(px(cur[1])-5)+'" width="10" height="10" fill="transparent"/></g>';
 });
 L.mirrors.forEach((m,i)=>{
  const x=px(m.x),y=px(m.y),a=S.m[i]==='/'?[-3.6,3.6,3.6,-3.6]:[-3.6,-3.6,3.6,3.6];
  s+='<g class="prism-hit" data-mirror="'+i+'" tabindex="0" role="button" aria-label="鏡子 '+(i+1)+'，在第 '+(m.x+1)+' 欄、第 '+(m.y+1)+' 列，目前 '+S.m[i]+'（點一下轉向）"><circle cx="'+x+'" cy="'+y+'" r="4.6" fill="#1a1024" stroke="#6b5a3a" stroke-width=".4"/>'
   +'<line x1="'+(x+a[0])+'" y1="'+(y+a[1])+'" x2="'+(x+a[2])+'" y2="'+(y+a[3])+'" stroke="#e0b84f" stroke-width="1.6" stroke-linecap="round"/>'
   +'<line x1="'+(x+a[0])+'" y1="'+(y+a[1])+'" x2="'+(x+a[2])+'" y2="'+(y+a[3])+'" stroke="#fff6cf" stroke-width=".5" stroke-linecap="round"/>'
   +'<rect x="'+(x-5)+'" y="'+(y-5)+'" width="10" height="10" fill="transparent"/></g>';
 });
 return {markup:s,viewBox:'-3 -13 '+(W+6)+' '+(H+17)};
}

const LEGEND='<ol class="belfry-rules"><li>光有形狀，不靠顏色也看得出來：◆ 白（含三色）、▲ 紅、● 綠、■ 藍；黃＝▲＋●。面具下方的符號，就是它需要的光。</li>'
 +'<li>點鏡子轉向。光會穿過面具繼續前進，面具被照到多餘的顏色會顯示「顏色太多」。</li></ol>';
const RULES={
 'prism-rays':'<li>濾鏡（菱形）只放行和它同色的光：白光經過紅濾鏡，只剩紅光。</li>',
 'prism-blend':'<li>合光水晶（六角形）要收到兩種以上的顏色才會亮，再把它們合成一束，朝箭頭方向射出。</li>',
 'prism-ballroom':'<li>這一關同時有濾鏡、合光水晶和兩位舞者。點舞者，把他推到另一格（淡影）。</li>'
};
const DONE={
 'prism-rays':'紅光穿過濾鏡，照亮了面具。',
 'prism-blend':'兩束光在水晶裡合成一束，黃色的面具亮了。',
 'prism-ballroom':'三張面具同時亮起。吊燈裡傳來一陣尖叫。'
};

// ctx = { render(html), done(), playCue(kind) }
function mountPrism(stageId,ctx){
 const stage=STAGES[stageId],L=stage.L,sol=solutionOf(stageId),last=stageId==='prism-ballroom';
 let S={m:[...stage.init.m],k:[...stage.init.k]},finished=false;
 ctx.render('<div class="belfry prism">'
  +'<p class="challenge-help"><b>'+stage.title+'。</b>'+stage.goal+'</p>'
  +LEGEND.replace('</ol>',RULES[stageId]+'</ol>')
  +'<p id="bf-status" class="belfry-status" role="status"></p>'
  +'<div class="belfry-board prism-board"><svg id="bf-svg" class="belfry-svg prism-svg" role="group" aria-label="舞廳光路盤"></svg></div>'
  +hintMarkup+'</div>');
 const $=id=>document.getElementById(id),svg=$('bf-svg');
 const alive=()=>svg.isConnected;
 const say=(text,tone='')=>{const el=$('bf-status');el.textContent=text;el.dataset.tone=tone;};
 // Every tier is computed from the board as it is now, so a hint never talks about a mirror the player already fixed.
 const tiers=new Proxy({},{get:()=>[1,2,3].map(tier=>hint(L,S,sol,tier))});
 const hints=bindHints({hints:tiers,currentStep:()=>finished?null:hintStep(L,S,sol),alive});

 function draw(focus){
  const {markup,viewBox}=boardMarkup(L,S);
  svg.setAttribute('viewBox',viewBox);svg.innerHTML=markup;
  for(const g of svg.querySelectorAll('[data-mirror]')){
   const act=()=>flip('m',+g.dataset.mirror);
   g.onclick=act;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act();}};
  }
  for(const g of svg.querySelectorAll('[data-dancer]')){
   const act=()=>flip('k',+g.dataset.dancer);
   g.onclick=act;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act();}};
  }
  if(focus)svg.querySelector(focus)?.focus({preventScroll:true});
 }
 function flip(kind,index){
  if(finished)return;
  if(kind==='m')S.m[index]=S.m[index]==='/'?'\\':'/';else S.k[index]^=1;
  ctx.playCue('click');
  draw(kind==='m'?'[data-mirror="'+index+'"]':'[data-dancer="'+index+'"]');
  update();
 }
 function update(){
  const lit=litCount(L,S),total=L.targets.length;
  if(solved(L,S)){
   finished=true;
   say(DONE[stageId],'ok');hints.changed();
   ctx.playCue(last?'choir':'door');
   setTimeout(()=>{if(alive())ctx.done();},document.body.classList.contains('reduce-motion')?0:last?1600:800);
   return;
  }
  say('已亮起 '+lit+' / '+total+' 個面具。'+(lit?'':'還沒有面具亮起。'),'');
  hints.changed();
 }
 draw();update();
}
export const mountPrismRays=ctx=>mountPrism('prism-rays',ctx);
export const mountPrismBlend=ctx=>mountPrism('prism-blend',ctx);
export const mountPrismBallroom=ctx=>mountPrism('prism-ballroom',ctx);
