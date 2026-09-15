const CACHE='construction-vocab-v9';
const ASSETS=[
  './',
  './index.html',
  './src/styles.css',
  './src/quiz.css',
  './src/progress.css',
  './src/app.js',
  './src/learning-state.js',
  './src/practice-engine.js',
  './src/drawing-challenges.js',
  './src/visuals.js',
  './src/visuals-extra.js',
  './src/visuals-all.js',
  './src/register-sw.js',
  './data/terms.json',
  './data/terms-expansion.json',
  './data/focus-terms.json',
  './data/categories.json',
  './manifest.webmanifest',
  './assets/app-icon.svg'
];

function shouldUseNetworkFirst(request,url){
  if(request.mode==='navigate')return true;
  return ['.html','.js','.css','.json','.webmanifest'].some(ext=>url.pathname.endsWith(ext));
}

async function putInCache(request,response){
  if(!response?.ok)return;
  const cache=await caches.open(CACHE);
  await cache.put(request,response.clone());
}

async function networkFirst(request){
  const cached=await caches.match(request);
  try{
    const response=await fetch(request);
    if(response.ok){
      await putInCache(request,response);
      return response;
    }
    if(cached)return cached;
    return response;
  }catch{
    if(cached)return cached;
    if(request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();
    return Response.error();
  }
}

async function cacheFirst(request){
  const cached=await caches.match(request);
  if(cached)return cached;
  try{
    const response=await fetch(request);
    if(response.ok)await putInCache(request,response);
    return response;
  }catch{
    return request.mode==='navigate'?(await caches.match('./index.html'))||Response.error():Response.error();
  }
}

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(shouldUseNetworkFirst(event.request,url)?networkFirst(event.request):cacheFirst(event.request));
});
