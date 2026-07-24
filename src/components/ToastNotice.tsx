import React from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface ToastNoticeProps {
  message: string;
}

export const ToastNotice: React.FC<ToastNoticeProps> = ({ message }) => {
  return (
    <div className="fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl bg-[#133b47] text-white shadow-2xl border border-[#133b47]/50 flex items-center gap-3 animate-slideUp z-50">
      <InformationCircleIcon className="w-5 h-5 text-[#f8a44c] shrink-0" />
      <span className="text-sm font-bold">{message}</span>
    </div>
  );
};
