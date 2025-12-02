/**
 * DEVELOPER PANEL - Gestión Completa del Sitio
 * 
 * Panel exclusivo para desarrolladores que permite:
 * - Modificar colores globales del sitio
 * - Gestionar imágenes de banners de marcas
 * - Monitorear estado de la API en tiempo real
 * - Ejecutar scripts de testing
 */

import {
    getApiBase,
    handleApiResponse,
    getAuthToken,
    isDeveloper,
    getPageHref,
    clearAuthData
} from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = getApiBase();
    const token = getAuthToken();

    // Verificar autenticación y permisos
    if (!token) {
        window.location.href = getPageHref('login.html');
        return;
    }

    if (!isDeveloper()) {
        alert('❌ Acceso denegado. Solo desarrolladores pueden acceder a esta página.');
        window.location.href = '../index.html';
        return;
    }

    // ========== SIDEBAR TOGGLE (MOBILE) ==========
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('dev-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (sidebarToggle && sidebar && sidebarOverlay) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // ========== API STATUS MONITORING ==========
    let apiCheckInterval;

    async function checkApiStatus() {
        const startTime = Date.now();

        try {
            // Check server status
            const serverResponse = await fetch(`${API_BASE}/api/health`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const responseTime = Date.now() - startTime;
            const serverData = await serverResponse.json();

            // Update Server Status
            updateStatusCard('server', serverResponse.ok, {
                status: serverResponse.ok ? 'Online' : 'Offline',
                lastCheck: new Date().toLocaleTimeString('es-AR')
            });

            // Update Database Status
            updateStatusCard('db', serverData.database === 'connected', {
                status: serverData.database === 'connected' ? 'Conectada' : 'Desconectada',
                lastCheck: new Date().toLocaleTimeString('es-AR')
            });

            // Update Response Time
            updateStatusCard('response', responseTime < 1000, {
                latency: `${responseTime} ms`,
                lastCheck: new Date().toLocaleTimeString('es-AR')
            });

        } catch (error) {
            console.error('Error checking API status:', error);

            // Mark all as offline
            updateStatusCard('server', false, {
                status: 'Error de conexión',
                lastCheck: new Date().toLocaleTimeString('es-AR')
            });
            updateStatusCard('db', false, {
                status: 'No disponible',
                lastCheck: new Date().toLocaleTimeString('es-AR')
            });
            updateStatusCard('response', false, {
                latency: 'N/A',
                lastCheck: new Date().toLocaleTimeString('es-AR')
            });
        }
    }

    function updateStatusCard(type, isOnline, details) {
        const card = document.getElementById(`${type}-status-card`);
        const badge = document.getElementById(`${type}-badge`);
        const detailsDiv = document.getElementById(`${type}-details`);

        if (!card || !badge || !detailsDiv) return;

        // Update card class
        card.className = `status-card ${isOnline ? 'online' : 'offline'}`;

        // Update badge
        badge.className = `status-badge ${isOnline ? 'online' : 'offline'}`;
        badge.innerHTML = isOnline
            ? '<i class="fa-solid fa-circle-check"></i> Online'
            : '<i class="fa-solid fa-circle-xmark"></i> Offline';

        // Update details
        if (type === 'server') {
            detailsDiv.innerHTML = `
                <p><strong>Estado:</strong> ${details.status}</p>
                <p><strong>Última verificación:</strong> ${details.lastCheck}</p>
            `;
        } else if (type === 'db') {
            detailsDiv.innerHTML = `
                <p><strong>Estado:</strong> ${details.status}</p>
                <p><strong>Última verificación:</strong> ${details.lastCheck}</p>
            `;
        } else if (type === 'response') {
            detailsDiv.innerHTML = `
                <p><strong>Latencia:</strong> ${details.latency}</p>
                <p><strong>Última medición:</strong> ${details.lastCheck}</p>
            `;
        }
    }

    // Initial check and set interval
    checkApiStatus();
    apiCheckInterval = setInterval(checkApiStatus, 30000); // Check every 30 seconds

    // ========== TESTING SCRIPTS ==========
    const testAuthBtn = document.getElementById('test-auth-btn');
    const testDbBtn = document.getElementById('test-db-btn');
    const createTestOrderBtn = document.getElementById('create-test-order-btn');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const testResult = document.getElementById('test-result');

    // Test Authentication
    if (testAuthBtn) {
        testAuthBtn.addEventListener('click', async () => {
            await runTest('auth', async () => {
                const response = await fetch(`${API_BASE}/api/auth/verify`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await handleApiResponse(response);
                return {
                    success: true,
                    message: `✅ Autenticación válida. Usuario: ${data.user.email}`
                };
            });
        });
    }

    // Test Database
    if (testDbBtn) {
        testDbBtn.addEventListener('click', async () => {
            await runTest('database', async () => {
                const response = await fetch(`${API_BASE}/api/health`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await handleApiResponse(response);
                return {
                    success: data.database === 'connected',
                    message: data.database === 'connected'
                        ? '✅ Base de datos conectada correctamente'
                        : '❌ Error de conexión a la base de datos'
                };
            });
        });
    }

    // Create Test Order
    if (createTestOrderBtn) {
        createTestOrderBtn.addEventListener('click', async () => {
            await runTest('test-order', async () => {
                const response = await fetch(`${API_BASE}/api/payments/create-test-order`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ items: [] })
                });
                const data = await handleApiResponse(response);
                return {
                    success: true,
                    message: `✅ Pedido de prueba creado. ID: ${data.transaction.transactionId}`
                };
            });
        });
    }

    // Clear Cart
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', async () => {
            await runTest('clear-cart', async () => {
                localStorage.removeItem('cart');
                return {
                    success: true,
                    message: '✅ Carrito limpiado correctamente'
                };
            });
        });
    }

    async function runTest(testName, testFunction) {
        const btn = event.target.closest('.test-btn');
        const originalContent = btn.innerHTML;

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ejecutando...';
            testResult.style.display = 'none';

            const result = await testFunction();

            testResult.className = `test-result ${result.success ? 'success' : 'error'}`;
            testResult.innerHTML = result.message;
            testResult.style.display = 'block';

        } catch (error) {
            console.error(`Error in test ${testName}:`, error);
            testResult.className = 'test-result error';
            testResult.innerHTML = `❌ Error: ${error.message}`;
            testResult.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }

    // ========== GESTIÓN DE COLORES ==========

    const colorForm = document.getElementById('color-form');
    const primaryColorInput = document.getElementById('primary-color');
    const primaryHoverInput = document.getElementById('primary-hover');
    const bodyBgInput = document.getElementById('body-bg');
    const headerGradientStartInput = document.getElementById('header-gradient-start');
    const headerGradientEndInput = document.getElementById('header-gradient-end');
    const footerBgInput = document.getElementById('footer-bg');
    const resetColorsBtn = document.getElementById('reset-colors-btn');

    // Cargar colores actuales
    loadCurrentColors();

    // Event listeners para colores
    colorForm.addEventListener('submit', handleColorSubmit);
    resetColorsBtn.addEventListener('click', handleResetColors);

    /**
     * Cargar colores actuales desde el backend
     */
    async function loadCurrentColors() {
        try {
            const response = await fetch(`${API_BASE}/api/settings/siteColors`);
            const data = await handleApiResponse(response);

            if (data.value) {
                const colors = data.value;
                primaryColorInput.value = colors.primaryColor || '#f5a938';
                primaryHoverInput.value = colors.primaryHover || '#e08c1b';
                bodyBgInput.value = rgbaToHex(colors.bodyBg) || '#f8f9fb';
                headerGradientStartInput.value = colors.headerGradientStart || '#eec17e';
                headerGradientEndInput.value = colors.headerGradientEnd || '#f8f9fb';

                // Para footer que usa rgba, convertir a hex para el input
                footerBgInput.value = rgbaToHex(colors.footerBg) || '#ddb28a';
            }
        } catch (err) {
            console.error('Error loading colors:', err);
        }
    }

    /**
     * Guardar colores personalizados
     */
    async function handleColorSubmit(e) {
        e.preventDefault();

        try {
            const colors = {
                primaryColor: primaryColorInput.value,
                primaryHover: primaryHoverInput.value,
                bodyBg: bodyBgInput.value,
                headerGradientStart: headerGradientStartInput.value,
                headerGradientEnd: headerGradientEndInput.value,
                footerBg: hexToRgba(footerBgInput.value, 0.36),
                accentBg: hexToRgba(footerBgInput.value, 0.36)
            };

            const response = await fetch(`${API_BASE}/api/settings/siteColors`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ value: colors })
            });

            const data = await handleApiResponse(response);

            alert('✅ Colores actualizados exitosamente. Recarga la página para ver los cambios.');

            // Recargar la página para aplicar los nuevos colores
            setTimeout(() => location.reload(), 1000);
        } catch (err) {
            console.error('Error saving colors:', err);
            alert(`❌ Error al guardar colores: ${err.message}`);
        }
    }

    /**
     * Restaurar colores por defecto
     */
    async function handleResetColors() {
        if (!confirm('¿Estás seguro de restaurar los colores por defecto?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/settings/reset/siteColors`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await handleApiResponse(response);

            alert('✅ Colores restaurados a valores por defecto');
            location.reload();
        } catch (err) {
            console.error('Error resetting colors:', err);
            alert(`❌ Error al restaurar colores: ${err.message}`);
        }
    }

    // ========== GESTIÓN DE BANNERS ==========

    const bannerForm = document.getElementById('banner-form');
    const brandSelect = document.getElementById('banner-brand');
    const bannerImageInput = document.getElementById('banner-image');
    const currentBannerPreview = document.getElementById('current-banner-preview');
    const newBannerPreview = document.getElementById('new-banner-preview');
    const newPreviewImg = document.getElementById('new-preview-img');

    // Cargar banner actual al seleccionar marca
    brandSelect.addEventListener('change', loadCurrentBanner);
    bannerImageInput.addEventListener('change', handleBannerPreview);
    bannerForm.addEventListener('submit', handleBannerSubmit);

    // Cargar banner inicial
    loadCurrentBanner();

    /**
     * Cargar banner actual de la marca seleccionada
     */
    async function loadCurrentBanner() {
        const brand = brandSelect.value;
        if (!brand) {
            currentBannerPreview.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/settings/banners`);
            const data = await handleApiResponse(response);

            if (data.value && data.value[brand]) {
                const bannerPath = data.value[brand];
                document.getElementById('current-banner-img').src = bannerPath;
                currentBannerPreview.style.display = 'block';
            }
        } catch (err) {
            console.error('Error loading banner:', err);
        }
    }

    /**
     * Preview de nueva imagen seleccionada
     */
    function handleBannerPreview(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                newPreviewImg.src = event.target.result;
                newBannerPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            newBannerPreview.style.display = 'none';
        }
    }

    /**
     * Subir y actualizar banner
     */
    async function handleBannerSubmit(e) {
        e.preventDefault();

        const brand = brandSelect.value;
        const file = bannerImageInput.files[0];

        if (!brand || !file) {
            alert('❌ Debes seleccionar una marca y una imagen');
            return;
        }

        try {
            // 1. Subir la imagen
            const formData = new FormData();
            formData.append('image', file);

            const uploadResponse = await fetch(`${API_BASE}/api/uploads`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const uploadData = await handleApiResponse(uploadResponse);
            const imagePath = uploadData.imagePath;

            // 2. Obtener banners actuales
            const getBannersResponse = await fetch(`${API_BASE}/api/settings/banners`);
            const bannersData = await handleApiResponse(getBannersResponse);

            // 3. Actualizar el banner de la marca seleccionada
            const updatedBanners = {
                ...bannersData.value,
                [brand]: imagePath
            };

            const updateResponse = await fetch(`${API_BASE}/api/settings/banners`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ value: updatedBanners })
            });

            await handleApiResponse(updateResponse);

            alert(`✅ Banner de ${brand.toUpperCase()} actualizado exitosamente`);

            // Limpiar formulario y recargar preview
            bannerForm.reset();
            newBannerPreview.style.display = 'none';
            loadCurrentBanner();
        } catch (err) {
            console.error('Error uploading banner:', err);
            alert(`❌ Error al subir banner: ${err.message}`);
        }
    }

    // ========== UTILIDADES ==========

    /**
     * Convertir hex a rgba
     */
    function hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Convertir rgba a hex (aproximado)
     */
    function rgbaToHex(rgba) {
        if (!rgba || !rgba.startsWith('rgba')) {
            return rgba; // Si no es rgba, devolver tal cual
        }

        const values = rgba.match(/\d+/g);
        if (!values || values.length < 3) return rgba;

        const r = parseInt(values[0]).toString(16).padStart(2, '0');
        const g = parseInt(values[1]).toString(16).padStart(2, '0');
        const b = parseInt(values[2]).toString(16).padStart(2, '0');

        return `#${r}${g}${b}`;
    }
});
