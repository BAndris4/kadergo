import React, { useMemo } from "react";
import { BeanHead } from "beanheads";

export interface BeanAvatarProps {
  gender?: string | null;
  vezeteknev?: string | null;
  keresztnev?: string | null;
  apai_nev?: string | null;
  familyName?: string | null;
  givenName?: string | null;
  patronymicName?: string | null;
  name?: string | null;
  id?: number | string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  isDismissed?: boolean;
}

/**
 * Deterministic hash from string for stable avatar traits per person
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Detects whether the person is female based on explicit gender or Ukrainian name endings.
 */
export function detectIsFemale(
  gender?: string | null,
  givenName?: string | null,
  patronymicName?: string | null,
  familyName?: string | null
): boolean {
  if (gender) {
    const g = gender.toLowerCase().trim();
    if (
      g === "жінка" ||
      g === "nő" ||
      g === "female" ||
      g === "f" ||
      g === "feminine"
    ) {
      return true;
    }
    if (
      g === "чоловік" ||
      g === "férfi" ||
      g === "male" ||
      g === "m" ||
      g === "masculine"
    ) {
      return false;
    }
  }

  // 1. Check patronymic (most reliable in Ukrainian anthroponymy)
  if (patronymicName) {
    const p = patronymicName.trim().toLowerCase();
    if (p.endsWith("івна") || p.endsWith("ївна") || p.endsWith("овна") || p.endsWith("евна")) {
      return true;
    }
    if (p.endsWith("ович") || p.endsWith("евич") || p.endsWith("євич") || p.endsWith("ич")) {
      return false;
    }
  }

  // 2. Check given name
  if (givenName) {
    const gn = givenName.trim().toLowerCase();
    const maleExceptions = [
      "микола",
      "ілля",
      "кузьма",
      "лука",
      "хома",
      "сава",
      "ярема",
      "микита",
    ];
    if (maleExceptions.includes(gn)) {
      return false;
    }
    if (gn.endsWith("а") || gn.endsWith("я") || gn.endsWith("ія")) {
      return true;
    }
  }

  // 3. Check family name
  if (familyName) {
    const fn = familyName.trim().toLowerCase();
    if (
      fn.endsWith("ська") ||
      fn.endsWith("цька") ||
      fn.endsWith("ова") ||
      fn.endsWith("єва") ||
      fn.endsWith("ина") ||
      fn.endsWith("іна")
    ) {
      return true;
    }
    if (
      fn.endsWith("ський") ||
      fn.endsWith("цький") ||
      fn.endsWith("ов") ||
      fn.endsWith("єв") ||
      fn.endsWith("ин") ||
      fn.endsWith("ін")
    ) {
      return false;
    }
  }

  return false;
}

export const BeanAvatar: React.FC<BeanAvatarProps> = ({
  gender,
  vezeteknev,
  keresztnev,
  apai_nev,
  familyName,
  givenName,
  patronymicName,
  name,
  id,
  size = "md",
  className = "",
  isDismissed = false,
}) => {
  const effectiveV = familyName || vezeteknev || "";
  const effectiveK = givenName || keresztnev || "";
  const effectiveA = patronymicName || apai_nev || "";

  // If a combined name was provided without separate parts, split it
  const parts = useMemo(() => {
    if (effectiveV || effectiveK) {
      return {
        v: effectiveV,
        k: effectiveK,
        a: effectiveA,
      };
    }
    if (name) {
      const split = name.trim().split(/\s+/);
      return {
        v: split[0] || "",
        k: split[1] || "",
        a: split[2] || "",
      };
    }
    return { v: "", k: "", a: "" };
  }, [vezeteknev, keresztnev, apai_nev, name]);

  const isFemale = useMemo(() => {
    return detectIsFemale(gender, parts.k, parts.a, parts.v);
  }, [gender, parts.k, parts.a, parts.v]);

  // Seed for consistent, distinct character features per person
  const seed = useMemo(() => {
    const seedString = `${parts.v}_${parts.k}_${parts.a}_${id || ""}`;
    return simpleHash(seedString);
  }, [parts.v, parts.k, parts.a, id]);

  // Generate traits deterministically
  const traits = useMemo(() => {
    if (isFemale) {
      const hairList: Array<"long" | "bun" | "bob" | "pixie"> = [
        "long",
        "bun",
        "bob",
        "pixie",
      ];
      const hairColorList: Array<"black" | "brown" | "blonde" | "orange" | "pink"> = [
        "black",
        "brown",
        "blonde",
        "orange",
        "pink",
      ];
      const clothingList: Array<"dress" | "shirt" | "vneck" | "tankTop"> = [
        "dress",
        "shirt",
        "vneck",
        "tankTop",
      ];
      const clothingColorList: Array<"blue" | "green" | "red" | "black" | "white"> = [
        "blue",
        "green",
        "red",
        "black",
        "white",
      ];
      const mouthList: Array<"lips" | "openSmile" | "grin"> = [
        "lips",
        "openSmile",
        "grin",
      ];
      const lipColorList: Array<"red" | "pink" | "purple"> = [
        "red",
        "pink",
        "purple",
      ];
      const eyesList: Array<"normal" | "happy" | "wink" | "content"> = [
        "normal",
        "happy",
        "wink",
        "content",
      ];
      const skinList: Array<"light" | "yellow" | "brown"> = ["light", "yellow", "brown"];

      return {
        body: "breasts" as const,
        lashes: true,
        hair: hairList[seed % hairList.length],
        hairColor: hairColorList[Math.floor(seed / 7) % hairColorList.length],
        clothing: clothingList[Math.floor(seed / 19) % clothingList.length],
        clothingColor: clothingColorList[Math.floor(seed / 31) % clothingColorList.length],
        facialHair: "none" as const,
        mouth: mouthList[Math.floor(seed / 47) % mouthList.length],
        lipColor: lipColorList[Math.floor(seed / 59) % lipColorList.length],
        eyes: eyesList[Math.floor(seed / 71) % eyesList.length],
        eyebrows: (seed % 2 === 0 ? "raised" : "leftLowered") as "raised" | "leftLowered",
        accessory: seed % 5 === 0 ? ("roundGlasses" as const) : ("none" as const),
        hat: "none" as const,
        skinTone: skinList[Math.floor(seed / 101) % skinList.length],
      };
    } else {
      const hairList: Array<"short" | "buzz" | "balding" | "afro"> = [
        "short",
        "buzz",
        "balding",
        "afro",
      ];
      const hairColorList: Array<"black" | "brown" | "blonde" | "orange" | "white"> = [
        "black",
        "brown",
        "blonde",
        "orange",
        "white",
      ];
      const clothingList: Array<"shirt" | "dressShirt" | "vneck" | "tankTop"> = [
        "shirt",
        "dressShirt",
        "vneck",
        "tankTop",
      ];
      const clothingColorList: Array<"blue" | "black" | "green" | "red" | "white"> = [
        "blue",
        "black",
        "green",
        "red",
        "white",
      ];
      const facialHairList: Array<"none" | "stubble" | "mediumBeard"> = [
        "none",
        "none",
        "stubble",
        "mediumBeard",
      ];
      const mouthList: Array<"openSmile" | "grin" | "serious"> = [
        "openSmile",
        "grin",
        "serious",
      ];
      const eyesList: Array<"normal" | "happy" | "wink" | "content"> = [
        "normal",
        "happy",
        "wink",
        "content",
      ];
      const skinList: Array<"light" | "yellow" | "brown"> = ["light", "yellow", "brown"];

      return {
        body: "chest" as const,
        lashes: false,
        hair: hairList[seed % hairList.length],
        hairColor: hairColorList[Math.floor(seed / 7) % hairColorList.length],
        clothing: clothingList[Math.floor(seed / 19) % clothingList.length],
        clothingColor: clothingColorList[Math.floor(seed / 31) % clothingColorList.length],
        facialHair: facialHairList[Math.floor(seed / 47) % facialHairList.length],
        mouth: mouthList[Math.floor(seed / 59) % mouthList.length],
        lipColor: "red" as const,
        eyes: eyesList[Math.floor(seed / 71) % eyesList.length],
        eyebrows: (seed % 3 === 0 ? "raised" : seed % 3 === 1 ? "serious" : "leftLowered") as
          | "raised"
          | "serious"
          | "leftLowered",
        accessory: seed % 6 === 0 ? ("roundGlasses" as const) : ("none" as const),
        hat: seed % 11 === 0 ? ("beanie" as const) : ("none" as const),
        skinTone: skinList[Math.floor(seed / 101) % skinList.length],
      };
    }
  }, [isFemale, seed]);

  // Size styling
  const sizeClasses = useMemo(() => {
    if (typeof size === "number") {
      return "";
    }
    switch (size) {
      case "xs":
        return "w-6 h-6";
      case "sm":
        return "w-8 h-8";
      case "md":
        return "w-11 h-11";
      case "lg":
        return "w-13 h-13";
      case "xl":
        return "w-16 h-16";
      default:
        return "w-11 h-11";
    }
  }, [size]);

  const customStyle = typeof size === "number" ? { width: size, height: size } : undefined;

  // Background gradient per gender
  const bgStyle = useMemo(() => {
    if (isDismissed) {
      return "bg-slate-200 border-slate-300 grayscale opacity-80";
    }
    return isFemale
      ? "bg-gradient-to-b from-[#fdf2f4] to-[#fce4ec] border-[#f4c2cb]"
      : "bg-gradient-to-b from-[#f0f7f8] to-[#e0eff2] border-[#bad8df]";
  }, [isFemale, isDismissed]);

  return (
    <div
      style={customStyle}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl border overflow-hidden shadow-2xs select-none ${bgStyle} ${sizeClasses} ${className}`}
      title={`${[parts.v, parts.k, parts.a].filter(Boolean).join(" ")} (${isFemale ? "Жінка" : "Чоловік"})`}
    >
      <div className="w-[115%] h-[115%] flex items-center justify-center translate-y-1">
        <BeanHead
          body={traits.body}
          lashes={traits.lashes}
          hair={traits.hair}
          hairColor={traits.hairColor}
          clothing={traits.clothing}
          clothingColor={traits.clothingColor}
          facialHair={traits.facialHair}
          mouth={traits.mouth}
          lipColor={traits.lipColor}
          eyes={traits.eyes}
          eyebrows={traits.eyebrows}
          accessory={traits.accessory}
          hat={traits.hat}
          skinTone={traits.skinTone}
          mask={false}
        />
      </div>
    </div>
  );
};

