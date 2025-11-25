/**
 * CART.JS - Shopping Cart Management
 * 
 * Maneja todas las operaciones del carrito de compras
 * con persistencia en localStorage
 */

const CART_STORAGE_KEY = 'lore-ventas-cart';

/**
 * Obtener carrito desde localStorage
 * Limpia automáticamente items expirados (más de 4 horas)
 */
export function getCart() {
    try {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        if (!cartData) return { items: [] };

        const cart = JSON.parse(cartData);

        // Limpiar items expirados (4 horas = 4 * 60 * 60 * 1000 ms)
        const EXPIRATION_TIME = 4 * 60 * 60 * 1000;
        const now = Date.now();

        const validItems = cart.items.filter(item => {
            if (!item.addedAt) {
                // Si no tiene timestamp, agregar uno ahora (retrocompatibilidad)
                item.addedAt = now;
                return true;
            }
            // Verificar si ha pasado más de 4 horas
            return (now - item.addedAt) < EXPIRATION_TIME;
        });

        // Si se eliminaron items expirados, actualizar el carrito
        if (validItems.length !== cart.items.length) {
            const updatedCart = { items: validItems };
            saveCart(updatedCart);
            console.log(`Se eliminaron ${cart.items.length - validItems.length} items expirados del carrito`);
            return updatedCart;
        }

        return cart;
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
        // Si ya existe, incrementar cantidad y actualizar timestamp
        cart.items[existingItemIndex].quantity += 1;
        cart.items[existingItemIndex].addedAt = Date.now(); // Renovar timestamp
    } else {
        // Si no existe, agregarlo con cantidad 1 y timestamp
        cart.items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            brand: product.brand,
            quantity: 1,
            addedAt: Date.now() // Timestamp de cuando se agregó
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
 * Inicializar badge del carrito
 */
export function initCartBadge() {
    updateCartBadge();

    // Verificar items expirados cada 5 minutos
    setInterval(() => {
        const cart = getCart(); // Esto automáticamente limpia expirados
        updateCartBadge();
    }, 5 * 60 * 1000); // 5 minutos
}

/**
 * Obtener tiempo restante hasta la expiración de un item (en horas)
 */
export function getTimeUntilExpiration(item) {
    if (!item.addedAt) return null;

    const EXPIRATION_TIME = 4 * 60 * 60 * 1000; // 4 horas
    const elapsed = Date.now() - item.addedAt;
    const remaining = EXPIRATION_TIME - elapsed;

    if (remaining <= 0) return 0;

    return Math.floor(remaining / (60 * 60 * 1000)); // Convertir a horas
}
