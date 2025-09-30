// ========================================
// ✅ SISTEMA DE VALIDACIÓN DE DATOS
// ========================================

import { APP_CONFIG } from './config.js';

// === VALIDADORES BÁSICOS ===

export function isValidString(value, minLength = 1, maxLength = 100) {
  return typeof value === 'string' && 
         value.trim().length >= minLength && 
         value.trim().length <= maxLength;
}

export function isValidNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
}

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email);
}

export function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,15}$/;
  return typeof phone === 'string' && phoneRegex.test(phone);
}

export function isValidDate(date) {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
}

export function isValidId(id) {
  return typeof id === 'string' && id.length > 0;
}

// === VALIDADORES DE ENTIDADES ===

export function validateProduct(product) {
  const errors = [];
  
  if (!isValidString(product.name, 1, APP_CONFIG.validation.maxNameLength)) {
    errors.push('Nombre del producto inválido');
  }
  
  if (!isValidNumber(product.price, APP_CONFIG.validation.minPrice, APP_CONFIG.validation.maxPrice)) {
    errors.push('Precio inválido');
  }
  
  if (!isValidNumber(product.cost, 0, APP_CONFIG.validation.maxPrice)) {
    errors.push('Costo inválido');
  }
  
  if (!isValidNumber(product.stock, 0)) {
    errors.push('Stock inválido');
  }
  
  if (product.category && !isValidString(product.category, 1, 50)) {
    errors.push('Categoría inválida');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateClient(client) {
  const errors = [];
  
  if (!isValidString(client.name, 1, APP_CONFIG.validation.maxNameLength)) {
    errors.push('Nombre del cliente inválido');
  }
  
  if (client.phone && !isValidPhone(client.phone)) {
    errors.push('Teléfono inválido');
  }
  
  if (client.email && !isValidEmail(client.email)) {
    errors.push('Email inválido');
  }
  
  if (client.address && !isValidString(client.address, 0, 200)) {
    errors.push('Dirección inválida');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateSale(sale) {
  const errors = [];
  
  if (!isValidId(sale.id)) {
    errors.push('ID de venta inválido');
  }
  
  if (!isValidString(sale.clientName, 1, APP_CONFIG.validation.maxNameLength)) {
    errors.push('Nombre del cliente inválido');
  }
  
  if (!isValidNumber(sale.total, 0.01)) {
    errors.push('Total inválido');
  }
  
  if (!isValidDate(sale.date)) {
    errors.push('Fecha inválida');
  }
  
  if (!Array.isArray(sale.items) || sale.items.length === 0) {
    errors.push('Items de venta inválidos');
  }
  
  const validPaymentTypes = ['cash', 'card', 'transfer', 'credit'];
  if (!validPaymentTypes.includes(sale.paymentType)) {
    errors.push('Tipo de pago inválido');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateChickenSale(sale) {
  const errors = [];
  
  if (!isValidId(sale.id)) {
    errors.push('ID de venta inválido');
  }
  
  if (!isValidString(sale.clientName, 1, APP_CONFIG.validation.maxNameLength)) {
    errors.push('Nombre del cliente inválido');
  }
  
  if (!isValidNumber(sale.weight, APP_CONFIG.chicken.minWeight, APP_CONFIG.chicken.maxWeight)) {
    errors.push('Peso inválido');
  }
  
  if (!isValidNumber(sale.pricePerPound, 0.01)) {
    errors.push('Precio por libra inválido');
  }
  
  if (!isValidNumber(sale.total, 0.01)) {
    errors.push('Total inválido');
  }
  
  if (!isValidDate(sale.date)) {
    errors.push('Fecha inválida');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateDebt(debt) {
  const errors = [];
  
  if (!isValidId(debt.id)) {
    errors.push('ID de deuda inválido');
  }
  
  if (!isValidString(debt.clientName, 1, APP_CONFIG.validation.maxNameLength)) {
    errors.push('Nombre del cliente inválido');
  }
  
  if (!isValidNumber(debt.amount, 0.01)) {
    errors.push('Monto inválido');
  }
  
  if (!isValidDate(debt.date)) {
    errors.push('Fecha inválida');
  }
  
  const validStatuses = ['pending', 'paid', 'partial'];
  if (!validStatuses.includes(debt.status)) {
    errors.push('Estado de deuda inválido');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// === SANITIZACIÓN DE DATOS ===

export function sanitizeString(str, maxLength = 100) {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength);
}

export function sanitizeNumber(num, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = parseFloat(num);
  if (isNaN(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
}

export function sanitizeProduct(product) {
  return {
    id: sanitizeString(product.id, 50),
    name: sanitizeString(product.name, APP_CONFIG.validation.maxNameLength),
    price: sanitizeNumber(product.price, APP_CONFIG.validation.minPrice, APP_CONFIG.validation.maxPrice),
    cost: sanitizeNumber(product.cost, 0, APP_CONFIG.validation.maxPrice),
    stock: sanitizeNumber(product.stock, 0),
    category: sanitizeString(product.category || '', 50),
    image: sanitizeString(product.image || '', 500),
    description: sanitizeString(product.description || '', APP_CONFIG.validation.maxDescriptionLength)
  };
}

export function sanitizeClient(client) {
  return {
    id: sanitizeString(client.id, 50),
    name: sanitizeString(client.name, APP_CONFIG.validation.maxNameLength),
    phone: sanitizeString(client.phone || '', 20),
    email: sanitizeString(client.email || '', 100),
    address: sanitizeString(client.address || '', 200),
    image: sanitizeString(client.image || '', 500),
    debt: sanitizeNumber(client.debt || 0, 0)
  };
}

// === VALIDACIÓN DE JSON ===

export function safeJSONParse(jsonString, defaultValue = null) {
  try {
    if (typeof jsonString !== 'string') {
      return defaultValue;
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Error parsing JSON:', error);
    return defaultValue;
  }
}

export function safeJSONStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('Error stringifying JSON:', error);
    return defaultValue;
  }
}

// === VALIDACIÓN DE LOCALSTORAGE ===

export function validateLocalStorageData(key, data) {
  const errors = [];
  
  if (!key || typeof key !== 'string') {
    errors.push('Key inválida para localStorage');
  }
  
  if (data === undefined) {
    errors.push('Data no puede ser undefined');
  }
  
  try {
    JSON.stringify(data);
  } catch (error) {
    errors.push('Data no es serializable');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  isValidString,
  isValidNumber,
  isValidEmail,
  isValidPhone,
  isValidDate,
  isValidId,
  validateProduct,
  validateClient,
  validateSale,
  validateChickenSale,
  validateDebt,
  sanitizeString,
  sanitizeNumber,
  sanitizeProduct,
  sanitizeClient,
  safeJSONParse,
  safeJSONStringify,
  validateLocalStorageData
};