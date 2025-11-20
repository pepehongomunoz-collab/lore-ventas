document.addEventListener('DOMContentLoaded', () => {
    // Determine API base URL
    const API_BASE = (location.protocol === 'http:' || location.protocol === 'https:')
        ? `${location.protocol}//${location.host}`
        : 'http://localhost:3000';

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect to login if not authenticated
        window.location.href = './login.html';
        return;
    }

    let currentUser = null;

    // Get elements
    const viewMode = document.getElementById('view-mode');
    const editMode = document.getElementById('edit-mode');
    const editBtn = document.getElementById('edit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const profileForm = document.getElementById('profile-form');

    // Get user data from localStorage first (for immediate display)
    const userJson = localStorage.getItem('user');
    if (userJson) {
        try {
            currentUser = JSON.parse(userJson);
            displayUserInfo(currentUser);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }

    // Fetch fresh user data from the server
    fetchUserData();

    // Edit button click
    editBtn.addEventListener('click', () => {
        enterEditMode();
    });

    // Cancel button click
    cancelBtn.addEventListener('click', () => {
        exitEditMode();
    });

    // Form submit
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProfile();
    });

    function fetchUserData() {
        fetch(`${API_BASE}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(async r => {
                if (!r.ok) {
                    if (r.status === 401) {
                        // Token expired or invalid
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = './login.html';
                        return;
                    }
                    throw new Error(`Error del servidor: ${r.status}`);
                }
                return r.json();
            })
            .then(data => {
                if (data && data.user) {
                    currentUser = data.user;
                    // Update localStorage with fresh data
                    localStorage.setItem('user', JSON.stringify(data.user));
                    displayUserInfo(data.user);
                }
            })
            .catch(err => {
                console.error('Error fetching user data:', err);
                // Keep showing cached data if fetch fails
            });
    }

    function displayUserInfo(user) {
        // View mode
        document.getElementById('view-name').textContent = user.name || 'No especificado';
        document.getElementById('view-email').textContent = user.email || 'No especificado';
        document.getElementById('view-phone').textContent = user.phone || 'No especificado';
        document.getElementById('view-id').textContent = user.id || user._id || 'No disponible';

        // Format address
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

        // Format creation date
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

    function enterEditMode() {
        // Populate edit form with current data
        document.getElementById('edit-name').value = currentUser.name || '';
        document.getElementById('edit-email').value = currentUser.email || '';
        document.getElementById('edit-phone').value = currentUser.phone || '';

        if (currentUser.address) {
            document.getElementById('edit-street').value = currentUser.address.street || '';
            document.getElementById('edit-number').value = currentUser.address.number || '';
            document.getElementById('edit-city').value = currentUser.address.city || '';
            document.getElementById('edit-postal').value = currentUser.address.postalCode || '';
        }

        // Toggle modes
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
    }

    function exitEditMode() {
        // Toggle modes
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
    }

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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar perfil');
            }

            const data = await response.json();

            if (data.user) {
                currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
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
