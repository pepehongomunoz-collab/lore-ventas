/**
 * PERFIL DE USUARIO - REFACTORIZADO
 * 
 * CAMBIOS PRINCIPALES:
 * 1. Usamos funciones de utils.js para consistencia
 * 2. Código más limpio y organizado
 * 3. Mejor manejo de errores
 */

import {
    getApiBase,
    handleApiResponse,
    getAuthToken,
    getUserData,
    saveAuthData,
    getPageHref,
    clearAuthData,
    getRoleName,          // NUEVO: Para nombre del rol
    getRoleBadgeClass     // NUEVO: Para clase CSS del badge
} from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // ANTES: const API_BASE = (location.protocol === 'http:' || location.protocol === 'https:')...
    // AHORA: Función centralizada
    const API_BASE = getApiBase();

    // ANTES: const token = localStorage.getItem('token');
    // AHORA: Función centralizada
    const token = getAuthToken();

    if (!token) {
        // Redirigir a login si no hay token
        window.location.href = getPageHref('login.html');
        return;
    }

    let currentUser = null;

    // Elementos del DOM
    const viewMode = document.getElementById('view-mode');
    const editMode = document.getElementById('edit-mode');
    const editBtn = document.getElementById('edit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const profileForm = document.getElementById('profile-form');

    // ANTES: const userJson = localStorage.getItem('user'); try { ... } catch
    // AHORA: Función que maneja errores automáticamente
    currentUser = getUserData();
    if (currentUser) {
        displayUserInfo(currentUser);
    }

    // Obtener datos frescos del servidor
    fetchUserData();

    // Event listeners
    editBtn.addEventListener('click', () => {
        enterEditMode();
    });

    cancelBtn.addEventListener('click', () => {
        exitEditMode();
    });

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProfile();
    });

    /**
     * OBTENER DATOS DEL USUARIO DESDE EL SERVIDOR
     * 
     * OPTIMIZACIÓN:
     * - Usamos handleApiResponse() para manejar errores consistentemente
     * - Usamos saveAuthData() para guardar datos
     */
    async function fetchUserData() {
        try {
            const response = await fetch(`${API_BASE}/api/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // ANTES: Código duplicado de manejo de respuesta
            // AHORA: Función centralizada
            const data = await handleApiResponse(response);

            if (data && data.user) {
                currentUser = data.user;
                // ANTES: localStorage.setItem('user', JSON.stringify(data.user));
                // AHORA: Función centralizada (saveAuthData maneja el token también)
                saveAuthData(token, data.user);
                displayUserInfo(data.user);
            }
        } catch (err) {
            console.error('Error fetching user data:', err);

            // Si el token expiró, limpiar y redirigir
            if (err.message.includes('401') || err.message.includes('Invalid token')) {
                clearAuthData();
                window.location.href = getPageHref('login.html');
            }
        }
    }

    /**
     * MOSTRAR INFORMACIÓN DEL USUARIO
     * ACTUALIZADO: Incluye rol con badge visual
     */
    function displayUserInfo(user) {
        document.getElementById('view-name').textContent = user.name || 'No especificado';
        document.getElementById('view-email').textContent = user.email || 'No especificado';
        document.getElementById('view-phone').textContent = user.phone || 'No especificado';
        document.getElementById('view-id').textContent = user.id || user._id || 'No disponible';

        // NUEVO: Mostrar rol con badge
        const roleElement = document.getElementById('view-role');
        if (roleElement && user.role) {
            const roleName = getRoleName(user.role);
            const badgeClass = getRoleBadgeClass(user.role);
            roleElement.innerHTML = `${roleName} <span class="${badgeClass}">${roleName.toUpperCase()}</span>`;
        }

        // Formatear dirección
        if (user.address && (user.address.street || user.address.city)) {
            const parts = [];
            if (user.address.street) parts.push(user.address.street);
            if (user.address.number) parts.push(user.address.number);
            if (user.address.city) parts.push(user.address.city);
            if (user.address.postalCode) parts.push(`CP: ${user.address.postalCode}`);
            document.getElementById('view-address').textContent = parts.join(', ');
        } else {
            document.getElementById('view-address').textContent = 'No especificada';
        }

        // Formatear fecha
        if (user.createdAt) {
            const date = new Date(user.createdAt);
            document.getElementById('view-created').textContent = date.toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            document.getElementById('view-created').textContent = 'No disponible';
        }
    }

    /**
     * ENTRAR EN MODO EDICIÓN
     */
    function enterEditMode() {
        // Llenar formulario con datos actuales
        document.getElementById('edit-name').value = currentUser.name || '';
        document.getElementById('edit-email').value = currentUser.email || '';
        document.getElementById('edit-phone').value = currentUser.phone || '';

        if (currentUser.address) {
            document.getElementById('edit-street').value = currentUser.address.street || '';
            document.getElementById('edit-number').value = currentUser.address.number || '';
            document.getElementById('edit-city').value = currentUser.address.city || '';
            document.getElementById('edit-postal').value = currentUser.address.postalCode || '';
        }

        // Cambiar a modo edición
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
    }

    /**
     * SALIR DEL MODO EDICIÓN
     */
    function exitEditMode() {
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
    }

    /**
     * GUARDAR PERFIL
     * 
     * OPTIMIZACIÓN:
     * - Usamos handleApiResponse() para consistencia
     * - Usamos saveAuthData() para guardar
     */
    async function saveProfile() {
        const name = document.getElementById('edit-name').value.trim();
        const phone = document.getElementById('edit-phone').value.trim();
        const street = document.getElementById('edit-street').value.trim();
        const number = document.getElementById('edit-number').value.trim();
        const city = document.getElementById('edit-city').value.trim();
        const postalCode = document.getElementById('edit-postal').value.trim();

        const updateData = {
            name: name || undefined,
            phone: phone || undefined,
            address: {
                street: street || undefined,
                number: number || undefined,
                city: city || undefined,
                postalCode: postalCode || undefined
            }
        };

        try {
            const response = await fetch(`${API_BASE}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            // ANTES: Código duplicado de manejo de respuesta
            // AHORA: Función centralizada
            const data = await handleApiResponse(response);

            if (data.user) {
                currentUser = data.user;
                // ANTES: localStorage.setItem('user', JSON.stringify(data.user));
                // AHORA: Función centralizada
                saveAuthData(token, data.user);

                displayUserInfo(data.user);
                exitEditMode();
                alert('✅ Perfil actualizado exitosamente');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('❌ Error al guardar: ' + error.message);
        }
    }
});

/**
 * RESUMEN DE MEJORAS:
 * 
 * ANTES:
 * - Código duplicado de manejo de API
 * - Lógica de localStorage repetida
 * - Inconsistente con otros archivos
 * 
 * AHORA:
 * - Usa funciones compartidas de utils.js
 * - Consistente con auth.js y userMenu.js
 * - Más fácil de mantener
 * - Mejor manejo de errores
 */
