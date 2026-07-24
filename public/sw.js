var CACHE = 'livecctv-v1';
var PRECACHE = [
  '/Live-CCTV/',
  '/Live-CCTV/cameras_thumb.json',
  '/Live-CCTV/manifest.json',
  '/Live-CCTV/icon-192.svg',
  '/Live-CCTV/icon-512.svg'
];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(PRECACHE); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(function(n) { return n !== CACHE; }).map(function(n) { return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  if (url.pathname.endsWith('.m3u8') || url.pathname.endsWith('.ts')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response('', { status: 404, statusText: 'Stream unavailable' });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(resp) {
        if (resp.ok && e.request.method === 'GET') {
          var clone = resp.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return resp;
      });
    }).catch(function() {
      if (e.request.destination === 'document') {
        return caches.match('/Live-CCTV/');
      }
    })
  );
});
