import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  SparklesIcon,
  HomeIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { FopData, Munkas, NakazFileItem, Cim, NakazKasaWorkerItem, NakazPrroWorkerItem } from "../types/fop";
import {
  generateNakazPriyomDocx,
  generateNakazKasaDocx,
  generateNakazPrroDocx,
  scanFopNakazy,
  scrapeFopAddressFromNakazy,
  ensureFopDirectory,
  openFileDirectly,
  openFolderInExplorer,
  updateFopDirect,
} from "../services/fopService";
import { getWorkerAccusativeName, getWorkerDativeName, getWorkerInitials, formatUkrainianDate, formatDotDateWithZeros } from "../utils/ukrainianDeclension";
import { CustomDatePicker } from "./CustomDatePicker";

interface NakazGeneratorViewProps {
  fops: FopData[];
  selectedFopId: number | null;
  rootFolder: string;
  onShowToast: (msg: string) => void;
  onBack: () => void;
  onEditWorker?: (worker: Munkas) => void;
  onUpdateFopList?: (updatedFops: FopData[]) => void;
  onEditFop?: (fop: FopData) => void;
}

export type NakazTypeKey = "priyom" | "kasa" | "prro" | "zvilnennya" | "vidpustka" | "premiya";

interface NakazTypeOption {
  key: NakazTypeKey;
  label: string;
  badge?: string;
  active: boolean;
}

const NAKAZ_TYPE_OPTIONS: NakazTypeOption[] = [
  { key: "priyom", label: "Прийняття на роботу", active: true },
  { key: "kasa", label: "Про призначення матеріально відповідальних осіб за касу", active: true },
  { key: "prro", label: "Про призначення касирів для роботи з ПРРО", active: true },
  { key: "zvilnennya", label: "Звільнення", badge: "Скоро", active: false },
  { key: "vidpustka", label: "Відпустка", badge: "Скоро", active: false },
  { key: "premiya", label: "Преміювання", badge: "Скоро", active: false },
];

function getUkrainianPronoun(w: Munkas): "який" | "яка" {
  const nemLower = w.nem?.toLowerCase() || "";
  if (nemLower === "жінка" || nemLower === "nő" || nemLower === "female" || nemLower === "f") {
    return "яка";
  }
  if (nemLower === "чоловік" || nemLower === "férfi" || nemLower === "male" || nemLower === "m") {
    return "який";
  }
  if (w.apai_nev) {
    const p = w.apai_nev.trim().toLowerCase();
    if (p.endsWith("вна") || p.endsWith("івна") || p.endsWith("ївна")) return "яка";
    if (p.endsWith("ич") || p.endsWith("ович") || p.endsWith("евич")) return "який";
  }
  if (w.keresztnev) {
    const f = w.keresztnev.trim().toLowerCase();
    if (f.endsWith("а") || f.endsWith("я")) return "яка";
  }
  return "який";
}

function formatNakazHistoryItem(filename: string) {
  let cleanName = filename.trim();
  if (cleanName.toLowerCase().endsWith(".docx")) {
    cleanName = cleanName.slice(0, -5).trim();
  }

  let nakazLabel = "";
  let titlePart = cleanName;

  const match = cleanName.match(/^(наказ\s*№?\s*[\d_a-zа-яА-Я\-]+)\s*(.*)$/i);
  if (match) {
    const rawNum = match[1]
      .replace(/наказ/i, "")
      .replace(/№/g, "")
      .replace(/_/g, "")
      .trim();
    nakazLabel = `№ ${rawNum}`;
    titlePart = match[2].trim();
  }

  if (!titlePart) {
    titlePart = "Прийняття на роботу";
  }

  const formattedTitle = titlePart
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return {
    nakazLabel: nakazLabel || "НАКАЗ",
    formattedTitle,
  };
}

function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/(\s+|[-/])/)
    .map((word) => {
      if (!word || /^\s+$/.test(word) || /^[-/]$/.test(word)) return word;
      if (/^(м|с|смт|вул|буд|р-н|обл)\.$/i.test(word)) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

// Intelligent Ukrainian Address Segmenter (Preserves "м. " and "вул. " prefixes for modal fields)
export function segmentUkrainianAddress(raw: string): Cim {
  const cim: Cim = {
    orszag: "Україна",
    iranyitoszam: "",
    megye: "",
    jaras: "",
    kozseg: "",
    utca: "",
    hazszam: "",
  };

  if (!raw || !raw.trim()) return cim;

  let clean = raw.trim();

  // Extract 5-digit zip code reliably (handles non-ASCII boundaries)
  const zipMatch = clean.match(/(?:^|[^\d])(\d{5})(?:[^\d]|$)/);
  if (zipMatch) {
    cim.iranyitoszam = zipMatch[1];
  }

  // Split by comma/semicolon, then split internal space-separated sub-tokens (positive lookahead)
  const rawParts = clean.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
  const parts: string[] = [];
  for (const p of rawParts) {
    const subs = p
      .split(/\s+(?=(?:м\.|с\.|смт|вул\.|вулиця|буд\.|будинок)\s+)/gi)
      .map((s) => s.trim())
      .filter(Boolean);
    parts.push(...subs);
  }

  for (const part of parts) {
    const pLower = part.toLowerCase();

    // Zip code part check
    if (/^\d{5}$/.test(part)) {
      cim.iranyitoszam = part;
      continue;
    }

    // Oblast / Megye -> Store clean name (e.g. 'Закарпатська')
    if (pLower.includes("обл") || pLower.includes("область")) {
      let m = part.replace(/область|обл\.?/gi, "").trim();
      cim.megye = toTitleCase(m);
      continue;
    }

    // District / Jaras -> Store clean name (e.g. 'Берегівський')
    if (pLower.includes("р-н") || pLower.includes("район")) {
      let j = part.replace(/район|р-н\.?/gi, "").trim();
      cim.jaras = toTitleCase(j);
      continue;
    }

    // Village / Kozseg (село, с., м., місто, смт) -> Preserve "м. " or "с. " prefix
    if (
      pLower.startsWith("село ") ||
      pLower.startsWith("с. ") ||
      pLower.startsWith("м. ") ||
      pLower.startsWith("місто ") ||
      pLower.startsWith("смт ") ||
      pLower.includes("село") ||
      pLower.includes("місто")
    ) {
      let k = part.replace(/^(село|с\.|м\.|місто|смт)\s*/gi, "").trim();
      let prefix = pLower.includes("село") || pLower.startsWith("с.") ? "с." : "м.";
      cim.kozseg = `${prefix} ${toTitleCase(k)}`;
      continue;
    }

    // Street / Utca (вулиця, вул.) -> Preserve "вул. " prefix
    if (pLower.includes("вул") || pLower.includes("вулиця")) {
      let u = part.replace(/^(вулиця|вул\.)\s*/gi, "").trim();
      cim.utca = `вул. ${toTitleCase(u)}`;
      continue;
    }

    // Building / Hazszam (будинок, буд., б.)
    if (pLower.includes("буд") || pLower.includes("будинок") || pLower.includes("б.")) {
      let h = part.replace(/^(будинок|буд\.|б\.)\s*/gi, "").trim();
      h = h.replace("-/", "/");
      cim.hazszam = h;
      continue;
    }

    if (!cim.utca && !/^\d+$/.test(part) && !pLower.includes("фізична особа")) {
      let cleanPart = part.replace(/^(вулиця|вул\.)\s*/gi, "").trim();
      cim.utca = `вул. ${toTitleCase(cleanPart)}`;
    }
  }

  return cim;
}

// Formats Cim object into standard Nakaz header string (adds "обл.", "р-н", "м.", "вул.", "буд.")
export function formatCimForNakaz(cim: Cim | undefined): string {
  if (!cim) return "";
  const parts: string[] = [];

  if (cim.iranyitoszam && cim.iranyitoszam.trim()) {
    parts.push(cim.iranyitoszam.trim());
  }

  if (cim.megye && cim.megye.trim()) {
    let m = cim.megye.trim().replace(/область|обл\.?/gi, "").trim();
    parts.push(`${m} обл.`);
  }

  if (cim.jaras && cim.jaras.trim()) {
    let j = cim.jaras.trim().replace(/район|р-н\.?/gi, "").trim();
    parts.push(`${j} р-н`);
  }

  if (cim.kozseg && cim.kozseg.trim()) {
    let k = cim.kozseg.trim();
    if (!k.toLowerCase().startsWith("м.") && !k.toLowerCase().startsWith("с.") && !k.toLowerCase().startsWith("смт")) {
      k = `м. ${k}`;
    }
    parts.push(k);
  }

  if (cim.utca && cim.utca.trim()) {
    let u = cim.utca.trim();
    if (!u.toLowerCase().startsWith("вул.")) {
      u = `вул. ${u}`;
    }
    parts.push(u);
  }

  if (cim.hazszam && cim.hazszam.trim()) {
    let h = cim.hazszam.trim().replace(/^(будинок|буд\.|б\.)\s*/gi, "").trim();
    parts.push(`буд. ${h}`);
  }

  return parts.join(", ");
}

export const NakazGeneratorView: React.FC<NakazGeneratorViewProps> = ({
  fops,
  selectedFopId,
  rootFolder,
  onShowToast,
  onBack,
  onEditWorker,
  onUpdateFopList,
  onEditFop,
}) => {
  const activeFop = fops.find((f) => f.id === selectedFopId) || null;
  const activeFopName = activeFop
    ? [activeFop.vezeteknev, activeFop.keresztnev, activeFop.apai_nev].filter(Boolean).join(" ")
    : "";
  const activeFopCode = activeFop ? activeFop.kod || activeFop.fop_kod || "" : "";
  const activeFopEdrpou = activeFop ? activeFop.fop_kod || activeFop.kod || "" : "";

  const [currentAddress, setCurrentAddress] = useState<string>("");

  useEffect(() => {
    if (activeFop && activeFop.cim) {
      setCurrentAddress(formatCimForNakaz(activeFop.cim));
    } else {
      setCurrentAddress("");
    }
  }, [activeFop]);

  const hasValidFopAddress = Boolean(currentAddress.trim());

  const activeFopInitials = activeFop
    ? `${activeFop.vezeteknev} ${activeFop.keresztnev ? activeFop.keresztnev[0] + "." : ""}${
        activeFop.apai_nev ? activeFop.apai_nev[0] + "." : ""
      }`
    : "";

  const [selectedNakazType, setSelectedNakazType] = useState<NakazTypeKey>("priyom");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [isWorkerDropdownOpen, setIsWorkerDropdownOpen] = useState(false);
  const [workerSearchQuery, setWorkerSearchQuery] = useState("");
  const workerDropdownRef = useRef<HTMLDivElement>(null);

  const [scannedFiles, setScannedFiles] = useState<NakazFileItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  const [detectedAddressRaw, setDetectedAddressRaw] = useState<string | null>(null);
  const [isEditAddressModalOpen, setIsEditAddressModalOpen] = useState(false);
  const [segmentedAddress, setSegmentedAddress] = useState<Cim>({
    orszag: "Україна",
    iranyitoszam: "",
    megye: "",
    jaras: "",
    kozseg: "",
    utca: "",
    hazszam: "",
  });

  const hasCheckedAddressRef = useRef(false);
  const [nakazNum, setNakazNum] = useState<string>("1");

  const [employmentType, setEmploymentType] = useState<"main" | "sumisnyctvo" | "nepovny_chas">("main");
  const [isoNakazDate, setIsoNakazDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [isoWorkStartDate, setIsoWorkStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [workerAccusative, setWorkerAccusative] = useState("");
  const [workerDative, setWorkerDative] = useState("");
  const [workerInitials, setWorkerInitials] = useState("");
  const [positionName, setPositionName] = useState("продавець непродовольчих товарів");
  const [salaryStr, setSalaryStr] = useState("8 647,00 грн.");

  // Cash register responsibility decree state
  const [selectedKasaWorkerIds, setSelectedKasaWorkerIds] = useState<number[]>([]);
  const [kasaWorkerHours, setKasaWorkerHours] = useState<Record<number, { startTime: string; endTime: string }>>({});

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (activeFop && activeFop.munkasok && activeFop.munkasok.length > 0) {
      setSelectedKasaWorkerIds((prev) => (prev.length > 0 ? prev : activeFop.munkasok.map((w) => w.id)));
      setKasaWorkerHours((prev) => {
        const updated = { ...prev };
        for (const w of activeFop.munkasok) {
          if (!updated[w.id]) {
            const isFullTime = w.teljes_munkaido;
            updated[w.id] = {
              startTime: "09:00",
              endTime: isFullTime ? "17:00" : "13:00",
            };
          }
        }
        return updated;
      });
    }
  }, [activeFop]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
      if (workerDropdownRef.current && !workerDropdownRef.current.contains(event.target as Node)) {
        setIsWorkerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performScan = async () => {
    if (!rootFolder || !activeFop) return;
    try {
      setIsScanning(true);
      const fopDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
      if (fopDir) {
        const targetDir = `${fopDir}\\кадрові документи`;
        const files = await scanFopNakazy(targetDir);
        setScannedFiles(files);

        if (files.length > 0) {
          const maxNum = Math.max(...files.map((f) => f.num_val || 0));
          if (maxNum > 0) {
            setNakazNum((maxNum + 1).toString());
          }
        }

        if (!hasValidFopAddress && !hasCheckedAddressRef.current && files.length > 0) {
          hasCheckedAddressRef.current = true;
          const foundAddress = await scrapeFopAddressFromNakazy(targetDir);
          if (foundAddress && foundAddress.trim()) {
            setDetectedAddressRaw(foundAddress.trim());
          }
        }
      }
    } catch (err) {
      console.warn("Scan nakazy error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    hasCheckedAddressRef.current = false;
    setDetectedAddressRaw(null);
    performScan();
  }, [activeFop, rootFolder]);

  const handleOpenAddressModalFromScraped = () => {
    if (!detectedAddressRaw) return;
    const seg = segmentUkrainianAddress(detectedAddressRaw);
    setSegmentedAddress(seg);
    setIsEditAddressModalOpen(true);
  };

  const handleOpenEditFopModalAnytime = () => {
    if (activeFop && activeFop.cim) {
      setSegmentedAddress({
        orszag: activeFop.cim.orszag || "Україна",
        iranyitoszam: activeFop.cim.iranyitoszam || "",
        megye: activeFop.cim.megye || "",
        jaras: activeFop.cim.jaras || "",
        kozseg: activeFop.cim.kozseg || "",
        utca: activeFop.cim.utca || "",
        hazszam: activeFop.cim.hazszam || "",
      });
    } else if (detectedAddressRaw) {
      const seg = segmentUkrainianAddress(detectedAddressRaw);
      setSegmentedAddress(seg);
    }
    setIsEditAddressModalOpen(true);
  };

  // SAVE FOP ADDRESS DIRECTLY TO SQLITE DB AND BOTH COMPONENT & PARENT APP STATES
  const handleSaveSegmentedAddress = async () => {
    if (!activeFop) return;
    try {
      const updatedFopObj: FopData = {
        ...activeFop,
        cim: {
          ...activeFop.cim,
          ...segmentedAddress,
        },
      };

      const updated = await updateFopDirect(updatedFopObj, fops);
      
      // Update local storage and parent React state across main "База ФОП"
      const newFopList = fops.map((f) => (f.id === updated.id ? { ...f, cim: updatedFopObj.cim } : f));
      if (onUpdateFopList) {
        onUpdateFopList(newFopList);
      }

      const formatted = [
        segmentedAddress.iranyitoszam,
        segmentedAddress.megye,
        segmentedAddress.jaras,
        segmentedAddress.kozseg,
        segmentedAddress.utca ? `вул. ${segmentedAddress.utca}` : "",
        segmentedAddress.hazszam ? `буд. ${segmentedAddress.hazszam}` : "",
      ]
        .filter(Boolean)
        .join(", ");

      setCurrentAddress(formatted);
      setIsEditAddressModalOpen(false);
      setDetectedAddressRaw(null);
      onShowToast("Адресу ФОП успішно збережено в базу даних!");
    } catch (err: any) {
      console.error("Error saving address to database:", err);
      onShowToast(`Помилка збереження: ${err?.toString() || "Невідома помилка"}`);
    }
  };

  const handleSelectWorker = (wId: number) => {
    setSelectedWorkerId(wId);
    if (!activeFop || !activeFop.munkasok) return;

    const worker = activeFop.munkasok.find((w) => w.id === wId);
    if (!worker) return;

    if (!worker.foallas) {
      setEmploymentType("sumisnyctvo");
    } else if (!worker.teljes_munkaido) {
      setEmploymentType("nepovny_chas");
    } else {
      setEmploymentType("main");
    }

    if (worker.munkakezdes_datum) {
      setIsoWorkStartDate(worker.munkakezdes_datum);
    } else {
      setIsoWorkStartDate(new Date().toISOString().split("T")[0]);
    }

    if (worker.kerelem_datum) {
      setIsoNakazDate(worker.kerelem_datum);
    } else if (worker.munkakezdes_datum) {
      setIsoNakazDate(worker.munkakezdes_datum);
    } else {
      setIsoNakazDate(new Date().toISOString().split("T")[0]);
    }

    const acc = getWorkerAccusativeName(worker.vezeteknev, worker.keresztnev, worker.apai_nev, worker.nem);
    const dat = getWorkerDativeName(worker.vezeteknev, worker.keresztnev, worker.apai_nev, worker.nem);
    const init = getWorkerInitials(worker.vezeteknev, worker.keresztnev, worker.apai_nev);

    setWorkerAccusative(acc);
    setWorkerDative(dat);
    setWorkerInitials(init);

    if (worker.foglalkozas_megnevezes) {
      setPositionName(worker.foglalkozas_megnevezes);
    }
    if (worker.fizetes) {
      const formattedSalary = `${worker.fizetes.toLocaleString("uk-UA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} грн.`;
      setSalaryStr(formattedSalary);
    }
  };

  useEffect(() => {
    if (activeFop && activeFop.munkasok && activeFop.munkasok.length > 0 && !selectedWorkerId) {
      handleSelectWorker(activeFop.munkasok[0].id);
    }
  }, [activeFop]);

  const formattedNakazDate = formatUkrainianDate(isoNakazDate, "yearWord");
  const formattedWorkStartDateDot = formatDotDateWithZeros(isoWorkStartDate);
  const formattedWorkStartDate = `${formattedWorkStartDateDot}`;

  const getClause1Text = () => {
    const accText = workerAccusative || "[ПІП працівника]";
    const posText = positionName || "[Посада]";
    const salText = salaryStr || "[Оклад] грн.";

    if (employmentType === "sumisnyctvo") {
      return `1. Прийняти ${accText} на посаду ${posText} з окладом ${salText} за сумісництвом.`;
    }
    if (employmentType === "nepovny_chas") {
      return `1. Прийняти ${accText} на посаду ${posText} з окладом ${salText} зі встановленням неповного робочого часу з оплатою праці пропорційно відпраційованому часу`;
    }
    return `1. Прийняти ${accText} на посаду ${posText} з окладом ${salText}.`;
  };

  const handleGenerateDoc = async () => {
    if (!activeFop) {
      onShowToast("Спочатку оберіть активного ФОП зі списку!");
      return;
    }

    if (!hasValidFopAddress) {
      onShowToast("Помилка: Адреса ФОП є обов'язковою! Заповніть адресу у профілі ФОП перед створенням Наказу.");
      return;
    }

    if (!workerAccusative.trim()) {
      onShowToast("Оберіть працівника!");
      return;
    }

    try {
      setIsGenerating(true);
      let targetDir = "";
      if (rootFolder) {
        const fopDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
        if (fopDir) {
          targetDir = `${fopDir}\\кадрові документи`;
        }
      }

      await generateNakazPriyomDocx({
        fop_id: activeFop.id,
        fop_name: activeFopName,
        fop_code: activeFopCode,
        fop_address: currentAddress,
        fop_edrpou: activeFopEdrpou,
        fop_initials: activeFopInitials,
        nakaz_num: nakazNum,
        nakaz_date_str: formattedNakazDate,
        employment_type: employmentType,
        worker_name_accusative: workerAccusative,
        worker_name_dative: workerDative,
        worker_initials: workerInitials,
        position_name: positionName,
        salary_str: salaryStr,
        work_start_date_str: formattedWorkStartDate,
        save_dir: targetDir || undefined,
      });

      onShowToast(`Наказ № ${nakazNum} успішно створено!`);

      await performScan();
    } catch (err: any) {
      console.error("Error generating Nakaz docx:", err);
      onShowToast(`Помилка генерації Наказу: ${err?.toString() || "Невідома помилка"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleKasaWorker = (wId: number) => {
    setSelectedKasaWorkerIds((prev) =>
      prev.includes(wId) ? prev.filter((id) => id !== wId) : [...prev, wId]
    );
  };

  const handleGenerateKasaDoc = async () => {
    if (!activeFop) {
      onShowToast("Спочатку оберіть активного ФОП зі списку!");
      return;
    }

    if (!hasValidFopAddress) {
      onShowToast("Помилка: Адреса ФОП є обов'язковою! Заповніть адресу у профілі ФОП перед створенням Наказу.");
      return;
    }

    const kasaWorkers = (activeFop.munkasok || []).filter((w) => selectedKasaWorkerIds.includes(w.id));
    if (kasaWorkers.length === 0) {
      onShowToast("Оберіть хоча б одного працівника!");
      return;
    }

    try {
      setIsGenerating(true);
      let targetDir = "";
      if (rootFolder) {
        const fopDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
        if (fopDir) {
          targetDir = `${fopDir}\\кадрові документи`;
        }
      }

      const ukrMonths = [
        "січня", "лютого", "березня", "квітня", "травня", "червня",
        "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
      ];

      let dayStr = "15";
      let monthStr = "липня";
      let yearStr = "2026";

      if (isoNakazDate) {
        const parts = isoNakazDate.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            dayStr = d < 10 ? `0${d}` : `${d}`;
            monthStr = ukrMonths[m] || "січня";
            yearStr = `${y}`;
          }
        }
      }

      const workerItems: NakazKasaWorkerItem[] = kasaWorkers.map((w) => {
        const dativeName = getWorkerDativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
        const initials = getWorkerInitials(w.vezeteknev, w.keresztnev, w.apai_nev);
        const pronoun = getUkrainianPronoun(w);
        const hours = kasaWorkerHours[w.id] || {
          startTime: "09:00",
          endTime: w.teljes_munkaido ? "17:00" : "13:00",
        };

        return {
          dative_name: dativeName,
          initials,
          pronoun,
          start_time: hours.startTime || "09:00",
          end_time: hours.endTime || (w.teljes_munkaido ? "17:00" : "13:00"),
        };
      });

      await generateNakazKasaDocx({
        fop_id: activeFop.id,
        fop_name: activeFopName,
        fop_code: activeFopCode,
        fop_address: currentAddress,
        fop_edrpou: activeFopEdrpou,
        fop_initials: activeFopInitials,
        nakaz_num: nakazNum,
        nakaz_date_str: formattedNakazDate,
        day_str: dayStr,
        month_str: monthStr,
        year_str: yearStr,
        workers: workerItems,
        save_dir: targetDir || undefined,
      });

      onShowToast(`Наказ № ${nakazNum} успішно створено!`);
      await performScan();
    } catch (err: any) {
      console.error("Error generating Nakaz Kasa docx:", err);
      onShowToast(`Помилка генерації Наказу: ${err?.toString() || "Невідома помилка"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePrroDoc = async () => {
    if (!activeFop) {
      onShowToast("Спочатку оберіть активного ФОП зі списку!");
      return;
    }

    if (!hasValidFopAddress) {
      onShowToast("Помилка: Адреса ФОП є обов'язковою! Заповніть адресу у профілі ФОП перед створенням Наказу.");
      return;
    }

    const prroWorkers = (activeFop.munkasok || []).filter((w) => selectedKasaWorkerIds.includes(w.id));
    if (prroWorkers.length === 0) {
      onShowToast("Оберіть хоча б одного працівника!");
      return;
    }

    try {
      setIsGenerating(true);
      let targetDir = "";
      if (rootFolder) {
        const fopDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
        if (fopDir) {
          targetDir = `${fopDir}\\кадрові документи`;
        }
      }

      const ukrMonths = [
        "січня", "лютого", "березня", "квітня", "травня", "червня",
        "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
      ];

      let dayStr = "15";
      let monthStr = "липня";
      let yearStr = "2026";

      if (isoNakazDate) {
        const parts = isoNakazDate.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            dayStr = d < 10 ? `0${d}` : `${d}`;
            monthStr = ukrMonths[m] || "січня";
            yearStr = `${y}`;
          }
        }
      }

      const workerItems: NakazPrroWorkerItem[] = prroWorkers.map((w) => {
        const dativeName = getWorkerDativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
        const initials = getWorkerInitials(w.vezeteknev, w.keresztnev, w.apai_nev);
        const posName = w.foglalkozas_megnevezes ? w.foglalkozas_megnevezes.toLowerCase() : "продавець непродовольчих товарів";

        return {
          dative_name: dativeName,
          position_name: posName,
          initials,
        };
      });

      await generateNakazPrroDocx({
        fop_id: activeFop.id,
        fop_name: activeFopName,
        fop_code: activeFopCode,
        fop_address: currentAddress,
        fop_edrpou: activeFopEdrpou,
        fop_initials: activeFopInitials,
        nakaz_num: nakazNum,
        nakaz_date_str: formattedNakazDate,
        day_str: dayStr,
        month_str: monthStr,
        year_str: yearStr,
        workers: workerItems,
        save_dir: targetDir || undefined,
      });

      onShowToast(`Наказ № ${nakazNum} успішно створено!`);
      await performScan();
    } catch (err: any) {
      console.error("Error generating Nakaz PRRO docx:", err);
      onShowToast(`Помилка генерації Наказу: ${err?.toString() || "Невідома помилка"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedWorkerObj = activeFop && activeFop.munkasok
    ? activeFop.munkasok.find((w) => w.id === selectedWorkerId)
    : null;

  const selectedWorkerFullName = selectedWorkerObj
    ? [selectedWorkerObj.vezeteknev, selectedWorkerObj.keresztnev, selectedWorkerObj.apai_nev].filter(Boolean).join(" ")
    : "";

  const selectedTypeObj = NAKAZ_TYPE_OPTIONS.find((t) => t.key === selectedNakazType) || NAKAZ_TYPE_OPTIONS[0];

  const filteredMunkasok = activeFop && activeFop.munkasok
    ? activeFop.munkasok.filter((w) => {
        const name = [w.vezeteknev, w.keresztnev, w.apai_nev].filter(Boolean).join(" ").toLowerCase();
        const pos = (w.foglalkozas_megnevezes || "").toLowerCase();
        const q = workerSearchQuery.toLowerCase().trim();
        return name.includes(q) || pos.includes(q);
      })
    : [];

  const filteredHistoryFiles = scannedFiles.filter((item) => {
    const q = historySearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.filename.toLowerCase().includes(q) ||
      item.nakaz_num.toLowerCase().includes(q) ||
      item.nakaz_type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-16 w-full font-sans text-slate-800">
      {/* 1. LARGE HIGH-VISIBILITY TOP HEADER BAR */}
      <div className="bg-[#133b47] rounded-[24px] px-6 py-5 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-[#f8a44c] flex items-center justify-center transition-all cursor-pointer shrink-0 border-2 border-white/20 shadow-md"
            title="Назад до вибору документів"
          >
            <ArrowLeftIcon className="w-6 h-6 stroke-[2.8]" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#f8a44c] text-[#133b47] flex items-center justify-center font-black shadow-lg shrink-0">
              <DocumentTextIcon className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
                  Накази підприємства
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#f8a44c] text-[#133b47]">
                  {scannedFiles.length} в реєстрі
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-sm text-[#c3d9d6] font-bold">
                  {activeFopName ? (
                    <>
                      ФОП: <strong className="text-white text-base underline">{activeFopName}</strong>
                    </>
                  ) : (
                    "Оберіть ФОП у верхньому меню"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOP EDIT ICON & FOLDER EXPLORER ICON BUTTONS (ICON ONLY) */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0">
          {activeFop && (
            <button
              type="button"
              onClick={() => {
                if (onEditFop) {
                  onEditFop(activeFop);
                } else {
                  handleOpenEditFopModalAnytime();
                }
              }}
              className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-[#f8a44c] flex items-center justify-center transition-all cursor-pointer border-2 border-white/20 shadow-md shrink-0"
              title="Редагувати дані ФОП у базі даних"
            >
              <PencilSquareIcon className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}

          <button
            onClick={async () => {
              if (rootFolder && activeFop) {
                const fopDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
                if (fopDir) {
                  await openFolderInExplorer(`${fopDir}\\кадрові документи`);
                }
              }
            }}
            className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-[#f8a44c] flex items-center justify-center transition-all cursor-pointer border-2 border-white/20 shadow-md shrink-0"
            title="Відкрити папку «кадрові документи» у Провіднику"
          >
            <FolderOpenIcon className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 2. ERGONOMIC TOOLBAR: LARGE DESIGNER DROPDOWNS & NAKAZ NUMBER */}
      <div className="bg-white rounded-[24px] p-5 border-2 border-[#cbd8d6] shadow-md flex flex-col lg:flex-row items-center justify-between gap-5 relative z-30">
        {/* CUSTOM DROPDOWN 1: NAKAZ TYPE PICKER */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-72" ref={typeDropdownRef}>
            <label className="block text-xs font-black uppercase text-[#133b47] mb-1.5 tracking-wide">
              Тип Наказу:
            </label>
            <button
              type="button"
              onClick={() => setIsTypeDropdownOpen((prev) => !prev)}
              className="w-full h-13 px-4 rounded-2xl bg-[#fafdfc] border-2 border-[#cbd8d6] hover:border-[#133b47] text-[#133b47] text-sm font-black focus:outline-none transition-all flex items-center justify-between shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5 truncate">
                <DocumentTextIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.5] shrink-0" />
                <span className="truncate">{selectedTypeObj.label}</span>
              </div>
              <ChevronDownIcon
                className={`w-5 h-5 text-[#133b47] shrink-0 transition-transform duration-200 stroke-[2.5] ${
                  isTypeDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* TYPE DROPDOWN MENU */}
            {isTypeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-[#cbd8d6] shadow-2xl overflow-hidden z-[9999] animate-modalScale p-2 flex flex-col gap-1.5">
                {NAKAZ_TYPE_OPTIONS.map((opt) => (
                  <div
                    key={opt.key}
                    onClick={() => {
                      if (opt.active) {
                        setSelectedNakazType(opt.key);
                        setIsTypeDropdownOpen(false);
                      }
                    }}
                    className={`p-3 rounded-xl text-sm font-black transition-all flex items-center justify-between gap-2 ${
                      opt.key === selectedNakazType
                        ? "bg-[#133b47] text-[#f8a44c]"
                        : opt.active
                        ? "hover:bg-[#f4f9f8] text-[#133b47] cursor-pointer"
                        : "opacity-50 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.badge && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-slate-200 text-slate-600">
                        {opt.badge}
                      </span>
                    )}
                    {opt.key === selectedNakazType && (
                      <CheckIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.5]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CUSTOM DROPDOWN 2: WORKER SELECTOR (HIDE FOR KASA, SHOW FOR PRIYOM) */}
          {selectedNakazType !== "kasa" && (
            <div className="relative w-full sm:w-96" ref={workerDropdownRef}>
              <label className="block text-xs font-black uppercase text-[#133b47] mb-1.5 tracking-wide">
                Працівник ФОП:
              </label>
              <button
                type="button"
                onClick={() => setIsWorkerDropdownOpen((prev) => !prev)}
                className="w-full h-13 px-4 rounded-2xl bg-[#fafdfc] border-2 border-[#cbd8d6] hover:border-[#133b47] text-[#133b47] text-sm font-black focus:outline-none transition-all flex items-center justify-between shadow-xs cursor-pointer"
              >
                {selectedWorkerObj ? (
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-7 h-7 rounded-lg bg-[#133b47] text-[#f8a44c] text-xs font-black flex items-center justify-center shrink-0">
                      {selectedWorkerObj.vezeteknev.charAt(0)}
                    </div>
                    <div className="flex flex-col text-left truncate leading-tight">
                      <span className="truncate font-black text-[#133b47] text-sm">
                        {selectedWorkerFullName}
                      </span>
                      <span className="text-xs text-[#556e75] font-bold truncate">
                        {selectedWorkerObj.foglalkozas_megnevezes || "Працівник"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[#556e75] font-bold">-- Оберіть працівника --</span>
                )}

                <ChevronDownIcon
                  className={`w-5 h-5 text-[#133b47] shrink-0 transition-transform duration-200 stroke-[2.5] ml-2 ${
                    isWorkerDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* WORKERS DROPDOWN MENU */}
              {isWorkerDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-[#cbd8d6] shadow-2xl overflow-hidden z-[9999] animate-modalScale">
                  <div className="p-3 border-b-2 border-[#cbd8d6] bg-[#f4f9f8] flex items-center gap-2">
                    <MagnifyingGlassIcon className="w-5 h-5 text-[#556e75] shrink-0 stroke-[2.5]" />
                    <input
                      type="text"
                      placeholder="Пошук працівника..."
                      value={workerSearchQuery}
                      onChange={(e) => setWorkerSearchQuery(e.target.value)}
                      className="w-full text-sm font-black text-[#133b47] bg-transparent focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto p-2 flex flex-col gap-1.5">
                    {filteredMunkasok.length === 0 ? (
                      <div className="p-4 text-center text-sm font-bold text-[#556e75]">
                        Працівників не знайдено.
                      </div>
                    ) : (
                      filteredMunkasok.map((m) => {
                        const name = [m.vezeteknev, m.keresztnev, m.apai_nev].filter(Boolean).join(" ");
                        const isSelected = m.id === selectedWorkerId;

                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              handleSelectWorker(m.id);
                              setIsWorkerDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-[#133b47] text-white shadow-md"
                                : "hover:bg-[#f4f9f8] text-[#133b47]"
                            }`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <div
                                className={`w-8 h-8 rounded-lg text-sm font-black flex items-center justify-center shrink-0 ${
                                  isSelected ? "bg-[#f8a44c] text-[#133b47]" : "bg-[#133b47]/10 text-[#133b47]"
                                }`}
                              >
                                {m.vezeteknev.charAt(0)}
                              </div>

                              <div className="flex flex-col truncate text-left">
                                <span className="text-sm font-black truncate leading-tight">{name}</span>
                                <span
                                  className={`text-xs truncate mt-0.5 font-bold ${
                                    isSelected ? "text-[#c3d9d6]" : "text-[#556e75]"
                                  }`}
                                >
                                  {m.foglalkozas_megnevezes || "Працівник"}
                                </span>
                              </div>
                            </div>

                            {isSelected && (
                              <CheckIcon className="w-5 h-5 text-[#f8a44c] shrink-0 stroke-[2.5]" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COMPACT NAKAZ NUMBER INPUT */}
        <div className="flex flex-col items-end w-full lg:w-auto">
          <label className="block text-xs font-black uppercase text-[#133b47] mb-1.5 tracking-wide">
            Номер Наказу:
          </label>
          <div className="flex items-center gap-2 bg-[#133b47] text-white px-4 h-13 rounded-2xl border-2 border-[#133b47] shrink-0 shadow-md">
            <span className="text-base font-black text-[#f8a44c]">№</span>
            <input
              type="text"
              value={nakazNum}
              onChange={(e) => setNakazNum(e.target.value)}
              className="w-16 bg-white/10 text-white font-black text-lg text-center rounded-xl py-1 focus:outline-none focus:bg-white/20"
            />
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        {/* LEFT COLUMN: WORKER EDIT CARD & HISTORY REGISTRY (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* 1. WORKER EDIT / KASA / PRRO SELECTION COMPONENT CARD */}
          {selectedNakazType === "kasa" || selectedNakazType === "prro" ? (
            <div className="bg-white rounded-[24px] p-6 border-2 border-[#cbd8d6] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b-2 border-[#cbd8d6] pb-3">
                <span className="text-sm font-black uppercase tracking-wider text-[#133b47] flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.8]" />
                  {selectedNakazType === "prro" ? "Параметри наказу ПРРО" : "Параметри наказу за касу"}
                </span>
              </div>

              {/* CUSTOM STYLED DATE OF DECREE PICKER */}
              <CustomDatePicker
                label="Дата наказу:"
                value={isoNakazDate}
                onChange={setIsoNakazDate}
              />

              {/* WORKERS MULTI-SELECT CHECKLIST */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#133b47] tracking-wider">
                    Матеріально відповідальні працівники:
                  </span>
                  {activeFop && activeFop.munkasok && (
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#133b47] text-[#f8a44c] shadow-xs">
                      {selectedKasaWorkerIds.length} / {activeFop.munkasok.length} обрано
                    </span>
                  )}
                </div>

                {activeFop && activeFop.munkasok && activeFop.munkasok.length > 0 ? (
                  <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                    {activeFop.munkasok.map((w) => {
                      const isChecked = selectedKasaWorkerIds.includes(w.id);
                      const fullName = [w.vezeteknev, w.keresztnev, w.apai_nev].filter(Boolean).join(" ");
                      const initial = w.vezeteknev ? w.vezeteknev.charAt(0).toUpperCase() : "?";

                      return (
                        <div
                          key={w.id}
                          onClick={() => handleToggleKasaWorker(w.id)}
                          className={`p-3.5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-3.5 cursor-pointer select-none ${
                            isChecked
                              ? "bg-gradient-to-r from-[#fafdfc] to-[#f0f7f6] border-[#133b47] shadow-md ring-2 ring-[#133b47]/10"
                              : "bg-slate-50 border-slate-200 hover:border-[#cbd8d6] hover:bg-white opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 truncate">
                            <div
                              className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-all shadow-sm ${
                                isChecked
                                  ? "bg-[#133b47] text-[#f8a44c] scale-105"
                                  : "bg-[#133b47]/10 text-[#133b47]"
                              }`}
                            >
                              {initial}
                            </div>
                            <div className="flex flex-col truncate text-left">
                              <span className={`text-sm font-black truncate leading-snug transition-colors ${
                                isChecked ? "text-[#133b47]" : "text-slate-700"
                              }`}>
                                {fullName}
                              </span>
                              {w.foglalkozas_megnevezes && (
                                <span className="text-[11px] font-bold text-[#556e75] truncate mt-0.5">
                                  {w.foglalkozas_megnevezes}
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                              isChecked
                                ? "bg-[#133b47] text-[#f8a44c] shadow-xs"
                                : "border-2 border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-rose-500 bg-rose-50 p-4 rounded-xl border border-rose-200 text-center">
                    У ФОП немає доданих працівників!
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] p-6 border-2 border-[#cbd8d6] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b-2 border-[#cbd8d6] pb-3">
                <span className="text-sm font-black uppercase tracking-wider text-[#133b47] flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.8]" />
                  Обраний працівник
                </span>
                <div className="flex items-center gap-2">
                  {onEditWorker && selectedWorkerObj && (
                    <button
                      type="button"
                      onClick={() => onEditWorker(selectedWorkerObj)}
                      className="w-8 h-8 rounded-lg bg-[#133b47]/10 hover:bg-[#133b47] text-[#133b47] hover:text-[#f8a44c] border border-[#cbd8d6] flex items-center justify-center transition-colors cursor-pointer"
                      title="Редагувати дані працівника"
                    >
                      <PencilSquareIcon className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>

              {selectedWorkerObj ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3.5 bg-[#fafdfc] p-4 rounded-2xl border-2 border-[#cbd8d6]">
                    <div className="w-12 h-12 rounded-xl bg-[#133b47] text-[#f8a44c] font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                      {selectedWorkerObj.vezeteknev.charAt(0)}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-base font-black text-[#133b47] truncate">
                        {selectedWorkerFullName}
                      </span>
                      <span className="text-xs font-bold text-[#556e75] truncate mt-0.5">
                        {positionName}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-[#f4f9f8] p-3 rounded-xl border border-[#cbd8d6] flex flex-col">
                      <span className="text-xs text-[#556e75] font-black uppercase">Оклад:</span>
                      <span className="font-black text-[#133b47] text-sm mt-0.5">{salaryStr}</span>
                    </div>
                    <div className="bg-[#f4f9f8] p-3 rounded-xl border border-[#cbd8d6] flex flex-col">
                      <span className="text-xs text-[#556e75] font-black uppercase">Початок роботи:</span>
                      <span className="font-black text-[#133b47] text-sm mt-0.5">{formattedWorkStartDate}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-bold text-rose-500 bg-rose-50 p-4 rounded-xl border border-rose-200 text-center">
                  Працівника не обрано!
                </p>
              )}
            </div>
          )}

          {/* 2. ALWAYS-VISIBLE NAKAZ HISTORY & REGISTRY PANEL */}
          <div className="bg-white rounded-[24px] p-6 border-2 border-[#cbd8d6] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-[#cbd8d6] pb-3">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.8]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-[#133b47]">
                  Історія наказів ФОП ({scannedFiles.length})
                </h3>
                {isScanning && (
                  <span className="text-xs font-black text-[#f8a44c] bg-[#133b47] px-2.5 py-0.5 rounded-full animate-pulse">
                    Сканування...
                  </span>
                )}
              </div>

              <button
                onClick={performScan}
                className="text-xs font-black text-[#133b47] hover:underline cursor-pointer"
                title="Оновити список"
              >
                Оновити
              </button>
            </div>

            {/* UNIFIED PROFESSIONAL SEARCH IN HISTORY */}
            {scannedFiles.length > 2 && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Пошук наказу або працівника..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-[#cbd8d6] focus:border-[#133b47] focus:outline-none text-sm font-black text-[#133b47] bg-[#fafdfc]"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-[#556e75] absolute left-3 top-3.5 stroke-[2.5]" />
                {historySearchQuery && (
                  <button
                    onClick={() => setHistorySearchQuery("")}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-[#133b47]"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* HISTORY CARDS LIST */}
            {filteredHistoryFiles.length === 0 ? (
              <div className="p-6 text-center text-[#556e75] flex flex-col items-center justify-center gap-2 bg-[#fafdfc] rounded-2xl border-2 border-dashed border-[#cbd8d6]">
                <DocumentTextIcon className="w-8 h-8 stroke-[1.8] text-slate-400" />
                <p className="text-sm font-black text-[#133b47]">Історія наказів порожня</p>
                <p className="text-xs text-[#556e75] font-bold">
                  Натисніть на документ, щоб відкрити його прямо у Word.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredHistoryFiles.map((item, idx) => {
                  const { nakazLabel, formattedTitle } = formatNakazHistoryItem(item.filename);

                  return (
                    <div
                      key={idx}
                      onClick={async () => {
                        try {
                          await openFileDirectly(item.filepath);
                        } catch (e) {
                          console.error("Failed to open file directly:", e);
                        }
                      }}
                      className="p-3.5 rounded-xl border-2 border-[#cbd8d6] hover:border-[#133b47] bg-gradient-to-r from-white via-[#fafdfc] to-[#f4f9f8] hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      title="Натисніть, щоб відкрити цей наказ у Word"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="px-3 py-1 rounded-lg bg-[#133b47] text-[#f8a44c] font-black text-xs shrink-0 group-hover:scale-105 transition-transform">
                          {nakazLabel}
                        </span>

                        <div className="flex flex-col truncate">
                          <span className="text-sm font-black text-[#133b47] group-hover:text-[#0f2e38] truncate">
                            {formattedTitle}
                          </span>
                          {item.date_modified && (
                            <span className="text-xs font-bold text-[#556e75]">
                              {item.date_modified}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-[#133b47]/10 text-[#133b47] group-hover:bg-[#133b47] group-hover:text-[#f8a44c] flex items-center justify-center transition-colors shrink-0">
                        <DocumentTextIcon className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DOCUMENT PREVIEW & GENERATE BUTTON (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-5 sticky top-4">
          {/* DETECTED SCRAPED ADDRESS INDICATOR BANNER */}
          {!hasValidFopAddress && detectedAddressRaw && (
            <div className="bg-gradient-to-r from-[#133b47] to-[#1c5567] rounded-2xl p-5 text-white shadow-xl flex items-center justify-between gap-4 animate-fadeIn border-2 border-white/20">
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="w-11 h-11 rounded-xl bg-[#f8a44c] text-[#133b47] flex items-center justify-center shrink-0 font-black shadow-md">
                  <SparklesIcon className="w-6 h-6 stroke-[2.8]" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-black text-[#f8a44c] truncate">
                    Знайдено адресу ФОП у наявних наказах!
                  </span>
                  <span className="text-xs text-[#c3d9d6] truncate font-bold">
                    {detectedAddressRaw}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddressModalFromScraped}
                className="px-4 py-2.5 rounded-xl bg-[#f8a44c] hover:bg-[#f6922d] text-[#133b47] font-black text-sm transition-all cursor-pointer shrink-0 shadow-md flex items-center gap-2 hover:scale-105"
              >
                <span>Переглянути &amp; Застосувати</span>
                <ArrowRightIcon className="w-5 h-5 stroke-[2.8]" />
              </button>
            </div>
          )}

          {/* DOCUMENT PREVIEW CARD */}
          <div className="bg-white rounded-[24px] p-6 border-2 border-[#cbd8d6] shadow-md flex flex-col gap-4">
            

            {/* PREVIEW CONTAINER STYLED LIKE REAL WORD PAPER SHEET WITH HIGH VISIBILITY */}
            <div className="bg-[#fafdfc] p-7 rounded-2xl border-2 border-[#cbd8d6] shadow-inner font-serif text-xs md:text-sm leading-relaxed text-slate-900 flex flex-col gap-3.5 min-h-[620px] relative">
              {/* MANDATORY ADDRESS MISSING WARNING BANNER */}
              {!hasValidFopAddress && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 text-amber-900 text-sm font-bold flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 shrink-0 stroke-[2.5]" />
                    <span>Адреса ФОП не вказана у базі даних!</span>
                  </div>
                  {detectedAddressRaw && (
                    <button
                      onClick={handleOpenAddressModalFromScraped}
                      className="text-sm font-black text-[#133b47] underline cursor-pointer hover:text-amber-900"
                    >
                      Імпортувати розпізнану адресу ➔
                    </button>
                  )}
                </div>
              )}

              <div className="text-center font-bold">
                <p className="uppercase text-sm font-black">ФІЗИЧНА ОСОБА-ПІДПРИЄМЕЦЬ</p>
                <p className="uppercase text-sm font-black text-[#133b47]">{activeFopName ? activeFopName.toUpperCase() : "ГАЛ ФЕРЕНЦ ФЕРЕНЦОВИЧ"}</p>
                {hasValidFopAddress ? (
                  <p className="uppercase font-normal text-xs md:text-sm text-slate-700">{currentAddress.toUpperCase()}</p>
                ) : (
                  <p className="font-normal text-xs md:text-sm text-rose-600 italic font-bold">[АДРЕСА ФОП НЕ ВКАЗАНА]</p>
                )}
                <p className="uppercase font-normal text-xs md:text-sm text-slate-700 mb-2.5">КОД ЄДРПОУ {activeFopEdrpou || "3608303518"}</p>
              </div>

              {/* EXACT DOUBLE-LINE HEADER SEPARATOR BORDER MATCHING SAMPLE DOCX */}
              <div className="w-full border-t-2 border-b border-slate-900 my-2 h-[3px]"></div>

              <div className="text-center font-bold mt-1">
                <p className="text-base font-black">НАКАЗ № {nakazNum}</p>
                <p className="font-normal text-xs md:text-sm">від {formattedNakazDate}</p>
              </div>

              {selectedNakazType === "prro" ? (
                <>
                  <p className="font-bold text-xs md:text-sm mt-1">
                    Про призначення касирів для роботи з ПРРО
                  </p>

                  <div className="flex flex-col gap-0.5 mt-2 text-justify leading-relaxed">
                    <p>У зв’язку із здійсненням готівкових та безготівкових розрахунків за продаж непродовольчих товарів із використанням програмного реєстратора розрахункових операцій (ПРРО),</p>
                    <p className="font-bold my-1">НАКАЗУЮ:</p>
                    <p className="font-bold">
                      1. Призначити касирами для роботи з ПРРО наступних працівників:
                    </p>

                    {activeFop && activeFop.munkasok && activeFop.munkasok.filter((w) => selectedKasaWorkerIds.includes(w.id)).length > 0 ? (
                      activeFop.munkasok
                        .filter((w) => selectedKasaWorkerIds.includes(w.id))
                        .map((w, idx, arr) => {
                          const dativeName = getWorkerDativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
                          const posName = w.foglalkozas_megnevezes ? w.foglalkozas_megnevezes.toLowerCase() : "продавець непродовольчих товарів";
                          const punct = idx === arr.length - 1 ? "." : ";";

                          return (
                            <p key={w.id} className="pl-6 font-medium">
                              <span className="font-bold">{dativeName}</span>, посада: {posName}{punct}
                            </p>
                          );
                        })
                    ) : (
                      <p className="italic text-rose-600 pl-6 font-bold">
                        [Оберіть працівників зі списку ліворуч]
                      </p>
                    )}

                    <p className="font-bold">2. Надати зазначеним особам право:</p>
                    <ul className="list-none pl-6 space-y-1">
                      <li>- відкривати/закривати зміну у ПРРО;</li>
                      <li>- здійснювати реєстрацію розрахункових операцій;</li>
                      <li>- оформлювати фіскальні чеки на продаж та повернення товарів;</li>
                      <li>- формувати щоденні Z-звіти відповідно до вимог законодавства.</li>
                    </ul>

                    <p className="font-bold">3. Покласти на касирів відповідальність за:</p>
                    <ul className="list-none pl-6 space-y-1">
                      <li>- дотримання порядку застосування ПРРО;</li>
                      <li>- правильність обліку розрахункових операцій;</li>
                      <li>- ведення касової дисципліни;</li>
                      <li>- збереження фіскальних звітів, чеків та іншої документації.</li>
                    </ul>

                    <p>
                      <span className="font-bold">4. </span>Зобов’язати касирів щоденно формувати Z-звіт у кінці кожної зміни.
                    </p>
                    <p>
                      <span className="font-bold">5. </span>Контроль за виконанням цього наказу залишаю за собою.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 mt-5 pt-4 border-t-2 border-slate-300 text-xs md:text-sm">
                    <p className="font-bold mb-1">З наказом ознайомлені:</p>
                    {activeFop && activeFop.munkasok && activeFop.munkasok.filter((w) => selectedKasaWorkerIds.includes(w.id)).length > 0 ? (
                      activeFop.munkasok
                        .filter((w) => selectedKasaWorkerIds.includes(w.id))
                        .map((w) => {
                          const initials = getWorkerInitials(w.vezeteknev, w.keresztnev, w.apai_nev);
                          const ukrMonths = [
                            "січня", "лютого", "березня", "квітня", "травня", "червня",
                            "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
                          ];
                          let dayStr = "15";
                          let monthStr = "липня";
                          let yearStr = "2026";
                          if (isoNakazDate) {
                            const parts = isoNakazDate.split("-");
                            if (parts.length === 3) {
                              const y = parseInt(parts[0], 10);
                              const m = parseInt(parts[1], 10) - 1;
                              const d = parseInt(parts[2], 10);
                              if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                                dayStr = d < 10 ? `0${d}` : `${d}`;
                                monthStr = ukrMonths[m] || "січня";
                                yearStr = `${y}`;
                              }
                            }
                          }

                          return (
                            <div key={w.id} className="grid grid-cols-2 gap-4 items-center">
                              <span className="font-bold italic">(______________)  {initials}</span>
                              <span className="text-right font-bold">«{dayStr}» {monthStr} {yearStr} р.</span>
                            </div>
                          );
                        })
                    ) : (
                      <div className="grid grid-cols-2 gap-4 items-center italic text-slate-400">
                        <span>(______________)  [ПІП ініціали]</span>
                        <span className="text-right">«15» липня 2026 р.</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 items-center mt-3 font-bold">
                      <span>ФОП {activeFopInitials || "Гал Ф.Ф."}</span>
                      <span className="text-right">___________________</span>
                    </div>
                  </div>
                </>
              ) : selectedNakazType === "kasa" ? (
                <>
                  <p className="font-bold text-xs md:text-sm mt-1">
                    Про призначення матеріально відповідальних осіб за касу
                  </p>

                  <div className="flex flex-col gap-0.5 mt-2 text-justify leading-relaxed">
                    <p>У зв’язку з необхідністю забезпечення зберігання готівкових коштів у касі та організації роботи позмінно,</p>
                    <p className="font-bold my-1">НАКАЗУЮ:</p>
                    <p className="font-bold">
                      1. Призначити матеріально відповідальними особами за зберігання готівкових коштів у касі наступних працівників:
                    </p>

                    {activeFop && activeFop.munkasok && activeFop.munkasok.filter((w) => selectedKasaWorkerIds.includes(w.id)).length > 0 ? (
                      activeFop.munkasok
                        .filter((w) => selectedKasaWorkerIds.includes(w.id))
                        .map((w, idx, arr) => {
                          const dativeName = getWorkerDativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
                          const pronoun = getUkrainianPronoun(w);
                          const hours = kasaWorkerHours[w.id] || {
                            startTime: "09:00",
                            endTime: w.teljes_munkaido ? "17:00" : "13:00",
                          };
                          const punct = idx === arr.length - 1 ? "." : ",";

                          return (
                            <p key={w.id} className="pl-6 font-medium">
                              <span className="font-bold">{dativeName}</span>, {pronoun} працює з{" "}
                              <span className="font-bold">{hours.startTime}</span> до{" "}
                              <span className="font-bold">{hours.endTime}</span> щодня згідно з графіком{punct}
                            </p>
                          );
                        })
                    ) : (
                      <p className="italic text-rose-600 pl-6 font-bold">
                        [Оберіть працівників зі списку ліворуч]
                      </p>
                    )}

                    <p className="font-bold">2. Покласти на вищезазначених осіб відповідальність за:</p>
                    <ul className="list-none pl-6 space-y-1">
                      <li>- зберігання готівкових коштів у касі під час свого робочого часу;</li>
                      <li>- ведення касових документів та облік операцій;</li>
                      <li>- дотримання порядку ведення касових операцій відповідно до чинного законодавства (Положення НБУ №148 від 29.12.2017 р.);</li>
                    </ul>
                    <p>
                      <span className="font-bold">3. </span>Провести інвентаризацію каси на момент передачі матеріальних цінностей кожному з працівників.
                    </p>
                    <p>
                      <span className="font-bold">4. </span>Контроль за виконанням цього наказу залишаю за собою.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 mt-5 pt-4 border-t-2 border-slate-300 text-xs md:text-sm">
                    <p className="font-bold mb-1">З наказом ознайомлені:</p>
                    {activeFop && activeFop.munkasok && activeFop.munkasok.filter((w) => selectedKasaWorkerIds.includes(w.id)).length > 0 ? (
                      activeFop.munkasok
                        .filter((w) => selectedKasaWorkerIds.includes(w.id))
                        .map((w) => {
                          const initials = getWorkerInitials(w.vezeteknev, w.keresztnev, w.apai_nev);
                          const ukrMonths = [
                            "січня", "лютого", "березня", "квітня", "травня", "червня",
                            "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
                          ];
                          let dayStr = "15";
                          let monthStr = "липня";
                          let yearStr = "2026";
                          if (isoNakazDate) {
                            const parts = isoNakazDate.split("-");
                            if (parts.length === 3) {
                              const y = parseInt(parts[0], 10);
                              const m = parseInt(parts[1], 10) - 1;
                              const d = parseInt(parts[2], 10);
                              if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                                dayStr = d < 10 ? `0${d}` : `${d}`;
                                monthStr = ukrMonths[m] || "січня";
                                yearStr = `${y}`;
                              }
                            }
                          }

                          return (
                            <div key={w.id} className="grid grid-cols-2 gap-4 items-center">
                              <span className="font-bold italic">(______________)  {initials}</span>
                              <span className="text-right font-bold">«{dayStr}» {monthStr} {yearStr} р.</span>
                            </div>
                          );
                        })
                    ) : (
                      <div className="grid grid-cols-2 gap-4 items-center italic text-slate-400">
                        <span>(______________)  [ПІП ініціали]</span>
                        <span className="text-right">«15» липня 2026 р.</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 items-center mt-3 font-bold">
                      <span>ФОП {activeFopInitials || "Гал Ф.Ф."}</span>
                      <span className="text-right">___________________</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-bold text-xs md:text-sm mt-1">Про прийняття на роботу</p>

                  <div className="flex flex-col gap-3 mt-2 text-justify leading-relaxed">
                    <p>{getClause1Text()}</p>
                    <p>
                      2. Оформити трудовий договір з {formattedWorkStartDate}, в якому зазначити умови праці (режим, права і обов'язки сторін, і т.д).
                    </p>
                    <p>
                      3. {workerDative || "[ПІП працівника]"} приступити до роботи з {formattedWorkStartDate}.
                    </p>
                    <p className="pl-6">Підстава: заява {workerInitials || "[ПІП ініціали]"}</p>
                  </div>

                  <div className="flex flex-col gap-2 mt-5 pt-4 border-t-2 border-slate-300 text-xs md:text-sm">
                    <p>ФОП {activeFopInitials || "Гал Ф.Ф."}___________________</p>
                    <p>З наказом ознайомлений(а), {workerInitials || "[ПІП ініціали]"}                       ___________________</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* GENERATE ACTION BUTTON */}
          <button
            onClick={selectedNakazType === "prro" ? handleGeneratePrroDoc : selectedNakazType === "kasa" ? handleGenerateKasaDoc : handleGenerateDoc}
            disabled={isGenerating || !hasValidFopAddress}
            className={`w-full py-4 rounded-2xl font-black text-base transition-all shadow-lg flex items-center justify-center gap-2.5 ${
              hasValidFopAddress
                ? "bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] cursor-pointer"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            <DocumentArrowDownIcon className="w-6 h-6 stroke-[2.5]" />
            <span>{isGenerating ? "Створення Наказу..." : `Згенерувати та відкрити Наказ № ${nakazNum} (.docx)`}</span>
          </button>
        </div>
      </div>

      {/* FOP ADDRESS EDIT & SEGMENTATION MODAL */}
      {isEditAddressModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fadeIn">
          <div className="bg-white rounded-[28px] p-7 max-w-xl w-full border-2 border-[#cbd8d6] shadow-2xl flex flex-col gap-6 animate-modalScale">
            <div className="flex items-center justify-between border-b-2 border-[#cbd8d6] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center shrink-0 shadow-md">
                  <HomeIcon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-[#133b47] leading-tight">
                    Редагування адреси ФОП
                  </h3>
                  <span className="text-xs text-[#556e75] font-black uppercase mt-0.5">
                    ФОП: {activeFopName}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsEditAddressModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5 stroke-[2.8]" />
              </button>
            </div>

            {/* LARGE FORM INPUT FIELDS WITH CLEAN LABELS */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#133b47]">Індекс:</label>
                <input
                  type="text"
                  value={segmentedAddress.iranyitoszam || ""}
                  onChange={(e) =>
                    setSegmentedAddress((prev) => ({ ...prev, iranyitoszam: e.target.value }))
                  }
                  placeholder="90202"
                  className="p-3.5 rounded-xl border-2 border-[#cbd8d6] focus:border-[#133b47] focus:outline-none font-black text-[#133b47] text-base bg-[#fafdfc]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#133b47]">Область:</label>
                <input
                  type="text"
                  value={segmentedAddress.megye || ""}
                  onChange={(e) =>
                    setSegmentedAddress((prev) => ({ ...prev, megye: e.target.value }))
                  }
                  placeholder="Закарпатська"
                  className="p-3.5 rounded-xl border-2 border-[#cbd8d6] focus:border-[#133b47] focus:outline-none font-black text-[#133b47] text-base bg-[#fafdfc]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#133b47]">Район:</label>
                <input
                  type="text"
                  value={segmentedAddress.jaras || ""}
                  onChange={(e) =>
                    setSegmentedAddress((prev) => ({ ...prev, jaras: e.target.value }))
                  }
                  placeholder="Берегівський"
                  className="p-3.5 rounded-xl border-2 border-[#cbd8d6] focus:border-[#133b47] focus:outline-none font-black text-[#133b47] text-base bg-[#fafdfc]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#133b47]">Населений пункт:</label>
                <input
                  type="text"
                  value={segmentedAddress.kozseg || ""}
                  onChange={(e) =>
                    setSegmentedAddress((prev) => ({ ...prev, kozseg: e.target.value }))
                  }
                  placeholder="м. Берегове"
                  className="p-3.5 rounded-xl border-2 border-[#cbd8d6] focus:border-[#133b47] focus:outline-none font-black text-[#133b47] text-base bg-[#fafdfc]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#133b47]">Вулиця:</label>
                <input
                  type="text"
                  value={segmentedAddress.utca || ""}
                  onChange={(e) =>
                    setSegmentedAddress((prev) => ({ ...prev, utca: e.target.value }))
                  }
                  placeholder="вул. Новий Світ"
                  className="p-3.5 rounded-xl border-2 border-[#cbd8d6] focus:border-[#133b47] focus:outline-none font-black text-[#133b47] text-base bg-[#fafdfc]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#133b47]">Будинок / квартира:</label>
                <input
                  type="text"
                  value={segmentedAddress.hazszam || ""}
                  onChange={(e) =>
                    setSegmentedAddress((prev) => ({ ...prev, hazszam: e.target.value }))
                  }
                  placeholder="11/2"
                  className="p-3.5 rounded-xl border-2 border-[#cbd8d6] focus:border-[#133b47] focus:outline-none font-black text-[#133b47] text-base bg-[#fafdfc]"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsEditAddressModalOpen(false)}
                className="w-1/2 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all cursor-pointer"
              >
                Скасувати
              </button>

              <button
                type="button"
                onClick={handleSaveSegmentedAddress}
                className="w-1/2 py-3.5 rounded-xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-base transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <CheckIcon className="w-5 h-5 stroke-[2.8]" />
                <span>Зберегти</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
