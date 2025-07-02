let ventas = JSON.parse(localStorage.getItem('ventas')) || [];
let inventario = JSON.parse(localStorage.getItem('inventario')) || [];
let deudas = JSON.parse(localStorage.getItem('deudas')) || [];

function cambiarVista(vistaId) {
  document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
  document.getElementById(`vista-${vistaId}`).classList.add('activa');

  if (vistaId === 'ventas') mostrarVentasHoy();
  if (vistaId === 'inventario') mostrarInventario();
  if (vistaId === 'deudas') mostrarDeudas();
  if (vistaId === 'balance') filtrarBalance();
}

function registrarVenta() {
  const nombre = document.getElementById('venta-producto').value;
  const cantidad = parseInt(document.getElementById('venta-cantidad').value);
  const tipo = document.getElementById('venta-tipo').value;
  const cliente = document.getElementById('venta-cliente').value.trim();

  const prod = inventario.find(p => p.nombre === nombre);
  if (!prod || cantidad <= 0 || isNaN(cantidad)) return alert('Verifica datos');

  if (prod.stock < cantidad) return alert('Stock insuficiente');

  prod.stock -= cantidad;
  const venta = {
    producto: nombre,
    cantidad,
    precio: prod.precio,
    total: prod.precio * cantidad,
    tipo,
    cliente,
    fecha: new Date().toISOString()
  };
  ventas.push(venta);

  if (tipo === 'credito' && cliente) {
    let deuda = deudas.find(d => d.cliente === cliente);
    if (!deuda) {
      deudas.push({ cliente, historial: [venta] });
    } else {
      deuda.historial.push(venta);
    }
  }

  guardarDatos();
  mostrarVentasHoy();
  mostrarInventario();
}

function agregarProducto() {
  const nombre = document.getElementById('inv-nombre').value.trim();
  const stock = parseInt(document.getElementById('inv-stock').value);
  const precio = parseFloat(document.getElementById('inv-precio').value);
  if (!nombre || isNaN(stock) || isNaN(precio)) return alert('Completa datos');

  let existente = inventario.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
  if (existente) {
    existente.stock += stock;
    existente.precio = precio;
  } else {
    inventario.push({ nombre, stock, precio });
  }

  guardarDatos();
  mostrarInventario();
}

function mostrarVentasHoy() {
  const hoy = new Date().toISOString().split('T')[0];
  const contenedor = document.getElementById('ventas-hoy');
  contenedor.innerHTML = '';
  ventas.filter(v => v.fecha.startsWith(hoy)).forEach(v => {
    contenedor.innerHTML += `<div>${v.cantidad} x ${v.producto} - $${v.total.toFixed(2)} (${v.tipo})</div>`;
  });
}

function mostrarInventario() {
  const contenedor = document.getElementById('inventario-lista');
  contenedor.innerHTML = '';
  inventario.forEach(p => {
    contenedor.innerHTML += `<div>${p.nombre}: ${p.stock} unidades - $${p.precio.toFixed(2)}</div>`;
  });

  const selector = document.getElementById('venta-producto');
  selector.innerHTML = '';
  inventario.forEach(p => {
    selector.innerHTML += `<option value="${p.nombre}">${p.nombre}</option>`;
  });
}

function mostrarDeudas() {
  const contenedor = document.getElementById('lista-deudas');
  contenedor.innerHTML = '';
  deudas.forEach(d => {
    const total = d.historial.reduce((sum, v) => sum + v.total, 0);
    contenedor.innerHTML += `<div><strong>${d.cliente}</strong> - Total deuda: $${total.toFixed(2)}</div>`;
  });
}

function filtrarBalance() {
  const tipo = document.getElementById('filtro-tipo').value;
  let desde, hasta;

  const hoy = new Date();
  if (tipo === 'hoy') {
    desde = new Date(hoy.toISOString().split('T')[0]);
    hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + 1);
  } else if (tipo === 'mes') {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  } else if (tipo === 'anio') {
    desde = new Date(hoy.getFullYear(), 0, 1);
    hasta = new Date(hoy.getFullYear() + 1, 0, 1);
  } else {
    desde = new Date(document.getElementById('filtro-inicio').value);
    hasta = new Date(document.getElementById('filtro-fin').value);
    hasta.setDate(hasta.getDate() + 1);
  }

  const resumen = ventas.filter(v => new Date(v.fecha) >= desde && new Date(v.fecha) < hasta);
  const total = resumen.reduce((acc, v) => acc + v.total, 0);
  document.getElementById('resumen-balance').innerHTML =
    `<p>Total ventas: $${total.toFixed(2)}<br>Transacciones: ${resumen.length}</p>`;
}

function descargarPDF() {
  const resumen = document.getElementById('resumen-balance').innerText;
  const doc = new jspdf.jsPDF();
  doc.text("Reporte de Ventas", 10, 10);
  doc.text(resumen, 10, 20);
  doc.save("reporte.pdf");
}

function guardarDatos() {
  localStorage.setItem('ventas', JSON.stringify(ventas));
  localStorage.setItem('inventario', JSON.stringify(inventario));
  localStorage.setItem('deudas', JSON.stringify(deudas));
}

// Iniciar en la vista de ventas
cambiarVista('ventas');