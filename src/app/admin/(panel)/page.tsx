import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarOff, ChefHat, ClipboardList, MessageSquareText, PackagePlus, Printer, Sparkles } from "lucide-react";
import { getDashboard } from "@/server/orders";
import { formatPrice } from "@/lib/money";
import { formatDateTime, formatDayLong, formatWindow, minutesBetween, relativeDay } from "@/lib/time";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { Flourish } from "@/components/ui/ornament";
import { Card, PageHeader, SectionTitle } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { OrderStatusControls } from "@/components/admin/order-status-controls";
import { StatusBadge } from "@/components/admin/status-badge";
import { itemCount, itemLine, plural } from "@/components/admin/format";

export const metadata: Metadata = { title: "לוח בקרה" };
export const dynamic = "force-dynamic";

function daysUntil(from: string, to: string) {
  return Math.round(minutesBetween(from, "00:00", to, "00:00") / 1440);
}

export default async function DashboardPage() {
  const d = await getDashboard();
  const next = d.nextDaySummary;
  const isToday = d.nextDay === d.today;
  const gap = daysUntil(d.today, d.nextDay);
  const whenLabel = isToday ? "היום" : gap === 1 ? "מחר" : `בעוד ${gap} ימים`;
  const hasNext = next.orders > 0;

  // attention list: NEW orders first, then notes (today + next pickup day), de-duplicated
  const newIds = new Set(d.newOrders.map((o) => o.id));
  const noted = [...d.notesToday, ...next.withNotes].filter((o, i, all) => !newIds.has(o.id) && all.findIndex((x) => x.id === o.id) === i);

  const stats = [
    { label: "חדשות שממתינות לאישור", value: d.counts.new, href: "/admin/orders?view=new", alert: d.counts.new > 0 },
    { label: "לאיסוף היום", value: d.counts.today, href: "/admin/orders?view=today" },
    { label: "להכנה", value: d.counts.toPrepare, href: "/admin/orders?view=prep" },
    { label: "מוכנות היום", value: d.counts.readyToday, href: "/admin/orders?view=ready" },
    { label: "נאספו היום", value: d.counts.pickedToday, href: "/admin/orders?view=today" },
    { label: "לאיסוף מחר", value: d.counts.tomorrow, href: "/admin/orders?view=tomorrow" },
  ];

  return (
    <>
      <PageHeader
        title="לוח בקרה"
        subtitle={
          <span className="num">
            {formatDayLong(d.today)}
            {d.counts.today === 0 && " · אין איסופים היום"}
          </span>
        }
      />

      {/* ------------------------------------------------ what's next (the sign) */}
      <section aria-labelledby="next-title" className="mb-5 overflow-hidden rounded-[6px] bg-night text-on-night">
        <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:p-7">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-gold">
              <Flourish className="w-9" />
              {isToday ? "איסופים היום" : "יום האיסוף הבא"}
            </p>
            <h2 id="next-title" className="num mt-2 font-display text-[34px] font-bold leading-none text-gold-bright">
              {formatDayLong(d.nextDay)}
            </h2>
            <p className="mt-1 text-[15px] font-semibold text-on-night-2">{hasNext ? whenLabel : "אין הזמנות פתוחות לימים הקרובים"}</p>

            {hasNext && (
              <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-gold/25 py-4">
                <div>
                  <dt className="text-[13px] text-on-night-2">הזמנות</dt>
                  <dd className="num font-display text-3xl font-bold">{next.orders}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-on-night-2">פריטים להכנה</dt>
                  <dd className="num font-display text-3xl font-bold">{next.itemsOpen}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-on-night-2">שווי</dt>
                  <dd className="num font-display text-3xl font-bold">{formatPrice(next.sales)}</dd>
                </div>
              </dl>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/admin/kitchen?date=${d.nextDay}`} className={buttonClass("gold", "md")}>
                <ChefHat className="size-4" aria-hidden />
                רשימת הכנה ליום הזה
              </Link>
              <Link href={`/admin/orders?view=all&date=${d.nextDay}`} className={buttonClass("ghost", "md", "text-on-night hover:bg-night-2")}>
                כל ההזמנות ליום
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/* pickup windows timeline */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-on-night-2">חלונות איסוף</h3>
            {d.windows.length === 0 ? (
              <p className="rounded-[6px] border border-dashed border-gold/30 px-4 py-6 text-center text-on-night-2">עוד אין הזמנות ליום הזה.</p>
            ) : (
              <ol className="flex flex-col gap-2.5">
                {d.windows.map((w) => {
                  const pct = (n: number) => `${(n / w.orders) * 100}%`;
                  const waiting = w.orders - w.ready - w.picked;
                  return (
                    <li key={w.start} className="rounded-[6px] bg-night-2 px-4 py-3">
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <span className="num font-display text-xl font-bold text-on-night">{formatWindow(w.start, w.end)}</span>
                        <span className="num text-[14px] text-on-night-2">{plural(w.orders, "הזמנה", "הזמנות")}</span>
                        <span className="num ms-auto text-[14px] font-bold text-gold-bright">{formatPrice(w.total)}</span>
                      </div>
                      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-night-3" aria-hidden>
                        <span className="bg-on-night-2" style={{ width: pct(w.picked) }} />
                        <span className="bg-[#7fb98a]" style={{ width: pct(w.ready) }} />
                      </div>
                      <p className="num mt-1.5 text-[13px] text-on-night-2">
                        {w.picked > 0 && <span className="me-3">נאספו {w.picked}</span>}
                        <span className="me-3 text-[#a9d4b1]">מוכנות {w.ready}</span>
                        <span>{waiting > 0 ? `עוד ${waiting} בטיפול` : "הכול מוכן"}</span>
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ numbers strip */}
      <section aria-label="מספרים" className="mb-6 overflow-hidden rounded-[6px] border border-line bg-surface">
        <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <li key={s.label} className="bg-surface">
              <Link href={s.href} className={cn("flex h-full flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-surface-2/70", s.alert && "bg-amber-soft hover:bg-amber-soft/80")}>
                <span className={cn("num font-display text-[28px] font-bold leading-tight", s.alert ? "text-amber" : "text-ink")}>{s.value}</span>
                <span className={cn("text-[13px] font-semibold leading-tight", s.alert ? "text-amber" : "text-ink-2")}>{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <dl className="num flex flex-wrap gap-x-6 gap-y-1 border-t border-line bg-surface-2/50 px-4 py-2.5 text-[14px]">
          <div className="flex gap-1.5">
            <dt className="text-ink-2">מכירות היום:</dt>
            <dd className="font-bold">{formatPrice(d.salesToday)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-ink-2">כל ההזמנות הקרובות:</dt>
            <dd className="font-bold">{formatPrice(d.salesUpcoming)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-ink-2">פריטים שעוד צריך להכין:</dt>
            <dd className="font-bold">{d.itemsToPrepare}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        {/* ------------------------------------------------ attention */}
        <section aria-labelledby="attention">
          <SectionTitle id="attention" aside={d.counts.new > d.newOrders.length && <Link href="/admin/orders?view=new" className="text-sm font-bold text-gold-ink hover:underline">לכל החדשות ({d.counts.new})</Link>}>
            דורש תשומת לב
          </SectionTitle>
          {d.newOrders.length === 0 && noted.length === 0 ? (
            <EmptyState icon={Sparkles} title="הכול מטופל" body="אין הזמנות שממתינות לאישור ואין הערות פתוחות." className="py-8" />
          ) : (
            <ul className="flex flex-col gap-2">
              {d.newOrders.map((o) => (
                <li key={o.id} className="relative flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[6px] border border-line border-s-[3px] border-s-amber bg-surface px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/orders/${o.id}`} className="font-bold after:absolute after:inset-0 after:content-['']">
                        <span className="num ltr font-display text-[17px]">#{o.orderNumber}</span> {o.customerName}
                      </Link>
                      <StatusBadge status={o.status} size="sm" />
                    </p>
                    <p className="num text-[13px] text-ink-2">
                      איסוף {relativeDay(o.pickupDate, d.today)} {formatWindow(o.pickupStart, o.pickupEnd)} · {itemCount(o.items)} פריטים · {formatPrice(o.totalAgorot)} · הוזמן {formatDateTime(o.createdAt)}
                    </p>
                    <p className="line-clamp-1 text-[13px] text-ink-3">{o.items.map(itemLine).join(" · ")}</p>
                    {o.notes && (
                      <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-amber">
                        <MessageSquareText className="size-3.5 shrink-0" aria-hidden />
                        <span className="line-clamp-1">{o.notes}</span>
                      </p>
                    )}
                  </div>
                  <OrderStatusControls orderId={o.id} orderNumber={o.orderNumber} status={o.status} showBadge={false} showMenu={false} className="relative z-10" />
                </li>
              ))}
              {noted.map((o) => (
                <li key={o.id} className="relative flex items-start gap-3 rounded-[6px] border border-line bg-surface px-4 py-3">
                  <MessageSquareText className="mt-1 size-4 shrink-0 text-amber" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/orders/${o.id}`} className="font-bold after:absolute after:inset-0 after:content-['']">
                        <span className="num ltr font-display text-[17px]">#{o.orderNumber}</span> {o.customerName}
                      </Link>
                      <StatusBadge status={o.status} size="sm" />
                      <span className="num text-[13px] text-ink-2">
                        {relativeDay(o.pickupDate, d.today)} {formatWindow(o.pickupStart, o.pickupEnd)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold text-ink">{o.notes}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ------------------------------------------------ shortcuts */}
        <aside aria-labelledby="shortcuts">
          <SectionTitle id="shortcuts">קיצורי דרך</SectionTitle>
          <Card as="div" className="divide-y divide-line">
            {[
              { href: `/admin/kitchen?date=${d.nextDay}`, label: "רשימת הכנה להדפסה", icon: Printer },
              { href: "/admin/orders?view=prep", label: "הזמנות שממתינות להכנה", icon: ClipboardList },
              { href: "/admin/products", label: "סימון \"אזל להיום\"", icon: ChefHat },
              { href: "/admin/products/new", label: "מוצר חדש", icon: PackagePlus },
              { href: "/admin/pickup#blocks", label: "חסימת תאריך או חלון", icon: CalendarOff },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="flex min-h-12 items-center gap-3 px-4 text-[15px] font-semibold hover:bg-surface-2/70">
                <l.icon className="size-4 text-gold-ink" aria-hidden />
                <span className="flex-1">{l.label}</span>
                <ArrowLeft className="size-4 text-ink-3" aria-hidden />
              </Link>
            ))}
          </Card>
        </aside>
      </div>
    </>
  );
}
