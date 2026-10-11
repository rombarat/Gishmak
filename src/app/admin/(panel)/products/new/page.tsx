import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listCategoriesForAdmin, listImageLibrary } from "@/server/admin-catalog";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "מוצר חדש" };
export const dynamic = "force-dynamic";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const [categories, library] = await Promise.all([listCategoriesForAdmin(), listImageLibrary()]);
  return (
    <>
      <Link href="/admin/products" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-ink-2 hover:text-ink">
        <ArrowRight className="size-4" aria-hidden />
        כל המוצרים
      </Link>
      <PageHeader title="מוצר חדש" subtitle="אחרי השמירה המוצר יופיע בתפריט (אם הוא מסומן כזמין)." />
      <ProductForm
        product={{
          name: "",
          description: "",
          categoryId: categories.some((c) => c.id === cat) ? cat! : "",
          imageUrl: null,
          imageIsIllustration: false,
          isActive: true,
          isFeatured: false,
          variants: [],
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        library={library}
      />
    </>
  );
}
