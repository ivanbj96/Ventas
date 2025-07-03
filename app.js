// Gestión de vistas
const vistas = document.querySelectorAll('.vista');
const botonesFooter = document.querySelectorAll('footer button');

function mostrarVista(vista) {
  vistas.forEach(v => v.classList.remove('active'));
  document.getElementById(vista).classList.add('active');
}

botonesFooter.forEach(boton => {
  boton.addEventListener('click', () => {
    mostrarVista(boton.dataset.vista);
  });
});

// Datos de ejemplo (sin persistencia por ahora)
let ventas = [];

// Mostrar ventas en la tabla
function mostrarVentas() {
  const tbodyVentas = document.getElementById('cuerpo-tabla-ventas');
  tbodyVentas.innerHTML = ''; // Limpia la tabla antes de mostrar

  ventas.forEach(venta => {
    const row = tbodyVentas.insertRow();
    const cellProducto = row.insertCell();
    const cellCantidad = row.insertCell();
    const cellTotal = row.insertCell();
    const cellTipo = row.insertCell();

    cellProducto.textContent = venta.producto;
    cellCantidad.textContent = venta.cantidad;
    cellTotal.textContent = venta.total;
    cellTipo.textContent = venta.tipo;
  });
}


// Registrar venta
const btnGuardarVenta = document.getElementById('btn-guardar-venta');
btnGuardarVenta.addEventListener('click', () => {
  const producto = document.getElementById('venta-producto').value;
  const cantidad = parseInt(document.getElementById('venta-cantidad').value);
  const tipo = document.getElementById('venta-tipo').value;
  const total = cantidad * 10; // Precio unitario fijo por ahora

  const nuevaVenta = { producto, cantidad, total, tipo };
  ventas.push(nuevaVenta);
  mostrarVentas();
  // Aquí deberíamos cerrar el modal, pero por simplicidad lo omitimos en esta etapa.
});

window.addEventListener('load', mostrarVentas);
