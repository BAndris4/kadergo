// ==============================================================================
// KaderGo - Annual Income Book Exporter (Книга обліку доходів)
// VÉDETT MODUL: Kizárólag a hivatalos ukrán bevételi könyv és havi zárások generálása
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  /**
   * Export yearly Income Book (Книга обліку доходів) and all monthly turnover files for a given year.
   * Scrapes all RROs for the required months, calculates revenue & returns,
   * builds the Income Book Excel + monthly turnover files (if ZIP),
   * triggers onFilesGenerated (pipa animation), and then initiates save dialog.
   */
  async function downloadYearIncomeBookAndReports(options = {}) {
    const ExportState = window.KaderGo.ExportState;
    if (ExportState && ExportState.isDownloading) {
      return { success: false, error: 'Завантаження вже триває' };
    }

    const { year, intervals: customIntervals, fromStr, toStr, onProgress, onStart, onFilesGenerated, onEnd, flow, includeQuarters } = options;
    const isAborted = () => flow && typeof flow.isAborted === 'function' && flow.isAborted();
    const exportFormat = options.exportFormat || 'zip';
    const { BASE_COLUMNS, RETURN_COLUMNS } = window.KaderGo.Config;
    const { Cabinet, DateUtils, Scraper, Excel, IncomeBookExcel, Downloader } = window.KaderGo;
    const { delay } = Cabinet;

    const info = DateUtils.getYearExportInfo(year);
    const intervalsToUse = (Array.isArray(customIntervals) && customIntervals.length > 0)
      ? customIntervals
      : (info && info.intervals);

    if (!intervalsToUse || intervalsToUse.length === 0) {
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

    if (ExportState) ExportState.isDownloading = true;
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
        if (ExportState) ExportState.isDownloading = false;
        return { success: false, error: msg };
      }

      const targetYear = year || (info && info.targetYear);
      console.log(`[KaderGo] Книга доходів ${targetYear}: Знайдено ${fns.length} РРО, місяців: ${intervalsToUse.length}`);

      for (let m = 0; m < intervalsToUse.length; m++) {
        if (isAborted()) {
          wasCancelled = true;
          break;
        }
        const interval = intervalsToUse[m];

        // 1. Встановлюємо дати цього календарного місяця
        await Cabinet.applyDateRangeToForm(interval.startStr, interval.endStr);

        const allRowObjects = [];
        let overallHasReturns = false;

        // 2. Збираємо дані по кожному РРО
        for (let i = 0; i < fns.length; i++) {
          const item = fns[i];
          const fn = item.fn;
          const totalSteps = intervalsToUse.length * fns.length;
          const currentStep = m * fns.length + i + 1;
          const progressPercent = Math.round(14 + (currentStep / totalSteps) * 70);

          const capMonth = interval.monthName.charAt(0).toUpperCase() + interval.monthName.slice(1);
          const statusText = `${capMonth} ${interval.year || ''} • Місяць ${m + 1} з ${intervalsToUse.length}`;
          const detailText = fns.length > 1
            ? `РРО ${fn} • ${i + 1} з ${fns.length} РРО`
            : `РРО ${fn} • Збір виторгу`;

          if (typeof onProgress === 'function') {
            onProgress({
              monthStep: m + 1,
              monthTotal: intervalsToUse.length,
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
          stepText: `Рік ${targetYear}`,
          progressPercent: 90
        });
      }

      const incomeBookRes = IncomeBookExcel.buildIncomeBookXlsxData({
        year: targetYear,
        monthlyData,
        includeQuarters: includeQuarters !== false
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
        zipFileName = `Книга_обліку_доходів_${targetYear}_рік.zip`;
      }

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

      if (ExportState) ExportState.isDownloading = false;
      if (typeof onEnd === 'function') await onEnd();
    }
  }

  window.KaderGo.ExporterBook = {
    downloadYearIncomeBookAndReports
  };
})();

