/**
 * MENÚ DE USUARIO
 * 
 * Gestiona el icono de usuario, el menú desplegable y la lógica de sesión.
 * Muestra opciones adicionales para administradores y desarrolladores.
 */

import { getPageHref, getUserData, clearAuthData, isAdminOrDeveloper } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const userIcon = document.querySelector('.user-icon');
  if (!userIcon) return;

  function render() {
    // Limpiar elementos previos
    const existingName = document.querySelector('.user-name');
    if (existingName) existingName.remove();
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) existingMenu.remove();

    const user = getUserData();

    if (user) {
      // Usuario autenticado
      const name = user.name || user.email || 'Usuario';

      // Crear elemento de nombre
      const nameEl = document.createElement('div');
      nameEl.className = 'user-name';
      nameEl.textContent = name;

      // Insertar después del user-icon pero antes del cart-container
      const userContainer = document.querySelector('.user-container');
      const cartContainer = document.querySelector('.cart-container');

      if (userContainer && cartContainer) {
        // Insertar el nombre antes del cart-container
        userContainer.insertBefore(nameEl, cartContainer);
      } else if (userContainer) {
        userContainer.appendChild(nameEl);
      } else {
        userIcon.insertAdjacentElement('afterend', nameEl);
      }

      // Crear menú desplegable
      const menu = document.createElement('div');
      menu.className = 'user-menu';

      // Enlaces de administración (solo si es admin o developer)
      let adminLink = '';
      let commercialLink = '';
      let usersLink = '';
      if (isAdminOrDeveloper()) {
        adminLink = `<a href="${getPageHref('admin.html')}" class="user-menu-item"><i class="fa-solid fa-box"></i> Gestionar Productos</a>`;
        commercialLink = `<a href="${getPageHref('transactions.html')}" class="user-menu-item"><i class="fa-solid fa-chart-line"></i> Gestión Comercial</a>`;
        usersLink = `<a href="${getPageHref('users.html')}" class="user-menu-item"><i class="fa-solid fa-users-gear"></i> Gestión de Usuarios</a>`;
      }

      menu.innerHTML = `
        <div class="user-menu-item user-menu-name">${name}</div>
        ${adminLink}
        ${commercialLink}
        ${usersLink}
        <a href="${getPageHref('my-orders.html')}" class="user-menu-item"><i class="fa-solid fa-shopping-bag"></i> Mis Compras</a>
        <a href="${getPageHref('profile.html')}" class="user-menu-item user-profile"><i class="fa-solid fa-user"></i> Cuenta</a>
        <button class="user-menu-item user-logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</button>
      `;
      nameEl.insertAdjacentElement('afterend', menu);

      // Manejar logout
      const logoutBtn = menu.querySelector('.user-logout');
      logoutBtn.addEventListener('click', () => {
        clearAuthData();
        location.reload();
      });

      // Toggle del menú
      function toggle() {
        menu.classList.toggle('open');
      }
      userIcon.addEventListener('click', toggle);
      nameEl.addEventListener('click', toggle);

      // Cerrar al hacer click fuera
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) &&
          !userIcon.contains(e.target) &&
          !nameEl.contains(e.target)) {
          menu.classList.remove('open');
        }
      });

    } else {
      // Usuario no autenticado - ir a login
      userIcon.addEventListener('click', () => {
        window.location.href = getPageHref('login.html');
      }, { once: true });
    }
  }

  render();
});
