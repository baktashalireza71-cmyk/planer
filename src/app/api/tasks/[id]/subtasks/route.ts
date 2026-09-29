import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isNonEmptyString, jsonError, readJsonBody } from '@/app/api/_lib/helpers'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
//  POST /api/tasks/[id]/subtasks — افزودن زیرکار به کار
//  body: { title }
// ─────────────────────────────────────────────
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)
    if (!isNonEmptyString(body.title)) return jsonError('title is required', 400)

    const task = await db.task.findUnique({ where: { id }, select: { id: true } })
    if (!task) return jsonError('Task not found', 404)

    const subtask = await db.subtask.create({
      data: { title: body.title.trim(), taskId: id },
    })
    return NextResponse.json(subtask, { status: 201 })
  } catch (err) {
    console.error(`POST /api/tasks/${id}/subtasks failed:`, err)
    return jsonError('Failed to create subtask', 500)
  }
}
