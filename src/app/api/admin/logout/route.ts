import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jsonError } from "@/app/api/_lib/helpers";
import { ADMIN_COOKIE_NAME } from "@/lib/security";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────
//  POST /api/admin/logout — خروج مدیر
//  کوکی سشن با maxAge=0 باطل می‌شود
// ─────────────────────────────────────────────
export async function POST() {
  try {
    const store = await cookies();
    // حذف کوکی: مقدار خالی + انقضای فوری
    store.set(ADMIN_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
      secure: false,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/logout failed:", err);
    return jsonError("Failed to log out", 500);
  }
}
