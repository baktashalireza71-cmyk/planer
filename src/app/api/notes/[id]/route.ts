import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { isNonEmptyString, jsonError, readJsonBody } from '@/app/api/_lib/helpers'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
//  PATCH /api/notes/[id] — ویرایش یادداشت
//  body: { title?, content?, color?, pinned? }
// ─────────────────────────────────────────────
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)

    const existing = await db.note.findUnique({ where: { id } })
    if (!existing) return jsonError('Note not found', 404)

    const data: Prisma.NoteUpdateInput = {}

    if (body.title !== undefined) {
      if (!isNonEmptyString(body.title)) return jsonError('title must be a non-empty string', 400)
      data.title = body.title.trim()
    }
    if (body.content !== undefined) {
      if (typeof body.content !== 'string') return jsonError('content must be a string', 400)
      data.content = body.content
    }
    if (body.color !== undefined) {
      if (typeof body.color !== 'string') return jsonError('color must be a string', 400)
      data.color = body.color
    }
    if (body.pinned !== undefined) {
      if (typeof body.pinned !== 'boolean') return jsonError('pinned must be a boolean', 400)
      data.pinned = body.pinned
    }

    const note = await db.note.update({ where: { id }, data })
    return NextResponse.json(note)
  } catch (err) {
    console.error(`PATCH /api/notes/${id} failed:`, err)
    return jsonError('Failed to update note', 500)
  }
}

// ─────────────────────────────────────────────
//  DELETE /api/notes/[id] — حذف یادداشت
// ─────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const existing = await db.note.findUnique({ where: { id } })
    if (!existing) return jsonError('Note not found', 404)
    await db.note.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(`DELETE /api/notes/${id} failed:`, err)
    return jsonError('Failed to delete note', 500)
  }
}
