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
      if (barEl) barEl.style.setProperty('width', '5%', 'important');
      if (pctEl) pctEl.textContent = '5%';

      await new Promise((r) => setTimeout(r, 1000));
      if (isAborted) return false;

      // 2. PHASE: MORPH TO LOADING SPINNER (STATE-SPINNER)
      if (svgEl) {
        svgEl.setAttribute('class', 'kadergo-flow-svg state-spinner');
      }
      if (monthNameEl) monthNameEl.textContent = 'Завантаження та обробка даних...';
      if (stepTagEl) stepTagEl.textContent = 'Синхронізація';

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
      if (ModalDock && typeof ModalDock.remove === 'function') {
        ModalDock.remove();
      }
      if (typeof onAbort === 'function') {
        onAbort();
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

    return {
      startIntro,
      update,
      setProgress: update,
      setSuccess,
      closeWithOutro,
      abort,
      minimize,
      restore,
      isAborted: isAbortedFn,
      get isFlowActive() { return isFlowActive; },
      get isSuccessActive() { return isSuccessActive; }
    };
  }

  window.KaderGo.ModalFlow = {
    createModalFlow
  };
})();

