use rfd::FileDialog;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use crate::models::{DiscoveredFopDto, ScanFopsResult};

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            '\\' | '/' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c,
        })
        .collect::<String>()
        .trim()
        .to_string()
}

pub fn clean_whitespace(s: &str) -> String {
    s.split_whitespace().collect::<Vec<_>>().join(" ")
}

pub fn to_human_readable_name(s: &str) -> String {
    let cleaned = clean_whitespace(s);
    cleaned
        .split(' ')
        .map(|word| {
            let has_alpha = word.chars().any(|c| c.is_alphabetic());
            let is_all_caps = has_alpha && word.chars().all(|c| !c.is_alphabetic() || c.is_uppercase());
            if is_all_caps {
                let mut chars = word.chars();
                if let Some(first) = chars.next() {
                    let mut res = first.to_uppercase().to_string();
                    res.push_str(&chars.as_str().to_lowercase());
                    res
                } else {
                    word.to_string()
                }
            } else {
                word.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

#[tauri::command]
pub fn pick_folder() -> Result<Option<String>, String> {
    let folder = FileDialog::new()
        .set_title("Оберіть головну папку збереження документів")
        .pick_folder();

    Ok(folder.map(|p| p.to_string_lossy().into_owned()))
}

#[tauri::command]
pub fn ensure_fop_directory(root_dir: String, fop_code: String, fop_name: String) -> Result<String, String> {
    if root_dir.trim().is_empty() {
        return Err("Головну папку збереження не вказано".to_string());
    }

    let code_clean = sanitize_filename(&fop_code);
    let name_clean = sanitize_filename(&fop_name);

    let folder_name = if !code_clean.is_empty() {
        format!("{} {}", code_clean, name_clean)
    } else {
        name_clean
    };

    let mut main_fop_dir = PathBuf::from(&root_dir);
    main_fop_dir.push(&folder_name);

    let mut doc_sub_dir = main_fop_dir.clone();
    doc_sub_dir.push("кадрові документи");

    if !doc_sub_dir.exists() {
        fs::create_dir_all(&doc_sub_dir)
            .map_err(|e| format!("Не вдалося створити папку '{:?}': {}", doc_sub_dir, e))?;
    }

    Ok(main_fop_dir.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn open_folder_in_explorer(folder_path: String) -> Result<(), String> {
    if folder_path.trim().is_empty() {
        return Err("Папку не вказано".to_string());
    }

    Command::new("explorer")
        .arg(&folder_path)
        .spawn()
        .map_err(|e| format!("Не вдалося відкрити Провідник: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn scan_fop_folders(root_dir: String) -> Result<Vec<DiscoveredFopDto>, String> {
    if root_dir.trim().is_empty() {
        return Err("Головну папку не вказано".to_string());
    }

    let root_path = PathBuf::from(&root_dir);
    if !root_path.exists() || !root_path.is_dir() {
        return Err(format!("Вказана папка не існує: {}", root_dir));
    }

    let entries = fs::read_dir(&root_path)
        .map_err(|e| format!("Не вдалося прочитати вміст папки: {}", e))?;

    let conn = crate::db::init_sqlite_db().map_err(|e| e.to_string())?;

    let mut discovered = Vec::new();

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let folder_name = match path.file_name() {
            Some(n) => n.to_string_lossy().to_string(),
            None => continue,
        };

        let clean_name = clean_whitespace(&folder_name.replace('_', " "));
        let parts: Vec<&str> = clean_name.split(' ').filter(|s| !s.trim().is_empty()).collect();

        if parts.len() < 2 {
            continue;
        }

        let has_code_token = parts[0].chars().any(|c| c.is_ascii_digit()) || parts[0].contains('-');

        let (code, vezeteknev, keresztnev, apai_nev) = if has_code_token && parts.len() >= 3 {
            let code = parts[0].trim().to_string();
            let vezeteknev = to_human_readable_name(parts[1]);
            let keresztnev = to_human_readable_name(parts[2]);
            let apai_nev = if parts.len() >= 4 {
                to_human_readable_name(&parts[3..].join(" "))
            } else {
                "".to_string()
            };
            (code, vezeteknev, keresztnev, apai_nev)
        } else if parts.len() >= 2 {
            let vezeteknev = to_human_readable_name(parts[0]);
            let keresztnev = to_human_readable_name(parts[1]);
            let apai_nev = if parts.len() >= 3 {
                to_human_readable_name(&parts[2..].join(" "))
            } else {
                "".to_string()
            };

            ("".to_string(), vezeteknev, keresztnev, apai_nev)
        } else {
            continue;
        };

        if vezeteknev.is_empty() || keresztnev.is_empty() {
            continue;
        }

        // Check if FOP record already exists in `fop` table
        let exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM fop f JOIN szemely s ON f.szemely_id = s.id WHERE (s.kod IS NOT NULL AND s.kod = ?1 AND ?1 != '') OR (f.fop_kod IS NOT NULL AND f.fop_kod = ?1 AND ?1 != '') OR (s.vezeteknev = ?2 AND s.keresztnev = ?3 AND s.apai_nev = ?4)",
                rusqlite::params![code, vezeteknev, keresztnev, apai_nev],
                |r| r.get(0),
            )
            .unwrap_or(0);

        if exists > 0 {
            continue;
        }

        discovered.push(DiscoveredFopDto {
            folder_name: folder_name.clone(),
            folder_path: path.to_string_lossy().to_string(),
            kod: code,
            vezeteknev,
            keresztnev,
            apai_nev,
            already_exists: false,
        });
    }

    Ok(discovered)
}

#[tauri::command]
pub fn import_selected_fops(items: Vec<DiscoveredFopDto>) -> Result<Vec<crate::models::FopDto>, String> {
    let mut conn = crate::db::init_sqlite_db().map_err(|e| e.to_string())?;

    for item in items {
        let code = item.kod.trim().to_string();
        let code_opt = if code.is_empty() { None } else { Some(code.clone()) };
        let vezeteknev = to_human_readable_name(&item.vezeteknev);
        let keresztnev = to_human_readable_name(&item.keresztnev);
        let apai_nev = to_human_readable_name(&item.apai_nev);

        if vezeteknev.is_empty() || keresztnev.is_empty() {
            continue;
        }

        // Check if FOP already exists in `fop` table
        let fop_exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM fop f JOIN szemely s ON f.szemely_id = s.id WHERE (s.kod IS NOT NULL AND s.kod = ?1 AND ?1 != '') OR (f.fop_kod IS NOT NULL AND f.fop_kod = ?1 AND ?1 != '') OR (s.vezeteknev = ?2 AND s.keresztnev = ?3 AND s.apai_nev = ?4)",
                rusqlite::params![code, vezeteknev, keresztnev, apai_nev],
                |r| r.get(0),
            )
            .unwrap_or(0);

        if fop_exists > 0 {
            continue;
        }

        // Check if szemely record exists
        let existing_szemely_id: Option<i64> = conn
            .query_row(
                "SELECT id FROM szemely WHERE (kod IS NOT NULL AND kod = ?1 AND ?1 != '') OR (vezeteknev = ?2 AND keresztnev = ?3 AND apai_nev = ?4)",
                rusqlite::params![code, vezeteknev, keresztnev, apai_nev],
                |r| r.get(0),
            )
            .ok();

        let szemely_id = match existing_szemely_id {
            Some(id) => id,
            None => {
                let tx = conn.transaction().map_err(|e| e.to_string())?;
                tx.execute(
                    "INSERT INTO szemely (kod, vezeteknev, keresztnev, apai_nev) VALUES (?1, ?2, ?3, ?4)",
                    rusqlite::params![code_opt, vezeteknev, keresztnev, apai_nev],
                )
                .map_err(|e| format!("Не вдалося зберегти особу з папки: {}", e))?;
                let new_id = tx.last_insert_rowid();
                tx.commit().map_err(|e| e.to_string())?;
                new_id
            }
        };

        let tx = conn.transaction().map_err(|e| e.to_string())?;
        tx.execute(
            "INSERT INTO fop (szemely_id, fop_kod, nakaz_szam, munkas_szam) VALUES (?1, NULL, '1', '1')",
            rusqlite::params![szemely_id],
        )
        .map_err(|e| format!("Не вдалося створити ФОП з папки: {}", e))?;
        tx.commit().map_err(|e| e.to_string())?;
    }

    crate::commands::fop_commands::get_fops()
}

#[tauri::command]
pub fn scan_and_import_fop_folders(root_dir: String) -> Result<ScanFopsResult, String> {
    if root_dir.trim().is_empty() {
        return Err("Головну папку не вказано".to_string());
    }

    let root_path = PathBuf::from(&root_dir);
    if !root_path.exists() || !root_path.is_dir() {
        return Err(format!("Вказана папка не існує: {}", root_dir));
    }

    let entries = fs::read_dir(&root_path)
        .map_err(|e| format!("Не вдалося прочитати вміст папки: {}", e))?;

    let mut conn = crate::db::init_sqlite_db().map_err(|e| e.to_string())?;

    let mut total_scanned = 0;
    let mut imported_count = 0;
    let mut existing_count = 0;
    let mut imported_names = Vec::new();

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let folder_name = match path.file_name() {
            Some(n) => n.to_string_lossy().to_string(),
            None => continue,
        };

        let clean_name = clean_whitespace(&folder_name);
        let parts: Vec<&str> = clean_name.split(' ').collect();

        // Check format: KÓD VEZETÉKNÉV KERESZTNÉV APAI_NÉV (>= 4 parts)
        if parts.len() < 4 {
            continue;
        }

        total_scanned += 1;

        let code = parts[0].trim().to_string();
        let vezeteknev = to_human_readable_name(parts[1]);
        let keresztnev = to_human_readable_name(parts[2]);
        let apai_nev = to_human_readable_name(&parts[3..].join(" "));

        if code.is_empty() || vezeteknev.is_empty() || keresztnev.is_empty() || apai_nev.is_empty() {
            continue;
        }

        // Check database if person already exists by code or exact full name
        let exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM szemely WHERE (kod IS NOT NULL AND kod = ?1) OR (vezeteknev = ?2 AND keresztnev = ?3 AND apai_nev = ?4)",
                rusqlite::params![code, vezeteknev, keresztnev, apai_nev],
                |r| r.get(0),
            )
            .unwrap_or(0);

        if exists > 0 {
            existing_count += 1;
            continue;
        }

        // Save new person & FOP
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO szemely (kod, vezeteknev, keresztnev, apai_nev) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![code, vezeteknev, keresztnev, apai_nev],
        )
        .map_err(|e| format!("Не вдалося зберегти особу з папки: {}", e))?;

        let szemely_id = tx.last_insert_rowid();

        tx.execute(
            "INSERT INTO fop (szemely_id, fop_kod, nakaz_szam, munkas_szam) VALUES (?1, ?2, '1', '1')",
            rusqlite::params![szemely_id, code],
        )
        .map_err(|e| format!("Не вдалося створити ФОП з папки: {}", e))?;

        tx.commit().map_err(|e| e.to_string())?;

        let full_name = format!("{} {} {}", vezeteknev, keresztnev, apai_nev);
        imported_names.push(format!("{} ({})", full_name, code));
        imported_count += 1;
    }

    Ok(ScanFopsResult {
        total_scanned,
        imported_count,
        existing_count,
        imported_names,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_human_readable_name() {
        assert_eq!(
            to_human_readable_name("3123456789  KOVALENKO   OLEKSANDR   IVANOVYCH "),
            "3123456789 Kovalenko Oleksandr Ivanovych"
        );
        assert_eq!(
            to_human_readable_name("  КОВАЛЕНКО   ОЛЕКСАНДР   ІВАНОВИЧ  "),
            "Коваленко Олександр Іванович"
        );
        assert_eq!(
            to_human_readable_name("Kovalenko Oleksandr"),
            "Kovalenko Oleksandr"
        );
    }
}

