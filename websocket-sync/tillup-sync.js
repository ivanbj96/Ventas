/**
 * TillUp WebSocket Sync - Sincronización en tiempo real
 * Compatible con tillup.online y desarrollo local
 * Versión mejorada con sincronización bidireccional completa
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
                // Usar directamente los datos recibidos (como en importación)
                await this.saveData(key, receivedData[key]);
                
                // Actualizar variable global inmediatamente
                if (window[key]) {
                    window[key] = receivedData[key];
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
        
        console.log('📥 Recibiendo:', type, 'de dispositivo:', deviceId);
        
        // Mostrar notificación
        this.showSyncNotification(type);
        
        // Solicitar datos completos inmediatamente
        this.requestDataUpdate();
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
            // Recargar datos desde storage
            await this.forceReloadData();
            
            // Actualizar todas las vistas como en importación
            if (typeof window.renderInventory === 'function') await window.renderInventory();
            if (typeof window.renderClients === 'function') await window.renderClients();
            if (typeof window.renderSalesProducts === 'function') await window.renderSalesProducts();
            if (typeof window.updateBalanceUI === 'function') await window.updateBalanceUI();
            if (typeof window.renderDebts === 'function') await window.renderDebts();
            if (typeof window.updateChickenStats === 'function') await window.updateChickenStats();
            if (typeof window.updateChickenSalesList === 'function') await window.updateChickenSalesList();
            
            console.log('🔄 Aplicación completamente actualizada');
        } catch (error) {
            console.error('Error actualizando aplicación:', error);
        } finally {
            this.isRefreshing = false;
        }
    }
    
    async updateAllViews() {
        try {
            const updateFunctions = [
                'renderInventory', 
                'renderClients',
                'renderSalesProducts',
                'updateBalanceUI',
                'renderDebts',
                'updateChickenStats',
                'updateChickenSalesList'
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
    
    updateAllDOMElements() {
        this.updateInventoryDOM();
        this.updateClientsDOM();
        this.updateSalesProductsDOM();
        this.updateClientSelectors();
        console.log('🔄 DOM actualizado');
    }
    
    updateClientSelectors() {
        try {
            const selectors = ['clientSelector', 'chickenClient', 'cartClientSelector'];
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
                    if (currentValue && window.clients.find(c => c.id === currentValue)) {
                        selector.value = currentValue;
                    }
                }
            });
        } catch (error) {
            console.log('Error actualizando selectores:', error);
        }
    }
    
    async forceReloadData() {
        for (const key of this.dataKeys) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    window[key] = JSON.parse(data);
                    console.log(`📦 ${key}: ${JSON.parse(data).length} elementos`);
                } else {
                    window[key] = [];
                }
            } catch (e) {
                console.log(`❌ Error cargando ${key}:`, e);
                window[key] = [];
            }
        }
    }
    
    // Función removida - ahora se usa updateAllDOMElements()
    
    updateInventoryDOM() {
        try {
            const inventoryList = document.getElementById('inventoryList');
            if (!inventoryList || !window.products) return;
            
            console.log('🔄 Actualizando inventario:', window.products.length, 'productos');
            
            if (window.products.length === 0) {
                inventoryList.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <i class="bi bi-box-seam fs-1 text-muted"></i>
                        <p class="mt-2 text-muted">No hay productos sincronizados</p>
                    </div>
                `;
                return;
            }
            
            const isGridView = !inventoryList.classList.contains('list-group');
            
            if (isGridView) {
                inventoryList.className = 'row gy-3';
                inventoryList.innerHTML = window.products.map(product => `
                    <div class="col-6 col-md-4 col-lg-3">
                        <div class="product-card-treinta" style="border: 2px solid #28a745;" onclick="showProductDetailModal('${product.id}')">
                            <div class="badge bg-success position-absolute top-0 end-0 m-1">🔄</div>
                            <img src="${product.image || 'icons/descarga.png'}" alt="${product.name}" onerror="this.src='icons/descarga.png'">
                            <h5>${product.name}</h5>
                            <div class="product-price">$${product.price.toFixed(2)}</div>
                            <div class="mt-2">
                                <span class="badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}">
                                    Stock: ${product.stock || 0}
                                </span>
                            </div>
                        </div>
                    </div>
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
            
            console.log('🔄 Actualizando clientes:', window.clients.length, 'clientes');
            
            if (window.clients.length === 0) {
                clientList.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <i class="bi bi-people fs-1 text-muted"></i>
                        <p class="mt-2 text-muted">No hay clientes sincronizados</p>
                    </div>
                `;
                return;
            }
            
            const isGridView = !clientList.classList.contains('list-group');
            
            if (isGridView) {
                clientList.className = 'row gy-3';
                clientList.innerHTML = window.clients.map(client => `
                    <div class="col-6 col-md-4 col-lg-3">
                        <div class="client-card-treinta" style="border: 2px solid #17a2b8;" onclick="showClientDetails('${client.id}')">
                            <div class="badge bg-info position-absolute top-0 end-0 m-1">🔄</div>
                            <div class="client-avatar">${client.name.charAt(0).toUpperCase()}</div>
                            <div class="client-name">${client.name}</div>
                            <div class="client-info">${client.phone || 'Sin teléfono'}</div>
                            <div class="mt-2">
                                <span class="badge ${client.debt > 0 ? 'bg-warning' : 'bg-success'}">
                                    ${client.debt > 0 ? `Deuda: $${client.debt.toFixed(2)}` : 'Sin deuda'}
                                </span>
                            </div>
                        </div>
                    </div>
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
            
            console.log('🔄 Actualizando productos de ventas');
            
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
                <div class="product-card-treinta" style="border: 2px solid #28a745;" onclick="addToCart('${product.id}')">
                    <div class="badge bg-success position-absolute top-0 end-0 m-1">🔄</div>
                    <img src="${product.image || 'icons/descarga.png'}" class="product-image-treinta" alt="${product.name}" onerror="this.src='icons/descarga.png'">
                    <div class="product-info-treinta">
                        <div class="product-name-treinta">${product.name}</div>
                        <div class="product-price-treinta">$${product.price.toFixed(2)}</div>
                        <div class="product-stock-treinta">
                            <i class="bi bi-box-seam"></i> Stock: ${product.stock || 0}
                        </div>
                        <div class="product-actions-treinta">
                            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); addToCart('${product.id}')" ${product.stock <= 0 ? 'disabled' : ''}>
                                <i class="bi bi-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.log('Error actualizando productos de ventas DOM:', error);
        }
    }
    
    showSyncNotification(type) {
        const messages = {
            'product_added': '📦 Producto sincronizado',
            'client_added': '👥 Cliente sincronizado', 
            'sale_completed': '💰 Venta sincronizada',
            'chicken_sale_added': '🐔 Venta de pollo sincronizada',
            'debt_payment': '💳 Pago sincronizado',
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
        console.log('🔄 Sincronización manual iniciada');
        this.syncData('manual_sync', { timestamp: Date.now() });
        setTimeout(() => this.refreshAppData(), 1000);
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

// CSS para notificaciones
const syncStyles = document.createElement('style');
syncStyles.textContent = `
    .swal2-sync-notification {
        font-size: 14px !important;
    }
    .swal2-sync-notification .swal2-title {
        font-size: 16px !important;
    }
`;
document.head.appendChild(syncStyles);

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que TillUp se cargue completamente
    setTimeout(() => {
        window.tillupSync = new TillUpSync();
        console.log('🚀 TillUp Sync inicializado');
        
        // Exponer métodos útiles globalmente
        window.syncStatus = () => window.tillupSync.getStatus();
        window.forceSync = () => window.tillupSync.forceSync();
        
        // Agregar CSS para elementos sincronizados
        const syncCSS = document.createElement('style');
        syncCSS.textContent = `
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
        `;
        document.head.appendChild(syncCSS);
        
    }, 2000);
});

// Limpiar conexión al cerrar página
window.addEventListener('beforeunload', () => {
    if (window.tillupSync && window.tillupSync.ws) {
        window.tillupSync.ws.close();
    }
});