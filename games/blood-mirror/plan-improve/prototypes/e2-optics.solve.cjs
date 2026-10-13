// Extracts the rules and stages from e2-optics.html and proves the design claims. Run: node e2-optics.solve.cjs
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'e2-optics.html'),'utf8');
const grab=tag=>html.match(new RegExp('<script data-'+tag+'>([\\s\\S]*?)</script>'))[1];
const sb={module:{exports:{}}};vm.runInNewContext(grab('core'),sb);
const {trace,solved,solutions,hint}=sb.module.exports;
const STAGES=vm.runInNewContext(grab('layouts')+';STAGES');
const sig=(L,S)=>JSON.stringify(trace(L,S).beams.map(b=>b.pts));
for(const st of STAGES){
 const all=solutions(st.L);
 assert.ok(all.length>=1,st.id+' has no solution');
 assert.strictEqual(new Set(all.map(S=>sig(st.L,S))).size,1,st.id+' has more than one beam solution');
 assert.ok(!solved(st.L,st.init),st.id+' starts solved');
 // hints: every tier is text, and following tier 3 repeatedly reaches the solution
 const sol=all[0];let S={m:[...st.init.m],k:[...st.init.k]},steps=0;
 while(!solved(st.L,S)){
  for(const t of [1,2,3])assert.ok(typeof hint(st.L,S,sol,t)==='string'&&hint(st.L,S,sol,t).length>10);
  const mi=sol.m.findIndex((v,i)=>S.m[i]!==v&&true),ki=sol.k.findIndex((v,i)=>S.k[i]!==v);
  // apply the fix named by tier 3 (a live mirror, else a dancer) and make sure progress is possible
  const h=hint(st.L,S,sol,3);const m=h.match(/第 (\d+) 欄、第 (\d+) 列的鏡子轉成「(.)」/);
  if(m){const i=st.L.mirrors.findIndex(q=>q.x===m[1]-1&&q.y===m[2]-1);assert.ok(i>=0);S.m[i]=m[3];}
  else{const d=h.match(/第 (\d+) 位舞者/);assert.ok(d,'tier 3 named nothing: '+h);S.k[d[1]-1]^=1;}
  assert.ok(++steps<=st.L.mirrors.length+st.L.blockers.length+1,st.id+' hints do not converge');
 }
 console.log(st.id,'OK: beam solutions=1, states solving='+all.length+', hints converge in '+steps+' fixes');
}
