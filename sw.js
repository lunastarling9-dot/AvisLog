
const CACHE_NAME = 'avislog-v2';

// 必须缓存的核心基础文件
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './constants.ts',
  './db.ts',
  './geminiService.ts',
  './components/Dashboard.tsx',
  './components/SpeciesCatalog.tsx',
  './components/Observations.tsx',
  './components/RegionalStats.tsx',
  './components/AdminPanel.tsx'
];

// 外部库和样式
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Serif+SC:wght@700&display=swap',
  'https://esm.sh/react@^19.2.3',
  'https://esm.sh/react-dom@^19.2.3/',
  'https://esm.sh/@google/genai@^1.34.0',
  'https://esm.sh/recharts@^3.6.0',
  'https://esm.sh/lucide-react@^0.562.0'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core and external assets');
      // 使用 Promise.allSettled 或 分开 add 确保个别失败不影响整体
      const addCore = cache.addAll(CORE_ASSETS);
      const addExternal = cache.addAll(EXTERNAL_ASSETS).catch(e => console.warn('Some external assets failed to cache', e));
      return Promise.all([addCore, addExternal]);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // 忽略非 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // 只缓存成功的、同源的或指定的 CDN 请求
          if (
            networkResponse && 
            networkResponse.status === 200 && 
            (networkResponse.type === 'basic' || event.request.url.includes('esm.sh') || event.request.url.includes('googleapis'))
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // 离线且未命中缓存时的回退逻辑
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return null;
        });
    })
  );
});
