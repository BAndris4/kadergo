import React, { useState } from "react";
import { ExclamationTriangleIcon, XMarkIcon, UserMinusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { DatePicker } from "./DatePicker";

interface DeleteWorkerConfirmModalProps {
  isOpen: boolean;
  workerName: string;
  onClose: () => void;
  onDismiss: (date: string) => Promise<void>;
  onDeletePermanent: () => Promise<void>;
}

const getTodayString = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const DeleteWorkerConfirmModal: React.FC<DeleteWorkerConfirmModalProps> = ({
  isOpen,
  workerName,
  onClose,
  onDismiss,
  onDeletePermanent,
}) => {
  const [mode, setMode] = useState<"dismiss" | "delete">("dismiss");
  const [dismissDate, setDismissDate] = useState<string>(getTodayString());

  if (!isOpen) return null;

  const handleDismissSubmit = async () => {
    await onDismiss(dismissDate);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#bdcdcb] rounded-[32px] w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-modalScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b-2 border-[#e2eceb] bg-[#f8faf9]">
          <h2 className="text-lg font-black text-[#133b47] font-heading flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#133b47]/10 flex items-center justify-center text-[#133b47] shadow-xs shrink-0">
              <UserMinusIcon className="w-6 h-6 stroke-[2.2]" />
            </div>
            Дія з працівником
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-[#5c777f] hover:text-[#133b47] hover:bg-[#e6eeed] transition-all cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Worker Name Header Banner */}
        <div className="px-7 py-4 bg-[#fdf8f3] border-b-2 border-[#f6e4d0]">
          <span className="text-xs font-black uppercase tracking-wider text-[#7e6241] block mb-0.5">Обраний працівник</span>
          <span className="text-base font-black text-[#133b47] font-heading truncate block">{workerName || "Працівник"}</span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-3 bg-[#f0f6f5] border-b-2 border-[#e2eceb] gap-2">
          <button
            type="button"
            onClick={() => setMode("dismiss")}
            className={`py-3 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === "dismiss"
                ? "bg-[#133b47] text-[#f8a44c] shadow-md"
                : "bg-white text-[#556e75] hover:text-[#133b47] border border-[#cbd8d6]"
            }`}
          >
            <UserMinusIcon className="w-4.5 h-4.5 stroke-[2.2]" />
            Звільнити працівника
          </button>

          <button
            type="button"
            onClick={() => setMode("delete")}
            className={`py-3 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === "delete"
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "bg-white text-red-600 hover:bg-red-50 border border-red-200"
            }`}
          >
            <TrashIcon className="w-4.5 h-4.5 stroke-[2.2]" />
            Повністю видалити
          </button>
        </div>

        {/* Body Content */}
        <div className="p-7 flex flex-col gap-5">
          {mode === "dismiss" ? (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <p className="text-sm font-extrabold text-[#354f57] leading-relaxed">
                Працівник залишиться у картці ФОП зі статусом <span className="font-black text-red-600 underline">"Звільнений"</span> та збереже свою кадрову історію.
              </p>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
                  Дата звільнення (закінчення трудових відносин)
                </label>
                <DatePicker
                  value={dismissDate}
                  onChange={(val) => setDismissDate(val)}
                  placeholder="Вкажіть дату звільнення"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 animate-fadeIn">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800">
                <ExclamationTriangleIcon className="w-8 h-8 shrink-0 text-red-600 stroke-[2]" />
                <p className="text-xs font-extrabold leading-relaxed">
                  Ви дійснo бажаєте повністю видалити цього працівника? Усі дані будуть остаточно вилучені з бази даних.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-7 py-5 border-t-2 border-[#e2eceb] bg-[#f8faf9] gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-[#e6eeed] hover:bg-[#d5e2e0] text-[#133b47] font-black text-xs transition-all cursor-pointer"
          >
            Скасувати
          </button>

          {mode === "dismiss" ? (
            <button
              type="button"
              onClick={handleDismissSubmit}
              className="px-6 py-2.5 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Підтвердити звільнення ✓
            </button>
          ) : (
            <button
              type="button"
              onClick={onDeletePermanent}
              className="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg shadow-red-600/20 transition-all cursor-pointer"
            >
              Видалити назавжди 🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
