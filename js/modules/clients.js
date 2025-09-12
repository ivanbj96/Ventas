// ========================================
// 👥 GESTIÓN DE CLIENTES
// ========================================

import { clients, debts, setClients, currentClientId, setCurrentClientId } from './state.js';
import { generateId } from './utils.js';
import { saveToStorage } from './persistence.js';
// import webSocketSync from './websocket.js'; // DESHABILITADO TEMPORALMENTE
import { renderClients } from './rendering.js';

// === AGREGAR/EDITAR CLIENTE ===
export async function addClient(e) {
  e.preventDefault();
  
  if (!Array.isArray(clients)) {
    setClients([]);
  }
  
  const nameInput = document.getElementById('clientName');
  const phoneInput = document.getElementById('clientPhone');
  const addressInput = document.getElementById('clientAddress');
  const photoInput = document.getElementById('clientPhoto');
  const locationInput = document.getElementById('clientLocation');

  if (!nameInput || !phoneInput || !addressInput) {
    Swal.fire({
      icon: 'error',
      title: 'Error de formulario',
      text: 'Faltan campos obligatorios en el formulario.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();
  const location = locationInput ? locationInput.value.trim() : '';

  if (!name) {
    Swal.fire({
      icon: 'error',
      title: 'Nombre requerido',
      text: 'El nombre del cliente es obligatorio.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  if (phone && !/^[0-9]{7,15}$/.test(phone)) {
    Swal.fire({
      icon: 'error',
      title: 'Teléfono inválido',
      text: 'El número de teléfono debe tener entre 7 y 15 dígitos.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  const saveClient = async (photo) => {
    try {
      const clientData = {
        name,
        phone,
        address,
        location,
        photo: photo || (window.editingClientId ? clients.find(c => c.id === window.editingClientId)?.photo : '')
      };

      if (window.editingClientId) {
        const clientIndex = clients.findIndex(c => c.id === window.editingClientId);
        if (clientIndex !== -1) {
          clients[clientIndex] = { ...clients[clientIndex], ...clientData };
        }
      } else {
        clients.push({ 
          id: generateId('client'), 
          ...clientData, 
          debt: 0,
          createdAt: new Date().toISOString()
        });
      }

      await saveToStorage('clients', clients);
      
      // Sincronizar con WebSocket
      if (window.syncManager && window.syncManager.isEnabled) {
        if (window.editingClientId) {
          const client = clients.find(c => c.id === window.editingClientId);
          window.syncManager.syncClient(client);
          console.log('🔄 Cliente actualizado sincronizado:', client.id);
        } else {
          const newClient = clients[clients.length - 1];
          window.syncManager.syncClient(newClient);
          console.log('🔄 Cliente nuevo sincronizado:', newClient.id);
        }
      }
      
      renderClients();
      updateClientSelector();
      
      // Actualizar selector global también
      if (window.updateClientSelector) {
        window.updateClientSelector();
      }

      // Limpiar formulario
      if (document.getElementById('formClient')) {
        document.getElementById('formClient').reset();
      }
      if (document.getElementById('clientImagePreview')) {
        document.getElementById('clientImagePreview').innerHTML = '';
      }

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalClient'));
      if (modal) modal.hide();

      Swal.fire({
        icon: 'success',
        title: window.editingClientId ? 'Cliente actualizado' : 'Cliente agregado',
        text: `El cliente "${name}" se ha guardado correctamente.`,
        confirmButtonText: 'Aceptar'
      }).then(() => {
        if (window.editingClientId) {
          delete window.editingClientId;
          const submitBtn = document.querySelector('#modalClient .btn-primary');
          if (submitBtn) {
            submitBtn.innerHTML = '<i class="bi bi-person-plus"></i> Agregar Cliente';
          }
        }
      });
    } catch (error) {
      console.error('Error guardando cliente:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el cliente. Inténtalo de nuevo.',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Procesar foto si existe
  if (photoInput && photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => saveClient(reader.result);
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    saveClient('');
  }
}

// === ELIMINAR CLIENTE ===
export function deleteClient(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) return;
  
  Swal.fire({
    icon: 'warning',
    title: '¿Eliminar cliente?',
    text: `Esta acción no se puede deshacer. ¿Eliminar a "${client.name}"?`,
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then(async (result) => {
    if (result.isConfirmed) {
      const updatedClients = clients.filter(c => c.id !== clientId);
      const updatedDebts = debts.filter(d => d.clientId !== clientId);
      
      if (currentClientId === clientId) setCurrentClientId(null);
      
      setClients(updatedClients);
      await saveToStorage('clients', updatedClients);
      await saveToStorage('debts', updatedDebts);
      
      // Sincronizar con WebSocket
      if (window.syncManager && window.syncManager.isEnabled) {
        window.syncManager.syncClient({ id: clientId, deleted: true });
        console.log('🔄 Cliente eliminado sincronizado:', clientId);
      }
      
      renderClients();
      updateClientSelector();
      
      // Actualizar selector global también
      if (window.updateClientSelector) {
        window.updateClientSelector();
      }
      
      Swal.fire({ 
        icon: 'success', 
        title: 'Eliminado', 
        text: 'Cliente eliminado.',
        timer: 1500,
        showConfirmButton: false
      });
    }
  });
}

// === EDITAR CLIENTE ===
export function editClient(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) {
    Swal.fire({
      icon: 'error',
      title: 'Cliente no encontrado',
      text: 'No se pudo encontrar el cliente para editar.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  const nameInput = document.getElementById('clientName');
  const phoneInput = document.getElementById('clientPhone');
  const addressInput = document.getElementById('clientAddress');
  const locationInput = document.getElementById('clientLocation');
  const preview = document.getElementById('clientImagePreview');
  
  if (nameInput) nameInput.value = client.name || '';
  if (phoneInput) phoneInput.value = client.phone || '';
  if (addressInput) addressInput.value = client.address || '';
  if (locationInput) locationInput.value = client.location || '';
  
  if (preview) {
    if (client.photo) {
      preview.innerHTML = `<img src="${client.photo}" alt="Foto actual" style="max-width: 100%; height: auto; border-radius: 8px;">`;
    } else {
      preview.innerHTML = '';
    }
  }
  
  window.editingClientId = clientId;
  
  const submitBtn = document.querySelector('#modalClient .btn-primary');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Actualizar Cliente';
  }
  
  const modal = new bootstrap.Modal(document.getElementById('modalClient'));
  modal.show();
}

// === MOSTRAR DETALLES DEL CLIENTE ===
export function showClientDetails(clientId) {
  const client = clients.find(c => c.id == clientId);
  if (!client) return;
  
  const html = `
    <div class="text-center mb-3">
      ${client.photo ? 
        `<img src="${client.photo}" alt="${client.name}" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:3px solid #1F2D3D;" />` :
        `<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg, #1F2D3D, #2a3f5a);display:flex;align-items:center;justify-content:center;margin:0 auto;color:#fff;font-size:2rem;font-weight:700;border:3px solid #1F2D3D;">${client.name.charAt(0).toUpperCase()}</div>`
      }
    </div>
    <h4 class="mb-3 text-center">${client.name}</h4>
    <div class="row">
      <div class="col-12 mb-2">
        <strong><i class="bi bi-telephone"></i> Teléfono:</strong> ${client.phone || 'No registrado'}
      </div>
      <div class="col-12 mb-2">
        <strong><i class="bi bi-geo-alt"></i> Dirección:</strong> ${client.address || 'No registrada'}
      </div>
      ${client.location ? `
        <div class="col-12 mb-3">
          <a href="https://maps.google.com/?q=${client.location}" target="_blank" class="btn btn-outline-primary btn-sm">
            <i class="bi bi-geo-alt-fill"></i> Ver ubicación en mapa
          </a>
        </div>
      ` : ''}
      <div class="col-12">
        <strong>Deuda actual:</strong> 
        <span class="badge ${client.debt > 0 ? 'bg-warning' : 'bg-success'} fs-6">
          ${client.debt > 0 ? `$${client.debt.toFixed(2)}` : 'Sin deuda'}
        </span>
      </div>
    </div>
  `;

  Swal.fire({
    title: 'Detalles del Cliente',
    html: html,
    showCancelButton: true,
    confirmButtonText: 'Editar',
    cancelButtonText: 'Cerrar',
    showDenyButton: client.debt > 0,
    denyButtonText: 'Ver deudas'
  }).then((result) => {
    if (result.isConfirmed) {
      editClient(clientId);
    } else if (result.isDenied) {
      showClientDebts(clientId);
    }
  });
}

// === MOSTRAR DEUDAS DEL CLIENTE ===
function showClientDebts(clientId) {
  const client = clients.find(c => c.id === clientId);
  const clientDebts = debts.filter(d => d.clientId === clientId);
  
  if (clientDebts.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Sin deudas',
      text: `${client.name} no tiene deudas registradas.`
    });
    return;
  }

  let html = `<h5 class="mb-3">Deudas de ${client.name}</h5>`;
  clientDebts.forEach(debt => {
    html += `
      <div class="border rounded p-3 mb-2">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>${debt.date}</strong><br>
            <small class="text-muted">${debt.reason || 'Venta a crédito'}</small>
          </div>
          <div class="text-end">
            <div class="fw-bold">$${debt.amount.toFixed(2)}</div>
            ${debt.abono ? `<small class="text-success">Abonado: $${debt.abono.toFixed(2)}</small>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  Swal.fire({
    title: 'Deudas del Cliente',
    html: html,
    showCancelButton: true,
    confirmButtonText: 'Cerrar',
    cancelButtonText: 'Volver'
  });
}

// === ACTUALIZAR SELECTOR DE CLIENTES ===
export function updateClientSelector() {
  const selector = document.getElementById('cartClientSelector');
  if (!selector) return;
  
  selector.innerHTML = `<option value="">Seleccionar cliente...</option>`;

  clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.innerText = `${c.name}${c.debt > 0 ? ` (Deuda: $${c.debt.toFixed(2)})` : ''}`;
    selector.appendChild(opt);
  });
}

// === CONFIGURAR VISTA PREVIA DE IMAGEN ===
export function setupClientImagePreview() {
  const clientPhotoInput = document.getElementById('clientPhoto');
  if (clientPhotoInput) {
    clientPhotoInput.onchange = function(e) {
      const preview = document.getElementById('clientImagePreview');
      if (!preview) return;
      
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa" style="max-width: 100%; height: auto; border-radius: 8px;">`;
        };
        reader.readAsDataURL(file);
      } else {
        preview.innerHTML = '';
      }
    };
  }
}

// === CONFIGURAR GEOLOCALIZACIÓN ===
export function setupClientLocation() {
  const btnGetLocation = document.getElementById('btnGetLocation');
  const locationInput = document.getElementById('clientLocation');
  const locationStatus = document.getElementById('locationStatus');
  
  if (btnGetLocation && locationInput && locationStatus) {
    btnGetLocation.onclick = function() {
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
          let errorMessage = 'No se pudo obtener la ubicación.';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso denegado. Habilita la ubicación en tu navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado.';
              break;
          }
          locationStatus.textContent = errorMessage;
          btnGetLocation.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    };
  }
}

// === MOSTRAR DETALLES DE DEUDA ===
export function showDebtDetailModal(debtId) {
  const d = debts.find(debt => debt.id === debtId);
  if (!d) return;
  
  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;
  
  let html = `<div style='max-width:340px;margin:auto;background:#fff;border-radius:10px;padding:1.2rem 1rem 1rem 1rem;box-shadow:0 2px 12px #0001;font-family:monospace;'>`;
  html += `<div style='text-align:center;font-weight:bold;font-size:1.1rem;letter-spacing:1px;'>TillUp POS</div>`;
  html += `<div style='text-align:center;font-size:0.95rem;color:#888;margin-bottom:0.5rem;'>${d.date}</div>`;
  html += `<hr style='margin:0.5rem 0;border-top:1.5px dashed #bbb;' />`;
  html += `<div style='font-size:0.98rem;'><strong>Cliente:</strong> ${d.clientName}</div>`;
  html += `<div class='mb-2'><strong>Monto original:</strong> ${formatCurrency(d.total || d.amount + (d.abono || 0))}</div>`;
  if (d.abono) html += `<div class='mb-2'><strong>Abonado:</strong> ${formatCurrency(d.abono)}</div>`;
  html += `<div class='mb-2'><strong>Saldo:</strong> <span class='text-danger'>${formatCurrency(d.amount)}</span></div>`;
  html += `<hr style='margin:0.5rem 0;border-top:1.5px dashed #bbb;' />`;
  html += `<div class='mb-2'><strong>Motivo:</strong> ${d.reason || '-'}</div>`;
  html += `</div>`;

  let showAbonar = d.amount > 0;
  let showPagar = d.amount > 0;

  Swal.fire({
    title: '',
    html: html,
    showCancelButton: true,
    showConfirmButton: showPagar,
    confirmButtonText: 'Pagar todo',
    showDenyButton: showAbonar,
    denyButtonText: 'Abonar',
    cancelButtonText: 'Cerrar',
    customClass: { popup: 'swal2-pos-ticket' }
  }).then(async (result) => {
    if (result.isConfirmed) {
      // Pagar todo
      d.abono = (d.abono || 0) + d.amount;
      d.amount = 0;
      await saveToStorage('debts', debts);
      if (window.renderDebts) window.renderDebts();
      Swal.fire({ icon: 'success', title: 'Deuda pagada', text: 'La deuda ha sido pagada en su totalidad.' });
    } else if (result.isDenied) {
      // Abonar
      Swal.fire({
        title: 'Abonar a deuda',
        html: `<div class='mb-2'>¿Cuánto desea abonar?</div><input id='abonoInput' type='number' min='1' max='${d.amount}' class='form-control' placeholder='Abono' />`,
        inputAttributes: { min: 1, max: d.amount },
        showCancelButton: true,
        confirmButtonText: 'Abonar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const abono = parseFloat(document.getElementById('abonoInput').value) || 0;
          if (abono < 1 || abono > d.amount) {
            Swal.showValidationMessage('El abono debe ser entre 1 y el saldo');
            return false;
          }
          return abono;
        }
      }).then(async (abonoResult) => {
        if (abonoResult.isConfirmed) {
          const abono = abonoResult.value;
          d.abono = (d.abono || 0) + abono;
          d.amount -= abono;
          if (d.amount < 0) d.amount = 0;
          await saveToStorage('debts', debts);
          if (window.renderDebts) window.renderDebts();
          Swal.fire({ icon: 'success', title: 'Abono registrado', text: `Abono registrado: ${formatCurrency(abono)}` });
        }
      });
    }
  });
}

// Exponer funciones globalmente para compatibilidad con HTML
window.addClient = addClient;
window.deleteClient = deleteClient;
window.editClient = editClient;
window.showClientDetails = showClientDetails;
window.showDebtDetailModal = showDebtDetailModal;