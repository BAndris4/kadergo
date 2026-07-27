import React, { useState, useRef, useEffect } from "react";
import {
  SparklesIcon,
  ChevronDownIcon,
  ClockIcon,
  ExclamationCircleIcon,
  FolderOpenIcon,
  ArrowTopRightOnSquareIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  TableCellsIcon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { FopData } from "../types/fop";
import { ensureFopDirectory, openFolderInExplorer } from "../services/fopService";
import { PayrollGeneratorView } from "../components/PayrollGeneratorView";

interface DocumentGeneratorViewProps {
  fops: FopData[];
  selectedFopId: number | null;
  onSelectFop: (id: number) => void;
  rootFolder: string;
  minWage: number;
  onShowToast: (msg: string) => void;
}

export const DocumentGeneratorView: React.FC<DocumentGeneratorViewProps> = ({
  fops,
  selectedFopId,
  onSelectFop,
  rootFolder,
  minWage,
  onShowToast,
}) => {
  const [activeDocView, setActiveDocView] = useState<"menu" | "payroll">("menu");

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
      onShowToast("⚠️ Спочатку оберіть головну папку збереження в Налаштуваннях!");
      return;
    }
    if (!activeFop) {
      onShowToast("⚠️ Спочатку оберіть активного ФОП зі списку!");
      return;
    }

    const targetDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
    if (targetDir) {
      await openFolderInExplorer(targetDir);
      onShowToast(`Відкрито папку у Провіднику: ${targetDir}`);
    }
  };

  const handleGenerateTemplateDoc = async (docTitle: string) => {
    if (!activeFop) {
      onShowToast("⚠️ Спочатку оберіть ФОП зі списку!");
      return;
    }
    if (!rootFolder) {
      onShowToast("⚠️ Спочатку встановіть головну папку збереження в Налаштуваннях!");
      return;
    }
    const targetDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
    onShowToast(`Сформовано шаблон "${docTitle}" у папці: ${targetDir || "FOP"}`);
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


  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* 1. Sleek Floating Top Control Bar with CUSTOM FOP DROPDOWN (Filtered >0 workers) */}
      <div className="bg-gradient-to-r from-white via-[#f8faf9] to-[#f4f9f8] rounded-[28px] p-4 px-7 border-2 border-[#cbd8d6] shadow-md flex flex-col md:flex-row items-center justify-between gap-5 relative z-50">
        <div className="flex items-center gap-3.5 w-full md:w-auto flex-1 max-w-3xl">
          <div className="w-11 h-11 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center shrink-0 shadow-md">
            <BuildingOffice2Icon className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-[#354f57]">
              Активний ФОП:
            </span>
          </div>

          {/* CUSTOM DROPDOWN CONTAINER */}
          <div className="relative flex-1 z-50" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="w-full h-12 px-4 rounded-2xl bg-white border-2 border-[#b9cecc] hover:border-[#133b47] text-[#133b47] text-sm font-black focus:outline-none transition-all flex items-center justify-between shadow-xs cursor-pointer"
            >
              {activeFop && activeFop.munkasok && activeFop.munkasok.length > 0 ? (
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-6 h-6 rounded-lg bg-[#133b47] text-[#f8a44c] text-xs font-black flex items-center justify-center shrink-0">
                    {activeFop.vezeteknev.charAt(0)}
                  </div>
                  <span className="truncate">{activeFopName}</span>
                  {activeFopCode && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-[#f8a44c] text-[#133b47] shrink-0">
                      {activeFopCode}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-[#556e75] bg-slate-100 px-2 py-0.5 rounded-md">
                    {activeFop.munkasok.length} прац.
                  </span>
                </div>
              ) : (
                <span className="text-[#556e75] font-extrabold">-- Оберіть ФОП з працівниками --</span>
              )}

              <ChevronDownIcon
                className={`w-4 h-4 text-[#133b47] shrink-0 transition-transform duration-200 stroke-[2.5] ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* CUSTOM DROPDOWN MENU POPUP */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-[#cbd8d6] shadow-2xl overflow-hidden z-[9999] animate-modalScale">
                {/* Search Bar inside Custom Dropdown */}
                <div className="p-3 border-b border-[#e2eceb] bg-[#f8faf9] flex items-center gap-2">
                  <MagnifyingGlassIcon className="w-4.5 h-4.5 text-[#556e75] shrink-0 stroke-[2.2]" />
                  <input
                    type="text"
                    placeholder="Пошук ФОП (показано тільки з працівниками)..."
                    value={fopSearchQuery}
                    onChange={(e) => setFopSearchQuery(e.target.value)}
                    className="w-full text-xs font-bold text-[#133b47] bg-transparent focus:outline-none"
                    autoFocus
                  />
                </div>

                {/* Options List */}
                <div className="max-h-64 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
                  {filteredFopsDropdown.length === 0 ? (
                    <div className="p-4 text-center text-xs font-bold text-[#556e75]">
                      ФОП з оформленими працівниками не знайдено.
                    </div>
                  ) : (
                    filteredFopsDropdown.map((f) => {
                      const name = [f.vezeteknev, f.keresztnev, f.apai_nev].filter(Boolean).join(" ");
                      const code = f.kod || f.fop_kod || "";
                      const isSelected = f.id === selectedFopId;

                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            onSelectFop(f.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? "bg-[#133b47] text-white"
                              : "hover:bg-[#f4f9f8] text-[#133b47]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isSelected ? "bg-[#f8a44c] text-[#133b47]" : "bg-[#133b47] text-[#f8a44c]"
                              }`}
                            >
                              {f.vezeteknev.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-black truncate">{name}</span>
                              <span
                                className={`text-[11px] font-extrabold truncate ${
                                  isSelected ? "text-[#c3d9d6]" : "text-[#556e75]"
                                }`}
                              >
                                Працівників: {f.munkasok.length} осіб
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {code && (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  isSelected
                                    ? "bg-[#f8a44c] text-[#133b47]"
                                    : "bg-[#e2eceb] text-[#133b47]"
                                }`}
                              >
                                {code}
                              </span>
                            )}
                            {isSelected && <CheckIcon className="w-4 h-4 text-[#f8a44c] stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleOpenExplorer}
          className="w-full md:w-auto px-6 py-3 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all shadow-lg shadow-[#133b47]/20 cursor-pointer flex items-center justify-center gap-2.5 shrink-0 border border-[#133b47] transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <FolderOpenIcon className="w-5 h-5 stroke-[2.2]" />
          <span>Відкрити у Провіднику</span>
          <ArrowTopRightOnSquareIcon className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {!isFopValidForPayroll && (
        <div className="p-4.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 text-xs font-black flex items-center justify-center gap-2 shadow-xs">
          <ExclamationCircleIcon className="w-5 h-5 text-amber-600 shrink-0 stroke-[2.5]" />
          <span>Будь ласка, оберіть активного ФОП з оформленими працівниками (&gt;0 осіб) для генерації відомості.</span>
        </div>
      )}

      {/* VIEW 1: MAIN SELECTION MENU (Action Cards Grid) */}
      {activeDocView === "menu" && (
        <div className="flex flex-col gap-8 animate-fadeIn">
          {/* Main Hero Header Card */}
          <div className="bg-gradient-to-br from-[#133b47] via-[#184856] to-[#0c2b35] rounded-[36px] p-8 text-white shadow-2xl shadow-[#133b47]/30 flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#f8a44c]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#f8a44c] text-[#133b47] flex items-center justify-center font-black shadow-lg">
                  <SparklesIcon className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="px-4 py-1.5 rounded-full text-xs font-black bg-white/10 backdrop-blur-md text-[#f8a44c] border border-white/15">
                  Кадровий електронний документообіг
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight leading-tight">
                Оберіть тип документа для формування
              </h1>
              <p className="text-sm font-extrabold text-[#c3d9d6] max-w-xl leading-relaxed">
                Натисніть на потрібний розділ для генерації розрахунково-платіжних відомостей, наказів або трудових договорів.
              </p>
            </div>
          </div>

          {/* Action Cards Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-7">
            {/* CARD 1: PAYROLL SHEET GENERATOR (DISABLED IF NO WORKERS OR NO FOP) */}
            <div
              onClick={() => isFopValidForPayroll && setActiveDocView("payroll")}
              className={`rounded-[32px] p-8 border-2 transition-all shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden group ${
                isFopValidForPayroll
                  ? "bg-gradient-to-br from-white to-[#f4f9f8] border-[#cbd8d6] hover:border-[#133b47] hover:shadow-2xl transform hover:-translate-y-1 cursor-pointer"
                  : "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center border-2 border-[#133b47] shadow-md">
                    <TableCellsIcon className="w-8 h-8 stroke-[2.2]" />
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#f8a44c] text-[#133b47] shadow-xs">
                    Основний інструмент ✓
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-black text-[#133b47] font-heading group-hover:text-[#0f3440] transition-colors">
                    Відомість заробітної плати (Excel)
                  </h3>
                  <p className="text-xs font-extrabold text-[#556e75] leading-relaxed">
                    Розрахунково-платіжна відомість заробітної плати працівників за обраний місяць або період.
                  </p>
                </div>
              </div>

              <button
                disabled={!isFopValidForPayroll}
                className={`w-full py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  isFopValidForPayroll
                    ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-lg shadow-[#133b47]/20 cursor-pointer"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                {isFopValidForPayroll ? "Відкрити розрахунок відомості →" : "⚠️ Оберіть ФОП з працівниками"}
              </button>
            </div>

            {/* CARD 2: WORD NAKAZI */}
            <div className="rounded-[32px] p-8 border-2 bg-white border-[#cbd8d6] hover:border-[#133b47] shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden group">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border-2 border-blue-200 shadow-sm">
                    <DocumentTextIcon className="w-8 h-8 stroke-[2.2]" />
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4 text-amber-700" />
                    В розробці
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-black text-[#133b47] font-heading">
                    Кадрові накази Word (.docx)
                  </h3>
                  <p className="text-xs font-extrabold text-[#556e75] leading-relaxed">
                    Накази про прийняття на роботу, звільнення, переведення та відпустки.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleGenerateTemplateDoc("Накази_Word")}
                disabled={!activeFop}
                className="w-full py-4 rounded-2xl font-black text-xs bg-slate-100 hover:bg-slate-200 text-[#133b47] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Згенерувати Наказ Word
              </button>
            </div>

            {/* CARD 3: CONTRACTS */}
            <div className="rounded-[32px] p-8 border-2 bg-white border-[#cbd8d6] hover:border-[#133b47] shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden group">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border-2 border-indigo-200 shadow-sm">
                    <DocumentTextIcon className="w-8 h-8 stroke-[2.2]" />
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4 text-amber-700" />
                    В розробці
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-black text-[#133b47] font-heading">
                    Трудові договори та угоди
                  </h3>
                  <p className="text-xs font-extrabold text-[#556e75] leading-relaxed">
                    Двосторонні трудові договори та цивільно-правові угоди з працівниками.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleGenerateTemplateDoc("Трудові_договори")}
                disabled={!activeFop}
                className="w-full py-4 rounded-2xl font-black text-xs bg-slate-100 hover:bg-slate-200 text-[#133b47] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Згенерувати Договір
              </button>
            </div>

            {/* CARD 4: BLANK / CUSTOM TEMPLATES */}
            <div className="rounded-[32px] p-8 border-2 border-dashed bg-gradient-to-br from-[#fefbf6] to-[#f8f5ee] border-[#f8a44c] shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden group">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-[#f8a44c]/20 text-[#133b47] flex items-center justify-center border-2 border-[#f8a44c]/40 shadow-sm">
                    <DocumentPlusIcon className="w-8 h-8 stroke-[2.2]" />
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#f8a44c] text-[#133b47]">
                    ➕ Власний бланк
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-black text-[#133b47] font-heading">
                    Порожній бланк / Власний шаблон
                  </h3>
                  <p className="text-xs font-extrabold text-[#7e6241] leading-relaxed">
                    Створення довільного кадрового документа з автоматичним імпортом шапки обраного ФОП.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleGenerateTemplateDoc("Порожній_бланк")}
                disabled={!activeFop}
                className="w-full py-4 rounded-2xl font-black text-xs bg-[#f8a44c] hover:bg-[#f59533] text-[#133b47] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Створити порожній бланк ➕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PAYROLL GENERATOR VIEW (Opened when user selects Payroll Card) */}
      {activeDocView === "payroll" && (
        <PayrollGeneratorView
          activeFop={activeFop}
          rootFolder={rootFolder}
          minWage={minWage}
          onBackToOptions={() => setActiveDocView("menu")}
          onShowToast={onShowToast}
        />
      )}


    </div>
  );
};
