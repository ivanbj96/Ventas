// ========================================
// 🔄 SINCRONIZACIÓN AUTOMÁTICA SIMPLE
// ========================================
// Versión minimalista que realmente funciona

class SimpleAutoSync {
    constructor() {
        this.enabled = false;
        this.lastSync = 0;
        this.syncDelay = 3000; // 3 segundos después de un cambio
        this.syncTimer = null;
    }

    enable() {
        this.enabled = true;
        this.interceptLocalStorage();
        console.log('🔄 SimpleAutoSync habilitado');
    }

    disable() {
        this.enabled = false;
        console.log('🔄 SimpleAutoSync deshabilitado');
    }

    interceptLocalStorage() {
        if (localStorage._simpleAutoSyncIntercepted) return;

        const originalSetItem = localStorage.setItem;
        localStorage.setItem = (key, value) => {
            originalSetItem.call(localStorage, key, value);
            
            // Solo sincronizar datos relevantes
            const relevantKeys = ['products', 'clients', 'sales', 'debts', 'chickenSales'];
            if (relevantKeys.includes(key) && this.enabled) {
                this.scheduleSync(`Cambio en ${key}`);
            }
        };
        
        localStorage._simpleAutoSyncIntercepted = true;
    }

    scheduleSync(reason) {
        // Cancelar sync anterior si existe
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
        }

        // Programar nueva sync
        this.syncTimer = setTimeout(() => {
            this.performSync(reason);
        }, this.syncDelay);

        console.log(`🔄 Sync programada: ${reason}`);
    }

    performSync(reason) {
        if (!window.tillupWebSocketClient || !window.tillupWebSocketClient.isConnected) {
            console.log('🔄 No se puede sincronizar: WebSocket desconectado');
            return;
        }

        // Usar la función existente de sincronización
        if (window.forceSyncAll && typeof window.forceSyncAll === 'function') {
            console.log(`🔄 Sincronizando automáticamente: ${reason}`);
            window.forceSyncAll();
            this.lastSync = Date.now();
        }
    }

    getStatus() {
        return {
            enabled: this.enabled,
            lastSync: this.lastSync,
            connected: window.tillupWebSocketClient ? window.tillupWebSocketClient.isConnected : false
        };
    }
}

// Crear instancia global
window.simpleAutoSync = new SimpleAutoSync();

// Auto-habilitar si hay usuario configurado
setTimeout(() => {
    const savedUser = localStorage.getItem('tillup_sync_user');
    if (savedUser && window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
        window.simpleAutoSync.enable();
        console.log('🔄 SimpleAutoSync auto-habilitado para usuario:', savedUser);
    }
}, 5000);

console.log('🔄 SimpleAutoSync cargado');