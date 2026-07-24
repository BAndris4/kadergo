import React from "react";
import { BriefcaseIcon } from "@heroicons/react/24/outline";
import { CreateWorkerFormState } from "../../types/fop";
import { DatePicker } from "../DatePicker";

interface StepEmploymentProps {
  formData: CreateWorkerFormState;
  errors: { foglalkozas_megnevezes?: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onToggleState: (field: "foallas" | "teljes_munkaido", val: boolean) => void;
}

export const StepEmployment: React.FC<StepEmploymentProps> = ({
  formData,
  errors,
  onChange,
  onToggleState,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-[#fdf8f3] border-2 border-[#f6e4d0]">
      <div className="text-base font-black text-[#133b47] mb-5 font-heading flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#f8a44c]/20 flex items-center justify-center">
          <BriefcaseIcon className="w-5 h-5 text-[#133b47] stroke-[2.2]" />
        </div>
        <span>Дані про працевлаштування та заробітну плату</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Посада / Професія <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="foglalkozas_megnevezes"
            placeholder="Бухгалтер, Менеджер..."
            value={formData.foglalkozas_megnevezes}
            onChange={onChange}
            className={`w-full h-13 px-4 rounded-2xl bg-white border-2 text-[#133b47] text-base font-extrabold focus:outline-none focus:ring-4 focus:ring-[#133b47]/10 transition-all ${
              errors.foglalkozas_megnevezes ? "border-red-500" : "border-[#bdcdcb] focus:border-[#133b47]"
            }`}
          />
          {errors.foglalkozas_megnevezes && (
            <span className="text-xs text-red-600 font-black">{errors.foglalkozas_megnevezes}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Оклад / Заробітна плата (грн)
          </label>
          <input
            type="number"
            name="fizetes"
            placeholder="8647"
            value={formData.fizetes}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Місце роботи
          </label>
          <div className="grid grid-cols-2 gap-2 h-13">
            <button
              type="button"
              onClick={() => onToggleState("foallas", true)}
              className={`h-full rounded-2xl font-black text-xs border-2 transition-all cursor-pointer flex items-center justify-center text-center leading-tight ${
                formData.foallas
                  ? "bg-[#133b47] text-[#f8a44c] border-[#133b47] shadow-md"
                  : "bg-white text-[#556e75] border-[#bdcdcb]"
              }`}
            >
              Основне
            </button>
            <button
              type="button"
              onClick={() => onToggleState("foallas", false)}
              className={`h-full rounded-2xl font-black text-xs border-2 transition-all cursor-pointer flex items-center justify-center text-center leading-tight ${
                !formData.foallas
                  ? "bg-[#133b47] text-[#f8a44c] border-[#133b47] shadow-md"
                  : "bg-white text-[#556e75] border-[#bdcdcb]"
              }`}
            >
              За сумісництвом
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Режим роботи
          </label>
          <div className="grid grid-cols-2 gap-2 h-13">
            <button
              type="button"
              onClick={() => onToggleState("teljes_munkaido", true)}
              className={`h-full rounded-2xl font-black text-xs border-2 transition-all cursor-pointer flex items-center justify-center text-center leading-tight ${
                formData.teljes_munkaido
                  ? "bg-[#133b47] text-[#f8a44c] border-[#133b47] shadow-md"
                  : "bg-white text-[#556e75] border-[#bdcdcb]"
              }`}
            >
              Повний день
            </button>
            <button
              type="button"
              onClick={() => onToggleState("teljes_munkaido", false)}
              className={`h-full rounded-2xl font-black text-xs border-2 transition-all cursor-pointer flex items-center justify-center text-center leading-tight ${
                !formData.teljes_munkaido
                  ? "bg-[#133b47] text-[#f8a44c] border-[#133b47] shadow-md"
                  : "bg-white text-[#556e75] border-[#bdcdcb]"
              }`}
            >
              Неповний день
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Дата початку роботи
          </label>
          <DatePicker
            value={formData.munkakezdes_datum}
            onChange={(val) => onChange({ target: { name: "munkakezdes_datum", value: val } } as any)}
            placeholder="Дата початку"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Дата заяви працівника
          </label>
          <DatePicker
            value={formData.kerelem_datum}
            onChange={(val) => onChange({ target: { name: "kerelem_datum", value: val } } as any)}
            placeholder="Дата заяви"
          />
        </div>
      </div>
    </div>
  );
};
