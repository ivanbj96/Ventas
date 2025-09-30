// ========================================
// 🔧 CORRECCIÓN DE LOOP INFINITO DE SINCRONIZACIÓN
// ========================================

// Desactivar sincronización continua automática
if (window.tillupWebSocketClient) {
    // Detener cualquier intervalo de sincronización continua
    window.tillupWebSocketClient.stopContinuousSync();
    
    console.log('🔧 Loop infinito corregido - sincronización continua desactivada');
}

// Función para sincronizar solo cuando sea necesario
window.syncOnlyWhenNeeded = function() {
    const lastSync = localStorage.getItem('last_manual_sync') || '0';
    const now = Date.now();
    
    if (now - lastSync > 5000) { // Solo cada 5 segundos mínimo
        localStorage.setItem('last_manual_sync', now.toString());
        
        if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
            window.tillupWebSocketClient.sendAllLocalData();
            console.log('🔧 Sincronización manual ejecutada');
        }
    } else {
        console.log('🔧 Sincronización muy reciente, omitiendo');
    }
};

console.log('🔧 Corrección de loop infinito cargada');