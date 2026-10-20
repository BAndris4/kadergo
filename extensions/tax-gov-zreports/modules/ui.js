// ==============================================================================
// KaderGo - In-page UI Injection, Button Styling & SPA Lifecycle
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  let wrapperEl = null;
  let btnEl = null;
  let spinnerEl = null;
  let labelEl = null;
  let pollInterval = null;

  function isTargetPage() {
    try {
      const href = window.location.href;
      const prefix = window.KaderGo.Config.TARGET_URL_PREFIX;
      return href.startsWith(prefix);
    } catch (e) {
      return false;
    }
  }

  function findActionButtonsPlacement() {
    const buttons = document.querySelectorAll('button');

    for (const b of buttons) {
      const text = (b.textContent || '').trim();
      if (text.includes('Експорт в Excel') || text.includes('Експорт в excel')) {
        const pBtn = b.closest('p-button') || b;
        if (pBtn && pBtn.parentElement) {
          return { container: pBtn.parentElement, targetSibling: pBtn };
        }
      }
    }

    for (const b of buttons) {
      const text = (b.textContent || '').trim();
      if (text === 'Очистити' || text === 'Пошук') {
        const pBtn = b.closest('p-button') || b;
        if (pBtn && pBtn.parentElement) {
          return { container: pBtn.parentElement, targetSibling: pBtn.parentElement.lastElementChild };
        }
      }
    }

    const formFlex = document.querySelector('app-eltype-z-sod form .p-d-flex, form .p-d-flex');
    if (formFlex) {
      return { container: formFlex, targetSibling: formFlex.lastElementChild };
    }

    return null;
  }

  function ensureButtonCreated() {
    if (btnEl) return;

    wrapperEl = document.createElement('div');
    wrapperEl.id = 'tax-gov-kadergo-btn-wrapper';
    wrapperEl.className = 'p-mb-2 p-mr-2';

    // Heroicons SVG
    const downloadIconSvg = '<svg class="kadergo-btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>';
    const spinnerSvg = '<svg class="kadergo-loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f8a44c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>';

    // Єдина уніфікована кнопка експорту KaderGo
    btnEl = document.createElement('button');
    btnEl.id = 'tax-gov-download-excel-btn';
    btnEl.className = 'kadergo-app-btn';
    btnEl.type = 'button';
    btnEl.disabled = false;
    btnEl.setAttribute('title', 'Експорт звітів в Excel або формування Книги доходів');

    const iconSpan = document.createElement('span');
    iconSpan.className = 'kadergo-icon-wrapper';
    iconSpan.innerHTML = downloadIconSvg;

    spinnerEl = document.createElement('span');
    spinnerEl.className = 'kadergo-spinner-wrapper';
    spinnerEl.style.display = 'none';

    labelEl = document.createElement('span');
    labelEl.className = 'kadergo-app-label';
    labelEl.textContent = 'Завантажити в Excel';

    btnEl.appendChild(iconSpan);
    btnEl.appendChild(spinnerEl);
    btnEl.appendChild(labelEl);

    // Click Handler: Відкриває єдине уніфіковане модальне вікно з 3 режимами
    btnEl.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // If downloading and minimized to background, clicking the button restores the modal!
      if (window.KaderGo.Exporter && window.KaderGo.Exporter.isDownloading()) {
        if (window.KaderGo.Modal && typeof window.KaderGo.Modal.restoreModal === 'function') {
          window.KaderGo.Modal.restoreModal();
        }
        return;
      }

      if (!window.KaderGo.Modal || typeof window.KaderGo.Modal.openUnifiedExportModal !== 'function') {
        return;
      }

      const modalRes = await window.KaderGo.Modal.openUnifiedExportModal();
      if (!modalRes || !modalRes.proceed) {
        console.log('[KaderGo] Експорт скасовано користувачем.');
        return;
      }

      const setLoadingState = (loading, initialStatus) => {
        if (loading) {
          btnEl.disabled = true;
          btnEl.classList.add('loading');
          spinnerEl.innerHTML = spinnerSvg;
          spinnerEl.style.display = 'inline-flex';
          labelEl.textContent = initialStatus || 'Підготовка...';
        } else {
          btnEl.classList.remove('loading');
          spinnerEl.innerHTML = '';
          spinnerEl.style.display = 'none';
          labelEl.textContent = 'Завантажити в Excel';
          updateUI();
        }
      };

      const flow = modalRes.flow;

      const progressCallback = ({ statusText, detailText, progressPercent, ...info }) => {
        if (flow) {
          const rawMonth = info.monthName || (info.interval ? info.interval.monthName : null);
          const capMonth = rawMonth ? (rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1)) : null;
          flow.setProgress({
            title: statusText || 'Обробка даних...',
            subtitle: detailText || (capMonth ? `${capMonth} ${info.year || ''}` : ''),
            progressPercent,
            monthName: capMonth,
            year: info.year || (info.interval ? info.interval.year : null),
            monthStep: info.monthStep || info.step || null,
            monthTotal: info.monthTotal || info.total || null,
            stepText: info.stepText || null,
            rroStep: info.rroStep || null,
            rroTotal: info.rroTotal || null,
            fn: info.fn || null
          });
        }
        if (statusText) labelEl.textContent = statusText;
      };

      const filesGeneratedCallback = async ({ title, subtitle } = {}) => {
        if (flow) {
          await flow.setSuccess({ title, subtitle });
        }
      };

      const endCallback = async () => {
        if (flow) {
          await flow.closeWithOutro();
        }
        setLoadingState(false);
      };

      const handleDone = (res) => {
        if (res && res.success && !res.cancelled) {
          labelEl.textContent = res.empty ? 'Немає даних' : 'Збережено!';
          setTimeout(() => {
            if (!window.KaderGo.Exporter.isDownloading()) {
              labelEl.textContent = 'Завантажити в Excel';
            }
          }, 2200);
        }
      };

      // 1. Обраний РРО
      if (modalRes.mode === 'single') {
        const res = await window.KaderGo.Exporter.downloadSingleFiscalReports({
          exportFormat: modalRes.format || 'xlsx',
          targetFn: modalRes.targetFn,
          intervals: modalRes.intervals,
          flow: modalRes.flow,
          onStart: () => setLoadingState(true, 'Підготовка...'),
          onProgress: progressCallback,
          onFilesGenerated: filesGeneratedCallback,
          onEnd: endCallback
        });
        handleDone(res);

      // 2. Всі РРО
      } else if (modalRes.mode === 'all') {
        const res = await window.KaderGo.Exporter.downloadAllFiscalReports({
          exportFormat: modalRes.format || 'xlsx',
          intervals: modalRes.intervals,
          flow: modalRes.flow,
          onStart: () => setLoadingState(true, 'Пошук РРО...'),
          onProgress: progressCallback,
          onFilesGenerated: filesGeneratedCallback,
          onEnd: endCallback
        });
        handleDone(res);

      // 3. Книга обліку доходів за рік
      } else if (modalRes.mode === 'income_book') {
        const currentYear = new Date().getFullYear();
        const res = await window.KaderGo.Exporter.downloadYearIncomeBookAndReports({
          year: modalRes.year || currentYear,
          exportFormat: modalRes.format || 'book',
          flow: modalRes.flow,
          onStart: () => setLoadingState(true, 'Підготовка...'),
          onProgress: progressCallback,
          onFilesGenerated: filesGeneratedCallback,
          onEnd: endCallback
        });
        handleDone(res);
      }
    });

    wrapperEl.appendChild(btnEl);
  }

  function updateUI() {
    if (!isTargetPage()) {
      if (wrapperEl && wrapperEl.parentNode) {
        wrapperEl.remove();
      }
      return;
    }

    ensureButtonCreated();

    const placement = findActionButtonsPlacement();
    if (placement && placement.container) {
      if (!wrapperEl.isConnected || wrapperEl.parentElement !== placement.container) {
        if (placement.targetSibling && placement.targetSibling.nextSibling) {
          placement.container.insertBefore(wrapperEl, placement.targetSibling.nextSibling);
        } else {
          placement.container.appendChild(wrapperEl);
        }
      }
    }

    if (window.KaderGo.Exporter && window.KaderGo.Exporter.isDownloading()) {
      return;
    }

    btnEl.disabled = false;
    btnEl.setAttribute('title', 'Експорт звітів в Excel або формування Книги доходів');
  }

  function startObserverAndPolling() {
    updateUI();

    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(updateUI, 900);

    const observer = new MutationObserver(() => {
      updateUI();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('popstate', updateUI);
    window.addEventListener('hashchange', updateUI);

    const originalPushState = history.pushState;
    if (originalPushState) {
      history.pushState = function () {
        originalPushState.apply(this, arguments);
        setTimeout(updateUI, 100);
      };
    }

    const originalReplaceState = history.replaceState;
    if (originalReplaceState) {
      history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        setTimeout(updateUI, 100);
      };
    }
  }

  window.KaderGo.UI = {
    isTargetPage,
    ensureButtonCreated,
    updateUI,
    init: startObserverAndPolling
  };
})();
