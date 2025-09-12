// Desregistrar Service Worker automáticamente
(async function() {
    try {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
                console.log('🗑️ Service Worker desregistrado');
            }
        }
        
        // Limpiar caches
        const cacheNames = await caches.keys();
        for (let cacheName of cacheNames) {
            await caches.delete(cacheName);
            console.log('🗑️ Cache eliminado:', cacheName);
        }
    } catch (error) {
        console.log('Error limpiando SW/cache:', error);
    }
})();

// Función manual para limpiar
window.clearCacheAndReload = async function() {
    location.reload(true);
};