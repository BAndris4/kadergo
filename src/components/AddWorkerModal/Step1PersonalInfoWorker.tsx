import React from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { CreateWorkerFormState } from "../../types/fop";
import { DatePicker } from "../DatePicker";

interface Step1WorkerProps {
  formData: CreateWorkerFormState;
  errors: { vezeteknev?: string; keresztnev?: string; apai_nev?: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const Step1PersonalInfoWorker: React.FC<Step1WorkerProps> = ({ formData, errors, onChange }) => {
  return (
    <div className="p-6 rounded-3xl bg-[#f8faf9] border-2 border-[#e2eceb]">
      <div className="text-base font-black text-[#133b47] mb-5 font-heading flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#133b47]/10 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-[#133b47] stroke-[2.2]" />
        </div>
        <span>Основна інформація про працівника</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Прізвище <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="vezeteknev"
            placeholder="Коваленко"
            value={formData.vezeteknev}
            onChange={onChange}
            className={`w-full h-13 px-4 rounded-2xl bg-white border-2 text-[#133b47] text-base font-extrabold focus:outline-none focus:ring-4 focus:ring-[#133b47]/10 transition-all ${
              errors.vezeteknev ? "border-red-500" : "border-[#bdcdcb] focus:border-[#133b47]"
            }`}
          />
          {errors.vezeteknev && <span className="text-xs text-red-600 font-black">{errors.vezeteknev}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Ім'я <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="keresztnev"
            placeholder="Олександр"
            value={formData.keresztnev}
            onChange={onChange}
            className={`w-full h-13 px-4 rounded-2xl bg-white border-2 text-[#133b47] text-base font-extrabold focus:outline-none focus:ring-4 focus:ring-[#133b47]/10 transition-all ${
              errors.keresztnev ? "border-red-500" : "border-[#bdcdcb] focus:border-[#133b47]"
            }`}
          />
          {errors.keresztnev && <span className="text-xs text-red-600 font-black">{errors.keresztnev}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            По батькові <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="apai_nev"
            placeholder="Іванович"
            value={formData.apai_nev}
            onChange={onChange}
            className={`w-full h-13 px-4 rounded-2xl bg-white border-2 text-[#133b47] text-base font-extrabold focus:outline-none focus:ring-4 focus:ring-[#133b47]/10 transition-all ${
              errors.apai_nev ? "border-red-500" : "border-[#bdcdcb] focus:border-[#133b47]"
            }`}
          />
          {errors.apai_nev && <span className="text-xs text-red-600 font-black">{errors.apai_nev}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Ідентифікаційний код
          </label>
          <input
            type="text"
            name="kod"
            placeholder="123456789"
            value={formData.kod}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>

        {/* Вибір статі (Чоловік / Жінка) - без ікон */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Стать
          </label>
          <div className="grid grid-cols-2 gap-2 h-13">
            <button
              type="button"
              onClick={() => onChange({ target: { name: "nem", value: "Чоловік" } } as any)}
              className={`h-full rounded-2xl font-black text-sm border-2 transition-all cursor-pointer flex items-center justify-center ${
                formData.nem === "Чоловік"
                  ? "bg-[#133b47] text-[#f8a44c] border-[#133b47] shadow-md"
                  : "bg-white text-[#556e75] border-[#bdcdcb] hover:border-[#9cb1af] hover:bg-[#f6faf9]"
              }`}
            >
              Чоловік
            </button>

            <button
              type="button"
              onClick={() => onChange({ target: { name: "nem", value: "Жінка" } } as any)}
              className={`h-full rounded-2xl font-black text-sm border-2 transition-all cursor-pointer flex items-center justify-center ${
                formData.nem === "Жінка"
                  ? "bg-[#133b47] text-[#f8a44c] border-[#133b47] shadow-md"
                  : "bg-white text-[#556e75] border-[#bdcdcb] hover:border-[#9cb1af] hover:bg-[#f6faf9]"
              }`}
            >
              Жінка
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Дата народження
          </label>
          <DatePicker
            value={formData.szuletesi_datum}
            onChange={(val) => onChange({ target: { name: "szuletesi_datum", value: val } } as any)}
            placeholder="Дата народження"
          />
        </div>
      </div>
    </div>
  );
};
