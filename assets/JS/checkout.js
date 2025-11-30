/**
 * Checkout Page Logic
 * Handles payment processing using Vexor with MercadoPago
 */

import { API_URL } from './config.js';
const CART_STORAGE_KEY = 'lore-ventas-cart'; // CRITICAL: Must match cart.js


/**
 * Initialize checkout page
 */
export function initCheckout() {
    console.log('🚀 Initializing checkout...');
    const cart = getCart();
    console.log('🛒 Cart retrieved:', cart);
    console.log('📏 Cart length:', cart ? cart.length : 'null');

    if (!cart || cart.length === 0) {
        console.log('⚠️ Cart is empty, showing empty state');
        showEmptyCheckout();
        return;
    }

    console.log('✅ Cart has items, displaying checkout');
    displayCheckoutItems(cart);
    calculateTotals(cart);
    setupPaymentButton(cart);
}

/**
 * Get cart from localStorage
 */
function getCart() {
    try {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        console.log('🔍 Raw cart data from localStorage:', cartData);

        if (!cartData) {
            console.log('❌ No cart data found');
            return [];
        }

        const cart = JSON.parse(cartData);
        console.log('📦 Parsed cart object:', cart);

        // Handle both cart.items structure and direct array
        const items = cart.items || cart || [];
        console.log('✅ Returning items:', items);
        console.log('📊 Items length:', items.length);

        return items;
    } catch (error) {
        console.error('❌ Error reading cart:', error);
        return [];
    }
}

/**
 * Display checkout items
 */
function displayCheckoutItems(cart) {
    const container = document.getElementById('checkout-items-container');
    if (!container) return;

    container.innerHTML = cart.map(item => {
        const price = item.unit_price || item.price || 0;
        const name = item.title || item.name || 'Producto';

        return `
    <div class="checkout-item">
      <div class="checkout-item-info">
        <h4>${name}</h4>
        <p class="item-quantity">Cantidad: ${item.quantity}</p>
      </div>
      <div class="checkout-item-price">
        $${(price * item.quantity).toFixed(2)}
      </div>
    </div>
  `;
    }).join('');
}

/**
 * Calculate and display totals
 */
function calculateTotals(cart) {
    const subtotal = cart.reduce((sum, item) => {
        const price = item.unit_price || item.price || 0;
        return sum + (price * item.quantity);
    }, 0);
    const total = subtotal; // Add shipping/taxes here if needed

    const subtotalElement = document.getElementById('checkout-subtotal');
    const totalElement = document.getElementById('checkout-total');

    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
}

/**
 * Show empty checkout state
 */
function showEmptyCheckout() {
    const checkoutContainer = document.querySelector('.checkout-container');
    const emptyCheckout = document.getElementById('empty-checkout');

    if (checkoutContainer) checkoutContainer.style.display = 'none';
    if (emptyCheckout) emptyCheckout.style.display = 'flex';
}

/**
 * Setup payment button click handler
 */
function setupPaymentButton(cart) {
    const payButton = document.getElementById('pay-button');
    if (!payButton) return;

    payButton.addEventListener('click', async () => {
        await processPayment(cart);
    });
}

/**
 * Process payment through Vexor/MercadoPago
 */
async function processPayment(cart) {
    const payButton = document.getElementById('pay-button');
    const loadingElement = document.getElementById('payment-loading');
    const errorElement = document.getElementById('payment-error');
    const errorMessage = document.getElementById('error-message');

    try {
        // Show loading state
        if (payButton) payButton.disabled = true;
        if (loadingElement) loadingElement.style.display = 'flex';
        if (errorElement) errorElement.style.display = 'none';

        // Prepare items for MercadoPago (ensure required fields)
        const items = cart.map(item => ({
            title: item.title || item.name,
            unit_price: parseFloat(item.unit_price || item.price || 0),
            quantity: parseInt(item.quantity),
            description: item.description || ''
        }));

        // Validate items
        for (const item of items) {
            if (!item.title || !item.unit_price || !item.quantity) {
                throw new Error('Producto inválido en el carrito');
            }
        }

        // Get current URL for redirects
        const baseUrl = window.location.origin;
        const successUrl = `${baseUrl}/pages/payment-success.html`;
        const failureUrl = `${baseUrl}/pages/payment-failure.html`;

        // Call backend to create payment
        const response = await fetch(`${API_URL}/payments/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: items,
                successRedirect: successUrl,
                failureRedirect: failureUrl
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al procesar el pago');
        }

        if (!data.success || !data.payment_url) {
            throw new Error('No se recibió URL de pago');
        }

        // Redirect to payment URL
        window.location.href = data.payment_url;

    } catch (error) {
        console.error('Payment error:', error);

        // Show error message
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'flex';
        if (errorMessage) errorMessage.textContent = error.message || 'Error al procesar el pago. Por favor, intenta nuevamente.';
        if (payButton) payButton.disabled = false;
    }
}
