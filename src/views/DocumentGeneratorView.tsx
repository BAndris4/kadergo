import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  ExclamationCircleIcon,
  FolderOpenIcon,
  ArrowTopRightOnSquareIcon,
  TableCellsIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  CheckIcon,
  DocumentTextIcon,
  UserPlusIcon,
  UserMinusIcon,
  SunIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { FopData, Munkas } from "../types/fop";
import { ensureFopDirectory, openFolderInExplorer } from "../services/fopService";
import { PayrollGeneratorView } from "../components/PayrollGeneratorView";
import { TabelGeneratorView } from "../components/TabelGeneratorView";
import { ZayavaPriyomGeneratorView, ZayavaTypeCategory } from "../components/ZayavaPriyomGeneratorView";

interface DocumentGeneratorViewProps {
  fops: FopData[];
  selectedFopId: number | null;
  onSelectFop: (id: number) => void;
  rootFolder: string;
  minWage: number;
  onShowToast: (msg: string) => void;
  onEditWorker?: (worker: Munkas) => void;
  onDeleteWorker?: (worker: Munkas) => void;
  onAddWorker?: (fopId: number) => void;
}

export const DocumentGeneratorView: React.FC<DocumentGeneratorViewProps> = ({
  fops,
  selectedFopId,
  onSelectFop,
  rootFolder,
  minWage,
  onShowToast,
  onEditWorker,
  onDeleteWorker,
  onAddWorker,
}) => {
  const [activeDocView, setActiveDocView] = useState<"menu" | "payroll" | "tabel" | "zayava_priyom">("menu");
  const [initialZayavaType, setInitialZayavaType] = useState<ZayavaTypeCategory>("priyom");

  // Custom FOP Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fopSearchQuery, setFopSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeFop = fops.find((f) => f.id === selectedFopId) || null;
  const activeFopName = activeFop
    ? [activeFop.vezeteknev, activeFop.keresztnev, activeFop.apai_nev].filter(Boolean).join(" ")
    : "";
  const activeFopCode = activeFop ? activeFop.kod || activeFop.fop_kod || "" : "";

  // Active FOP is valid ONLY if it has workers (>0)
  const isFopValidForPayroll = Boolean(activeFop && activeFop.munkasok && activeFop.munkasok.length > 0);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenExplorer = async () => {
    if (!rootFolder) {
      onShowToast("Спочатку оберіть головну папку збереження в Налаштуваннях!");
      return;
    }
    if (!activeFop) {
      onShowToast("Спочатку оберіть активного ФОП зі списку!");
      return;
    }

    const targetDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
    if (targetDir) {
      await openFolderInExplorer(targetDir);
      onShowToast(`Відкрито папку у Провіднику: ${targetDir}`);
    }
  };

  // Show ALL FOPs in the selection dropdown for main view
  const filteredFopsDropdown = fops
    .filter((f) => {
      const name = [f.vezeteknev, f.keresztnev, f.apai_nev].filter(Boolean).join(" ").toLowerCase();
      const code = (f.kod || f.fop_kod || "").toLowerCase();
      const q = fopSearchQuery.toLowerCase();
      return name.includes(q) || code.includes(q);
    })
    .sort((a, b) => {
      const nameA = [a.vezeteknev, a.keresztnev, a.apai_nev].filter(Boolean).join(" ");
      const nameB = [b.vezeteknev, b.keresztnev, b.apai_nev].filter(Boolean).join(" ");
      return nameA.localeCompare(nameB, "uk", { sensitivity: "base" });
    });

  const handleOpenZayava = (type: ZayavaTypeCategory) => {
    if (!isFopValidForPayroll) return;
    setInitialZayavaType(type);
    setActiveDocView("zayava_priyom");
  };

  return (
    <div className="flex flex-col gap-8 animate-fadeIn pb-12 w-full font-sans">
      {/* 1. TOP ACTIVE FOP CONTROL BAR */}
      <div className="bg-gradient-to-r from-white via-[#f8faf9] to-[#f4f9f8] rounded-[28px] p-5 px-8 border-2 border-[#cbd8d6] shadow-md flex flex-col md:flex-row items-center justify-between gap-6 relative z-20 transition-all duration-300">
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-sm">
            <BuildingOffice2Icon className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-[#556e75]">
              Активний ФОП для документів:
            </span>
            <span className="text-xs font-medium text-[#133b47]">
              Оберіть ФОП зі списку для формування звітів
            </span>
          </div>
        </div>

        {/* CUSTOM FOP DROPDOWN MENU */}
        <div className="relative flex-1 max-w-xl w-full" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="w-full h-13 px-5 rounded-2xl bg-white border-2 border-[#cbd8d6] hover:border-[#133b47] text-[#133b47] text-sm font-bold focus:outline-none transition-all duration-200 flex items-center justify-between shadow-xs cursor-pointer"
          >
            {activeFop ? (
              <div className="flex items-center gap-3 truncate">
                <div className="w-8 h-8 rounded-xl bg-[#133b47] text-[#f8a44c] text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                  {activeFop.vezeteknev.charAt(0)}
                </div>
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate font-bold text-[#133b47]">{activeFopName}</span>
                  {activeFopCode && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#f8a44c] text-[#133b47] shrink-0">
                      {activeFopCode}
                    </span>
                  )}
                  <span className="text-xs font-medium text-[#556e75] shrink-0">
                    ({activeFop.munkasok?.length || 0} прац.)
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-[#556e75] font-medium">-- Оберіть ФОП зі списку --</span>
            )}

            <ChevronDownIcon
              className={`w-5 h-5 text-[#133b47] shrink-0 transition-transform duration-200 stroke-[2.5] ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* DROPDOWN POPUP MENU */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] border-2 border-[#cbd8d6] shadow-2xl overflow-hidden z-40 animate-modalScale">
              <div className="p-3.5 border-b border-[#e2eceb] bg-[#f8faf9] flex items-center gap-2.5">
                <MagnifyingGlassIcon className="w-5 h-5 text-[#556e75] shrink-0 stroke-[2]" />
                <input
                  type="text"
                  placeholder="Пошук за прізвищем або кодом ЄДРПОУ..."
                  value={fopSearchQuery}
                  onChange={(e) => setFopSearchQuery(e.target.value)}
                  className="w-full text-sm font-semibold text-[#133b47] bg-transparent focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="max-h-72 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
                {filteredFopsDropdown.length === 0 ? (
                  <div className="p-4 text-center text-sm font-medium text-[#556e75]">
                    ФОП за вашим запитом не знайдено.
                  </div>
                ) : (
                  filteredFopsDropdown.map((f) => {
                    const name = [f.vezeteknev, f.keresztnev, f.apai_nev].filter(Boolean).join(" ");
                    const code = f.kod || f.fop_kod || "";
                    const workerCount = f.munkasok?.length || 0;
                    const isSelected = f.id === selectedFopId;

                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          onSelectFop(f.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`p-3 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-[#133b47] text-white shadow-sm"
                            : "hover:bg-[#f4f9f8] text-[#133b47]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected ? "bg-[#f8a44c] text-[#133b47]" : "bg-[#133b47] text-[#f8a44c]"
                            }`}
                          >
                            {f.vezeteknev.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-sm font-bold truncate">{name}</span>
                              {code && (
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    isSelected ? "bg-[#f8a44c] text-[#133b47]" : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {code}
                                </span>
                              )}
                            </div>
                            <span className={`text-xs font-medium ${isSelected ? "text-[#c3d9d6]" : "text-[#556e75]"}`}>
                              {workerCount} працівників
                            </span>
                          </div>
                        </div>

                        {isSelected && <CheckIcon className="w-5 h-5 text-[#f8a44c] stroke-[3]" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* EXPLORER FOLDER BUTTON */}
        <button
          onClick={handleOpenExplorer}
          className="px-5 py-3.5 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-white text-xs font-bold transition-all duration-200 flex items-center gap-2.5 shrink-0 cursor-pointer shadow-md hover:scale-105 active:scale-95"
        >
          <FolderOpenIcon className="w-4.5 h-4.5 stroke-[2.2] text-[#f8a44c]" />
          <span>Відкрити у Провіднику</span>
          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-slate-300 stroke-[2]" />
        </button>
      </div>

      {/* WARNING ALERT: IF SELECTED FOP HAS 0 WORKERS */}
      {activeFop && !isFopValidForPayroll && (
        <div className="bg-amber-50 rounded-[28px] p-5 px-7 border-2 border-amber-200 text-amber-900 text-sm font-medium flex items-center gap-4 shadow-sm animate-fadeIn">
          <ExclamationCircleIcon className="w-6 h-6 text-amber-600 shrink-0 stroke-[2.2]" />
          <div className="flex flex-col">
            <span className="font-bold text-amber-950">
              Обраний ФОП "{activeFopName}" не має зареєстрованих працівників!
            </span>
            <span className="text-xs text-amber-800 font-medium">
              Для формування кадрових документів спочатку додайте працівників у розділі "Працівники".
            </span>
          </div>
        </div>
      )}

      {/* MAIN DOCUMENT DASHBOARD: 2 SEPARATE CATEGORIES */}
      {activeDocView === "menu" && (
        <div className="flex flex-col gap-10">
          {/* CATEGORY 1: ЗВІТНІСТЬ ТА ОБЛІК ЧАСУ (PAYROLL & TIMESHEET) */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#cbd8d6] pb-3 px-1">
              <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-[#354f57]">
                <TableCellsIcon className="w-5 h-5 text-[#133b47] stroke-[2]" />
                Звітність та облік часу
              </div>
              <span className="text-xs font-medium text-[#556e75]">
                Розрахункові відомості та Табелі обліку часу
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {/* CARD 1: PAYROLL VEDOMOST */}
              <div
                onClick={() => isFopValidForPayroll && setActiveDocView("payroll")}
                className={`rounded-[32px] p-8 border-2 transition-all duration-300 shadow-lg flex flex-col justify-between gap-6 relative overflow-hidden group ${
                  isFopValidForPayroll
                    ? "bg-gradient-to-br from-white via-[#fbfdfd] to-[#f4f9f8] border-[#cbd8d6] hover:border-[#133b47] hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
                    : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex flex-col gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-md group-hover:scale-105 transition-transform duration-300">
                    <TableCellsIcon className="w-8 h-8 stroke-[2.2]" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-bold text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors">
                      Відомість нарахування
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-[#556e75] leading-relaxed">
                      Розрахунково-платіжна відомість заробітної плати працівників за обраний місяць або період.
                    </p>
                  </div>
                </div>

                <button
                  disabled={!isFopValidForPayroll}
                  className={`w-full py-4 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    isFopValidForPayroll
                      ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-md cursor-pointer"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isFopValidForPayroll ? "Відкрити розрахунок →" : "Оберіть ФОП з працівниками"}
                </button>
              </div>

              {/* CARD 2: TABEL (TIMESHEET) */}
              <div
                onClick={() => isFopValidForPayroll && setActiveDocView("tabel")}
                className={`rounded-[32px] p-8 border-2 transition-all duration-300 shadow-lg flex flex-col justify-between gap-6 relative overflow-hidden group ${
                  isFopValidForPayroll
                    ? "bg-gradient-to-br from-white via-[#fbfdfd] to-[#f4f9f8] border-[#cbd8d6] hover:border-[#133b47] hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
                    : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex flex-col gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-md group-hover:scale-105 transition-transform duration-300">
                    <CalendarDaysIcon className="w-8 h-8 stroke-[2.2]" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-bold text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors">
                      Табель обліку часу
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-[#556e75] leading-relaxed">
                      Облік відпрацьованих годин, днів та неявок працівників за обраний місяць або період.
                    </p>
                  </div>
                </div>

                <button
                  disabled={!isFopValidForPayroll}
                  className={`w-full py-4 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    isFopValidForPayroll
                      ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-md cursor-pointer"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isFopValidForPayroll ? "Відкрити табель обліку →" : "Оберіть ФОП з працівниками"}
                </button>
              </div>
            </div>
          </div>

          {/* CATEGORY 2: КАДРОВІ ДОКУМЕНТИ ТА ЗАЯВИ (ELEGANT 4-CARD GRID) */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#cbd8d6] pb-3 px-1">
              <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-[#354f57]">
                <DocumentTextIcon className="w-5 h-5 text-[#133b47] stroke-[2]" />
                Кадрові документи та заяви
              </div>
              <span className="text-xs font-medium text-[#556e75]">
                Офіційні заяви працівників ФОП
              </span>
            </div>

            {/* SPACIOUS 2x2 GRID OF INDIVIDUAL ELEGANT ZAYAVA CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* ZAYAVA 1: PRIYOM */}
              <div
                onClick={() => handleOpenZayava("priyom")}
                className={`rounded-[28px] p-6 border-2 transition-all duration-300 shadow-md flex flex-col justify-between gap-5 relative overflow-hidden group ${
                  isFopValidForPayroll
                    ? "bg-gradient-to-br from-white via-[#fbfdfd] to-[#f4f9f8] border-[#cbd8d6] hover:border-[#133b47] hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                    : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <UserPlusIcon className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-lg font-bold text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors leading-snug">
                      Заява на прийом
                    </h4>
                    <p className="text-xs font-medium text-[#556e75] leading-relaxed">
                      Прийняття працівника на роботу.
                    </p>
                  </div>
                </div>

                <button
                  disabled={!isFopValidForPayroll}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    isFopValidForPayroll
                      ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-sm cursor-pointer"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <span>Оформити →</span>
                </button>
              </div>

              {/* ZAYAVA 2: ZVILNENNYA */}
              <div
                onClick={() => handleOpenZayava("zvilnennya")}
                className={`rounded-[28px] p-6 border-2 transition-all duration-300 shadow-md flex flex-col justify-between gap-5 relative overflow-hidden group ${
                  isFopValidForPayroll
                    ? "bg-gradient-to-br from-white via-[#fbfdfd] to-[#f4f9f8] border-[#cbd8d6] hover:border-[#133b47] hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                    : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <UserMinusIcon className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-lg font-bold text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors leading-snug">
                      Заява на звільнення
                    </h4>
                    <p className="text-xs font-medium text-[#556e75] leading-relaxed">
                      Звільнення за згодою сторін.
                    </p>
                  </div>
                </div>

                <button
                  disabled={!isFopValidForPayroll}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    isFopValidForPayroll
                      ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-sm cursor-pointer"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <span>Оформити →</span>
                </button>
              </div>

              {/* ZAYAVA 3: VIDPUSTKA */}
              <div
                onClick={() => handleOpenZayava("vidpustka")}
                className={`rounded-[28px] p-6 border-2 transition-all duration-300 shadow-md flex flex-col justify-between gap-5 relative overflow-hidden group ${
                  isFopValidForPayroll
                    ? "bg-gradient-to-br from-white via-[#fbfdfd] to-[#f4f9f8] border-[#cbd8d6] hover:border-[#133b47] hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                    : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <SunIcon className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-lg font-bold text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors leading-snug">
                      Заява на відпустку
                    </h4>
                    <p className="text-xs font-medium text-[#556e75] leading-relaxed">
                      Надання щорічної відпустки.
                    </p>
                  </div>
                </div>

                <button
                  disabled={!isFopValidForPayroll}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    isFopValidForPayroll
                      ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-sm cursor-pointer"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <span>Оформити →</span>
                </button>
              </div>

              {/* ZAYAVA 4: BEZ KOPIJOK */}
              <div
                onClick={() => handleOpenZayava("bez_kopijok")}
                className={`rounded-[28px] p-6 border-2 transition-all duration-300 shadow-md flex flex-col justify-between gap-5 relative overflow-hidden group ${
                  isFopValidForPayroll
                    ? "bg-gradient-to-br from-white via-[#fbfdfd] to-[#f4f9f8] border-[#cbd8d6] hover:border-[#133b47] hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                    : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <BanknotesIcon className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-lg font-bold text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors leading-snug">
                      Без копійок
                    </h4>
                    <p className="text-xs font-medium text-[#556e75] leading-relaxed">
                      Виплата зарплати без копійок.
                    </p>
                  </div>
                </div>

                <button
                  disabled={!isFopValidForPayroll}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    isFopValidForPayroll
                      ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-sm cursor-pointer"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <span>Оформити →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PAYROLL GENERATOR VIEW */}
      {activeDocView === "payroll" && (
        <PayrollGeneratorView
          activeFop={activeFop}
          rootFolder={rootFolder}
          minWage={minWage}
          onBackToOptions={() => setActiveDocView("menu")}
          onShowToast={onShowToast}
          onEditWorker={onEditWorker}
          onDeleteWorker={onDeleteWorker}
          onAddWorker={onAddWorker}
        />
      )}

      {/* VIEW 3: TABEL GENERATOR VIEW */}
      {activeDocView === "tabel" && (
        <TabelGeneratorView
          activeFop={activeFop}
          rootFolder={rootFolder}
          onBackToOptions={() => setActiveDocView("menu")}
          onShowToast={onShowToast}
          onEditWorker={onEditWorker}
          onDeleteWorker={onDeleteWorker}
          onAddWorker={onAddWorker}
        />
      )}

      {/* VIEW 4: ZAYAVA PRIYOM GENERATOR VIEW */}
      {activeDocView === "zayava_priyom" && (
        <ZayavaPriyomGeneratorView
          activeFop={activeFop}
          rootFolder={rootFolder}
          initialType={initialZayavaType}
          onBackToOptions={() => setActiveDocView("menu")}
          onShowToast={onShowToast}
          onEditWorker={onEditWorker}
        />
      )}
    </div>
  );
};
