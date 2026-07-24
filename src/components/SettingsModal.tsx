import React, { useState, useEffect } from "react";
import {
  Cog6ToothIcon,
  XMarkIcon,
  FolderOpenIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BanknotesIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { pickRootFolder, saveRootFolder, saveMinWage } from "../services/fopService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootFolder: string;
  onRootFolderChange: (path: string) => void;
  minWage: number;
  onMinWageChange: (val: number) => void;
  onShowToast: (msg: string) => void;
  onScanFolders: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  rootFolder,
  onRootFolderChange,
  minWage,
  onMinWageChange,
  onShowToast,
  onScanFolders,
}) => {
  const [localMinWage, setLocalMinWage] = useState<number>(minWage);

  useEffect(() => {
    setLocalMinWage(minWage);
  }, [minWage, isOpen]);

  if (!isOpen) return null;

  const handleBrowseFolder = async () => {
    const chosen = await pickRootFolder();
    if (chosen) {
      onRootFolderChange(chosen);
      saveRootFolder(chosen);
      onShowToast(`Головну папку збереження успішно встановлено: "${chosen}"`);
    }
  };

  const handleSaveSettings = () => {
    onMinWageChange(localMinWage);
    saveMinWage(localMinWage);
    onShowToast(`Налаштування успішно збережено! Мінімальну зарплату встановлено: ${localMinWage} грн`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#bdcdcb] rounded-[32px] w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-modalScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b-2 border-[#e2eceb] bg-[#f8faf9]">
          <h2 className="text-xl font-black text-[#133b47] font-heading flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#133b47] flex items-center justify-center text-[#f8a44c] shadow-sm">
              <Cog6ToothIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            Налаштування системи
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-[#5c777f] hover:text-[#133b47] hover:bg-[#e6eeed] transition-all cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Overall Folder Picker */}
          <div className="p-6 rounded-3xl bg-[#f8faf9] border-2 border-[#e2eceb] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#354f57] flex items-center gap-2">
                <FolderOpenIcon className="w-4.5 h-4.5 text-[#133b47] stroke-[2.2]" />
                1. Головна папка збереження
              </span>
              {rootFolder ? (
                <span className="inline-flex items-center gap-1 text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircleIcon className="w-3.5 h-3.5" /> Встановлено
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <ExclamationCircleIcon className="w-3.5 h-3.5" /> Не вказано
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-[#bdcdcb] flex items-center gap-3">
              <span className="text-xs font-mono font-black text-[#133b47] break-all">
                {rootFolder || "Папку збереження ще не обрано"}
              </span>
            </div>

            <p className="text-xs font-extrabold text-[#556e75] leading-relaxed">
              💡 Усі згенеровані кадорові документи ФОП будуть автоматично зберігатися у відповідних підпапках цієї директорії.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBrowseFolder}
                className="flex-1 px-5 py-3 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <FolderOpenIcon className="w-4.5 h-4.5 stroke-[2.2]" />
                Вибрати папку...
              </button>

              <button
                onClick={onScanFolders}
                disabled={!rootFolder}
                className={`flex-1 px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                  rootFolder
                    ? "bg-[#f8a44c] hover:bg-[#f59533] text-[#133b47]"
                    : "bg-[#e2eceb] text-[#8fa8aa] cursor-not-allowed opacity-60"
                }`}
              >
                <MagnifyingGlassIcon className="w-4.5 h-4.5 stroke-[2.2]" />
                Розпізнати папки ФОП
              </button>
            </div>
          </div>

          {/* Section 2: Minimum Wage Setting */}
          <div className="p-6 rounded-3xl bg-[#fdf8f3] border-2 border-[#f6e4d0] flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#7e6241]">
              <BanknotesIcon className="w-4.5 h-4.5 text-[#133b47] stroke-[2.2]" />
              2. Розмір мінімальної заробітної плати (грн)
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-[#556e75]">
                Вкажіть актуальний розмір мінімальної зарплати для автоматичного підставлення:
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={localMinWage}
                  onChange={(e) => setLocalMinWage(Number(e.target.value) || 0)}
                  placeholder="8647"
                  className="w-full h-13 px-4 pr-16 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-lg font-black focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-sm text-[#556e75]">
                  грн
                </span>
              </div>
            </div>

            <p className="text-xs font-extrabold text-[#7e6241]">
              💡 Ця сума буде автоматично встановлюватись за замовчуванням під час оформлення нових працівників.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-8 py-5 border-t-2 border-[#e2eceb] bg-[#f8faf9]">
          <button
            onClick={handleSaveSettings}
            className="px-7 py-3 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-sm transition-all cursor-pointer shadow-md"
          >
            Зберегти налаштування ✓
          </button>
        </div>
      </div>
    </div>
  );
};
