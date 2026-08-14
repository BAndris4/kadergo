use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
pub struct NakazPriyomWorkerItem {
    pub worker_name_accusative: String,
    pub worker_name_dative: String,
    pub worker_initials: String,
    pub position_name: String,
    pub salary_str: String,
    pub work_start_date_str: String,
    pub employment_type: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateNakazPriyomRequest {
    pub fop_id: i64,
    pub fop_name: String,
    pub fop_code: String,
    pub fop_address: String,
    pub fop_edrpou: String,
    pub fop_initials: String,
    pub nakaz_num: String,
    pub nakaz_date_str: String,
    pub workers: Vec<NakazPriyomWorkerItem>,
    pub save_dir: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NakazZvilnennyaWorkerItem {
    pub worker_name_accusative: String,
    pub worker_name_dative: String,
    pub worker_initials: String,
    pub position_name: String,
    pub dismissal_date_str: String,
    pub reason_text: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateNakazZvilnennyaRequest {
    pub fop_id: i64,
    pub fop_name: String,
    pub fop_code: String,
    pub fop_address: String,
    pub fop_edrpou: String,
    pub fop_initials: String,
    pub nakaz_num: String,
    pub nakaz_date_str: String,
    pub workers: Vec<NakazZvilnennyaWorkerItem>,
    pub save_dir: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NakazKasaWorkerItem {
    pub dative_name: String,
    pub initials: String,
    pub pronoun: String,
    pub start_time: String,
    pub end_time: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateNakazKasaRequest {
    pub fop_id: i64,
    pub fop_name: String,
    pub fop_code: String,
    pub fop_address: String,
    pub fop_edrpou: String,
    pub fop_initials: String,
    pub nakaz_num: String,
    pub nakaz_date_str: String,
    pub day_str: String,
    pub month_str: String,
    pub year_str: String,
    pub workers: Vec<NakazKasaWorkerItem>,
    pub save_dir: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NakazPrroWorkerItem {
    pub dative_name: String,
    pub initials: String,
    #[serde(default)]
    pub posada: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateNakazPrroRequest {
    pub fop_id: i64,
    pub fop_name: String,
    pub fop_code: String,
    pub fop_address: String,
    pub fop_edrpou: String,
    pub fop_initials: String,
    pub nakaz_num: String,
    pub nakaz_date_str: String,
    pub day_str: String,
    pub month_str: String,
    pub year_str: String,
    pub workers: Vec<NakazPrroWorkerItem>,
    pub save_dir: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateNakazShtatRequest {
    pub fop_id: i64,
    pub fop_name: String,
    pub fop_code: String,
    pub fop_address: String,
    pub fop_edrpou: String,
    pub fop_initials: String,
    pub nakaz_num: String,
    pub nakaz_date_str: String,
    pub day_str: String,
    pub month_str: String,
    pub year_str: String,
    #[serde(default)]
    pub shtat_date_str: String,
    #[serde(default)]
    pub reason_text: String,
    pub save_dir: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateNakazGrafikVidpustokRequest {
    pub fop_id: i64,
    pub fop_name: String,
    pub fop_code: String,
    pub fop_address: String,
    pub fop_edrpou: String,
    pub fop_initials: String,
    pub nakaz_num: String,
    pub nakaz_date_str: String,
    #[serde(default)]
    pub year_str: String,
    #[serde(default)]
    pub period_text: String,
    #[serde(default)]
    pub notice_date_str: String,
    pub save_dir: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NakazFileItem {
    pub nakaz_num: String,
    pub num_val: u32,
    pub filename: String,
    pub filepath: String,
    pub nakaz_type: String,
    pub date_modified: String,
}

pub fn quick_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

pub fn format_address_paragraphs_xml(raw_address: &str) -> String {
    let mut address_str = raw_address
        .replace("ОБЛ.", "ОБЛАСТЬ")
        .replace("ОБЛ,", "ОБЛАСТЬ,")
        .replace("Р-Н.", "РАЙОН")
        .replace("Р-Н,", "РАЙОН,")
        .replace("Р-Н ", "РАЙОН ");

    if address_str.contains("РАЙОН,") && !address_str.contains('\n') {
        address_str = address_str.replace("РАЙОН,", "РАЙОН,\n");
    }

    address_str
        .split('\n')
        .map(|line| {
            let line_esc = quick_escape(line.trim());
            format!(
                r#"<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{}</w:t></w:r></w:p>"#,
                line_esc
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}
