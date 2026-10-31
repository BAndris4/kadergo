// ==============================================================================
// KaderGo - Modal Flow & Animation Controller
// Manages loading states, progress bar, stage cards, and mini-dock sync
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  /**
   * Creates a Flow controller attached to the modal DOM.
   * @param {Object} opts
   * @param {HTMLElement} opts.card
   * @param {HTMLElement} opts.flowWrap
   * @param {HTMLElement} opts.overlay
   * @param {HTMLElement} opts.minimizeBtn
   * @param {HTMLElement} opts.closeBtn
   * @param {HTMLElement} opts.titleWrap
   * @param {Function} opts.onCloseModal
   * @param {Function} opts.onAbort
   */
  function createModalFlow(opts) {
    const {
      card,
      flowWrap,
      overlay,
      minimizeBtn,
      closeBtn,
      titleWrap,
      onCloseModal,
      onAbort
    } = opts;

    const ModalDock = window.KaderGo.ModalDock;

    let isFlowActive = false;
    let isSuccessActive = false;
    let isAborted = false;
    let pendingPromptResolve = null;

    if (closeBtn) {
      closeBtn.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        abort();
        if (typeof onCloseModal === 'function') {
          onCloseModal();
        } else if (overlay && overlay.parentNode) {
          overlay.remove();
        }
      };
    }

    // Strict monotonic progress tracker: percentage NEVER jumps backwards
    let maxProgressPercent = 0;
    try {
      const savedPct = parseInt(sessionStorage.getItem('kadergo_flow_progress'), 10);
      if (!isNaN(savedPct) && savedPct > 0) {
        maxProgressPercent = Math.min(100, savedPct);
      }
    } catch (e) {}

    function setMonotonicProgress(pct) {
      const requested = Math.min(100, Math.max(0, Math.round(pct)));
      if (requested > maxProgressPercent) {
        maxProgressPercent = requested;
        try {
          sessionStorage.setItem('kadergo_flow_progress', String(maxProgressPercent));
        } catch (e) {}
      }

      const barEl = card.querySelector('#kg-flow-progress-bar');
      const pctEl = card.querySelector('#kg-flow-percent');
      const footerTextEl = card.querySelector('#kg-flow-footer-text');

      if (barEl) {
        barEl.style.setProperty('width', maxProgressPercent + '%', 'important');
      }
      if (pctEl) {
        pctEl.textContent = maxProgressPercent + '%';
      }
      if (footerTextEl) {
        if (maxProgressPercent >= 90) {
          footerTextEl.textContent = 'Фіналізація та підготовка файлів Excel...';
        } else if (maxProgressPercent >= 50) {
          footerTextEl.textContent = 'Зчитування та обробка даних кабінету...';
        } else {
          footerTextEl.textContent = 'Синхронізація з кабінетом платника податків...';
        }
      }
    }

    function isAbortedFn() {
      return isAborted;
    }

    async function startIntro() {
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

      // 1. PHASE: LOGO ANIMATION (STATE-INTRO)
      if (svgEl) {
        svgEl.setAttribute('class', 'kadergo-flow-svg state-intro');
      }
      const monthNameEl = card.querySelector('#kg-flow-month-name');
      const stepTagEl = card.querySelector('#kg-flow-step-tag');
      if (monthNameEl) monthNameEl.textContent = 'Ініціалізація KaderGo...';
      if (stepTagEl) stepTagEl.textContent = 'Підготовка';
      if (flowSubtitleEl) flowSubtitleEl.textContent = 'Зв\'язок з кабінетом платника...';
      maxProgressPercent = 0;
      try {
        sessionStorage.removeItem('kadergo_flow_progress');
      } catch (e) {}
      setMonotonicProgress(5);

      await new Promise((r) => setTimeout(r, 1050));
      if (isAborted) return false;

      // 2. PHASE: MORPH FROM K TO LOADING SPINNER (STATE-INTRO-MORPH)
      if (svgEl) {
        svgEl.setAttribute('class', 'kadergo-flow-svg state-intro-morph');
      }
      if (monthNameEl) monthNameEl.textContent = 'Завантаження звітів...';
      if (stepTagEl) stepTagEl.textContent = 'Синхронізація';

      // Wait for the full morph animation to complete before resolving
      await new Promise((r) => setTimeout(r, 680));
      if (isAborted) return false;

      // 3. PHASE: STEADY STATE CONTINUOUS SPINNER
      if (svgEl) {
        svgEl.setAttribute('class', 'kadergo-flow-svg state-spinner');
      }

      return true;
    }

    function update(options = {}) {
      if (isAborted || isSuccessActive) return;

      const {
        title,
        subtitle,
        progressPercent,
        monthName,
        year,
        monthStep,
        monthTotal,
        stepText
      } = options;

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
          monthName: options.monthName,
          year: options.year,
          subtitle: options.subtitle,
          progressPercent: options.progressPercent
        });
      }

      if (typeof progressPercent === 'number') {
        setMonotonicProgress(progressPercent);
      }
    }

    async function setSuccess({ title, subtitle } = {}) {
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

      // Allow pipa animation to draw (~850ms)
      await new Promise((r) => setTimeout(r, 850));
    }

    function promptWorkerSalaries(options = {}) {
      if (isAborted) return Promise.resolve(null);

      const {
        detectedTaxText = 'ЄСВ за найманих працівників',
        initialWorkers = [{ name: 'Працівник 1', amount: 13000 }]
      } = options;

      return new Promise((resolve) => {
        pendingPromptResolve = resolve;
        const svgEl = flowWrap.querySelector('.kadergo-flow-svg');
        const stageCard = card.querySelector('#kg-stage-card');
        let promptWrap = card.querySelector('#kg-flow-prompt-wrap');

        if (!promptWrap) {
          promptWrap = document.createElement('div');
          promptWrap.id = 'kg-flow-prompt-wrap';
          promptWrap.className = 'kadergo-flow-prompt-wrap';
          const infoEl = card.querySelector('.kadergo-flow-info') || flowWrap;
          infoEl.appendChild(promptWrap);
        }

        // Activate Question Mark SVG state
        if (svgEl) {
          svgEl.setAttribute('class', 'kadergo-flow-svg state-prompt');
        }

        // 2. Smoothly fade out the stage card while question mark draws
        if (stageCard) {
          stageCard.classList.add('fade-out');
        }
        promptWrap.style.display = 'none';
        promptWrap.classList.remove('slide-up-in', 'slide-down-out');

        let workers = Array.isArray(initialWorkers) && initialWorkers.length > 0
          ? JSON.parse(JSON.stringify(initialWorkers))
          : [{ name: 'Працівник 1', amount: 13000 }];

        function escapeHtml(str) {
          return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        promptWrap.innerHTML = `
          <div class="kg-prompt-card">
            <div class="kg-prompt-header">
              <div class="kg-prompt-badge">
                <span class="kg-prompt-dot"></span>
                <span>${escapeHtml(String(detectedTaxText || 'ЄСВ за найманих працівників').replace(/\(?код\s*71010000\)?/gi, '').trim())}</span>
              </div>
              <h3 class="kg-prompt-title">Витрати на оплату праці</h3>
              <p class="kg-prompt-desc">Вкажіть щомісячний оклад для графи 7 Книги:</p>
            </div>

            <div class="kg-worker-rows" id="kg-worker-rows"></div>

            <div class="kg-prompt-actions">
              <button type="button" class="kg-add-worker-btn" id="kg-add-worker-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Додати працівника</span>
              </button>
              <div class="kg-prompt-total-badge">
                Разом: <strong id="kg-prompt-total-val">13 000 ₴</strong>
              </div>
            </div>

            <div class="kg-prompt-footer">
              <button type="button" class="kg-prompt-submit-btn" id="kg-prompt-submit-btn">
                <span>Продовжити формування книги</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        `;

        function updateTotal() {
          const totalValEl = promptWrap.querySelector('#kg-prompt-total-val');
          const sum = workers.reduce((acc, w) => acc + (parseFloat(w.amount) || 0), 0);
          if (totalValEl) {
            totalValEl.textContent = `${sum.toLocaleString('uk-UA')} ₴ / міс`;
          }
        }

        function renderRows() {
          const rowsContainer = promptWrap.querySelector('#kg-worker-rows');
          if (!rowsContainer) return;

          if (workers.length === 0) {
            rowsContainer.innerHTML = `
              <div class="kg-worker-empty-notice">
                Працівників не вказано (витрати за графою 7 = 0 грн)
              </div>
            `;
            updateTotal();
            return;
          }

          rowsContainer.innerHTML = workers.map((w, i) => `
            <div class="kg-worker-row" data-index="${i}">
              <div class="kg-worker-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>Працівник ${i + 1}</span>
              </div>
              <div class="kg-worker-amount-wrap">
                <input type="number" min="0" step="500" class="kg-worker-salary" value="${w.amount}" placeholder="0" />
                <span class="kg-worker-unit">₴ / міс</span>
              </div>
              <button type="button" class="kg-worker-del-btn" title="Видалити" aria-label="Видалити працівника">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          `).join('');

          updateTotal();
          attachRowEvents();
        }

        function attachRowEvents() {
          const rows = promptWrap.querySelectorAll('.kg-worker-row');
          rows.forEach((r) => {
            const idx = parseInt(r.getAttribute('data-index'), 10);
            const salaryIn = r.querySelector('.kg-worker-salary');
            const delBtn = r.querySelector('.kg-worker-del-btn');

            if (salaryIn) {
              salaryIn.addEventListener('input', () => {
                const val = parseFloat(salaryIn.value);
                workers[idx].amount = isNaN(val) ? 0 : val;
                updateTotal();
              });
            }
            if (delBtn) {
              delBtn.addEventListener('click', () => {
                workers.splice(idx, 1);
                workers.forEach((w, newIdx) => {
                  w.name = `Працівник ${newIdx + 1}`;
                });
                renderRows();
              });
            }
          });
        }

        renderRows();

        const addBtn = promptWrap.querySelector('#kg-add-worker-btn');
        if (addBtn) {
          addBtn.addEventListener('click', () => {
            workers.push({
              name: `Працівник ${workers.length + 1}`,
              amount: 13000
            });
            renderRows();
          });
        }

        // 3. Stage card fades out over 450ms. As question mark draws (~600ms),
        // smoothly animate modal height expanding while prompt card slides up!
        setTimeout(() => {
          const startHeight = card.offsetHeight;
          if (stageCard) {
            stageCard.style.display = 'none';
          }
          promptWrap.style.display = 'block';
          void promptWrap.offsetWidth;
          promptWrap.classList.add('slide-up-in');

          card.style.removeProperty('height');
          card.style.removeProperty('transition');
          const targetHeight = card.offsetHeight;

          card.style.setProperty('height', startHeight + 'px', 'important');
          card.style.setProperty('transition', 'none', 'important');
          void card.offsetHeight;

          card.style.setProperty('transition', 'height 0.65s cubic-bezier(0.16, 1, 0.3, 1)', 'important');
          card.style.setProperty('height', targetHeight + 'px', 'important');

          setTimeout(() => {
            card.style.removeProperty('height');
            card.style.removeProperty('transition');
          }, 680);
        }, 580);

        const submitBtn = promptWrap.querySelector('#kg-prompt-submit-btn');
        if (submitBtn) {
          submitBtn.addEventListener('click', async () => {
            // 1. Measure starting height of card before changing layout
            const startHeight = card.offsetHeight;

            // 2. Position promptWrap absolute so it floats smoothly over stageCard during collapse
            promptWrap.style.position = 'absolute';
            promptWrap.style.top = '0';
            promptWrap.style.left = '0';
            promptWrap.style.width = '100%';
            promptWrap.style.pointerEvents = 'none';

            // 3. Show stageCard in the normal document flow (initially transparent)
            if (stageCard) {
              stageCard.style.display = '';
              stageCard.classList.add('fade-out');
            }

            // 4. Measure the natural target height with stageCard active
            card.style.removeProperty('height');
            card.style.removeProperty('transition');
            const targetHeight = card.offsetHeight;

            // 5. Lock card height to startHeight initially
            card.style.setProperty('height', startHeight + 'px', 'important');
            card.style.setProperty('transition', 'none', 'important');
            void card.offsetHeight; // Force layout reflow

            // 6. Trigger SVG question mark -> spinner transition
            if (svgEl) {
              svgEl.setAttribute('class', 'kadergo-flow-svg state-prompt-to-spinner');
            }

            // 7. Animate card height slowly and smoothly down to targetHeight over 680ms
            card.style.setProperty('transition', 'height 0.68s cubic-bezier(0.22, 1, 0.36, 1)', 'important');
            card.style.setProperty('height', targetHeight + 'px', 'important');

            // 8. Animate prompt card sliding down & fading out
            promptWrap.classList.remove('slide-up-in');
            promptWrap.classList.add('slide-down-out');

            // 9. Animate stageCard smoothly fading in
            if (stageCard) {
              void stageCard.offsetWidth;
              stageCard.classList.remove('fade-out');
            }

            // 10. Wait for the smooth height reduction and spinner reappearance to finish
            await new Promise((r) => setTimeout(r, 680));

            if (svgEl) {
              svgEl.setAttribute('class', 'kadergo-flow-svg state-spinner');
            }

            // 11. Clean up temporary inline styles
            promptWrap.style.display = 'none';
            promptWrap.style.removeProperty('position');
            promptWrap.style.removeProperty('top');
            promptWrap.style.removeProperty('left');
            promptWrap.style.removeProperty('width');
            promptWrap.style.removeProperty('pointer-events');
            promptWrap.classList.remove('slide-down-out');

            card.style.removeProperty('height');
            card.style.removeProperty('transition');

            pendingPromptResolve = null;
            resolve(workers);
          });
        }
      });
    }

    async function closeWithOutro() {
      if (isAborted) {
        if (typeof onCloseModal === 'function') onCloseModal();
        return;
      }
      if (isSuccessActive) {
        const svgEl = flowWrap.querySelector('.kadergo-flow-svg');
        if (svgEl) {
          svgEl.setAttribute('class', 'kadergo-flow-svg state-check-outro');
        }
        await new Promise((r) => setTimeout(r, 480));
      }
      if (typeof onCloseModal === 'function') onCloseModal();
    }

    function abort() {
      isAborted = true;
      if (pendingPromptResolve) {
        const r = pendingPromptResolve;
        pendingPromptResolve = null;
        r(null);
      }
      try {
        sessionStorage.removeItem('kadergo_fullscreen_flow_active');
        sessionStorage.removeItem('kadergo_flow_progress');
        sessionStorage.removeItem('kadergo_auto_start_general_export');
        sessionStorage.removeItem('kadergo_pending_general_export');
        sessionStorage.removeItem('kadergo_pending_detect_group');
        sessionStorage.removeItem('kadergo_reopen_modal');
      } catch (e) {}
      if (ModalDock && typeof ModalDock.remove === 'function') {
        ModalDock.remove();
      }
      if (typeof onAbort === 'function') {
        onAbort();
      }
      if (overlay && overlay.parentNode) {
        try { overlay.remove(); } catch (e) {}
      }
    }

    function minimize() {
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
          onRestore: restore,
          onAbort: abort
        });
      }
    }

    function restore() {
      if (ModalDock && typeof ModalDock.hide === 'function') {
        ModalDock.hide();
      }
      overlay.classList.remove('minimized');
      overlay.style.setProperty('display', 'flex', 'important');
    }

    const controllerInstance = {
      startIntro,
      update,
      setProgress: update,
      setSuccess,
      promptWorkerSalaries,
      closeWithOutro,
      abort,
      minimize,
      restore,
      isAborted: isAbortedFn,
      get isFlowActive() { return isFlowActive; },
      get isSuccessActive() { return isSuccessActive; }
    };

    activeFlowController = controllerInstance;
    return controllerInstance;
  }

  let activeFlowController = null;

  function getActiveFlowController() {
    return activeFlowController;
  }

  /**
   * Ensures the full-screen flow overlay with darkened backdrop and SVG spinner
   * persists continuously across page transitions / navigations.
   */
  function ensurePersistentFlowOverlay(options = {}) {
    // 1. Check for ANY existing modal overlay in the DOM (standardizing on #tax-gov-kadergo-modal-overlay)
    const existingOverlays = document.querySelectorAll('#tax-gov-kadergo-modal-overlay, #kg-modal-overlay, .kadergo-modal-overlay');
    let overlay = existingOverlays[0] || null;

    // Immediately remove any extra duplicate overlays from the DOM
    if (existingOverlays.length > 1) {
      for (let i = 1; i < existingOverlays.length; i++) {
        try { existingOverlays[i].remove(); } catch (e) {}
      }
    }

    if (overlay) {
      overlay.id = 'tax-gov-kadergo-modal-overlay';
      overlay.style.removeProperty('display');
      overlay.classList.remove('minimized');
      overlay.classList.add('flow-active');

      const card = overlay.querySelector('.kadergo-modal-card');
      if (card) {
        card.classList.add('flow-active');
      }

      const flowWrap = overlay.querySelector('#kg-modal-flow-wrap, .kadergo-modal-flow-wrap');
      if (flowWrap) {
        flowWrap.style.removeProperty('display');
        const svgEl = flowWrap.querySelector('.kadergo-flow-svg');
        if (svgEl &&
            !svgEl.classList.contains('state-success') &&
            !svgEl.classList.contains('state-prompt') &&
            !svgEl.classList.contains('state-prompt-to-spinner') &&
            !svgEl.classList.contains('state-intro') &&
            !svgEl.classList.contains('state-intro-morph') &&
            !svgEl.classList.contains('state-spinner')) {
          svgEl.setAttribute('class', 'kadergo-flow-svg state-spinner');
        }
      }

      if (activeFlowController) {
        if (options && Object.keys(options).length > 0 && options.forceUpdate) {
          activeFlowController.update(options);
        }
        return activeFlowController;
      }

      // Re-bind controller to existing DOM if controller was reset (e.g. after page reload)
      if (card && flowWrap) {
        activeFlowController = createModalFlow({
          card,
          flowWrap,
          overlay,
          closeBtn: overlay.querySelector('.kadergo-modal-close-btn, #kg-modal-close-btn'),
          titleWrap: overlay.querySelector('.kadergo-modal-main-title, .kadergo-brand-title'),
          onCloseModal: () => {
            overlay.remove();
          },
          onAbort: () => {
            try {
              sessionStorage.removeItem('kadergo_pending_general_export');
              sessionStorage.removeItem('kadergo_fullscreen_flow_active');
              sessionStorage.removeItem('kadergo_flow_progress');
            } catch (e) {}
            overlay.remove();
          }
        });

        if (options && Object.keys(options).length > 0) {
          activeFlowController.update(options);
        }
        return activeFlowController;
      }
    }

    // 2. Only if NO overlay exists in DOM, create one
    const assets = window.KaderGo.ModalAssets;
    const kadergoFlowSvg = assets?.kadergoFlowSvg || '';

    let initPct = 5;
    try {
      const savedPct = parseInt(sessionStorage.getItem('kadergo_flow_progress'), 10);
      if (!isNaN(savedPct) && savedPct > 0) {
        initPct = Math.min(100, savedPct);
      } else if (typeof options.progressPercent === 'number') {
        initPct = Math.min(100, Math.max(0, options.progressPercent));
      }
    } catch (e) {}

    overlay = document.createElement('div');
    overlay.className = 'kadergo-modal-overlay flow-active';
    overlay.id = 'tax-gov-kadergo-modal-overlay';
    overlay.style.setProperty('display', 'flex', 'important');

    const card = document.createElement('div');
    card.className = 'kadergo-modal-card flow-active';
    card.id = 'kg-modal-card';

    const header = document.createElement('div');
    header.className = 'kadergo-modal-header';
    header.innerHTML = `
      <div class="kadergo-modal-brand-wrap">
        <span class="kadergo-modal-logo-wrap">
          ${assets?.animatedKaderGoLogoSvg || ''}
        </span>
        <div class="kadergo-modal-header-divider"></div>
        <div class="kadergo-modal-main-title">
          <span>Вивантаження звітів KaderGo</span>
        </div>
      </div>
      <div class="kadergo-modal-header-actions">
        <button type="button" class="kadergo-modal-close-btn" id="kg-modal-close-btn" title="Скасувати">
          ${assets?.icons?.close || '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'}
        </button>
      </div>
    `;

    const flowWrap = document.createElement('div');
    flowWrap.className = 'kadergo-modal-flow-wrap';
    flowWrap.id = 'kg-modal-flow-wrap';
    flowWrap.innerHTML = `
      <div class="kadergo-flow-svg-box">
        ${kadergoFlowSvg}
      </div>
      <div class="kadergo-flow-info">
        <div class="kadergo-flow-stage-card" id="kg-stage-card">
          <div class="kadergo-flow-top-row">
            <div class="kadergo-flow-live-pill" id="kg-flow-live-pill">
              <span class="kadergo-flow-pulse-dot"></span>
              <span class="kadergo-flow-live-label" id="kg-flow-live-label">ОБРОБКА ДАНИХ</span>
            </div>
            <div class="kadergo-flow-percent-badge" id="kg-flow-badge">
              <span id="kg-flow-percent">${initPct}%</span>
            </div>
          </div>

          <div class="kadergo-flow-month-banner" id="kg-flow-month-banner">
            <div class="kadergo-flow-month-badge">
              <span class="kadergo-flow-calendar-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              <span class="kadergo-flow-month-name" id="kg-flow-month-name">${options.monthName || options.title || 'Стан розрахунків з бюджетом'}</span>
            </div>
            <div class="kadergo-flow-step-tag" id="kg-flow-step-tag">
              ${options.stepText || 'Синхронізація'}
            </div>
          </div>

          <div class="kadergo-flow-sub-card">
            <span class="kadergo-flow-sub-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
            <span class="kadergo-flow-subtitle" id="kg-flow-subtitle">${options.subtitle || 'Зчитування даних ЄСВ та ліцензій...'}</span>
          </div>

          <div class="kadergo-flow-progress-bar-wrap">
            <div class="kadergo-flow-progress-bar" id="kg-flow-progress-bar" style="width: ${initPct}%;">
              <div class="kadergo-flow-progress-glow"></div>
            </div>
          </div>
          <div class="kadergo-flow-footer-text" id="kg-flow-footer-text">
            Зчитування та обробка даних кабінету...
          </div>
        </div>
        <div class="kadergo-flow-prompt-wrap" id="kg-flow-prompt-wrap" style="display: none;"></div>
      </div>
    `;

    card.appendChild(header);
    card.appendChild(flowWrap);
    overlay.appendChild(card);

    (document.body || document.documentElement).appendChild(overlay);

    const svgEl = flowWrap.querySelector('.kadergo-flow-svg');
    if (svgEl) {
      svgEl.setAttribute('class', 'kadergo-flow-svg state-spinner');
    }

    const closeBtn = header.querySelector('#kg-modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        try {
          sessionStorage.removeItem('kadergo_pending_general_export');
          sessionStorage.removeItem('kadergo_fullscreen_flow_active');
        } catch (e) {}
        if (activeFlowController) activeFlowController.abort();
        overlay.remove();
      });
    }

    activeFlowController = createModalFlow({
      card,
      flowWrap,
      overlay,
      closeBtn,
      titleWrap: header.querySelector('.kadergo-modal-main-title'),
      onCloseModal: () => {
        overlay.remove();
      },
      onAbort: () => {
        try {
          sessionStorage.removeItem('kadergo_pending_general_export');
          sessionStorage.removeItem('kadergo_fullscreen_flow_active');
        } catch (e) {}
        overlay.remove();
      }
    });

    if (options && Object.keys(options).length > 0) {
      activeFlowController.update(options);
    }

    return activeFlowController;
  }

  window.KaderGo.ModalFlow = {
    createModalFlow,
    ensurePersistentFlowOverlay,
    getActiveFlowController
  };
})();