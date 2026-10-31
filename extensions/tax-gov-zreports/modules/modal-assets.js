// ==============================================================================
// KaderGo - Modal SVG Assets, Morphing Animation Vectors & Heroicons
// Sub-component of Unified Export Modal
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

const animatedKaderGoLogoSvg = `
    <svg class="kadergo-animated-logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 220" width="100%" height="100%" aria-label="KaderGo Logo">
      <defs>
        <style>
          .kg-anim-doc {
            animation: kgDocIdle 3.2s ease-in-out infinite;
            transform-origin: bottom center;
            transform-box: fill-box;
          }
          .kg-anim-arrow {
            animation: kgArrowIdle 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            transform-origin: bottom left;
            transform-box: fill-box;
          }
          .kg-anim-tab {
            animation: kgTabIdle 3.6s ease-in-out infinite;
            transform-origin: bottom right;
            transform-box: fill-box;
          }
          .kg-anim-folder {
            animation: kgFolderIdle 3.8s ease-in-out infinite;
            transform-origin: bottom center;
            transform-box: fill-box;
          }
          .kg-anim-swoosh-amber {
            animation: kgSwooshIdle 3.2s ease-in-out 0.2s infinite;
            transform-origin: bottom left;
            transform-box: fill-box;
          }
          .kg-anim-person {
            animation: kgPersonIdle 3.2s ease-in-out infinite;
            transform-origin: center bottom;
            transform-box: fill-box;
          }

          @keyframes kgDocIdle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4.5px); }
          }
          @keyframes kgArrowIdle {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(3.5px, -3.5px) scale(1.04); }
          }
          @keyframes kgTabIdle {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-2.8deg); }
          }
          @keyframes kgFolderIdle {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.98); }
          }
          @keyframes kgSwooshIdle {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.03) translate(1px, -1px); opacity: 0.92; }
          }
          @keyframes kgPersonIdle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }

          @media (prefers-reduced-motion: reduce) {
            .kadergo-animated-logo-svg * { animation: none !important; }
          }
        </style>

        <linearGradient id="kg-logo-tealMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e4e5e" />
          <stop offset="50%" stop-color="#133b47" />
          <stop offset="100%" stop-color="#0f2e38" />
        </linearGradient>
        <linearGradient id="kg-logo-tealBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2a5b6c" />
          <stop offset="100%" stop-color="#0f2e38" />
        </linearGradient>
        <linearGradient id="kg-logo-amberMain" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#e08e36" />
          <stop offset="50%" stop-color="#f59533" />
          <stop offset="100%" stop-color="#f8a44c" />
        </linearGradient>
        <linearGradient id="kg-logo-amberShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f59533" />
          <stop offset="100%" stop-color="#d47a22" />
        </linearGradient>

        <mask id="kg-logo-docCutout" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="220" height="220">
          <rect x="0" y="0" width="220" height="220" fill="white" />
          <path d="M 42 54 C 42 49 46 46 51 46 L 73 46 L 80 54 L 97 54 C 102 54 106 58 106 63 L 106 184 L 42 184 Z" fill="black" />
        </mask>

        <mask id="kg-logo-folderCutout" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="220" height="220">
          <rect x="0" y="0" width="220" height="220" fill="white" />
          <path d="M 38 194 C 46 136 94 96 148 34 L 194 34 C 142 106 86 138 64 194 Z" fill="black" />
        </mask>
      </defs>

      <!-- Білий squircle значок KaderGo -->
      <rect x="0" y="0" width="220" height="220" rx="46" ry="46" fill="#ffffff" stroke="#cbd8d6" stroke-width="4" />

      <g transform="translate(13, 13) scale(0.88)">
        <!-- Документ у папці -->
        <g mask="url(#kg-logo-docCutout)">
          <g class="kg-anim-doc">
            <path d="M 48 34 L 84 34 L 98 48 L 98 62 L 48 62 Z" fill="none" stroke="#133b47" stroke-width="4.5" stroke-linejoin="round" />
            <path d="M 84 34 L 84 48 L 98 48" fill="none" stroke="#133b47" stroke-width="4" stroke-linejoin="round" />
            <line x1="57" y1="44" x2="77" y2="44" stroke="#133b47" stroke-width="3.8" stroke-linecap="round" />
            <line x1="57" y1="52" x2="88" y2="52" stroke="#133b47" stroke-width="3.8" stroke-linecap="round" />
          </g>
        </g>

        <!-- Елементи папки -->
        <g mask="url(#kg-logo-folderCutout)">
          <path class="kg-anim-tab" d="M 30 62 C 23 63 19 69 20 76 L 38 190 L 46 190 L 34 61 Z" fill="url(#kg-logo-tealBack)" />
          <g class="kg-anim-folder">
            <path d="M 42 54 C 42 49 46 46 51 46 L 73 46 L 80 54 L 97 54 C 102 54 106 58 106 63 L 106 184 C 106 190 102 194 96 194 L 62 194 C 66 172 78 154 96 139 L 42 184 Z" fill="url(#kg-logo-tealMain)" />
            <path d="M 65 194 L 96 194 C 102 194 106 190 106 184 L 106 144 C 86 158 72 175 65 194 Z" fill="#0f2e38" />
          </g>
        </g>

        <!-- Верхні темні петролеві K-стрічки -->
        <g>
          <path d="M 42 180 C 52 130 96 92 150 34 L 170 34 C 120 92 76 128 42 180 Z" fill="url(#kg-logo-tealMain)" />
          <path d="M 42 188 C 58 136 110 98 175 34 L 191 34 C 140 94 102 124 60 146 C 49 157 44 172 42 188 Z" fill="url(#kg-logo-tealMain)" />
        </g>

        <!-- Нижня бурштинова стрілка вгору -->
        <g class="kg-anim-arrow">
          <path d="M 104 142 L 128 122 L 154 148 L 178 124 L 169 115 L 204 106 L 197 142 L 189 134 L 156 168 L 194 194 L 150 194 C 142 194 136 190 130 183 L 104 142 Z" fill="url(#kg-logo-amberMain)" />
          <path d="M 154 148 L 189 134 L 156 168 L 130 144 Z" fill="url(#kg-logo-amberShadow)" opacity="0.45" />
        </g>

        <!-- Нижня дуга -->
        <g class="kg-anim-swoosh-amber">
          <path d="M 42 188 C 48 152 78 128 134 114 C 106 138 70 156 42 188 Z" fill="url(#kg-logo-amberMain)" />
          <path d="M 48 194 C 56 160 84 134 142 112 C 122 130 80 152 56 194 Z" fill="#f8a44c" opacity="0.85" />
        </g>

        <!-- Силует -->
        <g class="kg-anim-person">
          <circle cx="151" cy="113" r="7.5" fill="#133b47" />
          <path d="M 139 131 C 139 124 144 122 151 122 C 158 122 163 124 163 131 L 151 143 Z" fill="#133b47" />
        </g>
      </g>

      <!-- Фірмовий текст KaderGo: темний петроль (#133b47) + теплий бурштин (#f8a44c) -->
      <text x="248" y="152" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="100px" letter-spacing="-0.03em">
        <tspan fill="#133b47">Kader</tspan><tspan fill="#f8a44c">Go</tspan>
      </text>
    </svg>
  `;

  // Animated KaderGo Flow SVG (Spinner -> Success Checkmark -> Outro)

const kadergoFlowSvg = ` 
<svg class="kadergo-flow-svg state-spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="100%" height="100%">
  <defs>
    <style>
      /* GPU renderelési és élsimítási beállítások gyengébb gépekre és alacsonyabb DPI monitorokra */
      svg.kadergo-flow-svg {
        shape-rendering: geometricPrecision;
        text-rendering: optimizeLegibility;
      }
      /* Alapértelmezett transform-box és középpontok */
      .anim-folder, .anim-tab, .anim-doc, .anim-cutout,
      .anim-swoosh-teal, .anim-swoosh-amber, .anim-arrow,
      .anim-person,
      .check-layer, .check-halo, .check-bg, .check-badge,
      .error-layer, .error-shake-wrap, .error-halo, .error-bg, .error-badge,
      .prompt-layer, .prompt-bounce-wrap, .prompt-halo, .prompt-bg, .prompt-badge {
        transform-box: fill-box;
      }

      /* Spinner elemek: precíz view-box koordinátarendszer (110, 110) CPU-reflow nélkül a maximális 60/120fps sebességért */
      .spinner-layer,
      .spinner-rotator-teal,
      .spinner-rotator-amber,
      .spinner-ring-teal,
      .spinner-ring-amber,
      .spinner-core-dot {
        transform-box: view-box;
        transform-origin: 110px 110px;
      }
      .anim-folder { transform-origin: bottom center; }
      .anim-tab { transform-origin: bottom right; }
      .anim-doc { transform-origin: bottom center; }
      .anim-cutout, .anim-swoosh-teal, .anim-swoosh-amber, .anim-arrow { transform-origin: bottom left; }
      .anim-person { transform-origin: center bottom; }

      /* Rejtett rétegek alaphelyzetben */
      .spinner-layer, .check-layer, .error-layer, .prompt-layer {
        transform-origin: center;
        opacity: 0;
        pointer-events: none;
      }
      .spinner-ring-teal, .spinner-ring-amber, .spinner-core-dot,
      .check-halo, .check-bg, .check-badge,
      .error-shake-wrap, .error-halo, .error-bg, .error-badge,
      .prompt-bounce-wrap, .prompt-halo, .prompt-bg, .prompt-badge {
        transform-origin: center;
      }
      .check-halo, .check-bg, .check-badge,
      .error-halo, .error-bg, .error-badge,
      .prompt-halo, .prompt-bg, .prompt-badge {
        transform: scale(0);
      }
      .check-tick { stroke-dasharray: 90; stroke-dashoffset: 90; }
      .error-line-1, .error-line-2 { stroke-dasharray: 60; stroke-dashoffset: 60; }
      
      /* Új kérdőjel rajzolási vonalhossz */
      .prompt-hook { stroke-dasharray: 95; stroke-dashoffset: 95; }
      .prompt-dot { transform-box: fill-box; transform-origin: center; transform: scale(0); }

      /* Folyamatos, megszakításmentes forgás és lüktetés a spinner elemein (különválasztott GPU rotátor és szaggatás) */
      .spinner-rotator-teal {
        animation: spinTeal 1.35s linear 0s infinite;
        will-change: transform;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      .spinner-rotator-amber {
        animation: spinAmber 1.8s linear 0s infinite;
        will-change: transform;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      .spinner-ring-teal {
        animation: dashTeal 1.6s ease-in-out 0s infinite;
      }
      .spinner-ring-amber {
        animation: dashAmberSmooth 1.8s ease-in-out 0s infinite;
      }
      .spinner-core-dot {
        animation: corePulse 1.4s ease-in-out 0s infinite;
      }

      /* =====================================================
         1. FÁZIS: MEGJELENÉS (STATE-INTRO)
         ===================================================== */
      svg.state-intro .logo-base-group { opacity: 1 !important; display: block !important; }
      svg.state-intro .spinner-layer,
      svg.state-intro .prompt-layer,
      svg.state-intro .check-layer,
      svg.state-intro .error-layer {
        opacity: 0 !important;
        pointer-events: none !important;
        display: none !important;
      }
      svg.state-intro .anim-folder { animation: folderRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.0s both; }
      svg.state-intro .anim-tab { animation: tabTilt 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s both; }
      svg.state-intro .anim-doc { animation: docSlideOut 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both; }
      svg.state-intro .anim-line-1 { stroke-dasharray: 24; stroke-dashoffset: 24; animation: drawLine 0.3s ease-out 0.48s forwards; }
      svg.state-intro .anim-line-2 { stroke-dasharray: 35; stroke-dashoffset: 35; animation: drawLine 0.35s ease-out 0.60s forwards; }
      svg.state-intro .anim-cutout { animation: swooshSweep 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.30s both; }
      svg.state-intro .anim-swoosh-teal { animation: swooshSweep 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.32s both; }
      svg.state-intro .anim-swoosh-amber { animation: swooshSweep 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.42s both; }
      svg.state-intro .anim-arrow { animation: arrowShoot 0.5s cubic-bezier(0.34, 1.45, 0.64, 1) 0.52s both; }
      svg.state-intro .anim-person { animation: personPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.68s both; }

      /* =====================================================
         1b. FÁZIS: LOGO -> SPINNER MORPH (STATE-INTRO-MORPH)
         Kizárólag a legelső induláskor, a Kadergo logó átalakulásakor fut le
         ===================================================== */
      svg.state-intro-morph .logo-base-group { opacity: 1 !important; display: block !important; }
      svg.state-intro-morph .prompt-layer,
      svg.state-intro-morph .check-layer,
      svg.state-intro-morph .error-layer {
        opacity: 0 !important;
        pointer-events: none !important;
        display: none !important;
      }
      svg.state-intro-morph .anim-doc { animation: docTuckIntoFolder 0.3s cubic-bezier(0.55, 0, 1, 0.45) 0.0s forwards; }
      svg.state-intro-morph .anim-person { animation: personSwirlIn 0.35s cubic-bezier(0.55, 0, 1, 0.45) 0.05s forwards; }
      svg.state-intro-morph .anim-tab, svg.state-intro-morph .anim-folder { animation: folderMorphToCore 0.45s cubic-bezier(0.6, -0.28, 0.735, 0.045) 0.08s forwards; }
      svg.state-intro-morph .anim-swoosh-teal, svg.state-intro-morph .anim-cutout { animation: swooshCurlToRing 0.48s cubic-bezier(0.55, 0, 1, 0.45) 0.1s forwards; }
      svg.state-intro-morph .anim-swoosh-amber, svg.state-intro-morph .anim-arrow { animation: amberCurlToRing 0.48s cubic-bezier(0.55, 0, 1, 0.45) 0.14s forwards; }
      svg.state-intro-morph .spinner-layer {
        display: block !important;
        animation: spinnerAppear 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.28s forwards;
      }

      /* =====================================================
         2. FÁZIS: FOLYAMATOS SPINNER (STATE-SPINNER)
         Tiszta, megszakításmentes loading állapot logó és újratöltés nélkül
         ===================================================== */
      svg.state-spinner .logo-base-group,
      svg.state-spinner .prompt-layer,
      svg.state-spinner .check-layer,
      svg.state-spinner .error-layer {
        opacity: 0 !important;
        pointer-events: none !important;
        display: none !important;
      }
      svg.state-spinner .spinner-layer {
        opacity: 1 !important;
        pointer-events: auto !important;
        transform: scale(1) !important;
        display: block !important;
      }

      /* =====================================================
         3. FÁZIS: SPINNER -> KÉRDŐJEL (STATE-PROMPT)
         ===================================================== */
      svg.state-prompt .logo-base-group,
      svg.state-prompt .check-layer,
      svg.state-prompt .error-layer {
        opacity: 0 !important;
        pointer-events: none !important;
        display: none !important;
      }
      svg.state-prompt .spinner-layer {
        opacity: 1;
        animation: spinnerCollapseToBadge 0.45s cubic-bezier(0.55, 0, 1, 0.45) 0.0s forwards;
      }
      svg.state-prompt .spinner-ring-teal { stroke-dasharray: 390; stroke-dashoffset: 60; animation: ringSeal 0.42s ease-out 0.0s forwards; }
      svg.state-prompt .spinner-ring-amber { stroke-dasharray: 300; stroke-dashoffset: 180; animation: ringSeal 0.38s ease-out 0.0s forwards; }

      svg.state-prompt .prompt-layer { opacity: 1 !important; display: block !important; }
      svg.state-prompt .prompt-bounce-wrap {
        animation: promptNudge 3.2s ease-in-out 0.5s infinite;
      }
      svg.state-prompt .prompt-halo { animation: haloExpand 0.70s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both; }
      svg.state-prompt .prompt-bg { animation: badgeCirclePop 0.55s cubic-bezier(0.34, 1.45, 0.64, 1) 0.20s forwards; }
      svg.state-prompt .prompt-badge { animation: badgeCirclePop 0.55s cubic-bezier(0.34, 1.45, 0.64, 1) 0.25s forwards; }
      svg.state-prompt .prompt-hook { animation: drawPromptHook 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.42s forwards; }
      svg.state-prompt .prompt-dot { animation: dotPop 0.35s cubic-bezier(0.34, 1.5, 0.64, 1) 0.72s forwards; }

      /* =====================================================
         4. FÁZIS: KÉRDŐJEL -> SPINNER (STATE-PROMPT-TO-SPINNER)
         ===================================================== */
      svg.state-prompt-to-spinner .logo-base-group,
      svg.state-prompt-to-spinner .check-layer,
      svg.state-prompt-to-spinner .error-layer {
        opacity: 0 !important;
        pointer-events: none !important;
        display: none !important;
      }
      svg.state-prompt-to-spinner .prompt-layer {
        opacity: 1;
        animation: promptVanishToSpinner 0.32s cubic-bezier(0.55, 0, 1, 0.45) 0.0s forwards;
      }
      svg.state-prompt-to-spinner .prompt-dot {
        transform: scale(1);
        animation: dotShrink 0.20s cubic-bezier(0.55, 0, 1, 0.45) 0.0s forwards;
      }
      svg.state-prompt-to-spinner .prompt-hook {
        stroke-dasharray: 95; stroke-dashoffset: 0;
        animation: hookRetract 0.24s cubic-bezier(0.55, 0, 1, 0.45) 0.04s forwards;
      }
      svg.state-prompt-to-spinner .spinner-layer {
        opacity: 1;
        animation: spinnerReappear 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.06s forwards;
      }

      /* =====================================================
         5. FÁZISOK: SIKERES PIPA ÉS HIBA X
         ===================================================== */
      svg.state-success .logo-base-group, svg.state-success .prompt-layer { opacity: 0; pointer-events: none; }
      svg.state-success .spinner-layer { opacity: 1; animation: spinnerCollapseToBadge 0.42s cubic-bezier(0.55, 0, 1, 0.45) 0.0s forwards; }
      svg.state-success .spinner-ring-teal { stroke-dasharray: 390; stroke-dashoffset: 60; animation: ringSeal 0.38s ease-out 0.0s forwards; }
      svg.state-success .spinner-ring-amber { stroke-dasharray: 300; stroke-dashoffset: 180; animation: ringSeal 0.35s ease-out 0.0s forwards; }
      svg.state-success .check-layer { opacity: 1; }
      svg.state-success .check-halo { animation: haloExpand 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both; }
      svg.state-success .check-bg { animation: badgeCirclePop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.20s forwards; }
      svg.state-success .check-badge { animation: badgeCirclePop 0.55s cubic-bezier(0.34, 1.65, 0.64, 1) 0.25s forwards; }
      svg.state-success .check-tick { animation: drawCheckTick 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.42s forwards; }

      svg.state-error .logo-base-group, svg.state-error .prompt-layer { opacity: 0; pointer-events: none; }
      svg.state-error .spinner-layer { opacity: 1; animation: spinnerCollapseToBadge 0.38s cubic-bezier(0.55, 0, 1, 0.45) 0.0s forwards; }
      svg.state-error .spinner-ring-teal { stroke-dasharray: 390; stroke-dashoffset: 60; animation: ringSeal 0.35s ease-out 0.0s forwards; }
      svg.state-error .spinner-ring-amber { stroke-dasharray: 300; stroke-dashoffset: 180; animation: ringSeal 0.32s ease-out 0.0s forwards; }
      svg.state-error .error-layer { opacity: 1; }
      svg.state-error .error-shake-wrap { animation: errorShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) 0.24s both; }
      svg.state-error .error-halo { animation: haloExpand 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.20s both; }
      svg.state-error .error-bg { animation: badgeCirclePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.18s forwards; }
      svg.state-error .error-badge { animation: badgeCirclePop 0.5s cubic-bezier(0.34, 1.65, 0.64, 1) 0.22s forwards; }
      svg.state-error .error-line-1 { animation: drawErrorLine 0.28s cubic-bezier(0.22, 1, 0.36, 1) 0.36s forwards; }
      svg.state-error .error-line-2 { animation: drawErrorLine 0.28s cubic-bezier(0.22, 1, 0.36, 1) 0.48s forwards; }

      /* --- KULCSKOCKÁK --- */
      @keyframes folderRise { 0% { opacity: 0; transform: translateY(18px) scaleY(0.82); } 100% { opacity: 1; transform: translateY(0) scaleY(1); } }
      @keyframes tabTilt { 0% { opacity: 0; transform: translateX(8px) rotate(12deg) scaleY(0.8); } 100% { opacity: 1; transform: translateX(0) rotate(0deg) scaleY(1); } }
      @keyframes docSlideOut { 0% { opacity: 0; transform: translateY(28px); } 100% { opacity: 1; transform: translateY(0); } }
      @keyframes drawLine { to { stroke-dashoffset: 0; } }
      @keyframes swooshSweep { 0% { opacity: 0; transform: scale(0.72) translate(-16px, 16px); } 100% { opacity: 1; transform: scale(1) translate(0, 0); } }
      @keyframes arrowShoot { 0% { opacity: 0; transform: translate(-22px, 22px) scale(0.7); } 100% { opacity: 1; transform: translate(0, 0) scale(1); } }
      @keyframes personPop { 0% { opacity: 0; transform: scale(0) translateY(8px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }

      @keyframes docTuckIntoFolder { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(26px) scale(0.85); } }
      @keyframes personSwirlIn { 0% { opacity: 1; transform: scale(1) translate(0, 0); } 100% { opacity: 0; transform: scale(0.2) translate(-40px, -10px); } }
      @keyframes folderMorphToCore { 0% { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); } 100% { opacity: 0; transform: translate(32px, -25px) scale(0.25) rotate(65deg); } }
      @keyframes swooshCurlToRing { 0% { opacity: 1; transform: scale(1) rotate(0deg); } 100% { opacity: 0; transform: translate(25px, -15px) scale(0.45) rotate(95deg); } }
      @keyframes amberCurlToRing { 0% { opacity: 1; transform: scale(1) rotate(0deg); } 100% { opacity: 0; transform: translate(-20px, -25px) scale(0.45) rotate(120deg); } }

      @keyframes spinnerAppear { 0% { opacity: 0; transform: scale(0.55) rotate(-90deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
      @keyframes spinnerReappear {
        0% { opacity: 0; transform: scale(0.85); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes spinTeal { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes spinAmber { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
      @keyframes dashTeal {
        0% {
          stroke-dasharray: 45, 345;
          stroke-dashoffset: 0;
        }
        50% {
          stroke-dasharray: 235, 155;
          stroke-dashoffset: -120;
        }
        100% {
          stroke-dasharray: 45, 345;
          stroke-dashoffset: -390;
        }
      }
      @keyframes dashAmberSmooth {
        0%, 100% {
          stroke-dasharray: 65, 230;
          stroke-dashoffset: 0;
          opacity: 0.75;
        }
        50% {
          stroke-dasharray: 105, 190;
          stroke-dashoffset: 0;
          opacity: 0.95;
        }
      }
      @keyframes corePulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.85; } }

      @keyframes spinnerCollapseToBadge { 0% { opacity: 1; transform: scale(1) rotate(0deg); } 65% { opacity: 1; transform: scale(1.06) rotate(140deg); } 100% { opacity: 0; transform: scale(0.75) rotate(220deg); } }
      @keyframes ringSeal { 0% { stroke-dashoffset: 180; } 100% { stroke-dashoffset: 0; } }
      @keyframes haloExpand { 0% { opacity: 0; transform: scale(0.4); } 50% { opacity: 0.25; } 100% { opacity: 1; transform: scale(1); } }
      @keyframes badgeCirclePop { 0% { transform: scale(0) rotate(-25deg); } 100% { transform: scale(1) rotate(0deg); } }

      @keyframes drawCheckTick { 0% { stroke-dashoffset: 90; } 100% { stroke-dashoffset: 0; } }
      @keyframes drawErrorLine { 0% { stroke-dashoffset: 60; } 100% { stroke-dashoffset: 0; } }
      @keyframes errorShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-9px) rotate(-3deg); }
        40% { transform: translateX(8px) rotate(3deg); }
        60% { transform: translateX(-6px) rotate(-1.5deg); }
        80% { transform: translateX(4px) rotate(1deg); }
      }

      /* Kérdőjel finomhangolt kulcskockák */
      @keyframes drawPromptHook { 0% { stroke-dashoffset: 95; } 100% { stroke-dashoffset: 0; } }
      @keyframes dotPop { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes promptNudge {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        35% { transform: translateY(-3px) rotate(2deg); }
        50% { transform: translateY(0) rotate(0deg); }
        65% { transform: translateY(-1.5px) rotate(-1.5deg); }
      }
      @keyframes promptVanishToSpinner {
        0% { opacity: 1; transform: scale(1) rotate(0deg); }
        100% { opacity: 0; transform: scale(0.75) rotate(90deg); }
      }
      @keyframes dotShrink { 0% { transform: scale(1); } 100% { transform: scale(0); } }
      @keyframes hookRetract { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -95; } }

      @media (prefers-reduced-motion: reduce) {
        svg * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
      }
</style>
    <linearGradient id="tealMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e4e5e" />
      <stop offset="50%" stop-color="#133b47" />
      <stop offset="100%" stop-color="#0f2e38" />
    </linearGradient>
    <linearGradient id="tealBack" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2a5b6c" />
      <stop offset="100%" stop-color="#0f2e38" />
    </linearGradient>
    <linearGradient id="amberMain" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e08e36" />
      <stop offset="50%" stop-color="#f59533" />
      <stop offset="100%" stop-color="#f8a44c" />
    </linearGradient>
    <linearGradient id="amberShadow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59533" />
      <stop offset="100%" stop-color="#d47a22" />
    </linearGradient>
    <linearGradient id="crimsonMain" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c1121f" />
      <stop offset="50%" stop-color="#e63946" />
      <stop offset="100%" stop-color="#ff6b6b" />
    </linearGradient>

    <mask id="docCutout" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="220" height="220">
      <rect x="0" y="0" width="220" height="220" fill="white" />
      <path d="M 42 54 C 42 49 46 46 51 46 L 73 46 L 80 54 L 97 54 C 102 54 106 58 106 63 L 106 184 L 42 184 Z" fill="black" />
    </mask>

    <mask id="folderCutout" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="220" height="220">
      <rect x="0" y="0" width="220" height="220" fill="white" />
      <path class="anim-cutout" d="M 38 194 C 46 136 94 96 148 34 L 194 34 C 142 106 86 138 64 194 Z" fill="black" />
    </mask>
  </defs>

  <!-- 1. RÉTEG: KADERGO ALAP IKON -->
  <g class="logo-base-group">
    <g mask="url(#docCutout)">
      <g class="anim-doc">
        <path d="M 48 34 L 84 34 L 98 48 L 98 62 L 48 62 Z" fill="none" stroke="#133b47" stroke-width="4.5" stroke-linejoin="round" />
        <path d="M 84 34 L 84 48 L 98 48" fill="none" stroke="#133b47" stroke-width="4" stroke-linejoin="round" />
        <line class="anim-line-1" x1="57" y1="44" x2="77" y2="44" stroke="#133b47" stroke-width="3.8" stroke-linecap="round" />
        <line class="anim-line-2" x1="57" y1="52" x2="88" y2="52" stroke="#133b47" stroke-width="3.8" stroke-linecap="round" />
      </g>
    </g>

    <g mask="url(#folderCutout)">
      <path class="anim-tab" d="M 30 62 C 23 63 19 69 20 76 L 38 190 L 46 190 L 34 61 Z" fill="url(#tealBack)" />
      <g class="anim-folder">
        <path d="M 42 54 C 42 49 46 46 51 46 L 73 46 L 80 54 L 97 54 C 102 54 106 58 106 63 L 106 184 C 106 190 102 194 96 194 L 62 194 C 66 172 78 154 96 139 L 42 184 Z" fill="url(#tealMain)" />
        <path d="M 65 194 L 96 194 C 102 194 106 190 106 184 L 106 144 C 86 158 72 175 65 194 Z" fill="#0f2e38" />
      </g>
    </g>

    <g class="anim-swoosh-teal">
      <path d="M 42 180 C 52 130 96 92 150 34 L 170 34 C 120 92 76 128 42 180 Z" fill="url(#tealMain)" />
      <path d="M 42 188 C 58 136 110 98 175 34 L 191 34 C 140 94 102 124 60 146 C 49 157 44 172 42 188 Z" fill="url(#tealMain)" />
    </g>

    <g class="anim-arrow">
      <path d="M 104 142 L 128 122 L 154 148 L 178 124 L 169 115 L 204 106 L 197 142 L 189 134 L 156 168 L 194 194 L 150 194 C 142 194 136 190 130 183 L 104 142 Z" fill="url(#amberMain)" />
      <path d="M 154 148 L 189 134 L 156 168 L 130 144 Z" fill="url(#amberShadow)" opacity="0.45" />
    </g>

    <g class="anim-swoosh-amber">
      <path d="M 42 188 C 48 152 78 128 134 114 C 106 138 70 156 42 188 Z" fill="url(#amberMain)" />
      <path d="M 48 194 C 56 160 84 134 142 112 C 122 130 80 152 56 194 Z" fill="#f8a44c" opacity="0.85" />
    </g>

    <g class="anim-person">
      <circle cx="151" cy="113" r="7.5" fill="#133b47" />
      <path d="M 139 131 C 139 124 144 122 151 122 C 158 122 163 124 163 131 L 151 143 Z" fill="#133b47" />
    </g>
  </g>

  <!-- 2. RÉTEG: LOADING SPINNER -->
  <g class="spinner-layer">
    <circle cx="110" cy="110" r="62" fill="none" stroke="#133b47" stroke-width="11" opacity="0.16" />
    <g class="spinner-rotator-teal">
      <circle class="spinner-ring-teal" cx="110" cy="110" r="62" fill="none" stroke="url(#tealMain)" stroke-width="12" stroke-linecap="round" />
    </g>
    <g class="spinner-rotator-amber">
      <circle class="spinner-ring-amber" cx="110" cy="110" r="47" fill="none" stroke="url(#amberMain)" stroke-width="5.5" stroke-linecap="round" />
    </g>
    <circle class="spinner-core-dot" cx="110" cy="110" r="7" fill="#133b47" />
  </g>

  <!-- 3. RÉTEG: KÖZÉPRE IGAZÍTOTT, PRECIZ KÉRDŐJEL -->
  <g class="prompt-layer">
    <g class="prompt-bounce-wrap">
      <circle class="prompt-halo" cx="110" cy="110" r="74" fill="#f59533" opacity="0.14" />
      <circle class="prompt-bg" cx="110" cy="110" r="62" fill="url(#amberMain)" />
      <circle class="prompt-badge" cx="110" cy="110" r="56" fill="url(#tealMain)" />
      <!-- Precíz kampó: szélesség 36px (92 -> 128), tengely X = 110 -->
      <path class="prompt-hook" d="M 92 92 C 92 81 100 75 110 75 C 120 75 128 81 128 91 C 128 100 120 106 110 111 L 110 119" fill="none" stroke="#ffffff" stroke-width="10.5" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Pont pontosan X = 110, Y = 135 -->
      <circle class="prompt-dot" cx="110" cy="135" r="5.8" fill="#ffffff" />
    </g>
  </g>

  <!-- 4. RÉTEG: SIKERES PIPA -->
  <g class="check-layer">
    <circle class="check-halo" cx="110" cy="110" r="74" fill="#133b47" opacity="0.10" />
    <circle class="check-bg" cx="110" cy="110" r="62" fill="url(#amberMain)" />
    <circle class="check-badge" cx="110" cy="110" r="56" fill="url(#tealMain)" />
    <path class="check-tick" d="M 86 112 L 103 129 L 136 93" fill="none" stroke="#ffffff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <!-- 5. RÉTEG: HIBA X -->
  <g class="error-layer">
    <g class="error-shake-wrap">
      <circle class="error-halo" cx="110" cy="110" r="74" fill="#e63946" opacity="0.14" />
      <circle class="error-bg" cx="110" cy="110" r="62" fill="url(#crimsonMain)" />
      <circle class="error-badge" cx="110" cy="110" r="55" fill="url(#tealMain)" />
      <line class="error-line-1" x1="90" y1="90" x2="130" y2="130" stroke="#ffffff" stroke-width="11" stroke-linecap="round" />
      <line class="error-line-2" x1="130" y1="90" x2="90" y2="130" stroke="#ffffff" stroke-width="11" stroke-linecap="round" />
    </g>
  </g>
</svg>
  `;

  // Heroicons (Outline 24x24, stroke 2.2 / 2.5)

const icons = {
    calendar: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    `,
    layers: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
    `,
    fileSpreadsheet: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="8" y1="13" x2="16" y2="13"></line>
        <line x1="8" y1="17" x2="16" y2="17"></line>
      </svg>
    `,
    documentText: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    `,
    download: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    `,
    checkBadge: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
      </svg>
    `,
    check: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `,
    chartBar: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 20h18M6 20v-5M10 20v-9M14 20v-13M18 20V9"></path>
      </svg>
    `,
    sparkles: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"></path>
      </svg>
    `,
    archive: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="21 8 21 21 3 21 3 8"></polyline>
        <rect x="1" y="3" width="22" height="5"></rect>
        <line x1="10" y1="12" x2="14" y2="12"></line>
      </svg>
    `,
    minimize: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    `,
    expand: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
      </svg>
    `,
    close: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `,
    bookOpen: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
      </svg>
    `,
    magnifyingGlass: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"></path>
      </svg>
    `,
    search: `
      <svg viewBox="0 0 24 24" class="kadergo-heroicon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"></path>
      </svg>
    `
  };

  /**
   * Opens the unified KaderGo export modal with 3 selectable options:
   * 1. Обраний РРО (single RRO turnover export) - disabled if date or FN is missing
   * 2. Всі РРО (all RROs batch turnover export) - disabled if date is missing
   * 3. Книга доходів (income book ledger for selected year)
   *
   * Returns Promise<{ proceed: boolean, mode: 'single' | 'all' | 'income_book', format: string, year?: number }>
   */

  window.KaderGo.ModalAssets = {
    animatedKaderGoLogoSvg,
    kadergoFlowSvg,
    icons
  };
})();
