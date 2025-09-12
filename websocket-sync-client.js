// ========================================
// 🔄 CLIENTE WEBSOCKET PARA SINCRONIZACIÓN
// ========================================
// Cliente WebSocket para sincronización en tiempo real de TillUp POS

class TillUpWebSocketClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.userId = null;
        this.baseUrl = 'wss://yr9msnb5p6.execute-api.us-east-1.amazonaws.com/prod';
        this.messageQueue = [];
        this.isOnline = navigator.onLine;
        this.lastSync = null;
        this.enabled = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            if (this.enabled && this.userId) {
                this.connect();
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.disconnect();
        });
    }

    init(userId) {
        this.userId = userId;
        this.enabled = true;
        
        if (this.isOnline) {
            this.connect();
        }
        
        console.log('🔄 TillUp WebSocket Client initialized for user:', userId);
    }

    connect() {
        if (!this.isOnline || this.isConnected || !this.userId) {
            console.log('🔄 Connect blocked:', { online: this.isOnline, connected: this.isConnected, userId: this.userId });
            return;
        }

        try {
            const url = `${this.baseUrl}?userId=${this.userId}&deviceId=test_device&token=tillup_test`;
            console.log('🔄 Attempting WebSocket connection to:', url);
            this.ws = new WebSocket(url);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                console.log('🔄 WebSocket connected successfully');
                
                // Procesar cola de mensajes pendientes
                this.processMessageQueue();
                
                // Enviar datos automáticamente al conectar
                setTimeout(() => {
                    if (window.autoSyncAllData) {
                        window.autoSyncAllData();
                    }
                }, 2000);
                
                // Conexión establecida silenciosamente
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };

            this.ws.onclose = (event) => {
                this.isConnected = false;
                console.log('🔄 WebSocket disconnected:', { code: event.code, reason: event.reason });
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('🔄 WebSocket error:', error);
                this.isConnected = false;
            };

        } catch (error) {
            console.error('🔄 WebSocket connection failed:', error);
            this.attemptReconnect();
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.isOnline || !this.enabled) {
            console.log('🔄 Max reconnection attempts reached or disabled');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }

    send(data) {
        const message = {
            ...data,
            userId: this.userId,
            timestamp: Date.now()
        };

        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            // Agregar a cola si no está conectado
            this.messageQueue.push(message);
        }
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(message));
            } else {
                // Volver a agregar a la cola si la conexión se perdió
                this.messageQueue.unshift(message);
                break;
            }
        }
    }

    handleMessage(data) {
        console.log('🔄 Received message:', data);
        this.lastSync = Date.now();

        // Manejar diferentes tipos de mensajes
        if (data.action === 'input_change') {
            window.dispatchEvent(new CustomEvent('inputChangeReceived', { detail: data.data }));
        } else if (data.action === 'private_sync') {
            window.dispatchEvent(new CustomEvent('privateSyncReceived', { detail: data.data }));
        } else if (data.action === 'pong') {
            console.log('🏓 Pong received');
        }

        // Delegar al sync manager si existe - PRIORIDAD ALTA
        if (window.syncManager && window.syncManager.handleIncomingData) {
            console.log('🔄 Delegando al sync manager:', data.action);
            window.syncManager.handleIncomingData(data);
        } else {
            console.warn('⚠️ Sync manager no disponible para:', data.action);
        }
    }

    // Métodos públicos para sincronización
    syncProduct(product) {
        this.send({
            action: 'sync_product',
            data: product,
            type: 'product'
        });
    }

    syncClient(client) {
        this.send({
            action: 'sync_client',
            data: client,
            type: 'client'
        });
    }

    syncSale(sale) {
        this.send({
            action: 'sync_sale',
            data: sale,
            type: 'sale'
        });
    }

    syncChickenSale(sale) {
        this.send({
            action: 'sync_chicken_sale',
            data: sale,
            type: 'chicken_sale'
        });
    }

    syncDebt(debt) {
        this.send({
            action: 'sync_debt',
            data: debt,
            type: 'debt'
        });
    }

    requestFullSync() {
        this.send({
            action: 'request_full_sync'
        });
    }

    // Métodos para compatibilidad con test-sync.html
    sendMessage(action, data) {
        this.send({
            action: action,
            data: data
        });
    }

    syncInputChange(inputId, value, userId) {
        this.send({
            action: 'input_change',
            data: {
                inputId: inputId,
                value: value,
                userId: userId
            }
        });
    }

    syncPrivateData(privateData) {
        this.send({
            action: 'private_sync',
            data: {
                userId: this.userId,
                privateData: privateData
            }
        });
    }

    getStatus() {
        return {
            enabled: this.enabled,
            connected: this.isConnected,
            userId: this.userId,
            lastSync: this.lastSync,
            queuedMessages: this.messageQueue.length,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    showNotification(message, type = 'info') {
        // Notificaciones deshabilitadas para actualización silenciosa
        console.log(`🔄 ${message}`);
    }
}

// Crear instancia global
window.tillupWebSocketClient = new TillUpWebSocketClient();

console.log('🔄 TillUp WebSocket Client loaded');