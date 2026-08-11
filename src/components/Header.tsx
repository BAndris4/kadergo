import React from "react";
import { DocumentTextIcon, UserGroupIcon, Cog6ToothIcon, CloudArrowDownIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
  activeTab: "generator" | "management";
  onTabChange: (tab: "generator" | "management") => void;
  onOpenSettings: () => void;
  onOpenUpdate?: () => void;
  onGoHome?: () => void;
  hasUpdateNotification?: boolean;
  availableVersion?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenUpdate,
  onGoHome,
  hasUpdateNotification = false,
  availableVersion,
}) => {
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
        {/* System Auto-Update Button with Notification Badge */}
        {onOpenUpdate && (
          <button
            onClick={onOpenUpdate}
            title={
              hasUpdateNotification
                ? `Доступне нове оновлення ${availableVersion || ""}! Натисніть для перегляду.`
                : "Перевірити оновлення системи"
            }
            className={`relative p-3.5 rounded-2xl border-2 font-black transition-all cursor-pointer shadow-xs transform hover:-translate-y-0.5 ${
              hasUpdateNotification
                ? "bg-amber-500 text-white border-amber-600 shadow-amber-500/30 animate-pulse"
                : "bg-white hover:bg-[#f6faf9] text-[#133b47] border-[#cbd8d6]"
            }`}
          >
            <CloudArrowDownIcon
              className={`w-5 h-5 stroke-[2.2] ${hasUpdateNotification ? "text-white" : "text-[#133b47]"}`}
            />
            {hasUpdateNotification && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[9px] font-black text-white items-center justify-center border-2 border-white">
                  !
                </span>
              </span>
            )}
          </button>
        )}

        {/* Settings / Preferences Button */}
        <button
          onClick={onOpenSettings}
          title="Налаштування"
          className="p-3.5 rounded-2xl bg-white hover:bg-[#f6faf9] text-[#133b47] border-2 border-[#cbd8d6] font-black transition-all cursor-pointer shadow-xs transform hover:-translate-y-0.5"
        >
          <Cog6ToothIcon className="w-5 h-5 text-[#133b47] stroke-[2.2]" />
        </button>
      </div>
    </header>
  );
};
