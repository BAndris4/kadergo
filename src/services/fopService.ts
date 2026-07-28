import { invoke } from "@tauri-apps/api/core";
import { FopData, CreateFopFormState, EditFopFormState, CreateWorkerFormState, EditWorkerFormState, Munkas, DiscoveredFopDto, WorkerDayOverride, GenerateZayavaPriyomDocxRequest } from "../types/fop";
import { INITIAL_FOPS } from "../constants/initialData";

const LOCAL_STORAGE_KEY = "kadergo_fops_store_v6";
const ROOT_FOLDER_STORAGE_KEY = "kadergo_root_folder_v1";
const MIN_WAGE_STORAGE_KEY = "kadergo_min_wage_v1";

export function getSavedRootFolder(): string {
  return localStorage.getItem(ROOT_FOLDER_STORAGE_KEY) || "";
}

export function saveRootFolder(folderPath: string): void {
  localStorage.setItem(ROOT_FOLDER_STORAGE_KEY, folderPath);
}

export function getSavedMinWage(): number {
  const saved = localStorage.getItem(MIN_WAGE_STORAGE_KEY);
  if (saved) {
    const val = parseFloat(saved);
    if (!isNaN(val) && val > 0) return val;
  }
  return 8647; // Значення за замовчуванням (8647 грн)
}

export function saveMinWage(val: number): void {
  localStorage.setItem(MIN_WAGE_STORAGE_KEY, String(val));
}

export async function pickRootFolder(): Promise<string | null> {
  try {
    const chosen = await invoke<string | null>("pick_folder");
    if (chosen) {
      saveRootFolder(chosen);
      return chosen;
    }
  } catch (err) {
    console.warn("Tauri pick_folder fallback:", err);
  }
  return null;
}

export async function ensureFopDirectory(rootDir: string, fopCode: string, fopName: string): Promise<string> {
  if (!rootDir.trim()) return "";
  try {
    const createdPath = await invoke<string>("ensure_fop_directory", {
      rootDir,
      fopCode: fopCode || "",
      fopName,
    });
    return createdPath;
  } catch (err) {
    console.warn("Tauri ensure_fop_directory fallback:", err);
    return "";
  }
}

export async function openFolderInExplorer(folderPath: string): Promise<void> {
  if (!folderPath.trim()) return;
  try {
    await invoke("open_folder_in_explorer", { folderPath });
  } catch (err) {
    console.warn("Tauri open_folder_in_explorer fallback:", err);
  }
}

export async function scanDiscoveredFopFolders(rootDir: string): Promise<DiscoveredFopDto[]> {
  if (!rootDir.trim()) return [];
  try {
    const result = await invoke<DiscoveredFopDto[]>("scan_fop_folders", { rootDir });
    return result || [];
  } catch (err) {
    console.warn("Tauri scan_fop_folders fallback:", err);
    return [];
  }
}

export async function importSelectedFops(items: DiscoveredFopDto[]): Promise<FopData[]> {
  try {
    const updatedList = await invoke<FopData[]>("import_selected_fops", { items });
    if (updatedList && Array.isArray(updatedList)) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
      return updatedList;
    }
  } catch (err) {
    console.warn("Tauri import_selected_fops fallback:", err);
  }
  return fetchFops();
}

export async function deleteAllFops(): Promise<void> {
  try {
    await invoke("delete_all_fops");
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.warn("Tauri delete_all_fops fallback:", err);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

export function sortFopsAlphabetically(fops: FopData[]): FopData[] {
  return [...fops].sort((a, b) => {
    const nameA = [a.vezeteknev, a.keresztnev, a.apai_nev].filter(Boolean).join(" ");
    const nameB = [b.vezeteknev, b.keresztnev, b.apai_nev].filter(Boolean).join(" ");
    return nameA.localeCompare(nameB, "uk", { sensitivity: "base" });
  });
}

export async function fetchFops(): Promise<FopData[]> {
  try {
    const dbData = await invoke<FopData[]>("get_fops");
    if (dbData && Array.isArray(dbData) && dbData.length > 0) {
      const sorted = sortFopsAlphabetically(dbData);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sorted));
      return sorted;
    }
  } catch (err) {
    console.warn("Tauri get_fops fallback to localStorage:", err);
  }

  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return sortFopsAlphabetically(parsed);
    } catch (e) {
      console.error("Failed to parse localStorage FOPs:", e);
    }
  }

  return INITIAL_FOPS;
}

export async function reseedDatabase(): Promise<FopData[]> {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  try {
    const dbData = await invoke<FopData[]>("reseed_db");
    if (dbData && Array.isArray(dbData)) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbData));
      return dbData;
    }
  } catch (err) {
    console.warn("Tauri reseed_db fallback to INITIAL_FOPS:", err);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_FOPS));
  return INITIAL_FOPS;
}

export async function createFop(formData: CreateFopFormState, existingFops: FopData[]): Promise<FopData> {
  const inputData = {
    kod: formData.kod.trim() || undefined,
    vezeteknev: formData.vezeteknev.trim(),
    keresztnev: formData.keresztnev.trim(),
    apai_nev: formData.apai_nev.trim(),
    szuletesi_datum: formData.szuletesi_datum || undefined,
    nem: formData.nem.trim() || undefined,
    fop_kod: formData.fop_kod.trim() || undefined,
    fop_kezdete_datum: formData.fop_kezdete_datum || undefined,
    cim: {
      iranyitoszam: formData.iranyitoszam.trim() || undefined,
      megye: formData.megye.trim() || undefined,
      jaras: formData.jaras.trim() || undefined,
      kozseg: formData.kozseg.trim() || undefined,
      utca: formData.utca.trim() || undefined,
      hazszam: formData.hazszam.trim() || undefined,
      epulet: formData.epulet.trim() || undefined,
      lakas_szoba: formData.lakas_szoba.trim() || undefined,
      orszag: formData.orszag.trim() || "Україна",
    },
    okmany: formData.okmanyszam.trim()
      ? {
          tipus: formData.okmany_tipus,
          szeria: formData.okmany_tipus === 0 ? formData.szeria.trim() || undefined : undefined,
          okmanyszam: formData.okmanyszam.trim(),
          kiallitott_hatosag: formData.okmany_tipus === 0 ? formData.kiallitott_hatosag.trim() || undefined : undefined,
          hatosagi_kod: formData.okmany_tipus === 1 ? formData.hatosagi_kod.trim() || undefined : undefined,
          kiallitasi_datum: formData.kiallitasi_datum || undefined,
          lejarati_datum: formData.lejarati_datum || undefined,
        }
      : undefined,
  };

  const fopFullName = [formData.vezeteknev, formData.keresztnev, formData.apai_nev].filter(Boolean).join(" ");
  const fopCode = formData.kod.trim() || formData.fop_kod.trim() || "";

  // Auto-create directory structure if rootDirectory is set
  const rootFolder = getSavedRootFolder();
  if (rootFolder) {
    await ensureFopDirectory(rootFolder, fopCode, fopFullName);
  }

  try {
    const createdFop = await invoke<FopData>("create_fop", { input: inputData });
    const updatedList = [createdFop, ...existingFops];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    return createdFop;
  } catch (err) {
    console.warn("Tauri create_fop fallback to localStorage:", err);

    const newFopId = Date.now();
    const newFop: FopData = {
      id: newFopId,
      kod: formData.kod.trim() || undefined,
      vezeteknev: formData.vezeteknev.trim(),
      keresztnev: formData.keresztnev.trim(),
      apai_nev: formData.apai_nev.trim(),
      szuletesi_datum: formData.szuletesi_datum || undefined,
      nem: formData.nem.trim() || undefined,
      fop_kod: formData.fop_kod.trim() || undefined,
      fop_kezdete_datum: formData.fop_kezdete_datum || undefined,
      nakaz_szam: "1",
      munkas_szam: "1",
      cim: inputData.cim,
      okmany: inputData.okmany,
      munkasok: [],
    };

    const updatedList = [newFop, ...existingFops];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    return newFop;
  }
}

export async function updateFop(formData: EditFopFormState, existingFops: FopData[]): Promise<FopData> {
  const inputData = {
    id: formData.id,
    kod: formData.kod.trim() || undefined,
    vezeteknev: formData.vezeteknev.trim(),
    keresztnev: formData.keresztnev.trim(),
    apai_nev: formData.apai_nev.trim(),
    szuletesi_datum: formData.szuletesi_datum || undefined,
    nem: formData.nem.trim() || undefined,
    fop_kod: formData.fop_kod.trim() || undefined,
    fop_kezdete_datum: formData.fop_kezdete_datum || undefined,
    nakaz_szam: formData.nakaz_szam.trim() || undefined,
    munkas_szam: formData.munkas_szam.trim() || undefined,
    cim: {
      iranyitoszam: formData.iranyitoszam.trim() || undefined,
      megye: formData.megye.trim() || undefined,
      jaras: formData.jaras.trim() || undefined,
      kozseg: formData.kozseg.trim() || undefined,
      utca: formData.utca.trim() || undefined,
      hazszam: formData.hazszam.trim() || undefined,
      epulet: formData.epulet.trim() || undefined,
      lakas_szoba: formData.lakas_szoba.trim() || undefined,
      orszag: formData.orszag.trim() || "Україна",
    },
    okmany: formData.okmanyszam.trim()
      ? {
          tipus: formData.okmany_tipus,
          szeria: formData.okmany_tipus === 0 ? formData.szeria.trim() || undefined : undefined,
          okmanyszam: formData.okmanyszam.trim(),
          kiallitott_hatosag: formData.okmany_tipus === 0 ? formData.kiallitott_hatosag.trim() || undefined : undefined,
          hatosagi_kod: formData.okmany_tipus === 1 ? formData.hatosagi_kod.trim() || undefined : undefined,
          kiallitasi_datum: formData.kiallitasi_datum || undefined,
          lejarati_datum: formData.lejarati_datum || undefined,
        }
      : undefined,
  };

  const fopFullName = [formData.vezeteknev, formData.keresztnev, formData.apai_nev].filter(Boolean).join(" ");
  const fopCode = formData.kod.trim() || formData.fop_kod.trim() || "";

  // Auto-sync directory structure if root folder is set
  const rootFolder = getSavedRootFolder();
  if (rootFolder) {
    await ensureFopDirectory(rootFolder, fopCode, fopFullName);
  }

  try {
    const updatedFop = await invoke<FopData>("update_fop", { input: inputData });
    const updatedList = existingFops.map((f) => (f.id === formData.id ? updatedFop : f));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    return updatedFop;
  } catch (err) {
    console.warn("Tauri update_fop fallback to localStorage:", err);

    const existingWorkers = existingFops.find((f) => f.id === formData.id)?.munkasok || [];
    const updatedFop: FopData = {
      id: formData.id,
      kod: formData.kod.trim() || undefined,
      vezeteknev: formData.vezeteknev.trim(),
      keresztnev: formData.keresztnev.trim(),
      apai_nev: formData.apai_nev.trim(),
      szuletesi_datum: formData.szuletesi_datum || undefined,
      nem: formData.nem.trim() || undefined,
      fop_kod: formData.fop_kod.trim() || undefined,
      fop_kezdete_datum: formData.fop_kezdete_datum || undefined,
      nakaz_szam: formData.nakaz_szam.trim() || "1",
      munkas_szam: formData.munkas_szam.trim() || "1",
      cim: inputData.cim,
      okmany: inputData.okmany,
      munkasok: existingWorkers,
    };

    const updatedList = existingFops.map((f) => (f.id === formData.id ? updatedFop : f));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    return updatedFop;
  }
}

export async function deleteFop(fopId: number, existingFops: FopData[]): Promise<FopData[]> {
  try {
    await invoke("delete_fop", { fopId });
  } catch (err) {
    console.warn("Tauri delete_fop fallback to localStorage:", err);
  }

  const updatedList = existingFops.filter((f) => f.id !== fopId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
  return updatedList;
}

export async function createWorker(formData: CreateWorkerFormState, existingFops: FopData[]): Promise<Munkas> {
  const inputData = {
    fop_id: formData.fop_id,
    kod: formData.kod.trim() || undefined,
    tabel_nomer: formData.tabel_nomer.trim() || undefined,
    vezeteknev: formData.vezeteknev.trim(),
    keresztnev: formData.keresztnev.trim(),
    apai_nev: formData.apai_nev.trim(),
    szuletesi_datum: formData.szuletesi_datum || undefined,
    nem: formData.nem.trim() || undefined,
    foglalkozas_megnevezes: formData.foglalkozas_megnevezes.trim(),
    fizetes: formData.fizetes,
    foallas: formData.foallas,
    teljes_munkaido: formData.teljes_munkaido,
    munkakezdes_datum: formData.munkakezdes_datum || undefined,
    kerelem_datum: formData.kerelem_datum || undefined,
    munkaviszony_vege: formData.munkaviszony_vege || undefined,
    cim: {
      iranyitoszam: formData.iranyitoszam.trim() || undefined,
      megye: formData.megye.trim() || undefined,
      jaras: formData.jaras.trim() || undefined,
      kozseg: formData.kozseg.trim() || undefined,
      utca: formData.utca.trim() || undefined,
      hazszam: formData.hazszam.trim() || undefined,
      epulet: formData.epulet.trim() || undefined,
      lakas_szoba: formData.lakas_szoba.trim() || undefined,
      orszag: formData.orszag.trim() || "Україна",
    },
    okmany: formData.okmanyszam.trim()
      ? {
          tipus: formData.okmany_tipus,
          szeria: formData.okmany_tipus === 0 ? formData.szeria.trim() || undefined : undefined,
          okmanyszam: formData.okmanyszam.trim(),
          kiallitott_hatosag: formData.okmany_tipus === 0 ? formData.kiallitott_hatosag.trim() || undefined : undefined,
          hatosagi_kod: formData.okmany_tipus === 1 ? formData.hatosagi_kod.trim() || undefined : undefined,
          kiallitasi_datum: formData.kiallitasi_datum || undefined,
          lejarati_datum: formData.lejarati_datum || undefined,
        }
      : undefined,
  };

  try {
    const createdWorker = await invoke<Munkas>("create_worker", { input: inputData });
    const updatedList = existingFops.map((fop) => {
      if (fop.id === formData.fop_id) {
        return { ...fop, munkasok: [...fop.munkasok, createdWorker] };
      }
      return fop;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    return createdWorker;
  } catch (err) {
    console.warn("Tauri create_worker fallback to localStorage:", err);

    const createdWorker: Munkas = {
      id: Date.now(),
      kod: formData.kod.trim() || undefined,
      vezeteknev: formData.vezeteknev.trim(),
      keresztnev: formData.keresztnev.trim(),
      apai_nev: formData.apai_nev.trim(),
      nem: formData.nem.trim() || undefined,
      foallas: formData.foallas,
      teljes_munkaido: formData.teljes_munkaido,
      foglalkozas_megnevezes: formData.foglalkozas_megnevezes.trim(),
      fizetes: formData.fizetes,
      munkakezdes_datum: formData.munkakezdes_datum || undefined,
      kerelem_datum: formData.kerelem_datum || undefined,
      munkaviszony_vege: formData.munkaviszony_vege || undefined,
    };

    const updatedList = existingFops.map((fop) => {
      if (fop.id === formData.fop_id) {
        return { ...fop, munkasok: [...fop.munkasok, createdWorker] };
      }
      return fop;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    return createdWorker;
  }
}

export async function updateWorker(formData: EditWorkerFormState, existingFops: FopData[]): Promise<Munkas> {
  const inputData = {
    id: formData.id,
    kod: formData.kod.trim() || undefined,
    tabel_nomer: formData.tabel_nomer.trim() || undefined,
    vezeteknev: formData.vezeteknev.trim(),
    keresztnev: formData.keresztnev.trim(),
    apai_nev: formData.apai_nev.trim(),
    szuletesi_datum: formData.szuletesi_datum || undefined,
    nem: formData.nem.trim() || undefined,
    foglalkozas_megnevezes: formData.foglalkozas_megnevezes.trim(),
    fizetes: formData.fizetes,
    foallas: formData.foallas,
    teljes_munkaido: formData.teljes_munkaido,
    munkakezdes_datum: formData.munkakezdes_datum || undefined,
    kerelem_datum: formData.kerelem_datum || undefined,
    munkaviszony_vege: formData.munkaviszony_vege || undefined,
    cim: {
      iranyitoszam: formData.iranyitoszam.trim() || undefined,
      megye: formData.megye.trim() || undefined,
      jaras: formData.jaras.trim() || undefined,
      kozseg: formData.kozseg.trim() || undefined,
      utca: formData.utca.trim() || undefined,
      hazszam: formData.hazszam.trim() || undefined,
      epulet: formData.epulet.trim() || undefined,
      lakas_szoba: formData.lakas_szoba.trim() || undefined,
      orszag: formData.orszag.trim() || "Україна",
    },
    okmany: formData.okmanyszam.trim()
      ? {
          tipus: formData.okmany_tipus,
          szeria: formData.okmany_tipus === 0 ? formData.szeria.trim() || undefined : undefined,
          okmanyszam: formData.okmanyszam.trim(),
          kiallitott_hatosag: formData.okmany_tipus === 0 ? formData.kiallitott_hatosag.trim() || undefined : undefined,
          hatosagi_kod: formData.okmany_tipus === 1 ? formData.hatosagi_kod.trim() || undefined : undefined,
          kiallitasi_datum: formData.kiallitasi_datum || undefined,
          lejarati_datum: formData.lejarati_datum || undefined,
        }
      : undefined,
  };

  try {
    const updatedWorker = await invoke<Munkas>("update_worker", { input: inputData });
    const updatedList = existingFops.map((fop) => ({
      ...fop,
      munkasok: fop.munkasok.map((m) => (m.id === formData.id ? updatedWorker : m)),
    }));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    return updatedWorker;
  } catch (err) {
    console.warn("Tauri update_worker fallback to localStorage:", err);

    const updatedWorker: Munkas = {
      id: formData.id,
      kod: formData.kod.trim() || undefined,
      vezeteknev: formData.vezeteknev.trim(),
      keresztnev: formData.keresztnev.trim(),
      apai_nev: formData.apai_nev.trim(),
      szuletesi_datum: formData.szuletesi_datum || undefined,
      nem: formData.nem.trim() || undefined,
      foallas: formData.foallas,
      teljes_munkaido: formData.teljes_munkaido,
      foglalkozas_megnevezes: formData.foglalkozas_megnevezes.trim(),
      fizetes: formData.fizetes,
      munkakezdes_datum: formData.munkakezdes_datum || undefined,
      kerelem_datum: formData.kerelem_datum || undefined,
      munkaviszony_vege: formData.munkaviszony_vege || undefined,
      cim: inputData.cim,
      okmany: inputData.okmany,
    };

    const updatedList = existingFops.map((fop) => ({
      ...fop,
      munkasok: fop.munkasok.map((m) => (m.id === formData.id ? updatedWorker : m)),
    }));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    return updatedWorker;
  }
}

export async function dismissWorker(workerId: number, date: string, existingFops: FopData[]): Promise<FopData[]> {
  try {
    await invoke("dismiss_worker", { workerId, date });
  } catch (err) {
    console.warn("Tauri dismiss_worker fallback to localStorage:", err);
  }

  const updatedList = existingFops.map((fop) => ({
    ...fop,
    munkasok: fop.munkasok.map((m) =>
      m.id === workerId ? { ...m, munkaviszony_vege: date || undefined } : m
    ),
  }));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
  return updatedList;
}

export async function deleteWorker(workerId: number, existingFops: FopData[]): Promise<FopData[]> {
  try {
    await invoke("delete_worker", { workerId });
  } catch (err) {
    console.warn("Tauri delete_worker fallback to localStorage:", err);
  }

  const updatedList = existingFops.map((fop) => ({
    ...fop,
    munkasok: fop.munkasok.filter((m) => m.id !== workerId),
  }));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
  return updatedList;
}

export async function previewPayroll(
  fopId: number,
  year: number,
  month: number,
  minWage: number,
  workerOverrides: Array<{ worker_id: number; previous_kopeks: number; manual_addition: number }>
) {
  return await invoke("preview_payroll", {
    fopId,
    year,
    month,
    minWage,
    workerOverrides,
  });
}

export async function previewPayrollPeriod(

  fopId: number,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  minWage: number
) {
  return await invoke("preview_payroll_period", {
    fopId,
    startYear,
    startMonth,
    endYear,
    endMonth,
    minWage,
  });
}


export async function generatePayrollExcel(req: {
  fop_id: number;
  year: number;
  month: number;
  min_wage: number;
  worker_overrides: Array<{ worker_id: number; previous_kopeks: number; manual_addition: number }>;
  save_dir?: string;
}): Promise<string> {
  return await invoke<string>("generate_payroll_excel", { req });
}

export async function generatePayrollPeriodExcel(req: {
  fop_id: number;
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
  min_wage: number;
  save_dir?: string;
}): Promise<string> {
  return await invoke<string>("generate_payroll_period_excel", { req });
}

export async function saveWorkerKopek(
  workerId: number,
  fopId: number,
  year: number,
  month: number,
  kopek: number
): Promise<void> {
  await invoke("save_worker_kopek", {
    workerId,
    fopId,
    year,
    month,
    kopek,
  });
}

// ─── Табель (Timesheet) Service Functions ───────────────────────────

export async function previewTabel(
  fopId: number,
  year: number,
  month: number,
  workerDayOverrides: WorkerDayOverride[]
) {
  return await invoke("preview_tabel", {
    fopId,
    year,
    month,
    workerDayOverrides,
  });
}

export async function previewTabelPeriod(
  fopId: number,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  workerDayOverrides: WorkerDayOverride[] = []
) {
  return await invoke("preview_tabel_period", {
    fopId,
    startYear,
    startMonth,
    endYear,
    endMonth,
    workerDayOverrides,
  });
}

export async function generateTabelExcel(req: {
  fop_id: number;
  year: number;
  month: number;
  worker_day_overrides: WorkerDayOverride[];
  save_dir?: string;
}): Promise<string> {
  return await invoke<string>("generate_tabel_excel", { req });
}

export async function generateTabelPeriodExcel(req: {
  fop_id: number;
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
  worker_day_overrides?: WorkerDayOverride[];
  save_dir?: string;
}): Promise<string> {
  return await invoke<string>("generate_tabel_period_excel", { req });
}



export async function generateZayavaPriyomDocx(req: GenerateZayavaPriyomDocxRequest): Promise<string> {
  return await invoke<string>("generate_zayava_priyom_docx", { req });
}
