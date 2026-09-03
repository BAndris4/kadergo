import React from "react";
import {
  UserGroupIcon,
  ChevronDownIcon,
  UserPlusIcon,
  PencilSquareIcon,
  HomeIcon,
  FolderIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { FopData, Munkas } from "../../types/fop";
import { WorkerCard } from "./WorkerCard";
import { formatAddressDisplay } from "../../utils/addressUtils";
import { openFolderInExplorer, pickFopFolder } from "../../services/fopService";

interface FopCardProps {
  fop: FopData;
  isExpanded: boolean;
  isBeingDragged?: boolean;
  onToggleExpand: (id: number) => void;
  onAddWorkerClick: (fop: FopData) => void;
  onEditClick: (fop: FopData) => void;
  onEditWorkerClick: (worker: Munkas) => void;
  onDeleteWorkerClick: (worker: Munkas) => void;
  onUpdateFolderAndGroup?: (fopId: number, folderPath: string | null, folderGroup: string | null) => Promise<void>;
  onContextMenu?: (fop: FopData, x: number, y: number) => void;
  onPointerDragStart?: (fop: FopData, clientX: number, clientY: number, rect: DOMRect) => void;
}

function formatMunkasCount(count: number): string {
  if (count === 1) return "1 працівник";
  if (count >= 2 && count <= 4) return `${count} працівники`;
  return `${count} працівників`;
}

export const FopCard: React.FC<FopCardProps> = ({
  fop,
  isExpanded,
  isBeingDragged = false,
  onToggleExpand,
  onAddWorkerClick,
  onEditClick,
  onEditWorkerClick,
  onDeleteWorkerClick,
  onUpdateFolderAndGroup,
  onContextMenu,
  onPointerDragStart,
}) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const fopOwnerName = [fop.vezeteknev, fop.keresztnev, fop.apai_nev].filter(Boolean).join(" ");

  const handlePickFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const chosen = await pickFopFolder();
    if (chosen && onUpdateFolderAndGroup) {
      await onUpdateFolderAndGroup(fop.id, chosen, fop.folder_group || null);
    }
  };

  // If this card is actively being dragged, show the placeholder slot
  if (isBeingDragged) {
    return (
      <div
        ref={cardRef}
        className="rounded-[28px] border-2 border-dashed border-[#133b47]/30 bg-[#133b47]/5 p-6 flex items-center justify-center text-xs font-black text-[#133b47]/50 select-none animate-pulse min-h-[96px]"
      >
        Переміщення "{fopOwnerName}"...
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(fop, e.clientX, e.clientY);
      }}
      className={`rounded-[28px] border-2 transition-all duration-200 overflow-hidden bg-white select-none ${
        isExpanded
          ? "border-[#133b47] shadow-xl shadow-[#133b47]/12 hover:shadow-2xl hover:-translate-y-0.5"
          : "border-[#bdcdcb] shadow-md hover:border-[#9cb1af] hover:shadow-lg hover:-translate-y-0.5"
      }`}
    >
      {/* FOP Card Header */}
      <div
        onClick={() => onToggleExpand(fop.id)}
        className="flex items-center justify-between p-6 cursor-pointer select-none hover:bg-[#f6faf9] transition-colors gap-4"
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Custom Pointer Drag Handle Grip */}
          <div
            className="text-[#9cb1af] hover:text-[#133b47] p-2 rounded-xl cursor-grab active:cursor-grabbing shrink-0 transition-colors hover:bg-[#133b47]/10 touch-none"
            title="Затисніть і потягніть для переміщення"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              e.stopPropagation();
              if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect();
                onPointerDragStart?.(fop, e.clientX, e.clientY, rect);
              }
            }}
          >
            <svg className="w-4 h-4 fill-current opacity-70 hover:opacity-100" viewBox="0 0 20 20">
              <path d="M7 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6-12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          </div>

          <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center font-black text-xl shadow-md shrink-0">
            {fop.vezeteknev.charAt(0)}
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-black text-lg text-[#133b47] font-heading tracking-tight">{fopOwnerName}</span>
              
              {/* Kizárólag a személy kódja (szemely.kod) */}
              {fop.kod && fop.kod.trim() ? (
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-[#f8a44c] text-[#133b47] shadow-xs">
                  {fop.kod}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3 flex-wrap text-xs font-extrabold text-[#607d85]">
              {fop.fop_kezdete_datum && (
                <span>ФОП з: {fop.fop_kezdete_datum}</span>
              )}
            </div>

            {fop.cim && formatAddressDisplay(fop.cim) && (
              <span className="text-xs font-bold text-[#133b47] bg-[#f4f9f8] px-2.5 py-1 rounded-lg border border-[#cbd8d6] mt-0.5 self-start inline-flex items-center gap-1.5">
                <HomeIcon className="w-4 h-4 text-[#133b47] shrink-0 stroke-[2]" />
                <span className="truncate max-w-[320px] sm:max-w-[480px]">{formatAddressDisplay(fop.cim)}</span>
              </span>
            )}

            {/* Folder Path indicator: ONLY shown if custom folder path is set */}
            {fop.folder_path && (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 bg-[#f0f6f5] px-3 py-1 rounded-xl border border-[#cbd8d6] text-xs font-bold text-[#133b47] max-w-full"
                >
                  <FolderIcon className="w-4 h-4 text-[#133b47] shrink-0 stroke-[2.2]" />
                  <span className="truncate max-w-[220px] sm:max-w-[380px]" title={fop.folder_path}>
                    {fop.folder_path}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <button
                      type="button"
                      title="Відкрити папку у Провіднику"
                      onClick={() => openFolderInExplorer(fop.folder_path!)}
                      className="p-1 rounded-lg hover:bg-[#133b47]/10 text-[#133b47] transition-colors cursor-pointer"
                    >
                      <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    {onUpdateFolderAndGroup && (
                      <button
                        type="button"
                        title="Змінити робочу папку"
                        onClick={handlePickFolder}
                        className="px-2 py-0.5 rounded-lg bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] text-[11px] font-extrabold transition-all cursor-pointer"
                      >
                        Змінити
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold bg-[#fdf3e7] text-[#133b47] border border-[#f5e2cc]">
            <UserGroupIcon className="w-4.5 h-4.5 text-[#f8a44c] stroke-[2.2]" />
            {formatMunkasCount(fop.munkasok.length)}
          </span>

          {/* Edit Button */}
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
              onClick={() => onAddWorkerClick(fop)}
              className="px-4 py-2 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all shadow-sm cursor-pointer flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <UserPlusIcon className="w-4 h-4 stroke-[2.5]" />
              <span>Додати працівника</span>
            </button>
          </div>

          {fop.munkasok.length === 0 ? (
            <div className="p-6 text-center text-[#738e96] font-bold text-sm bg-white rounded-2xl border-2 border-dashed border-[#cbd8d6]">
              У цього ФОП наразі немає зареєстрованих найманих працівників.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
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
