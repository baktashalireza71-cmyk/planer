"use client";

/**
 * پنل مدیریت برنامه (تبلیغ + ارتباط با مشتری + امنیت)
 * ------------------------------------------------
 * همه fetch ها با credentials: "same-origin" — کوکی httpOnly «planner_admin»
 * خودش همراه درخواست می‌رود. بعد از ذخیره موفق، refresh() کانکست
 * صدا زده می‌شود تا بنر تبلیغ/کارت خوشامد فوراً به‌روز شود.
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Megaphone,
  MessagesSquare,
  ShieldCheck,
  Save,
  Loader2,
  LogOut,
  Eye,
  KeyRound,
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAppConfig, type ContactChannel } from "@/lib/app-config-context";
import { faNum } from "@/lib/date";
import { cn } from "@/lib/utils";

type AdminSettings = {
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
  welcomeVersion: number;
};

const CHANNEL_OPTIONS: { value: ContactChannel; label: string }[] = [
  { value: "WHATSAPP", label: "واتساپ" },
  { value: "TELEGRAM", label: "تلگرام" },
  { value: "BALE", label: "بله" },
  { value: "NONE", label: "هیچ" },
];

const TARGET_GUIDE: Record<ContactChannel, string> = {
  WHATSAPP: "فقط رقم با + (مثل +989123456789)",
  TELEGRAM: "فقط نام کاربری (حروف انگلیسی، عدد، _)",
  BALE: "فقط نام کاربری (حروف انگلیسی، عدد، _)",
  NONE: "بدون راه ارتباطی",
};

/** اعتبارسنجی سبک کلاینت — عیناً هم‌راستا با قواعد PUT /api/admin/settings */
function validate(s: {
  adTitle: string;
  adText: string;
  adButtonText: string;
  adLink: string;
  adImage: string;
  contactChannel: ContactChannel;
  contactTarget: string;
  contactMessage: string;
  welcomeText: string;
}): string | null {
  if (s.adTitle.length > 120) return "عنوان تبلیغ حداکثر ۱۲۰ کاراکتر است";
  if (s.adText.length > 500) return "متن تبلیغ حداکثر ۵۰۰ کاراکتر است";
  if (s.adButtonText.length > 40) return "متن دکمه تبلیغ حداکثر ۴۰ کاراکتر است";
  if (s.adLink && !/^https?:\/\/.+/i.test(s.adLink.trim()))
    return "لینک دکمه باید با http:// یا https:// شروع شود";
  if (s.adImage && !/^https?:\/\/.+/i.test(s.adImage.trim()))
    return "لینک تصویر باید با http:// یا https:// شروع شود";
  if (s.contactChannel === "NONE" && s.contactTarget.trim() !== "")
    return "با کانال «هیچ» نباید شناسه/شماره وارد شود";
  if (s.contactChannel === "WHATSAPP" && s.contactTarget.trim() !== "" && !/^\+?\d{6,20}$/.test(s.contactTarget.trim()))
    return "شماره واتساپ فقط رقم است (اختیاری با + و حداقل ۶ رقم)";
  if (
    (s.contactChannel === "TELEGRAM" || s.contactChannel === "BALE") &&
    s.contactTarget.trim() !== "" &&
    !/^[A-Za-z0-9_]{3,64}$/.test(s.contactTarget.trim().replace(/^@/, ""))
  )
    return "برای تلگرام/بله فقط نام کاربری انگلیسی (۳ تا ۶۴ کاراکتر) معتبر است";
  if (s.contactMessage.length > 300) return "متن پیام همراه حداکثر ۳۰۰ کاراکتر است";
  if (s.welcomeText.length > 1000) return "متن کارت خوشامد حداکثر ۱۰۰۰ کاراکتر است";
  return null;
}

export default function AdminPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { refresh } = useAppConfig();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── فرم ──
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [adTitle, setAdTitle] = useState("");
  const [adText, setAdText] = useState("");
  const [adImage, setAdImage] = useState("");
  const [adButtonText, setAdButtonText] = useState("");
  const [adLink, setAdLink] = useState("");
  const [channel, setChannel] = useState<ContactChannel>("NONE");
  const [contactTarget, setContactTarget] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [welcomeText, setWelcomeText] = useState("");
  const [welcomeVersion, setWelcomeVersion] = useState(1);

  // ── تغییر رمز ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const fillForm = useCallback((s: AdminSettings) => {
    setAdsEnabled(Boolean(s.adsEnabled));
    setAdTitle(s.adTitle ?? "");
    setAdText(s.adText ?? "");
    setAdImage(s.adImage ?? "");
    setAdButtonText(s.adButtonText ?? "");
    setAdLink(s.adLink ?? "");
    setChannel(s.contactChannel ?? "NONE");
    setContactTarget(s.contactTarget ?? "");
    setContactMessage(s.contactMessage ?? "");
    setWelcomeText(s.welcomeText ?? "");
    setWelcomeVersion(s.welcomeVersion ?? 1);
  }, []);

  // بارگذاری تنظیمات هنگام باز شدن پنل
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    (async () => {
      await Promise.resolve();
      try {
        const res = await fetch("/api/admin/settings", { cache: "no-store", credentials: "same-origin" });
        if (!alive) return;
        if (res.status === 401) {
          toast.error("نشست مدیر منقضی شده؛ دوباره وارد شو");
          onOpenChange(false);
          return;
        }
        if (!res.ok) throw new Error("load failed");
        const data = (await res.json()) as { settings?: AdminSettings };
        if (data.settings) fillForm(data.settings);
      } catch {
        if (alive) toast.error("خطا در دریافت تنظیمات");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, onOpenChange, fillForm]);

  const save = async () => {
    const invalid = validate({ adTitle, adText, adButtonText, adLink, adImage, contactChannel: channel, contactTarget, contactMessage, welcomeText });
    if (invalid) {
      toast.error(invalid);
      return;
    }
    if (!Number.isInteger(welcomeVersion) || welcomeVersion < 1 || welcomeVersion > 1000000) {
      toast.error("نسخه کارت خوشامد باید عددی بین ۱ تا ۱۰۰۰۰۰۰ باشد");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adsEnabled,
          adTitle: adTitle.trim(),
          adText: adText.trim(),
          adImage: adImage.trim() ? adImage.trim() : null,
          adButtonText: adButtonText.trim(),
          adLink: adLink.trim(),
          contactChannel: channel,
          contactTarget: contactTarget.trim().replace(/^@/, ""),
          contactMessage: contactMessage.trim(),
          welcomeText: welcomeText.trim(),
          welcomeVersion,
        }),
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { settings?: AdminSettings };
        if (data.settings) fillForm(data.settings);
        toast.success("ذخیره شد ✅");
        await refresh(); // بنر تبلیغ/کارت خوشامد فوراً آپدیت شود
      } else if (res.status === 400) {
        toast.error("مقادیر نامعتبر است — راهنمای هر فیلد را چک کن");
      } else if (res.status === 401) {
        toast.error("نشست مدیر منقضی شده؛ دوباره وارد شو");
        onOpenChange(false);
      } else if (res.status === 429) {
        toast.error("تلاش بیش از حد — کمی بعد دوباره امتحان کن");
      } else {
        toast.error("ذخیره ناموفق بود؛ دوباره تلاش کن");
      }
    } catch {
      toast.error("خطای شبکه — اتصالت را بررسی کن");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword) {
      toast.error("رمز فعلی را وارد کن");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 64) {
      toast.error("رمز جدید باید ۸ تا ۶۴ کاراکتر باشد");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("تکرار رمز جدید با رمز جدید یکسان نیست");
      return;
    }
    setChangingPw(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: "same-origin",
      });
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("رمز مدیر با موفقیت تغییر کرد 🔐");
      } else if (res.status === 400) {
        toast.error("رمز فعلی اشتباه است یا رمز جدید نامعتبر است (۸ تا ۶۴ کاراکتر)");
      } else if (res.status === 401) {
        toast.error("نشست مدیر منقضی شده؛ دوباره وارد شو");
        onOpenChange(false);
      } else {
        toast.error("تغییر رمز ناموفق بود");
      }
    } catch {
      toast.error("خطای شبکه");
    } finally {
      setChangingPw(false);
    }
  };

  const logout = async () => {
    try {
      const res = await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
      if (res.ok) {
        toast.success("از حساب مدیر خارج شدی");
        onOpenChange(false);
      } else {
        toast.error("خروج ناموفق بود");
      }
    } catch {
      toast.error("خطای شبکه");
    }
  };

  const bumpWelcomeVersion = () => {
    setWelcomeVersion((v) => Math.min(1000000, v + 1));
    toast("با ذخیره، کارت خوشامد برای همه کاربران دوباره نمایش داده می‌شود");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-2xl gap-0 overflow-hidden rounded-3xl p-0">
        <div className="flex max-h-[80vh] flex-col">
          <DialogHeader className="relative border-b border-border/60 px-5 py-4 text-right sm:text-right">
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
              پنل مدیریت
            </DialogTitle>
            <DialogDescription className="text-xs">
              مدیریت تبلیغ، راه ارتباطی با کاربران و امنیت
            </DialogDescription>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="بستن پنل مدیریت"
              className="absolute left-3 top-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm font-bold">در حال بارگذاری تنظیمات…</p>
              </div>
            ) : (
              <>
                {/* ── سکشن تبلیغ ── */}
                <FormSection icon={Megaphone} title="تبلیغ" tone="amber">
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-extrabold">نمایش تبلیغ در خانه</p>
                      <p className="text-[11px] text-muted-foreground">بنر تبلیغ بالای داشبورد دیده می‌شود</p>
                    </div>
                    <Switch
                      checked={adsEnabled}
                      onCheckedChange={setAdsEnabled}
                      aria-label="نمایش تبلیغ در خانه"
                      className="h-6 w-11 shrink-0 data-[state=checked]:bg-amber-500"
                    />
                  </div>
                  <Field label="عنوان تبلیغ">
                    <Input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} maxLength={120} placeholder="مثلاً: کافه چلچراغ" className="rounded-xl bg-background" />
                  </Field>
                  <Field label="متن تبلیغ">
                    <Textarea value={adText} onChange={(e) => setAdText(e.target.value)} maxLength={500} rows={3} placeholder="توضیح کوتاه تبلیغ…" className="rounded-xl bg-background" />
                  </Field>
                  <Field label="لینک تصویر (اختیاری)">
                    <Input dir="ltr" value={adImage} onChange={(e) => setAdImage(e.target.value)} maxLength={500} placeholder="https://…" className="rounded-xl bg-background text-left text-xs" />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="متن دکمه">
                      <Input value={adButtonText} onChange={(e) => setAdButtonText(e.target.value)} maxLength={40} placeholder="مشاهده" className="rounded-xl bg-background" />
                    </Field>
                    <Field label="لینک دکمه">
                      <Input dir="ltr" value={adLink} onChange={(e) => setAdLink(e.target.value)} maxLength={500} placeholder="https://…" className="rounded-xl bg-background text-left text-xs" />
                    </Field>
                  </div>
                </FormSection>

                {/* ── سکشن ارتباط با مشتری ── */}
                <FormSection icon={MessagesSquare} title="ارتباط با مشتری" tone="teal">
                  {/* گروه دکمه‌ها داخل label نمی‌گذاریم تا نام دسترس‌پذیری تمیز بماند */}
                  <div className="min-w-0">
                    <span className="mb-1.5 block text-xs font-bold">کانال ارتباطی</span>
                    <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="کانال ارتباطی">
                      {CHANNEL_OPTIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => {
                            setChannel(c.value);
                            if (c.value === "NONE") setContactTarget("");
                          }}
                          aria-pressed={channel === c.value}
                          className={cn(
                            "flex h-11 min-w-0 cursor-pointer items-center justify-center truncate rounded-full px-1 text-xs font-bold transition-all active:scale-95",
                            channel === c.value
                              ? "bg-gradient-to-l from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25"
                              : "bg-secondary text-secondary-foreground hover:bg-accent"
                          )}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label={channel === "WHATSAPP" ? "شماره واتساپ" : channel === "NONE" ? "شناسه" : "نام کاربری"} hint={TARGET_GUIDE[channel]}>
                    <Input
                      dir="ltr"
                      value={contactTarget}
                      onChange={(e) => setContactTarget(e.target.value)}
                      maxLength={100}
                      disabled={channel === "NONE"}
                      placeholder={channel === "WHATSAPP" ? "+989123456789" : "@username"}
                      className="rounded-xl bg-background text-left text-xs"
                    />
                  </Field>
                  <Field label="متن پیام همراه" hint="با کلیک روی دکمه ارتباط، به‌عنوان متن اولیه پیام ارسال می‌شود">
                    <Textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} maxLength={300} rows={2} className="rounded-xl bg-background" />
                  </Field>
                  <Field label="متن کارت خوشامد" hint="در بنر بنفش بالای داشبورد و بخش پشتیبانی تنظیمات نمایش داده می‌شود">
                    <Textarea value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)} maxLength={1000} rows={2} className="rounded-xl bg-background" />
                  </Field>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-secondary/60 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-extrabold">
                        نسخه فعلی کارت خوشامد: <span className="tabular-nums">{faNum(welcomeVersion)}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">با افزایش نسخه، کارت دوباره برای همه ظاهر می‌شود</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={bumpWelcomeVersion}
                      className="h-11 shrink-0 gap-1.5 rounded-full px-4 text-xs font-bold text-teal-600 dark:text-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-500/10 dark:hover:text-teal-200"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      نمایش مجدد کارت برای همه کاربران
                    </Button>
                  </div>
                </FormSection>

                {/* ── ذخیره ── */}
                <Button
                  onClick={save}
                  disabled={saving || loading}
                  className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-l from-amber-500 to-orange-500 text-sm font-black text-white shadow-lg shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  ذخیره تنظیمات
                </Button>

                {/* ── سکشن امنیت ── */}
                <FormSection icon={KeyRound} title="امنیت" tone="rose">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="رمز فعلی">
                      <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" className="h-11 rounded-xl bg-background text-sm" />
                    </Field>
                    <Field label="رمز جدید" hint="۸ تا ۶۴ کاراکتر">
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" className="h-11 rounded-xl bg-background text-sm" />
                    </Field>
                    <Field label="تکرار رمز جدید">
                      <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className="h-11 rounded-xl bg-background text-sm" />
                    </Field>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={changePassword}
                      disabled={changingPw}
                      className="h-11 min-w-0 flex-1 gap-1.5 rounded-full bg-gradient-to-l from-rose-500 to-pink-500 text-sm font-black text-white shadow-md hover:from-rose-600 hover:to-pink-600"
                    >
                      {changingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                      تغییر رمز مدیر
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={logout}
                      className="h-11 gap-1.5 rounded-full text-sm font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      خروج
                    </Button>
                  </div>
                </FormSection>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
//  اجزای کوچک فرم
// ─────────────────────────────────────────────
const SECTION_TONES: Record<string, string> = {
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  teal: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
};

function FormSection({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: LucideIcon;
  title: string;
  tone: "amber" | "teal" | "rose";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-extrabold">
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", SECTION_TONES[tone])}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-bold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10.5px] leading-relaxed text-muted-foreground">{hint}</span>}
    </label>
  );
}
