-- Kadergo SQLite Adatbázis Séma
-- Generálva a megadott DBML modell alapján

PRAGMA foreign_keys = ON;

-- 1. Személy tábla
CREATE TABLE IF NOT EXISTS szemely (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kod TEXT UNIQUE,
    vezeteknev TEXT NOT NULL,
    keresztnev TEXT NOT NULL,
    apai_nev TEXT NOT NULL,
    szuletesi_datum TEXT, -- ÉÉÉÉ-HH-NN
    nem TEXT CHECK (nem IN ('Чоловік', 'Жінка')) -- 'Чоловік' або 'Жінка'
);

-- 2. Cím tábla
CREATE TABLE IF NOT EXISTS cim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    szemely_id INTEGER NOT NULL,
    iranyitoszam TEXT,
    megye TEXT,
    jaras TEXT,
    kozseg TEXT,
    utca TEXT,
    hazszam TEXT,
    epulet TEXT,
    lakas_szoba TEXT,
    orszag TEXT DEFAULT 'Ukrajna',
    FOREIGN KEY (szemely_id) REFERENCES szemely(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Okmány tábla
CREATE TABLE IF NOT EXISTS okmany (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    szemely_id INTEGER NOT NULL,
    tipus INTEGER NOT NULL CHECK (tipus IN (0, 1)), -- 1: új, 0: régi
    szeria TEXT,
    okmanyszam TEXT NOT NULL,
    kiallitott_hatosag TEXT,
    hatosagi_kod TEXT,
    kiallitasi_datum TEXT, -- ÉÉÉÉ-HH-NN
    lejarati_datum TEXT, -- ÉÉÉÉ-HH-NN
    FOREIGN KEY (szemely_id) REFERENCES szemely(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Egyedi index az okmány szériára és okmányszámra
CREATE UNIQUE INDEX IF NOT EXISTS idx_okmany_szeria_okmanyszam ON okmany (szeria, okmanyszam);

-- 4. FOP (Egyéni vállalkozó / Egyéni cég) tábla
CREATE TABLE IF NOT EXISTS fop (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    szemely_id INTEGER NOT NULL,
    fop_kod TEXT,
    fop_kezdete_datum TEXT, -- ÉÉÉÉ-HH-NN
    nakaz_szam TEXT,
    munkas_szam TEXT,
    FOREIGN KEY (szemely_id) REFERENCES szemely(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Jogviszony tábla
CREATE TABLE IF NOT EXISTS jogviszony (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    munkavallalo_id INTEGER NOT NULL,
    fop_id INTEGER NOT NULL,
    foallas INTEGER NOT NULL DEFAULT 1 CHECK (foallas IN (0, 1)), -- Ez-e a munkavállaló főállása (0: hamis, 1: igaz)
    teljes_munkaido INTEGER NOT NULL DEFAULT 1 CHECK (teljes_munkaido IN (0, 1)), -- (0: hamis, 1: igaz)
    foglalkozas_megnevezes TEXT,
    foglalkozas_kod TEXT,
    fizetes NUMERIC(12, 2), -- DECIMAL(12,2)
    kerelem_datum TEXT, -- ÉÉÉÉ-HH-NN
    munkakezdes_datum TEXT, -- ÉÉÉÉ-HH-NN
    munkaviszony_vege TEXT, -- ÉÉÉÉ-HH-NN
    felveteli_nakaz_szam TEXT,
    FOREIGN KEY (munkavallalo_id) REFERENCES szemely(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (fop_id) REFERENCES fop(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index a munkavállaló, FOP és munkakezdés dátuma alapján történő gyors kereséshez
CREATE INDEX IF NOT EXISTS idx_jogviszony_munkavallalo_fop_kezdes ON jogviszony (munkavallalo_id, fop_id, munkakezdes_datum);
