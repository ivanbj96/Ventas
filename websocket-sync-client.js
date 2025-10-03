// ========================================
// 🔄 CLIENTE WEBSOCKET PARA SINCRONIZACIÓN
// ========================================
// Cliente WebSocket para sincronización en tiempo real de TillUp POS

class TillUpWebSocketClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000;
        this.reconnectTimer = null;
        this.connectionTimeout = null;
        this.userId = null;
        this.baseUrl = 'wss://ya76uc6b7j.execute-api.us-east-1.amazonaws.com/prod';
        this.messageQueue = [];
        this.isOnline = navigator.onLine;
        this.lastSync = 0;
        this.enabled = false;
        this.heartbeatInterval = null;
        
        // 🔧 Mejoras de sincronización
        this.syncModules = ['products', 'clients', 'sales', 'debts', 'chickenSales'];
        this.changeHistory = [];
        this.maxHistorySize = 100;
        this.compressionEnabled = true;
        try {
            this.conflictResolver = new ConflictResolver();
        } catch (error) {
            console.warn('⚠️ ConflictResolver no disponible:', error);
            this.conflictResolver = null;
        }
        
        this.setupEventListeners();
        this.initBackgroundSync();
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
            // Generar deviceId único si no existe
            let deviceId = localStorage.getItem('tillup_device_id');
            if (!deviceId) {
                deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                if (deviceId && typeof deviceId === 'string') {
                    localStorage.setItem('tillup_device_id', deviceId);
                }
            }
            
            const url = `${this.baseUrl}?userId=${this.userId}&deviceId=${deviceId}&token=tillup_secure_token`;
            console.log('🔄 Attempting WebSocket connection to:', url);
            this.ws = new WebSocket(url);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                console.log('🔄 WebSocket connected successfully');
                
                // Enviar identificación del usuario
                this.send({
                    action: 'user_identification',
                    data: {
                        userId: this.userId,
                        deviceId: localStorage.getItem('tillup_device_id'),
                        timestamp: Date.now()
                    }
                });
                
                // Procesar cola de mensajes pendientes
                this.processMessageQueue();
                
                // Iniciar heartbeat
                this.startHeartbeat();
                
                // Verificar si necesita sincronización inicial completa
                if (window.initialSyncManager && window.initialSyncManager.isInitialSyncNeeded()) {
                    console.log('🔄 Dispositivo nuevo detectado - iniciando sincronización inicial completa');
                    window.initialSyncManager.performInitialSync(this.userId);
                } else {
                    // Solo solicitar datos una vez - NO sincronización continua
                    this.requestDataFromAllDevices();
                    console.log('🚫 Sincronización continua DESACTIVADA');
                }
                
                // Mostrar notificación de conexión
                if (window.syncNotifications) {
                    window.syncNotifications.showConnectionStatus(true);
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const messageData = JSON.parse(event.data);
                    // Validar estructura básica del mensaje
                    if (messageData && typeof messageData === 'object') {
                        this.handleMessage(messageData);
                    } else {
                        console.warn('⚠️ Mensaje WebSocket inválido:', event.data);
                    }
                } catch (error) {
                    console.error('🔄 Error parsing WebSocket message:', error, event.data);
                }
            };

            this.ws.onclose = (event) => {
                this.isConnected = false;
                console.log('🔄 WebSocket disconnected:', { code: event.code, reason: event.reason });
                
                // Mostrar notificación de desconexión
                if (window.syncNotifications) {
                    window.syncNotifications.showConnectionStatus(false);
                }
                
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('🔄 WebSocket error:', error);
                this.isConnected = false;
                this.stopHeartbeat();
                this.stopAutoSync();
                this.stopContinuousSync();
                
                if (window.syncNotifications) {
                    window.syncNotifications.showConnectionStatus(false);
                }
                
                this.attemptReconnect();
            };

        } catch (error) {
            console.error('🔄 WebSocket connection failed:', error);
            this.attemptReconnect();
        }
    }

    disconnect() {
        this.stopHeartbeat();
        this.stopAutoSync();
        this.stopContinuousSync();
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
        
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

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
        
        console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        
        this.reconnectTimer = setTimeout(() => {
            if (this.enabled && !this.isConnected) {
                this.connect();
            }
            this.reconnectTimer = null;
        }, delay);
    }

    startHeartbeat() {
        this.stopHeartbeat();
        
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
                this.send({
                    action: 'ping',
                    data: { timestamp: Date.now() }
                });
            } else {
                this.stopHeartbeat();
            }
        }, 30000);
    }

    startAutoSync() {
        this.stopAutoSync();
        
        this.autoSyncInterval = setInterval(() => {
            if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
                this.requestDataFromAllDevices();
            } else {
                this.stopAutoSync();
            }
        }, 10000);
    }

    startContinuousSync() {
        if (this.continuousSyncInterval) {
            clearInterval(this.continuousSyncInterval);
        }
        
        // COMPLETAMENTE DESACTIVADO - NO HACER NADA
        console.log('🔄 Sincronización continua COMPLETAMENTE desactivada');
    }

    stopContinuousSync() {
        if (this.continuousSyncInterval) {
            clearInterval(this.continuousSyncInterval);
            this.continuousSyncInterval = null;
        }
        console.log('🚫 Sincronización continua detenida');
    }

    stopAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
        }
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    requestDataFromAllDevices() {
        this.send({
            action: 'request_all_user_data',
            data: {
                userId: this.userId,
                requestingDevice: localStorage.getItem('tillup_device_id')
            }
        });
    }

    forceCompleteSync() {
        console.log('🔄 Iniciando sincronización completa forzada');
        
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log('❌ WebSocket no conectado');
            return false;
        }
        
        // Enviar datos locales primero
        this.sendAllLocalData();
        
        // Solicitar datos de otros dispositivos
        setTimeout(() => {
            this.requestDataFromAllDevices();
        }, 1000);
        
        return true;
    }

    send(data) {
        const message = {
            ...data,
            userId: this.userId,
            timestamp: Date.now(),
            deviceId: localStorage.getItem('tillup_device_id')
        };

        // 🗜️ Compresión de datos si está habilitada
        if (this.compressionEnabled && data.data && typeof data.data === 'object') {
            message.compressed = true;
            message.data = this.compressData(data.data);
        }

        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            
            // 📝 Registrar en historial de cambios
            this.addToChangeHistory(data.action, data.type, data.data);
            
            if (data.action === 'full_sync_data' && window.syncNotifications) {
                window.syncNotifications.showSyncNotification('sending');
            }
        } else {
            this.messageQueue.push(message);
        }
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(message));
            } else {
                this.messageQueue.unshift(message);
                break;
            }
        }
    }

    handleMessage(data) {
        this.lastSync = Date.now();

        if (data.deviceId === localStorage.getItem('tillup_device_id')) {
            return;
        }

        if (!data.action) {
            return;
        }

        // 🗜️ Descomprimir datos si es necesario
        if (data.compressed && data.data) {
            data.data = this.decompressData(data.data);
        }

        switch (data.action) {
            case 'input_change':
                window.dispatchEvent(new CustomEvent('inputChangeReceived', { detail: data.data }));
                break;
            case 'private_sync':
                window.dispatchEvent(new CustomEvent('privateSyncReceived', { detail: data.data }));
                break;
            case 'pong':
                console.log('🏓 Pong received');
                break;
            case 'user_identification':
                console.log('👤 Usuario identificado:', data.data?.userId);
                break;
            case 'connection_ack':
                console.log('✅ Conexión confirmada por servidor');
                break;
            case 'all_user_data_response':
            case 'complete_user_data_response':
                this.handleAllUserDataResponse(data.data);
                break;
            case 'data_request':
            case 'request_complete_user_data':
                this.sendAllLocalData();
                break;
            case 'selective_sync':
                this.handleSelectiveSync(data.data);
                break;
            case 'sync_chicken_prices':
                if (window.receiveChickenPrices && typeof window.receiveChickenPrices === 'function') {
                    window.receiveChickenPrices(data.data);
                }
                break;
            case 'conflict_detected':
                this.handleConflict(data.data);
                break;
            default:
                if (window.syncManager && window.syncManager.handleIncomingData) {
                    console.log('🔄 Delegando al sync manager:', data.action, 'de dispositivo:', data.deviceId);
                    
                    // 🔄 Resolver conflictos antes de procesar
                    if (this.conflictResolver) {
                        const resolvedData = this.conflictResolver.resolve(data);
                        if (resolvedData) {
                            window.syncManager.handleIncomingData(resolvedData);
                        }
                    } else {
                        // Si no hay conflict resolver, procesar directamente
                        window.syncManager.handleIncomingData(data);
                    }
                    
                    setTimeout(() => {
                        this.forceUIUpdate();
                        
                        if (window.syncNotifications) {
                            window.syncNotifications.showSyncNotification('success');
                        }
                    }, 100);
                } else {
                    console.warn('⚠️ Sync manager no disponible para:', data.action);
                }
                break;
        }
    }

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

    syncChickenPrices(pricesData) {
        this.send({
            action: 'sync_chicken_prices',
            data: pricesData,
            type: 'chicken_prices'
        });
    }

    requestFullSync() {
        this.send({
            action: 'request_full_sync'
        });
    }

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

    sendAllLocalData() {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log('🔄 No se puede enviar datos: WebSocket no conectado');
            return;
        }

        try {
            const allData = {
                products: JSON.parse(localStorage.getItem('products') || '[]'),
                clients: JSON.parse(localStorage.getItem('clients') || '[]'),
                sales: JSON.parse(localStorage.getItem('sales') || '[]'),
                debts: JSON.parse(localStorage.getItem('debts') || '[]'),
                chickenSales: JSON.parse(localStorage.getItem('chickenSales') || '[]'),
                chickenPrices: {
                    pricePerPound: parseFloat(localStorage.getItem('pricePerPound') || '2.50'),
                    costPerPound: parseFloat(localStorage.getItem('costPerPound') || '2.00')
                }
            };

            this.send({
                action: 'full_sync_data',
                data: allData,
                deviceId: localStorage.getItem('tillup_device_id')
            });
            
            const totalItems = allData.products.length + allData.clients.length + 
                             allData.sales.length + allData.debts.length + allData.chickenSales.length;
            console.log('🔄 Datos locales enviados:', totalItems, 'elementos');
        } catch (error) {
            console.error('🔄 Error enviando datos locales:', error);
        }
    }

    handleAllUserDataResponse(allDevicesData) {
        console.log('🔄 Recibiendo datos de todos los dispositivos:', allDevicesData);
        
        if (!allDevicesData || typeof allDevicesData !== 'object') {
            console.warn('⚠️ Datos inválidos recibidos');
            return;
        }

        try {
            // Unificar datos de todos los dispositivos
            const unifiedData = this.unifyDataFromAllDevices(allDevicesData);
            
            // Actualizar localStorage con datos unificados
            this.updateLocalStorageWithUnifiedData(unifiedData);
            
            // Actualizar UI automáticamente
            this.updateUIAfterSync();
            
            // Notificar al gestor de sincronización inicial si está activo
            if (window.initialSyncManager && localStorage.getItem('initial_sync_in_progress')) {
                console.log('🔄 Datos recibidos durante sincronización inicial');
            }
            
        } catch (error) {
            console.error('🔄 Error procesando datos unificados:', error);
        }
    }

    unifyDataFromAllDevices(allDevicesData) {
        const unified = {
            products: [],
            clients: [],
            sales: [],
            debts: [],
            chickenSales: [],
            chickenPrices: { pricePerPound: 2.50, costPerPound: 2.00 }
        };

        // Mapas para evitar duplicados por ID
        const seenIds = {
            products: new Set(),
            clients: new Set(),
            sales: new Set(),
            debts: new Set(),
            chickenSales: new Set()
        };

        // Procesar datos de cada dispositivo
        Object.values(allDevicesData).forEach(deviceData => {
            if (!deviceData || typeof deviceData !== 'object') return;

            Object.keys(unified).forEach(dataType => {
                if (dataType === 'chickenPrices') {
                    if (deviceData[dataType]) {
                        unified[dataType] = deviceData[dataType];
                    }
                } else {
                    const items = deviceData[dataType] || [];
                    items.forEach(item => {
                        if (item && item.id && !seenIds[dataType].has(item.id)) {
                            seenIds[dataType].add(item.id);
                            unified[dataType].push(item);
                        }
                    });
                }
            });
        });

        console.log('🔄 Datos unificados:', {
            products: unified.products.length,
            clients: unified.clients.length,
            sales: unified.sales.length,
            debts: unified.debts.length,
            chickenSales: unified.chickenSales.length
        });

        return unified;
    }

    updateLocalStorageWithUnifiedData(unifiedData) {
        let totalChanges = 0;
        
        Object.keys(unifiedData).forEach(dataType => {
            if (dataType === 'chickenPrices') {
                const currentPrice = parseFloat(localStorage.getItem('pricePerPound') || '2.50');
                const currentCost = parseFloat(localStorage.getItem('costPerPound') || '2.00');
                const newData = unifiedData[dataType];
                
                if (currentPrice !== newData.pricePerPound || currentCost !== newData.costPerPound) {
                    totalChanges++;
                    localStorage.setItem('pricePerPound', newData.pricePerPound.toString());
                    localStorage.setItem('costPerPound', newData.costPerPound.toString());
                    if (window.receiveChickenPrices) {
                        window.receiveChickenPrices(newData);
                    }
                }
            } else {
                const currentData = JSON.parse(localStorage.getItem(dataType) || '[]');
                const newData = unifiedData[dataType];
                
                if (currentData.length !== newData.length) {
                    const diff = newData.length - currentData.length;
                    totalChanges += Math.abs(diff);
                    console.log(`🔄 ${dataType}: ${currentData.length} -> ${newData.length} (${diff > 0 ? '+' : ''}${diff})`);
                }
                
                localStorage.setItem(dataType, JSON.stringify(newData));
            }
        });
        
        if (totalChanges > 0) {
            console.log(`🔄 LocalStorage actualizado con ${totalChanges} cambios`);
            this.forceGlobalStateUpdate(unifiedData);
            // Forzar actualización inmediata de UI
            setTimeout(() => {
                this.updateUIAfterSync();
            }, 100);
        }
    }

    forceGlobalStateUpdate(unifiedData) {
        // Forzar actualización del estado global de la aplicación
        Object.keys(unifiedData).forEach(dataType => {
            const data = unifiedData[dataType];
            
            switch (dataType) {
                case 'products':
                    if (window.products && Array.isArray(window.products)) {
                        window.products.length = 0;
                        window.products.push(...data);
                    }
                    break;
                case 'clients':
                    if (window.clients && Array.isArray(window.clients)) {
                        window.clients.length = 0;
                        window.clients.push(...data);
                    }
                    break;
                case 'sales':
                    if (window.sales && Array.isArray(window.sales)) {
                        window.sales.length = 0;
                        window.sales.push(...data);
                    }
                    break;
                case 'debts':
                    if (window.debts && Array.isArray(window.debts)) {
                        window.debts.length = 0;
                        window.debts.push(...data);
                    }
                    break;
            }
        });
        
        console.log('🔄 Estado global forzado a actualizar');
    }

    updateUIAfterSync() {
        // Actualización inmediata y completa de UI
        this.reloadGlobalState();
        
        // Actualizar todas las vistas sin delay
        if (typeof window.renderInventory === 'function') window.renderInventory();
        if (typeof window.renderClients === 'function') window.renderClients();
        if (typeof window.renderBalanceGrid === 'function') window.renderBalanceGrid();
        if (typeof window.renderDebts === 'function') window.renderDebts();
        if (typeof window.updateClientSelector === 'function') window.updateClientSelector();
        if (typeof window.updateBalanceUI === 'function') window.updateBalanceUI();
        if (typeof window.renderSalesProducts === 'function') window.renderSalesProducts();
        if (typeof window.showAdvancedStats === 'function') window.showAdvancedStats();
        if (typeof window.updateBalance === 'function') window.updateBalance();
        
        console.log('🔄 UI actualizada instantáneamente');
    }

    forceUIUpdate() {
        // Actualización instantánea sin delays
        this.reloadGlobalState();
        this.updateUIAfterSync();
        
        // Mostrar indicador visual
        this.showSyncIndicator();
    }

    showSyncIndicator() {
        const indicator = document.createElement('div');
        indicator.innerHTML = '🔄';
        indicator.style.cssText = `
            position: fixed; top: 10px; right: 10px; background: #28a745;
            color: white; padding: 4px 8px; border-radius: 12px;
            font-size: 12px; z-index: 9999; animation: fadeInOut 1.5s ease;
        `;
        
        if (!document.head.querySelector('#sync-indicator-style')) {
            const style = document.createElement('style');
            style.id = 'sync-indicator-style';
            style.textContent = '@keyframes fadeInOut { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(indicator);
        setTimeout(() => indicator.remove(), 1500);
    }

    reloadGlobalState() {
        try {
            // Recargar arrays globales desde localStorage
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const clients = JSON.parse(localStorage.getItem('clients') || '[]');
            const sales = JSON.parse(localStorage.getItem('sales') || '[]');
            const debts = JSON.parse(localStorage.getItem('debts') || '[]');
            const chickenSales = JSON.parse(localStorage.getItem('chickenSales') || '[]');
            
            // Actualizar estado global
            if (window.products && Array.isArray(window.products)) {
                window.products.length = 0;
                window.products.push(...products);
            }
            
            if (window.clients && Array.isArray(window.clients)) {
                window.clients.length = 0;
                window.clients.push(...clients);
            }
            
            if (window.sales && Array.isArray(window.sales)) {
                window.sales.length = 0;
                window.sales.push(...sales);
            }
            
            if (window.debts && Array.isArray(window.debts)) {
                window.debts.length = 0;
                window.debts.push(...debts);
            }
            
            console.log('🔄 Estado global recargado:', {
                products: products.length,
                clients: clients.length,
                sales: sales.length,
                debts: debts.length,
                chickenSales: chickenSales.length
            });
        } catch (error) {
            console.error('🔄 Error recargando estado global:', error);
        }
    }

    // 🔧 Sincronización selectiva por módulos
    syncSelectiveModules(modules) {
        const selectiveData = {};
        modules.forEach(module => {
            if (this.syncModules.includes(module)) {
                selectiveData[module] = JSON.parse(localStorage.getItem(module) || '[]');
            }
        });
        
        this.send({
            action: 'selective_sync',
            data: selectiveData,
            modules: modules
        });
    }

    // 📝 Historial de cambios detallado
    addToChangeHistory(action, type, data) {
        const change = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            action,
            type,
            dataId: data?.id,
            deviceId: localStorage.getItem('tillup_device_id'),
            userId: this.userId
        };
        
        this.changeHistory.unshift(change);
        if (this.changeHistory.length > this.maxHistorySize) {
            this.changeHistory = this.changeHistory.slice(0, this.maxHistorySize);
        }
        
        localStorage.setItem('sync_change_history', JSON.stringify(this.changeHistory));
    }

    // 🔄 Sincronización en background
    initBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then(registration => {
                return registration.sync.register('background-sync');
            }).catch(err => console.log('Background sync not supported'));
        }
    }

    // 🗜️ Compresión de datos
    compressData(data) {
        try {
            const jsonString = JSON.stringify(data);
            return btoa(jsonString);
        } catch (error) {
            console.warn('Error comprimiendo datos:', error);
            return data;
        }
    }

    decompressData(compressedData) {
        try {
            const jsonString = atob(compressedData);
            return JSON.parse(jsonString);
        } catch (error) {
            console.warn('Error descomprimiendo datos:', error);
            return compressedData;
        }
    }

    // 🔄 Manejo de sincronización selectiva
    handleSelectiveSync(data) {
        console.log('🔄 Procesando sincronización selectiva:', data);
        
        Object.keys(data).forEach(module => {
            if (this.syncModules.includes(module)) {
                const currentData = JSON.parse(localStorage.getItem(module) || '[]');
                const mergedData = this.conflictResolver.mergeData(currentData, data[module]);
                localStorage.setItem(module, JSON.stringify(mergedData));
            }
        });
        
        this.updateUIAfterSync();
    }

    // ⚔️ Manejo de conflictos
    handleConflict(conflictData) {
        console.log('⚔️ Conflicto detectado:', conflictData);
        
        if (window.syncNotifications) {
            window.syncNotifications.showConflictNotification(conflictData);
        }
    }

    // 🧹 Limpiar historial antiguo
    cleanOldHistory(daysOld = 7) {
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        this.changeHistory = this.changeHistory.filter(change => change.timestamp > cutoffTime);
        localStorage.setItem('sync_change_history', JSON.stringify(this.changeHistory));
    }

    getStatus() {
        return {
            enabled: this.enabled,
            connected: this.isConnected,
            userId: this.userId,
            lastSync: this.lastSync,
            queuedMessages: this.messageQueue.length,
            reconnectAttempts: this.reconnectAttempts,
            changeHistorySize: this.changeHistory.length,
            compressionEnabled: this.compressionEnabled,
            syncModules: this.syncModules
        };
    }
}

// 🔧 Clase para resolución de conflictos
class ConflictResolver {
    constructor() {
        this.strategies = {
            'timestamp': this.resolveByTimestamp,
            'merge': this.mergeConflicts
        };
        this.defaultStrategy = 'timestamp';
    }

    resolve(data) {
        const strategy = this.getStrategy(data.type);
        return this.strategies[strategy].call(this, data);
    }

    resolveByTimestamp(data) {
        if (!data || !data.data) {
            return data; // Permitir datos sin estructura específica
        }
        
        // Si no tiene ID, es probablemente un full_sync_data
        if (!data.data.id) {
            return data;
        }
        
        const localData = this.getLocalData(data.type, data.data.id);
        if (!localData || (data.timestamp && data.timestamp > (localData.timestamp || 0))) {
            return data;
        }
        return null;
    }

    mergeConflicts(data) {
        if (!data || !data.data || !data.data.id) {
            console.warn('⚠️ Datos inválidos para merge de conflictos:', data);
            return data;
        }
        
        const localData = this.getLocalData(data.type, data.data.id);
        if (localData) {
            return {
                ...data,
                data: { ...localData, ...data.data, timestamp: Math.max(localData.timestamp || 0, data.timestamp || 0) }
            };
        }
        return data;
    }

    mergeData(localArray, remoteArray) {
        const merged = [...localArray];
        const localIds = new Set(localArray.map(item => item.id));
        
        remoteArray.forEach(remoteItem => {
            if (!localIds.has(remoteItem.id)) {
                merged.push(remoteItem);
            } else {
                const localIndex = merged.findIndex(item => item.id === remoteItem.id);
                if (localIndex !== -1) {
                    const localItem = merged[localIndex];
                    if (!localItem.timestamp || remoteItem.timestamp > localItem.timestamp) {
                        merged[localIndex] = remoteItem;
                    }
                }
            }
        });
        
        return merged;
    }

    getLocalData(type, id) {
        try {
            const data = JSON.parse(localStorage.getItem(type) || '[]');
            return data.find(item => item.id === id);
        } catch {
            return null;
        }
    }

    getStrategy(dataType) {
        const strategies = {
            'products': 'merge',
            'clients': 'merge', 
            'sales': 'timestamp',
            'debts': 'timestamp',
            'chickenSales': 'timestamp'
        };
        return strategies[dataType] || this.defaultStrategy;
    }
}

// Crear instancia global
window.tillupWebSocketClient = new TillUpWebSocketClient();

// Cargar historial de cambios guardado
try {
    const savedHistory = localStorage.getItem('sync_change_history');
    if (savedHistory) {
        window.tillupWebSocketClient.changeHistory = JSON.parse(savedHistory);
    }
} catch (error) {
    console.warn('Error cargando historial de cambios:', error);
}

console.log('🔄 TillUp WebSocket Client loaded with advanced sync features');

// Funciones globales para sincronización avanzada
window.syncSelectiveModules = (modules) => window.tillupWebSocketClient.syncSelectiveModules(modules);
window.getSyncHistory = (limit) => window.tillupWebSocketClient.changeHistory.slice(0, limit || 50);
window.cleanSyncHistory = (days) => window.tillupWebSocketClient.cleanOldHistory(days || 7);