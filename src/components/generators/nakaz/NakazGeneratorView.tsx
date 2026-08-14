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
  ArrowTrendingUpIcon,
  UserPlusIcon,
  UserMinusIcon,
  BanknotesIcon,
  QrCodeIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  Squares2X2Icon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { FopData, Munkas, NakazFileItem, Cim, NakazKasaWorkerItem, NakazPrroWorkerItem, NakazPriyomWorkerItem, NakazZvilnennyaWorkerItem } from "../../../types/fop";
import { formatAddressDisplay } from "../../../utils/addressUtils";
import {
  generateNakazPriyomDocx,
  generateNakazZvilnennyaDocx,
  generateNakazKasaDocx,
  generateNakazPrroDocx,
  generateNakazShtatDocx,
  generateNakazGrafikVidpustokDocx,
  scanFopNakazy,
  scrapeFopAddressFromNakazy,
  ensureFopDirectory,
  openFileDirectly,
  openFolderInExplorer,
  updateFopDirect,
} from "../../../services/fopService";
import { getWorkerAccusativeName, getWorkerDativeName, getWorkerInitials, formatUkrainianDate, formatDotDateWithZeros, declinePositionGenitive } from "../../../utils/ukrainianDeclension";
import { CustomDatePicker } from "../../pickers/CustomDatePicker";

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

export type NakazTypeKey = "priyom" | "zvilnennya" | "kasa" | "prro" | "shtat" | "grafik_vidpustok";

export interface NakazTypeOption {
  key: NakazTypeKey;
  label: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  badgeClass: string;
  actionText: string;
  actionArrowBg: string;
  cardBorder: string;
  cardBg: string;
  active: boolean;
}

export const NAKAZ_TYPE_OPTIONS: NakazTypeOption[] = [
  {
    key: "priyom",
    label: "Прийняття на роботу",
    description: "Наказ про прийняття одного або кількох працівників z вибором дати.",
    badge: "Прийняття",
    icon: UserPlusIcon,
    iconBg: "bg-emerald-100 text-emerald-700",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    actionText: "text-emerald-700 group-hover:text-emerald-600 font-bold",
    actionArrowBg: "bg-emerald-600 text-white group-hover:bg-emerald-700",
    cardBorder: "hover:border-emerald-500/60 hover:ring-2 hover:ring-emerald-500/20",
    cardBg: "from-emerald-50/80 via-white to-slate-50/60",
    active: true,
  },
  {
    key: "zvilnennya",
    label: "Звільнення з роботи",
    description: "Наказ про звільнення працівників за угодою сторін (ст. 36 КЗпП України).",
    badge: "Звільнення",
    icon: UserMinusIcon,
    iconBg: "bg-rose-100 text-rose-700",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    actionText: "text-rose-700 group-hover:text-rose-600 font-bold",
    actionArrowBg: "bg-rose-600 text-white group-hover:bg-rose-700",
    cardBorder: "hover:border-rose-500/60 hover:ring-2 hover:ring-rose-500/20",
    cardBg: "from-rose-50/80 via-white to-slate-50/60",
    active: true,
  },
  {
    key: "kasa",
    label: "Відповідальність за касу",
    description: "Призначення матеріально відповідальних осіб за зберігання готівки у касі.",
    badge: "Матеріальна",
    icon: BanknotesIcon,
    iconBg: "bg-amber-100 text-amber-700",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    actionText: "text-amber-700 group-hover:text-amber-600 font-bold",
    actionArrowBg: "bg-amber-600 text-white group-hover:bg-amber-700",
    cardBorder: "hover:border-amber-500/60 hover:ring-2 hover:ring-amber-500/20",
    cardBg: "from-amber-50/80 via-white to-slate-50/60",
    active: true,
  },
  {
    key: "prro",
    label: "Призначення касирів ПРРО",
    description: "Призначення касирів для роботи з ПРРО, відкриття змін та Z-звітів.",
    badge: "ПРРО",
    icon: QrCodeIcon,
    iconBg: "bg-purple-100 text-purple-700",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
    actionText: "text-purple-700 group-hover:text-purple-600 font-bold",
    actionArrowBg: "bg-purple-600 text-white group-hover:bg-purple-700",
    cardBorder: "hover:border-purple-500/60 hover:ring-2 hover:ring-purple-500/20",
    cardBg: "from-purple-50/80 via-white to-slate-50/60",
    active: true,
  },
  {
    key: "shtat",
    label: "Затвердження штатного розпису",
    description: "Наказ про затвердження нового штатного розпису підприємства.",
    badge: "Штат",
    icon: BuildingOffice2Icon,
    iconBg: "bg-indigo-100 text-indigo-700",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    actionText: "text-indigo-700 group-hover:text-indigo-600 font-bold",
    actionArrowBg: "bg-indigo-600 text-white group-hover:bg-indigo-700",
    cardBorder: "hover:border-indigo-500/60 hover:ring-2 hover:ring-indigo-500/20",
    cardBg: "from-indigo-50/80 via-white to-slate-50/60",
    active: true,
  },
  {
    key: "grafik_vidpustok",
    label: "Графік відпусток",
    description: "Наказ про затвердження графіку щорічних оплачуваних відпусток працівників.",
    badge: "Графік",
    icon: CalendarDaysIcon,
    iconBg: "bg-teal-100 text-teal-700",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-300",
    actionText: "text-teal-700 group-hover:text-teal-600 font-bold",
    actionArrowBg: "bg-teal-600 text-white group-hover:bg-teal-700",
    cardBorder: "hover:border-teal-500/60 hover:ring-2 hover:ring-teal-500/20",
    cardBg: "from-teal-50/80 via-white to-slate-50/60",
    active: true,
  },
];

export function detectNakazCategory(filename: string) {
  const f = (filename || "").toLowerCase();

  if (f.includes("прийом") || f.includes("прийняття")) {
    return {
      key: "priyom" as NakazTypeKey,
      label: "Прийняття на роботу",
      badge: "Прийняття",
      badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-300",
      numBadgeClass: "bg-emerald-600 text-white",
      iconBg: "bg-emerald-600 text-white",
      IconComponent: UserPlusIcon,
    };
  }
  if (f.includes("звільнення") || f.includes("звільнити")) {
    return {
      key: "zvilnennya" as NakazTypeKey,
      label: "Звільнення з роботи",
      badge: "Звільнення",
      badgeClass: "bg-rose-100 text-rose-800 border border-rose-300",
      numBadgeClass: "bg-rose-600 text-white",
      iconBg: "bg-rose-600 text-white",
      IconComponent: UserMinusIcon,
    };
  }
  if (f.includes("матеріально") || f.includes("каса") || f.includes("касу")) {
    return {
      key: "kasa" as NakazTypeKey,
      label: "Відповідальність за касу",
      badge: "Матеріальна",
      badgeClass: "bg-amber-100 text-amber-800 border border-amber-300",
      numBadgeClass: "bg-amber-600 text-white",
      iconBg: "bg-amber-600 text-white",
      IconComponent: BanknotesIcon,
    };
  }
  if (f.includes("прро") || f.includes("касирів")) {
    return {
      key: "prro" as NakazTypeKey,
      label: "Призначення касирів ПРРО",
      badge: "ПРРО",
      badgeClass: "bg-purple-100 text-purple-800 border border-purple-300",
      numBadgeClass: "bg-purple-600 text-white",
      iconBg: "bg-purple-600 text-white",
      IconComponent: QrCodeIcon,
    };
  }
  if (f.includes("штат") || f.includes("штатного")) {
    return {
      key: "shtat" as NakazTypeKey,
      label: "Затвердження штатного розпису",
      badge: "Штат",
      badgeClass: "bg-indigo-100 text-indigo-800 border border-indigo-300",
      numBadgeClass: "bg-indigo-600 text-white",
      iconBg: "bg-indigo-600 text-white",
      IconComponent: BuildingOffice2Icon,
    };
  }
  if (f.includes("відпусток") || f.includes("графік")) {
    return {
      key: "grafik_vidpustok" as NakazTypeKey,
      label: "Графік відпусток",
      badge: "Графік",
      badgeClass: "bg-teal-100 text-teal-800 border border-teal-300",
      numBadgeClass: "bg-teal-600 text-white",
      iconBg: "bg-teal-600 text-white",
      IconComponent: CalendarDaysIcon,
    };
  }

  return {
    key: "unknown" as const,
    label: "Кадровий наказ",
    badge: "Наказ",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-300",
    numBadgeClass: "bg-slate-700 text-white",
    iconBg: "bg-[#133b47] text-[#f8a44c]",
    IconComponent: DocumentTextIcon,
  };
}

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

function calculateNoticeDate(isoDateStr: string): string {
  if (!isoDateStr) return "";
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return "";
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return "";
  const dt = new Date(y, m, d + 10);
  const day = dt.getDate() < 10 ? `0${dt.getDate()}` : `${dt.getDate()}`;
  const month = dt.getMonth() + 1 < 10 ? `0${dt.getMonth() + 1}` : `${dt.getMonth() + 1}`;
  const year = dt.getFullYear();
  return `${day}.${month}.${year}`;
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
    .map((word) => {
      if (word.includes(".")) {
        return word
          .split(".")
          .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ""))
          .join(".");
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
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
    epulet: "",
    lakas_szoba: "",
  };

  if (!raw || !raw.trim()) return cim;

  let clean = raw.trim();

  // Extract 5-digit zip code reliably
  const zipMatch = clean.match(/(?:^|[^\d])(\d{5})(?:[^\d]|$)/);
  if (zipMatch) {
    cim.iranyitoszam = zipMatch[1];
  }

  // Split by comma/semicolon, then split internal space-separated sub-tokens
  const rawParts = clean.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
  const parts: string[] = [];
  for (const p of rawParts) {
    const subs = p
      .split(/\s+(?=(?:м\.|с\.|смт|вул\.|вулиця|буд\.|будинок|корп\.|корпус|кв\.|квартира)\s+)/gi)
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

    // Village / Kozseg (село, с., м., місто, смт)
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

    // Street / Utca (вулиця, вул.)
    if (pLower.includes("вул") || pLower.includes("вулиця")) {
      let u = part.replace(/^(вулиця|вул\.)\s*/gi, "").trim();
      cim.utca = `вул. ${toTitleCase(u)}`;
      continue;
    }

    // Corpus / Epulet (корпус, корп.)
    if (pLower.includes("корп") || pLower.includes("корпус")) {
      let ep = part.replace(/^(корпус|корп\.|к\.)\s*/gi, "").trim();
      cim.epulet = ep;
      continue;
    }

    // Apartment / Lakas_szoba (квартира, кв.)
    if (pLower.includes("кв") || pLower.includes("квартира") || pLower.includes("кім")) {
      let lak = part.replace(/^(квартира|кв\.|кімната|кім\.)\s*/gi, "").trim();
      cim.lakas_szoba = lak;
      continue;
    }

    // Building / Hazszam (будинок, буд., б.)
    if (pLower.includes("буд") || pLower.includes("будинок") || pLower.includes("б.")) {
      let h = part.replace(/^(будинок|буд\.|б\.)\s*/gi, "").trim();
      if (h.includes("/")) {
        const hParts = h.split("/");
        cim.hazszam = hParts[0].trim();
        if (hParts[1] && !cim.lakas_szoba) {
          cim.lakas_szoba = hParts[1].trim();
        }
      } else {
        cim.hazszam = h;
      }
      continue;
    }

    if (!cim.utca && !/^\d+$/.test(part) && !pLower.includes("фізична особа")) {
      let cleanPart = part.replace(/^(вулиця|вул\.)\s*/gi, "").trim();
      cim.utca = `вул. ${toTitleCase(cleanPart)}`;
    }
  }

  return cim;
}

// Formats Cim object into standard Nakaz header string (adds "ОБЛАСТЬ", "РАЙОН" with newline after "РАЙОН,", "С./М.", "ВУЛ.", "БУД.")
export function formatCimForNakaz(cim: Cim | undefined): string {
  if (!cim) return "";
  const line1Parts: string[] = [];
  const line2Parts: string[] = [];

  if (cim.iranyitoszam && cim.iranyitoszam.trim()) {
    line1Parts.push(cim.iranyitoszam.trim());
  }

  if (cim.megye && cim.megye.trim()) {
    let m = cim.megye.trim().replace(/область|обл\.?/gi, "").trim();
    line1Parts.push(`${m.toUpperCase()} ОБЛАСТЬ`);
  }

  if (cim.jaras && cim.jaras.trim()) {
    let j = cim.jaras.trim().replace(/район|р-н\.?/gi, "").trim();
    line1Parts.push(`${j.toUpperCase()} РАЙОН`);
  }

  if (cim.kozseg && cim.kozseg.trim()) {
    let k = cim.kozseg.trim();
    let kLower = k.toLowerCase();
    if (!kLower.startsWith("м.") && !kLower.startsWith("с.") && !kLower.startsWith("смт") && !kLower.startsWith("село") && !kLower.startsWith("місто")) {
      k = `С. ${k.toUpperCase()}`;
    } else {
      k = k.toUpperCase();
      if (k.startsWith("СЕЛО")) {
        k = k.replace(/^СЕЛО\s*/, "С. ");
      } else if (k.startsWith("МІСТО")) {
        k = k.replace(/^МІСТО\s*/, "М. ");
      }
    }
    line2Parts.push(k);
  }

  if (cim.utca && cim.utca.trim()) {
    let u = cim.utca.trim().toUpperCase();
    if (!u.startsWith("ВУЛ.") && !u.startsWith("ВУЛИЦЯ")) {
      u = `ВУЛ. ${u}`;
    }
    line2Parts.push(u);
  }

  if (cim.hazszam && cim.hazszam.trim()) {
    let h = cim.hazszam.trim().replace(/^(будинок|буд\.|б\.)\s*/gi, "").trim().toUpperCase();
    line2Parts.push(`БУД. ${h}`);
  }

  if (cim.epulet && cim.epulet.trim()) {
    let ep = cim.epulet.trim().replace(/^(корпус|корп\.|к\.)\s*/gi, "").trim().toUpperCase();
    line2Parts.push(`КОРП. ${ep}`);
  }

  if (cim.lakas_szoba && cim.lakas_szoba.trim()) {
    let lak = cim.lakas_szoba.trim().replace(/^(квартира|кв\.|кімната|кім\.)\s*/gi, "").trim().toUpperCase();
    line2Parts.push(`КВ. ${lak}`);
  }

  const line1 = line1Parts.join(", ");
  const line2 = line2Parts.join(", ");

  if (line1 && line2) {
    return `${line1},\n${line2}`;
  }
  return line1 || line2;
}

export function normalizeAddressHeader(rawAddress: string): string {
  if (!rawAddress) return "";
  let formatted = rawAddress
    .replace(/ОБЛ\./gi, "ОБЛАСТЬ")
    .replace(/ОБЛ(?=\s*,|\s*$)/gi, "ОБЛАСТЬ")
    .replace(/Р-Н\./gi, "РАЙОН")
    .replace(/Р-Н(?=\s*,|\s*$)/gi, "РАЙОН")
    .replace(/СЕЛО/gi, "С.")
    .replace(/МІСТО/gi, "М.");

  if (formatted.includes("РАЙОН,") && !formatted.includes("\n")) {
    formatted = formatted.replace("РАЙОН,", "РАЙОН,\n");
  }
  return formatted;
}

export const NakazGeneratorView: React.FC<NakazGeneratorViewProps> = ({
  fops,
  selectedFopId,
  rootFolder,
  onShowToast,
  onBack,
  onEditWorker: _onEditWorker,
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

  const [selectedNakazType, setSelectedNakazType] = useState<NakazTypeKey | null>(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);



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
  const [isoNakazDate, setIsoNakazDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [isoWorkStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [salaryStr] = useState("8 647,00 грн.");

  // Cash register responsibility decree state
  const [selectedKasaWorkerIds, setSelectedKasaWorkerIds] = useState<number[]>([]);
  const [kasaWorkerHours, setKasaWorkerHours] = useState<Record<number, { startTime: string; endTime: string }>>({});

  // Multi-worker selection states for Priyom & Zvilnennya
  const [selectedPriyomWorkerIds, setSelectedPriyomWorkerIds] = useState<number[]>([]);
  const [selectedZvilnennyaWorkerIds, setSelectedZvilnennyaWorkerIds] = useState<number[]>([]);

  // Calculate target hire date from the first selected worker for priyom
  const priyomTargetDate = React.useMemo(() => {
    if (selectedPriyomWorkerIds.length === 0 || !activeFop || !activeFop.munkasok) return null;
    const firstWorker = activeFop.munkasok.find((w) => w.id === selectedPriyomWorkerIds[0]);
    return firstWorker ? (firstWorker.munkakezdes_datum || "") : null;
  }, [selectedPriyomWorkerIds, activeFop]);

  // Calculate target dismissal date from the first selected worker for zvilnennya
  const zvilnennyaTargetDate = React.useMemo(() => {
    if (selectedZvilnennyaWorkerIds.length === 0 || !activeFop || !activeFop.munkasok) return null;
    const firstWorker = activeFop.munkasok.find((w) => w.id === selectedZvilnennyaWorkerIds[0]);
    return firstWorker ? (firstWorker.munkaviszony_vege || "") : null;
  }, [selectedZvilnennyaWorkerIds, activeFop]);

  // Automatically sync decree date (isoNakazDate) with the worker's date (priyomTargetDate / zvilnennyaTargetDate)
  useEffect(() => {
    if (selectedNakazType === "priyom" && priyomTargetDate) {
      setIsoNakazDate(priyomTargetDate);
    } else if (selectedNakazType === "zvilnennya" && zvilnennyaTargetDate) {
      setIsoNakazDate(zvilnennyaTargetDate);
    }
  }, [selectedNakazType, priyomTargetDate, zvilnennyaTargetDate]);

  const handleTogglePriyomWorker = (w: Munkas) => {
    const wDate = w.munkakezdes_datum || "";
    if (selectedPriyomWorkerIds.includes(w.id)) {
      setSelectedPriyomWorkerIds((prev) => prev.filter((id) => id !== w.id));
    } else {
      if (priyomTargetDate !== null && wDate !== priyomTargetDate) {
        onShowToast(`У один наказ про прийняття можна включити лише працівників з однаковою датою прийняття (${priyomTargetDate})!`);
        return;
      }
      setSelectedPriyomWorkerIds((prev) => [...prev, w.id]);
    }
  };

  const handleToggleZvilnennyaWorker = (w: Munkas) => {
    const wDate = w.munkaviszony_vege || "";
    if (!wDate.trim()) {
      onShowToast("Для створення наказу про звільнення у профілі працівника має бути вказана дата звільнення!");
      return;
    }
    if (selectedZvilnennyaWorkerIds.includes(w.id)) {
      setSelectedZvilnennyaWorkerIds((prev) => prev.filter((id) => id !== w.id));
    } else {
      if (zvilnennyaTargetDate !== null && wDate !== zvilnennyaTargetDate) {
        onShowToast(`У один наказ про звільнення можна включити лише працівників з однаковою датою звільнення (${zvilnennyaTargetDate})!`);
        return;
      }
      setSelectedZvilnennyaWorkerIds((prev) => [...prev, w.id]);
    }
  };

  // Staff schedule decree state (Наказ про затвердження штатного розпису)
  const [shtatReasonText, setShtatReasonText] = useState<string>("У зв’язку із збільшенням розмірів оплати праці:");

  // Vacation schedule decree state (Наказ про затвердження графіка відпусток)
  const [vacationPeriodText, setVacationPeriodText] = useState<string>("2026 рік");

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (activeFop && activeFop.munkasok && activeFop.munkasok.length > 0) {
      setSelectedKasaWorkerIds((prev) => (prev.length > 0 ? prev : activeFop.munkasok.map((w) => w.id)));
      
      // Auto-select initial priyom workers matching the first worker's start date
      const firstActive = activeFop.munkasok[0];
      if (firstActive) {
        const targetKezd = firstActive.munkakezdes_datum || "";
        const matchingPriyom = activeFop.munkasok.filter((w) => (w.munkakezdes_datum || "") === targetKezd).map((w) => w.id);
        setSelectedPriyomWorkerIds(matchingPriyom);
      }

      // Auto-select initial zvilnennya workers matching the first dismissed worker's end date
      const dismissedList = activeFop.munkasok.filter((w) => w.munkaviszony_vege && w.munkaviszony_vege.trim().length > 0);
      if (dismissedList.length > 0) {
        const targetVege = dismissedList[0].munkaviszony_vege || "";
        const matchingZviln = dismissedList.filter((w) => (w.munkaviszony_vege || "") === targetVege).map((w) => w.id);
        setSelectedZvilnennyaWorkerIds(matchingZviln);
      } else {
        setSelectedZvilnennyaWorkerIds([]);
      }

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
        epulet: activeFop.cim.epulet || "",
        lakas_szoba: activeFop.cim.lakas_szoba || "",
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

      const formatted = formatAddressDisplay(segmentedAddress);

      setCurrentAddress(formatted);
      setIsEditAddressModalOpen(false);
      setDetectedAddressRaw(null);
      onShowToast("Адресу ФОП успішно збережено в базу даних!");
    } catch (err: any) {
      console.error("Error saving address to database:", err);
      onShowToast(`Помилка збереження: ${err?.toString() || "Невідома помилка"}`);
    }
  };



  const formattedNakazDate = formatUkrainianDate(isoNakazDate, "yearWord");
  const formattedWorkStartDateDot = formatDotDateWithZeros(isoWorkStartDate);
  const formattedWorkStartDate = `${formattedWorkStartDateDot}`;



  const handleGenerateDoc = async () => {
    if (!activeFop) {
      onShowToast("Спочатку оберіть активного ФОП зі списку!");
      return;
    }

    if (!hasValidFopAddress) {
      onShowToast("Помилка: Адреса ФОП є обов'язковою! Заповніть адресу у профілі ФОП перед створенням Наказу.");
      return;
    }

    const selectedWorkers = (activeFop.munkasok || []).filter((w) => selectedPriyomWorkerIds.includes(w.id));
    if (selectedWorkers.length === 0) {
      onShowToast("Оберіть хоча б одного працівника для прийняття!");
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

      const workerItems: NakazPriyomWorkerItem[] = selectedWorkers.map((w) => {
        const acc = getWorkerAccusativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
        const dat = getWorkerDativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
        const init = getWorkerInitials(w.vezeteknev, w.keresztnev, w.apai_nev);
        const pos = declinePositionGenitive(w.foglalkozas_megnevezes || "працівник");
        const sal = w.fizetes
          ? `${w.fizetes.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн.`
          : salaryStr;
        const workStart = w.munkakezdes_datum
          ? formatDotDateWithZeros(w.munkakezdes_datum)
          : formattedWorkStartDate;

        return {
          worker_name_accusative: acc,
          worker_name_dative: dat,
          worker_initials: init,
          position_name: pos,
          salary_str: sal,
          work_start_date_str: workStart,
          employment_type: !w.foallas ? "sumisnyctvo" : !w.teljes_munkaido ? "nepovny_chas" : "main",
        };
      });

      await generateNakazPriyomDocx({
        fop_id: activeFop.id,
        fop_name: activeFopName,
        fop_code: activeFopCode,
        fop_address: currentAddress,
        fop_edrpou: activeFopEdrpou,
        fop_initials: activeFopInitials,
        nakaz_num: nakazNum,
        nakaz_date_str: formattedNakazDate,
        workers: workerItems,
        save_dir: targetDir || undefined,
      });

      onShowToast(`Наказ № ${nakazNum} про прийняття успішно створено!`);
      await performScan();
    } catch (err: any) {
      console.error("Error generating Nakaz Priyom docx:", err);
      onShowToast(`Помилка генерації Наказу: ${err?.toString() || "Невідома помилка"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateZvilnennyaDoc = async () => {
    if (!activeFop) {
      onShowToast("Спочатку оберіть активного ФОП зі списку!");
      return;
    }

    if (!hasValidFopAddress) {
      onShowToast("Помилка: Адреса ФОП є обов'язковою! Заповніть адресу у профілі ФОП перед створенням Наказу.");
      return;
    }

    const selectedWorkers = (activeFop.munkasok || []).filter((w) => selectedZvilnennyaWorkerIds.includes(w.id));
    if (selectedWorkers.length === 0) {
      onShowToast("Оберіть хоча б одного працівника для звільнення!");
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

      const workerItems: NakazZvilnennyaWorkerItem[] = selectedWorkers.map((w) => {
        const acc = getWorkerAccusativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
        const dat = getWorkerDativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
        const init = getWorkerInitials(w.vezeteknev, w.keresztnev, w.apai_nev);
        const pos = declinePositionGenitive(w.foglalkozas_megnevezes || "працівник");
        const disDate = w.munkaviszony_vege
          ? formatDotDateWithZeros(w.munkaviszony_vege)
          : formattedNakazDate;

        return {
          worker_name_accusative: acc,
          worker_name_dative: dat,
          worker_initials: init,
          position_name: pos,
          dismissal_date_str: disDate,
          reason_text: "за угодою сторін, п. 1 ст. 36 КЗпП України",
        };
      });

      await generateNakazZvilnennyaDocx({
        fop_id: activeFop.id,
        fop_name: activeFopName,
        fop_code: activeFopCode,
        fop_address: currentAddress,
        fop_edrpou: activeFopEdrpou,
        fop_initials: activeFopInitials,
        nakaz_num: nakazNum,
        nakaz_date_str: formattedNakazDate,
        workers: workerItems,
        save_dir: targetDir || undefined,
      });

      onShowToast(`Наказ № ${nakazNum} про звільнення успішно створено!`);
      await performScan();
    } catch (err: any) {
      console.error("Error generating Nakaz Zvilnennya docx:", err);
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
          posada: posName,
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

  const handleGenerateShtatDoc = async () => {
    if (!activeFop) {
      onShowToast("Спочатку оберіть активного ФОП зі списку!");
      return;
    }

    if (!hasValidFopAddress) {
      onShowToast("Помилка: Адреса ФОП є обов'язковою! Заповніть адресу у профілі ФОП перед створенням Наказу.");
      return;
    }

    if (!shtatReasonText.trim()) {
      onShowToast("Вкажіть підставу (причину) наказу!");
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

      let dayStr = "01";
      let monthStr = "січня";
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

      await generateNakazShtatDocx({
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
        shtat_date_str: formattedNakazDate,
        reason_text: shtatReasonText.trim(),
        save_dir: targetDir || undefined,
      });

      onShowToast(`Наказ № ${nakazNum} успішно створено!`);
      await performScan();
    } catch (err: any) {
      console.error("Error generating Nakaz Shtat docx:", err);
      onShowToast(`Помилка генерації Наказу: ${err?.toString() || "Невідома помилка"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateGrafikVidpustokDoc = async () => {
    if (!activeFop) {
      onShowToast("Спочатку оберіть активного ФОП зі списку!");
      return;
    }

    if (!hasValidFopAddress) {
      onShowToast("Помилка: Адреса ФОП є обов'язковою! Заповніть адресу у профілі ФОП перед створенням Наказу.");
      return;
    }

    if (!vacationPeriodText.trim()) {
      onShowToast("Вкажіть період (рік) у наказі!");
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

      const calculatedNoticeDate = calculateNoticeDate(isoNakazDate);

      await generateNakazGrafikVidpustokDocx({
        fop_id: activeFop.id,
        fop_name: activeFopName,
        fop_code: activeFopCode,
        fop_address: currentAddress,
        fop_edrpou: activeFopEdrpou,
        fop_initials: activeFopInitials,
        nakaz_num: nakazNum,
        nakaz_date_str: formattedNakazDate,
        year_str: vacationPeriodText.trim(),
        period_text: vacationPeriodText.trim(),
        notice_date_str: calculatedNoticeDate,
        save_dir: targetDir || undefined,
      });

      onShowToast(`Наказ № ${nakazNum} успішно створено!`);
      await performScan();
    } catch (err: any) {
      console.error("Error generating Nakaz Grafik Vidpustok docx:", err);
      onShowToast(`Помилка генерації Наказу: ${err?.toString() || "Невідома помилка"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedTypeObj = NAKAZ_TYPE_OPTIONS.find((t) => t.key === selectedNakazType) || NAKAZ_TYPE_OPTIONS[0];

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
      <div className="bg-[#133b47] rounded-[24px] px-6 py-4.5 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        {/* LEFT SECTION: BACK BUTTON & TITLE */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-[#f8a44c] flex items-center justify-center transition-all cursor-pointer shrink-0 border-2 border-white/20 shadow-md hover:scale-105"
            title="Назад до вибору документів"
          >
            <ArrowLeftIcon className="w-6 h-6 stroke-[2.8]" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#f8a44c] text-[#133b47] flex items-center justify-center font-black shadow-lg shrink-0">
              <DocumentTextIcon className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
                  Накази підприємства
                </h2>
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-[#f8a44c] text-[#133b47] shadow-xs">
                  {scannedFiles.length} в реєстрі
                </span>
              </div>
              <span className="text-xs text-[#c3d9d6] font-bold mt-0.5">
                Генератор кадрових наказів підприємця
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: ACTIVE FOP CARD WITH INTEGRATED EDIT BUTTON */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
          {activeFop ? (
            <button
              type="button"
              onClick={() => {
                if (onEditFop) {
                  onEditFop(activeFop);
                } else {
                  handleOpenEditFopModalAnytime();
                }
              }}
              className="bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-[#f8a44c]/60 rounded-2xl px-4 py-2 flex items-center gap-3 transition-all cursor-pointer shadow-md group"
              title="Натисніть, щоб редагувати дані ФОП"
            >
              <div className="w-9 h-9 rounded-xl bg-[#f8a44c] text-[#133b47] flex items-center justify-center font-black shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <UserIcon className="w-5 h-5 stroke-[2.8]" />
              </div>

              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#c3d9d6] leading-none">
                  Активний ФОП
                </span>
                <span className="text-sm font-black text-white group-hover:text-[#f8a44c] transition-colors leading-snug mt-0.5 truncate max-w-[220px] sm:max-w-xs">
                  {activeFopName}
                </span>
              </div>

              <div className="w-8 h-8 rounded-xl bg-white/10 text-[#f8a44c] group-hover:bg-[#f8a44c] group-hover:text-[#133b47] flex items-center justify-center transition-all shrink-0 ml-1">
                <PencilSquareIcon className="w-4 h-4 stroke-[2.8]" />
              </div>
            </button>
          ) : (
            <span className="text-xs font-bold text-[#c3d9d6] italic bg-white/10 px-4 py-2 rounded-xl">
              Оберіть ФОП у верхньому меню
            </span>
          )}
        </div>
      </div>

      {/* 2. ERGONOMIC TOOLBAR: LARGE DESIGNER DROPDOWNS & NAKAZ NUMBER (ONLY IN WORKSPACE MODE) */}
      {selectedNakazType !== null && (
        <div className="bg-white rounded-[24px] p-5 border-2 border-[#cbd8d6] shadow-md flex flex-col lg:flex-row items-center justify-between gap-5 relative z-10 animate-fadeIn">
          {/* NAKAZ TYPE PICKER & HUB TOGGLE */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* ALL DECREES HUB BUTTON */}
            <button
              type="button"
              onClick={() => setSelectedNakazType(null)}
              className="h-13 px-4 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 border-2 cursor-pointer bg-[#133b47]/10 hover:bg-[#133b47] text-[#133b47] hover:text-[#f8a44c] border-[#133b47]/20 shadow-xs"
              title="Повернутися до вибору типу наказу"
            >
              <Squares2X2Icon className="w-5 h-5 stroke-[2.5]" />
              <span className="hidden sm:inline">Всі накази</span>
            </button>

            {/* CREATIVE CUSTOM DROPDOWN SELECTOR */}
            <div className="relative w-full sm:w-96" ref={typeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsTypeDropdownOpen((prev) => !prev)}
                className="w-full h-13 px-4 rounded-2xl bg-white border-2 border-[#cbd8d6] hover:border-[#133b47] text-[#133b47] text-sm font-black focus:outline-none transition-all duration-200 flex items-center justify-between shadow-xs cursor-pointer hover:shadow-md"
              >
                <div className="flex items-center gap-3 truncate">
                  {selectedTypeObj && (
                    <div className={`w-8 h-8 rounded-xl ${selectedTypeObj.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
                      <selectedTypeObj.icon className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  )}
                  <span className="truncate text-sm font-black text-[#133b47]">{selectedTypeObj ? selectedTypeObj.label : "Оберіть тип Наказу"}</span>
                </div>
                <ChevronDownIcon
                  className={`w-5 h-5 text-[#133b47] shrink-0 transition-transform duration-300 stroke-[2.5] ${
                    isTypeDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* TYPE DROPDOWN POPUP MENU */}
              {isTypeDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full sm:w-96 bg-white/98 backdrop-blur-md rounded-2xl border-2 border-[#cbd8d6] shadow-2xl overflow-hidden z-20 animate-modalScale p-2 flex flex-col gap-1">
                  {NAKAZ_TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = opt.key === selectedNakazType;
                    return (
                      <div
                        key={opt.key}
                        onClick={() => {
                          if (opt.active) {
                            setSelectedNakazType(opt.key);
                            setIsTypeDropdownOpen(false);
                          }
                        }}
                        className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-[#133b47] text-white shadow-sm font-black scale-[1.01]"
                            : "hover:bg-[#f4f9f8] text-[#133b47]"
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                            isSelected ? "bg-white/20 text-white" : opt.iconBg
                          }`}>
                            <Icon className="w-5 h-5 stroke-[2.5]" />
                          </div>
                          <span className={`text-sm font-black truncate ${isSelected ? "text-white" : "text-[#133b47]"}`}>
                            {opt.label}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                            <CheckIcon className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
      )}

      {/* 3. MAIN WORKSPACE / DECREE SELECTION HUB */}
      {selectedNakazType === null ? (
        <div className="flex flex-col gap-6 animate-fadeIn z-10">
          {/* HUB HERO HEADER */}
          <div className="bg-gradient-to-r from-[#133b47] via-[#1a4a58] to-[#133b47] rounded-[28px] p-7 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-white/10 relative overflow-hidden">
            <div className="flex items-center gap-5 z-10">
              <div className="w-16 h-16 rounded-2xl bg-[#f8a44c] text-[#133b47] flex items-center justify-center font-black shadow-lg shrink-0">
                <Squares2X2Icon className="w-9 h-9 stroke-[2.2]" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                    Оберіть тип Наказу
                  </h2>
                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#f8a44c] text-[#133b47] shadow-xs">
                    6 категорій
                  </span>
                </div>
                <p className="text-sm text-[#c3d9d6] font-bold">
                  Виберіть потрібний кадровий наказ для створення та друку (.docx)
                </p>
              </div>
            </div>
          </div>

          {/* 6-CARD SELECTION GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {NAKAZ_TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSelectedNakazType(opt.key)}
                  className={`p-6 rounded-[28px] border-2 border-[#cbd8d6] bg-gradient-to-br ${opt.cardBg} ${opt.cardBorder} shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between gap-5 text-left group hover:-translate-y-1 relative overflow-hidden`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${opt.iconBg} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 stroke-[2.2]" />
                    </div>
                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border shadow-2xs ${opt.badgeClass}`}>
                      {opt.badge}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-lg font-black text-[#133b47] group-hover:text-[#0f2e38] transition-colors leading-snug">
                      {opt.label}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {opt.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs font-black">
                    <span className={`transition-colors ${opt.actionText}`}>Створити наказ</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:translate-x-1.5 transition-all duration-300 shadow-md ${opt.actionArrowBg}`}>
                      <ArrowRightIcon className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* HISTORY SECTION IN HUB VIEW */}
          <div className="bg-white rounded-[24px] p-6 border-2 border-[#cbd8d6] shadow-sm flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between border-b-2 border-[#cbd8d6] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center font-black shadow-xs">
                  <ClockIcon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#133b47]">
                    Історія створених наказів ФОП
                  </h3>
                  <span className="text-xs text-[#556e75] font-bold">
                    Збережені кадрові документи у папці підприємства
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={performScan}
                  className="p-2.5 rounded-xl bg-[#f4f9f8] hover:bg-[#133b47] text-[#133b47] hover:text-[#f8a44c] transition-all cursor-pointer border border-[#cbd8d6] flex items-center justify-center shadow-xs"
                  title="Оновити список наказів"
                >
                  <ArrowPathIcon className={`w-4 h-4 stroke-[2.8] ${isScanning ? "animate-spin" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (rootFolder && activeFop) {
                      const fopDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
                      if (fopDir) {
                        await openFolderInExplorer(`${fopDir}\\кадрові документи`);
                      }
                    }
                  }}
                  className="p-2.5 rounded-xl bg-[#f4f9f8] hover:bg-[#133b47] text-[#133b47] hover:text-[#f8a44c] transition-all cursor-pointer border border-[#cbd8d6] flex items-center justify-center shadow-xs"
                  title="Відкрити папку «кадрові документи» у Провіднику"
                >
                  <FolderOpenIcon className="w-4 h-4 stroke-[2.8]" />
                </button>
              </div>
            </div>

            {/* HISTORY CARDS LIST IN HUB */}
            {filteredHistoryFiles.length === 0 ? (
              <div className="p-8 text-center text-[#556e75] flex flex-col items-center justify-center gap-2 bg-[#fafdfc] rounded-2xl border-2 border-dashed border-[#cbd8d6]">
                <DocumentTextIcon className="w-10 h-10 stroke-[1.8] text-slate-400" />
                <p className="text-sm font-black text-[#133b47]">Історія наказів порожня</p>
                <p className="text-xs text-[#556e75] font-bold">
                  Створіть свій перший наказ вище або завантажте згенеровані файли.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredHistoryFiles.map((item, idx) => {
                  const category = detectNakazCategory(item.filename);
                  const { nakazLabel, formattedTitle } = formatNakazHistoryItem(item.filename);
                  const IconComp = category.IconComponent;

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
                      className="p-4 rounded-2xl border-2 border-[#cbd8d6] hover:border-[#133b47] bg-white hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group"
                      title="Натисніть, щоб відкрити цей наказ у Word"
                    >
                      <div className="flex items-center gap-3.5 overflow-hidden">
                        <div className={`w-11 h-11 rounded-xl ${category.iconBg} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                          <IconComp className="w-6 h-6 stroke-[2.5]" />
                        </div>

                        <div className="flex flex-col truncate">
                          <div className="flex items-center gap-2 truncate">
                            <span className={`text-xs font-black px-2.5 py-0.5 rounded-md shrink-0 shadow-2xs ${category.numBadgeClass}`}>
                              {nakazLabel}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${category.badgeClass}`}>
                              {category.badge}
                            </span>
                          </div>
                          <span className="text-sm font-black text-[#133b47] group-hover:text-[#0f2e38] truncate mt-1">
                            {formattedTitle}
                          </span>
                          {item.date_modified && (
                            <span className="text-[11px] font-bold text-[#556e75]">
                              {item.date_modified}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-[#133b47] group-hover:text-[#f8a44c] flex items-center justify-center transition-all shrink-0">
                        <DocumentTextIcon className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MAIN TWO-COLUMN WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
          {/* LEFT COLUMN: WORKER EDIT CARD & HISTORY REGISTRY (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* 1. SHTAT DECREE PARAMETERS CARD */}
            {selectedNakazType === "grafik_vidpustok" ? (
              <div className="bg-white rounded-[24px] p-6 border-2 border-[#cbd8d6] shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b-2 border-[#cbd8d6] pb-3">
                  <span className="text-sm font-black uppercase tracking-wider text-[#133b47] flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.5]" />
                    Параметри графіка відпусток
                  </span>
                </div>

                {/* CUSTOM STYLED DATE OF DECREE PICKER */}
                <CustomDatePicker
                  label="Дата наказу:"
                  value={isoNakazDate}
                  onChange={setIsoNakazDate}
                />

                {/* VACATION PERIOD INPUT / YEAR SELECTOR */}
              <div className="flex flex-col gap-2 pt-2 border-t-2 border-[#cbd8d6]/60">
                <label className="text-xs font-black uppercase text-[#133b47] tracking-wide flex items-center gap-1.5">
                  <PencilSquareIcon className="w-4 h-4 text-[#f8a44c] stroke-[2.5]" />
                  Період відпусток (рік або періоди):
                </label>
                <input
                  type="text"
                  value={vacationPeriodText}
                  onChange={(e) => setVacationPeriodText(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border-2 border-[#cbd8d6] focus:border-[#133b47] focus:ring-2 focus:ring-[#133b47]/10 focus:outline-none text-sm font-black text-[#133b47] bg-[#fafdfc]"
                  placeholder="напр. 2026 рік або 2026-2027 роки"
                />
              </div>
            </div>
          ) : selectedNakazType === "shtat" ? (
            <div className="bg-white rounded-[24px] p-6 border-2 border-[#cbd8d6] shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b-2 border-[#cbd8d6] pb-3.5">
                <span className="text-sm font-black uppercase tracking-wider text-[#133b47] flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.8]" />
                  Параметри наказу про штат
                </span>
              </div>

              {/* CUSTOM STYLED DATE OF DECREE PICKER */}
              <CustomDatePicker
                label="Дата введення штату:"
                value={isoNakazDate}
                onChange={setIsoNakazDate}
              />

              {/* REASON PRESETS CARDS */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-black uppercase text-[#133b47] tracking-wider">
                  Оберіть формулювання підстави:
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShtatReasonText("У зв’язку із збільшенням розмірів оплати праці:");
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer select-none ${
                      shtatReasonText.trim() === "У зв’язку із збільшенням розмірів оплати праці:"
                        ? "bg-gradient-to-r from-[#133b47] to-[#1c5567] text-white border-[#133b47] shadow-md scale-[1.01]"
                        : "bg-slate-50 hover:bg-white text-[#133b47] border-slate-200 hover:border-[#cbd8d6]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl font-black flex items-center justify-center shrink-0 ${
                          shtatReasonText.trim() === "У зв’язку із збільшенням розмірів оплати праці:"
                            ? "bg-[#f8a44c] text-[#133b47]"
                            : "bg-[#133b47]/10 text-[#133b47]"
                        }`}
                      >
                        <ArrowTrendingUpIcon className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className="text-xs font-black leading-tight">Збільшення розмірів оплати праці</span>
                    </div>

                    {shtatReasonText.trim() === "У зв’язку із збільшенням розмірів оплати праці:" && (
                      <CheckIcon className="w-5 h-5 text-[#f8a44c] stroke-[3] shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShtatReasonText("У зв’язку з необхідністю розширення штату прийняттям працівника:");
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer select-none ${
                      shtatReasonText.trim() === "У зв’язку з необхідністю розширення штату прийняттям працівника:"
                        ? "bg-gradient-to-r from-[#133b47] to-[#1c5567] text-white border-[#133b47] shadow-md scale-[1.01]"
                        : "bg-slate-50 hover:bg-white text-[#133b47] border-slate-200 hover:border-[#cbd8d6]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl font-black flex items-center justify-center shrink-0 ${
                          shtatReasonText.trim() === "У зв’язку з необхідністю розширення штату прийняттям працівника:"
                            ? "bg-[#f8a44c] text-[#133b47]"
                            : "bg-[#133b47]/10 text-[#133b47]"
                        }`}
                      >
                        <UserPlusIcon className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className="text-xs font-black leading-tight">Розширення штату (прийняття працівника)</span>
                    </div>

                    {shtatReasonText.trim() === "У зв’язку з необхідністю розширення штату прийняттям працівника:" && (
                      <CheckIcon className="w-5 h-5 text-[#f8a44c] stroke-[3] shrink-0" />
                    )}
                  </button>
                </div>

                {/* EDITABLE TEXT AREA CONTAINER */}
                <div className="flex flex-col gap-2 mt-2 pt-3 border-t-2 border-[#cbd8d6]/60">
                  <label className="text-xs font-black text-[#133b47] flex items-center gap-1.5">
                    <PencilSquareIcon className="w-4 h-4 text-[#f8a44c] stroke-[2.5]" />
                    Текст підстави у наказі:
                  </label>

                  <textarea
                    rows={3}
                    value={shtatReasonText}
                    onChange={(e) => setShtatReasonText(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border-2 border-[#cbd8d6] focus:border-[#133b47] focus:ring-2 focus:ring-[#133b47]/10 focus:outline-none text-xs font-medium text-slate-800 bg-[#fafdfc] leading-relaxed transition-all shadow-inner"
                    placeholder="Введіть текст підстави..."
                  />
                </div>
              </div>
            </div>
          ) : selectedNakazType === "kasa" || selectedNakazType === "prro" ? (
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
          ) : selectedNakazType === "priyom" ? (
            <div className="bg-white rounded-[24px] p-6 border-2 border-[#cbd8d6] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b-2 border-[#cbd8d6] pb-3">
                <span className="text-sm font-black uppercase tracking-wider text-[#133b47] flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.8]" />
                  Працівники для прийняття
                </span>
                {activeFop && activeFop.munkasok && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#133b47] text-[#f8a44c] shadow-xs">
                    {selectedPriyomWorkerIds.length} / {activeFop.munkasok.length} обрано
                  </span>
                )}
              </div>

              {/* CUSTOM STYLED DATE OF DECREE PICKER */}
              <CustomDatePicker
                label="Дата наказу:"
                value={isoNakazDate}
                onChange={setIsoNakazDate}
              />

              {priyomTargetDate && (
                <div className="bg-[#f0f7f6] p-3 rounded-2xl border border-[#cbd8d6] flex items-center justify-between gap-2 text-xs font-black text-[#133b47]">
                  <span>Фіксація дати прийняття:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#133b47] text-[#f8a44c]">
                    {formatDotDateWithZeros(priyomTargetDate)}
                  </span>
                </div>
              )}

              {/* WORKERS MULTI-SELECT CHECKLIST FOR PRIYOM */}
              {activeFop && activeFop.munkasok && activeFop.munkasok.length > 0 ? (
                <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {activeFop.munkasok.map((w) => {
                    const isChecked = selectedPriyomWorkerIds.includes(w.id);
                    const wDate = w.munkakezdes_datum || "";
                    const isMatch = priyomTargetDate === null || wDate === priyomTargetDate;
                    const isDisabled = !isChecked && !isMatch;
                    const fullName = [w.vezeteknev, w.keresztnev, w.apai_nev].filter(Boolean).join(" ");
                    const initial = w.vezeteknev ? w.vezeteknev.charAt(0).toUpperCase() : "?";
                    const empTag = !w.foallas ? " (сумісництво)" : !w.teljes_munkaido ? " (неповний час)" : " (основне)";

                    return (
                      <div
                        key={w.id}
                        onClick={() => handleTogglePriyomWorker(w)}
                        className={`p-3.5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-3.5 cursor-pointer select-none ${
                          isChecked
                            ? "bg-gradient-to-r from-[#fafdfc] to-[#f0f7f6] border-[#133b47] shadow-md ring-2 ring-[#133b47]/10"
                            : isDisabled
                            ? "bg-slate-100/70 border-slate-200 opacity-50 cursor-not-allowed"
                            : "bg-slate-50 border-slate-200 hover:border-[#cbd8d6] hover:bg-white"
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
                            <span className={`text-sm font-black truncate leading-snug ${isChecked ? "text-[#133b47]" : "text-slate-700"}`}>
                              {fullName}
                            </span>
                            <span className="text-[11px] font-bold text-[#556e75] truncate mt-0.5">
                              {wDate ? `Прийнято: ${formatDotDateWithZeros(wDate)}${empTag}` : `Дата не вказана${empTag}`}
                            </span>
                          </div>
                        </div>

                        {isDisabled ? (
                          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                            Інша дата
                          </span>
                        ) : (
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                              isChecked ? "bg-[#133b47] text-[#f8a44c] shadow-xs" : "border-2 border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                          </div>
                        )}
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
          ) : (
            <div className="bg-white rounded-[24px] p-6 border-2 border-[#cbd8d6] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b-2 border-[#cbd8d6] pb-3">
                <span className="text-sm font-black uppercase tracking-wider text-[#133b47] flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#f8a44c] stroke-[2.8]" />
                  Працівники для звільнення
                </span>
                {activeFop && activeFop.munkasok && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#133b47] text-[#f8a44c] shadow-xs">
                    {selectedZvilnennyaWorkerIds.length} / {activeFop.munkasok.filter((w) => w.munkaviszony_vege && w.munkaviszony_vege.trim().length > 0).length} обрано
                  </span>
                )}
              </div>

              {/* CUSTOM STYLED DATE OF DECREE PICKER */}
              <CustomDatePicker
                label="Дата наказу:"
                value={isoNakazDate}
                onChange={setIsoNakazDate}
              />

              {zvilnennyaTargetDate && (
                <div className="bg-[#f0f7f6] p-3 rounded-2xl border border-[#cbd8d6] flex items-center justify-between gap-2 text-xs font-black text-[#133b47]">
                  <span>Фіксація дати звільнення:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#133b47] text-[#f8a44c]">
                    {formatDotDateWithZeros(zvilnennyaTargetDate)}
                  </span>
                </div>
              )}

              {/* WORKERS MULTI-SELECT CHECKLIST FOR ZVILNENNYA */}
              {activeFop && activeFop.munkasok && activeFop.munkasok.length > 0 ? (
                <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {activeFop.munkasok.map((w) => {
                    const isChecked = selectedZvilnennyaWorkerIds.includes(w.id);
                    const wDate = w.munkaviszony_vege || "";
                    const hasVege = wDate.trim().length > 0;
                    const isMatch = zvilnennyaTargetDate === null || wDate === zvilnennyaTargetDate;
                    const isDisabled = !hasVege || (!isChecked && !isMatch);
                    const fullName = [w.vezeteknev, w.keresztnev, w.apai_nev].filter(Boolean).join(" ");
                    const initial = w.vezeteknev ? w.vezeteknev.charAt(0).toUpperCase() : "?";

                    return (
                      <div
                        key={w.id}
                        onClick={() => handleToggleZvilnennyaWorker(w)}
                        className={`p-3.5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-3.5 cursor-pointer select-none ${
                          isChecked
                            ? "bg-gradient-to-r from-[#fafdfc] to-[#f0f7f6] border-[#133b47] shadow-md ring-2 ring-[#133b47]/10"
                            : isDisabled
                            ? "bg-slate-100/70 border-slate-200 opacity-50 cursor-not-allowed"
                            : "bg-slate-50 border-slate-200 hover:border-[#cbd8d6] hover:bg-white"
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
                            <span className={`text-sm font-black truncate leading-snug ${isChecked ? "text-[#133b47]" : "text-slate-700"}`}>
                              {fullName}
                            </span>
                            <span className="text-[11px] font-bold text-[#556e75] truncate mt-0.5">
                              {hasVege ? `Дата звільнення: ${formatDotDateWithZeros(wDate)}` : "Працює (немає дати звільнення)"}
                            </span>
                          </div>
                        </div>

                        {isDisabled ? (
                          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                            {!hasVege ? "Працює" : "Інша дата"}
                          </span>
                        ) : (
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                              isChecked ? "bg-[#133b47] text-[#f8a44c] shadow-xs" : "border-2 border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                          </div>
                        )}
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

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={performScan}
                  className="p-2 rounded-xl bg-[#f4f9f8] hover:bg-[#133b47] text-[#133b47] hover:text-[#f8a44c] transition-all cursor-pointer border border-[#cbd8d6] flex items-center justify-center shadow-xs"
                  title="Оновити список наказів"
                >
                  <ArrowPathIcon className={`w-4 h-4 stroke-[2.8] ${isScanning ? "animate-spin" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (rootFolder && activeFop) {
                      const fopDir = await ensureFopDirectory(rootFolder, activeFopCode, activeFopName);
                      if (fopDir) {
                        await openFolderInExplorer(`${fopDir}\\кадрові документи`);
                      }
                    }
                  }}
                  className="p-2 rounded-xl bg-[#f4f9f8] hover:bg-[#133b47] text-[#133b47] hover:text-[#f8a44c] transition-all cursor-pointer border border-[#cbd8d6] flex items-center justify-center shadow-xs"
                  title="Відкрити папку «кадрові документи» у Провіднику"
                >
                  <FolderOpenIcon className="w-4 h-4 stroke-[2.8]" />
                </button>
              </div>
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
                  const category = detectNakazCategory(item.filename);
                  const { nakazLabel, formattedTitle } = formatNakazHistoryItem(item.filename);
                  const IconComp = category.IconComponent;

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
                      className="p-3.5 rounded-2xl border-2 border-[#cbd8d6] hover:border-[#133b47] bg-white hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group"
                      title="Натисніть, щоб відкрити цей наказ у Word"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-10 h-10 rounded-xl ${category.iconBg} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                          <IconComp className="w-5 h-5 stroke-[2.5]" />
                        </div>

                        <div className="flex flex-col truncate">
                          <div className="flex items-center gap-2 truncate">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-md shrink-0 shadow-2xs ${category.numBadgeClass}`}>
                              {nakazLabel}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${category.badgeClass}`}>
                              {category.badge}
                            </span>
                          </div>
                          <span className="text-sm font-black text-[#133b47] group-hover:text-[#0f2e38] truncate mt-1">
                            {formattedTitle}
                          </span>
                          {item.date_modified && (
                            <span className="text-[11px] font-bold text-[#556e75]">
                              {item.date_modified}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-[#133b47] group-hover:text-[#f8a44c] flex items-center justify-center transition-all shrink-0">
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
                <p className="text-sm font-black">Фізична особа-підприємець</p>
                <p className="uppercase text-sm font-black text-[#133b47]">{activeFopName ? activeFopName.toUpperCase() : "ГАЛ ФЕРЕНЦ ФЕРЕНЦОВИЧ"}</p>
                {hasValidFopAddress ? (
                  normalizeAddressHeader(currentAddress).split("\n").map((line, idx) => (
                    <p key={idx} className="uppercase font-normal text-xs md:text-sm text-slate-700">{line.trim().toUpperCase()}</p>
                  ))
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

              {selectedNakazType === "grafik_vidpustok" ? (
                <>
                  <p className="font-bold text-xs md:text-sm mt-1 mb-6 uppercase text-center font-black">
                    ПРО ЗАТВЕРДЖЕННЯ ГРАФІКУ ВІДПУСТОК
                  </p>

                  <div className="flex flex-col gap-2 mt-4 text-justify leading-relaxed">
                    <p className="font-medium text-slate-900 mb-2">
                      Керуючись статтею 10 Закону України «Про відпустки» від 15.11.1996 р. №504/96 ВР
                    </p>
                    <p className="font-bold text-center my-4">НАКАЗУЮ:</p>
                    <p className="font-medium mt-2">
                      <span className="font-bold">1. </span>Затвердити  графік відпусток на <span className="font-bold">{vacationPeriodText}</span> (графік додається):
                    </p>
                    <p className="font-medium">
                      <span className="font-bold">2. </span>Організувати персональне ознайомлення працівників ФОПа під особистий підпис із графіком відпусток до <span className="font-bold">{calculateNoticeDate(isoNakazDate)} р.</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 mt-12 pt-4 border-t-2 border-slate-300 text-xs md:text-sm">
                    <div className="grid grid-cols-2 gap-4 items-center mt-3 font-bold">
                      <span>ФОП {activeFopInitials || "Гал Ф.Ф."}</span>
                      <span className="text-right">___________________</span>
                    </div>
                  </div>
                </>
              ) : selectedNakazType === "shtat" ? (
                <>
                  <p className="font-bold text-xs md:text-sm mt-1 mb-6 uppercase text-center font-black">
                    ПРО ЗАТВЕРДЖЕННЯ ШТАТНОГО РОЗПИСУ
                  </p>

                  <div className="flex flex-col gap-1 mt-3 text-justify leading-relaxed">
                    <p className="font-medium text-slate-900 mb-2">{shtatReasonText}</p>
                    <p className="font-bold text-center my-4">НАКАЗУЮ:</p>
                    <p className="font-medium mt-2">
                      <span className="font-bold">1. </span>Затвердити і ввести в дію з{" "}
                      <span className="font-bold">
                        {(() => {
                          const ukrMonths = [
                            "січня", "лютого", "березня", "квітня", "травня", "червня",
                            "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
                          ];
                          if (isoNakazDate) {
                            const parts = isoNakazDate.split("-");
                            if (parts.length === 3) {
                              const y = parseInt(parts[0], 10);
                              const m = parseInt(parts[1], 10) - 1;
                              const d = parseInt(parts[2], 10);
                              if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                                const dayStr = d < 10 ? `0${d}` : `${d}`;
                                const monthStr = ukrMonths[m] || "січня";
                                return `${dayStr} ${monthStr} ${y}`;
                              }
                            }
                          }
                          return "01 січня 2026";
                        })()} р.
                      </span>{" "}
                      штатний розпис.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 mt-8 pt-4 border-t-2 border-slate-300 text-xs md:text-sm">
                    <div className="grid grid-cols-2 gap-4 items-center mt-3 font-bold">
                      <span>ФОП {activeFopInitials || "Гал Ф.Ф."}</span>
                      <span className="text-right">___________________</span>
                    </div>
                  </div>
                </>
              ) : selectedNakazType === "prro" ? (
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
                            <p key={w.id} className="pl-6 font-medium flex items-start gap-2">
                              <span className="text-[10px] font-mono leading-relaxed">o</span>
                              <span><span className="font-bold">{dativeName}</span>, посада: {posName}{punct}</span>
                            </p>
                          );
                        })
                    ) : (
                      <p className="italic text-rose-600 pl-6 font-bold">
                        [Оберіть працівників зі списку ліворуч]
                      </p>
                    )}

                    <p className="font-bold">2. Надати зазначеним особам право:</p>
                    <div className="pl-6 space-y-0">
                      <p className="flex items-start gap-2"><span className="text-[10px] font-mono leading-relaxed">o</span><span>відкривати/закривати зміну у ПРРО;</span></p>
                      <p className="flex items-start gap-2"><span className="text-[10px] font-mono leading-relaxed">o</span><span>здійснювати реєстрацію розрахункових операцій;</span></p>
                      <p className="flex items-start gap-2"><span className="text-[10px] font-mono leading-relaxed">o</span><span>оформлювати фіскальні чеки на продаж та повернення товарів;</span></p>
                      <p className="flex items-start gap-2"><span className="text-[10px] font-mono leading-relaxed">o</span><span>формувати щоденні Z-звіти відповідно до вимог законодавства.</span></p>
                    </div>

                    <p className="font-bold">3. Покласти на касирів відповідальність за:</p>
                    <div className="pl-6 space-y-0">
                      <p className="flex items-start gap-2"><span className="text-[10px] font-mono leading-relaxed">o</span><span>дотримання порядку застосування ПРРО;</span></p>
                      <p className="flex items-start gap-2"><span className="text-[10px] font-mono leading-relaxed">o</span><span>правильність обліку розрахункових операцій;</span></p>
                      <p className="flex items-start gap-2"><span className="text-[10px] font-mono leading-relaxed">o</span><span>ведення касової дисципліни;</span></p>
                      <p className="flex items-start gap-2"><span className="text-[10px] font-mono leading-relaxed">o</span><span>збереження фіскальних звітів, чеків та іншої документації.</span></p>
                    </div>

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
              ) : selectedNakazType === "zvilnennya" ? (
                <>
                  <p className="font-black text-sm md:text-base mt-1 uppercase text-center text-[#133b47] tracking-wide">
                    ПРО ЗВІЛЬНЕННЯ З РОБОТИ
                  </p>
                  <p className="font-bold mt-2 text-slate-800">
                    Наказую:
                  </p>

                  <div className="flex flex-col gap-3 mt-3 text-justify leading-relaxed">
                    {(() => {
                      const selectedWorkers = (activeFop?.munkasok || []).filter((w) => selectedZvilnennyaWorkerIds.includes(w.id));
                      if (selectedWorkers.length === 0) {
                        return (
                          <p className="italic text-rose-600 font-bold">
                            [Оберіть працівників для звільнення зі списку ліворуч]
                          </p>
                        );
                      }
                      const disDate = zvilnennyaTargetDate ? formatDotDateWithZeros(zvilnennyaTargetDate) : formattedNakazDate;

                      if (selectedWorkers.length === 1) {
                        const w = selectedWorkers[0];
                        const acc = getWorkerAccusativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
                        const init = getWorkerInitials(w.vezeteknev, w.keresztnev, w.apai_nev);
                        const pos = declinePositionGenitive(w.foglalkozas_megnevezes || "працівник");

                        return (
                          <>
                            <p>
                              1. <span className="font-bold">{acc}</span>, звільнити за угодою сторін, з посади <span className="font-bold">{pos}</span> від {disDate} р. відповідно до ст. 36 КЗпП України.
                            </p>
                            <p>
                              2. Провести остаточний розрахунок з {init} та виплатити компенсацію за всі дні невикористаної відпустки.
                            </p>
                            <p className="pl-6">Підстава: заява {init}</p>
                          </>
                        );
                      }

                      return (
                        <>
                          <p>
                            1. Звільнити з роботи від {disDate} р. наступних працівників:
                          </p>
                          {selectedWorkers.map((w, idx) => {
                            const acc = getWorkerAccusativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
                            const pos = declinePositionGenitive(w.foglalkozas_megnevezes || "працівник");
                            return (
                              <p key={w.id} className="pl-6 font-medium">
                                1.{idx + 1}. <span className="font-bold">{acc}</span>, звільнити за угодою сторін, з посади <span className="font-bold">{pos}</span> відповідно до ст. 36 КЗпП України.
                              </p>
                            );
                          })}
                          <p>
                            2. Провести остаточний розрахунок з працівниками та виплатити компенсацію за всі дні невикористаної відпустки.
                          </p>
                          <p className="pl-6">Підстава: заяви працівників</p>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col gap-2 mt-5 pt-4 border-t-2 border-slate-300 text-xs md:text-sm">
                    <div className="grid grid-cols-2 gap-4 items-center mt-1 font-bold">
                      <span>ФОП {activeFopInitials || "Гал Ф.Ф."}</span>
                      <span className="text-right">___________________</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-bold text-xs md:text-sm mt-1 uppercase text-center font-black">
                    ПРО ПРИЙНЯТТЯ НА РОБОТУ
                  </p>

                  <div className="flex flex-col gap-3 mt-3 text-justify leading-relaxed">
                    {(() => {
                      const selectedWorkers = (activeFop?.munkasok || []).filter((w) => selectedPriyomWorkerIds.includes(w.id));
                      if (selectedWorkers.length === 0) {
                        return (
                          <p className="italic text-rose-600 font-bold">
                            [Оберіть працівників для прийняття зі списку ліворуч]
                          </p>
                        );
                      }
                      const startDate = priyomTargetDate ? formatDotDateWithZeros(priyomTargetDate) : formattedWorkStartDate;

                      if (selectedWorkers.length === 1) {
                        const w = selectedWorkers[0];
                        const acc = getWorkerAccusativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
                        const dat = getWorkerDativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
                        const init = getWorkerInitials(w.vezeteknev, w.keresztnev, w.apai_nev);
                        const pos = declinePositionGenitive(w.foglalkozas_megnevezes || "працівник");
                        const sal = w.fizetes
                          ? `${w.fizetes.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн.`
                          : salaryStr;

                        const empTypeStr = !w.foallas ? " за сумісництвом" : !w.teljes_munkaido ? " на неповний робочий час" : "";

                        return (
                          <>
                            <p>
                              1. Прийняти <span className="font-bold">{acc}</span> на посаду <span className="font-bold">{pos}</span>{empTypeStr} з посадовим окладом в сумі <span className="font-bold">{sal}</span> на місяць.
                            </p>
                            <p>
                              2. Оформити трудовий договір з {dat}, в якому зазначити умови праці.
                            </p>
                            <p>
                              3. {init} приступити до роботи з {startDate} р.
                            </p>
                            <p className="pl-6">Підстава: заява {init}</p>
                          </>
                        );
                      }

                      return (
                        <>
                          <p>
                            1. Прийняти на роботу з {startDate} р. наступних працівників:
                          </p>
                          {selectedWorkers.map((w, idx) => {
                            const acc = getWorkerAccusativeName(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem);
                            const pos = declinePositionGenitive(w.foglalkozas_megnevezes || "працівник");
                            const sal = w.fizetes
                              ? `${w.fizetes.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн.`
                              : salaryStr;
                            const empTypeStr = !w.foallas ? " за сумісництвом" : !w.teljes_munkaido ? " на неповний робочий час" : "";
                            return (
                              <p key={w.id} className="pl-6 font-medium">
                                1.{idx + 1}. <span className="font-bold">{acc}</span> на посаду <span className="font-bold">{pos}</span>{empTypeStr} з посадовим окладом в сумі <span className="font-bold">{sal}</span> на місяць.
                              </p>
                            );
                          })}
                          <p>
                            2. Оформити трудові договори з працівниками, в яких зазначити умови праці (режим, права і обов'язки сторін, і т.д).
                          </p>
                          <p>
                            3. Працівникам приступити до роботи з {startDate} р.
                          </p>
                          <p className="pl-6">Підстава: заяви працівників</p>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col gap-2 mt-5 pt-4 border-t-2 border-slate-300 text-xs md:text-sm">
                    <p className="font-bold mb-1">З наказом ознайомлені:</p>
                    {activeFop && activeFop.munkasok && activeFop.munkasok.filter((w) => selectedPriyomWorkerIds.includes(w.id)).length > 0 ? (
                      activeFop.munkasok
                        .filter((w) => selectedPriyomWorkerIds.includes(w.id))
                        .map((w) => {
                          const initials = getWorkerInitials(w.vezeteknev, w.keresztnev, w.apai_nev);
                          return (
                            <div key={w.id} className="grid grid-cols-2 gap-4 items-center font-bold">
                              <span>(______________)  {initials}</span>
                              <span className="text-right">«____» ____________ 2024 р.</span>
                            </div>
                          );
                        })
                    ) : (
                      <p className="italic text-slate-400 font-medium">[Підписи працівників]</p>
                    )}
                    <div className="grid grid-cols-2 gap-4 items-center mt-3 font-bold">
                      <span>ФОП {activeFopInitials || "Гал Ф.Ф."}</span>
                      <span className="text-right">___________________</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* GENERATE ACTION BUTTON */}
          <button
            onClick={
              selectedNakazType === "grafik_vidpustok"
                ? handleGenerateGrafikVidpustokDoc
                : selectedNakazType === "shtat"
                ? handleGenerateShtatDoc
                : selectedNakazType === "prro"
                ? handleGeneratePrroDoc
                : selectedNakazType === "kasa"
                ? handleGenerateKasaDoc
                : selectedNakazType === "zvilnennya"
                ? handleGenerateZvilnennyaDoc
                : handleGenerateDoc
            }
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
    )}

      {/* FOP ADDRESS EDIT & SEGMENTATION MODAL */}
      {isEditAddressModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999999] animate-fadeIn">
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

            {/* FORM INPUT FIELDS FOR ALL ADDRESS COMPONENTS */}
            <div className="grid grid-cols-2 gap-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#133b47]">Країна:</label>
                <input
                  type="text"
                  value={segmentedAddress.orszag || "Україна"}
                  onChange={(e) =>
                    setSegmentedAddress((prev) => ({ ...prev, orszag: e.target.value }))
                  }
                  placeholder="Україна"
                  className="p-3.5 rounded-xl border-2 border-[#cbd8d6] focus:border-[#133b47] focus:outline-none font-black text-[#133b47] text-base bg-[#fafdfc]"
                />
              </div>

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
                <label className="text-xs font-black text-[#133b47]">Будинок:</label>
                <input
                  type="text"
                  value={segmentedAddress.hazszam || ""}
                  onChange={(e) =>
                    setSegmentedAddress((prev) => ({ ...prev, hazszam: e.target.value }))
                  }
                  placeholder="11"
                  className="p-3.5 rounded-xl border-2 border-[#cbd8d6] focus:border-[#133b47] focus:outline-none font-black text-[#133b47] text-base bg-[#fafdfc]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#133b47]">Корпус:</label>
                <input
                  type="text"
                  value={segmentedAddress.epulet || ""}
                  onChange={(e) =>
                    setSegmentedAddress((prev) => ({ ...prev, epulet: e.target.value }))
                  }
                  placeholder="А"
                  className="p-3.5 rounded-xl border-2 border-[#cbd8d6] focus:border-[#133b47] focus:outline-none font-black text-[#133b47] text-base bg-[#fafdfc]"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-black text-[#133b47]">Квартира / Кімната:</label>
                <input
                  type="text"
                  value={segmentedAddress.lakas_szoba || ""}
                  onChange={(e) =>
                    setSegmentedAddress((prev) => ({ ...prev, lakas_szoba: e.target.value }))
                  }
                  placeholder="2"
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
