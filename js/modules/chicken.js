// ========================================
// 🐔 GESTIÓN ESPECIALIZADA DE POLLOS
// ========================================

import { chickenSales, pricePerPound, costPerPound, setPricePerPound, setCostPerPound, setChickenSales, clients, debts, movements, setDebts } from './state.js';
import { saveToStorage } from './persistence.js';
import { getLocalDateString, getLocalDateTime } from './utils.js';
// import webSocketSync from './websocket.js'; // DESHABILITADO TEMPORALMENTE

// === INICIALIZACIÓN DE POLLOS ===
export async function initializeChickenData() {
  // Solicitar sincronización inmediata al inicializar
  if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
    window.tillupWebSocketClient.requestDataFromAllDevices();
  }
  
  // Cargar precios guardados desde localStorage
  try {
    const savedPrice = localStorage.getItem('pricePerPound');
    const savedCost = localStorage.getItem('costPerPound');
    
    if (savedPrice) {
      const price = parseFloat(savedPrice);
      if (!isNaN(price) && price > 0) {
        setPricePerPound(price);
      }
    }
    
    if (savedCost) {
      const cost = parseFloat(savedCost);
      if (!isNaN(cost) && cost >= 0) {
        setCostPerPound(cost);
      }
    }
  } catch (error) {
    console.warn('Error cargando precios guardados:', error);
  }
  
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  const saleDateInput = document.getElementById('chickenSaleDate');
  
  if (priceInput) priceInput.value = pricePerPound.toFixed(2);
  if (costInput) costInput.value = costPerPound.toFixed(2);
  if (saleDateInput) {
    saleDateInput.value = getLocalDateString();
  }
  
  updateChickenCalculation();
  setupChickenEventListeners();
}

// === CONFIGURAR EVENTOS DEL FORMULARIO DE POLLOS ===
function setupChickenEventListeners() {
  // Event listeners para cálculo automático y guardado
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  const weightInput = document.getElementById('chickenWeight');
  const quantityInput = document.getElementById('chickenQuantity');

  if (priceInput) {
    priceInput.addEventListener('input', () => {
      updateChickenCalculation();
      // Guardar y sincronizar automáticamente el precio
      const price = parseFloat(priceInput.value);
      if (!isNaN(price) && price >= 0) {
        setPricePerPound(price);
        localStorage.setItem('pricePerPound', price.toString());
        // Sincronizar precio instantáneamente mientras se escribe
        syncChickenPricesInstant();
      }
    });
  }

  if (costInput) {
    costInput.addEventListener('input', () => {
      updateChickenCalculation();
      // Guardar y sincronizar automáticamente el costo
      const cost = parseFloat(costInput.value);
      if (!isNaN(cost) && cost >= 0) {
        setCostPerPound(cost);
        localStorage.setItem('costPerPound', cost.toString());
        // Sincronizar costo instantáneamente mientras se escribe
        syncChickenPricesInstant();
      }
    });
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
    // Actualizar estado en memoria
    setPricePerPound(newPrice);
    setCostPerPound(newCost);
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('pricePerPound', newPrice.toString());
    localStorage.setItem('costPerPound', newCost.toString());
    
    // Actualizar cálculo automático
    updateChickenCalculation();
    
    // Sincronizar precios instantáneamente
    syncChickenPricesInstant();
    
    console.log('✅ Precios guardados:', { precio: newPrice, costo: newCost });
    
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
  
  // Crear objeto de venta con fecha y hora local correcta
  const dateTime = getLocalDateTime();
  const finalDate = saleDate || dateTime.date;
  
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
    date: `${finalDate}T${dateTime.time}`,
    time: dateTime.time,
    timestamp: dateTime.timestamp
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
        reason: `Venta de pollos - ${sale.quantity} pollo(s), ${sale.weight} lbs`,
        date: sale.date,
        type: 'chicken_sale',
        saleId: sale.id,
        createdAt: getLocalDateTime().timestamp
      };
      
      debts.push(debt);
      setDebts(debts);
      await saveToStorage('debts', debts);
      
      // Sincronizar con WebSocket igual que clientes
      if (window.syncManager && window.syncManager.isEnabled) {
        window.syncManager.syncDebt(debt);
      }
    }
    
    // Actualizar balance y movimientos
    const movement = {
      id: Date.now().toString(),
      type: 'chicken_sale',
      amount: sale.total,
      description: `Venta de pollos - ${sale.clientName}`,
      date: sale.date,
      timestamp: getLocalDateTime().timestamp,
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
    
    // Actualizar UI de deudas
    if (typeof window.renderDebts === 'function') {
      window.renderDebts();
    }
    if (typeof window.updateBalanceUI === 'function') {
      window.updateBalanceUI();
    }
    

    
    // Limpiar formulario
    document.getElementById('chickenSaleForm').reset();
    document.getElementById('chickenSaleDate').value = getLocalDateString();
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
    todayStr = getLocalDateString();
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
          <p class="text-muted mt-2">${sanitizeHTML('No hay ventas de pollos registradas')}</p>         
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
    // Por defecto, mostrar todas las ventas (no filtrar por fecha)
    filteredSales = [...chickenSales];
  }
  
  // Ordenar por fecha más reciente
  filteredSales.sort((a, b) => {
    if (!a || !b || !a.date || !b.date) return 0;
    return new Date(b.date) - new Date(a.date);
  });
  
  if (countElement) {
    const periodText = opts && opts.fecha ? 
      `del ${new Date(opts.fecha).toLocaleDateString()}` : 
      'registradas';
    countElement.textContent = `${filteredSales.length} ventas ${periodText}`;
  }
  
  if (filteredSales.length === 0) {
    const periodText = opts && opts.fecha ? 
      `del ${new Date(opts.fecha).toLocaleDateString()}` : 
      'registradas';
      container.innerHTML = `            
        <div class="text-center py-4">   
          <i class="bi bi-egg-fried" style="font-size: 3rem; color: #ccc;"></i>      
          <p class="text-muted mt-2">${sanitizeHTML('No hay ventas de pollos ' + String(periodText))}</p>       
        </div>
      `;
    return;
  }
  
    container.innerHTML = filteredSales.map((sale, idx) => `   
      <div class="chicken-sale-item-treinta">                  
        <div class="chicken-sale-header-treinta">              
          <div class="chicken-sale-client-treinta">            
            <i class="bi bi-person"></i>                       
            ${sanitizeHTML(String(sale.clientName || ''))}           
          </div>
          <div class="chicken-sale-date-treinta">              
            ${sanitizeHTML(new Date(sale.date).toLocaleDateString() + ' ' + String(sale.time || ''))}                 
          </div>
          <div class="chicken-sale-actions">                   
            <button class="btn btn-sm btn-outline-primary" title="Editar" onclick="editChickenSale(${sanitizeHTML(String(chickenSales.indexOf(sale)))})">                    
              <i class="bi bi-pencil"></i>                     
            </button>                    
            <button class="btn btn-sm btn-outline-danger" title="Eliminar" onclick="deleteChickenSale(${sanitizeHTML(String(chickenSales.indexOf(sale)))})">                 
              <i class="bi bi-trash"></i>                      
            </button>                    
          </div>
        </div>
        
        <div class="chicken-sale-details-treinta">             
          <div class="chicken-sale-detail-treinta">            
            <div class="chicken-sale-detail-label-treinta">Cantidad</div>            
            <div class="chicken-sale-detail-value-treinta">${sanitizeHTML(String(sale.quantity || 0))} pollo(s)</div>            
          </div>
          <div class="chicken-sale-detail-treinta">            
            <div class="chicken-sale-detail-label-treinta">Peso Total</div>          
            <div class="chicken-sale-detail-value-treinta">${sanitizeHTML(String((sale.weight || 0)))} lbs</div>                 
          </div>
          <div class="chicken-sale-detail-treinta">            
            <div class="chicken-sale-detail-label-treinta">Precio/Lb</div>           
            <div class="chicken-sale-detail-value-treinta">$${(sale.pricePerPound || 0).toFixed(2)}</div>                        
          </div>
          <div class="chicken-sale-detail-treinta">            
            <div class="chicken-sale-detail-label-treinta">Peso Promedio</div>       
            <div class="chicken-sale-detail-value-treinta">${sanitizeHTML(String(((sale.weight || 0) / (sale.quantity || 1)).toFixed(1)))} lbs</div>   
          </div>
        </div>
        
        <div class="chicken-sale-total-treinta">               
          <div class="chicken-sale-total-label-treinta">Total</div>                  
          <div class="chicken-sale-total-amount-treinta">$${(sale.total || 0).toFixed(2)}</div>            
        </div>
        
        <div class="chicken-sale-payment-treinta ${sanitizeHTML(String(sale.paymentType || ''))}">               
          <i class="bi bi-${sanitizeHTML(String(getPaymentIcon(sale.paymentType)))}"></i>                  
          ${sanitizeHTML(String(getPaymentText(sale.paymentType) || ''))}                  
          ${sale.paymentType === 'credit' && (sale.abono || 0) > 0 ? ` (Abono: $${(sale.abono || 0).toFixed(2)})` : ''}          
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

// === ACTUALIZAR DATOS DESDE STORAGE ===
export function updateChickenSalesFromStorage() {
  try {
    const storedSales = JSON.parse(localStorage.getItem('chickenSales') || '[]');
    if (Array.isArray(storedSales)) {
      setChickenSales(storedSales);
      updateChickenStats();
      updateChickenSalesList();
    }
  } catch (error) {
    console.error('Error actualizando ventas de pollos desde storage:', error);
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
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('costPerPound', costoNumerico.toString());
      
      // Sincronizar precios instantáneamente
      syncChickenPricesInstant();
      
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalMermaPollo'));
      if (modal) modal.hide();
      
      // Actualizar cálculo
      updateChickenCalculation();
      
      console.log('✅ Costo actualizado desde merma:', costoNumerico);
      
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

// === IMPRIMIR COMPROBANTE ===
function printChickenReceipt(receiptHtml) {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comprobante de Venta - TillUp</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .modern-receipt { max-width: 400px; margin: 0 auto; }
        .receipt-header-modern { text-align: center; margin-bottom: 20px; }
        .receipt-brand { display: flex; align-items: center; justify-content: center; gap: 15px; }
        .receipt-logo-modern { width: 50px; height: 50px; border-radius: 10px; }
        .brand-name { margin: 0; color: #0d6efd; font-size: 24px; }
        .brand-subtitle { margin: 0; color: #6c757d; font-size: 12px; }
        .receipt-meta { margin-top: 15px; }
        .receipt-number { font-weight: bold; font-size: 16px; }
        .receipt-date, .receipt-time { color: #6c757d; font-size: 14px; }
        .receipt-divider { border-top: 2px dashed #dee2e6; margin: 15px 0; }
        .receipt-client-modern { display: flex; align-items: center; gap: 15px; }
        .client-icon i { font-size: 24px; color: #0d6efd; }
        .client-name { font-weight: bold; font-size: 16px; }
        .items-header h4 { margin: 0 0 15px 0; color: #495057; }
        .item-card { border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; }
        .item-main { margin-bottom: 10px; }
        .item-title { font-weight: bold; font-size: 16px; }
        .item-specs { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 5px; }
        .spec { font-size: 12px; color: #6c757d; }
        .item-pricing { text-align: right; }
        .price-per-unit { color: #6c757d; font-size: 14px; }
        .item-total { font-weight: bold; font-size: 18px; color: #198754; }
        .receipt-summary { }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .total-row { border-top: 2px solid #dee2e6; padding-top: 8px; font-weight: bold; font-size: 18px; }
        .total-amount { color: #198754; }
        .payment-info-modern { }
        .payment-method { display: flex; align-items: center; gap: 15px; }
        .payment-icon i { font-size: 24px; color: #0d6efd; }
        .payment-type { font-weight: bold; }
        .payment-breakdown { margin-top: 10px; }
        .payment-line { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .debt { font-weight: bold; }
        .receipt-footer-modern { text-align: center; margin-top: 20px; }
        .thank-you { font-size: 16px; margin-bottom: 10px; }
        .footer-note { color: #6c757d; font-size: 12px; margin-bottom: 15px; }
        .qr-placeholder { }
        .qr-code i { font-size: 30px; color: #6c757d; }
        @media print {
          body { margin: 0; padding: 10px; }
          .modern-receipt { max-width: 100%; }
        }
      </style>
    </head>
    <body>
      ${receiptHtml}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// === DESCARGAR PDF ===
function downloadChickenReceiptPDF(sale) {
  if (typeof jsPDF === 'undefined') {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'La librería PDF no está disponible.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Configuración
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPos = 30;
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(13, 110, 253);
  doc.text('TillUp POS', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setTextColor(108, 117, 125);
  doc.text('Sistema de Gestión de Ventas', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 20;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('COMPROBANTE DE VENTA DE POLLOS', pageWidth / 2, yPos, { align: 'center' });
  
  // Información del ticket
  yPos += 20;
  doc.setFontSize(10);
  doc.text(`Ticket #${sale.id.toString().slice(-6)}`, margin, yPos);
  doc.text(`Fecha: ${new Date(sale.date).toLocaleDateString()}`, pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 10;
  doc.text(`Hora: ${sale.time}`, pageWidth - margin, yPos, { align: 'right' });
  
  // Cliente
  yPos += 20;
  doc.setFontSize(12);
  doc.text(`Cliente: ${sale.clientName}`, margin, yPos);
  
  // Línea divisoria
  yPos += 15;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  // Detalles del producto
  yPos += 15;
  doc.setFontSize(14);
  doc.text('DETALLE DE VENTA', margin, yPos);
  
  yPos += 15;
  doc.setFontSize(10);
  doc.text('Producto: Pollos Frescos', margin, yPos);
  
  yPos += 10;
  doc.text(`Cantidad: ${sale.quantity} unidad${sale.quantity > 1 ? 'es' : ''}`, margin, yPos);
  
  yPos += 10;
  doc.text(`Peso total: ${sale.weight} lbs`, margin, yPos);
  
  yPos += 10;
  doc.text(`Peso promedio: ${(sale.weight / sale.quantity).toFixed(1)} lbs`, margin, yPos);
  
  yPos += 10;
  doc.text(`Precio por libra: $${sale.pricePerPound.toFixed(2)}`, margin, yPos);
  
  // Total
  yPos += 20;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 15;
  doc.setFontSize(16);
  doc.text('TOTAL:', margin, yPos);
  doc.text(`$${sale.total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  
  // Método de pago
  yPos += 20;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 15;
  doc.setFontSize(12);
  doc.text(`Método de pago: ${getPaymentText(sale.paymentType)}`, margin, yPos);
  
  if (sale.paymentType === 'credit') {
    yPos += 10;
    if (sale.abono > 0) {
      doc.text(`Abono inicial: $${sale.abono.toFixed(2)}`, margin, yPos);
      yPos += 10;
      doc.text(`Saldo pendiente: $${(sale.total - sale.abono).toFixed(2)}`, margin, yPos);
    } else {
      doc.text(`Saldo pendiente: $${sale.total.toFixed(2)}`, margin, yPos);
    }
  }
  
  // Footer
  yPos += 30;
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text('¡Gracias por su preferencia!', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.text('Conserve este comprobante para cualquier reclamo', pageWidth / 2, yPos, { align: 'center' });
  
  // Descargar
  doc.save(`comprobante-pollos-${sale.id}.pdf`);
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

// === SINCRONIZACIÓN DE PRECIOS ===
function syncChickenPrices() {
  if (window.syncManager && window.syncManager.isEnabled) {
    const pricesData = {
      id: 'chicken_prices_config',
      pricePerPound: pricePerPound,
      costPerPound: costPerPound,
      timestamp: Date.now()
    };
    
    window.syncManager.syncChickenPrices(pricesData);
    console.log('🔄 Precios sincronizados individualmente:', pricesData);
  }
}

// === SINCRONIZACIÓN INSTANTÁNEA DE PRECIOS ===
function syncChickenPricesInstant() {
  if (window.syncManager && window.syncManager.isEnabled) {
    const priceInput = document.getElementById('pricePerPound');
    const costInput = document.getElementById('costPerPound');
    
    const currentPrice = priceInput ? parseFloat(priceInput.value) : pricePerPound;
    const currentCost = costInput ? parseFloat(costInput.value) : costPerPound;
    
    const pricesData = {
      id: 'chicken_prices_config',
      pricePerPound: !isNaN(currentPrice) ? currentPrice : pricePerPound,
      costPerPound: !isNaN(currentCost) ? currentCost : costPerPound,
      timestamp: Date.now()
    };
    
    window.syncManager.syncChickenPrices(pricesData);
    console.log('⚡ Precios sincronizados instantáneamente:', pricesData);
  }
}

// === RECIBIR PRECIOS SINCRONIZADOS ===
export function receiveChickenPrices(data) {
  if (data && typeof data.pricePerPound === 'number' && typeof data.costPerPound === 'number') {
    // Actualizar estado
    setPricePerPound(data.pricePerPound);
    setCostPerPound(data.costPerPound);
    
    // Guardar en localStorage
    localStorage.setItem('pricePerPound', data.pricePerPound.toString());
    localStorage.setItem('costPerPound', data.costPerPound.toString());
    
    // Actualizar inputs inmediatamente
    const priceInput = document.getElementById('pricePerPound');
    const costInput = document.getElementById('costPerPound');
    
    if (priceInput) priceInput.value = data.pricePerPound.toFixed(2);
    if (costInput) costInput.value = data.costPerPound.toFixed(2);
    
    // Actualizar displays de cálculo
    const displayPrice = document.getElementById('displayPricePerPound');
    const displayCost = document.getElementById('displayCostPerPound');
    
    if (displayPrice) displayPrice.textContent = `$${data.pricePerPound.toFixed(2)}`;
    if (displayCost) displayCost.textContent = `$${data.costPerPound.toFixed(2)}`;
    
    updateChickenCalculation();
    
    console.log('✅ Precios sincronizados y renderizados:', data);
  }
}

// Exponer funciones globalmente
window.receiveChickenPrices = receiveChickenPrices;

function showChickenReceipt(sale) {
  const avgWeight = (sale.weight / sale.quantity).toFixed(1);
  const receiptHtml = `
    <div class="modern-receipt">
      <div class="receipt-header-modern">
        <div class="receipt-brand">
          <img src="TillUp.png" alt="TillUp" class="receipt-logo-modern">
          <div class="brand-info">
            <h2 class="brand-name">TillUp POS</h2>
            <p class="brand-subtitle">Sistema de Gestión de Ventas</p>
          </div>
        </div>
        <div class="receipt-meta">
          <div class="receipt-number">Ticket #${sale.id.toString().slice(-6)}</div>
          <div class="receipt-date">${new Date(sale.date).toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</div>
          <div class="receipt-time">${sale.time}</div>
        </div>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-client-modern">
        <div class="client-icon">
          <i class="bi bi-person-circle"></i>
        </div>
        <div class="client-info">
          <div class="client-label">Cliente</div>
          <div class="client-name">${sale.clientName}</div>
        </div>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-items-modern">
        <div class="items-header">
          <h4><i class="bi bi-egg-fried text-warning"></i> Detalle de Venta</h4>
        </div>
        
        <div class="item-card">
          <div class="item-main">
            <div class="item-title">Pollos Frescos</div>
            <div class="item-specs">
              <span class="spec"><i class="bi bi-123"></i> ${sale.quantity} unidad${sale.quantity > 1 ? 'es' : ''}</span>
              <span class="spec"><i class="bi bi-speedometer2"></i> ${sale.weight} lbs total</span>
              <span class="spec"><i class="bi bi-calculator"></i> ${avgWeight} lbs promedio</span>
            </div>
          </div>
          <div class="item-pricing">
            <div class="price-per-unit">$${sale.pricePerPound.toFixed(2)}/lb</div>
            <div class="item-total">$${sale.total.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-summary">
        <div class="summary-row">
          <span class="summary-label">Subtotal</span>
          <span class="summary-value">$${sale.total.toFixed(2)}</span>
        </div>
        <div class="summary-row total-row">
          <span class="summary-label">TOTAL</span>
          <span class="summary-value total-amount">$${sale.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="payment-info-modern">
        <div class="payment-method">
          <div class="payment-icon">
            <i class="bi bi-${getPaymentIcon(sale.paymentType)}"></i>
          </div>
          <div class="payment-details">
            <div class="payment-type">${getPaymentText(sale.paymentType)}</div>
            ${sale.paymentType === 'credit' ? `
              <div class="payment-breakdown">
                <div class="payment-line">
                  <span>Total:</span>
                  <span>$${sale.total.toFixed(2)}</span>
                </div>
                ${sale.abono > 0 ? `
                  <div class="payment-line">
                    <span>Abono inicial:</span>
                    <span class="text-success">$${sale.abono.toFixed(2)}</span>
                  </div>
                  <div class="payment-line debt">
                    <span>Saldo pendiente:</span>
                    <span class="text-danger">$${(sale.total - sale.abono).toFixed(2)}</span>
                  </div>
                ` : `
                  <div class="payment-line debt">
                    <span>Saldo pendiente:</span>
                    <span class="text-danger">$${sale.total.toFixed(2)}</span>
                  </div>
                `}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      
      <div class="receipt-footer-modern">
        <div class="thank-you">
          <i class="bi bi-heart-fill text-danger"></i>
          <span>¡Gracias por su preferencia!</span>
        </div>
        <div class="footer-note">
          <small>Conserve este comprobante para cualquier reclamo</small>
        </div>
        <div class="qr-placeholder">
          <div class="qr-code">
            <i class="bi bi-qr-code"></i>
          </div>
          <small>Código QR para seguimiento</small>
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    title: '✅ Venta Completada',
    html: receiptHtml,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-printer"></i> Imprimir',
    cancelButtonText: '<i class="bi bi-x-circle"></i> Cerrar',
    showDenyButton: true,
    denyButtonText: '<i class="bi bi-file-earmark-pdf"></i> PDF',
    width: 600,
    customClass: {
      popup: 'modern-receipt-popup',
      confirmButton: 'btn btn-primary btn-lg',
      cancelButton: 'btn btn-outline-secondary btn-lg',
      denyButton: 'btn btn-outline-success btn-lg'
    },
    buttonsStyling: false
  }).then((result) => {
    if (result.isConfirmed) {
      printChickenReceipt(receiptHtml);
    } else if (result.isDenied) {
      downloadChickenReceiptPDF(sale);
    }
  });
}