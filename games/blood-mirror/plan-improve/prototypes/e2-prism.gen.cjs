// Searches random layouts for the three E2 stages and writes the ones that pass every design rule into e2-prism.html.
// Run: node e2-prism.gen.cjs   (deterministic: fixed seeds per stage; the first layout that passes wins)
// Design rules checked here (the solver e2-prism.solve.cjs re-proves the claims on the written file):
//  - exactly one beam solution (states that differ only in a mirror no beam touches count as the same solution)
//  - the start state is not solved, and the solution really uses the new rule of the stage (filter / crystal / dancer)
//  - stage 3 only: no single flip of the start state lights more masks than the start state does (no one-step progress)
const fs=require('fs'),vm=require('vm'),path=require('path');
const file=path.join(__dirname,'e2-prism.html');
const html=fs.readFileSync(file,'utf8');
const core=html.match(/<script data-core>([\s\S]*?)<\/script>/)[1];
const sb={module:{exports:{}}};vm.runInNewContext(core,sb);
const {trace,solved,litCount,allStates,bits}=sb.module.exports;

const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const sig=(L,S)=>{const r=trace(L,S);return JSON.stringify([r.beams.map(b=>b.segs),r.got,r.crystalIn]);};
const DIR4=[[0,1],[1,0],[-1,0],[0,-1]];

const SPECS=[
 {id:'s1',title:'濾鏡',goal:'白光裡藏著三種顏色。這個面具只要紅光：讓光先經過紅色的濾鏡，再照到它。點一下鏡子可以把它轉向。',
  w:7,h:5,emit:['W'],nM:3,filters:[1],crystals:0,dancers:0,needs:[1],seed:101,oneStep:false,minDist:2},
 {id:'s2',title:'合光水晶',goal:'這個面具要黃光，但紅光和綠光是分開的兩束。讓兩束光都照進合光水晶，它會把兩種顏色合成一束，朝箭頭方向射出。',
  w:7,h:5,emit:['R','G'],nM:4,filters:[],crystals:1,dancers:0,needs:[3],seed:202,oneStep:false,minDist:2},
 {id:'s3',title:'舞廳',goal:'讓三個面具各自亮起需要的顏色：紅、藍、黃。光會穿過面具繼續前進，所以不要讓多餘的光照到它。點舞者可以把他推到另一格。',
  w:9,h:7,emit:['W','G','B'],nM:7,filters:[1],crystals:1,dancers:2,needs:[1,4,3],seed:303,oneStep:true,minDist:4}
];

function attempt(spec,rand){
 const {w,h}=spec,used=new Set();
 const free=()=>{for(let g=0;g<200;g++){const x=Math.floor(rand()*w),y=Math.floor(rand()*h),k=x+','+y;if(!used.has(k)){used.add(k);return [x,y];}}return null;};
 const cols=[];while(cols.length<spec.emit.length){const x=Math.floor(rand()*w);if(!cols.includes(x))cols.push(x);}
 const L={w,h,emitters:spec.emit.map((c,i)=>({c,x:cols[i]})),mirrors:[],filters:[],crystals:[],blockers:[],targets:[]};
 // The emitter cells (x,0) stay clear so the first mirror is not right under the prism.
 cols.forEach(x=>used.add(x+',0'));
 for(let i=0;i<spec.nM;i++){const p=free();if(!p)return null;L.mirrors.push({x:p[0],y:p[1]});}
 for(const c of spec.filters){const p=free();if(!p)return null;L.filters.push({x:p[0],y:p[1],c});}
 for(let i=0;i<spec.crystals;i++){const p=free();if(!p)return null;L.crystals.push({x:p[0],y:p[1],dir:DIR4[Math.floor(rand()*4)]});}
 for(let i=0;i<spec.dancers;i++){const a=free(),b=free();if(!a||!b)return null;L.blockers.push({a,b});}
 // random solution state, then put the masks where the light actually lands
 const sol={m:L.mirrors.map(()=>rand()<.5?'/':'\\'),k:L.blockers.map(()=>rand()<.5?1:0)};
 const r=trace(L,sol);if(!r.stable)return null;
 const device=new Set([...L.mirrors,...L.filters,...L.crystals].map(d=>d.x+','+d.y));
 L.blockers.forEach(b=>{device.add(b.a+'');device.add(b.b+'');});
 const lightAt=new Map();
 for(const b of r.beams)for(const sg of b.segs)sg.pts.forEach(p=>{const x=Math.round(p[0]),y=Math.round(p[1]);if(x<0||y<0||x>=w||y>=h||p[0]!==x||p[1]!==y)return;const k=x+','+y;if(device.has(k)||cols.includes(x)&&y<0)return;lightAt.set(k,(lightAt.get(k)||0)|sg.mask);});
 // a union of passes through one cell: the same cell can be crossed by two beams
 const chosen=new Set();
 for(const need of spec.needs){
  const cand=[...lightAt].filter(([k,m])=>m===need&&!chosen.has(k));
  if(!cand.length)return null;
  const k=cand[Math.floor(rand()*cand.length)][0];chosen.add(k);const [x,y]=k.split(',').map(Number);L.targets.push({x,y,need});
 }
 if(!solved(L,sol))return null;
 // solution quality
 const rs=trace(L,sol),pathAll=new Set();rs.beams.forEach(b=>b.cells.forEach(c=>pathAll.add(c)));
 if(spec.crystals&&!rs.crystalIn.every(v=>bits(v)>=2))return null;
 if(spec.filters.length&&!rs.beams.some(b=>b.segs.length>1))return null;
 for(let i=0;i<L.blockers.length;i++){const alt=sol.k[i]?L.blockers[i].a:L.blockers[i].b;if(!pathAll.has(alt+''))return null;}
 // uniqueness by beam signature
 const sigs=new Set(allStates(L).filter(S=>solved(L,S)).map(S=>sig(L,S)));
 if(sigs.size!==1)return null;
 const sols=allStates(L).filter(S=>solved(L,S));
 const dist=S=>Math.min(...sols.map(q=>q.m.filter((v,i)=>v!==S.m[i]).length+q.k.filter((v,i)=>v!==S.k[i]).length));
 // start state: dancers on the sol path, mirrors random, not solved
 for(let g=0;g<40;g++){
  const init={m:L.mirrors.map(()=>rand()<.5?'/':'\\'),k:L.blockers.map((_,i)=>1-sol.k[i])};
  if(solved(L,init)||dist(init)<spec.minDist)continue;
  if(spec.oneStep){
   const base=litCount(L,init);let ok=true;
   for(let i=0;i<init.m.length&&ok;i++){const n={m:[...init.m],k:[...init.k]};n.m[i]=n.m[i]==='/'?'\\':'/';if(litCount(L,n)>base)ok=false;}
   for(let i=0;i<init.k.length&&ok;i++){const n={m:[...init.m],k:[...init.k]};n.k[i]^=1;if(litCount(L,n)>base)ok=false;}
   if(!ok)continue;
   if(base>1)continue;
  }
  return {L,init};
 }
 return null;
}

const out=[];
for(const spec of SPECS){
 const rand=rng(spec.seed);let found=null,tries=0;
 while(!found&&tries<400000){tries++;found=attempt(spec,rand);}
 if(!found){console.error(spec.id+': no layout in '+tries+' attempts');process.exit(1);}
 console.log(spec.id+': found after '+tries+' attempts');
 out.push({id:spec.id,title:spec.title,goal:spec.goal,L:found.L,init:found.init});
}
const body=out.map(s=>' '+JSON.stringify(s)).join(',\n')+'\n';
fs.writeFileSync(file,html.replace(/\/\/ BEGIN-STAGES\n[\s\S]*?\/\/ END-STAGES/,'// BEGIN-STAGES\n'+body+'// END-STAGES'));
console.log('written');
