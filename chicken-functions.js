// === FUNCIONES PARA MANEJO DE POLLOS ===

// Función para manejar venta de pollos
function handleChickenSale(e) {
  e.preventDefault();
  
  const clientId = document.getElementById('chickenClient').value;
  const quantity = parseInt(document.getElementById('chickenQuantity').value);
  const weight = parseFloat(document.getElementById('chickenWeight').value);
  const paymentType = document.querySelector('input[name="chickenPayment"]:checked').value;
  const abono = paymentType === 'credit' ? parseFloat(document.getElementById('chickenAbonoInput').value) || 0 : 0;
  
  if (!clientId || !quantity || !weight) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Por favor completa todos los campos requeridos'
    });
    return;
  }
  
  const client = clients.find(c => c.id === clientId);
  if (!client) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Cliente no encontrado'
    });
    return;
  }
  
  // Calcular totales
  const pricePerPound = parseFloat(document.getElementById('pricePerPound').value) || 2.50;
  const costPerPound = parseFloat(document.getElementById('costPerPound').value) || 1.80;
  const total = weight * pricePerPound;
  const cost = weight * costPerPound;
  const profit = total - cost;
  
  // Crear objeto de venta
  const sale = {
    id: generateId('chicken'),
    clientId: clientId,
    clientName: client.name,
    quantity: quantity,
    weight: weight,
    pricePerPound: pricePerPound,
    costPerPound: costPerPound,
    total: total,
    cost: cost,
    profit: profit,
    paymentType: paymentType,
    abono: abono,
    date: new Date().toISOString(),
    items: [{
      name: `Pollo (${weight} lbs)`,
      quantity: quantity,
      price: pricePerPound,
      total: total
    }]
  };
  
  // Agregar a la lista de ventas de pollos
  chickenSales.push(sale);
  saveData();
  
  // Si es a crédito, crear deuda
  if (paymentType === 'credit' && abono < total) {
    const debtAmount = total - abono;
    const debt = {
      id: generateId('debt'),
      clientId: clientId,
      clientName: client.name,
      amount: debtAmount,
      reason: `Venta de pollos - ${quantity} pollos (${weight} lbs)`,
      date: new Date().toISOString(),
      payments: abono > 0 ? [{
        amount: abono,
        date: new Date().toISOString(),
        type: 'abono'
      }] : []
    };
    debts.push(debt);
    saveData();
  }
  
  // Mostrar recibo
  showChickenReceipt(sale);
  
  // Resetear formulario
  resetChickenForm();
  
  // Actualizar estadísticas
  updateChickenStats();
  updateChickenSalesList();
  
  // Mostrar notificación
  Swal.fire({
    icon: 'success',
    title: 'Venta Exitosa',
    text: `Venta de pollos registrada por ${formatCurrency(total)}`,
    timer: 2000,
    showConfirmButton: false
  });
}

// Función para mostrar recibo de pollos
function showChickenReceipt(sale) {
  const client = clients.find(c => c.id === sale.clientId);
  const paymentText = sale.paymentType === 'cash' ? 'Efectivo' : 
                     sale.paymentType === 'card' ? 'Tarjeta' : 
                     sale.paymentType === 'transfer' ? 'Transferencia' : 'Crédito';
  
  const abonoText = sale.abono > 0 ? `
    <div class="receipt-item">
      <span class="item-name">Abono inicial</span>
      <span class="item-qty">-</span>
      <span class="item-price">-</span>
      <span class="item-subtotal">${formatCurrency(sale.abono)}</span>
    </div>
    <div class="receipt-item">
      <span class="item-name">Saldo pendiente</span>
      <span class="item-qty">-</span>
      <span class="item-price">-</span>
      <span class="item-subtotal">${formatCurrency(sale.total - sale.abono)}</span>
    </div>
  ` : '';
  
  const receiptHTML = `
    <div class="receipt-treinta">
      <div class="receipt-header">
        <div class="receipt-logo">
          <img src="TillUp.png" alt="TillUp" style="width: 40px; height: 40px;">
          <h3>TillUp POS</h3>
        </div>
        <div class="receipt-info">
          <div class="receipt-date">${new Date(sale.date).toLocaleDateString()}</div>
          <div class="receipt-client">
            <i class="bi bi-person"></i> ${client ? client.name : 'Cliente'}
          </div>
        </div>
      </div>
      
      <div class="receipt-items">
        <div class="receipt-items-header">
          <span>Producto</span>
          <span>Cant.</span>
          <span>Precio</span>
          <span>Total</span>
        </div>
        <div class="receipt-item">
          <span class="item-name">Pollo (${sale.weight} lbs)</span>
          <span class="item-qty">${sale.quantity}</span>
          <span class="item-price">${formatCurrency(sale.pricePerPound)}/lb</span>
          <span class="item-subtotal">${formatCurrency(sale.total)}</span>
        </div>
        ${abonoText}
      </div>
      
      <div class="receipt-total">
        <div class="total-line final">
          <span>Total:</span>
          <span class="total-amount">${formatCurrency(sale.total)}</span>
        </div>
        <div class="payment-type">
          <i class="bi bi-${sale.paymentType === 'cash' ? 'cash-coin' : sale.paymentType === 'card' ? 'credit-card' : 'bank'}"></i>
          ${paymentText}
        </div>
      </div>
      
      <div class="receipt-footer">
        <div class="footer-message">
          <i class="bi bi-heart-fill"></i> ¡Gracias por su compra!
        </div>
        <div class="footer-brand">
          <small>TillUp POS - Sistema de Gestión</small>
        </div>
      </div>
    </div>
  `;
  
  Swal.fire({
    title: 'Recibo de Venta',
    html: receiptHTML,
    width: '400px',
    showCloseButton: true,
    showConfirmButton: true,
    confirmButtonText: 'Imprimir',
    showDenyButton: true,
    denyButtonText: 'Descargar PDF',
    showCancelButton: true,
    cancelButtonText: 'Cerrar'
  }).then((result) => {
    if (result.isConfirmed) {
      printChickenReceipt(sale);
    } else if (result.isDenied) {
      downloadChickenReceiptPDF(sale);
    }
  });
}

// Función para resetear formulario de pollos
function resetChickenForm() {
  const form = document.getElementById('chickenSaleForm');
  if (form) form.reset();
  
  const abonoSection = document.getElementById('chickenAbonoSection');
  if (abonoSection) abonoSection.style.display = 'none';
  
  updateChickenCalculation();
}

// Función para actualizar cálculo de pollos
function updateChickenCalculation() {
  const quantity = parseInt(document.getElementById('chickenQuantity')?.value) || 0;
  const weight = parseFloat(document.getElementById('chickenWeight')?.value) || 0;
  const pricePerPound = parseFloat(document.getElementById('pricePerPound')?.value) || 2.50;
  const costPerPound = parseFloat(document.getElementById('costPerPound')?.value) || 1.80;
  const paymentType = document.querySelector('input[name="chickenPayment"]:checked')?.value || 'cash';
  const abono = parseFloat(document.getElementById('chickenAbonoInput')?.value) || 0;
  
  const total = weight * pricePerPound;
  const cost = weight * costPerPound;
  const profit = total - cost;
  
  // Actualizar display
  const displayPricePerPound = document.getElementById('displayPricePerPound');
  const displayCostPerPound = document.getElementById('displayCostPerPound');
  const displayProfitPerPound = document.getElementById('displayProfitPerPound');
  const displayTotalAmount = document.getElementById('displayTotalAmount');
  const displayTotalProfit = document.getElementById('displayTotalProfit');
  
  if (displayPricePerPound) displayPricePerPound.textContent = formatCurrency(pricePerPound);
  if (displayCostPerPound) displayCostPerPound.textContent = formatCurrency(costPerPound);
  if (displayProfitPerPound) displayProfitPerPound.textContent = formatCurrency(pricePerPound - costPerPound);
  if (displayTotalAmount) displayTotalAmount.textContent = formatCurrency(total);
  if (displayTotalProfit) displayTotalProfit.textContent = formatCurrency(profit);
  
  // Mostrar/ocultar sección de abono
  const abonoSection = document.getElementById('chickenAbonoSection');
  if (abonoSection) {
    if (paymentType === 'credit') {
      abonoSection.style.display = 'block';
    } else {
      abonoSection.style.display = 'none';
    }
  }
}

// Función para actualizar configuración de pollos
function updateChickenConfig() {
  const pricePerPound = parseFloat(document.getElementById('pricePerPound')?.value) || 2.50;
  const costPerPound = parseFloat(document.getElementById('costPerPound')?.value) || 1.80;
  
  // Guardar en localStorage
  localStorage.setItem('pricePerPound', pricePerPound.toString());
  localStorage.setItem('costPerPound', costPerPound.toString());
  
  // Actualizar variable global
  costPerPound = costPerPound;
  
  // Actualizar cálculo
  updateChickenCalculation();
  
  // Mostrar notificación
  Swal.fire({
    icon: 'success',
    title: 'Configuración Actualizada',
    text: 'Los precios y costos han sido actualizados',
    timer: 2000,
    showConfirmButton: false
  });
}

// Función para actualizar estadísticas de pollos
function updateChickenStats() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Filtrar ventas de hoy
  const todaySales = chickenSales.filter(sale => {
    const saleDate = new Date(sale.date).toISOString().split('T')[0];
    return saleDate === todayStr;
  });
  
  // Calcular estadísticas
  const totalChickens = todaySales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalWeight = todaySales.reduce((sum, sale) => sum + sale.weight, 0);
  const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = todaySales.reduce((sum, sale) => sum + sale.profit, 0);
  const avgWeight = totalChickens > 0 ? totalWeight / totalChickens : 0;
  
  // Actualizar UI
  const totalChickensSold = document.getElementById('totalChickensSold');
  const totalWeightSold = document.getElementById('totalWeightSold');
  const totalRevenueElement = document.getElementById('totalRevenue');
  const totalProfitElement = document.getElementById('totalProfit');
  const avgWeightElement = document.getElementById('avgWeight');
  
  if (totalChickensSold) totalChickensSold.textContent = totalChickens;
  if (totalWeightSold) totalWeightSold.textContent = totalWeight.toFixed(1);
  if (totalRevenueElement) totalRevenueElement.textContent = formatCurrency(totalRevenue);
  if (totalProfitElement) totalProfitElement.textContent = formatCurrency(totalProfit);
  if (avgWeightElement) avgWeightElement.textContent = avgWeight.toFixed(1);
}

// Función para actualizar selector de clientes en pollos
function updateChickenClientSelector() {
  const clientSelector = document.getElementById('chickenClient');
  if (!clientSelector) return;
  
  clientSelector.innerHTML = '<option value="">Seleccionar cliente...</option>';
  
  clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = client.name;
    clientSelector.appendChild(option);
  });
}

// Función para actualizar lista de ventas de pollos
function updateChickenSalesList() {
  const salesList = document.getElementById('chickenSalesList');
  if (!salesList) return;
  
  // Ordenar por fecha (más reciente primero)
  const sortedSales = [...chickenSales].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  salesList.innerHTML = sortedSales.map(sale => {
    const client = clients.find(c => c.id === sale.clientId);
    const paymentText = sale.paymentType === 'cash' ? 'Efectivo' : 
                       sale.paymentType === 'card' ? 'Tarjeta' : 
                       sale.paymentType === 'transfer' ? 'Transferencia' : 'Crédito';
    
    return `
      <div class="chicken-sale-item-treinta">
        <div class="chicken-sale-header-treinta">
          <div class="chicken-sale-client-treinta">
            <i class="bi bi-person"></i> ${client ? client.name : 'Cliente'}
          </div>
          <div class="chicken-sale-date-treinta">
            ${new Date(sale.date).toLocaleDateString()}
          </div>
        </div>
        <div class="chicken-sale-details-treinta">
          <div class="chicken-sale-detail-treinta">
            <span class="chicken-sale-detail-label-treinta">Cantidad:</span>
            <span class="chicken-sale-detail-value-treinta">${sale.quantity} pollos</span>
          </div>
          <div class="chicken-sale-detail-treinta">
            <span class="chicken-sale-detail-label-treinta">Peso:</span>
            <span class="chicken-sale-detail-value-treinta">${sale.weight} lbs</span>
          </div>
          <div class="chicken-sale-detail-treinta">
            <span class="chicken-sale-detail-label-treinta">Precio/lb:</span>
            <span class="chicken-sale-detail-value-treinta">${formatCurrency(sale.pricePerPound)}</span>
          </div>
        </div>
        <div class="chicken-sale-total-treinta">
          <span class="chicken-sale-total-label-treinta">Total:</span>
          <span class="chicken-sale-total-amount-treinta">${formatCurrency(sale.total)}</span>
        </div>
        <div class="chicken-sale-payment-treinta ${sale.paymentType}">
          <i class="bi bi-${sale.paymentType === 'cash' ? 'cash-coin' : sale.paymentType === 'card' ? 'credit-card' : 'bank'}"></i>
          ${paymentText}
        </div>
      </div>
    `;
  }).join('');
  
  // Actualizar contador
  const countElement = document.getElementById('chickenSalesCount');
  if (countElement) {
    countElement.textContent = `${chickenSales.length} ventas`;
  }
}

// Función para inicializar datos de pollos
function initializeChickenData() {
  // Cargar configuración guardada
  const savedPricePerPound = localStorage.getItem('pricePerPound');
  const savedCostPerPound = localStorage.getItem('costPerPound');
  
  if (savedPricePerPound) {
    const priceInput = document.getElementById('pricePerPound');
    if (priceInput) priceInput.value = savedPricePerPound;
  }
  if (savedCostPerPound) {
    const costInput = document.getElementById('costPerPound');
    if (costInput) costInput.value = savedCostPerPound;
    costPerPound = parseFloat(savedCostPerPound);
  }
  
  // Actualizar cálculos iniciales
  updateChickenCalculation();
  updateChickenStats();
  updateChickenClientSelector();
  updateChickenSalesList();
  
  // Configurar event listeners para cambios en inputs
  const quantityInput = document.getElementById('chickenQuantity');
  const weightInput = document.getElementById('chickenWeight');
  const priceInput = document.getElementById('pricePerPound');
  const costInput = document.getElementById('costPerPound');
  
  if (quantityInput) quantityInput.addEventListener('input', updateChickenCalculation);
  if (weightInput) weightInput.addEventListener('input', updateChickenCalculation);
  if (priceInput) priceInput.addEventListener('input', updateChickenCalculation);
  if (costInput) costInput.addEventListener('input', updateChickenCalculation);
  
  // Configurar event listeners para forma de pago
  document.querySelectorAll('input[name="chickenPayment"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const abonoSection = document.getElementById('chickenAbonoSection');
      if (abonoSection) {
        if (this.value === 'credit') {
          abonoSection.style.display = 'block';
        } else {
          abonoSection.style.display = 'none';
        }
      }
    });
  });
}

// Función para imprimir recibo de pollos
function printChickenReceipt(sale) {
  const client = clients.find(c => c.id === sale.clientId);
  const paymentText = sale.paymentType === 'cash' ? 'Efectivo' : 
                     sale.paymentType === 'card' ? 'Tarjeta' : 
                     sale.paymentType === 'transfer' ? 'Transferencia' : 'Crédito';
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recibo TillUp</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .receipt { max-width: 300px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 18px; }
        .header p { margin: 5px 0; font-size: 12px; }
        .item { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { border-top: 1px solid #000; padding-top: 10px; margin-top: 20px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>TillUp POS</h1>
          <p>Venta de Pollos</p>
          <p>${new Date(sale.date).toLocaleDateString()}</p>
          <p>Cliente: ${client ? client.name : 'Cliente'}</p>
        </div>
        
        <div class="item">
          <span>Pollo (${sale.weight} lbs)</span>
          <span>${formatCurrency(sale.total)}</span>
        </div>
        
        <div class="total">
          <div class="item">
            <span>Total:</span>
            <span>${formatCurrency(sale.total)}</span>
          </div>
          <div class="item">
            <span>Forma de pago:</span>
            <span>${paymentText}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>¡Gracias por su compra!</p>
          <p>TillUp POS - Sistema de Gestión</p>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Función para descargar PDF de recibo de pollos
function downloadChickenReceiptPDF(sale) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const client = clients.find(c => c.id === sale.clientId);
  const paymentText = sale.paymentType === 'cash' ? 'Efectivo' : 
                     sale.paymentType === 'card' ? 'Tarjeta' : 
                     sale.paymentType === 'transfer' ? 'Transferencia' : 'Crédito';
  
  // Configurar colores
  const primaryColor = [13, 110, 253];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("TillUp POS", 14, 15);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text("Venta de Pollos", 14, 25);
  
  // Información de la venta
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date(sale.date).toLocaleDateString()}`, 14, 40);
  doc.text(`Cliente: ${client ? client.name : 'Cliente'}`, 14, 45);
  doc.text(`Cantidad: ${sale.quantity} pollos`, 14, 50);
  doc.text(`Peso: ${sale.weight} lbs`, 14, 55);
  doc.text(`Precio por libra: ${formatCurrency(sale.pricePerPound)}`, 14, 60);
  
  // Tabla de detalles
  doc.autoTable({
    startY: 70,
    head: [['Concepto', 'Valor']],
    body: [
      ['Peso total', `${sale.weight} lbs`],
      ['Precio por libra', formatCurrency(sale.pricePerPound)],
      ['Total', formatCurrency(sale.total)],
      ['Forma de pago', paymentText]
    ],
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }
  });
  
  // Footer
  const finalY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("¡Gracias por su compra!", 14, finalY);
  doc.text("TillUp POS - Sistema de Gestión", 14, finalY + 5);
  
  doc.save(`Recibo_Pollos_${new Date().toISOString().split('T')[0]}.pdf`);
} 