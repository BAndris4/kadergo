// ==============================================================================
// KaderGo - Custom Export Modal (Authentic KaderGo App Vibe & Heroicons)
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  let currentModalEl = null;

  // Animated Official KaderGo Logo SVG (with natural idle micro-animations)
  const animatedKaderGoLogoSvg = `
    <svg class="kadergo-animated-logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 220" width="100%" height="100%" aria-label="KaderGo Logo">
      <defs>
        <style>
          .kg-anim-doc {
            animation: kgDocIdle 3.2s ease-in-out infinite;
            transform-origin: bottom center;
            transform-box: fill-box;
          }
          .kg-anim-arrow {
            animation: kgArrowIdle 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            transform-origin: bottom left;
            transform-box: fill-box;
          }
          .kg-anim-tab {
            animation: kgTabIdle 3.6s ease-in-out infinite;
            transform-origin: bottom right;
            transform-box: fill-box;
          }
          .kg-anim-folder {
            animation: kgFolderIdle 3.8s ease-in-out infinite;
            transform-origin: bottom center;
            transform-box: fill-box;
          }
          .kg-anim-swoosh-amber {
            animation: kgSwooshIdle 3.2s ease-in-out 0.2s infinite;
            transform-origin: bottom left;
            transform-box: fill-box;
          }
          .kg-anim-person {
            animation: kgPersonIdle 3.2s ease-in-out infinite;
            transform-origin: center bottom;
            transform-box: fill-box;
          }

          @keyframes kgDocIdle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4.5px); }
          }
          @keyframes kgArrowIdle {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(3.5px, -3.5px) scale(1.04); }
          }
          @keyframes kgTabIdle {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-2.8deg); }
          }
          @keyframes kgFolderIdle {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.98); }
          }
          @keyframes kgSwooshIdle {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.03) translate(1px, -1px); opacity: 0.92; }
          }
          @keyframes kgPersonIdle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }

          @media (prefers-reduced-motion: reduce) {
            .kadergo-animated-logo-svg * { animation: none !important; }
          }
        </style>

        <linearGradient id="kg-logo-tealMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e4e5e" />
          <stop offset="50%" stop-color="#133b47" />
          <stop offset="100%" stop-color="#0f2e38" />
        </linearGradient>
        <linearGradient id="kg-logo-tealBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2a5b6c" />
          <stop offset="100%" stop-color="#0f2e38" />
        </linearGradient>
        <linearGradient id="kg-logo-amberMain" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#e08e36" />
          <stop offset="50%" stop-color="#f59533" />
          <stop offset="100%" stop-color="#f8a44c" />
        </linearGradient>
        <linearGradient id="kg-logo-amberShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f59533" />
          <stop offset="100%" stop-color="#d47a22" />
        </linearGradient>

        <mask id="kg-logo-docCutout" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="220" height="220">
          <rect x="0" y="0" width="220" height="220" fill="white" />
          <path d="M 42 54 C 42 49 46 46 51 46 L 73 46 L 80 54 L 97 54 C 102 54 106 58 106 63 L 106 184 L 42 184 Z" fill="black" />
        </mask>

        <mask id="kg-logo-folderCutout" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="220" height="220">
          <rect x="0" y="0" width="220" height="220" fill="white" />
          <path d="M 38 194 C 46 136 94 96 148 34 L 194 34 C 142 106 86 138 64 194 Z" fill="black" />
        </mask>
      </defs>

      <!-- Білий squircle значок KaderGo -->
      <rect x="0" y="0" width="220" height="220" rx="46" ry="46" fill="#ffffff" stroke="#cbd8d6" stroke-width="4" />

      <g transform="translate(13, 13) scale(0.88)">
        <!-- Документ у папці -->
        <g mask="url(#kg-logo-docCutout)">
          <g class="kg-anim-doc">
            <path d="M 48 34 L 84 34 L 98 48 L 98 62 L 48 62 Z" fill="none" stroke="#133b47" stroke-width="4.5" stroke-linejoin="round" />
            <path d="M 84 34 L 84 48 L 98 48" fill="none" stroke="#133b47" stroke-width="4" stroke-linejoin="round" />
            <line x1="57" y1="44" x2="77" y2="44" stroke="#133b47" stroke-width="3.8" stroke-linecap="round" />
            <line x1="57" y1="52" x2="88" y2="52" stroke="#133b47" stroke-width="3.8" stroke-linecap="round" />
          </g>
        </g>

        <!-- Елементи папки -->
        <g mask="url(#kg-logo-folderCutout)">
          <path class="kg-anim-tab" d="M 30 62 C 23 63 19 69 20 76 L 38 190 L 46 190 L 34 61 Z" fill="url(#kg-logo-tealBack)" />
          <g class="kg-anim-folder">
            <path d="M 42 54 C 42 49 46 46 51 46 L 73 46 L 80 54 L 97 54 C 102 54 106 58 106 63 L 106 184 C 106 190 102 194 96 194 L 62 194 C 66 172 78 154 96 139 L 42 184 Z" fill="url(#kg-logo-tealMain)" />
            <path d="M 65 194 L 96 194 C 102 194 106 190 106 184 L 106 144 C 86 158 72 175 65 194 Z" fill="#0f2e38" />
          </g>
        </g>

        <!-- Верхні темні петролеві K-стрічки -->
        <g>
          <path d="M 42 180 C 52 130 96 92 150 34 L 170 34 C 120 92 76 128 42 180 Z" fill="url(#kg-logo-tealMain)" />
          <path d="M 42 188 C 58 136 110 98 175 34 L 191 34 C 140 94 102 124 60 146 C 49 157 44 172 42 188 Z" fill="url(#kg-logo-tealMain)" />
        </g>

        <!-- Нижня бурштинова стрілка вгору -->
        <g class="kg-anim-arrow">
          <path d="M 104 142 L 128 122 L 154 148 L 178 124 L 169 115 L 204 106 L 197 142 L 189 134 L 156 168 L 194 194 L 150 194 C 142 194 136 190 130 183 L 104 142 Z" fill="url(#kg-logo-amberMain)" />
          <path d="M 154 148 L 189 134 L 156 168 L 130 144 Z" fill="url(#kg-logo-amberShadow)" opacity="0.45" />
        </g>

        <!-- Нижня дуга -->
        <g class="kg-anim-swoosh-amber">
          <path d="M 42 188 C 48 152 78 128 134 114 C 106 138 70 156 42 188 Z" fill="url(#kg-logo-amberMain)" />
          <path d="M 48 194 C 56 160 84 134 142 112 C 122 130 80 152 56 194 Z" fill="#f8a44c" opacity="0.85" />
        </g>

        <!-- Силует -->
        <g class="kg-anim-person">
          <circle cx="151" cy="113" r="7.5" fill="#133b47" />
          <path d="M 139 131 C 139 124 144 122 151 122 C 158 122 163 124 163 131 L 151 143 Z" fill="#133b47" />
        </g>
      </g>

      <!-- Фірмовий текст KaderGo: темний петроль (#133b47) + теплий бурштин (#f8a44c) -->
      <text x="248" y="152" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="100px" letter-spacing="-0.03em">
        <tspan fill="#133b47">Kader</tspan><tspan fill="#f8a44c">Go</tspan>
      </text>
    </svg>
  `;

  // Heroicons (Outline 24x24, stroke 2.2 / 2.5)
  const icons = {
    calendar: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    `,
    layers: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
    `,
    fileSpreadsheet: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="8" y1="13" x2="16" y2="13"></line>
        <line x1="8" y1="17" x2="16" y2="17"></line>
      </svg>
    `,
    documentText: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    `,
    download: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    `,
    checkBadge: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
      </svg>
    `,
    check: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `,
    archive: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="21 8 21 21 3 21 3 8"></polyline>
        <rect x="1" y="3" width="22" height="5"></rect>
        <line x1="10" y1="12" x2="14" y2="12"></line>
      </svg>
    `,
    close: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `
  };

  /**
   * Opens the custom KaderGo export modal before extraction.
   * Styled 1:1 like native KaderGo app dialogs.
   * Returns Promise<{ proceed: boolean, format: 'xlsx' | 'zip' }>
   */
  function openExportModal({ periodFrom, periodTo, intervals, isAllRro, targetFn }) {
    return new Promise((resolve) => {
      closeModal();

      let selectedFormat = 'xlsx';

      const overlay = document.createElement('div');
      overlay.id = 'tax-gov-kadergo-modal-overlay';
      overlay.className = 'kadergo-modal-overlay';

      const card = document.createElement('div');
      card.className = 'kadergo-modal-card';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');

      // 1. Header (KaderGo clean light header: bg-[#f8faf9], border-b-2 border-[#e2eceb])
      const header = document.createElement('div');
      header.className = 'kadergo-modal-header';

      const headerBrandWrap = document.createElement('div');
      headerBrandWrap.className = 'kadergo-modal-brand-wrap';

      const logoWrap = document.createElement('div');
      logoWrap.className = 'kadergo-modal-logo-wrap';
      logoWrap.innerHTML = animatedKaderGoLogoSvg;

      const headerSep = document.createElement('div');
      headerSep.className = 'kadergo-modal-header-divider';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'kadergo-modal-main-title';
      titleWrap.innerHTML = `<span>Експорт в Excel</span>`;

      headerBrandWrap.appendChild(logoWrap);
      headerBrandWrap.appendChild(headerSep);
      headerBrandWrap.appendChild(titleWrap);

      const closeBtn = document.createElement('button');
      closeBtn.className = 'kadergo-modal-close-btn';
      closeBtn.type = 'button';
      closeBtn.title = 'Закрити';
      closeBtn.innerHTML = icons.close;

      header.appendChild(headerBrandWrap);
      header.appendChild(closeBtn);

      // 2. Body (KaderGo White & Slate/Mint Card styling)
      const body = document.createElement('div');
      body.className = 'kadergo-modal-body';

      const modeTitle = isAllRro
        ? 'Всі РРО'
        : (targetFn ? `РРО ${targetFn}` : 'Обраний РРО');

      const fileCountText = intervals && intervals.length > 1
        ? `${intervals.length} файли`
        : '1 файл';

      // Visual Hero Card (Signature KaderGo Dark Petrol Card with Amber Accent)
      const heroCard = document.createElement('div');
      heroCard.className = 'kadergo-hero-card';
      heroCard.innerHTML = `
        <div class="kadergo-hero-left">
          <div class="kadergo-hero-icon-box">
            ${icons.documentText}
          </div>
          <div class="kadergo-hero-meta">
            <span class="kadergo-hero-tag">Експорт обороту</span>
            <span class="kadergo-hero-title">${modeTitle}</span>
          </div>
        </div>
        <div class="kadergo-hero-badge" id="kadergo-hero-badge-el">
          ${fileCountText}
        </div>
      `;

      // Details Grid (2 Cards: Period & Mode)
      const grid = document.createElement('div');
      grid.className = 'kadergo-modal-grid';
      grid.innerHTML = `
        <div class="kadergo-grid-card">
          <div class="kadergo-grid-header">
            <span class="kadergo-grid-icon">${icons.calendar}</span>
            <span class="kadergo-grid-label">Період</span>
          </div>
          <div class="kadergo-grid-value">${periodFrom} &mdash; ${periodTo}</div>
        </div>
        <div class="kadergo-grid-card">
          <div class="kadergo-grid-header">
            <span class="kadergo-grid-icon">${icons.layers}</span>
            <span class="kadergo-grid-label">Режим</span>
          </div>
          <div class="kadergo-grid-value">${modeTitle}</div>
        </div>
      `;

      // Optional Format Switcher (shown when multi-month export)
      let formatSection = null;
      if (intervals && intervals.length > 1) {
        formatSection = document.createElement('div');
        formatSection.className = 'kadergo-format-section';
        formatSection.innerHTML = `
          <div class="kadergo-format-title">Формат завантаження:</div>
          <div class="kadergo-format-options">
            <button type="button" class="kadergo-format-btn active" data-format="xlsx">
              <span class="kadergo-format-btn-icon">${icons.fileSpreadsheet}</span>
              <span>Окремі Excel (.xlsx)</span>
            </button>
            <button type="button" class="kadergo-format-btn" data-format="zip">
              <span class="kadergo-format-btn-icon">${icons.archive}</span>
              <span>Архів ZIP (.zip)</span>
            </button>
          </div>
        `;
      }

      // File Chips Container
      const fileSection = document.createElement('div');
      fileSection.className = 'kadergo-file-section';

      const fileSectionTitle = document.createElement('div');
      fileSectionTitle.className = 'kadergo-file-section-title';
      fileSectionTitle.innerHTML = `${icons.fileSpreadsheet}<span>Файли для завантаження:</span>`;

      const fileChipsWrap = document.createElement('div');
      fileChipsWrap.className = 'kadergo-file-chips-wrap';

      function renderFileChips(format) {
        fileChipsWrap.innerHTML = '';
        if (format === 'zip') {
          const zipName = `оборот_${periodFrom}_${periodTo}.zip`.replace(/\./g, '_').replace(/_+/g, '_').replace(/_zip$/, '.zip');
          const chip = document.createElement('span');
          chip.className = 'kadergo-file-chip';
          chip.innerHTML = `${icons.archive}<span>${zipName}</span>`;
          fileChipsWrap.appendChild(chip);
        } else if (intervals && intervals.length > 0) {
          intervals.forEach((it, idx) => {
            const chip = document.createElement('span');
            chip.className = 'kadergo-file-chip';
            chip.style.animationDelay = `${0.04 * (idx + 1)}s`;
            chip.innerHTML = `${icons.fileSpreadsheet}<span>${it.defaultFileName}</span>`;
            fileChipsWrap.appendChild(chip);
          });
        } else {
          const chip = document.createElement('span');
          chip.className = 'kadergo-file-chip';
          chip.innerHTML = `${icons.fileSpreadsheet}<span>оборот.xlsx</span>`;
          fileChipsWrap.appendChild(chip);
        }
      }

      renderFileChips('xlsx');

      fileSection.appendChild(fileSectionTitle);
      fileSection.appendChild(fileChipsWrap);

      body.appendChild(heroCard);
      body.appendChild(grid);
      if (formatSection) body.appendChild(formatSection);
      body.appendChild(fileSection);

      // 3. Footer (KaderGo Clean Light Footer with Signature Amber Action Button)
      const footer = document.createElement('div');
      footer.className = 'kadergo-modal-footer';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'kadergo-modal-btn-cancel';
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Скасувати';

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'kadergo-modal-btn-confirm';
      confirmBtn.type = 'button';

      function updateConfirmBtn(format) {
        if (format === 'zip') {
          confirmBtn.innerHTML = `
            ${icons.check}
            <span>Завантажити ZIP архів</span>
          `;
          const badge = card.querySelector('#kadergo-hero-badge-el');
          if (badge) badge.textContent = '1 архів ZIP';
        } else {
          const countLabel = intervals && intervals.length > 1 ? ` (${intervals.length} файли)` : '';
          confirmBtn.innerHTML = `
            ${icons.check}
            <span>Завантажити в Excel${countLabel}</span>
          `;
          const badge = card.querySelector('#kadergo-hero-badge-el');
          if (badge) badge.textContent = fileCountText;
        }
      }

      updateConfirmBtn('xlsx');

      if (formatSection) {
        const formatBtns = formatSection.querySelectorAll('.kadergo-format-btn');
        formatBtns.forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            formatBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            selectedFormat = btn.getAttribute('data-format') || 'xlsx';
            renderFileChips(selectedFormat);
            updateConfirmBtn(selectedFormat);
          });
        });
      }

      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(footer);
      overlay.appendChild(card);

      document.body.appendChild(overlay);
      currentModalEl = overlay;

      // Event: Confirm Download
      confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
        resolve({ proceed: true, format: selectedFormat });
      });

      function handleCancel() {
        closeModal();
        resolve({ proceed: false });
      }

      closeBtn.addEventListener('click', handleCancel);
      cancelBtn.addEventListener('click', handleCancel);

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleCancel();
        }
      });

      function onKeyDown(e) {
        if (e.key === 'Escape') {
          window.removeEventListener('keydown', onKeyDown);
          handleCancel();
        }
      }
      window.addEventListener('keydown', onKeyDown);
    });
  }

  function closeModal() {
    if (currentModalEl && currentModalEl.parentNode) {
      currentModalEl.remove();
      currentModalEl = null;
    }
  }

  window.KaderGo.Modal = {
    openExportModal,
    closeModal
  };
})();
