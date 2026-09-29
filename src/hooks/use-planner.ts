"use client";

/**
 * use-planner.ts — هوک‌های داده برنامه
 * ------------------------------------------------
 * همان رابط قبلی (سازگار با همه کامپوننت‌ها) اما بک‌اند آن
 * حافظه محلی دستگاه است — داده‌ها هرگز از گوشی خارج نمی‌شوند.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Category, Priority, EventType } from "@/lib/constants";
import {
  tasksStore,
  habitsStore,
  goalsStore,
  notesStore,
  eventsStore,
  statsStore,
  type TaskInput,
  type HabitInput,
  type GoalInput,
  type NoteInput,
  type EventInput,
} from "@/lib/local-store";

const KEYS = {
  tasks: ["tasks"] as const,
  habits: ["habits"] as const,
  goals: ["goals"] as const,
  notes: ["notes"] as const,
  events: ["events"] as const,
  stats: ["stats"] as const,
};

// خواندن از حافظه محلی در microtask تا رفتار queryFn ناهمگام حفظ شود
const local = <T>(fn: () => T): Promise<T> => Promise.resolve().then(fn);

// ─────────────────────────────────────────────
//  Queries
// ─────────────────────────────────────────────
export function useTasks() {
  return useQuery({ queryKey: KEYS.tasks, queryFn: () => local(() => tasksStore.list()) });
}

export function useHabits() {
  return useQuery({ queryKey: KEYS.habits, queryFn: () => local(() => habitsStore.list()) });
}

export function useGoals() {
  return useQuery({ queryKey: KEYS.goals, queryFn: () => local(() => goalsStore.list()) });
}

export function useNotes() {
  return useQuery({ queryKey: KEYS.notes, queryFn: () => local(() => notesStore.list()) });
}

export function useEvents() {
  return useQuery({ queryKey: KEYS.events, queryFn: () => local(() => eventsStore.list()) });
}

export function useStats() {
  return useQuery({ queryKey: KEYS.stats, queryFn: () => local(() => statsStore.get()) });
}

// ─────────────────────────────────────────────
//  Mutations — کارها
// ─────────────────────────────────────────────
export function useTaskMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEYS.tasks });
    qc.invalidateQueries({ queryKey: KEYS.stats });
  };

  const create = useMutation({
    mutationFn: (body: TaskInput) => local(() => tasksStore.create(body)),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      description?: string | null;
      completed?: boolean;
      priority?: Priority;
      category?: Category;
      dueDate?: string | null;
    }) => local(() => tasksStore.update(id, body)),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => local(() => tasksStore.remove(id)),
    onSuccess: invalidate,
  });
  const addSubtask = useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      local(() => tasksStore.addSubtask(taskId, title)),
    onSuccess: invalidate,
  });
  const updateSubtask = useMutation({
    mutationFn: ({ id, ...body }: { id: string; done?: boolean; title?: string }) =>
      local(() => tasksStore.updateSubtask(id, body)),
    onSuccess: invalidate,
  });
  const removeSubtask = useMutation({
    mutationFn: (id: string) => local(() => tasksStore.removeSubtask(id)),
    onSuccess: invalidate,
  });

  return { create, update, remove, addSubtask, updateSubtask, removeSubtask };
}

// ─────────────────────────────────────────────
//  Mutations — عادت‌ها
// ─────────────────────────────────────────────
export function useHabitMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEYS.habits });
    qc.invalidateQueries({ queryKey: KEYS.stats });
  };

  const create = useMutation({
    mutationFn: (body: HabitInput) => local(() => habitsStore.create(body)),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      icon?: string;
      color?: string;
      targetPerWeek?: number;
    }) => local(() => habitsStore.update(id, body)),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => local(() => habitsStore.remove(id)),
    onSuccess: invalidate,
  });
  const toggle = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      local(() => habitsStore.toggle(id, date)),
    onSuccess: invalidate,
  });

  return { create, update, remove, toggle };
}

// ─────────────────────────────────────────────
//  Mutations — اهداف
// ─────────────────────────────────────────────
export function useGoalMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEYS.goals });
    qc.invalidateQueries({ queryKey: KEYS.stats });
  };

  const create = useMutation({
    mutationFn: (body: GoalInput) => local(() => goalsStore.create(body)),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      description?: string | null;
      target?: number;
      current?: number;
      unit?: string;
      color?: string;
      deadline?: string | null;
    }) => local(() => goalsStore.update(id, body)),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => local(() => goalsStore.remove(id)),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// ─────────────────────────────────────────────
//  Mutations — یادداشت‌ها
// ─────────────────────────────────────────────
export function useNoteMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEYS.notes });

  const create = useMutation({
    mutationFn: (body: NoteInput) => local(() => notesStore.create(body)),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      content?: string;
      color?: string;
      pinned?: boolean;
    }) => local(() => notesStore.update(id, body)),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => local(() => notesStore.remove(id)),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// ─────────────────────────────────────────────
//  Mutations — رویدادها
// ─────────────────────────────────────────────
export function useEventMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEYS.events });
    qc.invalidateQueries({ queryKey: KEYS.stats });
  };

  const create = useMutation({
    mutationFn: (body: EventInput) => local(() => eventsStore.create(body)),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      date?: string;
      time?: string | null;
      color?: string;
      note?: string | null;
      type?: EventType;
      yearly?: boolean;
      birthYear?: number | null;
    }) => local(() => eventsStore.update(id, body)),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => local(() => eventsStore.remove(id)),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
