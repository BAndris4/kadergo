import React from "react";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  fopName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  fopName,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999999] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-red-200 rounded-[28px] w-full max-w-md p-6 shadow-2xl flex flex-col gap-5 animate-modalScale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-7 h-7 stroke-[2.2]" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#5c777f] hover:text-[#162d35] hover:bg-[#e6eeed] transition-all cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div>
          <h3 className="text-xl font-black text-[#133b47] font-heading mb-1.5">
            Видалення ФОП
          </h3>
          <p className="text-sm font-semibold text-[#57727c]">
            Ви дійсно бажаєте видалити <span className="font-extrabold text-[#133b47]">"{fopName}"</span>? Цю дію неможливо скасувати.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#e6eeed] hover:bg-[#d5e2e0] text-[#162d35] font-extrabold text-xs transition-all cursor-pointer"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            Так, видалити
          </button>
        </div>
      </div>
    </div>
  );
};
