"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MAX_QTY_PER_LINE } from "@/domain/checkout";
import { useToast } from "@/components/ui/toast";

/** Live catalog facts the cart needs, keyed by variant id (passed from the server layout). */
export type VariantInfo = {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  priceAgorot: number;
  imageUrl: string | null;
  orderable: boolean; // false when hidden / sold out today
};

type StoredLine = { variantId: string; quantity: number };
export type CartLine = VariantInfo & { quantity: number; lineTotalAgorot: number };

type CartCtx = {
  hydrated: boolean;
  lines: CartLine[];
  unavailable: CartLine[];
  count: number;
  subtotalAgorot: number;
  quantityOf: (variantId: string) => number;
  add: (variantId: string, qty?: number) => void;
  setQuantity: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const STORAGE_KEY = "gishmak-cart-v1";
const CartContext = createContext<CartCtx | null>(null);

function readStorage(): StoredLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => typeof l?.variantId === "string" && Number.isInteger(l?.quantity) && l.quantity > 0)
      .map((l) => ({ variantId: l.variantId, quantity: Math.min(MAX_QTY_PER_LINE, l.quantity) }));
  } catch {
    return [];
  }
}

export function CartProvider({ variants, children }: { variants: VariantInfo[]; children: React.ReactNode }) {
  const toast = useToast();
  const [stored, setStored] = useState<StoredLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    setStored(readStorage());
    setHydrated(true);
    // keep several tabs in sync
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setStored(readStorage());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* private mode — cart still works for this visit */
    }
  }, [stored, hydrated]);

  const byId = useMemo(() => new Map(variants.map((v) => [v.variantId, v])), [variants]);

  const { lines, unavailable } = useMemo(() => {
    const ok: CartLine[] = [];
    const bad: CartLine[] = [];
    for (const s of stored) {
      const info = byId.get(s.variantId);
      if (!info) {
        bad.push({
          variantId: s.variantId,
          productId: "",
          productName: "פריט שהוסר מהתפריט",
          variantLabel: "",
          priceAgorot: 0,
          imageUrl: null,
          orderable: false,
          quantity: s.quantity,
          lineTotalAgorot: 0,
        });
        continue;
      }
      const line = { ...info, quantity: s.quantity, lineTotalAgorot: info.priceAgorot * s.quantity };
      (info.orderable ? ok : bad).push(line);
    }
    return { lines: ok, unavailable: bad };
  }, [stored, byId]);

  const quantityOf = useCallback((id: string) => stored.find((l) => l.variantId === id)?.quantity ?? 0, [stored]);

  const setQuantity = useCallback((variantId: string, qty: number) => {
    setStored((prev) => {
      const q = Math.max(0, Math.min(MAX_QTY_PER_LINE, Math.floor(qty)));
      if (q === 0) return prev.filter((l) => l.variantId !== variantId);
      if (prev.some((l) => l.variantId === variantId)) return prev.map((l) => (l.variantId === variantId ? { ...l, quantity: q } : l));
      return [...prev, { variantId, quantity: q }];
    });
  }, []);

  const add = useCallback(
    (variantId: string, qty = 1) => {
      const info = byId.get(variantId);
      if (!info?.orderable) {
        toast("המוצר לא זמין כרגע", { tone: "error" });
        return;
      }
      setStored((prev) => {
        const existing = prev.find((l) => l.variantId === variantId);
        if (existing) return prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QTY_PER_LINE, l.quantity + qty) } : l));
        return [...prev, { variantId, quantity: qty }];
      });
      toast(`${info.productName} נוסף לסל`, { tone: "success" });
    },
    [byId, toast],
  );

  const remove = useCallback(
    (variantId: string) => {
      let removed: StoredLine | undefined;
      let index = -1;
      setStored((prev) => {
        index = prev.findIndex((l) => l.variantId === variantId);
        removed = prev[index];
        return prev.filter((l) => l.variantId !== variantId);
      });
      const name = byId.get(variantId)?.productName ?? "הפריט";
      toast(`${name} הוסר מהסל`, {
        tone: "info",
        action: {
          label: "ביטול",
          onClick: () =>
            removed &&
            setStored((prev) => {
              if (prev.some((l) => l.variantId === removed!.variantId)) return prev;
              const next = [...prev];
              next.splice(Math.max(0, index), 0, removed!);
              return next;
            }),
        },
      });
    },
    [byId, toast],
  );

  const clear = useCallback(() => setStored([]), []);

  const value: CartCtx = {
    hydrated,
    lines,
    unavailable,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotalAgorot: lines.reduce((s, l) => s + l.lineTotalAgorot, 0),
    quantityOf,
    add,
    setQuantity: (id, q) => (q <= 0 ? remove(id) : setQuantity(id, q)),
    remove,
    clear,
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
