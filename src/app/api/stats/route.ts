import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { CATEGORIES, PRIORITIES, jsonError, toDayKey } from '@/app/api/_lib/helpers'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
//  GET /api/stats — آمار تجمیعی داشبورد
// ─────────────────────────────────────────────
export async function GET() {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    const [tasks, habits] = await Promise.all([
      db.task.findMany({
        select: { completed: true, priority: true, category: true, dueDate: true, updatedAt: true },
      }),
      db.habit.findMany({ select: { targetPerWeek: true } }),
    ])

    // ── today: کارهای دارای dueDate در امروز ──
    const todayTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate >= startOfToday && t.dueDate < startOfTomorrow
    )
    const today = {
      completed: todayTasks.filter((t) => t.completed).length,
      total: todayTasks.length,
    }

    // ── totals ──
    const totals = {
      tasks: tasks.length,
      pending: tasks.filter((t) => !t.completed).length,
      overdue: tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < startOfToday).length,
      doneAll: tasks.filter((t) => t.completed).length,
    }

    // ── week: ۷ روز اخیر شامل امروز (قدیمی‌ترین → جدیدترین) ──
    const week: { date: string; completed: number }[] = []
    const dayKeys = new Set<string>()
    for (let i = 6; i >= 0; i--) {
      const key = toDayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i))
      dayKeys.add(key)
      week.push({ date: key, completed: 0 })
    }
    for (const t of tasks) {
      if (!t.completed) continue
      // تقریب طبق قرارداد: روزِ تکمیل = روزِ آخرین به‌روزرسانی کارهای completed
      const key = toDayKey(t.updatedAt)
      if (!dayKeys.has(key)) continue
      const entry = week.find((w) => w.date === key)
      if (entry) entry.completed += 1
    }

    // ── categories: گروه‌بندی بر اساس دسته ──
    const categories = CATEGORIES.map((category) => {
      const inCategory = tasks.filter((t) => t.category === category)
      return {
        category,
        total: inCategory.length,
        completed: inCategory.filter((t) => t.completed).length,
      }
    })

    // ── priorities: تعداد کارهای ناتمام برای هر اولویت ──
    const priorities = PRIORITIES.map((priority) => ({
      priority,
      pending: tasks.filter((t) => t.priority === priority && !t.completed).length,
    }))

    // ── habits ──
    const completionsLast7 = await db.habitLog.count({ where: { date: { in: [...dayKeys] } } })
    const scheduledLast7 = habits.reduce((sum, h) => sum + h.targetPerWeek, 0)

    return NextResponse.json({
      today,
      totals,
      week,
      categories,
      priorities,
      habits: {
        active: habits.length,
        completionsLast7,
        scheduledLast7,
      },
    })
  } catch (err) {
    console.error('GET /api/stats failed:', err)
    return jsonError('Failed to compute stats', 500)
  }
}
