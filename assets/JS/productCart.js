/**
 * PRODUCT CART.JS
 * 
 * Maneja la interacción de agregar productos al carrito
 * desde los checkboxes de las tarjetas de productos
 */

import { addToCart, removeFromCart, getCart } from './cart.js';

// Export a helper to initialize cart checkboxes and observer from other modules
export function initCart() {
    // Initialize existing checkboxes
    initializeCartCheckboxes();
    // Set up observer for dynamic additions (e.g., after search renders)
    const observer = new MutationObserver(() => {
        initializeCartCheckboxes();
    });
    const productsContainer = document.querySelector('.productos-contenedor') || document.getElementById('search-results-container');
    if (productsContainer) {
        observer.observe(productsContainer, { childList: true, subtree: true });
    }
}

/**
 * Inicializar event listeners para checkboxes
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeCartCheckboxes();

    // Escuchar cuando se agregan productos dinámicos
    const observer = new MutationObserver(() => {
        initializeCartCheckboxes();
    });

    // Observe the container that holds product cards. Use generic selector to cover both main and search pages.
    const productsContainer = document.querySelector('.productos-contenedor') || document.getElementById('search-results-container');
    if (productsContainer) {
        observer.observe(productsContainer, { childList: true, subtree: true });
    }
});

/**
 * Inicializar checkboxes de productos
 */
function initializeCartCheckboxes() {
    const checkboxes = document.querySelectorAll('.add-to-cart-checkbox');

    checkboxes.forEach(checkbox => {
        // Evitar agregar múltiples listeners
        if (checkbox.dataset.initialized) return;
        checkbox.dataset.initialized = 'true';

        const productCard = checkbox.closest('.producto');
        if (!productCard) return;

        // Verificar si el producto ya está en el carrito
        const productId = productCard.dataset.id;
        if (isProductInCart(productId)) {
            checkbox.checked = true;
        }

        checkbox.addEventListener('change', (e) => {
            handleCheckboxChange(e, productCard);
        });
    });
}

/**
 * Manejar cambio en checkbox
 */
function handleCheckboxChange(event, productCard) {
    const checkbox = event.target;
    const product = extractProductData(productCard);

    if (checkbox.checked) {
        // Agregar al carrito
        addToCart(product);
        showNotification(`✅ ${product.name} agregado al carrito`);
    } else {
        // Remover del carrito
        removeFromCart(product.id);
        showNotification(`❌ ${product.name} eliminado del carrito`);
    }
}

/**
 * Extraer datos del producto desde la tarjeta
 */
function extractProductData(productCard) {
    return {
        id: productCard.dataset.id,
        name: productCard.dataset.name,
        price: parseFloat(productCard.dataset.price),
        image: productCard.dataset.image,
        brand: productCard.dataset.brand
    };
}

/**
 * Verificar si un producto está en el carrito
 */
function isProductInCart(productId) {
    const cart = getCart();
    return cart.items.some(item => item.id === productId);
}

/**
 * Mostrar notificación temporal
 */
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    // Mostrar con animación
    setTimeout(() => notification.classList.add('show'), 10);

    // Ocultar y remover después de 2 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}
