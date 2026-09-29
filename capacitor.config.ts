import type { CapacitorConfig } from "@capacitor/cli";

/**
 * پیکربندی Capacitor — تبدیل وب‌اپ به اپ اندروید
 * ─────────────────────────────────────────────────
 * ✅ حالت پیش‌فرض: اپ کاملاً آفلاین!
 *    رابط کاربری (خروجی بیلد استاتیک) داخل خود APK باندل می‌شود؛
 *    نه سرور لازم است، نه اینترنت. داده‌های کاربر هم روی خود گوشی.
 *    مدیریت تبلیغات/ارتباط = ویرایش public/config.json در گیت‌هاب.
 *
 * 🌐 حالت اختیاری (سروردار): اگر روزی سایت آنلاین داشتی و خواستی اپ
 *    همان سایت را باز کند، آدرسش را در SERVER_URL بگذار و `npx cap sync` بزن.
 *    (در workflow گیت‌هاب هم همان را در فیلد server_url وارد کن)
 */

// خالی = اپ آفلاین با رابط کاربری داخلی (پیشنهاد ما) | آدرس سایت = حالت سروردار
const SERVER_URL = "";

const config: CapacitorConfig = {
  /** شناسه یکتای اپ در بازار — بعد از اولین انتشار قابل تغییر نیست، با دقت انتخاب کن */
  appId: "ir.plannerman.app",
  /** نام اپ که زیر آیکون روی گوشی نمایش داده می‌شود */
  appName: "پلنر من",
  /** خروجی بیلد استاتیک Next.js (ساخته‌شده با `bun run build:static`) */
  webDir: ".next-static",
  ...(SERVER_URL
    ? {
        server: {
          androidScheme: "https",
          url: SERVER_URL,
          /** برای تست با آدرس محلی http موقتاً true کن؛ نسخه نهایی حتماً false */
          cleartext: false,
        },
      }
    : {}),
  /** ظاهر تمام‌صفحه و نوار وضعیت */
  android: {
    allowMixedContent: false,
  },
};

export default config;
