// === PDF Generator for TillUp ===

async function generatePDF(type) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const date = new Date().toLocaleString();

  if (type === 'debt') {
    const debts = loadFromStorage('debts');

    doc.setFontSize(16);
    doc.text("Reporte de Deudas - TillUp", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${date}`, 14, 26);

    const rows = debts.map((d, i) => [
      i + 1,
      d.clientName,
      formatCurrency(d.amount),
      d.reason,
      d.date
    ]);

    doc.autoTable({
      startY: 30,
      head: [['#', 'Cliente', 'Monto', 'Motivo', 'Fecha']],
      body: rows,
      theme: 'striped',
      styles: { fontSize: 9 },
    });

    doc.save(`Deudas_${Date.now()}.pdf`);

  } else if (type === 'balance') {
    const sales = loadFromStorage('sales');
    const debts = loadFromStorage('debts');

    let totalProfit = 0;
    let totalCost = 0;
    sales.forEach(s => {
      totalProfit += s.profit;
      totalCost += s.cost;
    });
    const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);

    doc.setFontSize(16);
    doc.text("Balance General - TillUp", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${date}`, 14, 26);

    doc.autoTable({
      startY: 32,
      head: [['Detalle', 'Monto']],
      body: [
        ['Ganancias', formatCurrency(totalProfit)],
        ['Pérdidas (Costos)', formatCurrency(totalCost)],
        ['Deudas pendientes', formatCurrency(totalDebt)]
      ],
      styles: { fontSize: 10 },
    });

    doc.save(`Balance_${Date.now()}.pdf`);
  }
}