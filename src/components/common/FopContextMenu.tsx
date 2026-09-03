import React, { useEffect, useRef } from "react";
import {
  FolderIcon,
  PencilSquareIcon,
  UserPlusIcon,
  ArrowTopRightOnSquareIcon,
  TrashIcon,
  InboxIcon,
  CheckIcon,
  FolderPlusIcon,
} from "@heroicons/react/24/outline";
import { FopData, FolderGroup } from "../../types/fop";

interface FopContextMenuProps {
  x: number;
  y: number;
  fop: FopData;
  groups: FolderGroup[];
  onClose: () => void;
  onSelectGroup: (fopId: number, groupName: string | null) => Promise<void>;
  onEditFop: (fop: FopData) => void;
  onAddWorker: (fop: FopData) => void;
  onPickFolder: (fop: FopData) => void;
  onOpenExplorer: (path: string) => void;
  onDeleteFop: (fop: FopData) => void;
}

export const FopContextMenu: React.FC<FopContextMenuProps> = ({
  x,
  y,
  fop,
  groups,
  onClose,
  onSelectGroup,
  onEditFop,
  onAddWorker,
  onPickFolder,
  onOpenExplorer,
  onDeleteFop,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Adjust position so it doesn't overflow viewport
  const menuWidth = 260;
  const menuHeight = 360;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

  const fullName = [fop.vezeteknev, fop.keresztnev, fop.apai_nev].filter(Boolean).join(" ");

  return (
    <div
      ref={menuRef}
      style={{ left: `${Math.max(10, adjustedX)}px`, top: `${Math.max(10, adjustedY)}px` }}
      className="fixed z-[9999999] w-[260px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-[#cbd8d6] py-2 flex flex-col text-xs font-bold text-[#133b47] animate-fadeIn select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Info */}
      <div className="px-3.5 py-2 border-b border-[#e2eceb] flex flex-col">
        <span className="font-black text-xs text-[#133b47] truncate" title={fullName}>
          {fullName}
        </span>
        {fop.kod && <span className="text-[10px] font-extrabold text-[#6f8d95]">Код: {fop.kod}</span>}
      </div>

      {/* Folders / Categories Section */}
      <div className="py-1">
        <div className="px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#6a8790] flex items-center gap-1.5">
          <FolderIcon className="w-3.5 h-3.5 text-[#f8a44c] stroke-[2.5]" />
          <span>Перемістити до папки:</span>
        </div>

        <div className="max-h-40 overflow-y-auto custom-scrollbar flex flex-col px-1.5">
          {groups.map((grp) => {
            const isCurrent = fop.folder_group === grp.name;
            return (
              <button
                key={grp.id}
                type="button"
                onClick={async () => {
                  await onSelectGroup(fop.id, grp.name);
                  onClose();
                }}
                className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                  isCurrent ? "bg-[#133b47] text-[#f8a44c]" : "hover:bg-[#f0f6f5] text-[#133b47]"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: grp.color || "#f8a44c" }}
                  />
                  <span className="truncate font-extrabold">{grp.name}</span>
                </div>
                {isCurrent && <CheckIcon className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
              </button>
            );
          })}

          {/* Reset / Unassigned */}
          <button
            type="button"
            onClick={async () => {
              await onSelectGroup(fop.id, null);
              onClose();
            }}
            className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer mt-0.5 ${
              !fop.folder_group ? "bg-[#133b47] text-[#f8a44c]" : "hover:bg-[#f0f6f5] text-[#5e7a83]"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <InboxIcon className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
              <span className="truncate font-bold">Без папки</span>
            </div>
            {!fop.folder_group && <CheckIcon className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
          </button>
        </div>
      </div>

      <div className="h-px bg-[#e2eceb] my-1" />

      {/* General Actions */}
      <div className="px-1.5 flex flex-col">
        {fop.folder_path && (
          <button
            type="button"
            onClick={() => {
              onOpenExplorer(fop.folder_path!);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-[#f0f6f5] transition-colors cursor-pointer text-[#133b47]"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4 stroke-[2.2]" />
            <span>Відкрити папку у Провіднику</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onPickFolder(fop);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-[#f0f6f5] transition-colors cursor-pointer text-[#133b47]"
        >
          <FolderPlusIcon className="w-4 h-4 stroke-[2.2]" />
          <span>{fop.folder_path ? "Змінити робочу папку" : "Прив'язати робочу папку"}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onEditFop(fop);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-[#f0f6f5] transition-colors cursor-pointer text-[#133b47]"
        >
          <PencilSquareIcon className="w-4 h-4 stroke-[2.2]" />
          <span>Редагувати ФОП</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onAddWorker(fop);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-[#f0f6f5] transition-colors cursor-pointer text-[#133b47]"
        >
          <UserPlusIcon className="w-4 h-4 stroke-[2.2]" />
          <span>Додати працівника</span>
        </button>

        <div className="h-px bg-[#e2eceb] my-1" />

        <button
          type="button"
          onClick={() => {
            onDeleteFop(fop);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
        >
          <TrashIcon className="w-4 h-4 stroke-[2.2]" />
          <span>Видалити ФОП</span>
        </button>
      </div>
    </div>
  );
};
