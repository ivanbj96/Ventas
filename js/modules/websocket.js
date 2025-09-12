// ========================================
// 🔄 WEBSOCKET SYNC MODULE
// ========================================
// Sistema de sincronización en tiempo real con WebSocket

import { saveToStorage } from './persistence.js';
import { 
  products, 
  clients, 
  sales, 
  debts, 
  chickenSales,
  setProducts,
  setClients,
  setSales,
  setDebts,
  setChickenSales
} from './state.js';

class WebSocketSync_DISABLED {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.userId = this.getUserId();
    this.serverUrl = 'wss://your-websocket-server.com'; // Configurar URL del servidor
    this.messageQueue = [];
    this.isOnline = navigator.onLine;
    
    this.init();
  }

  init() {
    // Configurar eventos de conexión
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.connect();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.disconnect();
    });

    // Conectar si está online
    if (this.isOnline) {
      this.connect();
    }

    console.log('🔄 WebSocket Sync Module initialized');
  }

  getUserId() {
    let userId = localStorage.getItem('tillup_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('tillup_user_id', userId);
    }
    return userId;
  }

  connect() {
    if (!this.isOnline || this.isConnected) return;

    try {
      this.ws = new WebSocket(this.serverUrl);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('🔄 WebSocket connected');
        
        // Enviar identificación del usuario
        this.send({
          type: 'user_identification',
          userId: this.userId,
          timestamp: Date.now()
        });

        // Procesar cola de mensajes pendientes
        this.processMessageQueue();
        
        // Notificar conexión exitosa
        this.showNotification('Sincronización conectada', 'success');
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log('🔄 WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('🔄 WebSocket error:', error);
        this.isConnected = false;
      };

    } catch (error) {
      console.error('🔄 WebSocket connection failed:', error);
      this.attemptReconnect();
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.isOnline) {
      console.log('🔄 Max reconnection attempts reached or offline');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(data) {
    const message = {
      ...data,
      userId: this.userId,
      timestamp: Date.now()
    };

    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Agregar a cola si no está conectado
      this.messageQueue.push(message);
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        // Volver a agregar a la cola si la conexión se perdió
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  handleMessage(data) {
    // Ignorar mensajes propios
    if (data.userId === this.userId) return;

    console.log('🔄 Received sync message:', data);

    switch (data.type) {
      case 'product_added':
        this.handleProductAdded(data.product);
        break;
      case 'product_updated':
        this.handleProductUpdated(data.product);
        break;
      case 'product_deleted':
        this.handleProductDeleted(data.productId);
        break;
      case 'client_added':
        this.handleClientAdded(data.client);
        break;
      case 'client_updated':
        this.handleClientUpdated(data.client);
        break;
      case 'client_deleted':
        this.handleClientDeleted(data.clientId);
        break;
      case 'sale_added':
        this.handleSaleAdded(data.sale);
        break;
      case 'chicken_sale_added':
        this.handleChickenSaleAdded(data.sale);
        break;
      case 'debt_added':
        this.handleDebtAdded(data.debt);
        break;
      case 'debt_updated':
        this.handleDebtUpdated(data.debt);
        break;
      case 'full_sync_request':
        this.handleFullSyncRequest();
        break;
      case 'full_sync_data':
        this.handleFullSyncData(data.syncData);
        break;
      default:
        console.log('🔄 Unknown message type:', data.type);
    }
  }

  // Métodos para manejar sincronización de productos
  handleProductAdded(product) {
    const existingIndex = products.findIndex(p => p.id === product.id);
    if (existingIndex === -1) {
      products.push(product);
      setProducts(products);
      saveToStorage('products', products);
      this.refreshUI('inventory');
      this.showNotification(`Producto agregado: ${product.name}`, 'info');
    }
  }

  handleProductUpdated(product) {
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
      setProducts(products);
      saveToStorage('products', products);
      this.refreshUI('inventory');
      this.showNotification(`Producto actualizado: ${product.name}`, 'info');
    }
  }

  handleProductDeleted(productId) {
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      const productName = products[index].name;
      products.splice(index, 1);
      setProducts(products);
      saveToStorage('products', products);
      this.refreshUI('inventory');
      this.showNotification(`Producto eliminado: ${productName}`, 'warning');
    }
  }

  // Métodos para manejar sincronización de clientes
  handleClientAdded(client) {
    const existingIndex = clients.findIndex(c => c.id === client.id);
    if (existingIndex === -1) {
      clients.push(client);
      setClients(clients);
      saveToStorage('clients', clients);
      this.refreshUI('clients');
      this.showNotification(`Cliente agregado: ${client.name}`, 'info');
    }
  }

  handleClientUpdated(client) {
    const index = clients.findIndex(c => c.id === client.id);
    if (index !== -1) {
      clients[index] = client;
      setClients(clients);
      saveToStorage('clients', clients);
      this.refreshUI('clients');
      this.showNotification(`Cliente actualizado: ${client.name}`, 'info');
    }
  }

  handleClientDeleted(clientId) {
    const index = clients.findIndex(c => c.id === clientId);
    if (index !== -1) {
      const clientName = clients[index].name;
      clients.splice(index, 1);
      setClients(clients);
      saveToStorage('clients', clients);
      this.refreshUI('clients');
      this.showNotification(`Cliente eliminado: ${clientName}`, 'warning');
    }
  }

  // Métodos para manejar sincronización de ventas
  handleSaleAdded(sale) {
    const existingIndex = sales.findIndex(s => s.id === sale.id);
    if (existingIndex === -1) {
      sales.push(sale);
      setSales(sales);
      saveToStorage('sales', sales);
      this.refreshUI('balance');
      this.showNotification(`Nueva venta: $${sale.total.toFixed(2)}`, 'success');
    }
  }

  handleChickenSaleAdded(sale) {
    const existingIndex = chickenSales.findIndex(s => s.id === sale.id);
    if (existingIndex === -1) {
      chickenSales.push(sale);
      setChickenSales(chickenSales);
      saveToStorage('chickenSales', chickenSales);
      this.refreshUI('chickens');
      this.showNotification(`Venta de pollos: $${sale.total.toFixed(2)}`, 'success');
    }
  }

  // Métodos para manejar sincronización de deudas
  handleDebtAdded(debt) {
    const existingIndex = debts.findIndex(d => d.id === debt.id);
    if (existingIndex === -1) {
      debts.push(debt);
      setDebts(debts);
      saveToStorage('debts', debts);
      this.refreshUI('debt');
      this.showNotification(`Nueva deuda: ${debt.clientName}`, 'warning');
    }
  }

  handleDebtUpdated(debt) {
    const index = debts.findIndex(d => d.id === debt.id);
    if (index !== -1) {
      debts[index] = debt;
      setDebts(debts);
      saveToStorage('debts', debts);
      this.refreshUI('debt');
      this.showNotification(`Deuda actualizada: ${debt.clientName}`, 'info');
    }
  }

  // Sincronización completa
  handleFullSyncRequest() {
    const syncData = {
      products: products,
      clients: clients,
      sales: sales,
      debts: debts,
      chickenSales: chickenSales
    };

    this.send({
      type: 'full_sync_data',
      syncData: syncData
    });
  }

  handleFullSyncData(syncData) {
    // Actualizar datos locales con datos remotos
    if (syncData.products) {
      setProducts(syncData.products);
      saveToStorage('products', syncData.products);
    }
    if (syncData.clients) {
      setClients(syncData.clients);
      saveToStorage('clients', syncData.clients);
    }
    if (syncData.sales) {
      setSales(syncData.sales);
      saveToStorage('sales', syncData.sales);
    }
    if (syncData.debts) {
      setDebts(syncData.debts);
      saveToStorage('debts', syncData.debts);
    }
    if (syncData.chickenSales) {
      setChickenSales(syncData.chickenSales);
      saveToStorage('chickenSales', syncData.chickenSales);
    }

    this.refreshUI('all');
    this.showNotification('Sincronización completa realizada', 'success');
  }

  // Métodos públicos para sincronizar cambios
  syncProductAdded(product) {
    this.send({
      type: 'product_added',
      product: product
    });
  }

  syncProductUpdated(product) {
    this.send({
      type: 'product_updated',
      product: product
    });
  }

  syncProductDeleted(productId) {
    this.send({
      type: 'product_deleted',
      productId: productId
    });
  }

  syncClientAdded(client) {
    this.send({
      type: 'client_added',
      client: client
    });
  }

  syncClientUpdated(client) {
    this.send({
      type: 'client_updated',
      client: client
    });
  }

  syncClientDeleted(clientId) {
    this.send({
      type: 'client_deleted',
      clientId: clientId
    });
  }

  syncSaleAdded(sale) {
    this.send({
      type: 'sale_added',
      sale: sale
    });
  }

  syncChickenSaleAdded(sale) {
    this.send({
      type: 'chicken_sale_added',
      sale: sale
    });
  }

  syncDebtAdded(debt) {
    this.send({
      type: 'debt_added',
      debt: debt
    });
  }

  syncDebtUpdated(debt) {
    this.send({
      type: 'debt_updated',
      debt: debt
    });
  }

  requestFullSync() {
    this.send({
      type: 'full_sync_request'
    });
  }

  // Utilidades
  refreshUI(section) {
    if (typeof window.renderInventory === 'function' && (section === 'inventory' || section === 'all')) {
      window.renderInventory();
    }
    if (typeof window.renderClients === 'function' && (section === 'clients' || section === 'all')) {
      window.renderClients();
    }
    if (typeof window.renderDebts === 'function' && (section === 'debt' || section === 'all')) {
      window.renderDebts();
    }
    if (typeof window.renderBalanceGrid === 'function' && (section === 'balance' || section === 'all')) {
      window.renderBalanceGrid();
    }
    if (typeof window.updateChickenSalesList === 'function' && (section === 'chickens' || section === 'all')) {
      window.updateChickenSalesList();
    }
  }

  showNotification(message, type = 'info') {
    // Crear notificación visual
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'error' ? 'danger' : 'info'} sync-notification`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      min-width: 300px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    notification.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="bi bi-arrow-repeat me-2"></i>
        <span>${message}</span>
        <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // Métodos de estado
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isOnline: this.isOnline,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length
    };
  }

  // Configuración del servidor
  setServerUrl(url) {
    this.serverUrl = url;
    localStorage.setItem('tillup_websocket_server', url);
  }

  getServerUrl() {
    return localStorage.getItem('tillup_websocket_server') || this.serverUrl;
  }
}

// DESHABILITADO TEMPORALMENTE - CONFLICTO CON websocket-sync-client.js
// const webSocketSync = new WebSocketSync_DISABLED();
// export default webSocketSync;
// export { WebSocketSync_DISABLED as WebSocketSync };