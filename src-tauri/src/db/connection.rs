use rusqlite::{Connection, Result as SqlResult};
use std::fs;
use std::path::PathBuf;

pub fn get_db_dir() -> PathBuf {
    // 1. Check development path (current_dir with database or src-tauri parent)
    let cur = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let mut dev_path = cur.clone();
    if dev_path.ends_with("src-tauri") {
        if let Some(parent) = dev_path.parent() {
            dev_path = parent.to_path_buf();
        }
    }
    let dev_db = dev_path.join("database");
    if dev_db.exists() {
        return dev_db;
    }

    // 2. Portable mode: check next to executable
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let exe_db = exe_dir.join("database");
            if exe_db.exists() {
                return exe_db;
            }
        }
    }

    // 3. Fallback to dev_db
    if !dev_db.exists() {
        let _ = fs::create_dir_all(&dev_db);
    }
    dev_db
}

pub fn get_db_path() -> PathBuf {
    get_db_dir().join("kadergo.db")
}

pub fn init_sqlite_db() -> SqlResult<Connection> {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path)?;

    conn.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA journal_mode = WAL;",
    )?;

    let schema_sql = include_str!("../../../database/schema.sql");
    conn.execute_batch(schema_sql)?;

    let _ = conn.execute("ALTER TABLE szemely ADD COLUMN nem TEXT CHECK(nem IN ('Чоловік', 'Жінка'))", []);
    let _ = conn.execute("ALTER TABLE fop ADD COLUMN fop_kod TEXT", []);
    let _ = conn.execute("ALTER TABLE fop ADD COLUMN fop_kezdete_datum TEXT", []);
    let _ = conn.execute("ALTER TABLE fop ADD COLUMN deleted_at TEXT", []);
    let _ = conn.execute("ALTER TABLE jogviszony ADD COLUMN tabel_nomer TEXT", []);
    let _ = conn.execute("ALTER TABLE fop ADD COLUMN folder_path TEXT", []);
    let _ = conn.execute("ALTER TABLE fop ADD COLUMN folder_group TEXT", []);
    let _ = conn.execute(
        "CREATE TABLE IF NOT EXISTS folder_group (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            color TEXT NOT NULL,
            created_at TEXT
        )",
        [],
    );

    Ok(conn)
}
