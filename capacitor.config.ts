import type { CapacitorConfig } from "@capacitor/cli";

/**
 * پیکربندی Capacitor — تبدیل وب‌اپ به اپ اندروید
 * ─────────────────────────────────────────────────
 * ⚠️ مهم‌ترین کار: SERVER_URL را با آدرس سایت منتشرشدهٔ خودت عوض کن
 *    (مثلاً آدرس لیارا: https://planner.liara.run)
 *    اپ اندروید همین آدرس را داخل خودش باز می‌کند و داده‌های
 *    کاربر روی حافظهٔ گوشی ذخیره می‌شود (localStorage همان دامنه).
 *
 * بعد از تغییر این فایل، دستور `npx cap sync` را اجرا کن.
 */

// ⚠️⚠️ این آدرس را عوض کن — آدرس همان سایتی که در مرحلهٔ «هاست» منتشر کردی ⚠️⚠️
const SERVER_URL = "https://CHANGE-ME.example.com";

const config: CapacitorConfig = {
  /** شناسه یکتای اپ در بازار — بعد از اولین انتشار قابل تغییر نیست، با دقت انتخاب کن */
  appId: "ir.plannerman.app",
  /** نام اپ که زیر آیکون روی گوشی نمایش داده می‌شود */
  appName: "پلنر من",
  /** فولدر وب محلی (نیازی به تغییر ندارد — محتوای اصلی از SERVER_URL لود می‌شود) */
  webDir: "public",
  server: {
    androidScheme: "https",
    url: SERVER_URL,
    /**
     * برای تست با آدرس محلی http (مثل http://192.168.x.x:3000) موقتاً true کن؛
     * برای نسخهٔ نهایی بازار حتماً false بگذار.
     */
    cleartext: false,
  },
  /** ظاهر تمام‌صفحه و نوار وضعیت */
  android: {
    allowMixedContent: false,
  },
};

export default config;
