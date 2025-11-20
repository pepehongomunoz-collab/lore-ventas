/**
 * UTILIDADES COMPARTIDAS
 * 
 * Este archivo centraliza funciones que se usan en múltiples lugares de la aplicación.
 * Beneficios:
 * - Evita duplicación de código
 * - Facilita el mantenimiento (cambiar en un solo lugar)
 * - Reduce bugs por inconsistencias
 */

/**
 * Obtiene la URL base de la API
 * 
 * EXPLICACIÓN:
 * Cuando la app se sirve desde http://localhost:3000, usamos esa URL.
 * Cuando se abre como archivo local (file://), usamos http://localhost:3000 como fallback.
 * 
 * @returns {string} URL base de la API (ej: "http://localhost:3000")
 */
export function getApiBase() {
    return (location.protocol === 'http:' || location.protocol === 'https:')
        ? `${location.protocol}//${location.host}`
        : 'http://localhost:3000';
}

/**
 * Maneja la respuesta de una petición fetch
 * 
 * EXPLICACIÓN:
 * Esta función centraliza el manejo de errores de las respuestas HTTP.
 * - Si la respuesta es OK (status 200-299), devuelve el JSON
 * - Si hay error, intenta parsear el mensaje de error del servidor
 * - Si no puede parsear, devuelve un error genérico con el código de estado
 * 
 * ANTES: Este código estaba duplicado en auth.js (2 veces)
 * AHORA: Una sola función reutilizable
 * 
 * @param {Response} response - Objeto Response de fetch
 * @returns {Promise<Object>} Datos parseados como JSON
 * @throws {Error} Si la respuesta no es OK
 */
export async function handleApiResponse(response) {
    if (!response.ok) {
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            throw new Error(data.message || 'Error en la petición');
        } catch (e) {
            // Si el error ya tiene un mensaje personalizado, lo mantenemos
            if (e.message && !e.message.includes('Unexpected')) {
                throw e;
            }
            // Si no, creamos un error genérico con el código de estado
            throw new Error(`Error del servidor: ${response.status}`);
        }
    }
    return response.json();
}

/**
 * Redirige a la página de inicio
 * 
 * EXPLICACIÓN:
 * La lógica de redirección varía según cómo se esté sirviendo la app:
 * - Si es http(s): usamos rutas absolutas desde la raíz (/)
 * - Si es file://: usamos rutas relativas (../ o ./)
 * 
 * ANTES: Este código estaba duplicado en auth.js (2 veces)
 * AHORA: Una sola función reutilizable
 */
export function redirectToHome() {
    if (location.protocol === 'http:' || location.protocol === 'https:') {
        // Servidor web: usar ruta absoluta
        window.location.href = '/index.html';
    } else {
        // Archivo local: calcular ruta relativa
        if (location.pathname.includes('/pages/') || location.pathname.includes('\\pages\\')) {
            // Estamos en pages/, subir un nivel
            window.location.href = '../index.html';
        } else {
            // Estamos en la raíz
            window.location.href = './index.html';
        }
    }
}

/**
 * Genera la ruta correcta a una página
 * 
 * EXPLICACIÓN:
 * Calcula la ruta relativa o absoluta a una página según:
 * - Dónde estamos actualmente (raíz o /pages/)
 * - Cómo se está sirviendo la app (http vs file)
 * 
 * ANTES: Teníamos getLoginHref() y getProfileHref() separadas en userMenu.js
 * AHORA: Una función genérica que funciona para cualquier página
 * 
 * @param {string} pageName - Nombre de la página (ej: 'login.html', 'profile.html')
 * @returns {string} Ruta a la página
 */
export function getPageHref(pageName) {
    // Si es http(s), usar ruta absoluta desde la raíz
    if (location.protocol === 'http:' || location.protocol === 'https:') {
        return `/pages/${pageName}`;
    }

    // Si es file://, calcular ruta relativa
    if (location.pathname.includes('/pages/') || location.pathname.includes('\\pages\\')) {
        // Ya estamos en /pages/, usar ruta relativa simple
        return `./${pageName}`;
    }

    // Estamos en la raíz, ir a /pages/
    return `./pages/${pageName}`;
}

/**
 * Guarda los datos de autenticación en localStorage
 * 
 * EXPLICACIÓN:
 * Centraliza el guardado de token y datos de usuario.
 * Esto asegura que siempre se guarden de la misma manera.
 * 
 * @param {string} token - JWT token
 * @param {Object} user - Datos del usuario
 */
export function saveAuthData(token, user) {
    localStorage.setItem('token', token);
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    }
}

/**
 * Limpia los datos de autenticación
 * 
 * EXPLICACIÓN:
 * Centraliza la limpieza de datos al cerrar sesión.
 */
export function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

/**
 * Obtiene el token de autenticación
 * 
 * @returns {string|null} Token o null si no existe
 */
export function getAuthToken() {
    return localStorage.getItem('token');
}

/**
 * Obtiene los datos del usuario
 * 
 * @returns {Object|null} Datos del usuario o null si no existen
 */
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
