import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { addDays, todayIL } from "@/lib/time";
import { normalizeIsraeliPhone } from "@/lib/utils";
import { checkoutSchema, MAX_QTY_PER_LINE, type CheckoutInput } from "@/domain/checkout";
import { ACTIVE_STATUSES, OPEN_STATUSES, STATUS_LABEL, isOrderStatus, type OrderStatus } from "@/domain/order-status";
import { getSettings } from "./settings";
import { validatePickup } from "./pickup";

export type PlaceOrderResult =
  | { ok: true; orderNumber: number; publicToken: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; unavailable?: string[] };

type PricedLine = {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  unitPriceAgorot: number;
  quantity: number;
  lineTotalAgorot: number;
};

/**
 * Re-prices cart lines from the database. Client prices are never trusted.
 * Returns names of lines that can no longer be ordered.
 */
async function priceLines(lines: { variantId: string; quantity: number }[]) {
  const today = todayIL();
  const merged = new Map<string, number>();
  for (const l of lines) merged.set(l.variantId, Math.min(MAX_QTY_PER_LINE, (merged.get(l.variantId) ?? 0) + l.quantity));
  const variants = await db.productVariant.findMany({
    where: { id: { in: [...merged.keys()] } },
    include: { product: { include: { category: true } } },
  });
  const priced: PricedLine[] = [];
  const unavailable: string[] = [];
  for (const [variantId, quantity] of merged) {
    const v = variants.find((x) => x.id === variantId);
    if (!v) {
      unavailable.push("פריט שהוסר מהתפריט");
      continue;
    }
    const p = v.product;
    if (!v.isActive || !p.isActive || p.isArchived || !p.category.isVisible || p.soldOutDate === today) {
      unavailable.push(`${p.name} (${v.label})`);
      continue;
    }
    priced.push({
      productId: p.id,
      variantId: v.id,
      productName: p.name,
      variantLabel: v.label,
      unitPriceAgorot: v.priceAgorot,
      quantity,
      lineTotalAgorot: v.priceAgorot * quantity,
    });
  }
  return { priced, unavailable };
}

/**
 * Creates an order. Payment-ready: today every order is PAY_AT_PICKUP/UNPAID.
 * To add online payment later, create the order with paymentMethod "ONLINE",
 * paymentStatus "PENDING", insert a Payment row and redirect to the provider;
 * the provider webhook then flips paymentStatus — this function stays the same.
 */
export async function placeOrder(input: CheckoutInput): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "יש לתקן כמה פרטים בטופס", fieldErrors };
  }
  const data = parsed.data;
  const settings = await getSettings();
  if (!settings.isOrderingOpen) return { ok: false, error: settings.closedMessage };

  const { priced, unavailable } = await priceLines(data.lines);
  if (unavailable.length) {
    return { ok: false, error: "חלק מהפריטים בסל כבר לא זמינים. הסירו אותם ונסו שוב.", unavailable };
  }
  if (!priced.length) return { ok: false, error: "הסל ריק" };

  const pickup = await validatePickup(data.pickupDate, data.pickupWindowId);
  if (!pickup.ok) return { ok: false, error: pickup.error, fieldErrors: { pickupWindowId: pickup.error } };

  const subtotal = priced.reduce((s, l) => s + l.lineTotalAgorot, 0);
  const publicToken = randomBytes(12).toString("base64url");

  const order = await db.$transaction(async (tx) => {
    const s = await tx.storeSettings.update({ where: { id: 1 }, data: { nextOrderNumber: { increment: 1 } } });
    const orderNumber = s.nextOrderNumber - 1;
    return tx.order.create({
      data: {
        orderNumber,
        publicToken,
        status: "NEW",
        customerName: data.customerName,
        customerPhone: normalizeIsraeliPhone(data.customerPhone)!,
        recipientName: data.recipientName || null,
        notes: data.notes ?? "",
        pickupDate: data.pickupDate,
        pickupWindowId: data.pickupWindowId,
        pickupStart: pickup.window.start,
        pickupEnd: pickup.window.end,
        subtotalAgorot: subtotal,
        totalAgorot: subtotal,
        items: { create: priced },
        events: { create: { type: "CREATED", toStatus: "NEW", message: "ההזמנה התקבלה מהאתר" } },
      },
    });
  });

  return { ok: true, orderNumber: order.orderNumber, publicToken };
}

export async function getOrderByToken(token: string) {
  return db.order.findUnique({ where: { publicToken: token }, include: { items: true } });
}

/* ---------------------------------------------------------------- admin --- */

export type OrderView = "today" | "tomorrow" | "new" | "prep" | "ready" | "done" | "all";

export type OrderFilters = {
  view?: OrderView;
  q?: string;
  status?: string;
  date?: string;
  windowId?: string;
};

export function buildOrderWhere(f: OrderFilters): Prisma.OrderWhereInput {
  const today = todayIL();
  const where: Prisma.OrderWhereInput = {};
  const and: Prisma.OrderWhereInput[] = [];
  switch (f.view) {
    case "today":
      and.push({ pickupDate: today, status: { not: "CANCELLED" } });
      break;
    case "tomorrow":
      and.push({ pickupDate: addDays(today, 1), status: { not: "CANCELLED" } });
      break;
    case "new":
      and.push({ status: "NEW" });
      break;
    case "prep":
      and.push({ status: { in: ["CONFIRMED", "PREPARING"] } });
      break;
    case "ready":
      and.push({ status: "READY" });
      break;
    case "done":
      and.push({ status: { in: ["PICKED_UP", "CANCELLED"] } });
      break;
  }
  if (f.status && isOrderStatus(f.status)) and.push({ status: f.status });
  if (f.date) and.push({ pickupDate: f.date });
  if (f.windowId) and.push({ pickupWindowId: f.windowId });
  const q = f.q?.trim();
  if (q) {
    const num = Number(q.replace(/^#/, ""));
    const digits = q.replace(/\D/g, "");
    const or: Prisma.OrderWhereInput[] = [{ customerName: { contains: q } }, { recipientName: { contains: q } }];
    if (Number.isInteger(num) && num > 0) or.push({ orderNumber: num });
    if (digits.length >= 3) {
      // phones are stored as 05X-XXXXXXX; match on digit runs either side of the dash
      or.push({ customerPhone: { contains: digits } });
      if (digits.length > 3) or.push({ customerPhone: { contains: `${digits.slice(0, 3)}-${digits.slice(3)}` } });
    }
    and.push({ OR: or });
  }
  if (and.length) where.AND = and;
  return where;
}

export async function listOrders(f: OrderFilters) {
  const finished = f.view === "done";
  return db.order.findMany({
    where: buildOrderWhere(f),
    include: { items: true },
    orderBy: finished
      ? [{ pickupDate: "desc" }, { pickupStart: "desc" }]
      : [{ pickupDate: "asc" }, { pickupStart: "asc" }, { orderNumber: "asc" }],
    take: 300,
  });
}

export async function countOrdersByView() {
  const today = todayIL();
  const tomorrow = addDays(today, 1);
  const [t, tm, n, p, r] = await Promise.all([
    db.order.count({ where: { pickupDate: today, status: { not: "CANCELLED" } } }),
    db.order.count({ where: { pickupDate: tomorrow, status: { not: "CANCELLED" } } }),
    db.order.count({ where: { status: "NEW" } }),
    db.order.count({ where: { status: { in: ["CONFIRMED", "PREPARING"] } } }),
    db.order.count({ where: { status: "READY" } }),
  ]);
  return { today: t, tomorrow: tm, new: n, prep: p, ready: r } as Record<string, number>;
}

export async function getOrderForAdmin(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { productName: "asc" } },
      events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
      payments: true,
    },
  });
}

export async function setOrderStatus(orderId: string, status: OrderStatus, actorId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) return { ok: false as const, error: "ההזמנה לא נמצאה" };
  if (order.status === status) return { ok: true as const };
  await db.order.update({
    where: { id: orderId },
    data: {
      status,
      events: {
        create: {
          type: "STATUS_CHANGED",
          fromStatus: order.status,
          toStatus: status,
          actorId,
          message: `${STATUS_LABEL[order.status as OrderStatus] ?? order.status} ← ${STATUS_LABEL[status]}`,
        },
      },
    },
  });
  return { ok: true as const };
}

export type OrderEditInput = {
  customerName: string;
  customerPhone: string;
  recipientName: string;
  notes: string;
  pickupDate: string;
  pickupWindowId: string;
  items: { id?: string; variantId?: string; quantity: number }[];
};

/** Admin edit — may bypass lead time / capacity (the owner decides), but re-prices new lines. */
export async function editOrder(orderId: string, input: OrderEditInput, actorId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { ok: false as const, error: "ההזמנה לא נמצאה" };
  const phone = normalizeIsraeliPhone(input.customerPhone);
  if (!phone) return { ok: false as const, error: "מספר הטלפון לא תקין" };
  if (input.customerName.trim().length < 2) return { ok: false as const, error: "נא למלא שם לקוח" };

  const window = await db.pickupWindow.findUnique({ where: { id: input.pickupWindowId } });
  if (!window) return { ok: false as const, error: "חלון איסוף לא קיים" };

  const keep = input.items.filter((i) => i.id && i.quantity > 0);
  const added = input.items.filter((i) => !i.id && i.variantId && i.quantity > 0);
  const newVariants = await db.productVariant.findMany({
    where: { id: { in: added.map((a) => a.variantId!) } },
    include: { product: true },
  });

  const changes: string[] = [];
  const ops: Prisma.PrismaPromise<unknown>[] = [];
  for (const it of order.items) {
    const k = keep.find((x) => x.id === it.id);
    if (!k) {
      ops.push(db.orderItem.delete({ where: { id: it.id } }));
      changes.push(`הוסר: ${it.productName}`);
    } else if (k.quantity !== it.quantity) {
      ops.push(db.orderItem.update({ where: { id: it.id }, data: { quantity: k.quantity, lineTotalAgorot: k.quantity * it.unitPriceAgorot } }));
      changes.push(`${it.productName}: ${it.quantity} ← ${k.quantity}`);
    }
  }
  for (const a of added) {
    const v = newVariants.find((x) => x.id === a.variantId);
    if (!v) continue;
    ops.push(
      db.orderItem.create({
        data: {
          orderId,
          productId: v.productId,
          variantId: v.id,
          productName: v.product.name,
          variantLabel: v.label,
          unitPriceAgorot: v.priceAgorot,
          quantity: a.quantity,
          lineTotalAgorot: v.priceAgorot * a.quantity,
        },
      }),
    );
    changes.push(`נוסף: ${v.product.name} × ${a.quantity}`);
  }
  if (keep.length + added.length === 0) return { ok: false as const, error: "בהזמנה חייב להיות לפחות פריט אחד" };

  if (order.pickupDate !== input.pickupDate || order.pickupWindowId !== window.id) changes.push("מועד איסוף עודכן");
  if (order.customerName !== input.customerName.trim() || order.customerPhone !== phone) changes.push("פרטי לקוח עודכנו");
  if (order.notes !== input.notes.trim()) changes.push("הערות עודכנו");

  await db.$transaction(ops);
  const items = await db.orderItem.findMany({ where: { orderId } });
  const subtotal = items.reduce((s, i) => s + i.lineTotalAgorot, 0);
  await db.order.update({
    where: { id: orderId },
    data: {
      customerName: input.customerName.trim(),
      customerPhone: phone,
      recipientName: input.recipientName.trim() || null,
      notes: input.notes.trim(),
      pickupDate: input.pickupDate,
      pickupWindowId: window.id,
      pickupStart: window.startTime,
      pickupEnd: window.endTime,
      subtotalAgorot: subtotal,
      totalAgorot: subtotal - order.discountAgorot,
      events: changes.length ? { create: { type: "EDITED", actorId, message: changes.join(" · ") } } : undefined,
    },
  });
  return { ok: true as const };
}

export async function addOrderNote(orderId: string, message: string, actorId: string) {
  const text = message.trim();
  if (!text) return { ok: false as const, error: "ההערה ריקה" };
  await db.orderEvent.create({ data: { orderId, type: "NOTE", message: text.slice(0, 500), actorId } });
  return { ok: true as const };
}

/* ------------------------------------------------------------ dashboard --- */

export async function getDashboard() {
  const today = todayIL();
  const tomorrow = addDays(today, 1);
  const upcoming = await db.order.findMany({
    where: { pickupDate: { gte: today }, status: { not: "CANCELLED" } },
    include: { items: true },
    orderBy: [{ pickupDate: "asc" }, { pickupStart: "asc" }],
  });
  const todays = upcoming.filter((o) => o.pickupDate === today);
  const open = upcoming.filter((o) => (OPEN_STATUSES as string[]).includes(o.status));
  const newOrders = await db.order.findMany({
    where: { status: "NEW" },
    include: { items: true },
    orderBy: { createdAt: "asc" },
    take: 8,
  });
  const notesToday = todays.filter((o) => o.notes && (ACTIVE_STATUSES as string[]).includes(o.status));

  // pickup windows for the next pickup day that has orders
  const nextDay = upcoming.find((o) => (ACTIVE_STATUSES as string[]).includes(o.status))?.pickupDate ?? today;
  const windowMap = new Map<string, { start: string; end: string; total: number; ready: number; picked: number; orders: number }>();
  for (const o of upcoming.filter((x) => x.pickupDate === nextDay)) {
    const key = `${o.pickupStart}-${o.pickupEnd}`;
    const w = windowMap.get(key) ?? { start: o.pickupStart, end: o.pickupEnd, total: 0, ready: 0, picked: 0, orders: 0 };
    w.orders++;
    w.total += o.totalAgorot;
    if (o.status === "READY") w.ready++;
    if (o.status === "PICKED_UP") w.picked++;
    windowMap.set(key, w);
  }

  return {
    today,
    tomorrow,
    nextDay,
    counts: {
      new: await db.order.count({ where: { status: "NEW" } }),
      today: todays.length,
      toPrepare: open.length,
      readyToday: todays.filter((o) => o.status === "READY").length,
      pickedToday: todays.filter((o) => o.status === "PICKED_UP").length,
      tomorrow: upcoming.filter((o) => o.pickupDate === tomorrow).length,
    },
    salesToday: todays.reduce((s, o) => s + o.totalAgorot, 0),
    salesUpcoming: upcoming.reduce((s, o) => s + o.totalAgorot, 0),
    itemsToPrepare: open.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0),
    windows: [...windowMap.values()].sort((a, b) => a.start.localeCompare(b.start)),
    newOrders,
    notesToday,
    /** Next pickup day at a glance (the dashboard's primary block). */
    nextDaySummary: (() => {
      const list = upcoming.filter((o) => o.pickupDate === nextDay);
      return {
        orders: list.length,
        sales: list.reduce((s, o) => s + o.totalAgorot, 0),
        itemsOpen: list
          .filter((o) => (OPEN_STATUSES as string[]).includes(o.status))
          .reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0),
        withNotes: list.filter((o) => o.notes && (ACTIVE_STATUSES as string[]).includes(o.status)),
      };
    })(),
  };
}

/** Upcoming pickup dates that have active orders — powers the kitchen day chips. */
export async function listUpcomingPickupDays() {
  const rows = await db.order.groupBy({
    by: ["pickupDate"],
    where: { pickupDate: { gte: todayIL() }, status: { in: ACTIVE_STATUSES } },
    _count: { _all: true },
    orderBy: { pickupDate: "asc" },
    take: 10,
  });
  return rows.map((r) => ({ date: r.pickupDate, orders: r._count._all }));
}

/** Aggregated production list: what to cook for a pickup date. */
export async function getKitchenList(date: string) {
  const orders = await db.order.findMany({
    where: { pickupDate: date, status: { in: ["NEW", "CONFIRMED", "PREPARING", "READY"] } },
    include: { items: { include: { product: { include: { category: true } } } } },
    orderBy: [{ pickupStart: "asc" }, { orderNumber: "asc" }],
  });
  type Row = { name: string; category: string; categoryOrder: number; sizes: Map<string, number>; total: number; done: number };
  const rows = new Map<string, Row>();
  for (const o of orders) {
    for (const it of o.items) {
      const key = it.productId ?? it.productName;
      const r =
        rows.get(key) ??
        ({
          name: it.productName,
          category: it.product?.category.name ?? "אחר",
          categoryOrder: it.product?.category.sortOrder ?? 999,
          sizes: new Map(),
          total: 0,
          done: 0,
        } as Row);
      r.sizes.set(it.variantLabel, (r.sizes.get(it.variantLabel) ?? 0) + it.quantity);
      r.total += it.quantity;
      if (o.status === "READY") r.done += it.quantity;
      rows.set(key, r);
    }
  }
  const list = [...rows.values()]
    .sort((a, b) => a.categoryOrder - b.categoryOrder || a.name.localeCompare(b.name, "he"))
    .map((r) => ({ ...r, sizes: [...r.sizes.entries()].map(([label, qty]) => ({ label, qty })) }));
  return { orders, rows: list };
}
