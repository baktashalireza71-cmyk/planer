// ─────────────────────────────────────────────
//  تقویم قمری (هجری قمری - الگوریتم ام‌القری)
//  تبدیل دوسویه بین Date میلادی و تاریخ قمری
// ─────────────────────────────────────────────

export interface HijriDate {
  hy: number;
  hm: number;
  hd: number;
}

/** نام فارسی ماه‌های قمری */
export const HIJRI_MONTHS = [
  "محرم",
  "صفر",
  "ربیع‌الاول",
  "ربیع‌الثانی",
  "جمادی‌الاول",
  "جمادی‌الثانی",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذی‌القعده",
  "ذی‌الحجه",
];

// سازنده‌ی فرمت‌کننده کار پر‌هزینه‌ای است — فقط یک بار در ماژول ساخته می‌شود
const hijriFormatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

/** تبدیل Date میلادی به تاریخ قمری (ام‌القری) */
export function toHijri(date: Date): HijriDate {
  const parts = hijriFormatter.formatToParts(date);
  let hy = 0;
  let hm = 0;
  let hd = 0;
  for (const p of parts) {
    if (p.type === "year") hy = parseInt(p.value, 10);
    else if (p.type === "month") hm = parseInt(p.value, 10);
    else if (p.type === "day") hd = parseInt(p.value, 10);
  }
  return { hy, hm, hd };
}

/**
 * تبدیل تاریخ قمری به Date میلادی.
 * تخمین اولیه بر پایه فرمول hy * 0.970224 + 621.57 (سال کسری میلادیِ آغاز
 * سال قمری) ساخته و با جابه‌جایی ماه/روز قمری به یک «تاریخ» تقریبی تبدیل می‌شود؛
 * سپس جستجوی خطی روزبه‌روز دوسویه (حداکثر ~۷۳۰ گام) انجام می‌شود تا
 * toHijri دقیقاً برابر هدف شود. اگر پیدا نشد null برگردانده می‌شود.
 */
export function fromHijri(hy: number, hm: number, hd: number): Date | null {
  if (!Number.isFinite(hy) || !Number.isFinite(hm) || !Number.isFinite(hd)) return null;
  if (hm < 1 || hm > 12 || hd < 1 || hd > 30) return null;
  if (hy < 1300 || hy > 1600) return null; // خارج از محدوده پایدار Intl

  // تخمین اولیه: سال کسری میلادی (تقریب gy ≈ hy * 0.970224 + 621.57)
  const x = hy * 0.970224 + 621.57;
  // جابه‌جایی درون سال بر اساس ماه/روز قمری (میانگین ماه قمری ≈ ۲۹٫۵۳ روز)
  const targetFrac = x + ((hm - 1) * 29.53 + (hd - 1)) / 365.2425;
  const est = new Date((targetFrac - 1970) * 365.2425 * 86400000);
  const estMid = new Date(est.getFullYear(), est.getMonth(), est.getDate());

  const probe = (offset: number): Date | null => {
    // سازنده Date سرریز روز را خودش مدیریت می‌کند
    const d = new Date(
      estMid.getFullYear(),
      estMid.getMonth(),
      estMid.getDate() + offset
    );
    const h = toHijri(d);
    return h.hy === hy && h.hm === hm && h.hd === hd
      ? new Date(d.getFullYear(), d.getMonth(), d.getDate())
      : null;
  };

  // جستجوی دوسویه: ۳۶۶ گام جلو + ۳۶۶ گام عقب (~۷۳۰ گام)
  for (let off = 0; off <= 366; off++) {
    const fwd = probe(off);
    if (fwd) return fwd;
    if (off > 0) {
      const back = probe(-off);
      if (back) return back;
    }
  }
  return null;
}
