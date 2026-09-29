"use client";

/**
 * notifications.ts — موتور اعلان‌ها و یادآورها
 * ------------------------------------------------
 * ۱) collectNotifications: از روی داده‌های محلی، فهرست یادآوری‌های
 *    مهم را می‌سازد (کار عقب‌افتاده، کار امروز/فردا، عادت انجام‌نشده
 *    امروز، رویداد پیش‌رو در ۷ روز آینده، ددلاین اهداف).
 * ۲) اعلان مرورگر: درخواست مجوز و نمایش اعلان وقتی برنامه باز است.
 * ۳) useNotificationScheduler: زمان‌بند یادآور روزانه و اعلان کارها
 *    (وقتی برنامه باز است، هر ۳۰ ثانیه بررسی می‌کند).
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { dayKey, nextOccurrenceDate, faNum } from "@/lib/date";
import { tasksStore, habitsStore, eventsStore, goalsStore, notifPrefsStore } from "@/lib/local-store";

// ─────────────────────────────────────────────
//  انواع
// ─────────────────────────────────────────────
export type NotifKind = "overdue" | "today" | "tomorrow" | "habit" | "event" | "goal";
export type NotifTab = "tasks" | "habits" | "events" | "goals";

export interface NotifItem {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  /** تب مقصد برای هدایت کاربر هنگام لمس */
  tab: NotifTab;
  /** فوری (قرمز) یا عادی */
  urgent: boolean;
  /** مرتب‌سازی درون یک گروه */
  sortTs: number;
}

// ─────────────────────────────────────────────
//  جمع‌آوری یادآوری‌ها از داده‌های محلی
// ─────────────────────────────────────────────
export function collectNotifications(): NotifItem[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startOfDayAfterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  const weekLater = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8);
  const todayTs = startOfToday.getTime();
  const todayKey = dayKey(now);

  const items: NotifItem[] = [];

  // ── کارها: عقب‌افتاده ← امروز ← فردا ──
  for (const t of tasksStore.list()) {
    if (t.completed || !t.dueDate) continue;
    const due = new Date(t.dueDate);
    const dueTs = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    if (dueTs < todayTs) {
      items.push({
        id: `overdue-${t.id}`,
        kind: "overdue",
        title: t.title,
        body: "از موعد این کار گذشته — انجامش بده یا موعد را جابه‌جا کن",
        tab: "tasks",
        urgent: true,
        sortTs: dueTs,
      });
    } else if (dueTs === todayTs) {
      items.push({
        id: `today-${t.id}`,
        kind: "today",
        title: t.title,
        body: "سررسید این کار امروز است",
        tab: "tasks",
        urgent: false,
        sortTs: dueTs,
      });
    } else if (dueTs === startOfDayAfterTomorrow.getTime() - 86400000) {
      items.push({
        id: `tomorrow-${t.id}`,
        kind: "tomorrow",
        title: t.title,
        body: "سررسید این کار فرداست",
        tab: "tasks",
        urgent: false,
        sortTs: dueTs,
      });
    }
  }

  // ── عادت‌ها: امروز هنوز انجام نشده ──
  for (const h of habitsStore.list()) {
    const doneToday = h.logs.some((l) => l.date === todayKey);
    if (!doneToday) {
      items.push({
        id: `habit-${h.id}`,
        kind: "habit",
        title: h.title,
        body: "امروز هنوز تیک نخورده — زنجیره‌ات را نشکن",
        tab: "habits",
        urgent: false,
        sortTs: todayTs,
      });
    }
  }

  // ── رویدادها: ۷ روز آینده (رویداد سالانه هم حساب می‌شود) ──
  for (const e of eventsStore.list()) {
    const occ = nextOccurrenceDate(new Date(e.date), e.yearly, now);
    const occTs = new Date(occ.getFullYear(), occ.getMonth(), occ.getDate()).getTime();
    if (occTs >= todayTs && occTs < weekLater.getTime()) {
      const days = Math.round((occTs - todayTs) / 86400000);
      const when = days === 0 ? "امروز" : days === 1 ? "فردا" : `${faNum(days)} روز دیگر`;
      items.push({
        id: `event-${e.id}-${occTs}`,
        kind: "event",
        title: e.title,
        body: `${when}${e.time ? ` — ساعت ${e.time}` : ""}`,
        tab: "events",
        urgent: days === 0,
        sortTs: occTs,
      });
    }
  }

  // ── اهداف: ددلاین نزدیک (۷ روز آینده) ──
  for (const g of goalsStore.list()) {
    if (!g.deadline) continue;
    const dl = new Date(g.deadline);
    const dlTs = new Date(dl.getFullYear(), dl.getMonth(), dl.getDate()).getTime();
    if (dlTs >= todayTs && dlTs < weekLater.getTime()) {
      const days = Math.round((dlTs - todayTs) / 86400000);
      items.push({
        id: `goal-${g.id}`,
        kind: "goal",
        title: g.title,
        body: days === 0 ? "ددلاین این هدف امروز است" : `${faNum(days)} روز تا ددلاین هدف`,
        tab: "goals",
        urgent: days <= 1,
        sortTs: dlTs,
      });
    }
  }

  // فوری‌ها اول، بعد نزدیک‌ترین تاریخ
  return items.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    return a.sortTs - b.sortTs;
  });
}

/** خلاصه متنی برای اعلان روزانه */
export function summarizeNotifications(items: NotifItem[]): string {
  const count = (k: NotifKind) => items.filter((i) => i.kind === k).length;
  const parts: string[] = [];
  if (count("overdue") > 0) parts.push(`${faNum(count("overdue"))} کار عقب‌افتاده`);
  if (count("today") > 0) parts.push(`${faNum(count("today"))} کار برای امروز`);
  if (count("habit") > 0) parts.push(`${faNum(count("habit"))} عادت انجام‌نشده`);
  if (count("event") > 0) parts.push(`${faNum(count("event"))} رویداد پیش‌رو`);
  if (count("goal") > 0) parts.push(`${faNum(count("goal"))} هدف نزدیک به ددلاین`);
  if (parts.length === 0) return "امروز هیچ یادآوری فوری نداری — روز خوبی داشته باشی ☀";
  return parts.join(" • ");
}

// ─────────────────────────────────────────────
//  اعلان مرورگر (وقتی برنامه باز است)
// ─────────────────────────────────────────────
export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return window.Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await window.Notification.requestPermission();
  } catch {
    return window.Notification.permission;
  }
}

/** نمایش اعلان سیستمی — اگر مجوز نبود false برمی‌گرداند (toast جبران می‌کند) */
export function pushBrowserNotification(title: string, body: string): boolean {
  if (!notificationsSupported() || window.Notification.permission !== "granted") return false;
  try {
    const n = new window.Notification(title, { body, icon: "/icon-192.png", tag: "planner" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
//  زمان‌بند — یادآور روزانه + اعلان کارها
//  (هر ۳۰ ثانیه بررسی می‌کند؛ هر اعلان حداکثر یک بار در روز)
// ─────────────────────────────────────────────
const CHECK_INTERVAL_MS = 30_000;

export function useNotificationScheduler() {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const today = dayKey(now);
      const prefs = notifPrefsStore.get();
      const items = collectNotifications();

      // ── اعلان کارهای امروز/عقب‌افتاده (یک بار در روز، صبح‌ها یا اول باز شدن) ──
      if (prefs.dueAlertsEnabled && prefs.lastDueFire !== today) {
        const taskItems = items.filter((i) => i.kind === "overdue" || i.kind === "today");
        if (taskItems.length > 0) {
          notifPrefsStore.set({ lastDueFire: today });
          const body = summarizeNotifications(taskItems);
          const shown = pushBrowserNotification(`🔔 ${faNum(taskItems.length)} کار منتظر توست`, body);
          toast(`🔔 ${faNum(taskItems.length)} کار منتظر توست`, { description: body });
          if (!shown) {
            // اعلان مرورگر نبود — همان toast کافی است
          }
        }
      }

      // ── یادآور روزانه در ساعت تعیین‌شده ──
      if (prefs.dailyEnabled && prefs.lastDailyFire !== today) {
        const [h, m] = prefs.dailyTime.split(":").map((v) => parseInt(v, 10));
        const targetMin = (Number.isFinite(h) ? h : 21) * 60 + (Number.isFinite(m) ? m : 0);
        const nowMin = now.getHours() * 60 + now.getMinutes();
        if (nowMin >= targetMin) {
          notifPrefsStore.set({ lastDailyFire: today });
          const body = summarizeNotifications(items);
          pushBrowserNotification("🌙 خلاصه امروز پلنر من", body);
          toast("🌙 خلاصه امروز پلنر من", { description: body, duration: 8000 });
        }
      }
    };

    // اولین بررسی با کمی تأخیر تا صفحه کامل بالا بیاید
    const t0 = setTimeout(check, 2500);
    timer.current = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      clearTimeout(t0);
      if (timer.current) clearInterval(timer.current);
    };
  }, []);
}
