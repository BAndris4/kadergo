/**
 * KaderGo - Modal DOM & Template Builders Sub-component
 * Handles construction of modal dialog elements, tabs, grid, and animated flow view.
 */
(function () {
  'use strict';

  window.KaderGo = window.KaderGo || {};

  const { animatedKaderGoLogoSvg, kadergoFlowSvg, icons } = window.KaderGo.ModalAssets || {};

  /**
   * Creates the base overlay, modal card, and all sub-sections.
   */
  function createModalDom(options = {}) {
    const {
      activeMode,
      isSingleDisabled,
      isAllDisabled,
      singleTitle,
      allTitle,
      availableYears,
      selectedYear,
      currentYear,
      DateUtils,
      onYearSelect
    } = options;

    const overlay = document.createElement('div');
    overlay.id = 'tax-gov-kadergo-modal-overlay';
    overlay.className = 'kadergo-modal-overlay';

    const card = document.createElement('div');
    card.className = 'kadergo-modal-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    // Header
    const header = document.createElement('div');
    header.className = 'kadergo-modal-header';

    const headerBrandWrap = document.createElement('div');
    headerBrandWrap.className = 'kadergo-modal-brand-wrap';

    const logoWrap = document.createElement('div');
    logoWrap.className = 'kadergo-modal-logo-wrap';
    logoWrap.innerHTML = animatedKaderGoLogoSvg || '';

    const headerSep = document.createElement('div');
    headerSep.className = 'kadergo-modal-header-divider';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'kadergo-modal-main-title';
    titleWrap.innerHTML = `<span>Експорт в Excel</span>`;

    headerBrandWrap.appendChild(logoWrap);
    headerBrandWrap.appendChild(headerSep);
    headerBrandWrap.appendChild(titleWrap);

    const headerActions = document.createElement('div');
    headerActions.className = 'kadergo-modal-header-actions';

    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'kadergo-modal-minimize-btn';
    minimizeBtn.type = 'button';
    minimizeBtn.title = 'Згорнути у фоновий режим (вивантаження триватиме)';
    minimizeBtn.innerHTML = icons?.minimize || '';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'kadergo-modal-close-btn';
    closeBtn.type = 'button';
    closeBtn.title = 'Закрити';
    closeBtn.innerHTML = icons?.close || '';

    headerActions.appendChild(minimizeBtn);
    headerActions.appendChild(closeBtn);

    header.appendChild(headerBrandWrap);
    header.appendChild(headerActions);

    // Body
    const body = document.createElement('div');
    body.className = 'kadergo-modal-body';

    // 1. Mode Tabs
    const tabsWrap = document.createElement('div');
    tabsWrap.className = 'kadergo-mode-tabs';
    tabsWrap.innerHTML = `
      <button type="button" class="kadergo-mode-tab ${activeMode === 'single' ? 'active' : ''} ${isSingleDisabled ? 'disabled' : ''}" data-mode="single" title="${singleTitle}">
        ${icons?.documentText || ''}
        <span>Обраний РРО</span>
      </button>
      <button type="button" class="kadergo-mode-tab ${activeMode === 'all' ? 'active' : ''} ${isAllDisabled ? 'disabled' : ''}" data-mode="all" title="${allTitle}">
        ${icons?.layers || ''}
        <span>Всі РРО</span>
      </button>
      <button type="button" class="kadergo-mode-tab ${activeMode === 'income_book' ? 'active' : ''}" data-mode="income_book" title="Книга обліку доходів за обраний рік">
        ${icons?.bookOpen || ''}
        <span>Книга доходів</span>
      </button>
    `;

    // 2. Visual Hero Card
    const heroCard = document.createElement('div');
    heroCard.className = 'kadergo-hero-card';
    heroCard.innerHTML = `
      <div class="kadergo-hero-left">
        <div class="kadergo-hero-icon-box" id="kg-hero-icon-box">
          ${icons?.documentText || ''}
        </div>
        <div class="kadergo-hero-meta">
          <span class="kadergo-hero-tag" id="kg-hero-tag">Експорт</span>
          <span class="kadergo-hero-title" id="kg-hero-title">Оборот</span>
        </div>
      </div>
      <div class="kadergo-hero-badge" id="kg-hero-badge"></div>
    `;

    // 3. Year Selector (Visible in income_book mode ONLY)
    const yearSection = document.createElement('div');
    yearSection.className = 'kadergo-year-section' + (activeMode !== 'income_book' ? ' hidden' : '');
    if (activeMode !== 'income_book') {
      yearSection.style.setProperty('display', 'none', 'important');
    }
    yearSection.innerHTML = `
      <div class="kadergo-year-section-title">
        <span class="kadergo-year-title-icon">${icons?.calendar || ''}</span>
        <span>Оберіть звітний рік:</span>
      </div>
      <div class="kadergo-year-chips-wrap" id="kg-year-chips-container"></div>
    `;

    const yearChipsContainer = yearSection.querySelector('#kg-year-chips-container');
    if (Array.isArray(availableYears)) {
      availableYears.forEach((yr) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `kadergo-year-chip ${yr === selectedYear ? 'active' : ''}`;
        btn.setAttribute('data-year', yr);

        const yrInfo = DateUtils ? DateUtils.getYearExportInfo(yr) : { hasCompletedMonths: yr <= currentYear };
        if (yr > currentYear || !yrInfo.hasCompletedMonths) {
          btn.classList.add('disabled');
          btn.title = yrInfo.description || 'Немає завершених місяців';
        }

        btn.textContent = yr;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (btn.classList.contains('disabled')) return;
          yearChipsContainer.querySelectorAll('.kadergo-year-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (typeof onYearSelect === 'function') {
            onYearSelect(yr);
          }
        });
        yearChipsContainer.appendChild(btn);
      });
    }

    // 4. Details Grid (Period & Mode)
    const grid = document.createElement('div');
    grid.className = 'kadergo-modal-grid';
    grid.innerHTML = `
      <div class="kadergo-grid-card">
        <div class="kadergo-grid-header">
          <span class="kadergo-grid-icon">${icons?.calendar || ''}</span>
          <span class="kadergo-grid-label">Період вивантаження</span>
        </div>
        <div class="kadergo-grid-value" id="kg-grid-period-val">-</div>
      </div>
      <div class="kadergo-grid-card">
        <div class="kadergo-grid-header">
          <span class="kadergo-grid-icon">${icons?.layers || ''}</span>
          <span class="kadergo-grid-label">Режим</span>
        </div>
        <div class="kadergo-grid-value" id="kg-grid-mode-val">-</div>
      </div>
    `;

    // 5. Format Switcher
    const formatSection = document.createElement('div');
    formatSection.className = 'kadergo-format-section';
    formatSection.innerHTML = `
      <div class="kadergo-format-title">Формат:</div>
      <div class="kadergo-format-options" id="kg-format-options"></div>
    `;

    // 6. File Chips Section
    const fileSection = document.createElement('div');
    fileSection.className = 'kadergo-file-section';
    fileSection.innerHTML = `
      <div class="kadergo-file-section-title">
        <span class="kadergo-grid-icon">${icons?.fileSpreadsheet || ''}</span>
        <span>Файли збереження:</span>
      </div>
      <div class="kadergo-file-chips-wrap" id="kg-file-chips-wrap"></div>
    `;

    // 7. Footer
    const footer = document.createElement('div');
    footer.className = 'kadergo-modal-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'kadergo-modal-btn-cancel';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Скасувати';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'kadergo-modal-btn-confirm';
    confirmBtn.type = 'button';

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    body.appendChild(tabsWrap);
    body.appendChild(heroCard);
    body.appendChild(yearSection);
    body.appendChild(grid);
    body.appendChild(formatSection);
    body.appendChild(fileSection);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);

    // Flow & Loading State View (SVG Spinner & Success Pipa)
    const flowWrap = document.createElement('div');
    flowWrap.className = 'kadergo-modal-flow-wrap';
    flowWrap.id = 'kg-modal-flow-wrap';
    flowWrap.style.display = 'none';
    flowWrap.innerHTML = `
      <div class="kadergo-flow-svg-box">
        ${kadergoFlowSvg || ''}
      </div>
      <div class="kadergo-flow-info">
        <div class="kadergo-flow-stage-card" id="kg-stage-card">
          <div class="kadergo-flow-top-row">
            <div class="kadergo-flow-live-pill" id="kg-flow-live-pill">
              <span class="kadergo-flow-pulse-dot"></span>
              <span class="kadergo-flow-live-label" id="kg-flow-live-label">ОБРОБКА ДАНИХ</span>
            </div>
            <div class="kadergo-flow-percent-badge" id="kg-flow-badge">
              <span id="kg-flow-percent">0%</span>
            </div>
          </div>

          <!-- Month Banner (Designos hónap & lépésjelző, szögletes zárójelek nélkül) -->
          <div class="kadergo-flow-month-banner" id="kg-flow-month-banner">
            <div class="kadergo-flow-month-badge">
              <span class="kadergo-flow-calendar-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              <span class="kadergo-flow-month-name" id="kg-flow-month-name">Ініціалізація KaderGo...</span>
            </div>
            <div class="kadergo-flow-step-tag" id="kg-flow-step-tag">
              Запуск
            </div>
          </div>

          <!-- Sub-card with RRO and activity detail -->
          <div class="kadergo-flow-sub-card">
            <span class="kadergo-flow-sub-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
            <span class="kadergo-flow-subtitle" id="kg-flow-subtitle">Підготовка до збору даних...</span>
          </div>

          <div class="kadergo-flow-progress-bar-wrap">
            <div class="kadergo-flow-progress-bar" id="kg-flow-progress-bar" style="width: 0%;">
              <div class="kadergo-flow-bar-shimmer"></div>
            </div>
          </div>

          <div class="kadergo-flow-card-footer">
            <span class="kadergo-flow-footer-text" id="kg-flow-footer-text">Синхронізація з кабінетом платника податків</span>
            <span class="kadergo-flow-footer-brand">KaderGo</span>
          </div>
        </div>
      </div>
    `;

    card.appendChild(flowWrap);
    overlay.appendChild(card);

    return {
      overlay,
      card,
      header,
      titleWrap,
      minimizeBtn,
      closeBtn,
      body,
      tabsWrap,
      heroCard,
      yearSection,
      yearChipsContainer,
      grid,
      formatSection,
      formatOptionsWrap: formatSection.querySelector('#kg-format-options'),
      fileSection,
      fileChipsWrap: fileSection.querySelector('#kg-file-chips-wrap'),
      footer,
      cancelBtn,
      confirmBtn,
      flowWrap,
      // Internal flow elements
      flowElements: {
        stageCard: card.querySelector('#kg-stage-card'),
        livePill: card.querySelector('#kg-flow-live-pill'),
        liveLabel: card.querySelector('#kg-flow-live-label'),
        badge: card.querySelector('#kg-flow-badge'),
        percent: card.querySelector('#kg-flow-percent'),
        monthBanner: card.querySelector('#kg-flow-month-banner'),
        monthName: card.querySelector('#kg-flow-month-name'),
        stepTag: card.querySelector('#kg-flow-step-tag'),
        subtitle: card.querySelector('#kg-flow-subtitle'),
        progressBar: card.querySelector('#kg-flow-progress-bar'),
        footerText: card.querySelector('#kg-flow-footer-text')
      }
    };
  }

  window.KaderGo.ModalTemplates = {
    createModalDom
  };
})();
