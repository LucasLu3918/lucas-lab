// Searches the seven apprentice testimonies for E3 stage A (seeded, repeatable). Run: node e3-testimony.gen.cjs [seed]
// Rules: everyone tells the truth except the apprentice holding the poisoned apple (here number 7, 甘松).
// Wanted: the only consistent holder is 甘松; no statement refutes more than 3 apprentices; no 3 statements are enough on
// their own; as many statements as possible are the *only* refutation of someone (necessary). Pigeonhole: with 7 statements
// and 6 wrong holders at most 6 statements can be necessary, so "all seven necessary" is impossible.
const CULPRIT=6,N=7;
const holds=(st,p)=>st.k==='not'?!st.s.includes(p):st.k==='in'?st.s.includes(p):(p%2===0)===st.v;
const refutes=(st,i,p)=>holds(st,p)!==(i!==p); // statement i is contradicted if the holder were p
const analyse=T=>{
 const ref=T.map((st,i)=>[...Array(N).keys()].filter(p=>refutes(st,i,p)));
 const alive=idx=>[...Array(N).keys()].filter(p=>idx.every(i=>!ref[i].includes(p)));
 if(alive([...Array(N).keys()]).join()!==String(CULPRIT))return null;
 const maxRefute=Math.max(...ref.map(r=>r.length));
 let minSubset=N;for(let m=1;m<1<<N;m++){const idx=[...Array(N).keys()].filter(i=>m>>i&1);if(idx.length<minSubset&&alive(idx).length===1)minSubset=idx.length;}
 const necessary=[...Array(N).keys()].filter(i=>alive([...Array(N).keys()].filter(j=>j!==i)).length>1);
 return {ref,maxRefute,minSubset,necessary};
};
const rng=seed=>()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;
const make=r=>{
 const pick=n=>{const a=[...Array(N).keys()],o=[];while(o.length<n){o.push(a.splice(Math.floor(r()*a.length),1)[0]);}return o.sort((x,y)=>x-y);};
 const t=r();return t<.5?{k:'not',s:pick(1+Math.floor(r()*3))}:t<.8?{k:'in',s:pick(4+Math.floor(r()*2))}:{k:'odd',v:true};
};
module.exports={holds,refutes,analyse,CULPRIT,N};
if(require.main===module){
 const r=rng(+process.argv[2]||7);let best=null;
 for(let n=0;n<400000;n++){
  const T=Array.from({length:N},()=>make(r));
  if(T.filter(s=>s.k==='odd').length>1)continue;
  const a=analyse(T);if(!a||a.maxRefute>3||a.minSubset<4)continue;
  const score=a.necessary.length*10+a.minSubset;
  if(!best||score>best.score)best={score,T,a};
 }
 console.log(JSON.stringify(best.T));console.log('necessary',best.a.necessary.map(i=>i+1).join(),'minSubset',best.a.minSubset,'maxRefute',best.a.maxRefute,'refuted-by',JSON.stringify(best.a.ref.map(x=>x.map(p=>p+1))));
}
