# TillUp POS - Sistema de Gestión de Ventas

## 📱 PWA Moderna para Gestión de Negocios

TillUp es una aplicación web progresiva (PWA) completa para la gestión integral de negocios, especializada en ventas, inventario, clientes, reportes financieros y ventas de pollos. Diseñada con tecnología moderna y optimizada para dispositivos móviles con experiencia nativa.

## ✨ Características Principales

### 🐔 Gestión Especializada de Pollos
- **Ventas por peso y cantidad**: Registro detallado con peso, precio por libra, cantidad
- **Configuración de precios**: Precio de venta y costo por libra configurable
- **Calculadora de merma**: Herramienta integrada para calcular merma de pollo en pluma vs pelado
- **Estadísticas en tiempo real**: Filtros por fecha, totales vendidos, peso promedio
- **Métodos de pago**: Efectivo, transferencia y crédito con sistema de abonos
- **Comprobantes especializados**: Tickets de venta con detalles específicos de pollos
- **Edición de ventas**: Modificación de ventas existentes con validaciones
- **Cálculo automático**: Actualización en tiempo real de totales y ganancias
- **Búsqueda de clientes**: Modal de búsqueda avanzada para selección rápida
- **Validaciones inteligentes**: Control de stock y precios en tiempo real

### 🛒 Sistema de Ventas Avanzado
- **Carrito tipo e-commerce**: Interfaz moderna estilo Temu con drawer lateral
- **Múltiples métodos de pago**: Efectivo, tarjeta, transferencia, crédito
- **Gestión de stock en tiempo real**: Control automático de inventario
- **Comprobantes digitales**: Tickets de venta profesionales con diseño Treinta.co
- **Botón flotante**: Acceso rápido al carrito desde cualquier vista
- **Descuentos**: Sistema de descuentos aplicables a ventas
- **Selector de cliente**: Búsqueda avanzada de clientes con modal

### 👥 Gestión de Clientes
- **Base de datos completa**: Nombre, teléfono, dirección, foto, geolocalización
- **Captura de ubicación**: Integración con GPS para ubicación automática
- **Historial de compras**: Seguimiento completo de transacciones por cliente
- **Sistema de deudas**: Control de créditos, abonos y saldos pendientes
- **Vistas flexibles**: Modo cuadrícula y lista intercambiables
- **Búsqueda modal**: Sistema de búsqueda avanzada con filtros
- **Proformas**: Guardado automático de carritos por cliente

### 📦 Inventario Inteligente
- **Gestión completa**: Nombre, precio, costo, categoría, stock, descripción
- **Imágenes de productos**: Subida y vista previa con fallback automático
- **Control de stock**: Validación automática y alertas de productos agotados
- **Categorización**: Organización por categorías personalizables
- **Vistas adaptables**: Cuadrícula y lista con persistencia de preferencias
- **Edición inline**: Modificación de productos existentes

### 📊 Dashboard y Reportes
- **Balance en tiempo real**: Ingresos, gastos, utilidades del período seleccionado
- **Filtros temporales**: Día, semana, mes, año con cálculos automáticos
- **Timeline de movimientos**: Historial visual de todas las transacciones
- **Estadísticas avanzadas**: Métricas detalladas con insights de negocio
- **Exportación PDF**: Reportes profesionales de ventas, balance, deudas y pollos
- **Gráficos interactivos**: Tendencias y distribución con Chart.js

### ☁️ Backup y Persistencia
- **Google Drive Integration**: Backup automático en la nube con OAuth2
- **Telegram Backup**: Sistema de backup vía Telegram Bot para máxima seguridad
- **Sistema híbrido**: localStorage + IndexedDB para máxima confiabilidad
- **Backup automático**: Guardado cada 5 minutos con detección de cambios
- **Validación de integridad**: Verificación automática y limpieza de datos corruptos
- **Recuperación automática**: Restauración en caso de pérdida de datos
- **Exportación/Importación**: Formato JSON completo para migración
- **Sincronización**: Sistema de sincronización entre dispositivos
- **Múltiples canales**: Backup redundante en Google Drive y Telegram

### 📱 Experiencia Móvil Nativa
- **PWA Completa**: Instalación como app nativa con manifest.json
- **Gestos táctiles**: Swipe, pull-to-refresh, feedback háptico
- **Modo offline**: Funcionamiento completo sin conexión con Service Worker
- **Shortcuts de app**: Accesos rápidos desde el launcher del dispositivo
- **Responsive design**: Adaptado completamente a móviles, tablets y desktop
- **Prevención de recarga**: Sistema anti-refresh accidental en móviles
- **Notificaciones**: Sistema de notificaciones nativas

### 🎨 Interfaz Moderna
- **Diseño tipo Treinta.co**: Interfaz profesional con gradientes y sombras
- **Tema claro optimizado**: Diseño limpio y profesional únicamente
- **Sidebar navegación**: Menú lateral deslizable con todas las funciones
- **Animaciones fluidas**: Transiciones CSS3 y feedback visual
- **Iconografía Bootstrap**: Iconos consistentes v1.10.5
- **Botón de acciones rápidas**: Menú flotante con acciones frecuentes
- **Navegación inferior**: Barra de navegación móvil optimizada
- **Modales de búsqueda**: Sistema de búsqueda avanzada con filtros
- **Responsive design**: Adaptación perfecta a todos los dispositivos

## 🏗️ Arquitectura Técnica

### Frontend
- **HTML5 + CSS3**: Estructura semántica y estilos modernos
- **JavaScript ES6+**: Código modular y orientado a objetos
- **Bootstrap 5.3**: Framework CSS responsive
- **Chart.js**: Gráficos interactivos y visualización de datos
- **SweetAlert2**: Modales y notificaciones elegantes

### Backend/Infraestructura
- **AWS API Gateway**: WebSocket API para tiempo real
- **AWS Lambda**: Funciones serverless (Python 3.11)
- **AWS DynamoDB**: Base de datos NoSQL para conexiones
- **AWS CloudFormation**: Infraestructura como código

### Persistencia
- **LocalStorage**: Almacenamiento rápido local
- **IndexedDB (LocalForage)**: Base de datos local robusta
- **Google Drive API**: Backup en la nube
- **Service Worker**: Cache inteligente y modo offline

### Generación de Reportes
- **jsPDF**: Generación de PDFs del lado cliente
- **jsPDF AutoTable**: Tablas profesionales en PDF
- **Plantillas personalizadas**: Diseño tipo Treinta.co

## 🗂️ Estructura del Proyecto

```
Ventas/
├── 📄 index.html              # Aplicación principal
├── 🎯 app.js                  # Lógica de la aplicación
├── 🔧 utils.js                # Utilidades y persistencia
├── 📊 pdf-generator.js        # Generación de reportes PDF
├── 🎨 style.css               # Estilos tipo Treinta.co
├── 📱 manifest.json           # Configuración PWA
├── ⚙️ sw.js                   # Service Worker
├── 🖼️ icons/                  # Iconos de la aplicación
│   ├── icon-192.png
│   ├── icon-512.png
│   └── descarga.png
├── 🔄 websocket-sync/         # Sistema de sincronización
│   ├── 📋 template.yaml       # CloudFormation template
│   ├── 🚀 deploy.bat          # Script de despliegue
│   ├── 🧪 test-connection.html # Test de WebSocket
│   ├── 🔗 tillup-sync.js      # Cliente WebSocket
│   └── 📁 lambda/             # Funciones Lambda
│       ├── connect.py
│       ├── disconnect.py
│       └── message.py
├── 📱 telegram-backup/        # Sistema de backup Telegram
│   ├── 🤖 telegram-bot.js     # Cliente Telegram Bot
│   └── 📋 bot-config.json     # Configuración del bot
├── 📖 README.md               # Documentación
├── 📋 CHANGELOG.md            # Historial de cambios
└── ⚖️ LICENSE                 # Licencia del proyecto
```

## 🚀 Instalación y Configuración

### Instalación Local
1. **Clonar repositorio**:
   ```bash
   git clone [repository-url]
   cd Ventas
   ```

2. **Servidor local**:
   ```bash
   # Con Python
   python -m http.server 8000
   
   # Con Node.js
   npx serve .
   
   # Con PHP
   php -S localhost:8000
   ```

3. **Acceder a la aplicación**:
   - Abrir `http://localhost:8000` en el navegador
   - Instalar como PWA desde el menú del navegador

### Configuración de Sincronización (Opcional)
1. **Desplegar infraestructura AWS**:
   ```bash
   cd websocket-sync
   ./deploy.bat
   ```

2. **Configurar Google Drive**:
   - Crear proyecto en Google Cloud Console
   - Habilitar Google Drive API
   - Configurar OAuth 2.0
   - Actualizar credenciales en la app

### Configuración Inicial
1. **Precios de pollos**: Configurar precio y costo por libra
2. **Productos**: Agregar inventario inicial
3. **Clientes**: Registrar base de clientes
4. **Backup**: Activar sincronización automática

## 🎯 Casos de Uso

### Para Pollería/Carnicería
- Venta de pollos por peso con cálculo automático
- Control de merma y costos reales
- Gestión de clientes frecuentes
- Reportes de ganancias diarias

### Para Tienda General
- Inventario de productos variados
- Sistema de ventas con carrito
- Control de stock automático
- Múltiples métodos de pago

### Para Negocio Multi-dispositivo
- Sincronización en tiempo real
- Trabajo colaborativo
- Backup automático en la nube
- Acceso desde cualquier dispositivo

## 📊 Reportes Disponibles

### Reporte de Balance
- Ingresos totales del período
- Gastos y costos
- Ganancia neta
- Desglose por método de pago

### Reporte de Ventas
- Lista detallada de todas las ventas
- Totales por cliente
- Análisis por producto
- Tendencias de venta

### Reporte de Pollos
- Pollos vendidos por período
- Peso total comercializado
- Ganancias por libra
- Estadísticas de merma

### Reporte de Deudas
- Clientes con saldo pendiente
- Historial de abonos
- Análisis de cartera
- Proyección de cobros

## 🔧 Tecnologías Utilizadas

### Frontend
- HTML5, CSS3, JavaScript ES6+
- Bootstrap 5.3.3
- Bootstrap Icons 1.10.5
- Chart.js 4.4.0
- SweetAlert2 11.x
- jsPDF 2.5.1 + AutoTable 3.5.28

### Backend/Cloud
- AWS API Gateway (WebSocket)
- AWS Lambda (Python 3.11)
- AWS DynamoDB
- AWS CloudFormation
- Google Drive API
- Google Identity Services

### PWA/Mobile
- Service Worker
- Web App Manifest
- LocalForage (IndexedDB)
- Geolocation API
- Vibration API
- Notification API

## 📱 Características PWA

### Instalación Nativa
- Instalable desde cualquier navegador
- Icono en el launcher del dispositivo
- Pantalla de splash personalizada
- Funcionamiento como app nativa

### Funcionalidades Offline
- Cache inteligente de recursos
- Funcionamiento sin internet
- Sincronización al reconectar
- Almacenamiento local robusto

### Integración del Sistema
- Shortcuts de aplicación
- Compartir contenido
- Manejo de archivos JSON
- Protocolo personalizado web+tillup

## 🔐 Seguridad y Privacidad

### Protección de Datos
- Almacenamiento local encriptado
- Backup automático seguro
- Validación de integridad
- Recuperación ante fallos

### Privacidad
- Sin recolección de datos personales
- Procesamiento local de información
- Backup opcional en Google Drive
- Control total del usuario

## 📄 Documentos Legales

- [Política de Privacidad](PRIVACY-POLICY.md)
- [Términos de Uso](TERMS-OF-USE.md)
- [Aviso Legal](LEGAL-NOTICE.md)
- [Política de Cookies](COOKIES-POLICY.md)

## 🛡️ Licencia

Este proyecto está protegido por una licencia personalizada restrictiva. **No se permite la clonación, redistribución ni uso comercial sin consentimiento expreso del autor.**

Si deseas usar, modificar o distribuir este software, debes contactar al autor y acordar un reconocimiento económico o licencia especial.

**Contacto para licencias y permisos:**
- ivqb96@gmail.com
- ivanbj-96@outlook.com

Ver el archivo `LICENSE` para más detalles.

## 🚀 Roadmap

### Próximas Funcionalidades
- [x] Sistema de backup vía Telegram
- [x] Calculadora de merma de pollos
- [x] Búsqueda avanzada de clientes
- [ ] Integración con impresoras térmicas
- [ ] Sistema de empleados y permisos
- [ ] Análisis predictivo de ventas
- [ ] Integración con bancos (API)
- [ ] App móvil nativa (React Native)
- [ ] Dashboard web administrativo
- [ ] Integración con WhatsApp Business
- [ ] Sistema de fidelización de clientes

### Mejoras Técnicas
- [ ] Optimización de rendimiento
- [ ] Pruebas automatizadas
- [ ] Documentación de API
- [ ] Monitoreo y analytics
- [ ] Escalabilidad horizontal
- [ ] Backup incremental

---

**TillUp POS** - Transformando la gestión de negocios con tecnología moderna y experiencia de usuario excepcional.

*Desarrollado con ❤️ para emprendedores y pequeños negocios.*

**Versión**: 1.5.0  
**Última actualización**: Enero 2025  
**Compatibilidad**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+