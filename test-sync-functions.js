// ========================================
// 🧪 PRUEBA DE SINCRONIZACIÓN INSTANTÁNEA
// ========================================

// Función para probar sincronización instantánea
window.testInstantSync = function() {
    if (!window.syncManager || !window.syncManager.isEnabled) {
        Swal.fire({
            icon: 'warning',
            title: 'Sincronización no configurada',
            text: 'Configura un usuario primero.',
            confirmButtonText: 'Aceptar'
        });
        return;
    }

    if (!window.tillupWebSocketClient || !window.tillupWebSocketClient.isConnected) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin conexión WebSocket',
            text: 'No hay conexión WebSocket activa.',
            confirmButtonText: 'Aceptar'
        });
        return;
    }

    // Crear producto de prueba
    const testProduct = {
        id: 'test_' + Date.now(),
        name: 'Producto de Prueba ' + new Date().toLocaleTimeString(),
        price: Math.floor(Math.random() * 100) + 1,
        cost: Math.floor(Math.random() * 50) + 1,
        stock: Math.floor(Math.random() * 20) + 1,
        category: 'Prueba',
        image: '',
        timestamp: Date.now()
    };

    // Agregar a localStorage local
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    products.push(testProduct);
    localStorage.setItem('products', JSON.stringify(products));

    // Actualizar estado global
    if (window.products && Array.isArray(window.products)) {
        window.products.push(testProduct);
    }

    // Sincronizar inmediatamente
    window.syncManager.syncProduct(testProduct);

    // Actualizar UI local
    if (typeof renderInventory === 'function') {
        renderInventory();
    }

    Swal.fire({
        icon: 'success',
        title: 'Producto de prueba creado',
        html: `
            <div class="text-start">
                <p><strong>Producto:</strong> ${testProduct.name}</p>
                <p><strong>Precio:</strong> $${testProduct.price}</p>
                <p><strong>ID:</strong> ${testProduct.id}</p>
                <p class="text-info mt-3">
                    <i class="bi bi-info-circle"></i>
                    Este producto debería aparecer instantáneamente en otros dispositivos conectados.
                </p>
            </div>
        `,
        confirmButtonText: 'Aceptar'
    });
};

// Función para probar sincronización de cliente
window.testClientSync = function() {
    if (!window.syncManager || !window.syncManager.isEnabled) {
        Swal.fire({
            icon: 'warning',
            title: 'Sincronización no configurada',
            text: 'Configura un usuario primero.',
            confirmButtonText: 'Aceptar'
        });
        return;
    }

    if (!window.tillupWebSocketClient || !window.tillupWebSocketClient.isConnected) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin conexión WebSocket',
            text: 'No hay conexión WebSocket activa.',
            confirmButtonText: 'Aceptar'
        });
        return;
    }

    // Crear cliente de prueba
    const testClient = {
        id: 'client_test_' + Date.now(),
        name: 'Cliente Prueba ' + new Date().toLocaleTimeString(),
        phone: '555-' + Math.floor(Math.random() * 9000 + 1000),
        address: 'Dirección de prueba',
        debt: 0,
        image: '',
        timestamp: Date.now()
    };

    // Agregar a localStorage local
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    clients.push(testClient);
    localStorage.setItem('clients', JSON.stringify(clients));

    // Actualizar estado global
    if (window.clients && Array.isArray(window.clients)) {
        window.clients.push(testClient);
    }

    // Sincronizar inmediatamente
    window.syncManager.syncClient(testClient);

    // Actualizar UI local
    if (typeof renderClients === 'function') {
        renderClients();
    }
    if (typeof updateClientSelector === 'function') {
        updateClientSelector();
    }

    Swal.fire({
        icon: 'success',
        title: 'Cliente de prueba creado',
        html: `
            <div class="text-start">
                <p><strong>Cliente:</strong> ${testClient.name}</p>
                <p><strong>Teléfono:</strong> ${testClient.phone}</p>
                <p><strong>ID:</strong> ${testClient.id}</p>
                <p class="text-info mt-3">
                    <i class="bi bi-info-circle"></i>
                    Este cliente debería aparecer instantáneamente en otros dispositivos conectados y en los selectores.
                </p>
            </div>
        `,
        confirmButtonText: 'Aceptar'
    });
};

// Función para mostrar estado de conexión
window.showConnectionStatus = function() {
    const wsClient = window.tillupWebSocketClient;
    const syncManager = window.syncManager;
    
    const wsStatus = wsClient ? {
        connected: wsClient.isConnected,
        enabled: wsClient.enabled,
        userId: wsClient.userId,
        lastSync: wsClient.lastSync
    } : { connected: false, enabled: false };
    
    const syncStatus = syncManager ? {
        enabled: syncManager.isEnabled,
        userId: syncManager.userId
    } : { enabled: false };

    Swal.fire({
        title: 'Estado de Conexión',
        html: `
            <div class="text-start">
                <h6>WebSocket Client:</h6>
                <ul>
                    <li>Conectado: ${wsStatus.connected ? '✅ Sí' : '❌ No'}</li>
                    <li>Habilitado: ${wsStatus.enabled ? '✅ Sí' : '❌ No'}</li>
                    <li>Usuario: ${wsStatus.userId || 'No configurado'}</li>
                    <li>Última sync: ${wsStatus.lastSync ? new Date(wsStatus.lastSync).toLocaleString() : 'Nunca'}</li>
                </ul>
                
                <h6>Sync Manager:</h6>
                <ul>
                    <li>Habilitado: ${syncStatus.enabled ? '✅ Sí' : '❌ No'}</li>
                    <li>Usuario: ${syncStatus.userId || 'No configurado'}</li>
                </ul>
                
                <div class="alert alert-info mt-3">
                    <i class="bi bi-info-circle"></i>
                    Para que funcione la sincronización, ambos deben estar habilitados y el WebSocket conectado.
                </div>
            </div>
        `,
        confirmButtonText: 'Cerrar',
        width: 500
    });
};

console.log('🧪 Funciones de prueba de sincronización cargadas');