import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { jsonError } from "@/app/api/_lib/helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/uploads/[name] — نمایش تصاویر آپلودشده (عمومی)
 * ---------------------------------------------------------
 * - نام فایل با الگوی سخت‌گیرانه اعتبارسنجی می‌شود (جلوی path traversal)
 * - Content-Type مطابق فرمت واقعی + nosniff تا هرگز HTML اجرا نشود
 * - کش بلندمدت چون نام فایل یکتاست (ad-<زمان>-<تصادفی>)
 */

const UPLOAD_DIR = path.join(process.cwd(), "db", "uploads");

// فقط نام‌های تولیدشده توسط /api/admin/upload مجاز است
const SAFE_NAME = /^ad-[a-z0-9]+-[a-f0-9]{12}\.(jpg|png|webp|gif)$/;

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  if (!SAFE_NAME.test(name)) return jsonError("Not found", 404);

  const ext = name.split(".").pop() as keyof typeof CONTENT_TYPES;

  try {
    const file = await readFile(path.join(UPLOAD_DIR, name));
    const body = new Uint8Array(file);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Length": String(file.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return jsonError("Not found", 404);
  }
}
