const CACHE_NAME = 'tillup-cache-v1.3.0';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './utils.js',
  './pdf-generator.js',
  './manifest.json',
  './offline.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/android-icon-192x192.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.5.28/dist/jspdf.plugin.autotable.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css'
];

// === Sistema de Actualización Automática ===

// Variable para controlar el estado de actualización
let isUpdateAvailable = false;
let updateData = null;

// === Instalación: precachear archivos ===
self.addEventListener('install', event => {
  console.log('[SW] Instalando nueva versión:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Precaching archivos...');
      return cache.addAll(ASSETS);
    }).then(() => {
      console.log('[SW] Instalación completada');
      // Notificar a todos los clientes sobre la nueva instalación
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_INSTALLED',
            cacheName: CACHE_NAME,
            timestamp: Date.now()
          });
        });
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// === Activación: limpiar cachés viejos y notificar actualización ===
self.addEventListener('activate', event => {
  console.log('[SW] Activando nueva versión:', CACHE_NAME);
  
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Eliminando cache viejo:', k);
          return caches.delete(k);
        })
      );
    }).then(() => {
      console.log('[SW] Cache actualizado a:', CACHE_NAME);
      
      // Notificar a todos los clientes sobre la actualización
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            cacheName: CACHE_NAME,
            timestamp: Date.now(),
            requiresReload: true
          });
        });
      });
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// === Fetch: Estrategia mejorada para diferentes tipos de recursos ===
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Evitar cachear llamadas POST
  if (request.method !== 'GET') return;

  // Estrategia Network First para archivos principales (para obtener actualizaciones)
  if (request.url.includes('app.js') || request.url.includes('style.css') || request.url.includes('utils.js')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Verificar si hay cambios en el contenido
          return caches.open(CACHE_NAME).then(cache => {
            return cache.match(request).then(cachedResponse => {
              if (cachedResponse) {
                // Comparar contenido para detectar actualizaciones
                return Promise.all([
                  cachedResponse.text(),
                  response.clone().text()
                ]).then(([cachedText, newText]) => {
                  if (cachedText !== newText) {
                    console.log('[SW] Detectada actualización en:', request.url);
                    isUpdateAvailable = true;
                    updateData = {
                      url: request.url,
                      timestamp: Date.now()
                    };
                    
                    // Notificar al cliente sobre la actualización disponible
                    self.clients.matchAll().then(clients => {
                      clients.forEach(client => {
                        client.postMessage({
                          type: 'UPDATE_AVAILABLE',
                          data: updateData
                        });
                      });
                    });
                  }
                  
                  // Cachear la nueva respuesta
                  cache.put(request, response.clone());
                  return response;
                });
              } else {
                // Primera vez, solo cachear
                cache.put(request, response.clone());
                return response;
              }
            });
          });
        })
        .catch(() => {
          // Si falla la red, usar cache
          return caches.match(request);
        })
    );
  }
  // Estrategia Cache First para CDN y recursos estáticos
  else if (request.url.includes('cdn.jsdelivr.net') || request.url.includes('icons/')) {
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
            if (request.destination === 'image') {
              return caches.match('./icons/icon-192.png');
            }
          });
      })
    );
  }
  // Estrategia Stale While Revalidate para otros recursos
  else {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cached => {
          const fetchPromise = fetch(request).then(response => {
            cache.put(request, response.clone());
            return response;
          }).catch(() => {
            // Si falla la red, devolver cached si existe
            return cached;
          });
          
          return cached || fetchPromise;
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
  
  // Manejar sincronización de datos
  if (event.data && event.data.type === 'SYNC_DATA') {
    event.waitUntil(syncData(event.data.data));
  }
  
  // Manejar notificaciones push
  if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
    event.waitUntil(showPushNotification(event.data.notification));
  }
  
  // Verificar actualizaciones
  if (event.data && event.data.type === 'CHECK_FOR_UPDATES') {
    event.waitUntil(checkForUpdates());
  }
  
  // Aplicar actualización
  if (event.data && event.data.type === 'APPLY_UPDATE') {
    event.waitUntil(applyUpdate());
  }
});

// === Sincronización de datos en background ===
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(backgroundSync());
  }
  
  if (event.tag === 'update-check') {
    event.waitUntil(checkForUpdates());
  }
});

// === Manejo de notificaciones push ===
self.addEventListener('push', event => {
  if (event.data) {
    const notification = event.data.json();
    event.waitUntil(showPushNotification(notification));
  }
});

// === Función para verificar actualizaciones ===
async function checkForUpdates() {
  try {
    console.log('[SW] Verificando actualizaciones...');
    
    // Verificar archivos principales
    const criticalFiles = [
      './app.js',
      './style.css',
      './utils.js',
      './index.html'
    ];
    
    const updatePromises = criticalFiles.map(async (file) => {
      try {
        const response = await fetch(file, { cache: 'no-cache' });
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(file);
        
        if (cachedResponse) {
          const [cachedText, newText] = await Promise.all([
            cachedResponse.text(),
            response.clone().text()
          ]);
          
          if (cachedText !== newText) {
            console.log('[SW] Actualización detectada en:', file);
            return { file, hasUpdate: true };
          }
        }
        
        return { file, hasUpdate: false };
      } catch (error) {
        console.error('[SW] Error verificando:', file, error);
        return { file, hasUpdate: false, error: true };
      }
    });
    
    const results = await Promise.all(updatePromises);
    const updates = results.filter(r => r.hasUpdate);
    
    if (updates.length > 0) {
      console.log('[SW] Actualizaciones disponibles:', updates);
      
      // Notificar a todos los clientes
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATES_FOUND',
          updates: updates,
          timestamp: Date.now()
        });
      });
      
      return updates;
    } else {
      console.log('[SW] No hay actualizaciones disponibles');
      return [];
    }
  } catch (error) {
    console.error('[SW] Error verificando actualizaciones:', error);
    return [];
  }
}

// === Función para aplicar actualización ===
async function applyUpdate() {
  try {
    console.log('[SW] Aplicando actualización...');
    
    // Limpiar caché actual
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
    
    // Recargar archivos críticos
    const criticalFiles = [
      './app.js',
      './style.css',
      './utils.js',
      './index.html'
    ];
    
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(
      criticalFiles.map(file => 
        fetch(file, { cache: 'no-cache' })
          .then(response => cache.put(file, response))
      )
    );
    
    // Notificar a todos los clientes
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_APPLIED',
        timestamp: Date.now()
      });
    });
    
    console.log('[SW] Actualización aplicada exitosamente');
    return true;
  } catch (error) {
    console.error('[SW] Error aplicando actualización:', error);
    return false;
  }
}

// === Función para sincronizar datos ===
async function syncData(data) {
  try {
    // Aquí iría la lógica para sincronizar con un servidor
    console.log('[SW] Sincronizando datos:', data);
    
    // Notificar al cliente que la sincronización fue exitosa
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        success: true
      });
    });
  } catch (error) {
    console.error('[SW] Error en sincronización:', error);
    
    // Notificar al cliente que hubo un error
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_ERROR',
        error: error.message
      });
    });
  }
}

// === Función para sincronización en background ===
async function backgroundSync() {
  try {
    console.log('[SW] Sincronización en background iniciada');
    
    // Aquí iría la lógica para sincronizar datos pendientes
    const pendingData = await getPendingData();
    
    if (pendingData.length > 0) {
      await syncData(pendingData);
    }
    
    console.log('[SW] Sincronización en background completada');
  } catch (error) {
    console.error('[SW] Error en sincronización background:', error);
  }
}

// === Función para obtener datos pendientes ===
async function getPendingData() {
  // Esta función obtendría datos pendientes de sincronización
  // Por ahora retorna un array vacío
  return [];
}

// === Función para mostrar notificaciones push ===
async function showPushNotification(notification) {
  const options = {
    body: notification.body || 'Nueva notificación de TillUp',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: notification.tag || 'tillup-notification',
    data: notification.data || {},
    actions: notification.actions || [],
    requireInteraction: notification.requireInteraction || false,
    silent: notification.silent || false
  };

  if (notification.image) {
    options.image = notification.image;
  }

  if (notification.vibrate) {
    options.vibrate = notification.vibrate;
  }

  await self.registration.showNotification(notification.title || 'TillUp', options);
}

// === Manejo de clics en notificaciones ===
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action) {
    // Manejar acciones específicas de la notificación
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Clic en la notificación principal
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clientList => {
        if (clientList.length > 0) {
          // Si hay una ventana abierta, enfocarla
          return clientList[0].focus();
        } else {
          // Si no hay ventana abierta, abrir una nueva
          return self.clients.openWindow('./');
        }
      })
    );
  }
});

// === Función para manejar acciones de notificaciones ===
function handleNotificationAction(action, data) {
  switch (action) {
    case 'view_sales':
      self.clients.openWindow('./?view=sales');
      break;
    case 'view_balance':
      self.clients.openWindow('./?view=balance');
      break;
    case 'view_inventory':
      self.clients.openWindow('./?view=inventory');
      break;
    case 'apply_update':
      applyUpdate();
      break;
    default:
      console.log('[SW] Acción de notificación no manejada:', action);
  }
}

// === Función para limpiar caché antiguo ===
async function cleanOldCache() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => name !== CACHE_NAME);
  
  return Promise.all(
    oldCaches.map(name => {
      console.log('[SW] Eliminando cache antiguo:', name);
      return caches.delete(name);
    })
  );
}

// === Función para precachear recursos adicionales ===
async function precacheAdditionalResources() {
  const cache = await caches.open(CACHE_NAME);
  
  // Recursos adicionales que podrían necesitarse
  const additionalResources = [
    './offline.html',
    './error.html'
  ];
  
  return cache.addAll(additionalResources);
}

// === Manejo de errores global ===
self.addEventListener('error', event => {
  console.error('[SW] Error en Service Worker:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Promesa rechazada no manejada:', event.reason);
});

// === Registro de sincronización periódica ===
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-check') {
    event.waitUntil(checkForUpdates());
  }
});