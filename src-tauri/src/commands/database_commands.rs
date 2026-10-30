use rfd::FileDialog;
use rusqlite::{Connection, OpenFlags};
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

use crate::db::connection::{get_db_path, init_sqlite_db};

#[derive(Serialize, Debug)]
pub struct DatabaseInfo {
    pub db_path: String,
    pub db_size_bytes: u64,
    pub fop_count: i64,
    pub worker_count: i64,
    pub last_modified: Option<String>,
}

#[derive(Serialize, Debug)]
pub struct DatabaseExportResult {
    pub success: bool,
    pub exported_path: String,
    pub file_size_bytes: u64,
    pub fop_count: i64,
    pub worker_count: i64,
}

#[derive(Serialize, Debug)]
pub struct DatabaseImportResult {
    pub success: bool,
    pub source_path: String,
    pub backup_path: Option<String>,
    pub fop_count: i64,
    pub worker_count: i64,
}

#[tauri::command]
pub fn get_database_info() -> Result<DatabaseInfo, String> {
    let db_path = get_db_path();
    let db_path_str = db_path.to_string_lossy().into_owned();

    let mut db_size_bytes = 0u64;
    let mut last_modified: Option<String> = None;

    if db_path.exists() {
        if let Ok(metadata) = fs::metadata(&db_path) {
            db_size_bytes = metadata.len();
            if let Ok(modified) = metadata.modified() {
                let dt: chrono::DateTime<chrono::Local> = modified.into();
                last_modified = Some(dt.format("%Y-%m-%d %H:%M:%S").to_string());
            }
        }
    }

    let conn = init_sqlite_db().map_err(|e| format!("Помилка підключення до БД: {}", e))?;

    let fop_count: i64 = conn
        .query_row("SELECT count(*) FROM fop WHERE deleted_at IS NULL", [], |r| r.get(0))
        .unwrap_or(0);

    let worker_count: i64 = conn
        .query_row("SELECT count(*) FROM jogviszony", [], |r| r.get(0))
        .unwrap_or(0);

    Ok(DatabaseInfo {
        db_path: db_path_str,
        db_size_bytes,
        fop_count,
        worker_count,
        last_modified,
    })
}

#[tauri::command]
pub fn export_database(target_path: Option<String>) -> Result<DatabaseExportResult, String> {
    let dest_path: PathBuf = match target_path {
        Some(p) if !p.trim().is_empty() => PathBuf::from(p.trim()),
        _ => {
            let now_str = chrono::Local::now().format("%Y-%m-%d_%H-%M").to_string();
            let default_name = format!("kadergo_backup_{}.kadergo", now_str);
            let chosen = FileDialog::new()
                .set_title("Зберегти резервну копію бази даних Kadergo")
                .set_file_name(&default_name)
                .add_filter("База даних Kadergo (*.kadergo, *.db)", &["kadergo", "db"])
                .save_file();

            match chosen {
                Some(p) => p,
                None => return Err("Експорт скасовано користувачем".to_string()),
            }
        }
    };

    let dest_path_str = dest_path.to_string_lossy().into_owned();

    // 1. Open current database and flush WAL
    let src_conn = init_sqlite_db().map_err(|e| format!("Помилка відкриття БД: {}", e))?;
    let _ = src_conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");

    let fop_count: i64 = src_conn
        .query_row("SELECT count(*) FROM fop WHERE deleted_at IS NULL", [], |r| r.get(0))
        .unwrap_or(0);

    let worker_count: i64 = src_conn
        .query_row("SELECT count(*) FROM jogviszony", [], |r| r.get(0))
        .unwrap_or(0);

    // 2. Remove destination file if already exists (rusqlite backup requires clean target)
    if dest_path.exists() {
        let _ = fs::remove_file(&dest_path);
    }

    // 3. Perform SQLite online backup
    let mut dst_conn = Connection::open(&dest_path)
        .map_err(|e| format!("Помилка створення файлу резервної копії: {}", e))?;

    let backup = rusqlite::backup::Backup::new(&src_conn, &mut dst_conn)
        .map_err(|e| format!("Помилка ініціалізації бекапу: {}", e))?;

    backup
        .run_to_completion(10, std::time::Duration::from_millis(50), None)
        .map_err(|e| format!("Помилка створення резервної копії: {}", e))?;

    drop(backup);
    drop(dst_conn);
    drop(src_conn);

    let file_size_bytes = fs::metadata(&dest_path)
        .map(|m| m.len())
        .unwrap_or(0);

    Ok(DatabaseExportResult {
        success: true,
        exported_path: dest_path_str,
        file_size_bytes,
        fop_count,
        worker_count,
    })
}

#[tauri::command]
pub fn import_database(source_path: Option<String>) -> Result<DatabaseImportResult, String> {
    let src_path: PathBuf = match source_path {
        Some(p) if !p.trim().is_empty() => PathBuf::from(p.trim()),
        _ => {
            let chosen = FileDialog::new()
                .set_title("Оберіть файл резервної копії бази даних Kadergo")
                .add_filter("База даних Kadergo (*.kadergo, *.db, *.sqlite)", &["kadergo", "db", "sqlite"])
                .pick_file();

            match chosen {
                Some(p) => p,
                None => return Err("Імпорт скасовано користувачем".to_string()),
            }
        }
    };

    if !src_path.exists() {
        return Err("Вказаний файл бази даних не існує".to_string());
    }

    let src_path_str = src_path.to_string_lossy().into_owned();

    // 1. Validate the source database file
    let check_conn = Connection::open_with_flags(&src_path, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| format!("Обраний файл не є дійсною базою даних SQLite: {}", e))?;

    let has_fop: bool = check_conn
        .query_row(
            "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='fop'",
            [],
            |r| r.get::<_, i64>(0),
        )
        .map(|c| c > 0)
        .unwrap_or(false);

    let has_szemely: bool = check_conn
        .query_row(
            "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='szemely'",
            [],
            |r| r.get::<_, i64>(0),
        )
        .map(|c| c > 0)
        .unwrap_or(false);

    if !has_fop && !has_szemely {
        return Err("Обраний файл не містить таблиць Kadergo (fop/szemely). Імпорт неможливий!".to_string());
    }

    let fop_count: i64 = check_conn
        .query_row("SELECT count(*) FROM fop WHERE deleted_at IS NULL", [], |r| r.get(0))
        .unwrap_or(0);

    let worker_count: i64 = check_conn
        .query_row("SELECT count(*) FROM jogviszony", [], |r| r.get(0))
        .unwrap_or(0);

    drop(check_conn);

    // 2. Safely flush existing database before replacing
    if let Ok(cur_conn) = init_sqlite_db() {
        let _ = cur_conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
    }

    let target_db_path = get_db_path();
    let target_db_dir = target_db_path.parent().unwrap_or(Path::new("."));

    // 3. Make an automatic safety backup of the existing database
    let mut backup_path_str: Option<String> = None;
    if target_db_path.exists() {
        let backup_name = format!(
            "kadergo.db.backup_{}",
            chrono::Local::now().format("%Y%m%d_%H%M%S")
        );
        let auto_backup_path = target_db_dir.join(&backup_name);
        if fs::copy(&target_db_path, &auto_backup_path).is_ok() {
            backup_path_str = Some(auto_backup_path.to_string_lossy().into_owned());
        }
    }

    // 4. Remove any existing WAL and SHM files
    let wal_path = PathBuf::from(format!("{}-wal", target_db_path.display()));
    let shm_path = PathBuf::from(format!("{}-shm", target_db_path.display()));
    if wal_path.exists() {
        let _ = fs::remove_file(&wal_path);
    }
    if shm_path.exists() {
        let _ = fs::remove_file(&shm_path);
    }

    // 5. Replace current database with imported file
    fs::copy(&src_path, &target_db_path)
        .map_err(|e| format!("Не вдалося скопіювати нову базу даних: {}", e))?;

    // 6. Run init_sqlite_db to apply any schema migrations to the newly imported DB
    init_sqlite_db().map_err(|e| format!("Помилка ініціалізації імпортованої бази даних: {}", e))?;

    Ok(DatabaseImportResult {
        success: true,
        source_path: src_path_str,
        backup_path: backup_path_str,
        fop_count,
        worker_count,
    })
}

#[tauri::command]
pub fn open_database_folder() -> Result<String, String> {
    let db_path = get_db_path();
    let db_dir = db_path.parent().unwrap_or(Path::new("."));

    if !db_dir.exists() {
        let _ = fs::create_dir_all(db_dir);
    }

    let dir_str = db_dir.to_string_lossy().into_owned();

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&dir_str)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&dir_str)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&dir_str)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(dir_str)
}

