/**
 * متادیتای تم‌های برنامه پلنر
 * ------------------------------------------------
 * هر تم یک پالت کامل CSS در globals.css دارد (data-theme="…")
 * و از طریق next-themes روی تگ <html> اعمال می‌شود.
 * - blossom: تم پیش‌فرض شاد پاستلی (محبوب برای استفاده روزمره)
 * - emerald: تم سبز تیل، جدی و خنک
 * - night  : تم تاریک برای چشم (همچنین variant="dark" را فعال می‌کند)
 * - sunset : تم کهربایی گرم و درخشان
 */

export type ThemeId = "blossom" | "emerald" | "night" | "sunset";

export interface ThemeMeta {
  id: ThemeId;
  /** نام فارسی تم */
  name: string;
  /** توضیح کوتاه فارسی */
  desc: string;
  /** رنگ‌های نمونه برای پیش‌نمایش انتخاب‌گر تم */
  swatch: { bg: string; primary: string; accent: string };
}

export const THEMES: ThemeMeta[] = [
  {
    id: "blossom",
    name: "شکوفه",
    desc: "پاستلی شاد و گرم",
    swatch: { bg: "#fff8f0", primary: "#f97316", accent: "#ec4899" },
  },
  {
    id: "emerald",
    name: "زمرد",
    desc: "سبز تیل، جدی و خنک",
    swatch: { bg: "#f2f7f4", primary: "#0d9488", accent: "#059669" },
  },
  {
    id: "night",
    name: "شب",
    desc: "تاریک و آرام برای چشم",
    swatch: { bg: "#16131d", primary: "#7c3aed", accent: "#a78bfa" },
  },
  {
    id: "sunset",
    name: "غروب",
    desc: "کهربایی گرم و درخشان",
    swatch: { bg: "#fff9ec", primary: "#d97706", accent: "#e11d48" },
  },
];

/** لیست شناسه تم‌ها برای next-themes */
export const THEME_IDS: ThemeId[] = THEMES.map((t) => t.id);

/** تم پیش‌فرض برنامه */
export const DEFAULT_THEME: ThemeId = "blossom";
