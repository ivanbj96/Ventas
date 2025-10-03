// ========================================
// ⚡ CONFIGURACIÓN RÁPIDA DE SINCRONIZACIÓN
// ========================================
// Configuración automática del sistema avanzado de sincronización

window.quickSyncSetup = function() {
    Swal.fire({
        title: '🚀 Configuración Avanzada de Sincronización',
        html: `
            <div style="text-align: left;">
                <div class="mb-3">
                    <label class="form-label"><strong>ID de Usuario</strong></label>
                    <input type="text" id="quickSyncUserId" class="form-control" 
                           placeholder="Ej: tienda_principal" required>
                    <small class="text-muted">Debe ser único y compartido entre dispositivos</small>
                </div>
                
                <div class="mb-3">
                    <label class="form-label"><strong>Perfil de Sincronización</strong></label>
                    <select id="quickSyncProfile" class="form-select">
                        <option value="realtime">⚡ Tiempo Real (Máximo rendimiento)</option>
                        <option value="balanced" selected>⚖️ Balanceado (Recomendado)</option>
                        <option value="conservative">🔋 Conservador (Ahorro de batería)</option>
                        <option value="custom">🎛️ Personalizado</option>
                    </select>
                </div>
                
                <div id="customSettings" style="display: none;">
                    <div class="row">
                        <div class="col-6">
                            <label class="form-label">Delay Instantáneo (ms)</label>
                            <input type="number" id="customInstantDelay" class="form-control" value="500">
                        </div>
                        <div class="col-6">
                            <label class="form-label">Intervalo Completo (min)</label>
                            <input type="number" id="customFullInterval" class="form-control" value="5">
                        </div>
                    </div>
                </div>
                
                <div class="mt-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="enableCompression" checked>
                        <label class="form-check-label">
                            🗜️ Habilitar compresión de datos
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="enablePriority" checked>
                        <label class="form-check-label">
                            🎯 Sincronización prioritaria (ventas primero)
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="enableDashboard">
                        <label class="form-check-label">
                            📊 Abrir dashboard después de configurar
                        </label>
                    </div>
                </div>
                
                <div class="alert alert-info mt-3">
                    <h6><i class="bi bi-info-circle"></i> Características del Sistema Avanzado:</h6>
                    <ul class="mb-0" style="font-size: 0.9rem;">
                        <li>✅ Detección automática de cambios en tiempo real</li>
                        <li>✅ Sincronización inteligente por prioridades</li>
                        <li>✅ Resolución automática de conflictos</li>
                        <li>✅ Cola offline para conexiones intermitentes</li>
                        <li>✅ Métricas y monitoreo en tiempo real</li>
                        <li>✅ Dashboard profesional de control</li>
                    </ul>
                </div>
            </div>
        `,
        width: 600,
        showCancelButton: true,
        confirmButtonText: '🚀 Configurar Sistema Avanzado',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const userId = document.getElementById('quickSyncUserId').value.trim();
            const profile = document.getElementById('quickSyncProfile').value;
            
            if (!userId) {
                Swal.showValidationMessage('El ID de usuario es requerido');
                return false;
            }
            
            return {
                userId,
                profile,
                compression: document.getElementById('enableCompression').checked,
                priority: document.getElementById('enablePriority').checked,
                dashboard: document.getElementById('enableDashboard').checked,
                customInstantDelay: document.getElementById('customInstantDelay')?.value,
                customFullInterval: document.getElementById('customFullInterval')?.value
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            setupAdvancedSync(result.value);
        }
    });
    
    // Mostrar/ocultar configuración personalizada
    document.getElementById('quickSyncProfile').addEventListener('change', function() {
        const customDiv = document.getElementById('customSettings');
        customDiv.style.display = this.value === 'custom' ? 'block' : 'none';
    });
};

function setupAdvancedSync(config) {
    const { userId, profile, compression, priority, dashboard } = config;
    
    // Configuraciones predefinidas
    const profiles = {
        realtime: {
            instantSyncDelay: 100,
            batchSyncDelay: 500,
            fullSyncInterval: 120000, // 2 min
            maxRetries: 5,
            compressionEnabled: compression,
            prioritySync: priority
        },
        balanced: {
            instantSyncDelay: 500,
            batchSyncDelay: 2000,
            fullSyncInterval: 300000, // 5 min
            maxRetries: 3,
            compressionEnabled: compression,
            prioritySync: priority
        },
        conservative: {
            instantSyncDelay: 2000,
            batchSyncDelay: 5000,
            fullSyncInterval: 600000, // 10 min
            maxRetries: 2,
            compressionEnabled: compression,
            prioritySync: priority
        },
        custom: {
            instantSyncDelay: parseInt(config.customInstantDelay) || 500,
            batchSyncDelay: 2000,
            fullSyncInterval: (parseInt(config.customFullInterval) || 5) * 60000,
            maxRetries: 3,
            compressionEnabled: compression,
            prioritySync: priority
        }
    };
    
    const syncConfig = profiles[profile];
    
    // Mostrar progreso
    Swal.fire({
        title: 'Configurando Sistema Avanzado...',
        html: `
            <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <div id="setupProgress">Inicializando...</div>
            </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false
    });
    
    // Configurar paso a paso
    setTimeout(() => {
        document.getElementById('setupProgress').textContent = 'Configurando usuario...';
        
        // Guardar usuario
        localStorage.setItem('tillup_sync_user', userId);
        
        setTimeout(() => {
            document.getElementById('setupProgress').textContent = 'Aplicando configuración...';
            
            // Configurar sistema avanzado
            if (window.advancedSyncSystem) {
                window.advancedSyncSystem.updateConfig(syncConfig);
                
                setTimeout(() => {
                    document.getElementById('setupProgress').textContent = 'Habilitando sincronización...';
                    
                    // Habilitar sistema
                    window.advancedSyncSystem.enable(userId);
                    
                    // También configurar sistema básico para compatibilidad
                    if (window.initTillUpSync) {
                        window.initTillUpSync(userId);
                    }
                    
                    setTimeout(() => {
                        // Configuración completada
                        Swal.fire({
                            icon: 'success',
                            title: '🎉 ¡Sistema Configurado!',
                            html: `
                                <div class="text-start">
                                    <p><strong>Usuario:</strong> <span id="userIdDisplay"></span></p>
                                    <p><strong>Perfil:</strong> <span id="profileDisplay"></span></p>
                                    <p><strong>Estado:</strong> <span class="text-success">✅ Activo</span></p>
                                    
                                    <div class="alert alert-success mt-3">
                                        <h6>🚀 El sistema está funcionando:</h6>
                                        <ul class="mb-0">
                                            <li>Detectando cambios automáticamente</li>
                                            <li>Sincronizando en tiempo real</li>
                                            <li>Monitoreando rendimiento</li>
                                        </ul>
                                    </div>
                                    
                                    <div class="alert alert-info">
                                        <strong>💡 Tip:</strong> Usa el Dashboard de Sincronización 
                                        para monitorear el rendimiento y ajustar configuraciones.
                                    </div>
                                </div>
                            `,
                            confirmButtonText: dashboard ? '📊 Abrir Dashboard' : 'Continuar',
                            showCancelButton: dashboard,
                            cancelButtonText: dashboard ? 'Continuar' : undefined
                        }).then((result) => {
                            // Set text content safely after modal is shown
                            const userIdEl = document.getElementById('userIdDisplay');
                            const profileEl = document.getElementById('profileDisplay');
                            if (userIdEl) userIdEl.textContent = userId;
                            if (profileEl) profileEl.textContent = getProfileName(profile);
                            
                            if (result.isConfirmed && dashboard) {
                                setTimeout(() => {
                                    if (typeof window.openSyncDashboard === 'function') {
                                        window.openSyncDashboard();
                                    }
                                }, 500);
                            }
                        });
                    }, 1000);
                }, 1000);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Sistema avanzado no disponible. Verifica que todos los archivos estén cargados.'
                });
            }
        }, 1000);
    }, 1000);
}

function getProfileName(profile) {
    const names = {
        realtime: '⚡ Tiempo Real',
        balanced: '⚖️ Balanceado',
        conservative: '🔋 Conservador',
        custom: '🎛️ Personalizado'
    };
    return names[profile] || profile;
}

// Auto-mostrar configuración si no hay usuario configurado
function checkAndShowSetupNotification() {
    const savedUser = localStorage.getItem('tillup_sync_user');
    if (!savedUser) {
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; border-radius: 10px; z-index: 9999; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2);';
        
        const content = document.createElement('div');
        content.style.cssText = 'display: flex; align-items: center; gap: 10px;';
        
        const icon = document.createElement('i');
        icon.className = 'bi bi-rocket-takeoff';
        icon.style.fontSize = '1.5rem';
        
        const textDiv = document.createElement('div');
        const title = document.createElement('div');
        title.style.fontWeight = 'bold';
        title.textContent = 'Sistema Avanzado Disponible';
        const subtitle = document.createElement('div');
        subtitle.style.cssText = 'font-size: 0.9rem; opacity: 0.9;';
        subtitle.textContent = 'Haz clic para configurar';
        
        textDiv.appendChild(title);
        textDiv.appendChild(subtitle);
        content.appendChild(icon);
        content.appendChild(textDiv);
        notification.appendChild(content);
        
        notification.onclick = () => {
            quickSyncSetup();
            notification.remove();
        };
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }
}

setTimeout(checkAndShowSetupNotification, 3000);

console.log('⚡ Quick Sync Setup loaded');