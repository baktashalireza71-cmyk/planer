import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import {
  CATEGORIES,
  INVALID,
  PRIORITIES,
  isNonEmptyString,
  isOneOf,
  jsonError,
  parseDateField,
  readJsonBody,
} from '@/app/api/_lib/helpers'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
//  PATCH /api/tasks/[id] — ویرایش جزئی کار
//  body: هر کدام از { title, description, completed, priority, category, dueDate (ISO|null) }
// ─────────────────────────────────────────────
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)

    const existing = await db.task.findUnique({ where: { id } })
    if (!existing) return jsonError('Task not found', 404)

    const data: Prisma.TaskUpdateInput = {}

    if (body.title !== undefined) {
      if (!isNonEmptyString(body.title)) return jsonError('title must be a non-empty string', 400)
      data.title = body.title.trim()
    }
    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== 'string')
        return jsonError('description must be a string or null', 400)
      data.description = body.description
    }
    if (body.completed !== undefined) {
      if (typeof body.completed !== 'boolean')
        return jsonError('completed must be a boolean', 400)
      data.completed = body.completed
    }
    if (body.priority !== undefined) {
      if (!isOneOf(body.priority, PRIORITIES))
        return jsonError('priority must be one of LOW, MEDIUM, HIGH', 400)
      data.priority = body.priority
    }
    if (body.category !== undefined) {
      if (!isOneOf(body.category, CATEGORIES))
        return jsonError('category must be one of WORK, PERSONAL, STUDY, HEALTH, OTHER', 400)
      data.category = body.category
    }
    const dueDate = parseDateField(body.dueDate)
    if (dueDate === INVALID)
      return jsonError('dueDate must be a valid ISO date string or null', 400)
    if (dueDate !== undefined) data.dueDate = dueDate

    const task = await db.task.update({ where: { id }, data, include: { subtasks: true } })
    return NextResponse.json(task)
  } catch (err) {
    console.error(`PATCH /api/tasks/${id} failed:`, err)
    return jsonError('Failed to update task', 500)
  }
}

// ─────────────────────────────────────────────
//  DELETE /api/tasks/[id] — حذف کار (زیرکارها هم حذف می‌شوند)
// ─────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const existing = await db.task.findUnique({ where: { id } })
    if (!existing) return jsonError('Task not found', 404)
    await db.task.delete({ where: { id } }) // subtasks cascade in the schema
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(`DELETE /api/tasks/${id} failed:`, err)
    return jsonError('Failed to delete task', 500)
  }
}
