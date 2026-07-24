import React from "react";
import { Munkas } from "../types/fop";
import { UserIcon, PencilSquareIcon, TrashIcon, UserMinusIcon } from "@heroicons/react/24/outline";

interface WorkerCardProps {
  worker: Munkas;
  onEditClick?: (worker: Munkas) => void;
  onDeleteClick?: (worker: Munkas) => void;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(val);
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onEditClick, onDeleteClick }) => {
  const fullName = [worker.vezeteknev, worker.keresztnev, worker.apai_nev].filter(Boolean).join(" ");
  const isDismissed = Boolean(worker.munkaviszony_vege && worker.munkaviszony_vege.trim().length > 0);

  return (
    <div
      className={`flex items-center justify-between p-4.5 rounded-2xl border-2 transition-all shadow-xs gap-4 ${
        isDismissed
          ? "bg-slate-50/80 border-slate-300 opacity-85 hover:border-slate-400"
          : "bg-white border-[#dbe6e4] hover:border-[#b8cdca]"
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 border ${
            isDismissed
              ? "bg-red-100 text-red-700 border-red-200"
              : "bg-[#e6eeed] text-[#133b47] border-[#cbd8d6]"
          }`}
        >
          {isDismissed ? (
            <UserMinusIcon className="w-5 h-5 stroke-[2.2]" />
          ) : (
            <UserIcon className="w-5 h-5 stroke-[2.2]" />
          )}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`font-extrabold text-base truncate ${
                isDismissed ? "text-slate-600 line-through decoration-slate-400" : "text-[#133b47]"
              }`}
            >
              {fullName}
            </span>

            {/* KIZÁRÓLAG a munkás kódja (szemely.kod) */}
            {worker.kod && worker.kod.trim() ? (
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-[#f8a44c] text-[#133b47] shadow-xs">
                {worker.kod}
              </span>
            ) : null}

            {/* ВІЗУАЛЬНИЙ СТАТУС: Звільнений з датою закінчення трудових відносин */}
            {isDismissed && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-200 shadow-xs">
                <span>Звільнений:</span>
                <span className="font-extrabold">{worker.munkaviszony_vege}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-extrabold text-[#527079]">
            <span className="text-[#133b47] font-black">{worker.foglalkozas_megnevezes}</span>
            <span>•</span>
            <span className={isDismissed ? "text-slate-500 font-bold" : "text-emerald-700 font-black"}>
              {formatCurrency(worker.fizetes)}
            </span>
          </div>
        </div>
      </div>

      {/* Worker Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {onEditClick && (
          <button
            title="Редагувати працівника"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(worker);
            }}
            className="w-8.5 h-8.5 rounded-full bg-[#133b47]/10 hover:bg-[#133b47]/20 text-[#133b47] border border-[#133b47]/20 flex items-center justify-center transition-all cursor-pointer"
          >
            <PencilSquareIcon className="w-4 h-4 stroke-[2.2]" />
          </button>
        )}

        {onDeleteClick && (
          <button
            title="Дії / Видалення / Звільнення працівника"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(worker);
            }}
            className="w-8.5 h-8.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center transition-all cursor-pointer"
          >
            <TrashIcon className="w-4 h-4 stroke-[2.2]" />
          </button>
        )}
      </div>
    </div>
  );
};
