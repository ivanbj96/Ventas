// ========================================
// ⚡ ACCIONES RÁPIDAS Y MENÚS
// ========================================

import { hapticFeedback } from './mobile.js';

// === CONFIGURACIÓN DE ACCIONES RÁPIDAS ===
export function setupQuickActions() {
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('quickActionsMenu');
    const btn = document.getElementById('floatingActionBtn');
    
    if (menu && !menu.contains(e.target) && !btn.contains(e.target)) {
      hideQuickActions();
    }
  });
}

// === MOSTRAR MENÚ DE ACCIONES RÁPIDAS ===
export function showQuickActions() {
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

// === OCULTAR MENÚ DE ACCIONES RÁPIDAS ===
function hideQuickActions() {
  const menu = document.getElementById('quickActionsMenu');
  const btn = document.getElementById('floatingActionBtn');
  
  menu.style.display = 'none';
  btn.innerHTML = '<i class="bi bi-plus-lg"></i>';
  btn.style.transform = 'rotate(0deg)';
}

// === MANEJAR ACCIONES RÁPIDAS ===
export function quickAction(action) {
  const btn = document.getElementById('quickActionsBtn');
  if (btn) {
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 150);
  }
  
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
  
  switch(action) {
    case 'newSale':
      handleNewSale();
      break;
      
    case 'newChickenSale':
      handleNewChickenSale();
      break;
      
    case 'addProduct':
      handleAddProduct();
      break;
      
    case 'addClient':
      handleAddClient();
      break;
      
    case 'viewBalance':
      handleViewBalance();
      break;
      
    case 'viewDebts':
      handleViewDebts();
      break;
      
    case 'exportData':
      handleExportData();
      break;
      
    case 'clearCache':
      handleClearCache();
      break;
      
    case 'filterByDate':
      handleFilterByDate();
      break;
  }
  
  closeDropdown();
}

// === HANDLERS DE ACCIONES ===
function handleNewSale() {
  showView('sales');
  clearCart();
  setTimeout(() => {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) searchInput.focus();
  }, 100);
}

function handleNewChickenSale() {
  showView('chickens');
  const chickenForm = document.getElementById('chickenSaleForm');
  if (chickenForm) chickenForm.reset();
  setTimeout(() => {
    const firstInput = document.querySelector('#chickenSaleForm input');
    if (firstInput) firstInput.focus();
  }, 100);
}

function handleAddProduct() {
  const modalProduct = new bootstrap.Modal(document.getElementById('modalProduct'));
  modalProduct.show();
  const productForm = document.getElementById('formProduct');
  if (productForm) productForm.reset();
  setTimeout(() => {
    const nameInput = document.getElementById('productName');
    if (nameInput) nameInput.focus();
  }, 100);
}

function handleAddClient() {
  const modalClient = new bootstrap.Modal(document.getElementById('modalClient'));
  modalClient.show();
  const clientForm = document.getElementById('formClient');
  if (clientForm) clientForm.reset();
  setTimeout(() => {
    const nameInput = document.getElementById('clientName');
    if (nameInput) nameInput.focus();
  }, 100);
}

function handleViewBalance() {
  showView('balance');
  updateBalanceUI();
}

function handleViewDebts() {
  showView('debt');
  loadDebts();
}

function handleExportData() {
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
}

function handleClearCache() {
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
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      
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
}

function handleFilterByDate() {
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
}

// === UTILIDADES ===
function closeDropdown() {
  const dropdown = document.querySelector('.dropdown-menu.show');
  if (dropdown) {
    const dropdownToggle = document.querySelector('[data-bs-toggle="dropdown"]');
    if (dropdownToggle) {
      const bsDropdown = bootstrap.Dropdown.getInstance(dropdownToggle);
      if (bsDropdown) bsDropdown.hide();
    }
  }
}

// Funciones que se llaman desde el scope global
function showView(view) {
  if (window.showView) window.showView(view);
}

function clearCart() {
  if (window.clearCart) window.clearCart();
}

function updateBalanceUI() {
  if (window.renderBalanceGrid) window.renderBalanceGrid();
}

function loadDebts() {
  if (window.renderDebts) window.renderDebts();
}

function generatePDF(type) {
  if (window.generatePDF) window.generatePDF(type);
}

function filtrarPorFecha(date) {
  console.log('Filtrar por fecha:', date);
  // Implementar filtro por fecha específica
}