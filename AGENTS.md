# AGENTS.md — Kadergo

Lásd a [GEMINI.md](file:///d:/Kadergo/kadergo/GEMINI.md) és a részletes [PROJECT_STRUCTURE.md](file:///d:/Kadergo/kadergo/PROJECT_STRUCTURE.md) fájlokat a projekt architektúrájához, technológiai stackjéhez és könyvtárszerkezetéhez.

## AI Munkafolyamat és Sebesség Szabályok
1. **Ne elemezz túl:** Az `.md` fájlokból tájékozódj elsőként. Ne olvass be feleslegesen sok száz sort, ha a feladat egyértelmű hibára vagy komponensre vonatkozik.
2. **Bontsd szét a monolitokat:** Kerüld a 300+ soros fájlokat. Ha egy fájl megnő, darabold szét egyértelmű feladatkörű modulokra, hogy a későbbi feladatoknál minimális gondolkodási idővel, azonnal tudd módosítani a releváns részt.
3. **Izoláld a védett logikát:** Ha egy funkcióról (pl. Kнига доходів) a felhasználó jelzi, hogy jól működik, fizikailag külön fájlba kell szervezni, hogy semmilyen más javítás ne érinthesse.

