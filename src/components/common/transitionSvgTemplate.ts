export const FAST_ICON_TRANSITION_SVG_TEMPLATE = `<svg class="kadergo-svg-transition" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="100%" height="100%">
  <defs>
    <style>
      /* GPU transform beállítások */
      .anim-folder, .anim-tab, .anim-doc, .anim-cutout,
      .anim-swoosh-teal, .anim-swoosh-amber, .anim-arrow,
      .anim-person {
        transform-box: fill-box;
        will-change: transform, opacity;
      }
      .anim-folder { transform-origin: bottom center; }
      .anim-tab { transform-origin: bottom right; }
      .anim-doc { transform-origin: bottom center; }
      .anim-cutout, .anim-swoosh-teal, .anim-swoosh-amber, .anim-arrow { transform-origin: bottom left; }
      .anim-person { transform-origin: center bottom; }

      /* =========================================================
         FOLYAMATOS, ULTRA-GYORS GPU ANIMÁCIÓ (0.42s)
         Intro (0-35%) -> Tetőpont (35-52%) -> Outro (52-85%) -> Kész (100%)
         ========================================================= */
      .anim-folder {
        animation: folderFlow 0.42s cubic-bezier(0.2, 0.9, 0.3, 1) both;
      }
      .anim-tab {
        animation: tabFlow 0.42s cubic-bezier(0.2, 0.9, 0.3, 1) both;
      }
      .anim-doc {
        animation: docFlow 0.42s cubic-bezier(0.2, 0.9, 0.3, 1) both;
      }
      .anim-line-1 {
        stroke-dasharray: 24;
        animation: line1Flow 0.42s ease-out both;
      }
      .anim-line-2 {
        stroke-dasharray: 35;
        animation: line2Flow 0.42s ease-out both;
      }
      .anim-cutout, .anim-swoosh-teal {
        animation: swooshTealFlow 0.42s cubic-bezier(0.2, 0.9, 0.3, 1) both;
      }
      .anim-swoosh-amber {
        animation: swooshAmberFlow 0.42s cubic-bezier(0.2, 0.9, 0.3, 1) both;
      }
      .anim-arrow {
        animation: arrowFlow 0.42s cubic-bezier(0.25, 1, 0.4, 1) both;
      }
      .anim-person {
        animation: personFlow 0.42s cubic-bezier(0.25, 1, 0.4, 1) both;
      }

      /* 1. Mappa törzs: felemelkedik, kitart, majd összezárul */
      @keyframes folderFlow {
        0% { opacity: 0; transform: translateY(18px) scaleY(0.82); }
        26% { opacity: 1; transform: translateY(0) scaleY(1); }
        54% { opacity: 1; transform: translateY(0) scaleY(1); }
        82%, 100% { opacity: 0; transform: translateY(18px) scaleY(0.78); }
      }

      /* 2. Mappafül */
      @keyframes tabFlow {
        0% { opacity: 0; transform: translateX(8px) rotate(12deg) scaleY(0.8); }
        26% { opacity: 1; transform: translateX(0) rotate(0deg) scaleY(1); }
        54% { opacity: 1; transform: translateX(0) rotate(0deg) scaleY(1); }
        80%, 100% { opacity: 0; transform: translateX(8px) rotate(10deg) scaleY(0.75); }
      }

      /* 3. Dokumentum lap: kicsúszik, kitart, visszahúzódik */
      @keyframes docFlow {
        0% { opacity: 0; transform: translateY(26px); }
        28% { opacity: 1; transform: translateY(0); }
        52% { opacity: 1; transform: translateY(0); }
        78%, 100% { opacity: 0; transform: translateY(26px); }
      }

      /* 4. Lap vonalai */
      @keyframes line1Flow {
        0%, 10% { stroke-dashoffset: 24; opacity: 0; }
        26% { stroke-dashoffset: 0; opacity: 1; }
        52% { stroke-dashoffset: 0; opacity: 1; }
        74%, 100% { stroke-dashoffset: 24; opacity: 0; }
      }
      @keyframes line2Flow {
        0%, 14% { stroke-dashoffset: 35; opacity: 0; }
        30% { stroke-dashoffset: 0; opacity: 1; }
        52% { stroke-dashoffset: 0; opacity: 1; }
        74%, 100% { stroke-dashoffset: 35; opacity: 0; }
      }

      /* 5. K-szalagok (Teal) */
      @keyframes swooshTealFlow {
        0% { opacity: 0; transform: scale(0.74) translate(-14px, 14px); }
        28% { opacity: 1; transform: scale(1) translate(0, 0); }
        54% { opacity: 1; transform: scale(1) translate(0, 0); }
        80%, 100% { opacity: 0; transform: scale(0.72) translate(-16px, 16px); }
      }

      /* 6. Borostyánsárga ív */
      @keyframes swooshAmberFlow {
        0% { opacity: 0; transform: scale(0.74) translate(-14px, 14px); }
        30% { opacity: 1; transform: scale(1) translate(0, 0); }
        54% { opacity: 1; transform: scale(1) translate(0, 0); }
        78%, 100% { opacity: 0; transform: scale(0.72) translate(-16px, 16px); }
      }

      /* 7. Kilövő növekedési nyíl: berobban, megáll a csúcson, majd elrepül */
      @keyframes arrowFlow {
        0% { opacity: 0; transform: translate(-20px, 20px) scale(0.72); }
        30% { opacity: 1; transform: translate(0, 0) scale(1); }
        52% { opacity: 1; transform: translate(0, 0) scale(1); }
        78%, 100% { opacity: 0; transform: translate(24px, -24px) scale(0.82); }
      }

      /* 8. Személy sziluett */
      @keyframes personFlow {
        0% { opacity: 0; transform: scale(0) translateY(8px); }
        28% { opacity: 1; transform: scale(1) translateY(0); }
        52% { opacity: 1; transform: scale(1) translateY(0); }
        74%, 100% { opacity: 0; transform: scale(0) translateY(8px); }
      }

      @media (prefers-reduced-motion: reduce) {
        svg * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
      }
    </style>

    <linearGradient id="tealMainIcon_flow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e4e5e" />
      <stop offset="50%" stop-color="#133b47" />
      <stop offset="100%" stop-color="#0f2e38" />
    </linearGradient>
    <linearGradient id="tealBackIcon_flow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2a5b6c" />
      <stop offset="100%" stop-color="#0f2e38" />
    </linearGradient>
    <linearGradient id="amberMainIcon_flow" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e08e36" />
      <stop offset="50%" stop-color="#f59533" />
      <stop offset="100%" stop-color="#f8a44c" />
    </linearGradient>
    <linearGradient id="amberShadowIcon_flow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59533" />
      <stop offset="100%" stop-color="#d47a22" />
    </linearGradient>

    <mask id="docCutoutIcon_flow" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="220" height="220">
      <rect x="0" y="0" width="220" height="220" fill="white" />
      <path d="M 42 54 C 42 49 46 46 51 46 L 73 46 L 80 54 L 97 54 C 102 54 106 58 106 63 L 106 184 L 42 184 Z" fill="black" />
    </mask>

    <mask id="folderCutoutIcon_flow" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="220" height="220">
      <rect x="0" y="0" width="220" height="220" fill="white" />
      <path class="anim-cutout" d="M 38 194 C 46 136 94 96 148 34 L 194 34 C 142 106 86 138 64 194 Z" fill="black" />
    </mask>
  </defs>

  <!-- Dokumentum a mappában -->
  <g mask="url(#docCutoutIcon_flow)">
    <g class="anim-doc">
      <path d="M 48 34 L 84 34 L 98 48 L 98 62 L 48 62 Z" fill="none" stroke="#133b47" stroke-width="4.5" stroke-linejoin="round" />
      <path d="M 84 34 L 84 48 L 98 48" fill="none" stroke="#133b47" stroke-width="4" stroke-linejoin="round" />
      <line class="anim-line-1" x1="57" y1="44" x2="77" y2="44" stroke="#133b47" stroke-width="3.8" stroke-linecap="round" />
      <line class="anim-line-2" x1="57" y1="52" x2="88" y2="52" stroke="#133b47" stroke-width="3.8" stroke-linecap="round" />
    </g>
  </g>

  <!-- Mappa elemek -->
  <g mask="url(#folderCutoutIcon_flow)">
    <path class="anim-tab" d="M 30 62 C 23 63 19 69 20 76 L 38 190 L 46 190 L 34 61 Z" fill="url(#tealBackIcon_flow)" />
    <g class="anim-folder">
      <path d="M 42 54 C 42 49 46 46 51 46 L 73 46 L 80 54 L 97 54 C 102 54 106 58 106 63 L 106 184 C 106 190 102 194 96 194 L 62 194 C 66 172 78 154 96 139 L 42 184 Z" fill="url(#tealMainIcon_flow)" />
      <path d="M 65 194 L 96 194 C 102 194 106 190 106 184 L 106 144 C 86 158 72 175 65 194 Z" fill="#0f2e38" />
    </g>
  </g>

  <!-- Felső sötét pávakék (Teal) K-szalagok -->
  <g class="anim-swoosh-teal">
    <path d="M 42 180 C 52 130 96 92 150 34 L 170 34 C 120 92 76 128 42 180 Z" fill="url(#tealMainIcon_flow)" />
    <path d="M 42 188 C 58 136 110 98 175 34 L 191 34 C 140 94 102 124 60 146 C 49 157 44 172 42 188 Z" fill="url(#tealMainIcon_flow)" />
  </g>

  <!-- Jobb alsó K-szár és felfelé mutató nyíl (Amber) -->
  <g class="anim-arrow">
    <path d="M 104 142 L 128 122 L 154 148 L 178 124 L 169 115 L 204 106 L 197 142 L 189 134 L 156 168 L 194 194 L 150 194 C 142 194 136 190 130 183 L 104 142 Z" fill="url(#amberMainIcon_flow)" />
    <path d="M 154 148 L 189 134 L 156 168 L 130 144 Z" fill="url(#amberShadowIcon_flow)" opacity="0.45" />
  </g>

  <!-- Alsó borostyánsárga (Amber) ív -->
  <g class="anim-swoosh-amber">
    <path d="M 42 188 C 48 152 78 128 134 114 C 106 138 70 156 42 188 Z" fill="url(#amberMainIcon_flow)" />
    <path d="M 48 194 C 56 160 84 134 142 112 C 122 130 80 152 56 194 Z" fill="#f8a44c" opacity="0.85" />
  </g>

  <!-- HR / Személy sziluett -->
  <g class="anim-person">
    <circle cx="151" cy="113" r="7.5" fill="#133b47" />
    <path d="M 139 131 C 139 124 144 122 151 122 C 158 122 163 124 163 131 L 151 143 Z" fill="#133b47" />
  </g>
</svg>`;
