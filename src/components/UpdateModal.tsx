import React, { useState, useEffect } from "react";
import {
  CloudArrowDownIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { checkForUpdates, UpdateStatus } from "../services/updaterService";

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose }) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const currentVersion = "0.1.0";

  useEffect(() => {
    if (isOpen && !updateStatus) {
      handleCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheck = async () => {
    setIsChecking(true);
    await checkForUpdates((status) => {
      setUpdateStatus(status);
    });
    setIsChecking(false);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#bdcdcb] rounded-[32px] w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-modalScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b-2 border-[#e2eceb] bg-[#f8faf9]">
          <h2 className="text-xl font-black text-[#133b47] font-heading flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#133b47] flex items-center justify-center text-[#f8a44c] shadow-sm">
              <CloudArrowDownIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            Оновлення системи
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-[#5c777f] hover:text-[#133b47] hover:bg-[#e6eeed] transition-all cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
          {/* Current Version Card */}
          <div className="p-5 rounded-3xl bg-[#f4f8f7] border-2 border-[#cbd9d7] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#556e75] uppercase tracking-wider">
                Поточна версія
              </span>
              <span className="text-xl font-black text-[#133b47]">
                v{currentVersion}
              </span>
            </div>
            <button
              onClick={handleCheck}
              disabled={isChecking}
              className="px-5 py-2.5 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 stroke-[2.5] ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Перевірка..." : "Перевірити оновлення"}</span>
            </button>
          </div>

          {/* Update Status Display */}
          {updateStatus && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              {/* Up to Date State */}
              {updateStatus.status === "up-to-date" && (
                <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircleIcon className="w-7 h-7 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">
                      Система працює на найновішій версії!
                    </h3>
                    <p className="text-xs font-bold text-emerald-700 mt-1">
                      Ви використовуєте актуальну версію програми (v{currentVersion}).
                    </p>
                  </div>
                </div>
              )}

              {/* Update Available or Downloading State */}
              {(updateStatus.status === "available" || updateStatus.status === "downloading") && (
                <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-200 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                      <SparklesIcon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-amber-950">
                        Доступне нове оновлення!
                      </h3>
                      {updateStatus.updateInfo && (
                        <span className="text-xs font-black text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                          v{updateStatus.updateInfo.version}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Release Notes / Description */}
                  {updateStatus.updateInfo?.body && (
                    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white border border-amber-200 text-xs text-amber-950">
                      <span className="font-black text-amber-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <InformationCircleIcon className="w-4 h-4 stroke-[2.2]" />
                        Опис оновлення (Release Notes)
                      </span>
                      <div className="font-mono bg-amber-50/50 p-3 rounded-xl max-h-40 overflow-y-auto whitespace-pre-wrap font-semibold leading-relaxed border border-amber-100">
                        {updateStatus.updateInfo.body}
                      </div>
                    </div>
                  )}

                  {/* Progress message */}
                  <div className="p-3.5 rounded-2xl bg-amber-100/70 border border-amber-200 text-xs font-black text-amber-900 text-center">
                    {updateStatus.message}
                  </div>
                </div>
              )}

              {/* Error State */}
              {updateStatus.status === "error" && (
                <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-200 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                      <ExclamationCircleIcon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-rose-950">
                        Сталася помилка
                      </h3>
                      <p className="text-xs font-extrabold text-rose-700">
                        Не вдалося перевірити наявність оновлень.
                      </p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-rose-200 text-xs font-mono font-bold text-rose-900 break-all">
                    {updateStatus.message}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-8 py-5 border-t-2 border-[#e2eceb] bg-[#f8faf9]">
          <button
            onClick={onClose}
            className="px-7 py-3 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-sm transition-all cursor-pointer shadow-md"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
