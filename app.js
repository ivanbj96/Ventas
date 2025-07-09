// === Arrays globales ===
let products = [];
let clients = [];
let sales = [];
let debts = [];
let cart = [];
let currentClientId = null;
let inventoryViewMode = localStorage.getItem('inventoryViewMode') || 'grid'; // 'grid' o 'list'
let clientsViewMode = localStorage.getItem('clientsViewMode') || 'grid'; // 'grid' o 'list'

// === Al cargar la app ===
document.addEventListener('DOMContentLoaded', () => {
  products = loadFromStorage('products');
  clients = loadFromStorage('clients');
  sales = loadFromStorage('sales');
  debts = loadFromStorage('debts');

  renderInventory();
  renderSalesProducts();
  renderClients();
  updateClientSelector();
  updateBalanceUI();
  renderDebts();
  renderBalanceGrid();

  // Escuchar cambios en el selector de cliente
  document.getElementById('clientSelector').addEventListener('change', e => {
    currentClientId = e.target.value;
    cart = loadProforma(currentClientId);
    renderCart();
  });

  // Eventos de formularios
  document.getElementById('formProduct').addEventListener('submit', addProduct);
  document.getElementById('formClient').addEventListener('submit', addClient);

  // Alternar vista inventario
  const toggleInventoryViewBtn = document.getElementById('toggleInventoryView');
  const toggleInventoryViewText = document.getElementById('toggleInventoryViewText');
  toggleInventoryViewBtn.addEventListener('click', () => {
    inventoryViewMode = inventoryViewMode === 'grid' ? 'list' : 'grid';
    localStorage.setItem('inventoryViewMode', inventoryViewMode);
    renderInventory();
    toggleInventoryViewBtn.querySelector('i').className = inventoryViewMode === 'grid' ? 'bi bi-grid-3x3-gap-fill' : 'bi bi-list-ul';
    toggleInventoryViewText.textContent = inventoryViewMode === 'grid' ? 'Cuadrícula' : 'Lista';
  });
  // Sincronizar botón al cargar
  if (inventoryViewMode === 'grid') {
    toggleInventoryViewBtn.querySelector('i').className = 'bi bi-grid-3x3-gap-fill';
    toggleInventoryViewText.textContent = 'Cuadrícula';
  } else {
    toggleInventoryViewBtn.querySelector('i').className = 'bi bi-list-ul';
    toggleInventoryViewText.textContent = 'Lista';
  }

  // Alternar vista clientes
  const toggleClientsViewBtn = document.getElementById('toggleClientsView');
  const toggleClientsViewText = document.getElementById('toggleClientsViewText');
  toggleClientsViewBtn.addEventListener('click', () => {
    clientsViewMode = clientsViewMode === 'grid' ? 'list' : 'grid';
    localStorage.setItem('clientsViewMode', clientsViewMode);
    renderClients();
    toggleClientsViewBtn.querySelector('i').className = clientsViewMode === 'grid' ? 'bi bi-grid-3x3-gap-fill' : 'bi bi-list-ul';
    toggleClientsViewText.textContent = clientsViewMode === 'grid' ? 'Cuadrícula' : 'Lista';
  });
  if (clientsViewMode === 'grid') {
    toggleClientsViewBtn.querySelector('i').className = 'bi bi-grid-3x3-gap-fill';
    toggleClientsViewText.textContent = 'Cuadrícula';
  } else {
    toggleClientsViewBtn.querySelector('i').className = 'bi bi-list-ul';
    toggleClientsViewText.textContent = 'Lista';
  }

  // Sidebar
  const sidebar = document.getElementById('sidebarMenu');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const btnSidebar = document.getElementById('btnSidebar');
  const btnCloseSidebar = document.getElementById('btnCloseSidebar');
  const themeSwitch = document.getElementById('themeSwitch');

  function openSidebar() {
    sidebar.style.transform = 'translateX(0)';
    sidebarOverlay.style.display = 'block';
  }
  function closeSidebar() {
    sidebar.style.transform = 'translateX(100%)';
    sidebarOverlay.style.display = 'none';
  }
  btnSidebar.addEventListener('click', openSidebar);
  btnCloseSidebar.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Tema manual
  function setTheme(mode) {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      themeSwitch.checked = true;
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      themeSwitch.checked = false;
    }
  }
  // Inicializar tema
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) setTheme(savedTheme);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
  else setTheme('light');

  themeSwitch.addEventListener('change', () => {
    setTheme(themeSwitch.checked ? 'dark' : 'light');
  });
});

// === Agregar producto al inventario ===
function addProduct(e) {
  e.preventDefault();

  const name = document.getElementById('productName').value.trim();
  const cost = parseFloat(document.getElementById('productCost').value);
  const price = parseFloat(document.getElementById('productPrice').value);
  const category = document.getElementById('productCategory').value.trim();
  const imageInput = document.getElementById('productImage');

  if (!name || isNaN(cost) || isNaN(price)) {
    Swal.fire({
      icon: 'warning',
      title: 'Datos incompletos',
      text: 'Faltan datos válidos',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

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
    renderSalesProducts();
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
    renderSalesProducts();
    e.target.reset();
  }
}

// === Mostrar productos en Inventario y Venta ===
function renderInventory() {
  const invContainer = document.getElementById('inventoryList');
  invContainer.innerHTML = '';
  if (inventoryViewMode === 'grid') {
    invContainer.className = 'grid-responsive row gy-3 inventory-grid-view';
  } else {
    invContainer.className = 'inventory-list-view';
  }
  products.forEach(p => {
    let col = document.createElement('div');
    if (inventoryViewMode === 'grid') {
      col.className = 'col-grid mb-3';
      col.innerHTML = `
        <div class="product-card" data-id="${p.id}">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" />` : ''}
          <h5>${p.name}</h5>
          <p class="mb-1">Categoría: ${p.category || '-'}</p>
          <p class="mb-1">Costo: ${formatCurrency(p.cost)}</p>
          <p class="mb-2">Precio: <strong>${formatCurrency(p.price)}</strong></p>
        </div>
      `;
    } else {
      col.className = 'mb-2';
      col.innerHTML = `
        <div class="product-card d-flex align-items-center" data-id="${p.id}">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" />` : ''}
          <div>
            <h5>${p.name}</h5>
            <p class="mb-1">Categoría: ${p.category || '-'}</p>
            <p class="mb-1">Costo: ${formatCurrency(p.cost)}</p>
            <p class="mb-2">Precio: <strong>${formatCurrency(p.price)}</strong></p>
          </div>
        </div>
      `;
    }
    col.querySelector('.product-card').addEventListener('click', () => showProductDetailModal(p.id));
    invContainer.appendChild(col);
  });
}

// === Agregar producto al carrito ===
function addToCart(productId) {
  if (!currentClientId) {
    Swal.fire({
      icon: 'info',
      title: 'Selecciona un cliente',
      text: 'Debes seleccionar un cliente primero',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

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
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary rounded-circle fw-bold" style="width:2rem;height:2rem;" onclick="changeCartQty('${item.id}', -1)">−</button>
          <span class="fs-5 px-2">${item.qty}</span>
          <button class="btn btn-sm btn-outline-primary rounded-circle fw-bold" style="width:2rem;height:2rem;" onclick="changeCartQty('${item.id}', 1)">+</button>
        </div>
        <div class="flex-grow-1 ms-2">
          <strong>${item.name}</strong>
          <div class="text-muted small">${formatCurrency(item.price)} c/u</div>
        </div>
        <span class="fw-bold">${formatCurrency(item.price * item.qty)}</span>
      </div>
    `;
    container.appendChild(div);
  });
}

function changeCartQty(productId, delta) {
  const idx = cart.findIndex(item => item.id === productId);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty < 1) cart[idx].qty = 1;
  saveProforma(currentClientId, cart);
  renderCart();
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
  if (!currentClientId || cart.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Faltan datos',
      text: 'Selecciona cliente y agrega productos.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cost = cart.reduce((sum, item) => sum + (item.cost * item.qty), 0);
  const profit = total - cost;
  const client = clients.find(c => c.id === currentClientId);
  const fecha = new Date().toLocaleString();

  // Comprobante tipo ticket POS
  let detalle = `<div style='max-width:340px;margin:auto;background:#fff;border-radius:10px;padding:1.2rem 1rem 1rem 1rem;box-shadow:0 2px 12px #0001;font-family:monospace;'>`;
  detalle += `<div style='text-align:center;font-weight:bold;font-size:1.1rem;letter-spacing:1px;'>TillUp POS</div>`;
  detalle += `<div style='text-align:center;font-size:0.95rem;color:#888;margin-bottom:0.5rem;'>${fecha}</div>`;
  detalle += `<hr style='margin:0.5rem 0;border-top:1.5px dashed #bbb;' />`;
  detalle += `<div style='font-size:0.98rem;'><strong>Cliente:</strong> ${client.name}</div>`;
  detalle += `<table style='width:100%;font-size:0.97rem;margin:0.5rem 0 0.2rem 0;'>`;
  detalle += `<thead><tr style='color:#888;text-align:left;'><th>Producto</th><th style='text-align:center;'>Cant</th><th style='text-align:right;'>Subtotal</th></tr></thead><tbody>`;
  cart.forEach(item => {
    detalle += `<tr><td>${item.name}</td><td style='text-align:center;'>${item.qty}</td><td style='text-align:right;'>${formatCurrency(item.price * item.qty)}</td></tr>`;
  });
  detalle += `</tbody></table>`;
  detalle += `<hr style='margin:0.5rem 0;border-top:1.5px dashed #bbb;' />`;
  detalle += `<div style='display:flex;justify-content:space-between;font-size:1.08rem;'><span><strong>Total:</strong></span><span class='fs-5 fw-bold text-success'>${formatCurrency(total)}</span></div>`;
  detalle += `</div>`;

  Swal.fire({
    title: '',
    html: detalle,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Pagó',
    denyButtonText: 'Crédito',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    customClass: { popup: 'swal2-pos-ticket' }
  }).then((result) => {
    if (result.isConfirmed) {
      // Venta pagada
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
      updateBalanceUI();
      clearCart();
      Swal.fire({ icon: 'success', title: 'Venta registrada', text: 'Venta registrada correctamente.' });
    } else if (result.isDenied) {
      // Venta a crédito: pedir abono
      Swal.fire({
        title: 'Abono inicial',
        html: `<div class='mb-2'>¿El cliente desea abonar una parte?</div><input id='abonoInput' type='number' min='0' max='${total}' class='form-control' placeholder='Abono (opcional)' />`,
        inputAttributes: { min: 0, max: total },
        showCancelButton: true,
        confirmButtonText: 'Guardar deuda',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const abono = parseFloat(document.getElementById('abonoInput').value) || 0;
          if (abono < 0 || abono > total) {
            Swal.showValidationMessage('El abono debe ser entre 0 y el total');
            return false;
          }
          return abono;
        }
      }).then((abonoResult) => {
        if (abonoResult.isConfirmed) {
          const abono = abonoResult.value;
          debts.push({
            id: generateId('debt'),
            clientId: client.id,
            clientName: client.name,
            amount: total - abono,
            abono,
            total,
            reason: 'Venta a crédito',
            date: new Date().toLocaleString()
          });
          saveToStorage('debts', debts);
          renderDebts();
          clearCart();
          Swal.fire({ icon: 'success', title: 'Deuda registrada', text: abono > 0 ? `Abono registrado: ${formatCurrency(abono)}` : 'Deuda registrada correctamente.' });
        }
      });
    }
  });
}

// === Agregar cliente ===
function addClient(e) {
  e.preventDefault();
  const name = document.getElementById('clientName').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const address = document.getElementById('clientAddress').value.trim();
  const photoInput = document.getElementById('clientPhoto');
  const location = document.getElementById('clientLocation').value.trim();
  if (!name) return;

  const saveClient = (photo) => {
    const newClient = {
      id: generateId('client'),
      name,
      phone,
      address,
      photo,
      location
    };
    clients.push(newClient);
    saveToStorage('clients', clients);
    renderClients();
    updateClientSelector();
    e.target.reset();
    if (photoInput) photoInput.value = '';
    document.getElementById('clientLocation').value = '';
    document.getElementById('locationStatus').textContent = '';
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalClient'));
    if (modal) modal.hide();
  };

  if (photoInput && photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => saveClient(reader.result);
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    saveClient('');
  }
}

// === Mostrar clientes ===
function renderClients() {
  const list = document.getElementById('clientList');
  list.innerHTML = '';
  if (clientsViewMode === 'grid') {
    list.className = 'grid-responsive row gy-3';
  } else {
    list.className = 'list-group';
  }
  clients.forEach(c => {
    const li = document.createElement('li');
    li.className = clientsViewMode === 'grid'
      ? 'col-grid client-card d-flex flex-column align-items-center text-center mb-3'
      : 'client-card list-group-item d-flex align-items-center gap-3';
    li.innerHTML = `
      ${c.photo ? `<img src='${c.photo}' alt='${c.name}' style='width:40px;height:40px;object-fit:cover;border-radius:50%;border:2px solid #eee;'>` : `<div style='width:40px;height:40px;border-radius:50%;background:#e0e0e0;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#888;'>${c.name[0]}</div>`}
      <div>
        <div class='fw-bold'>${c.name} ${c.location ? `<a href='https://maps.google.com/?q=${c.location}' target='_blank' title='Ver ubicación'><i class='bi bi-geo-alt-fill text-success'></i></a>` : ''}</div>
        ${c.phone ? `<div class='text-muted small'><i class='bi bi-telephone'></i> ${c.phone}</div>` : ''}
        ${c.address ? `<div class='text-muted small'><i class='bi bi-geo-alt'></i> ${c.address}</div>` : ''}
      </div>
    `;
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
    list.innerHTML = `<div class='alert alert-secondary text-center'>Sin deudas registradas</div>`;
    return;
  }

  const deck = document.createElement('div');
  deck.className = 'debt-deck';

  debts.forEach(d => {
    const card = document.createElement('div');
    let status = 'unpaid', statusText = 'Pendiente';
    if (d.amount === 0) { status = 'paid'; statusText = 'Pagada'; }
    else if (d.abono && d.abono > 0) { status = 'partial'; statusText = 'Abonada'; }
    card.className = `debt-card ${status}`;
    card.innerHTML = `
      <div class='debt-client'>${d.clientName}</div>
      <div class='debt-date'>${d.date}</div>
      <div class='debt-amount mt-2'>Total: ${formatCurrency(d.total || d.amount)}</div>
      ${d.abono ? `<div class='debt-abono'>Abonado: ${formatCurrency(d.abono)}</div>` : ''}
      <div class='debt-saldo'>Saldo: ${formatCurrency(d.amount)}</div>
      <div class='debt-status'>${statusText}</div>
    `;
    card.onclick = () => showDebtDetailModal(d.id);
    deck.appendChild(card);
  });
  list.appendChild(deck);
}

function showDebtDetailModal(debtId) {
  const d = debts.find(debt => debt.id === debtId);
  if (!d) return;
  let html = `<div style='max-width:340px;margin:auto;background:#fff;border-radius:10px;padding:1.2rem 1rem 1rem 1rem;box-shadow:0 2px 12px #0001;font-family:monospace;'>`;
  html += `<div style='text-align:center;font-weight:bold;font-size:1.1rem;letter-spacing:1px;'>TillUp POS</div>`;
  html += `<div style='text-align:center;font-size:0.95rem;color:#888;margin-bottom:0.5rem;'>${d.date}</div>`;
  html += `<hr style='margin:0.5rem 0;border-top:1.5px dashed #bbb;' />`;
  html += `<div style='font-size:0.98rem;'><strong>Cliente:</strong> ${d.clientName}</div>`;
  html += `<div class='mb-2'><strong>Monto original:</strong> ${formatCurrency(d.total || d.amount + (d.abono || 0))}</div>`;
  if (d.abono) html += `<div class='mb-2'><strong>Abonado:</strong> ${formatCurrency(d.abono)}</div>`;
  html += `<div class='mb-2'><strong>Saldo:</strong> <span class='text-danger'>${formatCurrency(d.amount)}</span></div>`;
  html += `<hr style='margin:0.5rem 0;border-top:1.5px dashed #bbb;' />`;
  html += `<div class='mb-2'><strong>Motivo:</strong> ${d.reason || '-'}</div>`;
  html += `</div>`;

  let showAbonar = d.amount > 0;
  let showPagar = d.amount > 0;

  Swal.fire({
    title: '',
    html: html,
    showCancelButton: true,
    showConfirmButton: showPagar,
    confirmButtonText: 'Pagar todo',
    showDenyButton: showAbonar,
    denyButtonText: 'Abonar',
    cancelButtonText: 'Cerrar',
    customClass: { popup: 'swal2-pos-ticket' }
  }).then(result => {
    if (result.isConfirmed) {
      // Pagar todo
      d.abono = (d.abono || 0) + d.amount;
      d.amount = 0;
      saveToStorage('debts', debts);
      renderDebts();
      Swal.fire({ icon: 'success', title: 'Deuda pagada', text: 'La deuda ha sido pagada en su totalidad.' });
    } else if (result.isDenied) {
      // Abonar
      Swal.fire({
        title: 'Abonar a deuda',
        html: `<div class='mb-2'>¿Cuánto desea abonar?</div><input id='abonoInput' type='number' min='1' max='${d.amount}' class='form-control' placeholder='Abono' />`,
        inputAttributes: { min: 1, max: d.amount },
        showCancelButton: true,
        confirmButtonText: 'Abonar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const abono = parseFloat(document.getElementById('abonoInput').value) || 0;
          if (abono < 1 || abono > d.amount) {
            Swal.showValidationMessage('El abono debe ser entre 1 y el saldo');
            return false;
          }
          return abono;
        }
      }).then((abonoResult) => {
        if (abonoResult.isConfirmed) {
          const abono = abonoResult.value;
          d.abono = (d.abono || 0) + abono;
          d.amount -= abono;
          if (d.amount < 0) d.amount = 0;
          saveToStorage('debts', debts);
          renderDebts();
          Swal.fire({ icon: 'success', title: 'Abono registrado', text: `Abono registrado: ${formatCurrency(abono)}` });
        }
      });
    }
  });
}

// === Mostrar resumen de balance ===
function updateBalanceUI() {
  // Ya no se actualizan los elementos antiguos, solo se renderiza el grid
  renderBalanceGrid();
}

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

// Modal de detalles de producto
function showProductDetailModal(productId) {
  const p = products.find(prod => prod.id === productId);
  if (!p) return;
  let html = `
    <div class="text-center mb-3">
      ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;" />` : ''}
    </div>
    <h4 class="mb-2">${p.name}</h4>
    <p><strong>Categoría:</strong> ${p.category || '-'}</p>
    <p><strong>Costo:</strong> ${formatCurrency(p.cost)}</p>
    <p><strong>Precio:</strong> ${formatCurrency(p.price)}</p>
    <div class="d-flex justify-content-end gap-2 mt-4">
      <button class="btn btn-outline-danger" onclick="deleteProduct('${p.id}')"><i class="bi bi-trash"></i> Eliminar</button>
      <button class="btn btn-outline-primary" onclick="editProduct('${p.id}')"><i class="bi bi-pencil"></i> Editar</button>
    </div>
  `;
  Swal.fire({
    title: 'Detalles del producto',
    html,
    showConfirmButton: false,
    showCloseButton: true,
    width: 400
  });
}

// Funciones de editar/eliminar producto (solo placeholders por ahora)
function deleteProduct(productId) {
  Swal.close();
  Swal.fire({
    icon: 'warning',
    title: '¿Eliminar producto?',
    text: 'Esta acción no se puede deshacer.',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then(result => {
    if (result.isConfirmed) {
      products = products.filter(p => p.id !== productId);
      saveToStorage('products', products);
      renderInventory();
      Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Producto eliminado.' });
    }
  });
}

function editProduct(productId) {
  Swal.close();
  // Aquí puedes implementar la lógica para editar el producto (abrir modal de edición, etc.)
  Swal.fire({
    icon: 'info',
    title: 'Editar producto',
    text: 'Funcionalidad de edición en desarrollo.'
  });
}

function renderSalesProducts() {
  const salesContainer = document.getElementById('productSalesList');
  salesContainer.innerHTML = '';
  products.forEach(p => {
    const saleCard = document.createElement('div');
    saleCard.className = 'col-12 col-md-4 col-lg-3';
    saleCard.innerHTML = `
      <div class="product-card">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" />` : ''}
        <h6 class="mb-1">${p.name}</h6>
        <p class="mb-2">${formatCurrency(p.price)}</p>
        <button class="btn btn-sm btn-outline-primary w-100" onclick="addToCart('${p.id}')">Agregar</button>
      </div>
    `;
    salesContainer.appendChild(saleCard);
  });
}

function renderBalanceGrid() {
  const grid = document.getElementById('balanceGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // Helpers para fechas
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

  // Inicializar acumuladores
  const periods = [
    { key: 'day', label: 'Hoy', check: isSameDay },
    { key: 'week', label: 'Esta semana', check: isSameWeek },
    { key: 'month', label: 'Este mes', check: isSameMonth },
    { key: 'year', label: 'Este año', check: isSameYear }
  ];

  const resumen = {};
  periods.forEach(p => resumen[p.key] = { ventas: 0, creditos: 0, utilidad: 0 });

  // Ventas
  sales.forEach(s => {
    const fecha = new Date(s.date);
    periods.forEach(p => {
      if (p.check(fecha, now)) {
        resumen[p.key].ventas += s.total;
        resumen[p.key].utilidad += s.profit;
      }
    });
  });
  // Créditos (deudas)
  debts.forEach(d => {
    const fecha = new Date(d.date);
    periods.forEach(p => {
      if (p.check(fecha, now)) {
        resumen[p.key].creditos += d.amount + (d.abono || 0);
      }
    });
  });

  // Renderizar tarjetas
  periods.forEach(p => {
    const card = document.createElement('div');
    card.className = 'col-12 col-md-6 col-lg-3 d-flex';
    card.innerHTML = `
      <div class='balance-card w-100'>
        <div class='balance-title'>${p.label}</div>
        <div class='balance-period'>Resumen ${p.key}</div>
        <div class='balance-amount mb-2'>${formatCurrency(resumen[p.key].ventas)}</div>
        <div class='balance-label'>Total vendido</div>
        <div class='balance-divider'></div>
        <div class='balance-credit mb-1'>${formatCurrency(resumen[p.key].creditos)}</div>
        <div class='balance-label'>Total créditos</div>
        <div class='balance-divider'></div>
        <div class='balance-profit mb-1'>${formatCurrency(resumen[p.key].utilidad)}</div>
        <div class='balance-label'>Utilidad</div>
      </div>
    `;
    grid.appendChild(card);
  });
}