/**
 * BRAND-PAGE-INIT.JS
 * 
 * Inicialización genérica para las páginas de marcas (Natura, Avon, Arbell).
 * Recibe el nombre de la marca como parámetro.
 */

import { loadProducts } from './productLoader.js';
import { initCartBadge } from './cart.js';
import { initSearch } from './search.js';
import { initFilters } from './filters.js';
import './productCart.js';

/**
 * Inicializa una página de marca
 * @param {string} brandName - El nombre de la marca ('arbell', 'natura', 'avon')
 */
export async function initBrandPage(brandName) {
    // Cargar productos y luego inicializar filtros
    await loadProducts(brandName);
    initFilters();

    // Inicializar componentes comunes
    initCartBadge();
    initSearch();
}
