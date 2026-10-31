// ==============================================================================
// KaderGo - Unified Modal Controller
// Orchestrates mode selection, format options, period customization, and export flow
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  let currentModalEl = null;
  let currentRestoreFn = null;

  const { animatedKaderGoLogoSvg, kadergoFlowSvg, icons } = window.KaderGo.ModalAssets || {};

  function openUnifiedExportModal(initialOptions = {}) {
    return new Promise((resolve) => {
      if (window.KaderGo.ModalDock) {
        window.KaderGo.ModalDock.remove();
      }
      // Strictly remove any existing modal overlays in the DOM so there is never a duplicate
      document.querySelectorAll('#tax-gov-kadergo-modal-overlay, #kg-modal-overlay, .kadergo-modal-overlay').forEach(el => {
        try { el.remove(); } catch (e) {}
      });
      currentModalEl = null;
      currentRestoreFn = null;

      const { DateUtils, Cabinet, ModalPeriod, ModalFlow } = window.KaderGo || {};

      // Read current cabinet period first
      const { fromInput, toInput } = (Cabinet && typeof Cabinet.getPeriodInputs === 'function')
        ? Cabinet.getPeriodInputs()
        : { fromInput: null, toInput: null };

      const origFrom = (fromInput?.value || '').trim();
      const origTo = (toInput?.value || '').trim();
      const hasValidCabinetPeriod = !!(origFrom && origTo && (!Cabinet || typeof Cabinet.hasValidPeriod !== 'function' || Cabinet.hasValidPeriod()));
      const cabinetIntervals = (hasValidCabinetPeriod && DateUtils)
        ? (DateUtils.splitDateRangeIntoMonthlyIntervals(origFrom, origTo) || [])
        : [];

      let activeMode = initialOptions.initialMode || initialOptions.defaultMode || 'income_book'; // 'single' | 'all' | 'income_book'
      let targetFn = initialOptions.targetFn || null;

      // 1. Single Mode check
      const getFn = (Cabinet && (Cabinet.getSelectedFiscalNumber || Cabinet.getCurrentlySelectedFiscalNumber));
      if (typeof getFn === 'function') {
        const foundFn = getFn.call(Cabinet);
        if (foundFn) {
          targetFn = foundFn;
        }
      }

      let isSingleDisabled = !hasValidCabinetPeriod || !targetFn;
      let isAllDisabled = !hasValidCabinetPeriod;
      let singleTitle = 'Обраний РРО';
      let allTitle = 'Всі РРО';

      if (isSingleDisabled) {
        if (!hasValidCabinetPeriod && !targetFn) singleTitle = 'Вкажіть період та оберіть РРО в кабінеті';
        else if (!hasValidCabinetPeriod) singleTitle = 'Вкажіть період (дати) в кабінеті';
        else singleTitle = 'Оберіть РРО в кабінеті';
      } else {
        singleTitle = `Обраний РРО (${targetFn})`;
      }

      if (isAllDisabled) {
        allTitle = 'Вкажіть період (дати «з» та «по») в кабінеті';
      } else {
        allTitle = 'Оборот по всіх РРО';
      }

      // Fallback active mode if requested mode cannot be generated
      if (!initialOptions.initialMode) {
        if (activeMode === 'single' && isSingleDisabled) {
          activeMode = !isAllDisabled ? 'all' : 'income_book';
        } else if (activeMode === 'all' && isAllDisabled) {
          activeMode = !isSingleDisabled ? 'single' : 'income_book';
        }
      }

      // Income book year initialization
      const currentYear = new Date().getFullYear();
      let availableYears = [];
      if (DateUtils && typeof DateUtils.getAvailableYears === 'function') {
        availableYears = DateUtils.getAvailableYears();
      }
      if (!availableYears || availableYears.length === 0) {
        availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
      }

      let selectedYear = initialOptions.initialYear || (availableYears.includes(currentYear) ? currentYear : availableYears[0]);
      if (activeMode === 'income_book' && DateUtils && typeof DateUtils.getYearExportInfo === 'function') {
        const curYrInfo = DateUtils.getYearExportInfo(currentYear);
        if (!curYrInfo.hasCompletedMonths && availableYears.includes(currentYear - 1)) {
          selectedYear = currentYear - 1;
        }
      }

      let singleFormat = 'zip';
      let allFormat = 'zip';
      let bookFormat = 'book'; // 'book' (single xlsx) | 'zip' (book + monthly files)
      let bookTaxSystem = initialOptions.initialTaxSystem || 'single_tax'; // 'single_tax' | 'general_tax'
      const cachedGroup = (function () {
        if (initialOptions.detectedGroup) return initialOptions.detectedGroup;
        try {
          return sessionStorage.getItem('kadergo_fop_group');
        } catch (e) {
          return null;
        }
      })();

      let bookQuarters = true;
      if (cachedGroup) {
        if (cachedGroup === '3') {
          bookQuarters = true;
        } else if (cachedGroup === 'not_found' || cachedGroup === 'unknown') {
          bookQuarters = true;
        } else {
          bookQuarters = false;
        }
      }

      // Build Modal DOM tree
      const {
        overlay,
        card,
        header,
        body,
        titleWrap,
        closeBtn,
        minimizeBtn,
        tabsWrap,
        heroCard,
        yearSection,
        yearChipsContainer,
        systemSection,
        systemChipsWrap,
        formatSection,
        formatOptionsWrap,
        incomeQuartersRow,
        incomeQuartersToggle,
        btnDetectGroup,
        groupBadge,
        fileSection,
        fileChipsWrap,
        footer,
        cancelBtn,
        confirmBtn,
        flowWrap,
        popoverBackdrop,
        popover
      } = window.KaderGo.ModalTemplates.createModalDom({
        icons,
        animatedKaderGoLogoSvg,
        kadergoFlowSvg,
        activeMode,
        isSingleDisabled,
        isAllDisabled,
        singleTitle,
        allTitle,
        availableYears,
        selectedYear,
        currentYear,
        DateUtils,
        onYearSelect: (yr) => {
          selectedYear = yr;
          if (periodController) periodController.resetCustom();
          updateView();
        }
      });

      // Period Popover Component
      const periodCardEl = card.querySelector('#kg-grid-period-card');
      const periodBadgeEl = card.querySelector('#kg-grid-period-badge');

      const periodController = ModalPeriod ? ModalPeriod.createPeriodPopover({
        popoverBackdrop,
        popover,
        periodCardEl,
        periodBadgeEl,
        getSelectedYear: () => selectedYear,
        getActiveMode: () => activeMode,
        onApply: () => {
          updateView();
        }
      }) : null;

      let resetDetectTimer = null;

      function resetDetectButtonState() {
        if (resetDetectTimer) {
          clearTimeout(resetDetectTimer);
          resetDetectTimer = null;
        }
        if (btnDetectGroup) {
          btnDetectGroup.disabled = false;
          btnDetectGroup.classList.remove('loading', 'success');
          btnDetectGroup.innerHTML = `
            <span class="kadergo-detect-icon">${icons?.magnifyingGlass || icons?.search || ''}</span>
            <span class="kadergo-detect-text">Авто</span>
          `;
        }
        if (groupBadge) {
          groupBadge.style.display = 'none';
        }
        try {
          sessionStorage.removeItem('kadergo_fop_group');
        } catch (e) {}
      }

      function scheduleDetectButtonReset() {
        if (resetDetectTimer) clearTimeout(resetDetectTimer);
        resetDetectTimer = setTimeout(() => {
          resetDetectButtonState();
        }, 10000);
      }

      if (cachedGroup) {
        if (cachedGroup === 'not_found' || cachedGroup === 'unknown') {
          if (btnDetectGroup) {
            btnDetectGroup.disabled = false;
            btnDetectGroup.classList.remove('loading', 'success');
            btnDetectGroup.innerHTML = `
              <span class="kadergo-detect-text">Не знайдено</span>
            `;
            setTimeout(() => {
              resetDetectButtonState();
            }, 2500);
          }
        } else {
          if (groupBadge) {
            groupBadge.textContent = `${cachedGroup} група`;
            groupBadge.style.display = 'inline-flex';
          }
          if (btnDetectGroup) {
            btnDetectGroup.classList.add('success');
            btnDetectGroup.innerHTML = `
              ${icons.check}
              <span class="kadergo-detect-text">${cachedGroup} група</span>
            `;
          }
          scheduleDetectButtonReset();
        }
      }

      if (systemChipsWrap) {
        systemChipsWrap.querySelectorAll('.kadergo-system-chip').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const sys = btn.getAttribute('data-sys');
            if (!sys || sys === bookTaxSystem) return;
            bookTaxSystem = sys;
            systemChipsWrap.querySelectorAll('.kadergo-system-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateView();
          });
        });
      }

      if (incomeQuartersRow) {
        incomeQuartersRow.addEventListener('click', (e) => {
          if (e.target.closest('#kg-btn-detect-group')) {
            return;
          }
          if (incomeQuartersToggle) {
            if (!e.target.closest('.kadergo-switch')) {
              incomeQuartersToggle.checked = !incomeQuartersToggle.checked;
              incomeQuartersToggle.dispatchEvent(new Event('change'));
            }
          }
        });
      }

      if (incomeQuartersToggle) {
        incomeQuartersToggle.checked = bookQuarters;
        if (incomeQuartersRow) {
          incomeQuartersRow.classList.toggle('active', bookQuarters);
        }
        incomeQuartersToggle.addEventListener('change', (e) => {
          bookQuarters = e.target.checked;
          if (incomeQuartersRow) {
            incomeQuartersRow.classList.toggle('active', bookQuarters);
          }
        });
      }

      if (btnDetectGroup) {
        btnDetectGroup.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          btnDetectGroup.disabled = true;
          btnDetectGroup.classList.add('loading');
          btnDetectGroup.innerHTML = `
            <span class="kadergo-detect-spinner"></span>
            <span class="kadergo-detect-text">Перехід...</span>
          `;

          if (Cabinet && typeof Cabinet.detectFopGroup === 'function') {
            Cabinet.detectFopGroup();
          }
        });
      }

      // Modal Flow / Animation Controller
      const flow = ModalFlow ? ModalFlow.createModalFlow({
        card,
        flowWrap,
        overlay,
        minimizeBtn,
        closeBtn,
        titleWrap,
        onCloseModal: closeModal,
        onAbort: () => {
          resolve({ proceed: false, cancelled: true });
        }
      }) : {
        startIntro: async () => true,
        update: () => {},
        setSuccess: async () => {},
        closeWithOutro: async () => closeModal(),
        abort: () => {},
        isAborted: () => false
      };

      currentRestoreFn = flow.restore;

      function updateView() {
        const heroIconBox = card.querySelector('#kg-hero-icon-box');
        const heroTag = card.querySelector('#kg-hero-tag');
        const heroTitle = card.querySelector('#kg-hero-title');
        const heroBadge = card.querySelector('#kg-hero-badge');
        const periodVal = card.querySelector('#kg-grid-period-val');
        const modeVal = card.querySelector('#kg-grid-mode-val');

        if (periodController) {
          periodController.updateBadge();
        }

        if (activeMode !== 'income_book') {
          if (periodCardEl) periodCardEl.classList.remove('kadergo-grid-card-interactive');
          if (periodController) periodController.close();
        }

        if (incomeQuartersRow) {
          incomeQuartersRow.style.setProperty('display', (activeMode === 'income_book' && bookTaxSystem === 'single_tax') ? 'flex' : 'none', 'important');
        }
        if (systemSection) {
          systemSection.style.setProperty('display', (activeMode === 'income_book') ? 'flex' : 'none', 'important');
          systemSection.classList.toggle('hidden', activeMode !== 'income_book');
        }

        // Re-evaluate period & RRO state in case inputs changed in background
        const currentInputs = (Cabinet && typeof Cabinet.getPeriodInputs === 'function')
          ? Cabinet.getPeriodInputs()
          : { fromInput: null, toInput: null };
        const curF = (currentInputs.fromInput?.value || '').trim();
        const curT = (currentInputs.toInput?.value || '').trim();
        const curValidPeriod = !!(curF && curT && (!Cabinet || typeof Cabinet.hasValidPeriod !== 'function' || Cabinet.hasValidPeriod()));

        if (!targetFn && Cabinet) {
          const fnChecker = Cabinet.getSelectedFiscalNumber || Cabinet.getCurrentlySelectedFiscalNumber;
          if (typeof fnChecker === 'function') {
            const detected = fnChecker.call(Cabinet);
            if (detected) targetFn = detected;
          }
        }

        isSingleDisabled = !curValidPeriod || !targetFn;
        isAllDisabled = !curValidPeriod;

        if (isSingleDisabled) {
          if (!curValidPeriod && !targetFn) singleTitle = 'Вкажіть період та оберіть РРО в кабінеті';
          else if (!curValidPeriod) singleTitle = 'Вкажіть період (дати) в кабінеті';
          else singleTitle = 'Оберіть РРО в кабінеті';
        } else {
          singleTitle = `Обраний РРО (${targetFn})`;
        }

        if (isAllDisabled) {
          allTitle = 'Вкажіть період (дати «з» та «по») в кабінеті';
        } else {
          allTitle = 'Оборот по всіх РРО';
        }

        // Tabs active and disabled states
        tabsWrap.querySelectorAll('.kadergo-mode-tab').forEach((t) => {
          const mode = t.getAttribute('data-mode');
          if (mode === 'single') {
            t.classList.toggle('disabled', isSingleDisabled);
            t.disabled = isSingleDisabled;
            t.title = singleTitle;
          } else if (mode === 'all') {
            t.classList.toggle('disabled', isAllDisabled);
            t.disabled = isAllDisabled;
            t.title = allTitle;
          }
          t.classList.toggle('active', mode === activeMode);
        });

        if (activeMode === 'single') {
          if (!targetFn && Cabinet) {
            const fnChecker = Cabinet.getSelectedFiscalNumber || Cabinet.getCurrentlySelectedFiscalNumber;
            if (typeof fnChecker === 'function') {
              const detected = fnChecker.call(Cabinet);
              if (detected) {
                targetFn = detected;
                singleTitle = `Обраний РРО (${detected})`;
              }
            }
          }

          yearSection.classList.add('hidden');
          yearSection.style.setProperty('display', 'none', 'important');
          if (heroCard) {
            heroCard.style.setProperty('display', 'flex', 'important');
          }

          const fnText = targetFn ? `РРО ${targetFn}` : 'Обраний РРО';
          heroIconBox.innerHTML = icons.fileSpreadsheet;
          heroTag.textContent = targetFn ? `ФН: ${targetFn}` : 'Окремий РРО';
          heroTitle.textContent = 'Оборот обраного РРО';

          if (hasValidCabinetPeriod && targetFn) {
            periodVal.textContent = `${origFrom} — ${origTo}`;
            periodVal.style.color = '';
            modeVal.textContent = fnText;

            const fileCountText = cabinetIntervals.length > 1
              ? (singleFormat === 'zip' ? 'Архів ZIP' : `${cabinetIntervals.length} файли`)
              : '1 файл';
            heroBadge.textContent = fileCountText;

            singleFormat = 'zip';
            formatSection.classList.add('hidden');
            formatSection.style.setProperty('display', 'none', 'important');
            if (incomeQuartersRow) incomeQuartersRow.style.setProperty('display', 'none', 'important');
            formatOptionsWrap.innerHTML = '';

            fileChipsWrap.innerHTML = '';
            if (singleFormat === 'zip') {
              const zipChip = document.createElement('span');
              zipChip.className = 'kadergo-file-chip kadergo-file-chip-zip';
              const cleanZipName = `Оборот_${origFrom}_${origTo}.zip`
                .replace(/\./g, '_')
                .replace(/_+/g, '_')
                .replace(/_zip$/, '.zip');
              zipChip.innerHTML = `${icons.archive}<span>${cleanZipName}</span>`;
              fileChipsWrap.appendChild(zipChip);
            } else {
              cabinetIntervals.forEach((it, idx) => {
                const chip = document.createElement('span');
                chip.className = 'kadergo-file-chip';
                chip.style.animationDelay = `${0.03 * (idx + 1)}s`;
                chip.innerHTML = `${icons.fileSpreadsheet}<span>${it.defaultFileName}</span>`;
                fileChipsWrap.appendChild(chip);
              });
            }

            confirmBtn.disabled = false;
            const actionText = singleFormat === 'zip'
              ? 'Завантажити ZIP'
              : (cabinetIntervals.length > 1 ? `Завантажити (${cabinetIntervals.length} файли)` : 'Завантажити в Excel');
            confirmBtn.innerHTML = `
              ${icons.check}
              <span>${actionText}</span>
            `;
          } else {
            periodVal.textContent = !hasValidCabinetPeriod ? 'Вкажіть період в кабінеті' : `${origFrom} — ${origTo}`;
            periodVal.style.color = !hasValidCabinetPeriod ? '#e08e36' : '';
            modeVal.textContent = !targetFn ? 'Оберіть РРО в кабінеті' : fnText;
            modeVal.style.color = !targetFn ? '#e08e36' : '';
            heroBadge.textContent = 'Немає даних';
            formatSection.classList.add('hidden');
            formatSection.style.setProperty('display', 'none', 'important');
            if (incomeQuartersRow) incomeQuartersRow.style.setProperty('display', 'none', 'important');
            fileChipsWrap.innerHTML = `
              <span class="kadergo-file-chip" style="opacity: 0.7;">
                ${icons.calendar}<span>${singleTitle}</span>
              </span>
            `;

            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<span>${singleTitle}</span>`;
          }

        } else if (activeMode === 'all') {
          yearSection.classList.add('hidden');
          yearSection.style.setProperty('display', 'none', 'important');
          if (heroCard) {
            heroCard.style.setProperty('display', 'flex', 'important');
          }

          heroIconBox.innerHTML = icons.layers;
          heroTag.textContent = 'Автоматичний збір';
          heroTitle.textContent = 'Оборот по всіх РРО';

          if (hasValidCabinetPeriod) {
            periodVal.textContent = `${origFrom} — ${origTo}`;
            periodVal.style.color = '';
            modeVal.textContent = 'Всі РРО';

            const badgeText = allFormat === 'zip' ? 'Архів ZIP' : 'Окремі файли';
            heroBadge.textContent = badgeText;

            allFormat = 'zip';
            formatSection.classList.add('hidden');
            formatSection.style.setProperty('display', 'none', 'important');
            if (incomeQuartersRow) incomeQuartersRow.style.setProperty('display', 'none', 'important');
            formatOptionsWrap.innerHTML = '';

            fileChipsWrap.innerHTML = '';
            if (allFormat === 'zip') {
              const zipChip = document.createElement('span');
              zipChip.className = 'kadergo-file-chip kadergo-file-chip-zip';
              const cleanZipName = `Оборот_${origFrom}_${origTo}.zip`
                .replace(/\./g, '_')
                .replace(/_+/g, '_')
                .replace(/_zip$/, '.zip');
              zipChip.innerHTML = `${icons.archive}<span>${cleanZipName}</span>`;
              fileChipsWrap.appendChild(zipChip);
            } else {
              cabinetIntervals.forEach((it, idx) => {
                const chip = document.createElement('span');
                chip.className = 'kadergo-file-chip';
                chip.style.animationDelay = `${0.03 * (idx + 1)}s`;
                chip.innerHTML = `${icons.fileSpreadsheet}<span>${it.defaultFileName}</span>`;
                fileChipsWrap.appendChild(chip);
              });
            }

            confirmBtn.disabled = false;
            const actionText = allFormat === 'zip'
              ? 'Завантажити всі РРО (ZIP)'
              : 'Завантажити всі РРО (Excel)';
            confirmBtn.innerHTML = `
              ${icons.check}
              <span>${actionText}</span>
            `;
          } else {
            periodVal.textContent = 'Вкажіть період в кабінеті';
            periodVal.style.color = '#e08e36';
            modeVal.textContent = 'Всі РРО';
            heroBadge.textContent = 'Період не вказано';
            formatSection.classList.add('hidden');
            formatSection.style.setProperty('display', 'none', 'important');
            if (incomeQuartersRow) incomeQuartersRow.style.setProperty('display', 'none', 'important');
            fileChipsWrap.innerHTML = `
              <span class="kadergo-file-chip" style="opacity: 0.7;">
                ${icons.calendar}<span>Вкажіть період (дати «з» та «по») у кабінеті</span>
              </span>
            `;

            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<span>Вкажіть період в кабінеті</span>`;
          }

        } else if (activeMode === 'income_book') {
          if (heroCard) {
            heroCard.style.setProperty('display', 'none', 'important');
          }
          yearSection.classList.remove('hidden');
          yearSection.style.setProperty('display', 'flex', 'important');

          const isGeneral = bookTaxSystem === 'general_tax';

          if (systemSection) {
            systemSection.classList.remove('hidden');
            systemSection.style.setProperty('display', 'flex', 'important');
            if (systemChipsWrap) {
              systemChipsWrap.querySelectorAll('.kadergo-system-chip').forEach((btn) => {
                const sys = btn.getAttribute('data-sys');
                btn.classList.toggle('active', sys === bookTaxSystem);
              });
            }
          }

          heroIconBox.innerHTML = icons.bookOpen;
          heroTag.textContent = isGeneral ? 'Загальна система' : 'Єдиний податок';
          heroTitle.textContent = isGeneral ? 'Книга доходів і витрат' : 'Книга обліку доходів';
          heroBadge.textContent = `${selectedYear} рік`;
          modeVal.textContent = isGeneral ? 'Загальна система' : 'Єдиний податок';
          modeVal.style.color = '';

          const dates = periodController ? periodController.getCurrentDates() : { fromStr: `01.01.${selectedYear}`, toStr: `31.12.${selectedYear}` };
          const currentFromStr = dates.fromStr;
          const currentToStr = dates.toStr;

          if (periodVal) {
            periodVal.textContent = `${currentFromStr} — ${currentToStr}`;
            periodVal.style.color = '';
            periodVal.style.display = 'block';
          }
          if (periodCardEl) {
            periodCardEl.classList.add('kadergo-grid-card-interactive');
          }

          let effectiveIntervals = [];
          const parsedFrom = DateUtils ? DateUtils.parseDateStr(currentFromStr) : null;
          const parsedTo = DateUtils ? DateUtils.parseDateStr(currentToStr) : null;
          const isDatesValid = !!(parsedFrom && parsedTo && parsedFrom <= parsedTo);

          if (isDatesValid && DateUtils && typeof DateUtils.splitDateRangeIntoMonthlyIntervals === 'function') {
            effectiveIntervals = DateUtils.splitDateRangeIntoMonthlyIntervals(currentFromStr, currentToStr);
          }

          bookFormat = 'book';
          formatOptionsWrap.innerHTML = '';
          if (isGeneral) {
            formatSection.classList.add('hidden');
            formatSection.style.setProperty('display', 'none', 'important');
            if (incomeQuartersRow) incomeQuartersRow.style.setProperty('display', 'none', 'important');
          } else {
            formatSection.classList.remove('hidden');
            formatSection.style.setProperty('display', 'flex', 'important');
            if (incomeQuartersRow) {
              incomeQuartersRow.style.setProperty('display', 'flex', 'important');
              incomeQuartersRow.classList.toggle('active', bookQuarters);
            }
          }

          fileChipsWrap.innerHTML = '';
          let generalSurname = '';
          if (isGeneral && Cabinet && typeof Cabinet.getTaxpayerInfo === 'function') {
            const tp = Cabinet.getTaxpayerInfo();
            if (window.KaderGo.GeneralBookExcel && typeof window.KaderGo.GeneralBookExcel.extractTaxpayerSurname === 'function') {
              generalSurname = window.KaderGo.GeneralBookExcel.extractTaxpayerSurname(tp.name);
            }
          }

          if (bookFormat === 'zip') {
            const zipChip = document.createElement('span');
            zipChip.className = 'kadergo-file-chip kadergo-file-chip-zip';
            const zipName = isGeneral
              ? (generalSurname ? `Книга_загальна_система_${generalSurname}_${selectedYear}.zip` : `Книга_загальна_система_${selectedYear}.zip`)
              : `Книга_обліку_доходів_${selectedYear}_рік.zip`;
            zipChip.innerHTML = `${icons.archive}<span>${zipName}</span>`;
            fileChipsWrap.appendChild(zipChip);
            effectiveIntervals.forEach((it, idx) => {
              const chip = document.createElement('span');
              chip.className = 'kadergo-file-chip';
              chip.style.animationDelay = `${0.03 * (idx + 1)}s`;
              chip.innerHTML = `${icons.fileSpreadsheet}<span>${it.defaultFileName}</span>`;
              fileChipsWrap.appendChild(chip);
            });
          } else {
            const bookChip = document.createElement('span');
            bookChip.className = 'kadergo-file-chip kadergo-file-chip-gold';
            const fileName = isGeneral
              ? (generalSurname ? `Книга загальна система ${generalSurname} ${selectedYear}.xlsx` : `Книга загальна система ${selectedYear}.xlsx`)
              : `Книга обліку доходів єдиний за ${selectedYear} рік.xlsx`;
            bookChip.innerHTML = `${icons.bookOpen}<span>${fileName}</span>`;
            fileChipsWrap.appendChild(bookChip);
          }

          if (!isDatesValid || effectiveIntervals.length === 0) {
            confirmBtn.disabled = true;
            if (!parsedFrom || !parsedTo) {
              confirmBtn.innerHTML = `<span>Вкажіть дати (ДД.ММ.РРРР)</span>`;
            } else if (parsedFrom > parsedTo) {
              confirmBtn.innerHTML = `<span>Дата «з» має бути раніше «по»</span>`;
            } else {
              confirmBtn.innerHTML = `<span>Немає завершених місяців</span>`;
            }
          } else {
            confirmBtn.disabled = false;
            const count = effectiveIntervals.length;
            const countText = count === 1 ? '1 місяць' : (count < 5 ? `${count} місяці` : `${count} місяців`);
            const actionText = bookFormat === 'zip'
              ? `Сформувати ZIP (${countText})`
              : `Сформувати Книгу (${countText})`;
            confirmBtn.innerHTML = `
              ${icons.check}
              <span>${actionText}</span>
            `;
          }
        }

        // Bind format button clicks
        formatOptionsWrap.querySelectorAll('.kadergo-format-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const fmt = btn.getAttribute('data-fmt');
            if (activeMode === 'single') singleFormat = fmt;
            else if (activeMode === 'all') allFormat = fmt;
            else if (activeMode === 'income_book') bookFormat = fmt;
            updateView();
          });
        });
      }

      // Tab switcher clicks
      tabsWrap.querySelectorAll('.kadergo-mode-tab').forEach((tab) => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          if (tab.classList.contains('disabled')) return;
          const mode = tab.getAttribute('data-mode');
          if (mode === activeMode) return;
          activeMode = mode;
          updateView();
        });
      });

      updateView();

      if (initialOptions.flowActive) {
        card.classList.add('flow-active');
        const flowWrapEl = card.querySelector('#kg-modal-flow-wrap');
        if (flowWrapEl) flowWrapEl.style.removeProperty('display');
        const formWrapEl = card.querySelector('#kg-modal-form-wrap');
        if (formWrapEl) formWrapEl.style.display = 'none';
      }

      if (initialOptions.autoConfirm) {
        card.classList.add('flow-active');
        setTimeout(() => {
          if (confirmBtn && !confirmBtn.disabled) {
            confirmBtn.click();
          }
        }, 60);
      }

      document.body.appendChild(overlay);
      currentModalEl = overlay;

      minimizeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        flow.minimize();
      });

      confirmBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (activeMode === 'income_book') {
          const isGeneral = bookTaxSystem === 'general_tax';

          // If General Tax, always navigate to /tax-account to scrape fresh data UNLESS already on /tax-account or just returned via autoConfirm
          if (isGeneral && !initialOptions.autoConfirm && !window.location.href.includes('/tax-account')) {
            const dates = periodController ? periodController.getCurrentDates() : { fromStr: `01.01.${selectedYear}`, toStr: `31.12.${selectedYear}` };
            const pendingJob = {
              action: 'GENERAL_EXPORT',
              year: selectedYear,
              format: bookFormat,
              fromStr: dates.fromStr,
              toStr: dates.toStr,
              targetFn,
              includeQuarters: bookQuarters,
              taxSystem: 'general_tax',
              returnUrl: window.location.href.includes('/cashregs/zreports') ? window.location.href : 'https://cabinet.tax.gov.ua/cashregs/zreports',
              timestamp: Date.now()
            };
            sessionStorage.removeItem('kadergo_flow_progress');
            sessionStorage.removeItem('kadergo_auto_start_general_export');
            sessionStorage.setItem('kadergo_pending_general_export', JSON.stringify(pendingJob));
            sessionStorage.setItem('kadergo_fullscreen_flow_active', 'true');
            sessionStorage.setItem('kadergo_came_from_zreports', 'true');

            // Immediately switch to full-screen flow animation (seamless continuous screen)
            await flow.startIntro();
            flow.update({
              title: 'Стан розрахунків з бюджетом',
              subtitle: 'Перехід до особових рахунків (ЄСВ, ліцензії)...',
              stepText: 'Синхронізація',
              progressPercent: 7
            });

            // Smooth SPA navigation: find and click sidebar menu link
            const taxLink = Array.from(document.querySelectorAll('a')).find(a => {
              const href = a.getAttribute('href') || '';
              const txt = (a.textContent || '').trim().toLowerCase();
              return href.includes('/tax-account') || txt.includes('стан розрахунків');
            });

            if (taxLink) {
              taxLink.click();
              setTimeout(() => {
                if (!window.location.href.includes('/tax-account')) {
                  window.location.href = 'https://cabinet.tax.gov.ua/tax-account';
                }
              }, 1200);
            } else {
              window.location.href = 'https://cabinet.tax.gov.ua/tax-account';
            }
            return;
          }
        }

        const introOk = await flow.startIntro();
        if (!introOk) {
          resolve({ proceed: false, cancelled: true });
          return;
        }

        if (activeMode === 'single') {
          resolve({
            proceed: true,
            mode: 'single',
            targetFn,
            format: singleFormat,
            intervals: cabinetIntervals,
            flow
          });
        } else if (activeMode === 'all') {
          resolve({
            proceed: true,
            mode: 'all',
            format: allFormat,
            intervals: cabinetIntervals,
            flow
          });
        } else if (activeMode === 'income_book') {

          const dates = periodController ? periodController.getCurrentDates() : { fromStr: `01.01.${selectedYear}`, toStr: `31.12.${selectedYear}` };
          const fromStr = dates.fromStr;
          const toStr = dates.toStr;

          const intervals = (DateUtils && typeof DateUtils.splitDateRangeIntoMonthlyIntervals === 'function')
            ? DateUtils.splitDateRangeIntoMonthlyIntervals(fromStr, toStr)
            : [];

          resolve({
            proceed: true,
            mode: 'income_book',
            targetFn,
            format: bookFormat,
            year: selectedYear,
            fromStr,
            toStr,
            intervals,
            includeQuarters: bookQuarters,
            taxSystem: bookTaxSystem,
            flow
          });
        }
      });

      function handleAbortOrCancel() {
        if (flow.isFlowActive) {
          flow.abort();

          const monthNameEl = card.querySelector('#kg-flow-month-name');
          const flowSubtitleEl = card.querySelector('#kg-flow-subtitle');
          if (monthNameEl) monthNameEl.textContent = 'Скасування вивантаження...';
          if (flowSubtitleEl) flowSubtitleEl.textContent = 'Зупинка процесу та повернення...';

          resolve({ proceed: false, cancelled: true });
          setTimeout(() => {
            closeModal();
          }, 350);
          return;
        }

        closeModal();
        resolve({ proceed: false });
      }

      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAbortOrCancel();
      });

      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (flow.isFlowActive) return;
        closeModal();
        resolve({ proceed: false });
      });

      overlay.addEventListener('click', (e) => {
        if (flow.isFlowActive) return;
        if (e.target === overlay) {
          closeModal();
          resolve({ proceed: false });
        }
      });

      function onKeyDown(e) {
        if (!e.isTrusted) return;
        if (e.key === 'Escape') {
          window.removeEventListener('keydown', onKeyDown);
          handleAbortOrCancel();
        }
      }
      window.addEventListener('keydown', onKeyDown);
    });
  }

  function openExportModal(options = {}) {
    return openUnifiedExportModal({
      defaultMode: options.isAllRro ? 'all' : 'single',
      ...options
    });
  }

  function openYearExportModal(options = {}) {
    return openUnifiedExportModal({
      defaultMode: 'income_book',
      ...options
    });
  }

  function closeModal() {
    if (window.KaderGo.ModalDock) {
      window.KaderGo.ModalDock.remove();
    }
    document.querySelectorAll('#tax-gov-kadergo-modal-overlay, #kg-modal-overlay, .kadergo-modal-overlay').forEach(el => {
      try { el.remove(); } catch (e) {}
    });
    currentModalEl = null;
    currentRestoreFn = null;
    try {
      sessionStorage.removeItem('kadergo_fop_group');
      sessionStorage.removeItem('kadergo_reopened_from_detect');
      sessionStorage.removeItem('kadergo_reopen_modal');
      sessionStorage.removeItem('kadergo_pending_detect_group');
    } catch (e) {}
  }

  window.KaderGo.Modal = {
    openUnifiedExportModal,
    openExportModal,
    openYearExportModal,
    closeModal,
    restoreModal: function () {
      if (typeof currentRestoreFn === 'function') {
        currentRestoreFn();
        return true;
      }
      return false;
    }
  };
})();
