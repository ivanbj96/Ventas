// Sistema de manejo de errores centralizado
class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 50;
    }
    
    handle(error, context = 'Unknown') {
        const errorInfo = {
            message: error.message || error,
            context,
            timestamp: new Date().toISOString(),
            stack: error.stack
        };
        
        this.errors.push(errorInfo);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // Solo mostrar errores críticos al usuario
        if (this.isCritical(error)) {
            this.showUserError(error);
        }
    }
    
    isCritical(error) {
        const criticalPatterns = [
            'network error',
            'storage quota exceeded',
            'websocket connection failed'
        ];
        return criticalPatterns.some(pattern => 
            error.message?.toLowerCase().includes(pattern)
        );
    }
    
    showUserError(error) {
        if (window.Swal) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ha ocurrido un error. Por favor, intenta de nuevo.',
                confirmButtonText: 'Aceptar'
            });
        }
    }
}

const errorHandler = new ErrorHandler();
window.addEventListener('error', (e) => errorHandler.handle(e.error, 'Global'));
export default errorHandler;