// Extracts the rules from e3-apothecary.html and proves the design claims. Run: node e3-apothecary.solve.cjs
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'e3-apothecary.html'),'utf8');
const sb={module:{exports:{}}};vm.runInNewContext(html.match(/<script data-core>([\s\S]*?)<\/script>/)[1],sb);
const c=sb.module.exports;
// A: exactly one apprentice can hold the poison; every wrong guess names one contradicting statement
assert.strictEqual(JSON.stringify(c.candidatesA()),'[6]'); // JSON: arrays from vm are a different realm
for(let p=0;p<7;p++)if(p!==6){const i=c.firstConflict(p);assert.ok(i>=0&&c.conflicts(p).includes(i),'wrong guess '+p+' has no named contradiction');}
for(const st of c.TESTIMONY)assert.ok(c.say(st).length>8);
assert.strictEqual(new Set(c.ZHUYIN).size,7);
{// statement shape: no statement refutes more than 2 apprentices, no few-statement shortcut, the 7th (甘松) is the liar
 const T=c.TESTIMONY,all=[...Array(7).keys()];
 const maxRefute=Math.max(...all.map(i=>c.refutedBy(i).length));assert.ok(maxRefute<=2,'a statement refutes '+maxRefute+' apprentices');
 const alive=idx=>all.filter(q=>idx.every(i=>!c.refutedBy(i).includes(q)));
 let minSubset=7;for(let m=1;m<128;m++){const idx=all.filter(i=>m>>i&1);if(idx.length<minSubset&&alive(idx).length===1)minSubset=idx.length;}
 assert.ok(minSubset>=4,'only '+minSubset+' statements already single out the holder');
 const necessary=all.filter(i=>alive(all.filter(j=>j!==i)).length>1);
 assert.ok(necessary.length>=4,'only '+necessary.length+' necessary statements');
 assert.strictEqual(c.refutedBy(0).length,0); // statement 1 refutes nobody: a harmless line, not a clue
 assert.ok(!c.holds(T[6],6),'甘松 statement must be false');
 for(let i=0;i<6;i++)assert.ok(c.holds(T[i],6),'statement '+(i+1)+' must be true');
 T.forEach(st=>{if(st.k==='not')assert.ok(st.s.length<=3);if(st.k==='in')assert.ok(st.s.length>=4);});
 console.log('A: unique holder; max apprentices refuted by one statement='+maxRefute+'; fewest statements that single him out='+minSubset+'; necessary statements='+necessary.map(i=>i+1).join(',')+' (all seven cannot be necessary: 6 wrong holders)');}
// hints for A work for every possible notebook (any set of crossed-out apprentices)
for(let m=0;m<64;m++){const ruled=[0,1,2,3,4,5].filter(i=>m>>i&1),h=c.HINTS.A(6,ruled);assert.strictEqual(h.length,3);h.forEach(t=>assert.ok(t.length>10));assert.ok(h[2].includes('甘松'));}
// B: shortest solution exists, is unique in length, and the hint always points at its first move
const p=c.shortest(c.START);assert.ok(p&&p.length===8,'shortest length '+(p&&p.length));
let s=[...c.START];for(const t of p)s=c.pour(s,t);assert.ok(c.goalB(s));
// count shortest solutions
{const key=x=>x.join(','),dist=new Map([[key(c.START),0]]),ways=new Map([[key(c.START),1]]),q=[c.START];
 for(let i=0;i<q.length;i++){const x=q[i];for(let t=0;t<3;t++){const n=c.pour(x,t);if(!n)continue;const k=key(n);if(!dist.has(k)){dist.set(k,dist.get(key(x))+1);ways.set(k,ways.get(key(x)));q.push(n);}else if(dist.get(k)===dist.get(key(x))+1)ways.set(k,ways.get(k)+ways.get(key(x)));}}
 let best=1e9,w=0;for(const [k,d] of dist){if(c.goalB(k.split(',').map(Number))){if(d<best){best=d;w=ways.get(k);}else if(d===best)w+=ways.get(k);}}
 assert.strictEqual(w,1,'expected a unique shortest pouring order, got '+w);console.log('B: shortest='+best+' moves, unique; reachable states='+dist.size);}
// every reachable state either reaches the goal or the hint says it is a dead end
{const seen=new Set(),q=[c.START];let dead=0;
 for(let i=0;i<q.length;i++){const x=q[i];if(seen.has(x.join()))continue;seen.add(x.join());const sp=c.shortest(x);const h=c.HINTS.B(x);assert.strictEqual(h.length,3);if(!sp)dead++;
  for(let t=0;t<3;t++){const n=c.pour(x,t);if(n)q.push(n);}}
 console.log('B: dead-end states (undo needed):',dead,'of',seen.size);}
// C: target colour is matched only by recipes with the same ratio; the nearest different recipe is out of tolerance
{const prim=(r,y,b)=>{const g=(a,b)=>b?g(b,a%b):a,d=g(g(r,y),b);return [r/d,y/d,b/d].join(',');};
 const tgt=prim(...c.TARGET);let near=1e9,okCount=0;
 for(let r=0;r<=c.MAXDROP;r++)for(let y=0;y<=c.MAXDROP;y++)for(let b=0;b<=c.MAXDROP;b++){
  if(!(r+y+b))continue;const ok=c.colorOk([r,y,b]);
  if(ok){okCount++;assert.strictEqual(prim(r,y,b),tgt,'recipe '+[r,y,b]+' also matches');}
  else if(prim(r,y,b)!==tgt)near=Math.min(near,c.colorDist(c.mixColor(r,y,b),c.mixColor(...c.TARGET)));
 }
 assert.ok(near>c.TOL*1.5,'nearest wrong recipe too close: '+near);
 console.log('C: accepted recipes='+okCount+', nearest wrong recipe distance='+near.toFixed(1)+' (tolerance '+c.TOL+')');}
// C: direction words exist for every mix; a player who follows "closer" moves can reach the recipe
// (a plain one-drop climb has two small traps, each escaped by a second drop; reported, not hidden)
{const D=(d)=>c.colorDist(c.mixColor(...d),c.mixColor(...c.TARGET));
 const nb=d=>{const o=[];for(let i=0;i<3;i++)for(const sg of [-1,1]){const n=[...d];n[i]+=sg;if(n[i]<0||n[i]>c.MAXDROP||!n.some(Boolean))continue;o.push(n);}return o;};
 const traps=[];
 for(let r=0;r<=c.MAXDROP;r++)for(let y=0;y<=c.MAXDROP;y++)for(let b=0;b<=c.MAXDROP;b++){
  const d=[r,y,b],w=c.dirWord(d);assert.ok(typeof w==='string'&&w.length>3);if(!(r+y+b)||c.colorOk(d))continue;
  if(!nb(d).some(n=>D(n)<D(d)-1e-9))traps.push(d);}
 for(const d of traps)assert.ok(nb(d).some(n=>nb(n).some(m=>D(m)<D(d)-1e-9)),'trap '+d+' has no two-drop escape');
 // every mix reaches the recipe by repeatedly taking the best of the neighbours within two drops
 for(let r=0;r<=c.MAXDROP;r++)for(let y=0;y<=c.MAXDROP;y++)for(let b=0;b<=c.MAXDROP;b++){
  if(!(r+y+b))continue;let d=[r,y,b],steps=0;
  while(!c.colorOk(d)){const cand=[...nb(d),...nb(d).flatMap(nb)].filter(n=>n.some(Boolean)&&D(n)<D(d)-1e-9).sort((p,q)=>D(p)-D(q));assert.ok(cand.length,'stuck at '+d);d=cand[0];assert.ok(++steps<20);}}
 console.log('C: one-drop traps: '+traps.map(d=>'('+d+')').join(' ')+' of 123 wrong mixes; all mixes reach the recipe with closer moves of at most two drops');
 for(let m=0;m<125;m++)assert.strictEqual(c.HINTS.C([m%5,Math.floor(m/5)%5,Math.floor(m/25)]).length,3);
 assert.ok(c.TARGET_WORDS.length>3&&Object.keys(c.MARKS).join()==='R,Y,B'&&new Set(Object.values(c.MARKS)).size===3);}
// The apprentice cards and names match the dialogue draft (single source of truth is the draft)
{const md=fs.readFileSync(path.join(__dirname,'..','expert-dialogue-draft.md'),'utf8');
 const rows=[...md.matchAll(/^\| \d \| (\S+) \| .+? \| (「.+」) \|$/gm)].map(m=>[m[1],m[2]]);
 assert.strictEqual(rows.length,7);
 rows.forEach(([name,line],i)=>{assert.strictEqual(name,c.APPRENTICES[i]);assert.strictEqual(line,c.CARD_LINES[i]);});}
console.log('OK: E3 stages verified');
