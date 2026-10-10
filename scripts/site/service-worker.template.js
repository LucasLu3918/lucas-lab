// LUCAS LAB offline reading cache. scripts/site/pwa.cjs fills the build id and base path in at build time.
// Scope: reading pages and static assets only. Game bundles, audio and anything under /games/ bypass this worker entirely.
const CACHE='lucas-lab-__BUILD_ID__';
const BASE='__BASE__';
const SEARCH_INDEX=BASE+'search-index.json';

self.addEventListener('install',()=>self.skipWaiting());

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('lucas-lab-')&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
 })());
});

self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(url.pathname.startsWith(BASE+'games/'))return;
 const isStatic=url.pathname.startsWith(BASE+'static/')||url.pathname.startsWith(BASE+'assets/');
 if(isStatic){
  // Fingerprinted and image assets: serve the cached copy at once, refresh it in the background.
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE),cached=await cache.match(request);
   const fresh=fetch(request).then(response=>{if(response.ok)cache.put(request,response.clone());return response}).catch(()=>cached);
   return cached||fresh;
  })());
  return;
 }
 if(request.mode==='navigate'||url.pathname===SEARCH_INDEX){
  // Pages and the search index: prefer the network so readers see new chapters, fall back to what they read before.
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   try{
    const response=await fetch(request);
    if(response.ok)cache.put(request,response.clone());
    return response;
   }catch{
    return (await cache.match(request))||Response.error();
   }
  })());
 }
});
