"use client";

import Image from "next/image";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { StoreProduct } from "@/server/catalog";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { QuantityStepper } from "@/components/ui/stepper";
import { useCart } from "./cart-context";

/**
 * Photo card — used for products that have a real (or clearly-marked illustrative) photo.
 * `compact`: on phones the photo becomes a side thumbnail so a category fits on a screen or two.
 */
export function ProductCard({ product, priority, compact }: { product: StoreProduct; priority?: boolean; compact?: boolean }) {
  const { quantityOf, add, setQuantity } = useCart();
  const [selectedId, setSelectedId] = useState(product.variants[0]?.id);
  const selected = product.variants.find((v) => v.id === selectedId) ?? product.variants[0];
  const qty = selected ? quantityOf(selected.id) : 0;
  const multi = product.variants.length > 1;

  return (
    <article
      className={cn(
        "group flex w-full overflow-hidden rounded-[6px] border border-line bg-surface shadow-card",
        compact ? "flex-row sm:flex-col" : "flex-col",
        product.soldOut && "opacity-75",
      )}
      aria-label={product.name}
    >
      <div className={cn("relative overflow-hidden bg-surface-2", compact ? "w-[116px] shrink-0 sm:aspect-[4/3] sm:w-auto" : "aspect-[4/3]")}>
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority={priority}
            sizes={compact ? "(min-width: 1024px) 280px, (min-width: 640px) 45vw, 116px" : "(min-width: 1024px) 280px, (min-width: 640px) 45vw, 80vw"}
            className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.03]", product.soldOut && "grayscale")}
          />
        )}
        {product.imageIsIllustration && (
          <span className="absolute bottom-2 start-2 rounded-[4px] bg-night/75 px-1.5 py-0.5 text-[11px] font-semibold text-on-night">להמחשה</span>
        )}
        {product.soldOut && (
          <span className="absolute top-2 start-2 rounded-[4px] bg-tomato px-2 py-1 text-[13px] font-bold text-white">אזל להיום</span>
        )}
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", compact ? "gap-2.5 p-3 sm:gap-3 sm:p-4" : "gap-3 p-4")}>
        <div>
          <h3 className={cn("font-display font-bold leading-tight", compact ? "text-[19px] sm:text-[21px]" : "text-[21px]")}>{product.name}</h3>
          {product.description && <p className="mt-1 line-clamp-2 text-[15px] leading-snug text-ink-2">{product.description}</p>}
        </div>

        {multi && (
          <div role="radiogroup" aria-label={`גודל: ${product.name}`} className="flex flex-wrap gap-1.5">
            {product.variants.map((v) => {
              const active = v.id === selected?.id;
              const inCart = quantityOf(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedId(v.id)}
                  className={cn(
                    "min-h-9 rounded-full border px-3 text-[14px] font-semibold transition-colors",
                    active ? "border-night bg-night text-on-night" : "border-line bg-surface hover:border-ink-3",
                  )}
                >
                  {v.label}
                  {inCart > 0 && <span className="num ms-1 text-gold-bright">·{inCart}</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="leading-tight">
            <span className="num block text-xl font-extrabold">{selected && formatPrice(selected.priceAgorot)}</span>
            {!multi && selected && <span className="text-[13px] text-ink-2">{selected.label}</span>}
          </div>
          {product.soldOut ? (
            <span className="text-[15px] font-bold text-tomato">לא זמין היום</span>
          ) : qty > 0 && selected ? (
            <QuantityStepper value={qty} onChange={(q) => setQuantity(selected.id, q)} label={`${product.name} ${selected.label}`} tone="gold" />
          ) : (
            <button
              type="button"
              onClick={() => selected && add(selected.id)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[6px] bg-night px-4 font-bold text-on-night transition-colors hover:bg-night-2 active:scale-[0.98]"
              aria-label={`הוספה לסל: ${product.name}${multi && selected ? `, ${selected.label}` : ""}`}
            >
              <Plus className="size-4 text-gold-bright" strokeWidth={2.6} aria-hidden />
              הוספה
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
