/**
 * THEME LOADER - Carga Global de Colores Personalizados
 * 
 * Este script se ejecuta en todas las páginas para aplicar
 * los colores personalizados configurados por el desarrollador
 */

import { getApiBase } from './utils.js';

/**
 * Cargar y aplicar colores desde el backend
 */
async function loadSiteColors() {
    try {
        const API_BASE = getApiBase();
        const response = await fetch(`${API_BASE}/api/settings/siteColors`);

        if (!response.ok) {
            console.log('Using default colors');
            return;
        }

        const data = await response.json();

        if (data.value) {
            const colors = data.value;
            const root = document.documentElement;

            // Aplicar variables CSS personalizadas
            if (colors.primaryColor) {
                root.style.setProperty('--primary-color', colors.primaryColor);
            }
            if (colors.primaryHover) {
                root.style.setProperty('--primary-hover', colors.primaryHover);
            }
            if (colors.bodyBg) {
                root.style.setProperty('--body-bg', colors.bodyBg);
            }
            if (colors.headerGradientStart) {
                root.style.setProperty('--header-gradient-start', colors.headerGradientStart);
            }
            if (colors.headerGradientEnd) {
                root.style.setProperty('--header-gradient-end', colors.headerGradientEnd);
            }
            if (colors.footerBg) {
                root.style.setProperty('--footer-bg', colors.footerBg);
            }
            if (colors.accentBg) {
                root.style.setProperty('--accent-bg', colors.accentBg);
            }

            console.log('✅ Custom colors applied');
        }
    } catch (error) {
        console.log('Using default colors:', error.message);
    }
}

// Ejecutar al cargar el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSiteColors);
} else {
    loadSiteColors();
}

export { loadSiteColors };
