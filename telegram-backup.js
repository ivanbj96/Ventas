// ========================================
// 📱 SISTEMA DE BACKUP A TELEGRAM
// ========================================
// Sistema completo de respaldo automático y manual a Telegram
// Desarrollado para TillUp POS

class TelegramBackup {
  constructor() {
    this.config = this.loadConfig();
    this.backupHistory = this.loadBackupHistory();
    this.autoBackupInterval = null;
    this.init();
  }

  // === INICIALIZACIÓN ===
  init() {
    this.setupEventListeners();
    this.updateUI();
    if (this.config.autoBackupEnabled && this.config.botToken && this.config.channelId) {
      this.startAutoBackup();
    }
  }

  // === CONFIGURACIÓN ===
  loadConfig() {
    const defaultConfig = {
      botToken: '',
      channelId: '',
      backupInterval: 60,
      autoBackupEnabled: false
    };
    
    try {
      const saved = localStorage.getItem('telegram_backup_config');
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch (error) {
      console.error('Error cargando configuración:', error);
      return defaultConfig;
    }
  }

  saveConfig() {
    try {
      localStorage.setItem('telegram_backup_config', JSON.stringify(this.config));
      this.updateUI();
    } catch (error) {
      console.error('Error guardando configuración:', error);
    }
  }

  // === HISTORIAL DE BACKUPS ===
  loadBackupHistory() {
    try {
      const saved = localStorage.getItem('telegram_backup_history');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error cargando historial:', error);
      return [];
    }
  }

  saveBackupHistory() {
    try {
      // Mantener solo los últimos 50 backups
      if (this.backupHistory.length > 50) {
        this.backupHistory = this.backupHistory.slice(-50);
      }
      localStorage.setItem('telegram_backup_history', JSON.stringify(this.backupHistory));
      this.updateBackupHistoryUI();
    } catch (error) {
      console.error('Error guardando historial:', error);
    }
  }

  addToHistory(type, status, message, size = 0) {
    const entry = {
      id: Date.now(),
      type,
      status,
      message,
      size,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };
    
    this.backupHistory.unshift(entry);
    this.saveBackupHistory();
  }

  // === EVENTOS ===
  setupEventListeners() {
    // Formulario de configuración
    const form = document.getElementById('telegramConfigForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveConfiguration();
      });
    }

    // Botones de prueba y backup manual
    const testBtn = document.getElementById('testTelegramConnection');
    if (testBtn) {
      testBtn.addEventListener('click', () => this.testConnection());
    }

    const manualBtn = document.getElementById('manualBackupBtn');
    if (manualBtn) {
      manualBtn.addEventListener('click', () => this.performFullBackup());
    }

    // Input de archivo para restaurar
    const fileInput = document.getElementById('restoreFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const restoreBtn = document.getElementById('restoreBtn');
        if (restoreBtn) {
          restoreBtn.disabled = !e.target.files.length;
        }
      });
    }
  }

  // === CONFIGURACIÓN UI ===
  saveConfiguration() {
    const botToken = document.getElementById('botToken')?.value.trim();
    const channelId = document.getElementById('channelId')?.value.trim();
    const backupInterval = parseInt(document.getElementById('backupInterval')?.value) || 60;
    const autoBackupEnabled = document.getElementById('autoBackupEnabled')?.checked || false;

    if (!botToken || !channelId) {
      Swal.fire({
        icon: 'error',
        title: 'Configuración incompleta',
        text: 'Por favor, completa el token del bot y el ID del canal.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.config = {
      botToken,
      channelId,
      backupInterval: Math.max(5, Math.min(1440, backupInterval)),
      autoBackupEnabled
    };

    this.saveConfig();

    // Reiniciar backup automático si está habilitado
    if (autoBackupEnabled) {
      this.startAutoBackup();
    } else {
      this.stopAutoBackup();
    }

    Swal.fire({
      icon: 'success',
      title: 'Configuración guardada',
      text: 'La configuración de Telegram ha sido guardada correctamente.',
      timer: 2000,
      showConfirmButton: false
    });
  }

  updateUI() {
    // Actualizar campos del formulario
    const botTokenInput = document.getElementById('botToken');
    const channelIdInput = document.getElementById('channelId');
    const intervalInput = document.getElementById('backupInterval');
    const autoEnabledInput = document.getElementById('autoBackupEnabled');

    if (botTokenInput) botTokenInput.value = this.config.botToken;
    if (channelIdInput) channelIdInput.value = this.config.channelId;
    if (intervalInput) intervalInput.value = this.config.backupInterval;
    if (autoEnabledInput) autoEnabledInput.checked = this.config.autoBackupEnabled;

    // Actualizar estado
    this.updateStatus();
    this.updateBackupHistoryUI();
  }

  updateStatus() {
    const statusElement = document.getElementById('statusText');
    const statusAlert = document.getElementById('telegramStatus');
    
    if (!statusElement || !statusAlert) return;

    if (!this.config.botToken || !this.config.channelId) {
      statusElement.textContent = 'Telegram no configurado. Complete la configuración para habilitar el respaldo automático.';
      statusAlert.className = 'alert alert-info mb-4';
    } else if (this.config.autoBackupEnabled) {
      statusElement.textContent = `Backup automático activo. Próximo backup en ${this.config.backupInterval} minutos.`;
      statusAlert.className = 'alert alert-success mb-4';
    } else {
      statusElement.textContent = 'Telegram configurado. Backup automático deshabilitado.';
      statusAlert.className = 'alert alert-warning mb-4';
    }
  }

  updateBackupHistoryUI() {
    const historyContainer = document.getElementById('backupHistory');
    if (!historyContainer) return;

    if (this.backupHistory.length === 0) {
      historyContainer.innerHTML = `
        <div class="list-group-item text-muted text-center">
          <i class="bi bi-inbox"></i> No hay backups registrados
        </div>
      `;
      return;
    }

      historyContainer.innerHTML = this.backupHistory.slice(0, 10).map(entry => `
        <div class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <div class="d-flex align-items-center">
              <i class="bi bi-${sanitizeHTML(this.getBackupIcon(entry.type))} me-2"></i>
              <strong>${sanitizeHTML(this.getBackupTypeText(entry.type))}</strong>
              <span class="badge bg-${entry.status === 'success' ? 'success' : 'danger'} ms-2">
                ${entry.status === 'success' ? 'Exitoso' : 'Error'}
              </span>
            </div>
            <small class="text-muted">${sanitizeHTML(entry.message || '')}</small>
          </div>
          <div class="text-end">
            <small class="text-muted d-block">${sanitizeHTML(entry.date || '')}</small>
            <small class="text-muted">${sanitizeHTML(entry.time || '')}</small>
            ${entry.size > 0 ? `<small class="text-muted d-block">${sanitizeHTML(this.formatFileSize(entry.size))}</small>` : ''}
          </div>
        </div>
      `).join('');
  }

  // === BACKUP AUTOMÁTICO ===
  startAutoBackup() {
    this.stopAutoBackup();
    
    if (!this.config.autoBackupEnabled || !this.config.botToken || !this.config.channelId) {
      return;
    }

    const intervalMs = this.config.backupInterval * 60 * 1000;
    this.autoBackupInterval = setInterval(() => {
      this.performFullBackup(true);
    }, intervalMs);

    console.log(`Backup automático iniciado cada ${this.config.backupInterval} minutos`);
  }

  stopAutoBackup() {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
    }
  }

  // === FUNCIONES DE BACKUP ===
  async testConnection() {
    if (!this.config.botToken) {
      Swal.fire({
        icon: 'error',
        title: 'Token requerido',
        text: 'Por favor, configura el token del bot primero.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/getMe`);
      const data = await response.json();

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Conexión exitosa',
          html: `
            <div class="text-start">
              <p><strong>Bot conectado:</strong> ${data.result.first_name}</p>
              <p><strong>Username:</strong> @${data.result.username}</p>
              <p><strong>ID:</strong> ${data.result.id}</p>
            </div>
          `,
          confirmButtonText: 'Aceptar'
        });
      } else {
        throw new Error(data.description || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error probando conexión:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: `No se pudo conectar con Telegram: ${error.message}`,
        confirmButtonText: 'Aceptar'
      });
    }
  }

  async backupToTelegram(dataType) {
    if (!this.config.botToken || !this.config.channelId) {
      Swal.fire({
        icon: 'error',
        title: 'Configuración incompleta',
        text: 'Por favor, configura el token del bot y el ID del canal primero.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      const data = this.getData(dataType);
      const fileName = `tillup_${dataType}_${new Date().toISOString().split('T')[0]}.json`;
      
      await this.sendBackupToTelegram(data, fileName, dataType);
      
      this.addToHistory(dataType, 'success', `Backup de ${this.getBackupTypeText(dataType)} enviado correctamente`, JSON.stringify(data).length);
      
      Swal.fire({
        icon: 'success',
        title: 'Backup enviado',
        text: `El backup de ${this.getBackupTypeText(dataType)} ha sido enviado a Telegram.`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error en backup:', error);
      this.addToHistory(dataType, 'error', `Error: ${error.message}`);
      
      Swal.fire({
        icon: 'error',
        title: 'Error en backup',
        text: `No se pudo enviar el backup: ${error.message}`,
        confirmButtonText: 'Aceptar'
      });
    }
  }

  async performFullBackup(isAutomatic = false) {
    if (!this.config.botToken || !this.config.channelId) {
      if (!isAutomatic) {
        Swal.fire({
          icon: 'error',
          title: 'Configuración incompleta',
          text: 'Por favor, configura el token del bot y el ID del canal primero.',
          confirmButtonText: 'Aceptar'
        });
      }
      return;
    }

    try {
      const allData = {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        data: {
          products: JSON.parse(localStorage.getItem('products') || '[]'),
          clients: JSON.parse(localStorage.getItem('clients') || '[]'),
          sales: JSON.parse(localStorage.getItem('sales') || '[]'),
          debts: JSON.parse(localStorage.getItem('debts') || '[]'),
          chickenSales: JSON.parse(localStorage.getItem('chickenSales') || '[]')
        }
      };

      const fileName = `tillup_backup_completo_${new Date().toISOString().split('T')[0]}.json`;
      
      await this.sendBackupToTelegram(allData, fileName, 'full');
      
      this.addToHistory('full', 'success', 
        isAutomatic ? 'Backup automático completo' : 'Backup manual completo', 
        JSON.stringify(allData).length
      );
      
      if (!isAutomatic) {
        Swal.fire({
          icon: 'success',
          title: 'Backup completo enviado',
          text: 'Todos los datos han sido respaldados en Telegram.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error en backup completo:', error);
      this.addToHistory('full', 'error', `Error: ${error.message}`);
      
      if (!isAutomatic) {
        Swal.fire({
          icon: 'error',
          title: 'Error en backup',
          text: `No se pudo enviar el backup completo: ${error.message}`,
          confirmButtonText: 'Aceptar'
        });
      }
    }
  }

  async sendBackupToTelegram(data, fileName, type) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const formData = new FormData();
    formData.append('chat_id', this.config.channelId);
    formData.append('document', blob, fileName);
    formData.append('caption', `📊 TillUp POS - ${this.getBackupTypeText(type)}\n📅 ${new Date().toLocaleString()}\n📦 Tamaño: ${this.formatFileSize(jsonString.length)}`);

    const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/sendDocument`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.description || 'Error enviando a Telegram');
    }

    return result;
  }

  // === RESTAURACIÓN ===
  async restoreFromFile() {
    const fileInput = document.getElementById('restoreFileInput');
    const file = fileInput?.files[0];
    
    if (!file) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo requerido',
        text: 'Por favor, selecciona un archivo de backup.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // Validar estructura del backup
      if (!this.validateBackupData(backupData)) {
        throw new Error('Formato de backup inválido');
      }

      // Confirmar restauración
      const result = await Swal.fire({
        icon: 'warning',
        title: '⚠️ Confirmar Restauración',
        html: `
          <div class="text-start">
            <p><strong>¿Estás seguro de que quieres restaurar este backup?</strong></p>
            <p>Esta acción:</p>
            <ul>
              <li>Reemplazará todos los datos actuales</li>
              <li>No se puede deshacer</li>
              <li>Se recomienda hacer un backup actual primero</li>
            </ul>
            ${backupData.timestamp ? `<p><small><strong>Fecha del backup:</strong> ${new Date(backupData.timestamp).toLocaleString()}</small></p>` : ''}
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, restaurar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
      });

      if (result.isConfirmed) {
        await this.performRestore(backupData);
      }
    } catch (error) {
      console.error('Error restaurando backup:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error en restauración',
        text: `No se pudo restaurar el backup: ${error.message}`,
        confirmButtonText: 'Aceptar'
      });
    }
  }

  async performRestore(backupData) {
    try {
      // Determinar si es backup completo o individual
      const data = backupData.data || backupData;
      
      // Restaurar cada tipo de dato
      if (data.products) {
        localStorage.setItem('products', JSON.stringify(data.products));
        if (window.setProducts) window.setProducts(data.products);
      }
      
      if (data.clients) {
        localStorage.setItem('clients', JSON.stringify(data.clients));
        if (window.setClients) window.setClients(data.clients);
      }
      
      if (data.sales) {
        localStorage.setItem('sales', JSON.stringify(data.sales));
        if (window.setSales) window.setSales(data.sales);
      }
      
      if (data.debts) {
        localStorage.setItem('debts', JSON.stringify(data.debts));
        if (window.setDebts) window.setDebts(data.debts);
      }
      
      if (data.chickenSales) {
        localStorage.setItem('chickenSales', JSON.stringify(data.chickenSales));
      }

      // Actualizar UI
      if (window.renderInventory) window.renderInventory();
      if (window.renderClients) window.renderClients();
      if (window.renderDebts) window.renderDebts();
      if (window.updateBalanceUI) window.updateBalanceUI();
      if (window.updateClientSelector) window.updateClientSelector();

      this.addToHistory('restore', 'success', 'Datos restaurados correctamente desde archivo');

      Swal.fire({
        icon: 'success',
        title: 'Restauración completada',
        text: 'Los datos han sido restaurados correctamente.',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        // Limpiar input de archivo
        const fileInput = document.getElementById('restoreFileInput');
        if (fileInput) {
          fileInput.value = '';
          const restoreBtn = document.getElementById('restoreBtn');
          if (restoreBtn) restoreBtn.disabled = true;
        }
      });
    } catch (error) {
      console.error('Error en restauración:', error);
      this.addToHistory('restore', 'error', `Error en restauración: ${error.message}`);
      throw error;
    }
  }

  // === UTILIDADES ===
  getData(type) {
    const dataMap = {
      'products': JSON.parse(localStorage.getItem('products') || '[]'),
      'clients': JSON.parse(localStorage.getItem('clients') || '[]'),
      'sales': JSON.parse(localStorage.getItem('sales') || '[]'),
      'debts': JSON.parse(localStorage.getItem('debts') || '[]'),
      'chickens': JSON.parse(localStorage.getItem('chickenSales') || '[]')
    };

    return {
      timestamp: new Date().toISOString(),
      type,
      data: dataMap[type] || []
    };
  }

  validateBackupData(data) {
    // Validar backup completo
    if (data.data && typeof data.data === 'object') {
      return true;
    }
    
    // Validar backup individual
    if (data.type && Array.isArray(data.data)) {
      return true;
    }
    
    // Validar formato legacy
    if (Array.isArray(data)) {
      return true;
    }

    return false;
  }

  getBackupIcon(type) {
    const icons = {
      'products': 'box-seam',
      'clients': 'people',
      'sales': 'cart-check',
      'debts': 'cash-stack',
      'chickens': 'egg-fried',
      'full': 'cloud-upload',
      'restore': 'cloud-download'
    };
    return icons[type] || 'file-earmark';
  }

  getBackupTypeText(type) {
    const texts = {
      'products': 'Inventario',
      'clients': 'Clientes',
      'sales': 'Ventas',
      'debts': 'Deudas',
      'chickens': 'Ventas de Pollos',
      'full': 'Backup Completo',
      'restore': 'Restauración'
    };
    return texts[type] || 'Datos';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// === FUNCIONES GLOBALES ===
let telegramBackup;

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  telegramBackup = new TelegramBackup();
});

// Funciones globales para usar desde HTML
window.backupToTelegram = (type) => {
  if (telegramBackup) {
    telegramBackup.backupToTelegram(type);
  }
};

window.performFullBackup = () => {
  if (telegramBackup) {
    telegramBackup.performFullBackup();
  }
};

window.restoreFromFile = () => {
  if (telegramBackup) {
    telegramBackup.restoreFromFile();
  }
};

console.log('📱 Sistema de Backup a Telegram cargado');