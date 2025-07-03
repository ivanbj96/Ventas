// app.js

let datos = JSON.parse(localStorage.getItem("datos")) || { ventas: [], inventario: [], clientes: [], deudas: [] };

let carrito = [];

function guardarDatos() { localStorage.setItem("datos", JSON.stringify(datos)); }

function cambiarVista(vista) { document.querySelectorAll(".vista").forEach(v => v.classList.remove("active")); document.getElementById(vista-${vista}).classList.add("active"); }

function abrirModal(id) { document.getElementById(id).style.display = "flex"; }

function cerrarModal(id) { document.getElementById(id).style.display = "none"; }

function registrarCliente() { const nombre = document.getElementById("cliente-nombre").value.trim(); if (!nombre) return; datos.clientes.push({ nombre }); guardarDatos(); document.getElementById("cliente-nombre").value = ""; actualizarListados(); cerrarModal("modal-cliente"); }

function agregarProducto() { const nombre = document.getElementById("inv-nombre").value.trim(); const stock = parseInt(document.getElementById("inv-stock").value); const precio = parseFloat(document.getElementById("inv-precio").value); if (!nombre || isNaN(stock) || isNaN(precio)) return; datos.inventario.push({ nombre, stock, precio }); guardarDatos(); document.getElementById("inv-nombre").value = ""; document.getElementById("inv-stock").value = ""; document.getElementById("inv-precio").value = ""; actualizarListados(); cerrarModal("modal-inv"); }

function agregarAlCarrito() { const producto = document.getElementById("venta-producto").value; const cantidad = parseInt(document.getElementById("venta-cantidad").value); if (!producto || isNaN(cantidad)) return; const item = datos.inventario.find(p => p.nombre === producto); if (!item || item.stock < cantidad) return alert("Stock insuficiente");

carrito.push({ producto, cantidad, precio: item.precio }); mostrarCarrito(); document.getElementById("venta-cantidad").value = ""; }

function mostrarCarrito() { const contenedor = document.getElementById("carrito"); contenedor.innerHTML = carrito.map(p => <li>${p.cantidad} x ${p.producto}</li>).join(""); }

function registrarVenta() { const cliente = document.getElementById("venta-cliente").value; const tipo = document.getElementById("venta-tipo").value; const fecha = document.getElementById("venta-fecha").value || new Date().toISOString();

carrito.forEach(p => { const total = p.cantidad * p.precio; datos.ventas.push({ producto: p.producto, cantidad: p.cantidad, total, tipo, cliente, fecha });

if (tipo === "credito") {
  datos.deudas.push({ cliente, total });
}

const item = datos.inventario.find(i => i.nombre === p.producto);
if (item) item.stock -= p.cantidad;

});

carrito = []; guardarDatos(); actualizarListados(); cerrarModal("modal-venta"); }

function abonar(cliente) { const abono = parseFloat(prompt("Monto del abono:")); if (isNaN(abono)) return;

let deuda = datos.deudas.find(d => d.cliente === cliente); if (deuda) { deuda.total -= abono; if (deuda.total <= 0) datos.deudas = datos.deudas.filter(d => d.cliente !== cliente); guardarDatos(); actualizarListados(); } }

function eliminarCliente(nombre) { datos.clientes = datos.clientes.filter(c => c.nombre !== nombre); guardarDatos(); actualizarListados(); }

function eliminarProducto(nombre) { datos.inventario = datos.inventario.filter(p => p.nombre !== nombre); guardarDatos(); actualizarListados(); }

function actualizarListados() { mostrarClientes(); mostrarInventario(); mostrarVentas(); mostrarDeudas(); }

function mostrarClientes() { const tbody = document.querySelector("#tabla-clientes tbody"); tbody.innerHTML = ""; datos.clientes.forEach(c => { tbody.innerHTML += <tr><td>${c.nombre}</td><td><button onclick="eliminarCliente('${c.nombre}')">🗑</button></td></tr>; }); const selectCliente = document.getElementById("venta-cliente"); selectCliente.innerHTML = '<option value="">Sin cliente</option>'; datos.clientes.forEach(c => { selectCliente.innerHTML += <option value="${c.nombre}">${c.nombre}</option>; }); }

function mostrarInventario() { const tbody = document.querySelector("#tabla-inv tbody"); tbody.innerHTML = ""; datos.inventario.forEach(p => { tbody.innerHTML += <tr><td>${p.nombre}</td><td>${p.stock}</td><td>$${p.precio.toFixed(2)}</td><td><button onclick="eliminarProducto('${p.nombre}')">🗑</button></td></tr>; }); const selectProducto = document.getElementById("venta-producto"); selectProducto.innerHTML = ''; datos.inventario.forEach(p => { selectProducto.innerHTML += <option value="${p.nombre}">${p.nombre}</option>; }); }

function mostrarVentas() { const tbody = document.querySelector("#tabla-ventas tbody"); tbody.innerHTML = ""; datos.ventas.slice(-10).reverse().forEach(v => { tbody.innerHTML += <tr><td>${v.producto}</td><td>${v.cantidad}</td><td>$${v.total.toFixed(2)}</td><td>${v.tipo}</td></tr>; }); }

function mostrarDeudas() { const tbody = document.querySelector("#tabla-deudas tbody"); tbody.innerHTML = ""; datos.deudas.slice(-10).reverse().forEach(d => { tbody.innerHTML += <tr><td>${d.cliente}</td><td>$${d.total.toFixed(2)}</td><td><button onclick="abonar('${d.cliente}')">Abonar</button></td></tr>; }); }

function filtrarBalance() { const tipo = document.getElementById("filtro-tipo").value; const inicio = document.getElementById("filtro-inicio").value; const fin = document.getElementById("filtro-fin").value; let desde = new Date(0); let hasta = new Date();

if (tipo === "hoy") { const hoy = new Date(); desde = new Date(hoy.setHours(0, 0, 0, 0)); } else if (tipo === "mes") { const hoy = new Date(); desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1); } else if (tipo === "anio") { const hoy = new Date(); desde = new Date(hoy.getFullYear(), 0, 1); } else if (tipo === "rango" && inicio && fin) { desde = new Date(inicio); hasta = new Date(fin); }

const filtradas = datos.ventas.filter(v => { const fecha = new Date(v.fecha); return fecha >= desde && fecha <= hasta; });

const tbody = document.querySelector("#tabla-balance tbody"); tbody.innerHTML = ""; filtradas.slice(-10).reverse().forEach(v => { tbody.innerHTML += <tr><td>${v.producto}</td><td>${v.cantidad}</td><td>$${v.total.toFixed(2)}</td></tr>; }); }

function descargarPDF() { const { jsPDF } = window.jspdf; const doc = new jsPDF(); doc.text("Reporte de Ventas", 10, 10); let y = 20; datos.ventas.slice(-10).forEach(v => { doc.text(${v.producto} | ${v.cantidad} | $${v.total.toFixed(2)} | ${v.tipo}, 10, y); y += 10; }); doc.save("reporte.pdf"); }

cambiarVista("ventas"); actualizarListados();

