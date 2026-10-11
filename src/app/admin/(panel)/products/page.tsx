import type { Metadata } from "next";
import Link from "next/link";
import { EyeOff, Plus, Search, SearchX } from "lucide-react";
import { listProductsForAdmin } from "@/server/admin-catalog";
import { formatPrice } from "@/lib/money";
import { todayIL } from "@/lib/time";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { Input, Select } from "@/components/admin/controls";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { ProductRowControls } from "@/components/admin/product-row-controls";
import { ProductThumb } from "@/components/admin/product-thumb";
import { plural } from "@/components/admin/format";

export const metadata: Metadata = { title: "מוצרים" };
export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 60) ?? "";
  const cat = sp.cat ?? "";
  const today = todayIL();
  const categories = await listProductsForAdmin();
  const total = categories.reduce((s, c) => s + c.products.length, 0);
  const soldOut = categories.reduce((s, c) => s + c.products.filter((p) => p.soldOutDate === today).length, 0);
  const hidden = categories.reduce((s, c) => s + c.products.filter((p) => !p.isActive).length, 0);

  const needle = q.toLowerCase();
  const shown = categories
    .filter((c) => !cat || c.id === cat)
    .map((c) => ({ ...c, products: needle ? c.products.filter((p) => p.name.toLowerCase().includes(needle)) : c.products }))
    .filter((c) => c.products.length > 0 || (!needle && cat));

  return (
    <>
      <PageHeader
        title="מוצרים"
        subtitle={
          <span className="num">
            {plural(total, "מוצר", "מוצרים", "אחד")}
            {hidden > 0 && ` · ${hidden} מוסתרים`}
            {soldOut > 0 && ` · ${soldOut} אזלו להיום`}
          </span>
        }
        actions={
          <Link href="/admin/products/new" className={buttonClass("gold")}>
            <Plus className="size-4" aria-hidden />
            מוצר חדש
          </Link>
        }
      />

      <form method="get" role="search" className="mb-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">
        <label className="relative">
          <span className="sr-only">חיפוש מוצר</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input type="search" name="q" defaultValue={q} placeholder="חיפוש לפי שם מוצר" className="ps-9" />
        </label>
        <label>
          <span className="sr-only">קטגוריה</span>
          <Select name="cat" defaultValue={cat}>
            <option value="">כל הקטגוריות</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.products.length})
              </option>
            ))}
          </Select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className={buttonClass("dark", "md", "flex-1")}>
            סינון
          </button>
          {(q || cat) && (
            <Link href="/admin/products" className={buttonClass("ghost")}>
              ניקוי
            </Link>
          )}
        </div>
      </form>

      {shown.length === 0 ? (
        <EmptyState icon={SearchX} title="לא נמצאו מוצרים" body={q ? `אין מוצר ששמו כולל "${q}".` : "עוד אין מוצרים בתפריט."} />
      ) : (
        <div className="flex flex-col gap-6">
          {shown.map((c) => (
            <section key={c.id} aria-labelledby={`cat-${c.id}`}>
              <div className="mb-2 flex items-center gap-3">
                <h2 id={`cat-${c.id}`} className="font-display text-xl font-bold">
                  {c.name}
                </h2>
                {!c.isVisible && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 text-[12px] font-bold leading-5 text-ink-2">
                    <EyeOff className="size-3" aria-hidden />
                    קטגוריה מוסתרת
                  </span>
                )}
                <span className="h-px flex-1 bg-line" aria-hidden />
                <span className="num text-sm text-ink-3">{c.products.length}</span>
              </div>
              {c.products.length === 0 ? (
                <p className="rounded-[6px] border border-dashed border-line px-4 py-5 text-center text-sm text-ink-3">אין מוצרים בקטגוריה הזו.</p>
              ) : (
                <ul className="divide-y divide-line overflow-hidden rounded-[6px] border border-line bg-surface">
                  {c.products.map((p, i) => {
                    const soldOutToday = p.soldOutDate === today;
                    const variants = p.variants.filter((v) => v.isActive);
                    return (
                      <li
                        key={p.id}
                        className={cn("grid gap-x-4 gap-y-2 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-4", !p.isActive && "bg-surface-2/40")}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <ProductThumb name={p.name} imageUrl={p.imageUrl} className={cn(!p.isActive && "opacity-50")} />
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <Link href={`/admin/products/${p.id}`} className={cn("font-bold hover:underline", !p.isActive && "text-ink-2")}>
                                {p.name}
                              </Link>
                              {!p.isActive && <span className="rounded-full bg-surface-2 px-2 text-[11px] font-bold leading-5 text-ink-2">מוסתר</span>}
                              {soldOutToday && <span className="rounded-full bg-tomato-soft px-2 text-[11px] font-bold leading-5 text-tomato">אזל היום</span>}
                              {p.isFeatured && <span className="rounded-full bg-gold-soft px-2 text-[11px] font-bold leading-5 text-gold-ink">מומלץ</span>}
                              {p.imageIsIllustration && p.imageUrl && <span className="text-[11px] text-ink-3">תמונה להמחשה</span>}
                            </p>
                            <p className="num text-[13px] text-ink-2">
                              {variants.length ? variants.map((v) => `${v.label} ${formatPrice(v.priceAgorot)}`).join(" · ") : "אין גדלים פעילים"}
                            </p>
                          </div>
                        </div>
                        <ProductRowControls
                          id={p.id}
                          name={p.name}
                          flags={{ isActive: p.isActive, isFeatured: p.isFeatured, soldOutToday }}
                          isFirst={Boolean(needle) || i === 0}
                          isLast={Boolean(needle) || i === c.products.length - 1}
                          categoryHidden={!c.isVisible}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
