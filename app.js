// === Arrays globales ===
let products = [];
let clients = [];
let sales = [];
let debts = [];
let cart = [];
let chickenSales = [];
let costPerPound = parseFloat(localStorage.getItem('costPerPound')) || 2.50;
let currentClientId = null;
let inventoryViewMode = localStorage.getItem('inventoryViewMode') || 'grid'; // 'grid' o 'list'
let clientsViewMode = localStorage.getItem('clientsViewMode') || 'grid'; // 'grid' o 'list'

// === FUNCIONES DE GESTIÓN DE DATOS ===

// Función para cargar datos desde localStorage
function loadData() {
  try {
    // Cargar productos
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      products = JSON.parse(savedProducts);
    }
    
    // Cargar clientes
    const savedClients = localStorage.getItem('clients');
    if (savedClients) {
      clients = JSON.parse(savedClients);
    }
    
    // Cargar ventas
    const savedSales = localStorage.getItem('sales');
    if (savedSales) {
      sales = JSON.parse(savedSales);
    }
    
    // Cargar deudas
    const savedDebts = localStorage.getItem('debts');
    if (savedDebts) {
      debts = JSON.parse(savedDebts);
    }
    
    // Cargar ventas de pollos
    const savedChickenSales = localStorage.getItem('chickenSales');
    if (savedChickenSales) {
      chickenSales = JSON.parse(savedChickenSales);
    }
    
    // Cargar carrito
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      cart = JSON.parse(savedCart);
    }
    
    // Cargar cliente seleccionado
    const savedCurrentClientId = localStorage.getItem('currentClientId');
    if (savedCurrentClientId) {
      currentClientId = savedCurrentClientId;
    }
    
    console.log('Datos cargados exitosamente');
  } catch (error) {
    console.error('Error cargando datos:', error);
    // Si hay error, inicializar con arrays vacíos
    products = [];
    clients = [];
    sales = [];
    debts = [];
    chickenSales = [];
    cart = [];
    currentClientId = null;
  }
}

// Función para guardar datos en localStorage
function saveData() {
  try {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('clients', JSON.stringify(clients));
    localStorage.setItem('sales', JSON.stringify(sales));
    localStorage.setItem('debts', JSON.stringify(debts));
    localStorage.setItem('chickenSales', JSON.stringify(chickenSales));
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('currentClientId', currentClientId);
    
    console.log('Datos guardados exitosamente');
  } catch (error) {
    console.error('Error guardando datos:', error);
  }
}

// Función para configurar todos los event listeners
function setupEventListeners() {
  // Event listeners para el sidebar
  const btnSidebar = document.getElementById('btnSidebar');
  if (btnSidebar) {
    btnSidebar.addEventListener('click', openSidebar);
  }
  
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }
  
  // Event listeners para formularios
  const formProduct = document.getElementById('formProduct');
  if (formProduct) {
    formProduct.addEventListener('submit', addProduct);
  }
  
  const formClient = document.getElementById('formClient');
  if (formClient) {
    formClient.addEventListener('submit', addClient);
  }
  
  // Event listeners para botones de navegación
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const viewName = this.getAttribute('onclick').match(/showView\('([^']+)'\)/)[1];
      showView(viewName);
    });
  });
  
  // Event listeners para filtros de período
  document.querySelectorAll('input[name="periodFilter"]').forEach(radio => {
    radio.addEventListener('change', function() {
      renderBalanceGrid();
    });
  });
  
  // Event listener para búsqueda de productos
  const productSearch = document.getElementById('productSearch');
  if (productSearch) {
    productSearch.addEventListener('input', function() {
      renderSalesProducts();
    });
  }
  
  // Event listeners para botones de tema
  document.querySelectorAll('[onclick^="setTheme"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const theme = this.getAttribute('onclick').match(/setTheme\('([^']+)'\)/)[1];
      setTheme(theme);
    });
  });
  
  // Event listeners para botones de actualización
  const btnUpdate = document.getElementById('btn-update');
  if (btnUpdate) {
    btnUpdate.addEventListener('click', forceUpdate);
  }
  
  // Event listeners para botones de instalación
  const btnInstallPWA = document.getElementById('installPWA');
  if (btnInstallPWA) {
    btnInstallPWA.addEventListener('click', installPWA);
  }
  
  // Event listeners para botones flotantes
  const floatingActionBtn = document.getElementById('floatingActionBtn');
  if (floatingActionBtn) {
    floatingActionBtn.addEventListener('click', showQuickActions);
  }
  
  // Event listeners para acciones rápidas
  document.querySelectorAll('.quick-action-item').forEach(item => {
    item.addEventListener('click', function() {
      const action = this.getAttribute('onclick').match(/quickAction\('([^']+)'\)/)[1];
      quickAction(action);
    });
  });
  
  // Event listeners para botones de pollos
  const chickenForm = document.getElementById('chickenForm');
  if (chickenForm) {
    chickenForm.addEventListener('submit', handleChickenSale);
  }
  
  // Event listeners para configuración de pollos
  const costPerPoundInput = document.getElementById('costPerPound');
  if (costPerPoundInput) {
    costPerPoundInput.addEventListener('input', updateChickenConfig);
  }
  
  // Event listeners para reportes
  const reportTypeSelect = document.getElementById('reportType');
  if (reportTypeSelect) {
    reportTypeSelect.addEventListener('change', changeReportType);
  }
  
  const reportFilterSelect = document.getElementById('reportFilter');
  if (reportFilterSelect) {
    reportFilterSelect.addEventListener('change', changeReportFilter);
  }
  
  // Event listeners para filtros de fecha
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput) {
    startDateInput.addEventListener('change', function() {
      calculateCompleteStats();
      updateReportUI();
    });
  }
  
  if (endDateInput) {
    endDateInput.addEventListener('change', function() {
      calculateCompleteStats();
      updateReportUI();
    });
  }
  
  console.log('Event listeners configurados');
}

// Función para acciones rápidas
function quickAction(action) {
  switch (action) {
    case 'addProduct':
      const modalProduct = new bootstrap.Modal(document.getElementById('modalProduct'));
      modalProduct.show();
      break;
    case 'addClient':
      const modalClient = new bootstrap.Modal(document.getElementById('modalClient'));
      modalClient.show();
      break;
    case 'newSale':
      showView('sales');
      break;
    case 'chickenSale':
      showView('chicken');
      break;
    default:
      console.log('Acción no reconocida:', action);
  }
  
  hideQuickActions();
  hapticFeedback('medium');
}

// Función para mostrar acciones rápidas
function showQuickActions() {
  const menu = document.getElementById('quickActionsMenu');
  if (menu) {
    menu.style.display = 'block';
    hapticFeedback('light');
  }
}

// Función para ocultar acciones rápidas
function hideQuickActions() {
  const menu = document.getElementById('quickActionsMenu');
  if (menu) {
    menu.style.display = 'none';
  }
}

// === MEJORAS PARA EXPERIENCIA NATIVA ===

// Configuración de gestos táctiles
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// Función para detectar gestos de swipe
function detectSwipe(element, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown) {
  element.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  });

  element.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > swipeThreshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (diffX < -swipeThreshold && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (diffY > swipeThreshold && onSwipeUp) {
        onSwipeUp();
      } else if (diffY < -swipeThreshold && onSwipeDown) {
        onSwipeDown();
      }
    }
  }
}

// Función para feedback táctil (vibración)
function hapticFeedback(type = 'light') {
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(50);
        break;
      case 'heavy':
        navigator.vibrate(100);
        break;
      case 'success':
        navigator.vibrate([50, 50, 50]);
        break;
      case 'error':
        navigator.vibrate([100, 50, 100]);
        break;
    }
  }
}

// Función para mostrar notificaciones nativas
function showNativeNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      ...options
    });
  }
}

// Función para solicitar permisos de notificación
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showNativeNotification('TillUp', {
        body: 'Notificaciones activadas',
        tag: 'permission-granted'
      });
    }
  }
}

// Función para pull-to-refresh
function setupPullToRefresh(container, onRefresh) {
  let startY = 0;
  let currentY = 0;
  let pullDistance = 0;
  const threshold = 80;
  let isPulling = false;

  container.addEventListener('touchstart', (e) => {
    if (container.scrollTop === 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
    }
  });

  container.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    
    currentY = e.touches[0].clientY;
    pullDistance = currentY - startY;
    
    if (pullDistance > 0 && container.scrollTop === 0) {
      e.preventDefault();
      container.style.transform = `translateY(${Math.min(pullDistance * 0.5, threshold)}px)`;
    }
  });

  container.addEventListener('touchend', () => {
    if (isPulling && pullDistance > threshold) {
      onRefresh();
      hapticFeedback('success');
    }
    
    container.style.transform = '';
    isPulling = false;
    pullDistance = 0;
  });
}

// Función para mejorar la experiencia de scroll
function setupSmoothScroll() {
  const scrollElements = document.querySelectorAll('.movements-list-treinta, .products-grid-treinta, .clients-grid');
  
  scrollElements.forEach(element => {
    element.style.scrollBehavior = 'smooth';
    element.style.webkitOverflowScrolling = 'touch';
  });
}

// Función para mejorar la experiencia de modales
function setupModalGestures() {
  const modals = document.querySelectorAll('.modal');
  
  modals.forEach(modal => {
    const modalContent = modal.querySelector('.modal-content');
    
    detectSwipe(modalContent, 
      () => closeModal(modal), // Swipe izquierda para cerrar
      null, // Swipe derecha
      null, // Swipe arriba
      null  // Swipe abajo
    );
  });
}

// Función para cerrar modal con animación
function closeModal(modal) {
  modal.querySelector('.modal-content').style.transform = 'translateX(-100%)';
  setTimeout(() => {
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
      modalInstance.hide();
    }
  }, 300);
}

// Función para mejorar la experiencia de botones
function setupButtonFeedback() {
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    button.addEventListener('touchstart', () => {
      hapticFeedback('light');
    });
    
    button.addEventListener('click', () => {
      hapticFeedback('medium');
    });
  });
}

// Función para mejorar la experiencia de inputs
function setupInputEnhancements() {
  const inputs = document.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    // Prevenir zoom en iOS
    input.addEventListener('focus', () => {
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    });
    
    // Mejorar experiencia de números
    if (input.type === 'number') {
      input.addEventListener('input', () => {
        hapticFeedback('light');
      });
    }
  });
}

// Función para mejorar la experiencia de cards
function setupCardInteractions() {
  const cards = document.querySelectorAll('.product-card, .client-card, .debt-card');
  
  cards.forEach(card => {
    card.addEventListener('touchstart', () => {
      hapticFeedback('light');
    });
    
    // Efecto de presión
    card.addEventListener('touchstart', () => {
      card.style.transform = 'scale(0.98)';
    });
    
    card.addEventListener('touchend', () => {
      card.style.transform = '';
    });
  });
}

// Función para mejorar la experiencia de listas
function setupListInteractions() {
  const listItems = document.querySelectorAll('.movement-item-treinta, .cart-item-treinta');
  
  listItems.forEach(item => {
    detectSwipe(item, 
      () => {
        // Swipe izquierda - mostrar acciones
        showItemActions(item);
      },
      null, // Swipe derecha
      null, // Swipe arriba
      null  // Swipe abajo
    );
  });
}

// Función para mostrar acciones de elementos
function showItemActions(item) {
  const actions = document.createElement('div');
  actions.className = 'item-actions';
  actions.innerHTML = `
    <button class="btn btn-sm btn-outline-primary" onclick="editItem('${item.dataset.id}')">
      <i class="bi bi-pencil"></i>
    </button>
    <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${item.dataset.id}')">
      <i class="bi bi-trash"></i>
    </button>
  `;
  
  item.appendChild(actions);
  hapticFeedback('medium');
}

// Función para mejorar la experiencia de navegación
function setupNavigationEnhancements() {
  const navButtons = document.querySelectorAll('.sidebar-nav-item, .navbar-treinta .btn');
  
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      hapticFeedback('medium');
    });
  });
}

// Función para mejorar la experiencia de búsqueda
function setupSearchEnhancements() {
  const searchInputs = document.querySelectorAll('input[type="search"], .search-input');
  
  searchInputs.forEach(input => {
    let searchTimeout;
    
    input.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        hapticFeedback('light');
        // Aquí iría la lógica de búsqueda
      }, 300);
    });
  });
}

// Función para mejorar la experiencia de formularios
function setupFormEnhancements() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      hapticFeedback('success');
    });
    
    // Validación en tiempo real
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        validateField(input);
      });
    });
  });
}

// Función para validar campos
function validateField(field) {
  const value = field.value.trim();
  const fieldType = field.type;
  const fieldName = field.name;
  
  let isValid = true;
  let errorMessage = '';
  
  // Validaciones específicas
  if (field.hasAttribute('required') && !value) {
    isValid = false;
    errorMessage = 'Este campo es requerido';
  } else if (fieldType === 'email' && value && !isValidEmail(value)) {
    isValid = false;
    errorMessage = 'Email inválido';
  } else if (fieldType === 'number' && value && isNaN(value)) {
    isValid = false;
    errorMessage = 'Número inválido';
  }
  
  // Mostrar/ocultar error
  const errorElement = field.parentNode.querySelector('.error-message');
  if (!isValid) {
    if (!errorElement) {
      const error = document.createElement('div');
      error.className = 'error-message text-danger small mt-1';
      error.textContent = errorMessage;
      field.parentNode.appendChild(error);
    } else {
      errorElement.textContent = errorMessage;
    }
    hapticFeedback('error');
  } else if (errorElement) {
    errorElement.remove();
  }
}

// Función para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para mejorar la experiencia de carga
function setupLoadingEnhancements() {
  // Mostrar spinner de carga
  function showLoading(element) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    element.appendChild(spinner);
  }
  
  // Ocultar spinner de carga
  function hideLoading(element) {
    const spinner = element.querySelector('.loading-spinner');
    if (spinner) {
      spinner.remove();
    }
  }
  
  // Exponer funciones globalmente
  window.showLoading = showLoading;
  window.hideLoading = hideLoading;
}

// Función para mejorar la experiencia de errores
function setupErrorHandling() {
  window.addEventListener('error', (e) => {
    console.error('Error:', e.error);
    hapticFeedback('error');
    
    // Mostrar notificación de error
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ha ocurrido un error inesperado',
      confirmButtonText: 'Aceptar'
    });
  });
}

// Función para mejorar la experiencia offline
function setupOfflineEnhancements() {
  window.addEventListener('online', () => {
    hapticFeedback('success');
    showNativeNotification('TillUp', {
      body: 'Conexión restaurada',
      tag: 'connection-restored'
    });
    
    // Verificar actualizaciones cuando se restaura la conexión
    checkForAppUpdates();
  });
  
  window.addEventListener('offline', () => {
    hapticFeedback('error');
    showNativeNotification('TillUp', {
      body: 'Sin conexión - Modo offline',
      tag: 'connection-lost'
    });
  });
}

// === SISTEMA DE ACTUALIZACIÓN AUTOMÁTICA ===

// Variables para el sistema de actualización
let updateAvailable = false;
let updateData = null;
let updateCheckInterval = null;

// Función para configurar el sistema de actualización
function setupUpdateSystem() {
  // Escuchar mensajes del Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleSWMessage);
  }
  
  // Verificar actualizaciones periódicamente
  startPeriodicUpdateCheck();
  
  // Verificar actualizaciones al cargar la app
  checkForAppUpdates();
}

// Función para manejar mensajes del Service Worker
function handleSWMessage(event) {
  const { type, data, updates, timestamp } = event.data;
  
  switch (type) {
    case 'SW_INSTALLED':
      console.log('Nueva versión instalada:', data);
      showUpdateNotification('Nueva versión instalada', 'success');
      break;
      
    case 'SW_UPDATED':
      console.log('Service Worker actualizado:', data);
      if (data.requiresReload) {
        showUpdateNotification('Actualización disponible', 'info');
        showUpdateIndicator();
      }
      break;
      
    case 'UPDATE_AVAILABLE':
      console.log('Actualización detectada:', data);
      updateAvailable = true;
      updateData = data;
      showUpdateNotification('Actualización disponible', 'info');
      showUpdateIndicator();
      break;
      
    case 'UPDATES_FOUND':
      console.log('Actualizaciones encontradas:', updates);
      if (updates && updates.length > 0) {
        updateAvailable = true;
        updateData = { updates, timestamp };
        showUpdateNotification(`${updates.length} actualización(es) disponible(s)`, 'info');
        showUpdateIndicator();
      }
      break;
      
    case 'UPDATE_APPLIED':
      console.log('Actualización aplicada:', data);
      updateAvailable = false;
      updateData = null;
      hideUpdateIndicator();
      showUpdateNotification('Actualización aplicada exitosamente', 'success');
      // Recargar la página después de un breve delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      break;
      
    case 'SYNC_COMPLETED':
      console.log('Sincronización completada');
      break;
      
    case 'SYNC_ERROR':
      console.error('Error en sincronización:', data);
      break;
  }
}

// Función para mostrar indicador de actualización
function showUpdateIndicator() {
  const updateBtn = document.getElementById('updateIndicator');
  const installBtn = document.getElementById('installPWA');
  
  if (updateBtn) {
    updateBtn.style.display = 'block';
  }
  
  if (installBtn) {
    installBtn.style.display = 'none';
  }
  
  hapticFeedback('medium');
}

// Función para ocultar indicador de actualización
function hideUpdateIndicator() {
  const updateBtn = document.getElementById('updateIndicator');
  
  if (updateBtn) {
    updateBtn.style.display = 'none';
  }
}

// Función para verificar actualizaciones de la app
async function checkForAppUpdates() {
  if (!navigator.onLine) return;
  
  try {
    console.log('Verificando actualizaciones de la app...');
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CHECK_FOR_UPDATES'
      });
    }
    
    // También verificar manualmente archivos críticos
    const criticalFiles = [
      './app.js',
      './style.css',
      './utils.js'
    ];
    
    const updatePromises = criticalFiles.map(async (file) => {
      try {
        const response = await fetch(file, { 
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
          const newContent = await response.text();
          const cachedContent = localStorage.getItem(`cached_${file}`);
          
          if (cachedContent && cachedContent !== newContent) {
            console.log('Actualización detectada en:', file);
            return { file, hasUpdate: true };
          } else {
            localStorage.setItem(`cached_${file}`, newContent);
          }
        }
        
        return { file, hasUpdate: false };
      } catch (error) {
        console.error('Error verificando:', file, error);
        return { file, hasUpdate: false, error: true };
      }
    });
    
    const results = await Promise.all(updatePromises);
    const updates = results.filter(r => r.hasUpdate);
    
    if (updates.length > 0) {
      updateAvailable = true;
      updateData = { updates, timestamp: Date.now() };
      showUpdateNotification(`${updates.length} actualización(es) disponible(s)`, 'info');
    }
    
  } catch (error) {
    console.error('Error verificando actualizaciones:', error);
  }
}

// Función para iniciar verificación periódica de actualizaciones
function startPeriodicUpdateCheck() {
  // Verificar cada 30 minutos
  const checkInterval = 30 * 60 * 1000;
  
  updateCheckInterval = setInterval(() => {
    if (navigator.onLine) {
      checkForAppUpdates();
    }
  }, checkInterval);
  
  // También verificar cuando la app vuelve a estar activa
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine) {
      checkForAppUpdates();
    }
  });
}

// Función para mostrar notificación de actualización
function showUpdateNotification(message, type = 'info') {
  // Mostrar notificación nativa si está disponible
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('TillUp - Actualización', {
      body: message,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: 'update-notification',
      requireInteraction: type === 'info',
      actions: type === 'info' ? [
        {
          action: 'apply_update',
          title: 'Aplicar'
        },
        {
          action: 'dismiss',
          title: 'Más tarde'
        }
      ] : []
    });
    
    notification.onclick = () => {
      if (type === 'info' && updateAvailable) {
        applyUpdate();
      }
      notification.close();
    };
  }
  
  // Mostrar notificación en la UI
  showUpdateToast(message, type);
}

// Función para mostrar toast de actualización
function showUpdateToast(message, type) {
  const toastContainer = document.getElementById('toastContainer') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast show bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} text-white`;
  toast.innerHTML = `
    <div class="toast-header">
      <i class="bi bi-arrow-clockwise me-2"></i>
      <strong class="me-auto">Actualización</strong>
      <button type="button" class="btn-close btn-close-white" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
    <div class="toast-body">
      ${message}
      ${type === 'info' && updateAvailable ? `
        <div class="mt-2">
          <button class="btn btn-sm btn-light" onclick="applyUpdate()">Aplicar</button>
          <button class="btn btn-sm btn-outline-light ms-2" onclick="this.parentElement.parentElement.parentElement.remove()">Más tarde</button>
        </div>
      ` : ''}
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto-remover después de 10 segundos
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 10000);
}

// Función para crear contenedor de toasts
function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container position-fixed top-0 end-0 p-3';
  container.style.zIndex = '9999';
  document.body.appendChild(container);
  return container;
}

// Función para aplicar actualización
async function applyUpdate() {
  try {
    console.log('Aplicando actualización...');
    
    // Mostrar indicador de carga
    showUpdateToast('Aplicando actualización...', 'info');
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'APPLY_UPDATE'
      });
    }
    
    // Limpiar caché del navegador
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
    }
    
    // Limpiar localStorage de archivos cacheados
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cached_')) {
        localStorage.removeItem(key);
      }
    });
    
    hapticFeedback('success');
    
    // Recargar la página después de un breve delay
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('Error aplicando actualización:', error);
    showUpdateToast('Error al aplicar actualización', 'error');
  }
}

// Función para forzar verificación de actualizaciones
window.forceUpdateCheck = function() {
  checkForAppUpdates();
  hapticFeedback('medium');
  showUpdateToast('Verificando actualizaciones...', 'info');
};

// Función para inicializar todas las mejoras nativas
function initializeNativeEnhancements() {
  setupSmoothScroll();
  setupModalGestures();
  setupButtonFeedback();
  setupInputEnhancements();
  setupCardInteractions();
  setupListInteractions();
  setupNavigationEnhancements();
  setupSearchEnhancements();
  setupFormEnhancements();
  setupLoadingEnhancements();
  setupErrorHandling();
  setupOfflineEnhancements();
  setupQuickActions();
  setupUpdateSystem();
  
  // Configurar pull-to-refresh en contenedores principales
  const mainContainer = document.getElementById('mainContent');
  if (mainContainer) {
    setupPullToRefresh(mainContainer, () => {
      location.reload();
    });
  }
  
  // Solicitar permisos de notificación
  requestNotificationPermission();
}

// Función para configurar acciones rápidas
function setupQuickActions() {
  // Cerrar menú al hacer clic fuera
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('quickActionsMenu');
    const btn = document.getElementById('floatingActionBtn');
    
    if (menu && !menu.contains(e.target) && !btn.contains(e.target)) {
      hideQuickActions();
    }
  });
}

// Función para mostrar menú de acciones rápidas
window.showQuickActions = function() {
  const menu = document.getElementById('quickActionsMenu');
  const btn = document.getElementById('floatingActionBtn');
  
  if (menu.style.display === 'none') {
    menu.style.display = 'block';
    btn.innerHTML = '<i class="bi bi-x-lg"></i>';
    btn.style.transform = 'rotate(45deg)';
    hapticFeedback('medium');
  } else {
    hideQuickActions();
  }
}

// Función para ocultar menú de acciones rápidas
function hideQuickActions() {
  const menu = document.getElementById('quickActionsMenu');
  const btn = document.getElementById('floatingActionBtn');
  
  menu.style.display = 'none';
  btn.innerHTML = '<i class="bi bi-plus-lg"></i>';
  btn.style.transform = 'rotate(0deg)';
}

// Función para manejar acciones rápidas
window.quickAction = function(action) {
  hideQuickActions();
  hapticFeedback('success');
  
  switch (action) {
    case 'addProduct':
      showView('inventory');
      setTimeout(() => {
        document.querySelector('[onclick="addProduct(event)"]').click();
      }, 300);
      break;
      
    case 'addClient':
      showView('clients');
      setTimeout(() => {
        document.querySelector('[onclick="addClient(event)"]').click();
      }, 300);
      break;
      
    case 'newSale':
      showView('sales');
      break;
      
    case 'chickenSale':
      showView('chickens');
      break;
      
    default:
      console.log('Acción no reconocida:', action);
  }
}

// === GESTIÓN DE POLLOS ===

// Variables globales para pollos
let chickenSales = [];
let pricePerPound = 2.50; // Precio por libra por defecto
let costPerPound = 1.80; // Costo por libra por defecto

// Inicializar datos de pollos
function initializeChickenData() {
  // Cargar ventas de pollos desde localStorage
  const savedChickenSales = localStorage.getItem('chickenSales');
  if (savedChickenSales) {
    chickenSales = JSON.parse(savedChickenSales);
  }
  
  // Cargar precio por libra
  const savedPricePerPound = localStorage.getItem('pricePerPound');
  if (savedPricePerPound) {
    pricePerPound = parseFloat(savedPricePerPound);
  }
  
  // Cargar costo por libra
  const savedCostPerPound = localStorage.getItem('costPerPound');
  if (savedCostPerPound) {
    costPerPound = parseFloat(savedCostPerPound);
  }
  
  // Actualizar campos de precio y costo
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  if (priceInput) {
    priceInput.value = pricePerPound.toFixed(2);
  }
  if (costInput) {
    costInput.value = costPerPound.toFixed(2);
  }
}

// Actualizar configuración de pollos (precio y costo)
function updateChickenConfig() {
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  const newPrice = parseFloat(priceInput.value);
  const newCost = parseFloat(costInput.value);
  
  if (isNaN(newPrice) || newPrice < 0) {
    Swal.fire({
      icon: 'error',
      title: 'Precio inválido',
      text: 'Por favor ingresa un precio válido mayor a 0.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  if (isNaN(newCost) || newCost < 0) {
    Swal.fire({
      icon: 'error',
      title: 'Costo inválido',
      text: 'Por favor ingresa un costo válido mayor a 0.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  if (newCost >= newPrice) {
    Swal.fire({
      icon: 'warning',
      title: 'Configuración inválida',
      text: 'El costo debe ser menor al precio para generar ganancia.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  pricePerPound = newPrice;
  costPerPound = newCost;
  localStorage.setItem('pricePerPound', pricePerPound.toString());
  localStorage.setItem('costPerPound', costPerPound.toString());
  
  // Actualizar display
  updateChickenCalculation();
  
  Swal.fire({
    icon: 'success',
    title: 'Configuración actualizada',
    text: `Precio: $${pricePerPound.toFixed(2)} | Costo: $${costPerPound.toFixed(2)} | Ganancia: $${(pricePerPound - costPerPound).toFixed(2)}`,
    timer: 3000,
    showConfirmButton: false
  });
}

// Actualizar cálculo automático
function updateChickenCalculation() {
  const quantity = parseInt(document.getElementById('chickenQuantity')?.value) || 0;
  const weight = parseFloat(document.getElementById('chickenWeight')?.value) || 0;
  
  const displayPricePerPound = document.getElementById('displayPricePerPound');
  const displayCostPerPound = document.getElementById('displayCostPerPound');
  const displayProfitPerPound = document.getElementById('displayProfitPerPound');
  const displayTotalAmount = document.getElementById('displayTotalAmount');
  const displayTotalProfit = document.getElementById('displayTotalProfit');
  
  if (displayPricePerPound) {
    displayPricePerPound.textContent = `$${pricePerPound.toFixed(2)}`;
  }
  
  if (displayCostPerPound) {
    displayCostPerPound.textContent = `$${costPerPound.toFixed(2)}`;
  }
  
  if (displayProfitPerPound) {
    const profitPerPound = pricePerPound - costPerPound;
    displayProfitPerPound.textContent = `$${profitPerPound.toFixed(2)}`;
  }
  
  if (displayTotalAmount) {
    const total = weight * pricePerPound;
    displayTotalAmount.textContent = `$${total.toFixed(2)}`;
  }
  
  if (displayTotalProfit) {
    const totalProfit = weight * (pricePerPound - costPerPound);
    displayTotalProfit.textContent = `$${totalProfit.toFixed(2)}`;
  }
}

// Mostrar vista de pollos
function showChickenView() {
  updateChickenStats();
  updateChickenClientSelector();
  updateChickenSalesList();
  updateChickenCalculation();
  
  // Configurar event listeners
  setupChickenEventListeners();
}

// Configurar event listeners para pollos
function setupChickenEventListeners() {
  // Event listeners para cálculo automático
  const quantityInput = document.getElementById('chickenQuantity');
  const weightInput = document.getElementById('chickenWeight');
  
  if (quantityInput) {
    quantityInput.addEventListener('input', updateChickenCalculation);
  }
  
  if (weightInput) {
    weightInput.addEventListener('input', updateChickenCalculation);
  }
  
  // Event listeners para forma de pago
  const cashRadio = document.getElementById('chickenCash');
  const creditRadio = document.getElementById('chickenCredit');
  const abonoSection = document.getElementById('chickenAbonoSection');
  
  if (cashRadio && creditRadio && abonoSection) {
    cashRadio.addEventListener('change', () => {
      abonoSection.style.display = 'none';
    });
    
    creditRadio.addEventListener('change', () => {
      abonoSection.style.display = 'block';
    });
  }
  
  // Event listener para el formulario
  const form = document.getElementById('chickenSaleForm');
  if (form) {
    form.addEventListener('submit', handleChickenSale);
  }
}

// Manejar venta de pollos
function handleChickenSale(e) {
  e.preventDefault();
  
  const clientId = document.getElementById('chickenClient').value;
  const quantity = parseInt(document.getElementById('chickenQuantity').value);
  const weight = parseFloat(document.getElementById('chickenWeight').value);
  const paymentType = document.querySelector('input[name="chickenPayment"]:checked').value;
  const abono = parseFloat(document.getElementById('chickenAbonoInput').value) || 0;
  
  // Validaciones
  if (!clientId) {
    Swal.fire({
      icon: 'error',
      title: 'Cliente requerido',
      text: 'Por favor selecciona un cliente.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  if (quantity < 1) {
    Swal.fire({
      icon: 'error',
      title: 'Cantidad inválida',
      text: 'La cantidad debe ser al menos 1 pollo.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  if (weight <= 0) {
    Swal.fire({
      icon: 'error',
      title: 'Peso inválido',
      text: 'El peso debe ser mayor a 0.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  const total = weight * pricePerPound;
  const client = clients.find(c => c.id === clientId);
  
  if (paymentType === 'credit' && abono > total) {
    Swal.fire({
      icon: 'error',
      title: 'Abono inválido',
      text: 'El abono no puede ser mayor al total.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  // Crear venta de pollos
  const chickenSale = {
    id: generateId('chickenSale'),
    clientId: clientId,
    clientName: client.name,
    quantity: quantity,
    weight: weight,
    pricePerPound: pricePerPound,
    costPerPound: costPerPound,
    total: total,
    cost: weight * costPerPound,
    profit: weight * (pricePerPound - costPerPound),
    paymentType: paymentType,
    abono: abono,
    remainingAmount: paymentType === 'credit' ? total - abono : 0,
    date: new Date().toISOString(),
    time: new Date().toLocaleTimeString()
  };
  
  // Agregar a la lista de ventas de pollos
  chickenSales.push(chickenSale);
  saveToStorage('chickenSales', chickenSales);
  
  // Si es a crédito y hay monto pendiente, crear deuda
  if (paymentType === 'credit' && chickenSale.remainingAmount > 0) {
    const debt = {
      id: generateId('debt'),
      clientId: clientId,
      clientName: client.name,
      amount: chickenSale.remainingAmount,
      total: total,
      abono: abono,
      reason: `Venta de ${quantity} pollo(s) - ${weight} lbs`,
      date: new Date().toISOString(),
      chickenSaleId: chickenSale.id
    };
    
    debts.push(debt);
    saveToStorage('debts', debts);
    
    // Actualizar deuda del cliente
    client.debt = (client.debt || 0) + chickenSale.remainingAmount;
    saveToStorage('clients', clients);
  }
  
  // Limpiar formulario
  resetChickenForm();
  
  // Actualizar vistas
  updateChickenStats();
  updateChickenSalesList();
  updateBalanceUI();
  renderDebts();
  renderClients();
  
  // Mostrar comprobante
  showChickenReceipt(chickenSale);
}

// Limpiar formulario de pollos
function resetChickenForm() {
  document.getElementById('chickenSaleForm').reset();
  document.getElementById('chickenQuantity').value = '1';
  document.getElementById('chickenAbonoSection').style.display = 'none';
  const abonoInput = document.getElementById('chickenAbonoInput');
  if (abonoInput) abonoInput.value = '';
}

// Mostrar comprobante de venta de pollos
function showChickenReceipt(sale) {
  const fecha = new Date().toLocaleString();
  
  let detalle = `
    <div class="receipt-treinta">
      <div class="receipt-header">
        <div class="receipt-logo">
          <img src="TillUp.png" alt="TillUp" style="width: 60px; height: 60px; object-fit: contain;">
          <h3>TillUp POS</h3>
        </div>
        <div class="receipt-info">
          <div class="receipt-title">COMPROBANTE DE POLLOS</div>
          <div class="receipt-number">#${sale.id}</div>
          <div class="receipt-date">${fecha}</div>
        </div>
      </div>
      
      <div class="receipt-client">
        <i class="bi bi-person-circle"></i>
        <span><strong>Cliente:</strong> ${sale.clientName}</span>
      </div>
      
      <div class="receipt-items">
        <div class="receipt-items-header">
          <span>Producto</span>
          <span>Cant.</span>
          <span>Peso</span>
          <span>Precio</span>
        </div>
        <div class="receipt-item">
          <span class="item-name">Pollo Entero</span>
          <span class="item-qty">${sale.quantity}</span>
          <span class="item-price">${sale.weight} lbs</span>
          <span class="item-subtotal">$${sale.pricePerPound.toFixed(2)}/lb</span>
        </div>
      </div>
      
      <div class="receipt-total">
        <div class="total-line">
          <span>Peso total:</span>
          <span>${sale.weight} lbs</span>
        </div>
        <div class="total-line">
          <span>Precio por libra:</span>
          <span>$${sale.pricePerPound.toFixed(2)}</span>
        </div>
        <div class="total-line final">
          <span>Total:</span>
          <span class="total-amount">$${sale.total.toFixed(2)}</span>
        </div>
        ${sale.paymentType === 'credit' && sale.abono > 0 ? `
          <div class="total-line discount">
            <span>Abono:</span>
            <span>-$${sale.abono.toFixed(2)}</span>
          </div>
          <div class="total-line">
            <span>Pendiente:</span>
            <span>$${sale.remainingAmount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="payment-type">
          <i class="bi bi-${getPaymentIcon(sale.paymentType)}"></i>
          ${getPaymentText(sale.paymentType)}
        </div>
      </div>
      
      <div class="receipt-footer">
        <div class="footer-message">
          <i class="bi bi-heart"></i>
          <span>¡Gracias por su compra!</span>
        </div>
        <div class="footer-brand">
          <span>Generado por TillUp POS</span>
          <small>Especializado en venta de pollos</small>
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    title: '',
    html: detalle,
    showConfirmButton: true,
    confirmButtonText: '<i class="bi bi-printer"></i> Imprimir',
    showDenyButton: true,
    denyButtonText: '<i class="bi bi-download"></i> PDF',
    showCancelButton: true,
    cancelButtonText: 'Cerrar',
    customClass: { 
      popup: 'swal2-receipt-treinta'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      printChickenReceipt(sale);
    } else if (result.isDenied) {
      downloadChickenReceiptPDF(sale);
    }
  });
}

// Imprimir comprobante de pollos
function printChickenReceipt(sale) {
  const fecha = new Date().toLocaleString();
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comprobante de Pollos - ${sale.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .receipt { max-width: 300px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
        .title { font-size: 18px; font-weight: bold; margin: 5px 0; }
        .subtitle { font-size: 14px; color: #666; }
        .client { margin: 10px 0; }
        .items { margin: 15px 0; }
        .item { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { border-top: 1px solid #000; padding-top: 10px; margin-top: 15px; }
        .total-line { display: flex; justify-content: space-between; margin: 5px 0; }
        .final { font-weight: bold; font-size: 16px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="title">TillUp POS</div>
          <div class="subtitle">COMPROBANTE DE POLLOS</div>
          <div class="subtitle">#${sale.id}</div>
          <div class="subtitle">${fecha}</div>
        </div>
        
        <div class="client">
          <strong>Cliente:</strong> ${sale.clientName}
        </div>
        
        <div class="items">
          <div class="item">
            <span>Pollo Entero (${sale.quantity})</span>
            <span>${sale.weight} lbs</span>
          </div>
          <div class="item">
            <span>Precio por libra:</span>
            <span>$${sale.pricePerPound.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="total">
          <div class="total-line">
            <span>Total:</span>
            <span class="final">$${sale.total.toFixed(2)}</span>
          </div>
          ${sale.paymentType === 'credit' && sale.abono > 0 ? `
            <div class="total-line">
              <span>Abono:</span>
              <span>-$${sale.abono.toFixed(2)}</span>
            </div>
            <div class="total-line">
              <span>Pendiente:</span>
              <span>$${sale.remainingAmount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-line">
            <span>Forma de pago:</span>
            <span>${getPaymentText(sale.paymentType)}</span>
          </div>
        </div>
        
        <div class="footer">
          ¡Gracias por su compra!<br>
          Generado por TillUp POS
        </div>
      </div>
    </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.print();
}

// Descargar PDF de comprobante de pollos
function downloadChickenReceiptPDF(sale) {
  // Verificar si jsPDF está disponible
  if (typeof window.jspdf === 'undefined') {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'La librería PDF no está disponible. Verifica tu conexión a internet.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const fecha = new Date().toLocaleString();
  
  // Configuración de colores
  const primaryColor = [31, 45, 61]; // #1F2D3D
  const secondaryColor = [42, 63, 90]; // #2a3f5a
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("TillUp POS", 14, 12);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text("COMPROBANTE DE POLLOS", 14, 20);
  
  // Información de la venta
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.text(`Venta #${sale.id}`, 14, 35);
  doc.text(`Fecha: ${fecha}`, 14, 40);
  doc.text(`Cliente: ${sale.clientName}`, 14, 45);
  
  // Detalle del producto
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Detalle de Producto", 14, 60);
  
  const items = [
    ['Producto', 'Cantidad', 'Peso', 'Precio/lb', 'Subtotal'],
    ['Pollo Entero', sale.quantity.toString(), `${sale.weight} lbs`, `$${sale.pricePerPound.toFixed(2)}`, `$${sale.total.toFixed(2)}`]
  ];
  
  doc.autoTable({
    startY: 65,
    head: [items[0]],
    body: [items[1]],
    theme: 'grid',
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }
  });
  
  // Totales
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Resumen", 14, finalY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Peso total: ${sale.weight} lbs`, 14, finalY + 10);
  doc.text(`Precio por libra: $${sale.pricePerPound.toFixed(2)}`, 14, finalY + 15);
  
  if (sale.paymentType === 'credit' && sale.abono > 0) {
    doc.text(`Abono: -$${sale.abono.toFixed(2)}`, 14, finalY + 20);
    doc.text(`Pendiente: $${sale.remainingAmount.toFixed(2)}`, 14, finalY + 25);
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: $${sale.total.toFixed(2)}`, 14, finalY + 35);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Método de pago: ${getPaymentText(sale.paymentType)}`, 14, finalY + 45);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("¡Gracias por su compra!", 14, finalY + 60);
  doc.text("Generado por TillUp POS - Especializado en venta de pollos", 14, finalY + 65);
  
  doc.save(`Comprobante_Pollos_${sale.id}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Actualizar estadísticas de pollos
function updateChickenStats() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Filtrar ventas de hoy
  const todaySales = chickenSales.filter(sale => 
    sale.date.startsWith(todayStr)
  );
  
  // Calcular estadísticas
  const totalChickens = todaySales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalWeight = todaySales.reduce((sum, sale) => sum + sale.weight, 0);
  const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = todaySales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
  const avgWeight = totalChickens > 0 ? totalWeight / totalChickens : 0;
  
  // Actualizar elementos en el DOM
  const totalChickensElement = document.getElementById('totalChickensSold');
  const totalWeightElement = document.getElementById('totalWeightSold');
  const totalRevenueElement = document.getElementById('totalRevenue');
  const totalProfitElement = document.getElementById('totalProfit');
  const avgWeightElement = document.getElementById('avgWeight');
  
  if (totalChickensElement) totalChickensElement.textContent = totalChickens;
  if (totalWeightElement) totalWeightElement.textContent = totalWeight.toFixed(1);
  if (totalRevenueElement) totalRevenueElement.textContent = `$${totalRevenue.toFixed(2)}`;
  if (totalProfitElement) totalProfitElement.textContent = `$${totalProfit.toFixed(2)}`;
  if (avgWeightElement) avgWeightElement.textContent = avgWeight.toFixed(1);
}

// Actualizar selector de clientes para pollos
function updateChickenClientSelector() {
  const selector = document.getElementById('chickenClient');
  if (!selector) return;
  
  selector.innerHTML = '<option value="">Seleccionar cliente...</option>';
  
  clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = client.name;
    selector.appendChild(option);
  });
}

// Actualizar lista de ventas de pollos
function updateChickenSalesList() {
  const container = document.getElementById('chickenSalesList');
  const countElement = document.getElementById('chickenSalesCount');
  
  if (!container) return;
  
  // Ordenar por fecha más reciente
  const sortedSales = [...chickenSales].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (countElement) {
    countElement.textContent = `${sortedSales.length} ventas`;
  }
  
  if (sortedSales.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-egg-fried" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">No hay ventas de pollos registradas</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = sortedSales.map(sale => `
    <div class="chicken-sale-item-treinta">
      <div class="chicken-sale-header-treinta">
        <div class="chicken-sale-client-treinta">
          <i class="bi bi-person"></i>
          ${sale.clientName}
        </div>
        <div class="chicken-sale-date-treinta">
          ${new Date(sale.date).toLocaleDateString()} ${sale.time}
        </div>
      </div>
      
      <div class="chicken-sale-details-treinta">
        <div class="chicken-sale-detail-treinta">
          <div class="chicken-sale-detail-label-treinta">Cantidad</div>
          <div class="chicken-sale-detail-value-treinta">${sale.quantity} pollo(s)</div>
        </div>
        <div class="chicken-sale-detail-treinta">
          <div class="chicken-sale-detail-label-treinta">Peso Total</div>
          <div class="chicken-sale-detail-value-treinta">${sale.weight} lbs</div>
        </div>
        <div class="chicken-sale-detail-treinta">
          <div class="chicken-sale-detail-label-treinta">Precio/Lb</div>
          <div class="chicken-sale-detail-value-treinta">$${sale.pricePerPound.toFixed(2)}</div>
        </div>
        <div class="chicken-sale-detail-treinta">
          <div class="chicken-sale-detail-label-treinta">Peso Promedio</div>
          <div class="chicken-sale-detail-value-treinta">${(sale.weight / sale.quantity).toFixed(1)} lbs</div>
        </div>
      </div>
      
      <div class="chicken-sale-total-treinta">
        <div class="chicken-sale-total-label-treinta">Total</div>
        <div class="chicken-sale-total-amount-treinta">$${sale.total.toFixed(2)}</div>
      </div>
      
      <div class="chicken-sale-payment-treinta ${sale.paymentType}">
        <i class="bi bi-${getPaymentIcon(sale.paymentType)}"></i>
        ${getPaymentText(sale.paymentType)}
        ${sale.paymentType === 'credit' && sale.abono > 0 ? ` (Abono: $${sale.abono.toFixed(2)})` : ''}
      </div>
    </div>
  `).join('');
}

// Generar PDF de reporte de pollos
function generateChickenPDF() {
  // Implementar generación de PDF para reporte de pollos
  Swal.fire({
    icon: 'info',
    title: 'PDF en desarrollo',
    text: 'La funcionalidad de exportar PDF estará disponible próximamente.',
    confirmButtonText: 'Aceptar'
  });
}

// === Función de migración de fechas ===
function migrateDateFormats() {
  let needsMigration = false;
  
  // Migrar fechas de ventas
  sales.forEach(sale => {
    if (typeof sale.date === 'string' && !sale.date.includes('T')) {
      // Es una fecha en formato local, convertir a ISO
      const dateParts = sale.date.split('/');
      if (dateParts.length === 3) {
        const [month, day, year] = dateParts;
        const isoDate = new Date(year, month - 1, day).toISOString();
        sale.date = isoDate;
        needsMigration = true;
      }
    }
  });
  
  // Migrar fechas de deudas
  debts.forEach(debt => {
    if (typeof debt.date === 'string' && !debt.date.includes('T')) {
      // Es una fecha en formato local, convertir a ISO
      const dateParts = debt.date.split('/');
      if (dateParts.length === 3) {
        const [month, day, year] = dateParts;
        const isoDate = new Date(year, month - 1, day).toISOString();
        debt.date = isoDate;
        needsMigration = true;
      }
    }
  });
  
  if (needsMigration) {
    saveToStorage('sales', sales);
    saveToStorage('debts', debts);
    console.log('Migración de fechas completada');
  }
}



// === Funciones del Sidebar (globales) ===
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// === Configuración de tema (global) ===
function setTheme(mode) {
  // Remover clases activas de todos los botones
  document.querySelectorAll('.sidebar-action-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Activar el botón seleccionado
  document.getElementById(`theme-${mode}`).classList.add('active');
  
  if (mode === 'auto') {
    // Detectar automáticamente
    detectDarkMode();
  } else if (mode === 'dark') {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
  
  // Guardar preferencia
  localStorage.setItem('theme', mode);
  
  // Mostrar notificación
  const themeNames = {
    light: 'Modo Claro',
    dark: 'Modo Oscuro',
    auto: 'Automático'
  };
  
  Swal.fire({
    icon: 'success',
    title: 'Tema cambiado',
    text: `Cambiado a ${themeNames[mode]}`,
    timer: 1500,
    showConfirmButton: false
  });
}

// === Funciones de instalación PWA ===
function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuario aceptó la instalación');
        Swal.fire({
          icon: 'success',
          title: '¡Instalación exitosa!',
          text: 'TillUp POS ha sido instalado en tu dispositivo.',
          timer: 3000,
          showConfirmButton: false
        });
      } else {
        console.log('Usuario rechazó la instalación');
        Swal.fire({
          icon: 'info',
          title: 'Instalación cancelada',
          text: 'Puedes instalar la app más tarde desde el menú del navegador.',
          timer: 3000,
          showConfirmButton: false
        });
      }
      deferredPrompt = null;
      installButton.style.display = 'none';
      // Limpiar el flag de rechazo ya que el usuario instaló la app
      localStorage.removeItem('pwa-installation-rejected');
    });
  }
}

function showInstallButton() {
  // Verificar nuevamente si la app está instalada
  if (isAppInstalled()) {
    console.log('App ya está instalada, ocultando botón');
    if (installButton) {
      installButton.style.display = 'none';
    }
    return;
  }
  
  // Verificar si el usuario ya rechazó la instalación
  if (hasUserRejectedInstallation()) {
    console.log('Usuario rechazó la instalación anteriormente');
    if (installButton) {
      installButton.style.display = 'none';
    }
    return;
  }
  
  if (installButton && deferredPrompt) {
    installButton.style.display = 'flex';
    installButton.classList.add('animate');
    
    // Mostrar notificación
    Swal.fire({
      icon: 'info',
      title: '¡Instala TillUp POS!',
      text: 'Instala la app para acceder más rápido y usar sin conexión.',
      showCancelButton: true,
      confirmButtonText: 'Instalar',
      cancelButtonText: 'Más tarde',
      timer: 10000,
      timerProgressBar: true
    }).then((result) => {
      if (result.isConfirmed) {
        installPWA();
      } else {
        // Marcar que el usuario rechazó la instalación
        markInstallationRejected();
        if (installButton) {
          installButton.style.display = 'none';
        }
      }
    });
  }
}

function forceUpdate() {
  Swal.fire({
    title: 'Buscando actualizaciones...',
    html: '<div class="spinner-border text-primary" role="status"></div><div class="mt-2">Verificando si hay una nueva versión disponible...</div>',
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Actualización lista',
            text: 'La app se actualizará ahora.',
            timer: 1500,
            showConfirmButton: false
          });
          window.location.reload();
        });
      } else {
        setTimeout(() => {
          Swal.close();
          Swal.fire({
            icon: 'info',
            title: 'Sin cambios',
            text: 'La app ya está actualizada.',
            timer: 1800,
            showConfirmButton: false
          });
        }, 1200);
      }
    });
  } else {
    setTimeout(() => {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'No compatible',
        text: 'Tu navegador no soporta actualizaciones automáticas.',
        timer: 2000,
        showConfirmButton: false
      });
    }, 1200);
  }
}

// === Actualizar fecha y hora en tiempo real ===
function updateDateTime() {
  const now = new Date();
  
  // Formatear fecha
  const dateOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const dateStr = now.toLocaleDateString('es-ES', dateOptions);
  document.getElementById('currentDate').textContent = dateStr;
  
  // Formatear hora
  const timeOptions = { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  };
  const timeStr = now.toLocaleTimeString('es-ES', timeOptions);
  document.getElementById('currentTime').textContent = timeStr;
}

// Actualizar cada segundo
setInterval(updateDateTime, 1000);
updateDateTime(); // Ejecutar inmediatamente

// === Variables PWA ===
let installButton;

// === Función helper para verificar instalación ===
function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// === Función helper para verificar si el usuario rechazó la instalación ===
function hasUserRejectedInstallation() {
  return localStorage.getItem('pwa-installation-rejected') === 'true';
}

// === Función helper para marcar que el usuario rechazó la instalación ===
function markInstallationRejected() {
  localStorage.setItem('pwa-installation-rejected', 'true');
}

// === Al cargar la app ===
document.addEventListener('DOMContentLoaded', () => {
  products = loadFromStorage('products');
  clients = loadFromStorage('clients');
  sales = loadFromStorage('sales');
  debts = loadFromStorage('debts');

  // Migrar fechas existentes al formato ISO
  migrateDateFormats();

  renderInventory();
  renderSalesProducts();
  renderClients();
  updateClientSelector();
  updateBalanceUI();
  renderDebts();
  renderBalanceGrid();

  // Escuchar cambios en el selector de cliente
  const clientSelector = document.getElementById('clientSelector');
  if (clientSelector) {
    clientSelector.addEventListener('change', e => {
      currentClientId = e.target.value;
      cart = loadProforma(currentClientId);
      renderCart();
    });
  }
  
  // Inicializar búsqueda de productos en ventas
  const productSearch = document.getElementById('productSearch');
  if (productSearch) {
    productSearch.addEventListener('input', (e) => {
      filterProductsInSales(e.target.value);
    });
  }

  // Eventos de formularios
  const formProduct = document.getElementById('formProduct');
  const formClient = document.getElementById('formClient');
  if (formProduct) {
    formProduct.removeEventListener('submit', addProduct); // Evitar duplicados
    formProduct.addEventListener('submit', addProduct);
    console.log('Formulario de producto inicializado');
  } else {
    console.error('No se encontró el formulario de producto');
  }
  if (formClient) {
    formClient.removeEventListener('submit', addClient); // Evitar duplicados
    formClient.addEventListener('submit', addClient);
    console.log('Formulario de cliente inicializado');
  } else {
    console.error('No se encontró el formulario de cliente');
  }

  // Alternar vista inventario
  const toggleInventoryViewBtn = document.getElementById('toggleInventoryView');
  const toggleInventoryViewText = document.getElementById('toggleInventoryViewText');
  if (toggleInventoryViewBtn && toggleInventoryViewText) {
    toggleInventoryViewBtn.addEventListener('click', () => {
      inventoryViewMode = inventoryViewMode === 'grid' ? 'list' : 'grid';
      localStorage.setItem('inventoryViewMode', inventoryViewMode);
      renderInventory();
      toggleInventoryViewBtn.querySelector('i').className = inventoryViewMode === 'grid' ? 'bi bi-grid-3x3-gap-fill' : 'bi bi-list-ul';
      toggleInventoryViewText.textContent = inventoryViewMode === 'grid' ? 'Cuadrícula' : 'Lista';
    });
    // Sincronizar botón al cargar
    if (inventoryViewMode === 'grid') {
      toggleInventoryViewBtn.querySelector('i').className = 'bi bi-grid-3x3-gap-fill';
      toggleInventoryViewText.textContent = 'Cuadrícula';
    } else {
      toggleInventoryViewBtn.querySelector('i').className = 'bi bi-list-ul';
      toggleInventoryViewText.textContent = 'Lista';
    }
  }

  // Alternar vista clientes
  const toggleClientsViewBtn = document.getElementById('toggleClientsView');
  const toggleClientsViewText = document.getElementById('toggleClientsViewText');
  if (toggleClientsViewBtn && toggleClientsViewText) {
    toggleClientsViewBtn.addEventListener('click', () => {
      clientsViewMode = clientsViewMode === 'grid' ? 'list' : 'grid';
      localStorage.setItem('clientsViewMode', clientsViewMode);
      renderClients();
      toggleClientsViewBtn.querySelector('i').className = clientsViewMode === 'grid' ? 'bi bi-grid-3x3-gap-fill' : 'bi bi-list-ul';
      toggleClientsViewText.textContent = clientsViewMode === 'grid' ? 'Cuadrícula' : 'Lista';
    });
    if (clientsViewMode === 'grid') {
      toggleClientsViewBtn.querySelector('i').className = 'bi bi-grid-3x3-gap-fill';
      toggleClientsViewText.textContent = 'Cuadrícula';
    } else {
      toggleClientsViewBtn.querySelector('i').className = 'bi bi-list-ul';
      toggleClientsViewText.textContent = 'Lista';
    }
  }

  // Sidebar
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }







  // Filtros de balance
  document.querySelectorAll('input[name="periodFilter"]').forEach(radio => {
    radio.addEventListener('change', () => {
      renderBalanceGrid();
      showAdvancedStats(); // Actualizar estadísticas avanzadas cuando cambie el período
    });
  });

  // === Inicialización del sidebar ===
  // Cargar tema guardado (predeterminado: claro)
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
  
  // Cerrar sidebar con Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeSidebar();
    }
  });

  // === Inicialización PWA ===
  installButton = document.getElementById('installPWA');
  
  // Mostrar solo si hay deferredPrompt y no está instalada ni rechazada
  if (isAppInstalled() || hasUserRejectedInstallation() || !window.deferredPrompt) {
    installButton.style.display = 'none';
  } else {
    installButton.style.display = 'flex';
    installButton.classList.add('animate');
  }

  // Evento beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("App puede instalarse. Ejecuta deferredPrompt.prompt() para instalar.");
    
    // Solo mostrar botón si NO está instalada y hay un prompt disponible
    if (!isAppInstalled() && deferredPrompt) {
      setTimeout(() => {
        showInstallButton();
      }, 3000);
    }
  });

  // Evento appinstalled
  window.addEventListener('appinstalled', (evt) => {
    console.log('App instalada');
    installButton.style.display = 'none';
    Swal.fire({
      icon: 'success',
      title: '¡Instalación completada!',
      text: 'TillUp POS está ahora instalado en tu dispositivo.',
      timer: 3000,
      showConfirmButton: false
    });
  });

  // === Detección de actualizaciones del Service Worker ===
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('Service Worker actualizado:', event.data.cacheName);
        
        // Mostrar notificación de actualización
        Swal.fire({
          icon: 'info',
          title: '¡Nueva versión disponible!',
          text: 'Se han descargado mejoras. Recarga la página para aplicar los cambios.',
          showCancelButton: true,
          confirmButtonText: 'Recargar ahora',
          cancelButtonText: 'Más tarde',
          timer: 15000,
          timerProgressBar: true
        }).then((result) => {
          if (result.isConfirmed) {
            // Recargar la página para aplicar actualizaciones
            window.location.reload();
          }
        });
      }
    });

    // Verificar actualizaciones periódicamente
    setInterval(() => {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.update();
        }
      });
    }, 60000); // Verificar cada minuto
  }

  // Captura de ubicación en formulario de cliente
  const btnGetLocation = document.getElementById('btnGetLocation');
  const locationInput = document.getElementById('clientLocation');
  const locationStatus = document.getElementById('locationStatus');
  if (btnGetLocation && locationInput && locationStatus) {
    btnGetLocation.addEventListener('click', () => {
      if (!navigator.geolocation) {
        locationStatus.textContent = 'La geolocalización no es soportada por tu navegador.';
        return;
      }
      locationStatus.textContent = 'Obteniendo ubicación...';
      btnGetLocation.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude},${position.coords.longitude}`;
          locationInput.value = coords;
          locationStatus.textContent = `Ubicación capturada: ${coords}`;
          btnGetLocation.disabled = false;
        },
        (error) => {
          locationStatus.textContent = 'No se pudo obtener la ubicación.';
          btnGetLocation.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // Inicializar datos de pollos
  initializeChickenData();
});

// === Agregar producto con vista previa de imagen ===
function addProduct(e) {
  e.preventDefault();
  const name = document.getElementById('productName').value.trim();
  const cost = parseFloat(document.getElementById('productCost').value);
  const price = parseFloat(document.getElementById('productPrice').value);
  const category = document.getElementById('productCategory').value.trim();
  const stock = parseInt(document.getElementById('productStock').value) || 0;
  const imageInput = document.getElementById('productImageInput');

  if (!name || isNaN(cost) || isNaN(price)) {
    Swal.fire({
      icon: 'error',
      title: 'Datos incompletos',
      text: 'Por favor completa todos los campos obligatorios.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  if (cost < 0 || price < 0) {
    Swal.fire({
      icon: 'error',
      title: 'Valores inválidos',
      text: 'El costo y precio deben ser valores positivos.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  if (price < cost) {
    Swal.fire({
      icon: 'warning',
      title: 'Precio bajo',
      text: 'El precio de venta es menor al costo. ¿Estás seguro?',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Revisar'
    }).then((result) => {
      if (!result.isConfirmed) return;
      saveProduct();
    });
    return;
  }

  saveProduct();

  function saveProduct() {
    const saveProductImage = (imageData) => {
      if (window.editingProductId) {
        // Editar producto existente
        const productIndex = products.findIndex(p => p.id === window.editingProductId);
        if (productIndex !== -1) {
          products[productIndex] = {
            ...products[productIndex],
            name,
            cost,
            price,
            category,
            stock,
            image: imageData || products[productIndex].image
          };
          
          saveToStorage('products', products);
          renderInventory();
          renderSalesProducts();
          
          // Limpiar formulario y estado de edición
          document.getElementById('formProduct').reset();
          document.getElementById('imagePreview').innerHTML = '';
          window.editingProductId = null;
          
          // Cerrar modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('modalProduct'));
          modal.hide();
          
          // Restaurar texto del botón
          const submitBtn = document.querySelector('#modalProduct .btn-primary');
          submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Agregar Producto';
          
          Swal.fire({
            icon: 'success',
            title: 'Producto actualizado',
            text: 'Producto actualizado correctamente.',
            confirmButtonText: 'Aceptar'
          });
        }
      } else {
        // Agregar nuevo producto
        const newProduct = {
          id: generateId('product'),
          name,
          cost,
          price,
          category,
          stock,
          image: imageData
        };
        
        products.push(newProduct);
        saveToStorage('products', products);
        renderInventory();
        renderSalesProducts();
        
        // Limpiar formulario
        document.getElementById('formProduct').reset();
        document.getElementById('imagePreview').innerHTML = '';
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalProduct'));
        modal.hide();
        
        Swal.fire({
          icon: 'success',
          title: 'Producto agregado',
          text: 'Producto agregado correctamente.',
          confirmButtonText: 'Aceptar'
        });
      }
    };

    if (imageInput && imageInput.files && imageInput.files[0]) {
      const reader = new FileReader();
      reader.onload = () => saveProductImage(reader.result);
      reader.readAsDataURL(imageInput.files[0]);
    } else {
      saveProductImage('');
    }
  }
}

// Vista previa de imagen para productos
const productPhotoInput = document.getElementById('productImageInput');
if (productPhotoInput) {
  productPhotoInput.addEventListener('change', function(e) {
    const preview = document.getElementById('productImagePreview');
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa">`;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = '';
    }
  });
}

// Vista previa de imagen para clientes
const clientPhotoInput = document.getElementById('clientPhotoInput');
if (clientPhotoInput) {
  clientPhotoInput.addEventListener('change', function(e) {
    const preview = document.getElementById('clientImagePreview');
    if (!preview) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa">`;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = '';
    }
  });
}

// === Mostrar productos en Inventario y Venta ===
// Renderizar inventario con diseño tipo Treinta.co
function renderInventory() {
  const container = document.getElementById('inventoryList');
  const isGridView = localStorage.getItem('inventoryView') !== 'list';
  
  if (isGridView) {
    container.className = 'row gy-3';
    container.innerHTML = products.map(product => `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="product-card-treinta" onclick="showProductDetailModal('${product.id}')">
          <img src="${product.image || 'icons/descarga.png'}" alt="${product.name}" onerror="this.src='icons/descarga.png'">
          <h5>${product.name}</h5>
          <div class="product-category">${product.category || '-'}</div>
          <div class="product-price">$${product.price.toFixed(2)}</div>
          <div class="product-cost">Costo: $${product.cost.toFixed(2)}</div>
          <div class="mt-2">
            <span class="badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}">
              ${product.stock > 0 ? 'Stock: ' + product.stock : 'Sin stock'}
            </span>
          </div>
        </div>
      </div>
    `).join('');
  } else {
    container.className = 'list-group';
    container.innerHTML = products.map(product => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          <img src="${product.image || 'icons/descarga.png'}" alt="${product.name}" 
               style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; margin-right: 1rem;" 
               onerror="this.src='icons/descarga.png'">
          <div>
            <h6 class="mb-0">${product.name}</h6>
            <small class="text-muted">${product.category || '-'}</small>
          </div>
        </div>
        <div class="text-end">
          <div class="fw-bold">$${product.price.toFixed(2)}</div>
          <small class="text-muted">Stock: ${product.stock}</small>
        </div>
        <div class="ms-3">
          <button class="btn btn-sm btn-outline-primary" onclick="showProductDetailModal('${product.id}')">
            <i class="bi bi-eye"></i>
          </button>
        </div>
      </li>
    `).join('');
  }
}

// === Agregar producto al carrito ===
function addToCart(productId) {
  const product = products.find(p => p.id == productId);
  if (!product) return;

  // Verificar stock
  if (product.stock <= 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Sin stock',
      text: 'Este producto no tiene stock disponible.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  // Si hay un cliente seleccionado, guardar proforma
  if (currentClientId) {
    saveProforma(currentClientId, cart);
  }
  
  renderCart();
  
  // Mostrar notificación de producto agregado mejorada
  const toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });
  
  toast.fire({
    icon: 'success',
    title: `${product.name} agregado al carrito`
  });
}

// === Mostrar carrito con diseño tipo Treinta.co mejorado ===
function renderCart() {
  const container = document.getElementById('cartList');
  const totalElement = document.getElementById('cartTotal');
  const finalizeBtn = document.getElementById('finalizeBtn');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const clientSelectorContainer = document.getElementById('clientSelectorContainer');
  
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-cart-x" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
        <h6 class="text-muted">Carrito vacío</h6>
        <p class="text-muted small">Selecciona productos para comenzar</p>
      </div>
    `;
    totalElement.textContent = '$0.00';
    finalizeBtn.disabled = true;
    clearCartBtn.style.display = 'none';
    if (clientSelectorContainer) clientSelectorContainer.style.display = 'none';
    return;
  }

  clearCartBtn.style.display = 'block';
  if (clientSelectorContainer) clientSelectorContainer.style.display = 'block';

  // Agregar selector de cliente compacto al inicio del carrito
  let clientSelectorHTML = '';
  if (clients.length > 0) {
    const selectedClient = clients.find(c => c.id === currentClientId);
    const clientFirstName = selectedClient ? selectedClient.name.split(' ')[0] : '';
    
    clientSelectorHTML = `
      <div class="client-selector-treinta mb-3">
        ${selectedClient ? `
          <div class="selected-client-display">
            <div class="d-flex align-items-center">
              <i class="bi bi-person-circle me-2"></i>
              <span class="client-name-display">${clientFirstName}</span>
              ${selectedClient.debt > 0 ? `<span class="badge bg-warning ms-2">Deuda: $${selectedClient.debt.toFixed(2)}</span>` : ''}
            </div>
            <button class="btn btn-sm btn-outline-danger remove-client-btn" onclick="removeSelectedClient()" title="Eliminar cliente">
              <i class="bi bi-x"></i>
            </button>
          </div>
        ` : `
          <select id="cartClientSelector" class="form-select form-select-treinta" onchange="selectClientForCart(this.value)">
            <option value="">Selecciona un cliente</option>
            ${clients.map(client => `
              <option value="${client.id}">
                ${client.name.split(' ')[0]}${client.debt > 0 ? ` (Deuda: $${client.debt.toFixed(2)})` : ''}
              </option>
            `).join('')}
          </select>
        `}
      </div>
    `;
  } else {
    clientSelectorHTML = `
      <div class="client-selector-treinta mb-3">
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> No hay clientes registrados
          <button class="btn btn-primary btn-sm ms-2" onclick="showAddClientModal()">
            <i class="bi bi-person-plus"></i> Agregar Cliente
          </button>
        </div>
      </div>
    `;
  }

  container.innerHTML = clientSelectorHTML + cart.map(item => `
    <div class="cart-item-treinta">
      <div class="cart-item-header-treinta">
        <div class="cart-item-qty-treinta">
          <button class="btn btn-sm btn-outline-secondary qty-btn" onclick="changeCartQty('${item.id}', -1)" ${item.qty <= 1 ? 'disabled' : ''}>
            <i class="bi bi-dash"></i>
          </button>
          <span class="qty-display">${item.qty}</span>
          <button class="btn btn-sm btn-outline-secondary qty-btn" onclick="changeCartQty('${item.id}', 1)">
            <i class="bi bi-plus"></i>
          </button>
        </div>
        <div class="cart-item-info-treinta">
          <div class="cart-item-name-treinta">${item.name}</div>
          <div class="cart-item-category-treinta">${item.category || 'Sin categoría'}</div>
          <div class="cart-item-price-treinta">$${item.price.toFixed(2)} c/u</div>
        </div>
        <div class="cart-item-actions-treinta">
          <div class="cart-item-total-treinta">$${(item.price * item.qty).toFixed(2)}</div>
          <button class="btn btn-sm btn-outline-danger remove-btn" onclick="removeFromCart('${item.id}')" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  totalElement.textContent = `$${total.toFixed(2)}`;
  finalizeBtn.disabled = !currentClientId;
}

function changeCartQty(productId, delta) {
  const idx = cart.findIndex(item => item.id === productId);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty < 1) cart[idx].qty = 1;
  saveProforma(currentClientId, cart);
  renderCart();
}

// === Vaciar carrito ===
function clearCart() {
  if (!currentClientId) return;
  cart = [];
  saveProforma(currentClientId, []);
  renderCart();
}

// === Finalizar venta con comprobante tipo Treinta.co ===
function finalizeSale() {
  if (!currentClientId || cart.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Faltan datos',
      text: 'Selecciona cliente y agrega productos.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cost = cart.reduce((sum, item) => sum + (item.cost * item.qty), 0);
  const profit = total - cost;
  const client = clients.find(c => c.id === currentClientId);
  const fecha = new Date().toLocaleString();

  // Mostrar opciones de pago
  Swal.fire({
    title: 'Finalizar Venta',
    html: `
      <div class="sale-summary-treinta">
        <div class="sale-client-info">
          <i class="bi bi-person-circle"></i>
          <strong>Cliente:</strong> ${client.name}
        </div>
        <div class="sale-total-info">
          <div class="sale-items-count">
            <i class="bi bi-box-seam"></i> ${cart.length} productos
          </div>
          <div class="sale-total-amount">
            <strong>Total: $${total.toFixed(2)}</strong>
          </div>
        </div>
        <div class="sale-payment-options">
          <div class="form-check">
            <input class="form-check-input" type="radio" name="paymentType" id="paymentCash" value="cash" checked>
            <label class="form-check-label" for="paymentCash">
              <i class="bi bi-cash-coin"></i> Efectivo
            </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="paymentType" id="paymentCard" value="card">
            <label class="form-check-label" for="paymentCard">
              <i class="bi bi-credit-card"></i> Tarjeta
            </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="paymentType" id="paymentTransfer" value="transfer">
            <label class="form-check-label" for="paymentTransfer">
              <i class="bi bi-bank"></i> Transferencia
            </label>
          </div>
        </div>
        <div class="sale-discount-section">
          <label class="form-label">Descuento (opcional):</label>
          <div class="input-group">
            <input type="number" id="saleDiscount" class="form-control" placeholder="0.00" min="0" max="${total}" step="0.01">
            <span class="input-group-text">$</span>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Completar Venta',
    cancelButtonText: 'Cancelar',
    showDenyButton: true,
    denyButtonText: 'Venta a Crédito',
    reverseButtons: true,
    customClass: { 
      popup: 'swal2-sale-treinta',
      confirmButton: 'btn btn-success',
      denyButton: 'btn btn-warning',
      cancelButton: 'btn btn-secondary'
    },
    preConfirm: () => {
      const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
      const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
      
      if (discount > total) {
        Swal.showValidationMessage('El descuento no puede ser mayor al total');
        return false;
      }
      
      return { discount, paymentType };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // Venta pagada
      const { discount, paymentType } = result.value;
      const finalTotal = total - discount;
      
      // Actualizar stock
      cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          product.stock -= item.qty;
          if (product.stock < 0) product.stock = 0;
        }
      });
      
      // Registrar venta
      const sale = {
        id: generateId('sale'),
        clientId: client.id,
        clientName: client.name,
        items: cart,
        total: finalTotal,
        originalTotal: total,
        discount: discount,
        cost,
        profit: finalTotal - cost,
        paymentType,
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString()
      };
      
      sales.push(sale);
      saveToStorage('sales', sales);
      saveToStorage('products', products);
      
      // Limpiar carrito
      clearCart();
      
      // Actualizar balance
      updateBalanceUI();
      
      // Mostrar comprobante
      showReceipt(sale);
      
    } else if (result.isDenied) {
      // Venta a crédito
      showCreditSaleModal(total, cost, client);
    }
  });
}

// Función para mostrar modal de venta a crédito
function showCreditSaleModal(total, cost, client) {
  Swal.fire({
    title: 'Venta a Crédito',
    html: `
      <div class="credit-sale-treinta">
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle"></i>
          <strong>Venta a Crédito</strong><br>
          Cliente: ${client.name}<br>
          Total: $${total.toFixed(2)}
        </div>
        <div class="form-group">
          <label class="form-label">Motivo del crédito:</label>
          <input type="text" id="creditReason" class="form-control" placeholder="Ej: Pago en cuotas" value="Venta a crédito">
        </div>
        <div class="form-group">
          <label class="form-label">Abono inicial (opcional):</label>
          <div class="input-group">
            <span class="input-group-text">$</span>
            <input type="number" id="creditAbono" class="form-control" placeholder="0.00" min="0" max="${total}" step="0.01">
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Registrar Crédito',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const reason = document.getElementById('creditReason').value;
      const abono = parseFloat(document.getElementById('creditAbono').value) || 0;
      
      if (!reason.trim()) {
        Swal.showValidationMessage('Debe especificar un motivo');
        return false;
      }
      
      if (abono > total) {
        Swal.showValidationMessage('El abono no puede ser mayor al total');
        return false;
      }
      
      return { reason, abono };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const { reason, abono } = result.value;
      const remainingAmount = total - abono;
      
      // Actualizar stock
      cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          product.stock -= item.qty;
          if (product.stock < 0) product.stock = 0;
        }
      });
      
      // Registrar venta
      const sale = {
        id: generateId('sale'),
        clientId: client.id,
        clientName: client.name,
        items: cart,
        total: total,
        cost,
        profit: total - cost,
        paymentType: 'credit',
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString()
      };
      
      sales.push(sale);
      saveToStorage('sales', sales);
      saveToStorage('products', products);
      
      // Registrar deuda
      if (remainingAmount > 0) {
        const debt = {
          id: generateId('debt'),
          clientId: client.id,
          clientName: client.name,
          amount: remainingAmount,
          total: total,
          abono: abono,
          reason: reason,
          date: new Date().toISOString(),
          saleId: sale.id
        };
        
        debts.push(debt);
        saveToStorage('debts', debts);
        
        // Actualizar deuda del cliente
        client.debt = (client.debt || 0) + remainingAmount;
        saveToStorage('clients', clients);
      }
      
      // Limpiar carrito
      clearCart();
      
      // Mostrar confirmación
      Swal.fire({
        icon: 'success',
        title: 'Venta a crédito registrada',
        text: `Deuda registrada: $${remainingAmount.toFixed(2)}`,
        confirmButtonText: 'Aceptar'
      });
      
      // Actualizar vistas
      renderClients();
      renderDebts();
      updateBalanceUI();
    }
  });
}

// Función para mostrar comprobante
function showReceipt(sale) {
  const fecha = new Date().toLocaleString();
  
  let detalle = `
    <div class="receipt-treinta">
      <div class="receipt-header">
        <div class="receipt-logo">
          <img src="TillUp.png" alt="TillUp" style="width: 60px; height: 60px; object-fit: contain;">
          <h3>TillUp POS</h3>
        </div>
        <div class="receipt-info">
          <div class="receipt-title">COMPROBANTE DE VENTA</div>
          <div class="receipt-number">#${sale.id}</div>
          <div class="receipt-date">${fecha}</div>
        </div>
      </div>
      
      <div class="receipt-client">
        <i class="bi bi-person-circle"></i>
        <span><strong>Cliente:</strong> ${sale.clientName}</span>
      </div>
      
      <div class="receipt-items">
        <div class="receipt-items-header">
          <span>Producto</span>
          <span>Cant.</span>
          <span>Precio</span>
          <span>Subtotal</span>
        </div>
        ${sale.items.map(item => `
          <div class="receipt-item">
            <span class="item-name">${item.name}</span>
            <span class="item-qty">${item.qty}</span>
            <span class="item-price">$${item.price.toFixed(2)}</span>
            <span class="item-subtotal">$${(item.price * item.qty).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="receipt-total">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>$${sale.originalTotal.toFixed(2)}</span>
        </div>
        ${sale.discount > 0 ? `
          <div class="total-line discount">
            <span>Descuento:</span>
            <span>-$${sale.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="total-line final">
          <span>Total:</span>
          <span class="total-amount">$${sale.total.toFixed(2)}</span>
        </div>
        <div class="payment-type">
          <i class="bi bi-${getPaymentIcon(sale.paymentType)}"></i>
          ${getPaymentText(sale.paymentType)}
        </div>
      </div>
      
      <div class="receipt-footer">
        <div class="footer-message">
          <i class="bi bi-heart"></i>
          <span>¡Gracias por su compra!</span>
        </div>
        <div class="footer-brand">
          <span>Generado por TillUp POS</span>
          <small>Diseño inspirado en Treinta.co</small>
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    title: '',
    html: detalle,
    showConfirmButton: true,
    confirmButtonText: '<i class="bi bi-printer"></i> Imprimir',
    showDenyButton: true,
    denyButtonText: '<i class="bi bi-download"></i> PDF',
    showCancelButton: true,
    cancelButtonText: 'Cerrar',
    customClass: { 
      popup: 'swal2-receipt-treinta'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      printReceipt(sale);
    } else if (result.isDenied) {
      downloadReceiptPDF(sale);
    }
  });
}

// Funciones auxiliares para el comprobante
function getPaymentIcon(paymentType) {
  const icons = {
    cash: 'cash-coin',
    card: 'credit-card',
    transfer: 'bank',
    credit: 'clock-history'
  };
  return icons[paymentType] || 'cash-coin';
}

function getPaymentText(paymentType) {
  const texts = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    credit: 'A Crédito'
  };
  return texts[paymentType] || 'Efectivo';
}

// === Agregar/Editar cliente con validación mejorada ===
function addClient(e) {
  e.preventDefault();
  const nameInput = document.getElementById('clientName');
  const phoneInput = document.getElementById('clientPhone');
  const addressInput = document.getElementById('clientAddress');
  const photoInput = document.getElementById('clientPhotoInput');
  const locationInput = document.getElementById('clientLocation');
  const locationStatus = document.getElementById('locationStatus');
  if (!nameInput || !phoneInput || !addressInput) {
    Swal.fire({ icon: 'error', title: 'Error de formulario', text: 'Faltan campos obligatorios en el formulario.', confirmButtonText: 'Aceptar' });
    return;
  }
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();
  const photo = photoInput.files && photoInput.files[0] ? photoInput.files[0] : null;
  const location = locationInput.value.trim();
  if (location) {
    locationStatus.textContent = 'Ubicación válida';
  } else {
    locationStatus.textContent = 'Ubicación no válida';
  }

  if (!name) {
    Swal.fire({
      icon: 'error',
      title: 'Nombre requerido',
      text: 'El nombre del cliente es obligatorio.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  // Validar formato de teléfono si se proporciona
  if (phone && !/^[0-9]{7,15}$/.test(phone)) {
    Swal.fire({
      icon: 'error',
      title: 'Teléfono inválido',
      text: 'El número de teléfono debe tener entre 7 y 15 dígitos.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const saveClient = (photo) => {
    if (window.editingClientId) {
      // Editar cliente existente
      const clientIndex = clients.findIndex(c => c.id === window.editingClientId);
      if (clientIndex !== -1) {
        clients[clientIndex] = {
          ...clients[clientIndex],
          name,
          phone,
          address,
          photo: photo || clients[clientIndex].photo
        };
      }
      delete window.editingClientId;
    } else {
      // Agregar nuevo cliente
      clients.push({
        id: generateId('client'),
        name,
        phone,
        address,
        photo,
        debt: 0
      });
    }

    // Calcular deuda total por cliente
    clients.forEach(client => {
      const clientDebts = debts.filter(d => d.clientId === client.id);
      client.debt = clientDebts.reduce((sum, d) => sum + d.amount, 0);
    });

    saveToStorage('clients', clients);
    renderClients();
    updateClientSelector();
    
    // Limpiar formulario
    if (document.getElementById('formClient')) document.getElementById('formClient').reset();
    if (document.getElementById('clientImagePreview')) document.getElementById('clientImagePreview').innerHTML = '';
    if (locationStatus) locationStatus.textContent = '';
    
    // Restaurar texto del botón
    const submitBtn = document.querySelector('#modalClient .btn-primary');
    submitBtn.innerHTML = '<i class="bi bi-person-plus"></i> Agregar Cliente';
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalClient'));
    modal.hide();
    
    Swal.fire({ 
      icon: 'success', 
      title: window.editingClientId ? 'Cliente actualizado' : 'Cliente agregado', 
      text: window.editingClientId ? 'Cliente actualizado correctamente.' : 'Cliente agregado correctamente.',
      confirmButtonText: 'Aceptar'
    });
  };

  if (photoInput && photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => saveClient(reader.result);
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    saveClient('');
  }
}

// Renderizar clientes con diseño tipo Treinta.co
function renderClients() {
  const container = document.getElementById('clientList');
  const isGridView = localStorage.getItem('clientsView') !== 'list';
  
  if (isGridView) {
    container.className = 'row gy-3';
    container.innerHTML = clients.map(client => `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="client-card-treinta" onclick="showClientDetails('${client.id}')">
          ${client.photo ? 
            `<img src="${client.photo}" alt="${client.name}" class="client-photo" onerror="this.parentElement.querySelector('.client-avatar').style.display='flex'; this.style.display='none';">` :
            `<div class="client-avatar">${client.name.charAt(0).toUpperCase()}</div>`
          }
          <div class="client-name">${client.name}</div>
          <div class="client-info">${client.phone || 'Sin teléfono'}</div>
          <div class="client-info">${client.address || 'Sin dirección'}</div>
          ${client.location ? `
            <div class="client-location">
              <a href="https://maps.google.com/?q=${client.location}" target="_blank" onclick="event.stopPropagation();" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-geo-alt-fill"></i> Ver ubicación
              </a>
            </div>
          ` : ''}
          <div class="mt-2">
            <span class="badge ${client.debt > 0 ? 'bg-warning' : 'bg-success'}">
              ${client.debt > 0 ? `Deuda: $${client.debt.toFixed(2)}` : 'Sin deuda'}
            </span>
          </div>
        </div>
      </div>
    `).join('');
  } else {
    container.className = 'list-group';
    container.innerHTML = clients.map(client => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          ${client.photo ? 
            `<img src="${client.photo}" alt="${client.name}" class="client-photo" style="margin: 0 1rem 0 0;" onerror="this.parentElement.querySelector('.client-avatar').style.display='flex'; this.style.display='none';">` :
            `<div class="client-avatar" style="margin: 0 1rem 0 0;">${client.name.charAt(0).toUpperCase()}</div>`
          }
          <div>
            <h6 class="mb-0">${client.name}</h6>
            <small class="text-muted">${client.phone || 'Sin teléfono'}</small>
          </div>
        </div>
        <div class="text-end">
          <div class="fw-bold">${client.debt > 0 ? `$${client.debt.toFixed(2)}` : 'Sin deuda'}</div>
          <small class="text-muted">${client.address || 'Sin dirección'}</small>
        </div>
        <div class="ms-3 d-flex gap-1">
          ${client.location ? `
            <a href="https://maps.google.com/?q=${client.location}" target="_blank" class="btn btn-sm btn-outline-primary">
              <i class="bi bi-geo-alt-fill"></i>
            </a>
          ` : ''}
          <button class="btn btn-sm btn-outline-primary" onclick="showClientDetails('${client.id}')">
            <i class="bi bi-eye"></i>
          </button>
        </div>
      </li>
    `).join('');
  }
}

// === Selector de cliente en ventas ===
function updateClientSelector() {
  const selector = document.getElementById('cartClientSelector');
  if (!selector) return; // Evitar error si no existe
  
  // Limpiar opciones existentes
  selector.innerHTML = `<option value="">Seleccionar cliente...</option>`;

  clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.innerText = `${c.name}${c.debt > 0 ? ` (Deuda: $${c.debt.toFixed(2)})` : ''}`;
    selector.appendChild(opt);
  });
}

// === Mostrar deudas con diseño tipo Treinta.co ===
function renderDebts() {
  const list = document.getElementById('debtList');
  list.innerHTML = '';

  if (debts.length === 0) {
    list.innerHTML = `<div class='alert alert-secondary text-center'>Sin deudas registradas</div>`;
    return;
  }

  list.className = 'row gy-3';
  list.innerHTML = debts.map(debt => {
    let status = 'unpaid', statusText = 'Pendiente', statusClass = 'bg-warning';
    if (debt.amount === 0) { 
      status = 'paid'; 
      statusText = 'Pagada'; 
      statusClass = 'bg-success';
    } else if (debt.abono && debt.abono > 0) { 
      status = 'partial'; 
      statusText = 'Abonada'; 
      statusClass = 'bg-info';
    }
    
    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="debt-card-treinta ${status}" onclick="showDebtDetailModal('${debt.id}')">
          <div class="debt-header">
            <div class="debt-client">${debt.clientName}</div>
            <div class="debt-date">${debt.date}</div>
          </div>
          <div class="debt-body">
            <div class="debt-amount">$${(debt.total || debt.amount + (debt.abono || 0)).toFixed(2)}</div>
            ${debt.abono ? `<div class="debt-abono">Abonado: $${debt.abono.toFixed(2)}</div>` : ''}
            <div class="debt-saldo">Saldo: $${debt.amount.toFixed(2)}</div>
          </div>
          <div class="debt-footer">
            <span class="badge ${statusClass}">${statusText}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function showDebtDetailModal(debtId) {
  const d = debts.find(debt => debt.id === debtId);
  if (!d) return;
  let html = `<div style='max-width:340px;margin:auto;background:#fff;border-radius:10px;padding:1.2rem 1rem 1rem 1rem;box-shadow:0 2px 12px #0001;font-family:monospace;'>`;
  html += `<div style='text-align:center;font-weight:bold;font-size:1.1rem;letter-spacing:1px;'>TillUp POS</div>`;
  html += `<div style='text-align:center;font-size:0.95rem;color:#888;margin-bottom:0.5rem;'>${d.date}</div>`;
  html += `<hr style='margin:0.5rem 0;border-top:1.5px dashed #bbb;' />`;
  html += `<div style='font-size:0.98rem;'><strong>Cliente:</strong> ${d.clientName}</div>`;
  html += `<div class='mb-2'><strong>Monto original:</strong> ${formatCurrency(d.total || d.amount + (d.abono || 0))}</div>`;
  if (d.abono) html += `<div class='mb-2'><strong>Abonado:</strong> ${formatCurrency(d.abono)}</div>`;
  html += `<div class='mb-2'><strong>Saldo:</strong> <span class='text-danger'>${formatCurrency(d.amount)}</span></div>`;
  html += `<hr style='margin:0.5rem 0;border-top:1.5px dashed #bbb;' />`;
  html += `<div class='mb-2'><strong>Motivo:</strong> ${d.reason || '-'}</div>`;
  html += `</div>`;

  let showAbonar = d.amount > 0;
  let showPagar = d.amount > 0;

  Swal.fire({
    title: '',
    html: html,
    showCancelButton: true,
    showConfirmButton: showPagar,
    confirmButtonText: 'Pagar todo',
    showDenyButton: showAbonar,
    denyButtonText: 'Abonar',
    cancelButtonText: 'Cerrar',
    customClass: { popup: 'swal2-pos-ticket' }
  }).then(result => {
    if (result.isConfirmed) {
      // Pagar todo
      d.abono = (d.abono || 0) + d.amount;
      d.amount = 0;
      saveToStorage('debts', debts);
      renderDebts();
      Swal.fire({ icon: 'success', title: 'Deuda pagada', text: 'La deuda ha sido pagada en su totalidad.' });
    } else if (result.isDenied) {
      // Abonar
      Swal.fire({
        title: 'Abonar a deuda',
        html: `<div class='mb-2'>¿Cuánto desea abonar?</div><input id='abonoInput' type='number' min='1' max='${d.amount}' class='form-control' placeholder='Abono' />`,
        inputAttributes: { min: 1, max: d.amount },
        showCancelButton: true,
        confirmButtonText: 'Abonar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const abono = parseFloat(document.getElementById('abonoInput').value) || 0;
          if (abono < 1 || abono > d.amount) {
            Swal.showValidationMessage('El abono debe ser entre 1 y el saldo');
            return false;
          }
          return abono;
        }
      }).then((abonoResult) => {
        if (abonoResult.isConfirmed) {
          const abono = abonoResult.value;
          d.abono = (d.abono || 0) + abono;
          d.amount -= abono;
          if (d.amount < 0) d.amount = 0;
          saveToStorage('debts', debts);
          renderDebts();
          Swal.fire({ icon: 'success', title: 'Abono registrado', text: `Abono registrado: ${formatCurrency(abono)}` });
        }
      });
    }
  });
}

// === Mostrar resumen de balance ===
function updateBalanceUI() {
  // Ya no se actualizan los elementos antiguos, solo se renderiza el grid
  renderBalanceGrid();
  
  // Actualizar estadísticas avanzadas si estamos en la vista de balance
  const balanceView = document.getElementById('view-balance');
  if (balanceView && !balanceView.classList.contains('d-none')) {
    showAdvancedStats();
  }
}

// === Instalar como PWA ===
let deferredPrompt;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;

  // Aquí podrías mostrar un botón para instalar manualmente
  console.log("App puede instalarse. Ejecuta deferredPrompt.prompt() para instalar.");
});

// === Detectar modo oscuro del sistema ===
function detectDarkMode() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
}

// Escuchar cambios en el sistema
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectDarkMode);

// Ejecutar al iniciar
detectDarkMode();

// === Registrar Service Worker ===
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => console.log("SW registrado:", reg.scope))
    .catch(err => console.error("SW error:", err));
}

// Modal de detalles de producto
function showProductDetailModal(productId) {
  const p = products.find(prod => prod.id === productId);
  if (!p) return;
  let html = `
    <div class="text-center mb-3">
      ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;" />` : ''}
    </div>
    <h4 class="mb-2">${p.name}</h4>
    <p><strong>Categoría:</strong> ${p.category || '-'}</p>
    <p><strong>Costo:</strong> ${formatCurrency(p.cost)}</p>
    <p><strong>Precio:</strong> ${formatCurrency(p.price)}</p>
    <div class="d-flex justify-content-end gap-2 mt-4">
      <button class="btn btn-outline-danger" onclick="deleteProduct('${p.id}')"><i class="bi bi-trash"></i> Eliminar</button>
      <button class="btn btn-outline-primary" onclick="editProduct('${p.id}')"><i class="bi bi-pencil"></i> Editar</button>
    </div>
  `;
  Swal.fire({
    title: 'Detalles del producto',
    html,
    showConfirmButton: false,
    showCloseButton: true,
    width: 400
  });
}

// Funciones de editar/eliminar producto (solo placeholders por ahora)
function deleteProduct(productId) {
  Swal.close();
  Swal.fire({
    icon: 'warning',
    title: '¿Eliminar producto?',
    text: 'Esta acción no se puede deshacer.',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then(result => {
    if (result.isConfirmed) {
      products = products.filter(p => p.id !== productId);
      saveToStorage('products', products);
      renderInventory();
      Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Producto eliminado.' });
    }
  });
}

function editProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  // Llenar el formulario con los datos del producto
  const nameInput = document.getElementById('productName');
  const costInput = document.getElementById('productCost');
  const priceInput = document.getElementById('productPrice');
  const categoryInput = document.getElementById('productCategory');
  const stockInput = document.getElementById('productStock');
  const preview = document.getElementById('productImagePreview');
  
  if (nameInput) nameInput.value = product.name;
  if (costInput) costInput.value = product.cost;
  if (priceInput) priceInput.value = product.price;
  if (categoryInput) categoryInput.value = product.category || '';
  if (stockInput) stockInput.value = product.stock || 0;
  if (preview) {
    if (product.image) {
      preview.innerHTML = `<img src="${product.image}" alt="Imagen actual">`;
    } else {
      preview.innerHTML = '';
    }
  }
  
  // Guardar el ID del producto a editar
  window.editingProductId = productId;
  
  // Cambiar el texto del botón
  const submitBtn = document.querySelector('#modalProduct .btn-primary');
  submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Actualizar Producto';
  
  // Mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById('modalProduct'));
  modal.show();
}

// Renderizar productos en ventas con diseño tipo Treinta.co mejorado
function renderSalesProducts() {
  const container = document.getElementById('salesProductsGrid');
  const productsCount = document.getElementById('productsCount');
  if (!container) return;
  
  // Filtrar productos por búsqueda
  const searchTerm = document.getElementById('productSearch')?.value?.toLowerCase() || '';
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.category?.toLowerCase().includes(searchTerm)
  );
  
  productsCount.textContent = `${filteredProducts.length} productos`;
  
  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5" style="grid-column: 1 / -1;">
        <i class="bi bi-search" style="font-size: 4rem; color: #ccc; margin-bottom: 1rem;"></i>
        <h5 class="text-muted">No se encontraron productos</h5>
        <p class="text-muted">Intenta con otros términos de búsqueda</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filteredProducts.map(product => `
    <div class="product-card-treinta" onclick="addToCart('${product.id}')">
      <div class="product-image-container">
        <img src="${product.image || 'icons/descarga.png'}" 
             class="product-image-treinta" alt="${product.name}" 
             onerror="this.src='icons/descarga.png'">
        <div class="product-overlay">
          <button class="btn btn-primary btn-sm add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${product.id}')" ${product.stock <= 0 ? 'disabled' : ''}>
            <i class="bi bi-plus"></i> Agregar
          </button>
        </div>
      </div>
      <div class="product-info-treinta">
        <div class="product-name-treinta">${product.name}</div>
        <div class="product-category-treinta">${product.category || 'Sin categoría'}</div>
        <div class="product-price-treinta">$${product.price.toFixed(2)}</div>
        <div class="product-stock-treinta ${product.stock <= 0 ? 'out-of-stock' : ''}">
          <i class="bi bi-box-seam"></i> 
          ${product.stock <= 0 ? 'Sin stock' : `Stock: ${product.stock}`}
        </div>
      </div>
    </div>
  `).join('');
}

// Función para filtrar productos en tiempo real
function filterProductsInSales(searchTerm) {
  const container = document.getElementById('salesProductsGrid');
  const productsCount = document.getElementById('productsCount');
  if (!container) return;
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  productsCount.textContent = `${filteredProducts.length} productos`;
  
  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5" style="grid-column: 1 / -1;">
        <i class="bi bi-search" style="font-size: 4rem; color: #ccc; margin-bottom: 1rem;"></i>
        <h5 class="text-muted">No se encontraron productos</h5>
        <p class="text-muted">Intenta con otros términos de búsqueda</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filteredProducts.map(product => `
    <div class="product-card-treinta" onclick="addToCart('${product.id}')">
      <div class="product-image-container">
        <img src="${product.image || 'icons/descarga.png'}" 
             class="product-image-treinta" alt="${product.name}" 
             onerror="this.src='icons/descarga.png'">
        <div class="product-overlay">
          <button class="btn btn-primary btn-sm add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${product.id}')" ${product.stock <= 0 ? 'disabled' : ''}>
            <i class="bi bi-plus"></i> Agregar
          </button>
        </div>
      </div>
      <div class="product-info-treinta">
        <div class="product-name-treinta">${product.name}</div>
        <div class="product-category-treinta">${product.category || 'Sin categoría'}</div>
        <div class="product-price-treinta">$${product.price.toFixed(2)}</div>
        <div class="product-stock-treinta ${product.stock <= 0 ? 'out-of-stock' : ''}">
          <i class="bi bi-box-seam"></i> 
          ${product.stock <= 0 ? 'Sin stock' : `Stock: ${product.stock}`}
        </div>
      </div>
    </div>
  `).join('');
}

// Cambiar vista de productos en ventas
function toggleSalesView() {
  const currentView = localStorage.getItem('salesView');
  const newView = currentView === 'list' ? 'grid' : 'list';
  localStorage.setItem('salesView', newView);
  
  const toggleBtn = document.getElementById('toggleSalesView');
  const toggleText = document.getElementById('toggleSalesViewText');
  
  if (newView === 'grid') {
    toggleBtn.innerHTML = '<i class="bi bi-list"></i> <span id="toggleSalesViewText">Lista</span>';
  } else {
    toggleBtn.innerHTML = '<i class="bi bi-grid-3x3-gap-fill"></i> <span id="toggleSalesViewText">Cuadrícula</span>';
  }
  
  renderSalesProducts();
}

// Cambiar vista de inventario
function toggleInventoryView() {
  const currentView = localStorage.getItem('inventoryView');
  const newView = currentView === 'list' ? 'grid' : 'list';
  localStorage.setItem('inventoryView', newView);
  
  const toggleBtn = document.getElementById('toggleInventoryView');
  const toggleText = document.getElementById('toggleInventoryViewText');
  
  if (newView === 'grid') {
    toggleBtn.innerHTML = '<i class="bi bi-list"></i> <span id="toggleInventoryViewText">Lista</span>';
  } else {
    toggleBtn.innerHTML = '<i class="bi bi-grid-3x3-gap-fill"></i> <span id="toggleInventoryViewText">Cuadrícula</span>';
  }
  
  renderInventory();
}

// Cambiar vista de clientes
function toggleClientsView() {
  const currentView = localStorage.getItem('clientsView');
  const newView = currentView === 'list' ? 'grid' : 'list';
  localStorage.setItem('clientsView', newView);
  
  const toggleBtn = document.getElementById('toggleClientsView');
  const toggleText = document.getElementById('toggleClientsViewText');
  
  if (newView === 'grid') {
    toggleBtn.innerHTML = '<i class="bi bi-list"></i> <span id="toggleClientsViewText">Lista</span>';
  } else {
    toggleBtn.innerHTML = '<i class="bi bi-grid-3x3-gap-fill"></i> <span id="toggleClientsViewText">Cuadrícula</span>';
  }
  
  renderClients();
}

// Remover producto del carrito
function removeFromCart(productId) {
  const index = cart.findIndex(item => item.id === productId);
  if (index !== -1) {
    cart.splice(index, 1);
    saveProforma(currentClientId, cart);
    renderCart();
  }
}

// === Renderizar balance con diseño tipo Treinta.co ===
function renderBalanceGrid() {
  const currentPeriod = document.querySelector('input[name="periodFilter"]:checked').value;
  const data = calculateBalanceData(currentPeriod);
  const movements = getRecentMovements(currentPeriod);
  
  // Renderizar tarjetas de balance
  const cardsContainer = document.getElementById('balanceCards');
  cardsContainer.innerHTML = `
    <div class="balance-card-treinta income">
      <div class="balance-card-header">
        <div class="balance-card-icon">
          <i class="bi bi-cash-coin"></i>
        </div>
        <h6 class="balance-card-title">Ingresos</h6>
      </div>
      <div class="balance-card-amount">$${data.income.toFixed(2)}</div>
      <div class="balance-card-change positive">
        <i class="bi bi-arrow-up"></i>
        <span>+${((data.income / (data.income + data.expenses)) * 100).toFixed(1)}% del total</span>
      </div>
    </div>
    
    <div class="balance-card-treinta expenses">
      <div class="balance-card-header">
        <div class="balance-card-icon">
          <i class="bi bi-cart-dash"></i>
        </div>
        <h6 class="balance-card-title">Gastos</h6>
      </div>
      <div class="balance-card-amount">$${data.expenses.toFixed(2)}</div>
      <div class="balance-card-change negative">
        <i class="bi bi-arrow-down"></i>
        <span>-${((data.expenses / (data.income + data.expenses)) * 100).toFixed(1)}% del total</span>
      </div>
    </div>
    
    <div class="balance-card-treinta profit">
      <div class="balance-card-header">
        <div class="balance-card-icon">
          <i class="bi bi-graph-up-arrow"></i>
        </div>
        <h6 class="balance-card-title">Utilidad</h6>
      </div>
      <div class="balance-card-amount">$${data.profit.toFixed(2)}</div>
      <div class="balance-card-change ${data.profit >= 0 ? 'positive' : 'negative'}">
        <i class="bi bi-${data.profit >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
        <span>${data.profit >= 0 ? '+' : ''}${((data.profit / data.income) * 100).toFixed(1)}% margen</span>
      </div>
    </div>
    
    <div class="balance-card-treinta credits">
      <div class="balance-card-header">
        <div class="balance-card-icon">
          <i class="bi bi-cash-stack"></i>
        </div>
        <h6 class="balance-card-title">Créditos</h6>
      </div>
      <div class="balance-card-amount">$${debts.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}</div>
      <div class="balance-card-change">
        <i class="bi bi-clock"></i>
        <span>${debts.length} deudas pendientes</span>
      </div>
    </div>
  `;
  
  // Renderizar movimientos
  const movementsContainer = document.getElementById('movementsList');
  const movementsCount = document.getElementById('movementsCount');
  
  movementsCount.textContent = `${movements.length} movimientos`;
  
  if (movements.length === 0) {
    movementsContainer.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">Sin movimientos en este periodo</p>
      </div>
    `;
    return;
  }
  
  movementsContainer.innerHTML = movements.map((movement, idx) => `
    <div class="movement-item-treinta" onclick="showMovementDetail(${idx})" style="cursor:pointer;">
      <div class="movement-icon ${movement.type}">
        <i class="bi ${movement.icon}"></i>
      </div>
      <div class="movement-content">
        <div class="movement-title">${movement.title}</div>
        <div class="movement-subtitle">${movement.subtitle}</div>
      </div>
      <div class="movement-amount ${movement.amountClass}">
        ${movement.amountClass === 'positive' ? '+' : ''}$${movement.amount.toFixed(2)}
      </div>
    </div>
  `).join('');
}

// === Eventos para filtros de periodo ===
document.addEventListener('DOMContentLoaded', function() {
  // Agregar eventos a los filtros de periodo
  document.querySelectorAll('input[name="periodFilter"]').forEach(radio => {
    radio.addEventListener('change', function() {
      renderBalanceGrid();
      
      // Mostrar notificación del cambio
      const periodNames = {
        day: 'Diario',
        week: 'Semanal',
        month: 'Mensual',
        year: 'Anual'
      };
      
      Swal.fire({
        icon: 'info',
        title: `Periodo: ${periodNames[this.value]}`,
        timer: 1000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    });
  });
  
  // Agregar evento de búsqueda de productos
  const productSearch = document.getElementById('productSearch');
  if (productSearch) {
    productSearch.addEventListener('input', function() {
      renderSalesProducts();
    });
  }
});

function calculateBalanceData(period) {
  const now = new Date();
  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  const isSameWeek = (d1, d2) => {
    const startOfWeek = d => {
      const date = new Date(d);
      date.setDate(date.getDate() - date.getDay());
      date.setHours(0,0,0,0);
      return date;
    };
    return startOfWeek(d1).getTime() === startOfWeek(d2).getTime();
  };
  const isSameMonth = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  const isSameYear = (d1, d2) => d1.getFullYear() === d2.getFullYear();
  
  const checkPeriod = period === 'day' ? isSameDay : period === 'week' ? isSameWeek : period === 'month' ? isSameMonth : isSameYear;
  
  let income = 0, expenses = 0, profit = 0;
  
  sales.forEach(s => {
    const fecha = new Date(s.date);
    if (checkPeriod(fecha, now)) {
      income += s.total;
      profit += s.profit;
    }
  });
  
  // Gastos (costos de ventas)
  expenses = income - profit;
  
  return { income, expenses, profit };
}

function getRecentMovements(period) {
  const movements = [];
  const now = new Date();
  let startDate;
  
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
  
  // Agregar ventas del periodo
  sales.forEach(sale => {
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
  });
  
  // Agregar deudas del periodo
  debts.forEach(debt => {
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
  });
  
  // Agregar pagos de deudas del periodo
  debts.forEach(debt => {
    if (debt.payments && debt.payments.length > 0) {
      debt.payments.forEach(payment => {
        const paymentDate = new Date(payment.date);
        if (paymentDate >= startDate) {
          movements.push({
            type: 'payment',
            icon: 'bi-cash-coin',
            title: `Pago deuda #${debt.id}`,
            subtitle: `${debt.clientName} - ${paymentDate.toLocaleDateString()}`,
            amount: payment.amount,
            amountClass: 'positive',
            date: paymentDate,
            data: { debt, payment }
          });
        }
      });
    }
  });
  
  // Ordenar por fecha más reciente y limitar a 10
  return movements
    .sort((a, b) => b.date - a.date)
    .slice(0, 10);
}

// Función para cambiar de vista
function showView(viewName) {
  // Remover foco de elementos en vistas ocultas antes de cambiar
  removeFocusFromHiddenElements();
  
  // Ocultar todas las vistas
  const views = document.querySelectorAll('.app-view');
  views.forEach(view => {
    view.classList.add('d-none');
    // Remover foco de elementos dentro de vistas ocultas
    const focusableElements = view.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusableElements.forEach(element => {
      element.setAttribute('tabindex', '-1');
    });
  });
  
  // Mostrar la vista seleccionada
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.remove('d-none');
    
    // Restaurar tabindex de elementos focusables en la vista activa
    const focusableElements = targetView.querySelectorAll('button, input, select, textarea, [tabindex="-1"]');
    focusableElements.forEach(element => {
      // Solo restaurar si no es un elemento que debe permanecer sin foco
      if (!element.hasAttribute('data-no-focus')) {
        element.removeAttribute('tabindex');
      }
    });
    
    // Enfocar el primer elemento focusable de la vista
    const firstFocusable = targetView.querySelector('button:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])');
    if (firstFocusable && !firstFocusable.hasAttribute('data-no-focus')) {
      // Usar setTimeout para asegurar que la vista esté visible antes de enfocar
      setTimeout(() => {
        safeFocus(firstFocusable);
      }, 100);
    }
  }
  
  // Actualizar botones activos en el sidebar
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => btn.classList.remove('active'));
  const activeNavBtn = document.getElementById(`nav-${viewName}`);
  if (activeNavBtn) {
    activeNavBtn.classList.add('active');
  }
  
  // Actualizar botones activos en la navegación inferior
  document.querySelectorAll('.navbar-treinta .btn').forEach(btn => btn.classList.remove('active'));
  const activeBottomBtn = document.getElementById(`nav-bottom-${viewName}`);
  if (activeBottomBtn) {
    activeBottomBtn.classList.add('active');
  }
  
  // Actualizar título de la página
  updatePageTitle(viewName);
  
  // Ejecutar funciones específicas según la vista
  switch (viewName) {
    case 'balance':
      updateBalanceUI();
      showAdvancedStats(); // Agregar estadísticas avanzadas
      break;
    case 'sales':
      renderSalesProducts();
      renderCart();
      break;
    case 'debt':
      renderDebts();
      break;
    case 'clients':
      renderClients();
      break;
    case 'inventory':
      renderInventory();
      break;
    case 'movements':
      // Inicializar fechas por defecto (último mes)
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      
      const startDateInput = document.getElementById('startDate');
      const endDateInput = document.getElementById('endDate');
      
      if (startDateInput && endDateInput) {
        startDateInput.value = lastMonth.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
        
        // Filtrar movimientos automáticamente
        filterMovementsByDate();
      }
      break;
    case 'chickens':
      showChickenView();
      break;
    case 'reports':
      showReportsView();
      break;
  }
  
  // Cerrar sidebar en móviles
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
  
  // Feedback táctil
  hapticFeedback('light');
  
  // Notificar cambio de vista para lectores de pantalla
  announceViewChange(viewName);
}

// Función para actualizar el título de la página
function updatePageTitle(viewName) {
  const titles = {
    'balance': 'Balance - TillUp',
    'sales': 'Ventas - TillUp',
    'clients': 'Clientes - TillUp',
    'debt': 'Deudas - TillUp',
    'inventory': 'Inventario - TillUp',
    'chickens': 'Ventas de Pollos - TillUp',
    'movements': 'Movimientos - TillUp',
    'reports': 'Reportes - TillUp'
  };
  
  document.title = titles[viewName] || 'TillUp';
}

// Función para anunciar cambios de vista para lectores de pantalla
function announceViewChange(viewName) {
  const announcements = {
    'balance': 'Vista de balance activa',
    'sales': 'Vista de ventas activa',
    'clients': 'Vista de clientes activa',
    'debt': 'Vista de deudas activa',
    'inventory': 'Vista de inventario activa',
    'chickens': 'Vista de ventas de pollos activa',
    'movements': 'Vista de movimientos activa',
    'reports': 'Vista de reportes activa'
  };
  
  // Crear elemento para anuncio
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = announcements[viewName] || 'Vista cambiada';
  
  document.body.appendChild(announcement);
  
  // Remover después de un momento
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
  }, 1000);
}

// Función para manejar el foco de manera segura
function safeFocus(element) {
  if (element && element.offsetParent !== null) {
    // Verificar que el elemento esté visible
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      element.focus();
      return true;
    }
  }
  return false;
}

// Función para remover foco de elementos ocultos
function removeFocusFromHiddenElements() {
  const hiddenViews = document.querySelectorAll('.app-view.d-none');
  hiddenViews.forEach(view => {
    const focusedElement = view.querySelector(':focus');
    if (focusedElement) {
      focusedElement.blur();
    }
  });
}

// Función para configurar manejo de foco en modales
function setupModalFocusManagement() {
  const modals = document.querySelectorAll('.modal');
  
  modals.forEach(modal => {
    modal.addEventListener('show.bs.modal', function() {
      // Guardar elemento que tenía el foco antes del modal
      this.previousActiveElement = document.activeElement;
      
      // Enfocar el primer elemento focusable del modal
      const firstFocusable = this.querySelector('button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }
    });
    
    modal.addEventListener('hidden.bs.modal', function() {
      // Restaurar foco al elemento anterior
      if (this.previousActiveElement && this.previousActiveElement.offsetParent !== null) {
        this.previousActiveElement.focus();
      }
    });
    
    // Manejar foco dentro del modal (trap focus)
    const focusableElements = modal.querySelectorAll('button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])');
    
    if (focusableElements.length > 0) {
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      modal.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      });
    }
  });
}

// Mostrar detalles del cliente
function showClientDetails(clientId) {
  const client = clients.find(c => c.id == clientId);
  if (!client) return;
  
  let html = `
    <div class="text-center mb-3">
      ${client.photo ? 
        `<img src="${client.photo}" alt="${client.name}" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:3px solid #1F2D3D;" />` :
        `<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg, #1F2D3D, #2a3f5a);display:flex;align-items:center;justify-content:center;margin:0 auto;color:#fff;font-size:2rem;font-weight:700;border:3px solid #1F2D3D;">${client.name.charAt(0).toUpperCase()}</div>`
      }
    </div>
    <h4 class="mb-3 text-center">${client.name}</h4>
    <div class="row">
      <div class="col-12 mb-2">
        <strong><i class="bi bi-telephone"></i> Teléfono:</strong> ${client.phone || 'No registrado'}
      </div>
      <div class="col-12 mb-2">
        <strong><i class="bi bi-geo-alt"></i> Dirección:</strong> ${client.address || 'No registrada'}
      </div>
      ${client.location ? `
        <div class="col-12 mb-3">
          <a href="https://maps.google.com/?q=${client.location}" target="_blank" class="btn btn-outline-primary btn-sm">
            <i class="bi bi-geo-alt-fill"></i> Ver ubicación en mapa
          </a>
        </div>
      ` : ''}
      <div class="col-12">
        <strong>Deuda actual:</strong> 
        <span class="badge ${client.debt > 0 ? 'bg-warning' : 'bg-success'} fs-6">
          ${client.debt > 0 ? `$${client.debt.toFixed(2)}` : 'Sin deuda'}
        </span>
      </div>
    </div>
  `;

  Swal.fire({
    title: 'Detalles del Cliente',
    html: html,
    showCancelButton: true,
    confirmButtonText: 'Editar',
    cancelButtonText: 'Cerrar',
    showDenyButton: client.debt > 0,
    denyButtonText: 'Ver deudas'
  }).then((result) => {
    if (result.isConfirmed) {
      // Editar cliente
      editClient(clientId);
    } else if (result.isDenied) {
      // Ver deudas del cliente
      showClientDebts(clientId);
    }
  });
}

// Mostrar deudas de un cliente específico
function showClientDebts(clientId) {
  const client = clients.find(c => c.id === clientId);
  const clientDebts = debts.filter(d => d.clientId === clientId);
  
  if (clientDebts.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Sin deudas',
      text: `${client.name} no tiene deudas registradas.`
    });
    return;
  }

  let html = `<h5 class="mb-3">Deudas de ${client.name}</h5>`;
  clientDebts.forEach(debt => {
    html += `
      <div class="border rounded p-3 mb-2">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>${debt.date}</strong><br>
            <small class="text-muted">${debt.reason || 'Venta a crédito'}</small>
          </div>
          <div class="text-end">
            <div class="fw-bold">$${debt.amount.toFixed(2)}</div>
            ${debt.abono ? `<small class="text-success">Abonado: $${debt.abono.toFixed(2)}</small>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  Swal.fire({
    title: 'Deudas del Cliente',
    html: html,
    showCancelButton: true,
    confirmButtonText: 'Abonar',
    cancelButtonText: 'Cerrar'
  }).then((result) => {
    if (result.isConfirmed) {
      // Mostrar modal de abono
      const totalDebt = clientDebts.reduce((sum, d) => sum + d.amount, 0);
      Swal.fire({
        title: 'Abonar a deuda',
        html: `<div class='mb-2'>¿Cuánto desea abonar?</div><input id='abonoInput' type='number' min='1' max='${totalDebt}' class='form-control' placeholder='Abono' />`,
        inputAttributes: { min: 1, max: totalDebt },
        showCancelButton: true,
        confirmButtonText: 'Abonar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const abono = parseFloat(document.getElementById('abonoInput').value) || 0;
          if (abono < 1 || abono > totalDebt) {
            Swal.showValidationMessage('El abono debe ser entre 1 y el total de deuda');
            return false;
          }
          return abono;
        }
      }).then((abonoResult) => {
        if (abonoResult.isConfirmed) {
          const abono = abonoResult.value;
          // Aplicar abono a las deudas (prioridad por fecha más antigua)
          let remainingAbono = abono;
          clientDebts.sort((a, b) => new Date(a.date) - new Date(b.date));
          
          for (let debt of clientDebts) {
            if (remainingAbono <= 0) break;
            if (debt.amount > 0) {
              const abonoToApply = Math.min(remainingAbono, debt.amount);
              debt.abono = (debt.abono || 0) + abonoToApply;
              debt.amount -= abonoToApply;
              remainingAbono -= abonoToApply;
            }
          }
          
          saveToStorage('debts', debts);
          renderDebts();
          renderClients();
          Swal.fire({ 
            icon: 'success', 
            title: 'Abono registrado', 
            text: `Abono registrado: ${formatCurrency(abono)}` 
          });
        }
      });
    }
  });
}

// Editar cliente con vista previa de imagen
function editClient(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) return;
  
  // Llenar el formulario con los datos del cliente
  const nameInput = document.getElementById('clientName');
  const phoneInput = document.getElementById('clientPhone');
  const addressInput = document.getElementById('clientAddress');
  const preview = document.getElementById('clientImagePreview');
  if (nameInput) nameInput.value = client.name;
  if (phoneInput) phoneInput.value = client.phone || '';
  if (addressInput) addressInput.value = client.address || '';
  if (preview) {
    if (client.photo) {
      preview.innerHTML = `<img src="${client.photo}" alt="Foto actual">`;
    } else {
      preview.innerHTML = '';
    }
  }
  
  // Guardar el ID del cliente a editar
  window.editingClientId = clientId;
  
  // Cambiar el texto del botón
  const submitBtn = document.querySelector('#modalClient .btn-primary');
  submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Actualizar Cliente';
  
  // Mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById('modalClient'));
  modal.show();
}

// === Funcionalidades Finales y Optimizaciones ===

// Búsqueda global en todas las vistas
function setupGlobalSearch() {
  const searchInputs = document.querySelectorAll('input[type="text"], input[type="search"]');
  searchInputs.forEach(input => {
    input.addEventListener('input', debounce(function() {
      const searchTerm = this.value.toLowerCase();
      const currentView = getCurrentView();
      
      switch(currentView) {
        case 'inventory':
          filterProducts(searchTerm);
          break;
        case 'sales':
          renderSalesProducts(); // Ya incluye búsqueda
          break;
        case 'clients':
          filterClients(searchTerm);
          break;
        case 'debt':
          filterDebts(searchTerm);
          break;
      }
    }, 300));
  });
}

// Función debounce para optimizar búsquedas
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Obtener vista actual
function getCurrentView() {
  const views = ['inventory', 'sales', 'clients', 'debt', 'balance'];
  for (let view of views) {
    if (!document.getElementById(`view-${view}`).classList.contains('d-none')) {
      return view;
    }
  }
  return 'inventory';
}

// Filtrar productos en inventario
function filterProducts(searchTerm) {
  const productCards = document.querySelectorAll('.product-card-treinta, .product-card');
  productCards.forEach(card => {
    const productName = card.querySelector('h5, h6, .product-name-treinta')?.textContent?.toLowerCase() || '';
    const productDesc = card.querySelector('.product-description')?.textContent?.toLowerCase() || '';
    const productCategory = card.querySelector('.product-category')?.textContent?.toLowerCase() || '';
    
    const matches = productName.includes(searchTerm) || 
                   productDesc.includes(searchTerm) || 
                   productCategory.includes(searchTerm);
    
    card.style.display = matches ? 'block' : 'none';
  });
}

// Filtrar clientes
function filterClients(searchTerm) {
  const clientCards = document.querySelectorAll('.client-card-treinta, .client-card, .list-group-item');
  clientCards.forEach(card => {
    const clientName = card.querySelector('.client-name, h5, h6')?.textContent?.toLowerCase() || '';
    const clientPhone = card.querySelector('.client-phone, .text-muted')?.textContent?.toLowerCase() || '';
    
    const matches = clientName.includes(searchTerm) || clientPhone.includes(searchTerm);
    card.style.display = matches ? 'block' : 'none';
  });
}

// Filtrar deudas
function filterDebts(searchTerm) {
  const debtCards = document.querySelectorAll('.debt-card-treinta, .debt-card, .debt-item');
  debtCards.forEach(card => {
    const clientName = card.querySelector('.debt-client, .client-name')?.textContent?.toLowerCase() || '';
    const debtDate = card.querySelector('.debt-date')?.textContent?.toLowerCase() || '';
    
    const matches = clientName.includes(searchTerm) || debtDate.includes(searchTerm);
    card.style.display = matches ? 'block' : 'none';
  });
}

// Estadísticas adicionales para balance
function getAdvancedStats(period) {
  const data = calculateBalanceData(period);
  const stats = {
    totalSales: sales.length,
    totalClients: clients.length,
    totalProducts: products.length,
    avgSaleValue: data.income / Math.max(sales.length, 1),
    profitMargin: ((data.profit / data.income) * 100) || 0,
    topSellingProduct: getTopSellingProduct(),
    mostValuableClient: getMostValuableClient(),
    debtRatio: (debts.reduce((sum, d) => sum + d.amount, 0) / Math.max(data.income, 1)) * 100
  };
  
  return stats;
}

// Obtener producto más vendido
function getTopSellingProduct() {
  const productSales = {};
  
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      productSales[item.id] = (productSales[item.id] || 0) + item.qty;
    });
  });
  
  const topProduct = Object.entries(productSales)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (topProduct) {
    const product = products.find(p => p.id === topProduct[0]);
    return {
      name: product?.name || 'Producto desconocido',
      sales: topProduct[1]
    };
  }
  
  return { name: 'Sin ventas', sales: 0 };
}

// Obtener cliente más valioso
function getMostValuableClient() {
  const clientSales = {};
  
  sales.forEach(sale => {
    clientSales[sale.clientId] = (clientSales[sale.clientId] || 0) + sale.total;
  });
  
  const topClient = Object.entries(clientSales)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (topClient) {
    const client = clients.find(c => c.id === topClient[0]);
    return {
      name: client?.name || 'Cliente desconocido',
      total: topClient[1]
    };
  }
  
  return { name: 'Sin ventas', total: 0 };
}

// Optimización de rendimiento - Lazy loading de imágenes
function setupLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// Cache de datos para mejorar rendimiento
const dataCache = new Map();

function getCachedData(key, fetchFunction, ttl = 5 * 60 * 1000) { // 5 minutos
  const cached = dataCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = fetchFunction();
  dataCache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}

// Limpiar cache periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of dataCache.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) { // 10 minutos
      dataCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cada 5 minutos

// Backup automático de datos
function setupAutoBackup() {
  setInterval(() => {
    const backupData = {
      products,
      clients,
      sales,
      debts,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('tillup_backup', JSON.stringify(backupData));
  }, 5 * 60 * 1000); // Cada 5 minutos
}

// Restaurar backup si es necesario
function restoreBackup() {
  const backup = localStorage.getItem('tillup_backup');
  if (backup) {
    try {
      const backupData = JSON.parse(backup);
      const backupAge = Date.now() - new Date(backupData.timestamp).getTime();
      
      // Solo restaurar si el backup es reciente (menos de 1 hora)
      if (backupAge < 60 * 60 * 1000) {
        products = backupData.products || products;
        clients = backupData.clients || clients;
        sales = backupData.sales || sales;
        debts = backupData.debts || debts;
        
        // Guardar datos restaurados
        saveToStorage('products', products);
        saveToStorage('clients', clients);
        saveToStorage('sales', sales);
        saveToStorage('debts', debts);
        
        console.log('Backup restaurado exitosamente');
      }
    } catch (error) {
      console.error('Error al restaurar backup:', error);
    }
  }
}

// Inicializar funcionalidades avanzadas
document.addEventListener('DOMContentLoaded', function() {
  // Configurar búsqueda global
  setupGlobalSearch();
  
  // Configurar lazy loading
  setupLazyLoading();
  
  // Configurar backup automático
  setupAutoBackup();
  
  // Restaurar backup si es necesario
  restoreBackup();
  
  // Mostrar estadísticas avanzadas en balance
  const balanceView = document.getElementById('view-balance');
  if (balanceView) {
    const observer = new MutationObserver(() => {
      if (!balanceView.classList.contains('d-none')) {
        showAdvancedStats();
      }
    });
    observer.observe(balanceView, { attributes: true, attributeFilter: ['class'] });
  }
});

// Mostrar estadísticas avanzadas
function showAdvancedStats() {
  const currentPeriod = document.querySelector('input[name="periodFilter"]:checked')?.value || 'day';
  const stats = getAdvancedStats(currentPeriod);
  
  // Crear o actualizar sección de estadísticas avanzadas
  let statsSection = document.getElementById('advancedStats');
  if (!statsSection) {
    statsSection = document.createElement('div');
    statsSection.id = 'advancedStats';
    statsSection.className = 'advanced-stats-treinta mt-4';
    document.getElementById('view-balance').appendChild(statsSection);
  }
  
  statsSection.innerHTML = `
    <div class="advanced-stats-header">
      <h5 class="mb-3">
        <i class="bi bi-graph-up-arrow"></i> Estadísticas Avanzadas
      </h5>
    </div>
    <div class="advanced-stats-grid">
      <div class="stat-card-treinta">
        <div class="stat-icon">
          <i class="bi bi-cart-check"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${stats.totalSales}</div>
          <div class="stat-label">Total Ventas</div>
        </div>
      </div>
      
      <div class="stat-card-treinta">
        <div class="stat-icon">
          <i class="bi bi-people"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${stats.totalClients}</div>
          <div class="stat-label">Clientes</div>
        </div>
      </div>
      
      <div class="stat-card-treinta">
        <div class="stat-icon">
          <i class="bi bi-box-seam"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${stats.totalProducts}</div>
          <div class="stat-label">Productos</div>
        </div>
      </div>
      
      <div class="stat-card-treinta">
        <div class="stat-icon">
          <i class="bi bi-currency-dollar"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">$${stats.avgSaleValue.toFixed(2)}</div>
          <div class="stat-label">Promedio Venta</div>
        </div>
      </div>
      
      <div class="stat-card-treinta">
        <div class="stat-icon">
          <i class="bi bi-percent"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${stats.profitMargin.toFixed(1)}%</div>
          <div class="stat-label">Margen Utilidad</div>
        </div>
      </div>
      
      <div class="stat-card-treinta">
        <div class="stat-icon">
          <i class="bi bi-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${stats.debtRatio.toFixed(1)}%</div>
          <div class="stat-label">Ratio Deudas</div>
        </div>
      </div>
    </div>
    
    <div class="insights-section mt-4">
      <h6 class="mb-3">
        <i class="bi bi-lightbulb"></i> Insights
      </h6>
      <div class="insights-grid">
        <div class="insight-card-treinta">
          <div class="insight-icon">
            <i class="bi bi-trophy"></i>
          </div>
          <div class="insight-content">
            <div class="insight-title">Producto Top</div>
            <div class="insight-value">${stats.topSellingProduct.name}</div>
            <div class="insight-subtitle">${stats.topSellingProduct.sales} ventas</div>
          </div>
        </div>
        
        <div class="insight-card-treinta">
          <div class="insight-icon">
            <i class="bi bi-star"></i>
          </div>
          <div class="insight-content">
            <div class="insight-title">Cliente VIP</div>
            <div class="insight-value">${stats.mostValuableClient.name}</div>
            <div class="insight-subtitle">$${stats.mostValuableClient.total.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// === Testing y Ajustes Finales ===

// Función de testing para validar la integridad de datos
function validateDataIntegrity() {
  const errors = [];
  
  // Validar productos
  products.forEach((product, index) => {
    if (!product.id || !product.name || typeof product.price !== 'number') {
      errors.push(`Producto ${index + 1}: Datos incompletos o inválidos`);
    }
  });
  
  // Validar clientes
  clients.forEach((client, index) => {
    if (!client.id || !client.name) {
      errors.push(`Cliente ${index + 1}: Datos incompletos`);
    }
  });
  
  // Validar ventas
  sales.forEach((sale, index) => {
    if (!sale.id || !sale.clientId || typeof sale.total !== 'number') {
      errors.push(`Venta ${index + 1}: Datos incompletos`);
    }
  });
  
  // Validar deudas
  debts.forEach((debt, index) => {
    if (!debt.id || !debt.clientId || typeof debt.amount !== 'number') {
      errors.push(`Deuda ${index + 1}: Datos incompletos`);
    }
  });
  
  if (errors.length > 0) {
    console.warn('Errores de integridad de datos encontrados:', errors);
    return false;
  }
  
  return true;
}

// Función para limpiar datos corruptos
function cleanCorruptedData() {
  let cleaned = false;
  
  // Limpiar productos corruptos
  const originalProductsLength = products.length;
  products = products.filter(product => 
    product && product.id && product.name && typeof product.price === 'number'
  );
  if (products.length !== originalProductsLength) {
    cleaned = true;
    saveToStorage('products', products);
  }
  
  // Limpiar clientes corruptos
  const originalClientsLength = clients.length;
  clients = clients.filter(client => 
    client && client.id && client.name
  );
  if (clients.length !== originalClientsLength) {
    cleaned = true;
    saveToStorage('clients', clients);
  }
  
  // Limpiar ventas corruptas
  const originalSalesLength = sales.length;
  sales = sales.filter(sale => 
    sale && sale.id && sale.clientId && typeof sale.total === 'number'
  );
  if (sales.length !== originalSalesLength) {
    cleaned = true;
    saveToStorage('sales', sales);
  }
  
  // Limpiar deudas corruptas
  const originalDebtsLength = debts.length;
  debts = debts.filter(debt => 
    debt && debt.id && debt.clientId && typeof debt.amount === 'number'
  );
  if (debts.length !== originalDebtsLength) {
    cleaned = true;
    saveToStorage('debts', debts);
  }
  
  if (cleaned) {
    console.log('Datos corruptos limpiados exitosamente');
    Swal.fire({
      icon: 'info',
      title: 'Datos Limpiados',
      text: 'Se han limpiado datos corruptos encontrados en la aplicación.',
      timer: 2000,
      showConfirmButton: false
    });
  }
  
  return cleaned;
}

// Función para optimizar el rendimiento
function optimizePerformance() {
  // Limpiar cache antiguo
  const now = Date.now();
  for (const [key, value] of dataCache.entries()) {
    if (now - value.timestamp > 5 * 60 * 1000) { // 5 minutos
      dataCache.delete(key);
    }
  }
  
  // Limpiar elementos DOM no utilizados
  const unusedElements = document.querySelectorAll('[data-temp]');
  unusedElements.forEach(el => el.remove());
  
  // Optimizar imágenes
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.loading) {
      img.loading = 'lazy';
    }
  });
  
  console.log('Optimización de rendimiento completada');
}

// Función para generar reporte de estado de la app
function generateAppStatusReport() {
  const report = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    dataIntegrity: validateDataIntegrity(),
    statistics: {
      products: products.length,
      clients: clients.length,
      sales: sales.length,
      debts: debts.length,
      totalStorage: JSON.stringify({products, clients, sales, debts}).length
    },
    performance: {
      cacheSize: dataCache.size,
      memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 'N/A'
    },
    features: {
      darkMode: localStorage.getItem('darkMode') === 'true',
      autoBackup: true,
      lazyLoading: true,
      globalSearch: true
    }
  };
  
  console.log('Reporte de Estado de la App:', report);
  return report;
}

// Función para mostrar notificaciones de estado
function showAppStatus() {
  const report = generateAppStatusReport();
  
  let statusIcon = 'success';
  let statusTitle = 'App Funcionando Correctamente';
  let statusMessage = `Todo está funcionando bien. ${report.statistics.products} productos, ${report.statistics.clients} clientes, ${report.statistics.sales} ventas registradas.`;
  
  if (!report.dataIntegrity) {
    statusIcon = 'warning';
    statusTitle = 'Problemas Detectados';
    statusMessage = 'Se han detectado algunos problemas de integridad de datos. Se recomienda limpiar datos corruptos.';
  }
  
  Swal.fire({
    icon: statusIcon,
    title: statusTitle,
    text: statusMessage,
    showCancelButton: true,
    confirmButtonText: 'Ver Detalles',
    cancelButtonText: 'Cerrar'
  }).then((result) => {
    if (result.isConfirmed) {
      showDetailedStatus(report);
    }
  });
}

// Mostrar estado detallado
function showDetailedStatus(report) {
  const details = `
    <div class="status-details">
      <div class="status-section">
        <h6><i class="bi bi-database"></i> Datos</h6>
        <ul>
          <li>Productos: ${report.statistics.products}</li>
          <li>Clientes: ${report.statistics.clients}</li>
          <li>Ventas: ${report.statistics.sales}</li>
          <li>Deudas: ${report.statistics.debts}</li>
          <li>Almacenamiento: ${(report.statistics.totalStorage / 1024).toFixed(2)} KB</li>
        </ul>
      </div>
      
      <div class="status-section">
        <h6><i class="bi bi-speedometer2"></i> Rendimiento</h6>
        <ul>
          <li>Cache: ${report.performance.cacheSize} elementos</li>
          <li>Memoria: ${report.performance.memoryUsage !== 'N/A' ? (report.performance.memoryUsage / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</li>
        </ul>
      </div>
      
      <div class="status-section">
        <h6><i class="bi bi-gear"></i> Funciones</h6>
        <ul>
          <li>Modo Oscuro: ${report.features.darkMode ? '✅' : '❌'}</li>
          <li>Backup Automático: ${report.features.autoBackup ? '✅' : '❌'}</li>
          <li>Lazy Loading: ${report.features.lazyLoading ? '✅' : '❌'}</li>
          <li>Búsqueda Global: ${report.features.globalSearch ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  `;
  
  Swal.fire({
    title: 'Estado Detallado de la App',
    html: details,
    width: '600px',
    showConfirmButton: true,
    confirmButtonText: 'Cerrar'
  });
}

// Función para exportar todos los datos
function exportAllData() {
  const exportData = {
    products,
    clients,
    sales,
    debts,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `tillup_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  Swal.fire({
    icon: 'success',
    title: 'Datos Exportados',
    text: 'Todos los datos han sido exportados exitosamente.',
    timer: 2000,
    showConfirmButton: false
  });
}

// Función para importar datos
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedData = JSON.parse(e.target.result);
          
          if (importedData.version && importedData.products && importedData.clients) {
            Swal.fire({
              title: 'Confirmar Importación',
              text: `¿Estás seguro de que quieres importar ${importedData.products.length} productos, ${importedData.clients.length} clientes y ${importedData.sales.length} ventas?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Importar',
              cancelButtonText: 'Cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                products = importedData.products || products;
                clients = importedData.clients || clients;
                sales = importedData.sales || sales;
                debts = importedData.debts || debts;
                
                saveToStorage('products', products);
                saveToStorage('clients', clients);
                saveToStorage('sales', sales);
                saveToStorage('debts', debts);
                
                // Recargar vistas
                renderInventory();
                renderClients();
                renderDebts();
                renderBalanceGrid();
                
                Swal.fire({
                  icon: 'success',
                  title: 'Datos Importados',
                  text: 'Los datos han sido importados exitosamente.',
                  timer: 2000,
                  showConfirmButton: false
                });
              }
            });
          } else {
            throw new Error('Formato de archivo inválido');
          }
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error al Importar',
            text: 'El archivo seleccionado no es válido o está corrupto.'
          });
        }
      };
      reader.readAsText(file);
    }
  };
  
  input.click();
}

// Inicializar funciones finales
document.addEventListener('DOMContentLoaded', function() {
  // Validar integridad de datos al cargar
  if (!validateDataIntegrity()) {
    cleanCorruptedData();
  }
  
  // Optimizar rendimiento cada 5 minutos
  setInterval(optimizePerformance, 5 * 60 * 1000);
  
  // Agregar botones de utilidad al sidebar
  const sidebarActions = document.querySelector('.sidebar-actions');
  if (sidebarActions) {
    const utilityButtons = `
      <button class="sidebar-action-btn" onclick="showAppStatus()" title="Estado de la App">
        <i class="bi bi-info-circle"></i>
        <span>Estado</span>
      </button>
      <button class="sidebar-action-btn" onclick="exportAllData()" title="Exportar Datos">
        <i class="bi bi-download"></i>
        <span>Exportar</span>
      </button>
      <button class="sidebar-action-btn" onclick="importData()" title="Importar Datos">
        <i class="bi bi-upload"></i>
        <span>Importar</span>
      </button>
    `;
    sidebarActions.insertAdjacentHTML('beforeend', utilityButtons);
  }
  
  // Mostrar mensaje de bienvenida en la primera visita
  const isFirstVisit = !localStorage.getItem('tillup_first_visit');
  if (isFirstVisit) {
    localStorage.setItem('tillup_first_visit', 'true');
    
    Swal.fire({
      title: '¡Bienvenido a TillUp POS!',
      html: `
        <div class="welcome-message">
          <p>Tu aplicación de gestión de ventas está lista para usar.</p>
          <div class="welcome-features">
            <div><i class="bi bi-check-circle text-success"></i> Gestión de inventario</div>
            <div><i class="bi bi-check-circle text-success"></i> Ventas con carrito</div>
            <div><i class="bi bi-check-circle text-success"></i> Control de clientes</div>
            <div><i class="bi bi-check-circle text-success"></i> Gestión de deudas</div>
            <div><i class="bi bi-check-circle text-success"></i> Balance y estadísticas</div>
          </div>
          <p class="mt-3"><small>Diseño inspirado en Treinta.co</small></p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: '¡Comenzar!'
    });
  }
});

// Función para mostrar créditos
function showCredits() {
  Swal.fire({
    title: 'TillUp POS v1.0.0',
    html: `
      <div class="credits-content">
        <div class="credits-section">
          <h6>Desarrollado con ❤️</h6>
          <p>HTML5, CSS3, JavaScript vanilla</p>
        </div>
        
        <div class="credits-section">
          <h6>Librerías Utilizadas</h6>
          <ul>
            <li>Bootstrap 5.3.3</li>
            <li>Bootstrap Icons</li>
            <li>SweetAlert2</li>
          </ul>
        </div>
        
        <div class="credits-section">
          <h6>Inspiración</h6>
          <p>Diseño inspirado en Treinta.co</p>
        </div>
        
        <div class="credits-section">
          <h6>Características</h6>
          <ul>
            <li>✅ PWA Ready</li>
            <li>✅ Modo Oscuro</li>
            <li>✅ Responsive Design</li>
            <li>✅ Backup Automático</li>
            <li>✅ Búsqueda Global</li>
            <li>✅ Estadísticas Avanzadas</li>
          </ul>
        </div>
      </div>
    `,
    width: '600px',
    showConfirmButton: true,
    confirmButtonText: 'Cerrar'
  });
}

// Función para seleccionar cliente desde el carrito
function selectClientForCart(clientId) {
  if (!clientId) {
    currentClientId = null;
    renderCart();
    return;
  }
  
  currentClientId = clientId;
  const client = clients.find(c => c.id === clientId);
  
  // Cargar proforma guardada para este cliente
  const proforma = loadProforma(clientId);
  if (proforma && proforma.length > 0) {
    cart = proforma;
  }
  
  renderCart();
  
  // Mostrar información del cliente seleccionado
  const selectedClientInfo = document.getElementById('selectedClientInfo');
  const selectedClientName = document.getElementById('selectedClientName');
  const cartClientSelector = document.getElementById('cartClientSelector');
  
  if (selectedClientInfo && selectedClientName && cartClientSelector) {
    selectedClientInfo.style.display = 'block';
    selectedClientName.textContent = client.name;
    cartClientSelector.style.display = 'none';
  }
  
  // Mostrar notificación de cliente seleccionado
  const toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });
  
  toast.fire({
    icon: 'info',
    title: `Cliente seleccionado: ${client.name}`
  });
}

// Función para mostrar modal de agregar cliente desde el carrito
function showAddClientModal() {
  const modal = new bootstrap.Modal(document.getElementById('modalClient'));
  modal.show();
}

function generatePDF(tipo) {
  // Verificar si jsPDF está disponible
  if (typeof window.jspdf === 'undefined') {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'La librería PDF no está disponible. Verifica tu conexión a internet.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  Swal.fire({
    title: 'Generando PDF...',
    html: '<div class="spinner-border text-primary" role="status"></div><div class="mt-2">Preparando documento...</div>',
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    // Llamar a la función del pdf-generator.js usando window para evitar conflicto de nombres
    window.generatePDFFromFile(tipo).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'PDF Generado',
        text: 'El documento se ha descargado exitosamente.',
        timer: 2000,
        showConfirmButton: false
      });
    }).catch(error => {
      console.error('Error generando PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el PDF. Intenta nuevamente.',
        confirmButtonText: 'Aceptar'
      });
    });
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo generar el PDF. Intenta nuevamente.',
      confirmButtonText: 'Aceptar'
    });
  }
}

// Función para eliminar el cliente seleccionado
function removeSelectedClient() {
  currentClientId = null;
  renderCart();
  
  // Mostrar información del cliente seleccionado
  const selectedClientInfo = document.getElementById('selectedClientInfo');
  const cartClientSelector = document.getElementById('cartClientSelector');
  
  if (selectedClientInfo && cartClientSelector) {
    selectedClientInfo.style.display = 'none';
    cartClientSelector.style.display = 'block';
  }
  
  // Mostrar notificación
  const toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });
  
  toast.fire({
    icon: 'info',
    title: 'Cliente eliminado del carrito'
  });
}

// === Funciones para Movimientos por Rango de Fecha ===

// Función para filtrar movimientos por rango de fecha
function filterMovementsByDate() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  if (!startDate || !endDate) {
    Swal.fire({
      icon: 'warning',
      title: 'Fechas requeridas',
      text: 'Por favor selecciona fecha de inicio y fin.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    Swal.fire({
      icon: 'error',
      title: 'Rango inválido',
      text: 'La fecha de inicio debe ser menor a la fecha de fin.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  // Obtener movimientos del rango
  const movements = getMovementsByDateRange(start, end);
  const summary = calculatePeriodSummary(movements);
  
  // Renderizar resumen
  renderPeriodSummary(summary);
  
  // Renderizar movimientos
  renderFilteredMovements(movements);
}

// Función para obtener movimientos por rango de fecha
function getMovementsByDateRange(startDate, endDate) {
  const movements = [];
  
  // Agregar ventas del rango
  sales.forEach(sale => {
    const saleDate = new Date(sale.date);
    if (saleDate >= startDate && saleDate <= endDate) {
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
  });
  
  // Agregar ventas de pollos del rango
  chickenSales.forEach(sale => {
    const saleDate = new Date(sale.date);
    if (saleDate >= startDate && saleDate <= endDate) {
      movements.push({
        type: 'chicken',
        icon: 'bi-egg-fried',
        title: `Venta Pollos #${sale.id}`,
        subtitle: `${sale.clientName} - ${sale.quantity} pollo(s) - ${saleDate.toLocaleDateString()}`,
        amount: sale.total,
        amountClass: 'positive',
        date: saleDate,
        data: sale
      });
    }
  });
  
  // Agregar deudas del rango
  debts.forEach(debt => {
    const debtDate = new Date(debt.date);
    if (debtDate >= startDate && debtDate <= endDate) {
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
  });
  
  // Agregar pagos de deudas del rango
  debts.forEach(debt => {
    if (debt.payments && debt.payments.length > 0) {
      debt.payments.forEach(payment => {
        const paymentDate = new Date(payment.date);
        if (paymentDate >= startDate && paymentDate <= endDate) {
          movements.push({
            type: 'payment',
            icon: 'bi-cash-coin',
            title: `Pago deuda #${debt.id}`,
            subtitle: `${debt.clientName} - ${paymentDate.toLocaleDateString()}`,
            amount: payment.amount,
            amountClass: 'positive',
            date: paymentDate,
            data: { debt, payment }
          });
        }
      });
    }
  });
  
  // Ordenar por fecha más reciente
  return movements.sort((a, b) => b.date - a.date);
}

// Función para calcular resumen del período
function calculatePeriodSummary(movements) {
  const summary = {
    totalMovements: movements.length,
    totalIncome: 0,
    totalExpenses: 0,
    totalDebts: 0,
    totalPayments: 0,
    totalProfit: 0,
    sales: 0,
    chickenSales: 0,
    debts: 0,
    payments: 0
  };
  
  movements.forEach(movement => {
    if (movement.type === 'sale') {
      summary.totalIncome += movement.amount;
      summary.sales++;
    } else if (movement.type === 'chicken') {
      summary.totalIncome += movement.amount;
      summary.totalProfit += movement.data.profit || 0;
      summary.chickenSales++;
    } else if (movement.type === 'debt') {
      summary.totalDebts += movement.amount;
      summary.debts++;
    } else if (movement.type === 'payment') {
      summary.totalPayments += movement.amount;
      summary.payments++;
    }
  });
  
  summary.totalExpenses = summary.totalIncome - summary.totalPayments;
  
  return summary;
}

// Función para renderizar resumen del período
function renderPeriodSummary(summary) {
  const container = document.getElementById('periodSummary');
  
  container.innerHTML = `
    <div class="row g-3">
      <div class="col-md-2">
        <div class="summary-card-treinta">
          <div class="summary-icon">
            <i class="bi bi-cart-check"></i>
          </div>
          <div class="summary-content">
            <div class="summary-value">${summary.sales}</div>
            <div class="summary-label">Ventas</div>
            <div class="summary-amount">$${(summary.totalIncome - (summary.chickenSales > 0 ? summary.totalIncome * (summary.chickenSales / summary.totalMovements) : 0)).toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="summary-card-treinta">
          <div class="summary-icon">
            <i class="bi bi-egg-fried"></i>
          </div>
          <div class="summary-content">
            <div class="summary-value">${summary.chickenSales}</div>
            <div class="summary-label">Pollos</div>
            <div class="summary-amount">$${(summary.totalIncome * (summary.chickenSales / summary.totalMovements)).toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="summary-card-treinta">
          <div class="summary-icon">
            <i class="bi bi-cash-stack"></i>
          </div>
          <div class="summary-content">
            <div class="summary-value">${summary.debts}</div>
            <div class="summary-label">Deudas</div>
            <div class="summary-amount">$${summary.totalDebts.toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="summary-card-treinta">
          <div class="summary-icon">
            <i class="bi bi-cash-coin"></i>
          </div>
          <div class="summary-content">
            <div class="summary-value">${summary.payments}</div>
            <div class="summary-label">Pagos</div>
            <div class="summary-amount">$${summary.totalPayments.toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="summary-card-treinta">
          <div class="summary-icon">
            <i class="bi bi-graph-up"></i>
          </div>
          <div class="summary-content">
            <div class="summary-value">${summary.totalMovements}</div>
            <div class="summary-label">Total</div>
            <div class="summary-amount">Movimientos</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="summary-card-treinta">
          <div class="summary-icon">
            <i class="bi bi-cash-stack"></i>
          </div>
          <div class="summary-content">
            <div class="summary-value profit">$${summary.totalProfit.toFixed(2)}</div>
            <div class="summary-label">Ganancia</div>
            <div class="summary-amount">Pollos</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Función para renderizar movimientos filtrados
function renderFilteredMovements(movements) {
  const container = document.getElementById('filteredMovementsList');
  const countElement = document.getElementById('filteredMovementsCount');
  
  countElement.textContent = `${movements.length} movimientos`;
  
  if (movements.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">Sin movimientos en este período</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = movements.map((movement, idx) => `
    <div class="movement-item-treinta" onclick="showFilteredMovementDetail(${idx})" style="cursor:pointer;">
      <div class="movement-icon">
        <i class="bi ${movement.icon}"></i>
      </div>
      <div class="movement-content">
        <div class="movement-title">${movement.title}</div>
        <div class="movement-subtitle">${movement.subtitle}</div>
      </div>
      <div class="movement-amount ${movement.amountClass}">
        $${movement.amount.toFixed(2)}
      </div>
      <div class="movement-actions">
        <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); showMovementPDF(${idx})" title="Ver PDF">
          <i class="bi bi-file-pdf"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// Función para mostrar detalle de movimiento filtrado
window.showFilteredMovementDetail = function(idx) {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const movements = getMovementsByDateRange(start, end);
  const movement = movements[idx];
  
  if (!movement) return;

  if (movement.type === 'sale') {
    showReceipt(movement.data); // Modal de venta normal
  } else if (movement.type === 'chicken') {
    showChickenReceipt(movement.data); // Modal de venta de pollos
  } else if (movement.type === 'debt') {
    showDebtDetailModal(movement.data.id);
  } else if (movement.type === 'payment') {
    const { debt, payment } = movement.data;
    Swal.fire({
      icon: 'info',
      title: 'Pago de deuda',
      html: `
        <div class="payment-detail">
          <div><strong>Cliente:</strong> ${debt.clientName}</div>
          <div><strong>Monto:</strong> $${payment.amount.toFixed(2)}</div>
          <div><strong>Fecha:</strong> ${new Date(payment.date).toLocaleString()}</div>
          <div><strong>Deuda:</strong> #${debt.id}</div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Cerrar',
    });
  }
}

// Función para mostrar PDF del movimiento
window.showMovementPDF = function(idx) {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const movements = getMovementsByDateRange(start, end);
  const movement = movements[idx];
  
  if (!movement) return;

  if (movement.type === 'sale') {
    // Mostrar el mismo modal que se muestra al finalizar la venta
    showReceipt(movement.data);
  } else if (movement.type === 'chicken') {
    // Mostrar el modal de recibo de pollos
    showChickenReceipt(movement.data);
  } else if (movement.type === 'debt') {
    // Generar PDF de deuda
    generateDebtPDF(movement.data);
  } else if (movement.type === 'payment') {
    // Generar PDF de pago
    generatePaymentPDF(movement.data);
  }
}

// Nueva función para mostrar el modal de detalle de movimiento
window.showMovementDetail = function(idx) {
  const currentPeriod = document.querySelector('input[name="periodFilter"]:checked').value;
  const movements = getRecentMovements(currentPeriod);
  const movement = movements[idx];
  if (!movement) return;

  if (movement.type === 'sale') {
    // Buscar la venta por id
    const saleId = movement.title.match(/Venta #(\w+)/)?.[1];
    const sale = sales.find(s => s.id == saleId);
    if (sale) showReceipt(sale);
  } else if (movement.type === 'debt') {
    // Buscar la deuda por id
    const debtId = movement.title.match(/Deuda #(\w+)/)?.[1];
    showDebtDetailModal(debtId);
  } else if (movement.type === 'payment') {
    // Buscar la deuda y el pago
    const debtId = movement.title.match(/Pago deuda #(\w+)/)?.[1];
    const debt = debts.find(d => d.id == debtId);
    if (debt) {
      const payment = (debt.payments || []).find(p => p.amount === movement.amount && new Date(p.date).toLocaleDateString() === movement.date.toLocaleDateString());
      if (payment) {
        Swal.fire({
          icon: 'info',
          title: 'Pago de deuda',
          html: `<div><strong>Cliente:</strong> ${debt.clientName}</div><div><strong>Monto:</strong> $${payment.amount.toFixed(2)}</div><div><strong>Fecha:</strong> ${new Date(payment.date).toLocaleString()}</div>`,
          showConfirmButton: true,
          confirmButtonText: 'Cerrar',
        });
      }
    }
  }
}

// Función para imprimir comprobante
function printReceipt(sale) {
  const printWindow = window.open('', '_blank');
  const fecha = new Date().toLocaleString();
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comprobante de Venta #${sale.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .receipt { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #1F2D3D; }
        .title { font-size: 16px; font-weight: bold; margin: 5px 0; }
        .number { font-size: 14px; color: #666; }
        .date { font-size: 12px; color: #999; }
        .client { margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .items { margin: 15px 0; }
        .item { display: flex; justify-content: space-between; margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
        .total { margin: 15px 0; padding: 10px; background: #1F2D3D; color: white; border-radius: 5px; }
        .total-line { display: flex; justify-content: space-between; margin: 5px 0; }
        .final { font-size: 18px; font-weight: bold; }
        .payment { margin: 10px 0; text-align: center; font-style: italic; }
        .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #333; }
        @media print { body { margin: 0; } .receipt { border: none; } }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">TillUp POS</div>
          <div class="title">COMPROBANTE DE VENTA</div>
          <div class="number">#${sale.id}</div>
          <div class="date">${fecha}</div>
        </div>
        
        <div class="client">
          <strong>Cliente:</strong> ${sale.clientName}
        </div>
        
        <div class="items">
          ${sale.items.map(item => `
            <div class="item">
              <span>${item.name} x${item.qty}</span>
              <span>$${(item.price * item.qty).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="total">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>$${sale.originalTotal.toFixed(2)}</span>
          </div>
          ${sale.discount > 0 ? `
            <div class="total-line">
              <span>Descuento:</span>
              <span>-$${sale.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-line final">
            <span>TOTAL:</span>
            <span>$${sale.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="payment">
          Método de pago: ${getPaymentText(sale.paymentType)}
        </div>
        
        <div class="footer">
          <div>¡Gracias por su compra!</div>
          <small>Generado por TillUp POS</small>
        </div>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

// Función para descargar comprobante en PDF
function downloadReceiptPDF(sale) {
  // Verificar si jsPDF está disponible
  if (typeof window.jspdf === 'undefined') {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'La librería PDF no está disponible. Verifica tu conexión a internet.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const fecha = new Date().toLocaleString();
  
  // Configuración de colores
  const primaryColor = [31, 45, 61]; // #1F2D3D
  const secondaryColor = [42, 63, 90]; // #2a3f5a
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("TillUp POS", 14, 12);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text("COMPROBANTE DE VENTA", 14, 20);
  
  // Información de la venta
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.text(`Venta #${sale.id}`, 14, 35);
  doc.text(`Fecha: ${fecha}`, 14, 40);
  doc.text(`Cliente: ${sale.clientName}`, 14, 45);
  
  // Items
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Detalle de Productos", 14, 60);
  
  const items = sale.items.map(item => [
    item.name,
    item.qty.toString(),
    `$${item.price.toFixed(2)}`,
    `$${(item.price * item.qty).toFixed(2)}`
  ]);
  
  doc.autoTable({
    startY: 65,
    head: [['Producto', 'Cant.', 'Precio', 'Subtotal']],
    body: items,
    theme: 'grid',
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }
  });
  
  // Totales
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Resumen", 14, finalY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: $${sale.originalTotal.toFixed(2)}`, 14, finalY + 10);
  
  if (sale.discount > 0) {
    doc.text(`Descuento: -$${sale.discount.toFixed(2)}`, 14, finalY + 15);
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: $${sale.total.toFixed(2)}`, 14, finalY + 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Método de pago: ${getPaymentText(sale.paymentType)}`, 14, finalY + 35);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("¡Gracias por su compra!", 14, finalY + 50);
  doc.text("Generado por TillUp POS - Diseño inspirado en Treinta.co", 14, finalY + 55);
  
  doc.save(`Comprobante_${sale.id}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Función para generar PDF de deuda
function generateDebtPDF(debt) {
  if (typeof window.jspdf === 'undefined') {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'La librería PDF no está disponible. Verifica tu conexión a internet.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Configurar fuente
  doc.setFont('helvetica');
  doc.setFontSize(12);
  
  // Título
  doc.setFontSize(18);
  doc.text('COMPROBANTE DE DEUDA', 105, 20, { align: 'center' });
  
  // Información de la deuda
  doc.setFontSize(12);
  doc.text(`Deuda #${debt.id}`, 14, 35);
  doc.text(`Fecha: ${new Date(debt.date).toLocaleDateString()}`, 14, 45);
  doc.text(`Cliente: ${debt.clientName}`, 14, 55);
  doc.text(`Monto: $${debt.amount.toFixed(2)}`, 14, 65);
  doc.text(`Descripción: ${debt.description || 'Sin descripción'}`, 14, 75);
  
  // Estado de la deuda
  const remainingAmount = debt.amount - (debt.payments || []).reduce((sum, p) => sum + p.amount, 0);
  doc.text(`Monto restante: $${remainingAmount.toFixed(2)}`, 14, 85);
  
  // Historial de pagos
  if (debt.payments && debt.payments.length > 0) {
    doc.text('Historial de pagos:', 14, 105);
    let yPos = 115;
    debt.payments.forEach((payment, index) => {
      if (yPos < 250) {
        doc.text(`${index + 1}. $${payment.amount.toFixed(2)} - ${new Date(payment.date).toLocaleDateString()}`, 20, yPos);
        yPos += 10;
      }
    });
  }
  
  // Pie de página
  doc.setFontSize(10);
  doc.text('Generado por TillUp POS', 105, 280, { align: 'center' });
  
  // Descargar PDF
  doc.save(`deuda_${debt.id}.pdf`);
}

// Función para generar PDF de pago
function generatePaymentPDF(data) {
  if (typeof window.jspdf === 'undefined') {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'La librería PDF no está disponible. Verifica tu conexión a internet.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const { debt, payment } = data;
  
  // Configurar fuente
  doc.setFont('helvetica');
  doc.setFontSize(12);
  
  // Título
  doc.setFontSize(18);
  doc.text('COMPROBANTE DE PAGO', 105, 20, { align: 'center' });
  
  // Información del pago
  doc.setFontSize(12);
  doc.text(`Pago de Deuda #${debt.id}`, 14, 35);
  doc.text(`Fecha: ${new Date(payment.date).toLocaleDateString()}`, 14, 45);
  doc.text(`Cliente: ${debt.clientName}`, 14, 55);
  doc.text(`Monto pagado: $${payment.amount.toFixed(2)}`, 14, 65);
  
  // Información de la deuda original
  doc.text(`Deuda original: $${debt.amount.toFixed(2)}`, 14, 80);
  
  // Calcular monto restante
  const totalPaid = (debt.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = debt.amount - totalPaid;
  doc.text(`Monto restante: $${remainingAmount.toFixed(2)}`, 14, 90);
  
  // Descripción si existe
  if (debt.description) {
    doc.text(`Descripción: ${debt.description}`, 14, 105);
  }
  
  // Pie de página
  doc.setFontSize(10);
  doc.text('Generado por TillUp POS', 105, 280, { align: 'center' });
  
  // Descargar PDF
  doc.save(`pago_deuda_${debt.id}_${new Date(payment.date).getTime()}.pdf`);
}

// Nueva función para actualizar estadísticas de pollos por rango de fechas
function updateChickenStatsByRange(startDate, endDate) {
  // Filtrar ventas de pollos por rango
  const rangeSales = chickenSales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= startDate && saleDate <= endDate;
  });

  const totalChickens = rangeSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalWeight = rangeSales.reduce((sum, sale) => sum + sale.weight, 0);
  const totalRevenue = rangeSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = rangeSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
  const avgWeight = totalChickens > 0 ? totalWeight / totalChickens : 0;

  const totalChickensElement = document.getElementById('totalChickensSold');
  const totalWeightElement = document.getElementById('totalWeightSold');
  const totalRevenueElement = document.getElementById('totalRevenue');
  const totalProfitElement = document.getElementById('totalProfit');
  const avgWeightElement = document.getElementById('avgWeight');

  if (totalChickensElement) totalChickensElement.textContent = totalChickens;
  if (totalWeightElement) totalWeightElement.textContent = totalWeight.toFixed(1);
  if (totalRevenueElement) totalRevenueElement.textContent = `$${totalRevenue.toFixed(2)}`;
  if (totalProfitElement) totalProfitElement.textContent = `$${totalProfit.toFixed(2)}`;
  if (avgWeightElement) avgWeightElement.textContent = avgWeight.toFixed(1);
}

// Hook para actualizar estadísticas de pollos al filtrar por fecha
function onDateRangeChange() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  if (startDate && endDate) {
    updateChickenStatsByRange(new Date(startDate), new Date(endDate));
  }
}

// Agregar evento a los inputs de fecha si existen
window.addEventListener('DOMContentLoaded', () => {
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  if (startDateInput && endDateInput) {
    startDateInput.addEventListener('change', onDateRangeChange);
    endDateInput.addEventListener('change', onDateRangeChange);
  }
});

// Migrar fechas de ventas de pollos a formato ISO
function migrateChickenSalesDates() {
  let needsMigration = false;
  chickenSales.forEach(sale => {
    if (typeof sale.date === 'string' && !sale.date.includes('T')) {
      // Es una fecha en formato local, convertir a ISO
      const dateParts = sale.date.split('/');
      if (dateParts.length === 3) {
        const [month, day, year] = dateParts;
        const isoDate = new Date(year, month - 1, day).toISOString();
        sale.date = isoDate;
        needsMigration = true;
      }
    }
  });
  if (needsMigration) {
    saveToStorage('chickenSales', chickenSales);
    console.log('Migración de fechas de pollos completada');
  }
}

// Ejecutar migración de fechas de pollos al cargar la app
if (typeof migrateChickenSalesDates === 'function') {
  migrateChickenSalesDates();
}

// === INICIALIZACIÓN DE LA APLICACIÓN ===

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
  // Cargar datos guardados
  loadData();
  
  // Configurar event listeners
  setupEventListeners();
  
  // Inicializar datos de pollos
  initializeChickenData();
  
  // Inicializar sistema de reportes
  initializeReportsSystem();
  
  // Configurar eventos de reportes
  setupReportsEvents();
  
  // Actualizar UI
  updateBalanceUI();
  renderInventory();
  renderClients();
  renderDebts();
  renderSalesProducts();
  
  // Configurar búsqueda global
  setupGlobalSearch();
  
  // Configurar carga lazy
  setupLazyLoading();
  
  // Configurar backup automático
  setupAutoBackup();
  
  // Actualizar fecha y hora
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  // Detectar modo oscuro
  detectDarkMode();
  
  // Inicializar mejoras para experiencia nativa
  initializeNativeEnhancements();
  
  // Configurar manejo de foco en modales
  setupModalFocusManagement();
  
  // Mostrar botón de instalación si es necesario
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registrado:', registration);
        
        // Escuchar actualizaciones del SW
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showInstallButton();
            }
          });
        });
      })
      .catch(error => {
        console.error('Error registrando SW:', error);
      });
  }
  
  // Verificar si la app está instalada
  if (isAppInstalled()) {
    document.getElementById('installPWA').style.display = 'none';
  }
  
  // Mostrar mensaje de bienvenida si es la primera vez
  if (!localStorage.getItem('appInitialized')) {
    Swal.fire({
      icon: 'success',
      title: '¡Bienvenido a TillUp!',
      text: 'Tu PWA de gestión de ventas está lista para usar.',
      confirmButtonText: '¡Empezar!',
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
    localStorage.setItem('appInitialized', 'true');
  }
  
  // Calcular estadísticas iniciales
  calculateCompleteStats();
});

// === SISTEMA DE CÁLCULOS AUTOMÁTICOS MEJORADO ===

// Variables para el sistema de reportes
let dailyStats = {};
let weeklyStats = {};
let monthlyStats = {};
let yearlyStats = {};
let selectedDate = new Date();
let reportFilters = {
  startDate: null,
  endDate: null,
  type: 'all', // 'all', 'sales', 'chickens', 'debts', 'payments'
  view: 'daily' // 'daily', 'weekly', 'monthly', 'yearly'
};

// Función para calcular estadísticas completas
function calculateCompleteStats() {
  const today = new Date();
  const currentDate = selectedDate || today;
  
  // Calcular estadísticas diarias
  dailyStats = calculateDailyStats(currentDate);
  
  // Calcular estadísticas semanales
  weeklyStats = calculateWeeklyStats(currentDate);
  
  // Calcular estadísticas mensuales
  monthlyStats = calculateMonthlyStats(currentDate);
  
  // Calcular estadísticas anuales
  yearlyStats = calculateYearlyStats(currentDate);
  
  // Actualizar UI con las nuevas estadísticas
  updateBalanceUI();
  updateChickenStats();
  updateReportUI();
  
  // Guardar estadísticas en localStorage
  saveStatsToStorage();
}

// Función para calcular estadísticas diarias
function calculateDailyStats(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Filtrar ventas del día
  const dailySales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= startOfDay && saleDate <= endOfDay;
  });
  
  // Filtrar ventas de pollos del día
  const dailyChickenSales = chickenSales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= startOfDay && saleDate <= endOfDay;
  });
  
  // Filtrar deudas del día
  const dailyDebts = debts.filter(debt => {
    const debtDate = new Date(debt.date);
    return debtDate >= startOfDay && debtDate <= endOfDay;
  });
  
  // Filtrar pagos del día
  const dailyPayments = debts.flatMap(debt => 
    (debt.payments || []).filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= startOfDay && paymentDate <= endOfDay;
    }).map(payment => ({
      ...payment,
      debtId: debt.id,
      clientName: debt.clientName,
      originalAmount: debt.amount
    }))
  );
  
  // Calcular totales
  const totalSales = dailySales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSalesCost = dailySales.reduce((sum, sale) => sum + sale.cost, 0);
  const totalSalesProfit = totalSales - totalSalesCost;
  
  const totalChickenSales = dailyChickenSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalChickenCost = dailyChickenSales.reduce((sum, sale) => sum + (sale.weight * costPerPound), 0);
  const totalChickenProfit = totalChickenSales - totalChickenCost;
  
  const totalDebts = dailyDebts.reduce((sum, debt) => sum + debt.amount, 0);
  const totalPayments = dailyPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  const totalRevenue = totalSales + totalChickenSales + totalPayments;
  const totalCost = totalSalesCost + totalChickenCost;
  const totalProfit = totalRevenue - totalCost;
  
  return {
    date: date,
    sales: {
      count: dailySales.length,
      total: totalSales,
      cost: totalSalesCost,
      profit: totalSalesProfit,
      items: dailySales
    },
    chickens: {
      count: dailyChickenSales.length,
      total: totalChickenSales,
      cost: totalChickenCost,
      profit: totalChickenProfit,
      weight: dailyChickenSales.reduce((sum, sale) => sum + sale.weight, 0),
      quantity: dailyChickenSales.reduce((sum, sale) => sum + sale.quantity, 0),
      items: dailyChickenSales
    },
    debts: {
      count: dailyDebts.length,
      total: totalDebts,
      items: dailyDebts
    },
    payments: {
      count: dailyPayments.length,
      total: totalPayments,
      items: dailyPayments
    },
    summary: {
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalProfit,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    }
  };
}

// Función para calcular estadísticas semanales
function calculateWeeklyStats(date) {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return calculateStatsForPeriod(startOfWeek, endOfWeek, 'weekly');
}

// Función para calcular estadísticas mensuales
function calculateMonthlyStats(date) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return calculateStatsForPeriod(startOfMonth, endOfMonth, 'monthly');
}

// Función para calcular estadísticas anuales
function calculateYearlyStats(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const endOfYear = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
  
  return calculateStatsForPeriod(startOfYear, endOfYear, 'yearly');
}

// Función genérica para calcular estadísticas por período
function calculateStatsForPeriod(startDate, endDate, periodType) {
  // Filtrar datos por período
  const periodSales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= startDate && saleDate <= endDate;
  });
  
  const periodChickenSales = chickenSales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= startDate && saleDate <= endDate;
  });
  
  const periodDebts = debts.filter(debt => {
    const debtDate = new Date(debt.date);
    return debtDate >= startDate && debtDate <= endDate;
  });
  
  const periodPayments = debts.flatMap(debt => 
    (debt.payments || []).filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= startDate && paymentDate <= endDate;
    }).map(payment => ({
      ...payment,
      debtId: debt.id,
      clientName: debt.clientName,
      originalAmount: debt.amount
    }))
  );
  
  // Calcular totales
  const totalSales = periodSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSalesCost = periodSales.reduce((sum, sale) => sum + sale.cost, 0);
  const totalSalesProfit = totalSales - totalSalesCost;
  
  const totalChickenSales = periodChickenSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalChickenCost = periodChickenSales.reduce((sum, sale) => sum + (sale.weight * costPerPound), 0);
  const totalChickenProfit = totalChickenSales - totalChickenCost;
  
  const totalDebts = periodDebts.reduce((sum, debt) => sum + debt.amount, 0);
  const totalPayments = periodPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  const totalRevenue = totalSales + totalChickenSales + totalPayments;
  const totalCost = totalSalesCost + totalChickenCost;
  const totalProfit = totalRevenue - totalCost;
  
  // Calcular promedios diarios
  const daysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const avgDailyRevenue = totalRevenue / daysInPeriod;
  const avgDailyProfit = totalProfit / daysInPeriod;
  
  return {
    period: periodType,
    startDate: startDate,
    endDate: endDate,
    daysInPeriod: daysInPeriod,
    sales: {
      count: periodSales.length,
      total: totalSales,
      cost: totalSalesCost,
      profit: totalSalesProfit,
      avgDaily: totalSales / daysInPeriod,
      items: periodSales
    },
    chickens: {
      count: periodChickenSales.length,
      total: totalChickenSales,
      cost: totalChickenCost,
      profit: totalChickenProfit,
      weight: periodChickenSales.reduce((sum, sale) => sum + sale.weight, 0),
      quantity: periodChickenSales.reduce((sum, sale) => sum + sale.quantity, 0),
      avgDaily: totalChickenSales / daysInPeriod,
      items: periodChickenSales
    },
    debts: {
      count: periodDebts.length,
      total: totalDebts,
      avgDaily: totalDebts / daysInPeriod,
      items: periodDebts
    },
    payments: {
      count: periodPayments.length,
      total: totalPayments,
      avgDaily: totalPayments / daysInPeriod,
      items: periodPayments
    },
    summary: {
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalProfit,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      avgDailyRevenue: avgDailyRevenue,
      avgDailyProfit: avgDailyProfit
    }
  };
}

// Función para actualizar estadísticas de pollos
function updateChickenStats() {
  const today = new Date();
  const todayStats = dailyStats.chickens || { count: 0, total: 0, profit: 0, weight: 0, quantity: 0 };
  
  // Actualizar elementos en la UI
  const totalChickensSold = document.getElementById('totalChickensSold');
  const totalWeightSold = document.getElementById('totalWeightSold');
  const totalRevenue = document.getElementById('totalRevenue');
  const totalProfit = document.getElementById('totalProfit');
  const avgWeight = document.getElementById('avgWeight');
  
  if (totalChickensSold) totalChickensSold.textContent = todayStats.quantity;
  if (totalWeightSold) totalWeightSold.textContent = todayStats.weight.toFixed(1);
  if (totalRevenue) totalRevenue.textContent = `$${todayStats.total.toFixed(2)}`;
  if (totalProfit) totalProfit.textContent = `$${todayStats.profit.toFixed(2)}`;
  if (avgWeight) {
    const avg = todayStats.quantity > 0 ? todayStats.weight / todayStats.quantity : 0;
    avgWeight.textContent = avg.toFixed(1);
  }
  
  // Actualizar lista de ventas de pollos
  updateChickenSalesList();
}

// Función para actualizar UI de reportes
function updateReportUI() {
  // Actualizar tarjetas de balance
  renderBalanceGrid();
  
  // Actualizar movimientos recientes
  renderRecentMovements();
  
  // Actualizar gráficos si existen
  updateCharts();
}

// Función para guardar estadísticas en localStorage
function saveStatsToStorage() {
  const statsData = {
    dailyStats,
    weeklyStats,
    monthlyStats,
    yearlyStats,
    lastCalculated: new Date().toISOString()
  };
  
  localStorage.setItem('appStats', JSON.stringify(statsData));
}

// Función para cargar estadísticas desde localStorage
function loadStatsFromStorage() {
  const statsData = localStorage.getItem('appStats');
  if (statsData) {
    try {
      const parsed = JSON.parse(statsData);
      dailyStats = parsed.dailyStats || {};
      weeklyStats = parsed.weeklyStats || {};
      monthlyStats = parsed.monthlyStats || {};
      yearlyStats = parsed.yearlyStats || {};
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }
}

// Función para cambiar fecha seleccionada
function changeSelectedDate(newDate) {
  selectedDate = new Date(newDate);
  calculateCompleteStats();
  updateDateDisplay();
}

// Función para actualizar display de fecha
function updateDateDisplay() {
  const dateDisplay = document.getElementById('selectedDateDisplay');
  if (dateDisplay) {
    dateDisplay.textContent = selectedDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// Función para generar reporte PDF
function generateReportPDF(type = 'daily', customDate = null) {
  const reportDate = customDate || selectedDate || new Date();
  let reportData;
  
  switch (type) {
    case 'daily':
      reportData = calculateDailyStats(reportDate);
      break;
    case 'weekly':
      reportData = calculateWeeklyStats(reportDate);
      break;
    case 'monthly':
      reportData = calculateMonthlyStats(reportDate);
      break;
    case 'yearly':
      reportData = calculateYearlyStats(reportDate);
      break;
    default:
      reportData = calculateDailyStats(reportDate);
  }
  
  generateDetailedReportPDF(reportData, type);
}

// Función para generar reporte PDF detallado
function generateDetailedReportPDF(data, type) {
  if (typeof window.jspdf === 'undefined') {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'La librería PDF no está disponible.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Configurar fuente
  doc.setFont('helvetica');
  
  // Título del reporte
  doc.setFontSize(18);
  doc.text(`REPORTE ${type.toUpperCase()} - TILLUP`, 105, 20, { align: 'center' });
  
  // Fecha del reporte
  doc.setFontSize(12);
  const dateText = type === 'daily' ? 
    data.date.toLocaleDateString('es-ES') :
    `${data.startDate.toLocaleDateString('es-ES')} - ${data.endDate.toLocaleDateString('es-ES')}`;
  doc.text(`Período: ${dateText}`, 14, 35);
  
  let yPos = 50;
  
  // Resumen general
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN GENERAL', 14, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ingresos totales: $${data.summary.revenue.toFixed(2)}`, 20, yPos);
  yPos += 7;
  doc.text(`Costos totales: $${data.summary.cost.toFixed(2)}`, 20, yPos);
  yPos += 7;
  doc.text(`Ganancia total: $${data.summary.profit.toFixed(2)}`, 20, yPos);
  yPos += 7;
  doc.text(`Margen de ganancia: ${data.summary.profitMargin.toFixed(1)}%`, 20, yPos);
  yPos += 15;
  
  // Ventas regulares
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('VENTAS REGULARES', 14, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cantidad de ventas: ${data.sales.count}`, 20, yPos);
  yPos += 7;
  doc.text(`Total ventas: $${data.sales.total.toFixed(2)}`, 20, yPos);
  yPos += 7;
  doc.text(`Ganancia ventas: $${data.sales.profit.toFixed(2)}`, 20, yPos);
  yPos += 15;
  
  // Ventas de pollos
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('VENTAS DE POLLOS', 14, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cantidad de ventas: ${data.chickens.count}`, 20, yPos);
  yPos += 7;
  doc.text(`Pollos vendidos: ${data.chickens.quantity}`, 20, yPos);
  yPos += 7;
  doc.text(`Peso total: ${data.chickens.weight.toFixed(1)} lbs`, 20, yPos);
  yPos += 7;
  doc.text(`Total ventas: $${data.chickens.total.toFixed(2)}`, 20, yPos);
  yPos += 7;
  doc.text(`Ganancia pollos: $${data.chickens.profit.toFixed(2)}`, 20, yPos);
  yPos += 15;
  
  // Deudas y pagos
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DEUDAS Y PAGOS', 14, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nuevas deudas: ${data.debts.count}`, 20, yPos);
  yPos += 7;
  doc.text(`Total deudas: $${data.debts.total.toFixed(2)}`, 20, yPos);
  yPos += 7;
  doc.text(`Pagos recibidos: ${data.payments.count}`, 20, yPos);
  yPos += 7;
  doc.text(`Total pagos: $${data.payments.total.toFixed(2)}`, 20, yPos);
  
  // Pie de página
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Generado por TillUp POS', 105, 280, { align: 'center' });
  
  // Descargar PDF
  const fileName = `reporte_${type}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// Función para mostrar selector de fecha
function showDateSelector() {
  const today = new Date();
  const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  Swal.fire({
    title: 'Seleccionar Fecha',
    html: `
      <input type="date" id="dateSelector" class="form-control" 
             max="${maxDate.toISOString().split('T')[0]}" 
             value="${selectedDate.toISOString().split('T')[0]}">
    `,
    showCancelButton: true,
    confirmButtonText: 'Aplicar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const dateInput = document.getElementById('dateSelector');
      if (dateInput.value) {
        return dateInput.value;
      }
      Swal.showValidationMessage('Por favor selecciona una fecha');
      return false;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      changeSelectedDate(result.value);
      hapticFeedback('success');
    }
  });
}

// Función para resetear estadísticas diarias de pollos
function resetDailyChickenStats() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const lastReset = localStorage.getItem('lastChickenReset');
  
  if (lastReset !== todayStr) {
    // Resetear contadores diarios
    localStorage.setItem('lastChickenReset', todayStr);
    
    // Recalcular estadísticas
    calculateCompleteStats();
    
    console.log('Estadísticas diarias de pollos reseteadas');
  }
}

// Función para obtener movimientos por fecha
function getMovementsByDate(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const movements = [];
  
  // Agregar ventas regulares
  sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= startOfDay && saleDate <= endOfDay;
  }).forEach(sale => {
    movements.push({
      type: 'sale',
      date: sale.date,
      title: `Venta #${sale.id}`,
      subtitle: sale.clientName,
      amount: sale.total,
      amountClass: 'positive',
      icon: 'bi-cart-check',
      data: sale
    });
  });
  
  // Agregar ventas de pollos
  chickenSales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= startOfDay && saleDate <= endOfDay;
  }).forEach(sale => {
    movements.push({
      type: 'chicken',
      date: sale.date,
      title: `Venta Pollo #${sale.id}`,
      subtitle: sale.clientName,
      amount: sale.total,
      amountClass: 'positive',
      icon: 'bi-egg-fried',
      data: sale
    });
  });
  
  // Agregar deudas
  debts.filter(debt => {
    const debtDate = new Date(debt.date);
    return debtDate >= startOfDay && debtDate <= endOfDay;
  }).forEach(debt => {
    movements.push({
      type: 'debt',
      date: debt.date,
      title: `Deuda #${debt.id}`,
      subtitle: debt.clientName,
      amount: debt.amount,
      amountClass: 'negative',
      icon: 'bi-cash-stack',
      data: debt
    });
  });
  
  // Agregar pagos
  debts.forEach(debt => {
    (debt.payments || []).filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= startOfDay && paymentDate <= endOfDay;
    }).forEach(payment => {
      movements.push({
        type: 'payment',
        date: payment.date,
        title: `Pago Deuda #${debt.id}`,
        subtitle: debt.clientName,
        amount: payment.amount,
        amountClass: 'positive',
        icon: 'bi-cash-coin',
        data: { debt, payment }
      });
    });
  });
  
  // Ordenar por fecha
  return movements.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Función para renderizar movimientos por fecha
function renderMovementsByDate(date) {
  const movements = getMovementsByDate(date);
  const container = document.getElementById('movementsList');
  
  if (!container) return;
  
  if (movements.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">Sin movimientos en esta fecha</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = movements.map((movement, idx) => `
    <div class="movement-item-treinta" onclick="showMovementDetail(${idx}, '${date.toISOString().split('T')[0]}')" style="cursor:pointer;">
      <div class="movement-icon">
        <i class="bi ${movement.icon}"></i>
      </div>
      <div class="movement-content">
        <div class="movement-title">${movement.title}</div>
        <div class="movement-subtitle">${movement.subtitle}</div>
      </div>
      <div class="movement-amount ${movement.amountClass}">
        $${movement.amount.toFixed(2)}
      </div>
    </div>
  `).join('');
}

// Función para mostrar detalle de movimiento por fecha
function showMovementDetail(index, dateStr) {
  const date = new Date(dateStr);
  const movements = getMovementsByDate(date);
  const movement = movements[index];
  
  if (!movement) return;
  
  switch (movement.type) {
    case 'sale':
      showReceipt(movement.data);
      break;
    case 'chicken':
      showChickenReceipt(movement.data);
      break;
    case 'debt':
      showDebtDetailModal(movement.data.id);
      break;
    case 'payment':
      const { debt, payment } = movement.data;
      Swal.fire({
        icon: 'info',
        title: 'Pago de deuda',
        html: `
          <div class="payment-detail">
            <div><strong>Cliente:</strong> ${debt.clientName}</div>
            <div><strong>Monto:</strong> $${payment.amount.toFixed(2)}</div>
            <div><strong>Fecha:</strong> ${new Date(payment.date).toLocaleString()}</div>
            <div><strong>Deuda:</strong> #${debt.id}</div>
          </div>
        `,
        confirmButtonText: 'Cerrar'
      });
      break;
  }
}

// Función para cambiar tipo de reporte
function changeReportType() {
  const reportType = document.getElementById('reportType').value;
  reportFilters.view = reportType;
  
  // Actualizar filtros de fecha según el tipo
  const today = new Date();
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  switch (reportType) {
    case 'daily':
      startDateInput.value = today.toISOString().split('T')[0];
      endDateInput.value = today.toISOString().split('T')[0];
      break;
    case 'weekly':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      startDateInput.value = startOfWeek.toISOString().split('T')[0];
      endDateInput.value = endOfWeek.toISOString().split('T')[0];
      break;
    case 'monthly':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      startDateInput.value = startOfMonth.toISOString().split('T')[0];
      endDateInput.value = endOfMonth.toISOString().split('T')[0];
      break;
    case 'yearly':
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      
      startDateInput.value = startOfYear.toISOString().split('T')[0];
      endDateInput.value = endOfYear.toISOString().split('T')[0];
      break;
  }
  
  // Recalcular estadísticas
  calculateCompleteStats();
  updateReportUI();
}

// Función para cambiar filtro de reporte
function changeReportFilter() {
  const reportFilter = document.getElementById('reportFilter').value;
  reportFilters.type = reportFilter;
  
  // Actualizar UI según el filtro
  updateReportUI();
}



// Función para obtener estadísticas filtradas
function getFilteredStats() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return calculateStatsForPeriod(start, end, reportFilters.view);
  }
  
  // Si no hay fechas específicas, usar las estadísticas actuales
  switch (reportFilters.view) {
    case 'daily':
      return dailyStats;
    case 'weekly':
      return weeklyStats;
    case 'monthly':
      return monthlyStats;
    case 'yearly':
      return yearlyStats;
    default:
      return dailyStats;
  }
}

// Función para inicializar el sistema de reportes
function initializeReportsSystem() {
  // Cargar estadísticas guardadas
  loadStatsFromStorage();
  
  // Calcular estadísticas iniciales
  calculateCompleteStats();
  
  // Configurar fechas por defecto
  const today = new Date();
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput && endDateInput) {
    startDateInput.value = today.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];
  }
  
  // Actualizar display de fecha
  updateDateDisplay();
  
  // Actualizar UI
  updateReportUI();
  
  // Configurar reset diario de estadísticas de pollos
  resetDailyChickenStats();
}

// Función para mostrar vista de reportes
function showReportsView() {
  // Ocultar todas las vistas
  document.querySelectorAll('.view-content').forEach(view => {
    view.style.display = 'none';
  });
  
  // Mostrar vista de reportes
  const reportsView = document.getElementById('reportsView');
  if (reportsView) {
    reportsView.style.display = 'block';
    
    // Inicializar sistema si no se ha hecho
    if (!reportsView.dataset.initialized) {
      initializeReportsSystem();
      reportsView.dataset.initialized = 'true';
    }
  }
  
  // Actualizar navegación
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.getElementById('nav-reports').classList.add('active');
}

// Función para generar reporte PDF con filtros actuales
function generateFilteredReportPDF() {
  const reportType = document.getElementById('reportType').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  if (startDate && endDate) {
    const customDate = new Date(startDate);
    generateReportPDF(reportType, customDate);
  } else {
    generateReportPDF(reportType);
  }
}

// Función para exportar datos en diferentes formatos
function exportReportData(format = 'pdf') {
  const stats = getFilteredStats();
  
  switch (format) {
    case 'pdf':
      generateFilteredReportPDF();
      break;
    case 'json':
      exportAsJSON(stats);
      break;
    case 'csv':
      exportAsCSV(stats);
      break;
    default:
      generateFilteredReportPDF();
  }
}

// Función para exportar como JSON
function exportAsJSON(data) {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}

// Función para exportar como CSV
function exportAsCSV(data) {
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Encabezados
  csvContent += "Categoría,Valor\n";
  
  // Datos
  csvContent += `Ingresos Totales,${data.summary.revenue}\n`;
  csvContent += `Costos Totales,${data.summary.cost}\n`;
  csvContent += `Ganancia Total,${data.summary.profit}\n`;
  csvContent += `Margen de Ganancia,${data.summary.profitMargin}\n`;
  csvContent += `Ventas Regulares,${data.sales.count}\n`;
  csvContent += `Total Ventas Regulares,${data.sales.total}\n`;
  csvContent += `Ganancia Ventas Regulares,${data.sales.profit}\n`;
  csvContent += `Ventas de Pollos,${data.chickens.count}\n`;
  csvContent += `Pollos Vendidos,${data.chickens.quantity}\n`;
  csvContent += `Peso Total Pollos,${data.chickens.weight}\n`;
  csvContent += `Total Ventas Pollos,${data.chickens.total}\n`;
  csvContent += `Ganancia Pollos,${data.chickens.profit}\n`;
  csvContent += `Deudas,${data.debts.count}\n`;
  csvContent += `Total Deudas,${data.debts.total}\n`;
  csvContent += `Pagos Recibidos,${data.payments.count}\n`;
  csvContent += `Total Pagos,${data.payments.total}\n`;
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `reporte_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Función para mostrar comparación de períodos
function showPeriodComparison() {
  const currentStats = getFilteredStats();
  
  // Obtener estadísticas del período anterior para comparar
  const startDate = new Date(document.getElementById('startDate').value);
  const endDate = new Date(document.getElementById('endDate').value);
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(startDate.getDate() - daysDiff);
  const previousEndDate = new Date(endDate);
  previousEndDate.setDate(endDate.getDate() - daysDiff);
  
  const previousStats = calculateStatsForPeriod(previousStartDate, previousEndDate, reportFilters.view);
  
  // Calcular cambios porcentuales
  const revenueChange = previousStats.summary.revenue > 0 ? 
    ((currentStats.summary.revenue - previousStats.summary.revenue) / previousStats.summary.revenue) * 100 : 0;
  
  const profitChange = previousStats.summary.profit > 0 ? 
    ((currentStats.summary.profit - previousStats.summary.profit) / previousStats.summary.profit) * 100 : 0;
  
  // Mostrar comparación
  Swal.fire({
    title: 'Comparación de Períodos',
    html: `
      <div class="comparison-container">
        <div class="comparison-item">
          <h6>Ingresos</h6>
          <div class="comparison-values">
            <span class="current">$${currentStats.summary.revenue.toFixed(2)}</span>
            <span class="change ${revenueChange >= 0 ? 'positive' : 'negative'}">
              ${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%
            </span>
          </div>
        </div>
        <div class="comparison-item">
          <h6>Ganancia</h6>
          <div class="comparison-values">
            <span class="current">$${currentStats.summary.profit.toFixed(2)}</span>
            <span class="change ${profitChange >= 0 ? 'positive' : 'negative'}">
              ${profitChange >= 0 ? '+' : ''}${profitChange.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    `,
    confirmButtonText: 'Cerrar',
    width: '500px'
  });
}

// Función para mostrar tendencias
function showTrends() {
  // Obtener datos de los últimos 7 días para mostrar tendencias
  const trends = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayStats = calculateDailyStats(date);
    trends.push({
      date: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      revenue: dayStats.summary.revenue,
      profit: dayStats.summary.profit
    });
  }
  
  // Mostrar gráfico de tendencias (simulado con texto)
  let trendsHTML = '<div class="trends-container">';
  trends.forEach(trend => {
    trendsHTML += `
      <div class="trend-item">
        <div class="trend-date">${trend.date}</div>
        <div class="trend-bar" style="width: ${(trend.revenue / Math.max(...trends.map(t => t.revenue))) * 100}%"></div>
        <div class="trend-values">
          <span>$${trend.revenue.toFixed(2)}</span>
          <span class="profit">$${trend.profit.toFixed(2)}</span>
        </div>
      </div>
    `;
  });
  trendsHTML += '</div>';
  
  Swal.fire({
    title: 'Tendencias de la Semana',
    html: trendsHTML,
    confirmButtonText: 'Cerrar',
    width: '600px'
  });
}

// Función para configurar eventos de reportes
function setupReportsEvents() {
  // Evento para cambio de fecha en filtros
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput) {
    startDateInput.addEventListener('change', () => {
      calculateCompleteStats();
      updateReportUI();
    });
  }
  
  if (endDateInput) {
    endDateInput.addEventListener('change', () => {
      calculateCompleteStats();
      updateReportUI();
    });
  }
  
  // Evento para botón de comparación
  const compareBtn = document.querySelector('[onclick="showPeriodComparison()"]');
  if (compareBtn) {
    compareBtn.addEventListener('click', showPeriodComparison);
  }
  
  // Evento para botón de tendencias
  const trendsBtn = document.querySelector('[onclick="showTrends()"]');
  if (trendsBtn) {
    trendsBtn.addEventListener('click', showTrends);
  }
}

// Función para actualizar balance UI con nuevas estadísticas
function updateBalanceUI() {
  // Obtener estadísticas actuales
  const stats = getFilteredStats();
  
  // Actualizar tarjetas de balance
  const balanceCards = document.getElementById('balanceCards');
  if (balanceCards) {
    balanceCards.innerHTML = `
      <div class="col-md-3 mb-3">
        <div class="balance-card-treinta income">
          <div class="balance-card-header">
            <div class="balance-card-icon">
              <i class="bi bi-cash-coin"></i>
            </div>
            <div class="balance-card-title">Ingresos</div>
          </div>
          <div class="balance-card-amount income">$${stats.summary.revenue.toFixed(2)}</div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="balance-card-treinta expenses">
          <div class="balance-card-header">
            <div class="balance-card-icon">
              <i class="bi bi-cart-x"></i>
            </div>
            <div class="balance-card-title">Costos</div>
          </div>
          <div class="balance-card-amount expenses">$${stats.summary.cost.toFixed(2)}</div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="balance-card-treinta profit">
          <div class="balance-card-header">
            <div class="balance-card-icon">
              <i class="bi bi-graph-up-arrow"></i>
            </div>
            <div class="balance-card-title">Ganancia</div>
          </div>
          <div class="balance-card-amount profit">$${stats.summary.profit.toFixed(2)}</div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="balance-card-treinta credits">
          <div class="balance-card-header">
            <div class="balance-card-icon">
              <i class="bi bi-percent"></i>
            </div>
            <div class="balance-card-title">Margen</div>
          </div>
          <div class="balance-card-amount">${stats.summary.profitMargin.toFixed(1)}%</div>
        </div>
      </div>
    `;
  }
  
  // Actualizar movimientos recientes
  renderRecentMovements();
}

// Función para renderizar movimientos recientes
function renderRecentMovements() {
  const movements = getMovementsByDate(selectedDate);
  const movementsList = document.getElementById('movementsList');
  
  if (!movementsList) return;
  
  if (movements.length === 0) {
    movementsList.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">Sin movimientos en esta fecha</p>
      </div>
    `;
    return;
  }
  
  // Limitar a los últimos 10 movimientos
  const recentMovements = movements.slice(0, 10);
  
  movementsList.innerHTML = recentMovements.map((movement, idx) => `
    <div class="movement-item-treinta" onclick="showMovementDetail(${idx}, '${selectedDate.toISOString().split('T')[0]}')">
      <div class="movement-icon">
        <i class="bi ${movement.icon}"></i>
      </div>
      <div class="movement-content">
        <div class="movement-title">${movement.title}</div>
        <div class="movement-subtitle">${movement.subtitle}</div>
      </div>
      <div class="movement-amount ${movement.amountClass}">
        $${movement.amount.toFixed(2)}
      </div>
    </div>
  `).join('');
  
  // Actualizar contador de movimientos
  const movementsCount = document.getElementById('movementsCount');
  if (movementsCount) {
    movementsCount.textContent = `${movements.length} movimientos`;
  }
}

// Función para actualizar gráficos (placeholder para futuras implementaciones)
function updateCharts() {
  // Aquí se pueden agregar gráficos con librerías como Chart.js
  // Por ahora es un placeholder
  console.log('Gráficos actualizados');
}

