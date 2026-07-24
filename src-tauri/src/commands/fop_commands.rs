use rusqlite::{params, OptionalExtension};
use crate::db::init_sqlite_db;
use crate::models::{CimInput, CreateFopInput, FopDto, MunkasDto, OkmanyInput, UpdateFopInput};

#[tauri::command]
pub fn get_fops() -> Result<Vec<FopDto>, String> {
    let conn = init_sqlite_db().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT f.id, s.kod, s.vezeteknev, s.keresztnev, s.apai_nev, s.szuletesi_datum, s.nem,
                    f.fop_kod, f.fop_kezdete_datum, f.nakaz_szam, f.munkas_szam
             FROM fop f
             JOIN szemely s ON f.szemely_id = s.id
             ORDER BY f.id DESC",
        )
        .map_err(|e| e.to_string())?;

    let fop_rows = stmt
        .query_map([], |row| {
            let fop_id: i64 = row.get(0)?;
            let kod: Option<String> = row.get(1)?;
            let vezeteknev: String = row.get(2)?;
            let keresztnev: String = row.get(3)?;
            let apai_nev: Option<String> = row.get(4)?;
            let szuletesi_datum: Option<String> = row.get(5)?;
            let nem: Option<String> = row.get(6)?;
            let fop_kod: Option<String> = row.get(7)?;
            let fop_kezdete_datum: Option<String> = row.get(8)?;
            let nakaz_szam: Option<String> = row.get(9)?;
            let munkas_szam: Option<String> = row.get(10)?;

            Ok((
                fop_id,
                kod,
                vezeteknev,
                keresztnev,
                apai_nev,
                szuletesi_datum,
                nem,
                fop_kod,
                fop_kezdete_datum,
                nakaz_szam,
                munkas_szam,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();

    for fop_res in fop_rows {
        let (
            fop_id,
            kod,
            vezeteknev,
            keresztnev,
            apai_nev,
            szuletesi_datum,
            nem,
            fop_kod,
            fop_kezdete_datum,
            nakaz_szam,
            munkas_szam,
        ) = fop_res.map_err(|e| e.to_string())?;

        let mut m_stmt = conn
            .prepare(
                "SELECT j.id, s.kod, s.vezeteknev, s.keresztnev, s.apai_nev, s.szuletesi_datum, s.nem,
                        j.foallas, j.teljes_munkaido, j.foglalkozas_megnevezes, j.fizetes, j.munkakezdes_datum, j.kerelem_datum, j.munkaviszony_vege,
                        c.iranyitoszam, c.megye, c.jaras, c.kozseg, c.utca, c.hazszam, c.epulet, c.lakas_szoba, c.orszag,
                        o.tipus, o.szeria, o.okmanyszam, o.kiallitott_hatosag, o.hatosagi_kod, o.kiallitasi_datum, o.lejarati_datum
                 FROM jogviszony j
                 JOIN szemely s ON j.munkavallalo_id = s.id
                 LEFT JOIN cim c ON c.szemely_id = s.id
                 LEFT JOIN okmany o ON o.szemely_id = s.id
                 WHERE j.fop_id = ?1
                 ORDER BY j.id ASC",
            )
            .map_err(|e| e.to_string())?;

        let munkasok_rows = m_stmt
            .query_map(params![fop_id], |r| {
                let id: i64 = r.get(0)?;
                let kod: Option<String> = r.get(1)?;
                let vezeteknev: String = r.get(2)?;
                let keresztnev: String = r.get(3)?;
                let apai_nev: Option<String> = r.get(4)?;
                let szuletesi_datum: Option<String> = r.get(5)?;
                let nem: Option<String> = r.get(6)?;
                let foallas: bool = r.get(7)?;
                let teljes_munkaido: bool = r.get(8)?;
                let foglalkozas_megnevezes: String = r.get(9)?;
                let fizetes: f64 = r.get(10)?;
                let munkakezdes_datum: Option<String> = r.get(11)?;
                let kerelem_datum: Option<String> = r.get(12)?;
                let munkaviszony_vege: Option<String> = r.get(13)?;

                let c_iranyitoszam: Option<String> = r.get(14)?;
                let cim = if c_iranyitoszam.is_some() || r.get::<_, Option<String>>(15)?.is_some() {
                    Some(CimInput {
                        iranyitoszam: c_iranyitoszam,
                        megye: r.get(15)?,
                        jaras: r.get(16)?,
                        kozseg: r.get(17)?,
                        utca: r.get(18)?,
                        hazszam: r.get(19)?,
                        epulet: r.get(20)?,
                        lakas_szoba: r.get(21)?,
                        orszag: r.get(22)?,
                    })
                } else {
                    None
                };

                let o_szam: Option<String> = r.get(25)?;
                let okmany = if let Some(okmanyszam) = o_szam {
                    Some(OkmanyInput {
                        tipus: r.get::<_, i32>(23).unwrap_or(0),
                        szeria: r.get(24)?,
                        okmanyszam,
                        kiallitott_hatosag: r.get(26)?,
                        hatosagi_kod: r.get(27)?,
                        kiallitasi_datum: r.get(28)?,
                        lejarati_datum: r.get(29)?,
                    })
                } else {
                    None
                };

                Ok(MunkasDto {
                    id,
                    kod: kod.unwrap_or_default(),
                    vezeteknev,
                    keresztnev,
                    apai_nev,
                    szuletesi_datum,
                    nem,
                    foallas,
                    teljes_munkaido,
                    foglalkozas_megnevezes,
                    fizetes,
                    munkakezdes_datum,
                    kerelem_datum,
                    munkaviszony_vege,
                    cim,
                    okmany,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut munkasok = Vec::new();
        for m in munkasok_rows {
            munkasok.push(m.map_err(|e| e.to_string())?);
        }

        result.push(FopDto {
            id: fop_id,
            kod,
            vezeteknev,
            keresztnev,
            apai_nev,
            szuletesi_datum,
            nem,
            fop_kod,
            fop_kezdete_datum,
            nakaz_szam,
            munkas_szam,
            munkasok,
        });
    }

    Ok(result)
}

#[tauri::command]
pub fn reseed_db() -> Result<Vec<FopDto>, String> {
    let conn = init_sqlite_db().map_err(|e| e.to_string())?;

    conn.execute_batch(
        "DELETE FROM jogviszony;
         DELETE FROM fop;
         DELETE FROM okmany;
         DELETE FROM cim;
         DELETE FROM szemely;",
    )
    .map_err(|e| format!("Не вдалося очистити базу даних: {}", e))?;

    crate::db::seed_initial_data(&conn).map_err(|e| format!("Не вдалося засіяти базу даних: {}", e))?;

    get_fops()
}

#[tauri::command]
pub fn create_fop(input: CreateFopInput) -> Result<FopDto, String> {
    let mut conn = init_sqlite_db().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let person_code = input.kod.filter(|s| !s.trim().is_empty());
    let fop_code = input.fop_kod.filter(|s| !s.trim().is_empty());
    let fop_start_date = input.fop_kezdete_datum.filter(|s| !s.trim().is_empty());
    let gender = input.nem.filter(|s| !s.trim().is_empty());

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
    .map_err(|e| format!("Не вдалося зберегти особу: {}", e))?;

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

    tx.execute(
        "INSERT INTO fop (szemely_id, fop_kod, fop_kezdete_datum, nakaz_szam, munkas_szam) VALUES (?1, ?2, ?3, '1', '1')",
        params![szemely_id, fop_code, fop_start_date],
    )
    .map_err(|e| format!("Не вдалося створити ФОП: {}", e))?;

    let fop_id = tx.last_insert_rowid();

    tx.commit().map_err(|e| e.to_string())?;

    Ok(FopDto {
        id: fop_id,
        kod: person_code,
        vezeteknev: input.vezeteknev,
        keresztnev: input.keresztnev,
        apai_nev: Some(input.apai_nev),
        szuletesi_datum: input.szuletesi_datum,
        nem: gender,
        fop_kod: fop_code,
        fop_kezdete_datum: fop_start_date,
        nakaz_szam: Some("1".to_string()),
        munkas_szam: Some("1".to_string()),
        munkasok: vec![],
    })
}

#[tauri::command]
pub fn update_fop(input: UpdateFopInput) -> Result<FopDto, String> {
    let mut conn = init_sqlite_db().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let szemely_id: i64 = tx
        .query_row(
            "SELECT szemely_id FROM fop WHERE id = ?1",
            params![input.id],
            |r| r.get(0),
        )
        .map_err(|e| format!("ФОП не знайдено: {}", e))?;

    let person_code = input.kod.filter(|s| !s.trim().is_empty());
    let fop_code = input.fop_kod.filter(|s| !s.trim().is_empty());
    let fop_start_date = input.fop_kezdete_datum.filter(|s| !s.trim().is_empty());
    let gender = input.nem.filter(|s| !s.trim().is_empty());

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
        "UPDATE fop SET fop_kod = ?1, fop_kezdete_datum = ?2, nakaz_szam = ?3, munkas_szam = ?4 WHERE id = ?5",
        params![fop_code, fop_start_date, input.nakaz_szam, input.munkas_szam, input.id],
    )
    .map_err(|e| format!("Не вдалося оновити ФОП: {}", e))?;

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

    let mut m_stmt = conn
        .prepare(
            "SELECT j.id, s.kod, s.vezeteknev, s.keresztnev, s.apai_nev, s.szuletesi_datum, s.nem,
                    j.foallas, j.teljes_munkaido, j.foglalkozas_megnevezes, j.fizetes, j.munkakezdes_datum, j.kerelem_datum, j.munkaviszony_vege,
                    c.iranyitoszam, c.megye, c.jaras, c.kozseg, c.utca, c.hazszam, c.epulet, c.lakas_szoba, c.orszag,
                    o.tipus, o.szeria, o.okmanyszam, o.kiallitott_hatosag, o.hatosagi_kod, o.kiallitasi_datum, o.lejarati_datum
             FROM jogviszony j
             JOIN szemely s ON j.munkavallalo_id = s.id
             LEFT JOIN cim c ON c.szemely_id = s.id
             LEFT JOIN okmany o ON o.szemely_id = s.id
             WHERE j.fop_id = ?1
             ORDER BY j.id ASC",
        )
        .map_err(|e| e.to_string())?;

    let munkasok_rows = m_stmt
        .query_map(params![input.id], |r| {
            let id: i64 = r.get(0)?;
            let kod: Option<String> = r.get(1)?;
            let vezeteknev: String = r.get(2)?;
            let keresztnev: String = r.get(3)?;
            let apai_nev: Option<String> = r.get(4)?;
            let szuletesi_datum: Option<String> = r.get(5)?;
            let nem: Option<String> = r.get(6)?;
            let foallas: bool = r.get(7)?;
            let teljes_munkaido: bool = r.get(8)?;
            let foglalkozas_megnevezes: String = r.get(9)?;
            let fizetes: f64 = r.get(10)?;
            let munkakezdes_datum: Option<String> = r.get(11)?;
            let kerelem_datum: Option<String> = r.get(12)?;
            let munkaviszony_vege: Option<String> = r.get(13)?;

            let c_iranyitoszam: Option<String> = r.get(14)?;
            let cim = if c_iranyitoszam.is_some() || r.get::<_, Option<String>>(15)?.is_some() {
                Some(CimInput {
                    iranyitoszam: c_iranyitoszam,
                    megye: r.get(15)?,
                    jaras: r.get(16)?,
                    kozseg: r.get(17)?,
                    utca: r.get(18)?,
                    hazszam: r.get(19)?,
                    epulet: r.get(20)?,
                    lakas_szoba: r.get(21)?,
                    orszag: r.get(22)?,
                })
            } else {
                None
            };

            let o_szam: Option<String> = r.get(25)?;
            let okmany = if let Some(okmanyszam) = o_szam {
                Some(OkmanyInput {
                    tipus: r.get::<_, i32>(23).unwrap_or(0),
                    szeria: r.get(24)?,
                    okmanyszam,
                    kiallitott_hatosag: r.get(26)?,
                    hatosagi_kod: r.get(27)?,
                    kiallitasi_datum: r.get(28)?,
                    lejarati_datum: r.get(29)?,
                })
            } else {
                None
            };

            Ok(MunkasDto {
                id,
                kod: kod.unwrap_or_default(),
                vezeteknev,
                keresztnev,
                apai_nev,
                szuletesi_datum,
                nem,
                foallas,
                teljes_munkaido,
                foglalkozas_megnevezes,
                fizetes,
                munkakezdes_datum,
                kerelem_datum,
                munkaviszony_vege,
                cim,
                okmany,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut munkasok = Vec::new();
    for m in munkasok_rows {
        munkasok.push(m.map_err(|e| e.to_string())?);
    }

    Ok(FopDto {
        id: input.id,
        kod: person_code,
        vezeteknev: input.vezeteknev,
        keresztnev: input.keresztnev,
        apai_nev: Some(input.apai_nev),
        szuletesi_datum: input.szuletesi_datum,
        nem: gender,
        fop_kod: fop_code,
        fop_kezdete_datum: fop_start_date,
        nakaz_szam: input.nakaz_szam,
        munkas_szam: input.munkas_szam,
        munkasok,
    })
}

#[tauri::command]
pub fn delete_fop(fop_id: i64) -> Result<(), String> {
    let conn = init_sqlite_db().map_err(|e| e.to_string())?;

    let szemely_id: Option<i64> = conn
        .query_row(
            "SELECT szemely_id FROM fop WHERE id = ?1",
            params![fop_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM fop WHERE id = ?1", params![fop_id])
        .map_err(|e| e.to_string())?;

    if let Some(s_id) = szemely_id {
        let _ = conn.execute("DELETE FROM szemely WHERE id = ?1", params![s_id]);
    }

    Ok(())
}
