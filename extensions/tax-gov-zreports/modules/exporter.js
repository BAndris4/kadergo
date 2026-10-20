// ==============================================================================
// KaderGo - Export Workflows (Single RRO & All RROs Batch Exporter)
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  let isDownloading = false;

  function getIsDownloading() {
    return isDownloading;
  }

  /**
   * Export turnover for a single fiscal number month-by-month.
   * If a wide date range is selected (e.g. 01.01 to 30.09), creates separate Excel files for each month.
   */
  async function downloadSingleFiscalReports(callbacks = {}) {
    if (isDownloading) return { success: false, error: 'Завантаження вже триває' };

    const { onProgress, onStart, onEnd } = callbacks;
    const exportFormat = callbacks.exportFormat || 'xlsx';
    let dirHandle = callbacks.dirHandle || null;
    const { BASE_COLUMNS, RETURN_COLUMNS } = window.KaderGo.Config;
    const { Cabinet, DateUtils, Scraper, Excel, Downloader } = window.KaderGo;
    const { delay } = Cabinet;

    if (!Cabinet.hasValidPeriod()) {
      const msg = 'Будь ласка, вкажіть період (дати «з» та «по») перед завантаженням.';
      alert(msg);
      return { success: false, error: msg };
    }

    const { fromInput, toInput } = Cabinet.getPeriodInputs();
    const origFrom = (fromInput.value || '').trim();
    const origTo = (toInput.value || '').trim();

    const intervals = DateUtils.splitDateRangeIntoMonthlyIntervals(origFrom, origTo);
    if (!intervals || intervals.length === 0) {
      const msg = 'Не вдалося розпізнати дати періоду.';
      alert(msg);
      return { success: false, error: msg };
    }

    isDownloading = true;
    if (typeof onStart === 'function') onStart();

    // 1. Оновлюємо дати форми під перший місяць, якщо обрано кілька місяців
    if (intervals.length > 1) {
      await Cabinet.applyDateRangeToForm(intervals[0].startStr, intervals[0].endStr);
    }

    let targetFn = Cabinet.getCurrentlySelectedFiscalNumber();
    if (!targetFn) {
      const fns = await Cabinet.discoverAllFiscalNumbers();
      if (fns && fns.length === 1) {
        targetFn = fns[0].fn;
      } else if (fns && fns.length > 1) {
        const msg = 'У кабінеті знайдено кілька РРО. Будь ласка, оберіть потрібний РРО у списку для завантаження, або скористайтесь кнопкою «Всі РРО в Excel».';
        alert(msg);
        return { success: false, error: msg };
      } else {
        const msg = 'Не знайдено жодного РРО на сторінці.';
        alert(msg);
        return { success: false, error: msg };
      }
    }

    let lastSavedFileName = null;
    let wasCancelled = false;
    let exportedFilesCount = 0;
    const isZip = exportFormat === 'zip' && intervals.length > 1;
    const zip = isZip && window.KaderGo.Zip ? new window.KaderGo.Zip.SimpleZip() : null;

    try {
      for (let m = 0; m < intervals.length; m++) {
        const interval = intervals[m];
        const statusText = intervals.length > 1
          ? `[${m + 1}/${intervals.length}] ${interval.monthName}...`
          : 'Формування...';

        if (typeof onProgress === 'function') {
          onProgress({ step: m + 1, total: intervals.length, interval, statusText });
        }

        // 1. Встановлюємо дати цього місяця
        await Cabinet.applyDateRangeToForm(interval.startStr, interval.endStr);

        // 2. Обираємо РРО (якщо вже обрано — завершується миттєво)
        await Cabinet.selectFiscalNumber(targetFn);

        // 3. Ініціюємо пошук
        const currentTable = Scraper.findTable();
        const oldFingerprint = currentTable?.querySelector('tbody')?.innerText || '';
        await Cabinet.triggerSearch();
        const waitRes = await Cabinet.waitForTableReady(targetFn, oldFingerprint, 30000);

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

        // 5. Формуємо та зберігаємо Excel
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
          const downloadRes = await Downloader.performDownload(uint8, defaultFileName, { saveAs: true });
          if (downloadRes.cancelled) {
            console.log('[KaderGo] Завантаження скасовано користувачем.');
            wasCancelled = true;
            break;
          }
          lastSavedFileName = downloadRes.fileName;
          await delay(300);
        }
      }

      if (exportedFilesCount === 0 && !wasCancelled) {
        alert('За вказаний період оборот відсутній (не знайдено жодного запису для експорту).');
        return { success: true, empty: true, exportedFilesCount: 0 };
      }

      if (isZip && zip && !wasCancelled && exportedFilesCount > 0) {
        if (typeof onProgress === 'function') {
          onProgress({ statusText: 'Формування ZIP архіву...' });
        }
        const zipData = zip.toUint8Array();
        const zipFileName = `оборот_${origFrom}_${origTo}.zip`.replace(/\./g, '_').replace(/_+/g, '_').replace(/_zip$/, '.zip');
        const downloadRes = await Downloader.performDownload(zipData, zipFileName, { saveAs: true });
        if (downloadRes.cancelled) {
          wasCancelled = true;
        } else {
          lastSavedFileName = downloadRes.fileName;
        }
      }

      return {
        success: !wasCancelled,
        fileName: lastSavedFileName,
        cancelled: wasCancelled
      };
    } catch (err) {
      console.error('[KaderGo] Помилка експорту РРО:', err);
      alert(err.message || 'Не вдалося створити файл Excel');
      return { success: false, error: err.message };
    } finally {
      try {
        await Cabinet.applyDateRangeToForm(origFrom, origTo);
        if (targetFn) {
          await Cabinet.selectFiscalNumber(targetFn);
        }
      } catch (e) {}

      isDownloading = false;
      if (typeof onEnd === 'function') onEnd();
    }
  }

  /**
   * Export turnover for ALL fiscal numbers (400...) month-by-month.
   * Discovers all RROs, iterates through them, consolidates rows, and creates an Excel file for each calendar month.
   */
  async function downloadAllFiscalReports(callbacks = {}) {
    if (isDownloading) return { success: false, error: 'Завантаження вже триває' };

    const { onProgress, onStart, onEnd } = callbacks;
    const exportFormat = callbacks.exportFormat || 'xlsx';
    let dirHandle = callbacks.dirHandle || null;
    const { BASE_COLUMNS, RETURN_COLUMNS } = window.KaderGo.Config;
    const { Cabinet, DateUtils, Scraper, Excel, Downloader } = window.KaderGo;
    const { delay } = Cabinet;

    if (!Cabinet.hasValidPeriod()) {
      const msg = 'Будь ласка, вкажіть період (дати «з» та «по») перед завантаженням.';
      alert(msg);
      return { success: false, error: msg };
    }

    const { fromInput, toInput } = Cabinet.getPeriodInputs();
    const origFrom = (fromInput.value || '').trim();
    const origTo = (toInput.value || '').trim();

    const intervals = DateUtils.splitDateRangeIntoMonthlyIntervals(origFrom, origTo);
    if (!intervals || intervals.length === 0) {
      const msg = 'Не вдалося розпізнати дати періоду.';
      alert(msg);
      return { success: false, error: msg };
    }

    isDownloading = true;
    if (typeof onStart === 'function') onStart();

    if (intervals.length > 1) {
      await Cabinet.applyDateRangeToForm(intervals[0].startStr, intervals[0].endStr);
    }

    let lastSavedFileName = null;
    let wasCancelled = false;
    let exportedFilesCount = 0;
    const isZip = exportFormat === 'zip' && intervals.length > 1;
    const zip = isZip && window.KaderGo.Zip ? new window.KaderGo.Zip.SimpleZip() : null;

    try {
      if (typeof onProgress === 'function') {
        onProgress({ statusText: 'Пошук РРО...' });
      }

      const fns = await Cabinet.discoverAllFiscalNumbers();
      if (!fns || fns.length === 0) {
        const msg = 'Не знайдено жодного фіскального номера РРО. Перевірте наявність РРО у кабінеті.';
        alert(msg);
        return { success: false, error: msg };
      }

      console.log(`[KaderGo] Знайдено ${fns.length} РРО:`, fns.map(f => f.fn));

      for (let m = 0; m < intervals.length; m++) {
        const interval = intervals[m];

        // 1. Встановлюємо дати цього місяця
        await Cabinet.applyDateRangeToForm(interval.startStr, interval.endStr);

        const allRowObjects = [];
        let overallHasReturns = false;

        // 2. Проходимо по кожному РРО для цього місяця
        for (let i = 0; i < fns.length; i++) {
          const item = fns[i];
          const fn = item.fn;
          const statusText = intervals.length > 1
            ? `[${m + 1}/${intervals.length}] ${interval.monthName} (${i + 1}/${fns.length})...`
            : `${i + 1}/${fns.length}: ${fn}...`;

          if (typeof onProgress === 'function') {
            onProgress({
              monthStep: m + 1,
              monthTotal: intervals.length,
              rroStep: i + 1,
              rroTotal: fns.length,
              interval,
              fn,
              statusText
            });
          }

          try {
            const selected = await Cabinet.selectFiscalNumber(fn);
            if (!selected) {
              console.warn(`[KaderGo] Не вдалося обрати РРО ${fn}`);
              continue;
            }

            const currentTable = Scraper.findTable();
            const oldFingerprint = currentTable?.querySelector('tbody')?.innerText || '';
            const searchTriggered = await Cabinet.triggerSearch();
            if (!searchTriggered) {
              console.warn('[KaderGo] Не вдалося ініціювати пошук для РРО', fn);
              continue;
            }

            const waitRes = await Cabinet.waitForTableReady(fn, oldFingerprint, 30000);
            if (waitRes && waitRes.hasData === false) {
              console.log(`[KaderGo] РРО ${fn} (${interval.monthName}): «Даних не знайдено», швидкий перехід до наступного.`);
              continue;
            }

            const table = Scraper.findTable();
            if (table) {
              const validTrs = await Scraper.extractAllPagesForTable();
              if (validTrs.length > 0) {
                const { rowObjects, hasReturns } = Scraper.parseTrElementsToDataRows(validTrs, table);
                allRowObjects.push(...rowObjects);
                if (hasReturns) overallHasReturns = true;
              }
            }
          } catch (iterErr) {
            console.warn(`[KaderGo] Помилка обробки РРО ${fn}:`, iterErr);
          }

          await delay(200);
        }

        // 3. НЕ ГЕНЕРУЄМО ПОРОЖНІЙ ФАЙЛ, ЯКЩО ПО ЖОДНОМУ РРО НЕ БУЛО ОБОРОТУ:
        if (!allRowObjects || allRowObjects.length === 0) {
          console.log(`[KaderGo] ${interval.monthName}: Оборот по всіх РРО відсутній (0 рядків). Пропускаємо створення файлу.`);
          continue;
        }

        exportedFilesCount++;

        const finalCols = overallHasReturns ? [...BASE_COLUMNS, ...RETURN_COLUMNS] : [...BASE_COLUMNS];
        const finalRows = allRowObjects.map(obj => finalCols.map(col =>
          obj[col] !== undefined ? obj[col] : (col.includes('сума') || col.includes('Кількість') ? 0 : '')
        ));

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
          const downloadRes = await Downloader.performDownload(uint8, defaultFileName, { saveAs: true });
          if (downloadRes.cancelled) {
            console.log('[KaderGo] Завантаження скасовано користувачем.');
            wasCancelled = true;
            break;
          }
          lastSavedFileName = downloadRes.fileName;
          await delay(300);
        }
      }

      if (exportedFilesCount === 0 && !wasCancelled) {
        alert('За вказаний період оборот відсутній (не знайдено жодного запису для експорту).');
        return { success: true, empty: true, exportedFilesCount: 0 };
      }

      if (isZip && zip && !wasCancelled && exportedFilesCount > 0) {
        if (typeof onProgress === 'function') {
          onProgress({ statusText: 'Формування ZIP архіву...' });
        }
        const zipData = zip.toUint8Array();
        const zipFileName = `оборот_${origFrom}_${origTo}.zip`.replace(/\./g, '_').replace(/_+/g, '_').replace(/_zip$/, '.zip');
        const downloadRes = await Downloader.performDownload(zipData, zipFileName, { saveAs: true });
        if (downloadRes.cancelled) {
          wasCancelled = true;
        } else {
          lastSavedFileName = downloadRes.fileName;
        }
      }

      return {
        success: !wasCancelled,
        fileName: lastSavedFileName,
        cancelled: wasCancelled
      };
    } catch (err) {
      console.error('[KaderGo] Помилка пакетного експорту:', err);
      alert(`Помилка експорту: ${err.message || 'Не вдалося створити файл Excel'}`);
      return { success: false, error: err.message };
    } finally {
      try {
        await Cabinet.applyDateRangeToForm(origFrom, origTo);
      } catch (e) {}

      isDownloading = false;
      if (typeof onEnd === 'function') onEnd();
    }
  }

  window.KaderGo.Exporter = {
    isDownloading: getIsDownloading,
    downloadSingleFiscalReports,
    downloadAllFiscalReports
  };
})();
