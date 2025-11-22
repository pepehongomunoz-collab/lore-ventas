/**
 * SEARCH MODULE
 * 
 * Maneja la funcionalidad de búsqueda desde el header
 * Redirige a la página de resultados con el query
 */

import { getPageHref } from './utils.js';

export function initSearch() {
    const searchForm = document.querySelector('.search-form');
    const searchInput = searchForm?.querySelector('input[type="search"]');

    if (!searchForm || !searchInput) return;

    // Manejar submit del formulario
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const query = searchInput.value.trim();

        if (query.length < 2) {
            alert('Por favor ingresa al menos 2 caracteres para buscar');
            return;
        }

        // Redirigir a página de búsqueda con el query
        const searchUrl = `${getPageHref('search.html')}?q=${encodeURIComponent(query)}`;
        window.location.href = searchUrl;
    });

    // También permitir búsqueda con Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchForm.dispatchEvent(new Event('submit'));
        }
    });
}
