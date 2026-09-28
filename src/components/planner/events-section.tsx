"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarHeart,
  Plus,
  Cake,
  Pencil,
  Repeat,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { SectionHeader, EmptyState, DeleteConfirm, Chip, SectionSkeleton } from "./shared";
import { useEvents, useEventMutations } from "@/hooks/use-planner";
import {
  faNum,
  dayKey,
  formatJalaliMedium,
  nextOccurrenceDate,
  jalaliAge,
} from "@/lib/date";
import {
  EVENT_TYPES,
  EVENT_TYPE_LIST,
  CHEERFUL_COLORS,
  type PlannerEvent,
  type EventType,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import JalaliDatePicker from "./jalali-date-picker";

// ─────────────────────────────────────────────
//  کمکی‌های محلی
// ─────────────────────────────────────────────

/** فاصله روز بین دو تاریخ (فقط بر اساس روز، بدون ساعت) */
function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** تبدیل ارقام فارسی/عربی به لاتین برای پارس عدد سال تولد */
function faToEn(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** برچسب و رنگ چیپ شمارش معکوس رویداد */
function countdownOf(daysLeft: number): { label: string; cls: string } {
  if (daysLeft === 0) return { label: "امروز", cls: "bg-green-100 text-emerald-600" };
  if (daysLeft > 0) return { label: `${faNum(daysLeft)} روز مانده`, cls: "bg-orange-100 text-orange-600" };
  return { label: "گذشته", cls: "bg-muted text-muted-foreground" };
}

// ─────────────────────────────────────────────
//  بخش رویدادهای ویژه (تولد، سالگرد، قرار ملاقات ...)
// ─────────────────────────────────────────────
export default function EventsSection() {
  const { data: events = [], isLoading } = useEvents();
  const { create, update, remove } = useEventMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlannerEvent | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "birthdays">("all");

  // غنی‌سازی رویدادها با تاریخ رخداد بعدی + مرتب‌سازی (گذشته‌های یک‌باره در انتها)
  const enriched = useMemo(() => {
    const today = new Date();
    return events
      .map((e) => {
        const occurrence = nextOccurrenceDate(new Date(e.date), e.yearly, today);
        const daysLeft = daysBetween(today, occurrence);
        const isPastOneTime = !e.yearly && daysLeft < 0;
        return { event: e, occurrence, daysLeft, isPastOneTime };
      })
      .sort((a, b) => {
        if (a.isPastOneTime !== b.isPastOneTime) return a.isPastOneTime ? 1 : -1;
        return +a.occurrence - +b.occurrence;
      });
  }, [events]);

  // اعمال فیلتر فعال
  const filtered = enriched.filter(({ event, daysLeft }) => {
    if (filter === "birthdays") return event.type === "BIRTHDAY";
    if (filter === "upcoming") return daysLeft >= 0 && daysLeft <= 30;
    return true;
  });

  // خلاصه‌ها: نزدیک‌ترین رویداد آینده + تعداد تولدها
  const nearest = enriched.find((x) => x.daysLeft >= 0);
  const birthdayCount = events.filter((e) => e.type === "BIRTHDAY").length;

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(e: PlannerEvent) {
    setEditing(e);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="رویدادها"
        subtitle="تولدها، سالگردها و روزهای مهمت را فراموش نکن"
        icon={CalendarHeart}
        color="#F43F5E"
        action={
          <Button
            onClick={openNew}
            className="rounded-full bg-gradient-to-l from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-500/30 gap-1.5"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            رویداد جدید
          </Button>
        }
      />

      {/* خلاصه — فقط وقتی رویدادی وجود دارد */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 card-glow flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <CalendarHeart className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              {nearest ? (
                <>
                  <p className="truncate text-sm font-extrabold">{nearest.event.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    نزدیک‌ترین رویداد — {countdownOf(nearest.daysLeft).label}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-extrabold">—</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">نزدیک‌ترین رویداد</p>
                </>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-card p-4 card-glow flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
              <Cake className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black">{faNum(birthdayCount)}</p>
              <p className="text-xs text-muted-foreground">تولد ثبت شده</p>
            </div>
          </div>
        </div>
      )}

      {/* فیلترها */}
      {events.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: "all", label: "همه" },
              { key: "upcoming", label: "پیش‌رو" },
              { key: "birthdays", label: "تولدها" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
                filter === f.key
                  ? "bg-gradient-to-l from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <SectionSkeleton count={3} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Cake}
          color="#F43F5E"
          title="هنوز رویدادی ثبت نکرده‌ای!"
          description="تولد دوستان و عزیزانت، سالگردها و قرارهای مهمت رو ثبت کن تا هیچ‌وقت فراموش نشه."
          action={
            <Button
              size="sm"
              onClick={openNew}
              className="rounded-full bg-gradient-to-l from-rose-500 to-pink-500 text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
              ثبت اولین رویداد
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border/80 px-6 py-8 text-center bg-white/50 text-sm text-muted-foreground">
          رویدادی در این دسته پیدا نشد.
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map(({ event: e, occurrence, daysLeft, isPastOneTime }) => {
              const meta = EVENT_TYPES[e.type] ?? EVENT_TYPES.CUSTOM;
              const Icon = meta.icon;
              const countdown = countdownOf(daysLeft);
              return (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={cn("rounded-3xl bg-card p-4 sm:p-5 card-glow", isPastOneTime && "opacity-70")}
                >
                  <div className="flex items-center gap-3">
                    {/* آیکون نوع رویداد */}
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                        meta.bg
                      )}
                      style={{ color: meta.color }}
                    >
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </div>

                    {/* عنوان + بج‌ها */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{e.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {e.yearly && (
                          <Chip className="bg-rose-50 text-rose-600 shrink-0">
                            <Repeat className="h-3 w-3" />
                            هر سال
                          </Chip>
                        )}
                        {e.type === "BIRTHDAY" && e.yearly && typeof e.birthYear === "number" && (
                          <Chip className="bg-pink-100 text-pink-600 shrink-0">
                            <Cake className="h-3 w-3" />
                            {faNum(jalaliAge(e.birthYear))} ساله می‌شود
                          </Chip>
                        )}
                        {e.time && (
                          <Chip className="bg-muted text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" />
                            ساعت {faNum(e.time)}
                          </Chip>
                        )}
                        {isPastOneTime && (
                          <Chip className="bg-muted text-muted-foreground shrink-0">گذشته</Chip>
                        )}
                      </div>
                      {e.note && (
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">{e.note}</p>
                      )}
                    </div>

                    {/* تاریخ شمسی + شمارش معکوس */}
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="whitespace-nowrap text-[11px] font-bold text-muted-foreground">
                        {formatJalaliMedium(occurrence)}
                      </span>
                      <Chip className={cn(countdown.cls, "shrink-0")}>{countdown.label}</Chip>
                    </div>

                    {/* ویرایش / حذف */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(e)} className="cursor-pointer gap-2">
                          <Pencil className="h-3.5 w-3.5" />
                          ویرایش
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DeleteConfirm
                      onConfirm={() =>
                        remove.mutate(e.id, {
                          onSuccess: () => toast.success("رویداد حذف شد"),
                          onError: (err) => toast.error(err.message),
                        })
                      }
                      title={`«${e.title}» حذف شود؟`}
                    />
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* ─── دیالوگ رویداد ─── */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(values) => {
          if (editing) {
            update.mutate(
              { id: editing.id, ...values },
              {
                onSuccess: () => {
                  toast.success("رویداد ویرایش شد");
                  setDialogOpen(false);
                },
                onError: (e) => toast.error(e.message),
              }
            );
          } else {
            create.mutate(values, {
              onSuccess: () => {
                toast.success("رویداد جدید ثبت شد!");
                setDialogOpen(false);
              },
              onError: (e) => toast.error(e.message),
            });
          }
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  دیالوگ رویداد (الگوی مشابه دیالوگ تقویم)
// ─────────────────────────────────────────────
function EventDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: PlannerEvent | null;
  onSubmit: (values: {
    title: string;
    date: string;
    time: string | null;
    color: string;
    type: EventType;
    yearly: boolean;
    birthYear: number | null;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<EventType>("BIRTHDAY");
  const [yearly, setYearly] = useState(false);
  const [birthYearStr, setBirthYearStr] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [color, setColor] = useState(CHEERFUL_COLORS[4]);
  const [wasOpen, setWasOpen] = useState(false);

  // مقداردهی اولیه هنگام باز شدن دیالوگ (ترفند wasOpen)
  if (open && !wasOpen) {
    setWasOpen(true);
    setTitle(editing?.title ?? "");
    setDate(dayKey(editing ? new Date(editing.date) : new Date()));
    setType(editing?.type ?? "BIRTHDAY");
    setYearly(editing?.yearly ?? false);
    // نمایش سال تولد با ارقام فارسی (پارس در ارسال با faToEn انجام می‌شود)
    setBirthYearStr(typeof editing?.birthYear === "number" ? faNum(String(editing.birthYear)) : "");
    setTime(editing?.time ?? "");
    setNote(editing?.note ?? "");
    setColor(editing?.color ?? CHEERFUL_COLORS[4]);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md rounded-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <CalendarHeart className="h-4 w-4" />
            </span>
            {editing ? "ویرایش رویداد" : "رویداد جدید"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            const t = title.trim();
            if (!t || !date) return;
            // سال تولد فقط برای تولدهای سالانه — تبدیل ارقام فارسی به عدد
            const parsedYear = parseInt(faToEn(birthYearStr), 10);
            onSubmit({
              title: t,
              date: new Date(`${date}T12:00:00`).toISOString(),
              time: time || null,
              color,
              type,
              yearly,
              birthYear: type === "BIRTHDAY" && yearly && birthYearStr && !Number.isNaN(parsedYear) ? parsedYear : null,
            });
          }}
        >
          {/* نوع رویداد */}
          <div className="space-y-1.5">
            <Label>نوع رویداد</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {EVENT_TYPE_LIST.map((t) => {
                const meta = EVENT_TYPES[t];
                const Icon = meta.icon;
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-1 py-2 text-[10.5px] font-bold leading-tight transition-all cursor-pointer",
                      active
                        ? "border-rose-400 bg-rose-50 ring-2 ring-rose-200"
                        : "border-border text-muted-foreground hover:border-rose-200 hover:text-rose-500"
                    )}
                    style={active ? { color: meta.color } : undefined}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ color: active ? meta.color : undefined }} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* عنوان */}
          <div className="space-y-1.5">
            <Label htmlFor="special-event-title">عنوان رویداد</Label>
            <Input
              id="special-event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: تولد علی"
              required
              className="rounded-xl"
            />
          </div>

          {/* تاریخ و ساعت */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="special-event-date">تاریخ</Label>
              <JalaliDatePicker
                id="special-event-date"
                value={date || null}
                onChange={(k) => setDate(k ?? "")}
                clearable
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="special-event-time">ساعت (اختیاری)</Label>
              <Input
                id="special-event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* تکرار سالانه */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/50 px-3 py-2.5">
            <div className="min-w-0">
              <Label htmlFor="special-event-yearly" className="text-[13px] font-bold">
                هر سال تکرار شود (تولد، سالگرد)
              </Label>
              {yearly && (
                <p className="mt-0.5 text-[10.5px] font-bold text-rose-500">
                  روی همین روز شمسی هر سال
                </p>
              )}
            </div>
            <Switch
              id="special-event-yearly"
              checked={yearly}
              onCheckedChange={setYearly}
              className="shrink-0"
            />
          </div>

          {/* سال تولد شمسی — فقط برای تولدِ سالانه */}
          {type === "BIRTHDAY" && yearly && (
            <div className="space-y-1.5">
              <Label htmlFor="special-event-birthyear">سال تولد (شمسی)</Label>
              <Input
                id="special-event-birthyear"
                inputMode="numeric"
                value={birthYearStr}
                onChange={(e) => setBirthYearStr(e.target.value.replace(/[^\d۰-۹]/g, ""))}
                placeholder="مثلاً ۱۳۷۰"
                className="rounded-xl"
              />
            </div>
          )}

          {/* یادداشت اختیاری */}
          <div className="space-y-1.5">
            <Label htmlFor="special-event-note">یادداشت (اختیاری)</Label>
            <Input
              id="special-event-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثلاً: کادو یادت نره!"
              className="rounded-xl"
            />
          </div>

          {/* رنگ */}
          <div className="space-y-1.5">
            <Label>رنگ رویداد</Label>
            <div className="flex flex-wrap gap-2">
              {CHEERFUL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`رنگ ${c}`}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all cursor-pointer ring-offset-2",
                    color === c ? "ring-2 ring-foreground/60 scale-110" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-l from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25"
          >
            {editing ? "ذخیره تغییرات" : "افزودن رویداد"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
