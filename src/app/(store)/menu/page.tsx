import type { Metadata } from "next";
import { getStoreCatalog } from "@/server/catalog";
import { getPickupOptions } from "@/server/pickup";
import { getSettings } from "@/server/settings";
import { CategoryNav } from "@/components/store/category-nav";
import { MenuSection } from "@/components/store/menu-section";
import { PickupNotice } from "@/components/store/pickup-notice";

export const metadata: Metadata = { title: "התפריט לשבת" };
export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const [catalog, days, settings] = await Promise.all([getStoreCatalog(), getPickupOptions(), getSettings()]);
  const total = catalog.reduce((s, c) => s + c.products.length, 0);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-4">
        <h1 className="font-display text-4xl font-black sm:text-5xl">התפריט לשבת</h1>
        <p className="mt-2 max-w-2xl text-[17px] text-ink-2">
          בוחרים מנות וגדלים, ובסוף בוחרים מתי לאסוף. התשלום בחנות, בזמן האיסוף.
        </p>
        <div className="mt-5">
          <PickupNotice days={days} address={settings.address} isOpen={settings.isOrderingOpen} closedMessage={settings.closedMessage} />
        </div>
      </div>

      {total === 0 ? (
        <p className="mx-auto max-w-6xl px-4 py-16 text-center text-lg text-ink-2">התפריט מתעדכן כרגע. נסו שוב בעוד כמה דקות.</p>
      ) : (
        <>
          <CategoryNav categories={catalog.map((c) => ({ slug: c.slug, name: c.name, count: c.products.length }))} />
          <div className="mx-auto max-w-6xl px-4">
            {catalog.map((c, i) => (
              <MenuSection key={c.id} category={c} eagerImages={i === 0} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
