// E4 gallery rules, shared by e4-gallery.html (browser) and e4-gallery.solve.cjs (node). No DOM here.
// Every panel is a 1664x944 picture shown in a 352x200 box (board units). An anchor is a recognisable object in the picture.
(function(root){
'use strict';
const PW=352,PH=200,BOARD_W=744,SRC=[1664,944],F=PW/SRC[0],ZOOM=BOARD_W/PW,SIZE_TOL=1.2; // a zoomed panel fills the board width
const PANELS={
 A:{name:'鏡廊',art:'mirror-hall'},
 B:{name:'陽台',art:'balcony'},
 C:{name:'黑松林',art:'black-pine-path'},
 D:{name:'舞廳',art:'ballroom'}
};
// x,y,r are source pixels (r = visible half-size, the number that has to match after scaling). notch: which side a door opens.
const ANCHORS={
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
// The three links the picture supports, and the order the thread then runs.
const LINKS=[
 {a:'B.moon',b:['A.moonL','A.moonR'],teach:'疊放'},
 {a:'C.lantern',b:['D.chandelier'],teach:'大小'},
 {a:'A.door',b:['D.door'],teach:'翻面'}
];
const CHAIN=['B','A','D','C']; // adjacent panels are the linked ones; the reverse order is the same thread read the other way
const isChain=order=>order.length===4&&(order.join('')===CHAIN.join('')||order.join('')===[...CHAIN].reverse().join(''));
const firstBadGap=order=>{
 const link=(p,q)=>{const i=CHAIN.indexOf(p),j=CHAIN.indexOf(q);return Math.abs(i-j)===1;};
 for(let i=0;i<order.length-1;i++)if(!link(order[i],order[i+1]))return i;return -1;
};
const find=(ref)=>{const [p,id]=ref.split('.');return {panel:p,anchor:ANCHORS[p].find(a=>a.id===id)};};
// view = {zoom:null|{panel}, flip:{A,B,C,D}}. A zoomed panel is shown at the full board width, so everything in it is ZOOM times larger.
const mag=(view,p)=>view.zoom&&view.zoom.panel===p?ZOOM:1;
const flipped=(view,p)=>!!(view.flip&&view.flip[p]);
// Where an anchor appears inside its (possibly enlarged) box, in board units relative to the box.
function at(view,p,a){
 const x=flipped(view,p)?SRC[0]-a.x:a.x,m=mag(view,p);
 return [x*F*m,a.y*F*m];
}
const size=(view,p,a)=>a.r*F*mag(view,p);
const side=(view,p,a)=>a.notch?(flipped(view,p)?(a.notch==='L'?'R':'L'):a.notch):null;
// Can anchor a (panel p) be laid on anchor b (panel q) in this view? Position is the player's drag; this is what the objects must agree on.
function match(view,p,a,q,b){
 if(p===q)return {ok:false,reason:'same'};
 if(!at(view,p,a)||!at(view,q,b))return {ok:false,reason:'hidden'};
 if(a.type!==b.type)return {ok:false,reason:'type'};
 const ratio=size(view,p,a)/size(view,q,b);
 if(ratio>SIZE_TOL||ratio<1/SIZE_TOL)return {ok:false,reason:ratio>1?'big':'small',ratio};
 if(side(view,p,a)!==side(view,q,b))return {ok:false,reason:'side'};
 return {ok:true,ratio};
}
const key=(p,a,q,b)=>[p+'.'+a.id,q+'.'+b.id].sort().join('~');
// Every valid link in a view, as pair keys.
function valid(view){
 const out=[];
 for(const p in ANCHORS)for(const q in ANCHORS)if(p<q)
  for(const a of ANCHORS[p])for(const b of ANCHORS[q])if(match(view,p,a,q,b).ok)out.push(key(p,a,q,b));
 return out;
}
const REASONS={
 type:'這兩樣東西不是同一種。',
 big:'大小差太多：你拖的這樣東西比對面大。',
 small:'大小差太多：你拖的這樣東西比對面小。',
 side:'開口的方向相反，要有一邊翻面。',
 hidden:'畫面裡看不到。',
 same:''
};
const api={PW,PH,BOARD_W,SRC,F,ZOOM,SIZE_TOL,PANELS,ANCHORS,LINKS,CHAIN,isChain,firstBadGap,find,mag,flipped,at,size,side,match,key,valid,REASONS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.E4=api;
})(typeof globalThis!=='undefined'?globalThis:this);
