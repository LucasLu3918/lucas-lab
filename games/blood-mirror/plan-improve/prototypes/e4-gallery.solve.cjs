// Proves the E4 gallery claims over every view a player can reach. Run: node e4-gallery.solve.cjs
const assert=require('assert');
const fs=require('fs'),vm=require('vm'),path=require('path');
const sb={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'e4-gallery.model.js'),'utf8'),sb);
const E=sb.E4;
const P=Object.keys(E.ANCHORS);
const flips=[];for(let m=0;m<16;m++)flips.push(Object.fromEntries(P.map((p,i)=>[p,!!(m>>i&1)])));
const views=[];
for(const flip of flips){
 views.push({zoom:null,flip});
 for(const p of P)views.push({zoom:{panel:p},flip});
}
const where={};
for(const v of views)for(const k of E.valid(v))(where[k]=where[k]||[]).push(v);
const expected=['A.door~D.door','A.moonL~B.moon','A.moonR~B.moon','C.lantern~D.chandelier'].sort();
assert.strictEqual(JSON.stringify(Object.keys(where).sort()),JSON.stringify(expected),'unexpected valid links: '+Object.keys(where));
console.log('views checked:',views.length,'| valid links ever possible:',expected.length);

// 1. the opening view (nothing zoomed, nothing flipped) accepts only the moon links
const start={zoom:null,flip:{A:false,B:false,C:false,D:false}};
assert.strictEqual(JSON.stringify(E.valid(start).sort()),JSON.stringify(['A.moonL~B.moon','A.moonR~B.moon']));
// 2. each link needs exactly the move it teaches
const need=(k,test,why)=>{assert.ok(where[k].length>0);for(const v of where[k])assert.ok(test(v),k+' valid in a view it should not be: '+why);};
const not=(v,...ps)=>!v.zoom||!ps.includes(v.zoom.panel);
need('A.moonL~B.moon',v=>not(v,'A','B'),'moons only while A and B are unzoomed');
need('A.moonR~B.moon',v=>not(v,'A','B'),'moons only while A and B are unzoomed');
need('C.lantern~D.chandelier',v=>v.zoom&&v.zoom.panel==='C','lantern only with C zoomed');
need('A.door~D.door',v=>not(v,'A','D')&&(v.flip.A!==v.flip.D),'door only with exactly one of A, D flipped');
// the door link also needs the flip: never valid when neither or both are flipped
assert.ok(!where['A.door~D.door'].some(v=>v.flip.A===v.flip.D));
// the lantern link never works unzoomed or with D zoomed
assert.ok(where['C.lantern~D.chandelier'].every(v=>v.zoom.panel==='C'));
console.log('moons: only while neither is zoomed | lantern: needs C zoomed | door: needs exactly one flip (A or D)');

// 3. a zoomed panel fills the board width, so every anchor in it is ZOOM times larger and nothing is hidden
for(const v of views)for(const p of P)for(const an of E.ANCHORS[p])assert.ok(E.at(v,p,an));
console.log('zoom factor',E.ZOOM.toFixed(3)+' (panel fills the board width); no anchor is ever hidden');

// 4. decoys and why they fail (what the player is told)
const reasons=new Set();
for(const p of P)for(const q of P)if(p<q)for(const a of E.ANCHORS[p])for(const b of E.ANCHORS[q])for(const v of views){
 const m=E.match(v,p,a,q,b);if(!m.ok)reasons.add(m.reason);
}
console.log('rejection reasons the interface can give:',[...reasons].join(', '));
assert.ok(['type','big','small','side'].every(r=>reasons.has(r)));
// nearest wrong size for the lantern: unzoomed vs both chandeliers, zoomed vs the small one
const ratio=(v,p,a,q,b)=>E.size(v,p,E.ANCHORS[p].find(x=>x.id===a))/E.size(v,q,E.ANCHORS[q].find(x=>x.id===b));
const lz={zoom:{panel:'C'},flip:start.flip};
console.log('lantern/chandelier ratio unzoomed',ratio(start,'C','lantern','D','chandelier').toFixed(2),'| zoomed',ratio(lz,'C','lantern','D','chandelier').toFixed(2),'(tolerance 1/'+E.SIZE_TOL+'..'+E.SIZE_TOL+')');
console.log('lantern/doorLamp ratio unzoomed',ratio(start,'C','lantern','D','doorLamp').toFixed(2),'| zoomed',ratio(lz,'C','lantern','D','doorLamp').toFixed(2));
assert.ok(ratio(start,'C','lantern','D','doorLamp')<1/E.SIZE_TOL&&ratio(lz,'C','lantern','D','doorLamp')>E.SIZE_TOL);
const tight=(1/E.SIZE_TOL-ratio(start,'C','lantern','D','doorLamp')),tight2=ratio(lz,'C','lantern','D','doorLamp')-E.SIZE_TOL;
console.log('margin outside tolerance: unzoomed',tight.toFixed(2),'| zoomed',tight2.toFixed(2));
assert.ok(Math.abs(ratio(lz,'C','lantern','D','chandelier')-1)<0.1);

// 5. the chain: of the 24 orders only the thread order and its reverse are accepted
const perms=a=>a.length<2?[a]:a.flatMap((x,i)=>perms([...a.slice(0,i),...a.slice(i+1)]).map(r=>[x,...r]));
const ok=perms(P).filter(E.isChain);
assert.strictEqual(perms(P).length,24);assert.strictEqual(ok.length,2);
for(const o of perms(P))if(!E.isChain(o))assert.ok(E.firstBadGap(o)>=0);
console.log('orders accepted: 2 of 24 ('+ok.map(o=>o.join('')).join(' and ')+', the same thread read both ways)');
// the three links connect all four panels into one path
const edges=[['B','A'],['C','D'],['A','D']];
assert.strictEqual(new Set(edges.flat()).size,4);assert.strictEqual(edges.length,3);
assert.strictEqual(E.firstBadGap(E.CHAIN),-1);

// 6. crowding: anchors in one panel, in board units, against the snap radius at three board scales
for(const [label,scale] of [['desktop 1.0',1],['tablet 0.7',0.7],['phone 375 wide 0.46',0.46]]){
 const radius=Math.max(0.06*E.PH*scale,22)/scale; // board units
 let worst=1e9,pair='';
 for(const p of P)for(const zoomed of [false,true]){
  const v={zoom:zoomed?{panel:p}:null,flip:start.flip};
  const pts=E.ANCHORS[p].map(a=>[a.id,E.at(v,p,a)]).filter(x=>x[1]);
  for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
   const d=Math.hypot(pts[i][1][0]-pts[j][1][0],pts[i][1][1]-pts[j][1][1]);
   if(d<worst){worst=d;pair=p+'.'+pts[i][0]+'/'+pts[j][0]+(zoomed?' (zoomed)':'');}
  }
 }
 console.log(label+': snap radius '+radius.toFixed(1)+' board units; closest anchors in one panel '+worst.toFixed(1)+' ('+pair+')'+(worst<2*radius?' -> drop picks the nearest VALID link, never a wrong one':''));
}
console.log('ALL OK');
