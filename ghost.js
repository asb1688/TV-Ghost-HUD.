(function () {
  'use strict';

  const INIT_DELAY = 3000;
  const DEFAULT_OPACITY = 0.15;

  setTimeout(init, INIT_DELAY);

  function init() {
    if (document.getElementById('ghost-hud')) return;
    applyGhostToSidebar();
    createToggle();
  }

  function applyGhostToSidebar() {
    const sidebar = document.querySelector('.layout__area--right');
    if (!sidebar) return;

    sidebar.style.transition = 'opacity 0.3s ease';
    sidebar.style.opacity = DEFAULT_OPACITY;

    sidebar.addEventListener('mouseenter', () => {
      sidebar.style.opacity = '1';
    });

    sidebar.addEventListener('mouseleave', () => {
      const val = document.getElementById('ghost-slider');
      sidebar.style.opacity = val ? val.value / 100 : DEFAULT_OPACITY;
    });
  }

  function createToggle() {
    const hud = document.createElement('div');
    hud.id = 'ghost-hud';
    hud.innerHTML = `
      <span>⚡ GHOST</span>
      <input id="ghost-slider" type="range" min="5" max="100" value="${DEFAULT_OPACITY * 100}" title="Opacity">
    `;
    document.body.appendChild(hud);

    document.getElementById('ghost-slider').addEventListener('input', (e) => {
      const sidebar = document.querySelector('.layout__area--right');
      if (sidebar) sidebar.style.opacity = e.target.value / 100;
    });
  }

})();
