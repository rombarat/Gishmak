import { z } from "zod";
import { normalizeIsraeliPhone } from "@/lib/utils";

export const MAX_QTY_PER_LINE = 50;

export const cartLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE),
});

/** Shared by the checkout form (client) and placeOrder (server). */
export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "נא למלא שם מלא").max(80, "השם ארוך מדי"),
  customerPhone: z
    .string()
    .trim()
    .min(1, "נא למלא מספר טלפון")
    .refine((v) => normalizeIsraeliPhone(v) !== null, "מספר הטלפון לא תקין. לדוגמה: 050-1234567"),
  recipientName: z.string().trim().max(80).optional().default(""),
  notes: z.string().trim().max(600, "ההערות ארוכות מדי (עד 600 תווים)").optional().default(""),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "נא לבחור יום איסוף"),
  pickupWindowId: z.string().min(1, "נא לבחור שעת איסוף"),
  confirmDetails: z.literal(true, { error: "נא לאשר את פרטי ההזמנה" }),
  lines: z.array(cartLineSchema).min(1, "הסל ריק"),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CartLineInput = z.infer<typeof cartLineSchema>;
