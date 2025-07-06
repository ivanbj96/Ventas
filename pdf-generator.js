// Asegúrate de tener jsPDF y autoTable cargados desde CDN en index.html

function generatePDF(section) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  if (section === 'balance') {
    const earnings = document.getElementById('totalEarnings').textContent;
    const losses = document.getElementById('totalLosses').textContent;
    const debts = document.getElementById('pendingDebts').textContent;

    doc.text('Reporte de Balance - TillUp', 14, 20);
    doc.autoTable({
      head: [['Concepto', 'Valor']],
      body: [
        ['Ganancias', earnings.replace('Ganancias: ', '')],
        ['Pérdidas', losses.replace('Pérdidas: ', '')],
        ['Deudas pendientes', debts.replace('Deudas pendientes: ', '')]
      ],
      startY: 30
    });

  } else if (section === 'debts') {
    const debtsData = loadFromStorage('debts');
    const body = debtsData.map(d => [
      d.clientName,
      formatCurrency(d.amount),
      d.reason,
      d.date
    ]);

    doc.text('Reporte de Deudas - TillUp', 14, 20);
    doc.autoTable({
      head: [['Cliente', 'Monto', 'Motivo', 'Fecha']],
      body,
      startY: 30
    });
  }

  doc.save(`tillup_${section}_reporte.pdf`);
}