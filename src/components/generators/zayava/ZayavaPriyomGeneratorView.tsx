import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  FolderOpenIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  BriefcaseIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { FopData, Munkas, GenerateZayavaPriyomDocxRequest } from "../../../types/fop";
import { generateZayavaPriyomDocx, ensureFopDirectory, openFolderInExplorer } from "../../../services/fopService";
import { getWorkerGenitiveName, formatUkrainianDate } from "../../../utils/ukrainianDeclension";
import { CustomDatePicker } from "../../pickers/CustomDatePicker";

interface ZayavaPriyomGeneratorViewProps {
  activeFop: FopData | null;
  rootFolder: string;
  onBackToOptions: () => void;
  onShowToast: (msg: string) => void;
  onEditWorker?: (worker: Munkas) => void;
  initialType?: ZayavaTypeCategory;
}

export type ZayavaTypeCategory = "priyom" | "zvilnennya" | "vidpustka" | "bez_kopijok" | "perevedennya";

const UKR_MONTH_LOWERCASE = [
  "січень",
  "лютий",
  "березень",
  "квітень",
  "травень",
  "червень",
  "липень",
  "серпень",
  "вересень",
  "жовтень",
  "листопад",
  "грудень",
];

const getWorkerStartMonthYearString = (isoDateStr: string) => {
  if (!isoDateStr || !isoDateStr.includes("-")) return "липень 2026";
  const parts = isoDateStr.split("-").map((p) => parseInt(p, 10));
  const year = parts[0] || 2026;
  const monthIdx = (parts[1] || 7) - 1;
  const monthName = UKR_MONTH_LOWERCASE[monthIdx] || "липень";
  return `${monthName} ${year}`;
};

export const ZayavaPriyomGeneratorView: React.FC<ZayavaPriyomGeneratorViewProps> = ({
  activeFop,
  rootFolder,
  onBackToOptions,
  onShowToast,
  onEditWorker,
  initialType = "priyom",
}) => {
  const munkasok = activeFop?.munkasok || [];

  // Zayava Type Category Selection (Defaults to "priyom" or initialType)
  const [selectedZayavaType, setSelectedZayavaType] = useState<ZayavaTypeCategory>(initialType);
  const [isZayavaTypeDropdownOpen, setIsZayavaTypeDropdownOpen] = useState(false);
  const zayavaTypeRef = useRef<HTMLDivElement>(null);

  // Custom Worker Dropdown State
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(
    munkasok.length > 0 ? munkasok[0].id : null
  );
  const [isWorkerDropdownOpen, setIsWorkerDropdownOpen] = useState(false);
  const [workerSearchQuery, setWorkerSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Date Overrides & Leave Fields State
  const [overrideStartDate, setOverrideStartDate] = useState<string>("");
  const [overrideDismissalDate, setOverrideDismissalDate] = useState<string>("");
  const [overrideLeaveStartDate, setOverrideLeaveStartDate] = useState<string>("");
  const [leaveDays, setLeaveDays] = useState<number>(3);
  const [overrideRequestDate, setOverrideRequestDate] = useState<string>("");

  // Sync state if initialType prop changes
  useEffect(() => {
    setSelectedZayavaType(initialType);
  }, [initialType]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWorkerDropdownOpen(false);
      }
      if (zayavaTypeRef.current && !zayavaTypeRef.current.contains(event.target as Node)) {
        setIsZayavaTypeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync selected worker if list changes & reset overrides
  useEffect(() => {
    if (munkasok.length > 0 && (!selectedWorkerId || !munkasok.some((m) => m.id === selectedWorkerId))) {
      setSelectedWorkerId(munkasok[0].id);
    }
    setOverrideStartDate("");
    setOverrideDismissalDate("");
    setOverrideLeaveStartDate("");
    setOverrideRequestDate("");
  }, [munkasok, selectedWorkerId]);

  const selectedWorker = useMemo(
    () => munkasok.find((m) => m.id === selectedWorkerId) || null,
    [munkasok, selectedWorkerId]
  );

  // Filtered workers list for dropdown
  const filteredMunkasok = useMemo(() => {
    const q = workerSearchQuery.toLowerCase().trim();
    if (!q) return munkasok;
    return munkasok.filter((m) => {
      const full = [m.vezeteknev, m.keresztnev, m.apai_nev].filter(Boolean).join(" ").toLowerCase();
      const code = (m.kod || m.tabel_nomer || "").toLowerCase();
      const pos = (m.foglalkozas_megnevezes || "").toLowerCase();
      return full.includes(q) || code.includes(q) || pos.includes(q);
    });
  }, [munkasok, workerSearchQuery]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [customBodyText, setCustomBodyText] = useState("");

  // Reset custom body text override when selected worker or Zayava type changes
  useEffect(() => {
    setCustomBodyText("");
  }, [selectedWorkerId, selectedZayavaType]);

  // Derived FOP full name
  const fopName = useMemo(() => {
    if (!activeFop) return "";
    return [activeFop.vezeteknev, activeFop.keresztnev, activeFop.apai_nev].filter(Boolean).join(" ");
  }, [activeFop]);

  // Derived Worker Genitive Name (e.g. Васюка Івана Петровича)
  const workerGenitiveName = useMemo(() => {
    if (!selectedWorker) return "";
    return getWorkerGenitiveName(
      selectedWorker.vezeteknev,
      selectedWorker.keresztnev,
      selectedWorker.apai_nev,
      selectedWorker.nem
    );
  }, [selectedWorker]);

  // Derived Worker Short Name (e.g. Васюк І.П.)
  const workerShortName = useMemo(() => {
    if (!selectedWorker) return "";
    const fnInit = selectedWorker.keresztnev ? `${selectedWorker.keresztnev.charAt(0)}.` : "";
    const mnInit = selectedWorker.apai_nev ? `${selectedWorker.apai_nev.charAt(0)}.` : "";
    return `${selectedWorker.vezeteknev} ${fnInit}${mnInit}`.trim();
  }, [selectedWorker]);

  // Lowercase position name for sentence integration
  const position = useMemo(() => {
    const raw = selectedWorker?.foglalkozas_megnevezes || "";
    if (!raw.trim()) return "";
    return raw.charAt(0).toLowerCase() + raw.slice(1);
  }, [selectedWorker]);

  const rawStartDate = selectedWorker?.munkakezdes_datum || "";
  const rawDismissalDate = selectedWorker?.munkaviszony_vege || "";
  const rawRequestDate = selectedWorker?.kerelem_datum || "";

  // Effective Start Date for Priyom & Bez Kopijok
  const effectiveStartDate = overrideStartDate || rawStartDate;

  // Effective Dismissal Date for Zvilnennya
  const effectiveDismissalDate = overrideDismissalDate || rawDismissalDate;

  // Effective Leave Start Date for Vidpustka (DD.MM.YYYY format)
  const todayIso = new Date().toISOString().slice(0, 10);
  const effectiveLeaveStartDate = overrideLeaveStartDate || todayIso;

  const formatDotDate = (isoStr: string) => {
    if (!isoStr || !isoStr.includes("-")) return isoStr;
    const [y, m, d] = isoStr.split("-");
    return `${d}.${m}.${y}`;
  };

  // Effective Request Date:
  // - For Zvilnennya: rawDismissalDate || rawRequestDate
  // - For Vidpustka: todayIso
  // - For Bez Kopijok: rawStartDate || todayIso (the day of first working day!)
  // - For Priyom: rawRequestDate || rawStartDate
  const effectiveRequestDate = useMemo(() => {
    if (overrideRequestDate) return overrideRequestDate;
    if (selectedZayavaType === "zvilnennya") {
      return rawDismissalDate || rawRequestDate;
    }
    if (selectedZayavaType === "vidpustka") {
      return todayIso;
    }
    if (selectedZayavaType === "bez_kopijok") {
      return rawStartDate || todayIso;
    }
    return rawRequestDate || rawStartDate;
  }, [overrideRequestDate, selectedZayavaType, rawDismissalDate, rawRequestDate, rawStartDate, todayIso]);

  // Format dates strictly:
  // - Start date in body for Priyom: "19 жовтня 2021р."
  // - Dismissal date in body for Zvilnennya: "22 січня 2025 року."
  // - Request date in footer: "18  жовтня  2021" for Priyom, "15  січня  2025 року" for Vidpustka, "01.07.2026" for Bez Kopijok
  const formattedStartDate = useMemo(
    () => formatUkrainianDate(effectiveStartDate, "r"),
    [effectiveStartDate]
  );
  const formattedDismissalDate = useMemo(
    () => formatUkrainianDate(effectiveDismissalDate, "yearWord"),
    [effectiveDismissalDate]
  );
  const formattedRequestDate = useMemo(
    () =>
      selectedZayavaType === "vidpustka"
        ? formatUkrainianDate(effectiveRequestDate, "yearWord")
        : selectedZayavaType === "bez_kopijok"
        ? formatDotDate(effectiveRequestDate)
        : formatUkrainianDate(effectiveRequestDate, "none"),
    [effectiveRequestDate, selectedZayavaType]
  );

  // ----------------------------------------------------
  // VALIDATION LOGIC: Required Fields Check
  // ----------------------------------------------------
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (
      !selectedWorker ||
      !selectedWorker.vezeteknev?.trim() ||
      !selectedWorker.keresztnev?.trim() ||
      !selectedWorker.apai_nev?.trim()
    ) {
      errors.push("ПІБ працівника");
    }

    if (
      !activeFop ||
      !activeFop.vezeteknev?.trim() ||
      !activeFop.keresztnev?.trim() ||
      !activeFop.apai_nev?.trim()
    ) {
      errors.push("ПІБ ФОП");
    }

    if (selectedZayavaType === "priyom" || selectedZayavaType === "bez_kopijok") {
      if (!effectiveStartDate?.trim()) {
        errors.push("Дата прийняття");
      }
    } else if (selectedZayavaType === "zvilnennya") {
      if (!effectiveDismissalDate?.trim()) {
        errors.push("Дата звільнення");
      }
    } else if (selectedZayavaType === "vidpustka") {
      if (!effectiveLeaveStartDate?.trim()) {
        errors.push("Дата початку відпустки");
      }
      if (!leaveDays || leaveDays <= 0) {
        errors.push("Кількість днів відпустки");
      }
    }

    if (!effectiveRequestDate?.trim()) {
      errors.push("Дата заяви");
    }

    return errors;
  }, [
    selectedWorker,
    activeFop,
    effectiveStartDate,
    effectiveDismissalDate,
    effectiveLeaveStartDate,
    leaveDays,
    effectiveRequestDate,
    selectedZayavaType,
  ]);

  const isValidToGenerate = validationErrors.length === 0;
  const activeFopCode = activeFop ? activeFop.kod || activeFop.fop_kod || "" : "";

  // Default body text generated dynamically depending on Zayava Type
  const defaultBodyText = useMemo(() => {
    if (selectedZayavaType === "zvilnennya") {
      const d = formattedDismissalDate || "[дата звільнення]";
      return `Прошу звільнити мене з роботи за згодою сторін з ${d}.`;
    }
    if (selectedZayavaType === "vidpustka") {
      const d = formatDotDate(effectiveLeaveStartDate) || "[дата]";
      return `Прошу надати мені основну щорічну відпустку з ${d} року на ${leaveDays} календарних днів.`;
    }
    if (selectedZayavaType === "bez_kopijok") {
      const monthYear = getWorkerStartMonthYearString(effectiveStartDate);
      return `Прошу належну до виплати мені заробітну плату виплачувати готівкою в гривнях, без копійок, починаючи із зарплати за ${monthYear} року. Належні до виплати копійки прошу переносити на майбутні місяці розрахунку до остаточної їх виплати під час звільнення.`;
    }
    const p = position || "[посада]";
    const d = formattedStartDate || "[дата]";
    if (!selectedWorker) return `Прошу прийняти мене на посаду ${p} з ${d}.`;
    if (!selectedWorker.foallas) {
      return `Прошу прийняти мене на посаду ${p} з ${d} за сумісництвом.`;
    }
    if (!selectedWorker.teljes_munkaido) {
      return `Прошу прийняти мене на посаду ${p} з ${d} на неповний робочий час, а саме 4 год на 5 днів тижня.`;
    }
    return `Прошу прийняти мене на посаду ${p} з ${d}.`;
  }, [
    selectedZayavaType,
    selectedWorker,
    position,
    formattedStartDate,
    formattedDismissalDate,
    effectiveLeaveStartDate,
    leaveDays,
    effectiveStartDate,
  ]);

  const activeBodyText = customBodyText || defaultBodyText;

  // ----------------------------------------------------
  // GENERATE WORD ACTION
  // ----------------------------------------------------
  const handleGenerateDocx = async () => {
    if (!isValidToGenerate) {
      onShowToast("Необхідно заповнити всі обов'язкові реквізити працівника!");
      return;
    }
    if (!activeFop || !selectedWorker) return;

    setIsGenerating(true);
    try {
      let targetDir: string | undefined = undefined;
      if (rootFolder) {
        const fopDir = await ensureFopDirectory(rootFolder, activeFopCode, fopName);
        if (fopDir) {
          targetDir = `${fopDir}\\кадрові документи`;
        }
      }

      const req: GenerateZayavaPriyomDocxRequest = {
        zayava_type: selectedZayavaType,
        fop_id: activeFop.id,
        worker_id: selectedWorker.id,
        fop_name: fopName,
        worker_genitive_name: workerGenitiveName,
        position,
        start_date:
          selectedZayavaType === "zvilnennya"
            ? formattedDismissalDate
            : selectedZayavaType === "vidpustka"
            ? formatDotDate(effectiveLeaveStartDate)
            : selectedZayavaType === "bez_kopijok"
            ? getWorkerStartMonthYearString(effectiveStartDate)
            : formattedStartDate,
        request_date:
          selectedZayavaType === "bez_kopijok"
            ? formatDotDate(effectiveRequestDate)
            : formattedRequestDate,
        worker_short_name: workerShortName,
        foallas: selectedWorker.foallas,
        teljes_munkaido: Boolean(selectedWorker.teljes_munkaido),
        custom_body_text: activeBodyText.trim(), // Always pass activeBodyText!
        save_dir: targetDir,
      };

      const resultPath = await generateZayavaPriyomDocx(req);
      onShowToast(`Успішно збережено Заяву: ${resultPath}`);
    } catch (err: any) {
      console.error("Error generating Zayava:", err);
      onShowToast(`Помилка під час генерації: ${err.message || String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenExplorerFolder = async () => {
    if (!rootFolder || !activeFop) return;
    const fopDir = await ensureFopDirectory(rootFolder, activeFopCode, fopName);
    if (fopDir) {
      const kadroviDir = `${fopDir}\\кадрові документи`;
      await openFolderInExplorer(kadroviDir);
    }
  };

  const selectedWorkerFullName = selectedWorker
    ? [selectedWorker.vezeteknev, selectedWorker.keresztnev, selectedWorker.apai_nev].filter(Boolean).join(" ")
    : "";

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-12 w-full font-sans">
      {/* UNIFIED TOP HEADER CONTROL BAR WITH GENERATE & EXPLORER BUTTONS INTEGRATED */}
      <div className="bg-gradient-to-r from-white via-[#f8faf9] to-[#f4f9f8] rounded-[28px] p-4 px-7 border-2 border-[#cbd8d6] shadow-md flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 w-full transition-all duration-300">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onBackToOptions}
            className="p-3.5 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center hover:scale-105 active:scale-95"
            title="Назад"
          >
            <ArrowLeftIcon className="w-5.5 h-5.5 stroke-[2.5]" />
          </button>

          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-[#133b47] font-heading leading-tight">
              {selectedZayavaType === "zvilnennya"
                ? "Заява про звільнення"
                : selectedZayavaType === "vidpustka"
                ? "Заява про надання відпустки"
                : selectedZayavaType === "bez_kopijok"
                ? "Заява про виплату зарплати без копійок"
                : "Заява про прийняття на роботу"}
            </h2>
            <span className="text-xs font-medium text-[#556e75]">
              Кадрові документи та звернення
            </span>
          </div>
        </div>

        {/* Right: Integrated Document Generation & Explorer Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleGenerateDocx}
            disabled={!isValidToGenerate || isGenerating}
            className={`py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2.5 cursor-pointer border-2 ${
              isValidToGenerate && !isGenerating
                ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] border-[#133b47] hover:scale-[1.02] active:scale-[0.98]"
                : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
            }`}
          >
            <ArrowDownTrayIcon className="w-5 h-5 stroke-[2.2]" />
            <span>{isGenerating ? "Формування..." : "Згенерувати Заяву"}</span>
          </button>

          <button
            onClick={handleOpenExplorerFolder}
            className="p-3.5 rounded-2xl bg-[#f8faf9] hover:bg-[#e6f4f1] border-2 border-[#cbd8d6] text-[#133b47] transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
            title="Відкрити папку у Провіднику"
          >
            <FolderOpenIcon className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Validation Warning Alert */}
      {!isValidToGenerate && (
        <div className="bg-amber-50 rounded-[24px] p-4.5 px-6 border-2 border-amber-200 text-amber-900 text-sm font-medium flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5.5 h-5.5 text-amber-600 shrink-0 stroke-[2]" />
            <span>
              Відсутні обов'язкові реквізити: <span className="font-bold underline">{validationErrors.join(", ")}</span>.
            </span>
          </div>

          {selectedWorker && onEditWorker && (
            <button
              onClick={() => onEditWorker(selectedWorker)}
              className="px-4.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all cursor-pointer shrink-0 flex items-center gap-2 shadow-sm"
            >
              <PencilSquareIcon className="w-4 h-4 stroke-[2]" />
              <span>Заповнити</span>
            </button>
          )}
        </div>
      )}

      {/* RICH 2-COLUMN DASHBOARD LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LEFT COLUMN: STREAMLINED DETAILS CARD ONLY (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[28px] p-7 border-2 border-[#cbd8d6] shadow-md hover:shadow-lg transition-all duration-300 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#e2eceb] pb-3.5">
              <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-[#354f57]">
                <UserIcon className="w-5 h-5 text-[#133b47] stroke-[2]" />
                Налаштування та реквізити
              </div>

              {selectedWorker && onEditWorker && (
                <button
                  type="button"
                  onClick={() => onEditWorker(selectedWorker)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#e6f4f1] hover:bg-[#d8ece8] text-[#133b47] text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 shadow-xs"
                  title="Редагувати працівника"
                >
                  <PencilSquareIcon className="w-4 h-4 stroke-[2]" />
                  <span>Редагувати</span>
                </button>
              )}
            </div>

            {/* ZAYAVA TYPE SELECTOR */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#556e75]">Тип заяви:</label>
              <div className="relative w-full" ref={zayavaTypeRef}>
                <button
                  type="button"
                  onClick={() => setIsZayavaTypeDropdownOpen((prev) => !prev)}
                  className="w-full h-12 px-4 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-between shadow-sm cursor-pointer border border-[#133b47]"
                >
                  <div className="flex items-center gap-2.5">
                    <DocumentTextIcon className="w-4.5 h-4.5 text-[#f8a44c]" />
                    <span>
                      {selectedZayavaType === "priyom"
                        ? "Заява про прийняття на роботу"
                        : selectedZayavaType === "zvilnennya"
                        ? "Заява про звільнення"
                        : selectedZayavaType === "vidpustka"
                        ? "Заява про надання відпустки"
                        : selectedZayavaType === "bez_kopijok"
                        ? "Заява про виплату зарплати без копійок"
                        : "Заява про переведення"}
                    </span>
                  </div>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-[#f8a44c] transition-transform duration-200 stroke-[2.5] ${
                      isZayavaTypeDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Zayava Type Dropdown Menu */}
                {isZayavaTypeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-[#cbd8d6] shadow-2xl overflow-hidden z-20 animate-modalScale p-1.5 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setSelectedZayavaType("priyom");
                        setIsZayavaTypeDropdownOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                        selectedZayavaType === "priyom"
                          ? "bg-[#133b47] text-[#f8a44c]"
                          : "hover:bg-[#f4f9f8] text-[#133b47]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>Заява про прийняття на роботу</span>
                      </div>
                      {selectedZayavaType === "priyom" && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedZayavaType("zvilnennya");
                        setIsZayavaTypeDropdownOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                        selectedZayavaType === "zvilnennya"
                          ? "bg-[#133b47] text-[#f8a44c]"
                          : "hover:bg-[#f4f9f8] text-[#133b47]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>Заява про звільнення</span>
                      </div>
                      {selectedZayavaType === "zvilnennya" && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedZayavaType("vidpustka");
                        setIsZayavaTypeDropdownOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                        selectedZayavaType === "vidpustka"
                          ? "bg-[#133b47] text-[#f8a44c]"
                          : "hover:bg-[#f4f9f8] text-[#133b47]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>Заява про надання відпустки</span>
                      </div>
                      {selectedZayavaType === "vidpustka" && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedZayavaType("bez_kopijok");
                        setIsZayavaTypeDropdownOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                        selectedZayavaType === "bez_kopijok"
                          ? "bg-[#133b47] text-[#f8a44c]"
                          : "hover:bg-[#f4f9f8] text-[#133b47]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>Заява про виплату зарплати без копійок</span>
                      </div>
                      {selectedZayavaType === "bez_kopijok" && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* WORKER SELECTOR */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#556e75]">Працівник ФОП:</label>
              <div className="relative w-full" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsWorkerDropdownOpen((prev) => !prev)}
                  className="w-full h-12 px-4 rounded-2xl bg-white border-2 border-[#cbd8d6] hover:border-[#133b47] text-[#133b47] text-xs sm:text-sm font-bold focus:outline-none transition-all duration-200 flex items-center justify-between shadow-xs cursor-pointer"
                >
                  {selectedWorker ? (
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-7 h-7 rounded-xl bg-[#133b47] text-[#f8a44c] text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                        {selectedWorker.vezeteknev.charAt(0)}
                      </div>
                      <span className="truncate font-bold text-[#133b47]">{selectedWorkerFullName}</span>
                    </div>
                  ) : (
                    <span className="text-[#556e75] font-medium">-- Оберіть працівника --</span>
                  )}

                  <ChevronDownIcon
                    className={`w-4 h-4 text-[#133b47] shrink-0 transition-transform duration-200 stroke-[2.5] ${
                      isWorkerDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* WORKERS DROPDOWN POPUP MENU */}
                {isWorkerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] border-2 border-[#cbd8d6] shadow-2xl overflow-hidden z-20 animate-modalScale">
                    <div className="p-3 border-b border-[#e2eceb] bg-[#f8faf9] flex items-center gap-2">
                      <MagnifyingGlassIcon className="w-4.5 h-4.5 text-[#556e75] shrink-0 stroke-[2]" />
                      <input
                        type="text"
                        placeholder="Пошук працівника..."
                        value={workerSearchQuery}
                        onChange={(e) => setWorkerSearchQuery(e.target.value)}
                        className="w-full text-xs sm:text-sm font-semibold text-[#133b47] bg-transparent focus:outline-none"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
                      {filteredMunkasok.length === 0 ? (
                        <div className="p-4 text-center text-xs font-medium text-[#556e75]">
                          Працівників не знайдено.
                        </div>
                      ) : (
                        filteredMunkasok.map((m) => {
                          const name = [m.vezeteknev, m.keresztnev, m.apai_nev].filter(Boolean).join(" ");
                          const isSelected = m.id === selectedWorkerId;

                          return (
                            <div
                              key={m.id}
                              onClick={() => {
                                setSelectedWorkerId(m.id);
                                setIsWorkerDropdownOpen(false);
                              }}
                              className={`p-3 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? "bg-[#133b47] text-[#f8a44c] shadow-sm"
                                  : "hover:bg-[#f4f9f8] text-[#133b47]"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isSelected ? "bg-[#f8a44c] text-[#133b47]" : "bg-[#133b47] text-[#f8a44c]"
                                  }`}
                                >
                                  {m.vezeteknev.charAt(0)}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs sm:text-sm font-bold truncate">{name}</span>
                                  <span className={`text-[11px] font-medium truncate ${isSelected ? "text-[#c3d9d6]" : "text-[#556e75]"}`}>
                                    {m.foglalkozas_megnevezes || "Посада не вказана"}
                                  </span>
                                </div>
                              </div>

                              {isSelected && <CheckIcon className="w-4 h-4 text-[#f8a44c] stroke-[3]" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DETAILS & EDITABLE DATES GRID */}
            {selectedWorker && (
              <div className="flex flex-col gap-3.5 pt-2 border-t border-[#e2eceb] text-xs sm:text-sm font-medium text-[#133b47]">
                {/* Position */}
                <div className="flex items-center justify-between gap-3 p-3.5 bg-[#f8faf9] rounded-2xl border border-[#cbd8d6]">
                  <div className="flex items-center gap-2 text-[#556e75] shrink-0">
                    <BriefcaseIcon className="w-4.5 h-4.5 text-[#133b47] stroke-[2]" />
                    <span className="text-xs">Посада:</span>
                  </div>
                  <span className="font-bold text-[#133b47] truncate text-right">
                    {selectedWorker.foglalkozas_megnevezes || "Не вказана"}
                  </span>
                </div>

                {/* EDITABLE DATES GRID WITH CUSTOM DATE PICKERS */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Primary Date Input */}
                  {selectedZayavaType === "vidpustka" ? (
                    <CustomDatePicker
                      label="Дата початку відпустки:"
                      value={effectiveLeaveStartDate}
                      onChange={(val) => setOverrideLeaveStartDate(val)}
                    />
                  ) : (
                    <CustomDatePicker
                      label={selectedZayavaType === "zvilnennya" ? "Дата звільнення:" : "Дата прийняття:"}
                      value={selectedZayavaType === "zvilnennya" ? effectiveDismissalDate : effectiveStartDate}
                      onChange={(val) => {
                        if (selectedZayavaType === "zvilnennya") {
                          setOverrideDismissalDate(val);
                        } else {
                          setOverrideStartDate(val);
                        }
                      }}
                    />
                  )}

                  {/* Application Date Input (Дата заяви) */}
                  <CustomDatePicker
                    label="Дата заяви:"
                    value={effectiveRequestDate}
                    onChange={(val) => setOverrideRequestDate(val)}
                  />
                </div>

                {/* Leave Days Input (Visible only for vidpustka) */}
                {selectedZayavaType === "vidpustka" && (
                  <div className="flex items-center justify-between gap-3 p-3 bg-[#f8faf9] rounded-2xl border border-[#cbd8d6]">
                    <span className="text-xs font-semibold text-[#556e75]">Кількість календарних днів:</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(parseInt(e.target.value, 10) || 1)}
                      className="w-20 text-center font-bold text-xs sm:text-sm text-[#133b47] bg-white border border-[#cbd8d6] rounded-xl p-1.5 focus:outline-none focus:border-[#133b47]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ENLARGED MS WORD A4 PAPER PREVIEW SHEET (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center gap-3 w-full">
          {/* Word Document Paper Mockup Sheet */}
          <div
            className="bg-white rounded-[24px] p-10 sm:p-14 border border-[#cbd8d6] shadow-2xl w-full max-w-[580px] aspect-[210/297] flex flex-col justify-start gap-5 text-[#133b47] relative mx-auto overflow-hidden transition-all duration-300 hover:shadow-3xl"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Header Block (Completely Right-aligned at Top Right) */}
            <div className="flex flex-col items-end text-right ml-auto text-xs sm:text-sm italic leading-tight max-w-[70%]">
              {selectedZayavaType === "bez_kopijok" ? (
                <>
                  <span>ФОП {fopName.toUpperCase() || "[ПІБ ФОП]"}</span>
                  <span>{selectedWorkerFullName || "[ПІБ Працівника]"}</span>
                  <span className="mt-0.5">{position || "[посада]"}</span>
                </>
              ) : (
                <>
                  <span>Фізична особа-підприємець</span>
                  <span>{fopName || "[ПІБ ФОП]"}</span>
                  <span className="mt-1">
                    {workerGenitiveName || "[ПІБ Працівника (Родовий)]"}
                  </span>
                </>
              )}
            </div>

            {/* Title (Center, Times New Roman 14pt Italic) */}
            <div className="mt-8 mb-4 text-center">
              <h3 className="text-sm sm:text-base italic text-[#133b47]">
                {selectedZayavaType === "bez_kopijok" ? "ЗАЯВА" : "Заява"}
              </h3>
            </div>

            {/* Body Text (Justified, Times New Roman 14pt Italic, 1cm firstLine indent, EDITABLE) */}
            <div className="my-3 text-xs sm:text-sm italic leading-relaxed text-justify indent-6 text-[#133b47] flex flex-col gap-1">
              <textarea
                rows={selectedZayavaType === "bez_kopijok" ? 4 : 3}
                value={activeBodyText}
                onChange={(e) => setCustomBodyText(e.target.value)}
                className="w-full p-1 rounded bg-transparent hover:bg-slate-50 focus:bg-white border-0 text-xs sm:text-sm italic leading-relaxed text-justify focus:outline-none transition-all font-serif resize-none"
                title="Натисніть для редагування тексту заяви"
              />
            </div>

            {/* Footer Line (Times New Roman 14pt Italic) */}
            <div className="mt-8 flex items-center justify-between text-xs sm:text-sm italic">
              {selectedZayavaType === "bez_kopijok" ? (
                <>
                  <span>{workerShortName} _________________</span>
                  <span>{formatDotDate(effectiveRequestDate)}</span>
                </>
              ) : (
                <>
                  <span>{formattedRequestDate || "[ДАТА ЗАЯВИ]"}</span>
                  <span>{workerShortName || "[Прізвище І.О.]"}</span>
                </>
              )}
            </div>

            {/* Lower portion of A4 page is naturally empty whitespace */}
          </div>
        </div>
      </div>
    </div>
  );
};
