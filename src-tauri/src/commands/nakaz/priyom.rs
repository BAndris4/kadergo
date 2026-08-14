use std::fs::{self, File};
use std::io::Write;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

use super::common::{quick_escape, format_address_paragraphs_xml, GenerateNakazPriyomRequest};

#[tauri::command]
pub fn generate_nakaz_priyom_docx(req: GenerateNakazPriyomRequest) -> Result<String, String> {
    if req.workers.is_empty() {
        return Err("Оберіть хоча б одного працівника для прийняття na роботу".to_string());
    }

    let nakaz_clean = req.nakaz_num.trim();
    let filename = if req.workers.len() == 1 {
        let initials_clean = req.workers[0].worker_initials.trim();
        format!("Наказ {} прийом {}.docx", nakaz_clean, initials_clean)
    } else {
        format!("Наказ {} прийом працівників.docx", nakaz_clean)
    };

    let base_dir = match req.save_dir {
        Some(ref d) if !d.trim().is_empty() => std::path::PathBuf::from(d.trim()),
        _ => std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from(".")),
    };

    if !base_dir.exists() {
        let _ = fs::create_dir_all(&base_dir);
    }

    let output_path_buf = base_dir.join(&filename);
    let output_path = output_path_buf.to_string_lossy().to_string();

    let out_file = File::create(&output_path)
        .map_err(|e| format!("Cannot create output docx file: {}", e))?;
    let mut zip = ZipWriter::new(out_file);
    let options = SimpleFileOptions::default();

    // 1. [Content_Types].xml
    let content_types = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
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

    // 3. word/_rels/document.xml.rels
    let doc_rels = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"#;

    zip.start_file("word/_rels/document.xml.rels", options).map_err(|e| e.to_string())?;
    zip.write_all(doc_rels.as_bytes()).map_err(|e| e.to_string())?;

    // 4. word/styles.xml
    let styles_xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:lang w:val="uk-UA"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>"#;

    zip.start_file("word/styles.xml", options).map_err(|e| e.to_string())?;
    zip.write_all(styles_xml.as_bytes()).map_err(|e| e.to_string())?;

    // 5. Build word/document.xml
    let fop_name_upper = quick_escape(&req.fop_name.to_uppercase());
    let fop_address_xml = format_address_paragraphs_xml(&req.fop_address);
    let fop_edrpou_esc = quick_escape(&req.fop_edrpou);
    let fop_initials_esc = quick_escape(&req.fop_initials);
    let nakaz_num_esc = quick_escape(&req.nakaz_num);
    let nakaz_date_esc = quick_escape(&req.nakaz_date_str);

    let start_date_esc = quick_escape(&req.workers[0].work_start_date_str);

    let mut body_clauses_xml = String::new();
    let podstava_text;
    let mut signatures_xml = String::new();

    if req.workers.len() == 1 {
        let w = &req.workers[0];
        let worker_acc_esc = quick_escape(&w.worker_name_accusative);
        let worker_dat_esc = quick_escape(&w.worker_name_dative);
        let worker_initials_esc = quick_escape(&w.worker_initials);
        let position_esc = quick_escape(&w.position_name);
        let salary_esc = quick_escape(&w.salary_str);

        let clause_1 = match w.employment_type.as_str() {
            "sumisnyctvo" => format!(
                "1. Прийняти {} на посаду {} за сумісництвом з посадовим окладом в сумі {} на місяць.",
                worker_acc_esc, position_esc, salary_esc
            ),
            "nepovny_chas" => format!(
                "1. Прийняти {} на посаду {} на неповний робочий час з посадовим окладом в сумі {} на місяць.",
                worker_acc_esc, position_esc, salary_esc
            ),
            _ => format!(
                "1. Прийняти {} на посаду {} з посадовим окладом в сумі {} на місяць.",
                worker_acc_esc, position_esc, salary_esc
            ),
        };

        body_clauses_xml.push_str(&format!(
            r#"<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">{}</w:t></w:r></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">2. Оформити трудовий договір з {}, в якому зазначити умови праці (режим, права і обов'язки сторін, і т.д).</w:t></w:r></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">3. {} приступити до роботи з {}.</w:t></w:r></w:p>"#,
            clause_1, worker_dat_esc, worker_initials_esc, start_date_esc
        ));

        podstava_text = format!("Підстава: заява {}", worker_initials_esc);

        signatures_xml.push_str(&format!(
            r#"<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">З наказом ознайомлений(а), {}                       ___________________</w:t></w:r></w:p>"#,
            worker_initials_esc
        ));
    } else {
        body_clauses_xml.push_str(&format!(
            r#"<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">1. Прийняти na роботу з {} наступних працівників:</w:t></w:r></w:p>"#,
            start_date_esc
        ));

        for (idx, w) in req.workers.iter().enumerate() {
            let worker_acc_esc = quick_escape(&w.worker_name_accusative);
            let position_esc = quick_escape(&w.position_name);
            let salary_esc = quick_escape(&w.salary_str);

            let emp_suffix = match w.employment_type.as_str() {
                "sumisnyctvo" => " за сумісництвом",
                "nepovny_chas" => " на неповний робочий час",
                _ => "",
            };

            body_clauses_xml.push_str(&format!(
                r#"<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">1.{}. {} на посаду {}{} з посадовим окладом в сумі {} на місяць.</w:t></w:r></w:p>"#,
                idx + 1, worker_acc_esc, position_esc, emp_suffix, salary_esc
            ));
        }

        body_clauses_xml.push_str(&format!(
            r#"<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">2. Оформити трудові договори з працівниками, в яких зазначити умови праці (режим, права і обов'язки сторін, і т.д).</w:t></w:r></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">3. Працівникам приступити до роботи з {}.</w:t></w:r></w:p>"#,
            start_date_esc
        ));

        podstava_text = "Підстава: заяви працівників".to_string();

        signatures_xml.push_str(r#"<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">З наказом ознайомлені:</w:t></w:r></w:p>"#);

        for w in &req.workers {
            let initials_esc = quick_escape(&w.worker_initials);
            signatures_xml.push_str(&format!(
                r#"<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">(______________)  {}                       «____» ____________ 2024 р.</w:t></w:r></w:p>"#,
                initials_esc
            ));
        }
    }

    let doc_xml = format!(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>Фізична особа-підприємець</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>{}</w:t></w:r></w:p>
{}
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="120" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>КОД ЄДРПОУ {}</w:t></w:r></w:p>
<w:tbl><w:tblPr><w:tblStyle w:val="a4"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid><w:gridCol w:w="9639"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="9855" w:type="dxa"/><w:tcBorders><w:top w:val="thinThickSmallGap" w:sz="24" w:space="0" w:color="auto"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/><w:lang w:val="uk-UA"/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>НАКАЗ № {}</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>від {}</w:t></w:r></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:jc w:val="left"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Про прийняття на роботу</w:t></w:r></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
{}
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">            {}</w:t></w:r></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">ФОП {}___________________</w:t></w:r></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>
{}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>
</w:body></w:document>"#,
        fop_name_upper,
        fop_address_xml,
        fop_edrpou_esc,
        nakaz_num_esc,
        nakaz_date_esc,
        body_clauses_xml,
        podstava_text,
        fop_initials_esc,
        signatures_xml
    );

    zip.start_file("word/document.xml", options).map_err(|e| e.to_string())?;
    zip.write_all(doc_xml.as_bytes()).map_err(|e| e.to_string())?;

    zip.finish().map_err(|e| format!("Failed to finalize docx zip: {}", e))?;
    Ok(output_path)
}
