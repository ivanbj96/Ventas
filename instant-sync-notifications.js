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
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
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
        messageDiv.style.cssText = `
            background: ${colors[type]};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
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
            statusIndicator.innerHTML = '🟢 Conectado';
            statusIndicator.style.background = '#28a745';
        } else {
            statusIndicator.innerHTML = '🔴 Desconectado';
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
        indicator.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 10000;
            color: white;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
            display: none;
            animation: slideInRight 0.3s ease-out;
        `;
        document.body.appendChild(indicator);
        return indicator;
    }

    showDataStats(data) {
        const stats = document.createElement('div');
        stats.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 10000;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            font-family: monospace;
            animation: slideInRight 0.3s ease-out;
        `;
        
        const totalItems = (data.products?.length || 0) + 
                          (data.clients?.length || 0) + 
                          (data.sales?.length || 0) + 
                          (data.debts?.length || 0) + 
                          (data.chickenSales?.length || 0);
        
        // Crear elementos de forma segura
        const title = document.createElement('div');
        title.style.cssText = 'font-weight: bold; margin-bottom: 4px;';
        title.textContent = '📊 Datos sincronizados:';
        
        const productLine = document.createElement('div');
        productLine.textContent = `📦 ${data.products?.length || 0} productos`;
        
        const clientLine = document.createElement('div');
        clientLine.textContent = `👥 ${data.clients?.length || 0} clientes`;
        
        const salesLine = document.createElement('div');
        salesLine.textContent = `🛒 ${data.sales?.length || 0} ventas`;
        
        const debtsLine = document.createElement('div');
        debtsLine.textContent = `💰 ${data.debts?.length || 0} deudas`;
        
        const chickenLine = document.createElement('div');
        chickenLine.textContent = `🐔 ${data.chickenSales?.length || 0} pollos`;
        
        const totalLine = document.createElement('div');
        totalLine.style.cssText = 'border-top: 1px solid #666; margin-top: 4px; padding-top: 4px;';
        const totalStrong = document.createElement('strong');
        totalStrong.textContent = `Total: ${totalItems} elementos`;
        totalLine.appendChild(totalStrong);
        
        stats.appendChild(title);
        stats.appendChild(productLine);
        stats.appendChild(clientLine);
        stats.appendChild(salesLine);
        stats.appendChild(debtsLine);
        stats.appendChild(chickenLine);
        stats.appendChild(totalLine);
        
        document.body.appendChild(stats);
        
        setTimeout(() => {
            if (stats.parentNode) {
                stats.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (stats.parentNode) {
                        stats.parentNode.removeChild(stats);
                    }
                }, 300);
            }
        }, 4000);
    }
}

// Crear instancia global
window.syncNotifications = new InstantSyncNotifications();

// Integrar con el sistema de sincronización existente
if (window.tillupWebSocketClient) {
    const originalSend = window.tillupWebSocketClient.send;
    window.tillupWebSocketClient.send = function(data) {
        if (data.action === 'full_sync_data') {
            window.syncNotifications.showSyncNotification('sending');
            window.syncNotifications.showDataStats(data.data);
        }
        return originalSend.call(this, data);
    };
    
    const originalHandleMessage = window.tillupWebSocketClient.handleMessage;
    window.tillupWebSocketClient.handleMessage = function(data) {
        if (data.action === 'full_sync_data' || data.action === 'all_user_data_response') {
            window.syncNotifications.showSyncNotification('receiving');
        }
        return originalHandleMessage.call(this, data);
    };
}

console.log('🔄 Sistema de notificaciones de sincronización cargado');