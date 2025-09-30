// ========================================
// 🔧 PARCHE PARA CORREGIR SINCRONIZACIÓN
// ========================================
// Parche temporal para corregir problemas de sincronización

// Interceptar y corregir el manejo de datos codificados
if (window.syncManager) {
    const originalHandleIncomingData = window.syncManager.handleIncomingData;
    
    window.syncManager.handleIncomingData = function(data) {
        console.log('🔧 PATCH: Interceptando datos entrantes:', data);
        
        // Decodificar datos si vienen en Base64
        if (data && data.data && typeof data.data === 'string') {
            try {
                const decoded = atob(data.data);
                const parsedData = JSON.parse(decoded);
                console.log('🔧 PATCH: Datos decodificados:', parsedData);
                
                // Crear nuevo objeto con datos decodificados
                const newData = {
                    ...data,
                    data: parsedData
                };
                
                return originalHandleIncomingData.call(this, newData);
            } catch (error) {
                console.error('🔧 PATCH: Error decodificando:', error);
            }
        }
        
        return originalHandleIncomingData.call(this, data);
    };
    
    console.log('🔧 PATCH: Sincronización corregida');
}

// Función para forzar actualización de datos
window.forceDataUpdate = function() {
    console.log('🔧 Forzando actualización de datos...');
    
    // Recargar desde localStorage
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const debts = JSON.parse(localStorage.getItem('debts') || '[]');
    const chickenSales = JSON.parse(localStorage.getItem('chickenSales') || '[]');
    
    console.log('🔧 Datos en localStorage:', {
        products: products.length,
        clients: clients.length,
        sales: sales.length,
        debts: debts.length,
        chickenSales: chickenSales.length
    });
    
    // Actualizar arrays globales directamente
    if (window.products) {
        window.products.length = 0;
        window.products.push(...products);
    }
    
    if (window.clients) {
        window.clients.length = 0;
        window.clients.push(...clients);
    }
    
    if (window.sales) {
        window.sales.length = 0;
        window.sales.push(...sales);
    }
    
    if (window.debts) {
        window.debts.length = 0;
        window.debts.push(...debts);
    }
    
    if (window.chickenSales) {
        window.chickenSales.length = 0;
        window.chickenSales.push(...chickenSales);
    }
    
    // Forzar actualización de UI
    if (typeof window.renderInventory === 'function') window.renderInventory();
    if (typeof window.renderClients === 'function') window.renderClients();
    if (typeof window.renderBalanceGrid === 'function') window.renderBalanceGrid();
    if (typeof window.renderDebts === 'function') window.renderDebts();
    if (typeof window.updateChickenStats === 'function') window.updateChickenStats();
    if (typeof window.updateChickenSalesList === 'function') window.updateChickenSalesList();
    if (typeof window.updateBalanceUI === 'function') window.updateBalanceUI();
    
    console.log('🔧 Actualización forzada completada');
};

console.log('🔧 Parche de sincronización cargado');