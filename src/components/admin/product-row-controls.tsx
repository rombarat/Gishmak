"use client";

import Link from "next/link";
import { useOptimistic } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { deleteProductAction, moveProductAction, setProductFlagsAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import { Toggle } from "./toggle";
import { useAction } from "./use-action";

type Flags = { isActive: boolean; isFeatured: boolean; soldOutToday: boolean };

const iconBtn = "grid size-11 place-items-center rounded-[6px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";

export function ProductRowControls({
  id,
  name,
  flags,
  isFirst,
  isLast,
  categoryHidden,
}: {
  id: string;
  name: string;
  flags: Flags;
  isFirst: boolean;
  isLast: boolean;
  categoryHidden: boolean;
}) {
  const [state, setState] = useOptimistic(flags, (s: Flags, patch: Partial<Flags>) => ({ ...s, ...patch }));
  const { pending, run } = useAction();

  const flip = (patch: Partial<Flags>, message: string) =>
    run(async () => {
      setState(patch);
      return setProductFlagsAction(id, patch);
    }, message);

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
      <Toggle
        checked={state.isActive}
        onChange={(v) => flip({ isActive: v }, v ? `"${name}" מוצג בחנות` : `"${name}" הוסתר מהחנות`)}
        label={state.isActive ? "זמין" : "מוסתר"}
        description={categoryHidden && state.isActive ? "הקטגוריה מוסתרת" : undefined}
      />
      <Toggle
        checked={state.soldOutToday}
        tone="tomato"
        onChange={(v) => flip({ soldOutToday: v }, v ? `"${name}" סומן "אזל להיום"` : `"${name}" חזר למלאי`)}
        label="אזל להיום"
      />
      <Toggle
        checked={state.isFeatured}
        tone="gold"
        onChange={(v) => flip({ isFeatured: v }, v ? `"${name}" נוסף למומלצים` : `"${name}" הוסר מהמומלצים`)}
        label="מומלץ"
      />
      <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
      <button type="button" className={iconBtn} disabled={isFirst || pending} onClick={() => run(() => moveProductAction(id, "up"), "הסדר עודכן")} aria-label={`הזזת ${name} למעלה`}>
        <ChevronUp className="size-5" aria-hidden />
      </button>
      <button type="button" className={iconBtn} disabled={isLast || pending} onClick={() => run(() => moveProductAction(id, "down"), "הסדר עודכן")} aria-label={`הזזת ${name} למטה`}>
        <ChevronDown className="size-5" aria-hidden />
      </button>
      <Link href={`/admin/products/${id}`} className={iconBtn} aria-label={`עריכת ${name}`}>
        <Pencil className="size-[18px]" aria-hidden />
      </Link>
      <button
        type="button"
        className={cn(iconBtn, "text-tomato hover:bg-tomato-soft hover:text-tomato")}
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`למחוק את "${name}"? מוצר שכבר הוזמן יועבר לארכיון כדי לשמור את היסטוריית ההזמנות.`)) return;
          run(
            () => deleteProductAction(id),
            (r) => (r.archived ? `"${name}" הועבר לארכיון (יש לו הזמנות קודמות) והוסר מהחנות` : `"${name}" נמחק`),
          );
        }}
        aria-label={`מחיקת ${name}`}
      >
        <Trash2 className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}
