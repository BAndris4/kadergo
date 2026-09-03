import React from "react";
import {
  CheckCircleIcon,
  ArrowRightIcon,
  XMarkIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UserIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { openFileDirectly } from "../../services/fopService";

interface CreateNakazPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  docTitle: string;
  nakazTitle: string;
  dateStr?: string;
  workerName?: string;
  filePath?: string | null;
}

export const CreateNakazPromptModal: React.FC<CreateNakazPromptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  docTitle,
  nakazTitle,
  dateStr,
  workerName,
  filePath,
}) => {
  if (!isOpen) return null;

  const handleOpenFile = async () => {
    if (filePath) {
      try {
        await openFileDirectly(filePath);
      } catch (err) {
        console.error("Failed to open file directly:", err);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto max-w-[370px] w-full animate-slideUp">
      <div className="bg-white rounded-[24px] border-2 border-[#cbd8d6] shadow-2xl p-4.5 flex flex-col gap-3 relative">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
            <CheckCircleIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{docTitle} створено</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            title="Закрити сповіщення"
          >
            <XMarkIcon className="w-4.5 h-4.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Visual Target Nakaz Card */}
        <div className="bg-gradient-to-br from-[#133b47] to-[#1c5060] rounded-xl p-3 text-white shadow-sm flex flex-col gap-2 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f8a44c] text-[#133b47] flex items-center justify-center shrink-0 font-black shadow-xs">
              <DocumentTextIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[9px] uppercase font-black tracking-wider text-[#f8a44c]">
                Створити наказ
              </span>
              <span className="text-xs font-black text-white truncate">
                {nakazTitle}
              </span>
            </div>
          </div>

          {/* Badges */}
          {(dateStr || workerName) && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-white/10 text-xs">
              {dateStr && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-white font-bold text-[10px]">
                  <CalendarDaysIcon className="w-3 h-3 text-[#f8a44c] stroke-[2.5]" />
                  {dateStr}
                </span>
              )}

              {workerName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-white font-bold text-[10px] truncate max-w-[180px]">
                  <UserIcon className="w-3 h-3 text-[#f8a44c] stroke-[2.5]" />
                  <span className="truncate">{workerName}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          {filePath && (
            <button
              type="button"
              onClick={handleOpenFile}
              className="py-2.5 px-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-black transition-all cursor-pointer hover:bg-slate-50 flex items-center justify-center gap-1 shrink-0"
              title="Відкрити створений файл у Word"
            >
              <span>Відкрити</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#133b47] to-[#1a4a58] hover:brightness-110 text-[#f8a44c] text-xs font-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>До наказу</span>
            <ArrowRightIcon className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
