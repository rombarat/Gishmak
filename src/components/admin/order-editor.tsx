"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { editOrderAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField, controlClass } from "@/components/ui/field";
import { QuantityStepper } from "@/components/ui/stepper";
import { formatPrice } from "@/lib/money";
import { WEEKDAY_HE, formatWindow, weekdayOf } from "@/lib/time";
import { cn } from "@/lib/utils";
import { orderRef, windowLabel } from "./format";
import { PrintButton } from "./print-button";
import { useAction } from "./use-action";

type EditItem = {
  key: string;
  id?: string;
  variantId?: string;
  productName: string;
  variantLabel: string;
  unitPriceAgorot: number;
  quantity: number;
};

export type EditableOrder = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  recipientName: string | null;
  notes: string;
  pickupDate: string;
  pickupWindowId: string | null;
  discountAgorot: number;
  items: { id: string; productName: string; variantLabel: string; unitPriceAgorot: number; quantity: number }[];
};
type WindowOpt = { id: string; weekday: number; startTime: string; endTime: string; isActive: boolean };
type VariantOpt = { id: string; label: string; priceAgorot: number; productName: string; categoryName: string; productHidden: boolean };

/** Read-only view (children) ↔ edit form. Also hosts the print button. */
export function OrderEditSection({
  order,
  windows,
  variants,
  children,
}: {
  order: EditableOrder;
  windows: WindowOpt[];
  variants: VariantOpt[];
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4" aria-hidden />
            עריכת הזמנה
          </Button>
        )}
        <PrintButton label="הדפסת פתק למטבח" />
      </div>
      {editing ? <OrderEditor order={order} windows={windows} variants={variants} onClose={() => setEditing(false)} /> : children}
    </>
  );
}

function OrderEditor({ order, windows, variants, onClose }: { order: EditableOrder; windows: WindowOpt[]; variants: VariantOpt[]; onClose: () => void }) {
  const { pending, run } = useAction();
  const [name, setName] = useState(order.customerName);
  const [phone, setPhone] = useState(order.customerPhone);
  const [recipient, setRecipient] = useState(order.recipientName ?? "");
  const [notes, setNotes] = useState(order.notes);
  const [date, setDate] = useState(order.pickupDate);
  const [windowId, setWindowId] = useState(order.pickupWindowId ?? "");
  const [items, setItems] = useState<EditItem[]>(() => order.items.map((i) => ({ ...i, key: i.id })));
  const [addVariant, setAddVariant] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const wd = /^\d{4}-\d{2}-\d{2}$/.test(date) ? weekdayOf(date) : -1;
  const sameDay = windows.filter((w) => w.weekday === wd);
  const otherDays = windows.filter((w) => w.weekday !== wd);
  const chosen = windows.find((w) => w.id === windowId);
  const mismatch = chosen && chosen.weekday !== wd;

  const subtotal = items.reduce((s, i) => s + i.unitPriceAgorot * i.quantity, 0);
  const byCategory = useMemo(() => {
    const m = new Map<string, VariantOpt[]>();
    for (const v of variants) m.set(v.categoryName, [...(m.get(v.categoryName) ?? []), v]);
    return [...m.entries()];
  }, [variants]);

  const setQty = (key: string, q: number) =>
    setItems((list) => (q <= 0 ? list.filter((i) => i.key !== key) : list.map((i) => (i.key === key ? { ...i, quantity: Math.min(99, q) } : i))));

  const addLine = () => {
    const v = variants.find((x) => x.id === addVariant);
    if (!v) return;
    setItems((list) => {
      const existing = list.find((i) => !i.id && i.variantId === v.id);
      if (existing) return list.map((i) => (i === existing ? { ...i, quantity: Math.min(99, i.quantity + addQty) } : i));
      return [...list, { key: `new-${v.id}-${Date.now()}`, variantId: v.id, productName: v.productName, variantLabel: v.label, unitPriceAgorot: v.priceAgorot, quantity: addQty }];
    });
    setAddVariant("");
    setAddQty(1);
  };

  const save = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "נא למלא שם לקוח";
    if (phone.replace(/\D/g, "").length < 9) e.phone = "מספר הטלפון לא תקין. לדוגמה: 050-1234567";
    if (!date) e.date = "נא לבחור תאריך";
    if (!windowId) e.window = "נא לבחור חלון איסוף";
    if (!items.length) e.items = "בהזמנה חייב להיות לפחות פריט אחד";
    setErrors(e);
    if (Object.keys(e).length) return;
    run(
      () =>
        editOrderAction(order.id, {
          customerName: name,
          customerPhone: phone,
          recipientName: recipient,
          notes,
          pickupDate: date,
          pickupWindowId: windowId,
          items: items.map((i) => ({ id: i.id, variantId: i.variantId, quantity: i.quantity })),
        }),
      `הזמנה ${orderRef(order.orderNumber)} עודכנה`,
      (r) => r.ok && onClose(),
    );
  };

  return (
    <section aria-label="עריכת הזמנה" className="rounded-[6px] border-2 border-gold bg-surface p-4 md:p-6">
      <h2 className="mb-4 font-display text-xl font-bold">עריכת הזמנה #{order.orderNumber}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="שם הלקוח" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="off" />
        <TextField label="טלפון" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} type="tel" inputMode="tel" dir="ltr" className="text-start" />
        <TextField label="שם האוסף/ת" optional value={recipient} onChange={(e) => setRecipient(e.target.value)} hint="אם מישהו אחר אוסף את ההזמנה" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="תאריך איסוף" type="date" value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} className="num" />
          <SelectField label="חלון איסוף" value={windowId} onChange={(e) => setWindowId(e.target.value)} error={errors.window}>
            <option value="">בחירה…</option>
            {sameDay.length > 0 && (
              <optgroup label={`יום ${WEEKDAY_HE[wd]}`}>
                {sameDay.map((w) => (
                  <option key={w.id} value={w.id}>
                    {formatWindow(w.startTime, w.endTime)}
                    {w.isActive ? "" : " (לא פעיל)"}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="ימים אחרים">
              {otherDays.map((w) => (
                <option key={w.id} value={w.id}>
                  {windowLabel(w)}
                  {w.isActive ? "" : " (לא פעיל)"}
                </option>
              ))}
            </optgroup>
          </SelectField>
        </div>
        {mismatch && (
          <p className="flex items-center gap-2 rounded-[6px] bg-amber-soft px-3 py-2 text-sm font-semibold text-amber md:col-span-2">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            החלון שנבחר שייך ליום {WEEKDAY_HE[chosen.weekday]}, והתאריך הוא יום {WEEKDAY_HE[wd] ?? "—"}. כדאי לבדוק.
          </p>
        )}
        <TextAreaField label="הערות הלקוח" optional value={notes} onChange={(e) => setNotes(e.target.value)} wrapperClassName="md:col-span-2" maxLength={600} />
      </div>

      <h3 className="mb-2 mt-6 text-[17px] font-bold">פריטים</h3>
      {errors.items && <p className="mb-2 text-sm font-semibold text-tomato">{errors.items}</p>}
      <ul className="divide-y divide-line rounded-[6px] border border-line">
        {items.map((i) => (
          <li key={i.key} className={cn("flex flex-wrap items-center gap-3 px-3 py-2.5", !i.id && "bg-leaf-soft/50")}>
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {i.productName}
                {!i.id && <span className="ms-2 rounded-full bg-leaf px-2 text-[11px] font-bold leading-5 text-white">חדש</span>}
              </p>
              <p className="num text-sm text-ink-2">
                {i.variantLabel} · {formatPrice(i.unitPriceAgorot)} ליחידה
              </p>
            </div>
            <QuantityStepper value={i.quantity} onChange={(q) => setQty(i.key, q)} max={99} size="sm" label={i.productName} />
            <span className="num w-20 text-end font-extrabold">{formatPrice(i.unitPriceAgorot * i.quantity)}</span>
            <button
              type="button"
              onClick={() => setQty(i.key, 0)}
              className="grid size-11 place-items-center rounded-[6px] text-tomato hover:bg-tomato-soft"
              aria-label={`הסרת ${i.productName}`}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="px-3 py-4 text-center text-sm text-ink-3">אין פריטים. הוסיפו פריט למטה.</li>}
      </ul>

      <div className="mt-3 flex flex-wrap items-end gap-2 rounded-[6px] bg-surface-2/70 p-3">
        <label className="min-w-0 flex-[1_1_16rem]">
          <span className="mb-1 block text-sm font-bold">הוספת פריט</span>
          <select value={addVariant} onChange={(e) => setAddVariant(e.target.value)} className={controlClass(false)}>
            <option value="">בחירת מוצר וגודל…</option>
            {byCategory.map(([cat, list]) => (
              <optgroup key={cat} label={cat}>
                {list.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.productName} · {v.label} · {formatPrice(v.priceAgorot)}
                    {v.productHidden ? " (מוסתר בחנות)" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="w-24">
          <span className="mb-1 block text-sm font-bold">כמות</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={addQty}
            onChange={(e) => setAddQty(Math.min(99, Math.max(1, Number(e.target.value) || 1)))}
            className={controlClass(false, "num text-center")}
          />
        </label>
        <Button variant="dark" onClick={addLine} disabled={!addVariant}>
          <Plus className="size-4" aria-hidden />
          הוספה
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="num text-lg">
          סה״כ אחרי השינוי: <strong className="font-extrabold">{formatPrice(subtotal - order.discountAgorot)}</strong>
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            ביטול
          </Button>
          <Button onClick={save} loading={pending}>
            שמירת השינויים
          </Button>
        </div>
      </div>
    </section>
  );
}
