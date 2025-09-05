# 🔄 Guía de Implementación: Sincronización WebSocket en TillUp POS

## 📋 Resumen de la Funcionalidad

Esta guía te permitirá implementar sincronización en tiempo real entre múltiples dispositivos en TillUp POS. La funcionalidad incluye:

- ✅ Sincronización automática de datos entre dispositivos del mismo usuario
- ✅ Datos privados que solo se sincronizan entre dispositivos del mismo usuario  
- ✅ Datos públicos visibles para todos los usuarios conectados
- ✅ Carga automática de datos desde la nube al iniciar sesión
- ✅ Sistema robusto de reconexión automática
- ✅ Validación de seguridad para evitar acceso a datos de otros usuarios

## 🏗️ Arquitectura de la Implementación

### Componentes Necesarios:
1. **Cliente WebSocket** (`websocket-sync-client.js`) ✅ Ya existe
2. **Gestor de Sincronización** (`sync-manager.js`) ✅ Ya existe  
3. **AWS Lambda Functions** (3 funciones) ✅ Ya existen
4. **AWS API Gateway WebSocket** ⚠️ Requiere configuración
5. **Modificaciones en la aplicación principal** ⚠️ Requiere implementación

---

## 📁 PASO 1: Verificar Archivos Base

### ✅ Archivos ya creados:
- `websocket-sync-client.js` - Cliente WebSocket
- `sync-manager.js` - Gestor de sincronización  
- `aws-lambda/lambda_function.py` - Función principal
- `aws-lambda/index.py` - Handler de conexión
- `aws-lambda/disconnect.py` - Handler de desconexión

### ✅ Scripts ya agregados al HTML:
```html
<!-- Cliente WebSocket para sincronización -->
<script src="websocket-sync-client.js"></script>
<!-- Gestor de sincronización -->
<script src="sync-manager.js"></script>
```

---

## ⚙️ PASO 2: Configurar AWS Infrastructure

### 2.1 Crear Tablas DynamoDB

**Ejecutar en AWS CLI:**

```bash
# Tabla 1: Conexiones WebSocket
aws dynamodb create-table \
    --table-name TillUpConnections \
    --attribute-definitions \
        AttributeName=connectionId,AttributeType=S \
    --key-schema \
        AttributeName=connectionId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --time-to-live-specification \
        AttributeName=ttl,Enabled=true

# Tabla 2: Datos de Usuario
aws dynamodb create-table \
    --table-name TillUpUserData \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```

### 2.2 Crear Funciones Lambda

**Función 1: Connect Handler**
- Nombre: `TillUpWebSocketConnect`
- Runtime: Python 3.12
- Handler: `index.handler`
- Código: Subir `aws-lambda/index.py`

**Función 2: Disconnect Handler**  
- Nombre: `TillUpWebSocketDisconnect`
- Runtime: Python 3.12
- Handler: `disconnect.lambda_handler`
- Código: Subir `aws-lambda/disconnect.py`

**Función 3: Message Handler**
- Nombre: `TillUpWebSocketMessage`
- Runtime: Python 3.12  
- Handler: `lambda_function.lambda_handler`
- Código: Subir `aws-lambda/lambda_function.py`

### 2.3 Configurar Permisos IAM

**Crear rol IAM con estas políticas:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:DeleteItem",
                "dynamodb:Scan",
                "dynamodb:Query"
            ],
            "Resource": [
                "arn:aws:dynamodb:*:*:table/TillUpConnections",
                "arn:aws:dynamodb:*:*:table/TillUpUserData"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "execute-api:ManageConnections"
            ],
            "Resource": "arn:aws:execute-api:*:*:*"
        }
    ]
}
```

### 2.4 Configurar API Gateway WebSocket

1. **Crear API WebSocket**
   - Nombre: `TillUpWebSocketAPI`
   - Protocolo: WebSocket

2. **Configurar Rutas**
   - `$connect` → `TillUpWebSocketConnect`
   - `$disconnect` → `TillUpWebSocketDisconnect`  
   - `$default` → `TillUpWebSocketMessage`

3. **Desplegar API**
   - Stage: `prod`
   - **Obtener URL:** `wss://[api-id].execute-api.[region].amazonaws.com/prod`

4. **⚠️ IMPORTANTE: Actualizar URL en el código**
   
   Editar `websocket-sync-client.js` línea 15:
   ```javascript
   this.baseUrl = 'wss://TU-API-ID.execute-api.us-east-1.amazonaws.com/prod';
   ```

---

## 🔧 PASO 3: Modificar Aplicación Principal

### 3.1 Agregar Sistema de Usuarios

**Agregar al final de `app.js`:**

```javascript
// ========================================
// 👤 SISTEMA DE USUARIOS PARA SINCRONIZACIÓN
// ========================================

let currentSyncUser = null;

// Configurar usuario para sincronización
function setupSyncUser() {
    Swal.fire({
        title: 'Configurar Sincronización',
        html: `
            <div class="mb-3">
                <label class="form-label">ID de Usuario (único)</label>
                <input type="text" id="syncUserId" class="form-control" 
                       placeholder="Ej: tienda_principal, usuario123" required>
                <div class="form-text">Este ID debe ser único y compartido entre tus dispositivos</div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Configurar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const userId = document.getElementById('syncUserId').value.trim();
            if (!userId) {
                Swal.showValidationMessage('El ID de usuario es requerido');
                return false;
            }
            return userId;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            currentSyncUser = result.value;
            localStorage.setItem('tillup_sync_user', currentSyncUser);
            
            // Inicializar sincronización
            if (typeof initTillUpSync === 'function') {
                initTillUpSync(currentSyncUser);
            }
            
            Swal.fire({
                icon: 'success',
                title: '¡Sincronización Configurada!',
                text: `Usuario: ${currentSyncUser}`,
                timer: 2000
            });
        }
    });
}

// Cargar usuario guardado al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('tillup_sync_user');
    if (savedUser) {
        currentSyncUser = savedUser;
        // Inicializar sincronización automáticamente
        setTimeout(() => {
            if (typeof initTillUpSync === 'function') {
                initTillUpSync(currentSyncUser);
            }
        }, 2000);
    }
});

// Función para mostrar estado de sincronización
function showSyncStatus() {
    if (!currentSyncUser) {
        Swal.fire({
            title: 'Sincronización no configurada',
            text: '¿Deseas configurar la sincronización ahora?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Configurar',
            cancelButtonText: 'Más tarde'
        }).then((result) => {
            if (result.isConfirmed) {
                setupSyncUser();
            }
        });
        return;
    }
    
    const status = tillupSync ? tillupSync.getStatus() : { enabled: false, connected: false };
    
    Swal.fire({
        title: 'Estado de Sincronización',
        html: `
            <div class="text-start">
                <p><strong>Usuario:</strong> ${currentSyncUser}</p>
                <p><strong>Estado:</strong> ${status.enabled ? '🟢 Habilitada' : '🔴 Deshabilitada'}</p>
                <p><strong>Conexión:</strong> ${status.connected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
                <p><strong>Última sync:</strong> ${status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Nunca'}</p>
            </div>
        `,
        icon: status.enabled && status.connected ? 'success' : 'warning',
        showCancelButton: true,
        confirmButtonText: 'Reconfigurar',
        cancelButtonText: 'Cerrar'
    }).then((result) => {
        if (result.isConfirmed) {
            setupSyncUser();
        }
    });
}
```

### 3.2 Integrar Sincronización en Funciones Existentes

**Modificar función `addProduct` en `app.js`:**

```javascript
// Buscar la función addProduct y agregar después de saveToStorage:

await saveToStorage('products', products);

// AGREGAR ESTA LÍNEA:
if (tillupSync && tillupSync.isEnabled) {
    tillupSync.syncProduct(newProduct);
}

renderInventory();
renderSalesProducts();
```

**Modificar función `addClient` en `app.js`:**

```javascript
// Buscar la función addClient y agregar después de saveToStorage:

await saveToStorage('clients', clients);

// AGREGAR ESTA LÍNEA:
if (tillupSync && tillupSync.isEnabled) {
    tillupSync.syncClient(newClient);
}

renderClients();
updateClientSelector();
```

**Modificar función `finalizeSale` en `app.js`:**

```javascript
// Buscar la función finalizeSale y agregar después de sales.push(sale):

sales.push(sale);

// AGREGAR ESTA LÍNEA:
if (tillupSync && tillupSync.isEnabled) {
    tillupSync.syncSale(sale);
}

try {
    await saveToStorage('sales', sales);
   } // ... resto del código
```

### 3.3 Agregar Botones de Sincronización al Sidebar

**Agregar en el sidebar después de la sección de configuración:**

```html
<div class="sidebar-section">
    <h6 class="sidebar-section-title">
        <i class="bi bi-arrow-repeat"></i> Sincronización
    </h6>
    <div class="sidebar-actions">
        <button class="sidebar-action-btn" onclick="setupSyncUser()" id="btn-setup-sync">
            <i class="bi bi-person-gear"></i>
            <span>Configurar Usuario</span>
        </button>
        <button class="sidebar-action-btn" onclick="showSyncStatus()" id="btn-sync-status">
            <i class="bi bi-wifi"></i>
            <span>Estado Conexión</span>
        </button>
        <button class="sidebar-action-btn" onclick="testBidirectionalSync()" id="btn-test-sync">
            <i class="bi bi-arrow-left-right"></i>
            <span>Probar Sync</span>
        </button>
    </div>
</div>
```

---

## 🧪 PASO 4: Probar la Implementación

### 4.1 Configuración Inicial

1. **Abrir la aplicación en el navegador**
2. **Ir al sidebar → Configurar Usuario**
3. **Ingresar un ID único** (ej: `tienda_principal`)
4. **Verificar conexión** en sidebar → Estado Conexión

### 4.2 Pruebas de Sincronización

1. **Abrir la app en dos pestañas/dispositivos**
2. **Configurar el mismo usuario en ambos**
3. **Agregar un producto en una pestaña**
4. **Verificar que aparece en la otra pestaña**

### 4.3 Pruebas Avanzadas

1. **Abrir `test-sync.html` en el navegador**
2. **Configurar el mismo usuario**
3. **Probar campos públicos y privados**
4. **Verificar sincronización en tiempo real**

---

## 🔧 PASO 5: Configuración de Producción

### 5.1 Variables de Entorno

**Crear archivo `.env` (no subir a Git):**
```
WEBSOCKET_URL=wss://tu-api-id.execute-api.us-east-1.amazonaws.com/prod
AWS_REGION=us-east-1
DYNAMODB_CONNECTIONS_TABLE=TillUpConnections
DYNAMODB_USERDATA_TABLE=TillUpUserData
```

### 5.2 Configuración de Dominio Personalizado

1. **En API Gateway → Custom Domain Names**
2. **Crear dominio:** `sync.tu-dominio.com`
3. **Configurar certificado SSL**
4. **Actualizar URL en el código**

### 5.3 Monitoreo y Logs

1. **CloudWatch Logs** para las funciones Lambda
2. **CloudWatch Metrics** para conexiones WebSocket
3. **Alertas** para errores de conexión

---

## 🚨 PASO 6: Consideraciones de Seguridad

### 6.1 Validación de Usuario

- ✅ **Implementado:** Validación de `userId` en todas las operaciones
- ✅ **Implementado:** Aislamiento de datos por usuario
- ✅ **Implementado:** Validación de token de acceso

### 6.2 Límites de Conexión

**Agregar en Lambda:**
```python
# Limitar conexiones por usuario
MAX_CONNECTIONS_PER_USER = 5

def validate_connection_limit(user_id):
    connections = get_user_connections(user_id)
    if len(connections) >= MAX_CONNECTIONS_PER_USER:
        raise Exception("Límite de conexiones excedido")
```

### 6.3 Rate Limiting

**Implementar en API Gateway:**
- Límite: 100 mensajes por minuto por conexión
- Burst: 20 mensajes por segundo

---

## 📊 PASO 7: Métricas y Monitoreo

### 7.1 Métricas Clave

- **Conexiones activas**
- **Mensajes por segundo**
- **Errores de sincronización**
- **Latencia promedio**

### 7.2 Dashboard de Monitoreo

**Crear dashboard en CloudWatch con:**
- Gráfico de conexiones WebSocket
- Errores de Lambda por función
- Latencia de DynamoDB
- Uso de API Gateway

---

## 🔄 PASO 8: Mantenimiento y Actualizaciones

### 8.1 Backup de Configuración

**Exportar configuración de API Gateway:**
```bash
aws apigatewayv2 export-api \
    --api-id tu-api-id \
    --output-type JSON \
    --specification OAS30 \
    --export-version "1.0" \
    backup-websocket-api.json
```

### 8.2 Versionado de Funciones Lambda

- Usar **versiones** para cambios importantes
- Implementar **aliases** para staging/production
- **Rollback** automático en caso de errores

### 8.3 Pruebas Automatizadas

**Crear script de pruebas:**
```javascript
// test-websocket-integration.js
async function testWebSocketIntegration() {
    // Conectar múltiples clientes
    // Enviar mensajes de prueba
    // Verificar sincronización
    // Reportar resultados
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### AWS Infrastructure
- [ ] Tablas DynamoDB creadas
- [ ] Funciones Lambda desplegadas
- [ ] API Gateway WebSocket configurado
- [ ] Permisos IAM configurados
- [ ] URL actualizada en el código

### Código de la Aplicación
- [ ] Scripts agregados al HTML
- [ ] Sistema de usuarios implementado
- [ ] Funciones de sincronización integradas
- [ ] Botones de sincronización agregados
- [ ] Manejo de errores implementado

### Pruebas
- [ ] Conexión WebSocket funcional
- [ ] Sincronización entre dispositivos
- [ ] Aislamiento de datos por usuario
- [ ] Reconexión automática
- [ ] Manejo de errores

### Producción
- [ ] Variables de entorno configuradas
- [ ] Dominio personalizado (opcional)
- [ ] Monitoreo configurado
- [ ] Límites de seguridad implementados
- [ ] Documentación actualizada

---

## 🆘 Solución de Problemas Comunes

### Error: "Connection failed"
- Verificar URL de WebSocket
- Comprobar permisos de API Gateway
- Revisar logs de CloudWatch

### Error: "Access denied"
- Verificar configuración de CORS
- Comprobar permisos de DynamoDB
- Revisar validación de token

### Sincronización lenta
- Optimizar consultas DynamoDB
- Implementar cache en Lambda
- Reducir tamaño de mensajes

### Desconexiones frecuentes
- Implementar heartbeat/ping
- Ajustar timeout de conexión
- Mejorar manejo de reconexión

---

## 📞 Soporte y Contacto

Para soporte técnico o consultas sobre la implementación:

- **Email:** ivqb96@gmail.com
- **Backup:** ivanbj-96@outlook.com
- **Documentación:** Ver `README.md` del proyecto

---

**¡Implementación completada!** 🎉

Tu aplicación TillUp POS ahora cuenta con sincronización en tiempo real entre múltiples dispositivos, manteniendo la seguridad y privacidad de los datos de cada usuario.