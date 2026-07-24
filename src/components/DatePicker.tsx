import React, { useState, useEffect } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const UKRAINIAN_MONTHS = [
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

const UKRAINIAN_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Оберіть дату",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Парсинг YYYY-MM-DD
  const parseValue = (valStr?: string) => {
    if (!valStr) return null;
    const parts = valStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    return null;
  };

  const selectedDate = parseValue(value);

  // Тимчасово обрана дата у модальному вікні
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(selectedDate);
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) {
      setTempSelectedDate(selectedDate);
      setViewDate(selectedDate);
    } else {
      setTempSelectedDate(null);
    }
  }, [value, isOpen]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const getDaysInMonth = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysCount = lastDayOfMonth.getDate();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysCount; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setViewDate(new Date(newYear, currentMonth, 1));
  };

  const handleSelectDay = (date: Date) => {
    setTempSelectedDate(date);
  };

  const handleConfirmDate = () => {
    if (tempSelectedDate) {
      const y = tempSelectedDate.getFullYear();
      const m = String(tempSelectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(tempSelectedDate.getDate()).padStart(2, "0");
      onChange(`${y}-${m}-${d}`);
    } else {
      onChange("");
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setTempSelectedDate(null);
  };

  const handleToday = () => {
    const today = new Date();
    setTempSelectedDate(today);
    setViewDate(today);
  };

  const formatDateDisplay = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const yearsList = [];
  for (let y = 1940; y <= 2040; y++) {
    yearsList.push(y);
  }

  const isTempSelected = (date: Date) => {
    if (!tempSelectedDate) return false;
    return (
      date.getFullYear() === tempSelectedDate.getFullYear() &&
      date.getMonth() === tempSelectedDate.getMonth() &&
      date.getDate() === tempSelectedDate.getDate()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  return (
    <div className="w-full">
      {/* Поле вводу дати */}
      <div
        onClick={() => setIsOpen(true)}
        className={`w-full h-13 px-3.5 rounded-2xl bg-white border-2 text-sm font-extrabold flex items-center justify-between cursor-pointer select-none transition-all shadow-xs ${
          isOpen ? "border-[#133b47] ring-4 ring-[#133b47]/10" : "border-[#bdcdcb] hover:border-[#9db3b0]"
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden text-[#133b47]">
          <CalendarIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.2] shrink-0" />
          {selectedDate ? (
            <span className="text-[#133b47] whitespace-nowrap truncate">{formatDateDisplay(selectedDate)}</span>
          ) : (
            <span className="text-[#8ba2a8] font-bold whitespace-nowrap truncate">{placeholder}</span>
          )}
        </div>

        {selectedDate && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full text-[#738e96] hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 ml-1"
          >
            <XMarkIcon className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Окреме Модальне Вікно Календаря */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white border-2 border-[#133b47] rounded-[32px] w-full max-w-[380px] p-6 shadow-2xl flex flex-col animate-modalScale select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок модалки календаря */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-[#e2eceb]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-lg font-black text-[#133b47] font-heading">Оберіть дату</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-[#5c777f] hover:text-[#133b47] hover:bg-[#e6eeed] transition-all"
              >
                <XMarkIcon className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Шапка вибору місяця та року */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl text-[#133b47] hover:bg-[#f0f6f5] transition-colors cursor-pointer"
              >
                <ChevronLeftIcon className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-base font-black text-[#133b47]">
                  {UKRAINIAN_MONTHS[currentMonth]}
                </span>

                <select
                  value={currentYear}
                  onChange={handleYearChange}
                  className="bg-[#f0f6f5] border border-[#bdcdcb] text-[#133b47] font-black text-sm rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer"
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl text-[#133b47] hover:bg-[#f0f6f5] transition-colors cursor-pointer"
              >
                <ChevronRightIcon className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Дні тижня (Пн - Нд) */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {UKRAINIAN_DAYS.map((day) => (
                <div key={day} className="text-xs font-black text-[#5e7982] py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Сітка днів місяця */}
            <div className="grid grid-cols-7 gap-1.5 mb-5">
              {getDaysInMonth(currentYear, currentMonth).map(({ date, isCurrentMonth }, idx) => {
                const selected = isTempSelected(date);
                const today = isToday(date);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(date)}
                    className={`h-9 rounded-xl font-bold text-sm flex items-center justify-center transition-all cursor-pointer ${
                      selected
                        ? "bg-[#133b47] text-[#f8a44c] font-black shadow-md scale-105"
                        : today
                        ? "bg-[#fdf3e7] text-[#133b47] font-black border-2 border-[#f8a44c]"
                        : isCurrentMonth
                        ? "text-[#133b47] hover:bg-[#f0f6f5]"
                        : "text-[#bdcdcb] hover:bg-[#f8faf9]"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Футер модального вікна дати */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-[#e2eceb]">
              <button
                type="button"
                onClick={handleToday}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#fdf3e7] text-[#133b47] border border-[#f5e2cc] hover:bg-[#faeade] transition-colors"
              >
                Сьогодні
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#e6eeed] hover:bg-[#d5e2e0] text-[#133b47] transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDate}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black bg-[#f8a44c] hover:bg-[#f59533] text-[#133b47] shadow-md transition-colors"
                >
                  <CheckIcon className="w-4 h-4 stroke-[3]" />
                  Обрати
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
