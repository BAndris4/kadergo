import React, { useState, useRef, useEffect } from "react";
import {
  CalendarIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export const MONTH_NAMES_UKR = [
  { id: 1, name: "Січень" },
  { id: 2, name: "Лютий" },
  { id: 3, name: "Березень" },
  { id: 4, name: "Квітень" },
  { id: 5, name: "Травень" },
  { id: 6, name: "Червень" },
  { id: 7, name: "Липень" },
  { id: 8, name: "Серпень" },
  { id: 9, name: "Вересень" },
  { id: 10, name: "Жовтень" },
  { id: 11, name: "Листопад" },
  { id: 12, name: "Грудень" },
];

const CURRENT_YEAR = new Date().getFullYear();
export const AVAILABLE_YEARS = [
  CURRENT_YEAR - 2,
  CURRENT_YEAR - 1,
  CURRENT_YEAR,
  CURRENT_YEAR + 1,
  CURRENT_YEAR + 2,
];

interface CustomDateSelectorProps {
  mode: "month" | "period";
  onModeChange: (mode: "month" | "period") => void;
  selectedYear: number;
  selectedMonth: number;
  onSingleDateChange: (year: number, month: number) => void;
  startYear: number | null;
  startMonth: number | null;
  endYear: number | null;
  endMonth: number | null;
  onPeriodChange: (sYear: number | null, sMonth: number | null, eYear: number | null, eMonth: number | null) => void;
}

export const CustomDateSelector: React.FC<CustomDateSelectorProps> = ({
  mode,
  onModeChange,
  selectedYear,
  selectedMonth,
  onSingleDateChange,
  startYear,
  startMonth,
  endYear,
  endMonth,
  onPeriodChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"start" | "end">("start");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isPeriodComplete = Boolean(startYear && startMonth && endYear && endMonth);

  const calculateMonthCount = () => {
    if (!startYear || !startMonth || !endYear || !endMonth) return 0;
    return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  };

  const getSingleMonthName = () => {
    return MONTH_NAMES_UKR.find((m) => m.id === selectedMonth)?.name || "";
  };

  const getStartMonthName = () => {
    return MONTH_NAMES_UKR.find((m) => m.id === startMonth)?.name || "";
  };

  const getEndMonthName = () => {
    return MONTH_NAMES_UKR.find((m) => m.id === endMonth)?.name || "";
  };

  const handleSelectSingleMonth = (year: number, monthId: number) => {
    onSingleDateChange(year, monthId);
    setIsOpen(false);
  };

  const handleSelectStartMonth = (monthId: number) => {
    const chosenYear = startYear || new Date().getFullYear();
    let newEndYear = endYear;
    let newEndMonth = endMonth;

    // If end date was set and is now earlier or equal to start, clear end so user selects a valid end
    if (newEndYear && newEndMonth) {
      if (newEndYear < chosenYear || (newEndYear === chosenYear && newEndMonth <= monthId)) {
        newEndYear = null;
        newEndMonth = null;
      }
    }

    onPeriodChange(chosenYear, monthId, newEndYear, newEndMonth);
    setActiveTab("end");
  };

  const handleSelectEndMonth = (monthId: number) => {
    const targetEndYear =
      endYear ||
      (startYear
        ? startMonth === 12
          ? startYear + 1
          : startYear
        : new Date().getFullYear());

    onPeriodChange(startYear, startMonth, targetEndYear, monthId);
    setIsOpen(false);
  };

  const handleSelectEndYear = (y: number) => {
    let newEndMonth = endMonth;
    if (startYear !== null && startMonth !== null) {
      if (y < startYear || (y === startYear && newEndMonth !== null && newEndMonth <= startMonth)) {
        newEndMonth = null;
      }
    }
    onPeriodChange(startYear, startMonth, y, newEndMonth);
  };

  const effectiveEndYear =
    endYear ||
    (startYear
      ? startMonth === 12
        ? startYear + 1
        : startYear
      : new Date().getFullYear());

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* MAIN BUTTON TOGGLE */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="px-4 py-2.5 rounded-2xl bg-[#0b2229]/80 hover:bg-[#0b2229] border border-[#f8a44c]/40 text-white font-black text-xs transition-all flex items-center gap-3 shadow-lg cursor-pointer backdrop-blur-md hover:border-[#f8a44c]"
      >
        <CalendarIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.2] shrink-0" />

        {mode === "month" ? (
          <div className="flex items-center gap-2">
            <span className="text-[#f8a44c] font-black uppercase tracking-wide">
              {getSingleMonthName()}
            </span>
            <span className="text-white font-black">{selectedYear}р.</span>
          </div>
        ) : !isPeriodComplete ? (
          <div className="flex items-center gap-2">
            <span className="text-[#f8a44c] font-black">
              {startYear && startMonth ? `${getStartMonthName()} ${startYear}` : "Початок"}
            </span>
            <ArrowRightIcon className="w-3.5 h-3.5 text-[#c3d9d6] stroke-[3]" />
            <span className="text-[#f8a44c] font-black">
              {endYear && endMonth ? `${getEndMonthName()} ${endYear}` : "Кінець"}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-white/10 text-[#c3d9d6] border border-white/10">
              Оберіть період
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[#f8a44c] font-black uppercase tracking-wide">
              {getStartMonthName()} {startYear}
            </span>
            <ArrowRightIcon className="w-3.5 h-3.5 text-[#c3d9d6] stroke-[3]" />
            <span className="text-[#f8a44c] font-black uppercase tracking-wide">
              {getEndMonthName()} {endYear}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#f8a44c] text-[#133b47] shadow-xs">
              {calculateMonthCount()} міс.
            </span>
          </div>
        )}

        <ChevronDownIcon
          className={`w-4 h-4 text-white/80 shrink-0 transition-transform duration-200 stroke-[2.5] ${
            isOpen ? "rotate-180 text-[#f8a44c]" : ""
          }`}
        />
      </button>

      {/* POPUP DROPDOWN MENU */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2.5 w-84 sm:w-96 bg-white rounded-3xl border-2 border-[#cbd8d6] shadow-2xl overflow-hidden p-5 flex flex-col gap-4 z-[9999] text-[#133b47] animate-modalScale"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Mode Switcher */}
          <div className="flex items-center justify-between bg-[#f4f9f8] p-1.5 rounded-2xl border border-[#cbd8d6]">
            <button
              type="button"
              onClick={() => onModeChange("month")}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mode === "month"
                  ? "bg-[#133b47] text-[#f8a44c] shadow-md"
                  : "text-[#556e75] hover:text-[#133b47]"
              }`}
            >
              Місяць
            </button>
            <button
              type="button"
              onClick={() => {
                if (mode !== "period") {
                  onModeChange("period");
                  setActiveTab("start");
                }
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "period"
                  ? "bg-[#133b47] text-[#f8a44c] shadow-md"
                  : "text-[#556e75] hover:text-[#133b47]"
              }`}
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 stroke-[2.2]" />
              Період
            </button>
          </div>

          {/* MODE 1: SINGLE MONTH SELECTOR */}
          {mode === "month" && (
            <div className="flex flex-col gap-3">
              {/* Year Selector */}
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#f4f9f8] rounded-2xl border border-[#cbd8d6]/60">
                {AVAILABLE_YEARS.map((y) => (
                  <button
                    type="button"
                    key={y}
                    onClick={() => onSingleDateChange(y, selectedMonth)}
                    className={`py-2 rounded-xl text-xs font-black transition-colors cursor-pointer text-center ${
                      selectedYear === y
                        ? "bg-[#133b47] text-[#f8a44c] shadow-sm ring-1 ring-[#133b47]"
                        : "text-[#133b47] hover:bg-white hover:shadow-xs"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>

              {/* Month Selector Grid */}
              <div className="grid grid-cols-3 gap-2">
                {MONTH_NAMES_UKR.map((m) => {
                  const isSelected = selectedMonth === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => handleSelectSingleMonth(selectedYear, m.id)}
                      className={`h-11 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-[#f8a44c] text-[#133b47] font-black shadow-sm ring-2 ring-[#f8a44c]/30"
                          : "bg-[#f4f9f8] hover:bg-[#e2eceb] text-[#133b47]"
                      }`}
                    >
                      <span>{m.name}</span>
                      {isSelected && <CheckIcon className="w-4 h-4 stroke-[3] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE 2: PERIOD RANGE SELECTOR */}
          {mode === "period" && (
            <div className="flex flex-col gap-3.5">
              {/* Tab selector for Start vs End month */}
              <div className="flex items-center p-1 bg-[#f4f9f8] rounded-2xl border border-[#cbd8d6]">
                <button
                  type="button"
                  onClick={() => setActiveTab("start")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === "start"
                      ? "bg-[#133b47] text-[#f8a44c] shadow-md"
                      : "text-[#556e75] hover:text-[#133b47] hover:bg-white/60"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Від:</span>
                  <span className="truncate">
                    {startYear && startMonth ? `${getStartMonthName()} ${startYear}` : "—"}
                  </span>
                </button>

                <ArrowRightIcon className="w-3.5 h-3.5 text-[#556e75]/40 mx-1 shrink-0 stroke-[2.5]" />

                <button
                  type="button"
                  onClick={() => setActiveTab("end")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === "end"
                      ? "bg-[#133b47] text-[#f8a44c] shadow-md"
                      : "text-[#556e75] hover:text-[#133b47] hover:bg-white/60"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">До:</span>
                  <span className="truncate">
                    {endYear && endMonth ? `${getEndMonthName()} ${endYear}` : "—"}
                  </span>
                </button>
              </div>

              {/* Selection for Active Tab */}
              {activeTab === "start" ? (
                <div className="flex flex-col gap-3">
                  {/* Start Year Selector */}
                  <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#f4f9f8] rounded-2xl border border-[#cbd8d6]/60">
                    {AVAILABLE_YEARS.map((y) => (
                      <button
                        type="button"
                        key={y}
                        onClick={() => {
                          let newEndYear = endYear;
                          let newEndMonth = endMonth;
                          if (
                            newEndYear &&
                            (newEndYear < y ||
                              (newEndYear === y && newEndMonth && startMonth && newEndMonth <= startMonth))
                          ) {
                            newEndYear = null;
                            newEndMonth = null;
                          }
                          onPeriodChange(y, startMonth, newEndYear, newEndMonth);
                        }}
                        className={`py-2 rounded-xl text-xs font-black transition-colors cursor-pointer text-center ${
                          startYear === y
                            ? "bg-[#133b47] text-[#f8a44c] shadow-sm ring-1 ring-[#133b47]"
                            : "text-[#133b47] hover:bg-white hover:shadow-xs"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>

                  {/* Start Month Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {MONTH_NAMES_UKR.map((m) => {
                      const isSelected = startMonth === m.id;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => handleSelectStartMonth(m.id)}
                          className={`h-11 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-[#f8a44c] text-[#133b47] font-black shadow-sm ring-2 ring-[#f8a44c]/30"
                              : "bg-[#f4f9f8] hover:bg-[#e2eceb] text-[#133b47]"
                          }`}
                        >
                          <span>{m.name}</span>
                          {isSelected && <CheckIcon className="w-4 h-4 stroke-[3] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* End Year Selector */}
                  <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#f4f9f8] rounded-2xl border border-[#cbd8d6]/60">
                    {AVAILABLE_YEARS.map((y) => {
                      const isYearDisabled = Boolean(
                        startYear !== null &&
                          (y < startYear || (y === startYear && startMonth === 12))
                      );
                      const isSelected = effectiveEndYear === y;
                      return (
                        <button
                          type="button"
                          key={y}
                          disabled={isYearDisabled}
                          onClick={() => handleSelectEndYear(y)}
                          className={`py-2 rounded-xl text-xs font-black transition-colors cursor-pointer text-center ${
                            isYearDisabled
                              ? "opacity-30 cursor-not-allowed bg-transparent text-slate-400 select-none pointer-events-none"
                              : isSelected
                              ? "bg-[#133b47] text-[#f8a44c] shadow-sm ring-1 ring-[#133b47]"
                              : "text-[#133b47] hover:bg-white hover:shadow-xs"
                          }`}
                        >
                          {y}
                        </button>
                      );
                    })}
                  </div>

                  {/* End Month Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {MONTH_NAMES_UKR.map((m) => {
                      let isMonthDisabled = false;
                      if (startYear !== null && startMonth !== null) {
                        if (effectiveEndYear < startYear) {
                          isMonthDisabled = true;
                        } else if (effectiveEndYear === startYear) {
                          // Earlier months and the start month itself are disabled
                          isMonthDisabled = m.id <= startMonth;
                        }
                      }

                      const isSelected = endMonth === m.id && endYear === effectiveEndYear;
                      const isInRange = Boolean(
                        startYear &&
                          startMonth &&
                          endYear &&
                          endMonth &&
                          ((effectiveEndYear === startYear &&
                            effectiveEndYear === endYear &&
                            m.id > startMonth &&
                            m.id < endMonth) ||
                            (effectiveEndYear === startYear &&
                              effectiveEndYear < endYear &&
                              m.id > startMonth) ||
                            (effectiveEndYear > startYear && effectiveEndYear < endYear) ||
                            (effectiveEndYear > startYear &&
                              effectiveEndYear === endYear &&
                              m.id < endMonth))
                      );

                      return (
                        <button
                          type="button"
                          key={m.id}
                          disabled={isMonthDisabled}
                          onClick={() => handleSelectEndMonth(m.id)}
                          className={`h-11 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                            isMonthDisabled
                              ? "opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 select-none pointer-events-none border-transparent shadow-none"
                              : isSelected
                              ? "bg-[#f8a44c] text-[#133b47] font-black shadow-sm ring-2 ring-[#f8a44c]/30"
                              : isInRange
                              ? "bg-[#f8a44c]/15 text-[#133b47] font-bold border border-[#f8a44c]/40"
                              : "bg-[#f4f9f8] hover:bg-[#e2eceb] text-[#133b47]"
                          }`}
                        >
                          <span>{m.name}</span>
                          {isSelected && <CheckIcon className="w-4 h-4 stroke-[3] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-[#cbd8d6]/80">
                <button
                  type="button"
                  onClick={() => {
                    onPeriodChange(null, null, null, null);
                    setActiveTab("start");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowPathIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Скинути</span>
                </button>

                {isPeriodComplete && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-1.5 rounded-xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Застосувати ({calculateMonthCount()} міс.)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
