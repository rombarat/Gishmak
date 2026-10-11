"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, ImageOff, Images, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { saveProductAction, uploadImageAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField, controlClass } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { agorotToShekels } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Toggle } from "./toggle";
import { useAction } from "./use-action";

export type ProductFormValue = {
  id?: string;
  name: string;
  description: string;
  categoryId: string;
  imageUrl: string | null;
  imageIsIllustration: boolean;
  isActive: boolean;
  isFeatured: boolean;
  variants: { id?: string; label: string; priceAgorot: number }[];
};

type VariantRow = { key: string; id?: string; label: string; price: string };
type Errors = Partial<Record<"name" | "categoryId" | "variants", string>> & { rows?: Record<string, { label?: string; price?: string }> };

let seq = 0;
const rowKey = () => `v${++seq}`;

export function ProductForm({
  product,
  categories,
  library,
}: {
  product: ProductFormValue;
  categories: { id: string; name: string }[];
  library: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !product.id;
  const { pending, run } = useAction();
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [imageUrl, setImageUrl] = useState<string | null>(product.imageUrl);
  const [illustration, setIllustration] = useState(product.imageIsIllustration);
  const [isActive, setIsActive] = useState(product.isActive);
  const [isFeatured, setIsFeatured] = useState(product.isFeatured);
  const [rows, setRows] = useState<VariantRow[]>(() =>
    product.variants.length
      ? product.variants.map((v) => ({ key: rowKey(), id: v.id, label: v.label, price: agorotToShekels(v.priceAgorot) }))
      : [{ key: rowKey(), label: "", price: "" }],
  );
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const updateRow = (key: string, patch: Partial<VariantRow>) => setRows((l) => l.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const moveRow = (idx: number, dir: -1 | 1) =>
    setRows((l) => {
      const n = [...l];
      [n[idx], n[idx + dir]] = [n[idx + dir], n[idx]];
      return n;
    });

  const upload = (file: File) => {
    const fd = new FormData();
    fd.set("file", file);
    startUpload(async () => {
      try {
        const r = await uploadImageAction(fd);
        if (r.ok) {
          setImageUrl(r.url);
          setIllustration(false);
          toast("התמונה הועלתה");
        } else toast(r.error, { tone: "error" });
      } catch {
        toast("ההעלאה נכשלה. נסו תמונה קטנה יותר.", { tone: "error" });
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  const validate = (): boolean => {
    const e: Errors = { rows: {} };
    if (name.trim().length < 2) e.name = "נא למלא שם מוצר";
    if (!categoryId) e.categoryId = "נא לבחור קטגוריה";
    if (!rows.length) e.variants = "צריך לפחות גודל/מחיר אחד";
    for (const r of rows) {
      const re: { label?: string; price?: string } = {};
      if (!r.label.trim()) re.label = "נא למלא שם לגודל";
      const n = Number(r.price.replace(",", "."));
      if (r.price.trim() === "" || !Number.isFinite(n) || n < 0 || n > 10000) re.price = "מחיר לא תקין";
      if (re.label || re.price) e.rows![r.key] = re;
    }
    setErrors(e);
    return !e.name && !e.categoryId && !e.variants && Object.keys(e.rows!).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      toast("יש לתקן כמה שדות בטופס", { tone: "error" });
      return;
    }
    run(
      () =>
        saveProductAction({
          id: product.id,
          name,
          description,
          categoryId,
          imageUrl,
          imageIsIllustration: illustration,
          isActive,
          isFeatured,
          variants: rows.map((r) => ({ id: r.id, label: r.label, price: r.price, isActive: true })),
        }),
      isNew ? `"${name.trim()}" נוסף לתפריט` : "נשמר",
      (r) => {
        if (!r.ok) return;
        if (isNew) router.push("/admin/products");
        else router.refresh();
      },
    );
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-4 rounded-[6px] border border-line bg-surface p-4 md:p-5">
          <TextField label="שם המוצר" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={80} placeholder="למשל: קוגל ירושלמי" />
          <TextAreaField
            label="תיאור"
            optional
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={400}
            hint="שורה או שתיים — ממה זה עשוי, למי זה מתאים"
          />
          <SelectField label="קטגוריה" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} error={errors.categoryId}>
            <option value="">בחירת קטגוריה…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        </section>

        {/* ------------------------------------------------ variants */}
        <section aria-labelledby="variants-title" className="rounded-[6px] border border-line bg-surface p-4 md:p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="variants-title" className="text-[17px] font-bold">
              גדלים ומחירים
            </h2>
            <span className="text-sm text-ink-3">המחיר בשקלים</span>
          </div>
          {errors.variants && <p className="mb-2 text-sm font-semibold text-tomato">{errors.variants}</p>}
          <ol className="flex flex-col gap-2">
            {rows.map((r, i) => {
              const re = errors.rows?.[r.key];
              return (
                <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2 rounded-[6px] bg-surface-2/50 p-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-start">
                  <label className="min-w-0">
                    <span className="sr-only">שם הגודל {i + 1}</span>
                    <input
                      value={r.label}
                      onChange={(e) => updateRow(r.key, { label: e.target.value })}
                      placeholder="למשל: קופסה 500 גרם"
                      aria-invalid={re?.label ? true : undefined}
                      className={controlClass(Boolean(re?.label))}
                    />
                    {re?.label && <span className="mt-1 block text-sm font-semibold text-tomato">{re.label}</span>}
                  </label>
                  <label>
                    <span className="sr-only">מחיר בשקלים לגודל {i + 1}</span>
                    <span className="relative block">
                      <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-ink-3">₪</span>
                      <input
                        value={r.price}
                        onChange={(e) => updateRow(r.key, { price: e.target.value })}
                        inputMode="decimal"
                        placeholder="0"
                        dir="ltr"
                        aria-invalid={re?.price ? true : undefined}
                        className={controlClass(Boolean(re?.price), "num pe-8 text-start")}
                      />
                    </span>
                    {re?.price && <span className="mt-1 block text-sm font-semibold text-tomato">{re.price}</span>}
                  </label>
                  <div className="col-span-2 flex justify-end gap-0.5 sm:col-span-1">
                    <button type="button" onClick={() => moveRow(i, -1)} disabled={i === 0} className="grid size-11 place-items-center rounded-[6px] text-ink-2 hover:bg-surface disabled:opacity-30" aria-label="הזזה למעלה">
                      <ChevronUp className="size-5" aria-hidden />
                    </button>
                    <button type="button" onClick={() => moveRow(i, 1)} disabled={i === rows.length - 1} className="grid size-11 place-items-center rounded-[6px] text-ink-2 hover:bg-surface disabled:opacity-30" aria-label="הזזה למטה">
                      <ChevronDown className="size-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRows((l) => l.filter((x) => x.key !== r.key))}
                      disabled={rows.length === 1}
                      className="grid size-11 place-items-center rounded-[6px] text-tomato hover:bg-tomato-soft disabled:opacity-30"
                      aria-label={`הסרת הגודל ${r.label || i + 1}`}
                    >
                      <Trash2 className="size-[18px]" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          <Button variant="outline" className="mt-3" onClick={() => setRows((l) => [...l, { key: rowKey(), label: "", price: "" }])}>
            <Plus className="size-4" aria-hidden />
            הוספת גודל
          </Button>
        </section>
      </div>

      {/* ------------------------------------------------ side: image + flags */}
      <div className="flex flex-col gap-5">
        <section aria-labelledby="img-title" className="rounded-[6px] border border-line bg-surface p-4">
          <h2 id="img-title" className="mb-3 text-[17px] font-bold">
            תמונה
          </h2>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview of library/uploaded image
            <img src={imageUrl} alt="תצוגה מקדימה של תמונת המוצר" className="aspect-[4/3] w-full rounded-[6px] border border-line object-cover" />
          ) : (
            <div className="grid aspect-[4/3] w-full place-items-center rounded-[6px] border border-dashed border-line bg-surface-2/50 px-4 text-center text-sm text-ink-3">
              בלי תמונה המוצר יוצג כשורה בתפריט (שם ...... מחיר)
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setLibraryOpen((v) => !v)} aria-expanded={libraryOpen}>
              <Images className="size-4" aria-hidden />
              מהספרייה
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
              {uploading ? "מעלה…" : "העלאה"}
            </Button>
            {imageUrl && (
              <Button variant="ghost" size="sm" onClick={() => setImageUrl(null)} className="text-tomato">
                <ImageOff className="size-4" aria-hidden />
                הסרה
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              aria-label="העלאת תמונה"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </div>
          <p className="mt-2 text-[12px] text-ink-3">JPG, PNG או WEBP, עד 4MB.</p>
          {libraryOpen && (
            <ul className="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-y-auto rounded-[6px] bg-surface-2/50 p-2">
              {library.map((src) => (
                <li key={src}>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl(src);
                      setIllustration(src.includes("/ill-"));
                      setLibraryOpen(false);
                    }}
                    aria-pressed={imageUrl === src}
                    aria-label={`בחירת התמונה ${src.split("/").pop()}`}
                    className={cn("block overflow-hidden rounded-[4px] ring-offset-2", imageUrl === src && "ring-3 ring-gold")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- picker thumbnails */}
                    <img src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  </button>
                </li>
              ))}
              {library.length === 0 && <li className="col-span-3 py-4 text-center text-sm text-ink-3">אין עדיין תמונות בספרייה.</li>}
            </ul>
          )}
          {imageUrl && (
            <label className="mt-3 flex min-h-11 items-center gap-2.5 text-[14px] font-semibold">
              <input type="checkbox" checked={illustration} onChange={(e) => setIllustration(e.target.checked)} className="size-5 accent-[var(--color-gold-ink)]" />
              תמונה להמחשה
              <span className="font-normal text-ink-3">(מסומן ללקוח)</span>
            </label>
          )}
        </section>

        <section className="flex flex-col gap-1 rounded-[6px] border border-line bg-surface p-3">
          <Toggle checked={isActive} onChange={setIsActive} label={isActive ? "זמין בחנות" : "מוסתר מהחנות"} description="לקוחות רואים ומזמינים רק מוצרים זמינים" />
          <Toggle checked={isFeatured} onChange={setIsFeatured} tone="gold" label="מומלץ" description="מוצג בראש עמוד הבית" />
        </section>

        <div className="flex gap-2 lg:sticky lg:top-4">
          <Button type="submit" size="lg" loading={pending} className="flex-1">
            {isNew ? "הוספת המוצר" : "שמירת השינויים"}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => router.push("/admin/products")} disabled={pending}>
            ביטול
          </Button>
        </div>
      </div>
    </form>
  );
}
