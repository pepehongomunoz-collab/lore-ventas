document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.querySelector('.hamburguesa');
  const nav = document.querySelector('nav');

  if (!menuBtn || !nav) return;

  menuBtn.addEventListener('click', () => {
    nav.classList.toggle('active');
    // toggle aria attribute for accessibility
    const expanded = nav.classList.contains('active');
    menuBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  });
});
