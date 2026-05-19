const CACHE = 'joshlucem-v1';
const URLS = [
  '/',
  '/index.html',
  '/projects.html',
  '/poetry.html',
  '/contact.html',
  '/legal.html',
  '/404.html',
  '/assets/styles.css',
  '/assets/app.js',
  '/assets/favicon.svg',
  '/assets/og-image.svg',
  '/lang/es.json',
  '/lang/en.json',
  '/lang/pt.json',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, copy));
        }
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('/404.html');
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
