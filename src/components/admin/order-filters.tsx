"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, STATUS_LABEL } from "@/domain/order-status";
import { controlClass } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";

type Props = {
  view: string;
  q: string;
  status: string;
  date: string;
  windowId: string;
  windows: { id: string; label: string }[];
};

/** Plain GET form → every filter combination is a shareable URL. Selects submit on change. */
export function OrderFilters({ view, q, status, date, windowId, windows }: Props) {
  const ref = useRef<HTMLFormElement>(null);
  const submit = () => ref.current?.requestSubmit();
  const hasFilters = Boolean(q || status || date || windowId);
  const extraCount = [status, date, windowId].filter(Boolean).length;
  // phones: secondary filters fold away so orders are visible on the first screen
  const [open, setOpen] = useState(extraCount > 0);
  const extra = cn(!open && "hidden sm:block");

  return (
    <form ref={ref} method="get" action="/admin/orders" role="search" className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,2fr)_1fr_1fr_1fr_auto] print:hidden">
      {view && <input type="hidden" name="view" value={view} />}
      <label className="relative sm:col-span-2 lg:col-span-1">
        <span className="sr-only">חיפוש לפי שם, טלפון או מספר הזמנה</span>
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="שם, טלפון או מספר הזמנה"
          className={controlClass(false, "ps-9")}
          enterKeyHint="search"
        />
      </label>
      <label className={extra}>
        <span className="sr-only">סטטוס</span>
        <select name="status" defaultValue={status} onChange={submit} className={controlClass(false)}>
          <option value="">כל הסטטוסים</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <label className={extra}>
        <span className="sr-only">תאריך איסוף</span>
        <input type="date" name="date" defaultValue={date} onChange={submit} className={controlClass(false, "num")} aria-label="תאריך איסוף" />
      </label>
      <label className={extra}>
        <span className="sr-only">חלון איסוף</span>
        <select name="window" defaultValue={windowId} onChange={submit} className={controlClass(false)}>
          <option value="">כל חלונות האיסוף</option>
          {windows.map((w) => (
            <option key={w.id} value={w.id}>
              {w.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={buttonClass("outline", "md", "sm:hidden")}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          סינון{extraCount > 0 && <span className="num">({extraCount})</span>}
        </button>
        <button type="submit" className={buttonClass("dark", "md", "flex-1 lg:flex-none")}>
          חיפוש
        </button>
        {hasFilters && (
          <Link href={view ? `/admin/orders?view=${view}` : "/admin/orders"} className={buttonClass("ghost", "md")} aria-label="ניקוי סינון">
            <X className="size-4" aria-hidden />
            ניקוי
          </Link>
        )}
      </div>
    </form>
  );
}
