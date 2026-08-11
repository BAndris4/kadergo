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

    let path = std::path::Path::new(&folder_path);
    let target = if path.is_file() {
        path.parent().unwrap_or(path)
    } else {
        path
    };

    Command::new("explorer")
        .arg(target)
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

#[tauri::command]
pub async fn download_and_run_installer(
    app: tauri::AppHandle,
    download_url: String,
    file_name: String,
) -> Result<(), String> {
    use tauri::Emitter;

    if download_url.trim().is_empty() {
        return Err("Download URL is empty".to_string());
    }

    let client = reqwest::Client::builder()
        .user_agent("KaderGo-App")
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let mut response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to download URL: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Download failed with HTTP status: {}", response.status()));
    }

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut buffer = Vec::new();

    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        downloaded += chunk.len() as u64;
        buffer.extend_from_slice(&chunk);

        let percent = if total_size > 0 {
            ((downloaded as f64 / total_size as f64) * 100.0) as u32
        } else {
            0
        };

        let _ = app.emit(
            "installer-download-progress",
            serde_json::json!({
                "percent": percent,
                "downloaded": downloaded,
                "total": total_size
            }),
        );
    }

    let _ = app.emit(
        "installer-download-progress",
        serde_json::json!({
            "percent": 100,
            "downloaded": downloaded,
            "total": downloaded,
            "status": "installing"
        }),
    );

    let temp_dir = std::env::temp_dir();
    let name = if file_name.trim().is_empty() {
        "kadergo_installer.exe".to_string()
    } else {
        file_name
    };
    let installer_path = temp_dir.join(&name);

    fs::write(&installer_path, buffer)
        .map_err(|e| format!("Failed to write installer to temp file: {}", e))?;

    execute_installer_and_relaunch(&installer_path)
}

#[tauri::command]
pub async fn fetch_github_releases() -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("KaderGo-App")
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    // 1. Try fetching published releases
    if let Ok(res) = client
        .get("https://api.github.com/repos/BAndris4/kadergo/releases")
        .send()
        .await
    {
        if res.status().is_success() {
            if let Ok(text) = res.text().await {
                if let Ok(releases_json) = serde_json::from_str::<serde_json::Value>(&text) {
                    if let Some(arr) = releases_json.as_array() {
                        if !arr.is_empty() {
                            return Ok(text);
                        }
                    }
                }
            }
        }
    }

    // 2. Fallback: Fetch git tags if releases endpoint returns empty array
    if let Ok(res) = client
        .get("https://api.github.com/repos/BAndris4/kadergo/tags")
        .send()
        .await
    {
        if res.status().is_success() {
            if let Ok(text) = res.text().await {
                if let Ok(tags_json) = serde_json::from_str::<serde_json::Value>(&text) {
                    if let Some(arr) = tags_json.as_array() {
                    if !arr.is_empty() {
                        let synthetic_releases: Vec<serde_json::Value> = arr
                            .iter()
                            .map(|tag| {
                                let name = tag["name"].as_str().unwrap_or("v0.1.0");
                                let clean_ver = name.trim_start_matches('v');
                                serde_json::json!({
                                    "tag_name": name,
                                    "name": format!("KaderGo {}", name),
                                    "body": format!("Випуск {} в архіві репозиторію KaderGo.", name),
                                    "published_at": "2026-08-11T12:00:00Z",
                                    "prerelease": false,
                                    "html_url": format!("https://github.com/BAndris4/kadergo/releases/tag/{}", name),
                                    "assets": [
                                        {
                                            "name": format!("kadergo_{}_x64-setup.exe", clean_ver),
                                            "browser_download_url": format!("https://github.com/BAndris4/kadergo/releases/download/{}/kadergo_{}_x64-setup.exe", name, clean_ver)
                                        }
                                    ]
                                })
                            })
                            .collect();

                        return Ok(serde_json::to_string(&synthetic_releases).unwrap_or_default());
                    }
                }
            }
        }
    }
}

    // 3. Fallback: Local known version history
    let fallback = serde_json::json!([
        {
            "tag_name": "v0.1.5",
            "name": "KaderGo v0.1.5",
            "body": "Автоматичні оновлення, тихий режим (Silent Mode) та сповіщення про робочу папку.",
            "published_at": "2026-08-11T14:25:00Z",
            "prerelease": false,
            "assets": [{ "name": "kadergo_0.1.5_x64-setup.exe", "browser_download_url": "https://github.com/BAndris4/kadergo/releases/download/v0.1.5/kadergo_0.1.5_x64-setup.exe" }]
        },
        {
            "tag_name": "v0.1.4",
            "name": "KaderGo v0.1.4",
            "body": "Автоматичні оновлення та виправлення завантаження.",
            "published_at": "2026-08-11T13:45:00Z",
            "prerelease": false,
            "assets": [{ "name": "kadergo_0.1.4_x64-setup.exe", "browser_download_url": "https://github.com/BAndris4/kadergo/releases/download/v0.1.4/kadergo_0.1.4_x64-setup.exe" }]
        },
        {
            "tag_name": "v0.1.3",
            "name": "KaderGo v0.1.3",
            "body": "Виправлення стабільності та робота з файлами.",
            "published_at": "2026-08-11T12:50:00Z",
            "prerelease": false,
            "assets": [{ "name": "kadergo_0.1.3_x64-setup.exe", "browser_download_url": "https://github.com/BAndris4/kadergo/releases/download/v0.1.3/kadergo_0.1.3_x64-setup.exe" }]
        },
        {
            "tag_name": "v0.1.2",
            "name": "KaderGo v0.1.2",
            "body": "Графік відпусток та розрахунок днів.",
            "published_at": "2026-08-10T12:00:00Z",
            "prerelease": false,
            "assets": [{ "name": "kadergo_0.1.2_x64-setup.exe", "browser_download_url": "https://github.com/BAndris4/kadergo/releases/download/v0.1.2/kadergo_0.1.2_x64-setup.exe" }]
        },
        {
            "tag_name": "v0.1.1",
            "name": "KaderGo v0.1.1",
            "body": "Штатний розпис та заяви про прийняття на роботу.",
            "published_at": "2026-08-09T12:00:00Z",
            "prerelease": false,
            "assets": [{ "name": "kadergo_0.1.1_x64-setup.exe", "browser_download_url": "https://github.com/BAndris4/kadergo/releases/download/v0.1.1/kadergo_0.1.1_x64-setup.exe" }]
        }
    ]);

    Ok(serde_json::to_string(&fallback).unwrap_or_default())
}

fn execute_installer_and_relaunch(installer_path: &std::path::Path) -> Result<(), String> {
    let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let temp_dir = std::env::temp_dir();
    let bat_path = temp_dir.join("kadergo_updater.bat");

    let bat_content = format!(
        "@echo off\r\ntimeout /t 1 /nobreak > NUL\r\n\"{}\" /S\r\nstart \"\" \"{}\"\r\n(goto 2 2>nul & del \"%~f0\")\r\n",
        installer_path.to_string_lossy(),
        current_exe.to_string_lossy()
    );

    fs::write(&bat_path, bat_content).map_err(|e| format!("Failed to write updater script: {}", e))?;

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        std::process::Command::new("cmd")
            .args(&["/C", bat_path.to_str().unwrap_or_default()])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| format!("Failed to launch updater script: {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new(installer_path)
            .arg("/S")
            .spawn()
            .map_err(|e| format!("Failed to launch installer executable: {}", e))?;
    }

    std::thread::sleep(std::time::Duration::from_millis(300));
    std::process::exit(0);
}

#[tauri::command]
pub fn run_installer_from_bytes(bytes: Vec<u8>, file_name: String) -> Result<(), String> {
    let temp_dir = std::env::temp_dir();
    let installer_path = temp_dir.join(&file_name);

    fs::write(&installer_path, bytes).map_err(|e| format!("Failed to write installer: {}", e))?;

    execute_installer_and_relaunch(&installer_path)
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

