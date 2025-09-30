// ========================================
// 🎯 EVENT MANAGER - GESTIÓN SEGURA DE EVENTOS
// ========================================
// Utilidad para prevenir memory leaks y gestionar event listeners

class EventManager {
    constructor() {
        this.listeners = new Map();
        this.timers = new Set();
        this.intervals = new Set();
    }

    // Agregar event listener con cleanup automático
    addEventListener(element, event, handler, options = {}) {
        if (!element || typeof handler !== 'function') return null;

        const wrappedHandler = (e) => {
            try {
                return handler(e);
            } catch (error) {
                console.error('Error en event handler:', error);
            }
        };

        element.addEventListener(event, wrappedHandler, options);

        const listenerId = `${element.id || 'element'}_${event}_${Date.now()}`;
        this.listeners.set(listenerId, {
            element,
            event,
            handler: wrappedHandler,
            options
        });

        return listenerId;
    }

    // Remover event listener específico
    removeEventListener(listenerId) {
        const listener = this.listeners.get(listenerId);
        if (listener) {
            listener.element.removeEventListener(listener.event, listener.handler, listener.options);
            this.listeners.delete(listenerId);
            return true;
        }
        return false;
    }

    // setTimeout con cleanup automático
    setTimeout(callback, delay) {
        const timerId = setTimeout(() => {
            this.timers.delete(timerId);
            try {
                callback();
            } catch (error) {
                console.error('Error en setTimeout:', error);
            }
        }, delay);

        this.timers.add(timerId);
        return timerId;
    }

    // setInterval con cleanup automático
    setInterval(callback, interval) {
        const intervalId = setInterval(() => {
            try {
                callback();
            } catch (error) {
                console.error('Error en setInterval:', error);
            }
        }, interval);

        this.intervals.add(intervalId);
        return intervalId;
    }

    // Limpiar timer específico
    clearTimeout(timerId) {
        if (this.timers.has(timerId)) {
            clearTimeout(timerId);
            this.timers.delete(timerId);
        }
    }

    // Limpiar interval específico
    clearInterval(intervalId) {
        if (this.intervals.has(intervalId)) {
            clearInterval(intervalId);
            this.intervals.delete(intervalId);
        }
    }

    // Limpiar todos los event listeners
    removeAllEventListeners() {
        for (const [listenerId, listener] of this.listeners) {
            listener.element.removeEventListener(listener.event, listener.handler, listener.options);
        }
        this.listeners.clear();
    }

    // Limpiar todos los timers
    clearAllTimers() {
        for (const timerId of this.timers) {
            clearTimeout(timerId);
        }
        this.timers.clear();
    }

    // Limpiar todos los intervals
    clearAllIntervals() {
        for (const intervalId of this.intervals) {
            clearInterval(intervalId);
        }
        this.intervals.clear();
    }

    // Cleanup completo
    cleanup() {
        this.removeAllEventListeners();
        this.clearAllTimers();
        this.clearAllIntervals();
    }

    // Obtener estadísticas
    getStats() {
        return {
            listeners: this.listeners.size,
            timers: this.timers.size,
            intervals: this.intervals.size
        };
    }
}

// Instancia global
const eventManager = new EventManager();

// Cleanup automático al cerrar la página
window.addEventListener('beforeunload', () => {
    eventManager.cleanup();
});

// Cleanup automático cada 5 minutos para timers huérfanos
setInterval(() => {
    const stats = eventManager.getStats();
    if (stats.timers > 50 || stats.intervals > 20) {
        console.warn('⚠️ Posible memory leak detectado:', stats);
    }
}, 300000);

export { EventManager, eventManager };