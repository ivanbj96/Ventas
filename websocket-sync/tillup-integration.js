// Integración completa TillUp WebSocket
class TillUpIntegration {
    constructor() {
        this.sync = window.tillupSync;
        this.setupEventListeners();
        this.interceptAppFunctions();
    }
    
    setupEventListeners() {
        if (!this.sync) return;
        
        this.sync.on('message', (data) => {
            if (data.type === 'sync_data') {
                this.handleIncomingSync(data.payload);
            }
        });
    }
    
    // Interceptar funciones existentes de tu app
    interceptAppFunctions() {
        // Interceptar addSale
        const originalAddSale = window.addSale;
        window.addSale = (...args) => {
            const result = originalAddSale?.apply(this, args);
            if (result && window.sales?.length) {
                const lastSale = window.sales[window.sales.length - 1];
                this.syncChange('sales', 'create', lastSale);
            }
            return result;
        };
        
        // Interceptar addProduct
        const originalAddProduct = window.addProduct;
        window.addProduct = (...args) => {
            const result = originalAddProduct?.apply(this, args);
            if (result && window.products?.length) {
                const lastProduct = window.products[window.products.length - 1];
                this.syncChange('products', 'create', lastProduct);
            }
            return result;
        };
        
        // Interceptar addClient
        const originalAddClient = window.addClient;
        window.addClient = (...args) => {
            const result = originalAddClient?.apply(this, args);
            if (result && window.clients?.length) {
                const lastClient = window.clients[window.clients.length - 1];
                this.syncChange('clients', 'create', lastClient);
            }
            return result;
        };
        
        // Interceptar otras funciones importantes
        this.interceptOtherFunctions();
    }
    
    interceptOtherFunctions() {
        // Interceptar funciones de deudas, pollos, etc.
        const functionsToIntercept = [
            'addDebt', 'updateDebt', 'payDebt',
            'addChickenSale', 'updateChickenSale',
            'updateProduct', 'deleteProduct',
            'updateClient', 'deleteClient'
        ];
        
        functionsToIntercept.forEach(funcName => {
            if (window[funcName]) {
                const original = window[funcName];
                window[funcName] = (...args) => {
                    const result = original.apply(this, args);
                    // Determinar qué datos sincronizar basado en la función
                    this.handleFunctionSync(funcName, args, result);
                    return result;
                };
            }
        });
    }
    
    handleFunctionSync(funcName, args, result) {
        // Lógica para determinar qué sincronizar según la función
        if (funcName.includes('Debt')) {
            this.syncChange('debts', 'update', window.debts);
        } else if (funcName.includes('Chicken')) {
            this.syncChange('chickenSales', 'update', window.chickenSales);
        } else if (funcName.includes('Product')) {
            this.syncChange('products', 'update', window.products);
        } else if (funcName.includes('Client')) {
            this.syncChange('clients', 'update', window.clients);
        }
    }
    
    // Enviar cambios a otros dispositivos
    syncChange(dataType, operation, data) {
        if (this.sync && this.sync.connected) {
            const syncMessage = {
                type: 'sync_data',
                payload: {
                    dataType,
                    operation,
                    data,
                    timestamp: Date.now(),
                    deviceId: this.sync.userId
                }
            };
            this.sync.send(syncMessage);
            console.log(`📤 Sincronizando ${dataType}:`, operation);
        }
    }
    
    // Manejar cambios recibidos de otros dispositivos
    handleIncomingSync(payload) {
        const { dataType, operation, data, deviceId } = payload;
        
        // No procesar nuestros propios cambios
        if (deviceId === this.sync.userId) return;
        
        console.log(`📥 Recibiendo ${dataType}:`, operation);
        
        switch (dataType) {
            case 'sales':
                this.updateSales(data, operation);
                break;
            case 'products':
                this.updateProducts(data, operation);
                break;
            case 'clients':
                this.updateClients(data, operation);
                break;
            case 'debts':
                this.updateDebts(data, operation);
                break;
            case 'chickenSales':
                this.updateChickenSales(data, operation);
                break;
        }
        
        // Mostrar notificación
        this.showSyncNotification(dataType, operation);
    }
    
    updateSales(data, operation) {
        if (operation === 'create') {
            if (!window.sales) window.sales = [];
            window.sales.push(data);
        } else if (operation === 'update') {
            window.sales = data;
        }
        // Actualizar UI si existe la función
        if (typeof updateBalanceUI === 'function') updateBalanceUI();
        if (typeof renderMovements === 'function') renderMovements();
    }
    
    updateProducts(data, operation) {
        if (operation === 'create') {
            if (!window.products) window.products = [];
            window.products.push(data);
        } else if (operation === 'update') {
            window.products = data;
        }
        // Actualizar UI
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderSalesProducts === 'function') renderSalesProducts();
    }
    
    updateClients(data, operation) {
        if (operation === 'create') {
            if (!window.clients) window.clients = [];
            window.clients.push(data);
        } else if (operation === 'update') {
            window.clients = data;
        }
        // Actualizar UI
        if (typeof renderClients === 'function') renderClients();
    }
    
    updateDebts(data, operation) {
        window.debts = data;
        if (typeof renderDebts === 'function') renderDebts();
    }
    
    updateChickenSales(data, operation) {
        window.chickenSales = data;
        if (typeof updateChickenSalesList === 'function') updateChickenSalesList();
    }
    
    showSyncNotification(dataType, operation) {
        if (typeof Swal !== 'undefined') {
            const messages = {
                sales: 'Nueva venta sincronizada',
                products: 'Producto sincronizado',
                clients: 'Cliente sincronizado',
                debts: 'Deuda sincronizada',
                chickenSales: 'Venta de pollo sincronizada'
            };
            
            Swal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                icon: 'info',
                title: messages[dataType] || 'Datos sincronizados'
            });
        }
    }
}

// Inicializar cuando todo esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.tillupSync) {
            window.tillupIntegration = new TillUpIntegration();
            console.log('🔄 TillUp Integration activada');
        }
    }, 2000); // Esperar a que la app se cargue
});