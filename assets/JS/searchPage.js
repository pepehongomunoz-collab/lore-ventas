/**
 * SEARCH PAGE MODULE
 * 
 * Maneja la lógica de la página de resultados de búsqueda
 * Realiza la petición al backend y muestra los productos
 */

import { API_BASE } from './utils.js';
import { addToCart, isInCart } from './cart.js';

/**
 * Obtener query parameter de la URL
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Realizar búsqueda en el backend
 */
async function searchProducts(query) {
    try {
        const response = await fetch(`${API_BASE}/api/products/search?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error('Error en la búsqueda');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

/**
 * Renderizar productos en la grilla
 */
function renderProducts(products) {
    const container = document.getElementById('search-results-container');

    if (!container) return;

    container.innerHTML = '';

    products.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

/**
 * Crear tarjeta de producto
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'producto';
    card.setAttribute('data-id', product._id);
    card.setAttribute('data-name', product.name);
    card.setAttribute('data-price', product.price);
    card.setAttribute('data-image', product.image);
    card.setAttribute('data-brand', product.brand);

    // Verificar si ya está en el carrito
    const inCart = isInCart(product._id);

    card.innerHTML = `
    <div class="img-box">
      <img src="${product.image}" alt="${product.name}" onerror="this.src='../assets/img/placeholder.png'">
    </div>
    <p>${product.name}</p>
    <p class="product-brand">${product.brand.toUpperCase()}</p>
    <p class="product-price">$${product.price.toLocaleString('es-AR')}</p>
    <label>
      <input type="checkbox" class="add-to-cart-checkbox" ${inCart ? 'checked' : ''}>
      Agregar
    </label>
  `;

    return card;
}

/**
 * Mostrar loading state
 */
function showLoading() {
    const loading = document.getElementById('search-loading');
    const results = document.getElementById('search-results-container');
    const noResults = document.getElementById('no-results');

    if (loading) loading.style.display = 'block';
    if (results) results.style.display = 'none';
    if (noResults) noResults.style.display = 'none';
}

/**
 * Ocultar loading state
 */
function hideLoading() {
    const loading = document.getElementById('search-loading');
    if (loading) loading.style.display = 'none';
}

/**
 * Mostrar mensaje de no resultados
 */
function showNoResults() {
    const results = document.getElementById('search-results-container');
    const noResults = document.getElementById('no-results');

    if (results) results.style.display = 'none';
    if (noResults) noResults.style.display = 'flex';
}

/**
 * Mostrar resultados
 */
function showResults() {
    const results = document.getElementById('search-results-container');
    const noResults = document.getElementById('no-results');

    if (results) results.style.display = 'grid';
    if (noResults) noResults.style.display = 'none';
}

/**
 * Actualizar display del query
 */
function updateQueryDisplay(query, count) {
    const display = document.getElementById('search-query-display');
    if (display) {
        display.textContent = `Mostrando ${count} resultado${count !== 1 ? 's' : ''} para "${query}"`;
    }
}

/**
 * Función principal que se ejecuta en la página de búsqueda
 */
export async function performSearchOnPage() {
    console.log('[SEARCH] performSearchOnPage called');

    // Verificar que estamos en la página de búsqueda
    if (!window.location.pathname.includes('search.html')) {
        console.log('[SEARCH] Not on search.html, exiting');
        return;
    }

    console.log('[SEARCH] On search.html, continuing...');

    const query = getQueryParam('q');
    console.log('[SEARCH] Query param:', query);

    if (!query || query.trim().length < 2) {
        console.log('[SEARCH] Query too short or empty');
        showNoResults();
        const display = document.getElementById('search-query-display');
        if (display) {
            display.textContent = 'Por favor ingresa un término de búsqueda válido';
        }
        return;
    }

    // También actualizar el input de búsqueda con el query actual
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = query;
    }

    try {
        console.log('[SEARCH] Showing loading state');
        showLoading();

        console.log('[SEARCH] Fetching products for:', query);
        const data = await searchProducts(query);
        console.log('[SEARCH] Received data:', data);

        hideLoading();

        if (data.products && data.products.length > 0) {
            console.log('[SEARCH] Found', data.products.length, 'products');
            updateQueryDisplay(query, data.count);
            renderProducts(data.products);
            showResults();

            // Importar productCart.js para activar los event listeners
            console.log('[SEARCH] Importing productCart.js');
            const { initCart } = await import('./productCart.js');
            initCart();
            console.log('[SEARCH] productCart.js imported successfully');
        } else {
            console.log('[SEARCH] No products found');
            updateQueryDisplay(query, 0);
            showNoResults();
        }
    } catch (error) {
        hideLoading();
        console.error('[SEARCH] Error performing search:', error);

        const display = document.getElementById('search-query-display');
        if (display) {
            display.textContent = 'Error al realizar la búsqueda. Por favor intenta nuevamente.';
        }
        showNoResults();
    }
}
