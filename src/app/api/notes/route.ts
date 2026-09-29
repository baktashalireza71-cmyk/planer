import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isNonEmptyString, jsonError, readJsonBody } from '@/app/api/_lib/helpers'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
//  GET /api/notes — همه یادداشت‌ها (سنجاق‌شده‌ها اول، بعد جدیدترین)
// ─────────────────────────────────────────────
export async function GET() {
  try {
    const notes = await db.note.findMany({
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    })
    return NextResponse.json(notes)
  } catch (err) {
    console.error('GET /api/notes failed:', err)
    return jsonError('Failed to fetch notes', 500)
  }
}

// ─────────────────────────────────────────────
//  POST /api/notes — ساخت یادداشت جدید
//  body: { title, content?, color?, pinned? }
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)
    if (!isNonEmptyString(body.title)) return jsonError('title is required', 400)
    if (body.content !== undefined && typeof body.content !== 'string')
      return jsonError('content must be a string', 400)
    if (body.color !== undefined && typeof body.color !== 'string')
      return jsonError('color must be a string', 400)
    if (body.pinned !== undefined && typeof body.pinned !== 'boolean')
      return jsonError('pinned must be a boolean', 400)

    const note = await db.note.create({
      data: {
        title: body.title.trim(),
        content: typeof body.content === 'string' ? body.content : undefined,
        color: typeof body.color === 'string' ? body.color : undefined,
        pinned: typeof body.pinned === 'boolean' ? body.pinned : undefined,
      },
    })
    return NextResponse.json(note, { status: 201 })
  } catch (err) {
    console.error('POST /api/notes failed:', err)
    return jsonError('Failed to create note', 500)
  }
}
