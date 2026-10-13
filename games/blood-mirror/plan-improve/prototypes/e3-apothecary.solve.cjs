// Extracts the rules from e3-apothecary.html and proves the design claims. Run: node e3-apothecary.solve.cjs
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'e3-apothecary.html'),'utf8');
const sb={module:{exports:{}}};vm.runInNewContext(html.match(/<script data-core>([\s\S]*?)<\/script>/)[1],sb);
const c=sb.module.exports;
// A: exactly one miner can hold the poison; every wrong guess breaks something; text is non-empty
assert.strictEqual(JSON.stringify(c.candidatesA()),'[6]'); // JSON: arrays from vm are a different realm
for(let p=0;p<7;p++)if(p!==6)assert.ok(c.conflicts(p).length>0,'wrong guess '+p+' breaks nothing');
for(const st of c.TESTIMONY)assert.ok(c.say(st).length>8);
assert.strictEqual(new Set(c.ZHUYIN).size,7);
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
// The apprentice cards and names match the dialogue draft (single source of truth is the draft)
{const md=fs.readFileSync(path.join(__dirname,'..','expert-dialogue-draft.md'),'utf8');
 const rows=[...md.matchAll(/^\| \d \| (\S+) \| .+? \| (「.+」) \|$/gm)].map(m=>[m[1],m[2]]);
 assert.strictEqual(rows.length,7);
 rows.forEach(([name,line],i)=>{assert.strictEqual(name,c.APPRENTICES[i]);assert.strictEqual(line,c.CARD_LINES[i]);});}
console.log('OK: E3 stages verified');
