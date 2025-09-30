// DETENER LOOP INFINITO INMEDIATAMENTE
console.log('🛑 DETENIENDO LOOP INFINITO...');

// Detener todos los intervalos
if (window.tillupWebSocketClient) {
    window.tillupWebSocketClient.stopContinuousSync();
    window.tillupWebSocketClient.stopAutoSync();
}

// Limpiar todos los timers
if (window.syncDebounceTimer) {
    clearTimeout(window.syncDebounceTimer);
    window.syncDebounceTimer = null;
}

console.log('✅ Loop infinito detenido');