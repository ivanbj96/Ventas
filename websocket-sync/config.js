// Configuración actualizada automáticamente 
const TILLUP_SYNC_CONFIG = { 
    WEBSOCKET_URL: 'wss://yz3k426op4.execute-api.us-east-1.amazonaws.com/prod', 
    FIXED_USER_ID: 'tillup_test_user_2024', 
    MAX_RECONNECT_ATTEMPTS: 10, 
    RECONNECT_DELAY_BASE: 1000, 
    RECONNECT_DELAY_MAX: 30000, 
    SYNC_DEBOUNCE: 500, 
    HEARTBEAT_INTERVAL: 30000, 
    CRITICAL_DATA: ['products', 'clients', 'sales', 'debts', 'chickenSales', 'movements'], 
    SETTINGS_DATA: ['pricePerPound', 'costPerPound', 'theme', 'inventoryViewMode', 'clientsViewMode'], 
    MESSAGE_TYPES: { 
        DATA_SYNC: 'data_sync', 
        ACTION_SYNC: 'action_sync', 
        REQUEST_SYNC: 'request_sync',
        SYNC_REQUEST: 'sync_request', 
        DEVICE_CONNECTED: 'device_connected', 
        DEVICE_DISCONNECTED: 'device_disconnected', 
        HEARTBEAT: 'heartbeat' 
    }, 
    SYNC_ACTIONS: { 
        PRODUCT_ADDED: 'product_added', 
        CLIENT_ADDED: 'client_added', 
        SALE_COMPLETED: 'sale_completed', 
        CHICKEN_SALE_ADDED: 'chicken_sale_added', 
        DEBT_PAYMENT: 'debt_payment', 
        DEBT_ADDED: 'debt_added' 
    } 
}; 
if (typeof module !== 'undefined' && module.exports) { 
    module.exports = TILLUP_SYNC_CONFIG; 
} else { 
    window.TILLUP_SYNC_CONFIG = TILLUP_SYNC_CONFIG; 
} 
