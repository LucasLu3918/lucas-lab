// Port directions are clockwise: north, east, south, west.
export const pipeTiles=[
 {at:1,type:'straight'}, {at:2,type:'elbow'}, {at:5,type:'elbow'},
 {at:4,type:'elbow'}, {at:7,type:'elbow'}
];
export const initialPipeRotations=[1,0,1,3,2];
export const pipeDirectionNames=['上','右','下','左'];
export function pipePorts(type,turns){
 if(!['straight','elbow'].includes(type)||!Number.isInteger(turns))return [];
 const rotation=((turns%4)+4)%4;
 return (type==='straight'?[1,3]:[0,1]).map(port=>(port+rotation)%4);
}
export function analyzePipes(rotations){
 const invalid={valid:false,solved:false,flowing:[],leaks:[],connectedPipes:0};
 if(!Array.isArray(rotations)||rotations.length!==pipeTiles.length||!rotations.every(Number.isSafeInteger))return invalid;
 const cells=new Map([[0,[1]],[8,[3]]]);
 pipeTiles.forEach((tile,i)=>cells.set(tile.at,pipePorts(tile.type,rotations[i])));
 const flowing=new Set([0]),queue=[0],leaks=[];
 for(let n=0;n<queue.length;n++){
  const at=queue[n],row=Math.floor(at/3),col=at%3;
  for(const direction of cells.get(at)){
   const nextRow=row+[-1,0,1,0][direction],nextCol=col+[0,1,0,-1][direction];
   const next=nextRow<0||nextRow>2||nextCol<0||nextCol>2?null:nextRow*3+nextCol;
   if(next===null||!cells.get(next)?.includes((direction+2)%4)){leaks.push({at,direction,next});continue;}
   if(!flowing.has(next)){flowing.add(next);queue.push(next);}
  }
 }
 return {valid:true,solved:flowing.has(8)&&leaks.length===0,flowing:[...flowing],leaks,connectedPipes:pipeTiles.filter(tile=>flowing.has(tile.at)).length};
}
export const pipeIsSolved=rotations=>analyzePipes(rotations).solved;
export function pipeSVG(type,{terminal=false}={}){
 const path=type==='straight'?'M0 50H100':type==='elbow'?'M50 0V50H100':type==='source'?'M50 50H100':'M0 50H50';
 return `<svg class="pipe-glyph" viewBox="0 0 100 100" fill="none" aria-hidden="true"><path class="pipe-shadow" d="${path}"/><path class="pipe-metal" d="${path}"/><path class="pipe-core" d="${path}"/>${terminal?'<circle cx="50" cy="50" r="13" class="pipe-terminal-mark"/>':''}</svg>`;
}
