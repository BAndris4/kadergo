use rusqlite::{Connection, Result as SqlResult};
use std::fs;
use std::path::PathBuf;

pub fn get_db_path() -> PathBuf {
    let mut path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    if path.ends_with("src-tauri") {
        if let Some(parent) = path.parent() {
            path = parent.to_path_buf();
        }
    }
    path.push("database");
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path.push("kadergo.db");
    path
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

    Ok(conn)
}
