/**
 * UTILIDADES COMPARTIDAS - CON ROLES
 * 
 * Este archivo centraliza funciones que se usan en múltiples lugares de la aplicación.
 */

// ========== API Y RESPUESTAS ==========

// Constante para la base de la API
// Si estamos en producción (GitHub Pages), usamos el backend de Render
// Si estamos en desarrollo local, usamos localhost
export const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://lore-ventas-api.onrender.com';

export function getApiBase() {
    return API_BASE;
}

export async function handleApiResponse(response) {
    if (!response.ok) {
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            throw new Error(data.message || 'Error en la petición');
        } catch (e) {
            if (e.message && !e.message.includes('Unexpected')) {
                throw e;
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }
    }
    return response.json();
}

// ========== NAVEGACIÓN ==========

export function redirectToHome() {
    if (location.protocol === 'http:' || location.protocol === 'https:') {
        const currentPath = location.pathname;

        // Si estamos en /pages/, volver a la raíz
        if (currentPath.includes('/pages/')) {
            // Si estamos en GitHub Pages
            if (location.hostname.includes('github.io')) {
                const pathSegments = currentPath.split('/').filter(Boolean);
                const repoName = pathSegments.length > 0 && pathSegments[0] !== 'pages'
                    ? pathSegments[0]
                    : '';

                window.location.href = repoName ? `/${repoName}/index.html` : '/index.html';
            } else {
                // Localhost - volver a raíz
                window.location.href = '/index.html';
            }
        } else {
            // Ya estamos en la raíz o en otra ubicación
            window.location.href = '/index.html';
        }
    } else {
        // Para archivos locales (file://)
        if (location.pathname.includes('/pages/') || location.pathname.includes('\\pages\\')) {
            window.location.href = '../index.html';
        } else {
            window.location.href = './index.html';
        }
    }
}

export function getPageHref(pageName) {
    // Si estamos en un servidor web (GitHub Pages o servidor local)
    if (location.protocol === 'http:' || location.protocol === 'https:') {
        const currentPath = location.pathname;

        // Si ya estamos en /pages/, usar ruta relativa
        if (currentPath.includes('/pages/')) {
            return `./${pageName}`;
        }

        // Si estamos en GitHub Pages (detectar por dominio)
        if (location.hostname.includes('github.io')) {
            const pathSegments = currentPath.split('/').filter(Boolean);
            const repoName = pathSegments.length > 0 && !pathSegments[0].endsWith('.html')
                ? pathSegments[0]
                : '';

            return repoName ? `/${repoName}/pages/${pageName}` : `/pages/${pageName}`;
        }

        // Localhost u otro servidor - desde raíz
        return `/pages/${pageName}`;
    }

    // Para archivos locales (file://)
    if (location.pathname.includes('/pages/') || location.pathname.includes('\\pages\\')) {
        return `./${pageName}`;
    }

    return `./pages/${pageName}`;
}

// ========== AUTENTICACIÓN ==========

export function saveAuthData(token, user) {
    localStorage.setItem('token', token);
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    }
}

export function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

export function getAuthToken() {
    return localStorage.getItem('token');
}

export function getUserData() {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;

    try {
        return JSON.parse(userJson);
    } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
    }
}

// ========== ROLES (NUEVO) ==========

/**
 * Obtiene el rol del usuario actual
 */
export function getUserRole() {
    const user = getUserData();
    return user ? user.role : null;
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(role) {
    const userRole = getUserRole();
    return userRole === role;
}

/**
 * Verifica si es administrador
 */
export function isAdmin() {
    return hasRole('admin');
}

/**
 * Verifica si es desarrollador
 */
export function isDeveloper() {
    return hasRole('developer');
}

/**
 * Verifica si es admin o developer
 */
export function isAdminOrDeveloper() {
    const role = getUserRole();
    return role === 'admin' || role === 'developer';
}

/**
 * Obtiene el nombre legible del rol
 */
export function getRoleName(role) {
    const roleNames = {
        'user': 'Usuario',
        'admin': 'Administrador',
        'developer': 'Desarrollador'
    };
    return roleNames[role] || 'Desconocido';
}

/**
 * Obtiene la clase CSS para el badge del rol
 */
export function getRoleBadgeClass(role) {
    const badgeClasses = {
        'user': 'role-badge role-user',
        'admin': 'role-badge role-admin',
        'developer': 'role-badge role-developer'
    };
    return badgeClasses[role] || 'role-badge';
}
