document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const registerLink = document.getElementById('register-link');

  // Determine API base URL:
  // - If the page is served over http(s) use the same origin.
  // - If the page is opened via file:// (local file) fallback to localhost:3000 where the server runs.
  const API_BASE = (location.protocol === 'http:' || location.protocol === 'https:')
    ? `${location.protocol}//${location.host}`
    : 'http://localhost:3000';

  console.log('API_BASE URL:', API_BASE);
  console.log('Current location:', location.href);

  if (registerLink) {
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      const name = prompt('Nombre (opcional)');
      const email = prompt('Email para registro');
      const password = prompt('Contraseña para registro');
      if (!email || !password) return alert('Email y contraseña requeridos');
      fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      }).then(async r => {
        if (!r.ok) {
          const text = await r.text();
          try {
            const data = JSON.parse(text);
            throw new Error(data.message || 'Error en registro');
          } catch {
            throw new Error(`Error del servidor: ${r.status}`);
          }
        }
        return r.json();
      }).then(data => {
        if (data.token) {
          localStorage.setItem('token', data.token);
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          alert('Registro exitoso');
          // Redirect to the site root. When the page is opened via file://
          // an absolute path like '/index.html' resolves to the filesystem root
          // (which causes ERR_FILE_NOT_FOUND). Use a relative redirect when
          // served as a local file.
          if (location.protocol === 'http:' || location.protocol === 'https:') {
            window.location.href = '/index.html';
          } else {
            // likely running from pages/login.html -> go up one level
            if (location.pathname.includes('/pages/') || location.pathname.includes('\\pages\\')) {
              window.location.href = '../index.html';
            } else {
              window.location.href = './index.html';
            }
          }
        } else {
          alert(data.message || 'Error en registro');
        }
      }).catch(err => alert('Error: ' + err.message));
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }).then(async r => {
        if (!r.ok) {
          const text = await r.text();
          try {
            const data = JSON.parse(text);
            throw new Error(data.message || 'Login falló');
          } catch (e) {
            if (e.message.includes('Login falló') || e.message.includes('Invalid credentials')) {
              throw e;
            }
            throw new Error(`Error del servidor: ${r.status}`);
          }
        }
        return r.json();
      }).then(data => {
        if (data.token) {
          localStorage.setItem('token', data.token);
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          if (location.protocol === 'http:' || location.protocol === 'https:') {
            window.location.href = '/index.html';
          } else {
            if (location.pathname.includes('/pages/') || location.pathname.includes('\\pages\\')) {
              window.location.href = '../index.html';
            } else {
              window.location.href = './index.html';
            }
          }
        } else {
          alert(data.message || 'Login falló');
        }
      }).catch(err => alert('Error: ' + err.message));
    });
  }
});
