// E4 無限鏡廊 (the endless gallery), two mechanisms: aligning (stack two panels on a shared object, then enlarge one so
// the sizes agree) and merging (flip a mirrored door, then put the four panels in the order of the red thread). Rules,
// hints and the order check are pure functions so scripts/blood-mirror-abyss.test.mjs can check them over every view a
// player can reach; the mount* functions only draw. The rules mirror plan-improve/prototypes/e4-gallery.model.js, which
// e4-gallery.solve.cjs checks the same way.
import {bindHints,hintMarkup} from './belfry-hints.js';

// ---- Rules. Every panel is a 1664x944 picture shown in a 352x200 box (board units). An anchor is a recognisable object
// in the picture: x,y,r are source pixels (r = visible half-size, the number that has to match after scaling) and `notch`
// is the side a door opens, drawn as a gold triangle so a flip can be told from the picture alone.
export const PW=352,PH=200,BOARD_W=744,SRC=[1664,944],F=PW/SRC[0],ZOOM=BOARD_W/PW,SIZE_TOL=1.2; // a zoomed panel fills the board width
export const PANELS={
 A:{name:'鏡廊',art:'mirror-hall'},
 B:{name:'陽台',art:'balcony'},
 C:{name:'黑松林',art:'black-pine-path'},
 D:{name:'舞廳',art:'ballroom'}
};
export const ANCHORS={
 A:[
  {id:'moonL',type:'moon',label:'左邊鏡子裡的月亮',x:528,y:370,r:28},
  {id:'moonR',type:'moon',label:'右邊鏡子裡的月亮',x:1203,y:370,r:28},
  {id:'door',type:'door',label:'盡頭的門',x:850,y:520,r:137,notch:'R'},
  {id:'doorMoon',type:'moon',label:'門縫裡露出的月光',x:903,y:398,r:22}
 ],
 B:[
  {id:'moon',type:'moon',label:'陽台上的月亮',x:443,y:142,r:28}
 ],
 C:[
  {id:'lantern',type:'lamp',label:'樹上的提燈',x:490,y:285,r:57}
 ],
 D:[
  {id:'chandelier',type:'lamp',label:'大吊燈',x:833,y:180,r:120},
  {id:'doorLamp',type:'lamp',label:'門內的小吊燈',x:833,y:325,r:75},
  {id:'door',type:'door',label:'大門',x:848,y:460,r:130,notch:'L'},
  {id:'windowL',type:'window',label:'左邊的拱窗',x:610,y:420,r:90},
  {id:'windowR',type:'window',label:'右邊的拱窗',x:1055,y:420,r:90}
 ]
};
// The three red threads (kinds 0, 1, 2) and the move each one teaches. Kind 0 accepts either moon (the mirrors are symmetric).
export const KINDS=[
 {teach:'疊放',a:'B.moon',b:['A.moonL','A.moonR']},
 {teach:'大小',a:'C.lantern',b:['D.chandelier']},
 {teach:'翻面',a:'A.door',b:['D.door']}
];
export const CHAIN=['B','A','D','C']; // adjacent panels are the linked ones; the reverse order is the same thread read the other way
export const isChain=order=>order.length===4&&(order.join('')===CHAIN.join('')||order.join('')===[...CHAIN].reverse().join(''));
// The first neighbouring pair in an order that has no thread between them, or -1.
export const firstBadGap=order=>{
 const link=(p,q)=>Math.abs(CHAIN.indexOf(p)-CHAIN.indexOf(q))===1;
 for(let i=0;i<order.length-1;i++)if(!link(order[i],order[i+1]))return i;
 return -1;
};
export const find=ref=>{const [panel,id]=ref.split('.');return {panel,anchor:ANCHORS[panel].find(a=>a.id===id)};};
// view = {zoom:null|{panel}, flip:{A,B,C,D}}. A zoomed panel is shown at the full board width, so everything in it is ZOOM times larger.
export const mag=(view,p)=>view.zoom&&view.zoom.panel===p?ZOOM:1;
export const flipped=(view,p)=>!!(view.flip&&view.flip[p]);
// Where an anchor appears inside its (possibly enlarged) box, in board units relative to the box.
export function at(view,p,a){
 const x=flipped(view,p)?SRC[0]-a.x:a.x,m=mag(view,p);
 return [x*F*m,a.y*F*m];
}
export const size=(view,p,a)=>a.r*F*mag(view,p);
export const side=(view,p,a)=>a.notch?(flipped(view,p)?(a.notch==='L'?'R':'L'):a.notch):null;
// Can anchor a (panel p) be laid on anchor b (panel q) in this view? Position is the player's drag; this is what the objects must agree on.
export function match(view,p,a,q,b){
 if(p===q)return {ok:false,reason:'same'};
 if(a.type!==b.type)return {ok:false,reason:'type'};
 const ratio=size(view,p,a)/size(view,q,b);
 if(ratio>SIZE_TOL||ratio<1/SIZE_TOL)return {ok:false,reason:ratio>1?'big':'small',ratio};
 if(side(view,p,a)!==side(view,q,b))return {ok:false,reason:'side'};
 return {ok:true,ratio};
}
export const key=(p,a,q,b)=>[p+'.'+a.id,q+'.'+b.id].sort().join('~');
// Every valid link in a view, as pair keys.
export function valid(view){
 const out=[];
 for(const p in ANCHORS)for(const q in ANCHORS)if(p<q)
  for(const a of ANCHORS[p])for(const b of ANCHORS[q])if(match(view,p,a,q,b).ok)out.push(key(p,a,q,b));
 return out;
}
// Which thread (0..2) a valid pair key makes, or -1.
export const kindOf=pair=>KINDS.findIndex(k=>k.b.some(b=>pair===[k.a,b].sort().join('~')));
export const REASONS={
 type:'這兩樣東西不是同一種。',
 big:'大小差太多：你拖的這樣東西比對面大。',
 small:'大小差太多：你拖的這樣東西比對面小。',
 side:'開口的方向相反，要有一邊翻面。',
 same:'請選另一格裡的東西。'
};
// Snap radius in board units: 6% of a panel's height, but never under 22 screen pixels at the current board scale.
export const snapRadius=scale=>Math.max(0.06*PH,22/scale);

// ---- Stages: which threads each one needs, and which are already hanging when it opens.
export const STAGES={
 align:{need:[0,1],preset:[]},
 merge:{need:[2],preset:[0,1]}
};
// The thread a player is working on, in the order the stage lists them.
export const nextKind=(stage,have)=>STAGES[stage].need.find(k=>!have.includes(k));

// What laying anchor a (panel p) on anchor b (panel q) does in this view and stage, given the threads already hanging:
// a new thread {kind}, or a reason in words. The same function answers a drag and the "放置" list.
export function judgeMove(stage,have,view,p,a,q,b){
 const m=match(view,p,a,q,b);
 if(!m.ok)return {kind:'bad',text:REASONS[m.reason]||''};
 const thread=kindOf(key(p,a,q,b));
 if(have.includes(thread))return {kind:'bad',text:'這條紅線已經接上了。'};
 if(!STAGES[stage].need.includes(thread))return {kind:'bad',text:'這兩樣東西現在還接不上，先把眼前的紅線接好。'};
 return {kind:'link',thread};
}

// ---- Hints: three tiers (where to look, the rule, the answer). A step names what the player's own board needs next and
// follows zoom and flips, so a tip always matches what is on the screen.
export function hintStep(stage,have,view){
 const kind=nextKind(stage,have);
 if(kind===0)return 'stack';
 if(kind===1)return view.zoom&&view.zoom.panel==='C'?'size-drag':'size-zoom';
 if(kind===2)return view.flip.A!==view.flip.D?'flip-drag':'flip-toggle';
 return stage==='merge'?'order':null; // the merge stage ends with the order; the align stage is simply done
}
export const HINTS={
 stack:[
  '先看陽台：欄杆外有一輪月亮。再看鏡廊：兩側的鏡子裡各有一輪月亮。',
  '把一格拖到另一格上，讓兩樣同一種、大小差不多的東西重疊，放開就會吸附。月亮要和月亮重疊。門縫裡的小月光太小，不算。',
  '把陽台拖到鏡廊上，讓陽台的月亮疊在鏡廊任一面鏡子裡的月亮上（左右兩面都可以）。'
 ],
 'size-zoom':[
  '黑松林樹上的提燈和舞廳的吊燈是同一種東西，但提燈小很多。',
  '大小要差不多才疊得上。點一下黑松林，它會放大到整個板面寬；再點一次縮回去。',
  '先點黑松林放大。再把舞廳拖到放大的黑松林上，讓舞廳的大吊燈（最大的那盞）對準樹上的提燈。（鍵盤：選黑松林按 Enter。）'
 ],
 'size-drag':[
  '黑松林已經放大了。下一步要把另一格拖上來，哪一格裡有同一種、大小差不多的東西？',
  '提燈是燈。舞廳裡有兩盞燈：大吊燈和門內的小吊燈。放大後的提燈，和其中一盞一樣大。',
  '從下方的圖磚拖出舞廳，放到放大的黑松林上，讓舞廳的大吊燈對準提燈。門內的小吊燈放大後反而太大。'
 ],
 'flip-toggle':[
  '鏡廊盡頭的門和舞廳的大門是同一扇門的兩面。注意門旁的金色小三角：它指著門開的方向。',
  '鏡廊的門開向右，舞廳的門開向左，方向相反就疊不上。把其中一格翻面（只翻一格），開口方向才會一致。',
  '按「翻面」鏡廊或舞廳其中一個（擇一，兩個都翻等於沒翻），再把鏡廊的門拖到舞廳的大門上。'
 ],
 'flip-drag':[
  '兩格的開口方向已經一致，金色小三角朝同一邊。現在把兩扇門疊起來。',
  '把鏡廊拖到舞廳上，讓兩扇門重疊；放開就會吸附。拱窗和門縫的月光不是這一組。',
  '把鏡廊的門拖到舞廳的大門上，金色小三角要在同一側。'
 ],
 order:[
  '三條紅線把四格接起來了。排序的線索就是紅線：排好以後，相鄰的兩格之間都要有一條線。',
  '陽台和鏡廊之間是月亮的線，鏡廊和舞廳之間是門的線，舞廳和黑松林之間是燈的線。照這個接法排成一列；從另一端排也可以，紅線是同一條。',
  '順序是：陽台、鏡廊、舞廳、黑松林。也可以反過來排成：黑松林、舞廳、鏡廊、陽台。這是同一條紅線從另一端讀，兩種都算對。'
 ]
};

// ---- Drawing
const GOALS={
 'gallery-align':{title:'把畫格疊起來',goal:'四幅畫裡有一些相同的東西。把一格拖到另一格上，讓兩樣同一種、大小相近的東西重疊，放開時會自動吸附，接上一條紅線。點一格可以把它放大到整個板面寬，再點一次縮回去。'},
 'gallery-merge':{title:'紅線的最後一段',goal:'紅線還差一段。有些東西左右相反，要把其中一格「翻面」才對得上。三條紅線都接好以後，依紅線把四格排成一列。'}
};
const CAPTIONS={
 stack:'把陽台的月亮拖到鏡廊鏡子裡的月亮上，讓兩個月亮重疊。放開時會自動吸附。',
 size:'黑松林的提燈比舞廳的吊燈小很多。點黑松林把整格放大，再把舞廳拖到放大的黑松林上，讓舞廳的大吊燈對準提燈。',
 flip:'鏡廊的門開向右，舞廳的門開向左（金色小三角是開口的方向）。把其中一格翻面，再把兩扇門重疊。',
 order:'三條紅線都接上了。把四格依紅線的順序排成一列。從左到右或從右到左都算對，紅線是同一條。'
};
const SLOT={A:[16,16],B:[376,16],C:[16,224],D:[376,224]};
const BOARD_H=548,BORDER=6,TRAY=0.55,K=(PW-2*BORDER)/PW; // the content box inside the gold border is 340x188
const THREAD_DASH=['','9 5','2 5'],THREAD_SHAPE=['circle','square','diamond'];
const shell=(stageId,island=false)=>'<div class="belfry gallery"><p class="challenge-help"><b>'+GOALS[stageId].title+'。</b>'+GOALS[stageId].goal+'</p>'
 +(island?'':'<p id="bf-status" class="belfry-status" role="status"></p>')
 +(island?'<div data-vue-gallery-'+(stageId==='gallery-align'?'align':'merge')+'><p class="challenge-feedback" role="status">畫格載入中…</p></div>':'<p id="gal-caption" class="gal-caption" aria-live="polite"></p>'
  +'<div class="gal-stage" id="gal-stage"><div class="gal-board" id="gal-board"></div></div>'
  +'<div id="gal-order" class="gal-order" hidden></div>'
  +'<div class="gal-tools" id="gal-tools" role="group" aria-label="放大與翻面"></div>'
  +'<details class="gal-place"><summary>不用拖曳：用清單放置</summary><div class="gal-place-body">'
   +'<label>拿起<select id="gal-from"></select></label><label>放到<select id="gal-to"></select></label>'
   +'<button id="gal-put" class="secondary-button">放置</button></div></details>'
  +'<p id="gal-feedback" class="challenge-feedback" role="status"></p>')+hintMarkup+'</div>';
const reduced=()=>document.body.classList.contains('reduce-motion');
const art=p=>'assets/'+PANELS[p].art+'.webp';
const label=(p,a)=>PANELS[p].name+'：'+a.label;

export const mountGalleryAlign=ctx=>mountGallery(ctx,'align');
export const mountGalleryMerge=ctx=>mountGallery(ctx,'merge');

// ctx = { render(html), done(), playCue(kind) }
function mountGallery(ctx,stage){
 const stageId='gallery-'+stage,spec=STAGES[stage];
 const islandMode=stage==='align'&&typeof ctx.mountPuzzleIsland==='function';
 const mergeIslandMode=stage==='merge'&&typeof ctx.mountPuzzleIsland==='function';
 const useIsland=islandMode||mergeIslandMode;
 // Threads already hanging when the stage opens (the merge stage follows the align stage).
 const links=spec.preset.map(kind=>({kind,ends:kind===0?['B.moon','A.moonL']:['C.lantern','D.chandelier']}));
 const view={zoom:null,flip:{A:false,B:false,C:false,D:false}};
 const pos={};for(const p in SLOT)pos[p]=[...SLOT[p]];
 let held=null,live=null,mode='play',finished=false,scale=1,markers=true,order=[],statusText='',statusTone='',feedbackText='';
 ctx.render(shell(stageId,useIsland));
 const $=id=>document.getElementById(id),stageEl=$('gal-stage'),board=$('gal-board');
 const islandRoot=useIsland?document.querySelector('[data-vue-gallery-'+(stage==='align'?'align':'merge')+']'):null;
 const alive=()=>Boolean(islandRoot?.isConnected||stageEl?.isConnected);
 const have=()=>links.map(l=>l.kind);
 const step=()=>finished?null:hintStep(stage,have(),view);
 const tiers=new Proxy({},{get:(_,name)=>HINTS[name]});
 const hints=bindHints({hints:tiers,currentStep:step,alive});
 const say=(text,tone='')=>{statusText=text;statusTone=tone;if(!useIsland){const el=$('bf-status');el.textContent=text;el.dataset.tone=tone;}};
 const note=text=>{feedbackText=text||'';if(!useIsland)$('gal-feedback').textContent=feedbackText;};
 const radius=()=>snapRadius(scale);

 // ---- layout: the 744x548 board is scaled to the width of the modal
 function layout(){
  if(useIsland||stageEl.hidden)return;
  const w=stageEl.clientWidth||BOARD_W;
  scale=Math.min(1,w/BOARD_W);
  board.style.transform='scale('+scale+')';
  stageEl.style.height=Math.round(BOARD_H*scale)+'px';
 }
 const trayIds=()=>Object.keys(PANELS).filter(q=>view.zoom&&q!==view.zoom.panel);
 const inTray=p=>!!view.zoom&&view.zoom.panel!==p&&held!==p;
 const trayPos=p=>[16+trayIds().indexOf(p)*(PW*TRAY+14),BOARD_H-PH*TRAY-8];
 const effPos=p=>{const m=mag(view,p);return m!==1?[(BOARD_W-PW*m)/2,4]:inTray(p)?trayPos(p):pos[p];};
 // Position of an anchor on the board (board units), using the same maths as the model but with the content box.
 const boardPos=(p,a)=>{const m=at(view,p,a),ep=effPos(p),b=BORDER*mag(view,p);return [ep[0]+b+m[0]*K,ep[1]+b+m[1]*K];};
 const makeSnapshot=()=>{
  const panels=Object.keys(PANELS).map(p=>{
   const m=mag(view,p),ep=effPos(p),fl=flipped(view,p),zoomed=m!==1,b=BORDER*m;
   const anchors=ANCHORS[p].map(a=>{
    const pt=at(view,p,a),r=Math.max(a.r*F*K*m,9),sd=side(view,p,a),nr=Math.max(a.r*F*K*m,9);
    let notchLeft=null,notchTop=null,notchWidth=null,notchHeight=null;
    if(a.notch){
     const inside=nr>=48,nw=inside?Math.round(nr*0.75):Math.max(30,Math.round(nr*0.9)),nh=Math.round(nw*2/3),cx=pt[0]*K;
     notchWidth=nw;notchHeight=nh;notchLeft=inside?(sd==='R'?cx+nr-nw-6:cx-nr+6):(sd==='R'?cx+nr+2:cx-nr-nw-2);notchTop=pt[1]*K-nh/2;
    }
    return {id:a.id,label:a.label,left:pt[0]*K-r,top:pt[1]*K-r,diameter:2*r,linked:links.some(link=>link.ends.includes(p+'.'+a.id)),notchSide:sd,notchLeft,notchTop,notchWidth,notchHeight};
   });
   const active=live?.panel===p?ANCHORS[p].find(a=>a.id===live.anchorId):null,maskPoint=active?at(view,p,active):null;
   return {id:p,name:PANELS[p].name,art:PANELS[p].art,left:ep[0],top:ep[1],width:PW*m,height:PH*m,borderWidth:b,
    layerWidth:(PW-2*BORDER)*m,layerHeight:(PH-2*BORDER)*m,zIndex:zoomed?0:held===p?10:inTray(p)?5:1,
    tray:inTray(p),zoomed,flipped:fl,dragging:held===p,ariaLabel:'畫格：'+PANELS[p].name+(fl?'，已翻面':'')+(zoomed?'，已放大':'')+'。拖曳疊到另一格；方向鍵移動；Enter 放大或縮小；F 翻面',
    anchors,maskAnchor:maskPoint?{x:BORDER+maskPoint[0]*K,y:BORDER+maskPoint[1]*K}:null};
  });
  const view0={zoom:null,flip:view.flip},end=ref=>{const {panel,anchor}=find(ref),pt=at(view0,panel,anchor);return [SLOT[panel][0]+BORDER+pt[0]*K,SLOT[panel][1]+BORDER+pt[1]*K];};
  const threads=links.filter(link=>link.kind<2).map(link=>{const a=end(link.ends[0]),b=end(link.ends[1]);return {kind:link.kind,x1:a[0],y1:a[1],x2:b[0],y2:b[1]};});
  return {scale,zoomPanel:view.zoom?.panel||null,markers,panels,threads,
   live:live?{panel:live.panel,x1:live.p[0],y1:live.p[1],x2:live.q[0],y2:live.q[1],ok:live.ok}:null,
   caption:step()?CAPTIONS[step().split('-')[0]]||'':'',status:statusText,tone:statusTone,feedback:feedbackText,finished};
 };
 const makeMergeSnapshot=()=>({
  mode:finished?'complete':mode,
  panels:Object.keys(PANELS).map(id=>{const door=ANCHORS[id].find(anchor=>anchor.id==='door'),flip=flipped(view,id);return {id,name:PANELS[id].name,art:PANELS[id].art,flipped:flip,door:door?{x:(flip?SRC[0]-door.x:door.x)/SRC[0]*100,y:door.y/SRC[1]*100,side:side(view,id,door)}:null};}),
  threads:links.slice().sort((a,b)=>a.kind-b.kind).map(link=>({kind:link.kind,ends:link.ends.map(ref=>{const [panel,anchor]=ref.split('.');return PANELS[panel].name+'：'+ANCHORS[panel].find(item=>item.id===anchor).label;})})),
  order:[...order],status:statusText,tone:statusTone,feedback:feedbackText,finished,
 });

 // ---- elements
 const els={};
 if(!useIsland){
  board.innerHTML='<svg id="gal-guide" class="gal-guide" viewBox="0 0 '+BOARD_W+' '+BOARD_H+'" aria-hidden="true"></svg>';
  for(const p in PANELS){
   const el=document.createElement('div');
   el.className='gal-panel';el.tabIndex=0;el.setAttribute('role','button');el.dataset.galPanel=p;
   let rings='';
   for(const a of ANCHORS[p])rings+='<span class="gal-ring" data-a="'+a.id+'"></span>'+(a.notch?'<span class="gal-notch" data-n="'+a.id+'"></span>':'');
   el.innerHTML='<div class="gal-layer"><img src="'+art(p)+'" alt="" width="1664" height="944" decoding="async" draggable="false">'+rings+'</div><span class="gal-tag"></span>';
   board.appendChild(el);els[p]=el;bindPanel(p);
  }
  $('gal-tools').innerHTML='<span class="gal-tools-row"><b>放大</b>'+Object.keys(PANELS).map(p=>'<button class="secondary-button" data-zoom="'+p+'" aria-pressed="false" aria-label="放大'+PANELS[p].name+'">'+PANELS[p].name+'</button>').join('')+'</span>'
   +'<span class="gal-tools-row"><b>翻面</b>'+Object.keys(PANELS).map(p=>'<button class="secondary-button" data-flip="'+p+'" aria-pressed="false" aria-label="翻面'+PANELS[p].name+'">'+PANELS[p].name+'</button>').join('')+'</span>'
   +'<span class="gal-tools-row"><button class="secondary-button" id="gal-marks" aria-pressed="true">物件標記</button><button class="secondary-button" id="gal-home">畫格歸位</button></span>';
  const anchorOptions=Object.keys(PANELS).flatMap(p=>ANCHORS[p].map(a=>'<option value="'+p+'.'+a.id+'">'+label(p,a)+'</option>')).join('');
  $('gal-from').innerHTML=anchorOptions;$('gal-to').innerHTML=anchorOptions;$('gal-to').selectedIndex=4;
 }

 function render(){
  if(useIsland){hints.changed();return;}
  for(const p in els){
   const el=els[p],layer=el.firstChild,img=layer.firstChild;
   const m=mag(view,p),ep=effPos(p),fl=flipped(view,p),zoomed=m!==1;
   el.style.width=PW*m+'px';el.style.height=PH*m+'px';el.style.borderWidth=BORDER*m+'px';
   el.style.left=ep[0]+'px';el.style.top=ep[1]+'px';
   el.style.zIndex=zoomed?0:held===p?10:inTray(p)?5:1;
   el.style.transform=inTray(p)?'scale('+TRAY+')':'none';
   layer.style.width=(PW-2*BORDER)*m+'px';layer.style.height=(PH-2*BORDER)*m+'px';
   img.style.transform=fl?'scaleX(-1)':'none';
   for(const a of ANCHORS[p]){
    const ring=layer.querySelector('[data-a="'+a.id+'"]'),pt=at(view,p,a),r=Math.max(a.r*F*K*m,9); // tiny objects still get a visible ring (display only; matching uses the real size)
    ring.style.left=(pt[0]*K-r)+'px';ring.style.top=(pt[1]*K-r)+'px';ring.style.width=ring.style.height=2*r+'px';
    ring.style.display=markers?'block':'none';
    ring.classList.toggle('on',links.some(l=>l.ends.includes(p+'.'+a.id)));
    const notch=layer.querySelector('[data-n="'+a.id+'"]');
    if(notch){
     const sd=side(view,p,a),nr=Math.max(a.r*F*K*m,9);
     notch.dataset.side=sd;// A zoomed door is big enough to hold its handle inside the ring, clear of the neighbouring windows; a small one keeps it just outside.
     const inside=nr>=48,nw=inside?Math.round(nr*0.75):Math.max(30,Math.round(nr*0.9)),nh=Math.round(nw*2/3);
     const cx=pt[0]*K,hx=inside?(sd==='R'?cx+nr-nw-6:cx-nr+6):(sd==='R'?cx+nr+2:cx-nr-nw-2);
     notch.style.width=nw+'px';notch.style.height=nh+'px';notch.style.left=hx+'px';notch.style.top=(pt[1]*K-nh/2)+'px';
    }
   }
   el.querySelector('.gal-tag').textContent=PANELS[p].name+(fl?'（翻面）':'')+(zoomed?'（放大）':'');
   el.setAttribute('aria-label','畫格：'+PANELS[p].name+(fl?'，已翻面':'')+(zoomed?'，已放大':'')+'。拖曳疊到另一格；方向鍵移動；Enter 放大或縮小；F 翻面');
   $('gal-tools').querySelector('[data-zoom="'+p+'"]').setAttribute('aria-pressed',String(zoomed));
   $('gal-tools').querySelector('[data-flip="'+p+'"]').setAttribute('aria-pressed',String(fl));
  }
  const s=step(),cap=mode==='order'?CAPTIONS.order:s?CAPTIONS[s.split('-')[0]]:'';
  $('gal-caption').textContent=cap||'';
  drawThreads();
  hints.changed();
 }
 function drawThreads(){
  if(useIsland)return;
  let s='';
  const view0={zoom:null,flip:view.flip},end=ref=>{const {panel,anchor}=find(ref),pt=at(view0,panel,anchor);return [SLOT[panel][0]+BORDER+pt[0]*K,SLOT[panel][1]+BORDER+pt[1]*K];};
  const mark=(pt,kind)=>{
   const [x,y]=pt;
   return THREAD_SHAPE[kind]==='circle'?'<circle cx="'+x+'" cy="'+y+'" r="5" fill="#c8172f" stroke="#fff" stroke-width="1"/>'
    :THREAD_SHAPE[kind]==='square'?'<rect x="'+(x-5)+'" y="'+(y-5)+'" width="10" height="10" fill="#c8172f" stroke="#fff" stroke-width="1"/>'
    :'<path d="M'+x+' '+(y-7)+'L'+(x+7)+' '+y+'L'+x+' '+(y+7)+'L'+(x-7)+' '+y+'Z" fill="#c8172f" stroke="#fff" stroke-width="1"/>';
  };
  if(!zoomedView())for(const l of links){
   const a=end(l.ends[0]),b=end(l.ends[1]);
   s+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="#c8172f" stroke-width="3" stroke-linecap="round"'+(THREAD_DASH[l.kind]?' stroke-dasharray="'+THREAD_DASH[l.kind]+'"':'')+'/>'+mark(a,l.kind)+mark(b,l.kind);
  }
  if(live)s+='<line x1="'+live.p[0]+'" y1="'+live.p[1]+'" x2="'+live.q[0]+'" y2="'+live.q[1]+'" stroke="#fff" stroke-width="'+(live.ok?3:1.5)+'"'+(live.ok?'':' stroke-dasharray="5 4"')+'/>';
  $('gal-guide').innerHTML=s;
 }
 const zoomedView=()=>!!view.zoom;

 // ---- judging a placement
 function candidates(p){
  const out=[];
  for(const a of ANCHORS[p]){
   const pa=boardPos(p,a);
   for(const q in ANCHORS)if(q!==p&&!inTray(q))for(const b of ANCHORS[q]){
    const pb=boardPos(q,b),d=Math.hypot(pa[0]-pb[0],pa[1]-pb[1]);
    if(d>radius())continue;
    out.push({a,q,b,d,pa,pb,m:match(view,p,a,q,b)});
   }
  }
  return out.sort((x,y)=>x.d-y.d);
 }
 // What a (p,a) -> (q,b) placement does in the current view: a new thread, or a reason in words.
 function judge(p,a,q,b){
  const r=judgeMove(stage,have(),view,p,a,q,b);
  return r.kind==='link'?{kind:'link',link:{kind:r.thread,ends:[p+'.'+a.id,q+'.'+b.id]}}:r;
 }
 // The nearest valid link wins. When none is valid, the reason comes from the nearest pair of the same kind of object
 // (two doors that face opposite ways), because "not the same kind" would only be true of a pair the player never meant.
 function resolve(p){
  const list=candidates(p);
  if(!list.length)return {kind:'none'};
  let near=null,sameKind=null;
  for(const c of list){
   const r=judge(p,c.a,c.q,c.b);
   if(r.kind==='link')return r;
   near=near||r;
   if(c.a.type===c.b.type)sameKind=sameKind||r;
  }
  return sameKind||near;
 }
 function attach(link){
  links.push(link);view.zoom=null;held=null;live=null;
  for(const p in SLOT)pos[p]=[...SLOT[p]];
  note('');ctx.playCue('click');render();
  if(spec.need.every(kind=>have().includes(kind)))complete();
  else say('紅線接上了：'+KINDS[link.kind].teach+'。','ok');
 }
 function complete(){
  if(stage==='merge'){startOrder();return;}
  finished=true;
  say('兩條紅線接上了。','ok');hints.changed();
  ctx.playCue('door');
  setTimeout(()=>{if(alive())ctx.done();},reduced()?0:900);
 }
 function setMask(el,p,candidate){
  // The held panel becomes a feathered round window around the object over a target, so the two pictures melt together.
  if(!candidate){el.style.removeProperty('mask-image');el.style.removeProperty('-webkit-mask-image');return;}
  const pt=at(view,p,candidate.a),css='radial-gradient(circle at '+(BORDER+pt[0]*K)+'px '+(BORDER+pt[1]*K)+'px,#000 0,#000 34px,transparent 76px)';
  el.style.setProperty('mask-image',css);el.style.setProperty('-webkit-mask-image',css);
 }

 // ---- pointer, keyboard
 function bindPanel(p){
  const el=els[p];let drag=null,moved=false;
  el.addEventListener('pointerdown',e=>{
   if(mode!=='play'||finished||e.button>0)return;
   el.setPointerCapture?.(e.pointerId);
   drag={sx:e.clientX,sy:e.clientY,ox:pos[p][0],oy:pos[p][1]};moved=false;
  });
  el.addEventListener('pointermove',e=>{
   if(!drag)return;
   const dx=(e.clientX-drag.sx)/scale,dy=(e.clientY-drag.sy)/scale;
   if(!moved&&Math.hypot(dx,dy)*scale<6)return;
   if(mag(view,p)!==1)return; // the enlarged panel stays put; tap it to shrink it
   if(!moved&&view.zoom){ // picking a tile out of the tray: it grows to full size under the finger
    const b=board.getBoundingClientRect();
    pos[p]=[(e.clientX-b.left)/scale-PW/2,(e.clientY-b.top)/scale-PH/2];
    drag.sx=e.clientX;drag.sy=e.clientY;drag.ox=pos[p][0];drag.oy=pos[p][1];held=p;render();
   }
   moved=true;el.classList.add('drag');
   pos[p]=[drag.ox+(e.clientX-drag.sx)/scale,drag.oy+(e.clientY-drag.sy)/scale];
   el.style.left=pos[p][0]+'px';el.style.top=pos[p][1]+'px';
   const c=candidates(p)[0],r=c?judge(p,c.a,c.q,c.b):null;
   live=c?{p:c.pa,q:c.pb,ok:r.kind==='link',panel:p,anchorId:c.a.id}:null;setMask(el,p,c);drawThreads();
  });
  const end=()=>{
   if(!drag)return;
   const wasMoved=moved;drag=null;el.classList.remove('drag');setMask(el,p,null);
   if(!wasMoved){ // a tap fills the board width with this panel, or goes back
    held=null;view.zoom=view.zoom&&view.zoom.panel===p?null:{panel:p};
    note('');ctx.playCue('click');render();return;
   }
   const r=resolve(p);live=null;held=null; // the panel counts as full size until the drop has been judged
   if(r.kind==='link'){attach(r.link);return;}
   pos[p]=[...SLOT[p]];
   if(r.kind==='bad'){note(r.text);ctx.playCue('wrong');}
   else note('放開的位置附近沒有東西可以疊。');
   render();
  };
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
  el.addEventListener('blur',()=>{if(held===p){held=null;render();}});
  el.addEventListener('keydown',e=>{
   if(mode!=='play'||finished)return;
   if(e.key==='f'||e.key==='F'){e.preventDefault();flip(p);return;}
   if(e.key==='Enter'||e.key==='+'||e.key==='-'){e.preventDefault();toggleZoom(p);return;}
   const stepSize=e.shiftKey?3:10,mv={ArrowLeft:[-stepSize,0],ArrowRight:[stepSize,0],ArrowUp:[0,-stepSize],ArrowDown:[0,stepSize]}[e.key];
   if(!mv||mag(view,p)!==1)return;
   e.preventDefault();
   if(inTray(p)){pos[p]=[(BOARD_W-PW)/2,(BOARD_H-PH)/2];held=p;}
   pos[p]=[pos[p][0]+mv[0],pos[p][1]+mv[1]];render();
   const r=resolve(p);
   if(r.kind==='link')attach(r.link);
   else if(r.kind==='bad')note(r.text);
  });
 }
 function toggleZoom(p){held=null;view.zoom=view.zoom&&view.zoom.panel===p?null:{panel:p};note('');ctx.playCue('click');render();}
 function flip(p){view.flip[p]=!view.flip[p];note('');ctx.playCue('click');render();}
 if(!useIsland){
  $('gal-tools').addEventListener('click',e=>{
   if(mode!=='play'||finished)return;
   const z=e.target.closest('[data-zoom]'),f=e.target.closest('[data-flip]');
   if(z)toggleZoom(z.dataset.zoom);else if(f)flip(f.dataset.flip);
  });
  $('gal-marks').onclick=e=>{markers=!markers;e.currentTarget.setAttribute('aria-pressed',String(markers));render();};
  $('gal-home').onclick=()=>{if(mode!=='play'||finished)return;view.zoom=null;held=null;for(const p in SLOT)pos[p]=[...SLOT[p]];note('');render();};
  // The list does what a drag does, without a pointer: the current zoom and flips still decide whether the pair fits.
  $('gal-put').onclick=()=>{
   if(mode!=='play'||finished)return;
   const [p,a]=$('gal-from').value.split('.'),[q,b]=$('gal-to').value.split('.');
   const r=judge(p,ANCHORS[p].find(x=>x.id===a),q,ANCHORS[q].find(x=>x.id===b));
   if(r.kind==='link')attach(r.link);
   else{note(r.text);ctx.playCue('wrong');}
  };
 }

 const validPanel=p=>Object.prototype.hasOwnProperty.call(PANELS,p);
 function onIslandAction(change){
  if(!islandMode||!change||typeof change!=='object')return makeSnapshot();
  if(change.type==='resize'&&Number.isFinite(change.width)&&change.width>0){scale=Math.min(1,change.width/BOARD_W);render();}
  else if(finished||mode!=='play')return makeSnapshot();
  else if(change.type==='toggle-zoom'&&validPanel(change.panel))toggleZoom(change.panel);
  else if(change.type==='flip'&&validPanel(change.panel))flip(change.panel);
  else if(change.type==='toggle-markers'){markers=!markers;render();}
  else if(change.type==='home'){view.zoom=null;held=null;live=null;for(const p in SLOT)pos[p]=[...SLOT[p]];note('');render();}
  else if(change.type==='begin-drag'&&validPanel(change.panel)&&Number.isFinite(change.x)&&Number.isFinite(change.y)){
   if(inTray(change.panel)){pos[change.panel]=[change.x,change.y];held=change.panel;render();}
  }
  else if(change.type==='move-panel'&&validPanel(change.panel)&&Number.isFinite(change.x)&&Number.isFinite(change.y)&&mag(view,change.panel)===1){
   pos[change.panel]=[change.x,change.y];held=change.panel;const c=candidates(change.panel)[0],r=c?judge(change.panel,c.a,c.q,c.b):null;
   live=c?{p:c.pa,q:c.pb,ok:r.kind==='link',panel:change.panel,anchorId:c.a.id}:null;render();
  }
  else if(change.type==='drop-panel'&&validPanel(change.panel)){
   const r=resolve(change.panel);live=null;held=null;
   if(r.kind==='link'){attach(r.link);return makeSnapshot();}
   pos[change.panel]=[...SLOT[change.panel]];
   if(r.kind==='bad'){note(r.text);ctx.playCue('wrong');}else note('放開的位置附近沒有東西可以疊。');
   render();
  }
  else if(change.type==='keyboard-move'&&validPanel(change.panel)&&Number.isFinite(change.dx)&&Number.isFinite(change.dy)&&mag(view,change.panel)===1){
   if(inTray(change.panel)){pos[change.panel]=[(BOARD_W-PW)/2,(BOARD_H-PH)/2];held=change.panel;}
   pos[change.panel]=[pos[change.panel][0]+change.dx,pos[change.panel][1]+change.dy];render();
   const r=resolve(change.panel);
   if(r.kind==='link'){attach(r.link);return makeSnapshot();}
   if(r.kind==='bad')note(r.text);
  }
  else if(change.type==='place'&&typeof change.from==='string'&&typeof change.to==='string'){
   const [p,a]=change.from.split('.'),[q,b]=change.to.split('.');
   if(validPanel(p)&&validPanel(q)){
    const from=ANCHORS[p].find(x=>x.id===a),to=ANCHORS[q].find(x=>x.id===b),r=from&&to?judge(p,from,q,to):{kind:'bad',text:'請選擇兩個畫格中的物件。'};
    if(r.kind==='link')attach(r.link);else{note(r.text);ctx.playCue('wrong');}
   }
  }
  return makeSnapshot();
 }

 function onMergeIslandAction(change){
  if(!mergeIslandMode||!change||typeof change!=='object')return makeMergeSnapshot();
  if(finished)return makeMergeSnapshot();
  if(change.type==='flip'&&mode==='play'&&validPanel(change.panel))flip(change.panel);
  else if(change.type==='place-doors'&&mode==='play'){
   const r=judge('A',ANCHORS.A.find(anchor=>anchor.id==='door'),'D',ANCHORS.D.find(anchor=>anchor.id==='door'));
   if(r.kind==='link')attach(r.link);else{note(r.text);ctx.playCue('wrong');}
  }
  else if(change.type==='choose-panel'&&mode==='order'&&validPanel(change.panel))chooseOrderPanel(change.panel);
  else if(change.type==='remove-from'&&mode==='order'&&Number.isInteger(change.index)&&change.index>=0&&change.index<order.length)removeOrderFrom(change.index);
  return makeMergeSnapshot();
 }

 // ---- merge stage: put the four panels in the order of the thread
 function startOrder(){
  mode='order';order=[];
  if(!mergeIslandMode){stageEl.hidden=true;$('gal-tools').hidden=true;document.querySelector('.gal-place').hidden=true;}
  say('三條紅線都接上了。','ok');renderOrder();
 }
 const names=ends=>ends.map(e=>PANELS[e[0]].name).join('與');
 function renderOrder(){
  if(mergeIslandMode)return;
  const box=$('gal-order'),what=['月亮','提燈與吊燈','門'];
  box.hidden=false;
  box.innerHTML='<p class="gal-threads">紅線：'+links.slice().sort((x,y)=>x.kind-y.kind).map(l=>names(l.ends)+'（'+what[l.kind]+'）').join('；')+'</p>'
   +'<div class="gal-slots">'+[0,1,2,3].map(i=>order[i]
     ?'<button class="gal-slot" data-i="'+i+'" aria-label="第 '+(i+1)+' 格：'+PANELS[order[i]].name+'（點選取消）"><img src="'+art(order[i])+'" alt="" width="1664" height="944"><span>'+(i+1)+'｜'+PANELS[order[i]].name+'</span></button>'
     :'<div class="gal-slot empty"><span>第 '+(i+1)+' 格</span></div>').join('')+'</div>'
   +'<div class="gal-cards">'+Object.keys(PANELS).map(p=>'<button class="gal-card'+(order.includes(p)?' used':'')+'" data-card="'+p+'" aria-label="'+PANELS[p].name+(order.includes(p)?'（已放入）':'')+'"><img src="'+art(p)+'" alt="" width="1664" height="944"><span>'+PANELS[p].name+'</span></button>').join('')+'</div>'
   +'<p class="gal-order-note">依序點選四格；點已放的格子可以取消。從哪一端開始都可以，紅線從兩端讀都是同一條。</p>';
  $('gal-caption').textContent=CAPTIONS.order;
  box.querySelectorAll('[data-i]').forEach(button=>button.onclick=()=>removeOrderFrom(+button.dataset.i));
  box.querySelectorAll('[data-card]').forEach(button=>button.onclick=()=>{
   chooseOrderPanel(button.dataset.card);
  });
 }
 function removeOrderFrom(index){
  if(finished||mode!=='order')return;
  order.splice(index);note('');renderOrder();hints.changed();
 }
 function chooseOrderPanel(panel){
  if(finished||mode!=='order'||!validPanel(panel)||order.includes(panel))return;
  order.push(panel);ctx.playCue('click');
  if(order.length<4){note('');renderOrder();hints.changed();return;}
  if(isChain(order)){orderDone();return;}
  const i=firstBadGap(order);
  note('第 '+(i+1)+' 格（'+PANELS[order[i]].name+'）和第 '+(i+2)+' 格（'+PANELS[order[i+1]].name+'）之間沒有紅線。');
  ctx.playCue('wrong');order=[];renderOrder();hints.changed();
 }
 function orderDone(){
  finished=true;
  if(mergeIslandMode){
   mode='complete';note('');say('紅線連成一條直線：妳把這截紅線收進手心。','ok');hints.changed();ctx.playCue('door');
   setTimeout(()=>{if(alive())ctx.done();},reduced()?0:1400);
   return;
  }
  const box=$('gal-order');
  // The four panels sit in a row and the thread through them is one straight line: the zhuyin "ㄧ".
  const xs=[60,200,340,480];
  box.innerHTML='<svg class="gal-line" viewBox="0 0 540 90" role="img" aria-label="四段紅線連成一條直線，像注音符號ㄧ">'
   +'<line x1="30" y1="45" x2="510" y2="45" stroke="#c8172f" stroke-width="5" stroke-linecap="round"/>'
   +order.map((p,i)=>'<rect x="'+(xs[i]-28)+'" y="25" width="56" height="40" rx="4" fill="#150d1a" stroke="#8a6a2a" stroke-width="2"/><text x="'+xs[i]+'" y="50" text-anchor="middle" font-size="13" fill="#e9dcc3">'+PANELS[p].name+'</text>').join('')
   +'<circle cx="510" cy="45" r="7" fill="#c8172f" stroke="#fff" stroke-width="1.5"/></svg>'
   +'<p class="gal-order-note">四格依序排好，紅線連成一條直線。從另一端讀也是同一條紅線，所以兩種排法都算對。</p>';
  note('');say('紅線連成一條直線：妳把這截紅線收進手心。','ok');hints.changed();
  ctx.playCue('door');
  setTimeout(()=>{if(alive())ctx.done();},reduced()?0:1400);
 }

 layout();
 if(!useIsland&&typeof ResizeObserver==='function'){const watcher=new ResizeObserver(()=>{if(!alive()){watcher.disconnect();return;}layout();render();});watcher.observe(stageEl);}
 else if(!useIsland)window.addEventListener('resize',()=>{if(alive()){layout();render();}});
 say(stage==='align'?'兩條紅線都還沒接上。':'還差一條紅線。');
 render();
 if(islandMode)ctx.mountPuzzleIsland({snapshot:makeSnapshot(),onAction:onIslandAction});
 else if(mergeIslandMode)ctx.mountPuzzleIsland({snapshot:makeMergeSnapshot(),onAction:onMergeIslandAction});
 // A test hook, read-only state for the browser suites.
 if(!useIsland)board.__gallery={view,links,pos,els,get mode(){return mode;},get scale(){return scale;},radius,boardPos};
}
