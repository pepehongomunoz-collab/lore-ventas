/**
 * PAGE-INIT.JS
 * 
 * Inicialización genérica para las páginas de marcas (Natura, Avon, Arbell).
 * Lee el atributo data-brand del elemento main para saber qué productos cargar.
 */

import { loadProducts } from './productLoader.js';
import { initCartBadge } from './cart.js';
import { initSearch } from './search.js';
import { initFilters } from './filters.js';
import './productCart.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar componentes comunes
    initCartBadge();
    initSearch();

    // Detectar marca y cargar productos
    const mainElement = document.querySelector('main');
    if (mainElement && mainElement.dataset.brand) {
        const brand = mainElement.dataset.brand;
        await loadProducts(brand);
        initFilters();
    }
});
