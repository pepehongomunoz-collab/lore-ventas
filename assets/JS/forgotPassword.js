// assets/JS/forgotPassword.js
// Handles the "Forgot Password" form submission.
// Sends a POST request to the backend endpoint /api/auth/forgot-password.
// Shows a simple alert with the server response.

import { API_BASE } from './utils.js'; // Assuming utils defines base URL, adjust if needed.

const form = document.getElementById('forgot-password-form');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('email');
        const email = emailInput.value.trim();
        if (!email) {
            alert('Por favor, ingrese su email.');
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            alert(data.message || 'Se ha enviado el enlace de recuperación si el email está registrado.');
            // Optionally redirect to login page
            // window.location.href = './login.html';
        } catch (err) {
            console.error(err);
            alert('Error al enviar la solicitud. Intente nuevamente más tarde.');
        }
    });
}
