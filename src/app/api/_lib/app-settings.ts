/**
 * هلپرهای تنظیمات مرکزی برنامه و اعتبار مدیر
 * --------------------------------------------
 * هر دو مدل AppSettings و AdminCredential تک‌ردیفی هستند (id=1)
 * و در اولین درخواست به‌صورت خودکار seed می‌شوند (بدون فایل seed جدا).
 * هیچ رازی (رمز/هش) از این لایه به خروجی عمومی راه پیدا نمی‌کند.
 */

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/security";
import type { AppSettings } from "@prisma/client";

// ─────────────────────────────────────────────
//  اطمینان از وجود ردیف‌های تک‌نسخه (seed خودکار)
// ─────────────────────────────────────────────

/** گرفتن ردیف تنظیمات (id=1)؛ اگر نبود با مقادیر پیش‌فرض ساخته می‌شود */
export async function ensureAppSettings(): Promise<AppSettings> {
  return db.appSettings.upsert({
    where: { id: 1 },
    update: {}, // موجود است — هیچ تغییری نده
    create: { id: 1 }, // بقیه فیلدها از default های اسکیما می‌آیند
  });
}

/** گرفتن اعتبار مدیر (id=1)؛ اگر نبود با رمز پیش‌فرض ساخته می‌شود */
export async function ensureAdminCredential() {
  const existing = await db.adminCredential.findUnique({ where: { id: 1 } });
  if (existing) return existing;

  // رمز پیش‌فرض: ADMIN_PASSWORD از env وگرنه "admin1404"
  const password = process.env.ADMIN_PASSWORD ?? "admin1404";
  try {
    return await db.adminCredential.create({
      data: { id: 1, passwordHash: hashPassword(password) },
    });
  } catch {
    // ممکن است همزمان در پروسه دیگری ساخته شده باشد — دوباره بخوان
    return db.adminCredential.findUniqueOrThrow({ where: { id: 1 } });
  }
}

// ─────────────────────────────────────────────
//  خروجی‌های امن (بدون هیچ فیلد حساسی)
// ─────────────────────────────────────────────

/** شکل کانفیگ عمومی — قرارداد مشترک با AppConfig فرانت‌اند (Task 5-a) */
export type PublicAppConfig = {
  adsEnabled: boolean;
  adTitle: string;
  adText: string;
  adImage: string | null;
  adButtonText: string;
  adLink: string;
  contactChannel: string;
  contactTarget: string;
  contactMessage: string;
  welcomeText: string;
  welcomeVersion: number;
};

/** نگاشت ردیف دیتابیس به کانفیگ عمومی (فقط فیلدهای عمومی) */
export function toPublicConfig(s: AppSettings): PublicAppConfig {
  return {
    adsEnabled: s.adsEnabled,
    adTitle: s.adTitle,
    adText: s.adText,
    adImage: s.adImage,
    adButtonText: s.adButtonText,
    adLink: s.adLink,
    contactChannel: s.contactChannel,
    contactTarget: s.contactTarget,
    contactMessage: s.contactMessage,
    welcomeText: s.welcomeText,
    welcomeVersion: s.welcomeVersion,
  };
}

/** شکل تنظیمات برای پنل مدیر (همان فیلدها + زمان آخرین تغییر) */
export type AdminSettings = PublicAppConfig & { updatedAt: string };

/** نگاشت ردیف دیتابیس به تنظیمات پنل مدیر */
export function toAdminSettings(s: AppSettings): AdminSettings {
  return {
    ...toPublicConfig(s),
    updatedAt: s.updatedAt.toISOString(),
  };
}
