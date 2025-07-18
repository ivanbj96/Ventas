// === Arrays globales ===
let products = [];
let clients = [];
let sales = [];
let debts = [];
let cart = [];
let currentClientId = null;
let inventoryViewMode = localStorage.getItem('inventoryViewMode') || 'grid'; // 'grid' o 'list'
let clientsViewMode = localStorage.getItem('clientsViewMode') || 'grid'; // 'grid' o 'list'
// Variables globales para pollos
let chickenSales = [];
let pricePerPound = 0;
let costPerPound = 0;

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
  const threshold = 150; // Aumentado el umbral para hacer más difícil activar el refresh
  let isPulling = false;
  let isScrolled = false;

  container.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isScrolled = container.scrollTop > 0;
    isPulling = !isScrolled; // Solo permitir pull si estamos en la parte superior
  });

  container.addEventListener('touchmove', (e) => {
    if (!isPulling || isScrolled) return;
    
    currentY = e.touches[0].clientY;
    pullDistance = currentY - startY;
    
    if (pullDistance > 0 && container.scrollTop === 0) {
      if (pullDistance < threshold) {
        e.preventDefault();
        container.style.transform = `translateY(${Math.min(pullDistance * 0.3, threshold)}px)`;
      }
    }
  });

  container.addEventListener('touchend', () => {
    if (isPulling && pullDistance > threshold && !isScrolled) {
      onRefresh();
      hapticFeedback('success');
    }
    
    container.style.transform = '';
    container.style.transition = 'transform 0.3s ease-out';
    setTimeout(() => {
      container.style.transition = '';
    }, 300);
    
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
      updateBalance();
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
  // Los datos de pollos ya se cargaron en loadData()
  // Solo actualizar los campos de precio y costo
  const priceInput = document.getElementById('pricePerPound');
  if (priceInput) priceInput.value = pricePerPound.toFixed(2);
  const costInput = document.getElementById('costPerPound');
  if (costInput) costInput.value = costPerPound.toFixed(2);
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
    localStorage.setItem('pricePerPound', pricePerPound.toString());
    localStorage.setItem('costPerPound', costPerPound.toString());
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
async function handleChickenSale(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
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
  
  // Crear objeto de venta
  const sale = {
    id: Date.now().toString(),
    clientId: clientId,
    clientName: client.name,
    quantity: quantity,
    weight: weight,
    pricePerPound: pricePerPound,
    total: total,
    date: saleDate,
    time: new Date().toLocaleTimeString(),
    paymentType: paymentType,
    abono: abono,
    profit: total * 0.20, // 20% de ganancia estimada
    createdAt: new Date().toISOString()
  };
  
  try {
    // Agregar a la lista de ventas
    chickenSales.push(sale);
    await saveToStorage('chickenSales', chickenSales);
    
    // Actualizar estadísticas
    updateChickenStats();
    updateChickenSalesList();
    
    // Limpiar formulario
    form.reset();
    document.getElementById('chickenSaleDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('chickenQuantity').value = '1';
    document.getElementById('chickenAbonoSection').style.display = 'none';
    
    // Mostrar comprobante
    showChickenReceipt(sale);
    
    // Notificación de éxito (eliminada para no tapar el comprobante)
    // Swal.fire({
    //   icon: 'success',
    //   title: 'Venta registrada',
    //   text: `Venta de ${quantity} pollo(s) registrada exitosamente.`,
    //   timer: 2000,
    //   showConfirmButton: false
    // });
    
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
            <div>Precio/Lb</div>
            <div>Subtotal</div>
          </div>
          
          <div class="receipt-item">
            <div>Pollo(s) - ${sale.weight} lbs</div>
            <div>${sale.quantity}</div>
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
    const today = new Date();
    todayStr = today.toISOString().split('T')[0];
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
  
  // Calcular ganancias (asumiendo un margen del 20% por defecto)
  const profitMargin = 0.20; // 20%
  const totalProfit = totalRevenue * profitMargin;
  const profitPerChicken = totalChickens > 0 ? totalProfit / totalChickens : 0;
  const profitPercentage = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  
  // Actualizar elementos en el DOM
  const totalChickensElement = document.getElementById('totalChickensSold');
  const totalWeightElement = document.getElementById('totalWeightSold');
  const totalRevenueElement = document.getElementById('totalRevenue');
  const avgWeightElement = document.getElementById('avgWeight');
  const totalProfitElement = document.getElementById('totalProfit');
  const profitMarginElement = document.getElementById('profitMargin');
  const profitPerChickenElement = document.getElementById('profitPerChicken');
  
  if (totalChickensElement) totalChickensElement.textContent = totalChickens;
  if (totalWeightElement) totalWeightElement.textContent = totalWeight.toFixed(1);
  if (totalRevenueElement) totalRevenueElement.textContent = `$${totalRevenue.toFixed(2)}`;
  if (avgWeightElement) avgWeightElement.textContent = avgWeight.toFixed(1);
  if (totalProfitElement) totalProfitElement.textContent = `$${totalProfit.toFixed(2)}`;
  if (profitMarginElement) profitMarginElement.textContent = `${profitPercentage.toFixed(1)}%`;
  if (profitPerChickenElement) profitPerChickenElement.textContent = `$${profitPerChicken.toFixed(2)}`;
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

// Función para mostrar/ocultar estadísticas de ganancias
function toggleProfitStats() {
  const profitSection = document.getElementById('profitStatsSection');
  const toggleBtn = document.getElementById('toggleProfitStats');
  const icon = document.getElementById('profitStatsIcon');
  const text = document.getElementById('profitStatsText');
  
  if (profitSection.style.display === 'none') {
    profitSection.style.display = 'block';
    icon.className = 'bi bi-eye-slash';
    text.textContent = 'Ocultar Ganancias';
  } else {
    profitSection.style.display = 'none';
    icon.className = 'bi bi-eye';
    text.textContent = 'Mostrar Ganancias';
  }
}

// Actualizar cálculo automático de pollos
function updateChickenCalculation() {
  const weight = parseFloat(document.getElementById('chickenWeight')?.value) || 0;
  const pricePerPound = parseFloat(document.getElementById('pricePerPound')?.value) || 0;
  
  const total = weight * pricePerPound;
  
  // Actualizar display
  const displayPrice = document.getElementById('displayPricePerPound');
  const displayTotal = document.getElementById('displayTotalAmount');
  
  if (displayPrice) displayPrice.textContent = `$${pricePerPound.toFixed(2)}`;
  if (displayTotal) displayTotal.textContent = `$${total.toFixed(2)}`;
}

// Configurar eventos del formulario de pollos
function setupChickenEventListeners() {
  // Eventos para cálculo automático
  const weightInput = document.getElementById('chickenWeight');
  const priceInput = document.getElementById('pricePerPound');
  
  if (weightInput) {
    weightInput.addEventListener('input', updateChickenCalculation);
  }
  if (priceInput) {
    priceInput.addEventListener('input', updateChickenCalculation);
  }
  
  // Evento para método de pago
  const paymentRadios = document.querySelectorAll('input[name="chickenPayment"]');
  const abonoSection = document.getElementById('chickenAbonoSection');
  
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (abonoSection) {
        abonoSection.style.display = this.value === 'credit' ? 'block' : 'none';
      }
    });
  });
  
  // Establecer fecha por defecto (hoy)
  const dateInput = document.getElementById('chickenSaleDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
  
  // Inicializar cálculo
  updateChickenCalculation();
}

// Actualizar selector de clientes para pollos
function updateChickenClientSelector() {
  const selector = document.getElementById('chickenClient');
  if (!selector) return;
  
  selector.innerHTML = '<option value="">Seleccionar cliente...</option>';
  
  // Verificar que clients sea un array válido
  if (!clients || !Array.isArray(clients)) return;
  
  clients.forEach(client => {
    if (client && client.id && client.name) {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      selector.appendChild(option);
    }
  });
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
    // Por defecto, mostrar solo ventas de hoy
    const today = new Date().toISOString().split('T')[0];
    filteredSales = chickenSales.filter(sale => 
      sale && sale.date && sale.date.startsWith(today)
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
  
  container.innerHTML = filteredSales.map(sale => `
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
function setTheme(mode) {
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
  localStorage.setItem('theme', 'light');
  // No mostrar ningún mensaje ni alerta
}

// === Funciones de instalación PWA ===
function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
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
function hasUserRejectedInstallation() {
  return localStorage.getItem('pwa-installation-rejected') === 'true';
}

// === Función helper para marcar que el usuario rechazó la instalación ===
function markInstallationRejected() {
  localStorage.setItem('pwa-installation-rejected', 'true');
}

// === Mostrar/ocultar botón de instalación PWA de forma centralizada ===
function updateInstallButtonVisibility() {
  if (!installButton) installButton = document.getElementById('installPWA');
  if (!installButton) return;
  if (isAppInstalled() || hasUserRejectedInstallation() || !deferredPrompt) {
    installButton.style.display = 'none';
  } else {
    installButton.style.display = 'flex';
    installButton.classList.add('animate');
  }
}

// === Evento beforeinstallprompt (centralizado) ===
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  window.deferredPrompt = e;
  updateInstallButtonVisibility();
});

// === Evento appinstalled ===
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  window.deferredPrompt = null;
  updateInstallButtonVisibility();
  Swal.fire({
    icon: 'success',
    title: '¡Instalación completada!',
    text: 'TillUp POS está ahora instalado en tu dispositivo.',
    timer: 3000,
    showConfirmButton: false
  });
});

// === Inicialización del botón de instalación PWA ===
document.addEventListener('DOMContentLoaded', () => {
  installButton = document.getElementById('installPWA');
  updateInstallButtonVisibility();
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
function renderInventory() {
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
    return;
  }

  clearCartBtn.style.display = 'block';

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
    showClientSelectorForSale();
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
      
      if (!sales || !Array.isArray(sales)) {
        sales = [];
      }
      sales.push(sale);
      try {
        await saveToStorage('sales', sales);
        await saveToStorage('products', products);
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
function renderClients() {
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
  if (!list) return;
  
  list.innerHTML = '';

  // Verificar que debts sea un array válido
  if (!debts || !Array.isArray(debts) || debts.length === 0) {
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
// let deferredPrompt; // ELIMINADA: ya existe declaración global

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
      if (debt && debt.payments && Array.isArray(debt.payments) && debt.payments.length > 0) {
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
  
  // Configurar backup automático
  setupAutoBackup();
  
  // Actualizar fecha y hora
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  // Detectar modo oscuro
  detectDarkMode();
  
  // Inicializar mejoras para experiencia nativa
  initializeNativeEnhancements();
  
  // Inicializar funciones de pollos
  updateChickenStats();
  updateChickenClientSelector();
  updateChickenSalesList();
  setupChickenEventListeners();
  
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
});

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
window.toggleProfitStats = toggleProfitStats;
window.updateChickenCalculation = updateChickenCalculation;
window.filtrarPorFecha = filtrarPorFecha;
window.updateChickenClientSelector = updateChickenClientSelector;
window.updateChickenStats = updateChickenStats;
window.updateChickenSalesList = updateChickenSalesList;
window.setupChickenEventListeners = setupChickenEventListeners;
window.initializeChickenData = initializeChickenData;
window.handleChickenSale = handleChickenSale;

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
function renderSalesProducts() {
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

// Finalizar venta desde el drawer Temu
async function finalizeSaleDrawer() {
  if (!cart || cart.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Carrito vacío',
      text: 'Agrega productos al carrito para continuar.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  const clientSelect = document.getElementById('saleClientDrawer');
  const dateInput = document.getElementById('saleDateDrawer');
  const clientId = clientSelect ? clientSelect.value : '';
  const client = clients.find(c => c.id === clientId);
  const saleDate = dateInput && dateInput.value ? new Date(dateInput.value) : new Date();
  if (!client) {
    Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Selecciona un cliente para la venta.', timer: 1200, showConfirmButton: false });
    return;
  }
  // Calcular totales
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cost = cart.reduce((sum, item) => sum + (item.cost * item.qty), 0);
  const profit = total - cost;
  // Crear objeto de venta
  const sale = {
    id: Date.now().toString(36),
    clientId: client.id,
    clientName: client.name,
    items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, qty: item.qty })),
    total,
    cost,
    profit,
    paymentType: 'cash', // Por ahora solo contado
    date: saleDate.toISOString(),
    createdAt: new Date().toISOString(),
  };
  sales.push(sale);
  await saveToStorage('sales', sales);
  cart = [];
  renderCartDrawer();
  toggleCartDrawer();
  Swal.fire({ icon: 'success', title: 'Venta realizada', text: 'La venta se ha registrado correctamente.', timer: 1200, showConfirmButton: false });
  // Mostrar comprobante
  showReceipt(sale);
  renderSalesProducts();
  updateBalanceUI && updateBalanceUI();
}
window.finalizeSaleDrawer = finalizeSaleDrawer;

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
    const today = new Date();
    dateInput.value = today.toISOString().slice(0,10);
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

// --- Corregir fecha y abono en finalizeSaleDrawer y finalizeSale ---
async function finalizeSaleDrawer() {
  if (!cart || cart.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Carrito vacío', text: 'Agrega productos al carrito para continuar.', timer: 1200, showConfirmButton: false });
    return;
  }
  const clientSelect = document.getElementById('saleClientDrawer');
  const dateInput = document.getElementById('saleDateDrawer');
  const clientId = clientSelect ? clientSelect.value : '';
  const client = clients.find(c => c.id === clientId);
  const saleDate = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().slice(0,10);
  if (!client) {
    Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Selecciona un cliente para la venta.', timer: 1200, showConfirmButton: false });
    return;
  }
  // Mostrar opciones de pago y abono
  await Swal.fire({
    title: 'Método de pago',
    html: `
      <div class=\"mb-2\">
        <div class=\"form-check\">
          <input class=\"form-check-input\" type=\"radio\" name=\"drawerPaymentType\" id=\"drawerPaymentCash\" value=\"cash\" checked>
          <label class=\"form-check-label\" for=\"drawerPaymentCash\"><i class=\"bi bi-cash-coin\"></i> Contado</label>
        </div>
        <div class=\"form-check\">
          <input class=\"form-check-input\" type=\"radio\" name=\"drawerPaymentType\" id=\"drawerPaymentCredit\" value=\"credit\">
          <label class=\"form-check-label\" for=\"drawerPaymentCredit\"><i class=\"bi bi-clock-history\"></i> Crédito</label>
        </div>
      </div>
      <div id=\"drawerAbonoSection\" style=\"display:none;\">
        <label for=\"drawerAbono\" class=\"form-label\"><i class=\"bi bi-cash\"></i> Abono inicial</label>
        <div class=\"input-group\">
          <span class=\"input-group-text\">$</span>
          <input type=\"number\" id=\"drawerAbono\" class=\"form-control\" min=\"0\" step=\"0.01\" placeholder=\"0.00\" />
        </div>
      </div>
      <script>
        document.getElementById('drawerPaymentCredit').addEventListener('change', function() {
          document.getElementById('drawerAbonoSection').style.display = 'block';
        });
        document.getElementById('drawerPaymentCash').addEventListener('change', function() {
          document.getElementById('drawerAbonoSection').style.display = 'none';
        });
      <\/script>
    `,
    focusConfirm: false,
    preConfirm: () => {
      const paymentType = document.querySelector('input[name=\"drawerPaymentType\"]:checked').value;
      let abono = 0;
      if (paymentType === 'credit') {
        abono = parseFloat(document.getElementById('drawerAbono').value) || 0;
      }
      return { paymentType, abono };
    }
  }).then(async (result) => {
    if (!result.isConfirmed) return;
    const paymentData = result.value;
    // Calcular totales
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const cost = cart.reduce((sum, item) => sum + (item.cost * item.qty), 0);
    const profit = total - cost;
    // Crear objeto de venta
    const sale = {
      id: Date.now().toString(36),
      clientId: client.id,
      clientName: client.name,
      items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, qty: item.qty })),
      total,
      cost,
      profit,
      paymentType: paymentData.paymentType,
      abono: paymentData.abono,
      date: saleDate + 'T' + new Date().toTimeString().slice(0,8),
      createdAt: new Date().toISOString(),
    };
    sales.push(sale);
    await saveToStorage('sales', sales);
    // --- Lógica de venta a crédito ---
    if (paymentData.paymentType === 'credit') {
      // Crear deuda
      const saldo = total - (paymentData.abono || 0);
      const debt = {
        id: 'debt_' + Date.now().toString(36),
        clientId: client.id,
        clientName: client.name,
        amount: saldo,
        abono: paymentData.abono || 0,
        total: total,
        date: saleDate + 'T' + new Date().toTimeString().slice(0,8),
        createdAt: new Date().toISOString(),
        reason: 'Venta a crédito',
        payments: []
      };
      if (!debts || !Array.isArray(debts)) debts = [];
      debts.push(debt);
      await saveToStorage('debts', debts);
      // Actualizar deuda del cliente
      client.debt = (client.debt || 0) + saldo;
      await saveToStorage('clients', clients);
      renderDebts && renderDebts();
    }
    cart = [];
    renderCartDrawer();
    toggleCartDrawer();
    Swal.fire({ icon: 'success', title: 'Venta realizada', text: 'La venta se ha registrado correctamente.', timer: 1200, showConfirmButton: false });
    showReceipt(sale);
    renderSalesProducts();
    renderBalanceGrid && renderBalanceGrid();
    updateBalanceUI && updateBalanceUI();
  });
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
// ... código existente ...
