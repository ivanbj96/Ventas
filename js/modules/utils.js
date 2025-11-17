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

// === FECHA LOCAL CORRECTA ===
export function getLocalDate() {
  const now = new Date();
  // Crear fecha local sin problemas de zona horaria
  const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  return localDate;
}

export function getLocalDateString() {
  const localDate = getLocalDate();
  return localDate.toISOString().split('T')[0];
}

export function getLocalDateTime() {
  const now = new Date();
  return {
    date: getLocalDateString(),
    time: now.toLocaleTimeString('es-ES', { hour12: false }),
    timestamp: now.toLocaleString('es-ES')
  };
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

// === SANITIZACIÓN Y SEGURIDAD (Prevención XSS) ===
/**
 * Escapa cualquier string para evitar inyección de HTML (XSS).
 * Convierte el texto en contenido textNode y devuelve su innerHTML escapado.
 * @param {any} str
 * @returns {string}
 */
export function sanitizeHTML(str) {
  if (str === null || str === undefined) return '';
  try {
    const s = String(str);
    const temp = document.createElement('div');
    temp.textContent = s;
    return temp.innerHTML;
  } catch (e) {
    return '';
  }
}

/**
 * Establece contenido HTML seguro en un elemento usando sanitización.
 * Útil cuando se necesita usar innerHTML pero queremos escapar el contenido dinámico.
 * @param {Element} element
 * @param {any} content
 */
export function safeSetHTML(element, content) {
  if (!element) return;
  element.innerHTML = sanitizeHTML(content);
}

// === UTILIDADES DE RENDIMIENTO ===
/**
 * Debounce simple
 * @param {Function} fn
 * @param {number} wait
 */
export function debounce(fn, wait = 250) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, wait);
  };
}

/**
 * Sanitiza una URL de recurso para evitar esquemas peligrosos (ej. javascript:)
 * Si la URL no es segura, retorna una ruta por defecto.
 * @param {string} url
 * @param {string} fallback
 */
export function sanitizeUrl(url, fallback = 'icons/descarga.png') {
  try {
    if (!url) return fallback;
    const s = String(url).trim();
    // Rechazar esquemas peligrosos
    const lower = s.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:text/html')) return fallback;
    // Permitir rutas relativas e http/https/data:image
    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('/') || lower.startsWith('data:image')) {
      return s;
    }
    // Cualquier otro caso usar fallback
    return fallback;
  } catch (e) {
    return fallback;
  }
}