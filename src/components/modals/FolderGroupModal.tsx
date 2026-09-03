import React, { useState, useEffect } from "react";
import { XMarkIcon, FolderIcon } from "@heroicons/react/24/outline";
import { FolderGroup } from "../../types/fop";

interface FolderGroupModalProps {
  isOpen: boolean;
  editingGroup: FolderGroup | null;
  onClose: () => void;
  onSubmit: (name: string, color: string) => Promise<void>;
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  if (c.length !== 6) return { h: 30, s: 90, l: 60 };
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export const PRESET_COLORS = [
  { label: "Бурштиновий", hex: "#f8a44c" },
  { label: "Помаранчевий", hex: "#f97316" },
  { label: "Кораловий", hex: "#ef4444" },
  { label: "Трояндовий", hex: "#f43f5e" },
  { label: "Малиновий", hex: "#e11d48" },
  { label: "Смарагдовий", hex: "#10b981" },
  { label: "М'ятний", hex: "#14b8a6" },
  { label: "Морський", hex: "#06b6d4" },
  { label: "Синій", hex: "#3b82f6" },
  { label: "Кобальтовий", hex: "#2563eb" },
  { label: "Індиго", hex: "#6366f1" },
  { label: "Фіолетовий", hex: "#8b5cf6" },
  { label: "Пурпуровий", hex: "#a855f7" },
  { label: "Рожевий", hex: "#ec4899" },
  { label: "Темний бірюзовий", hex: "#133b47" },
  { label: "Графітовий", hex: "#475569" },
];

export const FolderGroupModal: React.FC<FolderGroupModalProps> = ({
  isOpen,
  editingGroup,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#f8a44c");
  const [hue, setHue] = useState(30);
  const [lightness, setLightness] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingGroup) {
      setName(editingGroup.name);
      const initColor = editingGroup.color || "#f8a44c";
      setColor(initColor);
      const { h, l } = hexToHsl(initColor);
      setHue(h);
      setLightness(Math.max(20, Math.min(80, l)));
    } else {
      setName("");
      setColor("#f8a44c");
      setHue(30);
      setLightness(60);
    }
    setError(null);
  }, [editingGroup, isOpen]);

  const handleHueChange = (newHue: number) => {
    setHue(newHue);
    const newHex = hslToHex(newHue, 90, lightness);
    setColor(newHex);
  };

  const handleLightnessChange = (newL: number) => {
    setLightness(newL);
    const newHex = hslToHex(hue, 90, newL);
    setColor(newHex);
  };

  const handleHexChange = (typedHex: string) => {
    setColor(typedHex);
    if (/^#[0-9A-Fa-f]{6}$/.test(typedHex)) {
      const { h, l } = hexToHsl(typedHex);
      setHue(h);
      setLightness(Math.max(20, Math.min(80, l)));
    }
  };

  const handlePresetSelect = (presetHex: string) => {
    setColor(presetHex);
    const { h, l } = hexToHsl(presetHex);
    setHue(h);
    setLightness(Math.max(20, Math.min(80, l)));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Вкажіть назву папки");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), color);
      onClose();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999999] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#cbd8d6] rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-modalScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b-2 border-[#e2eceb] bg-[#f8faf9]">
          <h2 className="text-lg font-black text-[#133b47] font-heading flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: `${color}20`, color: color }}
            >
              <FolderIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span>{editingGroup ? "Редагування папки" : "Нова папка / група"}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#5c777f] hover:text-[#133b47] hover:bg-[#e6eeed] transition-all cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 flex flex-col gap-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Folder Name */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
              Назва папки <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Наприклад: Магазини, Послуги, Бухгалтерія..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
              className="w-full h-12 px-4 rounded-2xl bg-white border-2 border-[#bdcdcb] text-[#133b47] text-sm font-bold focus:outline-none focus:border-[#133b47] focus:ring-4 focus:ring-[#133b47]/10 transition-all"
            />
          </div>

          {/* Color Selection */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-[#354f57]">
              Колір папки
            </label>
            {/* Curated Swatches Grid */}
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((preset) => {
                const isSelected = color.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    title={preset.label}
                    onClick={() => handlePresetSelect(preset.hex)}
                    className={`h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer transform hover:scale-110 ${
                      isSelected ? "ring-2 ring-offset-2 ring-[#133b47] scale-110 shadow-sm" : "hover:opacity-90"
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && <span className="text-white text-[10px] font-black">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Custom UI Color Sliders & Hex Box */}
            <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-[#f4f9f8] border-2 border-[#cbd8d6]">
              {/* Rainbow Hue Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] font-black text-[#57727b] uppercase">
                  <span>Відтінок (Тон)</span>
                  <span>{hue}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hue}
                  onChange={(e) => handleHueChange(Number(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer focus:outline-none accent-white shadow-inner"
                  style={{
                    background:
                      "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                  }}
                />
              </div>

              {/* Lightness Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] font-black text-[#57727b] uppercase">
                  <span>Яскравість / Тінь</span>
                  <span>{lightness}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={lightness}
                  onChange={(e) => handleLightnessChange(Number(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer focus:outline-none accent-white shadow-inner"
                  style={{
                    background: `linear-gradient(to right, #1a1a1a, hsl(${hue}, 90%, 50%), #ffffff)`,
                  }}
                />
              </div>

              {/* Hex Code Input with Live Circle */}
              <div className="flex items-center gap-2.5 pt-1 border-t border-[#d8e5e3]">
                <div
                  className="w-7 h-7 rounded-xl shadow-xs shrink-0 border border-white"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-black text-[#133b47]">HEX:</span>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="#RRGGBB"
                  maxLength={7}
                  className="flex-1 h-8 px-3 rounded-xl bg-white border border-[#bdcdcb] text-xs font-mono font-black text-[#133b47] focus:outline-none focus:border-[#133b47] uppercase"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] font-black uppercase text-[#6d8a93]">Попередній перегляд:</span>
            <div
              className="p-4 rounded-2xl border-2 flex items-center gap-3 transition-all"
              style={{
                backgroundColor: `${color}12`,
                borderColor: `${color}55`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
                style={{ backgroundColor: color, color: "#ffffff" }}
              >
                <FolderIcon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-[#133b47]">{name || "Назва папки"}</span>
                <span className="text-[11px] font-bold text-[#627f88]">0 ФОП</span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#e6eeed] hover:bg-[#d5e2e0] text-[#133b47] font-black text-xs transition-all cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Збереження..." : editingGroup ? "Зберегти зміни" : "Створити папку"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
