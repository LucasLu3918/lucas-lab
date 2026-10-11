// "The heartbeat in the glass": watch six flashes, then repeat the order of the sigils.
const glyphs=['☾','♧','◇','✦'],names=['月亮','蘋果','鏡子','心跳'],sequence=[3,0,3,1,3,2];

export function mountRune(ctx){
 let position=0,playing=false,token=0,failures=0,slow=false,carving=false;
 const draw=(message)=>{
  ctx.render('<p class="challenge-help">觀看玻璃棺依序亮起的六次光芒，然後照順序觸碰。每一次心跳（✦）之後，會亮起一個符印。</p><div class="rune-board">'+glyphs.map((g,i)=>'<button class="rune-key" data-rune="'+i+'" aria-label="'+names[i]+' '+g+'" '+(playing?'disabled':'')+'>'+g+'</button>').join('')+'</div><p class="challenge-feedback" role="status">'+(message||'已重現 '+position+' / '+sequence.length+' 次光芒。')+'</p>'+(carving?'<p class="rune-carving">棺蓋上的刻痕：'+sequence.map(n=>names[n]).join(' → ')+'</p>':'')+'<button id="rune-replay" class="primary-button">觀看心跳 ⟶</button><div class="pipe-actions"><button id="rune-slow" class="secondary-button" aria-pressed="'+slow+'">'+(slow?'恢復正常速度':'放慢心跳')+'</button>'+(failures>=2&&!carving?'<button id="rune-carving" class="secondary-button">查看棺蓋刻痕</button>':'')+'</div>');
  document.querySelectorAll('[data-rune]').forEach(b=>b.onclick=()=>{
   if(playing)return;
   const n=Number(b.dataset.rune);
   if(n!==sequence[position]){
    position=0;failures++;ctx.playCue('wrong');
    draw(failures>=2&&!carving?'記憶碎裂了。可以再看一次、放慢心跳，或查看棺蓋上的刻痕。':'記憶碎裂了。再觀看一次光芒的順序。');
    return;
   }
   position++;ctx.playCue('click');
   if(position===sequence.length){ctx.done();return;}
   draw();
  });
  document.querySelector('#rune-slow').onclick=()=>{slow=!slow;draw();};
  document.querySelector('#rune-carving')?.addEventListener('click',()=>{carving=true;draw();});
  document.querySelector('#rune-replay').onclick=()=>{
   if(playing)return;
   playing=true;position=0;draw('注意看……');
   const current=++token,step=slow?1000:560,glow=slow?700:330;
   sequence.forEach((value,i)=>setTimeout(()=>{
    if(current!==token||!document.querySelector('[data-challenge="crypt"]'))return;
    const el=document.querySelector('[data-rune="'+value+'"]');
    el?.classList.add('illuminated');
    ctx.feedback(names[value]);
    setTimeout(()=>el?.classList.remove('illuminated'),glow);
    if(i===sequence.length-1)setTimeout(()=>{playing=false;if(document.querySelector('[data-challenge="crypt"]'))draw('輪到妳了。依序觸碰剛才亮起的光芒。');},glow+60);
   },i*step+160));
  };
 };
 draw();
}
