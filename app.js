// === Arrays globales ===
let products = [];
let clients = [];
let sales = [];
let debts = [];
let cart = [];
let currentClientId = null;
let inventoryViewMode = localStorage.getItem('inventoryViewMode') || 'grid'; // 'grid' o 'list'
let clientsViewMode = localStorage.getItem('clientsViewMode') || 'grid'; // 'grid' o 'list'



// === Funciones del Sidebar (globales) ===
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// === Configuración de tema (global) ===
function setTheme(mode) {
  // Remover clases activas de todos los botones
  document.querySelectorAll('.sidebar-action-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Activar el botón seleccionado
  document.getElementById(`theme-${mode}`).classList.add('active');
  
  if (mode === 'auto') {
    // Detectar automáticamente
    detectDarkMode();
  } else if (mode === 'dark') {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
  
  // Guardar preferencia
  localStorage.setItem('theme', mode);
  
  // Mostrar notificación
  const themeNames = {
    light: 'Modo Claro',
    dark: 'Modo Oscuro',
    auto: 'Automático'
  };
  
  Swal.fire({
    icon: 'success',
    title: 'Tema cambiado',
    text: `Cambiado a ${themeNames[mode]}`,
    timer: 1500,
    showConfirmButton: false
  });
}

// === Actualizar fecha y hora en tiempo real ===
function updateDateTime() {
  const now = new Date();
  
  // Formatear fecha
  const dateOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const dateStr = now.toLocaleDateString('es-ES', dateOptions);
  document.getElementById('currentDate').textContent = dateStr;
  
  // Formatear hora
  const timeOptions = { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  };
  const timeStr = now.toLocaleTimeString('es-ES', timeOptions);
  document.getElementById('currentTime').textContent = timeStr;
}

// Actualizar cada segundo
setInterval(updateDateTime, 1000);
updateDateTime(); // Ejecutar inmediatamente

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

  // Cerrar sidebar al hacer clic en overlay
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);







  // Filtros de balance
  document.querySelectorAll('input[name="periodFilter"]').forEach(radio => {
    radio.addEventListener('change', () => {
      renderBalanceGrid();
    });
  });

  // === Inicialización del sidebar ===
  // Cargar tema guardado
  const savedTheme = localStorage.getItem('theme') || 'auto';
  setTheme(savedTheme);
  
  // Cerrar sidebar con Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeSidebar();
    }
  });
});

// === Agregar producto con vista previa de imagen ===
function addProduct(e) {
  e.preventDefault();
  const name = document.getElementById('productName').value.trim();
  const cost = parseFloat(document.getElementById('productCost').value);
  const price = parseFloat(document.getElementById('productPrice').value);
  const category = document.getElementById('productCategory').value.trim();
  const stock = parseInt(document.getElementById('productStock').value) || 0;
  const imageInput = document.getElementById('productImage');

  if (!name || isNaN(cost) || isNaN(price)) {
    Swal.fire({
      icon: 'error',
      title: 'Datos incompletos',
      text: 'Por favor completa todos los campos obligatorios.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  if (cost < 0 || price < 0) {
    Swal.fire({
      icon: 'error',
      title: 'Valores inválidos',
      text: 'El costo y precio deben ser valores positivos.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  if (price < cost) {
    Swal.fire({
      icon: 'warning',
      title: 'Precio bajo',
      text: 'El precio de venta es menor al costo. ¿Estás seguro?',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Revisar'
    }).then((result) => {
      if (!result.isConfirmed) return;
      saveProduct();
    });
    return;
  }

  saveProduct();

  function saveProduct() {
    const saveProductImage = (imageData) => {
      const newProduct = {
        id: generateId('product'),
        name,
        cost,
        price,
        category,
        stock,
        image: imageData
      };
      
      products.push(newProduct);
      saveToStorage('products', products);
      renderInventory();
      renderSalesProducts();
      
      // Limpiar formulario
      document.getElementById('formProduct').reset();
      document.getElementById('imagePreview').innerHTML = '';
      
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalProduct'));
      modal.hide();
      
      Swal.fire({
        icon: 'success',
        title: 'Producto agregado',
        text: 'Producto agregado correctamente.',
        confirmButtonText: 'Aceptar'
      });
    };

    if (imageInput && imageInput.files && imageInput.files[0]) {
      const reader = new FileReader();
      reader.onload = () => saveProductImage(reader.result);
      reader.readAsDataURL(imageInput.files[0]);
    } else {
      saveProductImage('');
    }
  }
}

// Vista previa de imagen para productos
document.getElementById('productImage').addEventListener('change', function(e) {
  const preview = document.getElementById('imagePreview');
  const file = e.target.files[0];
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = '';
  }
});

// Vista previa de imagen para clientes
document.getElementById('clientPhoto').addEventListener('change', function(e) {
  const preview = document.getElementById('clientImagePreview');
  const file = e.target.files[0];
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = '';
  }
});

// === Mostrar productos en Inventario y Venta ===
// Renderizar inventario con diseño tipo Treinta.co
function renderInventory() {
  const container = document.getElementById('inventoryList');
  const isGridView = localStorage.getItem('inventoryView') !== 'list';
  
  if (isGridView) {
    container.className = 'row gy-3';
    container.innerHTML = products.map(product => `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="product-card-treinta" onclick="showProductDetailModal(${product.id})">
          <img src="${product.image || 'icons/descarga.png'}" alt="${product.name}" onerror="this.src='icons/descarga.png'">
          <h5>${product.name}</h5>
          <div class="product-category">${product.category || '-'}</div>
          <div class="product-price">$${product.price.toFixed(2)}</div>
          <div class="product-cost">Costo: $${product.cost.toFixed(2)}</div>
          <div class="mt-2">
            <span class="badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}">
              Stock: ${product.stock}
            </span>
          </div>
        </div>
      </div>
    `).join('');
  } else {
    container.className = 'list-group';
    container.innerHTML = products.map(product => `
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
          <button class="btn btn-sm btn-outline-primary" onclick="showProductDetailModal(${product.id})">
            <i class="bi bi-eye"></i>
          </button>
        </div>
      </li>
    `).join('');
  }
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

// === Mostrar carrito con diseño tipo Treinta.co ===
function renderCart() {
  const container = document.getElementById('cartList');
  const totalElement = document.getElementById('cartTotal');
  const finalizeBtn = document.getElementById('finalizeBtn');
  const clearCartBtn = document.getElementById('clearCartBtn');
  
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-cart-x" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">Carrito vacío</p>
        <small class="text-muted">Selecciona productos para comenzar</small>
      </div>
    `;
    totalElement.textContent = '$0.00';
    finalizeBtn.disabled = true;
    clearCartBtn.style.display = 'none';
    return;
  }

  clearCartBtn.style.display = 'block';

  container.innerHTML = cart.map(item => `
    <div class="cart-item-treinta">
      <div class="cart-item-qty-treinta">
        <button class="btn btn-sm btn-outline-secondary" onclick="changeCartQty('${item.id}', -1)">-</button>
        <span class="qty-display">${item.qty}</span>
        <button class="btn btn-sm btn-outline-secondary" onclick="changeCartQty('${item.id}', 1)">+</button>
      </div>
      <div class="cart-item-info-treinta">
        <div class="cart-item-name-treinta">${item.name}</div>
        <div class="cart-item-price-treinta">$${item.price.toFixed(2)} c/u</div>
      </div>
      <div class="cart-item-actions-treinta">
        <div class="fw-bold fs-6">$${(item.price * item.qty).toFixed(2)}</div>
        <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart('${item.id}')">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  totalElement.textContent = `$${total.toFixed(2)}`;
  finalizeBtn.disabled = false;
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

// === Finalizar venta con comprobante tipo Treinta.co ===
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

  // Comprobante moderno tipo Treinta.co
  let detalle = `
    <div class="receipt-treinta">
      <div class="receipt-header">
        <div class="receipt-logo">
          <img src="TillUp.png" alt="TillUp" style="width: 60px; height: 60px; object-fit: contain;">
          <h3>TillUp POS</h3>
        </div>
        <div class="receipt-date">${fecha}</div>
      </div>
      
      <div class="receipt-client">
        <i class="bi bi-person-circle"></i>
        <span><strong>Cliente:</strong> ${client.name}</span>
      </div>
      
      <div class="receipt-items">
        <div class="receipt-items-header">
          <span>Producto</span>
          <span>Cant.</span>
          <span>Precio</span>
          <span>Subtotal</span>
        </div>
        ${cart.map(item => `
          <div class="receipt-item">
            <span class="item-name">${item.name}</span>
            <span class="item-qty">${item.qty}</span>
            <span class="item-price">$${item.price.toFixed(2)}</span>
            <span class="item-subtotal">$${(item.price * item.qty).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="receipt-total">
        <div class="total-line">
          <span>Total:</span>
          <span class="total-amount">$${total.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="receipt-footer">
        <small>¡Gracias por su compra!</small>
      </div>
    </div>
  `;

  Swal.fire({
    title: '',
    html: detalle,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Pago Completo',
    denyButtonText: 'Venta a Crédito',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    customClass: { 
      popup: 'swal2-receipt-treinta',
      confirmButton: 'btn btn-success',
      denyButton: 'btn btn-warning',
      cancelButton: 'btn btn-secondary'
    }
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
      Swal.fire({ 
        icon: 'success', 
        title: 'Venta registrada', 
        text: 'Venta registrada correctamente.',
        confirmButtonText: 'Aceptar'
      });
    } else if (result.isDenied) {
      // Venta a crédito: pedir abono
      Swal.fire({
        title: 'Abono inicial',
        html: `
          <div class="mb-3">
            <label class="form-label">¿El cliente desea abonar una parte?</label>
            <input id='abonoInput' type='number' min='0' max='${total}' step='0.01' 
                   class='form-control' placeholder='Monto del abono (opcional)' />
            <div class="form-text">Deja en 0 si no hay abono inicial</div>
          </div>
        `,
        inputAttributes: { min: 0, max: total, step: 0.01 },
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
          Swal.fire({ 
            icon: 'success', 
            title: 'Deuda registrada', 
            text: abono > 0 ? `Abono registrado: ${formatCurrency(abono)}` : 'Deuda registrada correctamente.',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    }
  });
}

// === Agregar/Editar cliente con validación mejorada ===
function addClient(e) {
  e.preventDefault();
  const name = document.getElementById('clientName').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const address = document.getElementById('clientAddress').value.trim();
  const photoInput = document.getElementById('clientPhoto');

  if (!name) {
    Swal.fire({
      icon: 'error',
      title: 'Nombre requerido',
      text: 'El nombre del cliente es obligatorio.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  // Validar formato de teléfono si se proporciona
  if (phone && !/^[0-9]{7,15}$/.test(phone)) {
    Swal.fire({
      icon: 'error',
      title: 'Teléfono inválido',
      text: 'El número de teléfono debe tener entre 7 y 15 dígitos.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const saveClient = (photo) => {
    if (window.editingClientId) {
      // Editar cliente existente
      const clientIndex = clients.findIndex(c => c.id === window.editingClientId);
      if (clientIndex !== -1) {
        clients[clientIndex] = {
          ...clients[clientIndex],
          name,
          phone,
          address,
          photo: photo || clients[clientIndex].photo
        };
      }
      delete window.editingClientId;
    } else {
      // Agregar nuevo cliente
      clients.push({
        id: generateId('client'),
        name,
        phone,
        address,
        photo,
        debt: 0
      });
    }

    // Calcular deuda total por cliente
    clients.forEach(client => {
      const clientDebts = debts.filter(d => d.clientId === client.id);
      client.debt = clientDebts.reduce((sum, d) => sum + d.amount, 0);
    });

    saveToStorage('clients', clients);
    renderClients();
    updateClientSelector();
    
    // Limpiar formulario
    document.getElementById('formClient').reset();
    document.getElementById('clientImagePreview').innerHTML = '';
    document.getElementById('locationStatus').textContent = '';
    
    // Restaurar texto del botón
    const submitBtn = document.querySelector('#modalClient .btn-primary');
    submitBtn.innerHTML = '<i class="bi bi-person-plus"></i> Agregar Cliente';
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalClient'));
    modal.hide();
    
    Swal.fire({ 
      icon: 'success', 
      title: window.editingClientId ? 'Cliente actualizado' : 'Cliente agregado', 
      text: window.editingClientId ? 'Cliente actualizado correctamente.' : 'Cliente agregado correctamente.',
      confirmButtonText: 'Aceptar'
    });
  };

  if (photoInput && photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => saveClient(reader.result);
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    saveClient('');
  }
}

// Renderizar clientes con diseño tipo Treinta.co
function renderClients() {
  const container = document.getElementById('clientList');
  const isGridView = localStorage.getItem('clientsView') !== 'list';
  
  if (isGridView) {
    container.className = 'row gy-3';
    container.innerHTML = clients.map(client => `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="client-card-treinta" onclick="showClientDetails(${client.id})">
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
    container.innerHTML = clients.map(client => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          ${client.photo ? 
            `<img src="${client.photo}" alt="${client.name}" class="client-photo" style="margin: 0 1rem 0 0;" onerror="this.parentElement.querySelector('.client-avatar').style.display='flex'; this.style.display='none';">` :
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
          <button class="btn btn-sm btn-outline-primary" onclick="showClientDetails(${client.id})">
            <i class="bi bi-eye"></i>
          </button>
        </div>
      </li>
    `).join('');
  }
}

// === Selector de cliente en ventas ===
function updateClientSelector() {
  const selector = document.getElementById('clientSelector');
  selector.innerHTML = `<option disabled selected value="">Selecciona un cliente</option>`;

  clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.innerText = `${c.name}${c.debt > 0 ? ` (Deuda: $${c.debt.toFixed(2)})` : ''}`;
    selector.appendChild(opt);
  });
  
  // Agregar evento para cambiar cliente
  selector.addEventListener('change', function() {
    const selectedClientId = this.value;
    if (selectedClientId) {
      currentClientId = selectedClientId;
      // Cargar proforma guardada para este cliente
      loadProforma(selectedClientId);
      renderCart();
      
      // Mostrar notificación
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        Swal.fire({
          icon: 'info',
          title: 'Cliente seleccionado',
          text: `Cliente: ${client.name}`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    }
  });
}

// === Mostrar deudas con diseño tipo Treinta.co ===
function renderDebts() {
  const list = document.getElementById('debtList');
  list.innerHTML = '';

  if (debts.length === 0) {
    list.innerHTML = `<div class='alert alert-secondary text-center'>Sin deudas registradas</div>`;
    return;
  }

  list.className = 'row gy-3';
  list.innerHTML = debts.map(debt => {
    let status = 'unpaid', statusText = 'Pendiente', statusClass = 'bg-warning';
    if (debt.amount === 0) { 
      status = 'paid'; 
      statusText = 'Pagada'; 
      statusClass = 'bg-success';
    } else if (debt.abono && debt.abono > 0) { 
      status = 'partial'; 
      statusText = 'Abonada'; 
      statusClass = 'bg-info';
    }
    
    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="debt-card-treinta ${status}" onclick="showDebtDetailModal(${debt.id})">
          <div class="debt-header">
            <div class="debt-client">${debt.clientName}</div>
            <div class="debt-date">${debt.date}</div>
          </div>
          <div class="debt-body">
            <div class="debt-amount">$${(debt.total || debt.amount + (debt.abono || 0)).toFixed(2)}</div>
            ${debt.abono ? `<div class="debt-abono">Abonado: $${debt.abono.toFixed(2)}</div>` : ''}
            <div class="debt-saldo">Saldo: $${debt.amount.toFixed(2)}</div>
          </div>
          <div class="debt-footer">
            <span class="badge ${statusClass}">${statusText}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
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

// Renderizar productos en ventas con diseño tipo Treinta.co
function renderSalesProducts() {
  const container = document.getElementById('salesProductsGrid');
  const productsCount = document.getElementById('productsCount');
  if (!container) return;
  
  // Filtrar productos por búsqueda
  const searchTerm = document.getElementById('productSearch')?.value?.toLowerCase() || '';
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.description?.toLowerCase().includes(searchTerm)
  );
  
  productsCount.textContent = `${filteredProducts.length} productos`;
  
  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4" style="grid-column: 1 / -1;">
        <i class="bi bi-search" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">No se encontraron productos</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filteredProducts.map(product => `
    <div class="product-card-treinta" onclick="addToCart(${product.id})">
      <img src="${product.image || 'https://via.placeholder.com/200x120?text=Producto'}" 
           class="product-image-treinta" alt="${product.name}" onerror="this.src='https://via.placeholder.com/200x120?text=Producto'">
      <div class="product-info-treinta">
        <div class="product-name-treinta">${product.name}</div>
        <div class="product-price-treinta">$${product.price.toFixed(2)}</div>
        <div class="product-stock-treinta">
          <i class="bi bi-box-seam"></i> Stock: ${product.stock}
        </div>
        <div class="product-actions-treinta">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); addToCart(${product.id})" ${product.stock <= 0 ? 'disabled' : ''}>
            <i class="bi bi-plus"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm" onclick="event.stopPropagation(); showProductDetailModal(${product.id})">
            <i class="bi bi-eye"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Cambiar vista de productos en ventas
function toggleSalesView() {
  const currentView = localStorage.getItem('salesView');
  const newView = currentView === 'list' ? 'grid' : 'list';
  localStorage.setItem('salesView', newView);
  
  const toggleBtn = document.getElementById('toggleSalesView');
  const toggleText = document.getElementById('toggleSalesViewText');
  
  if (newView === 'grid') {
    toggleBtn.innerHTML = '<i class="bi bi-list"></i> <span id="toggleSalesViewText">Lista</span>';
  } else {
    toggleBtn.innerHTML = '<i class="bi bi-grid-3x3-gap-fill"></i> <span id="toggleSalesViewText">Cuadrícula</span>';
  }
  
  renderSalesProducts();
}

// Cambiar vista de inventario
function toggleInventoryView() {
  const currentView = localStorage.getItem('inventoryView');
  const newView = currentView === 'list' ? 'grid' : 'list';
  localStorage.setItem('inventoryView', newView);
  
  const toggleBtn = document.getElementById('toggleInventoryView');
  const toggleText = document.getElementById('toggleInventoryViewText');
  
  if (newView === 'grid') {
    toggleBtn.innerHTML = '<i class="bi bi-list"></i> <span id="toggleInventoryViewText">Lista</span>';
  } else {
    toggleBtn.innerHTML = '<i class="bi bi-grid-3x3-gap-fill"></i> <span id="toggleInventoryViewText">Cuadrícula</span>';
  }
  
  renderInventory();
}

// Cambiar vista de clientes
function toggleClientsView() {
  const currentView = localStorage.getItem('clientsView');
  const newView = currentView === 'list' ? 'grid' : 'list';
  localStorage.setItem('clientsView', newView);
  
  const toggleBtn = document.getElementById('toggleClientsView');
  const toggleText = document.getElementById('toggleClientsViewText');
  
  if (newView === 'grid') {
    toggleBtn.innerHTML = '<i class="bi bi-list"></i> <span id="toggleClientsViewText">Lista</span>';
  } else {
    toggleBtn.innerHTML = '<i class="bi bi-grid-3x3-gap-fill"></i> <span id="toggleClientsViewText">Cuadrícula</span>';
  }
  
  renderClients();
}

// Remover producto del carrito
function removeFromCart(productId) {
  const index = cart.findIndex(item => item.id === productId);
  if (index !== -1) {
    cart.splice(index, 1);
    saveProforma(currentClientId, cart);
    renderCart();
  }
}

// === Renderizar balance con diseño tipo Treinta.co ===
function renderBalanceGrid() {
  const currentPeriod = document.querySelector('input[name="periodFilter"]:checked').value;
  const data = calculateBalanceData(currentPeriod);
  const movements = getRecentMovements(currentPeriod);
  
  // Renderizar tarjetas de balance
  const cardsContainer = document.getElementById('balanceCards');
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
        <span>+${((data.income / (data.income + data.expenses)) * 100).toFixed(1)}% del total</span>
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
        <span>-${((data.expenses / (data.income + data.expenses)) * 100).toFixed(1)}% del total</span>
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
        <span>${data.profit >= 0 ? '+' : ''}${((data.profit / data.income) * 100).toFixed(1)}% margen</span>
      </div>
    </div>
    
    <div class="balance-card-treinta credits">
      <div class="balance-card-header">
        <div class="balance-card-icon">
          <i class="bi bi-cash-stack"></i>
        </div>
        <h6 class="balance-card-title">Créditos</h6>
      </div>
      <div class="balance-card-amount">$${debts.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}</div>
      <div class="balance-card-change">
        <i class="bi bi-clock"></i>
        <span>${debts.length} deudas pendientes</span>
      </div>
    </div>
  `;
  
  // Renderizar movimientos
  const movementsContainer = document.getElementById('movementsList');
  const movementsCount = document.getElementById('movementsCount');
  
  movementsCount.textContent = `${movements.length} movimientos`;
  
  if (movements.length === 0) {
    movementsContainer.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">Sin movimientos en este periodo</p>
      </div>
    `;
    return;
  }
  
  movementsContainer.innerHTML = movements.map(movement => `
    <div class="movement-item-treinta">
      <div class="movement-icon ${movement.type}">
        <i class="bi ${movement.icon}"></i>
      </div>
      <div class="movement-content">
        <div class="movement-title">${movement.title}</div>
        <div class="movement-subtitle">${movement.subtitle}</div>
      </div>
      <div class="movement-amount ${movement.amountClass}">
        ${movement.amountClass === 'positive' ? '+' : ''}$${movement.amount.toFixed(2)}
      </div>
    </div>
  `).join('');
}

// === Eventos para filtros de periodo ===
document.addEventListener('DOMContentLoaded', function() {
  // Agregar eventos a los filtros de periodo
  document.querySelectorAll('input[name="periodFilter"]').forEach(radio => {
    radio.addEventListener('change', function() {
      renderBalanceGrid();
      
      // Mostrar notificación del cambio
      const periodNames = {
        day: 'Diario',
        week: 'Semanal',
        month: 'Mensual',
        year: 'Anual'
      };
      
      Swal.fire({
        icon: 'info',
        title: `Periodo: ${periodNames[this.value]}`,
        timer: 1000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    });
  });
  
  // Agregar evento de búsqueda de productos
  const productSearch = document.getElementById('productSearch');
  if (productSearch) {
    productSearch.addEventListener('input', function() {
      renderSalesProducts();
    });
  }
});

function calculateBalanceData(period) {
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
  
  const checkPeriod = period === 'day' ? isSameDay : period === 'week' ? isSameWeek : period === 'month' ? isSameMonth : isSameYear;
  
  let income = 0, expenses = 0, profit = 0;
  
  sales.forEach(s => {
    const fecha = new Date(s.date);
    if (checkPeriod(fecha, now)) {
      income += s.total;
      profit += s.profit;
    }
  });
  
  // Gastos (costos de ventas)
  expenses = income - profit;
  
  return { income, expenses, profit };
}

function getRecentMovements(period) {
  const movements = [];
  const now = new Date();
  let startDate;
  
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
  
  // Agregar ventas del periodo
  sales.forEach(sale => {
    const saleDate = new Date(sale.date);
    if (saleDate >= startDate) {
      movements.push({
        type: 'sale',
        icon: 'bi-cart-check',
        title: `Venta #${sale.id}`,
        subtitle: `${sale.clientName} - ${saleDate.toLocaleDateString()}`,
        amount: sale.total,
        amountClass: 'positive',
        date: saleDate
      });
    }
  });
  
  // Agregar deudas del periodo
  debts.forEach(debt => {
    const debtDate = new Date(debt.date);
    if (debtDate >= startDate) {
      movements.push({
        type: 'debt',
        icon: 'bi-cash-stack',
        title: `Deuda #${debt.id}`,
        subtitle: `${debt.clientName} - ${debtDate.toLocaleDateString()}`,
        amount: debt.amount,
        amountClass: 'negative',
        date: debtDate
      });
    }
  });
  
  // Agregar pagos de deudas del periodo
  debts.forEach(debt => {
    if (debt.payments && debt.payments.length > 0) {
      debt.payments.forEach(payment => {
        const paymentDate = new Date(payment.date);
        if (paymentDate >= startDate) {
          movements.push({
            type: 'payment',
            icon: 'bi-cash-coin',
            title: `Pago deuda #${debt.id}`,
            subtitle: `${debt.clientName} - ${paymentDate.toLocaleDateString()}`,
            amount: payment.amount,
            amountClass: 'positive',
            date: paymentDate
          });
        }
      });
    }
  });
  
  // Ordenar por fecha más reciente y limitar a 10
  return movements
    .sort((a, b) => b.date - a.date)
    .slice(0, 10);
}

function showView(viewName) {
  // Ocultar todas las vistas
  document.querySelectorAll('.app-view').forEach(v => v.classList.add('d-none'));
  document.getElementById(`view-${viewName}`).classList.remove('d-none');
  
  // Resaltar pestaña activa en sidebar
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`nav-${viewName}`).classList.add('active');
  
  // Resaltar pestaña activa en navegación inferior
  document.querySelectorAll('.navbar-treinta .btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`nav-bottom-${viewName}`).classList.add('active');
  
  // Cerrar sidebar en móviles
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
  
  // Actualizar título de la página
  const titles = {
    inventory: 'Inventario',
    sales: 'Ventas',
    clients: 'Clientes',
    debt: 'Deudas',
    balance: 'Balance'
  };
  
  // Mostrar notificación de cambio de vista
  Swal.fire({
    icon: 'info',
    title: `Vista: ${titles[viewName]}`,
    timer: 1000,
    showConfirmButton: false,
    position: 'top-end',
    toast: true
  });
}

// Mostrar detalles del cliente
function showClientDetails(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) return;
  
  let html = `
    <div class="text-center mb-3">
      ${client.photo ? 
        `<img src="${client.photo}" alt="${client.name}" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:3px solid #1F2D3D;" />` :
        `<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg, #1F2D3D, #2a3f5a);display:flex;align-items:center;justify-content:center;margin:0 auto;color:#fff;font-size:2rem;font-weight:700;border:3px solid #1F2D3D;">${client.name.charAt(0).toUpperCase()}</div>`
      }
    </div>
    <h4 class="mb-3 text-center">${client.name}</h4>
    <div class="row">
      <div class="col-12 mb-2">
        <strong><i class="bi bi-telephone"></i> Teléfono:</strong> ${client.phone || 'No registrado'}
      </div>
      <div class="col-12 mb-2">
        <strong><i class="bi bi-geo-alt"></i> Dirección:</strong> ${client.address || 'No registrada'}
      </div>
      ${client.location ? `
        <div class="col-12 mb-3">
          <a href="https://maps.google.com/?q=${client.location}" target="_blank" class="btn btn-outline-primary btn-sm">
            <i class="bi bi-geo-alt-fill"></i> Ver ubicación en mapa
          </a>
        </div>
      ` : ''}
      <div class="col-12">
        <strong>Deuda actual:</strong> 
        <span class="badge ${client.debt > 0 ? 'bg-warning' : 'bg-success'} fs-6">
          ${client.debt > 0 ? `$${client.debt.toFixed(2)}` : 'Sin deuda'}
        </span>
      </div>
    </div>
  `;

  Swal.fire({
    title: 'Detalles del Cliente',
    html: html,
    showCancelButton: true,
    confirmButtonText: 'Editar',
    cancelButtonText: 'Cerrar',
    showDenyButton: client.debt > 0,
    denyButtonText: 'Ver deudas'
  }).then((result) => {
    if (result.isConfirmed) {
      // Editar cliente
      editClient(clientId);
    } else if (result.isDenied) {
      // Ver deudas del cliente
      showClientDebts(clientId);
    }
  });
}

// Mostrar deudas de un cliente específico
function showClientDebts(clientId) {
  const client = clients.find(c => c.id === clientId);
  const clientDebts = debts.filter(d => d.clientId === clientId);
  
  if (clientDebts.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Sin deudas',
      text: `${client.name} no tiene deudas registradas.`
    });
    return;
  }

  let html = `<h5 class="mb-3">Deudas de ${client.name}</h5>`;
  clientDebts.forEach(debt => {
    html += `
      <div class="border rounded p-3 mb-2">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>${debt.date}</strong><br>
            <small class="text-muted">${debt.reason || 'Venta a crédito'}</small>
          </div>
          <div class="text-end">
            <div class="fw-bold">$${debt.amount.toFixed(2)}</div>
            ${debt.abono ? `<small class="text-success">Abonado: $${debt.abono.toFixed(2)}</small>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  Swal.fire({
    title: 'Deudas del Cliente',
    html: html,
    showCancelButton: true,
    confirmButtonText: 'Abonar',
    cancelButtonText: 'Cerrar'
  }).then((result) => {
    if (result.isConfirmed) {
      // Mostrar modal de abono
      const totalDebt = clientDebts.reduce((sum, d) => sum + d.amount, 0);
      Swal.fire({
        title: 'Abonar a deuda',
        html: `<div class='mb-2'>¿Cuánto desea abonar?</div><input id='abonoInput' type='number' min='1' max='${totalDebt}' class='form-control' placeholder='Abono' />`,
        inputAttributes: { min: 1, max: totalDebt },
        showCancelButton: true,
        confirmButtonText: 'Abonar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const abono = parseFloat(document.getElementById('abonoInput').value) || 0;
          if (abono < 1 || abono > totalDebt) {
            Swal.showValidationMessage('El abono debe ser entre 1 y el total de deuda');
            return false;
          }
          return abono;
        }
      }).then((abonoResult) => {
        if (abonoResult.isConfirmed) {
          const abono = abonoResult.value;
          // Aplicar abono a las deudas (prioridad por fecha más antigua)
          let remainingAbono = abono;
          clientDebts.sort((a, b) => new Date(a.date) - new Date(b.date));
          
          for (let debt of clientDebts) {
            if (remainingAbono <= 0) break;
            if (debt.amount > 0) {
              const abonoToApply = Math.min(remainingAbono, debt.amount);
              debt.abono = (debt.abono || 0) + abonoToApply;
              debt.amount -= abonoToApply;
              remainingAbono -= abonoToApply;
            }
          }
          
          saveToStorage('debts', debts);
          renderDebts();
          renderClients();
          Swal.fire({ 
            icon: 'success', 
            title: 'Abono registrado', 
            text: `Abono registrado: ${formatCurrency(abono)}` 
          });
        }
      });
    }
  });
}

// Editar cliente con vista previa de imagen
function editClient(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) return;
  
  // Llenar el formulario con los datos del cliente
  document.getElementById('clientName').value = client.name;
  document.getElementById('clientPhone').value = client.phone || '';
  document.getElementById('clientAddress').value = client.address || '';
  
  // Mostrar imagen actual si existe
  const preview = document.getElementById('clientImagePreview');
  if (client.photo) {
    preview.innerHTML = `<img src="${client.photo}" alt="Foto actual">`;
  } else {
    preview.innerHTML = '';
  }
  
  // Guardar el ID del cliente a editar
  window.editingClientId = clientId;
  
  // Cambiar el texto del botón
  const submitBtn = document.querySelector('#modalClient .btn-primary');
  submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Actualizar Cliente';
  
  // Mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById('modalClient'));
  modal.show();
}

// === Funcionalidades Finales y Optimizaciones ===

// Búsqueda global en todas las vistas
function setupGlobalSearch() {
  const searchInputs = document.querySelectorAll('input[type="text"], input[type="search"]');
  searchInputs.forEach(input => {
    input.addEventListener('input', debounce(function() {
      const searchTerm = this.value.toLowerCase();
      const currentView = getCurrentView();
      
      switch(currentView) {
        case 'inventory':
          filterProducts(searchTerm);
          break;
        case 'sales':
          renderSalesProducts(); // Ya incluye búsqueda
          break;
        case 'clients':
          filterClients(searchTerm);
          break;
        case 'debt':
          filterDebts(searchTerm);
          break;
      }
    }, 300));
  });
}

// Función debounce para optimizar búsquedas
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Obtener vista actual
function getCurrentView() {
  const views = ['inventory', 'sales', 'clients', 'debt', 'balance'];
  for (let view of views) {
    if (!document.getElementById(`view-${view}`).classList.contains('d-none')) {
      return view;
    }
  }
  return 'inventory';
}

// Filtrar productos en inventario
function filterProducts(searchTerm) {
  const productCards = document.querySelectorAll('.product-card-treinta, .product-card');
  productCards.forEach(card => {
    const productName = card.querySelector('h5, h6, .product-name-treinta')?.textContent?.toLowerCase() || '';
    const productDesc = card.querySelector('.product-description')?.textContent?.toLowerCase() || '';
    const productCategory = card.querySelector('.product-category')?.textContent?.toLowerCase() || '';
    
    const matches = productName.includes(searchTerm) || 
                   productDesc.includes(searchTerm) || 
                   productCategory.includes(searchTerm);
    
    card.style.display = matches ? 'block' : 'none';
  });
}

// Filtrar clientes
function filterClients(searchTerm) {
  const clientCards = document.querySelectorAll('.client-card-treinta, .client-card, .list-group-item');
  clientCards.forEach(card => {
    const clientName = card.querySelector('.client-name, h5, h6')?.textContent?.toLowerCase() || '';
    const clientPhone = card.querySelector('.client-phone, .text-muted')?.textContent?.toLowerCase() || '';
    
    const matches = clientName.includes(searchTerm) || clientPhone.includes(searchTerm);
    card.style.display = matches ? 'block' : 'none';
  });
}

// Filtrar deudas
function filterDebts(searchTerm) {
  const debtCards = document.querySelectorAll('.debt-card-treinta, .debt-card, .debt-item');
  debtCards.forEach(card => {
    const clientName = card.querySelector('.debt-client, .client-name')?.textContent?.toLowerCase() || '';
    const debtDate = card.querySelector('.debt-date')?.textContent?.toLowerCase() || '';
    
    const matches = clientName.includes(searchTerm) || debtDate.includes(searchTerm);
    card.style.display = matches ? 'block' : 'none';
  });
}

// Estadísticas adicionales para balance
function getAdvancedStats(period) {
  const data = calculateBalanceData(period);
  const stats = {
    totalSales: sales.length,
    totalClients: clients.length,
    totalProducts: products.length,
    avgSaleValue: data.income / Math.max(sales.length, 1),
    profitMargin: ((data.profit / data.income) * 100) || 0,
    topSellingProduct: getTopSellingProduct(),
    mostValuableClient: getMostValuableClient(),
    debtRatio: (debts.reduce((sum, d) => sum + d.amount, 0) / Math.max(data.income, 1)) * 100
  };
  
  return stats;
}

// Obtener producto más vendido
function getTopSellingProduct() {
  const productSales = {};
  
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      productSales[item.id] = (productSales[item.id] || 0) + item.qty;
    });
  });
  
  const topProduct = Object.entries(productSales)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (topProduct) {
    const product = products.find(p => p.id === topProduct[0]);
    return {
      name: product?.name || 'Producto desconocido',
      sales: topProduct[1]
    };
  }
  
  return { name: 'Sin ventas', sales: 0 };
}

// Obtener cliente más valioso
function getMostValuableClient() {
  const clientSales = {};
  
  sales.forEach(sale => {
    clientSales[sale.clientId] = (clientSales[sale.clientId] || 0) + sale.total;
  });
  
  const topClient = Object.entries(clientSales)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (topClient) {
    const client = clients.find(c => c.id === topClient[0]);
    return {
      name: client?.name || 'Cliente desconocido',
      total: topClient[1]
    };
  }
  
  return { name: 'Sin ventas', total: 0 };
}

// Optimización de rendimiento - Lazy loading de imágenes
function setupLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// Cache de datos para mejorar rendimiento
const dataCache = new Map();

function getCachedData(key, fetchFunction, ttl = 5 * 60 * 1000) { // 5 minutos
  const cached = dataCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = fetchFunction();
  dataCache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}

// Limpiar cache periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of dataCache.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) { // 10 minutos
      dataCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cada 5 minutos

// Backup automático de datos
function setupAutoBackup() {
  setInterval(() => {
    const backupData = {
      products,
      clients,
      sales,
      debts,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('tillup_backup', JSON.stringify(backupData));
  }, 5 * 60 * 1000); // Cada 5 minutos
}

// Restaurar backup si es necesario
function restoreBackup() {
  const backup = localStorage.getItem('tillup_backup');
  if (backup) {
    try {
      const backupData = JSON.parse(backup);
      const backupAge = Date.now() - new Date(backupData.timestamp).getTime();
      
      // Solo restaurar si el backup es reciente (menos de 1 hora)
      if (backupAge < 60 * 60 * 1000) {
        products = backupData.products || products;
        clients = backupData.clients || clients;
        sales = backupData.sales || sales;
        debts = backupData.debts || debts;
        
        // Guardar datos restaurados
        saveToStorage('products', products);
        saveToStorage('clients', clients);
        saveToStorage('sales', sales);
        saveToStorage('debts', debts);
        
        console.log('Backup restaurado exitosamente');
      }
    } catch (error) {
      console.error('Error al restaurar backup:', error);
    }
  }
}

// Inicializar funcionalidades avanzadas
document.addEventListener('DOMContentLoaded', function() {
  // Configurar búsqueda global
  setupGlobalSearch();
  
  // Configurar lazy loading
  setupLazyLoading();
  
  // Configurar backup automático
  setupAutoBackup();
  
  // Restaurar backup si es necesario
  restoreBackup();
  
  // Mostrar estadísticas avanzadas en balance
  const balanceView = document.getElementById('view-balance');
  if (balanceView) {
    const observer = new MutationObserver(() => {
      if (!balanceView.classList.contains('d-none')) {
        showAdvancedStats();
      }
    });
    observer.observe(balanceView, { attributes: true, attributeFilter: ['class'] });
  }
});

// Mostrar estadísticas avanzadas
function showAdvancedStats() {
  const currentPeriod = document.querySelector('input[name="periodFilter"]:checked')?.value || 'day';
  const stats = getAdvancedStats(currentPeriod);
  
  // Crear o actualizar sección de estadísticas avanzadas
  let statsSection = document.getElementById('advancedStats');
  if (!statsSection) {
    statsSection = document.createElement('div');
    statsSection.id = 'advancedStats';
    statsSection.className = 'advanced-stats-treinta mt-4';
    document.getElementById('view-balance').appendChild(statsSection);
  }
  
  statsSection.innerHTML = `
    <div class="advanced-stats-header">
      <h5 class="mb-3">
        <i class="bi bi-graph-up-arrow"></i> Estadísticas Avanzadas
      </h5>
    </div>
    <div class="advanced-stats-grid">
      <div class="stat-card-treinta">
        <div class="stat-icon">
          <i class="bi bi-cart-check"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${stats.totalSales}</div>
          <div class="stat-label">Total Ventas</div>
        </div>
      </div>
      
      <div class="stat-card-treinta">
        <div class="stat-icon">
          <i class="bi bi-people"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${stats.totalClients}</div>
          <div class="stat-label">Clientes</div>
        </div>
      </div>
      
      <div class="stat-card-treinta">
        <div class="stat-icon">
          <i class="bi bi-box-seam"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${stats.totalProducts}</div>
          <div class="stat-label">Productos</div>
        </div>
      </div>
      
      <div class="stat-card-treinta">
        <div class="stat-icon">
          <i class="bi bi-currency-dollar"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">$${stats.avgSaleValue.toFixed(2)}</div>
          <div class="stat-label">Promedio Venta</div>
        </div>
      </div>
      
      <div class="stat-card-treinta">
        <div class="stat-icon">
          <i class="bi bi-percent"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${stats.profitMargin.toFixed(1)}%</div>
          <div class="stat-label">Margen Utilidad</div>
        </div>
      </div>
      
      <div class="stat-card-treinta">
        <div class="stat-icon">
          <i class="bi bi-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${stats.debtRatio.toFixed(1)}%</div>
          <div class="stat-label">Ratio Deudas</div>
        </div>
      </div>
    </div>
    
    <div class="insights-section mt-4">
      <h6 class="mb-3">
        <i class="bi bi-lightbulb"></i> Insights
      </h6>
      <div class="insights-grid">
        <div class="insight-card-treinta">
          <div class="insight-icon">
            <i class="bi bi-trophy"></i>
          </div>
          <div class="insight-content">
            <div class="insight-title">Producto Top</div>
            <div class="insight-value">${stats.topSellingProduct.name}</div>
            <div class="insight-subtitle">${stats.topSellingProduct.sales} ventas</div>
          </div>
        </div>
        
        <div class="insight-card-treinta">
          <div class="insight-icon">
            <i class="bi bi-star"></i>
          </div>
          <div class="insight-content">
            <div class="insight-title">Cliente VIP</div>
            <div class="insight-value">${stats.mostValuableClient.name}</div>
            <div class="insight-subtitle">$${stats.mostValuableClient.total.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// === Testing y Ajustes Finales ===

// Función de testing para validar la integridad de datos
function validateDataIntegrity() {
  const errors = [];
  
  // Validar productos
  products.forEach((product, index) => {
    if (!product.id || !product.name || typeof product.price !== 'number') {
      errors.push(`Producto ${index + 1}: Datos incompletos o inválidos`);
    }
  });
  
  // Validar clientes
  clients.forEach((client, index) => {
    if (!client.id || !client.name) {
      errors.push(`Cliente ${index + 1}: Datos incompletos`);
    }
  });
  
  // Validar ventas
  sales.forEach((sale, index) => {
    if (!sale.id || !sale.clientId || typeof sale.total !== 'number') {
      errors.push(`Venta ${index + 1}: Datos incompletos`);
    }
  });
  
  // Validar deudas
  debts.forEach((debt, index) => {
    if (!debt.id || !debt.clientId || typeof debt.amount !== 'number') {
      errors.push(`Deuda ${index + 1}: Datos incompletos`);
    }
  });
  
  if (errors.length > 0) {
    console.warn('Errores de integridad de datos encontrados:', errors);
    return false;
  }
  
  return true;
}

// Función para limpiar datos corruptos
function cleanCorruptedData() {
  let cleaned = false;
  
  // Limpiar productos corruptos
  const originalProductsLength = products.length;
  products = products.filter(product => 
    product && product.id && product.name && typeof product.price === 'number'
  );
  if (products.length !== originalProductsLength) {
    cleaned = true;
    saveToStorage('products', products);
  }
  
  // Limpiar clientes corruptos
  const originalClientsLength = clients.length;
  clients = clients.filter(client => 
    client && client.id && client.name
  );
  if (clients.length !== originalClientsLength) {
    cleaned = true;
    saveToStorage('clients', clients);
  }
  
  // Limpiar ventas corruptas
  const originalSalesLength = sales.length;
  sales = sales.filter(sale => 
    sale && sale.id && sale.clientId && typeof sale.total === 'number'
  );
  if (sales.length !== originalSalesLength) {
    cleaned = true;
    saveToStorage('sales', sales);
  }
  
  // Limpiar deudas corruptas
  const originalDebtsLength = debts.length;
  debts = debts.filter(debt => 
    debt && debt.id && debt.clientId && typeof debt.amount === 'number'
  );
  if (debts.length !== originalDebtsLength) {
    cleaned = true;
    saveToStorage('debts', debts);
  }
  
  if (cleaned) {
    console.log('Datos corruptos limpiados exitosamente');
    Swal.fire({
      icon: 'info',
      title: 'Datos Limpiados',
      text: 'Se han limpiado datos corruptos encontrados en la aplicación.',
      timer: 2000,
      showConfirmButton: false
    });
  }
  
  return cleaned;
}

// Función para optimizar el rendimiento
function optimizePerformance() {
  // Limpiar cache antiguo
  const now = Date.now();
  for (const [key, value] of dataCache.entries()) {
    if (now - value.timestamp > 5 * 60 * 1000) { // 5 minutos
      dataCache.delete(key);
    }
  }
  
  // Limpiar elementos DOM no utilizados
  const unusedElements = document.querySelectorAll('[data-temp]');
  unusedElements.forEach(el => el.remove());
  
  // Optimizar imágenes
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.loading) {
      img.loading = 'lazy';
    }
  });
  
  console.log('Optimización de rendimiento completada');
}

// Función para generar reporte de estado de la app
function generateAppStatusReport() {
  const report = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    dataIntegrity: validateDataIntegrity(),
    statistics: {
      products: products.length,
      clients: clients.length,
      sales: sales.length,
      debts: debts.length,
      totalStorage: JSON.stringify({products, clients, sales, debts}).length
    },
    performance: {
      cacheSize: dataCache.size,
      memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 'N/A'
    },
    features: {
      darkMode: localStorage.getItem('darkMode') === 'true',
      autoBackup: true,
      lazyLoading: true,
      globalSearch: true
    }
  };
  
  console.log('Reporte de Estado de la App:', report);
  return report;
}

// Función para mostrar notificaciones de estado
function showAppStatus() {
  const report = generateAppStatusReport();
  
  let statusIcon = 'success';
  let statusTitle = 'App Funcionando Correctamente';
  let statusMessage = `Todo está funcionando bien. ${report.statistics.products} productos, ${report.statistics.clients} clientes, ${report.statistics.sales} ventas registradas.`;
  
  if (!report.dataIntegrity) {
    statusIcon = 'warning';
    statusTitle = 'Problemas Detectados';
    statusMessage = 'Se han detectado algunos problemas de integridad de datos. Se recomienda limpiar datos corruptos.';
  }
  
  Swal.fire({
    icon: statusIcon,
    title: statusTitle,
    text: statusMessage,
    showCancelButton: true,
    confirmButtonText: 'Ver Detalles',
    cancelButtonText: 'Cerrar'
  }).then((result) => {
    if (result.isConfirmed) {
      showDetailedStatus(report);
    }
  });
}

// Mostrar estado detallado
function showDetailedStatus(report) {
  const details = `
    <div class="status-details">
      <div class="status-section">
        <h6><i class="bi bi-database"></i> Datos</h6>
        <ul>
          <li>Productos: ${report.statistics.products}</li>
          <li>Clientes: ${report.statistics.clients}</li>
          <li>Ventas: ${report.statistics.sales}</li>
          <li>Deudas: ${report.statistics.debts}</li>
          <li>Almacenamiento: ${(report.statistics.totalStorage / 1024).toFixed(2)} KB</li>
        </ul>
      </div>
      
      <div class="status-section">
        <h6><i class="bi bi-speedometer2"></i> Rendimiento</h6>
        <ul>
          <li>Cache: ${report.performance.cacheSize} elementos</li>
          <li>Memoria: ${report.performance.memoryUsage !== 'N/A' ? (report.performance.memoryUsage / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</li>
        </ul>
      </div>
      
      <div class="status-section">
        <h6><i class="bi bi-gear"></i> Funciones</h6>
        <ul>
          <li>Modo Oscuro: ${report.features.darkMode ? '✅' : '❌'}</li>
          <li>Backup Automático: ${report.features.autoBackup ? '✅' : '❌'}</li>
          <li>Lazy Loading: ${report.features.lazyLoading ? '✅' : '❌'}</li>
          <li>Búsqueda Global: ${report.features.globalSearch ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  `;
  
  Swal.fire({
    title: 'Estado Detallado de la App',
    html: details,
    width: '600px',
    showConfirmButton: true,
    confirmButtonText: 'Cerrar'
  });
}

// Función para exportar todos los datos
function exportAllData() {
  const exportData = {
    products,
    clients,
    sales,
    debts,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `tillup_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  Swal.fire({
    icon: 'success',
    title: 'Datos Exportados',
    text: 'Todos los datos han sido exportados exitosamente.',
    timer: 2000,
    showConfirmButton: false
  });
}

// Función para importar datos
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedData = JSON.parse(e.target.result);
          
          if (importedData.version && importedData.products && importedData.clients) {
            Swal.fire({
              title: 'Confirmar Importación',
              text: `¿Estás seguro de que quieres importar ${importedData.products.length} productos, ${importedData.clients.length} clientes y ${importedData.sales.length} ventas?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Importar',
              cancelButtonText: 'Cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                products = importedData.products || products;
                clients = importedData.clients || clients;
                sales = importedData.sales || sales;
                debts = importedData.debts || debts;
                
                saveToStorage('products', products);
                saveToStorage('clients', clients);
                saveToStorage('sales', sales);
                saveToStorage('debts', debts);
                
                // Recargar vistas
                renderInventory();
                renderClients();
                renderDebts();
                renderBalanceGrid();
                
                Swal.fire({
                  icon: 'success',
                  title: 'Datos Importados',
                  text: 'Los datos han sido importados exitosamente.',
                  timer: 2000,
                  showConfirmButton: false
                });
              }
            });
          } else {
            throw new Error('Formato de archivo inválido');
          }
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error al Importar',
            text: 'El archivo seleccionado no es válido o está corrupto.'
          });
        }
      };
      reader.readAsText(file);
    }
  };
  
  input.click();
}

// Inicializar funciones finales
document.addEventListener('DOMContentLoaded', function() {
  // Validar integridad de datos al cargar
  if (!validateDataIntegrity()) {
    cleanCorruptedData();
  }
  
  // Optimizar rendimiento cada 5 minutos
  setInterval(optimizePerformance, 5 * 60 * 1000);
  
  // Agregar botones de utilidad al sidebar
  const sidebarActions = document.querySelector('.sidebar-actions');
  if (sidebarActions) {
    const utilityButtons = `
      <button class="sidebar-action-btn" onclick="showAppStatus()" title="Estado de la App">
        <i class="bi bi-info-circle"></i>
        <span>Estado</span>
      </button>
      <button class="sidebar-action-btn" onclick="exportAllData()" title="Exportar Datos">
        <i class="bi bi-download"></i>
        <span>Exportar</span>
      </button>
      <button class="sidebar-action-btn" onclick="importData()" title="Importar Datos">
        <i class="bi bi-upload"></i>
        <span>Importar</span>
      </button>
    `;
    sidebarActions.insertAdjacentHTML('beforeend', utilityButtons);
  }
  
  // Mostrar mensaje de bienvenida en la primera visita
  const isFirstVisit = !localStorage.getItem('tillup_first_visit');
  if (isFirstVisit) {
    localStorage.setItem('tillup_first_visit', 'true');
    
    Swal.fire({
      title: '¡Bienvenido a TillUp POS!',
      html: `
        <div class="welcome-message">
          <p>Tu aplicación de gestión de ventas está lista para usar.</p>
          <div class="welcome-features">
            <div><i class="bi bi-check-circle text-success"></i> Gestión de inventario</div>
            <div><i class="bi bi-check-circle text-success"></i> Ventas con carrito</div>
            <div><i class="bi bi-check-circle text-success"></i> Control de clientes</div>
            <div><i class="bi bi-check-circle text-success"></i> Gestión de deudas</div>
            <div><i class="bi bi-check-circle text-success"></i> Balance y estadísticas</div>
          </div>
          <p class="mt-3"><small>Diseño inspirado en Treinta.co</small></p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: '¡Comenzar!'
    });
  }
});

// Función para mostrar créditos
function showCredits() {
  Swal.fire({
    title: 'TillUp POS v1.0.0',
    html: `
      <div class="credits-content">
        <div class="credits-section">
          <h6>Desarrollado con ❤️</h6>
          <p>HTML5, CSS3, JavaScript vanilla</p>
        </div>
        
        <div class="credits-section">
          <h6>Librerías Utilizadas</h6>
          <ul>
            <li>Bootstrap 5.3.3</li>
            <li>Bootstrap Icons</li>
            <li>SweetAlert2</li>
          </ul>
        </div>
        
        <div class="credits-section">
          <h6>Inspiración</h6>
          <p>Diseño inspirado en Treinta.co</p>
        </div>
        
        <div class="credits-section">
          <h6>Características</h6>
          <ul>
            <li>✅ PWA Ready</li>
            <li>✅ Modo Oscuro</li>
            <li>✅ Responsive Design</li>
            <li>✅ Backup Automático</li>
            <li>✅ Búsqueda Global</li>
            <li>✅ Estadísticas Avanzadas</li>
          </ul>
        </div>
      </div>
    `,
    width: '600px',
    showConfirmButton: true,
    confirmButtonText: 'Cerrar'
  });
}