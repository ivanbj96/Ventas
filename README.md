# TillUp POS - Sistema de Gestión de Ventas

## 📱 PWA Moderna para Gestión de Negocios

TillUp es una aplicación web progresiva (PWA) diseñada para la gestión completa de ventas, inventario, clientes y reportes financieros. Optimizada para dispositivos móviles con experiencia nativa.

## ✨ Características Principales

### 🛒 Gestión de Ventas
- **Carrito de compras intuitivo** con gestos táctiles
- **Múltiples métodos de pago** (efectivo, tarjeta, transferencia, crédito)
- **Búsqueda rápida de productos** con filtros en tiempo real
- **Recibos digitales** con opción de impresión y PDF
- **Gestión de stock automática**

### 📦 Inventario
- **Gestión completa de productos** con imágenes
- **Control de stock** con alertas de bajo inventario
- **Categorización de productos**
- **Vistas personalizables** (cuadrícula/lista)

### 👥 Gestión de Clientes
- **Base de datos de clientes** con fotos y ubicación
- **Historial de compras** por cliente
- **Sistema de deudas** con seguimiento de pagos
- **Información detallada** de cada cliente

### 🐔 Gestión Especializada de Pollos
- **Ventas por peso** con cálculo automático
- **Configuración de precios** por libra
- **Estadísticas especializadas** de ventas de pollos
- **Historial detallado** de transacciones

### 💰 Balance y Reportes
- **Dashboard financiero** en tiempo real
- **Filtros por período** (día, semana, mes, año)
- **Movimientos manuales** (ingresos/gastos)
- **Reportes PDF** completos
- **Análisis de ganancias** detallado

### 📊 Reportes y Estadísticas
- **Reportes PDF** de todas las secciones
- **Estadísticas visuales** de ventas y ganancias
- **Filtros por fecha** para análisis personalizado
- **Exportación de datos** en múltiples formatos

## 🏗️ Arquitectura del Proyecto

### Estructura de Archivos

```
Ventas/
├── index.html              # Página principal con estructura HTML
├── app.js                  # Funciones principales y inicialización
├── utils.js                # Utilidades y funciones auxiliares
├── sales-functions.js      # Funciones de ventas y productos
├── clients-functions.js    # Funciones de clientes y deudas
├── chicken-functions.js    # Funciones especializadas de pollos
├── balance-functions.js    # Funciones de balance y movimientos
├── pdf-generator.js        # Generación de reportes PDF
├── ubicacion.js           # Captura de ubicación GPS
├── update-config.js       # Configuración de actualizaciones
├── sw.js                  # Service Worker para PWA
├── style.css              # Estilos CSS personalizados
├── manifest.json          # Configuración PWA
└── icons/                 # Iconos de la aplicación
```

### Separación de Responsabilidades

#### 📄 `app.js` - Funciones Principales
- Inicialización de la aplicación
- Navegación entre vistas
- Gestión del sidebar y tema
- Funciones PWA y actualizaciones
- Mejoras nativas móviles

#### 🛒 `sales-functions.js` - Ventas y Productos
- Gestión completa de productos
- Carrito de compras
- Proceso de ventas
- Control de inventario
- Receipts y confirmaciones

#### 👥 `clients-functions.js` - Clientes y Deudas
- CRUD de clientes
- Sistema de deudas
- Gestión de pagos
- Selectores de clientes
- Información detallada

#### 🐔 `chicken-functions.js` - Pollos Especializados
- Ventas por peso
- Configuración de precios
- Estadísticas de pollos
- Historial especializado
- Cálculos automáticos

#### 💰 `balance-functions.js` - Balance y Movimientos
- Dashboard financiero
- Cálculos de balance
- Movimientos manuales
- Filtros por período
- Generación de reportes

#### 🛠️ `utils.js` - Utilidades
- Funciones de formato
- Validaciones
- Gestión de datos
- Feedback táctil
- Notificaciones

## 🚀 Instalación y Uso

### Requisitos
- Navegador web moderno con soporte PWA
- Conexión a internet para recursos CDN
- Permisos de ubicación (opcional)

### Instalación
1. **Clonar o descargar** el repositorio
2. **Abrir** `index.html` en un servidor web
3. **Instalar como PWA** desde el navegador
4. **Configurar** precios y datos iniciales

### Uso Inicial
1. **Agregar productos** al inventario
2. **Registrar clientes** en la base de datos
3. **Configurar precios** de pollos (si aplica)
4. **Realizar primera venta** de prueba

## 📱 Características Móviles

### Experiencia Nativa
- **Gestos táctiles** optimizados
- **Feedback háptico** en interacciones
- **Pull-to-refresh** en listas
- **Navegación por swipe**
- **Botones optimizados** para touch

### PWA Features
- **Instalación** como app nativa
- **Funcionamiento offline**
- **Notificaciones push**
- **Actualizaciones automáticas**
- **Sincronización de datos**

### Optimizaciones
- **Carga rápida** con lazy loading
- **Cache inteligente** de recursos
- **Compresión de imágenes**
- **Minificación** de código
- **CDN optimizado**

## 🔧 Configuración

### Variables de Entorno
```javascript
// Configuración de precios de pollos
const CHICKEN_CONFIG = {
  pricePerPound: 2.50,
  costPerPound: 1.80
};

// Configuración de la aplicación
const APP_CONFIG = {
  version: '1.3.1',
  theme: 'auto',
  language: 'es'
};
```

### Personalización
- **Colores del tema** en `style.css`
- **Configuración PWA** en `manifest.json`
- **Funciones personalizadas** en archivos específicos
- **Estilos adicionales** en `style.css`

## 📊 Funciones Avanzadas

### Sistema de Deudas
- **Registro de deudas** por cliente
- **Seguimiento de pagos** con abonos
- **Historial completo** de transacciones
- **Alertas de deudas** pendientes

### Reportes Financieros
- **Balance general** por períodos
- **Análisis de ganancias** detallado
- **Exportación PDF** profesional
- **Filtros personalizados** por fecha

### Gestión de Inventario
- **Control de stock** automático
- **Alertas de bajo inventario**
- **Categorización** de productos
- **Imágenes** de productos

## 🔒 Seguridad y Datos

### Almacenamiento
- **LocalStorage** para datos locales
- **IndexedDB** para datos complejos
- **Backup automático** de configuración
- **Exportación** de datos

### Privacidad
- **Datos locales** sin envío a servidores
- **Permisos mínimos** requeridos
- **Sin tracking** de usuarios
- **Control total** de la información

## 🐛 Solución de Problemas

### Problemas Comunes

#### La app no carga
- Verificar conexión a internet
- Limpiar cache del navegador
- Revisar consola para errores

#### No se guardan los datos
- Verificar permisos de almacenamiento
- Comprobar espacio disponible
- Reiniciar la aplicación

#### Problemas en móviles
- Actualizar navegador
- Verificar soporte PWA
- Reinstalar la aplicación

### Logs y Debugging
```javascript
// Habilitar logs detallados
localStorage.setItem('debug', 'true');

// Verificar estado de la app
console.log('App State:', {
  products: products.length,
  clients: clients.length,
  sales: sales.length,
  version: APP_VERSION
});
```

## 🔄 Actualizaciones

### Sistema de Actualizaciones
- **Verificación automática** de nuevas versiones
- **Notificaciones** de actualizaciones disponibles
- **Instalación** con un clic
- **Preservación** de datos existentes

### Versionado
- **Semantic Versioning** (MAJOR.MINOR.PATCH)
- **Changelog** detallado
- **Compatibilidad** hacia atrás
- **Migración** automática de datos

## 📈 Roadmap

### Próximas Funcionalidades
- [ ] **Sincronización en la nube**
- [ ] **Múltiples usuarios**
- [ ] **Backup automático**
- [ ] **Análisis avanzado**
- [ ] **Integración con impresoras**
- [ ] **Modo offline completo**

### Mejoras Técnicas
- [ ] **Optimización de rendimiento**
- [ ] **Nuevas animaciones**
- [ ] **Temas personalizables**
- [ ] **Accesibilidad mejorada**
- [ ] **Internacionalización**

## 🤝 Contribución

### Cómo Contribuir
1. **Fork** el repositorio
2. **Crear** una rama para tu feature
3. **Implementar** los cambios
4. **Probar** exhaustivamente
5. **Crear** un Pull Request

### Estándares de Código
- **ES6+** para JavaScript
- **BEM** para CSS
- **Comentarios** descriptivos
- **Manejo de errores** robusto
- **Testing** de funcionalidades

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

### Contacto
- **Issues**: Crear issue en GitHub
- **Documentación**: Revisar este README
- **Comunidad**: Foros de desarrollo

### Recursos Adicionales
- **Documentación técnica** detallada
- **Guías de usuario** paso a paso
- **Videos tutoriales** de uso
- **FAQ** con preguntas comunes

---

**TillUp POS** - Transformando la gestión de negocios con tecnología moderna y experiencia de usuario excepcional.

*Desarrollado con ❤️ para emprendedores y pequeños negocios.* 
