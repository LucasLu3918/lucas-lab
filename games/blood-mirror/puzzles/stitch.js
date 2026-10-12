// The stitch pattern (縫線紋樣), second stage of act "queen". The seam on the back of the grey rabbit's
// ear shows numbered stitches; the front of the ear is its mirror image, so the player repeats the
// stitches in the same order on a 4x4 grid with the columns flipped.
export const SIZE=4;
// Back view of the seam, in stitch order: [row, column].
export const backSeam=[[0,0],[0,1],[0,2],[1,2],[2,1],[3,1],[3,2]];
// What the front of the ear must show: same rows, columns mirrored.
export const frontSeam=backSeam.map(([row,col])=>[row,SIZE-1-col]);
export const stitchSolved=(path,expected=frontSeam)=>path.length===expected.length&&path.every(([row,col],i)=>row===expected[i][0]&&col===expected[i][1]);
// Number of leading stitches that already match, for the feedback line.
export const stitchPrefix=(path,expected=frontSeam)=>{let n=0;while(n<path.length&&n<expected.length&&path[n][0]===expected[n][0]&&path[n][1]===expected[n][1])n++;return n;};

// The first stitch is sewn for the player as a worked example of the mirroring (plan r4).
export const demoStitches=1;
const demo=()=>frontSeam.slice(0,demoStitches);

export function mountStitch(ctx){
 let path=demo(),message='';
 const draw=()=>{
  const backAt=new Map(backSeam.map(([r,c],i)=>[r+','+c,i+1])),frontAt=new Map(path.map(([r,c],i)=>[r+','+c,i+1]));
  let back='',front='';
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
   const n=backAt.get(r+','+c),m=frontAt.get(r+','+c);
   back+='<span class="stitch-cell'+(n?' on':'')+'" role="img" aria-label="背面第'+(r+1)+'列第'+(c+1)+'行'+(n?'：第'+n+'針':'：空')+'">'+(n||'')+'</span>';
   front+='<button class="stitch-cell stitch-pad'+(m?' on':'')+'" data-stitch="'+r+','+c+'" aria-label="正面第'+(r+1)+'列第'+(c+1)+'行'+(m?'，已縫第'+m+'針':'，空的，按下縫一針')+'"'+(m?' aria-pressed="true"':' aria-pressed="false"')+'>'+(m||'')+'</button>';
  }
  ctx.render('<p class="challenge-help">灰兔右耳的背面，針腳依序編了號。薇菈說：「正面是背面的鏡像——左邊的針腳，到了正面就在右邊。」她已經替妳縫好第一針：背面第 1 針在最左上，正面就在最右上。依相同的順序，縫完其餘的針腳。</p>'
   +'<div class="stitch-pair"><div><p class="stitch-caption">耳朵背面（參考）</p><div class="stitch-board" role="group" aria-label="耳朵背面，共'+backSeam.length+'針">'+back+'</div></div>'
   +'<div><p class="stitch-caption">耳朵正面（縫在這裡）</p><div class="stitch-board" role="group" aria-label="耳朵正面，已縫'+path.length+' / '+backSeam.length+'針">'+front+'</div></div></div>'
   +'<p id="stitch-status" class="challenge-feedback" role="status">'+(message||'已縫 '+path.length+' / '+backSeam.length+' 針')+'</p>'
   +'<button id="stitch-undo" class="secondary-button"'+(path.length>demoStitches?'':' disabled')+'>拆掉上一針</button><button id="stitch-reset" class="secondary-button">全部拆開</button>');
  document.querySelectorAll('[data-stitch]').forEach(button=>button.onclick=()=>{
   const [r,c]=button.dataset.stitch.split(',').map(Number);
   if(path.some(([pr,pc])=>pr===r&&pc===c))return;
   path=[...path,[r,c]];message='';ctx.playCue('click');
   if(path.length===backSeam.length){
    if(stitchSolved(path)){ctx.done();return;}
    message='縫線歪了——前 '+stitchPrefix(path)+' 針是對的。線被拆到示範的那一針，再縫一次。';path=demo();ctx.playCue('wrong');
   }
   draw();document.querySelector('[data-stitch="'+r+','+c+'"]')?.focus({preventScroll:true});
  });
  document.querySelector('#stitch-undo').onclick=()=>{if(path.length>demoStitches)path=path.slice(0,-1);message='';draw();};
  document.querySelector('#stitch-reset').onclick=()=>{path=demo();message='';draw();};
 };
 draw();
}
