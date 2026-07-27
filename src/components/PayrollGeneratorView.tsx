import React, { useState, useEffect, useCallback } from "react";
import {
  TableCellsIcon,
  DocumentArrowDownIcon,
  FolderOpenIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
  UserIcon,
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ScaleIcon,
  ShieldCheckIcon,
  CalculatorIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { FopData, Munkas, PayrollCalculationPreviewDto, PayrollCalculationRowDto } from "../types/fop";
import { WorkerCard } from "./WorkerCard";
import {
  ensureFopDirectory,
  generatePayrollExcel,
  generatePayrollPeriodExcel,
  openFolderInExplorer,
  previewPayroll,
  previewPayrollPeriod,
  saveWorkerKopek,
} from "../services/fopService";
import { CustomDateSelector, MONTH_NAMES_UKR } from "./CustomDateSelector";

interface ActiveFormulaInfo {
  pib: string;
  title: string;
  expression: string;
  result: string;
}

const FORMULA_EXPLANATIONS: Record<string, string> = {
  "ОСНОВНА ЗАРПЛАТА": "Оплата праці за відпраційований час у місяці",
  "НАРАХОВАНО (БРУТТО)": "Загальний дохід (оклад + відпускні/доплати) до податків",
  "ЄДИНИЙ СОЦІАЛЬНИЙ ВНЕСОК": "ЄСВ 22% (сплачується роботодавцем)",
  "ПОДАТОК З ДОХОДІВ (18%)": "ПДФО 18% з нарахованого доходу",
  "ВІЙСЬКОВИЙ ЗБІР (5%)": "Військовий збір 5% на підтримку Збройних Сил України",
  "РАЗОМ УТРИМАНО": "Загальна сума податків до відрахування (ПДФО + ВЗ)",
  "СУМА НА РУКИ": "Чистий дохід до виплати працівникові",
  "АВАНС": "Виплата за першу половину місяця (до 20-го числа)",
  "ЧЕРГОВА ВИПЛАТА": "Основна виплата за другу половину місяця + залишок",
  "ВСЬОГО ВИПЛАЧЕНО": "Загальна фактична сума виплачена працівнику в цьому місяці",
  "ЗАЛИШОК КОПІЙОК": "Залишок копійок, що переноситься на наступний розрахунковий місяць",
};

const renderFormulaIcon = (title: string) => {
  switch (title) {
    case "ОСНОВНА ЗАРПЛАТА":
      return <BriefcaseIcon className="w-5 h-5" />;
    case "НАРАХОВАНО (БРУТТО)":
      return <BanknotesIcon className="w-5 h-5" />;
    case "ЄДИНИЙ СОЦІАЛЬНИЙ ВНЕСОК":
      return <ReceiptPercentIcon className="w-5 h-5" />;
    case "ПОДАТОК З ДОХОДІВ (18%)":
      return <ScaleIcon className="w-5 h-5" />;
    case "ВІЙСЬКОВИЙ ЗБІР (5%)":
      return <ShieldCheckIcon className="w-5 h-5" />;
    case "РАЗОМ УТРИМАНО":
      return <CalculatorIcon className="w-5 h-5" />;
    case "СУМА НА РУКИ":
      return <CurrencyDollarIcon className="w-5 h-5" />;
    case "АВАНС":
      return <CreditCardIcon className="w-5 h-5" />;
    case "ЧЕРГОВА ВИПЛАТА":
      return <ArrowPathIcon className="w-5 h-5" />;
    case "ВСЬОГО ВИПЛАЧЕНО":
      return <CheckCircleIcon className="w-5 h-5" />;
    case "ЗАЛИШОК КОПІЙОК":
      return <SparklesIcon className="w-5 h-5" />;
    default:
      return <CalculatorIcon className="w-5 h-5" />;
  }
};

const BottomFormulaToast: React.FC<{ info: ActiveFormulaInfo | null }> = ({ info }) => {
  if (!info) return null;

  const explanation = FORMULA_EXPLANATIONS[info.title] || "Розрахунок показника відомості";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999999] pointer-events-none max-w-2xl w-[92%] animate-slideUp">
      <div className="bg-[#133b47]/98 backdrop-blur-xl border border-[#f8a44c]/40 text-white rounded-[24px] p-4 px-6 shadow-2xl flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#2a5b6c]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#f8a44c] text-[#133b47] flex items-center justify-center font-black shrink-0 shadow-md">
              {renderFormulaIcon(info.title)}
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[#f8a44c]">
                {info.title}
              </h4>
              <p className="text-[11px] text-[#c3d9d6] font-medium leading-tight mt-0.5">
                {explanation}
              </p>
            </div>
          </div>

          <div className="px-3.5 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/15 shadow-xs shrink-0">
            {info.pib}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-0.5">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-100">
            <span className="text-[#c3d9d6] font-sans font-bold text-[11px]">Формула:</span>
            <span className="bg-[#0b2229] px-3.5 py-1.5 rounded-xl border border-[#2a5b6c] text-white">
              {info.expression}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#f8a44c] text-[#133b47] px-4 py-1.5 rounded-xl font-mono text-xs font-black shadow-md shrink-0">
            <span className="opacity-70">=</span>
            <span>{info.result}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DebouncedNumberInputProps {
  initialValue: number;
  onSave: (val: number) => void;
  className?: string;
  placeholder?: string;
}

const DebouncedNumberInput: React.FC<DebouncedNumberInputProps> = ({
  initialValue,
  onSave,
  className = "",
  placeholder = "0.00",
}) => {
  const formatVal = (v: number) => {
    if (v === undefined || v === null || isNaN(v)) return "0";
    return String(Number(v.toFixed(2)));
  };

  const [valStr, setValStr] = useState<string>(formatVal(initialValue));

  useEffect(() => {
    setValStr(formatVal(initialValue));
  }, [initialValue]);

  const handleBlur = () => {
    const num = parseFloat(valStr) || 0;
    if (Math.abs(num - (initialValue || 0)) > 0.001) {
      onSave(num);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="number"
      step="0.01"
      min="0"
      value={valStr}
      onChange={(e) => setValStr(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      placeholder={placeholder}
    />
  );
};

interface PayrollGeneratorViewProps {
  activeFop: FopData | null;
  rootFolder: string;
  minWage: number;
  onBackToOptions: () => void;
  onShowToast: (msg: string) => void;
  onEditWorker?: (worker: Munkas) => void;
  onDeleteWorker?: (worker: Munkas) => void;
  onAddWorker?: (fopId: number) => void;
}

export const PayrollGeneratorView: React.FC<PayrollGeneratorViewProps> = ({
  activeFop,
  rootFolder,
  minWage,
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
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [workerOverrides, setWorkerOverrides] = useState<
    Record<number, { previous_kopeks: number; manual_addition: number }>
  >({});
  const [previewData, setPreviewData] = useState<PayrollCalculationPreviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedPath, setLastGeneratedPath] = useState<string | null>(null);

  const [activeFormula, setActiveFormula] = useState<ActiveFormulaInfo | null>(null);

  const activeFopName = activeFop
    ? [activeFop.vezeteknev, activeFop.keresztnev, activeFop.apai_nev].filter(Boolean).join(" ")
    : "";
  const activeFopCode = activeFop ? activeFop.kod || activeFop.fop_kod || "" : "";

  const loadPreview = useCallback(async () => {
    if (!activeFop) {
      setPreviewData(null);
      return;
    }
    setIsLoading(true);
    try {
      if (selectionMode === "month") {
        const overridesList = Object.entries(workerOverrides).map(([wId, val]) => ({
          worker_id: Number(wId),
          previous_kopeks: val.previous_kopeks || 0,
          manual_addition: val.manual_addition || 0,
        }));
        const res = (await previewPayroll(
          activeFop.id,
          selectedYear,
          selectedMonth,
          minWage,
          overridesList
        )) as PayrollCalculationPreviewDto;
        setPreviewData(res);
      } else {
        const res = (await previewPayrollPeriod(
          activeFop.id,
          startYear,
          startMonth,
          endYear,
          endMonth,
          minWage
        )) as PayrollCalculationPreviewDto;
        setPreviewData(res);
      }
    } catch (err) {
      console.error("Failed to load payroll preview:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFop, selectionMode, selectedYear, selectedMonth, startYear, startMonth, endYear, endMonth, minWage, workerOverrides]);

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

  const handlePrevKopeksChange = async (workerId: number, targetYear: number, targetMonth: number, num: number) => {
    if (activeFop) {
      try {
        await saveWorkerKopek(workerId, activeFop.id, targetYear, targetMonth, num);
      } catch (err) {
        console.warn("Failed to persist kopek in DB:", err);
      }
    }
    setWorkerOverrides((prev) => ({
      ...prev,
      [workerId]: {
        previous_kopeks: num,
        manual_addition: prev[workerId]?.manual_addition || 0,
      },
    }));
    await loadPreview();
  };

  const handleManualAdditionChange = async (workerId: number, num: number) => {
    setWorkerOverrides((prev) => ({
      ...prev,
      [workerId]: {
        previous_kopeks: prev[workerId]?.previous_kopeks || 0,
        manual_addition: num,
      },
    }));
    await loadPreview();
  };

  const handleCellHover = (pib: string, title: string, expression: string, result: string) => {
    setActiveFormula({
      pib,
      title,
      expression,
      result,
    });
  };

  const handleCellLeave = () => {
    setActiveFormula(null);
  };

  const handleGenerateExcel = async () => {
    if (!activeFop) {
      onShowToast("⚠️ Спочатку оберіть активного ФОП!");
      return;
    }
    if (!rootFolder) {
      onShowToast("⚠️ Спочатку оберіть головну папку збереження в Налаштуваннях!");
      return;
    }
    setIsGenerating(true);
    try {
      const targetDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
      if (selectionMode === "month") {
        const overridesList = Object.entries(workerOverrides).map(([wId, val]) => ({
          worker_id: Number(wId),
          previous_kopeks: val.previous_kopeks || 0,
          manual_addition: val.manual_addition || 0,
        }));
        const generatedFilePath = await generatePayrollExcel({
          fop_id: activeFop.id,
          year: selectedYear,
          month: selectedMonth,
          min_wage: minWage,
          worker_overrides: overridesList,
          save_dir: targetDir || undefined,
        });
        setLastGeneratedPath(generatedFilePath);
        const monthObj = MONTH_NAMES_UKR.find((m) => m.id === selectedMonth);
        onShowToast(`✅ Відомість за ${monthObj?.name || ""} ${selectedYear}р. успішно згенеровано у папку FOP!`);
      } else {
        const generatedFilePath = await generatePayrollPeriodExcel({
          fop_id: activeFop.id,
          start_year: startYear,
          start_month: startMonth,
          end_year: endYear,
          end_month: endMonth,
          min_wage: minWage,
          save_dir: targetDir || undefined,
        });
        setLastGeneratedPath(generatedFilePath);
        const startM = MONTH_NAMES_UKR.find((m) => m.id === startMonth)?.name || "";
        const endM = MONTH_NAMES_UKR.find((m) => m.id === endMonth)?.name || "";
        onShowToast(`✅ Окремі відомості за кожен місяць періоду (${startM} ${startYear} — ${endM} ${endYear}) успішно згенеровано у папку FOP!`);
      }
    } catch (err) {
      console.error("Failed to generate payroll excel:", err);
      onShowToast(`❌ Помилка при генерації відомості: ${err}`);
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

  const groupedMonthSections = React.useMemo(() => {
    if (!previewData || !previewData.rows) return [];
    const map = new Map<string, PayrollCalculationRowDto[]>();
    for (const row of previewData.rows) {
      const monthKey = row.month_name_ukr || previewData.month_name_ukr;
      if (!map.has(monthKey)) map.set(monthKey, []);
      map.get(monthKey)!.push(row);
    }
    return Array.from(map.entries()).map(([monthName, rows]) => {
      const totals = rows.reduce(
        (acc, r) => {
          acc.prev_kopeks += r.prev_kopeks;
          acc.rate += r.rate;
          acc.worked_salary += r.worked_salary;
          acc.manual_addition += r.manual_addition;
          acc.total_salary_m += r.total_salary_m;
          acc.esv_o += r.esv_o;
          acc.pdfo_p += r.pdfo_p;
          acc.vz_q += r.vz_q;
          acc.total_tax_r += r.total_tax_r;
          acc.net_s += r.net_s;
          acc.advance_t += r.advance_t;
          acc.regular_pay_u += r.regular_pay_u;
          acc.total_paid_v += r.total_paid_v;
          acc.remaining_kopeks_w += r.remaining_kopeks_w;
          return acc;
        },
        { prev_kopeks: 0, rate: 0, worked_salary: 0, manual_addition: 0, total_salary_m: 0, esv_o: 0, pdfo_p: 0, vz_q: 0, total_tax_r: 0, net_s: 0, advance_t: 0, regular_pay_u: 0, total_paid_v: 0, remaining_kopeks_w: 0 }
      );
      return { monthName, rows, totals };
    });
  }, [previewData]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-12">
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
              <TableCellsIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                Розрахункова відомість
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
                : `Згенерувати ${calculateMonthCount()} відомостей (.xlsx)`}
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

      <div className="flex items-center justify-between bg-[#f8faf9] p-3 px-6 rounded-2xl border border-[#cbd8d6]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#133b47] text-[#f8a44c] flex items-center justify-center font-black text-xs">
            <UserIcon className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="text-sm font-black text-[#133b47]">
            {selectionMode === "month" ? "Відомість за місяць" : `Період (${groupedMonthSections.length} місяців)`}
          </h3>
          {isLoading && (
            <span className="text-xs font-black text-[#556e75] animate-pulse">
              Перерахунок...
            </span>
          )}
        </div>

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

      {/* ─── WORKERS MANAGEMENT SECTION ON PAYROLL VIEW (BELOW ZOOM BAR, ABOVE TABLE) ─── */}
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

      {!activeFop ? (
        <div className="p-12 text-center text-xs font-extrabold text-[#556e75] bg-white rounded-2xl border border-[#cbd8d6]">
          Будь ласка, оберіть активного ФОП з працівниками для відображення відомості.
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
          {groupedMonthSections.map((section) => (
            <div
              key={section.monthName}
              className="bg-white rounded-[24px] border border-[#cbd8d6] shadow-xl overflow-hidden flex flex-col"
            >
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
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse layout-fixed text-[#133b47] tabular-nums font-extrabold">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-wider text-white bg-[#133b47] border-b border-[#2a5b6c]">
                      <th colSpan={4} className="p-1.5 text-center border-r border-[#2a5b6c] text-[#c3d9d6]">Працівник</th>
                      <th colSpan={5} className="p-1.5 text-center border-r border-[#2a5b6c] text-[#9de0d3]">Нараховано (Брутто)</th>
                      <th colSpan={4} className="p-1.5 text-center border-r border-[#2a5b6c] text-[#f6b8be]">Утримано (Податки)</th>
                      <th colSpan={1} className="p-1.5 text-center border-r border-[#2a5b6c] text-[#f8a44c]">До сплати</th>
                      <th colSpan={3} className="p-1.5 text-center border-r border-[#2a5b6c] text-[#9ee0f5]">Виплачено</th>
                      <th colSpan={1} className="p-1.5 text-center text-[#fde047]">Залишок</th>
                    </tr>
                    <tr className="bg-[#1e4e5e] text-white text-xs font-black uppercase tracking-tight border-b border-[#133b47]">
                      <th className="p-2 text-center w-6">№</th>
                      <th className="p-2 w-[110px]">П.І.Б.</th>
                      <th className="p-2 w-[80px]">Посада</th>
                      <th className="p-2 text-center w-[60px]">Дні/Год</th>
                      <th className="p-2 text-right bg-[#1c4754] w-[85px]">Залишок</th>
                      <th className="p-2 text-right">Ставка</th>
                      <th className="p-2 text-right">Заробітна</th>
                      <th className="p-2 text-right bg-[#1c4754]">Відпускні</th>
                      <th className="p-2 text-right font-black text-[#9de0d3] bg-[#133b47]">Всього</th>
                      <th className="p-2 text-right text-[#c3d9d6]">ЄСВ</th>
                      <th className="p-2 text-right text-[#c3d9d6]">ПДФО</th>
                      <th className="p-2 text-right text-[#c3d9d6]">ВЗ</th>
                      <th className="p-2 text-right font-black text-[#f6b8be] bg-[#133b47]">Утримано</th>
                      <th className="p-2 text-right font-black text-[#f8a44c] bg-[#133b47]">На руки</th>
                      <th className="p-2 text-right bg-[#1c4754]">Аванс</th>
                      <th className="p-2 text-right bg-[#1c4754]">Чергова</th>
                      <th className="p-2 text-right font-black text-[#9ee0f5] bg-[#133b47]">Виплачено</th>
                      <th className="p-2 text-right font-black text-[#fde047] bg-[#133b47] w-[90px]">Залишок</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#cbd8d6] bg-white text-xs">
                    {section.rows.map((row, idx) => (
                      <tr key={`${row.worker_id}_${section.monthName}`} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2 text-center font-black bg-slate-100/80 text-slate-600 font-mono">{idx + 1}</td>
                        <td className="p-2 font-black text-xs">
                          <div className="whitespace-pre-line leading-tight text-[#133b47]">{row.pib}</div>
                        </td>
                        <td className="p-2 text-[#556e75] text-xs font-semibold">
                          <div className="whitespace-pre-line leading-tight">{row.posada}</div>
                        </td>
                        <td className="p-2 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-[#e2eceb] text-[#133b47] text-xs font-black font-mono border border-[#cbd8d6]">
                            {row.work_days_str}
                          </span>
                        </td>
                        <td className="p-1 text-right">
                          <DebouncedNumberInput
                            initialValue={row.prev_kopeks}
                            onSave={(val) =>
                              handlePrevKopeksChange(
                                row.worker_id,
                                row.year || selectedYear,
                                row.month || selectedMonth,
                                val
                              )
                            }
                            className="w-18 px-2 py-0.5 text-right text-xs font-black font-mono text-[#133b47] bg-white border border-[#cbd8d6] focus:border-[#133b47] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#133b47]"
                          />
                        </td>
                        <td className="p-2 text-right text-[#556e75] font-mono">
                          {row.rate.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td
                          className="p-2 text-right text-[#133b47] font-bold font-mono cursor-help border-b border-dashed border-[#cbd8d6]"
                          onMouseEnter={() =>
                            handleCellHover(
                              row.pib,
                              "ОСНОВНА ЗАРПЛАТА",
                              `${row.rate.toFixed(2)} грн × (${row.work_days_str})`,
                              `${row.worked_salary.toFixed(2)} грн`
                            )
                          }
                          onMouseLeave={handleCellLeave}
                        >
                          {row.worked_salary.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-1 text-right bg-[#e2eceb]/40">
                          <DebouncedNumberInput
                            initialValue={row.manual_addition}
                            onSave={(val) => handleManualAdditionChange(row.worker_id, val)}
                            className="w-14 px-1.5 py-0.5 text-right text-xs font-black font-mono text-[#133b47] bg-white border border-[#cbd8d6] focus:border-[#133b47] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#133b47]"
                          />
                        </td>
                        <td
                          className="p-2 text-right border-x border-[#cbd8d6] cursor-help"
                          onMouseEnter={() =>
                            handleCellHover(
                              row.pib,
                              "НАРАХОВАНО (БРУТТО)",
                              `${row.worked_salary.toFixed(2)} грн + ${row.manual_addition.toFixed(2)} грн`,
                              `${row.total_salary_m.toFixed(2)} грн`
                            )
                          }
                          onMouseLeave={handleCellLeave}
                        >
                          <span className="bg-[#e6f4f1] text-[#0d5c4e] font-black font-mono px-2.5 py-1 rounded-lg border border-[#b2e0d8] shadow-2xs">
                            {row.total_salary_m.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td
                          className="p-2 text-right text-[#556e75] font-mono cursor-help border-b border-dashed border-[#cbd8d6]"
                          onMouseEnter={() =>
                            handleCellHover(
                              row.pib,
                              "ЄДИНИЙ СОЦІАЛЬНИЙ ВНЕСОК",
                              row.is_hired_or_dismissed_this_month
                                ? `${row.total_salary_m.toFixed(2)} грн (прийом/звільнення) × 22%`
                                : row.total_salary_m >= minWage
                                ? `${row.total_salary_m.toFixed(2)} грн (дохід) × 22%`
                                : `${minWage.toFixed(2)} грн (мін. зарплата) × 22%`,
                              `${row.esv_o.toFixed(2)} грн`
                            )
                          }
                          onMouseLeave={handleCellLeave}
                        >
                          {row.esv_o.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td
                          className="p-2 text-right text-[#556e75] font-mono cursor-help border-b border-dashed border-[#cbd8d6]"
                          onMouseEnter={() =>
                            handleCellHover(
                              row.pib,
                              "ПОДАТОК З ДОХОДІВ (18%)",
                              `${row.total_salary_m.toFixed(2)} грн × 18%`,
                              `${row.pdfo_p.toFixed(2)} грн`
                            )
                          }
                          onMouseLeave={handleCellLeave}
                        >
                          {row.pdfo_p.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td
                          className="p-2 text-right text-[#556e75] font-mono cursor-help border-b border-dashed border-[#cbd8d6]"
                          onMouseEnter={() =>
                            handleCellHover(
                              row.pib,
                              "ВІЙСЬКОВИЙ ЗБІР (5%)",
                              `${row.total_salary_m.toFixed(2)} грн × 5%`,
                              `${row.vz_q.toFixed(2)} грн`
                            )
                          }
                          onMouseLeave={handleCellLeave}
                        >
                          {row.vz_q.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td
                          className="p-2 text-right border-x border-[#cbd8d6] cursor-help"
                          onMouseEnter={() =>
                            handleCellHover(
                              row.pib,
                              "РАЗОМ УТРИМАНО",
                              `${row.pdfo_p.toFixed(2)} грн + ${row.vz_q.toFixed(2)} грн`,
                              `${row.total_tax_r.toFixed(2)} грн`
                            )
                          }
                          onMouseLeave={handleCellLeave}
                        >
                          <span className="bg-[#fbeef0] text-[#8c2a38] font-black font-mono px-2.5 py-1 rounded-lg border border-[#f4c8ce] shadow-2xs">
                            {row.total_tax_r.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td
                          className="p-2 text-right border-x border-[#cbd8d6] cursor-help"
                          onMouseEnter={() =>
                            handleCellHover(
                              row.pib,
                              "СУМА НА РУКИ",
                              `${row.total_salary_m.toFixed(2)} грн - ${row.total_tax_r.toFixed(2)} грн`,
                              `${row.net_s.toFixed(2)} грн`
                            )
                          }
                          onMouseLeave={handleCellLeave}
                        >
                          <span className="bg-[#133b47] text-[#f8a44c] font-black font-mono px-3 py-1 rounded-xl border border-[#f8a44c]/40 shadow-xs inline-block">
                            {row.net_s.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td
                          className="p-2 text-right text-[#556e75] font-mono cursor-help border-b border-dashed border-[#cbd8d6]"
                          onMouseEnter={() =>
                            handleCellHover(
                              row.pib,
                              "АВАНС",
                              `(${row.work_days_str}) × ${row.net_s.toFixed(2)} грн`,
                              `${row.advance_t.toFixed(2)} грн`
                            )
                          }
                          onMouseLeave={handleCellLeave}
                        >
                          {row.advance_t.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td
                          className="p-2 text-right text-[#556e75] font-mono cursor-help border-b border-dashed border-[#cbd8d6]"
                          onMouseEnter={() =>
                            handleCellHover(
                              row.pib,
                              "ЧЕРГОВА ВИПЛАТА",
                              `(${row.net_s.toFixed(2)} грн + ${row.prev_kopeks.toFixed(2)} грн) - ${row.advance_t.toFixed(2)} грн`,
                              `${row.regular_pay_u.toFixed(2)} грн`
                            )
                          }
                          onMouseLeave={handleCellLeave}
                        >
                          {row.regular_pay_u.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td
                          className="p-2 text-right border-x border-[#cbd8d6] cursor-help"
                          onMouseEnter={() =>
                            handleCellHover(
                              row.pib,
                              "ВСЬОГО ВИПЛАЧЕНО",
                              `${row.advance_t.toFixed(2)} грн + ${row.regular_pay_u.toFixed(2)} грн`,
                              `${row.total_paid_v.toFixed(2)} грн`
                            )
                          }
                          onMouseLeave={handleCellLeave}
                        >
                          <span className="bg-[#eaf5f9] text-[#165a72] font-black font-mono px-2.5 py-1 rounded-lg border border-[#bce3f0] shadow-2xs">
                            {row.total_paid_v.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td
                          className="p-2 text-right cursor-help"
                          onMouseEnter={() =>
                            handleCellHover(
                              row.pib,
                              "ЗАЛИШОК КОПІЙОК",
                              `(${row.net_s.toFixed(2)} грн + ${row.prev_kopeks.toFixed(2)} грн) - ${row.total_paid_v.toFixed(2)} грн`,
                              `${row.remaining_kopeks_w.toFixed(2)} грн`
                            )
                          }
                          onMouseLeave={handleCellLeave}
                        >
                          <span className="bg-[#fef8ea] text-[#8a5b0f] font-black font-mono px-2.5 py-1 rounded-lg border border-[#fbe3b5] shadow-2xs inline-block">
                            {row.remaining_kopeks_w.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#133b47] text-white font-black text-xs border-t-2 border-[#133b47]">
                      <td colSpan={4} className="p-2.5 text-center uppercase tracking-wider text-[#f8a44c]">
                        Всього за {section.monthName}
                      </td>
                      <td className="p-2.5 text-right font-mono">{section.totals.prev_kopeks.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-mono">{section.totals.rate.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-mono">{section.totals.worked_salary.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-mono">{section.totals.manual_addition.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-black font-mono text-[#9de0d3] bg-[#1e4e5e]">
                        {section.totals.total_salary_m.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-right font-mono text-[#c3d9d6]">{section.totals.esv_o.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-mono text-[#c3d9d6]">{section.totals.pdfo_p.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-mono text-[#c3d9d6]">{section.totals.vz_q.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-black font-mono text-[#f6b8be] bg-[#1e4e5e]">{section.totals.total_tax_r.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-black font-mono text-[#f8a44c] bg-[#1e4e5e]">{section.totals.net_s.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-mono text-[#c3d9d6]">{section.totals.advance_t.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-mono text-[#c3d9d6]">{section.totals.regular_pay_u.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-black font-mono text-[#9ee0f5] bg-[#1e4e5e]">{section.totals.total_paid_v.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-right font-mono text-[#fde047] bg-[#1e4e5e]">{section.totals.remaining_kopeks_w.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CLEAN BOTTOM FORMULA TOAST BAR */}
      <BottomFormulaToast info={activeFormula} />
    </div>
  );
};

