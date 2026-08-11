import React, { useState, useEffect } from "react";
import {
  CloudArrowDownIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  InformationCircleIcon,
  ArrowUturnLeftIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {
  checkForUpdates,
  installUpdate,
  fetchReleaseHistory,
  downloadAndRunReleaseAsset,
  UpdateStatus,
  ReleaseItem,
} from "../services/updaterService";
import { MarkdownViewer } from "./MarkdownViewer";
import { Update } from "@tauri-apps/plugin-updater";
import { getVersion } from "@tauri-apps/api/app";

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUpdateInfo?: Update | null;
  onUpdateProcessed?: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  initialUpdateInfo = null,
  onUpdateProcessed,
}) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [currentUpdate, setCurrentUpdate] = useState<Update | null>(initialUpdateInfo);
  const [selectedRollbackRelease, setSelectedRollbackRelease] = useState<ReleaseItem | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [currentVersion, setCurrentVersion] = useState<string>("0.1.5");

  const [releaseHistory, setReleaseHistory] = useState<ReleaseItem[]>([]);
  const [isLoadingReleases, setIsLoadingReleases] = useState<boolean>(false);
  const [showArchive, setShowArchive] = useState<boolean>(false);

  useEffect(() => {
    async function loadVersion() {
      try {
        const appVer = await getVersion();
        setCurrentVersion(appVer);
      } catch (err) {
        console.error("Failed to get app version:", err);
      }
    }
    if (isOpen) {
      loadVersion();
      loadReleases();
      if (initialUpdateInfo) {
        setCurrentUpdate(initialUpdateInfo);
        setSelectedRollbackRelease(null);
        setUpdateStatus({
          status: "available",
          message: `Знайдено нову версію (${initialUpdateInfo.version})! Перегляньте опис та підтвердіть встановлення.`,
          updateInfo: initialUpdateInfo,
        });
      } else {
        handleCheck();
      }
    }
  }, [isOpen]);

  const loadReleases = async () => {
    setIsLoadingReleases(true);
    const history = await fetchReleaseHistory();
    setReleaseHistory(history);
    setIsLoadingReleases(false);
  };

  if (!isOpen) return null;

  const handleCheck = async (targetTag?: string) => {
    setIsChecking(true);
    setSelectedRollbackRelease(null);
    const updateObj = await checkForUpdates((status) => {
      setUpdateStatus(status);
    }, targetTag);

    setCurrentUpdate(updateObj);
    setIsChecking(false);
  };

  const handleRollbackSelect = (rel: ReleaseItem) => {
    setSelectedRollbackRelease(rel);
    setCurrentUpdate(null);
    setShowArchive(false); // Automatically close the archive dropdown!

    setUpdateStatus({
      status: "available",
      message: `Обрано версію ${rel.name || rel.tag_name} з архіву. Натисніть "Встановити версію" для оновлення.`,
      updateInfo: {
        version: rel.tag_name,
        body: rel.body || "Опис версії з архіву GitHub.",
      } as any,
    });
  };

  const handleStartInstallation = async () => {
    setIsInstalling(true);

    if (currentUpdate) {
      const success = await installUpdate(currentUpdate, (status) => {
        setUpdateStatus(status);
      });
      setIsInstalling(false);
      if (success && onUpdateProcessed) {
        onUpdateProcessed();
      }
    } else if (selectedRollbackRelease) {
      const assets = selectedRollbackRelease.assets || [];
      const installerAsset =
        assets.find(
          (a) =>
            a.name.endsWith(".exe") ||
            a.name.endsWith(".msi") ||
            a.name.endsWith(".nsis.zip") ||
            a.name.endsWith(".zip")
        ) || assets[0];

      if (installerAsset) {
        await downloadAndRunReleaseAsset(
          installerAsset.browser_download_url,
          installerAsset.name,
          (status) => setUpdateStatus(status)
        );
      } else {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        await openUrl(selectedRollbackRelease.html_url);
        setUpdateStatus({
          status: "available",
          message: `Відкрито сторінку завантаження версії ${selectedRollbackRelease.tag_name} у браузері.`,
        });
      }
      setIsInstalling(false);
    }
  };

  const percent = updateStatus?.progressPercent ?? 0;
  const downloadedMB = updateStatus?.downloadedBytes
    ? (updateStatus.downloadedBytes / (1024 * 1024)).toFixed(1)
    : "0.0";
  const totalMB = updateStatus?.totalBytes
    ? (updateStatus.totalBytes / (1024 * 1024)).toFixed(1)
    : "0.0";
  const isDownloading = updateStatus?.status === "downloading";

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn"
      onClick={isInstalling ? undefined : onClose}
    >
      <div
        className="bg-white border-2 border-[#cbd9d7] rounded-[32px] w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-modalScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b-2 border-[#e2eceb] bg-[#f8faf9] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#133b47] flex items-center justify-center text-[#f8a44c] shadow-md shadow-[#133b47]/15">
              <CloudArrowDownIcon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-[#133b47] font-heading">
                  Оновлення та версії програми
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#133b47]/10 text-[#133b47] text-xs font-black">
                  v{currentVersion}
                </span>
              </div>
              <p className="text-xs font-bold text-[#556e75]">
                Керування версіями, опис випусків та автоматичне оновлення
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCheck()}
              disabled={isChecking || isInstalling}
              className="px-5 py-2.5 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 stroke-[2.5] ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Перевірка..." : "Перевірити оновлення"}</span>
            </button>

            {!isInstalling && (
              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl text-[#5c777f] hover:text-[#133b47] hover:bg-[#e6eeed] transition-all cursor-pointer border border-[#cbd9d7]"
              >
                <XMarkIcon className="w-6 h-6 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-8 flex flex-col gap-5 flex-1 overflow-y-auto bg-[#fdfdfd]">
          {/* Top Status Banner & Actions */}
          {isDownloading ? (
            /* CLEAN & SOLID IN-APP UPDATING PROGRESS CARD */
            <div className="p-6 rounded-3xl bg-[#f4f8f7] border-2 border-[#bdcdcb] flex flex-col gap-4 shadow-sm animate-fadeIn shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center shadow-xs">
                    <ArrowPathIcon className="w-5 h-5 stroke-[2.5] animate-spin" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-base font-black text-[#133b47]">
                      Завантаження та оновлення програми...
                    </h3>
                    <span className="text-xs font-bold text-[#556e75]">
                      {updateStatus.message}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black text-[#133b47] bg-white px-3 py-1 rounded-xl border border-[#cbd9d7]">
                    {percent}%
                  </span>
                  {totalMB !== "0.0" && (
                    <span className="text-xs font-extrabold text-[#556e75]">
                      {downloadedMB} MB / {totalMB} MB
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#cbd9d7] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#bdcdcb]">
                <div
                  className="bg-gradient-to-r from-[#133b47] via-[#1c5363] to-[#f8a44c] h-full rounded-full transition-all duration-300 shadow-xs"
                  style={{ width: `${Math.max(percent, 6)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="shrink-0">
              {updateStatus?.status === "up-to-date" && !selectedRollbackRelease && (
                <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <CheckCircleIcon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-base font-black text-emerald-950">
                        У вас встановлено найновішу версію (v{currentVersion})!
                      </h3>
                      <p className="text-xs font-bold text-emerald-700">
                        Програма оновлена. Усі кадрові інструменти функціонують належним чином.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300">
                    Актуальна
                  </span>
                </div>
              )}

              {updateStatus?.status === "available" && (
                <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <SparklesIcon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-amber-950">
                          {selectedRollbackRelease
                            ? `Обрано з архіву: ${selectedRollbackRelease.tag_name}`
                            : `Доступна новіша версія: v${updateStatus.updateInfo?.version}`}
                        </h3>
                        {selectedRollbackRelease && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-black uppercase">
                            Rollback
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-amber-800">
                        {updateStatus.message}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleStartInstallation}
                    disabled={isInstalling}
                    className="px-6 py-3 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 border border-[#133b47] disabled:opacity-50 transform hover:-translate-y-0.5"
                  >
                    <CloudArrowDownIcon className="w-4.5 h-4.5 stroke-[2.5]" />
                    <span>
                      Встановити версію ({currentUpdate?.version || selectedRollbackRelease?.tag_name})
                    </span>
                  </button>
                </div>
              )}

              {updateStatus?.status === "error" && (
                <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-200 flex items-center gap-3.5 shadow-xs">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <ExclamationCircleIcon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-base font-black text-rose-950">Помилка</h3>
                    <p className="text-xs font-bold text-rose-800">{updateStatus.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Spacious Center Box: Formatted Release Notes */}
          <div className="flex flex-col gap-3 flex-1 bg-[#f8faf9] p-6 rounded-3xl border-2 border-[#cbd9d7] shadow-inner overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#cbd9d7] shrink-0">
              <span className="font-black text-[#133b47] flex items-center gap-2 text-xs uppercase tracking-wider">
                <InformationCircleIcon className="w-4 h-4 text-[#f8a44c] stroke-[2.5]" />
                {selectedRollbackRelease
                  ? `Опис обраної версії (${selectedRollbackRelease.tag_name})`
                  : "Опис випуску та змін"}
              </span>
              {updateStatus?.updateInfo?.version && (
                <span className="px-3 py-1 rounded-xl bg-white text-[#133b47] font-black text-xs border border-[#cbd9d7]">
                  Версія: {updateStatus.updateInfo.version}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {updateStatus?.updateInfo?.body ? (
                <MarkdownViewer content={updateStatus.updateInfo.body} />
              ) : (
                <div className="p-8 text-center text-xs font-bold text-[#556e75] italic">
                  Для цієї версії відсутній додатковий текстовий опис.
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Section: Release Archive (Past Versions) */}
          {!isDownloading && (
            <div className="border-t-2 border-[#e2eceb] pt-4 shrink-0 flex flex-col gap-3">
              <button
                onClick={() => setShowArchive(!showArchive)}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#f4f8f7] hover:bg-[#e8f1ef] border-2 border-[#cbd9d7] transition-all cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <ArrowUturnLeftIcon className="w-4 h-4 text-[#133b47] stroke-[2.2]" />
                  <span className="text-xs font-black text-[#133b47]">
                    Архів усіх випусків (Повернення до попередніх версій)
                  </span>
                  <span className="text-[11px] font-bold text-[#556e75] bg-white px-2.5 py-0.5 rounded-full border border-[#cbd9d7]">
                    {releaseHistory.length} випусків
                  </span>
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 text-[#556e75] transition-transform duration-200 ${
                    showArchive ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showArchive && (
                <div className="p-4 rounded-2xl bg-[#f8faf9] border-2 border-[#cbd9d7] flex flex-col gap-3 animate-fadeIn">
                  <p className="text-xs text-[#556e75] font-semibold">
                    Оберіть потрібну версію з архіву для автоматичного перевстановлення:
                  </p>

                  {isLoadingReleases ? (
                    <div className="p-4 text-center text-xs font-bold text-[#556e75] flex items-center justify-center gap-2">
                      <ArrowPathIcon className="w-4 h-4 animate-spin text-[#133b47]" />
                      <span>Завантаження архіву версій з GitHub...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {releaseHistory.map((rel) => {
                        const isCurrent = rel.tag_name.includes(currentVersion);
                        const isSelected = selectedRollbackRelease?.tag_name === rel.tag_name;
                        return (
                          <div
                            key={rel.tag_name}
                            className={`p-3.5 rounded-xl border-2 flex items-center justify-between gap-4 transition-all ${
                              isSelected
                                ? "bg-amber-50 border-amber-400 shadow-xs"
                                : "bg-white border-[#cbd9d7] hover:border-[#133b47]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-[#133b47]">
                                {rel.name || rel.tag_name}
                              </span>
                              {isCurrent && (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                                  Поточна
                                </span>
                              )}
                              <span className="text-[10px] text-[#6d8a93] font-semibold">
                                {new Date(rel.published_at).toLocaleDateString("uk-UA")}
                              </span>
                            </div>

                            <button
                              onClick={() => handleRollbackSelect(rel)}
                              disabled={isChecking || isInstalling}
                              className="px-4 py-1.5 rounded-xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] text-xs font-black transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <ArrowUturnLeftIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                              <span>Обрати</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t-2 border-[#e2eceb] bg-[#f8faf9] shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-[#556e75]">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
            <span>Офіційні інсталятори KaderGo з підписом безпеки</span>
          </div>

          <button
            onClick={onClose}
            disabled={isInstalling}
            className="px-7 py-3 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-sm transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
