/**
 * MENÚ DE USUARIO - REFACTORIZADO
 * 
 * CAMBIOS PRINCIPALES:
 * 1. Eliminamos getLoginHref() y getProfileHref() duplicadas
 * 2. Usamos getPageHref() genérica de utils.js
 * 3. Usamos getUserData() y clearAuthData() de utils.js
 * 4. Código más limpio y mantenible
 */

import { getPageHref, getUserData, clearAuthData } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const userIcon = document.querySelector('.user-icon');
  if (!userIcon) return;

  /**
   * ANTES: Teníamos dos funciones casi idénticas:
   * - getLoginHref() - 10 líneas
   * - getProfileHref() - 10 líneas
   * 
   * AHORA: Usamos una función genérica de utils.js
   * - getPageHref('login.html')
   * - getPageHref('profile.html')
   * 
   * BENEFICIO: Si cambia la lógica de rutas, solo actualizamos utils.js
   */

  function render() {
    // Limpiar elementos previos
    const existingName = document.querySelector('.user-name');
    if (existingName) existingName.remove();
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) existingMenu.remove();

    // ANTES: 
    // const userJson = localStorage.getItem('user');
    // let user;
    // try { user = JSON.parse(userJson); } catch (e) { user = null; }

    // AHORA: Función centralizada que maneja errores
    const user = getUserData();

    if (user) {
      // Usuario autenticado
      const name = user.name || user.email || 'Usuario';

      // Crear elemento de nombre
      const nameEl = document.createElement('div');
      nameEl.className = 'user-name';
      nameEl.textContent = name;

      // Insertar en el contenedor
      const userContainer = document.querySelector('.user-container');
      if (userContainer) {
        userContainer.appendChild(nameEl);
      } else {
        userIcon.insertAdjacentElement('afterend', nameEl);
      }

      // Crear menú desplegable
      const menu = document.createElement('div');
      menu.className = 'user-menu';

      // ANTES: Teníamos getProfileHref() definida arriba
      // AHORA: Usamos getPageHref() de utils.js
      menu.innerHTML = `
        <div class="user-menu-item user-menu-name">${name}</div>
        <a href="${getPageHref('profile.html')}" class="user-menu-item user-profile">Información del usuario</a>
        <button class="user-menu-item user-logout">Cerrar sesión</button>
      `;
      nameEl.insertAdjacentElement('afterend', menu);

      // Manejar logout
      const logoutBtn = menu.querySelector('.user-logout');
      logoutBtn.addEventListener('click', () => {
        // ANTES:
        // localStorage.removeItem('token');
        // localStorage.removeItem('user');

        // AHORA: Función centralizada
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
      // ANTES: getLoginHref() definida arriba
      // AHORA: getPageHref() de utils.js
      userIcon.addEventListener('click', () => {
        window.location.href = getPageHref('login.html');
      }, { once: true });
    }
  }

  render();
});

/**
 * RESUMEN DE MEJORAS:
 * 
 * ANTES:
 * - 95 líneas
 * - 2 funciones duplicadas (getLoginHref, getProfileHref)
 * - Lógica de localStorage duplicada
 * 
 * AHORA:
 * - 75 líneas (21% menos)
 * - Sin duplicación
 * - Usa funciones compartidas de utils.js
 * - Más fácil de mantener
 */
