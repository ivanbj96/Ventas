// === PDF Generator for TillUp ===

// Función global para generar PDFs
window.generatePDFFromFile = async function(type) {
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

  if (type === 'debt') {
    const debts = loadFromStorage('debts');

    // Header con logo y título
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("TillUp POS", 14, 15);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Reporte de Deudas", 14, 25);
    
    // Información del reporte
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.text(`Generado el: ${date}`, 14, 40);
    doc.text(`Total de deudas: ${debts.length}`, 14, 45);
    
    const totalAmount = debts.reduce((sum, d) => sum + d.amount, 0);
    doc.text(`Monto total: ${formatCurrency(totalAmount)}`, 14, 50);

    const rows = debts.map((d, i) => [
      i + 1,
      d.clientName,
      formatCurrency(d.amount),
      d.reason,
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

    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Reporte generado automáticamente por TillUp POS", 14, finalY);
    doc.text("Diseño inspirado en Treinta.co", 14, finalY + 5);

    doc.save(`Reporte_Deudas_${new Date().toISOString().split('T')[0]}.pdf`);

  } else if (type === 'balance') {
    const sales = loadFromStorage('sales');
    const debts = loadFromStorage('debts');

    let totalProfit = 0;
    let totalCost = 0;
    let totalSales = 0;
    sales.forEach(s => {
      totalProfit += s.profit;
      totalCost += s.cost;
      totalSales += s.total;
    });
    const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);

    // Header con logo y título
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("TillUp POS", 14, 15);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Balance General", 14, 25);
    
    // Información del reporte
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.text(`Generado el: ${date}`, 14, 40);
    doc.text(`Período: ${new Date().getFullYear()}`, 14, 45);

    // Resumen ejecutivo
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Resumen Ejecutivo", 14, 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
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
    doc.text(`Total de ventas: ${sales.length}`, 14, finalY + 10);
    doc.text(`Total de deudas: ${debts.length}`, 14, finalY + 15);
    doc.text(`Margen de utilidad: ${((totalProfit / totalSales) * 100).toFixed(2)}%`, 14, finalY + 20);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Reporte generado automáticamente por TillUp POS", 14, finalY + 35);
    doc.text("Diseño inspirado en Treinta.co", 14, finalY + 40);

    doc.save(`Balance_General_${new Date().toISOString().split('T')[0]}.pdf`);
  } else if (type === 'sales') {
    const sales = loadFromStorage('sales');

    // Header con logo y título
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("TillUp POS", 14, 15);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Reporte de Ventas", 14, 25);
    
    // Información del reporte
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.text(`Generado el: ${date}`, 14, 40);
    doc.text(`Total de ventas: ${sales.length}`, 14, 45);
    
    const totalAmount = sales.reduce((sum, s) => sum + s.total, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
    doc.text(`Monto total: ${formatCurrency(totalAmount)}`, 14, 50);
    doc.text(`Utilidad total: ${formatCurrency(totalProfit)}`, 14, 55);

    const rows = sales.map((s, i) => [
      i + 1,
      s.clientName,
      formatCurrency(s.total),
      s.paymentType === 'cash' ? 'Efectivo' : 
      s.paymentType === 'card' ? 'Tarjeta' : 
      s.paymentType === 'transfer' ? 'Transferencia' : 'Crédito',
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
      const method = s.paymentType === 'cash' ? 'Efectivo' : 
                    s.paymentType === 'card' ? 'Tarjeta' : 
                    s.paymentType === 'transfer' ? 'Transferencia' : 'Crédito';
      paymentSummary[method] = (paymentSummary[method] || 0) + s.total;
    });
    
    const paymentRows = Object.entries(paymentSummary).map(([method, amount]) => [
      method,
      formatCurrency(amount),
      `${((amount / totalAmount) * 100).toFixed(1)}%`
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

    // Footer
    const finalTableY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Reporte generado automáticamente por TillUp POS", 14, finalTableY);
    doc.text("Diseño inspirado en Treinta.co", 14, finalTableY + 5);

    doc.save(`Reporte_Ventas_${new Date().toISOString().split('T')[0]}.pdf`);
  } else if (type === 'chickens') {
    const chickenSales = loadFromStorage('chickenSales') || [];
    const pricePerPound = parseFloat(localStorage.getItem('pricePerPound')) || 2.50;

    // Header con logo y título
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("TillUp POS", 14, 15);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Reporte de Pollos", 14, 25);
    
    // Información del reporte
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.text(`Generado el: ${date}`, 14, 40);
    doc.text(`Precio actual por libra: ${formatCurrency(pricePerPound)}`, 14, 45);
    doc.text(`Total de ventas: ${chickenSales.length}`, 14, 50);
    
    const totalChickens = chickenSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalWeight = chickenSales.reduce((sum, s) => sum + s.weight, 0);
    const totalRevenue = chickenSales.reduce((sum, s) => sum + s.total, 0);
    const avgWeight = totalChickens > 0 ? totalWeight / totalChickens : 0;
    
    doc.text(`Total pollos vendidos: ${totalChickens}`, 14, 55);
    doc.text(`Total libras vendidas: ${totalWeight.toFixed(1)}`, 14, 60);
    doc.text(`Ingresos totales: ${formatCurrency(totalRevenue)}`, 14, 65);
    doc.text(`Peso promedio: ${avgWeight.toFixed(1)} lbs`, 14, 70);

    // Resumen ejecutivo
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Resumen Ejecutivo", 14, 85);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
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
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Detalle de Ventas", 14, finalY);
    
    if (chickenSales.length > 0) {
      const rows = chickenSales.map((s, i) => [
        i + 1,
        s.clientName,
        s.quantity,
        `${s.weight} lbs`,
        formatCurrency(s.pricePerPound),
        formatCurrency(s.total),
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
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("No hay ventas de pollos registradas", 14, finalY + 10);
    }

    // Footer
    const footerY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : finalY + 20;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Reporte generado automáticamente por TillUp POS", 14, footerY);
    doc.text("Especializado en venta de pollos - Diseño inspirado en Treinta.co", 14, footerY + 5);

    doc.save(`Reporte_Pollos_${new Date().toISOString().split('T')[0]}.pdf`);
  } else if (type === 'movements') {
    // Generar reporte de movimientos por rango de fecha
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
      throw new Error('Fechas no seleccionadas');
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const movements = getMovementsByDateRange(start, end);
    const summary = calculatePeriodSummary(movements);

    // Header con logo y título
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("TillUp POS", 14, 15);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Reporte de Movimientos", 14, 25);
    
    // Información del reporte
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.text(`Generado el: ${date}`, 14, 40);
    doc.text(`Período: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, 14, 45);
    doc.text(`Total de movimientos: ${movements.length}`, 14, 50);

    // Resumen del período
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Resumen del Período", 14, 65);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.autoTable({
      startY: 75,
      head: [['Concepto', 'Cantidad', 'Monto']],
      body: [
        ['Ventas', summary.sales, formatCurrency(summary.totalIncome)],
        ['Deudas', summary.debts, formatCurrency(summary.totalDebts)],
        ['Pagos', summary.payments, formatCurrency(summary.totalPayments)]
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
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Detalle de Movimientos", 14, finalY);
    
    const movementRows = movements.map((m, i) => [
      i + 1,
      m.title,
      m.subtitle,
      formatCurrency(m.amount),
      m.date.toLocaleDateString()
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

    // Footer
    const finalTableY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Reporte generado automáticamente por TillUp POS", 14, finalTableY);
    doc.text("Diseño inspirado en Treinta.co", 14, finalTableY + 5);

    doc.save(`Reporte_Movimientos_${startDate}_${endDate}.pdf`);
  }
}

// Función auxiliar para cargar datos desde localStorage
function loadFromStorage(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return null;
  }
}