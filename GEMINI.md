# Antigravity & AI Agent Instrukciók — Kadergo Projekt

Ez a fájl automatikusan betöltődik minden új munkamenet kezdetén. Célja, hogy azonnal átlásd a projekt célját, technológiáit, fájlszerkezetét és fejlesztési konvencióit.

A teljes és részletes architektúra leírást a **`PROJECT_STRUCTURE.md`** fájlban találod.

---

## 1. Mi a Kadergo?

A **Kadergo** egy asztali (desktop) ügyviteli és munkaügyi szoftver ukrán egyéni vállalkozók (**ФОП – Фізична особа-підприємець**) és alkalmazottaik (**наймані працівники**) adminisztrációjára, valamint hivatalos dokumentumok (.docx és .xlsx) automatikus generálására.

A projekthez tartozik egy Chrome bővítmény is (`extensions/tax-gov-zreports`), ami a `cabinet.tax.gov.ua` felületről tölti le és alakítja Excel fájlokká a napi Z-jelentéseket.

---

## 2. Technológiai Áttekintés

- **Desktop híd:** Tauri v2 (`src-tauri/`)
- **Backend (Natív Rust):** `rusqlite` (SQLite), `rust_xlsxwriter` (Excel), `zip` (Word .docx XML manipuláció)
- **Frontend:** React 19 + TypeScript + Vite 7 + Tailwind CSS v4 (`src/`)
- **Adatbázis:** SQLite (`database/kadergo.db`), sémája a `database/schema.sql` fájlban található
- **Böngészőbővítmény:** Chrome Extension Manifest V3 (`extensions/tax-gov-zreports/`)

---

## 3. Kulcsfontosságú Szabályok és Konvenciók

1. **Kétnyelvű megközelítés:**
   - **Belső kód, adatbázis táblák és mezők:** **Magyar** nyelven vannak megnevezve (`szemely`, `cim`, `okmany`, `fop`, `jogviszony`, `munkasok`, `kopek`).
   - **Felhasználói felület (UI) és hivatalos dokumentumok:** **Ukrán** nyelven készülnek (ПІБ, Наказ, Заява, Штатний розпис, Табель обліку P-5, Розрахункова відомість).
   - **Kommunikáció a felhasználóval:** **Magyar** nyelven történik.

2. **Dokumentumgenerálás:**
   - A `.docx` fájlok generálása Rust-ban történik a zip/XML sablonok célzott helyettesítésével (nem külső Word folyamattal).
   - A `.xlsx` fájlok (Tabel, Payroll) a `rust_xlsxwriter` segítségével, képletekkel és stílusokkal jönnek létre natívan.

3. **Adatbázis változtatások:**
   - Ha új mező vagy tábla szükséges, azt a `database/schema.sql`-be és a `src-tauri/src/db/connection.rs` migrációs blokkjába (`ALTER TABLE ...` / `CREATE TABLE IF NOT EXISTS ...`) is be kell jegyezni.

4. **Fájlok elhelyezkedése:**
   - Frontend komponensek: `src/components/`
   - Generátorok: `src/components/generators/` (grafik, nakaz, payroll, shtat, tabel, zayava)
   - Tauri IPC hívások: `src/services/fopService.ts`
   - Rust Tauri parancsok: `src-tauri/src/commands/`
   - Típusdefiníciók: `src/types/fop.ts`

5. **AI Hatékonyság és Munkamódszer (KÖTELEZŐ SZABÁLY MINDEN MUNKAMENETBEN):**
   - **MD-First tájékozódás:** Feladat megkezdésekor tilos feleslegesen körbe-olvasni tucatnyi forrásfájlt és percekig tartó túlelemzést végezni. Az `.md` leírásokból (pl. `PROJECT_STRUCTURE.md`) azonnal azonosítsd a felelős komponenst, és hajts végre célzott, gyors, sebészi beavatkozást.
   - **Monolit-mentes, szeparált modulok:** Minden forrásfájl maradjon fókuszált, egyértelmű felelősségi körrel és kis mérettel (ideálisan < 250–350 sor). Kerülendők az 500+ soros monolit fájlok. Ha egy modul hízik, azonnal bontsd szét mikromodulokra (pl. külön exportőrök, külön ablakvezérlők, külön űrlapkezelők). Ez biztosítja a villámgyors kódolvasást és a nulla mellékhatású javításokat.
   - **Feltétlen modul-izoláció:** Ha a felhasználó azt kéri, hogy egy modulhoz (pl. Книга доходів) ne nyúljunk, az a kód legyen fizikailag is külön fájlban, hogy véletlenül se érje módosítás más funkciók javításakor.

Részletes információért és a modulok specifikációjáért olvasd el a **`PROJECT_STRUCTURE.md`** fájlt!

