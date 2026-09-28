"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, ChevronLeft, X, RotateCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  JALALI_MONTHS,
  WEEKDAYS_SHORT,
  faNum,
  toJalali,
  fromJalali,
  jalaliMonthLength,
  persianWeekday,
  dayKey,
  dateFromDayKey,
  sameDay,
  formatJalaliMedium,
  formatJalaliFull,
} from "@/lib/date";
import { getIranianHoliday } from "@/lib/iran-holidays";

// ─────────────────────────────────────────────────────────────────────────────
//  JalaliDatePicker — انتخاب‌گر تاریخ شمسی (جایگزین کامل input[type=date] میلادی)
//  مقدار ورودی/خروجی همان کلید میلادی «YYYY-MM-DD» است تا با بک‌اند سازگار بماند،
//  ولی تمام نمایش و تعامل کاربر با تقویم شمسی انجام می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

// بازه سال‌های انتخاب‌گر برای پرش سریع (مثلا برای تاریخ تولد)
const PICKER_YEARS = Array.from({ length: 161 }, (_, i) => 1300 + i);

interface JalaliDatePickerProps {
  /** کلید میلادی «YYYY-MM-DD» یا null (بدون تاریخ) */
  value: string | null;
  onChange: (key: string | null) => void;
  /** دکمه پاک کردن تاریخ نمایش داده شود؟ */
  clearable?: boolean;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export default function JalaliDatePicker({
  value,
  onChange,
  clearable = false,
  placeholder = "انتخاب تاریخ",
  id,
  disabled,
  className,
}: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false);

  const today = useMemo(() => new Date(), []);
  const valueDate = value ? dateFromDayKey(value) : null;
  const vj = toJalali(valueDate ?? today);

  const [view, setView] = useState({ jy: vj.jy, jm: vj.jm });

  // همگام‌سازی نما با مقدار هنگام باز شدن پاپ‌اور
  function handleOpenChange(next: boolean) {
    if (next) {
      const j = toJalali(valueDate ?? new Date());
      setView({ jy: j.jy, jm: j.jm });
    }
    setOpen(next);
  }

  const grid = useMemo(() => {
    const first = fromJalali(view.jy, view.jm, 1);
    const pad = persianWeekday(first);
    const len = jalaliMonthLength(view.jy, view.jm);
    const cells: (Date | null)[] = Array.from({ length: pad }, () => null);
    for (let d = 1; d <= len; d++) cells.push(fromJalali(view.jy, view.jm, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [view]);

  function shiftMonth(dir: 1 | -1) {
    setView((v) => {
      let jm = v.jm + dir;
      let jy = v.jy;
      if (jm > 12) { jm = 1; jy++; }
      if (jm < 1) { jm = 12; jy--; }
      return { jy, jm };
    });
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-9 w-full items-center gap-2 rounded-xl border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] cursor-pointer outline-none",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              "hover:bg-accent/40",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-right font-bold">
              {valueDate ? formatJalaliMedium(valueDate) : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent dir="rtl" align="end" className="w-[288px] rounded-2xl p-3" sideOffset={6}>
          {/* سرصفحه: ناوبری ماه */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="ماه قبل"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center gap-0.5">
              {/* انتخاب مستقیم ماه و سال — برای پرش سریع (مثلا تاریخ تولد) */}
              <div className="flex items-center justify-center gap-0.5">
                <Select
                  value={String(view.jm)}
                  onValueChange={(v) => setView((w) => ({ ...w, jm: Number(v) }))}
                >
                  <SelectTrigger
                    size="sm"
                    aria-label="انتخاب ماه"
                    className="h-7 w-auto gap-0.5 rounded-lg border-0 bg-transparent px-1.5 py-0 text-[13px] font-black shadow-none hover:bg-accent cursor-pointer"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JALALI_MONTHS.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(view.jy)}
                  onValueChange={(v) => setView((w) => ({ ...w, jy: Number(v) }))}
                >
                  <SelectTrigger
                    size="sm"
                    aria-label="انتخاب سال"
                    className="h-7 w-auto gap-0.5 rounded-lg border-0 bg-transparent px-1.5 py-0 text-[13px] font-black tabular-nums shadow-none hover:bg-accent cursor-pointer"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PICKER_YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {faNum(y)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => {
                  const j = toJalali(new Date());
                  setView({ jy: j.jy, jm: j.jm });
                }}
                className="text-[10px] font-bold text-muted-foreground hover:text-orange-600 cursor-pointer transition-colors"
              >
                ماه جاری
              </button>
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="ماه بعد"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* روزهای هفته */}
          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS_SHORT.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "py-1 text-center text-[10px] font-bold",
                  i === 6 ? "text-red-500" : "text-muted-foreground"
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* شبکه روزها */}
          <div className="grid grid-cols-7 gap-0.5">
            {grid.map((date, i) => {
              if (!date) return <div key={i} className="aspect-square" />;
              const key = dayKey(date);
              const isSelected = valueDate ? sameDay(date, valueDate) : false;
              const isToday = sameDay(date, today);
              const holiday = getIranianHoliday(date);
              const isFriday = persianWeekday(date) === 6;
              const isOff = isFriday || !!holiday;
              return (
                <button
                  key={i}
                  type="button"
                  title={holiday ? `${holiday.title}${holiday.hijri ? ` — ${holiday.hijri}` : ""}` : formatJalaliFull(date)}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-lg text-[13px] font-bold transition-all cursor-pointer",
                    isSelected
                      ? "bg-violet-500 text-white shadow-md shadow-violet-500/30 scale-105"
                      : isToday
                        ? "ring-2 ring-orange-400 text-orange-600 dark:text-orange-400"
                        : "hover:bg-accent",
                    !isSelected && isOff && (isSelected ? "" : "text-red-500"),
                    holiday && !isSelected && "font-black"
                  )}
                >
                  {faNum(toJalali(date).jd)}
                  {holiday && !isSelected && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-red-400" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>

          {/* پاک کردن انتخاب */}
          {clearable && value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-1.5 text-[11px] font-bold text-muted-foreground hover:border-red-300 hover:text-red-500 cursor-pointer transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              حذف تاریخ
            </button>
          )}
        </PopoverContent>
      </Popover>

      {/* دکمه «برو به امروز» کنار فیلد */}
      {valueDate && !sameDay(valueDate, today) && (
        <button
          type="button"
          onClick={() => onChange(dayKey(today))}
          title="انتخاب امروز"
          aria-label="انتخاب امروز"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-input text-muted-foreground hover:bg-accent hover:text-orange-600 cursor-pointer transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
