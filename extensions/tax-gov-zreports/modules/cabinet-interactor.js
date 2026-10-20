// ==============================================================================
// KaderGo - Cabinet Interactor (Angular / PrimeNG DOM Automation)
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function getPeriodInputs() {
    const fromInput = document.querySelector('p-datepicker[formcontrolname="tsFrom"] input') ||
                      document.querySelector('input[placeholder="з"]') ||
                      document.querySelector('p-calendar[formcontrolname="tsFrom"] input');
    const toInput = document.querySelector('p-datepicker[formcontrolname="tsTo"] input') ||
                    document.querySelector('input[placeholder="по"]') ||
                    document.querySelector('p-calendar[formcontrolname="tsTo"] input');
    return { fromInput, toInput };
  }

  function hasValidPeriod() {
    const { fromInput, toInput } = getPeriodInputs();
    if (!fromInput || !toInput) return false;
    const fromVal = (fromInput.value || '').trim();
    const toVal = (toInput.value || '').trim();
    if (!fromVal || !toVal) return false;
    const dateRegex = /^\d{1,2}\.\d{1,2}\.\d{2,4}$/;
    return dateRegex.test(fromVal) && dateRegex.test(toVal);
  }

  async function setDatepickerValue(input, dateStr) {
    if (!input || !dateStr) return;

    input.focus();
    if (typeof input.select === 'function') {
      input.select();
    }

    let inserted = false;
    try {
      inserted = document.execCommand('insertText', false, dateStr);
    } catch (e) {
      inserted = false;
    }

    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (!inserted || input.value !== dateStr) {
      if (descriptor && descriptor.set) {
        descriptor.set.call(input, dateStr);
      } else {
        input.value = dateStr;
      }
    }

    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));

    // Закриваємо оверлей PrimeNG без виклику document.body.click() (який спричиняв скидання дати)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));

    input.blur();
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));

    // Якщо PrimeNG на blur спробував скинути значення — примусово фіксуємо потрібну дату
    if (input.value !== dateStr) {
      if (descriptor && descriptor.set) {
        descriptor.set.call(input, dateStr);
      } else {
        input.value = dateStr;
      }
      input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    }
    await delay(80);
  }

  async function applyDateRangeToForm(startStr, endStr) {
    const { fromInput, toInput } = getPeriodInputs();
    if (fromInput && fromInput.value !== startStr) {
      await setDatepickerValue(fromInput, startStr);
    }
    if (toInput && toInput.value !== endStr) {
      await setDatepickerValue(toInput, endStr);
    }
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    await delay(150);
  }

  function findAutocompleteElements() {
    const comp = document.querySelector('p-autocomplete[formcontrolname="fn"]') ||
                 document.querySelector('p-autocomplete');
    if (!comp) return null;

    const input = comp.querySelector('input.p-autocomplete-input') || comp.querySelector('input');
    const dropdownBtn = comp.querySelector('button.p-autocomplete-dropdown') || comp.querySelector('button');

    return { comp, input, dropdownBtn };
  }

  function isAutocompleteLoading() {
    const comp = document.querySelector('p-autocomplete[formcontrolname="fn"]') ||
                 document.querySelector('p-autocomplete');
    if (!comp) return false;
    const spinner = comp.querySelector('spinnericon, .p-autocomplete-loader, .p-icon-spin');
    return !!(spinner && window.getComputedStyle(spinner).display !== 'none');
  }

  function getAutocompleteListItems() {
    const selectors = [
      'li.p-autocomplete-option',
      'li.p-autocomplete-item',
      '[data-pc-section="option"]',
      '[data-pc-section="item"]',
      'ul.p-autocomplete-list > li',
      'ul.p-autocomplete-items > li',
      'ul[role="listbox"] > li',
      'li[role="option"]',
      '.p-autocomplete-panel li',
      '.p-autocomplete-overlay li',
      'p-overlay li',
      '.p-overlay-content li',
      '.p-overlay li'
    ];

    for (const sel of selectors) {
      const elements = document.querySelectorAll(sel);
      if (elements && elements.length > 0) {
        const validLis = Array.from(elements).filter(el => {
          const txt = (el.textContent || '').trim();
          return txt.length > 0 &&
                 !el.classList.contains('p-autocomplete-empty-message') &&
                 !el.classList.contains('p-autocomplete-loader');
        });
        if (validLis.length > 0) {
          return validLis;
        }
      }
    }

    return [];
  }

  async function simulateTypeIntoInput(input, text) {
    if (!input) return;

    input.focus();
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

    // Спочатку очищаємо поле, щоб Angular відстежив зміну
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(input, '');
    } else {
      input.value = '';
    }
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    await delay(60);

    let currentVal = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      currentVal += ch;

      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: ch,
        code: `Digit${ch}`,
        bubbles: true,
        cancelable: true
      }));

      if (descriptor && descriptor.set) {
        descriptor.set.call(input, currentVal);
      } else {
        input.value = currentVal;
      }

      input.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: ch,
        inputType: 'insertText'
      }));

      input.dispatchEvent(new KeyboardEvent('keyup', {
        key: ch,
        code: `Digit${ch}`,
        bubbles: true,
        cancelable: true
      }));

      await delay(40);
    }

    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }

  async function openAutocompleteSuggestions(query = '400') {
    const auto = findAutocompleteElements();
    if (!auto || !auto.input) return [];

    const { input } = auto;
    const cleanQuery = query ? String(query).trim() : '400';

    // 1. Якщо список вже відкритий і в ньому є елементи
    let items = getAutocompleteListItems();
    if (items.length > 0) {
      return items;
    }

    // 2. Вводимо запит '400' у поле з повною емуляцією для PrimeNG
    await simulateTypeIntoInput(input, cleanQuery);

    // 3. Чекаємо відповіді сервера та появи списку пропозицій
    const start = Date.now();
    const maxWaitMs = (window.KaderGo.Config && window.KaderGo.Config.MAX_AUTOCOMPLETE_WAIT_MS) || 9500;

    while (Date.now() - start < maxWaitMs) {
      items = getAutocompleteListItems();
      if (items.length > 0) {
        return items;
      }

      // Якщо спінер завантаження ще активний — терпляче чекаємо і в жодному разі не клікаємо кнопку
      if (isAutocompleteLoading()) {
        await delay(150);
        continue;
      }

      // Якщо минуло понад 3 секунди, спінера немає, але й список ще не з'явився — спробуємо ArrowDown
      if (Date.now() - start > 3000 && Date.now() - start < 3200) {
        input.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          code: 'ArrowDown',
          keyCode: 40,
          which: 40,
          bubbles: true,
          cancelable: true
        }));
      }

      await delay(100);
    }

    await delay(200);
    return getAutocompleteListItems();
  }

  function closeAutocompletePanel() {
    const auto = findAutocompleteElements();
    if (auto && auto.input) {
      auto.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      auto.input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
    }
    const panels = document.querySelectorAll('.p-autocomplete-panel, .p-autocomplete-overlay');
    panels.forEach(p => {
      if (p && p.style && window.getComputedStyle(p).display !== 'none') {
        p.style.display = 'none';
      }
    });
  }

  async function discoverAllFiscalNumbers() {
    const foundMap = new Map();
    const Scraper = window.KaderGo.Scraper;

    // 1. Фіскальні номери в уже завантаженій таблиці (якщо є)
    const table = Scraper ? Scraper.findTable() : document.querySelector('table');
    if (table) {
      const tds = table.querySelectorAll('tbody td');
      for (const td of tds) {
        const text = (td.textContent || '').trim();
        const match = text.match(/\b(400\d{5,})\b/) || text.match(/\b(400\d{3,})\b/);
        if (match && !foundMap.has(match[1])) {
          foundMap.set(match[1], { fn: match[1], label: match[1] });
        }
      }
    }

    // 2. ЗАВЖДИ запитуємо список пропозицій по '400', щоб знайти всі РРО
    const items = await openAutocompleteSuggestions('400');
    console.log(`[KaderGo] Отримано ${items.length} пропозицій для '400'`);

    for (const item of items) {
      const text = (item.textContent || '').trim();
      const match = text.match(/\b(400\d{5,})\b/) || text.match(/\b(400\d{3,})\b/) || text.match(/\b(\d{7,12})\b/);
      if (match) {
        foundMap.set(match[1], { fn: match[1], label: text });
      } else if (text.startsWith('400')) {
        const fn = text.split(/\s+/)[0];
        if (fn.length >= 6) {
          foundMap.set(fn, { fn, label: text });
        }
      }
    }

    // Якщо все ще нічого не знайдено, але в полі вводу було значення (не просто 400)
    const auto = findAutocompleteElements();
    if (foundMap.size === 0 && auto && auto.input && auto.input.value) {
      const val = auto.input.value.trim();
      if (val !== '400') {
        const m = val.match(/\b(400\d{3,})\b/) || val.match(/\b(\d{7,12})\b/);
        if (m) {
          foundMap.set(m[1], { fn: m[1], label: val });
        }
      }
    }

    closeAutocompletePanel();
    return Array.from(foundMap.values());
  }

  async function selectFiscalNumber(targetFn) {
    if (!targetFn) return false;
    const auto = findAutocompleteElements();
    if (!auto || !auto.input) return false;

    const cleanFn = String(targetFn).trim();

    // 1. Якщо цей номер вже повноцінно стоїть у полі — нічого не чіпаємо
    if (auto.input.value && auto.input.value.includes(cleanFn) && auto.input.value.trim() !== '400') {
      closeAutocompletePanel();
      return true;
    }

    // 2. Отримуємо список пропозицій по '400'
    let items = getAutocompleteListItems();
    if (items.length === 0) {
      items = await openAutocompleteSuggestions('400');
    }

    // 3. Шукаємо відповідний пункт у списку
    let targetLi = null;
    if (items && items.length > 0) {
      targetLi = items.find(el => (el.textContent || '').includes(cleanFn));
    }

    // 4. Якщо знайдено пункт у списку — емулюємо клік по ньому для фіксації в Angular
    if (targetLi) {
      targetLi.scrollIntoView({ block: 'nearest' });
      await delay(80);

      const opts = { bubbles: true, cancelable: true, view: window, composed: true, buttons: 1 };
      targetLi.dispatchEvent(new PointerEvent('pointerdown', opts));
      targetLi.dispatchEvent(new MouseEvent('mousedown', opts));
      targetLi.dispatchEvent(new PointerEvent('pointerup', opts));
      targetLi.dispatchEvent(new MouseEvent('mouseup', opts));
      targetLi.dispatchEvent(new MouseEvent('click', opts));
      targetLi.click();
      if (targetLi.firstElementChild) {
        targetLi.firstElementChild.click();
      }
      await delay(200);
    }

    // 5. Вставляємо (paste) чистий повний номер безпосередньо у поле, якщо залишилось '400' або не повний номер
    if (!auto.input.value || !auto.input.value.includes(cleanFn) || auto.input.value.trim() === '400') {
      auto.input.focus();
      if (typeof auto.input.select === 'function') {
        auto.input.select();
      }

      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, cleanFn);
      } catch (e) {
        inserted = false;
      }

      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      if (!inserted || auto.input.value !== cleanFn) {
        if (descriptor && descriptor.set) {
          descriptor.set.call(auto.input, cleanFn);
        } else {
          auto.input.value = cleanFn;
        }
      }

      auto.input.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: cleanFn,
        inputType: 'insertFromPaste'
      }));
      auto.input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      auto.input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

      // Enter для фіксації вибору
      auto.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      auto.input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    }

    closeAutocompletePanel();
    await delay(120);
    return true;
  }

  function getCurrentlySelectedFiscalNumber() {
    const auto = findAutocompleteElements();
    if (auto && auto.input && auto.input.value) {
      const val = auto.input.value.trim();
      // '400' сама по собі не є номером
      if (val !== '400') {
        const match = val.match(/\b(400\d{5,})\b/) || val.match(/\b(400\d{3,})\b/);
        if (match) return match[1];
      }
    }

    const Scraper = window.KaderGo.Scraper;
    const table = Scraper ? Scraper.findTable() : document.querySelector('table');
    if (table) {
      const tds = table.querySelectorAll('tbody td');
      for (const td of tds) {
        const text = (td.textContent || '').trim();
        const match = text.match(/\b(400\d{5,})\b/) || text.match(/\b(400\d{3,})\b/);
        if (match) return match[1];
      }
    }

    return null;
  }

  function findSearchButton() {
    const buttons = document.querySelectorAll('button');
    for (const b of buttons) {
      const txt = (b.textContent || '').trim();
      if (txt === 'Пошук' || b.querySelector('.pi-search')) {
        return b;
      }
    }
    return document.querySelector('button[type="submit"]');
  }

  async function triggerSearch() {
    const searchBtn = findSearchButton();
    if (!searchBtn) return false;

    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    await delay(100);

    searchBtn.scrollIntoView({ block: 'nearest' });
    searchBtn.focus();

    const opts = { bubbles: true, cancelable: true, view: window };
    searchBtn.dispatchEvent(new MouseEvent('mousedown', opts));
    searchBtn.dispatchEvent(new MouseEvent('mouseup', opts));
    searchBtn.dispatchEvent(new MouseEvent('click', opts));
    searchBtn.click();

    return true;
  }

  function hasEmptyStateMessage() {
    const Scraper = window.KaderGo.Scraper;
    const table = Scraper ? Scraper.findTable() : document.querySelector('table');
    if (table) {
      const emptyRow = table.querySelector('.p-datatable-emptymessage');
      if (emptyRow && window.getComputedStyle(emptyRow).display !== 'none') {
        return true;
      }
      const tbody = table.querySelector('tbody');
      if (tbody) {
        const text = (tbody.textContent || '').toLowerCase();
        if (text.includes('даних не знайдено') || text.includes('не знайдено записів') || text.includes('не знайдено')) {
          return true;
        }
      }
    }

    const container = document.querySelector('app-eltype-z-sod') || document.body;
    const msgs = container.querySelectorAll('.p-messages, .p-message, .p-datatable-emptymessage, .alert, .ui-messages');
    for (let i = 0; i < msgs.length; i++) {
      const txt = (msgs[i].textContent || '').toLowerCase();
      if (txt.includes('даних не знайдено') || txt.includes('не знайдено')) {
        return true;
      }
    }
    return false;
  }

  async function waitForTableReady(targetFn, oldFingerprint, maxWaitMs) {
    const timeout = maxWaitMs || (window.KaderGo.Config && window.KaderGo.Config.MAX_TABLE_WAIT_MS) || 30000;
    const Scraper = window.KaderGo.Scraper;
    const start = Date.now();
    await delay(300);

    while (Date.now() - start < timeout) {
      // 1. Швидкий перехід: якщо з'явився напис «Даних не знайдено» — миттєво повертаємося без очікування
      if (hasEmptyStateMessage()) {
        console.log('[KaderGo] Виявлено «Даних не знайдено» — миттєвий перехід далі.');
        await delay(100);
        return { ready: true, hasData: false };
      }

      // 2. Якщо спінер/маска завантаження активні — сайт обробляє запит, терпляче чекаємо
      const mask = document.querySelector('.p-datatable-mask, .p-datatable-loading-overlay, .p-datatable-loading-icon, .pi-spin');
      if (mask && window.getComputedStyle(mask).display !== 'none') {
        await delay(150);
        continue;
      }

      // 3. Перевіряємо наявність оновлених рядків у таблиці
      const table = Scraper ? Scraper.findTable() : document.querySelector('table');
      if (table) {
        const tbody = table.querySelector('tbody');
        if (tbody) {
          if (tbody.querySelector('.p-datatable-emptymessage')) {
            return { ready: true, hasData: false };
          }

          const currentFingerprint = tbody.innerText || '';
          if (oldFingerprint) {
            // Якщо таблиця містила попередні дані — чекаємо оновлення вмісту
            if (currentFingerprint !== oldFingerprint && currentFingerprint.length > 0) {
              await delay(200);
              return { ready: true, hasData: true };
            }
          } else {
            // Якщо таблиця спочатку була порожньою — шукаємо появу рядків
            const rows = tbody.querySelectorAll('tr');
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              if (row.cells && row.cells.length > 3 && !row.classList.contains('p-datatable-emptymessage')) {
                if (!targetFn || (row.textContent || '').includes(targetFn)) {
                  await delay(200);
                  return { ready: true, hasData: true };
                }
              }
            }
          }
        }
      }

      await delay(150);
    }

    return { ready: false, hasData: false };
  }

  window.KaderGo.Cabinet = {
    delay,
    getPeriodInputs,
    hasValidPeriod,
    setDatepickerValue,
    applyDateRangeToForm,
    findAutocompleteElements,
    isAutocompleteLoading,
    getAutocompleteListItems,
    openAutocompleteSuggestions,
    closeAutocompletePanel,
    discoverAllFiscalNumbers,
    selectFiscalNumber,
    getCurrentlySelectedFiscalNumber,
    findSearchButton,
    triggerSearch,
    hasEmptyStateMessage,
    waitForTableReady
  };
})();
