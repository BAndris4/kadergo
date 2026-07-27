use rusqlite::{params, OptionalExtension};
use crate::db::init_sqlite_db;
use crate::models::{CreateWorkerInput, MunkasDto, UpdateWorkerInput};

#[tauri::command]
pub fn create_worker(input: CreateWorkerInput) -> Result<MunkasDto, String> {
    let mut conn = init_sqlite_db().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let person_code = input.kod.filter(|s| !s.trim().is_empty());
    let gender = input.nem.filter(|s| !s.trim().is_empty());
    let end_date = input.munkaviszony_vege.filter(|s| !s.trim().is_empty());

    tx.execute(
        "INSERT INTO szemely (kod, vezeteknev, keresztnev, apai_nev, szuletesi_datum, nem)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            person_code,
            input.vezeteknev,
            input.keresztnev,
            input.apai_nev,
            input.szuletesi_datum,
            gender
        ],
    )
    .map_err(|e| format!("Не вдалося зберегти працівника: {}", e))?;

    let szemely_id = tx.last_insert_rowid();

    if let Some(c) = &input.cim {
        if c.iranyitoszam.is_some()
            || c.megye.is_some()
            || c.jaras.is_some()
            || c.kozseg.is_some()
            || c.utca.is_some()
            || c.hazszam.is_some()
        {
            tx.execute(
                "INSERT INTO cim (szemely_id, iranyitoszam, megye, jaras, kozseg, utca, hazszam, epulet, lakas_szoba, orszag)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    szemely_id,
                    c.iranyitoszam,
                    c.megye,
                    c.jaras,
                    c.kozseg,
                    c.utca,
                    c.hazszam,
                    c.epulet,
                    c.lakas_szoba,
                    c.orszag.clone().unwrap_or_else(|| "Україна".to_string())
                ],
            )
            .map_err(|e| format!("Не вдалося зберегти адресу: {}", e))?;
        }
    }

    if let Some(o) = &input.okmany {
        if !o.okmanyszam.trim().is_empty() {
            tx.execute(
                "INSERT INTO okmany (szemely_id, tipus, szeria, okmanyszam, kiallitott_hatosag, hatosagi_kod, kiallitasi_datum, lejarati_datum)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![
                    szemely_id,
                    o.tipus,
                    o.szeria,
                    o.okmanyszam,
                    o.kiallitott_hatosag,
                    o.hatosagi_kod,
                    o.kiallitasi_datum,
                    o.lejarati_datum
                ],
            )
            .map_err(|e| format!("Не вдалося зберегти документ: {}", e))?;
        }
    }

    let tabel_nomer = input.tabel_nomer.filter(|s| !s.trim().is_empty());

    tx.execute(
        "INSERT INTO jogviszony (munkavallalo_id, fop_id, foallas, teljes_munkaido, foglalkozas_megnevezes, fizetes, munkakezdes_datum, kerelem_datum, munkaviszony_vege, tabel_nomer)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            szemely_id,
            input.fop_id,
            if input.foallas { 1 } else { 0 },
            if input.teljes_munkaido { 1 } else { 0 },
            input.foglalkozas_megnevezes,
            input.fizetes,
            input.munkakezdes_datum,
            input.kerelem_datum,
            end_date,
            tabel_nomer
        ],
    )
    .map_err(|e| format!("Не вдалося зберегти трудові відносини: {}", e))?;

    let jogviszony_id = tx.last_insert_rowid();

    tx.commit().map_err(|e| e.to_string())?;

    Ok(MunkasDto {
        id: jogviszony_id,
        kod: person_code.unwrap_or_default(),
        vezeteknev: input.vezeteknev,
        keresztnev: input.keresztnev,
        apai_nev: Some(input.apai_nev),
        szuletesi_datum: input.szuletesi_datum,
        nem: gender,
        foallas: input.foallas,
        teljes_munkaido: input.teljes_munkaido,
        foglalkozas_megnevezes: input.foglalkozas_megnevezes,
        fizetes: input.fizetes,
        munkakezdes_datum: input.munkakezdes_datum,
        kerelem_datum: input.kerelem_datum,
        munkaviszony_vege: end_date,
        tabel_nomer,
        cim: input.cim,
        okmany: input.okmany,
    })
}

#[tauri::command]
pub fn update_worker(input: UpdateWorkerInput) -> Result<MunkasDto, String> {
    let mut conn = init_sqlite_db().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let szemely_id: i64 = tx
        .query_row(
            "SELECT munkavallalo_id FROM jogviszony WHERE id = ?1",
            params![input.id],
            |r| r.get(0),
        )
        .map_err(|e| format!("Працівника не знайдено: {}", e))?;

    let person_code = input.kod.filter(|s| !s.trim().is_empty());
    let gender = input.nem.filter(|s| !s.trim().is_empty());
    let end_date = input.munkaviszony_vege.filter(|s| !s.trim().is_empty());
    let tabel_nomer = input.tabel_nomer.filter(|s| !s.trim().is_empty());

    tx.execute(
        "UPDATE szemely SET kod = ?1, vezeteknev = ?2, keresztnev = ?3, apai_nev = ?4, szuletesi_datum = ?5, nem = ?6
         WHERE id = ?7",
        params![
            person_code,
            input.vezeteknev,
            input.keresztnev,
            input.apai_nev,
            input.szuletesi_datum,
            gender,
            szemely_id
        ],
    )
    .map_err(|e| format!("Не вдалося оновити особу: {}", e))?;

    tx.execute(
        "UPDATE jogviszony SET foallas=?1, teljes_munkaido=?2, foglalkozas_megnevezes=?3, fizetes=?4, munkakezdes_datum=?5, kerelem_datum=?6, munkaviszony_vege=?7, tabel_nomer=?8
         WHERE id=?9",
        params![
            if input.foallas { 1 } else { 0 },
            if input.teljes_munkaido { 1 } else { 0 },
            input.foglalkozas_megnevezes,
            input.fizetes,
            input.munkakezdes_datum,
            input.kerelem_datum,
            end_date,
            tabel_nomer,
            input.id
        ],
    )
    .map_err(|e| format!("Не вдалося оновити трудові відносини: {}", e))?;

    if let Some(c) = &input.cim {
        let cim_exists: i64 = tx
            .query_row(
                "SELECT COUNT(*) FROM cim WHERE szemely_id = ?1",
                params![szemely_id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        if cim_exists > 0 {
            tx.execute(
                "UPDATE cim SET iranyitoszam=?1, megye=?2, jaras=?3, kozseg=?4, utca=?5, hazszam=?6, epulet=?7, lakas_szoba=?8, orszag=?9
                 WHERE szemely_id=?10",
                params![
                    c.iranyitoszam,
                    c.megye,
                    c.jaras,
                    c.kozseg,
                    c.utca,
                    c.hazszam,
                    c.epulet,
                    c.lakas_szoba,
                    c.orszag.clone().unwrap_or_else(|| "Україна".to_string()),
                    szemely_id
                ],
            )
            .map_err(|e| format!("Не вдалося оновити адресу: {}", e))?;
        } else {
            tx.execute(
                "INSERT INTO cim (szemely_id, iranyitoszam, megye, jaras, kozseg, utca, hazszam, epulet, lakas_szoba, orszag)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    szemely_id,
                    c.iranyitoszam,
                    c.megye,
                    c.jaras,
                    c.kozseg,
                    c.utca,
                    c.hazszam,
                    c.epulet,
                    c.lakas_szoba,
                    c.orszag.clone().unwrap_or_else(|| "Україна".to_string())
                ],
            )
            .map_err(|e| format!("Не вдалося зберегти адресу: {}", e))?;
        }
    }

    if let Some(o) = &input.okmany {
        let okmany_exists: i64 = tx
            .query_row(
                "SELECT COUNT(*) FROM okmany WHERE szemely_id = ?1",
                params![szemely_id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        if okmany_exists > 0 {
            tx.execute(
                "UPDATE okmany SET tipus=?1, szeria=?2, okmanyszam=?3, kiallitott_hatosag=?4, hatosagi_kod=?5, kiallitasi_datum=?6, lejarati_datum=?7
                 WHERE szemely_id=?8",
                params![
                    o.tipus,
                    o.szeria,
                    o.okmanyszam,
                    o.kiallitott_hatosag,
                    o.hatosagi_kod,
                    o.kiallitasi_datum,
                    o.lejarati_datum,
                    szemely_id
                ],
            )
            .map_err(|e| format!("Не вдалося оновити документ: {}", e))?;
        } else if !o.okmanyszam.trim().is_empty() {
            tx.execute(
                "INSERT INTO okmany (szemely_id, tipus, szeria, okmanyszam, kiallitott_hatosag, hatosagi_kod, kiallitasi_datum, lejarati_datum)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![
                    szemely_id,
                    o.tipus,
                    o.szeria,
                    o.okmanyszam,
                    o.kiallitott_hatosag,
                    o.hatosagi_kod,
                    o.kiallitasi_datum,
                    o.lejarati_datum
                ],
            )
            .map_err(|e| format!("Не вдалося зберегти документ: {}", e))?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(MunkasDto {
        id: input.id,
        kod: person_code.unwrap_or_default(),
        vezeteknev: input.vezeteknev,
        keresztnev: input.keresztnev,
        apai_nev: Some(input.apai_nev),
        szuletesi_datum: input.szuletesi_datum,
        nem: gender,
        foallas: input.foallas,
        teljes_munkaido: input.teljes_munkaido,
        foglalkozas_megnevezes: input.foglalkozas_megnevezes,
        fizetes: input.fizetes,
        munkakezdes_datum: input.munkakezdes_datum,
        kerelem_datum: input.kerelem_datum,
        munkaviszony_vege: end_date,
        tabel_nomer,
        cim: input.cim,
        okmany: input.okmany,
    })
}

#[tauri::command]
pub fn dismiss_worker(worker_id: i64, date: String) -> Result<(), String> {
    let conn = init_sqlite_db().map_err(|e| e.to_string())?;
    let end_date = if date.trim().is_empty() {
        None
    } else {
        Some(date.trim().to_string())
    };

    conn.execute(
        "UPDATE jogviszony SET munkaviszony_vege = ?1 WHERE id = ?2",
        params![end_date, worker_id],
    )
    .map_err(|e| format!("Не вдалося звільнити працівника: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn delete_worker(worker_id: i64) -> Result<(), String> {
    let conn = init_sqlite_db().map_err(|e| e.to_string())?;

    let szemely_id: Option<i64> = conn
        .query_row(
            "SELECT munkavallalo_id FROM jogviszony WHERE id = ?1",
            params![worker_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM jogviszony WHERE id = ?1", params![worker_id])
        .map_err(|e| e.to_string())?;

    if let Some(s_id) = szemely_id {
        let _ = conn.execute("DELETE FROM szemely WHERE id = ?1", params![s_id]);
    }

    Ok(())
}
