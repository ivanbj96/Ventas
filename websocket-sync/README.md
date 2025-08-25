# TillUp WebSocket Real-Time Sync

Sistema de sincronización en tiempo real para TillUp POS, similar a WhatsApp pero sin cifrado de extremo a extremo.

## 🚀 Características

### ⚡ Sincronización Instantánea
- **Tiempo real**: Cambios se propagan inmediatamente entre dispositivos
- **Multi-dispositivo**: Soporte para múltiples dispositivos del mismo usuario
- **Reconexión automática**: Reconexión inteligente con backoff exponencial
- **Cola de mensajes**: Los mensajes se guardan si no hay conexión

### 🔄 Tipos de Sincronización
- **Datos completos**: Productos, clientes, ventas, deudas, pollos
- **Acciones específicas**: Agregar producto, nueva venta, pago de deuda
- **Configuraciones**: Precios, temas, preferencias de vista

### 🏗️ Arquitectura
- **AWS API Gateway**: WebSocket API serverless
- **AWS Lambda**: Funciones Python 3.11 para manejo de mensajes
- **AWS DynamoDB**: Base de datos NoSQL para conexiones activas
- **Cliente JavaScript**: Integración transparente con TillUp

## 📁 Estructura de Archivos

```
websocket-sync/
├── 📋 template.yaml              # CloudFormation template
├── 🚀 deploy.bat                 # Script de despliegue automático
├── ⚙️ config.js                  # Configuración del sistema
├── 🔗 tillup-realtime-sync.js    # Cliente WebSocket principal
├── 🧪 test-sync.html             # Página de pruebas
├── 📁 lambda/                    # Funciones Lambda
│   ├── connect.py                # Manejo de conexiones
│   ├── disconnect.py             # Manejo de desconexiones
│   └── message.py                # Procesamiento de mensajes
└── 📖 README.md                  # Esta documentación
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- AWS CLI configurado con credenciales válidas
- PowerShell (para Windows)
- Permisos para crear recursos en AWS

### Despliegue Automático

1. **Ejecutar script de despliegue**:
   ```bash
   cd websocket-sync
   ./deploy.bat
   ```

2. **El script automáticamente**:
   - Elimina stack anterior si existe
   - Empaqueta funciones Lambda
   - Crea infraestructura en AWS
   - Actualiza archivos de configuración
   - Proporciona endpoint WebSocket

### Configuración Manual

Si prefieres configurar manualmente:

1. **Desplegar CloudFormation**:
   ```bash
   aws cloudformation create-stack \
     --stack-name tillup-websocket-realtime \
     --template-body file://template.yaml \
     --capabilities CAPABILITY_IAM \
     --region us-east-1
   ```

2. **Actualizar endpoint en archivos**:
   - `config.js`: Actualizar `WEBSOCKET_URL`
   - `tillup-realtime-sync.js`: Actualizar `wsUrl`

## 🧪 Pruebas

### Test de Conexión Básico
1. Abrir `test-sync.html` en el navegador
2. Hacer clic en "Conectar"
3. Probar envío de datos y acciones
4. Verificar logs de sincronización

### Test Multi-Dispositivo
1. Abrir `test-sync.html` en múltiples pestañas/dispositivos
2. Enviar datos desde un dispositivo
3. Verificar que se reciben en otros dispositivos
4. Comprobar métricas de conexión

## 📡 Protocolo de Mensajes

### Tipos de Mensajes

#### 1. Sincronización de Datos
```javascript
{
  type: 'data_sync',
  payload: {
    dataType: 'products',
    data: [...],
    operation: 'update',
    sourceDeviceId: 'device_123',
    timestamp: 1640995200000
  }
}
```

#### 2. Sincronización de Acciones
```javascript
{
  type: 'action_sync',
  payload: {
    action: 'product_added',
    data: { productId: 123, productName: 'Test' },
    sourceDeviceId: 'device_123',
    timestamp: 1640995200000
  }
}
```

#### 3. Solicitud de Sincronización
```javascript
{
  type: 'request_sync',
  payload: {
    requesterId: 'device_123',
    timestamp: 1640995200000
  }
}
```

### Flujo de Sincronización

1. **Dispositivo A** realiza una acción (ej: agregar producto)
2. **Cliente JS** intercepta la acción automáticamente
3. **Mensaje** se envía al WebSocket API Gateway
4. **Lambda** procesa el mensaje y lo retransmite
5. **Dispositivo B** recibe el mensaje y actualiza datos
6. **UI** se actualiza automáticamente en Dispositivo B

## 🔧 Configuración Avanzada

### Variables de Configuración

En `config.js`:

```javascript
const TILLUP_SYNC_CONFIG = {
    WEBSOCKET_URL: 'wss://your-api-id.execute-api.us-east-1.amazonaws.com/prod',
    MAX_RECONNECT_ATTEMPTS: 10,
    RECONNECT_DELAY_BASE: 1000,
    SYNC_DEBOUNCE: 500,
    CRITICAL_DATA: ['products', 'clients', 'sales', 'debts'],
    // ... más configuraciones
};
```

### Personalización de Datos

Para agregar nuevos tipos de datos a sincronizar:

1. Agregar a `CRITICAL_DATA` en `config.js`
2. Actualizar interceptores en `tillup-realtime-sync.js`
3. Agregar manejo en funciones Lambda si es necesario

## 🐛 Troubleshooting

### Problemas Comunes

#### No se conecta al WebSocket
- Verificar que el endpoint esté correcto
- Comprobar que el stack de CloudFormation se desplegó correctamente
- Revisar permisos de AWS

#### Mensajes no se sincronizan
- Verificar que `userId` sea el mismo en ambos dispositivos
- Comprobar que los datos estén en `CRITICAL_DATA`
- Revisar logs en CloudWatch

#### Reconexiones frecuentes
- Verificar estabilidad de la conexión a internet
- Ajustar `RECONNECT_DELAY_BASE` si es necesario
- Comprobar límites de AWS API Gateway

### Logs y Monitoreo

#### CloudWatch Logs
- `/aws/lambda/tillup-connect`
- `/aws/lambda/tillup-disconnect`
- `/aws/lambda/tillup-message`

#### Métricas de API Gateway
- Conexiones activas
- Mensajes enviados/recibidos
- Errores de conexión

## 🔒 Seguridad

### Consideraciones de Seguridad
- Los mensajes NO están cifrados de extremo a extremo
- Usar HTTPS/WSS para cifrado en tránsito
- Validar datos en el cliente antes de sincronizar
- Implementar rate limiting si es necesario

### Mejores Prácticas
- No enviar información sensible sin cifrar
- Validar origen de los mensajes
- Implementar timeouts apropiados
- Monitorear uso de recursos AWS

## 📊 Monitoreo y Métricas

### Métricas Disponibles
- Dispositivos conectados por usuario
- Mensajes enviados/recibidos por minuto
- Tiempo de latencia de sincronización
- Errores de conexión y reconexiones

### Alertas Recomendadas
- Muchas reconexiones (posible problema de red)
- Alto número de errores en Lambda
- Uso excesivo de DynamoDB
- Latencia alta en API Gateway

## 🚀 Roadmap

### Próximas Funcionalidades
- [ ] Cifrado de extremo a extremo opcional
- [ ] Sincronización selectiva por tipo de dato
- [ ] Compresión de mensajes grandes
- [ ] Heartbeat automático
- [ ] Métricas en tiempo real en la UI
- [ ] Soporte para grupos de usuarios
- [ ] Backup automático de mensajes
- [ ] API REST complementaria

### Mejoras Técnicas
- [ ] Optimización de reconexión
- [ ] Cache inteligente de mensajes
- [ ] Batching de mensajes pequeños
- [ ] Pruebas automatizadas
- [ ] Documentación de API
- [ ] SDK para otros frameworks

## 📞 Soporte

Para problemas o preguntas:
- Revisar logs en `test-sync.html`
- Comprobar CloudWatch Logs
- Verificar configuración en `config.js`
- Contactar al desarrollador si persisten los problemas

---

**TillUp WebSocket Sync** - Sincronización en tiempo real para el futuro del POS.

*Desarrollado con ❤️ para una experiencia multi-dispositivo perfecta.*