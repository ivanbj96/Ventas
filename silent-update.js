// ========================================
// 🔄 ACTUALIZACIONES SILENCIOSAS TILLUP
// ========================================
// Sistema para actualizar la UI de forma completamente imperceptible

class SilentUpdater {
    constructor() {
        this.isUpdating = false;
        this.updateQueue = [];
        this.lastUpdate = 0;
        this.minUpdateInterval = 100; // Mínimo 100ms entre actualizaciones
    }

    // Actualizar elemento con transición suave
    updateElement(element, newContent, callback) {
        if (!element) return;

        // Aplicar clase de actualización
        element.classList.add('content-updating');
        
        // Actualizar contenido después de un frame
        requestAnimationFrame(() => {
            if (typeof newContent === 'string') {
                element.innerHTML = newContent;
            } else if (typeof callback === 'function') {
                callback(element);
            }
            
            // Remover clase y aplicar clase de actualizado
            element.classList.remove('content-updating');
            element.classList.add('content-updated');
            
            // Limpiar clase después de la transición
            setTimeout(() => {
                element.classList.remove('content-updated');
            }, 200);
        });
    }

    // Actualizar múltiples elementos de forma batch
    batchUpdate(updates) {
        if (this.isUpdating) {
            this.updateQueue.push(...updates);
            return;
        }

        const now = Date.now();
        if (now - this.lastUpdate < this.minUpdateInterval) {
            setTimeout(() => this.batchUpdate(updates), this.minUpdateInterval);
            return;
        }

        this.isUpdating = true;
        this.lastUpdate = now;

        // Procesar todas las actualizaciones en un solo frame
        requestAnimationFrame(() => {
            updates.forEach(update => {
                const { selector, content, callback } = update;
                const element = typeof selector === 'string' ? 
                    document.querySelector(selector) : selector;
                
                if (element) {
                    this.updateElement(element, content, callback);
                }
            });

            this.isUpdating = false;

            // Procesar cola si hay actualizaciones pendientes
            if (this.updateQueue.length > 0) {
                const queuedUpdates = [...this.updateQueue];
                this.updateQueue = [];
                setTimeout(() => this.batchUpdate(queuedUpdates), 50);
            }
        });
    }

    // Actualizar selectores de clientes silenciosamente
    updateClientSelectors(clients) {
        const selectors = [
            '#saleClientDrawer',
            '#chickenClient', 
            '#cartClientSelector'
        ];

        const updates = selectors.map(selector => ({
            selector,
            callback: (element) => {
                const currentValue = element.value;
                element.innerHTML = '<option value="">Seleccionar cliente...</option>';
                
                clients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = client.name;
                    if (client.debt && client.debt > 0) {
                        option.textContent += ` (Deuda: $${client.debt.toFixed(2)})`;
                    }
                    element.appendChild(option);
                });
                
                element.value = currentValue;
            }
        }));

        this.batchUpdate(updates);
    }

    // Actualizar contadores y estadísticas
    updateStats(stats) {
        const updates = Object.entries(stats).map(([selector, value]) => ({
            selector,
            content: value
        }));

        this.batchUpdate(updates);
    }

    // Marcar elemento como sincronizado (efecto visual muy sutil)
    markAsSynced(element) {
        if (!element) return;
        
        element.classList.add('sync-active');
        setTimeout(() => {
            element.classList.remove('sync-active');
        }, 1000);
    }
}

// Crear instancia global
window.silentUpdater = new SilentUpdater();

// Función global para actualización silenciosa de clientes
window.silentUpdateClients = function(clients) {
    if (window.silentUpdater) {
        window.silentUpdater.updateClientSelectors(clients);
    }
};

// Función global para actualización silenciosa de stats
window.silentUpdateStats = function(stats) {
    if (window.silentUpdater) {
        window.silentUpdater.updateStats(stats);
    }
};

console.log('🔄 Silent Updater loaded');