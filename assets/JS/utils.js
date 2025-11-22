/**
 * UTILIDADES COMPARTIDAS - CON ROLES
 * 
 * Este archivo centraliza funciones que se usan en múltiples lugares de la aplicación.
 */

// ========== API Y RESPUESTAS ==========

// Constante para la base de la API
export const API_BASE = (location.protocol === 'http:' || location.protocol === 'https:')
    ? `${location.protocol}//${location.host}`
    : 'http://localhost:3000';

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
        window.location.href = '/index.html';
    } else {
        if (location.pathname.includes('/pages/') || location.pathname.includes('\\pages\\')) {
            window.location.href = '../index.html';
        } else {
            window.location.href = './index.html';
        }
    }
}

export function getPageHref(pageName) {
    if (location.protocol === 'http:' || location.protocol === 'https:') {
        return `/pages/${pageName}`;
    }

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
