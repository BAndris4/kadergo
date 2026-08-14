import { Cim } from "../types/fop";

/**
 * Formats a Cim address object into a clean Ukrainian address string for UI display.
 * Avoids duplicate prefixes (e.g. "м. м.", "вул. вул.") and formats:
 * - Oblast: fully spelled out "область" (e.g. "Закарпатська область")
 * - District: fully spelled out "район" (e.g. "Берегівський район")
 * - House: "буд."
 * - Building/block: "корп."
 * - Apartment/room: "кв."
 */
export function formatAddressDisplay(cim?: Cim | null): string {
  if (!cim) return "";

  const parts: string[] = [];

  // 1. Поштовий індекс
  if (cim.iranyitoszam && cim.iranyitoszam.trim()) {
    parts.push(cim.iranyitoszam.trim());
  }

  // 2. Область (не скорочуємо, пишемо "область")
  if (cim.megye && cim.megye.trim()) {
    let m = cim.megye.trim();
    let cleanM = m.replace(/область|обл\.?/gi, "").trim();
    parts.push(`${cleanM} область`);
  }

  // 3. Район (не скорочуємо, пишемо "район")
  if (cim.jaras && cim.jaras.trim()) {
    let j = cim.jaras.trim();
    let cleanJ = j.replace(/район|р-н\.?/gi, "").trim();
    parts.push(`${cleanJ} район`);
  }

  // 4. Населений пункт (село / місто / смт)
  if (cim.kozseg && cim.kozseg.trim()) {
    let k = cim.kozseg.trim();
    if (!/^(м\.|с\.|смт|село|місто)\s+/i.test(k)) {
      k = `м. ${k}`;
    }
    parts.push(k);
  }

  // 5. Вулиця
  if (cim.utca && cim.utca.trim()) {
    let u = cim.utca.trim();
    if (!/^(вул\.|вулиця|пров\.|провулок|просп\.|проспект|б-р|бульвар)\s+/i.test(u)) {
      u = `вул. ${u}`;
    }
    parts.push(u);
  }

  // 6. Будинок
  if (cim.hazszam && cim.hazszam.trim()) {
    let h = cim.hazszam.trim();
    if (!/^(буд\.|будинок|б\.)\s+/i.test(h)) {
      h = `буд. ${h}`;
    }
    parts.push(h);
  }

  // 7. Корпус
  if (cim.epulet && cim.epulet.trim()) {
    let ep = cim.epulet.trim();
    if (!/^(корп\.|корпус|к\.)\s+/i.test(ep)) {
      ep = `корп. ${ep}`;
    }
    parts.push(ep);
  }

  // 8. Квартира / Кімната (кв. коротчення)
  if (cim.lakas_szoba && cim.lakas_szoba.trim()) {
    let lak = cim.lakas_szoba.trim();
    if (!/^(кв\.|квартира|кім\.|кімната)\s+/i.test(lak)) {
      lak = `кв. ${lak}`;
    }
    parts.push(lak);
  }

  return parts.join(", ");
}
