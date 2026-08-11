import React, { useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  PlusIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";
import { FopData, Munkas, GrafikWorkerItem } from "../types/fop";
import { CustomDatePicker } from "./CustomDatePicker";
import { CustomMonthYearPicker } from "./CustomMonthYearPicker";
import { CustomPeriodRangePicker } from "./CustomPeriodRangePicker";
import { WorkerCard } from "./WorkerCard";
import { generateGrafikDocx, ensureFopDirectory, openFolderInExplorer } from "../services/fopService";

interface GrafikGeneratorViewProps {
  fops: FopData[];
  selectedFopId: number | null;
  rootFolder: string;
  onShowToast: (msg: string) => void;
  onBack: () => void;
  onEditWorker?: (worker: Munkas) => void;
  onDeleteWorker?: (worker: Munkas) => void;
  onAddWorker?: (fopId: number) => void;
}

const MONTH_NAMES_UKR = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
];

function formatUkrainianDateString(isoDateStr: string): string {
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return isoDateStr;
  const dayInt = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const yearStr = parts[0];
  const dayFormatted = dayInt < 10 ? `0${dayInt}` : `${dayInt}`;
  const monthName = MONTH_NAMES_UKR[monthIdx] || "";
  return `${dayFormatted} ${monthName} ${yearStr}р.`;
}

function formatDateDDMMYYYY(d: Date): string {
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Period calculation logic:
 * Working period = start_date to start_date + 1 year - 1 day.
 * Iterates until pEnd's year (end date) reaches or covers current creation date's year.
 */
function calculateWorkerPeriodAndMonth(startDateStr: string | undefined, currentIsoDate: string) {
  const currentYear = parseInt(currentIsoDate.split("-")[0], 10) || new Date().getFullYear();

  let sYear = currentYear;
  let sMonth = 1;
  let sDay = 1;

  if (startDateStr) {
    if (startDateStr.includes("-")) {
      const p = startDateStr.split("-");
      sYear = parseInt(p[0], 10) || currentYear;
      sMonth = parseInt(p[1], 10) || 1;
      sDay = parseInt(p[2], 10) || 1;
    } else if (startDateStr.includes(".")) {
      const p = startDateStr.split(".");
      sDay = parseInt(p[0], 10) || 1;
      sMonth = parseInt(p[1], 10) || 1;
      sYear = parseInt(p[2], 10) || currentYear;
    }
  }

  let pStart = new Date(sYear, sMonth - 1, sDay);
  let pEnd = new Date(sYear + 1, sMonth - 1, sDay - 1);

  // Period is aligned so that its END DATE (pEnd.getFullYear()) is in or after currentYear
  while (pEnd.getFullYear() < currentYear) {
    pStart.setFullYear(pStart.getFullYear() + 1);
    pEnd.setFullYear(pEnd.getFullYear() + 1);
  }

  const periodStr = `${formatDateDDMMYYYY(pStart)}-${formatDateDDMMYYYY(pEnd)}`;

  // Last month of the working period as vacation month (MM.YYYY)
  const vacMonthNum = (pEnd.getMonth() + 1).toString().padStart(2, "0");
  const vacYear = pEnd.getFullYear();
  const vacationMonthStr = `${vacMonthNum}.${vacYear}`;

  return { periodStr, vacationMonthStr, vacYear };
}

export const GrafikGeneratorView: React.FC<GrafikGeneratorViewProps> = ({
  fops,
  selectedFopId,
  rootFolder,
  onShowToast,
  onBack,
  onEditWorker,
  onDeleteWorker,
  onAddWorker,
}) => {
  const activeFop = fops.find((f) => f.id === selectedFopId) || null;
  const activeFopName = activeFop
    ? [activeFop.vezeteknev, activeFop.keresztnev, activeFop.apai_nev].filter(Boolean).join(" ")
    : "";
  const activeFopCode = activeFop ? activeFop.kod || activeFop.fop_kod || "" : "";

  // Creation Date (default today)
  const [isoDate, setIsoDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedPath, setLastGeneratedPath] = useState<string>("");

  // Worker Schedule Items State
  const [items, setItems] = useState<GrafikWorkerItem[]>([]);

  // Recalculate schedule items when active FOP or creation date changes
  useEffect(() => {
    if (!activeFop || !activeFop.munkasok) {
      setItems([]);
      return;
    }

    const targetDate = new Date(isoDate);

    // EXCLUDE DISMISSED WORKERS (where munkaviszony_vege exists and <= targetDate)
    const activeWorkers = activeFop.munkasok.filter((w: Munkas) => {
      if (w.munkaviszony_vege) {
        const endDate = new Date(w.munkaviszony_vege);
        if (!isNaN(endDate.getTime()) && endDate <= targetDate) {
          return false; // Dismissed -> exclude from Grafik
        }
      }
      return true;
    });

    const initialItems: GrafikWorkerItem[] = activeWorkers.map((w: Munkas) => {
      const workerName = [w.vezeteknev, w.keresztnev, w.apai_nev].filter(Boolean).join(" ");
      const posName = w.foglalkozas_megnevezes || "Продавець продовольчих товарів";
      const { periodStr, vacationMonthStr } = calculateWorkerPeriodAndMonth(w.munkakezdes_datum, isoDate);

      return {
        position_name: posName,
        worker_name: workerName,
        vacation_type: "основний",
        vacation_month: vacationMonthStr,
        working_period: periodStr,
      };
    });

    setItems(initialItems);
  }, [activeFop, isoDate]);

  // Calculate Title Year Span:
  // If creation date year (Дата складання) != vacation month year (Szabadság місяць/рік): "CreationYear-VacationYear"
  // Otherwise if equal: "VacationYear"
  const calculateYearSpanStr = (): string => {
    const creationYear = parseInt(isoDate.split("-")[0], 10) || new Date().getFullYear();

    if (items.length === 0) {
      return `${creationYear}`;
    }

    const vacationYears = new Set<number>();
    items.forEach((item) => {
      // Primary: vacation_month ("MM.YYYY")
      if (item.vacation_month && item.vacation_month.includes(".")) {
        const vmParts = item.vacation_month.trim().split(".");
        if (vmParts.length >= 2) {
          const y = parseInt(vmParts[vmParts.length - 1], 10);
          if (!isNaN(y)) vacationYears.add(y);
        }
      }
      // Fallback: working_period ("DD.MM.YYYY-DD.MM.YYYY")
      if (vacationYears.size === 0 && item.working_period) {
        const pParts = item.working_period.toString().split("-");
        if (pParts.length >= 2) {
          const endDateStr = pParts[1].trim();
          const dParts = endDateStr.split(".");
          if (dParts.length === 3) {
            const y = parseInt(dParts[2], 10);
            if (!isNaN(y)) vacationYears.add(y);
          }
        }
      }
    });

    if (vacationYears.size === 0) {
      return `${creationYear}`;
    }

    const minVacYear = Math.min(...Array.from(vacationYears));
    const maxVacYear = Math.max(...Array.from(vacationYears));

    if (creationYear !== maxVacYear) {
      return `${creationYear}-${maxVacYear}`;
    } else {
      if (minVacYear !== maxVacYear) {
        return `${minVacYear}-${maxVacYear}`;
      }
      return `${maxVacYear}`;
    }
  };

  const handleItemChange = (index: number, field: keyof GrafikWorkerItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!activeFop) {
      onShowToast("Спочатку оберіть активного ФОП зі списку!");
      return;
    }
    if (items.length === 0) {
      onShowToast("У обраного ФОП немає активних (працюючих) працівників!");
      return;
    }

    try {
      setIsGenerating(true);
      let targetDir = "";
      if (rootFolder) {
        const fopDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
        if (fopDir) {
          targetDir = `${fopDir}\\кадрові документи`;
        }
      }

      const formattedDate = formatUkrainianDateString(isoDate);
      const yearSpanStr = calculateYearSpanStr();

      const docPath = await generateGrafikDocx({
        fop_id: activeFop.id,
        fop_name: activeFopName,
        date_str: formattedDate,
        year_span_str: yearSpanStr,
        items,
        save_dir: targetDir || undefined,
      });

      setLastGeneratedPath(docPath);
      onShowToast(`Графік відпусток успішно створено: ${docPath}`);
    } catch (err: any) {
      console.error("Error generating Grafik docx:", err);
      onShowToast(`Помилка генерації Графіка відпусток: ${err?.toString() || "Невідома помилка"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenExplorerFolder = async () => {
    if (lastGeneratedPath) {
      const folderPath = lastGeneratedPath.substring(0, Math.max(lastGeneratedPath.lastIndexOf("\\"), lastGeneratedPath.lastIndexOf("/")));
      await openFolderInExplorer(folderPath || lastGeneratedPath);
    } else if (rootFolder && activeFop) {
      const fopDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
      if (fopDir) {
        const kadroviDir = `${fopDir}\\кадрові документи`;
        await openFolderInExplorer(kadroviDir);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-12 w-full font-sans">
      {/* 1. HEADER CONTROL BAR (Matching Tabel & Payroll View Header) */}
      <div className="bg-[#133b47] rounded-[28px] p-5 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-5 relative z-10">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <button
            onClick={onBack}
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight leading-tight">
                  Графік відпусток
                </h2>
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-[#f8a44c] text-[#133b47] shadow-xs">
                  на {calculateYearSpanStr()} р.
                </span>
              </div>
              <p className="text-xs text-[#c3d9d6] font-medium mt-0.5">
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

        {/* DATE SELECTION & GENERATE BUTTON (Inline Pill Layout with Folder Open Icon) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-3 bg-white/10 p-1.5 px-4 rounded-2xl border border-white/15 shadow-xs w-full sm:w-auto">
            <span className="text-xs font-bold text-[#c3d9d6] shrink-0">
              Дата складання:
            </span>
            <div className="w-44 text-[#133b47]">
              <CustomDatePicker
                label=""
                value={isoDate}
                onChange={(newDateStr) => setIsoDate(newDateStr)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !activeFop || items.length === 0}
              className="h-11 px-6 rounded-2xl bg-gradient-to-r from-[#f8a44c] to-[#e08e36] text-[#133b47] font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 border border-amber-300/30"
            >
              <DocumentArrowDownIcon className="w-5 h-5 stroke-[2.5]" />
              <span>{isGenerating ? "Формування..." : "Згенерувати .docx"}</span>
            </button>

            {Boolean(lastGeneratedPath) && (
              <button
                onClick={handleOpenExplorerFolder}
                className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 text-[#f8a44c] flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/15 animate-fadeIn"
                title="Відкрити папку у Провіднику"
              >
                <FolderOpenIcon className="w-5 h-5 stroke-[2.2]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. WORKERS MANAGEMENT SECTION (MATCHING TABEL & PAYROLL VIEWS) */}
      {activeFop && activeFop.munkasok && (
        <div className="bg-white rounded-[24px] border-2 border-[#cbd8d6] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center font-black">
                <UserGroupIcon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-black text-[#133b47]">
                Працівники ФОП ({activeFop.munkasok.length} осіб)
              </h3>
            </div>
            {onAddWorker && (
              <button
                onClick={() => onAddWorker(activeFop.id)}
                className="px-4 py-2.5 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm"
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

      {/* 3. SCHEDULE TABLE CARD */}
      <div className="bg-white rounded-[24px] border-2 border-[#cbd8d6] p-6 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between border-b-2 border-[#cbd8d6] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center font-black">
              <CalendarDaysIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-black text-[#133b47]">
              Працівники у графіку відпусток ({items.length} осіб)
            </h3>
          </div>
          <span className="text-xs text-[#556e75] font-bold">
            (Звільнені працівники автоматично виключені)
          </span>
        </div>

        <div className="overflow-x-auto border-2 border-[#cbd8d6] rounded-2xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#133b47] text-white font-black uppercase text-xs tracking-wider">
                <th className="p-4 text-center border-r border-[#265361] w-14">№</th>
                <th className="p-4 border-r border-[#265361] w-64">Посада</th>
                <th className="p-4 border-r border-[#265361]">ПІП Працівника</th>
                <th className="p-4 border-r border-[#265361] w-40 text-center">Вид відпустки</th>
                <th className="p-4 border-r border-[#265361] w-52 text-center">Місяць відпустки</th>
                <th className="p-4 text-center w-64">Робочий період</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cbd8d6] text-[#133b47] font-bold">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#556e75] font-bold text-sm">
                    Немає працюючих працівників для формування графіку.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#f8faf9] transition-colors">
                    <td className="p-4 text-center border-r border-[#cbd8d6] font-black text-[#556e75] text-sm">
                      {idx + 1}
                    </td>

                    {/* Position: Non-editable static text */}
                    <td className="p-4 border-r border-[#cbd8d6] font-bold text-sm text-[#133b47]">
                      {item.position_name}
                    </td>

                    {/* Worker Full Name */}
                    <td className="p-4 border-r border-[#cbd8d6] font-extrabold text-sm text-[#133b47]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#133b47] text-[#f8a44c] text-sm font-black flex items-center justify-center shrink-0 shadow-2xs">
                          {item.worker_name.charAt(0)}
                        </div>
                        <span className="text-sm font-extrabold text-[#133b47]">{item.worker_name}</span>
                      </div>
                    </td>

                    {/* Vacation Type: Non-editable static pill badge */}
                    <td className="p-4 border-r border-[#cbd8d6] text-center">
                      <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#f4f9f8] text-[#133b47] border border-[#cbd8d6] shadow-2xs">
                        {item.vacation_type || "основний"}
                      </span>
                    </td>

                    {/* Vacation Month: Portal Dropdown Picker */}
                    <td className="p-4 border-r border-[#cbd8d6] text-center">
                      <CustomMonthYearPicker
                        value={item.vacation_month}
                        onChange={(val) => handleItemChange(idx, "vacation_month", val)}
                      />
                    </td>

                    {/* Working Period: Portal Dropdown Picker */}
                    <td className="p-4 text-center">
                      <CustomPeriodRangePicker
                        value={item.working_period.toString()}
                        onChange={(val) => handleItemChange(idx, "working_period", val)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
