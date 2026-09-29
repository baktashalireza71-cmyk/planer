"use client";

import { useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  Home,
  ListTodo,
  CalendarDays,
  CalendarHeart,
  Repeat,
  Target,
  StickyNote,
  BarChart3,
  CalendarCheck2,
  Clock,
  MoonStar,
  Settings,
} from "lucide-react";
import { formatJalaliFull, formatClockFa, faNum, toJalali, JALALI_MONTHS } from "@/lib/date";
import { useNow } from "@/hooks/use-clock";
import { cn } from "@/lib/utils";
import Dashboard from "./dashboard";
import FalSection from "./fal-section";
import SettingsDialog from "./settings-dialog";
import TasksSection from "./tasks-section";
import CalendarSection from "./calendar-section";
import EventsSection from "./events-section";
import HabitsSection from "./habits-section";
import GoalsSection from "./goals-section";
import NotesSection from "./notes-section";
import StatsSection from "./stats-section";

export type TabKey =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "events"
  | "fal"
  | "habits"
  | "goals"
  | "notes"
  | "stats";

export const NAV_ITEMS: {
  key: TabKey;
  label: string;
  /** برچسب کوتاه برای نویگیشن پایین موبایل */
  shortLabel?: string;
  icon: typeof Home;
  color: string;
}[] = [
  { key: "dashboard", label: "خانه", icon: Home, color: "#F97316" },
  { key: "tasks", label: "کارها", icon: ListTodo, color: "#14B8A6" },
  { key: "calendar", label: "تقویم", icon: CalendarDays, color: "#8B5CF6" },
  { key: "events", label: "رویدادها", shortLabel: "رویداد", icon: CalendarHeart, color: "#F43F5E" },
  { key: "fal", label: "فال و ابزار", shortLabel: "فال", icon: MoonStar, color: "#8B5CF6" },
  { key: "habits", label: "عادت‌ها", shortLabel: "عادت", icon: Repeat, color: "#EC4899" },
  { key: "goals", label: "اهداف", shortLabel: "اهداف", icon: Target, color: "#10B981" },
  { key: "notes", label: "یادداشت‌ها", shortLabel: "یادداشت", icon: StickyNote, color: "#F59E0B" },
  { key: "stats", label: "آمار", icon: BarChart3, color: "#E11D48" },
];

export default function AppShell() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // hydration-safe mounted flag
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const liveNow = useNow();

  const today = new Date();
  const { jd, jm, jy } = toJalali(today);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-clip">
      {/* پس‌زمینه تزئینی شاد */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl dark:bg-orange-500/10" />
        <div className="absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-pink-200/35 blur-3xl dark:bg-pink-500/10" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-500/10" />
        <div className="absolute top-2/3 right-2/3 h-64 w-64 rounded-full bg-purple-200/25 blur-3xl dark:bg-purple-500/10" />
      </div>

      <div className="flex flex-1 w-full max-w-[1400px] mx-auto">
        {/* ─── سایدبار دسکتاپ ─── */}
        <aside className="hidden lg:flex sticky top-0 h-screen w-[264px] shrink-0 flex-col gap-2 border-l border-border/70 bg-card/80 backdrop-blur-xl px-4 py-6">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 text-white shadow-lg shadow-orange-500/30">
              <CalendarCheck2 className="h-6 w-6" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-lg font-black text-gradient">پلنر من</h1>
              <p className="text-[11px] text-muted-foreground">برنامه‌ریز حرفه‌ای زندگی</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1" aria-label="ناوبری اصلی">
            {NAV_ITEMS.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-colors cursor-pointer",
                    active ? "text-white" : "text-foreground/75 hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-pill"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-l from-orange-500 to-pink-500 shadow-lg shadow-orange-500/30"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <item.icon
                    className={cn("relative h-5 w-5 shrink-0", !active && "drop-shadow")}
                    style={!active ? { color: item.color } : undefined}
                    strokeWidth={2.2}
                  />
                  <span className="relative">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* دکمه تنظیمات دسکتاپ */}
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="تنظیمات"
            className="mt-3 flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-foreground/75 transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <Settings className="h-5 w-5 shrink-0" strokeWidth={2.2} />
            تنظیمات
          </button>

          <div className="mt-auto rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-100 p-4 dark:from-orange-500/15 dark:to-pink-500/15 dark:border-orange-500/25">
            <p className="text-[11px] font-bold text-orange-900/80 dark:text-orange-200/80">ساعت</p>
            <p className="text-2xl font-black tabular-nums text-orange-950 dark:text-orange-100 leading-tight">
              {liveNow ? formatClockFa(liveNow, true) : "۰۰:۰۰:۰۰"}
            </p>
            <p className="mt-2.5 text-xs font-bold text-orange-900/80 dark:text-orange-200/80 mb-1">امروز</p>
            <p className="text-sm font-extrabold text-orange-950 dark:text-orange-100">
              {liveNow ? formatJalaliFull(liveNow) : `${faNum(jd)} ...`}
            </p>
            <p className="text-[11px] text-orange-700/70 dark:text-orange-300/70 mt-1">
              یک روز خوب در انتظار توست ☀
            </p>
          </div>
        </aside>

        {/* ─── محتوای اصلی ─── */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pt-5 lg:pt-8 pb-28 lg:pb-10">
          {/* هدر موبایل — flex-wrap تا در باریک‌ترین صفحه‌ها هم چیزی بیرون نزند */}
          <header className="lg:hidden flex flex-wrap items-center justify-between gap-x-2 gap-y-2 mb-5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 text-white shadow-md shadow-orange-500/30">
                <CalendarCheck2 className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-black text-gradient leading-tight">پلنر من</h1>
                <p className="text-[10px] text-muted-foreground truncate">
                  {mounted ? formatJalaliFull(today) : "…"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="rounded-full bg-card/80 backdrop-blur border border-orange-100 dark:border-orange-500/25 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-300 shadow-sm">
                {faNum(jd)} {JALALI_MONTHS[jm - 1]}
              </div>
              <div className="rounded-full bg-card/80 backdrop-blur border border-orange-100 dark:border-orange-500/25 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-300 shadow-sm flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="tabular-nums">{liveNow ? formatClockFa(liveNow) : "۰۰:۰۰"}</span>
              </div>
              {/* دکمه تنظیمات — لمسی ۴۴px */}
              <button
                onClick={() => setSettingsOpen(true)}
                aria-label="تنظیمات"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-card/80 backdrop-blur border border-orange-100 dark:border-orange-500/25 text-orange-600 dark:text-orange-300 shadow-sm transition-colors hover:bg-orange-50 dark:hover:bg-orange-500/10 active:scale-95"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* ورود تب‌ها با CSS خالص — محتوا حتی قبل از hydrate شدن جاوااسکریپت نمایان است
              (رفع صفحه سفید روی موبایل‌های کند/شبکه ضعیف؛ key={tab} انیمیشن را هربار دوباره اجرا می‌کند) */}
          <div key={tab} className="anim-enter mx-auto max-w-5xl">
              {tab === "dashboard" && <Dashboard onNavigate={setTab} />}
              {tab === "tasks" && <TasksSection />}
              {tab === "calendar" && <CalendarSection />}
              {tab === "events" && <EventsSection />}
              {tab === "fal" && <FalSection />}
              {tab === "habits" && <HabitsSection />}
              {tab === "goals" && <GoalsSection />}
              {tab === "notes" && <NotesSection />}
              {tab === "stats" && <StatsSection />}
          </div>
        </main>
      </div>

      {/* ─── نویگیشن پایین موبایل ─── */}
      <nav
        aria-label="ناوبری پایین"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/70 bg-card/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      >
        {/* ۹ آیتم همیشه کامل جا می‌شوند: flex-1 + min-w-0 + برچسب کوتاه */}
        <div className="flex items-stretch justify-between px-0.5 py-1.5">
          {NAV_ITEMS.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-1 min-w-0 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 cursor-pointer"
              >
                {active && (
                  <motion.span
                    layoutId="mobile-pill"
                    className="absolute inset-0 rounded-xl bg-orange-100 dark:bg-orange-500/20"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "relative h-5 w-5 transition-colors",
                    active ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
                  )}
                  style={!active ? { color: `${item.color}B3` } : undefined}
                  strokeWidth={2.2}
                />
                <span
                  className={cn(
                    "relative w-full truncate text-center text-[9.5px] leading-tight font-bold",
                    active ? "text-orange-700 dark:text-orange-300" : "text-muted-foreground"
                  )}
                >
                  {item.shortLabel ?? item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* دیالوگ تنظیمات */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* فوتر */}
      <footer className="mt-auto hidden lg:block border-t border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-xs text-muted-foreground">
          <p>
            ساخته‌شده با <span className="text-pink-500">♥</span> برای برنامه‌ریزی بهتر
          </p>
          <p>پلنر من — نسخه {faNum("1.0")}</p>
        </div>
      </footer>
    </div>
  );
}
