// === Arrays globales ===
let products = [];
let clients = [];
let sales = [];
let debts = [];
let cart = [];
let currentClientId = null;

// === Al cargar la app ===
document.addEventListener('DOMContentLoaded', () => {
  products = loadFromStorage('products');
  clients = loadFromStorage('clients');
  sales = loadFromStorage('sales');
  debts = loadFromStorage('debts');

  renderInventory();
  renderClients();
  updateClientSelector();
  updateBalanceUI();
  renderDebts();

  // Escuchar cambios en el selector de cliente
  document.getElementById('clientSelector').addEventListener('change', e => {
    currentClientId = e.target.value;
    cart = loadProforma(currentClientId);
    renderCart();
  });

  // Eventos de formularios
  document.getElementById('formProduct').addEventListener('submit', addProduct);
  document.getElementById('formClient').addEventListener('submit', addClient);
});

// === Agregar producto al inventario ===
function addProduct(e) {
  e.preventDefault();

  const name = document.getElementById('productName').value.trim();
  const cost = parseFloat(document.getElementById('productCost').value);
  const price = parseFloat(document.getElementById('productPrice').value);
  const category = document.getElementById('productCategory').value.trim();
  const imageInput = document.getElementById('productImage');

  if (!name || isNaN(cost) || isNaN(price)) return alert('Faltan datos válidos');

  const reader = new FileReader();
  reader.onload = () => {
    const image = reader.result;

    const newProduct = {
      id: generateId('prod'),
      name,
      cost,
      price,
      category,
      image
    };

    products.push(newProduct);
    saveToStorage('products', products);
    renderInventory();
    e.target.reset();
  };

  if (imageInput.files[0]) {
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    // Sin imagen
    const newProduct = {
      id: generateId('prod'),
      name,
      cost,
      price,
      category,
      image: ''
    };
    products.push(newProduct);
    saveToStorage('products', products);
    renderInventory();
    e.target.reset();
  }
}

// === Mostrar productos en Inventario y Venta ===
function renderInventory() {
  const invContainer = document.getElementById('inventoryList');
  const salesContainer = document.getElementById('productSalesList');
  invContainer.innerHTML = '';
  salesContainer.innerHTML = '';

  products.forEach(p => {
    // Inventario card
    const col = document.createElement('div');
    col.className = 'col-12';
    col.innerHTML = `
      <div class="product-card">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" />` : ''}
        <h5>${p.name}</h5>
        <p class="mb-1">Categoría: ${p.category || '-'}</p>
        <p class="mb-1">Costo: ${formatCurrency(p.cost)}</p>
        <p class="mb-2">Precio: <strong>${formatCurrency(p.price)}</strong></p>
      </div>
    `;
    invContainer.appendChild(col);

    // Card para ventas
    const saleCard = document.createElement('div');
    saleCard.className = 'col-6 col-md-4 col-lg-3';
    saleCard.innerHTML = `
      <div class="product-card">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" />` : ''}
        <h6 class="mb-1">${p.name}</h6>
        <p class="mb-2">${formatCurrency(p.price)}</p>
        <button class="btn btn-sm btn-outline-primary" onclick="addToCart('${p.id}')">Agregar</button>
      </div>
    `;
    salesContainer.appendChild(saleCard);
  });
}

// === Agregar producto al carrito ===
function addToCart(productId) {
  if (!currentClientId) return alert("Selecciona un cliente primero");

  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveProforma(currentClientId, cart);
  renderCart();
}

// === Mostrar carrito ===
function renderCart() {
  const container = document.getElementById('cartList');
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = `<div class="alert alert-secondary text-center">Carrito vacío</div>`;
    return;
  }

  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <strong>${item.name}</strong>
        <span>${formatCurrency(item.price)} x ${item.qty}</span>
      </div>
    `;
    container.appendChild(div);
  });
}

// === Vaciar carrito ===
function clearCart() {
  if (!currentClientId) return;
  cart = [];
  saveProforma(currentClientId, []);
  renderCart();
}

// === Finalizar venta (efectiva o deuda) ===
function finalizeSale() {
  if (!currentClientId || cart.length === 0) return alert("Selecciona cliente y agrega productos.");

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cost = cart.reduce((sum, item) => sum + (item.cost * item.qty), 0);
  const profit = total - cost;
  const client = clients.find(c => c.id === currentClientId);

  const confirmDebt = !confirm(`¿El cliente ${client.name} pagó ahora?\n\nTotal: ${formatCurrency(total)}\n\nAceptar = pagó\nCancelar = dejar en deuda`);

  if (confirmDebt) {
    debts.push({
      id: generateId('debt'),
      clientId: client.id,
      clientName: client.name,
      amount: total,
      reason: 'Venta a crédito',
      date: new Date().toLocaleDateString()
    });
    saveToStorage('debts', debts);
    renderDebts();
  } else {
    sales.push({
      id: generateId('sale'),
      clientId: client.id,
      clientName: client.name,
      items: cart,
      total,
      cost,
      profit,
      date: new Date().toLocaleDateString()
    });
    saveToStorage('sales', sales);
  }

  clearCart();
  updateBalanceUI();
  alert("Venta registrada correctamente.");
}

// === Agregar cliente ===
function addClient(e) {
  e.preventDefault();
  const name = document.getElementById('clientName').value.trim();
  if (!name) return;

  const newClient = {
    id: generateId('client'),
    name
  };

  clients.push(newClient);
  saveToStorage('clients', clients);
  renderClients();
  updateClientSelector();
  e.target.reset();
}

// === Mostrar clientes ===
function renderClients() {
  const list = document.getElementById('clientList');
  list.innerHTML = '';

  clients.forEach(c => {
    const li = document.createElement('li');
    li.className = 'client-card list-group-item';
    li.innerText = c.name;
    list.appendChild(li);
  });
}

// === Selector de cliente en ventas ===
function updateClientSelector() {
  const selector = document.getElementById('clientSelector');
  selector.innerHTML = `<option disabled selected value="">Selecciona un cliente</option>`;

  clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.innerText = c.name;
    selector.appendChild(opt);
  });
}

// === Mostrar deudas ===
function renderDebts() {
  const list = document.getElementById('debtList');
  list.innerHTML = '';

  if (debts.length === 0) {
    list.innerHTML = `<div class="alert alert-secondary text-center">Sin deudas registradas</div>`;
    return;
  }

  debts.forEach(d => {
    const div = document.createElement('div');
    div.className = 'debt-item';
    div.innerHTML = `
      <div><strong>Cliente:</strong> ${d.clientName}</div>
      <div><strong>Monto:</strong> ${formatCurrency(d.amount)}</div>
      <div><strong>Fecha:</strong> ${d.date}</div>
      <div><strong>Motivo:</strong> ${d.reason}</div>
    `;
    list.appendChild(div);
  });
}

// === Mostrar resumen de balance ===
function updateBalanceUI() {
  const earnings = sales.reduce((sum, s) => sum + s.profit, 0);
  const losses = sales.reduce((sum, s) => sum + s.cost, 0);
  const pending = debts.reduce((sum, d) => sum + d.amount, 0);

  document.getElementById('totalEarnings').innerText = formatCurrency(earnings);
  document.getElementById('totalLosses').innerText = formatCurrency(losses);
  document.getElementById('pendingDebts').innerText = formatCurrency(pending);
}

// === Instalar como PWA ===
let deferredPrompt;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;

// === Instalar como PWA ===
let deferredPrompt;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  // Aquí podrías mostrar un botón para instalar manualmente
  console.log("App puede instalarse. Ejecuta deferredPrompt.prompt() para instalar.");
});

// === Detectar modo oscuro del sistema ===
function detectDarkMode() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
}

// Escuchar cambios en el sistema
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectDarkMode);

// Ejecutar al iniciar
detectDarkMode();

// === Registrar Service Worker ===
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => console.log("SW registrado:", reg.scope))
    .catch(err => console.error("SW error:", err));
}

  // Aquí podrías mostrar un botón para instalar manualmente
  console.log("App puede instalarse. Ejecuta deferredPrompt.prompt() para instalar.");
});

// === Detectar modo oscuro del sistema ===
function detectDarkMode() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
}

// Escuchar cambios en el sistema
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectDarkMode);

// Ejecutar al iniciar
detectDarkMode();

// === Registrar Service Worker ===
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => console.log("SW registrado:", reg.scope))
    .catch(err => console.error("SW error:", err));
}