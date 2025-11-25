/**
 * CART PAGE.JS
 * 
 * Maneja la visualización y funcionalidad de la página del carrito
 */

import { getCart, removeFromCart, updateQuantity, clearCart, getCartTotal, initCartBadge } from './cart.js';
import { getAuthToken } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    initCartBadge();

    // Event listener para vaciar carrito
    document.getElementById('clear-cart-btn')?.addEventListener('click', handleClearCart);

    // Event listener para proceder al pago (con verificación de autenticación)
    document.querySelector('.btn-checkout')?.addEventListener('click', handleCheckout);

    // Escuchar cambios en el carrito
    window.addEventListener('cartUpdated', renderCart);
});

/**
 * Renderizar carrito completo
 */
function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cart-items-container');
    const summary = document.getElementById('cart-summary');

    if (!container) return;

    if (cart.items.length === 0) {
        // Carrito vacío
        container.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-shopping-cart"></i>
                <h3>Tu carrito está vacío</h3>
                <p>¡Agrega productos para comenzar tu compra!</p>
                <button class="btn-continue-shopping" onclick="window.location.href='../index.html'">
                    <i class="fa-solid fa-arrow-left"></i> Ver Productos
                </button>
            </div>
        `;
        summary.style.display = 'none';
    } else {
        // Renderizar items
        container.innerHTML = `
            <div class="cart-items">
                ${cart.items.map(item => renderCartItem(item)).join('')}
            </div>
        `;

        // Mostrar resumen
        summary.style.display = 'block';
        updateSummary();

        // Agregar event listeners a botones
        attachItemEventListeners();
    }
}

/**
 * Renderizar un item del carrito
 */
function renderCartItem(item) {
    const subtotal = item.price * item.quantity;

    return `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-brand">${item.brand}</div>
                <div class="cart-item-price">$${item.price.toLocaleString('es-AR')}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn quantity-decrease" data-id="${item.id}">
                    <i class="fa-solid fa-minus"></i>
                </button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn quantity-increase" data-id="${item.id}">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
            <div class="cart-item-subtotal">
                <strong>$${subtotal.toLocaleString('es-AR')}</strong>
            </div>
            <button class="cart-item-remove" data-id="${item.id}">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;
}

/**
 * Actualizar resumen de precios
 */
function updateSummary() {
    const total = getCartTotal();

    document.getElementById('cart-subtotal').textContent = `$${total.toLocaleString('es-AR')}`;
    document.getElementById('cart-total').textContent = `$${total.toLocaleString('es-AR')}`;
}

/**
 * Agregar event listeners a botones de items
 */
function attachItemEventListeners() {
    // Botones de eliminar
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            removeFromCart(productId);
            renderCart();
        });
    });

    // Botones de aumentar cantidad
    document.querySelectorAll('.quantity-increase').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            const cart = getCart();
            const item = cart.items.find(i => i.id === productId);
            if (item) {
                updateQuantity(productId, item.quantity + 1);
                renderCart();
            }
        });
    });

    // Botones de disminuir cantidad
    document.querySelectorAll('.quantity-decrease').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            const cart = getCart();
            const item = cart.items.find(i => i.id === productId);
            if (item && item.quantity > 1) {
                updateQuantity(productId, item.quantity - 1);
                renderCart();
            } else if (item && item.quantity === 1) {
                // Si la cantidad es 1, preguntar si desea eliminar
                if (confirm('¿Deseas eliminar este producto del carrito?')) {
                    removeFromCart(productId);
                    renderCart();
                }
            }
        });
    });
}

/**
 * Manejar vaciado del carrito
 */
function handleClearCart() {
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
        clearCart();
        renderCart();
    }
}

/**
 * Manejar click en proceder al pago
 * Verifica si el usuario está autenticado antes de permitir el checkout
 */
function handleCheckout() {
    const token = getAuthToken();

    if (!token) {
        // Usuario no autenticado - mostrar mensaje y redirigir a login
        alert('Debes iniciar sesión para proceder con la compra');
        window.location.href = './login.html';
    } else {
        // Usuario autenticado - proceder al checkout
        window.location.href = './checkout.html';
    }
}
