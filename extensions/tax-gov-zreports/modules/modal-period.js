// ==============================================================================
// KaderGo - Custom Period Popover Component
// Interactive 12-month selector & exact date range input for Income Book
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  const UKR_MONTHS_SHORT = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];

  /**
   * Initializes the Period Popover controller.
   * @param {Object} opts
   * @param {HTMLElement} opts.popoverBackdrop
   * @param {HTMLElement} opts.popover
   * @param {HTMLElement} opts.periodCardEl
   * @param {HTMLElement} opts.periodBadgeEl
   * @param {Function} opts.getSelectedYear - () => number
   * @param {Function} opts.getActiveMode - () => string
   * @param {Function} opts.onApply - ({ fromStr, toStr, isCustomActive }) => void
   */
  function createPeriodPopover(opts) {
    const {
      popoverBackdrop,
      popover,
      periodCardEl,
      periodBadgeEl,
      getSelectedYear,
      getActiveMode,
      onApply
    } = opts;

    const DateUtils = window.KaderGo.DateUtils;

    const popTitle = popover ? popover.querySelector('#kg-pop-title') : null;
    const popCloseBtn = popover ? popover.querySelector('#kg-pop-close-btn') : null;
    const popBtnAuto = popover ? popover.querySelector('#kg-pop-btn-auto') : null;
    const popMonthsGrid = popover ? popover.querySelector('#kg-pop-months-grid') : null;
    const popDateFrom = popover ? popover.querySelector('#kg-pop-date-from') : null;
    const popDateTo = popover ? popover.querySelector('#kg-pop-date-to') : null;
    const popApplyBtn = popover ? popover.querySelector('#kg-pop-apply-btn') : null;

    let customPeriodFrom = null;
    let customPeriodTo = null;
    let isCustomPeriodActive = false;

    let tempFromStr = null;
    let tempToStr = null;
    let monthSelectionStep = 0;

    function getAutoDates() {
      const year = getSelectedYear();
      const yearInfo = DateUtils ? DateUtils.getYearExportInfo(year) : {};
      return {
        startStr: yearInfo.startStr || `01.01.${year}`,
        endStr: yearInfo.endStr || `31.12.${year}`
      };
    }

    function getCurrentDates() {
      const auto = getAutoDates();
      const fromStr = isCustomPeriodActive && customPeriodFrom !== null ? customPeriodFrom : auto.startStr;
      const toStr = isCustomPeriodActive && customPeriodTo !== null ? customPeriodTo : auto.endStr;
      return { fromStr, toStr, isCustomActive: isCustomPeriodActive };
    }

    function open() {
      const auto = getAutoDates();
      tempFromStr = isCustomPeriodActive && customPeriodFrom !== null ? customPeriodFrom : auto.startStr;
      tempToStr = isCustomPeriodActive && customPeriodTo !== null ? customPeriodTo : auto.endStr;
      monthSelectionStep = 0;

      if (popTitle) popTitle.textContent = 'Налаштування періоду';
      updateUI();

      if (popoverBackdrop) popoverBackdrop.classList.add('is-open');
      if (popover) popover.classList.add('is-open');
    }

    function close() {
      if (popoverBackdrop) popoverBackdrop.classList.remove('is-open');
      if (popover) popover.classList.remove('is-open');
    }

    function apply() {
      const auto = getAutoDates();
      customPeriodFrom = tempFromStr;
      customPeriodTo = tempToStr;
      isCustomPeriodActive = (tempFromStr !== auto.startStr || tempToStr !== auto.endStr);

      close();

      if (typeof onApply === 'function') {
        onApply({
          fromStr: customPeriodFrom,
          toStr: customPeriodTo,
          isCustomActive: isCustomPeriodActive
        });
      }
    }

    function handleMonthClick(m) {
      const y = getSelectedYear();
      const lastDayOfM = new Date(y, m, 0).getDate();
      const startStr = `01.${String(m).padStart(2, '0')}.${y}`;
      const endStr = `${String(lastDayOfM).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;

      if (monthSelectionStep === 0) {
        tempFromStr = startStr;
        tempToStr = endStr;
        monthSelectionStep = 1;
      } else {
        const parsedStart = DateUtils ? DateUtils.parseDateStr(tempFromStr) : null;
        const startM = parsedStart ? parsedStart.getMonth() + 1 : m;
        const minM = Math.min(startM, m);
        const maxM = Math.max(startM, m);

        const lastDayOfMaxM = new Date(y, maxM, 0).getDate();
        tempFromStr = `01.${String(minM).padStart(2, '0')}.${y}`;
        tempToStr = `${String(lastDayOfMaxM).padStart(2, '0')}.${String(maxM).padStart(2, '0')}.${y}`;
        monthSelectionStep = 0;
      }
      updateUI();
    }

    function updateUI() {
      if (popDateFrom) popDateFrom.value = tempFromStr || '';
      if (popDateTo) popDateTo.value = tempToStr || '';

      const parsedFrom = DateUtils ? DateUtils.parseDateStr(tempFromStr) : null;
      const parsedTo = DateUtils ? DateUtils.parseDateStr(tempToStr) : null;
      const isDatesValid = !!(parsedFrom && parsedTo && parsedFrom <= parsedTo);

      if (popDateFrom) popDateFrom.classList.toggle('invalid', !parsedFrom);
      if (popDateTo) popDateTo.classList.toggle('invalid', !parsedTo || (parsedFrom && parsedTo && parsedFrom > parsedTo));

      const selectedYear = getSelectedYear();
      let fromM = 1;
      let toM = 12;
      if (parsedFrom && parsedFrom.getFullYear() === selectedYear) {
        fromM = parsedFrom.getMonth() + 1;
      }
      if (parsedTo && parsedTo.getFullYear() === selectedYear) {
        toM = parsedTo.getMonth() + 1;
      }

      const now = new Date();
      const curY = now.getFullYear();
      const curM = now.getMonth() + 1;

      if (popMonthsGrid) {
        popMonthsGrid.innerHTML = '';
        for (let m = 1; m <= 12; m++) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'kadergo-pop-month-btn';
          btn.textContent = UKR_MONTHS_SHORT[m - 1];

          const isFuture = (selectedYear === curY && m >= curM) || selectedYear > curY;
          if (isFuture) btn.classList.add('future');

          if (isDatesValid && m >= fromM && m <= toM) {
            if (m === fromM || m === toM) {
              btn.classList.add('active');
            } else {
              btn.classList.add('in-range');
            }
          }

          btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleMonthClick(m);
          });
          popMonthsGrid.appendChild(btn);
        }
      }
    }

    // Bind event listeners
    if (popBtnAuto) {
      popBtnAuto.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const auto = getAutoDates();
        tempFromStr = auto.startStr;
        tempToStr = auto.endStr;
        monthSelectionStep = 0;
        updateUI();
      });
    }

    if (popDateFrom) {
      popDateFrom.addEventListener('input', () => {
        tempFromStr = popDateFrom.value.trim().replace(/[-/]/g, '.');
        updateUI();
      });
    }

    if (popDateTo) {
      popDateTo.addEventListener('input', () => {
        tempToStr = popDateTo.value.trim().replace(/[-/]/g, '.');
        updateUI();
      });
    }

    if (popCloseBtn) {
      popCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close();
      });
    }

    if (popoverBackdrop) {
      popoverBackdrop.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close();
      });
    }

    if (popover) {
      popover.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    if (popApplyBtn) {
      popApplyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        apply();
      });
    }

    if (periodCardEl) {
      periodCardEl.addEventListener('click', (e) => {
        if (typeof getActiveMode === 'function' && getActiveMode() === 'income_book') {
          e.preventDefault();
          e.stopPropagation();
          open();
        }
      });
    }

    function resetCustom() {
      customPeriodFrom = null;
      customPeriodTo = null;
      isCustomPeriodActive = false;
    }

    function updateBadge() {
      if (!periodBadgeEl) return;
      if (typeof getActiveMode === 'function' && getActiveMode() !== 'income_book') {
        periodBadgeEl.classList.remove('is-visible');
        periodBadgeEl.style.setProperty('display', 'none', 'important');
        return;
      }

      periodBadgeEl.classList.add('is-visible');
      periodBadgeEl.style.setProperty('display', 'inline-flex', 'important');

      if (isCustomPeriodActive) {
        periodBadgeEl.textContent = 'Власний ▾';
        periodBadgeEl.classList.add('is-custom');
      } else {
        periodBadgeEl.textContent = 'Змінити ▾';
        periodBadgeEl.classList.remove('is-custom');
      }
    }

    return {
      open,
      close,
      updateUI,
      updateBadge,
      resetCustom,
      getCurrentDates,
      get isCustomActive() {
        return isCustomPeriodActive;
      }
    };
  }

  window.KaderGo.ModalPeriod = {
    createPeriodPopover
  };
})();

