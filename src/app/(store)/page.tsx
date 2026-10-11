import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import { getStoreCatalog } from "@/server/catalog";
import { getPickupOptions } from "@/server/pickup";
import { getSettings } from "@/server/settings";
import { isolateTimeRanges } from "@/lib/time";
import { buttonClass } from "@/components/ui/button";
import { Flourish, OrnamentHeading } from "@/components/ui/ornament";
import { ProductCard } from "@/components/store/product-card";
import { PickupNotice } from "@/components/store/pickup-notice";

export const dynamic = "force-dynamic";

const STEPS = [
  { title: "בוחרים מהתפריט", text: "צ׳ולנט, קוגלים, סלטים, חלות — בגדלים שמתאימים למשפחה." },
  { title: "בוחרים מתי לאסוף", text: "חמישי אחר הצהריים ובערב, או שישי בבוקר. רואים מראש אילו שעות פנויות." },
  { title: "אוספים ומשלמים בחנות", text: "ההזמנה ארוזה ומחכה עם השם שלכם. משלמים במקום." },
];

export default async function HomePage() {
  const [catalog, days, settings] = await Promise.all([getStoreCatalog(), getPickupOptions(), getSettings()]);
  const allFeatured = catalog.flatMap((c) => c.products).filter((p) => p.isFeatured && p.imageUrl);
  // full rows of four on desktop
  const featured = allFeatured.slice(0, allFeatured.length >= 8 ? 8 : allFeatured.length >= 4 ? 4 : allFeatured.length);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`;

  return (
    <>
      {/* Hero — the shop sign: charcoal, gold rule, real challah & babka */}
      <section className="relative overflow-hidden bg-night text-on-night">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-8 pb-10 md:pt-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:pt-14 lg:pb-16">
          <div>
            <p className="flex items-center gap-2 text-[15px] font-semibold text-gold-bright">
              <Flourish className="text-gold" />
              אוכל מוכן לשבת · קריית יערים
            </p>
            <h1 className="mt-3 font-display text-[40px] leading-[1.05] font-black sm:text-6xl">
              כל מה שצריך לשבת,
              <br />
              <span className="text-gold-bright">במקום אחד.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[18px] leading-relaxed text-on-night-2">
              טשולנט הבית, קוגל ירושלמי, למעלה משלושים סלטים ביתיים, הערינג וחלות סנהדריה. מזמינים כאן מראש — ואוספים מהחנות בחמישי או בשישי.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/menu" className={buttonClass("gold", "lg", "px-8 text-[17px]")}>
                להזמנה לשבת
              </Link>
              <a href="#how" className="min-h-11 px-2 py-2.5 font-semibold text-on-night underline decoration-gold underline-offset-[6px] hover:text-gold-bright">
                איך זה עובד?
              </a>
            </div>
            <div className="mt-8">
              <PickupNotice days={days} address={settings.address} isOpen={settings.isOrderingOpen} closedMessage={settings.closedMessage} tone="dark" rowFrom="xl" />
            </div>
          </div>

          <div className="relative mx-auto grid w-full max-w-xl grid-cols-5 grid-rows-[auto_auto] gap-3 lg:max-w-none">
            <div className="relative col-span-5 aspect-[16/9] overflow-hidden rounded-[6px] ring-1 ring-gold/40">
              <Image src="/images/real-challah.jpg" alt="חלות סנהדריה מבריקות עם שומשום, על מגשי אפייה בחנות" fill priority sizes="(min-width: 768px) 520px, 92vw" className="object-cover" />
            </div>
            <div className="relative col-span-3 aspect-[4/3] overflow-hidden rounded-[6px] ring-1 ring-gold/40">
              <Image src="/images/real-babka.jpg" alt="בבקות שוקולד טריות על השולחן בחנות" fill sizes="(min-width: 768px) 300px, 55vw" className="object-cover object-[50%_65%]" />
            </div>
            <div className="relative col-span-2 aspect-[3/4] overflow-hidden rounded-[6px] ring-1 ring-gold/40 sm:aspect-auto">
              <Image src="/images/real-hummus.jpg" alt="חומוס ביתי עם גרגרים ופפריקה" fill sizes="(min-width: 768px) 200px, 37vw" className="object-cover" />
            </div>
          </div>
        </div>
        <div className="h-1.5 bg-gradient-to-l from-[#b07a23] via-gold-bright to-[#b07a23]" aria-hidden />
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14" aria-labelledby="featured-h">
          <OrnamentHeading id="featured-h">מה לוקחים השבוע</OrnamentHeading>
          <p className="mt-2 text-center text-[15px] text-ink-2">המנות שהכי מבקשים אצלנו לשבת.</p>
          {/* phones: swipeable row; tablet+: grid */}
          <div className="scrollbar-none -mx-4 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {featured.map((p) => (
              <div key={p.id} className="flex w-[76vw] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/menu" className={buttonClass("dark", "lg")}>
              לכל התפריט
            </Link>
          </div>
        </section>
      )}

      {/* Category board — like the shop's printed sign */}
      <section className="mt-16 bg-night py-12 text-on-night" aria-labelledby="board-h">
        <div className="mx-auto max-w-6xl px-4">
          <OrnamentHeading id="board-h" tone="dark">
            על המדפים שלנו
          </OrnamentHeading>
          <ul className="mx-auto mt-8 grid max-w-3xl gap-x-12 sm:grid-cols-2">
            {catalog.map((c) => (
              <li key={c.id} className="border-b border-night-3">
                <Link href={`/menu#${c.slug}`} className="group flex items-baseline gap-3 py-4">
                  <span className="font-display text-[24px] font-bold transition-colors group-hover:text-gold-bright">{c.name}</span>
                  <span className="h-[0.9em] flex-1 -translate-y-1 border-b-2 border-dotted border-night-3" aria-hidden />
                  <span className="num shrink-0 text-[15px] text-on-night-2">{c.products.length} מנות</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16" aria-labelledby="how-h">
        <OrnamentHeading id="how-h">איך מזמינים</OrnamentHeading>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="num grid size-11 shrink-0 place-items-center rounded-full border-2 border-gold font-display text-xl font-bold text-gold-ink">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Visit */}
      <section id="visit" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16" aria-labelledby="visit-h">
        <div className="grid overflow-hidden rounded-[6px] border border-line bg-surface md:grid-cols-2">
          <div className="relative min-h-64 md:min-h-[440px]">
            <Image src="/images/real-store.jpg" alt="מקררי השירות העצמי עם הסלטים ושולחן המאפים בחנות גישמאק" fill sizes="(min-width: 768px) 560px, 100vw" className="object-cover object-[50%_60%]" />
          </div>
          <div className="p-6 sm:p-8">
            <h2 id="visit-h" className="font-display text-3xl font-bold">
              איסוף מהחנות
            </h2>
            <p className="mt-2 text-ink-2">כל ההזמנות נאספות מהחנות. ההזמנה שלכם תחכה ארוזה ומסומנת בשם.</p>
            <ul className="mt-6 space-y-4 text-[16px]">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-gold-ink" aria-hidden />
                <div>
                  <p className="font-bold">{settings.address}</p>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[15px] font-semibold text-gold-ink underline underline-offset-4">
                    ניווט לחנות
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-gold-ink" aria-hidden />
                <div>
                  <p className="font-bold">שעות פתיחה</p>
                  <p className="text-ink-2">{isolateTimeRanges(settings.hoursText)}</p>
                </div>
              </li>
              {settings.phone && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 size-5 shrink-0 text-gold-ink" aria-hidden />
                  <div>
                    <p className="font-bold">שאלות על הזמנה</p>
                    <a href={`tel:${settings.phone.replace(/\D/g, "")}`} className="ltr text-ink-2 underline-offset-4 hover:underline">
                      {settings.phone}
                    </a>
                  </div>
                </li>
              )}
            </ul>
            <Link href="/menu" className={buttonClass("gold", "lg", "mt-8")}>
              להזמנה לשבת
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
