import React from "react";
import { DocumentTextIcon, UserGroupIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
  activeTab: "generator" | "management";
  onTabChange: (tab: "generator" | "management") => void;
  onOpenSettings: () => void;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onOpenSettings, onGoHome }) => {
  const handleLogoClick = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      onTabChange("generator");
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-6 pb-7 mb-9 border-b border-[#c8d9d7]">
      <div
        onClick={handleLogoClick}
        className="flex items-center gap-5 cursor-pointer group select-none"
        title="Перейти на головну сторінку"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#133b47] flex items-center justify-center text-[#f8a44c] font-black text-2xl shadow-lg shadow-[#133b47]/20 group-hover:scale-105 transition-transform duration-200">
          K
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#133b47] font-heading group-hover:text-[#0f2e38] transition-colors">
            KaderGo
          </h1>
          <p className="text-sm text-[#4e6770] font-bold">
            Система генерації кадрових документів ФОП
          </p>
        </div>
      </div>

      {/* Main View Navigation Tabs */}
      <div className="flex bg-[#e2eceb] p-1.5 rounded-2xl border-2 border-[#cbd8d6]">
        <button
          onClick={() => onTabChange("generator")}
          className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "generator"
              ? "bg-[#133b47] text-[#f8a44c] shadow-md"
              : "text-[#556e75] hover:text-[#133b47]"
          }`}
        >
          <DocumentTextIcon className="w-4.5 h-4.5 stroke-[2.2]" />
          Генерація документів
        </button>

        <button
          onClick={() => onTabChange("management")}
          className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "management"
              ? "bg-[#133b47] text-[#f8a44c] shadow-md"
              : "text-[#556e75] hover:text-[#133b47]"
          }`}
        >
          <UserGroupIcon className="w-4.5 h-4.5 stroke-[2.2]" />
          База ФОП та працівників
        </button>
      </div>

      {/* Primary Actions & Preferences */}
      <div className="flex items-center gap-3">
        {/* Settings / Preferences Button */}
        <button
          onClick={onOpenSettings}
          title="Налаштування"
          className="p-3.5 rounded-2xl bg-white hover:bg-[#f6faf9] text-[#133b47] border-2 border-[#cbd8d6] font-black transition-all cursor-pointer shadow-xs"
        >
          <Cog6ToothIcon className="w-5 h-5 text-[#133b47] stroke-[2.2]" />
        </button>
      </div>
    </header>
  );
};
