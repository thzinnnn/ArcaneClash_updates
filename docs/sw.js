const CACHE='arcana-web-classbound-v090';
const ASSETS=['./','./index.html','./play-072.html','./styles.css','./modes.css','./ui-fixes.css','./desktop.css','./app.min.js','./party.min.js','./inspector.min.js','./web.min.js','./strategy-pack.js','./strategy-pack.css','./account-online.js','./account-online.css','./evolution-pack.js','./evolution-pack.css','./lobby.js','./lobby.css','./vendor/peerjs.min.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
