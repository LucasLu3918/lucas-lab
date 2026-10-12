(function serve(){
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
 const root=path.resolve(__dirname,'../dist');
 if(!fs.existsSync(path.join(root,'index.html'))){console.error('Run npm run build first.');process.exit(1)}
 const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.mp3':'audio/mpeg','.m4a':'audio/mp4','.m4a':'audio/mp4','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.avif':'image/avif','.png':'image/png','.jpg':'image/jpeg'};
 // Mirrors dist/_headers the way Cloudflare applies it locally: "/*" and exact paths, plus trailing-"*" prefixes. Later rules override earlier ones.
 const rules=(()=>{
  const file=path.join(root,'_headers');
  if(!fs.existsSync(file))return [];
  const blocks=[];let current=null;
  for(const line of fs.readFileSync(file,'utf8').split('\n')){
   if(!line.trim())continue;
   if(!/^\s/.test(line)){current={pattern:line.trim(),headers:{}};blocks.push(current);continue}
   const [name,...value]=line.trim().split(':');if(current&&value.length)current.headers[name.trim()]=value.join(':').trim();
  }
  return blocks;
 })();
 const headersFor=pathname=>{
  const headers={};
  for(const {pattern,headers:set} of rules){
   const matches=pattern.endsWith('*')?pathname.startsWith(pattern.slice(0,-1)):pathname===pattern;
   if(matches)Object.assign(headers,set);
  }
  return headers;
 };
 const port=Number(process.env.PORT||4173);
 http.createServer((req,res)=>{
  let name;
  try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end('Bad request');return}
  const target=path.resolve(root,'.'+name,(name.endsWith('/')?'index.html':''));
  if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return}
  let file=target;
  try{
   if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   const bytes=fs.readFileSync(file);
   // Byte ranges, like Cloudflare, so audio seeking works in the local preview.
   const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
   if(range&&(range[1]||range[2])){
    const start=range[1]?Number(range[1]):Math.max(0,bytes.length-Number(range[2])),end=range[1]&&range[2]?Math.min(Number(range[2]),bytes.length-1):bytes.length-1;
    if(start>end||start>=bytes.length){res.writeHead(416,{'Content-Range':'bytes */'+bytes.length});res.end();return}
    res.writeHead(206,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Accept-Ranges':'bytes','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff',...headersFor(name)});
    res.end(bytes.subarray(start,end+1));return;
   }
   res.writeHead(200,{'Accept-Ranges':'bytes','Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff',...headersFor(name)});
   res.end(bytes);
  }catch{
   res.writeHead(404,{'Content-Type':'text/html; charset=utf-8',...headersFor(name)});
   res.end(fs.readFileSync(path.join(root,'404.html')));
  }
 }).listen(port,()=>console.log('LUCAS LAB preview: http://localhost:'+port));
})();
