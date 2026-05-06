(function () {
  'use strict';

  setTimeout(function() {
    const sidebar = document.querySelector('.layout__area--right');
    if (!sidebar) return;
    sidebar.style.opacity = '0.2';
  }, 5000);

})();
