// ══════════════════════════════════════════════
// MAPRI Food Service — Service Worker
// Permite usar la app completamente offline
// después de la primera carga con internet
// ══════════════════════════════════════════════

const CACHE_NAME  = 'mapri-app-v3.2';
const CACHE_URLS  = [
  './',
  './mapri_app_vendedores.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

// Instalar: guarda todos los archivos en caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activar: borra cachés viejas de versiones anteriores
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: sirve desde caché si está disponible; si no, va a red
// Las llamadas a Google Sheets (WEBAPP_URL) siempre van a red
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Peticiones a Google Script — siempre a la red, nunca cachear
  if (url.includes('script.google.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // Todo lo demás: caché primero, red como respaldo
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Solo cachear respuestas válidas
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        return response;
      });
    }).catch(() => caches.match('./mapri_app_vendedores.html'))
  );
});
