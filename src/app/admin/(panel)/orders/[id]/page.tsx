import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Ban, CalendarClock, Check, MessageCircle, MessageSquareText, Pencil, Phone, StickyNote, UserRound } from "lucide-react";
import { getOrderForAdmin } from "@/server/orders";
import { listAllWindows, listOrderableVariants } from "@/server/admin-catalog";
import { PAYMENT_STATUS_LABEL, STATUS_LABEL, isOrderStatus, type OrderStatus } from "@/domain/order-status";
import { formatPrice } from "@/lib/money";
import { formatDateTime, formatDayLong, formatWindow, relativeDay, todayIL } from "@/lib/time";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/admin/page-header";
import { OrderStatusControls } from "@/components/admin/order-status-controls";
import { OrderEditSection } from "@/components/admin/order-editor";
import { OrderNoteForm } from "@/components/admin/order-note-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { itemCount, waNumber } from "@/components/admin/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const order = await getOrderForAdmin((await params).id);
  return { title: order ? `הזמנה #${order.orderNumber}` : "הזמנה לא נמצאה" };
}

const STEPS: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING", "READY", "PICKED_UP"];
const EVENT_ICON = { CREATED: Check, STATUS_CHANGED: Check, EDITED: Pencil, NOTE: StickyNote, PAYMENT: Check } as const;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, windows, variants] = await Promise.all([getOrderForAdmin(id), listAllWindows(), listOrderableVariants()]);
  if (!order) notFound();

  const today = todayIL();
  const status: OrderStatus = isOrderStatus(order.status) ? order.status : "NEW";
  const cancelled = status === "CANCELLED";
  const stepIdx = STEPS.indexOf(status);
  const reachedAt = (s: OrderStatus) => order.events.find((e) => e.toStatus === s)?.createdAt;

  return (
    <article>
      <Link href="/admin/orders" className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-ink-2 hover:text-ink print:hidden">
        <ArrowRight className="size-4" aria-hidden />
        כל ההזמנות
      </Link>

      {/* ------------------------------------------------ header + status */}
      <header className="mb-5 rounded-[6px] bg-night p-4 text-on-night md:p-6 print:bg-white print:p-0 print:text-ink">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-on-night-2 print:text-ink-2">
              הוזמן <span className="num">{formatDateTime(order.createdAt)}</span>
              {order.source !== "ONLINE" && ` · ${order.source === "PHONE" ? "בטלפון" : "בחנות"}`}
            </p>
            <h1 className="mt-1 font-display text-[32px] font-bold leading-tight text-gold-bright print:text-ink">
              הזמנה <span className="ltr num">#{order.orderNumber}</span>
            </h1>
            <p className="num mt-1 text-lg font-bold">
              {["היום", "מחר"].includes(relativeDay(order.pickupDate, today)) && `${relativeDay(order.pickupDate, today)} · `}
              {formatDayLong(order.pickupDate)} · {formatWindow(order.pickupStart, order.pickupEnd)}
            </p>
          </div>
          <div className="print:hidden">
            <OrderStatusControls orderId={order.id} orderNumber={order.orderNumber} status={order.status} layout="large" className="[&_select]:bg-surface" />
          </div>
          <div className="hidden print:block">
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* status stepper */}
        {cancelled ? (
          <p className="mt-4 flex items-center gap-2 rounded-[6px] bg-tomato px-3 py-2 font-bold text-white">
            <Ban className="size-4" aria-hidden />
            ההזמנה בוטלה{reachedAt("CANCELLED") ? ` ב-${formatDateTime(reachedAt("CANCELLED")!)}` : ""}
          </p>
        ) : (
          <ol className="mt-5 grid grid-cols-5 gap-1.5 print:hidden" aria-label="שלבי ההזמנה">
            {STEPS.map((s, i) => {
              const done = i <= stepIdx;
              const at = reachedAt(s);
              return (
                <li key={s} aria-current={i === stepIdx ? "step" : undefined} className="min-w-0">
                  <span className={cn("block h-1.5 rounded-full", done ? "bg-gold-bright" : "bg-night-3")} aria-hidden />
                  <span className={cn("mt-1.5 block truncate text-[12px] font-bold sm:text-[13px]", done ? "text-on-night" : "text-on-night-2/70")}>
                    {done && <span className="sr-only">הושלם: </span>}
                    {STATUS_LABEL[s]}
                  </span>
                  {at && done && <span className="num hidden text-[11px] text-on-night-2 sm:block">{formatDateTime(at)}</span>}
                </li>
              );
            })}
          </ol>
        )}
      </header>

      {order.notes && (
        <div className="mb-5 flex gap-3 rounded-[6px] border-2 border-amber/40 bg-amber-soft px-4 py-3 text-amber print:border-ink">
          <MessageSquareText className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-bold">הערת הלקוח</p>
            <p className="text-[17px] font-semibold leading-snug text-ink">{order.notes}</p>
          </div>
        </div>
      )}

      <OrderEditSection
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          recipientName: order.recipientName,
          notes: order.notes,
          pickupDate: order.pickupDate,
          pickupWindowId: order.pickupWindowId,
          discountAgorot: order.discountAgorot,
          items: order.items.map((i) => ({ id: i.id, productName: i.productName, variantLabel: i.variantLabel, unitPriceAgorot: i.unitPriceAgorot, quantity: i.quantity })),
        }}
        windows={windows.map((w) => ({ id: w.id, weekday: w.weekday, startTime: w.startTime, endTime: w.endTime, isActive: w.isActive }))}
        variants={variants}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* ------------------------------------------------ items */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="font-display text-xl font-bold">פריטים</h2>
              <span className="num text-sm text-ink-2">{itemCount(order.items)} יחידות</span>
            </div>
            <table className="w-full text-[15px]">
              <thead className="sr-only md:not-sr-only">
                <tr className="border-b border-line text-start text-[13px] text-ink-3">
                  <th scope="col" className="px-4 py-2 text-start font-semibold">מוצר</th>
                  <th scope="col" className="px-2 py-2 text-center font-semibold">כמות</th>
                  <th scope="col" className="hidden px-2 py-2 text-end font-semibold sm:table-cell">מחיר ליחידה</th>
                  <th scope="col" className="px-4 py-2 text-end font-semibold">סה״כ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold">{i.productName}</p>
                      <p className="text-sm text-ink-2">{i.variantLabel}</p>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="num inline-grid min-w-9 place-items-center rounded-[6px] bg-surface-2 px-2 py-1 text-lg font-extrabold">×{i.quantity}</span>
                    </td>
                    <td className="num hidden px-2 py-3 text-end text-ink-2 sm:table-cell">{formatPrice(i.unitPriceAgorot)}</td>
                    <td className="num px-4 py-3 text-end font-bold">{formatPrice(i.lineTotalAgorot)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-line">
                {order.discountAgorot > 0 && (
                  <>
                    <tr>
                      <td colSpan={2} className="px-4 pt-3 text-ink-2">סכום ביניים</td>
                      <td className="hidden sm:table-cell" />
                      <td className="num px-4 pt-3 text-end">{formatPrice(order.subtotalAgorot)}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-4 text-ink-2">הנחה</td>
                      <td className="hidden sm:table-cell" />
                      <td className="num px-4 text-end">−{formatPrice(order.discountAgorot)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-lg font-bold">סה״כ לתשלום</td>
                  <td className="hidden sm:table-cell" />
                  <td className="num px-4 py-3 text-end text-xl font-extrabold">{formatPrice(order.totalAgorot)}</td>
                </tr>
              </tfoot>
            </table>
          </Card>

          {/* ------------------------------------------------ side */}
          <div className="flex flex-col gap-5">
            <Card className="p-4">
              <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-ink-2">
                <UserRound className="size-4" aria-hidden />
                לקוח
              </h2>
              <p className="text-lg font-bold">{order.customerName}</p>
              <p className="num ltr text-[17px] text-ink-2">{order.customerPhone}</p>
              {order.recipientName && (
                <p className="mt-2 rounded-[6px] bg-sky-soft px-2.5 py-1.5 text-[15px] font-semibold text-sky">אוסף/ת: {order.recipientName}</p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 print:hidden">
                <a href={`tel:${order.customerPhone}`} className={buttonClass("dark", "md")}>
                  <Phone className="size-4" aria-hidden />
                  חיוג
                </a>
                <a href={`https://wa.me/${waNumber(order.customerPhone)}`} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "md")}>
                  <MessageCircle className="size-4" aria-hidden />
                  וואטסאפ
                </a>
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-ink-2">
                <CalendarClock className="size-4" aria-hidden />
                איסוף ותשלום
              </h2>
              <p className="num text-lg font-bold">{formatDayLong(order.pickupDate)}</p>
              <p className="num text-[17px]">{formatWindow(order.pickupStart, order.pickupEnd)}</p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[15px]">
                <dt className="text-ink-2">תשלום</dt>
                <dd className="font-semibold">{order.paymentMethod === "PAY_AT_PICKUP" ? "תשלום באיסוף" : "תשלום באתר"}</dd>
                <dt className="text-ink-2">מצב</dt>
                <dd className={cn("font-semibold", order.paymentStatus === "PAID" && "text-leaf", order.paymentStatus === "FAILED" && "text-tomato")}>
                  {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                </dd>
              </dl>
            </Card>
          </div>
        </div>
      </OrderEditSection>

      {/* ------------------------------------------------ history */}
      <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] print:hidden">
        <div>
          <SectionTitle>היסטוריה</SectionTitle>
          <ol className="relative flex flex-col gap-3 border-s-2 border-line ps-5">
            {order.events.map((e) => {
              const Icon = EVENT_ICON[e.type as keyof typeof EVENT_ICON] ?? Check;
              const label =
                e.type === "CREATED"
                  ? "ההזמנה התקבלה"
                  : e.type === "STATUS_CHANGED" && isOrderStatus(e.toStatus)
                    ? `הסטטוס שונה ל"${STATUS_LABEL[e.toStatus]}"`
                    : e.type === "EDITED"
                      ? "ההזמנה נערכה"
                      : e.type === "NOTE"
                        ? "הערה פנימית"
                        : e.type;
              return (
                <li key={e.id} className="relative">
                  <span
                    className={cn(
                      "absolute -start-[1.95rem] top-0.5 grid size-6 place-items-center rounded-full ring-4 ring-paper",
                      e.type === "NOTE" ? "bg-amber-soft text-amber" : e.toStatus === "CANCELLED" ? "bg-tomato-soft text-tomato" : "bg-gold-soft text-gold-ink",
                    )}
                    aria-hidden
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <p className="text-[15px] font-bold">
                    {label}
                    <span className="num ms-2 text-[13px] font-normal text-ink-3">
                      {formatDateTime(e.createdAt)} · {e.actor?.name ?? (e.type === "CREATED" ? "הלקוח באתר" : "מערכת")}
                    </span>
                  </p>
                  {e.message && e.type !== "CREATED" && e.type !== "STATUS_CHANGED" && (
                    <p className={cn("mt-0.5 text-[15px] text-ink-2", e.type === "NOTE" && "rounded-[6px] bg-surface px-3 py-2 text-ink")}>{e.message}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        <Card className="self-start p-4">
          <OrderNoteForm orderId={order.id} />
        </Card>
      </section>
    </article>
  );
}
