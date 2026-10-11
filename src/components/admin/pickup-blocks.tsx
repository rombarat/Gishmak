"use client";

import { useState } from "react";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { addBlockAction, removeBlockAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { formatDayLong, formatWindow, weekdayOf } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useAction } from "./use-action";
import type { WindowRow } from "./pickup-windows";

export type BlockRow = { id: string; date: string; reason: string; window: { startTime: string; endTime: string } | null };

function BlockItem({ b }: { b: BlockRow }) {
  const { pending, run } = useAction();
  return (
    <li className={cn("flex items-center gap-3 px-4 py-2.5", pending && "opacity-50")}>
      <CalendarOff className="size-5 shrink-0 text-tomato" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="num font-bold">
          {formatDayLong(b.date)} · {b.window ? formatWindow(b.window.startTime, b.window.endTime) : "כל היום"}
        </p>
        {b.reason && <p className="truncate text-[14px] text-ink-2">{b.reason}</p>}
      </div>
      <Button
        variant="ghost"
        size="md"
        className="text-tomato hover:bg-tomato-soft"
        disabled={pending}
        onClick={() => run(() => removeBlockAction(b.id), "החסימה הוסרה — אפשר שוב להזמין למועד הזה")}
        aria-label={`הסרת החסימה של ${formatDayLong(b.date)}`}
      >
        <Trash2 className="size-4" aria-hidden />
        הסרה
      </Button>
    </li>
  );
}

export function PickupBlocks({ blocks, windows, today }: { blocks: BlockRow[]; windows: WindowRow[]; today: string }) {
  const [date, setDate] = useState("");
  const [windowId, setWindowId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const { pending, run } = useAction();
  const dayWindows = date ? windows.filter((w) => w.weekday === weekdayOf(date)) : [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return setError("נא לבחור תאריך");
    if (date < today) return setError("אי אפשר לחסום תאריך שעבר");
    setError(undefined);
    run(
      () => addBlockAction({ date, windowId: windowId || null, reason }),
      windowId ? "החלון נחסם לתאריך הזה" : "היום נחסם להזמנות",
      (r) => {
        if (!r.ok) return;
        setDate("");
        setWindowId("");
        setReason("");
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} noValidate className="rounded-[6px] border border-line bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-[10rem_minmax(10rem,1fr)_minmax(10rem,1.4fr)_auto] sm:items-end">
          <label className="flex flex-col gap-1 text-sm font-bold">
            תאריך
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setWindowId("");
              }}
              className={controlClass(Boolean(error), "num")}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold">
            מה לחסום
            <select value={windowId} onChange={(e) => setWindowId(e.target.value)} className={controlClass(false)} disabled={!date}>
              <option value="">כל היום</option>
              {dayWindows.map((w) => (
                <option key={w.id} value={w.id}>
                  רק {formatWindow(w.startTime, w.endTime)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold">
            סיבה <span className="sr-only">(לא חובה)</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={120} placeholder="למשל: ערב חג, אירוע משפחתי" className={controlClass(false)} />
          </label>
          <Button type="submit" variant="dark" loading={pending}>
            <Plus className="size-4" aria-hidden />
            חסימה
          </Button>
        </div>
        {error && <p className="mt-2 text-sm font-semibold text-tomato">{error}</p>}
        {date && dayWindows.length === 0 && <p className="mt-2 text-sm text-ink-3">אין חלונות איסוף ביום הזה ממילא.</p>}
      </form>

      {blocks.length === 0 ? (
        <p className="rounded-[6px] border border-dashed border-line px-4 py-5 text-center text-[15px] text-ink-3">אין חסימות קרובות. כל חלונות האיסוף הפעילים פתוחים להזמנה.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[6px] border border-line bg-surface">
          {blocks.map((b) => (
            <BlockItem key={b.id} b={b} />
          ))}
        </ul>
      )}
    </div>
  );
}
