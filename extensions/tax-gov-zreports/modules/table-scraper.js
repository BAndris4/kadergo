// ==============================================================================
// KaderGo - Table Data Scraper & Paginator
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  function parseNumeric(val, isReturn) {
    if (val === undefined || val === null) return 0;
    const str = String(val).replace(/\u00A0/g, ' ').replace(/\s+/g, '').replace(',', '.').trim();
    if (str === '' || str.toLowerCase() === 'false') return 0;
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  function findTable() {
    const container = document.querySelector('app-eltype-z-sod');
    if (container) {
      const table = container.querySelector('table.p-datatable-table, table');
      if (table) return table;
    }
    return document.querySelector('table.p-datatable-table') || document.querySelector('table');
  }

  function getRowCount(table) {
    if (!table) return 0;
    const tbody = table.querySelector('tbody');
    if (!tbody) return 0;
    let count = 0;
    const trs = tbody.children;
    for (let i = 0; i < trs.length; i++) {
      const tr = trs[i];
      if (tr.cells && tr.cells.length > 3 && !tr.classList.contains('p-datatable-emptymessage')) {
        count++;
      }
    }
    return count;
  }

  function getTableHeaders(table) {
    let ths = table.querySelectorAll('thead th');
    if (ths.length === 0) {
      const parent = table.closest('.p-datatable');
      if (parent) ths = parent.querySelectorAll('.p-datatable-thead th');
    }
    const headers = [];
    for (let i = 0; i < ths.length; i++) {
      headers.push((ths[i].textContent || '').replace(/\s+/g, ' ').trim());
    }
    return headers;
  }

  function extractTableRowsOnly(table) {
    if (!table) return [];
    const tbody = table.querySelector('tbody');
    if (!tbody) return [];

    const trs = tbody.children;
    const validRows = [];
    for (let i = 0; i < trs.length; i++) {
      const tr = trs[i];
      if (tr.cells && tr.cells.length > 3 && !tr.classList.contains('p-datatable-emptymessage')) {
        validRows.push(tr);
      }
    }
    return validRows;
  }

  async function extractAllPagesForTable() {
    const { delay } = window.KaderGo.Cabinet;
    const maxPages = (window.KaderGo.Config && window.KaderGo.Config.MAX_PAGINATOR_PAGES) || 25;
    const allTrs = [];
    let page = 1;

    while (page <= maxPages) {
      const table = findTable();
      if (!table) break;

      const trs = extractTableRowsOnly(table);
      allTrs.push(...trs);

      const nextBtn = document.querySelector('button.p-paginator-next:not(.p-disabled):not([disabled])');
      if (!nextBtn) break;

      const oldTableText = table.querySelector('tbody')?.innerText || '';
      nextBtn.click();
      await delay(350);

      const start = Date.now();
      while (Date.now() - start < 3000) {
        const newTableText = findTable()?.querySelector('tbody')?.innerText || '';
        if (newTableText !== oldTableText) break;
        await delay(100);
      }
      page++;
    }

    return allTrs;
  }

  function parseTrElementsToDataRows(validTrs, table) {
    if (!validTrs || validTrs.length === 0) {
      return { rowObjects: [], hasReturns: false };
    }

    const { BASE_COLUMNS, RETURN_COLUMNS, ALL_RETURN_INDICATOR_KEYWORDS } = window.KaderGo.Config;
    const headers = getTableHeaders(table || findTable());
    const colIndexMap = {};
    for (let i = 0; i < headers.length; i++) {
      colIndexMap[headers[i]] = i;
    }

    let hasReturns = false;
    for (let i = 0; i < validTrs.length; i++) {
      const cells = validTrs[i].cells;
      for (let k = 0; k < ALL_RETURN_INDICATOR_KEYWORDS.length; k++) {
        const idx = colIndexMap[ALL_RETURN_INDICATOR_KEYWORDS[k]];
        if (idx !== undefined && cells[idx]) {
          const txt = (cells[idx].textContent || '').trim().replace(',', '.').replace(/\s+/g, '');
          const num = parseFloat(txt);
          if (!isNaN(num) && num > 0) {
            hasReturns = true;
            break;
          }
        }
      }
      if (hasReturns) break;
    }

    const rowObjects = [];
    for (let i = 0; i < validTrs.length; i++) {
      const cells = validTrs[i].cells;
      const rowMap = {};
      for (const colName of [...BASE_COLUMNS, ...RETURN_COLUMNS]) {
        const colIdx = colIndexMap[colName];
        const isReturn = RETURN_COLUMNS.includes(colName);
        const isNum = colName.includes('сума') || colName.includes('Кількість');

        if (colIdx === undefined || !cells[colIdx]) {
          rowMap[colName] = isNum ? 0 : '';
        } else {
          const raw = (cells[colIdx].textContent || '').trim();
          rowMap[colName] = isNum ? parseNumeric(raw, isReturn) : raw;
        }
      }
      rowObjects.push(rowMap);
    }

    return { rowObjects, hasReturns };
  }

  function extractTableData() {
    const { BASE_COLUMNS, RETURN_COLUMNS, ALL_RETURN_INDICATOR_KEYWORDS } = window.KaderGo.Config;
    const { detectPeriodInfo } = window.KaderGo.DateUtils;

    const table = findTable();
    if (!table) {
      throw new Error('Таблицю не знайдено на сторінці.');
    }

    const headers = getTableHeaders(table);
    const colIndexMap = {};
    for (let i = 0; i < headers.length; i++) {
      colIndexMap[headers[i]] = i;
    }

    const tbody = table.querySelector('tbody');
    if (!tbody) {
      throw new Error('Тіло таблиці не знайдено.');
    }

    const trs = tbody.children;
    const validRows = [];
    for (let i = 0; i < trs.length; i++) {
      const tr = trs[i];
      if (tr.cells && tr.cells.length > 3 && !tr.classList.contains('p-datatable-emptymessage')) {
        validRows.push(tr);
      }
    }

    if (validRows.length === 0) {
      throw new Error('У таблиці наразі немає даних для експорту.');
    }

    let hasReturns = false;
    for (let i = 0; i < validRows.length; i++) {
      const cells = validRows[i].cells;
      for (let k = 0; k < ALL_RETURN_INDICATOR_KEYWORDS.length; k++) {
        const idx = colIndexMap[ALL_RETURN_INDICATOR_KEYWORDS[k]];
        if (idx !== undefined && cells[idx]) {
          const txt = (cells[idx].textContent || '').trim().replace(',', '.').replace(/\s+/g, '');
          const num = parseFloat(txt);
          if (!isNaN(num) && num > 0) {
            hasReturns = true;
            break;
          }
        }
      }
      if (hasReturns) break;
    }

    const finalCols = [...BASE_COLUMNS];
    if (hasReturns) {
      finalCols.push(...RETURN_COLUMNS);
    }

    const exportRows = [];
    for (let i = 0; i < validRows.length; i++) {
      const cells = validRows[i].cells;
      const rowData = [];
      for (let c = 0; c < finalCols.length; c++) {
        const colName = finalCols[c];
        const colIdx = colIndexMap[colName];
        const isReturn = RETURN_COLUMNS.includes(colName);
        const isNum = colName.includes('сума') || colName.includes('Кількість');

        if (colIdx === undefined || !cells[colIdx]) {
          rowData.push(isNum ? 0 : '');
        } else {
          const raw = (cells[colIdx].textContent || '').trim();
          if (isNum) {
            rowData.push(parseNumeric(raw, isReturn));
          } else {
            rowData.push(raw);
          }
        }
      }
      exportRows.push(rowData);
    }

    const dateColIdx = finalCols.indexOf('Дата і час документа');
    const { fromInput, toInput } = window.KaderGo.Cabinet.getPeriodInputs();
    const { periodLabel, monthName } = detectPeriodInfo(
      exportRows,
      dateColIdx,
      fromInput ? fromInput.value : '',
      toInput ? toInput.value : ''
    );

    return {
      headers: finalCols,
      rows: exportRows,
      rowCount: exportRows.length,
      hasReturns,
      periodLabel,
      monthName
    };
  }

  window.KaderGo.Scraper = {
    parseNumeric,
    findTable,
    getRowCount,
    getTableHeaders,
    extractTableRowsOnly,
    extractAllPagesForTable,
    parseTrElementsToDataRows,
    extractTableData
  };
})();
