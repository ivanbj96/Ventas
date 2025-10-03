// ========================================
// 🔧 FUNCIONES FALTANTES EN LA MODULARIZACIÓN
// ========================================

import { 
  products, clients, sales, debts, movements, cart, chickenSales, 
  currentClientId, setCurrentClientId, setCart 
} from './state.js';
import { formatCurrency, formatDate, generateId } from './utils.js';
import { saveToStorage } from './persistence.js';

// ========================================
// 📄 SISTEMA DE COMPROBANTES
// ========================================

export function showReceipt(sale) {
  const receiptHtml = `
    <div style="max-width: 400px; margin: auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="text-align: center; border-bottom: 2px solid #1F2D3D; padding-bottom: 15px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
          <img src="TillUp.png" alt="TillUp" style="width: 40px; height: 40px; border-radius: 8px;">
          <h3 style="margin: 0; color: #1F2D3D; font-size: 1.5rem;">TillUp POS</h3>
        </div>
        <div style="font-weight: bold; font-size: 1.1rem; color: #1F2D3D; margin-bottom: 5px;">COMPROBANTE DE VENTA</div>
        <div style="font-size: 0.9rem; color: #666; margin-bottom: 3px;">Venta #${sale.id}</div>
        <div style="font-size: 0.9rem; color: #666;">${new Date(sale.date).toLocaleDateString()} ${sale.time || ''}</div>
      </div>
      
      <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 0.95rem;">
        <i class="bi bi-person" style="margin-right: 5px; color: #1F2D3D;"></i>
        <strong>Cliente:</strong> ${sale.clientName}
      </div>
      
      <div style="margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; padding: 10px 0; border-bottom: 1px solid #ddd; font-weight: bold; font-size: 0.9rem; color: #1F2D3D;">
          <div>Producto</div>
          <div>Cant.</div>
          <div>Precio</div>
          <div>Subtotal</div>
        </div>
        
        ${sale.items.map(item => `
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; padding: 8px 0; border-bottom: 1px dashed #eee; font-size: 0.9rem;">
            <div>${item.name}</div>
            <div>${item.qty}</div>
            <div>$${item.price.toFixed(2)}</div>
            <div>$${(item.price * item.qty).toFixed(2)}</div>
          </div>
        `).join('')}
      </div>
      
      <div style="border-top: 2px solid #1F2D3D; padding-top: 15px; margin-bottom: 20px;">
        ${sale.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>$${sale.originalTotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Descuento:</span>
            <span>-$${sale.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem; color: #1F2D3D;">
          <span>TOTAL:</span>
          <span>$${sale.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div style="background: #e9ecef; padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem;">
        <i class="bi bi-${getPaymentIcon(sale.paymentType)}" style="margin-right: 5px; color: #1F2D3D;"></i>
        <strong>Método de pago:</strong> ${getPaymentText(sale.paymentType)}
      </div>
      
      <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
        <div style="font-weight: bold; color: #1F2D3D; margin-bottom: 5px;">
          <i class="bi bi-heart" style="color: #dc3545; margin-right: 5px;"></i>
          ¡Gracias por su compra!
        </div>
        <div style="color: #666; font-size: 0.8rem;">
          TillUp POS - Gestión de Ventas
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    title: 'Comprobante de Venta',
    html: receiptHtml,
    confirmButtonText: 'Cerrar',
    width: 500,
    customClass: {
      popup: 'swal2-receipt-treinta'
    }
  });
}

export function showPaymentReceipt(payment) {
  Swal.fire({
    icon: 'success',
    title: 'Pago Registrado',
    html: `
      <div class="payment-receipt">
        <p><strong>Cliente:</strong> ${payment.clientName}</p>
        <p><strong>Monto:</strong> $${payment.amount.toFixed(2)}</p>
        <p><strong>Fecha:</strong> ${new Date(payment.date).toLocaleDateString()}</p>
        <p><strong>Método:</strong> ${getPaymentText(payment.method)}</p>
      </div>
    `,
    confirmButtonText: 'Aceptar'
  });
}

export function showGenericMovementDetail(movement) {
  Swal.fire({
    title: movement.title,
    html: `
      <div class="movement-detail">
        <p><strong>Tipo:</strong> ${movement.type}</p>
        <p><strong>Fecha:</strong> ${movement.date.toLocaleDateString()}</p>
        <p><strong>Monto:</strong> $${movement.amount.toFixed(2)}</p>
        <p><strong>Descripción:</strong> ${movement.subtitle}</p>
      </div>
    `,
    confirmButtonText: 'Cerrar'
  });
}

// ========================================
// 🛒 SISTEMA DE PROFORMAS (CARRITOS GUARDADOS)
// ========================================

export function saveProforma(clientId, cartItems) {
  if (!clientId || !cartItems) return;
  
  try {
    const proformas = JSON.parse(localStorage.getItem('proformas') || '{}');
    proformas[clientId] = cartItems;
    localStorage.setItem('proformas', JSON.stringify(proformas));
  } catch (error) {
    console.error('Error guardando proforma:', error);
  }
}

export function loadProforma(clientId) {
  if (!clientId) return [];
  
  try {
    const proformas = JSON.parse(localStorage.getItem('proformas') || '{}');
    return proformas[clientId] || [];
  } catch (error) {
    console.error('Error cargando proforma:', error);
    return [];
  }
}

export function deleteProforma(clientId) {
  if (!clientId) return;
  
  try {
    const proformas = JSON.parse(localStorage.getItem('proformas') || '{}');
    delete proformas[clientId];
    localStorage.setItem('proformas', JSON.stringify(proformas));
  } catch (error) {
    console.error('Error eliminando proforma:', error);
  }
}

// ========================================
// 💳 VENTAS A CRÉDITO
// ========================================

export function showCreditSaleModal(total, cost, client) {
  Swal.fire({
    title: 'Venta a Crédito',
    html: `
      <div class="credit-sale-modal">
        <div class="client-info mb-3">
          <h5><i class="bi bi-person"></i> ${client.name}</h5>
          ${client.debt > 0 ? `<p class="text-warning">Deuda actual: $${client.debt.toFixed(2)}</p>` : ''}
        </div>
        
        <div class="sale-info mb-3">
          <p><strong>Total de la venta:</strong> $${total.toFixed(2)}</p>
        </div>
        
        <div class="credit-options">
          <div class="form-group mb-3">
            <label for="creditAbono" class="form-label">Abono inicial (opcional):</label>
            <input type="number" id="creditAbono" class="form-control" 
                   placeholder="0.00" min="0" max="${total}" step="0.01">
          </div>
          
          <div class="form-group mb-3">
            <label for="creditReason" class="form-label">Motivo del crédito:</label>
            <input type="text" id="creditReason" class="form-control" 
                   placeholder="Venta a crédito" value="Venta a crédito">
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Registrar Crédito',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const abono = parseFloat(document.getElementById('creditAbono').value) || 0;
      const reason = document.getElementById('creditReason').value.trim() || 'Venta a crédito';
      
      if (abono > total) {
        Swal.showValidationMessage('El abono no puede ser mayor al total');
        return false;
      }
      
      return { abono, reason };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const { abono, reason } = result.value;
      await processCreditSale(total, cost, client, abono, reason);
    }
  });
}

async function processCreditSale(total, cost, client, abono, reason) {
  try {
    // Actualizar stock
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        product.stock -= item.qty;
        if (product.stock < 0) product.stock = 0;
      }
    });
    
    // Crear venta
    const sale = {
      id: generateId('sale'),
      clientId: client.id,
      clientName: client.name,
      items: [...cart],
      total: total,
      cost: cost,
      profit: total - cost,
      paymentType: 'credit',
      abono: abono,
      debt: total - abono,
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString()
    };
    
    sales.push(sale);
    
    // Crear deuda si hay saldo pendiente
    if (total - abono > 0) {
      const debt = {
        id: generateId('debt'),
        clientId: client.id,
        clientName: client.name,
        amount: total - abono,
        originalAmount: total - abono,
        abono: 0,
        reason: reason,
        date: new Date().toISOString(),
        saleId: sale.id
      };
      
      debts.push(debt);
      
      // Actualizar deuda del cliente
      const clientIndex = clients.findIndex(c => c.id === client.id);
      if (clientIndex !== -1) {
        clients[clientIndex].debt = (clients[clientIndex].debt || 0) + (total - abono);
      }
    }
    
    // Guardar datos
    await saveToStorage('sales', sales);
    await saveToStorage('debts', debts);
    await saveToStorage('products', products);
    await saveToStorage('clients', clients);
    
    // Limpiar carrito
    setCart([]);
    setCurrentClientId(null);
    
    // Mostrar confirmación
    Swal.fire({
      icon: 'success',
      title: 'Venta a Crédito Registrada',
      html: `
        <p><strong>Cliente:</strong> ${client.name}</p>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        ${abono > 0 ? `<p><strong>Abono:</strong> $${abono.toFixed(2)}</p>` : ''}
        <p><strong>Saldo pendiente:</strong> $${(total - abono).toFixed(2)}</p>
      `,
      confirmButtonText: 'Aceptar'
    });
    
    // Actualizar vistas
    if (window.renderInventory) window.renderInventory();
    if (window.renderClients) window.renderClients();
    if (window.renderDebts) window.renderDebts();
    if (window.updateBalanceUI) window.updateBalanceUI();
    
  } catch (error) {
    console.error('Error procesando venta a crédito:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo procesar la venta a crédito',
      confirmButtonText: 'Aceptar'
    });
  }
}

// ========================================
// 🐔 PROCESAMIENTO DE VENTAS DE POLLOS
// ========================================

export async function processChickenSale(sale) {
  try {
    // Agregar a la lista de ventas de pollos
    const chickenSalesArray = JSON.parse(localStorage.getItem('chickenSales') || '[]');
    chickenSalesArray.push(sale);
    localStorage.setItem('chickenSales', JSON.stringify(chickenSalesArray));
    
    // Actualizar deuda del cliente si es venta a crédito
    if (sale.paymentType === 'credit' && sale.debt > 0) {
      const clientIndex = clients.findIndex(c => c.id === sale.clientId);
      if (clientIndex !== -1) {
        clients[clientIndex].debt = (clients[clientIndex].debt || 0) + sale.debt;
        await saveToStorage('clients', clients);
        
        // Crear registro de deuda
        const debt = {
          id: generateId('debt'),
          clientId: sale.clientId,
          clientName: sale.clientName,
          amount: sale.debt,
          originalAmount: sale.debt,
          abono: sale.abono || 0,
          reason: `Venta de pollos #${sale.id}`,
          date: sale.date,
          saleId: sale.id
        };
        
        debts.push(debt);
        await saveToStorage('debts', debts);
      }
    }
    
    // Limpiar formulario
    const form = document.getElementById('chickenSaleForm');
    if (form) {
      form.reset();
      const dateInput = document.getElementById('chickenSaleDate');
      if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
    }
    
    // Actualizar estadísticas y lista
    if (window.updateChickenStats) window.updateChickenStats();
    if (window.updateChickenSalesList) window.updateChickenSalesList();
    if (window.renderClients) window.renderClients();
    if (window.renderDebts) window.renderDebts();
    
    // Mostrar comprobante
    showChickenReceipt(sale);
    
  } catch (error) {
    console.error('Error procesando venta de pollos:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo procesar la venta de pollos',
      confirmButtonText: 'Aceptar'
    });
  }
}

function showChickenReceipt(sale) {
  const receiptHtml = `
    <div class="receipt-treinta">
      <div class="receipt-header">
        <div class="receipt-logo">
          <img src="TillUp.png" alt="TillUp" style="width: 40px; height: 40px; border-radius: 8px;">
          <h3>TillUp POS</h3>
        </div>
        <div class="receipt-info">
          <div class="receipt-title">COMPROBANTE DE VENTA DE POLLOS</div>
          <div class="receipt-number">Venta #${sale.id}</div>
          <div class="receipt-date">${new Date(sale.date).toLocaleDateString()} ${sale.time}</div>
        </div>
      </div>
      
      <div class="receipt-client">
        <i class="bi bi-person"></i>
        <strong>Cliente:</strong> ${sale.clientName}
      </div>
      
      <div class="receipt-items">
        <div class="receipt-items-header">
          <div class="item-name">Descripción</div>
          <div class="item-qty">Cant.</div>
          <div class="item-price">Precio/Lb</div>
          <div class="item-subtotal">Subtotal</div>
        </div>
        
        <div class="receipt-item">
          <div class="item-name">Pollo(s) - ${sale.weight} lbs</div>
          <div class="item-qty">${sale.quantity}</div>
          <div class="item-price">$${sale.pricePerPound.toFixed(2)}</div>
          <div class="item-subtotal">$${sale.total.toFixed(2)}</div>
        </div>
      </div>
      
      <div class="receipt-total">
        <div class="total-line final">
          <span>TOTAL:</span>
          <span class="total-amount">$${sale.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="payment-type">
        <i class="bi bi-${getPaymentIcon(sale.paymentType)}"></i>
        <strong>Método de pago:</strong> ${getPaymentText(sale.paymentType)}
        ${sale.paymentType === 'credit' && sale.abono > 0 ? `<br><small>Abono inicial: $${sale.abono.toFixed(2)}</small>` : ''}
      </div>
      
      <div class="receipt-footer">
        <div class="footer-message">
          <i class="bi bi-heart"></i>
          ¡Gracias por su compra!
        </div>
        <div class="footer-brand">
          <small>TillUp POS - Gestión de Ventas</small>
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    title: 'Venta de Pollos Completada',
    html: receiptHtml,
    showCancelButton: true,
    confirmButtonText: 'Imprimir',
    cancelButtonText: 'Cerrar',
    showDenyButton: true,
    denyButtonText: 'Descargar PDF',
    width: 500,
    customClass: {
      popup: 'swal2-receipt-treinta',
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-secondary',
      denyButton: 'btn btn-outline-primary'
    }
  });
}

// ========================================
// 🔧 FUNCIONES DE UTILIDAD
// ========================================

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function filtrarPorFecha(fecha) {
  console.log('Filtrar por fecha:', fecha);
  // Implementar filtro por fecha
  if (window.renderBalanceGrid) {
    window.renderBalanceGrid({ fecha });
  }
  
  // También actualizar estadísticas avanzadas
  showAdvancedStats();
}

export function cleanupMovementsView() {
  // Limpiar recursos de la vista de movimientos
  console.log('Limpiando vista de movimientos');
}

export function showAdvancedStats() {
  try {
    // Mostrar estadísticas avanzadas en el dashboard
    const stats = calculateAdvancedStats();
    
    // Validar que stats tenga valores válidos
    if (!stats || typeof stats !== 'object') {
      console.warn('Estadísticas inválidas');
      return;
    }
    
    // Actualizar elementos del DOM si existen
    const elements = {
      totalSalesCount: stats.totalSales || 0,
      totalClientsCount: stats.totalClients || 0,
      totalProductsCount: stats.totalProducts || 0,
      averageSale: `$${(stats.averageSale || 0).toFixed(2)}`,
      profitMargin: `${(stats.profitMargin || 0).toFixed(1)}%`,
      debtRatio: `${(stats.debtRatio || 0).toFixed(1)}%`
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });
  } catch (error) {
    console.error('Error mostrando estadísticas avanzadas:', error);
  }
}

// ========================================
// 📅 FUNCIONES DE FILTROS DE PERÍODO
// ========================================

export function setPeriodFilter(period) {
  console.log('Filtro de período:', period);
  const customSelector = document.getElementById('customDateSelector');
  if (customSelector) {
    customSelector.style.display = period === 'custom' ? 'block' : 'none';
  }
  
  // Actualizar el balance con el nuevo período
  if (window.renderBalanceGrid) {
    window.renderBalanceGrid();
  }
}

export function applyCustomFilter() {
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  console.log('Filtro personalizado:', startDate, endDate);
  
  if (startDate && endDate) {
    // Aplicar filtro personalizado
    if (window.renderBalanceGrid) {
      window.renderBalanceGrid({ startDate, endDate });
    }
  }
}

export function clearMovementFilters() {
  console.log('Limpiar filtros de movimientos');
  
  // Resetear filtros de período
  const dayFilter = document.getElementById('periodDay');
  if (dayFilter) {
    dayFilter.checked = true;
  }
  
  // Ocultar selector personalizado
  const customSelector = document.getElementById('customDateSelector');
  if (customSelector) {
    customSelector.style.display = 'none';
  }
  
  // Actualizar vista
  if (window.renderBalanceGrid) {
    window.renderBalanceGrid();
  }
}

export function showChart(chartType) {
  console.log('Mostrar gráfico:', chartType);
  
  // Cambiar tipo de gráfico
  if (window.updateMainChart) {
    window.currentChartType = chartType;
    window.updateMainChart();
  }
}

export function toggleRevenueVisibility() {
  const revenueElement = document.getElementById('totalRevenue');
  const eyeIcon = document.getElementById('revenueEyeIcon');
  if (revenueElement && eyeIcon) {
    const isHidden = revenueElement.textContent.includes('•');
    if (isHidden) {
      revenueElement.textContent = revenueElement.dataset.actualValue || '$0.00';
      eyeIcon.className = 'bi bi-eye-slash';
    } else {
      revenueElement.dataset.actualValue = revenueElement.textContent;
      revenueElement.textContent = '•••••';
      eyeIcon.className = 'bi bi-eye';
    }
  }
}

function calculateAdvancedStats() {
  // Obtener TODOS los datos desde localStorage para asegurar sincronización
  const realSales = JSON.parse(localStorage.getItem('sales') || '[]');
  const realChickenSales = JSON.parse(localStorage.getItem('chickenSales') || '[]');
  const realDebts = JSON.parse(localStorage.getItem('debts') || '[]');
  const realClients = JSON.parse(localStorage.getItem('clients') || '[]');
  const realProducts = JSON.parse(localStorage.getItem('products') || '[]');
  
  console.log('📊 Calculando estadísticas con datos reales:', {
    sales: realSales.length,
    chickenSales: realChickenSales.length,
    debts: realDebts.length,
    clients: realClients.length,
    products: realProducts.length
  });
  
  // Contar ventas normales y de pollos
  const normalSales = realSales.length;
  const chickenSalesCount = realChickenSales.length;
  const totalSales = normalSales + chickenSalesCount;
  
  const totalClients = realClients.length;
  const totalProducts = realProducts.length;
  
  let totalRevenue = 0;
  let totalCost = 0;
  let totalDebt = 0;
  
  // Calcular ingresos y costos de ventas normales
  realSales.forEach(sale => {
    totalRevenue += sale.total || 0;
    totalCost += sale.cost || 0;
  });
  
  // Calcular ingresos y costos de ventas de pollos
  realChickenSales.forEach(sale => {
    totalRevenue += sale.total || 0;
    // Calcular costo de pollo basado en peso y costo por libra
    const chickenCost = (sale.weight || 0) * (sale.costPerPound || 0);
    totalCost += chickenCost;
  });
  
  // Calcular deudas desde localStorage
  realDebts.forEach(debt => {
    totalDebt += debt.amount || 0;
  });
  
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  const debtRatio = totalRevenue > 0 ? (totalDebt / totalRevenue) * 100 : 0;
  
  const stats = {
    totalSales,
    totalClients,
    totalProducts,
    averageSale,
    profitMargin,
    debtRatio
  };
  
  console.log('✅ Estadísticas calculadas:', stats);
  return stats;
}

// ========================================
// 🎨 FUNCIONES DE ICONOS Y TEXTO
// ========================================

function getPaymentIcon(paymentType) {
  switch(paymentType) {
    case 'cash': return 'cash-coin';
    case 'card': return 'credit-card';
    case 'transfer': return 'bank';
    case 'credit': return 'clock-history';
    default: return 'question-circle';
  }
}

function getPaymentText(paymentType) {
  switch(paymentType) {
    case 'cash': return 'Pago en efectivo';
    case 'card': return 'Pago con tarjeta';
    case 'transfer': return 'Transferencia bancaria';
    case 'credit': return 'Venta a crédito';
    default: return 'Otro método de pago';
  }
}

// ========================================
// 📄 FUNCIONES DE IMPRESIÓN Y PDF
// ========================================

function printReceipt(sale) {
  // Implementar impresión de comprobante
  console.log('Imprimir comprobante:', sale);
}

function downloadReceiptPDF(sale) {
  // Implementar descarga de PDF
  console.log('Descargar PDF:', sale);
}