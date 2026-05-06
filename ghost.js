(function () {
  'use strict';

  setTimeout(function() {
    
    // Find the sidebar
    const sidebar = document.querySelector('.layout__area--right');
    if (!sidebar) return;

    // Just make it transparent, that's it
    sidebar.style.opacity = '0.2';
    sidebar.style.transition = 'opacity 0.3s ease';

    // Create the slider control
    const control = document.createElement('div');
    control.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 2147483647;
      background: rgba(0,0,0,0.7);
      border-radius: 8px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: sans-serif;
      font-size: 11px;
      color: white;
    `;
    control.innerHTML = `
      ⚡ Ghost <input id="ghost-slider" type="range" min="5" max="100" value="20" style="width:80px; accent-color:#3a7bd5;">
    `;
    document.body.appendChild(control);

    // Slider controls opacity
    document.getElementById('ghost-slider').addEventListener('input', function() {
      sidebar.sty
