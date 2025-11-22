/**
 * REGISTER.JS - Registration Logic
 */

import {
    getApiBase,
    handleApiResponse,
    redirectToHome,
    saveAuthData
} from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const API_BASE = getApiBase();

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = form.querySelector('button[type="submit"]');

            if (!email || !password) {
                return alert('Email y contraseña requeridos');
            }

            try {
                // Disable button to prevent double submit
                submitBtn.disabled = true;
                submitBtn.textContent = 'Registrando...';

                // Hacer la petición
                const response = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await handleApiResponse(response);

                if (data.token) {
                    saveAuthData(data.token, data.user);
                    alert('¡Registro exitoso! Bienvenido.');
                    redirectToHome();
                } else {
                    console.error('Registro falló:', data);
                    alert(data.message || 'Error en registro');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Registrarse';
                }
            } catch (err) {
                console.error('Error de registro:', err);
                alert('Error: ' + err.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Registrarse';
            }
        });
    }
});
