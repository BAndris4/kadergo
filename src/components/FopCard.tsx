import React from "react";
import { UserGroupIcon, ChevronDownIcon, UserPlusIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { FopData, Munkas } from "../types/fop";
import { WorkerCard } from "./WorkerCard";

interface FopCardProps {
  fop: FopData;
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
  onAddWorkerClick: (fop: FopData) => void;
  onEditClick: (fop: FopData) => void;
  onEditWorkerClick: (worker: Munkas) => void;
  onDeleteWorkerClick: (worker: Munkas) => void;
}

function formatMunkasCount(count: number): string {
  if (count === 1) return "1 працівник";
  if (count >= 2 && count <= 4) return `${count} працівники`;
  return `${count} працівників`;
}

export const FopCard: React.FC<FopCardProps> = ({
  fop,
  isExpanded,
  onToggleExpand,
  onAddWorkerClick,
  onEditClick,
  onEditWorkerClick,
  onDeleteWorkerClick,
}) => {
  const fopOwnerName = [fop.vezeteknev, fop.keresztnev, fop.apai_nev].filter(Boolean).join(" ");

  return (
    <div
      className={`rounded-[28px] border-2 transition-all overflow-hidden bg-white shadow-md ${
        isExpanded ? "border-[#133b47] shadow-xl shadow-[#133b47]/12" : "border-[#bdcdcb] hover:border-[#9cb1af]"
      }`}
    >
      {/* FOP Card Header */}
      <div
        onClick={() => onToggleExpand(fop.id)}
        className="flex items-center justify-between p-6 cursor-pointer select-none hover:bg-[#f6faf9] transition-colors gap-4"
      >
        <div className="flex items-center gap-4.5">
          <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center font-black text-xl shadow-md shrink-0">
            {fop.vezeteknev.charAt(0)}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3.5 flex-wrap">
              <span className="font-black text-lg text-[#133b47] font-heading tracking-tight">{fopOwnerName}</span>
              
              {/* Kizárólag a személy kódja (szemely.kod) */}
              {fop.kod && fop.kod.trim() ? (
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#f8a44c] text-[#133b47] shadow-xs">
                  {fop.kod}
                </span>
              ) : null}
            </div>

            {fop.fop_kezdete_datum && (
              <span className="text-xs font-extrabold text-[#607d85]">
                ФОП з: {fop.fop_kezdete_datum}
              </span>
            )}

            {fop.cim && (fop.cim.kozseg || fop.cim.utca || fop.cim.megye) && (
              <span className="text-xs font-bold text-[#133b47] bg-[#f4f9f8] px-2.5 py-0.5 rounded-lg border border-[#cbd8d6] mt-0.5 self-start">
                🏠 {[
                  fop.cim.iranyitoszam,
                  fop.cim.megye ? `${fop.cim.megye} обл.` : "",
                  fop.cim.jaras ? `${fop.cim.jaras} р-н` : "",
                  fop.cim.kozseg ? `м. ${fop.cim.kozseg}` : "",
                  fop.cim.utca ? `вул. ${fop.cim.utca}` : "",
                  fop.cim.hazszam ? `буд. ${fop.cim.hazszam}` : "",
                ].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold bg-[#fdf3e7] text-[#133b47] border border-[#f5e2cc]">
            <UserGroupIcon className="w-4.5 h-4.5 text-[#f8a44c] stroke-[2.2]" />
            {formatMunkasCount(fop.munkasok.length)}
          </span>

          {/* Edit Button (Törlés gomb eltávolítva innét, mert csak a módosítás ablakon belül látható) */}
          <button
            title="Редагувати ФОП"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(fop);
            }}
            className="w-9 h-9 rounded-full bg-[#133b47]/10 hover:bg-[#133b47]/20 text-[#133b47] border border-[#133b47]/20 flex items-center justify-center transition-all cursor-pointer"
          >
            <PencilSquareIcon className="w-4.5 h-4.5 stroke-[2.2]" />
          </button>

          {/* Chevron expand button */}
          <div
            className={`w-9 h-9 rounded-full bg-[#eef4f4] flex items-center justify-center text-[#133b47] transition-transform duration-300 ${
              isExpanded ? "rotate-180 bg-[#133b47] text-[#f8a44c]" : ""
            }`}
          >
            <ChevronDownIcon className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Expanded Body: Worker List */}
      {isExpanded && (
        <div className="p-7 border-t-2 border-[#e2eceb] bg-[#f8faf9] animate-fadeIn">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#4d6973]">
              Оформлені працівники
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddWorkerClick(fop);
              }}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-[#133b47] hover:bg-[#0f2e38] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              <UserPlusIcon className="w-4.5 h-4.5 text-[#f8a44c] stroke-[2.5]" />
              Додати нового працівника
            </button>
          </div>

          {fop.munkasok.length === 0 ? (
            <div className="p-7 text-center text-sm font-extrabold text-[#5c777f] bg-white rounded-2xl border-2 border-dashed border-[#c5d5d3]">
              Для цього ФОП наразі немає зареєстрованих працівників.
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {fop.munkasok.map((worker) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onEditClick={onEditWorkerClick}
                  onDeleteClick={onDeleteWorkerClick}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
