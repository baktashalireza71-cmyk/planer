/**
 * ابزارهای امنیتی بک‌اند (بدون وابستگی خارجی — فقط crypto داخلی Node)
 * ------------------------------------------------------------------
 *  - هش/تأیید رمز مدیر با scrypt + salt تصادفی
 *  - توکن سشن امضاشده با HMAC-SHA256 (کوکی httpOnly)
 *  - rate limiter حافظه‌ای برای قفل ضدحمله روی ورود مدیر
 */

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

// ─────────────────────────────────────────────
//  رمز مدیر (هش scrypt)
// ─────────────────────────────────────────────

/** هش‌کردن رمز با salt تصادفی ۱۶ بایتی → قالب "scrypt:<salt>:<hash>" */
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

/**
 * تأیید رمز در برابر هش ذخیره‌شده (مقاوم در برابر timing attack
 * با مقایسه timingSafeEqual پس از تولید هش با همان salt)
 */
export function verifyPassword(pw: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  try {
    const expected = Buffer.from(hashHex, "hex");
    if (expected.length === 0) return false;
    const actual = scryptSync(pw, salt, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
//  سشن مدیر (توکن امضاشده HMAC-SHA256)
// ─────────────────────────────────────────────

/** نام کوکی سشن مدیر (قرارداد مشترک با فرانت‌اند) */
export const ADMIN_COOKIE_NAME = "planner_admin";

/** مدت اعتبار سشن: ۲۴ ساعت */
const SESSION_TTL_MS = 24 * 3600 * 1000;

/** کلید امضای سشن — در استقرار واقعی حتماً از env مقداردهی شود */
function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "planner-local-secret-change-in-production";
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

/** ساخت توکن سشن: base64url(payload).base64url(HMAC-SHA256(secret, payload)) */
export function createSessionToken(): string {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const payloadB64 = toBase64Url(payload);
  const signature = createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

/** تأیید توکن سشن: امضا + انقضا — خروجی boolean */
export function verifySessionToken(token: string): boolean {
  if (typeof token !== "string") return false;
  const dotIndex = token.indexOf(".");
  if (dotIndex <= 0 || dotIndex === token.length - 1) return false;
  const payloadB64 = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  const expected = createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest();
  const actual = Buffer.from(signature, "base64url");
  // مقایسه زمان‌ثابت؛ طول متفاوت یعنی قطعاً نامعتبر
  if (actual.length !== expected.length) return false;
  if (!timingSafeEqual(actual, expected)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
      exp?: unknown;
    };
    if (typeof payload.exp !== "number") return false;
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
//  قفل ضدحمله حافظه‌ای (rate limiter روی ورود مدیر)
//  بعد از ۵ خطا در پنجره ۱۵ دقیقه‌ای، کلید موقتاً قفل می‌شود
// ─────────────────────────────────────────────

const FAILURE_WINDOW_MS = 15 * 60 * 1000; // پنجره ۱۵ دقیقه‌ای
const MAX_FAILURES = 5; // سقف خطاها قبل از قفل

interface AdminFailureEntry {
  failures: number;
  windowStart: number;
  lockedUntil: number;
}

/** کلید → وضعیت خطاها/قفل (فقط در حافظه این پروسه) */
const adminFailures = new Map<string, AdminFailureEntry>();

// پاک‌سازی دوره‌ای ورودی‌های قدیمی Map برای جلوگیری از نشت حافظه
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureFailuresCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of adminFailures) {
      const windowExpired = now - entry.windowStart > FAILURE_WINDOW_MS;
      const lockExpired = now > entry.lockedUntil;
      if (windowExpired && lockExpired) adminFailures.delete(key);
    }
  }, 5 * 60 * 1000);
  // تایمر نباید مانع خروج تمیز پروسه شود
  (cleanupTimer as unknown as { unref?: () => void }).unref?.();
}

/** بررسی اینکه کلید (مثلاً IP) الان قفل است یا نه */
export function isAdminRateLocked(key: string): { locked: boolean; retryAfterSec: number } {
  ensureFailuresCleanup();
  const entry = adminFailures.get(key);
  if (!entry) return { locked: false, retryAfterSec: 0 };
  const remainingSec = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
  if (remainingSec > 0) return { locked: true, retryAfterSec: remainingSec };
  return { locked: false, retryAfterSec: 0 };
}

/**
 * ثبت یک تلاش ناموفق ورود برای کلید.
 * اگر به سقف خطاها در پنجره رسیده باشد، تا پایان پنجره قفل می‌شود.
 */
export function registerAdminFailure(key: string): { locked: boolean; retryAfterSec: number } {
  ensureFailuresCleanup();
  const now = Date.now();
  const entry = adminFailures.get(key);

  if (!entry || now - entry.windowStart > FAILURE_WINDOW_MS) {
    // شروع پنجره تازه
    adminFailures.set(key, { failures: 1, windowStart: now, lockedUntil: 0 });
    return { locked: false, retryAfterSec: 0 };
  }

  entry.failures += 1;
  if (entry.failures >= MAX_FAILURES) {
    // قفل تا پایان پنجره ۱۵ دقیقه‌ای
    entry.lockedUntil = entry.windowStart + FAILURE_WINDOW_MS;
    return {
      locked: true,
      retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }
  return { locked: false, retryAfterSec: 0 };
}

/** پاک‌کردن خطاهای یک کلید (بعد از ورود موفق) */
export function clearAdminFailures(key: string): void {
  adminFailures.delete(key);
}
