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
} from "@heroicons/react/24/outline";
import {
  checkForUpdates,
  installUpdate,
  fetchReleaseHistory,
  downloadAndRunReleaseAsset,
  UpdateStatus,
  ReleaseItem,
} from "../services/updaterService";
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
  const [currentVersion, setCurrentVersion] = useState<string>("0.1.4");
  
  const [releaseHistory, setReleaseHistory] = useState<ReleaseItem[]>([]);
  const [isLoadingReleases, setIsLoadingReleases] = useState<boolean>(false);
  const [showRollbackSection, setShowRollbackSection] = useState<boolean>(false);

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

    setUpdateStatus({
      status: "available",
      message: `Обрано версію ${rel.name || rel.tag_name} з архіву. Натисніть "Встановити версію" для завантаження інсталятора.`,
      updateInfo: {
        version: rel.tag_name,
        body: rel.body || "Опис версії з архіву GitHub.",
      } as any,
    });
  };

  const handleStartInstallation = async () => {
    setIsInstalling(true);

    if (currentUpdate) {
      // Use Tauri Updater plugin installation
      const success = await installUpdate(currentUpdate, (status) => {
        setUpdateStatus(status);
      });
      setIsInstalling(false);
      if (success && onUpdateProcessed) {
        onUpdateProcessed();
      }
    } else if (selectedRollbackRelease) {
      // Rollback to selected release from GitHub assets
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
        // Fallback: open release page
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

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#bdcdcb] rounded-[32px] w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-modalScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b-2 border-[#e2eceb] bg-[#f8faf9]">
          <h2 className="text-xl font-black text-[#133b47] font-heading flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#133b47] flex items-center justify-center text-[#f8a44c] shadow-sm">
              <CloudArrowDownIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            Оновлення та версії програми
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-[#5c777f] hover:text-[#133b47] hover:bg-[#e6eeed] transition-all cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto">
          {/* Current Version Bar */}
          <div className="p-5 rounded-3xl bg-[#f4f8f7] border-2 border-[#cbd9d7] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#556e75] uppercase tracking-wider">
                Встановлена версія
              </span>
              <span className="text-xl font-black text-[#133b47]">
                v{currentVersion}
              </span>
            </div>
            <button
              onClick={() => handleCheck()}
              disabled={isChecking || isInstalling}
              className="px-5 py-2.5 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 stroke-[2.5] ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Перевірка..." : "Перевірити оновлення"}</span>
            </button>
          </div>

          {/* Update Available & Release Notes Section */}
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
                      У вас встановлено найновішу версію!
                    </h3>
                    <p className="text-xs font-bold text-emerald-700 mt-1">
                      Ви використовуєте актуальну версію програми (v{currentVersion}).
                    </p>
                  </div>
                </div>
              )}

              {/* Update Available / Downloading State */}
              {(updateStatus.status === "available" || updateStatus.status === "downloading") && (
                <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-200 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                      <SparklesIcon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-amber-950">
                        {selectedRollbackRelease
                          ? `Обрано версію з архіву (${selectedRollbackRelease.tag_name})`
                          : "Доступна версія для встановлення!"}
                      </h3>
                      {updateStatus.updateInfo && (
                        <span className="text-xs font-black text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                          v{updateStatus.updateInfo.version}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Release Notes / Changelog */}
                  {updateStatus.updateInfo?.body && (
                    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white border border-amber-200 text-xs text-amber-950">
                      <span className="font-black text-amber-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <InformationCircleIcon className="w-4 h-4 stroke-[2.2]" />
                        Опис змін та оновлення (Release Notes)
                      </span>
                      <div className="font-mono bg-amber-50/50 p-3.5 rounded-xl max-h-48 overflow-y-auto whitespace-pre-wrap font-semibold leading-relaxed border border-amber-100 text-slate-800">
                        {updateStatus.updateInfo.body}
                      </div>
                    </div>
                  )}

                  {/* Status / Download progress indicator */}
                  <div className="p-3.5 rounded-2xl bg-amber-100/70 border border-amber-200 text-xs font-black text-amber-900 text-center">
                    {updateStatus.message}
                  </div>

                  {/* Action decision buttons */}
                  {updateStatus.status === "available" && (currentUpdate || selectedRollbackRelease) && (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-all cursor-pointer"
                      >
                        Пізніше
                      </button>
                      <button
                        onClick={handleStartInstallation}
                        disabled={isInstalling}
                        className="px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        <CloudArrowDownIcon className="w-4 h-4 stroke-[2.5]" />
                        <span>
                          Встановити версію ({currentUpdate?.version || selectedRollbackRelease?.tag_name})
                        </span>
                      </button>
                    </div>
                  )}
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
                        Не вдалося перевірити або завантажити оновлення.
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

          {/* Rollback / Previous Versions Collapsible Section */}
          <div className="border-t-2 border-[#e2eceb] pt-5 flex flex-col gap-3">
            <button
              onClick={() => setShowRollbackSection(!showRollbackSection)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f8f7] hover:bg-[#e8f1ef] border border-[#cbd8d6] transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <ArrowUturnLeftIcon className="w-4 h-4 text-[#133b47] stroke-[2.2]" />
                <span className="text-xs font-black text-[#133b47]">
                  Повернення до попередньої версії (Архів версій)
                </span>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-[#556e75] transition-transform duration-200 ${
                  showRollbackSection ? "rotate-180" : ""
                }`}
              />
            </button>

            {showRollbackSection && (
              <div className="p-4 rounded-2xl bg-[#f8faf9] border border-[#cbd8d6] flex flex-col gap-4 animate-fadeIn">
                <p className="text-xs text-[#556e75] font-semibold">
                  Тут ви можете обрати попередню версію випуску, якщо у новій версії виникли проблеми:
                </p>

                {isLoadingReleases ? (
                  <div className="p-4 text-center text-xs font-bold text-[#556e75] flex items-center justify-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    <span>Завантаження історії версій...</span>
                  </div>
                ) : releaseHistory.length === 0 ? (
                  <div className="p-3 text-center text-xs font-bold text-[#556e75]">
                    Попередніх випусків у репозиторії не знайдено.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                    {releaseHistory.map((rel) => {
                      const isCurrent = rel.tag_name.includes(currentVersion);
                      const isSelected = selectedRollbackRelease?.tag_name === rel.tag_name;
                      return (
                        <div
                          key={rel.tag_name}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isSelected
                              ? "bg-amber-50 border-amber-400 shadow-xs"
                              : "bg-white border-[#d0dedc] hover:border-[#133b47]"
                          }`}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#133b47]">
                                {rel.name || rel.tag_name}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                  Поточна
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#6d8a93] font-semibold">
                              Опубліковано: {new Date(rel.published_at).toLocaleDateString("uk-UA")}
                            </span>
                          </div>

                          <button
                            onClick={() => handleRollbackSelect(rel)}
                            disabled={isChecking || isInstalling}
                            className="px-3.5 py-1.5 rounded-xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] text-xs font-black transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
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
