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
        sendResponse({ found: false, count: 0, defaultName: 'оборот.xlsx' });
        return true;
      }

      if (request.action === 'GET_STATUS') {
        const validPeriod = Cabinet.hasValidPeriod();
        const table = Scraper.findTable();
        const count = Scraper.getRowCount(table);
        let monthName = 'оборот';

        try {
          const data = Scraper.extractTableData();
          monthName = data.monthName;
        } catch (e) {
          const { fromInput, toInput } = Cabinet.getPeriodInputs();
          const period = DateUtils.getPeriodInfoFromValues(
            fromInput ? fromInput.value : '',
            toInput ? toInput.value : ''
          );
          let defaultName = 'оборот.xlsx';
          if (period) {
            monthName = period.monthName;
            defaultName = period.defaultFileName || `${monthName}.xlsx`;
          }
        }

        sendResponse({
          found: count > 0 && validPeriod,
          hasPeriod: validPeriod,
          count,
          defaultName: (data && data.defaultFileName) || (monthName !== 'оборот' ? `${monthName}.xlsx` : 'оборот.xlsx')
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

  function bootstrap() {
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

    // 2. Standard UI init on target pages
    if (UI && typeof UI.init === 'function') {
      UI.init();
    }

    // 3. Check if returning from /account and should re-open modal
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
