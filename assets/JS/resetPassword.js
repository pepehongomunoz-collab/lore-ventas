/**
 * RESET PASSWORD PAGE - Password Recovery
 * 
 * Handles the password reset form after user clicks the email link
 */

import { API_BASE, getPageHref } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reset-password-form');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // Extraer token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Si no hay token, mostrar error y redirigir
    if (!token) {
        alert('❌ Enlace de recuperación inválido. Por favor, solicita un nuevo enlace.');
        window.location.href = getPageHref('login.html');
        return;
    }

    // Manejar envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            alert('❌ Las contraseñas no coinciden');
            confirmPasswordInput.focus();
            return;
        }

        // Validar longitud mínima
        if (newPassword.length < 6) {
            alert('❌ La contraseña debe tener al menos 6 caracteres');
            newPasswordInput.focus();
            return;
        }

        try {
            // Deshabilitar botón durante la petición
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

            const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al resetear contraseña');
            }

            // Éxito
            alert('✅ ' + data.message);

            // Redirigir a login
            window.location.href = getPageHref('login.html');

        } catch (error) {
            console.error('Error resetting password:', error);
            alert('❌ Error: ' + error.message);

            // Re-habilitar botón
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Restablecer conraseña';
        }
    });
});
