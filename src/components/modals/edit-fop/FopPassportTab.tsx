import React from "react";
import { IdentificationIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { EditFopFormState } from "../../../types/fop";
import { DatePicker } from "../../pickers/DatePicker";

interface FopPassportTabProps {
  formData: EditFopFormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTypeToggle: (type: 0 | 1) => void;
  onDateChange: (field: "kiallitasi_datum" | "lejarati_datum", value: string) => void;
}

export const FopPassportTab: React.FC<FopPassportTabProps> = ({
  formData,
  onChange,
  onTypeToggle,
  onDateChange,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-[#f8faf9] border-2 border-[#e2eceb]">
      <div className="text-base font-black text-[#133b47] mb-5 font-heading flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#133b47]/10 flex items-center justify-center">
            <IdentificationIcon className="w-5 h-5 text-[#133b47] stroke-[2.2]" />
          </div>
          <span>4. Паспортні дані / Документ</span>
        </div>
        <span className="text-xs font-black text-[#5c777f] bg-[#e6eeed] px-3 py-1 rounded-full border border-[#cbd8d6]">
          Необов'язково
        </span>
      </div>

      {/* Document Type Toggle */}
      <div className="flex bg-[#e2eceb] p-1.5 rounded-2xl border-2 border-[#cbd8d6] mb-5">
        <button
          type="button"
          onClick={() => onTypeToggle(0)}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            formData.okmany_tipus === 0
              ? "bg-[#133b47] text-[#f8a44c] shadow-md"
              : "text-[#556e75] hover:text-[#133b47]"
          }`}
        >
          <DocumentTextIcon className="w-4.5 h-4.5 stroke-[2.2]" />
          Старий тип (Паспорт-книжечка)
        </button>

        <button
          type="button"
          onClick={() => onTypeToggle(1)}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            formData.okmany_tipus === 1
              ? "bg-[#133b47] text-[#f8a44c] shadow-md"
              : "text-[#556e75] hover:text-[#133b47]"
          }`}
        >
          <IdentificationIcon className="w-4.5 h-4.5 stroke-[2.2]" />
          Новий тип (ID-картка)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {formData.okmany_tipus === 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Серія паспорта</label>
            <input
              type="text"
              name="szeria"
              placeholder="НВ"
              value={formData.szeria}
              onChange={onChange}
              className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
            {formData.okmany_tipus === 0 ? "Номер паспорта" : "Номер ID-картки"}
          </label>
          <input
            type="text"
            name="okmanyszam"
            placeholder={formData.okmany_tipus === 0 ? "123456" : "001234567"}
            value={formData.okmanyszam}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>

        {formData.okmany_tipus === 0 && (
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Ким виданий (Орган)</label>
            <input
              type="text"
              name="kiallitott_hatosag"
              placeholder="Ужгородським МВ УМВС України в Закарпатській обл."
              value={formData.kiallitott_hatosag}
              onChange={onChange}
              className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
            />
          </div>
        )}

        {formData.okmany_tipus === 1 && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Код органу, що видав</label>
            <input
              type="text"
              name="hatosagi_kod"
              placeholder="2112"
              value={formData.hatosagi_kod}
              onChange={onChange}
              className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Дата видачі</label>
          <DatePicker
            value={formData.kiallitasi_datum}
            onChange={(val) => onDateChange("kiallitasi_datum", val)}
            placeholder="Дата видачі"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Дата закінчення терміну дії</label>
          <DatePicker
            value={formData.lejarati_datum}
            onChange={(val) => onDateChange("lejarati_datum", val)}
            placeholder="Дата закінчення"
          />
        </div>
      </div>
    </div>
  );
};
