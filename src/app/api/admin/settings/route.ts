import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJsonBody } from "@/app/api/_lib/helpers";
import {
  ensureAppSettings,
  toAdminSettings,
  type AdminSettings,
} from "@/app/api/_lib/app-settings";
import { isAdminAuthenticated } from "@/app/api/_lib/admin-session";

export const dynamic = "force-dynamic";

// کانال‌های ارتباطی مجاز (باید با اسکیما و فرانت‌اند هم‌خوان باشد)
const CONTACT_CHANNELS = ["WHATSAPP", "TELEGRAM", "BALE", "NONE"] as const;

// سقف طول هر فیلد (حروف، پس از trim)
const LIMITS = {
  adTitle: 120,
  adText: 500,
  adButtonText: 40,
  adLink: 500,
  contactTarget: 100,
  contactMessage: 300,
  welcomeText: 1000,
  adImage: 500,
} as const;

// لینک‌ها فقط http/https (جلوی javascript: و data: گرفته می‌شود)
const HTTP_URL = /^https?:\/\//;

// ─────────────────────────────────────────────
//  GET /api/admin/settings — تنظیمات کامل برای پنل مدیر (نیازمند سشن)
// ─────────────────────────────────────────────
export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) return jsonError("unauthorized", 401);

    const settings = await ensureAppSettings();
    return NextResponse.json({ settings: toAdminSettings(settings) });
  } catch (err) {
    console.error("GET /api/admin/settings failed:", err);
    return jsonError("Failed to load settings", 500);
  }
}

// ─────────────────────────────────────────────
//  PUT /api/admin/settings — ذخیره کامل تنظیمات (نیازمند سشن)
//  body: کل آبجکت تنظیمات (ذخیره کامل، نه جزئی)
// ─────────────────────────────────────────────
export async function PUT(req: Request) {
  try {
    if (!(await isAdminAuthenticated())) return jsonError("unauthorized", 401);

    const body = await readJsonBody(req);
    if (!body) return jsonError("Invalid request body", 400);

    // ── اعتبارسنجی فیلدهای ضروری ──
    if (typeof body.adsEnabled !== "boolean")
      return jsonError("adsEnabled must be a boolean", 400);
    if (typeof body.contactChannel !== "string" || !(CONTACT_CHANNELS as readonly string[]).includes(body.contactChannel))
      return jsonError("contactChannel must be one of WHATSAPP | TELEGRAM | BALE | NONE", 400);

    // welcomeVersion: عدد صحیح ۱ تا ۱۰۰۰۰۰۰ (با const گرفتن تا تایپ‌سیف بماند)
    const welcomeVersion = body.welcomeVersion;
    if (typeof welcomeVersion !== "number" || !Number.isInteger(welcomeVersion))
      return jsonError("welcomeVersion must be an integer", 400);
    if (welcomeVersion < 1 || welcomeVersion > 1000000)
      return jsonError("welcomeVersion must be between 1 and 1000000", 400);

    // ── فیلدهای رشته‌ای: نوع + محدودیت طول ──
    const stringFields: Array<[string, number]> = [
      ["adTitle", LIMITS.adTitle],
      ["adText", LIMITS.adText],
      ["adButtonText", LIMITS.adButtonText],
      ["adLink", LIMITS.adLink],
      ["contactTarget", LIMITS.contactTarget],
      ["contactMessage", LIMITS.contactMessage],
      ["welcomeText", LIMITS.welcomeText],
    ];
    for (const [field, max] of stringFields) {
      const value = body[field];
      if (typeof value !== "string") return jsonError(`${field} must be a string`, 400);
      if (value.trim().length > max)
        return jsonError(`${field} must be at most ${max} characters`, 400);
    }

    // ── adImage: رشته یا null (پاک‌کردن تصویر) ──
    if (body.adImage !== null && typeof body.adImage !== "string")
      return jsonError("adImage must be a string or null", 400);
    if (typeof body.adImage === "string" && body.adImage.trim().length > LIMITS.adImage)
      return jsonError(`adImage must be at most ${LIMITS.adImage} characters`, 400);

    // ── لینک‌ها فقط http/https ──
    const adLink = (body.adLink as string).trim();
    if (adLink !== "" && !HTTP_URL.test(adLink))
      return jsonError("adLink must start with http:// or https://", 400);
    const adImage =
      typeof body.adImage === "string" ? body.adImage.trim() : body.adImage;
    if (typeof adImage === "string" && adImage !== "" && !HTTP_URL.test(adImage))
      return jsonError("adImage must start with http:// or https://", 400);

    // ── contactTarget مطابق کانال انتخابی ──
    const contactTarget = (body.contactTarget as string).trim();
    switch (body.contactChannel) {
      case "WHATSAPP":
        if (contactTarget !== "" && !/^\+?\d{6,20}$/.test(contactTarget))
          return jsonError(
            "contactTarget must be a phone number like +989123456789 for WHATSAPP",
            400
          );
        break;
      case "TELEGRAM":
      case "BALE":
        if (contactTarget !== "" && !/^[A-Za-z0-9_]{3,64}$/.test(contactTarget))
          return jsonError(
            `contactTarget must be a username (3-64 letters, digits or _) for ${body.contactChannel}`,
            400
          );
        break;
      default:
        // کانال NONE → هدف باید خالی باشد
        if (contactTarget !== "")
          return jsonError("contactTarget must be empty when contactChannel is NONE", 400);
        break;
    }

    // ── ذخیره ردیف تک‌نسخه (id=1) ──
    const settings = await db.appSettings.update({
      where: { id: 1 },
      data: {
        adsEnabled: body.adsEnabled,
        adTitle: (body.adTitle as string).trim(),
        adText: (body.adText as string).trim(),
        adImage: adImage === "" ? null : adImage,
        adButtonText: (body.adButtonText as string).trim(),
        adLink,
        contactChannel: body.contactChannel,
        contactTarget,
        contactMessage: (body.contactMessage as string).trim(),
        welcomeText: (body.welcomeText as string).trim(),
        welcomeVersion,
      },
    });

    const payload: { settings: AdminSettings } = { settings: toAdminSettings(settings) };
    // پاسخ مدیر هم نباید کش شود
    const res = NextResponse.json(payload);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("PUT /api/admin/settings failed:", err);
    return jsonError("Failed to save settings", 500);
  }
}
