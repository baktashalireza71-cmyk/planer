import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJsonBody } from "@/app/api/_lib/helpers";
import { ensureAdminCredential } from "@/app/api/_lib/app-settings";
import { isAdminAuthenticated } from "@/app/api/_lib/admin-session";
import { hashPassword, verifyPassword } from "@/lib/security";

export const dynamic = "force-dynamic";

// سقف طول رمز ورودی — جلوگیری از هش‌کردن ورودی‌های عظیم (DoS)
const MAX_PASSWORD_LENGTH = 128;

// ─────────────────────────────────────────────
//  PUT /api/admin/password — تغییر رمز مدیر (نیازمند سشن)
//  body: { currentPassword, newPassword }
//  طول رمز جدید: ۸ تا ۶۴ کاراکتر
// ─────────────────────────────────────────────
export async function PUT(req: Request) {
  try {
    if (!(await isAdminAuthenticated())) return jsonError("unauthorized", 401);

    const body = await readJsonBody(req);
    if (!body)
      return jsonError("Invalid request body", 400);
    if (typeof body.currentPassword !== "string" || body.currentPassword.length === 0)
      return jsonError("currentPassword is required", 400);
    if (typeof body.newPassword !== "string" || body.newPassword.length === 0)
      return jsonError("newPassword is required", 400);

    // سقف طول ورودی‌ها (بدون هش رد می‌شوند)
    if (body.currentPassword.length > MAX_PASSWORD_LENGTH)
      return jsonError("currentPassword is too long", 400);
    if (body.newPassword.length > MAX_PASSWORD_LENGTH)
      return jsonError("newPassword must be 8 to 64 characters", 400);

    if (body.newPassword.length < 8 || body.newPassword.length > 64)
      return jsonError("newPassword must be 8 to 64 characters", 400);

    const admin = await ensureAdminCredential();
    if (!verifyPassword(body.currentPassword, admin.passwordHash))
      return jsonError("currentPassword is incorrect", 400);

    // ذخیره هش جدید + صفر کردن شمارنده خطاها و قفل ضدحمله
    await db.adminCredential.update({
      where: { id: 1 },
      data: { passwordHash: hashPassword(body.newPassword), failedAttempts: 0, lockedUntil: null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/admin/password failed:", err);
    return jsonError("Failed to change password", 500);
  }
}
