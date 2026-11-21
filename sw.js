const CACHE='construction-vocab-v24';
const ASSETS=[
  './',
  './index.html',
  './src/styles.css',
  './src/visual-sequences.css',
  './src/quiz.css',
  './src/progress.css',
  './src/ux.css',
  './src/dark.css',
  './src/onboarding.css',
  './src/app.js',
  './src/ui-enhancements.js',
  './src/onboarding.js',
  './src/vocab-inbox.js',
  './src/learning-state.js',
  './src/progress-backup.js',
  './src/active-session.js',
  './src/practice-engine.js',
  './src/drawing-challenges.js',
  './src/visuals.js',
  './src/visuals-extra.js',
  './src/visuals-chat.js',
  './src/visuals-loading.js',
  './src/visuals-all.js',
  './src/visual-sequences.js',
  './src/register-sw.js',
  './data/terms.json',
  './data/terms-expansion.json',
  './data/fill-examples.json',
  './data/focus-terms.json',
  './data/term-meta.json',
  './data/estimator-challenges.json',
  './data/categories.json',
  './src/public-mode.css',
  './src/public-mode.js',
  './src/learner-profile.js',
  './src/term-search.js',
  './src/learning-quality.js',
  './term.html',
  './src/term-page.js',
  './src/term-page.css',
  './data/learning-packs.json',
  './manifest.webmanifest',
  './assets/app-icon.svg',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
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
  // A public term URL carries ?term=<id>, but the precached HTML has no query.
  // Match only the same path with its search ignored; never fall back to the
  // home page for a cached term page.
  const cached=(await caches.match(request))||
    (request.mode==='navigate'?await caches.match(request,{ignoreSearch:true}):null);
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
