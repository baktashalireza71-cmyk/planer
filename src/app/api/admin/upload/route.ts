import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import { jsonError } from "@/app/api/_lib/helpers";
import { isAdminAuthenticated } from "@/app/api/_lib/admin-session";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/upload — آپلود تصویر تبلیغ (نیازمند سشن مدیر)
 * ---------------------------------------------------------------
 * - ورودی: multipart/form-data با فیلد «file»
 * - فقط JPG / PNG / WebP / GIF (با بررسی امضای بایت‌ها، نه فقط پسوند)
 * - حداکثر ۲ مگابایت
 * - ذخیره در پوشه db/uploads (بیرون از public تا در build مستقل هم با API سرو شود)
 * - خروجی: { url: "/api/uploads/ad-XXXX.png" }
 */

const MAX_SIZE = 2 * 1024 * 1024; // ۲ مگابایت

const UPLOAD_DIR = path.join(process.cwd(), "db", "uploads");

/** امضای بایتی فرمت‌های مجاز (جلوی فایل جعلی مثل HTML/JS با پسوند jpg را می‌گیرد) */
function detectImageType(bytes: Uint8Array): "jpg" | "png" | "webp" | "gif" | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  // GIF: GIF8
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "gif";
  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  )
    return "webp";
  return null;
}

export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthenticated())) return jsonError("unauthorized", 401);

    const form = await req.formData().catch(() => null);
    if (!form) return jsonError("Expected multipart/form-data body", 400);

    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Field «file» is required", 400);

    // ── محدودیت حجم ──
    if (file.size <= 0) return jsonError("File is empty", 400);
    if (file.size > MAX_SIZE)
      return jsonError("File is too large (max 2MB)", 413);

    // ── بررسی امضای واقعی فایل ──
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = detectImageType(new Uint8Array(buffer));
    if (!type)
      return jsonError("Only JPG, PNG, WebP or GIF images are allowed", 415);

    // ── نام امن تصادفی (بدون هیچ ورودی از کاربر) ──
    const name = `ad-${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${type}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), buffer);

    const res = NextResponse.json({ url: `/api/uploads/${name}` });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("POST /api/admin/upload failed:", err);
    return jsonError("Upload failed", 500);
  }
}
