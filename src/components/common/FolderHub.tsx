import React, { useState } from "react";
import {
  FolderIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  Squares2X2Icon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { FolderGroup, FopData } from "../../types/fop";

interface FolderHubProps {
  groups: FolderGroup[];
  fops: FopData[];
  selectedGroup: string | null;
  onSelectGroup: (groupName: string | null) => void;
  onCreateGroupClick: () => void;
  onEditGroupClick: (group: FolderGroup) => void;
  onDeleteGroupClick: (group: FolderGroup) => void;
  onDropFopToGroup: (fopId: number, targetGroupName: string | null) => Promise<void>;
}

export const FolderHub: React.FC<FolderHubProps> = ({
  groups,
  fops,
  selectedGroup,
  onSelectGroup,
  onCreateGroupClick,
  onEditGroupClick,
  onDeleteGroupClick,
  onDropFopToGroup,
}) => {
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const getFopCountForGroup = (groupName: string) => {
    return fops.filter((f) => f.folder_group === groupName).length;
  };

  const unassignedCount = fops.filter((f) => !f.folder_group || !f.folder_group.trim()).length;

  const handleDragOver = (e: React.DragEvent, targetName: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverTarget !== targetName) {
      setDragOverTarget(targetName);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetGroupName: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
    const fopIdStr =
      e.dataTransfer.getData("application/x-kadergo-fop") ||
      e.dataTransfer.getData("text/plain") ||
      e.dataTransfer.getData("text");
    const fopId = Number(fopIdStr);
    if (!isNaN(fopId) && fopId > 0) {
      await onDropFopToGroup(fopId, targetGroupName);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 bg-gradient-to-br from-[#f8faf9] to-[#edf4f3] p-6 rounded-[32px] border-2 border-[#cbd8d6] shadow-xs">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center shadow-xs">
            <FolderIcon className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#133b47] font-heading tracking-tight">
              Папки та категорії ФОП
            </h3>
            <p className="text-[11px] font-bold text-[#64828b]">
              Перетягуйте картки ФОП у папки для організації (Drag & Drop)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateGroupClick}
          className="px-4 py-2 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5 transform hover:-translate-y-0.5"
        >
          <PlusIcon className="w-4 h-4 stroke-[3]" />
          <span>Створити папку</span>
        </button>
      </div>

      {/* Visual Folders Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {/* Card 1: ALL FOPS */}
        <div
          onClick={() => onSelectGroup(null)}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 select-none relative group ${
            selectedGroup === null
              ? "bg-[#133b47] text-white border-[#133b47] shadow-lg shadow-[#133b47]/20 scale-[1.02]"
              : "bg-white text-[#133b47] border-[#bdcdcb] hover:border-[#133b47]/50 hover:bg-[#f6faf9]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedGroup === null ? "bg-white/15 text-[#f8a44c]" : "bg-[#133b47]/10 text-[#133b47]"
              }`}
            >
              <Squares2X2Icon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                selectedGroup === null ? "bg-[#f8a44c] text-[#133b47]" : "bg-[#eaf0f0] text-[#4d6973]"
              }`}
            >
              {fops.length}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-black text-sm truncate">Всі ФОП</span>
            <span
              className={`text-[11px] font-bold ${
                selectedGroup === null ? "text-white/70" : "text-[#718e97]"
              }`}
            >
              Повний список
            </span>
          </div>
        </div>

        {/* Dynamic Custom Folder Cards */}
        {groups.map((group) => {
          const isSelected = selectedGroup === group.name;
          const isDragOver = dragOverTarget === group.name;
          const count = getFopCountForGroup(group.name);
          const color = group.color || "#f8a44c";

          return (
            <div
              key={group.id}
              onClick={() => onSelectGroup(isSelected ? null : group.name)}
              onDragOver={(e) => handleDragOver(e, group.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, group.name)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 select-none relative group ${
                isDragOver
                  ? "ring-4 ring-offset-2 scale-105 border-dashed"
                  : isSelected
                  ? "shadow-lg scale-[1.02]"
                  : "hover:shadow-md hover:-translate-y-0.5"
              }`}
              style={{
                backgroundColor: isSelected ? `${color}20` : "#ffffff",
                borderColor: isDragOver ? color : isSelected ? color : "#cbd8d6",
              }}
            >
              {/* Top Row: Icon & Count / Actions */}
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                  style={{ backgroundColor: color, color: "#ffffff" }}
                >
                  <FolderIcon className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-black transition-colors"
                    style={{
                      backgroundColor: isSelected ? color : "#edf3f3",
                      color: isSelected ? "#ffffff" : "#38525b",
                    }}
                  >
                    {count}
                  </span>

                  {/* Actions on hover */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="hidden group-hover:flex items-center gap-0.5 bg-white/90 backdrop-blur-xs rounded-lg p-0.5 border border-[#cbd8d6] shadow-xs"
                  >
                    <button
                      type="button"
                      title="Редагувати назву або колір"
                      onClick={() => onEditGroupClick(group)}
                      className="p-1 rounded hover:bg-[#133b47]/10 text-[#133b47] transition-colors cursor-pointer"
                    >
                      <PencilSquareIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>
                    <button
                      type="button"
                      title="Видалити папку"
                      onClick={() => onDeleteGroupClick(group)}
                      className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                    >
                      <TrashIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Name */}
              <div className="flex flex-col min-w-0">
                <span className="font-black text-sm text-[#133b47] truncate" title={group.name}>
                  {group.name}
                </span>
                <span className="text-[11px] font-bold text-[#718e97]">
                  {isDragOver ? (
                    <span className="text-emerald-700 font-black animate-pulse">Перемістити сюди!</span>
                  ) : (
                    `${count} ${count === 1 ? "ФОП" : count >= 2 && count <= 4 ? "ФОП" : "ФОП"}`
                  )}
                </span>
              </div>
            </div>
          );
        })}

        {/* Drop Zone Card: UNASSIGNED (Без папки) */}
        <div
          onClick={() => onSelectGroup(selectedGroup === "__NO_GROUP__" ? null : "__NO_GROUP__")}
          onDragOver={(e) => handleDragOver(e, "__NO_GROUP__")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 select-none relative group ${
            dragOverTarget === "__NO_GROUP__"
              ? "ring-4 ring-offset-2 ring-amber-500 scale-105 border-dashed border-amber-500 bg-amber-50"
              : selectedGroup === "__NO_GROUP__"
              ? "bg-[#133b47] text-white border-[#133b47] shadow-lg shadow-[#133b47]/20 scale-[1.02]"
              : "bg-white text-[#5c7780] border-dashed border-[#bdcdcb] hover:border-[#133b47]/40 hover:bg-[#fafcfc]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedGroup === "__NO_GROUP__"
                  ? "bg-white/15 text-[#f8a44c]"
                  : "bg-[#eaf0f0] text-[#6d8a93]"
              }`}
            >
              <InboxIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                selectedGroup === "__NO_GROUP__"
                  ? "bg-[#f8a44c] text-[#133b47]"
                  : "bg-[#edf3f3] text-[#557077]"
              }`}
            >
              {unassignedCount}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-black text-sm truncate">
              {dragOverTarget === "__NO_GROUP__" ? "Відкріпити від папки" : "Без папки"}
            </span>
            <span
              className={`text-[11px] font-bold ${
                selectedGroup === "__NO_GROUP__" ? "text-white/70" : "text-[#718e97]"
              }`}
            >
              {dragOverTarget === "__NO_GROUP__" ? "Скинути папку ФОП" : "Несортовані"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
