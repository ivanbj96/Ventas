/**
 * TillUp Real-Time Sync - Sistema de sincronización tipo WhatsApp
 * Sincronización instantánea entre dispositivos del mismo usuario
 */
class TillUpRealtimeSync {
    constructor() {
        this.wsUrl = TILLUP_SYNC_CONFIG.WEBSOCKET_URL;
        this.userId = this.getUserId();
        this.deviceId = this.getDeviceId();
        this.deviceName = this.getDeviceName();
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.messageQueue = [];
        this.syncInProgress = false;
        this.lastSyncTime = 0;
        this.syncDebounce = 500; // 500ms debounce
        
        this.init();
    }
    
    getUserId() {
        // Usar usuario fijo para pruebas
        return TILLUP_SYNC_CONFIG.FIXED_USER_ID;
    }
    
    getDeviceId() {
        let deviceId = localStorage.getItem('tillup_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tillup_device_id', deviceId);
        }
        return deviceId;
    }
    
    getDeviceName() {
        const platform = navigator.platform || 'Unknown';
        const userAgent = navigator.userAgent;
        let deviceName = 'TillUp Device';
        
        if (userAgent.includes('Mobile')) {
            deviceName = 'TillUp Mobile';
        } else if (userAgent.includes('Tablet')) {
            deviceName = 'TillUp Tablet';
        } else {
            deviceName = 'TillUp Desktop';
        }
        
        return deviceName + ' (' + platform + ')';
    }
    
    init() {
        this.connect();
        this.setupDataInterceptors();
        this.setupVisibilityHandler();
    }
    
    connect() {
        const url = `${this.wsUrl}?userId=${encodeURIComponent(this.userId)}&deviceId=${encodeURIComponent(this.deviceId)}&deviceName=${encodeURIComponent(this.deviceName)}`;
        console.log('🔄 Connecting to:', url);
        
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
            this.connected = true;
            this.reconnectAttempts = 0;
            console.log('✅ TillUp Sync connected:', this.userId);
            this.processMessageQueue();
            
            // Send initial sync request after connection
            setTimeout(() => {
                this.requestSync();
            }, 1000);
        };
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📥 Message received:', data.type);
                this.handleMessage(data);
            } catch (e) {
                console.log('📤 Raw message:', event.data);
            }
        };
        
        this.ws.onclose = (event) => {
            this.connected = false;
            console.log('❌ TillUp Sync disconnected:', event.code, event.reason);
            this.scheduleReconnect();
        };
        
        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
        };
    }
    
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            setTimeout(() => this.connect(), delay);
        }
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'data_sync':
                this.handleDataSync(data.payload);
                break;
            case 'action_sync':
                this.handleActionSync(data.payload);
                break;
            case 'sync_request':
            case 'request_sync':
                console.log('📥 Handling sync request from:', data.payload.requesterId);
                this.handleSyncRequest(data.payload);
                break;
            case 'device_connected':
                this.handleDeviceConnected(data.payload);
                break;
            default:
                console.log('Mensaje no manejado:', data);
        }
    }
    
    handleDataSync(payload) {
        if (payload.sourceDeviceId === this.deviceId) return;
        
        console.log('📥 Sincronizando datos desde:', payload.sourceDeviceId);
        console.log('📊 Datos recibidos:', payload.dataType, payload.data);
        
        // Aplicar cambios de datos
        if (payload.dataType && payload.data) {
            this.applyDataChanges(payload.dataType, payload.data, payload.operation);
        }
        
        this.showSyncIndicator('Datos recibidos!');
    }
    
    handleActionSync(payload) {
        if (payload.sourceDeviceId === this.deviceId) return;
        
        console.log('📥 Sincronizando acción:', payload.action);
        
        // Aplicar acción específica
        this.applyAction(payload.action, payload.data);
        this.showSyncIndicator();
    }
    
    handleSyncRequest(payload) {
        if (payload.requesterId === this.deviceId) return;
        
        console.log('📤 Enviando datos completos a:', payload.requesterId);
        this.sendFullDataSync();
    }
    
    handleDeviceConnected(payload) {
        console.log('📱 Dispositivo conectado:', payload.deviceName);
        this.showNotification(`${payload.deviceName} conectado`, 'info');
    }
    
    setupDataInterceptors() {
        // Interceptar funciones principales de la app
        this.interceptFunction('addProduct', 'product_added');
        this.interceptFunction('addClient', 'client_added');
        this.interceptFunction('finalizeSale', 'sale_completed');
        this.interceptFunction('processChickenSale', 'chicken_sale_added');
        this.interceptFunction('payDebt', 'debt_payment');
        this.interceptFunction('addDebt', 'debt_added');
        
        // Método manual de sincronización
        window.manualSync = () => {
            console.log('🔄 Sincronización manual iniciada');
            this.sendFullDataSync();
        };
        
        // Interceptar cambios en localStorage
        this.interceptStorage();
    }
    
    interceptFunction(funcName, actionType) {
        // Intentar interceptar múltiples veces
        const tryIntercept = () => {
            if (typeof window[funcName] === 'function') {
                const original = window[funcName];
                window[funcName] = async (...args) => {
                    console.log(`📝 Ejecutando ${funcName}`);
                    const result = await original.apply(this, args);
                    
                    // Sincronizar inmediatamente después
                    console.log(`🔄 Sincronizando después de ${funcName}`);
                    this.sendFullDataSync();
                    
                    return result;
                };
                console.log(`✅ Intercepted function: ${funcName}`);
                return true;
            }
            return false;
        };
        
        // Intentar ahora y luego cada segundo por 10 segundos
        if (!tryIntercept()) {
            let attempts = 0;
            const interval = setInterval(() => {
                if (tryIntercept() || attempts++ > 10) {
                    clearInterval(interval);
                }
            }, 1000);
        }
    }
    
    interceptStorage() {
        // Disable storage interception to prevent loops
        console.log('📝 Storage interceptor disabled to prevent sync loops');
    }
    
    syncData(dataType, data, operation = 'update') {
        if (!this.connected || this.syncInProgress) return;
        
        const now = Date.now();
        if (now - this.lastSyncTime < this.syncDebounce) return;
        
        this.lastSyncTime = now;
        
        const message = {
            type: 'data_sync',
            payload: {
                dataType,
                data,
                operation,
                sourceDeviceId: this.deviceId,
                timestamp: now
            }
        };
        
        this.sendMessage(message);
    }
    
    syncAction(action, data) {
        if (!this.connected) return;
        
        // Enviar acción
        const actionMessage = {
            type: 'action_sync',
            payload: {
                action,
                data,
                sourceDeviceId: this.deviceId,
                timestamp: Date.now()
            }
        };
        
        this.sendMessage(actionMessage);
        
        // Enviar datos completos después de la acción
        setTimeout(() => {
            this.sendFullDataSync();
        }, 100);
    }
    
    requestSync() {
        if (!this.connected) return;
        
        const message = {
            type: 'request_sync',
            payload: {
                requesterId: this.deviceId,
                timestamp: Date.now()
            }
        };
        
        this.sendMessage(message);
    }
    
    sendFullDataSync() {
        if (!this.connected) return;
        
        const allData = this.getAllAppData();
        console.log('📤 Enviando datos completos:', allData);
        
        const message = {
            type: 'data_sync',
            payload: {
                dataType: 'full_sync',
                data: allData,
                operation: 'full_update',
                sourceDeviceId: this.deviceId,
                timestamp: Date.now()
            }
        };
        
        this.sendMessage(message);
        this.showSyncIndicator('Enviando datos...');
    }
    
    sendMessage(message) {
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            this.messageQueue.push(message);
        }
    }
    
    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.connected) {
            const message = this.messageQueue.shift();
            this.ws.send(JSON.stringify(message));
        }
    }
    
    applyDataChanges(dataType, data, operation) {
        if (this.syncInProgress) return;
        
        this.syncInProgress = true;
        
        try {
            if (operation === 'full_update' && dataType === 'full_sync') {
                // Sincronización completa
                this.applyFullSync(data);
            } else {
                // Actualización específica
                this.updateLocalData(dataType, data);
            }
            
            // Actualizar UI
            this.refreshUI();
            
        } catch (error) {
            console.error('Error aplicando cambios:', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    applyAction(action, data) {
        console.log('Aplicando acción:', action, data);
        
        // Solicitar datos completos después de cualquier acción
        setTimeout(() => {
            this.requestSync();
            this.refreshUI();
        }, 500);
    }
    
    applyFullSync(allData) {
        const criticalKeys = ['products', 'clients', 'sales', 'debts', 'chickenSales', 'movements'];
        
        for (const key of criticalKeys) {
            if (allData[key]) {
                localStorage.setItem(key, JSON.stringify(allData[key]));
                if (window[key] !== undefined) {
                    window[key] = allData[key];
                }
                console.log(`✅ ${key}: ${allData[key].length} elementos`);
            }
        }
        
        // Forzar actualización inmediata y múltiple
        this.forceUIUpdate();
        
        // También con timeout para asegurar
        setTimeout(() => {
            this.forceUIUpdate();
        }, 10);
        
        setTimeout(() => {
            this.forceUIUpdate();
        }, 100);
    }
    
    updateLocalData(dataType, data) {
        localStorage.setItem(dataType, JSON.stringify(data));
        if (window[dataType] !== undefined) {
            window[dataType] = data;
        }
    }
    
    getAllAppData() {
        const data = {};
        const keys = ['products', 'clients', 'sales', 'debts', 'chickenSales', 'movements'];
        
        keys.forEach(key => {
            try {
                const stored = localStorage.getItem(key);
                data[key] = stored ? JSON.parse(stored) : [];
            } catch (e) {
                data[key] = window[key] || [];
            }
        });
        
        return data;
    }
    
    refreshUI() {
        const updateFunctions = [
            'renderInventory',
            'renderClients',
            'renderSalesProducts',
            'updateBalanceUI',
            'renderDebts',
            'updateChickenStats',
            'updateChickenSalesList',
            'renderBalanceGrid'
        ];
        
        updateFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                try {
                    console.log(`🔄 Ejecutando ${funcName}`);
                    window[funcName]();
                    console.log(`✅ ${funcName} completado`);
                } catch (e) {
                    console.log(`❌ Error actualizando ${funcName}:`, e);
                }
            } else {
                console.log(`⚠️ Función ${funcName} no disponible`);
            }
        });
    }
    
    forceUIUpdate() {
        console.log('🔄 Forzando actualización completa de UI');
        
        // Recargar datos desde localStorage
        const keys = ['products', 'clients', 'sales', 'debts', 'chickenSales', 'movements'];
        keys.forEach(key => {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    window[key] = JSON.parse(data);
                    console.log(`📦 ${key}: ${JSON.parse(data).length} elementos`);
                }
            } catch (e) {
                console.log(`❌ Error cargando ${key}:`, e);
            }
        });
        
        // Múltiples estrategias para forzar actualización inmediata
        const forceUpdate = () => {
            this.refreshUI();
            
            // Forzar re-renderizado de elementos específicos
            const inventoryList = document.getElementById('inventoryList');
            if (inventoryList && typeof window.renderInventory === 'function') {
                window.renderInventory();
            }
            
            const clientList = document.getElementById('clientList');
            if (clientList && typeof window.renderClients === 'function') {
                console.log('🔄 Ejecutando renderClients(), clientes actuales:', window.clients?.length || 0);
                window.renderClients();
                console.log('✅ renderClients() ejecutado');
                
                // Forzar actualización directa del DOM de clientes si no se actualizó
                setTimeout(() => {
                    const updatedList = document.getElementById('clientList');
                    if (updatedList && window.clients && window.clients.length > 0) {
                        console.log('🔄 Forzando actualización directa del DOM de clientes');
                        
                        // Limpiar contenido actual
                        updatedList.innerHTML = '';
                        
                        // Recrear elementos de clientes
                        window.clients.forEach(client => {
                            const clientElement = document.createElement('div');
                            clientElement.className = 'col-6 col-md-4 col-lg-3';
                            clientElement.innerHTML = `
                                <div class="client-card-treinta" style="border: 2px solid #17a2b8; position: relative;">
                                    <div class="badge bg-info position-absolute top-0 end-0 m-1">
                                        <i class="bi bi-arrow-repeat"></i>
                                    </div>
                                    <div class="client-avatar">${client.name.charAt(0).toUpperCase()}</div>
                                    <div class="client-name">🔄 ${client.name}</div>
                                    <div class="client-info">${client.phone || 'Sin teléfono'}</div>
                                    <div class="client-info">${client.address || 'Sin dirección'}</div>
                                    <div class="mt-2">
                                        <span class="badge ${client.debt > 0 ? 'bg-warning' : 'bg-success'}">
                                            ${client.debt > 0 ? `Deuda: $${client.debt.toFixed(2)}` : 'Sin deuda'}
                                        </span>
                                    </div>
                                </div>
                            `;
                            updatedList.appendChild(clientElement);
                        });
                        
                        console.log('✅ DOM de clientes actualizado directamente');
                    }
                }, 100);
            } else {
                console.log('❌ No se puede ejecutar renderClients:', {
                    clientListExists: !!clientList,
                    renderClientsExists: typeof window.renderClients === 'function'
                });
            }
            
            const salesGrid = document.getElementById('salesProductsGrid');
            if (salesGrid && typeof window.renderSalesProducts === 'function') {
                window.renderSalesProducts();
            }
        };
        
        // Ejecutar inmediatamente
        forceUpdate();
        
        // Usar requestAnimationFrame para el siguiente frame
        requestAnimationFrame(() => {
            forceUpdate();
            
            // Segundo frame para asegurar renderizado
            requestAnimationFrame(() => {
                forceUpdate();
                
                // Disparar evento personalizado
                document.dispatchEvent(new CustomEvent('dataUpdated'));
                
                // Forzar repaint del DOM con múltiples técnicas
                document.body.style.display = 'none';
                document.body.offsetHeight; // Trigger reflow
                document.body.style.display = '';
                
                // Forzar repaint de contenedores específicos
                const containers = ['inventoryList', 'clientList', 'salesProductsGrid'];
                containers.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.style.transform = 'translateZ(0)';
                        element.offsetHeight;
                        element.style.transform = '';
                    }
                });
                
                // Disparar resize para forzar recálculo
                window.dispatchEvent(new Event('resize'));
                
                // Scroll mínimo para activar repaint
                const currentScroll = window.scrollY;
                window.scrollTo(0, currentScroll + 1);
                window.scrollTo(0, currentScroll);
            });
        });
        
        // También usar setTimeout como fallback
        setTimeout(() => {
            forceUpdate();
        }, 50);
    }
    
    showSyncIndicator(message = 'Sincronizando...') {
        // Mostrar indicador visual de sincronización con datos
        const allData = this.getAllAppData();
        const dataInfo = `P:${allData.products?.length || 0} C:${allData.clients?.length || 0} V:${allData.sales?.length || 0}`;
        
        // Remover indicador anterior si existe
        const existingIndicator = document.querySelector('.sync-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        const indicator = document.createElement('div');
        indicator.className = 'sync-indicator';
        indicator.innerHTML = `<i class="bi bi-arrow-repeat"></i> ${message}<br><small>${dataInfo}</small>`;
        indicator.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 99999;
            animation: syncPulse 2s ease-in-out;
            line-height: 1.2;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
            border: 2px solid #fff;
            font-weight: bold;
            pointer-events: none;
        `;
        
        document.body.appendChild(indicator);
        
        // Forzar que el indicador sea visible
        indicator.offsetHeight;
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 6000);
    }
    
    showNotification(message, type = 'info') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                icon: type,
                title: message
            });
        } else {
            console.log(`🔔 ${message}`);
        }
    }
    
    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.connected) {
                // Solicitar sincronización cuando la app vuelve a primer plano
                setTimeout(() => {
                    this.requestSync();
                    this.forceUIUpdate();
                }, 500);
            }
        });
        
        // Detectar cuando la pestaña está activa y forzar actualizaciones
        document.addEventListener('focus', () => {
            if (this.connected) {
                this.forceUIUpdate();
            }
        });
        
        window.addEventListener('focus', () => {
            if (this.connected) {
                this.forceUIUpdate();
            }
        });
    }
    
    // Métodos públicos
    getStatus() {
        return {
            connected: this.connected,
            userId: this.userId,
            deviceId: this.deviceId,
            deviceName: this.deviceName,
            queueSize: this.messageQueue.length
        };
    }
    
    forceSync() {
        this.sendFullDataSync();
        this.requestSync();
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// CSS para animaciones
const syncStyles = document.createElement('style');
syncStyles.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(100%); }
        20% { opacity: 1; transform: translateX(0); }
        80% { opacity: 1; transform: translateX(0); }
        100% { opacity: 0; transform: translateX(100%); }
    }
    
    @keyframes syncPulse {
        0% { opacity: 0; transform: scale(0.8) translateX(100%); }
        15% { opacity: 1; transform: scale(1.1) translateX(0); }
        30% { transform: scale(1) translateX(0); }
        85% { opacity: 1; transform: scale(1) translateX(0); }
        100% { opacity: 0; transform: scale(0.8) translateX(100%); }
    }
    
    .sync-indicator i {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(syncStyles);

// Inicializar cuando Google esté listo
function initializeTillUpSync() {
    if (window.tillupRealtimeSync) {
        window.tillupRealtimeSync.disconnect();
    }
    
    window.tillupRealtimeSync = new TillUpRealtimeSync();
    console.log('🚀 TillUp Realtime Sync inicializado');
    
    // Exponer métodos útiles
    window.syncStatus = () => window.tillupRealtimeSync.getStatus();
    window.forceSync = () => window.tillupRealtimeSync.forceSync();
}

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeTillUpSync();
    }, 2000);
});

// Reinicializar cuando el usuario se loguee con Google
window.addEventListener('googleSignIn', () => {
    setTimeout(() => {
        initializeTillUpSync();
    }, 1000);
});

// Limpiar conexión al cerrar
window.addEventListener('beforeunload', () => {
    if (window.tillupRealtimeSync) {
        window.tillupRealtimeSync.disconnect();
    }
});
