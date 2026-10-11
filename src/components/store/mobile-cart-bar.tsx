"use client";

import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { useCart } from "./cart-context";

/** Always-reachable cart on phones once something is in it. */
export function MobileCartBar() {
  const { count, subtotalAgorot, open, hydrated, isOpen } = useCart();
  const pathname = usePathname();
  if (!hydrated || count === 0 || isOpen || pathname.startsWith("/checkout") || pathname.startsWith("/order")) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <button
        type="button"
        onClick={open}
        className="flex min-h-14 w-full animate-toast items-center gap-3 rounded-[8px] bg-night px-4 text-on-night shadow-pop"
      >
        <span className="relative">
          <ShoppingBag className="size-6 text-gold-bright" aria-hidden />
          <span className="num absolute -end-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-gold-bright px-1 text-xs font-extrabold text-night">
            {count}
          </span>
        </span>
        <span className="text-[16px] font-bold">לצפייה בסל</span>
        <span className="num ms-auto text-[16px] font-extrabold text-gold-bright">{formatPrice(subtotalAgorot)}</span>
      </button>
    </div>
  );
}
