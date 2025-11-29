/**
 * FEATURED PRODUCTS LOADER
 * 
 * Carga y muestra productos destacados aleatorios (uno por marca) en la página principal.
 */

import { getApiBase, handleApiResponse } from './utils.js';

/**
 * Inicializa la sección de productos destacados
 */
export async function initFeaturedProducts() {
    const container = document.getElementById('featured-products-container');
    if (!container) return;

    try {
        const API_BASE = getApiBase();
        
        // Fetch all products
        // Note: In a real production app with many products, we should have an endpoint for this.
        // For now, we'll fetch all and filter client-side or make 3 requests.
        // Let's try making 3 parallel requests for efficiency if the API supports filtering by brand.
        
        const brands = ['natura', 'avon', 'arbell'];
        const promises = brands.map(brand => 
            fetch(`${API_BASE}/api/products?brand=${brand}`)
                .then(res => handleApiResponse(res))
                .then(data => ({ brand, products: data.products || [] }))
        );

        const results = await Promise.all(promises);
        
        // Clear loading message
        container.innerHTML = '';

        results.forEach(({ brand, products }) => {
            if (products.length > 0) {
                // Select random product
                const randomProduct = products[Math.floor(Math.random() * products.length)];
                renderFeaturedProduct(randomProduct, container);
            }
        });

    } catch (err) {
        console.error('Error loading featured products:', err);
        container.innerHTML = '<p>No se pudieron cargar los productos destacados.</p>';
    }
}

/**
 * Renderiza una tarjeta de producto destacado
 */
function renderFeaturedProduct(product, container) {
    const productCard = document.createElement('div');
    productCard.className = 'producto';
    // Add brand class for styling if needed, though styles are usually on main
    // We might need to add specific styling for these cards if they are outside the brand pages
    
    // Add data attributes for cart functionality
    productCard.dataset.id = product._id;
    productCard.dataset.name = product.name;
    productCard.dataset.price = product.price;
    productCard.dataset.image = product.image;
    productCard.dataset.brand = product.brand;

    const price = product.price.toLocaleString('es-AR');

    // Determine brand color for border/style (optional, or use generic styles)
    // We can reuse the existing .producto styles
    
    // We need to ensure the img-box has the brand background color
    // Since we are not inside a .main-brand, we might need inline style or a helper class
    let brandColorClass = '';
    if (product.brand === 'natura') brandColorClass = 'brand-natura';
    if (product.brand === 'avon') brandColorClass = 'brand-avon';
    if (product.brand === 'arbell') brandColorClass = 'brand-arbell';

    productCard.innerHTML = `
        <div class="img-box ${brandColorClass}"><img src="${product.image}" alt="${product.name}"></div>
        <p>${product.name}</p>
        <p>$${price}</p>
        <label><input type="checkbox" class="add-to-cart-checkbox"> Agregar</label>
    `;

    container.appendChild(productCard);
}
