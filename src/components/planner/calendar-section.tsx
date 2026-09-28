"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Plus,
  Clock,
  Sparkles,
  Pencil,
  ListTodo,
  CalendarHeart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useEvents, useTasks, useEventMutations } from "@/hooks/use-planner";
import {
  JALALI_MONTHS,
  WEEKDAYS_SHORT,
  faNum,
  toJalali,
  fromJalali,
  jalaliMonthLength,
  persianWeekday,
  dayKey,
  sameDay,
  formatJalaliFull,
  formatJalaliShort,
  relativeDaysFa,
} from "@/lib/date";
import {
  getIranianHoliday,
  getHolidaysInRange,
  upcomingIranianHolidays,
} from "@/lib/iran-holidays";
import { CHEERFUL_COLORS, type PlannerEvent } from "@/lib/constants";
import { cn } from "@/lib/utils";
import JalaliDatePicker from "./jalali-date-picker";

export default function CalendarSection() {
  const { data: events = [], isLoading } = useEvents();
  const { data: tasks = [] } = useTasks();
  const { create, update, remove } = useEventMutations();

  const today = new Date();
  const tj = toJalali(today);
  const [view, setView] = useState({ jy: tj.jy, jm: tj.jm });
  const [selected, setSelected] = useState<Date>(today);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlannerEvent | null>(null);

  // شبکه ماه
  const grid = useMemo(() => {
    const first = fromJalali(view.jy, view.jm, 1);
    const pad = persianWeekday(first);
    const len = jalaliMonthLength(view.jy, view.jm);
    const cells: (Date | null)[] = Array.from({ length: pad }, () => null);
    for (let d = 1; d <= len; d++) cells.push(fromJalali(view.jy, view.jm, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [view]);

  // تعطیلات رسمی ماه جاریِ نما (کلید = dayKey میلادی)
  const monthHolidays = useMemo(
    () =>
      getHolidaysInRange(
        fromJalali(view.jy, view.jm, 1),
        fromJalali(view.jy, view.jm, jalaliMonthLength(view.jy, view.jm))
      ),
    [view]
  );

  // تعطیلات رسمی پیش‌رو برای پنل کناری
  const upcoming = useMemo(() => upcomingIranianHolidays(new Date(), 4), []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, PlannerEvent[]>();
    const push = (k: string, e: PlannerEvent) => {
      if (!map.has(k)) map.set(k, []);
      const arr = map.get(k)!;
      // جلوگیری از درج تکراری یک رویداد روی یک روز (تاریخ ذخیره‌شده + تکرار سالانه)
      if (!arr.some((x) => x.id === e.id)) arr.push(e);
    };
    // ۱) تاریخ‌های ذخیره‌شده
    for (const e of events) {
      push(dayKey(new Date(e.date)), e);
    }
    // ۲) تکرار سالانه: نگاشت به همان روزِ شمسی در ماهِ نمای جاری
    for (const e of events) {
      if (!e.yearly) continue;
      const { jm, jd } = toJalali(new Date(e.date));
      if (jm !== view.jm) continue;
      // اگر روز در این سال وجود نداشت (مثل ۳۰ اسفند در سال غیرکبیسه) به آخرین روز ماه محدود می‌شود
      const day = Math.min(jd, jalaliMonthLength(view.jy, jm));
      push(dayKey(fromJalali(view.jy, jm, day)), e);
    }
    return map;
  }, [events, view]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const k = dayKey(new Date(t.dueDate));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return map;
  }, [tasks]);

  function shiftMonth(dir: 1 | -1) {
    setView((v) => {
      let jm = v.jm + dir;
      let jy = v.jy;
      if (jm > 12) { jm = 1; jy++; }
      if (jm < 1) { jm = 12; jy--; }
      return { jy, jm };
    });
  }

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(e: PlannerEvent) {
    setEditing(e);
    setDialogOpen(true);
  }

  const selectedEvents = eventsByDay.get(dayKey(selected)) ?? [];
  const selectedTasks = tasksByDay.get(dayKey(selected)) ?? [];
  const selectedHoliday = getIranianHoliday(selected);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="تقویم"
        subtitle="رویدادها و سررسیدها را ماهانه ببین"
        icon={CalendarDays}
        color="#8B5CF6"
        action={
          <Button
            onClick={openNew}
            className="rounded-full bg-gradient-to-l from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white shadow-lg shadow-purple-500/30 gap-1.5"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            رویداد جدید
          </Button>
        }
      />

      {/* min-w-0: جلوگیری از سرریز افقی در موبایل — آیتم‌های گرید بدون آن کوچک نمی‌شوند */}
      <div className="grid gap-5 min-w-0 lg:grid-cols-3">
        {/* ─── شبکه ماه ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 min-w-0 rounded-3xl bg-card p-3 sm:p-6 card-glow"
        >
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)} aria-label="ماه قبل" className="rounded-xl hover:bg-purple-50 hover:text-purple-600">
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-black text-purple-700">
                {JALALI_MONTHS[view.jm - 1]} {faNum(view.jy)}
              </h3>
              <button
                onClick={() => {
                  setView({ jy: tj.jy, jm: tj.jm });
                  setSelected(today);
                }}
                className="text-[11px] font-bold text-muted-foreground hover:text-purple-600 cursor-pointer transition-colors"
              >
                برو به امروز
              </button>
            </div>
            <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)} aria-label="ماه بعد" className="rounded-xl hover:bg-purple-50 hover:text-purple-600">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS_SHORT.map((d, i) => (
              <div key={i} className="py-1.5 text-center text-[11px] font-bold text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((date, i) => {
              if (!date) return <div key={i} className="aspect-square" />;
              const isToday = sameDay(date, today);
              const isSelected = sameDay(date, selected);
              const dayEvents = eventsByDay.get(dayKey(date)) ?? [];
              const dayTasksDue = tasksByDay.get(dayKey(date)) ?? [];
              const isPast = date < today && !isToday;
              const holiday = monthHolidays.get(dayKey(date));
              const isFriday = persianWeekday(date) === 6;
              // روز تعطیل (رسمی یا جمعه) — استایل امروز/انتخاب‌شده دست‌نخورده می‌ماند
              const isRedDay = !isSelected && !isToday && (!!holiday || isFriday);

              return (
                <button
                  key={i}
                  onClick={() => setSelected(date)}
                  title={
                    holiday
                      ? `${holiday.title}${holiday.hijri ? ` — ${holiday.hijri}` : ""}`
                      : undefined
                  }
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-xl text-[13px] sm:text-sm font-bold transition-all cursor-pointer",
                    isSelected && "bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-[1.04]",
                    !isSelected && isToday && "bg-orange-100 text-orange-600 ring-2 ring-orange-400",
                    !isSelected && !isToday && "hover:bg-accent",
                    isPast && !isSelected && "text-muted-foreground/50"
                  )}
                >
                  <span className={cn(isRedDay && "text-red-500")}>
                    {faNum(toJalali(date).jd)}
                  </span>
                  {/* نقطه قرمز تعطیلی رسمی (غیرجمعه) — بالای خانه، جدا از نقطه‌های پایین */}
                  {holiday && !isFriday && !isSelected && (
                    <span
                      className="absolute top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-red-400"
                      aria-hidden
                    />
                  )}
                  <span className="absolute bottom-1 flex gap-0.5" dir="ltr">
                    {dayEvents.slice(0, 2).map((e) => (
                      <span
                        key={e.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: isSelected ? "#fff" : e.color }}
                      />
                    ))}
                    {dayTasksDue.length > 0 && dayEvents.length < 2 && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: isSelected ? "#fff" : "#14B8A6" }}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-dashed border-border pt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-400" /> امروز
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-teal-400" /> سررسید کار
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-400" /> رویداد
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" /> تعطیل رسمی
            </span>
          </div>
        </motion.section>

        {/* ─── پنل روز انتخابی ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="min-w-0 rounded-3xl bg-card p-4 sm:p-5 card-glow"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="min-w-0 truncate font-extrabold text-[15px]">{formatJalaliFull(selected)}</h3>
            <div className="flex shrink-0 items-center gap-1.5">
              {!selectedHoliday && persianWeekday(selected) === 6 && (
                <Chip className="bg-muted text-muted-foreground">جمعه</Chip>
              )}
              {sameDay(selected, today) && (
                <Chip className="bg-orange-100 text-orange-600">امروز</Chip>
              )}
            </div>
          </div>

          {selectedHoliday && (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-2.5 text-red-700">
              <p className="flex items-center gap-1.5 text-[13px] font-extrabold">
                <CalendarHeart className="h-4 w-4 shrink-0" />
                {selectedHoliday.title}
              </p>
              {selectedHoliday.hijri && (
                <p className="mt-0.5 text-[11px] font-bold text-red-500/90">
                  {selectedHoliday.hijri}
                </p>
              )}
            </div>
          )}

          {isLoading ? (
            <SectionSkeleton count={2} />
          ) : selectedEvents.length === 0 && selectedTasks.length === 0 ? (
            <div className="py-4">
              <EmptyState
                icon={Sparkles}
                color="#8B5CF6"
                title="این روز آزاده!"
                description="یه رویداد اضافه کن یا از روز استراحت لذت ببر."
                action={
                  <Button size="sm" onClick={openNew} className="rounded-full bg-purple-500 hover:bg-purple-600 text-white">
                    <Plus className="h-4 w-4" />
                    رویداد جدید
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="max-h-[420px] space-y-4 overflow-y-auto pl-1">
              {selectedEvents.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold text-muted-foreground">رویدادها</p>
                  <ul className="space-y-2">
                    <AnimatePresence initial={false}>
                      {selectedEvents.map((e) => (
                        <motion.li
                          key={e.id}
                          layout
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="group flex items-center gap-2.5 rounded-2xl bg-background/70 border border-border/60 p-2.5"
                        >
                          <span className="h-9 w-1.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold">{e.title}</p>
                            {e.time && (
                              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                ساعت {faNum(e.time)}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(e)} className="cursor-pointer">
                                ویرایش رویداد
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
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              )}

              {selectedTasks.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold text-muted-foreground">کارهای با سررسید این روز</p>
                  <ul className="space-y-2">
                    {selectedTasks.map((t) => (
                      <li key={t.id} className="flex items-center gap-2 rounded-2xl bg-teal-50/70 border border-teal-100 p-2.5">
                        <ListTodo className="h-4 w-4 shrink-0 text-teal-600" />
                        <span className={cn("truncate text-[13px] font-bold", t.completed && "line-through text-muted-foreground")}>
                          {t.title}
                        </span>
                        {t.completed && (
                          <Chip className="ms-auto bg-teal-100 text-teal-600 shrink-0">انجام شد</Chip>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* تعطیلات رسمی پیش‌رو — خارج از بلوک‌های شرطی، همیشه نمایش داده می‌شود */}
          <div className="mt-4 border-t border-dashed border-border pt-3">
            <p className="mb-2.5 flex items-center gap-1.5 text-[12px] font-extrabold text-red-600">
              <CalendarHeart className="h-3.5 w-3.5" />
              تعطیلات پیش‌رو
            </p>
            <ul className="space-y-1.5">
              {upcoming.map(({ date, holiday }) => (
                <li
                  key={`${dayKey(date)}-${holiday.title}`}
                  className="flex items-center gap-2 rounded-xl bg-red-50/60 px-2.5 py-2"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                    {holiday.title}
                  </span>
                  <span className="shrink-0 text-[11px] font-bold text-muted-foreground">
                    {formatJalaliShort(date)}
                  </span>
                  <Chip className="shrink-0 bg-red-100 text-red-600">
                    {relativeDaysFa(date)}
                  </Chip>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>
      </div>

      {/* ─── دیالوگ رویداد ─── */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={(v) => setDialogOpen(v)}
        editing={editing}
        defaultDate={selected}
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
                toast.success("رویداد اضافه شد!");
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
//  دیالوگ رویداد
// ─────────────────────────────────────────────
function EventDialog({
  open,
  onOpenChange,
  editing,
  defaultDate,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: PlannerEvent | null;
  defaultDate: Date;
  onSubmit: (values: { title: string; date: string; time?: string | null; color: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [color, setColor] = useState(CHEERFUL_COLORS[3]);
  const [wasOpen, setWasOpen] = useState(false);

  if (open && !wasOpen) {
    setWasOpen(true);
    setTitle(editing?.title ?? "");
    setDate(dayKey(editing ? new Date(editing.date) : defaultDate));
    setTime(editing?.time ?? "");
    setColor(editing?.color ?? CHEERFUL_COLORS[3]);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md rounded-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <CalendarDays className="h-4 w-4" />
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
            onSubmit({
              title: t,
              date: new Date(`${date}T12:00:00`).toISOString(),
              time: time || null,
              color,
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="event-title">عنوان رویداد</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: جلسه با تیم پروژه"
              autoFocus
              required
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-date">تاریخ</Label>
              <JalaliDatePicker
                id="event-date"
                value={date || null}
                onChange={(k) => setDate(k ?? "")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-time">ساعت (اختیاری)</Label>
              <Input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
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
            className="w-full rounded-xl bg-gradient-to-l from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-bold shadow-lg shadow-purple-500/25"
          >
            {editing ? "ذخیره تغییرات" : "افزودن رویداد"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
