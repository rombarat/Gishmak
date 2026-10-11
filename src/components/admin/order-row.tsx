import Link from "next/link";
import { MessageSquareText, Phone, UserRound } from "lucide-react";
import type { Order, OrderItem } from "@prisma/client";
import { formatPrice } from "@/lib/money";
import { formatDateTime, formatWindow, relativeDay } from "@/lib/time";
import { cn } from "@/lib/utils";
import { itemCount, itemLine } from "./format";
import { OrderStatusControls } from "./order-status-controls";

export type OrderWithItems = Order & { items: OrderItem[] };

/**
 * One order in a list. Desktop: dense row; mobile: stacked card.
 * The whole row opens the detail page (stretched link); controls sit above it.
 */
export function OrderRow({ order, today, showPickup = true }: { order: OrderWithItems; today: string; showPickup?: boolean }) {
  const muted = order.status === "PICKED_UP" || order.status === "CANCELLED";
  return (
    <li
      className={cn(
        "relative grid gap-x-4 gap-y-2 px-4 py-3.5 transition-colors hover:bg-surface-2/60",
        "md:grid-cols-[5.5rem_minmax(9rem,1fr)_minmax(11rem,2fr)_5rem_auto] md:items-center",
        muted && "opacity-75",
        order.status === "NEW" && "border-s-[3px] border-s-amber",
      )}
    >
      {/* number + created */}
      <div className="flex items-baseline gap-2 md:flex-col md:gap-0.5">
        <Link
          href={`/admin/orders/${order.id}`}
          className="num font-display text-lg font-bold text-ink after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-3 focus-visible:after:outline-gold"
        >
          <span className="ltr">#{order.orderNumber}</span>
          <span className="sr-only"> — {order.customerName}</span>
        </Link>
        <span className="num text-[12px] text-ink-3" title="מועד ההזמנה">
          הוזמן {formatDateTime(order.createdAt)}
        </span>
      </div>

      {/* customer */}
      <div className="min-w-0">
        <p className="truncate text-[16px] font-bold text-ink">{order.customerName}</p>
        <div className="flex flex-wrap items-center gap-x-3 text-[14px] text-ink-2">
          <a href={`tel:${order.customerPhone}`} className="relative z-10 inline-flex min-h-8 items-center gap-1 hover:text-ink hover:underline">
            <Phone className="size-3.5" aria-hidden />
            <span className="ltr num">{order.customerPhone}</span>
          </a>
          {order.recipientName && (
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-3.5" aria-hidden />
              אוסף/ת: {order.recipientName}
            </span>
          )}
        </div>
        {showPickup && (
          <p className="num mt-0.5 text-[13px] font-semibold text-gold-ink">
            {relativeDay(order.pickupDate, today)} · {formatWindow(order.pickupStart, order.pickupEnd)}
          </p>
        )}
      </div>

      {/* items + notes */}
      <div className="min-w-0 text-[14px] leading-snug text-ink-2">
        <p className="line-clamp-2">
          <span className="font-bold text-ink">{itemCount(order.items)} פריטים: </span>
          {order.items.map(itemLine).join(" · ")}
        </p>
        {order.notes && (
          <p className="mt-1 flex items-start gap-1.5 rounded-[4px] bg-amber-soft/70 px-2 py-1 text-[13px] font-semibold text-amber">
            <MessageSquareText className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className="line-clamp-1">
              <span className="sr-only">הערת לקוח: </span>
              {order.notes}
            </span>
          </p>
        )}
      </div>

      {/* total */}
      <p className="num text-[16px] font-extrabold text-ink md:text-end">{formatPrice(order.totalAgorot)}</p>

      {/* status */}
      <div className="relative z-10">
        <OrderStatusControls orderId={order.id} orderNumber={order.orderNumber} status={order.status} className="flex-wrap md:flex-nowrap md:justify-end" />
      </div>
    </li>
  );
}
