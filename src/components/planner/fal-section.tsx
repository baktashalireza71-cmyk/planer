"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Cake,
  CalendarDays,
  Check,
  Copy,
  Gift,
  Hourglass,
  MoonStar,
  RotateCcw,
  Sparkles,
  Star,
} from "lucide-react";
import { isValidJalaaliDate } from "jalaali-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SectionHeader, EmptyState, Chip } from "./shared";
import JalaliDatePicker from "./jalali-date-picker";
import { cn } from "@/lib/utils";
import {
  faNum,
  toJalali,
  fromJalali,
  persianWeekday,
  dateFromDayKey,
  formatJalaliFull,
  JALALI_MONTHS,
  WEEKDAYS_FA,
} from "@/lib/date";
import {
  MONTH_FALS,
  getFalOfTheDay,
  getChineseZodiac,
  jalaliAgeParts,
  daysUntilNextJalaliBirthday,
} from "@/lib/fal";
import { HIJRI_MONTHS, toHijri, fromHijri } from "@/lib/hijri";

// ─────────────────────────────────────────────
//  کمکی‌های محلی
// ─────────────────────────────────────────────

/** تبدیل ارقام فارسی/عربی به لاتین برای پارس اعداد ورودی */
function faToEn(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** فقط ارقام (فارسی/عربی/لاتین) مجاز است */
function digitsOnly(s: string): string {
  return s.replace(/[^\d۰-۹٠-٩]/g, "");
}

/** نام فارسی ماه‌های میلادی — فقط خروجی مبدل تاریخ */
const GREGORIAN_MONTHS = [
  "ژانویه",
  "فوریه",
  "مارس",
  "آوریل",
  "مه",
  "ژوئن",
  "ژوئیه",
  "اوت",
  "سپتامبر",
  "اکتبر",
  "نوامبر",
  "دسامبر",
];

// ─────────────────────────────────────────────
//  استور بیرونی «ماه تولد» — localStorage + رویداد سفارشی
//  (قرارداد Task 5-a: کلید planner.fal.birth-month + رویداد planner:birth-month-changed)
// ─────────────────────────────────────────────
const BIRTH_MONTH_KEY = "planner.fal.birth-month";
const BIRTH_MONTH_EVENT = "planner:birth-month-changed";

let birthMonthCache: number | null | undefined;

function readBirthMonth(): number | null {
  if (typeof window === "undefined") return null;
  if (birthMonthCache === undefined) {
    const raw = window.localStorage.getItem(BIRTH_MONTH_KEY);
    const n = raw === null ? NaN : parseInt(raw, 10);
    birthMonthCache = Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
  }
  return birthMonthCache;
}

function subscribeBirthMonth(cb: () => void) {
  const handler = () => {
    birthMonthCache = undefined; // کش را باطل کن (به‌ویژه برای رویداد storage بین تب‌ها)
    cb();
  };
  window.addEventListener(BIRTH_MONTH_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(BIRTH_MONTH_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function writeBirthMonth(m: number | null) {
  if (typeof window === "undefined") return;
  if (m === null) window.localStorage.removeItem(BIRTH_MONTH_KEY);
  else window.localStorage.setItem(BIRTH_MONTH_KEY, String(m));
  birthMonthCache = m;
  window.dispatchEvent(new CustomEvent(BIRTH_MONTH_EVENT));
}

// ─────────────────────────────────────────────
//  هوک هویدریشن‌سازگار mounted (همان الگوی app-shell)
// ─────────────────────────────────────────────
const mountedSubscribe = () => () => {};
function useMounted(): boolean {
  return useSyncExternalStore(
    mountedSubscribe,
    () => true,
    () => false
  );
}

// ─────────────────────────────────────────────
//  بخش «فال و ابزارها» — سه تب: فال روزانه / مبدل تاریخ / محاسبه تولد
// ─────────────────────────────────────────────
export default function FalSection() {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="فال و ابزارها"
        subtitle="فال روزانه، مبدل تاریخ و محاسبه سن تولد — همه در یک جا"
        icon={MoonStar}
        color="#8B5CF6"
      />

      <Tabs defaultValue="daily" className="gap-4">
        <TabsList className="grid h-10 w-full grid-cols-3 rounded-2xl p-1 sm:h-11">
          <TabsTrigger
            value="daily"
            className="rounded-xl px-1 text-[11px] font-bold sm:px-3 sm:text-sm"
          >
            فال روزانه
          </TabsTrigger>
          <TabsTrigger
            value="converter"
            className="rounded-xl px-1 text-[11px] font-bold sm:px-3 sm:text-sm"
          >
            مبدل تاریخ
          </TabsTrigger>
          <TabsTrigger
            value="birthday"
            className="rounded-xl px-1 text-[11px] font-bold sm:px-3 sm:text-sm"
          >
            محاسبه تولد
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyFal />
        </TabsContent>
        <TabsContent value="converter">
          <DateConverter />
        </TabsContent>
        <TabsContent value="birthday">
          <BirthdayCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────
//  تب ۱ — فال روزانه
// ─────────────────────────────────────────────
function DailyFal() {
  const mounted = useMounted();
  // ماه تولد از localStorage (استور بیرونی — هویدریشن‌سازگار)
  const birthMonth = useSyncExternalStore(
    subscribeBirthMonth,
    readBirthMonth,
    () => null
  );
  // ماه انتخابی کاربر از گرید ۱۲ برج (پیش‌فرض: ماه تولد)
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const shown = selected ?? birthMonth;
  const mf = shown ? MONTH_FALS[shown - 1] : null;

  // «امروز» فقط بعد از mount ساخته می‌شود تا هیدریشن نشکند
  const today = useMemo(() => (mounted ? new Date() : null), [mounted]);
  const todayJ = useMemo(() => (today ? toJalali(today) : null), [today]);
  const fal = useMemo(() => {
    if (!todayJ || !shown) return null;
    return getFalOfTheDay(todayJ.jy, shown, todayJ.jd);
  }, [todayJ, shown]);

  function pickBirthMonth(m: number) {
    writeBirthMonth(m);
    setSelected(null);
    toast.success("ماه تولدت ثبت شد ✨");
  }

  function clearBirthMonth() {
    writeBirthMonth(null);
    setSelected(null);
    toast("ماه تولدت پاک شد؛ دوباره انتخاب کن");
  }

  function handleCopy() {
    if (!fal || !mf) return;
    const full = `فال امروز — متولدین ${JALALI_MONTHS[mf.month - 1]} (${mf.sign}) ${mf.symbol}\n\n${fal.text}`;
    navigator.clipboard
      ?.writeText(full)
      .then(() => {
        toast.success("متن فال کپی شد");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("کپی انجام نشد"));
  }

  if (!mounted) {
    return <div className="h-60 w-full animate-pulse rounded-3xl bg-muted" />;
  }

  return (
    <div className="space-y-5">
      {/* کارت اصلی فال روزانه یا دعوت به انتخاب ماه تولد */}
      {!mf || !fal ? (
        <BirthMonthInvite onPick={pickBirthMonth} />
      ) : (
        <div
          key={mf.month}
          className="anim-enter min-w-0 rounded-3xl bg-card p-4 card-glow sm:p-6"
        >
          {/* سربرگ: ایموجی برج + عنوان + کپی */}
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl text-3xl sm:h-20 sm:w-20 sm:text-4xl"
              style={{ backgroundColor: `${mf.color}1A` }}
            >
              {mf.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-muted-foreground">
                {today ? formatJalaliFull(today) : ""}
              </p>
              <h3 className="mt-0.5 text-sm font-extrabold leading-6 text-foreground sm:text-base">
                فال امروز — متولدین {JALALI_MONTHS[mf.month - 1]} ({mf.sign}){" "}
                {mf.symbol}
              </h3>
              <p className="mt-2 flex items-center gap-1 text-[11px] font-extrabold text-violet-500">
                <Sparkles className="h-3 w-3" />
                ویژگی‌های متولدین
              </p>
              <div className="mt-1 flex min-w-0 flex-wrap gap-1.5">
                {mf.traits.map((t) => (
                  <Chip
                    key={t}
                    className="shrink-0 bg-secondary text-secondary-foreground"
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              aria-label="کپی متن فال"
              className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-violet-600"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* متن فال */}
          <div className="mt-4 min-w-0 rounded-2xl border border-border/60 bg-secondary/50 p-4">
            <p
              key={`${mf.month}-${fal.index}`}
              className="anim-enter text-[15px] font-medium leading-8 text-foreground sm:text-base sm:leading-9"
            >
              {fal.text}
            </p>
          </div>

          {/* چیپ‌های عدد و رنگ شانس */}
          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
            <Chip className="shrink-0 bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Star className="h-3 w-3" />
              عدد شانس امروز: {faNum(fal.luckyNumber)}
            </Chip>
            <Chip className="shrink-0 bg-secondary text-secondary-foreground">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: fal.luckyColor.hex }}
              />
              رنگ شانس: {fal.luckyColor.name}
            </Chip>
            {birthMonth !== null && (
              <button
                type="button"
                onClick={clearBirthMonth}
                className="mr-auto cursor-pointer text-[11px] font-bold text-muted-foreground underline underline-offset-4 hover:text-violet-600"
              >
                تغییر ماه تولد
              </button>
            )}
          </div>
        </div>
      )}

      {/* فال همه ماه‌ها */}
      <div className="min-w-0">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-foreground">
          <Star className="h-4 w-4 text-violet-500" />
          فال همه ماه‌ها
        </h3>
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MONTH_FALS.map((m) => {
            const active = shown === m.month;
            const isMine = birthMonth === m.month;
            return (
              <motion.button
                key={m.month}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelected(active ? null : m.month)}
                className={cn(
                  "min-w-0 cursor-pointer rounded-2xl border p-3 text-start transition-all",
                  active
                    ? "border-transparent text-white shadow-lg"
                    : "border-border bg-card hover:border-violet-300"
                )}
                style={
                  active
                    ? {
                        backgroundColor: m.color,
                        boxShadow: `0 8px 20px -8px ${m.color}99`,
                      }
                    : undefined
                }
              >
                <div className="flex min-w-0 items-center justify-between gap-1">
                  <span className="text-2xl leading-none">{m.emoji}</span>
                  <span
                    className={cn(
                      "text-sm",
                      active ? "text-white/85" : "text-muted-foreground"
                    )}
                  >
                    {m.symbol}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm font-extrabold">
                  {JALALI_MONTHS[m.month - 1]}
                </p>
                <p
                  className={cn(
                    "truncate text-[11px]",
                    active ? "text-white/85" : "text-muted-foreground"
                  )}
                >
                  برج {m.sign}
                </p>
                {isMine && (
                  <Chip
                    className={
                      active
                        ? "mt-1.5 bg-white/25 text-white"
                        : "mt-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                    }
                  >
                    ماه من
                  </Chip>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  کارت دعوت به انتخاب ماه تولد (۱۲ دکمه قرصی)
// ─────────────────────────────────────────────
function BirthMonthInvite({
  onPick,
}: {
  onPick: (m: number) => void;
}) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-violet-300/60 bg-violet-500/5 p-4 text-center sm:p-6">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-500">
        <Sparkles className="h-7 w-7" />
      </div>
      <p className="font-extrabold text-foreground">ماه تولدت را انتخاب کن</p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
        فال روزانه بر اساس برج ماه تولدت نمایش داده می‌شود
      </p>
      <div className="mt-4 grid min-w-0 grid-cols-3 gap-2 sm:grid-cols-4">
        {MONTH_FALS.map((m) => (
          <button
            key={m.month}
            type="button"
            onClick={() => onPick(m.month)}
            className="flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-border bg-card px-2 py-2 text-xs font-bold text-foreground transition-all hover:border-violet-400 hover:text-violet-600"
          >
            <span className="shrink-0">{m.emoji}</span>
            <span className="truncate">{JALALI_MONTHS[m.month - 1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  تب ۲ — مبدل تاریخ (شمسی / میلادی / قمری)
// ─────────────────────────────────────────────
type CalKey = "jalali" | "gregorian" | "hijri";

const CONVERTER_CALS: { key: CalKey; label: string }[] = [
  { key: "jalali", label: "شمسی" },
  { key: "gregorian", label: "میلادی" },
  { key: "hijri", label: "قمری" },
];

function monthsOf(src: CalKey): string[] {
  if (src === "jalali") return JALALI_MONTHS;
  if (src === "gregorian") return GREGORIAN_MONTHS;
  return HIJRI_MONTHS;
}

function DateConverter() {
  const mounted = useMounted();
  const [src, setSrc] = useState<CalKey>("jalali");
  // فیلدهای ورودی — تا وقتی دست‌نخورده باشد، «امروز» نمایش داده می‌شود
  const [fields, setFields] = useState<{
    y: string;
    m: number;
    d: string;
    touched: boolean;
  }>({ y: "", m: 0, d: "", touched: false });

  // مقدار «امروز» در تقویم مبدا — فقط بعد از mount
  const def = useMemo(() => {
    if (!mounted) return { y: "", m: 0, d: "" };
    const now = new Date();
    if (src === "jalali") {
      const j = toJalali(now);
      return { y: String(j.jy), m: j.jm, d: String(j.jd) };
    }
    if (src === "gregorian") {
      return {
        y: String(now.getFullYear()),
        m: now.getMonth() + 1,
        d: String(now.getDate()),
      };
    }
    const h = toHijri(now);
    return { y: String(h.hy), m: h.hm, d: String(h.hd) };
  }, [mounted, src]);

  const shown = fields.touched
    ? fields
    : { y: fields.y || def.y, m: fields.m || def.m, d: fields.d || def.d };

  function update(patch: Partial<{ y: string; m: number; d: string }>) {
    setFields((prev) => {
      // اولین ویرایش از مقادیر نمایش‌داده‌شده (امروز) شروع می‌شود تا ماه/روز پاک نشوند
      const base = prev.touched
        ? prev
        : { y: shown.y, m: shown.m, d: shown.d, touched: false };
      return { ...base, ...patch, touched: true };
    });
  }

  function resetToToday() {
    setFields((prev) => ({ ...prev, touched: false }));
  }

  function switchSource(next: CalKey) {
    setSrc(next);
    setFields((prev) => ({ ...prev, touched: false }));
  }

  // اعتبارسنجی و تاریخ مبدا
  const result = useMemo(() => {
    const yN = parseInt(faToEn(shown.y), 10);
    const dN = parseInt(faToEn(shown.d), 10);
    if (!shown.y || !shown.d || !shown.m || Number.isNaN(yN) || Number.isNaN(dN)) {
      return { status: "empty" as const };
    }
    if (src === "jalali") {
      if (!isValidJalaaliDate(yN, shown.m, dN)) return { status: "invalid" as const };
      return { status: "ok" as const, date: fromJalali(yN, shown.m, dN) };
    }
    if (src === "gregorian") {
      if (yN < 1 || yN > 4000) return { status: "invalid" as const };
      const dt = new Date(yN, shown.m - 1, dN);
      if (
        dt.getFullYear() !== yN ||
        dt.getMonth() !== shown.m - 1 ||
        dt.getDate() !== dN
      ) {
        return { status: "invalid" as const };
      }
      return { status: "ok" as const, date: dt };
    }
    // قمری
    const dt = fromHijri(yN, shown.m, dN);
    if (!dt) return { status: "invalid" as const };
    const back = toHijri(dt);
    if (back.hy !== yN || back.hm !== shown.m || back.hd !== dN) {
      return { status: "invalid" as const };
    }
    return { status: "ok" as const, date: dt };
  }, [src, shown.y, shown.m, shown.d]);

  // دو خروجی دیگر
  const outputs = useMemo(() => {
    if (result.status !== "ok") return null;
    const dt = result.date;
    const wd = WEEKDAYS_FA[persianWeekday(dt)];
    const list: { key: CalKey; title: string; line1: string; line2: string }[] = [];
    if (src !== "jalali") {
      const j = toJalali(dt);
      list.push({
        key: "jalali",
        title: "تقویم شمسی",
        line1: `${wd} ${faNum(j.jd)} ${JALALI_MONTHS[j.jm - 1]}`,
        line2: `${faNum(j.jy)}`,
      });
    }
    if (src !== "gregorian") {
      list.push({
        key: "gregorian",
        title: "تقویم میلادی",
        line1: `${wd} ${faNum(dt.getDate())} ${GREGORIAN_MONTHS[dt.getMonth()]}`,
        line2: `${faNum(dt.getFullYear())}`,
      });
    }
    if (src !== "hijri") {
      const h = toHijri(dt);
      list.push({
        key: "hijri",
        title: "تقویم قمری",
        line1: `${wd} ${faNum(h.hd)} ${HIJRI_MONTHS[h.hm - 1]}`,
        line2: `${faNum(h.hy)}`,
      });
    }
    return list;
  }, [result, src]);

  const monthList = monthsOf(src);

  return (
    <div className="space-y-4">
      {/* ورودی‌ها */}
      <div className="min-w-0 space-y-4 rounded-3xl bg-card p-4 card-glow sm:p-6">
        <div className="min-w-0">
          <Label className="mb-2">تقویم مبدأ</Label>
          <div className="flex min-w-0 flex-wrap gap-2">
            {CONVERTER_CALS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => switchSource(c.key)}
                className={cn(
                  "min-w-0 cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold transition-all",
                  src === c.key
                    ? "bg-gradient-to-l from-violet-500 to-purple-500 text-white shadow-md shadow-violet-500/25"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="conv-year">سال</Label>
            <Input
              id="conv-year"
              inputMode="numeric"
              value={shown.y}
              onChange={(e) => update({ y: digitsOnly(e.target.value) })}
              placeholder="مثلاً ۱۴۰۴"
              className="rounded-xl"
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label>ماه</Label>
            <Select
              value={shown.m ? String(shown.m) : ""}
              onValueChange={(v) => update({ m: Number(v) })}
              dir="rtl"
            >
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="ماه" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {monthList.map((name, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="conv-day">روز</Label>
            <Input
              id="conv-day"
              inputMode="numeric"
              value={shown.d}
              onChange={(e) => update({ d: digitsOnly(e.target.value) })}
              placeholder="مثلاً ۱۵"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={resetToToday}
            className="gap-1.5 rounded-full"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            امروز
          </Button>
          {result.status === "invalid" && (
            <Chip className="shrink-0 border border-red-500/30 bg-red-500/10 text-red-500">
              تاریخ نامعتبر است
            </Chip>
          )}
          {result.status === "empty" && (
            <span className="text-xs text-muted-foreground">
              سال، ماه و روز را وارد کن تا تبدیل شود
            </span>
          )}
        </div>
      </div>

      {/* خروجی دو تقویم دیگر */}
      {outputs && outputs.length > 0 && (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {outputs.map((o) => (
            <div
              key={`${src}-${o.key}`}
              className="anim-enter min-w-0 rounded-3xl bg-card p-4 card-glow sm:p-5"
            >
              <div className="flex items-center gap-2 text-violet-500">
                <ArrowLeftRight className="h-4 w-4" />
                <span className="text-xs font-extrabold">{o.title}</span>
              </div>
              <p className="mt-2 text-base font-black text-foreground sm:text-lg">
                {o.line1}
              </p>
              <p className="text-sm font-bold text-muted-foreground">{o.line2}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  تب ۳ — محاسبه تولد
// ─────────────────────────────────────────────
function InfoCard({
  icon: Icon,
  color,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-card p-3.5 card-glow sm:p-4">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
        <p className="break-words text-[13.5px] font-black leading-6 text-foreground sm:text-[15px]">
          {value}
        </p>
        {hint && (
          <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function BirthdayCalculator() {
  const mounted = useMounted();
  const [birthKey, setBirthKey] = useState("");

  const birth = useMemo(
    () => (birthKey ? dateFromDayKey(birthKey) : null),
    [birthKey]
  );
  const bj = useMemo(() => (birth ? toJalali(birth) : null), [birth]);
  const today = useMemo(() => (mounted ? new Date() : null), [mounted]);

  const cards = useMemo(() => {
    if (!birth || !bj || !today) return null;
    const tj = toJalali(today);
    const wd = WEEKDAYS_FA[persianWeekday(birth)];
    const age = jalaliAgeParts(
      { jy: bj.jy, jm: bj.jm, jd: bj.jd },
      { jy: tj.jy, jm: tj.jm, jd: tj.jd }
    );
    const mf = MONTH_FALS[bj.jm - 1];
    const zodiac = getChineseZodiac(bj.jy);
    const b0 = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate());
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lived = Math.max(
      0,
      Math.round((t0.getTime() - b0.getTime()) / 86400000)
    );
    const toBd = daysUntilNextJalaliBirthday(
      { jm: bj.jm, jd: bj.jd },
      { jy: tj.jy, jm: tj.jm, jd: tj.jd }
    );
    return { wd, age, mf, zodiac, lived, toBd };
  }, [birth, bj, today]);

  return (
    <div className="space-y-4">
      {/* انتخاب تاریخ تولد */}
      <div className="min-w-0 space-y-3 rounded-3xl bg-card p-4 card-glow sm:p-6">
        <Label htmlFor="fal-birth-date">تاریخ تولد (شمسی)</Label>
        <div className="max-w-xs">
          <JalaliDatePicker
            id="fal-birth-date"
            value={birthKey || null}
            onChange={(k) => setBirthKey(k ?? "")}
            clearable
          />
        </div>
      </div>

      {!birth || !cards || !bj ? (
        <EmptyState
          icon={Cake}
          color="#8B5CF6"
          title="تاریخ تولدت را انتخاب کن"
          description="با انتخاب روز تولد، سن دقیق شمسی، برج، روز هفته تولد، نماد سال و شمارش معکوس تولد بعدی را می‌بینی."
        />
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard
            icon={CalendarDays}
            color="#0EA5E9"
            label="روز هفته تولد"
            value={cards.wd}
            hint={`${faNum(bj.jd)} ${JALALI_MONTHS[bj.jm - 1]}`}
          />
          <InfoCard
            icon={Cake}
            color="#F43F5E"
            label="سن دقیق"
            value={`${faNum(cards.age.years)} سال، ${faNum(cards.age.months)} ماه، ${faNum(cards.age.days)} روز`}
          />
          <InfoCard
            icon={Star}
            color={cards.mf.color}
            label="برج تولد"
            value={`${cards.mf.sign} ${cards.mf.symbol}`}
            hint={`متولدین ${JALALI_MONTHS[bj.jm - 1]} ${cards.mf.emoji}`}
          />
          <InfoCard
            icon={Sparkles}
            color="#F59E0B"
            label="نماد سال تولد (چینی)"
            value={`${cards.zodiac.animal} ${cards.zodiac.emoji}`}
          />
          <InfoCard
            icon={Hourglass}
            color="#14B8A6"
            label="روزهای زندگی‌شده"
            value={`${faNum(cards.lived)} روز`}
          />
          <InfoCard
            icon={Gift}
            color="#8B5CF6"
            label="تولد بعدی"
            value={
              cards.toBd === 0
                ? "تولدت مبارکست! 🎂"
                : `${faNum(cards.toBd)} روز مانده`
            }
            hint={`${faNum(bj.jd)} ${JALALI_MONTHS[bj.jm - 1]} هر سال`}
          />
        </div>
      )}
    </div>
  );
}
