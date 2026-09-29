import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  User,
  BookOpen,
  HeartPulse,
  Layers,
  Flame,
  Droplets,
  Dumbbell,
  BookMarked,
  Sprout,
  MoonStar,
  Footprints,
  Brain,
  Music,
  PenLine,
  GlassWater,
  Sparkles,
  Cake,
  Heart,
  CalendarClock,
  Flower2,
  Star,
} from "lucide-react";

// ─────────────────────────────────────────────
//  حالت برنامه
// ─────────────────────────────────────────────
/**
 * برنامه به‌صورت پیش‌فرض «کاملاً آفلاین» است: بدون سرور، بدون API.
 * تنظیمات عمومی (تبلیغ/ارتباط/خوشامد) از فایل استاتیک public/config.json
 * خوانده می‌شود که با ویرایش آن در گیت‌هاب به‌روز می‌شود.
 *
 * اگر روزی نسخه سروردار برگرداندی (پوشه src/app/api از تاریخچه گیت)،
 * این فلگ را true کن تا بخش «ورود مدیر / پنل مدیریت» در تنظیمات نمایش
 * داده شود. در حالت آفلاین مدیریت تبلیغات = ویرایش config.json در گیت‌هاب.
 */
export const ENABLE_ADMIN_PANEL = false;

// ─────────────────────────────────────────────
//  نوع‌های داده (سازگار با API)
// ─────────────────────────────────────────────
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Category = "WORK" | "PERSONAL" | "STUDY" | "HEALTH" | "OTHER";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  taskId: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  subtasks: Subtask[];
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
}

export interface Habit {
  id: string;
  title: string;
  icon: string;
  color: string;
  targetPerWeek: number;
  createdAt: string;
  logs: HabitLog[];
}

export interface Goal {
  id: string;
  title: string;
  description?: string | null;
  target: number;
  current: number;
  unit: string;
  color: string;
  deadline?: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

/** انواع رویدادهای ویژه زندگی (تولد، سالگرد و ...) */
export type EventType = "BIRTHDAY" | "ANNIVERSARY" | "APPOINTMENT" | "MEMORIAL" | "CUSTOM";

export interface PlannerEvent {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  color: string;
  note?: string | null;
  /** نوع رویداد ویژه */
  type: EventType;
  /** تکرار سالانه بر اساس همان روز شمسی */
  yearly: boolean;
  /** سال تولد شمسی (برای محاسبه سن، اختیاری) */
  birthYear?: number | null;
  createdAt: string;
}

export interface Stats {
  today: { completed: number; total: number };
  totals: { tasks: number; pending: number; overdue: number; doneAll: number };
  week: { date: string; completed: number }[];
  categories: { category: string; total: number; completed: number }[];
  priorities: { priority: string; pending: number }[];
  habits: { active: number; completionsLast7: number; scheduledLast7: number };
}

// ─────────────────────────────────────────────
//  اولویت‌ها
// ─────────────────────────────────────────────
export const PRIORITIES: Record<
  Priority,
  { label: string; color: string; bg: string; dot: string }
> = {
  HIGH: { label: "فوری", color: "text-red-600", bg: "bg-red-100", dot: "#EF4444" },
  MEDIUM: { label: "متوسط", color: "text-amber-600", bg: "bg-amber-100", dot: "#F59E0B" },
  LOW: { label: "کم", color: "text-teal-600", bg: "bg-teal-100", dot: "#14B8A6" },
};

// ─────────────────────────────────────────────
//  دسته‌بندی‌ها
// ─────────────────────────────────────────────
export const CATEGORIES: Record<
  Category,
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  WORK: { label: "کاری", icon: Briefcase, color: "text-orange-600", bg: "bg-orange-100" },
  PERSONAL: { label: "شخصی", icon: User, color: "text-pink-600", bg: "bg-pink-100" },
  STUDY: { label: "درسی", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-100" },
  HEALTH: { label: "سلامت", icon: HeartPulse, color: "text-emerald-600", bg: "bg-emerald-100" },
  OTHER: { label: "سایر", icon: Layers, color: "text-teal-600", bg: "bg-teal-100" },
};

export const CATEGORY_LIST: Category[] = ["WORK", "PERSONAL", "STUDY", "HEALTH", "OTHER"];
export const PRIORITY_LIST: Priority[] = ["HIGH", "MEDIUM", "LOW"];

// ─────────────────────────────────────────────────
//  انواع رویدادهای ویژه — برچسب، آیکون و رنگ هر نوع
// ─────────────────────────────────────────────────
export const EVENT_TYPES: Record<
  EventType,
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  BIRTHDAY: { label: "تولد", icon: Cake, color: "#EC4899", bg: "bg-pink-100" },
  ANNIVERSARY: { label: "سالگرد", icon: Heart, color: "#F43F5E", bg: "bg-rose-100" },
  APPOINTMENT: { label: "قرار ملاقات", icon: CalendarClock, color: "#14B8A6", bg: "bg-teal-100" },
  MEMORIAL: { label: "یادبود", icon: Flower2, color: "#94A3B8", bg: "bg-slate-100" },
  CUSTOM: { label: "شخصی", icon: Star, color: "#F97316", bg: "bg-orange-100" },
};

export const EVENT_TYPE_LIST: EventType[] = ["BIRTHDAY", "ANNIVERSARY", "APPOINTMENT", "MEMORIAL", "CUSTOM"];

// ─────────────────────────────────────────────
//  رنگ‌های شاد برای انتخاب کاربر
// ─────────────────────────────────────────────
export const CHEERFUL_COLORS = [
  "#F97316", // نارنجی
  "#EC4899", // صورتی
  "#14B8A6", // سبزآبی
  "#8B5CF6", // بنفش
  "#10B981", // سبز
  "#F59E0B", // کهربایی
  "#EF4444", // قرمز
  "#6366F1", // یاسی
];

export const NOTE_COLORS = [
  { value: "#FEF3C7", label: "زرد لیمویی" },
  { value: "#FFE4E6", label: "صورتی" },
  { value: "#D1FAE5", label: "نعنایی" },
  { value: "#FFEDD5", label: "هلویی" },
  { value: "#EDE9FE", label: "یاسی" },
  { value: "#CCFBF1", label: "فیروزه‌ای" },
  { value: "#FEF9C3", label: "لیمویی" },
  { value: "#F3E8FF", label: "بنفش کم‌رنگ" },
];

// ─────────────────────────────────────────────
//  آیکون‌های پیشنهادی عادت‌ها
// ─────────────────────────────────────────────
export const HABIT_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "Flame", icon: Flame },
  { name: "Droplets", icon: Droplets },
  { name: "Dumbbell", icon: Dumbbell },
  { name: "BookMarked", icon: BookMarked },
  { name: "Sprout", icon: Sprout },
  { name: "MoonStar", icon: MoonStar },
  { name: "Footprints", icon: Footprints },
  { name: "Brain", icon: Brain },
  { name: "Music", icon: Music },
  { name: "PenLine", icon: PenLine },
  { name: "GlassWater", icon: GlassWater },
  { name: "Sparkles", icon: Sparkles },
];

export function habitIcon(name: string): LucideIcon {
  return HABIT_ICONS.find((i) => i.name === name)?.icon ?? Sparkles;
}
