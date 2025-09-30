// Sistema de seguridad básico
class SecurityManager {
    constructor() {
        this.sanitizers = new Map();
        this.validators = new Map();
    }
    
    sanitizeInput(input, type = 'text') {
        if (!input) return '';
        
        switch (type) {
            case 'html':
                return input.replace(/[<>]/g, '');
            case 'number':
                return parseFloat(input) || 0;
            case 'text':
            default:
                return String(input).trim();
        }
    }
    
    validateData(data, schema) {
        const errors = [];
        
        for (const [key, rules] of Object.entries(schema)) {
            const value = data[key];
            
            if (rules.required && !value) {
                errors.push(`${key} es requerido`);
            }
            
            if (rules.type && typeof value !== rules.type) {
                errors.push(`${key} debe ser de tipo ${rules.type}`);
            }
            
            if (rules.min && value < rules.min) {
                errors.push(`${key} debe ser mayor a ${rules.min}`);
            }
        }
        
        return { valid: errors.length === 0, errors };
    }
    
    encryptSensitiveData(data) {
        // Implementación básica - en producción usar crypto real
        return btoa(JSON.stringify(data));
    }
    
    decryptSensitiveData(encrypted) {
        try {
            return JSON.parse(atob(encrypted));
        } catch {
            return null;
        }
    }
}

const security = new SecurityManager();
export default security;