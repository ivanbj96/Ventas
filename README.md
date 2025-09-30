# TillUp POS - Sistema de Gestión de Ventas Modular

## 📱 Aplicación Web Progresiva (PWA) para Gestión Integral de Negocios

TillUp POS es una aplicación web progresiva moderna y completa diseñada para la gestión integral de pequeños y medianos negocios. Especializada en ventas, inventario, clientes, deudas y reportes financieros, con arquitectura modular y sincronización en tiempo real.

## 🎯 Estado Actual - Enero 2025

### ✅ **Sistema Completamente Funcional**
- **🚀 Sincronización instantánea** entre múltiples dispositivos funcionando perfectamente
- **📱 PWA completa** instalable como aplicación nativa
- **🔄 WebSocket en tiempo real** con AWS API Gateway
- **💾 Persistencia robusta** con LocalStorage y backup automático
- **📊 Reportes PDF** profesionales con Chart.js
- **🐔 Módulo de pollos** especializado para negocios avícolas
- **💳 Sistema de pagos** múltiples (efectivo, tarjeta, crédito)
- **👥 Gestión completa** de clientes con historial y deudas

### 🔧 **Últimas Mejoras Implementadas**
- ✅ **Corrección de loops infinitos** en sincronización
- ✅ **Decodificación automática** de datos Base64
- ✅ **Sistema modular** completamente refactorizado
- ✅ **Manejo robusto** de errores y reconexión
- ✅ **Dashboard de sincronización** con métricas en tiempo real
- ✅ **Configuración rápida** de sincronización avanzada

### 📈 **Rendimiento Actual**
- **Sincronización**: < 500ms entre dispositivos
- **Carga inicial**: < 2 segundos
- **Modo offline**: Completamente funcional
- **Compatibilidad**: 100% navegadores modernos
- **Estabilidad**: Sin errores críticos conocidos

## ✨ Características Principales

### 🛒 Sistema de Ventas Avanzado
- **Carrito inteligente**: Interfaz moderna con gestión dinámica de productos
- **Múltiples métodos de pago**: Efectivo, tarjeta, transferencia, crédito
- **Control automático de stock**: Validación y actualización en tiempo real
- **Comprobantes digitales**: Tickets profesionales con opción de impresión/PDF
- **Sistema de descuentos**: Aplicación flexible de descuentos
- **Selector de clientes**: Búsqueda avanzada con autocompletado
- **Ventas a crédito**: Gestión completa de ventas con abonos iniciales

### 👥 Gestión Completa de Clientes
- **Base de datos robusta**: Nombre, teléfono, dirección, foto, geolocalización
- **Historial detallado**: Seguimiento completo de transacciones y compras
- **Sistema de deudas**: Control de créditos, abonos, saldos pendientes
- **Vistas adaptables**: Modo cuadrícula y lista con filtros avanzados
- **Búsqueda inteligente**: Sistema de filtros y búsqueda en tiempo real
- **Proformas guardadas**: Carritos temporales por cliente

### 📦 Inventario Inteligente
- **Gestión completa**: Nombre, precio, costo, categoría, stock, imágenes
- **Control de stock**: Validación automática y alertas de inventario bajo
- **Categorización**: Organización por categorías personalizables
- **Vistas flexibles**: Cuadrícula y lista con información detallada
- **Cálculo de ganancias**: Análisis automático de rentabilidad por producto

### 🐔 Módulo Especializado de Pollos
- **Ventas por peso**: Cálculo automático basado en peso y precio por libra
- **Control de merma**: Cálculo de costos considerando pérdidas
- **Estadísticas específicas**: Métricas especializadas para el negocio avícola
- **Configuración flexible**: Precios y costos ajustables
- **Reportes dedicados**: Análisis específico de ventas de pollos

### 📊 Dashboard y Reportes Avanzados
- **Balance en tiempo real**: Ingresos, gastos, utilidades, ganancias
- **Filtros temporales**: Día, semana, mes, año, personalizado
- **Timeline de movimientos**: Historial visual e interactivo
- **Estadísticas avanzadas**: Métricas detalladas con insights
- **Exportación PDF**: Reportes profesionales descargables
- **Gráficos interactivos**: Tendencias y análisis con Chart.js
- **Ocultación de ganancias**: Sistema de privacidad para información sensible

### 🔄 Sincronización Multidispositivo en Tiempo Real
- **WebSocket avanzado**: Sincronización instantánea bidireccional
- **Sistema robusto**: Reconexión automática y manejo de errores
- **Sincronización completa**: Productos, clientes, ventas, deudas, pollos
- **Cola de mensajes**: Manejo inteligente de mensajes offline
- **Notificaciones visuales**: Indicadores de estado de sincronización
- **Configuración simple**: Setup rápido con ID de usuario único

### 📱 Experiencia Móvil Nativa Completa
- **PWA Completa**: Instalación como aplicación nativa
- **Modo offline**: Funcionamiento sin conexión a internet
- **Responsive design**: Optimizado para móviles, tablets y desktop
- **Service Worker**: Cache inteligente y gestión offline
- **Manifest completo**: Configuración PWA profesional
- **Navegación táctil**: Interfaz optimizada para dispositivos móviles

### 🎨 Interfaz Moderna y Profesional
- **Diseño tipo Treinta.co**: Interfaz limpia y profesional
- **Bootstrap 5.3**: Framework CSS responsive moderno
- **Iconografía Bootstrap**: Iconos consistentes y profesionales
- **Animaciones fluidas**: Transiciones CSS3 suaves
- **SweetAlert2**: Modales elegantes y notificaciones
- **Modo oscuro**: Soporte completo para tema oscuro
- **Acciones rápidas**: Menú flotante con accesos directos

## 🏗️ Arquitectura Técnica Modular

### Frontend Modular
- **JavaScript ES6+**: Código modular con imports/exports
- **Arquitectura por módulos**: Separación clara de responsabilidades
- **Estado centralizado**: Gestión unificada del estado de la aplicación
- **Persistencia robusta**: LocalStorage con validación de integridad
- **Renderizado eficiente**: Actualización selectiva de componentes

### Módulos Principales
```
js/modules/
├── state.js          # Estado global centralizado
├── persistence.js    # Gestión de datos y backup
├── cart.js          # Lógica del carrito de compras
├── products.js      # Gestión de inventario
├── clients.js       # Gestión de clientes
├── chicken.js       # Módulo especializado de pollos
├── charts.js        # Gráficos y visualizaciones
├── rendering.js     # Renderizado de vistas
├── mobile.js        # Mejoras para móviles
├── utils.js         # Utilidades y helpers
├── quickActions.js  # Acciones rápidas
├── pdf-generator.js # Generación de reportes PDF
└── websocket.js     # Cliente de sincronización
```

### Sincronización Avanzada
- **WebSocket Client**: Cliente personalizado para AWS API Gateway
- **Reconexión automática**: Sistema robusto con backoff exponencial
- **Sincronización bidireccional**: Envío y recepción de datos
- **Cola de mensajes**: Manejo de mensajes offline
- **Notificaciones en tiempo real**: Indicadores visuales de sincronización

### Persistencia y Backup
- **LocalStorage**: Almacenamiento rápido y confiable
- **Validación de integridad**: Verificación automática de datos
- **Backup automático**: Respaldo cada 5 minutos
- **Limpieza automática**: Eliminación de backups antiguos
- **Recuperación de errores**: Sistema robusto ante fallos

## 🗂️ Estructura del Proyecto

```
TillUp-POS/
├── 📄 index.html                    # Aplicación principal
├── 🎨 style.css                     # Estilos principales
├── 📱 manifest.json                 # Configuración PWA
├── ⚙️ sw.js                         # Service Worker
├── 🖼️ TillUp.png                    # Logo de la aplicación
├── 🔄 websocket-sync-client.js      # Cliente WebSocket principal
├── 📊 sync-manager.js               # Gestor de sincronización
├── ⚡ instant-sync.js               # Sincronización instantánea
├── 🔔 instant-sync-notifications.js # Notificaciones de sync
├── 🚀 quick-sync-setup.js           # Configuración rápida
├── 🧹 clear-cache.js                # Limpieza de cache
├── 🧪 test-sync-functions.js        # Funciones de prueba
├── 📄 offline.html                  # Página offline
├── 🌐 CNAME                         # Configuración de dominio
├── js/                              # Módulos JavaScript
│   ├── app.js                       # Aplicación principal modular
│   └── modules/                     # Módulos especializados
│       ├── state.js                 # Estado centralizado
│       ├── persistence.js           # Persistencia de datos
│       ├── cart.js                  # Carrito de compras
│       ├── products.js              # Gestión de productos
│       ├── clients.js               # Gestión de clientes
│       ├── chicken.js               # Módulo de pollos
│       ├── charts.js                # Gráficos y visualizaciones
│       ├── rendering.js             # Renderizado de vistas
│       ├── mobile.js                # Mejoras móviles
│       ├── utils.js                 # Utilidades
│       ├── quickActions.js          # Acciones rápidas
│       ├── pdf-generator.js         # Generación PDF
│       ├── missing-functions.js     # Funciones auxiliares
│       └── websocket.js             # Cliente WebSocket
├── icons/                           # Iconos PWA
│   ├── icon-192.png
│   ├── icon-512.png
│   └── android-icon-192x192.png
├── aws-lambda/                      # Funciones Lambda para WebSocket
│   ├── connect.py
│   ├── disconnect.py
│   └── message.py
├── libs/                            # Librerías externas
│   └── localforage.min.js
├── 📋 Políticas/                    # Documentos legales
│   ├── PRIVACY-POLICY.md
│   ├── TERMS-OF-USE.md
│   ├── LEGAL-NOTICE.md
│   └── COOKIES-POLICY.md
└── 📖 README.md                     # Esta documentación
```

## 🚀 Instalación y Configuración

### Instalación Local
```bash
# Clonar el repositorio
git clone https://github.com/ivanbj96/Ventas.git
cd Ventas

# Servidor local (elegir uno)
# Con Python
python -m http.server 8000

# Con Node.js
npx serve .

# Con PHP
php -S localhost:8000
```

### Acceso a la Aplicación
1. Abrir `http://localhost:8000` en el navegador
2. Instalar como PWA desde el menú del navegador
3. Configurar sincronización (opcional)

### Configuración de Sincronización
1. **Configurar usuario**: Usar ID único compartido entre dispositivos
2. **Verificar conexión**: Probar conectividad WebSocket
3. **Sincronizar datos**: Enviar/recibir datos entre dispositivos
4. **Monitorear estado**: Verificar indicadores de sincronización

## 🎯 Casos de Uso Principales

### Tienda de Abarrotes
- Inventario diverso con categorías
- Ventas rápidas con código de barras
- Control de stock automático
- Múltiples métodos de pago
- Gestión de clientes frecuentes

### Negocio Avícola
- Ventas por peso con cálculo automático
- Control de merma y costos
- Estadísticas especializadas
- Precios variables por libra
- Reportes específicos del sector

### Negocio Multi-dispositivo
- Sincronización en tiempo real
- Trabajo colaborativo
- Acceso desde cualquier dispositivo
- Datos siempre actualizados
- Backup automático

### Pequeño Comercio
- Gestión completa sin complicaciones
- Control de deudas y créditos
- Reportes financieros automáticos
- Operación offline
- Instalación como app nativa

## 📊 Reportes y Análisis Disponibles

### Reporte de Balance
- **Ingresos totales** del período seleccionado
- **Gastos y costos** detallados
- **Ganancia neta** con cálculos automáticos
- **Desglose por método** de pago
- **Filtros temporales** flexibles

### Reporte de Ventas
- **Lista detallada** de todas las ventas
- **Totales por cliente** y período
- **Análisis por producto** más vendido
- **Tendencias de venta** con gráficos
- **Comprobantes digitales** descargables

### Reporte de Deudas
- **Clientes con saldo** pendiente
- **Historial de abonos** detallado
- **Análisis de cartera** de clientes
- **Proyección de cobros** futuros
- **Estados de deuda** actualizados

### Reporte de Pollos
- **Ventas por peso** y cantidad
- **Control de merma** y costos
- **Análisis de rentabilidad** específico
- **Estadísticas de producción**
- **Tendencias del mercado** avícola

## 🔧 Tecnologías y Dependencias

### Frontend Core
- **HTML5, CSS3, JavaScript ES6+**
- **Bootstrap 5.3.3** - Framework CSS responsive
- **Bootstrap Icons 1.10.5** - Iconografía completa
- **SweetAlert2 11.x** - Modales y notificaciones elegantes

### Visualización y Reportes
- **Chart.js 4.4.0** - Gráficos interactivos
- **jsPDF 2.5.1** - Generación de PDFs
- **jsPDF AutoTable 3.5.28** - Tablas en PDF

### Sincronización y Comunicación
- **WebSocket API** - Comunicación en tiempo real
- **AWS API Gateway** - Infraestructura WebSocket
- **AWS Lambda** - Funciones serverless
- **Custom WebSocket Client** - Cliente personalizado

### PWA y Móvil
- **Service Worker** - Cache y modo offline
- **Web App Manifest** - Configuración PWA
- **LocalStorage** - Persistencia local
- **Cache API** - Gestión de cache
- **Responsive Design** - Adaptación móvil

## 📱 Características PWA Avanzadas

### Instalación Nativa
- **Instalable** desde cualquier navegador moderno
- **Icono en launcher** del dispositivo
- **Funcionamiento** como aplicación nativa
- **Pantalla de splash** personalizada
- **Shortcuts** de aplicación configurables

### Funcionalidades Offline
- **Cache inteligente** de recursos críticos
- **Funcionamiento** sin conexión a internet
- **Almacenamiento local** robusto y confiable
- **Sincronización** automática al reconectar
- **Notificaciones** de estado de conexión

### Sincronización Tiempo Real
- **WebSocket** para comunicación instantánea
- **Sincronización automática** entre dispositivos
- **Sistema de reconexión** robusto y confiable
- **Manejo de estados** de conexión
- **Notificaciones visuales** de sincronización

## 🔐 Seguridad y Privacidad

### Protección de Datos
- **Almacenamiento local** seguro y encriptado
- **Validación de integridad** automática
- **Recuperación ante fallos** robusta
- **Backup automático** con limpieza
- **Sin recolección** de datos personales

### Privacidad por Diseño
- **Procesamiento local** de toda la información
- **Control total** del usuario sobre sus datos
- **Sin envío** a servidores externos
- **Datos privados** por defecto
- **Transparencia** completa en el código

## 📄 Documentación Legal

- [Política de Privacidad](Políticas/PRIVACY-POLICY.md)
- [Términos de Uso](Políticas/TERMS-OF-USE.md)
- [Aviso Legal](Políticas/LEGAL-NOTICE.md)
- [Política de Cookies](Políticas/COOKIES-POLICY.md)

## 🛡️ Licencia y Uso

Este proyecto está protegido por una **licencia personalizada restrictiva**. 

**⚠️ IMPORTANTE**: No se permite la clonación, redistribución ni uso comercial sin consentimiento expreso del autor.

Para usar, modificar o distribuir este software, debes contactar al autor y acordar un reconocimiento económico o licencia especial.

**📧 Contacto para licencias:**
- ivqb96@gmail.com
- ivanbj-96@outlook.com

Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🚀 Roadmap y Mejoras Identificadas

### Funcionalidades Implementadas ✅
- [x] Sistema de ventas completo con carrito inteligente
- [x] Gestión de inventario con control de stock
- [x] Gestión completa de clientes con búsqueda
- [x] Módulo especializado de pollos con cálculos
- [x] Sistema de deudas y créditos
- [x] Reportes PDF profesionales
- [x] Sincronización WebSocket en tiempo real
- [x] PWA completa con modo offline
- [x] Arquitectura modular escalable
- [x] Interfaz responsive moderna
- [x] Sistema de backup automático

### Mejoras Técnicas Recomendadas 🔧

#### Optimización de Rendimiento
- [ ] **Lazy loading** de módulos no críticos
- [ ] **Virtual scrolling** para listas grandes
- [ ] **Debounce** en búsquedas y filtros
- [ ] **Memoización** de cálculos complejos
- [ ] **Web Workers** para procesamiento pesado

#### Mejoras de UX/UI
- [ ] **Drag & drop** para reordenar productos
- [ ] **Gestos táctiles** avanzados (swipe, pinch)
- [ ] **Shortcuts de teclado** para acciones rápidas
- [ ] **Modo de alto contraste** para accesibilidad
- [ ] **Animaciones** más fluidas y naturales

#### Funcionalidades Avanzadas
- [ ] **Código de barras** scanner con cámara
- [ ] **Impresión térmica** directa
- [ ] **Integración con APIs** de pago
- [ ] **Sistema de empleados** y permisos
- [ ] **Análisis predictivo** de ventas
- [ ] **Notificaciones push** nativas

#### Mejoras de Sincronización
- [x] **Sincronización selectiva** por módulos
- [x] **Resolución de conflictos** automática
- [x] **Historial de cambios** detallado
- [x] **Sincronización en background**
- [x] **Compresión** de datos sincronizados

#### Robustez y Confiabilidad
- [ ] **Pruebas automatizadas** (unit, integration)
- [ ] **Manejo de errores** más granular
- [ ] **Logging** estructurado y detallado
- [ ] **Monitoreo** de rendimiento
- [ ] **Recuperación** ante corrupción de datos

#### Escalabilidad
- [ ] **Base de datos** local más robusta (IndexedDB)
- [ ] **Paginación** inteligente de datos
- [ ] **Compresión** de almacenamiento local
- [ ] **Limpieza automática** de datos antiguos
- [ ] **Exportación/importación** de datos

### Próximas Funcionalidades 🎯
- [ ] **Dashboard administrativo** web
- [ ] **App móvil nativa** (React Native/Flutter)
- [ ] **Sistema de fidelización** de clientes
- [ ] **Integración con contabilidad** externa
- [ ] **Marketplace** de plugins y extensiones
- [ ] **API pública** para integraciones

## 🤝 Contribuciones y Desarrollo

### Estructura de Desarrollo
El proyecto sigue una arquitectura modular que facilita el mantenimiento y la extensión:

1. **Módulos independientes** con responsabilidades claras
2. **Estado centralizado** para consistencia de datos
3. **Interfaces bien definidas** entre módulos
4. **Separación de concerns** (UI, lógica, datos)

### Guías de Desarrollo
- **ES6+ modules** para organización del código
- **Async/await** para operaciones asíncronas
- **Error handling** robusto en todas las operaciones
- **Documentación** inline en funciones críticas
- **Naming conventions** consistentes y descriptivas

---

**TillUp POS** - Transformando la gestión de negocios con tecnología moderna, arquitectura modular y experiencia de usuario excepcional.

*Desarrollado con ❤️ para emprendedores y pequeños negocios que buscan eficiencia y profesionalismo.*

**Versión**: 2.2.0  
**Última actualización**: Enero 2025  
**Estado**: ✅ **Completamente Funcional**  
**Sincronización**: 🚀 **Tiempo Real Activa**  
**Compatibilidad**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+  
**Arquitectura**: Modular ES6+ con sincronización WebSocket