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

// ... (resto del código de manejo de datos, etc.) ...
