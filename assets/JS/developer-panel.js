/**
 * DEVELOPER PANEL - Gestión de Colores y Banners
 * 
 * Panel exclusivo para desarrolladores que permite:
 * - Modificar colores globales del sitio
 * - Gestionar imágenes de banners de marcas
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

    // Verificar estado de la API
    checkApiStatus();

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

    /**
     * Verificar estado de la API y Base de Datos
     */
    async function checkApiStatus() {
        const serverBadge = document.getElementById('server-badge');
        const serverDetails = document.getElementById('server-details');
        const serverCard = document.getElementById('server-status-card');

        const dbBadge = document.getElementById('db-badge');
        const dbDetails = document.getElementById('db-details');
        const dbCard = document.getElementById('db-status-card');

        const responseBadge = document.getElementById('response-badge');
        const responseDetails = document.getElementById('response-details');
        const responseCard = document.getElementById('response-status-card');

        const startTime = performance.now();

        try {
            const response = await fetch(`${API_BASE}/api/health`);
            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);

            if (!response.ok) throw new Error('Server error');

            const data = await response.json();

            // Actualizar Server Status
            serverCard.className = 'status-card success';
            serverBadge.className = 'status-badge success';
            serverBadge.innerHTML = '<i class="fa-solid fa-check-circle"></i> Online';
            serverDetails.innerHTML = `
                <p><strong>Estado:</strong> Online</p>
                <p><strong>Uptime:</strong> ${Math.floor(data.uptime / 60)} min</p>
                <p><strong>Env:</strong> ${data.environment}</p>
            `;

            // Actualizar DB Status
            if (data.database === 'connected') {
                dbCard.className = 'status-card success';
                dbBadge.className = 'status-badge success';
                dbBadge.innerHTML = '<i class="fa-solid fa-database"></i> Conectado';
                dbDetails.innerHTML = `
                    <p><strong>Estado:</strong> Conectado</p>
                    <p><strong>Motor:</strong> MongoDB</p>
                `;
            } else {
                throw new Error('Database disconnected');
            }

            // Actualizar Response Time
            responseCard.className = 'status-card success';
            responseBadge.className = 'status-badge success';
            responseBadge.innerHTML = '<i class="fa-solid fa-bolt"></i> Rápido';
            responseDetails.innerHTML = `
                <p><strong>Latencia:</strong> ${latency} ms</p>
                <p><strong>Última:</strong> ${new Date().toLocaleTimeString()}</p>
            `;

        } catch (error) {
            console.error('API Status Error:', error);

            // Error en Server
            serverCard.className = 'status-card error';
            serverBadge.className = 'status-badge error';
            serverBadge.innerHTML = '<i class="fa-solid fa-times-circle"></i> Offline';
            serverDetails.innerHTML = `
                <p><strong>Estado:</strong> Error de conexión</p>
                <p><strong>Error:</strong> ${error.message}</p>
            `;

            // Error en DB
            dbCard.className = 'status-card error';
            dbBadge.className = 'status-badge error';
            dbBadge.innerHTML = '<i class="fa-solid fa-database"></i> Error';
            dbDetails.innerHTML = `
                <p><strong>Estado:</strong> Desconectado</p>
                <p><strong>Check:</strong> Fallido</p>
            `;

            // Error en Response
            responseCard.className = 'status-card error';
            responseBadge.className = 'status-badge error';
            responseBadge.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Lento';
            responseDetails.innerHTML = `
                <p><strong>Latencia:</strong> Timeout</p>
                <p><strong>Estado:</strong> Sin respuesta</p>
            `;
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

    // ========== GESTIÓN DE METADATOS DEL SITIO ==========

    const metadataForm = document.getElementById('metadata-form');
    const faviconUpload = document.getElementById('favicon-upload');
    const currentFaviconImg = document.getElementById('current-favicon-img');

    // Cargar metadatos actuales
    if (metadataForm) {
        loadSiteMetadata();
        metadataForm.addEventListener('submit', handleMetadataSubmit);
    }

    /**
     * Cargar metadatos actuales del sitio
     */
    async function loadSiteMetadata() {
        try {
            const response = await fetch(`${API_BASE}/api/settings/siteMetadata`);
            const data = await handleApiResponse(response);

            if (data.value) {
                const metadata = data.value;

                // Cargar valores de cada página
                document.getElementById('index-title').value = metadata.index?.title || '';
                document.getElementById('index-h1').value = metadata.index?.h1 || '';
                document.getElementById('natura-title').value = metadata.natura?.title || '';
                document.getElementById('natura-h1').value = metadata.natura?.h1 || '';
                document.getElementById('avon-title').value = metadata.avon?.title || '';
                document.getElementById('avon-h1').value = metadata.avon?.h1 || '';
                document.getElementById('arbell-title').value = metadata.arbell?.title || '';
                document.getElementById('arbell-h1').value = metadata.arbell?.h1 || '';

                // Mostrar favicon actual
                if (metadata.favicon) {
                    currentFaviconImg.src = metadata.favicon;
                }
            }
        } catch (err) {
            console.error('Error loading site metadata:', err);
        }
    }

    /**
     * Guardar metadatos del sitio
     */
    async function handleMetadataSubmit(e) {
        e.preventDefault();

        try {
            let faviconPath = currentFaviconImg.src;

            // Si hay un nuevo favicon, subirlo primero
            if (faviconUpload.files.length > 0) {
                const formData = new FormData();
                formData.append('image', faviconUpload.files[0]);

                const uploadResponse = await fetch(`${API_BASE}/api/uploads`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const uploadData = await handleApiResponse(uploadResponse);
                faviconPath = uploadData.imagePath;
            }

            // Construir objeto de metadatos
            const metadata = {
                index: {
                    title: document.getElementById('index-title').value,
                    h1: document.getElementById('index-h1').value
                },
                natura: {
                    title: document.getElementById('natura-title').value,
                    h1: document.getElementById('natura-h1').value
                },
                avon: {
                    title: document.getElementById('avon-title').value,
                    h1: document.getElementById('avon-h1').value
                },
                arbell: {
                    title: document.getElementById('arbell-title').value,
                    h1: document.getElementById('arbell-h1').value
                },
                favicon: faviconPath
            };

            // Guardar metadatos
            const response = await fetch(`${API_BASE}/api/settings/siteMetadata`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ value: metadata })
            });

            await handleApiResponse(response);

            alert('✅ Metadatos actualizados exitosamente. Los cambios se aplicarán en las páginas.');

            // Recargar metadatos
            loadSiteMetadata();
        } catch (err) {
            console.error('Error saving metadata:', err);
            alert(`❌ Error al guardar metadatos: ${err.message}`);
        }
    }
});
