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
        this.simulationMode = false; // Usar servidor real por defecto
        
        // URLs de WebSocket
        this.wsUrl = null;
        this.baseUrl = 'wss://yr9msnb5p6.execute-api.us-east-1.amazonaws.com/prod';
        this.localUrl = 'ws://localhost:8080';
        
        this.init();
    }

    generateDeviceId() {
        return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    init() {
        // No conectar automáticamente, esperar setUserId
        this.setupEventListeners();
    }

    setUserId(userId) {
        this.userId = userId;
        this.wsUrl = `${this.baseUrl}?userId=${userId}&token=tillup_test&deviceId=${this.deviceId}&deviceType=web`;
        this.connect();
    }

    connect() {
        if (!this.wsUrl) {
            console.log('⚠️ URL no configurada');
            return;
        }
        
        try {
            console.log('🔌 Conectando WebSocket a:', this.wsUrl);
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket conectado');
                this.isConnected = true;
                this.simulationMode = false;
                this.reconnectAttempts = 0;
                
                // Registrar usuario en el servidor
                const registerMessage = {
                    action: 'register',
                    userId: this.userId,
                    deviceId: this.deviceId,
                    timestamp: new Date().toISOString()
                };
                this.ws.send(JSON.stringify(registerMessage));
                console.log('📤 Registro enviado:', registerMessage);
                
                this.sendQueuedMessages();
                this.showConnectionStatus('Conectado', 'success');
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('🚑 Error al procesar mensaje:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('❌ WebSocket desconectado. Código:', event.code, 'Razón:', event.reason);
                this.isConnected = false;
                this.showConnectionStatus('Desconectado', 'danger');
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('🚨 Error WebSocket:', error);
                this.showConnectionStatus('Error en conexión', 'warning');
                this.attemptReconnect();
            };

        } catch (error) {
            console.error('Error conectando WebSocket:', error);
            this.attemptReconnect();
        }
    }

    startSimulationMode() {
        console.log('🎭 Iniciando modo simulación');
        this.simulationMode = true;
        this.isConnected = true; // Simular conexión
        this.showConnectionStatus('Simulación activa', 'info');
        
        // Simular respuesta de conexión
        setTimeout(() => {
            this.handleMessage({
                action: 'connection_confirmed',
                data: { message: 'Modo simulación activo' },
                deviceId: 'simulation_server'
            });
        }, 500);
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
            this.showConnectionStatus('Sin conexión', 'danger');
        }
    }

    sendMessage(action, data) {
        const message = {
            action: action,
            userId: this.userId,
            deviceId: this.deviceId,
            data: data,
            timestamp: new Date().toISOString()
        };

        if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            console.log('📤 Mensaje enviado:', action, data);
        } else {
            console.log('📥 Mensaje en cola:', action);
            this.messageQueue.push(message);
            // Intentar reconectar si no está conectado
            if (!this.isConnected) {
                this.connect();
            }
        }
    }

    simulateResponse(originalMessage) {
        // Simular respuestas del servidor con delay
        setTimeout(() => {
            const { action, data } = originalMessage;
            
            switch (action) {
                case 'test_message':
                    this.handleMessage({
                        action: 'test_message',
                        data: { message: `Eco: ${data.message}`, timestamp: data.timestamp },
                        deviceId: 'simulation_server'
                    });
                    break;
                    
                case 'ping':
                    this.handleMessage({
                        action: 'pong',
                        data: { timestamp: data.timestamp },
                        deviceId: 'simulation_server'
                    });
                    break;
                    
                case 'input_change':
                    // Simular broadcast a otros dispositivos
                    setTimeout(() => {
                        this.handleMessage({
                            action: 'input_change',
                            data: data,
                            deviceId: 'simulated_other_device'
                        });
                    }, 100);
                    break;
                    
                case 'private_sync':
                    // Simular sincronización privada entre dispositivos del mismo usuario
                    if (data.userId === this.userId) {
                        setTimeout(() => {
                            this.handleMessage({
                                action: 'private_sync',
                                data: data,
                                deviceId: 'simulated_same_user_device'
                            });
                        }, 150);
                    }
                    break;
                    
                case 'get_user_data':
                    // Simular respuesta de datos del usuario con validación de seguridad
                    if (data.userId === this.userId) {
                        const userData = JSON.parse(localStorage.getItem(`userData_${data.userId}`) || '{}');
                        this.handleMessage({
                            action: 'user_data_response',
                            data: {
                                userId: data.userId,
                                userData: userData,
                                timestamp: Date.now()
                            },
                            deviceId: 'simulation_server'
                        });
                    } else {
                        // Simular error de acceso denegado
                        this.handleMessage({
                            action: 'error',
                            data: {
                                message: 'Acceso denegado: No puedes acceder a datos de otros usuarios',
                                code: 403
                            },
                            deviceId: 'simulation_server'
                        });
                    }
                    break;
                    
                case 'upload_user_data':
                    // Simular confirmación de subida
                    this.handleMessage({
                        action: 'upload_success',
                        data: {
                            userId: data.userId,
                            message: 'Datos subidos correctamente'
                        },
                        deviceId: 'simulation_server'
                    });
                    break;
                    
                default:
                    console.log('🎭 Acción simulada:', action);
            }
        }, 200 + Math.random() * 300); // Delay aleatorio entre 200-500ms
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
        if (message.deviceId === this.deviceId) {
            return;
        }

        const { action, data } = message;

        // Manejar respuestas del servidor Lambda
        const messageType = message.type || message.action;
        
        console.log('🔍 Procesando mensaje:', { messageType, message });
        
        switch (messageType) {
            case 'pong':
                this.handlePong(data || message);
                break;
            case 'registered':
                this.handleRegistered(data || message);
                break;
            case 'input_synced':
                this.handleInputSynced(data || message);
                break;
            case 'input_change':
            case 'input_sync':
                this.handleInputChange(data || message);
                break;
            case 'data_uploaded':
            case 'upload_success':
                this.handleUploadSuccess(data || message);
                this.handleDataUploaded(data || message);
                break;
            case 'user_data':
            case 'user_data_response':
            case 'data_response':
                this.handleUserDataResponse(message);
                break;
            case 'data_sync':
                this.handlePrivateSync(message);
                break;
            case 'private_sync':
                this.handlePrivateSync(message);
                break;
            case 'error':
                this.handleError(data || message);
                break;
            // Mantener compatibilidad con mensajes antiguos
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
            case 'private_sync':
                this.handlePrivateSync(data);
                break;
            case 'connection_confirmed':
                this.handleConnectionConfirmed(data);
                break;

            default:
                console.log('Mensaje no reconocido:', messageType, message);
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
        console.log('🧪 Mensaje de prueba:', data);
        this.showNotification(`Prueba: ${data.message}`, 'primary');
    }

    handleInputChange(data) {
        console.log('⌨️ Cambio de entrada:', data);
        
        // Disparar evento para que la página lo maneje
        if (typeof window !== 'undefined' && window.handleRemoteInputChange) {
            window.handleRemoteInputChange(data);
        }
        
        // También disparar evento personalizado
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('inputChangeReceived', { detail: data }));
        }
    }

    handlePrivateSync(data) {
        console.log('🔒 Sincronización privada:', data);
        
        // Disparar evento para que la página lo maneje
        if (typeof window !== 'undefined' && window.handlePrivateSync) {
            window.handlePrivateSync(data);
        }
        
        // También disparar evento personalizado
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('privateSyncReceived', { detail: data }));
        }
    }

    handleUploadSuccess(data) {
        console.log('✅ Subida exitosa:', data);
        this.showNotification('Datos subidos correctamente a la nube', 'success');
    }

    handleUserDataResponse(message) {
        console.log('📊 Respuesta de datos del usuario:', message);
        
        // Extraer datos del mensaje (nuevo formato)
        const userId = message.userId;
        const userData = message.userData || {};
        const timestamp = message.timestamp;
        
        console.log('📊 Datos extraídos:', { userId, userData, timestamp });
        
        // Disparar evento personalizado para que la página lo maneje
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('userDataReceived', { 
                detail: {
                    userId: userId,
                    userData: userData,
                    timestamp: timestamp
                }
            }));
        }
    }
    
    handleDataUploaded(data) {
        console.log('✅ Datos subidos exitosamente:', data);
        this.showNotification('Datos guardados en la nube', 'success');
    }
    
    handlePong(data) {
        console.log('🏓 Pong recibido:', data);
        if (window.lastPingTime && data.timestamp) {
            const latency = Date.now() - data.timestamp;
            const latencyElement = document.getElementById('latency');
            if (latencyElement) {
                latencyElement.textContent = latency + 'ms';
            }
        }
    }
    
    handleRegistered(data) {
        console.log('✅ Usuario registrado:', data);
        this.showNotification('Conectado y registrado', 'success');
    }
    
    handleInputSynced(data) {
        console.log('✅ Input sincronizado:', data);
        // No hacer nada especial, solo confirmar
    }
    
    handleConnectionConfirmed(data) {
        console.log('✅ Conexión confirmada:', data);
        this.showNotification('Conectado al servidor', 'success');
    }
    
    handleError(data) {
        console.error('❌ Error del servidor:', data);
        this.showNotification(data.message || 'Error del servidor', 'error');
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

    syncInputChange(inputId, value, userId = null) {
        this.sendMessage('input_change', { 
            inputId, 
            value, 
            userId: userId || this.userId
        });
    }
    
    syncPrivateData(privateData) {
        this.sendMessage('private_sync', {
            userId: this.userId,
            deviceId: this.deviceId,
            privateData: privateData,
            timestamp: Date.now()
        });
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
        if (typeof window !== 'undefined' && window.Swal) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });

            Toast.fire({
                icon: type === 'success' ? 'success' : type === 'error' || type === 'danger' ? 'error' : 'info',
                title: message
            });
        } else {
            console.log(`📢 ${message}`);
        }
        
        // También agregar al log si existe
        if (typeof window !== 'undefined' && window.addToLog) {
            window.addToLog(message, type === 'success' ? 'info' : type);
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
            simulationMode: this.simulationMode,
            deviceId: this.deviceId,
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length,
            wsUrl: this.wsUrl
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
                <p><strong>Modo:</strong> ${status.simulationMode ? '🎭 Simulación' : '🌐 Real'}</p>
                <p><strong>ID Dispositivo:</strong> ${status.deviceId}</p>
                <p><strong>URL:</strong> ${status.wsUrl || 'No configurada'}</p>
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
        title: 'Prueba Enviada',
        text: 'Mensaje de prueba enviado a todos los dispositivos conectados',
        icon: 'success',
        timer: 2000
    });
}

// Auto-inicializar cuando se carga la página
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Esperar un poco para que se carguen otras dependencias
        setTimeout(() => {
            initWebSocketSync();
        }, 1000);
    });
}

// Función para conectar con userId
function connectWithUser(userId) {
    if (wsSync) {
        wsSync.setUserId(userId);
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.wsSync = wsSync;
    window.initWebSocketSync = initWebSocketSync;
    window.showWebSocketStatus = showWebSocketStatus;
    window.testBidirectionalSync = testBidirectionalSync;
    window.connectWithUser = connectWithUser;
}