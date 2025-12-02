/**
 * METADATA LOADER
 * Carga dinámicamente los metadatos del sitio (título, H1, favicon)
 * desde la configuración del backend
 */

import { getApiBase } from './utils.js';

/**
 * Determinar qué página estamos cargando
 */
function getCurrentPage() {
    const path = window.location.pathname;

    if (path.includes('natura.html')) return 'natura';
    if (path.includes('avon.html')) return 'avon';
    if (path.includes('arbell.html')) return 'arbell';
    if (path.includes('index.html') || path.endsWith('/')) return 'index';

    return null;
}

/**
 * Cargar y aplicar metadatos
 */
async function loadMetadata() {
    const currentPage = getCurrentPage();

    // Solo cargar en páginas principales
    if (!currentPage) return;

    try {
        const API_BASE = getApiBase();
        const response = await fetch(`${API_BASE}/api/settings/siteMetadata`);

        if (!response.ok) {
            console.warn('Could not load site metadata, using defaults');
            return;
        }

        const data = await response.json();
        const metadata = data.value || data;

        // Actualizar título de la página
        if (metadata[currentPage]?.title) {
            document.title = metadata[currentPage].title;
        }

        // Actualizar H1 en el header
        if (metadata[currentPage]?.h1) {
            const h1Element = document.querySelector('header h1');
            if (h1Element) {
                h1Element.innerHTML = metadata[currentPage].h1;
            }
        }

        // Actualizar favicon
        if (metadata.favicon) {
            updateFavicon(metadata.favicon);
        }

    } catch (err) {
        console.error('Error loading metadata:', err);
    }
}

/**
 * Actualizar el favicon
 */
function updateFavicon(faviconPath) {
    // Buscar link existente o crear uno nuevo
    let link = document.querySelector("link[rel*='icon']");

    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }

    link.href = faviconPath;
}

// Ejecutar al cargar la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMetadata);
} else {
    loadMetadata();
}

export { loadMetadata };
