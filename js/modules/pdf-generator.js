// ========================================
// 📄 PDF GENERATOR MODULE
// ========================================
// Generación de reportes PDF para TillUp POS

import { formatCurrency } from './utils.js';

// Función principal para generar PDFs
export async function generatePDF(type) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const date = new Date().toLocaleString();
  
  // Configuración de colores inspirada en Treinta.co
  const primaryColor = [31, 45, 61]; // #1F2D3D
  const secondaryColor = [42, 63, 90]; // #2a3f5a
  const accentColor = [0, 123, 255]; // #007bff
  const successColor = [40, 167, 69]; // #28a745
  const warningColor = [255, 193, 7]; // #ffc107
  const dangerColor = [220, 53, 69]; // #dc3545

  try {
    switch (type) {
      case 'debt':
        await generateDebtReport(doc, date, primaryColor, secondaryColor);
        break;
      case 'balance':
        await generateBalanceReport(doc, date, primaryColor, secondaryColor);
        break;
      case 'sales':
        await generateSalesReport(doc, date, primaryColor, secondaryColor);
        break;
      case 'chickens':
        await generateChickensReport(doc, date, primaryColor, secondaryColor);
        break;
      case 'movements':
        await generateMovementsReport(doc, date, primaryColor, secondaryColor);
        break;
      default:
        throw new Error(`Tipo de reporte no válido: ${type}`);
    }
  } catch (error) {
    console.error('Error generando PDF:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al generar el reporte PDF',
      confirmButtonText: 'Aceptar'
    });
  }
}

// Generar reporte de deudas
async function generateDebtReport(doc, date, primaryColor, secondaryColor) {
  const debts = loadFromStorage('debts') || [];

  // Header
  addHeader(doc, 'Reporte de Deudas', primaryColor);
  
  // Información del reporte
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.text(`Generado el: ${date}`, 14, 40);
  doc.text(`Total de deudas: ${debts.length}`, 14, 45);
  
  const totalAmount = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
  doc.text(`Monto total: ${formatCurrency(totalAmount)}`, 14, 50);

  const rows = debts.map((d, i) => [
    i + 1,
    d.clientName || 'Sin nombre',
    formatCurrency(d.amount || 0),
    d.reason || 'Sin motivo',
    new Date(d.date).toLocaleDateString()
  ]);

  doc.autoTable({
    startY: 60,
    head: [['#', 'Cliente', 'Monto', 'Motivo', 'Fecha']],
    body: rows,
    theme: 'grid',
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    }
  });

  addFooter(doc, doc.lastAutoTable.finalY + 10);
  doc.save(`Reporte_Deudas_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Generar reporte de balance
async function generateBalanceReport(doc, date, primaryColor, secondaryColor) {
  const sales = loadFromStorage('sales') || [];
  const debts = loadFromStorage('debts') || [];
  const chickenSales = loadFromStorage('chickenSales') || [];

  let totalProfit = 0;
  let totalCost = 0;
  let totalSales = 0;
  
  sales.forEach(s => {
    totalProfit += s.profit || 0;
    totalCost += s.cost || 0;
    totalSales += s.total || 0;
  });
  
  chickenSales.forEach(s => {
    totalSales += s.total || 0;
    // Calcular ganancia de pollos (precio - costo estimado)
    const costPerPound = parseFloat(localStorage.getItem('costPerPound')) || 2.0;
    const chickenCost = (s.weight || 0) * costPerPound;
    totalProfit += (s.total || 0) - chickenCost;
    totalCost += chickenCost;
  });
  
  const totalDebt = debts.reduce((sum, d) => sum + (d.amount || 0), 0);

  // Header
  addHeader(doc, 'Balance General', primaryColor);
  
  // Información del reporte
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.text(`Generado el: ${date}`, 14, 40);
  doc.text(`Período: ${new Date().getFullYear()}`, 14, 45);

  // Resumen ejecutivo
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Resumen Ejecutivo", 14, 60);
  
  doc.autoTable({
    startY: 70,
    head: [['Concepto', 'Monto']],
    body: [
      ['Ventas Totales', formatCurrency(totalSales)],
      ['Costos Totales', formatCurrency(totalCost)],
      ['Utilidad Bruta', formatCurrency(totalProfit)],
      ['Deudas Pendientes', formatCurrency(totalDebt)],
      ['Utilidad Neta', formatCurrency(totalProfit - totalDebt)]
    ],
    theme: 'grid',
    styles: { 
      fontSize: 10,
      cellPadding: 4
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    }
  });

  // Estadísticas adicionales
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Estadísticas", 14, finalY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ventas normales: ${sales.length}`, 14, finalY + 10);
  doc.text(`Ventas de pollos: ${chickenSales.length}`, 14, finalY + 15);
  doc.text(`Total de deudas: ${debts.length}`, 14, finalY + 20);
  doc.text(`Margen de utilidad: ${totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(2) : 0}%`, 14, finalY + 25);

  addFooter(doc, finalY + 35);
  doc.save(`Balance_General_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Generar reporte de ventas
async function generateSalesReport(doc, date, primaryColor, secondaryColor) {
  const sales = loadFromStorage('sales') || [];

  // Header
  addHeader(doc, 'Reporte de Ventas', primaryColor);
  
  // Información del reporte
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.text(`Generado el: ${date}`, 14, 40);
  doc.text(`Total de ventas: ${sales.length}`, 14, 45);
  
  const totalAmount = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
  doc.text(`Monto total: ${formatCurrency(totalAmount)}`, 14, 50);
  doc.text(`Utilidad total: ${formatCurrency(totalProfit)}`, 14, 55);

  const rows = sales.map((s, i) => [
    i + 1,
    s.clientName || 'Sin nombre',
    formatCurrency(s.total || 0),
    getPaymentTypeText(s.paymentType),
    new Date(s.date).toLocaleDateString()
  ]);

  doc.autoTable({
    startY: 65,
    head: [['#', 'Cliente', 'Total', 'Método de Pago', 'Fecha']],
    body: rows,
    theme: 'grid',
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    }
  });

  // Resumen por método de pago
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Resumen por Método de Pago", 14, finalY);
  
  const paymentSummary = {};
  sales.forEach(s => {
    const method = getPaymentTypeText(s.paymentType);
    paymentSummary[method] = (paymentSummary[method] || 0) + (s.total || 0);
  });
  
  const paymentRows = Object.entries(paymentSummary).map(([method, amount]) => [
    method,
    formatCurrency(amount),
    totalAmount > 0 ? `${((amount / totalAmount) * 100).toFixed(1)}%` : '0%'
  ]);
  
  doc.autoTable({
    startY: finalY + 5,
    head: [['Método', 'Total', '%']],
    body: paymentRows,
    theme: 'grid',
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: secondaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }
  });

  addFooter(doc, doc.lastAutoTable.finalY + 10);
  doc.save(`Reporte_Ventas_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Generar reporte de pollos
async function generateChickensReport(doc, date, primaryColor, secondaryColor) {
  const chickenSales = loadFromStorage('chickenSales') || [];
  const pricePerPound = parseFloat(localStorage.getItem('pricePerPound')) || 2.50;

  // Header
  addHeader(doc, 'Reporte de Pollos', primaryColor);
  
  // Información del reporte
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.text(`Generado el: ${date}`, 14, 40);
  doc.text(`Precio actual por libra: ${formatCurrency(pricePerPound)}`, 14, 45);
  doc.text(`Total de ventas: ${chickenSales.length}`, 14, 50);
  
  const totalChickens = chickenSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const totalWeight = chickenSales.reduce((sum, s) => sum + (s.weight || 0), 0);
  const totalRevenue = chickenSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const avgWeight = totalChickens > 0 ? totalWeight / totalChickens : 0;
  
  doc.text(`Total pollos vendidos: ${totalChickens}`, 14, 55);
  doc.text(`Total libras vendidas: ${totalWeight.toFixed(1)}`, 14, 60);
  doc.text(`Ingresos totales: ${formatCurrency(totalRevenue)}`, 14, 65);
  doc.text(`Peso promedio: ${avgWeight.toFixed(1)} lbs`, 14, 70);

  // Resumen ejecutivo
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Resumen Ejecutivo", 14, 85);
  
  doc.autoTable({
    startY: 95,
    head: [['Concepto', 'Valor']],
    body: [
      ['Pollos Vendidos', totalChickens.toString()],
      ['Libras Vendidas', `${totalWeight.toFixed(1)} lbs`],
      ['Ingresos Totales', formatCurrency(totalRevenue)],
      ['Peso Promedio', `${avgWeight.toFixed(1)} lbs`],
      ['Precio por Libra', formatCurrency(pricePerPound)]
    ],
    theme: 'grid',
    styles: { 
      fontSize: 10,
      cellPadding: 4
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    }
  });

  // Detalle de ventas
  if (chickenSales.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Detalle de Ventas", 14, finalY);
    
    const rows = chickenSales.map((s, i) => [
      i + 1,
      s.clientName || 'Sin nombre',
      s.quantity || 0,
      `${(s.weight || 0)} lbs`,
      formatCurrency(s.pricePerPound || 0),
      formatCurrency(s.total || 0),
      s.paymentType === 'cash' ? 'Contado' : 'Crédito',
      new Date(s.date).toLocaleDateString()
    ]);

    doc.autoTable({
      startY: finalY + 10,
      head: [['#', 'Cliente', 'Cant.', 'Peso', 'Precio/Lb', 'Total', 'Pago', 'Fecha']],
      body: rows,
      theme: 'grid',
      styles: { 
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: secondaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      }
    });
  }

  addFooter(doc, doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 200);
  doc.save(`Reporte_Pollos_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Generar reporte de movimientos
async function generateMovementsReport(doc, date, primaryColor, secondaryColor) {
  // Obtener movimientos del período actual
  const currentFilter = window.currentMovementFilter || 'today';
  let movements = [];
  let periodInfo = '';
  
  if (currentFilter === 'custom') {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    if (!startDate || !endDate) {
      throw new Error('Fechas no seleccionadas');
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    periodInfo = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    movements = getAllMovementsInRange(start, end);
  } else {
    const { startDate, endDate } = getDateRangeFromFilter(currentFilter);
    periodInfo = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    movements = getAllMovementsInRange(startDate, endDate);
  }

  // Header
  addHeader(doc, 'Reporte de Movimientos', primaryColor);
  
  // Información del reporte
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.text(`Generado el: ${date}`, 14, 40);
  doc.text(`Período: ${periodInfo}`, 14, 45);
  doc.text(`Total de movimientos: ${movements.length}`, 14, 50);

  // Resumen del período
  const summary = calculatePeriodSummary(movements);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Resumen del Período", 14, 65);
  
  doc.autoTable({
    startY: 75,
    head: [['Concepto', 'Cantidad', 'Monto']],
    body: [
      ['Ventas Normales', summary.sales || 0, formatCurrency(summary.totalSalesIncome || 0)],
      ['Ventas de Pollos', summary.chickenSales || 0, formatCurrency(summary.totalChickenIncome || 0)],
      ['Deudas', summary.debts || 0, formatCurrency(summary.totalDebts || 0)],
      ['Pagos', summary.payments || 0, formatCurrency(summary.totalPayments || 0)]
    ],
    theme: 'grid',
    styles: { 
      fontSize: 10,
      cellPadding: 4
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    }
  });

  // Lista de movimientos
  if (movements.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Detalle de Movimientos", 14, finalY);
    
    const movementRows = movements.slice(0, 50).map((m, i) => [
      i + 1,
      getMovementTypeText(m.type),
      m.subtitle || m.title || 'Sin descripción',
      formatCurrency(m.amount || 0),
      m.date ? m.date.toLocaleDateString() : 'Sin fecha'
    ]);
    
    doc.autoTable({
      startY: finalY + 5,
      head: [['#', 'Tipo', 'Cliente', 'Monto', 'Fecha']],
      body: movementRows,
      theme: 'grid',
      styles: { 
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: secondaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      }
    });
  }

  addFooter(doc, doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 200);
  doc.save(`Reporte_Movimientos_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Funciones auxiliares
function addHeader(doc, title, primaryColor) {
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("TillUp POS", 14, 15);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 25);
}

function addFooter(doc, y) {
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("Reporte generado automáticamente por TillUp POS", 14, y);
  doc.text("Diseño inspirado en Treinta.co", 14, y + 5);
}

function loadFromStorage(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return [];
  }
}

function getPaymentTypeText(paymentType) {
  switch(paymentType) {
    case 'cash': return 'Efectivo';
    case 'card': return 'Tarjeta';
    case 'transfer': return 'Transferencia';
    case 'credit': return 'Crédito';
    default: return 'Otro';
  }
}

function getMovementTypeText(type) {
  switch(type) {
    case 'sale': return 'Venta Normal';
    case 'chicken_sale': return 'Venta Pollos';
    case 'debt': return 'Deuda';
    case 'payment': return 'Pago';
    default: return 'Movimiento';
  }
}

function getAllMovementsInRange(startDate, endDate) {
  const movements = [];
  
  // Ventas normales
  const sales = loadFromStorage('sales');
  sales.forEach(sale => {
    if (sale && sale.date) {
      const saleDate = new Date(sale.date);
      if (saleDate >= startDate && saleDate <= endDate) {
        movements.push({
          type: 'sale',
          title: `Venta #${sale.id}`,
          subtitle: sale.clientName,
          amount: sale.total || 0,
          date: saleDate,
          data: sale
        });
      }
    }
  });
  
  // Ventas de pollos
  const chickenSales = loadFromStorage('chickenSales');
  chickenSales.forEach(sale => {
    if (sale && sale.date) {
      const saleDate = new Date(sale.date);
      if (saleDate >= startDate && saleDate <= endDate) {
        movements.push({
          type: 'chicken_sale',
          title: `Venta Pollos #${sale.id}`,
          subtitle: sale.clientName,
          amount: sale.total || 0,
          date: saleDate,
          data: sale
        });
      }
    }
  });
  
  // Deudas
  const debts = loadFromStorage('debts');
  debts.forEach(debt => {
    if (debt && debt.date) {
      const debtDate = new Date(debt.date);
      if (debtDate >= startDate && debtDate <= endDate) {
        movements.push({
          type: 'debt',
          title: `Deuda #${debt.id}`,
          subtitle: debt.clientName,
          amount: debt.amount || 0,
          date: debtDate,
          data: debt
        });
      }
    }
  });
  
  return movements.sort((a, b) => b.date - a.date);
}

function getDateRangeFromFilter(filter) {
  const now = new Date();
  let startDate, endDate;
  
  switch(filter) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      endDate = now;
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      endDate = now;
      break;
    case 'year':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      endDate = now;
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = now;
  }
  
  return { startDate, endDate };
}

function calculatePeriodSummary(movements) {
  const summary = {
    totalMovements: movements.length,
    sales: 0,
    chickenSales: 0,
    debts: 0,
    payments: 0,
    totalSalesIncome: 0,
    totalChickenIncome: 0,
    totalDebts: 0,
    totalPayments: 0
  };
  
  movements.forEach(m => {
    switch(m.type) {
      case 'sale':
        summary.sales++;
        summary.totalSalesIncome += m.amount || 0;
        break;
      case 'chicken_sale':
        summary.chickenSales++;
        summary.totalChickenIncome += m.amount || 0;
        break;
      case 'debt':
        summary.debts++;
        summary.totalDebts += m.amount || 0;
        break;
      case 'payment':
        summary.payments++;
        summary.totalPayments += m.amount || 0;
        break;
    }
  });
  
  return summary;
}