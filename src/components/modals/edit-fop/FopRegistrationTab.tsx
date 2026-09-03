import React from "react";
import { DocumentCheckIcon, FolderIcon, FolderPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { EditFopFormState } from "../../../types/fop";
import { DatePicker } from "../../pickers/DatePicker";
import { pickFopFolder } from "../../../services/fopService";

interface FopRegistrationTabProps {
  formData: EditFopFormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDateChange: (date: string) => void;
  onFieldChange: (field: keyof EditFopFormState, value: any) => void;
}

export const FopRegistrationTab: React.FC<FopRegistrationTabProps> = ({
  formData,
  onChange,
  onDateChange,
  onFieldChange,
}) => {
  const handlePickFolder = async () => {
    const chosen = await pickFopFolder();
    if (chosen) {
      onFieldChange("folder_path", chosen);
    }
  };

  const handleClearFolder = () => {
    onFieldChange("folder_path", "");
  };

  return (
    <div className="p-6 rounded-3xl bg-[#fdf8f3] border-2 border-[#f6e4d0] flex flex-col gap-6">
      <div className="text-base font-black text-[#133b47] font-heading flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#f8a44c]/20 flex items-center justify-center">
          <DocumentCheckIcon className="w-5 h-5 text-[#133b47] stroke-[2.2]" />
        </div>
        <span>2. Реєстраційні дані та папка ФОП</span>
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

      {/* Folder & Group Settings Section */}
      <div className="pt-4 border-t-2 border-[#f6e4d0]/80 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Custom Folder Path */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-[#354f57] flex items-center gap-1.5">
              <FolderIcon className="w-4 h-4 text-[#f8a44c] stroke-[2.5]" />
              <span>Робоча папка ФОП (шлях на комп'ютері)</span>
            </label>
            {formData.folder_path && (
              <button
                type="button"
                onClick={handleClearFolder}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="Скинути до авто-папки"
              >
                <XMarkIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Скинути до стандартної</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                name="folder_path"
                placeholder="Автоматично: {Головна папка}\{Код} {ПІБ}"
                value={formData.folder_path || ""}
                onChange={onChange}
                title={formData.folder_path || "Авто-режим"}
                className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-sm font-bold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all placeholder:text-[#8ba2a0]"
              />
            </div>
            <button
              type="button"
              onClick={handlePickFolder}
              className="h-13 px-5 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all shadow-sm cursor-pointer flex items-center gap-2 shrink-0"
              title="Обрати папку на диску"
            >
              <FolderPlusIcon className="w-4.5 h-4.5 stroke-[2.2]" />
              <span>Обрати папку</span>
            </button>
          </div>
          <span className="text-[11px] font-bold text-[#6d8a93]">
            Вкажіть точний шлях до папки цього ФОП на комп'ютері або оберіть через кнопку. Якщо поле порожнє, використовується автоматична назва в головній папці.
          </span>
        </div>
      </div>
    </div>
  );
};
