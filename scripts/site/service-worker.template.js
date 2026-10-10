// LUCAS LAB offline reading. scripts/site/pwa.cjs fills the build id, base path and precache list in at build time.
// Scope: reading pages, static assets and saved books. Games, audio and anything under /games/ bypass this worker entirely.
const BUILD='__BUILD_ID__';
const BASE='__BASE__';
const PRECACHE=__PRECACHE__;
const SHELL_CACHE='lucas-lab-shell-'+BUILD; // replaced on every deploy
const BOOKS_CACHE='lucas-lab-books';        // written only by "離線保存"; survives deploys so saved books stay readable
const RECENT_KEY=self.location.origin+BASE+'__recent-chapters__';
const RECENT_LIMIT=30;
const SEARCH_INDEX=BASE+'search-index.json';
const OFFLINE_PAGE=BASE+'offline/';
const CHAPTER=/\/stories\/[^/]+\/chapters\/[^/]+\/$/;
let recentQueue=Promise.resolve();

// Installation waits: a new version is activated only after the reader accepts the update prompt, never mid-chapter.
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(PRECACHE)));
});

self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('lucas-lab-shell-')&&key!==SHELL_CACHE)await caches.delete(key);
  await self.clients.claim();
 })());
});

self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(!url.pathname.startsWith(BASE)||url.pathname.startsWith(BASE+'games/'))return;
 // Fingerprinted files never change, so the cached copy is authoritative.
 if(url.pathname.startsWith(BASE+'static/')){event.respondWith(cacheFirst(request));return}
 // Unhashed assets and images: answer from cache at once and refresh in the background.
 if(url.pathname.startsWith(BASE+'assets/')){event.respondWith(staleWhileRevalidate(request));return}
 if(url.pathname===SEARCH_INDEX){event.respondWith(networkFirst(request));return}
 if(request.mode==='navigate')event.respondWith(navigate(request,url));
});

async function cacheFirst(request){
 const cache=await caches.open(SHELL_CACHE),cached=await cache.match(request);
 if(cached)return cached;
 const response=await fetch(request);
 if(response.ok)cache.put(request,response.clone());
 return response;
}

async function staleWhileRevalidate(request){
 const cache=await caches.open(SHELL_CACHE),cached=await cache.match(request);
 const fresh=fetch(request).then(response=>{if(response.ok)cache.put(request,response.clone());return response}).catch(()=>cached);
 return cached||fresh;
}

async function networkFirst(request){
 const cache=await caches.open(SHELL_CACHE);
 try{
  const response=await fetch(request);
  if(response.ok)cache.put(request,response.clone());
  return response;
 }catch{
  return (await cache.match(request))||Response.error();
 }
}

// Pages: prefer the network so readers see new chapters; fall back to any copy kept on this device, then to the offline page.
// Responses for URLs with a query string are never kept.
async function navigate(request,url){
 try{
  const response=await fetch(request);
  if(response.ok&&!url.search){
   const cache=await caches.open(SHELL_CACHE);
   cache.put(request,response.clone());
   if(CHAPTER.test(url.pathname))remember(url.pathname);
  }
  return response;
 }catch{
  return (await caches.match(request))||(await caches.match(self.location.origin+OFFLINE_PAGE))||Response.error();
 }
}

// Keeps the most recently read chapters (RECENT_LIMIT) in the shell cache and drops the oldest beyond that.
function remember(path){
 recentQueue=recentQueue.then(async()=>{
  const cache=await caches.open(SHELL_CACHE),stored=await cache.match(RECENT_KEY);
  const list=stored?await stored.json().catch(()=>[]):[];
  const next=list.filter(item=>item!==path);
  next.push(path);
  for(const old of next.splice(0,Math.max(0,next.length-RECENT_LIMIT)))await cache.delete(self.location.origin+old);
  await cache.put(RECENT_KEY,new Response(JSON.stringify(next),{headers:{'Content-Type':'application/json'}}));
 }).catch(()=>{});
 return recentQueue;
}
