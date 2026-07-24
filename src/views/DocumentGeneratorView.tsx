import React, { useState, useRef, useEffect } from "react";
import {
  SparklesIcon,
  ChevronDownIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
  FolderOpenIcon,
  ArrowTopRightOnSquareIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  TableCellsIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  UserIcon,
  CheckBadgeIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { FopData } from "../types/fop";
import { ensureFopDirectory, openFolderInExplorer } from "../services/fopService";

interface DocumentGeneratorViewProps {
  fops: FopData[];
  selectedFopId: number | null;
  onSelectFop: (id: number) => void;
  rootFolder: string;
  onShowToast: (msg: string) => void;
}

export const DocumentGeneratorView: React.FC<DocumentGeneratorViewProps> = ({
  fops,
  selectedFopId,
  onSelectFop,
  rootFolder,
  onShowToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<"all" | "word" | "excel" | "blank">("all");
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | "all">("all");

  // Custom FOP Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fopSearchQuery, setFopSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeFop = fops.find((f) => f.id === selectedFopId) || null;
  const activeFopName = activeFop
    ? [activeFop.vezeteknev, activeFop.keresztnev, activeFop.apai_nev].filter(Boolean).join(" ")
    : "";
  const activeFopCode = activeFop ? activeFop.kod || activeFop.fop_kod || "" : "";
  const activeWorkers = activeFop ? activeFop.munkasok : [];

  const isFopSelected = Boolean(activeFop);

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

  const handleGenerateDoc = async (docTitle: string, _fileType: "docx" | "xlsx" | "blank") => {
    if (!activeFop) {
      onShowToast("⚠️ Спочатку оберіть ФОП для створення кадрових документів!");
      return;
    }

    if (!rootFolder) {
      onShowToast("⚠️ Спочатку встановіть головну папку збереження в Налаштуваннях!");
      return;
    }

    const targetDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
    const workerContextStr = selectedWorkerId !== "all" ? " (для обраного працівника)" : "";
    onShowToast(`Сформовано шаблон "${docTitle}"${workerContextStr} у папці: ${targetDir || "кадрові документи"}`);
  };

  const filteredFopsDropdown = fops.filter((f) => {
    const name = [f.vezeteknev, f.keresztnev, f.apai_nev].filter(Boolean).join(" ").toLowerCase();
    const code = (f.kod || f.fop_kod || "").toLowerCase();
    const q = fopSearchQuery.toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  return (
    <div className="flex flex-col gap-9 animate-fadeIn">
      {/* 1. Sleek Floating Top Control Bar with CUSTOM FOP DROPDOWN */}
      <div className="bg-gradient-to-r from-white via-[#f8faf9] to-[#f4f9f8] rounded-[28px] p-4 px-7 border-2 border-[#cbd8d6] shadow-md flex flex-col md:flex-row items-center justify-between gap-5 relative z-30">
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
          <div className="relative flex-1" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="w-full h-12 px-4 rounded-2xl bg-white border-2 border-[#b9cecc] hover:border-[#133b47] text-[#133b47] text-sm font-black focus:outline-none transition-all flex items-center justify-between shadow-xs cursor-pointer"
            >
              {activeFop ? (
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
                </div>
              ) : (
                <span className="text-[#556e75] font-extrabold">-- Оберіть ФОП зі списку --</span>
              )}

              <ChevronDownIcon
                className={`w-4 h-4 text-[#133b47] shrink-0 transition-transform duration-200 stroke-[2.5] ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* CUSTOM DROPDOWN MENU POPUP */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-[#cbd8d6] shadow-2xl overflow-hidden z-50 animate-modalScale">
                {/* Search Bar inside Custom Dropdown */}
                <div className="p-3 border-b border-[#e2eceb] bg-[#f8faf9] flex items-center gap-2">
                  <MagnifyingGlassIcon className="w-4.5 h-4.5 text-[#556e75] shrink-0 stroke-[2.2]" />
                  <input
                    type="text"
                    placeholder="Пошук ФОП за прізвищем або кодом..."
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
                      ФОП за даним запитом не знайдено.
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
                            setSelectedWorkerId("all");
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

      {!isFopSelected && (
        <div className="p-4.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 text-xs font-black flex items-center justify-center gap-2 shadow-xs">
          <ExclamationCircleIcon className="w-5 h-5 text-amber-600 shrink-0 stroke-[2.5]" />
          <span>Будь ласка, оберіть активного ФОП у верхньому меню для активації генерації кадрових документів.</span>
        </div>
      )}

      {/* 2. Bento-Grid Hero Section (Asymmetric Alignment with Workers Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Hero Card (Spans 7 Columns) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-[#133b47] via-[#184856] to-[#0c2b35] rounded-[36px] p-8 text-white shadow-2xl shadow-[#133b47]/30 flex flex-col justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#f8a44c]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#f8a44c] text-[#133b47] flex items-center justify-center font-black shadow-lg">
                  <SparklesIcon className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="px-4 py-1.5 rounded-full text-xs font-black bg-white/10 backdrop-blur-md text-[#f8a44c] border border-white/15">
                  Кадровий електронний документообіг
                </span>
              </div>

              {activeFop && (
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <CheckBadgeIcon className="w-4 h-4 text-emerald-400" />
                  Готовий до генерації
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight leading-tight">
              Центр генерації кадрових документів
            </h1>
            <p className="text-sm font-extrabold text-[#c3d9d6] max-w-xl leading-relaxed">
              Автоматичний випуск наказів, табелів, трудових договорів та довільних бланкових документів Word та Excel.
            </p>
          </div>

          {/* Interactive Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2.5 relative z-10 pt-4 border-t border-white/15">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeCategory === "all"
                  ? "bg-[#f8a44c] text-[#133b47] shadow-md"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              Усі шаблони
            </button>

            <button
              onClick={() => setActiveCategory("word")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === "word"
                  ? "bg-[#f8a44c] text-[#133b47] shadow-md"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <DocumentTextIcon className="w-4 h-4" />
              Word (.docx)
            </button>

            <button
              onClick={() => setActiveCategory("excel")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === "excel"
                  ? "bg-[#f8a44c] text-[#133b47] shadow-md"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <TableCellsIcon className="w-4 h-4" />
              Excel (.xlsx)
            </button>

            <button
              onClick={() => setActiveCategory("blank")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === "blank"
                  ? "bg-[#f8a44c] text-[#133b47] shadow-md"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <DocumentPlusIcon className="w-4 h-4" />
              ➕ Порожні бланки
            </button>
          </div>
        </div>

        {/* Right Hero Card: Active Workers Overview Panel (Spans 5 Columns) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-white to-[#fdf8f3] rounded-[36px] p-7 border-2 border-[#f4dec8] shadow-xl shadow-[#f8a44c]/10 flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#354f57] flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-[#133b47] stroke-[2.2]" />
                Працівники ФОП ({activeWorkers.length})
              </span>

              {activeWorkers.length > 0 && (
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {activeWorkers.length} осіб оформлено
                </span>
              )}
            </div>

            {/* Workers List Preview */}
            <div className="flex flex-col gap-2.5 max-h-[175px] overflow-y-auto pr-1 custom-scrollbar">
              {!isFopSelected ? (
                <div className="p-4 text-center text-xs font-extrabold text-[#7e6241] bg-amber-50/60 rounded-2xl border border-amber-200">
                  Оберіть ФОП, щоб побачити список його працівників.
                </div>
              ) : activeWorkers.length === 0 ? (
                <div className="p-4 text-center text-xs font-extrabold text-[#556e75] bg-white rounded-2xl border border-[#cbd8d6]">
                  Працівників у цього ФОП ще не додано.
                </div>
              ) : (
                activeWorkers.map((w) => {
                  const wName = [w.vezeteknev, w.keresztnev, w.apai_nev].filter(Boolean).join(" ");
                  const isSelected = selectedWorkerId === w.id;
                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWorkerId(isSelected ? "all" : w.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-[#133b47] text-white border-[#133b47] shadow-sm"
                          : "bg-white text-[#133b47] border-[#cbd8d6] hover:border-[#133b47]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                            isSelected ? "bg-[#f8a44c] text-[#133b47]" : "bg-[#133b47]/10 text-[#133b47]"
                          }`}
                        >
                          <UserIcon className="w-4.5 h-4.5 stroke-[2.2]" />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black truncate">{wName}</span>
                          <span
                            className={`text-[11px] font-extrabold flex items-center gap-1 truncate ${
                              isSelected ? "text-[#c3d9d6]" : "text-[#556e75]"
                            }`}
                          >
                            <BriefcaseIcon className="w-3.5 h-3.5 shrink-0" />
                            {w.foglalkozas_megnevezes}
                          </span>
                        </div>
                      </div>

                      {w.kod && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                            isSelected
                              ? "bg-[#f8a44c] text-[#133b47]"
                              : "bg-[#e2eceb] text-[#133b47]"
                          }`}
                        >
                          {w.kod}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#cbd8d6] flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#556e75]">Цільовий працівник:</span>
            <span className="font-black text-[#133b47]">
              {selectedWorkerId === "all"
                ? "Усі працівники"
                : activeWorkers.find((w) => w.id === selectedWorkerId)?.vezeteknev || "Обрано"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Document Templates Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {/* Card 1: Word Накази */}
        {(activeCategory === "all" || activeCategory === "word") && (
          <div
            className={`rounded-[32px] p-7 border-2 transition-all shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden group ${
              isFopSelected ? "bg-white border-[#cbd8d6] hover:border-[#133b47] hover:shadow-2xl" : "bg-slate-50 border-slate-200 opacity-70"
            }`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border-2 border-blue-200 shadow-sm">
                  <DocumentTextIcon className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-amber-700" />
                  В розробці
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-black text-[#133b47] font-heading group-hover:text-[#0f3440] transition-colors">
                  Кадрові накази Word (.docx)
                </h3>
                <p className="text-xs font-extrabold text-[#556e75] leading-relaxed">
                  Накази про прийняття на роботу, звільнення, переведення та відпустки з автоімпортом реквізитів.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleGenerateDoc("Накази_Word", "docx")}
              disabled={!isFopSelected}
              className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                isFopSelected
                  ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-lg shadow-[#133b47]/20 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isFopSelected ? "Згенерувати Наказ ✓" : "⚠️ Спочатку оберіть ФОП"}
            </button>
          </div>
        )}

        {/* Card 2: Excel Табелі */}
        {(activeCategory === "all" || activeCategory === "excel") && (
          <div
            className={`rounded-[32px] p-7 border-2 transition-all shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden group ${
              isFopSelected ? "bg-white border-[#cbd8d6] hover:border-[#133b47] hover:shadow-2xl" : "bg-slate-50 border-slate-200 opacity-70"
            }`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border-2 border-emerald-200 shadow-sm">
                  <TableCellsIcon className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-amber-700" />
                  В розробці
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-black text-[#133b47] font-heading group-hover:text-[#0f3440] transition-colors">
                  Табелі та відомості Excel (.xlsx)
                </h3>
                <p className="text-xs font-extrabold text-[#556e75] leading-relaxed">
                  Розрахунково-платіжні відомості заробітної плати та табелі обліку робочого часу.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleGenerateDoc("Відомості_Excel", "xlsx")}
              disabled={!isFopSelected}
              className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                isFopSelected
                  ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-lg shadow-[#133b47]/20 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isFopSelected ? "Згенерувати Табель Excel ✓" : "⚠️ Спочатку оберіть ФОП"}
            </button>
          </div>
        )}

        {/* Card 3: Договори */}
        {(activeCategory === "all" || activeCategory === "word") && (
          <div
            className={`rounded-[32px] p-7 border-2 transition-all shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden group ${
              isFopSelected ? "bg-white border-[#cbd8d6] hover:border-[#133b47] hover:shadow-2xl" : "bg-slate-50 border-slate-200 opacity-70"
            }`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border-2 border-indigo-200 shadow-sm">
                  <DocumentTextIcon className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-amber-700" />
                  В розробці
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-black text-[#133b47] font-heading group-hover:text-[#0f3440] transition-colors">
                  Трудові договори та угоди
                </h3>
                <p className="text-xs font-extrabold text-[#556e75] leading-relaxed">
                  Двосторонні трудові договори та цивільно-правові угоди з працівниками.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleGenerateDoc("Трудові_договори", "docx")}
              disabled={!isFopSelected}
              className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                isFopSelected
                  ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] shadow-lg shadow-[#133b47]/20 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isFopSelected ? "Згенерувати Договір ✓" : "⚠️ Спочатку оберіть ФОП"}
            </button>
          </div>
        )}

        {/* Card 4: BLANK / CUSTOM TEMPLATE GENERATOR (Порожній бланк / Власний шаблон) */}
        {(activeCategory === "all" || activeCategory === "blank") && (
          <div
            className={`rounded-[32px] p-7 border-2 border-dashed transition-all shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden group ${
              isFopSelected
                ? "bg-gradient-to-br from-[#fefbf6] to-[#f8f5ee] border-[#f8a44c] hover:border-[#133b47] hover:shadow-2xl"
                : "bg-slate-50 border-slate-300 opacity-70"
            }`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-[#f8a44c]/20 text-[#133b47] flex items-center justify-center border-2 border-[#f8a44c]/40 shadow-sm">
                  <DocumentPlusIcon className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#f8a44c] text-[#133b47] shadow-xs">
                  ➕ Власний бланк
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-black text-[#133b47] font-heading group-hover:text-[#0f3440] transition-colors">
                  Порожній бланк / Власний шаблон
                </h3>
                <p className="text-xs font-extrabold text-[#7e6241] leading-relaxed">
                  Створення довільного кадрового документа з автоматичним імпортом шапки та реквізитів обраного ФОП.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleGenerateDoc("Порожній_бланк_документа", "blank")}
              disabled={!isFopSelected}
              className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                isFopSelected
                  ? "bg-[#f8a44c] hover:bg-[#f59533] text-[#133b47] shadow-lg shadow-[#f8a44c]/30 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isFopSelected ? "Створити порожній бланк ➕" : "⚠️ Спочатку оберіть ФОП"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
