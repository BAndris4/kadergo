use serde::Deserialize;
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

#[derive(Debug, Clone, Deserialize)]
pub struct ShtatPositionItem {
    pub position_name: String,
    pub units: f64,
    pub base_salary: f64,
    pub allowances: f64,
    pub total_fund: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateShtatDocxRequest {
    pub fop_id: i64,
    pub fop_name: String,
    pub date_str: String, // e.g. "01 січня 2026 р."
    pub items: Vec<ShtatPositionItem>,
    pub save_dir: Option<String>,
}

fn get_year_month_filename_part(date_str: &str) -> String {
    let parts: Vec<&str> = date_str.split_whitespace().collect();
    if parts.len() >= 3 {
        let month_genitive = parts[1];
        let year = parts[2].trim_end_matches("р.").trim();
        let month_nom = match month_genitive {
            "січня" => "січень",
            "лютого" => "лютий",
            "березня" => "березень",
            "квітня" => "квітень",
            "травня" => "травень",
            "червня" => "червень",
            "липня" => "липень",
            "серпня" => "серпень",
            "вересня" => "вересень",
            "жовтня" => "жовтень",
            "листопада" => "листопад",
            "грудня" => "грудень",
            other => other,
        };
        format!("{} {}", year, month_nom)
    } else {
        "2026".to_string()
    }
}

#[tauri::command]
pub fn generate_shtat_docx(req: GenerateShtatDocxRequest) -> Result<String, String> {
    let ym_part = get_year_month_filename_part(&req.date_str);
    let filename = format!("shtat {}.docx", ym_part);
    let output_path = if let Some(ref dir) = req.save_dir {
        let p = Path::new(dir);
        if !p.exists() {
            let _ = fs::create_dir_all(p);
        }
        p.join(&filename).to_string_lossy().to_string()
    } else {
        filename
    };

    let out_file = File::create(&output_path).map_err(|e| format!("Cannot create output docx file: {}", e))?;
    let mut zip = ZipWriter::new(out_file);
    let options = SimpleFileOptions::default();

    // 1. [Content_Types].xml
    let content_types = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"#;

    zip.start_file("[Content_Types].xml", options).map_err(|e| e.to_string())?;
    zip.write_all(content_types.as_bytes()).map_err(|e| e.to_string())?;

    // 2. _rels/.rels
    let rels = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"#;

    zip.start_file("_rels/.rels", options).map_err(|e| e.to_string())?;
    zip.write_all(rels.as_bytes()).map_err(|e| e.to_string())?;

    // Calculate totals
    let mut total_units: f64 = 0.0;
    let mut total_payroll: f64 = 0.0;

    for item in &req.items {
        total_units += item.units;
        total_payroll += item.total_fund;
    }

    let total_units_str = format_unit_val(total_units);
    let total_payroll_str = format_ukr_currency(total_payroll);
    let fop_name_upper = quick_escape(&req.fop_name.to_uppercase());
    let date_escaped = quick_escape(&req.date_str);

    // Build Table Rows XML with Times New Roman, 0 spacing, and small cell padding
    let mut table_rows_xml = String::new();
    for (idx, item) in req.items.iter().enumerate() {
        let item_idx = idx + 1;
        let pos_name = quick_escape(&item.position_name);
        let units_str = format_unit_val(item.units);
        let base_sal_str = format_ukr_currency(item.base_salary);
        let allowances_str = if item.allowances > 0.0 {
            format_ukr_currency(item.allowances)
        } else {
            "-".to_string()
        };
        let fund_str = format_ukr_currency(item.total_fund);

        table_rows_xml.push_str(&format!(
            r#"<w:tr w:rsidR="00DA21EB" w:rsidTr="00DA21EB"><w:trPr><w:cantSplit/><w:trHeight w:val="495"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="534" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/></w:tcBorders></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/></w:rPr><w:t>{}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/></w:tcBorders></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRPr="0092440B" w:rsidRDefault="009A141D"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr><w:t>{}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1276" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/></w:tcBorders></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRPr="0092440B" w:rsidRDefault="009A141D"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr><w:t>{}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1134" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/></w:tcBorders></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRDefault="006246F8" w:rsidP="000E2133"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr><w:t>{}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1276" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/></w:tcBorders></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRPr="0092440B" w:rsidRDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr><w:t>{}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1417" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/></w:tcBorders></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRPr="00864C6E" w:rsidRDefault="006246F8" w:rsidP="000E2133"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr><w:t>{}</w:t></w:r></w:p></w:tc></w:tr>"#,
            item_idx, pos_name, units_str, base_sal_str, allowances_str, fund_str
        ));
    }

    // Summary row XML with Times New Roman, 0 spacing, and small cell padding
    let summary_row_xml = format!(
        r#"<w:tr w:rsidR="00DA21EB" w:rsidTr="00DA21EB"><w:trPr><w:cantSplit/><w:trHeight w:val="693"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="534" w:type="dxa"/></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRPr="00DA21EB" w:rsidRDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRPr="00DA21EB" w:rsidRDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr><w:t>Всього</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1276" w:type="dxa"/></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1134" w:type="dxa"/></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1276" w:type="dxa"/></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1417" w:type="dxa"/></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRPr="00CC3757" w:rsidRDefault="006246F8" w:rsidP="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/><w:lang w:val="uk-UA"/></w:rPr><w:t>{}</w:t></w:r></w:p></w:tc></w:tr>"#,
        total_payroll_str
    );

    // 3. word/document.xml with small cell padding (80 dxa top/bottom, 120 dxa left/right)
    let doc_xml = format!(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se w16cid wp14"><w:body><w:tbl><w:tblPr><w:tblW w:w="9639" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblLook w:val="0000" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="0"/></w:tblPr><w:tblGrid><w:gridCol w:w="5211"/><w:gridCol w:w="236"/><w:gridCol w:w="4192"/></w:tblGrid><w:tr w:rsidR="00E23420" w:rsidTr="001A5B8E"><w:trPr><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="5211" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRDefault="00DA21EB" w:rsidP="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr><w:r w:rsidRPr="009A141D"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="ru-RU"/></w:rPr><w:t>Фізична особа-підприємець</w:t></w:r></w:p><w:p w:rsidR="009A141D" w:rsidRPr="008F4110" w:rsidRDefault="008F4110" w:rsidP="009A141D"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:u w:val="single"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr><w:r w:rsidRPr="008F4110"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:u w:val="single"/><w:lang w:val="uk-UA"/></w:rPr><w:t>{}</w:t></w:r></w:p><w:p w:rsidR="00E23420" w:rsidRPr="0092440B" w:rsidRDefault="009A141D" w:rsidP="009A141D"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr><w:r w:rsidRPr="0092440B"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:lang w:val="ru-RU"/></w:rPr><w:t xml:space="preserve"> </w:t></w:r><w:r w:rsidR="00E23420" w:rsidRPr="0092440B"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:lang w:val="ru-RU"/></w:rPr><w:t>(назва підприємства)</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="236" w:type="dxa"/></w:tcPr><w:p w:rsidR="00E23420" w:rsidRPr="0092440B" w:rsidRDefault="00E23420"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="22"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="4192" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr><w:p w:rsidR="00E23420" w:rsidRPr="00D97E65" w:rsidRDefault="00E23420" w:rsidP="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr><w:r w:rsidRPr="00D97E65"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr><w:t>ЗАТВЕРДЖУЮ</w:t></w:r></w:p><w:p w:rsidR="00E23420" w:rsidRPr="00D97E65" w:rsidRDefault="00E23420" w:rsidP="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr><w:r w:rsidRPr="00D97E65"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr><w:t xml:space="preserve">штат у кількості </w:t></w:r><w:r w:rsidR="009A141D"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:u w:val="single"/><w:lang w:val="ru-RU"/></w:rPr><w:t>{}</w:t></w:r><w:r w:rsidRPr="00D97E65"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr><w:t xml:space="preserve"> штатних одиниць</w:t></w:r></w:p><w:p w:rsidR="001A5B8E" w:rsidRDefault="00E23420" w:rsidP="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr><w:r w:rsidRPr="00D97E65"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr><w:t xml:space="preserve">з місячним фондом заробітної плати </w:t></w:r></w:p><w:p w:rsidR="00E23420" w:rsidRPr="00D97E65" w:rsidRDefault="006246F8" w:rsidP="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:u w:val="single"/><w:lang w:val="uk-UA"/></w:rPr><w:t>{}</w:t></w:r><w:r w:rsidR="00E23420" w:rsidRPr="00D97E65"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr><w:t xml:space="preserve"> грн.</w:t></w:r></w:p><w:p w:rsidR="00E23420" w:rsidRPr="00D97E65" w:rsidRDefault="00E23420" w:rsidP="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:right="2127"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr></w:p><w:p w:rsidR="001A5B8E" w:rsidRPr="00A62E41" w:rsidRDefault="001A5B8E" w:rsidP="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:lang w:val="hu-HU"/></w:rPr></w:pPr></w:p><w:p w:rsidR="001A5B8E" w:rsidRDefault="001A5B8E" w:rsidP="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr></w:p><w:p w:rsidR="001A5B8E" w:rsidRDefault="001A5B8E" w:rsidP="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr></w:p><w:p w:rsidR="00E23420" w:rsidRPr="00C86330" w:rsidRDefault="001A5B8E" w:rsidP="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr><w:t>___________________</w:t></w:r><w:r w:rsidR="00E23420" w:rsidRPr="00C86330"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr><w:t>_______</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr><w:t>____</w:t></w:r><w:r w:rsidR="00E23420" w:rsidRPr="00C86330"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr><w:t>___</w:t></w:r></w:p><w:p w:rsidR="00E23420" w:rsidRPr="00C86330" w:rsidRDefault="00E23420" w:rsidP="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:tabs><w:tab w:val="left" w:pos="2093"/><w:tab w:val="left" w:pos="4160"/><w:tab w:val="left" w:pos="14000"/></w:tabs><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="16"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr></w:p><w:p w:rsidR="00E23420" w:rsidRPr="00DA21EB" w:rsidRDefault="008F4110" w:rsidP="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:tabs><w:tab w:val="left" w:pos="2093"/><w:tab w:val="left" w:pos="4160"/><w:tab w:val="left" w:pos="14000"/></w:tabs><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:noProof/><w:sz w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:noProof/><w:sz w:val="24"/><w:lang w:val="uk-UA"/></w:rPr><w:t>{}</w:t></w:r></w:p><w:p w:rsidR="00E23420" w:rsidRDefault="00E23420"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl><w:p w:rsidR="00E23420" w:rsidRDefault="00E23420"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:tabs><w:tab w:val="left" w:pos="2235"/><w:tab w:val="left" w:pos="4160"/><w:tab w:val="left" w:pos="14000"/></w:tabs><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/></w:rPr></w:pPr></w:p><w:p w:rsidR="00E23420" w:rsidRDefault="00E23420"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:tabs><w:tab w:val="left" w:pos="2235"/><w:tab w:val="left" w:pos="4160"/><w:tab w:val="left" w:pos="14000"/></w:tabs><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/></w:rPr></w:pPr></w:p><w:p w:rsidR="00E23420" w:rsidRDefault="00E23420"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:tabs><w:tab w:val="left" w:pos="2235"/><w:tab w:val="left" w:pos="4160"/><w:tab w:val="left" w:pos="14000"/></w:tabs><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/></w:rPr></w:pPr></w:p><w:p w:rsidR="00E23420" w:rsidRDefault="00E23420"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:tabs><w:tab w:val="left" w:pos="2235"/><w:tab w:val="left" w:pos="4160"/><w:tab w:val="left" w:pos="14000"/></w:tabs><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="28"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr><w:r w:rsidRPr="00D97E65"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="28"/><w:lang w:val="ru-RU"/></w:rPr><w:t xml:space="preserve">ШТАТНИЙ РОЗПИС </w:t></w:r></w:p><w:p w:rsidR="001A5B8E" w:rsidRPr="00D97E65" w:rsidRDefault="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:tabs><w:tab w:val="left" w:pos="2235"/><w:tab w:val="left" w:pos="4160"/><w:tab w:val="left" w:pos="14000"/></w:tabs><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="28"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr></w:p><w:p w:rsidR="00E23420" w:rsidRDefault="00E23420" w:rsidP="00720879"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:tabs><w:tab w:val="left" w:pos="2235"/><w:tab w:val="left" w:pos="4160"/><w:tab w:val="left" w:pos="14000"/></w:tabs><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:lang w:val="uk-UA"/></w:rPr><w:t xml:space="preserve">вводиться в дію з </w:t></w:r><w:r w:rsidR="002300E2"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr><w:t>{}</w:t></w:r></w:p><w:p w:rsidR="00E23420" w:rsidRPr="004C7375" w:rsidRDefault="00E23420"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:tabs><w:tab w:val="left" w:pos="2235"/><w:tab w:val="left" w:pos="4160"/><w:tab w:val="left" w:pos="14000"/></w:tabs><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr></w:p><w:p w:rsidR="001A5B8E" w:rsidRDefault="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:tabs><w:tab w:val="left" w:pos="2235"/><w:tab w:val="left" w:pos="4160"/><w:tab w:val="left" w:pos="14000"/></w:tabs><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr></w:p><w:p w:rsidR="001A5B8E" w:rsidRPr="00D97E65" w:rsidRDefault="001A5B8E"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:tabs><w:tab w:val="left" w:pos="2235"/><w:tab w:val="left" w:pos="4160"/><w:tab w:val="left" w:pos="14000"/></w:tabs><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="24"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr></w:p><w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar><w:tblBorders><w:top w:val="single" w:sz="12" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="12" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="12" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="12" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders><w:tblLayout w:type="fixed"/><w:tblLook w:val="0000" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="0"/></w:tblPr><w:tblGrid><w:gridCol w:w="534"/><w:gridCol w:w="4819"/><w:gridCol w:w="1276"/><w:gridCol w:w="1134"/><w:gridCol w:w="1276"/><w:gridCol w:w="1417"/></w:tblGrid><w:tr w:rsidR="00DA21EB" w:rsidRPr="00676C4A" w:rsidTr="00DA21EB"><w:trPr><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="534" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="12" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="12" w:space="0" w:color="auto"/></w:tcBorders></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr><w:t>N з/п</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="12" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="12" w:space="0" w:color="auto"/></w:tcBorders></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr><w:t>Посада</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1276" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="12" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="12" w:space="0" w:color="auto"/></w:tcBorders></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr><w:t>Кількість штатних одиниць</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1134" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="12" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="12" w:space="0" w:color="auto"/></w:tcBorders></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr><w:t>Посадові оклади, грн.</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1276" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="12" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="12" w:space="0" w:color="auto"/></w:tcBorders></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/></w:rPr><w:t>Надбавки, грн.</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1417" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="12" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="12" w:space="0" w:color="auto"/></w:tcBorders></w:tcPr><w:p w:rsidR="00DA21EB" w:rsidRPr="00D97E65" w:rsidRDefault="00DA21EB"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/><w:lang w:val="ru-RU"/></w:rPr></w:pPr><w:r w:rsidRPr="00D97E65"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:noProof/><w:sz w:val="22"/><w:lang w:val="ru-RU"/></w:rPr><w:t>Місячний фонд заробітної плати, грн.</w:t></w:r></w:p></w:tc></w:tr>{}{}  </w:tbl><w:p w:rsidR="00E23420" w:rsidRDefault="00E23420"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr></w:p><w:p w:rsidR="0092440B" w:rsidRPr="0092440B" w:rsidRDefault="0092440B"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr></w:p><w:sectPr w:rsidR="0092440B" w:rsidRPr="0092440B" w:rsidSect="006077E3"><w:pgSz w:w="11907" w:h="16840" w:code="9"/><w:pgMar w:top="851" w:right="567" w:bottom="851" w:left="964" w:header="720" w:footer="720" w:gutter="0"/><w:cols w:space="720"/></w:sectPr></w:body></w:document>"#,
        fop_name_upper, total_units_str, total_payroll_str, date_escaped, date_escaped, table_rows_xml, summary_row_xml
    );

    zip.start_file("word/document.xml", options).map_err(|e| e.to_string())?;
    zip.write_all(doc_xml.as_bytes()).map_err(|e| e.to_string())?;

    zip.finish().map_err(|e| format!("Failed to finalize docx zip: {}", e))?;
    Ok(output_path)
}

fn format_unit_val(u: f64) -> String {
    if u.fract() == 0.0 {
        format!("{:.0}", u)
    } else {
        format!("{:.1}", u).replace('.', ",")
    }
}

fn format_ukr_currency(amount: f64) -> String {
    let main_part = amount.floor() as u64;
    let kopeks = ((amount - amount.floor()) * 100.0).round() as u64;

    let s = main_part.to_string();
    let mut formatted_main = String::new();
    let len = s.len();
    for (i, c) in s.chars().enumerate() {
        if i > 0 && (len - i) % 3 == 0 {
            formatted_main.push(' ');
        }
        formatted_main.push(c);
    }

    format!("{},{:02}", formatted_main, kopeks)
}

fn quick_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}
