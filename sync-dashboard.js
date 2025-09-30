// ========================================
// 📊 DASHBOARD DE SINCRONIZACIÓN
// ========================================
// Dashboard para monitorear el estado de sincronización

window.openSyncDashboard = function() {
    const status = window.tillupWebSocketClient ? window.tillupWebSocketClient.getStatus() : {};
    
    const html = `
        <div class="sync-dashboard">
            <div class="dashboard-header">
                <h5><i class="bi bi-speedometer2"></i> Dashboard de Sincronización</h5>
            </div>
            <div class="dashboard-content">
                <div class="status-grid">
                    <div class="status-card">
                        <div class="status-icon ${status.connected ? 'connected' : 'disconnected'}">
                            <i class="bi bi-${status.connected ? 'wifi' : 'wifi-off'}"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-title">Conexión</div>
                            <div class="status-value">${status.connected ? 'Conectado' : 'Desconectado'}</div>
                        </div>
                    </div>
                    
                    <div class="status-card">
                        <div class="status-icon">
                            <i class="bi bi-person"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-title">Usuario</div>
                            <div class="status-value">${status.userId || 'No configurado'}</div>
                        </div>
                    </div>
                    
                    <div class="status-card">
                        <div class="status-icon">
                            <i class="bi bi-clock"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-title">Última Sync</div>
                            <div class="status-value">${status.lastSync ? new Date(status.lastSync).toLocaleTimeString() : 'Nunca'}</div>
                        </div>
                    </div>
                    
                    <div class="status-card">
                        <div class="status-icon">
                            <i class="bi bi-list-ol"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-title">Cola de Mensajes</div>
                            <div class="status-value">${status.queuedMessages || 0}</div>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-actions mt-3">
                    <button class="btn btn-primary btn-sm" onclick="forceSyncAll()">
                        <i class="bi bi-arrow-repeat"></i> Forzar Sync
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="testBidirectionalSync()">
                        <i class="bi bi-arrow-left-right"></i> Probar Sync
                    </button>
                </div>
            </div>
        </div>
    `;
    
    Swal.fire({
        title: 'Dashboard de Sincronización',
        html: html,
        width: 600,
        showConfirmButton: false,
        showCloseButton: true,
        customClass: {
            popup: 'sync-dashboard-modal'
        }
    });
};

console.log('📊 Sync Dashboard loaded');