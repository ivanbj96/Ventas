// ========================================
// ⚙️ CONFIGURACIÓN GLOBAL DE LA APLICACIÓN
// ========================================

export const APP_CONFIG = {
  // Información de la aplicación
  name: 'TillUp POS',
  version: '2.1.0',
  
  // Configuración de WebSocket
  websocket: {
    url: 'wss://ya76uc6b7j.execute-api.us-east-1.amazonaws.com/prod',
    reconnectAttempts: 5,
    reconnectDelay: 1000,
    heartbeatInterval: 30000,
    autoSyncInterval: 10000
  },
  
  // Configuración de persistencia
  persistence: {
    backupInterval: 300000, // 5 minutos
    maxBackups: 5,
    changeDetectionDelay: 30000 // 30 segundos
  },
  
  // Configuración de UI
  ui: {
    animationDuration: 300,
    toastDuration: 3000,
    debounceDelay: 300
  },
  
  // Configuración de validación
  validation: {
    maxNameLength: 100,
    maxDescriptionLength: 500,
    minPrice: 0.01,
    maxPrice: 999999.99
  },
  
  // Configuración de pollos
  chicken: {
    defaultPricePerPound: 2.50,
    defaultCostPerPound: 0,
    maxWeight: 50,
    minWeight: 0.1
  },
  
  // Configuración de seguridad
  security: {
    maxLoginAttempts: 5,
    sessionTimeout: 3600000, // 1 hora
    encryptLocalStorage: false
  }
};

// Configuración de módulos para evitar dependencias circulares
export const MODULE_CONFIG = {
  loadOrder: [
    'utils',
    'state', 
    'persistence',
    'event-manager',
    'cart',
    'products',
    'clients',
    'chicken',
    'charts',
    'rendering',
    'mobile',
    'quickActions',
    'websocket'
  ],
  
  dependencies: {
    'cart': ['state', 'utils'],
    'products': ['state', 'utils', 'persistence'],
    'clients': ['state', 'utils', 'persistence'],
    'chicken': ['state', 'utils', 'persistence'],
    'rendering': ['state', 'utils'],
    'websocket': ['state', 'utils']
  }
};

// Configuración de eventos para prevenir memory leaks
export const EVENT_CONFIG = {
  maxListeners: 100,
  maxTimers: 50,
  maxIntervals: 20,
  cleanupInterval: 300000 // 5 minutos
};

export default APP_CONFIG;