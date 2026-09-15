const CACHE='construction-vocab-v4';
const ASSETS=[
  './',
  './index.html',
  './src/styles.css',
  './src/quiz.css',
  './src/app.js',
  './src/visuals.js',
  './src/visuals-extra.js',
  './src/visuals-all.js',
  './src/register-sw.js',
  './data/terms.json',
  './data/terms-expansion.json',
  './data/categories.json',
  './manifest.webmanifest',
  './assets/app-icon.svg'
];

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
  if(new URL(event.request.url).origin!==self.location.origin)return;

  event.respondWith(
    caches.match(event.request).then(cached=>{
      if(cached)return cached;
      return fetch(event.request).then(response=>{
        if(response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      }).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):Response.error());
    })
  );
});
