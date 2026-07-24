use rfd::FileDialog;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

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

    let mut target_path = PathBuf::from(&root_dir);
    target_path.push(&folder_name);
    target_path.push("кадрові документи");

    if !target_path.exists() {
        fs::create_dir_all(&target_path)
            .map_err(|e| format!("Не вдалося створити папку '{:?}': {}", target_path, e))?;
    }

    Ok(target_path.to_string_lossy().into_owned())
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
