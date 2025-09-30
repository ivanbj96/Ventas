// Botón para forzar sincronización completa
function addForceSyncButton() {
    // Crear botón de sincronización forzada
    const forceSyncBtn = document.createElement('button');
    forceSyncBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Forzar Sync';
    forceSyncBtn.className = 'btn btn-warning btn-sm';
    forceSyncBtn.style.position = 'fixed';
    forceSyncBtn.style.bottom = '20px';
    forceSyncBtn.style.right = '20px';
    forceSyncBtn.style.zIndex = '9999';
    
    forceSyncBtn.onclick = function() {
        if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
            forceSyncBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Sincronizando...';
            forceSyncBtn.disabled = true;
            
            // Forzar sincronización completa
            window.tillupWebSocketClient.forceCompleteSync();
            
            setTimeout(() => {
                forceSyncBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Forzar Sync';
                forceSyncBtn.disabled = false;
            }, 3000);
        } else {
            alert('WebSocket no conectado');
        }
    };
    
    document.body.appendChild(forceSyncBtn);
}

// Agregar botón cuando se carga la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addForceSyncButton);
} else {
    addForceSyncButton();
}

// Función global para forzar sync desde consola
window.forceSyncNow = function() {
    if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
        window.tillupWebSocketClient.forceCompleteSync();
        console.log('🔄 Sincronización forzada iniciada');
    } else {
        console.log('❌ WebSocket no conectado');
    }
};

console.log('🔄 Force Sync Button loaded');