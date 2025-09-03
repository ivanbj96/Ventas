/**
 * Cliente WebSocket para sincronización bidireccional multidispositivo
 * Permite sincronizar datos en tiempo real entre múltiples navegadores/dispositivos
 */ 

class WebSocketSyncClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.deviceId = this.generateDeviceId();
        this.messageQueue = [];
        
        // URL del WebSocket desplegado
        this.wsUrl = 'wss://yr9msnb5p6.execute-api.us-east-1.amazonaws.com/prod';
        
        this.init();
    }

    generateDeviceId() {
        return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    init() {
        this.connect();
        this.setupEventListeners();
    }

    connect() {
        try {
            console.log('🔌 Conectando WebSocket...');
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket conectado');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.sendQueuedMessages();
                this.showConnectionStatus('Conectado', 'success');
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('🚑 Error parsing message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('❌ WebSocket desconectado');
                this.isConnected = false;
                this.showConnectionStatus('Desconectado', 'danger');
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('🚨 Error WebSocket:', error);
                this.showConnectionStatus('Error', 'warning');
            };

        } catch (error) {
            console.error('Error conectando WebSocket:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.log('❌ Máximo de reintentos alcanzado');
            this.showConnectionStatus('Sin conexión', 'secondary');
        }
    }

    sendMessage(action, data) {
        const message = {
            action: action,
            data: data,
            deviceId: this.deviceId,
            timestamp: new Date().toISOString()
        };

        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            console.log('📤 Mensaje enviado:', action);
        } else {
            console.log('📥 Mensaje en cola:', action);
            this.messageQueue.push(message);
        }
    }

    sendQueuedMessages() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.ws.send(JSON.stringify(message));
            console.log('📤 Mensaje de cola enviado:', message.action);
        }
    }

    handleMessage(message) {
        console.log('📨 Mensaje recibido:', message);
        
        // Evitar procesar mensajes propios
        if (message.sender === this.deviceId) {
            return;
        }

        const { action, data } = message;

        switch (action) {
            case 'sale_created':
                this.handleSaleCreated(data);
                break;
            case 'product_updated':
                this.handleProductUpdated(data);
                break;
            case 'client_added':
                this.handleClientAdded(data);
                break;
            case 'inventory_updated':
                this.handleInventoryUpdated(data);
                break;
            case 'test_message':
                this.handleTestMessage(data);
                break;
            case 'input_change':
                this.handleInputChange(data);
                break;
            case 'private_sync':
                this.handlePrivateSync(data);
                break;
            case 'upload_success':
                this.handleUploadSuccess(data);
                break;
            case 'user_data_response':
                this.handleUserDataResponse(data);
                break;
            default:
                console.log('Acción no reconocida:', action);
        }
    }

    handleSaleCreated(data) {
        console.log('💰 Nueva venta sincronizada:', data);
        
        // Actualizar datos locales
        if (window.sales) {
            window.sales.push(data);
            saveData();
        }
        
        // Actualizar UI si está en la vista de ventas
        if (window.currentView === 'sales') {
            loadSales();
        }
        
        // Mostrar notificación
        this.showNotification('Nueva venta sincronizada', 'success');
    }

    handleProductUpdated(data) {
        console.log('📦 Producto actualizado:', data);
        
        // Actualizar inventario local
        if (window.inventory) {
            const index = window.inventory.findIndex(p => p.id === data.id);
            if (index !== -1) {
                window.inventory[index] = data;
                saveData();
            }
        }
        
        // Actualizar UI
        if (window.currentView === 'inventory') {
            loadInventory();
        }
        
        this.showNotification('Inventario sincronizado', 'info');
    }

    handleClientAdded(data) {
        console.log('👤 Cliente agregado:', data);
        
        if (window.clients) {
            window.clients.push(data);
            saveData();
        }
        
        if (window.currentView === 'clients') {
            loadClients();
        }
        
        this.showNotification('Nuevo cliente sincronizado', 'success');
    }

    handleInventoryUpdated(data) {
        console.log('📊 Inventario actualizado:', data);
        this.handleProductUpdated(data);
    }

    handleTestMessage(data) {
        console.log('🧪 Mensaje de test:', data);
        this.showNotification(`Test: ${data.message}`, 'primary');
    }

    handleInputChange(data) {
        console.log('⌨️ Cambio de input:', data);
        // Este método se puede usar para manejar cambios de input
        // La lógica específica se maneja en la página de test
    }

    handlePrivateSync(data) {
        console.log('🔒 Sincronización privada:', data);
        // Este método maneja la sincronización de datos privados entre dispositivos del mismo usuario
    }

    handleUploadSuccess(data) {
        console.log('✅ Upload exitoso:', data);
        this.showNotification('Datos subidos correctamente a la nube', 'success');
    }

    handleUserDataResponse(data) {
        console.log('📊 Respuesta de datos del usuario:', data);
        // Disparar evento personalizado para que la página lo maneje
        window.dispatchEvent(new CustomEvent('userDataReceived', { detail: data }));
    }

    // Métodos para enviar diferentes tipos de sincronización
    syncSale(sale) {
        this.sendMessage('sale_created', sale);
    }

    syncProduct(product) {
        this.sendMessage('product_updated', product);
    }

    syncClient(client) {
        this.sendMessage('client_added', client);
    }

    syncInventory(product) {
        this.sendMessage('inventory_updated', product);
    }

    sendTestMessage(message) {
        this.sendMessage('test_message', { message, deviceId: this.deviceId });
    }

    syncInputChange(inputId, value) {
        this.sendMessage('input_change', { inputId, value, deviceId: this.deviceId });
    }

    setupEventListeners() {
        // Interceptar funciones de guardado para sincronizar automáticamente
        const originalSaveData = window.saveData;
        if (originalSaveData) {
            window.saveData = () => {
                originalSaveData();
                // Aquí podrías agregar lógica para detectar qué cambió y sincronizarlo
            };
        }
    }

    showConnectionStatus(status, type) {
        const statusElement = document.getElementById('websocket-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <span class="badge bg-${type}">
                    <i class="bi bi-wifi"></i> ${status}
                </span>
            `;
        }
    }

    showNotification(message, type = 'info') {
        // Usar SweetAlert2 si está disponible
        if (window.Swal) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });

            Toast.fire({
                icon: type === 'success' ? 'success' : type === 'danger' ? 'error' : 'info',
                title: message
            });
        } else {
            console.log(`📢 ${message}`);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.isConnected = false;
        }
    }

    getStatus() {
        return {
            connected: this.isConnected,
            deviceId: this.deviceId,
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length
        };
    }
}

// Inicializar cliente WebSocket globalmente
let wsSync = null;

// Función para inicializar la sincronización
function initWebSocketSync() {
    if (!wsSync) {
        wsSync = new WebSocketSyncClient();
        console.log('🚀 Cliente WebSocket inicializado');
    }
    return wsSync;
}

// Función para mostrar estado de conexión
function showWebSocketStatus() {
    if (!wsSync) {
        Swal.fire({
            title: 'WebSocket no inicializado',
            text: 'La sincronización WebSocket no está activa',
            icon: 'warning'
        });
        return;
    }

    const status = wsSync.getStatus();
    
    Swal.fire({
        title: 'Estado de Sincronización WebSocket',
        html: `
            <div class="text-start">
                <p><strong>Estado:</strong> ${status.connected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
                <p><strong>Device ID:</strong> ${status.deviceId}</p>
                <p><strong>Reintentos:</strong> ${status.reconnectAttempts}</p>
                <p><strong>Mensajes en cola:</strong> ${status.queuedMessages}</p>
            </div>
        `,
        icon: status.connected ? 'success' : 'error'
    });
}

// Función de test bidireccional
function testBidirectionalSync() {
    if (!wsSync) {
        initWebSocketSync();
    }
    
    const testMessage = `Test desde ${wsSync.deviceId} - ${new Date().toLocaleTimeString()}`;
    wsSync.sendTestMessage(testMessage);
    
    Swal.fire({
        title: 'Test Enviado',
        text: 'Mensaje de test enviado a todos los dispositivos conectados',
        icon: 'success',
        timer: 2000
    });
}

// Auto-inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para que se carguen otras dependencias
    setTimeout(() => {
        initWebSocketSync();
    }, 1000);
});

// Exportar para uso global
window.wsSync = wsSync;
window.initWebSocketSync = initWebSocketSync;
window.showWebSocketStatus = showWebSocketStatus;
window.testBidirectionalSync = testBidirectionalSync;