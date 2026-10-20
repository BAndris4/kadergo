// ==============================================================================
// KaderGo - Floating Mini-Dock for Background Report Extraction
// Allows minimizing the modal during extraction and restoring it anytime
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  let dockEl = null;
  let restoreCallback = null;
  let abortCallback = null;
  let isDockVisible = false;

  function ensureDockCreated() {
    if (dockEl && dockEl.isConnected) return dockEl;

    const assets = window.KaderGo.ModalAssets || {};
    const icons = assets.icons || {};

    dockEl = document.createElement('div');
    dockEl.id = 'tax-gov-kadergo-floating-dock';
    dockEl.className = 'kadergo-floating-dock';
    dockEl.style.display = 'none';

    dockEl.innerHTML = `
      <div class="kadergo-dock-card">
        <!-- Center: Month & Status info -->
        <div class="kadergo-dock-center">
          <div class="kadergo-dock-meta-top">
            <span class="kadergo-dock-month" id="kg-dock-month">Обробка даних...</span>
            <span class="kadergo-dock-percent" id="kg-dock-percent">0%</span>
          </div>
          <div class="kadergo-dock-meta-sub" id="kg-dock-sub">Фонове вивантаження...</div>
          <div class="kadergo-dock-bar-wrap">
            <div class="kadergo-dock-bar" id="kg-dock-bar" style="width: 0%;"></div>
          </div>
        </div>

        <!-- Right: Actions (Restore & Abort) -->
        <div class="kadergo-dock-actions">
          <button type="button" class="kadergo-dock-btn kadergo-dock-btn-restore" id="kg-dock-btn-restore" title="Розгорнути модальне вікно">
            ${icons.expand || '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>'}
            <span>Розгорнути</span>
          </button>
          <button type="button" class="kadergo-dock-btn kadergo-dock-btn-abort" id="kg-dock-btn-abort" title="Скасувати вивантаження">
            ${icons.close || '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(dockEl);

    const restoreBtn = dockEl.querySelector('#kg-dock-btn-restore');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof restoreCallback === 'function') {
          restoreCallback();
        }
      });
    }

    const abortBtn = dockEl.querySelector('#kg-dock-btn-abort');
    if (abortBtn) {
      abortBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof abortCallback === 'function') {
          abortCallback();
        }
      });
    }

    // Clicking anywhere on the dock card except the abort button restores the modal
    const cardEl = dockEl.querySelector('.kadergo-dock-card');
    if (cardEl) {
      cardEl.addEventListener('click', (e) => {
        if (e.target.closest('#kg-dock-btn-abort')) return;
        if (typeof restoreCallback === 'function') {
          restoreCallback();
        }
      });
    }

    return dockEl;
  }

  function show({ onRestore, onAbort, initialData = {} } = {}) {
    ensureDockCreated();
    restoreCallback = onRestore;
    abortCallback = onAbort;
    isDockVisible = true;

    update(initialData);

    dockEl.style.display = 'block';
    dockEl.classList.remove('state-hide');
    dockEl.classList.add('state-show');
  }

  function update({ monthName, year, subtitle, progressPercent } = {}) {
    if (!dockEl) return;

    const monthEl = dockEl.querySelector('#kg-dock-month');
    const subEl = dockEl.querySelector('#kg-dock-sub');
    const pctEl = dockEl.querySelector('#kg-dock-percent');
    const barEl = dockEl.querySelector('#kg-dock-bar');

    if (monthEl) {
      if (monthName) {
        monthEl.textContent = `${monthName} ${year || ''}`.trim();
      }
    }

    if (subtitle !== undefined && subEl) {
      subEl.textContent = subtitle;
    }

    if (typeof progressPercent === 'number') {
      const clamped = Math.min(100, Math.max(0, Math.round(progressPercent)));
      if (pctEl) pctEl.textContent = `${clamped}%`;
      if (barEl) barEl.style.setProperty('width', `${clamped}%`, 'important');
    }
  }

  function setSuccess({ title, subtitle } = {}) {
    if (!dockEl) return;

    const card = dockEl.querySelector('.kadergo-dock-card');
    const monthEl = dockEl.querySelector('#kg-dock-month');
    const subEl = dockEl.querySelector('#kg-dock-sub');
    const pctEl = dockEl.querySelector('#kg-dock-percent');
    const barEl = dockEl.querySelector('#kg-dock-bar');

    if (card) card.classList.add('state-success');
    if (monthEl) monthEl.textContent = title || 'Файли сформовано!';
    if (subEl) subEl.textContent = subtitle || 'Оберіть місце для збереження...';
    if (pctEl) pctEl.textContent = '100%';
    if (barEl) barEl.style.setProperty('width', '100%', 'important');

    setTimeout(() => {
      hide();
    }, 4000);
  }

  function hide() {
    isDockVisible = false;
    if (!dockEl) return;
    dockEl.classList.remove('state-show');
    dockEl.classList.add('state-hide');
    setTimeout(() => {
      if (dockEl && !isDockVisible) {
        dockEl.style.display = 'none';
      }
    }, 300);
  }

  function remove() {
    isDockVisible = false;
    if (dockEl && dockEl.parentNode) {
      dockEl.remove();
      dockEl = null;
    }
  }

  window.KaderGo.ModalDock = {
    show,
    update,
    setSuccess,
    hide,
    remove,
    getIsVisible: () => isDockVisible
  };
})();
