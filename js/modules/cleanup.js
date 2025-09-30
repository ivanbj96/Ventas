// Sistema de limpieza automática
class AutoCleanup {
    constructor() {
        this.intervals = new Set();
        this.timeouts = new Set();
        this.listeners = new Map();
    }
    
    addInterval(id) { this.intervals.add(id); }
    addTimeout(id) { this.timeouts.add(id); }
    addListener(element, event, handler) {
        const key = `${element.id}_${event}`;
        if (this.listeners.has(key)) {
            element.removeEventListener(event, this.listeners.get(key));
        }
        this.listeners.set(key, handler);
        element.addEventListener(event, handler);
    }
    
    cleanup() {
        this.intervals.forEach(id => clearInterval(id));
        this.timeouts.forEach(id => clearTimeout(id));
        this.listeners.forEach((handler, key) => {
            const [elementId, event] = key.split('_');
            const element = document.getElementById(elementId);
            if (element) element.removeEventListener(event, handler);
        });
        this.intervals.clear();
        this.timeouts.clear();
        this.listeners.clear();
    }
}

const cleanup = new AutoCleanup();
window.addEventListener('beforeunload', () => cleanup.cleanup());
export default cleanup;