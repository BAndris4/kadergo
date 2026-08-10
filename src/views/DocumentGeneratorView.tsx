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
  UserPlusIcon,
  UserMinusIcon,
  SunIcon,
  BanknotesIcon,
  XMarkIcon,
  UserGroupIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { FopData, Munkas } from "../types/fop";
import { ensureFopDirectory, openFolderInExplorer } from "../services/fopService";
import { PayrollGeneratorView } from "../components/PayrollGeneratorView";
import { TabelGeneratorView } from "../components/TabelGeneratorView";
import { ZayavaPriyomGeneratorView, ZayavaTypeCategory } from "../components/ZayavaPriyomGeneratorView";
import { ShtatGeneratorView } from "../components/ShtatGeneratorView";
import { GrafikGeneratorView } from "../components/GrafikGeneratorView";

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
  const [activeDocView, setActiveDocView] = useState<"menu" | "payroll" | "tabel" | "zayava_priyom" | "shtat" | "grafik">("menu");
  const [initialZayavaType, setInitialZayavaType] = useState<ZayavaTypeCategory>("priyom");

  // Search & Filter State
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [activeFilterCategory, setActiveFilterCategory] = useState<"all" | "zvit" | "hr">("all");

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

  // Filter helper for document cards search
  const q = docSearchQuery.trim().toLowerCase();

  const matchesDoc = (title: string, desc: string, keywords: string[] = []) => {
    if (!q) return true;
    if (title.toLowerCase().includes(q)) return true;
    if (desc.toLowerCase().includes(q)) return true;
    return keywords.some((kw) => kw.toLowerCase().includes(q));
  };

  // Category 1 Docs (Payroll & Accounting)
  const showPayrollDoc = (activeFilterCategory === "all" || activeFilterCategory === "zvit") && matchesDoc("Розрахунково-платіжна відомість", "Розрахунок заробітної плати працівників за обраний місяць або період", ["відомість", "зарплата", "нарахування", "пайрол"]);
  const showTabelDoc = (activeFilterCategory === "all" || activeFilterCategory === "zvit") && matchesDoc("Табель обліку робочого часу", "Облік відпрацьованих годин, днів та неявок працівників", ["табель", "години", "облік", "дні", "неявки"]);
  const hasCategory1Matches = showPayrollDoc || showTabelDoc;

  // Category 2 Docs (Human Resources / Personnel Documents)
  const showShtatDoc = (activeFilterCategory === "all" || activeFilterCategory === "hr") && matchesDoc("Штатний розпис", "Формування та затвердження кількості штатних одиниць та місячного фонду зарплати", ["штат", "розпис", "посади", "оклади", "штатний"]);
  const showGrafikDoc = (activeFilterCategory === "all" || activeFilterCategory === "hr") && matchesDoc("Графік відпусток", "Розрахунок та затвердження графіку чергових відпусток працівників", ["графік", "відпусток", "графік відпусток", "відпустки", "розклад"]);
  const showPriyomDoc = (activeFilterCategory === "all" || activeFilterCategory === "hr") && matchesDoc("Заява про прийняття на роботу", "Оформлення заяви про прийняття працівника на роботу", ["прийом", "заява", "прийняття", "робота"]);
  const showZvilnennyaDoc = (activeFilterCategory === "all" || activeFilterCategory === "hr") && matchesDoc("Заява про звільнення", "Оформлення заяви про звільнення працівника за згодою сторін", ["звільнення", "заява", "згода сторін"]);
  const showVidpustkaDoc = (activeFilterCategory === "all" || activeFilterCategory === "hr") && matchesDoc("Заява про відпустку", "Оформлення заяви про надання щорічної відпустки", ["відпустка", "заява", "щорічна"]);
  const showBezKopijokDoc = (activeFilterCategory === "all" || activeFilterCategory === "hr") && matchesDoc("Заява про виплату без копійок", "Оформлення заяви про виплату заробітної плати без копійок", ["копійки", "виплата", "заява", "округлення"]);
  const hasCategory2Matches = showShtatDoc || showGrafikDoc || showPriyomDoc || showZvilnennyaDoc || showVidpustkaDoc || showBezKopijokDoc;

  const totalMatches = (hasCategory1Matches ? (showPayrollDoc ? 1 : 0) + (showTabelDoc ? 1 : 0) : 0) +
                       (hasCategory2Matches ? (showShtatDoc ? 1 : 0) + (showGrafikDoc ? 1 : 0) + (showPriyomDoc ? 1 : 0) + (showZvilnennyaDoc ? 1 : 0) + (showVidpustkaDoc ? 1 : 0) + (showBezKopijokDoc ? 1 : 0) : 0);

  return (
    <div className="flex flex-col gap-8 animate-fadeIn pb-12 w-full font-sans">
      {/* 1. TOP ACTIVE FOP CONTROL BAR WITH GLASSMORPHISM AND GRADIENT */}
      <div className="bg-gradient-to-r from-white via-[#f8faf9] to-[#f0f7f6] rounded-[28px] p-5 px-8 border-2 border-[#cbd8d6] shadow-md flex flex-col md:flex-row items-center justify-between gap-6 relative z-20 transition-all duration-300">
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

      {/* MAIN DOCUMENT DASHBOARD MENU */}
      {activeDocView === "menu" && (
        <div className="flex flex-col gap-8">
          {/* SEARCH & QUICK CATEGORY FILTER BAR */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search Input Box */}
            <div className="bg-white rounded-[24px] p-3 px-5 border-2 border-[#cbd8d6] shadow-sm flex items-center justify-between gap-3 flex-1 w-full transition-all focus-within:border-[#133b47] focus-within:shadow-md">
              <div className="flex items-center gap-3 flex-1">
                <MagnifyingGlassIcon className="w-5 h-5 text-[#133b47] shrink-0 stroke-[2.2]" />
                <input
                  type="text"
                  placeholder="Швидкий пошук документа (Табель, Штат, Заява, Відомість)..."
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  className="w-full text-sm font-semibold text-[#133b47] placeholder:text-[#556e75]/70 bg-transparent focus:outline-none"
                />
              </div>
              {docSearchQuery && (
                <button
                  onClick={() => setDocSearchQuery("")}
                  className="p-1 rounded-lg text-[#556e75] hover:text-[#133b47] hover:bg-[#f4f9f8] transition-all cursor-pointer"
                  title="Очистити пошук"
                >
                  <XMarkIcon className="w-5 h-5 stroke-[2]" />
                </button>
              )}
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto shrink-0 pb-1 sm:pb-0">
              <button
                onClick={() => setActiveFilterCategory("all")}
                className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs ${
                  activeFilterCategory === "all"
                    ? "bg-[#133b47] text-[#f8a44c] border border-[#133b47] shadow-sm"
                    : "bg-white text-[#556e75] hover:text-[#133b47] border border-[#cbd8d6] hover:bg-[#f8faf9]"
                }`}
              >
                <SparklesIcon className="w-4 h-4 stroke-[2]" />
                <span>Всі документи</span>
              </button>

              <button
                onClick={() => setActiveFilterCategory("zvit")}
                className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs ${
                  activeFilterCategory === "zvit"
                    ? "bg-[#133b47] text-[#f8a44c] border border-[#133b47] shadow-sm"
                    : "bg-white text-[#556e75] hover:text-[#133b47] border border-[#cbd8d6] hover:bg-[#f8faf9]"
                }`}
              >
                <TableCellsIcon className="w-4 h-4 stroke-[2]" />
                <span>Звітність</span>
              </button>

              <button
                onClick={() => setActiveFilterCategory("hr")}
                className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs ${
                  activeFilterCategory === "hr"
                    ? "bg-[#133b47] text-[#f8a44c] border border-[#133b47] shadow-sm"
                    : "bg-white text-[#556e75] hover:text-[#133b47] border border-[#cbd8d6] hover:bg-[#f8faf9]"
                }`}
              >
                <UserGroupIcon className="w-4 h-4 stroke-[2]" />
                <span>Кадрові документи</span>
              </button>
            </div>
          </div>

          {/* NO SEARCH RESULTS STATE */}
          {docSearchQuery && totalMatches === 0 && (
            <div className="bg-white rounded-[32px] p-12 text-center border-2 border-[#cbd8d6] shadow-sm flex flex-col items-center justify-center gap-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-[#f4f9f8] text-[#556e75] flex items-center justify-center border border-[#cbd8d6]">
                <MagnifyingGlassIcon className="w-8 h-8 stroke-[2]" />
              </div>
              <div className="flex flex-col gap-1 max-w-md">
                <h4 className="text-lg font-bold text-[#133b47]">Документів не знайдено</h4>
                <p className="text-xs text-[#556e75]">
                  За запитом <span className="font-bold text-[#133b47]">"{docSearchQuery}"</span> жодного документа не знайдено. Спробуйте змінити пошукове слово.
                </p>
              </div>
              <button
                onClick={() => {
                  setDocSearchQuery("");
                  setActiveFilterCategory("all");
                }}
                className="px-5 py-2.5 rounded-xl bg-[#133b47] text-[#f8a44c] text-xs font-bold hover:bg-[#0f2e38] transition-all cursor-pointer mt-2"
              >
                Показати всі документи
              </button>
            </div>
          )}

          {/* CATEGORY 1: ПОДАТКОВІ ТА ОБЛІКОВІ ВІДОМОСТІ */}
          {hasCategory1Matches && (
            <div className="flex flex-col gap-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#cbd8d6] pb-3 px-1">
                <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-[#354f57]">
                  <div className="w-7 h-7 rounded-lg bg-[#133b47] text-[#f8a44c] flex items-center justify-center font-bold">
                    <TableCellsIcon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  Податкові та облікові відомості
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#133b47]/10 text-[#133b47]">
                  2 документи
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                {/* CARD 1: PAYROLL VEDOMOST */}
                {showPayrollDoc && (
                  <div
                    onClick={() => isFopValidForPayroll && setActiveDocView("payroll")}
                    className={`rounded-[32px] p-8 border-2 transition-all duration-300 shadow-md hover:shadow-2xl flex flex-col justify-between gap-6 relative overflow-hidden group ${
                      isFopValidForPayroll
                        ? "bg-gradient-to-br from-white via-[#fafdfc] to-[#f2f8f7] border-[#cbd8d6] hover:border-[#133b47] hover:scale-[1.015] cursor-pointer"
                        : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <div className="w-16 h-16 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-md group-hover:scale-110 transition-all duration-300">
                          <TableCellsIcon className="w-8 h-8 stroke-[2.2]" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-indigo-500/15 text-indigo-900 border border-indigo-300/80">
                          Відомість
                        </span>
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
                          ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-md cursor-pointer group-hover:brightness-110"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {isFopValidForPayroll ? "Відкрити розрахунок →" : "Оберіть ФОП з працівниками"}
                    </button>
                  </div>
                )}

                {/* CARD 2: TABEL (TIMESHEET) */}
                {showTabelDoc && (
                  <div
                    onClick={() => isFopValidForPayroll && setActiveDocView("tabel")}
                    className={`rounded-[32px] p-8 border-2 transition-all duration-300 shadow-md hover:shadow-2xl flex flex-col justify-between gap-6 relative overflow-hidden group ${
                      isFopValidForPayroll
                        ? "bg-gradient-to-br from-white via-[#fafdfc] to-[#f2f8f7] border-[#cbd8d6] hover:border-[#133b47] hover:scale-[1.015] cursor-pointer"
                        : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <div className="w-16 h-16 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-md group-hover:scale-110 transition-all duration-300">
                          <CalendarDaysIcon className="w-8 h-8 stroke-[2.2]" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-amber-500/15 text-amber-900 border border-amber-300/80">
                          Табель
                        </span>
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
                          ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-md cursor-pointer group-hover:brightness-110"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {isFopValidForPayroll ? "Відкрити табель обліку →" : "Оберіть ФОП з працівниками"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 2: КАДРОВІ ДОКУМЕНТИ */}
          {hasCategory2Matches && (
            <div className="flex flex-col gap-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#cbd8d6] pb-3 px-1">
                <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-[#354f57]">
                  <div className="w-7 h-7 rounded-lg bg-[#133b47] text-[#f8a44c] flex items-center justify-center font-bold">
                    <UserGroupIcon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  Кадрові документи
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#133b47]/10 text-[#133b47]">
                  6 документів
                </span>
              </div>

              {/* GRID OF HR DOCUMENTS WITH UNIFIED SIGNATURE DARK TEAL ICON BOXES + SUBTLE DOT INDICATORS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. SHTAT (ШТАТНИЙ РОЗПИС) */}
                {showShtatDoc && (
                  <div
                    onClick={() => isFopValidForPayroll && setActiveDocView("shtat")}
                    className={`rounded-[28px] p-6 border-2 transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden group ${
                      isFopValidForPayroll
                        ? "bg-gradient-to-br from-white via-[#fafdfc] to-[#f2f8f7] border-[#cbd8d6] hover:border-[#133b47] hover:scale-[1.015] cursor-pointer"
                        : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-sm group-hover:scale-110 transition-all duration-300">
                          <BuildingOffice2Icon className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-sky-500/15 text-sky-900 border border-sky-300/80">
                          Штат
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <h4 className="text-lg font-bold text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors leading-snug">
                          Штатний розпис
                        </h4>
                        <p className="text-xs font-medium text-[#556e75] leading-relaxed">
                          Затвердження кількості штатних одиниць та місячного фонду зарплати.
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={!isFopValidForPayroll}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        isFopValidForPayroll
                          ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-sm cursor-pointer group-hover:brightness-110"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span>Створити Штатний розпис →</span>
                    </button>
                  </div>
                )}

                {/* 2. GRAFIK VIDPUSTOK (ГРАФІК ВІДПУСТОК) */}
                {showGrafikDoc && (
                  <div
                    onClick={() => isFopValidForPayroll && setActiveDocView("grafik")}
                    className={`rounded-[28px] p-6 border-2 transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden group ${
                      isFopValidForPayroll
                        ? "bg-gradient-to-br from-white via-[#fafdfc] to-[#f2f8f7] border-[#cbd8d6] hover:border-[#133b47] hover:scale-[1.015] cursor-pointer"
                        : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-sm group-hover:scale-110 transition-all duration-300">
                          <CalendarDaysIcon className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-[#f8a44c]/20 text-[#133b47] border border-[#f8a44c]/40">
                          Графік
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <h4 className="text-lg font-bold text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors leading-snug">
                          Графік відпусток
                        </h4>
                        <p className="text-xs font-medium text-[#556e75] leading-relaxed">
                          Формування та затвердження графіку чергових відпусток працівників.
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={!isFopValidForPayroll}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        isFopValidForPayroll
                          ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-sm cursor-pointer group-hover:brightness-110"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span>Створити Графік →</span>
                    </button>
                  </div>
                )}

                {/* 2. ZAYAVA: PRIYOM */}
                {showPriyomDoc && (
                  <div
                    onClick={() => handleOpenZayava("priyom")}
                    className={`rounded-[28px] p-6 border-2 transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden group ${
                      isFopValidForPayroll
                        ? "bg-gradient-to-br from-white via-[#fafdfc] to-[#f2f8f7] border-[#cbd8d6] hover:border-[#133b47] hover:scale-[1.015] cursor-pointer"
                        : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-sm group-hover:scale-110 transition-all duration-300">
                          <UserPlusIcon className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        {/* UNIFIED MINT ZAYAVA BADGE WITH SUBTLE EMERALD DOT */}
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs"></span>
                          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-emerald-500/15 text-emerald-900 border border-emerald-300/80">
                            Заява
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <h4 className="text-lg font-bold text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors leading-snug">
                          Заява на прийом
                        </h4>
                        <p className="text-xs font-medium text-[#556e75] leading-relaxed">
                          Оформлення заяви про прийняття працівника на роботу.
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={!isFopValidForPayroll}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        isFopValidForPayroll
                          ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-sm cursor-pointer group-hover:brightness-110"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span>Оформити →</span>
                    </button>
                  </div>
                )}

                {/* 3. ZAYAVA: ZVILNENNYA */}
                {showZvilnennyaDoc && (
                  <div
                    onClick={() => handleOpenZayava("zvilnennya")}
                    className={`rounded-[28px] p-6 border-2 transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden group ${
                      isFopValidForPayroll
                        ? "bg-gradient-to-br from-white via-[#fafdfc] to-[#f2f8f7] border-[#cbd8d6] hover:border-[#133b47] hover:scale-[1.015] cursor-pointer"
                        : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-sm group-hover:scale-110 transition-all duration-300">
                          <UserMinusIcon className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        {/* UNIFIED MINT ZAYAVA BADGE WITH SUBTLE ROSE DOT */}
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs"></span>
                          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-emerald-500/15 text-emerald-900 border border-emerald-300/80">
                            Заява
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <h4 className="text-lg font-bold text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors leading-snug">
                          Заява на звільнення
                        </h4>
                        <p className="text-xs font-medium text-[#556e75] leading-relaxed">
                          Оформлення заяви про звільнення працівника за згодою сторін.
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={!isFopValidForPayroll}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        isFopValidForPayroll
                          ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-sm cursor-pointer group-hover:brightness-110"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span>Оформити →</span>
                    </button>
                  </div>
                )}

                {/* 4. ZAYAVA: VIDPUSTKA */}
                {showVidpustkaDoc && (
                  <div
                    onClick={() => handleOpenZayava("vidpustka")}
                    className={`rounded-[28px] p-6 border-2 transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden group ${
                      isFopValidForPayroll
                        ? "bg-gradient-to-br from-white via-[#fafdfc] to-[#f2f8f7] border-[#cbd8d6] hover:border-[#133b47] hover:scale-[1.015] cursor-pointer"
                        : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-sm group-hover:scale-110 transition-all duration-300">
                          <SunIcon className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        {/* UNIFIED MINT ZAYAVA BADGE WITH SUBTLE AMBER DOT */}
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs"></span>
                          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-emerald-500/15 text-emerald-900 border border-emerald-300/80">
                            Заява
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <h4 className="text-lg font-bold text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors leading-snug">
                          Заява на відпустку
                        </h4>
                        <p className="text-xs font-medium text-[#556e75] leading-relaxed">
                          Оформлення заяви про надання щорічної відпустки.
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={!isFopValidForPayroll}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        isFopValidForPayroll
                          ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-sm cursor-pointer group-hover:brightness-110"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span>Оформити →</span>
                    </button>
                  </div>
                )}

                {/* 5. ZAYAVA: BEZ KOPIJOK */}
                {showBezKopijokDoc && (
                  <div
                    onClick={() => handleOpenZayava("bez_kopijok")}
                    className={`rounded-[28px] p-6 border-2 transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden group ${
                      isFopValidForPayroll
                        ? "bg-gradient-to-br from-white via-[#fafdfc] to-[#f2f8f7] border-[#cbd8d6] hover:border-[#133b47] hover:scale-[1.015] cursor-pointer"
                        : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-sm group-hover:scale-110 transition-all duration-300">
                          <BanknotesIcon className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        {/* UNIFIED MINT ZAYAVA BADGE WITH SUBTLE INDIGO DOT */}
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-xs"></span>
                          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-emerald-500/15 text-emerald-900 border border-emerald-300/80">
                            Заява
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <h4 className="text-lg font-bold text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors leading-snug">
                          Без копійок
                        </h4>
                        <p className="text-xs font-medium text-[#556e75] leading-relaxed">
                          Оформлення заяви про виплату зарплати без копійок.
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={!isFopValidForPayroll}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        isFopValidForPayroll
                          ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-sm cursor-pointer group-hover:brightness-110"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span>Оформити →</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
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

      {/* VIEW 5: SHTAT GENERATOR VIEW */}
      {activeDocView === "shtat" && (
        <ShtatGeneratorView
          fops={fops}
          selectedFopId={selectedFopId}
          rootFolder={rootFolder}
          minWage={minWage}
          onShowToast={onShowToast}
          onBack={() => setActiveDocView("menu")}
        />
      )}

      {/* VIEW 6: GRAFIK GENERATOR VIEW */}
      {activeDocView === "grafik" && (
        <GrafikGeneratorView
          fops={fops}
          selectedFopId={selectedFopId}
          rootFolder={rootFolder}
          onShowToast={onShowToast}
          onBack={() => setActiveDocView("menu")}
          onEditWorker={onEditWorker}
          onDeleteWorker={onDeleteWorker}
          onAddWorker={onAddWorker}
        />
      )}
    </div>
  );
};
