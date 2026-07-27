export interface Cim {
  iranyitoszam?: string;
  megye?: string;
  jaras?: string;
  kozseg?: string;
  utca?: string;
  hazszam?: string;
  epulet?: string;
  lakas_szoba?: string;
  orszag?: string;
}

export interface Okmany {
  tipus: 0 | 1; // 0: Старий (паспорт-книжечка), 1: Новий (ID-картка)
  szeria?: string;
  okmanyszam: string;
  kiallitott_hatosag?: string;
  hatosagi_kod?: string;
  kiallitasi_datum?: string;
  lejarati_datum?: string;
}

export interface Munkas {
  id: number;
  kod?: string; // Внутрішній код особи (szemely.kod)
  vezeteknev: string;
  keresztnev: string;
  apai_nev?: string;
  szuletesi_datum?: string;
  nem?: string;
  foallas: boolean;
  teljes_munkaido: boolean;
  foglalkozas_megnevezes: string;
  fizetes: number;
  munkakezdes_datum?: string;
  kerelem_datum?: string;
  munkaviszony_vege?: string; // Дата звільнення / закінчення трудових відносин
  cim?: Cim;
  okmany?: Okmany;
}

export interface FopData {
  id: number;
  kod?: string; // Внутрішній код особи (szemely.kod)
  vezeteknev: string;
  keresztnev: string;
  apai_nev?: string;
  szuletesi_datum?: string;
  nem?: string; // 'Чоловік' | 'Жінка'
  fop_kod?: string;
  fop_kezdete_datum?: string;
  nakaz_szam?: string;
  munkas_szam?: string;
  deleted_at?: string; // Дата переміщення в кошик
  cim?: Cim;
  okmany?: Okmany;
  munkasok: Munkas[];
}

export interface CreateFopFormState {
  vezeteknev: string;
  keresztnev: string;
  apai_nev: string;
  kod: string;
  szuletesi_datum: string;
  nem: string;

  fop_kod: string;
  fop_kezdete_datum: string;

  iranyitoszam: string;
  megye: string;
  jaras: string;
  kozseg: string;
  utca: string;
  hazszam: string;
  epulet: string;
  lakas_szoba: string;
  orszag: string;

  okmany_tipus: 0 | 1;
  szeria: string;
  okmanyszam: string;
  kiallitott_hatosag: string;
  hatosagi_kod: string;
  kiallitasi_datum: string;
  lejarati_datum: string;
}

export interface EditFopFormState {
  id: number;
  vezeteknev: string;
  keresztnev: string;
  apai_nev: string;
  kod: string;
  szuletesi_datum: string;
  nem: string;

  fop_kod: string;
  fop_kezdete_datum: string;
  nakaz_szam: string;
  munkas_szam: string;

  iranyitoszam: string;
  megye: string;
  jaras: string;
  kozseg: string;
  utca: string;
  hazszam: string;
  epulet: string;
  lakas_szoba: string;
  orszag: string;

  okmany_tipus: 0 | 1;
  szeria: string;
  okmanyszam: string;
  kiallitott_hatosag: string;
  hatosagi_kod: string;
  kiallitasi_datum: string;
  lejarati_datum: string;
}

export interface CreateWorkerFormState {
  fop_id: number;
  vezeteknev: string;
  keresztnev: string;
  apai_nev: string;
  kod: string;
  szuletesi_datum: string;
  nem: string;

  foglalkozas_megnevezes: string;
  fizetes: number;
  foallas: boolean;
  teljes_munkaido: boolean;
  munkakezdes_datum: string;
  kerelem_datum: string;
  munkaviszony_vege: string;

  iranyitoszam: string;
  megye: string;
  jaras: string;
  kozseg: string;
  utca: string;
  hazszam: string;
  epulet: string;
  lakas_szoba: string;
  orszag: string;

  okmany_tipus: 0 | 1;
  szeria: string;
  okmanyszam: string;
  kiallitott_hatosag: string;
  hatosagi_kod: string;
  kiallitasi_datum: string;
  lejarati_datum: string;
}

export interface EditWorkerFormState {
  id: number;
  vezeteknev: string;
  keresztnev: string;
  apai_nev: string;
  kod: string;
  szuletesi_datum: string;
  nem: string;

  foglalkozas_megnevezes: string;
  fizetes: number;
  foallas: boolean;
  teljes_munkaido: boolean;
  munkakezdes_datum: string;
  kerelem_datum: string;
  munkaviszony_vege: string;

  iranyitoszam: string;
  megye: string;
  jaras: string;
  kozseg: string;
  utca: string;
  hazszam: string;
  epulet: string;
  lakas_szoba: string;
  orszag: string;

  okmany_tipus: 0 | 1;
  szeria: string;
  okmanyszam: string;
  kiallitott_hatosag: string;
  hatosagi_kod: string;
  kiallitasi_datum: string;
  lejarati_datum: string;
}

export interface ScanFopsResult {
  total_scanned: number;
  imported_count: number;
  existing_count: number;
  imported_names: string[];
}

export interface DiscoveredFopDto {
  folder_name: string;
  folder_path: string;
  kod: string;
  vezeteknev: string;
  keresztnev: string;
  apai_nev: string;
  already_exists: boolean;
}

export interface WorkerPayrollOverride {
  worker_id: number;
  previous_kopeks: number;
  manual_addition: number;
}

export interface GeneratePayrollRequest {
  fop_id: number;
  year: number;
  month: number;
  min_wage: number;
  worker_overrides: WorkerPayrollOverride[];
  save_dir?: string;
}

export interface PayrollCalculationRowDto {
  worker_id: number;
  pib: string;
  posada: string;
  work_days_str: string;
  prev_kopeks: number;
  rate: number;
  worked_salary: number;
  manual_addition: number;
  total_salary_m: number;
  esv_o: number;
  pdfo_p: number;
  vz_q: number;
  total_tax_r: number;
  net_s: number;
  advance_t: number;
  regular_pay_u: number;
  total_paid_v: number;
  remaining_kopeks_w: number;
  month_name_ukr?: string;
  year?: number;
  month?: number;
  is_hired_or_dismissed_this_month?: boolean;
}



export interface PayrollCalculationPreviewDto {
  fop_name: string;
  fop_code: string;
  month_name_ukr: string;
  month_name_upper: string;
  year: number;
  total_work_days: number;
  work_days_up_to_20: number;
  rows: PayrollCalculationRowDto[];
}



