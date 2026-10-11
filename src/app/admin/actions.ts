"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logout, requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/action-result";
import { ORDER_STATUSES, STATUS_LABEL } from "@/domain/order-status";
import { addOrderNote, editOrder, setOrderStatus } from "@/server/orders";
import {
  addBlock,
  deleteCategory,
  deleteProduct,
  deleteWindow,
  moveCategory,
  moveProduct,
  removeBlock,
  saveCategory,
  saveProduct,
  saveSettings,
  saveUploadedImage,
  saveWindow,
  setCategoryVisible,
  setProductFlags,
  setWindowActive,
  type ProductInput,
} from "@/server/admin-catalog";

/* Every action: requireAdmin() → validate → server module → revalidate → {ok, error?}. */

const id = z.string().min(1).max(64);
const direction = z.enum(["up", "down"]);
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין");

const INVALID = "הנתונים שנשלחו לא תקינים";
const FAILED = "הפעולה נכשלה. נסו שוב.";

function firstIssue(err: z.ZodError) {
  return err.issues[0]?.message || INVALID;
}

/** Admin screens are fully dynamic; the layout revalidation also refreshes the NEW-orders badge. */
function refreshAdmin() {
  revalidatePath("/admin", "layout");
}
/** Catalog / pickup changes are visible to customers too. */
function refreshStore() {
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/checkout");
}

async function guarded<T extends object>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    // let Next handle redirect()/notFound() control-flow errors
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e;
    console.error("[admin action]", e);
    return { ok: false, error: FAILED };
  }
}

/* --------------------------------------------------------------- session --- */

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

/* ---------------------------------------------------------------- orders --- */

export async function setOrderStatusAction(orderId: string, status: string): Promise<ActionResult<{ label: string }>> {
  const admin = await requireAdmin();
  const parsed = z.object({ orderId: id, status: z.enum(ORDER_STATUSES) }).safeParse({ orderId, status });
  if (!parsed.success) return { ok: false, error: INVALID };
  return guarded(async () => {
    const r = await setOrderStatus(parsed.data.orderId, parsed.data.status, admin.id);
    if (!r.ok) return r;
    refreshAdmin();
    return { ok: true, label: STATUS_LABEL[parsed.data.status] };
  });
}

const orderEditSchema = z.object({
  customerName: z.string().trim().min(2, "נא למלא שם לקוח").max(80, "השם ארוך מדי"),
  customerPhone: z.string().trim().min(1, "נא למלא טלפון").max(20),
  recipientName: z.string().trim().max(80).default(""),
  notes: z.string().trim().max(600, "ההערות ארוכות מדי (עד 600 תווים)").default(""),
  pickupDate: ymd,
  pickupWindowId: z.string().min(1, "נא לבחור חלון איסוף"),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        variantId: z.string().optional(),
        quantity: z.number().int().min(0).max(99, "כמות מקסימלית לשורה: 99"),
      }),
    )
    .max(100),
});

export async function editOrderAction(orderId: string, input: z.input<typeof orderEditSchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!id.safeParse(orderId).success) return { ok: false, error: INVALID };
  const parsed = orderEditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return guarded(async () => {
    const r = await editOrder(orderId, parsed.data, admin.id);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore(); // window capacity may have changed
    return { ok: true };
  });
}

export async function addOrderNoteAction(orderId: string, message: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = z.object({ orderId: id, message: z.string().trim().min(1, "ההערה ריקה").max(500, "ההערה ארוכה מדי (עד 500 תווים)") }).safeParse({ orderId, message });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return guarded(async () => {
    const r = await addOrderNote(parsed.data.orderId, parsed.data.message, admin.id);
    if (!r.ok) return r;
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);
    return { ok: true };
  });
}

/* -------------------------------------------------------------- products --- */

const flagsSchema = z
  .object({ isActive: z.boolean().optional(), isFeatured: z.boolean().optional(), soldOutToday: z.boolean().optional() })
  .refine((f) => Object.keys(f).length > 0);

export async function setProductFlagsAction(productId: string, flags: z.input<typeof flagsSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ productId: id, flags: flagsSchema }).safeParse({ productId, flags });
  if (!parsed.success) return { ok: false, error: INVALID };
  return guarded(async () => {
    const r = await setProductFlags(parsed.data.productId, parsed.data.flags);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true };
  });
}

export async function moveProductAction(productId: string, dir: "up" | "down"): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ productId: id, dir: direction }).safeParse({ productId, dir });
  if (!parsed.success) return { ok: false, error: INVALID };
  return guarded(async () => {
    const r = await moveProduct(parsed.data.productId, parsed.data.dir);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true };
  });
}

export async function deleteProductAction(productId: string): Promise<ActionResult<{ archived: boolean }>> {
  await requireAdmin();
  if (!id.safeParse(productId).success) return { ok: false, error: INVALID };
  return guarded<{ archived: boolean }>(async () => {
    const r = await deleteProduct(productId);
    if (!r.ok) return { ok: false, error: r.error };
    refreshAdmin();
    refreshStore();
    return { ok: true, archived: Boolean(r.archived) };
  });
}

export async function saveProductAction(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  // full validation lives in saveProduct (productInputSchema)
  return guarded(async () => {
    const r = await saveProduct(input);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true, id: r.id ?? "" };
  });
}

export async function uploadImageAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "לא נבחר קובץ" };
  return guarded(async () => {
    const r = await saveUploadedImage(file);
    if (!r.ok) return r;
    return { ok: true, url: r.url };
  });
}

/* ------------------------------------------------------------ categories --- */

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "נא למלא שם קטגוריה").max(60, "השם ארוך מדי"),
  description: z.string().trim().max(200, "התיאור ארוך מדי (עד 200 תווים)").default(""),
  isVisible: z.boolean().optional(),
});

export async function saveCategoryAction(input: z.input<typeof categorySchema>): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return guarded(async () => {
    const r = await saveCategory(parsed.data);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true, id: r.id ?? "" };
  });
}

export async function setCategoryVisibleAction(categoryId: string, isVisible: boolean): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ categoryId: id, isVisible: z.boolean() }).safeParse({ categoryId, isVisible });
  if (!parsed.success) return { ok: false, error: INVALID };
  return guarded(async () => {
    const r = await setCategoryVisible(parsed.data.categoryId, parsed.data.isVisible);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true };
  });
}

export async function moveCategoryAction(categoryId: string, dir: "up" | "down"): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ categoryId: id, dir: direction }).safeParse({ categoryId, dir });
  if (!parsed.success) return { ok: false, error: INVALID };
  return guarded(async () => {
    const r = await moveCategory(parsed.data.categoryId, parsed.data.dir);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true };
  });
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id.safeParse(categoryId).success) return { ok: false, error: INVALID };
  return guarded(async () => {
    const r = await deleteCategory(categoryId);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true };
  });
}

/* ---------------------------------------------------------------- pickup --- */

const windowSchema = z.object({
  id: z.string().optional(),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  capacity: z.number().int().nullable(),
  isActive: z.boolean(),
});

export async function saveWindowAction(input: z.input<typeof windowSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = windowSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };
  return guarded(async () => {
    const r = await saveWindow(parsed.data); // validates times / capacity
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true };
  });
}

export async function setWindowActiveAction(windowId: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ windowId: id, isActive: z.boolean() }).safeParse({ windowId, isActive });
  if (!parsed.success) return { ok: false, error: INVALID };
  return guarded(async () => {
    const r = await setWindowActive(parsed.data.windowId, parsed.data.isActive);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true };
  });
}

export async function deleteWindowAction(windowId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id.safeParse(windowId).success) return { ok: false, error: INVALID };
  return guarded(async () => {
    const r = await deleteWindow(windowId);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true };
  });
}

export async function addBlockAction(input: { date: string; windowId: string | null; reason: string }): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z
    .object({ date: ymd, windowId: z.string().max(64).nullable(), reason: z.string().max(120, "הסיבה ארוכה מדי (עד 120 תווים)") })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return guarded(async () => {
    const r = await addBlock(parsed.data);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true };
  });
}

export async function removeBlockAction(blockId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id.safeParse(blockId).success) return { ok: false, error: INVALID };
  return guarded(async () => {
    const r = await removeBlock(blockId);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true };
  });
}

const settingsSchema = z.object({
  isOrderingOpen: z.boolean(),
  closedMessage: z.string().max(200, "הודעת הסגירה ארוכה מדי (עד 200 תווים)"),
  minLeadHours: z.number({ error: "זמן הכנה מינימלי לא תקין" }).int("זמן הכנה מינימלי חייב להיות מספר שלם"),
  maxDaysAhead: z.number({ error: "טווח ימים לא תקין" }).int("טווח הימים חייב להיות מספר שלם"),
  phone: z.string().max(30),
  whatsapp: z.string().max(30),
  address: z.string().max(200),
  hoursText: z.string().max(600, "טקסט שעות הפתיחה ארוך מדי"),
});

export async function saveSettingsAction(input: z.input<typeof settingsSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return guarded(async () => {
    const r = await saveSettings(parsed.data);
    if (!r.ok) return r;
    refreshAdmin();
    refreshStore();
    return { ok: true };
  });
}
