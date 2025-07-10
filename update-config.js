// === CONFIGURACIÓN DEL SISTEMA DE ACTUALIZACIÓN AUTOMÁTICA ===

const UPDATE_CONFIG = {
  // Versión actual de la aplicación
  version: '1.3.0',
  
  // Intervalo de verificación de actualizaciones (en milisegundos)
  checkInterval: 30 * 60 * 1000, // 30 minutos
  
  // Archivos críticos que se verifican para actualizaciones
  criticalFiles: [
    './app.js',
    './style.css',
    './utils.js',
    './index.html',
    './manifest.json'
  ],
  
  // Configuración de notificaciones
  notifications: {
    enabled: true,
    showToast: true,
    showNative: true,
    autoHide: true,
    hideDelay: 10000 // 10 segundos
  },
  
  // Configuración de caché
  cache: {
    strategy: 'network-first', // 'network-first', 'cache-first', 'stale-while-revalidate'
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    cleanupInterval: 7 * 24 * 60 * 60 * 1000 // 7 días
  },
  
  // Configuración de sincronización
  sync: {
    enabled: true,
    background: true,
    onOnline: true,
    onVisibilityChange: true
  },
  
  // Configuración de UI
  ui: {
    showIndicator: true,
    showProgress: true,
    animateUpdates: true,
    hapticFeedback: true
  },
  
  // Configuración de debug
  debug: {
    enabled: false,
    logLevel: 'info', // 'error', 'warn', 'info', 'debug'
    showConsole: false
  }
};

// Función para obtener configuración
function getUpdateConfig() {
  return UPDATE_CONFIG;
}

// Función para actualizar configuración
function updateConfig(newConfig) {
  Object.assign(UPDATE_CONFIG, newConfig);
  localStorage.setItem('updateConfig', JSON.stringify(UPDATE_CONFIG));
}

// Función para cargar configuración desde localStorage
function loadUpdateConfig() {
  const savedConfig = localStorage.getItem('updateConfig');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      Object.assign(UPDATE_CONFIG, config);
    } catch (error) {
      console.error('Error cargando configuración de actualización:', error);
    }
  }
}

// Función para resetear configuración
function resetUpdateConfig() {
  localStorage.removeItem('updateConfig');
  location.reload();
}

// Función para verificar si hay una nueva versión disponible
function checkVersion() {
  const currentVersion = UPDATE_CONFIG.version;
  const savedVersion = localStorage.getItem('appVersion');
  
  if (savedVersion && savedVersion !== currentVersion) {
    console.log(`Actualización de versión: ${savedVersion} → ${currentVersion}`);
    localStorage.setItem('appVersion', currentVersion);
    return {
      hasUpdate: true,
      oldVersion: savedVersion,
      newVersion: currentVersion
    };
  }
  
  localStorage.setItem('appVersion', currentVersion);
  return { hasUpdate: false };
}

// Función para registrar evento de actualización
function logUpdateEvent(event, data = {}) {
  if (!UPDATE_CONFIG.debug.enabled) return;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: event,
    version: UPDATE_CONFIG.version,
    data: data
  };
  
  const logs = JSON.parse(localStorage.getItem('updateLogs') || '[]');
  logs.push(logEntry);
  
  // Mantener solo los últimos 100 logs
  if (logs.length > 100) {
    logs.splice(0, logs.length - 100);
  }
  
  localStorage.setItem('updateLogs', JSON.stringify(logs));
  
  if (UPDATE_CONFIG.debug.showConsole) {
    console.log(`[UPDATE] ${event}:`, data);
  }
}

// Función para obtener logs de actualización
function getUpdateLogs() {
  return JSON.parse(localStorage.getItem('updateLogs') || '[]');
}

// Función para limpiar logs de actualización
function clearUpdateLogs() {
  localStorage.removeItem('updateLogs');
}

// Función para obtener estadísticas de actualización
function getUpdateStats() {
  const logs = getUpdateLogs();
  const stats = {
    totalUpdates: 0,
    lastUpdate: null,
    averageUpdateTime: 0,
    failedUpdates: 0,
    successfulUpdates: 0
  };
  
  logs.forEach(log => {
    if (log.event === 'UPDATE_APPLIED') {
      stats.totalUpdates++;
      stats.lastUpdate = log.timestamp;
      stats.successfulUpdates++;
    } else if (log.event === 'UPDATE_FAILED') {
      stats.failedUpdates++;
    }
  });
  
  return stats;
}

// Exportar funciones para uso global
window.UPDATE_CONFIG = UPDATE_CONFIG;
window.getUpdateConfig = getUpdateConfig;
window.updateConfig = updateConfig;
window.loadUpdateConfig = loadUpdateConfig;
window.resetUpdateConfig = resetUpdateConfig;
window.checkVersion = checkVersion;
window.logUpdateEvent = logUpdateEvent;
window.getUpdateLogs = getUpdateLogs;
window.clearUpdateLogs = clearUpdateLogs;
window.getUpdateStats = getUpdateStats;

// Cargar configuración al inicializar
loadUpdateConfig();

// Verificar versión al cargar
document.addEventListener('DOMContentLoaded', () => {
  const versionCheck = checkVersion();
  if (versionCheck.hasUpdate) {
    logUpdateEvent('VERSION_UPDATE', versionCheck);
  }
}); 