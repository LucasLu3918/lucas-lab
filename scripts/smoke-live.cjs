#!/usr/bin/env node
'use strict';
// Read-only production health check; requires Node 22+, no credentials.
const assert=require('node:assert/strict');
const site=(process.env.SITE_URL||'https://lucas-lab.owl3918.workers.dev').replace(/\/+$/,'');
const expected=(process.env.EXPECTED_COMMIT||'').trim();
const retries=Number(process.env.SMOKE_RETRIES||3);
assert.match(site,/^https:\/\/[^/]+$/,'SITE_URL must be an HTTPS origin');
assert.ok(Number.isInteger(retries)&&retries>=0&&retries<=10,'SMOKE_RETRIES must be 0..10');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function get(route){
 const address=site+route+(route.includes('?')?'&':'?')+'smoke='+Date.now();
 const response=await fetch(address,{signal:AbortSignal.timeout(12000),headers:{'cache-control':'no-cache'}});
 assert.equal(response.status,200,route+' responded '+response.status);
 return {response,body:await response.text()};
}
async function verify(){
 const routes=['/','/tools/','/stories/','/games/','/projects/','/gallery/','/search/','/stories/mist-letters/chapters/01/','/stories/dark-snow-white/',...Array.from({length:22},(_,i)=>'/stories/dark-snow-white/chapters/'+String(i).padStart(2,'0')+'/')];
 for(const route of routes){
  const {response,body}=await get(route);
  assert.match(response.headers.get('content-type')||'',/text\/html/i,route+' was not HTML');
  assert.ok(body.includes('<main id="main">')&&body.includes('LUCAS LAB'),route+' is not a LUCAS LAB page');
  if(route==='/search/')assert.ok(body.includes('https://lucas-tools.owl3918.workers.dev/'),'/search/ missing tools');
  if(route==='/stories/dark-snow-white/')assert.ok(body.includes('內容提示：')&&body.includes('序章：當鏡子第一次說謊')&&body.includes('/assets/snow-white-cover.svg'),'novel contents, warnings or illustrated cover missing');
  if(route==='/stories/dark-snow-white/chapters/21/')assert.ok(body.includes('《白雪公主：血色魔鏡》——全文完。'),'novel epilogue not deployed');
 }
 const cover=await get('/assets/snow-white-cover.svg');
 assert.match(cover.response.headers.get('content-type')||'',/image\/svg\+xml/i,'deployed book cover has incorrect MIME');
 assert.ok(cover.body.startsWith('<svg')&&cover.body.includes('白雪公主：血色魔鏡'),'book-cover illustration missing or corrupted');
 const css=await get('/assets/style.css');
 assert.ok(css.body.includes('max-width:480px'),'deployed CSS missing mobile rules');
 const sitemap=await get('/sitemap.xml');
 assert.ok(sitemap.body.includes('<urlset')&&!sitemap.body.includes(site+'/search/'),'invalid sitemap');
 const manifest=await get('/_build.json');
 const info=JSON.parse(manifest.body);
 assert.equal(info.site,site,'build manifest points to another origin');
 if(expected){
  assert.equal(info.commit,expected,'Cloudflare has not deployed the expected main commit');
 }else if(!/^[a-f0-9]{40}$/.test(info.commit)){
  console.warn('WARN: deployed commit not known; code version parity not proven');
 }
 console.log('PASS: live routes, illustrated book-cover MIME, mobile CSS, sitemap and deployed revision '+info.commit);
}
(async()=>{
 for(let i=0;i<=retries;i++){
  try{await verify();return}
  catch(error){
   if(i===retries){console.error('FAIL: '+error.message);process.exitCode=1;return}
   console.warn('Retry '+(i+1)+'/'+retries+': '+error.message);
   await delay(5000);
  }
 }
})().catch(error=>{console.error(error);process.exitCode=1});
