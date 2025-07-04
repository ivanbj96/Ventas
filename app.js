// app.js // === VARIABLES GLOBALES === let ventas = JSON.parse(localStorage.getItem('ventas')) || []; let inventario = JSON.parse(localStorage.getItem('inventario')) || []; let clientes = JSON.parse(localStorage.getItem('clientes')) || []; let deudas = JSON.parse(localStorage.getItem('deudas')) || []; let proformas = JSON.parse(localStorage.getItem('proformas')) || [];

let carrito = []; let clienteActual = null; let abonoClienteId = null;

// === INICIALIZACIÓN === document.addEventListener('DOMContentLoaded', () => { cargarClientesEnSelect(); cargarProductosEnSelect(); mostrarVentas(); mostrarInventario(); mostrarClientes(); mostrarDeudas(); mostrarBalance(); document.getElementById('venta-fecha').valueAsDate = new Date(); ocultarFiltrosRango(); });

// === CAMBIO DE VISTA === function cambiarVista(vista) { document.querySelectorAll('.vista').forEach(v => v.classList.remove('active')); document.getElementById(vista-${vista}).classList.add('active'); document.querySelectorAll('footer button').forEach(b => b.classList.remove('active')); const index = { ventas: 0, balance: 1, deudas: 2, inventario: 3, clientes: 4 }[vista]; document.querySelectorAll('footer button')[index].classList.add('active'); }

// === MODALES === function abrirModal(id) { document.getElementById(id).style.display = 'block'; if (id === 'modal-venta') { carrito = []; clienteActual = document.getElementById('venta-cliente').value; actualizarCarrito(); } }

function cerrarModal(id) { document.getElementById(id).style.display = 'none'; }

// === CLIENTES === function registrarCliente() { const nombre = document.getElementById('cliente-nombre').value.trim(); if (!nombre) return alert('Nombre inválido'); clientes.push({ id: Date.now(), nombre }); localStorage.setItem('clientes', JSON.stringify(clientes)); cargarClientesEnSelect(); mostrarClientes(); cerrarModal('modal-cliente'); }

function cargarClientesEnSelect() { const select = document.getElementById('venta-cliente'); select.innerHTML = ''; clientes.forEach(c => { const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.nombre; select.appendChild(opt); }); }

function mostrarClientes() { const tbody = document.querySelector('#tabla-clientes tbody'); tbody.innerHTML = ''; clientes.forEach(c => { const tr = document.createElement('tr'); tr.innerHTML = <td>${c.nombre}</td><td><button onclick="eliminarCliente(${c.id})">Eliminar</button></td>; tbody.appendChild(tr); }); }

function eliminarCliente(id) { if (!confirm('¿Eliminar cliente?')) return; clientes = clientes.filter(c => c.id !== id); localStorage.setItem('clientes', JSON.stringify(clientes)); cargarClientesEnSelect(); mostrarClientes(); }

// === INVENTARIO === function agregarProducto() { const nombre = document.getElementById('inv-nombre').value.trim(); const stock = parseInt(document.getElementById('inv-stock').value); const precio = parseFloat(document.getElementById('inv-precio').value);

if (!nombre || isNaN(stock) || stock < 0 || isNaN(precio) || precio < 0) { return alert('Datos inválidos'); }

inventario.push({ id: Date.now(), nombre, stock, precio }); localStorage.setItem('inventario', JSON.stringify(inventario)); mostrarInventario(); cargarProductosEnSelect(); cerrarModal('modal-inv'); }

function mostrarInventario() { const tbody = document.querySelector('#tabla-inv tbody'); tbody.innerHTML = ''; inventario.forEach(p => { const tr = document.createElement('tr'); tr.innerHTML = <td>${p.nombre}</td> <td>${p.stock}</td> <td>$${p.precio.toFixed(2)}</td> <td><button onclick="eliminarProducto(${p.id})">Eliminar</button></td>; tbody.appendChild(tr); }); }

function eliminarProducto(id) { if (!confirm('¿Eliminar producto?')) return; inventario = inventario.filter(p => p.id !== id); localStorage.setItem('inventario', JSON.stringify(inventario)); mostrarInventario(); cargarProductosEnSelect(); }

function cargarProductosEnSelect() { const select = document.getElementById('venta-producto'); select.innerHTML = ''; inventario.forEach(p => { const opt = document.createElement('option'); opt.value = p.id; opt.textContent = ${p.nombre} ($${p.precio} - Stock: ${p.stock}); select.appendChild(opt); }); }

// === CONTINÚA EN LA SIGUIENTE RESPUESTA ===

function agregarAlCarrito() {
  const productoId = parseInt(document.getElementById('venta-producto').value);
  const cantidad = parseInt(document.getElementById('venta-cantidad').value);
  if (!productoId || isNaN(cantidad) || cantidad <= 0) {
    return alert('Seleccione un producto y cantidad válidos.');
  }

  const producto = inventario.find(p => p.id === productoId);
  if (!producto || producto.stock < cantidad) {
    return alert('No hay suficiente stock.');
  }

  const existente = carrito.find(i => i.producto.id === productoId);
  if (existente) {
    if (existente.cantidad + cantidad > producto.stock) {
      return alert('No hay suficiente stock disponible.');
    }
    existente.cantidad += cantidad;
  } else {
    carrito.push({ producto, cantidad });
  }

  actualizarCarrito();
  document.getElementById('venta-cantidad').value = '';
}

function actualizarCarrito() {
  const tbody = document.querySelector('#tabla-carrito tbody');
  tbody.innerHTML = '';
  carrito.forEach((item, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.producto.nombre}</td>
      <td>${item.cantidad}</td>
      <td>$${item.producto.precio.toFixed(2)}</td>
      <td>$${(item.producto.precio * item.cantidad).toFixed(2)}</td>
      <td><button onclick="eliminarDelCarrito(${i})">X</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarrito();
}

// Guarda como proforma si se cambia de cliente
document.getElementById('venta-cliente').addEventListener('change', () => {
  const nuevoCliente = document.getElementById('venta-cliente').value;
  if (carrito.length && clienteActual && clienteActual !== nuevoCliente) {
    if (confirm('¿Guardar venta pendiente para cliente anterior?')) {
      proformas.push({
        id: Date.now(),
        clienteId: parseInt(clienteActual),
        carrito: structuredClone(carrito),
        fecha: new Date().toISOString()
      });
      localStorage.setItem('proformas', JSON.stringify(proformas));
      carrito = [];
      actualizarCarrito();
    }
  }
  clienteActual = nuevoCliente;
});

function registrarVenta() {
  const clienteId = parseInt(document.getElementById('venta-cliente').value);
  const tipo = document.getElementById('venta-tipo').value;
  const fecha = document.getElementById('venta-fecha').value;

  if (!clienteId || !fecha || carrito.length === 0) {
    return alert('Complete todos los datos.');
  }

  for (const item of carrito) {
    const producto = inventario.find(p => p.id === item.producto.id);
    if (!producto || producto.stock < item.cantidad) {
      return alert(`No hay stock suficiente para ${item.producto.nombre}`);
    }
  }

  carrito.forEach(item => {
    const p = inventario.find(prod => prod.id === item.producto.id);
    p.stock -= item.cantidad;
  });

  const venta = {
    id: Date.now(),
    clienteId,
    tipo,
    fecha,
    items: carrito.map(i => ({
      productoId: i.producto.id,
      nombre: i.producto.nombre,
      cantidad: i.cantidad,
      precio: i.producto.precio,
      total: i.producto.precio * i.cantidad,
      costo: i.producto.costo || 0,
      ganancia: (i.producto.precio - (i.producto.costo || 0)) * i.cantidad
    }))
  };

  ventas.push(venta);
  localStorage.setItem('ventas', JSON.stringify(ventas));
  localStorage.setItem('inventario', JSON.stringify(inventario));

  if (tipo === 'credito') {
    let deuda = deudas.find(d => d.clienteId === clienteId);
    const total = venta.items.reduce((acc, i) => acc + i.total, 0);
    if (!deuda) {
      deuda = { clienteId, total, saldo: total, abonos: [] };
      deudas.push(deuda);
    } else {
      deuda.total += total;
      deuda.saldo += total;
    }
    localStorage.setItem('deudas', JSON.stringify(deudas));
  }

  mostrarVentas();
  mostrarInventario();
  mostrarDeudas();
  cerrarModal('modal-venta');
}

// Mostrar ventas del día
function mostrarVentas() {
  const tbody = document.querySelector('#tabla-ventas tbody');
  tbody.innerHTML = '';

  ventas.forEach(v => {
    const cliente = clientes.find(c => c.id === v.clienteId);
    const fecha = new Date(v.fecha).toLocaleDateString();
    v.items.forEach(i => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i.nombre}</td>
        <td>${i.cantidad}</td>
        <td>$${i.total.toFixed(2)}</td>
        <td>${v.tipo}</td>
        <td>${cliente ? cliente.nombre : 'Desconocido'}</td>
        <td>${fecha}</td>
        <td></td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// Mostrar deudas
function mostrarDeudas() {
  const tbody = document.querySelector('#tabla-deudas tbody');
  tbody.innerHTML = '';

  deudas.forEach(d => {
    const cliente = clientes.find(c => c.id === d.clienteId);
    const total = d.total.toFixed(2);
    const abonosSum = d.abonos.reduce((a, b) => a + b.monto, 0).toFixed(2);
    const saldo = d.saldo.toFixed(2);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cliente ? cliente.nombre : 'Desconocido'}</td>
      <td>$${total}</td>
      <td>$${abonosSum}</td>
      <td>$${saldo}</td>
      <td><button onclick="abrirModalAbono(${d.clienteId})">Abonar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModalAbono(clienteId) {
  abonoClienteId = clienteId;
  const deuda = deudas.find(d => d.clienteId === clienteId);
  if (!deuda) return alert('No se encontró deuda.');
  document.getElementById('info-abono').textContent = `Saldo pendiente: $${deuda.saldo.toFixed(2)}`;
  document.getElementById('abono-monto').value = '';
  abrirModal('modal-abono');
}

function realizarAbono() {
  const monto = parseFloat(document.getElementById('abono-monto').value);
  if (isNaN(monto) || monto <= 0) return alert('Monto inválido');

  const deuda = deudas.find(d => d.clienteId === abonoClienteId);
  if (!deuda || monto > deuda.saldo) return alert('Error en el abono');

  deuda.abonos.push({ fecha: new Date().toISOString(), monto });
  deuda.saldo -= monto;
  localStorage.setItem('deudas', JSON.stringify(deudas));
  mostrarDeudas();
  cerrarModal('modal-abono');
}

// Filtros del balance
function ocultarFiltrosRango() {
  document.getElementById('filtro-inicio').style.display = 'none';
  document.getElementById('filtro-fin').style.display = 'none';
}

function mostrarFiltrosRango() {
  document.getElementById('filtro-inicio').style.display = 'inline-block';
  document.getElementById('filtro-fin').style.display = 'inline-block';
}

// Mostrar balance
function mostrarBalance() {
  filtrarBalance();
}

function filtrarBalance() {
  const filtro = document.getElementById('filtro-tipo').value;
  const inicio = document.getElementById('filtro-inicio').value;
  const fin = document.getElementById('filtro-fin').value;

  let ventasFiltradas = [...ventas];
  const hoy = new Date();

  switch (filtro) {
    case 'hoy':
      ventasFiltradas = ventasFiltradas.filter(v => new Date(v.fecha).toDateString() === hoy.toDateString());
      ocultarFiltrosRango();
      break;
    case 'mes':
      ventasFiltradas = ventasFiltradas.filter(v => {
        const f = new Date(v.fecha);
        return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
      });
      ocultarFiltrosRango();
      break;
    case 'anio':
      ventasFiltradas = ventasFiltradas.filter(v => new Date(v.fecha).getFullYear() === hoy.getFullYear());
      ocultarFiltrosRango();
      break;
    case 'rango':
      if (inicio && fin) {
        const f1 = new Date(inicio), f2 = new Date(fin);
        ventasFiltradas = ventasFiltradas.filter(v => {
          const fv = new Date(v.fecha);
          return fv >= f1 && fv <= f2;
        });
      }
      mostrarFiltrosRango();
      break;
    default:
      ocultarFiltrosRango();
  }

  const resumen = {};
  ventasFiltradas.forEach(v => {
    v.items.forEach(i => {
      if (!resumen[i.nombre]) resumen[i.nombre] = { cantidad: 0, total: 0, ganancia: 0 };
      resumen[i.nombre].cantidad += i.cantidad;
      resumen[i.nombre].total += i.total;
      resumen[i.nombre].ganancia += i.ganancia || 0;
    });
  });

  const tbody = document.querySelector('#tabla-balance tbody');
  tbody.innerHTML = '';
  Object.entries(resumen).forEach(([nombre, datos]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${nombre}</td>
      <td>${datos.cantidad}</td>
      <td>$${datos.total.toFixed(2)}</td>
      <td>$${datos.ganancia.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Generar PDF del balance
function descargarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Reporte de Balance', 14, 22);

  const headers = [['Producto', 'Cantidad', 'Total', 'Ganancia']];
  const data = [];

  const filas = document.querySelectorAll('#tabla-balance tbody tr');
  filas.forEach(fila => {
    const cols = fila.querySelectorAll('td');
    data.push([
      cols[0].textContent,
      cols[1].textContent,
      cols[2].textContent,
      cols[3] ? cols[3].textContent : '$0.00'
    ]);
  });

  doc.autoTable({
    head: headers,
    body: data,
    startY: 30
  });

  doc.save('balance.pdf');
}