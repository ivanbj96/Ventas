/**
 * TillUp WebSocket Sync - Sincronización en tiempo real MEJORADA
 * Compatible con tillup.online y desarrollo local
 * Versión completa con sincronización bidireccional y múltiples estrategias de UI
 */
class TillUpSync {
    constructor() {
        this.wsUrl = 'wss://6tmjquqm81.execute-api.us-east-1.amazonaws.com/prod';
        this.userId = localStorage.getItem('tillup_user_id') || this.generateUserId();
        this.deviceId = localStorage.getItem('tillup_device_id') || this.generateDeviceId();
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.lastSync = {};
        this.isRefreshing = false;
        this.syncQueue = [];
        this.isNewDevice = !localStorage.getItem('tillup_device_initialized');
        this.pendingInitialSync = false;
        this.dataKeys = ['products', 'clients', 'sales', 'debts', 'chickenSales', 'movements'];
        
        // Guardar IDs
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
        this.setupStorageWatcher();
    }
    
    connect() {
        const url = `${this.wsUrl}?userId=${this.userId}&token=tillup_${Date.now()}&deviceId=${this.deviceId}`;
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
            this.connected = true;
            this.reconnectAttempts = 0;
            console.log('🔄 TillUp Sync conectado:', this.userId);
            this.showNotification('Sincronización activada', 'success');
            
            // Procesar cola de mensajes pendientes
            this.processSyncQueue();
            
            // Si es un dispositivo nuevo, solicitar datos iniciales
            if (this.isNewDevice) {
                this.requestInitialData();
            } else {
                // Si no es nuevo, enviar nuestros datos para sincronizar
                this.sendCurrentData();
            }
        };
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Manejar diferentes tipos de mensajes
                switch (data.type) {
                    case 'sync_update':
                        if (data.payload.deviceId !== this.deviceId) {
                            this.handleSyncUpdate(data.payload);
                        }
                        break;
                    case 'initial_data_response':
                        this.handleInitialData(data.payload);
                        break;
                    case 'full_data_sync':
                        if (data.payload.deviceId !== this.deviceId) {
                            this.handleFullDataSync(data.payload);
                        }
                        break;
                    case 'data_request':
                        if (data.payload.requesterId !== this.deviceId) {
                            this.sendCurrentData(data.payload.requesterId);
                        }
                        break;
                    default:
                        console.log('Mensaje WebSocket no manejado:', event.data);
                }
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
    
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            setTimeout(() => this.connect(), delay);
        }
    }
    
    setupAppIntegration() {
        // Esperar a que la app se cargue completamente
        setTimeout(() => {
            this.interceptTillUpFunctions();
        }, 3000);
    }
    
    interceptTillUpFunctions() {
        // Interceptar función de agregar producto
        if (typeof window.addProduct === 'function') {
            const original = window.addProduct;
            window.addProduct = async (...args) => {
                const result = await original.apply(this, args);
                this.syncData('product_added', { timestamp: Date.now() });
                return result;
            };
        }
        
        // Interceptar función de agregar cliente
        if (typeof window.addClient === 'function') {
            const original = window.addClient;
            window.addClient = async (...args) => {
                const result = await original.apply(this, args);
                this.syncData('client_added', { timestamp: Date.now() });
                return result;
            };
        }
        
        // Interceptar función de finalizar venta
        if (typeof window.finalizeSale === 'function') {
            const original = window.finalizeSale;
            window.finalizeSale = async (...args) => {
                const result = await original.apply(this, args);
                this.syncData('sale_completed', { timestamp: Date.now() });
                return result;
            };
        }
        
        // Interceptar función de venta de pollos
        if (typeof window.processChickenSale === 'function') {
            const original = window.processChickenSale;
            window.processChickenSale = async (...args) => {
                const result = await original.apply(this, args);
                this.syncData('chicken_sale_added', { timestamp: Date.now() });
                return result;
            };
        }
        
        // Interceptar función de pago de deuda
        if (typeof window.payDebt === 'function') {
            const original = window.payDebt;
            window.payDebt = async (...args) => {
                const result = await original.apply(this, args);
                this.syncData('debt_payment', { timestamp: Date.now() });
                return result;
            };
        }
        
        // Interceptar formularios como fallback
        this.interceptForms();
        
        console.log('🔗 TillUp funciones interceptadas');
    }
    
    interceptForms() {
        // Formulario de productos
        const productForm = document.getElementById('formProduct');
        if (productForm) {
            productForm.addEventListener('submit', () => {
                setTimeout(() => this.syncData('product_added', { timestamp: Date.now() }), 500);
            });
        }
        
        // Formulario de clientes
        const clientForm = document.getElementById('formClient');
        if (clientForm) {
            clientForm.addEventListener('submit', () => {
                setTimeout(() => this.syncData('client_added', { timestamp: Date.now() }), 500);
            });
        }
        
        // Botón de finalizar venta en drawer
        const finalizeBtnDrawer = document.getElementById('finalizeBtnDrawer');
        if (finalizeBtnDrawer) {
            finalizeBtnDrawer.addEventListener('click', () => {
                setTimeout(() => this.syncData('sale_completed', { timestamp: Date.now() }), 500);
            });
        }
        
        // Formulario de pollos
        const chickenForm = document.getElementById('chickenSaleForm');
        if (chickenForm) {
            chickenForm.addEventListener('submit', () => {
                setTimeout(() => this.syncData('chicken_sale_added', { timestamp: Date.now() }), 500);
            });
        }
    }
    
    setupStorageWatcher() {
        // NO interceptar saveToStorage para evitar bucles infinitos
        // La sincronización se hará solo cuando el usuario haga acciones específicas
        console.log('📝 Storage watcher deshabilitado para evitar bucles');
    }
    
    syncData(type, data) {
        const syncMessage = {
            type: 'sync_update',
            payload: {
                type,
                data,
                userId: this.userId,
                deviceId: this.deviceId,
                timestamp: Date.now()
            }
        };
        
        if (this.connected) {
            this.ws.send(JSON.stringify(syncMessage));
            console.log('📤 Sincronizando:', type);
        } else {
            // Agregar a cola si no está conectado
            this.syncQueue.push(syncMessage);
        }
    }
    
    processSyncQueue() {
        while (this.syncQueue.length > 0 && this.connected) {
            const message = this.syncQueue.shift();
            this.ws.send(JSON.stringify(message));
        }
    }
    
    // Solicitar datos iniciales para dispositivos nuevos
    requestInitialData() {
        console.log('📱 Solicitando datos iniciales para dispositivo nuevo');
        this.pendingInitialSync = true;
        
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
        
        // Timeout para marcar como inicializado si no hay respuesta
        setTimeout(() => {
            if (this.pendingInitialSync) {
                this.markDeviceInitialized();
                this.showNotification('Dispositivo inicializado sin datos previos', 'info');
            }
        }, 10000);
    }
    
    // Enviar datos actuales a otros dispositivos
    sendCurrentData(targetDeviceId = null) {
        const currentData = this.getCurrentAppData();
        
        const message = {
            type: targetDeviceId ? 'initial_data_response' : 'full_data_sync',
            payload: {
                deviceId: this.deviceId,
                userId: this.userId,
                targetDeviceId,
                data: currentData,
                timestamp: Date.now()
            }
        };
        
        if (this.connected) {
            this.ws.send(JSON.stringify(message));
            console.log('📤 Enviando datos actuales:', Object.keys(currentData));
        }
    }
    
    // Obtener datos actuales de la aplicación
    getCurrentAppData() {
        const data = {};
        
        this.dataKeys.forEach(key => {
            try {
                const stored = localStorage.getItem(key);
                data[key] = stored ? JSON.parse(stored) : [];
            } catch (e) {
                data[key] = window[key] || [];
            }
        });
        
        return data;
    }
    
    // Manejar datos iniciales recibidos
    async handleInitialData(payload) {
        if (!this.pendingInitialSync) return;
        
        console.log('📥 Recibiendo datos iniciales:', payload);
        
        try {
            await this.mergeReceivedData(payload.data);
            this.markDeviceInitialized();
            this.showNotification('Datos sincronizados desde otro dispositivo', 'success');
            
            // Actualizar toda la interfaz
            setTimeout(() => {
                this.refreshAppData();
            }, 500);
            
        } catch (error) {
            console.error('Error procesando datos iniciales:', error);
            this.markDeviceInitialized();
        }
    }
    
    // Manejar sincronización completa de datos
    async handleFullDataSync(payload) {
        console.log('📥 Recibiendo sincronización completa de:', payload.deviceId);
        
        try {
            await this.mergeReceivedData(payload.data);
            this.showNotification('Datos actualizados desde otro dispositivo', 'info');
            
            setTimeout(() => {
                this.refreshAppData();
            }, 500);
            
        } catch (error) {
            console.error('Error en sincronización completa:', error);
        }
    }
    
    // Combinar datos recibidos con datos locales
    async mergeReceivedData(receivedData) {
        for (const key of this.dataKeys) {
            if (receivedData[key] && Array.isArray(receivedData[key])) {
                const localData = this.getLocalData(key);
                const mergedData = this.mergeArrays(localData, receivedData[key]);
                
                // Guardar datos combinados
                await this.saveData(key, mergedData);
                
                // Actualizar variable global si existe
                if (window[key]) {
                    window[key] = mergedData;
                }
            }
        }
    }
    
    // Obtener datos locales
    getLocalData(key) {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return window[key] || [];
        }
    }
    
    // Guardar datos
    async saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            
            // Usar saveToStorage si está disponible
            if (typeof window.saveToStorage === 'function') {
                await window.saveToStorage(key, data);
            }
        } catch (e) {
            console.error(`Error guardando ${key}:`, e);
        }
    }
    
    // Combinar arrays eliminando duplicados por ID
    mergeArrays(local, remote) {
        const merged = [...local];
        
        remote.forEach(remoteItem => {
            if (!remoteItem.id) return;
            
            const existingIndex = merged.findIndex(item => item.id === remoteItem.id);
            
            if (existingIndex === -1) {
                // Elemento nuevo, agregarlo
                merged.push(remoteItem);
            } else {
                // Elemento existe, mantener el más reciente
                const existing = merged[existingIndex];
                const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt || remoteItem.date || 0);
                const localTime = new Date(existing.updatedAt || existing.createdAt || existing.date || 0);
                
                if (remoteTime > localTime) {
                    merged[existingIndex] = remoteItem;
                }
            }
        });
        
        return merged;
    }
    
    // Marcar dispositivo como inicializado
    markDeviceInitialized() {
        localStorage.setItem('tillup_device_initialized', 'true');
        this.isNewDevice = false;
        this.pendingInitialSync = false;
    }
    
    handleSyncUpdate(payload) {
        const { type, timestamp, deviceId } = payload;
        
        // Evitar procesar el mismo evento múltiples veces
        const syncKey = `${type}_${timestamp}_${deviceId}`;
        if (this.lastSync[syncKey]) return;
        this.lastSync[syncKey] = true;
        
        // Limpiar cache viejo (mantener solo últimos 10)
        const keys = Object.keys(this.lastSync);
        if (keys.length > 10) {
            keys.slice(0, -10).forEach(key => delete this.lastSync[key]);
        }
        
        console.log('📥 Recibiendo:', type, 'de dispositivo:', deviceId);
        
        // Mostrar notificación y actualizar para todas las acciones
        this.showSyncNotification(type);
        
        // Solicitar datos actualizados del dispositivo que hizo el cambio
        setTimeout(() => {
            this.requestDataUpdate();
        }, 500);
    }
    
    // Solicitar actualización de datos
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
    
    async refreshAppData() {
        if (this.isRefreshing) return;
        this.isRefreshing = true;
        
        try {
            // Múltiples estrategias para actualizar la interfaz
            await this.updateAllViews();
            await this.forceReloadData();
            this.updateAllDOMElements();
            this.triggerAppRefresh();
            
            console.log('🔄 Aplicación completamente actualizada');
            
        } catch (error) {
            console.error('Error actualizando aplicación:', error);
        } finally {
            this.isRefreshing = false;
        }
    }
    
    async updateAllViews() {
        try {
            // Actualizar funciones principales de la app
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
            
            for (const funcName of updateFunctions) {
                if (typeof window[funcName] === 'function') {
                    try {
                        await window[funcName]();
                        console.log(`✅ ${funcName} actualizada`);
                    } catch (e) {
                        console.log(`❌ Error actualizando ${funcName}:`, e);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error en updateAllViews:', error);
        }
    }
    
    async forceReloadData() {
        // Recargar todos los datos críticos desde localStorage
        for (const key of this.dataKeys) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    window[key] = parsed;
                    console.log(`📦 ${key} recargado:`, parsed.length, 'elementos');
                } else {
                    window[key] = [];
                }
            } catch (e) {
                console.log(`❌ Error cargando ${key}:`, e);
                window[key] = [];
            }
        }
        
        // Actualizar selectores de clientes si existen
        this.updateClientSelectors();
        
        console.log('📦 Datos completamente recargados:', {
            products: window.products?.length || 0,
            clients: window.clients?.length || 0,
            sales: window.sales?.length || 0,
            debts: window.debts?.length || 0,
            chickenSales: window.chickenSales?.length || 0,
            movements: window.movements?.length || 0
        });
    }
    
    // Nueva función para actualizar todos los elementos del DOM
    updateAllDOMElements() {
        // Actualizar contadores y estadísticas
        this.updateCounters();
        
        // Actualizar listas y grids
        this.updateInventoryDOM();
        this.updateClientsDOM();
        this.updateSalesProductsDOM();
        this.updateDebtsDOM();
        this.updateBalanceDOM();
        
        // Actualizar selectores
        this.updateClientSelectors();
        
        console.log('🔄 DOM completamente actualizado');
    }
    
    // Actualizar contadores en la interfaz
    updateCounters() {
        try {
            // Contador de productos
            const productsCount = document.getElementById('productsCount');
            if (productsCount && window.products) {
                productsCount.textContent = `${window.products.length} productos`;
            }
            
            // Contador de clientes
            const clientsCount = document.getElementById('clientsCount');
            if (clientsCount && window.clients) {
                clientsCount.textContent = `${window.clients.length} clientes`;
            }
            
            // Contador de ventas de pollos
            const chickenSalesCount = document.getElementById('chickenSalesCount');
            if (chickenSalesCount && window.chickenSales) {
                chickenSalesCount.textContent = `${window.chickenSales.length} ventas`;
            }
            
        } catch (error) {
            console.log('Error actualizando contadores:', error);
        }
    }
    
    // Actualizar selectores de clientes
    updateClientSelectors() {
        try {
            const selectors = [
                'clientSelector',
                'chickenClient', 
                'cartClientSelector',
                'saleClientDrawer'
            ];
            
            selectors.forEach(selectorId => {
                const selector = document.getElementById(selectorId);
                if (selector && window.clients) {
                    const currentValue = selector.value;
                    
                    // Limpiar opciones
                    selector.innerHTML = '<option value="">Seleccionar cliente...</option>';
                    
                    // Agregar clientes
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
            
        } catch (error) {
            console.log('Error actualizando selectores:', error);
        }
    }
    
    // Disparar actualización completa de la app
    triggerAppRefresh() {
        try {
            // Disparar evento personalizado para que la app se actualice
            const event = new CustomEvent('tillupDataUpdated', {
                detail: {
                    source: 'websocket-sync',
                    timestamp: Date.now(),
                    deviceId: this.deviceId
                }
            });
            
            document.dispatchEvent(event);
            
            // Llamar función de actualización global si existe
            if (typeof window.updateAllViews === 'function') {
                window.updateAllViews();
            }
            
            // Forzar re-renderizado de la vista actual
            const currentView = this.getCurrentView();
            if (currentView) {
                this.refreshCurrentView(currentView);
            }
            
        } catch (error) {
            console.log('Error en triggerAppRefresh:', error);
        }
    }
    
    // Obtener vista actual
    getCurrentView() {
        const views = ['balance', 'sales', 'chickens', 'debt', 'clients', 'inventory'];
        
        for (const view of views) {
            const element = document.getElementById(`view-${view}`);
            if (element && !element.classList.contains('d-none')) {
                return view;
            }
        }
        
        return null;
    }
    
    // Refrescar vista actual
    refreshCurrentView(view) {
        try {
            switch (view) {
                case 'inventory':
                    if (typeof window.renderInventory === 'function') {
                        window.renderInventory();
                    }
                    break;
                case 'sales':
                    if (typeof window.renderSalesProducts === 'function') {
                        window.renderSalesProducts();
                    }
                    break;
                case 'clients':
                    if (typeof window.renderClients === 'function') {
                        window.renderClients();
                    }
                    break;
                case 'debt':
                    if (typeof window.renderDebts === 'function') {
                        window.renderDebts();
                    }
                    break;
                case 'balance':
                    if (typeof window.updateBalanceUI === 'function') {
                        window.updateBalanceUI();
                    }
                    break;
                case 'chickens':
                    if (typeof window.updateChickenStats === 'function') {
                        window.updateChickenStats();
                    }
                    if (typeof window.updateChickenSalesList === 'function') {
                        window.updateChickenSalesList();
                    }
                    break;
            }
        } catch (error) {
            console.log(`Error refrescando vista ${view}:`, error);
        }
    }
    
    updateInventoryDOM() {
        try {
            const inventoryList = document.getElementById('inventoryList');
            if (!inventoryList || !window.products) return;
            
            console.log('🔄 Actualizando inventario DOM:', window.products.length, 'productos');
            
            // Si no hay productos, mostrar mensaje
            if (window.products.length === 0) {
                inventoryList.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <i class="bi bi-box-seam fs-1 text-muted"></i>
                        <p class="mt-2 text-muted">No hay productos sincronizados</p>
                    </div>
                `;
                return;
            }
            
            // Determinar si usar vista de grid o lista
            const isGridView = !inventoryList.classList.contains('list-group');
            
            if (isGridView) {
                inventoryList.className = 'row gy-3';
                inventoryList.innerHTML = window.products.map(product => `
                    <div class="col-6 col-md-4 col-lg-3">
                        <div class="product-card-treinta" style="border: 2px solid #28a745; position: relative;" onclick="showProductDetailModal('${product.id}')">
                            <div class="badge bg-success position-absolute top-0 end-0 m-1">
                                <i class="bi bi-arrow-repeat"></i>
                            </div>
                            <img src="${product.image || 'icons/descarga.png'}" alt="${product.name}" onerror="this.src='icons/descarga.png'">
                            <h5>🔄 ${product.name}</h5>
                            <div class="product-category">${product.category || '-'}</div>
                            <div class="product-price">$${product.price.toFixed(2)}</div>
                            <div class="product-cost">Costo: $${(product.cost || 0).toFixed(2)}</div>
                            <div class="mt-2">
                                <span class="badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}">
                                    ${product.stock > 0 ? 'Stock: ' + product.stock : 'Sin stock'}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                inventoryList.className = 'list-group';
                inventoryList.innerHTML = window.products.map(product => `
                    <li class="list-group-item d-flex justify-content-between align-items-center" style="border-left: 4px solid #28a745;">
                        <div class="d-flex align-items-center">
                            <img src="${product.image || 'icons/descarga.png'}" alt="${product.name}" 
                                 style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; margin-right: 1rem;" 
                                 onerror="this.src='icons/descarga.png'">
                            <div>
                                <h6 class="mb-0">🔄 ${product.name}</h6>
                                <small class="text-muted">${product.category || '-'}</small>
                                <div class="badge bg-success ms-2">Sincronizado</div>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold">$${product.price.toFixed(2)}</div>
                            <small class="text-muted">Stock: ${product.stock || 0}</small>
                        </div>
                    </li>
                `).join('');
            }
            
        } catch (error) {
            console.log('Error actualizando inventario DOM:', error);
        }
    }
    
    updateClientsDOM() {
        try {
            const clientList = document.getElementById('clientList');
            if (!clientList || !window.clients) return;
            
            console.log('🔄 Actualizando clientes DOM:', window.clients.length, 'clientes');
            
            if (window.clients.length === 0) {
                clientList.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <i class="bi bi-people fs-1 text-muted"></i>
                        <p class="mt-2 text-muted">No hay clientes sincronizados</p>
                    </div>
                `;
                return;
            }
            
            // Determinar si usar vista de grid o lista
            const isGridView = !clientList.classList.contains('list-group');
            
            if (isGridView) {
                clientList.className = 'row gy-3';
                clientList.innerHTML = window.clients.map(client => `
                    <div class="col-6 col-md-4 col-lg-3">
                        <div class="client-card-treinta" style="border: 2px solid #17a2b8; position: relative;" onclick="showClientDetails('${client.id}')">
                            <div class="badge bg-info position-absolute top-0 end-0 m-1">
                                <i class="bi bi-arrow-repeat"></i>
                            </div>
                            ${client.photo ? 
                                `<img src="${client.photo}" alt="${client.name}" class="client-photo">` :
                                `<div class="client-avatar">${client.name.charAt(0).toUpperCase()}</div>`
                            }
                            <div class="client-name">🔄 ${client.name}</div>
                            <div class="client-info">${client.phone || 'Sin teléfono'}</div>
                            <div class="client-info">${client.address || 'Sin dirección'}</div>
                            <div class="mt-2">
                                <span class="badge ${client.debt > 0 ? 'bg-warning' : 'bg-success'}">
                                    ${client.debt > 0 ? `Deuda: $${client.debt.toFixed(2)}` : 'Sin deuda'}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                clientList.className = 'list-group';
                clientList.innerHTML = window.clients.map(client => `
                    <li class="list-group-item d-flex justify-content-between align-items-center" style="border-left: 4px solid #17a2b8;">
                        <div class="d-flex align-items-center">
                            ${client.photo ? 
                                `<img src="${client.photo}" alt="${client.name}" class="client-photo" style="margin: 0 1rem 0 0;">` :
                                `<div class="client-avatar" style="margin: 0 1rem 0 0;">${client.name.charAt(0).toUpperCase()}</div>`
                            }
                            <div>
                                <h6 class="mb-0">🔄 ${client.name}</h6>
                                <small class="text-muted">${client.phone || 'Sin teléfono'}</small>
                                <div class="badge bg-info ms-2">Sincronizado</div>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold">${client.debt > 0 ? `$${client.debt.toFixed(2)}` : 'Sin deuda'}</div>
                            <small class="text-muted">${client.address || 'Sin dirección'}</small>
                        </div>
                    </li>
                `).join('');
            }
            
        } catch (error) {
            console.log('Error actualizando clientes DOM:', error);
        }
    }
    
    updateSalesProductsDOM() {
        try {
            const salesGrid = document.getElementById('salesProductsGrid');
            if (!salesGrid || !window.products) return;
            
            console.log('🔄 Actualizando productos de ventas DOM');
            
            if (window.products.length === 0) {
                salesGrid.innerHTML = `
                    <div class="text-center py-4" style="grid-column: 1 / -1;">
                        <i class="bi bi-box-seam" style="font-size: 3rem; color: #ccc;"></i>
                        <p class="text-muted mt-2">No hay productos sincronizados</p>
                    </div>
                `;
                return;
            }
            
            salesGrid.innerHTML = window.products.map(product => `
                <div class="product-card-treinta" style="border: 2px solid #28a745; position: relative;" onclick="addToCart('${product.id}')">
                    <div class="badge bg-success position-absolute top-0 end-0 m-1" style="z-index: 10;">
                        <i class="bi bi-arrow-repeat"></i>
                    </div>
                    <img src="${product.image || 'icons/descarga.png'}" 
                         class="product-image-treinta" alt="${product.name}" onerror="this.src='icons/descarga.png'">
                    <div class="product-info-treinta">
                        <div class="product-name-treinta">🔄 ${product.name}</div>
                        <div class="product-price-treinta">$${product.price.toFixed(2)}</div>
                        <div class="product-stock-treinta">
                            <i class="bi bi-box-seam"></i> Stock: ${product.stock || 0}
                        </div>
                        <div class="product-actions-treinta">
                            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); addToCart('${product.id}')" ${product.stock <= 0 ? 'disabled' : ''}>
                                <i class="bi bi-plus"></i>
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="event.stopPropagation(); showProductDetailModal('${product.id}')">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.log('Error actualizando productos de ventas DOM:', error);
        }
    }
    
    // Actualizar DOM de deudas
    updateDebtsDOM() {
        try {
            const debtList = document.getElementById('debtList');
            if (!debtList || !window.debts) return;
            
            console.log('🔄 Actualizando deudas DOM:', window.debts.length, 'deudas');
            
            if (window.debts.length === 0) {
                debtList.innerHTML = `<div class='alert alert-secondary text-center'>Sin deudas sincronizadas</div>`;
                return;
            }
            
            // Llamar a la función de renderizado si existe
            if (typeof window.renderDebts === 'function') {
                window.renderDebts();
            }
            
        } catch (error) {
            console.log('Error actualizando deudas DOM:', error);
        }
    }
    
    // Actualizar DOM de balance
    updateBalanceDOM() {
        try {
            // Llamar a las funciones de balance si existen
            if (typeof window.updateBalanceUI === 'function') {
                window.updateBalanceUI();
            }
            
            if (typeof window.renderBalanceGrid === 'function') {
                window.renderBalanceGrid();
            }
            
        } catch (error) {
            console.log('Error actualizando balance DOM:', error);
        }
    }
    
    showSyncNotification(type) {
        const messages = {
            'product_added': '📦 Nuevo producto sincronizado',
            'client_added': '👥 Nuevo cliente sincronizado', 
            'sale_completed': '💰 Nueva venta sincronizada',
            'chicken_sale_added': '🐔 Nueva venta de pollo sincronizada',
            'debt_payment': '💳 Pago sincronizado',
            'data_updated': '🔄 Datos actualizados',
            'manual_sync': '🔄 Sincronización manual completada'
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
                title: message,
                customClass: {
                    popup: 'swal2-sync-notification'
                }
            });
        } else {
            console.log(`🔔 ${message}`);
        }
    }
    
    // Método público para sincronizar manualmente
    forceSync() {
        console.log('🔄 Forzando sincronización manual');
        this.sendCurrentData();
        this.syncData('manual_sync', { timestamp: Date.now() });
    }
    
    // Método público para obtener estado
    getStatus() {
        return {
            connected: this.connected,
            userId: this.userId,
            deviceId: this.deviceId,
            queueSize: this.syncQueue.length,
            isNewDevice: this.isNewDevice,
            pendingInitialSync: this.pendingInitialSync,
            dataKeys: this.dataKeys,
            lastSync: Object.keys(this.lastSync).length
        };
    }
    
    // Método público para resetear dispositivo
    resetDevice() {
        localStorage.removeItem('tillup_device_initialized');
        localStorage.removeItem('tillup_user_id');
        localStorage.removeItem('tillup_device_id');
        this.isNewDevice = true;
        this.pendingInitialSync = false;
        console.log('🔄 Dispositivo reseteado - recargar página para reinicializar');
    }
}

// CSS para notificaciones y elementos sincronizados
const syncStyles = document.createElement('style');
syncStyles.textContent = `
    .swal2-sync-notification {
        font-size: 14px !important;
    }
    .swal2-sync-notification .swal2-title {
        font-size: 16px !important;
    }
    
    /* Estilos para elementos sincronizados */
    .product-card-treinta[style*="border: 2px solid #28a745"] {
        animation: syncPulse 2s ease-in-out;
    }
    
    .client-card-treinta[style*="border: 2px solid #17a2b8"] {
        animation: syncPulse 2s ease-in-out;
    }
    
    @keyframes syncPulse {
        0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
        100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
    }
    
    .badge[style*="z-index: 10"] {
        animation: badgeBounce 1s ease-in-out;
    }
    
    @keyframes badgeBounce {
        0%, 20%, 60%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        80% { transform: translateY(-5px); }
    }
`;
document.head.appendChild(syncStyles);

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que TillUp se cargue completamente
    setTimeout(() => {
        window.tillupSync = new TillUpSync();
        console.log('🚀 TillUp Sync inicializado con sincronización bidireccional');
        
        // Exponer métodos útiles globalmente
        window.syncStatus = () => window.tillupSync.getStatus();
        window.forceSync = () => window.tillupSync.forceSync();
        window.resetSyncDevice = () => window.tillupSync.resetDevice();
        
        // Agregar listener para eventos de datos actualizados
        document.addEventListener('tillupDataUpdated', (event) => {
            console.log('📡 Evento de datos actualizados recibido:', event.detail);
        });
        
    }, 2000);
});

// Limpiar conexión al cerrar página
window.addEventListener('beforeunload', () => {
    if (window.tillupSync && window.tillupSync.ws) {
        // Enviar datos finales antes de cerrar
        window.tillupSync.sendCurrentData();
        window.tillupSync.ws.close();
    }
});

// Manejar cambios de visibilidad de la página
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.tillupSync) {
        // Página visible de nuevo, verificar conexión
        if (!window.tillupSync.connected) {
            console.log('🔄 Página visible - reconectando...');
            window.tillupSync.connect();
        } else {
            // Solicitar actualización de datos
            window.tillupSync.requestDataUpdate();
        }
    }
});