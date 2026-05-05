(function () {
  'use strict';

  // ─── Config ───────────────────────────────────────────────
  const REFRESH_MS   = 2000;   // how often to re-scrape data
  const INIT_DELAY   = 4000;   // wait for TV to render
  const DEFAULT_OPACITY = 0.75;

  // ─── State ────────────────────────────────────────────────
  let hud, hudBody, opacitySlider;
  let isDragging = false;
  let dragOffsetX = 0, dragOffsetY = 0;
  let refreshInterval = null;

  // ─── Init ─────────────────────────────────────────────────
  setTimeout(init, INIT_DELAY);

  function init() {
    if (document.getElementById('ghost-hud')) return;
    createHUD();
    startRefresh();
    collapseNativeSidebar();
  }

  // ─── Collapse the native right sidebar ────────────────────
  function collapseNativeSidebar() {
    // Try to find and hide the screener/right panel
    const selectors = [
      '.layout__area--right',
      '[data-name="screener-sidebar"]',
      '.right-toolbar',
    ];
    selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.style.display = 'none';
    });
  }

  // ─── Build the HUD DOM ────────────────────────────────────
  function createHUD() {
    hud = document.createElement('div');
    hud.id = 'ghost-hud';
    hud.style.opacity = DEFAULT_OPACITY;

    hud.innerHTML = `
      <div id="ghost-hud-header">
        <span id="ghost-hud-title">⚡ Ghost HUD</span>
        <div id="ghost-hud-controls">
          <input id="ghost-opacity-slider" type="range" min="10" max="100"
            value="${DEFAULT_OPACITY * 100}" title="Opacity">
          <button id="ghost-hud-close" title="Close">✕</button>
        </div>
      </div>
      <div id="ghost-hud-body">
        <div id="ghost-hud-empty">Loading...</div>
      </div>
    `;

    document.body.appendChild(hud);

    // Restore saved position
    const saved = getSavedPosition();
    if (saved) {
      hud.style.left   = saved.left;
      hud.style.top    = saved.top;
      hud.style.bottom = 'auto';
    }

    // Opacity slider
    opacitySlider = document.getElementById('ghost-opacity-slider');
    opacitySlider.addEventListener('input', () => {
      hud.style.opacity = opacitySlider.value / 100;
    });

    // Close button — restores sidebar
    document.getElementById('ghost-hud-close').addEventListener('click', () => {
      hud.remove();
      clearInterval(refreshInterval);
      restoreNativeSidebar();
    });

    // Drag
    hud.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);

    hudBody = document.getElementById('ghost-hud-body');
  }

  // ─── Scrape watchlist / screener rows ─────────────────────
  function scrapeData() {
    const rows = [];

    // Strategy: try multiple TV selector patterns
    const rowSelectors = [
      // Watchlist rows
      '[data-symbol-full]',
      '.symbolNameLabel',
      '.listRow',
    ];

    // Attempt 1: data-symbol-full attributes (watchlist)
    const symbolEls = document.querySelectorAll('[data-symbol-full]');
    if (symbolEls.length > 0) {
      symbolEls.forEach(el => {
        const symbol = el.getAttribute('data-symbol-full') || '';
        const ticker = symbol.split(':')[1] || symbol;

        // Walk up to find the row container, then look for price/change
        const row = el.closest('[class*="listRow"], [class*="row"], li') || el.parentElement;
        const allText = row ? row.innerText : '';
        const nums = allText.match(/[\d,]+\.?\d*/g) || [];
        const price = nums[0] || '—';

        // Look for % change
        const pctMatch = allText.match(/([+-]?\d+\.?\d*)\s*%/);
        const pct = pctMatch ? pctMatch[1] : null;

        if (ticker && ticker.length > 0 && ticker.length < 10) {
          rows.push({ ticker, price, pct });
        }
      });
    }

    // Attempt 2: screener table rows
    if (rows.length === 0) {
      const tableRows = document.querySelectorAll(
        '[class*="screener"] [class*="row"], [class*="watchlist"] [class*="row"]'
      );
      tableRows.forEach(row => {
        const text = row.innerText || '';
        const parts = text.trim().split(/\s+/);
        if (parts.length >= 2) {
          const ticker = parts[0];
          const price  = parts[1];
          const pctMatch = text.match(/([+-]?\d+\.?\d*)\s*%/);
          const pct = pctMatch ? pctMatch[1] : null;
          if (ticker && /^[A-Z.]{1,8}$/.test(ticker)) {
            rows.push({ ticker, price, pct });
          }
        }
      });
    }

    return rows.slice(0, 15); // cap at 15 rows
  }

  // ─── Render rows into HUD ─────────────────────────────────
  function renderHUD(rows) {
    if (!hudBody) return;

    if (rows.length === 0) {
      hudBody.innerHTML = `<div id="ghost-hud-empty">Open your Watchlist or Screener panel first, then Ghost HUD will mirror it here.</div>`;
      return;
    }

    hudBody.innerHTML = rows.map(({ ticker, price, pct }) => {
      let changeClass = 'flat';
      let changeText  = '—';

      if (pct !== null) {
        const val = parseFloat(pct);
        changeClass = val > 0 ? 'up' : val < 0 ? 'down' : 'flat';
        changeText  = (val > 0 ? '+' : '') + val.toFixed(2) + '%';
      }

      return `
        <div class="ghost-row">
          <span class="ghost-symbol">${ticker}</span>
          <span class="ghost-price">${price}</span>
          <span class="ghost-change ${changeClass}">${changeText}</span>
        </div>
      `;
    }).join('');
  }

  // ─── Refresh loop ─────────────────────────────────────────
  function startRefresh() {
    renderHUD(scrapeData());
    refreshInterval = setInterval(() => {
      renderHUD(scrapeData());
    }, REFRESH_MS);
  }

  // ─── Drag logic ───────────────────────────────────────────
  function onDragStart(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    isDragging = true;
    hud.classList.add('dragging');
    const rect = hud.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    e.preventDefault();
  }

  function onDragMove(e) {
    if (!isDragging) return;
    const x = e.clientX - dragOffsetX;
    const y = e.clientY - dragOffsetY;
    hud.style.left   = Math.max(0, x) + 'px';
    hud.style.top    = Math.max(0, y) + 'px';
    hud.style.bottom = 'auto';
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    hud.classList.remove('dragging');
    savePosition();
  }

  // ─── Restore native sidebar ───────────────────────────────
  function restoreNativeSidebar() {
    const selectors = [
      '.layout__area--right',
      '[data-name="screener-sidebar"]',
      '.right-toolbar',
    ];
    selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.style.display = '';
    });
  }

  // ─── Persist position across reloads ──────────────────────
  function savePosition() {
    const rect = hud.getBoundingClientRect();
    localStorage.setItem('ghostHUDPos', JSON.stringify({
      left: rect.left + 'px',
      top:  rect.top  + 'px',
    }));
  }

  function getSavedPosition() {
    try {
      return JSON.parse(localStorage.getItem('ghostHUDPos'));
    } catch { return null; }
  }

})();
