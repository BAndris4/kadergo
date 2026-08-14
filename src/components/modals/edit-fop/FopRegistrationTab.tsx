import React from "react";
import { DocumentCheckIcon } from "@heroicons/react/24/outline";
import { EditFopFormState } from "../../../types/fop";
import { DatePicker } from "../../pickers/DatePicker";

interface FopRegistrationTabProps {
  formData: EditFopFormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDateChange: (date: string) => void;
}

export const FopRegistrationTab: React.FC<FopRegistrationTabProps> = ({
  formData,
  onChange,
  onDateChange,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-[#fdf8f3] border-2 border-[#f6e4d0]">
      <div className="text-base font-black text-[#133b47] mb-5 font-heading flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#f8a44c]/20 flex items-center justify-center">
          <DocumentCheckIcon className="w-5 h-5 text-[#133b47] stroke-[2.2]" />
        </div>
        <span>2. Реєстраційні дані ФОП</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Код ФОП
          </label>
          <input
            type="text"
            name="fop_kod"
            placeholder="123456789"
            value={formData.fop_kod}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            Дата реєстрації ФОП
          </label>
          <DatePicker
            value={formData.fop_kezdete_datum}
            onChange={onDateChange}
            placeholder="Дата реєстрації"
          />
        </div>
      </div>
    </div>
  );
};
