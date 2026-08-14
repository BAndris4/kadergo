import React, { useState, useEffect, useCallback } from "react";
import {
  TableCellsIcon,
  DocumentArrowDownIcon,
  FolderOpenIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
  UserIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  PlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { FopData, Munkas, TabelPreviewDto, TabelPreviewRowDto, WorkerDayOverride } from "../../../types/fop";
import {
  ensureFopDirectory,
  generateTabelExcel,
  generateTabelPeriodExcel,
  openFolderInExplorer,
  previewTabel,
  previewTabelPeriod,
} from "../../../services/fopService";
import { CustomDateSelector, MONTH_NAMES_UKR } from "../../pickers/CustomDateSelector";
import { WorkerCard } from "../../common/WorkerCard";

// ─── Official Tabel Attendance Codes ─────────────────────────────────

const TABEL_CODES = [
  { code: "Р", label: "Робочий день", defaultHours: 8 },
  { code: "РС", label: "Години роботи з неповним робочим днем (тижнем)", defaultHours: 4 },
  { code: "ВЧ", label: "Вечірні години роботи", defaultHours: 8 },
  { code: "РН", label: "Нічні години роботи", defaultHours: 8 },
  { code: "НУ", label: "Надурочні години роботи", defaultHours: 8 },
  { code: "РВ", label: "Робота у вихідні та святкові дні", defaultHours: 8 },
  { code: "ВД", label: "Відрядження", defaultHours: 8 },
  { code: "В", label: "Основна щорічна відпустка", defaultHours: 0 },
  { code: "Д", label: "Щорічна додаткова відпустка", defaultHours: 0 },
  { code: "Ч", label: "Чорнобильська відпустка", defaultHours: 0 },
  { code: "ТВ", label: "Творча відпустка", defaultHours: 0 },
  { code: "Н", label: "Додаткова відпустка у зв'язку з навчанням", defaultHours: 0 },
  { code: "НБ", label: "Відпустка без збереження з/п (навчання)", defaultHours: 0 },
  { code: "ДБ", label: "Додаткова відпустка без збереження з/п в обов'язковому порядку", defaultHours: 0 },
  { code: "ДО", label: "Додаткова відпустка працівникам з дітьми", defaultHours: 0 },
  { code: "ВП", label: "Відпустка у зв'язку з вагітністю та пологами", defaultHours: 0 },
  { code: "ДД", label: "Відпустка для догляду за дитиною до 3/6 років", defaultHours: 0 },
  { code: "НА", label: "Відпустка без збереження з/п за згодою сторін", defaultHours: 0 },
  { code: "БЗ", label: "Інші відпустки без збереження з/п", defaultHours: 0 },
  { code: "НД", label: "Неявки через переведення на неповний робочий день", defaultHours: 0 },
  { code: "НП", label: "Неявки через тимчасове переведення", defaultHours: 0 },
  { code: "ІН", label: "Інший невідпрацьований час (державні обов'язки, мобілізація)", defaultHours: 0 },
  { code: "П", label: "Простої", defaultHours: 0 },
  { code: "ПР", label: "Прогули", defaultHours: 0 },
  { code: "С", label: "Страйки", defaultHours: 0 },
  { code: "ТН", label: "Оплачувана тимчасова непрацездатність (лікарняний)", defaultHours: 0 },
  { code: "НН", label: "Неоплачувана тимчасова непрацездатність", defaultHours: 0 },
  { code: "НЗ", label: "Неявки з нез'ясованих причин", defaultHours: 0 },
  { code: "ІВ", label: "Інші види неявок", defaultHours: 0 },
  { code: "І", label: "Інші причини неявок", defaultHours: 0 },
  { code: "", label: "— Очистити / За замовчуванням —", defaultHours: 0 },
];

interface TabelGeneratorViewProps {
  activeFop: FopData | null;
  rootFolder: string;
  onBackToOptions: () => void;
  onShowToast: (msg: string) => void;
  onEditWorker?: (worker: Munkas) => void;
  onDeleteWorker?: (worker: Munkas) => void;
  onAddWorker?: (fopId: number) => void;
}

export const TabelGeneratorView: React.FC<TabelGeneratorViewProps> = ({
  activeFop,
  rootFolder,
  onBackToOptions,
  onShowToast,
  onEditWorker,
  onDeleteWorker,
  onAddWorker,
}) => {
  const [selectionMode, setSelectionMode] = useState<"month" | "period">("month");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState<number>(1);
  const [endYear, setEndYear] = useState<number>(new Date().getFullYear());
  const [endMonth, setEndMonth] = useState<number>(new Date().getMonth() + 1);

  const [previewData, setPreviewData] = useState<TabelPreviewDto | null>(null);
  const [dayOverrides, setDayOverrides] = useState<WorkerDayOverride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedPath, setLastGeneratedPath] = useState<string | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Multi-select & Code picker state (Excel-like drag & Ctrl selection)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(new Set());
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStart, setDragStart] = useState<{
    sectionIdx: number;
    rowIdx: number;
    day: number;
    year: number;
    month: number;
    workerId: number;
  } | null>(null);
  const [dragCtrlHeld, setDragCtrlHeld] = useState(false);
  const [initialSelectionBeforeDrag, setInitialSelectionBeforeDrag] = useState<Set<string>>(new Set());

  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [singleTargetCell, setSingleTargetCell] = useState<{
    workerId: number;
    year: number;
    month: number;
    day: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customHoursOverride, setCustomHoursOverride] = useState<string>("");

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
      setDragStart(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const activeFopName = activeFop
    ? [activeFop.vezeteknev, activeFop.keresztnev, activeFop.apai_nev].filter(Boolean).join(" ")
    : "";
  const activeFopCode = activeFop ? activeFop.kod || activeFop.fop_kod || "" : "";

  const [loadError, setLoadError] = useState<string | null>(null);

  // ─── Load preview ───────────────────────────────────────────────

  const loadPreview = useCallback(async () => {
    if (!activeFop) {
      setPreviewData(null);
      setLoadError(null);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      if (selectionMode === "month") {
        const data = (await previewTabel(
          activeFop.id,
          selectedYear,
          selectedMonth,
          dayOverrides
        )) as TabelPreviewDto;
        setPreviewData(data);
      } else {
        const data = (await previewTabelPeriod(
          activeFop.id,
          startYear,
          startMonth,
          endYear,
          endMonth,
          dayOverrides
        )) as TabelPreviewDto;
        setPreviewData(data);
      }
    } catch (err) {
      console.error("preview_tabel error:", err);
      setLoadError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [activeFop, selectionMode, selectedYear, selectedMonth, startYear, startMonth, endYear, endMonth, dayOverrides]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      setZoomLevel((prev) => Math.min(Math.max(0.6, prev + delta), 1.5));
    }
  };

  // ─── Grouped Month Sections for Period View ───────────────────────

  const groupedMonthSections = React.useMemo(() => {
    if (!previewData || !previewData.rows) return [];
    const map = new Map<string, TabelPreviewRowDto[]>();
    for (const row of previewData.rows) {
      const monthKey = row.month_name_ukr || previewData.month_name_ukr || "Місяць";
      if (!map.has(monthKey)) map.set(monthKey, []);
      map.get(monthKey)!.push(row);
    }
    return Array.from(map.entries()).map(([monthName, rows]) => {
      return { monthName, rows };
    });
  }, [previewData]);

  // ─── Cell Selection Handlers (Excel-like) ─────────────────────────

  const makeCellKey = (year: number, month: number, workerId: number, day: number) =>
    `${year}-${month}-${workerId}-${day}`;

  const isCellSelected = (year: number, month: number, workerId: number, day: number) => {
    return selectedCellKeys.has(makeCellKey(year, month, workerId, day));
  };

  const handleCellMouseDown = (
    e: React.MouseEvent,
    sectionIdx: number,
    rowIdx: number,
    day: number,
    year: number,
    month: number,
    workerId: number
  ) => {
    e.preventDefault();
    setIsMouseDown(true);
    const isCtrl = e.ctrlKey || e.metaKey;
    setDragCtrlHeld(isCtrl);
    setDragStart({ sectionIdx, rowIdx, day, year, month, workerId });
    const cellKey = makeCellKey(year, month, workerId, day);

    if (!isCtrl) {
      setInitialSelectionBeforeDrag(new Set());
      setSelectedCellKeys(new Set([cellKey]));
    } else {
      setInitialSelectionBeforeDrag(new Set(selectedCellKeys));
      setSelectedCellKeys((prev) => {
        const next = new Set(prev);
        if (next.has(cellKey)) {
          next.delete(cellKey);
        } else {
          next.add(cellKey);
        }
        return next;
      });
    }
  };

  const handleCellMouseEnter = (
    sectionIdx: number,
    rowIdx: number,
    day: number,
    year: number,
    month: number
  ) => {
    if (!isMouseDown || !dragStart) return;
    if (dragStart.sectionIdx !== sectionIdx) return;

    const rows = groupedMonthSections[sectionIdx]?.rows;
    if (!rows) return;

    const minRow = Math.min(dragStart.rowIdx, rowIdx);
    const maxRow = Math.max(dragStart.rowIdx, rowIdx);
    const minDay = Math.min(dragStart.day, day);
    const maxDay = Math.max(dragStart.day, day);

    const dragKeys = new Set<string>();
    for (let r = minRow; r <= maxRow; r++) {
      const rRow = rows[r];
      if (!rRow) continue;
      const rYear = rRow.year || year;
      const rMonth = rRow.month || month;
      for (let d = minDay; d <= maxDay; d++) {
        dragKeys.add(makeCellKey(rYear, rMonth, rRow.worker_id, d));
      }
    }

    if (dragCtrlHeld) {
      const combined = new Set(initialSelectionBeforeDrag);
      dragKeys.forEach((k) => combined.add(k));
      setSelectedCellKeys(combined);
    } else {
      setSelectedCellKeys(dragKeys);
    }
  };

  const handleCellDoubleClick = (
    workerId: number,
    day: number,
    year: number,
    month: number
  ) => {
    const key = makeCellKey(year, month, workerId, day);
    if (!selectedCellKeys.has(key)) {
      setSelectedCellKeys((prev) => new Set(prev).add(key));
    }
    setSingleTargetCell({ workerId, year, month, day });
    setSearchQuery("");
    setCustomHoursOverride("");
    setIsPickerModalOpen(true);
  };

  const openPickerForSelected = () => {
    if (selectedCellKeys.size === 0) return;
    setSingleTargetCell(null);
    setSearchQuery("");
    setCustomHoursOverride("");
    setIsPickerModalOpen(true);
  };

  const selectAllWeekdays = () => {
    if (!previewData || previewData.rows.length === 0) return;
    const newKeys = new Set<string>();
    previewData.rows.forEach((row) => {
      const rYear = row.year || selectedYear;
      const rMonth = row.month || selectedMonth;
      row.days.forEach((day) => {
        if (day.is_weekday) {
          newKeys.add(makeCellKey(rYear, rMonth, row.worker_id, day.day));
        }
      });
    });
    setSelectedCellKeys(newKeys);
  };

  const selectAllWeekends = () => {
    if (!previewData || previewData.rows.length === 0) return;
    const newKeys = new Set<string>();
    previewData.rows.forEach((row) => {
      const rYear = row.year || selectedYear;
      const rMonth = row.month || selectedMonth;
      row.days.forEach((day) => {
        if (!day.is_weekday) {
          newKeys.add(makeCellKey(rYear, rMonth, row.worker_id, day.day));
        }
      });
    });
    setSelectedCellKeys(newKeys);
  };

  const clearSelection = () => {
    setSelectedCellKeys(new Set());
  };

  const applyCodeSelection = (codeObj: typeof TABEL_CODES[0]) => {
    let targets: { workerId: number; year: number; month: number; day: number }[] = [];

    if (singleTargetCell) {
      targets = [singleTargetCell];
    } else {
      selectedCellKeys.forEach((key) => {
        const parts = key.split("-").map(Number);
        if (parts.length === 4) {
          targets.push({ year: parts[0], month: parts[1], workerId: parts[2], day: parts[3] });
        }
      });
    }

    if (targets.length === 0) return;

    let finalHours = codeObj.defaultHours;
    if (customHoursOverride.trim() !== "") {
      const parsed = parseFloat(customHoursOverride);
      if (!isNaN(parsed) && parsed >= 0) {
        finalHours = parsed;
      }
    }

    setDayOverrides((prev) => {
      let updated = [...prev];
      targets.forEach((t) => {
        updated = updated.filter(
          (o) =>
            !(
              o.worker_id === t.workerId &&
              (o.year == null || o.year === t.year) &&
              (o.month == null || o.month === t.month) &&
              o.day === t.day
            )
        );
        if (codeObj.code !== "" || finalHours > 0) {
          updated.push({
            worker_id: t.workerId,
            year: t.year,
            month: t.month,
            day: t.day,
            code: codeObj.code,
            hours: finalHours,
          });
        }
      });
      return updated;
    });

    setIsPickerModalOpen(false);
    setSingleTargetCell(null);
    if (!singleTargetCell) {
      setSelectedCellKeys(new Set());
    }
  };

  // ─── Generate Excel ───────────────────────────────────────────────

  const handleGenerateExcel = async () => {
    if (!activeFop || !rootFolder) {
      onShowToast("⚠️ Спочатку оберіть ФОП та встановіть папку збереження!");
      return;
    }
    setIsGenerating(true);
    try {
      const targetDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
      if (selectionMode === "month") {
        const filePath = await generateTabelExcel({
          fop_id: activeFop.id,
          year: selectedYear,
          month: selectedMonth,
          worker_day_overrides: dayOverrides,
          save_dir: targetDir || undefined,
        });
        setLastGeneratedPath(filePath);
        const monthObj = MONTH_NAMES_UKR.find((m) => m.id === selectedMonth);
        onShowToast(`✅ Табель за ${monthObj?.name || ""} ${selectedYear}р. успішно згенеровано!`);
      } else {
        const filePath = await generateTabelPeriodExcel({
          fop_id: activeFop.id,
          start_year: startYear,
          start_month: startMonth,
          end_year: endYear,
          end_month: endMonth,
          worker_day_overrides: dayOverrides,
          save_dir: targetDir || undefined,
        });
        setLastGeneratedPath(filePath);
        const startM = MONTH_NAMES_UKR.find((m) => m.id === startMonth)?.name || "";
        const endM = MONTH_NAMES_UKR.find((m) => m.id === endMonth)?.name || "";
        onShowToast(`✅ Табелі за період (${startM} ${startYear} — ${endM} ${endYear}) успішно згенеровано!`);
      }
    } catch (err) {
      onShowToast(`❌ Помилка генерації табеля: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenExplorerFolder = async () => {
    if (lastGeneratedPath) {
      const folder = lastGeneratedPath.substring(0, lastGeneratedPath.lastIndexOf("\\"));
      await openFolderInExplorer(folder || lastGeneratedPath);
      return;
    }
    if (rootFolder && activeFop) {
      const targetDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
      if (targetDir) await openFolderInExplorer(targetDir);
    }
  };

  const calculateMonthCount = () => {
    return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  };

  const filteredCodes = TABEL_CODES.filter((tc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tc.code.toLowerCase().includes(q) ||
      tc.label.toLowerCase().includes(q)
    );
  });

  const workersWithMissing = previewData?.rows.filter((r) => r.missing_fields.length > 0) || [];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-12">
      {/* 1. Header Control Bar (Matching Payroll Header Layout) */}
      <div className="bg-[#133b47] rounded-[28px] p-5 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-5 relative z-10">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <button
            onClick={onBackToOptions}
            className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-[#f8a44c] flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/15"
            title="Назад до вибору документів"
          >
            <ArrowLeftIcon className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#f8a44c] text-[#133b47] flex items-center justify-center font-black shadow-md shrink-0">
              <CalendarDaysIcon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                Табель обліку робочого часу
              </h2>
              <p className="text-xs text-[#c3d9d6] font-medium">
                {activeFopName ? (
                  <>
                    ФОП: <strong className="text-white">{activeFopName}</strong>
                  </>
                ) : (
                  "Оберіть ФОП у верхньому меню"
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* Custom Date Selector */}
          <CustomDateSelector
            mode={selectionMode}
            onModeChange={setSelectionMode}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onSingleDateChange={(y: number, m: number) => {
              setSelectedYear(y);
              setSelectedMonth(m);
            }}
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
            onPeriodChange={(sy: number, sm: number, ey: number, em: number) => {
              setStartYear(sy);
              setStartMonth(sm);
              setEndYear(ey);
              setEndMonth(em);
            }}
          />

          {/* Multi-select Mode Toggle Button */}
          <button
            onClick={() => {
              setIsMultiSelectMode(!isMultiSelectMode);
              if (isMultiSelectMode) setSelectedCellKeys(new Set());
            }}
            className={`px-4 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer border-2 ${
              isMultiSelectMode
                ? "bg-[#f8a44c] text-[#133b47] border-[#f8a44c] shadow-lg shadow-[#f8a44c]/30"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
            }`}
          >
            <SparklesIcon className="w-4.5 h-4.5 stroke-[2.2]" />
            <span>{isMultiSelectMode ? "Режим вибору (активний)" : "Масове редагування днів"}</span>
          </button>

          {/* Generate Excel Button */}
          <button
            onClick={handleGenerateExcel}
            disabled={isGenerating || !activeFop || !previewData || previewData.rows.length === 0}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#f8a44c] to-[#e08e36] text-[#133b47] font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 border border-amber-300/30"
          >
            <DocumentArrowDownIcon className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>
              {isGenerating
                ? "Формування..."
                : selectionMode === "month"
                ? "Згенерувати Excel (.xlsx)"
                : `Згенерувати ${calculateMonthCount()} табелів (.xlsx)`}
            </span>
          </button>

          {lastGeneratedPath && (
            <button
              onClick={handleOpenExplorerFolder}
              className="px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border border-white/15"
              title="Відкрити папку у Провіднику"
            >
              <FolderOpenIcon className="w-4.5 h-4.5 stroke-[2.2]" />
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-header Bar: Section Title + Zoom Controls */}
      <div className="flex items-center justify-between bg-[#f8faf9] p-3 px-6 rounded-2xl border border-[#cbd8d6]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#133b47] text-[#f8a44c] flex items-center justify-center font-black text-xs">
            <UserIcon className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="text-sm font-black text-[#133b47]">
            {selectionMode === "month" ? "Табель за місяць" : `Період (${groupedMonthSections.length} місяців)`}
          </h3>
          {isLoading && (
            <span className="text-xs font-black text-[#556e75] animate-pulse">
              Перерахунок...
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-[#cbd8d6] shadow-xs">
          <span className="text-[11px] font-black text-[#556e75] px-1 font-mono">
            Zoom: {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((p) => Math.max(0.6, p - 0.1))}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#133b47] transition-all cursor-pointer"
            title="Зменшити (Zoom Out)"
          >
            <MagnifyingGlassMinusIcon className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 border-x border-slate-200 px-1">
            {[0.8, 1.0, 1.2].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setZoomLevel(lvl)}
                className={`px-1.5 py-0.5 text-[10px] font-black rounded transition-all cursor-pointer ${
                  Math.abs(zoomLevel - lvl) < 0.05
                    ? "bg-[#133b47] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {Math.round(lvl * 100)}%
              </button>
            ))}
          </div>
          <button
            onClick={() => setZoomLevel((p) => Math.min(1.5, p + 0.1))}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#133b47] transition-all cursor-pointer"
            title="Збільшити (Zoom In)"
          >
            <MagnifyingGlassPlusIcon className="w-4 h-4" />
          </button>
          {zoomLevel !== 1.0 && (
            <button
              onClick={() => setZoomLevel(1.0)}
              className="p-1 rounded-lg bg-[#133b47] text-white hover:bg-[#0f2e38] transition-all cursor-pointer"
              title="Скинути zoom (100%)"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. WORKERS MANAGEMENT SECTION ON TABEL VIEW */}
      {activeFop && activeFop.munkasok && (
        <div className="bg-white rounded-[24px] border-2 border-[#cbd8d6] p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <UserGroupIcon className="w-5 h-5 text-[#133b47] stroke-[2.2]" />
              <h3 className="text-sm font-black text-[#133b47]">
                Працівники ФОП ({activeFop.munkasok.length} осіб)
              </h3>
            </div>
            {onAddWorker && (
              <button
                onClick={() => onAddWorker(activeFop.id)}
                className="px-4 py-2 rounded-xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <PlusIcon className="w-4 h-4 stroke-[3]" />
                <span>Додати працівника</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeFop.munkasok.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onEditClick={() => onEditWorker && onEditWorker(worker)}
                onDeleteClick={() => onDeleteWorker && onDeleteWorker(worker)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bulk Select Control Bar (Visible when multi-select mode is ON or cells are selected) */}
      {(isMultiSelectMode || selectedCellKeys.size > 0) && (
        <div className="bg-[#fff8ef] border-2 border-[#f8a44c]/40 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-black text-[#133b47]">
              Вибрано днів: <span className="text-[#f8a44c] text-sm">{selectedCellKeys.size}</span>
            </span>
            <div className="h-4 w-[2px] bg-[#f8a44c]/30"></div>
            <button
              onClick={selectAllWeekdays}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#cbd8d6] hover:bg-[#e6f4f1] text-[11px] font-extrabold text-[#133b47] transition-all cursor-pointer"
            >
              Всі робочі дні
            </button>
            <button
              onClick={selectAllWeekends}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#cbd8d6] hover:bg-[#e6f4f1] text-[11px] font-extrabold text-[#133b47] transition-all cursor-pointer"
            >
              Всі вихідні
            </button>
            {selectedCellKeys.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-[11px] font-extrabold text-red-600 transition-all cursor-pointer"
              >
                Очистити вибір
              </button>
            )}
          </div>

          <button
            onClick={openPickerForSelected}
            disabled={selectedCellKeys.size === 0}
            className="px-5 py-2.5 rounded-xl bg-[#133b47] hover:bg-[#194b5a] text-[#f8a44c] font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckIcon className="w-4 h-4 stroke-[2.5]" />
            Змінити код для {selectedCellKeys.size} вибраних днів
          </button>
        </div>
      )}

      {/* Missing Fields Warning */}
      {workersWithMissing.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 stroke-[2.2]" />
            <span className="text-xs font-black text-amber-900">Увага: деякі працівники мають незаповнені обов'язкові поля</span>
          </div>
          <div className="flex flex-col gap-1">
            {workersWithMissing.map((w) => (
              <div key={w.worker_id} className="text-[11px] font-bold text-amber-800">
                <span className="font-black">{w.pib_posada.split(",")[0]}</span>: {w.missing_fields.join(", ")}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TIMESHEET TABLE PREVIEW (Grouped by month sections in Period Mode) */}
      {loadError ? (
        <div className="p-8 text-center text-xs font-black text-rose-700 bg-rose-50 rounded-2xl border-2 border-rose-200 shadow-md flex flex-col gap-2">
          <span className="text-sm font-black uppercase text-rose-800">Помилка завантаження даних (DEBUG):</span>
          <code className="text-xs bg-rose-100 p-3 rounded-xl text-rose-950 font-mono text-left whitespace-pre-wrap select-all">{loadError}</code>
        </div>
      ) : !activeFop ? (
        <div className="p-12 text-center text-xs font-extrabold text-[#556e75] bg-white rounded-2xl border border-[#cbd8d6]">
          Будь ласка, оберіть активного ФОП з працівниками для відображення табеля.
        </div>
      ) : !previewData || previewData.rows.length === 0 ? (
        <div className="p-12 text-center text-xs font-extrabold text-[#556e75] bg-white rounded-2xl border border-[#cbd8d6]">
          У обраного ФОП немає оформлених працівників у цьому місяці/періоді.
        </div>
      ) : (
        <div
          className="flex flex-col gap-8 transition-all duration-150 origin-top-left w-full"
          onWheel={handleWheelZoom}
          style={{ zoom: zoomLevel }}
        >
          {groupedMonthSections.map((section, sectionIdx) => {
            const daysInThisMonth = section.rows[0]?.days.length || 31;
            return (
              <div
                key={section.monthName}
                className="bg-white rounded-[24px] border border-[#cbd8d6] shadow-xl overflow-hidden flex flex-col"
              >
                {/* Month Section Header */}
                <div className="p-3.5 px-6 bg-[#133b47] text-white flex items-center justify-between gap-4 border-b border-[#2a5b6c]">
                  <div className="flex items-center gap-3">
                    <CalendarDaysIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.2]" />
                    <h4 className="text-sm font-black uppercase tracking-wide text-[#f8a44c]">
                      {section.monthName}
                    </h4>
                    <span className="text-xs font-bold text-[#c3d9d6] bg-white/10 px-3 py-0.5 rounded-full border border-white/10">
                      Працівників: {section.rows.length} осіб
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar select-none">
                  <table className="w-full border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#133b47] to-[#184856]">
                        <th className="p-2 text-center text-white font-black text-[10px] border-r border-white/10 w-8">№</th>
                        <th className="p-2 text-center text-white font-black text-[10px] border-r border-white/10 w-16">Таб.№</th>
                        <th className="p-2 text-center text-white font-black text-[10px] border-r border-white/10 w-8">Ст.</th>
                        <th className="p-2 text-left text-white font-black text-[10px] border-r border-white/10 min-w-[140px]">ПІБ, посада</th>
                        {/* Day columns */}
                        {Array.from({ length: daysInThisMonth }, (_, i) => i + 1).map((d) => {
                          const isWeekend = section.rows[0]?.days[d - 1]?.is_weekday === false;
                          return (
                            <th
                              key={d}
                              className={`p-1 text-center font-black text-[10px] border-r border-white/10 w-8 ${
                                isWeekend ? "bg-[#0f2e38] text-[#f8a44c]" : "text-white"
                              }`}
                            >
                              {d}
                            </th>
                          );
                        })}
                        <th className="p-2 text-center text-[#f8a44c] font-black text-[10px] border-r border-white/10 w-10">Днів</th>
                        <th className="p-2 text-center text-[#f8a44c] font-black text-[10px] border-r border-white/10 w-12">Годин</th>
                        <th className="p-2 text-center text-[#f8a44c] font-black text-[10px] w-16">Ставка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row, idx) => {
                        const rYear = row.year || selectedYear;
                        const rMonth = row.month || selectedMonth;

                        return (
                          <React.Fragment key={`${section.monthName}-${rYear}-${rMonth}-${row.worker_id}`}>
                            {/* Hours row */}
                            <tr className={`${idx % 2 === 0 ? "bg-[#f8faf9]" : "bg-white"} border-b border-[#e2eceb]`}>
                              <td rowSpan={2} className="p-1.5 text-center text-[#556e75] font-mono text-[10px] border-r border-[#e2eceb] font-bold">
                                {idx + 1}
                              </td>
                              <td rowSpan={2} className="p-1.5 text-center text-[#133b47] font-mono text-[10px] border-r border-[#e2eceb] font-black">
                                {row.worker_kod}
                              </td>
                              <td rowSpan={2} className="p-1.5 text-center text-[#556e75] font-mono text-[10px] border-r border-[#e2eceb]">
                                {row.nem}
                              </td>
                              <td rowSpan={2} className="p-1.5 text-left text-[#133b47] text-[10px] border-r border-[#e2eceb] font-bold leading-tight">
                                {row.pib_posada}
                              </td>
                              {row.days.map((day) => {
                                const isWeekend = !day.is_weekday;
                                const isSelected = isCellSelected(rYear, rMonth, row.worker_id, day.day);

                                return (
                                  <td
                                    key={`h-${day.day}`}
                                    className={`p-0 text-center font-mono text-[10px] border-r border-[#e2eceb] cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-[#e3f2fd] text-[#0d47a1] font-black ring-2 ring-inset ring-[#1976d2] z-10"
                                        : isWeekend
                                        ? "bg-[#f0f4f3] text-[#a0b5b0]"
                                        : day.hours > 0
                                        ? "text-[#133b47] font-bold hover:bg-[#e6f4f1]"
                                        : "text-[#cbd8d6] hover:bg-[#f4f9f8]"
                                    }`}
                                    onMouseDown={(e) => handleCellMouseDown(e, sectionIdx, idx, day.day, rYear, rMonth, row.worker_id)}
                                    onMouseEnter={() => handleCellMouseEnter(sectionIdx, idx, day.day, rYear, rMonth)}
                                    onDoubleClick={() => handleCellDoubleClick(row.worker_id, day.day, rYear, rMonth)}
                                  >
                                    <div>{day.hours > 0 ? day.hours : ""}</div>
                                  </td>
                                );
                              })}
                              <td rowSpan={2} className="p-1.5 text-center font-mono text-[11px] font-black text-[#133b47] border-r border-[#e2eceb] bg-[#e6f4f1]">
                                {row.total_days}
                              </td>
                              <td rowSpan={2} className="p-1.5 text-center font-mono text-[11px] font-black text-[#133b47] border-r border-[#e2eceb] bg-[#e6f4f1]">
                                {row.total_hours}
                              </td>
                              <td rowSpan={2} className="p-1.5 text-right font-mono text-[11px] font-black text-[#133b47] pr-3">
                                {row.rate.toLocaleString("uk-UA")}
                              </td>
                            </tr>
                            {/* Code row */}
                            <tr className={`${idx % 2 === 0 ? "bg-[#f8faf9]" : "bg-white"} border-b-2 border-[#cbd8d6]`}>
                              {row.days.map((day) => {
                                const isWeekend = !day.is_weekday;
                                const isSelected = isCellSelected(rYear, rMonth, row.worker_id, day.day);

                                return (
                                  <td
                                    key={`c-${day.day}`}
                                    className={`p-0 text-center text-[9px] border-r border-[#e2eceb] cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-[#e3f2fd] text-[#1976d2] font-black ring-2 ring-inset ring-[#1976d2] z-10"
                                        : isWeekend
                                        ? "bg-[#f0f4f3] text-[#a0b5b0]"
                                        : day.code
                                        ? "text-[#f8a44c] font-black hover:bg-[#e6f4f1]"
                                        : "text-[#cbd8d6] hover:bg-[#f4f9f8]"
                                    }`}
                                    onMouseDown={(e) => handleCellMouseDown(e, sectionIdx, idx, day.day, rYear, rMonth, row.worker_id)}
                                    onMouseEnter={() => handleCellMouseEnter(sectionIdx, idx, day.day, rYear, rMonth)}
                                    onDoubleClick={() => handleCellDoubleClick(row.worker_id, day.day, rYear, rMonth)}
                                  >
                                    {day.code}
                                  </td>
                                );
                              })}
                            </tr>
                          </React.Fragment>
                        );
                      })}
                      {/* Month Totals Row */}
                      <tr className="bg-gradient-to-r from-[#133b47] to-[#184856]">
                        <td colSpan={4} className="p-2 text-left text-white font-black text-[11px] pl-4">
                          РАЗОМ ({section.monthName}):
                        </td>
                        {Array.from({ length: daysInThisMonth }).map((_, i) => (
                          <td key={`t-${i}`} className="border-r border-white/10"></td>
                        ))}
                        <td className="p-2 text-center text-[#f8a44c] font-black text-[11px] font-mono">
                          {section.rows.reduce((s, r) => s + r.total_days, 0)}
                        </td>
                        <td className="p-2 text-center text-[#f8a44c] font-black text-[11px] font-mono">
                          {section.rows.reduce((s, r) => s + r.total_hours, 0)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── DAY CODE PICKER MODAL WITH SEARCH ───────────────────────── */}
      {isPickerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[28px] border-2 border-[#cbd8d6] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-modalScale">
            {/* Modal Header */}
            <div className="bg-[#133b47] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#f8a44c]">
                  <TableCellsIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-black text-base font-heading">
                    {singleTargetCell
                      ? `Обирайте код для дня ${singleTargetCell.day}`
                      : `Обирайте код для ${selectedCellKeys.size} вибраних днів`}
                  </h3>
                  <p className="text-[11px] text-[#c3d9d6] font-bold">
                    Оберіть відповідний умовний позначник та години
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPickerModalOpen(false);
                  setSingleTargetCell(null);
                }}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-[#e2eceb] bg-[#f8faf9] flex items-center gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-5 h-5 text-[#556e75] absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.2]" />
                <input
                  type="text"
                  placeholder="Пошук за кодом або назвою (напр: Р, ВП, лікарняний...)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-9 rounded-xl bg-white border-2 border-[#bdcdcb] focus:border-[#133b47] text-[#133b47] font-extrabold text-xs focus:outline-none transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Optional Custom Hours override input */}
              <div className="w-28 flex flex-col">
                <label className="text-[9px] font-black uppercase text-[#556e75] tracking-wider">
                  Годин (опц.)
                </label>
                <input
                  type="number"
                  placeholder="авто"
                  value={customHoursOverride}
                  onChange={(e) => setCustomHoursOverride(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-white border-2 border-[#bdcdcb] focus:border-[#133b47] text-[#133b47] font-extrabold text-xs text-center focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Code Options List */}
            <div className="p-3 overflow-y-auto max-h-[50vh] custom-scrollbar flex flex-col gap-1.5">
              {filteredCodes.length > 0 ? (
                filteredCodes.map((tc) => (
                  <button
                    key={tc.code || "clear"}
                    onClick={() => applyCodeSelection(tc)}
                    className="w-full p-3 rounded-2xl border-2 border-[#e2eceb] hover:border-[#133b47] hover:bg-[#e6f4f1] transition-all flex items-center justify-between text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#133b47]/10 group-hover:bg-[#133b47] text-[#133b47] group-hover:text-[#f8a44c] font-black text-sm flex items-center justify-center transition-all shrink-0">
                        {tc.code || "✕"}
                      </div>
                      <span className="font-extrabold text-xs text-[#133b47] group-hover:text-[#133b47] truncate">
                        {tc.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {tc.defaultHours > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#e6f4f1] group-hover:bg-white text-[#133b47] font-black text-[11px]">
                          {tc.defaultHours}г
                        </span>
                      )}
                      <span className="text-xs font-black text-[#f8a44c] group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-[#556e75] font-bold text-xs">
                  Нічого не знайдено за запитом "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
