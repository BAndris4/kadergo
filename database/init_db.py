import sqlite3
import os

def init_db():
    db_dir = os.path.dirname(os.path.abspath(__file__))
    schema_file = os.path.join(db_dir, "schema.sql")
    db_file = os.path.join(db_dir, "kadergo.db")

    print(f"Adatbázis inicializálása: {db_file}")

    with open(schema_file, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Idegen kulcsok engedélyezése és WAL mód beállítása a jobb teljesítményért
    cursor.execute("PRAGMA foreign_keys = ON;")
    cursor.execute("PRAGMA journal_mode = WAL;")

    # Séma lefuttatása
    cursor.executescript(schema_sql)
    conn.commit()

    # Táblák és indexek ellenőrzése
    cursor.execute("SELECT type, name FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%';")
    items = cursor.fetchall()
    
    print("\nLétrehozott táblák és indexek:")
    for item_type, name in items:
        print(f" - [{item_type.upper()}] {name}")

    conn.close()
    print("\nAz SQLite adatbázis sikeresen setupolva!")

if __name__ == "__main__":
    init_db()
