"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, Plus, Pin, PinOff, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SectionHeader, EmptyState, DeleteConfirm, SectionSkeleton } from "./shared";
import { useNotes, useNoteMutations } from "@/hooks/use-planner";
import { NOTE_COLORS, type Note } from "@/lib/constants";
import { faNum } from "@/lib/date";
import { cn } from "@/lib/utils";

function relativeFa(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "همین حالا";
  if (mins < 60) return `${faNum(mins)} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${faNum(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${faNum(days)} روز پیش`;
}

export default function NotesSection() {
  const { data: notes = [], isLoading } = useNotes();
  const { create, update, remove } = useNoteMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="یادداشت‌ها"
        subtitle="ایده‌ها و یادداشت‌های سریعت رو اینجا نگه دار"
        icon={StickyNote}
        color="#F59E0B"
        action={
          <Button
            onClick={openNew}
            className="rounded-full bg-gradient-to-l from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg shadow-amber-500/30 gap-1.5"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            یادداشت جدید
          </Button>
        }
      />

      {isLoading ? (
        <SectionSkeleton count={3} />
      ) : notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          color="#F59E0B"
          title="هنوز یادداشتی نداری!"
          description="ایده‌ای به ذهنت رسید؟ همین‌جا بنویسش تا یادت نره. یادداشت‌ها رو می‌تونی سنجاق کنی."
          action={
            <Button
              size="sm"
              onClick={openNew}
              className="rounded-full bg-gradient-to-l from-amber-500 to-yellow-500 text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
              اولین یادداشت
            </Button>
          }
        />
      ) : (
        <div className="columns-1 sm:columns-2 xl:columns-3 gap-4 [column-fill:_balance]">
          <AnimatePresence initial={false}>
            {notes.map((note, i) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="mb-4 break-inside-avoid"
              >
                <div
                  className={cn(
                    "group relative rounded-2xl p-4 shadow-md transition-all hover:shadow-xl hover:-translate-y-0.5",
                    i % 3 === 1 ? "rotate-[0.6deg]" : i % 3 === 2 ? "-rotate-[0.5deg]" : ""
                  )}
                  style={{ backgroundColor: note.color }}
                >
                  {/* سنجاق */}
                  <button
                    onClick={() =>
                      update.mutate(
                        { id: note.id, pinned: !note.pinned },
                        { onError: (e) => toast.error(e.message) }
                      )
                    }
                    aria-label={note.pinned ? "برداشتن سنجاق" : "سنجاق کردن"}
                    className={cn(
                      "absolute -top-2 start-4 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all cursor-pointer active:scale-90",
                      note.pinned
                        ? "bg-red-500 text-white rotate-12"
                        : "bg-white text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500"
                    )}
                  >
                    {note.pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                  </button>

                  <h3 className="pe-6 text-sm font-extrabold text-stone-800">{note.title}</h3>
                  {note.content && (
                    <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-stone-700/90">
                      {note.content}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-stone-500">
                      {relativeFa(note.updatedAt)}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(note);
                          setDialogOpen(true);
                        }}
                        aria-label="ویرایش"
                        className="h-7 w-7 rounded-lg text-stone-500 hover:bg-white/60 hover:text-stone-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <DeleteConfirm
                        onConfirm={() =>
                          remove.mutate(note.id, {
                            onSuccess: () => toast.success("یادداشت حذف شد"),
                            onError: (e) => toast.error(e.message),
                          })
                        }
                        title={`«${note.title}» حذف شود؟`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ─── دیالوگ یادداشت ─── */}
      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(values) => {
          if (editing) {
            update.mutate(
              { id: editing.id, ...values },
              {
                onSuccess: () => {
                  toast.success("یادداشت ذخیره شد");
                  setDialogOpen(false);
                },
                onError: (e) => toast.error(e.message),
              }
            );
          } else {
            create.mutate(values, {
              onSuccess: () => {
                toast.success("یادداشت اضافه شد!");
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
//  دیالوگ یادداشت
// ─────────────────────────────────────────────
function NoteDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Note | null;
  onSubmit: (values: { title: string; content: string; color: string; pinned: boolean }) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0].value);
  const [pinned, setPinned] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);

  if (open && !wasOpen) {
    setWasOpen(true);
    setTitle(editing?.title ?? "");
    setContent(editing?.content ?? "");
    setColor(editing?.color ?? NOTE_COLORS[0].value);
    setPinned(editing?.pinned ?? false);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md rounded-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <StickyNote className="h-4 w-4" />
            </span>
            {editing ? "ویرایش یادداشت" : "یادداشت جدید"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            const t = title.trim();
            if (!t) return;
            onSubmit({ title: t, content, color, pinned });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="note-title">عنوان</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: ایده‌های پروژه"
              autoFocus
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note-content">متن</Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="هرچی تو ذهنته بنویس..."
              rows={5}
              className="rounded-xl resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>رنگ کاغذ</Label>
            <div className="flex flex-wrap gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  aria-label={c.label}
                  className={cn(
                    "h-9 w-9 rounded-xl border border-black/5 transition-all cursor-pointer ring-offset-2",
                    color === c.value ? "ring-2 ring-foreground/50 scale-110" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-accent/60 px-3 py-2.5">
            <Label htmlFor="note-pin" className="cursor-pointer">سنجاق کردن به بالا</Label>
            <Switch id="note-pin" checked={pinned} onCheckedChange={setPinned} />
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-l from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold shadow-lg shadow-amber-500/25"
          >
            {editing ? "ذخیره یادداشت" : "افزودن یادداشت"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
