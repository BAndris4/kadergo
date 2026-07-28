
use std::fs;
use std::path::Path;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use rust_xlsxwriter::*;

use crate::db::init_sqlite_db;
use crate::commands::payroll_commands::{get_days_in_month, is_weekday, get_month_name_ukr, parse_day_of_month};

// ─── DTOs ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct TabelDayEntry {
    pub day: u32,
    pub is_weekday: bool,
    pub is_worked: bool,
    pub code: String,
    pub hours: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct TabelPreviewRowDto {
    pub worker_id: i64,
    pub worker_kod: String,
    pub pib_posada: String,
    pub nem: String,
    pub rate: f64,
    pub days: Vec<TabelDayEntry>,
    pub total_days: u32,
    pub total_hours: f64,
    pub missing_fields: Vec<String>,
    pub month_name_ukr: Option<String>,
    pub year: Option<i32>,
    pub month: Option<u32>,
    pub teljes_munkaido: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct TabelPreviewDto {
    pub fop_name: String,
    pub fop_code: String,
    pub fop_short_name: String,
    pub month_name_ukr: String,
    pub month_name_upper: String,
    pub year: i32,
    pub month: u32,
    pub total_work_days: u32,
    pub rows: Vec<TabelPreviewRowDto>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WorkerDayOverride {
    pub worker_id: i64,
    #[serde(default)]
    pub year: Option<i32>,
    #[serde(default)]
    pub month: Option<u32>,
    pub day: u32,
    pub code: String,
    pub hours: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateTabelRequest {
    pub fop_id: i64,
    pub year: i32,
    pub month: u32,
    pub worker_day_overrides: Vec<WorkerDayOverride>,
    pub save_dir: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateTabelPeriodRequest {
    pub fop_id: i64,
    pub start_year: i32,
    pub start_month: u32,
    pub end_year: i32,
    pub end_month: u32,
    #[serde(default)]
    pub worker_day_overrides: Vec<WorkerDayOverride>,
    pub save_dir: Option<String>,
}

// ─── Helper: generate FOP short name (Гал Ф.Ф.) ────────────────────────

fn make_fop_short_name(fop_name: &str) -> String {
    let parts: Vec<&str> = fop_name.split_whitespace().collect();
    // fop_name = "ФОП ФЕРЕНЦОВИЧ ФЕРЕНЦ ..." -> skip "ФОП"
    if parts.len() >= 4 {
        let vez = parts[1]; // ФЕРЕНЦОВИЧ -> full
        let ker_initial = parts[2].chars().next().unwrap_or(' ');
        let apai_initial = parts.get(3).and_then(|s| s.chars().next()).unwrap_or(' ');
        format!("{} {}.{}.", vez, ker_initial, apai_initial)
    } else if parts.len() == 3 {
        let vez = parts[1];
        let ker_initial = parts[2].chars().next().unwrap_or(' ');
        format!("{} {}.", vez, ker_initial)
    } else {
        fop_name.to_string()
    }
}

// ─── Worker DB row ──────────────────────────────────────────────────────

struct TabelWorkerRow {
    id: i64,
    kod: String,
    vezeteknev: String,
    keresztnev: String,
    apai_nev: String,
    nem: String,
    foglalkozas: String,
    fizetes: f64,
    munkakezdes_datum: Option<String>,
    munkaviszony_vege: Option<String>,
    teljes_munkaido: bool,
    tabel_nomer: Option<String>,
}

// ─── preview_tabel ──────────────────────────────────────────────────────

#[tauri::command]
pub fn preview_tabel(
    fop_id: i64,
    year: i32,
    month: u32,
    worker_day_overrides: Vec<WorkerDayOverride>,
) -> Result<TabelPreviewDto, String> {
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
    let fop_short_name = make_fop_short_name(&fop_name);
    let (month_ukr, month_upper) = get_month_name_ukr(month);

    // 2. Month working days
    let days_in_month = get_days_in_month(year, month);
    let mut total_work_days = 0u32;
    for d in 1..=days_in_month {
        if is_weekday(year, month, d) {
            total_work_days += 1;
        }
    }

    // 3. Fetch workers
    let month_start_str = format!("{:04}-{:02}-01", year, month);
    let month_end_str = format!("{:04}-{:02}-{:02}", year, month, days_in_month);

    let mut stmt = conn
        .prepare(
            "SELECT s.id, COALESCE(s.kod, ''), s.vezeteknev, s.keresztnev, COALESCE(s.apai_nev, ''),
                    COALESCE(s.nem, ''), COALESCE(j.foglalkozas_megnevezes, ''), j.fizetes,
                    j.munkakezdes_datum, j.munkaviszony_vege, j.teljes_munkaido, j.tabel_nomer
             FROM jogviszony j
             JOIN szemely s ON j.munkavallalo_id = s.id
             WHERE j.fop_id = ?1
               AND (j.munkakezdes_datum IS NULL OR j.munkakezdes_datum <= ?2)
               AND (j.munkaviszony_vege IS NULL OR j.munkaviszony_vege >= ?3)
             ORDER BY j.tabel_nomer ASC, s.vezeteknev ASC, s.keresztnev ASC",
        )
        .map_err(|e| e.to_string())?;

    let worker_rows = stmt
        .query_map(params![fop_id, month_end_str, month_start_str], |r| {
            Ok(TabelWorkerRow {
                id: r.get(0)?,
                kod: r.get(1)?,
                vezeteknev: r.get(2)?,
                keresztnev: r.get(3)?,
                apai_nev: r.get(4)?,
                nem: r.get(5)?,
                foglalkozas: r.get(6)?,
                fizetes: r.get(7)?,
                munkakezdes_datum: r.get(8).ok().flatten(),
                munkaviszony_vege: r.get(9).ok().flatten(),
                teljes_munkaido: r.get::<_, Option<i32>>(10).ok().flatten().map(|v| v != 0).unwrap_or(true),
                tabel_nomer: r.get(11).ok().flatten(),
            })
        })
        .map_err(|e| e.to_string())?;

    // Build override lookup: (worker_id, day) -> (code, hours)
    let mut override_map: std::collections::HashMap<(i64, u32), (String, f64)> = std::collections::HashMap::new();
    for ov in &worker_day_overrides {
        let year_matches = ov.year.is_none() || ov.year == Some(year);
        let month_matches = ov.month.is_none() || ov.month == Some(month);
        if year_matches && month_matches {
            override_map.insert((ov.worker_id, ov.day), (ov.code.clone(), ov.hours));
        }
    }

    let mut rows = Vec::new();

    for w_res in worker_rows {
        let w = w_res.map_err(|e| e.to_string())?;

        let pib_posada = format!(
            "{} {} {}, {}",
            w.vezeteknev, w.keresztnev, w.apai_nev, w.foglalkozas
        )
        .trim()
        .to_string();

        let nem_short = if w.nem.contains("Жінка") || w.nem.to_lowercase().contains("ж") {
            "ж".to_string()
        } else {
            "ч".to_string()
        };

        // Determine worker code for tabel display
        let display_tabel_num = w.tabel_nomer.as_deref().unwrap_or("").trim().to_string();
        let final_worker_kod = if !display_tabel_num.is_empty() {
            display_tabel_num
        } else if !w.kod.is_empty() {
            w.kod.clone()
        } else {
            format!("{:04}", w.id)
        };

        // Check missing fields
        let mut missing = Vec::new();
        if w.tabel_nomer.as_deref().unwrap_or("").trim().is_empty() {
            missing.push("Табельний номер".to_string());
        }
        if w.nem.is_empty() {
            missing.push("Стать".to_string());
        }
        if w.munkakezdes_datum.is_none() {
            missing.push("Дата початку роботи".to_string());
        }

        // Default working hours: 8.0 for teljes_munkaido (повний), 4.0 if not (неповний)
        let default_hours = if w.teljes_munkaido { 8.0 } else { 4.0 };

        // Determine working range
        let hired_day = parse_day_of_month(&w.munkakezdes_datum, year, month);
        let dismissed_day = parse_day_of_month(&w.munkaviszony_vege, year, month);
        let start_d = hired_day.unwrap_or(1);
        let end_d = dismissed_day.unwrap_or(days_in_month);

        let mut days = Vec::new();
        let mut worker_total_days = 0u32;
        let mut worker_total_hours = 0.0f64;

        for d in 1..=days_in_month {
            let wd = is_weekday(year, month, d);
            let in_range = d >= start_d && d <= end_d;

            let (code, hours, is_worked) = if let Some((ref c, h)) = override_map.get(&(w.id, d)) {
                (c.clone(), *h, *h > 0.0)
            } else if wd && in_range {
                ("Р".to_string(), default_hours, true)
            } else {
                ("".to_string(), 0.0, false)
            };

            if is_worked {
                worker_total_days += 1;
                worker_total_hours += hours;
            }

            days.push(TabelDayEntry {
                day: d,
                is_weekday: wd,
                is_worked,
                code,
                hours,
            });
        }

        rows.push(TabelPreviewRowDto {
            worker_id: w.id,
            worker_kod: final_worker_kod,
            pib_posada,
            nem: nem_short,
            rate: w.fizetes,
            days,
            total_days: worker_total_days,
            total_hours: worker_total_hours,
            missing_fields: missing,
            month_name_ukr: Some(month_ukr.to_string()),
            year: Some(year),
            month: Some(month),
            teljes_munkaido: w.teljes_munkaido,
        });
    }

    Ok(TabelPreviewDto {
        fop_name,
        fop_code,
        fop_short_name,
        month_name_ukr: month_ukr.to_string(),
        month_name_upper: month_upper.to_string(),
        year,
        month,
        total_work_days,
        rows,
    })
}

// Helper for border-complete merged ranges
fn merge_cell(ws: &mut Worksheet, r1: u32, c1: u16, r2: u32, c2: u16, text: &str, fmt: &Format) {
    for r in r1..=r2 {
        for c in c1..=c2 {
            let _ = ws.write_blank(r, c, fmt);
        }
    }
    let _ = ws.merge_range(r1, c1, r2, c2, text, fmt);
}

fn col_to_letter(col: u16) -> String {
    let mut c = col + 1;
    let mut s = String::new();
    while c > 0 {
        let rem = (c - 1) % 26;
        s.insert(0, (b'A' + rem as u8) as char);
        c = (c - 1) / 26;
    }
    s
}

// ─── generate_tabel_excel ───────────────────────────────────────────────

#[tauri::command]
pub fn generate_tabel_excel(req: GenerateTabelRequest) -> Result<String, String> {
    let preview = preview_tabel(req.fop_id, req.year, req.month, req.worker_day_overrides)?;
    println!("GENERATE_TABEL_EXCEL WORKER ROWS: {}", preview.rows.len());

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    let font = "Arial";
    let days_in_month = get_days_in_month(req.year, req.month);

    // ─── Formats (Arial 8pt everywhere) ──────────────────────────────

    let fmt_title = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Left)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap()
        .set_border(FormatBorder::Thin);

    let fmt_forma = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Left)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap();

    let fmt_fop_name = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap()
        .set_border_bottom(FormatBorder::Thin);

    let fmt_subtitle = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap()
        .set_border(FormatBorder::Thin);

    let fmt_tabel_title = Format::new()
        .set_font_name(font)
        .set_font_size(16)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap();

    let fmt_header = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap()
        .set_border(FormatBorder::Thin);

    let fmt_header_bold = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap()
        .set_border(FormatBorder::Thin);

    let fmt_code_def = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Left)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap()
        .set_border(FormatBorder::Thin);

    let fmt_code_letter = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin);

    let fmt_code_num = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin);

    let fmt_data_center = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin);

    let fmt_data_left = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Left)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap()
        .set_border(FormatBorder::Thin);

    let fmt_data_num = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin);

    let fmt_total_label = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_bold()
        .set_align(FormatAlign::Left)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin);

    let fmt_total_num = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin);

    let fmt_footer = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Left)
        .set_align(FormatAlign::VerticalCenter);

    let fmt_footer_underline = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border_bottom(FormatBorder::Thin);

    let fmt_footer_small = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter);

    let fmt_edrpou = Format::new()
        .set_font_name(font)
        .set_font_size(10)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border_bottom(FormatBorder::Thin);

    let fmt_date_small = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin);

    let fmt_rate_num = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Right)
        .set_align(FormatAlign::VerticalCenter)
        .set_num_format("#,##0;-#,##0;\"-\"")
        .set_border(FormatBorder::Thin);

    // ─── Print Setup: 1-Page Landscape Fit (1 fekvő oldal széles, 2 oldal magas) ────
    worksheet.set_landscape();
    worksheet.set_paper_size(9); // 9 = A4 paper size in OpenXML/Excel
    worksheet.set_print_fit_to_pages(1, 2); // 1 page wide, 2 pages tall
    let _ = worksheet.set_page_breaks(&[29]); // Explicit page break after row 29 (legend end)

    // ─── Tight Column Widths (Ensures fitting within 1 landscape page) ──
    let _ = worksheet.set_column_width(0, 2.8);     // A
    let _ = worksheet.set_column_width(1, 10.5);    // B
    let _ = worksheet.set_column_width(2, 2.6);     // C
    let _ = worksheet.set_column_width(3, 4.0);     // D
    let _ = worksheet.set_column_width(4, 4.5);     // E
    let _ = worksheet.set_column_width(5, 8.0);     // F
    for c in 6..=21u16 {
        let _ = worksheet.set_column_width(c, 2.2); // G-V
    }
    let _ = worksheet.set_column_width(22, 3.0);   // W: днів
    let _ = worksheet.set_column_width(23, 3.2);   // X: годин
    for c in 24..=26u16 {
        let _ = worksheet.set_column_width(c, 3.6); // Y-AA
    }
    for c in 27..=37u16 {
        let _ = worksheet.set_column_width(c, 7.33); // AB-AL
    }
    for c in 38..=40u16 {
        let _ = worksheet.set_column_width(c, 4.5); // AM-AO
    }
    let _ = worksheet.set_column_width(41, 6.0);   // AP: Оклад

    // ─── ROWS 1-10: Header Area ─────────────────────────────────────

    // Row 1 (idx 0): AM1:AP3
    merge_cell(worksheet, 0, 38, 2, 41,
        "Типова форма № П-5\nЗАТВЕРДЖЕНО\nНаказ Держкомстату України\n05.12.2008  № 489",
        &fmt_forma);

    let fmt_subtitle_noborder = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap();

    let fmt_b6_subtitle = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap()
        .set_border_top(FormatBorder::Thin);

    let fmt_edrpou_label = Format::new()
        .set_font_name(font)
        .set_font_size(10)
        .set_bold()
        .set_align(FormatAlign::Left)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap();

    let fmt_noborder = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter);

    // Row 2 (idx 1): B2:AI2 = FOP name
    merge_cell(worksheet, 1, 1, 1, 34, &preview.fop_name, &fmt_fop_name);

    // Row 3 (idx 2): B3:AI3 = subtitle
    merge_cell(worksheet, 2, 1, 2, 34,
        "Найменування  підприємства (установи, організації)", &fmt_subtitle_noborder);

    // Row 5 (idx 4): B5:AI5
    merge_cell(worksheet, 4, 1, 4, 34, "", &fmt_subtitle_noborder);

    // Row 6 (idx 5): B6:AI6 (top border + bold)
    merge_cell(worksheet, 5, 1, 5, 34, "назва структурного підрозділу", &fmt_b6_subtitle);

    // ─── AJ7:AO9 (r6..=8, c35..=40) Full Borders Setup ───────────────
    for r in 6..=8u32 {
        for c in 35..=40u16 {
            let _ = worksheet.write_blank(r, c, &fmt_date_small);
        }
    }

    // Row 7 (idx 6): dates
    merge_cell(worksheet, 6, 35, 6, 36, "Дата заповнення", &fmt_date_small);
    merge_cell(worksheet, 6, 37, 6, 40, "Звітний період", &fmt_date_small);

    // Row 8 (idx 7): B8:G8 (cols 1..=6) = ЄДРПОУ label (size 10 & bold)
    merge_cell(worksheet, 7, 1, 7, 6, "Ідентифікаційний код  ЄДРПОУ", &fmt_edrpou_label);
    merge_cell(worksheet, 7, 7, 7, 20, &preview.fop_code, &fmt_edrpou);
    let fill_date = format!("{:02}.{:02}.{}", days_in_month, req.month, req.year);
    let fmt_date_bold = Format::new()
        .set_font_name(font)
        .set_font_size(8)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin);

    merge_cell(worksheet, 7, 35, 8, 36, &fill_date, &fmt_date_bold);   // AJ8:AK9 bold
    merge_cell(worksheet, 7, 37, 7, 38, "з", &fmt_date_small);
    merge_cell(worksheet, 7, 39, 7, 40, "по", &fmt_date_small);
    let period_start = format!("01.{:02}.{}", req.month, req.year);
    let period_end = format!("{:02}.{:02}.{}", days_in_month, req.month, req.year);
    merge_cell(worksheet, 8, 37, 8, 38, &period_start, &fmt_date_bold); // AL9:AM9 bold
    merge_cell(worksheet, 8, 39, 8, 40, &period_end, &fmt_date_bold);   // AN9:AO9 bold

    // Row 10-11 (idx 9-10): Main title (2 rows tall, 16pt)
    merge_cell(worksheet, 9, 1, 10, 34,
        "ТАБЕЛЬ ОБЛІКУ ВИКОРИСТАННЯ РОБОЧОГО ЧАСУ", &fmt_tabel_title);

    // Row 30 (idx 29): height 157.2pt
    let _ = worksheet.set_row_height(29, 157.2);

    // ─── B13:AP29 (r12..=28, c1..=41) Borders Pre-fill (Col 26 / AA borderless gap) ───
    for r in 12..=28u32 {
        for c in 1..=41u16 {
            if c == 26 {
                let _ = worksheet.write_blank(r, c, &fmt_noborder);
            } else {
                let _ = worksheet.write_blank(r, c, &fmt_code_def);
            }
        }
    }

    // Row 13-14 (idx 12-13): Legend headers
    merge_cell(worksheet, 12, 1, 13, 20, "Умовні позначення", &fmt_title);
    merge_cell(worksheet, 12, 21, 12, 25, "Код", &fmt_title);
    merge_cell(worksheet, 13, 21, 13, 23, "буквений", &fmt_subtitle);
    merge_cell(worksheet, 13, 24, 13, 25, "цифровий", &fmt_subtitle);

    merge_cell(worksheet, 12, 27, 13, 37, "Умовні позначення", &fmt_title);
    merge_cell(worksheet, 12, 38, 12, 41, "Код", &fmt_title);
    merge_cell(worksheet, 13, 38, 13, 39, "буквений", &fmt_subtitle);
    merge_cell(worksheet, 13, 40, 13, 41, "цифровий", &fmt_subtitle);

    // ─── ROWS 15-29 (idx 14-28): Code definitions ───

    let codes_left: Vec<(&str, &str, &str)> = vec![
        ("Години  роботи, передбачені колдоговором", "Р", "1"),
        ("Години роботи працівників, яким встановлено неповний робочий день (тиждень)  згідно з  законодавством", "РС", "2"),
        ("Вечірні години  роботи", "ВЧ", "3"),
        ("Нічні години  роботи", "РН", "4"),
        ("Надурочні години  роботи", "НУ", "5"),
        ("Години роботи у вихідні та святкові дні", "РВ", "6"),
        ("Відрядження", "ВД", "7"),
        ("Основна  щорічна відпустка (ст.6 Закону України \"Про відпустки\")", "В", "8"),
        ("Щорічна додаткова відпустка (ст. 7, 8 Закону України \"Про відпустки\")", "Д", "9"),
        ("Додаткова відпустка, передбачена  ст. 20, 21, 30 Закону України \"Про статус і соціальний захист громадян, які постраждали внаслідок Чорнобильської катастрофи\"", "Ч", "10"),
        ("Творча відпустка (ст.16 Закону України \"Про відпустки\")", "ТВ", "11"),
        ("Додаткова відпустка у зв’язку з навчанням  (ст.13, 14, 15, 151 Закону України \"Про відпустки\")", "Н", "12"),
        ("Відпустка без збереження заробітної плати у зв’язку з навчанням (п.12, 13, 17 ст. 25 Закону України \"Про відпустки\")", "НБ", "13"),
        ("Додаткова відпустка без збереження заробітної плати в обов’язковому порядку (ст. 25 крім п. 3, 12, 13, 17 Закону України \"Про відпустки\" )", "ДБ", "14"),
        ("Додаткова оплачувана відпустка працівникам, які мають дітей (ст. 19 Закону України \"Про відпустки\")  ", "ДО", "15"),
    ];

    let codes_right: Vec<(&str, &str, &str)> = vec![
        ("Відпустка у зв’язку з вагітністю і пологами (стаття 17 Закону України \"Про відпустки\") та відпустка для догляду за дитиною до досягнення нею трирічного віку (ст. 18 Закону України «Про відпустки»)", "ВП", "16"),
        ("Відпустка для догляду за дитиною до досягнення нею 6-ти річного віку (ст. 25 п.3 Закону України \"Про відпустки\")", "ДД", "17"),
        ("Відпустка без збереження заробітної плати за згодою сторін (стаття 26 Закону України \"Про відпустки\")", "НА", "18"),
        ("Інші відпустки без збереження заробітної плати (на період припинення виконання робіт)", "БЗ", "19"),
        ("Неявки у зв’язку з переведенням за ініціативою роботодавця на неповний робочий день (тиждень)", "НД", "20"),
        ("Неявки у зв’язку з тимчасовим переведенням на роботу на інше підприємство на підставі договорів між суб’єктами господарювання", "НП", "21"),
        ("Інший невідпрацьований час, передбачений законодавством (виконання державних і громадських обов’язків, допризовна підготовка, військові збори, донорські, відгул і т.ін.) ", "ІН", "22"),
        ("Простої", "П", "23"),
        ("Прогули", "ПР", "24"),
        ("Масові невиходи на роботу (страйки) ", "С", "25"),
        ("Оплачувана тимчасова непрацездатність ", "ТН", "26"),
        ("Неоплачувана тимчасова непрацездатність у випадках, передбачених законодавством (у зв’язку з побутовою травмою та ін. підтверджена довідками лікувальних закладів)", "НН", "27"),
        ("Неявки з нез’ясованих причин", "НЗ", "28"),
        ("Інші види неявок, передбачених колективними договорами, угодами ", "ІВ", "29"),
        ("Інші причини неявок", "І", "30"),
    ];

    for (i, (desc, code, num)) in codes_left.iter().enumerate() {
        let r = 14 + i as u32;
        let _ = worksheet.set_row_height(r, 30.0);
        merge_cell(worksheet, r, 1, r, 20, desc, &fmt_code_def);
        merge_cell(worksheet, r, 21, r, 23, code, &fmt_code_letter);
        merge_cell(worksheet, r, 24, r, 25, num, &fmt_code_num);
        let _ = worksheet.write_blank(r, 26, &fmt_noborder);
    }

    for (i, (desc, code, num)) in codes_right.iter().enumerate() {
        let r = 14 + i as u32;
        let _ = worksheet.set_row_height(r, 30.0);
        merge_cell(worksheet, r, 27, r, 37, desc, &fmt_code_def);
        merge_cell(worksheet, r, 38, r, 39, code, &fmt_code_letter);
        merge_cell(worksheet, r, 40, r, 41, num, &fmt_code_num);
    }

    // ─── ROWS 31-36 (idx 30-35): Table Headers ─────────────────────

    let hdr_start = 30u32;

    // Rows 32-33 (idx 31-32): 58.5pt height
    let _ = worksheet.set_row_height(31, 58.5);
    let _ = worksheet.set_row_height(32, 58.5);

    // Row 31: main headers
    merge_cell(worksheet, hdr_start, 0, hdr_start + 5, 0, "№  п/п", &fmt_header_bold);
    merge_cell(worksheet, hdr_start, 1, hdr_start + 5, 1, "Табельний  номер", &fmt_header_bold);
    merge_cell(worksheet, hdr_start, 2, hdr_start + 5, 2, "Стать  (ч/ж)", &fmt_header_bold);
    merge_cell(worksheet, hdr_start, 3, hdr_start + 5, 5, "ПІБ, посада", &fmt_header_bold);
    merge_cell(worksheet, hdr_start, 6, hdr_start, 21, "Відмітки  про явки та неявки за числами місяця (годин)", &fmt_header_bold);
    merge_cell(worksheet, hdr_start, 22, hdr_start, 27, "Відпрацьовано за місяць", &fmt_header_bold);
    merge_cell(worksheet, hdr_start, 28, hdr_start + 2, 28, "Всього неявок", &fmt_header);
    merge_cell(worksheet, hdr_start, 29, hdr_start, 40, "з причин за місяць", &fmt_header);
    merge_cell(worksheet, hdr_start, 41, hdr_start + 5, 41, "Оклад, тарифна ставка, грн", &fmt_header_bold);

    // Row 32 (idx 31): day numbers 1-15, х, днів, годин
    for d in 1..=15u32 {
        let col = 5 + d as u16; // col 6 = day 1, col 20 = day 15
        merge_cell(worksheet, hdr_start + 1, col, hdr_start + 2, col, &d.to_string(), &fmt_header);
    }
    merge_cell(worksheet, hdr_start + 1, 21, hdr_start + 2, 21, "х", &fmt_header);
    merge_cell(worksheet, hdr_start + 1, 22, hdr_start + 5, 22, "днів", &fmt_header_bold);

    // X header: годин + subheaders
    merge_cell(worksheet, hdr_start + 1, 23, hdr_start + 1, 27, "годин", &fmt_header);
    merge_cell(worksheet, hdr_start + 2, 23, hdr_start + 5, 23, "всього", &fmt_header);
    merge_cell(worksheet, hdr_start + 2, 24, hdr_start + 2, 27, "з них:", &fmt_header);

    // Row 32-33: absence category headers (AD-AO)
    let absence_headers = [
        "основна та додат- кова від- пустки",
        "відпуст- ки у зв’яз- ку з нав- чанням, творчі, в обов. порядку та інші ",
        "відпуст- ки без збере- ження заробіт- ної плати за згодою сторін",
        "відпуст- ки без збере- ження з/п на період припи- нення виконан-ня робіт",
        "перевод на непов- ний робочий день (тиж- день)",
        "тимча- совий перевод на інше підпри- ємство",
        "простої",
        "прогули",
        "страйки",
        "тимча- сова непра- цездат- ність",
        "інші",
    ];
    for (i, hdr) in absence_headers.iter().enumerate() {
        let col = 29 + i as u16;
        merge_cell(worksheet, hdr_start + 1, col, hdr_start + 2, col, hdr, &fmt_header);
    }
    merge_cell(worksheet, hdr_start + 1, 40, hdr_start + 2, 40, "", &fmt_header);

    // Row 34 (idx 33): day numbers 16-31
    for d in 16..=31u32 {
        if d <= days_in_month {
            let col = (d - 16 + 6) as u16;
            merge_cell(worksheet, hdr_start + 3, col, hdr_start + 5, col, &d.to_string(), &fmt_header);
        }
    }

    // Subheaders Y-AB row 34: надурочно, нічних, вечірніх, вихідних
    merge_cell(worksheet, hdr_start + 3, 24, hdr_start + 5, 24, "над-\nуроч-\nно", &fmt_header);
    merge_cell(worksheet, hdr_start + 3, 25, hdr_start + 5, 25, "ніч-\nних", &fmt_header);
    merge_cell(worksheet, hdr_start + 3, 26, hdr_start + 5, 26, "вечір-ніх", &fmt_header);
    merge_cell(worksheet, hdr_start + 3, 27, hdr_start + 5, 27, "вихідних, святко-\nвих", &fmt_header);
    merge_cell(worksheet, hdr_start + 3, 28, hdr_start + 4, 28, "години", &fmt_header);

    // Code references row 34-35 (AD-AO)
    let code_refs = [
        "коди\r\n8-10", "коди\r\n11-15, 17,22", "коди \r\n18", "коди\r\n19", "коди\r\n20",
        "коди\r\n21", "коди\r\n23", "коди\r\n24", "коди\r\n25", "коди\r\n26-27", "коди\r\n28-30",
    ];
    for (i, cr) in code_refs.iter().enumerate() {
        let col = 29 + i as u16;
        merge_cell(worksheet, hdr_start + 3, col, hdr_start + 4, col, cr, &fmt_header);
    }
    merge_cell(worksheet, hdr_start + 3, 40, hdr_start + 4, 40, "", &fmt_header);

    // Row 36 (idx 35): units row (дні, дні/год.)
    let _ = worksheet.write_with_format(hdr_start + 5, 28, "дні", &fmt_header);
    for c in 29..=40u16 {
        let _ = worksheet.write_with_format(hdr_start + 5, c, "дні/год.", &fmt_header);
    }

    // ─── DATA ROWS (4 rows per worker: hours1-15, codes1-15, hours16-31, codes16-31) ───

    let data_start = 36u32; // row index 36 = Excel row 37
    let worker_count = preview.rows.len();

    for (idx, row) in preview.rows.iter().enumerate() {
        let base_r = data_start + (idx as u32 * 4);

        // Set row heights
        for dr in 0..4u32 {
            let _ = worksheet.set_row_height(base_r + dr, 15.0);
        }

        // A: № п/п (merged 4 rows)
        merge_cell(worksheet, base_r, 0, base_r + 3, 0, &(idx + 1).to_string(), &fmt_data_center);
        // B: Таб. номер
        merge_cell(worksheet, base_r, 1, base_r + 3, 1, &row.worker_kod, &fmt_data_center);
        // C: Стать
        merge_cell(worksheet, base_r, 2, base_r + 3, 2, &row.nem, &fmt_data_center);
        // D-F: ПІБ, посада
        merge_cell(worksheet, base_r, 3, base_r + 3, 5, &row.pib_posada, &fmt_data_left);

        // W: днів (merged 4 rows)
        merge_cell(worksheet, base_r, 22, base_r + 3, 22, "", &fmt_data_num);
        let _ = worksheet.write_formula_with_format(base_r, 22, Formula::new(format!("COUNTIF(G{}:V{}, \">0\")", base_r + 1, base_r + 4)), &fmt_data_num);

        // X: годин (merged 4 rows)
        merge_cell(worksheet, base_r, 23, base_r + 3, 23, "", &fmt_data_num);
        let hours_mult = if row.teljes_munkaido { 8 } else { 4 };
        let _ = worksheet.write_formula_with_format(base_r, 23, Formula::new(format!("W{}*{}", base_r + 1, hours_mult)), &fmt_data_num);

        // Y-AB: empty merged
        for c in 24..=27u16 {
            merge_cell(worksheet, base_r, c, base_r + 3, c, "", &fmt_data_center);
        }

        // AC-AO: empty merged (2 rows each)
        for c in 28..=40u16 {
            merge_cell(worksheet, base_r, c, base_r + 1, c, "", &fmt_data_center);
            merge_cell(worksheet, base_r + 2, c, base_r + 3, c, "", &fmt_data_center);
        }

        // AP: Ставка (merged 4 rows)
        merge_cell(worksheet, base_r, 41, base_r + 3, 41, "", &fmt_rate_num);
        let _ = worksheet.write_number_with_format(base_r, 41, row.rate, &fmt_rate_num);

        // Row 1 (base_r): Hours for days 1-15 (numeric cells)
        // Row 2 (base_r+1): Codes for days 1-15 (formula cells IF(cell,"Р"," "))
        for d in 1..=15u32 {
            let col = 5 + d as u16; // col 6..20
            if d <= days_in_month {
                let day_entry = &row.days[(d - 1) as usize];
                if day_entry.hours > 0.0 {
                    let _ = worksheet.write_number_with_format(base_r, col, day_entry.hours, &fmt_data_center);
                } else {
                    let _ = worksheet.write_string_with_format(base_r, col, "", &fmt_data_center);
                }
                if !day_entry.code.is_empty() {
                    let col_letter = col_to_letter(col);
                    let cell_above = format!("{}{}", col_letter, base_r + 1);
                    if day_entry.code == "Р" {
                        let _ = worksheet.write_formula_with_format(base_r + 1, col, Formula::new(format!("IF({},\"Р\",\" \")", cell_above)), &fmt_data_center);
                    } else {
                        let _ = worksheet.write_string_with_format(base_r + 1, col, &day_entry.code, &fmt_data_center);
                    }
                } else {
                    let _ = worksheet.write_string_with_format(base_r + 1, col, "", &fmt_data_center);
                }
            } else {
                let _ = worksheet.write_string_with_format(base_r, col, "", &fmt_data_center);
                let _ = worksheet.write_string_with_format(base_r + 1, col, "", &fmt_data_center);
            }
        }
        // V col (21) = "х" separator
        let _ = worksheet.write_string_with_format(base_r, 21, "х", &fmt_data_center);
        let _ = worksheet.write_string_with_format(base_r + 1, 21, "х", &fmt_data_center);

        // Row 3 (base_r+2): Hours for days 16-31 (numeric cells)
        // Row 4 (base_r+3): Codes for days 16-31 (formula cells IF(cell,"Р"," "))
        for d in 16..=31u32 {
            let col = (d - 16 + 6) as u16;
            if d <= days_in_month {
                let day_entry = &row.days[(d - 1) as usize];
                if day_entry.hours > 0.0 {
                    let _ = worksheet.write_number_with_format(base_r + 2, col, day_entry.hours, &fmt_data_center);
                } else {
                    let _ = worksheet.write_string_with_format(base_r + 2, col, "", &fmt_data_center);
                }
                if !day_entry.code.is_empty() {
                    let col_letter = col_to_letter(col);
                    let cell_above = format!("{}{}", col_letter, base_r + 3);
                    if day_entry.code == "Р" {
                        let _ = worksheet.write_formula_with_format(base_r + 3, col, Formula::new(format!("IF({},\"Р\",\" \")", cell_above)), &fmt_data_center);
                    } else {
                        let _ = worksheet.write_string_with_format(base_r + 3, col, &day_entry.code, &fmt_data_center);
                    }
                } else {
                    let _ = worksheet.write_string_with_format(base_r + 3, col, "", &fmt_data_center);
                }
            } else {
                let _ = worksheet.write_string_with_format(base_r + 2, col, "", &fmt_data_center);
                let _ = worksheet.write_string_with_format(base_r + 3, col, "", &fmt_data_center);
            }
        }
        // remaining cols in row 3-4 if month has < 31 days
        for d in (days_in_month + 1)..=31u32 {
            if d >= 16 {
                let col = (d - 16 + 6) as u16;
                let _ = worksheet.write_string_with_format(base_r + 2, col, "", &fmt_data_center);
                let _ = worksheet.write_string_with_format(base_r + 3, col, "", &fmt_data_center);
            }
        }
    }

    // ─── TOTALS ROW ─────────────────────────────────────────────────

    let total_r = data_start + (worker_count as u32 * 4);
    let _ = worksheet.set_row_height(total_r, 14.0);
    merge_cell(worksheet, total_r, 0, total_r, 21, "РАЗОМ:", &fmt_total_label);

    let first_worker_row = data_start + 1; // 37
    let last_worker_row = total_r;         // e.g. 40 if 1 worker
    let _ = worksheet.write_formula_with_format(total_r, 22, Formula::new(format!("SUM(W{}:W{})", first_worker_row, last_worker_row)), &fmt_total_num);
    let _ = worksheet.write_formula_with_format(total_r, 23, Formula::new(format!("SUM(X{}:X{})", first_worker_row, last_worker_row)), &fmt_total_num);

    for c in 24..=41u16 {
        let _ = worksheet.write_string_with_format(total_r, c, "", &fmt_total_num);
    }

    // ─── FOOTER: Signatures & Notes (Matching ТАБЕЛЬ березень.xlsx 1:1) ───

    let sig_r = total_r + 2; // Excel Row 43 (if 1 worker)
    let _ = worksheet.set_row_height(sig_r, 13.0);
    let _ = worksheet.set_row_height(sig_r + 1, 11.25);

    // Row 43: Labels
    merge_cell(worksheet, sig_r, 1, sig_r, 4, "Відповідальна особа", &fmt_footer);
    merge_cell(worksheet, sig_r, 5, sig_r, 16, "", &fmt_footer_underline);
    merge_cell(worksheet, sig_r, 20, sig_r, 24, "Керівник структурного ", &fmt_footer);
    merge_cell(worksheet, sig_r, 25, sig_r, 31, "", &fmt_footer_underline);
    merge_cell(worksheet, sig_r, 33, sig_r, 35, "Працівник кадрової", &fmt_footer);
    merge_cell(worksheet, sig_r, 36, sig_r, 41, "", &fmt_footer_underline);

    // Row 44: Sub-labels
    merge_cell(worksheet, sig_r + 1, 5, sig_r + 1, 16, "(посада)", &fmt_footer_small);
    merge_cell(worksheet, sig_r + 1, 20, sig_r + 1, 24, "підрозділу", &fmt_footer);
    merge_cell(worksheet, sig_r + 1, 25, sig_r + 1, 31, "(посада)", &fmt_footer_small);
    merge_cell(worksheet, sig_r + 1, 33, sig_r + 1, 35, "служби", &fmt_footer);
    merge_cell(worksheet, sig_r + 1, 36, sig_r + 1, 41, "(посада)", &fmt_footer_small);

    // Row 47: Signatures & Dates
    merge_cell(worksheet, sig_r + 4, 1, sig_r + 4, 4, "\"____\"___________20___р.", &fmt_footer);
    merge_cell(worksheet, sig_r + 4, 5, sig_r + 4, 7, "", &fmt_footer_underline);
    merge_cell(worksheet, sig_r + 4, 9, sig_r + 4, 16, "", &fmt_footer_underline);

    merge_cell(worksheet, sig_r + 4, 20, sig_r + 4, 24, "\"____\"___________20___р.", &fmt_footer);
    merge_cell(worksheet, sig_r + 4, 25, sig_r + 4, 27, "", &fmt_footer_underline);
    merge_cell(worksheet, sig_r + 4, 29, sig_r + 4, 31, &preview.fop_short_name, &fmt_footer_underline);

    merge_cell(worksheet, sig_r + 4, 33, sig_r + 4, 35, "\"____\"___________20___р.", &fmt_footer);
    merge_cell(worksheet, sig_r + 4, 36, sig_r + 4, 37, "", &fmt_footer_underline);
    merge_cell(worksheet, sig_r + 4, 39, sig_r + 4, 41, "", &fmt_footer_underline);

    // Row 48: Underline labels
    merge_cell(worksheet, sig_r + 5, 5, sig_r + 5, 7, "(підпис)", &fmt_footer_small);
    merge_cell(worksheet, sig_r + 5, 9, sig_r + 5, 16, "(ПІБ)", &fmt_footer_small);
    merge_cell(worksheet, sig_r + 5, 25, sig_r + 5, 27, "(підпис)", &fmt_footer_small);
    merge_cell(worksheet, sig_r + 5, 29, sig_r + 5, 31, "(ПІБ)", &fmt_footer_small);
    merge_cell(worksheet, sig_r + 5, 36, sig_r + 5, 37, "(підпис)", &fmt_footer_small);
    merge_cell(worksheet, sig_r + 5, 39, sig_r + 5, 41, "(ПІБ)", &fmt_footer_small);

    // Notes 1 & 2 (Rows 50, 51, 52 from ТАБЕЛЬ березень.xlsx)
    let note_r = sig_r + 7; // Row 50
    let _ = worksheet.write_string_with_format(note_r, 1, "Примітка. ", &fmt_footer);
    let note_1 = "1. На безперервно діючих підприємствах, в установах, організаціях, а також в окремих виробництвах, цехах, дільницях, відділеннях і на деяких видах робіт, де за умовами виробництва (роботи) не може бути додержана встановлена для даної категорії працівників щоденна або щотижнева тривалість робочого часу, допускається за погодженням з виборним органом первинної профспілкової організації (профспілковим представником) розрахунок підсумованого фонду робочого часу за місяць, по кожному працівнику. При цьому фонд робочого часу не повинен перевищувати нормальної його тривалості. ";
    let note_2 = "2. Форма носить рекомендаційний характер і складається із мінімальної кількості показників, необхідних для заповнення форм державних статистичних спостережень. При необхідності форма може бути доповнена іншими показниками, необхідними для обліку на підприємстві.";

    merge_cell(worksheet, note_r + 1, 1, note_r + 1, 41, note_1, &fmt_subtitle);
    merge_cell(worksheet, note_r + 2, 1, note_r + 2, 41, note_2, &fmt_subtitle);

    // Row 55 height = 37.5pt (0-indexed row 54)
    let _ = worksheet.set_row_height(54, 37.5);

    // ─── Save ───────────────────────────────────────────────────────

    let filename = format!("ТАБЕЛЬ_{}_{}.xlsx", preview.month_name_ukr, preview.year);
    let output_path = if let Some(ref dir) = req.save_dir {
        let p = Path::new(dir);
        if !p.exists() {
            let _ = fs::create_dir_all(p);
        }
        p.join(&filename).to_string_lossy().to_string()
    } else {
        filename
    };

    workbook.save(&output_path).map_err(|e| format!("Failed to save Tabel Excel: {}", e))?;
    Ok(output_path)
}

// ─── preview_tabel_period ────────────────────────────────────────────────

#[tauri::command]
pub fn preview_tabel_period(
    fop_id: i64,
    start_year: i32,
    start_month: u32,
    end_year: i32,
    end_month: u32,
    worker_day_overrides: Vec<WorkerDayOverride>,
) -> Result<TabelPreviewDto, String> {
    let mut cur_year = start_year;
    let mut cur_month = start_month;

    let mut combined_rows = Vec::new();
    let mut last_dto: Option<TabelPreviewDto> = None;

    while (cur_year < end_year) || (cur_year == end_year && cur_month <= end_month) {
        if let Ok(dto) = preview_tabel(fop_id, cur_year, cur_month, worker_day_overrides.clone()) {
            for row in &dto.rows {
                combined_rows.push(row.clone());
            }
            if last_dto.is_none() {
                last_dto = Some(dto);
            }
        }

        if cur_month == 12 {
            cur_year += 1;
            cur_month = 1;
        } else {
            cur_month += 1;
        }
    }

    if let Some(mut base) = last_dto {
        base.rows = combined_rows;
        Ok(base)
    } else {
        Err("Failed to load period preview".to_string())
    }
}

// ─── generate_tabel_period_excel ────────────────────────────────────────

#[tauri::command]
pub fn generate_tabel_period_excel(req: GenerateTabelPeriodRequest) -> Result<String, String> {
    let mut cur_year = req.start_year;
    let mut cur_month = req.start_month;
    let mut last_path = String::new();

    while (cur_year < req.end_year) || (cur_year == req.end_year && cur_month <= req.end_month) {
        let single_req = GenerateTabelRequest {
            fop_id: req.fop_id,
            year: cur_year,
            month: cur_month,
            worker_day_overrides: req.worker_day_overrides.clone(),
            save_dir: req.save_dir.clone(),
        };

        let path = generate_tabel_excel(single_req)?;
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_tabel_exact() {
        // Unit test stub
        assert!(true);
    }
}
