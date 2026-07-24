import React from "react";

interface WorkerStepperProps {
  activeStep: number;
  onGoToStep: (step: number) => void;
}

export const WorkerStepper: React.FC<WorkerStepperProps> = ({ activeStep, onGoToStep }) => {
  return (
    <div className="flex items-center justify-between px-8 py-5 bg-[#f8faf9] border-b-2 border-[#e2eceb] overflow-x-auto gap-2">
      {/* Step 1 */}
      <div
        onClick={() => onGoToStep(1)}
        className={`flex items-center gap-3 cursor-pointer select-none transition-opacity ${
          activeStep >= 1 ? "opacity-100" : "opacity-50"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black font-heading transition-all ${
            activeStep > 1
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
              : activeStep === 1
              ? "bg-[#133b47] text-[#f8a44c] shadow-lg shadow-[#133b47]/20"
              : "bg-[#d5e0de] text-[#556e75]"
          }`}
        >
          {activeStep > 1 ? "✓" : "1"}
        </div>
        <span className="text-sm font-black text-[#133b47] whitespace-nowrap">Особисті дані</span>
      </div>

      <div className="flex-1 h-0.5 bg-[#c8d9d7] min-w-4" />

      {/* Step 2 */}
      <div
        onClick={() => onGoToStep(2)}
        className={`flex items-center gap-3 cursor-pointer select-none transition-opacity ${
          activeStep >= 2 ? "opacity-100" : "opacity-50"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black font-heading transition-all ${
            activeStep > 2
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
              : activeStep === 2
              ? "bg-[#133b47] text-[#f8a44c] shadow-lg shadow-[#133b47]/20"
              : "bg-[#d5e0de] text-[#556e75]"
          }`}
        >
          {activeStep > 2 ? "✓" : "2"}
        </div>
        <span className="text-sm font-black text-[#133b47] whitespace-nowrap">Працевлаштування</span>
      </div>

      <div className="flex-1 h-0.5 bg-[#c8d9d7] min-w-4" />

      {/* Step 3 */}
      <div
        onClick={() => onGoToStep(3)}
        className={`flex items-center gap-3 cursor-pointer select-none transition-opacity ${
          activeStep >= 3 ? "opacity-100" : "opacity-50"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black font-heading transition-all ${
            activeStep > 3
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
              : activeStep === 3
              ? "bg-[#133b47] text-[#f8a44c] shadow-lg shadow-[#133b47]/20"
              : "bg-[#d5e0de] text-[#556e75]"
          }`}
        >
          {activeStep > 3 ? "✓" : "3"}
        </div>
        <span className="text-sm font-black text-[#133b47] whitespace-nowrap">Адреса</span>
      </div>

      <div className="flex-1 h-0.5 bg-[#c8d9d7] min-w-4" />

      {/* Step 4 */}
      <div
        onClick={() => onGoToStep(4)}
        className={`flex items-center gap-3 cursor-pointer select-none transition-opacity ${
          activeStep >= 4 ? "opacity-100" : "opacity-50"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black font-heading transition-all ${
            activeStep === 4
              ? "bg-[#133b47] text-[#f8a44c] shadow-lg shadow-[#133b47]/20"
              : "bg-[#d5e0de] text-[#556e75]"
          }`}
        >
          4
        </div>
        <span className="text-sm font-black text-[#133b47] whitespace-nowrap">Документи</span>
      </div>
    </div>
  );
};
