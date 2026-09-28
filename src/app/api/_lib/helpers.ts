import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────
//  Shared helpers for the Planner API routes
//  (validation, safe date parsing, JSON errors)
// ─────────────────────────────────────────────

// Allowed enum values (must match the string values stored by prisma/schema.prisma)
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const
export const CATEGORIES = ['WORK', 'PERSONAL', 'STUDY', 'HEALTH', 'OTHER'] as const

// Sentinel returned by parseDateField when a value is present but not a valid date
export const INVALID = Symbol('invalid-date')

/** JSON error response: { error: message } */
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

/** Safely read a JSON object body. Returns null for invalid JSON / non-object bodies. */
export async function readJsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown = await req.json()
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Parse an optional date field coming from the client.
 * - undefined        → field absent (caller should not touch it)
 * - null             → explicit null (clear the field)
 * - Date             → valid ISO string / Date value
 * - INVALID (symbol) → present but not a valid date → respond 400
 */
export function parseDateField(value: unknown): Date | null | undefined | typeof INVALID {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return INVALID
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return INVALID
  return d
}

/** Non-empty (after trim) string check. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** String must be one of the allowed values. */
export function isOneOf(value: unknown, allowed: readonly string[]): value is string {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}

/** Strict integer check (Prisma Int fields). */
export function isInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

/**
 * Validates a "YYYY-MM-DD" day key (the format used by HabitLog.date).
 * Also rejects impossible calendar dates such as 2024-02-31.
 */
export function isDayKey(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return false
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(y, mo - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
}

/** Local-time "YYYY-MM-DD" key for a Date (used by /api/stats). */
export function toDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
