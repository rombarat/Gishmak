"use client";

import { Plus } from "lucide-react";
import type { StoreProduct, StoreVariant } from "@/server/catalog";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { QuantityStepper } from "@/components/ui/stepper";
import { useCart } from "./cart-context";

/**
 * A line on the printed menu: name, dotted leader, then each size with its price.
 * Used for products without a photo, so 30 salads read like the shop's menu card
 * instead of 30 empty cards. Desktop: one line. Phone: name line + a 2-column size grid.
 */
export function MenuRow({ product }: { product: StoreProduct }) {
  const { quantityOf } = useCart();
  const anyInCart = product.variants.some((v) => quantityOf(v.id) > 0);
  return (
    <li className={cn("py-3", product.soldOut && "opacity-70")}>
      <div className={cn("flex flex-col gap-2", !anyInCart && "lg:flex-row lg:items-center lg:gap-3")}>
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <h3 className="text-[17px] font-bold leading-snug">{product.name}</h3>
          {product.soldOut && <span className="shrink-0 rounded-[4px] bg-tomato-soft px-1.5 text-[12px] font-bold text-tomato">אזל להיום</span>}
          <span className="leader" aria-hidden />
        </div>
        <div className={cn("grid grid-cols-2 gap-2", !anyInCart && "lg:flex lg:shrink-0")}>
          {product.variants.map((v) => (
            <VariantChip key={v.id} product={product} variant={v} />
          ))}
        </div>
      </div>
      {product.description && <p className="mt-1 text-[14px] leading-snug text-ink-2">{product.description}</p>}
    </li>
  );
}

function VariantChip({ product, variant }: { product: StoreProduct; variant: StoreVariant }) {
  const { quantityOf, add, setQuantity } = useCart();
  const qty = quantityOf(variant.id);
  const label = `${product.name} ${variant.label}`;

  if (qty > 0) {
    // the chosen size takes the full row so the stepper has room
    return (
      <div className="col-span-2 flex min-h-12 items-center justify-between gap-2 rounded-[10px] border border-gold bg-gold-soft ps-3.5 pe-0.5">
        <span className="text-[14px] font-semibold">
          {variant.label} · <span className="num">{formatPrice(variant.priceAgorot)}</span>
        </span>
        <QuantityStepper size="sm" value={qty} onChange={(q) => setQuantity(variant.id, q)} label={label} tone="gold" />
      </div>
    );
  }
  return (
    <button
      type="button"
      disabled={product.soldOut}
      onClick={() => add(variant.id)}
      aria-label={`הוספה לסל: ${label}, ${formatPrice(variant.priceAgorot)}`}
      className="flex min-h-12 min-w-0 items-center justify-between gap-2 rounded-[10px] border border-line bg-surface py-1 ps-3 pe-1.5 text-start transition-colors hover:border-night disabled:cursor-not-allowed disabled:hover:border-line lg:min-w-36"
    >
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[13px] text-ink-2">{variant.label}</span>
        <span className="num text-[15px] font-extrabold">{formatPrice(variant.priceAgorot)}</span>
      </span>
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-night text-gold-bright" aria-hidden>
        <Plus className="size-4" strokeWidth={2.6} />
      </span>
    </button>
  );
}
