// Cloudflare Worker in front of the static assets, routed only for /music/audio/* (wrangler.jsonc "run_worker_first");
// every other path is served straight from the static assets without running this code.
// The asset server answers every request for a song with the whole file (200), and browsers mark such audio as
// not seekable, so the progress bar snapped back to 0:00. This turns "Range: bytes=…" into a proper 206 slice.
const RANGE=/^bytes=(\d*)-(\d*)$/;

export default {
 async fetch(request,env){
  const range=RANGE.exec(request.headers.get('range')||'');
  // Ask the asset server for the whole file; the Range header is answered here instead.
  const plain=new Request(request.url,{method:request.method,headers:{accept:request.headers.get('accept')||'*/*'}});
  const asset=await env.ASSETS.fetch(plain);
  const headers=new Headers(asset.headers);
  headers.set('Accept-Ranges','bytes');
  if(asset.status!==200||!range||(!range[1]&&!range[2]))return new Response(asset.body,{status:asset.status,headers});
  const bytes=await asset.arrayBuffer(),size=bytes.byteLength;
  const start=range[1]?Number(range[1]):Math.max(0,size-Number(range[2]));
  const end=range[1]&&range[2]?Math.min(Number(range[2]),size-1):size-1;
  if(start>end||start>=size){
   headers.delete('Content-Length');headers.set('Content-Range','bytes */'+size);
   return new Response(null,{status:416,headers});
  }
  headers.set('Content-Range',`bytes ${start}-${end}/${size}`);
  headers.set('Content-Length',String(end-start+1));
  headers.delete('ETag');
  return new Response(request.method==='HEAD'?null:bytes.slice(start,end+1),{status:206,headers});
 }
};
