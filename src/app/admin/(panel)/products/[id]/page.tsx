import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getProductForAdmin, listCategoriesForAdmin, listImageLibrary } from "@/server/admin-catalog";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = await getProductForAdmin((await params).id);
  return { title: p ? `עריכה: ${p.name}` : "מוצר לא נמצא" };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, library] = await Promise.all([getProductForAdmin(id), listCategoriesForAdmin(), listImageLibrary()]);
  if (!product || product.isArchived) notFound();

  return (
    <>
      <Link href="/admin/products" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-ink-2 hover:text-ink">
        <ArrowRight className="size-4" aria-hidden />
        כל המוצרים
      </Link>
      <PageHeader title={product.name} subtitle="עריכת מוצר. שינוי מחיר לא משנה הזמנות שכבר התקבלו." />
      <ProductForm
        key={product.updatedAt.toISOString()}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          imageUrl: product.imageUrl,
          imageIsIllustration: product.imageIsIllustration,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          variants: product.variants.filter((v) => v.isActive).map((v) => ({ id: v.id, label: v.label, priceAgorot: v.priceAgorot })),
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        library={library}
      />
    </>
  );
}
