const ils = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Prices are stored as integer agorot. */
export function formatPrice(agorot: number): string {
  return ils.format(agorot / 100);
}

export function shekelsToAgorot(value: string | number): number {
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Math.round(n * 100);
}

export function agorotToShekels(agorot: number): string {
  const s = agorot / 100;
  return Number.isInteger(s) ? String(s) : s.toFixed(2);
}
