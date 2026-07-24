import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  FolderIcon,
  CheckBadgeIcon,
  UserIcon,
  ExclamationCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { DiscoveredFopDto } from "../types/fop";

interface FolderScanModalProps {
  isOpen: boolean;
  discoveredFops: DiscoveredFopDto[];
  onClose: () => void;
  onImport: (selectedItems: DiscoveredFopDto[]) => Promise<void>;
  onOpenAddModal?: () => void;
}

export const FolderScanModal: React.FC<FolderScanModalProps> = ({
  isOpen,
  discoveredFops,
  onClose,
  onImport,
  onOpenAddModal,
}) => {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const newItems = discoveredFops.filter((f) => !f.already_exists);
      if (newItems.length > 0) {
        setSelectedPaths(newItems.map((f) => f.folder_path));
      } else {
        // If all items already exist in DB, select all so user can force import/sync them easily
        setSelectedPaths(discoveredFops.map((f) => f.folder_path));
      }
    }
  }, [isOpen, discoveredFops]);

  if (!isOpen) return null;

  const isAllSelected =
    discoveredFops.length > 0 && discoveredFops.every((f) => selectedPaths.includes(f.folder_path));

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedPaths([]);
    } else {
      setSelectedPaths(discoveredFops.map((f) => f.folder_path));
    }
  };

  const handleToggleItem = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleConfirmImport = async () => {
    const selectedItems = discoveredFops.filter((f) => selectedPaths.includes(f.folder_path));
    if (selectedItems.length === 0) return;
    setIsSubmitting(true);
    try {
      await onImport(selectedItems);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#cbd8d6] rounded-[32px] w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-modalScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b-2 border-[#e2eceb] bg-[#f8faf9]">
          <h2 className="text-xl font-black text-[#133b47] font-heading flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#133b47] flex items-center justify-center text-[#f8a44c] shadow-sm">
              <MagnifyingGlassIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span>Розпізнані папки ФОП ({discoveredFops.length})</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-[#5c777f] hover:text-[#133b47] hover:bg-[#e6eeed] transition-all cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Sub-header Controls */}
        <div className="px-8 py-4 bg-[#f0f5f4] border-b-2 border-[#e2eceb] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleAll}
              disabled={discoveredFops.length === 0}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border-2 ${
                isAllSelected
                  ? "bg-[#133b47] text-[#f8a44c] border-[#133b47]"
                  : "bg-white text-[#133b47] border-[#b9cecc] hover:border-[#133b47]"
              } ${discoveredFops.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <CheckBadgeIcon className="w-4 h-4 stroke-[2.2]" />
              <span>{isAllSelected ? "Зняти виділення з усіх" : "Виділити всі"}</span>
            </button>
            <span className="text-xs font-black text-[#556e75]">
              Обрано: {selectedPaths.length} з {discoveredFops.length}
            </span>
          </div>

          <div className="text-xs font-extrabold text-[#354f57]">
            Знайдено всього: <span className="font-black text-[#133b47]">{discoveredFops.length}</span> папок
          </div>
        </div>

        {/* Scrollable Discovered List */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3 custom-scrollbar">
          {discoveredFops.length === 0 ? (
            <div className="p-10 text-center text-[#59747c] font-bold text-sm bg-[#f8faf9] rounded-2xl border-2 border-[#e2eceb]">
              <ExclamationCircleIcon className="w-8 h-8 text-amber-500 mx-auto mb-2 stroke-[2]" />
              У цій папці не знайдено папок у форматі "КОД ПРІЗВИЩЕ ІМ'Я ПО БАТЬКОВІ".
            </div>
          ) : (
            discoveredFops.map((fop) => {
              const isChecked = selectedPaths.includes(fop.folder_path);
              const fullName = [fop.vezeteknev, fop.keresztnev, fop.apai_nev].filter(Boolean).join(" ");

              return (
                <div
                  key={fop.folder_path}
                  onClick={() => handleToggleItem(fop.folder_path)}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                    isChecked
                      ? "bg-white border-[#133b47] shadow-sm"
                      : "bg-[#f8faf9] border-[#d8e4e2] hover:border-[#9cb1af]"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleItem(fop.folder_path)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded-lg accent-[#133b47] cursor-pointer shrink-0"
                    />

                    <div className="w-10 h-10 rounded-xl bg-[#133b47]/10 text-[#133b47] flex items-center justify-center font-black text-sm shrink-0">
                      <FolderIcon className="w-5 h-5 stroke-[2]" />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#133b47] truncate">{fullName}</span>
                        {fop.kod && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-[#f8a44c] text-[#133b47] shrink-0">
                            {fop.kod}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#556e75] truncate">
                        Папка: {fop.folder_name}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {fop.already_exists ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-200">
                        <CheckIcon className="w-3.5 h-3.5 stroke-[3]" /> Вже в базі
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200">
                        <UserIcon className="w-3.5 h-3.5 stroke-[2.2]" /> Новий ФОП
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t-2 border-[#e2eceb] bg-[#f8faf9] gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-[#e6eeed] hover:bg-[#d5e2e0] text-[#133b47] font-black text-sm transition-all cursor-pointer"
            >
              Скасувати
            </button>

            {onOpenAddModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddModal();
                }}
                className="px-5 py-3 rounded-2xl bg-white border-2 border-[#133b47] text-[#133b47] hover:bg-[#133b47] hover:text-[#f8a44c] font-black text-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <PlusIcon className="w-4.5 h-4.5 stroke-[2.5]" />
                <span>Створити ФОП вручну</span>
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={selectedPaths.length === 0 || isSubmitting}
            onClick={handleConfirmImport}
            className={`px-8 py-3 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center gap-2 shadow-lg ${
              selectedPaths.length > 0 && !isSubmitting
                ? "bg-[#f8a44c] hover:bg-[#f59533] text-[#133b47] shadow-[#f8a44c]/30"
                : "bg-[#cbd8d6] text-[#6d888c] cursor-not-allowed opacity-60"
            }`}
          >
            <CheckIcon className="w-4.5 h-4.5 stroke-[3]" />
            <span>
              {isSubmitting
                ? "Імпортування..."
                : `Імпортувати обрані (${selectedPaths.length}) ✓`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
