// "The reversed manuscript": the left half is fixed; light the right half so each row mirrors it.
export const glassIsSolved=(left,right)=>left.length===8&&right.length===8&&left.every((x,i)=>x===right[i^1]);

export function mountReflection(ctx){
 const left=[true,false,false,true,true,true,false,true];
 const right=[false,false,true,false,false,false,false,true];
 const rows=values=>[0,1,2,3].filter(r=>left[r*2]===values[r*2+1]&&left[r*2+1]===values[r*2]).length;
 if(ctx.mountPuzzleIsland){
  ctx.render('<p class="challenge-help">手稿是寫給鏡子讀的。左側是刻在紙上的光紋，無法修改；點亮或熄滅右側的格子，讓每一列成為左右對稱的鏡像，反寫的字就會轉正。</p><div class="reflection-vue-host" data-vue-reflection-puzzle><p role="status">手稿正在映照…</p></div>');
  ctx.mountPuzzleIsland({left:[...left],right:[...right],onChange:values=>{
   ctx.playCue('click');
   if(glassIsSolved(left,values))ctx.done();
  }});
  return;
 }
 const draw=()=>{
  ctx.render('<p class="challenge-help">手稿是寫給鏡子讀的。左側是刻在紙上的光紋，無法修改；點亮或熄滅右側的格子，讓每一列成為左右對稱的鏡像，反寫的字就會轉正。</p><div class="reflection-board">'+Array.from({length:16},(_,i)=>{
   const row=Math.floor(i/4),col=i%4,k=row*2+(col<2?col:col-2),lit=col<2?left[k]:right[k];
   return '<button class="reflection-cell '+(lit?'glow':'')+' '+(col<2?'fixed':'')+'" data-reflection="'+(col>=2?k:-1)+'" '+(col<2?'disabled aria-label="手稿第'+(row+1)+'列第'+(col+1)+'格，'+(lit?'亮':'暗')+'"':'aria-label="鏡中第'+(row+1)+'列第'+(col-1)+'格，'+(lit?'亮':'暗')+'"')+'>'+(lit?'✦':'·')+'</button>';
  }).join('')+'</div><p class="challenge-feedback" role="status">已映照 '+rows(right)+' / 4 列。右側必須是左側的左右翻轉。</p>');
  document.querySelectorAll('[data-reflection]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.reflection);
   if(i<0)return;
   right[i]=!right[i];
   ctx.playCue('click');
   if(glassIsSolved(left,right)){ctx.done();return;}
   draw();
  });
 };
 draw();
}
