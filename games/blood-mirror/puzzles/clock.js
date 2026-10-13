// A time-based animation loop for the belfry mechanisms. requestAnimationFrame stops completely while the page is in the
// background (another tab, a hidden browser pane), which used to freeze a running mechanism. Each frame is therefore
// scheduled twice, by requestAnimationFrame and by a timer, and whichever fires first runs it. Progress is computed from
// the elapsed time, not from the number of frames, so a slow or throttled frame never slows the mechanism down.
// `step(elapsedMs)` returns false when the animation is over. The returned function stops it early.
export function animate(step){
 const start=performance.now();
 let stopped=false;
 const frame=()=>{
  if(stopped)return;
  if(step(performance.now()-start)===false){stopped=true;return;}
  schedule();
 };
 function schedule(){
  let fired=false;
  const run=()=>{if(fired)return;fired=true;clearTimeout(timer);frame();};
  const timer=setTimeout(run,document.hidden?50:120);
  requestAnimationFrame(run);
 }
 frame();
 return ()=>{stopped=true;};
}
