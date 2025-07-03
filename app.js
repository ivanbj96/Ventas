// app.js

let datos = {
  ventas: [],
  inventario: [],
  clientes: [],
  deudas: []
};

function cambiarVista(vista) {
  document.querySelectorAll('.vista').forEach(v => v.classList.remove('active'));
  document.getElementById(`vista-${vista}`).classList.add('active');
}

function abrirModal(id) {
  document.getElementById(id).style.display = 'block';
}

function cerrarModal(id) {
  document.getElementById(id).style.display = 'none';
}

function registrarCliente() {
  const nombre = document.getElementById('cliente-nombre').value;
  if (!nombre) return;
  datos.clientes.push({ nombre });
  document.getElementById('cliente-nombre').value = '';
  actualizarListados();
  cerrarModal('modal-cliente');
}

function agregarProducto() {
  const nombre = document.getElementById('inv-nombre').value;
  const stock = parseInt(document.getElementById('inv-stock').value);
  const precio = parseFloat(document.getElementById('inv-precio').value);
  if (!nombre || isNaN(stock) || isNaN(precio)) return;
  datos.inventario.push({ nombre, stock, precio });
  document.getElementById('inv-nombre').value = '';
  document.getElementById('inv-stock').value = '';
  document.getElementById('inv-precio').value = '';
  actualizarListados();
  cerrarModal('modal-inv');
}

function registrarVenta() {
  const producto = document.getElementById('venta-producto').value;
  const cantidad = parseInt(document.getElementById('venta-cantidad').value);
  const tipo = document.getElementById('venta-tipo').value;
  const cliente = document.getElementById('venta-cliente').value;
  const item = datos.inventario.find(p => p.nombre === producto);
  if (!item || isNaN(cantidad)) return;

  const total = cantidad * item.precio;
  datos.ventas.push({ producto, cantidad, total, tipo, cliente, fecha: new Date().toISOString() });
  if (tipo === 'credito') {
    datos.deudas.push({ cliente, total });
  }
  item.stock -= cantidad;
  document.getElementById('venta-cantidad').value = '';
  actualizarListados();
  cerrarModal('modal-venta');
}

function actualizarListados() {
  mostrarClientes();
  mostrarInventario();
  mostrarVentas();
  mostrarDeudas();
}

function mostrarClientes() {
  const tbody = document.querySelector('#tabla-clientes tbody');
  tbody.innerHTML = '';
  datos.clientes.forEach(c => {
    tbody.innerHTML += `<tr><td>${c.nombre}</td><td>-</td></tr>`;
  });
  const selectCliente = document.getElementById('venta-cliente');
  selectCliente.innerHTML = '<option value="">Sin cliente</option>';
  datos.clientes.forEach(c => {
    selectCliente.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`;
  });
}

function mostrarInventario() {
  const tbody = document.querySelector('#tabla-inv tbody');
  tbody.innerHTML = '';
  datos.inventario.forEach(p => {
    tbody.innerHTML += `<tr><td>${p.nombre}</td><td>${p.stock}</td><td>$${p.precio.toFixed(2)}</td></tr>`;
  });
  const selectProducto = document.getElementById('venta-producto');
  selectProducto.innerHTML = '';
  datos.inventario.forEach(p => {
    selectProducto.innerHTML += `<option value="${p.nombre}">${p.nombre}</option>`;
  });
}

function mostrarVentas() {
  const tbody = document.querySelector('#tabla-ventas tbody');
  tbody.innerHTML = '';
  datos.ventas.slice(-10).reverse().forEach(v => {
    tbody.innerHTML += `<tr><td>${v.producto}</td><td>${v.cantidad}</td><td>$${v.total.toFixed(2)}</td><td>${v.tipo}</td></tr>`;
  });
}

function mostrarDeudas() {
  const tbody = document.querySelector('#tabla-deudas tbody');
  tbody.innerHTML = '';
  datos.deudas.slice(-10).reverse().forEach(d => {
    tbody.innerHTML += `<tr><td>${d.cliente}</td><td>$${d.total.toFixed(2)}</td></tr>`;
  });
}

function filtrarBalance() {
  const tipo = document.getElementById('filtro-tipo').value;
  const inicio = document.getElementById('filtro-inicio').value;
  const fin = document.getElementById('filtro-fin').value;

  let desde = new Date(0);
  let hasta = new Date();

  if (tipo === 'hoy') {
    const hoy = new Date();
    desde = new Date(hoy.setHours(0,0,0,0));
  } else if (tipo === 'mes') {
    const hoy = new Date();
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  } else if (tipo === 'anio') {
    const hoy = new Date();
    desde = new Date(hoy.getFullYear(), 0, 1);
  } else if (tipo === 'rango' && inicio && fin) {
    desde = new Date(inicio);
    hasta = new Date(fin);
  }

  const filtradas = datos.ventas.filter(v => {
    const fecha = new Date(v.fecha);
    return fecha >= desde && fecha <= hasta;
  });

  const tbody = document.querySelector('#tabla-balance tbody');
  tbody.innerHTML = '';
  filtradas.slice(-10).reverse().forEach(v => {
    tbody.innerHTML += `<tr><td>${v.producto}</td><td>${v.cantidad}</td><td>$${v.total.toFixed(2)}</td></tr>`;
  });
}

function descargarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Reporte de Ventas", 10, 10);
  let y = 20;
  datos.ventas.slice(-10).forEach(v => {
    doc.text(`${v.producto} | ${v.cantidad} | $${v.total.toFixed(2)} | ${v.tipo}`, 10, y);
    y += 10;
  });
  doc.save("reporte.pdf");
}

cambiarVista('ventas');