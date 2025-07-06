// Alternar visibilidad entre secciones
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
  const target = document.getElementById(sectionId);
  if (target) target.classList.remove('hidden');
}

// LocalStorage helpers
function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadFromStorage(key, fallback = []) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
}

// Generar ID único
function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Formatear a moneda
function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

// Actualizar el selector de clientes
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

// Guardar proforma temporal al cambiar de cliente
function saveProforma(clientId, cart) {
  const proformas = loadFromStorage('proformas');
  proformas[clientId] = cart;
  saveToStorage('proformas', proformas);
}

// Recuperar proforma del cliente
function loadProforma(clientId) {
  const proformas = loadFromStorage('proformas');
  return proformas[clientId] || [];
}