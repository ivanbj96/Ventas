// === Datos iniciales ===
let products = loadFromStorage('products');
let clients = loadFromStorage('clients');
let debts = loadFromStorage('debts');
let sales = loadFromStorage('sales');
let cart = [];
let currentClientId = null;

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  renderClients();
  updateClientSelector();
  document.getElementById('productForm').addEventListener('submit', addProduct);
  document.getElementById('clientForm').addEventListener('submit', addClient);
  document.getElementById('clientSelector').addEventListener('change', handleClientChange);
  document.getElementById('clientSelector').dispatchEvent(new Event('change'));
});

// === Productos ===
function addProduct(e) {
  e.preventDefault();

  const name = document.getElementById('productName').value.trim();
  const cost = parseFloat(document.getElementById('productCost').value);
  const price = parseFloat(document.getElementById('productPrice').value);
  const category = document.getElementById('productCategory').value.trim();
  const imageInput = document.getElementById('productImage');

  const product = {
    id: generateId('prod'),
    name,
    cost,
    price,
    category,
    image: ''
  };

  if (imageInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = () => {
      product.image = reader.result;
      products.push(product);
      saveToStorage('products', products);
      renderProducts();
    };
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    products.push(product);
    saveToStorage('products', products);
    renderProducts();
  }

  e.target.reset();
}

function renderProducts() {
  const list = document.getElementById('productList');
  list.innerHTML = '';

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <strong>${p.name}</strong><br/>
      Precio: ${formatCurrency(p.price)}<br/>
      Costo: ${formatCurrency(p.cost)}<br/>
      Categoría: ${p.category}<br/>
      ${p.image ? `<img class="product-img" src="${p.image}" />` : ''}
      <button onclick="addToCart('${p.id}')">Agregar al carrito</button>
    `;
    list.appendChild(card);
  });

  renderSalesList(); // Para mostrar en sección de ventas también
}

// === Ventas y Carrito ===

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const existing = cart.find(item => item.product.id === productId);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ product, quantity: 1 });
  }

  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.product.id !== productId);
  renderCart();
}

function renderCart() {
  const cartDiv = document.getElementById('cart');
  cartDiv.innerHTML = '';

  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <strong>${item.product.name}</strong> x${item.quantity} 
      = ${formatCurrency(item.quantity * item.product.price)}
      <button onclick="removeFromCart('${item.product.id}')">Quitar</button>
    `;
    cartDiv.appendChild(div);
  });
}

function renderSalesList() {
  const salesList = document.getElementById('productSalesList');
  salesList.innerHTML = '';

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <strong>${p.name}</strong><br/>
      Precio: ${formatCurrency(p.price)}<br/>
      ${p.image ? `<img class="product-img" src="${p.image}" />` : ''}
      <button onclick="addToCart('${p.id}')">Agregar al carrito</button>
    `;
    salesList.appendChild(card);
  });
}

// === Cliente activo y proformas ===

function handleClientChange(e) {
  const newClientId = e.target.value;

  if (currentClientId && cart.length > 0) {
    // Guardar proforma actual del cliente anterior
    saveProforma(currentClientId, cart);
  }

  currentClientId = newClientId;
  cart = loadProforma(currentClientId);
  renderCart();
}

function finalizeSale() {
  if (!currentClientId || cart.length === 0) {
    alert("Selecciona un cliente y agrega productos al carrito.");
    return;
  }

  const client = clients.find(c => c.id === currentClientId);
  if (!client) {
    alert("Cliente no válido.");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.quantity * item.product.cost, 0);
  const profit = total - totalCost;

  const confirmDebt = !confirm(`¿El cliente pagó? Total: ${formatCurrency(total)}\nHaz clic en "Aceptar" si pagó. Si haces clic en "Cancelar", se registrará como deuda.`);

  if (confirmDebt) {
    const reason = prompt("Motivo de la deuda:");
    debts.push({
      id: generateId('debt'),
      clientId: client.id,
      clientName: client.name,
      amount: total,
      reason: reason || 'Sin especificar',
      date: new Date().toLocaleString()
    });
    saveToStorage('debts', debts);
  } else {
    sales.push({
      id: generateId('sale'),
      clientId: client.id,
      items: cart,
      total,
      cost: totalCost,
      profit,
      date: new Date().toLocaleString()
    });
    saveToStorage('sales', sales);
  }

  // Limpiar carrito y proforma
  const proformas = loadFromStorage('proformas');
  delete proformas[currentClientId];
  saveToStorage('proformas', proformas);

  cart = [];
  renderCart();
  updateBalanceUI();
  alert("Venta registrada.");
}

// === Clientes ===

function addClient(e) {
  e.preventDefault();
  const name = document.getElementById('clientName').value.trim();
  if (!name) return;

  const newClient = {
    id: generateId('cli'),
    name
  };

  clients.push(newClient);
  saveToStorage('clients', clients);
  renderClients();
  updateClientSelector();
  e.target.reset();
}

function renderClients() {
  const list = document.getElementById('clientList');
  list.innerHTML = '';
  clients.forEach(c => {
    const li = document.createElement('li');
    li.className = 'client-card';
    li.textContent = c.name;
    list.appendChild(li);
  });
}

// === Deudas ===

function renderDebts() {
  const debtList = document.getElementById('debtList');
  debtList.innerHTML = '';
  debts.forEach(d => {
    const div = document.createElement('div');
    div.className = 'debt-item';
    div.innerHTML = `
      <strong>${d.clientName}</strong><br/>
      Monto: ${formatCurrency(d.amount)}<br/>
      Motivo: ${d.reason}<br/>
      Fecha: ${d.date}
    `;
    debtList.appendChild(div);
  });
}

// === Balance ===

function updateBalanceUI() {
  let totalProfit = 0;
  let totalLoss = 0;

  sales.forEach(sale => {
    totalProfit += sale.profit;
    totalLoss += sale.cost;
  });

  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);

  document.getElementById('totalEarnings').textContent = `Ganancias: ${formatCurrency(totalProfit)}`;
  document.getElementById('totalLosses').textContent = `Pérdidas: ${formatCurrency(totalLoss)}`;
  document.getElementById('pendingDebts').textContent = `Deudas pendientes: ${formatCurrency(totalDebt)}`;

  renderDebts();
}