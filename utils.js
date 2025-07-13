// === UTILIDADES GLOBALES DE TILLUP PWA ===
// Versión: 1.3.1 - Optimizado para móviles

// === Formatear moneda (con soporte a centavos y localización) ===
function formatCurrency(value) {
  try {
    if (typeof value !== 'number' || isNaN(value)) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.error('Error formateando moneda:', error);
    return '$0.00';
  }
}

// === Guardar y cargar desde localStorage de forma segura ===
function saveToStorage(key, data) {
  try {
    if (key && data !== null && data !== undefined) {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error guardando en localStorage (${key}):`, error);
    return false;
  }
}

function loadFromStorage(key) {
  try {
    if (!key) return null;
    
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    console.error(`Error cargando de localStorage (${key}):`, error);
    return null;
  }
}

// === Generar ID único mejorado ===
function generateId(prefix = '') {
  try {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const uniqueId = `${prefix}${timestamp}-${random}`;
    return uniqueId;
  } catch (error) {
    console.error('Error generando ID:', error);
    return `${prefix}${Date.now()}`;
  }
}

// === Validaciones mejoradas ===
function isValidEmail(email) {
  try {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  } catch (error) {
    console.error('Error validando email:', error);
    return false;
  }
}

function isValidPhone(phone) {
  try {
    if (!phone || typeof phone !== 'string') return false;
    const phoneRegex = /^[0-9]{7,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  } catch (error) {
    console.error('Error validando teléfono:', error);
    return false;
  }
}

function isValidNumber(value) {
  try {
    if (value === null || value === undefined || value === '') return false;
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  } catch (error) {
    console.error('Error validando número:', error);
    return false;
  }
}

// === Funciones de fecha y tiempo ===
function formatDate(date) {
  try {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '';
  }
}

function formatDateTime(date) {
  try {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando fecha y hora:', error);
    return '';
  }
}

function isToday(date) {
  try {
    if (!date) return false;
    
    const dateObj = new Date(date);
    const today = new Date();
    
    return dateObj.toDateString() === today.toDateString();
  } catch (error) {
    console.error('Error verificando si es hoy:', error);
    return false;
  }
}

function isThisWeek(date) {
  try {
    if (!date) return false;
    
    const dateObj = new Date(date);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return dateObj >= startOfWeek && dateObj <= endOfWeek;
  } catch (error) {
    console.error('Error verificando si es esta semana:', error);
    return false;
  }
}

function isThisMonth(date) {
  try {
    if (!date) return false;
    
    const dateObj = new Date(date);
    const today = new Date();
    
    return dateObj.getMonth() === today.getMonth() && 
           dateObj.getFullYear() === today.getFullYear();
  } catch (error) {
    console.error('Error verificando si es este mes:', error);
    return false;
  }
}

// === Funciones de cálculo ===
function calculatePercentage(part, total) {
  try {
    if (!isValidNumber(part) || !isValidNumber(total) || total === 0) {
      return 0;
    }
    
    return ((part / total) * 100).toFixed(2);
  } catch (error) {
    console.error('Error calculando porcentaje:', error);
    return 0;
  }
}

function calculateProfit(revenue, cost) {
  try {
    if (!isValidNumber(revenue) || !isValidNumber(cost)) {
      return 0;
    }
    
    return revenue - cost;
  } catch (error) {
    console.error('Error calculando ganancia:', error);
    return 0;
  }
}

function calculateProfitMargin(revenue, cost) {
  try {
    if (!isValidNumber(revenue) || !isValidNumber(cost) || revenue === 0) {
      return 0;
    }
    
    const profit = revenue - cost;
    return ((profit / revenue) * 100).toFixed(2);
  } catch (error) {
    console.error('Error calculando margen de ganancia:', error);
    return 0;
  }
}

// === Funciones de array y objetos ===
function sortByDate(array, dateField = 'date', ascending = false) {
  try {
    if (!Array.isArray(array)) return [];
    
    return [...array].sort((a, b) => {
      const dateA = new Date(a[dateField]);
      const dateB = new Date(b[dateField]);
      
      if (ascending) {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  } catch (error) {
    console.error('Error ordenando por fecha:', error);
    return array || [];
  }
}

function filterByDateRange(array, startDate, endDate, dateField = 'date') {
  try {
    if (!Array.isArray(array)) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return array.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });
  } catch (error) {
    console.error('Error filtrando por rango de fecha:', error);
    return array || [];
  }
}

function groupBy(array, key) {
  try {
    if (!Array.isArray(array)) return {};
    
    return array.reduce((groups, item) => {
      const group = item[key];
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  } catch (error) {
    console.error('Error agrupando array:', error);
    return {};
  }
}

// === Funciones de proformas por cliente ===
function saveProforma(clientId, cartData) {
  try {
    if (!clientId || !cartData) return false;
    
    const allProformas = loadFromStorage('proformas') || {};
    allProformas[clientId] = {
      ...cartData,
      savedAt: new Date().toISOString()
    };
    
    return saveToStorage('proformas', allProformas);
  } catch (error) {
    console.error('Error guardando proforma:', error);
    return false;
  }
}

function loadProforma(clientId) {
  try {
    if (!clientId) return [];
    
    const allProformas = loadFromStorage('proformas') || {};
    return allProformas[clientId] || [];
  } catch (error) {
    console.error('Error cargando proforma:', error);
    return [];
  }
}

function deleteProforma(clientId) {
  try {
    if (!clientId) return false;
    
    const allProformas = loadFromStorage('proformas') || {};
    delete allProformas[clientId];
    
    return saveToStorage('proformas', allProformas);
  } catch (error) {
    console.error('Error eliminando proforma:', error);
    return false;
  }
}

// === Funciones de limpieza y mantenimiento ===
function cleanLocalStorage() {
  try {
    const keysToKeep = [
      'products', 'clients', 'sales', 'debts', 'cart', 'chickenSales',
      'currentClientId', 'chickenConfig', 'proformas', 'appVersion',
      'theme', 'inventoryViewMode', 'clientsViewMode', 'salesViewMode'
    ];
    
    const allKeys = Object.keys(localStorage);
    const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Limpieza completada. Eliminadas ${keysToRemove.length} claves.`);
    return true;
  } catch (error) {
    console.error('Error limpiando localStorage:', error);
    return false;
  }
}

function exportData() {
  try {
    const data = {
      products: loadFromStorage('products') || [],
      clients: loadFromStorage('clients') || [],
      sales: loadFromStorage('sales') || [],
      debts: loadFromStorage('debts') || [],
      chickenSales: loadFromStorage('chickenSales') || [],
      chickenConfig: loadFromStorage('chickenConfig') || {},
      proformas: loadFromStorage('proformas') || {},
      exportDate: new Date().toISOString(),
      version: '1.3.1'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tillup_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exportando datos:', error);
    return false;
  }
}

function importData(jsonData) {
  try {
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Datos inválidos');
    }
    
    const requiredKeys = ['products', 'clients', 'sales', 'debts'];
    const missingKeys = requiredKeys.filter(key => !jsonData[key]);
    
    if (missingKeys.length > 0) {
      throw new Error(`Datos incompletos. Faltan: ${missingKeys.join(', ')}`);
    }
    
    // Guardar datos importados
    Object.entries(jsonData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        saveToStorage(key, value);
      }
    });
    
    console.log('Datos importados correctamente');
    return true;
  } catch (error) {
    console.error('Error importando datos:', error);
    return false;
  }
}

// === Funciones de utilidad para UI ===
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return Promise.resolve(result);
    }
  } catch (error) {
    console.error('Error copiando al portapapeles:', error);
    return Promise.reject(error);
  }
}

// === Funciones de validación de datos ===
function validateDataIntegrity() {
  try {
    const issues = [];
    
    // Verificar productos
    const products = loadFromStorage('products') || [];
    products.forEach((product, index) => {
      if (!product.id || !product.name || !product.price) {
        issues.push(`Producto ${index + 1}: datos incompletos`);
      }
    });
    
    // Verificar clientes
    const clients = loadFromStorage('clients') || [];
    clients.forEach((client, index) => {
      if (!client.id || !client.name) {
        issues.push(`Cliente ${index + 1}: datos incompletos`);
      }
    });
    
    // Verificar ventas
    const sales = loadFromStorage('sales') || [];
    sales.forEach((sale, index) => {
      if (!sale.id || !sale.total || !sale.date) {
        issues.push(`Venta ${index + 1}: datos incompletos`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  } catch (error) {
    console.error('Error validando integridad de datos:', error);
    return {
      isValid: false,
      issues: ['Error en validación']
    };
  }
}

// === Exportar funciones para uso global ===
window.formatCurrency = formatCurrency;
window.saveToStorage = saveToStorage;
window.loadFromStorage = loadFromStorage;
window.generateId = generateId;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.isValidNumber = isValidNumber;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.isToday = isToday;
window.isThisWeek = isThisWeek;
window.isThisMonth = isThisMonth;
window.calculatePercentage = calculatePercentage;
window.calculateProfit = calculateProfit;
window.calculateProfitMargin = calculateProfitMargin;
window.sortByDate = sortByDate;
window.filterByDateRange = filterByDateRange;
window.groupBy = groupBy;
window.saveProforma = saveProforma;
window.loadProforma = loadProforma;
window.deleteProforma = deleteProforma;
window.cleanLocalStorage = cleanLocalStorage;
window.exportData = exportData;
window.importData = importData;
window.debounce = debounce;
window.throttle = throttle;
window.copyToClipboard = copyToClipboard;
window.validateDataIntegrity = validateDataIntegrity;

console.log('✅ Utilidades globales cargadas correctamente');