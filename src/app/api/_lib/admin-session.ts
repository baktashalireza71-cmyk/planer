/**
 * بررسی سشن مدیر برای route های ادمین
 * ------------------------------------
 * توکن از کوکی httpOnly خوانده می‌شود و امضا + انقضای آن تأیید می‌شود.
 */

import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/security";

/** آیا درخواست با سشن معتبر مدیر همراه است؟ */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}
