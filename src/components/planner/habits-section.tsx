"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Repeat,
  Plus,
  Flame,
  Pencil,
  MoreHorizontal,
  Check,
  CalendarRange,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { useHabits, useHabitMutations } from "@/hooks/use-planner";
import {
  HABIT_ICONS,
  habitIcon,
  CHEERFUL_COLORS,
  type Habit,
} from "@/lib/constants";
import { faNum, dayKey, WEEKDAYS_SHORT, persianWeekday, toJalali } from "@/lib/date";
import { cn } from "@/lib/utils";

/** محاسبه استریک (روزهای پشت‌سرهم) */
function streakOf(habit: Habit): number {
  const set = new Set(habit.logs.map((l) => l.date));
  let streak = 0;
  const d = new Date();
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1); // today not done yet → start from yesterday
  while (set.has(dayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** روزهای هفته جاری ایران (شنبه → جمعه) */
function currentWeekDays(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  const sat = new Date(today.getFullYear(), today.getMonth(), today.getDate() - persianWeekday(today));
  for (let i = 0; i < 7; i++) {
    days.push(new Date(sat.getFullYear(), sat.getMonth(), sat.getDate() + i));
  }
  return days;
}

export default function HabitsSection() {
  const { data: habits = [], isLoading } = useHabits();
  const { create, update, remove, toggle } = useHabitMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const todayKeyStr = dayKey(new Date());
  const weekDays = currentWeekDays();

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(h: Habit) {
    setEditing(h);
    setDialogOpen(true);
  }

  const totalDoneToday = habits.filter((h) => h.logs.some((l) => l.date === todayKeyStr)).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, streakOf(h)), 0);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="عادت‌ها"
        subtitle="عادت‌های خوبت رو هر روز تیک بزن و زنجیره بساز"
        icon={Repeat}
        color="#EC4899"
        action={
          <Button
            onClick={openNew}
            className="rounded-full bg-gradient-to-l from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/30 gap-1.5"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            عادت جدید
          </Button>
        }
      />

      {/* خلاصه */}
      {habits.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 card-glow flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300">
              <Check className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xl font-black">{faNum(totalDoneToday)}<span className="text-sm text-muted-foreground">/{faNum(habits.length)}</span></p>
              <p className="text-xs text-muted-foreground">انجام‌شده امروز</p>
            </div>
          </div>
          <div className="rounded-2xl bg-card p-4 card-glow flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">
              <Flame className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xl font-black">{faNum(bestStreak)} روز</p>
              <p className="text-xs text-muted-foreground">بهترین زنجیره فعلی</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <SectionSkeleton count={3} />
      ) : habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          color="#EC4899"
          title="هنوز عادتی نساخته‌ای!"
          description="عادت‌های کوچک، تغییرات بزرگ می‌سازن. اولین عادتت رو بساز: مثلاً «۸ لیوان آب» یا «۱۵ دقیقه مطالعه»."
          action={
            <Button
              size="sm"
              onClick={openNew}
              className="rounded-full bg-gradient-to-l from-pink-500 to-rose-500 text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
              ساخت اولین عادت
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {habits.map((habit) => {
              const Icon = habitIcon(habit.icon);
              const loggedDays = new Set(habit.logs.map((l) => l.date));
              const streak = streakOf(habit);
              const doneToday = loggedDays.has(todayKeyStr);
              const weekDone = weekDays.filter((d) => dayKey(d) <= todayKeyStr && loggedDays.has(dayKey(d))).length;
              const weekPct = Math.min(100, Math.round((weekDone / Math.max(1, habit.targetPerWeek)) * 100));

              return (
                <motion.li
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="rounded-3xl bg-card p-3 sm:p-5 card-glow"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                      style={{ backgroundColor: habit.color, boxShadow: `0 6px 16px -4px ${habit.color}55` }}
                    >
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-extrabold">{habit.title}</p>
                        {streak > 0 && (
                          <Chip className="bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300 shrink-0">
                            <Flame className="h-3 w-3" />
                            {faNum(streak)} روز
                          </Chip>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground flex items-center gap-1">
                        <CalendarRange className="h-3 w-3" />
                        هدف: {faNum(habit.targetPerWeek)} روز در هفته — این هفته {faNum(weekDone)} روز
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(habit)} className="cursor-pointer gap-2">
                          <Pencil className="h-3.5 w-3.5" />
                          ویرایش
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DeleteConfirm
                      onConfirm={() =>
                        remove.mutate(habit.id, {
                          onSuccess: () => toast.success("عادت حذف شد"),
                          onError: (e) => toast.error(e.message),
                        })
                      }
                      title={`«${habit.title}» حذف شود؟`}
                    />
                  </div>

                  {/* شبکه هفتگی */}
                  <div className="mt-4 flex items-center justify-between gap-0.5 sm:gap-1">
                    {weekDays.map((d) => {
                      const k = dayKey(d);
                      const isToday = k === todayKeyStr;
                      const isFuture = k > todayKeyStr; // روزهای بعد از امروز قابل تیک نیستند
                      const done = loggedDays.has(k);
                      const wd = WEEKDAYS_SHORT[persianWeekday(d)];
                      return (
                        <button
                          key={k}
                          disabled={isFuture}
                          onClick={() =>
                            toggle.mutate(
                              { id: habit.id, date: k },
                              { onError: (e) => toast.error(e.message) }
                            )
                          }
                          aria-label={isFuture ? `${wd} — روز آینده` : `${wd} ${done ? "انجام شده" : "انجام نشده"}`}
                          className={cn(
                            "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-all",
                            isFuture ? "cursor-default opacity-40" : "cursor-pointer active:scale-90",
                            isToday && "bg-accent"
                          )}
                        >
                          <span className={cn("text-[10px] font-bold", done ? "text-foreground" : "text-muted-foreground")}>
                            {wd}
                          </span>
                          <motion.span
                            whileTap={{ scale: 0.8 }}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full border-2 text-white transition-colors sm:h-8 sm:w-8",
                              done ? "border-transparent shadow-sm" : "border-border bg-background",
                              isToday && !done && "border-dashed"
                            )}
                            style={done ? { backgroundColor: habit.color } : undefined}
                          >
                            {done && <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} />}
                          </motion.span>
                          {/* عدد روز شمسی برای وضوح بیشتر */}
                          <span className="text-[9px] font-bold text-muted-foreground/80 tabular-nums">
                            {faNum(toJalali(d).jd)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* نوار پیشرفت هفته */}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${weekPct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* ─── دیالوگ عادت ─── */}
      <HabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(values) => {
          if (editing) {
            update.mutate(
              { id: editing.id, ...values },
              {
                onSuccess: () => {
                  toast.success("عادت ویرایش شد");
                  setDialogOpen(false);
                },
                onError: (e) => toast.error(e.message),
              }
            );
          } else {
            create.mutate(values, {
              onSuccess: () => {
                toast.success("عادت جدید ساخته شد!");
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
//  دیالوگ عادت
// ─────────────────────────────────────────────
function HabitDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Habit | null;
  onSubmit: (values: { title: string; icon: string; color: string; targetPerWeek: number }) => void;
}) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("Sparkles");
  const [color, setColor] = useState(CHEERFUL_COLORS[0]);
  const [target, setTarget] = useState(7);
  const [wasOpen, setWasOpen] = useState(false);

  if (open && !wasOpen) {
    setWasOpen(true);
    setTitle(editing?.title ?? "");
    setIcon(editing?.icon ?? "Sparkles");
    setColor(editing?.color ?? CHEERFUL_COLORS[0]);
    setTarget(editing?.targetPerWeek ?? 7);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md rounded-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300">
              <Repeat className="h-4 w-4" />
            </span>
            {editing ? "ویرایش عادت" : "عادت جدید"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            const t = title.trim();
            if (!t) return;
            onSubmit({ title: t, icon, color, targetPerWeek: target });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="habit-title">نام عادت</Label>
            <Input
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: ۱۵ دقیقه مطالعه"
              autoFocus
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>آیکون</Label>
            <div className="grid grid-cols-6 gap-2">
              {HABIT_ICONS.map(({ name, icon: I }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  aria-label={name}
                  className={cn(
                    "flex h-10 w-full items-center justify-center rounded-xl border-2 transition-all cursor-pointer",
                    icon === name
                      ? "border-pink-400 bg-pink-50 text-pink-600 scale-105 dark:bg-pink-500/15 dark:text-pink-300"
                      : "border-border text-muted-foreground hover:border-pink-200 hover:text-pink-500 dark:hover:border-pink-500/40"
                  )}
                >
                  <I className="h-4.5 w-4.5" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>رنگ</Label>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>هدف هفتگی</Label>
              <span className="text-xs font-bold text-pink-600 dark:text-pink-300">{faNum(target)} روز در هفته</span>
            </div>
            <Slider
              value={[target]}
              onValueChange={(v) => setTarget(v[0])}
              min={1}
              max={7}
              step={1}
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-l from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold shadow-lg shadow-pink-500/25"
          >
            {editing ? "ذخیره تغییرات" : "ساخت عادت"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
