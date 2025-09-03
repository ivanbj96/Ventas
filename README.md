# TillUp POS - Sistema de Gestión de Ventas

## 📱 PWA Moderna para Gestión de Negocios

TillUp es una aplicación web progresiva (PWA) completa para la gestión integral de negocios, especializada en ventas, inventario, clientes y reportes financieros. Diseñada con tecnología moderna y optimizada para dispositivos móviles con experiencia nativa.

## ✨ Características Principales

### 🛒 Sistema de Ventas Completo
- **Carrito inteligente**: Interfaz moderna con gestión de productos
- **Múltiples métodos de pago**: Efectivo, tarjeta, transferencia, crédito
- **Gestión de stock**: Control automático de inventario en tiempo real
- **Comprobantes digitales**: Tickets de venta profesionales
- **Descuentos**: Sistema de descuentos aplicables
- **Selector de cliente**: Búsqueda avanzada de clientes

### 👥 Gestión de Clientes
- **Base de datos completa**: Nombre, teléfono, dirección, foto
- **Historial de compras**: Seguimiento completo de transacciones
- **Sistema de deudas**: Control de créditos, abonos y saldos
- **Vistas flexibles**: Modo cuadrícula y lista
- **Búsqueda avanzada**: Sistema de filtros y búsqueda rápida

### 📦 Inventario Inteligente
- **Gestión completa**: Nombre, precio, costo, categoría, stock
- **Imágenes de productos**: Subida y vista previa
- **Control de stock**: Validación automática y alertas
- **Categorización**: Organización por categorías
- **Vistas adaptables**: Cuadrícula y lista

### 📊 Dashboard y Reportes
- **Balance en tiempo real**: Ingresos, gastos, utilidades
- **Filtros temporales**: Día, semana, mes, año
- **Timeline de movimientos**: Historial visual de transacciones
- **Estadísticas avanzadas**: Métricas detalladas
- **Exportación PDF**: Reportes profesionales
- **Gráficos interactivos**: Tendencias con Chart.js

### 🔄 Sincronización Multidispositivo
- **WebSocket en tiempo real**: Sincronización instantánea entre dispositivos
- **Cliente WebSocket**: Sistema de conexión bidireccional
- **Página de pruebas**: Herramienta para testing de sincronización
- **Reconexión automática**: Sistema robusto de reconexión

### 📱 Experiencia Móvil Nativa
- **PWA Completa**: Instalación como app nativa
- **Modo offline**: Funcionamiento sin conexión
- **Responsive design**: Adaptado a móviles, tablets y desktop
- **Service Worker**: Cache inteligente
- **Manifest**: Configuración PWA completa

### 🎨 Interfaz Moderna
- **Diseño profesional**: Interfaz limpia y moderna
- **Bootstrap 5**: Framework CSS responsive
- **Iconografía Bootstrap**: Iconos consistentes
- **Animaciones fluidas**: Transiciones CSS3
- **SweetAlert2**: Modales elegantes

## 🏗️ Arquitectura Técnica

### Frontend
- **HTML5 + CSS3**: Estructura semántica y estilos modernos
- **JavaScript ES6+**: Código modular y orientado a objetos
- **Bootstrap 5.3**: Framework CSS responsive
- **Chart.js**: Gráficos interactivos
- **SweetAlert2**: Modales y notificaciones

### Persistencia
- **LocalStorage**: Almacenamiento rápido local
- **IndexedDB (LocalForage)**: Base de datos local robusta
- **Service Worker**: Cache inteligente y modo offline

### Sincronización
- **WebSocket Client**: Cliente de sincronización en tiempo real
- **Reconexión automática**: Sistema robusto de conexión
- **Cola de mensajes**: Manejo de mensajes offline

### Generación de Reportes
- **jsPDF**: Generación de PDFs del lado cliente
- **jsPDF AutoTable**: Tablas profesionales en PDF

## 🗂️ Estructura del Proyecto

```
Ventas/
├── 📄 index.html                    # Aplicación principal
├── 🎯 app.js                        # Lógica de la aplicación
├── 🔧 utils.js                      # Utilidades y persistencia
├── 📊 pdf-generator.js              # Generación de reportes PDF
├── 🎨 style.css                     # Estilos principales
├── 📱 manifest.json                 # Configuración PWA
├── ⚙️ sw.js                         # Service Worker
├── 🧪 test-sync.html                # Página de pruebas WebSocket
├── 🔄 websocket-sync-client.js      # Cliente de sincronización
├── 🖼️ icons/                        # Iconos de la aplicación
│   ├── icon-192.png
│   ├── icon-512.png
│   └── android-icon-192x192.png
├── 📚 libs/                         # Librerías externas
│   └── localforage.min.js
├── 📄 offline.html                  # Página offline
├── 🌐 CNAME                         # Configuración dominio
├── 📖 README.md                     # Documentación
├── ⚖️ LICENSE                       # Licencia del proyecto
└── 📋 Políticas/                    # Documentos legales
    ├── PRIVACY-POLICY.md
    ├── TERMS-OF-USE.md
    ├── LEGAL-NOTICE.md
    └── COOKIES-POLICY.md
```

## 🚀 Instalación y Uso

### Instalación Local
1. **Clonar repositorio**:
   ```bash
   git clone https://github.com/ivanbj96/Ventas.git
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

### Configuración Inicial
1. **Productos**: Agregar inventario inicial
2. **Clientes**: Registrar base de clientes
3. **Configuración**: Ajustar precios y categorías

### Pruebas de Sincronización
1. **Abrir test-sync.html** para probar WebSocket
2. **Verificar conexión** en múltiples dispositivos
3. **Probar sincronización** en tiempo real

## 🎯 Casos de Uso

### Para Tienda General
- Inventario de productos variados
- Sistema de ventas con carrito
- Control de stock automático
- Múltiples métodos de pago

### Para Negocio Multi-dispositivo
- Sincronización en tiempo real
- Trabajo colaborativo
- Acceso desde cualquier dispositivo
- Datos siempre actualizados

### Para Pequeños Negocios
- Gestión completa de ventas
- Control de clientes y deudas
- Reportes financieros
- Operación offline

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

### Sincronización
- WebSocket Client personalizado
- Sistema de reconexión automática
- Cola de mensajes offline
- Sincronización bidireccional

### PWA/Mobile
- Service Worker
- Web App Manifest
- LocalForage (IndexedDB)
- Cache API
- Offline functionality

## 📱 Características PWA

### Instalación Nativa
- Instalable desde cualquier navegador
- Icono en el launcher del dispositivo
- Funcionamiento como app nativa
- Pantalla de splash personalizada

### Funcionalidades Offline
- Cache inteligente de recursos
- Funcionamiento sin internet
- Almacenamiento local robusto
- Sincronización al reconectar

### Sincronización en Tiempo Real
- WebSocket para comunicación instantánea
- Sincronización automática entre dispositivos
- Sistema de reconexión robusto
- Manejo de estados de conexión

## 🔐 Seguridad y Privacidad

### Protección de Datos
- Almacenamiento local seguro
- Validación de integridad
- Recuperación ante fallos
- Datos encriptados localmente

### Privacidad
- Sin recolección de datos personales
- Procesamiento local de información
- Control total del usuario
- Datos privados por defecto

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

### Funcionalidades Implementadas
- [x] Sistema de ventas completo
- [x] Gestión de inventario
- [x] Gestión de clientes
- [x] Reportes PDF
- [x] Sincronización WebSocket
- [x] PWA completa
- [x] Modo offline

### Próximas Funcionalidades
- [ ] Integración con impresoras térmicas
- [ ] Sistema de empleados y permisos
- [ ] Análisis predictivo de ventas
- [ ] App móvil nativa
- [ ] Dashboard web administrativo
- [ ] Sistema de fidelización de clientes
- [ ] Integración con APIs de pago

### Mejoras Técnicas
- [ ] Optimización de rendimiento
- [ ] Pruebas automatizadas
- [ ] Documentación de API
- [ ] Monitoreo y analytics
- [ ] Backup en la nube
- [ ] Escalabilidad horizontal

---

**TillUp POS** - Transformando la gestión de negocios con tecnología moderna y experiencia de usuario excepcional.

*Desarrollado con ❤️ para emprendedores y pequeños negocios.*

**Versión**: 2.0.0  
**Última actualización**: Enero 2025  
**Compatibilidad**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+