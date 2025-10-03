// ========================================
// 📦 GESTIÓN DE PRODUCTOS
// ========================================

import { products, setProducts } from './state.js';
import { generateId } from './utils.js';
import { saveToStorage } from './persistence.js';
// import webSocketSync from './websocket.js'; // DESHABILITADO TEMPORALMENTE
import { renderInventory, renderSalesProducts } from './rendering.js';

// === AGREGAR/EDITAR PRODUCTO ===
export async function addProduct(e) {
  e.preventDefault();
  
  if (!Array.isArray(products)) {
    setProducts([]);
  }
  
  const nameInput = document.getElementById('productName');
  const costInput = document.getElementById('productCost');
  const priceInput = document.getElementById('productPrice');
  const categoryInput = document.getElementById('productCategory');
  const stockInput = document.getElementById('productStock');
  const imageInput = document.getElementById('productImage');
  
  if (!nameInput || !costInput || !priceInput || !categoryInput || !stockInput) {
    Swal.fire({
      icon: 'error',
      title: 'Error de formulario',
      text: 'Faltan campos obligatorios en el formulario.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  const name = nameInput.value.trim();
  const cost = parseFloat(costInput.value);
  const price = parseFloat(priceInput.value);
  const category = categoryInput.value.trim();
  const stock = parseInt(stockInput.value) || 0;

  if (!name) {
    Swal.fire({
      icon: 'error',
      title: 'Nombre requerido',
      text: 'El nombre del producto es obligatorio.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  if (isNaN(cost) || cost < 0 || isNaN(price) || price < 0) {
    Swal.fire({
      icon: 'error',
      title: 'Valores inválidos',
      text: 'El costo y precio deben ser valores positivos.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  if (price < cost) {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Precio bajo',
      text: 'El precio de venta es menor al costo. ¿Estás seguro?',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Revisar'
    });
    if (!result.isConfirmed) {
      return;
    }
  }

  const saveProduct = async (imageData) => {
    try {
      if (window.editingProductId) {
        // Editar producto existente
        const realProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const productIndex = realProducts.findIndex(p => p.id === window.editingProductId);
        if (productIndex !== -1) {
          realProducts[productIndex] = {
            ...realProducts[productIndex],
            name,
            cost,
            price,
            category,
            stock,
            image: imageData || products[productIndex].image
          };
          
          await saveToStorage('products', realProducts);
          
          // Actualizar array en memoria
          products.length = 0;
          products.push(...realProducts);
          
          // Sincronizar individual inmediatamente
          if (window.syncManager && window.syncManager.isEnabled) {
            window.syncManager.syncProduct(realProducts[productIndex]);
            console.log('🔄 Producto editado sincronizado individualmente:', realProducts[productIndex].id);
          }
          
          // DEBUG: Verificar sincronización
          console.log('=== DEBUG SINCRONIZACIÓN EDICIÓN ===');
          console.log('window.syncManager existe:', !!window.syncManager);
          
          // Sincronizar con WebSocket
          if (window.syncManager && window.syncManager.isEnabled) {
            window.syncManager.syncProduct(products[productIndex]);
            console.log('🔄 Producto actualizado sincronizado:', products[productIndex].id);
          } else {
            console.log('⚠️ Sincronización NO disponible para edición');
          }
          
          renderInventory();
          renderSalesProducts();
          
          // Forzar sincronización completa inmediatamente
          if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
            window.tillupWebSocketClient.sendAllLocalData();
            console.log('🔄 Sincronización completa forzada después de editar producto');
          }
          
          document.getElementById('formProduct').reset();
          document.getElementById('imagePreview').innerHTML = '';
          // Cerrar modal y limpiar estado
          const modalElement = document.getElementById('modalProduct');
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
          
          const submitBtn = document.querySelector('#modalProduct .btn-primary');
          if (submitBtn) {
            submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Agregar Producto';
          }
          
          // Limpiar estado de edición
          window.editingProductId = null;
          
          Swal.fire({
            icon: 'success',
            title: 'Producto actualizado',
            text: 'Producto actualizado correctamente.',
            confirmButtonText: 'Aceptar'
          });
        }
      } else {
        // Agregar nuevo producto
        const newProduct = {
          id: generateId('product'),
          name,
          cost,
          price,
          category,
          stock,
          image: imageData,
          createdAt: new Date().toISOString()
        };
        
        const realProducts = JSON.parse(localStorage.getItem('products') || '[]');
        realProducts.push(newProduct);
        await saveToStorage('products', realProducts);
        
        // Actualizar array en memoria
        products.length = 0;
        products.push(...realProducts);
        
        // Sincronizar individual inmediatamente
        if (window.syncManager && window.syncManager.isEnabled) {
          window.syncManager.syncProduct(newProduct);
          console.log('🔄 Producto nuevo sincronizado individualmente:', newProduct.id);
        }
        
        // DEBUG: Verificar sincronización
        console.log('=== DEBUG SINCRONIZACIÓN ===');
        console.log('window.syncManager existe:', !!window.syncManager);
        console.log('syncManager.isEnabled:', window.syncManager ? window.syncManager.isEnabled : 'N/A');
        console.log('tillupSync existe:', !!window.tillupSync);
        console.log('tillupWebSocketClient existe:', !!window.tillupWebSocketClient);
        
        // Sincronizar con WebSocket
        if (window.syncManager && window.syncManager.isEnabled) {
          window.syncManager.syncProduct(newProduct);
          console.log('🔄 Producto nuevo sincronizado:', newProduct.id);
        } else {
          console.log('⚠️ Sincronización NO disponible');
        }
        
        renderInventory();
        renderSalesProducts();
        
        // Forzar sincronización completa inmediatamente
        if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
          window.tillupWebSocketClient.sendAllLocalData();
          console.log('🔄 Sincronización completa forzada después de agregar producto');
        }
        
        // Cerrar modal y limpiar formulario
        const modalElement = document.getElementById('modalProduct');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
        
        const form = document.getElementById('formProduct');
        if (form) form.reset();
        
        const preview = document.getElementById('imagePreview');
        if (preview) preview.innerHTML = '';
        
        Swal.fire({
          icon: 'success',
          title: 'Producto agregado',
          text: 'Producto agregado correctamente.',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el producto. Inténtalo de nuevo.',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Procesar imagen si existe
  if (imageInput && imageInput.files && imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => saveProduct(reader.result);
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    saveProduct('');
  }
}

// === ELIMINAR PRODUCTO ===
export function deleteProduct(productId) {
  Swal.fire({
    icon: 'warning',
    title: '¿Eliminar producto?',
    text: 'Esta acción no se puede deshacer.',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then(async (result) => {
    if (result.isConfirmed) {
      const realProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const updatedProducts = realProducts.filter(p => p.id !== productId);
      await saveToStorage('products', updatedProducts);
      
      // Actualizar arrays
      setProducts(updatedProducts);
      
      // Sincronizar individual inmediatamente
      if (window.syncManager && window.syncManager.isEnabled) {
        window.syncManager.syncProduct({ id: productId, deleted: true });
        console.log('🔄 Producto eliminado sincronizado individualmente:', productId);
      }
      
      // Forzar sincronización completa inmediatamente
      if (window.tillupWebSocketClient && window.tillupWebSocketClient.isConnected) {
        window.tillupWebSocketClient.sendAllLocalData();
        console.log('🔄 Sincronización completa forzada después de eliminar producto');
      }
      
      renderInventory();
      renderSalesProducts();
      
      Swal.fire({ 
        icon: 'success', 
        title: 'Eliminado', 
        text: 'Producto eliminado.',
        timer: 1500,
        showConfirmButton: false
      });
    }
  });
}

// === EDITAR PRODUCTO ===
export function editProduct(productId) {
  // Buscar en localStorage para datos actualizados
  const realProducts = JSON.parse(localStorage.getItem('products') || '[]');
  const product = realProducts.find(p => p.id === productId);
  if (!product) {
    Swal.fire({
      icon: 'error',
      title: 'Producto no encontrado',
      text: 'No se pudo encontrar el producto para editar.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  
  // Limpiar el formulario primero
  const form = document.getElementById('formProduct');
  if (form) form.reset();
  
  const nameInput = document.getElementById('productName');
  const costInput = document.getElementById('productCost');
  const priceInput = document.getElementById('productPrice');
  const categoryInput = document.getElementById('productCategory');
  const stockInput = document.getElementById('productStock');
  const preview = document.getElementById('imagePreview');
  
  if (nameInput) nameInput.value = product.name;
  if (costInput) costInput.value = product.cost;
  if (priceInput) priceInput.value = product.price;
  if (categoryInput) categoryInput.value = product.category || '';
  if (stockInput) stockInput.value = product.stock || 0;
  
  if (preview) {
    if (product.image) {
      preview.innerHTML = `<img src="${product.image}" alt="Imagen actual" style="max-width: 100%; height: auto; border-radius: 8px;">`;
    } else {
      preview.innerHTML = '';
    }
  }
  
  window.editingProductId = productId;
  
  const submitBtn = document.querySelector('#modalProduct .btn-primary');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Actualizar Producto';
  }
  
  const modalElement = document.getElementById('modalProduct');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}

// === MOSTRAR DETALLES DEL PRODUCTO ===
export function showProductDetailModal(productId) {
  // Buscar en localStorage para datos actualizados
  const realProducts = JSON.parse(localStorage.getItem('products') || '[]');
  const product = realProducts.find(p => p.id === productId);
  if (!product) return;
  
  const html = `
    <div class="text-center mb-3">
      ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;" />` : ''}
    </div>
    <h4 class="mb-2">${product.name}</h4>
    <p><strong>Categoría:</strong> ${product.category || '-'}</p>
    <p><strong>Costo:</strong> $${product.cost.toFixed(2)}</p>
    <p><strong>Precio:</strong> $${product.price.toFixed(2)}</p>
    <p><strong>Stock:</strong> ${product.stock}</p>
    <div class="d-flex justify-content-end gap-2 mt-4">
      <button class="btn btn-outline-danger" id="deleteProductBtn">
        <i class="bi bi-trash"></i> Eliminar
      </button>
      <button class="btn btn-outline-primary" id="editProductBtn">
        <i class="bi bi-pencil"></i> Editar
      </button>
    </div>
  `;
  
  Swal.fire({
    title: 'Detalles del producto',
    html,
    showConfirmButton: false,
    showCloseButton: true,
    width: 400,
    didOpen: () => {
      // Agregar event listeners después de que el modal se abra
      document.getElementById('deleteProductBtn').addEventListener('click', () => {
        Swal.close();
        deleteProduct(productId);
      });
      
      document.getElementById('editProductBtn').addEventListener('click', () => {
        Swal.close();
        editProduct(productId);
      });
    }
  });
}

// === CONFIGURAR VISTA PREVIA DE IMAGEN ===
export function setupProductImagePreview() {
  const productPhotoInput = document.getElementById('productImage');
  if (productPhotoInput) {
    productPhotoInput.onchange = function(e) {
      const preview = document.getElementById('imagePreview');
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

// === LIMPIAR FORMULARIO AL CERRAR MODAL ===
export function resetProductForm() {
  const form = document.getElementById('formProduct');
  if (form) form.reset();
  
  const preview = document.getElementById('imagePreview');
  if (preview) preview.innerHTML = '';
  
  const submitBtn = document.querySelector('#modalProduct .btn-primary');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Agregar Producto';
  }
  
  window.editingProductId = null;
}

// Exponer funciones globalmente para compatibilidad con HTML
window.addProduct = addProduct;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.showProductDetailModal = showProductDetailModal;
window.resetProductForm = resetProductForm;