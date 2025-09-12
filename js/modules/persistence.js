// ========================================
// 💾 SISTEMA DE PERSISTENCIA Y CARGA DE DATOS
// ========================================

import { 
  setProducts, 
  setClients, 
  setSales, 
  setDebts, 
  setMovements, 
  setChickenSales, 
  setPricePerPound, 
  setCostPerPound 
} from './state.js';

// === CARGA PRINCIPAL DE DATOS ===
export async function loadData() {
  try {
    const data = await loadAllCriticalData();
    
    setProducts(data.products || []);
    setClients(data.clients || []);
    setSales(data.sales || []);
    setDebts(data.debts || []);
    setMovements(data.movements || []);
    setChickenSales(data.chickenSales || []);
    setPricePerPound(data.pricePerPound || 2.50);
    setCostPerPound(data.costPerPound || 0);
    
    const integrity = validateDataIntegrity();
    if (!integrity.valid) {
      console.warn('Problemas de integridad detectados, limpiando datos corruptos...');
      cleanCorruptedData();
    }
    
    console.log('Datos cargados correctamente:', {
      products: data.products?.length || 0,
      clients: data.clients?.length || 0,
      sales: data.sales?.length || 0,
      debts: data.debts?.length || 0,
      chickenSales: data.chickenSales?.length || 0,
      integrity: integrity.valid
    });
    
    startAutoBackup();
    setupDataChangeDetection();
    
  } catch (error) {
    console.error('Error cargando datos:', error);
    initializeEmptyData();
  }
}

// === CARGA DE DATOS CRÍTICOS ===
async function loadAllCriticalData() {
  const keys = ['products', 'clients', 'sales', 'debts', 'movements', 'chickenSales', 'pricePerPound', 'costPerPound'];
  const data = {};
  
  for (const key of keys) {
    try {
      // Usar solo localStorage para evitar problemas con localforage
      const value = localStorage.getItem(key);
      if (value !== null) {
        data[key] = key.includes('price') || key.includes('cost') ? parseFloat(value) : JSON.parse(value);
      }
    } catch (error) {
      console.warn(`Error cargando ${key}:`, error);
    }
  }
  
  return data;
}

// === GUARDADO DE DATOS ===
export async function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error guardando ${key}:`, error);
    throw error;
  }
}

// === VALIDACIÓN DE INTEGRIDAD ===
function validateDataIntegrity() {
  const issues = [];
  
  // Validar estructura de datos
  try {
    const testKeys = ['products', 'clients', 'sales', 'debts'];
    testKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        JSON.parse(data);
      }
    });
  } catch (error) {
    issues.push('Datos corruptos detectados');
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  };
}

// === LIMPIEZA DE DATOS CORRUPTOS ===
function cleanCorruptedData() {
  const keys = ['products', 'clients', 'sales', 'debts', 'movements', 'chickenSales'];
  
  keys.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        JSON.parse(data);
      }
    } catch (error) {
      console.warn(`Limpiando datos corruptos de ${key}`);
      localStorage.removeItem(key);
    }
  });
}

// === INICIALIZACIÓN DE DATOS VACÍOS ===
function initializeEmptyData() {
  setProducts([]);
  setClients([]);
  setSales([]);
  setDebts([]);
  setMovements([]);
  setChickenSales([]);
  setPricePerPound(2.50);
  setCostPerPound(0);
}

// === BACKUP AUTOMÁTICO ===
function startAutoBackup() {
  // Implementar backup automático cada 5 minutos
  setInterval(async () => {
    try {
      await createBackup();
    } catch (error) {
      console.warn('Error en backup automático:', error);
    }
  }, 5 * 60 * 1000); // 5 minutos
}

async function createBackup() {
  const timestamp = new Date().toISOString();
  const backupData = await loadAllCriticalData();
  
  try {
    localStorage.setItem(`backup_${timestamp}`, JSON.stringify(backupData));
    await cleanOldBackups();
  } catch (error) {
    console.warn('Error creando backup:', error);
  }
}

async function cleanOldBackups() {
  try {
    const keys = Object.keys(localStorage);
    const backupKeys = keys.filter(key => key.startsWith('backup_')).sort().reverse();
    
    for (let i = 5; i < backupKeys.length; i++) {
      localStorage.removeItem(backupKeys[i]);
    }
  } catch (error) {
    console.warn('Error limpiando backups antiguos:', error);
  }
}

// === DETECCIÓN DE CAMBIOS ===
function setupDataChangeDetection() {
  // Implementar detección de cambios para backup automático
  let changeTimeout;
  
  window.addEventListener('beforeunload', () => {
    createBackup();
  });
  
  // Detectar cambios en localStorage
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    
    if (['products', 'clients', 'sales', 'debts', 'chickenSales'].includes(key)) {
      clearTimeout(changeTimeout);
      changeTimeout = setTimeout(createBackup, 30000); // Backup después de 30 segundos de inactividad
    }
  };
}