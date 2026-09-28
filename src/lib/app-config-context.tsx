"use client";

/**
 * کانتکست تنظیمات مرکزی برنامه (کانفیگ عمومی)
 * ------------------------------------------------
 * تنظیمات تبلیغ/ارتباط از سرور (/api/app-config) خوانده می‌شود
 * و برای استفاده آفلاین در localStorage کش می‌شود:
 *  - اگر تبلیغ فعال باشد بنر نمایش داده می‌شود، وگرنه هیچ اثری از آن نیست
 *  - کارت خوشامد تا زمانی که کاربر آن را نبندد (یا نسخه جدیدی منتشر شود) نمایش داده می‌شود
 *
 * امنیت: این فایل فقط فیلدهای «عمومی» را نگه می‌دارد؛
 * هیچ راز یا اطلاعات مدیریتی از این مسیر عبور نمی‌کند.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

/** کانال‌های ارتباطی پشتیبانی‌شده */
export type ContactChannel = "WHATSAPP" | "TELEGRAM" | "BALE" | "NONE";

/** تنظیمات عمومی برنامه (خروجی عمومی /api/app-config) */
export interface AppConfig {
  adsEnabled: boolean;
  adTitle: string;
  adText: string;
  adImage: string | null;
  adButtonText: string;
  adLink: string;
  contactChannel: ContactChannel;
  contactTarget: string;
  contactMessage: string;
  welcomeText: string;
  /** با هر بار افزایش، کارت خوشامد برای همه کاربران دوباره نمایش داده می‌شود */
  welcomeVersion: number;
}

/** تنظیمات پیش‌فرض (مطابق مقادیر اولیه دیتابیس) */
export const DEFAULT_CONFIG: AppConfig = {
  adsEnabled: false,
  adTitle: "",
  adText: "",
  adImage: null,
  adButtonText: "",
  adLink: "",
  contactChannel: "NONE",
  contactTarget: "",
  contactMessage: "",
  welcomeText: "",
  welcomeVersion: 1,
};

/** کلید کش کانفیگ در localStorage */
export const APP_CONFIG_CACHE_KEY = "planner.app-config.cache.v1";
/** کلید نسخه دیده‌شده کارت خوشامد در localStorage */
export const WELCOME_SEEN_KEY = "planner.welcome.seen-version";

/** ساخت لینک عمیق برای هر کانال ارتباطی */
export function buildContactUrl(
  channel: ContactChannel,
  target: string,
  message: string
): string | null {
  if (!target) return null;
  const clean = target.trim().replace(/^@/, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  switch (channel) {
    case "WHATSAPP": {
      const phone = clean.replace(/[^\d+]/g, "");
      if (!phone) return null;
      return `https://wa.me/${phone}${text}`;
    }
    case "TELEGRAM":
      return /^[A-Za-z0-9_]{3,64}$/.test(clean) ? `https://t.me/${clean}` : null;
    case "BALE":
      return /^[A-Za-z0-9_]{3,64}$/.test(clean) ? `https://ble.ir/${clean}` : null;
    default:
      return null;
  }
}

interface AppConfigContextValue {
  config: AppConfig;
  /** true بعد از خواندن کش و اولین واکشی (برای جلوگیری از پرش هیدریشن) */
  isReady: boolean;
  /** واکشی دوباره تنظیمات از سرور (بعد از ذخیره در پنل مدیر) */
  refresh: () => Promise<void>;
  /** نسخه کارت خوشامد که کاربر دیده/بسته است */
  seenWelcomeVersion: number;
  /** بستن کارت خوشامد (ثبت نسخه دیده‌شده) */
  dismissWelcome: () => void;
}

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

const emptySubscribe = () => () => {};

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isReady, setIsReady] = useState(false);
  const [seenWelcomeVersion, setSeenWelcomeVersion] = useState(0);

  // پرچم mounted سازگار با هیدریشن (الگوی مشابه app-shell)
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/app-config", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { config?: Partial<AppConfig> };
        if (data?.config) {
          const merged = { ...DEFAULT_CONFIG, ...data.config } as AppConfig;
          setConfig(merged);
          try {
            localStorage.setItem(APP_CONFIG_CACHE_KEY, JSON.stringify(merged));
          } catch {
            /* حافظه در دسترس نیست — بی‌اهمیت */
          }
        }
      }
    } catch {
      // بدون اینترنت: آخرین کانفیگ کش‌شده باقی می‌ماند
    } finally {
      setIsReady(true);
    }
  }, []);

  // خواندن اولیه: کش محلی + نسخه خوشامد دیده‌شده، سپس واکشی از سرور
  useEffect(() => {
    let alive = true;
    (async () => {
      await Promise.resolve(); // قطع مسیر همگام برای سازگاری با قواعد lint
      try {
        const cached = localStorage.getItem(APP_CONFIG_CACHE_KEY);
        const seen = Number(localStorage.getItem(WELCOME_SEEN_KEY) || "0");
        if (!alive) return;
        if (cached) {
          const parsed = JSON.parse(cached) as Partial<AppConfig>;
          setConfig({ ...DEFAULT_CONFIG, ...parsed });
        }
        setSeenWelcomeVersion(Number.isFinite(seen) ? seen : 0);
      } catch {
        /* کش خراب/در دسترس نیست — پیش‌فرض */
      }
      await refresh();
    })();
    return () => {
      alive = false;
    };
  }, [refresh]);

  const dismissWelcome = useCallback(() => {
    setSeenWelcomeVersion((prev) => {
      const next = Math.max(prev, config.welcomeVersion);
      try {
        localStorage.setItem(WELCOME_SEEN_KEY, String(next));
      } catch {
        /* حافظه در دسترس نیست */
      }
      return next;
    });
  }, [config.welcomeVersion]);

  const value = useMemo<AppConfigContextValue>(
    () => ({
      config,
      isReady: isReady && mounted,
      refresh,
      seenWelcomeVersion,
      dismissWelcome,
    }),
    [config, isReady, mounted, refresh, seenWelcomeVersion, dismissWelcome]
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig(): AppConfigContextValue {
  const ctx = useContext(AppConfigContext);
  if (!ctx) {
    throw new Error("useAppConfig باید داخل AppConfigProvider استفاده شود");
  }
  return ctx;
}
