import { NextResponse } from 'next/server'
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
//  GET /api/goals — همه اهداف (جدیدترین اول)
// ─────────────────────────────────────────────
export async function GET() {
  try {
    const goals = await db.goal.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(goals)
  } catch (err) {
    console.error('GET /api/goals failed:', err)
    return jsonError('Failed to fetch goals', 500)
  }
}

// ─────────────────────────────────────────────
//  POST /api/goals — ساخت هدف جدید
//  body: { title, description?, target?, current?, unit?, color?, deadline? (ISO|null) }
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req)
    if (!body) return jsonError('Invalid request body', 400)
    if (!isNonEmptyString(body.title)) return jsonError('title is required', 400)
    if (
      body.description !== undefined &&
      body.description !== null &&
      typeof body.description !== 'string'
    )
      return jsonError('description must be a string or null', 400)
    if (body.target !== undefined && !isInt(body.target))
      return jsonError('target must be an integer', 400)
    if (body.current !== undefined && !isInt(body.current))
      return jsonError('current must be an integer', 400)
    if (body.unit !== undefined && typeof body.unit !== 'string')
      return jsonError('unit must be a string', 400)
    if (body.color !== undefined && typeof body.color !== 'string')
      return jsonError('color must be a string', 400)
    const deadline = parseDateField(body.deadline)
    if (deadline === INVALID)
      return jsonError('deadline must be a valid ISO date string or null', 400)

    const goal = await db.goal.create({
      data: {
        title: body.title.trim(),
        description: typeof body.description === 'string' ? body.description : undefined,
        target: typeof body.target === 'number' ? body.target : undefined,
        current: typeof body.current === 'number' ? body.current : undefined,
        unit: typeof body.unit === 'string' ? body.unit : undefined,
        color: typeof body.color === 'string' ? body.color : undefined,
        deadline,
      },
    })
    return NextResponse.json(goal, { status: 201 })
  } catch (err) {
    console.error('POST /api/goals failed:', err)
    return jsonError('Failed to create goal', 500)
  }
}
