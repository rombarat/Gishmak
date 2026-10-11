"use client";

import Link from "next/link";
import { useOptimistic, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCategoryAction, moveCategoryAction, saveCategoryAction, setCategoryVisibleAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { Toggle } from "./toggle";
import { useAction } from "./use-action";

type Cat = { id: string; name: string; description: string; isVisible: boolean; productCount: number };

const iconBtn = "grid size-11 place-items-center rounded-[6px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";

function CategoryForm({
  initial,
  onDone,
  submitLabel,
}: {
  initial?: Cat;
  onDone: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState<string>();
  const { pending, run } = useAction();
  return (
    <form
      noValidate
      className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim().length < 2) return setError("נא למלא שם קטגוריה");
        setError(undefined);
        run(
          () => saveCategoryAction({ id: initial?.id, name, description, isVisible: initial?.isVisible }),
          initial ? "הקטגוריה נשמרה" : `הקטגוריה "${name.trim()}" נוספה`,
          (r) => r.ok && onDone(),
        );
      }}
    >
      <TextField label="שם הקטגוריה" value={name} onChange={(e) => setName(e.target.value)} error={error} maxLength={60} autoFocus />
      <TextField label="תיאור קצר" optional value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
      <div className="flex gap-2">
        <Button type="submit" loading={pending} className="min-h-12">
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={pending} className="min-h-12">
          ביטול
        </Button>
      </div>
    </form>
  );
}

function CategoryRow({ cat, isFirst, isLast }: { cat: Cat; isFirst: boolean; isLast: boolean }) {
  const [editing, setEditing] = useState(false);
  const [visible, setVisible] = useOptimistic(cat.isVisible);
  const { pending, run } = useAction();

  if (editing) {
    return (
      <li className="bg-gold-soft/40 px-4 py-4">
        <CategoryForm initial={cat} onDone={() => setEditing(false)} submitLabel="שמירה" />
      </li>
    );
  }
  return (
    <li className={cn("grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center", !visible && "bg-surface-2/40")}>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className={cn("text-[16px] font-bold", !visible && "text-ink-2")}>{cat.name}</span>
          <Link href={`/admin/products?cat=${cat.id}`} className="num text-[13px] font-semibold text-gold-ink hover:underline">
            {cat.productCount === 0 ? "אין מוצרים" : cat.productCount === 1 ? "מוצר אחד" : `${cat.productCount} מוצרים`}
          </Link>
        </p>
        {cat.description && <p className="truncate text-[14px] text-ink-2">{cat.description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-0.5">
        <Toggle
          checked={visible}
          onChange={(v) =>
            run(async () => {
              setVisible(v);
              return setCategoryVisibleAction(cat.id, v);
            }, v ? `"${cat.name}" מוצגת בחנות` : `"${cat.name}" הוסתרה מהחנות`)
          }
          label={visible ? "מוצגת" : "מוסתרת"}
        />
        <button type="button" className={iconBtn} disabled={isFirst || pending} onClick={() => run(() => moveCategoryAction(cat.id, "up"), "הסדר עודכן")} aria-label={`הזזת ${cat.name} למעלה`}>
          <ChevronUp className="size-5" aria-hidden />
        </button>
        <button type="button" className={iconBtn} disabled={isLast || pending} onClick={() => run(() => moveCategoryAction(cat.id, "down"), "הסדר עודכן")} aria-label={`הזזת ${cat.name} למטה`}>
          <ChevronDown className="size-5" aria-hidden />
        </button>
        <button type="button" className={iconBtn} onClick={() => setEditing(true)} aria-label={`עריכת ${cat.name}`}>
          <Pencil className="size-[18px]" aria-hidden />
        </button>
        <button
          type="button"
          className={cn(iconBtn, "text-tomato hover:bg-tomato-soft hover:text-tomato")}
          disabled={pending}
          title={cat.productCount > 0 ? "אפשר למחוק רק קטגוריה ריקה" : undefined}
          onClick={() => {
            if (cat.productCount === 0 && !window.confirm(`למחוק את הקטגוריה "${cat.name}"?`)) return;
            run(() => deleteCategoryAction(cat.id), `הקטגוריה "${cat.name}" נמחקה`);
          }}
          aria-label={`מחיקת ${cat.name}`}
        >
          <Trash2 className="size-[18px]" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <>
      <div className="mb-4">
        {adding ? (
          <div className="rounded-[6px] border-2 border-gold bg-surface p-4">
            <h2 className="mb-3 text-[17px] font-bold">קטגוריה חדשה</h2>
            <CategoryForm onDone={() => setAdding(false)} submitLabel="הוספה" />
          </div>
        ) : (
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden />
            קטגוריה חדשה
          </Button>
        )}
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-[6px] border border-line bg-surface">
        {categories.map((c, i) => (
          <CategoryRow key={`${c.id}-${c.name}-${c.description}`} cat={c} isFirst={i === 0} isLast={i === categories.length - 1} />
        ))}
        {categories.length === 0 && <li className="px-4 py-8 text-center text-ink-3">עוד אין קטגוריות. הוסיפו את הראשונה.</li>}
      </ul>
    </>
  );
}
