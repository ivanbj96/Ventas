// ========================================
// 🔄 NOTIFICACIONES DE SINCRONIZACIÓN INSTANTÁNEA
// ========================================

class InstantSyncNotifications {
    constructor() {
        this.isVisible = false;
        this.syncCount = 0;
        this.lastSyncTime = 0;
        this.createNotificationContainer();
    }

    createNotificationContainer() {
        // Crear contenedor de notificaciones si no existe
        if (!document.getElementById('syncNotifications')) {
            const container = document.createElement('div');
            container.id = 'syncNotifications';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; pointer-events: none;';
            document.body.appendChild(container);
        }
    }

    showSyncNotification(type = 'sending') {
        const now = Date.now();
        
        // Evitar spam de notificaciones
        if (now - this.lastSyncTime < 1000) return;
        this.lastSyncTime = now;
        
        this.syncCount++;
        
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        
        const messages = {
            sending: '📤 Enviando datos...',
            receiving: '📥 Recibiendo datos...',
            success: '✅ Sincronizado',
            error: '❌ Error de sync'
        };
        
        const colors = {
            sending: '#0d6efd',
            receiving: '#198754',
            success: '#28a745',
            error: '#dc3545'
        };
        
        const messageDiv = document.createElement('div');
        messageDiv.style.background = colors[type] || '#6c757d';
        messageDiv.style.color = 'white';
        messageDiv.style.padding = '8px 16px';
        messageDiv.style.borderRadius = '20px';
        messageDiv.style.fontSize = '14px';
        messageDiv.style.fontWeight = '500';
        messageDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        messageDiv.style.animation = 'slideInRight 0.3s ease-out';
        messageDiv.style.marginBottom = '8px';
        messageDiv.style.display = 'flex';
        messageDiv.style.alignItems = 'center';
        messageDiv.style.gap = '8px';
        
        const messageText = document.createElement('span');
        messageText.textContent = messages[type];
        
        const countText = document.createElement('small');
        countText.style.opacity = '0.8';
        countText.textContent = `#${this.syncCount}`;
        
        messageDiv.appendChild(messageText);
        messageDiv.appendChild(countText);
        notification.appendChild(messageDiv);
        
        // Agregar animación CSS si no existe
        if (!document.getElementById('syncAnimations')) {
            const style = document.createElement('style');
            style.id = 'syncAnimations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        const container = document.getElementById('syncNotifications');
        container.appendChild(notification);
        
        // Auto-remover después de 2 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 2000);
    }

    showConnectionStatus(connected) {
        const statusIndicator = document.getElementById('connectionStatus') || this.createConnectionIndicator();
        
        if (connected) {
            statusIndicator.textContent = '🟢 Conectado';
            statusIndicator.style.background = '#28a745';
        } else {
            statusIndicator.textContent = '🔴 Desconectado';
            statusIndicator.style.background = '#dc3545';
        }
        
        statusIndicator.style.display = 'block';
        
        // Ocultar después de 3 segundos si está conectado
        if (connected) {
            setTimeout(() => {
                statusIndicator.style.display = 'none';
            }, 3000);
        }
    }

    createConnectionIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'connectionStatus';
        indicator.style.position = 'fixed';
        indicator.style.top = '70px';
        indicator.style.right = '20px';
        indicator.style.zIndex = '10000';
        indicator.style.color = 'white';
        indicator.style.padding = '6px 12px';
        indicator.style.borderRadius = '15px';
        indicator.style.fontSize = '12px';
        indicator.style.fontWeight = '500';
        indicator.style.display = 'none';
        indicator.style.animation = 'slideInRight 0.3s ease-out';
        document.body.appendChild(indicator);
        return indicator;
    }

    showDataStats(data) {
        // DESACTIVADO - No mostrar notificación de datos
        return;
    }
}

// Crear instancia global
window.syncNotifications = new InstantSyncNotifications();

// Integrar con el sistema de sincronización existente
if (window.tillupWebSocketClient) {
    const originalSend = window.tillupWebSocketClient.send;
    window.tillupWebSocketClient.send = function(data) {
        if (data && data.action === 'full_sync_data') {
            window.syncNotifications.showSyncNotification('sending');
            window.syncNotifications.showDataStats(data.data);
        }
        return originalSend.call(this, data);
    };
    
    const originalHandleMessage = window.tillupWebSocketClient.handleMessage;
    window.tillupWebSocketClient.handleMessage = function(data) {
        if (data && (data.action === 'full_sync_data' || data.action === 'all_user_data_response')) {
            window.syncNotifications.showSyncNotification('receiving');
        }
        return originalHandleMessage.call(this, data);
    };
}

console.log('🔄 Sistema de notificaciones de sincronización cargado');