import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface CustomMonthYearPickerProps {
  value: string; // MM.YYYY (pl. "01.2027")
  onChange: (newVal: string) => void;
}

const MONTHS = [
  "Січ", "Лют", "Бер", "Кві", "Тра", "Чер",
  "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"
];

export const CustomMonthYearPicker: React.FC<CustomMonthYearPickerProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const parseVal = () => {
    if (value && value.includes(".")) {
      const parts = value.split(".");
      const m = (parseInt(parts[0], 10) || 1) - 1;
      const y = parseInt(parts[1], 10) || new Date().getFullYear();
      return { month: m, year: y };
    }
    const today = new Date();
    return { month: today.getMonth(), year: today.getFullYear() };
  };

  const { month: selectedMonth, year: selectedYear } = parseVal();
  const [pickerYear, setPickerYear] = useState<number>(selectedYear);

  useEffect(() => {
    setPickerYear(selectedYear);
  }, [selectedYear]);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 240;
      const dropdownHeight = 220;

      let left = rect.left;
      if (left + dropdownWidth > window.innerWidth - 16) {
        left = window.innerWidth - dropdownWidth - 16;
      }

      let top = rect.bottom + 6;
      if (rect.bottom + dropdownHeight > window.innerHeight - 16 && rect.top - dropdownHeight > 16) {
        top = rect.top - dropdownHeight - 6;
      }

      setCoords({
        top: Math.max(16, top),
        left: Math.max(16, left),
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) updatePosition();
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleScrollOrResize() {
      if (isOpen) updatePosition();
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const handleSelectMonth = (mIdx: number) => {
    const mmStr = String(mIdx + 1).padStart(2, "0");
    onChange(`${mmStr}.${pickerYear}`);
    setIsOpen(false);
  };

  return (
    <>
      {/* Main Input Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`w-full py-2.5 px-3.5 rounded-2xl border-2 transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer select-none ${
          isOpen
            ? "bg-[#133b47] text-[#f8a44c] border-[#133b47] shadow-md"
            : "bg-white hover:bg-[#f4f9f8] text-[#133b47] border-[#cbd8d6] hover:border-[#133b47]"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarDaysIcon className={`w-4 h-4 shrink-0 ${isOpen ? "text-[#f8a44c]" : "text-[#133b47]"}`} />
          <span className="truncate text-sm font-bold font-mono tracking-tight">
            {value || "01.2026"}
          </span>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 shrink-0 transition-transform duration-200 stroke-[2.5] ${
            isOpen ? "rotate-180 text-[#f8a44c]" : "text-[#133b47]"
          }`}
        />
      </button>

      {/* Clean Portal Dropdown */}
      {isOpen && coords && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
          className="z-[999999] bg-white rounded-2xl border-2 border-[#133b47] shadow-xl p-3 w-60 select-none animate-modalScale"
        >
          {/* Header - Year Only */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#cbd8d6]">
            <button
              type="button"
              onClick={() => setPickerYear((y) => y - 1)}
              className="p-1 rounded-lg text-[#133b47] hover:bg-[#f4f9f8] transition-colors cursor-pointer"
            >
              <ChevronLeftIcon className="w-4 h-4 stroke-[2.5]" />
            </button>

            <span className="text-sm font-black font-mono text-[#133b47] tracking-wider">
              {pickerYear}
            </span>

            <button
              type="button"
              onClick={() => setPickerYear((y) => y + 1)}
              className="p-1 rounded-lg text-[#133b47] hover:bg-[#f4f9f8] transition-colors cursor-pointer"
            >
              <ChevronRightIcon className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Minimal 3x4 Month Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((mName, mIdx) => {
              const isSelected = mIdx === selectedMonth && pickerYear === selectedYear;

              return (
                <button
                  key={mIdx}
                  type="button"
                  onClick={() => handleSelectMonth(mIdx)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    isSelected
                      ? "bg-[#133b47] text-[#f8a44c] font-black shadow-xs scale-[1.02]"
                      : "text-[#133b47] hover:bg-[#f4f9f8]"
                  }`}
                >
                  {mName}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};