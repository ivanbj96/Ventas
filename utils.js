// Mostrar sección activa
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(sectionId).classList.remove('hidden');
}

// LocalStorage helpers
function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadFromStorage(key, fallback = []) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
}

// Generar ID único para productos, clientes, etc.
function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Formatear a moneda USD (puedes cambiar a otra)
function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

// Cargar clientes en el <select>
function updateClientSelector() {
  const clients = loadFromStorage('clients');
  const selector = document.getElementById('clientSelector');
  selector.innerHTML = '';

  clients.forEach(c => {
    const option = document.createElement('option');
    option.value = c.id;
    option.textContent = c.name;
    selector.appendChild(option);
  });
}

// Guardar proforma pendiente antes de cambiar cliente
function saveProforma(clientId, cart) {
  const proformas = loadFromStorage('proformas');
  proformas[clientId] = cart;
  saveToStorage('proformas', proformas);
}

// Cargar proforma pendiente si existe
function loadProforma(clientId) {
  const proformas = loadFromStorage('proformas');
  return proformas[clientId] || [];
}