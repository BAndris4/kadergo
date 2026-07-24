import React, { useState } from "react";
import { BriefcaseIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CreateFopFormState } from "../../types/fop";
import { INITIAL_FORM_STATE } from "../../constants/initialData";
import { Stepper } from "./Stepper";
import { Step1PersonalInfo } from "./Step1PersonalInfo";
import { Step2Address } from "./Step2Address";
import { Step3Document } from "./Step3Document";

interface AddFopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateFopFormState) => Promise<void>;
}

export const AddFopModal: React.FC<AddFopModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [formData, setFormData] = useState<CreateFopFormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<{ vezeteknev?: string; keresztnev?: string; apai_nev?: string; kod?: string }>({});

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setActiveStep(1);
      return;
    }
    await onSubmit(formData);
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setActiveStep(1);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
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

        {/* Stepper Progress */}
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
      </div>
    </div>
  );
};
