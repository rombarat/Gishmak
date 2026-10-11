import type { Metadata } from "next";
import Link from "next/link";
import { ChefHat, MessageSquareText } from "lucide-react";
import { getDashboard, getKitchenList, listUpcomingPickupDays } from "@/server/orders";
import { formatDayLong, formatDayShort, formatWindow, relativeDay, todayIL } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Input } from "@/components/admin/controls";
import { buttonClass } from "@/components/ui/button";
import { PageHeader, SectionTitle } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { PrintButton } from "@/components/admin/print-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { itemCount, plural } from "@/components/admin/format";

export const metadata: Metadata = { title: "מטבח — רשימת הכנה" };
export const dynamic = "force-dynamic";

export default async function KitchenPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const today = todayIL();
  const days = await listUpcomingPickupDays();
  let date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : "";
  if (!date) date = days.some((x) => x.date === today) ? today : (await getDashboard()).nextDay;

  const { orders, rows } = await getKitchenList(date);
  const totalUnits = rows.reduce((s, r) => s + r.total, 0);
  const doneUnits = rows.reduce((s, r) => s + r.done, 0);
  const unconfirmed = orders.filter((o) => o.status === "NEW").length;

  const byCategory: { name: string; rows: typeof rows }[] = [];
  for (const r of rows) {
    const last = byCategory[byCategory.length - 1];
    if (last?.name === r.category) last.rows.push(r);
    else byCategory.push({ name: r.category, rows: [r] });
  }
  const byWindow: { key: string; start: string; end: string; orders: typeof orders }[] = [];
  for (const o of orders) {
    const key = `${o.pickupStart}-${o.pickupEnd}`;
    const last = byWindow[byWindow.length - 1];
    if (last?.key === key) last.orders.push(o);
    else byWindow.push({ key, start: o.pickupStart, end: o.pickupEnd, orders: [o] });
  }

  return (
    <>
      <PageHeader
        title="רשימת הכנה"
        subtitle={
          <span className="num">
            {formatDayLong(date)}
            {["היום", "מחר"].includes(relativeDay(date, today)) && ` (${relativeDay(date, today)})`} · {plural(orders.length, "הזמנה", "הזמנות")} ·{" "}
            {totalUnits} יחידות
          </span>
        }
        actions={<PrintButton label="הדפסת הרשימה" variant="dark" />}
      />

      {/* day picker */}
      <div className="mb-5 flex flex-wrap items-center gap-2 print:hidden">
        {days.map((d) => (
          <Link
            key={d.date}
            href={`/admin/kitchen?date=${d.date}`}
            aria-current={d.date === date ? "page" : undefined}
            className={cn(
              "num inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-bold transition-colors",
              d.date === date ? "border-night bg-night text-gold-bright" : "border-line bg-surface text-ink hover:border-ink-3",
            )}
          >
            {relativeDay(d.date, today) === "היום" || relativeDay(d.date, today) === "מחר" ? `${relativeDay(d.date, today)} · ` : ""}
            {formatDayShort(d.date)}
            <span className={cn("rounded-full px-1.5 text-[12px] leading-5", d.date === date ? "bg-gold-bright text-night" : "bg-surface-2 text-ink-2")}>{d.orders}</span>
          </Link>
        ))}
        <form method="get" action="/admin/kitchen" className="flex items-center gap-2">
          <label className="sr-only" htmlFor="kdate">
            תאריך אחר
          </label>
          <Input id="kdate" type="date" name="date" defaultValue={date} className="num w-auto" />
          <button type="submit" className={buttonClass("outline", "md")}>
            הצגה
          </button>
        </form>
      </div>

      {/* print-only title */}
      <p className="mb-3 hidden font-display text-2xl font-bold print:block">גישמאק · רשימת הכנה · {formatDayLong(date)}</p>

      {orders.length === 0 ? (
        <EmptyState icon={ChefHat} title="אין מה להכין ליום הזה" body="אין הזמנות פעילות לתאריך שנבחר. בחרו יום אחר מהרשימה למעלה." />
      ) : (
        <>
          {unconfirmed > 0 && (
            <p className="mb-4 rounded-[6px] bg-amber-soft px-4 py-2.5 text-[15px] font-semibold text-amber print:border print:border-ink">
              הרשימה כוללת {plural(unconfirmed, "הזמנה", "הזמנות")} שעדיין לא אושרו.{" "}
              <Link href="/admin/orders?view=new" className="underline print:hidden">
                לאישור
              </Link>
            </p>
          )}

          <section aria-labelledby="totals" className="mb-8">
            <SectionTitle id="totals" aside={<span className="num text-sm text-ink-2">מוכן: {doneUnits} מתוך {totalUnits}</span>}>
              כמה להכין
            </SectionTitle>
            <div className="flex flex-col gap-4">
              {byCategory.map((c) => (
                <div key={c.name} className="overflow-hidden rounded-[6px] border border-line bg-surface break-inside-avoid">
                  <h3 className="border-b border-line bg-surface-2/70 px-4 py-2 text-[15px] font-bold text-gold-ink">{c.name}</h3>
                  <table className="w-full text-[15px]">
                    <thead className="sr-only">
                      <tr>
                        <th scope="col">מוצר</th>
                        <th scope="col">פירוט גדלים</th>
                        <th scope="col">סה״כ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {c.rows.map((r) => {
                        const finished = r.done >= r.total;
                        return (
                          <tr key={r.name} className={cn(finished && "text-ink-3")}>
                            <th scope="row" className="w-[38%] px-4 py-2.5 text-start align-top font-bold">
                              {r.name}
                              {r.done > 0 && <span className="num block text-[12px] font-semibold text-leaf">{finished ? "הכול מוכן" : `${r.done} מוכנים`}</span>}
                            </th>
                            <td className="px-2 py-2.5 align-top">
                              <ul className="flex flex-wrap gap-1.5">
                                {r.sizes.map((s) => (
                                  <li key={s.label} className="num rounded-[4px] bg-surface-2 px-2 py-0.5 text-[14px]">
                                    {s.label} <strong className="font-extrabold text-ink">×{s.qty}</strong>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="num w-16 px-4 py-2.5 text-end align-top font-display text-2xl font-bold">{r.total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="tickets" className="print:break-before-page">
            <SectionTitle id="tickets">פתקים לפי חלון איסוף</SectionTitle>
            <div className="flex flex-col gap-6">
              {byWindow.map((w) => (
                <div key={w.key}>
                  <h3 className="num mb-2 font-display text-lg font-bold">
                    {formatWindow(w.start, w.end)} <span className="text-[14px] font-normal text-ink-2">· {plural(w.orders.length, "הזמנה", "הזמנות")}</span>
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-2">
                    {w.orders.map((o) => (
                      <li key={o.id} className="flex flex-col rounded-[6px] border border-dashed border-ink-3/60 bg-surface p-3 break-inside-avoid">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={`/admin/orders/${o.id}`} className="font-display text-lg font-bold hover:underline">
                              <span className="ltr num">#{o.orderNumber}</span> {o.customerName}
                            </Link>
                            <p className="text-[13px] text-ink-2">
                              <span className="ltr num">{o.customerPhone}</span>
                              {o.recipientName && ` · אוסף/ת: ${o.recipientName}`}
                            </p>
                          </div>
                          <StatusBadge status={o.status} size="sm" />
                        </div>
                        <ul className="mt-2 flex-1 divide-y divide-dotted divide-line text-[14px]">
                          {o.items.map((i) => (
                            <li key={i.id} className="flex gap-2 py-1">
                              <span className="num w-8 shrink-0 font-extrabold">×{i.quantity}</span>
                              <span>
                                {i.productName} <span className="text-ink-2">· {i.variantLabel}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                        {o.notes && (
                          <p className="mt-2 flex gap-1.5 rounded-[4px] bg-amber-soft px-2 py-1.5 text-[13px] font-bold text-amber">
                            <MessageSquareText className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            {o.notes}
                          </p>
                        )}
                        <p className="num mt-2 text-[12px] text-ink-3">{itemCount(o.items)} יחידות</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
