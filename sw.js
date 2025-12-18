
const CACHE_NAME = 'avislog-v3';

// Minimal set of files needed to boot the app shell
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If found in cache, return it immediately
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise try network
      return fetch(event.request).then((networkResponse) => {
        // Cache successful responses for next time (dynamic caching)
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If network fails (offline) and not in cache
        
        // Handle navigation requests (relaunching the app)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
        
        // Return null/error for other assets
        return null;
      });
    })
  );
});
