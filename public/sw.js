// Vendeloo SW — cacheo básico para instalabilidad y arranque offline.
const CACHE = 'vendeloo-v1';
const SHELL = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  // Network-first para navegación; cache fallback si no hay red.
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match('/'))); 
    return;
  }
  e.respondWith(
    caches.match(request).then((hit) => hit || fetch(request)),
  );
});
