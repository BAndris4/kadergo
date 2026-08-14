import React, { useState, useRef, useEffect } from "react";
import {
  CalendarIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  CheckIcon,
  ArrowRightIcon,
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

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027];

interface CustomDateSelectorProps {
  mode: "month" | "period";
  onModeChange: (mode: "month" | "period") => void;
  selectedYear: number;
  selectedMonth: number;
  onSingleDateChange: (year: number, month: number) => void;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  onPeriodChange: (sYear: number, sMonth: number, eYear: number, eMonth: number) => void;
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

  const calculateMonthCount = () => {
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

  const handleSelectStartMonth = (year: number, monthId: number) => {
    onPeriodChange(year, monthId, endYear, endMonth);
    setActiveTab("end");
  };

  const handleSelectEndMonth = (year: number, monthId: number) => {
    onPeriodChange(startYear, startMonth, year, monthId);
    setIsOpen(false);
  };

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
              onClick={() => onModeChange("period")}
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
            <div className="flex flex-col gap-4">
              {/* Year Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-black uppercase text-[#556e75] tracking-wider">
                  Оберіть рік:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_YEARS.map((y) => (
                    <button
                      type="button"
                      key={y}
                      onClick={() => onSingleDateChange(y, selectedMonth)}
                      className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        selectedYear === y
                          ? "bg-[#133b47] text-[#f8a44c] shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-[#133b47]"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Selector Grid */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-black uppercase text-[#556e75] tracking-wider">
                  Оберіть місяць:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {MONTH_NAMES_UKR.map((m) => {
                    const isSelected = selectedMonth === m.id;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => handleSelectSingleMonth(selectedYear, m.id)}
                        className={`p-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-[#f8a44c] text-[#133b47] shadow-md scale-105"
                            : "bg-[#f4f9f8] hover:bg-[#e2eceb] text-[#133b47]"
                        }`}
                      >
                        <span>{m.name}</span>
                        {isSelected && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: PERIOD RANGE SELECTOR */}
          {mode === "period" && (
            <div className="flex flex-col gap-4">
              {/* Tab selector for Start vs End month */}
              <div className="flex items-center gap-2 border-b border-[#cbd8d6] pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("start")}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === "start"
                      ? "bg-[#133b47] text-[#f8a44c] shadow-md"
                      : "bg-slate-100 text-[#556e75] hover:text-[#133b47]"
                  }`}
                >
                  Від: {getStartMonthName()} {startYear}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("end")}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === "end"
                      ? "bg-[#133b47] text-[#f8a44c] shadow-md"
                      : "bg-slate-100 text-[#556e75] hover:text-[#133b47]"
                  }`}
                >
                  До: {getEndMonthName()} {endYear}
                </button>
              </div>

              {/* Selection for Active Tab */}
              {activeTab === "start" ? (
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-black uppercase text-[#556e75]">
                    Початок періоду (Місяць та рік):
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_YEARS.map((y) => (
                      <button
                        type="button"
                        key={y}
                        onClick={() => onPeriodChange(y, startMonth, endYear, endMonth)}
                        className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          startYear === y
                            ? "bg-[#133b47] text-[#f8a44c]"
                            : "bg-slate-100 text-[#133b47]"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {MONTH_NAMES_UKR.map((m) => {
                      const isSelected = startMonth === m.id;
                      const isInRange = startYear === endYear && m.id >= startMonth && m.id <= endMonth;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => handleSelectStartMonth(startYear, m.id)}
                          className={`p-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-[#f8a44c] text-[#133b47] shadow-md scale-105"
                              : isInRange
                              ? "bg-[#f8a44c]/20 text-[#133b47] border border-[#f8a44c]/40"
                              : "bg-[#f4f9f8] hover:bg-[#e2eceb] text-[#133b47]"
                          }`}
                        >
                          <span>{m.name}</span>
                          {isSelected && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-black uppercase text-[#556e75]">
                    Кінець періоду (Місяць та рік):
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_YEARS.map((y) => (
                      <button
                        type="button"
                        key={y}
                        onClick={() => onPeriodChange(startYear, startMonth, y, endMonth)}
                        className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          endYear === y
                            ? "bg-[#133b47] text-[#f8a44c]"
                            : "bg-slate-100 text-[#133b47]"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {MONTH_NAMES_UKR.map((m) => {
                      const isSelected = endMonth === m.id;
                      const isInRange = startYear === endYear && m.id >= startMonth && m.id <= endMonth;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => handleSelectEndMonth(endYear, m.id)}
                          className={`p-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-[#f8a44c] text-[#133b47] shadow-md scale-105"
                              : isInRange
                              ? "bg-[#f8a44c]/20 text-[#133b47] border border-[#f8a44c]/40"
                              : "bg-[#f4f9f8] hover:bg-[#e2eceb] text-[#133b47]"
                          }`}
                        >
                          <span>{m.name}</span>
                          {isSelected && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
