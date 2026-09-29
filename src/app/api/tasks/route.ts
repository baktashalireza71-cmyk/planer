import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  CATEGORIES,
  INVALID,
  PRIORITIES,
  isNonEmptyString,
  isOneOf,
  jsonError,
  parseDateField,
  readJsonBody,
} from '@/app/api/_lib/helpers'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
//  GET /api/tasks — همه کارها با زیرکارها
//  ترتیب: ناتمام‌ها اول ← dueDate صعودی (بدون تاریخ آخر) ← جدیدترین اول
// ─────────────────────────────────────────────
export async function GET() {
  try {
    const tasks = await db.task.findMany({ include: { subtasks: true } })
    // SQLite + Prisma cannot express "nulls last" for optional orderBy,
    // so the contract order is applied in memory (deterministic and exact).
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime()
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
    return NextResponse.json(tasks)
  } catch (err) {
    console.error('GET /api/tasks failed:', err)
    return jsonError('Failed to fetch tasks', 500)
  }
}

// ─────────────────────────────────────────────
//  POST /api/tasks — ساخت کار جدید
//  body: { title, description?, priority?, category?, dueDate? (ISO|null) }
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)
    if (!isNonEmptyString(body.title)) return jsonError('title is required', 400)
    if (body.priority !== undefined && !isOneOf(body.priority, PRIORITIES))
      return jsonError('priority must be one of LOW, MEDIUM, HIGH', 400)
    if (body.category !== undefined && !isOneOf(body.category, CATEGORIES))
      return jsonError('category must be one of WORK, PERSONAL, STUDY, HEALTH, OTHER', 400)
    if (
      body.description !== undefined &&
      body.description !== null &&
      typeof body.description !== 'string'
    )
      return jsonError('description must be a string or null', 400)
    const dueDate = parseDateField(body.dueDate)
    if (dueDate === INVALID)
      return jsonError('dueDate must be a valid ISO date string or null', 400)

    const task = await db.task.create({
      data: {
        title: body.title.trim(),
        description: typeof body.description === 'string' ? body.description : undefined,
        priority: typeof body.priority === 'string' ? body.priority : undefined,
        category: typeof body.category === 'string' ? body.category : undefined,
        dueDate,
      },
      include: { subtasks: true },
    })
    return NextResponse.json(task, { status: 201 })
  } catch (err) {
    console.error('POST /api/tasks failed:', err)
    return jsonError('Failed to create task', 500)
  }
}
