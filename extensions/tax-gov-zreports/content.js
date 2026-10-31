// ==============================================================================
// KaderGo - Tax Gov UA Turnover Excel Downloader
// Main Content Script Entry Point & Chrome Message Dispatcher
// Only active on: https://cabinet.tax.gov.ua/cashregs/zreports
// ==============================================================================

(function () {
  'use strict';

  const { Config, Cabinet, DateUtils, Scraper, Exporter, UI } = window.KaderGo;

  function isTargetPage() {
    return UI ? UI.isTargetPage() : window.location.href.startsWith(Config.TARGET_URL_PREFIX);
  }

  // ----------------------------------------------------------------------------
  // Handle Chrome Extension Messages (from Popup)
  // ----------------------------------------------------------------------------
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!isTargetPage()) {
        sendResponse({ found: false, count: 0, defaultName: 'Оборот.xlsx' });
        return true;
      }

      if (request.action === 'GET_STATUS') {
        const validPeriod = Cabinet.hasValidPeriod();
        const table = Scraper.findTable();
        const count = Scraper.getRowCount(table);
        let monthName = 'Оборот';

        try {
          const data = Scraper.extractTableData();
          monthName = data.monthName;
        } catch (e) {
          const { fromInput, toInput } = Cabinet.getPeriodInputs();
          const period = DateUtils.getPeriodInfoFromValues(
            fromInput ? fromInput.value : '',
            toInput ? toInput.value : ''
          );
          let defaultName = 'Оборот.xlsx';
          if (period) {
            monthName = period.monthName;
            defaultName = period.defaultFileName || `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}.xlsx`;
          }
        }

        const capMonth = monthName && monthName !== 'оборот' && monthName !== 'Оборот'
          ? (monthName.charAt(0).toUpperCase() + monthName.slice(1))
          : 'Оборот';

        sendResponse({
          found: count > 0 && validPeriod,
          hasPeriod: validPeriod,
          count,
          defaultName: (data && data.defaultFileName) || `${capMonth}.xlsx`
        });
        return true;
      }

      if (request.action === 'TRIGGER_DOWNLOAD') {
        if (!Cabinet.hasValidPeriod()) {
          sendResponse({ success: false, error: 'Вкажіть період (дати «з» та «по») перед завантаженням.' });
          return true;
        }

        Exporter.downloadSingleFiscalReports()
          .then((res) => {
            sendResponse(res || { success: true });
          })
          .catch((err) => {
            sendResponse({ success: false, error: err.message || 'Помилка експорту' });
          });

        return true; // Keep channel open for async response
      }

      if (request.action === 'TRIGGER_DOWNLOAD_ALL') {
        if (!Cabinet.hasValidPeriod()) {
          sendResponse({ success: false, error: 'Вкажіть період (дати «з» та «по») перед завантаженням.' });
          return true;
        }

        Exporter.downloadAllFiscalReports()
          .then((res) => {
            sendResponse(res || { success: true });
          })
          .catch((err) => {
            sendResponse({ success: false, error: err.message || 'Помилка експорту всіх РРО' });
          });

        return true; // Keep channel open for async response
      }
    });
  }

  // ----------------------------------------------------------------------------
  // Lifecycle Initialization
  // ----------------------------------------------------------------------------

  // isResumingExport removed to allow repeated exports without freezing

  function bootstrap() {
    const isZreports = window.location.href.includes('/cashregs/zreports') || window.location.href.includes('zreports');
    const isTaxAccount = window.location.href.includes('/tax-account');

    // Persistent full-screen flow overlay across route changes / page refreshes
    try {
      if (sessionStorage.getItem('kadergo_fullscreen_flow_active') === 'true') {
        const isAutoStart = sessionStorage.getItem('kadergo_auto_start_general_export') === 'true';
        if (isTaxAccount || isAutoStart) {
          if (window.KaderGo && window.KaderGo.ModalFlow && typeof window.KaderGo.ModalFlow.ensurePersistentFlowOverlay === 'function') {
            window.KaderGo.ModalFlow.ensurePersistentFlowOverlay({
              title: isAutoStart ? 'Генерація книги доходів і витрат' : 'Стан розрахунків з бюджетом',
              subtitle: isAutoStart ? 'Повернення до Z-звітів...' : 'Зчитування даних кабінету...',
              stepText: isAutoStart ? 'Експорт' : 'Синхронізація',
              progressPercent: isAutoStart ? 20 : 8
            });
          }
        }
      }
    } catch (e) {}

    // 1. Check if we navigated to /account to detect FOP group
    try {
      const pendingDetect = sessionStorage.getItem('kadergo_pending_detect_group');
      if (pendingDetect && window.location.href.includes('/account')) {
        if (Cabinet && typeof Cabinet.handlePendingAccountGroupDetection === 'function') {
          Cabinet.handlePendingAccountGroupDetection(pendingDetect);
          return;
        }
      }
    } catch (e) {}

    // 1b. Check if we navigated to /tax-account to scrape all tax accounts & operations
    try {
      const pendingGeneral = sessionStorage.getItem('kadergo_pending_general_export');
      if (pendingGeneral && isTaxAccount) {
        // If already marked as scraped and in the middle of returning to zreports, do not re-scrape!
        if (sessionStorage.getItem('kadergo_auto_start_general_export') === 'true') {
          return;
        }
        const TaxScraper = window.KaderGo && window.KaderGo.TaxAccountScraper;
        if (TaxScraper && typeof TaxScraper.handlePendingTaxAccountScrape === 'function') {
          TaxScraper.handlePendingTaxAccountScrape(pendingGeneral);
          return;
        }
      }
    } catch (e) {}

    // 2. Standard UI init on target pages
    if (UI && typeof UI.init === 'function') {
      UI.init();
    }

    // 3. Auto-cache tax accounts and operations when visiting /tax-account
    try {
      if (window.location.href.includes('/tax-account')) {
        setInterval(() => {
          const TaxScraper = window.KaderGo && window.KaderGo.TaxAccountScraper;
          if (TaxScraper) {
            if (typeof TaxScraper.isScrapingActive === 'function' && TaxScraper.isScrapingActive()) {
              return; // Batch scraper is currently active, do not disturb!
            }
            const year = new Date().getFullYear();
            let cached = TaxScraper.getCachedTaxData(year) || { accounts: [], operations: [], workerCheck: null };
            const accounts = TaxScraper.scrapeSummaryAccounts();
            if (accounts && accounts.length > 0) {
              cached.accounts = accounts;
              cached.workerCheck = TaxScraper.detectWorkers(accounts);
            }
            const ops = TaxScraper.scrapeOperationsTable();
            if (ops && ops.length > 0) {
              const codeEl = document.querySelector('app-account-view .p-col span') || document.querySelector('app-account-view');
              let currentCode = '';
              if (codeEl) {
                const cleanTxt = codeEl.textContent.replace(/\s+/g, '');
                if (cleanTxt.includes('7071040000')) currentCode = '71040000';
                else if (cleanTxt.includes('71040000')) currentCode = '71040000';
                else if (cleanTxt.includes('71010000')) currentCode = '71010000';
                else if (cleanTxt.includes('22011100')) currentCode = '22011100';
              }
              ops.forEach((op) => {
                if (currentCode) op.taxCode = currentCode;
                const exists = cached.operations.some(o => o.dateStr === op.dateStr && o.amount === op.amount && o.taxCode === op.taxCode);
                if (!exists) cached.operations.push(op);
              });
            }
            cached.workerCheck = TaxScraper.detectWorkers(cached.accounts, cached.operations);
            TaxScraper.cacheTaxData(year, cached);
          }
        }, 2500);
      }
    } catch (e) {}

    // 4. Check if returning from /account and should re-open modal
    try {
      if (sessionStorage.getItem('kadergo_reopen_modal') === 'true') {
        sessionStorage.removeItem('kadergo_reopen_modal');
        const detectedGroup = sessionStorage.getItem('kadergo_fop_group');
        sessionStorage.removeItem('kadergo_fop_group'); // Clean up right away so future manual opens start clean

        setTimeout(() => {
          if (UI && typeof UI.openExportModal === 'function') {
            UI.openExportModal({
              initialMode: 'income_book',
              detectedGroup: detectedGroup || null
            });
          }
        }, 350);
      }
    } catch (e) {}

    // 4b. Check if returning from /tax-account with auto-start general export
    // STRICT GUARD: Must ONLY run if we are actually on /cashregs/zreports!
    try {
      if (isZreports && sessionStorage.getItem('kadergo_auto_start_general_export') === 'true') {
        sessionStorage.removeItem('kadergo_auto_start_general_export');
        const pendingJobRaw = sessionStorage.getItem('kadergo_pending_general_export');
        sessionStorage.removeItem('kadergo_pending_general_export');

        let job = {};
        try { job = JSON.parse(pendingJobRaw || '{}'); } catch (e) {}

        // DIRECTLY resume export on the SINGLE persistent overlay!
        // NEVER reopen the configuration modal!
        if (UI && typeof UI.resumeGeneralBookExport === 'function') {
          UI.resumeGeneralBookExport(job);
        }
        return;
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // SPA Route Change Watcher (Angular navigation without page reload)
  let lastObservedUrl = window.location.href;
  function handleUrlChange() {
    const current = window.location.href;
    if (current !== lastObservedUrl) {
      lastObservedUrl = current;
      bootstrap();
    }
  }

  window.addEventListener('popstate', () => {
    handleUrlChange();
    setTimeout(handleUrlChange, 20);
    setTimeout(handleUrlChange, 80);
  });
  window.addEventListener('hashchange', () => {
    handleUrlChange();
    setTimeout(handleUrlChange, 20);
  });

  try {
    const origPush = history.pushState;
    if (typeof origPush === 'function') {
      history.pushState = function () {
        origPush.apply(this, arguments);
        handleUrlChange();
        setTimeout(handleUrlChange, 20);
      };
    }
    const origReplace = history.replaceState;
    if (typeof origReplace === 'function') {
      history.replaceState = function () {
        origReplace.apply(this, arguments);
        handleUrlChange();
        setTimeout(handleUrlChange, 20);
      };
    }
  } catch (e) {}

  setInterval(handleUrlChange, 350);
})();
