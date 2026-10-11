import { WEEKDAY_HE, formatWindow } from "@/lib/time";

type ItemLike = { productName: string; variantLabel: string; quantity: number };

/** "טשולנט הבית · קופסה 1 ליטר ×2" */
export function itemLine(i: ItemLike): string {
  return `${i.productName} · ${i.variantLabel} ×${i.quantity}`;
}

export function itemCount(items: { quantity: number }[]): number {
  return items.reduce((s, i) => s + i.quantity, 0);
}

/** "חמישי 19:00–22:00" */
export function windowLabel(w: { weekday: number; startTime: string; endTime: string }): string {
  return `${WEEKDAY_HE[w.weekday]} ${formatWindow(w.startTime, w.endTime)}`;
}

/** "050-1234567" → "972501234567" for wa.me links. */
export function waNumber(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("0") ? `972${d.slice(1)}` : d;
}

const LRI = String.fromCharCode(0x2066); // left-to-right isolate
const PDI = String.fromCharCode(0x2069); // pop directional isolate

/** "#1008" wrapped in bidi isolates so it never flips inside Hebrew text (toasts, confirms). */
export function orderRef(n: number): string {
  return `${LRI}#${n}${PDI}`;
}

/** Hebrew plural for counted nouns: plural(3, "הזמנה", "הזמנות") → "3 הזמנות", 1 → "הזמנה אחת". */
export function plural(n: number, one: string, many: string, oneWord = "אחת"): string {
  return n === 1 ? `${one} ${oneWord}` : `${n} ${many}`;
}
