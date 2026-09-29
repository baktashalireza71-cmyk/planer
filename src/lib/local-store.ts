/**
 * local-store.ts — دیتابیس محلی برنامه (سمت کاربر)
 * ------------------------------------------------
 * همه داده‌های شخصی (کارها، عادت‌ها، اهداف، یادداشت‌ها، رویدادها)
 * فقط در حافظه محلی خود دستگاه (localStorage) ذخیره می‌شوند و
 * هرگز به هیچ سروری ارسال نمی‌شوند — مطابق سیاست حریم خصوصی برنامه.
 *
 * رابط توابع عیناً همان قرارداد API قبلی است تا کامپوننت‌ها بدون
 * تغییر کار کنند. ترتیب مرتب‌سازی نیز دقیقاً مطابق API قبلی است.
 */

import type {
  Task,
  Subtask,
  Habit,
  HabitLog,
  Goal,
  Note,
  PlannerEvent,
  Stats,
  Category,
  Priority,
  EventType,
} from "./constants";
import { CATEGORY_LIST, PRIORITY_LIST } from "./constants";
import { dayKey } from "./date";

// ─────────────────────────────────────────────
//  کلیدهای حافظه محلی
// ─────────────────────────────────────────────
const LS = {
  tasks: "planner.tasks",
  habits: "planner.habits",
  goals: "planner.goals",
  notes: "planner.notes",
  events: "planner.events",
  notif: "planner.notifPrefs",
  migrated: "planner.migrated.v1",
};

// ─────────────────────────────────────────────
//  ابزارهای پایه
// ─────────────────────────────────────────────
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // حافظه پر یا در دسترس نیست — بی‌صدا رد می‌شویم
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const nowISO = () => new Date().toISOString();

// ─────────────────────────────────────────────
//  کارها (Tasks)
// ─────────────────────────────────────────────
export interface TaskInput {
  title: string;
  description?: string | null;
  priority?: Priority;
  category?: Category;
  dueDate?: string | null;
}

function sortTasks(list: Task[]): Task[] {
  // قرارداد API قبلی: ناتمام‌ها اول ← dueDate صعودی (بدون تاریخ آخر) ← جدیدترین اول
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export const tasksStore = {
  list(): Task[] {
    return sortTasks(read<Task[]>(LS.tasks, []));
  },
  create(input: TaskInput): Task {
    const tasks = read<Task[]>(LS.tasks, []);
    const task: Task = {
      id: newId(),
      title: input.title.trim(),
      description: input.description ?? null,
      completed: false,
      priority: input.priority ?? "MEDIUM",
      category: input.category ?? "PERSONAL",
      dueDate: input.dueDate ?? null,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      subtasks: [],
    };
    write(LS.tasks, [...tasks, task]);
    return task;
  },
  update(id: string, patch: Partial<TaskInput> & { completed?: boolean }): Task {
    const tasks = read<Task[]>(LS.tasks, []);
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("کار پیدا نشد");
    const updated: Task = {
      ...tasks[idx],
      ...patch,
      updatedAt: nowISO(),
    };
    tasks[idx] = updated;
    write(LS.tasks, tasks);
    return updated;
  },
  remove(id: string): { success: boolean } {
    const tasks = read<Task[]>(LS.tasks, []);
    write(
      LS.tasks,
      tasks.filter((t) => t.id !== id)
    );
    return { success: true };
  },
  addSubtask(taskId: string, title: string): Subtask {
    const tasks = read<Task[]>(LS.tasks, []);
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error("کار پیدا نشد");
    const subtask: Subtask = { id: newId(), title: title.trim(), done: false, taskId };
    tasks[idx] = { ...tasks[idx], subtasks: [...tasks[idx].subtasks, subtask] };
    write(LS.tasks, tasks);
    return subtask;
  },
  updateSubtask(id: string, patch: { done?: boolean; title?: string }): Subtask {
    const tasks = read<Task[]>(LS.tasks, []);
    for (let i = 0; i < tasks.length; i++) {
      const sIdx = tasks[i].subtasks.findIndex((s) => s.id === id);
      if (sIdx !== -1) {
        const subtask = { ...tasks[i].subtasks[sIdx], ...patch };
        tasks[i] = {
          ...tasks[i],
          subtasks: tasks[i].subtasks.map((s) => (s.id === id ? subtask : s)),
        };
        write(LS.tasks, tasks);
        return subtask;
      }
    }
    throw new Error("زیرکار پیدا نشد");
  },
  removeSubtask(id: string): { success: boolean } {
    const tasks = read<Task[]>(LS.tasks, []);
    write(
      LS.tasks,
      tasks.map((t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== id) }))
    );
    return { success: true };
  },
};

// ─────────────────────────────────────────────
//  عادت‌ها (Habits)
// ─────────────────────────────────────────────
export interface HabitInput {
  title: string;
  icon?: string;
  color?: string;
  targetPerWeek?: number;
}

function sortHabits(list: Habit[]): Habit[] {
  // قرارداد API قبلی: createdAt صعودی، logs بر اساس تاریخ صعودی
  return [...list]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((h) => ({ ...h, logs: [...h.logs].sort((a, b) => a.date.localeCompare(b.date)) }));
}

export const habitsStore = {
  list(): Habit[] {
    return sortHabits(read<Habit[]>(LS.habits, []));
  },
  create(input: HabitInput): Habit {
    const habits = read<Habit[]>(LS.habits, []);
    const habit: Habit = {
      id: newId(),
      title: input.title.trim(),
      icon: input.icon ?? "Sparkles",
      color: input.color ?? "#F97316",
      targetPerWeek: input.targetPerWeek ?? 7,
      createdAt: nowISO(),
      logs: [],
    };
    write(LS.habits, [...habits, habit]);
    return habit;
  },
  update(id: string, patch: Partial<HabitInput>): Habit {
    const habits = read<Habit[]>(LS.habits, []);
    const idx = habits.findIndex((h) => h.id === id);
    if (idx === -1) throw new Error("عادت پیدا نشد");
    const updated = { ...habits[idx], ...patch };
    habits[idx] = updated;
    write(LS.habits, habits);
    return updated;
  },
  remove(id: string): { success: boolean } {
    const habits = read<Habit[]>(LS.habits, []);
    write(
      LS.habits,
      habits.filter((h) => h.id !== id)
    );
    return { success: true };
  },
  /** تیک زدن/برداشتن عادت برای یک روز خاص — مثل API قبلی */
  toggle(id: string, date: string): Habit {
    const habits = read<Habit[]>(LS.habits, []);
    const idx = habits.findIndex((h) => h.id === id);
    if (idx === -1) throw new Error("عادت پیدا نشد");
    const habit = habits[idx];
    const exists = habit.logs.some((l) => l.date === date);
    const logs: HabitLog[] = exists
      ? habit.logs.filter((l) => l.date !== date)
      : [...habit.logs, { id: newId(), habitId: id, date }];
    const updated: Habit = { ...habit, logs };
    habits[idx] = updated;
    write(LS.habits, habits);
    return updated;
  },
};

// ─────────────────────────────────────────────
//  اهداف (Goals)
// ─────────────────────────────────────────────
export interface GoalInput {
  title: string;
  description?: string | null;
  target?: number;
  current?: number;
  unit?: string;
  color?: string;
  deadline?: string | null;
}

export const goalsStore = {
  list(): Goal[] {
    // قرارداد API قبلی: createdAt نزولی (جدیدترین اول)
    return [...read<Goal[]>(LS.goals, [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
  create(input: GoalInput): Goal {
    const goals = read<Goal[]>(LS.goals, []);
    const goal: Goal = {
      id: newId(),
      title: input.title.trim(),
      description: input.description ?? null,
      target: input.target ?? 100,
      current: input.current ?? 0,
      unit: input.unit ?? "%",
      color: input.color ?? "#10B981",
      deadline: input.deadline ?? null,
      createdAt: nowISO(),
    };
    write(LS.goals, [...goals, goal]);
    return goal;
  },
  update(id: string, patch: Partial<GoalInput>): Goal {
    const goals = read<Goal[]>(LS.goals, []);
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error("هدف پیدا نشد");
    const updated = { ...goals[idx], ...patch };
    goals[idx] = updated;
    write(LS.goals, goals);
    return updated;
  },
  remove(id: string): { success: boolean } {
    const goals = read<Goal[]>(LS.goals, []);
    write(
      LS.goals,
      goals.filter((g) => g.id !== id)
    );
    return { success: true };
  },
};

// ─────────────────────────────────────────────
//  یادداشت‌ها (Notes)
// ─────────────────────────────────────────────
export interface NoteInput {
  title: string;
  content?: string;
  color?: string;
  pinned?: boolean;
}

export const notesStore = {
  list(): Note[] {
    // قرارداد API قبلی: سنجاق‌شده‌ها اول، سپس آخرین ویرایش
    return [...read<Note[]>(LS.notes, [])].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  },
  create(input: NoteInput): Note {
    const notes = read<Note[]>(LS.notes, []);
    const note: Note = {
      id: newId(),
      title: input.title.trim(),
      content: input.content ?? "",
      color: input.color ?? "#FEF3C7",
      pinned: input.pinned ?? false,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    write(LS.notes, [...notes, note]);
    return note;
  },
  update(id: string, patch: Partial<NoteInput>): Note {
    const notes = read<Note[]>(LS.notes, []);
    const idx = notes.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error("یادداشت پیدا نشد");
    const updated = { ...notes[idx], ...patch, updatedAt: nowISO() };
    notes[idx] = updated;
    write(LS.notes, notes);
    return updated;
  },
  remove(id: string): { success: boolean } {
    const notes = read<Note[]>(LS.notes, []);
    write(
      LS.notes,
      notes.filter((n) => n.id !== id)
    );
    return { success: true };
  },
};

// ─────────────────────────────────────────────
//  رویدادها (Events)
// ─────────────────────────────────────────────
export interface EventInput {
  title: string;
  date: string;
  time?: string | null;
  color?: string;
  note?: string | null;
  type?: EventType;
  yearly?: boolean;
  birthYear?: number | null;
}

export const eventsStore = {
  list(): PlannerEvent[] {
    // قرارداد API قبلی: تاریخ صعودی
    return [...read<PlannerEvent[]>(LS.events, [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  },
  create(input: EventInput): PlannerEvent {
    const events = read<PlannerEvent[]>(LS.events, []);
    const event: PlannerEvent = {
      id: newId(),
      title: input.title.trim(),
      date: input.date,
      time: input.time ?? null,
      color: input.color ?? "#8B5CF6",
      note: input.note ?? null,
      type: input.type ?? "CUSTOM",
      yearly: input.yearly ?? false,
      birthYear: input.birthYear ?? null,
      createdAt: nowISO(),
    };
    write(LS.events, [...events, event]);
    return event;
  },
  update(id: string, patch: Partial<EventInput>): PlannerEvent {
    const events = read<PlannerEvent[]>(LS.events, []);
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("رویداد پیدا نشد");
    const updated = { ...events[idx], ...patch };
    events[idx] = updated;
    write(LS.events, events);
    return updated;
  },
  remove(id: string): { success: boolean } {
    const events = read<PlannerEvent[]>(LS.events, []);
    write(
      LS.events,
      events.filter((e) => e.id !== id)
    );
    return { success: true };
  },
};

// ─────────────────────────────────────────────
//  آمار (Stats) — محاسبه کامل روی دستگاه
// ─────────────────────────────────────────────
export const statsStore = {
  get(): Stats {
    const tasks = read<Task[]>(LS.tasks, []);
    const habits = read<Habit[]>(LS.habits, []);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const todayTs = startOfToday.getTime();

    // ── today ──
    const todayTasks = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate).getTime();
      return d >= todayTs && d < startOfTomorrow.getTime();
    });
    const today = {
      completed: todayTasks.filter((t) => t.completed).length,
      total: todayTasks.length,
    };

    // ── totals ──
    const totals = {
      tasks: tasks.length,
      pending: tasks.filter((t) => !t.completed).length,
      overdue: tasks.filter(
        (t) => !t.completed && t.dueDate && new Date(t.dueDate).getTime() < todayTs
      ).length,
      doneAll: tasks.filter((t) => t.completed).length,
    };

    // ── week: ۷ روز اخیر شامل امروز (قدیمی‌ترین → جدیدترین) ──
    const week: { date: string; completed: number }[] = [];
    const dayKeys = new Set<string>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = dayKey(d);
      dayKeys.add(key);
      week.push({ date: key, completed: 0 });
    }
    for (const t of tasks) {
      if (!t.completed) continue;
      const key = dayKey(new Date(t.updatedAt));
      if (!dayKeys.has(key)) continue;
      const entry = week.find((w) => w.date === key);
      if (entry) entry.completed += 1;
    }

    // ── categories ──
    const categories = CATEGORY_LIST.map((category) => {
      const inCategory = tasks.filter((t) => t.category === category);
      return {
        category,
        total: inCategory.length,
        completed: inCategory.filter((t) => t.completed).length,
      };
    });

    // ── priorities ──
    const priorities = PRIORITY_LIST.map((priority) => ({
      priority,
      pending: tasks.filter((t) => t.priority === priority && !t.completed).length,
    }));

    // ── habits ──
    const completionsLast7 = habits.reduce(
      (sum, h) => sum + h.logs.filter((l) => dayKeys.has(l.date)).length,
      0
    );
    const scheduledLast7 = habits.reduce((sum, h) => sum + h.targetPerWeek, 0);

    return {
      today,
      totals,
      week,
      categories,
      priorities,
      habits: {
        active: habits.length,
        completionsLast7,
        scheduledLast7,
      },
    };
  },
};

// ─────────────────────────────────────────────
//  مهاجرت یک‌باره از سرور (نسخه‌های قبلی)
//  اگر داده‌ای روی سرور قدیمی بود، یک بار به حافظه دستگاه منتقل می‌شود.
// ─────────────────────────────────────────────
async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** یک بار تلاش می‌کند داده‌های نسخه قبلی (روی سرور) را بیاورد؛ نتیجه هرچه بود، علامت‌گذاری می‌شود */
export async function migrateFromServerOnce(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.localStorage.getItem(LS.migrated) === "1") return false;

  const [tasks, habits, goals, notes, events] = await Promise.all([
    fetchJson<Task[]>("/api/tasks"),
    fetchJson<Habit[]>("/api/habits"),
    fetchJson<Goal[]>("/api/goals"),
    fetchJson<Note[]>("/api/notes"),
    fetchJson<PlannerEvent[]>("/api/events"),
  ]);

  if (Array.isArray(tasks) && tasks.length > 0) write(LS.tasks, tasks);
  if (Array.isArray(habits) && habits.length > 0) write(LS.habits, habits);
  if (Array.isArray(goals) && goals.length > 0) write(LS.goals, goals);
  if (Array.isArray(notes) && notes.length > 0) write(LS.notes, notes);
  if (Array.isArray(events) && events.length > 0) write(LS.events, events);

  window.localStorage.setItem(LS.migrated, "1");
  return Array.isArray(tasks) || Array.isArray(habits) || Array.isArray(goals) || Array.isArray(notes) || Array.isArray(events);
}

// ─────────────────────────────────────────────
//  تنظیمات اعلان‌ها (ترجیحات کاربر — محلی)
// ─────────────────────────────────────────────
export interface NotifPrefs {
  /** یادآور روزانه (خلاصه برنامه در ساعت مشخص) */
  dailyEnabled: boolean;
  /** ساعت یادآور روزانه — "HH:MM" */
  dailyTime: string;
  /** اعلان کارهای امروز و عقب‌افتاده (یک بار در روز) */
  dueAlertsEnabled: boolean;
  /** آخرین روزی که یادآور روزانه فرستاده شد (dayKey) */
  lastDailyFire: string;
  /** آخرین روزی که اعلان کارها فرستاده شد (dayKey) */
  lastDueFire: string;
}

export const defaultNotifPrefs: NotifPrefs = {
  dailyEnabled: true,
  dailyTime: "21:00",
  dueAlertsEnabled: true,
  lastDailyFire: "",
  lastDueFire: "",
};

/** رویدادی که با هر تغییر تنظیمات اعلان‌ها منتشر می‌شود (برای همگام‌سازی زندهٔ UI و پل اندروید) */
export const NOTIF_PREFS_EVENT = "planner:notif-prefs-changed";

export const notifPrefsStore = {
  get(): NotifPrefs {
    return { ...defaultNotifPrefs, ...read<Partial<NotifPrefs>>(LS.notif, {}) };
  },
  set(patch: Partial<NotifPrefs>): NotifPrefs {
    const updated = { ...this.get(), ...patch };
    write(LS.notif, updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(NOTIF_PREFS_EVENT));
    }
    return updated;
  },
};
