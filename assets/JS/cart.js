/**
 * CART.JS - Shopping Cart Management
 * 
 * Maneja todas las operaciones del carrito de compras
 * con persistencia en localStorage
 */

const CART_STORAGE_KEY = 'lore-ventas-cart';

/**
 * Obtener carrito desde localStorage
 */
export function getCart() {
    try {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        return cartData ? JSON.parse(cartData) : { items: [] };
    } catch (error) {
        console.error('Error al obtener carrito:', error);
        return { items: [] };
    }
}

/**
 * Guardar carrito en localStorage
 */
export function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        updateCartBadge();
        // Disparar evento personalizado para que otras partes de la app se enteren
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
    } catch (error) {
        console.error('Error al guardar carrito:', error);
    }
}

/**
 * Agregar producto al carrito
 */
export function addToCart(product) {
    const cart = getCart();

    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.items.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
        // Si ya existe, incrementar cantidad
        cart.items[existingItemIndex].quantity += 1;
    } else {
        // Si no existe, agregarlo con cantidad 1
        cart.items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            brand: product.brand,
            quantity: 1
        });
    }

    saveCart(cart);
    return cart;
}

/**
 * Remover producto del carrito
 */
export function removeFromCart(productId) {
    const cart = getCart();
    cart.items = cart.items.filter(item => item.id !== productId);
    saveCart(cart);
    return cart;
}

/**
 * Actualizar cantidad de un producto
 */
export function updateQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.items.find(item => item.id === productId);

    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            saveCart(cart);
        }
    }

    return cart;
}

/**
 * Obtener cantidad total de items en el carrito
 */
export function getCartCount() {
    const cart = getCart();
    return cart.items.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Calcular total del carrito
 */
export function getCartTotal() {
    const cart = getCart();
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Verificar si un producto está en el carrito
 */
export function isInCart(productId) {
    const cart = getCart();
    return cart.items.some(item => item.id === productId);
}

/**
 * Vaciar carrito completamente
 */
export function clearCart() {
    saveCart({ items: [] });
}

/**
 * Actualizar badge del carrito en el header
 */
export function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    const count = getCartCount();

    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

/**
 * Inicializar badge del carrito cuando se carga la página
 */
export function initCartBadge() {
    updateCartBadge();
}
