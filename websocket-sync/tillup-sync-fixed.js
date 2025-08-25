/**
 * TillUp WebSocket Sync - Sistema de sincronización corregido
 */
class TillUpSync {
    constructor() {
        this.wsUrl = 'wss://yxn4kg5pjh.execute-api.us-east-1.amazonaws.com/prod';
        this.userId = localStorage.getItem('tillup_user_id') || this.generateUserId();
        this.deviceId = localStorage.getItem('tillup_device_id') || this.generateDeviceId();
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.syncQueue = [];
        this.lastSyncTime = 0;
        this.syncDebounce = 1000; // 1 segundo entre sincronizaciones
        
        localStorage.setItem('tillup_user_id', this.userId);
        localStorage.setItem('tillup_device_id', this.deviceId);
        
        this.init();
    }
    
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateDeviceId() {
        return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    init() {
        this.connect();
        this.setupAppIntegration();
    }
    
    connect() {
        const url = `${this.wsUrl}?userId=${this.userId}&deviceId=${this.deviceId}`;
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
            this.connected = true;
            this.reconnectAttempts = 0;
            console.log('🔄 TillUp Sync conectado');
            this.showNotification('Sincronización activada', 'success');
            this.processSyncQueue();
        };
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (e) {
                console.log('Mensaje WebSocket:', event.data);
            }
        };
        
        this.ws.onclose = () => {
            this.connected = false;
            console.log('❌ TillUp Sync desconectado');
            this.scheduleReconnect();
        };
        
        this.ws.onerror = (error) => {
            console.error('❌ Error WebSocket:', error);
        };
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'sync_update':
                if (data.payload.deviceId !== this.deviceId) {
                    this.handleSyncUpdate(data.payload);
                }
                break;
            case 'data_request':
                if (data.payload.requesterId !== this.deviceId) {
                    this.sendCurrentData(data.payload.requesterId);
                }
                break;
            case 'initial_data_response':
            case 'full_data_sync':
                if (data.payload.deviceId !== this.deviceId) {
                    this.handleDataSync(data.payload);
                }
                break;
        }
    }
    
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            setTimeout(() => this.connect(), delay);
        }
    }
    
    setupAppIntegration() {
        setTimeout(() => {
            this.interceptFunctions();
        }, 2000);
    }
    
    interceptFunctions() {
        const functions = [
            { name: 'addProduct', event: 'product_added' },
            { name: 'addClient', event: 'client_added' },
            { name: 'finalizeSale', event: 'sale_completed' },
            { name: 'processChickenSale', event: 'chicken_sale_added' },
            { name: 'payDebt', event: 'debt_payment' }
        ];
        
        functions.forEach(({ name, event }) => {
            if (typeof window[name] === 'function') {
                const original = window[name];
                window[name] = async (...args) => {
                    const result = await original.apply(this, args);
                    this.syncData(event, { timestamp: Date.now() });
                    return result;
                };
            }
        });
        
        // Storage interceptor deshabilitado para evitar bucles
        
        console.log('🔗 Funciones interceptadas');
    }
    
    interceptStorage() {
        // Deshabilitado para evitar bucles infinitos
        console.log('📝 Storage interceptor deshabilitado para evitar bucles');
    }
    
    syncData(type, data) {
        const now = Date.now();
        if (now - this.lastSyncTime < this.syncDebounce) {
            return; // Evitar spam de sincronización
        }
        
        // Evitar bucles con data_updated
        if (type === 'data_updated') {
            return;
        }
        
        this.lastSyncTime = now;
        
        const message = {
            type: 'sync_update',
            payload: {
                type,
                data,
                userId: this.userId,
                deviceId: this.deviceId,
                timestamp: now
            }
        };
        
        if (this.connected) {
            this.ws.send(JSON.stringify(message));
            console.log('📤 Sincronizando:', type);
        } else {
            this.syncQueue.push(message);
        }
    }
    
    processSyncQueue() {
        while (this.syncQueue.length > 0 && this.connected) {
            const message = this.syncQueue.shift();
            this.ws.send(JSON.stringify(message));
        }
    }
    
    handleSyncUpdate(payload) {
        console.log('📥 Recibiendo:', payload.type);
        
        // Solo mostrar notificación para eventos importantes
        if (payload.type !== 'data_updated') {
            this.showSyncNotification(payload.type);
        }
        
        // Solicitar datos actualizados solo para eventos importantes
        if (['product_added', 'client_added', 'sale_completed', 'chicken_sale_added', 'debt_payment'].includes(payload.type)) {
            setTimeout(() => {
                this.requestDataUpdate();
            }, 500);
        }
    }
    
    requestDataUpdate() {
        const message = {
            type: 'data_request',
            payload: {
                requesterId: this.deviceId,
                userId: this.userId,
                timestamp: Date.now()
            }
        };
        
        if (this.connected) {
            this.ws.send(JSON.stringify(message));
        }
    }
    
    sendCurrentData(targetDeviceId = null) {
        const data = this.getCurrentAppData();
        
        const message = {
            type: targetDeviceId ? 'initial_data_response' : 'full_data_sync',
            payload: {
                deviceId: this.deviceId,
                userId: this.userId,
                targetDeviceId,
                data: data,
                timestamp: Date.now()
            }
        };
        
        if (this.connected) {
            this.ws.send(JSON.stringify(message));
            console.log('📤 Enviando datos actuales');
        }
    }
    
    getCurrentAppData() {
        const keys = ['products', 'clients', 'sales', 'debts', 'chickenSales', 'movements', 'pricePerPound', 'costPerPound'];
        const data = {};
        
        keys.forEach(key => {
            try {
                // Intentar desde localStorage primero
                const stored = localStorage.getItem(key);
                if (stored) {
                    data[key] = JSON.parse(stored);
                } else if (window[key] !== undefined) {
                    // Si no está en localStorage, usar variable global
                    data[key] = window[key];
                } else {
                    // Valor por defecto
                    data[key] = ['pricePerPound', 'costPerPound'].includes(key) ? 0 : [];
                }
            } catch (e) {
                data[key] = window[key] || (['pricePerPound', 'costPerPound'].includes(key) ? 0 : []);
            }
        });
        
        return data;
    }
    
    async handleDataSync(payload) {
        console.log('📥 Recibiendo datos de:', payload.deviceId);
        
        try {
            await this.updateLocalData(payload.data);
            this.showNotification('Datos sincronizados', 'info');
            this.refreshApp();
        } catch (error) {
            console.error('Error sincronizando datos:', error);
        }
    }
    
    async updateLocalData(receivedData) {
        const keys = ['products', 'clients', 'sales', 'debts', 'chickenSales', 'movements', 'pricePerPound', 'costPerPound'];
        
        for (const key of keys) {
            if (receivedData[key] !== undefined) {
                // Guardar en localStorage
                localStorage.setItem(key, JSON.stringify(receivedData[key]));
                
                // Actualizar variable global
                if (window[key] !== undefined) {
                    window[key] = receivedData[key];
                }
                
                // Actualizar campos de precio si existen
                if (key === 'pricePerPound') {
                    const input = document.getElementById('pricePerPound');
                    if (input) input.value = receivedData[key];
                    window.pricePerPound = receivedData[key];
                }
                if (key === 'costPerPound') {
                    const input = document.getElementById('costPerPound');
                    if (input) input.value = receivedData[key];
                    window.costPerPound = receivedData[key];
                }
            }
        }
    }
    
    refreshApp() {
        setTimeout(() => {
            const updateFunctions = [
                'renderInventory',
                'renderClients', 
                'renderSalesProducts',
                'updateBalanceUI',
                'renderDebts',
                'updateChickenStats',
                'updateChickenSalesList',
                'renderBalanceGrid',
                'renderMovements'
            ];
            
            updateFunctions.forEach(funcName => {
                if (typeof window[funcName] === 'function') {
                    try {
                        window[funcName]();
                    } catch (e) {
                        console.log(`Error actualizando ${funcName}:`, e);
                    }
                }
            });
            
            // Actualizar selectores de clientes
            this.updateClientSelectors();
        }, 100);
    }
    
    updateClientSelectors() {
        const selectors = ['clientSelector', 'chickenClient', 'saleClientDrawer'];
        
        selectors.forEach(selectorId => {
            const selector = document.getElementById(selectorId);
            if (selector && window.clients) {
                const currentValue = selector.value;
                selector.innerHTML = '<option value="">Seleccionar cliente...</option>';
                
                window.clients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = client.name;
                    selector.appendChild(option);
                });
                
                // Restaurar selección si aún existe
                if (currentValue && window.clients.find(c => c.id === currentValue)) {
                    selector.value = currentValue;
                }
            }
        });
    }
    
    showSyncNotification(type) {
        const messages = {
            'product_added': '📦 Producto sincronizado',
            'client_added': '👥 Cliente sincronizado',
            'sale_completed': '💰 Venta sincronizada',
            'chicken_sale_added': '🐔 Venta de pollo sincronizada',
            'debt_payment': '💳 Pago sincronizado',
            'data_updated': '🔄 Datos actualizados',
            'manual_sync': '🔄 Sincronización manual'
        };
        
        const message = messages[type] || '🔄 Datos sincronizados';
        this.showNotification(message, 'success');
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
    
    // Método público para sincronizar manualmente
    forceSync() {
        this.sendCurrentData();
        this.syncData('manual_sync', { timestamp: Date.now() });
    }
    
    // Método público para obtener estado
    getStatus() {
        return {
            connected: this.connected,
            userId: this.userId,
            deviceId: this.deviceId,
            queueSize: this.syncQueue.length
        };
    }
}

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.tillupSync = new TillUpSync();
        console.log('🚀 TillUp Sync inicializado');
        
        // Exponer métodos útiles
        window.syncStatus = () => window.tillupSync.getStatus();
        window.forceSync = () => window.tillupSync.forceSync();
    }, 1000);
});