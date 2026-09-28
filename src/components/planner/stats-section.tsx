"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  CalendarClock,
  Flame,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { SectionHeader, EmptyState, StatCard, SectionSkeleton } from "./shared";
import { useStats, useTasks, useHabits } from "@/hooks/use-planner";
import { CATEGORIES, PRIORITIES, type Category, type Priority } from "@/lib/constants";
import { faNum, WEEKDAYS_FA, persianWeekday } from "@/lib/date";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#F97316", "#14B8A6", "#EC4899", "#8B5CF6", "#10B981"];

export default function StatsSection() {
  const { data: stats, isLoading } = useStats();
  const { data: tasks = [] } = useTasks();
  const { data: habits = [] } = useHabits();

  const hasAnyData = stats && (stats.totals.tasks > 0 || stats.habits.active > 0);

  const weekData = useMemo(() => {
    if (!stats) return [];
    return stats.week.map((w) => {
      const d = new Date(`${w.date}T12:00:00`);
      return {
        name: WEEKDAYS_FA[persianWeekday(d)],
        count: w.completed,
      };
    });
  }, [stats]);

  const categoryData = useMemo(() => {
    if (!stats) return [];
    return stats.categories
      .filter((c) => c.total > 0)
      .map((c) => ({
        name: CATEGORIES[c.category as Category]?.label ?? c.category,
        value: c.total,
        completed: c.completed,
      }));
  }, [stats]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <SectionHeader title="آمار و پیشرفت" subtitle="نمودار بهره‌وری تو" icon={BarChart3} color="#E11D48" />
        <SectionSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="آمار و پیشرفت"
        subtitle="ببین چقدر پیشرفت کردی — ادامه بده!"
        icon={BarChart3}
        color="#E11D48"
      />

      {!hasAnyData ? (
        <EmptyState
          icon={TrendingUp}
          color="#E11D48"
          title="آماری برای نمایش نیست"
          description="اول چند کار بساز، عادت تعریف کن یا هدف بذار — بعد نمودارهای قشنگ اینجا ظاهر می‌شن!"
        />
      ) : (
        <>
          {/* کارت‌های KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="کارهای انجام‌شده"
              value={faNum(stats!.totals.doneAll)}
              hint={`از ${faNum(stats!.totals.tasks)} کار`}
              icon={CheckCircle2}
              color="#10B981"
            />
            <StatCard
              label="در انتظار انجام"
              value={faNum(stats!.totals.pending)}
              hint="از دستش نده"
              icon={CalendarClock}
              color="#F59E0B"
            />
            <StatCard
              label="عقب‌افتاده"
              value={faNum(stats!.totals.overdue)}
              hint={stats!.totals.overdue ? "اولویت با این‌هاست" : "بدون عقب‌افتادگی!"}
              icon={CalendarClock}
              color="#EF4444"
            />
            <StatCard
              label="عادت‌های فعال"
              value={faNum(stats!.habits.active)}
              hint={stats!.habits.active ? `${faNum(stats!.habits.completionsLast7)} تیک در هفته اخیر` : undefined}
              icon={Flame}
              color="#EC4899"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            {/* نمودار هفتگی */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-3 rounded-3xl bg-card p-5 card-glow"
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
                کارهای انجام‌شده در ۷ روز اخیر
              </h3>
              <div dir="ltr" className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barOrange" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FB923C" />
                        <stop offset="100%" stopColor="#F97316" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5E7D5" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#A08D7C", fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#A08D7C" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(249,115,22,0.06)" }}
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid #F5E7D5",
                        fontFamily: "inherit",
                        fontSize: 12,
                        direction: "rtl",
                      }}
                      formatter={(v) => [`${faNum(Number(v))} کار`, "انجام‌شده"]}
                    />
                    <Bar dataKey="count" fill="url(#barOrange)" radius={[8, 8, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.section>

            {/* نمودار دسته‌بندی‌ها */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="lg:col-span-2 rounded-3xl bg-card p-5 card-glow"
            >
              <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                  <BarChart3 className="h-4 w-4" />
                </span>
                توزیع کارها بر اساس دسته
              </h3>
              {categoryData.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted-foreground">داده‌ای نیست</p>
              ) : (
                <>
                  <div dir="ltr" className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={80}
                          paddingAngle={4}
                          cornerRadius={8}
                          strokeWidth={0}
                        >
                          {categoryData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 16,
                            border: "1px solid #F5E7D5",
                            fontFamily: "inherit",
                            fontSize: 12,
                            direction: "rtl",
                          }}
                          formatter={(v, name) => [`${faNum(Number(v))} کار`, String(name)]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {categoryData.map((c, i) => (
                      <li key={c.name} className="flex items-center gap-2 text-xs">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="font-bold">{c.name}</span>
                        <span className="ms-auto tabular-nums text-muted-foreground">
                          {faNum(c.completed)}/{faNum(c.value)} انجام شد
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </motion.section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* اولویت‌ها */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl bg-card p-5 card-glow"
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-500">
                  <Trophy className="h-4 w-4" />
                </span>
                کارهای ناتمام بر اساس اولویت
              </h3>
              <ul className="space-y-4">
                {stats!.priorities.map((p) => {
                  const info = PRIORITIES[p.priority as Priority];
                  const max = Math.max(1, ...stats!.priorities.map((x) => x.pending));
                  const w = Math.round((p.pending / max) * 100);
                  return (
                    <li key={p.priority}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className={cn("font-bold", info.color)}>{info.label}</span>
                        <span className="tabular-nums text-muted-foreground">{faNum(p.pending)} کار</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${w}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: info.dot }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.section>

            {/* ثبات عادت‌ها */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="rounded-3xl bg-card p-5 card-glow"
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                  <Flame className="h-4 w-4" />
                </span>
                ثبات عادت‌ها (هفته اخیر)
              </h3>
              {habits.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  هنوز عادتی نساخته‌ای
                </p>
              ) : (
                <ul className="space-y-4">
                  {habits.map((h) => {
                    const done7 = h.logs.filter((l) => {
                      const d = new Date(`${l.date}T12:00:00`);
                      const now = new Date();
                      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
                      return d >= from;
                    }).length;
                    const w = Math.min(100, Math.round((done7 / Math.max(1, h.targetPerWeek)) * 100));
                    return (
                      <li key={h.id}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-bold">{h.title}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {faNum(done7)} از {faNum(h.targetPerWeek)} روز
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${w}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: h.color }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.section>
          </div>

          {/* امتیاز کلی */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl bg-gradient-to-l from-teal-500 via-emerald-500 to-green-500 p-6 text-center text-white shadow-xl shadow-emerald-500/25"
          >
            <p className="text-xs font-bold text-emerald-50">امتیاز بهره‌وری این هفته</p>
            <p className="mt-1 text-4xl font-black">
              {faNum(
                Math.min(
                  100,
                  Math.round(
                    (stats!.totals.doneAll * 10 +
                      stats!.habits.completionsLast7 * 4 -
                      stats!.totals.overdue * 3) /
                      Math.max(1, stats!.totals.tasks + stats!.habits.scheduledLast7) *
                      10
                  )
                )
              )}
              <span className="text-lg"> از ۱۰۰</span>
            </p>
            <p className="mt-2 text-xs text-emerald-50/90">
              با تکمیل کارها و عادت‌ها این امتیاز رو بالاتر ببر!
            </p>
          </motion.div>
        </>
      )}
    </div>
  );
}
