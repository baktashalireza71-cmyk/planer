import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { isInt, isNonEmptyString, jsonError, readJsonBody } from '@/app/api/_lib/helpers'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
//  PATCH /api/habits/[id] — ویرایش عادت
//  body: { title?, icon?, color?, targetPerWeek? }
// ─────────────────────────────────────────────
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)

    const existing = await db.habit.findUnique({ where: { id } })
    if (!existing) return jsonError('Habit not found', 404)

    const data: Prisma.HabitUpdateInput = {}

    if (body.title !== undefined) {
      if (!isNonEmptyString(body.title)) return jsonError('title must be a non-empty string', 400)
      data.title = body.title.trim()
    }
    if (body.icon !== undefined) {
      if (typeof body.icon !== 'string') return jsonError('icon must be a string', 400)
      data.icon = body.icon
    }
    if (body.color !== undefined) {
      if (typeof body.color !== 'string') return jsonError('color must be a string', 400)
      data.color = body.color
    }
    if (body.targetPerWeek !== undefined) {
      if (!isInt(body.targetPerWeek)) return jsonError('targetPerWeek must be an integer', 400)
      if (body.targetPerWeek < 1 || body.targetPerWeek > 7)
        return jsonError('targetPerWeek must be between 1 and 7', 400)
      data.targetPerWeek = body.targetPerWeek
    }

    const habit = await db.habit.update({
      where: { id },
      data,
      include: { logs: { orderBy: { date: 'asc' } } },
    })
    return NextResponse.json(habit)
  } catch (err) {
    console.error(`PATCH /api/habits/${id} failed:`, err)
    return jsonError('Failed to update habit', 500)
  }
}

// ─────────────────────────────────────────────
//  DELETE /api/habits/[id] — حذف عادت (لاگ‌ها هم حذف می‌شوند)
// ─────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const existing = await db.habit.findUnique({ where: { id } })
    if (!existing) return jsonError('Habit not found', 404)
    await db.habit.delete({ where: { id } }) // logs cascade in the schema
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(`DELETE /api/habits/${id} failed:`, err)
    return jsonError('Failed to delete habit', 500)
  }
}
