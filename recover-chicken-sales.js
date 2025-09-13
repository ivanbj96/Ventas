// ========================================
// 🔄 RECUPERACIÓN DE VENTAS DE POLLOS
// ========================================

// Función para recuperar ventas de pollos desde localStorage
function recoverChickenSales() {
  try {
    const storedSales = localStorage.getItem('chickenSales');
    if (storedSales) {
      const salesArray = JSON.parse(storedSales);
      console.log('🔍 Ventas de pollos encontradas en localStorage:', salesArray.length);
      
      // Mostrar detalles de las ventas
      salesArray.forEach((sale, index) => {
        console.log(`Venta ${index + 1}:`, {
          id: sale.id,
          fecha: sale.date,
          cliente: sale.clientName,
          total: sale.total,
          peso: sale.weight
        });
      });
      
      return salesArray;
    } else {
      console.log('❌ No se encontraron ventas de pollos en localStorage');
      return [];
    }
  } catch (error) {
    console.error('Error recuperando ventas de pollos:', error);
    return [];
  }
}

// Función para mostrar todas las ventas sin filtro
function showAllChickenSales() {
  const sales = recoverChickenSales();
  
  if (sales.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'No hay ventas',
      text: 'No se encontraron ventas de pollos en el almacenamiento local.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  // Actualizar el estado global
  if (window.setChickenSales) {
    window.setChickenSales(sales);
  }
  
  // Actualizar la vista sin filtro de fecha
  if (window.updateChickenSalesList) {
    window.updateChickenSalesList();
  }
  
  if (window.updateChickenStats) {
    window.updateChickenStats();
  }
  
  Swal.fire({
    icon: 'success',
    title: 'Ventas recuperadas',
    text: `Se encontraron ${sales.length} ventas de pollos.`,
    confirmButtonText: 'Aceptar'
  });
}

// Función para debug de ventas de pollos
function debugChickenSales() {
  console.log('=== 🔍 DEBUG VENTAS DE POLLOS ===');
  
  // Verificar localStorage
  const storedSales = localStorage.getItem('chickenSales');
  console.log('localStorage chickenSales:', storedSales ? JSON.parse(storedSales) : 'vacío');
  
  // Verificar estado global
  console.log('window.chickenSales:', window.chickenSales);
  
  // Verificar módulo de estado
  if (window.getChickenSales) {
    console.log('Estado del módulo:', window.getChickenSales());
  }
  
  // Mostrar ventas por fecha
  if (storedSales) {
    const sales = JSON.parse(storedSales);
    const salesByDate = {};
    
    sales.forEach(sale => {
      const date = sale.date ? sale.date.split('T')[0] : 'sin fecha';
      if (!salesByDate[date]) {
        salesByDate[date] = [];
      }
      salesByDate[date].push(sale);
    });
    
    console.log('Ventas agrupadas por fecha:', salesByDate);
  }
}

// Exponer funciones globalmente
window.recoverChickenSales = recoverChickenSales;
window.showAllChickenSales = showAllChickenSales;
window.debugChickenSales = debugChickenSales;

console.log('🔄 Sistema de recuperación de ventas de pollos cargado');