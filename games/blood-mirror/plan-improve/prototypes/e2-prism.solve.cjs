// Extracts the rules and stages from e2-prism.html and proves the design claims. Run: node e2-prism.solve.cjs
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'e2-prism.html'),'utf8');
const grab=tag=>html.match(new RegExp('<script data-'+tag+'>([\\s\\S]*?)</script>'))[1];
const sb={module:{exports:{}}};vm.runInNewContext(grab('core'),sb);
const {trace,solved,litCount,allStates,solutions,hint,bits}=sb.module.exports;
const STAGES=vm.runInNewContext(grab('layouts')+';STAGES');
assert.strictEqual(STAGES.length,3);
const sig=(L,S)=>{const r=trace(L,S);return JSON.stringify([r.beams.map(b=>b.segs),r.got,r.crystalIn]);};
const flips=(a,b)=>a.m.filter((v,i)=>v!==b.m[i]).length+a.k.filter((v,i)=>v!==b.k[i]).length;
for(const st of STAGES){
 const all=solutions(st.L);
 assert.ok(all.length>=1,st.id+' has no solution');
 assert.strictEqual(new Set(all.map(S=>sig(st.L,S))).size,1,st.id+' has more than one beam solution');
 assert.ok(!solved(st.L,st.init),st.id+' starts solved');
 assert.ok(trace(st.L,all[0]).stable,st.id+' solution is not stable');
 const sol=all[0],rs=trace(st.L,sol);
 if((st.L.crystals||[]).length)assert.ok(rs.crystalIn.every(v=>bits(v)>=2),st.id+' solution does not use the crystal');
 if((st.L.filters||[]).length)assert.ok(rs.beams.some(b=>b.segs.length>1),st.id+' solution does not use the filter');
 // no mask may be lit by too much light in the solution (solved already means exact), and every mask is in range
 st.L.targets.forEach(t=>assert.ok(t.x>=0&&t.x<st.L.w&&t.y>=0&&t.y<st.L.h));
 // hints: every tier is text, and applying tier 3 repeatedly reaches a solved board
 let S={m:[...st.init.m],k:[...st.init.k]},steps=0;
 while(!solved(st.L,S)){
  for(const t of [1,2,3])assert.ok(typeof hint(st.L,S,sol,t)==='string'&&hint(st.L,S,sol,t).length>10);
  const h=hint(st.L,S,sol,3),m=h.match(/第 (\d+) 欄、第 (\d+) 列的鏡子轉成「(.)」/);
  if(m){const i=st.L.mirrors.findIndex(q=>q.x===m[1]-1&&q.y===m[2]-1);assert.ok(i>=0);assert.notStrictEqual(S.m[i],m[3]);S.m[i]=m[3];}
  else{const d=h.match(/第 (\d+) 位舞者/);assert.ok(d,'tier 3 named nothing: '+h);S.k[d[1]-1]^=1;}
  assert.ok(++steps<=st.L.mirrors.length+st.L.blockers.length+1,st.id+' hints do not converge');
 }
 // brute-force pressure: how far is the start from the nearest solution, and does any single flip make progress?
 const states=allStates(st.L),dist=Math.min(...all.map(S=>flips(S,st.init)));
 const base=litCount(st.L,st.init);let better=0;
 for(let i=0;i<st.init.m.length;i++){const n={m:[...st.init.m],k:[...st.init.k]};n.m[i]=n.m[i]==='/'?'\\':'/';if(litCount(st.L,n)>base)better++;}
 for(let i=0;i<st.init.k.length;i++){const n={m:[...st.init.m],k:[...st.init.k]};n.k[i]^=1;if(litCount(st.L,n)>base)better++;}
 if(st.id==='s3')assert.strictEqual(better,0,'stage 3 has a one-step improvement');
 console.log(st.id,'OK: beam solutions=1, solving states='+all.length+'/'+states.length+', start lit='+base+'/'+st.L.targets.length+', nearest solution='+dist+' flips, one-step improvements='+better+', hints converge in '+steps+' fixes');
}
