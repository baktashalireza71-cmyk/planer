import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import {
  INVALID,
  isNonEmptyString,
  jsonError,
  parseDateField,
  readJsonBody,
} from '@/app/api/_lib/helpers'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
//  PATCH /api/events/[id] — ویرایش رویداد
//  body: { title?, date? (ISO), time?, color?, note? }
// ─────────────────────────────────────────────
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)

    const existing = await db.event.findUnique({ where: { id } })
    if (!existing) return jsonError('Event not found', 404)

    const data: Prisma.EventUpdateInput = {}

    if (body.title !== undefined) {
      if (!isNonEmptyString(body.title)) return jsonError('title must be a non-empty string', 400)
      data.title = body.title.trim()
    }
    const date = parseDateField(body.date)
    // Event.date is required (non-nullable) → explicit null is invalid here
    if (date === INVALID || date === null)
      return jsonError('date must be a valid ISO date string', 400)
    if (date !== undefined) data.date = date
    if (body.time !== undefined) {
      if (body.time !== null && typeof body.time !== 'string')
        return jsonError('time must be a string or null', 400)
      data.time = body.time
    }
    if (body.color !== undefined) {
      if (typeof body.color !== 'string') return jsonError('color must be a string', 400)
      data.color = body.color
    }
    if (body.note !== undefined) {
      if (body.note !== null && typeof body.note !== 'string')
        return jsonError('note must be a string or null', 400)
      data.note = body.note
    }

    const event = await db.event.update({ where: { id }, data })
    return NextResponse.json(event)
  } catch (err) {
    console.error(`PATCH /api/events/${id} failed:`, err)
    return jsonError('Failed to update event', 500)
  }
}

// ─────────────────────────────────────────────
//  DELETE /api/events/[id] — حذف رویداد
// ─────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const existing = await db.event.findUnique({ where: { id } })
    if (!existing) return jsonError('Event not found', 404)
    await db.event.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(`DELETE /api/events/${id} failed:`, err)
    return jsonError('Failed to delete event', 500)
  }
}
