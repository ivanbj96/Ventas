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


// Manejo de datos (localStorage - Estructura de datos de ejemplo)

// Estructura de datos para productos (ajusta según tus necesidades)
const productoSchema = {
    id: String,
    nombre: String,
    stock: Number,
    precio: Number
};

// Estructura de datos para ventas (ajusta según tus necesidades)
const ventaSchema = {
    id: String,
    productoId: String,
    cantidad: Number,
    tipo: String,
    clienteId: String
};


// Funciones para localStorage (implementa las funciones CRUD)

function obtenerProductos() {
  const productosStr = localStorage.getItem('productos');
  return productosStr ? JSON.parse(productosStr) : [];
}


function guardarProductos(productos) {
  localStorage.setItem('productos', JSON.stringify(productos));
}


function obtenerVentas() {
  const ventasStr = localStorage.getItem('ventas');
  return ventasStr ? JSON.parse(ventasStr) : [];
}

function guardarVentas(ventas) {
  localStorage.setItem('ventas', JSON.stringify(ventas));
}

// ... (funciones para clientes y deudas, similares a las anteriores)


// Funciones para llenar los selects (ejemplo para productos)
function llenarSelectProductos() {
  const select = document.getElementById('venta-producto');
  const productos = obtenerProductos();

  productos.forEach(producto => {
    const option = document.createElement('option');
    option.value = producto.id;
    option.textContent = producto.nombre;
    select.appendChild(option);
  });
}

//Llama a la función para llenar el select al cargar la página
window.addEventListener('load', llenarSelectProductos);


//Ejemplo de registro de venta (solo guarda en localStorage, sin validaciones ni manejo de errores aun)
document.getElementById('btn-guardar-venta').addEventListener('click', () => {
    const venta = {
        id: Date.now().toString(), //ID simple para este ejemplo
        productoId: document.getElementById('venta-producto').value,
        cantidad: parseInt(document.getElementById('venta-cantidad').value),
        tipo: document.getElementById('venta-tipo').value,
        clienteId: document.getElementById('venta-cliente').value
    };

    const ventas = obtenerVentas();
    ventas.push(venta);
    guardarVentas(ventas);
    console.log('Venta registrada:', venta)
});