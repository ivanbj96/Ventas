// ========================================
// 📈 SISTEMA DE GRÁFICOS Y MOVIMIENTOS
// ========================================

import { 
  currentMovementFilter, 
  currentChartType, 
  mainChart, 
  setMainChart 
} from './state.js';

// === ACTUALIZACIÓN DE PERÍODO ===
export function updatePeriodDisplay(period) {
  const periodDisplay = document.getElementById('periodDisplay');
  if (!periodDisplay) return;
  
  const periodTexts = {
    'today': 'Hoy',
    'week': 'Esta Semana',
    'month': 'Este Mes',
    'year': 'Este Año',
    'custom': 'Período Personalizado'
  };
  
  periodDisplay.textContent = periodTexts[period] || 'Hoy';
}

// === ACTUALIZACIÓN DE GRÁFICA PRINCIPAL ===
export function updateMainChart() {
  if (!mainChart) return;
  
  try {
    const { startDate, endDate } = getDateRangeFromFilter(currentMovementFilter);
    const movements = getAllMovementsInRange(startDate, endDate);
    
    if (currentChartType === 'trend') {
      const trendData = getTrendChartData(movements, startDate, endDate);
      mainChart.data = trendData;
      if (mainChart.options.scales && mainChart.options.scales.y) {
        mainChart.options.scales.y.beginAtZero = true;
        mainChart.options.scales.y.ticks.callback = function(value) {
          return '$' + (value || 0).toFixed(2);
        };
      }
    } else {
      const distributionData = getDistributionChartData(movements);
      mainChart.data = distributionData;
      if (mainChart.options.scales && mainChart.options.scales.y) {
        mainChart.options.scales.y.beginAtZero = true;
        mainChart.options.scales.y.ticks.callback = function(value) {
          return '$' + (value || 0).toFixed(2);
        };
      }
    }
    
    mainChart.update('active');
  } catch (error) {
    console.error('Error actualizando gráfica principal:', error);
  }
}

// === DATOS DE GRÁFICA DE TENDENCIAS ===
export function getTrendChartData(movements, startDate, endDate) {
  const labels = [];
  const salesData = [];
  const chickenData = [];
  const debtsData = [];
  const paymentsData = [];
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    labels.push(currentDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
    
    const dayMovements = movements.filter(m => {
      const mDate = new Date(m.date);
      return mDate.toDateString() === currentDate.toDateString();
    });
    
    salesData.push(dayMovements.filter(m => m.type === 'sale').reduce((sum, m) => sum + (m.amount || 0), 0));
    chickenData.push(dayMovements.filter(m => m.type === 'chicken').reduce((sum, m) => sum + (m.amount || 0), 0));
    debtsData.push(dayMovements.filter(m => m.type === 'debt').reduce((sum, m) => sum + (m.amount || 0), 0));
    paymentsData.push(dayMovements.filter(m => m.type === 'payment').reduce((sum, m) => sum + (m.amount || 0), 0));
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    labels: labels,
    datasets: [
      {
        label: 'Ventas Normales',
        data: salesData,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4
      },
      {
        label: 'Ventas de Pollos',
        data: chickenData,
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.4
      },
      {
        label: 'Deudas',
        data: debtsData,
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4
      },
      {
        label: 'Pagos',
        data: paymentsData,
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4
      }
    ]
  };
}

// === DATOS DE GRÁFICA DE DISTRIBUCIÓN ===
export function getDistributionChartData(movements) {
  const salesTotal = movements.filter(m => m.type === 'sale').reduce((sum, m) => sum + (m.amount || 0), 0);
  const chickenTotal = movements.filter(m => m.type === 'chicken').reduce((sum, m) => sum + (m.amount || 0), 0);
  const debtsTotal = movements.filter(m => m.type === 'debt').reduce((sum, m) => sum + (m.amount || 0), 0);
  const paymentsTotal = movements.filter(m => m.type === 'payment').reduce((sum, m) => sum + (m.amount || 0), 0);
  
  return {
    labels: ['Ventas Normales', 'Ventas de Pollos', 'Deudas', 'Pagos'],
    datasets: [{
      data: [salesTotal, chickenTotal, debtsTotal, paymentsTotal],
      backgroundColor: ['#4CAF50', '#FF9800', '#F44336', '#2196F3'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };
}

// === CONFIGURACIÓN DE GRÁFICOS ===
export function initializeChart(canvasId, type = 'line') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: type,
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Movimientos Financieros'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
  
  return chart;
}

// Funciones que necesitan ser implementadas en otros módulos
function getDateRangeFromFilter(filter) {
  // Implementar lógica de rango de fechas
  const today = new Date();
  return { startDate: today, endDate: today };
}

function getAllMovementsInRange(startDate, endDate) {
  // Implementar obtención de movimientos en rango
  return [];
}