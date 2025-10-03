// ========================================
// 🎨 MÓDULO DE RENDERIZADO
// ========================================

import { products, clients, sales, debts, cart, currentClientId } from './state.js';
import { formatCurrency, generateId } from './utils.js';
import { saveToStorage } from './persistence.js';

// Importar chickenSales desde localStorage y mantenerlo sincronizado
let chickenSales = [];
function updateChickenSalesFromStorage() {
  try {
    chickenSales = JSON.parse(localStorage.getItem('chickenSales') || '[]');
  } catch (e) {
    chickenSales = [];
  }
}
// Inicializar chickenSales
updateChickenSalesFromStorage();

// Escuchar cambios en localStorage para mantener sincronizado
window.addEventListener('storage', (e) => {
  if (e.key === 'chickenSales') {
    updateChickenSalesFromStorage();
  }
});

// Exponer función para actualizar manualmente
export { updateChickenSalesFromStorage };

// === RENDERIZADO DE INVENTARIO ===
export async function renderInventory() {
  const container = document.getElementById('inventoryList');
  if (!container) return;
  
  // Usar datos de localStorage para asegurar sincronización
  const realProducts = JSON.parse(localStorage.getItem('products') || '[]');
  
  if (!realProducts || !Array.isArray(realProducts) || realProducts.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <i class="bi bi-box-seam fs-1 text-muted"></i>
        <p class="mt-2 text-muted">No hay productos en el inventario</p>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalProduct">
          <i class="bi bi-plus-circle"></i> Agregar Producto
        </button>
      </div>
    `;
    return;
  }
  
  let isGridView = true;
  isGridView = localStorage.getItem('inventoryView') !== 'list';
  
  if (isGridView) {
    container.className = 'row gy-3';
    container.innerHTML = realProducts.map(product => `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="product-card-treinta" onclick="showProductDetailModal('${product.id}')">
          <img src="${product.image || 'icons/descarga.png'}" alt="${product.name}" onerror="this.src='icons/descarga.png'">
          <h5>${product.name}</h5>
          <div class="product-category">${product.category || '-'}</div>
          <div class="product-price">$${product.price.toFixed(2)}</div>
          <div class="product-cost">Costo: $${product.cost.toFixed(2)}</div>
          <div class="mt-2">
            <span class="badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}">
              ${product.stock > 0 ? 'Stock: ' + product.stock : 'Sin stock'}
            </span>
          </div>
        </div>
      </div>
    `).join('');
  } else {
    container.className = 'list-group';
    container.innerHTML = realProducts.map(product => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          <img src="${product.image || 'icons/descarga.png'}" alt="${product.name}" 
               style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; margin-right: 1rem;" 
               onerror="this.src='icons/descarga.png'">
          <div>
            <h6 class="mb-0">${product.name}</h6>
            <small class="text-muted">${product.category || '-'}</small>
          </div>
        </div>
        <div class="text-end">
          <div class="fw-bold">$${product.price.toFixed(2)}</div>
          <small class="text-muted">Stock: ${product.stock}</small>
        </div>
        <div class="ms-3">
          <button class="btn btn-sm btn-outline-primary" onclick="showProductDetailModal('${product.id}')">
            <i class="bi bi-eye"></i>
          </button>
        </div>
      </li>
    `).join('');
  }
}

// === RENDERIZADO DE CLIENTES ===
export async function renderClients(searchTerm = '') {
  const container = document.getElementById('clientList');
  if (!container) return;
  
  // Usar datos de localStorage para asegurar sincronización
  const realClients = JSON.parse(localStorage.getItem('clients') || '[]');
  
  if (!realClients || !Array.isArray(realClients) || realClients.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <i class="bi bi-people fs-1 text-muted"></i>
        <p class="mt-2 text-muted">No hay clientes registrados</p>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalClient">
          <i class="bi bi-person-plus"></i> Agregar Cliente
        </button>
      </div>
    `;
    return;
  }
  
  // Filtrar clientes por término de búsqueda
  let filteredClients = realClients;
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    filteredClients = realClients.filter(client => 
      client.name.toLowerCase().includes(term) ||
      (client.phone && client.phone.includes(term)) ||
      (client.address && client.address.toLowerCase().includes(term))
    );
  }
  
  if (filteredClients.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <i class="bi bi-search fs-1 text-muted"></i>
        <p class="mt-2 text-muted">No se encontraron clientes</p>
        <p class="text-muted">Intenta con otro término de búsqueda</p>
      </div>
    `;
    return;
  }
  
  let isGridView = true;
  isGridView = localStorage.getItem('clientsView') !== 'list';
  
  if (isGridView) {
    container.className = 'row gy-3';
    container.innerHTML = filteredClients.map(client => `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="client-card-treinta" onclick="showClientDetails('${client.id}')">
          ${client.photo ? 
            `<img src="${client.photo}" alt="${client.name}" class="client-photo" onerror="this.parentElement.querySelector('.client-avatar').style.display='flex'; this.style.display='none';">` :
            `<div class="client-avatar">${client.name.charAt(0).toUpperCase()}</div>`
          }
          <div class="client-name">${client.name}</div>
          <div class="client-info">${client.phone || 'Sin teléfono'}</div>
          <div class="client-info">${client.address || 'Sin dirección'}</div>
          <div class="mt-2">
            <span class="badge ${client.debt > 0 ? 'bg-warning' : 'bg-success'}">
              ${client.debt > 0 ? `Deuda: $${client.debt.toFixed(2)}` : 'Sin deuda'}
            </span>
          </div>
        </div>
      </div>
    `).join('');
  } else {
    container.className = 'list-group';
    container.innerHTML = filteredClients.map(client => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          ${client.photo ? 
            `<img src="${client.photo}" alt="${client.name}" class="client-photo" style="margin: 0 1rem 0 0;">` :
            `<div class="client-avatar" style="margin: 0 1rem 0 0;">${client.name.charAt(0).toUpperCase()}</div>`
          }
          <div>
            <h6 class="mb-0">${client.name}</h6>
            <small class="text-muted">${client.phone || 'Sin teléfono'}</small>
          </div>
        </div>
        <div class="text-end">
          <div class="fw-bold">${client.debt > 0 ? `$${client.debt.toFixed(2)}` : 'Sin deuda'}</div>
          <small class="text-muted">${client.address || 'Sin dirección'}</small>
        </div>
        <div class="ms-3">
          <button class="btn btn-sm btn-outline-primary" onclick="showClientDetails('${client.id}')">
            <i class="bi bi-eye"></i>
          </button>
        </div>
      </li>
    `).join('');
  }
}

// === RENDERIZADO DE DEUDAS ===
export function renderDebts(searchTerm = '', statusFilter = 'pending') {
  const list = document.getElementById('debtList');
  const totalBalanceElement = document.getElementById('debtTotalBalance');
  
  if (!list) return;
  
  if (!debts || !Array.isArray(debts) || debts.length === 0) {
    list.innerHTML = `<div class='alert alert-secondary text-center'>Sin deudas registradas</div>`;
    if (totalBalanceElement) totalBalanceElement.textContent = 'Total: $0.00';
    return;
  }
  
  // Filtrar por estado (pendientes/pagadas)
  let statusFilteredDebts = debts.filter(debt => {
    if (statusFilter === 'paid') {
      return debt.amount === 0; // Deudas pagadas
    } else {
      return debt.amount > 0; // Deudas pendientes/abonadas
    }
  });
  
  // Filtrar por término de búsqueda
  let filteredDebts = statusFilteredDebts;
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    filteredDebts = statusFilteredDebts.filter(debt => 
      (debt.clientName && debt.clientName.toLowerCase().includes(term)) ||
      (debt.reason && debt.reason.toLowerCase().includes(term)) ||
      (debt.description && debt.description.toLowerCase().includes(term))
    );
  }
  
  // Calcular total
  const total = filteredDebts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
  const totalText = statusFilter === 'paid' ? 'Pagos realizados' : 'Deudas pendientes';
  
  if (totalBalanceElement) {
    totalBalanceElement.textContent = `${totalText}: $${total.toFixed(2)}`;
    totalBalanceElement.className = `badge ${statusFilter === 'paid' ? 'bg-success' : 'bg-warning'} text-dark ms-2`;
  }
  
  if (filteredDebts.length === 0) {
    const message = searchTerm ? 
      'No se encontraron deudas con ese término de búsqueda' : 
      (statusFilter === 'paid' ? 'No hay deudas pagadas' : 'No hay deudas pendientes');
    list.innerHTML = `<div class='alert alert-info text-center'>${message}</div>`;
    return;
  }

  const debtsByClient = {};
  filteredDebts.forEach(debt => {
    const clientKey = debt.clientId || debt.clientName || 'Desconocido';
    if (!debtsByClient[clientKey]) debtsByClient[clientKey] = [];
    debtsByClient[clientKey].push(debt);
  });

  list.className = 'row gy-3';
  list.innerHTML = Object.keys(debtsByClient).map(clientKey => {
    const clientDebts = debtsByClient[clientKey];
    const clientName = clientDebts[0].clientName || 'Cliente desconocido';
    
    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-primary text-white">
            <span><i class="bi bi-person"></i> ${clientName}</span>
            <span class="badge bg-light text-primary">${clientDebts.length} deuda${clientDebts.length > 1 ? 's' : ''}</span>
          </div>
          <div class="card-body p-2">
            ${clientDebts.map(debt => `
              <div class="debt-item border rounded p-2 mb-1" onclick="showDebtDetailModal('${debt.id}')">
                <div class="d-flex justify-content-between">
                  <div>
                    <div class="fw-bold">${debt.reason || debt.description || 'Sin descripción'}</div>
                    <div class="text-muted small">${debt.date ? new Date(debt.date).toLocaleDateString() : ''}</div>
                    ${debt.originalAmount && debt.originalAmount !== debt.amount ? 
                      `<div class="text-info small">Original: $${debt.originalAmount.toFixed(2)}</div>` : ''}
                  </div>
                  <div class="text-end">
                    <div class="${debt.amount === 0 ? 'text-success' : 'text-danger'} fw-bold">$${debt.amount.toFixed(2)}</div>
                    <span class="badge ${debt.amount === 0 ? 'bg-success' : 'bg-warning'}">
                      ${debt.amount === 0 ? 'Pagada' : (debt.originalAmount && debt.originalAmount !== debt.amount ? 'Abonada' : 'Pendiente')}
                    </span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// === RENDERIZADO DE PRODUCTOS EN VENTAS ===
export function renderSalesProducts() {
  const container = document.getElementById('salesProductsGrid');
  if (!container) return;
  
  // Usar datos de localStorage para asegurar sincronización
  const realProducts = JSON.parse(localStorage.getItem('products') || '[]');
  
  if (!realProducts || !Array.isArray(realProducts) || realProducts.length === 0) {
    container.innerHTML = `
      <div class="empty-state-temu">
        <div class="empty-icon">
          <i class="bi bi-box-seam"></i>
        </div>
        <h3>No hay productos</h3>
        <p>Agrega productos al inventario para comenzar a vender</p>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalProduct">
          <i class="bi bi-plus-circle"></i> Agregar Producto
        </button>
      </div>
    `;
    return;
  }
  
  const searchTerm = document.getElementById('productSearch')?.value?.toLowerCase() || '';
  const filteredProducts = realProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm)
  );
  
  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="empty-state-temu">
        <div class="empty-icon">
          <i class="bi bi-search"></i>
        </div>
        <h3>No se encontraron productos</h3>
        <p>Intenta con otro término de búsqueda</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filteredProducts.map(product => `
    <div class="product-card-temu ${product.stock <= 0 ? 'out-of-stock' : ''}" onclick="addToCart('${product.id}')">
      <div class="product-image-container">
        <img src="${product.image || 'icons/descarga.png'}" 
             class="product-image" alt="${product.name}" 
             onerror="this.src='icons/descarga.png'">
        ${product.stock <= 0 ? '<div class="stock-overlay">Sin Stock</div>' : ''}
      </div>
      <div class="product-info">
        <h6 class="product-name">${product.name}</h6>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <div class="product-stock">
          <i class="bi bi-box-seam"></i> ${product.stock} disponibles
        </div>
        ${product.category ? `<div class="product-category">${product.category}</div>` : ''}
      </div>
      <div class="product-actions">
        <button class="btn-add-cart ${product.stock <= 0 ? 'disabled' : ''}" 
                onclick="event.stopPropagation(); addToCart('${product.id}')" 
                ${product.stock <= 0 ? 'disabled' : ''}>
          <i class="bi bi-cart-plus"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// === RENDERIZADO DE BALANCE ===
export function renderBalanceGrid(opts = {}) {
  try {
    // Actualizar chickenSales antes de calcular
    updateChickenSalesFromStorage();
    
    let currentPeriod = document.querySelector('input[name="periodFilter"]:checked')?.value || 'day';
    let data, movements;
    
    if (opts && opts.fecha) {
      // Si se pasa una fecha, filtrar solo ese día
      data = calculateBalanceData('custom', opts.fecha);
      movements = getRecentMovements('custom', opts.fecha);
    } else {
      data = calculateBalanceData(currentPeriod);
      movements = getRecentMovements(currentPeriod);
    }
    
    // Validar que data tenga valores válidos
    if (!data || typeof data.income !== 'number' || typeof data.expenses !== 'number' || typeof data.profit !== 'number') {
      console.warn('Datos de balance inválidos, usando valores por defecto');
      data = { income: 0, expenses: 0, profit: 0 };
    }
    
    // Validar que movements sea un array
    if (!Array.isArray(movements)) {
      console.warn('Movimientos inválidos, usando array vacío');
      movements = [];
    }
  
  // Calcular porcentajes seguros (evitar división por cero)
  const total = data.income + data.expenses;
  const incomePercent = total > 0 ? ((data.income / total) * 100).toFixed(1) : '0.0';
  const expensesPercent = total > 0 ? ((data.expenses / total) * 100).toFixed(1) : '0.0';
  const profitMargin = data.income > 0 ? ((data.profit / data.income) * 100).toFixed(1) : '0.0';
  
  // Validar que los porcentajes sean números válidos
  const safeIncomePercent = isNaN(parseFloat(incomePercent)) ? '0.0' : incomePercent;
  const safeExpensesPercent = isNaN(parseFloat(expensesPercent)) ? '0.0' : expensesPercent;
  const safeProfitMargin = isNaN(parseFloat(profitMargin)) ? '0.0' : profitMargin;
  
  // Renderizar tarjetas de balance
  const cardsContainer = document.getElementById('balanceCards');
  if (cardsContainer) {
    cardsContainer.innerHTML = `
      <div class="balance-card-treinta income">
        <div class="balance-card-header">
          <div class="balance-card-icon">
            <i class="bi bi-cash-coin"></i>
          </div>
          <h6 class="balance-card-title">Ingresos</h6>
        </div>
        <div class="balance-card-amount">$${data.income.toFixed(2)}</div>
        <div class="balance-card-change positive">
          <i class="bi bi-arrow-up"></i>
          <span>+${safeIncomePercent}% del total</span>
        </div>
      </div>
      
      <div class="balance-card-treinta expenses">
        <div class="balance-card-header">
          <div class="balance-card-icon">
            <i class="bi bi-cart-dash"></i>
          </div>
          <h6 class="balance-card-title">Gastos</h6>
        </div>
        <div class="balance-card-amount">$${data.expenses.toFixed(2)}</div>
        <div class="balance-card-change negative">
          <i class="bi bi-arrow-down"></i>
          <span>-${safeExpensesPercent}% del total</span>
        </div>
      </div>
      
      <div class="balance-card-treinta profit">
        <div class="balance-card-header">
          <div class="balance-card-icon">
            <i class="bi bi-graph-up-arrow"></i>
          </div>
          <h6 class="balance-card-title">Utilidad</h6>
        </div>
        <div class="balance-card-amount">$${data.profit.toFixed(2)}</div>
        <div class="balance-card-change ${data.profit >= 0 ? 'positive' : 'negative'}">
          <i class="bi bi-${data.profit >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
          <span>${data.profit >= 0 ? '+' : ''}${safeProfitMargin}% margen</span>
        </div>
      </div>
      
      <div class="balance-card-treinta credits">
        <div class="balance-card-header">
          <div class="balance-card-icon">
            <i class="bi bi-cash-stack"></i>
          </div>
          <h6 class="balance-card-title">Créditos</h6>
        </div>
        <div class="balance-card-amount">$${(debts && Array.isArray(debts) ? debts.reduce((sum, d) => sum + (d.amount || 0), 0) : 0).toFixed(2)}</div>
        <div class="balance-card-change">
          <i class="bi bi-clock"></i>
          <span>${debts && Array.isArray(debts) ? debts.length : 0} deudas pendientes</span>
        </div>
      </div>
    `;
  }
  
  // Renderizar movimientos
  const movementsContainer = document.getElementById('movementsList');
  const movementsCount = document.getElementById('movementsCount');
  
  if (movementsCount) {
    movementsCount.textContent = `${movements.length} movimientos`;
  }
  
  if (movementsContainer) {
    if (movements.length === 0) {
      movementsContainer.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
          <p class="text-muted mt-2">Sin movimientos en este periodo</p>
        </div>
      `;
      return;
    }
    
    movementsContainer.innerHTML = (movements && Array.isArray(movements) ? movements.map((movement, idx) => `
      <div class="movement-item-treinta" onclick="showMovementDetail(${idx})" style="cursor:pointer;">
        <div class="movement-icon ${movement.type}">
          <i class="bi ${movement.icon}"></i>
        </div>
        <div class="movement-content">
          <div class="movement-title">${movement.title || 'Movimiento'}</div>
          <div class="movement-subtitle">${movement.subtitle || ''}</div>
        </div>
        <div class="movement-amount ${movement.amountClass}">
          ${movement.amountClass === 'positive' ? '+' : ''}$${(movement.amount || 0).toFixed(2)}
        </div>
      </div>
    `).join('') : '');
  }
  
  // Renderizar estadísticas avanzadas
  renderAdvancedStats(data);
  
  } catch (error) {
    console.error('Error renderizando balance:', error);
    
    // Mostrar mensaje de error en el contenedor de balance
    const cardsContainer = document.getElementById('balanceCards');
    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle"></i>
          Error cargando datos del balance. Por favor, recarga la página.
        </div>
      `;
    }
  }
}

// === RENDERIZAR ESTADÍSTICAS AVANZADAS ===
function renderAdvancedStats(data) {
  const stats = calculateAdvancedStats();
  
  // Actualizar contadores
  const totalSalesCount = document.getElementById('totalSalesCount');
  const totalClientsCount = document.getElementById('totalClientsCount');
  const totalProductsCount = document.getElementById('totalProductsCount');
  const averageSale = document.getElementById('averageSale');
  const profitMargin = document.getElementById('profitMargin');
  const debtRatio = document.getElementById('debtRatio');
  
  if (totalSalesCount) totalSalesCount.textContent = stats.totalSales;
  if (totalClientsCount) totalClientsCount.textContent = stats.totalClients;
  if (totalProductsCount) totalProductsCount.textContent = stats.totalProducts;
  if (averageSale) averageSale.textContent = `$${stats.averageSale.toFixed(2)}`;
  if (profitMargin) profitMargin.textContent = `${stats.profitMargin.toFixed(1)}%`;
  if (debtRatio) debtRatio.textContent = `${stats.debtRatio.toFixed(1)}%`;
  
  // Actualizar insights
  const topProduct = document.getElementById('topProduct');
  const topProductSales = document.getElementById('topProductSales');
  const topClient = document.getElementById('topClient');
  const topClientAmount = document.getElementById('topClientAmount');
  
  if (topProduct) topProduct.textContent = stats.topProduct.name;
  if (topProductSales) topProductSales.textContent = `${stats.topProduct.sales} ventas`;
  if (topClient) topClient.textContent = stats.topClient.name;
  if (topClientAmount) topClientAmount.textContent = `$${stats.topClient.amount.toFixed(2)}`;
}

// === CALCULAR ESTADÍSTICAS AVANZADAS ===
function calculateAdvancedStats() {
  // Contar ventas normales y de pollos
  const normalSales = sales ? sales.length : 0;
  const chickenSalesCount = chickenSales ? chickenSales.length : 0;
  const totalSales = normalSales + chickenSalesCount;
  
  const totalClients = clients ? clients.length : 0;
  const totalProducts = products ? products.length : 0;
  
  let totalRevenue = 0;
  let totalCost = 0;
  let totalDebt = 0;
  
  // Calcular ingresos y costos de ventas normales
  if (sales && Array.isArray(sales)) {
    sales.forEach(sale => {
      totalRevenue += sale.total || 0;
      totalCost += sale.cost || 0;
    });
  }
  
  // Calcular ingresos y costos de ventas de pollos
  if (chickenSales && Array.isArray(chickenSales)) {
    chickenSales.forEach(sale => {
      totalRevenue += sale.total || 0;
      // Calcular costo de pollo basado en peso y costo por libra
      const chickenCost = (sale.weight || 0) * (sale.costPerPound || 0);
      totalCost += chickenCost;
    });
  }
  
  // Calcular deudas desde el array de deudas (más preciso)
  if (debts && Array.isArray(debts)) {
    debts.forEach(debt => {
      totalDebt += debt.amount || 0;
    });
  }
  
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  const debtRatio = totalRevenue > 0 ? (totalDebt / totalRevenue) * 100 : 0;
  
  // Encontrar producto top (incluyendo pollos)
  const productSales = {};
  
  // Ventas normales
  if (sales && Array.isArray(sales)) {
    sales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          productSales[item.name] = (productSales[item.name] || 0) + item.qty;
        });
      }
    });
  }
  
  // Ventas de pollos
  if (chickenSales && Array.isArray(chickenSales)) {
    chickenSales.forEach(sale => {
      const chickenName = `Pollos (${sale.weight || 0} lbs)`;
      productSales[chickenName] = (productSales[chickenName] || 0) + (sale.quantity || 0);
    });
  }
  
  const topProductEntry = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];
  const topProduct = topProductEntry ? 
    { name: topProductEntry[0], sales: topProductEntry[1] } : 
    { name: 'Sin ventas', sales: 0 };
  
  // Encontrar cliente top (incluyendo ventas de pollos)
  const clientSales = {};
  
  // Ventas normales
  if (sales && Array.isArray(sales)) {
    sales.forEach(sale => {
      const clientName = sale.clientName || 'Cliente';
      clientSales[clientName] = (clientSales[clientName] || 0) + (sale.total || 0);
    });
  }
  
  // Ventas de pollos
  if (chickenSales && Array.isArray(chickenSales)) {
    chickenSales.forEach(sale => {
      const clientName = sale.clientName || 'Cliente';
      clientSales[clientName] = (clientSales[clientName] || 0) + (sale.total || 0);
    });
  }
  
  const topClientEntry = Object.entries(clientSales).sort((a, b) => b[1] - a[1])[0];
  const topClient = topClientEntry ? 
    { name: topClientEntry[0], amount: topClientEntry[1] } : 
    { name: 'Sin ventas', amount: 0 };
  
  return {
    totalSales,
    totalClients,
    totalProducts,
    averageSale,
    profitMargin,
    debtRatio,
    topProduct,
    topClient
  };
}

// === FUNCIONES AUXILIARES ===
function calculateBalanceData(period, customDate) {
  const now = new Date();
  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  const isSameWeek = (d1, d2) => {
    const startOfWeek = d => {
      const date = new Date(d);
      date.setDate(date.getDate() - date.getDay());
      date.setHours(0,0,0,0);
      return date;
    };
    return startOfWeek(d1).getTime() === startOfWeek(d2).getTime();
  };
  const isSameMonth = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  const isSameYear = (d1, d2) => d1.getFullYear() === d2.getFullYear();
  
  let checkPeriod;
  if (period === 'custom' && customDate) {
    const custom = new Date(customDate);
    checkPeriod = (d) => isSameDay(d, custom);
  } else {
    switch(period) {
      case 'day': checkPeriod = (d) => isSameDay(d, now); break;
      case 'week': checkPeriod = (d) => isSameWeek(d, now); break;
      case 'month': checkPeriod = (d) => isSameMonth(d, now); break;
      case 'year': checkPeriod = (d) => isSameYear(d, now); break;
      default: checkPeriod = (d) => isSameDay(d, now);
    }
  }
  
  let income = 0, expenses = 0, profit = 0;
  
  // Obtener datos reales desde localStorage
  const realSales = JSON.parse(localStorage.getItem('sales') || '[]');
  
  // Verificar que sales sea un array válido
  if (realSales && Array.isArray(realSales)) {
    realSales.forEach(s => {
      if (s && s.date && typeof s.total === 'number') {
        const fecha = new Date(s.date);
        if (checkPeriod(fecha)) {
          income += s.total;
          // Calcular gastos basado en el costo real de los productos
          const saleCost = s.cost || 0;
          expenses += saleCost;
          profit += (s.total - saleCost);
        }
      }
    });
  }
  
  // Obtener datos reales de chickenSales desde localStorage
  const realChickenSales = JSON.parse(localStorage.getItem('chickenSales') || '[]');
  
  if (realChickenSales && Array.isArray(realChickenSales)) {
    realChickenSales.forEach(s => {
      if (s && s.date && typeof s.total === 'number') {
        const fecha = new Date(s.date);
        if (checkPeriod(fecha)) {
          income += s.total;
          // Para pollos, calcular costo basado en peso y costo por libra
          const chickenCost = (s.weight || 0) * (s.costPerPound || 0);
          expenses += chickenCost;
          profit += (s.total - chickenCost);
        }
      }
    });
  }
  
  // Asegurar que los valores no sean negativos
  income = Math.max(0, income);
  expenses = Math.max(0, expenses);
  profit = income - expenses; // Profit real = ingresos - gastos
  
  return { income, expenses, profit };
}

function getRecentMovements(period, customDate) {
  const movements = [];
  const now = new Date();
  let startDate;
  if (period === 'custom' && customDate) {
    startDate = new Date(customDate);
  } else {
    switch(period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  }
  
  // Obtener datos reales desde localStorage
  const realSales = JSON.parse(localStorage.getItem('sales') || '[]');
  
  // Verificar que sales sea un array válido y agregar ventas del periodo
  if (realSales && Array.isArray(realSales)) {
    realSales.forEach(sale => {
      if (sale && sale.date && sale.id && sale.clientName && typeof sale.total === 'number') {
        const saleDate = new Date(sale.date);
        if (saleDate >= startDate) {
          movements.push({
            type: 'sale',
            icon: 'bi-cart-check',
            title: `Venta #${sale.id}`,
            subtitle: `${sale.clientName} - ${saleDate.toLocaleDateString()}`,
            amount: sale.total,
            amountClass: 'positive',
            date: saleDate,
            data: sale
          });
        }
      }
    });
  }
  
  // Obtener datos reales de chickenSales desde localStorage
  const realChickenSales = JSON.parse(localStorage.getItem('chickenSales') || '[]');
  
  if (realChickenSales && Array.isArray(realChickenSales)) {
    realChickenSales.forEach(sale => {
      if (sale && sale.date && sale.id && sale.clientName && typeof sale.total === 'number') {
        const saleDate = new Date(sale.date);
        if (saleDate >= startDate) {
          movements.push({
            type: 'chicken_sale',
            icon: 'bi-egg-fried',
            title: `Venta Pollos #${sale.id}`,
            subtitle: `${sale.clientName} - ${saleDate.toLocaleDateString()}`,
            amount: sale.total,
            amountClass: 'positive',
            date: saleDate,
            data: sale
          });
        }
      }
    });
  }
  
  // Obtener datos reales de debts desde localStorage
  const realDebts = JSON.parse(localStorage.getItem('debts') || '[]');
  
  // Verificar que debts sea un array válido y agregar deudas del periodo
  if (realDebts && Array.isArray(realDebts)) {
    realDebts.forEach(debt => {
      if (debt && debt.date && debt.id && debt.clientName && typeof debt.amount === 'number') {
        const debtDate = new Date(debt.date);
        if (debtDate >= startDate) {
          movements.push({
            type: 'debt',
            icon: 'bi-cash-stack',
            title: `Deuda #${debt.id}`,
            subtitle: `${debt.clientName} - ${debtDate.toLocaleDateString()}`,
            amount: debt.amount,
            amountClass: 'negative',
            date: debtDate,
            data: debt
          });
        }
      }
    });
    
    // Agregar pagos de deudas del periodo
    realDebts.forEach(debt => {
      if (debt && debt.payments && Array.isArray(debt.payments)) {
        debt.payments.forEach(payment => {
          if (payment && payment.date && typeof payment.amount === 'number') {
            const paymentDate = new Date(payment.date);
            if (paymentDate >= startDate) {
              movements.push({
                type: 'payment',
                icon: 'bi-cash-coin',
                title: `Pago deuda #${debt.id}`,
                subtitle: `${debt.clientName} - ${paymentDate.toLocaleDateString()}`,
                amount: payment.amount,
                amountClass: 'positive',
                date: paymentDate,
                data: { debt, payment }
              });
            }
          }
        });
      }
    });
  }
  
  // Ordenar por fecha más reciente y limitar a 10
  return movements
    .sort((a, b) => b.date - a.date)
    .slice(0, 10);
}

// === ACTUALIZACIÓN DE BALANCE ===
// Función principal para actualizar el dashboard
export function updateBalanceUI() {
  try {
    console.log('🔄 Actualizando UI de balance con datos reales...');
    
    // Actualizar chickenSales desde localStorage antes de renderizar
    updateChickenSalesFromStorage();
    
    // Recargar datos desde localStorage para asegurar sincronización
    const latestSales = JSON.parse(localStorage.getItem('sales') || '[]');
    const latestDebts = JSON.parse(localStorage.getItem('debts') || '[]');
    const latestChickenSales = JSON.parse(localStorage.getItem('chickenSales') || '[]');
    
    console.log('📊 Datos para balance:', {
      sales: latestSales.length,
      debts: latestDebts.length,
      chickenSales: latestChickenSales.length
    });
    
    // Actualizar arrays globales si existen
    if (window.sales && Array.isArray(window.sales)) {
      window.sales.length = 0;
      window.sales.push(...latestSales);
    }
    if (window.debts && Array.isArray(window.debts)) {
      window.debts.length = 0;
      window.debts.push(...latestDebts);
    }
    
    // Renderizar el grid de balance INMEDIATAMENTE
    renderBalanceGrid();
    
    // Actualizar estadísticas avanzadas INMEDIATAMENTE
    if (typeof showAdvancedStats === 'function') {
      showAdvancedStats();
    }
    
    console.log('✅ UI de balance actualizada correctamente');
  } catch (error) {
    console.error('❌ Error actualizando UI de balance:', error);
    
    // Mostrar mensaje de error al usuario
    const balanceView = document.getElementById('view-balance');
    if (balanceView) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-warning';
      errorDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle"></i>
        Hubo un problema actualizando el balance. 
        <button class="btn btn-sm btn-outline-primary ms-2" onclick="location.reload()">
          <i class="bi bi-arrow-clockwise"></i> Recargar
        </button>
      `;
      balanceView.prepend(errorDiv);
    }
  }
}

// Listener para actualizar balance cuando se reciban datos sincronizados
if (typeof window !== 'undefined') {
  let balanceUpdateTimeout = null;
  
  // Escuchar cambios en localStorage con debounce
  window.addEventListener('storage', (e) => {
    if (e.key === 'sales' || e.key === 'debts' || e.key === 'chickenSales') {
      console.log('Datos sincronizados detectados, actualizando balance...');
      
      // Cancelar actualización anterior si existe
      if (balanceUpdateTimeout) {
        clearTimeout(balanceUpdateTimeout);
      }
      
      // Programar nueva actualización con debounce
      balanceUpdateTimeout = setTimeout(() => {
        const balanceView = document.getElementById('view-balance');
        if (balanceView && !balanceView.classList.contains('d-none')) {
          updateBalanceUI();
        }
        balanceUpdateTimeout = null;
      }, 300);
    }
  });
  

}

// Función para mostrar estadísticas avanzadas
function showAdvancedStats() {
  // Esta función se puede implementar más tarde
  console.log('Mostrar estadísticas avanzadas');
}

// Función para mostrar detalles de movimiento
window.showMovementDetail = function(idx) {
  const currentPeriod = document.querySelector('input[name="periodFilter"]:checked')?.value || 'day';
  const movements = getRecentMovements(currentPeriod);
  const movement = movements[idx];
  if (!movement || !movement.data) return;
  
  const data = movement.data;
  
  // Mostrar comprobante según el tipo de movimiento
  switch (movement.type) {
    case 'sale':
      if (window.showReceipt) window.showReceipt(data);
      break;
    case 'chicken_sale':
      showChickenReceiptFromMovement(data);
      break;
    case 'debt':
      if (window.showDebtDetailModal) window.showDebtDetailModal(data.id);
      break;
    case 'payment':
      if (window.showPaymentReceipt) window.showPaymentReceipt(data);
      break;
    default:
      if (window.showGenericMovementDetail) window.showGenericMovementDetail(movement);
  }
};

// Función para mostrar comprobante de pollo desde movimiento
function showChickenReceiptFromMovement(sale) {
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
          <div class="receipt-date">${new Date(sale.date).toLocaleDateString()} ${sale.time || ''}</div>
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
    title: 'Comprobante de Venta de Pollos',
    html: receiptHtml,
    confirmButtonText: 'Cerrar',
    width: 500,
    customClass: {
      popup: 'swal2-receipt-treinta'
    }
  });
}

// Funciones auxiliares para iconos de pago
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