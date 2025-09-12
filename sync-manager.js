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
        this.client = window.tillupWebSocketClient;
        
        if (this.client) {
            this.client.init(userId);
        }
        
        console.log('🔄 Sync Manager enabled for user:', userId);
    }

    disable() {
        this.isEnabled = false;
        if (this.client) {
            this.client.disconnect();
        }
        console.log('🔄 Sync Manager disabled');
    }

    // Manejar datos entrantes desde otros dispositivos
    handleIncomingData(data) {
        if (!this.isEnabled) return;

        const { type, action, data: payload } = data;

        switch (action) {
            case 'sync_product':
                this.handleProductSync(payload);
                break;
            case 'sync_client':
                this.handleClientSync(payload);
                break;
            case 'sync_sale':
                this.handleSaleSync(payload);
                break;
            case 'sync_chicken_sale':
                this.handleChickenSaleSync(payload);
                break;
            case 'sync_debt':
                this.handleDebtSync(payload);
                break;
            case 'full_sync_data':
                this.handleFullSyncData(payload);
                break;
            case 'test_message':
                this.handleTestMessage(payload);
                break;
            default:
                console.log('🔄 Unknown sync action:', action, 'data:', data);
        }
    }

    handleProductSync(product) {
        console.log('🔄 Syncing product:', product);
        
        // Manejar eliminación de producto
        if (product.deleted) {
            let productsData = window.products || [];
            if (!Array.isArray(productsData)) {
                productsData = JSON.parse(localStorage.getItem('products') || '[]');
            }
            
            const updatedProducts = productsData.filter(p => p.id !== product.id);
            
            // Usar función setter si está disponible
            if (typeof window.setProducts === 'function') {
                window.setProducts(updatedProducts);
            } else if (window.products && Array.isArray(window.products)) {
                window.products.length = 0;
                window.products.push(...updatedProducts);
            }
            
            // Guardar en localStorage
            if (typeof saveToStorage === 'function') {
                saveToStorage('products', updatedProducts);
            } else {
                localStorage.setItem('products', JSON.stringify(updatedProducts));
            }
            
            // Actualizar UI silenciosamente
            if (typeof renderInventory === 'function') renderInventory();
            if (typeof renderSalesProducts === 'function') renderSalesProducts();
            return;
        }
        
        // Actualizar productos locales
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
        
        // Usar función setter si está disponible
        if (typeof window.setProducts === 'function') {
            window.setProducts(productsData);
        } else if (window.products && Array.isArray(window.products)) {
            window.products.length = 0;
            window.products.push(...productsData);
        }
        
        // Guardar en localStorage
        if (typeof saveToStorage === 'function') {
            saveToStorage('products', productsData);
        } else {
            localStorage.setItem('products', JSON.stringify(productsData));
        }
        
        // Actualizar UI silenciosamente
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
        
        // Actualizar clientes locales
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
        
        // Guardar en localStorage PRIMERO
        localStorage.setItem('clients', JSON.stringify(clientsData));
        
        // Actualizar estado global sin usar setClients para evitar bucles
        if (window.clients && Array.isArray(window.clients)) {
            window.clients.length = 0;
            window.clients.push(...clientsData);
        }
        
        // Usar saveToStorage si está disponible
        if (typeof saveToStorage === 'function') {
            saveToStorage('clients', clientsData);
        }
        
        // Actualizar UI silenciosamente
        this.forceUpdateClientUI();
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
            // Agregar nueva venta
            salesData.push(sale);
            
            // Usar función setter si está disponible
            if (typeof window.setSales === 'function') {
                window.setSales(salesData);
            } else if (window.sales && Array.isArray(window.sales)) {
                window.sales.length = 0;
                window.sales.push(...salesData);
            }
            
            // Guardar en localStorage
            if (typeof saveToStorage === 'function') {
                saveToStorage('sales', salesData);
            } else {
                localStorage.setItem('sales', JSON.stringify(salesData));
            }
            
            // Actualizar UI silenciosamente
            if (typeof renderBalanceGrid === 'function') renderBalanceGrid();
            if (typeof updateBalanceUI === 'function') updateBalanceUI();
        } else {
            console.log('🔄 Venta ya existe, omitiendo:', sale.id);
        }
    }

    handleChickenSaleSync(sale) {
        console.log('🔄 Syncing chicken sale:', sale);
        
        // Obtener ventas actuales desde localStorage
        let chickenSales = JSON.parse(localStorage.getItem('chickenSales') || '[]');
        const existingIndex = chickenSales.findIndex(s => s.id === sale.id);
        
        if (existingIndex === -1) {
            // Agregar nueva venta
            chickenSales.push(sale);
            
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
            
            // Actualizar UI silenciosamente
            if (typeof updateChickenStats === 'function') updateChickenStats();
            if (typeof updateChickenSalesList === 'function') updateChickenSalesList();
            if (typeof updateBalanceUI === 'function') updateBalanceUI();
        } else {
            console.log('🔄 Venta de pollos ya existe, omitiendo:', sale.id);
        }
    }

    handleDebtSync(debt) {
        console.log('🔄 Syncing debt:', debt);
        
        // Obtener deudas actuales
        let debtsData = window.debts || [];
        if (!Array.isArray(debtsData)) {
            debtsData = JSON.parse(localStorage.getItem('debts') || '[]');
        }
        
        const existingIndex = debtsData.findIndex(d => d.id === debt.id);
        
        if (existingIndex >= 0) {
            // Actualizar deuda existente
            debtsData[existingIndex] = debt;
        } else {
            // Agregar nueva deuda
            debtsData.push(debt);
        }
        
        // Usar función setter si está disponible
        if (typeof window.setDebts === 'function') {
            window.setDebts(debtsData);
        } else if (window.debts && Array.isArray(window.debts)) {
            window.debts.length = 0;
            window.debts.push(...debtsData);
        }
        
        // Guardar en localStorage
        if (typeof saveToStorage === 'function') {
            saveToStorage('debts', debtsData);
        } else {
            localStorage.setItem('debts', JSON.stringify(debtsData));
        }
        
        // Actualizar UI silenciosamente
        if (typeof renderDebts === 'function') renderDebts();
    }

    handleFullSyncData(syncData) {
        console.log('🔄 Handling full sync data:', syncData);
        
        // Actualizar todos los datos
        if (syncData.products && Array.isArray(syncData.products)) {
            // Mezclar productos sin duplicar
            let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
            syncData.products.forEach(syncProduct => {
                const existingIndex = localProducts.findIndex(p => p.id === syncProduct.id);
                if (existingIndex >= 0) {
                    localProducts[existingIndex] = syncProduct;
                } else {
                    localProducts.push(syncProduct);
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
        
        if (syncData.clients && Array.isArray(syncData.clients)) {
            // Mezclar clientes sin duplicar
            let localClients = JSON.parse(localStorage.getItem('clients') || '[]');
            syncData.clients.forEach(syncClient => {
                const existingIndex = localClients.findIndex(c => c.id === syncClient.id);
                if (existingIndex >= 0) {
                    localClients[existingIndex] = syncClient;
                } else {
                    localClients.push(syncClient);
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
        
        if (syncData.sales && Array.isArray(syncData.sales)) {
            // Mezclar ventas sin duplicar
            let localSales = JSON.parse(localStorage.getItem('sales') || '[]');
            syncData.sales.forEach(syncSale => {
                const existingIndex = localSales.findIndex(s => s.id === syncSale.id);
                if (existingIndex === -1) {
                    localSales.push(syncSale);
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
        
        if (syncData.debts && Array.isArray(syncData.debts)) {
            // Mezclar deudas sin duplicar
            let localDebts = JSON.parse(localStorage.getItem('debts') || '[]');
            syncData.debts.forEach(syncDebt => {
                const existingIndex = localDebts.findIndex(d => d.id === syncDebt.id);
                if (existingIndex >= 0) {
                    localDebts[existingIndex] = syncDebt;
                } else {
                    localDebts.push(syncDebt);
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
        
        if (syncData.chickenSales && Array.isArray(syncData.chickenSales)) {
            // Actualizar localStorage
            localStorage.setItem('chickenSales', JSON.stringify(syncData.chickenSales));
            
            // Actualizar estado global usando setChickenSales
            if (typeof setChickenSales === 'function') {
                setChickenSales(syncData.chickenSales);
            } else if (window.setChickenSales && typeof window.setChickenSales === 'function') {
                window.setChickenSales(syncData.chickenSales);
            }
            
            // Usar saveToStorage si está disponible
            if (typeof saveToStorage === 'function') {
                saveToStorage('chickenSales', syncData.chickenSales);
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
        
        // Sincronización completa silenciosa
    }

    refreshAllUI() {
        // Actualizar todas las vistas inmediatamente sin delay
        this.reloadDataFromStorage();
        
        // Actualizar UI de forma síncrona
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderClients === 'function') renderClients();
        if (typeof renderDebts === 'function') renderDebts();
        if (typeof renderSalesProducts === 'function') renderSalesProducts();
        if (typeof renderBalanceGrid === 'function') renderBalanceGrid();
        if (typeof updateBalanceUI === 'function') updateBalanceUI();
        if (typeof updateClientSelector === 'function') updateClientSelector();
        if (typeof updateChickenStats === 'function') updateChickenStats();
        if (typeof updateChickenSalesList === 'function') updateChickenSalesList();
        
        // Actualizar selector global
        if (window.updateClientSelector) {
            window.updateClientSelector();
        }
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
            
            // Forzar actualización del estado global usando los módulos
            if (typeof window.setProducts === 'function') {
                window.setProducts(productsData);
            } else if (window.products && Array.isArray(window.products)) {
                window.products.length = 0;
                window.products.push(...productsData);
            }
            
            if (typeof window.setClients === 'function') {
                window.setClients(clientsData);
            } else if (window.clients && Array.isArray(window.clients)) {
                window.clients.length = 0;
                window.clients.push(...clientsData);
            }
            
            if (typeof window.setSales === 'function') {
                window.setSales(salesData);
            } else if (window.sales && Array.isArray(window.sales)) {
                window.sales.length = 0;
                window.sales.push(...salesData);
            }
            
            if (typeof window.setDebts === 'function') {
                window.setDebts(debtsData);
            } else if (window.debts && Array.isArray(window.debts)) {
                window.debts.length = 0;
                window.debts.push(...debtsData);
            }
            
            // Actualizar estado de pollos
            if (typeof setChickenSales === 'function') {
                setChickenSales(chickenSalesData);
            } else if (window.setChickenSales && typeof window.setChickenSales === 'function') {
                window.setChickenSales(chickenSalesData);
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

    showSyncNotification(message, type = 'info') {
        // Sincronización silenciosa - solo log en consola
        console.log(`🔄 ${message}`);
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