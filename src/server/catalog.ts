import "server-only";
import { db } from "@/lib/db";
import { todayIL } from "@/lib/time";

export type StoreVariant = { id: string; label: string; priceAgorot: number };
export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  imageIsIllustration: boolean;
  isFeatured: boolean;
  soldOut: boolean;
  categoryId: string;
  categoryName: string;
  variants: StoreVariant[];
};
export type StoreCategory = { id: string; slug: string; name: string; description: string; products: StoreProduct[] };

/** Everything the storefront shows: visible categories → active products → active variants. */
export async function getStoreCatalog(): Promise<StoreCategory[]> {
  const today = todayIL();
  const cats = await db.category.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isActive: true, isArchived: false, variants: { some: { isActive: true } } },
        orderBy: { sortOrder: "asc" },
        include: { variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  return cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    products: c.products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      imageIsIllustration: p.imageIsIllustration,
      isFeatured: p.isFeatured,
      soldOut: p.soldOutDate === today,
      categoryId: c.id,
      categoryName: c.name,
      variants: p.variants.map((v) => ({ id: v.id, label: v.label, priceAgorot: v.priceAgorot })),
    })),
  }));
}
