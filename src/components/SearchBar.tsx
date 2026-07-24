import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative w-full">
      <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-[#4d6a74] pointer-events-none stroke-[2.2]" />
      <input
        type="text"
        placeholder="Пошук за ім'ям або кодом особи чи працівника..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-bold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 shadow-sm transition-all placeholder-[#718c94]"
      />
    </div>
  );
};
