document.addEventListener('DOMContentLoaded', () => {
  const userIcon = document.querySelector('.user-icon');
  if (!userIcon) return;

  function getLoginHref() {
    // If served via http(s), use site-relative path; otherwise compute relative path
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      return '/pages/login.html';
    }
    if (location.pathname.includes('/pages/') || location.pathname.includes('\\pages\\')) {
      return '../pages/login.html';
    }
    return './pages/login.html';
  }

  function getProfileHref() {
    // If served via http(s), use site-relative path; otherwise compute relative path
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      return '/pages/profile.html';
    }
    if (location.pathname.includes('/pages/') || location.pathname.includes('\\pages\\')) {
      return './profile.html';
    }
    return './pages/profile.html';
  }

  function render() {
    // Clear previous name/menu
    const existingName = document.querySelector('.user-name');
    if (existingName) existingName.remove();
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) existingMenu.remove();

    const userJson = localStorage.getItem('user');
    if (userJson) {
      let user;
      try { user = JSON.parse(userJson); } catch (e) { user = null; }
      const name = (user && (user.name || user.email)) || 'Usuario';

      const nameEl = document.createElement('div');
      nameEl.className = 'user-name';
      nameEl.textContent = name;

      // Insert the name inside the user-container (after the user-icon)
      const userContainer = document.querySelector('.user-container');
      if (userContainer) {
        userContainer.appendChild(nameEl);
      } else {
        // Fallback: if no container, insert after icon
        userIcon.insertAdjacentElement('afterend', nameEl);
      }

      // dropdown menu with logout
      const menu = document.createElement('div');
      menu.className = 'user-menu';
      menu.innerHTML = `
        <div class="user-menu-item user-menu-name">${name}</div>
        <a href="${getProfileHref()}" class="user-menu-item user-profile">Información del usuario</a>
        <button class="user-menu-item user-logout">Cerrar sesión</button>
      `;
      nameEl.insertAdjacentElement('afterend', menu);

      const logoutBtn = menu.querySelector('.user-logout');
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // reload to update UI
        location.reload();
      });

      // toggle menu when clicking name or icon
      function toggle() {
        menu.classList.toggle('open');
      }
      userIcon.addEventListener('click', toggle);
      nameEl.addEventListener('click', toggle);

      // click outside closes menu
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !userIcon.contains(e.target) && !nameEl.contains(e.target)) {
          menu.classList.remove('open');
        }
      });

    } else {
      // not logged in: clicking the icon should go to login page
      userIcon.addEventListener('click', () => {
        window.location.href = getLoginHref();
      }, { once: true });
    }
  }

  render();
});
