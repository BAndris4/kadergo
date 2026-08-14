import React from "react";
import { HomeIcon } from "@heroicons/react/24/outline";
import { EditWorkerFormState } from "../../../types/fop";

interface WorkerAddressTabProps {
  formData: EditWorkerFormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const WorkerAddressTab: React.FC<WorkerAddressTabProps> = ({ formData, onChange }) => {
  return (
    <div className="p-6 rounded-3xl bg-[#f8faf9] border-2 border-[#e2eceb]">
      <div className="text-base font-black text-[#133b47] mb-5 font-heading flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#133b47]/10 flex items-center justify-center">
            <HomeIcon className="w-5 h-5 text-[#133b47] stroke-[2.2]" />
          </div>
          <span>3. Адреса проживання</span>
        </div>
        <span className="text-xs font-black text-[#5c777f] bg-[#e6eeed] px-3 py-1 rounded-full border border-[#cbd8d6]">
          Необов'язково
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Країна</label>
          <input
            type="text"
            name="orszag"
            placeholder="Україна"
            value={formData.orszag}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Індекс</label>
          <input
            type="text"
            name="iranyitoszam"
            placeholder="88000"
            value={formData.iranyitoszam}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Область</label>
          <input
            type="text"
            name="megye"
            placeholder="Закарпатська"
            value={formData.megye}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Район</label>
          <input
            type="text"
            name="jaras"
            placeholder="Ужгородський"
            value={formData.jaras}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Населений пункт</label>
          <input
            type="text"
            name="kozseg"
            placeholder="м. Ужгород"
            value={formData.kozseg}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Вулиця</label>
          <input
            type="text"
            name="utca"
            placeholder="вул. Собранецька"
            value={formData.utca}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Будинок</label>
          <input
            type="text"
            name="hazszam"
            placeholder="145"
            value={formData.hazszam}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Корпус</label>
          <input
            type="text"
            name="epulet"
            placeholder="А"
            value={formData.epulet}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Квартира / Кімната</label>
          <input
            type="text"
            name="lakas_szoba"
            placeholder="12"
            value={formData.lakas_szoba}
            onChange={onChange}
            className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
          />
        </div>
      </div>
    </div>
  );
};
