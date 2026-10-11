export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Normalises Israeli phone numbers to "05X-XXXXXXX" / "0X-XXXXXXX"; returns null if invalid. */
export function normalizeIsraeliPhone(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+972")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("972")) digits = "0" + digits.slice(3);
  digits = digits.replace(/\D/g, "");
  if (/^05\d{8}$/.test(digits)) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (/^0[2-489]\d{7}$/.test(digits)) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  if (/^07\d{8}$/.test(digits)) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return null;
}

export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || "item";
}
