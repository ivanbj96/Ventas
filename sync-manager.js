/**
 * Gestor de Sincronización para TillUp POS
 * Integra WebSocket con la aplicación principal
 */

class TillUpSyncManager {
    constructor() {
        this.wsClient = null;
        this.currentUser = null;
        this.isEnabled = false;
        this.syncQueue = [];
        this.lastSyncTime = null;
        
        this.init();
    }
    
    init() {
        // Verificar si WebSocket está disponible
        if (typeof WebSocketSyncClient !== 'undefined') {
            this.wsClient = new WebSocketSyncClient();
            this.setupEventListeners();
            console.log('🔄 TillUp Sync Manager inicializado');
        } else {
            console.warn('⚠️ WebSocket client no disponible');
        }
    }
    
    // Configurar usuario para sincronización
    setUser(userId) {
        this.currentUser = userId;
        if (this.wsClient) {
            this.wsClient.setUserId(userId);
            this.isEnabled = true;
            console.log(`👤 Usuario configurado para sync: ${userId}`);
        }
    }
    
    // Configurar listeners de eventos
    setupEventListeners() {
        // Escuchar eventos de sincronización
        window.addEventListener('saleCreated', (event) => {
            this.syncSale(event.detail);
        });
        
        window.addEventListener('productUpdated', (event) => {
            this.syncProduct(event.detail);
        });
        
        window.addEventListener('clientAdded', (event) => {
            this.syncClient(event.detail);
        });
        
        window.addEventListener('inventoryUpdated', (event) => {
            this.syncInventory(event.detail);
        });
        
        // Escuchar datos recibidos
        window.addEventListener('saleReceived', (event) => {
            this.handleRemoteSale(event.detail);
        });
        
        window.addEventListener('productReceived', (event) => {
            this.handleRemoteProduct(event.detail);
        });
        
        window.addEventListener('clientReceived', (event) => {
            this.handleRemoteClient(event.detail);
        });
    }
    
    // Sincronizar venta
    syncSale(sale) {
        if (!this.isEnabled || !this.wsClient) return;
        
        const syncData = {
            ...sale,
            syncType: 'sale',
            timestamp: Date.now(),
            userId: this.currentUser
        };
        
        this.wsClient.syncSale(syncData);
        console.log('📤 Venta sincronizada:', sale.id);
    }
    
    // Sincronizar producto
    syncProduct(product) {
        if (!this.isEnabled || !this.wsClient) return;
        
        const syncData = {
            ...product,
            syncType: 'product',
            timestamp: Date.now(),
            userId: this.currentUser
        };
        
        this.wsClient.syncProduct(syncData);
        console.log('📤 Producto sincronizado:', product.id);
    }
    
    // Sincronizar cliente
    syncClient(client) {
        if (!this.isEnabled || !this.wsClient) return;
        
        const syncData = {
            ...client,
            syncType: 'client',
            timestamp: Date.now(),
            userId: this.currentUser
        };
        
        this.wsClient.syncClient(syncData);
        console.log('📤 Cliente sincronizado:', client.id);
    }
    
    // Sincronizar inventario
    syncInventory(product) {
        if (!this.isEnabled || !this.wsClient) return;
        
        const syncData = {
            ...product,
            syncType: 'inventory',
            timestamp: Date.now(),
            userId: this.currentUser
        };
        
        this.wsClient.syncInventory(syncData);
        console.log('📤 Inventario sincronizado:', product.id);
    }
    
    // Manejar venta remota
    handleRemoteSale(saleData) {
        if (saleData.userId === this.currentUser) return; // Evitar duplicados
        
        // Agregar venta a datos locales
        if (window.sales) {
            const existingIndex = window.sales.findIndex(s => s.id === saleData.id);
            if (existingIndex === -1) {
                window.sales.push(saleData);
                saveData();
                
                // Actualizar UI si está en vista de ventas
                if (window.currentView === 'sales' || window.currentView === 'balance') {
                    loadSales();
                    updateBalance();
                }
                
                this.showSyncNotification('Nueva venta sincronizada', 'success');
            }
        }
    }
    
    // Manejar producto remoto
    handleRemoteProduct(productData) {
        if (productData.userId === this.currentUser) return;
        
        if (window.inventory) {
            const existingIndex = window.inventory.findIndex(p => p.id === productData.id);
            if (existingIndex !== -1) {
                window.inventory[existingIndex] = productData;
            } else {
                window.inventory.push(productData);
            }
            saveData();
            
            if (window.currentView === 'inventory') {
                loadInventory();
            }
            
            this.showSyncNotification('Producto sincronizado', 'info');
        }
    }
    
    // Manejar cliente remoto
    handleRemoteClient(clientData) {
        if (clientData.userId === this.currentUser) return;
        
        if (window.clients) {
            const existingIndex = window.clients.findIndex(c => c.id === clientData.id);
            if (existingIndex === -1) {
                window.clients.push(clientData);
                saveData();
                
                if (window.currentView === 'clients') {
                    loadClients();
                }
                
                this.showSyncNotification('Nuevo cliente sincronizado', 'success');
            }
        }
    }
    
    // Sincronización completa inicial
    performInitialSync() {
        if (!this.isEnabled || !this.wsClient) return;
        
        console.log('🔄 Iniciando sincronización completa...');
        
        // Sincronizar datos existentes
        if (window.sales) {
            window.sales.forEach(sale => this.syncSale(sale));
        }
        
        if (window.inventory) {
            window.inventory.forEach(product => this.syncProduct(product));
        }
        
        if (window.clients) {
            window.clients.forEach(client => this.syncClient(client));
        }
        
        this.lastSyncTime = Date.now();
        console.log('✅ Sincronización completa finalizada');
    }
    
    // Mostrar notificación de sincronización
    showSyncNotification(message, type = 'info') {
        if (typeof Swal !== 'undefined') {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });

            Toast.fire({
                icon: type === 'success' ? 'success' : 'info',
                title: message
            });
        }
    }
    
    // Obtener estado de sincronización
    getStatus() {
        return {
            enabled: this.isEnabled,
            connected: this.wsClient?.isConnected || false,
            user: this.currentUser,
            lastSync: this.lastSyncTime,
            queueSize: this.syncQueue.length
        };
    }
    
    // Habilitar/deshabilitar sincronización
    toggle(enabled) {
        this.isEnabled = enabled;
        if (enabled && this.currentUser) {
            this.performInitialSync();
        }
        console.log(`🔄 Sincronización ${enabled ? 'habilitada' : 'deshabilitada'}`);
    }
}

// Inicializar gestor de sincronización global
let tillupSync = null;

// Función para inicializar sincronización
function initTillUpSync(userId = null) {
    if (!tillupSync) {
        tillupSync = new TillUpSyncManager();
    }
    
    if (userId) {
        tillupSync.setUser(userId);
    }
    
    return tillupSync;
}

// Función para mostrar estado de sincronización
function showSyncStatus() {
    if (!tillupSync) {
        Swal.fire({
            title: 'Sincronización no inicializada',
            text: 'La sincronización no está configurada',
            icon: 'warning'
        });
        return;
    }
    
    const status = tillupSync.getStatus();
    
    Swal.fire({
        title: 'Estado de Sincronización',
        html: `
            <div class="text-start">
                <p><strong>Estado:</strong> ${status.enabled ? '🟢 Habilitada' : '🔴 Deshabilitada'}</p>
                <p><strong>Conexión:</strong> ${status.connected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
                <p><strong>Usuario:</strong> ${status.user || 'No configurado'}</p>
                <p><strong>Última sync:</strong> ${status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Nunca'}</p>
                <p><strong>Cola:</strong> ${status.queueSize} elementos</p>
            </div>
        `,
        icon: status.enabled && status.connected ? 'success' : 'warning'
    });
}

// Función para configurar usuario de sincronización
function setupSyncUser() {
    Swal.fire({
        title: 'Configurar Sincronización',
        input: 'text',
        inputLabel: 'ID de Usuario',
        inputPlaceholder: 'Ej: usuario123',
        showCancelButton: true,
        confirmButtonText: 'Configurar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            initTillUpSync(result.value);
            Swal.fire('¡Configurado!', 'Sincronización configurada correctamente', 'success');
        }
    });
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.tillupSync = tillupSync;
    window.initTillUpSync = initTillUpSync;
    window.showSyncStatus = showSyncStatus;
    window.setupSyncUser = setupSyncUser;
}

// Auto-inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initTillUpSync();
    }, 2000);
});