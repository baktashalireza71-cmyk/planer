import { NextResponse } from 'next/server'
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
//  GET /api/events?start=ISO&end=ISO — رویدادها (مرتب بر اساس تاریخ)
//  start/end اختیاری هستند و بازه‌ی date را فیلتر می‌کنند.
// ─────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const startRaw = searchParams.get('start')
    const endRaw = searchParams.get('end')

    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (startRaw !== null) {
      const d = new Date(startRaw)
      if (Number.isNaN(d.getTime()))
        return jsonError('start must be a valid ISO date string', 400)
      dateFilter.gte = d
    }
    if (endRaw !== null) {
      const d = new Date(endRaw)
      if (Number.isNaN(d.getTime())) return jsonError('end must be a valid ISO date string', 400)
      dateFilter.lte = d
    }

    const events = await db.event.findMany({
      where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : undefined,
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(events)
  } catch (err) {
    console.error('GET /api/events failed:', err)
    return jsonError('Failed to fetch events', 500)
  }
}

// ─────────────────────────────────────────────
//  POST /api/events — ساخت رویداد جدید
//  body: { title, date (ISO, required), time?, color?, note? }
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)
    if (!isNonEmptyString(body.title)) return jsonError('title is required', 400)

    const date = parseDateField(body.date)
    if (date === undefined || date === null || date === INVALID)
      return jsonError('date is required and must be a valid ISO date string', 400)

    if (body.time !== undefined && body.time !== null && typeof body.time !== 'string')
      return jsonError('time must be a string or null', 400)
    if (body.color !== undefined && typeof body.color !== 'string')
      return jsonError('color must be a string', 400)
    if (body.note !== undefined && body.note !== null && typeof body.note !== 'string')
      return jsonError('note must be a string or null', 400)

    const event = await db.event.create({
      data: {
        title: body.title.trim(),
        date,
        time: typeof body.time === 'string' ? body.time : undefined,
        color: typeof body.color === 'string' ? body.color : undefined,
        note: typeof body.note === 'string' ? body.note : undefined,
      },
    })
    return NextResponse.json(event, { status: 201 })
  } catch (err) {
    console.error('POST /api/events failed:', err)
    return jsonError('Failed to create event', 500)
  }
}
