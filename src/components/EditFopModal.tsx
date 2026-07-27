import React, { useState, useEffect } from "react";
import { PencilSquareIcon, XMarkIcon, UserIcon, HomeIcon, IdentificationIcon, DocumentTextIcon, DocumentCheckIcon, TrashIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { FopData, EditFopFormState } from "../types/fop";
import { DatePicker } from "./DatePicker";

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

  const handleTypeToggle = (type: 0 | 1) => {
    setFormData((prev) => (prev ? { ...prev, okmany_tipus: type } : null));
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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
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
            {/* СЕКЦІЯ 1: Особисті дані */}
            <div className="p-6 rounded-3xl bg-[#f8faf9] border-2 border-[#e2eceb]">
              <div className="text-base font-black text-[#133b47] mb-5 font-heading flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#133b47]/10 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-[#133b47] stroke-[2.2]" />
                </div>
                <span>1. Особисті дані керівника</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
                    Прізвище <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vezeteknev"
                    value={formData.vezeteknev}
                    onChange={handleInputChange}
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
                    value={formData.keresztnev}
                    onChange={handleInputChange}
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
                    value={formData.apai_nev}
                    onChange={handleInputChange}
                    className={`w-full h-13 px-4 rounded-2xl bg-white border-2 text-[#133b47] text-base font-extrabold focus:outline-none focus:ring-4 focus:ring-[#133b47]/10 transition-all ${
                      errors.apai_nev ? "border-red-500" : "border-[#bdcdcb] focus:border-[#133b47]"
                    }`}
                  />
                  {errors.apai_nev && <span className="text-xs text-red-600 font-black">{errors.apai_nev}</span>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
                    Ідентифікаційний код <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="kod"
                    placeholder="123456789"
                    value={formData.kod}
                    onChange={handleInputChange}
                    className={`w-full h-13 px-4 rounded-2xl bg-white border-2 text-[#133b47] text-base font-extrabold focus:outline-none focus:ring-4 focus:ring-[#133b47]/10 transition-all ${
                      errors.kod ? "border-red-500" : "border-[#bdcdcb] focus:border-[#133b47]"
                    }`}
                  />
                  {errors.kod && <span className="text-xs text-red-600 font-black">{errors.kod}</span>}
                </div>

                {/* Чіткий текстовий вибір статі (Чоловік / Жінка) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
                    Стать
                  </label>
                  <div className="grid grid-cols-2 gap-2 h-13">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => (prev ? { ...prev, nem: "Чоловік" } : null))}
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
                      onClick={() => setFormData((prev) => (prev ? { ...prev, nem: "Жінка" } : null))}
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
                    onChange={(val) => setFormData((prev) => (prev ? { ...prev, szuletesi_datum: val } : null))}
                    placeholder="Дата народження"
                  />
                </div>
              </div>
            </div>

            {/* СЕКЦІЯ 2: Дані ФОП */}
            <div className="p-6 rounded-3xl bg-[#fdf8f3] border-2 border-[#f6e4d0]">
              <div className="text-base font-black text-[#133b47] mb-5 font-heading flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#f8a44c]/20 flex items-center justify-center">
                  <DocumentCheckIcon className="w-5 h-5 text-[#133b47] stroke-[2.2]" />
                </div>
                <span>2. Реєстраційні дані ФОП</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
                    Код ФОП
                  </label>
                  <input
                    type="text"
                    name="fop_kod"
                    placeholder="123456789"
                    value={formData.fop_kod}
                    onChange={handleInputChange}
                    className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
                    Дата реєстрації ФОП
                  </label>
                  <DatePicker
                    value={formData.fop_kezdete_datum}
                    onChange={(val) => setFormData((prev) => (prev ? { ...prev, fop_kezdete_datum: val } : null))}
                    placeholder="Дата реєстрації"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
                    Номер наказу
                  </label>
                  <input
                    type="text"
                    name="nakaz_szam"
                    placeholder="1"
                    value={formData.nakaz_szam}
                    onChange={handleInputChange}
                    className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* СЕКЦІЯ 3: Адреса */}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                    className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* СЕКЦІЯ 4: Паспортні дані */}
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
                  onClick={() => handleTypeToggle(0)}
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
                  onClick={() => handleTypeToggle(1)}
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
                      onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                      onChange={handleInputChange}
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
                      onChange={handleInputChange}
                      className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-base font-extrabold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Дата видачі</label>
                  <DatePicker
                    value={formData.kiallitasi_datum}
                    onChange={(val) => setFormData((prev) => (prev ? { ...prev, kiallitasi_datum: val } : null))}
                    placeholder="Дата видачі"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">Дата закінчення терміну дії</label>
                  <DatePicker
                    value={formData.lejarati_datum}
                    onChange={(val) => setFormData((prev) => (prev ? { ...prev, lejarati_datum: val } : null))}
                    placeholder="Дата закінчення"
                  />
                </div>
              </div>
            </div>

            {/* СЕКЦІЯ 5: DANGER ZONE (Небезпечна зона для видалення ФОП) */}
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
