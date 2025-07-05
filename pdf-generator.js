// Asegúrate de tener jsPDF y autoTable disponibles en tu index.html
// Puedes incluir desde CDN:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>

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
        ['Ganancias', earnings],
        ['Pérdidas', losses],
        ['Deudas pendientes', debts]
      ],
      startY: 30
    });

  } else if (section === 'debts') {
    const debtData = loadFromStorage('debts');
    const body = debtData.map(d => [
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