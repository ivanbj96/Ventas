/**
 * TillUp Instant Sync - Sincronización instantánea tipo WhatsApp
 */
class TillUpInstantSync {
    constructor() {
        this.wsUrl = TILLUP_SYNC_CONFIG.WEBSOCKET_URL;
        this.userId = TILLUP_SYNC_CONFIG.FIXED_USER_ID;
        this.deviceId = this.getDeviceId();
        this.ws = null;
        this.connected = false;
        this.messageQueue = [];
        
        this.init();
    }
    
    getDeviceId() {
        let deviceId = localStorage.getItem('tillup_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tillup_device_id', deviceId);
        }
        return deviceId;
    }
    
    init() {
        this.connect();
        this.setupDataInterceptors();
    }
    
    connect() {
        const url = `${this.wsUrl}?userId=${this.userId}&deviceId=${this.deviceId}`;
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
            this.connected = true;
            console.log('⚡ Instant Sync conectado');
            this.processMessageQueue();
        };
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (e) {
                console.log('Raw message:', event.data);
            }
        };
        
        this.ws.onclose = () => {
            this.connected = false;
            setTimeout(() => this.connect(), 1000);
        };
    }
    
    handleMessage(data) {
        if (data.payload?.sourceDeviceId === this.deviceId) return;
        
        switch (data.type) {
            case 'data_sync':
                this.instantDataUpdate(data.payload);
                break;
            case 'action_sync':
                this.instantActionUpdate(data.payload);
                break;
        }
    }
    
    setupDataInterceptors() {
        this.interceptFunction('addProduct', 'product_added');
        this.interceptFunction('addClient', 'client_added');
        this.interceptFunction('finalizeSale', 'sale_completed');
        this.interceptFunction('processChickenSale', 'chicken_sale_added');
        this.interceptFunction('payDebt', 'debt_payment');
    }
    
    interceptFunction(funcName, actionType) {
        const tryIntercept = () => {
            if (typeof window[funcName] === 'function') {
                const original = window[funcName];
                window[funcName] = async (...args) => {
                    const result = await original.apply(this, args);
                    
                    if (this.connected) {
                        this.instantSync(actionType);
                    }
                    
                    return result;
                };
                return true;
            }
            return false;
        };
        
        if (!tryIntercept()) {
            setTimeout(() => tryIntercept(), 1000);
        }
    }
    
    instantSync(actionType) {
        const actionMessage = {
            type: 'action_sync',
            payload: {
                action: actionType,
                sourceDeviceId: this.deviceId,
                timestamp: Date.now()
            }
        };
        this.sendMessage(actionMessage);
        
        const dataMessage = {
            type: 'data_sync',
            payload: {
                dataType: 'full_sync',
                data: this.getAllAppData(),
                operation: 'full_update',
                sourceDeviceId: this.deviceId,
                timestamp: Date.now()
            }
        };
        this.sendMessage(dataMessage);
    }
    
    instantDataUpdate(payload) {
        if (payload.dataType === 'full_sync') {
            this.applyFullSync(payload.data);
        }
        this.instantUIUpdate();
    }
    
    instantActionUpdate(payload) {
        this.showInstantIndicator(payload.action);
        setTimeout(() => {
            const request = {
                type: 'request_sync',
                payload: {
                    requesterId: this.deviceId,
                    timestamp: Date.now()
                }
            };
            this.sendMessage(request);
        }, 50);
    }
    
    applyFullSync(allData) {
        const keys = ['products', 'clients', 'sales', 'debts', 'chickenSales', 'movements'];
        
        for (const key of keys) {
            if (allData[key]) {
                localStorage.setItem(key, JSON.stringify(allData[key]));
                if (window[key] !== undefined) {
                    window[key] = allData[key];
                }
            }
        }
    }
    
    instantUIUpdate() {
        const updateFunctions = [
            'renderInventory',
            'renderClients', 
            'renderSalesProducts',
            'updateBalanceUI',
            'renderDebts'
        ];
        
        updateFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                try {
                    window[funcName]();
                } catch (e) {
                    console.log(`Error updating ${funcName}:`, e);
                }
            }
        });
        
        document.body.offsetHeight;
    }
    
    getAllAppData() {
        const data = {};
        const keys = ['products', 'clients', 'sales', 'debts', 'chickenSales', 'movements'];
        
        keys.forEach(key => {
            try {
                const stored = localStorage.getItem(key);
                data[key] = stored ? JSON.parse(stored) : [];
            } catch (e) {
                data[key] = window[key] || [];
            }
        });
        
        return data;
    }
    
    showInstantIndicator(action) {
        const messages = {
            'product_added': '📦',
            'client_added': '👥',
            'sale_completed': '💰',
            'chicken_sale_added': '🐔',
            'debt_payment': '💳'
        };
        
        const indicator = document.createElement('div');
        indicator.innerHTML = messages[action] || '🔄';
        indicator.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 8px 12px;
            border-radius: 50%;
            font-size: 16px;
            z-index: 99999;
            animation: instantPulse 1s ease-out;
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 1000);
    }
    
    sendMessage(message) {
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            this.messageQueue.push(message);
        }
    }
    
    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.connected) {
            const message = this.messageQueue.shift();
            this.ws.send(JSON.stringify(message));
        }
    }
}

const instantStyles = document.createElement('style');
instantStyles.textContent = `
    @keyframes instantPulse {
        0% { transform: scale(0) rotate(0deg); opacity: 0; }
        50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
        100% { transform: scale(1) rotate(360deg); opacity: 0; }
    }
`;
document.head.appendChild(instantStyles);

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.tillupInstantSync = new TillUpInstantSync();
        console.log('⚡ TillUp Instant Sync inicializado');
    }, 1000);
});