import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import {
  INVALID,
  isInt,
  isNonEmptyString,
  jsonError,
  parseDateField,
  readJsonBody,
} from '@/app/api/_lib/helpers'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
//  PATCH /api/goals/[id] — ویرایش هدف
//  body: { title?, description?, target?, current?, unit?, color?, deadline? (ISO|null) }
// ─────────────────────────────────────────────
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)

    const existing = await db.goal.findUnique({ where: { id } })
    if (!existing) return jsonError('Goal not found', 404)

    const data: Prisma.GoalUpdateInput = {}

    if (body.title !== undefined) {
      if (!isNonEmptyString(body.title)) return jsonError('title must be a non-empty string', 400)
      data.title = body.title.trim()
    }
    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== 'string')
        return jsonError('description must be a string or null', 400)
      data.description = body.description
    }
    if (body.target !== undefined) {
      if (!isInt(body.target)) return jsonError('target must be an integer', 400)
      data.target = body.target
    }
    if (body.current !== undefined) {
      if (!isInt(body.current)) return jsonError('current must be an integer', 400)
      data.current = body.current
    }
    if (body.unit !== undefined) {
      if (typeof body.unit !== 'string') return jsonError('unit must be a string', 400)
      data.unit = body.unit
    }
    if (body.color !== undefined) {
      if (typeof body.color !== 'string') return jsonError('color must be a string', 400)
      data.color = body.color
    }
    const deadline = parseDateField(body.deadline)
    if (deadline === INVALID)
      return jsonError('deadline must be a valid ISO date string or null', 400)
    if (deadline !== undefined) data.deadline = deadline

    const goal = await db.goal.update({ where: { id }, data })
    return NextResponse.json(goal)
  } catch (err) {
    console.error(`PATCH /api/goals/${id} failed:`, err)
    return jsonError('Failed to update goal', 500)
  }
}

// ─────────────────────────────────────────────
//  DELETE /api/goals/[id] — حذف هدف
// ─────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const existing = await db.goal.findUnique({ where: { id } })
    if (!existing) return jsonError('Goal not found', 404)
    await db.goal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(`DELETE /api/goals/${id} failed:`, err)
    return jsonError('Failed to delete goal', 500)
  }
}
