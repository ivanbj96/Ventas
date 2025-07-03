// Datos de la aplicación
let datos = {
  ventas: [],
  inventario: [],
  clientes: [],
  deudas: []
};

// Funciones para cambiar de vista
function cambiarVista(vista) {
  document.querySelectorAll('.vista').forEach(v => v.classList.remove('active'));
  document.getElementById(`vista-${vista}`).classList.add('active');
}

// Funciones para abrir y cerrar modales
function abrirModal(id) {
  document.getElementById(id).style.display = 'block';
}

function cerrarModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Función para registrar un cliente
function registrarCliente() {
  const nombre = document.getElementById('cliente-nombre').value.trim();
  if (!nombre) {
    alert('Por favor, ingresa un nombre.');
    return;
  }
  datos.clientes.push({ nombre });
  document.getElementById('cliente-nombre').value = '';
  actualizarListados();
  cerrarModal('modal-cliente');
}

// Función para agregar un producto
function agregarProducto() {
  const nombre = document.getElementById('inv-nombre').value.trim();
  const stock = parseInt(document.getElementById('inv-stock').value);
  const precio = parseFloat(document.getElementById('inv-precio').value);

  if (!nombre || isNaN(stock) || isNaN(precio) || precio <= 0 || stock <= 0) {
    alert('Por favor, completa todos los campos con valores válidos. El precio y stock deben ser números positivos.');
    return;
  }
  datos.inventario.push({ nombre, stock, precio });
  document.getElementById('inv-nombre').value = '';
  document.getElementById('inv-stock').value = '';
  document.getElementById('inv-precio').value = '';
  actualizarListados();
  cerrarModal('modal-inv');
}

// Función para registrar una venta
function registrarVenta() {
  const producto = document.getElementById('venta-producto').value;
  const cantidad = parseInt(document.getElementById('venta-cantidad').value);
  const tipo = document.getElementById('venta-tipo').value;
  const cliente = document.getElementById('venta-cliente').value;
  const item = datos.inventario.find(p => p.nombre === producto);

  if (!producto || !item || isNaN(cantidad) || cantidad <= 0) {
    alert('Por favor, selecciona un producto y especifica una cantidad válida.');
    return;
  }

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

// Función para actualizar los listados
function actualizarListados() {
  mostrarClientes();
  mostrarInventario();
  mostrarVentas();
  mostrarDeudas();
  actualizarSelects();
}

// Funciones para mostrar los datos en las tablas
function mostrarClientes() {
  const tbody = document.querySelector('#tabla-clientes tbody');
  tbody.innerHTML = '';
  datos.clientes.forEach(c => {
    tbody.innerHTML += `<tr><td>${c.nombre}</td></tr>`;
  });
}

function mostrarInventario() {
  const tbody = document.querySelector('#tabla-inv tbody');
  tbody.innerHTML = '';
  datos.inventario.forEach(p => {
    tbody.innerHTML += `<tr><td>${p.nombre}</td><td>${p.stock}</td><td>$${p.precio.toFixed(2)}</td></tr>`;
  });
}

function mostrarVentas() {
  const tbody = document.querySelector('#tabla-ventas tbody');
  tbody.innerHTML = '';
  datos.ventas.slice(-10).reverse().forEach(v => {
    tbody.innerHTML += `<tr><td>${v.producto}</td><td>${v.cantidad}</td><td>$${v.total.toFixed(2)}</td><td>${v.tipo}</td><td>${v.cliente || ''}</td></tr>`;
  });
}

function mostrarDeudas() {
  const tbody = document.querySelector('#tabla-deudas tbody');
  tbody.innerHTML = '';
  datos.deudas.forEach(d => {
    tbody.innerHTML += `<tr><td>${d.cliente}</td><td>$${d.total.toFixed(2)}</td></tr>`;
  });
}

function actualizarSelects() {
  const selectProducto = document.getElementById('venta-producto');
  selectProducto.innerHTML = '<option value="">Seleccionar Producto</option>';
  datos.inventario.forEach(p => {
    selectProducto.innerHTML += `<option value="${p.nombre}">${p.nombre}</option>`;
  });

  const selectCliente = document.getElementById('venta-cliente');
  selectCliente.innerHTML = '<option value="">Seleccionar Cliente</option>';
  datos.clientes.forEach(c => {
    selectCliente.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`;
  });
}

// Función para filtrar el balance (necesita implementación)
function filtrarBalance() {
  console.log("Función filtrarBalance aún no implementada");
}

//Eventos para el cambio de vista
document.querySelectorAll('footer button').forEach(boton => {
    boton.addEventListener('click', () => {
        cambiarVista(boton.dataset.vista);
    });
});

window.addEventListener('load', actualizarListados);
