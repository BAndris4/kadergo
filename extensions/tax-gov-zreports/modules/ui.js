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
  let btnAllEl = null;
  let spinnerAllEl = null;
  let labelAllEl = null;
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
    const allIconSvg = '<svg class="kadergo-btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>';
    const spinnerSvg = '<svg class="kadergo-loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f8a44c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>';

    // 1. Кнопка "Завантажити в Excel" (поточний РРО помісячно)
    btnEl = document.createElement('button');
    btnEl.id = 'tax-gov-download-excel-btn';
    btnEl.className = 'kadergo-app-btn';
    btnEl.type = 'button';
    btnEl.disabled = true;
    btnEl.setAttribute('title', 'Виконайте пошук в кабінеті, щоб відобразити дані');

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

    // 2. Кнопка "Всі РРО в Excel" (автоматичний збір по всіх 400..)
    btnAllEl = document.createElement('button');
    btnAllEl.id = 'tax-gov-download-all-btn';
    btnAllEl.className = 'kadergo-app-btn kadergo-all-btn';
    btnAllEl.type = 'button';
    btnAllEl.disabled = true;
    btnAllEl.setAttribute('title', 'Завантажити весь оборот по всіх РРО в один файл Excel');

    const iconAllSpan = document.createElement('span');
    iconAllSpan.className = 'kadergo-icon-wrapper';
    iconAllSpan.innerHTML = allIconSvg;

    spinnerAllEl = document.createElement('span');
    spinnerAllEl.className = 'kadergo-spinner-wrapper';
    spinnerAllEl.style.display = 'none';

    labelAllEl = document.createElement('span');
    labelAllEl.className = 'kadergo-app-label';
    labelAllEl.textContent = 'Всі РРО в Excel';

    btnAllEl.appendChild(iconAllSpan);
    btnAllEl.appendChild(spinnerAllEl);
    btnAllEl.appendChild(labelAllEl);

    btnEl.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!window.KaderGo.Cabinet.hasValidPeriod()) {
        alert('Будь ласка, вкажіть період (дати «з» та «по») перед завантаженням.');
        return;
      }

      const { fromInput, toInput } = window.KaderGo.Cabinet.getPeriodInputs();
      const origFrom = (fromInput.value || '').trim();
      const origTo = (toInput.value || '').trim();
      const intervals = window.KaderGo.DateUtils.splitDateRangeIntoMonthlyIntervals(origFrom, origTo);
      const targetFn = window.KaderGo.Cabinet.getCurrentlySelectedFiscalNumber();

      // 1. Відкриваємо кастомне вікно вибору папки та підтвердження (українською мовою)
      let dirHandle = null;
      let modalRes = null;
      if (window.KaderGo.Modal && typeof window.KaderGo.Modal.openExportModal === 'function') {
        modalRes = await window.KaderGo.Modal.openExportModal({
          periodFrom: origFrom,
          periodTo: origTo,
          intervals,
          isAllRro: false,
          targetFn
        });

        if (!modalRes || !modalRes.proceed) {
          console.log('[KaderGo] Експорт скасовано користувачем.');
          return;
        }

        dirHandle = modalRes.dirHandle;
      }

      // 2. Запускаємо вивантаження у вказану папку
      const res = await window.KaderGo.Exporter.downloadSingleFiscalReports({
        dirHandle,
        exportFormat: modalRes?.format || 'xlsx',
        onStart: () => {
          btnEl.disabled = true;
          btnAllEl.disabled = true;
          btnEl.classList.add('loading');
          spinnerEl.innerHTML = spinnerSvg;
          spinnerEl.style.display = 'inline-flex';
          labelEl.textContent = 'Підготовка...';
        },
        onProgress: ({ statusText }) => {
          if (statusText) labelEl.textContent = statusText;
        },
        onEnd: () => {
          btnEl.classList.remove('loading');
          spinnerEl.innerHTML = '';
          spinnerEl.style.display = 'none';
          labelEl.textContent = 'Завантажити в Excel';
          updateUI();
        }
      });

      if (res && res.success && !res.cancelled) {
        labelEl.textContent = res.empty ? 'Немає даних' : 'Збережено!';
        setTimeout(() => {
          if (!window.KaderGo.Exporter.isDownloading()) {
            labelEl.textContent = 'Завантажити в Excel';
          }
        }, 2200);
      }
    });

    btnAllEl.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!window.KaderGo.Cabinet.hasValidPeriod()) {
        alert('Будь ласка, вкажіть період (дати «з» та «по») перед завантаженням.');
        return;
      }

      const { fromInput, toInput } = window.KaderGo.Cabinet.getPeriodInputs();
      const origFrom = (fromInput.value || '').trim();
      const origTo = (toInput.value || '').trim();
      const intervals = window.KaderGo.DateUtils.splitDateRangeIntoMonthlyIntervals(origFrom, origTo);

      // 1. Відкриваємо кастомне вікно вибору папки та підтвердження (українською мовою)
      let dirHandle = null;
      let modalRes = null;
      if (window.KaderGo.Modal && typeof window.KaderGo.Modal.openExportModal === 'function') {
        modalRes = await window.KaderGo.Modal.openExportModal({
          periodFrom: origFrom,
          periodTo: origTo,
          intervals,
          isAllRro: true
        });

        if (!modalRes || !modalRes.proceed) {
          console.log('[KaderGo] Експорт скасовано користувачем.');
          return;
        }

        dirHandle = modalRes.dirHandle;
      }

      // 2. Запускаємо пакетне вивантаження всіх РРО
      const res = await window.KaderGo.Exporter.downloadAllFiscalReports({
        dirHandle,
        exportFormat: modalRes?.format || 'xlsx',
        onStart: () => {
          btnEl.disabled = true;
          btnAllEl.disabled = true;
          btnAllEl.classList.add('loading');
          spinnerAllEl.innerHTML = spinnerSvg;
          spinnerAllEl.style.display = 'inline-flex';
          labelAllEl.textContent = 'Пошук РРО...';
        },
        onProgress: ({ statusText }) => {
          if (statusText) labelAllEl.textContent = statusText;
        },
        onEnd: () => {
          btnAllEl.classList.remove('loading');
          spinnerAllEl.innerHTML = '';
          spinnerAllEl.style.display = 'none';
          labelAllEl.textContent = 'Всі РРО в Excel';
          updateUI();
        }
      });

      if (res && res.success && !res.cancelled) {
        labelAllEl.textContent = res.empty ? 'Немає даних' : 'Збережено!';
        setTimeout(() => {
          if (!window.KaderGo.Exporter.isDownloading()) {
            labelAllEl.textContent = 'Всі РРО в Excel';
          }
        }, 2200);
      }
    });

    wrapperEl.appendChild(btnEl);
    wrapperEl.appendChild(btnAllEl);
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

    const validPeriod = window.KaderGo.Cabinet.hasValidPeriod();

    // Стан кнопки одного РРО
    if (!validPeriod) {
      btnEl.disabled = true;
      btnEl.setAttribute('title', 'Вкажіть період (дати «з» та «по»)');
    } else {
      btnEl.disabled = false;
      btnEl.setAttribute('title', 'Завантажити оборот по обраному РРО помісячно в окремі файли Excel');
    }

    // Стан кнопки всіх РРО
    const auto = window.KaderGo.Cabinet.findAutocompleteElements();
    if (!validPeriod) {
      btnAllEl.disabled = true;
      btnAllEl.setAttribute('title', 'Вкажіть період (дати «з» та «по»)');
    } else if (auto && auto.input) {
      btnAllEl.disabled = false;
      btnAllEl.setAttribute('title', 'Завантажити оборот по всіх РРО помісячно в окремі файли Excel');
    } else {
      btnAllEl.disabled = true;
      btnAllEl.setAttribute('title', 'Поле вибору РРО не знайдено');
    }
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
