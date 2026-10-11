"use client";

import { useOptimistic, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteWindowAction, saveWindowAction, setWindowActiveAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { WEEKDAY_HE, formatWindow } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Toggle } from "./toggle";
import { useAction } from "./use-action";

export type WindowRow = { id: string; weekday: number; startTime: string; endTime: string; capacity: number | null; isActive: boolean };

const iconBtn = "grid size-11 place-items-center rounded-[6px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30";

function WindowForm({ initial, weekday, onDone }: { initial?: WindowRow; weekday?: number; onDone: () => void }) {
  const [day, setDay] = useState(initial?.weekday ?? weekday ?? 4);
  const [start, setStart] = useState(initial?.startTime ?? "");
  const [end, setEnd] = useState(initial?.endTime ?? "");
  const [cap, setCap] = useState(initial?.capacity != null ? String(initial.capacity) : "");
  const [error, setError] = useState<string>();
  const { pending, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) return setError("נא למלא שעת התחלה וסיום");
    if (end <= start) return setError("שעת הסיום חייבת להיות אחרי שעת ההתחלה");
    const capacity = cap.trim() === "" ? null : Number(cap);
    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) return setError("מקסימום הזמנות חייב להיות מספר שלם וחיובי, או ריק");
    setError(undefined);
    run(
      () => saveWindowAction({ id: initial?.id, weekday: day, startTime: start, endTime: end, capacity, isActive: initial?.isActive ?? true }),
      initial ? "חלון האיסוף נשמר" : `נוסף חלון איסוף ביום ${WEEKDAY_HE[day]} ${formatWindow(start, end)}`,
      (r) => r.ok && onDone(),
    );
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[9rem_8rem_8rem_minmax(9rem,1fr)_auto] sm:items-end">
        <label className="col-span-2 flex flex-col gap-1 text-sm font-bold sm:col-span-1">
          יום
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} className={controlClass(false)}>
            {WEEKDAY_HE.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold">
          משעה
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={controlClass(false, "num")} required />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold">
          עד שעה
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={controlClass(false, "num")} required />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm font-bold sm:col-span-1">
          מקסימום הזמנות לחלון
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={cap}
            onChange={(e) => setCap(e.target.value)}
            placeholder="ללא הגבלה"
            className={controlClass(false, "num")}
          />
        </label>
        <div className="col-span-2 flex gap-2 sm:col-span-1">
          <Button type="submit" loading={pending}>
            {initial ? "שמירה" : "הוספה"}
          </Button>
          <Button variant="ghost" onClick={onDone} disabled={pending}>
            ביטול
          </Button>
        </div>
      </div>
      {error && <p className="text-sm font-semibold text-tomato">{error}</p>}
    </form>
  );
}

function WindowItem({ w }: { w: WindowRow }) {
  const [editing, setEditing] = useState(false);
  const [active, setActive] = useOptimistic(w.isActive);
  const { pending, run } = useAction();
  if (editing)
    return (
      <li className="bg-gold-soft/40 px-4 py-3">
        <WindowForm initial={w} onDone={() => setEditing(false)} />
      </li>
    );
  return (
    <li className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2", !active && "bg-surface-2/40")}>
      <span className={cn("num font-display text-xl font-bold", !active && "text-ink-3 line-through decoration-1")}>{formatWindow(w.startTime, w.endTime)}</span>
      <span className="num text-[14px] text-ink-2">{w.capacity == null ? "ללא הגבלת הזמנות" : `עד ${w.capacity} הזמנות לתאריך`}</span>
      <div className="ms-auto flex items-center gap-0.5">
        <Toggle
          checked={active}
          onChange={(v) =>
            run(async () => {
              setActive(v);
              return setWindowActiveAction(w.id, v);
            }, v ? "חלון האיסוף הופעל" : "חלון האיסוף הושבת — לקוחות לא יוכלו לבחור בו")
          }
          label={active ? "פעיל" : "מושבת"}
        />
        <button type="button" className={iconBtn} onClick={() => setEditing(true)} aria-label={`עריכת החלון ${formatWindow(w.startTime, w.endTime)}`}>
          <Pencil className="size-[18px]" aria-hidden />
        </button>
        <button
          type="button"
          className={cn(iconBtn, "text-tomato hover:bg-tomato-soft hover:text-tomato")}
          disabled={pending}
          onClick={() => {
            if (!window.confirm(`למחוק את חלון האיסוף ${WEEKDAY_HE[w.weekday]} ${formatWindow(w.startTime, w.endTime)}? הזמנות קיימות יישמרו עם השעה המקורית. אם רוצים רק להפסיק זמנית — עדיף להשבית.`)) return;
            run(() => deleteWindowAction(w.id), "חלון האיסוף נמחק");
          }}
          aria-label={`מחיקת החלון ${formatWindow(w.startTime, w.endTime)}`}
        >
          <Trash2 className="size-[18px]" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export function PickupWindows({ windows }: { windows: WindowRow[] }) {
  const [adding, setAdding] = useState<number | null>(null);
  const days = WEEKDAY_HE.map((name, i) => ({ name, i, list: windows.filter((w) => w.weekday === i) }));
  const withWindows = days.filter((d) => d.list.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {withWindows.map((d) => (
        <div key={d.i} className="overflow-hidden rounded-[6px] border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line bg-surface-2/70 px-4 py-1.5">
            <h3 className="font-bold">יום {d.name}</h3>
            <Button variant="ghost" size="sm" onClick={() => setAdding(d.i)} className="min-h-11">
              <Plus className="size-4" aria-hidden />
              חלון ביום {d.name}
            </Button>
          </div>
          <ul className="divide-y divide-line">
            {d.list.map((w) => (
              <WindowItem key={`${w.id}-${w.startTime}-${w.endTime}-${w.capacity}-${w.weekday}`} w={w} />
            ))}
          </ul>
        </div>
      ))}
      {withWindows.length === 0 && <p className="rounded-[6px] border border-dashed border-line px-4 py-6 text-center text-ink-3">אין חלונות איסוף. לקוחות לא יוכלו להזמין עד שתוסיפו חלון.</p>}

      {adding !== null ? (
        <div className="rounded-[6px] border-2 border-gold bg-surface p-4">
          <h3 className="mb-3 font-bold">חלון איסוף חדש</h3>
          <WindowForm key={adding} weekday={adding} onDone={() => setAdding(null)} />
        </div>
      ) : (
        <Button variant="outline" onClick={() => setAdding(4)} className="self-start">
          <Plus className="size-4" aria-hidden />
          חלון איסוף חדש
        </Button>
      )}
    </div>
  );
}
