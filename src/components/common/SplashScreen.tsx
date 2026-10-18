import React, { useState, useEffect } from "react";
import { SPLASH_SVG_TEMPLATE } from "./splashSvgTemplate";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [animState, setAnimState] = useState<"state-intro" | "state-loading" | "state-outro">("state-intro");
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timers: number[] = [];

    // 1. Intro runs from 0ms to 1750ms
    // 2. Loading runs from 1750ms to 3250ms
    timers.push(
      window.setTimeout(() => {
        setAnimState("state-loading");
      }, 1750)
    );

    // 3. Outro runs from 3250ms to 3850ms
    timers.push(
      window.setTimeout(() => {
        setAnimState("state-outro");
      }, 3250)
    );

    // 4. Fade out overlay
    timers.push(
      window.setTimeout(() => {
        setIsFading(true);
      }, 3850)
    );

    // 5. Complete and unmount
    timers.push(
      window.setTimeout(() => {
        onComplete();
      }, 4350)
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        onComplete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onComplete]);

  const svgHtml = SPLASH_SVG_TEMPLATE.replace("__STATE_CLASS__", animState);

  return (
    <div
      onClick={onComplete}
      className={`fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#f8faf9] select-none cursor-pointer transition-opacity duration-500 ease-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-[#133b47]/5 via-transparent to-transparent pointer-events-none" />

      {/* Main Animated Logo */}
      <div className="relative z-10 w-full max-w-xl px-8 flex flex-col items-center">
        <div
          className="w-full flex justify-center drop-shadow-xl"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />

        {/* Loading status bar */}
        <div className="mt-8 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#133b47] animate-ping" />
          <span className="text-xs font-bold text-[#556e75] tracking-wide">
            {animState === "state-intro" && "Запуск системи..."}
            {animState === "state-loading" && "Завантаження бази даних..."}
            {animState === "state-outro" && "Готово!"}
          </span>
        </div>
      </div>

      {/* Skip button prompt */}
      <div className="absolute bottom-6 right-8 text-[11px] font-bold text-[#8fa8aa] hover:text-[#133b47] transition-colors">
        Натисніть <kbd className="px-1.5 py-0.5 rounded bg-[#e2eceb] text-[#133b47] font-mono font-bold">Esc</kbd> для пропуску
      </div>
    </div>
  );
};
