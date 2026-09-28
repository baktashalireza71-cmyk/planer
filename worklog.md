# Worklog - پروژه پلنر حرفه‌ای فارسی (Persian Planner)

---

Task ID: 1
Agent: main (Z.ai Code)
Task: تحقیق، طراحی schema دیتابیس و راه‌اندازی اولیه

Work Log:
- تحقیق وب درباره بهترین اپ‌های پلنر (Todoist, TickTick, Sunsama, HabitNow)
- نتیجه تحقیق: بخش‌های ضروری = Dashboard روزانه، Tasks با اولویت/زیرکار، تقویم، Habit Tracker با استریک، Goals، Notes، آمار
- طراحی schema.prisma با ۶ مدل: Task, Subtask, Habit, HabitLog, Goal, Note, Event
- push موفق schema به SQLite با `bun run db:push`

Stage Summary:
- مدل‌های دیتابیس آماده هستند. قرارداد API برای Task 2-a:
  - Tasks: GET/POST /api/tasks , PATCH/DELETE /api/tasks/[id], POST /api/tasks/[id]/subtasks, PATCH/DELETE /api/subtasks/[id]
  - Habits: GET/POST /api/habits, PATCH/DELETE /api/habits/[id], POST /api/habits/[id]/toggle {date:"YYYY-MM-DD"}
  - Goals: GET/POST /api/goals, PATCH/DELETE /api/goals/[id]
  - Notes: GET/POST /api/notes, PATCH/DELETE /api/notes/[id]
  - Events: GET/POST /api/events, PATCH/DELETE /api/events/[id]
  - Stats: GET /api/stats (آمار تجمیعی)
- Task: id, title, description?, completed, priority(LOW|MEDIUM|HIGH), category(WORK|PERSONAL|STUDY|HEALTH|OTHER), dueDate?, subtasks[]
- Habit: id, title, icon(lucide name), color(hex), targetPerWeek, logs[{date}]
- Goal: id, title, description?, target, current, unit, color, deadline?
- Note: id, title, content, color, pinned
- Event: id, title, date(DateTime), time?, color, note?

---

Task ID: 2-a
Agent: full-stack-developer
Task: پیاده‌سازی کامل Backend API پلنر (Tasks, Subtasks, Habits, Goals, Notes, Events, Stats) طبق قرارداد API

Work Log:
- خواندن worklog.md و prisma/schema.prisma برای تطبیق دقیق با مدل‌ها
- ساخت فایل کمکی مشترک `src/app/api/_lib/helpers.ts`: jsonError، readJsonBody (پارس امن JSON)، parseDateField (اعتبارسنجی ISO با isNaN)، isDayKey برای "YYYY-MM-DD"، isInt/isOneOf/isNonEmptyString، toDayKey برای تاریخ محلی
- پیاده‌سازی ۱۴ فایل route در `src/app/api/` دقیقاً طبق قرارداد (همه با `export const dynamic = 'force-dynamic'` و params به‌صورت Promise مطابق Next.js 16)
- Tasks: GET با include subtasks و ترتیب (ناتمام اول ← dueDate صعودی با nulls last ← createdAt نزولی — به‌دلیل عدم پشتیبانی Prisma/SQLite از nulls last، مرتب‌سازی در حافظه انجام می‌شود)، POST با اعتبارسنجی title/priority/category/dueDate؛ PATCH جزئی (فقط فیلدهای ارسالی)؛ DELETE با cascade زیرکارها؛ POST زیرکار با 404 برای کار ناموجود؛ PATCH/DELETE زیرکار
- Habits: GET/POST با include logs (مرتب بر اساس تاریخ)، PATCH/DELETE، و POST toggle با فرمت سخت‌گیرانه "YYYY-MM-DD" (رد تاریخ‌های نامعتبر مثل 2024-02-31) و استفاده از unique ترکیبی habitId_date برای toggle
- Goals/Notes/Events: GET/POST و PATCH/DELETE با اعتبارسنجی فیلدها؛ Notes مرتب‌شده pinned DESC سپس updatedAt DESC؛ Events با فیلتر اختیاری start/end (400 برای ISO نامعتبر) و مرتب‌سازی date ASC
- Stats: محاسبه today (dueDate در امروز به‌وقت محلی سرور)، totals (tasks/pending/overdue/doneAll)، week (۷ روز اخیر شامل امروز بر اساس updatedAt کارهای completed)، categories برای هر ۵ دسته، priorities برای هر ۳ اولویت، habits (active، completionsLast7 با IN روی کلیدهای ۷ روز، scheduledLast7 = مجموع targetPerWeek)
- خطاها: 400 برای body/فیلد نامعتبر، 404 برای رکورد ناموجود، 500 با try/catch برای خطاهای سرور — همیشه `{ error: "..." }`
- `bun run lint` پاس (بدون خطا)؛ `tsc --noEmit` نیز صفر خطا در src/app/api (خطاهای موجود فقط در examples/ و skills/ قدیمی هستند)
- Smoke-test کامل همه endpointها با curl روی dev server (POST/PATCH/DELETE/toggle/filter/stats و حالت‌های خطا) و پاک‌سازی کامل داده‌های تست تا DB تمیز بماند

Stage Summary:
- همه ۱۴ endpoint مطابق قرارداد پیاده‌سازی و تست شدند؛ lint و typecheck پاس هستند
- قرارداد نهایی برای فرانت‌اند (Task 2-b):
  - GET/POST /api/tasks، GET خروجی مرتب‌شده شامل subtasks؛ POST وضعیت 201 برمی‌گرداند
  - PATCH/DELETE /api/tasks/[id] (DELETE → `{ success: true }`)
  - POST /api/tasks/[id]/subtasks، PATCH/DELETE /api/subtasks/[id]
  - GET/POST /api/habits، PATCH/DELETE /api/habits/[id]، POST /api/habits/[id]/toggle {date:"YYYY-MM-DD"} → عادت کامل با logs برمی‌گردد
  - GET/POST /api/goals، PATCH/DELETE /api/goals/[id]
  - GET/POST /api/notes، PATCH/DELETE /api/notes/[id]
  - GET /api/events?start=ISO&end=ISO (اختیاری)، POST/PATCH/DELETE
  - GET /api/stats با ساختار {today, totals, week, categories, priorities, habits}
- نکته: targetPerWeek باید عدد صحیح ۱ تا ۷ باشد (400 در غیر این صورت)؛ ارسال null برای date در Event وضعیت 400 می‌دهد (فیلد اجباری است)

---
Task ID: 2-b
Agent: main (Z.ai Code)
Task: ساخت فرانت‌اند کامل پلنر فارسی (دیزاین شاد، RTL، ریسپانسیو)

Work Log:
- دیزاین سیستم: globals.css با پالت گرم شاد (نارنجی/صورتی/فیروزه‌ای/بنفش)، فونت Vazirmatn، اسکرول‌بار گرادیانی، کلاس‌های کمکی
- layout.tsx: RTL کامل (lang=fa dir=rtl)، متادیتای فارسی، viewport themeColor
- lib/date.ts: تقویم شمسی با jalaali-js، اعداد فارسی، تاریخ نسبی، نقل‌قول‌های انگیزشی
- lib/constants.ts: تایپ‌ها + دسته‌بندی/اولویت/رنگ/آیکون عادت
- lib/api-client.ts: کلاینت API تایپ‌دار کامل
- hooks/use-planner.ts: هوک‌های TanStack Query برای همه موجودیت‌ها + mutation ها
- کامپوننت‌ها: app-shell (سایدبار دسکتاپ + باتم‌ناو موبایل + انیمیشن‌های framer-motion)، dashboard، tasks-section (فیلتر/زیرکار/دیالوگ)، calendar-section (تقویم شمسی کامل با رویداد)، habits-section (استریک + شبکه هفتگی)، goals-section (پیشرفت + دکمه‌های سریع)، notes-section (استیکی‌نوت سنجاق‌دار)، stats-section (BarChart + Donut + KPI)
- تولید تصویر هيرو با AI (public/hero-planner.png)
- رفع خطاهای lint (set-state-in-effect با useSyncExternalStore، static-components با کامپوننت GreetingIcon)
- رفع import جالالی-js v2 (named exports)
- تأیید با Agent Browser: ساخت کار/تیک‌زدن، ساخت عادت/تیک امروز/استریک، افزودن رویداد روی تقویم، هدف با پیشرفت ۵۰٪، یادداشت سنجاق‌دار، آمار با نمودارها — همه سالم
- تست موبایل 390px: باتم‌ناو، تقویم، کارت‌ها — همه ریسپانسیو
- رفع هشدارهای aria-describedby دیالوگ‌ها؛ کنسول نهایی: ۰ خطا/هشدار

Stage Summary:
- اپ پلنر کامل و آماده دیپلوی: ۷ بخش (خانه/کارها/تقویم/عادت‌ها/اهداف/یادداشت‌ها/آمار)
- فایل‌های کلیدی: src/components/planner/* , src/lib/* , src/hooks/use-planner.ts , src/app/*
- برای گیت‌هاب: README و کد کامنت‌شده فارسی؛ اسکیما در prisma/schema.prisma
