// app.js COMPLETO con TODAS LAS MEJORAS INTEGRADAS

// Variables globales let ventas = JSON.parse(localStorage.getItem('ventas')) || []; let inventario = JSON.parse(localStorage.getItem('inventario')) || []; let clientes = JSON.parse(localStorage.getItem('clientes')) || []; let deudas = JSON.parse(localStorage.getItem('deudas')) || []; let proformas = JSON.parse(localStorage.getItem('proformas')) || [];

let carrito = []; let abonoClienteId = null; let clienteSeleccionadoAnterior = null;

// Inicialización document.addEventListener('DOMContentLoaded', () => { cargarClientesEnSelect(); cargarProductosEnSelect(); mostrarVentas(); mostrarInventario(); mostrarClientes(); mostrarDeudas(); filtrarBalance(); cambiarVista('ventas'); document.getElementById('venta-fecha').valueAsDate = new Date(); ocultarFiltrosRango();

const clienteSelect = document.getElementById('venta-cliente'); clienteSelect.addEventListener('change', () => { const nuevoId = parseInt(clienteSelect.value); if (carrito.length > 0 && clienteSeleccionadoAnterior && nuevoId !== clienteSeleccionadoAnterior) { if (confirm('¿Guardar carrito como proforma para el cliente anterior?')) { guardarProforma(clienteSeleccionadoAnterior); } carrito = []; actualizarCarrito(); } clienteSeleccionadoAnterior = nuevoId; }); });

// Funciones para cambiar vista function cambiarVista(vista) { document.querySelectorAll('.vista').forEach(sec => sec.classList.remove('active')); document.querySelector(#vista-${vista}).classList.add('active'); document.querySelectorAll('footer button').forEach(btn => btn.classList.remove('active')); const footerMap = { ventas: 0, balance: 1, deudas: 2, inventario: 3, clientes: 4 }; document.querySelectorAll('footer button')[footerMap[vista]].classList.add('active'); }

// MODALES function abrirModal(id) { document.getElementById(id).style.display = 'block'; if(id === 'modal-venta') { const idCliente = parseInt(document.getElementById('venta-cliente').value); const proforma = proformas.find(p => p.clienteId === idCliente); carrito = proforma ? proforma.items.map(i => ({ producto: inventario.find(p => p.id === i.productoId), cantidad: i.cantidad })) : []; actualizarCarrito(); } }

function cerrarModal(id) { document.getElementById(id).style.display = 'none'; }

function registrarCliente() { const nombre = document.getElementById('cliente-nombre').value.trim(); if (!nombre) return alert('Debe ingresar un nombre válido.'); clientes.push({ id: Date.now(), nombre }); localStorage.setItem('clientes', JSON.stringify(clientes)); mostrarClientes(); cargarClientesEnSelect(); cerrarModal('modal-cliente'); document.getElementById('cliente-nombre').value = ''; }

function mostrarClientes() { const tbody = document.querySelector('#tabla-clientes tbody'); tbody.innerHTML = ''; clientes.forEach(c => { const tr = document.createElement('tr'); tr.innerHTML = <td>${c.nombre}</td><td><button onclick="eliminarCliente(${c.id})">Eliminar</button></td>; tbody.appendChild(tr); }); }

function eliminarCliente(id) { if (!confirm('¿Eliminar cliente?')) return; clientes = clientes.filter(c => c.id !== id); localStorage.setItem('clientes', JSON.stringify(clientes)); mostrarClientes(); cargarClientesEnSelect(); }

function cargarClientesEnSelect() { const select = document.getElementById('venta-cliente'); select.innerHTML = ''; clientes.forEach(c => { const option = document.createElement('option'); option.value = c.id; option.textContent = c.nombre; select.appendChild(option); }); }

function agregarProducto() { const nombre = document.getElementById('inv-nombre').value.trim(); const stock = parseInt(document.getElementById('inv-stock').value); const precio = parseFloat(document.getElementById('inv-precio').value); const costo = parseFloat(document.getElementById('inv-costo')?.value || 0); if (!nombre || isNaN(stock) || isNaN(precio)) return alert('Datos inválidos.'); inventario.push({ id: Date.now(), nombre, stock, precio, costo }); localStorage.setItem('inventario', JSON.stringify(inventario)); mostrarInventario(); cargarProductosEnSelect(); cerrarModal('modal-inv'); document.getElementById('inv-nombre').value = ''; document.getElementById('inv-stock').value = ''; document.getElementById('inv-precio').value = ''; if (document.getElementById('inv-costo')) document.getElementById('inv-costo').value = ''; }

function mostrarInventario() { const tbody = document.querySelector('#tabla-inv tbody'); tbody.innerHTML = ''; inventario.forEach(p => { const tr = document.createElement('tr'); tr.innerHTML =  <td>${p.nombre}</td><td>${p.stock}</td><td>$${p.precio.toFixed(2)}</td> <td><button onclick="eliminarProducto(${p.id})">Eliminar</button></td>; tbody.appendChild(tr); }); }

function eliminarProducto(id) { if (!confirm('¿Eliminar producto?')) return; inventario = inventario.filter(p => p.id !== id); localStorage.setItem('inventario', JSON.stringify(inventario)); mostrarInventario(); cargarProductosEnSelect(); }

function cargarProductosEnSelect() { const select = document.getElementById('venta-producto'); select.innerHTML = ''; inventario.forEach(p => { const option = document.createElement('option'); option.value = p.id; option.textContent = ${p.nombre} ($${p.precio} - Stock: ${p.stock}); select.appendChild(option); }); }

function agregarAlCarrito() { const productoId = parseInt(document.getElementById('venta-producto').value); const cantidad = parseInt(document.getElementById('venta-cantidad').value); if (!productoId || !cantidad || cantidad <= 0) return alert('Datos inválidos.'); const producto = inventario.find(p => p.id === productoId); if (!producto || producto.stock < cantidad) return alert('Stock insuficiente.'); const enCarrito = carrito.find(i => i.producto.id === productoId); if (enCarrito) { if (enCarrito.cantidad + cantidad > producto.stock) return alert('Stock insuficiente.'); enCarrito.cantidad += cantidad; } else { carrito.push({ producto, cantidad }); } actualizarCarrito(); document.getElementById('venta-cantidad').value = ''; }

function actualizarCarrito() { const tbody = document.querySelector('#tabla-carrito tbody'); tbody.innerHTML = ''; carrito.forEach((item, i) => { const tr = document.createElement('tr'); tr.innerHTML =  <td>${item.producto.nombre}</td> <td>${item.cantidad}</td> <td>$${item.producto.precio.toFixed(2)}</td> <td>$${(item.producto.precio * item.cantidad).toFixed(2)}</td> <td><button onclick="eliminarDelCarrito(${i})">X</button></td>; tbody.appendChild(tr); }); }

function eliminarDelCarrito(i) { carrito.splice(i, 1); actualizarCarrito(); }

function guardarProforma(clienteId) { proformas = proformas.filter(p => p.clienteId !== clienteId); proformas.push({ clienteId, items: carrito.map(item => ({ productoId: item.producto.id, cantidad: item.cantidad })) }); localStorage.setItem('proformas', JSON.stringify(proformas)); alert('Proforma guardada.'); }

// ... El código continúa con funciones para registrar venta, mostrar ventas, balance y exportar PDF ...

// app.js COMPLETO con TODAS LAS MEJORAS INTEGRADAS (continuación)

// ...continuación desde registrarVenta y demás funciones

function registrarVenta() { const clienteId = parseInt(document.getElementById('venta-cliente').value); const tipo = document.getElementById('venta-tipo').value; const fecha = document.getElementById('venta-fecha').value; if (!clienteId || !fecha || carrito.length === 0) return alert('Complete todos los campos y agregue productos.');

for (const item of carrito) { const producto = inventario.find(p => p.id === item.producto.id); if (!producto || producto.stock < item.cantidad) { return alert(Stock insuficiente para ${item.producto.nombre}); } }

carrito.forEach(item => { const prod = inventario.find(p => p.id === item.producto.id); prod.stock -= item.cantidad; });

const venta = { id: Date.now(), clienteId, tipo, fecha, items: carrito.map(item => ({ productoId: item.producto.id, nombre: item.producto.nombre, cantidad: item.cantidad, precio: item.producto.precio, costo: item.producto.costo || 0, total: item.producto.precio * item.cantidad })) };

ventas.push(venta); localStorage.setItem('ventas', JSON.stringify(ventas)); localStorage.setItem('inventario', JSON.stringify(inventario));

// Actualizar deuda si es crédito if (tipo === 'credito') { let deuda = deudas.find(d => d.clienteId === clienteId); const totalVenta = venta.items.reduce((acc, i) => acc + i.total, 0); if (!deuda) { deuda = { clienteId, total: totalVenta, abonos: [], saldo: totalVenta }; deudas.push(deuda); } else { deuda.total += totalVenta; deuda.saldo += totalVenta; } localStorage.setItem('deudas', JSON.stringify(deudas)); }

// Eliminar proforma si existe proformas = proformas.filter(p => p.clienteId !== clienteId); localStorage.setItem('proformas', JSON.stringify(proformas));

mostrarVentas(); mostrarInventario(); mostrarDeudas(); cerrarModal('modal-venta'); }

function mostrarVentas() { const tbody = document.querySelector('#tabla-ventas tbody'); tbody.innerHTML = ''; ventas.forEach(v => { const cliente = clientes.find(c => c.id === v.clienteId); const fecha = new Date(v.fecha).toLocaleDateString(); v.items.forEach(item => { const tr = document.createElement('tr'); tr.innerHTML =  <td>${item.nombre}</td> <td>${item.cantidad}</td> <td>$${item.total.toFixed(2)}</td> <td>${v.tipo}</td> <td>${cliente ? cliente.nombre : 'Desconocido'}</td> <td>${fecha}</td> <td></td>; tbody.appendChild(tr); }); }); }

function mostrarDeudas() { const tbody = document.querySelector('#tabla-deudas tbody'); tbody.innerHTML = ''; deudas.forEach(d => { const cliente = clientes.find(c => c.id === d.clienteId); const tr = document.createElement('tr'); tr.innerHTML =  <td>${cliente ? cliente.nombre : 'Desconocido'}</td> <td>$${d.total.toFixed(2)}</td> <td>$${d.abonos.reduce((a,b)=>a+b.monto,0).toFixed(2)}</td> <td>$${d.saldo.toFixed(2)}</td> <td><button onclick="abrirModalAbono(${d.clienteId})">Abonar</button></td>; tbody.appendChild(tr); }); }

function abrirModalAbono(clienteId) { abonoClienteId = clienteId; const deuda = deudas.find(d => d.clienteId === clienteId); document.getElementById('info-abono').textContent = Saldo pendiente: $${deuda?.saldo.toFixed(2) || 0}; document.getElementById('abono-monto').value = ''; abrirModal('modal-abono'); }

function realizarAbono() { const monto = parseFloat(document.getElementById('abono-monto').value); const deuda = deudas.find(d => d.clienteId === abonoClienteId); if (!deuda || isNaN(monto) || monto <= 0 || monto > deuda.saldo) return alert('Monto inválido.'); deuda.abonos.push({ fecha: new Date().toISOString(), monto }); deuda.saldo -= monto; localStorage.setItem('deudas', JSON.stringify(deudas)); mostrarDeudas(); cerrarModal('modal-abono'); }

function filtrarBalance() { const tipo = document.getElementById('filtro-tipo').value; const inicio = document.getElementById('filtro-inicio').value; const fin = document.getElementById('filtro-fin').value; const hoy = new Date();

let ventasFiltradas = [...ventas]; switch (tipo) { case 'hoy': ventasFiltradas = ventasFiltradas.filter(v => new Date(v.fecha).toDateString() === hoy.toDateString()); ocultarFiltrosRango(); break; case 'mes': ventasFiltradas = ventasFiltradas.filter(v => { const f = new Date(v.fecha); return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear(); }); ocultarFiltrosRango(); break; case 'anio': ventasFiltradas = ventasFiltradas.filter(v => new Date(v.fecha).getFullYear() === hoy.getFullYear()); ocultarFiltrosRango(); break; case 'rango': if (inicio && fin) { const ini = new Date(inicio); const finD = new Date(fin); ventasFiltradas = ventasFiltradas.filter(v => { const f = new Date(v.fecha); return f >= ini && f <= finD; }); } mostrarFiltrosRango(); break; default: ocultarFiltrosRango(); }

const resumen = {}; ventasFiltradas.forEach(v => { v.items.forEach(i => { if (!resumen[i.nombre]) resumen[i.nombre] = { cantidad: 0, total: 0, costoTotal: 0 }; resumen[i.nombre].cantidad += i.cantidad; resumen[i.nombre].total += i.total; resumen[i.nombre].costoTotal += (i.costo || 0) * i.cantidad; }); });

const tbody = document.querySelector('#tabla-balance tbody'); tbody.innerHTML = ''; Object.entries(resumen).forEach(([nombre, data]) => { const tr = document.createElement('tr'); const ganancia = data.total - data.costoTotal; tr.innerHTML = <td>${nombre}</td><td>${data.cantidad}</td><td>$${data.total.toFixed(2)}</td><td>$${ganancia.toFixed(2)}</td>; tbody.appendChild(tr); }); }

function ocultarFiltrosRango() { document.getElementById('filtro-inicio').style.display = 'none'; document.getElementById('filtro-fin').style.display = 'none'; }

function mostrarFiltrosRango() { document.getElementById('filtro-inicio').style.display = 'inline-block'; document.getElementById('filtro-fin').style.display = 'inline-block'; }

function descargarPDF() { const { jsPDF } = window.jspdf; const doc = new jsPDF(); doc.setFontSize(18); doc.text('Reporte de Balance', 14, 22); const headers = [['Producto', 'Cantidad', 'Total', 'Ganancia']]; const data = []; const filas = document.querySelectorAll('#tabla-balance tbody tr'); filas.forEach(fila => { const cols = fila.querySelectorAll('td'); data.push([cols[0].textContent, cols[1].textContent, cols[2].textContent, cols[3].textContent]); }); doc.autoTable({ head: headers, body: data, startY: 30 }); doc.save('reporte_balance.pdf'); }

// FIN DEL CÓDIGO app.js

