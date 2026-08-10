import React, { useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  FolderOpenIcon,
  DocumentArrowDownIcon,
  BuildingOffice2Icon,
  PlusIcon,
  TrashIcon,
  CalendarDaysIcon,
  ArrowTopRightOnSquareIcon,
  UserGroupIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { FopData, ShtatPositionItem, GenerateShtatDocxRequest } from "../types/fop";
import { generateShtatDocx, ensureFopDirectory, openFolderInExplorer } from "../services/fopService";
import { CustomDatePicker } from "./CustomDatePicker";

interface ShtatGeneratorViewProps {
  fops: FopData[];
  selectedFopId: number | null;
  rootFolder: string;
  minWage: number;
  onShowToast: (msg: string) => void;
  onBack: () => void;
}

const MONTH_NAMES_GENITIVE = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
];

export function formatIsoToUkrDate(isoStr: string): string {
  if (!isoStr || !isoStr.includes("-")) return "01 січня 2026 р.";
  const parts = isoStr.split("-").map((p) => parseInt(p, 10));
  const year = parts[0] || 2026;
  const monthIdx = Math.max(0, Math.min(11, (parts[1] || 1) - 1));
  const day = String(parts[2] || 1).padStart(2, "0");
  const monthName = MONTH_NAMES_GENITIVE[monthIdx] || "січня";
  return `${day} ${monthName} ${year} р.`;
}

export const ShtatGeneratorView: React.FC<ShtatGeneratorViewProps> = ({
  fops,
  selectedFopId,
  rootFolder,
  minWage,
  onShowToast,
  onBack,
}) => {
  const activeFop = fops.find((f) => f.id === selectedFopId) || null;
  const activeFopName = activeFop
    ? [activeFop.vezeteknev, activeFop.keresztnev, activeFop.apai_nev].filter(Boolean).join(" ")
    : "";
  const activeFopCode = activeFop ? activeFop.kod || activeFop.fop_kod || "" : "";

  // Date selection state: ISO string YYYY-MM-DD
  const today = new Date();
  const defaultIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const [isoDate, setIsoDate] = useState<string>(defaultIso);

  const dateStr = formatIsoToUkrDate(isoDate);

  const [items, setItems] = useState<ShtatPositionItem[]>([]);
  const [generatedFilePath, setGeneratedFilePath] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (!activeFop || !activeFop.munkasok) {
      setItems([]);
      return;
    }

    const activeWorkers = activeFop.munkasok.filter((w) => !w.munkaviszony_vege);
    const positionMap: Map<string, { units: number; base_salary: number; allowances: number }> = new Map();

    for (const w of activeWorkers) {
      const posName = (w.foglalkozas_megnevezes || "Працівник").trim();
      const unitAdd = w.teljes_munkaido ? 1.0 : 0.5;
      const salary = w.fizetes > 0 ? w.fizetes : minWage;

      if (!positionMap.has(posName)) {
        positionMap.set(posName, { units: unitAdd, base_salary: salary, allowances: 0 });
      } else {
        const existing = positionMap.get(posName)!;
        existing.units += unitAdd;
        if (salary > existing.base_salary) {
          existing.base_salary = salary;
        }
      }
    }

    const aggregatedItems: ShtatPositionItem[] = Array.from(positionMap.entries()).map(([posName, data]) => ({
      position_name: posName,
      units: data.units,
      base_salary: data.base_salary,
      allowances: data.allowances,
      total_fund: data.units * data.base_salary,
    }));

    if (aggregatedItems.length === 0) {
      aggregatedItems.push({
        position_name: "Продавець продовольчих товарів",
        units: 0.5,
        base_salary: minWage,
        allowances: 0,
        total_fund: 0.5 * minWage,
      });
    }

    setItems(aggregatedItems);
  }, [activeFop, minWage]);

  const handleUpdateItem = (index: number, field: keyof ShtatPositionItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      const updated = { ...next[index], [field]: value };

      if (field === "units" || field === "base_salary" || field === "allowances") {
        const u = Number(updated.units) || 0;
        const b = Number(updated.base_salary) || 0;
        const a = Number(updated.allowances) || 0;
        updated.total_fund = (u * b) + a;
      }
      next[index] = updated;
      return next;
    });
  };

  const handleAddPositionRow = () => {
    setItems((prev) => [
      ...prev,
      {
        position_name: "Нова посада",
        units: 1.0,
        base_salary: minWage,
        allowances: 0,
        total_fund: minWage,
      },
    ]);
  };

  const handleRemovePositionRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalUnits = items.reduce((acc, item) => acc + item.units, 0);
  const totalPayrollFund = items.reduce((acc, item) => acc + item.total_fund, 0);

  const formatUnitDisplay = (u: number) => (u % 1 === 0 ? u.toFixed(0) : u.toFixed(1).replace(".", ","));
  const formatMoneyDisplay = (val: number) =>
    val.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " грн";

  const handleGenerateShtatDocx = async () => {
    if (!rootFolder) {
      onShowToast("Спочатку оберіть головну папку збереження в Налаштуваннях!");
      return;
    }
    if (!activeFop) {
      onShowToast("Спочатку оберіть активного ФОП зі списку!");
      return;
    }

    setIsGenerating(true);
    try {
      const saveDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);

      const req: GenerateShtatDocxRequest = {
        fop_id: activeFop.id,
        fop_name: activeFopName,
        date_str: dateStr.trim(),
        items: items,
        save_dir: saveDir || undefined,
      };

      const pathResult = await generateShtatDocx(req);
      setGeneratedFilePath(pathResult);
      onShowToast("Штатний розпис успішно згенеровано у папку ФОП!");
    } catch (err) {
      console.error("Failed to generate Shtat DOCX:", err);
      onShowToast(`Помилка під час генерації: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenFolder = async () => {
    if (generatedFilePath) {
      const dirPath = generatedFilePath.substring(0, Math.max(generatedFilePath.lastIndexOf('/'), generatedFilePath.lastIndexOf('\\')));
      await openFolderInExplorer(dirPath);
    } else if (rootFolder && activeFop) {
      const saveDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
      if (saveDir) await openFolderInExplorer(saveDir);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-12 w-full font-sans">
      {/* 1. ELEGANT TOP HEADER CONTROL BAR */}
      <div className="bg-[#133b47] rounded-[28px] p-5 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 border border-[#133b47]">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-[#f8a44c] flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/15 hover:scale-105 active:scale-95"
            title="Назад до вибору документів"
          >
            <ArrowLeftIcon className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#f8a44c] text-[#133b47] flex items-center justify-center font-bold shadow-md shrink-0 border border-amber-300/30">
              <BuildingOffice2Icon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight leading-tight text-white font-heading">
                Штатний розпис
              </h2>
              <p className="text-xs text-[#b0cbce] font-medium mt-0.5">
                {activeFopName || "Оберіть ФОП у верхньому меню"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
          <button
            onClick={handleGenerateShtatDocx}
            disabled={isGenerating || !activeFop}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#f8a44c] to-[#e08e36] text-[#133b47] font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-amber-300/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentArrowDownIcon className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>{isGenerating ? "Формування..." : "Згенерувати .docx"}</span>
          </button>

          {generatedFilePath && (
            <button
              onClick={handleOpenFolder}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border border-white/15"
              title="Відкрити папку у Провіднику"
            >
              <FolderOpenIcon className="w-4.5 h-4.5 stroke-[2]" />
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* 2. REQUISITES & METRICS TOP GRID (SYMMETRICAL HARMONIOUS CARDS AT EQUAL HEIGHT H-11) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* CARD 1: DATE SELECTION */}
        <div className="bg-white rounded-[24px] p-5 border border-[#cbd8d6] shadow-sm flex flex-col justify-between gap-3.5 hover:shadow-md transition-all">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[#354f57]">
            <div className="w-7 h-7 rounded-lg bg-[#133b47]/10 text-[#133b47] flex items-center justify-center font-bold shrink-0">
              <CalendarDaysIcon className="w-4 h-4 stroke-[2]" />
            </div>
            <span>Дата введення в дію</span>
          </div>

          <div className="w-full">
            <CustomDatePicker
              label=""
              value={isoDate}
              onChange={(newDateStr) => setIsoDate(newDateStr)}
            />
          </div>
        </div>

        {/* CARD 2: TOTAL STAFF UNITS METRIC */}
        <div className="bg-white rounded-[24px] p-5 border border-[#cbd8d6] shadow-sm flex flex-col justify-between gap-3.5 hover:shadow-md transition-all">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[#354f57]">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <UserGroupIcon className="w-4 h-4 stroke-[2]" />
            </div>
            <span>Штатні одиниці</span>
          </div>

          <div className="h-11 flex items-center gap-2">
            <span className="text-2xl font-bold text-[#133b47] font-heading leading-none">
              {formatUnitDisplay(totalUnits)}
            </span>
            <span className="text-xs font-semibold text-[#556e75]">штатних одиниць</span>
          </div>
        </div>

        {/* CARD 3: TOTAL MONTHLY PAYROLL FUND METRIC */}
        <div className="bg-white rounded-[24px] p-5 border border-[#cbd8d6] shadow-sm flex flex-col justify-between gap-3.5 hover:shadow-md transition-all">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <BanknotesIcon className="w-4 h-4 stroke-[2]" />
            </div>
            <span>Місячний фонд зарплати</span>
          </div>

          <div className="h-11 flex items-center">
            <span className="text-2xl font-bold text-emerald-900 font-heading leading-none">
              {formatMoneyDisplay(totalPayrollFund)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. POSITIONS TABLE (SEAMLESS FORM INPUTS INTEGRATED INTO CLEAN DOCUMENT TABLE) */}
      <div className="bg-white rounded-[28px] p-6 border border-[#cbd8d6] shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#e2eceb]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center font-bold text-xs shadow-xs">
              <BuildingOffice2Icon className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-[#133b47]">
              Посади та посадові оклади працівників
            </h3>
          </div>

          <button
            onClick={handleAddPositionRow}
            className="px-4 py-2.5 rounded-xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4 stroke-[2.5]" />
            <span>Додати посаду</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#cbd8d6]">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-[#133b47] text-[#f8a44c] text-xs font-bold uppercase tracking-wider">
                <th className="p-3.5 text-center w-12">№</th>
                <th className="p-3.5">Посада</th>
                <th className="p-3.5 text-center w-36">Штатних од.</th>
                <th className="p-3.5 text-right w-44">Оклад (грн)</th>
                <th className="p-3.5 text-right w-36">Надбавки (грн)</th>
                <th className="p-3.5 text-right w-48">Місячний фонд (грн)</th>
                <th className="p-3.5 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2eceb] text-xs text-[#133b47]">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#f8faf9]/80 transition-colors group">
                  <td className="p-3 text-center font-semibold text-[#556e75]">{idx + 1}</td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.position_name}
                      onChange={(e) => handleUpdateItem(idx, "position_name", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-transparent border border-transparent hover:border-[#cbd8d6] hover:bg-white focus:bg-white focus:border-[#133b47] focus:ring-2 focus:ring-[#133b47]/10 text-xs font-semibold text-[#133b47] transition-all"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={item.units}
                      onChange={(e) => handleUpdateItem(idx, "units", Number(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 rounded-lg bg-transparent border border-transparent hover:border-[#cbd8d6] hover:bg-white focus:bg-white focus:border-[#133b47] focus:ring-2 focus:ring-[#133b47]/10 text-xs font-semibold text-center text-[#133b47] transition-all"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      step="100"
                      value={item.base_salary}
                      onChange={(e) => handleUpdateItem(idx, "base_salary", Number(e.target.value) || 0)}
                      className="w-28 px-2.5 py-1.5 rounded-lg bg-transparent border border-transparent hover:border-[#cbd8d6] hover:bg-white focus:bg-white focus:border-[#133b47] focus:ring-2 focus:ring-[#133b47]/10 text-xs font-semibold text-right text-[#133b47] transition-all"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      step="10"
                      value={item.allowances}
                      onChange={(e) => handleUpdateItem(idx, "allowances", Number(e.target.value) || 0)}
                      className="w-24 px-2.5 py-1.5 rounded-lg bg-transparent border border-transparent hover:border-[#cbd8d6] hover:bg-white focus:bg-white focus:border-[#133b47] focus:ring-2 focus:ring-[#133b47]/10 text-xs font-semibold text-right text-[#133b47] transition-all"
                    />
                  </td>
                  <td className="p-3.5 text-right font-bold text-[#133b47] text-sm">
                    {formatMoneyDisplay(item.total_fund)}
                  </td>
                  <td className="p-3 text-center">
                    {items.length > 1 && (
                      <button
                        onClick={() => handleRemovePositionRow(idx)}
                        className="p-1.5 rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Видалити"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#f8faf9] border-t-2 border-[#cbd8d6] font-bold text-xs text-[#133b47]">
                <td className="p-3.5"></td>
                <td className="p-3.5 uppercase tracking-wider">Всього</td>
                <td className="p-3.5 text-center text-sm">{formatUnitDisplay(totalUnits)}</td>
                <td className="p-3.5"></td>
                <td className="p-3.5"></td>
                <td className="p-3.5 text-right text-base text-emerald-900">{formatMoneyDisplay(totalPayrollFund)}</td>
                <td className="p-3.5"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
