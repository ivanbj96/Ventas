// ========================================
// 🌟 TILLUP POS - APLICACIÓN PRINCIPAL MODULAR
// ========================================
// Sistema de gestión de ventas, inventario, clientes y pollos
// Desarrollado con JavaScript ES6+ y arquitectura modular

// === IMPORTACIONES DE MÓDULOS ===
import { 
  products, 
  clients, 
  sales, 
  debts, 
  movements, 
  cart,
  chickenSales,
  pricePerPound,
  costPerPound,
  setInventoryViewMode,
  setClientsViewMode,
  setChickenSales
} from './modules/state.js';

import { 
  normalizeDate, 
  formatCurrency, 
  formatDate, 
  generateId,
  isMobileDevice,
  getLocalDateString,
  getLocalDate,
  getLocalDateTime
} from './modules/utils.js';

import { 
  initializeChickenData,
  updatePricePerPound,
  handleChickenSale,
  setupChickenMermaCalculation,
  setupChickenDateFilter,
  processChickenSale,
  updateChickenStats,
  updateChickenSalesList,
  updateChickenCalculation,
  toggleChickenProfitVisibility,
  toggleChickenProfitCalcVisibility,
  updateCostFromMerma,
  editChickenSale,
  deleteChickenSale
} from './modules/chicken.js';

import { 
  initializeNativeEnhancements,
  hapticFeedback,
  showNativeNotification
} from './modules/mobile.js';

import { 
  updatePeriodDisplay,
  updateMainChart,
  getTrendChartData,
  getDistributionChartData,
  initializeChart
} from './modules/charts.js';

import { 
  loadData,
  saveToStorage
} from './modules/persistence.js';

import { 
  setupQuickActions,
  showQuickActions,
  quickAction
} from './modules/quickActions.js';

import {
  renderInventory,
  renderClients,
  renderDebts,
  renderSalesProducts,
  renderBalanceGrid,
  updateBalanceUI,
  updateChickenSalesFromStorage
} from './modules/rendering.js';

import {
  addToCart,
  removeFromCart,
  changeCartQty,
  clearCart,
  renderCart,
  finalizeSale,
  selectClientForCart,
  removeSelectedClient
} from './modules/cart.js';

import {
  addProduct,
  deleteProduct,
  editProduct,
  showProductDetailModal,
  setupProductImagePreview
} from './modules/products.js';

import {
  addClient,
  deleteClient,
  editClient,
  showClientDetails,
  showDebtDetailModal,
  updateClientSelector as updateClientSelectorModule,
  setupClientImagePreview,
  setupClientLocation
} from './modules/clients.js';

import {
  showReceipt,
  showPaymentReceipt,
  showGenericMovementDetail,
  saveProforma,
  loadProforma,
  deleteProforma,
  showCreditSaleModal,
  processChickenSale as processChickenSaleFromMissing,
  isValidEmail,
  filtrarPorFecha,
  cleanupMovementsView,
  showAdvancedStats,
  setPeriodFilter,
  applyCustomFilter,
  clearMovementFilters,
  showChart,
  toggleRevenueVisibility
} from './modules/missing-functions.js';

import {
  generatePDF
} from './modules/pdf-generator.js';

// import webSocketSync from './modules/websocket.js'; // DESHABILITADO TEMPORALMENTE

// ========================================
// 🚀 INICIALIZACIÓN PRINCIPAL
// ========================================

// === INICIALIZACIÓN DE DATOS ===
async function initializeData() {
  try {
    await loadData();
    initializeChickenData();
    
    // Sincronizar chickenSales desde localStorage
    updateChickenSalesFromStorage();
    
    // Renderizar todas las vistas
    renderInventory();
    renderClients();
    renderDebts();
    renderSalesProducts();
    updateBalanceUI();
    renderBalanceGrid();
    
    console.log('Aplicación inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando datos:', error);
  }
}

// Declarar variable antes de usarla
let currentSyncUser = null;

// === INICIALIZACIÓN AUTOMÁTICA DE SINCRONIZACIÓN ===
function initializeAutoSync() {
  const savedUser = localStorage.getItem('tillup_sync_user');
  if (savedUser) {
    currentSyncUser = savedUser;
    // Inicializar sincronización inmediatamente
    if (typeof initTillUpSync === 'function') {
      initTillUpSync(currentSyncUser);
      tillupSync = window.syncManager;
      
      // Solicitar datos inmediatamente al conectar
      setTimeout(() => {
        if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
          window.tillupWebSocketClient.requestDataFromAllDevices();
        }
      }, 500);
    }
  }
}

// === SINCRONIZACIÓN AUTOMÁTICA DE TODOS LOS DATOS ===
function autoSyncAllData() {
  if (!tillupSync || !tillupSync.isEnabled) return;
  
  const allData = {
    products: products || [],
    clients: clients || [],
    sales: sales || [],
    debts: debts || [],
    chickenSales: JSON.parse(localStorage.getItem('chickenSales') || '[]')
  };
  
  const totalItems = allData.products.length + allData.clients.length + allData.sales.length + allData.debts.length + allData.chickenSales.length;
  
  if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
    if (totalItems === 0) {
      // Si no hay datos, solicitar en lugar de enviar vacío
      window.tillupWebSocketClient.send({
        action: 'request_sync_data',
        data: { userId: currentSyncUser }
      });
      console.log('🔄 Solicitando datos automáticamente (dispositivo vacío)');
    } else {
      // Si hay datos, enviar normalmente
      window.tillupWebSocketClient.send({
        action: 'full_sync_data',
        data: allData
      });
      console.log('🔄 Sincronización automática enviada');
    }
  }
}

// === INTEGRACIÓN DE SINCRONIZACIÓN EN FUNCIONES EXISTENTES ===
// Función auxiliar para sincronizar después de operaciones
function syncAfterOperation(type, data) {
  if (window.syncManager && window.syncManager.isEnabled) {
    console.log('🔄 Sincronizando', type, ':', data.id || data.name);
    switch (type) {
      case 'product':
        window.syncManager.syncProduct(data);
        break;
      case 'client':
        window.syncManager.syncClient(data);
        break;
      case 'sale':
        window.syncManager.syncSale(data);
        break;
      case 'chicken_sale':
        window.syncManager.syncChickenSale(data);
        break;
      case 'debt':
        window.syncManager.syncDebt(data);
        break;
    }
  } else {
    console.log('⚠️ Sync manager no disponible para sincronizar', type);
  }
}

// === SOLICITAR DATOS DE OTROS DISPOSITIVOS ===
function requestDataFromOtherDevices() {
  if (!window.tillupWebSocketClient || !window.tillupWebSocketClient.isConnected) {
    Swal.fire({
      icon: 'warning',
      title: 'Sin conexión WebSocket',
      text: 'Configura un usuario y verifica la conexión.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  const currentData = {
    products: JSON.parse(localStorage.getItem('products') || '[]').length,
    clients: JSON.parse(localStorage.getItem('clients') || '[]').length,
    sales: JSON.parse(localStorage.getItem('sales') || '[]').length,
    debts: JSON.parse(localStorage.getItem('debts') || '[]').length,
    chickenSales: JSON.parse(localStorage.getItem('chickenSales') || '[]').length
  };
  
  const totalItems = currentData.products + currentData.clients + currentData.sales + currentData.debts + currentData.chickenSales;
  
  Swal.fire({
    icon: 'question',
    title: 'Solicitar datos de otros dispositivos',
    html: `
      <div class="text-start">
        <p><strong>Datos actuales en este dispositivo:</strong></p>
        <ul>
          <li>${currentData.products} productos</li>
          <li>${currentData.clients} clientes</li>
          <li>${currentData.sales} ventas</li>
          <li>${currentData.debts} deudas</li>
          <li>${currentData.chickenSales} ventas de pollos</li>
        </ul>
        ${totalItems > 0 ? 
          '<div class="alert alert-info"><i class="bi bi-info-circle"></i> Los datos recibidos se combinarán con los existentes.</div>' :
          '<div class="alert alert-success"><i class="bi bi-download"></i> Perfecto para recibir datos en un dispositivo nuevo.</div>'
        }
        <p>¿Solicitar datos de otros dispositivos conectados?</p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-cloud-download"></i> Solicitar Datos',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#198754'
  }).then((result) => {
    if (result.isConfirmed) {
      window.tillupWebSocketClient.send({
        action: 'request_sync_data',
        data: { userId: window.tillupWebSocketClient.userId }
      });
      console.log('🔄 Solicitando datos de otros dispositivos');
      
      Swal.fire({
        icon: 'info',
        title: 'Solicitud enviada',
        text: 'Se ha enviado una solicitud para recibir datos de otros dispositivos conectados.',
        confirmButtonText: 'Aceptar'
      });
    }
  });
}

// Cargar usuario guardado al iniciar
const savedUser = localStorage.getItem('tillup_sync_user');
if (savedUser) {
  currentSyncUser = savedUser;
}

// === INICIALIZACIÓN DE LA APLICACIÓN ===
document.addEventListener('DOMContentLoaded', async function() {
  // Cargar preferencias de vista
  try {
    const inventoryView = localStorage.getItem('inventoryViewMode');
    const clientsView = localStorage.getItem('clientsViewMode');
    
    if (inventoryView) setInventoryViewMode(inventoryView);
    if (clientsView) setClientsViewMode(clientsView);
  } catch (error) {
    console.warn('Error cargando preferencias:', error);
  }
  
  // Inicializar datos
  await initializeData();
  
  // Inicializar sincronización automática
  initializeAutoSync();
  
  // Activar sincronización instantánea si hay usuario configurado
  setTimeout(() => {
    if (currentSyncUser && window.tillupWebSocketClient) {
      window.tillupWebSocketClient.init(currentSyncUser);
      
      // Sincronizar datos inmediatamente al conectar
      setTimeout(() => {
        if (window.tillupWebSocketClient.isConnected) {
          syncAllDataAfterOperation();
          window.tillupWebSocketClient.requestDataFromAllDevices();
        }
      }, 3000);
    }
  }, 1000);
  
  // Configurar eventos de pollos
  setupChickenDateFilter();
  setupChickenMermaCalculation();
  
  // Configurar mejoras móviles
  initializeNativeEnhancements();
  
  // Configurar acciones rápidas
  setupQuickActions();
  
  // Configurar eventos globales
  setupGlobalEvents();
  
  // Configurar vistas previas de imágenes
  setupProductImagePreview();
  setupClientImagePreview();
  
  // Configurar geolocalización
  setupClientLocation();
  
  // Configurar eventos de formularios
  const formProduct = document.getElementById('formProduct');
  const formClient = document.getElementById('formClient');
  
  if (formProduct) {
    formProduct.onsubmit = addProduct;
  }
  
  if (formClient) {
    formClient.onsubmit = addClient;
  }
  
  // Configurar evento para limpiar formulario de productos al cerrar modal
  const modalProduct = document.getElementById('modalProduct');
  if (modalProduct) {
    modalProduct.addEventListener('hidden.bs.modal', function() {
      if (typeof window.resetProductForm === 'function') {
        window.resetProductForm();
      }
    });
  }
  
  // Configurar eventos de filtros de período
  document.querySelectorAll('input[name="periodFilter"]').forEach(radio => {
    radio.addEventListener('change', function() {
      setPeriodFilter(this.value);
      renderBalanceGrid();
      showAdvancedStats();
    });
  });
  
  // Configurar selector de clientes
  updateClientSelector();
  
  // Verificar que la sincronización esté funcionando
  if (window.syncManager) {
    console.log('🔄 Sync Manager disponible:', window.syncManager.isEnabled ? 'habilitado' : 'deshabilitado');
  }
  
  // Mostrar vista de balance por defecto (como en la versión original)
  showView('balance');
  
  console.log('TillUp POS inicializado correctamente');
  
  // Debug: verificar clientes después de la inicialización
  setTimeout(() => {
    console.log('🔍 Clientes después de inicialización:', clients ? clients.length : 0);
    if (window.debugClients) window.debugClients();
    
    // Si no hay clientes, mostrar mensaje informativo
    const clientsFromStorage = JSON.parse(localStorage.getItem('clients') || '[]');
    if (clientsFromStorage.length === 0) {
      console.log('ℹ️ No hay clientes. Puedes agregar uno desde la sección Clientes.');
      console.log('💡 O ejecuta forceUpdateSelectors() después de agregar clientes.');
    } else {
      console.log('✅ Clientes cargados correctamente:', clientsFromStorage.length);
      // Forzar actualización de selectores si hay clientes
      updateClientSelector();
    }
  }, 1000);
  
  // Inicializar fecha y hora en el sidebar
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  // Configurar evento del overlay del sidebar
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }
  
  // Inicializar fechas
  initializeDates();
  
  // Configurar cálculo de merma de pollos
  setupChickenMermaCalculation();
  
  // Configurar eventos de filtros de período (backup por si no se configuraron antes)
  setTimeout(() => {
    document.querySelectorAll('input[name="periodFilter"]').forEach(radio => {
      if (!radio.hasAttribute('data-listener-added')) {
        radio.addEventListener('change', function() {
          setPeriodFilter(this.value);
          renderBalanceGrid();
          showAdvancedStats();
        });
        radio.setAttribute('data-listener-added', 'true');
      }
    });
  }, 500);
  
  // Actualizar selector de clientes después de que se carguen los datos
  setTimeout(() => {
    updateClientSelector();
    console.log('🔄 Clientes cargados:', clients ? clients.length : 0);
    
    // Verificar que los selectores se actualizaron correctamente
    const testSelector = document.getElementById('cartClientSelector');
    if (testSelector) {
      console.log('✅ Selector de prueba tiene', testSelector.options.length, 'opciones');
    }
  }, 500);
  
  // Remover actualización periódica que causa bucle infinito
  
  // Configurar búsqueda de productos después de mostrar la vista
  setTimeout(() => {
    const productSearch = document.getElementById('productSearch');
    if (productSearch) {
      productSearch.addEventListener('input', function() {
        renderSalesProducts();
      });
    }
  }, 100);
});

// === CONFIGURACIÓN DE EVENTOS GLOBALES ===
function setupGlobalEvents() {
  // Evento para actualización forzada
  window.forceUpdateCheck = function() {
    hapticFeedback('medium');
    window.location.reload();
  };
  
  // Eventos de conexión
  window.addEventListener('online', () => {
    hapticFeedback('success');
    showNativeNotification('TillUp', {
      body: 'Conexión restaurada',
      tag: 'connection-restored'
    });
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.update();
        }
      });
    }
  });
  
  window.addEventListener('offline', () => {
    hapticFeedback('error');
    showNativeNotification('TillUp', {
      body: 'Sin conexión - Modo offline',
      tag: 'connection-lost'
    });
  });
  
  // Manejo de errores globales
  let lastVisibilityChange = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      lastVisibilityChange = Date.now();
    }
  });

  window.addEventListener('error', (e) => {
    const isResourceError = e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK');
    const isEmptyError = !e.error && !e.message && !e.filename;
    const isNullError = e.error === null || e.error === undefined;
    const justResumed = Date.now() - lastVisibilityChange < 1500;

    if (isResourceError || isEmptyError || isNullError || justResumed) {
      return;
    }

    console.error('Error:', e.error || e.message || e);
    hapticFeedback('error');
    
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ha ocurrido un error inesperado',
      confirmButtonText: 'Aceptar'
    });
  });
}

// ========================================
// 🔗 FUNCIONES GLOBALES EXPUESTAS
// ========================================



// === FUNCIÓN SHOWVIEW GLOBAL ===
function showView(viewName) {
  // Ocultar todas las vistas
  document.querySelectorAll('.app-view').forEach(v => v.classList.add('d-none'));
  
  // Mostrar la vista seleccionada
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.remove('d-none');
  }
  
  // Sincronizar precios al abrir vista de pollos
  if (viewName === 'chickens' && window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
    window.tillupWebSocketClient.requestDataFromAllDevices();
  }
  
  // Actualizar navegación del sidebar
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => btn.classList.remove('active'));
  const activeNavBtn = document.getElementById(`nav-${viewName}`);
  if (activeNavBtn) {
    activeNavBtn.classList.add('active');
  }
  
  // Cerrar sidebar en móvil
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
  }
}

// Exponer funciones necesarias al scope global para compatibilidad con HTML
window.showView = showView;
window.showReceipt = showReceipt;
window.showPaymentReceipt = showPaymentReceipt;
window.showGenericMovementDetail = showGenericMovementDetail;
window.saveProforma = saveProforma;
window.loadProforma = loadProforma;
window.deleteProforma = deleteProforma;
window.showCreditSaleModal = showCreditSaleModal;
window.processChickenSale = processChickenSaleFromMissing;
window.isValidEmail = isValidEmail;
window.filtrarPorFecha = filtrarPorFecha;
window.cleanupMovementsView = cleanupMovementsView;
window.showAdvancedStats = showAdvancedStats;
window.showQuickActions = showQuickActions;
window.quickAction = quickAction;
window.setPeriodFilter = setPeriodFilter;
window.applyCustomFilter = applyCustomFilter;
window.clearMovementFilters = clearMovementFilters;
window.showChart = showChart;
window.toggleRevenueVisibility = toggleRevenueVisibility;
window.updatePricePerPound = updatePricePerPound;
window.handleChickenSale = handleChickenSale;
window.updateChickenStats = updateChickenStats;
window.updateChickenSalesList = updateChickenSalesList;
window.updateChickenCalculation = updateChickenCalculation;
window.toggleChickenProfitVisibility = toggleChickenProfitVisibility;
window.toggleChickenProfitCalcVisibility = toggleChickenProfitCalcVisibility;
window.updateCostFromMerma = updateCostFromMerma;
window.editChickenSale = editChickenSale;
window.deleteChickenSale = deleteChickenSale;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeCartQty = changeCartQty;
window.clearCart = clearCart;
window.finalizeSale = finalizeSale;
window.selectClientForCart = selectClientForCart;
window.addProduct = addProduct;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.showProductDetailModal = showProductDetailModal;
window.addClient = addClient;
window.deleteClient = deleteClient;
window.editClient = editClient;
window.showClientDetails = showClientDetails;
window.showDebtDetailModal = showDebtDetailModal;
window.setInventoryViewMode = setInventoryViewMode;
window.setClientsViewMode = setClientsViewMode;
window.setChickenSales = setChickenSales;
window.removeSelectedClient = removeSelectedClient;

// Funciones del sidebar y navegación
window.openSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.style.display = 'block';
};

window.closeSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.style.display = 'none';
};

// Funciones del carrito drawer
window.toggleCartDrawer = function() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartDrawerOverlay');
  if (drawer && overlay) {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      drawer.classList.remove('open');
      overlay.style.display = 'none';
    } else {
      drawer.classList.add('open');
      overlay.style.display = 'block';
      // Renderizar carrito cuando se abre el drawer
      setTimeout(() => {
        renderCart();
        updateClientSelector();
      }, 100);
    }
  }
};

window.finalizeSaleDrawer = function() {
  finalizeSale();
};

// Funciones de búsqueda de clientes
window.openClientsSearchModal = function() {
  const modal = document.getElementById('clientsSearchModal');
  if (modal) modal.style.display = 'block';
};

window.closeClientsSearchModal = function() {
  const modal = document.getElementById('clientsSearchModal');
  if (modal) {
    modal.style.display = 'none';
    // Limpiar búsqueda al cerrar
    const searchInput = document.getElementById('clientsSearchInput');
    if (searchInput) searchInput.value = '';
    renderClients(); // Mostrar todos los clientes
  }
};

window.closeClientSearchModal = function() {
  const modal = document.getElementById('clientSearchModal');
  if (modal) modal.style.display = 'none';
};

// Funciones de vista de inventario y clientes
window.toggleInventoryView = function() {
  const currentView = localStorage.getItem('inventoryView') || 'grid';
  const newView = currentView === 'grid' ? 'list' : 'grid';
  localStorage.setItem('inventoryView', newView);
  setInventoryViewMode(newView);
  renderInventory();
};

window.toggleClientsView = function() {
  const currentView = localStorage.getItem('clientsView') || 'grid';
  const newView = currentView === 'grid' ? 'list' : 'grid';
  localStorage.setItem('clientsView', newView);
  setClientsViewMode(newView);
  renderClients();
};

// Función de generación de PDF
window.generatePDF = generatePDF;

// Funciones de instalación PWA
window.installPWA = function() {
  Swal.fire({
    icon: 'info',
    title: 'Instalación PWA',
    text: 'Use el menú de su navegador para instalar la aplicación.',
    confirmButtonText: 'Aceptar'
  });
};

// Funciones de configuración y utilidades
window.forceUpdate = function() {
  window.location.reload();
};

window.debugPWA = function() {
  console.log('Debug PWA - Información del Service Worker');
};

window.showBackupStatus = function() {
  Swal.fire({
    icon: 'info',
    title: 'Estado de Backups',
    text: 'Sistema de backups funcionando correctamente.',
    confirmButtonText: 'Aceptar'
  });
};

window.configureSyncOptions = function() {
  Swal.fire({
    icon: 'info',
    title: 'Opciones de Sincronización',
    text: 'Configuración de sincronización en desarrollo.',
    confirmButtonText: 'Aceptar'
  });
};

// ========================================
// 👤 SISTEMA DE USUARIOS PARA SINCRONIZACIÓN
// ========================================

// Variables ya declaradas arriba
let tillupSync = null;

// Configurar usuario para sincronización
function setupSyncUser() {
    Swal.fire({
        title: 'Configurar Sincronización',
        html: `
            <div class="mb-3">
                <label class="form-label">ID de Usuario (único)</label>
                <input type="text" id="syncUserId" class="form-control" 
                       placeholder="Ej: tienda_principal, usuario123" required>
                <div class="form-text">Este ID debe ser único y compartido entre tus dispositivos</div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Configurar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const userId = document.getElementById('syncUserId').value.trim();
            if (!userId) {
                Swal.showValidationMessage('El ID de usuario es requerido');
                return false;
            }
            return userId;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            currentSyncUser = result.value;
            localStorage.setItem('tillup_sync_user', currentSyncUser);
            
            // Inicializar sincronización
            if (typeof initTillUpSync === 'function') {
                initTillUpSync(currentSyncUser);
                tillupSync = window.syncManager;
            }
            
            // Inicializar sistema avanzado
            if (window.advancedSyncSystem) {
                window.advancedSyncSystem.enable(currentSyncUser);
            }
            
            Swal.fire({
                icon: 'success',
                title: '¡Sincronización Configurada!',
                text: `Usuario: ${currentSyncUser}`,
                timer: 2000
            });
        }
    });
}

// Configurar eventos de visibilidad para sincronización automática
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
    // Solicitar datos inmediatamente al volver a la app
    window.tillupWebSocketClient.requestDataFromAllDevices();
  }
});

// Sincronización cada 3 segundos para tiempo real
setInterval(() => {
  if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected && !document.hidden) {
    window.tillupWebSocketClient.requestDataFromAllDevices();
  }
}, 3000);

// Sincronización automática al detectar cambios en localStorage
let lastStorageCheck = {
  products: 0,
  clients: 0,
  sales: 0,
  debts: 0,
  chickenSales: 0
};

setInterval(() => {
  if (!window.tillupWebSocketClient || !window.tillupWebSocketClient.isConnected) return;
  
  const currentCounts = {
    products: JSON.parse(localStorage.getItem('products') || '[]').length,
    clients: JSON.parse(localStorage.getItem('clients') || '[]').length,
    sales: JSON.parse(localStorage.getItem('sales') || '[]').length,
    debts: JSON.parse(localStorage.getItem('debts') || '[]').length,
    chickenSales: JSON.parse(localStorage.getItem('chickenSales') || '[]').length
  };
  
  let hasChanges = false;
  Object.keys(currentCounts).forEach(key => {
    if (currentCounts[key] !== lastStorageCheck[key]) {
      hasChanges = true;
      lastStorageCheck[key] = currentCounts[key];
    }
  });
  
  if (hasChanges) {
    console.log('🔄 Cambios detectados en localStorage, sincronizando...');
    syncAllDataAfterOperation();
  }
}, 2000);

// Interceptar operaciones de deudas para sincronización completa
setTimeout(() => {
  // Interceptar cualquier función que modifique deudas
  const originalShowDebtDetailModal = window.showDebtDetailModal;
  if (originalShowDebtDetailModal) {
    window.showDebtDetailModal = function(debtId) {
      const result = originalShowDebtDetailModal.call(this, debtId);
      // Si se modifica una deuda, sincronizar
      setTimeout(() => {
        const observer = new MutationObserver(() => {
          syncAllDataAfterOperation();
          observer.disconnect();
        });
        const debtsContainer = document.getElementById('debtsList');
        if (debtsContainer) {
          observer.observe(debtsContainer, { childList: true, subtree: true });
        }
      }, 100);
      return result;
    };
  }
}, 2000);

// Función para mostrar estado de sincronización
function showSyncStatus() {
    if (!currentSyncUser) {
        Swal.fire({
            title: 'Sincronización no configurada',
            text: '¿Deseas configurar la sincronización ahora?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Configurar',
            cancelButtonText: 'Más tarde'
        }).then((result) => {
            if (result.isConfirmed) {
                setupSyncUser();
            }
        });
        return;
    }
    
    const status = window.syncManager ? window.syncManager.getStatus() : { enabled: false, connected: false };
    
    Swal.fire({
        title: 'Estado de Sincronización',
        html: `
            <div class="text-start">
                <p><strong>Usuario:</strong> ${currentSyncUser}</p>
                <p><strong>Estado:</strong> ${status.enabled ? '🟢 Habilitada' : '🔴 Deshabilitada'}</p>
                <p><strong>Conexión:</strong> ${status.connected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
                <p><strong>Última sync:</strong> ${status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Nunca'}</p>
            </div>
        `,
        icon: status.enabled && status.connected ? 'success' : 'warning',
        showCancelButton: true,
        confirmButtonText: 'Reconfigurar',
        cancelButtonText: 'Cerrar'
    }).then((result) => {
        if (result.isConfirmed) {
            setupSyncUser();
        }
    });
}

// Exponer funciones de sincronización
window.setupSyncUser = setupSyncUser;
window.showSyncStatus = showSyncStatus;
window.autoSyncAllData = autoSyncAllData;
window.requestDataFromOtherDevices = requestDataFromOtherDevices;
window.initializeAutoSync = initializeAutoSync;
window.syncAfterOperation = syncAfterOperation;
window.syncAllDataAfterOperation = syncAllDataAfterOperation;

// Función para inicializar sincronización automática inmediata
window.enableInstantSync = function() {
  if (!currentSyncUser) {
    setupSyncUser();
    return;
  }
  
  // Conectar inmediatamente
  if (window.tillupWebSocketClient) {
    window.tillupWebSocketClient.init(currentSyncUser);
    
    // Verificar conexión y sincronizar
    setTimeout(() => {
      if (window.tillupWebSocketClient.isConnected) {
        syncAllDataAfterOperation();
        window.tillupWebSocketClient.requestDataFromAllDevices();
        
        Swal.fire({
          icon: 'success',
          title: '🔄 Sincronización Instantánea Activada',
          text: 'Todos los cambios se sincronizarán automáticamente',
          timer: 2000,
          showConfirmButton: false
        });
      }
    }, 2000);
  }
};

// === SINCRONIZACIÓN AUTOMÁTICA COMPLETA ===
// Interceptar TODAS las operaciones para sincronización automática

// Función para sincronizar todos los datos después de cualquier operación
function syncAllDataAfterOperation() {
  if (!window.tillupWebSocketClient || !window.tillupWebSocketClient.isConnected) {
    return;
  }
  
  const allData = {
    products: JSON.parse(localStorage.getItem('products') || '[]'),
    clients: JSON.parse(localStorage.getItem('clients') || '[]'),
    sales: JSON.parse(localStorage.getItem('sales') || '[]'),
    debts: JSON.parse(localStorage.getItem('debts') || '[]'),
    chickenSales: JSON.parse(localStorage.getItem('chickenSales') || '[]')
  };
  
  window.tillupWebSocketClient.send({
    action: 'full_sync_data',
    data: allData
  });
  
  console.log('🔄 Sincronización automática completa enviada');
}

// Interceptar addProduct para sincronización completa
const originalAddProduct = window.addProduct;
if (originalAddProduct) {
  window.addProduct = async function(event) {
    const result = await originalAddProduct.call(this, event);
    setTimeout(() => syncAllDataAfterOperation(), 200);
    return result;
  };
}

// Interceptar editProduct para sincronización completa
const originalEditProduct = window.editProduct;
if (originalEditProduct) {
  window.editProduct = async function(productId) {
    const result = await originalEditProduct.call(this, productId);
    setTimeout(() => syncAllDataAfterOperation(), 200);
    return result;
  };
}

// Interceptar deleteProduct para sincronización completa
const originalDeleteProduct = window.deleteProduct;
if (originalDeleteProduct) {
  window.deleteProduct = async function(productId) {
    const result = await originalDeleteProduct.call(this, productId);
    setTimeout(() => syncAllDataAfterOperation(), 200);
    return result;
  };
}

// Interceptar addClient para sincronización completa
const originalAddClient = window.addClient;
if (originalAddClient) {
  window.addClient = async function(event) {
    const result = await originalAddClient.call(this, event);
    setTimeout(() => syncAllDataAfterOperation(), 200);
    return result;
  };
}

// Interceptar editClient para sincronización completa
const originalEditClient = window.editClient;
if (originalEditClient) {
  window.editClient = async function(clientId) {
    const result = await originalEditClient.call(this, clientId);
    setTimeout(() => syncAllDataAfterOperation(), 200);
    return result;
  };
}

// Interceptar deleteClient para sincronización completa
const originalDeleteClient = window.deleteClient;
if (originalDeleteClient) {
  window.deleteClient = async function(clientId) {
    const result = await originalDeleteClient.call(this, clientId);
    setTimeout(() => syncAllDataAfterOperation(), 200);
    return result;
  };
}

// Interceptar finalizeSale para sincronización completa
const originalFinalizeSale = window.finalizeSale;
if (originalFinalizeSale) {
  window.finalizeSale = async function() {
    const result = await originalFinalizeSale.call(this);
    setTimeout(() => {
      syncAllDataAfterOperation();
      if (typeof window.forceBalanceUpdate === 'function') {
        window.forceBalanceUpdate();
      }
    }, 200);
    return result;
  };
}

// Interceptar processChickenSale para sincronización completa
const originalProcessChickenSale = window.processChickenSale;
if (originalProcessChickenSale) {
  window.processChickenSale = function(saleData) {
    const result = originalProcessChickenSale.call(this, saleData);
    setTimeout(() => syncAllDataAfterOperation(), 200);
    return result;
  };
}

// Interceptar handleChickenSale para sincronización completa
const originalHandleChickenSale = window.handleChickenSale;
if (originalHandleChickenSale) {
  window.handleChickenSale = function() {
    const result = originalHandleChickenSale.call(this);
    setTimeout(() => syncAllDataAfterOperation(), 200);
    return result;
  };
}

// Funciones adicionales de sincronización
window.setupSyncUserOld = function() {
  Swal.fire({
    title: 'Configurar Sincronización',
    html: `
      <div class="mb-3">
        <label class="form-label">ID de Usuario (único)</label>
        <input type="text" id="syncUserId" class="form-control" 
               placeholder="Ej: tienda_principal, usuario123" required>
        <div class="form-text">Este ID debe ser único y compartido entre tus dispositivos</div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Configurar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const userId = document.getElementById('syncUserId').value.trim();
      if (!userId) {
        Swal.showValidationMessage('El ID de usuario es requerido');
        return false;
      }
      return userId;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      currentSyncUser = result.value;
      localStorage.setItem('tillup_sync_user', currentSyncUser);
      
      // Inicializar sincronización
      if (typeof initTillUpSync === 'function') {
        initTillUpSync(currentSyncUser);
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Sincronización Configurada!',
        text: `Usuario: ${currentSyncUser}`,
        timer: 2000
      });
    }
  });
};

window.showSyncStatus = function() {
  if (!currentSyncUser) {
    Swal.fire({
      title: 'Sincronización no configurada',
      text: '¿Deseas configurar la sincronización ahora?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Configurar',
      cancelButtonText: 'Más tarde'
    }).then((result) => {
      if (result.isConfirmed) {
        setupSyncUser();
      }
    });
    return;
  }
  
  const status = tillupSync ? tillupSync.getStatus() : { enabled: false, connected: false };
  
  Swal.fire({
    title: 'Estado de Sincronización',
    html: `
      <div class="text-start">
        <p><strong>Usuario:</strong> ${currentSyncUser}</p>
        <p><strong>Estado:</strong> ${status.enabled ? '🟢 Habilitada' : '🔴 Deshabilitada'}</p>
        <p><strong>Conexión:</strong> ${status.connected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
        <p><strong>Última sync:</strong> ${status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Nunca'}</p>
      </div>
    `,
    icon: status.enabled && status.connected ? 'success' : 'warning',
    showCancelButton: true,
    confirmButtonText: 'Reconfigurar',
    cancelButtonText: 'Cerrar'
  }).then((result) => {
    if (result.isConfirmed) {
      setupSyncUser();
    }
  });
};

window.testBidirectionalSync = function() {
  if (!window.tillupWebSocketClient || !window.tillupWebSocketClient.isConnected) {
    Swal.fire({
      icon: 'warning',
      title: 'Sin conexión WebSocket',
      text: 'No hay conexión WebSocket activa.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  // Enviar mensaje de prueba simple
  window.tillupWebSocketClient.send({
    action: 'test_message',
    data: {
      message: 'Prueba desde TillUp POS',
      timestamp: Date.now(),
      userId: currentSyncUser
    }
  });
  
  Swal.fire({
    icon: 'success',
    title: 'Mensaje de Prueba Enviado',
    text: 'Se ha enviado un mensaje de prueba. Verifica en otros dispositivos.',
    confirmButtonText: 'Aceptar'
  });
};

window.forceSyncAll = function() {
  if (!window.tillupWebSocketClient || !window.tillupWebSocketClient.isConnected) {
    Swal.fire({
      icon: 'warning',
      title: 'Sin conexión WebSocket',
      text: 'Configura un usuario y verifica la conexión.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  const allData = {
    products: JSON.parse(localStorage.getItem('products') || '[]'),
    clients: JSON.parse(localStorage.getItem('clients') || '[]'),
    sales: JSON.parse(localStorage.getItem('sales') || '[]'),
    debts: JSON.parse(localStorage.getItem('debts') || '[]'),
    chickenSales: JSON.parse(localStorage.getItem('chickenSales') || '[]')
  };
  
  const totalItems = allData.products.length + allData.clients.length + allData.sales.length + allData.debts.length + allData.chickenSales.length;
  
  if (totalItems === 0) {
    Swal.fire({
      icon: 'warning',
      title: '⚠️ Dispositivo sin datos',
      html: `
        <div class="text-start">
          <p><strong>Este dispositivo no tiene datos para sincronizar.</strong></p>
          <p>Si presionas "Solicitar Datos" recibirás los datos de otros dispositivos.</p>
          <p>Si presionas "Enviar Vacío" borrarás los datos de otros dispositivos.</p>
          <div class="alert alert-danger mt-3">
            <i class="bi bi-exclamation-triangle"></i>
            <strong>¡CUIDADO!</strong> "Enviar Vacío" eliminará todos los datos de otros dispositivos.
          </div>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '<i class="bi bi-download"></i> Solicitar Datos',
      denyButtonText: '<i class="bi bi-upload"></i> Enviar Vacío',
      cancelButtonText: '<i class="bi bi-x-circle"></i> Cancelar',
      confirmButtonColor: '#198754',
      denyButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        // Solicitar datos de otros dispositivos
        window.tillupWebSocketClient.send({
          action: 'request_sync_data',
          data: { userId: window.tillupWebSocketClient.userId }
        });
        Swal.fire({
          icon: 'info',
          title: 'Solicitando datos...',
          text: 'Se ha enviado una solicitud para recibir datos de otros dispositivos.',
          confirmButtonText: 'Aceptar'
        });
      } else if (result.isDenied) {
        // Confirmar envío de datos vacíos
        Swal.fire({
          icon: 'error',
          title: '¿Estás completamente seguro?',
          html: `
            <div class="text-start">
              <p><strong>Esta acción BORRARÁ TODOS LOS DATOS de otros dispositivos:</strong></p>
              <ul>
                <li>Productos</li>
                <li>Clientes</li>
                <li>Ventas</li>
                <li>Deudas</li>
                <li>Ventas de pollos</li>
              </ul>
              <div class="alert alert-danger">
                <strong>¡ESTA ACCIÓN NO SE PUEDE DESHACER!</strong>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Sí, borrar todo',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#dc3545'
        }).then((confirmResult) => {
          if (confirmResult.isConfirmed) {
            window.tillupWebSocketClient.sendAllLocalData();
            Swal.fire({
              icon: 'success',
              title: 'Datos vacíos enviados',
              text: 'Se han enviado datos vacíos a otros dispositivos.',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
    return;
  }
  
  // Si hay datos, mostrar confirmación normal
  Swal.fire({
    icon: 'question',
    title: 'Sincronizar datos de este dispositivo',
    html: `
      <div class="text-start">
        <p><strong>Este dispositivo tiene datos:</strong></p>
        <ul>
          <li>${allData.products.length} productos</li>
          <li>${allData.clients.length} clientes</li>
          <li>${allData.sales.length} ventas</li>
          <li>${allData.debts.length} deudas</li>
          <li>${allData.chickenSales.length} ventas de pollos</li>
        </ul>
        <p>¿Enviar estos datos a otros dispositivos?</p>
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i>
          Los datos se combinarán con los de otros dispositivos.
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-cloud-upload"></i> Enviar Datos',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0d6efd'
  }).then((result) => {
    if (result.isConfirmed) {
      window.tillupWebSocketClient.sendAllLocalData();
      Swal.fire({
        icon: 'success',
        title: 'Sincronización enviada',
        html: `Datos enviados correctamente:<br>
               • ${allData.products.length} productos<br>
               • ${allData.clients.length} clientes<br>
               • ${allData.sales.length} ventas<br>
               • ${allData.debts.length} deudas<br>
               • ${allData.chickenSales.length} ventas de pollos`,
        confirmButtonText: 'Aceptar'
      });
    }
  });
};

window.setTheme = function(theme) {
  console.log('Tema configurado:', theme);
};

// Estado actual del filtro de deudas
let currentDebtStatusFilter = 'pending';

// Funciones para filtros de deudas
window.setDebtStatusFilter = function(status) {
  currentDebtStatusFilter = status;
  
  // Actualizar botones activos
  document.querySelectorAll('[id^="btnDebtFilter"]').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.getElementById(`btnDebtFilter${status.charAt(0).toUpperCase() + status.slice(1)}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Renderizar con filtros actuales
  const searchTerm = document.getElementById('debtClientSearch')?.value || '';
  renderDebts(searchTerm, status);
};

window.filterDebtClients = function() {
  const searchTerm = document.getElementById('debtClientSearch')?.value || '';
  renderDebts(searchTerm, currentDebtStatusFilter);
};

// Funciones de búsqueda para clientes
window.searchClients = function() {
  const searchInput = document.getElementById('clientsSearchInput');
  const searchTerm = searchInput ? searchInput.value : '';
  renderClients(searchTerm);
};

window.setupClientsSearch = function() {
  const searchInput = document.getElementById('clientsSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value;
      renderClients(searchTerm);
    });
  }
};

// Configurar búsqueda de clientes cuando se abra el modal
window.openClientsSearchModal = function() {
  const modal = document.getElementById('clientsSearchModal');
  if (modal) {
    modal.style.display = 'block';
    setTimeout(() => {
      setupClientsSearch();
      const searchInput = document.getElementById('clientsSearchInput');
      if (searchInput) searchInput.focus();
    }, 100);
  }
};

// Funciones para movimientos
window.clearMovementFilters = function() {
  console.log('Limpiar filtros de movimientos');
};

window.setPeriodFilter = function(period) {
  console.log('Filtro de período:', period);
  const customSelector = document.getElementById('customDateSelector');
  if (customSelector) {
    customSelector.style.display = period === 'custom' ? 'block' : 'none';
  }
};

window.applyCustomFilter = function() {
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  console.log('Filtro personalizado:', startDate, endDate);
};

window.showChart = function(chartType) {
  console.log('Mostrar gráfico:', chartType);
};

window.toggleRevenueVisibility = function() {
  const revenueElement = document.getElementById('totalRevenue');
  const eyeIcon = document.getElementById('revenueEyeIcon');
  if (revenueElement && eyeIcon) {
    const isHidden = revenueElement.textContent.includes('•');
    if (isHidden) {
      revenueElement.textContent = revenueElement.dataset.actualValue || '$0.00';
      eyeIcon.className = 'bi bi-eye-slash';
    } else {
      revenueElement.dataset.actualValue = revenueElement.textContent;
      revenueElement.textContent = '•••••';
      eyeIcon.className = 'bi bi-eye';
    }
  }
};

// Funciones para pollos
window.setupChickenMermaCalculation = function() {
  const btnMerma = document.getElementById('btnMermaPollo');
  if (btnMerma) {
    btnMerma.addEventListener('click', function() {
      const modal = new bootstrap.Modal(document.getElementById('modalMermaPollo'));
      modal.show();
    });
  }
};

// Funciones para el selector de clientes
window.updateClientSelector = function() {
  // Obtener clientes desde múltiples fuentes
  let clientsData = window.clients || clients;
  if (!clientsData || !Array.isArray(clientsData) || clientsData.length === 0) {
    try {
      clientsData = JSON.parse(localStorage.getItem('clients') || '[]');
    } catch (e) {
      clientsData = [];
    }
  }
  
  console.log('🔄 Actualizando selectores con', clientsData.length, 'clientes');
  
  // Lista de todos los selectores de clientes
  const selectors = [
    document.getElementById('saleClientDrawer'),
    document.getElementById('chickenClient'),
    document.getElementById('cartClientSelector')
  ];
  
  selectors.forEach(selector => {
    if (selector) {
      const currentValue = selector.value;
      selector.innerHTML = '<option value="">Seleccionar cliente...</option>';
      
      if (clientsData && Array.isArray(clientsData) && clientsData.length > 0) {
        clientsData.forEach(client => {
          const option = document.createElement('option');
          option.value = client.id;
          option.textContent = client.name;
          if (client.debt && client.debt > 0) {
            option.textContent += ` (Deuda: $${client.debt.toFixed(2)})`;
          }
          selector.appendChild(option);
        });
        console.log(`✅ Selector ${selector.id} actualizado con ${clientsData.length} opciones`);
      } else {
        console.log(`⚠️ No hay clientes para el selector ${selector.id}`);
      }
      
      selector.value = currentValue;
    }
  });
  
  // También llamar al módulo original
  if (typeof updateClientSelectorModule === 'function') {
    updateClientSelectorModule();
  }
};

// --- Helpers to make selects searchable when they have many options ---
function makeSelectSearchable(select) {
  if (!select) return;
  const container = select.parentElement;
  if (!container) return;
  // Avoid duplicating the search input
  if (container.querySelector('.select-search-input')) return;

  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Buscar...';
  input.className = 'form-control form-control-sm mb-1 select-search-input';

  // Filter function
  input.addEventListener('input', () => {
    const term = (input.value || '').toLowerCase().trim();
    Array.from(select.options).forEach(opt => {
      const txt = (opt.textContent || '').toLowerCase();
      opt.hidden = term && !txt.includes(term);
    });
  });

  // Insert input before select
  container.insertBefore(input, select);
}

function applySearchIfNeeded(select) {
  if (!select) return;
  const optionCount = select.options ? select.options.length : 0;
  if (optionCount > 10) {
    makeSelectSearchable(select);
  } else {
    // Remove search input if present and not needed
    const container = select.parentElement;
    if (container) {
      const existing = container.querySelector('.select-search-input');
      if (existing) existing.remove();
      // Ensure all options visible
      Array.from(select.options).forEach(o => o.hidden = false);
    }
  }
}

// Update all product-related selects (if any) and apply search enhancement
window.updateProductSelector = function() {
  // Find selects that likely list products by data attribute or id
  const selectors = Array.from(document.querySelectorAll('select'))
    .filter(s => (s.id && /product/i.test(s.id)) || (s.dataset && s.dataset.productSelector === 'true'));

  // If none found, try common containers (sales products grid doesn't use select)
  selectors.forEach(sel => {
    const current = sel.value;
    // Try to populate from localStorage products
    try {
      const productsData = JSON.parse(localStorage.getItem('products') || '[]');
      sel.innerHTML = '<option value="">Seleccionar producto...</option>';
      productsData.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        sel.appendChild(opt);
      });
      sel.value = current;
    } catch (e) {
      // ignore
    }
    applySearchIfNeeded(sel);
  });
};

// Apply search enhancement to client selectors after update
const originalWindowUpdateClientSelector = window.updateClientSelector;
window.updateClientSelector = function() {
  try { originalWindowUpdateClientSelector(); } catch (e) { console.error(e); }
  const clientSelectors = [
    document.getElementById('saleClientDrawer'),
    document.getElementById('chickenClient'),
    document.getElementById('cartClientSelector'),
    document.getElementById('editClientId')
  ];
  clientSelectors.forEach(s => applySearchIfNeeded(s));
};

// Función para inicializar fechas
window.initializeDates = function() {
  const today = getLocalDateString();
  const dateInputs = [
    document.getElementById('saleDateDrawer'),
    document.getElementById('chickenSaleDate'),
    document.getElementById('filterChickenDate')
  ];
  
  dateInputs.forEach(input => {
    if (input && !input.value) {
      input.value = today;
    }
  });
};

// Exponer funciones de renderizado
window.renderBalanceGrid = renderBalanceGrid;
window.renderDebts = renderDebts;
window.renderInventory = renderInventory;
window.renderClients = renderClients;
window.renderSalesProducts = renderSalesProducts;
window.renderCart = renderCart;
window.updateClientSelectorModule = updateClientSelectorModule;
window.updateBalanceUI = updateBalanceUI;
window.updateChickenSalesFromStorage = updateChickenSalesFromStorage;

// Función para forzar actualización completa del balance
let balanceUpdatePending = false;
window.forceBalanceUpdate = function() {
  if (balanceUpdatePending) return;
  
  balanceUpdatePending = true;
  console.log('🔄 Forzando actualización completa del balance...');
  
  // Recargar todos los datos desde localStorage
  const latestSales = JSON.parse(localStorage.getItem('sales') || '[]');
  const latestDebts = JSON.parse(localStorage.getItem('debts') || '[]');
  
  // Actualizar arrays globales
  if (window.sales) {
    window.sales.length = 0;
    window.sales.push(...latestSales);
  }
  if (window.debts) {
    window.debts.length = 0;
    window.debts.push(...latestDebts);
  }
  
  // Forzar actualización de UI solo si estamos en la vista de balance
  setTimeout(() => {
    const balanceView = document.getElementById('view-balance');
    if (balanceView && !balanceView.classList.contains('d-none')) {
      if (typeof window.updateBalanceUI === 'function') {
        window.updateBalanceUI();
      }
    }
    balanceUpdatePending = false;
  }, 100);
  
  console.log('✅ Actualización completa del balance finalizada');
};

// Función para actualizar balance después de sincronización
window.updateBalanceAfterSync = function() {
  setTimeout(() => {
    if (typeof window.forceBalanceUpdate === 'function') {
      window.forceBalanceUpdate();
    }
  }, 500);
};

// Inicializar arrays globales con datos del módulo
window.products = products;
window.clients = clients;
window.sales = sales;
window.debts = debts;

// Sincronizar arrays globales con localStorage al iniciar
setTimeout(() => {
  const clientsFromStorage = JSON.parse(localStorage.getItem('clients') || '[]');
  if (clientsFromStorage.length > 0 && (!window.clients || window.clients.length === 0)) {
    window.clients = clientsFromStorage;
    clients.length = 0;
    clients.push(...clientsFromStorage);
    console.log('🔄 Arrays globales sincronizados con localStorage');
  }
}, 100);

// Exponer funciones de estado para el sync manager
window.setProducts = function(newProducts) {
  console.log('🔄 setProducts called with', newProducts.length, 'products');
  
  // Guardar en localStorage PRIMERO
  localStorage.setItem('products', JSON.stringify(newProducts));
  
  // Actualizar estado global
  if (window.products && Array.isArray(window.products)) {
    window.products.length = 0;
    window.products.push(...newProducts);
  }
  // Actualizar estado del módulo
  products.length = 0;
  products.push(...newProducts);
  
  // Actualizar UI inmediatamente
  if (typeof renderInventory === 'function') {
    renderInventory();
  }
  if (typeof renderSalesProducts === 'function') {
    renderSalesProducts();
  }
  
  console.log('✅ Inventario actualizado y guardado en localStorage');
};

window.setClients = function(newClients) {
  console.log('🔄 setClients called with', newClients.length, 'clients');
  
  // Guardar en localStorage PRIMERO
  localStorage.setItem('clients', JSON.stringify(newClients));
  
  // Actualizar estado global
  if (window.clients && Array.isArray(window.clients)) {
    window.clients.length = 0;
    window.clients.push(...newClients);
  }
  // Actualizar estado del módulo
  clients.length = 0;
  clients.push(...newClients);
  
  // Actualizar UI inmediatamente
  updateClientSelector();
  if (typeof renderClients === 'function') {
    renderClients();
  }
  if (typeof renderDebts === 'function') {
    renderDebts();
  }
  
  console.log('✅ Clientes actualizados y guardados en localStorage');
};

window.setSales = function(newSales) {
  console.log('🔄 setSales called with', newSales.length, 'sales');
  
  // Guardar en localStorage PRIMERO
  localStorage.setItem('sales', JSON.stringify(newSales));
  
  // Actualizar estado global
  if (window.sales && Array.isArray(window.sales)) {
    window.sales.length = 0;
    window.sales.push(...newSales);
  }
  // Actualizar estado del módulo
  sales.length = 0;
  sales.push(...newSales);
  
  // Forzar actualización del balance INMEDIATAMENTE
  if (typeof window.updateBalanceUI === 'function') {
    window.updateBalanceUI();
  }
  if (typeof window.renderBalanceGrid === 'function') {
    window.renderBalanceGrid();
  }
  
  console.log('✅ Ventas actualizadas y guardadas en localStorage');
};

window.setDebts = function(newDebts) {
  console.log('🔄 setDebts called with', newDebts.length, 'debts');
  
  // Guardar en localStorage PRIMERO
  localStorage.setItem('debts', JSON.stringify(newDebts));
  
  // Actualizar estado global
  if (window.debts && Array.isArray(window.debts)) {
    window.debts.length = 0;
    window.debts.push(...newDebts);
  }
  // Actualizar estado del módulo
  debts.length = 0;
  debts.push(...newDebts);
  
  // Forzar actualización del balance y deudas INMEDIATAMENTE
  if (typeof window.updateBalanceUI === 'function') {
    window.updateBalanceUI();
  }
  if (typeof window.renderBalanceGrid === 'function') {
    window.renderBalanceGrid();
  }
  if (typeof renderDebts === 'function') {
    renderDebts();
  }
  
  console.log('✅ Deudas actualizadas y guardadas en localStorage');
};

// Exponer función para mostrar detalles de movimientos
window.showMovementDetail = function(idx) {
  const currentPeriod = document.querySelector('input[name="periodFilter"]:checked')?.value || 'day';
  const movements = window.getRecentMovements(currentPeriod);
  const movement = movements[idx];
  if (!movement || !movement.data) return;
  
  const data = movement.data;
  
  // Mostrar comprobante según el tipo de movimiento
  switch (movement.type) {
    case 'sale':
      if (window.showReceipt) window.showReceipt(data);
      break;
    case 'chicken_sale':
      showChickenReceiptFromMovement(data);
      break;
    case 'debt':
      if (window.showDebtDetailModal) window.showDebtDetailModal(data.id);
      break;
    case 'payment':
      if (window.showPaymentReceipt) window.showPaymentReceipt(data);
      break;
    default:
      if (window.showGenericMovementDetail) window.showGenericMovementDetail(movement);
  }
};

// Función auxiliar para mostrar comprobante de pollo desde movimiento
function showChickenReceiptFromMovement(sale) {
  const receiptHtml = `
    <div style="max-width: 400px; margin: auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="text-align: center; border-bottom: 2px solid #1F2D3D; padding-bottom: 15px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
          <img src="TillUp.png" alt="TillUp" style="width: 40px; height: 40px; border-radius: 8px;">
          <h3 style="margin: 0; color: #1F2D3D; font-size: 1.5rem;">TillUp POS</h3>
        </div>
        <div style="font-weight: bold; font-size: 1.1rem; color: #1F2D3D; margin-bottom: 5px;">COMPROBANTE DE VENTA DE POLLOS</div>
        <div style="font-size: 0.9rem; color: #666; margin-bottom: 3px;">Venta #${sale.id}</div>
        <div style="font-size: 0.9rem; color: #666;">${new Date(sale.date).toLocaleDateString()} ${sale.time || ''}</div>
      </div>
      
      <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 0.95rem;">
        <i class="bi bi-person" style="margin-right: 5px; color: #1F2D3D;"></i>
        <strong>Cliente:</strong> ${sale.clientName}
      </div>
      
      <div style="margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; padding: 10px 0; border-bottom: 1px solid #ddd; font-weight: bold; font-size: 0.9rem; color: #1F2D3D;">
          <div>Descripción</div>
          <div>Cant.</div>
          <div>Precio/Lb</div>
          <div>Subtotal</div>
        </div>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; padding: 8px 0; border-bottom: 1px dashed #eee; font-size: 0.9rem;">
          <div>Pollo(s) - ${sale.weight} lbs</div>
          <div>${sale.quantity}</div>
          <div>$${sale.pricePerPound.toFixed(2)}</div>
          <div>$${sale.total.toFixed(2)}</div>
        </div>
      </div>
      
      <div style="border-top: 2px solid #1F2D3D; padding-top: 15px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem; color: #1F2D3D;">
          <span>TOTAL:</span>
          <span>$${sale.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div style="background: #e9ecef; padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem;">
        <i class="bi bi-${getPaymentIcon(sale.paymentType)}" style="margin-right: 5px; color: #1F2D3D;"></i>
        <strong>Método de pago:</strong> ${getPaymentText(sale.paymentType)}
        ${sale.paymentType === 'credit' && sale.abono > 0 ? `<br><small>Abono inicial: $${sale.abono.toFixed(2)}</small>` : ''}
      </div>
      
      <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
        <div style="font-weight: bold; color: #1F2D3D; margin-bottom: 5px;">
          <i class="bi bi-heart" style="color: #dc3545; margin-right: 5px;"></i>
          ¡Gracias por su compra!
        </div>
        <div style="color: #666; font-size: 0.8rem;">
          TillUp POS - Gestión de Ventas
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    title: 'Comprobante de Venta de Pollos',
    html: receiptHtml,
    confirmButtonText: 'Cerrar',
    width: 500,
    customClass: {
      popup: 'swal2-receipt-treinta'
    }
  });
}

// Funciones auxiliares para iconos de pago
function getPaymentIcon(paymentType) {
  switch(paymentType) {
    case 'cash': return 'cash-coin';
    case 'card': return 'credit-card';
    case 'transfer': return 'bank';
    case 'credit': return 'clock-history';
    default: return 'question-circle';
  }
}

function getPaymentText(paymentType) {
  switch(paymentType) {
    case 'cash': return 'Pago en efectivo';
    case 'card': return 'Pago con tarjeta';
    case 'transfer': return 'Transferencia bancaria';
    case 'credit': return 'Venta a crédito';
    default: return 'Otro método de pago';
  }
}

// Exponer funciones auxiliares para movimientos
window.getRecentMovements = function(period, customDate) {
  // Importar la función desde el módulo de renderizado
  const movements = [];
  const now = new Date();
  let startDate;
  if (period === 'custom' && customDate) {
    startDate = new Date(customDate);
  } else {
    switch(period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  }
  
  // Obtener ventas normales
  if (sales && Array.isArray(sales)) {
    sales.forEach(sale => {
      if (sale && sale.date && sale.id && sale.clientName && typeof sale.total === 'number') {
        const saleDate = new Date(sale.date);
        if (saleDate >= startDate) {
          movements.push({
            type: 'sale',
            icon: 'bi-cart-check',
            title: `Venta #${sale.id}`,
            subtitle: `${sale.clientName} - ${saleDate.toLocaleDateString()}`,
            amount: sale.total,
            amountClass: 'positive',
            date: saleDate,
            data: sale
          });
        }
      }
    });
  }
  
  // Obtener ventas de pollos
  const chickenSalesData = JSON.parse(localStorage.getItem('chickenSales') || '[]');
  if (chickenSalesData && Array.isArray(chickenSalesData)) {
    chickenSalesData.forEach(sale => {
      if (sale && sale.date && sale.id && sale.clientName && typeof sale.total === 'number') {
        const saleDate = new Date(sale.date);
        if (saleDate >= startDate) {
          movements.push({
            type: 'chicken_sale',
            icon: 'bi-egg-fried',
            title: `Venta Pollos #${sale.id}`,
            subtitle: `${sale.clientName} - ${saleDate.toLocaleDateString()}`,
            amount: sale.total,
            amountClass: 'positive',
            date: saleDate,
            data: sale
          });
        }
      }
    });
  }
  
  // Obtener deudas
  if (debts && Array.isArray(debts)) {
    debts.forEach(debt => {
      if (debt && debt.date && debt.id && debt.clientName && typeof debt.amount === 'number') {
        const debtDate = new Date(debt.date);
        if (debtDate >= startDate) {
          movements.push({
            type: 'debt',
            icon: 'bi-cash-stack',
            title: `Deuda #${debt.id}`,
            subtitle: `${debt.clientName} - ${debtDate.toLocaleDateString()}`,
            amount: debt.amount,
            amountClass: 'negative',
            date: debtDate,
            data: debt
          });
        }
      }
    });
  }
  
  return movements.sort((a, b) => b.date - a.date).slice(0, 10);
};

// Debug del carrito
window.debugCart = function() {
  console.log('=== DEBUG CARRITO ===');
  console.log('Cart state:', cart);
  console.log('Cart length:', cart ? cart.length : 'undefined');
  console.log('Current client:', currentClientId);
  const cartElement = document.getElementById('cartList');
  console.log('Cart element exists:', !!cartElement);
  if (cartElement) {
    console.log('Cart HTML:', cartElement.innerHTML.substring(0, 200));
  }
};

// Función de debug para verificar clientes
window.debugClients = function() {
  console.log('=== 🔍 DEBUG CLIENTES ===');
  console.log('Clientes en window.clients:', window.clients);
  console.log('Clientes en state module:', clients);
  console.log('Clientes en localStorage:', JSON.parse(localStorage.getItem('clients') || '[]'));
  
  const selectors = ['saleClientDrawer', 'chickenClient', 'cartClientSelector'];
  selectors.forEach(id => {
    const selector = document.getElementById(id);
    console.log(`Selector ${id}:`, selector ? '✅ existe' : '❌ no existe');
    if (selector) {
      console.log(`  📊 Opciones: ${selector.options.length}`);
      for (let i = 0; i < Math.min(selector.options.length, 5); i++) {
        console.log(`  ${i}: ${selector.options[i].value} - ${selector.options[i].text}`);
      }
      if (selector.options.length > 5) {
        console.log(`  ... y ${selector.options.length - 5} más`);
      }
    }
  });
  
  // Verificar si hay discrepancias
  const storageClients = JSON.parse(localStorage.getItem('clients') || '[]');
  const memoryClients = window.clients || clients || [];
  if (storageClients.length !== memoryClients.length) {
    console.warn('⚠️ DISCREPANCIA: localStorage tiene', storageClients.length, 'clientes, memoria tiene', memoryClients.length);
  }
};

// Función para forzar actualización manual
window.forceUpdateSelectors = function() {
  console.log('🔄 Forzando actualización de selectores...');
  
  // Forzar recarga de datos desde localStorage
  const clientsFromStorage = JSON.parse(localStorage.getItem('clients') || '[]');
  if (typeof window.setClients === 'function') {
    window.setClients(clientsFromStorage);
  }
  
  // Actualizar selectores
  updateClientSelector();
  
  // Renderizar clientes si estamos en esa vista
  if (typeof renderClients === 'function') {
    renderClients();
  }
  
  setTimeout(() => {
    debugClients();
  }, 100);
};

// Función para forzar sincronización de deudas
window.forceSyncDebts = function() {
  console.log('🔄 Forzando sincronización de deudas...');
  
  const localStorageDebts = JSON.parse(localStorage.getItem('debts') || '[]');
  
  // Actualizar estado global
  if (typeof window.setDebts === 'function') {
    window.setDebts(localStorageDebts);
  }
  
  // Actualizar estado del módulo
  if (window.debts && Array.isArray(window.debts)) {
    window.debts.length = 0;
    window.debts.push(...localStorageDebts);
  }
  
  // Forzar renderizado
  if (typeof window.renderDebts === 'function') {
    window.renderDebts();
  }
  
  console.log('✅ Sincronización de deudas completada');
};

// Función para limpiar modal backdrops y problemas de aria-hidden
window.clearModalBackdrops = function() {
  // Remover backdrops
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach(backdrop => backdrop.remove());
  
  // Limpiar clases del body
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  
  // Remover aria-hidden de elementos principales
  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    mainContent.removeAttribute('aria-hidden');
  }
  
  // Limpiar modales que puedan estar mal configurados
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (modal.style.display === 'block' && !modal.classList.contains('show')) {
      modal.style.display = 'none';
      modal.removeAttribute('aria-hidden');
    }
  });
};

// Limpiar backdrops automáticamente cada 3 segundos
setInterval(() => {
  const backdrops = document.querySelectorAll('.modal-backdrop');
  const problematicModals = document.querySelectorAll('.modal[style*="display: block"][aria-hidden="true"]');
  
  if (backdrops.length > 0 || problematicModals.length > 0) {
    clearModalBackdrops();
  }
}, 3000);



// Función para actualizar fecha y hora
function updateDateTime() {
  const now = new Date();
  const dateElement = document.getElementById('currentDate');
  const timeElement = document.getElementById('currentTime');
  
  if (dateElement) {
    dateElement.textContent = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  if (timeElement) {
    timeElement.textContent = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}

// Función para mostrar modal de agregar cliente
window.showAddClientModal = function() {
  const modal = new bootstrap.Modal(document.getElementById('modalClient'));
  modal.show();
};

// Función de debug para verificar estado de deudas
window.debugDebts = function() {
  console.log('=== 🔍 DEBUG DEUDAS ===');
  
  const localStorageDebts = JSON.parse(localStorage.getItem('debts') || '[]');
  const memoryDebts = debts || [];
  const globalDebts = window.debts || [];
  
  console.log('📦 localStorage deudas:', localStorageDebts.length);
  localStorageDebts.forEach((d, i) => {
    console.log(`  ${i}: ${d.clientName} - $${d.amount} (${d.id})`);
  });
  
  console.log('🧠 memoria deudas:', memoryDebts.length);
  memoryDebts.forEach((d, i) => {
    console.log(`  ${i}: ${d.clientName} - $${d.amount} (${d.id})`);
  });
  
  console.log('🌐 global deudas:', globalDebts.length);
  globalDebts.forEach((d, i) => {
    console.log(`  ${i}: ${d.clientName} - $${d.amount} (${d.id})`);
  });
  
  // Verificar si hay discrepancias
  if (localStorageDebts.length !== memoryDebts.length || localStorageDebts.length !== globalDebts.length) {
    console.warn('⚠️ DISCREPANCIA DETECTADA entre localStorage, memoria y global');
    console.log('Sincronizando...');
    
    // Forzar sincronización
    if (typeof window.setDebts === 'function') {
      window.setDebts(localStorageDebts);
      console.log('✅ Estado sincronizado usando setDebts');
    }
    
    // Forzar renderizado
    if (typeof window.renderDebts === 'function') {
      window.renderDebts();
      console.log('✅ UI actualizada');
    }
  } else {
    console.log('✅ Todos los estados están sincronizados');
  }
};





// Función para cerrar sidebar
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.style.display = 'none';
}

// Función para inicializar fechas
function initializeDates() {
  const today = getLocalDateString();
  const dateInputs = [
    document.getElementById('saleDateDrawer'),
    document.getElementById('chickenSaleDate'),
    document.getElementById('filterChickenDate')
  ];
  
  dateInputs.forEach(input => {
    if (input && !input.value) {
      input.value = today;
    }
  });
}

console.log('🌟 TillUp POS - Versión Modular Cargada');