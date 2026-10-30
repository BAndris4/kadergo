import * as shevchenko from "shevchenko";
import { useState, useEffect } from "react";

// In-memory cache for fast synchronous lookups across renders
const declensionCache = new Map<string, string>();

/**
 * Normalizes input gender to shevchenko-compatible 'masculine' | 'feminine'
 */
export function normalizeGender(
  nem?: string,
  givenName?: string,
  patronymicName?: string,
  _familyName?: string
): shevchenko.GrammaticalGender {
  const raw = (nem || "").toLowerCase().trim();
  if (
    raw === "жінка" ||
    raw === "nő" ||
    raw === "female" ||
    raw === "f" ||
    raw === "feminine"
  ) {
    return shevchenko.GrammaticalGender.FEMININE;
  }
  if (
    raw === "чоловік" ||
    raw === "férfi" ||
    raw === "male" ||
    raw === "m" ||
    raw === "masculine"
  ) {
    return shevchenko.GrammaticalGender.MASCULINE;
  }

  // Detect from patronymic ending if available
  if (patronymicName) {
    const p = patronymicName.trim().toLowerCase();
    if (p.endsWith("івна") || p.endsWith("ївна") || p.endsWith("овна") || p.endsWith("евна")) {
      return shevchenko.GrammaticalGender.FEMININE;
    }
    if (p.endsWith("ич") || p.endsWith("ович") || p.endsWith("евич") || p.endsWith("євич")) {
      return shevchenko.GrammaticalGender.MASCULINE;
    }
  }

  // Detect from common Ukrainian female given name endings
  if (givenName) {
    const g = givenName.trim().toLowerCase();
    if (g.endsWith("а") || g.endsWith("я") || g.endsWith("ія")) {
      // Exceptions: Микола, Ілля, etc. are masculine
      if (g !== "микола" && g !== "ілля" && g !== "лука" && g !== "хома" && g !== "кузьма" && g !== "сава") {
        return shevchenko.GrammaticalGender.FEMININE;
      }
    }
  }

  return shevchenko.GrammaticalGender.MASCULINE;
}

/**
 * Core declension function using shevchenko.js
 */
export async function declineNameWithShevchenko(
  vezeteknev: string,
  keresztnev: string,
  apai_nev: string | undefined,
  nem: string | undefined,
  grammaticalCase: "genitive" | "dative" | "accusative" | "vocative" | "nominative" | "ablative" | "locative"
): Promise<{ familyName: string; givenName: string; patronymicName: string; fullName: string }> {
  const familyName = vezeteknev ? vezeteknev.trim() : "";
  const givenName = keresztnev ? keresztnev.trim() : "";
  const patronymicName = apai_nev ? apai_nev.trim() : "";
  const gender = normalizeGender(nem, givenName, patronymicName, familyName);

  const input: shevchenko.DeclensionInput = {
    gender,
  };
  if (familyName) input.familyName = familyName;
  if (givenName) input.givenName = givenName;
  if (patronymicName) input.patronymicName = patronymicName;

  let output: { familyName?: string; givenName?: string; patronymicName?: string };

  try {
    switch (grammaticalCase) {
      case "genitive":
        output = await shevchenko.inGenitive(input);
        break;
      case "dative":
        output = await shevchenko.inDative(input);
        break;
      case "accusative":
        output = await shevchenko.inAccusative(input);
        break;
      case "vocative":
        output = await shevchenko.inVocative(input);
        break;
      case "ablative":
        output = await shevchenko.inAblative(input);
        break;
      case "locative":
        output = await shevchenko.inLocative(input);
        break;
      case "nominative":
      default:
        output = await shevchenko.inNominative(input);
        break;
    }
  } catch (err) {
    console.warn("shevchenko declension error:", err);
    output = input;
  }

  const outFamily = output.familyName || familyName;
  const outGiven = output.givenName || givenName;
  const outPatronymic = output.patronymicName || patronymicName;
  const fullName = [outFamily, outGiven, outPatronymic].filter(Boolean).join(" ");

  return {
    familyName: outFamily,
    givenName: outGiven,
    patronymicName: outPatronymic,
    fullName,
  };
}

// ─── Asynchronous Declension APIs (Exact shevchenko.js Results) ─────

export async function getWorkerGenitiveNameAsync(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): Promise<string> {
  const key = `gen_${vezeteknev}_${keresztnev}_${apai_nev || ""}_${nem || ""}`;
  if (declensionCache.has(key)) return declensionCache.get(key)!;

  const res = await declineNameWithShevchenko(vezeteknev, keresztnev, apai_nev, nem, "genitive");
  declensionCache.set(key, res.fullName);
  return res.fullName;
}

export async function getWorkerDativeNameAsync(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): Promise<string> {
  const key = `dat_${vezeteknev}_${keresztnev}_${apai_nev || ""}_${nem || ""}`;
  if (declensionCache.has(key)) return declensionCache.get(key)!;

  const res = await declineNameWithShevchenko(vezeteknev, keresztnev, apai_nev, nem, "dative");
  declensionCache.set(key, res.fullName);
  return res.fullName;
}

export async function getWorkerAccusativeNameAsync(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): Promise<string> {
  const key = `acc_${vezeteknev}_${keresztnev}_${apai_nev || ""}_${nem || ""}`;
  if (declensionCache.has(key)) return declensionCache.get(key)!;

  const res = await declineNameWithShevchenko(vezeteknev, keresztnev, apai_nev, nem, "accusative");
  declensionCache.set(key, res.fullName);
  return res.fullName;
}

export async function getWorkerVocativeNameAsync(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): Promise<string> {
  const key = `voc_${vezeteknev}_${keresztnev}_${apai_nev || ""}_${nem || ""}`;
  if (declensionCache.has(key)) return declensionCache.get(key)!;

  const res = await declineNameWithShevchenko(vezeteknev, keresztnev, apai_nev, nem, "vocative");
  declensionCache.set(key, res.fullName);
  return res.fullName;
}

export async function getFopDativeNameAsync(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): Promise<string> {
  return getWorkerDativeNameAsync(vezeteknev, keresztnev, apai_nev, nem);
}

// ─── Synchronous Declension APIs (Cached or Background-Warmed) ──────

export function getWorkerGenitiveName(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): string {
  const key = `gen_${vezeteknev}_${keresztnev}_${apai_nev || ""}_${nem || ""}`;
  if (declensionCache.has(key)) return declensionCache.get(key)!;

  // Trigger background declension to populate cache
  getWorkerGenitiveNameAsync(vezeteknev, keresztnev, apai_nev, nem);
  return [vezeteknev, keresztnev, apai_nev].filter(Boolean).join(" ");
}

export function getWorkerDativeName(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): string {
  const key = `dat_${vezeteknev}_${keresztnev}_${apai_nev || ""}_${nem || ""}`;
  if (declensionCache.has(key)) return declensionCache.get(key)!;

  getWorkerDativeNameAsync(vezeteknev, keresztnev, apai_nev, nem);
  return [vezeteknev, keresztnev, apai_nev].filter(Boolean).join(" ");
}

export function getWorkerAccusativeName(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): string {
  const key = `acc_${vezeteknev}_${keresztnev}_${apai_nev || ""}_${nem || ""}`;
  if (declensionCache.has(key)) return declensionCache.get(key)!;

  getWorkerAccusativeNameAsync(vezeteknev, keresztnev, apai_nev, nem);
  return [vezeteknev, keresztnev, apai_nev].filter(Boolean).join(" ");
}

export function getFopDativeName(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): string {
  return getWorkerDativeName(vezeteknev, keresztnev, apai_nev, nem);
}

// ─── React Hook & Prewarming Helpers ────────────────────────────────

export async function prewarmWorkerDeclensions(
  workers: Array<{ vezeteknev: string; keresztnev: string; apai_nev?: string; nem?: string }>
): Promise<void> {
  if (!workers || workers.length === 0) return;
  await Promise.all(
    workers.flatMap((w) => [
      getWorkerGenitiveNameAsync(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem),
      getWorkerDativeNameAsync(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem),
      getWorkerAccusativeNameAsync(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem),
    ])
  );
}

export function useWorkerDeclensions(
  workers: Array<{ id: number; vezeteknev: string; keresztnev: string; apai_nev?: string; nem?: string }> | undefined
): Record<number, { genitive: string; dative: string; accusative: string }> {
  const [declensions, setDeclensions] = useState<
    Record<number, { genitive: string; dative: string; accusative: string }>
  >({});

  useEffect(() => {
    if (!workers || workers.length === 0) return;
    let cancelled = false;

    Promise.all(
      workers.map(async (w) => {
        const [genitive, dative, accusative] = await Promise.all([
          getWorkerGenitiveNameAsync(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem),
          getWorkerDativeNameAsync(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem),
          getWorkerAccusativeNameAsync(w.vezeteknev, w.keresztnev, w.apai_nev, w.nem),
        ]);
        return { id: w.id, genitive, dative, accusative };
      })
    ).then((results) => {
      if (cancelled) return;
      const map: Record<number, { genitive: string; dative: string; accusative: string }> = {};
      for (const item of results) {
        map[item.id] = {
          genitive: item.genitive,
          dative: item.dative,
          accusative: item.accusative,
        };
      }
      setDeclensions(map);
    });

    return () => {
      cancelled = true;
    };
  }, [workers]);

  return declensions;
}

// ─── Format & Utility Helpers ───────────────────────────────────────

// Worker Initials (Surname F.P., e.g. "Комарі Г.Ю.")
export function getWorkerInitials(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string
): string {
  const fInitial = keresztnev ? `${keresztnev.trim()[0].toUpperCase()}.` : "";
  const pInitial = apai_nev ? `${apai_nev.trim()[0].toUpperCase()}.` : "";
  return [vezeteknev.trim(), `${fInitial}${pInitial}`].filter(Boolean).join(" ");
}

export function formatUkrainianDate(
  dateStr: string,
  suffixMode: "none" | "r" | "yearWord" = "none"
): string {
  if (!dateStr || !dateStr.trim()) return "";
  let s = dateStr.trim();

  // Strip trailing року or р. if present when suffixMode is none
  if (suffixMode === "none") {
    s = s.replace(/\s*року$/i, "").replace(/\s*р\.?$/i, "");
  }

  const ukrMonths = [
    "січня", "лютого", "березня", "квітня", "травня", "червня",
    "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
  ];
  if (ukrMonths.some((m) => s.toLowerCase().includes(m))) {
    return s;
  }

  let day: number | null = null;
  let monthIdx: number | null = null;
  let year: number | null = null;

  if (s.includes("-")) {
    const parts = s.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        monthIdx = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        monthIdx = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    }
  } else if (s.includes(".")) {
    const parts = s.split(".");
    if (parts.length >= 3) {
      day = parseInt(parts[0], 10);
      monthIdx = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    }
  } else if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length >= 3) {
      day = parseInt(parts[0], 10);
      monthIdx = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    }
  }

  if (day && monthIdx !== null && monthIdx >= 0 && monthIdx < 12 && year) {
    const monthName = ukrMonths[monthIdx];
    const yearSuffix = suffixMode === "yearWord" ? " року" : suffixMode === "r" ? "р." : "";
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    return `${dayStr} ${monthName} ${year}${yearSuffix}`;
  }

  return s;
}

export function formatDotDateWithZeros(dateStr: string): string {
  if (!dateStr || !dateStr.trim()) return "";
  let s = dateStr.trim();
  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;

  if (s.includes("-")) {
    const parts = s.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
    }
  } else if (s.includes(".")) {
    const parts = s.split(".");
    if (parts.length >= 3) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  }

  if (day && month && year) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    return `${dayStr}.${monthStr}.${year}`;
  }
  return s;
}

// Declension for position titles in Genitive case (Родовий відмінок in lower case)
// E.g. "Продавець непродовольчих товарів" -> "продавця непродовольчих товарів"
// "Касир торговельного залу" -> "касира торговельного залу"
export function declinePositionGenitive(position: string): string {
  if (!position || !position.trim()) return "працівника";
  const pos = position.trim().toLowerCase();

  const words = pos.split(" ");
  const declinedWords = words.map((w, idx) => {
    // Only decline the primary noun/modifier if it's not already in genitive case attribute
    if (idx > 0 && !w.startsWith("продав") && !w.startsWith("пекар")) {
      return w;
    }

    if (w === "головний") return "головного";
    if (w === "старший") return "старшого";
    if (w === "молодший") return "молодшого";
    if (w === "провідний") return "провідного";

    if (w.endsWith("продавець")) return w.slice(0, -9) + "продавця";
    if (w.endsWith("товарознавець")) return w.slice(0, -13) + "товарознавця";
    if (w.endsWith("охоронець")) return w.slice(0, -9) + "охоронця";
    if (w.endsWith("фахівець")) return w.slice(0, -8) + "фахівця";
    if (w.endsWith("ець")) return w.slice(0, -3) + "ця";

    if (w.endsWith("ниця")) return w.slice(0, -4) + "ниці";
    if (w.endsWith("ник")) return w.slice(0, -3) + "ника";
    if (w.endsWith("щик")) return w.slice(0, -3) + "щика";

    if (w.endsWith("ар") || w.endsWith("ярь")) return w.slice(0, -2) + "аря";
    if (w.endsWith("кухар")) return "кухаря";
    if (w.endsWith("пекар")) return "пекаря";
    if (w.endsWith("водій")) return w.slice(0, -2) + "водія";

    if (w.endsWith("р") || w.endsWith("т") || w.endsWith("н") || w.endsWith("л") || w.endsWith("к") || w.endsWith("с") || w.endsWith("в") || w.endsWith("м") || w.endsWith("д") || w.endsWith("г") || w.endsWith("б") || w.endsWith("п") || w.endsWith("з")) {
      return w + "а";
    }

    return w;
  });

  return declinedWords.join(" ");
}

/**
 * Calculates default date for Штат or Графік:
 * Either January 1st of the current year (YYYY-01-01), OR if a worker was hired
 * since then, the latest hire date. Picks whichever is later.
 */
export function calculateDefaultShtatOrGrafikDate(workers: Array<{ munkakezdes_datum?: string }> | undefined): string {
  const currentYear = new Date().getFullYear();
  const jan1Str = `${currentYear}-01-01`;
  const jan1Date = new Date(currentYear, 0, 1, 0, 0, 0, 0);

  if (!workers || workers.length === 0) {
    return jan1Str;
  }

  let latestHireDate: Date = jan1Date;
  let latestHireStr: string = jan1Str;

  for (const w of workers) {
    if (!w.munkakezdes_datum || !w.munkakezdes_datum.trim()) continue;

    const s = w.munkakezdes_datum.trim();
    let d: Date | null = null;
    let isoFormatted = s;

    if (s.includes("-")) {
      const parts = s.split("-").map((p) => parseInt(p, 10));
      if (parts.length === 3 && !parts.some(isNaN)) {
        d = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
        isoFormatted = `${parts[0]}-${String(parts[1]).padStart(2, "0")}-${String(parts[2]).padStart(2, "0")}`;
      }
    } else if (s.includes(".")) {
      const parts = s.split(".").map((p) => parseInt(p, 10));
      if (parts.length === 3 && !parts.some(isNaN)) {
        d = new Date(parts[2], parts[1] - 1, parts[0], 0, 0, 0, 0);
        isoFormatted = `${parts[2]}-${String(parts[1]).padStart(2, "0")}-${String(parts[0]).padStart(2, "0")}`;
      }
    }

    if (d && !isNaN(d.getTime())) {
      if (d.getTime() > latestHireDate.getTime()) {
        latestHireDate = d;
        latestHireStr = isoFormatted;
      }
    }
  }

  return latestHireStr;
}
