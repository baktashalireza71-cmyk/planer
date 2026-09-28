"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Category, Priority } from "@/lib/constants";
import { tasksApi, habitsApi, goalsApi, notesApi, eventsApi, statsApi } from "@/lib/api-client";

const KEYS = {
  tasks: ["tasks"] as const,
  habits: ["habits"] as const,
  goals: ["goals"] as const,
  notes: ["notes"] as const,
  events: ["events"] as const,
  stats: ["stats"] as const,
};

// ─────────────────────────────────────────────
//  Queries
// ─────────────────────────────────────────────
export function useTasks() {
  return useQuery({ queryKey: KEYS.tasks, queryFn: tasksApi.list });
}

export function useHabits() {
  return useQuery({ queryKey: KEYS.habits, queryFn: habitsApi.list });
}

export function useGoals() {
  return useQuery({ queryKey: KEYS.goals, queryFn: goalsApi.list });
}

export function useNotes() {
  return useQuery({ queryKey: KEYS.notes, queryFn: notesApi.list });
}

export function useEvents() {
  return useQuery({ queryKey: KEYS.events, queryFn: eventsApi.list });
}

export function useStats() {
  return useQuery({ queryKey: KEYS.stats, queryFn: statsApi.get });
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

  const create = useMutation({ mutationFn: tasksApi.create, onSuccess: invalidate });
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
    }) => tasksApi.update(id, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: tasksApi.remove, onSuccess: invalidate });
  const addSubtask = useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      tasksApi.addSubtask(taskId, title),
    onSuccess: invalidate,
  });
  const updateSubtask = useMutation({
    mutationFn: ({ id, ...body }: { id: string; done?: boolean; title?: string }) =>
      tasksApi.updateSubtask(id, body),
    onSuccess: invalidate,
  });
  const removeSubtask = useMutation({
    mutationFn: (id: string) => tasksApi.removeSubtask(id),
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

  const create = useMutation({ mutationFn: habitsApi.create, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; icon?: string; color?: string; targetPerWeek?: number }) =>
      habitsApi.update(id, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: habitsApi.remove, onSuccess: invalidate });
  const toggle = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => habitsApi.toggle(id, date),
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

  const create = useMutation({ mutationFn: goalsApi.create, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; description?: string | null; target?: number; current?: number; unit?: string; color?: string; deadline?: string | null }) =>
      goalsApi.update(id, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: goalsApi.remove, onSuccess: invalidate });

  return { create, update, remove };
}

// ─────────────────────────────────────────────
//  Mutations — یادداشت‌ها
// ─────────────────────────────────────────────
export function useNoteMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEYS.notes });

  const create = useMutation({ mutationFn: notesApi.create, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; content?: string; color?: string; pinned?: boolean }) =>
      notesApi.update(id, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: notesApi.remove, onSuccess: invalidate });

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

  const create = useMutation({ mutationFn: eventsApi.create, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; date?: string; time?: string | null; color?: string; note?: string | null }) =>
      eventsApi.update(id, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: eventsApi.remove, onSuccess: invalidate });

  return { create, update, remove };
}
