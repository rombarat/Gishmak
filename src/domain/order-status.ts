export const ORDER_STATUSES = ["NEW", "CONFIRMED", "PREPARING", "READY", "PICKED_UP", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "חדשה",
  CONFIRMED: "אושרה",
  PREPARING: "בהכנה",
  READY: "מוכנה לאיסוף",
  PICKED_UP: "נאספה",
  CANCELLED: "בוטלה",
};

/** The single most likely next step — powers the one-tap button in the orders list. */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  NEW: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "PICKED_UP",
};

export const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  NEW: "אישור",
  CONFIRMED: "התחלת הכנה",
  PREPARING: "מוכנה",
  READY: "נאספה",
};

/** Orders that still need kitchen work. */
export const OPEN_STATUSES: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING"];
export const ACTIVE_STATUSES: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING", "READY"];

export function isOrderStatus(v: unknown): v is OrderStatus {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: "תשלום באיסוף",
  PENDING: "ממתין לתשלום",
  PAID: "שולם",
  PARTIALLY_REFUNDED: "הוחזר חלקית",
  REFUNDED: "הוחזר",
  FAILED: "תשלום נכשל",
};

export function formatOrderNumber(n: number): string {
  return `#${n}`;
}
