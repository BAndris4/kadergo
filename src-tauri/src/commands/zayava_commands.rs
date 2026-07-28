use serde::Deserialize;
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateZayavaPriyomDocxRequest {
    pub zayava_type: Option<String>, // "priyom" | "zvilnennya" | "vidpustka" | "bez_kopijok"
    pub fop_id: i64,
    pub worker_id: i64,
    pub fop_name: String,
    pub worker_genitive_name: String,
    pub position: String,
    pub start_date: String,
    pub request_date: String,
    pub worker_short_name: String,
    pub foallas: bool,
    pub teljes_munkaido: bool,
    pub custom_body_text: Option<String>,
    pub save_dir: Option<String>,
}

#[tauri::command]
pub fn generate_zayava_priyom_docx(req: GenerateZayavaPriyomDocxRequest) -> Result<String, String> {
    let lower_position = if !req.position.is_empty() {
        let mut chars = req.position.chars();
        match chars.next() {
            None => String::new(),
            Some(f) => f.to_lowercase().collect::<String>() + chars.as_str(),
        }
    } else {
        req.position.clone()
    };

    let ztype = req.zayava_type.as_deref().unwrap_or("priyom");

    let body_text = match req.custom_body_text {
        Some(ref text) if !text.trim().is_empty() => text.clone(),
        _ => {
            if ztype == "zvilnennya" {
                format!(
                    "Прошу звільнити мене з роботи за згодою сторін з {}.",
                    req.start_date
                )
            } else if ztype == "vidpustka" {
                format!(
                    "Прошу надати мені основну щорічну відпустку з {} на 3 календарних днів.",
                    req.start_date
                )
            } else if ztype == "bez_kopijok" {
                format!(
                    "Прошу належну до виплати мені заробітну плату виплачувати готівкою в гривнях, без копійок, починаючи із зарплати за {} року. Належні до виплати копійки прошу переносити на майбутні місяці розрахунку до остаточної їх виплати під час звільнення.",
                    req.start_date
                )
            } else {
                if !req.foallas {
                    format!(
                        "Прошу прийняти мене на посаду {} з {} за сумісництвом.",
                        lower_position, req.start_date
                    )
                } else if !req.teljes_munkaido {
                    format!(
                        "Прошу прийняти мене на посаду {} з {} на неповний робочий час, а саме 4 год на 5 днів тижня.",
                        lower_position, req.start_date
                    )
                } else {
                    format!(
                        "Прошу прийняти мене на посаду {} з {}.",
                        lower_position, req.start_date
                    )
                }
            }
        }
    };

    let safe_worker_short_name = req.worker_short_name.replace('/', "_").replace('\\', "_");
    let doc_title_prefix = match ztype {
        "zvilnennya" => "Заява на звільнення",
        "vidpustka" => "Заява на відпустку",
        "bez_kopijok" => "Заява без копійок",
        _ => "Заява на прийом",
    };

    let filename = format!("{} {}.docx", doc_title_prefix, safe_worker_short_name);
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

    // 3. word/document.xml
    let (h1, h2, h3) = if ztype == "bez_kopijok" {
        (
            quick_escape(&format!("ФОП {}", req.fop_name.to_uppercase())),
            quick_escape(&req.worker_genitive_name),
            quick_escape(&lower_position),
        )
    } else {
        (
            quick_escape("Фізична особа-підприємець"),
            quick_escape(&req.fop_name),
            quick_escape(&req.worker_genitive_name),
        )
    };

    let title_text = if ztype == "bez_kopijok" { "ЗАЯВА" } else { "Заява" };

    let (footer_left, footer_right) = if ztype == "bez_kopijok" {
        (
            quick_escape(&format!("{} _________________", req.worker_short_name)),
            quick_escape(&req.request_date),
        )
    } else {
        (
            quick_escape(&req.request_date),
            quick_escape(&req.worker_short_name),
        )
    };

    let body_escaped = quick_escape(&body_text);

    let doc_xml = format!(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:tabs><w:tab w:val="right" w:pos="9639"/></w:tabs><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:tab/></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">{}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:tabs><w:tab w:val="right" w:pos="9639"/></w:tabs><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:tab/></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">{}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:tabs><w:tab w:val="right" w:pos="9639"/></w:tabs><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:tab/></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">{}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr></w:p>
    <w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr></w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>{}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr></w:p>
    <w:p>
      <w:pPr><w:ind w:firstLine="567"/><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">{}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr></w:p>
    <w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr></w:p>
    <w:p>
      <w:pPr><w:tabs><w:tab w:val="right" w:pos="9639"/></w:tabs><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">{}</w:t></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:tab/></w:r>
      <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">{}</w:t></w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>"#,
        h1, h2, h3, title_text, body_escaped, footer_left, footer_right
    );

    zip.start_file("word/document.xml", options).map_err(|e| e.to_string())?;
    zip.write_all(doc_xml.as_bytes()).map_err(|e| e.to_string())?;

    zip.finish().map_err(|e| format!("Failed to finalize docx zip: {}", e))?;
    Ok(output_path)
}

fn quick_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}
