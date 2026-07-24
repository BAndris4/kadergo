import React, { useState, useEffect } from "react";
import { UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CreateWorkerFormState } from "../../types/fop";
import { WorkerStepper } from "./WorkerStepper";
import { Step1PersonalInfoWorker } from "./Step1PersonalInfoWorker";
import { StepEmployment } from "./StepEmployment";
import { Step2Address } from "../AddFopModal/Step2Address";
import { Step3Document } from "../AddFopModal/Step3Document";

interface AddWorkerModalProps {
  isOpen: boolean;
  fopId: number | null;
  fopOwnerName: string;
  onClose: () => void;
  onSubmit: (formData: CreateWorkerFormState) => Promise<void>;
}

const getTodayString = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const AddWorkerModal: React.FC<AddWorkerModalProps> = ({
  isOpen,
  fopId,
  fopOwnerName,
  onClose,
  onSubmit,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [formData, setFormData] = useState<CreateWorkerFormState>({
    fop_id: fopId || 0,
    vezeteknev: "",
    keresztnev: "",
    apai_nev: "",
    kod: "",
    szuletesi_datum: "",
    nem: "",

    foglalkozas_megnevezes: "",
    fizetes: 8647, // Мінімальна заробітна плата в Україні (8647 грн)
    foallas: true,
    teljes_munkaido: true,
    munkakezdes_datum: getTodayString(),
    kerelem_datum: getTodayString(),
    munkaviszony_vege: "",

    iranyitoszam: "",
    megye: "",
    jaras: "",
    kozseg: "",
    utca: "",
    hazszam: "",
    epulet: "",
    lakas_szoba: "",
    orszag: "Україна",

    okmany_tipus: 0,
    szeria: "",
    okmanyszam: "",
    kiallitott_hatosag: "",
    hatosagi_kod: "",
    kiallitasi_datum: "",
    lejarati_datum: "",
  });

  const [errors, setErrors] = useState<{
    vezeteknev?: string;
    keresztnev?: string;
    apai_nev?: string;
    foglalkozas_megnevezes?: string;
  }>({});

  useEffect(() => {
    if (fopId) {
      setFormData((prev) => ({
        ...prev,
        fop_id: fopId,
        munkakezdes_datum: prev.munkakezdes_datum || getTodayString(),
        kerelem_datum: prev.kerelem_datum || getTodayString(),
      }));
    }
  }, [fopId, isOpen]);

  if (!isOpen || !fopId) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "vezeteknev" || name === "keresztnev" || name === "apai_nev" || name === "foglalkozas_megnevezes") {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTypeToggle = (type: 0 | 1) => {
    setFormData((prev) => ({ ...prev, okmany_tipus: type }));
  };

  const handleToggleState = (field: "foallas" | "teljes_munkaido", val: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const validateStep1 = (): boolean => {
    const errs: { vezeteknev?: string; keresztnev?: string; apai_nev?: string } = {};
    if (!formData.vezeteknev.trim()) errs.vezeteknev = "Прізвище є обов'язковим!";
    if (!formData.keresztnev.trim()) errs.keresztnev = "Ім'я є обов'язковим!";
    if (!formData.apai_nev.trim()) errs.apai_nev = "По батькові є обов'язковим!";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.foglalkozas_megnevezes.trim()) {
      setErrors({ foglalkozas_megnevezes: "Посада є обов'язковою!" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (activeStep === 1) {
      if (validateStep1()) setActiveStep(2);
    } else if (activeStep === 2) {
      if (validateStep2()) setActiveStep(3);
    } else if (activeStep === 3) {
      setActiveStep(4);
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
      setActiveStep(1);
      return;
    }
    if (step > 2 && !validateStep2()) {
      setActiveStep(2);
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
    if (!validateStep2()) {
      setActiveStep(2);
      return;
    }
    await onSubmit(formData);
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
              <UserPlusIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            Оформлення працівника — {fopOwnerName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-[#5c777f] hover:text-[#133b47] hover:bg-[#e6eeed] transition-all cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Stepper Progress */}
        <WorkerStepper activeStep={activeStep} onGoToStep={handleGoToStep} />

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleFormSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && activeStep < 4) {
              e.preventDefault();
              handleNextStep();
            }
          }}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="p-7 overflow-y-auto flex-1 flex flex-col gap-5 custom-scrollbar">
            {activeStep === 1 && (
              <Step1PersonalInfoWorker formData={formData} errors={errors} onChange={handleInputChange} />
            )}

            {activeStep === 2 && (
              <StepEmployment
                formData={formData}
                errors={errors}
                onChange={handleInputChange}
                onToggleState={handleToggleState}
              />
            )}

            {activeStep === 3 && (
              <Step2Address formData={formData as any} onChange={handleInputChange} />
            )}

            {activeStep === 4 && (
              <Step3Document formData={formData as any} onChange={handleInputChange} onTypeToggle={handleTypeToggle} />
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

            {activeStep < 4 ? (
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
                Оформити працівника ✓
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
