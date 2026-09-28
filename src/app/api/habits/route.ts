import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isInt, isNonEmptyString, jsonError, readJsonBody } from '@/app/api/_lib/helpers'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
//  GET /api/habits — همه عادت‌ها با لاگ‌ها (قدیمی‌ترین اول)
// ─────────────────────────────────────────────
export async function GET() {
  try {
    const habits = await db.habit.findMany({
      include: { logs: { orderBy: { date: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(habits)
  } catch (err) {
    console.error('GET /api/habits failed:', err)
    return jsonError('Failed to fetch habits', 500)
  }
}

// ─────────────────────────────────────────────
//  POST /api/habits — ساخت عادت جدید
//  body: { title, icon?, color?, targetPerWeek? }
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)
    if (!isNonEmptyString(body.title)) return jsonError('title is required', 400)
    if (body.icon !== undefined && typeof body.icon !== 'string')
      return jsonError('icon must be a string', 400)
    if (body.color !== undefined && typeof body.color !== 'string')
      return jsonError('color must be a string', 400)
    if (body.targetPerWeek !== undefined) {
      if (!isInt(body.targetPerWeek))
        return jsonError('targetPerWeek must be an integer', 400)
      if (body.targetPerWeek < 1 || body.targetPerWeek > 7)
        return jsonError('targetPerWeek must be between 1 and 7', 400)
    }

    const habit = await db.habit.create({
      data: {
        title: body.title.trim(),
        icon: typeof body.icon === 'string' ? body.icon : undefined,
        color: typeof body.color === 'string' ? body.color : undefined,
        targetPerWeek: typeof body.targetPerWeek === 'number' ? body.targetPerWeek : undefined,
      },
      include: { logs: true },
    })
    return NextResponse.json(habit, { status: 201 })
  } catch (err) {
    console.error('POST /api/habits failed:', err)
    return jsonError('Failed to create habit', 500)
  }
}
