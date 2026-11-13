const C='gp-men-v2',F=['./','index.html','style.css','app.js','sounds/preset.json','sounds/final.mp3','sounds/final-mais-30s.mp3','sounds/homem-1.mp3','sounds/homem-2.mp3','sounds/homem-3.mp3'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r}).catch(()=>caches.match(e.request)))});
