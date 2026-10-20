// ==============================================================================
// KaderGo - Unified Export Modal Controller
// Sub-components: ModalAssets (vectors & icons), ModalDock (background extraction mini-dock)
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  let currentModalEl = null;
  let currentRestoreFn = null;

  const { animatedKaderGoLogoSvg, kadergoFlowSvg, icons } = window.KaderGo.ModalAssets || {};
  const ModalDock = window.KaderGo.ModalDock;

  function openUnifiedExportModal(initialOptions = {}) {
    return new Promise((resolve) => {
      closeModal();

      const { DateUtils, Cabinet } = window.KaderGo || {};
      const now = new Date();
      const currentYear = now.getFullYear();

      // Read current cabinet state
      const { fromInput, toInput } = (Cabinet && typeof Cabinet.getPeriodInputs === 'function')
        ? Cabinet.getPeriodInputs()
        : { fromInput: null, toInput: null };

      const origFrom = (fromInput?.value || '').trim();
      const origTo = (toInput?.value || '').trim();
      const hasValidCabinetPeriod = (Cabinet && typeof Cabinet.hasValidPeriod === 'function')
        ? Cabinet.hasValidPeriod()
        : false;
      const targetFn = (Cabinet && typeof Cabinet.getCurrentlySelectedFiscalNumber === 'function')
        ? Cabinet.getCurrentlySelectedFiscalNumber()
        : null;

      // Intervals from cabinet period (if valid)
      let cabinetIntervals = [];
      if (hasValidCabinetPeriod && DateUtils && typeof DateUtils.splitDateRangeIntoMonthlyIntervals === 'function') {
        cabinetIntervals = DateUtils.splitDateRangeIntoMonthlyIntervals(origFrom, origTo);
      }

      // Disabled state checks per requirement:
      // - "Всі РРО": disabled if date is not specified
      // - "Обраний РРО": disabled if date is not specified OR fiscal number is not specified
      const isSingleDisabled = !hasValidCabinetPeriod || !targetFn;
      const isAllDisabled = !hasValidCabinetPeriod;

      let singleTitle = 'Обраний РРО';
      if (!hasValidCabinetPeriod && !targetFn) {
        singleTitle = 'Вкажіть період та оберіть РРО у кабінеті';
      } else if (!hasValidCabinetPeriod) {
        singleTitle = 'Вкажіть період (дати «з» та «по») у кабінеті';
      } else if (!targetFn) {
        singleTitle = 'Оберіть фіскальний номер РРО у кабінеті';
      }

      let allTitle = 'Всі РРО';
      if (!hasValidCabinetPeriod) {
        allTitle = 'Вкажіть період (дати «з» та «по») у кабінеті';
      }

      // Default active mode: choose the first non-disabled mode
      let activeMode = initialOptions.defaultMode;
      if (activeMode === 'single' && isSingleDisabled) activeMode = null;
      if (activeMode === 'all' && isAllDisabled) activeMode = null;

      if (!activeMode) {
        if (!isSingleDisabled) {
          activeMode = 'single';
        } else if (!isAllDisabled) {
          activeMode = 'all';
        } else {
          activeMode = 'income_book';
        }
      }

      // State per mode
      let singleFormat = 'xlsx'; // 'xlsx' | 'zip'
      let allFormat = 'zip';     // 'zip' | 'xlsx'
      let selectedYear = initialOptions.initialYear ? parseInt(initialOptions.initialYear, 10) : currentYear;
      let bookFormat = 'book';   // 'book' | 'zip'

      const availableYears = [
        currentYear - 2,
        currentYear - 1,
        currentYear,
        currentYear + 1,
        currentYear + 2
      ];

      // Construct modal DOM elements via ModalTemplates sub-component
      const {
        overlay,
        card,
        titleWrap,
        minimizeBtn,
        closeBtn,
        body,
        tabsWrap,
        yearSection,
        formatSection,
        formatOptionsWrap,
        fileSection,
        fileChipsWrap,
        footer,
        cancelBtn,
        confirmBtn,
        flowWrap
      } = window.KaderGo.ModalTemplates.createModalDom({
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
          updateView();
        }
      });

      function updateView() {
        const heroIconBox = card.querySelector('#kg-hero-icon-box');
        const heroTag = card.querySelector('#kg-hero-tag');
        const heroTitle = card.querySelector('#kg-hero-title');
        const heroBadge = card.querySelector('#kg-hero-badge');
        const periodVal = card.querySelector('#kg-grid-period-val');
        const modeVal = card.querySelector('#kg-grid-mode-val');

        // Tabs active and disabled states
        tabsWrap.querySelectorAll('.kadergo-mode-tab').forEach((t) => {
          const mode = t.getAttribute('data-mode');
          if (mode === 'single') {
            if (isSingleDisabled) t.classList.add('disabled');
            else t.classList.remove('disabled');
          } else if (mode === 'all') {
            if (isAllDisabled) t.classList.add('disabled');
            else t.classList.remove('disabled');
          }

          if (mode === activeMode) {
            t.classList.add('active');
          } else {
            t.classList.remove('active');
          }
        });

        if (activeMode === 'single') {
          // Hide year selector completely
          yearSection.classList.add('hidden');
          yearSection.style.setProperty('display', 'none', 'important');

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

            // Format section
            if (cabinetIntervals.length > 1) {
              formatSection.style.display = 'block';
              formatOptionsWrap.innerHTML = `
                <button type="button" class="kadergo-format-btn ${singleFormat === 'zip' ? 'active' : ''}" data-fmt="zip">
                  <span class="kadergo-format-btn-icon">${icons.archive}</span>
                  <span>Архів ZIP</span>
                </button>
                <button type="button" class="kadergo-format-btn ${singleFormat === 'xlsx' ? 'active' : ''}" data-fmt="xlsx">
                  <span class="kadergo-format-btn-icon">${icons.fileSpreadsheet}</span>
                  <span>Окремі файли Excel</span>
                </button>
              `;
            } else {
              formatSection.style.display = 'none';
            }

            // File chips (Standard clean filename)
            fileChipsWrap.innerHTML = '';
            if (singleFormat === 'zip') {
              const zipChip = document.createElement('span');
              zipChip.className = 'kadergo-file-chip kadergo-file-chip-zip';
              const cleanZipName = `оборот_${origFrom}_${origTo}.zip`
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
            formatSection.style.display = 'none';
            fileChipsWrap.innerHTML = `
              <span class="kadergo-file-chip" style="opacity: 0.7;">
                ${icons.calendar}<span>${singleTitle}</span>
              </span>
            `;

            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<span>${singleTitle}</span>`;
          }

        } else if (activeMode === 'all') {
          // Hide year selector completely
          yearSection.classList.add('hidden');
          yearSection.style.setProperty('display', 'none', 'important');

          heroIconBox.innerHTML = icons.layers;
          heroTag.textContent = 'Автоматичний збір';
          heroTitle.textContent = 'Оборот по всіх РРО';

          if (hasValidCabinetPeriod) {
            periodVal.textContent = `${origFrom} — ${origTo}`;
            periodVal.style.color = '';
            modeVal.textContent = 'Всі РРО';

            const badgeText = allFormat === 'zip' ? 'Архів ZIP' : 'Окремі файли';
            heroBadge.textContent = badgeText;

            formatSection.style.display = 'block';
            formatOptionsWrap.innerHTML = `
              <button type="button" class="kadergo-format-btn ${allFormat === 'zip' ? 'active' : ''}" data-fmt="zip">
                <span class="kadergo-format-btn-icon">${icons.archive}</span>
                <span>Архів ZIP</span>
              </button>
              <button type="button" class="kadergo-format-btn ${allFormat === 'xlsx' ? 'active' : ''}" data-fmt="xlsx">
                <span class="kadergo-format-btn-icon">${icons.fileSpreadsheet}</span>
                <span>Окремі файли Excel</span>
              </button>
            `;

            fileChipsWrap.innerHTML = '';
            if (allFormat === 'zip') {
              const zipChip = document.createElement('span');
              zipChip.className = 'kadergo-file-chip kadergo-file-chip-zip';
              const cleanZipName = `оборот_${origFrom}_${origTo}.zip`
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
            formatSection.style.display = 'none';
            fileChipsWrap.innerHTML = `
              <span class="kadergo-file-chip" style="opacity: 0.7;">
                ${icons.calendar}<span>Вкажіть період (дати «з» та «по») у кабінеті</span>
              </span>
            `;

            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<span>Вкажіть період в кабінеті</span>`;
          }

        } else if (activeMode === 'income_book') {
          // Show year selector for Income Book mode
          yearSection.classList.remove('hidden');
          yearSection.style.setProperty('display', 'flex', 'important');

          heroIconBox.innerHTML = icons.bookOpen;
          heroTag.textContent = 'Єдиний податок';
          heroTitle.textContent = 'Книга обліку доходів';
          heroBadge.textContent = `${selectedYear} рік`;

          const yearInfo = DateUtils ? DateUtils.getYearExportInfo(selectedYear) : {};
          periodVal.textContent = `${yearInfo.startStr || ''} — ${yearInfo.endStr || ''}`;
          periodVal.style.color = '';
          modeVal.textContent = 'Всі РРО';

          formatSection.style.display = 'block';
          formatOptionsWrap.innerHTML = `
            <button type="button" class="kadergo-format-btn ${bookFormat === 'book' ? 'active' : ''}" data-fmt="book">
              <span class="kadergo-format-btn-icon">${icons.fileSpreadsheet}</span>
              <span>Тільки Книга (.xlsx)</span>
            </button>
            <button type="button" class="kadergo-format-btn ${bookFormat === 'zip' ? 'active' : ''}" data-fmt="zip">
              <span class="kadergo-format-btn-icon">${icons.archive}</span>
              <span>Книга + щомісячні (ZIP)</span>
            </button>
          `;

          fileChipsWrap.innerHTML = '';
          if (bookFormat === 'zip') {
            const zipChip = document.createElement('span');
            zipChip.className = 'kadergo-file-chip kadergo-file-chip-zip';
            zipChip.innerHTML = `${icons.archive}<span>Книга_обліку_доходів_${selectedYear}_рік.zip</span>`;
            fileChipsWrap.appendChild(zipChip);
          } else {
            const bookChip = document.createElement('span');
            bookChip.className = 'kadergo-file-chip kadergo-file-chip-gold';
            bookChip.innerHTML = `${icons.bookOpen}<span>Книга обліку доходів єдиний за ${selectedYear} рік.xlsx</span>`;
            fileChipsWrap.appendChild(bookChip);
          }

          if (!yearInfo.hasCompletedMonths) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<span>Немає завершених місяців</span>`;
          } else {
            confirmBtn.disabled = false;
            const actionText = bookFormat === 'zip'
              ? `Сформувати ZIP (${selectedYear})`
              : `Сформувати Книгу (${selectedYear})`;
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

      document.body.appendChild(overlay);
      currentModalEl = overlay;

      let isFlowActive = false;
      let isSuccessActive = false;
      let isAborted = false;

      const flow = {
        isAborted() {
          return isAborted;
        },
        abort() {
          isAborted = true;
        },
        setProgress(opts = {}) {
          if (isAborted) return;
          const { title, subtitle, progressPercent, monthName, year, monthStep, monthTotal, stepText } = opts;
          const flowSubtitleEl = card.querySelector('#kg-flow-subtitle');
          const barEl = card.querySelector('#kg-flow-progress-bar');
          const pctEl = card.querySelector('#kg-flow-percent');
          const footerTextEl = card.querySelector('#kg-flow-footer-text');
          const monthNameEl = card.querySelector('#kg-flow-month-name');
          const stepTagEl = card.querySelector('#kg-flow-step-tag');

          if (monthNameEl) {
            if (monthName) {
              monthNameEl.textContent = `${monthName} ${year || ''}`.trim();
            } else if (title) {
              monthNameEl.textContent = title;
            }
          }

          if (stepTagEl) {
            if (stepText) {
              stepTagEl.textContent = stepText;
            } else if (monthStep && monthTotal) {
              stepTagEl.textContent = monthTotal > 1 ? `${monthStep} з ${monthTotal} міс.` : 'Звітний період';
            }
          }

          if (subtitle !== undefined && flowSubtitleEl) flowSubtitleEl.textContent = subtitle;

          if (ModalDock && ModalDock.getIsVisible()) {
            ModalDock.update({
              monthName: opts.monthName,
              year: opts.year,
              subtitle: opts.subtitle,
              progressPercent: opts.progressPercent
            });
          }
          if (typeof progressPercent === 'number') {
            const clamped = Math.min(100, Math.max(0, Math.round(progressPercent)));
            if (barEl) {
              barEl.style.setProperty('width', clamped + '%', 'important');
            }
            if (pctEl) {
              pctEl.textContent = clamped + '%';
            }
            if (footerTextEl) {
              if (clamped >= 90) {
                footerTextEl.textContent = 'Фіналізація та підготовка файлів Excel...';
              } else if (clamped >= 50) {
                footerTextEl.textContent = 'Зчитування та обробка даних кабінету...';
              } else {
                footerTextEl.textContent = 'Синхронізація з кабінетом платника податків...';
              }
            }
          }
        },
        async setSuccess({ title, subtitle } = {}) {
          if (isAborted) return;
          isSuccessActive = true;
          const stageCard = card.querySelector('#kg-stage-card');
          const flowSubtitleEl = card.querySelector('#kg-flow-subtitle');
          const barEl = card.querySelector('#kg-flow-progress-bar');
          const pctEl = card.querySelector('#kg-flow-percent');
          const livePill = card.querySelector('#kg-flow-live-pill');
          const liveLabel = card.querySelector('#kg-flow-live-label');
          const footerTextEl = card.querySelector('#kg-flow-footer-text');
          const monthNameEl = card.querySelector('#kg-flow-month-name');
          const stepTagEl = card.querySelector('#kg-flow-step-tag');

          if (monthNameEl) monthNameEl.textContent = 'Звітність сформовано';
          if (stepTagEl) stepTagEl.textContent = '100% Готово';

          if (stageCard) stageCard.classList.add('state-success');
          if (livePill) livePill.classList.add('state-done');
          if (liveLabel) liveLabel.textContent = 'ГОТОВО ДО ЗБЕРЕЖЕННЯ';
          if (title && monthNameEl) monthNameEl.textContent = title;
          if (subtitle !== undefined && flowSubtitleEl) flowSubtitleEl.textContent = subtitle;
          if (barEl) barEl.style.setProperty('width', '100%', 'important');
          if (pctEl) pctEl.textContent = '100%';
          if (footerTextEl) footerTextEl.textContent = 'Генерацію успішно завершено!';

          if (ModalDock && ModalDock.getIsVisible()) {
            ModalDock.setSuccess({
              title: title || 'Файли успішно згенеровано!',
              subtitle: subtitle || 'Оберіть місце для збереження'
            });
          }

          const svgEl = flowWrap.querySelector('.kadergo-flow-svg');
          if (svgEl) {
            svgEl.setAttribute('class', 'kadergo-flow-svg state-success');
          }
          // Показ та малювання успішної пипи (~850мс)
          await new Promise((r) => setTimeout(r, 850));
        },
        async closeWithOutro() {
          if (isAborted) {
            closeModal();
            return;
          }
          if (isSuccessActive) {
            const svgEl = flowWrap.querySelector('.kadergo-flow-svg');
            if (svgEl) {
              svgEl.setAttribute('class', 'kadergo-flow-svg state-check-outro');
            }
            // Анімація згортання та відлуння пипи (~480мс)
            await new Promise((r) => setTimeout(r, 480));
          }
          closeModal();
        },
        close() {
          closeModal();
        }
      };

      function minimizeModal() {
        if (!isFlowActive) return;
        overlay.classList.add('minimized');
        overlay.style.setProperty('display', 'none', 'important');

        const monthName = card.querySelector('#kg-flow-month-name')?.textContent || '';
        const subtitle = card.querySelector('#kg-flow-subtitle')?.textContent || '';
        const pctText = card.querySelector('#kg-flow-percent')?.textContent || '0%';
        const progressPercent = parseInt(pctText, 10) || 0;

        if (ModalDock && typeof ModalDock.show === 'function') {
          ModalDock.show({
            initialData: { monthName, subtitle, progressPercent },
            onRestore: restoreModal,
            onAbort: handleAbortOrCancel
          });
        }
      }

      function restoreModal() {
        if (ModalDock && typeof ModalDock.hide === 'function') {
          ModalDock.hide();
        }
        overlay.classList.remove('minimized');
        overlay.style.setProperty('display', 'flex', 'important');
      }

      currentRestoreFn = restoreModal;

      minimizeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        minimizeModal();
      });

      confirmBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        isFlowActive = true;
        card.classList.add('flow-active');
        if (minimizeBtn) {
          minimizeBtn.style.display = 'inline-flex';
        }
        if (closeBtn) {
          closeBtn.style.visibility = 'visible';
          closeBtn.title = 'Скасувати та повернутися';
        }

        if (titleWrap) {
          titleWrap.innerHTML = '<span>Вивантаження звітів KaderGo</span>';
        }

        const flowSubtitleEl = card.querySelector('#kg-flow-subtitle');
        const barEl = card.querySelector('#kg-flow-progress-bar');
        const pctEl = card.querySelector('#kg-flow-percent');
        const svgEl = flowWrap.querySelector('.kadergo-flow-svg');

        // 1. FÁZIS: LOGÓ MEGJELENÉS (STATE-INTRO)
        if (svgEl) {
          svgEl.setAttribute('class', 'kadergo-flow-svg state-intro');
        }
        const monthNameEl = card.querySelector('#kg-flow-month-name');
        const stepTagEl = card.querySelector('#kg-flow-step-tag');
        if (monthNameEl) monthNameEl.textContent = 'Ініціалізація KaderGo...';
        if (stepTagEl) stepTagEl.textContent = 'Підготовка';
        if (flowSubtitleEl) flowSubtitleEl.textContent = 'Зв\'язок з кабінетом платника...';
        if (barEl) barEl.style.setProperty('width', '5%', 'important');
        if (pctEl) pctEl.textContent = '5%';

        // Megvárjuk, amíg a logó animációja kirajzolódik és összeáll (~1000ms)
        await new Promise((r) => setTimeout(r, 1000));
        if (isAborted) {
          resolve({ proceed: false, cancelled: true });
          return;
        }

        // 2. FÁZIS: MORPH LOADING SPINNERRE (STATE-SPINNER)
        if (svgEl) {
          svgEl.setAttribute('class', 'kadergo-flow-svg state-spinner');
        }
        if (monthNameEl) monthNameEl.textContent = 'Завантаження та обробка даних...';
        if (stepTagEl) stepTagEl.textContent = 'Синхронізація';
        if (flowSubtitleEl) flowSubtitleEl.textContent = 'Зчитування параметрів звітності...';
        if (barEl) barEl.style.setProperty('width', '12%', 'important');
        if (pctEl) pctEl.textContent = '12%';

        if (activeMode === 'single') {
          resolve({
            proceed: true,
            mode: 'single',
            format: singleFormat,
            targetFn,
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
          resolve({
            proceed: true,
            mode: 'income_book',
            format: bookFormat,
            year: selectedYear,
            flow
          });
        }
      });

      function handleAbortOrCancel() {
        if (isFlowActive) {
          // Ha kiszedés közben rákattint az X-re: leállítjuk a folyamatot és bezárjuk
          isAborted = true;
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
        if (isFlowActive) return; // Nem szakítjuk meg véletlenül, ha a footer már rejtve van
        closeModal();
        resolve({ proceed: false });
      });

      overlay.addEventListener('click', (e) => {
        // FONTOS: Folyamat közben a háttérre kattintás NEM lőheti le a letöltést!
        if (isFlowActive) return;
        if (e.target === overlay) {
          closeModal();
          resolve({ proceed: false });
        }
      });

      function onKeyDown(e) {
        // KRITIKUS: CSAK VALÓDI FELHASZNÁLÓI GOMBNYOMÁSRA (e.isTrusted === true) REAGÁLUNK!
        // A PrimeNG datepicker és autocomplete komponensek belsőleg szintetikus Escape KeyboardEvent-et küldenek
        // bubbles: true-val a naptár popup bezárására, ami azonnal ledroppolta volna a letöltést!
        if (!e.isTrusted) return;

        if (e.key === 'Escape') {
          window.removeEventListener('keydown', onKeyDown);
          handleAbortOrCancel();
        }
      }
      window.addEventListener('keydown', onKeyDown);
    });
  }

  /**
   * Backward compatibility alias for single/all export modal
   */
  function openExportModal(options = {}) {
    return openUnifiedExportModal({
      defaultMode: options.isAllRro ? 'all' : 'single',
      ...options
    });
  }

  /**
   * Backward compatibility alias for annual income book modal
   */
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
    if (currentModalEl && currentModalEl.parentNode) {
      currentModalEl.remove();
      currentModalEl = null;
    }
    currentRestoreFn = null;
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

