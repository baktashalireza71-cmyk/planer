import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { jsonError, readJsonBody } from "@/app/api/_lib/helpers";
import { ensureAdminCredential } from "@/app/api/_lib/app-settings";
import {
  ADMIN_COOKIE_NAME,
  clearAdminFailures,
  createSessionToken,
  isAdminRateLocked,
  registerAdminFailure,
  verifyPassword,
} from "@/lib/security";

export const dynamic = "force-dynamic";

// سقف طول رمز ورودی — جلوگیری از هش‌کردن ورودی‌های عظیم (DoS)
const MAX_PASSWORD_LENGTH = 128;

// ─────────────────────────────────────────────
//  POST /api/admin/login — ورود مدیر
//  body: { password }
//  ضدحمله: قفل حافظه‌ای (۵ خطا در پنجره ۱۵ دقیقه‌ای) + قفل پایدار در DB
//  موفق: {ok:true} + کوکی httpOnly سشن
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // کلید ضدحمله: IP واقعی پشت پروکسی یا "local"
    const forwarded = req.headers.get("x-forwarded-for");
    const clientKey = forwarded?.split(",")[0]?.trim() || "local";

    const admin = await ensureAdminCredential();

    // ۱) قفل پایدار در DB (از تلاش‌های قبلی — حتی بعد از ری‌استارت سرور)
    const now = Date.now();
    if (admin.lockedUntil && admin.lockedUntil.getTime() > now) {
      const retryAfterSec = Math.ceil((admin.lockedUntil.getTime() - now) / 1000);
      return NextResponse.json(
        { error: "Too many failed attempts", retryAfterSec },
        { status: 429 }
      );
    }

    // ۲) قفل حافظه‌ای این پروسه
    const memLock = isAdminRateLocked(clientKey);
    if (memLock.locked) {
      return NextResponse.json(
        { error: "Too many failed attempts", retryAfterSec: memLock.retryAfterSec },
        { status: 429 }
      );
    }

    const body = await readJsonBody(req);
    if (!body || typeof body.password !== "string" || body.password.length === 0)
      return jsonError("password is required", 400);

    // رمزهای بیش از حد بلند بدون هش رد می‌شوند (مثل رمز غلط شمرده می‌شوند)
    if (body.password.length > MAX_PASSWORD_LENGTH) {
      const failure = registerAdminFailure(clientKey);
      await dbRegisterFailure(admin.failedAttempts, failure);
      return jsonError("Invalid password", 401);
    }

    if (!verifyPassword(body.password, admin.passwordHash)) {
      // ثبت خطا در حافظه + DB؛ در خطای پنجم قفل فعال می‌شود
      const failure = registerAdminFailure(clientKey);
      await dbRegisterFailure(admin.failedAttempts, failure);
      return jsonError("Invalid password", 401);
    }

    // ورود موفق: پاک‌سازی خطاها در حافظه و DB
    clearAdminFailures(clientKey);
    await db.adminCredential.update({
      where: { id: 1 },
      data: { failedAttempts: 0, lockedUntil: null },
    });

    // کوکی سشن httpOnly — در تولید روی HTTPS باید secure:true شود
    const store = await cookies();
    store.set(ADMIN_COOKIE_NAME, createSessionToken(), {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 86400,
      secure: false,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/login failed:", err);
    return jsonError("Failed to log in", 500);
  }
}

/** ثبت تلاش ناموفق در DB؛ اگر قفل جدید فعال شده باشد lockedUntil ذخیره می‌شود */
async function dbRegisterFailure(
  currentAttempts: number,
  failure: { locked: boolean; retryAfterSec: number }
) {
  await db.adminCredential.update({
    where: { id: 1 },
    data: {
      failedAttempts: currentAttempts + 1,
      ...(failure.locked
        ? { lockedUntil: new Date(Date.now() + failure.retryAfterSec * 1000) }
        : {}),
    },
  });
}
