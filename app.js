// Evento para filtrar pollos por fecha seleccionada
document.addEventListener('DOMContentLoaded', function() {
  const btnFilterChickenDate = document.getElementById('btnFilterChickenDate');
  const inputFilterChickenDate = document.getElementById('filterChickenDate');
  if (btnFilterChickenDate && inputFilterChickenDate) {
    btnFilterChickenDate.addEventListener('click', function() {
      const fecha = inputFilterChickenDate.value;
      if (fecha) {
        updateChickenStats({ fecha });
        updateChickenSalesList({ fecha });
      } else {
        // Si no hay fecha, mostrar el día actual
        updateChickenStats();
        updateChickenSalesList();
      }
    });
  }
});
// === Arrays globales ===
let products = [];
let clients = [];
let sales = [];
let debts = [];
let movements = [];
let cart = [];
let currentClientId = null;
let inventoryViewMode = 'grid';
let clientsViewMode = 'grid';
localforage.getItem('inventoryViewMode').then(val => { if(val) inventoryViewMode = val; });
localforage.getItem('clientsViewMode').then(val => { if(val) clientsViewMode = val; });
// Variables globales para pollos
let chickenSales = [];
let pricePerPound = 0;
let costPerPound = 0;

// Función helper para obtener la fecha actual de Ecuador (UTC-5)
function getEcuadorDate() {
  const now = new Date();
  const ecuadorOffset = -5 * 60; // UTC-5 en minutos
  return new Date(now.getTime() + (ecuadorOffset * 60 * 1000));
}

// Función helper para obtener la fecha de Ecuador en formato YYYY-MM-DD
function getEcuadorDateString() {
  return getEcuadorDate().toISOString().slice(0, 10);
}

// Función helper para normalizar fechas
function normalizeDate(dateInput) {
  if (!dateInput) return null;
  
  if (typeof dateInput === 'string') {
    // Si ya es formato ISO (contiene 'T'), usar directamente
    if (dateInput.includes('T')) {
      return new Date(dateInput);
    } else {
      // Si es formato YYYY-MM-DD, agregar tiempo
      return new Date(dateInput + 'T00:00:00');
    }
  } else {
    // Si es Date object o timestamp
    return new Date(dateInput);
  }
}

// Variables globales para movimientos
let movementsViewMode = 'list'; // 'list' o 'grid'
let currentMovementFilter = 'today';
let currentChartType = 'trend';
let movementCharts = {};
let mainChart = null;
let movementsViewInitialized = false; // Bandera para evitar inicializaciones múltiples

// Función para actualizar el display del período
function updatePeriodDisplay(period) {
  const periodDisplay = document.getElementById('periodDisplay');
  if (!periodDisplay) return;
  
  const periodTexts = {
    'today': 'Hoy',
    'week': 'Esta Semana',
    'month': 'Este Mes',
    'year': 'Este Año',
    'custom': 'Período Personalizado'
  };
  
  periodDisplay.textContent = periodTexts[period] || 'Hoy';
}

// Función para actualizar la gráfica principal
function updateMainChart() {
  if (!mainChart) return;
  
  try {
    const { startDate, endDate } = getDateRangeFromFilter(currentMovementFilter);
    const movements = getAllMovementsInRange(startDate, endDate);
    
    if (currentChartType === 'trend') {
      const trendData = getTrendChartData(movements, startDate, endDate);
      mainChart.data = trendData;
      if (mainChart.options.scales && mainChart.options.scales.y) {
        mainChart.options.scales.y.beginAtZero = true;
        mainChart.options.scales.y.ticks.callback = function(value) {
          return '$' + (value || 0).toFixed(2);
        };
      }
    } else {
      const distributionData = getDistributionChartData(movements);
      mainChart.data = distributionData;
      if (mainChart.options.scales && mainChart.options.scales.y) {
        mainChart.options.scales.y.beginAtZero = true;
        mainChart.options.scales.y.ticks.callback = function(value) {
          return '$' + (value || 0).toFixed(2);
        };
      }
    }
    
    mainChart.update('active');
  } catch (error) {
    console.error('Error actualizando gráfica principal:', error);
  }
}

// Función para obtener datos de gráfica de tendencias
function getTrendChartData(movements, startDate, endDate) {
  const labels = [];
  const salesData = [];
  const chickenData = [];
  const debtsData = [];
  const paymentsData = [];
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    labels.push(currentDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
    
    const dayMovements = movements.filter(m => {
      const mDate = new Date(m.date);
      return mDate.toDateString() === currentDate.toDateString();
    });
    
    salesData.push(dayMovements.filter(m => m.type === 'sale').reduce((sum, m) => sum + (m.amount || 0), 0));
    chickenData.push(dayMovements.filter(m => m.type === 'chicken').reduce((sum, m) => sum + (m.amount || 0), 0));
    debtsData.push(dayMovements.filter(m => m.type === 'debt').reduce((sum, m) => sum + (m.amount || 0), 0));
    paymentsData.push(dayMovements.filter(m => m.type === 'payment').reduce((sum, m) => sum + (m.amount || 0), 0));
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    labels: labels,
    datasets: [
      {
        label: 'Ventas Normales',
        data: salesData,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4
      },
      {
        label: 'Ventas de Pollos',
        data: chickenData,
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.4
      },
      {
        label: 'Deudas',
        data: debtsData,
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4
      },
      {
        label: 'Pagos',
        data: paymentsData,
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4
      }
    ]
  };
}

// Función para obtener datos de gráfica de distribución
function getDistributionChartData(movements) {
  const salesTotal = movements.filter(m => m.type === 'sale').reduce((sum, m) => sum + (m.amount || 0), 0);
  const chickenTotal = movements.filter(m => m.type === 'chicken').reduce((sum, m) => sum + (m.amount || 0), 0);
  const debtsTotal = movements.filter(m => m.type === 'debt').reduce((sum, m) => sum + (m.amount || 0), 0);
  const paymentsTotal = movements.filter(m => m.type === 'payment').reduce((sum, m) => sum + (m.amount || 0), 0);
  
  return {
    labels: ['Ventas Normales', 'Ventas de Pollos', 'Deudas', 'Pagos'],
    datasets: [{
      data: [salesTotal, chickenTotal, debtsTotal, paymentsTotal],
      backgroundColor: ['#4CAF50', '#FF9800', '#F44336', '#2196F3'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };
}

// === FUNCIÓN DE CARGA DE DATOS MEJORADA ===
async function loadData() {
  try {
    // Usar el nuevo sistema de persistencia mejorado
    const data = await loadAllCriticalData();
    
    // Asignar datos a variables globales
    products = data.products || [];
    clients = data.clients || [];
    sales = data.sales || [];
    debts = data.debts || [];
    movements = data.movements || [];
    chickenSales = data.chickenSales || [];
    pricePerPound = data.pricePerPound || 2.50;
    costPerPound = data.costPerPound || 0;
    
    // Validar integridad de datos
    const integrity = validateDataIntegrity();
    if (!integrity.valid) {
      console.warn('Problemas de integridad detectados, limpiando datos corruptos...');
      cleanCorruptedData();
    }
    
    console.log('Datos cargados correctamente:', {
      products: products.length,
      clients: clients.length,
      sales: sales.length,
      debts: debts.length,
      chickenSales: chickenSales.length,
      integrity: integrity.valid
    });
    
    // Iniciar backup automático
    startAutoBackup();
    
    // Configurar detección de cambios para backup automático
    setupDataChangeDetection();
    
  } catch (error) {
    console.error('Error cargando datos:', error);
    // Inicializar arrays vacíos en caso de error
    products = [];
    clients = [];
    sales = [];
    debts = [];
    chickenSales = [];
    pricePerPound = 2.50;
    costPerPound = 0;
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
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const horizontalThreshold = 60; // Sensibilidad normal
  const verticalThreshold = 120;  // Más exigente para evitar pull-to-refresh accidental

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
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Swipe horizontal
      if (diffX > horizontalThreshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (diffX < -horizontalThreshold && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      // Swipe vertical
      if (diffY > verticalThreshold && onSwipeUp) {
        onSwipeUp();
      } else if (diffY < -verticalThreshold && onSwipeDown) {
        onSwipeDown();
      }
    }
  }
}

// Función para feedback táctil (vibración)
function hapticFeedback(type = 'light') {
  try {
    if ('vibrate' in navigator && navigator.vibrate) {
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
  } catch (error) {
    // Silenciar errores de vibración (Chrome bloquea en algunos casos)
    console.debug('Vibración no disponible:', error.message);
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
  const threshold = 200; // Aumentado significativamente el umbral para hacer más difícil activar el refresh
  let isPulling = false;
  let isScrolled = false;
  let hasMoved = false;

  container.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isScrolled = container.scrollTop > 0;
    isPulling = !isScrolled; // Solo permitir pull si estamos en la parte superior
    hasMoved = false;
  });

  container.addEventListener('touchmove', (e) => {
    if (!isPulling || isScrolled) return;
    
    currentY = e.touches[0].clientY;
    pullDistance = currentY - startY;
    
    // Solo activar si el movimiento es significativamente hacia abajo
    if (pullDistance > 50) {
      hasMoved = true;
    }
    
    if (pullDistance > 0 && container.scrollTop === 0 && hasMoved) {
      if (pullDistance < threshold) {
        e.preventDefault();
        container.style.transform = `translateY(${Math.min(pullDistance * 0.2, threshold)}px)`; // Reducido el factor de multiplicación
      }
    }
  });

  container.addEventListener('touchend', () => {
    // Solo activar refresh si se cumplen todas las condiciones
    if (isPulling && pullDistance > threshold && !isScrolled && hasMoved) {
      // Agregar un pequeño delay para evitar activaciones accidentales
      setTimeout(() => {
        onRefresh();
        hapticFeedback('success');
      }, 100);
    }
    
    container.style.transform = '';
    container.style.transition = 'transform 0.3s ease-out';
    setTimeout(() => {
      container.style.transition = '';
    }, 300);
    
    isPulling = false;
    pullDistance = 0;
    hasMoved = false;
  });
}

// Función para detectar dispositivos móviles
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
}

// Función para prevenir recargas accidentales en móviles
function preventMobileReload() {
  // Solo aplicar en dispositivos móviles
  if (!isMobileDevice()) return;
  
  // Prevenir el comportamiento de pull-to-refresh nativo del navegador
  document.addEventListener('touchmove', (e) => {
    // Solo prevenir en el body principal, no en elementos con scroll
    if (e.target === document.body || e.target === document.documentElement) {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop <= 0 && e.touches[0].clientY > 0) {
        // Permitir un pequeño margen para gestos naturales
        if (e.touches[0].clientY > 50) {
          e.preventDefault();
        }
      }
    }
  }, { passive: false });
  
  // Prevenir recarga con gestos de swipe
  let startX = 0;
  let startY = 0;
  
  document.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  });
  
  document.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = Math.abs(endX - startX);
    const deltaY = Math.abs(endY - startY);
    
    // Prevenir gestos de swipe que podrían recargar la página
    if (deltaX > 100 && deltaY < 50) {
      e.preventDefault();
    }
  });
}

// Función para mejorar la experiencia de scroll
function setupSmoothScroll() {
  const scrollElements = document.querySelectorAll('.movements-list-treinta, .products-grid-treinta, .clients-grid');
  
  scrollElements.forEach(element => {
    // Solo aplicar scroll suave en elementos específicos y no en el body
    if (element !== document.body && element !== document.documentElement) {
      element.style.scrollBehavior = 'smooth';
      element.style.webkitOverflowScrolling = 'touch';
    }
  });
  
  // Prevenir scroll suave en el body para evitar conflictos
  document.body.style.scrollBehavior = 'auto';
  document.documentElement.style.scrollBehavior = 'auto';
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

// Se elimina la función local isValidEmail, se usará la versión global de utils.js

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
  let lastVisibilityChange = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      lastVisibilityChange = Date.now();
    }
  });

  window.addEventListener('error', (e) => {
    // Filtrar errores irrelevantes o de recursos externos
    const isResourceError = e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK');
    const isEmptyError = !e.error && !e.message && !e.filename;
    const isNullError = e.error === null || e.error === undefined;
    const justResumed = Date.now() - lastVisibilityChange < 1500; // 1.5 segundos tras volver a primer plano

    if (isResourceError || isEmptyError || isNullError || justResumed) {
      // No mostrar alerta
      return;
    }

    console.error('Error:', e.error || e.message || e);
    hapticFeedback('error');
    // Mostrar notificación de error relevante
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
}

// === GESTIÓN DE POLLOS ===

// === Inicialización y Validación de Datos ===
async function initializeData() {
  try {
    // Usar el nuevo sistema de carga de datos mejorado
    await loadData();
    
    // Inicializar datos de pollos
    initializeChickenData();
    
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
    // Inicializar con arrays vacíos en caso de error
    products = [];
    clients = [];
    sales = [];
    debts = [];
    movements = [];
    chickenSales = [];
  }
}

// Función para forzar verificación de actualizaciones
window.forceUpdateCheck = function() {
  hapticFeedback('medium');
  // Recargar la página para verificar actualizaciones
  window.location.reload();
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
  
  // Configurar pull-to-refresh en contenedores principales
  const mainContainer = document.getElementById('mainContent');
  if (mainContainer) {
    setupPullToRefresh(mainContainer, () => {
      // En lugar de recargar la página, solo actualizar los datos
      loadData().then(() => {
        updateBalanceUI();
        renderInventory();
        renderClients();
        renderDebts();
        console.log('Datos actualizados sin recargar la página');
      });
    });
  }
  
  // Prevenir recarga accidental en dispositivos móviles
  preventMobileReload();
  
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
function quickAction(action) {
  // Efecto visual de feedback
  const btn = document.getElementById('quickActionsBtn');
  if (btn) {
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 150);
  }
  
  // Haptic feedback en dispositivos móviles
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
  
  switch(action) {
    case 'newSale':
      showView('sales');
      clearCart();
      // Enfocar en la búsqueda de productos
      setTimeout(() => {
        const searchInput = document.getElementById('productSearch');
        if (searchInput) searchInput.focus();
      }, 100);
      break;
      
    case 'newChickenSale':
      showView('chickens');
      // Limpiar formulario de pollos
      const chickenForm = document.getElementById('chickenSaleForm');
      if (chickenForm) chickenForm.reset();
      // Enfocar en el primer campo
      setTimeout(() => {
        const firstInput = document.querySelector('#chickenSaleForm input');
        if (firstInput) firstInput.focus();
      }, 100);
      break;
      
    case 'addProduct':
      // Abrir modal de producto
      const modalProduct = new bootstrap.Modal(document.getElementById('modalProduct'));
      modalProduct.show();
      // Limpiar formulario
      const productForm = document.getElementById('formProduct');
      if (productForm) productForm.reset();
      // Enfocar en el nombre del producto
      setTimeout(() => {
        const nameInput = document.getElementById('productName');
        if (nameInput) nameInput.focus();
      }, 100);
      break;
      
    case 'addClient':
      // Abrir modal de cliente
      const modalClient = new bootstrap.Modal(document.getElementById('modalClient'));
      modalClient.show();
      // Limpiar formulario
      const clientForm = document.getElementById('formClient');
      if (clientForm) clientForm.reset();
      // Enfocar en el nombre del cliente
      setTimeout(() => {
        const nameInput = document.getElementById('clientName');
        if (nameInput) nameInput.focus();
      }, 100);
      break;
      
    case 'viewBalance':
      showView('balance');
      updateBalanceUI();
      break;
      
    case 'viewDebts':
      showView('debt');
      loadDebts();
      break;
      
    case 'exportData':
      // Mostrar opciones de exportación
      Swal.fire({
        title: 'Exportar Datos',
        text: '¿Qué datos deseas exportar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ventas',
        cancelButtonText: 'Cancelar',
        showDenyButton: true,
        denyButtonText: 'Balance',
        showCloseButton: true,
        customClass: {
          popup: 'swal2-sale-treinta'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          generatePDF('sales');
        } else if (result.isDenied) {
          generatePDF('balance');
        }
      });
      break;
      
    case 'clearCache':
      // Limpiar cache y datos locales
      Swal.fire({
        title: 'Limpiar Cache',
        text: '¿Estás seguro de que quieres limpiar el cache? Esto no afectará tus datos guardados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, limpiar',
        cancelButtonText: 'Cancelar',
        customClass: {
          popup: 'swal2-sale-treinta'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          // Limpiar cache del service worker
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name);
              });
            });
          }
          
          // Limpiar localStorage temporal
          const keysToKeep = ['sales', 'products', 'clients', 'chickenSales', 'debts', 'settings'];
          Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
              localStorage.removeItem(key);
            }
          });
          
          Swal.fire({
            title: 'Cache Limpiado',
            text: 'El cache ha sido limpiado exitosamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            customClass: {
              popup: 'swal2-sale-treinta'
            }
          });
        }
      });
      break;
    case 'filterByDate':
      Swal.fire({
        title: 'Selecciona una fecha',
        input: 'date',
        inputLabel: 'Filtrar registros por fecha',
        showCancelButton: true,
        confirmButtonText: 'Filtrar',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'swal2-sale-treinta' }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const selectedDate = result.value;
          filtrarPorFecha(selectedDate);
        }
      });
      break;
  }
  
  // Cerrar el menú desplegable
  const dropdown = document.querySelector('.dropdown-menu.show');
  if (dropdown) {
    const dropdownToggle = document.querySelector('[data-bs-toggle="dropdown"]');
    if (dropdownToggle) {
      const bsDropdown = bootstrap.Dropdown.getInstance(dropdownToggle);
      if (bsDropdown) bsDropdown.hide();
    }
  }
}

// === GESTIÓN DE POLLOS ===

// Inicializar datos de pollos
function initializeChickenData() {
  // Inicializar campos de configuración de precio
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  const saleDateInput = document.getElementById('chickenSaleDate');
  
  if (priceInput) priceInput.value = pricePerPound.toFixed(2);
  if (costInput) costInput.value = costPerPound.toFixed(2);
  if (saleDateInput) {
    // Usar fecha local de Ecuador
    saleDateInput.value = getEcuadorDateString();
  }
  
  // Actualizar cálculo inicial
  updateChickenCalculation();
}

// Actualizar precio por libra
async function updatePricePerPound() {
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  const newPrice = parseFloat(priceInput.value);
  const newCost = costInput ? parseFloat(costInput.value) : 0;
  
  if (isNaN(newPrice) || newPrice < 0) {
    Swal.fire({
      icon: 'error',
      title: 'Precio inválido',
      text: 'Por favor ingresa un precio válido mayor a 0.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  if (costInput && (isNaN(newCost) || newCost < 0)) {
    Swal.fire({
      icon: 'error',
      title: 'Costo inválido',
      text: 'Por favor ingresa un costo válido mayor a 0.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  try {
    pricePerPound = newPrice;
    costPerPound = newCost;
    if (typeof localforage !== 'undefined') {
      await localforage.setItem('pricePerPound', pricePerPound.toString());
      await localforage.setItem('costPerPound', costPerPound.toString());
    } else {
      localStorage.setItem('pricePerPound', pricePerPound.toString());
      localStorage.setItem('costPerPound', costPerPound.toString());
    }
    updateChickenCalculation();
    Swal.fire({
      icon: 'success',
      title: 'Precios actualizados',
      text: `Precio por libra: $${pricePerPound.toFixed(2)}\nCosto por libra: $${costPerPound.toFixed(2)}`,
      confirmButtonText: 'Aceptar'
    });
  } catch (error) {
    console.error('Error actualizando precios:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron actualizar los precios. Inténtalo de nuevo.',
      confirmButtonText: 'Aceptar'
    });
  }
}
  


// Manejar venta de pollos
async function handleChickenSale(e) {
  e.preventDefault();
  
  // Obtener datos del formulario
  const clientId = document.getElementById('chickenClient').value;
  const quantity = parseInt(document.getElementById('chickenQuantity').value);
  const weight = parseFloat(document.getElementById('chickenWeight').value);
  const saleDate = document.getElementById('chickenSaleDate').value;
  const pricePerPound = parseFloat(document.getElementById('pricePerPound').value);
  const costPerPound = parseFloat(document.getElementById('costPerPound').value);
  const paymentType = document.querySelector('input[name="chickenPayment"]:checked').value;
  const abono = paymentType === 'credit' ? parseFloat(document.getElementById('chickenAbono').value) || 0 : 0;
  
  // Validaciones
  if (!clientId) {
    Swal.fire({
      icon: 'error',
      title: 'Cliente requerido',
      text: 'Selecciona un cliente para la venta.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  if (!weight || weight <= 0) {
    Swal.fire({
      icon: 'error',
      title: 'Peso inválido',
      text: 'Ingresa un peso válido mayor a 0.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  if (!pricePerPound || pricePerPound <= 0) {
    Swal.fire({
      icon: 'error',
      title: 'Precio inválido',
      text: 'Configura un precio válido en la sección de configuración.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  // Calcular totales
  const total = pricePerPound * weight;
  const profit = (pricePerPound - costPerPound) * weight;
  
  // Crear objeto de venta con fecha y hora local de Ecuador
  let now = new Date();
  // Asegurar que usamos la fecha seleccionada o la fecha actual de Ecuador
  let dateToUse = saleDate;
  if (!dateToUse) {
    dateToUse = getEcuadorDateString();
  }
  let [year, month, day] = dateToUse.split('-');
  let localDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  );
  const sale = {
    id: Date.now(),
    clientId: clientId,
    clientName: clients.find(c => c.id === clientId)?.name || 'Cliente desconocido',
    quantity: quantity,
    weight: weight,
    pricePerPound: pricePerPound,
    costPerPound: costPerPound,
    total: total,
    profit: profit,
    paymentType: paymentType,
    abono: abono,
    debt: paymentType === 'credit' ? total - abono : 0,
    date: `${year}-${month}-${day}T${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`,
    time: localDate.toLocaleTimeString(),
    timestamp: localDate.toLocaleString()
  };
  
  // Procesar la venta
  await processChickenSale(sale);
}

// === Cálculo de Merma de Pollo ===
document.addEventListener('DOMContentLoaded', function() {
  const btnMermaPollo = document.getElementById('btnMermaPollo');
  if (btnMermaPollo) {
    btnMermaPollo.addEventListener('click', function() {
      const modal = new bootstrap.Modal(document.getElementById('modalMermaPollo'));
      document.getElementById('formMermaPollo').reset();
      document.getElementById('porcentajeMerma').value = '';
      document.getElementById('costoRealLibra').value = '';
      modal.show();
    });
  }

  // Lógica de cálculo en tiempo real
  const inputs = ['precioPluma', 'manoObra', 'pesoPluma', 'pesoPelado'];
  inputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', calcularMermaPollo);
    }
  });

  function calcularMermaPollo() {
    const precioPluma = parseFloat(document.getElementById('precioPluma').value) || 0;
    const manoObra = parseFloat(document.getElementById('manoObra').value) || 0;
    const pesoPluma = parseFloat(document.getElementById('pesoPluma').value) || 0;
    const pesoPelado = parseFloat(document.getElementById('pesoPelado').value) || 0;
    let porcentajeMerma = '';
    let costoRealLibra = '';
    if (pesoPluma > 0 && pesoPelado > 0) {
      porcentajeMerma = ((1 - (pesoPelado / pesoPluma)) * 100).toFixed(2) + '%';
      costoRealLibra = (((precioPluma * pesoPluma) + manoObra) / pesoPelado).toFixed(2);
    }
    document.getElementById('porcentajeMerma').value = porcentajeMerma;
    document.getElementById('costoRealLibra').value = costoRealLibra ? `$${costoRealLibra}` : '';
  }

  // Actualizar el costo por libra en la configuración
  const btnActualizar = document.getElementById('btnActualizarCostoLibra');
  if (btnActualizar) {
    btnActualizar.addEventListener('click', function() {
      const costoRealLibra = document.getElementById('costoRealLibra').value.replace('$','');
      if (costoRealLibra && !isNaN(costoRealLibra)) {
        const costInput = document.getElementById('costPerPound');
        if (costInput) {
          costInput.value = parseFloat(costoRealLibra).toFixed(2);
          // Opcional: mostrar feedback
          Swal.fire({
            icon: 'success',
            title: 'Costo actualizado',
            text: 'El costo por libra ha sido actualizado.',
            timer: 1500,
            showConfirmButton: false
          });
          // Cerrar modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('modalMermaPollo'));
          if (modal) modal.hide();
        }
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Datos incompletos',
          text: 'Completa los datos y asegúrate que el cálculo sea válido.'
        });
      }
    });
  }
});

// === Edición de ventas de pollos ===
function editChickenSale(index) {
  const sale = chickenSales[index];
  if (!sale) return;
  
  // Obtener la lista de clientes para el selector
  const clientOptions = clients.map(client => 
    `<option value="${client.id}" ${client.id === sale.clientId ? 'selected' : ''}>${client.name}</option>`
  ).join('');
  
  Swal.fire({
    title: 'Editar Venta de Pollos',
    html: `
      <form id="editChickenSaleForm">
        <div class="mb-2">
          <label class="form-label">Cliente</label>
          <select class="form-select" id="editChickenClient" required>
            ${clientOptions}
          </select>
        </div>
        <div class="mb-2">
          <label class="form-label">Cantidad</label>
          <input type="number" class="form-control" id="editChickenQuantity" value="${sale.quantity}" min="1" required>
        </div>
        <div class="mb-2">
          <label class="form-label">Peso Total (lbs)</label>
          <input type="number" class="form-control" id="editChickenWeight" value="${sale.weight}" step="0.01" min="0.01" required>
        </div>
        <div class="mb-2">
          <label class="form-label">Precio por Libra</label>
          <input type="number" class="form-control" id="editChickenPricePerPound" value="${sale.pricePerPound}" step="0.01" min="0.01" required>
        </div>
        <div class="mb-2">
          <label class="form-label">Costo por Libra</label>
          <input type="number" class="form-control" id="editChickenCostPerPound" value="${sale.costPerPound}" step="0.01" min="0" required>
        </div>
        <div class="mb-2">
          <label class="form-label">Tipo de Pago</label>
          <select class="form-select" id="editChickenPaymentType">
            <option value="cash" ${sale.paymentType === 'cash' ? 'selected' : ''}>Efectivo</option>
            <option value="credit" ${sale.paymentType === 'credit' ? 'selected' : ''}>Crédito</option>
            <option value="transfer" ${sale.paymentType === 'transfer' ? 'selected' : ''}>Transferencia</option>
          </select>
        </div>
        <div class="mb-2">
          <label class="form-label">Abono (si es crédito)</label>
          <input type="number" class="form-control" id="editChickenAbono" value="${sale.abono || 0}" step="0.01" min="0">
        </div>
        <div class="mb-2">
          <label class="form-label">Fecha</label>
          <input type="date" class="form-control" id="editChickenDate" value="${sale.date ? sale.date.slice(0,10) : ''}" required>
        </div>
      </form>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const clientId = document.getElementById('editChickenClient').value;
      const quantity = parseInt(document.getElementById('editChickenQuantity').value);
      const weight = parseFloat(document.getElementById('editChickenWeight').value);
      const pricePerPound = parseFloat(document.getElementById('editChickenPricePerPound').value);
      const costPerPound = parseFloat(document.getElementById('editChickenCostPerPound').value);
      const paymentType = document.getElementById('editChickenPaymentType').value;
      const abono = parseFloat(document.getElementById('editChickenAbono').value) || 0;
      const date = document.getElementById('editChickenDate').value;
      
      if (!clientId || !quantity || !weight || !pricePerPound || !date) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }
      return { clientId, quantity, weight, pricePerPound, costPerPound, paymentType, abono, date };
    }
  }).then(async (result) => {
    if (result.isConfirmed && result.value) {
      const { clientId, quantity, weight, pricePerPound, costPerPound, paymentType, abono, date } = result.value;
      const total = pricePerPound * weight;
      const profit = (pricePerPound - costPerPound) * weight;
      
      // Obtener el cliente seleccionado
      const selectedClient = clients.find(c => c.id === clientId);
      
      // Crear fecha local correcta manteniendo la hora original
      const originalDate = new Date(sale.date);
      const [year, month, day] = date.split('-');
      const newDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        originalDate.getHours(),
        originalDate.getMinutes(),
        originalDate.getSeconds()
      );
      
      chickenSales[index] = {
        ...sale,
        clientId,
        clientName: selectedClient.name,
        quantity,
        weight,
        pricePerPound,
        costPerPound,
        total,
        profit,
        paymentType,
        abono,
        debt: paymentType === 'credit' ? total - abono : 0,
        date: newDate.toISOString().split('T')[0] + 'T' + 
              newDate.getHours().toString().padStart(2,'0') + ':' +
              newDate.getMinutes().toString().padStart(2,'0') + ':' +
              newDate.getSeconds().toString().padStart(2,'0'),
      };
      await saveToStorage('chickenSales', chickenSales);
      updateChickenStats();
      updateChickenSalesList();
      Swal.fire({ icon: 'success', title: 'Venta actualizada', text: 'La venta de pollos fue actualizada correctamente.', timer: 1500, showConfirmButton: false });
    }
  });
}

// Modificar updateChickenSalesList para agregar botón de editar
function updateChickenSalesList() {
  const container = document.getElementById('chickenSalesList');
  if (!container) return;
  
  const filteredSales = chickenSales.filter(sale => {
    const clientName = sale.clientName.toLowerCase();
    const searchTerm = document.getElementById('chickenSearch').value.toLowerCase();
    return clientName.includes(searchTerm);
  });
  
  container.innerHTML = filteredSales.map((sale, idx) => `
    <div class="chicken-sale-item-treinta">
      <div class="chicken-sale-header-treinta">
        <div class="chicken-sale-client-treinta">
          <i class="bi bi-person"></i>
          ${sale.clientName}
        </div>
        <div class="chicken-sale-date-treinta">
          ${new Date(sale.date).toLocaleDateString()} ${sale.time}
        </div>
        <button class="btn btn-sm btn-outline-primary ms-2" title="Editar" onclick="editChickenSale(${chickenSales.indexOf(sale)})"><i class="bi bi-pencil"></i></button>
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

// Exponer la función globalmente
window.editChickenSale = editChickenSale;
// Finalizar venta de pollos desde el resumen
async function finalizeChickenSale() {
  // Obtener datos del formulario
  const clientId = document.getElementById('chickenClient').value;
  const quantity = parseInt(document.getElementById('chickenQuantity').value);
  const weight = parseFloat(document.getElementById('chickenWeight').value);
  const saleDate = document.getElementById('chickenSaleDate').value;
  const paymentType = document.querySelector('input[name="chickenPayment"]:checked').value;
  const abono = paymentType === 'credit' ? parseFloat(document.getElementById('chickenAbono').value) || 0 : 0;
  
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
  
  if (quantity <= 0 || weight <= 0) {
    Swal.fire({
      icon: 'error',
      title: 'Datos inválidos',
      text: 'La cantidad y peso deben ser mayores a 0.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  // Obtener cliente
  const client = clients.find(c => c.id === clientId);
  if (!client) {
    Swal.fire({
      icon: 'error',
      title: 'Cliente no encontrado',
      text: 'El cliente seleccionado no existe.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  // Calcular total basado en peso × precio por libra
  const total = weight * pricePerPound;
  
  // Calcular ganancia real basada en costo por libra
  const totalCost = weight * costPerPound;
  const profit = total - totalCost;
  
  // Crear objeto de venta con fecha y hora local de Ecuador
  const now = new Date();
  const [year, month, day] = saleDate.split('-');
  const localDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  );
  const sale = {
    id: Date.now().toString(),
    clientId: clientId,
    clientName: client.name,
    quantity: quantity,
    weight: weight,
    pricePerPound: pricePerPound,
    costPerPound: costPerPound,
    total: total,
    cost: totalCost,
    profit: profit, // Ganancia real (PVP - Costo)
    date: `${year}-${month}-${day}T${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`,
    time: localDate.toLocaleTimeString(),
    paymentType: paymentType,
    abono: abono,
    createdAt: localDate.toLocaleString()
  };
  
  try {
    // Agregar a la lista de ventas
    chickenSales.push(sale);
    
    // Agregar movimiento para la sección de movimientos
    const movement = {
      type: 'chicken_sale',
      icon: 'bi-egg-fried',
      title: `Venta Pollos #${sale.id}`,
      subtitle: `${client.name} - ${new Date(sale.date).toLocaleDateString()}`,
      amount: total,
      amountClass: 'positive',
      date: new Date(sale.date),
      data: sale,
      category: 'pollos'
    };
    
    if (!movements || !Array.isArray(movements)) {
      movements = [];
    }
    movements.push(movement);
    
    await saveToStorage('chickenSales', chickenSales);
    await saveToStorage('movements', movements);
    
    // Actualizar estadísticas
    updateChickenStats();
    updateChickenSalesList();
    
    // Limpiar formulario
    document.getElementById('chickenSaleForm').reset();
    // Usar fecha local de Ecuador al limpiar el formulario
    document.getElementById('chickenSaleDate').value = getEcuadorDateString();
    document.getElementById('chickenQuantity').value = '1';
    document.getElementById('chickenAbonoSection').style.display = 'none';
    
    // Mostrar comprobante
    showChickenReceipt(sale);
    
  } catch (error) {
    console.error('Error guardando venta de pollos:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo guardar la venta. Inténtalo de nuevo.',
      confirmButtonText: 'Aceptar'
    });
  }
}

// Mostrar comprobante de venta de pollos
function showChickenReceipt(sale) {
  const receiptHtml = `
    <div class="receipt-treinta">
      <div class="receipt-header">
        <div class="receipt-logo">
          <img src="TillUp.png" alt="TillUp" style="width: 40px; height: 40px; border-radius: 8px;">
          <h3>TillUp POS</h3>
        </div>
        <div class="receipt-info">
          <div class="receipt-title">COMPROBANTE DE VENTA DE POLLOS</div>
          <div class="receipt-number">Venta #${sale.id}</div>
          <div class="receipt-date">${new Date(sale.date).toLocaleDateString()} ${sale.time}</div>
        </div>
      </div>
      
      <div class="receipt-client">
        <i class="bi bi-person"></i>
        <strong>Cliente:</strong> ${sale.clientName}
      </div>
      
      <div class="receipt-items">
        <div class="receipt-items-header">
          <div class="item-name">Descripción</div>
          <div class="item-qty">Cant.</div>
          <div class="item-price">Precio/Lb</div>
          <div class="item-subtotal">Subtotal</div>
        </div>
        
        <div class="receipt-item">
          <div class="item-name">Pollo(s) - ${sale.weight} lbs</div>
          <div class="item-qty">${sale.quantity}</div>
          <div class="item-price">$${sale.pricePerPound.toFixed(2)}</div>
          <div class="item-subtotal">$${sale.total.toFixed(2)}</div>
        </div>
      </div>
      
      <div class="receipt-total">
        <div class="total-line final">
          <span>TOTAL:</span>
          <span class="total-amount">$${sale.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="payment-type">
        <i class="bi bi-${getPaymentIcon(sale.paymentType)}"></i>
        <strong>Método de pago:</strong> ${getPaymentText(sale.paymentType)}
        ${sale.paymentType === 'credit' && sale.abono > 0 ? `<br><small>Abono inicial: $${sale.abono.toFixed(2)}</small>` : ''}
      </div>
      
      <div class="receipt-footer">
        <div class="footer-message">
          <i class="bi bi-heart"></i>
          ¡Gracias por su compra!
        </div>
        <div class="footer-brand">
          <small>TillUp POS - Gestión de Ventas</small>
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    title: 'Venta de Pollos Completada',
    html: receiptHtml,
    showCancelButton: true,
    confirmButtonText: 'Imprimir',
    cancelButtonText: 'Cerrar',
    showDenyButton: true,
    denyButtonText: 'Descargar PDF',
    width: 500,
    customClass: {
      popup: 'swal2-receipt-treinta',
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-secondary',
      denyButton: 'btn btn-outline-primary'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // Imprimir comprobante
      printChickenReceipt(sale);
    } else if (result.isDenied) {
      // Descargar PDF
      downloadChickenReceiptPDF(sale);
    }
  });
}

// Imprimir comprobante de venta de pollos
function printChickenReceipt(sale) {
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comprobante de Venta de Pollos - TillUp</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: #333;
        }
        .receipt {
          max-width: 400px;
          margin: 0 auto;
          border: 2px solid #1F2D3D;
          border-radius: 12px;
          padding: 20px;
          background: white;
        }
        .receipt-header {
          text-align: center;
          border-bottom: 2px solid #1F2D3D;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .receipt-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .receipt-logo img {
          width: 40px;
          height: 40px;
          border-radius: 8px;
        }
        .receipt-logo h3 {
          margin: 0;
          color: #1F2D3D;
          font-size: 1.5rem;
        }
        .receipt-info {
          text-align: center;
        }
        .receipt-title {
          font-weight: bold;
          font-size: 1.1rem;
          color: #1F2D3D;
          margin-bottom: 5px;
        }
        .receipt-number, .receipt-date {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 3px;
        }
        .receipt-client {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 0.95rem;
        }
        .receipt-client i {
          margin-right: 5px;
          color: #1F2D3D;
        }
        .receipt-items {
          margin-bottom: 20px;
        }
        .receipt-items-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #ddd;
          font-weight: bold;
          font-size: 0.9rem;
          color: #1F2D3D;
        }
        .receipt-item {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px dashed #eee;
          font-size: 0.9rem;
        }
        .receipt-total {
          border-top: 2px solid #1F2D3D;
          padding-top: 15px;
          margin-bottom: 20px;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        .total-line.final {
          font-weight: bold;
          font-size: 1.2rem;
          color: #1F2D3D;
        }
        .total-amount {
          font-weight: bold;
          color: #1F2D3D;
        }
        .payment-type {
          background: #e9ecef;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }
        .payment-type i {
          margin-right: 5px;
          color: #1F2D3D;
        }
        .receipt-footer {
          text-align: center;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }
        .footer-message {
          font-weight: bold;
          color: #1F2D3D;
          margin-bottom: 5px;
        }
        .footer-message i {
          color: #dc3545;
          margin-right: 5px;
        }
        .footer-brand small {
          color: #666;
          font-size: 0.8rem;
        }
        @media print {
          body { margin: 0; }
          .receipt { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="receipt-header">
          <div class="receipt-logo">
            <img src="TillUp.png" alt="TillUp">
            <h3>TillUp POS</h3>
          </div>
          <div class="receipt-info">
            <div class="receipt-title">COMPROBANTE DE VENTA DE POLLOS</div>
            <div class="receipt-number">Venta #${sale.id}</div>
            <div class="receipt-date">${new Date(sale.date).toLocaleDateString()} ${sale.time}</div>
          </div>
        </div>
        
        <div class="receipt-client">
          <i class="bi bi-person"></i>
          <strong>Cliente:</strong> ${sale.clientName}
        </div>
        
        <div class="receipt-items">
          <div class="receipt-items-header">
            <div>Descripción</div>
            <div>Cant.</div>
            <div>Peso (lbs)</div>
            <div>Precio/Lb</div>
            <div>Subtotal</div>
          </div>
          
          <div class="receipt-item">
            <div>Pollo(s)</div>
            <div>${sale.quantity}</div>
            <div>${sale.weight}</div>
            <div>$${sale.pricePerPound.toFixed(2)}</div>
            <div>$${sale.total.toFixed(2)}</div>
          </div>
        </div>
        
        <div class="receipt-total">
          <div class="total-line final">
            <span>TOTAL:</span>
            <span class="total-amount">$${sale.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="payment-type">
          <i class="bi bi-${getPaymentIcon(sale.paymentType)}"></i>
          <strong>Método de pago:</strong> ${getPaymentText(sale.paymentType)}
          ${sale.paymentType === 'credit' && sale.abono > 0 ? `<br><small>Abono inicial: $${sale.abono.toFixed(2)}</small>` : ''}
        </div>
        
        <div class="receipt-footer">
          <div class="footer-message">
            <i class="bi bi-heart"></i>
            ¡Gracias por su compra!
          </div>
          <div class="footer-brand">
            <small>TillUp POS - Gestión de Ventas</small>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

// Descargar comprobante de pollos en PDF
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
  doc.text("COMPROBANTE DE VENTA DE POLLOS", 14, 20);
  
  // Información de la venta
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.text(`Venta #${sale.id}`, 14, 35);
  doc.text(`Fecha: ${fecha}`, 14, 40);
  doc.text(`Cliente: ${sale.clientName}`, 14, 45);
  
  // Items
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Detalle de Venta", 14, 60);
  
  const items = [
    ['Descripción', 'Cant.', 'Peso (lbs)', 'Precio/Lb', 'Subtotal']
  ];
  
  items.push([
    'Pollo(s)',
    sale.quantity.toString(),
    sale.weight.toString(),
    `$${sale.pricePerPound.toFixed(2)}`,
    `$${sale.total.toFixed(2)}`
  ]);
  
  doc.autoTable({
    startY: 65,
    head: [items[0]],
    body: items.slice(1),
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
  doc.text(`Total: $${sale.total.toFixed(2)}`, 14, finalY + 10);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Método de pago: ${getPaymentText(sale.paymentType)}`, 14, finalY + 20);
  
  if (sale.paymentType === 'credit' && sale.abono > 0) {
    doc.text(`Abono inicial: $${sale.abono.toFixed(2)}`, 14, finalY + 25);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("¡Gracias por su compra!", 14, finalY + 40);
  doc.text("Generado por TillUp POS - Gestión de Ventas", 14, finalY + 45);
  
  doc.save(`Comprobante_Pollos_${sale.id}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Actualizar estadísticas de pollos
function updateChickenStats(opts = {}) {
  let todayStr;
  if (opts && opts.fecha) {
    todayStr = opts.fecha;
  } else {
    // Usar fecha local de Ecuador
    todayStr = getEcuadorDateString();
  }
  
  // Verificar que chickenSales sea un array válido
  if (!chickenSales || !Array.isArray(chickenSales)) {
    resetChickenStats();
    return;
  }
  
  // Filtrar ventas de la fecha seleccionada
  const todaySales = chickenSales.filter(sale => 
    sale && sale.date && sale.date.startsWith(todayStr)
  );
  
  // Calcular estadísticas
  const totalChickens = todaySales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
  const totalWeight = todaySales.reduce((sum, sale) => sum + (sale.weight || 0), 0);
  const totalRevenue = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const avgWeight = totalChickens > 0 ? totalWeight / totalChickens : 0;
  
  // Calcular ganancias usando los valores reales de costo y precio
  const totalProfit = todaySales.reduce((sum, sale) => {
    const profit = sale.profit || ((sale.pricePerPound || pricePerPound) - (sale.costPerPound || costPerPound)) * (sale.weight || 0);
    return sum + profit;
  }, 0);
  const profitPercentage = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  
  // Actualizar elementos en el DOM
  const totalChickensElement = document.getElementById('totalChickensSold');
  const totalWeightElement = document.getElementById('totalWeightSold');
  const totalRevenueElement = document.getElementById('totalRevenue');
  const avgWeightElement = document.getElementById('avgWeight');
  const totalProfitElement = document.getElementById('totalProfit');
  const totalProfitTodayElement = document.getElementById('totalProfitToday');
  const profitMarginElement = document.getElementById('profitMargin');
  
  if (totalChickensElement) totalChickensElement.textContent = totalChickens;
  if (totalWeightElement) totalWeightElement.textContent = totalWeight.toFixed(1);
  if (totalRevenueElement) totalRevenueElement.textContent = `$${totalRevenue.toFixed(2)}`;
  if (avgWeightElement) avgWeightElement.textContent = avgWeight.toFixed(1);
  // Ganancias hoy y total: mostrar como oculto si corresponde
  if (totalProfitElement) {
    const isHidden = totalProfitElement.classList.contains('hidden-profit');
    totalProfitElement.textContent = isHidden ? '•••••' : `$${totalProfit.toFixed(2)}`;
    totalProfitElement.setAttribute('data-actual-value', `$${totalProfit.toFixed(2)}`);
  }
  if (totalProfitTodayElement) {
    // Solo mostrar el valor, sin botón ni alternancia
    totalProfitTodayElement.textContent = `$${totalProfit.toFixed(2)}`;
    totalProfitTodayElement.setAttribute('data-actual-value', `$${totalProfit.toFixed(2)}`);
    totalProfitTodayElement.classList.remove('hidden-profit-today');
  }
  if (profitMarginElement) profitMarginElement.textContent = `${profitPercentage.toFixed(1)}%`;
}

// Función para resetear estadísticas de pollos
function resetChickenStats() {
  const elements = [
    'totalChickensSold', 'totalWeightSold', 'totalRevenue', 'avgWeight',
    'totalProfit', 'profitMargin', 'profitPerChicken'
  ];
  
  elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      if (id.includes('Profit') || id.includes('Margin')) {
        element.textContent = id.includes('Margin') ? '0%' : '$0.00';
      } else if (id.includes('Weight') || id.includes('Chickens')) {
        element.textContent = '0';
      } else if (id.includes('avgWeight')) {
        element.textContent = '0.0';
      } else {
        element.textContent = '$0.00';
      }
    }
  });
}

// Función para mostrar/ocultar ganancias totales de pollos (estadística principal)
function toggleChickenProfitVisibility() {
  const totalProfitElement = document.getElementById('totalProfit');
  const btn = document.getElementById('toggleChickenProfitBtn');
  if (!totalProfitElement || !btn) return;
  const isHidden = totalProfitElement.classList.toggle('hidden-profit');
  if (isHidden) {
    totalProfitElement.textContent = '•••••';
    btn.innerHTML = '<i class="bi bi-eye"></i>';
  } else {
    totalProfitElement.textContent = totalProfitElement.getAttribute('data-actual-value') || '';
    btn.innerHTML = '<i class="bi bi-eye-slash"></i>';
  }
}

// Función para mostrar/ocultar ganancia total calculada en la sección de cálculo automático
function toggleChickenProfitCalcVisibility() {
  const profitCalcElement = document.getElementById('displayTotalProfit');
  const btn = document.getElementById('toggleChickenProfitCalcBtn');
  if (!profitCalcElement || !btn) return;
  const isHidden = profitCalcElement.classList.toggle('hidden-profit-calc');
  if (isHidden) {
    profitCalcElement.textContent = '•••••';
    btn.innerHTML = '<i class="bi bi-eye"></i>';
  } else {
    profitCalcElement.textContent = profitCalcElement.getAttribute('data-actual-value') || '';
    btn.innerHTML = '<i class="bi bi-eye-slash"></i>';
  }
}

// Función para mostrar/ocultar ganancias de hoy de pollos
function toggleChickenProfitTodayVisibility() {
  const totalProfitTodayElement = document.getElementById('totalProfitToday');
  const btn = document.getElementById('toggleChickenProfitTodayBtn');
  if (!totalProfitTodayElement || !btn) return;
  const isHidden = totalProfitTodayElement.classList.toggle('hidden-profit-today');
  if (isHidden) {
    totalProfitTodayElement.textContent = '•••••';
    btn.innerHTML = '<i class="bi bi-eye"></i>';
  } else {
    totalProfitTodayElement.textContent = totalProfitTodayElement.getAttribute('data-actual-value') || '';
    btn.innerHTML = '<i class="bi bi-eye-slash"></i>';
  }
}

// Actualizar cálculo automático de pollos
function updateChickenCalculation() {
  const weightInput = document.getElementById('chickenWeight');
  const displayPrice = document.getElementById('displayPricePerPound');
  const displayCost = document.getElementById('displayCostPerPound');
  const displayProfitPerPound = document.getElementById('displayProfitPerPound');
  const displayTotal = document.getElementById('displayTotalAmount');
  const displayTotalProfit = document.getElementById('displayTotalProfit');
  
  if (!weightInput || !displayPrice || !displayTotal) return;
  
  // Obtener valores de la configuración de precio
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  
  if (!priceInput || !costInput) return;
  
  const price = parseFloat(priceInput.value) || 0;
  const cost = parseFloat(costInput.value) || 0;
  const weight = parseFloat(weightInput.value) || 0;
  const total = price * weight;
  const profitPerPound = price - cost;
  const totalProfit = profitPerPound * weight;
  
  displayPrice.textContent = `$${price.toFixed(2)}`;
  displayCost.textContent = `$${cost.toFixed(2)}`;
  displayProfitPerPound.textContent = `$${profitPerPound.toFixed(2)}`;
  displayProfitPerPound.setAttribute('data-actual-value', `$${profitPerPound.toFixed(2)}`);
  displayTotal.textContent = `$${total.toFixed(2)}`;
  // Ganancia total: solo mostrar el valor real si NO está oculta
  displayTotalProfit.setAttribute('data-actual-value', `$${totalProfit.toFixed(2)}`);
  if (displayTotalProfit.classList.contains('hidden-profit-calc')) {
    displayTotalProfit.textContent = '•••••';
  } else {
    displayTotalProfit.textContent = `$${totalProfit.toFixed(2)}`;
  }
}

// Configurar eventos del formulario de pollos
function setupChickenEventListeners() {
  // Event listeners para cálculo automático
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  const weightInput = document.getElementById('chickenWeight');
  const quantityInput = document.getElementById('chickenQuantity');

  if (priceInput) {
    priceInput.addEventListener('input', updateChickenCalculation);
  }

  if (costInput) {
    costInput.addEventListener('input', updateChickenCalculation);
  }

  if (weightInput) {
    weightInput.addEventListener('input', updateChickenCalculation);
  }

  if (quantityInput) {
    quantityInput.addEventListener('input', updateChickenCalculation);
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
// Eliminada la función initializeChickenProfitToggles y lógica de ocultar ganancias
// Actualizar selector de clientes para pollos
function updateChickenClientSelector() {
  const selector = document.getElementById('chickenClient');
  if (!selector) return;
  
  selector.innerHTML = '<option value="">Seleccionar cliente...</option>';
  
  // Verificar que clients sea un array válido
  if (!clients || !Array.isArray(clients)) return;
  
  // Agregar opción de búsqueda si hay muchos clientes
  if (clients.length > 10) {
    const searchOption = document.createElement('option');
    searchOption.value = 'search';
    searchOption.className = 'search-option';
    searchOption.innerHTML = '<i class="bi bi-search"></i> Buscar cliente...';
    selector.appendChild(searchOption);
  }
  
  // Agregar clientes al select
  clients.forEach(client => {
    if (client && client.id && client.name) {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      selector.appendChild(option);
    }
  });
  
  // Configurar event listener para el select
  setupChickenClientSelectListener();
}

// Configurar event listener para el select de clientes
function setupChickenClientSelectListener() {
  const selector = document.getElementById('chickenClient');
  if (!selector) return;
  
  // Remover event listeners previos
  selector.removeEventListener('change', handleChickenClientSelect);
  selector.addEventListener('change', handleChickenClientSelect);
}

// Manejar la selección en el select de clientes
function handleChickenClientSelect(event) {
  const selectedValue = event.target.value;
  
  if (selectedValue === 'search') {
    // Abrir modal de búsqueda
    openClientSearchModal();
    // Resetear el select
    event.target.value = '';
  }
}

// Abrir modal de búsqueda de clientes
function openClientSearchModal() {
  const modal = document.getElementById('clientSearchModal');
  const searchInput = document.getElementById('clientSearchInput');
  const resultsContainer = document.getElementById('clientSearchResults');
  
  if (!modal || !searchInput || !resultsContainer) return;
  
  // Mostrar modal
  modal.classList.add('show');
  
  // Limpiar búsqueda anterior
  searchInput.value = '';
  resultsContainer.innerHTML = '';
  
  // Mostrar todos los clientes inicialmente
  renderClientSearchResults('');
  
  // Enfocar el input de búsqueda
  setTimeout(() => {
    searchInput.focus();
  }, 100);
  
  // Configurar event listeners
  setupClientSearchEventListeners();
}

// Cerrar modal de búsqueda de clientes
function closeClientSearchModal() {
  const modal = document.getElementById('clientSearchModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// Configurar event listeners para la búsqueda
function setupClientSearchEventListeners() {
  const searchInput = document.getElementById('clientSearchInput');
  const modal = document.getElementById('clientSearchModal');
  
  if (!searchInput || !modal) return;
  
  // Búsqueda en tiempo real
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    renderClientSearchResults(searchTerm);
  });
  
  // Cerrar modal con Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeClientSearchModal();
    }
  });
  
  // Cerrar modal al hacer clic fuera
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeClientSearchModal();
    }
  });
}

// Renderizar resultados de búsqueda
function renderClientSearchResults(searchTerm) {
  const resultsContainer = document.getElementById('clientSearchResults');
  if (!resultsContainer) return;
  
  // Verificar que clients sea un array válido
  if (!clients || !Array.isArray(clients)) {
    resultsContainer.innerHTML = '<div class="no-results">No hay clientes disponibles</div>';
    return;
  }
  
  // Filtrar clientes
  const filteredClients = clients.filter(client => 
    client && client.name && client.name.toLowerCase().includes(searchTerm)
  );
  
  if (filteredClients.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <i class="bi bi-search" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
        No se encontraron clientes
      </div>
    `;
    return;
  }
  
  // Renderizar resultados
  resultsContainer.innerHTML = filteredClients.map(client => {
    const initials = getClientInitials(client.name);
    const details = client.phone ? `📱 ${client.phone}` : '';
    
    return `
      <div class="search-result-item" onclick="selectClientFromSearch('${client.id}')">
        <div class="client-avatar">${initials}</div>
        <div class="client-info">
          <div class="client-name">${client.name}</div>
          ${details ? `<div class="client-details">${details}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Obtener iniciales del cliente
function getClientInitials(name) {
  if (!name) return '?';
  return name.split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// Seleccionar cliente desde la búsqueda
function selectClientFromSearch(clientId) {
  const selector = document.getElementById('chickenClient');
  if (selector) {
    selector.value = clientId;
    // Disparar evento change para activar cálculos
    selector.dispatchEvent(new Event('change'));
  }
  
  // Cerrar modal
  closeClientSearchModal();
}

// ===== FUNCIONES PARA BÚSQUEDA EN SECCIÓN DE CLIENTES =====

// Abrir modal de búsqueda de clientes para la sección de clientes
function openClientsSearchModal() {
  const modal = document.getElementById('clientsSearchModal');
  const searchInput = document.getElementById('clientsSearchInput');
  const resultsContainer = document.getElementById('clientsSearchResults');
  
  if (!modal || !searchInput || !resultsContainer) return;
  
  // Mostrar modal
  modal.classList.add('show');
  
  // Limpiar búsqueda anterior
  searchInput.value = '';
  resultsContainer.innerHTML = '';
  
  // Mostrar todos los clientes inicialmente
  renderClientsSearchResults('');
  
  // Enfocar el input de búsqueda
  setTimeout(() => {
    searchInput.focus();
  }, 100);
  
  // Configurar event listeners
  setupClientsSearchEventListeners();
}

// Cerrar modal de búsqueda de clientes para la sección de clientes
function closeClientsSearchModal() {
  const modal = document.getElementById('clientsSearchModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// Configurar event listeners para la búsqueda de clientes
function setupClientsSearchEventListeners() {
  const searchInput = document.getElementById('clientsSearchInput');
  const modal = document.getElementById('clientsSearchModal');
  
  if (!searchInput || !modal) return;
  
  // Búsqueda en tiempo real
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    renderClientsSearchResults(searchTerm);
  });
  
  // Cerrar modal con Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeClientsSearchModal();
    }
  });
  
  // Cerrar modal al hacer clic fuera
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeClientsSearchModal();
    }
  });
}

// Renderizar resultados de búsqueda para la sección de clientes
function renderClientsSearchResults(searchTerm) {
  const resultsContainer = document.getElementById('clientsSearchResults');
  if (!resultsContainer) return;
  
  // Verificar que clients sea un array válido
  if (!clients || !Array.isArray(clients)) {
    resultsContainer.innerHTML = '<div class="no-results">No hay clientes disponibles</div>';
    return;
  }
  
  // Filtrar clientes
  const filteredClients = clients.filter(client => 
    client && client.name && client.name.toLowerCase().includes(searchTerm)
  );
  
  if (filteredClients.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <i class="bi bi-search" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
        No se encontraron clientes
      </div>
    `;
    return;
  }
  
  // Renderizar resultados
  resultsContainer.innerHTML = filteredClients.map(client => {
    const initials = getClientInitials(client.name);
    const details = client.phone ? `📱 ${client.phone}` : '';
    const address = client.address ? `📍 ${client.address}` : '';
    
    return `
      <div class="search-result-item" onclick="selectClientFromClientsSearch('${client.id}')">
        <div class="client-avatar">${initials}</div>
        <div class="client-info">
          <div class="client-name">${client.name}</div>
          <div class="client-details">
            ${details}${details && address ? ' • ' : ''}${address}
          </div>
        </div>
        <div class="client-actions">
          <button class="btn btn-sm btn-outline-primary" onclick="showClientDetails('${client.id}'); event.stopPropagation();" title="Ver detalles">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary" onclick="editClient('${client.id}'); event.stopPropagation();" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Seleccionar cliente desde la búsqueda de la sección de clientes
function selectClientFromClientsSearch(clientId) {
  // Cerrar modal
  closeClientsSearchModal();
  
  // Mostrar detalles del cliente
  showClientDetails(clientId);
}

// Actualizar lista de ventas de pollos
function updateChickenSalesList(opts = {}) {
  const container = document.getElementById('chickenSalesList');
  const countElement = document.getElementById('chickenSalesCount');
  
  if (!container) return;
  
  // Verificar que chickenSales sea un array válido
  if (!chickenSales || !Array.isArray(chickenSales)) {
    if (countElement) {
      countElement.textContent = '0 ventas';
    }
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-egg-fried" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">No hay ventas de pollos registradas</p>
      </div>
    `;
    return;
  }
  
  // Filtrar por fecha si se especifica
  let filteredSales = [...chickenSales];
  if (opts && opts.fecha) {
    filteredSales = chickenSales.filter(sale => 
      sale && sale.date && sale.date.startsWith(opts.fecha)
    );
  } else {
    // Por defecto, mostrar solo ventas de hoy (fecha de Ecuador)
    const todayStr = getEcuadorDateString();
    filteredSales = chickenSales.filter(sale => 
      sale && sale.date && sale.date.startsWith(todayStr)
    );
  }
  
  // Ordenar por fecha más reciente
  filteredSales.sort((a, b) => {
    if (!a || !b || !a.date || !b.date) return 0;
    return new Date(b.date) - new Date(a.date);
  });
  
  if (countElement) {
    const periodText = opts && opts.fecha ? 
      `del ${new Date(opts.fecha).toLocaleDateString()}` : 
      'de hoy';
    countElement.textContent = `${filteredSales.length} ventas ${periodText}`;
  }
  
  if (filteredSales.length === 0) {
    const periodText = opts && opts.fecha ? 
      `del ${new Date(opts.fecha).toLocaleDateString()}` : 
      'hoy';
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-egg-fried" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">No hay ventas de pollos ${periodText}</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filteredSales.map((sale, idx) => `
    <div class="chicken-sale-item-treinta">
      <div class="chicken-sale-header-treinta">
        <div class="chicken-sale-client-treinta">
          <i class="bi bi-person"></i>
          ${sale.clientName}
        </div>
        <div class="chicken-sale-date-treinta">
          ${new Date(sale.date).toLocaleDateString()} ${sale.time}
        </div>
        <button class="btn btn-sm btn-outline-primary ms-2" title="Editar" onclick="editChickenSale(${chickenSales.indexOf(sale)})"><i class="bi bi-pencil"></i></button>
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
  if (sales && Array.isArray(sales)) {
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
  }
  
  // Migrar fechas de deudas
  if (debts && Array.isArray(debts)) {
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
  }
  
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
  
  // Corregir problema de accesibilidad: remover aria-hidden del contenido principal
  const mainContent = document.getElementById('mainContent');
  if (mainContent && mainContent.getAttribute('aria-hidden') === 'true') {
    mainContent.removeAttribute('aria-hidden');
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').style.display = 'none';
  document.body.style.overflow = 'auto';
  
  // Asegurar que el contenido principal sea accesible
  const mainContent = document.getElementById('mainContent');
  if (mainContent && mainContent.getAttribute('aria-hidden') === 'true') {
    mainContent.removeAttribute('aria-hidden');
  }
}

// === Configuración de tema (global) ===
async function setTheme(mode) {
  // Siempre forzar modo claro
  document.documentElement.classList.remove('dark-mode');
  document.body.classList.remove('dark-mode');
  document.documentElement.classList.add('light-mode');
  document.body.classList.add('light-mode');
  // Actualizar botones visualmente si existen
  document.querySelectorAll('.sidebar-action-btn').forEach(btn => btn.classList.remove('active'));
  const btnLight = document.getElementById('theme-light');
  if (btnLight) btnLight.classList.add('active');
  // Guardar preferencia SIEMPRE como 'light'
  if (typeof localforage !== 'undefined') {
    await localforage.setItem('theme', 'light');
  } else {
    localStorage.setItem('theme', 'light');
  }
  // No mostrar ningún mensaje ni alerta
}

// === Funciones de instalación PWA ===
function installPWA() {
  console.log('installPWA() llamada');
  console.log('deferredPrompt:', deferredPrompt);
  console.log('installButton:', installButton);
  
  if (deferredPrompt) {
    console.log('Ejecutando deferredPrompt.prompt()');
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log('Resultado de instalación:', choiceResult);
      if (choiceResult.outcome === 'accepted') {
        Swal.fire({
          icon: 'success',
          title: '¡Instalación exitosa!',
          text: 'TillUp POS ha sido instalado en tu dispositivo.',
          timer: 3000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Instalación cancelada',
          text: 'Puedes instalar la app más tarde desde el menú del navegador.',
          timer: 3000,
          showConfirmButton: false
        });
        markInstallationRejected();
      }
      if (installButton) installButton.style.display = 'none';
      deferredPrompt = null;
      window.deferredPrompt = null;
    }).catch((error) => {
      console.error('Error en la instalación PWA:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error en la instalación',
        text: 'No se pudo completar la instalación. Inténtalo de nuevo.',
        timer: 3000,
        showConfirmButton: false
      });
    });
  } else {
    console.log('No hay deferredPrompt disponible');
    Swal.fire({
      icon: 'warning',
      title: 'No se puede instalar',
      text: 'La instalación no está disponible en este momento. Inténtalo más tarde.',
      timer: 3000,
      showConfirmButton: false
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
let installButton = null;
let deferredPrompt = null;

// === Función helper para verificar instalación ===
function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// === Función helper para verificar si el usuario rechazó la instalación ===
async function hasUserRejectedInstallation() {
  if (typeof localforage !== 'undefined') {
    const val = await localforage.getItem('pwa-installation-rejected');
    return val === 'true';
  } else {
    return localStorage.getItem('pwa-installation-rejected') === 'true';
  }
}

// === Función helper para marcar que el usuario rechazó la instalación ===
async function markInstallationRejected() {
  if (typeof localforage !== 'undefined') {
    await localforage.setItem('pwa-installation-rejected', 'true');
  } else {
    localStorage.setItem('pwa-installation-rejected', 'true');
  }
}

// === Función helper para limpiar el estado de rechazo de instalación ===
async function clearInstallationRejection() {
  if (typeof localforage !== 'undefined') {
    await localforage.removeItem('pwa-installation-rejected');
  } else {
    localStorage.removeItem('pwa-installation-rejected');
  }
  console.log('Estado de rechazo de instalación limpiado');
}

// === Mostrar/ocultar botón de instalación PWA de forma centralizada ===
async function updateInstallButtonVisibility() {
  console.log('updateInstallButtonVisibility() llamada');
  if (!installButton) installButton = document.getElementById('installPWA');
  if (!installButton) {
    console.log('No se encontró el botón installPWA');
    return;
  }
  
  const isInstalled = isAppInstalled();
  const hasRejected = await hasUserRejectedInstallation();
  
  console.log('Estado PWA:', {
    isInstalled,
    hasRejected,
    hasDeferredPrompt: !!deferredPrompt,
    installButton: !!installButton
  });
  
  if (isInstalled || hasRejected || !deferredPrompt) {
    console.log('Ocultando botón de instalación');
    installButton.style.display = 'none';
  } else {
    console.log('Mostrando botón de instalación');
    installButton.style.display = 'flex';
    installButton.classList.add('animate');
  }
}

// === Evento beforeinstallprompt (centralizado) ===
window.addEventListener('beforeinstallprompt', async (e) => {
  console.log('beforeinstallprompt event disparado');
  e.preventDefault();
  deferredPrompt = e;
  window.deferredPrompt = e;
  console.log('deferredPrompt configurado:', deferredPrompt);
  await updateInstallButtonVisibility();
});

// === Evento appinstalled ===
window.addEventListener('appinstalled', async () => {
  deferredPrompt = null;
  window.deferredPrompt = null;
  await updateInstallButtonVisibility();
  Swal.fire({
    icon: 'success',
    title: '¡Instalación completada!',
    text: 'TillUp POS está ahora instalado en tu dispositivo.',
    timer: 3000,
    showConfirmButton: false
  });
});

// === Inicialización del botón de instalación PWA ===
document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar botones de ocultar/mostrar ganancias de pollos
  const totalProfitElement = document.getElementById('totalProfit');
  const totalProfitTodayElement = document.getElementById('totalProfitToday');
  const profitCalcElement = document.getElementById('displayTotalProfit');
  if (totalProfitElement) {
    totalProfitElement.classList.add('hidden-profit');
    totalProfitElement.textContent = '•••••';
  }
  if (totalProfitTodayElement) {
    // Mostrar el valor directamente, sin ocultar ni botón
    totalProfitTodayElement.classList.remove('hidden-profit-today');
    totalProfitTodayElement.textContent = '';
  }
  if (profitCalcElement) {
    profitCalcElement.classList.add('hidden-profit-calc');
    profitCalcElement.textContent = '•••••';
    profitCalcElement.setAttribute('data-actual-value', '$0.00');
  }
  const btnProfit = document.getElementById('toggleChickenProfitBtn');
  if (btnProfit) {
    btnProfit.innerHTML = '<i class="bi bi-eye"></i>';
    btnProfit.onclick = toggleChickenProfitVisibility;
  }
  // Eliminar el botón de ojo de ganancias hoy si existe
  const btnProfitToday = document.getElementById('toggleChickenProfitTodayBtn');
  if (btnProfitToday && btnProfitToday.parentNode) {
    btnProfitToday.parentNode.removeChild(btnProfitToday);
  }
  const btnProfitCalc = document.getElementById('toggleChickenProfitCalcBtn');
  if (btnProfitCalc) {
    btnProfitCalc.innerHTML = '<i class="bi bi-eye"></i>';
    btnProfitCalc.onclick = toggleChickenProfitCalcVisibility;
  }
  installButton = document.getElementById('installPWA');
  await updateInstallButtonVisibility();
  if (installButton) {
    installButton.onclick = installPWA;
  }
});

// === Al cargar la app ===
document.addEventListener('DOMContentLoaded', () => {
  // Cargar datos usando la función loadData
  loadData();

  // Migrar fechas existentes al formato ISO
  migrateDateFormats();

  // Renderizar todas las vistas
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

  // Eventos de formularios
  const formProduct = document.getElementById('formProduct');
  const formClient = document.getElementById('formClient');
  
  if (formProduct) {
    // Remover listeners existentes para evitar duplicados
    formProduct.removeEventListener('submit', addProduct);
    formProduct.addEventListener('submit', addProduct);
    console.log('Formulario de producto inicializado');
  } else {
    console.error('No se encontró el formulario de producto');
  }
  
  if (formClient) {
    // Remover listeners existentes para evitar duplicados
    formClient.removeEventListener('submit', addClient);
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
      localforage.setItem('inventoryViewMode', inventoryViewMode);
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
      localforage.setItem('clientsViewMode', clientsViewMode);
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
  (async () => {
    let savedTheme = 'light';
    if (typeof localforage !== 'undefined') {
      const val = await localforage.getItem('theme');
      savedTheme = val || 'light';
    } else {
      savedTheme = localStorage.getItem('theme') || 'light';
    }
    await setTheme(savedTheme);
  })();
  
  // Cerrar sidebar con Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeSidebar();
    }
  });

  // === Inicialización PWA ===
  installButton = document.getElementById('installPWA');
  
  // Mostrar botón solo si hay deferredPrompt y no está instalada ni rechazada
  if (installButton) {
    if (isAppInstalled() || hasUserRejectedInstallation() || !window.deferredPrompt) {
      installButton.style.display = 'none';
    } else {
      installButton.style.display = 'flex';
      installButton.classList.add('animate');
    }
  }

  // Evento beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.deferredPrompt = e;
    if (installButton && !isAppInstalled() && !hasUserRejectedInstallation()) {
      installButton.style.display = 'flex';
      installButton.classList.add('animate');
    }
  });

  // Evento appinstalled
  window.addEventListener('appinstalled', (evt) => {
    if (installButton) installButton.style.display = 'none';
    Swal.fire({
      icon: 'success',
      title: '¡Instalación completada!',
      text: 'TillUp POS está ahora instalado en tu dispositivo.',
      timer: 3000,
      showConfirmButton: false
    });
  });

  // === Detección de actualizaciones del Service Worker ===
  // Desactivado en desarrollo: no mostrar notificaciones ni recargar automáticamente
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.addEventListener('message', event => {
  //     if (event.data && event.data.type === 'SW_UPDATED') {
  //       console.log('Service Worker actualizado:', event.data.cacheName);
  //       setTimeout(() => {
  //         console.log('Recargando aplicación para aplicar actualizaciones...');
  //         window.location.reload();
  //       }, 3000);
  //       Swal.fire({
  //         icon: 'info',
  //         title: '¡Nueva versión disponible!',
  //         text: 'Se han descargado mejoras. La aplicación se recargará automáticamente en 3 segundos.',
  //         timer: 3000,
  //         timerProgressBar: true,
  //         showConfirmButton: false
  //       });
  //     }
  //   });
  //   setInterval(() => {
  //     navigator.serviceWorker.getRegistration().then(registration => {
  //       if (registration) {
  //         registration.update();
  //       }
  //     });
  //   }, 30000);
  // }

  // Captura de ubicación en formulario de cliente
  const btnGetLocation = document.getElementById('btnGetLocation');
  const locationInput = document.getElementById('clientLocation');
  const locationStatus = document.getElementById('locationStatus');
  
  if (btnGetLocation && locationInput && locationStatus) {
    // Remover listener existente para evitar duplicados
    btnGetLocation.removeEventListener('click', getCurrentLocation);
    btnGetLocation.addEventListener('click', getCurrentLocation);
    
    function getCurrentLocation() {
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
          
          // Feedback táctil
          hapticFeedback('success');
        },
        (error) => {
          let errorMessage = 'No se pudo obtener la ubicación.';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso denegado. Habilita la ubicación en tu navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado.';
              break;
          }
          locationStatus.textContent = errorMessage;
          btnGetLocation.disabled = false;
          
          // Feedback táctil
          hapticFeedback('error');
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000,
          maximumAge: 60000 // Usar ubicación en caché si tiene menos de 1 minuto
        }
      );
    }
  }

  // Inicializar datos de pollos
  initializeChickenData();

  // Vista previa de imagen para productos
  const productPhotoInput = document.getElementById('productImage');
  if (productPhotoInput) {
    // Remover listener existente para evitar duplicados
    productPhotoInput.removeEventListener('change', handleProductImagePreview);
    productPhotoInput.addEventListener('change', handleProductImagePreview);
    
    function handleProductImagePreview(e) {
      const preview = document.getElementById('imagePreview');
      if (!preview) return;
      
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa" style="max-width: 100%; height: auto; border-radius: 8px;">`;
        };
        reader.readAsDataURL(file);
      } else {
        preview.innerHTML = '';
      }
    }
  }

  // Vista previa de imagen para clientes
  const clientPhotoInput = document.getElementById('clientPhoto');
  if (clientPhotoInput) {
    // Remover listener existente para evitar duplicados
    clientPhotoInput.removeEventListener('change', handleClientImagePreview);
    clientPhotoInput.addEventListener('change', handleClientImagePreview);
    
    function handleClientImagePreview(e) {
      const preview = document.getElementById('clientImagePreview');
      if (!preview) return;
      
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa" style="max-width: 100%; height: auto; border-radius: 8px;">`;
        };
        reader.readAsDataURL(file);
      } else {
        preview.innerHTML = '';
      }
    }
  }

  // Restaurar backup si se detecta pérdida de datos
  if (window.restoreBackupIfLossDetected) {
    window.restoreBackupIfLossDetected();
  }
});

// === Agregar producto con vista previa de imagen ===
async function addProduct(e) {
  e.preventDefault();
  
  // Asegurar que products sea un array
  if (!Array.isArray(products)) {
    products = [];
  }
  
  // Obtener elementos del formulario
  const nameInput = document.getElementById('productName');
  const costInput = document.getElementById('productCost');
  const priceInput = document.getElementById('productPrice');
  const categoryInput = document.getElementById('productCategory');
  const stockInput = document.getElementById('productStock');
  const imageInput = document.getElementById('productImage');
  
  // Validar que los elementos existan
  if (!nameInput || !costInput || !priceInput || !categoryInput || !stockInput) {
    Swal.fire({
      icon: 'error',
      title: 'Error de formulario',
      text: 'Faltan campos obligatorios en el formulario.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  const name = nameInput.value.trim();
  const cost = parseFloat(costInput.value);
  const price = parseFloat(priceInput.value);
  const category = categoryInput.value.trim();
  const stock = parseInt(stockInput.value) || 0;

  // Validaciones básicas
  if (!name) {
    Swal.fire({
      icon: 'error',
      title: 'Nombre requerido',
      text: 'El nombre del producto es obligatorio.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  if (isNaN(cost) || cost < 0 || isNaN(price) || price < 0) {
    Swal.fire({
      icon: 'error',
      title: 'Valores inválidos',
      text: 'El costo y precio deben ser valores positivos.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  if (price < cost) {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Precio bajo',
      text: 'El precio de venta es menor al costo. ¿Estás seguro?',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Revisar'
    });
    if (!result.isConfirmed) {
      return;
    }
  }

  const saveProduct = async (imageData) => {
    try {
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
          
          await saveToStorage('products', products);
          renderInventory();
          renderSalesProducts();
          
          // Limpiar formulario y cerrar modal
          document.getElementById('formProduct').reset();
          document.getElementById('imagePreview').innerHTML = '';
          const modal = bootstrap.Modal.getInstance(document.getElementById('modalProduct'));
          if (modal) modal.hide();
          
          // Restaurar botón
          const submitBtn = document.querySelector('#modalProduct .btn-primary');
          if (submitBtn) {
            submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Agregar Producto';
          }
          
          Swal.fire({
            icon: 'success',
            title: 'Producto actualizado',
            text: 'Producto actualizado correctamente.',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            window.editingProductId = null;
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
          image: imageData,
          createdAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        await saveToStorage('products', products);
        renderInventory();
        renderSalesProducts();
        
        // Limpiar formulario y cerrar modal
        document.getElementById('formProduct').reset();
        document.getElementById('imagePreview').innerHTML = '';
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalProduct'));
        if (modal) modal.hide();
        
        Swal.fire({
          icon: 'success',
          title: 'Producto agregado',
          text: 'Producto agregado correctamente.',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el producto. Inténtalo de nuevo.',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Procesar imagen si existe
  if (imageInput && imageInput.files && imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => saveProduct(reader.result);
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    saveProduct('');
  }
}
// Function to get payment icon
function getPaymentIcon(paymentType) {
  switch(paymentType) {
    case 'cash':
      return 'cash-coin';
    case 'card':
      return 'credit-card';
    case 'transfer':
      return 'bank';
    case 'credit':
      return 'clock-history';
    default:
      return 'question-circle';
  }
}

// Function to get payment text
function getPaymentText(paymentType) {
  switch(paymentType) {
    case 'cash':
      return 'Pago en efectivo';
    case 'card':
      return 'Pago con tarjeta';
    case 'transfer':
      return 'Transferencia bancaria';
    case 'credit':
      return 'Venta a crédito';
    default:
      return 'Otro método de pago';
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
const clientPhotoInput = document.getElementById('clientPhoto');
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
async function renderInventory() {
  const container = document.getElementById('inventoryList');
  if (!container) return;
  
  // Verificar que products sea un array válido
  if (!products || !Array.isArray(products)) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <i class="bi bi-box-seam fs-1 text-muted"></i>
        <p class="mt-2 text-muted">No hay productos en el inventario</p>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalProduct">
          <i class="bi bi-plus-circle"></i> Agregar Producto
        </button>
      </div>
    `;
    return;
  }
  
  // Usar localForage para persistencia robusta
  let isGridView = true;
  if (typeof localforage !== 'undefined') {
    const val = await localforage.getItem('inventoryView');
    isGridView = val !== 'list';
  } else {
    isGridView = localStorage.getItem('inventoryView') !== 'list';
  }
  // ...resto del código...
  
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
  // Verificar que products sea un array válido
  if (!products || !Array.isArray(products)) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No hay productos disponibles.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
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
    if (!cart || !Array.isArray(cart)) {
      cart = [];
    }
    cart.push({ ...product, qty: 1 });
  }

  // Si hay un cliente seleccionado, guardar proforma
  if (currentClientId) {
    saveProforma(currentClientId, cart);
  }
  
  renderCart();
  // Animación shake al botón flotante del carrito
  const cartBtn = document.getElementById('floatingCartBtn');
  if (cartBtn) {
    cartBtn.classList.remove('shake-cart-btn'); // Reiniciar si ya está
    void cartBtn.offsetWidth; // Forzar reflow para reiniciar animación
    cartBtn.classList.add('shake-cart-btn');
  }
  
  // Mostrar notificación de producto agregado
  Swal.fire({
    icon: 'success',
    title: 'Producto agregado',
    text: `${product.name} agregado al carrito`,
    timer: 1000,
    showConfirmButton: false
  });
}

// === Mostrar carrito con diseño tipo Treinta.co ===
function renderCart() {
  const container = document.getElementById('cartList');
  const totalElement = document.getElementById('cartTotal');
  const finalizeBtn = document.getElementById('finalizeBtn');
  const clearCartBtn = document.getElementById('clearCartBtn');
  
  if (!container) return;

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-cart-x" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">Carrito vacío</p>
        <small class="text-muted">Selecciona productos para comenzar</small>
      </div>
    `;
    totalElement.textContent = '$0.00';
    finalizeBtn.disabled = true;
    clearCartBtn.style.display = 'none';
    // Quitar resaltado si está vacío
    const cartBtn = document.getElementById('floatingCartBtn');
    if (cartBtn) cartBtn.classList.remove('cart-has-items');
    return;
  }

  clearCartBtn.style.display = 'block';
  // Resaltar el botón flotante si el carrito tiene productos
  const cartBtn = document.getElementById('floatingCartBtn');
  if (cartBtn) cartBtn.classList.add('cart-has-items');

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
          <button class="btn btn-sm btn-outline-secondary" onclick="changeCartQty('${item.id}', -1)">-</button>
          <span class="qty-display">${item.qty}</span>
          <button class="btn btn-sm btn-outline-secondary" onclick="changeCartQty('${item.id}', 1)">+</button>
        </div>
        <div class="cart-item-info-treinta">
          <div class="cart-item-name-treinta">${item.name}</div>
          <div class="cart-item-price-treinta">$${item.price.toFixed(2)} c/u</div>
        </div>
        <div class="cart-item-actions-treinta">
          <div class="cart-item-total-treinta">$${(item.price * item.qty).toFixed(2)}</div>
          <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart('${item.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  totalElement.textContent = `$${total.toFixed(2)}`;
  finalizeBtn.disabled = false; // Permitir finalizar venta sin cliente seleccionado
}

function changeCartQty(productId, delta) {
  // Verificar que cart sea un array válido
  if (!cart || !Array.isArray(cart)) return;
  
  const idx = cart.findIndex(item => item.id === productId);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty < 1) cart[idx].qty = 1;
  if (currentClientId) {
    saveProforma(currentClientId, cart);
  }
  renderCart();
}

// === Vaciar carrito ===
function clearCart() {
  cart = [];
  if (currentClientId) {
    saveProforma(currentClientId, []);
  }
  renderCart();
}

// === Finalizar venta con comprobante tipo Treinta.co ===
async function finalizeSale() {
  if (cart.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Carrito vacío',
      text: 'Agrega productos al carrito para continuar.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  // Si no hay cliente seleccionado, mostrar selector de cliente
  if (!currentClientId) {
    // Verificar si estamos en el drawer Temu y usar el cliente seleccionado ahí
    const clientSelect = document.getElementById('saleClientDrawer');
    if (clientSelect && clientSelect.value) {
      currentClientId = clientSelect.value;
    } else {
      // Mostrar selector de cliente si no hay ninguno seleccionado
      Swal.fire({
        title: 'Seleccionar Cliente',
        html: `
          <select id="clientSelector" class="form-select form-select-treinta">
            <option value="">Selecciona un cliente...</option>
            ${clients.map(client => `
              <option value="${client.id}">${client.name}</option>
            `).join('')}
          </select>
        `,
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const selectedClientId = document.getElementById('clientSelector').value;
          if (!selectedClientId) {
            Swal.showValidationMessage('Debes seleccionar un cliente');
            return false;
          }
          return selectedClientId;
        }
      }).then((result) => {
        if (result.isConfirmed) {
          currentClientId = result.value;
          finalizeSale(); // Llamar recursivamente con el cliente seleccionado
        }
      });
      return;
    }
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
  }).then(async (result) => {
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
      
      // Obtener fecha local (del drawer o actual)
      let now = new Date();
      let saleDateStr = getEcuadorDateString(); // Usar fecha de Ecuador
      const dateInput = document.getElementById('saleDateDrawer');
      if (dateInput && dateInput.value) {
        saleDateStr = dateInput.value;
      }
      let [year, month, day] = saleDateStr.split('-');
      let localDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );
      let saleDate = `${year}-${month}-${day}T${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
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
        date: saleDate,
        time: localDate.toLocaleTimeString()
      };
      
      if (!sales || !Array.isArray(sales)) {
        sales = [];
      }
      sales.push(sale);
      
      // Agregar movimiento para la sección de movimientos
      const movement = {
        type: 'sale',
        icon: 'bi-cart-check',
        title: `Venta #${sale.id}`,
        subtitle: `${client.name} - ${new Date(saleDate).toLocaleDateString()}`,
        amount: finalTotal,
        amountClass: 'positive',
        date: new Date(saleDate),
        data: sale,
        category: 'ventas'
      };
      
      if (!movements || !Array.isArray(movements)) {
        movements = [];
      }
      movements.push(movement);
      
      try {
        await saveToStorage('sales', sales);
        await saveToStorage('products', products);
        await saveToStorage('movements', movements);
      } catch (error) {
        console.error('Error guardando venta:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar la venta. Inténtalo de nuevo.',
          confirmButtonText: 'Aceptar'
        });
        return;
      }
      
      // Limpiar carrito
      clearCart();
      
      // Actualizar balance
      updateBalanceUI();
      renderBalanceGrid(); // Actualizar movimientos en tiempo real
      
      // Cerrar drawer si está abierto
      const drawer = document.getElementById('cartDrawer');
      if (drawer && drawer.classList.contains('open')) {
        toggleCartDrawer();
      }
      
      // Mostrar comprobante
      showReceipt(sale);
      
    } else if (result.isDenied) {
      // Venta a crédito
      showCreditSaleModal(total, cost, client);
    }
  });
}

// === Agregar/Editar cliente con validación mejorada ===
async function addClient(e) {
  e.preventDefault();
  
  // Asegurar que clients sea un array
  if (!Array.isArray(clients)) {
    clients = [];
  }
  
  // Obtener elementos del formulario
  const nameInput = document.getElementById('clientName');
  const phoneInput = document.getElementById('clientPhone');
  const addressInput = document.getElementById('clientAddress');
  const photoInput = document.getElementById('clientPhoto');
  const locationInput = document.getElementById('clientLocation');
  const locationStatus = document.getElementById('locationStatus');

  if (!nameInput || !phoneInput || !addressInput) {
    Swal.fire({
      icon: 'error',
      title: 'Error de formulario',
      text: 'Faltan campos obligatorios en el formulario.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();
  const location = locationInput ? locationInput.value.trim() : '';

  if (!name) {
    Swal.fire({
      icon: 'error',
      title: 'Nombre requerido',
      text: 'El nombre del cliente es obligatorio.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  if (phone && !/^[0-9]{7,15}$/.test(phone)) {
    Swal.fire({
      icon: 'error',
      title: 'Teléfono inválido',
      text: 'El número de teléfono debe tener entre 7 y 15 dígitos.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  // Actualizar estado de ubicación si existe
  if (locationStatus) {
    if (location) {
      locationStatus.textContent = 'Ubicación válida';
    } else {
      locationStatus.textContent = 'Ubicación no válida';
    }
  }

  const saveClient = async (photo) => {
    try {
      const clientData = {
        name,
        phone,
        address,
        location,
        photo: photo || (window.editingClientId ? clients.find(c => c.id === window.editingClientId)?.photo : '')
      };

      if (window.editingClientId) {
        const clientIndex = clients.findIndex(c => c.id === window.editingClientId);
        if (clientIndex !== -1) {
          clients[clientIndex] = { ...clients[clientIndex], ...clientData };
        }
      } else {
        clients.push({ 
          id: generateId('client'), 
          ...clientData, 
          debt: 0,
          createdAt: new Date().toISOString()
        });
      }

      await saveToStorage('clients', clients);
      renderClients();
      updateClientSelector();

      // Limpiar formulario
      if (document.getElementById('formClient')) {
        document.getElementById('formClient').reset();
      }
      if (document.getElementById('clientImagePreview')) {
        document.getElementById('clientImagePreview').innerHTML = '';
      }
      if (locationStatus) {
        locationStatus.textContent = '';
      }

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalClient'));
      if (modal) modal.hide();

      Swal.fire({
        icon: 'success',
        title: window.editingClientId ? 'Cliente actualizado' : 'Cliente agregado',
        text: `El cliente "${name}" se ha guardado correctamente.`,
        confirmButtonText: 'Aceptar'
      }).then(() => {
        if (window.editingClientId) {
          delete window.editingClientId;
          const submitBtn = document.querySelector('#modalClient .btn-primary');
          if (submitBtn) {
            submitBtn.innerHTML = '<i class="bi bi-person-plus"></i> Agregar Cliente';
          }
        }
      });
    } catch (error) {
      console.error('Error guardando cliente:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el cliente. Inténtalo de nuevo.',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Procesar foto si existe
  if (photoInput && photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => saveClient(reader.result);
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    saveClient('');
  }
}

// Renderizar clientes con diseño tipo Treinta.co
async function renderClients() {
  const container = document.getElementById('clientList');
  if (!container) return;
  
  // Verificar que clients sea un array válido
  if (!clients || !Array.isArray(clients)) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <i class="bi bi-people fs-1 text-muted"></i>
        <p class="mt-2 text-muted">No hay clientes registrados</p>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalClient">
          <i class="bi bi-person-plus"></i> Agregar Cliente
        </button>
      </div>
    `;
    return;
  }
  
  let isGridView = true;
  if (typeof localforage !== 'undefined') {
    await localforage.getItem('clientsView').then(val => { isGridView = val !== 'list'; });
  } else {
    isGridView = localStorage.getItem('clientsView') !== 'list';
  }
  
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
          <div class="d-flex justify-content-end gap-1 mt-2">
            <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteClient('${client.id}')" title="Eliminar cliente"><i class="bi bi-trash"></i></button>
            <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); editClient('${client.id}')" title="Editar cliente"><i class="bi bi-pencil"></i></button>
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
          <button class="btn btn-sm btn-outline-danger" onclick="deleteClient('${client.id}')" title="Eliminar cliente">
            <i class="bi bi-trash"></i>
          </button>
          <button class="btn btn-sm btn-outline-primary" onclick="editClient('${client.id}')" title="Editar cliente">
            <i class="bi bi-pencil"></i>
          </button>
        </div>
      </li>
    `).join('');
  }
// Eliminar cliente
function deleteClient(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) return;
  Swal.fire({
    icon: 'warning',
    title: '¿Eliminar cliente?',
    text: `Esta acción no se puede deshacer. ¿Eliminar a "${client.name}"?`,
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then(result => {
    if (result.isConfirmed) {
      // Eliminar cliente
      clients = clients.filter(c => c.id !== clientId);
      // Eliminar deudas asociadas
      debts = debts.filter(d => d.clientId !== clientId);
      // Eliminar proformas asociadas si existe función
      if (typeof deleteProforma === 'function') deleteProforma(clientId);
      // Si el cliente estaba seleccionado en el carrito, quitarlo
      if (currentClientId === clientId) currentClientId = null;
      saveToStorage('clients', clients);
      saveToStorage('debts', debts);
      renderClients();
      renderDebts && renderDebts();
      renderCart && renderCart();
      Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Cliente eliminado.' });
    }
  });
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
  if (!list) return;
  
  list.innerHTML = '';

  // Verificar que debts sea un array válido
  if (!debts || !Array.isArray(debts) || debts.length === 0) {
    list.innerHTML = `<div class='alert alert-secondary text-center'>Sin deudas registradas</div>`;
    return;
  }

  list.className = 'row gy-3';
  // Agrupar deudas por clienteId
  const debtsByClient = {};
  debts.forEach(debt => {
    const clientKey = debt.clientId || debt.clientName || 'Desconocido';
    if (!debtsByClient[clientKey]) debtsByClient[clientKey] = [];
    debtsByClient[clientKey].push(debt);
  });

  // Obtener el filtro de estado global (debe estar en window)
  let statusFilter = (typeof window !== 'undefined' && window.currentDebtStatusFilter) ? window.currentDebtStatusFilter : 'pending';
  list.innerHTML = Object.keys(debtsByClient).map(clientKey => {
    const clientDebts = debtsByClient[clientKey];
    const clientName = clientDebts[0].clientName || 'Cliente desconocido';
    // Filtrar deudas del cliente según el estado seleccionado
    const filteredDebts = clientDebts.filter(debt => {
      if (statusFilter === 'paid') {
        return debt.amount === 0;
      } else {
        return debt.amount > 0;
      }
    });
    if (filteredDebts.length === 0) return '';
    return `
      <div class="col-12 col-md-6 col-lg-4 debt-client-item mb-3" data-client-name="${clientName.replace(/"/g, '&quot;')}">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <span><i class="bi bi-person"></i> ${clientName}</span>
            <span class="badge bg-light text-primary">${filteredDebts.length} deuda${filteredDebts.length > 1 ? 's' : ''}</span>
          </div>
          <div class="card-body p-2">
            <div class="debt-list-client row g-2">
              ${filteredDebts.map(debt => {
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
                  <div class="col-12">
                    <div class="debt-item border rounded p-2 mb-1 d-flex justify-content-between align-items-center debt-card-treinta ${status}" data-debt-status="${status}" onclick="showDebtDetailModal('${debt.id}')">
                      <div>
                        <div class="fw-bold">${debt.reason || debt.description || 'Sin descripción'}</div>
                        <div class="text-muted small">${debt.date || ''}</div>
                      </div>
                      <div class="text-end">
                        <div class="text-danger fw-bold">$${(debt.total || debt.amount + (debt.abono || 0)).toFixed(2)}</div>
                        ${debt.abono ? `<div class='debt-abono text-success small'>Abonado: $${debt.abono.toFixed(2)}</div>` : ''}
                        <div class="debt-saldo small">Saldo: $${debt.amount.toFixed(2)}</div>
                        <span class="badge ${statusClass}">${statusText}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
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
// let deferredPrompt; // ELIMINADA: ya existe declaración global

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;

  // Aquí podrías mostrar un botón para instalar manualmente
  console.log("App puede instalarse. Ejecuta deferredPrompt.prompt() para instalar.");
});

// === Registrar Service Worker ===
// Función centralizada para registrar el service worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log("SW registrado:", registration.scope);
      
      // Escuchar actualizaciones del SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('Nueva versión del SW instalada');
            // No mostrar automáticamente el botón de instalación aquí
          }
        });
      });
      
      return registration;
    } catch (err) {
      console.error("SW error:", err);
      return null;
    }
  }
  return null;
}

// Registrar el service worker una sola vez
registerServiceWorker();

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
  const descriptionInput = document.getElementById('productDescription');
  const preview = document.getElementById('productImagePreview');
  
  if (nameInput) nameInput.value = product.name;
  if (costInput) costInput.value = product.cost;
  if (priceInput) priceInput.value = product.price;
  if (categoryInput) categoryInput.value = product.category || '';
  if (stockInput) stockInput.value = product.stock || 0;
  if (descriptionInput) descriptionInput.value = product.description || '';
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

// Renderizar productos en ventas con diseño tipo Treinta.co
function renderSalesProducts() {
  const container = document.getElementById('salesProductsGrid');
  const productsCount = document.getElementById('productsCount');
  if (!container) return;
  
  // Verificar que products sea un array válido
  if (!products || !Array.isArray(products)) {
    container.innerHTML = `
      <div class="text-center py-4" style="grid-column: 1 / -1;">
        <i class="bi bi-box-seam" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">No hay productos en el inventario</p>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalProduct">
          <i class="bi bi-plus-circle"></i> Agregar Producto
        </button>
      </div>
    `;
    if (productsCount) productsCount.textContent = '0 productos';
    return;
  }
  
  // Filtrar productos por búsqueda
  const searchTerm = document.getElementById('productSearch')?.value?.toLowerCase() || '';
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.description?.toLowerCase().includes(searchTerm)
  );
  
  if (productsCount) productsCount.textContent = `${filteredProducts.length} productos`;
  
  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4" style="grid-column: 1 / -1;">
        <i class="bi bi-search" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">No se encontraron productos</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filteredProducts.map(product => `
    <div class="product-card-treinta" onclick="addToCart('${product.id}')">
      <img src="${product.image || 'icons/descarga.png'}" 
           class="product-image-treinta" alt="${product.name}" onerror="this.src='icons/descarga.png'">
      <div class="product-info-treinta">
        <div class="product-name-treinta">${product.name}</div>
        <div class="product-price-treinta">$${product.price.toFixed(2)}</div>
        <div class="product-stock-treinta">
          <i class="bi bi-box-seam"></i> Stock: ${product.stock}
        </div>
        <div class="product-actions-treinta">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); addToCart('${product.id}')" ${product.stock <= 0 ? 'disabled' : ''}>
            <i class="bi bi-plus"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm" onclick="event.stopPropagation(); showProductDetailModal('${product.id}')">
            <i class="bi bi-eye"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Cambiar vista de productos en ventas
async function toggleSalesView() {
  let currentView = 'grid';
  if (typeof localforage !== 'undefined') {
    const val = await localforage.getItem('salesView');
    currentView = val || 'grid';
  } else {
    currentView = localStorage.getItem('salesView') || 'grid';
  }
  const newView = currentView === 'list' ? 'grid' : 'list';
  if (typeof localforage !== 'undefined') {
    await localforage.setItem('salesView', newView);
  } else {
    localStorage.setItem('salesView', newView);
  }
  const toggleBtn = document.getElementById('toggleSalesView');
  const toggleText = document.getElementById('toggleSalesViewText');
  if (newView === 'grid') {
    toggleBtn.innerHTML = '<i class="bi bi-list"></i> <span id="toggleSalesViewText">Lista</span>';
  } else {
    toggleBtn.innerHTML = '<i class="bi bi-grid-3x3-gap-fill"></i> <span id="toggleSalesViewText">Cuadrícula</span>';
  }
  await renderSalesProducts();
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
async function toggleClientsView() {
  let currentView = 'grid';
  if (typeof localforage !== 'undefined') {
    const val = await localforage.getItem('clientsView');
    currentView = val || 'grid';
  } else {
    currentView = localStorage.getItem('clientsView') || 'grid';
  }
  const newView = currentView === 'list' ? 'grid' : 'list';
  if (typeof localforage !== 'undefined') {
    await localforage.setItem('clientsView', newView);
  } else {
    localStorage.setItem('clientsView', newView);
  }
  const toggleBtn = document.getElementById('toggleClientsView');
  const toggleText = document.getElementById('toggleClientsViewText');
  if (newView === 'grid') {
    toggleBtn.innerHTML = '<i class="bi bi-list"></i> <span id="toggleClientsViewText">Lista</span>';
  } else {
    toggleBtn.innerHTML = '<i class="bi bi-grid-3x3-gap-fill"></i> <span id="toggleClientsViewText">Cuadrícula</span>';
  }
  await renderClients();
}

// Remover producto del carrito
function removeFromCart(productId) {
  // Verificar que cart sea un array válido
  if (!cart || !Array.isArray(cart)) return;
  
  const index = cart.findIndex(item => item.id === productId);
  if (index !== -1) {
    cart.splice(index, 1);
    saveProforma(currentClientId, cart);
    renderCart();
  }
}

// === Renderizar balance con diseño tipo Treinta.co ===
function renderBalanceGrid(opts = {}) {
  let currentPeriod = document.querySelector('input[name="periodFilter"]:checked')?.value || 'day';
  let data, movements;
  if (opts && opts.fecha) {
    // Si se pasa una fecha, filtrar solo ese día
    data = calculateBalanceData('custom', opts.fecha);
    movements = getRecentMovements('custom', opts.fecha);
  } else {
    data = calculateBalanceData(currentPeriod);
    movements = getRecentMovements(currentPeriod);
  }
  
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
      <div class="balance-card-amount">$${(debts && Array.isArray(debts) ? debts.reduce((sum, d) => sum + d.amount, 0) : 0).toFixed(2)}</div>
      <div class="balance-card-change">
        <i class="bi bi-clock"></i>
        <span>${debts && Array.isArray(debts) ? debts.length : 0} deudas pendientes</span>
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
  
  movementsContainer.innerHTML = (movements && Array.isArray(movements) ? movements.map((movement, idx) => `
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
  `).join('') : '');
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

function calculateBalanceData(period, customDate) {
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
  
  let checkPeriod;
  if (period === 'custom' && customDate) {
    const custom = new Date(customDate);
    checkPeriod = (d) => isSameDay(d, custom);
  } else {
    checkPeriod = period === 'day' ? (d) => isSameDay(d, now) : period === 'week' ? (d) => isSameWeek(d, now) : period === 'month' ? (d) => isSameMonth(d, now) : (d) => isSameYear(d, now);
  }
  
  let income = 0, expenses = 0, profit = 0;
  
  // Verificar que sales sea un array válido
  if (sales && Array.isArray(sales)) {
    sales.forEach(s => {
      if (s && s.date && s.total !== undefined) {
        const fecha = new Date(s.date);
        if (checkPeriod(fecha)) {
          income += s.total || 0;
          profit += s.profit || 0;
        }
      }
    });
  }
  
  // Verificar que chickenSales sea un array válido y agregar ventas de pollos
  if (chickenSales && Array.isArray(chickenSales)) {
    chickenSales.forEach(s => {
      if (s && s.date && s.total !== undefined) {
        const fecha = new Date(s.date);
        if (checkPeriod(fecha)) {
          income += s.total || 0;
          profit += s.total || 0; // Para pollos, el total es la utilidad
        }
      }
    });
  }
  
  // Gastos (costos de ventas)
  expenses = income - profit;
  
  return { income, expenses, profit };
}

function getRecentMovements(period, customDate) {
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
  
  // Verificar que sales sea un array válido y agregar ventas del periodo
  if (sales && Array.isArray(sales)) {
    sales.forEach(sale => {
      if (sale && sale.date && sale.id && sale.clientName && sale.total !== undefined) {
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
  
  // Verificar que chickenSales sea un array válido y agregar ventas de pollos del periodo
  if (chickenSales && Array.isArray(chickenSales)) {
    chickenSales.forEach(sale => {
      if (sale && sale.date && sale.id && sale.clientName && sale.total !== undefined) {
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
  
  // Verificar que debts sea un array válido y agregar deudas del periodo
  if (debts && Array.isArray(debts)) {
    debts.forEach(debt => {
      if (debt && debt.date && debt.id && debt.clientName && debt.amount !== undefined) {
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
    
    // Agregar pagos de deudas del periodo
    debts.forEach(debt => {
      if (debt.payments && debt.payments.length > 0) {
        debt.payments.forEach(payment => {
          if (payment && payment.date && payment.amount !== undefined) {
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
          }
        });
      }
    });
  }
  
  // Ordenar por fecha más reciente y limitar a 10
  return movements
    .sort((a, b) => b.date - a.date)
    .slice(0, 10);
}

// Función para cambiar de vista
function showView(viewName) {
  // Ocultar todas las vistas
  document.querySelectorAll('.app-view').forEach(v => v.classList.add('d-none'));
  
  // Mostrar la vista seleccionada
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.remove('d-none');
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
  
  // Ejecutar funciones específicas según la vista
  switch (viewName) {
    case 'balance':
      updateBalanceUI();
      showAdvancedStats(); // Agregar estadísticas avanzadas
      break;
    case 'sales':
      renderSalesProducts();
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
      // La inicialización se maneja por el observer
      break;
    case 'chickens':
      // Inicializar datos de pollos y actualizar estadísticas
      initializeChickenData();
      updateChickenStats();
      updateChickenClientSelector();
      updateChickenSalesList();
      setupChickenEventListeners();
      break;
  }
  
  // Cerrar sidebar en móviles
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
  
  // Limpiar recursos de movimientos si se cambia de vista
  if (viewName !== 'movements') {
    cleanupMovementsView();
  }
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
      const totalDebt = clientDebts && Array.isArray(clientDebts) ? clientDebts.reduce((sum, d) => sum + d.amount, 0) : 0;
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
  if (!client) {
    Swal.fire({
      icon: 'error',
      title: 'Cliente no encontrado',
      text: 'No se pudo encontrar el cliente para editar.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  // Llenar el formulario con los datos del cliente
  const nameInput = document.getElementById('clientName');
  const phoneInput = document.getElementById('clientPhone');
  const addressInput = document.getElementById('clientAddress');
  const locationInput = document.getElementById('clientLocation');
  const preview = document.getElementById('clientImagePreview');
  
  if (nameInput) nameInput.value = client.name || '';
  if (phoneInput) phoneInput.value = client.phone || '';
  if (addressInput) addressInput.value = client.address || '';
  if (locationInput) locationInput.value = client.location || '';
  
  if (preview) {
    if (client.photo) {
      preview.innerHTML = `<img src="${client.photo}" alt="Foto actual">`;
    } else {
      preview.innerHTML = '';
    }
  }
  
  // Actualizar estado de ubicación
  const locationStatus = document.getElementById('locationStatus');
  if (locationStatus) {
    if (client.location) {
      locationStatus.textContent = 'Ubicación válida';
    } else {
      locationStatus.textContent = 'Ubicación no válida';
    }
  }
  
  // Guardar el ID del cliente a editar
  window.editingClientId = clientId;
  
  // Cambiar el texto del botón
  const submitBtn = document.querySelector('#modalClient .btn-primary');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Actualizar Cliente';
  }
  
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
  
  // Verificar que los arrays existan y sean válidos
  const salesArray = sales && Array.isArray(sales) ? sales : [];
  const clientsArray = clients && Array.isArray(clients) ? clients : [];
  const productsArray = products && Array.isArray(products) ? products : [];
  const debtsArray = debts && Array.isArray(debts) ? debts : [];
  
  const stats = {
    totalSales: salesArray.length,
    totalClients: clientsArray.length,
    totalProducts: productsArray.length,
    avgSaleValue: data.income / Math.max(salesArray.length, 1),
    profitMargin: ((data.profit / data.income) * 100) || 0,
    topSellingProduct: getTopSellingProduct(),
    mostValuableClient: getMostValuableClient(),
    debtRatio: ((debtsArray.reduce((sum, d) => sum + (d.amount || 0), 0)) / Math.max(data.income, 1)) * 100
  };
  
  return stats;
}

// Obtener producto más vendido
function getTopSellingProduct() {
  const productSales = {};
  
  // Verificar que sales sea un array válido
  if (sales && Array.isArray(sales)) {
    sales.forEach(sale => {
      if (sale && sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          if (item && item.id && item.qty) {
            productSales[item.id] = (productSales[item.id] || 0) + item.qty;
          }
        });
      }
    });
  }
  
  const topProduct = Object.entries(productSales)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (topProduct) {
    const product = products && Array.isArray(products) ? products.find(p => p.id === topProduct[0]) : null;
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
  
  // Verificar que sales sea un array válido
  if (sales && Array.isArray(sales)) {
    sales.forEach(sale => {
      if (sale && sale.clientId && sale.total !== undefined) {
        clientSales[sale.clientId] = (clientSales[sale.clientId] || 0) + sale.total;
      }
    });
  }
  
  const topClient = Object.entries(clientSales)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (topClient) {
    const client = clients && Array.isArray(clients) ? clients.find(c => c.id === topClient[0]) : null;
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

// Backup automático iniciado
console.log('📝 Backup automático iniciado');

// Función para verificar el estado de los backups automáticos
async function checkBackupStatus() {
  console.log('🔍 Verificando estado de backups automáticos...');
  
  const status = {
    telegram: {
      configured: false,
      enabled: false,
      lastBackup: null,
      lastError: null,
      nextBackup: null,
      interval: null
    },
    googleDrive: {
      configured: false,
      enabled: false,
      lastBackup: null,
      lastError: null,
      nextBackup: null,
      interval: null,
      tokenValid: false
    },
    local: {
      enabled: false,
      lastBackup: null,
      interval: null
    }
  };

  // Verificar backup local
  try {
    const backupInterval = localStorage.getItem('backupInterval');
    if (backupInterval) {
      status.local.enabled = true;
      status.local.interval = parseInt(backupInterval);
      status.local.lastBackup = localStorage.getItem('lastLocalBackup');
    }
  } catch (error) {
    console.error('Error verificando backup local:', error);
  }

  // Verificar backup de Telegram
  try {
    const telegramConfig = await localforage.getItem('telegram_backup_config');
    if (telegramConfig && telegramConfig.enabled) {
      status.telegram.configured = true;
      status.telegram.enabled = true;
      status.telegram.interval = telegramConfig.interval;
      status.telegram.lastBackup = localStorage.getItem('lastTelegramBackup');
      status.telegram.lastError = localStorage.getItem('lastTelegramBackupError');
      
      if (status.telegram.lastBackup) {
        const lastBackupTime = parseInt(status.telegram.lastBackup);
        const nextBackupTime = lastBackupTime + (telegramConfig.interval * 60 * 1000);
        status.telegram.nextBackup = nextBackupTime;
      }
    }
  } catch (error) {
    console.error('Error verificando backup de Telegram:', error);
  }

  // Verificar backup de Google Drive
  try {
    const googleToken = localStorage.getItem('googleAccessToken');
    const googleInterval = localStorage.getItem('googleDriveBackupInterval');
    
    if (googleToken) {
      status.googleDrive.configured = true;
      status.googleDrive.enabled = true;
      status.googleDrive.interval = parseInt(googleInterval) || 60;
      status.googleDrive.lastBackup = localStorage.getItem('lastGoogleDriveBackup');
      status.googleDrive.lastError = localStorage.getItem('lastGoogleDriveBackupError');
      
      // Verificar si el token es válido
      const tokenTimestamp = localStorage.getItem('googleTokenTimestamp');
      if (tokenTimestamp) {
        const tokenAge = Date.now() - parseInt(tokenTimestamp);
        const tokenMaxAge = 50 * 60 * 1000; // 50 minutos
        status.googleDrive.tokenValid = tokenAge < tokenMaxAge;
      }
      
      if (status.googleDrive.lastBackup) {
        const lastBackupTime = parseInt(status.googleDrive.lastBackup);
        const nextBackupTime = lastBackupTime + (status.googleDrive.interval * 60 * 1000);
        status.googleDrive.nextBackup = nextBackupTime;
      }
    }
  } catch (error) {
    console.error('Error verificando backup de Google Drive:', error);
  }

  console.log('📊 Estado de backups:', status);
  return status;
}

// Función para mostrar el estado de backups en una interfaz amigable
async function showBackupStatus() {
  const status = await checkBackupStatus();
  
  let html = `
    <div class="backup-status-container">
      <h5 class="mb-3">Estado de Backups Automáticos</h5>
      
      <div class="row">
        <div class="col-md-4">
          <div class="card ${status.local.enabled ? 'border-success' : 'border-secondary'}">
            <div class="card-header">
              <h6 class="mb-0">📱 Backup Local</h6>
            </div>
            <div class="card-body">
              <p class="mb-1"><strong>Estado:</strong> ${status.local.enabled ? '✅ Activo' : '❌ Inactivo'}</p>
              ${status.local.enabled ? `
                <p class="mb-1"><strong>Intervalo:</strong> ${status.local.interval} minutos</p>
                <p class="mb-1"><strong>Último backup:</strong> ${status.local.lastBackup ? new Date(parseInt(status.local.lastBackup)).toLocaleString() : 'Nunca'}</p>
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card ${status.telegram.enabled ? 'border-success' : 'border-secondary'}">
            <div class="card-header">
              <h6 class="mb-0">📱 Telegram</h6>
            </div>
            <div class="card-body">
              <p class="mb-1"><strong>Estado:</strong> ${status.telegram.enabled ? '✅ Activo' : status.telegram.configured ? '⚠️ Configurado pero inactivo' : '❌ No configurado'}</p>
              ${status.telegram.enabled ? `
                <p class="mb-1"><strong>Intervalo:</strong> ${status.telegram.interval} minutos</p>
                <p class="mb-1"><strong>Último backup:</strong> ${status.telegram.lastBackup ? new Date(parseInt(status.telegram.lastBackup)).toLocaleString() : 'Nunca'}</p>
                ${status.telegram.nextBackup ? `<p class="mb-1"><strong>Próximo backup:</strong> ${new Date(status.telegram.nextBackup).toLocaleString()}</p>` : ''}
                ${status.telegram.lastError ? `<p class="mb-1 text-danger"><strong>Último error:</strong> ${localStorage.getItem('lastTelegramBackupErrorMsg') || 'Error desconocido'}</p>` : ''}
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card ${status.googleDrive.enabled && status.googleDrive.tokenValid ? 'border-success' : 'border-secondary'}">
            <div class="card-header">
              <h6 class="mb-0">☁️ Google Drive</h6>
            </div>
            <div class="card-body">
              <p class="mb-1"><strong>Estado:</strong> ${status.googleDrive.enabled && status.googleDrive.tokenValid ? '✅ Activo' : status.googleDrive.configured ? '⚠️ Configurado pero token inválido' : '❌ No configurado'}</p>
              ${status.googleDrive.enabled ? `
                <p class="mb-1"><strong>Intervalo:</strong> ${status.googleDrive.interval} minutos</p>
                <p class="mb-1"><strong>Token válido:</strong> ${status.googleDrive.tokenValid ? '✅ Sí' : '❌ No'}</p>
                <p class="mb-1"><strong>Último backup:</strong> ${status.googleDrive.lastBackup ? new Date(parseInt(status.googleDrive.lastBackup)).toLocaleString() : 'Nunca'}</p>
                ${status.googleDrive.nextBackup ? `<p class="mb-1"><strong>Próximo backup:</strong> ${new Date(status.googleDrive.nextBackup).toLocaleString()}</p>` : ''}
                ${status.googleDrive.lastError ? `<p class="mb-1 text-danger"><strong>Último error:</strong> ${localStorage.getItem('lastGoogleDriveBackupErrorMsg') || 'Error desconocido'}</p>` : ''}
              ` : ''}
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-3">
        <button class="btn btn-primary btn-sm" onclick="checkBackupStatus().then(console.log)">
          🔄 Actualizar Estado
        </button>
        <button class="btn btn-warning btn-sm" onclick="forceBackupTest()">
          🧪 Probar Backups
        </button>
      </div>
    </div>
  `;
  
  Swal.fire({
    title: 'Estado de Backups',
    html: html,
    width: '800px',
    showConfirmButton: true,
    confirmButtonText: 'Cerrar'
  });
}

// Función para forzar una prueba de todos los backups
async function forceBackupTest() {
  console.log('🧪 Iniciando prueba de backups...');
  
  const results = {
    local: false,
    telegram: false,
    googleDrive: false
  };
  
  try {
    // Probar backup local
    const localSuccess = await saveAllCriticalData();
    results.local = localSuccess;
    console.log('✅ Backup local:', localSuccess ? 'Exitoso' : 'Falló');
  } catch (error) {
    console.error('❌ Error en backup local:', error);
  }
  
  try {
    // Probar backup de Telegram
    const telegramConfig = await localforage.getItem('telegram_backup_config');
    if (telegramConfig && telegramConfig.enabled) {
      const data = await getAllAppData();
      await sendTelegramBackup(telegramConfig, data);
      results.telegram = true;
      console.log('✅ Backup de Telegram: Exitoso');
    } else {
      console.log('⚠️ Backup de Telegram: No configurado');
    }
  } catch (error) {
    console.error('❌ Error en backup de Telegram:', error);
  }
  
  try {
    // Probar backup de Google Drive
    if (typeof ensureGoogleAccessToken === 'function') {
      const tokenValid = await ensureGoogleAccessToken();
      if (tokenValid) {
        const data = await getAllAppData();
        const fileContent = JSON.stringify(data, null, 2);
        await uploadBackupToDrive(fileContent);
        results.googleDrive = true;
        console.log('✅ Backup de Google Drive: Exitoso');
      } else {
        console.log('❌ Backup de Google Drive: Token inválido');
      }
    } else {
      console.log('⚠️ Backup de Google Drive: Función no disponible');
    }
  } catch (error) {
    console.error('❌ Error en backup de Google Drive:', error);
  }
  
  console.log('📊 Resultados de prueba:', results);
  
  Swal.fire({
    title: 'Prueba de Backups Completada',
    html: `
      <div class="text-left">
        <p><strong>Backup Local:</strong> ${results.local ? '✅ Exitoso' : '❌ Falló'}</p>
        <p><strong>Backup Telegram:</strong> ${results.telegram ? '✅ Exitoso' : '❌ Falló'}</p>
        <p><strong>Backup Google Drive:</strong> ${results.googleDrive ? '✅ Exitoso' : '❌ Falló'}</p>
      </div>
    `,
    icon: 'info'
  });
}

// Función para mostrar el estado de backups en una interfaz amigable
async function showBackupStatus() {
  const status = await checkBackupStatus();
  
  let html = `
    <div class="backup-status-container">
      <h5 class="mb-3">Estado de Backups Automáticos</h5>
      
      <div class="row">
        <div class="col-md-4">
          <div class="card ${status.local.enabled ? 'border-success' : 'border-secondary'}">
            <div class="card-header">
              <h6 class="mb-0">📱 Backup Local</h6>
            </div>
            <div class="card-body">
              <p class="mb-1"><strong>Estado:</strong> ${status.local.enabled ? '✅ Activo' : '❌ Inactivo'}</p>
              ${status.local.enabled ? `
                <p class="mb-1"><strong>Intervalo:</strong> ${status.local.interval} minutos</p>
                <p class="mb-1"><strong>Último backup:</strong> ${status.local.lastBackup ? new Date(parseInt(status.local.lastBackup)).toLocaleString() : 'Nunca'}</p>
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card ${status.telegram.enabled ? 'border-success' : 'border-secondary'}">
            <div class="card-header">
              <h6 class="mb-0">📱 Telegram</h6>
            </div>
            <div class="card-body">
              <p class="mb-1"><strong>Estado:</strong> ${status.telegram.enabled ? '✅ Activo' : status.telegram.configured ? '⚠️ Configurado pero inactivo' : '❌ No configurado'}</p>
              ${status.telegram.enabled ? `
                <p class="mb-1"><strong>Intervalo:</strong> ${status.telegram.interval} minutos</p>
                <p class="mb-1"><strong>Último backup:</strong> ${status.telegram.lastBackup ? new Date(parseInt(status.telegram.lastBackup)).toLocaleString() : 'Nunca'}</p>
                ${status.telegram.nextBackup ? `<p class="mb-1"><strong>Próximo backup:</strong> ${new Date(status.telegram.nextBackup).toLocaleString()}</p>` : ''}
                ${status.telegram.lastError ? `<p class="mb-1 text-danger"><strong>Último error:</strong> ${localStorage.getItem('lastTelegramBackupErrorMsg') || 'Error desconocido'}</p>` : ''}
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card ${status.googleDrive.enabled && status.googleDrive.tokenValid ? 'border-success' : 'border-secondary'}">
            <div class="card-header">
              <h6 class="mb-0">☁️ Google Drive</h6>
            </div>
            <div class="card-body">
              <p class="mb-1"><strong>Estado:</strong> ${status.googleDrive.enabled && status.googleDrive.tokenValid ? '✅ Activo' : status.googleDrive.configured ? '⚠️ Configurado pero token inválido' : '❌ No configurado'}</p>
              ${status.googleDrive.enabled ? `
                <p class="mb-1"><strong>Intervalo:</strong> ${status.googleDrive.interval} minutos</p>
                <p class="mb-1"><strong>Token válido:</strong> ${status.googleDrive.tokenValid ? '✅ Sí' : '❌ No'}</p>
                <p class="mb-1"><strong>Último backup:</strong> ${status.googleDrive.lastBackup ? new Date(parseInt(status.googleDrive.lastBackup)).toLocaleString() : 'Nunca'}</p>
                ${status.googleDrive.nextBackup ? `<p class="mb-1"><strong>Próximo backup:</strong> ${new Date(status.googleDrive.nextBackup).toLocaleString()}</p>` : ''}
                ${status.googleDrive.lastError ? `<p class="mb-1 text-danger"><strong>Último error:</strong> ${localStorage.getItem('lastGoogleDriveBackupErrorMsg') || 'Error desconocido'}</p>` : ''}
              ` : ''}
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-3">
        <button class="btn btn-primary btn-sm" onclick="checkBackupStatus().then(console.log)">
          🔄 Actualizar Estado
        </button>
        <button class="btn btn-warning btn-sm" onclick="forceBackupTest()">
          🧪 Probar Backups
        </button>
      </div>
    </div>
  `;
  
  Swal.fire({
    title: 'Estado de Backups',
    html: html,
    width: '800px',
    showConfirmButton: true,
    confirmButtonText: 'Cerrar'
  });
}

// Función para forzar una prueba de todos los backups
async function forceBackupTest() {
  console.log('🧪 Iniciando prueba de backups...');
  
  const results = {
    local: false,
    telegram: false,
    googleDrive: false
  };
  
  try {
    // Probar backup local
    const localSuccess = await saveAllCriticalData();
    results.local = localSuccess;
    console.log('✅ Backup local:', localSuccess ? 'Exitoso' : 'Falló');
  } catch (error) {
    console.error('❌ Error en backup local:', error);
  }
  
  try {
    // Probar backup de Telegram
    const telegramConfig = await localforage.getItem('telegram_backup_config');
    if (telegramConfig && telegramConfig.enabled) {
      const data = await getAllAppData();
      await sendTelegramBackup(telegramConfig, data);
      results.telegram = true;
      console.log('✅ Backup de Telegram: Exitoso');
    } else {
      console.log('⚠️ Backup de Telegram: No configurado');
    }
  } catch (error) {
    console.error('❌ Error en backup de Telegram:', error);
  }
  
  try {
    // Probar backup de Google Drive
    if (typeof ensureGoogleAccessToken === 'function') {
      const tokenValid = await ensureGoogleAccessToken();
      if (tokenValid) {
        const data = await getAllAppData();
        const fileContent = JSON.stringify(data, null, 2);
        await uploadBackupToDrive(fileContent);
        results.googleDrive = true;
        console.log('✅ Backup de Google Drive: Exitoso');
      } else {
        console.log('❌ Backup de Google Drive: Token inválido');
      }
    } else {
      console.log('⚠️ Backup de Google Drive: Función no disponible');
    }
  } catch (error) {
    console.error('❌ Error en backup de Google Drive:', error);
  }
  
  console.log('📊 Resultados de prueba:', results);
  
  Swal.fire({
    title: 'Prueba de Backups Completada',
    html: `
      <div class="text-left">
        <p><strong>Backup Local:</strong> ${results.local ? '✅ Exitoso' : '❌ Falló'}</p>
        <p><strong>Backup Telegram:</strong> ${results.telegram ? '✅ Exitoso' : '❌ Falló'}</p>
        <p><strong>Backup Google Drive:</strong> ${results.googleDrive ? '✅ Exitoso' : '❌ Falló'}</p>
      </div>
    `,
    icon: 'info'
  });
}

// Inicializar funcionalidades avanzadas
document.addEventListener('DOMContentLoaded', function() {
  // Configurar búsqueda global
  setupGlobalSearch();
  
  // Configurar lazy loading
  setupLazyLoading();
  
  // Configurar corrección de accesibilidad
  setupAccessibilityFix();
  
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

// Función para corregir problemas de accesibilidad
function setupAccessibilityFix() {
  // Observar cambios en el atributo aria-hidden del contenido principal
  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const target = mutation.target;
          if (target.getAttribute('aria-hidden') === 'true') {
            // Verificar si hay elementos focables dentro
            const focusableElements = target.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
              // Si hay elementos focables, remover aria-hidden para evitar el error de accesibilidad
              target.removeAttribute('aria-hidden');
              console.debug('[Accesibilidad] Removido aria-hidden del contenido principal para evitar conflicto con elementos focables');
            }
          }
        }
      });
    });
    
    observer.observe(mainContent, { 
      attributes: true, 
      attributeFilter: ['aria-hidden'] 
    });
  }
  
  // También verificar periódicamente (menos frecuente)
  setInterval(() => {
    const mainContent = document.getElementById('mainContent');
    if (mainContent && mainContent.getAttribute('aria-hidden') === 'true') {
      const focusableElements = mainContent.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusableElements.length > 0) {
        mainContent.removeAttribute('aria-hidden');
        console.debug('[Accesibilidad] Corrección periódica: removido aria-hidden del contenido principal');
      }
    }
  }, 30000); // Verificar cada 30 segundos en lugar de 5
}

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
  if (products && Array.isArray(products)) {
    products.forEach((product, index) => {
      if (!product.id || !product.name || typeof product.price !== 'number') {
        errors.push(`Producto ${index + 1}: Datos incompletos o inválidos`);
      }
    });
  }
  
  // Validar clientes
  if (clients && Array.isArray(clients)) {
    clients.forEach((client, index) => {
      if (!client.id || !client.name) {
        errors.push(`Cliente ${index + 1}: Datos incompletos`);
      }
    });
  }
  
  // Validar ventas
  if (sales && Array.isArray(sales)) {
    sales.forEach((sale, index) => {
      if (!sale.id || !sale.clientId || typeof sale.total !== 'number') {
        errors.push(`Venta ${index + 1}: Datos incompletos`);
      }
    });
  }
  
  // Validar deudas
  if (debts && Array.isArray(debts)) {
    debts.forEach((debt, index) => {
      if (!debt.id || !debt.clientId || typeof debt.amount !== 'number') {
        errors.push(`Deuda ${index + 1}: Datos incompletos`);
      }
    });
  }
  
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
  if (products && Array.isArray(products)) {
    const originalProductsLength = products.length;
    products = products.filter(product => 
      product && product.id && product.name && typeof product.price === 'number'
    );
    if (products.length !== originalProductsLength) {
      cleaned = true;
      saveToStorage('products', products);
    }
  }
  
  // Limpiar clientes corruptos
  if (clients && Array.isArray(clients)) {
    const originalClientsLength = clients.length;
    clients = clients.filter(client => 
      client && client.id && client.name
    );
    if (clients.length !== originalClientsLength) {
      cleaned = true;
      saveToStorage('clients', clients);
    }
  }
  
  // Limpiar ventas corruptas
  if (sales && Array.isArray(sales)) {
    const originalSalesLength = sales.length;
    sales = sales.filter(sale => 
      sale && sale.id && sale.clientId && typeof sale.total === 'number'
    );
    if (sales.length !== originalSalesLength) {
      cleaned = true;
      saveToStorage('sales', sales);
    }
  }
  
  // Limpiar deudas corruptas
  if (debts && Array.isArray(debts)) {
    const originalDebtsLength = debts.length;
    debts = debts.filter(debt => 
      debt && debt.id && debt.clientId && typeof debt.amount === 'number'
    );
    if (debts.length !== originalDebtsLength) {
      cleaned = true;
      saveToStorage('debts', debts);
    }
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
  currentClientId = clientId;
  if (clientId) {
    // Cargar proforma guardada para este cliente
    loadProforma(clientId);
    renderCart();
    
    // Mostrar notificación
    const client = clients.find(c => c.id === clientId);
    if (client) {
      Swal.fire({
        icon: 'info',
        title: 'Cliente seleccionado',
        text: `Cliente: ${client.name}`,
        timer: 1500,
        showConfirmButton: false
      });
    }
  }
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
  
  Swal.fire({
    icon: 'info',
    title: 'Cliente eliminado',
    text: 'Selecciona otro cliente para continuar',
    timer: 1500,
    showConfirmButton: false
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
  if (sales && Array.isArray(sales)) {
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
  }
  
  // Agregar deudas del rango
  if (debts && Array.isArray(debts)) {
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
  }
  
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
    sales: 0,
    debts: 0,
    payments: 0
  };
  
  if (movements && Array.isArray(movements)) {
    movements.forEach(movement => {
      if (movement.type === 'sale') {
        summary.totalIncome += movement.amount;
        summary.sales++;
      } else if (movement.type === 'debt') {
        summary.totalDebts += movement.amount;
        summary.debts++;
      } else if (movement.type === 'payment') {
        summary.totalPayments += movement.amount;
        summary.payments++;
      }
    });
  }
  
  summary.totalExpenses = summary.totalIncome - summary.totalPayments;
  
  return summary;
}

// Función para renderizar resumen del período
function renderPeriodSummary(summary) {
  const container = document.getElementById('periodSummary');
  
  container.innerHTML = `
    <div class="row g-3">
      <div class="col-md-3">
        <div class="summary-card-treinta">
          <div class="summary-icon">
            <i class="bi bi-cart-check"></i>
          </div>
          <div class="summary-content">
            <div class="summary-value">${summary.sales}</div>
            <div class="summary-label">Ventas</div>
            <div class="summary-amount">$${summary.totalIncome.toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
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
      <div class="col-md-3">
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
      <div class="col-md-3">
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
    </div>
  `;
}

// Función para renderizar movimientos filtrados
function renderFilteredMovements(movements) {
  const container = document.getElementById('filteredMovementsList');
  const countElement = document.getElementById('filteredMovementsCount');
  
  if (!container || !countElement) return;
  
  // Verificar que movements sea un array válido
  if (!movements || !Array.isArray(movements)) {
    countElement.textContent = '0 movimientos';
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">Sin movimientos en este período</p>
      </div>
    `;
    return;
  }
  
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
    showReceipt(movement.data);
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
            <span>$${(sale.originalTotal || sale.total).toFixed(2)}</span>
          </div>
          ${(sale.discount || 0) > 0 ? `
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
  doc.text(`Subtotal: $${(sale.originalTotal || sale.total).toFixed(2)}`, 14, finalY + 10);
  
  if ((sale.discount || 0) > 0) {
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

// Función para mostrar detalles de un movimiento
function showMovementDetail(movementIndex) {
  const currentPeriod = document.querySelector('input[name="periodFilter"]:checked').value;
  const movements = getRecentMovements(currentPeriod);
  
  if (!movements || !Array.isArray(movements) || movementIndex >= movements.length) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo cargar el detalle del movimiento.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  const movement = movements[movementIndex];
  
  if (movement.type === 'sale') {
    // Mostrar comprobante de venta
    showReceipt(movement.data);
  } else if (movement.type === 'debt') {
    // Mostrar detalle de deuda
    showDebtDetailModal(movement.data.id);
  } else if (movement.type === 'payment') {
    // Mostrar detalle de pago
    showPaymentDetail(movement.data);
  } else if (movement.type === 'chicken_sale') {
    // Mostrar comprobante de venta de pollos
    showChickenReceipt(movement.data);
  }
}

// Función para mostrar detalle de pago
function showPaymentDetail(paymentData) {
  const { debt, payment } = paymentData;
  
  Swal.fire({
    title: `Pago de Deuda #${debt.id}`,
    html: `
      <div class="payment-detail-treinta">
        <div class="payment-info">
          <p><strong>Cliente:</strong> ${debt.clientName}</p>
          <p><strong>Monto del pago:</strong> $${payment.amount.toFixed(2)}</p>
          <p><strong>Fecha del pago:</strong> ${new Date(payment.date).toLocaleDateString()}</p>
          <p><strong>Deuda original:</strong> $${debt.amount.toFixed(2)}</p>
          <p><strong>Saldo restante:</strong> $${(debt.amount - payment.amount).toFixed(2)}</p>
        </div>
      </div>
    `,
    icon: 'info',
    confirmButtonText: 'Cerrar',
    showCancelButton: true,
    cancelButtonText: 'Ver Deuda Completa',
    cancelButtonColor: '#007bff'
  }).then((result) => {
    if (result.dismiss === Swal.DismissReason.cancel) {
      showDebtDetailModal(debt.id);
    }
  });
}

// Función para registrar pago de deuda
function registerDebtPayment(debtId) {
  const debt = debts.find(d => d.id === debtId);
  if (!debt) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se encontró la deuda especificada.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const { debt: paidDebt, payment } = data;
  
  // Configurar fuente
  doc.setFont('helvetica');
  doc.setFontSize(12);
  
  // Título
  doc.setFontSize(18);
  doc.text('COMPROBANTE DE PAGO', 105, 20, { align: 'center' });
  
  // Información del pago
  doc.setFontSize(12);
  doc.text(`Pago de Deuda #${paidDebt.id}`, 14, 35);
  doc.text(`Fecha: ${new Date(payment.date).toLocaleDateString()}`, 14, 45);
  doc.text(`Cliente: ${paidDebt.clientName}`, 14, 55);
  doc.text(`Monto pagado: $${payment.amount.toFixed(2)}`, 14, 65);
  
  // Información de la deuda original
  doc.text(`Deuda original: $${paidDebt.amount.toFixed(2)}`, 14, 80);
  
  // Calcular monto restante
  const totalPaid = (paidDebt.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = paidDebt.amount - totalPaid;
  doc.text(`Monto restante: $${remainingAmount.toFixed(2)}`, 14, 90);
  
  // Descripción si existe
  if (paidDebt.description) {
    doc.text(`Descripción: ${paidDebt.description}`, 14, 105);
  }
  
  // Pie de página
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('Generado por TillUp POS', 105, 280, { align: 'center' });
  
  // Descargar PDF
  doc.save(`pago_deuda_${paidDebt.id}_${new Date(payment.date).getTime()}.pdf`);
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
  
  // Inicializar datos de pollos
  initializeChickenData();
  
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
  
  // Actualizar fecha y hora
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  // Inicializar mejoras para experiencia nativa
  initializeNativeEnhancements();
  
  // Inicializar funciones de pollos
  updateChickenStats();
  updateChickenClientSelector();
  updateChickenSalesList();
  setupChickenEventListeners();
  
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
});

// === Función de debug para PWA ===
function debugPWA() {
  console.log('=== DEBUG PWA ===');
  console.log('deferredPrompt:', deferredPrompt);
  console.log('installButton:', installButton);
  console.log('isAppInstalled():', isAppInstalled());
  console.log('hasUserRejectedInstallation():', hasUserRejectedInstallation());
  console.log('navigator.serviceWorker:', navigator.serviceWorker);
  console.log('window.matchMedia(display-mode: standalone):', window.matchMedia('(display-mode: standalone)').matches);
  console.log('navigator.standalone:', navigator.standalone);
  
  // Verificar el estado del service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      console.log('SW Registration:', registration);
      if (registration) {
        console.log('SW State:', registration.active ? registration.active.state : 'No active');
        console.log('SW Scope:', registration.scope);
      }
    });
  }
  
  // Mostrar información en la consola
  Swal.fire({
    icon: 'info',
    title: 'Debug PWA',
    html: `
      <div class="text-start">
        <p><strong>deferredPrompt:</strong> ${deferredPrompt ? 'Disponible' : 'No disponible'}</p>
        <p><strong>installButton:</strong> ${installButton ? 'Encontrado' : 'No encontrado'}</p>
        <p><strong>App Instalada:</strong> ${isAppInstalled() ? 'Sí' : 'No'}</p>
        <p><strong>Service Worker:</strong> ${'serviceWorker' in navigator ? 'Soportado' : 'No soportado'}</p>
        <p><strong>Display Mode:</strong> ${window.matchMedia('(display-mode: standalone)').matches ? 'Standalone' : 'Browser'}</p>
      </div>
    `,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Forzar Instalación',
    denyButtonText: 'Limpiar Rechazo',
    cancelButtonText: 'OK'
  }).then(async (result) => {
    if (result.isConfirmed) {
      // Forzar la aparición del botón de instalación para pruebas
      if (installButton) {
        installButton.style.display = 'flex';
        installButton.classList.add('animate');
        Swal.fire('Botón mostrado', 'El botón de instalación ha sido forzado a aparecer para pruebas.', 'success');
      } else {
        Swal.fire('Error', 'No se encontró el botón de instalación.', 'error');
      }
    } else if (result.isDenied) {
      // Limpiar el estado de rechazo de instalación
      await clearInstallationRejection();
      await updateInstallButtonVisibility();
      Swal.fire('Estado limpiado', 'El estado de rechazo de instalación ha sido limpiado. El botón debería aparecer si está disponible.', 'success');
    }
  });
}

// === FUNCIONES GLOBALES PARA HTML ===
// Al final del archivo o después de definir cada función global:
window.generatePDF = generatePDF;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.setTheme = setTheme;
window.installPWA = installPWA;
window.addProduct = addProduct;
window.addClient = addClient;
window.editClient = editClient;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.showClientDetails = showClientDetails;
window.showClientDebts = showClientDebts;
window.showProductDetailModal = showProductDetailModal;
window.showView = showView;
window.toggleSalesView = toggleSalesView;
window.toggleInventoryView = toggleInventoryView;
window.toggleClientsView = toggleClientsView;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeCartQty = changeCartQty;
window.clearCart = clearCart;
window.finalizeSale = finalizeSale;
window.showReceipt = showReceipt;
window.printReceipt = printReceipt;
window.downloadReceiptPDF = downloadReceiptPDF;
window.showDebtDetailModal = showDebtDetailModal;
window.registerDebtPayment = registerDebtPayment;
window.handleChickenSale = handleChickenSale;
window.updatePricePerPound = updatePricePerPound;
window.showChickenReceipt = showChickenReceipt;
window.printChickenReceipt = printChickenReceipt;
window.downloadChickenReceiptPDF = downloadChickenReceiptPDF;
window.filterMovementsByDate = filterMovementsByDate;
window.showMovementDetail = showMovementDetail;
window.showPaymentDetail = showPaymentDetail;
window.forceUpdate = forceUpdate;
window.selectClientForCart = selectClientForCart;
window.removeSelectedClient = removeSelectedClient;
window.showAddClientModal = showAddClientModal;
window.showAdvancedStats = showAdvancedStats;
window.showAppStatus = showAppStatus;
window.exportAllData = exportAllData;
window.importData = importData;
window.showCredits = showCredits;
window.debugPWA = debugPWA;
window.clearInstallationRejection = clearInstallationRejection;

function showReceipt(sale) {
  // ... definición de la función ...
}
window.showReceipt = showReceipt;
// ... código posterior ...

// Inicializar botón de acciones rápidas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  initializeQuickActions();
});

// Función para inicializar el botón de acciones rápidas
function initializeQuickActions() {
  const quickActionsBtn = document.getElementById('quickActionsBtn');
  if (quickActionsBtn) {
    // Agregar tooltip
    quickActionsBtn.title = 'Acciones Rápidas';
    
    // Agregar efecto hover
    quickActionsBtn.addEventListener('mouseenter', () => {
      quickActionsBtn.style.transform = 'scale(1.05)';
    });
    
    quickActionsBtn.addEventListener('mouseleave', () => {
      quickActionsBtn.style.transform = 'scale(1)';
    });
    
    // Agregar efecto click
    quickActionsBtn.addEventListener('click', () => {
      quickActionsBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        quickActionsBtn.style.transform = 'scale(1)';
      }, 150);
    });
  }
}

// Función global para filtrar balance y pollos por fecha
function filtrarPorFecha(fechaStr) {
  // Filtrar Balance
  renderBalanceGrid({ fecha: fechaStr });
  // Filtrar Pollos
  updateChickenStats({ fecha: fechaStr });
  updateChickenSalesList({ fecha: fechaStr });
  // Cambiar a la vista de balance por defecto
  showView('balance');
  // Mostrar mensaje de éxito
  Swal.fire({
    icon: 'success',
    title: 'Filtrado por fecha',
    text: `Mostrando registros del ${new Date(fechaStr).toLocaleDateString()}`,
    timer: 1800,
    showConfirmButton: false,
    customClass: { popup: 'swal2-sale-treinta' }
  });
}

// Hacer funciones disponibles globalmente
window.updateChickenCalculation = updateChickenCalculation;
window.filtrarPorFecha = filtrarPorFecha;
window.updateChickenClientSelector = updateChickenClientSelector;
window.openClientSearchModal = openClientSearchModal;
window.closeClientSearchModal = closeClientSearchModal;
window.selectClientFromSearch = selectClientFromSearch;
window.openClientsSearchModal = openClientsSearchModal;
window.closeClientsSearchModal = closeClientsSearchModal;
window.selectClientFromClientsSearch = selectClientFromClientsSearch;
window.updateChickenStats = updateChickenStats;
window.updateChickenSalesList = updateChickenSalesList;
window.setupChickenEventListeners = setupChickenEventListeners;
window.initializeChickenData = initializeChickenData;
window.handleChickenSale = handleChickenSale;
window.finalizeChickenSale = finalizeChickenSale;

// Hacer funciones de comprobante de pollos disponibles globalmente
window.showChickenReceipt = showChickenReceipt;
window.printChickenReceipt = printChickenReceipt;
window.downloadChickenReceiptPDF = downloadChickenReceiptPDF;

// --- Drawer/cortina carrito Temu ---
function toggleCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartDrawerOverlay');
  const quickActions = document.querySelector('.quick-actions-fixed');
  if (!drawer || !overlay) return;
  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (quickActions) quickActions.style.zIndex = '';
  } else {
    renderCartDrawer();
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (quickActions) quickActions.style.zIndex = '1000'; // detrás del drawer
  }
}
// --- FIN Drawer/cortina carrito Temu ---

// === Renderizar productos en ventas con diseño tipo Temu ===
async function renderSalesProducts() {
  const container = document.getElementById('salesProductsGrid');
  if (!container) return;

  // Verificar que products sea un array válido
  if (!products || !Array.isArray(products)) {
    container.innerHTML = `
      <div class="text-center py-4" style="grid-column: 1 / -1;">
        <i class="bi bi-box-seam" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">No hay productos en el inventario</p>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalProduct">
          <i class="bi bi-plus-circle"></i> Agregar Producto
        </button>
      </div>
    `;
    return;
  }

  // Filtrar productos por búsqueda si existe el input
  const searchTerm = document.getElementById('productSearch')?.value?.toLowerCase() || '';
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.description?.toLowerCase().includes(searchTerm)
  );

  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4" style="grid-column: 1 / -1;">
        <i class="bi bi-search" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">No se encontraron productos</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredProducts.map(product => `
    <div class="product-card-temu">
      <img src="${product.image || 'icons/descarga.png'}" class="product-image-treinta" alt="${product.name}" onerror="this.src='icons/descarga.png'">
      <div class="product-name">${product.name}</div>
      <div class="product-price">$${product.price.toFixed(2)}</div>
      <div class="product-stock">Stock: ${product.stock}</div>
      <button class="add-to-cart-btn" onclick="addToCart('${product.id}'); event.stopPropagation();">
        <i class="bi bi-plus"></i> Agregar
      </button>
    </div>
  `).join('');
}

// --- Drawer/cortina carrito Temu ---
function renderCartDrawer() {
  const container = document.getElementById('cartListDrawer');
  const totalElement = document.getElementById('cartTotalDrawer');
  const badge = document.getElementById('cartCountBadge');
  if (!container || !totalElement || !badge) return;

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-cart-x" style="font-size: 2.5rem; color: #ccc;"></i>
        <p class="text-muted mt-2">Carrito vacío</p>
        <small class="text-muted">Selecciona productos para comenzar</small>
      </div>
    `;
    totalElement.textContent = '$0.00';
    badge.textContent = '0';
    return;
  }

  // Renderizar productos en el drawer
  container.innerHTML = cart.map(item => `
    <div class="cart-item-treinta d-flex align-items-center justify-content-between mb-2">
      <div class="d-flex align-items-center gap-2">
        <img src="${item.image || 'icons/descarga.png'}" alt="${item.name}" style="width:38px;height:38px;object-fit:cover;border-radius:8px;">
        <div>
          <div class="cart-item-name-treinta">${item.name}</div>
          <div class="cart-item-price-treinta">$${item.price.toFixed(2)} x${item.qty}</div>
        </div>
      </div>
      <div class="d-flex align-items-center gap-1">
        <button class="btn btn-sm btn-outline-secondary" onclick="changeCartQty('${item.id}', -1)">-</button>
        <span class="qty-display">${item.qty}</span>
        <button class="btn btn-sm btn-outline-secondary" onclick="changeCartQty('${item.id}', 1)">+</button>
        <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeFromCart('${item.id}')"><i class="bi bi-trash"></i></button>
      </div>
    </div>
  `).join('');

  // Calcular total y cantidad
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  totalElement.textContent = `$${total.toFixed(2)}`;
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = totalQty;
}

// Sobrescribir addToCart para actualizar el drawer y badge
function addToCart(productId) {
  if (!products || !Array.isArray(products)) return;
  const product = products.find(p => p.id == productId);
  if (!product) return;
  if (product.stock <= 0) {
    Swal.fire({ icon: 'warning', title: 'Sin stock', text: 'Este producto no tiene stock disponible.', timer: 1200, showConfirmButton: false });
    return;
  }
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  renderCartDrawer();
  Swal.fire({ icon: 'success', title: 'Agregado', text: `${product.name} agregado al carrito`, timer: 800, showConfirmButton: false });
}

// Sobrescribir changeCartQty y removeFromCart para drawer
function changeCartQty(productId, delta) {
  const idx = cart.findIndex(item => item.id === productId);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty < 1) cart[idx].qty = 1;
  renderCartDrawer();
}
function removeFromCart(productId) {
  const idx = cart.findIndex(item => item.id === productId);
  if (idx !== -1) {
    cart.splice(idx, 1);
    renderCartDrawer();
  }
}

// Inicializar renderizado del drawer y badge al cargar
if (document.readyState !== 'loading') {
  renderCartDrawer();
} else {
  document.addEventListener('DOMContentLoaded', renderCartDrawer);
}



// Actualizar selector de clientes en el drawer
function updateDrawerClientSelector() {
  const select = document.getElementById('saleClientDrawer');
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar cliente...</option>' +
    clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}
// Actualizar fecha por defecto en el drawer
function updateDrawerDate() {
  const dateInput = document.getElementById('saleDateDrawer');
  if (dateInput) {
    // Usar fecha local de Ecuador
    dateInput.value = getEcuadorDateString();
  }
}
// Inicializar selectores al cargar
if (document.readyState !== 'loading') {
  updateDrawerClientSelector();
  updateDrawerDate();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    updateDrawerClientSelector();
    updateDrawerDate();
  });
}
// Actualizar selectores cada vez que se abre el drawer
const cartDrawerBtn = document.getElementById('floatingCartBtn');
if (cartDrawerBtn) {
  cartDrawerBtn.addEventListener('click', () => {
    updateDrawerClientSelector();
    updateDrawerDate();
  });
}

// --- Comprobante de venta normal igual al de pollos ---
function showReceipt(sale) {
  // Determinar fecha y hora
  let fechaVenta = sale.date ? new Date(sale.date) : new Date();
  let fechaStr = fechaVenta.toLocaleDateString();
  let horaStr = fechaVenta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // Si la venta tiene time, úsalo
  if (sale.time) horaStr = sale.time;

  const receiptHtml = `
    <div class="receipt-treinta">
      <div class="receipt-header">
        <div class="receipt-logo">
          <img src="TillUp.png" alt="TillUp" style="width: 40px; height: 40px; border-radius: 8px;">
          <h3>TillUp POS</h3>
        </div>
        <div class="receipt-info">
          <div class="receipt-title">COMPROBANTE DE VENTA</div>
          <div class="receipt-number">Venta #${sale.id}</div>
          <div class="receipt-date">${fechaStr} ${horaStr}</div>
        </div>
      </div>
      <div class="receipt-client">
        <i class="bi bi-person"></i>
        <strong>Cliente:</strong> ${sale.clientName}
      </div>
      <div class="receipt-items">
        <div class="receipt-items-header">
          <div class="item-name">Producto</div>
          <div class="item-qty">Cant.</div>
          <div class="item-price">Precio</div>
          <div class="item-subtotal">Subtotal</div>
        </div>
        ${sale.items.map(item => `
          <div class="receipt-item">
            <div class="item-name">${item.name}</div>
            <div class="item-qty">${item.qty}</div>
            <div class="item-price">$${item.price.toFixed(2)}</div>
            <div class="item-subtotal">$${(item.price * item.qty).toFixed(2)}</div>
          </div>
        `).join('')}
      </div>
      <div class="receipt-total">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>$${(sale.originalTotal || sale.total).toFixed(2)}</span>
        </div>
        ${(sale.discount || 0) > 0 ? `
          <div class="total-line">
            <span>Descuento:</span>
            <span>-$${sale.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="total-line final">
          <span>TOTAL:</span>
          <span class="total-amount">$${sale.total.toFixed(2)}</span>
        </div>
      </div>
      <div class="payment-type">
        <i class="bi bi-${getPaymentIcon(sale.paymentType)}"></i>
        <strong>Método de pago:</strong> ${getPaymentText(sale.paymentType)}
        ${(sale.paymentType === 'credit' && sale.abono > 0) ? `<br><small>Abono inicial: $${sale.abono.toFixed(2)}</small>` : ''}
      </div>
      <div class="receipt-footer">
        <div class="footer-message">
          <i class="bi bi-heart"></i>
          ¡Gracias por su compra!
        </div>
        <div class="footer-brand">
          <small>TillUp POS - Gestión de Ventas</small>
        </div>
      </div>
    </div>
  `;
  Swal.fire({
    title: 'Venta Completada',
    html: receiptHtml,
    showCancelButton: true,
    confirmButtonText: 'Imprimir',
    cancelButtonText: 'Cerrar',
    showDenyButton: true,
    denyButtonText: 'Descargar PDF',
    width: 500,
    customClass: {
      popup: 'swal2-receipt-treinta',
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-secondary',
      denyButton: 'btn btn-outline-primary'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      printReceipt(sale);
    } else if (result.isDenied) {
      downloadReceiptPDF(sale);
    }
  });
}
window.showReceipt = showReceipt;

// === Finalizar venta del drawer usando la función finalizeSale adaptada ===
async function finalizeSaleDrawer() {
  // Sincronizar datos del drawer con las variables globales
  const clientSelect = document.getElementById('saleClientDrawer');
  if (clientSelect && clientSelect.value) {
    currentClientId = clientSelect.value;
  }
  
  // Llamar a la función finalizeSale que ya está adaptada para el drawer
  await finalizeSale();
}
window.finalizeSaleDrawer = finalizeSaleDrawer;

// Adapta showCreditSaleModal para Temu:
function showCreditSaleModal(total, cost, client, cartOverride, saleDateOverride) {
  Swal.fire({
    title: 'Venta a Crédito',
    html: `
      <div class="mb-2">Cliente: <strong>${client.name}</strong></div>
      <div class="mb-2">Total: <strong>$${total.toFixed(2)}</strong></div>
      <div class="mb-2">Abono inicial:</div>
      <input id="abonoInputTemu" type="number" min="0" max="${total}" class="form-control" placeholder="Abono" />
    `,
    showCancelButton: true,
    confirmButtonText: 'Registrar Venta a Crédito',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const abono = parseFloat(document.getElementById('abonoInputTemu').value) || 0;
      if (abono < 0 || abono > total) {
        Swal.showValidationMessage('El abono debe ser entre 0 y el total');
        return false;
      }
      return abono;
    }
  }).then(async (result) => {
    if (!result.isConfirmed) return;
    const abono = result.value;
    const saldo = total - abono;
    const sale = {
      id: generateId('sale'),
      clientId: client.id,
      clientName: client.name,
      items: (cartOverride || cart).map(item => ({ id: item.id, name: item.name, price: item.price, qty: item.qty })),
      total,
      originalTotal: total,
      discount: 0,
      cost,
      profit: total - cost,
      paymentType: 'credit',
      abono,
      date: (saleDateOverride || new Date().toISOString().slice(0,10)) + 'T' + new Date().toTimeString().slice(0,8),
      time: new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString(),
    };
    if (!sales || !Array.isArray(sales)) sales = [];
    sales.push(sale);
    // Registrar deuda
    const debt = {
      id: 'debt_' + Date.now().toString(36),
      clientId: client.id,
      clientName: client.name,
      amount: saldo,
      abono: abono,
      total: total,
      date: sale.date,
      createdAt: new Date().toISOString(),
      reason: 'Venta a crédito',
      payments: []
    };
    if (!debts || !Array.isArray(debts)) debts = [];
    debts.push(debt);
    client.debt = (client.debt || 0) + saldo;
    await saveToStorage('sales', sales);
    await saveToStorage('debts', debts);
    await saveToStorage('clients', clients);
    cart = [];
    renderCartDrawer();
    toggleCartDrawer();
    updateBalanceUI();
    renderBalanceGrid();
    renderDebts && renderDebts();
    showReceipt(sale);
  });
}

// Elimina la función finalizeSaleDrawer y haz que el botón del drawer llame a finalizeSale
window.finalizeSaleDrawer = function() {
  finalizeSale();
};

// Procesar venta de pollos
async function processChickenSale(sale) {
  try {
    // Agregar a la lista de ventas
    chickenSales.push(sale);
    await saveToStorage('chickenSales', chickenSales);
    
    // Si es venta a crédito, crear deuda
    if (sale.paymentType === 'credit' && sale.debt > 0) {
      const debt = {
        id: Date.now().toString(),
        clientId: sale.clientId,
        clientName: sale.clientName,
        amount: sale.debt,
        originalAmount: sale.debt,
        description: `Venta de pollos - ${sale.quantity} pollo(s), ${sale.weight} lbs`,
        date: sale.date,
        type: 'chicken_sale',
        saleId: sale.id,
        createdAt: new Date().toISOString()
      };
      
      debts.push(debt);
      await saveToStorage('debts', debts);
    }
    
    // Actualizar balance y movimientos
    const movement = {
      id: Date.now().toString(),
      type: 'chicken_sale',
      amount: sale.total,
      description: `Venta de pollos - ${sale.clientName}`,
      date: sale.date,
      timestamp: new Date().toISOString(),
      details: {
        quantity: sale.quantity,
        weight: sale.weight,
        pricePerPound: sale.pricePerPound,
        profit: sale.profit,
        paymentType: sale.paymentType,
        abono: sale.abono
      }
    };
    
    movements.push(movement);
    await saveToStorage('movements', movements);
    
    // Actualizar estadísticas
    updateChickenStats();
    updateChickenSalesList();
    updateBalanceUI();
    renderBalanceGrid();
    renderDebts();
    
    // Limpiar formulario
    document.getElementById('chickenSaleForm').reset();
    // Usar fecha local de Ecuador al limpiar el formulario
    document.getElementById('chickenSaleDate').value = getEcuadorDateString();
    document.getElementById('chickenQuantity').value = '1';
    document.getElementById('chickenAbonoSection').style.display = 'none';
    
    // Mostrar comprobante
    showChickenReceipt(sale);
    
  } catch (error) {
    console.error('Error procesando venta de pollos:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo procesar la venta. Inténtalo de nuevo.',
      confirmButtonText: 'Aceptar'
    });
  }
}

// === FUNCIONES PARA MOVIMIENTOS Y ESTADÍSTICAS AVANZADAS ===

// Función para inicializar la vista de movimientos
function initializeMovementsView() {
  // Evitar inicializaciones múltiples
  if (movementsViewInitialized) return;
  
  console.log('Inicializando vista de movimientos...');
  
  // Configurar event listeners para filtros
  setupMovementFilters();
  
  // Configurar event listeners para gráficas
  setupChartControls();
  
  // Cargar datos por defecto (hoy)
  loadMovementData('today');
  
  // Inicializar gráficas
  initializeCharts();
  
  // Inicializar el botón del ojo para ingresos totales
  initializeRevenueToggle();
  
  // Forzar recálculo de ingresos totales
  setTimeout(() => {
    forceRecalculateRevenue();
  }, 1000);
  
  // Actualizar display del período
  updatePeriodDisplay('today');
  
  // Marcar como inicializada
  movementsViewInitialized = true;
  console.log('Vista de movimientos inicializada correctamente');
}

// Configurar filtros de movimientos
function setupMovementFilters() {
  // Filtros de período
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const period = e.currentTarget.dataset.period;
      setPeriodFilter(period);
    });
  });
}

// Configurar controles de gráficas
function setupChartControls() {
  document.querySelectorAll('.chart-control').forEach(control => {
    control.addEventListener('click', (e) => {
      const chartType = e.currentTarget.dataset.chart;
      showChart(chartType);
    });
  });
}

// Establecer filtro de período
function setPeriodFilter(period) {
  // Actualizar estado activo
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-period="${period}"]`).classList.add('active');
  
  currentMovementFilter = period;
  
  // Mostrar/ocultar selector de fechas personalizadas
  const customDateSelector = document.getElementById('customDateSelector');
  const btnClearFilters = document.getElementById('btnClearFilters');
  
  if (period === 'custom') {
    customDateSelector.style.display = 'block';
    btnClearFilters.style.display = 'block';
  } else {
    customDateSelector.style.display = 'none';
    btnClearFilters.style.display = 'none';
    loadMovementData(period);
    updatePeriodDisplay(period);
  }
}

// Mostrar gráfica específica
function showChart(chartType) {
  // Actualizar controles activos
  document.querySelectorAll('.chart-control').forEach(control => {
    control.classList.remove('active');
  });
  const activeControl = document.querySelector(`[data-chart="${chartType}"]`);
  if (activeControl) activeControl.classList.add('active');
  
  currentChartType = chartType;
  
  // Cambiar tipo de gráfica si es necesario
  if (mainChart) {
    if (chartType === 'distribution') {
      mainChart.config.type = 'doughnut';
      mainChart.options.scales = undefined; // Remover escalas para gráfica de dona
    } else {
      mainChart.config.type = 'line';
      mainChart.options.scales = {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toFixed(2);
            }
          }
        }
      };
    }
  }
  
  updateMainChart();
}

// Configurar selectores de gráficas
function setupChartSelectors() {
  // Los event listeners ya están configurados en setupMovementFilters
}

// Cargar datos de movimientos según el filtro
async function loadMovementData(filterType) {
  console.log('=== DEBUG: loadMovementData ===');
  console.log('Filtro:', filterType);
  
  // Verificar datos almacenados primero
  await checkStoredData();
  
  const { startDate, endDate } = getDateRangeFromFilter(filterType);
  console.log('Rango de fechas:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startDateLocal: startDate.toLocaleDateString(),
    endDateLocal: endDate.toLocaleDateString()
  });
  
  // Debug: mostrar algunas ventas disponibles
  console.log('Muestra de ventas normales:', sales?.slice(0, 3).map(s => ({
    id: s.id,
    date: s.date,
    dateType: typeof s.date,
    normalized: normalizeDate(s.date)?.toISOString()
  })));
  
  console.log('Muestra de ventas de pollos:', chickenSales?.slice(0, 3).map(s => ({
    id: s.id,
    date: s.date,
    dateType: typeof s.date,
    normalized: normalizeDate(s.date)?.toISOString()
  })));
  
  const movements = getAllMovementsInRange(startDate, endDate);
  console.log('Movimientos encontrados:', movements.length);
  
  // Actualizar estadísticas
  updateMovementStats(movements);
  
  // Actualizar gráficas
  updateChartsWithData(movements);
  
  // Actualizar lista de movimientos
  renderAdvancedMovements(movements);
  
  // Actualizar resumen del período
  renderPeriodSummaryAdvanced(movements);
}

// Obtener rango de fechas según el filtro
function getDateRangeFromFilter(filterType) {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();
  
  switch (filterType) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const dayOfWeek = startDate.getDay();
      const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'year':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      // Para filtros personalizados, usar las fechas seleccionadas
      const startInput = document.getElementById('startDate');
      const endInput = document.getElementById('endDate');
      if (startInput.value && endInput.value) {
        startDate.setTime(new Date(startInput.value).getTime());
        endDate.setTime(new Date(endInput.value).getTime());
        endDate.setHours(23, 59, 59, 999);
      }
  }
  
  return { startDate, endDate };
}

// Obtener todos los movimientos en un rango de fechas
function getAllMovementsInRange(startDate, endDate) {
  const movements = [];
  
  console.log('=== DEBUG: getAllMovementsInRange ===');
  console.log('Ventas normales disponibles:', sales?.length || 0);
  console.log('Ventas de pollos disponibles:', chickenSales?.length || 0);
  console.log('Deudas disponibles:', debts?.length || 0);
  
  // Agregar ventas normales
  if (sales && Array.isArray(sales)) {
    let salesAdded = 0;
    sales.forEach(sale => {
      const saleDate = normalizeDate(sale.date);
      
      console.log('Venta normal:', {
        id: sale.id,
        dateOriginal: sale.date,
        dateTipo: typeof sale.date,
        saleDate: saleDate?.toISOString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        total: sale.total,
        inRange: saleDate && saleDate >= startDate && saleDate <= endDate
      });
      
      if (saleDate && saleDate >= startDate && saleDate <= endDate) {
        movements.push({
          type: 'sale',
          icon: 'bi-cart-check',
          title: `Venta #${sale.id}`,
          subtitle: `${sale.clientName || 'Cliente no especificado'} - ${saleDate.toLocaleDateString()}`,
          amount: sale.total,
          amountClass: 'positive',
          date: saleDate,
          data: sale,
          category: 'ventas'
        });
        salesAdded++;
      }
    });
    console.log('Ventas normales agregadas:', salesAdded);
  }
  
  // Agregar ventas de pollos
  if (chickenSales && Array.isArray(chickenSales)) {
    let chickenSalesAdded = 0;
    chickenSales.forEach(sale => {
      const saleDate = normalizeDate(sale.date);
      
      console.log('Venta de pollos:', {
        id: sale.id,
        dateOriginal: sale.date,
        dateTipo: typeof sale.date,
        saleDate: saleDate?.toISOString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        total: sale.total,
        inRange: saleDate && saleDate >= startDate && saleDate <= endDate
      });
      
      if (saleDate && saleDate >= startDate && saleDate <= endDate) {
        movements.push({
          type: 'chicken_sale',
          icon: 'bi-egg-fried',
          title: `Venta Pollos #${sale.id}`,
          subtitle: `${sale.clientName || 'Cliente no especificado'} - ${saleDate.toLocaleDateString()}`,
          amount: sale.total,
          amountClass: 'positive',
          date: saleDate,
          data: sale,
          category: 'pollos'
        });
        chickenSalesAdded++;
      }
    });
    console.log('Ventas de pollos agregadas:', chickenSalesAdded);
  }
  
  // Agregar deudas
  if (debts && Array.isArray(debts)) {
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
          data: debt,
          category: 'deudas'
        });
      }
    });
    
    // Agregar pagos de deudas
    debts.forEach(debt => {
      if (debt.payments && debt.payments.length > 0) {
        debt.payments.forEach(payment => {
          const paymentDate = new Date(payment.date);
          if (paymentDate >= startDate && paymentDate <= endDate) {
            movements.push({
              type: 'payment',
              icon: 'bi-cash-coin',
              title: `Pago Deuda #${debt.id}`,
              subtitle: `${debt.clientName} - ${paymentDate.toLocaleDateString()}`,
              amount: payment.amount,
              amountClass: 'positive',
              date: paymentDate,
              data: { debt, payment },
              category: 'pagos'
            });
          }
        });
      }
    });
  }
  
  // Ordenar por fecha más reciente
  const sortedMovements = movements.sort((a, b) => b.date - a.date);
  console.log('Total de movimientos retornados:', sortedMovements.length);
  console.log('Movimientos finales:', sortedMovements.map(m => ({
    type: m.type,
    amount: m.amount,
    title: m.title
  })));
  return sortedMovements;
}

// Actualizar estadísticas de movimientos
function updateMovementStats(movements) {
  const stats = {
    totalSales: 0,
    totalSalesAmount: 0,
    totalChickenSales: 0,
    totalChickenAmount: 0,
    totalDebts: 0,
    totalDebtsAmount: 0,
    totalPayments: 0,
    totalPaymentsAmount: 0
  };
  
  movements.forEach(movement => {
    switch (movement.type) {
      case 'sale':
        stats.totalSales++;
        stats.totalSalesAmount += movement.amount;
        break;
      case 'chicken_sale':
        stats.totalChickenSales++;
        stats.totalChickenAmount += movement.amount;
        break;
      case 'debt':
        stats.totalDebts++;
        stats.totalDebtsAmount += movement.amount;
        break;
      case 'payment':
        stats.totalPayments++;
        stats.totalPaymentsAmount += movement.amount;
        break;
    }
  });
  
  // Calcular ganancias reales (PVP - Costo) para cada tipo de venta
  let totalSalesProfit = 0;
  let totalChickenProfit = 0;
  
  // Calcular ganancias de ventas normales
  if (sales && Array.isArray(sales)) {
    totalSalesProfit = sales.reduce((sum, sale) => {
      const saleDate = normalizeDate(sale.date);
      if (saleDate && saleDate >= startDate && saleDate <= endDate) {
        return sum + (sale.profit || 0);
      }
      return sum;
    }, 0);
  }
  
  // Calcular ganancias de ventas de pollos
  if (chickenSales && Array.isArray(chickenSales)) {
    totalChickenProfit = chickenSales.reduce((sum, sale) => {
      const saleDate = normalizeDate(sale.date);
      if (saleDate && saleDate >= startDate && saleDate <= endDate) {
        return sum + (sale.profit || 0);
      }
      return sum;
    }, 0);
  }
  
  // Los ingresos totales representan las ganancias netas reales: ganancias de ventas + pagos de deudas
  const totalRevenue = totalSalesProfit + totalChickenProfit + stats.totalPaymentsAmount;
  
  // Debug: mostrar valores calculados
  console.log('=== DEBUG: updateMovementStats ===');
  console.log('Estadísticas calculadas:', {
    ventasNormales: stats.totalSalesAmount,
    ventasPollos: stats.totalChickenAmount,
    pagos: stats.totalPaymentsAmount,
    gananciasVentasNormales: totalSalesProfit,
    gananciasVentasPollos: totalChickenProfit,
    ingresosTotales: totalRevenue
  });
  
  // Debug: mostrar movimientos procesados
  console.log('Movimientos procesados:', movements.map(m => ({
    type: m.type,
    amount: m.amount,
    title: m.title
  })));
  
  // Debug: mostrar datos disponibles
  console.log('Datos disponibles:', {
    ventasNormales: sales?.length || 0,
    ventasPollos: chickenSales?.length || 0,
    deudas: debts?.length || 0
  });
  
  // Actualizar UI con validaciones
  const elements = {
    totalSales: document.getElementById('totalSales'),
    totalSalesAmount: document.getElementById('totalSalesAmount'),
    totalChickenSales: document.getElementById('totalChickenSales'),
    totalChickenAmount: document.getElementById('totalChickenAmount'),
    totalDebts: document.getElementById('totalDebts'),
    totalDebtsAmount: document.getElementById('totalDebtsAmount'),
    totalPayments: document.getElementById('totalPayments'),
    totalPaymentsAmount: document.getElementById('totalPaymentsAmount'),
    totalRevenue: document.getElementById('totalRevenue'),
    chickenTotalRevenue: document.getElementById('chickenTotalRevenue')
  };
  
  if (elements.totalSales) elements.totalSales.textContent = stats.totalSales;
  if (elements.totalSalesAmount) elements.totalSalesAmount.textContent = `$${stats.totalSalesAmount.toFixed(2)}`;
  if (elements.totalChickenSales) elements.totalChickenSales.textContent = stats.totalChickenSales;
  if (elements.totalChickenAmount) elements.totalChickenAmount.textContent = `$${stats.totalChickenAmount.toFixed(2)}`;
  if (elements.totalDebts) elements.totalDebts.textContent = stats.totalDebts;
  if (elements.totalDebtsAmount) elements.totalDebtsAmount.textContent = `$${stats.totalDebtsAmount.toFixed(2)}`;
  if (elements.totalPayments) elements.totalPayments.textContent = stats.totalPayments;
  if (elements.totalPaymentsAmount) elements.totalPaymentsAmount.textContent = `$${stats.totalPaymentsAmount.toFixed(2)}`;
  
  // Actualizar ingresos totales (inicialmente ocultos)
  if (elements.totalRevenue) {
    const revenueValue = `$${Math.max(0, totalRevenue).toFixed(2)}`;
    elements.totalRevenue.setAttribute('data-actual-value', revenueValue);
    
    // Verificar si ya está visible o no
    const isCurrentlyHidden = elements.totalRevenue.classList.contains('hidden-revenue');
    
    if (isCurrentlyHidden) {
      // Si está oculto, mantener oculto
      elements.totalRevenue.classList.add('hidden-revenue');
      elements.totalRevenue.textContent = '***';
      
      // Actualizar icono del ojo
      const eyeIcon = document.getElementById('revenueEyeIcon');
      if (eyeIcon) {
        eyeIcon.classList.remove('bi-eye-slash');
        eyeIcon.classList.add('bi-eye');
      }
    } else {
      // Si está visible, mantener visible
      elements.totalRevenue.classList.remove('hidden-revenue');
      elements.totalRevenue.textContent = revenueValue;
      
      // Actualizar icono del ojo
      const eyeIcon = document.getElementById('revenueEyeIcon');
      if (eyeIcon) {
        eyeIcon.classList.remove('bi-eye');
        eyeIcon.classList.add('bi-eye-slash');
      }
    }
  }
  
  // Actualizar también el elemento de la sección de pollos
  if (elements.chickenTotalRevenue) {
    const revenueValue = `$${Math.max(0, totalRevenue).toFixed(2)}`;
    elements.chickenTotalRevenue.textContent = revenueValue;
  }
}

// Inicializar gráficas
function initializeCharts() {
  // Configuración común para todas las gráficas
  Chart.defaults.font.family = "'Segoe UI', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = '#6c757d';
  
  // Destruir gráfica anterior si existe
  if (mainChart) {
    mainChart.destroy();
    mainChart = null;
  }
  
  // Destruir todas las gráficas existentes en el canvas
  const mainChartCtx = document.getElementById('mainChart');
  if (mainChartCtx) {
    // Obtener todas las gráficas registradas
    const existingCharts = Chart.getChart(mainChartCtx);
    if (existingCharts) {
      existingCharts.destroy();
    }
    
    // Limpiar el canvas
    const ctx = mainChartCtx.getContext('2d');
    ctx.clearRect(0, 0, mainChartCtx.width, mainChartCtx.height);
    
    mainChart = new Chart(mainChartCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Ventas Normales',
          data: [],
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }, {
          label: 'Ventas de Pollos',
          data: [],
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }, {
          label: 'Deudas',
          data: [],
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }, {
          label: 'Pagos',
          data: [],
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            callbacks: {
              label: function(context) {
                const value = context.parsed?.y || context.raw || 0;
                return `${context.dataset.label}: $${value.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + (value || 0).toFixed(2);
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }
}

// Actualizar gráficas con datos
function updateChartsWithData(movements) {
  try {
    const { startDate, endDate } = getDateRangeFromFilter(currentMovementFilter);
    
    // Calcular datos para gráficas
    const chartData = calculateChartData(movements, startDate, endDate);
    
    // Actualizar gráfica principal
    if (mainChart) {
      updateMainChart();
    }
    
    console.log('Datos de gráficas actualizados:', chartData);
  } catch (error) {
    console.error('Error actualizando gráficas con datos:', error);
  }
}

// Calcular datos para gráficas
function calculateChartData(movements, startDate, endDate) {
  const data = {
    totalSales: 0,
    totalChickenSales: 0,
    totalDebts: 0,
    totalPayments: 0
  };
  
  movements.forEach(movement => {
    switch (movement.type) {
      case 'sale':
        data.totalSales += (movement.amount || 0);
        break;
      case 'chicken':
        data.totalChickenSales += (movement.amount || 0);
        break;
      case 'debt':
        data.totalDebts += (movement.amount || 0);
        break;
      case 'payment':
        data.totalPayments += (movement.amount || 0);
        break;
    }
  });
  
  return data;
}

// Obtener datos de tendencias según el tipo de gráfica
function getTrendData(startDate, endDate) {
  const labels = [];
  const salesData = [];
  const chickenData = [];
  
  switch (currentChartType) {
    case 'daily':
      // Datos diarios de la última semana
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }));
        
        const daySales = getSalesForDate(date);
        salesData.push(daySales.normal);
        chickenData.push(daySales.chicken);
      }
      break;
      
    case 'weekly':
      // Datos semanales del último mes
      for (let i = 3; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));
        labels.push(`Semana ${4-i}`);
        
        const weekSales = getSalesForWeek(date);
        salesData.push(weekSales.normal);
        chickenData.push(weekSales.chicken);
      }
      break;
      
    case 'monthly':
      // Datos mensuales del último año
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleDateString('es-ES', { month: 'short' }));
        
        const monthSales = getSalesForMonth(date);
        salesData.push(monthSales.normal);
        chickenData.push(monthSales.chicken);
      }
      break;
      
    case 'yearly':
      // Datos anuales (últimos 5 años)
      for (let i = 4; i >= 0; i--) {
        const year = new Date().getFullYear() - i;
        labels.push(year.toString());
        
        const yearSales = getSalesForYear(year);
        salesData.push(yearSales.normal);
        chickenData.push(yearSales.chicken);
      }
      break;
  }
  
  return { labels, salesData, chickenData };
}

// Funciones auxiliares para obtener datos por período
function getSalesForDate(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const movements = getAllMovementsInRange(startOfDay, endOfDay);
  
  return {
    normal: movements.filter(m => m.type === 'sale').reduce((sum, m) => sum + (m.amount || 0), 0),
    chicken: movements.filter(m => m.type === 'chicken').reduce((sum, m) => sum + (m.amount || 0), 0)
  };
}

function getSalesForWeek(date) {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const movements = getAllMovementsInRange(startOfWeek, endOfWeek);
  
  return {
    normal: movements.filter(m => m.type === 'sale').reduce((sum, m) => sum + (m.amount || 0), 0),
    chicken: movements.filter(m => m.type === 'chicken').reduce((sum, m) => sum + (m.amount || 0), 0)
  };
}

function getSalesForMonth(date) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  
  const movements = getAllMovementsInRange(startOfMonth, endOfMonth);
  
  return {
    normal: movements.filter(m => m.type === 'sale').reduce((sum, m) => sum + (m.amount || 0), 0),
    chicken: movements.filter(m => m.type === 'chicken').reduce((sum, m) => sum + (m.amount || 0), 0)
  };
}

function getSalesForYear(year) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);
  endOfYear.setHours(23, 59, 59, 999);
  
  const movements = getAllMovementsInRange(startOfYear, endOfYear);
  
  return {
    normal: movements.filter(m => m.type === 'sale').reduce((sum, m) => sum + (m.amount || 0), 0),
    chicken: movements.filter(m => m.type === 'chicken').reduce((sum, m) => sum + (m.amount || 0), 0)
  };
}

// Actualizar gráficas
function updateCharts() {
  const { startDate, endDate } = getDateRangeFromFilter(currentMovementFilter);
  const movements = getAllMovementsInRange(startDate, endDate);
  updateChartsWithData(movements);
}

// Renderizar movimientos avanzados
function renderAdvancedMovements(movements) {
  const container = document.getElementById('filteredMovementsList');
  const countElement = document.getElementById('filteredMovementsCount');
  
  if (!container || !countElement) return;
  
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
  
  const movementsHTML = movements.map((movement, index) => `
    <div class="movement-item-treinta ${movement.type}" onclick="showMovementDetailAdvanced(${index}, '${movement.type}')">
      <div class="movement-header-treinta">
        <div class="movement-type-treinta">
          <i class="bi ${movement.icon}"></i>
          <span class="movement-type-badge ${movement.type}">${getMovementTypeText(movement.type)}</span>
        </div>
        <div class="movement-date-treinta">
          ${movement.date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
      <div class="movement-content-treinta">
        <div class="movement-info-treinta">
          <div class="movement-title-treinta">${movement.title}</div>
          <div class="movement-subtitle-treinta">${movement.subtitle}</div>
        </div>
        <div class="movement-amount-treinta ${movement.amountClass}">
          $${movement.amount.toFixed(2)}
        </div>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = movementsHTML;
  
  // Aplicar modo de vista
  if (movementsViewMode === 'grid') {
    container.classList.add('grid-view');
  } else {
    container.classList.remove('grid-view');
  }
}

// Obtener texto del tipo de movimiento
function getMovementTypeText(type) {
  switch (type) {
    case 'sale': return 'Venta';
    case 'chicken': return 'Pollos';
    case 'debt': return 'Deuda';
    case 'payment': return 'Pago';
    default: return 'Movimiento';
  }
}

// Mostrar detalle de movimiento avanzado
function showMovementDetailAdvanced(index, type) {
  const { startDate, endDate } = getDateRangeFromFilter(currentMovementFilter);
  const movements = getAllMovementsInRange(startDate, endDate);
  const movement = movements[index];
  
  if (!movement) return;
  
  switch (type) {
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
      showPaymentDetail(movement.data);
      break;
  }
}

// Renderizar resumen del período avanzado
function renderPeriodSummaryAdvanced(movements) {
  const container = document.getElementById('periodSummary');
  
  if (!container) return;
  
  const summary = calculatePeriodSummary(movements);
  
  container.innerHTML = `
    <div class="row g-3">
      <div class="col-md-3">
        <div class="summary-card-treinta">
          <div class="summary-icon">
            <i class="bi bi-cart-check"></i>
          </div>
          <div class="summary-content">
            <div class="summary-value">${summary.sales}</div>
            <div class="summary-label">Ventas</div>
            <div class="summary-amount">$${summary.totalIncome.toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="summary-card-treinta">
          <div class="summary-icon">
            <i class="bi bi-egg-fried"></i>
          </div>
          <div class="summary-content">
            <div class="summary-value">${movements.filter(m => m.type === 'chicken').length}</div>
            <div class="summary-label">Ventas Pollos</div>
            <div class="summary-amount">$${movements.filter(m => m.type === 'chicken').reduce((sum, m) => sum + m.amount, 0).toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
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
      <div class="col-md-3">
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
    </div>
  `;
}

// Aplicar filtro personalizado
function applyCustomFilter() {
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
  
  loadMovementData('custom');
}

// Aplicar filtro de mes
function applyMonthFilter() {
  const selectedMonth = document.getElementById('selectedMonth').value;
  
  if (!selectedMonth) {
    Swal.fire({
      icon: 'warning',
      title: 'Mes requerido',
      text: 'Por favor selecciona un mes.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  const [year, month] = selectedMonth.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);
  endDate.setHours(23, 59, 59, 999);
  
  // Actualizar inputs de fecha personalizada
  document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
  document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
  
  loadMovementData('custom');
}

// Limpiar filtros
function clearMovementFilters() {
  // Resetear filtros rápidos
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector('[data-period="today"]').classList.add('active');
  currentMovementFilter = 'today';
  
  // Ocultar filtros personalizados
  const customDateSelector = document.getElementById('customDateSelector');
  const btnClearFilters = document.getElementById('btnClearFilters');
  if (customDateSelector) customDateSelector.style.display = 'none';
  if (btnClearFilters) btnClearFilters.style.display = 'none';
  
  // Limpiar inputs
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  if (startDate) startDate.value = '';
  if (endDate) endDate.value = '';
  
  // Cargar datos por defecto
  loadMovementData('today');
  updatePeriodDisplay('today');
}

// Cambiar vista de movimientos
function toggleMovementsView() {
  const container = document.getElementById('filteredMovementsList');
  const textElement = document.getElementById('movementsViewText');
  
  if (movementsViewMode === 'list') {
    movementsViewMode = 'grid';
    textElement.textContent = 'Lista';
    container.classList.add('grid-view');
  } else {
    movementsViewMode = 'list';
    textElement.textContent = 'Cuadrícula';
    container.classList.remove('grid-view');
  }
}

// Función para actualizar la vista de movimientos cuando se muestra
function updateMovementsView() {
  const movementsView = document.getElementById('view-movements');
  if (movementsView && !movementsView.classList.contains('d-none')) {
    // Solo inicializar si no se ha hecho antes
    if (!movementsViewInitialized) {
      initializeMovementsView();
    } else {
      // Si ya está inicializada, solo actualizar datos
      loadMovementData(currentMovementFilter);
    }
  }
}

// Función para limpiar recursos de movimientos
function cleanupMovementsView() {
  // Destruir gráfica principal
  if (mainChart) {
    mainChart.destroy();
    mainChart = null;
  }
  
  // Destruir cualquier gráfica que pueda estar en el canvas
  const mainChartCtx = document.getElementById('mainChart');
  if (mainChartCtx) {
    const existingCharts = Chart.getChart(mainChartCtx);
    if (existingCharts) {
      existingCharts.destroy();
    }
    
    // Limpiar el canvas
    const ctx = mainChartCtx.getContext('2d');
    ctx.clearRect(0, 0, mainChartCtx.width, mainChartCtx.height);
  }
  
  // Resetear bandera
  movementsViewInitialized = false;
}

// Función para mostrar/ocultar ingresos totales (ganancias)
function toggleRevenueVisibility() {
  const revenueElement = document.getElementById('totalRevenue');
  const eyeIcon = document.getElementById('revenueEyeIcon');
  
  if (revenueElement && eyeIcon) {
    const isHidden = revenueElement.classList.contains('hidden-revenue');
    
    if (isHidden) {
      // Mostrar ganancias
      revenueElement.classList.remove('hidden-revenue');
      eyeIcon.classList.remove('bi-eye');
      eyeIcon.classList.add('bi-eye-slash');
      revenueElement.textContent = revenueElement.getAttribute('data-actual-value') || '$0.00';
    } else {
      // Ocultar ganancias
      revenueElement.classList.add('hidden-revenue');
      eyeIcon.classList.remove('bi-eye-slash');
      eyeIcon.classList.add('bi-eye');
      revenueElement.textContent = '***';
    }
  }
}

// Función para inicializar el estado del botón del ojo
function initializeRevenueToggle() {
  const revenueElement = document.getElementById('totalRevenue');
  const eyeIcon = document.getElementById('revenueEyeIcon');
  
  if (revenueElement && eyeIcon) {
    // Por defecto, ocultar los ingresos totales
    revenueElement.classList.add('hidden-revenue');
    revenueElement.textContent = '***';
    eyeIcon.classList.remove('bi-eye-slash');
    eyeIcon.classList.add('bi-eye');
  }
}

// Función para verificar datos almacenados
async function checkStoredData() {
  console.log('=== VERIFICANDO DATOS ALMACENADOS ===');
  
  try {
    const sales = await loadFromStorage('sales') || [];
    chickenSales = await loadFromStorage('chickenSales') || [];
    const movements = await loadFromStorage('movements') || [];
    
    console.log('Ventas normales almacenadas:', sales.length);
    console.log('Ventas de pollos almacenadas:', chickenSales.length);
    console.log('Movimientos almacenados:', movements.length);
    
    if (sales.length > 0) {
      console.log('Muestra de ventas normales:', sales.slice(0, 3).map(s => ({
        id: s.id,
        date: s.date,
        total: s.total
      })));
    }
    
    if (chickenSales.length > 0) {
      console.log('Muestra de ventas de pollos:', chickenSales.slice(0, 3).map(s => ({
        id: s.id,
        date: s.date,
        total: s.total
      })));
    }
    
    if (movements.length > 0) {
      console.log('Muestra de movimientos:', movements.slice(0, 3).map(m => ({
        type: m.type,
        amount: m.amount,
        title: m.title
      })));
    }
    
    return { sales, chickenSales, movements };
  } catch (error) {
    console.error('Error verificando datos:', error);
    return { sales: [], chickenSales: [], movements: [] };
  }
}

// Función de emergencia para recalcular ingresos totales
function forceRecalculateRevenue() {
  console.log('=== FORZANDO RECÁLCULO DE INGRESOS ===');
  
  // Calcular ganancias reales (PVP - Costo) desde las ventas
  let totalSalesProfit = 0;
  let totalChickenProfit = 0;
  let totalSalesAmount = 0;
  let totalChickenAmount = 0;
  
  if (sales && Array.isArray(sales)) {
    totalSalesAmount = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    totalSalesProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    console.log('Total ventas normales:', totalSalesAmount);
    console.log('Ganancias ventas normales:', totalSalesProfit);
  }
  
  if (chickenSales && Array.isArray(chickenSales)) {
    totalChickenAmount = chickenSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    totalChickenProfit = chickenSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    console.log('Total ventas de pollos:', totalChickenAmount);
    console.log('Ganancias ventas de pollos:', totalChickenProfit);
  }
  
  const totalRevenue = totalSalesProfit + totalChickenProfit;
  console.log('Ingresos totales (ganancias reales):', totalRevenue);
  
  // Actualizar el elemento en el DOM
  const revenueElement = document.getElementById('totalRevenue');
  const chickenRevenueElement = document.getElementById('chickenTotalRevenue');
  
  if (revenueElement) {
    const revenueValue = `$${Math.max(0, totalRevenue).toFixed(2)}`;
    revenueElement.setAttribute('data-actual-value', revenueValue);
    
    // Si está oculto, mantener oculto pero actualizar el valor
    if (revenueElement.classList.contains('hidden-revenue')) {
      revenueElement.textContent = '***';
    } else {
      revenueElement.textContent = revenueValue;
    }
    
    console.log('Elemento de ingresos (movimientos) actualizado con valor:', revenueValue);
  } else {
    console.warn('Elemento totalRevenue no encontrado en el DOM');
  }
  
  if (chickenRevenueElement) {
    const revenueValue = `$${Math.max(0, totalRevenue).toFixed(2)}`;
    chickenRevenueElement.textContent = revenueValue;
    console.log('Elemento de ingresos (pollos) actualizado con valor:', revenueValue);
  } else {
    console.warn('Elemento chickenTotalRevenue no encontrado en el DOM');
  }
  
  return totalRevenue;
}

// Función para verificar elementos del DOM
function checkRevenueElements() {
  console.log('=== VERIFICANDO ELEMENTOS DE INGRESOS ===');
  
  const revenueElement = document.getElementById('totalRevenue');
  const chickenRevenueElement = document.getElementById('chickenTotalRevenue');
  
  console.log('Elemento totalRevenue encontrado:', !!revenueElement);
  console.log('Elemento chickenTotalRevenue encontrado:', !!chickenRevenueElement);
  
  if (revenueElement) {
    console.log('totalRevenue - Texto actual:', revenueElement.textContent);
    console.log('totalRevenue - Valor data-actual-value:', revenueElement.getAttribute('data-actual-value'));
    console.log('totalRevenue - Clase hidden-revenue:', revenueElement.classList.contains('hidden-revenue'));
  }
  
  if (chickenRevenueElement) {
    console.log('chickenTotalRevenue - Texto actual:', chickenRevenueElement.textContent);
  }
  
  return { revenueElement, chickenRevenueElement };
}

// Función para verificar cálculos de ganancias
function checkProfitCalculations() {
  console.log('=== VERIFICANDO CÁLCULOS DE GANANCIAS ===');
  
  if (sales && Array.isArray(sales)) {
    console.log('Ventas normales disponibles:', sales.length);
    if (sales.length > 0) {
      const sampleSale = sales[0];
      console.log('Muestra de venta normal:', {
        id: sampleSale.id,
        total: sampleSale.total,
        cost: sampleSale.cost,
        profit: sampleSale.profit,
        profitCalculated: sampleSale.total - sampleSale.cost
      });
    }
  }
  
  if (chickenSales && Array.isArray(chickenSales)) {
    console.log('Ventas de pollos disponibles:', chickenSales.length);
    if (chickenSales.length > 0) {
      const sampleChickenSale = chickenSales[0];
      console.log('Muestra de venta de pollos:', {
        id: sampleChickenSale.id,
        total: sampleChickenSale.total,
        cost: sampleChickenSale.cost,
        profit: sampleChickenSale.profit,
        weight: sampleChickenSale.weight,
        pricePerPound: sampleChickenSale.pricePerPound,
        costPerPound: sampleChickenSale.costPerPound
      });
    }
  }
  
  // Calcular ganancias totales
  let totalSalesProfit = 0;
  let totalChickenProfit = 0;
  
  if (sales && Array.isArray(sales)) {
    totalSalesProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
  }
  
  if (chickenSales && Array.isArray(chickenSales)) {
    totalChickenProfit = chickenSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
  }
  
  console.log('Ganancias totales calculadas:', {
    ventasNormales: totalSalesProfit,
    ventasPollos: totalChickenProfit,
    total: totalSalesProfit + totalChickenProfit
  });
  
  return { totalSalesProfit, totalChickenProfit };
}

// Hacer disponibles las funciones de movimientos avanzados globalmente
window.currentMovementFilter = currentMovementFilter;
window.getAllMovementsInRange = getAllMovementsInRange;
window.getDateRangeFromFilter = getDateRangeFromFilter;
window.calculatePeriodSummary = calculatePeriodSummary;
window.toggleRevenueVisibility = toggleRevenueVisibility;
window.initializeRevenueToggle = initializeRevenueToggle;
window.checkStoredData = checkStoredData;
window.forceRecalculateRevenue = forceRecalculateRevenue;
window.checkRevenueElements = checkRevenueElements;
window.checkProfitCalculations = checkProfitCalculations;

// Función para configurar detección de cambios en los datos
function setupDataChangeDetection() {
  console.log('🔍 Configurando detección de cambios en datos...');
  
  // Función para marcar que hay cambios
  function markDataChanged() {
    localStorage.setItem('lastLocalBackup', Date.now().toString());
    console.debug('📝 Cambios detectados en datos, actualizando timestamp local');
  }
  
  // Interceptar funciones de guardado para detectar cambios
  const originalSaveToStorage = window.saveToStorage;
  if (originalSaveToStorage) {
    window.saveToStorage = async function(key, data) {
      const result = await originalSaveToStorage(key, data);
      markDataChanged();
      return result;
    };
  }
  
  // Interceptar funciones específicas de la app
  const originalAddProduct = window.addProduct;
  if (originalAddProduct) {
    window.addProduct = async function(e) {
      const result = await originalAddProduct(e);
      markDataChanged();
      return result;
    };
  }
  
  const originalAddClient = window.addClient;
  if (originalAddClient) {
    window.addClient = async function(e) {
      const result = await originalAddClient(e);
      markDataChanged();
      return result;
    };
  }
  
  const originalFinalizeSale = window.finalizeSale;
  if (originalFinalizeSale) {
    window.finalizeSale = async function() {
      const result = await originalFinalizeSale();
      markDataChanged();
      return result;
    };
  }
  
  const originalFinalizeChickenSale = window.finalizeChickenSale;
  if (originalFinalizeChickenSale) {
    window.finalizeChickenSale = async function() {
      const result = await originalFinalizeChickenSale();
      markDataChanged();
      return result;
    };
  }
  
  console.log('✅ Detección de cambios configurada');
}

// Event listener para inicializar la vista de movimientos cuando se muestra
document.addEventListener('DOMContentLoaded', () => {
  // Observer para detectar cambios en la visibilidad de la vista de movimientos
  const movementsView = document.getElementById('view-movements');
  if (movementsView) {
    let isInitializing = false; // Evitar múltiples inicializaciones simultáneas
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (!movementsView.classList.contains('d-none') && !isInitializing && !movementsViewInitialized) {
            // La vista de movimientos se ha mostrado
            isInitializing = true;
            console.log('Observer detectó que se mostró la vista de movimientos');
            setTimeout(() => {
              updateMovementsView();
              isInitializing = false;
            }, 300);
          }
        }
      });
    });
    
    observer.observe(movementsView, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
});