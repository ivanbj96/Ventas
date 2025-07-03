// app.js

document.addEventListener("DOMContentLoaded", () => { const vistas = document.querySelectorAll(".vista"); const botones = document.querySelectorAll("footer button");

function cambiarVista(nombre) { vistas.forEach(v => v.classList.remove("active")); document.getElementById(vista-${nombre}).classList.add("active"); }

window.cambiarVista = cambiarVista;

window.abrirModal = id => document.getElementById(id).style.display = "flex"; window.cerrarModal = id => document.getElementById(id).style.display = "none";

const ventas = JSON.parse(localStorage.getItem("ventas")) || []; const clientes = JSON.parse(localStorage.getItem("clientes")) || [];

function renderVentas() { const tbody = document.querySelector("#tabla-ventas tbody"); tbody.innerHTML = ""; ventas.slice(-10).forEach(v => { const tr = document.createElement("tr"); tr.innerHTML = <td>${v.producto}</td><td>${v.cantidad}</td><td>${v.peso}</td><td>${v.precioLb}</td><td>${v.total.toFixed(2)}</td><td>${v.cliente}</td>; tbody.appendChild(tr); }); }

function renderClientes() { const tbody = document.querySelector("#tabla-clientes tbody"); const select = document.querySelector("#modal-venta select"); tbody.innerHTML = ""; select.innerHTML = '<option value="" disabled selected>Seleccionar</option>'; clientes.forEach(c => { const tr = document.createElement("tr"); tr.innerHTML = <td>${c.nombre}</td><td><button onclick="verHistorialCliente('${c.nombre}')">Ver</button></td>; tbody.appendChild(tr); const opt = document.createElement("option"); opt.value = c.nombre; opt.textContent = c.nombre; select.appendChild(opt); }); }

document.querySelector("#modal-cliente button").addEventListener("click", () => { const input = document.querySelector("#modal-cliente input"); if (input.value.trim()) { clientes.push({ nombre: input.value.trim() }); localStorage.setItem("clientes", JSON.stringify(clientes)); cerrarModal("modal-cliente"); input.value = ""; renderClientes(); } });

document.querySelector("#modal-venta button").addEventListener("click", () => { const [producto, cantidad, peso, precioLb] = document.querySelectorAll("#modal-venta input"); const clienteSel = document.querySelector("#modal-venta select"); const cant = parseFloat(cantidad.value); const lbs = parseFloat(peso.value); const price = parseFloat(precioLb.value); const total = (lbs / cant) * price * cant; const data = { producto: producto.value, cantidad: cant, peso: lbs, precioLb: price, total: total, cliente: clienteSel.value }; ventas.push(data); localStorage.setItem("ventas", JSON.stringify(ventas)); cerrarModal("modal-venta"); [producto, cantidad, peso, precioLb].forEach(input => input.value = ""); clienteSel.value = ""; renderVentas(); });

window.verHistorialCliente = nombre => { const historial = ventas.filter(v => v.cliente === nombre); alert(Historial de ${nombre}:\n + historial.map(h => - ${h.producto}: $${h.total.toFixed(2)}).join("\n")); };

renderClientes(); renderVentas();

// Registro del service worker comentado temporalmente // if ('serviceWorker' in navigator) { //   navigator.serviceWorker.register('sw.js') //     .then(reg => console.log('SW registrado:', reg)) //     .catch(err => console.error('Error SW:', err)); // } });

