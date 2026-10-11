import type { Metadata } from "next";
import Link from "next/link";
import { ChefHat, ClipboardCheck, Inbox, PackageCheck, SearchX, Sparkles } from "lucide-react";
import { countOrdersByView, listOrders, type OrderView } from "@/server/orders";
import { listAllWindows } from "@/server/admin-catalog";
import { formatPrice } from "@/lib/money";
import { formatDayLong, formatWindow, relativeDay, todayIL } from "@/lib/time";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { OrderFilters } from "@/components/admin/order-filters";
import { OrderRow, type OrderWithItems } from "@/components/admin/order-row";
import { plural, windowLabel } from "@/components/admin/format";

export const metadata: Metadata = { title: "הזמנות" };
export const dynamic = "force-dynamic";

const VIEWS: { key: OrderView; label: string }[] = [
  { key: "today", label: "היום" },
  { key: "tomorrow", label: "מחר" },
  { key: "new", label: "חדשות" },
  { key: "prep", label: "להכנה" },
  { key: "ready", label: "מוכנות" },
  { key: "done", label: "הושלמו" },
  { key: "all", label: "הכול" },
];

const EMPTY: Record<OrderView, { title: string; body: string; icon: typeof Inbox }> = {
  today: { title: "אין הזמנות לאיסוף היום", body: "הזמנות לימים הקרובים מופיעות בלשונית \"הכול\".", icon: Inbox },
  tomorrow: { title: "אין הזמנות לאיסוף מחר", body: "ברגע שתיכנס הזמנה למחר היא תופיע כאן.", icon: Inbox },
  new: { title: "אין הזמנות חדשות כרגע", body: "כל ההזמנות אושרו. הזמנה חדשה מהאתר תופיע כאן ותסומן בלוח הבקרה.", icon: Sparkles },
  prep: { title: "אין הזמנות שממתינות להכנה", body: "הזמנות שאושרו ועוד לא מוכנות יופיעו כאן.", icon: ChefHat },
  ready: { title: "אין הזמנות שמחכות לאיסוף", body: "כשמסמנים הזמנה כ\"מוכנה\" היא עוברת לכאן עד שנאספת.", icon: PackageCheck },
  done: { title: "עוד אין הזמנות שהושלמו", body: "הזמנות שנאספו או בוטלו נשמרות כאן.", icon: ClipboardCheck },
  all: { title: "אין הזמנות", body: "הזמנות מהאתר יופיעו כאן.", icon: Inbox },
};

type SP = { view?: string; q?: string; status?: string; date?: string; window?: string };

function isView(v: string | undefined): v is OrderView {
  return VIEWS.some((x) => x.key === v);
}

function groupOrders(orders: OrderWithItems[]) {
  const groups: { key: string; date: string; start: string; end: string; orders: OrderWithItems[] }[] = [];
  for (const o of orders) {
    const key = `${o.pickupDate}|${o.pickupStart}|${o.pickupEnd}`;
    const last = groups[groups.length - 1];
    if (last?.key === key) last.orders.push(o);
    else groups.push({ key, date: o.pickupDate, start: o.pickupStart, end: o.pickupEnd, orders: [o] });
  }
  return groups;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const today = todayIL();
  const [counts, windows] = await Promise.all([countOrdersByView(), listAllWindows()]);

  const q = sp.q?.trim().slice(0, 60) ?? "";
  const status = sp.status ?? "";
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : "";
  const windowId = sp.window ?? "";
  const hasFilters = Boolean(q || status || date || windowId);
  // No explicit tab: open on what needs action — today, else new, else everything.
  const view: OrderView = isView(sp.view) ? sp.view : hasFilters ? "all" : counts.today ? "today" : counts.new ? "new" : "all";

  const listed = await listOrders({ view, q, status, date, windowId });
  // "all": upcoming pickups first (soonest on top), then history (most recent first)
  const orders =
    view === "all" ? [...listed.filter((o) => o.pickupDate >= today), ...listed.filter((o) => o.pickupDate < today).reverse()] : listed;
  const groups = groupOrders(orders);
  const tabHref = (key: OrderView) => {
    const p = new URLSearchParams({ view: key });
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (date) p.set("date", date);
    if (windowId) p.set("window", windowId);
    return `/admin/orders?${p}`;
  };
  const empty = hasFilters
    ? { title: "לא נמצאו הזמנות לסינון הזה", body: "נסו לחפש בלשונית \"הכול\" או לנקות את הסינון.", icon: SearchX }
    : EMPTY[view];

  return (
    <>
      <PageHeader
        title="הזמנות"
        subtitle={
          <span className="num">
            {plural(orders.length, "הזמנה", "הזמנות")} · סה״כ {formatPrice(orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.totalAgorot, 0))}
          </span>
        }
      />

      <nav aria-label="תצוגות הזמנות" className="-mx-4 mb-4 overflow-x-auto px-4 scrollbar-none print:hidden">
        <ul className="flex min-w-max gap-1 border-b border-line">
          {VIEWS.map((v) => {
            const active = v.key === view;
            const count = counts[v.key];
            return (
              <li key={v.key}>
                <Link
                  href={tabHref(v.key)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex min-h-11 items-center gap-1.5 border-b-[3px] px-3 text-[15px] font-bold transition-colors",
                    active ? "border-gold text-ink" : "border-transparent text-ink-2 hover:text-ink",
                  )}
                >
                  {v.label}
                  {count !== undefined && (
                    <span
                      className={cn(
                        "num rounded-full px-1.5 text-[12px] font-extrabold leading-5",
                        v.key === "new" && count > 0 ? "bg-amber text-white" : active ? "bg-gold-soft text-gold-ink" : "bg-surface-2 text-ink-2",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <OrderFilters
        key={`${view}|${q}|${status}|${date}|${windowId}`}
        view={isView(sp.view) ? view : ""}
        q={q}
        status={status}
        date={date}
        windowId={windowId}
        windows={windows.map((w) => ({ id: w.id, label: windowLabel(w) + (w.isActive ? "" : " (לא פעיל)") }))}
      />

      {groups.length === 0 ? (
        <EmptyState title={empty.title} body={empty.body} icon={empty.icon} />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => {
            const live = g.orders.filter((o) => o.status !== "CANCELLED");
            const ready = g.orders.filter((o) => o.status === "READY").length;
            const picked = g.orders.filter((o) => o.status === "PICKED_UP").length;
            return (
              <section key={g.key} aria-labelledby={`g-${g.key}`} className="overflow-hidden rounded-[6px] border border-line bg-surface">
                <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-surface-2/70 px-4 py-2.5">
                  <h2 id={`g-${g.key}`} className="num font-display text-[17px] font-bold text-ink">
                    {formatDayLong(g.date)} · {formatWindow(g.start, g.end)}
                  </h2>
                  {(g.date === today || relativeDay(g.date, today) === "מחר") && (
                    <span className="rounded-full bg-night px-2 text-[12px] font-bold leading-5 text-gold-bright">{relativeDay(g.date, today)}</span>
                  )}
                  <span className="num ms-auto text-[13px] text-ink-2">
                    {plural(live.length, "הזמנה", "הזמנות")}
                    {ready > 0 && ` · ${ready === 1 ? "אחת מוכנה" : `${ready} מוכנות`}`}
                    {picked > 0 && ` · ${picked === 1 ? "אחת נאספה" : `${picked} נאספו`}`} · {formatPrice(live.reduce((s, o) => s + o.totalAgorot, 0))}
                  </span>
                </header>
                <ul className="divide-y divide-line">
                  {g.orders.map((o) => (
                    <OrderRow key={o.id} order={o} today={today} showPickup={false} />
                  ))}
                </ul>
              </section>
            );
          })}
          {orders.length >= 300 && <p className="text-center text-sm text-ink-3">מוצגות 300 ההזמנות הראשונות. צמצמו בעזרת הסינון.</p>}
        </div>
      )}
    </>
  );
}
