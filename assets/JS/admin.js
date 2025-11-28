/**
 * ADMIN.JS - Gestión de Productos
 * 
 * Panel de administración para crear, editar y eliminar productos
 * Solo accesible para usuarios admin y developer
 */

import {
    getApiBase,
    handleApiResponse,
    getAuthToken,
    isAdminOrDeveloper,
    getPageHref,
    clearAuthData
} from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = getApiBase();
    const token = getAuthToken();

    // Verificar autenticación y permisos
    if (!token) {
        window.location.href = getPageHref('login.html');
        return;
    }

    if (!isAdminOrDeveloper()) {
        alert('❌ Acceso denegado. Solo administradores y desarrolladores pueden acceder a esta página.');
        window.location.href = '../index.html';
        return;
    }

    // Elementos del DOM
    const productForm = document.getElementById('product-form');
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('product-name');
    const productDescInput = document.getElementById('product-description');
    const productPriceInput = document.getElementById('product-price');
    const productImageInput = document.getElementById('product-image');
    const productBrandSelect = document.getElementById('product-brand');
    const productCategorySelect = document.getElementById('product-category');
    const filterBrandSelect = document.getElementById('filter-brand');
    const productsContainer = document.getElementById('products-container');
    const formTitle = document.getElementById('form-title');
    const submitText = document.getElementById('submit-text');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');

    let editingProductId = null;
    let currentImagePath = null; // Para almacenar la ruta de la imagen actual al editar

    // Cargar productos al iniciar
    loadProducts();

    // Event listeners
    productForm.addEventListener('submit', handleSubmit);
    cancelEditBtn.addEventListener('click', cancelEdit);
    filterBrandSelect.addEventListener('change', () => loadProducts(filterBrandSelect.value));
    productImageInput.addEventListener('change', handleImagePreview);

    /**
     * Cargar productos desde la API
     */
    async function loadProducts(brand = '') {
        try {
            const url = brand
                ? `${API_BASE}/api/products?brand=${brand}`
                : `${API_BASE}/api/products/all`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await handleApiResponse(response);

            displayProducts(data.products || []);
        } catch (err) {
            console.error('Error loading products:', err);
            productsContainer.innerHTML = `
                <p style="color: #d33; text-align: center;">
                    <i class="fa-solid fa-exclamation-triangle"></i> 
                    Error al cargar productos: ${err.message}
                </p>
            `;

            // Si el token expiró, redirigir
            if (err.message.includes('401') || err.message.includes('Invalid token')) {
                clearAuthData();
                window.location.href = getPageHref('login.html');
            }
        }
    }

    /**
     * Mostrar productos en la interfaz
     */
    function displayProducts(products) {
        if (products.length === 0) {
            productsContainer.innerHTML = `
                <p style="text-align: center; color: #888;">
                    <i class="fa-solid fa-box-open"></i> No hay productos registrados
                </p>
            `;
            return;
        }

        productsContainer.innerHTML = products.map(product => `
            <div class="product-admin-card" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 6px; display: flex; gap: 15px; align-items: center;">
                <img src="${product.image}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #333;">${product.name}</h4>
                    <p style="margin: 0; color: #666; font-size: 14px;">${product.description || 'Sin descripción'}</p>
                    <p style="margin: 5px 0 0 0; font-weight: 600; color: #f5a938;">$${product.price.toLocaleString('es-AR')}</p>
                    <div style="margin-top: 5px;">
                        <span class="role-badge role-${product.brand}" style="font-size: 11px; padding: 2px 8px;">${product.brand.toUpperCase()}</span>
                        <span class="role-badge" style="font-size: 11px; padding: 2px 8px; background: #6c757d; color: white;">${product.category ? product.category.toUpperCase() : 'OTROS'}</span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button onclick="window.editProduct('${product._id}')" class="btn-edit" style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fa-solid fa-pen"></i> Editar
                    </button>
                    <button onclick="window.deleteProduct('${product._id}')" class="btn-delete" style="padding: 8px 12px; background: #d33; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fa-solid fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Preview de imagen seleccionada
     */
    function handleImagePreview(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                previewImg.src = event.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.style.display = 'none';
        }
    }

    /**
     * Subir imagen al servidor
     */
    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${API_BASE}/api/uploads`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await handleApiResponse(response);
            return data.imagePath;
        } catch (err) {
            throw new Error(`Error al subir imagen: ${err.message}`);
        }
    }

    /**
     * Manejar envío del formulario
     */
    async function handleSubmit(e) {
        e.preventDefault();

        try {
            // Determinar la ruta de la imagen
            let imagePath = currentImagePath; // Usar la imagen actual si estamos editando

            // Si hay un archivo nuevo seleccionado, subirlo
            if (productImageInput.files && productImageInput.files[0]) {
                submitText.textContent = 'Subiendo imagen...';
                imagePath = await uploadImage(productImageInput.files[0]);
            }

            // Si no hay imagen (nuevo producto sin imagen), mostrar error
            if (!imagePath) {
                alert('❌ Debes seleccionar una imagen');
                return;
            }

            submitText.textContent = editingProductId ? 'Guardando cambios...' : 'Creando producto...';

            const productData = {
                name: productNameInput.value.trim(),
                description: productDescInput.value.trim(),
                price: parseFloat(productPriceInput.value),
                image: imagePath,
                brand: productBrandSelect.value,
                category: productCategorySelect.value
            };

            const url = editingProductId
                ? `${API_BASE}/api/products/${editingProductId}`
                : `${API_BASE}/api/products`;

            const method = editingProductId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });

            const data = await handleApiResponse(response);

            alert(`✅ ${data.message || 'Producto guardado exitosamente'}`);

            // Limpiar formulario y recargar productos
            productForm.reset();
            cancelEdit();
            loadProducts(filterBrandSelect.value);
        } catch (err) {
            console.error('Error saving product:', err);
            alert(`❌ Error al guardar: ${err.message}`);
        } finally {
            submitText.textContent = editingProductId ? 'Guardar Cambios' : 'Agregar Producto';
        }
    }

    /**
     * Editar producto
     */
    window.editProduct = async function (productId) {
        try {
            const response = await fetch(`${API_BASE}/api/products/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await handleApiResponse(response);
            const product = data.products.find(p => p._id === productId);

            if (!product) {
                alert('❌ Producto no encontrado');
                return;
            }

            // Llenar formulario
            editingProductId = productId;
            productIdInput.value = productId;
            productNameInput.value = product.name;
            productDescInput.value = product.description || '';
            productPriceInput.value = product.price;
            currentImagePath = product.image; // Guardar la ruta de la imagen actual
            productBrandSelect.value = product.brand;
            productCategorySelect.value = product.category || 'otros';

            // Mostrar preview de la imagen actual
            previewImg.src = product.image;
            imagePreview.style.display = 'block';

            // Hacer el input de imagen opcional al editar
            productImageInput.removeAttribute('required');

            // Cambiar UI
            formTitle.innerHTML = '<i class="fa-solid fa-pen"></i> Editar Producto';
            submitText.textContent = 'Guardar Cambios';
            cancelEditBtn.style.display = 'inline-block';

            // Scroll al formulario
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error loading product:', err);
            alert(`❌ Error: ${err.message}`);
        }
    };

    /**
     * Eliminar producto
     */
    window.deleteProduct = async function (productId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await handleApiResponse(response);

            alert(`✅ ${data.message || 'Producto eliminado exitosamente'}`);
            loadProducts(filterBrandSelect.value);
        } catch (err) {
            console.error('Error deleting product:', err);
            alert(`❌ Error al eliminar: ${err.message}`);
        }
    };

    /**
     * Cancelar edición
     */
    function cancelEdit() {
        editingProductId = null;
        currentImagePath = null;
        productIdInput.value = '';
        productForm.reset();
        imagePreview.style.display = 'none';
        productImageInput.setAttribute('required', 'required');
        formTitle.innerHTML = '<i class="fa-solid fa-plus"></i> Agregar Nuevo Producto';
        submitText.textContent = 'Agregar Producto';
        cancelEditBtn.style.display = 'none';
    }
});
