// Sistema de logging estructurado
class Logger {
    constructor() {
        this.level = 'info';
        this.enabled = false; // Deshabilitado por defecto
    }
    
    log(level, ...args) {
        if (!this.enabled) return;
        if (level === 'error') console.error(...args);
    }
    
    error(...args) { this.log('error', ...args); }
    warn(...args) { this.log('warn', ...args); }
    info(...args) { this.log('info', ...args); }
    debug(...args) { this.log('debug', ...args); }
}

export const logger = new Logger();
export default logger;