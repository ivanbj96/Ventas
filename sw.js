const CACHE_NAME = 'tillup-cache-v1.0.0';
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

// === Activación: limpiar cachés viejos ===
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// === Fetch: Cache first, luego red ===
self.addEventListener('fetch', event => {
  const { request } = event;

  // Evitar cachear llamadas POST
  if (request.method !== 'GET') return;

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
          // Respuesta alternativa para offline (opcional)
          if (request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});