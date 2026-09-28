import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isDayKey, jsonError, readJsonBody } from '@/app/api/_lib/helpers'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
//  POST /api/habits/[id]/toggle — علامت زدن/برداشتن یک روز
//  body: { date: "YYYY-MM-DD" }
//  اگر HabitLog برای (habitId, date) وجود داشته باشد حذف می‌شود، وگرنه ساخته می‌شود.
// ─────────────────────────────────────────────
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)
    if (!isDayKey(body.date))
      return jsonError('date is required in YYYY-MM-DD format', 400)

    const habit = await db.habit.findUnique({ where: { id } })
    if (!habit) return jsonError('Habit not found', 404)

    const existing = await db.habitLog.findUnique({
      where: { habitId_date: { habitId: id, date: body.date } },
    })
    if (existing) {
      await db.habitLog.delete({ where: { id: existing.id } })
    } else {
      await db.habitLog.create({ data: { habitId: id, date: body.date } })
    }

    const updated = await db.habit.findUnique({
      where: { id },
      include: { logs: { orderBy: { date: 'asc' } } },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error(`POST /api/habits/${id}/toggle failed:`, err)
    return jsonError('Failed to toggle habit', 500)
  }
}
