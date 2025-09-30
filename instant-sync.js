// ========================================
// 🔄 SINCRONIZACIÓN INSTANTÁNEA EN TIEMPO REAL
// ========================================

// Interceptar todas las operaciones de localStorage para sincronizar automáticamente
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    try {
        originalSetItem.call(this, key, value);
        
        // Sincronizar automáticamente si es un dato importante
        if (['products', 'clients', 'sales', 'debts', 'chickenSales'].includes(key)) {
            // Debounce para evitar múltiples sincronizaciones rápidas
            if (window.syncDebounceTimer) {
                clearTimeout(window.syncDebounceTimer);
            }
            
            // SINCRONIZACIÓN AUTOMÁTICA COMPLETAMENTE DESACTIVADA
            console.log('🚫 Sincronización automática por localStorage DESACTIVADA');
        }
    } catch (error) {
        console.error('⚠️ Error en localStorage.setItem:', error);
        // Intentar con el método original como fallback
        try {
            originalSetItem.call(this, key, value);
        } catch (fallbackError) {
            console.error('⚠️ Error crítico en localStorage:', fallbackError);
        }
    }
};

// Función para sincronizar cualquier cambio inmediatamente
window.syncInstantly = function(dataType, data) {
    if (window.syncManager && window.syncManager.isEnabled) {
        switch (dataType) {
            case 'product':
                window.syncManager.syncProduct(data);
                break;
            case 'client':
                window.syncManager.syncClient(data);
                break;
            case 'sale':
                window.syncManager.syncSale(data);
                break;
            case 'chicken_sale':
                window.syncManager.syncChickenSale(data);
                break;
            case 'debt':
                window.syncManager.syncDebt(data);
                break;
        }
    }
};

// Observador de cambios en localStorage
window.addEventListener('storage', function(e) {
    if (['products', 'clients', 'sales', 'debts', 'chickenSales'].includes(e.key)) {
        // Actualizar UI inmediatamente cuando cambie localStorage
        setTimeout(() => {
            if (window.tillupWebSocketClient) {
                window.tillupWebSocketClient.forceUIUpdate();
            }
        }, 50);
    }
});

console.log('🔄 Sistema de sincronización instantánea cargado');