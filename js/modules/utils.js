// ========================================
// 🔧 UTILIDADES Y HELPERS
// ========================================

// === NORMALIZACIÓN DE FECHAS ===
export function normalizeDate(dateInput) {
  if (!dateInput) return null;
  
  if (typeof dateInput === 'string') {
    if (dateInput.includes('T')) {
      return new Date(dateInput);
    } else {
      return new Date(dateInput + 'T00:00:00');
    }
  } else {
    return new Date(dateInput);
  }
}

// === VALIDACIONES ===
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// === FORMATEO ===
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('es-EC');
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('es-EC');
}

// === GENERACIÓN DE IDs ===
export function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

// === DETECCIÓN DE DISPOSITIVOS ===
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
}