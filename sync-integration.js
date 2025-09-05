/**
 * Integración de Sincronización WebSocket para TillUp POS
 * Este archivo contiene las modificaciones necesarias para integrar
 * la sincronización en tiempo real con las funciones existentes
 */

// ========================================
// 👤 SISTEMA DE USUARIOS PARA SINCRONIZACIÓN
// ========================================

let currentSyncUser = null;

// Configurar usuario para sincronización
function setupSyncUser() {
    Swal.fire({
        title: 'Configurar Sincronización',
        html: `
            <div class="mb-3">
                <label class="form-label">ID de Usuario (único)</label>
                <input type="text" id="syncUserId" class="form-control" 
                       placeholder="Ej: tienda_principal, usuario123" required>
                <div class="form-text">Este ID debe ser único y compartido entre tus dispositivos</div>
            </div>
            <div class="mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="enableAutoSync" checked>
                    <label class="form-check-label" for="enableAutoSync">
                        Habilitar sincronización automática
                    </label>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Configurar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const userId = document.getElementById('syncUserId').value.trim();
            const autoSync = document.getElementById('enableAutoSync').checked;
            
            if (!userId) {
                Swal.showValidationMessage('El ID de usuario es requerido');
                return false;
            }
            
            if (userId.length < 3) {
                Swal.showValidationMessage('El ID debe tener al menos 3 caracteres');
                return false;
            }
            
            return { userId, autoSync };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { userId, autoSync } = result.value;
            currentSyncUser = userId;
            
            // Guardar configuración
            localStorage.setItem('tillup_sync_user', currentSyncUser);
            localStorage.setItem('tillup_auto_sync', autoSync.toString());
            
            // Inicializar sincronización
            if (typeof initTillUpSync === 'function') {
                const syncManager = initTillUpSync(currentSyncUser);
                if (syncManager) {
                    syncManager.toggle(autoSync);
                }
            }
            
            Swal.fire({
                icon: 'success',
                title: '¡Sincronización Configurada!',
                html: `
                    <div class="text-start">
                        <p><strong>Usuario:</strong> ${currentSyncUser}</p>
                        <p><strong>Auto-sync:</strong> ${autoSync ? 'Habilitado' : 'Deshabilitado'}</p>
                    </div>
                `,
                timer: 3000
            });
        }
    });
}

// Cargar usuario guardado al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('tillup_sync_user');
    const autoSync = localStorage.getItem('tillup_auto_sync') === 'true';
    
    if (savedUser) {
        currentSyncUser = savedUser;
        console.log(`🔄 Usuario de sincronización cargado: ${currentSyncUser}`);
        
        // Inicializar sincronización automáticamente con delay
        setTimeout(() => {
            if (typeof initTillUpSync === 'function') {
                const syncManager = initTillUpSync(currentSyncUser);
                if (syncManager && autoSync) {
                    syncManager.toggle(true);
                    console.log('🔄 Sincronización automática habilitada');
                }
            }
        }, 2000);
    }
});

// Función para mostrar estado de sincronización
function showSyncStatus() {
    if (!currentSyncUser) {
        Swal.fire({
            title: 'Sincronización no configurada',
            text: '¿Deseas configurar la sincronización ahora?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Configurar',
            cancelButtonText: 'Más tarde'
        }).then((result) => {
            if (result.isConfirmed) {
                setupSyncUser();
            }
        });
        return;
    }
    
    const status = tillupSync ? tillupSync.getStatus() : { 
        enabled: false, 
        connected: false,
        user: currentSyncUser,
        lastSync: null,
        queueSize: 0
    };
    
    Swal.fire({
        title: 'Estado de Sincronización',
        html: `
            <div class="text-start">
                <p><strong>Usuario:</strong> ${currentSyncUser}</p>
                <p><strong>Estado:</strong> ${status.enabled ? '🟢 Habilitada' : '🔴 Deshabilitada'}</p>
                <p><strong>Conexión:</strong> ${status.connected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
                <p><strong>Última sync:</strong> ${status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Nunca'}</p>
                <p><strong>Cola:</strong> ${status.queueSize} mensajes pendientes</p>
                <p><strong>Auto-sync:</strong> ${localStorage.getItem('tillup_auto_sync') === 'true' ? 'Habilitado' : 'Deshabilitado'}</p>
            </div>
        `,
        icon: status.enabled && status.connected ? 'success' : 'warning',
        showCancelButton: true,
        confirmButtonText: 'Reconfigurar',
        cancelButtonText: 'Cerrar',
        showDenyButton: true,
        denyButtonText: status.enabled ? 'Deshabilitar' : 'Habilitar'
    }).then((result) => {
        if (result.isConfirmed) {
            setupSyncUser();
        } else if (result.isDenied) {
            toggleSyncEnabled();
        }
    });
}

// Alternar sincronización habilitada/deshabilitada
function toggleSyncEnabled() {
    if (!tillupSync) {
        Swal.fire('Error', 'Sistema de sincronización no inicializado', 'error');
        return;
    }
    
    const currentStatus = tillupSync.getStatus();
    const newStatus = !currentStatus.enabled;
    
    tillupSync.toggle(newStatus);
    localStorage.setItem('tillup_auto_sync', newStatus.toString());
    
    Swal.fire({
        icon: 'success',
        title: newStatus ? 'Sincronización Habilitada' : 'Sincronización Deshabilitada',
        text: newStatus ? 'Los datos se sincronizarán automáticamente' : 'La sincronización está pausada',
        timer: 2000
    });
}

// ========================================
// 🔄 INTEGRACIÓN CON FUNCIONES EXISTENTES
// ========================================

// Wrapper para funciones de guardado con sincronización
function saveWithSync(key, data, syncFunction) {
    return new Promise(async (resolve, reject) => {
        try {
            // Guardar localmente primero
            await saveToStorage(key, data);
            
            // Sincronizar si está habilitado
            if (tillupSync && tillupSync.isEnabled && typeof syncFunction === 'function') {
                syncFunction(data);
            }
            
            resolve();
        } catch (error) {
            console.error(`Error guardando ${key}:`, error);
            reject(error);
        }
    });
}

// Función para sincronizar producto
function syncProductData(product) {
    if (tillupSync && tillupSync.isEnabled) {
        tillupSync.syncProduct(product);
        console.log('📤 Producto sincronizado:', product.name);
    }
}

// Función para sincronizar cliente
function syncClientData(client) {
    if (tillupSync && tillupSync.isEnabled) {
        tillupSync.syncClient(client);
        console.log('📤 Cliente sincronizado:', client.name);
    }
}

// Función para sincronizar venta
function syncSaleData(sale) {
    if (tillupSync && tillupSync.isEnabled) {
        tillupSync.syncSale(sale);
        console.log('📤 Venta sincronizada:', sale.id);
    }
}

// Función para sincronizar inventario
function syncInventoryData(product) {
    if (tillupSync && tillupSync.isEnabled) {
        tillupSync.syncInventory(product);
        console.log('📤 Inventario sincronizado:', product.name);
    }
}

// ========================================
// 📡 MANEJO DE DATOS REMOTOS
// ========================================

// Manejar producto recibido de otro dispositivo
function handleRemoteProduct(productData) {
    if (!productData || productData.userId === currentSyncUser) return;
    
    console.log('📥 Producto remoto recibido:', productData);
    
    // Verificar si el producto ya existe
    const existingIndex = products.findIndex(p => p.id === productData.id);
    
    if (existingIndex !== -1) {
        // Actualizar producto existente
        products[existingIndex] = { ...products[existingIndex], ...productData };
    } else {
        // Agregar nuevo producto
        products.push(productData);
    }
    
    // Guardar y actualizar UI
    saveToStorage('products', products);
    renderInventory();
    renderSalesProducts();
    
    // Mostrar notificación
    showSyncNotification(`Producto actualizado: ${productData.name}`, 'info');
}

// Manejar cliente recibido de otro dispositivo
function handleRemoteClient(clientData) {
    if (!clientData || clientData.userId === currentSyncUser) return;
    
    console.log('📥 Cliente remoto recibido:', clientData);
    
    // Verificar si el cliente ya existe
    const existingIndex = clients.findIndex(c => c.id === clientData.id);
    
    if (existingIndex === -1) {
        // Agregar nuevo cliente
        clients.push(clientData);
        
        // Guardar y actualizar UI
        saveToStorage('clients', clients);
        renderClients();
        updateClientSelector();
        
        // Mostrar notificación
        showSyncNotification(`Nuevo cliente: ${clientData.name}`, 'success');
    }
}

// Manejar venta recibida de otro dispositivo
function handleRemoteSale(saleData) {
    if (!saleData || saleData.userId === currentSyncUser) return;
    
    console.log('📥 Venta remota recibida:', saleData);
    
    // Verificar si la venta ya existe
    const existingIndex = sales.findIndex(s => s.id === saleData.id);
    
    if (existingIndex === -1) {
        // Agregar nueva venta
        sales.push(saleData);
        
        // Actualizar stock de productos
        if (saleData.items && Array.isArray(saleData.items)) {
            saleData.items.forEach(item => {
                const product = products.find(p => p.id === item.id);
                if (product) {
                    product.stock = Math.max(0, product.stock - item.qty);
                }
            });
        }
        
        // Guardar y actualizar UI
        saveToStorage('sales', sales);
        saveToStorage('products', products);
        updateBalanceUI();
        renderInventory();
        
        // Mostrar notificación
        showSyncNotification(`Nueva venta: ${saleData.clientName}`, 'success');
    }
}

// ========================================
// 🔔 NOTIFICACIONES DE SINCRONIZACIÓN
// ========================================

function showSyncNotification(message, type = 'info') {
    // Solo mostrar si las notificaciones están habilitadas
    const showNotifications = localStorage.getItem('tillup_sync_notifications') !== 'false';
    if (!showNotifications) return;
    
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        Toast.fire({
            icon: type === 'success' ? 'success' : type === 'error' ? 'error' : 'info',
            title: message
        });
    }
}

// ========================================
// ⚙️ CONFIGURACIÓN AVANZADA
// ========================================

// Configurar opciones de sincronización
function configureSyncOptions() {
    const currentNotifications = localStorage.getItem('tillup_sync_notifications') !== 'false';
    const currentAutoReconnect = localStorage.getItem('tillup_auto_reconnect') !== 'false';
    
    Swal.fire({
        title: 'Opciones de Sincronización',
        html: `
            <div class="text-start">
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="syncNotifications" ${currentNotifications ? 'checked' : ''}>
                    <label class="form-check-label" for="syncNotifications">
                        Mostrar notificaciones de sincronización
                    </label>
                </div>
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="autoReconnect" ${currentAutoReconnect ? 'checked' : ''}>
                    <label class="form-check-label" for="autoReconnect">
                        Reconexión automática
                    </label>
                </div>
                <div class="mb-3">
                    <label class="form-label">Intervalo de sincronización (segundos)</label>
                    <input type="number" id="syncInterval" class="form-control" 
                           value="${localStorage.getItem('tillup_sync_interval') || '30'}" 
                           min="10" max="300">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return {
                notifications: document.getElementById('syncNotifications').checked,
                autoReconnect: document.getElementById('autoReconnect').checked,
                interval: parseInt(document.getElementById('syncInterval').value) || 30
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { notifications, autoReconnect, interval } = result.value;
            
            localStorage.setItem('tillup_sync_notifications', notifications.toString());
            localStorage.setItem('tillup_auto_reconnect', autoReconnect.toString());
            localStorage.setItem('tillup_sync_interval', interval.toString());
            
            Swal.fire({
                icon: 'success',
                title: 'Configuración guardada',
                timer: 2000
            });
        }
    });
}

// ========================================
// 🧪 FUNCIONES DE PRUEBA
// ========================================

// Probar sincronización bidireccional
function testBidirectionalSync() {
    if (!tillupSync || !tillupSync.isConnected) {
        Swal.fire({
            icon: 'warning',
            title: 'No conectado',
            text: 'La sincronización no está conectada. Verifica tu configuración.'
        });
        return;
    }
    
    const testMessage = `Prueba desde ${currentSyncUser} - ${new Date().toLocaleTimeString()}`;
    
    if (typeof tillupSync.sendTestMessage === 'function') {
        tillupSync.sendTestMessage(testMessage);
        
        Swal.fire({
            icon: 'success',
            title: 'Prueba enviada',
            text: 'Mensaje de prueba enviado a todos los dispositivos conectados',
            timer: 2000
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Función de prueba no disponible'
        });
    }
}

// Forzar sincronización completa
function forceSyncAll() {
    if (!tillupSync || !tillupSync.isEnabled) {
        Swal.fire({
            icon: 'warning',
            title: 'Sincronización deshabilitada',
            text: 'Habilita la sincronización primero'
        });
        return;
    }
    
    Swal.fire({
        title: 'Sincronizando...',
        text: 'Enviando todos los datos a otros dispositivos',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        // Sincronizar todos los productos
        if (products && Array.isArray(products)) {
            products.forEach(product => syncProductData(product));
        }
        
        // Sincronizar todos los clientes
        if (clients && Array.isArray(clients)) {
            clients.forEach(client => syncClientData(client));
        }
        
        // Sincronizar todas las ventas recientes (últimas 10)
        if (sales && Array.isArray(sales)) {
            const recentSales = sales.slice(-10);
            recentSales.forEach(sale => syncSaleData(sale));
        }
        
        setTimeout(() => {
            Swal.fire({
                icon: 'success',
                title: 'Sincronización completa',
                text: 'Todos los datos han sido enviados',
                timer: 2000
            });
        }, 2000);
        
    } catch (error) {
        console.error('Error en sincronización completa:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo completar la sincronización'
        });
    }
}

// ========================================
// 🔗 EXPORTAR FUNCIONES GLOBALES
// ========================================

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.setupSyncUser = setupSyncUser;
    window.showSyncStatus = showSyncStatus;
    window.toggleSyncEnabled = toggleSyncEnabled;
    window.configureSyncOptions = configureSyncOptions;
    window.testBidirectionalSync = testBidirectionalSync;
    window.forceSyncAll = forceSyncAll;
    window.syncProductData = syncProductData;
    window.syncClientData = syncClientData;
    window.syncSaleData = syncSaleData;
    window.syncInventoryData = syncInventoryData;
    window.handleRemoteProduct = handleRemoteProduct;
    window.handleRemoteClient = handleRemoteClient;
    window.handleRemoteSale = handleRemoteSale;
    window.showSyncNotification = showSyncNotification;
}

console.log('🔄 Integración de sincronización WebSocket cargada');