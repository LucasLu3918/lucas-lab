'use strict';
// Copies source assets, writes content-fingerprinted copies of the site CSS/JS, and emits the Cloudflare _headers file.
const crypto=require('node:crypto');
const FINGERPRINTED=['assets/style.css','assets/app.js'];

function fingerprintOf(bytes){return crypto.createHash('sha256').update(bytes).digest('hex').slice(0,10)}

function securityAndCacheHeaders(base){
 const p=base==='/'?'':base.replace(/\/$/,'');
 const csp=["default-src 'self'","script-src 'self'","style-src 'self' 'unsafe-inline'","img-src 'self' data:","media-src 'self'","font-src 'self'","connect-src 'self'","manifest-src 'self'","worker-src 'self'","object-src 'none'","base-uri 'self'","form-action 'self'","frame-ancestors 'none'"].join('; ');
 return [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  X-Frame-Options: DENY',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  '  Content-Security-Policy: '+csp,
  '',
  // Fingerprinted copies are content-addressed, so they can be cached forever.
  p+'/static/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
  // Unhashed entry points stay revalidated so a deploy is never masked by a stale copy.
  p+'/assets/style.css',
  '  Cache-Control: no-cache',
  p+'/assets/app.js',
  '  Cache-Control: no-cache',
  p+'/sw.js',
  '  Cache-Control: no-cache',
  '',
  p+'/assets/images/*',
  '  Cache-Control: public, max-age=604800',
  p+'/games/blood-mirror/play/assets/*',
  '  Cache-Control: public, max-age=604800',
  ''
 ].join('\n');
}

module.exports=function copyAssets(ctx){
 const {fs,path,root,out}=ctx;
 for(const f of fs.readdirSync(path.join(root,'assets'))){
  const source=path.join(root,'assets',f);
  if(fs.statSync(source).isFile())fs.copyFileSync(source,path.join(out,'assets',f));
  else if(f==='images'){
   const destination=path.join(out,'assets',f);fs.mkdirSync(destination,{recursive:true});
   for(const image of fs.readdirSync(source))if(fs.statSync(path.join(source,image)).isFile())fs.copyFileSync(path.join(source,image),path.join(destination,image));
  }
 }
 const fingerprint={};
 for(const file of FINGERPRINTED){
  const bytes=fs.readFileSync(path.join(root,file)),hash=fingerprintOf(bytes);
  const dir=path.join(out,'static',hash);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,path.basename(file)),bytes);
  fingerprint[file]='static/'+hash+'/'+path.basename(file);
 }
 const base=('/'+(process.env.BASE_PATH||'/').replace(/^\/+|\/+$/g,'')+'/').replace('//','/');
 fs.writeFileSync(path.join(out,'_headers'),securityAndCacheHeaders(base));
 return {fingerprint};
};
module.exports.fingerprintOf=fingerprintOf;
