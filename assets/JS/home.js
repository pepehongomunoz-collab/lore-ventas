/**
 * HOME.JS
 * 
 * Inicialización de la página principal.
 */

import { initCartBadge } from './cart.js';
import { initSearch } from './search.js';

document.addEventListener('DOMContentLoaded', () => {
    initCartBadge();
    initSearch();
});
