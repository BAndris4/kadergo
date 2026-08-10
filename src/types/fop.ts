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
  tabel_nomer?: string; // Табельний номер
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
  tabel_nomer: string;
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
  tabel_nomer: string;
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

// ─── Табель (Timesheet) Types ───────────────────────────────────────

export interface TabelDayEntry {
  day: number;
  is_weekday: boolean;
  is_worked: boolean;
  code: string;
  hours: number;
}

export interface TabelPreviewRowDto {
  worker_id: number;
  worker_kod: string;
  pib_posada: string;
  nem: string;
  rate: number;
  days: TabelDayEntry[];
  total_days: number;
  total_hours: number;
  missing_fields: string[];
  month_name_ukr?: string;
  year?: number;
  month?: number;
  teljes_munkaido?: boolean;
}

export interface TabelPreviewDto {
  fop_name: string;
  fop_code: string;
  fop_short_name: string;
  month_name_ukr: string;
  month_name_upper: string;
  year: number;
  month: number;
  total_work_days: number;
  rows: TabelPreviewRowDto[];
}

export interface WorkerDayOverride {
  worker_id: number;
  year?: number;
  month?: number;
  day: number;
  code: string;
  hours: number;
}

export interface GenerateTabelRequest {
  fop_id: number;
  year: number;
  month: number;
  worker_day_overrides: WorkerDayOverride[];
  save_dir?: string;
}

export interface GenerateTabelPeriodRequest {
  fop_id: number;
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
  worker_day_overrides?: WorkerDayOverride[];
  save_dir?: string;
}



export interface GenerateZayavaPriyomDocxRequest {
  zayava_type?: string;
  fop_id: number;
  worker_id: number;
  fop_name: string;
  worker_genitive_name: string;
  position: string;
  start_date: string;
  request_date: string;
  worker_short_name: string;
  foallas: boolean;
  teljes_munkaido: boolean;
  custom_body_text?: string;
  save_dir?: string;
}

export interface ShtatPositionItem {
  position_name: string;
  units: number;
  base_salary: number;
  allowances: number;
  total_fund: number;
}

export interface GenerateShtatDocxRequest {
  fop_id: number;
  fop_name: string;
  date_str: string;
  items: ShtatPositionItem[];
  save_dir?: string;
}

export interface GrafikWorkerItem {
  position_name: string;
  worker_name: string;
  vacation_type: string;
  vacation_month: string;
  working_period: String | string;
}

export interface GenerateGrafikDocxRequest {
  fop_id: number;
  fop_name: string;
  date_str: string;
  year_span_str: string;
  items: GrafikWorkerItem[];
  save_dir?: string;
}
