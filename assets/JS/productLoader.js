/**
 * PRODUCT LOADER
 * 
 * Carga productos dinámicamente desde la API para las páginas de marcas.
 * Se integra con el HTML existente.
 */

import { getApiBase, handleApiResponse } from './utils.js';

/**
 * Carga y renderiza productos para una marca específica
 * @param {string} brand - La marca a cargar (natura, avon, arbell)
 * @param {string} containerId - ID del contenedor donde renderizar (opcional)
 */
export async function loadProducts(brand, containerId = 'dynamic-products') {
    // Buscar el contenedor principal de productos
    const parentContainer = document.querySelector('.productos-contenedor');
    if (!parentContainer) return;

    try {
        const API_BASE = getApiBase();
        const response = await fetch(`${API_BASE}/api/products?brand=${brand}`);
        const data = await handleApiResponse(response);
        const products = data.products || [];

        if (products.length === 0) return;

        // Renderizar productos directamente en la grilla principal
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'producto';

            // Agregar data attributes para el carrito
            productCard.dataset.id = product._id;
            productCard.dataset.name = product.name;
            productCard.dataset.price = product.price;
            productCard.dataset.image = product.image;
            productCard.dataset.brand = product.brand;
            productCard.dataset.category = product.category || 'otros';

            // Formatear precio
            const price = product.price.toLocaleString('es-AR');

            productCard.innerHTML = `
                <div class="img-box"><img src="${product.image}" alt="${product.name}"></div>
                <p>${product.name}</p>
                <p>$${price}</p>
                <label><input type="checkbox" class="add-to-cart-checkbox"> Agregar</label>
            `;

            parentContainer.appendChild(productCard);
        });

    } catch (err) {
        console.error(`Error loading ${brand} products:`, err);
    }
}
