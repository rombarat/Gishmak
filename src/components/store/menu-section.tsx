import type { StoreCategory } from "@/server/catalog";
import { OrnamentHeading } from "@/components/ui/ornament";
import { ProductCard } from "./product-card";
import { MenuRow } from "./menu-row";

/** One category: photo cards first, then the printed-menu rows. */
export function MenuSection({ category, eagerImages }: { category: StoreCategory; eagerImages?: boolean }) {
  const withPhoto = category.products.filter((p) => p.imageUrl);
  const rows = category.products.filter((p) => !p.imageUrl);
  return (
    <section id={category.slug} aria-labelledby={`h-${category.slug}`} className="scroll-mt-32 pt-10">
      <OrnamentHeading id={`h-${category.slug}`}>{category.name}</OrnamentHeading>
      {category.description && <p className="mt-2 text-center text-[15px] text-ink-2">{category.description}</p>}

      {category.products.length === 0 && (
        <p className="mx-auto mt-6 max-w-md rounded-[6px] border border-dashed border-line px-4 py-6 text-center text-ink-2">
          אין כרגע מנות זמינות בקטגוריה הזו. כדאי לבדוק שוב לקראת חמישי.
        </p>
      )}

      {withPhoto.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {withPhoto.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={eagerImages && i < 2} compact />
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <ul className="mt-4 grid gap-x-12 divide-y divide-line/70 rounded-[6px] border border-line bg-surface px-4 sm:px-6 md:grid-cols-2 md:divide-y-0 md:[&>li]:border-b md:[&>li]:border-line/70">
          {rows.map((p) => (
            <MenuRow key={p.id} product={p} />
          ))}
        </ul>
      )}
    </section>
  );
}
