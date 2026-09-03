import React, { useState } from "react";
import {
  FolderIcon,
  InboxIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { FopData, FolderGroup, Munkas } from "../../types/fop";
import { FopCard } from "./FopCard";

interface CategorySectionProps {
  group: FolderGroup | null; // null = "Без категорії"
  fops: FopData[];
  allGroups: FolderGroup[];
  expandedFopIds: number[];
  draggingFopId: number | null;
  onToggleExpand: (id: number) => void;
  onEditClick: (fop: FopData) => void;
  onAddWorkerClick: (fop: FopData) => void;
  onEditWorkerClick: (worker: Munkas) => void;
  onDeleteWorkerClick: (worker: Munkas) => void;
  onUpdateFolderAndGroup: (fopId: number, folderPath: string | null, folderGroup: string | null) => Promise<void>;
  onContextMenu: (fop: FopData, x: number, y: number) => void;
  onDropFop: (fopId: number, targetGroupName: string | null) => Promise<void>;
  onEditGroup?: (group: FolderGroup) => void;
  onDeleteGroup?: (group: FolderGroup) => void;
  pointerHoveredGroup?: string | null | "__NONE__";
  onPointerDragStart?: (fop: FopData, clientX: number, clientY: number, rect: DOMRect) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  group,
  fops,
  expandedFopIds,
  draggingFopId,
  onToggleExpand,
  onEditClick,
  onAddWorkerClick,
  onEditWorkerClick,
  onDeleteWorkerClick,
  onUpdateFolderAndGroup,
  onContextMenu,
  onDropFop,
  onEditGroup,
  onDeleteGroup,
  pointerHoveredGroup = "__NONE__",
  onPointerDragStart,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const targetGroupName = group ? group.name : null;
  const color = group ? group.color || "#f8a44c" : "#64748b";

  const isPointerOver = pointerHoveredGroup !== "__NONE__" && pointerHoveredGroup === targetGroupName;
  const activeDragOver = isDragOver || isPointerOver;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const fopIdStr =
      e.dataTransfer.getData("application/x-kadergo-fop") ||
      e.dataTransfer.getData("text/plain") ||
      e.dataTransfer.getData("text");
    const fopId = Number(fopIdStr) || draggingFopId;

    if (fopId && fopId > 0) {
      await onDropFop(fopId, targetGroupName);
    }
  };

  return (
    <div
      data-category-dropzone={group ? group.name : "__UNCATEGORIZED__"}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-[32px] p-6 border-2 transition-all duration-300 flex flex-col gap-4 select-none ${
        activeDragOver
          ? "ring-4 ring-offset-2 border-dashed shadow-2xl scale-[1.01]"
          : "bg-[#fcfdfd] border-[#cbd8d6] shadow-xs hover:border-[#b4c7c5]"
      }`}
      style={{
        borderColor: activeDragOver ? color : group ? `${color}66` : "#cbd8d6",
        backgroundColor: activeDragOver ? `${color}12` : group ? `${color}05` : "#fcfdfd",
      }}
    >
      {/* Category Section Header (Clickable to collapse/expand) */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between pb-2 cursor-pointer border-b border-[#e2eceb]/80 group"
      >
        <div className="flex items-center gap-3">
          {/* Collapse Chevron Icon */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[#607c84] group-hover:text-[#133b47] group-hover:bg-[#133b47]/5 transition-transform duration-300 ${
              isCollapsed ? "-rotate-90" : "rotate-0"
            }`}
          >
            <ChevronDownIcon className="w-5 h-5 stroke-[2.5]" />
          </div>

          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: color }}
          >
            {group ? (
              <FolderIcon className="w-5 h-5 stroke-[2.2]" />
            ) : (
              <InboxIcon className="w-5 h-5 stroke-[2.2]" />
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-black text-[#133b47] font-heading tracking-tight">
              {group ? group.name : "Без категорії / Несортовані"}
            </h3>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-black text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              {fops.length}
            </span>

            {activeDragOver && (
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-400 animate-pulse flex items-center gap-1">
                <span>↓</span>
                <span>Відпустіть тут для переміщення!</span>
              </span>
            )}
          </div>
        </div>

        {/* Edit / Delete actions for custom groups */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {group && onEditGroup && onDeleteGroup && (
            <>
              <button
                type="button"
                title="Редагувати назву або колір папки"
                onClick={() => onEditGroup(group)}
                className="p-2 rounded-xl text-[#5c777f] hover:text-[#133b47] hover:bg-white border border-transparent hover:border-[#cbd8d6] transition-all cursor-pointer"
              >
                <PencilSquareIcon className="w-4 h-4 stroke-[2.2]" />
              </button>
              <button
                type="button"
                title="Видалити папку (ФОП залишаться без папки)"
                onClick={() => onDeleteGroup(group)}
                className="p-2 rounded-xl text-[#5c777f] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
              >
                <TrashIcon className="w-4 h-4 stroke-[2.2]" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapsible Body with FOP Cards */}
      {!isCollapsed && (
        <div className="flex flex-col gap-3.5 min-h-[30px] animate-fadeIn transition-all duration-300">
          {fops.length === 0 ? (
            <div
              className={`py-7 px-4 rounded-2xl border-2 border-dashed text-center text-xs font-bold transition-all duration-200 ${
                activeDragOver
                  ? "border-emerald-500 bg-emerald-50/60 text-emerald-800 scale-[1.005]"
                  : "border-[#cbd8d6] bg-[#f8faf9] text-[#718f97]"
              }`}
            >
              {activeDragOver
                ? "Відпустіть мишку, щоб перемістити сюди!"
                : "Перетягніть сюди картку ФОП, щоб додати до цієї категорії"}
            </div>
          ) : (
            fops.map((fop) => (
              <FopCard
                key={fop.id}
                fop={fop}
                isExpanded={expandedFopIds.includes(fop.id)}
                isBeingDragged={draggingFopId === fop.id}
                onToggleExpand={onToggleExpand}
                onEditClick={onEditClick}
                onAddWorkerClick={onAddWorkerClick}
                onEditWorkerClick={onEditWorkerClick}
                onDeleteWorkerClick={onDeleteWorkerClick}
                onUpdateFolderAndGroup={onUpdateFolderAndGroup}
                onContextMenu={onContextMenu}
                onPointerDragStart={onPointerDragStart}
              />
            ))
          )}
        </div>
      )}

      {/* Hint if collapsed and dragging over */}
      {isCollapsed && activeDragOver && (
        <div className="py-3 px-4 rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50 text-emerald-800 text-xs font-extrabold text-center animate-pulse">
          Відпустіть тут, щоб перемістити у згорнуту папку "{group ? group.name : "Без категорії"}"!
        </div>
      )}
    </div>
  );
};
