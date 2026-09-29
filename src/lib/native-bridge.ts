"use client";

/**
 * native-bridge.ts — پل Capacitor (اپ اندروید)
 * ------------------------------------------------
 * وقتی برنامه به‌صورت APK اجرا شود، یادآورها به «اعلان سیستمی اندروید»
 * تبدیل می‌شوند که توسط خود سیستم‌عامل زمان‌بندی می‌شود و حتی وقتی
 * برنامه کاملاً بسته است هم در ساعت مقرر نمایش داده می‌شود.
 *
 * روی وب (مرورگر) همه توابع این فایل بی‌اثرند و همان زمان‌بند
 * داخل صفحه (notifications.ts) کار می‌کند.
 */

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { NotifPrefs } from "./local-store";

// شناسه‌های ثابت اعلان‌های زمان‌بندی‌شده (int برای اندروید)
const DAILY_SUMMARY_ID = 1001;
const DUE_ALERT_ID = 1002;

/** آیا برنامه داخل اپ اندروید (APK) اجرا می‌شود؟ */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** وضعیت مجوز اعلان در اندروید */
export async function getNativePermissionState(): Promise<
  "granted" | "denied" | "prompt" | "unsupported"
> {
  if (!isNativeApp()) return "unsupported";
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") return "granted";
    if (status.display === "denied") return "denied";
    return "prompt";
  } catch {
    return "unsupported";
  }
}

/** درخواست مجوز اعلان (اندروید ۱۳+ دیالوگ سیستمی POST_NOTIFICATIONS نشان می‌دهد) */
export async function requestNativePermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") return true;
    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted";
  } catch {
    return false;
  }
}

/** "21:00" → { hour: 21, minute: 0 } */
function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return {
    hour: Number.isFinite(h) ? h : 21,
    minute: Number.isFinite(m) ? m : 0,
  };
}

/**
 * همگام‌سازی یادآورهای سیستمی اندروید با تنظیمات کاربر.
 * با هر تغییر تنظیمات اعلان‌ها صدا زده می‌شود؛ زمان‌بندی‌های قبلی
 * لغو و مطابق تنظیمات جدید دوباره ثبت می‌شوند (idempotent).
 */
export async function syncNativeReminders(prefs: NotifPrefs): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== "granted") return;

    // پاک‌سازی زمان‌بندی‌های قبلی تا تنظیمات قدیمی باقی نماند
    await LocalNotifications.cancel({
      notifications: [{ id: DAILY_SUMMARY_ID }, { id: DUE_ALERT_ID }],
    });

    if (prefs.dailyEnabled) {
      const { hour, minute } = parseTime(prefs.dailyTime);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: DAILY_SUMMARY_ID,
            title: "🌙 خلاصه امروز پلنر من",
            body: "یک نگاه به کارها و عادت‌های امروزت بینداز",
            schedule: { on: { hour, minute }, allowWhileIdle: true },
          },
        ],
      });
    }

    if (prefs.dueAlertsEnabled) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: DUE_ALERT_ID,
            title: "🔔 کارهای امروزت را بررسی کن",
            body: "پلنر من — کارها و عادت‌های امروز منتظر توست",
            schedule: { on: { hour: 9, minute: 0 }, allowWhileIdle: true },
          },
        ],
      });
    }
  } catch {
    // بی‌صدا — اعلان‌های داخل برنامه همچنان کار می‌کنند
  }
}

/**
 * وضعیت مجوز «هشدار دقیق» (اندروید ۱۴+).
 * اگر denied باشد، یادآورها با دقت کمتر (پنجره چند دقیقه‌ای) می‌آیند؛
 * کاربر می‌تواند از تنظیمات سیستم مجوز Alarms & reminders را بدهد.
 */
export async function getExactAlarmState(): Promise<"granted" | "denied" | "unknown"> {
  if (!isNativeApp()) return "unknown";
  try {
    const status = await LocalNotifications.checkExactNotificationSetting();
    if (status.exact_alarm === "granted") return "granted";
    if (status.exact_alarm === "denied") return "denied";
    return "unknown";
  } catch {
    return "unknown";
  }
}
