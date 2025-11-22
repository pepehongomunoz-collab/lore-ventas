// Password Change Module for Profile Page
// Instructions: Add this script to profile.html and include the HTML elements below

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://lore-ventas-api.onrender.com';

    const token = localStorage.getItem('token');

    const togglePasswordBtn = document.getElementById('toggle-password-change');
    const passwordChangeSection = document.getElementById('password-change-section');
    const passwordChangeForm = document.getElementById('password-change-form');
    const cancelPasswordBtn = document.getElementById('cancel-password-change');

    // Toggle mostrar/ocultar formulario
    if (togglePasswordBtn && passwordChangeSection) {
        togglePasswordBtn.addEventListener('click', () => {
            const isHidden = passwordChangeSection.style.display === 'none';
            passwordChangeSection.style.display = isHidden ? 'block' : 'none';

            if (isHidden && passwordChangeForm) {
                passwordChangeForm.reset();
            }
        });
    }

    // Cancelar
    if (cancelPasswordBtn && passwordChangeSection) {
        cancelPasswordBtn.addEventListener('click', () => {
            passwordChangeSection.style.display = 'none';
            if (passwordChangeForm) {
                passwordChangeForm.reset();
            }
        });
    }

    // Manejar envío
    if (passwordChangeForm) {
        passwordChangeForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                alert('❌ Las contraseñas nuevas no coinciden');
                return;
            }

            if (newPassword.length < 6) {
                alert('❌ La contraseña debe tener al menos 6 caracteres');
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/api/auth/change-password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                });

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

                const data = await response.json();
                alert('✅ ' + (data.message || 'Contraseña actualizada exitosamente'));

                passwordChangeForm.reset();
                passwordChangeSection.style.display = 'none';

            } catch (error) {
                console.error('Error changing password:', error);
                alert('❌ Error: ' + error.message);
            }
        });
    }
});
