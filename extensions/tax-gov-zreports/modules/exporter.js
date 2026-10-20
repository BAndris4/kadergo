// ==============================================================================
// KaderGo - Export Workflows (Single RRO, All RROs & Annual Income Book)
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
   * Scrapes data, builds all Excel files, triggers onFilesGenerated (pipa animation),
   * and then initiates the folder/save selection.
   */
  async function downloadSingleFiscalReports(callbacks = {}) {
    if (isDownloading) return { success: false, error: 'Завантаження вже триває' };

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

    isDownloading = true;
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

        // 3. Ініціюємо пошук (або використовуємо вже завантажену таблицю, якщо вона вже відкрита на сторінці)
        const isAlreadyLoaded = (typeof Cabinet.isTableAlreadyLoadedFor === 'function')
          ? Cabinet.isTableAlreadyLoadedFor(targetFn, interval)
          : false;

        if (isAlreadyLoaded) {
          console.log(`[KaderGo] ${interval.monthName}: Таблиця для РРО ${targetFn} вже відкрита на сторінці! Витягуємо дані без повторного пошуку.`);
        } else {
          const currentTable = Scraper.findTable();
          const oldFingerprint = currentTable?.querySelector('tbody')?.innerText || '';
          await Cabinet.triggerSearch();
          const waitRes = await Cabinet.waitForTableReady(targetFn, oldFingerprint, 30000);

          if (waitRes && waitRes.hasData === false) {
            console.log(`[KaderGo] ${interval.monthName}: «Даних не знайдено», переходимо до наступного.`);
            continue;
          }
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

      // ТАК, ВСІ ФАЙЛИ ТЕНЕГОВАНО!
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

      isDownloading = false;
      if (typeof onEnd === 'function') await onEnd();
    }
  }

  /**
   * Export turnover for ALL fiscal numbers (400...) month-by-month.
   * Discovers all RROs, iterates through them, consolidates rows, generates Excel files,
   * triggers onFilesGenerated (pipa animation), and then initiates save dialog.
   */
  async function downloadAllFiscalReports(callbacks = {}) {
    if (isDownloading) return { success: false, error: 'Завантаження вже триває' };

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

    isDownloading = true;
    if (typeof onStart === 'function') onStart();

    if (intervals.length > 1 && !isAborted()) {
      await Cabinet.applyDateRangeToForm(intervals[0].startStr, intervals[0].endStr);
    }

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

            const isAlreadyLoaded = (typeof Cabinet.isTableAlreadyLoadedFor === 'function')
              ? Cabinet.isTableAlreadyLoadedFor(fn, interval)
              : false;

            if (isAlreadyLoaded) {
              console.log(`[KaderGo] РРО ${fn} (${interval.monthName}): Таблиця вже відкрита на сторінці! Витягуємо без повторного пошуку.`);
            } else {
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

      // ТАК, ВСІ ФАЙЛИ ТЕНЕГОВАНО!
      // 1. Анімація переходить у ПИПУ
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
      console.error('[KaderGo] Помилка пакетного експорту:', err);
      alert(`Помилка експорту: ${err.message || 'Не вдалося створити файл Excel'}`);
      return { success: false, error: err.message };
    } finally {
      try {
        if (origFrom && origTo) {
          await Cabinet.applyDateRangeToForm(origFrom, origTo);
        }
      } catch (e) {}

      isDownloading = false;
      if (typeof onEnd === 'function') await onEnd();
    }
  }

  /**
   * Export yearly Income Book (Книга обліку доходів) and all monthly turnover files for a given year.
   * Scrapes all RROs for the required months, calculates revenue & returns,
   * builds the Income Book Excel + monthly turnover files (if ZIP),
   * triggers onFilesGenerated (pipa animation), and then initiates save dialog.
   */
  async function downloadYearIncomeBookAndReports(options = {}) {
    if (isDownloading) return { success: false, error: 'Завантаження вже триває' };

    const { year, onProgress, onStart, onFilesGenerated, onEnd, flow } = options;
    const isAborted = () => flow && typeof flow.isAborted === 'function' && flow.isAborted();
    const exportFormat = options.exportFormat || 'zip';
    const { BASE_COLUMNS, RETURN_COLUMNS } = window.KaderGo.Config;
    const { Cabinet, DateUtils, Scraper, Excel, IncomeBookExcel, Downloader } = window.KaderGo;
    const { delay } = Cabinet;

    const info = DateUtils.getYearExportInfo(year);
    if (!info || !info.hasCompletedMonths) {
      const msg = info && info.description
        ? info.description
        : `Немає завершених місяців для експорту за ${year} рік.`;
      alert(msg);
      return { success: false, error: msg };
    }

    const { fromInput, toInput } = Cabinet.getPeriodInputs();
    const origFrom = (fromInput && fromInput.value) || '';
    const origTo = (toInput && toInput.value) || '';
    const origFn = Cabinet.getCurrentlySelectedFiscalNumber();

    isDownloading = true;
    if (typeof onStart === 'function') onStart();

    let lastSavedFileName = null;
    let wasCancelled = false;
    const monthlyFiles = [];
    const monthlyData = {};

    try {
      if (typeof onProgress === 'function') {
        onProgress({
          statusText: 'Пошук РРО у кабінеті...',
          detailText: 'Виявлення активних фіскальних номерів...',
          progressPercent: 5
        });
      }

      const fns = await Cabinet.discoverAllFiscalNumbers();
      if (!fns || fns.length === 0) {
        const msg = 'Не знайдено жодного фіскального номера РРО. Перевірте наявність РРО у кабінеті.';
        alert(msg);
        return { success: false, error: msg };
      }

      console.log(`[KaderGo] Книга доходів ${info.targetYear}: Знайдено ${fns.length} РРО, місяців: ${info.intervals.length}`);

      for (let m = 0; m < info.intervals.length; m++) {
        if (isAborted()) {
          wasCancelled = true;
          break;
        }
        const interval = info.intervals[m];

        // 1. Встановлюємо дати цього календарного місяця
        await Cabinet.applyDateRangeToForm(interval.startStr, interval.endStr);

        const allRowObjects = [];
        let overallHasReturns = false;

        // 2. Збираємо дані по кожному РРО
        for (let i = 0; i < fns.length; i++) {
          const item = fns[i];
          const fn = item.fn;
          const totalSteps = info.intervals.length * fns.length;
          const currentStep = m * fns.length + i + 1;
          const progressPercent = Math.round(14 + (currentStep / totalSteps) * 70);

          const capMonth = interval.monthName.charAt(0).toUpperCase() + interval.monthName.slice(1);
          const statusText = `${capMonth} ${interval.year || ''} • Місяць ${m + 1} з ${info.intervals.length}`;
          const detailText = fns.length > 1
            ? `РРО ${fn} • ${i + 1} з ${fns.length} РРО`
            : `РРО ${fn} • Збір виторгу`;

          if (typeof onProgress === 'function') {
            onProgress({
              monthStep: m + 1,
              monthTotal: info.intervals.length,
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

            const waitRes = await Cabinet.waitForTableReady(fn, oldFingerprint, 30000);
            if (waitRes && waitRes.hasData === false) {
              console.log(`[KaderGo] РРО ${fn} (${interval.monthName}): «Даних не знайдено», перехід до наступного.`);
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

        // 3. Підраховуємо обороти за цей місяць для Книги доходів
        let monthSales = 0;
        let monthReturns = 0;

        for (const obj of allRowObjects) {
          const salesVal = typeof obj['Реалізація - Загальна сума'] === 'number'
            ? obj['Реалізація - Загальна сума']
            : Scraper.parseNumeric(obj['Реалізація - Загальна сума']);
          const returnVal = typeof obj['Повернення - Загальна сума'] === 'number'
            ? obj['Повернення - Загальна сума']
            : Scraper.parseNumeric(obj['Повернення - Загальна сума']);

          monthSales += salesVal;
          monthReturns += returnVal;
        }

        monthSales = Math.round(monthSales * 100) / 100;
        monthReturns = Math.round(monthReturns * 100) / 100;

        monthlyData[interval.monthNum] = {
          sales: monthSales,
          returns: monthReturns
        };

        // 4. Якщо обрано ZIP і був оборот — формуємо щомісячний файл Excel
        if (exportFormat === 'zip' && allRowObjects.length > 0) {
          const finalCols = overallHasReturns ? [...BASE_COLUMNS, ...RETURN_COLUMNS] : [...BASE_COLUMNS];
          const finalRows = allRowObjects.map(obj => finalCols.map(col =>
            obj[col] !== undefined ? obj[col] : (col.includes('сума') || col.includes('Кількість') ? 0 : '')
          ));

          const { uint8 } = Excel.buildXlsxData({
            headers: finalCols,
            rows: finalRows,
            periodLabel: interval.periodLabel,
            monthName: interval.monthName
          });

          monthlyFiles.push({
            fileName: interval.defaultFileName,
            uint8
          });
        }
      }

      // 5. Формуємо саму "Книга обліку доходів єдиний за {year} рік.xlsx"
      if (typeof onProgress === 'function') {
        onProgress({
          statusText: 'Книга обліку доходів',
          detailText: 'Розрахунок сум та річних підсумків',
          monthName: 'Книга обліку доходів',
          stepText: `Рік ${info.targetYear}`,
          progressPercent: 90
        });
      }

      const incomeBookRes = IncomeBookExcel.buildIncomeBookXlsxData({
        year: info.targetYear,
        monthlyData
      });

      const isZip = exportFormat === 'zip';
      let zipData = null;
      let zipFileName = null;

      if (isZip && window.KaderGo.Zip) {
        if (typeof onProgress === 'function') {
          onProgress({
            statusText: 'Архів ZIP',
            detailText: 'Пакування Книги доходів та помісячних звітів',
            monthName: 'Архів ZIP',
            stepText: `${monthlyFiles.length + 1} файлів`,
            progressPercent: 95
          });
        }
        const zip = new window.KaderGo.Zip.SimpleZip();
        // Спочатку додаємо Книгу обліку доходів
        zip.addFile(incomeBookRes.fileName, incomeBookRes.uint8);
        // Додаємо щомісячні файли обороту
        for (const mf of monthlyFiles) {
          zip.addFile(mf.fileName, mf.uint8);
        }

        zipData = zip.toUint8Array();
        zipFileName = `Книга_обліку_доходів_${info.targetYear}_рік.zip`;
      }

      // ТАК, ВСІ ФАЙЛИ ТЕНЕГОВАНО!
      // 1. Анімація переходить у ПИПУ
      if (typeof onFilesGenerated === 'function') {
        await onFilesGenerated({
          title: isZip ? 'Книгу доходів та архів сформовано!' : 'Книгу доходів успішно сформовано!',
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
        // Тільки файл Книги обліку доходів (.xlsx)
        const bookDl = await Downloader.performDownload(incomeBookRes.uint8, incomeBookRes.fileName, { saveAs: true });
        if (bookDl.cancelled) {
          wasCancelled = true;
        } else {
          lastSavedFileName = bookDl.fileName;
        }
      }

      return {
        success: !wasCancelled,
        fileName: lastSavedFileName,
        cancelled: wasCancelled,
        monthlyFilesCount: monthlyFiles.length
      };
    } catch (err) {
      console.error('[KaderGo] Помилка формування книги доходів:', err);
      alert(`Помилка формування книги доходів: ${err.message || 'Невідома помилка'}`);
      return { success: false, error: err.message };
    } finally {
      try {
        if (origFrom && origTo) {
          await Cabinet.applyDateRangeToForm(origFrom, origTo);
        }
        if (origFn) {
          await Cabinet.selectFiscalNumber(origFn);
        }
      } catch (e) {}

      isDownloading = false;
      if (typeof onEnd === 'function') await onEnd();
    }
  }

  window.KaderGo.Exporter = {
    isDownloading: getIsDownloading,
    downloadSingleFiscalReports,
    downloadAllFiscalReports,
    downloadYearIncomeBookAndReports
  };
})();
