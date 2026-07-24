import React from "react";
import { TrashIcon, XMarkIcon, ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { FopData } from "../types/fop";

interface TrashModalProps {
  isOpen: boolean;
  trashFops: FopData[];
  onClose: () => void;
  onRestore: (fop: FopData) => Promise<void>;
  onPermanentDelete: (fop: FopData) => Promise<void>;
}

function getDaysRemaining(deletedAt?: string): number {
  if (!deletedAt) return 7;
  const deletedTime = new Date(deletedAt).getTime();
  const now = new Date().getTime();
  const diffDays = Math.ceil(7 - (now - deletedTime) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  trashFops,
  onClose,
  onRestore,
  onPermanentDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#bdcdcb] rounded-[32px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-modalScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b-2 border-[#e2eceb] bg-[#f8faf9]">
          <h2 className="text-xl font-black text-[#133b47] font-heading flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-sm">
              <TrashIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            Кошик видалених ФОП
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-[#5c777f] hover:text-[#133b47] hover:bg-[#e6eeed] transition-all cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-8 py-3.5 bg-amber-50 border-b border-amber-200 text-amber-900 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 stroke-[2]" />
          <p className="text-xs font-bold leading-tight">
            Видалені ФОП зберігаються у кошику протягом <span className="font-black">7 днів</span>, після чого остаточно вилучаються з бази.
          </p>
        </div>

        {/* Scrollable List */}
        <div className="p-7 overflow-y-auto flex-1 flex flex-col gap-4 custom-scrollbar">
          {trashFops.length === 0 ? (
            <div className="p-10 text-center text-[#607c85] font-bold text-sm bg-[#f8faf9] rounded-2xl border-2 border-dashed border-[#c6d7d5]">
              Кошик порожній. Жодного ФОП у кошику немає.
            </div>
          ) : (
            trashFops.map((fop) => {
              const fopName = [fop.vezeteknev, fop.keresztnev, fop.apai_nev].filter(Boolean).join(" ");
              const daysLeft = getDaysRemaining(fop.deleted_at);

              return (
                <div
                  key={fop.id}
                  className="flex items-center justify-between p-5 rounded-2xl bg-white border-2 border-[#dbe6e4] shadow-xs gap-4"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-black text-base text-[#133b47] font-heading truncate">
                        {fopName}
                      </span>
                      {fop.kod && (
                        <span className="px-3 py-0.5 rounded-full text-xs font-black bg-[#f8a44c] text-[#133b47]">
                          {fop.kod}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-amber-700">
                      ⏱ Залишилось: {daysLeft} {daysLeft === 1 ? "день" : daysLeft >= 2 && daysLeft <= 4 ? "дні" : "днів"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => onRestore(fop)}
                      className="px-4 py-2 rounded-xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <ArrowPathIcon className="w-4 h-4 stroke-[2.5]" />
                      Відновити
                    </button>

                    <button
                      onClick={() => onPermanentDelete(fop)}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <TrashIcon className="w-4 h-4 stroke-[2.2]" />
                      Видалити назавжди
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-8 py-4 border-t-2 border-[#e2eceb] bg-[#f8faf9]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-[#e6eeed] hover:bg-[#d5e2e0] text-[#133b47] font-black text-xs transition-all cursor-pointer"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
