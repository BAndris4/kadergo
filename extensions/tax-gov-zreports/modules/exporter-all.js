// ==============================================================================
// KaderGo - All RROs Batch Exporter
// Handles iterating through all registered fiscal numbers and consolidating monthly data
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  /**
   * Export turnover for ALL fiscal numbers (400...) month-by-month.
   * Discovers all RROs, iterates through them, consolidates rows, generates Excel files,
   * triggers onFilesGenerated (pipa animation), and then initiates save dialog.
   */
  async function downloadAllFiscalReports(callbacks = {}) {
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

    let lastSavedFileName = null;
    let wasCancelled = false;
    let exportedFilesCount = 0;
    const generatedFiles = [];
    const isZip = exportFormat === 'zip' && intervals.length > 1;
    const zip = isZip && window.KaderGo.Zip ? new window.KaderGo.Zip.SimpleZip() : null;

    try {
      if (typeof onProgress === 'function') {
        onProgress({
          statusText: 'Пошук РРО у кабінеті...',
          detailText: 'Виявлення зареєстрованих фіскальних номерів...',
          progressPercent: 12
        });
      }

      const fns = await Cabinet.discoverAllFiscalNumbers();
      if (!fns || fns.length === 0) {
        const msg = 'Не знайдено жодного фіскального номера РРО. Перевірте наявність РРО у кабінеті.';
        alert(msg);
        if (ExportState) ExportState.isDownloading = false;
        return { success: false, error: msg };
      }

      console.log(`[KaderGo] Знайдено ${fns.length} РРО:`, fns.map(f => f.fn));

      for (let m = 0; m < intervals.length; m++) {
        if (isAborted()) {
          wasCancelled = true;
          break;
        }
        const interval = intervals[m];

        // 1. Встановлюємо дати цього місяця
        await Cabinet.applyDateRangeToForm(interval.startStr, interval.endStr);

        const allRowObjects = [];
        let overallHasReturns = false;

        // 2. Проходимо по кожному РРО для цього місяця
        for (let i = 0; i < fns.length; i++) {
          const item = fns[i];
          const fn = item.fn;
          const totalSteps = intervals.length * fns.length;
          const currentStep = m * fns.length + i + 1;
          const progressPercent = Math.round(14 + (currentStep / totalSteps) * 74);

          const capMonth = interval.monthName.charAt(0).toUpperCase() + interval.monthName.slice(1);
          const statusText = intervals.length > 1
            ? `${capMonth} ${interval.year || ''} • Місяць ${m + 1} з ${intervals.length}`
            : `${capMonth} ${interval.year || ''}`;
          const detailText = fns.length > 1
            ? `РРО ${fn} • ${i + 1} з ${fns.length} РРО`
            : `РРО ${fn} • Збір даних`;

          if (typeof onProgress === 'function') {
            onProgress({
              monthStep: m + 1,
              monthTotal: intervals.length,
              monthName: capMonth,
              year: interval.year,
              rroStep: i + 1,
              rroTotal: fns.length,
              interval,
              fn,
              statusText,
              detailText,
              progressPercent
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

            const waitRes = await Cabinet.waitForTableReady(fn, oldFingerprint, 15000);
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

        // 3. Не генеруємо порожній файл, якщо по жодному РРО не було обороту:
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
          generatedFiles.push({ defaultFileName, uint8 });
        }
      }

      if (wasCancelled || isAborted()) {
        console.log('[KaderGo] Експорт скасовано користувачем, завантаження файлів скасовано.');
        return {
          success: false,
          cancelled: true,
          fileName: null,
          exportedFilesCount: 0
        };
      }

      if (exportedFilesCount === 0 && !wasCancelled) {
        alert('За вказаний період оборот по жодному РРО не знайдено.');
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
        zipFileName = `Оборот_${origFrom}_${origTo}.zip`
          .replace(/\./g, '_')
          .replace(/_+/g, '_')
          .replace(/_zip$/, '.zip');
      }

      if (wasCancelled || isAborted()) {
        return {
          success: false,
          cancelled: true,
          fileName: null,
          exportedFilesCount: 0
        };
      }

      // 1. Анімація переходить у ПИПУ
      if (typeof onFilesGenerated === 'function') {
        await onFilesGenerated({
          title: isZip ? 'Архів успішно згенеровано!' : 'Файли успішно згенеровано!',
          subtitle: 'Оберіть місце для збереження...'
        });
      }

      if (wasCancelled || isAborted()) {
        return {
          success: false,
          cancelled: true,
          fileName: null,
          exportedFilesCount: 0
        };
      }

      // 2. Mappaválasztás és mentés
      if (isZip && zipData) {
        if (wasCancelled || isAborted()) {
          return { success: false, cancelled: true, fileName: null, exportedFilesCount };
        }
        const downloadRes = await Downloader.performDownload(zipData, zipFileName, { saveAs: true });
        if (downloadRes.cancelled) {
          wasCancelled = true;
        } else {
          lastSavedFileName = downloadRes.fileName;
        }
      } else {
        for (const gf of generatedFiles) {
          if (wasCancelled || isAborted()) {
            wasCancelled = true;
            break;
          }
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
      console.error('[KaderGo] Помилка пакетного експорту:', err);
      alert(`Помилка експорту: ${err.message || 'Не вдалося створити файл Excel'}`);
      return { success: false, error: err.message };
    } finally {
      try {
        if (origFrom && origTo) {
          await Cabinet.applyDateRangeToForm(origFrom, origTo);
        }
      } catch (e) {}

      if (ExportState) ExportState.isDownloading = false;
      if (typeof onEnd === 'function') await onEnd();
    }
  }

  window.KaderGo.ExporterAll = {
    downloadAllFiscalReports
  };
})();

