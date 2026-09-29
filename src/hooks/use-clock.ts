"use client";

import { useCallback, useSyncExternalStore } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  ساعت زنده — هوک هویدریشن‌سازگار
//  در سرور و رندر اولیه null برمی‌گرداند تا از mismatch جلوگیری شود،
//  سپس هر stepMs میلی‌ثانیه به‌روزرسانی می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

/** کش اسنپ‌شات با کلید بازه زمانی — از خلق Date جدید در هر رندر جلوگیری می‌کند */
const snapshotCache = new Map<number, { bucket: number; date: Date }>();

function getSnapshot(stepMs: number): Date {
  const bucket = Math.floor(Date.now() / stepMs);
  let cached = snapshotCache.get(stepMs);
  if (!cached || cached.bucket !== bucket) {
    cached = { bucket, date: new Date() };
    snapshotCache.set(stepMs, cached);
  }
  return cached.date;
}

/**
 * تاریخ و ساعت «همین لحظه» را زنده برمی‌گرداند.
 * اگر کامپوننت هنوز روی کلاینت mount نشده باشد null است.
 */
export function useNow(stepMs: number = 1000): Date | null {
  const mounted = useSyncExternalStore(
    useCallback(() => () => {}, []),
    () => true,
    () => false
  );
  const subscribe = useCallback(
    (cb: () => void) => {
      if (typeof window === "undefined") return () => {};
      const id = setInterval(cb, stepMs);
      return () => clearInterval(id);
    },
    [stepMs]
  );
  const getSnap = useCallback(() => getSnapshot(stepMs), [stepMs]);
  useSyncExternalStore(subscribe, getSnap, getSnap);
  return mounted ? getSnapshot(stepMs) : null;
}
