import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface CustomPeriodRangePickerProps {
  value: string; // pl. "02.01.2026-01.01.2027"
  onChange: (newVal: string) => void;
}

const MONTH_NAMES = [
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

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

// --- Dátum Segédfunkciók ---
function parseDDMMYYYY(valStr: string): Date | null {
  if (!valStr || !valStr.includes(".")) return null;
  const parts = valStr.trim().split(".");
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

function formatDDMMYYYY(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function parsePeriod(valStr: string): { start: Date; end: Date } {
  if (valStr && valStr.includes("-")) {
    const parts = valStr.split("-");
    const s = parseDDMMYYYY(parts[0]);
    const e = parseDDMMYYYY(parts[1]);
    if (s && e) return { start: s, end: e };
  }
  const today = new Date();
  return { start: today, end: today };
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isBetween(d: Date, start: Date, end: Date): boolean {
  const time = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  const min = Math.min(startTime, endTime);
  const max = Math.max(startTime, endTime);
  return time > min && time < max;
}

function getOneYearMinusOneDay(s: Date): Date {
  return new Date(s.getFullYear() + 1, s.getMonth(), s.getDate() - 1);
}

function getMonthDaysGrid(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month, 1);
  let dayOfWeek = firstDayOfMonth.getDay() - 1; // 0: Mon, 6: Sun
  if (dayOfWeek < 0) dayOfWeek = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const grid: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  for (let i = dayOfWeek - 1; i >= 0; i--) {
    grid.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  const totalCells = grid.length <= 35 ? 35 : 42;
  const paddingNeeded = totalCells - grid.length;
  for (let d = 1; d <= paddingNeeded; d++) {
    grid.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    });
  }

  return grid;
}

export const CustomPeriodRangePicker: React.FC<CustomPeriodRangePickerProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  // Periódus állapotok
  const initialParsed = parsePeriod(value);
  const [startDate, setStartDate] = useState<Date>(initialParsed.start);
  const [endDate, setEndDate] = useState<Date>(initialParsed.end);

  // ALAPÉRTELMEZETT 1 ÉVES KAPCSOLÓ (Default: true)
  const [isAutoYear, setIsAutoYear] = useState<boolean>(true);

  // Aktív fül ('start' | 'end')
  const [activeInput, setActiveInput] = useState<"start" | "end">("start");

  // Naptár nézet
  const [viewDate, setViewDate] = useState<Date>(
    new Date(initialParsed.start.getFullYear(), initialParsed.start.getMonth(), 1)
  );

  useEffect(() => {
    const p = parsePeriod(value);
    setStartDate(p.start);
    setEndDate(p.end);
    setViewDate(new Date(p.start.getFullYear(), p.start.getMonth(), 1));
  }, [value]);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 350;
      const dropdownHeight = 440;

      let left = rect.left;
      if (left + dropdownWidth > window.innerWidth - 16) {
        left = window.innerWidth - dropdownWidth - 16;
      }

      let top = rect.bottom + 6;
      if (
        rect.bottom + dropdownHeight > window.innerHeight - 16 &&
        rect.top - dropdownHeight > 16
      ) {
        top = rect.top - dropdownHeight - 6;
      }

      setCoords({
        top: Math.max(16, top),
        left: Math.max(16, left),
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
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
      if (isOpen) {
        updatePosition();
      }
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

  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Dátum kiválasztás naptárból
  const handleSelectDate = (date: Date) => {
    if (activeInput === "start") {
      setStartDate(date);
      if (isAutoYear) {
        setEndDate(getOneYearMinusOneDay(date));
      } else if (date > endDate) {
        setEndDate(date);
        setActiveInput("end");
      } else {
        setActiveInput("end");
      }
    } else {
      if (date < startDate) {
        setStartDate(date);
        if (isAutoYear) {
          setEndDate(getOneYearMinusOneDay(date));
        }
      } else {
        setEndDate(date);
        const autoEnd = getOneYearMinusOneDay(startDate);
        if (!isSameDay(date, autoEnd)) {
          setIsAutoYear(false);
        }
      }
    }
  };

  // Kis ikon gomb kapcsolása
  const handleToggleAutoYear = () => {
    const nextState = !isAutoYear;
    setIsAutoYear(nextState);
    if (nextState) {
      setEndDate(getOneYearMinusOneDay(startDate));
    }
  };

  const handleSave = () => {
    const startFormatted = formatDDMMYYYY(startDate);
    const endFormatted = formatDDMMYYYY(endDate);
    onChange(`${startFormatted}-${endFormatted}`);
    setIsOpen(false);
  };

  const gridDays = getMonthDaysGrid(viewDate.getFullYear(), viewDate.getMonth());

  return (
    <>
      {/* Trigger Gomb */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`w-full py-2.5 px-3.5 rounded-2xl border-2 transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer shadow-xs ${
          isOpen
            ? "bg-[#133b47] text-[#f8a44c] border-[#133b47] shadow-md ring-2 ring-[#f8a44c]/30"
            : "bg-white hover:bg-[#f4f9f8] text-[#133b47] border-[#cbd8d6] hover:border-[#133b47]"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <ClockIcon
            className={`w-4.5 h-4.5 shrink-0 stroke-[2.2] ${
              isOpen ? "text-[#f8a44c]" : "text-[#133b47]"
            }`}
          />
          <span className="truncate text-xs font-extrabold font-mono tracking-tight text-inherit">
            {value || "01.01.2026-31.12.2026"}
          </span>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 shrink-0 transition-transform duration-200 stroke-[2.5] ${
            isOpen ? "rotate-180 text-[#f8a44c]" : "text-[#133b47]"
          }`}
        />
      </button>

      {/* PORTAL DROPDOWN */}
      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className="z-[999999] bg-white rounded-[24px] border-2 border-[#133b47] shadow-2xl p-5 flex flex-col gap-3.5 w-[350px] max-h-[calc(100vh-32px)] overflow-y-auto animate-modalScale select-none"
          >
            {/* Fejléc */}
            <div className="flex items-center justify-between border-b border-[#cbd8d6] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center font-bold">
                  <CalendarDaysIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-sm font-extrabold text-[#133b47] font-heading">
                  Робочий період
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-xl text-[#556e75] hover:text-[#133b47] hover:bg-[#f4f9f8] transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Dátum Fülek + BEÉKELT IKONGOMB KAPCSOLÓ */}
            <div className="flex items-center gap-1.5 bg-[#f4f9f8] p-1.5 rounded-2xl border border-[#cbd8d6]">
              {/* Kezdő Dátum Fül */}
              <button
                type="button"
                onClick={() => {
                  setActiveInput("start");
                  setViewDate(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
                }}
                className={`flex-1 py-2 px-3 rounded-xl flex flex-col items-start gap-0.5 transition-all cursor-pointer ${
                  activeInput === "start"
                    ? "bg-[#133b47] text-white shadow-sm ring-2 ring-[#133b47]/20"
                    : "text-[#556e75] hover:bg-white/60"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  Початок:
                </span>
                <span className="text-xs font-extrabold font-mono">
                  {formatDDMMYYYY(startDate)}
                </span>
              </button>

              {/* Beékelt Kis Ikon Kapcsoló Gomb (Szöveg nélkül) */}
              <button
                type="button"
                onClick={handleToggleAutoYear}
                className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 active:scale-95 flex items-center justify-center ${
                  isAutoYear
                    ? "bg-[#133b47] text-[#f8a44c] border-[#133b47] shadow-xs"
                    : "bg-white text-[#cbd8d6] border-[#cbd8d6] hover:text-[#556e75]"
                }`}
              >
                <ArrowPathIcon className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Záró Dátum Fül */}
              <button
                type="button"
                onClick={() => {
                  setActiveInput("end");
                  setViewDate(new Date(endDate.getFullYear(), endDate.getMonth(), 1));
                }}
                className={`flex-1 py-2 px-3 rounded-xl flex flex-col items-start gap-0.5 transition-all cursor-pointer ${
                  activeInput === "end"
                    ? "bg-[#133b47] text-white shadow-sm ring-2 ring-[#133b47]/20"
                    : "text-[#556e75] hover:bg-white/60"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  Кінець:
                </span>
                <span className="text-xs font-extrabold font-mono">
                  {formatDDMMYYYY(endDate)}
                </span>
              </button>
            </div>

            {/* --- EGYEDI NAPTÁR SELECTOR --- */}
            <div className="border border-[#cbd8d6] rounded-2xl p-3 bg-white">
              {/* Hónap Navigáció */}
              <div className="flex items-center justify-between mb-2 px-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg text-[#133b47] hover:bg-[#f4f9f8] transition-colors cursor-pointer"
                >
                  <ChevronLeftIcon className="w-5 h-5 stroke-[2.5]" />
                </button>
                <span className="text-xs font-extrabold text-[#133b47] font-mono">
                  {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg text-[#133b47] hover:bg-[#f4f9f8] transition-colors cursor-pointer"
                >
                  <ChevronRightIcon className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Nap Címkék */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {WEEKDAYS.map((day) => (
                  <span
                    key={day}
                    className="text-[11px] font-bold text-[#556e75] uppercase"
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Naptár Rács */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {gridDays.map(({ date, isCurrentMonth }, idx) => {
                  const isStart = isSameDay(date, startDate);
                  const isEnd = isSameDay(date, endDate);
                  const inRange = isBetween(date, startDate, endDate);

                  let cellClasses =
                    "h-8 w-8 mx-auto flex items-center justify-center text-xs font-bold rounded-xl transition-all cursor-pointer ";

                  if (isStart || isEnd) {
                    cellClasses += "bg-[#133b47] text-[#f8a44c] font-black shadow-xs scale-105 ";
                  } else if (inRange) {
                    cellClasses += "bg-[#f4f9f8] text-[#133b47] font-extrabold ";
                  } else if (!isCurrentMonth) {
                    cellClasses += "text-gray-300 hover:text-gray-500 hover:bg-gray-50 ";
                  } else {
                    cellClasses += "text-[#133b47] hover:bg-[#f4f9f8] ";
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDate(date)}
                      className={cellClasses}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Művelet Lábjegyzet */}
            <div className="pt-2 border-t border-[#cbd8d6] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#556e75] hover:bg-[#f4f9f8] hover:text-[#133b47] transition-all cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-[#f8a44c] hover:bg-[#e08e36] text-[#133b47] text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 border border-amber-300/40"
              >
                <CheckIcon className="w-4 h-4 stroke-[3]" />
                <span>Зберегти</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
