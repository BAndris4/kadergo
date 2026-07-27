use std::collections::HashMap;
use std::fs;
use std::path::Path;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use rust_xlsxwriter::*;

use crate::db::init_sqlite_db;

#[derive(Debug, Clone, Deserialize)]
pub struct WorkerPayrollOverride {
    pub worker_id: i64,
    pub previous_kopeks: f64,
    pub manual_addition: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GeneratePayrollRequest {
    pub fop_id: i64,
    pub year: i32,
    pub month: u32,
    pub min_wage: f64,
    pub worker_overrides: Vec<WorkerPayrollOverride>,
    pub save_dir: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PayrollCalculationRowDto {
    pub worker_id: i64,
    pub pib: String,
    pub posada: String,
    pub work_days_str: String,
    pub prev_kopeks: f64,
    pub rate: f64,
    pub worked_salary: f64,
    pub manual_addition: f64,
    pub total_salary_m: f64,
    pub esv_o: f64,
    pub pdfo_p: f64,
    pub vz_q: f64,
    pub total_tax_r: f64,
    pub net_s: f64,
    pub advance_t: f64,
    pub regular_pay_u: f64,
    pub total_paid_v: f64,
    pub remaining_kopeks_w: f64,
    pub month_name_ukr: String,
    pub year: i32,
    pub month: u32,
    pub is_hired_or_dismissed_this_month: bool,
}



#[derive(Debug, Clone, Serialize)]
pub struct PayrollCalculationPreviewDto {
    pub fop_name: String,
    pub fop_code: String,
    pub month_name_ukr: String,
    pub month_name_upper: String,
    pub year: i32,
    pub total_work_days: u32,
    pub work_days_up_to_20: u32,
    pub rows: Vec<PayrollCalculationRowDto>,
}

pub fn get_month_name_ukr(month: u32) -> (&'static str, &'static str) {
    match month {
        1 => ("січень", "СІЧЕНЬ"),
        2 => ("лютий", "ЛЮТИЙ"),
        3 => ("березень", "БЕРЕЗЕНЬ"),
        4 => ("квітень", "КВІТЕНЬ"),
        5 => ("травень", "ТРАВЕНЬ"),
        6 => ("червень", "ЧЕРВЕНЬ"),
        7 => ("липень", "ЛИПЕНЬ"),
        8 => ("серпень", "СЕРПЕНЬ"),
        9 => ("вересень", "ВЕРЕСЕНЬ"),
        10 => ("жовтень", "ЖОВТЕНЬ"),
        11 => ("листопад", "ЛИСТОПАД"),
        12 => ("грудень", "ГРУДЕНЬ"),
        _ => ("місяць", "МІСЯЦЬ"),
    }
}

pub fn get_days_in_month(year: i32, month: u32) -> u32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => {
            if (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) {
                29
            } else {
                28
            }
        }
        _ => 30,
    }
}

pub fn is_weekday(year: i32, month: u32, day: u32) -> bool {
    let t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    let mut y = year;
    if month < 3 {
        y -= 1;
    }
    let dow = (y + y / 4 - y / 100 + y / 400 + t[(month - 1) as usize] + day as i32) % 7;
    dow >= 1 && dow <= 5
}

pub fn parse_day_of_month(date_str: &Option<String>, year: i32, month: u32) -> Option<u32> {
    if let Some(ref d) = date_str {
        let parts: Vec<&str> = d.split('-').collect();
        if parts.len() == 3 {
            if let (Ok(y), Ok(m), Ok(day)) = (parts[0].parse::<i32>(), parts[1].parse::<u32>(), parts[2].parse::<u32>()) {
                if y == year && m == month {
                    return Some(day);
                }
            }
        }
    }
    None
}

struct WorkerDbRow {
    id: i64,
    vezeteknev: String,
    keresztnev: String,
    apai_nev: String,
    foglalkozas: String,
    teljes_munkaido: i32,
    fizetes: f64,
    munkakezdes_datum: Option<String>,
    munkaviszony_vege: Option<String>,
}

fn round2(val: f64) -> f64 {
    (val * 100.0).round() / 100.0
}

fn calculate_worker_month_kopek(
    conn: &rusqlite::Connection,
    worker_id: i64,
    fop_id: i64,
    year: i32,
    month: u32,
    min_wage: f64,
    prev_kopeks: f64,
) -> f64 {
    let prev_kopeks = round2(prev_kopeks);
    let row: Option<(f64, i32, Option<String>, Option<String>)> = conn
        .query_row(
            "SELECT j.fizetes, j.teljes_munkaido, j.munkakezdes_datum, j.munkaviszony_vege
             FROM jogviszony j
             WHERE j.munkavallalo_id = ?1 AND j.fop_id = ?2",
            params![worker_id, fop_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2).ok().flatten(), r.get(3).ok().flatten())),
        )
        .ok();

    let (rate, teljes_munkaido, munkakezdes, munkaviszony_vege) = match row {
        Some(r) => r,
        None => return prev_kopeks,
    };

    let days_in_month = get_days_in_month(year, month);

    let month_start_str = format!("{:04}-{:02}-01", year, month);
    let month_end_str = format!("{:04}-{:02}-{:02}", year, month, days_in_month);

    if let Some(ref k) = munkakezdes {
        if k > &month_end_str {
            return prev_kopeks;
        }
    }
    if let Some(ref v) = munkaviszony_vege {
        if v < &month_start_str {
            return prev_kopeks;
        }
    }

    let mut total_work_days = 0u32;

    for d in 1..=days_in_month {
        if is_weekday(year, month, d) {
            total_work_days += 1;
        }
    }

    let hired_day = parse_day_of_month(&munkakezdes, year, month);
    let dismissed_day = parse_day_of_month(&munkaviszony_vege, year, month);
    let is_hired_or_dismissed_this_month = hired_day.is_some() || dismissed_day.is_some();

    let start_d = hired_day.unwrap_or(1);
    let end_d = dismissed_day.unwrap_or(days_in_month);

    let mut worker_days = 0u32;
    let mut worker_days_20 = 0u32;
    for d in start_d..=end_d {
        if is_weekday(year, month, d) {
            worker_days += 1;
            if d <= 20 {
                worker_days_20 += 1;
            }
        }
    }

    let is_full_time = teljes_munkaido == 1;
    let base_factor = if is_full_time { 1.0 } else { 0.5 };
    let worked_salary = if total_work_days > 0 {
        round2((rate * base_factor) * (worker_days as f64 / total_work_days as f64))
    } else {
        0.0
    };

    let total_salary_m = worked_salary;
    let min_esv = if is_hired_or_dismissed_this_month { 0.0 } else { round2(min_wage * 0.22) };
    let _esv_o = round2((total_salary_m * 0.22).max(min_esv));
    let pdfo_raw = total_salary_m * 0.18;
    let vz_raw = total_salary_m * 0.05;
    let pdfo_p = round2(pdfo_raw);
    let vz_q = round2(vz_raw);
    let _total_tax_r = pdfo_p + vz_q;
    let net_s = round2((total_salary_m - (pdfo_raw + vz_raw)).max(0.0));


    let total_with_prev = round2(net_s + prev_kopeks);

    let advance_raw = if worker_days > 0 {
        (worker_days_20 as f64 / worker_days as f64) * net_s
    } else {
        0.0
    };
    let is_dismissed_this_month = dismissed_day.is_some();
    let advance_t = advance_raw.ceil();
    let remaining_to_pay = (total_with_prev - advance_t).max(0.0);
    let regular_pay_u = if is_dismissed_this_month {
        remaining_to_pay.ceil()
    } else {
        remaining_to_pay.floor()
    };

    let total_paid_v = advance_t + regular_pay_u;
    let remaining_kopeks_w = if is_dismissed_this_month {
        0.0
    } else {
        round2(total_with_prev - total_paid_v)
    };
    remaining_kopeks_w
}


/// Helper to fetch remembered kopeks for a worker from SQLite `kopek` table.
/// If not set for current (year, month), automatically fast-forward simulate kopeks
/// from the most recent saved month up to target_month!
fn get_or_cascade_db_kopek(
    conn: &rusqlite::Connection,
    worker_id: i64,
    fop_id: i64,
    target_year: i32,
    target_month: u32,
    min_wage: f64,
) -> f64 {
    // 1. Try exact month
    let query_exact = "SELECT kopek FROM kopek WHERE munkavallalo_id = ?1 AND fop_id = ?2 AND ev = ?3 AND honap = ?4";
    if let Ok(val) = conn.query_row(query_exact, params![worker_id, fop_id, target_year, target_month], |r| r.get::<_, f64>(0)) {
        return val;
    }

    // 2. Find latest recorded month in DB BEFORE target_month
    let query_prev = "SELECT ev, honap, kopek FROM kopek 
                      WHERE munkavallalo_id = ?1 AND fop_id = ?2 AND (ev < ?3 OR (ev = ?3 AND honap < ?4))
                      ORDER BY ev DESC, honap DESC LIMIT 1";

    let prev_rec: Option<(i32, u32, f64)> = conn
        .query_row(query_prev, params![worker_id, fop_id, target_year, target_month], |r| {
            Ok((r.get(0)?, r.get(1)?, r.get(2)?))
        })
        .ok();

    let (mut cur_year, mut cur_month, mut cur_kopek) = match prev_rec {
        Some(rec) => rec,
        None => return 0.0,
    };

    // 3. Fast-forward cascade simulate from (cur_year, cur_month) up to target_month
    while (cur_year < target_year) || (cur_year == target_year && cur_month < target_month) {
        let ending_w = calculate_worker_month_kopek(conn, worker_id, fop_id, cur_year, cur_month, min_wage, cur_kopek);
        let (next_year, next_month) = if cur_month == 12 { (cur_year + 1, 1) } else { (cur_year, cur_month + 1) };

        let _ = conn.execute(
            "INSERT INTO kopek (munkavallalo_id, fop_id, ev, honap, kopek)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(munkavallalo_id, fop_id, ev, honap)
             DO UPDATE SET kopek = excluded.kopek",
            params![worker_id, fop_id, next_year, next_month, ending_w],
        );

        cur_year = next_year;
        cur_month = next_month;
        cur_kopek = ending_w;
    }

    cur_kopek
}


#[tauri::command]
pub fn save_worker_kopek(
    worker_id: i64,
    fop_id: i64,
    year: i32,
    month: u32,
    kopek: f64,
) -> Result<(), String> {
    let conn = init_sqlite_db().map_err(|e| e.to_string())?;

    // 1. Save / update exact (year, month) kopek in DB
    conn.execute(
        "INSERT INTO kopek (munkavallalo_id, fop_id, ev, honap, kopek)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(munkavallalo_id, fop_id, ev, honap)
         DO UPDATE SET kopek = excluded.kopek",
        params![worker_id, fop_id, year, month, kopek],
    )
    .map_err(|e| e.to_string())?;

    // 2. Delete any future recorded months after (year, month) so cascade re-simulates from new user value
    conn.execute(
        "DELETE FROM kopek
         WHERE munkavallalo_id = ?1
           AND fop_id = ?2
           AND (ev > ?3 OR (ev = ?3 AND honap > ?4))",
        params![worker_id, fop_id, year, month],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}


#[tauri::command]
pub fn preview_payroll(
    fop_id: i64,
    year: i32,
    month: u32,
    min_wage: f64,
    worker_overrides: Vec<WorkerPayrollOverride>,
) -> Result<PayrollCalculationPreviewDto, String> {
    let conn = init_sqlite_db().map_err(|e| e.to_string())?;

    // 1. Fetch FOP info
    let (fop_vez, fop_ker, fop_apai, fop_kod): (String, String, Option<String>, Option<String>) = conn
        .query_row(
            "SELECT s.vezeteknev, s.keresztnev, s.apai_nev, COALESCE(f.fop_kod, s.kod)
             FROM fop f
             JOIN szemely s ON f.szemely_id = s.id
             WHERE f.id = ?1",
            params![fop_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2).ok(), r.get(3).ok())),
        )
        .map_err(|e| format!("FOP not found: {}", e))?;

    let fop_name = format!(
        "ФОП {} {} {}",
        fop_vez.to_uppercase(),
        fop_ker.to_uppercase(),
        fop_apai.unwrap_or_default().to_uppercase()
    )
    .trim()
    .to_string();

    let fop_code = fop_kod.unwrap_or_default();
    let (month_ukr, month_upper) = get_month_name_ukr(month);

    // 2. Month working days
    let days_in_month = get_days_in_month(year, month);
    let mut total_work_days = 0u32;
    let mut work_days_up_to_20 = 0u32;

    for d in 1..=days_in_month {
        if is_weekday(year, month, d) {
            total_work_days += 1;
            if d <= 20 {
                work_days_up_to_20 += 1;
            }
        }
    }

    // Overrides map
    let overrides_map: HashMap<i64, WorkerPayrollOverride> = worker_overrides
        .into_iter()
        .map(|o| (o.worker_id, o))
        .collect();

    let month_start_str = format!("{:04}-{:02}-01", year, month);
    let month_end_str = format!("{:04}-{:02}-{:02}", year, month, days_in_month);

    let mut stmt = conn
        .prepare(
            "SELECT s.id, s.vezeteknev, s.keresztnev, s.apai_nev,
                    j.foglalkozas_megnevezes, j.teljes_munkaido, j.fizetes,
                    j.munkakezdes_datum, j.munkaviszony_vege
             FROM jogviszony j
             JOIN szemely s ON j.munkavallalo_id = s.id
             WHERE j.fop_id = ?1
               AND (j.munkakezdes_datum IS NULL OR j.munkakezdes_datum <= ?2)
               AND (j.munkaviszony_vege IS NULL OR j.munkaviszony_vege >= ?3)
             ORDER BY s.vezeteknev ASC, s.keresztnev ASC",
        )
        .map_err(|e| e.to_string())?;

    let worker_rows = stmt
        .query_map(params![fop_id, month_end_str, month_start_str], |r| {

            Ok(WorkerDbRow {
                id: r.get(0)?,
                vezeteknev: r.get::<_, Option<String>>(1).ok().flatten().unwrap_or_default(),
                keresztnev: r.get::<_, Option<String>>(2).ok().flatten().unwrap_or_default(),
                apai_nev: r.get::<_, Option<String>>(3).ok().flatten().unwrap_or_default(),
                foglalkozas: r.get::<_, Option<String>>(4).ok().flatten().unwrap_or_default(),
                teljes_munkaido: r.get(5)?,
                fizetes: r.get(6)?,
                munkakezdes_datum: r.get(7).ok().flatten(),
                munkaviszony_vege: r.get(8).ok().flatten(),
            })
        })
        .map_err(|e| e.to_string())?;

    let mut calculation_rows = Vec::new();

    for w_res in worker_rows {
        let w = w_res.map_err(|e| e.to_string())?;
        let pib = if !w.keresztnev.is_empty() {
            format!("{}\n{} {}", w.vezeteknev, w.keresztnev, w.apai_nev).trim().to_string()
        } else {
            w.vezeteknev.clone()
        };



        let override_val = overrides_map.get(&w.id);

        let prev_kopeks = match override_val {
            Some(o) => {
                let _ = conn.execute(
                    "INSERT INTO kopek (munkavallalo_id, fop_id, ev, honap, kopek)
                     VALUES (?1, ?2, ?3, ?4, ?5)
                     ON CONFLICT(munkavallalo_id, fop_id, ev, honap)
                     DO UPDATE SET kopek = excluded.kopek",
                    params![w.id, fop_id, year, month, o.previous_kopeks],
                );
                o.previous_kopeks
            }
            None => get_or_cascade_db_kopek(&conn, w.id, fop_id, year, month, min_wage),
        };



        let manual_addition = override_val.map(|o| o.manual_addition).unwrap_or(0.0);

        // Check hiring/dismissal mid-month
        let hired_day = parse_day_of_month(&w.munkakezdes_datum, year, month);
        let dismissed_day = parse_day_of_month(&w.munkaviszony_vege, year, month);

        let is_hired_or_dismissed_this_month = hired_day.is_some() || dismissed_day.is_some();

        let start_d = hired_day.unwrap_or(1);
        let end_d = dismissed_day.unwrap_or(days_in_month);

        let mut worker_days = 0u32;
        let mut worker_days_20 = 0u32;

        for d in start_d..=end_d {
            if is_weekday(year, month, d) {
                worker_days += 1;
                if d <= 20 {
                    worker_days_20 += 1;
                }
            }
        }

        let is_full_time = w.teljes_munkaido == 1;
        let hours_multiplier = if is_full_time { 8 } else { 4 };
        let worked_hours = worker_days * hours_multiplier;
        let work_days_str = format!("{}/{}", worker_days, worked_hours);

        let rate = w.fizetes;
        let base_factor = if is_full_time { 1.0 } else { 0.5 };
        let worked_salary = if total_work_days > 0 {
            round2((rate * base_factor) * (worker_days as f64 / total_work_days as f64))
        } else {
            0.0
        };

        let total_salary_m = round2(worked_salary + manual_addition);

        // ESV 22%: if hired/dismissed this month, no min wage threshold applies
        let min_esv = if is_hired_or_dismissed_this_month {
            0.0
        } else {
            round2(min_wage * 0.22)
        };
        let esv_o = round2((total_salary_m * 0.22).max(min_esv));

        let pdfo_raw = total_salary_m * 0.18;
        let vz_raw = total_salary_m * 0.05;
        let pdfo_p = round2(pdfo_raw);
        let vz_q = round2(vz_raw);
        let total_tax_r = pdfo_p + vz_q;
        let net_s = round2((total_salary_m - (pdfo_raw + vz_raw)).max(0.0));

        let total_with_prev = round2(net_s + prev_kopeks);



        // Advance: proportional to worked_days up to 20th vs total worker_days, rounded UP to integer
        let advance_raw = if worker_days > 0 {
            (worker_days_20 as f64 / worker_days as f64) * net_s
        } else {
            0.0
        };
        let is_dismissed_this_month = dismissed_day.is_some();
        let advance_t = advance_raw.ceil();

        let remaining_to_pay = (total_with_prev - advance_t).max(0.0);
        let regular_pay_u = if is_dismissed_this_month {
            remaining_to_pay.ceil()
        } else {
            remaining_to_pay.floor()
        };

        let total_paid_v = advance_t + regular_pay_u;
        let remaining_kopeks_w = if is_dismissed_this_month {
            0.0
        } else {
            round2(total_with_prev - total_paid_v)
        };


        // Auto-save calculated ending kopeks (W) as starting kopeks (E) for the NEXT month in SQLite DB!
        let (next_year, next_month) = if month == 12 { (year + 1, 1) } else { (year, month + 1) };
        let _ = conn.execute(
            "INSERT INTO kopek (munkavallalo_id, fop_id, ev, honap, kopek)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(munkavallalo_id, fop_id, ev, honap)
             DO UPDATE SET kopek = excluded.kopek",
            params![w.id, fop_id, next_year, next_month, remaining_kopeks_w],
        );


        calculation_rows.push(PayrollCalculationRowDto {
            worker_id: w.id,
            pib,
            posada: w.foglalkozas,
            work_days_str,
            prev_kopeks,
            rate,
            worked_salary,
            manual_addition,
            total_salary_m,
            esv_o,
            pdfo_p,
            vz_q,
            total_tax_r,
            net_s,
            advance_t,
            regular_pay_u,
            total_paid_v,
            remaining_kopeks_w,
            month_name_ukr: month_ukr.to_string(),
            year,
            month,
            is_hired_or_dismissed_this_month,
        });
    }




    Ok(PayrollCalculationPreviewDto {
        fop_name,
        fop_code,
        month_name_ukr: month_ukr.to_string(),
        month_name_upper: month_upper.to_string(),
        year,
        total_work_days,
        work_days_up_to_20,
        rows: calculation_rows,
    })
}

#[tauri::command]
pub fn generate_payroll_excel(req: GeneratePayrollRequest) -> Result<String, String> {
    let _conn = init_sqlite_db().map_err(|e| e.to_string())?;


    // Also persist any overrides & current kopeks to DB
    for ov in &req.worker_overrides {
        let _ = save_worker_kopek(ov.worker_id, req.fop_id, req.year, req.month, ov.previous_kopeks);
    }

    let preview = preview_payroll(
        req.fop_id,
        req.year,
        req.month,
        req.min_wage,
        req.worker_overrides,
    )?;

    // Save calculated remaining kopeks (Column W) for the NEXT month in DB automatically!
    let (next_year, next_month) = if req.month == 12 { (req.year + 1, 1) } else { (req.year, req.month + 1) };
    for row in &preview.rows {
        let _ = save_worker_kopek(row.worker_id, req.fop_id, next_year, next_month, row.remaining_kopeks_w);
    }

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // Setup Styles matching ВІДОМІСТЬ березень.xlsx
    let font_family = "Times New Roman";

    let format_top_fop = Format::new()
        .set_font_name(font_family)
        .set_font_size(11)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap();

    let format_main_title = Format::new()
        .set_font_name(font_family)
        .set_font_size(13)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap();

    let format_date_right = Format::new()
        .set_font_name(font_family)
        .set_font_size(10)
        .set_align(FormatAlign::Right)
        .set_align(FormatAlign::VerticalCenter);

    let format_header = Format::new()
        .set_font_name(font_family)
        .set_font_size(9)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap()
        .set_border(FormatBorder::Thin);

    let format_data_center = Format::new()
        .set_font_name(font_family)
        .set_font_size(10)
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin);

    let format_data_left = Format::new()
        .set_font_name(font_family)
        .set_font_size(10)
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap()
        .set_border(FormatBorder::Thin);

    // Thousands separator formatting for currency/floats: #,##0.00;-#,##0.00;"-"
    let format_data_num = Format::new()
        .set_font_name(font_family)
        .set_font_size(10)
        .set_align(FormatAlign::Right)
        .set_align(FormatAlign::VerticalCenter)
        .set_num_format("#,##0.00;-#,##0.00;\"-\"")
        .set_border(FormatBorder::Thin);

    // Bold numeric format for Column M
    let format_data_num_bold = Format::new()
        .set_font_name(font_family)
        .set_font_size(10)
        .set_bold()
        .set_align(FormatAlign::Right)
        .set_align(FormatAlign::VerticalCenter)
        .set_num_format("#,##0.00;-#,##0.00;\"-\"")
        .set_border(FormatBorder::Thin);


    // Thousands separator for integers: #,##0;-#,##0;"-"
    let format_data_int = Format::new()
        .set_font_name(font_family)
        .set_font_size(10)
        .set_align(FormatAlign::Right)
        .set_align(FormatAlign::VerticalCenter)
        .set_num_format("#,##0;-#,##0;\"-\"")
        .set_border(FormatBorder::Thin);

    let format_total_label = Format::new()
        .set_font_name(font_family)
        .set_font_size(10)
        .set_bold()
        .set_align(FormatAlign::Left)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin);

    let format_total_num = Format::new()
        .set_font_name(font_family)
        .set_font_size(10)
        .set_bold()
        .set_align(FormatAlign::Right)
        .set_align(FormatAlign::VerticalCenter)
        .set_num_format("#,##0.00;-#,##0.00;\"-\"")
        .set_border(FormatBorder::Thin);

    let format_footer_text = Format::new()
        .set_font_name(font_family)
        .set_font_size(10)
        .set_bold();

    // Column widths matching EXACT template narrow widths
    worksheet.set_column_width(0, 2.71).map_err(|e| e.to_string())?;  // A: №
    worksheet.set_column_width(1, 10.28).map_err(|e| e.to_string())?; // B: П.І.Б.
    worksheet.set_column_width(2, 11.57).map_err(|e| e.to_string())?; // C: Посада
    worksheet.set_column_width(3, 9.71).map_err(|e| e.to_string())?;  // D: Днів/годин
    worksheet.set_column_width(4, 8.28).map_err(|e| e.to_string())?;  // E: Залишок
    worksheet.set_column_width(5, 8.28).map_err(|e| e.to_string())?;  // F: Ставка
    worksheet.set_column_width(6, 11.57).map_err(|e| e.to_string())?; // G: Осн. зарплата
    worksheet.set_column_width(7, 8.57).map_err(|e| e.to_string())?;  // H: Відпускні
    worksheet.set_column_width(8, 6.71).map_err(|e| e.to_string())?;  // I: Лікарняні місяць
    worksheet.set_column_width(9, 5.57).map_err(|e| e.to_string())?;  // J: Лікарняні дні
    worksheet.set_column_width(10, 7.00).map_err(|e| e.to_string())?; // K: Лікарняні сума
    worksheet.set_column_width(11, 7.85).map_err(|e| e.to_string())?; // L: Індексація
    worksheet.set_column_width(12, 9.71).map_err(|e| e.to_string())?; // M: Всього грн
    worksheet.set_column_width(13, 9.14).map_err(|e| e.to_string())?; // N: ПСП
    worksheet.set_column_width(14, 10.28).map_err(|e| e.to_string())?;// O: ЄСВ
    worksheet.set_column_width(15, 8.71).map_err(|e| e.to_string())?; // P: ПДФО
    worksheet.set_column_width(16, 7.28).map_err(|e| e.to_string())?; // Q: ВЗ
    worksheet.set_column_width(17, 9.14).map_err(|e| e.to_string())?; // R: Всього утримано
    worksheet.set_column_width(18, 9.14).map_err(|e| e.to_string())?; // S: До сплати на руки
    worksheet.set_column_width(19, 9.14).map_err(|e| e.to_string())?; // T: Аванс
    worksheet.set_column_width(20, 9.14).map_err(|e| e.to_string())?; // U: Чергова виплата
    worksheet.set_column_width(21, 9.14).map_err(|e| e.to_string())?; // V: Всього виплачено
    worksheet.set_column_width(22, 9.14).map_err(|e| e.to_string())?; // W: Залишок
    worksheet.set_column_width(23, 10.00).map_err(|e| e.to_string())?;// X: Підпис

    // Row heights matching original
    worksheet.set_row_height(0, 12.75).map_err(|e| e.to_string())?;
    worksheet.set_row_height(1, 51.0).map_err(|e| e.to_string())?;
    worksheet.set_row_height(2, 39.6).map_err(|e| e.to_string())?;
    worksheet.set_row_height(3, 51.0).map_err(|e| e.to_string())?;
    worksheet.set_row_height(4, 38.25).map_err(|e| e.to_string())?;

    // Row 1-3: FOP Header Title Merged B1:D3 (Rows 0-2, Cols 1-3) - Center Aligned & Bigger font
    let fop_title_str = format!("{}\nІПН_{}", preview.fop_name, preview.fop_code);
    worksheet.merge_range(0, 1, 2, 3, &fop_title_str, &format_top_fop).map_err(|e| e.to_string())?;

    // Row 2: Document Header Title (F2:P2) with LINE BREAK before Month Year! & Date (S2:T2 -> Cols 18-19)
    let doc_title = format!(
        "Відомість нарахування та виплати заробітної плати за\n{}  {}р.",
        preview.month_name_upper, preview.year
    );
    worksheet.merge_range(1, 5, 1, 15, &doc_title, &format_main_title).map_err(|e| e.to_string())?;

    let days_in_m = get_days_in_month(preview.year, req.month);
    let date_str = format!("дата  {:02}.{:02}.{}р.", days_in_m, req.month, preview.year);
    worksheet.merge_range(1, 18, 1, 19, &date_str, &format_date_right).map_err(|e| e.to_string())?;

    // Header Cells (Rows 4 to 6 -> indices 3 to 5)
    worksheet.merge_range(3, 0, 5, 0, "№", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(3, 1, 5, 1, "П.І.Б.", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(3, 2, 5, 2, "Посада", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(3, 3, 5, 3, "Відпрацьовано днів/годин", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(3, 4, 5, 4, "Залишок несплаченої суми", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(3, 5, 5, 5, "Ставка", &format_header).map_err(|e| e.to_string())?;

    worksheet.merge_range(3, 6, 3, 10, "Нараховано за видами виплат", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(4, 6, 5, 6, "Заробітна плата              (основна)", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(4, 7, 5, 7, "Відпускні", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(4, 8, 4, 10, "Допомога у зв'язку з тимчасовою непрацездатністю", &format_header).map_err(|e| e.to_string())?;
    worksheet.write_with_format(5, 8, "місяць", &format_header).map_err(|e| e.to_string())?;
    worksheet.write_with_format(5, 9, "дні", &format_header).map_err(|e| e.to_string())?;
    worksheet.write_with_format(5, 10, "сума", &format_header).map_err(|e| e.to_string())?;

    worksheet.merge_range(3, 11, 5, 11, "Індексація", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(3, 12, 5, 12, "Всього, грн.", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(3, 13, 5, 13, "Податкова соціальна пільга", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(3, 14, 5, 14, "Нараховано ЄСВ", &format_header).map_err(|e| e.to_string())?;

    worksheet.merge_range(3, 15, 3, 17, "Утримано", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(4, 15, 5, 15, "ПДФО", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(4, 16, 5, 16, "ВЗ", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(4, 17, 5, 17, "Всього утримано", &format_header).map_err(|e| e.to_string())?;

    worksheet.merge_range(3, 18, 5, 18, "Сума до сплати на руки", &format_header).map_err(|e| e.to_string())?;

    worksheet.merge_range(3, 19, 3, 20, "Виплачено", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(4, 19, 5, 19, "Аванс", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(4, 20, 5, 20, "Чергова виплата", &format_header).map_err(|e| e.to_string())?;

    worksheet.merge_range(3, 21, 5, 21, "Всього виплачено", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(3, 22, 5, 22, "Залишок несплаченої суми", &format_header).map_err(|e| e.to_string())?;
    worksheet.merge_range(3, 23, 5, 23, "Підпис одержувача", &format_header).map_err(|e| e.to_string())?;

    // Row 7 (index 6): Numbers 1..24
    for c in 0..24 {
        worksheet.write_with_format(6, c as u16, (c + 1) as u32, &format_data_center).map_err(|e| e.to_string())?;
    }

    // Data Rows (Row index 7 onwards -> 1-based Excel row 8)
    let start_row = 7u32;
    let worker_count = preview.rows.len() as u32;

    for (idx, row) in preview.rows.iter().enumerate() {
        let r = start_row + idx as u32;
        let excel_r = r + 1; // 1-based index

        worksheet.set_row_height(r as u32, 36.0).map_err(|e| e.to_string())?;

        // A: №
        worksheet.write_with_format(r, 0, (idx + 1) as u32, &format_data_center).map_err(|e| e.to_string())?;
        // B: П.І.Б.
        worksheet.write_with_format(r, 1, &row.pib, &format_data_left).map_err(|e| e.to_string())?;
        // C: Посада
        worksheet.write_with_format(r, 2, &row.posada, &format_data_left).map_err(|e| e.to_string())?;
        // D: Днів/годин
        worksheet.write_with_format(r, 3, &row.work_days_str, &format_data_center).map_err(|e| e.to_string())?;
        // E: Залишок
        worksheet.write_with_format(r, 4, row.prev_kopeks, &format_data_num).map_err(|e| e.to_string())?;
        // F: Ставка
        worksheet.write_with_format(r, 5, row.rate, &format_data_int).map_err(|e| e.to_string())?;

        // G: Заробітна плата (основна)
        worksheet.write_with_format(r, 6, row.worked_salary, &format_data_num).map_err(|e| e.to_string())?;
        // H: Відпускні (manual addition)
        worksheet.write_with_format(r, 7, row.manual_addition, &format_data_num).map_err(|e| e.to_string())?;
        // I, J, K, L: write numeric 0 with format #,##0.00;-#,##0.00;"-" (renders visually as "-")
        worksheet.write_with_format(r, 8, 0.0, &format_data_num).map_err(|e| e.to_string())?;
        worksheet.write_with_format(r, 9, 0.0, &format_data_num).map_err(|e| e.to_string())?;
        worksheet.write_with_format(r, 10, 0.0, &format_data_num).map_err(|e| e.to_string())?;
        worksheet.write_with_format(r, 11, 0.0, &format_data_num).map_err(|e| e.to_string())?;

        // M: Всього грн = SUM(G:L) (BOLD)
        let formula_m = format!("=SUM(G{}:L{})", excel_r, excel_r);
        worksheet.write_formula_with_format(r, 12, formula_m.as_str(), &format_data_num_bold).map_err(|e| e.to_string())?;

        // N: PSP (0.00)
        worksheet.write_with_format(r, 13, 0.0, &format_data_num).map_err(|e| e.to_string())?;

        // O: ЄСВ = MAX(ROUND(M * 0.22, 2), min_esv_threshold) if min wage threshold applies
        let min_esv_threshold = round2(req.min_wage * 0.22);
        let formula_o = if row.esv_o > round2((row.worked_salary + row.manual_addition) * 0.22) + 0.001 {
            format!("=MAX(ROUND(M{}*0.22, 2), {:.2})", excel_r, min_esv_threshold)
        } else {
            format!("=ROUND(M{}*0.22, 2)", excel_r)
        };
        worksheet.write_formula_with_format(r, 14, formula_o.as_str(), &format_data_num).map_err(|e| e.to_string())?;


        // P: ПДФО = ROUND(M * 0.18, 2)
        let formula_p = format!("=ROUND(M{}*0.18, 2)", excel_r);
        worksheet.write_formula_with_format(r, 15, formula_p.as_str(), &format_data_num).map_err(|e| e.to_string())?;

        // Q: ВЗ = ROUND(M * 0.05, 2)
        let formula_q = format!("=ROUND(M{}*0.05, 2)", excel_r);
        worksheet.write_formula_with_format(r, 16, formula_q.as_str(), &format_data_num).map_err(|e| e.to_string())?;

        // R: Всього утримано = ROUND(SUM(P:Q), 2)
        let formula_r = format!("=ROUND(SUM(P{}:Q{}), 2)", excel_r, excel_r);
        worksheet.write_formula_with_format(r, 17, formula_r.as_str(), &format_data_num).map_err(|e| e.to_string())?;

        // S: До сплати на руки = ROUND(M - (M*0.18 + M*0.05), 2)
        let formula_s = format!("=ROUND(M{}-(M{}*0.18+M{}*0.05), 2)", excel_r, excel_r, excel_r);
        worksheet.write_formula_with_format(r, 18, formula_s.as_str(), &format_data_num).map_err(|e| e.to_string())?;

        // T: Аванс (Value calculated rounded UP integer)
        worksheet.write_with_format(r, 19, row.advance_t, &format_data_int).map_err(|e| e.to_string())?;

        let is_dismissed = row.remaining_kopeks_w == 0.0;

        // U: Чергова виплата = ROUNDUP(S + E - T, 0) if dismissed, INT(ROUND(S + E - T, 2)) if active
        let formula_u = if is_dismissed {
            format!("=ROUNDUP(ROUND(S{}+E{}-T{}, 2), 0)", excel_r, excel_r, excel_r)
        } else {
            format!("=INT(ROUND(S{}+E{}-T{}, 2))", excel_r, excel_r, excel_r)
        };
        worksheet.write_formula_with_format(r, 20, formula_u.as_str(), &format_data_int).map_err(|e| e.to_string())?;

        // V: Всього виплачено = SUM(T:U)
        let formula_v = format!("=SUM(T{}:U{})", excel_r, excel_r);
        worksheet.write_formula_with_format(r, 21, formula_v.as_str(), &format_data_int).map_err(|e| e.to_string())?;

        // W: Залишок = 0.0 if dismissed, ROUND((S + E) - V, 2) if active
        if is_dismissed {
            worksheet.write_with_format(r, 22, 0.0, &format_data_num).map_err(|e| e.to_string())?;
        } else {
            let formula_w = format!("=ROUND((S{}+E{})-V{}, 2)", excel_r, excel_r, excel_r);
            worksheet.write_formula_with_format(r, 22, formula_w.as_str(), &format_data_num).map_err(|e| e.to_string())?;
        }

        // X: Signature line
        worksheet.write_with_format(r, 23, "", &format_data_center).map_err(|e| e.to_string())?;
    }


    // Totals Row
    let total_r = start_row + worker_count;
    let excel_first = start_row + 1;
    let excel_last = start_row + worker_count;

    worksheet.merge_range(total_r, 1, total_r, 3, "Всього", &format_total_label).map_err(|e| e.to_string())?;
    worksheet.write_with_format(total_r, 0, "", &format_total_label).map_err(|e| e.to_string())?;

    if worker_count > 0 {
        // E total
        let f_e = format!("=SUM(E{}:E{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 4, f_e.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        worksheet.write_with_format(total_r, 5, "", &format_total_num).map_err(|e| e.to_string())?;

        // G total
        let f_g = format!("=SUM(G{}:G{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 6, f_g.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        // H total
        let f_h = format!("=SUM(H{}:H{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 7, f_h.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        worksheet.write_with_format(total_r, 8, 0.0, &format_total_num).map_err(|e| e.to_string())?;
        worksheet.write_with_format(total_r, 9, 0.0, &format_total_num).map_err(|e| e.to_string())?;
        worksheet.write_with_format(total_r, 10, 0.0, &format_total_num).map_err(|e| e.to_string())?;
        worksheet.write_with_format(total_r, 11, 0.0, &format_total_num).map_err(|e| e.to_string())?;

        // M total
        let f_m = format!("=SUM(M{}:M{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 12, f_m.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        worksheet.write_with_format(total_r, 13, 0.0, &format_total_num).map_err(|e| e.to_string())?;

        // O total
        let f_o = format!("=SUM(O{}:O{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 14, f_o.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        // P total
        let f_p = format!("=SUM(P{}:P{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 15, f_p.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        // Q total
        let f_q = format!("=SUM(Q{}:Q{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 16, f_q.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        // R total
        let f_r = format!("=SUM(R{}:R{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 17, f_r.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        // S total
        let f_s = format!("=SUM(S{}:S{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 18, f_s.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        // T total
        let f_t = format!("=SUM(T{}:T{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 19, f_t.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        // U total
        let f_u = format!("=SUM(U{}:U{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 20, f_u.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        // V total
        let f_v = format!("=SUM(V{}:V{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 21, f_v.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        // W total
        let f_w = format!("=SUM(W{}:W{})", excel_first, excel_last);
        worksheet.write_formula_with_format(total_r, 22, f_w.as_str(), &format_total_num).map_err(|e| e.to_string())?;

        worksheet.write_with_format(total_r, 23, "", &format_total_label).map_err(|e| e.to_string())?;
    }

    // Signature Footer (Row total_r + 4)
    let footer_r = total_r + 4;
    let fop_parts: Vec<&str> = preview.fop_name.split_whitespace().collect();
    let short_name = if fop_parts.len() >= 3 {
        format!("ФОП {} {}.{}.", fop_parts[1], fop_parts[2].chars().next().unwrap_or(' '), fop_parts.get(3).and_then(|s| s.chars().next()).unwrap_or(' '))
    } else {
        preview.fop_name.clone()
    };

    worksheet.merge_range(footer_r, 1, footer_r, 2, &short_name, &format_footer_text).map_err(|e| e.to_string())?;
    worksheet.merge_range(footer_r, 3, footer_r, 6, "__________________________", &format_footer_text).map_err(|e| e.to_string())?;

    // Determine target save path
    let filename = format!("ВІДОМІСТЬ_{}_{}.xlsx", preview.month_name_ukr, preview.year);

    let output_path = if let Some(ref dir) = req.save_dir {
        let p = Path::new(dir);
        if !p.exists() {
            let _ = fs::create_dir_all(p);
        }
        p.join(&filename).to_string_lossy().to_string()
    } else {
        filename
    };

    workbook.save(&output_path).map_err(|e| format!("Failed to save Excel file: {}", e))?;

    Ok(output_path)
}

#[derive(Debug, Clone, Deserialize)]
pub struct GeneratePayrollPeriodRequest {
    pub fop_id: i64,
    pub start_year: i32,
    pub start_month: u32,
    pub end_year: i32,
    pub end_month: u32,
    pub min_wage: f64,
    pub save_dir: Option<String>,
}

#[tauri::command]
pub fn generate_payroll_period_excel(req: GeneratePayrollPeriodRequest) -> Result<String, String> {
    let _conn = init_sqlite_db().map_err(|e| e.to_string())?;

    let mut cur_year = req.start_year;
    let mut cur_month = req.start_month;

    let mut last_path = String::new();

    while (cur_year < req.end_year) || (cur_year == req.end_year && cur_month <= req.end_month) {
        let single_req = GeneratePayrollRequest {
            fop_id: req.fop_id,
            year: cur_year,
            month: cur_month,
            min_wage: req.min_wage,
            worker_overrides: Vec::new(),
            save_dir: req.save_dir.clone(),
        };

        let path = generate_payroll_excel(single_req)?;
        last_path = path;

        if cur_month == 12 {
            cur_year += 1;
            cur_month = 1;
        } else {
            cur_month += 1;
        }
    }

    Ok(last_path)
}

#[tauri::command]
pub fn preview_payroll_period(
    fop_id: i64,
    start_year: i32,
    start_month: u32,
    end_year: i32,
    end_month: u32,
    min_wage: f64,
) -> Result<PayrollCalculationPreviewDto, String> {
    let mut cur_year = start_year;
    let mut cur_month = start_month;

    let mut all_rows = Vec::new();

    let mut last_fop_name = String::new();
    let mut last_fop_code = String::new();
    let mut total_work_days_sum = 0u32;
    let mut work_days_20_sum = 0u32;

    while (cur_year < end_year) || (cur_year == end_year && cur_month <= end_month) {
        let single_preview = preview_payroll(fop_id, cur_year, cur_month, min_wage, Vec::new())?;

        last_fop_name = single_preview.fop_name;
        last_fop_code = single_preview.fop_code;
        total_work_days_sum += single_preview.total_work_days;
        work_days_20_sum += single_preview.work_days_up_to_20;

        for mut row in single_preview.rows {
            row.month_name_ukr = format!("{} {}", single_preview.month_name_ukr, cur_year);
            row.year = cur_year;
            row.month = cur_month;
            all_rows.push(row);
        }


        if cur_month == 12 {
            cur_year += 1;
            cur_month = 1;
        } else {
            cur_month += 1;
        }
    }

    let start_m_name = get_month_name_ukr(start_month).0;
    let end_m_name = get_month_name_ukr(end_month).0;
    let period_str = format!("{} {} — {} {}", start_m_name, start_year, end_m_name, end_year);

    Ok(PayrollCalculationPreviewDto {
        fop_name: last_fop_name,
        fop_code: last_fop_code,
        month_name_ukr: period_str.clone(),
        month_name_upper: period_str.to_uppercase(),
        year: start_year,
        total_work_days: total_work_days_sum,
        work_days_up_to_20: work_days_20_sum,
        rows: all_rows,
    })
}


