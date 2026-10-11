import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, CircleX, MapPin, Phone } from "lucide-react";
import { getOrderByToken } from "@/server/orders";
import { getSettings } from "@/server/settings";
import { formatPrice } from "@/lib/money";
import { formatDateTime, formatDayLong, formatWindow } from "@/lib/time";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { Flourish } from "@/components/ui/ornament";
import { PAYMENT_STATUS_LABEL, type OrderStatus } from "@/domain/order-status";

export const metadata: Metadata = { title: "אישור הזמנה", robots: { index: false } };
export const dynamic = "force-dynamic";

const PROGRESS: { status: OrderStatus; label: string }[] = [
  { status: "NEW", label: "התקבלה" },
  { status: "CONFIRMED", label: "אושרה" },
  { status: "PREPARING", label: "בהכנה" },
  { status: "READY", label: "מוכנה לאיסוף" },
  { status: "PICKED_UP", label: "נאספה" },
];

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const [{ token }, { new: isNew }] = await Promise.all([params, searchParams]);
  const [order, settings] = await Promise.all([getOrderByToken(token), getSettings()]);
  if (!order) notFound();

  const cancelled = order.status === "CANCELLED";
  const step = PROGRESS.findIndex((p) => p.status === order.status);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8 pb-16">
      <section className="overflow-hidden rounded-[8px] bg-night text-on-night shadow-pop" aria-labelledby="conf-h">
        <div className="px-6 pt-7 pb-6 text-center">
          <span
            className={cn(
              "mx-auto grid size-14 place-items-center rounded-full",
              cancelled ? "bg-tomato text-white" : "bg-gold-bright text-night",
            )}
            aria-hidden
          >
            {cancelled ? <CircleX className="size-8" /> : <Check className="size-8" strokeWidth={3} />}
          </span>
          <h1 id="conf-h" className="mt-4 font-display text-3xl font-black sm:text-4xl">
            {cancelled ? "ההזמנה בוטלה" : isNew ? "תודה! ההזמנה התקבלה" : "פרטי ההזמנה"}
          </h1>
          <p className="mt-2 text-on-night-2">
            {cancelled
              ? "אם זו טעות, התקשרו אלינו ונסדר."
              : "שמרו את הדף הזה — אפשר לחזור אליו ולראות מתי ההזמנה מוכנה."}
          </p>
          <div className="mx-auto mt-5 inline-flex flex-col items-center rounded-[6px] border border-gold/50 px-8 py-3">
            <span className="text-[13px] font-semibold text-on-night-2">מספר הזמנה</span>
            <span className="num ltr font-display text-5xl font-black text-gold-bright">{order.orderNumber}</span>
          </div>
        </div>
        <div className="grid border-t border-night-3 sm:grid-cols-2">
          <div className="border-b border-night-3 px-6 py-4 sm:border-e sm:border-b-0">
            <p className="text-[13px] font-semibold text-on-night-2">איסוף</p>
            <p className="mt-0.5 text-lg font-bold">{formatDayLong(order.pickupDate)}</p>
            <p className="num text-lg font-bold text-gold-bright">{formatWindow(order.pickupStart, order.pickupEnd)}</p>
          </div>
          <div className="px-6 py-4">
            <p className="text-[13px] font-semibold text-on-night-2">על שם</p>
            <p className="mt-0.5 text-lg font-bold">{order.recipientName || order.customerName}</p>
            <p className="ltr text-on-night-2">{order.customerPhone}</p>
          </div>
        </div>
        <div className="h-1.5 bg-gradient-to-l from-[#b07a23] via-gold-bright to-[#b07a23]" aria-hidden />
      </section>

      {!cancelled && (
        <section className="mt-8" aria-label="סטטוס ההזמנה">
          <ol className="flex items-start">
            {PROGRESS.map((p, i) => {
              const done = i <= step;
              return (
                <li key={p.status} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <span className={cn("h-0.5 flex-1", i === 0 ? "invisible" : done ? "bg-gold" : "bg-line")} />
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full border-2",
                        done ? "border-gold bg-gold text-night" : "border-line bg-surface",
                        i === step && "ring-4 ring-gold/25",
                      )}
                      aria-hidden
                    >
                      {done && <Check className="size-4" strokeWidth={3} />}
                    </span>
                    <span className={cn("h-0.5 flex-1", i === PROGRESS.length - 1 ? "invisible" : i < step ? "bg-gold" : "bg-line")} />
                  </div>
                  <span className={cn("mt-2 text-[13px] leading-tight sm:text-sm", i === step ? "font-extrabold" : "text-ink-2")}>
                    {p.label}
                    {i === step && <span className="sr-only"> (הסטטוס הנוכחי)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="mt-8 rounded-[6px] border border-line bg-surface" aria-labelledby="items-h">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 id="items-h" className="font-display text-xl font-bold">
            מה הזמנתם
          </h2>
          <span className="text-[13px] text-ink-2">נשלחה {formatDateTime(order.createdAt)}</span>
        </div>
        <ul className="divide-y divide-line px-5">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-baseline gap-2 py-3">
              <span className="num shrink-0 font-extrabold">{it.quantity}×</span>
              <span className="font-semibold">{it.productName}</span>
              <span className="text-[14px] text-ink-2">{it.variantLabel}</span>
              <span className="leader" aria-hidden />
              <span className="num shrink-0 font-bold">{formatPrice(it.lineTotalAgorot)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-lg font-extrabold">
          <span>סה״כ</span>
          <span className="num">{formatPrice(order.totalAgorot)}</span>
        </div>
        <p className="border-t border-dashed border-line bg-paper/60 px-5 py-3 text-[15px] text-ink-2">
          {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus} · מזומן או אשראי בחנות
        </p>
        {order.notes && (
          <div className="border-t border-line px-5 py-3">
            <p className="text-[13px] font-semibold text-ink-2">הערות שכתבתם</p>
            <p className="mt-0.5 whitespace-pre-line">{order.notes}</p>
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-[6px] border border-line bg-surface px-4 py-3 hover:border-ink-3">
          <MapPin className="size-5 shrink-0 text-gold-ink" aria-hidden />
          <span>
            <span className="block font-bold">איפה אוספים</span>
            <span className="text-[14px] text-ink-2">{settings.address}</span>
          </span>
        </a>
        {settings.phone && (
          <a href={`tel:${settings.phone.replace(/\D/g, "")}`} className="flex items-center gap-3 rounded-[6px] border border-line bg-surface px-4 py-3 hover:border-ink-3">
            <Phone className="size-5 shrink-0 text-gold-ink" aria-hidden />
            <span>
              <span className="block font-bold">שינוי או ביטול</span>
              <span className="ltr text-[14px] text-ink-2">{settings.phone}</span>
            </span>
          </a>
        )}
      </section>

      <div className="mt-10 flex flex-col items-center gap-2 text-center">
        <Flourish className="text-gold" />
        <p className="font-display text-xl font-bold">שבת שלום!</p>
        <Link href="/menu" className={buttonClass("outline", "md", "mt-3")}>
          חזרה לתפריט
        </Link>
      </div>
    </div>
  );
}
