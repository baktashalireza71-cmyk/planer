"use client";

import type {
  Task,
  Habit,
  Goal,
  Note,
  PlannerEvent,
  Stats,
  Category,
  Priority,
  EventType,
} from "./constants";

// ─────────────────────────────────────────────
//  fetcher عمومی
// ─────────────────────────────────────────────
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    let msg = "خطایی رخ داد. دوباره تلاش کن.";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(msg);
  }
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
//  کارها
// ─────────────────────────────────────────────
export interface TaskInput {
  title: string;
  description?: string | null;
  priority?: Priority;
  category?: Category;
  dueDate?: string | null;
}

export const tasksApi = {
  list: () => request<Task[]>("/api/tasks"),
  create: (body: TaskInput) =>
    request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<TaskInput> & { completed?: boolean }) =>
    request<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),
  addSubtask: (taskId: string, title: string) =>
    request<{ id: string; title: string; done: boolean; taskId: string }>(
      `/api/tasks/${taskId}/subtasks`,
      { method: "POST", body: JSON.stringify({ title }) }
    ),
  updateSubtask: (id: string, body: { done?: boolean; title?: string }) =>
    request<{ id: string; done: boolean; title: string }>(`/api/subtasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  removeSubtask: (id: string) =>
    request<{ success: boolean }>(`/api/subtasks/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────
//  عادت‌ها
// ─────────────────────────────────────────────
export interface HabitInput {
  title: string;
  icon?: string;
  color?: string;
  targetPerWeek?: number;
}

export const habitsApi = {
  list: () => request<Habit[]>("/api/habits"),
  create: (body: HabitInput) =>
    request<Habit>("/api/habits", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<HabitInput>) =>
    request<Habit>(`/api/habits/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/api/habits/${id}`, { method: "DELETE" }),
  toggle: (id: string, date: string) =>
    request<Habit>(`/api/habits/${id}/toggle`, {
      method: "POST",
      body: JSON.stringify({ date }),
    }),
};

// ─────────────────────────────────────────────
//  اهداف
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

export const goalsApi = {
  list: () => request<Goal[]>("/api/goals"),
  create: (body: GoalInput) =>
    request<Goal>("/api/goals", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<GoalInput>) =>
    request<Goal>(`/api/goals/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/api/goals/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────
//  یادداشت‌ها
// ─────────────────────────────────────────────
export interface NoteInput {
  title: string;
  content?: string;
  color?: string;
  pinned?: boolean;
}

export const notesApi = {
  list: () => request<Note[]>("/api/notes"),
  create: (body: NoteInput) =>
    request<Note>("/api/notes", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<NoteInput>) =>
    request<Note>(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/api/notes/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────
//  رویدادها
// ─────────────────────────────────────────────
export interface EventInput {
  title: string;
  date: string;
  time?: string | null;
  color?: string;
  note?: string | null;
  /** نوع رویداد ویژه (پیش‌فرض CUSTOM) */
  type?: EventType;
  /** تکرار سالانه بر اساس همان روز شمسی */
  yearly?: boolean;
  /** سال تولد شمسی (فقط برای تولد) */
  birthYear?: number | null;
}

export const eventsApi = {
  list: () => request<PlannerEvent[]>("/api/events"),
  create: (body: EventInput) =>
    request<PlannerEvent>("/api/events", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<EventInput>) =>
    request<PlannerEvent>(`/api/events/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/api/events/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────
//  آمار
// ─────────────────────────────────────────────
export const statsApi = {
  get: () => request<Stats>("/api/stats"),
};
