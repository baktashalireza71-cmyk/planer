"use client";

/**
 * notification-center.tsx — مرکز اعلان‌های برنامه
 * ------------------------------------------------
 * زنگ با نشان تعداد + پنل فهرست یادآوری‌ها.
 * لمس هر آیتم، کاربر را به بخش مربوطه می‌برد.
 * دو حالت نمایش:
 *  - sidebar: ردیف کامل برای سایدبار دسکتاپ
 *  - icon: دکمه گرد فشرده برای هدر موبایل
 */

import { useMemo, useState } from "react";
import {
  Bell,
  AlertCircle,
  CalendarClock,
  Clock,
  Repeat,
  CalendarHeart,
  Target,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { collectNotifications, type NotifItem, type NotifKind } from "@/lib/notifications";
import { useTasks, useHabits, useEvents, useGoals } from "@/hooks/use-planner";
import { faNum } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { TabKey } from "./app-shell";

const KIND_STYLE: Record<NotifKind, { icon: LucideIcon; color: string; bg: string }> = {
  overdue: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-500/20" },
  today: { icon: CalendarClock, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-500/20" },
  tomorrow: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-500/20" },
  habit: { icon: Repeat, color: "text-pink-600", bg: "bg-pink-100 dark:bg-pink-500/20" },
  event: { icon: CalendarHeart, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-500/20" },
  goal: { icon: Target, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
};

export default function NotificationCenter({
  variant,
  onNavigate,
}: {
  variant: "sidebar" | "icon";
  onNavigate: (tab: TabKey) => void;
}) {
  const [open, setOpen] = useState(false);

  // داده‌های واکنشی از کش مشترک TanStack Query — با هر تغییر، نشان زنگ به‌روز می‌شود
  const { data: tasks = [] } = useTasks();
  const { data: habits = [] } = useHabits();
  const { data: events = [] } = useEvents();
  const { data: goals = [] } = useGoals();
  const items = useMemo<NotifItem[]>(
    () => collectNotifications(),
    // collectNotifications از حافظه محلی می‌خواند؛ این داده‌ها نقش محرک به‌روزرسانی دارند
    [tasks, habits, events, goals]
  );
  const urgentCount = items.filter((i) => i.urgent).length;

  const go = (tab: NotifItem["tab"]) => {
    setOpen(false);
    onNavigate(tab);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "sidebar" ? (
          <button
            aria-label={`اعلان‌ها${items.length > 0 ? ` — ${faNum(items.length)} یادآوری` : ""}`}
            className="relative flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-foreground/75 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span className="relative shrink-0">
              <Bell className="h-5 w-5" strokeWidth={2.2} />
              {items.length > 0 && (
                <span
                  className={cn(
                    "absolute -left-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black text-white shadow",
                    urgentCount > 0 ? "bg-red-500" : "bg-orange-500"
                  )}
                >
                  {faNum(items.length)}
                </span>
              )}
            </span>
            اعلان‌ها
            {urgentCount > 0 && (
              <span className="mr-auto rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600 dark:bg-red-500/20 dark:text-red-400">
                {faNum(urgentCount)} فوری
              </span>
            )}
          </button>
        ) : (
          <button
            aria-label={`اعلان‌ها${items.length > 0 ? ` — ${faNum(items.length)} یادآوری` : ""}`}
            className={cn(
              "relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-card/80 text-orange-600 shadow-sm backdrop-blur transition-colors hover:bg-orange-50 active:scale-95 dark:text-orange-300 dark:hover:bg-orange-500/10"
            )}
          >
            <Bell className="h-5 w-5" />
            {items.length > 0 && (
              <span
                className={cn(
                  "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background px-1 text-[9px] font-black text-white shadow",
                  urgentCount > 0 ? "bg-red-500" : "bg-orange-500"
                )}
              >
                {faNum(items.length)}
              </span>
            )}
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align={variant === "sidebar" ? "start" : "end"}
        side={variant === "sidebar" ? "right" : "bottom"}
        sideOffset={8}
        className="w-80 max-w-[calc(100vw-2.5rem)] rounded-3xl p-0"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h4 className="flex items-center gap-2 text-sm font-black">
            <Bell className="h-4 w-4 text-orange-500" />
            اعلان‌ها
          </h4>
          {items.length > 0 && (
            <span className="text-[11px] font-bold text-muted-foreground">
              {faNum(items.length)} یادآوری
            </span>
          )}
        </div>

        <div className="scrollbar-thin max-h-[320px] overflow-y-auto overscroll-contain p-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Sparkles className="h-6 w-6" />
              </span>
              <p className="text-sm font-extrabold">همه‌چیز مرتبه!</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                هیچ کار عقب‌افتاده، عادت انجام‌نشده یا رویداد نزدیکی نداری.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {items.map((item) => {
                const style = KIND_STYLE[item.kind];
                const Icon = style.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => go(item.tab)}
                      className="flex w-full cursor-pointer items-start gap-3 rounded-2xl px-3 py-2.5 text-right transition-colors hover:bg-accent/60 active:scale-[0.99]"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                          style.bg,
                          style.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="min-w-0 truncate text-[13px] font-extrabold">
                            {item.title}
                          </span>
                          {item.urgent && (
                            <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-px text-[9px] font-black text-red-600 dark:bg-red-500/20 dark:text-red-400">
                              فوری
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                          {item.body}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
