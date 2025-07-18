const CACHE_NAME = 'tillup-cache-v1.1.5';
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
  './icons/descarga.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.5.28/dist/jspdf.plugin.autotable.min.js'
];

// === Instalación: precachear archivos y activar inmediatamente ===
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
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

// === Fetch: Network first para assets estáticos, sin recargar ni alertar ===
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Solo interceptar archivos declarados en ASSETS
  const isAsset = ASSETS.some(asset => {
    // Soporta rutas absolutas y relativas
    return url.href === asset || url.pathname.endsWith(asset.replace('./', '/'));
  });
  if (isAsset) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Clonar la respuesta antes de usarla
          const responseClone = networkResponse.clone();
          // Solo poner en caché si la respuesta es válida
          if (networkResponse && networkResponse.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si falla la red, usa el caché
          return caches.match(event.request);
        })
    );
  }
  // Si no es asset, no interceptar (deja pasar: datos dinámicos, API, etc.)
});