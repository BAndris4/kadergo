import React, { useState, useEffect } from "react";
import { PencilSquareIcon, XMarkIcon, ExclamationTriangleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { FopData, EditFopFormState } from "../../types/fop";
import { FopPersonalInfoTab } from "./edit-fop/FopPersonalInfoTab";
import { FopRegistrationTab } from "./edit-fop/FopRegistrationTab";
import { FopAddressTab } from "./edit-fop/FopAddressTab";
import { FopPassportTab } from "./edit-fop/FopPassportTab";

interface EditFopModalProps {
  isOpen: boolean;
  fop: FopData | null;
  onClose: () => void;
  onSubmit: (formData: EditFopFormState) => Promise<void>;
  onDeleteClick: (fop: FopData) => void;
}

export const EditFopModal: React.FC<EditFopModalProps> = ({ isOpen, fop, onClose, onSubmit, onDeleteClick }) => {
  const [formData, setFormData] = useState<EditFopFormState | null>(null);
  const [errors, setErrors] = useState<{ vezeteknev?: string; keresztnev?: string; apai_nev?: string; kod?: string }>({});

  useEffect(() => {
    if (fop) {
      setFormData({
        id: fop.id,
        vezeteknev: fop.vezeteknev || "",
        keresztnev: fop.keresztnev || "",
        apai_nev: fop.apai_nev || "",
        kod: fop.kod || "",
        szuletesi_datum: fop.szuletesi_datum || "",
        nem: fop.nem || "",

        fop_kod: fop.fop_kod || "",
        fop_kezdete_datum: fop.fop_kezdete_datum || "",
        nakaz_szam: fop.nakaz_szam || "1",
        munkas_szam: fop.munkas_szam || "1",

        iranyitoszam: fop.cim?.iranyitoszam || "",
        megye: fop.cim?.megye || "",
        jaras: fop.cim?.jaras || "",
        kozseg: fop.cim?.kozseg || "",
        utca: fop.cim?.utca || "",
        hazszam: fop.cim?.hazszam || "",
        epulet: fop.cim?.epulet || "",
        lakas_szoba: fop.cim?.lakas_szoba || "",
        orszag: fop.cim?.orszag || "Україна",

        okmany_tipus: (fop.okmany?.tipus as 0 | 1) || 0,
        szeria: fop.okmany?.szeria || "",
        okmanyszam: fop.okmany?.okmanyszam || "",
        kiallitott_hatosag: fop.okmany?.kiallitott_hatosag || "",
        hatosagi_kod: fop.okmany?.hatosagi_kod || "",
        kiallitasi_datum: fop.okmany?.kiallitasi_datum || "",
        lejarati_datum: fop.okmany?.lejarati_datum || "",
      });
      setErrors({});
    }
  }, [fop, isOpen]);

  if (!isOpen || !formData || !fop) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));

    if (name === "vezeteknev" || name === "keresztnev" || name === "apai_nev" || name === "kod") {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFieldChange = (field: keyof EditFopFormState, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const validate = (): boolean => {
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const fopOwnerName = [formData.vezeteknev, formData.keresztnev, formData.apai_nev].filter(Boolean).join(" ");

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
            Редагування ФОП — {fopOwnerName || "ФОП"}
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
            <FopPersonalInfoTab
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
              onGenderChange={(g) => handleFieldChange("nem", g)}
              onBirthDateChange={(d) => handleFieldChange("szuletesi_datum", d)}
            />

            <FopRegistrationTab
              formData={formData}
              onChange={handleInputChange}
              onDateChange={(d) => handleFieldChange("fop_kezdete_datum", d)}
            />

            <FopAddressTab
              formData={formData}
              onChange={handleInputChange}
            />

            <FopPassportTab
              formData={formData}
              onChange={handleInputChange}
              onTypeToggle={(t) => handleFieldChange("okmany_tipus", t)}
              onDateChange={(field, val) => handleFieldChange(field, val)}
            />

            {/* DANGER ZONE (Небезпечна зона для видалення ФОП) */}
            <div className="p-6 rounded-3xl bg-red-50/80 border-2 border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0 shadow-xs">
                  <ExclamationTriangleIcon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-sm font-black text-red-900 font-heading">
                    Небезпечна зона: Видалення ФОП
                  </h4>
                  <p className="text-xs font-bold text-red-700 leading-relaxed max-w-md">
                    Будьте уважні: це рішення остаточно вилучить ФОП та усіх його оформлених працівників з бази даних.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDeleteClick(fop)}
                className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg shadow-red-600/20 transition-all cursor-pointer shrink-0 flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4 stroke-[2.2]" />
                Видалити ФОП
              </button>
            </div>
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
