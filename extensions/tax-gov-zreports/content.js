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
          if (period) monthName = period.monthName;
        }

        sendResponse({
          found: count > 0 && validPeriod,
          hasPeriod: validPeriod,
          count,
          defaultName: `${monthName}.xlsx`
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UI.init());
  } else {
    UI.init();
  }
})();
