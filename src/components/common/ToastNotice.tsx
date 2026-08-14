import React from "react";
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface ToastNoticeProps {
  message: string;
}

export const ToastNotice: React.FC<ToastNoticeProps> = ({ message }) => {
  // Strip emojis from message
  const cleanMessage = message
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "")
    .trim();

  const lower = cleanMessage.toLowerCase();
  const isWarning =
    lower.includes("спочатку") ||
    lower.includes("помилка") ||
    lower.includes("не вказано") ||
    lower.includes("не знайдено") ||
    lower.includes("увага") ||
    lower.includes("обов'язков");

  const isSuccess =
    lower.includes("успішно") ||
    lower.includes("створено") ||
    lower.includes("оновлено") ||
    lower.includes("видалено") ||
    lower.includes("звільнено") ||
    lower.includes("імпортовано") ||
    lower.includes("збережено");

  return (
    <div className="fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl bg-[#133b47] text-white shadow-2xl border border-[#133b47]/50 flex items-center gap-3 animate-slideUp z-50">
      {isWarning ? (
        <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 stroke-[2.2] shrink-0" />
      ) : isSuccess ? (
        <CheckCircleIcon className="w-5 h-5 text-emerald-400 stroke-[2.2] shrink-0" />
      ) : (
        <InformationCircleIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.2] shrink-0" />
      )}
      <span className="text-sm font-bold">{cleanMessage}</span>
    </div>
  );
};
