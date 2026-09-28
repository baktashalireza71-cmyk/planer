"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Plus,
  Pencil,
  MoreHorizontal,
  Trophy,
  CalendarClock,
  Minus,
  Flag,
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { SectionHeader, EmptyState, DeleteConfirm, Chip, ProgressRing, SectionSkeleton } from "./shared";
import { useGoals, useGoalMutations } from "@/hooks/use-planner";
import { CHEERFUL_COLORS, type Goal } from "@/lib/constants";
import { faNum, formatJalaliMedium, relativeDaysFa, dayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

export default function GoalsSection() {
  const { data: goals = [], isLoading } = useGoals();
  const { create, update, remove } = useGoalMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(g: Goal) {
    setEditing(g);
    setDialogOpen(true);
  }

  const completed = goals.filter((g) => g.current >= g.target).length;
  const avgPct = goals.length
    ? Math.round(goals.reduce((s, g) => s + Math.min(100, (g.current / Math.max(1, g.target)) * 100), 0) / goals.length)
    : 0;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="اهداف"
        subtitle="اهداف بزرگت را قدم‌به‌قدم جلو ببر"
        icon={Target}
        color="#10B981"
        action={
          <Button
            onClick={openNew}
            className="rounded-full bg-gradient-to-l from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/30 gap-1.5"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            هدف جدید
          </Button>
        }
      />

      {/* خلاصه */}
      {goals.length > 0 && (
        <div className="flex items-center gap-4 rounded-3xl bg-card p-4 card-glow">
          <ProgressRing value={avgPct} size={64} stroke={7} color="#10B981" track="rgba(16,185,129,0.2)">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-300">{faNum(avgPct)}٪</span>
          </ProgressRing>
          <div>
            <p className="text-sm font-extrabold">
              میانگین پیشرفت همه اهداف {faNum(avgPct)}٪
            </p>
            <p className="text-xs text-muted-foreground">
              {faNum(completed)} هدف از {faNum(goals.length)} هدف تکمیل شده
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <SectionSkeleton count={3} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          color="#10B981"
          title="هدفی تعریف نکردی هنوز!"
          description="یه هدف مشخص کن: مثلاً «خوندن ۱۰ کتاب» یا «۲۰ جلسه ورزش». پیشرفتش رو اینجا ببین."
          action={
            <Button
              size="sm"
              onClick={openNew}
              className="rounded-full bg-gradient-to-l from-emerald-500 to-green-500 text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
              ساخت اولین هدف
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {goals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.current / Math.max(1, goal.target)) * 100));
              const isDone = goal.current >= goal.target;
              const deadline = goal.deadline ? new Date(goal.deadline) : null;

              return (
                <motion.li
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={cn(
                    "rounded-3xl bg-card p-5 card-glow relative overflow-hidden",
                    isDone && "ring-2 ring-emerald-300 dark:ring-emerald-500/40"
                  )}
                >
                  {isDone && (
                    <div aria-hidden className="absolute -top-6 -left-6 h-20 w-20 rounded-full bg-emerald-100/80 blur-xl dark:bg-emerald-500/20" />
                  )}
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-extrabold">{goal.title}</p>
                        {isDone && (
                          <Chip className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 shrink-0">
                            <Trophy className="h-3 w-3" />
                            تکمیل شد!
                          </Chip>
                        )}
                      </div>
                      {goal.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-5">{goal.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(goal)} className="cursor-pointer gap-2">
                            <Pencil className="h-3.5 w-3.5" />
                            ویرایش
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DeleteConfirm
                        onConfirm={() =>
                          remove.mutate(goal.id, {
                            onSuccess: () => toast.success("هدف حذف شد"),
                            onError: (e) => toast.error(e.message),
                          })
                        }
                        title={`«${goal.title}» حذف شود؟`}
                      />
                    </div>
                  </div>

                  {/* پیشرفت */}
                  <div className="relative mt-4">
                    <div className="mb-1.5 flex items-end justify-between">
                      <span className="text-2xl font-black tabular-nums" style={{ color: goal.color }}>
                        {faNum(pct)}٪
                      </span>
                      <span className="text-xs font-bold text-muted-foreground tabular-nums">
                        {faNum(goal.current)} از {faNum(goal.target)} {goal.unit}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: isDone
                            ? "linear-gradient(90deg, #34D399, #10B981)"
                            : goal.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* کنترل پیشرفت */}
                  <div className="relative mt-4 flex items-center gap-2">
                    {!isDone ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            update.mutate(
                              { id: goal.id, current: Math.min(goal.target, goal.current + 1) },
                              { onError: (e) => toast.error(e.message) }
                            )
                          }
                          className="h-8 rounded-xl gap-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          یک قدم
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            update.mutate(
                              { id: goal.id, current: Math.min(goal.target, goal.current + 5) },
                              { onError: (e) => toast.error(e.message) }
                            )
                          }
                          className="h-8 rounded-xl gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                        >
                          <Flag className="h-3.5 w-3.5" />
                          {faNum(5)} قدم
                        </Button>
                        {goal.current > 0 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="کاهش پیشرفت"
                            onClick={() =>
                              update.mutate(
                                { id: goal.id, current: Math.max(0, goal.current - 1) },
                                { onError: (e) => toast.error(e.message) }
                              )
                            }
                            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-red-500"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          update.mutate(
                            { id: goal.id, current: 0 },
                            { onError: (e) => toast.error(e.message) }
                          )
                        }
                        className="h-8 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                      >
                        شروع دوباره
                      </Button>
                    )}
                    {deadline && (
                      <Chip
                        className={cn(
                          "ms-auto shrink-0",
                          deadline < new Date() && !isDone
                            ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <CalendarClock className="h-3 w-3" />
                        {formatJalaliMedium(deadline)}
                        {!isDone && ` (${relativeDaysFa(deadline)})`}
                      </Chip>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* ─── دیالوگ هدف ─── */}
      <GoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(values) => {
          if (editing) {
            update.mutate(
              { id: editing.id, ...values },
              {
                onSuccess: () => {
                  toast.success("هدف ویرایش شد");
                  setDialogOpen(false);
                },
                onError: (e) => toast.error(e.message),
              }
            );
          } else {
            create.mutate(values, {
              onSuccess: () => {
                toast.success("هدف جدید ساخته شد!");
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
//  دیالوگ هدف
// ─────────────────────────────────────────────
function GoalDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Goal | null;
  onSubmit: (values: {
    title: string;
    description?: string | null;
    target: number;
    current: number;
    unit: string;
    color: string;
    deadline?: string | null;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("100");
  const [current, setCurrent] = useState("0");
  const [unit, setUnit] = useState("%");
  const [color, setColor] = useState(CHEERFUL_COLORS[4]);
  const [deadline, setDeadline] = useState("");
  const [wasOpen, setWasOpen] = useState(false);

  if (open && !wasOpen) {
    setWasOpen(true);
    setTitle(editing?.title ?? "");
    setDescription(editing?.description ?? "");
    setTarget(String(editing?.target ?? 100));
    setCurrent(String(editing?.current ?? 0));
    setUnit(editing?.unit ?? "%");
    setColor(editing?.color ?? CHEERFUL_COLORS[4]);
    // dayKey ایمن‌تر از slice است؛ با منطقه‌زمانی روز جابه‌جا نمی‌شود
    setDeadline(editing?.deadline ? dayKey(new Date(editing.deadline)) : "");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const UNITS = ["%", "جلسه", "کتاب", "کیلومتر", "روز", "بار"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md rounded-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <Target className="h-4 w-4" />
            </span>
            {editing ? "ویرایش هدف" : "هدف جدید"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            const t = title.trim();
            if (!t) return;
            onSubmit({
              title: t,
              description: description.trim() || null,
              target: Math.max(1, parseInt(target) || 100),
              current: Math.max(0, parseInt(current) || 0),
              unit: unit.trim() || "%",
              color,
              deadline: deadline ? new Date(`${deadline}T12:00:00`).toISOString() : null,
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">عنوان هدف</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: خوندن ۱۰ کتاب در سال"
              autoFocus
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-desc">توضیحات (اختیاری)</Label>
            <Textarea
              id="goal-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="چرا این هدف برات مهمه؟"
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-target">مقدار هدف</Label>
              <Input
                id="goal-target"
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-current">پیشرفت فعلی</Label>
              <Input
                id="goal-current"
                type="number"
                min={0}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-unit">واحد</Label>
              <Input
                id="goal-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                list="goal-units"
                className="rounded-xl"
                placeholder="%"
              />
              <datalist id="goal-units">
                {UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>رنگ</Label>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {CHEERFUL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`رنگ ${c}`}
                    className={cn(
                      "h-7 w-7 rounded-full transition-all cursor-pointer ring-offset-2",
                      color === c ? "ring-2 ring-foreground/60 scale-110" : "hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-deadline">ضرب‌الاجل (اختیاری)</Label>
              <JalaliDatePicker
                id="goal-deadline"
                value={deadline || null}
                onChange={(k) => setDeadline(k ?? "")}
                clearable
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-l from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold shadow-lg shadow-emerald-500/25"
          >
            {editing ? "ذخیره تغییرات" : "ساخت هدف"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
