"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  ListTodo,
  CalendarClock,
  Clock,
  Flame,
  PartyPopper,
  Check,
  CalendarDays,
  CalendarHeart,
  Target,
  ChevronLeft,
  Sun,
  Sunrise,
  Sunset,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing, StatCard, Chip } from "./shared";
import { useNow } from "@/hooks/use-clock";
import { useTasks, useHabits, useEvents, useGoals, useTaskMutations, useHabitMutations } from "@/hooks/use-planner";
import type { TabKey } from "./app-shell";
import {
  faNum,
  formatClockFa,
  formatJalaliFull,
  toJalali,
  timeGreeting,
  QUOTES_FA,
  dayKey,
  sameDay,
  relativeDaysFa,
  formatJalaliShort,
  nextOccurrenceDate,
} from "@/lib/date";
import { PRIORITIES, CATEGORIES, habitIcon } from "@/lib/constants";
import type { Task } from "@/lib/constants";
import { cn } from "@/lib/utils";

function GreetingIcon({ hour }: { hour: number }) {
  const cls = "h-4 w-4";
  if (hour >= 5 && hour < 12) return <Sunrise className={cls} />;
  if (hour >= 12 && hour < 15) return <Sun className={cls} />;
  if (hour >= 15 && hour < 19) return <Sunset className={cls} />;
  return <Moon className={cls} />;
}

export default function Dashboard({ onNavigate }: { onNavigate: (tab: TabKey) => void }) {
  const { data: tasks = [], isLoading: tl } = useTasks();
  const { data: habits = [] } = useHabits();
  const { data: events = [] } = useEvents();
  const { data: goals = [] } = useGoals();
  const { update: updateTask } = useTaskMutations();
  const { toggle: toggleHabit } = useHabitMutations();

  const liveNow = useNow();
  const now = new Date();
  const todayKey = dayKey(now);

  // کارهای امروز یا عقب‌افتاده
  const todayTasks = tasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) <= new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  );
  const overdueTasks = todayTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const todayDone = todayTasks.filter((t) => t.completed).length;
  const todayProgress = todayTasks.length ? Math.round((todayDone / todayTasks.length) * 100) : 0;

  // عادت‌های امروز
  const habitsTodayDone = habits.filter((h) => h.logs.some((l) => l.date === todayKey)).length;

  // رویدادهای امروز و پیش‌رو
  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .slice(0, 4);

  // رویدادهای نزدیک — با درنظرگرفتن تکرار سالانه شمسی (تولد/سالگرد)
  const upcomingOccasions = events
    .map((e) => ({ e, occurrence: nextOccurrenceDate(new Date(e.date), e.yearly, now) }))
    .filter(({ occurrence }) => occurrence >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    .sort((a, b) => +a.occurrence - +b.occurrence)
    .slice(0, 3);

  const activeGoals = goals.filter((g) => g.current < g.target).slice(0, 3);

  const quote = QUOTES_FA[(toJalali(now).jy * 366 + toJalali(now).jd) % QUOTES_FA.length];

  return (
    <div className="space-y-5">
      {/* ─── کارت خوش‌آمد ─── */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-orange-500 via-orange-400 to-pink-500 p-6 sm:p-8 text-white shadow-xl shadow-orange-500/25"
      >
        <div aria-hidden className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div aria-hidden className="absolute -bottom-14 right-1/4 h-44 w-44 rounded-full bg-pink-300/25 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-orange-100">
              <GreetingIcon hour={now.getHours()} />
              <span className="text-xs sm:text-sm font-semibold">{timeGreeting(now.getHours())}</span>
              {/* ساعت زنده — چیپ شیشه‌ای */}
              <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1.5 text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span className="tabular-nums">{liveNow ? formatClockFa(liveNow, true) : "۰۰:۰۰:۰۰"}</span>
              </div>
            </div>
            <h2 className="mt-1 text-xl sm:text-3xl font-black leading-snug">
              امروز رو برنامه‌ریزی کن!
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-orange-50/90 font-medium">
              {formatJalaliFull(now)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => onNavigate("tasks")}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3.5 py-1.5 text-xs font-bold hover:bg-white/30 transition-colors cursor-pointer"
              >
                <ListTodo className="h-3.5 w-3.5" />
                {todayTasks.length ? `${faNum(todayTasks.length)} کار برای امروز` : "کار جدید بساز"}
              </button>
              <button
                onClick={() => onNavigate("calendar")}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3.5 py-1.5 text-xs font-bold hover:bg-white/30 transition-colors cursor-pointer"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                تقویم
              </button>
            </div>
          </div>
          <div className="hidden sm:block shrink-0">
            <ProgressRing value={todayProgress} size={110} stroke={10} color="#FFFFFF" track="rgba(255,255,255,0.25)">
              <div className="text-center">
                <p className="text-2xl font-black">{faNum(todayProgress)}٪</p>
                <p className="text-[10px] text-white/80">امروز</p>
              </div>
            </ProgressRing>
          </div>
        </div>
      </motion.section>

      {/* ─── کارت‌های آمار ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="کارهای امروز"
          value={faNum(todayTasks.length)}
          hint={todayDone ? `${faNum(todayDone)} تا انجام شد` : undefined}
          icon={ListTodo}
          color="#14B8A6"
          onClick={() => onNavigate("tasks")}
        />
        <StatCard
          label="عقب‌افتاده"
          value={faNum(overdueTasks.length)}
          hint={overdueTasks.length ? "از دستش نده!" : undefined}
          icon={CalendarClock}
          color="#EF4444"
          onClick={() => onNavigate("tasks")}
        />
        <StatCard
          label="عادت‌های امروز"
          value={`${faNum(habitsTodayDone)}/${faNum(habits.length)}`}
          hint={habitsTodayDone === habits.length && habits.length > 0 ? "عالی بود!" : undefined}
          icon={Flame}
          color="#EC4899"
          onClick={() => onNavigate("habits")}
        />
        <StatCard
          label="رویدادهای پیش‌رو"
          value={faNum(upcomingEvents.length)}
          icon={PartyPopper}
          color="#8B5CF6"
          onClick={() => onNavigate("calendar")}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ─── کارهای امروز ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="lg:col-span-3 rounded-3xl bg-card p-5 card-glow"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-extrabold text-[15px]">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                <ListTodo className="h-4 w-4" />
              </span>
              کارهای امروز
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("tasks")} className="gap-1 text-teal-600 hover:text-teal-700 hover:bg-teal-50 h-8">
              همه
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {tl ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-accent/60" />
              ))}
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Image
                src="/hero-planner.png"
                alt="برنامه‌ریزی روز"
                width={150}
                height={150}
                className="rounded-2xl"
                priority
              />
              <p className="font-bold text-sm">همه کارهای امروز تموم شد!</p>
              <p className="text-xs text-muted-foreground">وقتشه یه کار جدید اضافه کنی یا استراحت کنی</p>
              <Button
                size="sm"
                onClick={() => onNavigate("tasks")}
                className="rounded-full bg-gradient-to-l from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-md"
              >
                افزودن کار جدید
              </Button>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[380px] overflow-y-auto pl-1">
              {todayTasks.map((task) => (
                <TodayTaskRow key={task.id} task={task} onToggle={() => updateTask.mutate({ id: task.id, completed: !task.completed })} />
              ))}
            </ul>
          )}
        </motion.section>

        {/* ─── ستون کنار: عادت‌ها + رویدادها + اهداف ─── */}
        <div className="lg:col-span-2 space-y-5">
          {/* عادت‌های امروز */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-3xl bg-card p-5 card-glow"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-extrabold text-[15px]">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                  <Flame className="h-4 w-4" />
                </span>
                عادت‌های امروز
              </h3>
              <Chip className="bg-pink-50 text-pink-600">
                {faNum(habitsTodayDone)}/{faNum(habits.length)}
              </Chip>
            </div>
            {habits.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                هنوز عادتی نساخته‌ای — از بخش عادت‌ها شروع کن!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {habits.slice(0, 6).map((h) => {
                  const done = h.logs.some((l) => l.date === todayKey);
                  const Icon = habitIcon(h.icon);
                  return (
                    <button
                      key={h.id}
                      onClick={() => toggleHabit.mutate({ id: h.id, date: todayKey })}
                      title={h.title}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95",
                        done ? "border-transparent text-white shadow-sm" : "bg-background text-foreground/70 border-border hover:border-foreground/20"
                      )}
                      style={done ? { backgroundColor: h.color } : undefined}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="max-w-[72px] truncate">{h.title}</span>
                      {done && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.section>

          {/* رویدادهای پیش‌رو */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-3xl bg-card p-5 card-glow"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-extrabold text-[15px]">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <PartyPopper className="h-4 w-4" />
                </span>
                رویدادهای پیش‌رو
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("calendar")} className="h-8 text-xs text-purple-600 hover:bg-purple-50 hover:text-purple-700">
                تقویم
              </Button>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">رویدادی در پیش نیست</p>
            ) : (
              <ul className="space-y-2.5">
                {upcomingEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-2.5">
                    <span className="h-8 w-1.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">{e.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatJalaliShort(new Date(e.date))}
                        {e.time ? ` — ساعت ${faNum(e.time)}` : ""}
                      </p>
                    </div>
                    <Chip className="bg-purple-50 text-purple-600 shrink-0">
                      {relativeDaysFa(new Date(e.date))}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>

          {/* رویدادهای نزدیک */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="rounded-3xl bg-card p-5 card-glow min-w-0"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-extrabold text-[15px]">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <CalendarHeart className="h-4 w-4" />
                </span>
                رویدادهای نزدیک
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("events")} className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                همه
              </Button>
            </div>
            {upcomingOccasions.length === 0 ? (
              <button
                onClick={() => onNavigate("events")}
                className="w-full cursor-pointer py-3 text-center text-xs text-muted-foreground transition-colors hover:text-rose-600"
              >
                رویداد مهمی ثبت نشده
              </button>
            ) : (
              <ul className="space-y-2.5">
                {upcomingOccasions.map(({ e, occurrence }) => (
                  <li key={e.id} className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: e.color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">{e.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatJalaliShort(occurrence)}
                        {e.yearly ? " — هر سال" : ""}
                      </p>
                    </div>
                    <Chip className="shrink-0 bg-rose-50 text-rose-600">
                      {relativeDaysFa(occurrence, now)}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>

          {/* اهداف فعال */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl bg-card p-5 card-glow"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-extrabold text-[15px]">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Target className="h-4 w-4" />
                </span>
                اهداف فعال
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("goals")} className="h-8 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                همه
              </Button>
            </div>
            {activeGoals.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">هدفی تعریف نکردی هنوز</p>
            ) : (
              <ul className="space-y-3">
                {activeGoals.map((g) => {
                  const pct = Math.min(100, Math.round((g.current / Math.max(1, g.target)) * 100));
                  return (
                    <li key={g.id}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-bold truncate max-w-[60%]">{g.title}</span>
                        <span className="tabular-nums text-muted-foreground">{faNum(pct)}٪</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: g.color }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.section>
        </div>
      </div>

      {/* ─── نقل‌قول روز ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28 }}
        className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 px-5 py-4 text-center"
      >
        <p className="text-sm font-bold text-orange-800">«{quote}»</p>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  ردیف کار امروز
// ─────────────────────────────────────────────
function TodayTaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const priority = PRIORITIES[task.priority];
  const category = CATEGORIES[task.category];
  const CatIcon = category.icon;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  return (
    <motion.li layout className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-3 py-2.5 hover:border-foreground/15 transition-colors">
      <button
        onClick={onToggle}
        aria-label={task.completed ? "ناتمام کردن" : "انجام شدن"}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all cursor-pointer active:scale-90",
          task.completed ? "border-transparent bg-teal-500 text-white" : "border-teal-300 hover:border-teal-500"
        )}
      >
        {task.completed && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[13px] font-bold", task.completed && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Chip className={cn(category.bg, category.color)}>
            <CatIcon className="h-3 w-3" />
            {category.label}
          </Chip>
          <Chip className={cn(priority.bg, priority.color)}>{priority.label}</Chip>
          {task.dueDate && (
            <Chip className={cn(isOverdue ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground")}>
              {relativeDaysFa(new Date(task.dueDate))}
            </Chip>
          )}
        </div>
      </div>
    </motion.li>
  );
}
