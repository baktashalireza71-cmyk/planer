import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { isNonEmptyString, jsonError, readJsonBody } from '@/app/api/_lib/helpers'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
//  PATCH /api/subtasks/[id] — ویرایش زیرکار
//  body: { done?: boolean, title?: string }
// ─────────────────────────────────────────────
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)

    const existing = await db.subtask.findUnique({ where: { id } })
    if (!existing) return jsonError('Subtask not found', 404)

    const data: Prisma.SubtaskUpdateInput = {}

    if (body.title !== undefined) {
      if (!isNonEmptyString(body.title)) return jsonError('title must be a non-empty string', 400)
      data.title = body.title.trim()
    }
    if (body.done !== undefined) {
      if (typeof body.done !== 'boolean') return jsonError('done must be a boolean', 400)
      data.done = body.done
    }

    const subtask = await db.subtask.update({ where: { id }, data })
    return NextResponse.json(subtask)
  } catch (err) {
    console.error(`PATCH /api/subtasks/${id} failed:`, err)
    return jsonError('Failed to update subtask', 500)
  }
}

// ─────────────────────────────────────────────
//  DELETE /api/subtasks/[id] — حذف زیرکار
// ─────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const existing = await db.subtask.findUnique({ where: { id } })
    if (!existing) return jsonError('Subtask not found', 404)
    await db.subtask.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(`DELETE /api/subtasks/${id} failed:`, err)
    return jsonError('Failed to delete subtask', 500)
  }
}
