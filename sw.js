// Service Worker para ChartKids - Permite funcionar offline
const CACHE_NAME = 'chartkids-v29';
const urlsToCache = [
  '/chartkids/',
  '/chartkids/index.html',
  '/chartkids/terms.html',
  '/chartkids/privacy.html',
  '/chartkids/support.html',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Instalar - cachear archivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activar - limpiar caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - servir desde cache, actualizar en background
self.addEventListener('fetch', event => {
  // No cachear llamadas a la API
  if (event.request.url.includes('workers.dev')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retornar cache si existe
        if (response) {
          // Actualizar cache en background
          fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {});
          return response;
        }

        // Si no está en cache, buscar en red
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Guardar en cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
  );
});
