// Variables globales
let ventas = JSON.parse(localStorage.getItem('ventas')) || [];
let inventario = JSON.parse(localStorage.getItem('inventario')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
let deudas = JSON.parse(localStorage.getItem('deudas')) || [];

let carrito = [];
let abonoClienteId = null; // Para el modal de abono

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  cargarClientesEnSelect();
  cargarProductosEnSelect();
  mostrarVentas();
  mostrarInventario();
  mostrarClientes();
  mostrarDeudas();
  filtrarBalance();
  cambiarVista('ventas');
  document.getElementById('venta-fecha').valueAsDate = new Date();
  ocultarFiltrosRango();
});

// Funciones para cambiar vista
function cambiarVista(vista) {
  document.querySelectorAll('.vista').forEach(sec => sec.classList.remove('active'));
  document.querySelector(`#vista-${vista}`).classList.add('active');

  // Footer botones activo
  document.querySelectorAll('footer button').forEach(btn => btn.classList.remove('active'));
  const footerMap = { ventas: 0, balance: 1, deudas: 2, inventario: 3, clientes: 4 };
  document.querySelectorAll('footer button')[footerMap[vista]].classList.add('active');
}

// MODALES
function abrirModal(id) {
  document.getElementById(id).style.display = 'block';
  if(id === 'modal-venta') {
    carrito = [];
    actualizarCarrito();
  }
}

function cerrarModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Clientes
function registrarCliente() {
  const nombre = document.getElementById('cliente-nombre').value.trim();
  if (!nombre) return alert('Debe ingresar un nombre válido.');

  clientes.push({ id: Date.now(), nombre });
  localStorage.setItem('clientes', JSON.stringify(clientes));
  mostrarClientes();
  cargarClientesEnSelect();
  cerrarModal('modal-cliente');
  document.getElementById('cliente-nombre').value = '';
}

// Mostrar clientes
function mostrarClientes() {
  const tbody = document.querySelector('#tabla-clientes tbody');
  tbody.innerHTML = '';
  clientes.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.nombre}</td>
      <td><button onclick="eliminarCliente(${c.id})">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function eliminarCliente(id) {
  if (!confirm('¿Eliminar cliente? Esta acción es irreversible.')) return;
  clientes = clientes.filter(c => c.id !== id);
  localStorage.setItem('clientes', JSON.stringify(clientes));
  mostrarClientes();
  cargarClientesEnSelect();
}

// Cargar clientes en select para ventas
function cargarClientesEnSelect() {
  const select = document.getElementById('venta-cliente');
  select.innerHTML = '';
  clientes.forEach(c => {
    const option = document.createElement('option');
    option.value = c.id;
    option.textContent = c.nombre;
    select.appendChild(option);
  });
}

// Inventario
function agregarProducto() {
  const nombre = document.getElementById('inv-nombre').value.trim();
  const stock = parseInt(document.getElementById('inv-stock').value);
  const precio = parseFloat(document.getElementById('inv-precio').value);

  if (!nombre || isNaN(stock) || stock < 0 || isNaN(precio) || precio < 0) {
    return alert('Debe ingresar datos válidos para el producto.');
  }

  inventario.push({ id: Date.now(), nombre, stock, precio });
  localStorage.setItem('inventario', JSON.stringify(inventario));
  mostrarInventario();
  cargarProductosEnSelect();
  cerrarModal('modal-inv');

  document.getElementById('inv-nombre').value = '';
  document.getElementById('inv-stock').value = '';
  document.getElementById('inv-precio').value = '';
}

function mostrarInventario() {
  const tbody = document.querySelector('#tabla-inv tbody');
  tbody.innerHTML = '';
  inventario.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.nombre}</td>
      <td>${p.stock}</td>
      <td>$${p.precio.toFixed(2)}</td>
      <td><button onclick="eliminarProducto(${p.id})">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function eliminarProducto(id) {
  if (!confirm('¿Eliminar producto? Esta acción es irreversible.')) return;
  inventario = inventario.filter(p => p.id !== id);
  localStorage.setItem('inventario', JSON.stringify(inventario));
  mostrarInventario();
  cargarProductosEnSelect();
}

// Cargar productos en select para ventas
function cargarProductosEnSelect() {
  const select = document.getElementById('venta-producto');
  select.innerHTML = '';
  inventario.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = `${p.nombre} ($${p.precio.toFixed(2)} - Stock: ${p.stock})`;
    select.appendChild(option);
  });
}

// Ventas
function agregarAlCarrito() {
  const productoId = parseInt(document.getElementById('venta-producto').value);
  const cantidad = parseInt(document.getElementById('venta-cantidad').value);

  if (!productoId || isNaN(cantidad) || cantidad <= 0) {
    return alert('Seleccione un producto y cantidad válidos.');
  }

  const producto = inventario.find(p => p.id === productoId);
  if (!producto) return alert('Producto no encontrado.');
  if (producto.stock < cantidad) return alert('No hay stock suficiente.');

  const existeEnCarrito = carrito.find(item => item.producto.id === productoId);
  if (existeEnCarrito) {
    if (existeEnCarrito.cantidad + cantidad > producto.stock)
      return alert('No hay stock suficiente para esta cantidad.');
    existeEnCarrito.cantidad += cantidad;
  } else {
    carrito.push({ producto, cantidad });
  }

  actualizarCarrito();
  document.getElementById('venta-cantidad').value = '';
}

function actualizarCarrito() {
  const tbody = document.querySelector('#tabla-carrito tbody');
  tbody.innerHTML = '';

  carrito.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.producto.nombre}</td>
      <td>${item.cantidad}</td>
      <td>$${item.producto.precio.toFixed(2)}</td>
      <td>$${(item.producto.precio * item.cantidad).toFixed(2)}</td>
      <td><button onclick="eliminarDelCarrito(${index})">X</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarrito();
}

function registrarVenta() {
  const clienteId = parseInt(document.getElementById('venta-cliente').value);
  const tipo = document.getElementById('venta-tipo').value;
  const fecha = document.getElementById('venta-fecha').value;

  if (!clienteId) return alert('Seleccione un cliente.');
  if (carrito.length === 0) return alert('El carrito está vacío.');
  if (!fecha) return alert('Seleccione una fecha.');

  // Validar stock y actualizar inventario
  for (const item of carrito) {
    const producto = inventario.find(p => p.id === item.producto.id);
    if (!producto || producto.stock < item.cantidad) {
      return alert(`No hay stock suficiente para ${item.producto.nombre}.`);
    }
  }

  carrito.forEach(item => {
    const producto = inventario.find(p => p.id === item.producto.id);
    producto.stock -= item.cantidad;
  });

  // Guardar venta
  const venta = {
    id: Date.now(),
    clienteId,
    items: carrito.map(item => ({
      productoId: item.producto.id,
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precio: item.producto.precio,
      total: item.producto.precio * item.cantidad
    })),
    tipo,
    fecha,
  };
  ventas.push(venta);
  localStorage.setItem('ventas', JSON.stringify(ventas));
  localStorage.setItem('inventario', JSON.stringify(inventario));

  // Si es crédito, actualizar deudas
  if (tipo === 'credito') {
    let deuda = deudas.find(d => d.clienteId === clienteId);
    const totalVenta = venta.items.reduce((acc, i) => acc + i.total, 0);
    if (!deuda) {
      deuda = { clienteId, total: totalVenta, abonos: [], saldo: totalVenta };
      deudas.push(deuda);
    } else {
      deuda.total += totalVenta;
      deuda.saldo += totalVenta;
    }
    localStorage.setItem('deudas', JSON.stringify(deudas));
    mostrarDeudas();
  }

  mostrarVentas();
  mostrarInventario();
  cerrarModal('modal-venta');
}

// Mostrar ventas
function mostrarVentas() {
  const tbody = document.querySelector('#tabla-ventas tbody');
  tbody.innerHTML = '';

  ventas.forEach(v => {
    const cliente = clientes.find(c => c.id === v.clienteId);
    const fechaFormateada = new Date(v.fecha).toLocaleDateString();
    v.items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.nombre}</td>
        <td>${item.cantidad}</td>
        <td>$${item.total.toFixed(2)}</td>
        <td>${v.tipo}</td>
        <td>${cliente ? cliente.nombre : 'Desconocido'}</td>
        <td>${fechaFormateada}</td>
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
  if (isNaN(monto) || monto <= 0) return alert('Ingrese un monto válido.');

  const deuda = deudas.find(d => d.clienteId === abonoClienteId);
  if (!deuda) return alert('Deuda no encontrada.');

  if (monto > deuda.saldo) return alert('El monto no puede superar el saldo pendiente.');

  deuda.abonos.push({ fecha: new Date().toISOString(), monto });
  deuda.saldo -= monto;

  localStorage.setItem('deudas', JSON.stringify(deudas));
  mostrarDeudas();
  cerrarModal('modal-abono');
}

// Balance: filtro y tabla
function filtrarBalance() {
  const filtro = document.getElementById('filtro-tipo').value;
  const inicio = document.getElementById('filtro-inicio').value;
  const fin = document.getElementById('filtro-fin').value;

  let ventasFiltradas = [...ventas];

  const hoy = new Date();
  switch(filtro) {
    case 'hoy':
      ventasFiltradas = ventasFiltradas.filter(v => {
        const fecha = new Date(v.fecha);
        return fecha.toDateString() === hoy.toDateString();
      });
      ocultarFiltrosRango();
      break;

    case 'mes':
      ventasFiltradas = ventasFiltradas.filter(v => {
        const fecha = new Date(v.fecha);
        return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
      });
      ocultarFiltrosRango();
      break;

    case 'anio':
      ventasFiltradas = ventasFiltradas.filter(v => {
        const fecha = new Date(v.fecha);
        return fecha.getFullYear() === hoy.getFullYear();
      });
      ocultarFiltrosRango();
      break;

    case 'rango':
      if (inicio && fin) {
        const inicioDate = new Date(inicio);
        const finDate = new Date(fin);
        ventasFiltradas = ventasFiltradas.filter(v => {
          const fecha = new Date(v.fecha);
          return fecha >= inicioDate && fecha <= finDate;
        });
      }
      mostrarFiltrosRango();
      break;

    default:
      ocultarFiltrosRango();
  }

  // Generar resumen por producto
  const resumen = {};
  ventasFiltradas.forEach(v => {
    v.items.forEach(i => {
      if (!resumen[i.nombre]) resumen[i.nombre] = { cantidad: 0, total: 0 };
      resumen[i.nombre].cantidad += i.cantidad;
      resumen[i.nombre].total += i.total;
    });
  });

  // Mostrar tabla
  const tbody = document.querySelector('#tabla-balance tbody');
  tbody.innerHTML = '';
  Object.entries(resumen).forEach(([nombre, data]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${nombre}</td>
      <td>${data.cantidad}</td>
      <td>$${data.total.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function ocultarFiltrosRango() {
  document.getElementById('filtro-inicio').style.display = 'none';
  document.getElementById('filtro-fin').style.display = 'none';
}

function mostrarFiltrosRango() {
  document.getElementById('filtro-inicio').style.display = 'inline-block';
  document.getElementById('filtro-fin').style.display = 'inline-block';
}

// Descargar PDF con jsPDF
function descargarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Reporte de Ventas - Balance', 14, 22);

  const headers = [['Producto', 'Cantidad', 'Total']];
  const data = [];

  const filas = document.querySelectorAll('#tabla-balance tbody tr');
  filas.forEach(fila => {
    const cols = fila.querySelectorAll('td');
    data.push([
      cols[0].textContent,
      cols[1].textContent,
      cols[2].textContent
    ]);
  });

  doc.autoTable({
    head: headers,
    body: data,
    startY: 30,
  });

  doc.save('reporte_balance.pdf');
}
