import React, { useState, useEffect } from "react";
import { PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Munkas, EditWorkerFormState } from "../../types/fop";
import { WorkerPersonalInfoTab } from "./edit-worker/WorkerPersonalInfoTab";
import { WorkerEmploymentTab } from "./edit-worker/WorkerEmploymentTab";
import { WorkerAddressTab } from "./edit-worker/WorkerAddressTab";
import { WorkerPassportTab } from "./edit-worker/WorkerPassportTab";

interface EditWorkerModalProps {
  isOpen: boolean;
  worker: Munkas | null;
  onClose: () => void;
  onSubmit: (formData: EditWorkerFormState) => Promise<void>;
}

export const EditWorkerModal: React.FC<EditWorkerModalProps> = ({
  isOpen,
  worker,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<EditWorkerFormState | null>(null);
  const [errors, setErrors] = useState<{ vezeteknev?: string; keresztnev?: string; apai_nev?: string; foglalkozas_megnevezes?: string }>({});

  useEffect(() => {
    if (worker) {
      setFormData({
        id: worker.id,
        vezeteknev: worker.vezeteknev || "",
        keresztnev: worker.keresztnev || "",
        apai_nev: worker.apai_nev || "",
        kod: worker.kod || "",
        tabel_nomer: worker.tabel_nomer || "",
        szuletesi_datum: worker.szuletesi_datum || "",
        nem: worker.nem || "",

        foglalkozas_megnevezes: worker.foglalkozas_megnevezes || "",
        fizetes: worker.fizetes || 8647,
        foallas: worker.foallas ?? true,
        teljes_munkaido: worker.teljes_munkaido ?? true,
        munkakezdes_datum: worker.munkakezdes_datum || "",
        kerelem_datum: worker.kerelem_datum || "",
        munkaviszony_vege: worker.munkaviszony_vege || "",

        iranyitoszam: worker.cim?.iranyitoszam || "",
        megye: worker.cim?.megye || "",
        jaras: worker.cim?.jaras || "",
        kozseg: worker.cim?.kozseg || "",
        utca: worker.cim?.utca || "",
        hazszam: worker.cim?.hazszam || "",
        epulet: worker.cim?.epulet || "",
        lakas_szoba: worker.cim?.lakas_szoba || "",
        orszag: worker.cim?.orszag || "Україна",

        okmany_tipus: (worker.okmany?.tipus as 0 | 1) || 0,
        szeria: worker.okmany?.szeria || "",
        okmanyszam: worker.okmany?.okmanyszam || "",
        kiallitott_hatosag: worker.okmany?.kiallitott_hatosag || "",
        hatosagi_kod: worker.okmany?.hatosagi_kod || "",
        kiallitasi_datum: worker.okmany?.kiallitasi_datum || "",
        lejarati_datum: worker.okmany?.lejarati_datum || "",
      });
      setErrors({});
    }
  }, [worker, isOpen]);

  if (!isOpen || !formData) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      setFormData((prev) => (prev ? { ...prev, [name]: parseFloat(value) || 0 } : null));
    } else {
      setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
    }

    if (name === "vezeteknev" || name === "keresztnev" || name === "apai_nev" || name === "foglalkozas_megnevezes") {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFieldChange = (field: keyof EditWorkerFormState, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const validate = (): boolean => {
    const errs: { vezeteknev?: string; keresztnev?: string; apai_nev?: string; foglalkozas_megnevezes?: string } = {};
    if (!formData.vezeteknev.trim()) errs.vezeteknev = "Прізвище є обов'язковим!";
    if (!formData.keresztnev.trim()) errs.keresztnev = "Ім'я є обов'язковим!";
    if (!formData.apai_nev.trim()) errs.apai_nev = "По батькові є обов'язковим!";
    if (!formData.foglalkozas_megnevezes.trim()) errs.foglalkozas_megnevezes = "Посада є обов'язковою!";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const workerName = [formData.vezeteknev, formData.keresztnev, formData.apai_nev].filter(Boolean).join(" ");

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999999] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#c4d2d0] rounded-[32px] w-full max-w-[980px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-modalScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b-2 border-[#e2eceb] bg-[#f8faf9]">
          <h2 className="text-xl font-black text-[#133b47] font-heading flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#133b47] flex items-center justify-center text-[#f8a44c] shadow-sm">
              <PencilSquareIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            Редагування працівника — {workerName || "Працівник"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-[#5c777f] hover:text-[#133b47] hover:bg-[#e6eeed] transition-all cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-8 overflow-y-auto flex-1 flex flex-col gap-7 custom-scrollbar">
            <WorkerPersonalInfoTab
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
              onGenderChange={(g) => handleFieldChange("nem", g)}
              onBirthDateChange={(d) => handleFieldChange("szuletesi_datum", d)}
            />

            <WorkerEmploymentTab
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
              onFieldChange={handleFieldChange}
            />

            <WorkerAddressTab
              formData={formData}
              onChange={handleInputChange}
            />

            <WorkerPassportTab
              formData={formData}
              onChange={handleInputChange}
              onTypeToggle={(t) => handleFieldChange("okmany_tipus", t)}
              onDateChange={(field, val) => handleFieldChange(field, val)}
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-8 py-5 border-t-2 border-[#e2eceb] bg-[#f8faf9] gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-[#e6eeed] hover:bg-[#d5e2e0] text-[#133b47] font-black text-sm transition-all cursor-pointer"
            >
              Скасувати
            </button>

            <button
              type="submit"
              className="px-8 py-3 rounded-2xl bg-[#f8a44c] hover:bg-[#f59533] text-[#133b47] font-black text-sm shadow-xl shadow-[#f8a44c]/30 transition-all cursor-pointer"
            >
              Зберегти зміни ✓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
