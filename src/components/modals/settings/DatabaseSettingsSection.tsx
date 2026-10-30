import React, { useState, useEffect, useCallback } from "react";
import {
  CircleStackIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  FolderOpenIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  getDatabaseInfo,
  exportDatabase,
  importDatabase,
  openDatabaseFolder,
} from "../../../services/fopService";
import { DatabaseInfo } from "../../../types/fop";

interface DatabaseSettingsSectionProps {
  onShowToast: (msg: string) => void;
  onDatabaseRestored?: () => void;
}

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const DatabaseSettingsSection: React.FC<DatabaseSettingsSectionProps> = ({
  onShowToast,
  onDatabaseRestored,
}) => {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isConfirmingImport, setIsConfirmingImport] = useState<boolean>(false);

  const loadInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const info = await getDatabaseInfo();
      setDbInfo(info);
    } catch (err) {
      console.warn("Помилка отримання інфо про БД:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportDatabase();
      onShowToast(
        `Базу даних успішно експортовано! (${res.fop_count} ФОП, ${res.worker_count} працівників)`
      );
      await loadInfo();
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (!msg.includes("скасовано")) {
        onShowToast(`Помилка експорту: ${msg}`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const res = await importDatabase();
      onShowToast(
        `Базу успішно відновлено! Завантажено: ${res.fop_count} ФОП, ${res.worker_count} працівників.`
      );
      if (res.backup_path) {
        console.log("Автоматичну резервну копію збережено у:", res.backup_path);
      }
      setIsConfirmingImport(false);
      await loadInfo();
      if (onDatabaseRestored) {
        await onDatabaseRestored();
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (!msg.includes("скасовано")) {
        onShowToast(`Помилка імпорту: ${msg}`);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenFolder = async () => {
    try {
      const folder = await openDatabaseFolder();
      onShowToast(`Відкрито папку бази даних: "${folder}"`);
    } catch (err) {
      onShowToast(`Помилка відкриття папки: ${String(err)}`);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-[#f2f7f9] to-[#e6f0f3] border-2 border-[#b8d6df] flex flex-col gap-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#133b47] flex items-center justify-center text-[#f8a44c] shadow-xs">
            <CircleStackIcon className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <span className="text-sm font-black text-[#133b47]">
            База даних та Портативність
          </span>
        </div>

        <button
          type="button"
          onClick={loadInfo}
          disabled={isLoading}
          title="Оновити стан"
          className="p-1.5 rounded-xl text-[#556e75] hover:text-[#133b47] hover:bg-white/60 transition-all cursor-pointer"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-2xl bg-white/95 border border-[#b8d6df] flex flex-col gap-2.5 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#556e75] font-semibold">Файл бази даних:</span>
          <button
            type="button"
            onClick={handleOpenFolder}
            className="inline-flex items-center gap-1 text-[11px] font-black text-[#165a72] hover:text-[#133b47] hover:underline cursor-pointer"
            title="Відкрити папку з базою даних у провіднику"
          >
            <FolderOpenIcon className="w-3.5 h-3.5 stroke-[2.3]" />
            Відкрити папку
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-[#f8faf9] border border-[#cbd8d6] font-mono text-[11px] font-bold text-[#133b47] truncate" title={dbInfo?.db_path || ""}>
          {dbInfo?.db_path || "Шлях визначається..."}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#e2eceb] text-center">
          <div className="p-2 rounded-xl bg-[#f0f7f6] border border-[#cbe3df]">
            <span className="block text-[10px] text-[#556e75] font-bold uppercase tracking-wider">ФОП</span>
            <span className="text-sm font-black text-[#133b47] font-mono">
              {dbInfo?.fop_count ?? "—"}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#f0f7f6] border border-[#cbe3df]">
            <span className="block text-[10px] text-[#556e75] font-bold uppercase tracking-wider">Працівники</span>
            <span className="text-sm font-black text-[#133b47] font-mono">
              {dbInfo?.worker_count ?? "—"}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#f0f7f6] border border-[#cbe3df]">
            <span className="block text-[10px] text-[#556e75] font-bold uppercase tracking-wider">Розмір</span>
            <span className="text-sm font-black text-[#133b47] font-mono">
              {dbInfo ? formatBytes(dbInfo.db_size_bytes) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isConfirmingImport ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || isImporting}
            className="flex-1 px-4 py-3 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50"
            title="Зберегти резервну копію бази даних у файл .kadergo для перенесення на інший комп'ютер"
          >
            <ArrowDownTrayIcon className="w-4.5 h-4.5 stroke-[2.3]" />
            {isExporting ? "Експорт..." : "Експортувати базу даних"}
          </button>

          <button
            type="button"
            onClick={() => setIsConfirmingImport(true)}
            disabled={isExporting || isImporting}
            className="flex-1 px-4 py-3 rounded-2xl bg-white hover:bg-[#f6faf9] text-[#133b47] border-2 border-[#133b47]/40 font-black text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50"
            title="Завантажити базу даних з резервної копії (.kadergo або .db)"
          >
            <ArrowUpTrayIcon className="w-4.5 h-4.5 stroke-[2.3]" />
            Імпортувати базу даних
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 flex flex-col gap-3 shadow-md animate-fadeIn">
          <div className="flex items-start gap-2 text-xs font-bold text-amber-900">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 stroke-[2.2]" />
            <div>
              <p className="font-black text-amber-900">Увага! Імпорт замінить поточну базу даних.</p>
              <p className="text-[11.5px] text-amber-800 mt-0.5">
                Програма <b>автоматично створить резервну копію</b> поточної бази перед заміною, тому дані не будуть втрачені.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowUpTrayIcon className="w-4 h-4 stroke-[2.5]" />
              {isImporting ? "Імпорт..." : "Оберіть файл для імпорту"}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingImport(false)}
              disabled={isImporting}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-all cursor-pointer"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}

      {/* Description / Portability Hint */}
      <div className="p-3.5 rounded-2xl bg-white/70 border border-[#b8d6df] text-[11.5px] text-[#33565f] font-medium leading-relaxed">
        <p className="flex items-center gap-1.5 font-bold text-[#133b47] mb-1">
          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
          Як працювати на іншому комп'ютері:
        </p>
        <p>
          1. Натисніть <b>«Експортувати базу даних»</b> та збережіть файл (наприклад, на флешку або надішліть собі).
        </p>
        <p>
          2. На іншому комп'ютері відкрийте KaderGo, натисніть <b>«Імпортувати базу даних»</b> та оберіть цей файл. Всі ФОП, працівники, оклади та копійки відновляться миттєво!
        </p>
      </div>
    </div>
  );
};

