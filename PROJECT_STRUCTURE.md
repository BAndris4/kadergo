# Kadergo — Projekt Struktúra és Architektúra Útmutató

> **Cél:** Ez a dokumentum részletesen bemutatja a **Kadergo** projekt felépítését, technológiáit, adatmodelljét és kulcsfontosságú moduljait. Minden új fejlesztési munkamenetben ez a dokumentum szolgál referenciaként a gyors tájékozódáshoz és kontextusértéshez.

---

## 1. A Projekt Célja és Áttekintése

A **Kadergo** egy modern, asztali (desktop) ügyviteli és munkaügyi nyilvántartó alkalmazás, amelyet kifejezetten **ukrán egyéni vállalkozók (ФОП – Фізична особа-підприємець)** és alkalmazottaik (**наймані працівники**) adminisztrációjára terveztek.

### Fő feladatai:
1. **FOP és Munkavállaló nyilvántartás:** Vállalkozók, alkalmazottak, lakcímek, okmányok és munkajogviszonyok strukturált kezelése.
2. **Hivatalos munkaügyi és számviteli dokumentumok automatikus generálása:**
   - **Накази (Rendeletek/Utasítások):** Felvétel (*прийом*), felmondás (*звільнення*), pénztár (*каса*), szoftveres pénztárgép (*ПРРО*), létszámkeret (*штатний розпис*), szabadságolási ütemterv (*графік відпусток*).
   - **Заяви (Kérelmek):** Munkába lépési kérelem (*заява про прийняття на роботу*).
   - **Штатний розпис (Létszámterv / Álláshely-nyilvántartás):** Formázott `.docx` generálás.
   - **Графік змінності (Műszakbeosztás):** Munkaidő-beosztás `.docx` generálás.
   - **Табель обліку робочого часу (P-5 szabvány munkaidő-nyilvántartás):** Havi és időszaki előnézet, precíz `.xlsx` export.
   - **Розрахункова відомість (Bérszámfejtési jegyzék):** Havi és időszaki fizetési jegyzék, levonások, kopejka-maradványok nyilvántartása, `.xlsx` export.
3. **Fájlrendszer szinkronizáció:** Helyi FOP könyvtárak automatikus felismerése, tallózása, rendszerezése és meglévő dokumentumok beolvasása (*scanner*).
4. **Beépített Chrome Bővítmény (`tax-gov-zreports`):** Automatikus Z-jelentés és forgalomletöltő az ukrán adóhatósági portálról (`cabinet.tax.gov.ua`), közvetlen havi szintű Excel és könyvelési formátumban.

---

## 2. Technológiai Stack

| Réteg | Technológia | Leírás / Csomagok |
| :--- | :--- | :--- |
| **Desktop Shell** | **Tauri v2** | Natív ablakkezelés, IPC híd, biztonságos fájlrendszer- és rendszerhozzáférés |
| **Frontend Framework** | **React 19** + **Vite 7** | Modern React UI (Functional components, Hooks, transitions) |
| **Nyelv (Frontend)** | **TypeScript (~5.8)** | Szigorú típusosság (`src/types/fop.ts`) |
| **Stílus / UI** | **Tailwind CSS v4** + **Heroicons v2** | `@tailwindcss/vite`, egyedi modálok, kártyák, animációk, splash screen |
| **Backend / Natív mag** | **Rust (2021 Edition)** | Natív Tauri parancsok (`src-tauri/src/commands/`) |
| **Adatbázis** | **SQLite (rusqlite 0.32)** | Beágyazott helyi adatbázis (`database/kadergo.db`), WAL mód, Foreign Keys ON |
| **Dokumentum-motor** | **rust_xlsxwriter** + **zip** | Natív nagysebességű Excel generálás képletekkel + Word .docx XML-alapú sablongenerálás |
| **Böngészőbővítmény** | **Manifest V3 (Vanilla JS / ESM)** | `extensions/tax-gov-zreports/` a `cabinet.tax.gov.ua` adatkinyeréshez |
| **Frissítés / Disztribúció** | **Tauri Updater** | GitHub Releases alapú automatikus frissítésellenőrzés és telepítőfuttatás |

---

## 3. Könyvtárszerkezet Részletesen

```
d:\Kadergo\kadergo\
├── .github/                      # GitHub CI/CD és release workflow-k
├── database/                     # Adatbázis definíciók és helyi SQLite DB
│   ├── kadergo.db                # A futási idejű SQLite adatbázis
│   ├── schema.sql                # SQL séma (magyar táblanevek, relációk, indexek)
│   └── init_db.py                # Python segédscript az adatbázis inicializálásához/teszteléséhez
├── extensions/                   # Böngésző kiegészítők
│   └── tax-gov-zreports/         # Chrome Extension az ukrán adóhivatalhoz (cabinet.tax.gov.ua)
│       ├── manifest.json         # Manifest V3 konfiguráció
│       ├── background.js         # Service worker háttérfolyamat
│       ├── content.js / .css     # Injektált script és autentikus KaderGo stíluslap
│       ├── popup.html / .js      # Bővítmény popup UI
│       └── modules/              # Moduláris komponensek:
│           ├── config.js         # Oszlop- és mezőkonfigurációk
│           ├── date-utils.js     # Dátumkezelés, havi intervallumok, év információk
│           ├── cabinet-interactor.js # Webes adóhivatali űrlap és DOM interakciók
│           ├── table-scraper.js  # Z-jelentések táblázatos adatkinyerése
│           ├── excel.js          # Standard havi forgalmi Excel generáló motor
│           ├── income-book-excel.js # Hivatalos «Книга обліку доходів» Excel motor (nyomtatási nézettel)
│           ├── downloader.js     # Fájlmentés és letöltéskezelés
│           ├── zip.js            # Kliensoldali ZIP archívum-összeállító
│           ├── modal-assets.js   # SVG ikonok, logók és animációs assetek
│           ├── modal-dock.js     # Lebegő mini-dock háttérben futó adatgyűjtéshez
│           ├── modal-templates.js# Modális ablak DOM sablonjai
│           ├── modal-period.js   # Interaktív 12 hónapos naptár és saját periódusválasztó
│           ├── modal-flow.js     # Animált folyamatjelző, fázisvezérlő és státuszkezelő
│           ├── modal.js          # Fő modál-orkesztrátor és nézetkezelő
│           ├── exporter-single.js# Kiválasztott РРО egyedi export modulja
│           ├── exporter-all.js   # Összes РРО automatikus kötegelt export modulja
│           ├── exporter-book.js  # VÉDETT: Éves Книга обліку доходів és havi zárások motorja
│           ├── exporter.js       # Fő export koordinátor és egységesített homlokzat
│           └── ui.js             # Gombok beágyazása és eseménykezelők
├── logo/                         # Logók, vektoros és képi arculati elemek
├── public/                       # Statikus frontend assetek
├── scratch/                      # Reverse-engineering és elemző scriptek (docx XML struktúra analízis)
├── src/                          # FRONTEND (React 19 + TypeScript + Tailwind)
│   ├── assets/                   # Képek, SVG-k
│   ├── components/               # React komponensek könyvtára
│   │   ├── AddFopModal/          # FOP hozzáadása varázsló (3 lépés: személyes, lakcím, okmány)
│   │   ├── AddWorkerModal/       # Munkavállaló hozzáadása varázsló (2 lépés: személyes, jogviszony)
│   │   ├── common/               # Újrafelhasználható UI elemek (FopCard, WorkerCard, Header, StatsGrid, stb.)
│   │   ├── generators/           # Dokumentumgenerátor nézetek és űrlapok
│   │   │   ├── grafik/           # GrafikGeneratorView.tsx (Műszakbeosztás)
│   │   │   ├── nakaz/            # NakazGeneratorView.tsx (Rendeletek/Utasítások)
│   │   │   ├── payroll/          # PayrollGeneratorView.tsx (Bérszámfejtés előnézet & Excel)
│   │   │   ├── shtat/            # ShtatGeneratorView.tsx (Létszámterv)
│   │   │   ├── tabel/            # TabelGeneratorView.tsx (Munkaidő-nyilvántartás P-5)
│   │   │   └── zayava/           # ZayavaPriyomGeneratorView.tsx (Felvételi kérelem)
│   │   ├── modals/               # Felugró dialógusok (EditFopModal, EditWorkerModal, Settings, Update, DatabaseSettingsSection, stb.)
│   │   └── pickers/              # Dátum-, hónap- és időszakválasztó vezérlők
│   ├── constants/                # Kezdőértékek és konstansok (pl. initialData.ts)
│   ├── services/                 # Üzleti logika és Tauri IPC kommunikáció
│   │   ├── fopService.ts         # FOP/Munkás CRUD, fájlműveletek, bérszámfejtés, localStorage
│   │   └── updaterService.ts     # Frissítéskezelő (Tauri updater & GitHub release letöltés)
│   ├── types/                    # TypeScript típusdefiníciók
│   │   └── fop.ts                # FopData, Munkas, Szemely, Cim, Okmany, Jogviszony, FolderGroup
│   ├── utils/                    # Segédfüggvények
│   │   ├── addressUtils.ts       # Ukrán címformázás és normalizálás
│   │   └── ukrainianDeclension.ts# Ukrán név- és pozícióragozás shevchenko.js alapon (nyelvtani esetekhez docx-ben és UI-ban)
│   ├── views/                    # Oldalszintű nézetek
│   │   └── DocumentGeneratorView.tsx # A dokumentumgenerátor modul fő képernyője
│   ├── App.tsx                   # Fő alkalmazás komponens (fülek, szűrés, D&D, állapot)
│   ├── App.css                   # Globális stílusok és Tailwind kiegészítések
│   └── main.tsx                  # React belépési pont
├── src-tauri/                    # BACKEND (Rust + Tauri v2)
│   ├── capabilities/             # Tauri v2 jogosultságok (default.json)
│   ├── icons/                    # App ikonok különböző platformokra
│   ├── src/                      # Rust forráskód
│   │   ├── commands/             # Tauri IPC handler funkciók
│   │   │   ├── nakaz/            # Rendeletgenerátor almodulok (priyom, zvilnennya, kasa, prro, shtat, vidpustok, scanner)
│   │   │   ├── fop_commands.rs   # FOP CRUD, csoport-hozzárendelés, törlés/kuka
│   │   │   ├── worker_commands.rs# Munkás CRUD, elbocsátás (dismiss)
│   │   │   ├── fs_commands.rs    # Fájlrendszer tallózás, mappa-szkennelés, explorer nyitás
│   │   │   ├── payroll_commands.rs# Bérszámfejtési kalkulációk és Excel generálás
│   │   │   ├── tabel_commands.rs # P-5 munkaidő-táblázat kalkuláció és Excel generálás
│   │   │   ├── shtat_commands.rs # Létszámterv docx generálás
│   │   │   ├── grafik_commands.rs# Műszakrend docx generálás
│   │   │   ├── zayava_commands.rs# Felvételi kérelem docx generálás
│   │   │   ├── database_commands.rs# Adatbázis export (.kadergo backup), import, SQLite online backup & validáció
│   │   │   └── mod.rs            # Parancsok exportálása
│   │   ├── db/                   # Adatbázis réteg
│   │   │   ├── connection.rs     # SQLite csatlakozás, séma futtatás, automatikus mezőbővítések
│   │   │   ├── seed.rs           # Kezdőadatok feltöltése
│   │   │   └── mod.rs
│   │   ├── models/               # Rust adatmodellek és DTO-k
│   │   │   ├── common.rs         # Közös struktúrák
│   │   │   ├── fop.rs            # FOP modellek
│   │   │   ├── worker.rs         # Munkavállaló modellek
│   │   │   └── mod.rs
│   │   ├── lib.rs                # Tauri App builder, IPC handler regisztráció
│   │   └── main.rs               # Futtatható bináris belépési pont
│   ├── Cargo.toml                # Rust függőségek (rusqlite, rust_xlsxwriter, zip, reqwest, rfd)
│   └── tauri.conf.json           # Tauri konfiguráció (ablakméret, updater, bundle id: com.kadergo.app)
├── package.json                  # Node.js csomagok és frontend scriptek
├── tsconfig.json                 # TypeScript konfiguráció
└── vite.config.ts                # Vite konfiguráció (TailwindCSS plugin integráció)
```

---

## 4. Adatmodell és Adatbázis Séma (`database/schema.sql`)

Az adatbázis táblái **magyar nyelvű elnevezésekkel** rendelkeznek, míg az üzleti tartalom az ukrán munkaügyi és személyi nyilvántartási formátumot követi.

### Fő táblák és kapcsolataik:

```
+--------------------+       1:1       +--------------------+
|      szemely       | <-------------> |        fop         |
| (id, vezeteknev,   |                 | (szemely_id,       |
|  keresztnev,       |       1:N       |  fop_kod,          |
|  apai_nev, kod,    | <-------------+ |  folder_path,      |
|  szuletesi_datum,  |               | |  folder_group,     |
|  nem)              |               | |  deleted_at)       |
+--------------------+               | +--------------------+
       | 1:N                         |           | 1:N
       v                             |           v
+--------------------+               | +--------------------+
|        cim         |               +-+     jogviszony     |
| (szemely_id,       |                 | (munkavallalo_id,  |
|  orszag, megye,    |                 |  fop_id, foallas,  |
|  jaras, kozseg,    |                 |  teljes_munkaido,  |
|  utca, haz, lakas) |                 |  foglalkozas,      |
+--------------------+                 |  fizetes,          |
       | 1:N                           |  munkakezdes,      |
       v                               |  munkaviszony_vege)|
+--------------------+                 +--------------------+
|       okmany       |                           | 1:N
| (szemely_id, tipus,|                           v
|  szeria, szam,     |                 +--------------------+
|  hatosag, datumok) |                 |       kopek        |
+--------------------+                 | (munkavallalo_id,  |
                                       |  fop_id, ev,       |
+--------------------+                 |  honap, kopek)     |
|    folder_group    |                 +--------------------+
| (id, name, color)  |
+--------------------+
```

- **`szemely`**: Alapvető személyes adatok (FOP tulajdonos és munkavállalók közös táblája). Mezők: `vezeteknev`, `keresztnev`, `apai_nev`, `szuletesi_datum`, `nem` ('Чоловік' | 'Жінка'), `kod` (adószám / ИНН).
- **`cim`**: Lakcím adatok (megye, járás, község, utca, házszám, épület, lakás/szoba).
- **`okmany`**: Személyazonosító okmányok (`tipus`: 0 = régi útlevél-füzet, 1 = új ID-kártya; széria, szám, kiállító hatóság, kiállítási és lejárati dátum).
- **`fop`**: Egyéni vállalkozói profil. Kapcsolódik a `szemely`-hez. Tartalmazza a `folder_path` (kapcsolt fájlrendszer mappa), `folder_group` (színkódolt kategória), `deleted_at` (kuka/soft delete) mezőket.
- **`jogviszony`**: Munkaszerződés / foglalkoztatási jogviszony a munkavállaló (`munkavallalo_id` -> `szemely.id`) és a vállalkozó (`fop_id` -> `fop.id`) között. Tartalmazza a munkakört (`foglalkozas_megnevezes`, `foglalkozas_kod`), bért (`fizetes`), munkaidőt (`teljes_munkaido`, `foallas`), dátumokat és a табельний номер-t.
- **`kopek`**: Havi bérszámfejtési maradvány (kopejkák) nyilvántartása göngyöléshez.
- **`folder_group`**: FOP csoportok/kategóriák testreszabható névvel és színnel (drag & drop rendezés támogatásához).

---

## 5. Dokumentumgenerátor Motorok

### A. Word (.docx) Generálás (`src-tauri/src/commands/nakaz/`, `shtat_commands.rs`, stb.)
- A Word dokumentumokat **nem külső Office/COM hívásokkal**, hanem közvetlenül a `.docx` formátum ZIP/XML struktúrájának natív manipulálásával állítja elő a Rust backend.
- A mintadokumentumok (`word/document.xml`, stílusok, táblázatok) XML-jében célzott helyettesítések történnek a megfelelő ukrán nyelvtani esetek (genitívusz, datívusz) alkalmazásával (segítségül hívva a `ukrainianDeclension.ts`-t a frontenden, illetve a Rust logikát a backendben).

### B. Excel (.xlsx) Generálás (`src-tauri/src/commands/payroll_commands.rs`, `tabel_commands.rs`)
- A **`rust_xlsxwriter`** crate segítségével natív, villámgyors és 1:1 formázott Excel táblázatok jönnek létre.
- **Tabel P-5:** Havi munkanapok, ledolgozott órák, hétvégék és kódok precíz elrendezése.
- **Payroll:** Bruttó bér, adók (ПДФО 18%, Військовий збір 1.5% / 5%), nettó kifizetés, kopek göngyölés és összegző SUM képletek.

---

## 6. Chrome Bővítmény (`extensions/tax-gov-zreports`)

- **Feladata:** A `https://cabinet.tax.gov.ua/cashregs/zreports` oldalról egy kattintással letölti a napi Z-jelentések (forgalom, készpénzes, bankkártyás összegek, visszáruk) adatait és hivatalos könyvelési kimutatásokat készít.
- **Három fő exportálási mód:**
  1. **Обраний РРО:** Egy kiválasztott pénztárgép forgalmának letöltése (egyedi Excel vagy havi bontású ZIP archívum).
  2. **Всі РРО:** Az összes regisztrált pénztárgép (`400...`) forgalmának automatikus iteratív lekérése és havi aggregálása.
  3. **Книга обліку доходів (Єдиний податок):** Hivatalos ukrán egyéni vállalkozói bevételi könyv generálása az év lezárt hónapjaira, vagy tetszőlegesen módosítható saját időszakra. Nyomtatásbarát Excel lapbeállításokkal (`fitToWidth="1"` / `fitToHeight="1"`), havi és éves összesítésekkel.
- **Fő képessége:** Áthidalja a hivatalos adóhivatali portál 1 hónapos lekérdezési korlátját: tetszőleges intervallumot automatikusan havi szeletekre bont, és havi bontásban készít formázott Excel fájlokat vagy akár egyetlen összesített forgalmi kimutatást az összes PPRO-ra nézve.
- **Moduláris felépítés (`modules/`):**
  - `modal-period.js`: 12 hónapos interaktív naptár és kézi dátumbeviteli komponens gyors `↺ Авто` visszaállítással.
  - `modal-flow.js`: Animált folyamatjelző, fázisvezérlő (logó intro, spinner, zöld pipa sikeranimáció) és mini-dock szinkronizáció.
  - `modal-dock.js`: Kis méretre csukható lebegő állapotjelző a háttérben futó adatletöltések zavartalan nyomon követésére.
  - `income-book-excel.js`: Beépített XML/ZIP Excel generátor formázott cellákkal és crash-biztos nyomtatási paraméterekkel.
- A bővítmény közvetlenül exportálható a Tauri alkalmazás menüjéből is a `export_chrome_extension` paranccsal.

---

## 7. Főbb Tauri IPC Parancsok (`src-tauri/src/lib.rs`)

| Kategória | Parancsnév | Funkció |
| :--- | :--- | :--- |
| **FOP Kezelés** | `get_fops`, `create_fop`, `update_fop`, `delete_fop`, `delete_all_fops` | FOP profilok lekérése (munkavállalókkal együtt), mentése, szerkesztése, kukába helyezése |
| **Csoportosítás** | `get_folder_groups`, `create_folder_group`, `update_folder_group`, `delete_folder_group`, `move_fop_to_group` | FOP mappacsoportok kezelése |
| **Munkavállaló** | `create_worker`, `update_worker`, `dismiss_worker`, `delete_worker` | Alkalmazottak felvétele, módosítása, munkaviszony lezárása |
| **Fájlrendszer** | `pick_folder`, `pick_fop_folder`, `ensure_fop_directory`, `open_folder_in_explorer`, `open_file_directly` | Mappaválasztók, automatikus FOP könyvtárstruktúra biztosítása |
| **Szkennelés** | `scan_fop_folders`, `scan_and_import_fop_folders`, `import_selected_fops`, `scan_fop_nakazy` | Meglévő merevlemezes mappák beolvasása, dokumentumok felismerése |
| **Payroll** | `preview_payroll`, `preview_payroll_period`, `generate_payroll_excel`, `save_worker_kopek` | Bérszámfejtési kalkulációk, előnézetek és Excel export |
| **Tabel** | `preview_tabel`, `preview_tabel_period`, `generate_tabel_excel`, `generate_tabel_period_excel` | P-5 munkaidő-nyilvántartás előnézet és Excel export |
| **Dokumentumok**| `generate_zayava_priyom_docx`, `generate_shtat_docx`, `generate_grafik_docx`, `generate_nakaz_*` | Hivatalos Word `.docx` iratok generálása |
| **Rendszer** | `fetch_github_releases`, `download_and_run_installer`, `export_chrome_extension`, `reseed_db` | Frissítés, karbantartás, kiegészítő export |

---

## 8. Fejlesztési és Futtatási Útmutató

### Előfeltételek:
- **Node.js** (v18+) és **npm**
- **Rust** és **Cargo** (legfrissebb stabil kiadás)
- C++ Build Tools (Windows esetén `visualstudio2022-workload-vctools`)

### Parancsok:
- **Fejlesztői mód (Frontend + Tauri együtt):**
  ```powershell
  npm run tauri dev
  ```
- **Csak Frontend futtatása böngészőben (mock / UI tesztelés):**
  ```powershell
  npm run dev
  ```
- **Alkalmazás építése (Production build):**
  ```powershell
  npm run tauri build
  ```

---

## 9. Útmutatás AI Asszisztenseknek és Munkameneteknek

Amikor a felhasználó egy új munkamenetben feladatot ad:
1. **Mindig vedd figyelembe a kétnyelvű terminológiát:**
   - Adatbázis és belső kódstruktúra: **magyar** (`szemely`, `cim`, `okmany`, `jogviszony`, `fop`, `munkasok`, `kopek`).
   - Felhasználói felület és generált dokumentumok: **ukrán** (ФОП, найманий працівник, Наказ, Заява, Штатний розпис, Табель, Розрахункова відомість).
2. **Két fő munkaterület létezik a felületen (`App.tsx`):**
   - `"management"`: FOP-ok és munkavállalók kezelése, kártyák, mappák, szerkesztés.
   - `"generator"`: Dokumentumgeneráló nézet (`DocumentGeneratorView.tsx`).
3. **Adatbázis módosítások:** Ha az adatbázis sémához nyúlsz, a `database/schema.sql`-t és a `src-tauri/src/db/connection.rs`-ben lévő migrációs hívásokat is szinkronban kell tartani!

