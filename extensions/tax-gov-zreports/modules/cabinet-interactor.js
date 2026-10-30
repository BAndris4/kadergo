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
                 document.querySelector('p-autocomplete[name="fn"]') ||
                 document.querySelector('p-autocomplete');

    let input = comp ? (comp.querySelector('input.p-autocomplete-input') || comp.querySelector('input')) : null;
    if (!input) {
      input = document.querySelector('input[placeholder*="РРО"], input[placeholder*="рро"], input[placeholder*="фіскальн"], input[formcontrolname="fn"]');
    }

    const dropdownBtn = comp ? (comp.querySelector('button.p-autocomplete-dropdown') || comp.querySelector('button')) : null;

    return { comp: comp || (input ? input.closest('.p-autocomplete') : null), input, dropdownBtn };
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
    if (auto && auto.input) {
      const val = (auto.input.value || auto.input.getAttribute('value') || '').trim();
      // '400' сама по собі не є повним номером
      if (val && val !== '400') {
        const match = val.match(/\b(400\d{3,})\b/) || val.match(/\b(\d{7,12})\b/);
        if (match) return match[1];
      }
    }

    // Перевіряємо виділений або єдиний елемент списку autocomplete
    const activeItem = document.querySelector('.p-autocomplete-panel li.p-highlight, .p-autocomplete-panel li[aria-selected="true"], .p-autocomplete-token-label');
    if (activeItem) {
      const txt = (activeItem.textContent || '').trim();
      const match = txt.match(/\b(400\d{3,})\b/) || txt.match(/\b(\d{7,12})\b/);
      if (match) return match[1];
    }

    const Scraper = window.KaderGo.Scraper;
    const table = Scraper ? Scraper.findTable() : document.querySelector('table');
    if (table) {
      const tds = table.querySelectorAll('tbody td');
      for (const td of tds) {
        const text = (td.textContent || '').trim();
        const match = text.match(/\b(400\d{3,})\b/) || text.match(/\b(\d{7,12})\b/);
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
      const emptyRow = table.querySelector('.p-datatable-emptymessage, .p-datatable-empty-message');
      if (emptyRow && window.getComputedStyle(emptyRow).display !== 'none') {
        return true;
      }
      const tbody = table.querySelector('tbody');
      if (tbody) {
        const text = (tbody.textContent || '').toLowerCase();
        if (text.includes('даних не знайдено') || text.includes('не знайдено записів') || text.includes('не знайдено') || text.includes('немає даних')) {
          return true;
        }
      }
    }

    const container = document.querySelector('app-eltype-z-sod') || document.body;
    const msgs = container.querySelectorAll('.p-messages, .p-message, .p-datatable-emptymessage, .p-datatable-empty-message, .alert, .ui-messages');
    for (let i = 0; i < msgs.length; i++) {
      const txt = (msgs[i].textContent || '').toLowerCase();
      if (txt.includes('даних не знайдено') || txt.includes('не знайдено') || txt.includes('немає даних')) {
        return true;
      }
    }
    return false;
  }

  function hasValidDataRows(tbody, targetFn) {
    if (!tbody) return false;
    const cleanFn = targetFn ? String(targetFn).trim() : null;
    const rows = tbody.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.cells && row.cells.length > 3 &&
          !row.classList.contains('p-datatable-emptymessage') &&
          !row.classList.contains('p-datatable-empty-message')) {
        const rowText = row.textContent || '';
        if (rowText.toLowerCase().includes('даних не знайдено') || rowText.toLowerCase().includes('не знайдено')) {
          continue;
        }
        if (!cleanFn || rowText.includes(cleanFn)) {
          return true;
        }
      }
    }
    return false;
  }

  function isTableAlreadyLoadedFor(targetFn, interval) {
    if (!interval) return false;
    const { fromInput, toInput } = getPeriodInputs();
    const curFrom = (fromInput?.value || '').trim();
    const curTo = (toInput?.value || '').trim();

    // 1. Перевіряємо відповідність дат у формі
    if (curFrom !== interval.startStr || curTo !== interval.endStr) {
      return false;
    }

    // 2. Перевіряємо обраний РРО
    const curFn = getCurrentlySelectedFiscalNumber();
    if (targetFn && curFn && !curFn.includes(targetFn) && !targetFn.includes(curFn)) {
      return false;
    }

    // 3. Перевіряємо повідомлення про відсутність даних
    if (hasEmptyStateMessage()) {
      return false;
    }

    // 4. Перевіряємо індикатор завантаження
    const mask = document.querySelector('.p-datatable-mask, .p-datatable-loading-overlay, .p-datatable-loading-icon, .pi-spin');
    if (mask && window.getComputedStyle(mask).display !== 'none') {
      return false;
    }

    // 5. Перевіряємо таблицю та наявність валідних рядків
    const Scraper = window.KaderGo.Scraper;
    const table = Scraper ? Scraper.findTable() : document.querySelector('table');
    if (!table) return false;

    const tbody = table.querySelector('tbody');
    return hasValidDataRows(tbody, targetFn);
  }

  async function waitForTableReady(targetFn, oldFingerprint, maxWaitMs) {
    const timeout = maxWaitMs || (window.KaderGo.Config && window.KaderGo.Config.MAX_TABLE_WAIT_MS) || 15000;
    const Scraper = window.KaderGo.Scraper;
    const start = Date.now();
    let sawLoading = false;
    const cleanFn = targetFn ? String(targetFn).trim() : null;
    await delay(250);

    while (Date.now() - start < timeout) {
      // 1. Швидкий перехід: напис «Даних не знайдено»
      if (hasEmptyStateMessage()) {
        console.log('[KaderGo] Виявлено «Даних не знайдено» — миттєвий перехід далі.');
        await delay(100);
        return { ready: true, hasData: false };
      }

      // 2. Якщо спінер/маска завантаження активні — фіксуємо завантаження
      const mask = document.querySelector('.p-datatable-mask, .p-datatable-loading-overlay, .p-datatable-loading-icon, .pi-spin');
      const isMaskVisible = mask && window.getComputedStyle(mask).display !== 'none';
      if (isMaskVisible) {
        sawLoading = true;
        await delay(150);
        continue;
      }

      // 3. Якщо маска була активна і щойно зникла — запит завершено
      const table = Scraper ? Scraper.findTable() : document.querySelector('table');
      const tbody = table ? table.querySelector('tbody') : null;

      if (sawLoading && !isMaskVisible) {
        if (hasEmptyStateMessage()) {
          await delay(100);
          return { ready: true, hasData: false };
        }
        if (hasValidDataRows(tbody, cleanFn)) {
          await delay(200);
          return { ready: true, hasData: true };
        } else {
          await delay(100);
          return { ready: true, hasData: false };
        }
      }

      // 4. Якщо маска не фіксувалась (швидка відповідь) або оновлюється безпосередньо DOM
      if (tbody) {
        if (hasEmptyStateMessage()) {
          await delay(100);
          return { ready: true, hasData: false };
        }

        const currentFingerprint = tbody.innerText || '';

        if (oldFingerprint) {
          if (currentFingerprint !== oldFingerprint && currentFingerprint.length > 0) {
            if (hasValidDataRows(tbody, cleanFn)) {
              await delay(200);
              return { ready: true, hasData: true };
            } else {
              await delay(100);
              return { ready: true, hasData: false };
            }
          }

          if (Date.now() - start > 1800 && hasValidDataRows(tbody, cleanFn)) {
            await delay(150);
            return { ready: true, hasData: true };
          }
        } else {
          if (hasValidDataRows(tbody, cleanFn)) {
            await delay(200);
            return { ready: true, hasData: true };
          }
        }

        // Якщо минуло понад 3.5 секунди без спінера і немає рядків — не зависаємо на 30с
        if (Date.now() - start > 3500 && !sawLoading) {
          if (hasValidDataRows(tbody, cleanFn)) {
            return { ready: true, hasData: true };
          } else {
            return { ready: true, hasData: false };
          }
        }
      }

      await delay(150);
    }

    return { ready: false, hasData: false };
  }

  // ==============================================================================
  // FOP Group Autodetection (from https://cabinet.tax.gov.ua/account)
  // ==============================================================================

  function normalizeGroupNumber(raw) {
    if (!raw) return null;
    const str = String(raw).trim();
    if (!str) return null;

    // Direct digit 1-4
    if (/^[1-4]$/.test(str)) return str;

    // Roman numerals (Latin I, V or Cyrillic І, V)
    if (/^(?:III|ІІІ|iii|ііі)$/i.test(str)) return '3';
    if (/^(?:II|ІІ|ii|іі)$/i.test(str)) return '2';
    if (/^(?:IV|ІV|iv|іv)$/i.test(str)) return '4';
    if (/^(?:I|І|i|і)$/i.test(str)) return '1';

    // Ukrainian words
    if (/(?:трет|3\s*-?\s*т)/i.test(str)) return '3';
    if (/(?:друг|2\s*-?\s*г)/i.test(str)) return '2';
    if (/(?:перш|1\s*-?\s*ш)/i.test(str)) return '1';
    if (/(?:четверт|4\s*-?\s*т)/i.test(str)) return '4';

    // Matches like "3 група", "Група: 3", "3-тя група", "III група"
    const mNum = str.match(/\b([1-4])\s*(?:-?\s*(?:тя|га|ша|та))?\s*груп/i) ||
                 str.match(/груп[аи]?\s*[:\-–—]?\s*([1-4])\b/i) ||
                 str.match(/\b([1-4])\b/);
    if (mNum && mNum[1] && /^[1-4]$/.test(mNum[1])) {
      return mNum[1];
    }

    const mRom = str.match(/\b(III|ІІІ|II|ІІ|IV|ІV|I|І)\s*груп/i) ||
                 str.match(/груп[аи]?\s*[:\-–—]?\s*(III|ІІІ|II|ІІ|IV|ІV|I|І)\b/i);
    if (mRom && mRom[1]) {
      const r = mRom[1].toUpperCase();
      if (r === 'III' || r === 'ІІІ') return '3';
      if (r === 'II' || r === 'ІІ') return '2';
      if (r === 'IV' || r === 'ІV') return '4';
      if (r === 'I' || r === 'І') return '1';
    }

    return null;
  }

  function extractFopGroupFromDom(doc) {
    if (!doc) return null;

    try {
      // 1. Check Table Rows (most common in Tax Cabinet)
      const rows = doc.querySelectorAll('tr');
      for (const tr of rows) {
        const rowText = (tr.textContent || '').toLowerCase();
        if (rowText.includes('груп') || rowText.includes('єдин') || rowText.includes('платник єп')) {
          const cells = tr.querySelectorAll('td, th');
          for (let i = 0; i < cells.length; i++) {
            const cellText = (cells[i].textContent || '').trim();
            if (/груп/i.test(cellText)) {
              // 1a. Group number inside this cell itself
              const gSelf = normalizeGroupNumber(cellText);
              if (gSelf) return gSelf;
              // 1b. Group number in adjacent cell
              if (i + 1 < cells.length) {
                const gNext = normalizeGroupNumber(cells[i + 1].textContent);
                if (gNext) return gNext;
                const inp = cells[i + 1].querySelector('input');
                if (inp && inp.value) {
                  const gInp = normalizeGroupNumber(inp.value);
                  if (gInp) return gInp;
                }
              }
            }
          }
        }
      }

      // 2. Check PrimeNG field blocks, definitions, labels
      const allElements = doc.querySelectorAll('div, label, span, p, td, li, dt, dd');
      for (const el of allElements) {
        const text = (el.textContent || '').trim();
        if (/^груп[аи](?:\s+платника)?(?:\s+єдиного\s+податку)?\s*[:\-–—]?$/i.test(text) ||
            /^статус(?:\s+платника)?\s+єдиного\s+податку/i.test(text)) {
          if (el.nextElementSibling) {
            const g = normalizeGroupNumber(el.nextElementSibling.textContent);
            if (g) return g;
            const inp = el.nextElementSibling.querySelector('input');
            if (inp && inp.value) {
              const gInp = normalizeGroupNumber(inp.value);
              if (gInp) return gInp;
            }
          }
          if (el.parentElement && el.parentElement.nextElementSibling) {
            const g = normalizeGroupNumber(el.parentElement.nextElementSibling.textContent);
            if (g) return g;
            const inp = el.parentElement.nextElementSibling.querySelector('input');
            if (inp && inp.value) {
              const gInp = normalizeGroupNumber(inp.value);
              if (gInp) return gInp;
            }
          }
        }
      }

      // 3. Check Form Inputs
      const inputs = doc.querySelectorAll('input, select');
      for (const inp of inputs) {
        const attr = ((inp.getAttribute('formcontrolname') || '') + ' ' + (inp.name || '') + ' ' + (inp.id || '')).toLowerCase();
        if (/group|grupa|hrupa|epgroup/.test(attr)) {
          const g = normalizeGroupNumber(inp.value);
          if (g) return g;
        }
      }

      // 4. Regex Match over full body text
      const bodyText = doc.body ? (doc.body.innerText || doc.body.textContent || '') : '';
      const matches = [
        bodyText.match(/груп[аи](?:\s+платника)?(?:\s+єдиного\s+податку)?\s*[:\-–—]?\s*([1-4])\b/i),
        bodyText.match(/груп[аи](?:\s+платника)?(?:\s+єдиного\s+податку)?\s*[:\-–—]?\s*(III|ІІІ|II|ІІ|IV|ІV|I|І)\b/i),
        bodyText.match(/\b([1-4])\s*(?:-?\s*(?:тя|га|ша|та))?\s*груп/i),
        bodyText.match(/\b(III|ІІІ|II|ІІ|IV|ІV|I|І)\s*груп/i),
        bodyText.match(/платник\s+єдиного\s+податку\s*([1-4])\s*груп/i),
        bodyText.match(/платник\s+єдиного\s+податку\s*(III|ІІІ|II|ІІ|IV|ІV|I|І)\s*груп/i)
      ];

      for (const m of matches) {
        if (m && m[1]) {
          const g = normalizeGroupNumber(m[1]);
          if (g) return g;
        }
      }

      // 5. Check Session / Local Storage JSON
      const storageSources = [window.sessionStorage, window.localStorage];
      for (const st of storageSources) {
        try {
          if (!st) continue;
          for (let k = 0; k < st.length; k++) {
            const key = st.key(k);
            if (!key) continue;
            const val = st.getItem(key);
            if (!val || val.length > 50000) continue;
            const m = val.match(/"(?:group|grupa|fopGroup|epGroup|taxGroup)"\s*:\s*"?([1-4]|III|ІІІ|II|ІІ|I|І)"?/i);
            if (m && m[1]) {
              const g = normalizeGroupNumber(m[1]);
              if (g) return g;
            }
          }
        } catch (e) {}
      }
    } catch (e) {
      console.warn('[KaderGo] extractFopGroupFromDom error:', e);
    }

    return null;
  }

  function navigateToAccountForGroupDetection() {
    try {
      sessionStorage.setItem('kadergo_pending_detect_group', JSON.stringify({
        returnUrl: window.location.href,
        timestamp: Date.now()
      }));
    } catch (e) {}
    window.location.href = 'https://cabinet.tax.gov.ua/account';
  }

  function handlePendingAccountGroupDetection(pendingJson) {
    let returnUrl = 'https://cabinet.tax.gov.ua/cashregs/zreports';
    try {
      const data = JSON.parse(pendingJson);
      if (data && data.returnUrl) returnUrl = data.returnUrl;
      // If older than 2 minutes, abort
      if (data && data.timestamp && Date.now() - data.timestamp > 120000) {
        sessionStorage.removeItem('kadergo_pending_detect_group');
        return;
      }
    } catch (e) {}

    // Show stylish toast on the /account page so the user sees what's happening
    const toast = document.createElement('div');
    toast.className = 'kadergo-nav-toast';
    toast.innerHTML = `
      <div style="position:fixed;top:20px;right:20px;z-index:999999;background:#133b47;color:#ffffff;padding:12px 18px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.3);font-family:sans-serif;font-size:13px;font-weight:700;display:flex;align-items:center;gap:10px;">
        <span class="kg-nav-spinner" style="width:14px;height:14px;border:2.5px solid rgba(255,255,255,0.3);border-top-color:#f8a44c;border-radius:50%;display:inline-block;animation:kadergoSpin 0.7s linear infinite;"></span>
        <span class="kg-nav-text">KaderGo: Визначення групи ФОП...</span>
      </div>
    `;
    document.body.appendChild(toast);

    let attempts = 0;
    const maxAttempts = 50; // up to 6 seconds
    const interval = setInterval(() => {
      attempts++;

      // If after 1.5s not found, check if a single tax tab can be switched
      if (attempts === 12 || attempts === 25) {
        try {
          const tabs = document.querySelectorAll('p-tabview li, .p-tabview-nav li, .nav-tabs li, a[role="tab"], p-accordiontab');
          for (const tab of tabs) {
            const txt = (tab.textContent || '').toLowerCase();
            if ((txt.includes('єдин') || txt.includes('реєстраційні') || txt.includes('облікові')) &&
                !tab.classList.contains('p-highlight') && !tab.classList.contains('p-accordion-header-active') && !tab.classList.contains('active')) {
              const clickTarget = tab.querySelector('a, button, .p-tabview-nav-link') || tab;
              clickTarget.click();
              break;
            }
          }
        } catch (e) {}
      }

      const grp = extractFopGroupFromDom(document);
      if (grp) {
        clearInterval(interval);
        sessionStorage.removeItem('kadergo_pending_detect_group');
        sessionStorage.setItem('kadergo_fop_group', grp);
        sessionStorage.setItem('kadergo_reopen_modal', 'true');

        const textEl = toast.querySelector('.kg-nav-text');
        const spinnerEl = toast.querySelector('.kg-nav-spinner');
        if (textEl) textEl.textContent = `KaderGo: Знайдено: ${grp} група! Повернення...`;
        if (spinnerEl) spinnerEl.style.borderTopColor = '#10b981';

        setTimeout(() => {
          window.location.href = returnUrl;
        }, 350);
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        sessionStorage.removeItem('kadergo_pending_detect_group');
        sessionStorage.setItem('kadergo_fop_group', 'not_found');
        sessionStorage.setItem('kadergo_reopen_modal', 'true');

        const textEl = toast.querySelector('.kg-nav-text');
        if (textEl) textEl.textContent = 'KaderGo: Групу не знайдено. Повернення...';

        setTimeout(() => {
          window.location.href = returnUrl;
        }, 600);
      }
    }, 120);
  }

  function detectFopGroup() {
    navigateToAccountForGroupDetection();
    return { redirecting: true };
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
    getSelectedFiscalNumber: getCurrentlySelectedFiscalNumber,
    findSearchButton,
    triggerSearch,
    hasEmptyStateMessage,
    isTableAlreadyLoadedFor,
    waitForTableReady,
    normalizeGroupNumber,
    extractFopGroupFromDom,
    navigateToAccountForGroupDetection,
    handlePendingAccountGroupDetection,
    detectFopGroup
  };
})();
