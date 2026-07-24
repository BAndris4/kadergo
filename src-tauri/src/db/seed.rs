use rusqlite::{params, Connection, Result as SqlResult};

pub fn seed_initial_data(conn: &Connection) -> SqlResult<()> {
    // FOP 1
    conn.execute(
        "INSERT INTO szemely (kod, vezeteknev, keresztnev, apai_nev, nem) VALUES ('КД-10492', 'Коваленко', 'Олександр', 'Іванович', 'Чоловік')",
        [],
    )?;
    let owner1_id = conn.last_insert_rowid();
    conn.execute(
        "INSERT INTO fop (szemely_id, fop_kod, fop_kezdete_datum, nakaz_szam, munkas_szam) VALUES (?1, 'ФОП-10492', '2020-01-15', '1', '1')",
        params![owner1_id],
    )?;
    let fop1_id = conn.last_insert_rowid();

    let munkasok1 = vec![
        ("КД-80145", "Шевченко", "Катерина", "Петрівна", 1, 1, "Головний бухгалтер", 350000.0, "Жінка"),
        ("КД-80219", "Кравченко", "Василь", "Леонідович", 0, 0, "IT-консультант", 185000.0, "Чоловік"),
        ("КД-80362", "Ткаченко", "Олена", "Дмитрівна", 1, 1, "Офіс-адміністратор", 260000.0, "Жінка"),
    ];
    for (kod, vnev, knev, anev, fo, tm, job, sal, nem) in munkasok1 {
        conn.execute(
            "INSERT INTO szemely (kod, vezeteknev, keresztnev, apai_nev, nem) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![kod, vnev, knev, anev, nem],
        )?;
        let m_id = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO jogviszony (munkavallalo_id, fop_id, foallas, teljes_munkaido, foglalkozas_megnevezes, fizetes, munkakezdes_datum) VALUES (?1, ?2, ?3, ?4, ?5, ?6, '2024-01-01')",
            params![m_id, fop1_id, fo, tm, job, sal],
        )?;
    }

    // FOP 2
    conn.execute(
        "INSERT INTO szemely (kod, vezeteknev, keresztnev, apai_nev, nem) VALUES ('КД-20831', 'Мельник', 'Михайло', 'Степанович', 'Чоловік')",
        [],
    )?;
    let owner2_id = conn.last_insert_rowid();
    conn.execute(
        "INSERT INTO fop (szemely_id, fop_kod, fop_kezdete_datum, nakaz_szam, munkas_szam) VALUES (?1, 'ФОП-20831', '2021-06-01', '1', '1')",
        params![owner2_id],
    )?;
    let fop2_id = conn.last_insert_rowid();

    let munkasok2 = vec![
        ("КД-91504", "Бондаренко", "Андрій", "Сергійович", 1, 1, "Менеджер з логістики", 410000.0, "Чоловік"),
        ("КД-91687", "Бойко", "Оксана", "Володимирівна", 1, 0, "Завідувач складу", 220000.0, "Жінка"),
    ];
    for (kod, vnev, knev, anev, fo, tm, job, sal, nem) in munkasok2 {
        conn.execute(
            "INSERT INTO szemely (kod, vezeteknev, keresztnev, apai_nev, nem) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![kod, vnev, knev, anev, nem],
        )?;
        let m_id = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO jogviszony (munkavallalo_id, fop_id, foallas, teljes_munkaido, foglalkozas_megnevezes, fizetes, munkakezdes_datum) VALUES (?1, ?2, ?3, ?4, ?5, ?6, '2024-01-01')",
            params![m_id, fop2_id, fo, tm, job, sal],
        )?;
    }

    // FOP 3
    conn.execute(
        "INSERT INTO szemely (kod, vezeteknev, keresztnev, apai_nev, nem) VALUES ('КД-30114', 'Сидоренко', 'Валерій', 'Анатолійович', 'Чоловік')",
        [],
    )?;
    let owner3_id = conn.last_insert_rowid();
    conn.execute(
        "INSERT INTO fop (szemely_id, fop_kod, fop_kezdete_datum, nakaz_szam, munkas_szam) VALUES (?1, 'ФОП-30114', '2023-03-10', '1', '1')",
        params![owner3_id],
    )?;

    Ok(())
}
