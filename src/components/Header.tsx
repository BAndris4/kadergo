import React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal }) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-6 pb-7 mb-9 border-b border-[#c8d9d7]">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[#133b47] flex items-center justify-center text-[#f8a44c] font-black text-2xl shadow-lg shadow-[#133b47]/20">
          K
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#133b47] font-heading">
            KaderGo
          </h1>
          <p className="text-sm text-[#4e6770] font-bold">
            Система обліку ФОП та працівників
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[#f8a44c] hover:bg-[#f59533] text-[#133b47] font-black text-base shadow-xl shadow-[#f8a44c]/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <PlusIcon className="w-6 h-6 stroke-[3]" />
          Додати нового ФОП
        </button>
      </div>
    </header>
  );
};
