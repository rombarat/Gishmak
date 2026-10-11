import type { Metadata } from "next";
import { listCategoriesForAdmin } from "@/server/admin-catalog";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "קטגוריות" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategoriesForAdmin();
  return (
    <>
      <PageHeader title="קטגוריות" subtitle="הסדר כאן הוא הסדר בתפריט. קטגוריה מוסתרת לא מוצגת ללקוחות, גם אם יש בה מוצרים זמינים." />
      <CategoryManager
        categories={categories.map((c) => ({ id: c.id, name: c.name, description: c.description, isVisible: c.isVisible, productCount: c._count.products }))}
      />
    </>
  );
}
