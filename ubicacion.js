// Lógica para capturar la ubicación actual y mostrar el estado en el formulario de clientes

document.addEventListener('DOMContentLoaded', () => {
  const btnGetLocation = document.getElementById('btnGetLocation');
  const locationInput = document.getElementById('clientLocation');
  const locationStatus = document.getElementById('locationStatus');

  if (btnGetLocation) {
    btnGetLocation.addEventListener('click', () => {
      if (!navigator.geolocation) {
        locationStatus.textContent = 'La geolocalización no es soportada por tu navegador.';
        return;
      }
      locationStatus.textContent = 'Obteniendo ubicación...';
      btnGetLocation.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude},${position.coords.longitude}`;
          locationInput.value = coords;
          locationStatus.textContent = `Ubicación capturada: ${coords}`;
          btnGetLocation.disabled = false;
        },
        (error) => {
          locationStatus.textContent = 'No se pudo obtener la ubicación.';
          btnGetLocation.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
}); 