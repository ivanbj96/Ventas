// ========================================
// 🔄 GESTOR DE SINCRONIZACIÓN TILLUP
// ========================================
// Gestor principal para sincronización de datos entre dispositivos

// Importar función setChickenSales si está disponible
let setChickenSales = null;
try {
    if (typeof window !== 'undefined' && window.setChickenSales) {
        setChickenSales = window.setChickenSales;
    }
} catch (e) {
    console.log('setChickenSales no disponible en window');
}

class TillUpSyncManager {
    constructor() {
        this.isEnabled = false;
        this.client = null;
        this.userId = null;
        this.syncCallbacks = {
            product: [],
            client: [],
            sale: [],
            chicken_sale: [],
            debt: []
        };
        
        console.log('🔄 TillUp Sync Manager initialized');
    }

    init(userId) {
        this.userId = userId;
        this.isEnabled = true;
        
        // Usar el cliente WebSocket global
        try {
            this.client = window.tillupWebSocketClient;
        } catch (error) {
            console.error('Error accessing WebSocket client:', error);
        }
        
        if (this.client) {
            try {
                this.client.init(userId);
            } catch (error) {
                console.error('Error initializing WebSocket client:', error);
            }
        }
        
        console.log('🔄 Sync Manager enabled for user:', userId);
    }

    disable() {
        this.isEnabled = false;
        if (this.client) {
            try {
                this.client.disconnect();
            } catch (error) {
                console.error('Error disconnecting WebSocket client:', error);
            }
        }
        console.log('🔄 Sync Manager disabled');
    }

    // Manejar datos entrantes desde otros dispositivos
    handleIncomingData(data) {
        if (!this.isEnabled) return;

        try {
            const { action, data: payload, userId, deviceId } = data || {};

        // Validar que no sea de este mismo dispositivo
        if (deviceId === localStorage.getItem('tillup_device_id')) {
            console.log('🔄 Ignorando datos del mismo dispositivo en sync manager');
            return;
        }

        console.log('🔄 Procesando acción:', action, 'de usuario:', userId);
        
        // Mostrar notificación de recepción
        if (window.syncNotifications) {
            window.syncNotifications.showSyncNotification('receiving');
        }

        switch (action) {
            case 'sync_product':
                this.handleProductSync(payload);
                this.updateUIAfterItemSync('products');
                this.forceImmediateUIUpdate();
                break;
            case 'sync_client':
                this.handleClientSync(payload);
                this.updateUIAfterItemSync('clients');
                this.forceImmediateUIUpdate();
                break;
            case 'sync_sale':
                this.handleSaleSync(payload);
                this.updateUIAfterItemSync('sales');
                this.forceImmediateUIUpdate();
                break;
            case 'sync_chicken_sale':
                this.handleChickenSaleSync(payload);
                this.updateUIAfterItemSync('chickenSales');
                this.forceImmediateUIUpdate();
                break;
            case 'sync_debt':
                this.handleDebtSync(payload);
                this.updateUIAfterItemSync('debts');
                this.forceImmediateUIUpdate();
                break;
            case 'sync_chicken_prices':
                this.handleChickenPricesSync(payload);
                break;
            case 'full_sync_data':
                this.handleFullSyncData(payload);
                this.updateUIAfterFullSync();
                this.forceImmediateUIUpdate();
                break;
            case 'request_sync_data':
                this.handleSyncDataRequest(payload);
                break;
            case 'test_message':
                this.handleTestMessage(payload);
                break;
            default:
                console.log('🔄 Acción desconocida:', action, 'data:', data);
        }
        } catch (error) {
            console.error('Error handling incoming data:', error);
        }
    }

    handleProductSync(product) {
        console.log('🔄 Syncing product:', product);
        
        if (product.deleted) {
            this.deleteProduct(product.id);
            return;
        }
        
        this.updateProduct(product);
        this.showQuickSyncIndicator('product');
    }

    deleteProduct(productId) {
        let productsData = window.products || [];
        if (!Array.isArray(productsData)) {
            productsData = JSON.parse(localStorage.getItem('products') || '[]');
        }
        
        const updatedProducts = productsData.filter(p => p.id !== productId);
        this.saveProducts(updatedProducts);
        this.updateProductUI();
    }

    updateProduct(product) {
        let productsData = window.products || [];
        if (!Array.isArray(productsData)) {
            productsData = JSON.parse(localStorage.getItem('products') || '[]');
        }
        
        const existingIndex = productsData.findIndex(p => p.id === product.id);
        if (existingIndex >= 0) {
            productsData[existingIndex] = product;
        } else {
            productsData.push(product);
        }
        
        this.saveProducts(productsData);
        this.updateProductUI();
    }

    saveProducts(productsData) {
        if (typeof window.setProducts === 'function') {
            window.setProducts(productsData);
        } else if (window.products && Array.isArray(window.products)) {
            window.products.length = 0;
            window.products.push(...productsData);
        }
        
        if (typeof saveToStorage === 'function') {
            saveToStorage('products', productsData);
        } else {
            localStorage.setItem('products', JSON.stringify(productsData));
        }
    }

    updateProductUI() {
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderSalesProducts === 'function') renderSalesProducts();
    }

    handleClientSync(client) {
        console.log('🔄 Syncing client:', client);
        
        // Manejar eliminación de cliente
        if (client.deleted) {
            const currentClients = JSON.parse(localStorage.getItem('clients') || '[]');
            const updatedClients = currentClients.filter(c => c.id !== client.id);
            
            // Guardar en localStorage PRIMERO
            localStorage.setItem('clients', JSON.stringify(updatedClients));
            
            // Usar función setter si está disponible
            if (typeof window.setClients === 'function') {
                window.setClients(updatedClients);
            } else if (window.clients && Array.isArray(window.clients)) {
                window.clients.length = 0;
                window.clients.push(...updatedClients);
            }
            
            // Usar saveToStorage si está disponible
            if (typeof saveToStorage === 'function') {
                saveToStorage('clients', updatedClients);
            }
            
            // Actualizar UI silenciosamente
            this.forceUpdateClientUI();
            return;
        }
        
        let clientsData = window.clients || [];
        if (!Array.isArray(clientsData)) {
            clientsData = JSON.parse(localStorage.getItem('clients') || '[]');
        }
        
        const existingIndex = clientsData.findIndex(c => c.id === client.id);
        if (existingIndex >= 0) {
            clientsData[existingIndex] = client;
        } else {
            clientsData.push(client);
        }
        
        this.saveClients(clientsData);
        this.forceUpdateClientUI();
        
        this.showQuickSyncIndicator('client');
    }

    saveClients(clientsData) {
        localStorage.setItem('clients', JSON.stringify(clientsData));
        
        if (typeof window.setClients === 'function') {
            window.setClients(clientsData);
        } else if (window.clients && Array.isArray(window.clients)) {
            window.clients.length = 0;
            window.clients.push(...clientsData);
        }
        
        if (typeof saveToStorage === 'function') {
            saveToStorage('clients', clientsData);
        }
    }

    handleSaleSync(sale) {
        console.log('🔄 Syncing sale:', sale);
        
        // Obtener ventas actuales
        let salesData = window.sales || [];
        if (!Array.isArray(salesData)) {
            salesData = JSON.parse(localStorage.getItem('sales') || '[]');
        }
        
        const existingIndex = salesData.findIndex(s => s.id === sale.id);
        
        if (existingIndex === -1) {
            salesData.push(sale);
            this.saveSales(salesData);
            this.updateSalesUI();
        } else {
            console.log('🔄 Venta ya existe, omitiendo:', sale.id);
        }
    }

    saveSales(salesData) {
        if (typeof window.setSales === 'function') {
            window.setSales(salesData);
        } else if (window.sales && Array.isArray(window.sales)) {
            window.sales.length = 0;
            window.sales.push(...salesData);
        }
        
        if (typeof saveToStorage === 'function') {
            saveToStorage('sales', salesData);
        } else {
            localStorage.setItem('sales', JSON.stringify(salesData));
        }
    }

    updateSalesUI() {
        if (typeof renderBalanceGrid === 'function') renderBalanceGrid();
        if (typeof updateBalanceUI === 'function') updateBalanceUI();
    }

    handleChickenSaleSync(sale) {
        console.log('🔄 Syncing chicken sale:', sale);
        
        // Decodificar si viene en Base64
        let decodedSale = sale;
        if (typeof sale === 'string') {
            try {
                const decoded = atob(sale);
                decodedSale = JSON.parse(decoded);
                console.log('🔄 Venta decodificada:', decodedSale);
            } catch (error) {
                console.error('⚠️ Error decodificando venta:', error);
                return;
            }
        }
        
        if (!decodedSale || !decodedSale.id) {
            console.warn('⚠️ Venta inválida:', decodedSale);
            return;
        }
        
        // Obtener ventas actuales desde localStorage
        let chickenSales = JSON.parse(localStorage.getItem('chickenSales') || '[]');
        const existingIndex = chickenSales.findIndex(s => s.id === decodedSale.id);
        
        if (existingIndex === -1) {
            // Agregar nueva venta
            chickenSales.push(decodedSale);
            
            // Actualizar localStorage
            localStorage.setItem('chickenSales', JSON.stringify(chickenSales));
            
            // Actualizar estado global usando setChickenSales si está disponible
            if (typeof setChickenSales === 'function') {
                setChickenSales(chickenSales);
            } else if (window.setChickenSales && typeof window.setChickenSales === 'function') {
                window.setChickenSales(chickenSales);
            }
            
            // Actualizar usando saveToStorage si está disponible
            if (typeof saveToStorage === 'function') {
                saveToStorage('chickenSales', chickenSales);
            }
            
            // Actualizar rendering module
            if (typeof updateChickenSalesFromStorage === 'function') {
                updateChickenSalesFromStorage();
            }
            
            // Actualizar UI
            if (typeof updateChickenStats === 'function') {
                updateChickenStats();
            }
            if (typeof updateChickenSalesList === 'function') {
                updateChickenSalesList();
            }
            if (typeof updateBalanceUI === 'function') {
                updateBalanceUI();
            }
            
            console.log('✅ Venta de pollos agregada exitosamente:', decodedSale.id);
        } else {
            console.log('🔄 Venta de pollos ya existe, omitiendo:', decodedSale.id);
        }
    }

    handleDebtSync(debt) {
        console.log('🔄 Syncing debt:', debt);
        
        // Obtener deudas actuales desde localStorage
        const currentDebts = JSON.parse(localStorage.getItem('debts') || '[]');
        const existingIndex = currentDebts.findIndex(d => d.id === debt.id);
        
        if (existingIndex >= 0) {
            currentDebts[existingIndex] = debt;
        } else {
            currentDebts.push(debt);
        }
        
        // Actualizar localStorage primero
        localStorage.setItem('debts', JSON.stringify(currentDebts));
        
        // Actualizar estado global
        if (typeof window.setDebts === 'function') {
            window.setDebts(currentDebts);
        }
        
        // Actualizar UI
        if (typeof renderDebts === 'function') renderDebts();
    }

    handleChickenPricesSync(pricesData) {
        console.log('🔄 Syncing chicken prices:', pricesData);
        
        if (pricesData && typeof pricesData.pricePerPound === 'number' && typeof pricesData.costPerPound === 'number') {
            // Actualizar localStorage
            localStorage.setItem('pricePerPound', pricesData.pricePerPound.toString());
            localStorage.setItem('costPerPound', pricesData.costPerPound.toString());
            
            // Llamar función de recepción si existe
            if (window.receiveChickenPrices && typeof window.receiveChickenPrices === 'function') {
                window.receiveChickenPrices(pricesData);
            }
            
            console.log('✅ Precios de pollos actualizados:', pricesData);
        }
    }

    handleFullSyncData(syncData) {
        console.log('🔄 Handling full sync data:', syncData);
        
        // Decodificar si viene en Base64
        let decodedData = syncData;
        if (typeof syncData === 'string') {
            try {
                const decoded = atob(syncData);
                decodedData = JSON.parse(decoded);
                console.log('🔄 Datos completos decodificados:', decodedData);
            } catch (error) {
                console.error('⚠️ Error decodificando datos completos:', error);
                return;
            }
        }
        
        let updated = false;
        
        // Actualizar productos
        if (decodedData.products && Array.isArray(decodedData.products) && decodedData.products.length > 0) {
            let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
            decodedData.products.forEach(syncProduct => {
                const existingIndex = localProducts.findIndex(p => p.id === syncProduct.id);
                if (existingIndex >= 0) {
                    localProducts[existingIndex] = syncProduct;
                } else {
                    localProducts.push(syncProduct);
                    updated = true;
                }
            });
            
            localStorage.setItem('products', JSON.stringify(localProducts));
            if (window.products && Array.isArray(window.products)) {
                window.products.length = 0;
                window.products.push(...localProducts);
            }
            
            if (typeof saveToStorage === 'function') {
                saveToStorage('products', localProducts);
            }
        }
        
        // Actualizar clientes
        if (decodedData.clients && Array.isArray(decodedData.clients) && decodedData.clients.length > 0) {
            let localClients = JSON.parse(localStorage.getItem('clients') || '[]');
            decodedData.clients.forEach(syncClient => {
                const existingIndex = localClients.findIndex(c => c.id === syncClient.id);
                if (existingIndex >= 0) {
                    localClients[existingIndex] = syncClient;
                } else {
                    localClients.push(syncClient);
                    updated = true;
                }
            });
            
            localStorage.setItem('clients', JSON.stringify(localClients));
            if (window.clients && Array.isArray(window.clients)) {
                window.clients.length = 0;
                window.clients.push(...localClients);
            }
            
            if (typeof saveToStorage === 'function') {
                saveToStorage('clients', localClients);
            }
        }
        
        // Actualizar ventas
        if (decodedData.sales && Array.isArray(decodedData.sales) && decodedData.sales.length > 0) {
            let localSales = JSON.parse(localStorage.getItem('sales') || '[]');
            decodedData.sales.forEach(syncSale => {
                const existingIndex = localSales.findIndex(s => s.id === syncSale.id);
                if (existingIndex === -1) {
                    localSales.push(syncSale);
                    updated = true;
                }
            });
            
            localStorage.setItem('sales', JSON.stringify(localSales));
            if (window.sales && Array.isArray(window.sales)) {
                window.sales.length = 0;
                window.sales.push(...localSales);
            }
            
            if (typeof saveToStorage === 'function') {
                saveToStorage('sales', localSales);
            }
        }
        
        // Actualizar deudas
        if (decodedData.debts && Array.isArray(decodedData.debts) && decodedData.debts.length > 0) {
            let localDebts = JSON.parse(localStorage.getItem('debts') || '[]');
            decodedData.debts.forEach(syncDebt => {
                const existingIndex = localDebts.findIndex(d => d.id === syncDebt.id);
                if (existingIndex >= 0) {
                    localDebts[existingIndex] = syncDebt;
                } else {
                    localDebts.push(syncDebt);
                    updated = true;
                }
            });
            
            localStorage.setItem('debts', JSON.stringify(localDebts));
            if (window.debts && Array.isArray(window.debts)) {
                window.debts.length = 0;
                window.debts.push(...localDebts);
            }
            
            if (typeof saveToStorage === 'function') {
                saveToStorage('debts', localDebts);
            }
        }
        
        // Actualizar ventas de pollos
        if (decodedData.chickenSales && Array.isArray(decodedData.chickenSales) && decodedData.chickenSales.length > 0) {
            let localChickenSales = JSON.parse(localStorage.getItem('chickenSales') || '[]');
            decodedData.chickenSales.forEach(syncChickenSale => {
                const existingIndex = localChickenSales.findIndex(s => s.id === syncChickenSale.id);
                if (existingIndex === -1) {
                    localChickenSales.push(syncChickenSale);
                    updated = true;
                }
            });
            
            localStorage.setItem('chickenSales', JSON.stringify(localChickenSales));
            
            if (typeof setChickenSales === 'function') {
                setChickenSales(localChickenSales);
            } else if (window.setChickenSales && typeof window.setChickenSales === 'function') {
                window.setChickenSales(localChickenSales);
            }
            
            if (typeof saveToStorage === 'function') {
                saveToStorage('chickenSales', localChickenSales);
            }
        }
        
        // Actualizar rendering module
        if (typeof updateChickenSalesFromStorage === 'function') {
            updateChickenSalesFromStorage();
        }
        
        // Actualizar toda la UI inmediatamente
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderClients === 'function') renderClients();
        if (typeof renderDebts === 'function') renderDebts();
        if (typeof renderSalesProducts === 'function') renderSalesProducts();
        if (typeof renderBalanceGrid === 'function') renderBalanceGrid();
        if (typeof updateBalanceUI === 'function') updateBalanceUI();
        if (typeof updateClientSelector === 'function') updateClientSelector();
        if (typeof updateChickenStats === 'function') updateChickenStats();
        if (typeof updateChickenSalesList === 'function') updateChickenSalesList();
        if (window.updateClientSelector) window.updateClientSelector();
        
        console.log('🔄 Sincronización completa procesada');
        this.refreshAllUI();
        
        // Mostrar notificación de éxito
        if (window.syncNotifications) {
            window.syncNotifications.showSyncNotification('success');
            window.syncNotifications.showDataStats(decodedData);
        }
    }

    refreshAllUI() {
        // Actualizar todas las vistas instantáneamente
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderClients === 'function') renderClients();
        if (typeof renderDebts === 'function') renderDebts();
        if (typeof renderSalesProducts === 'function') renderSalesProducts();
        if (typeof renderBalanceGrid === 'function') renderBalanceGrid();
        if (typeof updateBalanceUI === 'function') updateBalanceUI();
        if (typeof updateClientSelector === 'function') updateClientSelector();
        if (typeof updateChickenStats === 'function') updateChickenStats();
        if (typeof updateChickenSalesList === 'function') updateChickenSalesList();
        if (window.updateClientSelector) window.updateClientSelector();
    }

    updateUIAfterItemSync(dataType) {
        // Actualizar UI específica según el tipo de dato
        switch (dataType) {
            case 'products':
                if (typeof renderInventory === 'function') renderInventory();
                if (typeof renderSalesProducts === 'function') renderSalesProducts();
                break;
            case 'clients':
                if (typeof renderClients === 'function') renderClients();
                if (typeof updateClientSelector === 'function') updateClientSelector();
                if (window.updateClientSelector) window.updateClientSelector();
                break;
            case 'sales':
                if (typeof renderBalanceGrid === 'function') renderBalanceGrid();
                if (typeof updateBalanceUI === 'function') updateBalanceUI();
                break;
            case 'debts':
                if (typeof renderDebts === 'function') renderDebts();
                break;
            case 'chickenSales':
                if (typeof updateChickenStats === 'function') updateChickenStats();
                if (typeof updateChickenSalesList === 'function') updateChickenSalesList();
                if (typeof updateBalanceUI === 'function') updateBalanceUI();
                break;
        }
    }

    updateUIAfterFullSync() {
        // Actualizar todas las vistas después de sincronización completa
        this.refreshAllUI();
    }
    
    reloadDataFromStorage() {
        // Recargar datos desde localStorage al estado global
        try {
            const productsData = JSON.parse(localStorage.getItem('products') || '[]');
            const clientsData = JSON.parse(localStorage.getItem('clients') || '[]');
            const salesData = JSON.parse(localStorage.getItem('sales') || '[]');
            const debtsData = JSON.parse(localStorage.getItem('debts') || '[]');
            const chickenSalesData = JSON.parse(localStorage.getItem('chickenSales') || '[]');
            
            console.log('🔄 Recargando datos:', {
                products: productsData.length,
                clients: clientsData.length,
                sales: salesData.length,
                debts: debtsData.length,
                chickenSales: chickenSalesData.length
            });
            
            // NO llamar a los setters que resetean los datos
            // Solo actualizar los arrays globales directamente
            if (window.products && Array.isArray(window.products)) {
                window.products.length = 0;
                window.products.push(...productsData);
            }
            
            if (window.clients && Array.isArray(window.clients)) {
                window.clients.length = 0;
                window.clients.push(...clientsData);
            }
            
            if (window.sales && Array.isArray(window.sales)) {
                window.sales.length = 0;
                window.sales.push(...salesData);
            }
            
            if (window.debts && Array.isArray(window.debts)) {
                window.debts.length = 0;
                window.debts.push(...debtsData);
            }
            
            // Para pollos, usar el array global si existe
            if (window.chickenSales && Array.isArray(window.chickenSales)) {
                window.chickenSales.length = 0;
                window.chickenSales.push(...chickenSalesData);
            }
            
            console.log('🔄 Estado global actualizado correctamente');
        } catch (error) {
            console.error('Error recargando datos:', error);
        }
    }

    // Métodos públicos para sincronizar datos
    syncProduct(product) {
        if (!this.isEnabled || !this.client) return;
        this.client.syncProduct(product);
    }

    syncClient(client) {
        if (!this.isEnabled || !this.client) return;
        this.client.syncClient(client);
    }

    syncSale(sale) {
        if (!this.isEnabled || !this.client) return;
        this.client.syncSale(sale);
    }

    syncChickenSale(sale) {
        if (!this.isEnabled || !this.client) return;
        this.client.syncChickenSale(sale);
    }

    syncDebt(debt) {
        if (!this.isEnabled || !this.client) return;
        this.client.syncDebt(debt);
    }

    syncChickenPrices(pricesData) {
        if (!this.isEnabled || !this.client) return;
        this.client.syncChickenPrices(pricesData);
    }

    requestFullSync() {
        if (!this.isEnabled || !this.client) return;
        
        // Solicitar datos de otros dispositivos
        this.client.send({
            action: 'request_sync_data',
            data: {
                requestId: Date.now(),
                userId: this.userId
            }
        });
        
        // Solicitando datos silenciosamente
    }

    getStatus() {
        if (this.client) {
            return this.client.getStatus();
        }
        return {
            enabled: this.isEnabled,
            connected: false,
            userId: this.userId
        };
    }

    handleTestMessage(data) {
        console.log('🔄 Test message received:', data);
        // Mensaje de prueba recibido silenciosamente
    }

    handleSyncDataRequest(data) {
        console.log('🔄 Solicitud de datos recibida de:', data?.userId);
        
        // Enviar todos los datos locales usando el cliente WebSocket
        if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
            const allData = {
                products: JSON.parse(localStorage.getItem('products') || '[]'),
                clients: JSON.parse(localStorage.getItem('clients') || '[]'),
                sales: JSON.parse(localStorage.getItem('sales') || '[]'),
                debts: JSON.parse(localStorage.getItem('debts') || '[]'),
                chickenSales: JSON.parse(localStorage.getItem('chickenSales') || '[]')
            };
            
            const totalItems = allData.products.length + allData.clients.length + allData.sales.length + allData.debts.length + allData.chickenSales.length;
            
            if (totalItems > 0) {
                window.tillupWebSocketClient.send({
                    action: 'full_sync_data',
                    data: allData
                });
                console.log('🔄 Datos enviados en respuesta a solicitud:', totalItems, 'elementos');
            } else {
                console.log('🔄 No hay datos para enviar');
            }
        }
    }

    forceUpdateClientUI() {
        // Obtener datos actuales desde localStorage
        const clientsData = JSON.parse(localStorage.getItem('clients') || '[]');
        
        // Usar el sistema de actualización silenciosa si está disponible
        if (window.silentUpdateClients) {
            window.silentUpdateClients(clientsData);
        } else {
            // Fallback al método tradicional
            const selectors = [
                document.getElementById('saleClientDrawer'),
                document.getElementById('chickenClient'),
                document.getElementById('cartClientSelector')
            ];
            
            selectors.forEach(selector => {
                if (selector) {
                    const currentValue = selector.value;
                    selector.innerHTML = '<option value="">Seleccionar cliente...</option>';
                    
                    clientsData.forEach(client => {
                        const option = document.createElement('option');
                        option.value = client.id;
                        option.textContent = client.name;
                        if (client.debt && client.debt > 0) {
                            option.textContent += ` (Deuda: $${client.debt.toFixed(2)})`;
                        }
                        selector.appendChild(option);
                    });
                    
                    selector.value = currentValue;
                }
            });
        }
        
        // Renderizar clientes si estamos en esa vista
        if (window.renderClients) {
            window.renderClients();
        }
    }

    forceImmediateUIUpdate() {
        // Actualización instantánea sin delays
        this.reloadDataFromStorage();
        this.refreshAllUI();
        
        // Forzar actualización de selectores
        setTimeout(() => {
            if (window.updateClientSelector) window.updateClientSelector();
        }, 10);
    }

    showSyncIndicator() {
        // Mostrar indicador visual discreto de sincronización
        const indicator = document.createElement('div');
        indicator.innerHTML = '🔄';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 9999;
            animation: fadeInOut 2s ease-in-out;
        `;
        
        // Añadir animación CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-10px); }
                50% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 2000);
    }

    showSyncNotification(message, type = 'info') {
        // Sincronización silenciosa - solo log en consola
        console.log(`🔄 ${message}`);
    }
    
    showQuickSyncIndicator(dataType) {
        const icons = {
            product: '📦',
            client: '👥',
            sale: '🛍️',
            debt: '💰',
            chicken_sale: '🐔'
        };
        
        const indicator = document.createElement('div');
        indicator.innerHTML = icons[dataType] || '🔄';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            background: rgba(40, 167, 69, 0.9);
            color: white;
            padding: 8px;
            border-radius: 50%;
            font-size: 16px;
            z-index: 9999;
            animation: quickPulse 0.6s ease-out;
        `;
        
        // Añadir animación CSS si no existe
        if (!document.getElementById('quickSyncStyle')) {
            const style = document.createElement('style');
            style.id = 'quickSyncStyle';
            style.textContent = `
                @keyframes quickPulse {
                    0% { transform: translateY(-50%) scale(0.5); opacity: 0; }
                    50% { transform: translateY(-50%) scale(1.2); opacity: 1; }
                    100% { transform: translateY(-50%) scale(1); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 600);
    }
}

// Crear instancia global
window.syncManager = new TillUpSyncManager();

// Función global para inicializar sincronización
window.initTillUpSync = function(userId) {
    if (window.syncManager) {
        window.syncManager.init(userId);
    }
};

// Función global para probar sincronización bidireccional
window.testBidirectionalSync = function() {
    if (!window.syncManager || !window.syncManager.isEnabled) {
        Swal.fire({
            icon: 'warning',
            title: 'Sincronización no configurada',
            text: 'Configura un usuario primero para probar la sincronización.',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    // Enviar mensaje de prueba
    const testData = {
        id: 'test_' + Date.now(),
        name: 'Producto de Prueba',
        price: 10.99,
        timestamp: new Date().toISOString()
    };
    
    window.syncManager.syncProduct(testData);
    
    Swal.fire({
        icon: 'success',
        title: 'Prueba Enviada',
        text: 'Se ha enviado un producto de prueba. Verifica en otros dispositivos.',
        confirmButtonText: 'Aceptar'
    });
};

// Alias para compatibilidad
window.tillupSync = window.syncManager;

console.log('🔄 TillUp Sync Manager loaded');