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

---
Task ID: 3-c
Agent: general-purpose
Task: افزودن ساعت زنده (ساعت دیجیتال فارسی) به کارت خوش‌آمد داشبورد، کارت «امروز» سایدبار دسکتاپ و هدر موبایل

Work Log:
- خواندن worklog.md و فایل‌های اجباری: src/hooks/use-clock.ts (useNow هویدریشن‌سازگار) و src/lib/date.ts (formatClockFa، faNum، formatJalaliFull، toJalali)
- dashboard.tsx: import های Clock (lucide)، useNow و formatClockFa اضافه شد؛ در کارت گرادیانی خوش‌آمد، یک چیپ شیشه‌ای `bg-white/20 backdrop-blur rounded-full px-3 py-1.5 text-xs sm:text-sm font-bold text-white flex items-center gap-1.5` کنار ردیف سلام («صبح بخیر» و...) قرار گرفت با آیکون Clock (h-3.5 w-3.5) و زمان زنده با ثانیه؛ رندر با `liveNow ? formatClockFa(liveNow, true) : "۰۰:۰۰:۰۰"` (هیچ new Date() جدیدی برای نمایش ساعت ساخته نشد) و کلاس `tabular-nums` روی متن زمان برای جلوگیری از لرزش ارقام؛ به ردیف سلام فقط `flex-wrap` اضافه شد تا در موبایل امن باشد — ساختار کارت دست‌نخورده ماند
- app-shell.tsx: import های Clock، useNow، formatClockFa و JALALI_MONTHS (به‌جای آرایه inline ماه‌ها — همان محتوا) اضافه شد؛ `const liveNow = useNow();` در AppShell
  - کارت «امروز» پایین سایدبار دسکتاپ: بالای کارت ساعت دیجیتال بزرگ اضافه شد — برچسب «ساعت» (text-[11px] font-bold) و زمان `formatClockFa(liveNow, true)` با `text-2xl font-black tabular-nums`؛ تاریخ شمسی «امروز» زیر آن حفظ شد با منطق `{liveNow ? formatJalaliFull(liveNow) : \`${faNum(jd)} ...\`}` (liveNow جایگزین mounted شد تا تاریخ همیشه تازه بماند)؛ خط «یک روز خوب در انتظار توست ☀» حفظ شد؛ `jd, jm, jy` از toJalali(today) برای fallback بدون هیدریشن باقی است
  - هدر موبایل (lg:hidden): چیپ تاریخ ثابت داخل یک کانتینر `flex items-center gap-2` قرار گرفت و یک چیپ دوم هم‌سبک (bg-white/80 backdrop-blur border-orange-100 ...) با آیکون Clock و `{liveNow ? formatClockFa(liveNow) : "۰۰:۰۰"}` + tabular-nums کنار آن اضافه شد؛ زیرنویس پلنر (mounted ? formatJalaliFull(today) : "…") دست‌نخورده ماند
- رعایت قواعد: هیچ فایل دیگری تغییر نکرد، وابستگی جدیدی اضافه نشد، همه متن‌ها فارسی، dev server اجرا نشد

Stage Summary:
- سه نقطه‌گذاری ساعت زنده کامل شد: چیپ شیشه‌ای داخل هیرو داشبورد (با ثانیه)، ساعت دیجیتال بزرگ بالای کارت «امروز» سایدبار، و چیپ ساعت کنار چیپ تاریخ در هدر موبایل (بدون ثانیه)
- هم‌ترازی با use-clock.ts: در SSR و اولین رندر کلاینت «۰۰:۰۰:۰۰» / «۰۰:۰۰» ثابت نمایش داده می‌شود (بدون mismatch)، سپس به‌روزرسانی هر ثانیه؛ ارقام با tabular-nums پایدارند
- تأیید: `bun run lint` بدون خطا/هشدار جدید؛ `npx tsc --noEmit` فقط خطاهای قدیمی examples/ و skills/ (مستند در Task 2-a) — صفر خطای جدید در دو فایل تغییر‌یافته

---

Task ID: 3-a
Agent: general-purpose
Task: حذف ورودی‌های میلادی type="date" از دیالوگ کار و هدف و جایگزینی با تقویم شمسی (JalaliDatePicker)

Work Log:
- خواندن worklog.md، src/lib/date.ts و کامپوننت آماده jalali-date-picker.tsx برای درک قرارداد مقدار (کلید میلادی YYYY-MM-DD با نمایش کاملاً شمسی)
- tasks-section.tsx: جایگزینی کامل Input میلادی «سررسید (اختیاری)» در TaskDialog با JalaliDatePicker (value={dueDate || null}، onChange={(k) => setDueDate(k ?? "")}، clearable) با حفظ Label
- tasks-section.tsx: ایمن‌سازی مقداردهی اولیه در open-effect — تبدیل task.dueDate.slice(0, 10) به dayKey(new Date(task.dueDate)) تا برای ساعت‌های نزدیک نیمه‌شب UTC روز جابه‌جا نشود (کامنت فارسی اضافه شد)
- tasks-section.tsx: افزودن import JalaliDatePicker از "./jalali-date-picker" و افزودن dayKey به import موجود از "@/lib/date" (faNum, relativeDaysFa, dayKey)
- goals-section.tsx: جایگزینی Input میلادی «ضرب‌الاجل (اختیاری)» در GoalDialog با JalaliDatePicker (همان الگوی بالا با clearable) با حفظ Label
- goals-section.tsx: تبدیل editing.deadline.slice(0, 10) به dayKey(new Date(editing.deadline)) در open-effect (کامنت فارسی)
- goals-section.tsx: افزودن import JalaliDatePicker و افزودن dayKey به import موجود از "@/lib/date"
- بررسی شد که Input در هر دو فایل هنوز استفاده می‌شود (زیرکار/عنوان کار در tasks؛ عنوان/مقدار/پیشرفت/واحد در goals) پس import آن حذف نشد
- هندلر submit دست‌نخورده ماند: تبدیل `${dueDate}T12:00:00` به ISO با ساعت ۱۲ ظهر برای پایداری منطقه‌زمانی
- تأیید نهایی: هیچ type="date" در این دو فایل باقی نمانده است (تنها مورد باقی‌مانده در calendar-section.tsx است که خارج از محدوده این تسک بود)
- `bun run lint` بدون هیچ خطا/هشدار؛ `npx tsc --noEmit` فقط خطاهای قدیمی و بی‌ربط در examples/ و skills/ دارد — صفر خطا در src/components/planner

Stage Summary:
- هر دو دیالوگ کار و هدف اکنون کاملاً با تقویم شمسی کار می‌کنند: نمایش، انتخاب، تعطیلات قرمز، «برو به امروز» و دکمه «حذف تاریخ»
- قرارداد ذخیره‌سازی بک‌اند بدون تغییر ماند (کلید میلادی YYYY-MM-DD → ISO با T12:00:00)؛ فقط لایه UI شمسی شد
- رفع پنهان باگ منطقه‌زمانی: خواندن dueDate/deadline از API دیگر با slice(0, 10) روز را نمی‌پراند (dayKey روی Date محلی)
- فایل‌های تغییر‌یافته: src/components/planner/tasks-section.tsx و src/components/planner/goals-section.tsx — بدون تغییر فایل دیگر

---
Task ID: 3-b
Agent: general-purpose
Task: ارتقای تقویم با تعطیلات رسمی ایران + حذف input میلادی از دیالوگ رویداد

Work Log:
- خواندن worklog.md، lib/date.ts، lib/iran-holidays.ts و jalali-date-picker.tsx قبل از شروع
- شبکه ماه: monthHolidays با useMemo و getHolidaysInRange(از اول تا آخر ماه شمسی نمای جاری)؛ در هر خانه day-cell مقدار holiday و isFriday محاسبه می‌شود
- شماره روز تعطیل (رسمی یا جمعه، غیر از انتخاب‌شده/امروز) با text-red-500 (داخل span تا با muted روزهای گذشته تداخل نکند)؛ استایل انتخاب (متن سفید) و امروز حفظ شد
- title روی دکمه روز: «عنوان تعطیلی — تاریخ قمری» برای نمایش hover
- تعطیلات غیرجمعه: نقطه قرمز bg-red-400 در absolute top-1 (وسط افقی) متمایز از نقطه‌های رویداد/سررسید پایین خانه
- لِجند پایین تقویم: آیتم «تعطیل رسمی» با دایره bg-red-400 اضافه شد (آیتم‌های قبلی حفظ شدند)
- پنل روز انتخابی: اگر getIranianHoliday(selected) تعطیلی داشته باشد باکس rounded-2xl bg-red-50 border-red-100 text-red-700 با عنوان font-extrabold + تاریخ قمری text-[11px] زیر عنوان نمایش داده می‌شود؛ در غیر این صورت اگر جمعه باشد چیپ خاکستری «جمعه» کنار عنوان
- بخش «تعطیلات پیش‌رو» با upcomingIranianHolidays(new Date(), 4) (useMemo با deps خالی) بعد از بلوک‌های شرطی (خارج از ternary) در همان سکشن: border-t border-dashed pt-3 mt-4، تیتر با آیکون قرمز CalendarHeart و text-[12px] font-extrabold، ردیف‌ها با نقطه قرمز + عنوان truncate 13px bold + formatJalaliShort + چیپ relativeDaysFa — حتی در حالت EmptyState هم دیده می‌شود
- دیالوگ رویداد: جایگزینی Input type="date" با JalaliDatePicker (value={date || null} و onChange={k => setDate(k ?? "")}) با حفظ Label «تاریخ»؛ init باز شدن با dayKey(editing ? new Date(editing.date) : defaultDate)؛ ارسال زمان‌بندی «ساعت» و تبدیل `${date}T12:00:00` تغییر نکرد؛ import Input به‌خاطر فیلد عنوان باقی ماند
- فقط calendar-section.tsx ویرایش شد؛ dev server اجرا نشد

Stage Summary:
- lint (bun run lint): بدون خطا؛ tsc --noEmit: فقط خطاهای قدیمی examples/ و skills/ (مرتبط با calendar-section: صفر)
- دیالوگ رویداد دیگر هیچ type="date" ندارد (فقط type="time" برای ساعت باقی است) و تاریخ با تقویم شمسی JalaliDatePicker انتخاب می‌شود
- تعطیلات رسمی (خورشیدی + قمری) در شبکه ماه، پنل روز، لجند و لیست پیش‌رو با قرمز نمایش داده می‌شوند و theme بنفش تقویم حفظ شده است

---
Task ID: 3
Agent: main (Z.ai Code) + subagents 3-a/3-b/3-c
Task: حذف کامل تقویم میلادی، ساعت زنده، و تعطیلات دقیق رسمی ایران

Work Log:
- تحقیق وب (timeanddate.com/holidays/iran سال‌های 2025/2026/2027 + منابع فارسی): استخراج تاریخ دقیق همه تعطیلات قمری رسمی ایران
- کشف مهم: «عزای عمومی» اسفند ۱۴۰۴ و ۱۵ تیر ۱۴۰۵ رویدادهای یک‌باره بودند (نه تعطیلات تکرارشونده) و در دیتاست ثابت قرار نگرفتند
- صحت‌سنجی: تبدیل jalaali-js با تقویم رسمی (۱ فروردین ۱۴۰۴ = ۲۱ مارس ۲۰۲۵) سازگار است؛ عید فطر ۱۴۰۴ = ۱۱-۱۲ فروردین ✓
- ساخت src/lib/iran-holidays.ts: تعطیلات خورشیدی ثابت (۱۰ روز ملی) + جدول قمری سال‌به‌سال (۴۲ رکورد، ۱۴۴۶-۱۴۵۱ = شمسی ۱۴۰۳ تا ۱۴۰۶) با تاریخ قمری متن هر تعطیلی
- ساخت src/hooks/use-clock.ts: هوک ساعت زنده hydration-safe با useSyncExternalStore
- افزودن dateFromDayKey و formatClockFa به lib/date.ts
- ساخت src/components/planner/jalali-date-picker.tsx: پاپ‌اور تقویم شمسی (جمعه/تعطیل قرمز، tooltip عنوان تعطیلی، ناوبری ماه، دکمه امروز، قابل پاک‌کردن)
- زیرعامل 3-a: جایگزینی input type=date در دیالوگ کار و هدف با پیکر شمسی + رفع باگ timezone در slice(0,10) با dayKey
- زیرعامل 3-b: تقویم شمسی = روزهای تعطیل قرمز + نقطه سرخ + legend «تعطیل رسمی» + بج تعطیلی و تاریخ قمری در پنل روز + بخش «تعطیلات پیش‌رو» (۴ مورد با شمارش معکوس) + دیالوگ رویداد با پیکر شمسی
- زیرعامل 3-c: ساعت زنده با ثانیه در کارت خوش‌آمد داشبورد (chip شیشه‌ای)، ساعت بزرگ در کارت «امروز» سایدبار دسکتاپ، chip ساعت در هدر موبایل
- پاک‌سازی: حذف CSS input[type=date]، حذف کامپوننت ui/calendar.tsx (react-day-picker میلادی، استفاده‌نشده)
- تست مرورگر (Agent Browser): داشبورد/تقویم/دیالوگ کار-رویداد-هدف/موبایل 390px — ساعت در حال تیک، تعطیلات اسفند ۱۴۰۵ (۹،۱۹،۲۰) + ۲۹ اسفند ملی شدن نفت قرمز ✓
- تست انتها-به-انتها: رویداد روی ۲۰ مهر ۱۴۰۵ ذخیره شد = 2026-10-12 در API ✓، کار با «۲۳ روز مانده» ✓
- پاک‌سازی داده‌های تست؛ کنسول بدون خطا؛ lint و tsc پاس

Stage Summary:
- کل اپلیکیشن ۱۰۰٪ شمسی است: هیچ input type=date میلادی در کل src وجود ندارد
- تعطیلات رسمی ایران دقیق: خورشیدی (همیشگی) + قمری تا پایان ۱۴۰۶؛ برای سال‌های بعد فقط افزودن ردیف به LUNAR_HOLIDAYS
- ساعت زنده در ۳ نقطه: هرو داشبورد، سایدبار دسکتاپ، هدر موبایل
- فایل‌های جدید: src/lib/iran-holidays.ts، src/hooks/use-clock.ts، src/components/planner/jalali-date-picker.tsx
