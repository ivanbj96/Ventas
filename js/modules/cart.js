// ========================================
// 🛒 GESTIÓN DEL CARRITO DE COMPRAS
// ========================================

import { products, clients, setCart, setCurrentClientId } from './state.js';
import { cart, currentClientId } from './state.js';
import { generateId } from './utils.js';
import { saveToStorage } from './persistence.js';
// import webSocketSync from './websocket.js'; // DESHABILITADO TEMPORALMENTE

// === AGREGAR AL CARRITO ===
export function addToCart(productId) {
  console.log('addToCart called with:', productId);
  
  if (!products || !Array.isArray(products)) {
    console.error('Products not available');
    return;
  }
  
  const product = products.find(p => p.id == productId);
  if (!product) {
    console.error('Product not found:', productId);
    return;
  }

  if (product.stock <= 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Sin stock',
      text: 'Este producto no tiene stock disponible.'
    });
    return;
  }

  const currentCart = cart || [];
  const newCart = [...currentCart];
  const existing = newCart.find(item => item.id === productId);
  
  if (existing) {
    existing.qty += 1;
  } else {
    newCart.push({ ...product, qty: 1 });
  }
  
  console.log('Setting new cart:', newCart);
  setCart(newCart);
  
  renderCart();
  
  Swal.fire({
    icon: 'success',
    title: 'Producto agregado',
    timer: 1000,
    showConfirmButton: false
  });
}

// === REMOVER DEL CARRITO ===
export function removeFromCart(productId) {
  if (!cart || !Array.isArray(cart)) return;
  
  const index = cart.findIndex(item => item.id === productId);
  if (index !== -1) {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    if (currentClientId) {
      saveProforma(currentClientId, newCart);
    }
    renderCart();
  }
}

// === CAMBIAR CANTIDAD ===
export function changeCartQty(productId, delta) {
  if (!cart || !Array.isArray(cart)) return;
  
  const idx = cart.findIndex(item => item.id === productId);
  if (idx === -1) return;
  
  const newCart = [...cart];
  newCart[idx].qty += delta;
  if (newCart[idx].qty < 1) newCart[idx].qty = 1;
  setCart(newCart);
  
  if (currentClientId) {
    saveProforma(currentClientId, newCart);
  }
  renderCart();
}

// === VACIAR CARRITO ===
export function clearCart() {
  const emptyCart = [];
  setCart(emptyCart);
  if (currentClientId) {
    saveProforma(currentClientId, emptyCart);
  }
  renderCart();
}

// === RENDERIZAR CARRITO ===
export function renderCart() {
  console.log('renderCart called, cart:', cart);
  
  // Buscar contenedor del carrito - priorizar el drawer
  let container = document.getElementById('cartListDrawer') || 
                 document.getElementById('cartList') || 
                 document.querySelector('.cart-container');
  
  if (!container) {
    console.error('No cart container found');
    return;
  }
  
  console.log('Using cart container:', container.id || container.className);
  
  const currentCart = cart || [];
  console.log('Current cart length:', currentCart.length);
  
  // Actualizar badge del carrito flotante
  const cartBadge = document.getElementById('cartCountBadge');
  if (cartBadge) {
    cartBadge.textContent = currentCart.length;
    cartBadge.style.display = currentCart.length > 0 ? 'block' : 'none';
  }
  
  // Actualizar badge del carrito normal si existe
  const normalCartBadge = document.getElementById('cartCountBadgeNormal');
  if (normalCartBadge) {
    normalCartBadge.textContent = currentCart.length;
    normalCartBadge.style.display = currentCart.length > 0 ? 'block' : 'none';
  }

  if (!currentCart || !Array.isArray(currentCart) || currentCart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-cart-x" style="font-size: 3rem; color: #ccc;"></i>
        <p class="text-muted mt-2">Carrito vacío</p>
        <small class="text-muted">Selecciona productos para comenzar</small>
      </div>
    `;
    const totalElement = document.getElementById('cartTotal') || document.getElementById('cartTotalDrawer');
    const finalizeBtn = document.getElementById('finalizeBtn') || document.getElementById('finalizeBtnDrawer');
    const clearCartBtn = document.getElementById('clearCartBtn');
    
    if (totalElement) totalElement.textContent = '$0.00';
    if (finalizeBtn) finalizeBtn.disabled = true;
    if (clearCartBtn) clearCartBtn.style.display = 'none';
    return;
  }

  const totalElement = document.getElementById('cartTotal') || document.getElementById('cartTotalDrawer');
  const finalizeBtn = document.getElementById('finalizeBtn') || document.getElementById('finalizeBtnDrawer');
  const clearCartBtn = document.getElementById('clearCartBtn');
  
  if (clearCartBtn) clearCartBtn.style.display = 'block';

  container.innerHTML = currentCart.map(item => `
    <div class="cart-item mb-2 p-2 border rounded">
      <div class="d-flex justify-content-between align-items-center">
        <div class="flex-grow-1">
          <strong>${item.name}</strong>
          <div class="text-muted small">$${item.price.toFixed(2)} c/u</div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div class="d-flex align-items-center gap-1">
            <button class="btn btn-sm btn-outline-secondary" onclick="changeCartQty('${item.id}', -1)">-</button>
            <span class="px-2">${item.qty}</span>
            <button class="btn btn-sm btn-outline-secondary" onclick="changeCartQty('${item.id}', 1)">+</button>
          </div>
          <div class="text-end">
            <div class="fw-bold">$${(item.price * item.qty).toFixed(2)}</div>
            <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart('${item.id}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  const total = currentCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
  if (finalizeBtn) finalizeBtn.disabled = currentCart.length === 0;
  
  console.log('Cart rendered:', currentCart.length, 'items, total:', total);
}

// === FINALIZAR VENTA ===
export async function finalizeSale() {
  if (cart.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Carrito vacío',
      text: 'Agrega productos al carrito para continuar.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  // Si no hay cliente seleccionado, verificar el drawer
  if (!currentClientId) {
    const clientSelect = document.getElementById('saleClientDrawer');
    if (clientSelect && clientSelect.value) {
      setCurrentClientId(clientSelect.value);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Cliente requerido',
        text: 'Por favor selecciona un cliente antes de finalizar la venta.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cost = cart.reduce((sum, item) => sum + (item.cost * item.qty), 0);
  const profit = total - cost;
  const client = clients.find(c => c.id === currentClientId);
  const fecha = new Date().toLocaleString();

  // Mostrar opciones de pago
  Swal.fire({
    title: 'Finalizar Venta',
    html: `
      <div class="sale-summary-treinta">
        <div class="sale-client-info">
          <i class="bi bi-person-circle"></i>
          <strong>Cliente:</strong> ${client.name}
        </div>
        <div class="sale-total-info">
          <div class="sale-items-count">
            <i class="bi bi-box-seam"></i> ${cart.length} productos
          </div>
          <div class="sale-total-amount">
            <strong>Total: $${total.toFixed(2)}</strong>
          </div>
        </div>
        <div class="sale-payment-options">
          <div class="form-check">
            <input class="form-check-input" type="radio" name="paymentType" id="paymentCash" value="cash" checked>
            <label class="form-check-label" for="paymentCash">
              <i class="bi bi-cash-coin"></i> Efectivo
            </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="paymentType" id="paymentCard" value="card">
            <label class="form-check-label" for="paymentCard">
              <i class="bi bi-credit-card"></i> Tarjeta
            </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="paymentType" id="paymentTransfer" value="transfer">
            <label class="form-check-label" for="paymentTransfer">
              <i class="bi bi-bank"></i> Transferencia
            </label>
          </div>
        </div>
        <div class="sale-discount-section">
          <label class="form-label">Descuento (opcional):</label>
          <div class="input-group">
            <input type="number" id="saleDiscount" class="form-control" placeholder="0.00" min="0" max="${total}" step="0.01">
            <span class="input-group-text">$</span>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Completar Venta',
    cancelButtonText: 'Cancelar',
    showDenyButton: true,
    denyButtonText: 'Venta a Crédito',
    reverseButtons: true,
    customClass: { 
      popup: 'swal2-sale-treinta',
      confirmButton: 'btn btn-success',
      denyButton: 'btn btn-warning',
      cancelButton: 'btn btn-secondary'
    },
    preConfirm: () => {
      const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
      const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
      
      if (discount > total) {
        Swal.showValidationMessage('El descuento no puede ser mayor al total');
        return false;
      }
      
      return { discount, paymentType };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      // Venta pagada
      const { discount, paymentType } = result.value;
      const finalTotal = total - discount;
      
      // Actualizar stock
      const currentCart = [...cart];
      currentCart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          product.stock -= item.qty;
          if (product.stock < 0) product.stock = 0;
        }
      });
      
      // Obtener fecha local
      let now = new Date();
      let saleDateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const dateInput = document.getElementById('saleDateDrawer');
      if (dateInput && dateInput.value) {
        saleDateStr = dateInput.value;
      }
      let [year, month, day] = saleDateStr.split('-');
      let localDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );
      let saleDate = `${year}-${month}-${day}T${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
      
      // Registrar venta
      const sale = {
        id: generateId('sale'),
        clientId: client.id,
        clientName: client.name,
        items: [...cart],
        total: finalTotal,
        originalTotal: total,
        discount: discount,
        cost,
        profit: finalTotal - cost,
        paymentType,
        date: saleDate,
        time: localDate.toLocaleTimeString()
      };
      
      // Agregar movimiento para la sección de movimientos
      const movement = {
        type: 'sale',
        icon: 'bi-cart-check',
        title: `Venta #${sale.id}`,
        subtitle: `${client.name} - ${new Date(saleDate).toLocaleDateString()}`,
        amount: finalTotal,
        amountClass: 'positive',
        date: new Date(saleDate),
        data: sale,
        category: 'ventas'
      };
      
      try {
        const currentSales = JSON.parse(localStorage.getItem('sales') || '[]');
        currentSales.push(sale);
        
        const currentMovements = JSON.parse(localStorage.getItem('movements') || '[]');
        currentMovements.push(movement);
        
        await saveToStorage('sales', currentSales);
        await saveToStorage('products', products);
        await saveToStorage('movements', currentMovements);
        
        // Sincronizar venta con WebSocket
        if (window.syncManager && window.syncManager.isEnabled) {
          window.syncManager.syncSale(sale);
          console.log('🔄 Venta sincronizada:', sale.id);
        }
      } catch (error) {
        console.error('Error guardando venta:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar la venta. Inténtalo de nuevo.',
          confirmButtonText: 'Aceptar'
        });
        return;
      }
      
      // Limpiar carrito
      clearCart();
      
      // Cerrar drawer si está abierto
      const drawer = document.getElementById('cartDrawer');
      if (drawer && drawer.classList.contains('open')) {
        window.toggleCartDrawer();
      }
      
      // Mostrar comprobante
      showReceipt(sale);
      
    } else if (result.isDenied) {
      // Venta a crédito
      showCreditSaleModal(total, cost, client);
    }
  });
}

// === FUNCIONES AUXILIARES ===
function saveProforma(clientId, cartData) {
  try {
    localStorage.setItem(`proforma_${clientId}`, JSON.stringify(cartData));
  } catch (error) {
    console.warn('Error guardando proforma:', error);
  }
}

function loadProforma(clientId) {
  try {
    const data = localStorage.getItem(`proforma_${clientId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.warn('Error cargando proforma:', error);
    return [];
  }
}

// === SELECCIÓN DE CLIENTE ===
export function selectClientForCart(clientId) {
  setCurrentClientId(clientId);
  if (clientId) {
    const savedCart = loadProforma(clientId);
    setCart(savedCart);
  }
  renderCart();
}

export function removeSelectedClient() {
  setCurrentClientId(null);
  clearCart();
}

// === FUNCIONES AUXILIARES PARA VENTAS ===
function showReceipt(sale) {
  const receiptHtml = `
    <div class="receipt-treinta">
      <div class="receipt-header">
        <div class="receipt-logo">
          <img src="TillUp.png" alt="TillUp" style="width: 40px; height: 40px; border-radius: 8px;">
          <h3>TillUp POS</h3>
        </div>
        <div class="receipt-info">
          <div class="receipt-title">COMPROBANTE DE VENTA</div>
          <div class="receipt-number">Venta #${sale.id}</div>
          <div class="receipt-date">${new Date(sale.date).toLocaleDateString()} ${sale.time}</div>
        </div>
      </div>
      
      <div class="receipt-client">
        <i class="bi bi-person"></i>
        <strong>Cliente:</strong> ${sale.clientName}
      </div>
      
      <div class="receipt-items">
        <div class="receipt-items-header">
          <div class="item-name">Producto</div>
          <div class="item-qty">Cant.</div>
          <div class="item-price">Precio</div>
          <div class="item-subtotal">Subtotal</div>
        </div>
        
        ${sale.items.map(item => `
          <div class="receipt-item">
            <div class="item-name">${item.name}</div>
            <div class="item-qty">${item.qty}</div>
            <div class="item-price">$${item.price.toFixed(2)}</div>
            <div class="item-subtotal">$${(item.price * item.qty).toFixed(2)}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="receipt-total">
        ${sale.discount > 0 ? `
          <div class="total-line">
            <span>Subtotal:</span>
            <span>$${sale.originalTotal.toFixed(2)}</span>
          </div>
          <div class="total-line">
            <span>Descuento:</span>
            <span>-$${sale.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="total-line final">
          <span>TOTAL:</span>
          <span class="total-amount">$${sale.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="payment-type">
        <i class="bi bi-${getPaymentIcon(sale.paymentType)}"></i>
        <strong>Método de pago:</strong> ${getPaymentText(sale.paymentType)}
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
    title: 'Venta Completada',
    html: receiptHtml,
    showCancelButton: true,
    confirmButtonText: 'Imprimir',
    cancelButtonText: 'Cerrar',
    showDenyButton: true,
    denyButtonText: 'Descargar PDF',
    width: 500,
    customClass: {
      popup: 'swal2-receipt-treinta',
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-secondary',
      denyButton: 'btn btn-outline-primary'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // Imprimir comprobante
      printReceipt(sale);
    } else if (result.isDenied) {
      // Descargar PDF
      downloadReceiptPDF(sale);
    }
  });
}

function showCreditSaleModal(total, cost, client) {
  Swal.fire({
    title: 'Venta a Crédito',
    html: `
      <div class="credit-sale-info">
        <p><strong>Cliente:</strong> ${client.name}</p>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        <div class="mb-3">
          <label class="form-label">Abono inicial (opcional):</label>
          <input type="number" id="creditAbono" class="form-control" placeholder="0.00" min="0" max="${total}" step="0.01">
        </div>
        <div class="mb-3">
          <label class="form-label">Motivo del crédito:</label>
          <input type="text" id="creditReason" class="form-control" placeholder="Venta a crédito" value="Venta a crédito">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Registrar Crédito',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const abono = parseFloat(document.getElementById('creditAbono').value) || 0;
      const reason = document.getElementById('creditReason').value.trim() || 'Venta a crédito';
      
      if (abono > total) {
        Swal.showValidationMessage('El abono no puede ser mayor al total');
        return false;
      }
      
      return { abono, reason };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const { abono, reason } = result.value;
      const remainingDebt = total - abono;
      
      // Crear deuda
      const debt = {
        id: generateId('debt'),
        clientId: client.id,
        clientName: client.name,
        total: total,
        amount: remainingDebt,
        abono: abono,
        reason: reason,
        date: new Date().toISOString(),
        items: [...cart]
      };
      
      try {
        const currentDebts = JSON.parse(localStorage.getItem('debts') || '[]');
        currentDebts.push(debt);
        await saveToStorage('debts', currentDebts);
        
        // Sincronizar deuda con WebSocket
        if (window.syncManager && window.syncManager.isEnabled) {
          window.syncManager.syncDebt(debt);
          console.log('🔄 Deuda sincronizada:', debt.id);
        }
        
        // Actualizar stock
        const currentCart = [...cart];
        currentCart.forEach(item => {
          const product = products.find(p => p.id === item.id);
          if (product) {
            product.stock -= item.qty;
            if (product.stock < 0) product.stock = 0;
          }
        });
        await saveToStorage('products', products);
        
        clearCart();
        
        Swal.fire({
          icon: 'success',
          title: 'Crédito registrado',
          text: `Deuda registrada por $${remainingDebt.toFixed(2)}`,
          confirmButtonText: 'Aceptar'
        });
      } catch (error) {
        console.error('Error guardando crédito:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo registrar el crédito.',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  });
}

function getPaymentIcon(paymentType) {
  switch(paymentType) {
    case 'cash':
      return 'cash-coin';
    case 'card':
      return 'credit-card';
    case 'transfer':
      return 'bank';
    case 'credit':
      return 'clock-history';
    default:
      return 'question-circle';
  }
}

function getPaymentText(paymentType) {
  switch(paymentType) {
    case 'cash':
      return 'Pago en efectivo';
    case 'card':
      return 'Pago con tarjeta';
    case 'transfer':
      return 'Transferencia bancaria';
    case 'credit':
      return 'Venta a crédito';
    default:
      return 'Otro método de pago';
  }
}

function printReceipt(sale) {
  // Implementar impresión
  console.log('Imprimiendo recibo:', sale);
}

function downloadReceiptPDF(sale) {
  // Implementar descarga PDF
  console.log('Descargando PDF:', sale);
}