# TillUp - PWA de Gestión de Ventas

Una aplicación web progresiva (PWA) completa para la gestión de ventas, inventario y clientes, diseñada para funcionar como una aplicación nativa en dispositivos móviles.

## 🚀 Características Principales

### 📱 Experiencia Nativa
- **Gestos táctiles**: Swipe, pull-to-refresh, feedback háptico
- **Animaciones fluidas**: Transiciones suaves y efectos visuales
- **Interfaz adaptativa**: Diseño responsive optimizado para móviles
- **Modo offline**: Funciona completamente sin conexión
- **Instalación nativa**: Se puede instalar como app en cualquier dispositivo

### 💼 Gestión de Negocio
- **Ventas**: Sistema completo de carrito y facturación
- **Inventario**: Gestión de productos con imágenes y stock
- **Clientes**: Base de datos de clientes con fotos
- **Deudas**: Sistema de créditos y pagos
- **Pollos**: Módulo especializado para venta de pollos
- **Reportes**: Balance, estadísticas y exportación PDF

### 🎨 Interfaz Moderna
- **Modo oscuro/claro**: Adaptación automática al sistema
- **Diseño Material**: Inspirado en las mejores prácticas de UX
- **Accesibilidad**: Compatible con lectores de pantalla
- **Acciones rápidas**: Menú flotante para tareas comunes

## 📋 Funcionalidades Detalladas

### Ventas
- Carrito de compras intuitivo
- Múltiples métodos de pago
- Descuentos y promociones
- Generación de comprobantes
- Exportación a PDF

### Inventario
- Gestión de productos con imágenes
- Control de stock automático
- Categorización de productos
- Búsqueda avanzada
- Vista en grid y lista

### Clientes
- Base de datos completa
- Fotos de perfil
- Historial de compras
- Sistema de deudas
- Información de contacto

### Pollos
- Cálculo automático por peso
- Configuración de precios
- Control de ganancias
- Reportes especializados
- Comprobantes personalizados

### Balance y Reportes
- Balance en tiempo real
- Filtros por período
- Estadísticas avanzadas
- Exportación de datos
- Gráficos informativos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Framework**: Bootstrap 5.3
- **Iconos**: Bootstrap Icons
- **PDF**: jsPDF con AutoTable
- **Notificaciones**: SweetAlert2
- **PWA**: Service Worker, Manifest
- **Almacenamiento**: localStorage, IndexedDB

## 📱 Características Nativas Implementadas

### Gestos Táctiles
- **Swipe**: Para navegar y mostrar acciones
- **Pull-to-refresh**: Para actualizar datos
- **Tap feedback**: Vibración háptica en interacciones
- **Long press**: Para acciones contextuales

### Experiencia de Usuario
- **Animaciones**: Transiciones suaves entre vistas
- **Loading states**: Indicadores de carga
- **Error handling**: Manejo elegante de errores
- **Offline support**: Funcionamiento completo sin internet

### Optimizaciones Móviles
- **Viewport**: Configuración optimizada para móviles
- **Touch targets**: Botones de tamaño adecuado (44px mínimo)
- **Scroll**: Scroll suave y optimizado
- **Keyboard**: Manejo mejorado del teclado virtual

### PWA Features
- **Installable**: Se puede instalar en cualquier dispositivo
- **Offline**: Funciona sin conexión
- **Background sync**: Sincronización en segundo plano
- **Push notifications**: Notificaciones nativas
- **App shortcuts**: Accesos directos en el sistema

## 🚀 Instalación y Uso

### Instalación Local
1. Clona el repositorio
2. Abre `index.html` en un servidor web
3. La PWA se instalará automáticamente

### Instalación en Dispositivo
1. Abre la aplicación en tu navegador
2. Toca el botón "Instalar" en la barra de direcciones
3. Confirma la instalación
4. La app aparecerá en tu pantalla de inicio

### Uso Offline
- La aplicación funciona completamente sin conexión
- Los datos se guardan localmente
- Se sincronizarán cuando vuelvas a conectar

## 📊 Estructura del Proyecto

```
TillUp/
├── index.html          # Página principal
├── app.js             # Lógica principal de la aplicación
├── style.css          # Estilos y animaciones
├── sw.js              # Service Worker
├── manifest.json      # Configuración PWA
├── offline.html       # Página de error offline
├── icons/             # Iconos de la aplicación
├── utils.js           # Utilidades y helpers
└── pdf-generator.js   # Generación de PDFs
```

## 🎯 Mejoras Implementadas

### Experiencia Nativa
- ✅ Feedback háptico en todas las interacciones
- ✅ Gestos de swipe para navegación
- ✅ Pull-to-refresh para actualizar datos
- ✅ Animaciones fluidas y transiciones
- ✅ Modo offline completo
- ✅ Notificaciones push nativas

### Interfaz de Usuario
- ✅ Diseño Material Design
- ✅ Modo oscuro/claro automático
- ✅ Botón flotante de acciones rápidas
- ✅ Menú contextual con swipe
- ✅ Loading states y skeleton screens
- ✅ Error boundaries y fallbacks

### Rendimiento
- ✅ Lazy loading de componentes
- ✅ Caché inteligente con Service Worker
- ✅ Optimización de imágenes
- ✅ Compresión de assets
- ✅ Background sync para datos

### Accesibilidad
- ✅ Navegación por teclado
- ✅ Lectores de pantalla
- ✅ Contraste mejorado
- ✅ Tamaños de texto escalables
- ✅ Focus management

## 🔧 Configuración Avanzada

### Personalización de Temas
```css
:root {
  --primary: #0d6efd;
  --secondary: #6c757d;
  --success: #28a745;
  --danger: #dc3545;
  --warning: #ffc107;
  --info: #17a2b8;
}
```

### Configuración de PWA
```json
{
  "name": "TillUp - Punto de Venta",
  "short_name": "TillUp",
  "display": "standalone",
  "orientation": "portrait-primary"
}
```

## 📈 Próximas Mejoras

- [ ] Sincronización con servidor en la nube
- [ ] Múltiples usuarios y roles
- [ ] Integración con impresoras térmicas
- [ ] Escáner de códigos de barras
- [ ] Backup automático en la nube
- [ ] Analytics y reportes avanzados
- [ ] Integración con pasarelas de pago
- [ ] Notificaciones push personalizadas

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Bootstrap por el framework CSS
- jsPDF por la generación de PDFs
- SweetAlert2 por las notificaciones
- Bootstrap Icons por los iconos
- La comunidad PWA por las mejores prácticas

---

**TillUp** - Transformando la gestión de ventas en una experiencia nativa ✨ 
