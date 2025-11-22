console.log('[menu.js] Script loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('[menu.js] DOMContentLoaded fired');
  const menuBtn = document.querySelector('.hamburguesa');
  const nav = document.querySelector('nav');

  console.log('[menu.js] menuBtn:', menuBtn);
  console.log('[menu.js] nav:', nav);

  if (!menuBtn || !nav) {
    console.error('[menu.js] Missing elements - menuBtn or nav not found');
    return;
  }

  // Función para cerrar el menú
  function closeMenu() {
    nav.classList.remove('active');
    menuBtn.setAttribute('aria-expanded', 'false');
    console.log('[menu.js] Menu closed');
  }

  // Toggle del menú hamburguesa
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('[menu.js] Menu button clicked');
    nav.classList.toggle('active');
    const expanded = nav.classList.contains('active');
    menuBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    console.log('[menu.js] Menu toggled, active:', expanded);
  });

  // Cerrar menú al hacer click en un enlace - usando captura para interceptar antes de navegación
  nav.addEventListener('click', (e) => {
    // Verificar si el click fue en un enlace o dentro de un enlace
    const link = e.target.closest('a');
    if (link && nav.classList.contains('active')) {
      console.log('[menu.js] Link clicked:', link.textContent.trim());
      // Cerrar el menú inmediatamente
      closeMenu();
      // No prevenir la navegación, solo cerrar el menú
    }
  }, true); // true = usar fase de captura

  // Cerrar menú al hacer click fuera de él
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('active')) {
      // Si el click no fue en el nav ni en el botón hamburguesa
      if (!nav.contains(e.target) && !menuBtn.contains(e.target)) {
        console.log('[menu.js] Click outside menu, closing');
        closeMenu();
      }
    }
  });

  console.log('[menu.js] Event listeners attached successfully');
});
