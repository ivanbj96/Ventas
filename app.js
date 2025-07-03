// app.js

let ventas = JSON.parse(localStorage.getItem('ventas')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes')) || [];

function cambiarVista(vista) {
  document.querySelectorAll('.vista').forEach(v => v.classList.remove('active'));
  document.getElementById(`vista-${vista}`).classList.add('active');
}

function abrirModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function cerrarModal(id) {
  document.getElementById(id).style.display = 'none';
}

function guardarVenta() {
  const producto = document.querySelector('#modal-venta input:nth-of-type(1)').value;
  const cantidad = parseFloat(document.querySelector('#modal-venta input:nth-of-type(2)').value);
  const peso = parseFloat(document.querySelector('#modal-venta input:nth-of-type(3)').value);
  const precioLb = parseFloat(document.querySelector('#modal-venta input:nth-of-type(4)').value);
  const cliente = document.querySelector('#modal-venta select').value;

  if (!producto || isNaN(cantidad) || isNaN(peso) || isNaN(precioLb)) return;

  const pesoProm = peso / cantidad;
  const total = peso * precioLb;

  ventas.push({ producto, cantidad, peso, precioLb, cliente, total, fecha: new Date().toISOString() });
  localStorage.setItem('ventas', JSON.stringify(ventas));

  cerrarModal('modal-venta');
  renderVentas();
}

function guardarCliente() {
  const nombre = document.querySelector('#modal-cliente input').value;
  if (!nombre) return;
  clientes.push({ nombre });
  localStorage.setItem('clientes', JSON.stringify(clientes));
  cerrarModal('modal-cliente');
  renderClientes();
}

function renderVentas() {
  const tbody = document.querySelector('#tabla-ventas tbody');
  tbody.innerHTML = '';
  ventas.slice(-10).reverse().forEach(v => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${v.producto}</td><td>${v.cantidad}</td><td>${v.peso.toFixed(2)}</td><td>${v.precioLb.toFixed(2)}</td><td>${v.total.toFixed(2)}</td><td>${v.cliente}</td>`;
    tbody.appendChild(row);
  });
}

function renderClientes() {
  const tbody = document.querySelector('#tabla-clientes tbody');
  const select = document.querySelector('#modal-venta select');
  tbody.innerHTML = '';
  select.innerHTML = '<option value="">Seleccionar</option>';
  clientes.forEach(c => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${c.nombre}</td><td><button onclick="verHistorial('${c.nombre}')">Ver</button></td>`;
    tbody.appendChild(row);
    const opt = document.createElement('option');
    opt.value = c.nombre;
    opt.textContent = c.nombre;
    select.appendChild(opt);
  });
}

function verHistorial(nombre) {
  const hist = ventas.filter(v => v.cliente === nombre);
  alert(`Historial de ${nombre}:\n` + hist.map(v => `• ${v.producto}: ${v.total.toFixed(2)}$`).join('\n'));
}

function descargarPDF() {
  let contenido = 'Producto,Cantidad,Peso,Precio por lb,Total,Cliente,Fecha\n';
  ventas.forEach(v => {
    contenido += `${v.producto},${v.cantidad},${v.peso},${v.precioLb},${v.total},${v.cliente},${v.fecha}\n`;
  });

  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'reporte_ventas.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.querySelector('#modal-venta button').onclick = guardarVenta;
document.querySelector('#modal-cliente button').onclick = guardarCliente;

renderVentas();
renderClientes();