use std::fs;
use super::common::NakazFileItem;

fn scrape_fop_address_from_docx_file(file_path: &std::path::Path) -> Option<String> {
    let file = fs::File::open(file_path).ok()?;
    let mut archive = zip::ZipArchive::new(file).ok()?;
    let mut doc_file = archive.by_name("word/document.xml").ok()?;
    let mut xml_content = String::new();
    std::io::Read::read_to_string(&mut doc_file, &mut xml_content).ok()?;

    for p_chunk in xml_content.split("<w:p") {
        let mut text = String::new();
        let mut in_tag = false;
        for c in p_chunk.chars() {
            if c == '<' {
                in_tag = true;
            } else if c == '>' {
                in_tag = false;
            } else if !in_tag {
                text.push(c);
            }
        }
        let trimmed = text.trim();
        let lower = trimmed.to_lowercase();
        if (lower.contains("обл") || lower.contains("район") || lower.contains("р-н") || lower.contains("вул") || lower.contains("село") || lower.contains("м."))
            && trimmed.len() > 10
            && !lower.contains("фізична особа")
        {
            return Some(trimmed.to_string());
        }
    }

    None
}

#[tauri::command]
pub fn scrape_fop_address_from_nakazy(dir_path: String) -> Result<Option<String>, String> {
    let path = std::path::Path::new(&dir_path);
    if !path.exists() || !path.is_dir() {
        return Ok(None);
    }

    let entries = match fs::read_dir(path) {
        Ok(e) => e,
        Err(_) => return Ok(None),
    };

    for entry in entries.flatten() {
        let path_buf = entry.path();
        if path_buf.is_file() {
            if let Some(filename_os) = path_buf.file_name() {
                let fname = filename_os.to_string_lossy().to_string().to_lowercase();
                if fname.starts_with("наказ") && fname.ends_with(".docx") {
                    let path_clone = path_buf.clone();
                    let scraped = std::panic::catch_unwind(move || {
                        scrape_fop_address_from_docx_file(&path_clone)
                    }).unwrap_or(None);

                    if scraped.is_some() {
                        return Ok(scraped);
                    }
                }
            }
        }
    }

    Ok(None)
}

fn extract_nakaz_num(fname: &str) -> (String, u32) {
    let fname_lower = fname.to_lowercase();
    let parts: Vec<&str> = fname_lower.split_whitespace().collect();
    for p in parts {
        let digits: String = p.chars().filter(|c| c.is_ascii_digit()).collect();
        if !digits.is_empty() {
            if let Ok(val) = digits.parse::<u32>() {
                return (val.to_string(), val);
            }
        }
    }
    ("?".to_string(), 0)
}

#[tauri::command]
pub fn scan_fop_nakazy(dir_path: String) -> Result<Vec<NakazFileItem>, String> {
    let path = std::path::Path::new(&dir_path);
    if !path.exists() || !path.is_dir() {
        return Ok(Vec::new());
    }

    let mut items: Vec<NakazFileItem> = Vec::new();

    let entries = match fs::read_dir(path) {
        Ok(e) => e,
        Err(_) => return Ok(Vec::new()),
    };

    for entry in entries.flatten() {
        let path_buf = entry.path();
        if path_buf.is_file() {
            if let Some(filename_os) = path_buf.file_name() {
                let fname = filename_os.to_string_lossy().to_string();
                let fname_lower = fname.to_lowercase();

                if fname_lower.starts_with("наказ") && fname_lower.ends_with(".docx") {
                    let (num_str, num_val) = extract_nakaz_num(&fname);
                    let desc_part = fname.trim_end_matches(".docx").to_string();

                    let date_modified = entry
                        .metadata()
                        .ok()
                        .and_then(|m| m.modified().ok())
                        .map(|t| {
                            let datetime: chrono::DateTime<chrono::Local> = t.into();
                            datetime.format("%d.%m.%Y %H:%M").to_string()
                        })
                        .unwrap_or_default();

                    items.push(NakazFileItem {
                        nakaz_num: num_str,
                        num_val,
                        filename: fname,
                        filepath: path_buf.to_string_lossy().to_string(),
                        nakaz_type: desc_part,
                        date_modified,
                    });
                }
            }
        }
    }

    items.sort_by(|a, b| b.num_val.cmp(&a.num_val));

    Ok(items)
}
