// Helper for Ukrainian declensions (Dative for FOP, Genitive for Worker)

export function declineMaleSurnameGenitive(name: string): string {
  if (!name) return "";
  const n = name.trim();
  if (n.endsWith("ик") || n.endsWith("ук") || n.endsWith("юк") || n.endsWith("ак") || n.endsWith("як") || n.endsWith("ок") || n.endsWith("ець")) {
    return n + "а";
  }
  if (n.endsWith("ич") || n.endsWith("ович") || n.endsWith("евич") || n.endsWith("ев")) {
    return n + "а";
  }
  if (n.endsWith("ов") || n.endsWith("ев") || n.endsWith("єв") || n.endsWith("ін") || n.endsWith("їн")) {
    return n + "а";
  }
  if (n.endsWith("ий") || n.endsWith("ій")) {
    return n.slice(0, -2) + "ого";
  }
  if (n.endsWith("а") || n.endsWith("я")) {
    return n.slice(0, -1) + "и";
  }
  return n + "а";
}

export function declineMaleFirstNameGenitive(name: string): string {
  if (!name) return "";
  const n = name.trim();
  if (n.endsWith("о") || n.endsWith("й") || n.endsWith("ь")) {
    return n.slice(0, -1) + "а";
  }
  if (n.endsWith("а") || n.endsWith("я")) {
    return n.slice(0, -1) + "и";
  }
  return n + "а";
}

export function declineMalePatronymicGenitive(name: string): string {
  if (!name) return "";
  const n = name.trim();
  if (n.endsWith("ич") || n.endsWith("чич")) {
    return n + "а";
  }
  return n + "а";
}

export function declineFemaleSurnameGenitive(name: string): string {
  if (!name) return "";
  const n = name.trim();
  if (n.endsWith("ська") || n.endsWith("цька") || n.endsWith("зька")) {
    return n.slice(0, -2) + "кої";
  }
  if (n.endsWith("а") || n.endsWith("я")) {
    return n.slice(0, -1) + "и";
  }
  return n;
}

export function declineFemaleFirstNameGenitive(name: string): string {
  if (!name) return "";
  const n = name.trim();
  if (n.endsWith("а")) return n.slice(0, -1) + "и";
  if (n.endsWith("я")) return n.slice(0, -1) + "ї";
  if (n.endsWith("ь")) return n.slice(0, -1) + "і";
  return n + "и";
}

export function declineFemalePatronymicGenitive(name: string): string {
  if (!name) return "";
  const n = name.trim();
  if (n.endsWith("вна") || n.endsWith("івна") || n.endsWith("ївна")) {
    return n.slice(0, -1) + "и";
  }
  return n + "и";
}

export function getWorkerGenitiveName(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): string {
  const isFemale = nem?.toLowerCase() === "жінка" || nem?.toLowerCase() === "nő" || nem?.toLowerCase() === "female";

  if (isFemale) {
    const s = declineFemaleSurnameGenitive(vezeteknev);
    const f = declineFemaleFirstNameGenitive(keresztnev);
    const p = apai_nev ? declineFemalePatronymicGenitive(apai_nev) : "";
    return [s, f, p].filter(Boolean).join(" ");
  } else {
    const s = declineMaleSurnameGenitive(vezeteknev);
    const f = declineMaleFirstNameGenitive(keresztnev);
    const p = apai_nev ? declineMalePatronymicGenitive(apai_nev) : "";
    return [s, f, p].filter(Boolean).join(" ");
  }
}

// Dative Case for FOP
export function getFopDativeName(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): string {
  const isFemale = nem?.toLowerCase() === "жінка" || nem?.toLowerCase() === "nő" || nem?.toLowerCase() === "female";

  if (isFemale) {
    const s = vezeteknev.endsWith("ська") || vezeteknev.endsWith("цька") ? vezeteknev.slice(0, -2) + "кій" : vezeteknev + "і";
    const f = keresztnev.endsWith("а") ? keresztnev.slice(0, -1) + "і" : keresztnev + "і";
    const p = apai_nev ? (apai_nev.endsWith("вна") ? apai_nev.slice(0, -1) + "і" : apai_nev) : "";
    return [s, f, p].filter(Boolean).join(" ");
  } else {
    const s = vezeteknev.endsWith("ич") || vezeteknev.endsWith("ук") || vezeteknev.endsWith("юк") || vezeteknev.endsWith("ак") || vezeteknev.endsWith("ов") || vezeteknev.endsWith("ев") ? vezeteknev + "у" : vezeteknev + "у";
    const f = keresztnev.endsWith("й") || keresztnev.endsWith("ь") ? keresztnev.slice(0, -1) + "ю" : keresztnev + "у";
    const p = apai_nev ? (apai_nev.endsWith("ич") ? apai_nev + "у" : apai_nev) : "";
    return [s, f, p].filter(Boolean).join(" ");
  }
}

// Accusative Case for Worker (Прийняти кого?)
export function getWorkerAccusativeName(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): string {
  const isFemale = nem?.toLowerCase() === "жінка" || nem?.toLowerCase() === "nő" || nem?.toLowerCase() === "female";

  if (isFemale) {
    const s = vezeteknev.endsWith("ська") || vezeteknev.endsWith("цька") ? vezeteknev.slice(0, -2) + "ську" :
              vezeteknev.endsWith("а") ? vezeteknev.slice(0, -1) + "у" :
              vezeteknev.endsWith("я") ? vezeteknev.slice(0, -1) + "ю" : vezeteknev;
    const f = keresztnev.endsWith("а") ? keresztnev.slice(0, -1) + "у" :
              keresztnev.endsWith("я") ? keresztnev.slice(0, -1) + "ю" : keresztnev;
    const p = apai_nev ? (apai_nev.endsWith("вна") ? apai_nev.slice(0, -1) + "у" : apai_nev) : "";
    return [s, f, p].filter(Boolean).join(" ");
  } else {
    const s = declineMaleSurnameGenitive(vezeteknev);
    const f = declineMaleFirstNameGenitive(keresztnev);
    const p = apai_nev ? declineMalePatronymicGenitive(apai_nev) : "";
    return [s, f, p].filter(Boolean).join(" ");
  }
}

// Dative Case for Worker (Кому?)
export function getWorkerDativeName(
  vezeteknev: string,
  keresztnev: string,
  apai_nev?: string,
  nem?: string
): string {
  const isFemale = nem?.toLowerCase() === "жінка" || nem?.toLowerCase() === "nő" || nem?.toLowerCase() === "female";

  if (isFemale) {
    const s = vezeteknev.endsWith("ська") || vezeteknev.endsWith("цька") ? vezeteknev.slice(0, -2) + "ській" :
              vezeteknev.endsWith("а") ? vezeteknev.slice(0, -1) + "і" :
              vezeteknev.endsWith("я") ? vezeteknev.slice(0, -1) + "ї" : vezeteknev;
    const f = keresztnev.endsWith("а") ? keresztnev.slice(0, -1) + "і" :
              keresztnev.endsWith("я") ? keresztnev.slice(0, -1) + "ї" :
              keresztnev.endsWith("ь") ? keresztnev.slice(0, -1) + "і" : keresztnev + "і";
    const p = apai_nev ? (apai_nev.endsWith("вна") ? apai_nev.slice(0, -1) + "і" : apai_nev) : "";
    return [s, f, p].filter(Boolean).join(" ");
  } else {
    const s = vezeteknev.endsWith("ий") || vezeteknev.endsWith("ій") ? vezeteknev.slice(0, -2) + "ому" : vezeteknev;
    const f = keresztnev.endsWith("й") || keresztnev.endsWith("ь") ? keresztnev.slice(0, -1) + "ю" :
              keresztnev.endsWith("о") ? keresztnev.slice(0, -1) + "у" :
              keresztnev.endsWith("а") || keresztnev.endsWith("я") ? keresztnev.slice(0, -1) + "і" : keresztnev + "у";
    const p = apai_nev ? (apai_nev.endsWith("ич") ? apai_nev + "у" : apai_nev) : "";
    return [s, f, p].filter(Boolean).join(" ");
  }
}

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
    const yearSuffix = suffixMode === "yearWord" ? " року." : suffixMode === "r" ? "р." : "";
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
