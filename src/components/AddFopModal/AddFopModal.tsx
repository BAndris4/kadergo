import React, { useState } from "react";
import {
  BriefcaseIcon,
  XMarkIcon,
  FolderPlusIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { CreateFopFormState, DiscoveredFopDto } from "../../types/fop";
import { INITIAL_FORM_STATE } from "../../constants/initialData";
import { Stepper } from "./Stepper";
import { Step1PersonalInfo } from "./Step1PersonalInfo";
import { Step2Address } from "./Step2Address";
import { Step3Document } from "./Step3Document";
import { pickFopFolder, parseFopFolderInfo } from "../../services/fopService";

interface AddFopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateFopFormState) => Promise<void>;
}

export const AddFopModal: React.FC<AddFopModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [creationMode, setCreationMode] = useState<"quick_folder" | "manual">("quick_folder");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [formData, setFormData] = useState<CreateFopFormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<{ vezeteknev?: string; keresztnev?: string; apai_nev?: string; kod?: string }>({});
  const [parsedInfo, setParsedInfo] = useState<DiscoveredFopDto | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "vezeteknev" || name === "keresztnev" || name === "apai_nev" || name === "kod") {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTypeToggle = (type: 0 | 1) => {
    setFormData((prev) => ({ ...prev, okmany_tipus: type }));
  };

  const validateStep1 = (): boolean => {
    const errs: { vezeteknev?: string; keresztnev?: string; apai_nev?: string; kod?: string } = {};
    if (!formData.vezeteknev.trim()) {
      errs.vezeteknev = "Прізвище є обов'язковим полім!";
    }
    if (!formData.keresztnev.trim()) {
      errs.keresztnev = "Ім'я є обов'язковим полім!";
    }
    if (!formData.apai_nev.trim()) {
      errs.apai_nev = "По батькові є обов'язковим полім!";
    }
    if (!formData.kod.trim()) {
      errs.kod = "Ідентифікаційний код є обов'язковим полім!";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (activeStep === 1) {
      if (validateStep1()) {
        setActiveStep(2);
      }
    } else if (activeStep === 2) {
      setActiveStep(3);
    }
  };

  const handlePrevStep = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (activeStep > 1) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleGoToStep = (step: number) => {
    if (step > 1 && !validateStep1()) {
      return;
    }
    setActiveStep(step);
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStep1()) {
      setCreationMode("manual");
      setActiveStep(1);
      return;
    }
    await onSubmit(formData);
    setFormData(INITIAL_FORM_STATE);
    setParsedInfo(null);
    setParseError(null);
    setErrors({});
    setActiveStep(1);
    setCreationMode("quick_folder");
  };

  const handlePickFolderForQuickAdd = async () => {
    try {
      setParseError(null);
      const chosen = await pickFopFolder();
      if (!chosen) return;

      setIsParsing(true);
      const parsed = await parseFopFolderInfo(chosen);
      setParsedInfo(parsed);

      setFormData((prev) => ({
        ...prev,
        vezeteknev: parsed.vezeteknev || prev.vezeteknev,
        keresztnev: parsed.keresztnev || prev.keresztnev,
        apai_nev: parsed.apai_nev || prev.apai_nev,
        kod: parsed.kod || prev.kod,
        folder_path: parsed.folder_path,
      }));
      setErrors({});
    } catch (err: any) {
      console.error("Failed to parse folder:", err);
      setParseError(err?.message || String(err));
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999999] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#c4d2d0] rounded-[32px] w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-modalScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b-2 border-[#e2eceb] bg-[#f8faf9]">
          <h2 className="text-xl font-black text-[#133b47] font-heading flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#133b47] flex items-center justify-center text-[#f8a44c] shadow-sm">
              <BriefcaseIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            Створення нового ФОП
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-[#5c777f] hover:text-[#133b47] hover:bg-[#e6eeed] transition-all cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-8 pt-4 pb-2 bg-[#f4f8f7] border-b border-[#e2eceb] flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCreationMode("quick_folder")}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer border-2 ${
              creationMode === "quick_folder"
                ? "bg-[#133b47] text-[#f8a44c] border-[#133b47] shadow-md shadow-[#133b47]/20"
                : "bg-white text-[#133b47] border-[#cbd8d6] hover:border-[#133b47]/40"
            }`}
          >
            <FolderPlusIcon className="w-4 h-4 stroke-[2.2]" />
            <span>Швидко через папку</span>
          </button>

          <button
            type="button"
            onClick={() => setCreationMode("manual")}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer border-2 ${
              creationMode === "manual"
                ? "bg-[#133b47] text-[#f8a44c] border-[#133b47] shadow-md shadow-[#133b47]/20"
                : "bg-white text-[#133b47] border-[#cbd8d6] hover:border-[#133b47]/40"
            }`}
          >
            <DocumentTextIcon className="w-4 h-4 stroke-[2.2]" />
            <span>Вручну покроково</span>
          </button>
        </div>

        {creationMode === "quick_folder" ? (
          <div className="p-8 overflow-y-auto flex-1 flex flex-col gap-6 custom-scrollbar">
            {/* Folder Picker Action Box */}
            <div
              onClick={handlePickFolderForQuickAdd}
              className="p-8 rounded-3xl border-3 border-dashed border-[#cbd8d6] hover:border-[#133b47] bg-[#f8faf9] hover:bg-[#f0f6f5] transition-all cursor-pointer flex flex-col items-center text-center gap-3 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <FolderPlusIcon className="w-8 h-8 stroke-[2.2]" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-black text-base text-[#133b47] font-heading">
                  {isParsing ? "Розпізнавання папки..." : "Натисніть, щоб обрати папку ФОП на комп'ютері"}
                </span>
                <span className="text-xs font-bold text-[#627f88]">
                  Система автоматично прочитає код та повне ім'я з назви папки (наприклад: "1234567890 Шевченко Тарас Григорович")
                </span>
              </div>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-[#133b47] text-[#f8a44c] font-extrabold text-xs shadow-sm mt-1"
              >
                Обрати папку на диску
              </button>
            </div>

            {parseError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Parsed Result Display */}
            {parsedInfo && (
              <div className="p-6 rounded-3xl bg-[#fdfdfd] border-2 border-[#133b47] shadow-sm flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#e2eceb] pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
                    <span className="font-black text-sm text-[#133b47]">Папку успішно розпізнано!</span>
                  </div>
                  {parsedInfo.already_exists && (
                    <span className="text-xs font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-200">
                      Увага: ФОП з такими даними вже є в базі
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                  <div className="flex flex-col gap-1 bg-[#f8faf9] p-3 rounded-xl border border-[#e2eceb]">
                    <span className="text-[#658189] font-black uppercase text-[10px]">Прізвище</span>
                    <input
                      type="text"
                      name="vezeteknev"
                      value={formData.vezeteknev}
                      onChange={handleInputChange}
                      className="font-black text-sm text-[#133b47] bg-transparent border-b border-transparent focus:border-[#133b47] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1 bg-[#f8faf9] p-3 rounded-xl border border-[#e2eceb]">
                    <span className="text-[#658189] font-black uppercase text-[10px]">Ім'я</span>
                    <input
                      type="text"
                      name="keresztnev"
                      value={formData.keresztnev}
                      onChange={handleInputChange}
                      className="font-black text-sm text-[#133b47] bg-transparent border-b border-transparent focus:border-[#133b47] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1 bg-[#f8faf9] p-3 rounded-xl border border-[#e2eceb]">
                    <span className="text-[#658189] font-black uppercase text-[10px]">По батькові</span>
                    <input
                      type="text"
                      name="apai_nev"
                      value={formData.apai_nev}
                      onChange={handleInputChange}
                      className="font-black text-sm text-[#133b47] bg-transparent border-b border-transparent focus:border-[#133b47] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1 bg-[#f8faf9] p-3 rounded-xl border border-[#e2eceb]">
                    <span className="text-[#658189] font-black uppercase text-[10px]">Ідентифікаційний код</span>
                    <input
                      type="text"
                      name="kod"
                      value={formData.kod}
                      onChange={handleInputChange}
                      className="font-black text-sm text-[#133b47] bg-transparent border-b border-transparent focus:border-[#133b47] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1 bg-[#f8faf9] p-3 rounded-xl border border-[#e2eceb] sm:col-span-2">
                    <span className="text-[#658189] font-black uppercase text-[10px]">Прив'язана папка на диску</span>
                    <span className="font-bold text-xs text-[#133b47] truncate" title={formData.folder_path}>
                      {formData.folder_path}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode("manual");
                      setActiveStep(2);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-[#cbd8d6] hover:border-[#133b47] text-[#133b47] font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Додати адресу та паспорт</span>
                    <ArrowRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormSubmit()}
                    className="px-6 py-2.5 rounded-xl bg-[#f8a44c] hover:bg-[#f59533] text-[#133b47] font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    Створити ФОП зараз ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Stepper Progress for Manual Mode */}
            <Stepper activeStep={activeStep} onGoToStep={handleGoToStep} />

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleFormSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && activeStep < 3) {
                  e.preventDefault();
                  handleNextStep();
                }
              }}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="p-7 overflow-y-auto flex-1 flex flex-col gap-5 custom-scrollbar">
                {activeStep === 1 && (
                  <Step1PersonalInfo formData={formData} errors={errors} onChange={handleInputChange} />
                )}

                {activeStep === 2 && (
                  <Step2Address formData={formData} onChange={handleInputChange} />
                )}

                {activeStep === 3 && (
                  <Step3Document formData={formData} onChange={handleInputChange} onTypeToggle={handleTypeToggle} />
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-8 py-5 border-t-2 border-[#e2eceb] bg-[#f8faf9] gap-4">
                {activeStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-6 py-3 rounded-2xl bg-[#e6eeed] hover:bg-[#d5e2e0] text-[#133b47] font-black text-sm transition-all cursor-pointer"
                  >
                    ← Назад
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 rounded-2xl bg-[#e6eeed] hover:bg-[#d5e2e0] text-[#133b47] font-black text-sm transition-all cursor-pointer"
                  >
                    Скасувати
                  </button>
                )}

                {activeStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-7 py-3 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-white font-black text-sm shadow-md transition-all cursor-pointer"
                  >
                    Далі →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-2xl bg-[#f8a44c] hover:bg-[#f59533] text-[#133b47] font-black text-sm shadow-xl shadow-[#f8a44c]/30 transition-all cursor-pointer"
                  >
                    Створити ФОП ✓
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
