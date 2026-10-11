"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/money";
import { useCart } from "./cart-context";

const NAV = [
  { href: "/menu", label: "התפריט" },
  { href: "/#how", label: "איך מזמינים" },
  { href: "/#visit", label: "שעות ואיסוף" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count, subtotalAgorot, open, hydrated } = useCart();
  const inCheckout = pathname.startsWith("/checkout");

  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold bg-night text-on-night">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="גישמאק — לדף הבית">
          <Image src="/images/logo-mark.png" alt="" width={112} height={34} priority className="h-8 w-auto sm:h-9" />
          <span className="hidden border-s border-night-3 ps-2.5 text-[13px] leading-tight text-on-night-2 sm:block">
            עונג שבת
            <br />
            בקריה
          </span>
        </Link>

        <nav aria-label="ראשי" className="ms-auto hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
              className={cn(
                "rounded-[6px] px-3 py-2 text-[15px] font-semibold transition-colors hover:bg-night-2",
                pathname === n.href && "text-gold-bright",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {!inCheckout && (
          <button
            type="button"
            onClick={open}
            className="ms-auto flex min-h-11 items-center gap-2 rounded-[6px] border border-night-3 bg-night-2 px-3 font-bold transition-colors hover:border-gold md:ms-2"
            aria-label={`הסל שלי, ${count} פריטים`}
          >
            <ShoppingBag className="size-5 text-gold-bright" aria-hidden />
            <span className="hidden sm:inline">הסל</span>
            {hydrated && count > 0 && (
              <>
                <span className="num grid h-6 min-w-6 place-items-center rounded-full bg-gold-bright px-1.5 text-[13px] font-extrabold text-night">
                  {count}
                </span>
                <span className="num hidden text-sm text-on-night-2 lg:inline">{formatPrice(subtotalAgorot)}</span>
              </>
            )}
          </button>
        )}
        {inCheckout && (
          <Link href="/menu" className="ms-auto text-[15px] font-semibold text-on-night-2 underline-offset-4 hover:text-on-night hover:underline">
            חזרה לתפריט
          </Link>
        )}
      </div>
    </header>
  );
}
