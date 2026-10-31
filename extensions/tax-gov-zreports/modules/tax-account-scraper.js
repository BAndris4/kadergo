// ==============================================================================
// KaderGo - Tax Account Scraper & Worker Detector
// Extracts Integrated Taxpayer Cards (IKP) from cabinet.tax.gov.ua/tax-account
// Detects workers (code 71010000) and extracts license/ESV payment operations
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  // Target tax codes for General Tax System deduction
  const TAX_CODES = {
    ESV_WORKERS: '71010000',     // ЄСВ за найманих працівників / ЦПХ -> Col G
    LICENSE: '22011100',         // Плата за ліцензії -> Col H
    ESV_SELF: '71040000',        // ЄСВ за себе -> Col H
    ESV_SELF_ALT: '7071040000'   // Альтернативний код ЄСВ за себе
  };

  function parseAmount(val) {
    if (!val) return 0;
    // Cleans spaces (including &nbsp; / \u00a0) and replaces comma with dot
    const clean = String(val)
      .replace(/&nbsp;/g, '')
      .replace(/\u00a0/g, '')
      .replace(/\s+/g, '')
      .replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }

  function parseDate(dateStr) {
    if (!dateStr) return null;
    const m = dateStr.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!m) return null;
    return {
      day: parseInt(m[1], 10),
      month: parseInt(m[2], 10),
      year: parseInt(m[3], 10),
      formatted: `${String(m[1]).padStart(2, '0')}.${String(m[2]).padStart(2, '0')}.${m[3]}`
    };
  }

  function extractCleanDocInfo(opName, dateStr) {
    if (!opName) return `Платіжний документ від ${dateStr || ''}`.trim();
    // Example: "Зараховано 19.04.2026 Сплата суми податкiв, зборiв, платежів, єдиного внеску Платiжна інструкція № 143 вiд 19.04.2026"
    const m = opName.match(/(Плат[іi]жна\s+інструкція\s+№?\s*[^\s]+(?:\s+в[іi]д\s+[\d\.]+)?)/i);
    if (m && m[1]) {
      return m[1].trim();
    }
    const mDoc = opName.match(/(№?\s*\d+\s+в[іi]д\s+[\d\.]+)/i);
    if (mDoc && mDoc[1]) {
      return `Платіжна інструкція ${mDoc[1]}`.trim();
    }
    return `Платіжна інструкція від ${dateStr || ''}`.trim();
  }

  function extractTargetTaxCode(text) {
    if (!text) return null;
    const clean = String(text).replace(/\s+/g, '');
    if (clean.includes('7071040000')) return '7071040000';
    if (clean.includes('71040000')) return '71040000';
    if (clean.includes('71010000')) return '71010000';
    if (clean.includes('22011100')) return '22011100';
    return null;
  }

  /**
   * Scrapes summary accounts table from /tax-account (app-accounts-list)
   */
  function scrapeSummaryAccounts(rootEl = document) {
    const table = rootEl.querySelector('app-accounts-list table') || rootEl.querySelector('#pn_id_10-table') || rootEl.querySelector('table');
    if (!table) return [];

    const rows = table.querySelectorAll('tbody tr');
    const accounts = [];

    rows.forEach((tr, idx) => {
      const cells = tr.querySelectorAll('td');
      if (cells.length < 4) return;

      let code = extractTargetTaxCode(cells[2] ? cells[2].textContent : '');
      if (!code) {
        for (const c of cells) {
          code = extractTargetTaxCode(c.textContent);
          if (code) break;
        }
      }

      // Fallback: match by account name text
      if (!code) {
        const rowTextUpper = (tr.textContent || '').toUpperCase();
        if (rowTextUpper.includes('ЄДИН.ВНЕС') && (rowTextUpper.includes('ФІЗ.ОСІБ') || rowTextUpper.includes('ФIЗ.ОСIБ'))) {
          code = '71040000';
        } else if (rowTextUpper.includes('СУМИ:ЗАРОБ. ПЛАТИ') || rowTextUpper.includes('ВИНАГ. ЗА ДОГОВ. ЦПХ')) {
          code = '71010000';
        } else if (rowTextUpper.includes('ЛІЦЕНЗ') || rowTextUpper.includes('ЛIЦЕНЗ')) {
          code = '22011100';
        }
      }

      if (code && !accounts.some(a => a.code === code)) {
        const territory = (cells[3] ? cells[3].textContent : '').trim();
        const name = (cells[4] ? cells[4].textContent : (cells[3] ? cells[3].textContent : '')).trim();
        const overpaid = parseAmount(cells[5] ? cells[5].textContent : '');
        const debt = parseAmount(cells[6] ? cells[6].textContent : '');

        accounts.push({
          index: idx + 1,
          code,
          territory,
          name,
          overpaid,
          debt,
          rowEl: tr
        });
      }
    });

    return accounts;
  }

  /**
   * Detects if taxpayer has employees based on code 71010000
   */
  function detectWorkers(accounts = [], operations = []) {
    const workerAcc = accounts.find(a => String(a.code).trim() === TAX_CODES.ESV_WORKERS);
    if (!workerAcc) return { hasWorkers: false, details: '' };

    // Csak akkor legyen munkásfizu, ha ténylegesen van ЄСВ befizetés (код 71010000)!
    const hasEsvPayments = Array.isArray(operations) && operations.some((op) => {
      const code = String(op.taxCode || op.code || '').trim();
      return code === TAX_CODES.ESV_WORKERS && op.amount > 0;
    });

    if (Array.isArray(operations) && operations.length > 0 && !hasEsvPayments) {
      return {
        hasWorkers: false,
        account: workerAcc,
        details: ''
      };
    }

    return {
      hasWorkers: hasEsvPayments,
      account: workerAcc,
      details: 'ЄСВ за найманих працівників'
    };
  }

  /**
   * Scrapes operation entries from an account view table (app-account-view)
   */
  function scrapeOperationsTable(rootEl = document) {
    const table = rootEl.querySelector('app-account-view table') || rootEl.querySelector('#pn_id_13-table') || rootEl.querySelector('table');
    if (!table) return [];

    // PrimeNG account table default column indexes:
    // 0: №, 1: Дата, 2: Код, 3: Назва, 4: Сума, 5: Нараховано, 6: Сплачено/повернуто, 7: Борг, 8: Пеня, 9: Залишок пені
    let paidColIdx = 6;
    let accruedColIdx = 5;
    let dateColIdx = 1;
    let opCodeColIdx = 2;
    let opNameColIdx = 3;

    const ths = Array.from(table.querySelectorAll('thead th'));
    ths.forEach((th, idx) => {
      const text = (th.textContent || '').toLowerCase().trim();
      // Match "Сплачено / повернуто" strictly, NEVER match "Залишок несплаченої пенi"
      if ((text.startsWith('сплачено') || text.includes('сплачено / повернуто') || text === 'сплачено') && !text.includes('несплаченої') && !text.includes('надмір')) {
        paidColIdx = idx;
      } else if ((text.startsWith('нараховано /') || text.includes('нараховано / зменшено') || text === 'нараховано') && !text.includes('пен')) {
        accruedColIdx = idx;
      } else if (text.includes('дата')) {
        dateColIdx = idx;
      } else if (text.includes('код')) {
        opCodeColIdx = idx;
      } else if (text.includes('назва')) {
        opNameColIdx = idx;
      }
    });

    const rows = table.querySelectorAll('tbody tr');
    const operations = [];

    rows.forEach((tr) => {
      const cells = tr.querySelectorAll('td');
      if (cells.length <= paidColIdx) return;

      const dateStr = (cells[dateColIdx] ? cells[dateColIdx].textContent : '').trim();
      const opCode = (cells[opCodeColIdx] ? cells[opCodeColIdx].textContent : '').trim();
      const opName = (cells[opNameColIdx] ? cells[opNameColIdx].textContent : '').trim();

      // SZIGORÚAN CSAK "Сплачено / повернуто" (6. oszlop)!
      // Soha ne vegyük a 4. oszlopot (Сума операції) vagy az 5. oszlopot (Нараховано)!
      const paidVal = parseAmount(cells[paidColIdx] ? cells[paidColIdx].textContent : '');

      // Exclude "Всього" summary row, require valid date, and strictly require paidVal > 0
      if (!dateStr || opCode === 'Всього' || (opName && opName.includes('Всього')) || isNaN(paidVal) || paidVal <= 0) {
        return;
      }

      const parsedDate = parseDate(dateStr);
      if (!parsedDate) return;

      operations.push({
        dateStr: parsedDate.formatted,
        day: parsedDate.day,
        month: parsedDate.month,
        year: parsedDate.year,
        opCode,
        opName,
        docInfo: extractCleanDocInfo(opName, parsedDate.formatted),
        amount: paidVal
      });
    });

    return operations;
  }

  // Session caching helpers (v5)
  function clearOldTaxDataCaches() {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('kadergo_tax_data_') && !k.startsWith('kadergo_tax_data_v5_')) {
          sessionStorage.removeItem(k);
        }
      }
    } catch (e) {}
  }
  clearOldTaxDataCaches();

  function cacheTaxData(year, data) {
    try {
      sessionStorage.setItem(`kadergo_tax_data_v5_${year}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  function getCachedTaxData(year) {
    try {
      const raw = sessionStorage.getItem(`kadergo_tax_data_v5_${year}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data) return parsed.data;
    } catch (e) {}
    return null;
  }

  /**
   * Automatically fetches tax account data:
   * 1. Checks cache in sessionStorage
   * 2. Checks active DOM if user is on /tax-account
   * 3. Loads https://cabinet.tax.gov.ua/tax-account in hidden same-origin iframe and scrapes it
   */
  async function fetchTaxAccountData(year, onProgress) {
    const targetYear = parseInt(year, 10) || new Date().getFullYear();

    // 1. Check cache
    const cached = getCachedTaxData(targetYear);
    if (cached && (cached.accounts?.length > 0 || cached.operations?.length > 0)) {
      console.log('[KaderGo] Using cached tax account data for year', targetYear);
      return cached;
    }

    // 2. Check current DOM
    if (window.location.href.includes('/tax-account')) {
      const accounts = scrapeSummaryAccounts(document);
      if (accounts && accounts.length > 0) {
            const operations = scrapeOperationsTable(document);
        const workerCheck = detectWorkers(accounts, operations);
        const data = { accounts, workerCheck, operations };
        cacheTaxData(targetYear, data);
        return data;
      }
    }

    // 3. Hidden same-origin iframe extraction
    if (typeof onProgress === 'function') {
      onProgress({
        statusText: 'Синхронізація кабінету',
        stepText: 'Податкові рахунки',
        detailText: 'Зчитування картки особових рахунків (ЄСВ, ліцензії)...',
        progressPercent: 9
      });
    }

    return new Promise((resolve) => {
      let resolved = false;
      const iframe = document.createElement('iframe');
      iframe.id = 'kg-tax-account-iframe';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1200px';
      iframe.style.height = '800px';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';

      const cleanup = () => {
        try {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        } catch (e) {}
      };

      const finish = (result) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        if (result && result.accounts && result.accounts.length > 0) {
          cacheTaxData(targetYear, result);
        }
        resolve(result || {
          accounts: [],
          workerCheck: { hasWorkers: true, details: 'ЄСВ за найманих працівників' },
          operations: []
        });
      };

      // Safety timeout: 12 seconds max
      const timer = setTimeout(() => {
        console.warn('[KaderGo] Tax account iframe timeout');
        finish(null);
      }, 12000);

      iframe.onload = async () => {
        try {
          const idoc = iframe.contentDocument;
          if (!idoc) {
            clearTimeout(timer);
            finish(null);
            return;
          }

          let checks = 0;
          const poll = setInterval(async () => {
            checks++;
            if (resolved) {
              clearInterval(poll);
              return;
            }

            const table = idoc.querySelector('app-accounts-list table') || idoc.querySelector('#pn_id_10-table') || idoc.querySelector('table');
            const rows = table ? table.querySelectorAll('tbody tr') : [];
            const hasDataRows = Array.from(rows).some(r => r.cells && r.cells.length > 4);

            if (hasDataRows) {
              clearInterval(poll);
              clearTimeout(timer);

              const accounts = scrapeSummaryAccounts(idoc);
                        const operations = [];

              // Target codes to extract details:
              // 71010000 (Workers / CPH), 71040000 / 7071040000 (Self ESV), 22011100 (License)
              const targetCodes = [TAX_CODES.ESV_WORKERS, TAX_CODES.ESV_SELF, TAX_CODES.ESV_SELF_ALT, TAX_CODES.LICENSE];
              const accountsToVisit = accounts.filter(a => targetCodes.includes(String(a.code).trim()));

              for (const acc of accountsToVisit) {
                try {
                  const currentRows = idoc.querySelectorAll('app-accounts-list table tbody tr');
                  let matchingRow = null;
                  for (const tr of currentRows) {
                    if (tr.textContent.includes(acc.code)) {
                      matchingRow = tr;
                      break;
                    }
                  }

                  if (matchingRow) {
                    const clickTarget = matchingRow.querySelector('td:nth-child(5)') || matchingRow;
                    clickTarget.click();

                    // Wait up to 3s for details table
                    let opChecks = 0;
                    while (opChecks < 20) {
                      await new Promise(r => setTimeout(r, 150));
                      opChecks++;
                      const opTable = idoc.querySelector('app-account-view table') || idoc.querySelector('#pn_id_13-table');
                      if (opTable && opTable.querySelectorAll('tbody tr td').length > 5) {
                        const ops = scrapeOperationsTable(idoc);
                        ops.forEach((op) => {
                          op.taxCode = acc.code;
                          operations.push(op);
                        });
                        break;
                      }
                    }

                    // Return to summary accounts list
                    const backBtn = idoc.querySelector('p-breadcrumb a') || idoc.querySelector('a[href="/tax-account"]');
                    if (backBtn) {
                      backBtn.click();
                    } else if (iframe.contentWindow) {
                      iframe.contentWindow.history.back();
                    }
                    await new Promise(r => setTimeout(r, 300));
                  }
                } catch (e) {
                  console.warn('[KaderGo] Error scraping account ops:', acc.code, e);
                }
              }

              const finalWorkerCheck = detectWorkers(accounts, operations);
              finish({ accounts, workerCheck: finalWorkerCheck, operations });
            } else if (checks > 35) { // 35 * 150ms = 5.25s
              clearInterval(poll);
              clearTimeout(timer);
              finish(null);
            }
          }, 150);
        } catch (err) {
          console.warn('[KaderGo] Iframe error:', err);
          clearTimeout(timer);
          finish(null);
        }
      };

      try {
        iframe.src = 'https://cabinet.tax.gov.ua/tax-account';
        document.body.appendChild(iframe);
      } catch (err) {
        clearTimeout(timer);
        finish(null);
      }
    });
  }


  let isTaxScrapeRunning = false;
  function isScrapingActive() {
    return isTaxScrapeRunning;
  }

  async function returnToAccountsList() {
    // If app-accounts-list is already visible and app-account-view is gone, we are already there!
    if (document.querySelector('app-accounts-list table tbody tr') && !document.querySelector('app-account-view table')) {
      return true;
    }

    // 1. Try finding breadcrumb link that returns to "Стан розрахунків" (NEVER match "картк" which is current view)
    const breadcrumbs = Array.from(document.querySelectorAll('p-breadcrumb li a, .p-breadcrumb a, p-breadcrumb a'));
    const backItem = breadcrumbs.find(a => {
      const text = (a.textContent || '').trim().toLowerCase();
      const href = (a.getAttribute('href') || '').toLowerCase();
      return (text.includes('стан розрахунків') || href.endsWith('/tax-account') || href.endsWith('/tax-account/')) && !text.includes('картк');
    });

    if (backItem) {
      console.log('[KaderGo] Clicking breadcrumb to return to accounts list');
      backItem.click();
    } else {
      // 2. Try sidebar link
      const sidebarLink = Array.from(document.querySelectorAll('aside a, nav a, .sidebar a, .layout-sidebar a')).find(a => {
        const text = (a.textContent || '').trim().toLowerCase();
        const href = (a.getAttribute('href') || '').toLowerCase();
        return text.includes('стан розрахунків') || href.includes('/tax-account');
      });

      if (sidebarLink) {
        console.log('[KaderGo] Clicking sidebar link to return to accounts list');
        sidebarLink.click();
      } else {
        console.log('[KaderGo] Using history.back() to return to accounts list');
        window.history.back();
      }
    }

    // Wait up to 5s for accounts list table to reappear
    for (let w = 0; w < 35; w++) {
      await new Promise(r => setTimeout(r, 150));
      const listTable = document.querySelector('app-accounts-list table tbody tr, #pn_id_10-table tbody tr');
      const isViewGone = !document.querySelector('app-account-view table');
      if (listTable && listTable.querySelectorAll('td').length > 3 && isViewGone) {
        await new Promise(r => setTimeout(r, 150));
        return true;
      }
    }

    // Fallback: try history.back() if still in app-account-view
    if (document.querySelector('app-account-view table')) {
      window.history.back();
      for (let w = 0; w < 25; w++) {
        await new Promise(r => setTimeout(r, 150));
        const listTable = document.querySelector('app-accounts-list table tbody tr, #pn_id_10-table tbody tr');
        const isViewGone = !document.querySelector('app-account-view table');
        if (listTable && listTable.querySelectorAll('td').length > 3 && isViewGone) {
          await new Promise(r => setTimeout(r, 150));
          return true;
        }
      }
    }

    return false;
  }

  function openAccountRow(tr) {
    if (!tr) return;
    const link = tr.querySelector('a');
    if (link) {
      link.click();
      return;
    }
    const clickableCell = tr.querySelector('td:nth-child(3)') || tr.querySelector('td:nth-child(5)') || tr.querySelector('td:nth-child(2)');
    if (clickableCell) clickableCell.click();
    tr.click();
    tr.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  }

  /**
   * Handles automatic full scraping when navigating directly to /tax-account
   */
  async function navigateFromTaxAccountToZreports(returnUrl) {
    const targetUrl = (returnUrl && returnUrl.includes('/cashregs/zreports'))
      ? returnUrl
      : 'https://cabinet.tax.gov.ua/cashregs/zreports';

    console.log('[KaderGo] Returning to zreports via SPA navigation:', targetUrl);

    const findZreportsLink = () => {
      const candidates = Array.from(document.querySelectorAll('a, [routerlink], .p-menuitem-link, .ui-menuitem-link'));
      return candidates.find(el => {
        const href = (el.getAttribute('href') || '').toLowerCase();
        const rl = (el.getAttribute('routerlink') || el.getAttribute('ng-reflect-router-link') || '').toLowerCase();
        const txt = (el.textContent || '').trim().toLowerCase().replace(/\s+/g, ' ');

        // Exclude current tax-account or other unrelated items
        if (txt.includes('стан розрахунків') || txt.includes('картк') || href.includes('tax-account') || rl.includes('tax-account')) {
          return false;
        }

        const isHref = href.includes('cashregs/zreports') || href.includes('zreports');
        const isRouter = rl.includes('cashregs/zreports') || rl.includes('zreports');
        const isTxt = (txt.includes('z-звіт') || txt.includes('з-звіт') || txt.includes('z-звіти') || txt.includes('з-звіти') ||
                       txt.includes('дані z') || txt.includes('дані з-звіт')) && !txt.includes('операці');
        return isHref || isRouter || isTxt;
      });
    };

    // 1. Check if link already visible in DOM
    let link = findZreportsLink();

    // 2. If not visible, expand collapsed accordion headers in sidebar for "СЕА РРО"
    if (!link) {
      console.log('[KaderGo] Expanding sidebar panels for СЕА РРО/Z-звіти...');
      const headers = Array.from(document.querySelectorAll(
        'p-panelmenu .p-panelmenu-header-link, p-panelmenu .p-panelmenu-header a, .p-panelmenu-header, .ui-panelmenu-header, ' +
        'aside .p-panelmenu-header, aside a, nav a, .sidebar a, .layout-sidebar a'
      ));

      for (const h of headers) {
        const text = (h.textContent || '').toLowerCase().replace(/\s+/g, ' ');
        if ((text.includes('сеа рро') || text.includes('рро') || text.includes('реєстратор')) &&
            !text.includes('стан розрахунків') && !text.includes('розрахунків')) {
          try {
            h.click();
            h.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          } catch (e) {}
        }
      }

      await new Promise(r => setTimeout(r, 80));
      link = findZreportsLink();
    }

    // 3. Click the target SPA link if found
    if (link) {
      console.log('[KaderGo] Found SPA link to zreports, clicking:', link);
      link.click();
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

      // Wait up to 3000ms for Angular router to complete SPA route change
      for (let c = 0; c < 60; c++) {
        await new Promise(r => setTimeout(r, 50));
        if (window.location.href.includes('/cashregs/zreports') || window.location.href.includes('zreports')) {
          console.log('[KaderGo] Successfully navigated back via SPA link in', (c + 1) * 50, 'ms');
          return;
        }
      }
    }

    if (window.location.href.includes('/cashregs/zreports') || window.location.href.includes('zreports')) {
      return;
    }

    // 4. Reliable direct navigation fallback (DO NOT use history.back() which popped into intermediate account rows)
    console.log('[KaderGo] Navigating directly to zreports:', targetUrl);
    window.location.href = targetUrl;
  }

  async function handlePendingTaxAccountScrape(pendingJson) {
    if (isTaxScrapeRunning) {
      console.log('[KaderGo] Tax scrape already running, ignoring duplicate invocation');
      return;
    }
    isTaxScrapeRunning = true;

    try {
      let job = null;
      try {
        job = typeof pendingJson === 'string' ? JSON.parse(pendingJson) : pendingJson;
      } catch (e) {
        console.warn('[KaderGo] Invalid pendingJson:', e);
        return;
      }

      if (!job) return;
      const targetYear = parseInt(job.year, 10) || new Date().getFullYear();
      const returnUrl = job.returnUrl || 'https://cabinet.tax.gov.ua/cashregs/zreports';

      // Full-screen persistent flow overlay with darkened backdrop
      const flow = (window.KaderGo.ModalFlow && typeof window.KaderGo.ModalFlow.ensurePersistentFlowOverlay === 'function')
        ? window.KaderGo.ModalFlow.ensurePersistentFlowOverlay({
            title: 'Стан розрахунків з бюджетом',
            subtitle: 'Зчитування карток особових рахунків...',
            stepText: 'Аналіз рахунків',
            progressPercent: 9
          })
        : null;

      const updateFlowStatus = (title, subtitle, percent) => {
        if (flow) {
          flow.update({
            title: title || 'Стан розрахунків з бюджетом',
            subtitle: subtitle || 'Обробка даних кабінету...',
            progressPercent: percent || 20
          });
        }
      };

      // Wait for accounts table
      let attempts = 0;
      const maxAttempts = 60; // up to 9 seconds
      let accountsTable = null;

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 150));
        attempts++;
        accountsTable = document.querySelector('app-accounts-list table') || document.querySelector('#pn_id_10-table') || document.querySelector('table');
        if (accountsTable && accountsTable.querySelectorAll('tbody tr td').length > 4) {
          break;
        }
      }

      if (!accountsTable) {
        updateFlowStatus('Помилка рахунків', 'Таблицю рахунків не знайдено. Повернення...', 100);
        setTimeout(() => { window.location.href = returnUrl; }, 1000);
        return;
      }

      updateFlowStatus('Стан розрахунків з бюджетом', 'Аналіз податкових рахунків...', 11);
      const accounts = scrapeSummaryAccounts(document);
      const operations = [];

      // Target codes covers 71010000, 71040000 / 7071040000, and 22011100
      const targetCodes = ['71010000', '71040000', '7071040000', '22011100'];
      const accountsToScrape = accounts.filter((a) => {
        const c = String(a.code).trim();
        const n = (a.name || '').toUpperCase();
        return targetCodes.includes(c) ||
               (c.includes('71040000') || c.includes('7071040000') || n.includes('ЄДИН.ВНЕС. ДЛЯ ФIЗ.ОСIБ') || n.includes('ЄДИН.ВНЕС. ДЛЯ ФІЗ.ОСІБ')) ||
               (c.includes('71010000') || n.includes('СУМИ:ЗАРОБ. ПЛАТИ')) ||
               (c.includes('22011100') || n.includes('ЛIЦЕНЗ') || n.includes('ЛІЦЕНЗ'));
      });

      console.log('[KaderGo] Accounts to scrape:', accountsToScrape.map(a => a.code + ': ' + a.name));

      for (let i = 0; i < accountsToScrape.length; i++) {
        if (flow && flow.isAborted()) {
          console.log('[KaderGo] Скрапінг податкових рахунків скасовано користувачем.');
          sessionStorage.removeItem('kadergo_fullscreen_flow_active');
          sessionStorage.removeItem('kadergo_flow_progress');
          sessionStorage.removeItem('kadergo_auto_start_general_export');
          sessionStorage.removeItem('kadergo_pending_general_export');
          return;
        }
        const acc = accountsToScrape[i];
        const pct = 11 + Math.round(((i + 1) / accountsToScrape.length) * 9);
        updateFlowStatus((acc.name || acc.code || 'Особовий рахунок').slice(0, 32), `Обробка платежів [${i + 1}/${accountsToScrape.length}]...`, pct);

        try {
          // 1. Ensure accounts list is ready in DOM
          await returnToAccountsList();

          const rows = document.querySelectorAll('app-accounts-list table tbody tr, #pn_id_10-table tbody tr');
          let targetRow = null;

          for (const tr of rows) {
            const text = (tr.textContent || '').replace(/\s+/g, ' ');
            const cleanText = text.replace(/\s+/g, '');
            
            // Match by code (including 71040000 / 7071040000)
            if (cleanText.includes(acc.code)) {
              targetRow = tr;
              break;
            }
            if ((acc.code === '71040000' || acc.code === '7071040000') &&
                (cleanText.includes('71040000') || cleanText.includes('7071040000') || text.includes('ЄДИН.ВНЕС. ДЛЯ ФIЗ.ОСIБ') || text.includes('ЄДИН.ВНЕС. ДЛЯ ФІЗ.ОСІБ') || text.includes('ФIЗ.ОСIБ - ПIДПР') || text.includes('ФІЗ.ОСІБ - ПІДПР'))) {
              targetRow = tr;
              break;
            }
            if (acc.code === '71010000' && (cleanText.includes('71010000') || text.includes('СУМИ:ЗАРОБ. ПЛАТИ') || text.includes('ВИНАГ. ЗА ДОГОВ. ЦПХ'))) {
              targetRow = tr;
              break;
            }
            if (acc.code === '22011100' && (cleanText.includes('22011100') || text.includes('ЛIЦЕНЗ') || text.includes('ЛІЦЕНЗ'))) {
              targetRow = tr;
              break;
            }
          }

          if (targetRow) {
            console.log('[KaderGo] Opening target row for account:', acc.code);
            openAccountRow(targetRow);

            // 2. Wait up to 6s for app-account-view operations table
            let opTable = null;
            for (let opAttempts = 0; opAttempts < 40; opAttempts++) {
              await new Promise((r) => setTimeout(r, 150));
              opTable = document.querySelector('app-account-view table, #pn_id_13-table');
              if (opTable && opTable.querySelectorAll('tbody tr td').length > 4) {
                break;
              }
            }

            if (opTable) {
              await new Promise((r) => setTimeout(r, 200)); // Allow table data to fully render
              const ops = scrapeOperationsTable(document);
              console.log(`[KaderGo] Scraped ${ops.length} operations for account ${acc.code}`);
              ops.forEach((op) => {
                // Normalize self ESV code to 71040000 for standard handling, keep rawCode
                op.taxCode = (acc.code === '7071040000') ? '71040000' : acc.code;
                op.rawCode = acc.code;
                operations.push(op);
              });
            } else {
              console.warn('[KaderGo] Operations table did not appear for account:', acc.code);
            }

            // 3. Return back to accounts list for next account!
            await returnToAccountsList();
          } else {
            console.warn('[KaderGo] Target row not found for account:', acc.code);
          }
        } catch (errAcc) {
          console.warn('[KaderGo] Error scraping account:', acc.code, errAcc);
        }
      }

      // Save extracted tax data to sessionStorage
      const workerCheck = detectWorkers(accounts, operations);
      const taxData = { accounts, workerCheck, operations };
      cacheTaxData(targetYear, taxData);

      if (flow && flow.isAborted()) {
        sessionStorage.removeItem('kadergo_fullscreen_flow_active');
        sessionStorage.removeItem('kadergo_flow_progress');
        sessionStorage.removeItem('kadergo_auto_start_general_export');
        sessionStorage.removeItem('kadergo_pending_general_export');
        return;
      }

      // Adónemek kiszedése kész: pontosan 20%-nál áll meg
      updateFlowStatus('Дані успішно зчитано', `Зібрано операцій: ${operations.length}. Повернення до книги...`, 20);
      sessionStorage.setItem('kadergo_auto_start_general_export', 'true');

      // Clean, seamless return via SPA link
      await navigateFromTaxAccountToZreports(returnUrl);
    } finally {
      isTaxScrapeRunning = false;
    }
  }

  window.KaderGo.TaxAccountScraper = {
    TAX_CODES,
    parseAmount,
    parseDate,
    extractCleanDocInfo,
    scrapeSummaryAccounts,
    detectWorkers,
    scrapeOperationsTable,
    cacheTaxData,
    getCachedTaxData,
    fetchTaxAccountData,
    handlePendingTaxAccountScrape,
    isScrapingActive
  };
})();

