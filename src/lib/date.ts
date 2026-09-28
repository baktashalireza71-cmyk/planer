import {
  toJalaali as jToJalaali,
  toGregorian as jToGregorian,
  jalaaliMonthLength as jMonthLength,
} from "jalaali-js";

// ─────────────────────────────────────────────
//  ثابت‌های تقویم شمسی
// ─────────────────────────────────────────────
export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export const WEEKDAYS_FA = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

/** حروف کوتاه روزهای هفته (شنبه = ۰) */
export const WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// ─────────────────────────────────────────────
//  اعداد فارسی
// ─────────────────────────────────────────────
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** تبدیل عدد یا رشته به رقم‌های فارسی */
export function faNum(value: number | string): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

// ─────────────────────────────────────────────
//  تبدیل‌های تاریخ
// ─────────────────────────────────────────────
export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

/** تبدیل Date به تاریخ شمسی */
export function toJalali(date: Date): JalaliDate {
  return jToJalaali(date);
}

/** تبدیل تاریخ شمسی به Date (ساعت اول روز) */
export function fromJalali(jy: number, jm: number, jd: number): Date {
  const g = jToGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

/** تعداد روزهای یک ماه شمسی */
export function jalaliMonthLength(jy: number, jm: number): number {
  return jMonthLength(jy, jm);
}

/** ایندکس روز هفته با مبنای شنبه (شنبه = ۰) */
export function persianWeekday(date: Date): number {
  return (date.getDay() + 1) % 7;
}

// ─────────────────────────────────────────────
//  کلید روز (YYYY-MM-DD میلادی) برای لاگ‌ها
// ─────────────────────────────────────────────
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** ساخت Date از کلید میلادی «YYYY-MM-DD» (ساعت ۱۲ ظهر برای پایداری منطقه‌زمانی) */
export function dateFromDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

// ─────────────────────────────────────────────
//  فرمت‌های نمایشی
// ─────────────────────────────────────────────
/** «شنبه ۱۵ خرداد ۱۴۰۴» */
export function formatJalaliFull(date: Date): string {
  const { jy, jm, jd } = toJalali(date);
  const weekday = WEEKDAYS_FA[persianWeekday(date)];
  return `${weekday} ${faNum(jd)} ${JALALI_MONTHS[jm - 1]} ${faNum(jy)}`;
}

/** ساعت دیجیتال فارسی «۱۴:۰۵» یا «۱۴:۰۵:۰۹» */
export function formatClockFa(date: Date, withSeconds = false): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  if (!withSeconds) return faNum(`${h}:${m}`);
  const s = String(date.getSeconds()).padStart(2, "0");
  return faNum(`${h}:${m}:${s}`);
}

/** «۱۵ خرداد» */
export function formatJalaliShort(date: Date): string {
  const { jm, jd } = toJalali(date);
  return `${faNum(jd)} ${JALALI_MONTHS[jm - 1]}`;
}

/** «۱۵ خرداد ۱۴۰۴» */
export function formatJalaliMedium(date: Date): string {
  const { jy, jm, jd } = toJalali(date);
  return `${faNum(jd)} ${JALALI_MONTHS[jm - 1]} ${faNum(jy)}`;
}

/** برچسب نسبی فارسی مثل «۳ روز مانده» یا «۲ روز گذشته» */
export function relativeDaysFa(target: Date, today: Date = new Date()): string {
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const t1 = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diff = Math.round((t1.getTime() - t0.getTime()) / 86400000);
  if (diff === 0) return "امروز";
  if (diff === 1) return "فردا";
  if (diff === -1) return "دیروز";
  if (diff > 1) return `${faNum(diff)} روز مانده`;
  return `${faNum(-diff)} روز گذشته`;
}

/** خوش‌آمد بر اساس ساعت روز */
export function timeGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "صبح بخیر";
  if (hour >= 12 && hour < 15) return "ظهر بخیر";
  if (hour >= 15 && hour < 19) return "عصر بخیر";
  return "شب بخیر";
}

/** نقل‌قول انگیزشی روز (چرخشی بر اساس روز سال) */
export const QUOTES_FA: string[] = [
  "شروع کن، حتی اگر کوچک باشد. حرکت مهم‌تر از سرعت است.",
  "روزی که امروز می‌سازی، فردای تو را می‌سازد.",
  "عادت‌های کوچک، تغییرات بزرگ می‌آفرینند.",
  "تمرکز یعنی نه گفتن به صد ایده خوب، برای گفتن بله به یکی.",
  "پیشرفت مهم است، نه کمال. یک قدم کوچک امروز کافی است.",
  "وقت‌ت را به مهم‌ترین چیزها بده، بقیه خودشان جا می‌شوند.",
  "نظم، آزادی می‌آورد؛ نه محدودیت.",
];
