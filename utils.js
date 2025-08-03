// === UTILIDADES GLOBALES DE TILLUP PWA ===
// Versión: 1.4.0 - Sistema de persistencia mejorado

// === Configuración de persistencia ===
const STORAGE_CONFIG = {
  // Datos críticos que deben persistir siempre
  CRITICAL_DATA: ['sales', 'clients', 'products', 'debts', 'movements', 'chickenSales'],
  // Configuraciones que pueden usar localStorage
  SETTINGS: ['theme', 'viewModes', 'pricePerPound', 'costPerPound'],
  // Backup automático cada 5 minutos
  BACKUP_INTERVAL: 5 * 60 * 1000,
  TIMEZONE: 'America/Guayaquil' // Zona horaria para Santo Domingo de los Tsáchilas, Ecuador
};

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

// === Sistema de persistencia híbrido (localStorage + IndexedDB) ===
async function saveToStorage(key, data) {
  try {
    if (!key || data === null || data === undefined) {
      return false;
    }

    // Protección: No sobrescribir datos críticos con arrays vacíos si antes había datos
    if (STORAGE_CONFIG.CRITICAL_DATA.includes(key) && Array.isArray(data) && data.length === 0) {
      const prev = localStorage.getItem(key);
      if (prev) {
        const prevParsed = JSON.parse(prev);
        if (Array.isArray(prevParsed) && prevParsed.length > 0) {
          // Solo mensaje en consola, sin alerta visual
          console.warn(`Protección de datos: Se intentó guardar datos vacíos en "${key}". La operación fue bloqueada para evitar pérdida de información.`);
          return false;
        }
      }
    }

    // Guardar en localStorage (rápido)
    const jsonData = JSON.stringify(data);
    localStorage.setItem(key, jsonData);
    
    // Guardar en IndexedDB como respaldo (más confiable)
    if (window.localforage && STORAGE_CONFIG.CRITICAL_DATA.includes(key)) {
      await localforage.setItem(key, data);
    }
    
    // Registrar la operación para debugging
    console.debug(`Datos guardados: ${key}`, { size: jsonData.length, timestamp: new Date().toISOString() });
    
    return true;
  } catch (error) {
    console.error(`Error guardando datos (${key}):`, error);
    // Intentar guardar solo en localStorage como fallback
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (fallbackError) {
      console.error(`Error en fallback localStorage (${key}):`, fallbackError);
      return false;
    }
  }
}

async function loadFromStorage(key) {
  try {
    if (!key) return null;
    
    // Intentar cargar desde localStorage primero (más rápido)
    const localData = localStorage.getItem(key);
    if (localData) {
      const parsed = JSON.parse(localData);
      return parsed;
    }
    
    // Si no está en localStorage, intentar desde IndexedDB
    if (window.localforage && STORAGE_CONFIG.CRITICAL_DATA.includes(key)) {
      const indexedData = await localforage.getItem(key);
      if (indexedData !== null) {
        // Restaurar en localStorage para futuras cargas rápidas
        localStorage.setItem(key, JSON.stringify(indexedData));
        return indexedData;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error cargando datos (${key}):`, error);
    return null;
  }
}

// === Función para guardar todos los datos críticos ===
async function saveAllCriticalData() {
  try {
    const criticalData = {
      products: window.products || [],
      clients: window.clients || [],
      sales: window.sales || [],
      debts: window.debts || [],
      chickenSales: window.chickenSales || []
    };
    
    const savePromises = Object.entries(criticalData).map(([key, data]) => 
      saveToStorage(key, data)
    );
    
    const results = await Promise.allSettled(savePromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`Datos críticos guardados: ${successCount}/${Object.keys(criticalData).length} exitosos`);
    
    return successCount === Object.keys(criticalData).length;
  } catch (error) {
    console.error('Error guardando datos críticos:', error);
    return false;
  }
}

// === Función para cargar todos los datos críticos ===
async function loadAllCriticalData() {
  try {
    const data = {};
    
    for (const key of STORAGE_CONFIG.CRITICAL_DATA) {
      data[key] = await loadFromStorage(key) || [];
    }
    
    // Cargar configuraciones
    if (window.localforage) {
      const pricePerPoundVal = await localforage.getItem('pricePerPound');
      const costPerPoundVal = await localforage.getItem('costPerPound');
      const themeVal = await localforage.getItem('theme');
      data.pricePerPound = pricePerPoundVal !== null ? parseFloat(pricePerPoundVal) : 2.50;
      data.costPerPound = costPerPoundVal !== null ? parseFloat(costPerPoundVal) : 0;
      data.theme = themeVal || 'light';
    } else {
      data.pricePerPound = parseFloat(localStorage.getItem('pricePerPound')) || 2.50;
      data.costPerPound = parseFloat(localStorage.getItem('costPerPound')) || 0;
      data.theme = localStorage.getItem('theme') || 'light';
    }
    
    console.log('Datos críticos cargados:', {
      products: data.products.length,
      clients: data.clients.length,
      sales: data.sales.length,
      debts: data.debts.length,
      movements: data.movements.length,
      chickenSales: data.chickenSales.length
    });
    
    return data;
  } catch (error) {
    console.error('Error cargando datos críticos:', error);
    return {
      products: [],
      clients: [],
      sales: [],
      debts: [],
      movements: [],
      chickenSales: [],
      pricePerPound: 2.50,
      costPerPound: 0,
      theme: 'light'
    };
  }
}

// === Sistema de backup automático ===
let backupInterval = null;

function startAutoBackup() {
  if (backupInterval) {
    clearInterval(backupInterval);
  }
  
  backupInterval = setInterval(async () => {
    try {
      const success = await saveAllCriticalData();
      if (success) {
        console.debug("Backup automático completado");
        // Actualizar timestamp del último backup local
        localStorage.setItem("lastLocalBackup", Date.now().toString());

        // Realizar backup a Google Drive
        // Realizar backup a Google Drive solo si hay un token de acceso válido
        if (googleAccessToken) {
          const allData = await loadAllCriticalData();
          const backupFileName = `tillup_backup_${new Date().toISOString().replace(/[:.-]/g, "_")}.json`;
          await uploadToGoogleDrive(allData, backupFileName);
          console.log("Backup subido a Google Drive.");
        } else {
          console.log("No se realizó backup a Google Drive: usuario no autenticado.");
        }
      }
    } catch (error) {
      console.error("Error en backup automático:", error);
    }
  }, STORAGE_CONFIG.BACKUP_INTERVAL);
  
  console.log('Backup automático iniciado');
}

function stopAutoBackup() {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    console.log('Backup automático detenido');
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
    
    return dateObj.toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: STORAGE_CONFIG.TIMEZONE
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
    
    return dateObj.toLocaleString("es-EC", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: STORAGE_CONFIG.TIMEZONE
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

// === Función para verificar integridad de datos ===
function validateDataIntegrity() {
  try {
    const issues = [];
    
    // Verificar que todos los arrays críticos existan y sean arrays
    for (const key of STORAGE_CONFIG.CRITICAL_DATA) {
      const data = loadFromStorage(key);
      if (!Array.isArray(data)) {
        issues.push(`${key}: no es un array válido`);
      }
    }
    
    // Verificar ventas
    const sales = loadFromStorage('sales') || [];
    for (let i = 0; i < sales.length; i++) {
      const sale = sales[i];
      if (!sale.id || !sale.date || !sale.total) {
        issues.push(`Venta ${i}: datos incompletos`);
      }
    }
    
    // Verificar clientes
    const clients = loadFromStorage('clients') || [];
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      if (!client.id || !client.name) {
        issues.push(`Cliente ${i}: datos incompletos`);
      }
    }
    
    // Verificar productos
    const products = loadFromStorage('products') || [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product.id || !product.name || !product.price) {
        issues.push(`Producto ${i}: datos incompletos`);
      }
    }
    
    if (issues.length > 0) {
      console.warn('Problemas de integridad detectados:', issues);
      return { valid: false, issues };
    }
    
    return { valid: true, issues: [] };
  } catch (error) {
    console.error('Error validando integridad:', error);
    return { valid: false, issues: ['Error en validación'] };
  }
}

// === Función para limpiar datos corruptos ===
function cleanCorruptedData() {
  try {
    let cleanedCount = 0;
    
    for (const key of STORAGE_CONFIG.CRITICAL_DATA) {
      const data = loadFromStorage(key);
      if (data && Array.isArray(data)) {
        // Filtrar elementos corruptos
        const cleanData = data.filter(item => {
          if (!item || typeof item !== 'object') return false;
          
          switch (key) {
            case 'sales':
              return item.id && item.date && typeof item.total === 'number';
            case 'clients':
              return item.id && item.name;
            case 'products':
              return item.id && item.name && typeof item.price === 'number';
            case 'debts':
              return item.id && item.clientId && typeof item.amount === 'number';
            case 'chickenSales':
              return item.id && item.date && typeof item.total === 'number';
            default:
              return true;
          }
        });
        
        if (cleanData.length !== data.length) {
          saveToStorage(key, cleanData);
          cleanedCount += (data.length - cleanData.length);
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Datos corruptos limpiados: ${cleanedCount} elementos`);
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('Error limpiando datos corruptos:', error);
    return 0;
  }
}

// === Función para exportar todos los datos ===
async function exportAllData() {
  try {
    const exportData = {};
    // Exportar datos críticos
    for (const key of STORAGE_CONFIG.CRITICAL_DATA) {
      exportData[key] = await loadFromStorage(key) || [];
    }
    // Exportar configuraciones
    let pricePerPound, costPerPound, theme, inventoryViewMode, clientsViewMode;
    if (window.localforage) {
      pricePerPound = (await localforage.getItem('pricePerPound')) || 2.50;
      costPerPound = (await localforage.getItem('costPerPound')) || 0;
      theme = (await localforage.getItem('theme')) || 'light';
      inventoryViewMode = (await localforage.getItem('inventoryViewMode')) || 'grid';
      clientsViewMode = (await localforage.getItem('clientsViewMode')) || 'grid';
    } else {
      pricePerPound = parseFloat(localStorage.getItem('pricePerPound')) || 2.50;
      costPerPound = parseFloat(localStorage.getItem('costPerPound')) || 0;
      theme = localStorage.getItem('theme') || 'light';
      inventoryViewMode = localStorage.getItem('inventoryViewMode') || 'grid';
      clientsViewMode = localStorage.getItem('clientsViewMode') || 'grid';
    }
    exportData.settings = {
      pricePerPound,
      costPerPound,
      theme,
      inventoryViewMode,
      clientsViewMode
    };
    // Agregar metadatos
    exportData.metadata = {
      exportDate: new Date().toISOString(),
      version: '1.4.0',
      totalRecords: Object.values(exportData).reduce((sum, data) => 
        Array.isArray(data) ? sum + data.length : sum, 0
      )
    };
    return exportData;
  } catch (error) {
    console.error('Error exportando datos:', error);
    return null;
  }
}

// === Función para importar datos ===
async function importData(jsonData) {
  try {
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Datos de importación inválidos');
    }
    
    let importedCount = 0;
    
    // Importar datos críticos
    for (const key of STORAGE_CONFIG.CRITICAL_DATA) {
      if (jsonData[key] && Array.isArray(jsonData[key])) {
        await saveToStorage(key, jsonData[key]);
        importedCount += jsonData[key].length;
      }
    }
    
    // Importar configuraciones
    if (jsonData.settings) {
      Object.entries(jsonData.settings).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
    }
    
    console.log(`Datos importados: ${importedCount} registros`);
    return { success: true, count: importedCount };
  } catch (error) {
    console.error('Error importando datos:', error);
    return { success: false, error: error.message };
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

// === Funciones de utilidad para UI ===
function getStorageStats() {
  try {
    const stats = {
      localStorage: {
        used: 0,
        available: 0
      },
      criticalData: {}
    };
    
    // Calcular uso de localStorage
    let totalSize = 0;
    for (const key of STORAGE_CONFIG.CRITICAL_DATA) {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
        stats.criticalData[key] = {
          size: data.length,
          records: JSON.parse(data).length
        };
      }
    }
    
    stats.localStorage.used = totalSize;
    stats.localStorage.available = 5 * 1024 * 1024; // 5MB típico
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
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
// No exportar cleanCorruptedData como cleanLocalStorage para evitar confusión y duplicidad
window.exportData = exportAllData; // Renamed to reflect new functionality
window.importData = importData;
window.debounce = debounce;
window.throttle = throttle;
window.copyToClipboard = copyToClipboard;
window.validateDataIntegrity = validateDataIntegrity;
window.getStorageStats = getStorageStats; // Added new function to window
window.restoreBackupIfLossDetected = function() {
  try {
    const backup = localStorage.getItem('tillup_backup');
    if (!backup) return false;
    const backupData = JSON.parse(backup);
    let restored = false;
    for (const key of STORAGE_CONFIG.CRITICAL_DATA) {
      const current = localStorage.getItem(key);
      const currentArr = current ? JSON.parse(current) : [];
      const backupArr = backupData[key] || [];
      if (Array.isArray(currentArr) && currentArr.length === 0 && Array.isArray(backupArr) && backupArr.length > 0) {
        localStorage.setItem(key, JSON.stringify(backupArr));
        restored = true;
      }
    }
    if (restored && window.Swal) {
      Swal.fire({
        icon: 'info',
        title: 'Backup restaurado',
        text: 'Se detectó pérdida de datos y se restauró el backup más reciente.',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'swal2-sale-treinta' }
      });
    }
    return restored;
  } catch (e) {
    console.error('Error restaurando backup:', e);
    return false;
  }
};

console.log('✅ Utilidades globales cargadas correctamente');

// === Funciones de Google Drive ===
async function uploadToGoogleDrive(data, fileName) {
  try {
    if (!gapi.client || !gapi.client.drive) {
      console.error('Google Drive API no cargada o no inicializada.');
      return null;
    }

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delimiter = "\r\n--" + boundary + "--";

    const metadata = {
      'name': fileName,
      'mimeType': 'application/json',
      'parents': ['appDataFolder'] // Guarda en la carpeta de datos de la aplicación
    };

    const jsonString = JSON.stringify(data);
    const base64Data = btoa(unescape(encodeURIComponent(jsonString)));

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n' +
      'Content-Transfer-Encoding: base64\r\n' +
      '\r\n' +
      base64Data +
      close_delimiter;

    const request = gapi.client.request({
      'path': '/upload/drive/v3/files',
      'method': 'POST',
      'params': {'uploadType': 'multipart'},
      'headers': {
        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
      },
      'body': multipartRequestBody
    });

    const response = await request;
    console.log('Archivo subido a Google Drive:', response.result);
    return response.result;
  } catch (error) {
    console.error('Error al subir archivo a Google Drive:', error);
    return null;
  }
}

async function downloadFromGoogleDrive(fileId) {
  try {
    if (!gapi.client || !gapi.client.drive) {
      console.error('Google Drive API no cargada o no inicializada.');
      return null;
    }

    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });

    console.log('Archivo descargado de Google Drive:', response.result);
    return response.result;
  } catch (error) {
    console.error('Error al descargar archivo de Google Drive:', error);
    return null;
  }
}

async function listGoogleDriveBackups() {
  try {
    if (!gapi.client || !gapi.client.drive) {
      console.error('Google Drive API no cargada o no inicializada.');
      return [];
    }

    const response = await gapi.client.drive.files.list({
      q: "mimeType='application/json' and 'appDataFolder' in parents",
      fields: 'files(id, name, modifiedTime)',
      spaces: 'appDataFolder'
    });

    return response.result.files;
  } catch (error) {
    console.error('Error al listar backups de Google Drive:', error);
    return [];
  }
}

async function deleteGoogleDriveFile(fileId) {
  try {
    if (!gapi.client || !gapi.client.drive) {
      console.error('Google Drive API no cargada o no inicializada.');
      return false;
    }

    await gapi.client.drive.files.delete({ fileId: fileId });
    console.log('Archivo eliminado de Google Drive:', fileId);
    return true;
  } catch (error) {
    console.error('Error al eliminar archivo de Google Drive:', error);
    return false;
  }
}





// === Funciones de Google Drive ===
let googleAccessToken = null;
let tokenClient;

async function ensureGoogleAccessToken() {
  if (googleAccessToken) return true;

  const storedToken = localStorage.getItem('googleAccessToken');
  if (storedToken) {
    const tokenData = JSON.parse(storedToken);
    if (tokenData.expires_at > Date.now()) {
      googleAccessToken = tokenData.access_token;
      gapi.client.setToken({ access_token: googleAccessToken });
      return true;
    } else {
      // Token expirado, intentar refrescar o solicitar nuevo
      console.log('Token de Google Drive expirado, solicitando nuevo...');
      return await requestNewGoogleAccessToken();
    }
  }
  // No hay token almacenado, solicitar uno nuevo
  return await requestNewGoogleAccessToken();
}

async function requestNewGoogleAccessToken() {
  return new Promise((resolve) => {
    tokenClient.callback = async (resp) => {
      if (resp.error) {
        console.error('Error al obtener token de Google Drive:', resp.error);
        Swal.fire('Error de autenticación', 'No se pudo iniciar sesión en Google Drive. Por favor, inténtalo de nuevo.', 'error');
        resolve(false);
      } else {
        googleAccessToken = resp.access_token;
        const expires_in = resp.expires_in;
        const expires_at = Date.now() + (expires_in * 1000);
        localStorage.setItem('googleAccessToken', JSON.stringify({ access_token: googleAccessToken, expires_at }));
        console.log('Nuevo token de Google Drive obtenido y almacenado.');
        resolve(true);
      }
    };
    tokenClient.requestAccessToken();
  });
}

async function uploadToGoogleDrive(data, fileName) {
  if (!(await ensureGoogleAccessToken())) {
    throw new Error('No se pudo obtener el token de acceso a Google Drive.');
  }

  const fileContent = JSON.stringify(data, null, 2);
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: ['appDataFolder'] // Guarda en la carpeta de datos de la aplicación
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + googleAccessToken }),
    body: form
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error al subir a Google Drive: ${response.status} - ${errorData.error.message}`);
  }
  return response.json();
}

async function downloadBackupFromDrive() {
  if (!(await ensureGoogleAccessToken())) {
    throw new Error('No se pudo obtener el token de acceso a Google Drive.');
  }

  // Buscar el último archivo de backup en la carpeta de la aplicación
  const response = await fetch('https://www.googleapis.com/drive/v3/files?q=\'appDataFolder\' in parents and mimeType=\'application/json\'&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=1', {
    headers: new Headers({ 'Authorization': 'Bearer ' + googleAccessToken })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error al buscar backups en Google Drive: ${response.status} - ${errorData.error.message}`);
  }

  const data = await response.json();
  if (!data.files || data.files.length === 0) {
    throw new Error('No se encontraron archivos de backup en Google Drive.');
  }

  const fileId = data.files[0].id;

  // Descargar el contenido del archivo
  const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: new Headers({ 'Authorization': 'Bearer ' + googleAccessToken })
  });

  if (!downloadResponse.ok) {
    const errorData = await downloadResponse.json();
    throw new Error(`Error al descargar backup de Google Drive: ${downloadResponse.status} - ${errorData.error.message}`);
  }

  return downloadResponse.text();
}

// Función para obtener todos los datos de la aplicación para backup
async function getAllAppData() {
  const data = {};
  for (const key of STORAGE_CONFIG.CRITICAL_DATA) {
    data[key] = await loadFromStorage(key);
  }
  // Incluir configuraciones adicionales si es necesario
  data.pricePerPound = await loadFromStorage('pricePerPound');
  data.costPerPound = await loadFromStorage('costPerPound');
  data.theme = await loadFromStorage('theme');
  return data;
}

// Función para detener el backup automático de Google Drive
function stopGoogleDriveAutoBackup() {
  // Lógica para detener el backup automático si está en curso
  // Esto podría implicar limpiar un setInterval o similar si se implementa un backup específico de Drive
  console.log('Backup automático de Google Drive detenido.');
}

// Inicialización de Google API Client
function initGoogleApi() {
  gapi.client.init({
    apiKey: 'AIzaSyAygKPhHeZtg3Vap9lwN6spLPoTHFIgFU4',
    clientId: '83503843228-lh6tbfvp9q1a3omus30g2i9miadrp6i7.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/drive.file',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  }).then(() => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: '83503843228-lh6tbfvp9q1a3omus30g2i9miadrp6i7.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: '', // Se define dinámicamente en requestNewGoogleAccessToken
    });
    console.log('Google API Client y Token Client inicializados.');
    // Intentar cargar token existente al inicio
    ensureGoogleAccessToken().then(loggedIn => {
      if (typeof updateSidebarGoogleDriveUI === 'function') {
        updateSidebarGoogleDriveUI(loggedIn);
      }
    });
  }).catch(err => {
    console.error('Error al inicializar Google API Client:', err);
    Swal.fire('Error', 'No se pudo inicializar la integración con Google Drive. Revisa tu conexión o la configuración de la API.', 'error');
  });
}

// Cargar la librería de Google API
gapi.load('client', initGoogleApi);




async function loadAllCriticalDataFromGoogleDrive() {
  try {
    const backupDataString = await downloadBackupFromDrive();
    if (backupDataString) {
      const backupData = JSON.parse(backupDataString);
      console.log('Datos cargados desde Google Drive:', backupData);
      return backupData;
    } else {
      console.log('No se encontró backup en Google Drive.');
      return null;
    }
  } catch (error) {
    console.error('Error cargando datos desde Google Drive:', error);
    return null;
  }
}

window.loadAllCriticalDataFromGoogleDrive = loadAllCriticalDataFromGoogleDrive;


