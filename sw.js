const CACHE_NAME = 'tillup-cache-v1.1.0';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './utils.js',
  './pdf-generator.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.5.28/dist/jspdf.plugin.autotable.min.js'
];

// === Instalación: precachear archivos ===
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Precaching...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// === Activación: limpiar cachés viejos y notificar actualización ===
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] Eliminando cache viejo:', k);
        return caches.delete(k);
      })
    )).then(() => {
      console.log('[SW] Cache actualizado a:', CACHE_NAME);
      // Notificar a todos los clientes sobre la actualización
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            cacheName: CACHE_NAME
          });
        });
      });
    })
  );
  self.clients.claim();
});

// === Fetch: Network first para datos dinámicos, Cache first para assets ===
self.addEventListener('fetch', event => {
  const { request } = event;

  // Evitar cachear llamadas POST
  if (request.method !== 'GET') return;

  // Estrategia Network First para archivos principales (para obtener actualizaciones)
  if (request.url.includes('app.js') || request.url.includes('style.css') || request.url.includes('utils.js')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cachear la nueva respuesta
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Si falla la red, usar cache
          return caches.match(request);
        })
    );
  } else {
    // Cache First para otros recursos
    event.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request)
          .then(response => {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(request, response.clone());
              return response;
            });
          })
          .catch(() => {
            // Respuesta alternativa para offline
            if (request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
    );
  }
});

// === Mensajes del Service Worker ===
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});