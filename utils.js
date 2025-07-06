// === Formatear moneda (con soporte a centavos y localización) ===
function formatCurrency(value) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
}

// === Guardar y cargar desde localStorage ===
function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadFromStorage(key) {
  const raw = localStorage.getItem(key);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(`Error al parsear ${key}`, e);
    return [];
  }
}

// === Generar ID único
function generateId(prefix = '') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// === Proformas por cliente
function saveProforma(clientId, cartData) {
  const allProformas = loadFromStorage('proformas') || {};
  allProformas[clientId] = cartData;
  saveToStorage('proformas', allProformas);
}

function loadProforma(clientId) {
  const allProformas = loadFromStorage('proformas') || {};
  return allProformas[clientId] || [];
}