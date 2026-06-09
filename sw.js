const CACHE_NAME = 'ingreso-bodegas-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Al instalar: guarda todos los archivos en caché
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Al activar: limpia cachés viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: siempre sirve desde caché si está disponible
// Las peticiones a Firebase van directo a la red (no se cachean)
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Deja pasar las peticiones a Firebase directo a la red
  if (url.includes('firebase') || url.includes('googleapis')) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Para el resto: caché primero, si no está va a red
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    }).catch(() => caches.match('./index.html'))
  );
});
