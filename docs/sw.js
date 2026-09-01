const CACHE='arcana-web-release-v130-1';
const ASSETS=['./','./index.html','./play-072.html','./mfa-connect.html','./mfa-connect.js','./styles.css','./modes.css','./ui-fixes.css','./desktop.css','./app.min.js','./armory-expansion.js','./card-remake-092.js','./secret-cards.js','./rarity-signals.js','./rarity-signals.css','./party.min.js','./inspector.min.js','./web.min.js','./strategy-pack.js','./strategy-pack.css','./account-online.js','./account-online.css','./account-mfa.css','./account-admin.css','./arcane-market.js','./arcane-market.css','./evolution-pack.js','./evolution-pack.css','./lobby.js','./lobby.css','./world-map-093.css','./combat-reborn-094.js','./combat-reborn-094.css','./arcana-100.js','./arcana-100.css','./admin-live.js','./admin-live.css','./social-100.js','./social-100.css','./ascension-110.js','./ascension-110.css','./war-realms-120.js','./war-realms-120.css','./war-realms-map-121.webp','./arcana-reforged-130.js','./arcana-reforged-130.css','./vendor/peerjs.min.js','./vendor/qrcode-generator.mjs'];
const ASSET_PATHS=new Set(ASSETS.map(asset=>new URL(asset,self.registration.scope).pathname));
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('arcana-web-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const request=e.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!ASSET_PATHS.has(url.pathname))return;
  const cacheKey=new Request(`${url.origin}${url.pathname}`);
  e.respondWith(fetch(request).then(response=>{
    if(!response.ok)return response;
    const copy=response.clone();
    return caches.open(CACHE).then(cache=>cache.put(cacheKey,copy)).then(()=>response);
  }).catch(()=>caches.match(cacheKey).then(response=>response||(request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
