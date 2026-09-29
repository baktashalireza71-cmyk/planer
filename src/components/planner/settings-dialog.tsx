"use client";

/**
 * دیالوگ تنظیمات برنامه
 * ------------------------------------------------
 * شامل: انتخاب تم، ماه تولد (فال روزانه)، پشتیبانی و ارتباط،
 * ورود مدیر (و پنل مدیریت)، حریم خصوصی و درباره برنامه.
 * تشخیص وضعیت ورود مدیر: GET /api/admin/settings هنگام باز شدن
 * (200 → لاگین، 401 → مهمان).
 */

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Settings,
  Check,
  Palette,
  Cake,
  LifeBuoy,
  ShieldCheck,
  LogIn,
  LogOut,
  LayoutDashboard,
  Info,
  Trash2,
  MessageCircle,
  Send,
  MessagesSquare,
  X,
  Loader2,
  Lock,
  FileText,
  Bell,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { THEMES, type ThemeId } from "@/lib/themes";
import { JALALI_MONTHS, faNum } from "@/lib/date";
import { useAppConfig, buildContactUrl } from "@/lib/app-config-context";
import { notifPrefsStore, defaultNotifPrefs, type NotifPrefs } from "@/lib/local-store";
import {
  requestNotificationPermission,
  notificationPermission,
  notificationsSupported,
} from "@/lib/notifications";
import {
  isNativeApp,
  getNativePermissionState,
  requestNativePermission,
} from "@/lib/native-bridge";
import { cn } from "@/lib/utils";
import { ENABLE_ADMIN_PANEL } from "@/lib/constants";
import AdminPanel from "./admin-panel";

/** قرارداد Task 5-a — عیناً همان کلید/رویداد fal-section */
const BIRTH_MONTH_KEY = "planner.fal.birth-month";
const BIRTH_MONTH_EVENT = "planner:birth-month-changed";

type AdminAuthState = "unknown" | "in" | "out";

const CHANNEL_STYLE: Record<
  string,
  { label: string; icon: LucideIcon; className: string }
> = {
  WHATSAPP: {
    label: "ارتباط در واتساپ",
    icon: MessageCircle,
    className: "bg-[#25D366] hover:bg-[#1fb757] text-white",
  },
  TELEGRAM: {
    label: "ارتباط در تلگرام",
    icon: Send,
    className: "bg-[#229ED9] hover:bg-[#1d8bc0] text-white",
  },
  BALE: {
    label: "ارتباط در بله",
    icon: MessagesSquare,
    className: "bg-cyan-600 hover:bg-cyan-700 text-white",
  },
};

export default function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-lg gap-0 overflow-hidden rounded-3xl p-0">
        <div className="flex max-h-[75vh] flex-col">
          <DialogHeader className="relative border-b border-border/60 px-5 py-4 text-right sm:text-right">
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                <Settings className="h-4 w-4" />
              </span>
              تنظیمات
            </DialogTitle>
            <DialogDescription className="text-xs">
              شخصی‌سازی ظاهر، فال روزانه و راه‌های ارتباطی
            </DialogDescription>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="بستن تنظیمات"
              className="absolute left-3 top-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <ThemeSection />
            <NotificationsSection />
            <BirthMonthSection />
            <SupportSection />
            {ENABLE_ADMIN_PANEL && <AdminSection />}
            <PrivacySection />
            <AboutSection />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
//  الف) تم برنامه
// ─────────────────────────────────────────────
function ThemeSection() {
  const { theme, setTheme } = useTheme();

  const pick = (id: ThemeId) => {
    setTheme(id);
    toast.success("تم اعمال شد 🎨");
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-extrabold">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400">
          <Palette className="h-3.5 w-3.5" />
        </span>
        تم برنامه
      </h4>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="انتخاب تم">
        {THEMES.map((t) => {
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              aria-pressed={active}
              className={cn(
                "relative flex min-w-0 cursor-pointer flex-col gap-2 rounded-2xl border p-3 text-right transition-all active:scale-[0.98]",
                active
                  ? "border-primary bg-accent/50 ring-2 ring-primary/50"
                  : "border-border hover:border-foreground/20 hover:bg-accent/30"
              )}
            >
              {active && (
                <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              <span className="flex items-center gap-1">
                {[t.swatch.bg, t.swatch.primary, t.swatch.accent].map((c, i) => (
                  <span
                    key={i}
                    className="h-5 w-5 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-extrabold">{t.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{t.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
//  ب) اعلان‌ها و یادآورها
// ─────────────────────────────────────────────
function NotificationsSection() {
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultNotifPrefs);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported" | "prompt">("default");
  const [loaded, setLoaded] = useState(false);

  // این بخش فقط هنگام باز شدن دیالوگ mount می‌شود — هر بار تازه خوانده می‌شود
  useEffect(() => {
    let alive = true;
    (async () => {
      await Promise.resolve(); // قطع مسیر همگام (سازگار با قواعد lint)
      if (!alive) return;
      setPrefs(notifPrefsStore.get());
      // در اپ اندروید وضعیت مجوز از پل Capacitor خوانده می‌شود
      setPerm(isNativeApp() ? await getNativePermissionState() : notificationPermission());
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const update = (patch: Partial<NotifPrefs>) => {
    const next = notifPrefsStore.set(patch);
    setPrefs(next);
  };

  const askPermission = async () => {
    if (isNativeApp()) {
      const ok = await requestNativePermission();
      setPerm(ok ? "granted" : "denied");
      toast[ok ? "success" : "error"](ok ? "اعلان‌های اندروید فعال شد 🔔" : "مجوز اعلان داده نشد");
      return;
    }
    const result = await requestNotificationPermission();
    setPerm(result);
    if (result === "granted") {
      toast.success("اعلان‌ها فعال شد 🔔");
    } else if (result === "denied") {
      toast.error("اعلان مسدود شد — از تنظیمات مرورگر می‌توانی فعالش کنی");
    }
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-extrabold">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
          <Bell className="h-3.5 w-3.5" />
        </span>
        اعلان‌ها و یادآورها
      </h4>

      {!loaded ? (
        <p className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          در حال بارگذاری تنظیمات…
        </p>
      ) : (
        <div className="space-y-3">
          {/* یادآور روزانه */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold">یادآور روزانه 🌙</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                هر شب در ساعت تعیین‌شده خلاصه کارها و عادت‌های امروزت را نشان می‌دهد.
              </p>
            </div>
            <Switch
              checked={prefs.dailyEnabled}
              onCheckedChange={(v) => update({ dailyEnabled: v })}
              aria-label="یادآور روزانه"
            />
          </div>
          {prefs.dailyEnabled && (
            <div className="flex items-center gap-2 pl-1">
              <label htmlFor="daily-reminder-time" className="shrink-0 text-[11px] font-bold text-muted-foreground">
                ساعت یادآور:
              </label>
              <Input
                id="daily-reminder-time"
                type="time"
                dir="ltr"
                value={prefs.dailyTime}
                onChange={(e) => update({ dailyTime: e.target.value || "21:00" })}
                className="h-9 w-32 rounded-xl bg-background text-center text-sm tabular-nums"
              />
            </div>
          )}

          {/* اعلان کارهای امروز */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold">اعلان کارهای امروز 🔔</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                وقتی برنامه را باز می‌کنی، کارهای امروز و عقب‌افتاده را یادآوری می‌کند.
              </p>
            </div>
            <Switch
              checked={prefs.dueAlertsEnabled}
              onCheckedChange={(v) => update({ dueAlertsEnabled: v })}
              aria-label="اعلان کارهای امروز"
            />
          </div>

          {/* مجوز اعلان سیستمی */}
          <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-3 dark:border-orange-500/20 dark:bg-orange-500/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold">{isNativeApp() ? "اعلان سیستمی اندروید" : "اعلان سیستمی مرورگر"}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                  {perm === "granted"
                    ? isNativeApp()
                      ? "فعال است ✅ — یادآورها حتی وقتی برنامه بسته است می‌آیند."
                      : "فعال است ✅ — اعلان‌ها بیرون از برنامه هم نمایش داده می‌شوند."
                    : perm === "denied"
                      ? isNativeApp()
                        ? "مسدود شده — از تنظیمات گوشی ← برنامه ← مجوزها فعالش کن."
                        : "مسدود شده — از تنظیمات مرورگر سایت را در فهرست مجازها بگذار."
                      : "برای نمایش اعلان بیرون از برنامه، اجازه بده."}
                </p>
              </div>
              {perm === "default" || (isNativeApp() && perm === "prompt") ? (
                <Button
                  size="sm"
                  onClick={askPermission}
                  className="h-9 shrink-0 gap-1.5 rounded-full bg-gradient-to-l from-orange-500 to-pink-500 px-4 text-xs font-black text-white shadow-md hover:from-orange-600 hover:to-pink-600"
                >
                  <Bell className="h-3.5 w-3.5" />
                  فعال‌سازی
                </Button>
              ) : !notificationsSupported() && !isNativeApp() ? (
                <span className="shrink-0 text-[10px] font-bold text-muted-foreground">پشتیبانی نمی‌شود</span>
              ) : null}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-orange-900/60 dark:text-orange-200/60">
              {isNativeApp()
                ? "یادآورها با زمان‌بندی سیستمی اندروید فعال‌اند — حتی وقتی برنامه بسته است."
                : "یادآورها وقتی برنامه باز است نمایش داده می‌شوند؛ در نسخه اندروید (بازار) یادآور واقعی و دقیق فعال خواهد شد."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
//  ج) ماه تولد من (فال روزانه)
// ─────────────────────────────────────────────
function BirthMonthSection() {
  const [birthMonth, setBirthMonth] = useState<number | null>(null);

  // خواندن مقدار فعلی — چون این بخش فقط با باز شدن دیالوگ mount می‌شود، هر بار تازه خوانده می‌شود
  useEffect(() => {
    let alive = true;
    (async () => {
      await Promise.resolve(); // قطع مسیر همگام (سازگار با قواعد lint)
      if (!alive) return;
      const raw = window.localStorage.getItem(BIRTH_MONTH_KEY);
      const n = raw === null ? NaN : parseInt(raw, 10);
      setBirthMonth(Number.isInteger(n) && n >= 1 && n <= 12 ? n : null);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const select = (m: number) => {
    window.localStorage.setItem(BIRTH_MONTH_KEY, String(m));
    window.dispatchEvent(new CustomEvent(BIRTH_MONTH_EVENT));
    setBirthMonth(m);
    toast.success(`ماه «${JALALI_MONTHS[m - 1]}» ثبت شد — فال روزانه‌ات آماده است ✨`);
  };

  const clear = () => {
    window.localStorage.removeItem(BIRTH_MONTH_KEY);
    window.dispatchEvent(new CustomEvent(BIRTH_MONTH_EVENT));
    setBirthMonth(null);
    toast("انتخاب ماه تولد حذف شد");
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <h4 className="mb-1 flex items-center gap-2 text-sm font-extrabold">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
          <Cake className="h-3.5 w-3.5" />
        </span>
        ماه تولد من (فال روزانه)
      </h4>
      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        ماه تولدت را انتخاب کن تا «فال روزانه» مخصوص برج تو در تب فال نمایش داده شود.
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="انتخاب ماه تولد">
        {JALALI_MONTHS.map((name, i) => {
          const m = i + 1;
          const active = birthMonth === m;
          return (
            <button
              key={m}
              onClick={() => select(m)}
              aria-pressed={active}
              className={cn(
                "flex h-11 min-w-0 cursor-pointer items-center justify-center truncate rounded-full px-2 text-xs font-bold transition-all active:scale-95",
                active
                  ? "bg-gradient-to-l from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/30"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
      {birthMonth !== null && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          className="mt-2 h-9 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          حذف انتخاب
        </Button>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
//  ج) پشتیبانی و ارتباط
// ─────────────────────────────────────────────
function SupportSection() {
  const { config } = useAppConfig();
  const contactUrl = buildContactUrl(config.contactChannel, config.contactTarget, config.contactMessage);
  const style = CHANNEL_STYLE[config.contactChannel];
  const hasContact = config.contactChannel !== "NONE" && Boolean(contactUrl) && Boolean(style);
  const StyleIcon = style?.icon;

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-extrabold">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
          <LifeBuoy className="h-3.5 w-3.5" />
        </span>
        پشتیبانی و ارتباط
      </h4>
      {hasContact && style ? (
        <div className="space-y-2.5">
          {(config.welcomeText || config.contactMessage) && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {config.welcomeText || config.contactMessage}
            </p>
          )}
          <a
            href={contactUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black shadow-md transition-transform hover:scale-[1.01] active:scale-[0.98]",
              style.className
            )}
          >
            <StyleIcon className="h-4 w-4" />
            {style.label}
          </a>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">در حال حاضر راه ارتباطی ثبت نشده است.</p>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
//  د) ورود مدیر
// ─────────────────────────────────────────────
function AdminSection() {
  const [authState, setAuthState] = useState<AdminAuthState>("unknown");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store", credentials: "same-origin" });
      if (res.ok) {
        setAuthState("in");
      } else if (res.status === 401) {
        setAuthState("out");
      } else {
        setAuthState("out");
        toast.error("خطا در بررسی وضعیت ورود مدیر");
      }
    } catch {
      setAuthState("out");
      toast.error("خطا در بررسی وضعیت ورود مدیر");
    }
  }, []);

  // این بخش فقط هنگام باز شدن دیالوگ mount می‌شود (محتوای Radix Dialog)
  useEffect(() => {
    let alive = true;
    (async () => {
      await Promise.resolve();
      if (alive) setAuthState("unknown");
      await checkAuth();
    })();
    return () => {
      alive = false;
    };
  }, [checkAuth]);

  const login = async () => {
    if (!password) {
      toast.error("رمز مدیر را وارد کن");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "same-origin",
      });
      if (res.ok) {
        setAuthState("in");
        setPassword("");
        toast.success("خوش آمدی، مدیر! 👑");
      } else if (res.status === 401) {
        toast.error("رمز اشتباه است");
      } else if (res.status === 429) {
        const data = (await res.json().catch(() => ({}))) as { retryAfterSec?: number };
        const min = data.retryAfterSec ? Math.ceil(data.retryAfterSec / 60) : 15;
        toast.error(`تلاش‌های ناموفق زیاد است — حدود ${faNum(min)} دقیقه دیگر تلاش کن`);
      } else {
        toast.error("ورود ناموفق بود؛ دوباره تلاش کن");
      }
    } catch {
      toast.error("خطای شبکه — اتصالت را بررسی کن");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
      if (res.ok) {
        setAuthState("out");
        toast.success("از حساب مدیر خارج شدی");
      } else {
        toast.error("خروج ناموفق بود");
      }
    } catch {
      toast.error("خطای شبکه");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-extrabold">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
          <ShieldCheck className="h-3.5 w-3.5" />
        </span>
        ورود مدیر
      </h4>

      {authState === "unknown" ? (
        <p className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          در حال بررسی وضعیت ورود…
        </p>
      ) : authState === "out" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login();
          }}
          className="flex gap-2"
        >
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="رمز مدیر"
            autoComplete="current-password"
            className="h-11 min-w-0 flex-1 rounded-full bg-background text-sm"
          />
          <Button
            type="submit"
            disabled={busy}
            className="h-11 shrink-0 gap-1.5 rounded-full bg-gradient-to-l from-amber-500 to-orange-500 px-4 text-sm font-black text-white shadow-md hover:from-amber-600 hover:to-orange-600"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            ورود مدیر
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setAdminOpen(true)}
            className="h-11 min-w-0 flex-1 gap-1.5 rounded-full bg-gradient-to-l from-amber-500 to-orange-500 text-sm font-black text-white shadow-md hover:from-amber-600 hover:to-orange-600"
          >
            <LayoutDashboard className="h-4 w-4" />
            پنل مدیریت
          </Button>
          <Button
            variant="outline"
            onClick={logout}
            disabled={busy}
            className="h-11 gap-1.5 rounded-full text-sm font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            خروج
          </Button>
        </div>
      )}

      {/* پنل مدیریت — داخل همین دیالوگ باز می‌شود */}
      <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} />
    </section>
  );
}

// ─────────────────────────────────────────────
//  و) حریم خصوصی
// ─────────────────────────────────────────────
const PRIVACY_POINTS = [
  "همه اطلاعات تو فقط روی خودِ دستگاه ذخیره می‌شود — نه روی هیچ سروری.",
  "بدون ثبت‌نام، بدون حساب کاربری، بدون جمع‌آوری هیچ داده‌ای.",
  "برنامه به هیچ دسترسی حساسی (مخاطبین، موقعیت مکانی، دوربین یا میکروفن) نیاز ندارد.",
];

const PRIVACY_POLICY: { title: string; body: string }[] = [
  {
    title: "۱) جمع‌آوری اطلاعات",
    body: "پلنر من هیچ اطلاعات شخصی‌ای جمع‌آوری نمی‌کند. همه اطلاعات تو — کارها، عادت‌ها، اهداف، یادداشت‌ها، رویدادها و ماه تولد — فقط در حافظهٔ محلی خودِ دستگاه ذخیره می‌شود و هرگز برای ما یا هیچ شخص ثالثی ارسال نمی‌شود.",
  },
  {
    title: "۲) بدون ثبت‌نام و حساب کاربری",
    body: "برای استفاده از برنامه نیازی به ثبت‌نام، شماره تلفن، ایمیل یا هرگونه اطلاعات هویتی نیست.",
  },
  {
    title: "۳) تبلیغات",
    body: "تبلیغات این برنامه به‌صورت دستی توسط سازنده در یک کادر اطلاعاتی نمایش داده می‌شود؛ هیچ سرویس تبلیغاتی شخص ثالثی (مانند AdMob) در برنامه فعال نیست و هیچ داده‌ای برای هدف‌گیری تبلیغ رد و بدل نمی‌شود. لینک‌های داخل تبلیغ تو را به بیرون از برنامه می‌برند و مسئولیت مرور آن صفحه‌ها با خودت است.",
  },
  {
    title: "۴) راه‌های ارتباطی",
    body: "اگر از طریق واتساپ، تلگرام یا بله با ما تماس بگیری، گفت‌وگوی تو در همان پیام‌رسان انجام می‌شود و تابع سیاست حریم خصوصی آن پیام‌رسان است. برنامه فقط یک دکمهٔ میان‌بُر برای رفتن به آن‌ها نشان می‌دهد.",
  },
  {
    title: "۵) دسترسی‌های برنامه",
    body: "برنامه به هیچ‌یک از دسترسی‌های حساس دستگاه — مخاطبین، موقعیت مکانی، دوربین، میکروفن یا فایل‌ها — نیاز ندارد.",
  },
  {
    title: "۶) حذف اطلاعات",
    body: "همهٔ اطلاعات تو فقط روی دستگاه خودت است؛ با پاک‌کردن داده‌های برنامه (یا حذف خود برنامه) همه‌چیز برای همیشه و به‌طور کامل حذف می‌شود.",
  },
  {
    title: "۷) امنیت",
    body: "چون اطلاعات هرگز از دستگاه خارج نمی‌شود، ریسک نشت داده یا نفوذ به سرور وجود ندارد. رمز پنل مدیریت نیز به‌صورت رمزنگاری‌شده (hash) ذخیره می‌شود و نشست ورود فقط روی همان دستگاه اعتبار دارد.",
  },
  {
    title: "۸) کودکان",
    body: "این برنامه برای همهٔ سنین مناسب است و هیچ داده‌ای از هیچ کاربری — بزرگسال یا کودک — جمع نمی‌کند.",
  },
  {
    title: "۹) تغییرات سیاست",
    body: "اگر در آینده بخشی از این سیاست تغییر کند، نسخهٔ جدید در همین بخش از تنظیمات برنامه اعلام می‌شود.",
  },
];

function PrivacySection() {
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-extrabold">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
          <Lock className="h-3.5 w-3.5" />
        </span>
        حریم خصوصی
      </h4>
      <ul className="mb-3 space-y-1.5">
        {PRIVACY_POINTS.map((point) => (
          <li
            key={point}
            className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="min-w-0">{point}</span>
          </li>
        ))}
      </ul>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPolicyOpen(true)}
        className="h-9 gap-1.5 rounded-full text-xs font-bold text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-400"
      >
        <FileText className="h-3.5 w-3.5" />
        مشاهده سیاست کامل حریم خصوصی
      </Button>

      {/* دیالوگ سیاست کامل — داخل همین دیالوگ تنظیمات */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-lg gap-0 overflow-hidden rounded-3xl p-0"
        >
          <div className="flex max-h-[75vh] flex-col">
            <DialogHeader className="relative border-b border-border/60 px-5 py-4 text-right sm:text-right">
              <DialogTitle className="flex items-center gap-2 text-base font-black">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Lock className="h-4 w-4" />
                </span>
                سیاست حریم خصوصی
              </DialogTitle>
              <DialogDescription className="text-xs">
                پلنر من — نسخه {faNum("1.0.0")}
              </DialogDescription>
              <button
                onClick={() => setPolicyOpen(false)}
                aria-label="بستن سیاست حریم خصوصی"
                className="absolute left-3 top-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {PRIVACY_POLICY.map((item) => (
                <div key={item.title}>
                  <h5 className="mb-1 text-xs font-extrabold text-foreground">{item.title}</h5>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ─────────────────────────────────────────────
//  هـ) درباره برنامه
// ─────────────────────────────────────────────
function AboutSection() {
  return (
    <section className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-4 dark:border-orange-500/20 dark:bg-orange-500/5">
      <h4 className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-orange-900 dark:text-orange-300">
        <Info className="h-3.5 w-3.5" />
        درباره برنامه
      </h4>
      <p className="text-xs leading-relaxed text-orange-900/80 dark:text-orange-200/70">
        پلنر من — نسخه {faNum("1.0.0")}؛ برنامه‌ریز حرفه‌ای زندگی برای کارها، عادت‌ها، اهداف و یادداشت‌ها.
        تقویم ۱۰۰٪ شمسی با تعطیلات رسمی ایران.
      </p>
    </section>
  );
}
