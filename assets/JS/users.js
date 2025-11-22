/**
 * USERS.JS - User Management Module
 * 
 * Handles user management functionality for admins and developers
 */

import { API_BASE, getAuthToken, getUserData, isAdminOrDeveloper, redirectToHome, getRoleName, getRoleBadgeClass } from './utils.js';

let currentUser = null;

/**
 * Initialize users page
 */
export async function initUsersPage() {
    // Verify user is admin or developer
    currentUser = getUserData();

    if (!currentUser || !isAdminOrDeveloper()) {
        alert('No tienes permisos para acceder a esta página');
        redirectToHome();
        return;
    }

    // Load users
    await loadUsers();
}

/**
 * Load all users from API
 */
async function loadUsers() {
    const loadingEl = document.getElementById('users-loading');
    const errorEl = document.getElementById('users-error');
    const tableEl = document.getElementById('users-table-container');

    try {
        loadingEl.style.display = 'flex';
        errorEl.style.display = 'none';
        tableEl.style.display = 'none';

        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/api/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }

        const data = await response.json();

        loadingEl.style.display = 'none';
        tableEl.style.display = 'block';

        renderUsersTable(data.users);
    } catch (error) {
        console.error('Error loading users:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'flex';
        document.getElementById('error-message').textContent = error.message;
    }
}

/**
 * Render users table
 */
function renderUsersTable(users) {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

/**
 * Create a table row for a user
 */
function createUserRow(user) {
    const tr = document.createElement('tr');
    const isCurrentUser = user._id === currentUser._id;
    const canChangeRole = !isCurrentUser;

    // Role badge
    const roleBadge = `<span class="${getRoleBadgeClass(user.role)}">${getRoleName(user.role)}</span>`;

    // Role selector
    let roleSelector = '';
    if (canChangeRole) {
        const roles = ['user', 'admin'];

        // Only developers can assign developer role
        if (currentUser.role === 'developer') {
            roles.push('developer');
        }

        roleSelector = `
      <select class="role-selector" data-user-id="${user._id}" data-current-role="${user.role}">
        ${roles.map(role => `
          <option value="${role}" ${user.role === role ? 'selected' : ''}>
            ${getRoleName(role)}
          </option>
        `).join('')}
      </select>
      <button class="btn-save-role" data-user-id="${user._id}" style="display: none;">
        <i class="fa-solid fa-check"></i> Guardar
      </button>
    `;
    } else {
        roleSelector = `<span class="text-muted">Tu cuenta</span>`;
    }

    tr.innerHTML = `
    <td>${user.name}</td>
    <td>${user.email}</td>
    <td>${roleBadge}</td>
    <td class="actions-cell">
      ${roleSelector}
      ${canChangeRole ? `
        <button class="btn-reset-style" data-user-id="${user._id}" data-user-email="${user.email}">
          <i class="fa-solid fa-key"></i> Resetear
        </button>
      ` : ''}
    </td>
  `;

    // Add event listeners
    if (canChangeRole) {
        const select = tr.querySelector('.role-selector');
        const saveBtn = tr.querySelector('.btn-save-role');

        select.addEventListener('change', () => {
            const hasChanged = select.value !== select.dataset.currentRole;
            saveBtn.style.display = hasChanged ? 'inline-block' : 'none';
        });

        saveBtn.addEventListener('click', async () => {
            const newRole = select.value;
            await updateUserRole(user._id, newRole, select, saveBtn);
        });

        // Add reset password button event listener
        const resetBtn = tr.querySelector('.btn-reset-style');
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                await resetUserPassword(user._id, user.email, resetBtn);
            });
        }
    }

    return tr;
}

/**
 * Update user role
 */
async function updateUserRole(userId, newRole, selectEl, saveBtn) {
    // Confirm change
    const confirmed = confirm(`¿Estás seguro de cambiar el rol de este usuario a ${getRoleName(newRole)}?`);
    if (!confirmed) return;

    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/api/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al actualizar rol');
        }

        // Update current role
        selectEl.dataset.currentRole = newRole;
        saveBtn.style.display = 'none';
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Guardar';

        // Show success notification
        showNotification(data.message || 'Rol actualizado exitosamente', 'success');

        // Reload users to reflect changes
        await loadUsers();
    } catch (error) {
        console.error('Error updating role:', error);
        showNotification(error.message, 'error');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Guardar';
    }
}

/**
 * NUEVO: Reset user password to default
 */
async function resetUserPassword(userId, userEmail, resetBtn) {
    // Confirm reset
    const confirmed = confirm(
        `¿Estás seguro de resetear la contraseña de ${userEmail}?\n\n` +
        `La nueva contraseña será: 1234abcd`
    );
    if (!confirmed) return;

    try {
        resetBtn.disabled = true;
        resetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Reseteando...';

        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/api/auth/users/${userId}/reset-password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al resetear contraseña');
        }

        // Show success with the default password
        alert(
            `✅ Contraseña reseteada exitosamente\n\n` +
            `Usuario: ${userEmail}\n` +
            `Nueva contraseña temporal: ${data.defaultPassword}\n\n` +
            `El usuario puede cambiarla desde su perfil.`
        );

        showNotification(`Contraseña de ${userEmail} reseteada a: ${data.defaultPassword}`, 'success');

        resetBtn.disabled = false;
        resetBtn.innerHTML = '<i class="fa-solid fa-key"></i> Resetear Contraseña';
    } catch (error) {
        console.error('Error resetting password:', error);
        alert('❌ Error: ' + error.message);
        resetBtn.disabled = false;
        resetBtn.innerHTML = '<i class="fa-solid fa-key"></i> Resetear Contraseña';
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notification-message');
    const icon = notification.querySelector('i');

    messageEl.textContent = message;
    notification.className = `notification ${type}`;

    if (type === 'success') {
        icon.className = 'fa-solid fa-check-circle';
    } else {
        icon.className = 'fa-solid fa-exclamation-circle';
    }

    notification.style.display = 'flex';

    // Hide after 5 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}
