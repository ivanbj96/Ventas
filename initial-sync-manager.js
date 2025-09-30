// ========================================
// 🔄 GESTOR DE SINCRONIZACIÓN INICIAL COMPLETA
// ========================================
// Sistema para garantizar que dispositivos nuevos obtengan todos los datos instantáneamente

class InitialSyncManager {
    constructor() {
        this.isInitialSyncComplete = false;
        this.syncTimeout = null;
        this.maxWaitTime = 10000; // 10 segundos máximo
        this.retryAttempts = 0;
        this.maxRetries = 3;
    }

    async performInitialSync(userId) {
        console.log('🔄 Iniciando sincronización inicial completa para:', userId);
        
        // Marcar que estamos en proceso de sincronización inicial
        localStorage.setItem('initial_sync_in_progress', 'true');
        
        try {
            // 1. Solicitar datos inmediatamente al conectar
            await this.requestAllDataFromNetwork(userId);
            
            // 2. Esperar respuesta con timeout
            await this.waitForInitialData();
            
            // 3. Verificar que tenemos datos
            const hasData = this.verifyDataReceived();
            
            if (!hasData && this.retryAttempts < this.maxRetries) {
                this.retryAttempts++;
                console.log(`🔄 Reintentando sincronización inicial (${this.retryAttempts}/${this.maxRetries})`);
                return this.performInitialSync(userId);
            }
            
            this.isInitialSyncComplete = true;
            localStorage.setItem('initial_sync_complete', 'true');
            localStorage.removeItem('initial_sync_in_progress');
            
            console.log('✅ Sincronización inicial completada exitosamente');
            this.showSyncCompleteNotification();
            
        } catch (error) {
            console.error('❌ Error en sincronización inicial:', error);
            this.handleSyncError(error);
        }
    }

    async requestAllDataFromNetwork(userId) {
        return new Promise((resolve, reject) => {
            if (!window.tillupWebSocketClient || !window.tillupWebSocketClient.isConnected) {
                reject(new Error('WebSocket no conectado'));
                return;
            }

            // Solicitar datos de todos los dispositivos del usuario
            window.tillupWebSocketClient.send({
                action: 'request_complete_user_data',
                data: {
                    userId: userId,
                    requestingDevice: localStorage.getItem('tillup_device_id'),
                    timestamp: Date.now(),
                    isInitialSync: true
                }
            });

            // También solicitar usando el método existente
            window.tillupWebSocketClient.requestDataFromAllDevices();
            
            resolve();
        });
    }

    waitForInitialData() {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 20; // 10 segundos con checks cada 500ms
            
            const checkInterval = setInterval(() => {
                checkCount++;
                
                const hasData = this.verifyDataReceived();
                
                if (hasData) {
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (checkCount >= maxChecks) {
                    clearInterval(checkInterval);
                    reject(new Error('Timeout esperando datos iniciales'));
                }
            }, 500);
        });
    }

    verifyDataReceived() {
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const clients = JSON.parse(localStorage.getItem('clients') || '[]');
            const sales = JSON.parse(localStorage.getItem('sales') || '[]');
            
            // Considerar que tenemos datos si hay al menos productos o clientes
            const hasMinimalData = products.length > 0 || clients.length > 0 || sales.length > 0;
            
            console.log('🔄 Verificación de datos:', {
                products: products.length,
                clients: clients.length,
                sales: sales.length,
                hasMinimalData
            });
            
            return hasMinimalData;
        } catch (error) {
            console.error('Error verificando datos:', error);
            return false;
        }
    }

    handleSyncError(error) {
        localStorage.removeItem('initial_sync_in_progress');
        
        if (window.Swal) {
            Swal.fire({
                icon: 'warning',
                title: 'Sincronización Inicial',
                text: 'No se pudieron obtener datos de otros dispositivos. Puedes continuar y los datos se sincronizarán automáticamente.',
                confirmButtonText: 'Continuar',
                timer: 5000
            });
        }
    }

    showSyncCompleteNotification() {
        const totalItems = this.getTotalItemsCount();
        
        if (window.Swal && totalItems > 0) {
            Swal.fire({
                icon: 'success',
                title: '🎉 Datos Sincronizados',
                html: `
                    <div class="text-center">
                        <p>Se han sincronizado <strong>${totalItems} elementos</strong> desde otros dispositivos.</p>
                        <small class="text-muted">Tu dispositivo está ahora completamente actualizado.</small>
                    </div>
                `,
                timer: 3000,
                showConfirmButton: false
            });
        }
    }

    getTotalItemsCount() {
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const clients = JSON.parse(localStorage.getItem('clients') || '[]');
            const sales = JSON.parse(localStorage.getItem('sales') || '[]');
            const debts = JSON.parse(localStorage.getItem('debts') || '[]');
            const chickenSales = JSON.parse(localStorage.getItem('chickenSales') || '[]');
            
            return products.length + clients.length + sales.length + debts.length + chickenSales.length;
        } catch (error) {
            return 0;
        }
    }

    isInitialSyncNeeded() {
        // Verificar si es la primera vez o si no hay datos
        const syncComplete = localStorage.getItem('initial_sync_complete');
        const hasLocalData = this.verifyDataReceived();
        
        return !syncComplete || !hasLocalData;
    }

    reset() {
        this.isInitialSyncComplete = false;
        this.retryAttempts = 0;
        localStorage.removeItem('initial_sync_complete');
        localStorage.removeItem('initial_sync_in_progress');
    }
}

// Crear instancia global
window.initialSyncManager = new InitialSyncManager();

console.log('🔄 Initial Sync Manager cargado');