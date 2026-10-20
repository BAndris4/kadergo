// ==============================================================================
// KaderGo - Date Utilities & Monthly Interval Calculation
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  function parseDateStr(str) {
    if (!str) return null;
    const m = String(str).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const year = parseInt(m[3], 10);
    return new Date(year, month, day);
  }

  function formatDateStr(date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
  }

  /**
   * Splits a date range (e.g. 01.01.2025 - 30.09.2025) into individual monthly intervals:
   * [ { startStr: '01.01.2025', endStr: '31.01.2025', monthName: 'січень', defaultFileName: 'січень.xlsx', ... }, ... ]
   */
  function splitDateRangeIntoMonthlyIntervals(startStr, endStr) {
    const { UKRAINIAN_MONTHS } = window.KaderGo.Config;
    const startDate = parseDateStr(startStr);
    const endDate = parseDateStr(endStr);
    if (!startDate || !endDate || startDate > endDate) {
      return [];
    }

    const intervals = [];
    let currStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const finalEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (currStart <= finalEnd) {
      const year = currStart.getFullYear();
      const month = currStart.getMonth();

      // Останній день поточного календарного місяця
      const endOfMonth = new Date(year, month + 1, 0);

      // Кінцева дата цього підінтервалу
      const currEnd = endOfMonth < finalEnd ? endOfMonth : finalEnd;

      const monthName = UKRAINIAN_MONTHS[month];
      intervals.push({
        startStr: formatDateStr(currStart),
        endStr: formatDateStr(currEnd),
        year,
        monthNum: month + 1,
        monthName,
        periodLabel: `оборот за ${monthName} ${year}`
      });

      // Переходимо на 1-е число наступного місяця
      currStart = new Date(year, month + 1, 1);
    }

    const hasMultipleYears = intervals.some(it => it.year !== intervals[0].year);
    for (const it of intervals) {
      it.defaultFileName = hasMultipleYears ? `${it.monthName} ${it.year}.xlsx` : `${it.monthName}.xlsx`;
    }

    return intervals;
  }

  function getPeriodInfoFromValues(fromVal, toVal) {
    const { UKRAINIAN_MONTHS } = window.KaderGo.Config;
    if (!fromVal || !toVal) return null;

    const m = fromVal.match(/\b(\d{1,2})\.(\d{2})\.(\d{4})\b/);
    if (m) {
      const monthNum = parseInt(m[2], 10);
      const year = m[3];
      if (monthNum >= 1 && monthNum <= 12) {
        const mName = UKRAINIAN_MONTHS[monthNum - 1];
        return {
          monthName: mName,
          periodLabel: `оборот за ${mName} ${year}`
        };
      }
    }
    return {
      monthName: 'оборот',
      periodLabel: `оборот з ${fromVal} по ${toVal}`
    };
  }

  function detectPeriodInfo(rows, dateColIdx, fallbackFrom, fallbackTo) {
    const { UKRAINIAN_MONTHS } = window.KaderGo.Config;
    if (rows && rows.length > 0 && dateColIdx !== undefined) {
      for (let i = 0; i < rows.length; i++) {
        const dateStr = rows[i][dateColIdx];
        const match = dateStr && String(dateStr).match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/);
        if (match) {
          const monthNum = parseInt(match[2], 10);
          const year = match[3];
          if (monthNum >= 1 && monthNum <= 12) {
            const mName = UKRAINIAN_MONTHS[monthNum - 1];
            return {
              periodLabel: `оборот за ${mName} ${year}`,
              monthName: mName
            };
          }
        }
      }
    }

    if (fallbackFrom && fallbackTo) {
      const period = getPeriodInfoFromValues(fallbackFrom, fallbackTo);
      if (period) return period;
    }

    return { periodLabel: 'оборот', monthName: 'оборот' };
  }

  window.KaderGo.DateUtils = {
    parseDateStr,
    formatDateStr,
    splitDateRangeIntoMonthlyIntervals,
    getPeriodInfoFromValues,
    detectPeriodInfo
  };
})();
