// ========================================
// 🐔 GESTIÓN ESPECIALIZADA DE POLLOS
// ========================================

import { chickenSales, pricePerPound, costPerPound, setPricePerPound, setCostPerPound, setChickenSales, clients, debts, movements } from './state.js';
import { saveToStorage } from './persistence.js';
// import webSocketSync from './websocket.js'; // DESHABILITADO TEMPORALMENTE

// === INICIALIZACIÓN DE POLLOS ===
export function initializeChickenData() {
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  const saleDateInput = document.getElementById('chickenSaleDate');
  
  if (priceInput) priceInput.value = pricePerPound.toFixed(2);
  if (costInput) costInput.value = costPerPound.toFixed(2);
  if (saleDateInput) {
    const today = new Date();
    saleDateInput.value = today.toISOString().slice(0,10);
  }
  
  updateChickenCalculation();
  setupChickenEventListeners();
}

// === CONFIGURAR EVENTOS DEL FORMULARIO DE POLLOS ===
function setupChickenEventListeners() {
  // Event listeners para cálculo automático
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  const weightInput = document.getElementById('chickenWeight');
  const quantityInput = document.getElementById('chickenQuantity');

  if (priceInput) {
    priceInput.addEventListener('input', updateChickenCalculation);
  }

  if (costInput) {
    costInput.addEventListener('input', updateChickenCalculation);
  }

  if (weightInput) {
    weightInput.addEventListener('input', updateChickenCalculation);
  }

  if (quantityInput) {
    quantityInput.addEventListener('input', updateChickenCalculation);
  }

  // Event listeners para forma de pago
  const cashRadio = document.getElementById('chickenCash');
  const creditRadio = document.getElementById('chickenCredit');
  const abonoSection = document.getElementById('chickenAbonoSection');

  if (cashRadio && creditRadio && abonoSection) {
    cashRadio.addEventListener('change', () => {
      abonoSection.style.display = 'none';
    });

    creditRadio.addEventListener('change', () => {
      abonoSection.style.display = 'block';
    });
  }

  // Event listener para el formulario
  const form = document.getElementById('chickenSaleForm');
  if (form) {
    form.addEventListener('submit', handleChickenSale);
  }

  // Event listeners para botones de mostrar/ocultar ganancias
  const toggleProfitBtn = document.getElementById('toggleChickenProfitBtn');
  if (toggleProfitBtn) {
    toggleProfitBtn.addEventListener('click', toggleChickenProfitVisibility);
  }

  const toggleProfitCalcBtn = document.getElementById('toggleChickenProfitCalcBtn');
  if (toggleProfitCalcBtn) {
    toggleProfitCalcBtn.addEventListener('click', toggleChickenProfitCalcVisibility);
  }

  // Event listener para actualizar costo desde merma
  const btnActualizarCosto = document.getElementById('btnActualizarCostoLibra');
  if (btnActualizarCosto) {
    btnActualizarCosto.addEventListener('click', updateCostFromMerma);
  }
}

// === ACTUALIZAR PRECIO POR LIBRA ===
export async function updatePricePerPound() {
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  const newPrice = parseFloat(priceInput.value);
  const newCost = costInput ? parseFloat(costInput.value) : 0;
  
  if (isNaN(newPrice) || newPrice < 0) {
    Swal.fire({
      icon: 'error',
      title: 'Precio inválido',
      text: 'Por favor ingresa un precio válido mayor a 0.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  if (costInput && (isNaN(newCost) || newCost < 0)) {
    Swal.fire({
      icon: 'error',
      title: 'Costo inválido',
      text: 'Por favor ingresa un costo válido mayor a 0.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  try {
    setPricePerPound(newPrice);
    setCostPerPound(newCost);
    
    if (typeof localforage !== 'undefined') {
      await localforage.setItem('pricePerPound', newPrice.toString());
      await localforage.setItem('costPerPound', newCost.toString());
    } else {
      localStorage.setItem('pricePerPound', newPrice.toString());
      localStorage.setItem('costPerPound', newCost.toString());
    }
    
    updateChickenCalculation();
    
    Swal.fire({
      icon: 'success',
      title: 'Precios actualizados',
      text: `Precio por libra: $${newPrice.toFixed(2)}\nCosto por libra: $${newCost.toFixed(2)}`,
      confirmButtonText: 'Aceptar'
    });
  } catch (error) {
    console.error('Error actualizando precios:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron actualizar los precios. Inténtalo de nuevo.',
      confirmButtonText: 'Aceptar'
    });
  }
}

// === MANEJAR VENTA DE POLLOS ===
export async function handleChickenSale(e) {
  e.preventDefault();
  
  const clientId = document.getElementById('chickenClient').value;
  const quantity = parseInt(document.getElementById('chickenQuantity').value);
  const weight = parseFloat(document.getElementById('chickenWeight').value);
  const saleDate = document.getElementById('chickenSaleDate').value;
  const pricePerPound = parseFloat(document.getElementById('pricePerPound').value);
  const costPerPound = parseFloat(document.getElementById('costPerPound').value);
  const paymentType = document.querySelector('input[name="chickenPayment"]:checked').value;
  const abono = paymentType === 'credit' ? parseFloat(document.getElementById('chickenAbono').value) || 0 : 0;
  
  // Validaciones
  if (!clientId) {
    Swal.fire({
      icon: 'error',
      title: 'Cliente requerido',
      text: 'Selecciona un cliente para la venta.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  if (!weight || weight <= 0) {
    Swal.fire({
      icon: 'error',
      title: 'Peso inválido',
      text: 'Ingresa un peso válido mayor a 0.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  if (!pricePerPound || pricePerPound <= 0) {
    Swal.fire({
      icon: 'error',
      title: 'Precio inválido',
      text: 'Configura un precio válido en la sección de configuración.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  // Calcular totales
  const total = pricePerPound * weight;
  const profit = (pricePerPound - costPerPound) * weight;
  
  // Crear objeto de venta con fecha y hora local
  let now = new Date();
  let [year, month, day] = (saleDate || now.toLocaleDateString('es-EC')).split('-');
  let localDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  );
  
  const sale = {
    id: Date.now(),
    clientId: clientId,
    clientName: clients.find(c => c.id === clientId)?.name || 'Cliente desconocido',
    quantity: quantity,
    weight: weight,
    pricePerPound: pricePerPound,
    costPerPound: costPerPound,
    total: total,
    profit: profit,
    paymentType: paymentType,
    abono: abono,
    debt: paymentType === 'credit' ? total - abono : 0,
    date: `${year}-${month}-${day}T${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`,
    time: localDate.toLocaleTimeString(),
    timestamp: localDate.toLocaleString()
  };
  
  await processChickenSale(sale);
  
  // Actualizar estadísticas y lista
  updateChickenStats();
  updateChickenSalesList();
}

// === CÁLCULO DE MERMA ===
export function setupChickenMermaCalculation() {
  const btnMermaPollo = document.getElementById('btnMermaPollo');
  if (btnMermaPollo) {
    btnMermaPollo.addEventListener('click', function() {
      const modal = new bootstrap.Modal(document.getElementById('modalMermaPollo'));
      document.getElementById('formMermaPollo').reset();
      document.getElementById('porcentajeMerma').value = '';
      document.getElementById('costoRealLibra').value = '';
      modal.show();
    });
  }

  const inputs = ['precioPluma', 'manoObra', 'pesoPluma', 'pesoPelado'];
  inputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', calcularMermaPollo);
    }
  });
}

function calcularMermaPollo() {
  const precioPluma = parseFloat(document.getElementById('precioPluma').value) || 0;
  const manoObra = parseFloat(document.getElementById('manoObra').value) || 0;
  const pesoPluma = parseFloat(document.getElementById('pesoPluma').value) || 0;
  const pesoPelado = parseFloat(document.getElementById('pesoPelado').value) || 0;
  
  let porcentajeMerma = '';
  let costoRealLibra = '';
  
  if (pesoPluma > 0 && pesoPelado > 0) {
    porcentajeMerma = ((1 - (pesoPelado / pesoPluma)) * 100).toFixed(2) + '%';
    costoRealLibra = (((precioPluma * pesoPluma) + manoObra) / pesoPelado).toFixed(2);
  }
  
  document.getElementById('porcentajeMerma').value = porcentajeMerma;
  document.getElementById('costoRealLibra').value = costoRealLibra ? `$${costoRealLibra}` : '';
}

// === FILTRO POR FECHA ===
export function setupChickenDateFilter() {
  const btnFilterChickenDate = document.getElementById('btnFilterChickenDate');
  const inputFilterChickenDate = document.getElementById('filterChickenDate');
  
  if (btnFilterChickenDate && inputFilterChickenDate) {
    btnFilterChickenDate.addEventListener('click', function() {
      const fecha = inputFilterChickenDate.value;
      if (fecha) {
        updateChickenStats({ fecha });
        updateChickenSalesList({ fecha });
      } else {
        updateChickenStats();
        updateChickenSalesList();
      }
    });
  }
}

// === PROCESAMIENTO DE VENTA DE POLLOS ===
export async function processChickenSale(sale) {
  try {
    // Agregar a la lista de ventas
    chickenSales.push(sale);
    await saveToStorage('chickenSales', chickenSales);
    
    // Sincronizar venta de pollos con WebSocket
    if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
      window.tillupWebSocketClient.send({
        action: 'sync_chicken_sale',
        data: sale
      });
      console.log('🔄 Venta de pollos enviada por WebSocket:', sale.id);
    } else {
      console.log('⚠️ WebSocket no conectado, venta no sincronizada');
    }
    
    // Si es venta a crédito, crear deuda
    if (sale.paymentType === 'credit' && sale.debt > 0) {
      const debt = {
        id: Date.now().toString(),
        clientId: sale.clientId,
        clientName: sale.clientName,
        amount: sale.debt,
        originalAmount: sale.debt,
        description: `Venta de pollos - ${sale.quantity} pollo(s), ${sale.weight} lbs`,
        date: sale.date,
        type: 'chicken_sale',
        saleId: sale.id,
        createdAt: new Date().toISOString()
      };
      
      debts.push(debt);
      await saveToStorage('debts', debts);
      
      // Sincronizar deuda con WebSocket
      if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
        window.tillupWebSocketClient.send({
          action: 'sync_debt',
          data: debt
        });
        console.log('🔄 Deuda enviada por WebSocket:', debt.id);
      }
    }
    
    // Actualizar balance y movimientos
    const movement = {
      id: Date.now().toString(),
      type: 'chicken_sale',
      amount: sale.total,
      description: `Venta de pollos - ${sale.clientName}`,
      date: sale.date,
      timestamp: new Date().toISOString(),
      details: {
        quantity: sale.quantity,
        weight: sale.weight,
        pricePerPound: sale.pricePerPound,
        profit: sale.profit,
        paymentType: sale.paymentType,
        abono: sale.abono
      }
    };
    
    movements.push(movement);
    await saveToStorage('movements', movements);
    
    // Actualizar estadísticas
    updateChickenStats();
    updateChickenSalesList();
    
    // Limpiar formulario
    document.getElementById('chickenSaleForm').reset();
    document.getElementById('chickenSaleDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('chickenQuantity').value = '1';
    document.getElementById('chickenAbonoSection').style.display = 'none';
    
    // Mostrar comprobante
    showChickenReceipt(sale);
    
  } catch (error) {
    console.error('Error procesando venta de pollos:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo procesar la venta. Inténtalo de nuevo.',
      confirmButtonText: 'Aceptar'
    });
  }
}

// === ACTUALIZAR ESTADÍSTICAS DE POLLOS ===
export function updateChickenStats(opts = {}) {
  let todayStr;
  if (opts && opts.fecha) {
    todayStr = opts.fecha;
  } else {
    const today = new Date();
    todayStr = today.toISOString().split('T')[0];
  }
  
  // Verificar que chickenSales sea un array válido
  if (!chickenSales || !Array.isArray(chickenSales)) {
    resetChickenStats();
    return;
  }
  
  // Filtrar ventas de la fecha seleccionada
  const todaySales = chickenSales.filter(sale => 
    sale && sale.date && sale.date.startsWith(todayStr)
  );
  
  // Calcular estadísticas
  const totalChickens = todaySales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
  const totalWeight = todaySales.reduce((sum, sale) => sum + (sale.weight || 0), 0);
  const totalRevenue = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const avgWeight = totalChickens > 0 ? totalWeight / totalChickens : 0;
  
  // Calcular ganancias usando los valores reales de costo y precio
  const totalProfit = todaySales.reduce((sum, sale) => {
    const profit = sale.profit || ((sale.pricePerPound || pricePerPound) - (sale.costPerPound || costPerPound)) * (sale.weight || 0);
    return sum + profit;
  }, 0);
  const profitPercentage = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  
  // Actualizar elementos en el DOM
  const totalChickensElement = document.getElementById('totalChickensSold');
  const totalWeightElement = document.getElementById('totalWeightSold');
  const totalRevenueElement = document.getElementById('totalRevenue');
  const avgWeightElement = document.getElementById('avgWeight');
  const totalProfitElement = document.getElementById('totalProfit');
  const totalProfitTodayElement = document.getElementById('totalProfitToday');
  const profitMarginElement = document.getElementById('profitMargin');
  
  if (totalChickensElement) totalChickensElement.textContent = totalChickens;
  if (totalWeightElement) totalWeightElement.textContent = totalWeight.toFixed(1);
  if (totalRevenueElement) totalRevenueElement.textContent = `$${totalRevenue.toFixed(2)}`;
  if (avgWeightElement) avgWeightElement.textContent = avgWeight.toFixed(1);
  
  // Ganancias hoy y total: mostrar como oculto si corresponde
  if (totalProfitElement) {
    const isHidden = totalProfitElement.classList.contains('hidden-profit');
    totalProfitElement.textContent = isHidden ? '•••••' : `$${totalProfit.toFixed(2)}`;
    totalProfitElement.setAttribute('data-actual-value', `$${totalProfit.toFixed(2)}`);
  }
  if (totalProfitTodayElement) {
    totalProfitTodayElement.textContent = `$${totalProfit.toFixed(2)}`;
    totalProfitTodayElement.setAttribute('data-actual-value', `$${totalProfit.toFixed(2)}`);
    totalProfitTodayElement.classList.remove('hidden-profit-today');
  }
  if (profitMarginElement) profitMarginElement.textContent = `${profitPercentage.toFixed(1)}%`;
}

// === RESETEAR ESTADÍSTICAS DE POLLOS ===
function resetChickenStats() {
  const elements = [
    'totalChickensSold', 'totalWeightSold', 'totalRevenue', 'avgWeight',
    'totalProfit', 'profitMargin', 'profitPerChicken'
  ];
  
  elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      if (id.includes('Profit') || id.includes('Margin')) {
        element.textContent = id.includes('Margin') ? '0%' : '$0.00';
      } else if (id.includes('Weight') || id.includes('Chickens')) {
        element.textContent = '0';
      } else if (id.includes('avgWeight')) {
        element.textContent = '0.0';
      } else {
        element.textContent = '$0.00';
      }
    }
  });
}

// === ACTUALIZAR LISTA DE VENTAS DE POLLOS ===
export function updateChickenSalesList(opts = {}) {
  const container = document.getElementById('chickenSalesList');
  const countElement = document.getElementById('chickenSalesCount');
  
  if (!container) return;
  
  // Verificar que chickenSales sea un array válido
  if (!chickenSales || !Array.isArray(chickenSales)) {
    if (countElement) {
      countElement.textContent = '0 ventas';
    }
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-egg-fried" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">No hay ventas de pollos registradas</p>
      </div>
    `;
    return;
  }
  
  // Filtrar por fecha si se especifica
  let filteredSales = [...chickenSales];
  if (opts && opts.fecha) {
    filteredSales = chickenSales.filter(sale => 
      sale && sale.date && sale.date.startsWith(opts.fecha)
    );
  } else {
    // Por defecto, mostrar solo ventas de hoy
    const today = new Date().toISOString().split('T')[0];
    filteredSales = chickenSales.filter(sale => 
      sale && sale.date && sale.date.startsWith(today)
    );
  }
  
  // Ordenar por fecha más reciente
  filteredSales.sort((a, b) => {
    if (!a || !b || !a.date || !b.date) return 0;
    return new Date(b.date) - new Date(a.date);
  });
  
  if (countElement) {
    const periodText = opts && opts.fecha ? 
      `del ${new Date(opts.fecha).toLocaleDateString()}` : 
      'de hoy';
    countElement.textContent = `${filteredSales.length} ventas ${periodText}`;
  }
  
  if (filteredSales.length === 0) {
    const periodText = opts && opts.fecha ? 
      `del ${new Date(opts.fecha).toLocaleDateString()}` : 
      'hoy';
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-egg-fried" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">No hay ventas de pollos ${periodText}</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filteredSales.map((sale, idx) => `
    <div class="chicken-sale-item-treinta">
      <div class="chicken-sale-header-treinta">
        <div class="chicken-sale-client-treinta">
          <i class="bi bi-person"></i>
          ${sale.clientName}
        </div>
        <div class="chicken-sale-date-treinta">
          ${new Date(sale.date).toLocaleDateString()} ${sale.time}
        </div>
        <div class="chicken-sale-actions">
          <button class="btn btn-sm btn-outline-primary" title="Editar" onclick="editChickenSale(${chickenSales.indexOf(sale)})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" title="Eliminar" onclick="deleteChickenSale(${chickenSales.indexOf(sale)})">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
      
      <div class="chicken-sale-details-treinta">
        <div class="chicken-sale-detail-treinta">
          <div class="chicken-sale-detail-label-treinta">Cantidad</div>
          <div class="chicken-sale-detail-value-treinta">${sale.quantity} pollo(s)</div>
        </div>
        <div class="chicken-sale-detail-treinta">
          <div class="chicken-sale-detail-label-treinta">Peso Total</div>
          <div class="chicken-sale-detail-value-treinta">${sale.weight} lbs</div>
        </div>
        <div class="chicken-sale-detail-treinta">
          <div class="chicken-sale-detail-label-treinta">Precio/Lb</div>
          <div class="chicken-sale-detail-value-treinta">$${sale.pricePerPound.toFixed(2)}</div>
        </div>
        <div class="chicken-sale-detail-treinta">
          <div class="chicken-sale-detail-label-treinta">Peso Promedio</div>
          <div class="chicken-sale-detail-value-treinta">${(sale.weight / sale.quantity).toFixed(1)} lbs</div>
        </div>
      </div>
      
      <div class="chicken-sale-total-treinta">
        <div class="chicken-sale-total-label-treinta">Total</div>
        <div class="chicken-sale-total-amount-treinta">$${sale.total.toFixed(2)}</div>
      </div>
      
      <div class="chicken-sale-payment-treinta ${sale.paymentType}">
        <i class="bi bi-${getPaymentIcon(sale.paymentType)}"></i>
        ${getPaymentText(sale.paymentType)}
        ${sale.paymentType === 'credit' && sale.abono > 0 ? ` (Abono: $${sale.abono.toFixed(2)})` : ''}
      </div>
    </div>
  `).join('');
}

// === ACTUALIZAR CÁLCULO AUTOMÁTICO ===
export function updateChickenCalculation() {
  const weightInput = document.getElementById('chickenWeight');
  const displayPrice = document.getElementById('displayPricePerPound');
  const displayCost = document.getElementById('displayCostPerPound');
  const displayProfitPerPound = document.getElementById('displayProfitPerPound');
  const displayTotal = document.getElementById('displayTotalAmount');
  const displayTotalProfit = document.getElementById('displayTotalProfit');
  
  if (!weightInput || !displayPrice || !displayTotal) return;
  
  // Obtener valores de la configuración de precio
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  
  if (!priceInput || !costInput) return;
  
  const price = parseFloat(priceInput.value) || 0;
  const cost = parseFloat(costInput.value) || 0;
  const weight = parseFloat(weightInput.value) || 0;
  const total = price * weight;
  const profitPerPound = price - cost;
  const totalProfit = profitPerPound * weight;
  
  displayPrice.textContent = `$${price.toFixed(2)}`;
  displayCost.textContent = `$${cost.toFixed(2)}`;
  displayProfitPerPound.textContent = `$${profitPerPound.toFixed(2)}`;
  displayProfitPerPound.setAttribute('data-actual-value', `$${profitPerPound.toFixed(2)}`);
  displayTotal.textContent = `$${total.toFixed(2)}`;
  
  // Ganancia total: solo mostrar el valor real si NO está oculta
  displayTotalProfit.setAttribute('data-actual-value', `$${totalProfit.toFixed(2)}`);
  if (displayTotalProfit.classList.contains('hidden-profit-calc')) {
    displayTotalProfit.textContent = '•••••';
  } else {
    displayTotalProfit.textContent = `$${totalProfit.toFixed(2)}`;
  }
}

// === FUNCIONES DE VISIBILIDAD DE GANANCIAS ===
export function toggleChickenProfitVisibility() {
  const profitElement = document.getElementById('totalProfit');
  const eyeIcon = document.querySelector('#toggleChickenProfitBtn i');
  
  if (profitElement && eyeIcon) {
    const isHidden = profitElement.classList.contains('hidden-profit');
    const actualValue = profitElement.getAttribute('data-actual-value') || '$0.00';
    
    if (isHidden) {
      profitElement.textContent = actualValue;
      profitElement.classList.remove('hidden-profit');
      eyeIcon.className = 'bi bi-eye-slash';
    } else {
      profitElement.textContent = '•••••';
      profitElement.classList.add('hidden-profit');
      eyeIcon.className = 'bi bi-eye';
    }
  }
}

export function toggleChickenProfitCalcVisibility() {
  const profitElement = document.getElementById('displayTotalProfit');
  const eyeIcon = document.querySelector('#toggleChickenProfitCalcBtn i');
  
  if (profitElement && eyeIcon) {
    const isHidden = profitElement.classList.contains('hidden-profit-calc');
    const actualValue = profitElement.getAttribute('data-actual-value') || '$0.00';
    
    if (isHidden) {
      profitElement.textContent = actualValue;
      profitElement.classList.remove('hidden-profit-calc');
      eyeIcon.className = 'bi bi-eye-slash';
    } else {
      profitElement.textContent = '•••••';
      profitElement.classList.add('hidden-profit-calc');
      eyeIcon.className = 'bi bi-eye';
    }
  }
}

// === ELIMINAR VENTA DE POLLOS ===
export async function deleteChickenSale(index) {
  if (!chickenSales || !Array.isArray(chickenSales) || index < 0 || index >= chickenSales.length) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Venta no encontrada.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const sale = chickenSales[index];
  const result = await Swal.fire({
    title: '¿Eliminar venta?',
    text: `¿Estás seguro de eliminar la venta de ${sale.clientName}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    chickenSales.splice(index, 1);
    await saveToStorage('chickenSales', chickenSales);
    updateChickenStats();
    updateChickenSalesList();
    
    Swal.fire({
      icon: 'success',
      title: 'Venta eliminada',
      text: 'La venta ha sido eliminada correctamente.',
      confirmButtonText: 'Aceptar'
    });
  }
}

// === EDITAR VENTA DE POLLOS ===
export async function editChickenSale(index) {
  if (!chickenSales || !Array.isArray(chickenSales) || index < 0 || index >= chickenSales.length) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Venta no encontrada.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const sale = chickenSales[index];
  const clientOptions = clients.map(client => 
    `<option value="${client.id}" ${client.id === sale.clientId ? 'selected' : ''}>${client.name}</option>`
  ).join('');

  const { value: formValues } = await Swal.fire({
    title: 'Editar Venta de Pollos',
    html: `
      <div class="text-start">
        <div class="mb-3">
          <label class="form-label">Fecha de Facturación</label>
          <input id="editDate" type="date" class="form-control" value="${sale.date ? sale.date.split('T')[0] : ''}">
        </div>
        <div class="mb-3">
          <label class="form-label">Cliente</label>
          <select id="editClientId" class="form-select">
            ${clientOptions}
          </select>
        </div>
        <div class="row">
          <div class="col-6">
            <label class="form-label">Cantidad</label>
            <input id="editQuantity" type="number" class="form-control" value="${sale.quantity}" min="1">
          </div>
          <div class="col-6">
            <label class="form-label">Peso (lbs)</label>
            <input id="editWeight" type="number" class="form-control" value="${sale.weight}" step="0.01" min="0.01">
          </div>
        </div>
        <div class="row mt-3">
          <div class="col-6">
            <label class="form-label">Precio/Lb</label>
            <input id="editPrice" type="number" class="form-control" value="${sale.pricePerPound}" step="0.01" min="0.01">
          </div>
          <div class="col-6">
            <label class="form-label">Costo/Lb</label>
            <input id="editCost" type="number" class="form-control" value="${sale.costPerPound}" step="0.01" min="0">
          </div>
        </div>
        <div class="mt-3">
          <label class="form-label">Forma de Pago</label>
          <select id="editPayment" class="form-select">
            <option value="cash" ${sale.paymentType === 'cash' ? 'selected' : ''}>Efectivo</option>
            <option value="credit" ${sale.paymentType === 'credit' ? 'selected' : ''}>Crédito</option>
          </select>
        </div>
        <div class="mt-3" id="editAbonoSection" style="display: ${sale.paymentType === 'credit' ? 'block' : 'none'}">
          <label class="form-label">Abono Inicial</label>
          <input id="editAbono" type="number" class="form-control" value="${sale.abono || 0}" step="0.01" min="0">
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar Cambios',
    cancelButtonText: 'Cancelar',
    didOpen: () => {
      const paymentSelect = document.getElementById('editPayment');
      const abonoSection = document.getElementById('editAbonoSection');
      paymentSelect.addEventListener('change', () => {
        abonoSection.style.display = paymentSelect.value === 'credit' ? 'block' : 'none';
      });
    },
    preConfirm: () => {
      const date = document.getElementById('editDate').value;
      const clientId = document.getElementById('editClientId').value;
      const quantity = parseInt(document.getElementById('editQuantity').value);
      const weight = parseFloat(document.getElementById('editWeight').value);
      const price = parseFloat(document.getElementById('editPrice').value);
      const cost = parseFloat(document.getElementById('editCost').value);
      const payment = document.getElementById('editPayment').value;
      const abono = parseFloat(document.getElementById('editAbono').value) || 0;

      if (!date || !clientId || !quantity || !weight || !price) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }

      return { date, clientId, quantity, weight, price, cost, payment, abono };
    }
  });

  if (formValues) {
    const client = clients.find(c => c.id === formValues.clientId);
    const total = formValues.price * formValues.weight;
    const profit = (formValues.price - formValues.cost) * formValues.weight;
    const debt = formValues.payment === 'credit' ? total - formValues.abono : 0;

    // Actualizar la venta
    chickenSales[index] = {
      ...sale,
      date: formValues.date + 'T' + (sale.date ? sale.date.split('T')[1] : '12:00:00'),
      clientId: formValues.clientId,
      clientName: client ? client.name : 'Cliente desconocido',
      quantity: formValues.quantity,
      weight: formValues.weight,
      pricePerPound: formValues.price,
      costPerPound: formValues.cost,
      total: total,
      profit: profit,
      paymentType: formValues.payment,
      abono: formValues.abono,
      debt: debt
    };

    await saveToStorage('chickenSales', chickenSales);
    updateChickenStats();
    updateChickenSalesList();

    Swal.fire({
      icon: 'success',
      title: 'Venta actualizada',
      text: 'Los cambios han sido guardados correctamente.',
      confirmButtonText: 'Aceptar'
    });
  }
}

// === ACTUALIZAR COSTO DESDE MERMA ===
export function updateCostFromMerma() {
  const costoRealInput = document.getElementById('costoRealLibra');
  const costInput = document.getElementById('costPerPound');
  
  if (costoRealInput && costInput) {
    const costoReal = costoRealInput.value.replace('$', '');
    const costoNumerico = parseFloat(costoReal);
    
    if (!isNaN(costoNumerico) && costoNumerico > 0) {
      costInput.value = costoNumerico.toFixed(2);
      setCostPerPound(costoNumerico);
      
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalMermaPollo'));
      if (modal) modal.hide();
      
      // Actualizar cálculo
      updateChickenCalculation();
      
      Swal.fire({
        icon: 'success',
        title: 'Costo actualizado',
        text: `Nuevo costo por libra: $${costoNumerico.toFixed(2)}`,
        confirmButtonText: 'Aceptar'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Primero calcula la merma para obtener el costo real.',
        confirmButtonText: 'Aceptar'
      });
    }
  }
}

// === FUNCIONES AUXILIARES ===
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
  }).then((result) => {
    if (result.isConfirmed) {
      console.log('Imprimir comprobante');
    } else if (result.isDenied) {
      console.log('Descargar PDF');
    }
  });
}