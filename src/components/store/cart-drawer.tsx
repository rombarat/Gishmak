"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ShoppingBag, X } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { buttonClass } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/stepper";
import { useCart, type CartLine } from "./cart-context";

/** Side panel on desktop (slides from the inline-end, i.e. left in RTL), bottom sheet on mobile. */
export function CartDrawer() {
  const { isOpen, close, lines, unavailable, subtotalAgorot, count } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus();
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-night/55" onClick={close} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] animate-sheet-up flex-col rounded-t-[14px] bg-paper shadow-pop outline-none md:inset-y-0 md:end-0 md:start-auto md:max-h-none md:w-[420px] md:animate-fade-in md:rounded-none"
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line md:hidden" aria-hidden />
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="cart-title" className="font-display text-2xl font-bold">
            הסל שלי
            {count > 0 && <span className="num ms-2 font-sans text-base font-semibold text-ink-2">({count})</span>}
          </h2>
          <button onClick={close} aria-label="סגירת הסל" className="grid size-11 place-items-center rounded-full hover:bg-surface-2">
            <X className="size-5" />
          </button>
        </div>

        {lines.length === 0 && unavailable.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <ShoppingBag className="size-10 text-gold" aria-hidden />
            <div>
              <p className="font-display text-xl font-bold">הסל עדיין ריק</p>
              <p className="mt-1 text-ink-2">צ׳ולנט, קוגל וכמה סלטים — וזה כבר שבת.</p>
            </div>
            <Link href="/menu" onClick={close} className={buttonClass("dark", "md")}>
              לתפריט
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((l) => (
                <CartRow key={l.variantId} line={l} />
              ))}
              {unavailable.map((l) => (
                <UnavailableRow key={l.variantId} line={l} />
              ))}
            </ul>
            <div className="border-t border-line bg-surface px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <dl className="space-y-1 text-[15px]">
                <div className="flex justify-between text-ink-2">
                  <dt>סכום ביניים</dt>
                  <dd className="num">{formatPrice(subtotalAgorot)}</dd>
                </div>
                <div className="flex justify-between text-ink-2">
                  <dt>איסוף עצמי</dt>
                  <dd>ללא עלות</dd>
                </div>
                <div className="flex justify-between pt-1 text-lg font-extrabold">
                  <dt>סה״כ לתשלום באיסוף</dt>
                  <dd className="num">{formatPrice(subtotalAgorot)}</dd>
                </div>
              </dl>
              {lines.length > 0 ? (
                <Link href="/checkout" onClick={close} className={buttonClass("gold", "lg", "mt-4 w-full")}>
                  להמשך ההזמנה
                </Link>
              ) : (
                <p className="mt-3 text-sm font-semibold text-tomato">הסירו את הפריטים שאינם זמינים כדי להמשיך.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CartRow({ line }: { line: CartLine }) {
  const { setQuantity } = useCart();
  return (
    <li className="flex gap-3 py-4">
      {line.imageUrl ? (
        <Image src={line.imageUrl} alt="" width={64} height={64} className="size-16 shrink-0 rounded-[6px] object-cover" />
      ) : (
        <div className="grid size-16 shrink-0 place-items-center rounded-[6px] bg-surface-2 font-display text-xl font-bold text-gold-ink" aria-hidden>
          {line.productName.slice(0, 1)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-bold leading-snug">{line.productName}</p>
        <p className="text-sm text-ink-2">
          {line.variantLabel} · <span className="num">{formatPrice(line.priceAgorot)}</span> ליחידה
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <QuantityStepper size="sm" value={line.quantity} onChange={(q) => setQuantity(line.variantId, q)} label={line.productName} />
          <span className="num font-extrabold">{formatPrice(line.lineTotalAgorot)}</span>
        </div>
      </div>
    </li>
  );
}

function UnavailableRow({ line }: { line: CartLine }) {
  const { remove } = useCart();
  return (
    <li className="flex items-center gap-3 py-4 opacity-80">
      <div className="min-w-0 flex-1">
        <p className="font-bold text-ink-2 line-through">{line.productName}</p>
        <p className="text-sm font-semibold text-tomato">לא זמין כרגע</p>
      </div>
      <button onClick={() => remove(line.variantId)} className={buttonClass("outline", "sm")}>
        הסרה
      </button>
    </li>
  );
}
