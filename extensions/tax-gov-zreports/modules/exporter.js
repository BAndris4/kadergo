// ==============================================================================
// KaderGo - Exporter Coordinator
// Unified facade delegating to specialized modular exporters:
// - ExporterSingle: Single RRO reports
// - ExporterAll: All RROs batch reports
// - ExporterBook: Annual Income Book (Книга обліку доходів)
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  let isDownloading = false;

  window.KaderGo.ExportState = {
    get isDownloading() {
      return isDownloading;
    },
    set isDownloading(v) {
      isDownloading = !!v;
    }
  };

  function getIsDownloading() {
    return isDownloading;
  }

  async function downloadSingleFiscalReports(callbacks = {}) {
    if (!window.KaderGo.ExporterSingle || typeof window.KaderGo.ExporterSingle.downloadSingleFiscalReports !== 'function') {
      throw new Error('Модуль ExporterSingle не завантажено');
    }
    return window.KaderGo.ExporterSingle.downloadSingleFiscalReports(callbacks);
  }

  async function downloadAllFiscalReports(callbacks = {}) {
    if (!window.KaderGo.ExporterAll || typeof window.KaderGo.ExporterAll.downloadAllFiscalReports !== 'function') {
      throw new Error('Модуль ExporterAll не завантажено');
    }
    return window.KaderGo.ExporterAll.downloadAllFiscalReports(callbacks);
  }

  async function downloadYearIncomeBookAndReports(options = {}) {
    if (!window.KaderGo.ExporterBook || typeof window.KaderGo.ExporterBook.downloadYearIncomeBookAndReports !== 'function') {
      throw new Error('Модуль ExporterBook не завантажено');
    }
    return window.KaderGo.ExporterBook.downloadYearIncomeBookAndReports(options);
  }

  window.KaderGo.Exporter = {
    isDownloading: getIsDownloading,
    downloadSingleFiscalReports,
    downloadAllFiscalReports,
    downloadYearIncomeBookAndReports
  };
})();
