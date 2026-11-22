// ShiaSphere Service Worker
// Provides offline-first caching for the app shell and static assets.

const CACHE_NAME = 'shiasphere-cache-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/golden-theme.css',
  './css/silver-theme.css',
  './css/arabic.css',
  './css/responsive.css',
  './js/app.js',
  './js/navigation.js',
  './js/settings.js',
  './js/search.js',
  './js/bookmarks.js',
  './js/tasbeeh.js',
  './js/qibla.js',
  './js/prayer-times.js',
  './js/calendar.js',
  './js/qaza.js',
  './js/hijri.js',
  './js/content-loader.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {
      // If a file is missing during development, don't block install.
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never cache geolocation, network-dependent APIs, or cross-origin calls differently handled.
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Cache data JSON files and same-origin assets as they're fetched.
          if (response && response.status === 200 && request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: for navigation requests, serve the app shell.
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
