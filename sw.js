// The previous version of this site registered a caching service worker here.
// This one replaces it, clears its caches, unregisters itself and reloads open tabs.
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    await self.registration.unregister();
    var tabs = await self.clients.matchAll({ type: 'window' });
    tabs.forEach(function (tab) { tab.navigate(tab.url); });
  })());
});
