// ==============================================================================
// KaderGo - Single RRO Exporter
// Handles downloading and Excel generation for a single selected fiscal number
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  /**
   * Export turnover for a single fiscal number month-by-month.
   * Scrapes data, builds all Excel files, triggers onFilesGenerated (pipa animation),
   * and then initiates the folder/save selection.
   */
  async function downloadSingleFiscalReports(callbacks = {}) {
    const ExportState = window.KaderGo.ExportState;
    if (ExportState && ExportState.isDownloading) {
      return { success: false, error: 'Завантаження вже триває' };
    }

    const { onProgress, onStart, onFilesGenerated, onEnd, flow } = callbacks;
    const isAborted = () => flow && typeof flow.isAborted === 'function' && flow.isAborted();
    const exportFormat = callbacks.exportFormat || 'xlsx';
    const { BASE_COLUMNS, RETURN_COLUMNS } = window.KaderGo.Config;
    const { Cabinet, DateUtils, Scraper, Excel, Downloader } = window.KaderGo;
    const { delay } = Cabinet;

    const { fromInput, toInput } = Cabinet.getPeriodInputs();
    const origFrom = (fromInput?.value || '').trim();
    const origTo = (toInput?.value || '').trim();

    const intervals = (callbacks.intervals && callbacks.intervals.length > 0)
      ? callbacks.intervals
      : (DateUtils.splitDateRangeIntoMonthlyIntervals(origFrom, origTo) || []);

    if (!intervals || intervals.length === 0) {
      const msg = 'Не вдалося розпізнати дати періоду.';
      alert(msg);
      return { success: false, error: msg };
    }

    if (ExportState) ExportState.isDownloading = true;
    if (typeof onStart === 'function') onStart();

    // 1. Оновлюємо дати форми під перший місяць, якщо обрано кілька місяців
    if (intervals.length > 1 && !isAborted()) {
      await Cabinet.applyDateRangeToForm(intervals[0].startStr, intervals[0].endStr);
    }

    let targetFn = callbacks.targetFn || Cabinet.getCurrentlySelectedFiscalNumber();
    if (!targetFn) {
      const fns = await Cabinet.discoverAllFiscalNumbers();
      if (fns && fns.length === 1) {
        targetFn = fns[0].fn;
      } else if (fns && fns.length > 1) {
        const msg = 'У кабінеті знайдено кілька РРО. Будь ласка, оберіть потрібний РРО у списку для завантаження, або скористайтесь кнопкою «Всі РРО в Excel».';
        alert(msg);
        if (ExportState) ExportState.isDownloading = false;
        return { success: false, error: msg };
      } else {
        const msg = 'Не знайдено жодного РРО на сторінці.';
        alert(msg);
        if (ExportState) ExportState.isDownloading = false;
        return { success: false, error: msg };
      }
    }

    let lastSavedFileName = null;
    let wasCancelled = false;
    let exportedFilesCount = 0;
    const generatedFiles = [];
    const isZip = exportFormat === 'zip' && intervals.length > 1;
    const zip = isZip && window.KaderGo.Zip ? new window.KaderGo.Zip.SimpleZip() : null;

    try {
      for (let m = 0; m < intervals.length; m++) {
        if (isAborted()) {
          wasCancelled = true;
          break;
        }
        const interval = intervals[m];
        const capMonth = interval.monthName.charAt(0).toUpperCase() + interval.monthName.slice(1);
        const statusText = intervals.length > 1
          ? `${capMonth} ${interval.year || ''} • Місяць ${m + 1} з ${intervals.length}`
          : `${capMonth} ${interval.year || ''}`;
        const detailText = `РРО ${targetFn} • Збір даних`;
        const progressPercent = Math.round(15 + (m / intervals.length) * 72);

        if (typeof onProgress === 'function') {
          onProgress({
            step: m + 1,
            total: intervals.length,
            monthStep: m + 1,
            monthTotal: intervals.length,
            monthName: capMonth,
            year: interval.year,
            interval,
            fn: targetFn,
            statusText,
            detailText,
            progressPercent
          });
        }

        // 1. Встановлюємо дати цього місяця
        await Cabinet.applyDateRangeToForm(interval.startStr, interval.endStr);

        // 2. Обираємо РРО (якщо вже обрано — завершується миттєво)
        await Cabinet.selectFiscalNumber(targetFn);

        const currentTable = Scraper.findTable();
        const oldFingerprint = currentTable?.querySelector('tbody')?.innerText || '';
        await Cabinet.triggerSearch();
        const waitRes = await Cabinet.waitForTableReady(targetFn, oldFingerprint, 15000);

        if (waitRes && waitRes.hasData === false) {
          console.log(`[KaderGo] ${interval.monthName}: «Даних не знайдено», переходимо до наступного.`);
          continue;
        }

        // 4. Витягуємо всі рядки за цей місяць (з проходом по всіх сторінках)
        const table = Scraper.findTable();
        let validTrs = [];
        if (table) {
          validTrs = await Scraper.extractAllPagesForTable();
        }

        const { rowObjects, hasReturns } = Scraper.parseTrElementsToDataRows(validTrs, table);
        if (typeof onProgress === 'function') {
          const capMonth = interval.monthName.charAt(0).toUpperCase() + interval.monthName.slice(1);
          onProgress({
            step: m + 1,
            total: intervals.length,
            monthStep: m + 1,
            monthTotal: intervals.length,
            monthName: capMonth,
            year: interval.year,
            interval,
            fn: targetFn,
            statusText: `${capMonth} ${interval.year || ''} • Місяць ${m + 1} з ${intervals.length}`,
            detailText: `РРО ${targetFn} • ${validTrs.length} рядків обороту`,
            progressPercent: Math.round(15 + ((m + 0.6) / intervals.length) * 72)
          });
        }

        // НЕ ГЕНЕРУЄМО ПОРОЖНІЙ ФАЙЛ, ЯКЩО НЕ БУЛО ОБОРОТУ (0 рядків):
        if (!rowObjects || rowObjects.length === 0) {
          console.log(`[KaderGo] ${interval.monthName}: Даних про оборот немає (0 рядків). Пропускаємо створення порожнього файлу.`);
          continue;
        }

        exportedFilesCount++;

        const finalCols = hasReturns ? [...BASE_COLUMNS, ...RETURN_COLUMNS] : [...BASE_COLUMNS];
        const finalRows = rowObjects.map(obj => finalCols.map(col =>
          obj[col] !== undefined ? obj[col] : (col.includes('сума') || col.includes('Кількість') ? 0 : '')
        ));

        // 5. Формуємо Excel дані в пам'яті
        const defaultFileName = interval.defaultFileName;
        const { uint8 } = Excel.buildXlsxData({
          headers: finalCols,
          rows: finalRows,
          periodLabel: interval.periodLabel,
          monthName: interval.monthName
        });

        if (isZip && zip) {
          zip.addFile(defaultFileName, uint8);
        } else {
          generatedFiles.push({ defaultFileName, uint8 });
        }
      }

      if (exportedFilesCount === 0 && !wasCancelled) {
        alert('За вказаний період оборот відсутній (не знайдено жодного запису для експорту).');
        return { success: true, empty: true, exportedFilesCount: 0 };
      }

      let zipData = null;
      let zipFileName = null;
      if (isZip && zip && exportedFilesCount > 0) {
        if (typeof onProgress === 'function') {
          onProgress({
            statusText: 'Створення ZIP архіву...',
            detailText: 'Пакування файлів у ZIP...',
            progressPercent: 95
          });
        }
        zipData = zip.toUint8Array();
        zipFileName = `оборот_${origFrom}_${origTo}.zip`
          .replace(/\./g, '_')
          .replace(/_+/g, '_')
          .replace(/_zip$/, '.zip');
      }

      // 1. Анімація переходить у ПИПУ (успіх)
      if (typeof onFilesGenerated === 'function') {
        await onFilesGenerated({
          title: isZip ? 'Архів успішно згенеровано!' : 'Файли успішно згенеровано!',
          subtitle: 'Оберіть місце для збереження...'
        });
      }

      // 2. Mappaválasztás és mentés
      if (isZip && zipData) {
        const downloadRes = await Downloader.performDownload(zipData, zipFileName, { saveAs: true });
        if (downloadRes.cancelled) {
          wasCancelled = true;
        } else {
          lastSavedFileName = downloadRes.fileName;
        }
      } else {
        for (const gf of generatedFiles) {
          const downloadRes = await Downloader.performDownload(gf.uint8, gf.defaultFileName, { saveAs: true });
          if (downloadRes.cancelled) {
            wasCancelled = true;
            break;
          }
          lastSavedFileName = downloadRes.fileName;
          await delay(250);
        }
      }

      return {
        success: !wasCancelled,
        fileName: lastSavedFileName,
        cancelled: wasCancelled,
        exportedFilesCount
      };
    } catch (err) {
      console.error('[KaderGo] Помилка експорту РРО:', err);
      alert(err.message || 'Не вдалося створити файл Excel');
      return { success: false, error: err.message };
    } finally {
      try {
        if (origFrom && origTo) {
          await Cabinet.applyDateRangeToForm(origFrom, origTo);
        }
        if (targetFn) {
          await Cabinet.selectFiscalNumber(targetFn);
        }
      } catch (e) {}

      if (ExportState) ExportState.isDownloading = false;
      if (typeof onEnd === 'function') await onEnd();
    }
  }

  window.KaderGo.ExporterSingle = {
    downloadSingleFiscalReports
  };
})();

