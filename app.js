let inventario = JSON.parse(localStorage.getItem('inventario')) || [];
let ventas = JSON.parse(localStorage.getItem('ventas')) || [];

function guardarDatos() {
  localStorage.setItem('inventario', JSON.stringify(inventario));
  localStorage.setItem('ventas', JSON.stringify(ventas));
}

function agregarProducto() {
  const nombre = document.getElementById('inv-nombre').value.trim();
  const stock = parseInt(document.getElementById('inv-stock').value);
  const precio = parseFloat(document.getElementById('inv-precio').value);

  if (!nombre || isNaN(stock) || isNaN(precio)) {
    alert('Completa los campos correctamente');
    return;
  }

  const existente = inventario.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
  if (existente) {
    existente.stock += stock;
    existente.precio = precio;
  } else {
    inventario.push({ nombre, stock, precio });
  }

  guardarDatos();
  mostrarInventario();
  actualizarSelectorProductos();
  document.getElementById('inv-nombre').value = '';
  document.getElementById('inv-stock').value = '';
  document.getElementById('inv-precio').value = '';
}

function registrarVenta() {
  const nombre = document.getElementById('venta-producto').value;
  const cantidad = parseInt(document.getElementById('venta-cantidad').value);

  const producto = inventario.find(p => p.nombre === nombre);
  if (!producto || isNaN(cantidad) || cantidad <= 0) {
    alert('Datos incorrectos');
    return;
  }

  if (producto.stock < cantidad) {
    alert('No hay suficiente stock');
    return;
  }

  producto.stock -= cantidad;
  ventas.push({
    producto: nombre,
    cantidad,
    precio: producto.precio,
    total: cantidad * producto.precio,
    fecha: new Date().toLocaleString()
  });

  guardarDatos();
  mostrarInventario();
  mostrarVentas();
  document.getElementById('venta-cantidad').value = '';
}

function mostrarInventario() {
  const lista = document.getElementById('inventario-lista');
  lista.innerHTML = '';
  inventario.forEach(p => {
    lista.innerHTML += `<div><strong>${p.nombre}</strong> - ${p.stock} unidades - $${p.precio.toFixed(2)}</div>`;
  });
}

function mostrarVentas() {
  const lista = document.getElementById('ventas-lista');
  lista.innerHTML = '';
  ventas.slice().reverse().forEach(v => {
    lista.innerHTML += `
      <div>
        ${v.cantidad}x ${v.producto} - $${v.total.toFixed(2)} 
        <small>(${v.fecha})</small>
      </div>
    `;
  });
}

function actualizarSelectorProductos() {
  const select = document.getElementById('venta-producto');
  select.innerHTML = '';
  inventario.forEach(p => {
    select.innerHTML += `<option value="${p.nombre}">${p.nombre}</option>`;
  });
}

// Inicial
mostrarInventario();
mostrarVentas();
actualizarSelectorProductos();