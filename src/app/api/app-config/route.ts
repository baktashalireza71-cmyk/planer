import { NextResponse } from "next/server";
import { jsonError } from "@/app/api/_lib/helpers";
import { ensureAppSettings, toPublicConfig } from "@/app/api/_lib/app-settings";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────
//  GET /api/app-config — کانفیگ عمومی برنامه (بدون نیاز به ورود)
//  فقط فیلدهای عمومی تبلیغ/ارتباط/خوشامد برگردانده می‌شود؛
//  هیچ راز یا اطلاعات مدیریتی در این پاسخ نیست.
// ─────────────────────────────────────────────
export async function GET() {
  try {
    const settings = await ensureAppSettings();
    const res = NextResponse.json({ config: toPublicConfig(settings) });
    // جلوگیری از کش شدن کانفیگ تا تغییرات مدیر بلافاصله برای همه اعمال شود
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("GET /api/app-config failed:", err);
    return jsonError("Failed to load app config", 500);
  }
}
