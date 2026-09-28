"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// ─────────────────────────────────────────────
//  سربرگ بخش‌ها
// ─────────────────────────────────────────────
export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  color,
  action,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{ backgroundColor: color, boxShadow: `0 8px 20px -6px ${color}66` }}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────
//  حالت خالی جذاب
// ─────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  color = "#F97316",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border/80 px-6 py-10 text-center bg-white/50">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-3xl rotate-3"
        style={{ backgroundColor: `${color}1A` }}
      >
        <Icon className="h-8 w-8" style={{ color }} strokeWidth={2} />
      </div>
      <div>
        <p className="font-bold text-[15px]">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────
//  حلقه پیشرفت (SVG)
// ─────────────────────────────────────────────
export function ProgressRing({
  value,
  size = 72,
  stroke = 8,
  color = "#F97316",
  track = "#FFEDD5",
  children,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  کارت آمار سریع
// ─────────────────────────────────────────────
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-start card-glow border border-transparent hover:border-border transition-colors cursor-pointer"
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black leading-none tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
        {hint && <p className="text-[10px] mt-0.5 truncate" style={{ color }}>{hint}</p>}
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────
//  دکمه حذف با تأیید
// ─────────────────────────────────────────────
export function DeleteConfirm({
  onConfirm,
  title = "حذف کنم؟",
  description = "این مورد برای همیشه حذف می‌شود و قابل بازگشت نیست.",
  label = "حذف",
  size = "icon",
}: {
  onConfirm: () => void;
  title?: string;
  description?: string;
  label?: string;
  size?: "icon" | "sm";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {size === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {label}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent aria-describedby={undefined}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            بله، حذف شود
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────
//  چیپ رنگی کوچک
// ─────────────────────────────────────────────
export function Chip({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────
//  اسکلتون لودینگ بخش
// ─────────────────────────────────────────────
export function SectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-20 w-full animate-pulse rounded-2xl bg-white/70"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}
