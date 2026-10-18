import React, { useEffect, useRef } from "react";
import { FAST_ICON_TRANSITION_SVG_TEMPLATE } from "./transitionSvgTemplate";

interface ViewTransitionProps {
  onMidSwitch: () => void;
  onComplete: () => void;
}

export const ViewTransition: React.FC<ViewTransitionProps> = React.memo(({ onMidSwitch, onComplete }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMidSwitchRef = useRef(onMidSwitch);
  const onCompleteRef = useRef(onComplete);
  onMidSwitchRef.current = onMidSwitch;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // 1. Az SVG-t pontosan EGYSZER injektáljuk a DOM-ba közvetlenül,
    // így a React re-renderek nem tudják újraindítani vagy megakasztani a CSS kulcskockákat
    if (containerRef.current) {
      containerRef.current.innerHTML = FAST_ICON_TRANSITION_SVG_TEMPLATE;
    }

    const timers: number[] = [];

    // 2. Félidő (180ms): A logó az Intro csúcsán van -> háttérben nézetváltás
    timers.push(
      window.setTimeout(() => {
        onMidSwitchRef.current();
      }, 180)
    );

    // 3. Kivezetés (340ms): A logó Outro lecsengett -> közvetlen DOM stílussal gyorsan halványítjuk a hátteret
    timers.push(
      window.setTimeout(() => {
        if (overlayRef.current) {
          overlayRef.current.style.opacity = "0";
          overlayRef.current.style.pointerEvents = "none";
        }
      }, 340)
    );

    // 4. Befejezés (440ms): Átvezető levétele a komponensfáról
    timers.push(
      window.setTimeout(() => {
        onCompleteRef.current();
      }, 440)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []); // Szigorúan egyszer fut le montírozáskor!

  return (
    <div
      ref={overlayRef}
      style={{ opacity: 1, transition: "opacity 0.10s ease-out" }}
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#f3f6f5]/85 backdrop-blur-2xl select-none pointer-events-auto"
    >
      {/* Finom sugárirányú háttérfény */}
      <div className="absolute inset-0 bg-radial from-[#133b47]/8 via-transparent to-transparent pointer-events-none" />

      {/* Közvetlen DOM tartó konténer, amit a React nem renderel újra */}
      <div
        ref={containerRef}
        className="relative z-10 w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center drop-shadow-2xl"
      />
    </div>
  );
});
