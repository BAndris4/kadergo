import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

interface CustomDatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
}

const MONTH_NAMES_UK = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];

const WEEKDAY_NAMES_UK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

const AVAILABLE_YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i); // 2020..2030

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value YYYY-MM-DD
  const parsedDate = useMemo(() => {
    if (!value || !value.includes("-")) {
      const today = new Date();
      return {
        year: today.getFullYear(),
        month: today.getMonth(), // 0-11
        day: today.getDate(),
      };
    }
    const parts = value.split("-").map((p) => parseInt(p, 10));
    return {
      year: parts[0] || new Date().getFullYear(),
      month: (parts[1] || 1) - 1, // 0-11
      day: parts[2] || 1,
    };
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(parsedDate.year);
  const [viewMonth, setViewMonth] = useState<number>(parsedDate.month);

  useEffect(() => {
    setViewYear(parsedDate.year);
    setViewMonth(parsedDate.month);
  }, [parsedDate.year, parsedDate.month]);

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsMonthDropdownOpen(false);
        setIsYearDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format date display text
  const displayFormatted = useMemo(() => {
    if (!value) return "Оберіть дату";
    const monthName = MONTH_NAMES_UK[parsedDate.month]?.toLowerCase() || "";
    return `${parsedDate.day} ${monthName} ${parsedDate.year}`;
  }, [value, parsedDate]);

  // Calendar Days calculation for viewYear & viewMonth
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    // Day of week for 1st of month (0 = Sun, 1 = Mon ... adjust to 0 = Mon)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    const days: Array<{ day: number; currentMonth: boolean; dateStr: string }> = [];

    // Prev month padding
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        currentMonth: false,
        dateStr: "",
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(viewMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({
        day: d,
        currentMonth: true,
        dateStr: `${viewYear}-${mStr}-${dStr}`,
      });
    }

    // Next month padding to fill grid 35 or 42
    const totalSoFar = days.length;
    const remaining = (7 - (totalSoFar % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        currentMonth: false,
        dateStr: "",
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dateStr: string) => {
    if (!dateStr) return;
    onChange(dateStr);
    setIsOpen(false);
    setIsMonthDropdownOpen(false);
    setIsYearDropdownOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
    setIsMonthDropdownOpen(false);
    setIsYearDropdownOpen(false);
  };

  return (
    <div className="relative flex flex-col gap-1 w-full" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-[#556e75] flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-[#133b47] stroke-[2]" />
          <span>{label}</span>
        </label>
      )}

      {/* Main Toggle Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setIsMonthDropdownOpen(false);
          setIsYearDropdownOpen(false);
        }}
        className="w-full h-11 px-3.5 rounded-2xl bg-white border-2 border-[#cbd8d6] hover:border-[#133b47] text-[#133b47] text-xs font-bold transition-all duration-200 flex items-center justify-between shadow-xs cursor-pointer"
      >
        <span className="truncate">{displayFormatted}</span>
        <ChevronDownIcon
          className={`w-4 h-4 text-[#133b47] shrink-0 transition-transform duration-200 stroke-[2.5] ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Custom Calendar Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-[24px] border-2 border-[#cbd8d6] shadow-2xl overflow-visible z-[9999] animate-modalScale p-4 flex flex-col gap-3 min-w-[280px] w-full sm:w-[300px]">
          {/* HEADER NAV WITH CUSTOM MONTH & YEAR DROPDOWN BUTTONS */}
          <div className="flex items-center justify-between border-b border-[#e2eceb] pb-2.5 relative">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl bg-[#f8faf9] hover:bg-[#e6f4f1] border border-[#cbd8d6] text-[#133b47] transition-all cursor-pointer shadow-xs"
              title="Попередній місяць"
            >
              <ChevronLeftIcon className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* MONTH & YEAR DROPDOWN TRIGGER BUTTONS */}
            <div className="flex items-center gap-2 relative">
              {/* Month Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsMonthDropdownOpen((prev) => !prev);
                    setIsYearDropdownOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>{MONTH_NAMES_UK[viewMonth]}</span>
                  <ChevronDownIcon className={`w-3.5 h-3.5 text-[#f8a44c] stroke-[2.5] transition-transform ${isMonthDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* MONTH DROPDOWN MENU */}
                {isMonthDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border-2 border-[#cbd8d6] shadow-2xl overflow-hidden z-[10000] p-1.5 grid grid-cols-2 gap-1 w-48 animate-modalScale">
                    {MONTH_NAMES_UK.map((mName, mIdx) => (
                      <button
                        key={mIdx}
                        type="button"
                        onClick={() => {
                          setViewMonth(mIdx);
                          setIsMonthDropdownOpen(false);
                        }}
                        className={`p-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          viewMonth === mIdx
                            ? "bg-[#133b47] text-[#f8a44c]"
                            : "hover:bg-[#f4f9f8] text-[#133b47]"
                        }`}
                      >
                        <span className="truncate">{mName}</span>
                        {viewMonth === mIdx && <CheckIcon className="w-3.5 h-3.5 text-[#f8a44c] stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Year Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsYearDropdownOpen((prev) => !prev);
                    setIsMonthDropdownOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>{viewYear}</span>
                  <ChevronDownIcon className={`w-3.5 h-3.5 text-[#f8a44c] stroke-[2.5] transition-transform ${isYearDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* YEAR DROPDOWN MENU */}
                {isYearDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1.5 bg-white rounded-2xl border-2 border-[#cbd8d6] shadow-2xl overflow-hidden z-[10000] p-1.5 max-h-48 overflow-y-auto flex flex-col gap-1 w-28 custom-scrollbar animate-modalScale">
                    {AVAILABLE_YEARS.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          setViewYear(y);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`p-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          viewYear === y
                            ? "bg-[#133b47] text-[#f8a44c]"
                            : "hover:bg-[#f4f9f8] text-[#133b47]"
                        }`}
                      >
                        <span>{y}</span>
                        {viewYear === y && <CheckIcon className="w-3.5 h-3.5 text-[#f8a44c] stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl bg-[#f8faf9] hover:bg-[#e6f4f1] border border-[#cbd8d6] text-[#133b47] transition-all cursor-pointer shadow-xs"
              title="Наступний місяць"
            >
              <ChevronRightIcon className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* WEEKDAY LABELS */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[#556e75]">
            {WEEKDAY_NAMES_UK.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          {/* DAYS GRID */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((item, idx) => {
              if (!item.currentMonth) {
                return (
                  <div key={idx} className="h-8 flex items-center justify-center text-slate-300 text-xs font-medium">
                    {item.day}
                  </div>
                );
              }

              const isSelected = item.dateStr === value;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(item.dateStr)}
                  className={`h-8 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? "bg-[#133b47] text-[#f8a44c] shadow-xs scale-105"
                      : "hover:bg-[#e6f4f1] text-[#133b47]"
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* TODAY BUTTON */}
          <button
            type="button"
            onClick={handleSelectToday}
            className="w-full py-1.5 rounded-xl bg-[#f8faf9] hover:bg-[#e6f4f1] border border-[#cbd8d6] text-[#133b47] font-bold text-[11px] transition-all cursor-pointer"
          >
            Сьогодні
          </button>
        </div>
      )}
    </div>
  );
};
