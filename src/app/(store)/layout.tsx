import Image from "next/image";
import Link from "next/link";
import { ToastProvider } from "@/components/ui/toast";
import { CartProvider, type VariantInfo } from "@/components/store/cart-context";
import { SiteHeader } from "@/components/store/site-header";
import { CartDrawer } from "@/components/store/cart-drawer";
import { MobileCartBar } from "@/components/store/mobile-cart-bar";
import { getStoreCatalog } from "@/server/catalog";
import { getSettings } from "@/server/settings";
import { db } from "@/lib/db";
import { isolateTimeRanges, todayIL } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Every variant ever referenced by a cart must be resolvable, including ones hidden today. */
async function getCartVariants(): Promise<VariantInfo[]> {
  const today = todayIL();
  const variants = await db.productVariant.findMany({ include: { product: { include: { category: true } } } });
  return variants.map((v) => ({
    variantId: v.id,
    productId: v.productId,
    productName: v.product.name,
    variantLabel: v.label,
    priceAgorot: v.priceAgorot,
    imageUrl: v.product.imageUrl,
    orderable:
      v.isActive && v.product.isActive && !v.product.isArchived && v.product.category.isVisible && v.product.soldOutDate !== today,
  }));
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [variants, settings, catalog] = await Promise.all([getCartVariants(), getSettings(), getStoreCatalog()]);
  return (
    <ToastProvider bottomOffset>
      <CartProvider variants={variants}>
        <a href="#main" className="sr-only z-50 rounded bg-gold-bright px-4 py-2 font-bold text-night focus:not-sr-only focus:fixed focus:start-3 focus:top-3">
          דילוג לתוכן
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <footer className="mt-16 bg-night pb-28 text-on-night-2 md:pb-10">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 sm:grid-cols-3">
            <div>
              <Image src="/images/logo.png" alt="גישמאק — עונג שבת בקריה" width={180} height={73} className="h-14 w-auto" />
              <p className="mt-3 text-sm">אוכל מוכן לשבת · משפחת חן</p>
            </div>
            <div className="text-[15px]">
              <p className="mb-1 font-bold text-on-night">איסוף עצמי</p>
              <p>{settings.address}</p>
              <p className="mt-1">{isolateTimeRanges(settings.hoursText)}</p>
            </div>
            <div className="text-[15px]">
              <p className="mb-1 font-bold text-on-night">בירורים</p>
              {settings.phone && (
                <p>
                  טלפון:{" "}
                  <a className="ltr underline-offset-4 hover:text-on-night hover:underline" href={`tel:${settings.phone.replace(/\D/g, "")}`}>
                    {settings.phone}
                  </a>
                </p>
              )}
              {settings.whatsapp && (
                <p>
                  וואטסאפ: <span className="ltr">{settings.whatsapp}</span>
                </p>
              )}
              <nav aria-label="קטגוריות" className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {catalog.map((c) => (
                  <Link key={c.id} href={`/menu#${c.slug}`} className="hover:text-gold-bright">
                    {c.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-6xl border-t border-night-3 px-4 pt-4 text-xs text-on-night-2/80">
            תמונות המסומנות &quot;להמחשה&quot; הן מ-Wikimedia Commons ברישיונות Creative Commons. שאר התמונות צולמו בחנות.
          </p>
        </footer>
        <CartDrawer />
        <MobileCartBar />
      </CartProvider>
    </ToastProvider>
  );
}
