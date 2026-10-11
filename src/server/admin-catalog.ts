import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { db } from "@/lib/db";
import { todayIL } from "@/lib/time";
import { slugify } from "@/lib/utils";
import { shekelsToAgorot } from "@/lib/money";

type Result = { ok: true; id?: string } | { ok: false; error: string };

/* ------------------------------------------------------------- products --- */

export const productInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "נא למלא שם מוצר").max(80),
  description: z.string().trim().max(400).default(""),
  categoryId: z.string().min(1, "נא לבחור קטגוריה"),
  imageUrl: z.string().trim().max(300).nullable().default(null),
  imageIsIllustration: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().trim().min(1, "נא למלא שם לגודל"),
        price: z.union([z.string(), z.number()]).refine((v) => {
          const n = Number(String(v).replace(",", "."));
          return Number.isFinite(n) && n >= 0 && n <= 10000;
        }, "מחיר לא תקין"),
        isActive: z.boolean().default(true),
      }),
    )
    .min(1, "צריך לפחות גודל/מחיר אחד"),
});
export type ProductInput = z.input<typeof productInputSchema>;

export async function listProductsForAdmin() {
  return db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isArchived: false },
        orderBy: { sortOrder: "asc" },
        include: { variants: { orderBy: { sortOrder: "asc" } }, _count: { select: { orderItems: true } } },
      },
    },
  });
}

export async function getProductForAdmin(id: string) {
  return db.product.findUnique({ where: { id }, include: { variants: { orderBy: { sortOrder: "asc" } } } });
}

async function uniqueSlug(name: string, exceptId?: string) {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; ; i++) {
    const hit = await db.product.findUnique({ where: { slug } });
    if (!hit || hit.id === exceptId) return slug;
    slug = `${base}-${i}`;
  }
}

export async function saveProduct(raw: ProductInput): Promise<Result> {
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  const p = parsed.data;
  const base = {
    name: p.name,
    description: p.description,
    categoryId: p.categoryId,
    imageUrl: p.imageUrl || null,
    imageIsIllustration: p.imageUrl ? p.imageIsIllustration : false,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
  };

  if (!p.id) {
    const last = await db.product.findFirst({ where: { categoryId: p.categoryId }, orderBy: { sortOrder: "desc" } });
    const created = await db.product.create({
      data: {
        ...base,
        slug: await uniqueSlug(p.name),
        sortOrder: (last?.sortOrder ?? 0) + 10,
        variants: {
          create: p.variants.map((v, i) => ({ label: v.label, priceAgorot: shekelsToAgorot(v.price), sortOrder: i, isActive: v.isActive })),
        },
      },
    });
    return { ok: true, id: created.id };
  }

  const existing = await db.product.findUnique({ where: { id: p.id }, include: { variants: { include: { _count: { select: { orderItems: true } } } } } });
  if (!existing) return { ok: false, error: "המוצר לא נמצא" };
  await db.$transaction(async (tx) => {
    const moved = existing.categoryId !== p.categoryId;
    let sortOrder = existing.sortOrder;
    if (moved) {
      const last = await tx.product.findFirst({ where: { categoryId: p.categoryId }, orderBy: { sortOrder: "desc" } });
      sortOrder = (last?.sortOrder ?? 0) + 10;
    }
    await tx.product.update({ where: { id: p.id }, data: { ...base, sortOrder } });
    const keepIds = p.variants.filter((v) => v.id).map((v) => v.id!);
    for (const old of existing.variants.filter((v) => !keepIds.includes(v.id))) {
      // variants referenced by past orders are deactivated, not deleted
      if (old._count.orderItems > 0) await tx.productVariant.update({ where: { id: old.id }, data: { isActive: false, sortOrder: 999 } });
      else await tx.productVariant.delete({ where: { id: old.id } });
    }
    for (const [i, v] of p.variants.entries()) {
      const data = { label: v.label, priceAgorot: shekelsToAgorot(v.price), sortOrder: i, isActive: v.isActive };
      if (v.id) await tx.productVariant.update({ where: { id: v.id }, data });
      else await tx.productVariant.create({ data: { ...data, productId: p.id! } });
    }
  });
  return { ok: true, id: p.id };
}

export async function setProductFlags(id: string, flags: { isActive?: boolean; isFeatured?: boolean; soldOutToday?: boolean }): Promise<Result> {
  const data: { isActive?: boolean; isFeatured?: boolean; soldOutDate?: string | null } = {};
  if (flags.isActive !== undefined) data.isActive = flags.isActive;
  if (flags.isFeatured !== undefined) data.isFeatured = flags.isFeatured;
  if (flags.soldOutToday !== undefined) data.soldOutDate = flags.soldOutToday ? todayIL() : null;
  await db.product.update({ where: { id }, data });
  return { ok: true };
}

/** Hard-deletes products that never sold; archives the rest so order history keeps its links. */
export async function deleteProduct(id: string): Promise<Result & { archived?: boolean }> {
  const count = await db.orderItem.count({ where: { productId: id } });
  if (count > 0) {
    await db.product.update({ where: { id }, data: { isArchived: true, isActive: false, isFeatured: false } });
    return { ok: true, archived: true };
  }
  await db.product.delete({ where: { id } });
  return { ok: true, archived: false };
}

export async function moveProduct(id: string, direction: "up" | "down"): Promise<Result> {
  const p = await db.product.findUnique({ where: { id } });
  if (!p) return { ok: false, error: "המוצר לא נמצא" };
  const siblings = await db.product.findMany({ where: { categoryId: p.categoryId, isArchived: false }, orderBy: { sortOrder: "asc" } });
  return swapOrder(siblings, id, direction, (rid, sortOrder) => db.product.update({ where: { id: rid }, data: { sortOrder } }));
}

async function swapOrder<T extends { id: string }>(
  list: T[],
  id: string,
  direction: "up" | "down",
  write: (id: string, sortOrder: number) => Promise<unknown>,
): Promise<Result> {
  const idx = list.findIndex((x) => x.id === id);
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || target < 0 || target >= list.length) return { ok: true };
  const reordered = [...list];
  [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
  // renumber to keep gaps clean
  await Promise.all(reordered.map((x, i) => write(x.id, (i + 1) * 10)));
  return { ok: true };
}

/* ----------------------------------------------------------- categories --- */

export async function listCategoriesForAdmin() {
  return db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isArchived: false } } } } },
  });
}

export async function saveCategory(input: { id?: string; name: string; description: string; isVisible?: boolean }): Promise<Result> {
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "נא למלא שם קטגוריה" };
  const description = input.description.trim().slice(0, 200);
  if (input.id) {
    await db.category.update({ where: { id: input.id }, data: { name, description, isVisible: input.isVisible } });
    return { ok: true, id: input.id };
  }
  const last = await db.category.findFirst({ orderBy: { sortOrder: "desc" } });
  let slug = slugify(name);
  if (await db.category.findUnique({ where: { slug } })) slug = `${slug}-${randomBytes(2).toString("hex")}`;
  const c = await db.category.create({ data: { name, description, slug, sortOrder: (last?.sortOrder ?? 0) + 10 } });
  return { ok: true, id: c.id };
}

export async function setCategoryVisible(id: string, isVisible: boolean): Promise<Result> {
  await db.category.update({ where: { id }, data: { isVisible } });
  return { ok: true };
}

export async function moveCategory(id: string, direction: "up" | "down"): Promise<Result> {
  const list = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  return swapOrder(list, id, direction, (rid, sortOrder) => db.category.update({ where: { id: rid }, data: { sortOrder } }));
}

export async function deleteCategory(id: string): Promise<Result> {
  const count = await db.product.count({ where: { categoryId: id } });
  if (count > 0) return { ok: false, error: "אי אפשר למחוק קטגוריה שיש בה מוצרים. העבירו או מחקו אותם קודם, או הסתירו את הקטגוריה." };
  await db.category.delete({ where: { id } });
  return { ok: true };
}

/* --------------------------------------------------------------- pickup --- */

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Every weekly window (active or not) — for admin filters and order editing. */
export async function listAllWindows() {
  return db.pickupWindow.findMany({ orderBy: [{ weekday: "asc" }, { startTime: "asc" }] });
}

/** Variants the owner can add to an order by hand (hidden products included, archived excluded). */
export async function listOrderableVariants() {
  const variants = await db.productVariant.findMany({
    where: { isActive: true, product: { isArchived: false } },
    include: { product: { include: { category: true } } },
  });
  return variants
    .sort(
      (a, b) =>
        a.product.category.sortOrder - b.product.category.sortOrder ||
        a.product.sortOrder - b.product.sortOrder ||
        a.sortOrder - b.sortOrder,
    )
    .map((v) => ({
      id: v.id,
      label: v.label,
      priceAgorot: v.priceAgorot,
      productName: v.product.name,
      categoryName: v.product.category.name,
      productHidden: !v.product.isActive,
    }));
}
export type OrderableVariant = Awaited<ReturnType<typeof listOrderableVariants>>[number];

/** A single window, for toggling active without re-sending the whole form. */
export async function setWindowActive(id: string, isActive: boolean): Promise<Result> {
  await db.pickupWindow.update({ where: { id }, data: { isActive } });
  return { ok: true };
}

export async function getPickupAdminData() {
  const [windows, blocks, settings] = await Promise.all([
    db.pickupWindow.findMany({ orderBy: [{ weekday: "asc" }, { startTime: "asc" }] }),
    db.pickupBlock.findMany({ where: { date: { gte: todayIL() } }, orderBy: { date: "asc" }, include: { window: true } }),
    db.storeSettings.findUnique({ where: { id: 1 } }),
  ]);
  return { windows, blocks, settings: settings! };
}

export async function saveWindow(input: { id?: string; weekday: number; startTime: string; endTime: string; capacity: number | null; isActive: boolean }): Promise<Result> {
  if (!(input.weekday >= 0 && input.weekday <= 6)) return { ok: false, error: "יום לא תקין" };
  if (!timeRe.test(input.startTime) || !timeRe.test(input.endTime)) return { ok: false, error: "שעה לא תקינה (HH:MM)" };
  if (input.endTime <= input.startTime) return { ok: false, error: "שעת הסיום חייבת להיות אחרי שעת ההתחלה" };
  if (input.capacity != null && (!Number.isInteger(input.capacity) || input.capacity < 1)) return { ok: false, error: "מגבלת הזמנות חייבת להיות מספר חיובי" };
  const data = { weekday: input.weekday, startTime: input.startTime, endTime: input.endTime, capacity: input.capacity, isActive: input.isActive };
  if (input.id) await db.pickupWindow.update({ where: { id: input.id }, data });
  else await db.pickupWindow.create({ data });
  return { ok: true };
}

export async function deleteWindow(id: string): Promise<Result> {
  await db.pickupWindow.delete({ where: { id } });
  return { ok: true };
}

export async function addBlock(input: { date: string; windowId: string | null; reason: string }): Promise<Result> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: "נא לבחור תאריך" };
  await db.pickupBlock.create({ data: { date: input.date, windowId: input.windowId || null, reason: input.reason.trim().slice(0, 120) } });
  return { ok: true };
}

export async function removeBlock(id: string): Promise<Result> {
  await db.pickupBlock.delete({ where: { id } });
  return { ok: true };
}

export async function saveSettings(input: {
  isOrderingOpen: boolean;
  closedMessage: string;
  minLeadHours: number;
  maxDaysAhead: number;
  phone: string;
  whatsapp: string;
  address: string;
  hoursText: string;
}): Promise<Result> {
  if (!Number.isInteger(input.minLeadHours) || input.minLeadHours < 0 || input.minLeadHours > 168) return { ok: false, error: "זמן הכנה מינימלי לא תקין (0–168 שעות)" };
  if (!Number.isInteger(input.maxDaysAhead) || input.maxDaysAhead < 1 || input.maxDaysAhead > 60) return { ok: false, error: "טווח ימים לא תקין (1–60)" };
  await db.storeSettings.update({
    where: { id: 1 },
    data: {
      isOrderingOpen: input.isOrderingOpen,
      closedMessage: input.closedMessage.trim().slice(0, 200),
      minLeadHours: input.minLeadHours,
      maxDaysAhead: input.maxDaysAhead,
      phone: input.phone.trim(),
      whatsapp: input.whatsapp.trim(),
      address: input.address.trim(),
      hoursText: input.hoursText.trim(),
    },
  });
  return { ok: true };
}

/* --------------------------------------------------------------- images --- */

const ALLOWED = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
const MAX_BYTES = 4 * 1024 * 1024;

/** Stores an uploaded image under /public/uploads. Swap for S3/Supabase Storage in a serverless deploy. */
export async function saveUploadedImage(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const ext = ALLOWED[file.type as keyof typeof ALLOWED];
  if (!ext) return { ok: false, error: "אפשר להעלות רק JPG, PNG או WEBP" };
  if (file.size > MAX_BYTES) return { ok: false, error: "התמונה גדולה מדי (עד 4MB)" };
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { ok: true, url: `/uploads/${name}` };
}

/** Images already on disk, offered as a picker in the product form. */
export async function listImageLibrary(): Promise<string[]> {
  const read = async (sub: string) => {
    try {
      const files = await readdir(path.join(process.cwd(), "public", sub));
      return files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith("logo")).map((f) => `/${sub}/${f}`);
    } catch {
      return [];
    }
  };
  return [...(await read("images")), ...(await read("uploads"))];
}
