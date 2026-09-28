"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListTodo,
  Plus,
  Check,
  ChevronDown,
  CalendarClock,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import JalaliDatePicker from "./jalali-date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SectionHeader, EmptyState, DeleteConfirm, Chip, ProgressRing, SectionSkeleton } from "./shared";
import { useTasks, useTaskMutations } from "@/hooks/use-planner";
import {
  PRIORITIES,
  CATEGORIES,
  PRIORITY_LIST,
  CATEGORY_LIST,
  type Task,
  type Priority,
  type Category,
} from "@/lib/constants";
import { faNum, relativeDaysFa, dayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "today" | "overdue" | "done";

/** نسخه شب چیپ‌های ثابت constants — خوانا در تم شب */
const CAT_DARK: Record<Category, string> = {
  WORK: "dark:bg-orange-500/15 dark:text-orange-300",
  PERSONAL: "dark:bg-pink-500/15 dark:text-pink-300",
  STUDY: "dark:bg-purple-500/15 dark:text-purple-300",
  HEALTH: "dark:bg-emerald-500/15 dark:text-emerald-300",
  OTHER: "dark:bg-teal-500/15 dark:text-teal-300",
};
const PRI_DARK: Record<Priority, string> = {
  HIGH: "dark:bg-red-500/15 dark:text-red-300",
  MEDIUM: "dark:bg-amber-500/15 dark:text-amber-300",
  LOW: "dark:bg-teal-500/15 dark:text-teal-300",
};

const FILTERS: { key: FilterKey; label: string; color?: string }[] = [
  { key: "all", label: "همه" },
  { key: "today", label: "امروز" },
  { key: "overdue", label: "عقب‌افتاده", color: "#EF4444" },
  { key: "done", label: "انجام‌شده", color: "#14B8A6" },
];

export default function TasksSection() {
  const { data: tasks = [], isLoading } = useTasks();
  const { create, update, remove, addSubtask, updateSubtask, removeSubtask } = useTaskMutations();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [category, setCategory] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (category !== "ALL" && t.category !== category) return false;
      const due = t.dueDate ? new Date(t.dueDate) : null;
      switch (filter) {
        case "today":
          return due && due >= todayStart && due < tomorrowStart;
        case "overdue":
          return !t.completed && due && due < todayStart;
        case "done":
          return t.completed;
        default:
          return true;
      }
    });
  }, [tasks, filter, category, todayStart, tomorrowStart]);

  const doneCount = tasks.filter((t) => t.completed).length;
  const percent = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  // مرتب‌سازی: ناتمام اول، سپس فوری‌تر
  const sorted = useMemo(() => {
    const order: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return [...filtered].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pa = order[a.priority] - order[b.priority];
      if (pa !== 0) return pa;
      const da = a.dueDate ? +new Date(a.dueDate) : Infinity;
      const db = b.dueDate ? +new Date(b.dueDate) : Infinity;
      return da - db;
    });
  }, [filtered]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(task: Task) {
    setEditing(task);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="کارها"
        subtitle="لیست کارها را مدیریت کن و پیشرفتت را ببین"
        icon={ListTodo}
        color="#14B8A6"
        action={
          <Button
            onClick={openNew}
            className="rounded-full bg-gradient-to-l from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/30 gap-1.5"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            کار جدید
          </Button>
        }
      />

      {/* خلاصه پیشرفت + فیلترها */}
      <div className="rounded-3xl bg-card p-4 sm:p-5 card-glow">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <ProgressRing value={percent} size={64} stroke={7} color="#14B8A6" track="rgba(20,184,166,0.2)">
              <span className="text-xs font-black text-teal-600 dark:text-teal-300">{faNum(percent)}٪</span>
            </ProgressRing>
            <div>
              <p className="text-sm font-extrabold">{faNum(doneCount)} از {faNum(tasks.length)} کار انجام شد</p>
              <p className="text-[11px] text-muted-foreground">ادامه بده، داری می‌ترکونی!</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ms-auto">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border",
                  filter === f.key
                    ? "bg-teal-500 text-white border-transparent shadow-md shadow-teal-500/25 [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]"
                    : "bg-background text-muted-foreground border-border hover:border-teal-300 hover:text-teal-600"
                )}
              >
                {f.label}
              </button>
            ))}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger size="sm" className="w-[110px] rounded-full text-xs font-bold border-border bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">همه دسته‌ها</SelectItem>
                {CATEGORY_LIST.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORIES[c].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* لیست کارها */}
      {isLoading ? (
        <SectionSkeleton count={4} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          color="#14B8A6"
          title={filter === "done" ? "هنوز کاری انجام ندادی" : "لیست کارت خالیه!"}
          description="با دکمه «کار جدید» اولین کارت را بساز و حس خوب تیک‌زدن را تجربه کن."
          action={
            <Button
              size="sm"
              onClick={openNew}
              className="rounded-full bg-gradient-to-l from-teal-500 to-emerald-500 text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
              کار جدید
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {sorted.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => update.mutate({ id: task.id, completed: !task.completed })}
                onEdit={() => openEdit(task)}
                onDelete={() => {
                  remove.mutate(task.id, {
                    onSuccess: () => toast.success("کار حذف شد"),
                    onError: (e) => toast.error(e.message),
                  });
                }}
                onAddSubtask={(title) =>
                  addSubtask.mutate(
                    { taskId: task.id, title },
                    { onError: (e) => toast.error(e.message) }
                  )
                }
                onToggleSubtask={(subId, done) => updateSubtask.mutate({ id: subId, done })}
                onRemoveSubtask={(subId) => removeSubtask.mutate(subId)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* دیالوگ افزودن/ویرایش */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        onSubmit={(values) => {
          if (editing) {
            update.mutate(
              { id: editing.id, ...values },
              {
                onSuccess: () => {
                  toast.success("کار ویرایش شد");
                  setDialogOpen(false);
                },
                onError: (e) => toast.error(e.message),
              }
            );
          } else {
            create.mutate(values, {
              onSuccess: () => {
                toast.success("کار جدید اضافه شد!");
                setDialogOpen(false);
              },
              onError: (e) => toast.error(e.message),
            });
          }
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  کارت کار
// ─────────────────────────────────────────────
function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onRemoveSubtask,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubtask: (title: string) => void;
  onToggleSubtask: (id: string, done: boolean) => void;
  onRemoveSubtask: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [subTitle, setSubTitle] = useState("");

  const priority = PRIORITIES[task.priority];
  const category = CATEGORIES[task.category];
  const CatIcon = category.icon;
  const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < todayStart;
  const doneSubs = task.subtasks.filter((s) => s.done).length;

  return (
    <motion.li
      layout
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-3xl bg-card card-glow overflow-hidden border-r-4",
        task.completed ? "border-r-teal-400" : task.priority === "HIGH" ? "border-r-red-400" : task.priority === "MEDIUM" ? "border-r-amber-400" : "border-r-teal-300"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={onToggle}
          aria-label={task.completed ? "ناتمام کردن" : "انجام شدن"}
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all cursor-pointer active:scale-90",
            task.completed
              ? "border-transparent bg-gradient-to-br from-teal-400 to-emerald-500 text-white shadow-md shadow-teal-500/30"
              : "border-teal-300 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-500/10"
          )}
        >
          {task.completed && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-bold leading-6 break-words cursor-pointer",
              task.completed && "line-through text-muted-foreground"
            )}
            onClick={onToggle}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground leading-5 line-clamp-2">{task.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Chip className={cn(category.bg, category.color, CAT_DARK[task.category])}>
              <CatIcon className="h-3 w-3" />
              {category.label}
            </Chip>
            <Chip className={cn(priority.bg, priority.color, PRI_DARK[task.priority])}>{priority.label}</Chip>
            {task.dueDate && (
              <Chip
                className={cn(
                  "gap-1",
                  isOverdue ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300" : "bg-muted text-muted-foreground"
                )}
              >
                <CalendarClock className="h-3 w-3" />
                {relativeDaysFa(new Date(task.dueDate))}
              </Chip>
            )}
            {task.subtasks.length > 0 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-600 hover:bg-purple-100 cursor-pointer transition-colors dark:bg-purple-500/15 dark:text-purple-300 dark:hover:bg-purple-500/25"
              >
                زیرکارها {faNum(doneSubs)}/{faNum(task.subtasks.length)}
                <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
              </button>
            )}
          </div>

          {/* زیرکارها */}
          <AnimatePresence>
            {expanded && task.subtasks.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <ul className="mt-3 space-y-1.5 border-t border-dashed border-border pt-3">
                  {task.subtasks.map((s) => (
                    <li key={s.id} className="group flex items-center gap-2">
                      <button
                        onClick={() => onToggleSubtask(s.id, !s.done)}
                        aria-label={s.done ? "ناتمام کردن زیرکار" : "انجام زیرکار"}
                        className={cn(
                          "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-all cursor-pointer",
                          s.done ? "border-transparent bg-purple-500 text-white" : "border-purple-300 hover:border-purple-500"
                        )}
                      >
                        {s.done && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                      </button>
                      <span className={cn("text-xs font-medium", s.done && "line-through text-muted-foreground")}>
                        {s.title}
                      </span>
                      <button
                        onClick={() => onRemoveSubtask(s.id)}
                        aria-label="حذف زیرکار"
                        className="ms-auto text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-red-500 cursor-pointer transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* افزودن زیرکار */}
          {expanded && (
            <form
              className="mt-2.5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const t = subTitle.trim();
                if (!t) return;
                onAddSubtask(t);
                setSubTitle("");
              }}
            >
              <Input
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
                placeholder="زیرکار جدید..."
                className="h-8 rounded-xl bg-background text-xs"
              />
              <Button type="submit" size="icon" className="h-8 w-8 shrink-0 rounded-xl bg-purple-500 hover:bg-purple-600 text-white">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>

        {/* منو */}
        <div className="flex shrink-0 items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit} className="cursor-pointer gap-2">
                <Pencil className="h-3.5 w-3.5" />
                ویرایش
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DeleteConfirm
            onConfirm={onDelete}
            title={`«${task.title}» حذف شود؟`}
            description="این کار و همه زیرکارهایش حذف می‌شوند."
          />
        </div>
      </div>
    </motion.li>
  );
}

// ─────────────────────────────────────────────
//  دیالوگ کار
// ─────────────────────────────────────────────
function TaskDialog({
  open,
  onOpenChange,
  task,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: Task | null;
  onSubmit: (values: {
    title: string;
    description?: string | null;
    priority: Priority;
    category: Category;
    dueDate?: string | null;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [category, setCategory] = useState<Category>("PERSONAL");
  const [dueDate, setDueDate] = useState("");
  const [key, setKey] = useState(0);

  // هنگام باز شدن دیالوگ، مقادیر را ست کن
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "MEDIUM");
    setCategory(task?.category ?? "PERSONAL");
    // dayKey ایمن‌تر از slice است؛ با منطقه‌زمانی روز جابه‌جا نمی‌شود
    setDueDate(task?.dueDate ? dayKey(new Date(task.dueDate)) : "");
    setKey((k) => k + 1);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md rounded-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300">
              <ListTodo className="h-4 w-4" />
            </span>
            {task ? "ویرایش کار" : "کار جدید"}
          </DialogTitle>
        </DialogHeader>
        <form
          key={key}
          className="space-y-4 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            const t = title.trim();
            if (!t) return;
            onSubmit({
              title: t,
              description: description.trim() || null,
              priority,
              category,
              dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null,
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="task-title">عنوان</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: تمام کردن گزارش پروژه"
              autoFocus
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">توضیحات (اختیاری)</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="جزئیات کار..."
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>اولویت</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY_LIST.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "rounded-xl border-2 py-2 text-xs font-bold transition-all cursor-pointer",
                    priority === p ? "border-transparent text-white shadow-md [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]" : "border-border bg-background text-muted-foreground hover:border-foreground/20"
                  )}
                  style={priority === p ? { backgroundColor: PRIORITIES[p].dot } : undefined}
                >
                  {PRIORITIES[p].label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>دسته‌بندی</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_LIST.map((c) => {
                    const Icon = CATEGORIES[c].icon;
                    return (
                      <SelectItem key={c} value={c}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" style={{ color: "#F97316" }} />
                          {CATEGORIES[c].label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">سررسید (اختیاری)</Label>
              <JalaliDatePicker
                id="task-due"
                value={dueDate || null}
                onChange={(k) => setDueDate(k ?? "")}
                clearable
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-l from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold shadow-lg shadow-teal-500/25"
          >
            {task ? "ذخیره تغییرات" : "افزودن کار"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
